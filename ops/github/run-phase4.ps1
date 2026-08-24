param(
    [string] $Repository
)

$arguments = @{}
if ($Repository) {
    $arguments.Repository = $Repository
}

& (Join-Path $PSScriptRoot "seed-labels.ps1") @arguments
& (Join-Path $PSScriptRoot "seed-issues.ps1") @arguments
& (Join-Path $PSScriptRoot "seed-discussions.ps1") @arguments
& (Join-Path $PSScriptRoot "configure-project.ps1") @arguments
& (Join-Path $PSScriptRoot "publish-wiki.ps1") @arguments
& (Join-Path $PSScriptRoot "export-demo-snapshot.ps1") @arguments
