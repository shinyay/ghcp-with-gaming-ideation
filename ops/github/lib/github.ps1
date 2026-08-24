Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-Gh {
    param(
        [Parameter(Mandatory)]
        [string[]] $Arguments,
        [AllowNull()]
        [object] $InputObject,
        [switch] $AsText
    )

    if ($PSBoundParameters.ContainsKey("InputObject")) {
        $inputJson = $InputObject | ConvertTo-Json -Depth 100 -Compress
        $raw = $inputJson | & gh @Arguments 2>&1
    }
    else {
        $raw = & gh @Arguments 2>&1
    }

    if ($LASTEXITCODE -ne 0) {
        throw "gh $($Arguments -join ' ') failed: $([string]::Join([Environment]::NewLine, @($raw)))"
    }

    $text = [string]::Join([Environment]::NewLine, @($raw)).Trim()
    if ($AsText) {
        return $text
    }
    if ([string]::IsNullOrWhiteSpace($text)) {
        return $null
    }
    return $text | ConvertFrom-Json -Depth 100
}

function Invoke-GhGraphQl {
    param(
        [Parameter(Mandatory)]
        [string] $Query,
        [hashtable] $Variables = @{}
    )

    $payload = @{
        query = $Query
        variables = $Variables
    }
    return Invoke-Gh -Arguments @("api", "graphql", "--input", "-") -InputObject $payload
}

function Get-GhRestCollection {
    param(
        [Parameter(Mandatory)]
        [string] $Endpoint,
        [scriptblock] $Invoker
    )

    if (-not $Invoker) {
        $Invoker = {
            param([string[]] $Arguments)
            Invoke-Gh -Arguments $Arguments
        }
    }

    $response = & $Invoker @("api", "--paginate", "--slurp", $Endpoint)
    $items = [System.Collections.Generic.List[object]]::new()
    foreach ($page in @($response)) {
        if ($page -is [System.Collections.IEnumerable] -and
            $page -isnot [string] -and
            $page -isnot [System.Collections.IDictionary] -and
            $page -isnot [pscustomobject]) {
            foreach ($item in $page) {
                $items.Add($item)
            }
        }
        else {
            $items.Add($page)
        }
    }
    return $items.ToArray()
}

function Get-GhGraphQlConnectionNodes {
    param(
        [Parameter(Mandatory)]
        [string] $Query,
        [Parameter(Mandatory)]
        [hashtable] $Variables,
        [Parameter(Mandatory)]
        [string] $ConnectionPath,
        [scriptblock] $Invoker
    )

    if (-not $Invoker) {
        $Invoker = {
            param([string] $QueryText, [hashtable] $PageVariables)
            Invoke-GhGraphQl -Query $QueryText -Variables $PageVariables
        }
    }

    $nodes = [System.Collections.Generic.List[object]]::new()
    $cursor = $null
    do {
        $pageVariables = @{}
        foreach ($entry in $Variables.GetEnumerator()) {
            $pageVariables[$entry.Key] = $entry.Value
        }
        $pageVariables.cursor = $cursor
        $result = & $Invoker $Query $pageVariables
        $connection = $result.data
        foreach ($segment in $ConnectionPath.Split(".")) {
            $connection = $connection.$segment
        }
        if (-not $connection) {
            throw "GraphQL connection '$ConnectionPath' was not returned."
        }
        foreach ($node in @($connection.nodes)) {
            $nodes.Add($node)
        }
        $hasNextPage = [bool]$connection.pageInfo.hasNextPage
        $cursor = $connection.pageInfo.endCursor
        if ($hasNextPage -and [string]::IsNullOrWhiteSpace([string]$cursor)) {
            throw "GraphQL connection '$ConnectionPath' has a next page without an end cursor."
        }
    } while ($hasNextPage)

    return $nodes.ToArray()
}

function Assert-ResetAuthorized {
    param(
        [switch] $Reset,
        [switch] $ConfirmReset
    )

    if ($Reset -and -not $ConfirmReset) {
        throw "Reset is destructive. Pass both -Reset and -ConfirmReset."
    }
    if ($ConfirmReset -and -not $Reset) {
        throw "-ConfirmReset is valid only with -Reset."
    }
}

