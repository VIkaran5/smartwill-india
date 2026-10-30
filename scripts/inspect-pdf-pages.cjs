const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const ARTIFACT_DIR = 'C:/Users/dasar/.gemini/antigravity/brain/b1408bca-de71-4e67-91c9-ec8f70902b42';

async function checkPdf() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage();
  
  // Use Chromium's internal PDF viewer
  const pdfPath = 'file:///' + path.join(ARTIFACT_DIR, 'SmartWill_Ramesh_Sharma_Last_Will.pdf').replace(/\\/g, '/');
  console.log('Opening PDF:', pdfPath);
  await page.goto(pdfPath);
  await page.waitForTimeout(2000);
  
  // Take screenshot of the PDF viewer
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'pdf_viewer_page1.png') });
  console.log('Saved pdf viewer screenshot');
  
  await browser.close();
}

checkPdf().catch(console.error);
