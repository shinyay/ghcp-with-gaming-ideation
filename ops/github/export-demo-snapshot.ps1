param(
    [string] $Repository,
    [string] $OutputPath
)

. (Join-Path $PSScriptRoot "lib\github.ps1")
$manifest = Get-SurfacesManifest -ScriptRoot $PSScriptRoot
$allowlist = Get-Content -LiteralPath (Join-Path $PSScriptRoot "snapshot-allowlist.json") -Raw -Encoding utf8 | ConvertFrom-Json -Depth 100
$previousSnapshot = Get-ObjectSnapshot -ScriptRoot $PSScriptRoot
if (-not $Repository) {
    $Repository = $manifest.repository
}
$parts = Get-RepositoryParts -Repository $Repository
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
if (-not $OutputPath) {
    $OutputPath = Join-Path $root $allowlist.output
}

$repositoryState = Invoke-Gh -Arguments @(
    "repo", "view", $Repository,
    "--json", "id,nameWithOwner,url,visibility,hasIssuesEnabled,hasDiscussionsEnabled,hasWikiEnabled"
)
$milestoneState = @(Get-GhRestCollection -Endpoint "repos/$Repository/milestones?state=all&per_page=100")
$issueState = @(Get-GhRestCollection -Endpoint "repos/$Repository/issues?state=all&per_page=100")

$discussionQuery = @'
query($owner: String!, $name: String!, $cursor: String) {
  repository(owner: $owner, name: $name) {
    discussions(first: 100, after: $cursor) {
      nodes { id number title url body closed category { slug } }
      pageInfo { hasNextPage endCursor }
    }
  }
}
'@
$discussionState = @(Get-GhGraphQlConnectionNodes -Query $discussionQuery -Variables @{
    owner = $parts.Owner
    name = $parts.Name
} -ConnectionPath "repository.discussions")

