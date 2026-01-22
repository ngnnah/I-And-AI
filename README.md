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
| `dag-validator`    | Validate DAG structures in Airflow/dbt/Prefect pipelines    |
| `code-architect`   | Design and plan code structure before implementation        |
| `code-simplifier`  | Reduce complexity and improve readability                   |
| `data-io-verifier` | Verify data integrity at input/output boundaries            |
| `test-generator`   | Generate pytest test cases for data engineering Python code |

## Claude Skills

Custom skills available in this workspace:

| Skill              | Description                                      |
| ------------------ | ------------------------------------------------ |
| `/commit`          | Create well-crafted git commits                  |
| `/pr`              | Create GitHub pull requests                      |
| `/sql`             | Write, optimize, or explain SQL queries          |
| `/review`          | Code review for bugs, security, and style        |
| `/skill-creator`   | Create new skills and agents for Claude Code     |
| `/validate-skills` | Validate skills and agents follow best practices |

## Tech Stack

- **Languages**: Python, SQL
- **Data**: PostgreSQL, dbt
- **Tools**: Claude Code, GitHub CLI, Linear
