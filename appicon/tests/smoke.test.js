/**
 * Smoke tests — run with: node tests/smoke.test.js
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
const siteRoot = path.join(root, "..");
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("✓", name);
  } catch (error) {
    failed++;
    console.error("✗", name, "-", error.message);
  }
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("SEO tags, canonical, and Open Graph", () => {
  const html = read("index.html");
  if (!html.includes('rel="canonical" href="https://vutaso.com/appicon/"')) throw new Error("canonical missing");
  if (!html.includes('property="og:title"')) throw new Error("og:title missing");
  if (!html.includes("og-image.png")) throw new Error("og image missing");
  if (!html.includes('name="twitter:card"')) throw new Error("twitter card missing");
  if (!html.includes("iOS") || !html.includes("Android")) throw new Error("title/description should mention iOS and Android");
  if (!html.includes("application/ld+json")) throw new Error("JSON-LD missing");
});

test("favicon and og image files exist", () => {
  if (!fs.existsSync(path.join(root, "favicon.svg"))) throw new Error("favicon.svg missing");
  if (!fs.existsSync(path.join(root, "og-image.png"))) throw new Error("og-image.png missing");
});

test("appicon is listed in the site sitemap", () => {
  const xml = fs.readFileSync(path.join(siteRoot, "sitemap.xml"), "utf8");
  if (!xml.includes("https://vutaso.com/appicon/")) throw new Error("sitemap missing /appicon/");
});

test("footer year is 2026 and links to legal pages", () => {
  const html = read("index.html");
  if (html.includes("© 2025")) throw new Error("footer still says 2025");
  if (!html.includes("© 2026")) throw new Error("footer missing 2026");
  if (!html.includes("../privacy/")) throw new Error("privacy link missing");
  if (!html.includes("../terms/")) throw new Error("terms link missing");
});

test("no leftover 14px desktop hero rule", () => {
  const css = read("styles.css");
  if (css.includes(".hero h1{font-size:14px}")) throw new Error("14px hero rule still present");
});

test("watchOS Contents.json includes role and watch-marketing", () => {
  const js = read("app.js");
  if (!js.includes('idiom: "watch-marketing"')) throw new Error("watch-marketing missing");
  if (!js.includes('role: "appLauncher"')) throw new Error("watch role missing");
});

test("Android adaptive assets use 432px and ic_launcher_colors.xml", () => {
  const js = read("app.js");
  if (!js.includes("androidAdaptiveDensities")) throw new Error("adaptive densities missing");
  if (!js.includes("pixels: 432")) throw new Error("xxxhdpi 432 missing");
  if (!js.includes("ic_launcher_colors.xml")) throw new Error("launcher colors file missing");
  if (js.includes('values.file("colors.xml"')) throw new Error("still writes colors.xml");
});

test("tvOS export uses brandassets imagestacks", () => {
  const js = read("app.js");
  if (!js.includes("App Icon & Top Shelf Image.brandassets")) throw new Error("brandassets missing");
  if (!js.includes("createTvBrandAssets")) throw new Error("createTvBrandAssets missing");
});

test("round launcher icons clip to a circle", () => {
  const js = read("app.js");
  if (!js.includes("round: true")) throw new Error("round option not used");
  if (!js.includes("context.arc(size / 2, size / 2, size / 2")) throw new Error("circle clip missing");
});

test("file input is visually hidden, not display:none", () => {
  const css = read("styles.css");
  if (css.includes(".drop-zone input{display:none}")) throw new Error("file input still display:none");
  if (!css.includes("clip:rect(0,0,0,0)")) throw new Error("visually-hidden clip missing");
});

test("page does not load Google Fonts", () => {
  const html = read("index.html");
  if (html.includes("fonts.googleapis.com")) throw new Error("Google Fonts still referenced");
});

test("i18n covers Vietnamese and English", () => {
  const i18n = read("i18n.js");
  if (!i18n.includes("window.AppIconI18n")) throw new Error("AppIconI18n not exported on window");
  if (!i18n.includes("vi:")) throw new Error("Vietnamese pack missing");
  const html = read("index.html");
  if (!html.includes("i18n.js")) throw new Error("i18n.js not loaded");
  if (!html.includes('data-lang="en"')) throw new Error("EN toggle missing");
});

test("JSZip is vendored with SRI", () => {
  if (!fs.existsSync(path.join(root, "vendor/jszip.min.js"))) throw new Error("jszip missing");
  const html = read("index.html");
  if (!html.includes("vendor/jszip.min.js")) throw new Error("jszip script missing");
  if (!html.includes("integrity=")) throw new Error("SRI missing");
});

test("JSZip SRI hash matches the vendored file", () => {
  const html = read("index.html");
  const match = html.match(/jszip\.min\.js" integrity="sha384-([^"]+)"/);
  if (!match) throw new Error("integrity attr missing");
  const actual = execSync(
    `openssl dgst -sha384 -binary "${path.join(root, "vendor/jszip.min.js")}" | openssl base64 -A`,
    { encoding: "utf8" }
  ).trim();
  if (actual !== match[1]) throw new Error(`SRI mismatch: html=${match[1]} file=${actual}`);
});

test("app.js i18n keys exist in both locales", () => {
  const js = read("app.js");
  const i18n = read("i18n.js");
  const keys = [...js.matchAll(/\bt\("([^"]+)"/g)].map((m) => m[1]);
  if (!keys.length) throw new Error("no t() keys found");
  ["vi:", "en:"].forEach((locale) => {
    if (!i18n.includes(locale)) throw new Error(`${locale} missing`);
  });
  keys.forEach((key) => {
    const needle = `"${key}"`;
    const count = i18n.split(needle).length - 1;
    if (count < 2) throw new Error(`key ${key} missing from a locale (found ${count})`);
  });
});

test("JavaScript files parse", () => {
  ["app.js", "i18n.js"].forEach((file) => {
    execSync(`node --check "${path.join(root, file)}"`, { stdio: "pipe" });
  });
});

test("app.js uses i18n for user-facing copy", () => {
  const js = read("app.js");
  if (!js.includes('document.addEventListener("i18n:change"')) throw new Error("i18n:change listener missing");
  if (!js.includes('t("error.type")')) throw new Error("error strings not localized");
  if (!js.includes("restoreUploadCopy")) throw new Error("upload copy helper missing");
});

test("styles do not load webfonts", () => {
  const css = read("styles.css");
  if (css.includes("Manrope") || css.includes("DM Mono") || css.includes("fonts.googleapis.com")) {
    throw new Error("webfont still referenced in CSS");
  }
});

test("JSZip MIT notice is vendored", () => {
  const notice = read("vendor/LICENSE.md");
  if (!notice.includes("Stuart Knightley")) throw new Error("JSZip copyright missing");
  if (!notice.includes("MIT")) throw new Error("MIT license missing");
});

test("noscript fallback exists", () => {
  if (!read("index.html").includes("<noscript>")) throw new Error("noscript missing");
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
