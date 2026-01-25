# GitHub TODO App

A static TODO app that uses GitHub as a file-based database. Your todos are stored in your own private GitHub repository.

**Live Demo**: https://ngnnah.github.io/I-And-AI/projects/github-todo-app/

## ⚠️ SECURITY: READ THIS FIRST

This app requires a GitHub Personal Access Token (PAT). **Misconfiguring your token can expose your repositories.**

### DO use Fine-Grained PAT with:

- ✅ **Repository access**: "Only select repositories" → select ONLY your todo repo
- ✅ **Permission**: Contents → Read and write
- ✅ **Expiration**: 90 days or less

### DON'T use:

- ❌ Classic PAT with `repo` scope (grants access to ALL your repos)
- ❌ Fine-grained PAT with "All repositories" access
- ❌ Any permissions beyond "Contents: Read and write"

### Why This Matters

| Token Type             | If Leaked, Attacker Can...             |
| ---------------------- | -------------------------------------- |
| Fine-grained (correct) | Only read/write your todo list         |
| Classic with `repo`    | Access ALL your public & private repos |

## How It Works

```
┌─────────────────────────────────────────┐
│  Static App (GitHub Pages)              │
│  - No backend, no server                │
│  - Your token stays in YOUR browser     │
└─────────────────────────────────────────┘
                    │ GitHub API
                    ▼
┌─────────────────────────────────────────┐
│  Your GitHub Repository (private)       │
│  └── todos.json                         │
│      Every save = a git commit          │
└─────────────────────────────────────────┘
```

## Quick Start

### 1. Create a Private Repository

Go to https://github.com/new and create a private repo (e.g., `my-todos`)

### 2. Create a Fine-Grained PAT

1. Go to https://github.com/settings/personal-access-tokens/new
2. Configure:
   - **Token name**: `todo-app`
   - **Expiration**: 90 days
   - **Repository access**: "Only select repositories" → select your todo repo
   - **Permissions** → Repository permissions → **Contents: Read and write**

> ⚠️ **CRITICAL**: Select "Contents", NOT "Actions". They look similar but "Actions" won't work!

3. Generate and copy the token (starts with `github_pat_`)

### 3. Connect

1. Open https://ngnnah.github.io/I-And-AI/projects/github-todo-app/
2. Enter your username (e.g., `ngnnah`)
3. Enter your repo name (e.g., `my-todos` or `test-private-file-based-todo-app`)
4. Paste your token
5. (Optional) Check "Remember token" if on a personal device

## Features

- **Zero backend** - Purely static, hosted on GitHub Pages
- **You own your data** - Stored in your own GitHub repo
- **Version history** - Every change is a git commit
- **Privacy** - Use a private repo; only you can access it
- **Optional persistence** - Choose whether to remember your token

## Token Storage Security

| "Remember token" | Behavior                                                                               |
| ---------------- | -------------------------------------------------------------------------------------- |
| **Unchecked**    | Token is NOT saved. You must re-enter it each session.                                 |
| **Checked**      | Token is saved in browser localStorage. Convenient but: don't use on shared computers. |

### localStorage Risks

- Vulnerable to XSS attacks (if this site were compromised)
- Accessible to browser extensions
- Visible in browser DevTools

**Mitigation**: Fine-grained PAT limits damage. Even if stolen, attacker can only access your todo list.

## Example Setup

Using `ngnnah` as username and `test-private-file-based-todo-app` as repo:

1. Repo: https://github.com/ngnnah/test-private-file-based-todo-app
2. Fine-grained PAT scoped to only that repo
3. Permission: Contents read/write only

## Development

```bash
# Install dependencies
npm install

# Start local server
npm start

# Run unit tests
npm test

# Run E2E tests
npx playwright install
npm run test:e2e
```

## Files

```
├── index.html          # UI with security warnings
├── app.js              # Core logic, GitHub API
├── app.test.js         # Unit tests
├── e2e.test.js         # Playwright E2E tests
├── LEARNINGS.md        # Learning in public documentation
└── README.md           # This file
```

## Learning in Public

See [LEARNINGS.md](./LEARNINGS.md) for the full story of building this app, including:

- What worked and what didn't
- Security analysis
- Common errors and how to fix them
- Alternative approaches considered

## License

MIT
