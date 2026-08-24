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

function Get-SurfacesManifest {
    param([Parameter(Mandatory)][string] $ScriptRoot)
    $path = Join-Path $ScriptRoot "surfaces.json"
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
