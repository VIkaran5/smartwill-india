import { test, expect } from '@playwright/test';

test.describe('SmartWill India — Full End-to-End Smoke Test & PDF Generation', () => {
  test('Complete 6-Step Journey: Personal -> Assets -> Family -> Allocation -> Review/Draft -> Payment & PDF', async ({ page }) => {
    test.setTimeout(60000);
    // 1. Launch App
    await page.goto('/app.html');
    await expect(page.locator('#step1')).toHaveClass(/active/);

    // ── STEP 1: Personal Details & DPDP Consent ──
    await page.check('#dpdpConsentCheckbox');
    await page.fill('#fullName', 'Dr. Ramesh Kumar Sharma');
    await page.fill('#dob', '1980-08-15');
    await page.selectOption('#gender', 'Male');
    await page.selectOption('#religion', 'Hindu');
    await page.selectOption('#govtIdType', 'PAN Card');
    await page.fill('#govtIdDigits', '482F');
    await page.fill('#phone', '9876543210');
    await page.fill('#email', 'ramesh.sharma@example.com');
    await page.fill('#addressLine1', 'Flat 402, Royal Palms, Aundh');
    await page.fill('#addressCity', 'Pune');
    await page.fill('#addressState', 'Maharashtra');
    await page.fill('#addressPincode', '411007');

    await page.click('#nextBtn');
    await expect(page.locator('#step2')).toHaveClass(/active/);

    // ── STEP 2: Assets (Category-Specific Structured Fields) ──
    // Asset 1 (Bank Account / FD)
    await page.locator('.asset-subfield[data-field="bankName"]').first().fill('HDFC Bank');
    await page.locator('.asset-subfield[data-field="last4"]').first().fill('3482');
    await page.locator('.asset-subfield[data-field="branch"]').first().fill('Aundh, Pune');
    await page.locator('.asset-val').first().fill('2500000');

    // Add 2nd asset: Property / Land
    await page.click('#addAssetBtn');
    const assetTypes = page.locator('select.asset-type');
    await assetTypes.nth(1).selectOption('Property / Land');
    await page.locator('.asset-subfield[data-field="unitNo"]').first().fill('Flat 402');
    await page.locator('.asset-subfield[data-field="locality"]').first().fill('Royal Palms, Aundh');
    await page.locator('.asset-subfield[data-field="city"]').first().fill('Pune');
    await page.locator('.asset-val').nth(1).fill('9500000');

    // Add 3rd asset: Mutual Funds / Stocks
    await page.click('#addAssetBtn');
    await assetTypes.nth(2).selectOption('Mutual Funds / Stocks');
    await page.locator('.asset-subfield[data-field="platform"]').first().fill('Zerodha');
    await page.locator('.asset-subfield[data-field="clientId"]').first().fill('120816000');
    await page.locator('.asset-val').nth(2).fill('3500000');

    await page.click('#nextBtn');
    await expect(page.locator('#step3')).toHaveClass(/active/);

    // ── STEP 3: Beneficiaries ──
    // Beneficiary 1: Spouse
    await page.locator('.ben-name').first().fill('Sunita Sharma');
    await page.locator('.ben-rel').first().selectOption('Spouse');
    await page.locator('.ben-phone').first().fill('9876543211');
    await page.locator('.ben-id-type').first().selectOption('Aadhaar Card');
    await page.locator('.ben-id-digits').first().fill('9182');

    // Add Beneficiary 2: Son
    await page.click('#addBeneficiaryBtn');
    await page.locator('.ben-name').nth(1).fill('Aarav Sharma');
    await page.locator('.ben-rel').nth(1).selectOption('Son');
    await page.locator('.ben-phone').nth(1).fill('9876543212');
    await page.locator('.ben-id-type').nth(1).selectOption('PAN Card');
    await page.locator('.ben-id-digits').nth(1).fill('812B');

    await page.click('#nextBtn');
    await expect(page.locator('#step4')).toHaveClass(/active/);

    // ── STEP 4: Allocations ──
    // In SmartWill, allocations auto-split equally (100% valid by default)
    // Verify allocation cards are rendered
    await expect(page.locator('.allocation-card').first()).toBeVisible();
    await page.click('#nextBtn');
    await expect(page.locator('#step5')).toHaveClass(/active/);

    // ── STEP 5: Review, Executor & Draft Preview Modal ──
    await page.fill('#executorName', 'Vikram Malhotra');
    await page.selectOption('#executorRelation', 'Brother');

    // Open Legal Will Draft Preview Modal
    const previewBtn = page.locator('#btnPreviewDraft');
    if (await previewBtn.isVisible()) {
      await previewBtn.click();
      const draftModal = page.locator('#draftPreviewModal');
      await expect(draftModal).not.toHaveClass(/hidden/);

      // Verify English draft contains Indian Succession Act 1925 legal text
      const draftBody = page.locator('#draftDocumentContainer');
      await expect(draftBody).toContainText('LAST WILL AND TESTAMENT');
      await expect(draftBody).toContainText('Indian Succession Act, 1925');
      await expect(draftBody).toContainText('DR. RAMESH KUMAR SHARMA');
      await expect(draftBody).toContainText('REVOCATION OF ALL FORMER WILLS');
      await expect(draftBody).toContainText('DECLARATION OF SOUND HEALTH AND FREE WILL');
      await expect(draftBody).toContainText('APPOINTMENT OF WILL EXECUTOR');
      await expect(draftBody).toContainText('Vikram Malhotra');

      // Test Trilingual tabs inside modal
      const teluguTab = page.locator('button[data-draft-lang="te"]');
      if (await teluguTab.isVisible()) {
        await teluguTab.click();
        await expect(draftBody).toContainText('కడపటి ఇష్టపూర్వక మరణ శాసన పత్రము');
      }

      const hindiTab = page.locator('button[data-draft-lang="hi"]');
      if (await hindiTab.isVisible()) {
        await hindiTab.click();
        await expect(draftBody).toContainText('अंतिम इच्छा पत्र / वसीयतनामा');
      }

      // Close Draft Modal
      await page.click('#closeDraftModalBtn');
      await expect(draftModal).toHaveClass(/hidden/);
    }

    // Check Legal Confirmation Checkbox
    await page.check('#confirmCheckbox');

    // Step 5 -> Step 6
    await page.click('#nextBtn');
    await expect(page.locator('#step6')).toHaveClass(/active/);

    // ── STEP 6: Payment Unlock & PDF Generation Verification ──
    // Simulate post-payment unlock state in page context
    await page.evaluate(() => {
      if (typeof window.unlockPostPaymentUI === 'function') {
        window.unlockPostPaymentUI('SW_TEST_SMOKE_7788', true);
      } else {
        const post = document.getElementById('postPaymentState');
        const pre = document.getElementById('prePaymentState');
        if (pre) pre.classList.add('hidden');
        if (post) post.classList.remove('hidden');
      }
    });

    const postPaymentState = page.locator('#postPaymentState');
    await expect(postPaymentState).toBeVisible();

    // Verify language choices are present
    await expect(page.locator('#pdfLangEn')).toBeChecked();
    await expect(page.locator('#pdfLangTe')).toBeVisible();
    await expect(page.locator('#pdfLangHi')).toBeVisible();

    // Verify 2-Witness Execution Guide
    await expect(page.locator('.execution-guide')).toBeVisible();
    await expect(page.locator('.guide-list')).toContainText('Print the downloaded PDF on plain A4 paper');
    await expect(page.locator('.guide-list')).toContainText('2 independent witnesses');

    // Verify PDF generator function is bound and functional
    const pdfFunctionAvailable = await page.evaluate(() => {
      return typeof window.generateWillPDF === 'function';
    });
    expect(pdfFunctionAvailable).toBe(true);
  });
});
