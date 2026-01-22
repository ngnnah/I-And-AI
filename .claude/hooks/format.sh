#!/bin/bash

# Read JSON input from stdin
input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')

if [[ -z "$file_path" || ! -f "$file_path" ]]; then
  exit 0
fi

# Format SQL files with sqlfluff
if [[ "$file_path" == *.sql ]]; then
  sqlfluff fix --dialect postgres "$file_path" >/dev/null 2>&1 || true
  exit 0
fi

# Format Python files with black
if [[ "$file_path" == *.py ]]; then
  black --quiet "$file_path" >/dev/null 2>&1 || true
  exit 0
fi

# Format Markdown files with prettier
if [[ "$file_path" == *.md ]]; then
  prettier --write "$file_path" >/dev/null 2>&1 || true
  exit 0
fi

exit 0
