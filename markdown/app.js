(() => {
  const STORAGE_KEY = "markdown-editor-doc";
  const core = window.MarkdownCore;
  if (!core) return;
  const MAX_DOC_CHARS = core.MAX_DOC_CHARS;
  const MAX_HIGHLIGHT_CHARS = core.MAX_HIGHLIGHT_CHARS;

  const editor = document.querySelector("#editor");
  const preview = document.querySelector("#preview");
  const previewScroll = document.querySelector("#previewScroll");
  const workspace = document.querySelector("#workspace");
  const stats = document.querySelector("#stats");
  const toastEl = document.querySelector("#toast");
  const fileInput = document.querySelector("#fileInput");
  const toolbar = document.querySelector("#toolbar");

  const t = (key, vars) => (window.MarkdownI18n ? MarkdownI18n.t(key, vars) : key);

  const EXPORT_CSS = `
@page { size: A4; margin: 16mm; }
* { box-sizing: border-box; }
body {
  margin: 0;
  background: #fff;
  color: #1a1a1a;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  line-height: 1.7;
}
.md-preview { max-width: 46rem; margin: 0 auto; font-size: 15px; }
.md-preview > :first-child { margin-top: 0; }
h1, h2, h3, h4 { line-height: 1.25; letter-spacing: -0.02em; margin: 1.4em 0 0.5em; }
h1 { font-size: 1.85rem; border-bottom: 1px solid #ddd; padding-bottom: 0.35em; }
h2 { font-size: 1.35rem; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
h3 { font-size: 1.12rem; }
p, ul, ol, blockquote, table, pre { margin: 0.85em 0; }
a { color: #0b6bcb; }
code {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 0.88em;
  background: #f4f4f5;
  border: 1px solid #e6e6e8;
  padding: 0.12em 0.38em;
}
pre {
  background: #f6f7f9;
  border: 1px solid #e6e6e8;
  padding: 14px 16px;
  overflow-x: auto;
}
pre code { background: none; border: 0; padding: 0; font-size: 12.5px; line-height: 1.55; }
blockquote {
  border-left: 3px solid #3b9cff;
  margin-left: 0;
  padding: 0.15em 0 0.15em 1em;
  color: #555;
}
table { border-collapse: collapse; width: 100%; font-size: 13.5px; }
th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
th { background: #f6f7f9; }
img { max-width: 100%; height: auto; }
img.img-blocked { display: none; }
hr { border: 0; border-top: 1px solid #ddd; margin: 1.6em 0; }
.task-list-item { list-style: none; }
ul.contains-task-list { padding-left: 0.4em; }
.hljs-keyword, .hljs-selector-tag { color: #7c3aed; }
.hljs-string, .hljs-attr { color: #0f7b3a; }
.hljs-comment { color: #6b7280; }
.hljs-number, .hljs-literal { color: #c2410c; }
.hljs-built_in, .hljs-title.function_ { color: #1d4ed8; }
@media print {
  body { padding: 0; }
  .md-preview { max-width: none; }
  pre, table, blockquote { break-inside: avoid-page; page-break-inside: avoid; }
  h1, h2, h3 { break-after: avoid-page; page-break-after: avoid; }
}
`;

  let toastTimer = 0;
  let previewTimer = 0;
  let syncing = false;
  let markedReady = false;
  let persistWarned = false;
  let sanitizeHooked = false;

  function showToast(message, isError) {
    toastEl.textContent = message;
    toastEl.classList.toggle("error", !!isError);
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 2600);
  }

  function countWords(text) {
    const trimmed = String(text || "").trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function applyRange(start, end, replacement, selStart, selEnd) {
    editor.focus();
    if (typeof editor.setRangeText === "function") {
      editor.setRangeText(replacement, start, end, "select");
    } else {
      editor.value = editor.value.slice(0, start) + replacement + editor.value.slice(end);
    }
    editor.setSelectionRange(selStart, selEnd);
    onEditorInput();
  }

  function applyLocalEdit(next) {
    const old = editor.value;
    let rangeStart = 0;
    const max = Math.min(old.length, next.value.length);
    while (rangeStart < max && old[rangeStart] === next.value[rangeStart]) rangeStart++;
    let oldEnd = old.length;
    let newEnd = next.value.length;
    while (oldEnd > rangeStart && newEnd > rangeStart && old[oldEnd - 1] === next.value[newEnd - 1]) {
      oldEnd--;
      newEnd--;
    }
    applyRange(rangeStart, oldEnd, next.value.slice(rangeStart, newEnd), next.selectionStart, next.selectionEnd);
  }

  function highlightCode(code, lang) {
    const source = String(code || "");
    if (source.length > MAX_HIGHLIGHT_CHARS) return core.escapeHtml(source);
    try {
      if (window.hljs && lang && hljs.getLanguage(lang)) {
        return hljs.highlight(source, { language: lang, ignoreIllegals: true }).value;
      }
    } catch {}
    return core.escapeHtml(source);
  }

  function setupSanitizeHook() {
    if (sanitizeHooked || !window.DOMPurify) return;
    DOMPurify.addHook("afterSanitizeAttributes", (node) => {
      if (!(node instanceof Element)) return;
      if (node.tagName === "INPUT") {
        if ((node.getAttribute("type") || "").toLowerCase() !== "checkbox") {
          node.remove();
          return;
        }
        node.setAttribute("type", "checkbox");
        node.setAttribute("disabled", "");
      }
      if (node.tagName === "IMG") {
        node.removeAttribute("srcset");
        const src = node.getAttribute("src") || "";
        if (core.isRemoteImageSrc(src) || (src && !/^data:image\//i.test(src))) {
          node.removeAttribute("src");
          node.classList.add("img-blocked");
        }
      }
    });
    sanitizeHooked = true;
  }

  function setupMarked() {
    if (!window.marked) return false;
    setupSanitizeHook();
    const renderer = new marked.Renderer();
    renderer.code = (token, langArg) => {
      const { code, lang } = core.tokenizeCode(token, langArg);
      const highlighted = highlightCode(code, lang);
      const cls = lang ? " class=\"hljs language-" + lang.replace(/[^a-zA-Z0-9_+-]/g, "") + "\"" : " class=\"hljs\"";
      return "<pre><code" + cls + ">" + highlighted + "</code></pre>";
    };
    marked.use({ renderer, gfm: true, breaks: true });
    markedReady = true;
    return true;
  }

  function renderMarkdown(source) {
    if (!source.trim()) return "";
    if (!markedReady || !window.DOMPurify) return "";
    const html = marked.parse(source);
    return DOMPurify.sanitize(html, {
      ADD_TAGS: ["input"],
      ADD_ATTR: ["checked", "disabled", "type", "class", "start"],
    });
  }

  function decoratePreview(root) {
    core.scrubPreviewRoot(root, t("img.blocked"));
    root.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (/^https?:/i.test(href)) {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      }
    });
  }

  function updatePreview() {
    const source = editor.value;
    const html = renderMarkdown(source);
    if (!source.trim()) {
      preview.innerHTML = '<p class="preview-empty">' + t("preview.empty") + "</p>";
    } else if (!html) {
      preview.innerHTML = '<p class="preview-empty">' + t("error.lib") + "</p>";
    } else {
      preview.innerHTML = html;
      decoratePreview(preview);
    }
    stats.textContent = t("stats.meta", {
      words: String(countWords(source)),
      chars: String(source.length),
    });
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, editor.value);
      persistWarned = false;
    } catch {
      if (!persistWarned) {
        persistWarned = true;
        showToast(t("error.save"), true);
      }
    }
  }

  function onEditorInput() {
    if (editor.value.length > MAX_DOC_CHARS) {
      const start = editor.selectionStart;
      editor.value = editor.value.slice(0, MAX_DOC_CHARS);
      const caret = Math.min(start, editor.value.length);
      editor.setSelectionRange(caret, caret);
      showToast(t("error.size"), true);
    }
    persist();
    clearTimeout(previewTimer);
    previewTimer = setTimeout(updatePreview, 80);
  }

  function setEditorValue(value, { persistNow = true } = {}) {
    const next = String(value || "").slice(0, MAX_DOC_CHARS);
    editor.value = next;
    if (persistNow) persist();
    updatePreview();
  }

  function surround(prefix, suffix, placeholder) {
    const next = core.wrapSelection(
      editor.value,
      editor.selectionStart,
      editor.selectionEnd,
      prefix,
      suffix,
      placeholder
    );
    applyLocalEdit(next);
  }

  function prefixSelectedLines(prefix, placeholder) {
    const next = core.prefixLines(
      editor.value,
      editor.selectionStart,
      editor.selectionEnd,
      prefix,
      placeholder
    );
    applyLocalEdit(next);
  }

  function toggleHeading() {
    const start = editor.selectionStart;
    const value = editor.value;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEndRaw = value.indexOf("\n", start);
    const lineEnd = lineEndRaw === -1 ? value.length : lineEndRaw;
    const line = value.slice(lineStart, lineEnd);
    const nextLine = core.toggleHeadingLine(line, t("ph.heading"));
    applyRange(lineStart, lineEnd, nextLine, lineStart + nextLine.length, lineStart + nextLine.length);
  }

  function wrapCode() {
    const selected = editor.value.slice(editor.selectionStart, editor.selectionEnd);
    if (selected.includes("\n") || !selected) {
      surround("```\n", "\n```", t("ph.code"));
    } else {
      surround("`", "`", t("ph.code"));
    }
  }

  function insertLink() {
    const selected = editor.value.slice(editor.selectionStart, editor.selectionEnd) || t("link.text");
    surround("[", "](" + t("link.url") + ")", selected);
  }

  function buildExportHtml(title, bodyHtml, extraCss) {
    const safeTitle = core.escapeHtml(title || "document");
    return `<!DOCTYPE html>
<html lang="${MarkdownI18n.getLang()}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <style>${EXPORT_CSS}${extraCss || ""}</style>
</head>
<body>
  <article class="md-preview">${bodyHtml}</article>
</body>
</html>`;
  }

  function exportMarkdown() {
    const blob = new Blob([editor.value], { type: "text/markdown;charset=utf-8" });
    downloadBlob(blob, core.suggestFilename(editor.value) + ".md");
  }

  function exportHtml() {
    const body = renderMarkdown(editor.value) || "";
    const wrap = document.createElement("div");
    wrap.innerHTML = body;
    decoratePreview(wrap);
    const html = buildExportHtml(core.suggestFilename(editor.value), wrap.innerHTML);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    downloadBlob(blob, core.suggestFilename(editor.value) + ".html");
  }

  const HTML2PDF_SRC = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.12.1/html2pdf.bundle.min.js";
  const HTML2PDF_SRI = "sha384-jxZ2EFKjdq0Gra2Kt8wRo3xqMp2EPnNV6k9y0bDDgb2wTGrxSyZJn7aQq35UqYIj";
  const PDF_DOC_CSS = `
html, body {
  margin: 0;
  padding: 0;
  background: #ffffff;
  color: #000000;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
}
#pdfRoot {
  box-sizing: border-box;
  width: 794px;
  padding: 0;
  background: #ffffff;
  color: #000000;
  font-size: 15px;
  line-height: 1.7;
}
#pdfRoot, #pdfRoot *:not(a) { color: #000000 !important; }
#pdfRoot a { color: #0b6bcb !important; }
#pdfRoot * { box-sizing: border-box; }
#pdfRoot > :first-child { margin-top: 0; }
#pdfRoot h1, #pdfRoot h2, #pdfRoot h3, #pdfRoot h4 {
  line-height: 1.25;
  letter-spacing: -0.02em;
  margin: 1.4em 0 0.5em;
}
#pdfRoot h1 { font-size: 1.85rem; border-bottom: 1px solid #dddddd; padding-bottom: 0.35em; }
#pdfRoot h2 { font-size: 1.35rem; border-bottom: 1px solid #eeeeee; padding-bottom: 0.3em; }
#pdfRoot h3 { font-size: 1.12rem; }
#pdfRoot p, #pdfRoot ul, #pdfRoot ol, #pdfRoot blockquote, #pdfRoot table, #pdfRoot pre { margin: 0.85em 0; }
#pdfRoot code {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 0.88em;
  background: #f4f4f5 !important;
  border: 1px solid #e6e6e8;
  padding: 0.12em 0.38em;
}
#pdfRoot pre {
  background: #f6f7f9 !important;
  border: 1px solid #e6e6e8;
  padding: 14px 16px;
  overflow: visible;
}
#pdfRoot pre code { background: none !important; border: 0; padding: 0; font-size: 12.5px; line-height: 1.55; }
#pdfRoot blockquote {
  border-left: 3px solid #3b9cff;
  margin-left: 0;
  padding: 0.15em 0 0.15em 1em;
  color: #333333 !important;
}
#pdfRoot table { border-collapse: collapse; width: 100%; font-size: 13.5px; }
#pdfRoot th, #pdfRoot td { border: 1px solid #dddddd; padding: 8px 10px; text-align: left; }
#pdfRoot th { background: #f6f7f9 !important; }
#pdfRoot img { max-width: 100%; height: auto; }
#pdfRoot img.img-blocked { display: none; }
#pdfRoot hr { border: 0; border-top: 1px solid #dddddd; margin: 1.6em 0; }
#pdfRoot .task-list-item { list-style: none; }
#pdfRoot ul.contains-task-list { padding-left: 0.4em; }
`;

  let html2pdfLoader = null;
  let pdfBusy = false;

  function ensureHtml2Pdf() {
    if (window.html2pdf) return Promise.resolve(window.html2pdf);
    if (html2pdfLoader) return html2pdfLoader;
    html2pdfLoader = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = HTML2PDF_SRC;
      script.integrity = HTML2PDF_SRI;
      script.crossOrigin = "anonymous";
      script.referrerPolicy = "no-referrer";
      script.onload = () => {
        if (window.html2pdf) resolve(window.html2pdf);
        else {
          html2pdfLoader = null;
          reject(new Error("html2pdf"));
        }
      };
      script.onerror = () => {
        html2pdfLoader = null;
        reject(new Error("html2pdf"));
      };
      document.head.appendChild(script);
    });
    return html2pdfLoader;
  }

  function loadHtml2PdfIn(doc) {
    const win = doc.defaultView;
    if (win && win.html2pdf) return Promise.resolve(win.html2pdf);
    return new Promise((resolve, reject) => {
      const script = doc.createElement("script");
      script.src = HTML2PDF_SRC;
      script.integrity = HTML2PDF_SRI;
      script.crossOrigin = "anonymous";
      script.referrerPolicy = "no-referrer";
      script.onload = () => {
        if (win.html2pdf) resolve(win.html2pdf);
        else reject(new Error("html2pdf"));
      };
      script.onerror = () => reject(new Error("html2pdf"));
      doc.head.appendChild(script);
    });
  }

  function openPdfFrame(bodyHtml) {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("title", "PDF");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:fixed;left:0;top:0;width:794px;height:1123px;border:0;background:#ffffff;z-index:0;";
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>${PDF_DOC_CSS}</style>
</head>
<body>
  <article id="pdfRoot">${bodyHtml || ""}</article>
</body>
</html>`;
    document.body.appendChild(iframe);
    iframe.srcdoc = html;
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const tick = () => {
        const doc = iframe.contentDocument;
        if (doc && doc.getElementById("pdfRoot")) {
          resolve(iframe);
          return;
        }
        if (Date.now() - start > 8000) {
          iframe.remove();
          reject(new Error("iframe"));
          return;
        }
        requestAnimationFrame(tick);
      };
      tick();
    });
  }

  async function renderPdfBlob(bodyHtml) {
    await ensureHtml2Pdf();
    const veil = document.createElement("div");
    veil.style.cssText = "position:fixed;inset:0;background:#0d0e13;z-index:2147483646;pointer-events:none;";
    document.body.appendChild(veil);
    const iframe = await openPdfFrame(bodyHtml);
    try {
      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;
      const root = doc.getElementById("pdfRoot");
      if (!doc || !win || !root) throw new Error("iframe");
      iframe.style.height = Math.max(1123, root.scrollHeight + 48) + "px";
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const html2pdf = await loadHtml2PdfIn(doc);
      return await html2pdf()
        .set({
          margin: 15,
          image: { type: "png", quality: 1 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false,
            scrollX: 0,
            scrollY: 0,
            windowWidth: 794,
            windowHeight: Math.max(1123, root.scrollHeight + 48),
            onclone: (clonedDoc) => {
              const force = clonedDoc.createElement("style");
              force.textContent = "#pdfRoot,#pdfRoot *:not(a){color:#000000 !important}#pdfRoot a{color:#0b6bcb !important}html,body,#pdfRoot{background:#ffffff !important}";
              clonedDoc.head.appendChild(force);
            },
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(root)
        .outputPdf("blob");
    } finally {
      iframe.remove();
      veil.remove();
    }
  }

  async function exportPdf() {
    if (pdfBusy) return;
    pdfBusy = true;
    const btn = document.querySelector("#btnExportPdf");
    if (btn) btn.disabled = true;
    showToast(t("pdf.exporting"));
    try {
      const wrap = document.createElement("div");
      wrap.innerHTML = renderMarkdown(editor.value) || "";
      decoratePreview(wrap);
      const blob = await renderPdfBlob(wrap.innerHTML);
      downloadBlob(blob, core.suggestFilename(editor.value) + ".pdf");
    } catch {
      showToast(t("error.pdf"), true);
    } finally {
      pdfBusy = false;
      if (btn) btn.disabled = false;
    }
  }

  function openFile(file) {
    if (!core.isAllowedTextFile(file)) {
      showToast(t("error.file"), true);
      return;
    }
    if (file.size > MAX_DOC_CHARS) {
      showToast(t("error.size"), true);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      if (text.length > MAX_DOC_CHARS) {
        showToast(t("error.size"), true);
        setEditorValue(text.slice(0, MAX_DOC_CHARS));
        return;
      }
      setEditorValue(text);
    };
    reader.onerror = () => showToast(t("error.read"), true);
    reader.readAsText(file);
  }

  function setView(view) {
    workspace.setAttribute("data-view", view);
    document.querySelectorAll(".view-btn").forEach((btn) => {
      const active = btn.getAttribute("data-view") === view;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function setMobile(tab) {
    workspace.setAttribute("data-mobile", tab);
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      const active = btn.getAttribute("data-mobile") === tab;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function syncScroll(from, to) {
    if (syncing) return;
    const fromMax = from.scrollHeight - from.clientHeight;
    const toMax = to.scrollHeight - to.clientHeight;
    if (fromMax <= 0 || toMax <= 0) return;
    syncing = true;
    to.scrollTop = (from.scrollTop / fromMax) * toMax;
    requestAnimationFrame(() => { syncing = false; });
  }

  function copyMarkdown() {
    const text = editor.value;
    const done = () => showToast(t("copied"));
    const fail = () => showToast(t("copy.fail"), true);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(fail);
      return;
    }
    editor.select();
    try {
      document.execCommand("copy");
      done();
    } catch {
      fail();
    }
  }

  function clearEditor() {
    if (!editor.value) return;
    if (!window.confirm(t("clear.confirm"))) return;
    setEditorValue("");
    showToast(t("cleared"));
  }

  function onKeydown(event) {
    const meta = event.metaKey || event.ctrlKey;
    if (meta && event.key.toLowerCase() === "b") {
      event.preventDefault();
      surround("**", "**", t("ph.bold"));
      return;
    }
    if (meta && event.key.toLowerCase() === "i") {
      event.preventDefault();
      surround("*", "*", t("ph.italic"));
      return;
    }
    if (meta && event.key.toLowerCase() === "s") {
      event.preventDefault();
      persist();
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      const next = core.indentBlock(
        editor.value,
        editor.selectionStart,
        editor.selectionEnd,
        event.shiftKey
      );
      applyLocalEdit(next);
    }
  }

  function onPaste(event) {
    const paste = event.clipboardData ? event.clipboardData.getData("text/plain") : "";
    if (!paste) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const nextLen = editor.value.length - (end - start) + paste.length;
    if (nextLen > MAX_DOC_CHARS) {
      event.preventDefault();
      showToast(t("error.size"), true);
    }
  }

  function restoreOrSample() {
    let stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {}
    if (stored != null) {
      setEditorValue(stored, { persistNow: false });
      return;
    }
    setEditorValue(t("sample.doc"));
  }

  const SPLIT_KEY = "markdown-split";
  const DEFAULT_SPLIT = 30;
  const MIN_SPLIT = 18;
  const MAX_SPLIT = 82;

  function bindSplitter() {
    const gutter = document.querySelector("#splitGutter");
    if (!gutter || !workspace) return;

    let splitPct = DEFAULT_SPLIT;
    try {
      const raw = localStorage.getItem(SPLIT_KEY);
      if (raw != null && raw !== "") {
        const stored = Number(raw);
        if (Number.isFinite(stored)) splitPct = stored;
      }
    } catch {}

    const persist = () => {
      try {
        localStorage.setItem(SPLIT_KEY, String(Math.round(splitPct)));
      } catch {}
    };

    const applySplit = (pct) => {
      splitPct = Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, Math.round(pct)));
      workspace.style.setProperty("--editor-pct", splitPct + "%");
      gutter.setAttribute("aria-valuenow", String(Math.round(splitPct)));
    };

    applySplit(splitPct);

    const ratioFromClientX = (clientX) => {
      const rect = workspace.getBoundingClientRect();
      if (rect.width <= 0) return splitPct;
      return ((clientX - rect.left) / rect.width) * 100;
    };

    let dragging = false;

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      workspace.classList.remove("is-resizing");
      persist();
    };

    gutter.addEventListener("pointerdown", (event) => {
      if (event.button != null && event.button !== 0) return;
      event.preventDefault();
      dragging = true;
      try { gutter.setPointerCapture(event.pointerId); } catch {}
      workspace.classList.add("is-resizing");
      applySplit(ratioFromClientX(event.clientX));
    });
    window.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      applySplit(ratioFromClientX(event.clientX));
    });
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    gutter.addEventListener("lostpointercapture", endDrag);
    gutter.addEventListener("dblclick", () => {
      applySplit(DEFAULT_SPLIT);
      persist();
    });
    gutter.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        applySplit(splitPct - 2);
        persist();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        applySplit(splitPct + 2);
        persist();
      } else if (event.key === "Home") {
        event.preventDefault();
        applySplit(DEFAULT_SPLIT);
        persist();
      }
    });
  }

  function bindToolbarKeys() {
    if (!toolbar) return;
    const buttons = () => [...toolbar.querySelectorAll("button")];
    const items = buttons();
    items.forEach((btn, index) => {
      btn.tabIndex = index === 0 ? 0 : -1;
    });
    toolbar.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Home" && event.key !== "End") {
        return;
      }
      const list = buttons();
      const current = list.indexOf(document.activeElement);
      if (current < 0) return;
      event.preventDefault();
      let next = current;
      if (event.key === "ArrowRight") next = (current + 1) % list.length;
      if (event.key === "ArrowLeft") next = (current - 1 + list.length) % list.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = list.length - 1;
      list.forEach((btn) => { btn.tabIndex = -1; });
      list[next].tabIndex = 0;
      list[next].focus();
    });
  }

  function bind() {
    editor.addEventListener("input", onEditorInput);
    editor.addEventListener("change", onEditorInput);
    editor.addEventListener("keydown", onKeydown);
    editor.addEventListener("paste", onPaste);
    editor.addEventListener("scroll", () => syncScroll(editor, previewScroll));
    previewScroll.addEventListener("scroll", () => syncScroll(previewScroll, editor));

    document.querySelector("#btnHeading").addEventListener("click", toggleHeading);
    document.querySelector("#btnBold").addEventListener("click", () => surround("**", "**", t("ph.bold")));
    document.querySelector("#btnItalic").addEventListener("click", () => surround("*", "*", t("ph.italic")));
    document.querySelector("#btnLink").addEventListener("click", insertLink);
    document.querySelector("#btnList").addEventListener("click", () => prefixSelectedLines("- ", t("ph.list")));
    document.querySelector("#btnCode").addEventListener("click", wrapCode);
    document.querySelector("#btnQuote").addEventListener("click", () => prefixSelectedLines("> ", t("ph.quote")));
    document.querySelector("#btnOpen").addEventListener("click", () => fileInput.click());
    document.querySelector("#btnCopy").addEventListener("click", copyMarkdown);
    document.querySelector("#btnClear").addEventListener("click", clearEditor);
    document.querySelector("#btnExportMd").addEventListener("click", exportMarkdown);
    document.querySelector("#btnExportHtml").addEventListener("click", exportHtml);
    document.querySelector("#btnExportPdf").addEventListener("click", exportPdf);

    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      if (file) openFile(file);
      fileInput.value = "";
    });

    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.addEventListener("click", () => setView(btn.getAttribute("data-view")));
    });
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => setMobile(btn.getAttribute("data-mobile")));
    });

    bindToolbarKeys();
    bindSplitter();

    ["dragenter", "dragover"].forEach((type) => {
      editor.addEventListener(type, (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      });
    });
    editor.addEventListener("drop", (event) => {
      event.preventDefault();
      const file = event.dataTransfer.files && event.dataTransfer.files[0];
      if (file) openFile(file);
    });

    document.addEventListener("i18n:change", () => {
      updatePreview();
    });
  }

  if (!setupMarked()) {
    showToast(t("error.lib"), true);
  }
  bind();
  restoreOrSample();
})();
