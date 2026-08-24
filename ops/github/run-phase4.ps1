param(
    [string] $Repository,
    [switch] $Reset,
    [switch] $ConfirmReset
)

$arguments = @{}
if ($Repository) {
    $arguments.Repository = $Repository
}
$arguments.Reset = $Reset
$arguments.ConfirmReset = $ConfirmReset

& (Join-Path $PSScriptRoot "seed-labels.ps1") @arguments
& (Join-Path $PSScriptRoot "seed-issues.ps1") @arguments
& (Join-Path $PSScriptRoot "seed-discussions.ps1") @arguments
& (Join-Path $PSScriptRoot "configure-project.ps1") @arguments

$readOnlyArguments = @{}
if ($Repository) {
    $readOnlyArguments.Repository = $Repository
}
& (Join-Path $PSScriptRoot "publish-wiki.ps1") @readOnlyArguments
& (Join-Path $PSScriptRoot "export-demo-snapshot.ps1") @readOnlyArguments
