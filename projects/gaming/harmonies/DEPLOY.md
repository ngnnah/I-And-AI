# Harmonies Deployment Guide

**Current Version:** v6.0.0 - Enhanced Animal System  
**Last Updated:** 2026-02-17

## ⚠️ CRITICAL: Do NOT Deploy Markdown Files to Public!

**Markdown files (.md) are for development/documentation ONLY and should NEVER be synced to `public/`.**

This includes:
- `README.md`
- `PROGRESS.md`
- `HANDOFF.md`
- `DEPLOY.md`
- `game-rules.md`

**Only `index.html` and `js/` directory should be deployed to public.**

---

## File Structure

- **Main game**: `index.html` (v6.0.0 - 1923 lines, fully playable with 32 animal cards)
- **Public URL**: https://ngnnah.github.io/I-And-AI/projects/gaming/harmonies/
- **Data**: `js/data/animal-cards.js` (32 normal cards)
- **Game Logic**: `js/game/*.js` (hex-grid, token-manager, scoring-engine)

## Sync to Public Directory

**ALWAYS use this exact command** (includes `--exclude='*.md'`):

```bash
rsync -av --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='tests' \
  --exclude='test-results' \
  --exclude='playwright-report' \
  --exclude='archive' \
  --exclude='public' \
  --exclude='*.md' \
  projects/gaming/harmonies/ public/projects/gaming/harmonies/
```

**Never omit `--exclude='*.md'`!** This prevents documentation from being publicly accessible.

## Deploy to GitHub Pages

```bash
git add public/
git commit -m "deploy: Harmonies v6.0.0 - Enhanced Animal System"
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
