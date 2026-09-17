import { test, expect } from '@playwright/test';

test.describe('SmartWill India — Full Will Creation & FSM Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app.html');
  });

  test('should display Step 1 (Personal Details) on launch', async ({ page }) => {
    await expect(page.locator('#step1')).toHaveClass(/active/);
    await expect(page.locator('#fullName')).toBeVisible();
  });

  test('should block Step 1 progression when mandatory fields are missing', async ({ page }) => {
    await page.click('#nextBtn');
    // Toast warning should be visible
    await expect(page.locator('#toastNotification')).toBeVisible();
    // Should remain on Step 1
    await expect(page.locator('#step1')).toHaveClass(/active/);
  });

  test('should validate invalid mobile phone number', async ({ page }) => {
    await page.fill('#fullName', 'Ramesh Sharma');
    await page.fill('#dob', '1985-05-15');
    await page.fill('#addressLine1', '123 MG Road');
    await page.fill('#addressCity', 'Mumbai');
    await page.fill('#addressState', 'Maharashtra');
    await page.fill('#addressPincode', '400001');
    await page.fill('#email', 'ramesh@gmail.com');
    await page.fill('#phone', '1234567890'); // Invalid phone

    await page.click('#nextBtn');
    await expect(page.locator('#toastNotification')).toBeVisible();
    await expect(page.locator('#step1')).toHaveClass(/active/);
  });

  test('should seamlessly transition Step 1 -> Step 2 -> Step 3 with valid input', async ({ page }) => {
    await page.fill('#fullName', 'Ramesh Sharma');
    await page.fill('#dob', '1985-05-15');
    await page.fill('#addressLine1', '123 MG Road');
    await page.fill('#addressCity', 'Mumbai');
    await page.fill('#addressState', 'Maharashtra');
    await page.fill('#addressPincode', '400001');
    await page.fill('#phone', '9876543210');
    await page.fill('#email', 'ramesh@gmail.com');

    await page.click('#nextBtn');
    await expect(page.locator('#step2')).toHaveClass(/active/);

    // Step 2 -> Step 3
    await page.click('#nextBtn');
    await expect(page.locator('#step3')).toHaveClass(/active/);
  });

  test('should handle browser back button smoothly via popstate', async ({ page }) => {
    await page.fill('#fullName', 'Ramesh Sharma');
    await page.fill('#dob', '1985-05-15');
    await page.fill('#addressLine1', '123 MG Road');
    await page.fill('#addressCity', 'Mumbai');
    await page.fill('#addressState', 'Maharashtra');
    await page.fill('#addressPincode', '400001');
    await page.fill('#phone', '9876543210');
    await page.fill('#email', 'ramesh@gmail.com');

    await page.click('#nextBtn');
    await expect(page.locator('#step2')).toHaveClass(/active/);

    // Click browser back
    await page.goBack();
    await expect(page.locator('#step1')).toHaveClass(/active/);
  });
});
