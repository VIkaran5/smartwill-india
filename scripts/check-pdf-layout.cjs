const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const html = fs.readFileSync('C:/Users/dasar/.gemini/antigravity/brain/b1408bca-de71-4e67-91c9-ec8f70902b42/draft_preview_rendered.html', 'utf8');
  const css = fs.readFileSync('css/app.css', 'utf8');
  await page.setContent('<style>' + css + '</style>' + html, { waitUntil: 'load' });
  await page.emulateMedia({ media: 'print' });

  const els = await page.evaluate(() => {
    const list = [];
    document.querySelectorAll('h4, .page-gap-marker, .draft-subclause-box').forEach(el => {
      const text = el.innerText.trim().split('\n')[0].substring(0, 40);
      const rect = el.getBoundingClientRect();
      list.push({ text, top: Math.round(rect.top), bottom: Math.round(rect.bottom) });
    });
    return list;
  });

  console.log(JSON.stringify(els, null, 2));
  await browser.close();
})();
