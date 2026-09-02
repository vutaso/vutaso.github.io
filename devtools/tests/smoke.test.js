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
  if (!html.includes('rel="canonical" href="https://vutaso.com/devtools/"')) throw new Error("canonical missing");
  if (!html.includes('property="og:title"')) throw new Error("og:title missing");
  if (!html.includes("og-image.jpg")) throw new Error("og image missing");
  if (!html.includes('name="twitter:card"')) throw new Error("twitter card missing");
  if (!html.includes("application/ld+json")) throw new Error("JSON-LD missing");
  if (!html.includes("JSON")) throw new Error("title should mention JSON");
});

test("favicon and og image files exist", () => {
  if (!fs.existsSync(path.join(root, "favicon.svg"))) throw new Error("favicon.svg missing");
  const og = path.join(root, "og-image.jpg");
  if (!fs.existsSync(og)) throw new Error("og-image.jpg missing");
  const size = fs.statSync(og).size;
  if (size > 200 * 1024) throw new Error("og-image.jpg too large: " + size);
});

test("devtools is listed in the site sitemap", () => {
  const xml = fs.readFileSync(path.join(siteRoot, "sitemap.xml"), "utf8");
  if (!xml.includes("https://vutaso.com/devtools/")) throw new Error("sitemap missing /devtools/");
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
  if (!i18n.includes("window.DevToolsI18n")) throw new Error("DevToolsI18n not exported");
  if (!i18n.includes("vi:")) throw new Error("Vietnamese pack missing");
  const html = read("index.html");
  if (!html.includes("i18n.js")) throw new Error("i18n.js not loaded");
  if (!html.includes('data-lang="en"')) throw new Error("EN toggle missing");
});

test("JSON raw/parsed toggle, worker, and URL fetch", () => {
  const html = read("index.html");
  if (!html.includes('id="btnJsonValidate"')) throw new Error("Validate button missing");
  if (!html.includes('id="jsonStatus"')) throw new Error("JSON status panel missing");
  if (!html.includes('id="btnJsonRaw"')) throw new Error("Raw button missing");
  const js = read("app.js");
  if (!js.includes("window.json")) throw new Error("window.json export missing");
  if (js.includes('params.get("json")')) throw new Error("?json= query must not leak editor content");
  if (!js.includes("bootFromQuery")) throw new Error("query URL bootstrap missing");
  if (!js.includes("isJsonFetchUrl") && !js.includes("readFetchUrl")) throw new Error("URL fetch missing");
  if (!js.includes("credentials: \"omit\"")) throw new Error("fetch should omit credentials");
  if (!js.includes("response.ok")) throw new Error("fetch must check HTTP status");
  if (!js.includes("jsonFetchSeq += 1")) throw new Error("local format must cancel in-flight fetch");
  if (!js.includes("hideToast")) throw new Error("fetching toast must be dismissed");
  if (!js.includes("applyJsonValidate")) throw new Error("validate action missing");
  if (!js.includes("error.json.pos.reason")) throw new Error("detailed parse error i18n missing");
  if (!js.includes("error.json.depth")) throw new Error("depth error i18n missing");
  if (!js.includes("json.unwrapped")) throw new Error("unwrap notice i18n missing");
  if (!js.includes("tooBig(body)")) throw new Error("fetch size check missing");
  if (!js.includes("new Worker")) throw new Error("JSON worker missing");
  if (!js.includes("setSelectionRange")) throw new Error("scroll/caret to parse error missing");
  if (!js.includes("decodeUtf8Document")) throw new Error("UTF-8 file decode missing");
  if (!js.includes("application/json;charset=utf-8")) throw new Error("UTF-8 download missing");
  const worker = read("json-worker.js");
  if (!worker.includes("importScripts")) throw new Error("worker must import core.js");
  if (!worker.includes("postMessage")) throw new Error("worker must post results");
});

