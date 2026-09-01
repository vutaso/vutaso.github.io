window.DevToolsI18n = (() => {
  const KEY = "devtools-lang";
  const messages = {
    vi: {
      "meta.title": "DevTools — JSON, Base64, Hash | VUTASO",
      "meta.description": "Format JSON, encode/decode Base64, MD5 và SHA-256 ngay trên trình duyệt. Nội dung không rời khỏi thiết bị.",
      "brand.home": "VUTASO",
      "brand.app": "DevTools trang chủ",
      "header.note": "Chạy hoàn toàn trên trình duyệt",
      "lang.label": "Ngôn ngữ",
      "tab.json": "JSON",
      "tab.base64": "Base64",
      "tab.hash": "Hash",
      "pane.input": "ĐẦU VÀO",
      "pane.output": "KẾT QUẢ",
      "json.format": "Format",
      "json.minify": "Minify",
      "json.parsed": "Parsed",
      "json.raw": "Raw",
      "json.view.label": "Chế độ xem",
      "json.copy": "Sao chép JSON",
      "json.clear": "Xóa",
      "json.label": "JSON hoặc URL",
      "json.out.label": "JSON đã xử lý",
      "json.ph": "{ \"hello\": \"VUTASO\" }",
      "json.fetching": "Đang tải JSON…",
      "json.unsafe": "Một số số nguyên lớn hơn 2^53 − 1 nên đã bị làm tròn.",
      "json.expand": "Mở rộng",
      "json.collapse": "Thu gọn",
      "json.tree.hint": "Bấm tam giác để thu gọn. Giữ Ctrl hoặc ⌘ để thu/mở các mục cùng cấp.",
      "b64.encode": "Encode",
      "b64.decode": "Decode",
      "b64.swap": "Đảo chiều",
      "b64.copy": "Sao chép",
      "b64.clear": "Xóa",
      "b64.label": "Văn bản hoặc Base64",
      "b64.out.label": "Kết quả Base64",
      "b64.ph": "Xin chào VUTASO",
      "hash.label": "Văn bản cần hash",
      "hash.md5": "MD5",
      "hash.sha256": "SHA-256",
      "hash.copy.md5": "Sao chép MD5",
      "hash.copy.sha256": "Sao chép SHA-256",
      "hash.clear": "Xóa",
      "hash.ph": "Nhập văn bản…",
      "tabs.label": "Công cụ",
      "copied": "Đã sao chép.",
      "cleared": "Đã xóa nội dung.",
      "copy.fail": "Không sao chép được. Hãy chọn và copy thủ công.",
      "copy.empty": "Chưa có nội dung để sao chép.",
      "error.size": "Nội dung vượt 2 MB. Hãy rút ngắn rồi thử lại.",
      "error.json": "JSON không hợp lệ.",
      "error.json.empty": "Nhập JSON hoặc URL trước khi format.",
      "error.json.pos": "JSON không hợp lệ (dòng {line}, cột {col}).",
      "error.json.depth": "JSON lồng quá sâu để xử lý.",
      "error.json.fetch": "Không tải được JSON từ URL. Kiểm tra CORS hoặc thử dán nội dung.",
      "error.b64": "Base64 không hợp lệ.",
      "error.b64.binary": "Không phải văn bản UTF-8. Kết quả đang hiện dạng hex.",
      "stats.meta": "{chars} ký tự",
      "footer.left": "DEVTOOLS / JSON · BASE64 · HASH",
      "footer.right": "© 2026 VUTASO.com · LOCAL · PRIVATE · OPEN",
      "footer.privacy": "Bảo mật",
      "footer.terms": "Điều khoản",
    },
    en: {
      "meta.title": "DevTools — JSON, Base64, Hash | VUTASO",
      "meta.description": "Format JSON, encode/decode Base64, and hash with MD5 or SHA-256 in your browser. Your content never leaves this device.",
      "brand.home": "VUTASO",
      "brand.app": "DevTools home",
      "header.note": "Runs entirely in your browser",
      "lang.label": "Language",
      "tab.json": "JSON",
      "tab.base64": "Base64",
      "tab.hash": "Hash",
      "pane.input": "INPUT",
      "pane.output": "OUTPUT",
      "json.format": "Format",
      "json.minify": "Minify",
      "json.parsed": "Parsed",
      "json.raw": "Raw",
      "json.view.label": "View mode",
      "json.copy": "Copy JSON",
      "json.clear": "Clear",
      "json.label": "JSON or URL",
      "json.out.label": "Processed JSON",
      "json.ph": "{ \"hello\": \"VUTASO\" }",
      "json.fetching": "Fetching JSON…",
      "json.unsafe": "Some integers exceed 2^53 − 1 and were rounded.",
      "json.expand": "Expand",
      "json.collapse": "Collapse",
      "json.tree.hint": "Click the triangle to collapse. Hold Ctrl or ⌘ to toggle siblings too.",
      "b64.encode": "Encode",
      "b64.decode": "Decode",
      "b64.swap": "Swap",
      "b64.copy": "Copy",
      "b64.clear": "Clear",
      "b64.label": "Text or Base64",
      "b64.out.label": "Base64 result",
      "b64.ph": "Hello VUTASO",
      "hash.label": "Text to hash",
      "hash.md5": "MD5",
      "hash.sha256": "SHA-256",
      "hash.copy.md5": "Copy MD5",
      "hash.copy.sha256": "Copy SHA-256",
      "hash.clear": "Clear",
      "hash.ph": "Type some text…",
      "tabs.label": "Tools",
      "copied": "Copied.",
      "cleared": "Content cleared.",
      "copy.fail": "Could not copy. Select the text and copy it manually.",
      "copy.empty": "Nothing to copy yet.",
      "error.size": "Content exceeds 2 MB. Shorten it and try again.",
      "error.json": "Invalid JSON.",
      "error.json.empty": "Enter JSON or a URL before formatting.",
      "error.json.pos": "Invalid JSON (line {line}, column {col}).",
      "error.json.depth": "JSON is nested too deeply to process.",
      "error.json.fetch": "Could not fetch JSON from that URL. Check CORS or paste the body instead.",
      "error.b64": "Invalid Base64.",
      "error.b64.binary": "Decoded bytes are not UTF-8. Showing hex instead.",
      "stats.meta": "{chars} characters",
      "footer.left": "DEVTOOLS / JSON · BASE64 · HASH",
      "footer.right": "© 2026 VUTASO.com · LOCAL · PRIVATE · OPEN",
      "footer.privacy": "Privacy",
      "footer.terms": "Terms",
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
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const label = t(el.getAttribute("data-i18n-aria"));
      if (label != null) el.setAttribute("aria-label", label);
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const title = t(el.getAttribute("data-i18n-title"));
      if (title != null) el.setAttribute("title", title);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const ph = t(el.getAttribute("data-i18n-placeholder"));
      if (ph != null) el.setAttribute("placeholder", ph);
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

window.DevToolsI18n.init();