function Get-ReconciliationAction {
    param(
        [AllowNull()]
        [object] $Existing,
        [switch] $Reset
    )

    if ($null -eq $Existing) {
        return "create"
    }
    if ($Reset) {
        return "reset"
    }
    return "preserve"
}

function Get-UniqueNamedObject {
    param(
        [Parameter(Mandatory)]
        [object[]] $Items,
        [Parameter(Mandatory)]
        [string] $Name,
        [string] $Kind = "object"
    )

    $matches = @($Items | Where-Object { $_.name -eq $Name })
    if ($matches.Count -gt 1) {
        $ids = $matches | ForEach-Object { $_.id }
        throw "Expected at most one $Kind named '$Name'; found $($matches.Count): $($ids -join ', ')."
    }
    if ($matches.Count -eq 0) {
        return $null
    }
    return $matches[0]
}

function Get-SurfacesManifest {
    param([Parameter(Mandatory)][string] $ScriptRoot)
    $path = Join-Path $ScriptRoot "surfaces.json"
    return Get-Content -LiteralPath $path -Raw -Encoding utf8 | ConvertFrom-Json -Depth 100
}

function Get-ObjectSnapshot {
    param([Parameter(Mandatory)][string] $ScriptRoot)
    $path = Join-Path $ScriptRoot "..\..\demo\offline-snapshots\github-objects.json"
    if (-not (Test-Path -LiteralPath $path)) {
        return $null
    }
    return Get-Content -LiteralPath $path -Raw -Encoding utf8 | ConvertFrom-Json -Depth 100
}

function Get-RepositoryParts {
    param([Parameter(Mandatory)][string] $Repository)
    $parts = $Repository.Split("/", 2)
    if ($parts.Count -ne 2) {
        throw "Repository must be owner/name: $Repository"
    }
    return @{ Owner = $parts[0]; Name = $parts[1] }
}

function Get-SeedIssueBody {
    param([Parameter(Mandatory)][object] $Issue)

    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.Add("<!-- stable-id: $($Issue.stable_id) -->")
    $lines.Add("")
    $lines.Add("## Open question / 未解決の問い")
    $lines.Add("")
    $lines.Add([string]$Issue.question_ja)
    $lines.Add("")
    $lines.Add("> English summary: $($Issue.summary_en)")
    $lines.Add("")
    $lines.Add("## Evidence")
    $lines.Add("")
    foreach ($reference in $Issue.evidence) {
        $lines.Add("- ``$($reference.asset_id)`` — ``$($reference.locator)``")
    }
    $lines.Add("")
    $lines.Add("## Acceptance criteria")
    $lines.Add("")
    foreach ($criterion in $Issue.acceptance) {
        $lines.Add("- [ ] $criterion")
    }
    $lines.Add("")
    $lines.Add("## Boundary")
    $lines.Add("")
    $lines.Add("Evidence、Inference、Proposalを分離し、Conflictを自動解消しません。これは未解決の作業項目であり、最終Finding、Play DNA、Design Bet、ADR、answer keyを複製しません。")
    return $lines -join [Environment]::NewLine
}

function Get-SeedDiscussionBody {
    param([Parameter(Mandatory)][object] $Discussion)

    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.Add("<!-- stable-id: $($Discussion.stable_id) -->")
    $lines.Add("")
    $lines.Add("## Open dialogue / 未解決の対話")
    $lines.Add("")
    $lines.Add([string]$Discussion.question_ja)
    $lines.Add("")
    $lines.Add("> English summary: $($Discussion.summary_en)")
    $lines.Add("")
    $lines.Add("## Related stable IDs")
    $lines.Add("")
    foreach ($id in $Discussion.links) {
        $lines.Add("- ``$id``")
    }
    $lines.Add("")
    $lines.Add("## Boundary")
    $lines.Add("")
    $lines.Add("このDiscussionは対話の場です。最終判断はrepositoryのADRへ移し、架空のcomment、reaction、vote、participantを作成しません。")
    return $lines -join [Environment]::NewLine
}

function Get-OptionColor {
    param([Parameter(Mandatory)][int] $Index)
    $colors = @("BLUE", "GREEN", "YELLOW", "ORANGE", "RED", "PURPLE", "PINK", "GRAY")
    return $colors[$Index % $colors.Count]
}
