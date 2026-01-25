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
                    │ GitHub Contents API
                    ▼
┌─────────────────────────────────────────┐
│  Your GitHub Repository (private)       │
│  └── todos.json                         │
│      Every save = a git commit          │
└─────────────────────────────────────────┘
```

### Why Saves Are Instant

When you add/toggle/delete a todo:

1. **UI updates immediately** (optimistic update)
2. **HTTP PUT request sent to GitHub API** - happens right away, not batched
3. **GitHub commits the change** - creates a new version in git history
4. **If save fails** - UI rolls back to previous state

This means even if you disconnect 1 second after adding a todo, the save request was already sent to GitHub.

### Git Version History

Every save creates a commit. You can:

- View history: `github.com/<user>/<repo>/commits/main/todos.json`
- Restore previous versions through GitHub UI
- See exactly when each change happened

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
3. Enter your repo name (e.g., `my-todos` or `git-based-todo-app`)
4. Paste your token
5. (Optional) Check "Remember token" if on a personal device

## Features

- **Zero backend** - Purely static, hosted on GitHub Pages
- **You own your data** - Stored in your own GitHub repo
- **Version history** - Every change is a git commit
- **Instant saves** - Changes sent to GitHub immediately
- **Offline rollback** - Failed saves revert the UI

## Token Storage

| "Remember token" | Behavior                                                    |
| ---------------- | ----------------------------------------------------------- |
| **Unchecked**    | Token NOT saved. Re-enter each session. More secure.        |
| **Checked**      | Token saved in localStorage. Don't use on shared computers. |

**Risk**: localStorage is vulnerable to XSS. Mitigation: fine-grained PAT limits damage to just your todo repo.

## Example

Using `ngnnah` as username and `git-based-todo-app` as repo:

- **Repo**: https://github.com/ngnnah/git-based-todo-app
- **Todos stored at**: https://github.com/ngnnah/git-based-todo-app/blob/main/todos.json (private)
- **Fine-grained PAT**: scoped to only that repo, Contents read/write only

### How Sync Works

```
You click "Add"
      ↓
┌─────────────────────────────────────────────────────┐
│ 1. Todo added to local array                        │
│ 2. UI re-renders (instant feedback)                 │
│ 3. PUT request sent to GitHub Contents API          │
│    → GitHub base64-decodes the content              │
│    → GitHub commits new todos.json                  │
│    → Returns new file SHA                           │
│ 4. App stores SHA for next update                   │
└─────────────────────────────────────────────────────┘
      ↓
todos.json updated in your repo (new git commit created)
```

The SHA ensures you don't overwrite concurrent changes - if someone else edited the file, GitHub returns a conflict error.

## Development

```bash
npm install      # Install dependencies
npm start        # Start local server
npm test         # Run unit tests
npm run test:e2e # Run E2E tests (requires: npx playwright install)
```

## License

MIT
