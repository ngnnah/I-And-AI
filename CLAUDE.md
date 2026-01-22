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

## Documentation Maintenance

When making code changes:

- Only update README.md if the change affects usage, setup, or public API
- Make minimal, targeted updates - don't rewrite entire sections
- Skip README updates for internal refactors, bug fixes, or test changes
