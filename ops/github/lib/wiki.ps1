Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function ConvertTo-NormalizedWikiText {
    param([Parameter(Mandatory)][string] $Text)
    return $Text.Replace("`r`n", "`n").Replace("`r", "`n")
}

function Get-WikiRelativeFiles {
    param([Parameter(Mandatory)][string] $Directory)

    $root = [System.IO.Path]::GetFullPath($Directory)
    return @(
        Get-ChildItem -LiteralPath $root -Recurse -File -Force |
            ForEach-Object {
                [System.IO.Path]::GetRelativePath($root, $_.FullName).Replace("\", "/")
            } |
            Where-Object { $_ -ne ".git" -and -not $_.StartsWith(".git/") } |
            Sort-Object
    )
}

function Assert-WikiTree {
    param(
        [Parameter(Mandatory)][string] $Directory,
        [Parameter(Mandatory)][string[]] $ExpectedFiles
    )

    $actual = @(Get-WikiRelativeFiles -Directory $Directory)
    $expected = @($ExpectedFiles | Sort-Object)
    if ([string]::Join("|", $expected) -ne [string]::Join("|", $actual)) {
        $unmanaged = @($actual | Where-Object { $expected -notcontains $_ })
        $missing = @($expected | Where-Object { $actual -notcontains $_ })
        throw "Wiki tree mismatch. Unmanaged: [$($unmanaged -join ', ')]. Missing: [$($missing -join ', ')]."
    }
}

function Get-WikiHashMap {
    param([Parameter(Mandatory)][string] $Directory)

    $root = [System.IO.Path]::GetFullPath($Directory)
    return @(
        Get-WikiRelativeFiles -Directory $root |
            ForEach-Object {
                $path = Join-Path $root $_
                $text = ConvertTo-NormalizedWikiText -Text ([System.IO.File]::ReadAllText($path))
                $bytes = [System.Text.UTF8Encoding]::new($false).GetBytes($text)
                $hash = [System.Security.Cryptography.SHA256]::HashData($bytes)
                [pscustomobject]@{
                    file = $_
                    sha256 = [Convert]::ToHexString($hash).ToLowerInvariant()
                }
            }
    )
}

function Copy-WikiTree {
    param(
        [Parameter(Mandatory)][string] $Source,
        [Parameter(Mandatory)][string] $Destination
    )

    $destinationRoot = [System.IO.Path]::GetFullPath($Destination)
    foreach ($relativePath in @(Get-WikiRelativeFiles -Directory $destinationRoot)) {
        Remove-Item -LiteralPath (Join-Path $destinationRoot $relativePath) -Force
    }
    Get-ChildItem -LiteralPath $destinationRoot -Recurse -Directory -Force |
        Where-Object { $_.Name -ne ".git" -and -not $_.FullName.Contains("$([System.IO.Path]::DirectorySeparatorChar).git$([System.IO.Path]::DirectorySeparatorChar)") } |
        Sort-Object { $_.FullName.Length } -Descending |
        ForEach-Object {
            if (-not (Get-ChildItem -LiteralPath $_.FullName -Force)) {
                Remove-Item -LiteralPath $_.FullName -Force
            }
        }

    $sourceRoot = [System.IO.Path]::GetFullPath($Source)
    foreach ($relativePath in @(Get-WikiRelativeFiles -Directory $sourceRoot)) {
        $sourcePath = Join-Path $sourceRoot $relativePath
        $targetPath = Join-Path $destinationRoot $relativePath
        $targetDirectory = Split-Path -Parent $targetPath
        New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null
        $text = ConvertTo-NormalizedWikiText -Text ([System.IO.File]::ReadAllText($sourcePath))
        [System.IO.File]::WriteAllText($targetPath, $text, [System.Text.UTF8Encoding]::new($false))
    }
}
