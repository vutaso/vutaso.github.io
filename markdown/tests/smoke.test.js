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
  if (!html.includes('rel="canonical" href="https://vutaso.com/markdown/"')) throw new Error("canonical missing");
  if (!html.includes('property="og:title"')) throw new Error("og:title missing");
  if (!html.includes("og-image.jpg")) throw new Error("og image missing");
  if (!html.includes('name="twitter:card"')) throw new Error("twitter card missing");
  if (!html.includes("application/ld+json")) throw new Error("JSON-LD missing");
  if (!html.includes("Markdown")) throw new Error("title/description should mention Markdown");
});

test("favicon and og image files exist", () => {
  if (!fs.existsSync(path.join(root, "favicon.svg"))) throw new Error("favicon.svg missing");
  const og = path.join(root, "og-image.jpg");
  if (!fs.existsSync(og)) throw new Error("og-image.jpg missing");
  const size = fs.statSync(og).size;
  if (size > 200 * 1024) throw new Error("og-image.jpg too large: " + size);
});

test("markdown is listed in the site sitemap", () => {
  const xml = fs.readFileSync(path.join(siteRoot, "sitemap.xml"), "utf8");
  if (!xml.includes("https://vutaso.com/markdown/")) throw new Error("sitemap missing /markdown/");
});

test("footer year is 2026 and links to legal pages", () => {
  const html = read("index.html");
  if (html.includes("© 2025")) throw new Error("footer still says 2025");
  if (!html.includes("© 2026")) throw new Error("footer missing 2026");
  if (!html.includes("../privacy/")) throw new Error("privacy link missing");
  if (!html.includes("../terms/")) throw new Error("terms link missing");
});

test("page does not load Google Fonts", () => {
  const html = read("index.html");
  if (html.includes("fonts.googleapis.com")) throw new Error("Google Fonts still referenced");
});

test("i18n covers Vietnamese and English", () => {
  const i18n = read("i18n.js");
  if (!i18n.includes("window.MarkdownI18n")) throw new Error("MarkdownI18n not exported on window");
  if (!i18n.includes("vi:")) throw new Error("Vietnamese pack missing");
  const html = read("index.html");
  if (!html.includes("i18n.js")) throw new Error("i18n.js not loaded");
  if (!html.includes('data-lang="en"')) throw new Error("EN toggle missing");
});

