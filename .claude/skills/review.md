# /review

Review code for issues, improvements, and best practices.

## Instructions

1. If a file path is provided, read that file
2. If no path, check `git diff` for unstaged changes or `git diff --staged` for staged changes
3. Review the code for:
   - Bugs or logic errors
   - Security vulnerabilities
   - Performance issues
   - Code style and readability
   - Missing error handling
4. Provide feedback as:
   - **Critical**: Must fix (bugs, security issues)
   - **Suggestions**: Should consider (performance, maintainability)
   - **Nitpicks**: Optional (style, naming)
5. Keep feedback actionable and specific with line references
