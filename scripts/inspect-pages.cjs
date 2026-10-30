const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const ARTIFACT_DIR = 'C:/Users/dasar/.gemini/antigravity/brain/b1408bca-de71-4e67-91c9-ec8f70902b42';

async function check() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage();
  
  // Load the generated PDF in pdf.js or check text on each page
  // Playwright can evaluate PDF text if we use a pdf reader or pdfjs
  // Let's check the HTML heights and layout in browser!
  const draftHtmlPath = path.join(ARTIFACT_DIR, 'draft_preview_rendered.html');
  const draftHtml = fs.readFileSync(draftHtmlPath, 'utf8');
  
  await page.setContent(`<!DOCTYPE html><html><head><style>
    body { font-family: 'Times New Roman', serif; font-size: 9.8pt; line-height: 1.52; }
    .legal-paper-preview { max-width: 750px; margin: 0 auto; }
    .clause-block { margin-top: 10pt; margin-bottom: 8pt; }
    .draft-asset-item { margin-bottom: 6pt; padding: 6pt 8pt; }
  </style></head><body>${draftHtml}</body></html>`);
  
  const totalHeight = await page.evaluate(() => document.body.scrollHeight);
  console.log('Total document height in px:', totalHeight);
  // An A4 page at 96 DPI is ~1123px. With margins (28mm ~ 106px), usable height is ~950px.
  // 7 pages would mean 7 * 950 = 6650px!
  // If totalHeight is e.g. 2500px, why was it 7 pages in PDF?
  
  // Let's check elements with page-break-inside: avoid!
  const breaks = await page.evaluate(() => {
    const els = document.querySelectorAll('.clause-block, .draft-asset-item, .draft-subclause-box, .closing-execution-container');
    return Array.from(els).map(el => ({
      tag: el.className,
      h1: el.querySelector('h4') ? el.querySelector('h4').innerText : (el.querySelector('strong') ? el.querySelector('strong').innerText : 'item'),
      height: el.offsetHeight
    }));
  });
  console.log('Elements and their heights:', JSON.stringify(breaks, null, 2));

  await browser.close();
}

check().catch(console.error);
