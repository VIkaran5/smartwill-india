const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const PORT = 3457;
const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const ARTIFACT_DIR = 'C:\\Users\\dasar\\.gemini\\antigravity\\brain\\b1408bca-de71-4e67-91c9-ec8f70902b42';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
      const filePath = path.join(DIST_DIR, reqPath);

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' });
      fs.createReadStream(filePath).pipe(res);
    });

    server.listen(PORT, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

async function run() {
  const server = await startServer();
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 950 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  await page.goto(`http://127.0.0.1:${PORT}/app.html`, { waitUntil: 'networkidle' });

  // Step 1
  await page.check('#dpdpConsentCheckbox');
  await page.fill('#fullName', 'Ramesh Sharma');
  await page.selectOption('#dob_day', '15');
  await page.selectOption('#dob_month', '08');
  await page.selectOption('#dob_year', '1976');
  await page.selectOption('#gender', 'Male');
  await page.selectOption('#religion', 'Hindu');
  await page.selectOption('#govtIdType', 'PAN Card');
  await page.fill('#govtIdDigits', '521M');
  await page.fill('#phone', '9876543210');
  await page.fill('#email', 'ramesh.sharma@example.com');
  await page.fill('#addressLine1', 'Flat 402, Sai Balaji Residency, Madhapur');
  await page.fill('#addressCity', 'Hyderabad');
  await page.fill('#addressState', 'Telangana');
  await page.fill('#addressPincode', '500081');

  await page.click('#nextBtn');
  await page.waitForSelector('#step2.active');

  // Step 2
  await page.locator('.asset-subfield[data-field="bankName"]').first().fill('State Bank of India (SBI)');
  await page.locator('.asset-subfield[data-field="branch"]').first().fill('Hitec City Branch, Hyderabad');
  await page.locator('.asset-subfield[data-field="last4"]').first().fill('4521');
  await page.locator('.asset-val').first().fill('3500000');

  await page.click('#addAssetBtn');
  await page.waitForTimeout(200);
  await page.locator('select.asset-type').nth(1).selectOption('Property / Land');
  await page.waitForTimeout(200);
  await page.locator('.asset-subfield[data-field="unitNo"]').first().fill('Flat 402, Sai Balaji Residency');
  await page.locator('.asset-subfield[data-field="locality"]').first().fill('Madhapur, Sale Deed No. 4521/2018 (1,450 sq ft)');
  await page.locator('.asset-subfield[data-field="city"]').first().fill('Hyderabad');
  await page.locator('.asset-val').nth(1).fill('12000000');

  await page.click('#addAssetBtn');
  await page.waitForTimeout(200);
  await page.locator('select.asset-type').nth(2).selectOption('Mutual Funds / Stocks');
  await page.waitForTimeout(200);
  await page.locator('.asset-subfield[data-field="platform"]').first().fill('Zerodha Broking Ltd');
  await page.locator('.asset-subfield[data-field="clientId"]').first().fill('ZR4521');
  await page.locator('.asset-val').nth(2).fill('4500000');

  await page.click('#nextBtn');
  await page.waitForSelector('#step3.active');

  // Step 3
  await page.locator('.ben-name').first().fill('Sunita Sharma');
  await page.locator('.ben-rel').first().selectOption('Spouse');
  await page.locator('.ben-phone').first().fill('9876543211');
  await page.locator('.ben-id-type').first().selectOption('Aadhaar Card');
  await page.locator('.ben-id-digits').first().fill('9182');

  await page.click('#addBeneficiaryBtn');
  await page.waitForTimeout(200);
  await page.locator('.ben-name').nth(1).fill('Aarav Sharma');
  await page.locator('.ben-rel').nth(1).selectOption('Son');
  await page.locator('.ben-phone').nth(1).fill('9876543212');
  await page.locator('.ben-id-type').nth(1).selectOption('PAN Card');
  await page.locator('.ben-id-digits').nth(1).fill('812B');

  await page.click('#addBeneficiaryBtn');
  await page.waitForTimeout(200);
  await page.locator('.ben-name').nth(2).fill('Ananya Sharma');
  await page.locator('.ben-rel').nth(2).selectOption('Daughter');
  await page.locator('.ben-phone').nth(2).fill('9876543213');
  await page.locator('.ben-id-type').nth(2).selectOption('Aadhaar Card');
  await page.locator('.ben-id-digits').nth(2).fill('4567');

  await page.click('#nextBtn');
  await page.waitForSelector('#step4.active');

  await page.click('#nextBtn');
  await page.waitForSelector('#step5.active');

  // Fill Step 5
  await page.fill('#executorName', 'Suresh Sharma');
  await page.selectOption('#executorRelation', 'Brother');
  await page.fill('#alternateExecutorName', 'Rajesh Kumar');
  await page.selectOption('#alternateExecutorRelation', 'Brother');

  // Scroll to top of Step 5 so header, executor box, and summary card are prominently visible
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForTimeout(500);

  const step5Path = path.join(ARTIFACT_DIR, 'step5_executor_review.png');
  await page.screenshot({ path: step5Path, fullPage: false });
  console.log('Recaptured Step 5 screenshot size:', fs.statSync(step5Path).size);

  await browser.close();
  server.close();
  console.log('Done!');
}

run();
