const { chromium } = require('@playwright/test');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'assets', 'arcade-slides');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

async function capture() {
  server.listen(3666, async () => {
    console.log('Server running on port 3666');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 810 },
      deviceScaleFactor: 2
    });

    const page = await context.newPage();

    // 1. Landing Hero Slide
    console.log('Capturing Slide 1: Hero & ₹40,000 Cr Hook...');
    await page.goto('http://localhost:3666/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '01_smartwill_hero_hook.png'),
      clip: { x: 0, y: 0, width: 1440, height: 810 }
    });

    // Go to app
    await page.goto('http://localhost:3666/app.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // 2. Step 1: Personal Info
    console.log('Capturing Slide 2: Personal Legal Details...');
    await page.evaluate(() => {
      document.querySelectorAll('.wizard-step').forEach(el => { el.style.display = 'none'; el.classList.remove('active'); });
      const s1 = document.getElementById('step1');
      s1.style.display = 'block';
      s1.classList.add('active');

      const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
      const chk = (id) => { const el = document.getElementById(id); if (el) el.checked = true; };

      chk('dpdpConsentCheckbox');
      setVal('fullName', 'Ramesh Kumar Sharma');
      setVal('dob', '1976-08-15');
      setVal('gender', 'Male');
      setVal('religion', 'Hindu');
      setVal('govtIdType', 'PAN Card');
      setVal('govtIdDigits', '4821');
      setVal('phone', '9876543210');
      setVal('email', 'ramesh.sharma@gmail.com');
      setVal('addressLine1', 'Flat 402, Sai Residency');
      setVal('addressCity', 'Hyderabad');
      setVal('addressState', 'Telangana');
      setVal('addressPincode', '500081');

      document.querySelector('.stepper-progress-bar').style.width = '16%';
      window.scrollTo(0, 80);
    });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '02_personal_legal_details.png'),
      clip: { x: 0, y: 0, width: 1440, height: 810 }
    });

    // 3. Step 2: Assets
    console.log('Capturing Slide 3: Assets Portfolio...');
    await page.evaluate(() => {
      document.querySelectorAll('.wizard-step').forEach(el => { el.style.display = 'none'; el.classList.remove('active'); });
      const s2 = document.getElementById('step2');
      s2.style.display = 'block';
      s2.classList.add('active');

      // Click Add Asset 3 times
      const addBtn = document.getElementById('addAssetBtn');
      if (addBtn) {
        addBtn.click();
        addBtn.click();
      }

      const rows = document.querySelectorAll('#assetsContainer .dynamic-row');
      if (rows[0]) {
        const sel = rows[0].querySelector('.asset-type');
        if (sel) sel.value = 'Bank Account / FD';
        const desc = rows[0].querySelector('.asset-desc');
        if (desc) desc.value = 'HDFC Bank Savings A/C: XXXX4912 (Banjara Hills)';
        const val = rows[0].querySelector('.asset-val');
        if (val) { val.value = '1500000'; val.dispatchEvent(new Event('input')); }
      }
      if (rows[1]) {
        const sel = rows[1].querySelector('.asset-type');
        if (sel) sel.value = 'Property / Land';
        const desc = rows[1].querySelector('.asset-desc');
        if (desc) desc.value = 'Residential Flat 402, Sai Residency, Kondapur, Hyderabad';
        const val = rows[1].querySelector('.asset-val');
        if (val) { val.value = '8500000'; val.dispatchEvent(new Event('input')); }
      }
      if (rows[2]) {
        const sel = rows[2].querySelector('.asset-type');
        if (sel) sel.value = 'Gold / Jewelry';
        const desc = rows[2].querySelector('.asset-desc');
        if (desc) desc.value = '22K Gold Jewellery (200g) in SBI Bank Locker';
        const val = rows[2].querySelector('.asset-val');
        if (val) { val.value = '1450000'; val.dispatchEvent(new Event('input')); }
      }

      document.querySelectorAll('.step-item').forEach(el => {
        const s = Number(el.dataset.step);
        if (s === 2) { el.classList.add('active'); el.classList.remove('completed'); }
        else if (s < 2) { el.classList.remove('active'); el.classList.add('completed'); }
        else { el.classList.remove('active', 'completed'); }
      });
      document.querySelector('.stepper-progress-bar').style.width = '33%';
      window.scrollTo(0, 80);
    });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '03_assets_portfolio.png'),
      clip: { x: 0, y: 0, width: 1440, height: 810 }
    });

    // 4. Step 3: Beneficiaries
    console.log('Capturing Slide 4: Family & Beneficiaries...');
    await page.evaluate(() => {
      document.querySelectorAll('.wizard-step').forEach(el => { el.style.display = 'none'; el.classList.remove('active'); });
      const s3 = document.getElementById('step3');
      s3.style.display = 'block';
      s3.classList.add('active');

      const addBenBtn = document.getElementById('addBeneficiaryBtn');
      if (addBenBtn) {
        addBenBtn.click();
      }

      const rows = document.querySelectorAll('#beneficiariesContainer .dynamic-row');
      if (rows[0]) {
        const nameInput = rows[0].querySelector('.beneficiary-name');
        if (nameInput) nameInput.value = 'Priya Sharma';
        const rel = rows[0].querySelector('.beneficiary-relation');
        if (rel) rel.value = 'Spouse';
        const age = rows[0].querySelector('.beneficiary-age');
        if (age) age.value = '44';
      }
      if (rows[1]) {
        const nameInput = rows[1].querySelector('.beneficiary-name');
        if (nameInput) nameInput.value = 'Rohan Sharma';
        const rel = rows[1].querySelector('.beneficiary-relation');
        if (rel) rel.value = 'Son';
        const age = rows[1].querySelector('.beneficiary-age');
        if (age) age.value = '18';
      }

      document.querySelectorAll('.step-item').forEach(el => {
        const s = Number(el.dataset.step);
        if (s === 3) { el.classList.add('active'); el.classList.remove('completed'); }
        else if (s < 3) { el.classList.remove('active'); el.classList.add('completed'); }
        else { el.classList.remove('active', 'completed'); }
      });
      document.querySelector('.stepper-progress-bar').style.width = '50%';
      window.scrollTo(0, 80);
    });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '04_family_beneficiaries.png'),
      clip: { x: 0, y: 0, width: 1440, height: 810 }
    });

    // 5. Step 5: Review & Will Summary
    console.log('Capturing Slide 5: Review & Will Summary...');
    await page.evaluate(() => {
      document.querySelectorAll('.wizard-step').forEach(el => { el.style.display = 'none'; el.classList.remove('active'); });
      const s5 = document.getElementById('step5');
      s5.style.display = 'block';
      s5.classList.add('active');

      const exName = document.getElementById('executorName');
      if (exName) exName.value = 'Suresh Kumar Sharma';
      const exRel = document.getElementById('executorRelation');
      if (exRel) exRel.value = 'Brother';

      // Fill summary box
      const sumContent = document.getElementById('summaryContent');
      if (sumContent) {
        sumContent.innerHTML = `
          <div class="summary-section mb-3">
            <h4 class="text-gold font-semibold">Testator (Creator of Will)</h4>
            <p class="text-sm">Ramesh Kumar Sharma, Age 48 · Residing at Flat 402, Sai Residency, Hyderabad 500081 · PAN: XXXX4821</p>
          </div>
          <div class="summary-section mb-3">
            <h4 class="text-gold font-semibold">Allocated Assets (₹1,14,50,000 Total)</h4>
            <ul class="text-sm pl-4 list-disc">
              <li>HDFC Bank Savings A/C: XXXX4912 (₹15,00,000) &rarr; Priya Sharma (100%)</li>
              <li>Residential Flat 402, Kondapur (₹85,00,000) &rarr; Priya Sharma (50%), Rohan Sharma (50%)</li>
              <li>22K Gold Jewellery (₹14,50,000) &rarr; Priya Sharma (100%)</li>
            </ul>
          </div>
          <div class="summary-section">
            <h4 class="text-gold font-semibold">Appointed Executor</h4>
            <p class="text-sm">Suresh Kumar Sharma (Brother) appointed as sole executor under Indian Succession Act 1925.</p>
          </div>
        `;
      }

      document.querySelectorAll('.step-item').forEach(el => {
        const s = Number(el.dataset.step);
        if (s === 5) { el.classList.add('active'); el.classList.remove('completed'); }
        else if (s < 5) { el.classList.remove('active'); el.classList.add('completed'); }
        else { el.classList.remove('active', 'completed'); }
      });
      document.querySelector('.stepper-progress-bar').style.width = '83%';
      window.scrollTo(0, 80);
    });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '05_review_will_summary.png'),
      clip: { x: 0, y: 0, width: 1440, height: 810 }
    });

    // 6. Step 6: Legal Will PDF Preview
    console.log('Capturing Slide 6: Legal Will Document Preview...');
    await page.evaluate(() => {
      document.querySelectorAll('.wizard-step').forEach(el => { el.style.display = 'none'; el.classList.remove('active'); });
      const s6 = document.getElementById('step6');
      s6.style.display = 'block';
      s6.classList.add('active');

      const willDoc = document.getElementById('willPreviewDocument');
      if (willDoc) {
        willDoc.innerHTML = `
          <div style="font-family: 'Times New Roman', serif; padding: 2rem; background: #fff; color: #111; border: 2px solid #333; border-radius: 4px;">
            <div style="text-align: center; border-bottom: 2px solid #222; padding-bottom: 1rem; margin-bottom: 1.5rem;">
              <h2 style="font-size: 1.6rem; letter-spacing: 2px; text-transform: uppercase; margin: 0;">LAST WILL AND TESTAMENT</h2>
              <p style="font-style: italic; margin-top: 4px; font-size: 0.95rem;">Under the Indian Succession Act, 1925</p>
            </div>
            <p style="text-align: justify; line-height: 1.8; font-size: 1.05rem;">
              I, <strong>RAMESH KUMAR SHARMA</strong>, aged about 48 years, residing at Flat 402, Sai Residency, Kondapur, Hyderabad - 500081, of sound mind and memory, do hereby make and publish this my Last Will and Testament, revoking all earlier Wills and Codicils made by me...
            </p>
            <div style="margin: 1.5rem 0; padding: 1rem; background: #f9f9f9; border-left: 3px solid #dfb76c;">
              <strong>1. BEQUEST OF ASSETS:</strong><br>
              I bequeath my HDFC Bank account and Gold Jewellery absolutely to my wife <strong>SMT. PRIYA SHARMA</strong>, and my residential apartment jointly to my wife and my son <strong>ROHAN SHARMA</strong> in equal shares.
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 2rem; padding-top: 1rem; border-top: 1px dashed #888;">
              <div>
                <p style="margin:0;">________________________</p>
                <p style="font-weight: bold; margin-top: 4px;">TESTATOR SIGNATURE</p>
              </div>
              <div>
                <p style="margin:0;">________________________</p>
                <p style="font-weight: bold; margin-top: 4px;">WITNESS 1 &amp; WITNESS 2</p>
              </div>
            </div>
          </div>
        `;
      }

      document.querySelectorAll('.step-item').forEach(el => {
        el.classList.remove('active');
        el.classList.add('completed');
      });
      document.querySelector('.stepper-progress-bar').style.width = '100%';
      window.scrollTo(0, 80);
    });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '06_legal_will_document.png'),
      clip: { x: 0, y: 0, width: 1440, height: 810 }
    });

    console.log('All 6 slides successfully generated!');
    await browser.close();
    server.close();
    process.exit(0);
  });
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
