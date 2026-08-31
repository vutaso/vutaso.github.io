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

  test('PNG export downloads a file', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#qr-preview canvas, #qr-preview svg').first()).toBeVisible({ timeout: 15_000 });
    await page.locator('#field-url').fill('https://example.com/e2e-export');
    await expect(page.locator('[data-export="png"][data-scale="1"]')).toBeEnabled();
    const downloadPromise = page.waitForEvent('download', { timeout: 20_000 });
    await page.locator('[data-export="png"][data-scale="1"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.png$/i);
  });

  test('dark mode applies dark CSS tokens', async ({ page }) => {
    await page.goto('/');
    await page.locator('#theme-toggle').click();
    const state = await page.evaluate(() => ({
      theme: document.documentElement.getAttribute('data-theme'),
      bg: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
    }));
    expect(state.theme).toBe('dark');
    expect(state.bg.toLowerCase()).not.toBe('#f7f9fc');
    expect(state.bg.toLowerCase()).toMatch(/#0f0f1a|#0f0f/);
  });

  test('Vietnamese default has no English Content suffix', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('qr-lang', 'vi'));
    await page.goto('/');
    await expect(page.locator('#form-title')).toBeVisible();
    await expect(page.locator('#form-title')).not.toHaveText(/Content/);
    await expect(page.locator('label[for="field-url"]')).toContainText(/URL website/i);
  });

  test('switching to English updates form title and labels', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('qr-lang', 'vi'));
    await page.goto('/');
    await page.locator('[data-lang="en"]').click();
    await expect(page.locator('#form-title')).toHaveText(/Content/);
    await expect(page.locator('label[for="field-url"]')).toContainText(/Website URL/i);
  });

  test('logo upload embeds image and raises error correction to H', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#qr-preview canvas, #qr-preview svg').first()).toBeVisible({ timeout: 15_000 });
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    await page.locator('#logo-file').setInputFiles({
      name: 'logo.png',
      mimeType: 'image/png',
      buffer: png
    });
    await expect(page.locator('#logo-preview-wrap')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#logo-preview-img')).toHaveAttribute('src', /^data:image\/png/);
    await expect(page.locator('#error-correction')).toHaveValue('H');
    await expect(page.locator('#qr-preview svg, #qr-preview canvas').first()).toBeVisible();
    await expect(page.locator('#qr-preview svg')).toBeVisible();
    await page.locator('#logo-remove').click();
    await expect(page.locator('#logo-preview-wrap')).toBeHidden();
  });

});
