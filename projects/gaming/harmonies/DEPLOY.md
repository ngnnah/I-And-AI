# Harmonies Deployment Guide

## File Structure

- **Main game**: `index.html` (v5.0 - fully functional solo mode)
- **Public URL**: https://ngnnah.github.io/I-And-AI/projects/gaming/harmonies/
- **Backup**: `index-v4-backup.html` (old Phaser version)

## Sync to Public Directory

Run from repository root:

```bash
rsync -av --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='tests' \
  --exclude='test-results' \
  --exclude='playwright-report' \
  --exclude='*.md' \
  projects/gaming/harmonies/ public/projects/gaming/harmonies/
```

## Deploy to GitHub Pages

```bash
git add public/
git commit -m "deploy: sync Harmonies to public"
git push origin main
```

GitHub Pages will automatically deploy from the `public/` directory within 1-2 minutes.

## Notes

- `.md` files are excluded from public deployment (documentation stays in source only)
- Tests and build artifacts are excluded
- The `--delete` flag removes files from public that no longer exist in source
