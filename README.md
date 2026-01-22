# ready-nhat-ai

Personal workspace for learning and applying AI tools in data engineering workflows.

## About

I'm a data engineer at a B2G software platform company in telecom. This repo documents my journey integrating AI-assisted development into daily work:

- **AI-powered coding**: Using Claude Code, Cursor, and other AI dev tools
- **Data engineering workflows**: ETL pipelines, SQL optimization, data modeling
- **Automation**: Streamlining repetitive tasks with AI assistance
- **Learning notes**: Patterns, prompts, and techniques that work

## Structure

```
.
├── .claude/
│   ├── agents/        # Specialized subagents for complex workflows
│   └── skills/        # Custom slash commands
├── AGENTS.md          # Instructions for AI agents working in this repo
├── CLAUDE.md          # Claude Code workspace config
└── README.md
```

## Subagents

Specialized agents for data engineering workflows:

| Agent              | Purpose                                                     |
| ------------------ | ----------------------------------------------------------- |
| `code-architect`   | Design and plan code structure before implementation        |
| `code-simplifier`  | Reduce complexity and improve readability                   |
| `dag-validator`    | Validate DAG structures in Airflow/dbt/Prefect pipelines    |
| `data-io-verifier` | Verify data integrity at input/output boundaries            |
| `data-profiler`    | Profile and analyze data from CSV, Excel, DOCX, PDF files   |
| `test-generator`   | Generate pytest test cases for data engineering Python code |

## Claude Skills

Custom skills available in this workspace:

| Skill              | Description                                       |
| ------------------ | ------------------------------------------------- |
| `/calc`            | Perform calculations and unit conversions         |
| `/check-links`     | Validate internal links and relative paths        |
| `/commit`          | Create well-crafted git commits                   |
| `/data-pipeline`   | Generate ETL/ELT pipeline code                    |
| `/datetime`        | Date, time, and timezone conversions              |
| `/ics`             | Extract events and generate .ics calendar files   |
| `/pdf`             | Read, extract, and analyze PDF documents          |
| `/pr`              | Create GitHub pull requests                       |
| `/review`          | Code review for bugs, security, and style         |
| `/seasons`         | Display current Japanese micro-season (kō)        |
| `/skill-creator`   | Create new skills and agents for Claude Code      |
| `/sql`             | Write, optimize, or explain SQL queries           |
| `/validate-skills` | Validate skills and agents follow best practices  |
| `/validate-urls`   | Validate external URLs and capture screenshots    |
| `/web-screenshot`  | Save web images to git-tracked screenshots folder |

## Tech Stack

- **Languages**: Python, SQL
- **Data**: PostgreSQL, dbt
- **Tools**: Claude Code, GitHub CLI, Linear

## Changelog

| Date       | Change                                                              |
| ---------- | ------------------------------------------------------------------- |
| 2026-01-22 | Added `/check-links`, `/validate-urls`, `/web-screenshot` skills    |
| 2026-01-22 | Added `/seasons` skill for Japanese micro-season awareness          |
| 2026-01-22 | Added utility skills: `/calc`, `/datetime`, `/pdf`, `/ics`          |
| 2026-01-22 | Added `data-profiler` agent and `/data-pipeline` skill              |
| 2026-01-22 | Added `test-generator` agent for pytest generation                  |
| 2026-01-22 | Added `/skill-creator` and `/validate-skills` skills                |
| 2026-01-22 | Added Documentation Maintenance guidelines to CLAUDE.md             |
| 2026-01-22 | Added secrets protection hook and skills validation hook            |
| 2026-01-22 | Initial setup: 4 data engineering agents, 4 core skills, Linear MCP |
