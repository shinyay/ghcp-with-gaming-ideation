param(
    [string] $Repository,
    [switch] $Reset,
    [switch] $ConfirmReset
)

. (Join-Path $PSScriptRoot "lib\github.ps1")
Assert-ResetAuthorized -Reset:$Reset -ConfirmReset:$ConfirmReset
$manifest = Get-SurfacesManifest -ScriptRoot $PSScriptRoot
$snapshot = Get-ObjectSnapshot -ScriptRoot $PSScriptRoot
if (-not $Repository) {
    $Repository = $manifest.repository
}

$milestones = @(Get-GhRestCollection -Endpoint "repos/$Repository/milestones?state=all&per_page=100")
$milestoneByStableId = @{}
foreach ($desired in $manifest.milestones) {
    $snapshotMilestone = if ($snapshot) {
        $snapshot.milestones | Where-Object { $_.stable_id -eq $desired.stable_id } | Select-Object -First 1
    }
    else {
        $null
    }
    $matches = if ($snapshotMilestone) {
        @($milestones | Where-Object {
            $_.node_id -eq $snapshotMilestone.github_id -or $_.number -eq $snapshotMilestone.number
        })
    }
    else {
        @($milestones | Where-Object { $_.title -eq $desired.title })
    }
    if ($matches.Count -ne 1) {
        throw "Expected one milestone for $($desired.stable_id); found $($matches.Count). Run seed-labels.ps1 first."
    }
    $milestoneByStableId[$desired.stable_id] = $matches[0]
}

$liveIssues = @(
    Get-GhRestCollection -Endpoint "repos/$Repository/issues?state=all&per_page=100" |
        Where-Object { -not ($_.PSObject.Properties.Name -contains "pull_request") }
)
$resolved = @{}
$actions = @{ create = 0; preserve = 0; reset = 0 }

foreach ($desired in $manifest.issues) {
    $matches = @()
    $snapshotIssue = if ($snapshot) {
        $snapshot.issues | Where-Object { $_.stable_id -eq $desired.stable_id } | Select-Object -First 1
    }
    else {
        $null
    }
    if ($snapshotIssue) {
        $matches = @($liveIssues | Where-Object {
            $_.node_id -eq $snapshotIssue.github_id -or $_.number -eq $snapshotIssue.number
        })
    }
    elseif ($desired.PSObject.Properties.Name -contains "existing_number") {
        $matches = @($liveIssues | Where-Object { $_.number -eq $desired.existing_number })
    }
    if ($matches.Count -eq 0) {
        $marker = "stable-id: $($desired.stable_id)"
        $matches = @($liveIssues | Where-Object { $_.body -and $_.body.Contains($marker) })
    }
    if ($matches.Count -eq 0) {
        $matches = @($liveIssues | Where-Object { $_.title -eq $desired.title })
    }
    if ($matches.Count -gt 1) {
        throw "Expected at most one live issue for $($desired.stable_id); found $($matches.Count)."
    }

    $existing = if ($matches.Count -eq 1) { $matches[0] } else { $null }
    $action = Get-ReconciliationAction -Existing $existing -Reset:$Reset
    $actions[$action]++
    $payload = @{
        title = $desired.title
        body = Get-SeedIssueBody -Issue $desired
        labels = @($desired.labels)
        milestone = [int]$milestoneByStableId[$desired.milestone].number
        state = "open"
    }

    if ($action -eq "create") {
        $live = Invoke-Gh -Arguments @("api", "--method", "POST", "repos/$Repository/issues", "--input", "-") -InputObject $payload
        $liveIssues += $live
    }
    elseif ($action -eq "reset") {
        $live = Invoke-Gh -Arguments @("api", "--method", "PATCH", "repos/$Repository/issues/$($existing.number)", "--input", "-") -InputObject $payload
    }
    else {
        $live = $existing
    }
    $resolved[$desired.stable_id] = $live
}

$addSubIssue = @'
mutation($issueId: ID!, $subIssueId: ID!) {
  addSubIssue(input: { issueId: $issueId, subIssueId: $subIssueId }) {
    issue { id number url }
    subIssue { id number url }
  }
}
'@

foreach ($desired in $manifest.issues | Where-Object { $_.PSObject.Properties.Name -contains "parent" }) {
    $parent = $resolved[$desired.parent]
    $child = $resolved[$desired.stable_id]
    $current = @(Get-GhRestCollection -Endpoint "repos/$Repository/issues/$($parent.number)/sub_issues?per_page=100")
    if (-not ($current | Where-Object { $_.number -eq $child.number })) {
        Invoke-GhGraphQl -Query $addSubIssue -Variables @{
            issueId = $parent.node_id
            subIssueId = $child.node_id
        } | Out-Null
    }
}

[pscustomobject]@{
    repository = $Repository
    reset = [bool]$Reset
    actions = $actions
    issues = @(
        $manifest.issues | ForEach-Object {
            $live = $resolved[$_.stable_id]
            [pscustomobject]@{
                stable_id = $_.stable_id
                github_id = $live.node_id
                number = $live.number
                url = $live.html_url
            }
        }
    )
} | ConvertTo-Json -Depth 10
