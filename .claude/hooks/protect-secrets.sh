#!/bin/bash
# Secrets protection hook - blocks edits to sensitive files
# Exit code 2 = block the operation

# Read tool input from stdin
input=$(cat)

# Extract file path from JSON
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')

# If no file path, allow the operation
if [[ -z "$file_path" ]]; then
  exit 0
fi

# Patterns to block
sensitive_patterns=(
  '\.env$'
  '\.env\.'
  '/secrets/'
  '/credentials/'
  'credentials\.json'
  'credentials\.yaml'
  'credentials\.yml'
  '\.pem$'
  '\.key$'
  'config\.local\.'
  '/\.aws/'
  '/\.ssh/'
  'api[_-]?key'
  'secret[_-]?key'
)

# Check against patterns
for pattern in "${sensitive_patterns[@]}"; do
  if echo "$file_path" | grep -qiE "$pattern"; then
    echo "BLOCKED: Cannot edit sensitive file: $file_path" >&2
    echo "This file matches pattern: $pattern" >&2
    exit 2
  fi
done

# Allow the operation
exit 0
