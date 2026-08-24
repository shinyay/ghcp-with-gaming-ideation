param(
    [string] $Repository
)

. (Join-Path $PSScriptRoot "lib\github.ps1")
$manifest = Get-SurfacesManifest -ScriptRoot $PSScriptRoot
if (-not $Repository) {
    $Repository = $manifest.repository
}

$sourceDirectory = Join-Path $PSScriptRoot "wiki"
$statePath = Join-Path $PSScriptRoot "wiki-publish-state.json"
$remote = "https://github.com/$Repository.wiki.git"
$wikiUrl = "https://github.com/$Repository/wiki"
$expectedFiles = @($manifest.wiki.pages.file) + "_Sidebar.md"
$actualFiles = @(Get-ChildItem -LiteralPath $sourceDirectory -File -Filter "*.md" | Select-Object -ExpandProperty Name | Sort-Object)

if ([string]::Join("|", @($expectedFiles | Sort-Object)) -ne [string]::Join("|", $actualFiles)) {
    throw "Wiki source files do not match surfaces.json."
}

function Get-HashMap {
    param([Parameter(Mandatory)][string] $Directory)
    return @(
        Get-ChildItem -LiteralPath $Directory -File -Filter "*.md" |
            Sort-Object Name |
            ForEach-Object {
                [pscustomobject]@{
                    file = $_.Name
                    sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
                }
            }
    )
}

function Save-State {
    param(
        [Parameter(Mandatory)][string] $Status,
        [AllowNull()][string] $Failure = $null,
        [AllowNull()][object[]] $RemoteHashes = $null
    )
    $remoteHashList = [object[]]@()
    if ($null -ne $RemoteHashes) {
        $remoteHashList = [object[]]@($RemoteHashes)
    }
    $state = [ordered]@{
        schema_version = 1
        stable_id = "WIKI-ROOT-001"
        status = $Status
        url = if ($Status -eq "published_verified") { $wikiUrl } else { $null }
        source = "ops/github/wiki"
        source_hashes = @(Get-HashMap -Directory $sourceDirectory)
        remote_hashes = $remoteHashList
        attempts = @("enable_wiki", "clone", "local_init_if_needed", "push", "fresh_clone_hash_verification")
        failure = $Failure
        fallback = if ($Status -eq "published_verified") { $null } else { "Open the repository Wiki UI, create Home once, then rerun ops/github/publish-wiki.ps1." }
    }
    $state | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $statePath -Encoding utf8
    return [pscustomobject]$state
}

Invoke-Gh -Arguments @("repo", "edit", $Repository, "--enable-wiki") -AsText | Out-Null

$work = Join-Path ([System.IO.Path]::GetTempPath()) ("star-relay-wiki-" + [guid]::NewGuid().ToString("N"))
$verify = Join-Path ([System.IO.Path]::GetTempPath()) ("star-relay-wiki-verify-" + [guid]::NewGuid().ToString("N"))
$initializedLocally = $false

try {
    $cloneOutput = & git clone --quiet $remote $work 2>&1
    if ($LASTEXITCODE -ne 0) {
        New-Item -ItemType Directory -Path $work -Force | Out-Null
        & git -C $work init --quiet --initial-branch=master
        if ($LASTEXITCODE -ne 0) {
            throw "local_git_init_failed"
        }
        & git -C $work remote add origin $remote
        if ($LASTEXITCODE -ne 0) {
            throw "local_remote_configuration_failed"
        }
        $initializedLocally = $true
    }

    Get-ChildItem -LiteralPath $work -File -Filter "*.md" | Remove-Item -Force
    Copy-Item -Path (Join-Path $sourceDirectory "*.md") -Destination $work -Force
    & git -C $work add -- "*.md"
    if ($LASTEXITCODE -ne 0) {
        throw "wiki_git_add_failed"
    }

    & git -C $work diff --cached --quiet
    if ($LASTEXITCODE -eq 1) {
        $viewer = Invoke-Gh -Arguments @("api", "user")
        $email = "$($viewer.id)+$($viewer.login)@users.noreply.github.com"
        & git -C $work -c "user.name=$($viewer.login)" -c "user.email=$email" commit --quiet -m "Publish output-only STAR RELAY Wiki"
        if ($LASTEXITCODE -ne 0) {
            throw "wiki_commit_failed"
        }
    }
    elseif ($LASTEXITCODE -ne 0) {
        throw "wiki_git_diff_failed"
    }

    $branch = (& git -C $work branch --show-current).Trim()
    if (-not $branch) {
        $branch = "master"
        & git -C $work checkout --quiet -B $branch
    }
    $pushOutput = & git -C $work push --quiet --set-upstream origin $branch 2>&1
    if ($LASTEXITCODE -ne 0) {
        $failure = if ($initializedLocally) {
            "github_wiki_first_page_initialization_requires_web_ui"
        }
        else {
            "wiki_git_push_failed"
        }
        Save-State -Status "fallback_required" -Failure $failure | ConvertTo-Json -Depth 10
        return
    }

    $verifyOutput = & git clone --quiet $remote $verify 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "wiki_verification_clone_failed"
    }
    $sourceHashes = Get-HashMap -Directory $sourceDirectory
    $remoteHashes = Get-HashMap -Directory $verify
    if (($sourceHashes | ConvertTo-Json -Depth 5 -Compress) -ne ($remoteHashes | ConvertTo-Json -Depth 5 -Compress)) {
        throw "wiki_source_hash_mismatch"
    }

    Save-State -Status "published_verified" -RemoteHashes $remoteHashes | ConvertTo-Json -Depth 10
}
finally {
    if (Test-Path -LiteralPath $work) {
        Remove-Item -LiteralPath $work -Recurse -Force
    }
    if (Test-Path -LiteralPath $verify) {
        Remove-Item -LiteralPath $verify -Recurse -Force
    }
}
