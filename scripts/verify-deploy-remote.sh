#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

EXPECTED_GITHUB_REGEX='^https://github\.com/sonjasungur/amanah-app(\.git)?$|^git@github\.com:sonjasungur/amanah-app(\.git)?$'

if ! command -v git >/dev/null 2>&1; then
  echo "git is required for remote verification." >&2
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not inside a git repository. Deployment remote check aborted." >&2
  exit 1
fi

selected_remote=""
selected_url=""

while IFS=$'\t' read -r remote url; do
  if [[ "$url" =~ $EXPECTED_GITHUB_REGEX ]]; then
    selected_remote="$remote"
    selected_url="$url"
    break
  fi
done < <(git remote -v | awk '$3=="(fetch)"{print $1 "\t" $2}')

if [[ -z "$selected_remote" ]]; then
  echo "No GitHub production remote found." >&2
  echo "Expected repository: github.com/sonjasungur/amanah-app" >&2
  echo "Refusing deployment from unknown or outdated remote." >&2
  exit 1
fi

current_commit="$(git rev-parse HEAD)"
current_branch="$(git rev-parse --abbrev-ref HEAD)"

echo "Verified deploy remote: ${selected_remote}"
echo "Verified deploy URL: ${selected_url}"
echo "Current branch: ${current_branch}"
echo "Current commit: ${current_commit}"
