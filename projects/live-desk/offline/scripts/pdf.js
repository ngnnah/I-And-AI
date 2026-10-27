// Print the offline storybook to PDF the way the original was made: Chrome print of the
// HTML itself, honoring its @page{size:1440px 900px;margin:0} (one deck page per sheet),
// backgrounds on.
//
// Usage: node pdf.js [out.pdf]   (default: ../director-storybook.pdf)
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const HTML = path.resolve(__dirname, '..', 'director-storybook.html');
const PDF = process.argv[2] || path.resolve(__dirname, '..', 'director-storybook.pdf');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

(async () => {
  const browser = await puppeteer.launch({ headless: true, executablePath: CHROME });
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.goto(`file://${HTML}`, { waitUntil: 'networkidle0' });
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.pdf({ path: PDF, printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  console.log(PDF, fs.statSync(PDF).size, 'bytes');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
