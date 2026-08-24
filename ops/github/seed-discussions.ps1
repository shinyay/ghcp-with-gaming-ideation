param(
    [string] $Repository
)

. (Join-Path $PSScriptRoot "lib\github.ps1")
$manifest = Get-SurfacesManifest -ScriptRoot $PSScriptRoot
if (-not $Repository) {
    $Repository = $manifest.repository
}
$parts = Get-RepositoryParts -Repository $Repository

$query = @'
query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    id
    discussionCategories(first: 100) {
      nodes { id name slug isAnswerable }
    }
    discussions(first: 100) {
      nodes { id number title url body upvoteCount viewerHasUpvoted category { id name slug } }
    }
  }
}
'@
$state = (Invoke-GhGraphQl -Query $query -Variables @{ owner = $parts.Owner; name = $parts.Name }).data.repository
$categoryBySlug = @{}
foreach ($category in $state.discussionCategories.nodes) {
    $categoryBySlug[$category.slug] = $category
}

$createMutation = @'
mutation($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
  createDiscussion(input: { repositoryId: $repositoryId, categoryId: $categoryId, title: $title, body: $body }) {
    discussion { id number title url category { id name slug } }
  }
}
'@
$updateMutation = @'
mutation($discussionId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
  updateDiscussion(input: { discussionId: $discussionId, categoryId: $categoryId, title: $title, body: $body }) {
    discussion { id number title url category { id name slug } }
  }
}
'@

$resolved = @{}
$reservedNumbers = @(
    $manifest.discussions |
        Where-Object { $_.PSObject.Properties.Name -contains "existing_number" } |
        ForEach-Object { [int]$_.existing_number }
)
foreach ($desired in $manifest.discussions) {
    $categorySpec = $manifest.discussion_categories | Where-Object { $_.stable_id -eq $desired.category } | Select-Object -First 1
    if (-not $categorySpec) {
        throw "Unknown desired category $($desired.category)"
    }
    $category = $categoryBySlug[$categorySpec.slug]
    if (-not $category) {
        $category = $categoryBySlug[$categorySpec.fallback_slug]
        if (-not $category) {
            throw "Neither category '$($categorySpec.slug)' nor fallback '$($categorySpec.fallback_slug)' exists."
        }
        Write-Warning "Category '$($categorySpec.name)' has no public create/update API; using '$($category.name)'."
    }

    $existing = $null
    if ($desired.PSObject.Properties.Name -contains "existing_number") {
        $existing = $state.discussions.nodes | Where-Object { $_.number -eq $desired.existing_number } | Select-Object -First 1
    }
    if (-not $existing) {
        $marker = "stable-id: $($desired.stable_id)"
        $existing = $state.discussions.nodes | Where-Object {
            $reservedNumbers -notcontains [int]$_.number -and
            $_.PSObject.Properties.Name -contains "body" -and
            $_.body -and
            $_.body.Contains($marker)
        } | Select-Object -First 1
    }
    if (-not $existing) {
        $existing = $state.discussions.nodes | Where-Object {
            $reservedNumbers -notcontains [int]$_.number -and
            $_.title -eq $desired.title
        } | Select-Object -First 1
    }

    $variables = @{
        categoryId = $category.id
        title = $desired.title
        body = Get-SeedDiscussionBody -Discussion $desired
    }
    if ($existing) {
        $variables.discussionId = $existing.id
        $live = (Invoke-GhGraphQl -Query $updateMutation -Variables $variables).data.updateDiscussion.discussion
    }
    else {
        $variables.repositoryId = $state.id
        $live = (Invoke-GhGraphQl -Query $createMutation -Variables $variables).data.createDiscussion.discussion
        $state.discussions.nodes += $live
    }
    $resolved[$desired.stable_id] = $live
}

$voteState = (Invoke-GhGraphQl -Query $query -Variables @{ owner = $parts.Owner; name = $parts.Name }).data.repository
$removeUpvote = @'
mutation($subjectId: ID!) {
  removeUpvote(input: { subjectId: $subjectId }) { clientMutationId }
}
'@
foreach ($desired in $manifest.discussions) {
    $discussionId = $resolved[$desired.stable_id].id
    $live = $voteState.discussions.nodes | Where-Object { $_.id -eq $discussionId } | Select-Object -First 1
    if ($live -and $live.viewerHasUpvoted) {
        Invoke-GhGraphQl -Query $removeUpvote -Variables @{ subjectId = $discussionId } | Out-Null
    }
}

$manifest.discussions | ForEach-Object {
    $live = $resolved[$_.stable_id]
    [pscustomobject]@{
        stable_id = $_.stable_id
        github_id = $live.id
        number = $live.number
        url = $live.url
        category = $live.category.slug
    }
} | ConvertTo-Json -Depth 10
