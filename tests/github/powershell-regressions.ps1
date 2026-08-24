Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "..\..\ops\github\lib\github.ps1")
. (Join-Path $PSScriptRoot "..\..\ops\github\lib\wiki.ps1")

function Assert-Equal {
    param(
        [Parameter(Mandatory)] $Expected,
        [Parameter(Mandatory)] $Actual,
        [Parameter(Mandatory)][string] $Message
    )
    if ($Expected -ne $Actual) {
        throw "$Message Expected '$Expected', got '$Actual'."
    }
}

function Assert-Throws {
    param(
        [Parameter(Mandatory)][scriptblock] $Action,
        [Parameter(Mandatory)][string] $Message
    )
    try {
        & $Action
    }
    catch {
        return
    }
    throw $Message
}

$existing = [pscustomobject]@{ id = "existing" }
Assert-Equal "preserve" (Get-ReconciliationAction -Existing $existing) "Existing GitHub state must be preserved by default."
Assert-Equal "reset" (Get-ReconciliationAction -Existing $existing -Reset) "Explicit reset must select reset."
Assert-Equal "create" (Get-ReconciliationAction -Existing $null) "Missing GitHub state must be created."
Assert-Throws { Assert-ResetAuthorized -Reset } "Reset must require explicit confirmation."
Assert-Throws { Assert-ResetAuthorized -ConfirmReset } "Confirmation without reset must be rejected."
Assert-ResetAuthorized -Reset -ConfirmReset

$restPages = @(
    @(1..100 | ForEach-Object { [pscustomobject]@{ id = $_ } }),
    @(101..200 | ForEach-Object { [pscustomobject]@{ id = $_ } }),
    @(201..205 | ForEach-Object { [pscustomobject]@{ id = $_ } })
)
$restInvoker = {
    param([string[]] $Arguments)
    if ($Arguments -notcontains "--paginate" -or $Arguments -notcontains "--slurp") {
        throw "REST pagination flags are required."
    }
    return $restPages
}.GetNewClosure()
$restItems = @(Get-GhRestCollection -Endpoint "fixture?per_page=100" -Invoker $restInvoker)
Assert-Equal 205 $restItems.Count "REST pagination must retain every item beyond 100."
Assert-Equal 205 $restItems[-1].id "REST pagination must retain the final page."

$graphInvoker = {
    param([string] $Query, [hashtable] $Variables)
    $start = switch ([string]$Variables.cursor) {
        "" { 1 }
        "CURSOR-100" { 101 }
        "CURSOR-200" { 201 }
        default { throw "Unexpected cursor: $($Variables.cursor)" }
    }
    $end = [Math]::Min($start + 99, 205)
    $nodes = @($start..$end | ForEach-Object { [pscustomobject]@{ id = "NODE-$_" } })
    return [pscustomobject]@{
        data = [pscustomobject]@{
            repository = [pscustomobject]@{
                discussions = [pscustomobject]@{
                    nodes = $nodes
                    pageInfo = [pscustomobject]@{
                        hasNextPage = $end -lt 205
                        endCursor = if ($end -lt 205) { "CURSOR-$end" } else { $null }
                    }
                }
            }
        }
    }
}
$graphNodes = @(Get-GhGraphQlConnectionNodes -Query "fixture" -Variables @{} -ConnectionPath "repository.discussions" -Invoker $graphInvoker)
Assert-Equal 205 $graphNodes.Count "GraphQL pagination must retain every node beyond 100."
Assert-Equal "NODE-205" $graphNodes[-1].id "GraphQL pagination must retain the final page."

$views = @(
    [pscustomobject]@{ id = "VIEW-1"; name = "Creative Pipeline" },
    [pscustomobject]@{ id = "VIEW-2"; name = "Creative Pipeline" }
)
Assert-Throws {
    Get-UniqueNamedObject -Items $views -Name "Creative Pipeline" -Kind "Project view"
} "Duplicate Project view names must stop reconciliation."

