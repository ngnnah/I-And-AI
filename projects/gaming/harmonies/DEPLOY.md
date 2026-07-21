# Harmonies Deployment Guide

**Current Version:** v6.1.0
**Deploy target:** GitHub Pages from the repo `public/` directory

## ⚠️ CRITICAL: Do NOT deploy docs or build artifacts to public!

**Only `index.html` and the `js/` directory should be deployed.** Markdown docs, tests, and
Node/Playwright build files stay in source only.

This means excluding: `*.md` (README, PROGRESS, DEPLOY, game-rules), `tests/`, `node_modules/`,
`package.json`, `package-lock.json`, `playwright.config.js`, `playwright-report/`, `test-results/`,
and `archive/`.

---

## File Structure

- **Main game**: `index.html` (~2,400 lines, 32 animal cards)
- **Public URL**: https://ngnnah.github.io/I-And-AI/projects/gaming/harmonies/
- **Data**: `js/data/animal-cards.js` (32 cards)
- **Game Logic**: `js/game/*.js` (hex-grid, token-manager, scoring-engine)

## Sync to Public Directory

Run from the repo root. **ALWAYS keep every `--exclude` below** (especially `--exclude='*.md'`):

```bash
rsync -av --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='tests' \
  --exclude='test-results' \
  --exclude='playwright-report' \
  --exclude='playwright.config.js' \
  --exclude='package.json' \
  --exclude='package-lock.json' \
  --exclude='archive' \
  --exclude='public' \
  --exclude='*.md' \
  projects/gaming/harmonies/ public/projects/gaming/harmonies/
```

**Never omit `--exclude='*.md'`!** This prevents documentation from being publicly accessible.

## Deploy to GitHub Pages

```bash
git add public/
git commit -m "deploy: Harmonies v6.1.0 - correct mechanics + auto-save"
git push origin main
```

GitHub Pages will automatically deploy from the `public/` directory within 1-2 minutes.

## Verify Deployment

After pushing, verify:
1. Visit https://ngnnah.github.io/I-And-AI/projects/gaming/harmonies/
2. Check that game loads correctly
3. Verify NO .md files are accessible (e.g., README.md should 404)

```bash
# Quick check - should only show index.html and js/
ls -la public/projects/gaming/harmonies/
```

## Notes

- ✅ `.md` files are excluded from public deployment (documentation stays in source only)
- ✅ Tests and build artifacts are excluded
- ✅ Archive folder excluded (old versions)
- ✅ The `--delete` flag removes files from public that no longer exist in source
- ⚠️ ALWAYS double-check the rsync command includes `--exclude='*.md'`

---

## Common Mistakes to Avoid

1. ❌ Running `rsync` without `--exclude='*.md'`
2. ❌ Manually copying files (use rsync for consistency)
3. ❌ Forgetting to test locally before deploying
4. ❌ Not checking that .md files are excluded from public/

## Quick Deployment Checklist

- [ ] Test game locally (open `index.html` in browser)
- [ ] Run rsync with `--exclude='*.md'`
- [ ] Verify no .md files in public/projects/gaming/harmonies/
- [ ] Commit and push to GitHub
- [ ] Verify live site works
- [ ] Confirm .md files return 404 on live site
