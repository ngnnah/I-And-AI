# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context

Personal project repository focused on:
- Educational games and interactive web apps (GitHub Pages)
- AI-assisted development workflows
- Rapid MVP prototyping and iteration

**Live site:** https://ngnnah.github.io/I-And-AI/

## Core Philosophy: "Ship Fast, Iterate Smart"

- **Bias for action** - Working MVP beats perfect architecture
- **Progressive complexity** - Start simple, scale based on real usage
- **User delight first** - Playability and UX over technical perfection
- **Test what matters** - Focus on core game logic and critical user flows

## MCP Integrations

- **Linear**: Issue tracking and project management
- **Context7**: Up-to-date library documentation
- **GitKraken**: Enhanced git operations and PR workflows

## Python Environment

This project uses **uv** for package and environment management.

- Run Python scripts: `uv run script.py`
- Run tools (pytest, ruff, etc.): `uv run pytest`, `uv run ruff check`
- Add dependencies: `uv add <package>`
- Add dev dependencies: `uv add --dev <package>`
- Sync environment: `uv sync`

Always use `uv run` instead of activating the venv manually or calling `python` directly.

## New Project Development: Plan First

**CRITICAL WORKFLOW:** When starting any new project (app/game/product/major feature):

1. **Create a planning document FIRST** - Do NOT jump to implementation
2. **Use modern frameworks** - Prefer mature tools over vanilla JS/CSS:
   - Games: Phaser.js, PixiJS, Kaboom.js, Godot
   - Apps: Astro, Next.js, SvelteKit (see `.github/copilot-instructions.md` for full stack)
   - UI: Tailwind CSS + shadcn/ui or DaisyUI
3. **Present for review** - Share architecture, tech choices, file structure for approval
4. **Wait for approval** - Begin implementation only after plan is reviewed

### Planning Document Template

```markdown
# [Project Name] - Implementation Plan

## Overview
- Purpose: [concise description]
- Users: [target audience]
- MVP features: [core functionality only]

## Tech Stack
- Framework: [specific tool + version]
- UI: [styling approach]
- State: [management solution]
- Backend: [if needed]
- Testing: [strategy]

## Architecture
```
project-name/
├── src/
│   ├── components/
│   ├── state/
│   └── utils/
├── package.json
└── [config files]
```

## Key Data Models
[State structure, types, interfaces]

## User Flows
1. [Primary flow]
2. [Secondary flow]

## Implementation Phases
1. [Setup & scaffolding]
2. [Core features]
3. [Polish & deploy]

## Open Questions
- [Decisions needed]
```

## Repository Structure

```text
.
├── projects/           # Source code (edit here first)
│   ├── pokemon-math-world/
│   ├── iron-academy/
│   ├── github-todo-app/
│   └── gaming/
│       ├── nanja-monja/
│       ├── codenames/
│       └── ito/
├── public/            # GitHub Pages deployment (sync from projects/)
│   ├── index.html     # Landing page
│   └── projects/      # Deployed copies
├── .claude/           # AI agent workflows and skills
│   ├── agents/        # Specialized development modes
│   └── skills/        # Reusable automation patterns
└── tools/             # Python utilities (datetime, pdf)
```

## Modern Stack for Rapid Development (2026)

### Game Frameworks
- **Phaser.js** - 2D games (arcade, platformer, puzzle)
- **PixiJS** - High-performance 2D rendering
- **Three.js / React Three Fiber** - 3D games
- **Kaboom.js** - Simple game programming
- **Godot HTML5** - Full game engine

### App Frameworks
- **Astro** - Static-first (perfect for GitHub Pages)
- **Next.js** - React with SSG mode
- **SvelteKit** - Svelte with static adapter
- **Vite + React/Vue/Svelte** - Fast dev builds

### UI & Styling
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - React components on Radix
- **DaisyUI** - Tailwind component library
- **UnoCSS** - Instant atomic CSS

### Multiplayer & Backend
- **Supabase** - Postgres + Realtime + Auth
- **Colyseus** - Multiplayer game server
- **PartyKit** - Realtime edge computing
- **Firebase** - Current choice for simple multiplayer

### State Management
- **Zustand** - Minimal, flexible
- **Jotai** - Atomic state
- **TanStack Query** - Server state, caching

### Testing
- **Vitest** - Vite-native testing
- **Testing Library** - User-centric testing
- **Playwright** - E2E testing (current choice)

## Code Style

**JavaScript/Web:**
- Descriptive names: `currentPlayer`, not `p`
- Semantic HTML with ARIA labels
- Mobile-first, responsive by default
- Test core logic, skip CSS details
- Accessibility: keyboard nav, screen readers

**Python:**
- Follow PEP 8, use type hints
- Keep files focused

## Commits

- Use conventional commit style: `type: description`
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- Keep commits atomic and focused

## Security

- Never commit credentials, API keys, or secrets
- Use environment variables for configuration
- Sanitize inputs in any data pipelines
- Check for XSS vulnerabilities in web apps
- Verify Firebase security rules

## Development Workflow

### Standard Development Cycle

1. **Implement** changes in `projects/<app>/`
2. **Test locally** (open HTML directly or use local server)
3. **Sync** to `public/projects/<app>/` for deployment
4. **Update** `public/index.html` if adding/removing projects
5. **Commit & push** to `main` (auto-deploys via GitHub Actions)

### Sync Example

```bash
rsync -av --delete --exclude='.git' --exclude='node_modules' \
  projects/gaming/codenames/ public/projects/gaming/codenames/
```

### Important Git Gotcha

- `.gitignore` excludes `data/` globally (matches `js/data/`)
- **Must force-add** game data: `git add -f path/to/js/data/*.js`
- Do this for **both** `projects/` and `public/` copies

## Testing Priorities

**Test:** Game logic (scoring, win conditions, turn validation), state transitions, critical user flows
**Skip:** CSS details, animation timing, UI text, third-party library internals

```bash
npm test              # Vitest/Jest tests
npm run test:e2e      # Playwright E2E  
uv run pytest         # Python utilities
```

## Current Projects

**Educational Games** (Pokemon Math World, Iron Academy)
- Level progression, immediate feedback, local storage
- Structure: `js/data/`, `js/game/`, `js/screens/`

**Multiplayer Games** (Nanja Monja, Codenames, Ito)  
- Firebase Realtime sync, optimistic UI, room codes
- Structure: `firebase-config.js`, `firebase-sync.js`, `game-state.js`, `game-logic.js`

**GitHub TODO App**
- Static app using GitHub Contents API, PAT storage

## Quick Reference

**Game State Pattern:** Phase-based FSM, player map, board array, score object
**Firebase Sync:** Listen on `gameRef.on('value')`, optimistic UI with rollback
**Local Storage:** JSON stringify/parse wrapper
**Responsive Grid:** `grid-template-columns: repeat(auto-fit, minmax(120px, 1fr))`

## Troubleshooting

**Firebase issues** → Check credentials, security rules, network
**Game desyncs** → Verify atomic updates, handle race conditions
**GitHub Pages 404** → Use relative paths, verify rsync, force-add data files
**Flaky tests** → Mock randomness/timers, clean up listeners, reset state

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