$configureScript = Get-Content -LiteralPath (Join-Path $PSScriptRoot "..\..\ops\github\configure-project.ps1") -Raw
$viewLoopStart = $configureScript.IndexOf('foreach ($desiredView in $desiredProject.views)')
$createBranchStart = $configureScript.IndexOf('if ($action -eq "create")', $viewLoopStart)
$resetBranchStart = $configureScript.IndexOf('elseif ($action -eq "reset")', $createBranchStart)
if ($viewLoopStart -lt 0 -or $createBranchStart -lt 0 -or $resetBranchStart -lt 0) {
    throw "Project view create/reset branches were not found."
}
$createBranch = $configureScript.Substring($createBranchStart, $resetBranchStart - $createBranchStart)
$createMutationIndex = $createBranch.IndexOf('Invoke-GhGraphQl -Query $createView')
$refreshIndex = $createBranch.IndexOf('$state = Get-ProjectState')
$filterUpdateIndex = $createBranch.LastIndexOf('filter = $desiredView.filter')
if ($createMutationIndex -lt 0 -or
    $refreshIndex -le $createMutationIndex -or
    $filterUpdateIndex -le $refreshIndex) {
    throw "A created Project view must be refreshed and then assigned its desired filter."
}
if ($configureScript -notmatch 'Get-UniqueNamedObject.+Project view') {
    throw "Project view reconciliation must require a unique name."
}

$issueScript = Get-Content -LiteralPath (Join-Path $PSScriptRoot "..\..\ops\github\seed-issues.ps1") -Raw
$discussionScript = Get-Content -LiteralPath (Join-Path $PSScriptRoot "..\..\ops\github\seed-discussions.ps1") -Raw
if ($issueScript -notmatch 'Get-ReconciliationAction' -or $discussionScript -notmatch 'Get-ReconciliationAction') {
    throw "Seed scripts must use create/preserve/reset reconciliation."
}
if ($issueScript -notmatch '(?s)elseif \(\$action -eq "reset"\).*?--method", "PATCH"' -or
    $discussionScript -notmatch '(?s)elseif \(\$action -eq "reset"\).*?updateMutation') {
    throw "Existing Issue and Discussion content may be replaced only in an explicit reset branch."
}
if ($discussionScript -match 'removeUpvote|addUpvote') {
    throw "Discussion seeding must never mutate upvotes."
}
if ($configureScript -notmatch 'if \(-not \(\$Reset -or \$createdItem -or \$createdFieldNames\.Contains') {
    throw "Existing Project item values must be preserved outside explicit reset or new-field initialization."
}
if ($configureScript -notmatch '(?s)existing_number.*?\$fallbackMatches.*?stable-id:') {
    throw "Clean first runs must resolve adopted Issues by existing_number before marker fallback."
}
foreach ($script in @($issueScript, $discussionScript, $configureScript)) {
    if ($script -notmatch 'Get-Gh(RestCollection|GraphQlConnectionNodes)') {
        throw "Every collection-backed reconciliation script must use a pagination helper."
    }
}

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("star-relay-wiki-regression-" + [guid]::NewGuid().ToString("N"))
$source = Join-Path $tempRoot "source"
$destination = Join-Path $tempRoot "destination"
$lf = Join-Path $tempRoot "lf"
$crlf = Join-Path $tempRoot "crlf"
try {
    New-Item -ItemType Directory -Path (Join-Path $source "Guide"), (Join-Path $destination "rogue"), $lf, $crlf -Force | Out-Null
    [System.IO.File]::WriteAllText((Join-Path $source "Home.md"), "home`n", [System.Text.UTF8Encoding]::new($false))
    [System.IO.File]::WriteAllText((Join-Path $source "Guide\Page.md"), "nested`n", [System.Text.UTF8Encoding]::new($false))
    [System.IO.File]::WriteAllText((Join-Path $destination "rogue\secret.md"), "unmanaged`n", [System.Text.UTF8Encoding]::new($false))
    Assert-Throws {
        Assert-WikiTree -Directory $destination -ExpectedFiles @("Home.md", "Guide/Page.md")
    } "Nested unmanaged Wiki content must be rejected."

    Copy-WikiTree -Source $source -Destination $destination
    Assert-WikiTree -Directory $destination -ExpectedFiles @("Home.md", "Guide/Page.md")

    [System.IO.File]::WriteAllText((Join-Path $lf "Home.md"), "one`ntwo`n", [System.Text.UTF8Encoding]::new($false))
    [System.IO.File]::WriteAllText((Join-Path $crlf "Home.md"), "one`r`ntwo`r`n", [System.Text.UTF8Encoding]::new($false))
    $lfHash = (Get-WikiHashMap -Directory $lf)[0].sha256
    $crlfHash = (Get-WikiHashMap -Directory $crlf)[0].sha256
    Assert-Equal $lfHash $crlfHash "Wiki hashes must normalize CRLF to LF."
}
finally {
    if (Test-Path -LiteralPath $tempRoot) {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force
    }
}

Write-Output "PowerShell GitHub surface regressions passed."
