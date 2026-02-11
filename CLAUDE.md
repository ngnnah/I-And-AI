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

### Available Skills

| Skill              | Trigger                                 |
| ------------------ | --------------------------------------- |
| `/calc`            | calculations, unit conversions, math    |
| `/check-links`     | validate internal links, relative paths |
| `/commit`          | create git commits                      |
| `/data-pipeline`   | generate ETL/ELT pipelines              |
| `/datetime`        | time, timezone, date calculations       |
| `/ics`             | create calendar events from bookings    |
| `/pdf`             | read and analyze PDFs                   |
| `/pr`              | create GitHub pull requests             |
| `/review`          | code review for bugs, security          |
| `/seasons`         | Japanese micro-season awareness         |
| `/skill-creator`   | create new skills/agents                |
| `/sql`             | write, optimize, explain SQL            |
| `/validate-skills` | audit .claude/ directory                |
| `/validate-urls`   | check external URLs for link rot        |
| `/web-screenshot`  | save images from web content            |

### Available Agents

| Agent              | Use When                                      |
| ------------------ | --------------------------------------------- |
| `data-profiler`    | analyzing CSV, Excel, PDF, DOCX data files    |
| `code-architect`   | planning code structure before implementation |
| `code-simplifier`  | reducing complexity, improving readability    |
| `dag-validator`    | validating DAG structures in pipelines        |
| `data-io-verifier` | verifying data integrity at boundaries        |
| `test-generator`   | generating pytest test cases                  |

## Deployment (GitHub Pages)

This repo deploys to GitHub Pages from the `public/` directory on `main`.

- **Deploy process**: Copy project files to `public/` then commit and push
  - Example: `rsync -av --delete --exclude='.git' --exclude='node_modules' projects/gaming/codenames/ public/projects/gaming/codenames/`
- **Gotcha — `.gitignore` `data/` pattern**: The gitignore has `data/` which matches any `data/` directory, including `js/data/`. Files in `js/data/` (e.g., `word-lists.js`, `game-modes.js`) must be force-added: `git add -f path/to/js/data/file.js` for both `projects/` and `public/` copies.
- After pushing, GitHub Pages rebuilds automatically (takes ~1 min)

## Documentation Maintenance

When making code changes:

- Only update README.md if the change affects usage, setup, or public API
- Make minimal, targeted updates - don't rewrite entire sections
- Skip README updates for internal refactors, bug fixes, or test changes
