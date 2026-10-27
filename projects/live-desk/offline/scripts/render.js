// Render one page of director-deck.html the way the storybook figures were made:
// 1440x900 viewport at deviceScaleFactor 1.5 (2160x1350), light theme, the deck's
// progress bar and page count hidden, fonts and images loaded, 1.5 s settle.
// Writes p<N>.png to the current folder.
//
// Usage: node render.js <page>
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const DECK = path.resolve(__dirname, '..', '..', 'director-deck.html');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PAGE = parseInt(process.argv[2] || '1', 10);

(async () => {
  const browser = await puppeteer.launch({ headless: true, executablePath: CHROME });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.evaluateOnNewDocument(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await page.goto(`file://${DECK}#${PAGE}`, { waitUntil: 'networkidle0' });
  await page.addStyleTag({ content: '.progress,.count,.jump{display:none!important}' });
  await page.evaluate(async () => {
    document.documentElement.setAttribute('data-theme', 'light');
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
  });
  await new Promise(r => setTimeout(r, 1500));
  const cur = await page.evaluate(() => {
    const pages = [...document.querySelectorAll('.page')];
    return pages.indexOf(document.querySelector('.page.cur')) + 1;
  });
  if (cur !== PAGE) throw new Error(`asked for page ${PAGE}, deck shows page ${cur}`);
  const file = path.join(process.cwd(), `p${PAGE}.png`);
  await page.screenshot({ path: file, type: 'png', fullPage: false });
  console.log(file, fs.statSync(file).size, 'bytes');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
