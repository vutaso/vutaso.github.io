/**
 * Core logic tests — run with: node tests/core.test.js
 */
require("../core.js");
const core = globalThis.MarkdownCore;
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

function assert(cond, message) {
  if (!cond) throw new Error(message || "assertion failed");
}

test("suggestFilename uses first heading and strips illegal chars", () => {
  assert(core.suggestFilename("# Hello world") === "Hello-world");
  assert(core.suggestFilename("# a:b*c") === "abc");
  assert(core.suggestFilename("no heading") === "document");
});

test("isAllowedTextFile requires extension or a text MIME type", () => {
  assert(core.isAllowedTextFile({ name: "notes.md", type: "" }) === true);
  assert(core.isAllowedTextFile({ name: "notes.markdown", type: "" }) === true);
  assert(core.isAllowedTextFile({ name: "notes.txt", type: "text/plain" }) === true);
  assert(core.isAllowedTextFile({ name: "photo.png", type: "image/png" }) === false);
  assert(core.isAllowedTextFile({ name: "readme", type: "" }) === false);
  assert(core.isAllowedTextFile({ name: "readme", type: "text/plain" }) === true);
  assert(core.isAllowedTextFile(null) === false);
});

test("wrapSelection inserts markers around the selection", () => {
  const next = core.wrapSelection("hello world", 6, 11, "**", "**", "x");
  assert(next.value === "hello **world**");
  assert(next.selectionStart === 8);
  assert(next.selectionEnd === 13);
});

test("indentBlock inserts two spaces at the caret", () => {
  const next = core.indentBlock("ab", 1, 1, false);
  assert(next.value === "a  b");
  assert(next.selectionStart === 3);
});

test("indentBlock indents every selected line", () => {
  const src = "one\ntwo\nthree";
  const next = core.indentBlock(src, 0, src.length, false);
  assert(next.value === "  one\n  two\n  three");
});

test("indentBlock does not replace a selection with two spaces", () => {
  const src = "alpha\nbeta";
  const next = core.indentBlock(src, 0, src.length, false);
  assert(next.value.includes("alpha"));
  assert(next.value.includes("beta"));
  assert(!next.value.startsWith("  ") || next.value.split("\n").length === 2);
});

test("Shift-Tab unindents selected lines", () => {
  const next = core.indentBlock("  one\n  two", 0, 11, true);
  assert(next.value === "one\ntwo");
});

test("isRemoteImageSrc flags http(s) and protocol-relative URLs", () => {
  assert(core.isRemoteImageSrc("https://evil.test/x.png") === true);
  assert(core.isRemoteImageSrc("//cdn.test/x.png") === true);
  assert(core.isRemoteImageSrc("data:image/png;base64,abc") === false);
  assert(core.isRemoteImageSrc("") === false);
});

test("scrubPreviewRoot strips remote images and non-checkbox inputs", () => {
  const img = {
    attrs: { src: "https://evil.test/a.png", alt: "" },
    cls: "",
    classList: {
      add(name) { img.cls = name; },
    },
    getAttribute(name) { return this.attrs[name] || ""; },
    setAttribute(name, value) { this.attrs[name] = value; },
    removeAttribute(name) { delete this.attrs[name]; },
  };
  const ok = {
    attrs: { type: "checkbox" },
    getAttribute(name) { return this.attrs[name] || ""; },
    setAttribute(name, value) { this.attrs[name] = value; },
    remove() { this.removed = true; },
  };
  const bad = {
    attrs: { type: "password" },
    getAttribute(name) { return this.attrs[name] || ""; },
    setAttribute(name, value) { this.attrs[name] = value; },
    remove() { this.removed = true; },
  };
  const root = {
    querySelectorAll(sel) {
      if (sel === "img") return [img];
      if (sel === "input") return [ok, bad];
      return [];
    },
  };
  core.scrubPreviewRoot(root, "blocked");
  assert(!img.attrs.src, "remote src should be removed");
  assert(img.cls === "img-blocked");
  assert(ok.attrs.disabled === "");
  assert(bad.removed === true);
});

test("toggleHeadingLine cycles from none to h6 then off", () => {
  assert(core.toggleHeadingLine("Title", "Heading") === "# Title");
  assert(core.toggleHeadingLine("# Title") === "## Title");
  assert(core.toggleHeadingLine("###### Title") === "Title");
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
