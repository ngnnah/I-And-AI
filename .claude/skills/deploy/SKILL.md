---
name: deploy
description: This skill should be used when the user asks to "sync and deploy", "deploy to public", "push to GitHub Pages", "sync project", "rsync to public", or wants to publish a project from projects/ to public/ and push to GitHub Pages.
disable-model-invocation: true
---

# /deploy

Sync a project from `projects/` to `public/` and deploy to GitHub Pages.

## Instructions

1. **Identify the project path** from context (current file, recent edits, or user mention).
   - Example: `projects/gaming/high-society/` → `public/projects/gaming/high-society/`

2. **Run rsync** to sync web assets only (skip docs, tests, node_modules, config files):

   ```bash
   rsync -av --delete \
     --filter='+ /css/***' \
     --filter='+ /js/***' \
     --filter='+ /images/***' \
     --filter='+ /index.html' \
     --filter='- *' \
     projects/<project-path>/ public/projects/<project-path>/
   ```

3. **Force-add data files** (`.gitignore` excludes `data/` globally — must force-add for both copies):

   ```bash
   git add -f projects/<project-path>/js/data/*.js 2>/dev/null || true
   git add -f public/projects/<project-path>/js/data/*.js 2>/dev/null || true
   ```

4. **Stage all changes**:

   ```bash
   git add projects/<project-path>/ public/projects/<project-path>/
   ```

5. **Check git status** — show what's staged.

6. **Commit** using the `/commit` skill or:

   ```bash
   git commit -m "chore: sync <project-name> to public/ and deploy"
   ```

7. **Push**:

   ```bash
   git push origin main
   ```

8. **Confirm** — GitHub Pages rebuilds automatically (~1 min). Live at:
   `https://ngnnah.github.io/I-And-AI/projects/<project-path>/`

## Known Gotchas

- **`data/` gitignore**: The root `.gitignore` has a `data/` rule that matches `js/data/`. Always use `git add -f` for data files in BOTH `projects/` and `public/` copies.
- **Docs and tests are NOT synced**: `README.md`, `progress.md`, `how-to-play.md`, `tests/`, `package.json`, `*.config.js` stay in `projects/` only — never copied to `public/`.
- **Verify rsync output**: Check that the file count makes sense. If 0 files transferred, the filter patterns may need adjusting.
