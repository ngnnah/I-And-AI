# GitHub Copilot Instructions for I-And-AI

**Purpose:** Rapid MVP development of educational games, web apps, and interactive software deployed via GitHub Pages.

**Live site:** https://ngnnah.github.io/I-And-AI/

## Core Philosophy: "Ship Fast, Iterate Smart"

- **Bias for action** - Working MVP beats perfect architecture
- **Progressive complexity** - Start simple, scale based on real usage
- **User delight first** - Playability and UX over technical perfection
- **Test what matters** - Focus on core game logic and critical user flows

## New Project Workflow: Plan Before Implementation

**CRITICAL:** For any new project (app/game/product/major feature), **create a high-level overview/plan for manual review FIRST**. Do NOT jump straight to implementation.

### Planning Phase (Required)

1. **Understand scope** - Clarify core features, user flows, and success criteria
2. **Choose modern tools** - Select appropriate frameworks from the Modern Stack section below
   - **Prefer mature frameworks over vanilla JS/CSS** - Bootstrap into optimal MVP from start
   - For games: Phaser.js, PixiJS, or Godot over manual canvas
   - For apps: Astro, Next.js, or SvelteKit over plain HTML/JS
   - For UI: Tailwind CSS + shadcn/ui over custom CSS
3. **Design architecture** - Propose file structure, state management, data flows
4. **List dependencies** - package.json, build tools, deployment config
5. **Present for review** - Share plan as markdown for approval before coding

### Implementation Phase (After Approval)

- Follow the approved architecture
- Use Standard Development Cycle (see below)
- Iterate based on feedback

**Example Plan Template:**

```markdown
# [Project Name] - Implementation Plan

## Overview
- **Purpose:** [1-2 sentence description]
- **Target users:** [who will use this]
- **Core features:** [bullet list of MVP features]

## Tech Stack
- **Framework:** [e.g., Astro + React]
- **UI:** [e.g., Tailwind CSS + DaisyUI]
- **State:** [e.g., Zustand]
- **Backend:** [e.g., Supabase] (if needed)
- **Testing:** [e.g., Vitest + Playwright]

## Architecture
- File structure (show key directories)
- Data models/state structure
- Key user flows (numbered steps)

## Implementation Steps
1. [Setup and scaffolding]
2. [Core feature A]
3. [Core feature B]
4. [Testing and deployment]

## Open Questions
- [Any uncertainties or choices needing input]
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
│       └── codenames/
├── public/            # GitHub Pages deployment (sync from projects/)
│   ├── index.html     # Landing page
│   └── projects/      # Deployed copies
├── .claude/           # AI agent workflows and skills
│   ├── agents/        # Specialized development modes
│   └── skills/        # Reusable automation patterns
└── tools/             # Python utilities (datetime, pdf)
```

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

- `.gitignore` excludes `data/` globally, which matches `js/data/`
- **Must force-add** game data files: `git add -f path/to/js/data/*.js`
- Do this for **both** `projects/` and `public/` copies

## Modern Stack for Rapid Development (2026)

### Game Frameworks - Choose based on project needs
- **Phaser.js** - 2D game framework (arcade, platformer, puzzle games)
- **PixiJS** - High-performance 2D rendering (animations, visual effects)
- **Three.js / React Three Fiber** - 3D games, immersive experiences
- **Kaboom.js** - Simple game programming library for beginners
- **Godot HTML5** - Full game engine with web export capability

### App Frameworks - Modern meta-frameworks
- **Astro** - Static-first, zero JS by default (perfect for GitHub Pages)
- **Next.js** - React framework with SSG mode (export as static HTML)
- **SvelteKit** - Svelte with static adapter for GitHub Pages
- **Solid Start** - Solid.js meta-framework with static generation
- **Vite + React/Vue/Svelte** - Fast dev server, static builds

### UI & Styling - Speed over custom CSS
- **Tailwind CSS** - Utility-first CSS, rapid prototyping
- **shadcn/ui** - Copy-paste React components built on Radix
- **DaisyUI** - Tailwind component library for quick UIs
- **UnoCSS** - Instant on-demand atomic CSS
- **Panda CSS** - Zero-runtime CSS-in-JS with type safety

### Multiplayer & Backend
- **Supabase** - Postgres + Realtime + Auth (Firebase alternative)
- **Colyseus** - Multiplayer game server framework (room-based)
- **PartyKit** - Realtime multiplayer with edge computing
- **Convex** - Reactive backend with real-time sync
- **Firebase** - Current choice, still good for simple multiplayer

### State Management
- **Zustand** - Minimal, flexible state management
- **Jotai** - Atomic state, React-friendly
- **Nanostores** - Framework-agnostic, 300 bytes
- **TanStack Query** - Server state management, caching

### Build & Dev Tools
- **Vite** - Fast dev server, HMR, optimized builds
- **Bun** - All-in-one toolkit (runtime, bundler, test runner)
- **Turbopack** - Rust-powered successor to Webpack (Next.js)

