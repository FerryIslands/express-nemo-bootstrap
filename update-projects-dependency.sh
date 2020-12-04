#!/usr/bin/env bash

# Change them
newVersion='vX.Y.Z'
featureId='SET PBI ITEM'

projectWithNemoBootstrap=(
  'tm-internal-api'
  'tm-capacity-api-v2'
  'tm-nemo-api'
  'tm-price-api'
  'tm-competitor-price-api'
  'tm-task-api'
  'tm-monetary-api' )

projectPackageManager=(
  'yarn'
  'npm'
  'npm'
  'yarn'
  'npm'
  'yarn'
  'npm' )

gitRepo='https://github.com/FerryIslands/express-nemo-bootstrap.git'
tempSuffix="-temp"

update_package_json() {
  local project
  local updatedJson
  local packageJson
  project="${1}"

  packageJson="$PWD/package.json"
  [ ! -f "$packageJson" ] && echo "[update_package_json] Missing package.json in project: '$project' - exiting" && exit 1

  check_if_same_version && echo "Trying to update project: '$project' package.json to the same version '$newVersion'" && return 1

  # inplace replace
  updatedJson=$(jq --arg bootstrap "$gitRepo#$newVersion" '.dependencies."express-nemo-bootstrap" = $bootstrap' "$packageJson" ) \
   && echo "$updatedJson" > "$packageJson"
}

check_if_same_version() {
  jq '.dependencies."express-nemo-bootstrap"' package.json | grep -q "$newVersion"
}

install_package() {
  local packageManager
  packageManager="${1}"
  $packageManager install
}

git_create_branch() {
  git checkout -b "feature/$featureId-update-nemo-bootstrap"
}

git_push_branch() {
  git push --set-upstream origin "feature/$featureId-update-nemo-bootstrap"
}

hub_create_pull_request() {
  hub pull-request -m "Task $featureId: Update express-nemo-bootstrap to '$newVersion' (AB#$featureId)"
}

git_commit_changes() {
  local packageManager
  packageManager="${1}"
  if [ "$packageManager" = 'npm' ]; then
    git add package.json package-lock.json
  elif [ "$packageManager" = 'yarn' ]; then
    git add package.json yarn.lock
  fi

  git commit -m "- Update new express-nemo-bootstrap version '$newVersion'"
}

git_clone_temp_project () {
  local project
  project="${1}"
  echo "Cloning to '$project$tempSuffix' in folder '$(pwd)'"
  git clone "git@github.com:FerryIslands/$project.git" "$project$tempSuffix"
  cd "./$project$tempSuffix" || (echo "[git_clone_temp_project] Failed to find project: '$project' - exiting" && exit 1)
}

rm_temp_project() {
  local project
  project="${1}"
  rm -rf "./$project$tempSuffix"
}

git_fetch_bootstrap_tags () {
  git fetch --all --tags --prune
}

git_check_if_version_tag_exists() {
  local tagVersion
  tagVersion="${1:-NotDefined}"
  (git tag | grep -q "$tagVersion") || return 1
  return 0
}

is_digit() {
  local digitString
  digitString="$1"
  case $digitString in
    ''|*[!0-9]*) return 1 ;;
    *) ;;
  esac
  return 0
}

prereq_check() {
  local shouldExit
  shouldExit=false
  if ! is_digit "$featureId"; then
     printf "variable 'featureId' (%s) is not a digit,\n - set 'featureId' at top of script\n" "$featureId"
    shouldExit=true
  fi

  if ! git_check_if_version_tag_exists "$newVersion"; then
    local availableTags
    availableTags=( $(git tag) )
    printf "variable 'newVersion' (%s) do not exist in available versions,\n - set 'newVersion' at top of script\n" "$newVersion"

    echo "available versions:"
    for tag in "${availableTags[@]}"; do
      echo "  $tag"
    done

    shouldExit=true
  fi

  [[ "$shouldExit" == 'true' ]] && echo "[prereq_check] Failed exiting" && exit 1
}

main() {
  local oldPath
  local pullRequests
  oldPath="$PWD"
  pullRequests=()

  # express-nemo-bootstrap folder
  git_fetch_bootstrap_tags
  prereq_check

  # projects folder
  cd ..
  for index in "${!projectWithNemoBootstrap[@]}"
  do
    if git_clone_temp_project "${projectWithNemoBootstrap[$index]}"; then
      git_create_branch
      if update_package_json "${projectWithNemoBootstrap[$index]}"; then
        if install_package "${projectPackageManager[$index]}" && \
          git_commit_changes "${projectPackageManager[$index]}" && \
          git_push_branch; then
            pullRequests+=("$(hub_create_pull_request)")
        fi
      fi
      cd ..
      rm_temp_project "${projectWithNemoBootstrap[$index]}"
    fi
  done

  # pull request results
  echo ""
  echo "----------------------"
  echo "Pull requests created:"
  echo "----------------------"
  for pullRequest in "${pullRequests[@]}"; do
    echo "  $pullRequest"
  done
  echo "----------------------"
  echo ""

  cd "$oldPath" || return
}

main
