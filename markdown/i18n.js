window.MarkdownI18n = (() => {
  const KEY = "markdown-lang";
  const messages = {
    vi: {
      "meta.title": "MarkDown — Soạn thảo Markdown + Preview | VUTASO",
      "meta.description": "Viết Markdown và xem trước ngay trên trình duyệt. Xuất HTML hoặc PDF. Nội dung không rời khỏi thiết bị.",
      "brand.home": "VUTASO",
      "brand.app": "MarkDown trang chủ",
      "header.note": "Chạy hoàn toàn trên trình duyệt",
      "lang.label": "Ngôn ngữ",
      "workspace.label": "Soạn thảo Markdown",
      "pane.write": "VIẾT",
      "pane.preview": "XEM TRƯỚC",
      "mobile.write": "Viết",
      "mobile.preview": "Xem trước",
      "split.label": "Kéo để chỉnh tỉ lệ khung Viết / Xem trước",
      "view.split": "Chia đôi",
      "view.editor": "Soạn",
      "view.preview": "Preview",
      "tool.heading": "Tiêu đề",
      "tool.bold": "In đậm",
      "tool.italic": "In nghiêng",
      "tool.link": "Liên kết",
      "tool.list": "Danh sách",
      "tool.code": "Mã",
      "tool.quote": "Trích dẫn",
      "tool.open": "Mở file .md",
      "tool.copy": "Sao chép Markdown",
      "tool.clear": "Xóa nội dung",
      "export.md": "Tải .md",
      "export.html": "Xuất HTML",
      "export.pdf": "Xuất PDF",
      "preview.empty": "Preview sẽ hiện ở đây khi bạn bắt đầu viết.",
      "stats.meta": "{words} từ · {chars} ký tự",
      "copied": "Đã sao chép Markdown.",
      "cleared": "Đã xóa nội dung.",
      "copy.fail": "Không sao chép được. Hãy chọn và copy thủ công.",
      "clear.confirm": "Xóa toàn bộ nội dung đang soạn?",
      "editor.label": "Nội dung Markdown",
      "file.choose": "Chọn file Markdown",
      "img.blocked": "Ảnh từ URL ngoài không được tải",
      "error.lib": "Không tải được bộ render Markdown. Kiểm tra kết nối rồi tải lại trang.",
      "error.file": "Vui lòng chọn file .md, .markdown hoặc .txt.",
      "error.size": "Nội dung vượt 2 MB. Hãy rút ngắn rồi thử lại.",
      "error.save": "Không lưu được bản nháp (bộ nhớ trình duyệt đầy hoặc bị chặn).",
      "error.read": "Không đọc được file này.",
      "error.pdf": "Không xuất được PDF. Hãy thử lại.",
      "pdf.exporting": "Đang xuất PDF A4…",
      "link.text": "văn bản liên kết",
      "link.url": "https://",
      "ph.bold": "in đậm",
      "ph.italic": "in nghiêng",
      "ph.code": "code",
      "ph.quote": "trích dẫn",
      "ph.list": "mục",
      "ph.heading": "Tiêu đề",
      "footer.left": "MARKDOWN / WRITE · PREVIEW · EXPORT",
      "footer.right": "© 2026 VUTASO.com · LOCAL · PRIVATE · OPEN",
      "footer.privacy": "Bảo mật",
      "footer.terms": "Điều khoản",
      "sample.doc": "# MarkDown — viết và xem trước\n\nSoạn **Markdown** bên trái, xem *ngay* bên phải. Mọi thứ chạy trên trình duyệt — nội dung không rời khỏi thiết bị.\n\n## Bắt đầu nhanh\n\n- **In đậm**, *nghiêng*, ~~gạch ngang~~\n- `code` nội dòng và [liên kết](https://vutaso.com)\n- Danh sách việc:\n  - [x] Viết ghi chú\n  - [ ] Xuất HTML\n  - [ ] Xuất PDF\n\n> Mẹo: dùng thanh công cụ, hoặc ⌘B / Ctrl+B để in đậm.\n\n### Bảng xuất file\n\n| Định dạng | File |\n| --- | --- |\n| Markdown | `.md` |\n| HTML | `.html` |\n| PDF | `.pdf` |\n\n```js\nconsole.log(\"Xin chào VUTASO\");\n```\n",
    },
    en: {
      "meta.title": "MarkDown — Markdown Editor + Preview | VUTASO",
      "meta.description": "Write Markdown and preview it in your browser. Export HTML or PDF. Your content never leaves this device.",
      "brand.home": "VUTASO",
      "brand.app": "MarkDown home",
      "header.note": "Runs entirely in your browser",
      "lang.label": "Language",
      "workspace.label": "Markdown editor",
      "pane.write": "WRITE",
      "pane.preview": "PREVIEW",
      "mobile.write": "Write",
      "mobile.preview": "Preview",
      "split.label": "Drag to resize the Write and Preview panes",
      "view.split": "Split",
      "view.editor": "Edit",
      "view.preview": "Preview",
      "tool.heading": "Heading",
      "tool.bold": "Bold",
      "tool.italic": "Italic",
      "tool.link": "Link",
      "tool.list": "List",
      "tool.code": "Code",
      "tool.quote": "Quote",
      "tool.open": "Open .md file",
      "tool.copy": "Copy Markdown",
      "tool.clear": "Clear content",
      "export.md": "Download .md",
      "export.html": "Export HTML",
      "export.pdf": "Export PDF",
      "preview.empty": "Preview will appear here when you start writing.",
      "stats.meta": "{words} words · {chars} characters",
      "copied": "Markdown copied.",
      "cleared": "Content cleared.",
      "copy.fail": "Could not copy. Select the text and copy it manually.",
      "clear.confirm": "Clear everything in the editor?",
      "editor.label": "Markdown source",
      "file.choose": "Choose a Markdown file",
      "img.blocked": "Remote image was not loaded",
      "error.lib": "The Markdown renderer failed to load. Check your connection and reload.",
      "error.file": "Please choose a .md, .markdown, or .txt file.",
      "error.size": "Content exceeds 2 MB. Shorten it and try again.",
      "error.save": "Could not save the draft (browser storage is full or blocked).",
      "error.read": "Could not read this file.",
      "error.pdf": "Could not export PDF. Please try again.",
      "pdf.exporting": "Exporting A4 PDF…",
      "link.text": "link text",
      "link.url": "https://",
      "ph.bold": "bold",
      "ph.italic": "italic",
      "ph.code": "code",
      "ph.quote": "quote",
      "ph.list": "item",
      "ph.heading": "Heading",
      "footer.left": "MARKDOWN / WRITE · PREVIEW · EXPORT",
      "footer.right": "© 2026 VUTASO.com · LOCAL · PRIVATE · OPEN",
      "footer.privacy": "Privacy",
      "footer.terms": "Terms",
      "sample.doc": "# MarkDown — write and preview\n\nWrite **Markdown** on the left and see it *live* on the right. Everything runs in your browser — your content never leaves this device.\n\n## Quick start\n\n- **Bold**, *italic*, ~~strikethrough~~\n- Inline `code` and a [link](https://vutaso.com)\n- Checklist:\n  - [x] Draft notes\n  - [ ] Export HTML\n  - [ ] Export PDF\n\n> Tip: use the toolbar, or ⌘B / Ctrl+B for bold.\n\n### Export formats\n\n| Format | File |\n| --- | --- |\n| Markdown | `.md` |\n| HTML | `.html` |\n| PDF | `.pdf` |\n\n```js\nconsole.log(\"Hello from VUTASO\");\n```\n",
    },
  };

  let lang = "vi";

  function interpolate(text, vars) {
    if (!vars) return text;
    return text.replace(/\{(\w+)\}/g, (_, name) => (vars[name] != null ? String(vars[name]) : ""));
  }

  function t(key, vars) {
    const table = messages[lang] || messages.vi;
    const text = table[key] != null ? table[key] : (messages.vi[key] || key);
    return interpolate(text, vars);
  }

  function apply() {
    document.documentElement.lang = lang;
    document.title = t("meta.title");
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", t("meta.description"));
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", t("meta.title"));
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", t("meta.description"));
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute("content", t("meta.title"));
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute("content", t("meta.description"));
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const text = t(el.getAttribute("data-i18n"));
      if (text != null) el.textContent = text;
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const html = t(el.getAttribute("data-i18n-html"));
      if (html != null) el.innerHTML = html;
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const label = t(el.getAttribute("data-i18n-aria"));
      if (label != null) el.setAttribute("aria-label", label);
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const title = t(el.getAttribute("data-i18n-title"));
      if (title != null) el.setAttribute("title", title);
    });
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      const active = btn.getAttribute("data-lang") === lang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
    document.dispatchEvent(new CustomEvent("i18n:change", { detail: { lang } }));
  }

  function setLang(next) {
    if (!messages[next]) return;
    lang = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {}
    apply();
  }

  function init() {
    let stored = null;
    try {
      stored = localStorage.getItem(KEY);
    } catch {}
    lang = stored && messages[stored] ? stored : "vi";
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => setLang(btn.getAttribute("data-lang")));
    });
    apply();
  }

  return { t, setLang, getLang: () => lang, init, apply };
})();

window.MarkdownI18n.init();
