# Learning in Public: GitHub as a File-Based Database

This document captures the lessons learned from building a static TODO app that uses GitHub as its backend storage.

## The Idea

Build a TODO app with:

- **Zero backend** - purely static files hosted on GitHub Pages
- **Per-user data isolation** - each user stores their data in their own GitHub repo
- **Git version history** - every change is a commit, enabling time-travel

## Architecture

```
┌─────────────────────────────────────────┐
│  Static App (GitHub Pages)              │
│  - HTML/CSS/JS only                     │
│  - No server-side code                  │
│  - No user database                     │
└─────────────────────────────────────────┘
                    │
                    │ GitHub Contents API
                    │ (authenticated via PAT)
                    ▼
┌─────────────────────────────────────────┐
│  User's GitHub Repository               │
│  └── todos.json                         │
│      {                                  │
│        "todos": [                       │
│          {"id": 1, "text": "...", ...}  │
│        ]                                │
│      }                                  │
└─────────────────────────────────────────┘
```

## What Worked

### 1. Complete Data Isolation

Each user's data lives in their own repository. There's no shared database, no multi-tenancy concerns, no data leaks between users.

### 2. Built-in Version History

Every save creates a git commit. Users can:

- View history at `github.com/<user>/<repo>/commits/main/todos.json`
- Restore previous versions through GitHub UI
- See exactly when each change happened

### 3. Zero Infrastructure Cost

- Hosting: GitHub Pages (free)
- Storage: User's GitHub repo (free)
- Database: None needed
- Auth: GitHub's PAT system

### 4. User Owns Their Data

Unlike traditional SaaS, users have complete control:

- Can download/export anytime
- Can delete the repo to remove all data
- No vendor lock-in

## What Didn't Work (Pain Points)

### 1. Complex Setup Process

Users must:

1. Create a GitHub account (if they don't have one)
2. Create a private repository
3. Generate a Personal Access Token
4. Configure correct permissions
5. Match the repo name exactly in the app

**Lesson**: Every manual step is a potential failure point.

### 2. Fine-Grained PAT Confusion

GitHub's fine-grained PATs have a complex permission matrix:

- "Actions" vs "Contents" - easy to confuse
- "Repository access" must match exactly
- Editing a token requires regenerating it (new value)

**Error we encountered**: Selected "Actions: Read and write" instead of "Contents: Read and write" - similar names, very different results.

### 3. Cryptic Error Messages

GitHub API errors like "Not Found" or "Resource not accessible by personal access token" don't tell users:

- Is it the repo name?
- Is it the token permissions?
- Is it the repository access scope?

We had to add custom error message mapping to help users diagnose issues.

### 4. Dual-Folder Deployment Issue

Our GitHub Pages workflow deployed from `/public` but we edited files in `/projects`. Changes weren't going live because we forgot to sync the folders.

**Lesson**: Keep deployment paths simple. Either deploy from root or use a build step.

## Security Analysis

| Aspect         | Assessment                                               |
| -------------- | -------------------------------------------------------- |
| Data isolation | ✅ Excellent - each user has their own repo              |
| Token storage  | ⚠️ Mediocre - localStorage is vulnerable to XSS          |
| Token scope    | ✅ Good - fine-grained PAT limits blast radius           |
| Attack surface | ⚠️ If static site is compromised, tokens could be stolen |

### Recommendation

Fine-grained PATs scoped to a single repo are safer than classic PATs with `repo` scope. Even if leaked, damage is limited to one repository.

## Alternative Approaches Considered

| Approach              | Pros                 | Cons                              |
| --------------------- | -------------------- | --------------------------------- |
| **localStorage only** | Zero setup, instant  | No sync across devices            |
| **GitHub Gist**       | Simpler API          | Less private, no folder structure |
| **Supabase/Firebase** | Better UX, real auth | Requires account, has limits      |
| **IndexedDB + sync**  | Offline-first, fast  | More complex to implement         |

## Code Patterns

### Optimistic Updates with Rollback

```javascript
// Update UI immediately
todos.push(newTodo);
renderTodos();

try {
  // Then sync to backend
  await saveTodos(todos);
} catch (error) {
  // Rollback on failure
  todos.pop();
  renderTodos();
  showError(error.message);
}
```

### SHA-based Conflict Detection

GitHub's Contents API requires the current file SHA for updates. This prevents overwriting concurrent changes:

```javascript
// First save: no SHA (creates file)
await saveTodos(todos, null);

// Subsequent saves: include SHA
await saveTodos(todos, currentSha);
// If file changed, GitHub returns 409 Conflict
```

## Verdict

**Is this approach practical?**

- For developers who understand GitHub: Yes, it's a clever hack
- For general users: No, the setup friction is too high

**Would I use this again?**
For a personal tool where I'm the only user: Yes.
For a product with non-technical users: No.

## Live Demo

- App: https://ngnnah.github.io/I-And-AI/projects/github-todo-app/
- Source: https://github.com/ngnnah/I-And-AI/tree/main/projects/github-todo-app

## Files

```
├── index.html      # UI with setup instructions
├── app.js          # Core logic, GitHub API integration
├── app.test.js     # Unit tests
├── e2e.test.js     # Playwright E2E tests
├── LEARNINGS.md    # This file
└── README.md       # Usage instructions
```