test("CDN libraries use SRI", () => {
  const html = read("index.html");
  ["marked.min.js", "highlight.min.js", "purify.min.js"].forEach((file) => {
    if (!html.includes(file)) throw new Error(file + " script missing");
  });
  const integrityCount = (html.match(/integrity="sha384-/g) || []).length;
  if (integrityCount < 3) throw new Error("expected 3 SRI hashes, found " + integrityCount);
});

test("export actions exist", () => {
  const html = read("index.html");
  if (!html.includes('id="btnExportHtml"')) throw new Error("HTML export missing");
  if (!html.includes('id="btnExportPdf"')) throw new Error("PDF export missing");
  if (!html.includes('id="btnExportMd"')) throw new Error("Markdown export missing");
  const js = read("app.js");
  if (!js.includes("exportHtml")) throw new Error("exportHtml missing");
  if (!js.includes("html2pdf.bundle.min.js")) throw new Error("html2pdf missing");
  if (!js.includes('format: "a4"')) throw new Error("A4 PDF format missing");
  if (!js.includes("outputPdf")) throw new Error("PDF blob download missing");
  if (js.includes("win.print")) throw new Error("print dialog should not be used for PDF");
  if (!js.includes("setRangeText")) throw new Error("undo-safe setRangeText missing");
  if (!js.includes("DOMPurify.sanitize")) throw new Error("sanitize missing");
});

test("PDF exporter uses SRI and A4-only content", () => {
  const js = read("app.js");
  if (!js.includes("sha384-jxZ2EFKjdq0Gra2Kt8wRo3xqMp2EPnNV6k9y0bDDgb2wTGrxSyZJn7aQq35UqYIj")) {
    throw new Error("html2pdf SRI missing");
  }
  if (!js.includes("backgroundColor: \"#ffffff\"")) throw new Error("white PDF background missing");
  if (!js.includes("pdfRoot")) throw new Error("isolated PDF root missing");
  if (!js.includes("color: #000000")) throw new Error("black PDF text missing");
  if (!js.includes("loadHtml2PdfIn")) throw new Error("in-iframe html2pdf capture missing");
  if (js.includes("pdf.hint")) throw new Error("print-header hint still referenced");
});

test("split editor and live preview markup exist", () => {
  const html = read("index.html");
  if (!html.includes('id="editor"')) throw new Error("editor missing");
  if (!html.includes('id="preview"')) throw new Error("preview missing");
  if (!html.includes('data-view="split"')) throw new Error("split view missing");
  if (!html.includes("mobile-tabs")) throw new Error("mobile tabs missing");
});

test("split gutter defaults to 30/70 and is draggable", () => {
  const html = read("index.html");
  if (!html.includes('id="splitGutter"')) throw new Error("split gutter missing");
  if (!html.includes('role="separator"')) throw new Error("separator role missing");
  const css = read("styles.css");
  if (!css.includes("--editor-pct: 30%")) throw new Error("default 30% editor missing");
  if (!css.includes(".split-gutter")) throw new Error("gutter styles missing");
  const js = read("app.js");
  if (!js.includes("markdown-split")) throw new Error("split persistence missing");
  if (!js.includes("bindSplitter")) throw new Error("bindSplitter missing");
  const i18n = read("i18n.js");
  const splitCount = i18n.split('"split.label"').length - 1;
  if (splitCount < 2) throw new Error("split.label missing from a locale");
});

test("app.js i18n keys exist in both locales", () => {
  const js = read("app.js");
  const i18n = read("i18n.js");
  const keys = [...js.matchAll(/\bt\("([^"]+)"/g)].map((m) => m[1]);
  if (!keys.length) throw new Error("no t() keys found");
  ["vi:", "en:"].forEach((locale) => {
    if (!i18n.includes(locale)) throw new Error(locale + " missing");
  });
  keys.forEach((key) => {
    const needle = `"${key}"`;
    const count = i18n.split(needle).length - 1;
    if (count < 2) throw new Error(`key ${key} missing from a locale (found ${count})`);
  });
});

test("JavaScript files parse", () => {
  ["app.js", "i18n.js", "core.js"].forEach((file) => {
    execSync(`node --check "${path.join(root, file)}"`, { stdio: "pipe" });
  });
});

test("styles do not load webfonts", () => {
  const css = read("styles.css");
  if (css.includes("fonts.googleapis.com")) throw new Error("webfont still referenced in CSS");
});

test("homepage lists the markdown tool", () => {
  const home = fs.readFileSync(path.join(siteRoot, "index.html"), "utf8");
  if (!home.includes("https://vutaso.com/markdown/")) throw new Error("homepage missing /markdown/ link");
  if (!home.includes("nav_tool_markdown")) throw new Error("nav i18n key missing");
  if (!home.includes("ft_tool_markdown")) throw new Error("footer i18n key missing");
});

test("noscript fallback exists", () => {
  if (!read("index.html").includes("<noscript>")) throw new Error("noscript missing");
});

test("file input is visually hidden, not display:none", () => {
  const css = read("styles.css");
  const html = read("index.html");
  if (!html.includes('class="visually-hidden"')) throw new Error("visually-hidden class missing on file input");
  if (html.includes('id="fileInput" class="hidden"')) throw new Error("file input still uses hidden");
  if (!css.includes("clip: rect(0, 0, 0, 0)")) throw new Error("visually-hidden clip missing");
});

test("i18n localStorage access is guarded", () => {
  const i18n = read("i18n.js");
  if (!i18n.includes("try {") && !i18n.includes("try {")) throw new Error("try/catch missing");
  if (!i18n.includes("localStorage.getItem(KEY)")) throw new Error("getItem missing");
  const tryCount = (i18n.match(/try \{/g) || []).length;
  if (tryCount < 2) throw new Error("expected guarded getItem and setItem");
});

test("textarea has an accessible name", () => {
  const html = read("index.html");
  if (!html.includes('data-i18n-aria="editor.label"')) throw new Error("editor aria-label missing");
});

test("autosave uses localStorage", () => {
  const js = read("app.js");
  if (!js.includes("localStorage.setItem")) throw new Error("autosave missing");
  if (!js.includes("markdown-editor-doc")) throw new Error("storage key missing");
  if (!js.includes("error.save")) throw new Error("save failure toast missing");
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