test("JSON tree viewer is wired", () => {
  const html = read("index.html");
  if (!html.includes('id="jsonTree"')) throw new Error("jsonTree missing");
  if (!html.includes("jf-tree")) throw new Error("tree class missing");
  const js = read("app.js");
  const core = read("core.js");
  if (!core.includes("looksLikeJson")) throw new Error("fast JSON sniff missing");
  if (core.includes("([\\s\\S]*)\\s*\\)")) throw new Error("greedy JSONP capture must not be used");
  if (!core.includes("sliceBalancedParen")) throw new Error("balanced JSONP unwrap missing");
  if (!js.includes("jf-toggle")) throw new Error("collapse toggle missing");
  if (!js.includes("noopener")) throw new Error("URL links must be noopener");
  if (!js.includes("JF_CHUNK")) throw new Error("chunked render missing");
  if (!js.includes("TREE_SLICE_MS")) throw new Error("tree fill must be time-sliced");
  if (!js.includes("TREE_EXPAND_BUDGET")) throw new Error("tree auto-expand budget missing");
  if (!js.includes("enqueueTreeFill")) throw new Error("tree fill must be scheduled, not recursive sync");
  if (js.includes("if (depth > 0) return false")) throw new Error("Format tree must expand nested nodes");
  const css = read("styles.css");
  if (!css.includes(".jf-children")) throw new Error("indent guide container missing");
  if (!css.includes("border-left")) throw new Error("indent guides missing");
  if (!css.includes(".jf-key")) throw new Error("syntax highlight missing");
  if (!css.includes(".jf-link")) throw new Error("clickable URL style missing");
});

test("JSON Base64 Hash tabs exist", () => {
  const html = read("index.html");
  if (!html.includes('data-tool="json"')) throw new Error("JSON tab missing");
  if (!html.includes('data-tool="base64"')) throw new Error("Base64 tab missing");
  if (!html.includes('data-tool="hash"')) throw new Error("Hash tab missing");
  const js = read("app.js");
  if (!js.includes("formatJson")) throw new Error("formatJson missing");
  if (!js.includes("encodeBase64")) throw new Error("encodeBase64 missing");
  if (!js.includes("md5")) throw new Error("md5 missing");
  if (!js.includes("sha256")) throw new Error("sha256 missing");
});

test("tabs expose keyboard and ARIA wiring", () => {
  const html = read("index.html");
  if (!html.includes('role="tablist"')) throw new Error("tablist missing");
  if (!html.includes('aria-controls="workspace"')) throw new Error("aria-controls missing");
  if (!html.includes('role="tabpanel"')) throw new Error("tabpanel missing");
  if (!html.includes('id="tab-json"')) throw new Error("tab ids missing");
  const js = read("app.js");
  if (!js.includes("ArrowRight")) throw new Error("arrow key handling missing");
  if (!js.includes("tabIndex")) throw new Error("roving tabindex missing");
});

test("hash updates are debounced and oversized input is cleared", () => {
  const js = read("app.js");
  if (!js.includes("setTimeout(computeHash")) throw new Error("hash debounce missing");
  if (!js.includes("sizeWarned")) throw new Error("size toast guard missing");
  if (!js.includes('hashMd5.textContent = ""')) throw new Error("stale hash must be cleared when over size");
  if (!js.includes("function copyHash")) throw new Error("hash copy must flush debounce");
});

test("Base64 oversize clears previous output", () => {
  const js = read("app.js");
  const start = js.indexOf("function runB64");
  const end = js.indexOf("function swapB64");
  if (start < 0 || end < 0) throw new Error("runB64/swapB64 missing");
  const run = js.slice(start, end);
  if (!run.includes("tooBig(b64Input.value)")) throw new Error("base64 size check missing");
  if (!run.includes('b64Output.value = ""')) throw new Error("oversize base64 must clear output");
});

