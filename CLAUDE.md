# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context

This is a personal learning repository for a data engineer working in B2G telecom software. The focus is on AI-assisted development workflows and data engineering.

## MCP Integrations

- **Linear**: Enabled for issue tracking and project management. Use Linear MCP tools to create, update, and query issues.

## Python Environment

This project uses **uv** for package and environment management.

- Run Python scripts: `uv run script.py`
- Run tools (pytest, ruff, etc.): `uv run pytest`, `uv run ruff check`
- Add dependencies: `uv add <package>`
- Add dev dependencies: `uv add --dev <package>`
- Sync environment: `uv sync`

Always use `uv run` instead of activating the venv manually or calling `python` directly.

## Code Style

- Python: Follow PEP 8, use type hints for function signatures
- SQL: Uppercase keywords, lowercase identifiers, use CTEs over nested subqueries
- Keep files focused and small; split when exceeding ~200 lines

## Commits

- Use conventional commit style: `type: description`
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- Keep commits atomic and focused

## Data Engineering Patterns

- Prefer idempotent operations (re-runnable without side effects)
- Use incremental loads over full refreshes when possible
- Document data lineage and transformations
- Handle nulls explicitly

## Security

- Never commit credentials, API keys, or secrets
- Use environment variables for configuration
- Sanitize inputs in any data pipelines

## Skills and Agents

### Skills (`.claude/skills/<skill-name>/SKILL.md`)

```yaml
---
name: skill-name
description: This skill should be used when the user asks to "phrase 1", "phrase 2".
disable-model-invocation: true # Set for side effects (deploy, commit)
---
## Instructions
1. Step one
2. Step two
```

Best practices:

- Use third-person descriptions with trigger phrases in quotes
- Set `disable-model-invocation: true` for side effects
- Keep SKILL.md under 500 lines; use supporting files for details

### Agents (`.claude/agents/<agent-name>.md`)

```yaml
---
name: agent-name
description: Use this agent when [condition]. Examples:
  <example>
  user: "[request]"
  <commentary>Why this agent fits</commentary>
  </example>
tools: ["Read", "Grep", "Glob"]
model: sonnet
---

You are [expert persona]...
```

Best practices:

- Include `<example>` blocks with `<commentary>` in descriptions
- Use second person in system prompts ("You are...")
- Only include tools the agent needs

## Documentation Maintenance

When making code changes:

- Only update README.md if the change affects usage, setup, or public API
- Make minimal, targeted updates - don't rewrite entire sections
- Skip README updates for internal refactors, bug fixes, or test changes
