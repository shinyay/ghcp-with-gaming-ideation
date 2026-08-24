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
$desiredProject = $manifest.project

$projectBaseQuery = @'
query($owner: String!, $number: Int!, $repoOwner: String!, $repoName: String!) {
  user(login: $owner) {
    projectV2(number: $number) {
      id number title url public closed shortDescription
    }
  }
  repository(owner: $repoOwner, name: $repoName) { id nameWithOwner }
}
'@
$repositoryConnectionQuery = @'
query($owner: String!, $number: Int!, $cursor: String) {
  user(login: $owner) {
    projectV2(number: $number) {
      repositories(first: 100, after: $cursor) {
        nodes { id nameWithOwner }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
}
'@
$fieldConnectionQuery = @'
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
$viewConnectionQuery = @'
query($owner: String!, $number: Int!, $cursor: String) {
  user(login: $owner) {
    projectV2(number: $number) {
      views(first: 100, after: $cursor) {
        nodes { id name layout filter createdAt updatedAt }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
}
'@
$itemConnectionQuery = @'
query($owner: String!, $number: Int!, $cursor: String) {
  user(login: $owner) {
    projectV2(number: $number) {
      items(first: 100, after: $cursor) {
        nodes {
          id
          content {
            ... on Issue { id number title url repository { nameWithOwner } }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
}
'@

function Get-ProjectState {
    $variables = @{
        owner = $desiredProject.owner
        number = [int]$desiredProject.number
    }
    $result = Invoke-GhGraphQl -Query $projectBaseQuery -Variables @{
        owner = $desiredProject.owner
        number = [int]$desiredProject.number
        repoOwner = $parts.Owner
        repoName = $parts.Name
    }
    if (-not $result.data.user.projectV2) {
        throw "Private Project #$($desiredProject.number) was not found for @$($desiredProject.owner)."
    }

    $project = $result.data.user.projectV2
    $repositories = @(Get-GhGraphQlConnectionNodes -Query $repositoryConnectionQuery -Variables $variables -ConnectionPath "user.projectV2.repositories")
    $fields = @(Get-GhGraphQlConnectionNodes -Query $fieldConnectionQuery -Variables $variables -ConnectionPath "user.projectV2.fields")
    $views = @(Get-GhGraphQlConnectionNodes -Query $viewConnectionQuery -Variables $variables -ConnectionPath "user.projectV2.views")
    $items = @(Get-GhGraphQlConnectionNodes -Query $itemConnectionQuery -Variables $variables -ConnectionPath "user.projectV2.items")
    $project | Add-Member -NotePropertyName repositories -NotePropertyValue ([pscustomobject]@{ nodes = $repositories }) -Force
    $project | Add-Member -NotePropertyName fields -NotePropertyValue ([pscustomobject]@{ nodes = $fields }) -Force
    $project | Add-Member -NotePropertyName views -NotePropertyValue ([pscustomobject]@{ nodes = $views }) -Force
    $project | Add-Member -NotePropertyName items -NotePropertyValue ([pscustomobject]@{ nodes = $items }) -Force
    return [pscustomobject]@{
        project = $project
        repository = $result.data.repository
    }
}

$state = Get-ProjectState
$project = $state.project
if ($project.public -and -not $Reset) {
    throw "Project #$($project.number) is public. Use -Reset -ConfirmReset to restore the required private state."
}

$updateProject = @'
mutation($input: UpdateProjectV2Input!) {
  updateProjectV2(input: $input) {
    projectV2 { id number title url public closed shortDescription }
  }
}
'@
if ($Reset) {
    Invoke-GhGraphQl -Query $updateProject -Variables @{
        input = @{
            projectId = $project.id
            title = $desiredProject.title
            shortDescription = $desiredProject.short_description
            readme = "このProjectは状態と座標だけを扱います。Evidence、判断、作業本文はrepositoryとIssueを正本とします。`n`nEnglish summary: Project status only; canonical prose remains in repository records."
            public = [bool]$desiredProject.public
            closed = $false
        }
    } | Out-Null
}
elseif ($project.title -ne $desiredProject.title) {
    Write-Warning "Preserving Project title '$($project.title)'. Use -Reset -ConfirmReset to restore '$($desiredProject.title)'."
}

if (-not ($project.repositories.nodes | Where-Object { $_.nameWithOwner -eq $Repository })) {
    $linkProject = @'
mutation($projectId: ID!, $repositoryId: ID!) {
  linkProjectV2ToRepository(input: { projectId: $projectId, repositoryId: $repositoryId }) {
    repository { id nameWithOwner }
  }
}
'@
    Invoke-GhGraphQl -Query $linkProject -Variables @{
        projectId = $project.id
        repositoryId = $state.repository.id
    } | Out-Null
}

$createField = @'
mutation($input: CreateProjectV2FieldInput!) {
  createProjectV2Field(input: $input) {
    projectV2Field {
      __typename
      ... on ProjectV2FieldCommon { id name dataType }
      ... on ProjectV2SingleSelectField { options { id name } }
    }
  }
}
'@
$updateField = @'
mutation($input: UpdateProjectV2FieldInput!) {
  updateProjectV2Field(input: $input) {
    projectV2Field {
      __typename
      ... on ProjectV2FieldCommon { id name dataType }
      ... on ProjectV2SingleSelectField { options { id name } }
    }
  }
}
'@

$createdFieldNames = [System.Collections.Generic.HashSet[string]]::new()
foreach ($desiredField in $desiredProject.fields) {
    $existing = Get-UniqueNamedObject -Items @($project.fields.nodes) -Name $desiredField.name -Kind "Project field"
    if ($existing -and $existing.dataType -ne $desiredField.type) {
        throw "Project field '$($desiredField.name)' has type '$($existing.dataType)', expected '$($desiredField.type)'."
    }
    $options = @()
    if ($desiredField.type -eq "SINGLE_SELECT") {
        for ($index = 0; $index -lt $desiredField.options.Count; $index++) {
            $name = [string]$desiredField.options[$index]
            $option = @{
                name = $name
                color = Get-OptionColor -Index $index
                description = "$name workflow coordinate"
            }
            if ($existing) {
                $existingOption = $existing.options | Where-Object { $_.name -eq $name } | Select-Object -First 1
                if ($existingOption) {
                    $option.id = $existingOption.id
                }
            }
            $options += $option
        }
    }

    $action = Get-ReconciliationAction -Existing $existing -Reset:$Reset
    if ($action -eq "create") {
        $input = @{
            projectId = $project.id
            dataType = $desiredField.type
            name = $desiredField.name
        }
        if ($desiredField.type -eq "SINGLE_SELECT") {
            $input.singleSelectOptions = $options
        }
        Invoke-GhGraphQl -Query $createField -Variables @{ input = $input } | Out-Null
        $createdFieldNames.Add($desiredField.name) | Out-Null
        $state = Get-ProjectState
        $project = $state.project
    }
    elseif ($action -eq "reset" -and $desiredField.type -eq "SINGLE_SELECT") {
        Invoke-GhGraphQl -Query $updateField -Variables @{
            input = @{
                fieldId = $existing.id
                name = $desiredField.name
                singleSelectOptions = $options
            }
        } | Out-Null
        $state = Get-ProjectState
        $project = $state.project
    }
    elseif ($action -eq "preserve" -and $desiredField.type -eq "SINGLE_SELECT") {
        $liveOptions = @($existing.options | ForEach-Object { $_.name })
        if (($liveOptions -join "|") -ne (@($desiredField.options) -join "|")) {
            Write-Warning "Preserving options for Project field '$($desiredField.name)'. Use -Reset -ConfirmReset to restore desired options."
        }
    }
}

$createView = @'
mutation($input: CreateProjectV2ViewInput!) {
  createProjectV2View(input: $input) {
    projectV2View { id name layout filter }
  }
}
'@
$updateView = @'
mutation($input: UpdateProjectV2ViewInput!) {
  updateProjectV2View(input: $input) {
    projectV2View { id name layout filter }
  }
}
'@

$firstDesiredView = $desiredProject.views[0]
$firstExistingView = Get-UniqueNamedObject -Items @($project.views.nodes) -Name $firstDesiredView.name -Kind "Project view"
if ($Reset -and -not $firstExistingView -and $project.views.nodes.Count -eq 1 -and $project.views.nodes[0].name -eq "View 1") {
    Invoke-GhGraphQl -Query $updateView -Variables @{
        input = @{
            viewId = $project.views.nodes[0].id
            name = $firstDesiredView.name
            layout = $firstDesiredView.layout
            filter = $firstDesiredView.filter
        }
    } | Out-Null
    $state = Get-ProjectState
    $project = $state.project
}

foreach ($desiredView in $desiredProject.views) {
    $existing = Get-UniqueNamedObject -Items @($project.views.nodes) -Name $desiredView.name -Kind "Project view"
    $action = Get-ReconciliationAction -Existing $existing -Reset:$Reset
    if ($action -eq "create") {
        Invoke-GhGraphQl -Query $createView -Variables @{
            input = @{
                projectId = $project.id
                name = $desiredView.name
                layout = $desiredView.layout
            }
        } | Out-Null
        $state = Get-ProjectState
        $project = $state.project
        $existing = Get-UniqueNamedObject -Items @($project.views.nodes) -Name $desiredView.name -Kind "new Project view"
        if (-not $existing) {
            throw "Project view '$($desiredView.name)' was not returned after creation."
        }
        Invoke-GhGraphQl -Query $updateView -Variables @{
            input = @{
                viewId = $existing.id
                name = $desiredView.name
                layout = $desiredView.layout
                filter = $desiredView.filter
            }
        } | Out-Null
        $state = Get-ProjectState
        $project = $state.project
    }
    elseif ($action -eq "reset") {
        Invoke-GhGraphQl -Query $updateView -Variables @{
            input = @{
                viewId = $existing.id
                name = $desiredView.name
                layout = $desiredView.layout
                filter = $desiredView.filter
            }
        } | Out-Null
        $state = Get-ProjectState
        $project = $state.project
    }
    elseif ($existing.layout -ne $desiredView.layout -or [string]$existing.filter -ne [string]$desiredView.filter) {
        Write-Warning "Preserving layout/filter for Project view '$($desiredView.name)'. Use -Reset -ConfirmReset to restore desired configuration."
    }
}

foreach ($desiredView in $desiredProject.views) {
    $verifiedView = Get-UniqueNamedObject -Items @($project.views.nodes) -Name $desiredView.name -Kind "Project view"
    if (-not $verifiedView) {
        throw "Project view '$($desiredView.name)' is missing after reconciliation."
    }
}

$liveIssues = @(
    Get-GhRestCollection -Endpoint "repos/$Repository/issues?state=all&per_page=100" |
        Where-Object { -not ($_.PSObject.Properties.Name -contains "pull_request") }
)
$itemByContentId = @{}
foreach ($item in $project.items.nodes) {
    if ($item.content -and $item.content.id) {
        if ($itemByContentId.ContainsKey($item.content.id)) {
            throw "Project contains duplicate items for content $($item.content.id)."
        }
        $itemByContentId[$item.content.id] = $item
    }
}

$addItem = @'
mutation($projectId: ID!, $contentId: ID!) {
  addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
    item { id }
  }
}
'@
$updateItemField = @'
mutation($input: UpdateProjectV2ItemFieldValueInput!) {
  updateProjectV2ItemFieldValue(input: $input) {
    projectV2Item { id }
  }
}
'@

$fieldByName = @{}
foreach ($field in $project.fields.nodes) {
    $fieldByName[$field.name] = $field
}

foreach ($desiredIssue in $manifest.issues) {
    $snapshotIssue = if ($snapshot) {
        $snapshot.issues | Where-Object { $_.stable_id -eq $desiredIssue.stable_id } | Select-Object -First 1
    }
    else {
        $null
    }
    $matches = if ($snapshotIssue) {
        @($liveIssues | Where-Object {
            $_.node_id -eq $snapshotIssue.github_id -or $_.number -eq $snapshotIssue.number
        })
    }
    else {
        $fallbackMatches = if ($desiredIssue.PSObject.Properties.Name -contains "existing_number") {
            @($liveIssues | Where-Object { $_.number -eq $desiredIssue.existing_number })
        }
        else {
            @()
        }
        if ($fallbackMatches.Count -eq 0) {
            $marker = "stable-id: $($desiredIssue.stable_id)"
            $fallbackMatches = @($liveIssues | Where-Object { $_.body -and $_.body.Contains($marker) })
        }
        $fallbackMatches
    }
    if ($matches.Count -ne 1) {
        throw "Expected one live issue for $($desiredIssue.stable_id); found $($matches.Count). Run seed-issues.ps1 first."
    }
    $liveIssue = $matches[0]

    $item = $itemByContentId[$liveIssue.node_id]
    $createdItem = $false
    if (-not $item) {
        $item = (Invoke-GhGraphQl -Query $addItem -Variables @{
            projectId = $project.id
            contentId = $liveIssue.node_id
        }).data.addProjectV2ItemById.item
        $itemByContentId[$liveIssue.node_id] = $item
        $createdItem = $true
    }

    foreach ($property in $desiredIssue.project.PSObject.Properties) {
        if (-not ($Reset -or $createdItem -or $createdFieldNames.Contains($property.Name))) {
            continue
        }
        $field = $fieldByName[$property.Name]
        if (-not $field) {
            throw "Project field '$($property.Name)' was not created."
        }
        if ($field.dataType -eq "SINGLE_SELECT") {
            $option = $field.options | Where-Object { $_.name -eq [string]$property.Value } | Select-Object -First 1
            if (-not $option) {
                throw "Project option '$($property.Value)' was not found in '$($property.Name)'."
            }
            $value = @{ singleSelectOptionId = $option.id }
        }
        elseif ($field.dataType -eq "NUMBER") {
            $value = @{ number = [double]$property.Value }
        }
        else {
            throw "Unsupported managed field type '$($field.dataType)' for '$($property.Name)'."
        }

        Invoke-GhGraphQl -Query $updateItemField -Variables @{
            input = @{
                projectId = $project.id
                itemId = $item.id
                fieldId = $field.id
                value = $value
            }
        } | Out-Null
    }
}

$final = (Get-ProjectState).project
[pscustomobject]@{
    stable_id = $desiredProject.stable_id
    github_id = $final.id
    number = $final.number
    url = $final.url
    reset = [bool]$Reset
    fields = @($final.fields.nodes | Where-Object { $desiredProject.fields.name -contains $_.name }).Count
    views = @($final.views.nodes | Where-Object { $desiredProject.views.name -contains $_.name }).Count
    items = @($final.items.nodes | Where-Object { $_.content.repository.nameWithOwner -eq $Repository }).Count
} | ConvertTo-Json