$projectBaseQuery = @'
query($owner: String!, $number: Int!) {
  user(login: $owner) {
    projectV2(number: $number) {
      id number title url public closed
    }
  }
}
'@
$projectFieldQuery = @'
query($owner: String!, $number: Int!, $cursor: String) {
  user(login: $owner) {
    projectV2(number: $number) {
      fields(first: 100, after: $cursor) {
        nodes {
          __typename
          ... on ProjectV2FieldCommon { id name dataType }
          ... on ProjectV2SingleSelectField { options { id name } }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
}
'@
$projectViewQuery = @'
query($owner: String!, $number: Int!, $cursor: String) {
  user(login: $owner) {
    projectV2(number: $number) {
      views(first: 100, after: $cursor) {
        nodes { id name layout filter }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
}
'@
$projectItemQuery = @'
query($owner: String!, $number: Int!, $cursor: String) {
  user(login: $owner) {
    projectV2(number: $number) {
      items(first: 100, after: $cursor) {
        nodes {
          id
          content {
            ... on Issue { id number title url state repository { nameWithOwner } }
          }
          fieldValues(first: 100) {
            nodes {
              __typename
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field { ... on ProjectV2FieldCommon { name } }
              }
            }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
}
'@
$projectVariables = @{
    owner = $manifest.project.owner
    number = [int]$manifest.project.number
}
$project = (Invoke-GhGraphQl -Query $projectBaseQuery -Variables $projectVariables).data.user.projectV2
if (-not $project) {
    throw "Project #$($manifest.project.number) was not found."
}
$projectFields = @(Get-GhGraphQlConnectionNodes -Query $projectFieldQuery -Variables $projectVariables -ConnectionPath "user.projectV2.fields")
$projectViews = @(Get-GhGraphQlConnectionNodes -Query $projectViewQuery -Variables $projectVariables -ConnectionPath "user.projectV2.views")
$projectItems = @(Get-GhGraphQlConnectionNodes -Query $projectItemQuery -Variables $projectVariables -ConnectionPath "user.projectV2.items")
$project | Add-Member -NotePropertyName fields -NotePropertyValue ([pscustomobject]@{ nodes = $projectFields }) -Force
$project | Add-Member -NotePropertyName views -NotePropertyValue ([pscustomobject]@{ nodes = $projectViews }) -Force
$project | Add-Member -NotePropertyName items -NotePropertyValue ([pscustomobject]@{ nodes = $projectItems }) -Force

$milestoneByStableId = @{}
$milestoneEntries = @(
    foreach ($desired in $manifest.milestones) {
        if ($allowlist.milestones -notcontains $desired.stable_id) {
            throw "Milestone $($desired.stable_id) is not allowlisted."
        }
        $previous = if ($previousSnapshot) {
            $previousSnapshot.milestones | Where-Object { $_.stable_id -eq $desired.stable_id } | Select-Object -First 1
        }
        else {
            $null
        }
        $matches = if ($previous) {
            @($milestoneState | Where-Object {
                $_.node_id -eq $previous.github_id -or $_.number -eq $previous.number
            })
        }
        else {
            @($milestoneState | Where-Object { $_.title -eq $desired.title })
        }
        if ($matches.Count -ne 1) {
            throw "Expected one milestone for $($desired.stable_id); found $($matches.Count)."
        }
        $live = $matches[0]
        if ($live.title -ne $desired.title) {
            throw "Milestone title drift for $($desired.stable_id)."
        }
        $milestoneByStableId[$desired.stable_id] = $live
        [ordered]@{
            stable_id = $desired.stable_id
            github_id = $live.node_id
            number = [int]$live.number
            url = $live.html_url
            title = $desired.title
            status = $live.state
        }
    }
)

$liveIssueByStableId = @{}
$issueEntries = @(
    foreach ($desired in $manifest.issues) {
        if ($allowlist.issues -notcontains $desired.stable_id) {
            throw "Issue $($desired.stable_id) is not allowlisted."
        }
        $previous = if ($previousSnapshot) {
            $previousSnapshot.issues | Where-Object { $_.stable_id -eq $desired.stable_id } | Select-Object -First 1
        }
        else {
            $null
        }
        if ($previous) {
            $matches = @($issueState | Where-Object {
                -not ($_.PSObject.Properties.Name -contains "pull_request") -and
                ($_.node_id -eq $previous.github_id -or $_.number -eq $previous.number)
            })
        }
        else {
            $marker = "stable-id: $($desired.stable_id)"
            $matches = @($issueState | Where-Object {
                -not ($_.PSObject.Properties.Name -contains "pull_request") -and
                (
                    ($_.body -and $_.body.Contains($marker)) -or
                    ($desired.PSObject.Properties.Name -contains "existing_number" -and $_.number -eq $desired.existing_number)
                )
            })
        }
        if ($matches.Count -ne 1) {
            throw "Expected one live issue for $($desired.stable_id); found $($matches.Count)."
        }
        $live = $matches[0]
        $liveIssueByStableId[$desired.stable_id] = $live
        if ($live.title -ne $desired.title) {
            throw "Issue title drift for $($desired.stable_id)."
        }
        $liveLabels = @($live.labels | ForEach-Object { $_.name } | Sort-Object)
        $desiredLabels = @($desired.labels | Sort-Object)
        if (($liveLabels -join "|") -ne ($desiredLabels -join "|")) {
            throw "Issue label drift for $($desired.stable_id)."
        }
        $liveMilestone = $milestoneByStableId[$desired.milestone]
        if (-not $live.milestone -or $live.milestone.number -ne $liveMilestone.number) {
            throw "Issue milestone drift for $($desired.stable_id)."
        }
        [ordered]@{
            stable_id = $desired.stable_id
            github_id = $live.node_id
            number = [int]$live.number
            url = $live.html_url
            title = $desired.title
            status = $live.state.ToLowerInvariant()
            labels = $desiredLabels
            milestone = $desired.milestone
        }
    }
)

$discussionEntries = @(
    foreach ($desired in $manifest.discussions) {
        if ($allowlist.discussions -notcontains $desired.stable_id) {
            throw "Discussion $($desired.stable_id) is not allowlisted."
        }
        $previous = if ($previousSnapshot) {
            $previousSnapshot.discussions | Where-Object { $_.stable_id -eq $desired.stable_id } | Select-Object -First 1
        }
        else {
            $null
        }
        if ($previous) {
            $matches = @($discussionState | Where-Object {
                $_.id -eq $previous.github_id -or $_.number -eq $previous.number
            })
        }
        else {
            $marker = "stable-id: $($desired.stable_id)"
            $matches = @($discussionState | Where-Object {
                ($_.body -and $_.body.Contains($marker)) -or
                ($desired.PSObject.Properties.Name -contains "existing_number" -and $_.number -eq $desired.existing_number)
            })
        }
        if ($matches.Count -ne 1) {
            throw "Expected one live discussion for $($desired.stable_id); found $($matches.Count)."
        }
        $live = $matches[0]
        if ($live.title -ne $desired.title) {
            throw "Discussion title drift for $($desired.stable_id)."
        }
        $categorySpec = $manifest.discussion_categories | Where-Object { $_.stable_id -eq $desired.category } | Select-Object -First 1
        if (@($categorySpec.slug, $categorySpec.fallback_slug) -notcontains $live.category.slug) {
            throw "Discussion category drift for $($desired.stable_id)."
        }
        [ordered]@{
            stable_id = $desired.stable_id
            github_id = $live.id
            number = [int]$live.number
            url = $live.url
            title = $desired.title
            status = if ($live.closed) { "closed" } else { "open" }
            category = $live.category.slug
        }
    }
)

if ($allowlist.projects -notcontains $manifest.project.stable_id) {
    throw "Project $($manifest.project.stable_id) is not allowlisted."
}
if ($project.title -ne $manifest.project.title -or $project.public) {
    throw "Project title or visibility drift."
}

$projectFieldEntries = @(
    foreach ($desired in $manifest.project.fields) {
        $matches = @($project.fields.nodes | Where-Object { $_.name -eq $desired.name })
        if ($matches.Count -ne 1) {
            throw "Expected one Project field '$($desired.name)'; found $($matches.Count)."
        }
        $live = $matches[0]
        if (-not $live) {
            throw "Missing Project field $($desired.name)."
        }
        $entry = [ordered]@{
            github_id = $live.id
            title = $desired.name
            data_type = $live.dataType
            options = @()
        }
        if ($desired.type -eq "SINGLE_SELECT") {
            $liveOptions = @($live.options | ForEach-Object { $_.name })
            if (($liveOptions -join "|") -ne (@($desired.options) -join "|")) {
                throw "Project field option drift for $($desired.name)."
            }
            $entry.options = @($desired.options)
        }
        $entry
    }
)

$projectViewEntries = @(
    foreach ($desired in $manifest.project.views) {
        $matches = @($project.views.nodes | Where-Object { $_.name -eq $desired.name })
        if ($matches.Count -ne 1) {
            throw "Expected one Project view '$($desired.name)'; found $($matches.Count)."
        }
        $live = $matches[0]
        if ($live.layout -ne $desired.layout) {
            throw "Project view layout drift for $($desired.name)."
        }
        if ([string]$live.filter -ne [string]$desired.filter) {
            throw "Project view filter drift for $($desired.name)."
        }
        [ordered]@{
            github_id = $live.id
            title = $desired.name
            layout = $live.layout
        }
    }
)

$projectItemEntries = @(
    foreach ($desired in $manifest.issues) {
        $liveIssue = $liveIssueByStableId[$desired.stable_id]
        $matches = @($project.items.nodes | Where-Object {
            $_.content -and
            $_.content.repository.nameWithOwner -eq $Repository -and
            $_.content.id -eq $liveIssue.node_id
        })
        if ($matches.Count -ne 1) {
            throw "Expected one Project item for $($desired.stable_id); found $($matches.Count)."
        }
        $live = $matches[0]
        $enumValues = @(
            foreach ($property in $desired.project.PSObject.Properties | Where-Object { $_.Name -ne "Estimate" }) {
                $value = $live.fieldValues.nodes |
                    Where-Object { $_.__typename -eq "ProjectV2ItemFieldSingleSelectValue" -and $_.field.name -eq $property.Name } |
                    Select-Object -First 1
                if (-not $value -or $value.name -ne [string]$property.Value) {
                    throw "Project item field drift for $($desired.stable_id) / $($property.Name)."
                }
                [ordered]@{
                    title = $property.Name
                    status = [string]$property.Value
                }
            }
        )
        [ordered]@{
            stable_id = "PROJECT-ITEM-$($desired.stable_id)"
            github_id = $live.id
            number = [int]$live.content.number
            url = $live.content.url
            title = $desired.title
            status = $live.content.state.ToLowerInvariant()
            fields = $enumValues
        }
    }
)

$wikiStatePath = Join-Path $PSScriptRoot "wiki-publish-state.json"
$wikiState = if (Test-Path -LiteralPath $wikiStatePath) {
    Get-Content -LiteralPath $wikiStatePath -Raw -Encoding utf8 | ConvertFrom-Json -Depth 20
}
else {
    [pscustomobject]@{ status = "fallback_required" }
}
$wikiPublished = $wikiState.status -eq "published_verified"
$wikiEntries = @(
    foreach ($page in $manifest.wiki.pages) {
        if ($allowlist.wiki_pages -notcontains $page.stable_id) {
            throw "Wiki page $($page.stable_id) is not allowlisted."
        }
        $slug = [System.IO.Path]::GetFileNameWithoutExtension($page.file)
        [ordered]@{
            stable_id = $page.stable_id
            url = if ($wikiPublished) {
                "https://github.com/$Repository/wiki/$slug"
            }
            else {
                "https://github.com/$Repository/blob/main/ops/github/wiki/$($page.file)"
            }
            title = $page.title
            status = if ($wikiPublished) { "published" } else { "fallback" }
        }
    }
)

$snapshot = [ordered]@{
    schema_version = 1
    repository = [ordered]@{
        stable_id = "REPO-001"
        github_id = $repositoryState.id
        url = $repositoryState.url
        title = $repositoryState.nameWithOwner
        status = "active"
        visibility = $repositoryState.visibility.ToLowerInvariant()
        features = @(
            "issues:$($(if ($repositoryState.hasIssuesEnabled) { 'enabled' } else { 'disabled' }))",
            "discussions:$($(if ($repositoryState.hasDiscussionsEnabled) { 'enabled' } else { 'disabled' }))",
            "wiki:$($(if ($repositoryState.hasWikiEnabled) { 'enabled' } else { 'disabled' }))",
            "pages:unpublished"
        )
    }
    milestones = $milestoneEntries
    issues = $issueEntries
    discussions = $discussionEntries
    project = [ordered]@{
        stable_id = $manifest.project.stable_id
        github_id = $project.id
        number = [int]$project.number
        url = $project.url
        title = $manifest.project.title
        status = if ($project.closed) { "closed" } else { "open" }
        visibility = if ($project.public) { "public" } else { "private" }
        fields = $projectFieldEntries
        views = $projectViewEntries
        items = $projectItemEntries
    }
    wiki = [ordered]@{
        stable_id = "WIKI-ROOT-001"
        url = if ($wikiPublished) { "https://github.com/$Repository/wiki" } else { "https://github.com/$Repository/tree/main/ops/github/wiki" }
        title = "STAR RELAY Museum"
        status = if ($wikiPublished) { "published" } else { "fallback" }
        pages = $wikiEntries
    }
}

$outputDirectory = Split-Path -Parent $OutputPath
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
$snapshot | ConvertTo-Json -Depth 100 | Set-Content -LiteralPath $OutputPath -Encoding utf8

[pscustomobject]@{
    output = $allowlist.output
    issues = $issueEntries.Count
    discussions = $discussionEntries.Count
    project_items = $projectItemEntries.Count
    wiki_status = $snapshot.wiki.status
} | ConvertTo-Json
