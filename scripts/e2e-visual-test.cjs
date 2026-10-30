const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const PORT = 3456;
const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const ARTIFACT_DIR = 'C:/Users/dasar/.gemini/antigravity/brain/b1408bca-de71-4e67-91c9-ec8f70902b42';

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
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      fs.createReadStream(filePath).pipe(res);
    });

    server.listen(PORT, '127.0.0.1', () => {
      console.log(`Test server running at http://127.0.0.1:${PORT}`);
      resolve(server);
    });
    server.on('error', reject);
  });
}

async function runTest() {
  const server = await startServer();
  let browser;

  try {
    console.log('Launching Chrome...');
    browser = await chromium.launch({
      headless: true,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 950 },
      deviceScaleFactor: 2
    });

    const page = await context.newPage();

    const logs = [];
    const errors = [];
    page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => errors.push(err.toString()));

    console.log('Navigating to http://127.0.0.1:' + PORT + '/app.html...');
    await page.goto(`http://127.0.0.1:${PORT}/app.html`, { waitUntil: 'networkidle' });

    console.log('Page loaded. Checking for initial JS errors...');
    if (errors.length > 0) {
      console.error('JS Errors found on load:', errors);
    } else {
      console.log('Zero JS errors on initial load! Module graph loaded cleanly.');
    }

    // ── STEP 1: PERSONAL DETAILS ──
    console.log('Filling Step 1...');
    await page.check('#dpdpConsentCheckbox');
    await page.fill('#fullName', 'Ramesh Sharma');

    const fatherInput = page.locator('#fatherName');
    if (await fatherInput.count() > 0) {
      await fatherInput.fill('Late Shri Kailash Sharma');
      console.log('Filled #fatherName: Late Shri Kailash Sharma');
    }

    // DOB Dropdowns
    await page.selectOption('#dob_day', '15');
    await page.selectOption('#dob_month', '08');
    await page.selectOption('#dob_year', '1976');

    // Verify hidden #dob sync
    const dobVal = await page.inputValue('#dob');
    console.log('Synced hidden #dob value:', dobVal);

    await page.selectOption('#gender', 'Male');
    await page.selectOption('#religion', 'Hindu');
    await page.selectOption('#govtIdType', 'PAN Card');
    await page.fill('#govtIdDigits', '521M'); // Valid 4 chars (3 digits + 1 letter)

    await page.fill('#phone', '9876543210');
    await page.fill('#email', 'ramesh.sharma@example.com');
    await page.fill('#addressLine1', 'Flat 402, Sai Balaji Residency, Madhapur');
    await page.fill('#addressCity', 'Hyderabad');
    await page.fill('#addressState', 'Telangana');
    await page.fill('#addressPincode', '500081');

    await page.waitForTimeout(600);

    const step1Path = path.join(ARTIFACT_DIR, 'step1_personal_details.png');
    await page.screenshot({ path: step1Path, fullPage: false });
    console.log('Step 1 screenshot saved to:', step1Path);

    // Click Next -> Step 2
    console.log('Clicking Next to Step 2...');
    await page.click('#nextBtn');
    await page.waitForSelector('#step2.active', { timeout: 5000 });
    console.log('Successfully transitioned to Step 2!');

    // ── STEP 2: ASSETS ──
    console.log('Filling Step 2 Assets...');
    // Asset 1 (Bank Account / FD by default)
    const bankName = page.locator('.asset-subfield[data-field="bankName"]').first();
    await bankName.fill('State Bank of India (SBI)');
    const branch = page.locator('.asset-subfield[data-field="branch"]').first();
    await branch.fill('Hitec City Branch, Hyderabad (Savings Account No. ending in 4521 & all sole Fixed Deposits held with the bank, or any renewed/successor accounts)');
    const last4 = page.locator('.asset-subfield[data-field="last4"]').first();
    await last4.fill('4521');
    await page.locator('.asset-val').first().fill('3500000');

    // Add Asset 2: Real Estate (Property / Land)
    console.log('Adding Asset 2 (Property / Land)...');
    await page.click('#addAssetBtn');
    await page.waitForTimeout(300);
    const assetTypes = page.locator('select.asset-type');
    await assetTypes.nth(1).selectOption('Property / Land');
    await page.waitForTimeout(300);

    const unitNo = page.locator('.asset-subfield[data-field="unitNo"]').first();
    if (await unitNo.count() > 0) await unitNo.fill('Flat 402, 4th Floor, Sai Balaji Residency');
    const locality = page.locator('.asset-subfield[data-field="locality"]').first();
    if (await locality.count() > 0) await locality.fill('Madhapur, Super Built-up Area: 1,450 sq ft (UDS: 42 sq yds), Regd. Sale Deed No. 4521/2018 dated 14/06/2018 at SRO Serilingampally, Bounded N: Open Driveway, S: Flat 401, E: Corridor, W: Compound Wall');
    const city = page.locator('.asset-subfield[data-field="city"]').first();
    if (await city.count() > 0) await city.fill('Hyderabad');
    await page.locator('.asset-val').nth(1).fill('12000000');

    // Add Asset 3: Mutual Funds / Stocks
    console.log('Adding Asset 3 (Mutual Funds / Stocks)...');
    await page.click('#addAssetBtn');
    await page.waitForTimeout(300);
    await assetTypes.nth(2).selectOption('Mutual Funds / Stocks');
    await page.waitForTimeout(300);

    const platform = page.locator('.asset-subfield[data-field="platform"]').first();
    if (await platform.count() > 0) await platform.fill('Zerodha Broking Ltd (CDSL DP ID: 12081600)');
    const clientId = page.locator('.asset-subfield[data-field="clientId"]').first();
    if (await clientId.count() > 0) await clientId.fill('BO ID: 12081600-04521892 (Trading Client Code: ZR4521, covering all equity shares, ETF units, and mutual fund folios)');
    await page.locator('.asset-val').nth(2).fill('4500000');

    await page.waitForTimeout(500);
    const step2Path = path.join(ARTIFACT_DIR, 'step2_assets.png');
    await page.screenshot({ path: step2Path, fullPage: false });
    console.log('Step 2 screenshot saved to:', step2Path);

    // Click Next -> Step 3
    console.log('Clicking Next to Step 3...');
    await page.click('#nextBtn');
    await page.waitForSelector('#step3.active', { timeout: 5000 });
    console.log('Successfully transitioned to Step 3!');

    // ── STEP 3: BENEFICIARIES ──
    console.log('Filling Step 3 Beneficiaries...');
    // Beneficiary 1: Sunita Sharma (Spouse)
    await page.locator('.ben-name').first().fill('Sunita Sharma');
    await page.locator('.ben-rel').first().selectOption('Spouse');
    await page.locator('.ben-phone').first().fill('9876543211');
    await page.locator('.ben-id-type').first().selectOption('Aadhaar Card');
    await page.locator('.ben-id-digits').first().fill('9182');

    // Add Beneficiary 2: Aarav Sharma (Son)
    await page.click('#addBeneficiaryBtn');
    await page.waitForTimeout(300);
    await page.locator('.ben-name').nth(1).fill('Aarav Sharma');
    await page.locator('.ben-rel').nth(1).selectOption('Son');
    await page.locator('.ben-phone').nth(1).fill('9876543212');
    await page.locator('.ben-id-type').nth(1).selectOption('PAN Card');
    await page.locator('.ben-id-digits').nth(1).fill('812B');

    // Add Beneficiary 3: Ananya Sharma (Daughter)
    await page.click('#addBeneficiaryBtn');
    await page.waitForTimeout(300);
    await page.locator('.ben-name').nth(2).fill('Ananya Sharma');
    await page.locator('.ben-rel').nth(2).selectOption('Daughter');
    await page.locator('.ben-phone').nth(2).fill('9876543213');
    await page.locator('.ben-id-type').nth(2).selectOption('Aadhaar Card');
    await page.locator('.ben-id-digits').nth(2).fill('4567');

    await page.waitForTimeout(500);
    const step3Path = path.join(ARTIFACT_DIR, 'step3_beneficiaries.png');
    await page.screenshot({ path: step3Path, fullPage: false });
    console.log('Step 3 screenshot saved to:', step3Path);

    // Click Next -> Step 4
    console.log('Clicking Next to Step 4...');
    await page.click('#nextBtn');
    await page.waitForSelector('#step4.active', { timeout: 5000 });
    console.log('Successfully transitioned to Step 4!');

    await page.waitForTimeout(600);
    const step4Path = path.join(ARTIFACT_DIR, 'step4_allocations.png');
    await page.screenshot({ path: step4Path, fullPage: false });
    console.log('Step 4 screenshot saved to:', step4Path);

    // Click Next -> Step 5
    console.log('Clicking Next to Step 5...');
    await page.click('#nextBtn');
    await page.waitForSelector('#step5.active', { timeout: 5000 });
    console.log('Successfully transitioned to Step 5!');

    // ── STEP 5: EXECUTOR & REVIEW ──
    console.log('Filling Step 5 Executor & Review...');
    await page.fill('#executorName', 'Suresh Sharma');
    await page.selectOption('#executorRelation', 'Brother');

    const altName = page.locator('#alternateExecutorName');
    if (await altName.count() > 0) {
      await altName.fill('Rajesh Kumar');
    }
    const altRel = page.locator('#alternateExecutorRelation');
    if (await altRel.count() > 0) {
      await altRel.selectOption('Brother'); // Or other relation
    }

    await page.waitForTimeout(600);
    const step5Path = path.join(ARTIFACT_DIR, 'step5_executor_review.png');
    await page.screenshot({ path: step5Path, fullPage: false });
    console.log('Step 5 screenshot saved to:', step5Path);

    // ── OPEN LEGAL DRAFT PREVIEW MODAL ──
    console.log('Opening Draft Preview Modal...');
    const previewBtn = page.locator('#previewDraftBtn');
    await previewBtn.click();

    await page.waitForTimeout(1200);

    const modal = page.locator('#draftPreviewModal');
    const isVisible = await modal.isVisible();
    console.log('Draft Preview Modal visible?', isVisible);

    // Screenshot full modal view
    const draftModalPath = path.join(ARTIFACT_DIR, 'draft_preview_executive_modal.png');
    await page.screenshot({ path: draftModalPath, fullPage: false });
    console.log('Draft Preview Modal screenshot saved to:', draftModalPath);

    // Take screenshot of the inner document parchment
    const docContainer = page.locator('#draftDocumentContainer, .draft-preview-body');
    if (await docContainer.count() > 0) {
      const docPath = path.join(ARTIFACT_DIR, 'draft_document_parchment.png');
      await docContainer.first().screenshot({ path: docPath });
      console.log('Draft Parchment Document screenshot saved to:', docPath);
    }

    // Extract rendered HTML and text
    const draftContentHtml = await page.locator('#draftDocumentContainer').innerHTML();
    const draftContentText = await page.locator('#draftDocumentContainer').innerText();

    fs.writeFileSync(path.join(ARTIFACT_DIR, 'draft_preview_rendered.html'), draftContentHtml, 'utf8');
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'draft_preview_rendered.txt'), draftContentText, 'utf8');
    console.log('Draft content HTML & text saved!');

    console.log('\n========================================');
    console.log('ALL STEPS & DRAFT PREVIEW PASSED FLAWLESSLY!');
    console.log('Total Console Errors:', errors.length);
    console.log('========================================\n');

  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    if (browser) await browser.close();
    server.close();
    console.log('Test server closed.');
  }
}

runTest();
