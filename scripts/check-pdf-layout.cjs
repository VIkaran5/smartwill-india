const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const ARTIFACT_DIR = 'C:/Users/dasar/.gemini/antigravity/brain/b1408bca-de71-4e67-91c9-ec8f70902b42';

async function checkLayout() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage();
  
  // Set emulation to print
  await page.emulateMedia({ media: 'print' });
  
  const draftHtmlPath = path.join(ARTIFACT_DIR, 'draft_preview_rendered.html');
  const draftHtml = fs.readFileSync(draftHtmlPath, 'utf8');
  const appCssPath = path.join(__dirname, '..', 'css', 'app.css');
  const appCss = fs.readFileSync(appCssPath, 'utf8');
  
  await page.setContent(`<!DOCTYPE html><html><head><style>
    ${appCss}
    @page { size: A4 portrait; margin: 14mm 16mm 14mm 16mm; }
    body { font-size: 9.8pt !important; line-height: 1.52 !important; }
    .clause-block { margin-top: 10pt; margin-bottom: 8pt; break-inside: auto !important; }
    .clause-title { break-after: avoid !important; }
    .closing-execution-container { break-inside: avoid !important; }
  </style></head><body>${draftHtml}</body></html>`);

  // Measure closing-execution-container
  const execBox = await page.evaluate(() => {
    const el = document.querySelector('.closing-execution-container');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const sig = el.querySelector('.signature-section');
    const wit = el.querySelector('.witness-section');
    return {
      top: rect.top + window.scrollY,
      height: rect.height,
      sigHeight: sig ? sig.offsetHeight : null,
      witHeight: wit ? wit.offsetHeight : null
    };
  });
  
  console.log('Closing Execution Container metrics:', execBox);
  
  await browser.close();
}

checkLayout().catch(console.error);
