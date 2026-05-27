// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('QR Generator', () => {
  test('loads preview canvas', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#qr-preview')).toBeVisible();
    await expect(page.locator('#qr-preview canvas, #qr-preview svg').first()).toBeVisible({ timeout: 15_000 });
  });

  test('URL type encodes and enables PNG export', async ({ page }) => {
    await page.goto('/');
    const urlInput = page.locator('#field-url');
    await urlInput.fill('https://example.com/test');
    await expect(page.locator('#encoded-output')).toHaveValue(/example\.com/, { timeout: 5000 });
    await expect(page.locator('[data-export="png"][data-scale="1"]')).toBeEnabled();
  });

  test('WiFi type validates SSID', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-type="wifi"]').click();
    await page.locator('#field-ssid').fill('');
    await expect(page.locator('[data-export="png"][data-scale="1"]')).toBeDisabled({ timeout: 5000 });
    await page.locator('#field-ssid').fill('GuestWiFi');
    await page.locator('#field-password').fill('secret');
    await expect(page.locator('#encoded-output')).toHaveValue(/WIFI:/, { timeout: 5000 });
    await expect(page.locator('[data-export="png"][data-scale="1"]')).toBeEnabled();
  });

  test('batch mode parses CSV rows', async ({ page }) => {
    await page.goto('/');
    await page.locator('#batch-toggle').click();
    await page.locator('#batch-csv').fill('type,data,label\nurl,https://example.com,Site A\ntext,Hello,Hi');
    await page.locator('#batch-parse').click();
    await expect(page.locator('.batch-card')).toHaveCount(2, { timeout: 10_000 });
    await expect(page.locator('#batch-download-png')).toBeEnabled();
  });

  test('self-hosted QR library is present', async ({ page }) => {
    await page.goto('/');
    const hasLib = await page.evaluate(() => typeof window.QRCodeStyling === 'function');
    expect(hasLib).toBe(true);
  });
});
