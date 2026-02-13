# I-And-AI

AI-assisted mini-project workspace focused on educational games and lightweight web apps, deployed via GitHub Pages.

**Live site:** https://ngnnah.github.io/I-And-AI/

## What this repo contains

This repository is split between:

- `projects/`: source-first development copies
- `public/`: GitHub Pages deployment artifact (served as-is by Actions)

The current portfolio includes:

- **Pokemon Math World** (`projects/pokemon-math-world`)  
  Multi-level math game for elementary learners (addition, subtraction, multiplication, division, word problems).
- **Iron Academy** (`projects/iron-academy`)  
  Story-driven Grade 5-6 math game with hints, explanations, and local progress.
- **GitHub TODO App** (`projects/github-todo-app`)  
  Static TODO app that stores tasks in a user-owned GitHub repo through the Contents API.
- **Nanja Monja** (`projects/gaming/nanja-monja`)  
  Real-time multiplayer memory card game.
- **Codenames** (`projects/gaming/codenames`)  
  Real-time multiplayer team word game.

## Repository layout

```text
.
├── .github/workflows/deploy.yml    # Deploys GitHub Pages from ./public on push to main
├── CLAUDE.md                       # Workspace guidance for AI-assisted development
├── projects/                       # Source projects (edit here first)
│   ├── pokemon-math-world/
│   ├── iron-academy/
│   ├── github-todo-app/
│   └── gaming/
│       ├── nanja-monja/
│       └── codenames/
├── public/                         # Published site root for GitHub Pages
│   ├── index.html                  # Landing page linking to projects
│   └── projects/
├── resources/screenshots/          # Documentation screenshots
└── tools/                          # Small Python helpers (date/pdf utilities)
```

## Development workflow

1. Implement changes in `projects/<app>/`.
2. Validate locally (open directly or run a local static server).
3. Sync deployable files into `public/projects/<app>/`.
4. Update `public/index.html` when adding/removing a project.
5. Commit + push to `main` (GitHub Actions deploys automatically).

### Sync example

```bash
rsync -av --delete --exclude='.git' --exclude='node_modules' \
  projects/gaming/codenames/ public/projects/gaming/codenames/
```

## Local run and tests

### Python tooling (root)

This repo uses `uv` (see `pyproject.toml`):

```bash
uv sync
uv run python tools/datetime_util.py
uv run python tools/pdf_util.py --help
```

### GitHub TODO App

```bash
cd projects/github-todo-app
npm install
npm start
npm test
npm run test:e2e
```

### Nanja Monja

```bash
cd projects/gaming/nanja-monja
npm test
npm run test:watch
```

### Codenames

```bash
cd projects/gaming/codenames
npm test
```

## Deployment

- Workflow file: `.github/workflows/deploy.yml`
- Trigger: push to `main` (or manual dispatch)
- Publish source: `./public`
- URL: https://ngnnah.github.io/I-And-AI/

## Important repo conventions

- Keep source and deployed copies in sync (`projects/` and `public/projects/`).
- `data/` is ignored globally in `.gitignore`; if a project uses `js/data/`, add those files with `git add -f` when needed.
- Avoid committing secrets/tokens; e.g. the TODO app should use fine-grained GitHub PATs scoped to one repository.

## Ongoing development priorities

- Keep each project README current when behavior or setup changes.
- Add test coverage when changing game logic in multiplayer apps.
- Prefer small, isolated changes and keep deploy sync steps explicit in commits.
