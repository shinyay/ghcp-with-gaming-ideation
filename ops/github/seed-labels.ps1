param(
    [string] $Repository,
    [switch] $Reset,
    [switch] $ConfirmReset
)

. (Join-Path $PSScriptRoot "lib\github.ps1")
Assert-ResetAuthorized -Reset:$Reset -ConfirmReset:$ConfirmReset
$manifest = Get-SurfacesManifest -ScriptRoot $PSScriptRoot
if (-not $Repository) {
    $Repository = $manifest.repository
}

Invoke-Gh -Arguments @("auth", "status") -AsText | Out-Null
$labels = @(Get-GhRestCollection -Endpoint "repos/$Repository/labels?per_page=100")
$labelActions = @{ create = 0; preserve = 0; reset = 0 }

foreach ($label in $manifest.labels) {
    $matches = @($labels | Where-Object { $_.name -eq $label.name })
    if ($matches.Count -gt 1) {
        throw "Expected at most one label '$($label.name)'; found $($matches.Count)."
    }
    $existing = if ($matches.Count -eq 1) { $matches[0] } else { $null }
    $action = Get-ReconciliationAction -Existing $existing -Reset:$Reset
    $labelActions[$action]++

    if ($action -eq "create") {
        Invoke-Gh -Arguments @(
            "label", "create", $label.name,
            "--repo", $Repository,
            "--color", $label.color,
            "--description", $label.description
        ) -AsText | Out-Null
    }
    elseif ($action -eq "reset") {
        Invoke-Gh -Arguments @(
            "label", "create", $label.name,
            "--repo", $Repository,
            "--color", $label.color,
            "--description", $label.description,
            "--force"
        ) -AsText | Out-Null
    }
}

$milestones = @(Get-GhRestCollection -Endpoint "repos/$Repository/milestones?state=all&per_page=100")
$milestoneActions = @{ create = 0; preserve = 0; reset = 0 }
foreach ($desired in $manifest.milestones) {
    $matches = @($milestones | Where-Object { $_.title -eq $desired.title })
    if ($matches.Count -gt 1) {
        throw "Expected at most one milestone '$($desired.title)'; found $($matches.Count)."
    }
    $existing = if ($matches.Count -eq 1) { $matches[0] } else { $null }
    $action = Get-ReconciliationAction -Existing $existing -Reset:$Reset
    $milestoneActions[$action]++
    $payload = @{
        title = $desired.title
        description = $desired.description
        state = $desired.state
    }

    if ($action -eq "create") {
        $created = Invoke-Gh -Arguments @("api", "--method", "POST", "repos/$Repository/milestones", "--input", "-") -InputObject $payload
        $milestones += $created
    }
    elseif ($action -eq "reset") {
        Invoke-Gh -Arguments @("api", "--method", "PATCH", "repos/$Repository/milestones/$($existing.number)", "--input", "-") -InputObject $payload | Out-Null
    }
}

[pscustomobject]@{
    repository = $Repository
    reset = [bool]$Reset
    labels = $labelActions
    milestones = $milestoneActions
} | ConvertTo-Json -Depth 5
