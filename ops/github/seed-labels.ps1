param(
    [string] $Repository
)

. (Join-Path $PSScriptRoot "lib\github.ps1")
$manifest = Get-SurfacesManifest -ScriptRoot $PSScriptRoot
if (-not $Repository) {
    $Repository = $manifest.repository
}

Invoke-Gh -Arguments @("auth", "status") -AsText | Out-Null

foreach ($label in $manifest.labels) {
    Invoke-Gh -Arguments @(
        "label", "create", $label.name,
        "--repo", $Repository,
        "--color", $label.color,
        "--description", $label.description,
        "--force"
    ) -AsText | Out-Null
}

$milestones = @(Invoke-Gh -Arguments @("api", "repos/$Repository/milestones?state=all&per_page=100"))
foreach ($desired in $manifest.milestones) {
    $existing = $milestones | Where-Object { $_.title -eq $desired.title } | Select-Object -First 1
    $payload = @{
        title = $desired.title
        description = $desired.description
        state = $desired.state
    }
    if ($existing) {
        Invoke-Gh -Arguments @("api", "--method", "PATCH", "repos/$Repository/milestones/$($existing.number)", "--input", "-") -InputObject $payload | Out-Null
    }
    else {
        $created = Invoke-Gh -Arguments @("api", "--method", "POST", "repos/$Repository/milestones", "--input", "-") -InputObject $payload
        $milestones += $created
    }
}

[pscustomobject]@{
    repository = $Repository
    labels = $manifest.labels.Count
    milestones = $manifest.milestones.Count
} | ConvertTo-Json
