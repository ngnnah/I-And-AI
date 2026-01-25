# GitHub TODO App

A static TODO app that uses GitHub as a filesystem database. Each user's TODOs are stored in their own private GitHub repository.

## How It Works

```
┌─────────────────────────────────────────┐
│  Static App (GitHub Pages)              │
│  - No user data stored here             │
│  - Just UI + logic                      │
└─────────────────────────────────────────┘
                    │ GitHub API
                    ▼
┌─────────────────────────────────────────┐
│  Your GitHub Account                    │
│  └── my-todos (private repo)            │
│      └── todos.json                     │
└─────────────────────────────────────────┘
```

## Setup

### 1. Create a Private Repository

Create a new private repository on GitHub (e.g., `my-todos`). It can be empty.

### 2. Generate a Personal Access Token

1. Go to [GitHub Settings > Tokens](https://github.com/settings/tokens/new?scopes=repo&description=GitHub%20TODO%20App)
2. Select scope: `repo` (for private repos) or `public_repo` (for public)
3. Generate and copy the token

### 3. Use the App

1. Open the app in your browser
2. Enter your GitHub username, repository name, and PAT
3. Start managing your TODOs

## Development

```bash
# Install dependencies
npm install

# Start local server
npm start

# Run unit tests
npm test

# Run E2E tests (requires Playwright browsers)
npx playwright install
npm run test:e2e

# Run all tests
npm run test:all
```

## Deploy to GitHub Pages

1. Fork or copy this repository
2. Enable GitHub Pages in repository settings
3. Set source to `main` branch, root folder
4. Access at `https://yourusername.github.io/repo-name`

## Security

- **Your PAT is stored only in your browser's localStorage**
- **The app has no backend** - all API calls go directly from your browser to GitHub
- **Each user's data is isolated** in their own GitHub repository
- **You control access** - make your TODO repo private

## File Structure

```
├── index.html          # Main app (UI)
├── app.js              # Application logic
├── app.test.js         # Unit tests
├── e2e.test.js         # E2E tests (Playwright)
├── playwright.config.js
├── package.json
└── README.md
```