### Testing - Modern, fast alternatives
- **Vitest** - Vite-native testing (Jest-compatible, faster)
- **Testing Library** - User-centric component testing
- **Playwright** - E2E testing (current choice, keep)

## Code Standards (Keep Simple)

- **Descriptive names** - `currentPlayer`, not `p`
- **Semantic HTML** - Use proper elements, ARIA labels
- **Mobile-first** - Responsive by default, touch-friendly
- **Test core logic** - Game rules, scoring, state transitions
- **Accessibility** - Keyboard nav, screen readers, contrast

## Development Modes (Specialize When Needed)

**Architecture Planning** - Design game mechanics, state structure, data flows
**Code Simplification** - Refactor complex logic, reduce duplication  
**Test Generation** - Add test coverage for game rules and state transitions
**Code Review** - Check for XSS, race conditions, memory leaks, accessibility

## MCP Integrations

- **Linear**: Issue tracking and project management
- **Context7**: Up-to-date library documentation
- **GitKraken**: Enhanced git operations and PR workflows

## Available Skills (`.claude/skills/`)

| Skill              | Trigger                                 |
| ------------------ | --------------------------------------- |
| `commit`           | create git commits                      |
| `pr`               | create GitHub pull requests             |
| `review`           | code review for bugs, security          |
| `datetime`         | time, timezone, date calculations       |
| `calc`             | calculations, unit conversions, math    |
| `seasons`          | Japanese micro-season awareness         |
| `check-links`      | validate internal links, relative paths |
| `validate-urls`    | check external URLs for link rot        |
| `data-pipeline`    | generate ETL/ELT pipelines              |
| `sql`              | write, optimize, explain SQL            |
| `pdf`              | read and analyze PDFs                   |
| `ics`              | create calendar events from bookings    |
| `web-screenshot`   | save images from web content            |
| `skill-creator`    | create new skills/agents                |
| `validate-skills`  | audit .claude/ directory                |

## Current Projects

**Educational Games** (Pokemon Math World, Iron Academy)
- Level progression, immediate feedback, local storage for progress
- Structure: `js/data/`, `js/game/`, `js/screens/`

**Multiplayer Games** (Nanja Monja, Codenames)  
- Firebase Realtime sync, optimistic UI updates, room codes
- Structure: `firebase-config.js`, `firebase-sync.js`, `game-state.js`, `game-logic.js`

**GitHub TODO App**
- Static app using GitHub Contents API, PAT storage, no backend

## Testing Priorities

**Test:** Game logic (scoring, win conditions, turn validation), state transitions, critical user flows
**Skip:** CSS details, animation timing, UI text, third-party library internals

```bash
npm test              # Vitest/Jest tests
npm run test:e2e      # Playwright E2E  
uv run pytest         # Python utilities (root)
```

## Deployment to GitHub Pages

**Workflow:** Push to `main` → `.github/workflows/deploy.yml` → Deploys `./public` directory

**Critical steps:**
1. Implement in `projects/<app>/`
2. Sync to `public/projects/<app>/` with rsync
3. Force-add data files: `git add -f path/to/js/data/*.js` (`.gitignore` excludes `data/`)
4. Commit & push to `main`

**Common issues:**
- Missing data files → Force-add with `-f` flag
- 404 errors → Use relative paths, check file sync
- Firebase not connecting → Verify project ID in config

## Code Quality Checklist

**Before committing:** Functionality works, tests added, no XSS/memory leaks, accessible, mobile-responsive

## Python Environment

Use **uv** for Python utilities:
```bash
uv run python tools/datetime_util.py    # Date calculations
uv add <package>                        # Add dependency
```

## Conventions

**Commits:** `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:` (conventional format)
**Docs:** Update README only for new projects, setup changes, or public API changes
**Security:** Never commit secrets, sanitize user input, use HTTPS only
**Performance:** Lazy load assets, debounce events, batch DOM updates, clean up listeners

## Quick Reference

**Game State Pattern:** Phase-based FSM, player map, board array, score object
**Firebase Sync:** Listen on `gameRef.on('value')`, optimistic UI updates with rollback
**Local Storage:** JSON stringify/parse wrapper for save/load
**Responsive Grid:** `grid-template-columns: repeat(auto-fit, minmax(120px, 1fr))`

## Troubleshooting

**Firebase issues** → Check credentials, security rules, network
**Game desyncs** → Verify atomic updates, handle race conditions
**GitHub Pages 404** → Use relative paths, verify rsync, force-add data files
**Flaky tests** → Mock randomness/timers, clean up listeners, reset state

## Project Ideas

Educational games, multiplayer board games, productivity tools, creative apps, data visualizations

---

**Ship MVPs fast. Iterate based on real usage. Perfect is the enemy of good.**
