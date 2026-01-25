# I-And-AI

Personal workspace for learning and applying AI tools in data engineering workflows. A space for collaboration between human and AI—experiments, workflows, and growth.

## About

This repo documents my journey integrating AI-assisted development into daily life and work:

- **AI-powered coding**: Using Claude Code, Cursor, and other AI dev tools
- **Data engineering workflows**: ETL pipelines, SQL optimization, data modeling
- **Automation**: Streamlining repetitive tasks with AI assistance
- **Learning notes**: Patterns, prompts, and techniques that work

## Mini-Projects (GitHub Pages)

Interactive web apps deployed at **https://ngnnah.github.io/I-And-AI/**

| Project                                                                                     | Description                                                                                                                           | Tech         |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| [Pokemon Math](https://ngnnah.github.io/I-And-AI/projects/pokemon-math/)                    | Beginner: Simple addition (0-10), 2 choices, big buttons. Perfect for 1st graders.                                                    | HTML/JS, PWA |
| [Pokemon Math Adventure](https://ngnnah.github.io/I-And-AI/projects/pokemon-math-advanced/) | Advanced: 9 chapters, gym battles, 25+ Pokemon. Addition, subtraction, missing numbers (0-25). Team building, badges, full storyline. | HTML/JS, PWA |
| [Iron Academy](https://ngnnah.github.io/I-And-AI/projects/iron-academy/)                    | Math learning game (Grade 5-6) with Tony Stark theme. Feynman explanations, SAT vocabulary builder, 3 attempts per question.          | HTML/JS, PWA |
| [GitHub TODO](https://ngnnah.github.io/I-And-AI/projects/github-todo-app/)                  | Client-side TODO app using GitHub API as backend                                                                                      | HTML/JS      |

## Structure

```
.
├── .claude/
│   ├── agents/        # Specialized subagents for complex workflows
│   ├── hooks/         # Automated checks on file operations
│   └── skills/        # Custom slash commands
├── .github/
│   └── workflows/     # CI/CD for GitHub Pages deployment
├── projects/          # Source code for mini-projects
│   ├── iron-academy/
│   └── github-todo-app/
├── public/            # GitHub Pages root (auto-deployed)
│   └── projects/
├── CLAUDE.md          # Claude Code workspace config
└── README.md
```

## Hooks

Automated checks that run on file operations:

| Hook              | Trigger           | Purpose                                     |
| ----------------- | ----------------- | ------------------------------------------- |
| `protect-secrets` | Before Edit/Write | Prevents committing secrets and credentials |
| `format`          | After Edit/Write  | Auto-formats files after editing            |

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
| 2026-01-25 | Added Pokemon Math Adventure (9 chapters, gym battles, 25+ Pokemon) |
| 2026-01-25 | Added Pokemon Math Beginner for 1st graders (addition 0-10)         |
| 2026-01-25 | Added Iron Academy math game with mobile/iOS support                |
| 2026-01-25 | Set up GitHub Pages with CI/CD deployment                           |
| 2026-01-24 | Added GitHub TODO app mini-project                                  |
| 2026-01-22 | Added `/check-links`, `/validate-urls`, `/web-screenshot` skills    |
| 2026-01-22 | Added `/seasons` skill for Japanese micro-season awareness          |
| 2026-01-22 | Added utility skills: `/calc`, `/datetime`, `/pdf`, `/ics`          |
| 2026-01-22 | Added `data-profiler` agent and `/data-pipeline` skill              |
| 2026-01-22 | Added `test-generator` agent for pytest generation                  |
| 2026-01-22 | Added `/skill-creator` and `/validate-skills` skills                |
| 2026-01-22 | Added Documentation Maintenance guidelines to CLAUDE.md             |
| 2026-01-22 | Added secrets protection hook and skills validation hook            |
| 2026-01-22 | Initial setup: 4 data engineering agents, 4 core skills, Linear MCP |
