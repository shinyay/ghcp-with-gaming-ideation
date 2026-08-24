param(
    [string] $Repository
)

. (Join-Path $PSScriptRoot "lib\github.ps1")
$manifest = Get-SurfacesManifest -ScriptRoot $PSScriptRoot
if (-not $Repository) {
    $Repository = $manifest.repository
}

$milestones = @(Invoke-Gh -Arguments @("api", "repos/$Repository/milestones?state=all&per_page=100"))
$milestoneByStableId = @{}
foreach ($desired in $manifest.milestones) {
    $live = $milestones | Where-Object { $_.title -eq $desired.title } | Select-Object -First 1
    if (-not $live) {
        throw "Missing milestone $($desired.title). Run seed-labels.ps1 first."
    }
    $milestoneByStableId[$desired.stable_id] = $live
}

$liveIssues = @(
    Invoke-Gh -Arguments @("api", "repos/$Repository/issues?state=all&per_page=100") |
        Where-Object { -not ($_.PSObject.Properties.Name -contains "pull_request") }
)
$resolved = @{}

foreach ($desired in $manifest.issues) {
    $existing = $null
    if ($desired.PSObject.Properties.Name -contains "existing_number") {
        $existing = $liveIssues | Where-Object { $_.number -eq $desired.existing_number } | Select-Object -First 1
    }
    if (-not $existing) {
        $marker = "stable-id: $($desired.stable_id)"
        $existing = $liveIssues | Where-Object { $_.body -and $_.body.Contains($marker) } | Select-Object -First 1
    }
    if (-not $existing) {
        $existing = $liveIssues | Where-Object { $_.title -eq $desired.title } | Select-Object -First 1
    }

    $payload = @{
        title = $desired.title
        body = Get-SeedIssueBody -Issue $desired
        labels = @($desired.labels)
        milestone = [int]$milestoneByStableId[$desired.milestone].number
        state = "open"
    }

    if ($existing) {
        $live = Invoke-Gh -Arguments @("api", "--method", "PATCH", "repos/$Repository/issues/$($existing.number)", "--input", "-") -InputObject $payload
    }
    else {
        $live = Invoke-Gh -Arguments @("api", "--method", "POST", "repos/$Repository/issues", "--input", "-") -InputObject $payload
        $liveIssues += $live
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
    $current = @(Invoke-Gh -Arguments @("api", "repos/$Repository/issues/$($parent.number)/sub_issues"))
    if (-not ($current | Where-Object { $_.number -eq $child.number })) {
        Invoke-GhGraphQl -Query $addSubIssue -Variables @{
            issueId = $parent.node_id
            subIssueId = $child.node_id
        } | Out-Null
    }
}

$manifest.issues | ForEach-Object {
    $live = $resolved[$_.stable_id]
    [pscustomobject]@{
        stable_id = $_.stable_id
        github_id = $live.node_id
        number = $live.number
        url = $live.html_url
    }
} | ConvertTo-Json -Depth 10
