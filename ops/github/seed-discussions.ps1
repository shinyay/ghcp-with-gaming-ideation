param(
    [string] $Repository,
    [switch] $Reset,
    [switch] $ConfirmReset
)

. (Join-Path $PSScriptRoot "lib\github.ps1")
Assert-ResetAuthorized -Reset:$Reset -ConfirmReset:$ConfirmReset
$manifest = Get-SurfacesManifest -ScriptRoot $PSScriptRoot
$snapshot = Get-ObjectSnapshot -ScriptRoot $PSScriptRoot
if (-not $Repository) {
    $Repository = $manifest.repository
}
$parts = Get-RepositoryParts -Repository $Repository

$repositoryQuery = @'
query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) { id }
}
'@
$repositoryId = (Invoke-GhGraphQl -Query $repositoryQuery -Variables @{
    owner = $parts.Owner
    name = $parts.Name
}).data.repository.id

$categoryQuery = @'
query($owner: String!, $name: String!, $cursor: String) {
  repository(owner: $owner, name: $name) {
    discussionCategories(first: 100, after: $cursor) {
      nodes { id name slug isAnswerable }
      pageInfo { hasNextPage endCursor }
    }
  }
}
'@
$categories = @(Get-GhGraphQlConnectionNodes -Query $categoryQuery -Variables @{
    owner = $parts.Owner
    name = $parts.Name
} -ConnectionPath "repository.discussionCategories")
$categoryBySlug = @{}
foreach ($category in $categories) {
    $categoryBySlug[$category.slug] = $category
}

$discussionQuery = @'
query($owner: String!, $name: String!, $cursor: String) {
  repository(owner: $owner, name: $name) {
    discussions(first: 100, after: $cursor) {
      nodes { id number title url body closed category { id name slug } }
      pageInfo { hasNextPage endCursor }
    }
  }
}
'@
$discussions = @(Get-GhGraphQlConnectionNodes -Query $discussionQuery -Variables @{
    owner = $parts.Owner
    name = $parts.Name
} -ConnectionPath "repository.discussions")

$createMutation = @'
mutation($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
  createDiscussion(input: { repositoryId: $repositoryId, categoryId: $categoryId, title: $title, body: $body }) {
    discussion { id number title url body closed category { id name slug } }
  }
}
'@
$updateMutation = @'
mutation($discussionId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
  updateDiscussion(input: { discussionId: $discussionId, categoryId: $categoryId, title: $title, body: $body }) {
    discussion { id number title url body closed category { id name slug } }
  }
}
'@

$resolved = @{}
$actions = @{ create = 0; preserve = 0; reset = 0 }
$reservedNumbers = @(
    $manifest.discussions |
        Where-Object { $_.PSObject.Properties.Name -contains "existing_number" } |
        ForEach-Object { [int]$_.existing_number }
)

foreach ($desired in $manifest.discussions) {
    $categorySpec = $manifest.discussion_categories | Where-Object { $_.stable_id -eq $desired.category } | Select-Object -First 1
    if (-not $categorySpec) {
        throw "Unknown desired category $($desired.category)."
    }
    $category = $categoryBySlug[$categorySpec.slug]
    if (-not $category) {
        $category = $categoryBySlug[$categorySpec.fallback_slug]
        if (-not $category) {
            throw "Neither category '$($categorySpec.slug)' nor fallback '$($categorySpec.fallback_slug)' exists."
        }
        Write-Warning "Category '$($categorySpec.name)' has no public create/update API; using '$($category.name)'."
    }

    $matches = @()
    $snapshotDiscussion = if ($snapshot) {
        $snapshot.discussions | Where-Object { $_.stable_id -eq $desired.stable_id } | Select-Object -First 1
    }
    else {
        $null
    }
    if ($snapshotDiscussion) {
        $matches = @($discussions | Where-Object {
            $_.id -eq $snapshotDiscussion.github_id -or $_.number -eq $snapshotDiscussion.number
        })
    }
    elseif ($desired.PSObject.Properties.Name -contains "existing_number") {
        $matches = @($discussions | Where-Object { $_.number -eq $desired.existing_number })
    }
    if ($matches.Count -eq 0) {
        $marker = "stable-id: $($desired.stable_id)"
        $matches = @($discussions | Where-Object {
            $reservedNumbers -notcontains [int]$_.number -and
            $_.body -and
            $_.body.Contains($marker)
        })
    }
    if ($matches.Count -eq 0) {
        $matches = @($discussions | Where-Object {
            $reservedNumbers -notcontains [int]$_.number -and
            $_.title -eq $desired.title
        })
    }
    if ($matches.Count -gt 1) {
        throw "Expected at most one live discussion for $($desired.stable_id); found $($matches.Count)."
    }

    $existing = if ($matches.Count -eq 1) { $matches[0] } else { $null }
    $action = Get-ReconciliationAction -Existing $existing -Reset:$Reset
    $actions[$action]++
    if ($action -eq "create") {
        $live = (Invoke-GhGraphQl -Query $createMutation -Variables @{
            repositoryId = $repositoryId
            categoryId = $category.id
            title = $desired.title
            body = Get-SeedDiscussionBody -Discussion $desired
        }).data.createDiscussion.discussion
        $discussions += $live
    }
    elseif ($action -eq "reset") {
        $live = (Invoke-GhGraphQl -Query $updateMutation -Variables @{
            discussionId = $existing.id
            categoryId = $category.id
            title = $desired.title
            body = Get-SeedDiscussionBody -Discussion $desired
        }).data.updateDiscussion.discussion
    }
    else {
        $live = $existing
    }
    $resolved[$desired.stable_id] = $live
}

[pscustomobject]@{
    repository = $Repository
    reset = [bool]$Reset
    actions = $actions
    discussions = @(
        $manifest.discussions | ForEach-Object {
            $live = $resolved[$_.stable_id]
            [pscustomobject]@{
                stable_id = $_.stable_id
                github_id = $live.id
                number = $live.number
                url = $live.url
                category = $live.category.slug
            }
        }
    )
} | ConvertTo-Json -Depth 10
