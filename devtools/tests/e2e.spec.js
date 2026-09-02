const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

test("format happy path preserves big integers", async ({ page }) => {
  await page.goto("./");
  await page.locator("#jsonInput").fill('{"b":1,"a":9007199254740993}');
  await page.locator("#btnJsonFormat").click();
  await expect(page.locator("#jsonOutput")).toHaveValue(/9007199254740993/, { timeout: 10000 });
  await expect(page.locator("#jsonOutput")).toHaveValue(/"b": 1/);
  await expect(page.locator("#toast.error")).toHaveCount(0);
});

test("parsed tree expands nested objects for typical JSON", async ({ page }) => {
  await page.goto("./");
  await page.locator("#jsonInput").fill(
    '{"customer":{"contact":{"email":"a@b.c"},"roles":[{"name":"buyer"}]}}'
  );
  await page.locator("#btnJsonFormat").click();
  await expect(page.locator("#jsonTree")).toContainText("contact", { timeout: 10000 });
  await expect(page.locator("#jsonTree")).toContainText("roles");
  await expect(page.locator("#jsonTree")).toContainText("buyer");
  await expect(page.locator("#jsonTree")).toContainText("a@b.c");
});

test("parsed tree stays interactive on a large array", async ({ page }) => {
  await page.goto("./");
  await page.locator("#jsonInput").evaluate((el) => {
    const rows = [];
    for (let i = 0; i < 2500; i++) rows.push('{"id":' + i + ',"n":9007199254740993}');
    el.value = '{"items":[' + rows.join(",") + "]}";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.locator("#btnJsonFormat").click();
  await expect(page.locator("#jsonOutput")).toHaveValue(/9007199254740993/, { timeout: 15000 });
  await expect(page.locator("#jsonTree")).toContainText("2500");
  await expect(page.locator("#jsonTree .jf-toggle")).toHaveCount(2);
  await expect(page.locator("#btnJsonFormat")).toBeEnabled();
  await page.locator("#jsonTree .jf-toggle").nth(1).click();
  await expect(page.locator("#jsonTree .jf-toggle")).not.toHaveCount(2, { timeout: 5000 });
  await expect(page.locator("#btnJsonMinify")).toBeEnabled();
});

test("validate invalid JSON shows a persistent error message", async ({ page }) => {
  await page.goto("./");
  await page.locator("#jsonInput").fill('{"a":1,}');
  await page.locator("#btnJsonValidate").click();
  await expect(page.locator("#jsonStatus")).toBeVisible({ timeout: 10000 });
  await expect(page.locator("#jsonStatus")).toHaveClass(/is-error/);
  await expect(page.locator("#jsonStatus")).toContainText(/comma|phẩy/i);
});

test("JSON input survives reload", async ({ page }) => {
  await page.goto("./");
  await page.locator("#jsonInput").fill('{"keep":true}');
  await page.waitForTimeout(300);
  await page.reload();
  await expect(page.locator("#jsonInput")).toHaveValue('{"keep":true}');
});

test("validate valid JSON shows success", async ({ page }) => {
  await page.goto("./");
  await page.locator("#jsonInput").fill('{"ok":true}');
  await page.locator("#btnJsonValidate").click();
  await expect(page.locator("#jsonStatus")).toBeVisible({ timeout: 10000 });
  await expect(page.locator("#jsonStatus")).toHaveClass(/is-ok/);
  await expect(page.locator("#jsonStatus")).not.toHaveClass(/is-error/);
});

test("invalid JSON does not crash and is recoverable without reload", async ({ page }) => {
  await page.goto("./");
  await page.locator("#jsonInput").fill("{not json");
  await page.locator("#btnJsonFormat").click();
  await expect(page.locator("#toast")).toHaveClass(/error/, { timeout: 10000 });
  await expect(page.locator("#toast")).toContainText(/JSON|thuộc tính|property/i);
  await page.locator("#btnJsonClear").click();
  await expect(page.locator("#jsonInput")).toHaveValue("");
  await page.locator("#jsonInput").fill('{"ok":true}');
  await page.locator("#btnJsonFormat").click();
  await expect(page.locator("#jsonOutput")).toHaveValue(/"ok": true/, { timeout: 10000 });
});

test("upload sample json", async ({ page }) => {
  const fileInput = page.locator("#jsonFile");
  if (!(await fileInput.count())) test.skip();
  await page.goto("./");
  await fileInput.setInputFiles(path.join(__dirname, "sample.json"));
  await expect(page.locator("#jsonOutput")).toHaveValue(/hello/, { timeout: 10000 });
});

test("download is UTF-8 without BOM", async ({ page }) => {
  await page.goto("./");
  const downloadBtn = page.locator("#btnJsonDownload");
  if (!(await downloadBtn.count())) test.skip();
  await page.locator("#jsonInput").fill('{"hi":"👋"}');
  await page.locator("#btnJsonFormat").click();
  await expect(page.locator("#jsonOutput")).toHaveValue(/👋/, { timeout: 10000 });
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    downloadBtn.click(),
  ]);
  const filePath = await download.path();
  const buf = fs.readFileSync(filePath);
  expect(buf[0]).not.toBe(0xef);
  expect(buf.toString("utf8")).toContain("👋");
});