test("copy empty and JSON errors use i18n keys", () => {
  const js = read("app.js");
  if (!js.includes('t("copy.empty")')) throw new Error("copy.empty missing");
  if (!js.includes("error.json.empty")) throw new Error("empty JSON i18n missing");
  if (!js.includes("error.json.fetch")) throw new Error("fetch JSON i18n missing");
  if (!js.includes("error.b64.binary")) throw new Error("binary Base64 i18n missing");
  if (js.includes("result.error")) throw new Error("engine error strings should not be shown");
});

test("app.js i18n keys exist in both locales", () => {
  const js = read("app.js");
  const i18n = read("i18n.js");
  const keys = [...js.matchAll(/\bt\("([^"]+)"/g)].map((m) => m[1]);
  if (!keys.length) throw new Error("no t() keys found");
  keys.forEach((key) => {
    const needle = `"${key}"`;
    const count = i18n.split(needle).length - 1;
    if (count < 2) throw new Error(`key ${key} missing from a locale (found ${count})`);
  });
});

test("core does not parse JSON with eval and does not use innerHTML", () => {
  const core = read("core.js");
  const app = read("app.js");
  if (/\beval\s*\(/.test(core) || /\beval\s*\(/.test(app)) throw new Error("eval() is not allowed");
  if (app.includes("innerHTML")) throw new Error("app must not assign innerHTML");
  if (!core.includes("MAX_JSON_DEPTH")) throw new Error("depth cap missing");
  if (!core.includes("PERF_BUDGET_1MB_MS")) throw new Error("1MB budget missing");
});

test("JavaScript files parse", () => {
  ["app.js", "i18n.js", "core.js", "json-worker.js"].forEach((file) => {
    execSync(`node --check "${path.join(root, file)}"`, { stdio: "pipe" });
  });
});

test("styles do not load webfonts", () => {
  const css = read("styles.css");
  if (css.includes("fonts.googleapis.com")) throw new Error("webfont still referenced in CSS");
});

test("homepage lists the devtools tool", () => {
  const home = fs.readFileSync(path.join(siteRoot, "index.html"), "utf8");
  if (!home.includes("https://vutaso.com/devtools/")) throw new Error("homepage missing /devtools/ link");
  if (!home.includes("nav_tool_devtools")) throw new Error("nav i18n key missing");
  if (!home.includes("ft_tool_devtools")) throw new Error("footer i18n key missing");
});

test("privacy policy covers DevTools local processing", () => {
  const html = fs.readFileSync(path.join(siteRoot, "privacy/index.html"), "utf8");
  if (!html.includes("DevTools")) throw new Error("privacy missing DevTools");
  if (!html.includes("?json=")) throw new Error("privacy should document that ?json= is not used");
});

test("noscript fallback exists", () => {
  if (!read("index.html").includes("<noscript>")) throw new Error("noscript missing");
});

test("i18n localStorage access is guarded", () => {
  const i18n = read("i18n.js");
  if (!i18n.includes("localStorage.getItem(KEY)")) throw new Error("getItem missing");
  const tryCount = (i18n.match(/try \{/g) || []).length;
  if (tryCount < 2) throw new Error("expected guarded getItem and setItem");
});

test("JSON input draft is persisted locally, hash is not", () => {
  const js = read("app.js");
  if (!js.includes("devtools-json-draft")) throw new Error("JSON draft key missing");
  if (!js.includes("pagehide")) throw new Error("draft should flush on pagehide/F5");
  if (js.includes("devtools-doc")) throw new Error("content storage key should not exist");
  if (/localStorage\.setItem\([^)]*hashInput/.test(js)) throw new Error("hash content must not be saved");
});

test("textarea has an accessible name", () => {
  const html = read("index.html");
  if (!html.includes('data-i18n-aria="json.label"')) throw new Error("json aria-label missing");
  if (!html.includes('data-i18n-aria="hash.label"')) throw new Error("hash aria-label missing");
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
