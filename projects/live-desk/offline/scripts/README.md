# Rebuilding the storybook

The storybook in `../` is the deck's pages as images. When a deck page changes, re-render that page, swap its figure, and reprint the PDF. These scripts reproduce the committed files byte for byte.

Needs Google Chrome and `puppeteer-core` (`npm i puppeteer-core` anywhere, then point `NODE_PATH` at that `node_modules`). Set `CHROME` if Chrome isn't in `/Applications`.

```bash
# 1. Render deck page 11 to p11.png in the current folder (2160x1350, light theme)
node render.js 11

# 2. JPEG at quality 65, the figures' setting
sips -s format jpeg -s formatOptions 65 p11.png --out p11.jpg

# 3. Swap figure p11's image; the two fragments update its alt text (each must match once)
python3 extract.py replace ../director-storybook.html p11 p11.jpg "old alt words" "new alt words"

# 4. Reprint the PDF (21 pages, one per sheet)
node pdf.js
```

`python3 extract.py extract ../director-storybook.html p11 out.jpg` pulls a figure's current image out, to compare before and after.

The deck has two public copies, `../../director-deck.html` and `public/projects/live-desk/index.html` at the repo root; they change together, and `render.js` reads the first.
