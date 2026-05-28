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

  test('uploaded logo keeps preview visible', async ({ page }) => {
    await page.goto('/');
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    await page.locator('#field-url').fill('https://example.com/logo-test');
    await expect(page.locator('#qr-preview canvas').first()).toBeVisible({ timeout: 15_000 });
    await page.locator('#logo-upload').setInputFiles({
      name: 'logo.png',
      mimeType: 'image/png',
      buffer: png
    });
    await expect(page.locator('#qr-preview canvas').first()).toBeVisible({ timeout: 15_000 });
    const box = await page.locator('#qr-preview canvas').first().boundingBox();
    expect(box?.width).toBeGreaterThan(10);
    expect(box?.height).toBeGreaterThan(10);
  });

  test('uploaded logo after social template keeps preview visible', async ({ page }) => {
    await page.goto('/');
    await page.locator('#field-url').fill('https://example.com/logo-template-test');
    await expect(page.locator('#qr-preview canvas').first()).toBeVisible({ timeout: 15_000 });
    const template = page.locator('.template-card').first();
    if (await template.count()) {
      await template.click();
      await expect(page.locator('#qr-preview canvas').first()).toBeVisible({ timeout: 15_000 });
    }
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    await page.locator('#logo-upload').setInputFiles({
      name: 'Logo_MoneyBay.jpeg',
      mimeType: 'image/jpeg',
      buffer: png
    });
    await expect(page.locator('#qr-preview canvas').first()).toBeVisible({ timeout: 15_000 });
    const box = await page.locator('#qr-preview canvas').first().boundingBox();
    expect(box?.width).toBeGreaterThan(10);
    expect(box?.height).toBeGreaterThan(10);
  });
});
