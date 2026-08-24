param(
    [string] $Repository
)

. (Join-Path $PSScriptRoot "lib\github.ps1")
$manifest = Get-SurfacesManifest -ScriptRoot $PSScriptRoot
if (-not $Repository) {
    $Repository = $manifest.repository
}
$parts = Get-RepositoryParts -Repository $Repository
$desiredProject = $manifest.project

$projectQuery = @'
query($owner: String!, $number: Int!, $repoOwner: String!, $repoName: String!) {
  user(login: $owner) {
    projectV2(number: $number) {
      id number title url public closed shortDescription
      repositories(first: 100) { nodes { id nameWithOwner } }
      fields(first: 100) {
        nodes {
          __typename
          ... on ProjectV2FieldCommon { id name dataType }
          ... on ProjectV2SingleSelectField { options { id name } }
        }
      }
      views(first: 100) { nodes { id name layout filter } }
      items(first: 100) {
        nodes {
          id
          content {
            ... on Issue { id number title url repository { nameWithOwner } }
          }
        }
      }
    }
  }
  repository(owner: $repoOwner, name: $repoName) { id nameWithOwner }
}
'@

function Get-ProjectState {
    $result = Invoke-GhGraphQl -Query $projectQuery -Variables @{
        owner = $desiredProject.owner
        number = [int]$desiredProject.number
        repoOwner = $parts.Owner
        repoName = $parts.Name
    }
    if (-not $result.data.user.projectV2) {
        throw "Private Project #$($desiredProject.number) was not found for @$($desiredProject.owner)."
    }
    return $result.data
}

$state = Get-ProjectState
$project = $state.user.projectV2

$updateProject = @'
mutation($input: UpdateProjectV2Input!) {
  updateProjectV2(input: $input) {
    projectV2 { id number title url public closed shortDescription }
  }
}
'@
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

foreach ($desiredField in $desiredProject.fields) {
    $existing = $project.fields.nodes | Where-Object { $_.name -eq $desiredField.name } | Select-Object -First 1
    if ($desiredField.type -eq "SINGLE_SELECT") {
        $options = @()
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

    if ($existing) {
        if ($desiredField.type -eq "SINGLE_SELECT") {
            Invoke-GhGraphQl -Query $updateField -Variables @{
                input = @{
                    fieldId = $existing.id
                    name = $desiredField.name
                    singleSelectOptions = $options
                }
            } | Out-Null
        }
    }
    else {
        $input = @{
            projectId = $project.id
            dataType = $desiredField.type
            name = $desiredField.name
        }
        if ($desiredField.type -eq "SINGLE_SELECT") {
            $input.singleSelectOptions = $options
        }
        Invoke-GhGraphQl -Query $createField -Variables @{ input = $input } | Out-Null
    }
}

$state = Get-ProjectState
$project = $state.user.projectV2

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
$firstExistingView = $project.views.nodes | Where-Object { $_.name -eq $firstDesiredView.name } | Select-Object -First 1
if (-not $firstExistingView -and $project.views.nodes.Count -eq 1 -and $project.views.nodes[0].name -eq "View 1") {
    Invoke-GhGraphQl -Query $updateView -Variables @{
        input = @{
            viewId = $project.views.nodes[0].id
            name = $firstDesiredView.name
            layout = $firstDesiredView.layout
            filter = $firstDesiredView.filter
        }
    } | Out-Null
    $state = Get-ProjectState
    $project = $state.user.projectV2
}

foreach ($desiredView in $desiredProject.views) {
    $existing = $project.views.nodes | Where-Object { $_.name -eq $desiredView.name } | Select-Object -First 1
    if ($existing) {
        Invoke-GhGraphQl -Query $updateView -Variables @{
            input = @{
                viewId = $existing.id
                name = $desiredView.name
                layout = $desiredView.layout
                filter = $desiredView.filter
            }
        } | Out-Null
    }
    else {
        Invoke-GhGraphQl -Query $createView -Variables @{
            input = @{
                projectId = $project.id
                name = $desiredView.name
                layout = $desiredView.layout
            }
        } | Out-Null
    }
}

$state = Get-ProjectState
$project = $state.user.projectV2
$liveIssues = @(
    Invoke-Gh -Arguments @("api", "repos/$Repository/issues?state=all&per_page=100") |
        Where-Object { -not ($_.PSObject.Properties.Name -contains "pull_request") }
)
$itemByContentId = @{}
foreach ($item in $project.items.nodes) {
    if ($item.content -and $item.content.id) {
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
    $marker = "stable-id: $($desiredIssue.stable_id)"
    $liveIssue = $liveIssues | Where-Object {
        ($_.body -and $_.body.Contains($marker)) -or
        ($desiredIssue.PSObject.Properties.Name -contains "existing_number" -and $_.number -eq $desiredIssue.existing_number)
    } | Select-Object -First 1
    if (-not $liveIssue) {
        throw "Missing live issue $($desiredIssue.stable_id). Run seed-issues.ps1 first."
    }

    $item = $itemByContentId[$liveIssue.node_id]
    if (-not $item) {
        $item = (Invoke-GhGraphQl -Query $addItem -Variables @{
            projectId = $project.id
            contentId = $liveIssue.node_id
        }).data.addProjectV2ItemById.item
        $itemByContentId[$liveIssue.node_id] = $item
    }

    foreach ($property in $desiredIssue.project.PSObject.Properties) {
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

$final = (Get-ProjectState).user.projectV2
[pscustomobject]@{
    stable_id = $desiredProject.stable_id
    github_id = $final.id
    number = $final.number
    url = $final.url
    fields = @($final.fields.nodes | Where-Object { $desiredProject.fields.name -contains $_.name }).Count
    views = @($final.views.nodes | Where-Object { $desiredProject.views.name -contains $_.name }).Count
    items = @($final.items.nodes | Where-Object { $_.content.repository.nameWithOwner -eq $Repository }).Count
} | ConvertTo-Json
