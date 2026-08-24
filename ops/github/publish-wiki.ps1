param(
    [string] $Repository
)

. (Join-Path $PSScriptRoot "lib\github.ps1")
. (Join-Path $PSScriptRoot "lib\wiki.ps1")
$manifest = Get-SurfacesManifest -ScriptRoot $PSScriptRoot
if (-not $Repository) {
    $Repository = $manifest.repository
}

$sourceDirectory = Join-Path $PSScriptRoot "wiki"
$statePath = Join-Path $PSScriptRoot "wiki-publish-state.json"
$remote = "https://github.com/$Repository.wiki.git"
$wikiUrl = "https://github.com/$Repository/wiki"
$expectedFiles = @($manifest.wiki.pages.file) + "_Sidebar.md"
Assert-WikiTree -Directory $sourceDirectory -ExpectedFiles $expectedFiles

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
        hash_projection = "utf8-lf-sha256-v1"
        source_hashes = @(Get-WikiHashMap -Directory $sourceDirectory)
        remote_hashes = $remoteHashList
        attempts = @("enable_wiki", "clone", "local_init_if_needed", "replace_complete_tree", "push", "fresh_clone_tree_and_hash_verification")
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
    $cloneOutput = & git -c core.autocrlf=false clone --quiet $remote $work 2>&1
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
    & git -C $work config core.autocrlf false
    & git -C $work config core.eol lf

    Copy-WikiTree -Source $sourceDirectory -Destination $work
    Assert-WikiTree -Directory $work -ExpectedFiles $expectedFiles
    & git -C $work add --all -- .
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

    $verifyOutput = & git -c core.autocrlf=false clone --quiet $remote $verify 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "wiki_verification_clone_failed"
    }
    & git -C $verify config core.autocrlf false
    & git -C $verify config core.eol lf
    Assert-WikiTree -Directory $verify -ExpectedFiles $expectedFiles
    $sourceHashes = @(Get-WikiHashMap -Directory $sourceDirectory)
    $remoteHashes = @(Get-WikiHashMap -Directory $verify)
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
