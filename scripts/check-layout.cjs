const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/dasar/.gemini/antigravity/brain/b1408bca-de71-4e67-91c9-ec8f70902b42';
const PROJECT_DIR = path.resolve(__dirname, '..');

async function checkLayout() {
  const draftHtmlPath = path.join(ARTIFACT_DIR, 'draft_preview_rendered.html');
  const draftBodyHtml = fs.readFileSync(draftHtmlPath, 'utf8');
  const appCssPath = path.join(PROJECT_DIR, 'css', 'app.css');
  const appCss = fs.readFileSync(appCssPath, 'utf8');

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage();
  
  await page.emulateMedia({ media: 'print' });
  
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${appCss}
    @page { size: A4 portrait; margin: 16mm; }
    * { -webkit-print-color-adjust: exact !important; }
    body { background: #ffffff !important; color: #0f172a !important; font-family: 'Times New Roman', serif !important; font-size: 9.8pt !important; line-height: 1.52 !important; margin: 0 !important; }
    .legal-paper-preview { background: #ffffff !important; border: none !important; box-shadow: none !important; padding: 0 !important; max-width: 100% !important; margin: 0 !important; }
    .clause-block { margin-top: 10pt; margin-bottom: 8pt; break-inside: auto !important; }
    .clause-title { font-size: 10.5pt; font-weight: bold; color: #0f172a; border-bottom: 0.75pt solid #cbd5e1; padding-bottom: 2pt; margin-bottom: 4pt; break-after: avoid !important; }
    .closing-execution-container { break-inside: avoid; margin-top: 8pt; }
  </style>
</head>
<body>
  ${draftBodyHtml}
</body>
</html>`;

  await page.setContent(fullHtml);
  
  const sections = await page.evaluate(() => {
    const list = [];
    document.querySelectorAll('.clause-title').forEach(el => {
      const rect = el.getBoundingClientRect();
      list.push({ title: el.innerText.trim(), top: Math.round(rect.top), height: Math.round(rect.height) });
    });
    const closing = document.querySelector('.closing-execution-container');
    if (closing) {
      const cr = closing.getBoundingClientRect();
      list.push({ title: 'CLOSING-EXECUTION-CONTAINER', top: Math.round(cr.top), height: Math.round(cr.height) });
    }
    return list;
  });
  console.log('Document Elements Layout:');
  console.table(sections);
  
  await browser.close();
}

checkLayout().catch(console.error);
