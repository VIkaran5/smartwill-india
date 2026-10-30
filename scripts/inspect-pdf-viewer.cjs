const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const ARTIFACT_DIR = 'C:/Users/dasar/.gemini/antigravity/brain/b1408bca-de71-4e67-91c9-ec8f70902b42';

async function captureAllPages() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext({ viewport: { width: 1200, height: 1600 } });
  const page = await context.newPage();
  
  const pdfPath = 'file:///' + path.join(ARTIFACT_DIR, 'SmartWill_Ramesh_Sharma_Last_Will.pdf').replace(/\\/g, '/');
  console.log('Navigating to:', pdfPath);
  await page.goto(pdfPath);
  await page.waitForTimeout(3000);
  
  // In Chrome PDF viewer, zoom fit to page
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'pdf_viewer_overview.png') });
  console.log('Captured overview');
  
  await browser.close();
}

captureAllPages().catch(console.error);
