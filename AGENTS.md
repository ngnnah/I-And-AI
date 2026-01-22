# AGENTS.md

Instructions for AI agents working in this repository.

## Context

This is a personal learning repository for a data engineer working in B2G telecom software. The focus is on AI-assisted development workflows and data engineering.

## Guidelines

### Code Style
- Python: Follow PEP 8, use type hints for function signatures
- SQL: Uppercase keywords, lowercase identifiers, use CTEs over nested subqueries
- Keep files focused and small; split when exceeding ~200 lines

### Commits
- Use conventional commit style: `type: description`
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- Keep commits atomic and focused

### Data Engineering Patterns
- Prefer idempotent operations (re-runnable without side effects)
- Use incremental loads over full refreshes when possible
- Document data lineage and transformations
- Handle nulls explicitly

### Security
- Never commit credentials, API keys, or secrets
- Use environment variables for configuration
- Sanitize inputs in any data pipelines

## Project Management

This workspace has Linear integration enabled. Use Linear MCP tools for:
- Creating and updating issues
- Tracking work progress
- Linking commits to issues
