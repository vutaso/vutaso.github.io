window.DevToolsI18n = (() => {
  const KEY = "devtools-lang";
  const messages = {
    vi: {
      "meta.title": "DevTools — JSON, Base64, Hash | VUTASO",
      "meta.description": "Format JSON, encode/decode Base64, MD5 và SHA-256 trên trình duyệt. JSON được xử lý local; fetch URL chỉ khi bạn chủ động dán hoặc mở ?url=.",
      "brand.home": "VUTASO",
      "brand.app": "DevTools trang chủ",
      "header.note": "JSON xử lý trên máy bạn · Fetch URL là tùy chọn",
      "lang.label": "Ngôn ngữ",
      "tab.json": "JSON",
      "tab.base64": "Base64",
      "tab.hash": "Hash",
      "pane.input": "ĐẦU VÀO",
      "pane.output": "KẾT QUẢ",
      "json.format": "Format",
      "json.minify": "Minify",
      "json.validate": "Validate",
      "json.parsed": "Parsed",
      "json.raw": "Raw",
      "json.view.label": "Chế độ xem",
      "json.copy": "Sao chép JSON",
      "json.upload": "Tải file lên",
      "json.download": "Tải xuống",
      "json.clear": "Xóa",
      "json.label": "JSON hoặc URL",
      "json.out.label": "JSON đã xử lý",
      "json.ph": "{ \"hello\": \"VUTASO\" }",
      "json.fetching": "Đang tải JSON…",
      "json.unwrapped": "Đã tách JSON từ wrapper (JSONP, XSSI hoặc HTML).",
      "json.expand": "Mở rộng",
      "json.collapse": "Thu gọn",
      "json.tree.hint": "Bấm tam giác để thu gọn. Giữ Ctrl hoặc ⌘ để thu/mở các mục cùng cấp.",
      "json.valid": "JSON hợp lệ.",
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
      "downloaded": "Đã tải file JSON.",
      "copy.fail": "Không sao chép được. Hãy chọn và copy thủ công.",
      "copy.empty": "Chưa có nội dung để sao chép.",
      "download.fail": "Không tải file xuống được.",
      "download.empty": "Chưa có JSON để tải xuống.",
      "error.size": "Nội dung vượt 2 MB. Hãy rút ngắn rồi thử lại.",
      "error.json": "JSON không hợp lệ.",
      "error.json.empty": "Nhập JSON hoặc URL trước.",
      "error.json.pos": "JSON không hợp lệ (dòng {line}, cột {col}).",
      "error.json.pos.reason": "Dòng {line}, cột {col}: {detail}",
      "error.json.reason.trailing_comma": "Dấu phẩy thừa — JSON không cho phép trailing comma.",
      "error.json.reason.expected_key": "Cần tên thuộc tính trong dấu ngoặc kép.",
      "error.json.reason.expected_colon": "Thiếu dấu hai chấm sau tên thuộc tính.",
      "error.json.reason.comma_or_end": "Cần dấu phẩy hoặc dấu đóng } / ].",
      "error.json.reason.unterminated_string": "Chuỗi chưa đóng ngoặc kép.",
      "error.json.reason.bad_escape": "Ký tự escape không hợp lệ.",
      "error.json.reason.control": "Ký tự điều khiển trong chuỗi phải được escape.",
      "error.json.reason.number": "Số không đúng chuẩn JSON.",
      "error.json.reason.trailing": "Còn dữ liệu thừa sau giá trị JSON.",
      "error.json.reason.not_json": "Nội dung không phải JSON.",
      "error.json.reason.unexpected": "Ký tự hoặc cấu trúc không hợp lệ.",
      "error.json.depth": "JSON lồng quá sâu để xử lý.",
      "error.json.fetch": "Không tải được JSON từ URL. Kiểm tra CORS hoặc thử dán nội dung.",
      "error.json.worker": "Không xử lý được JSON. Hãy thử lại hoặc rút ngắn nội dung.",
      "error.json.encoding": "File không phải UTF-8 hợp lệ.",
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
      "meta.description": "Format JSON, encode/decode Base64, and hash with MD5 or SHA-256 in your browser. JSON is processed locally; URL fetch only happens if you paste a URL or open ?url=.",
      "brand.home": "VUTASO",
      "brand.app": "DevTools home",
      "header.note": "JSON stays on your device · URL fetch is optional",
      "lang.label": "Language",
      "tab.json": "JSON",
      "tab.base64": "Base64",
      "tab.hash": "Hash",
      "pane.input": "INPUT",
      "pane.output": "OUTPUT",
      "json.format": "Format",
      "json.minify": "Minify",
      "json.validate": "Validate",
      "json.parsed": "Parsed",
      "json.raw": "Raw",
      "json.view.label": "View mode",
      "json.copy": "Copy JSON",
      "json.upload": "Upload file",
      "json.download": "Download",
      "json.clear": "Clear",
      "json.label": "JSON or URL",
      "json.out.label": "Processed JSON",
      "json.ph": "{ \"hello\": \"VUTASO\" }",
      "json.fetching": "Fetching JSON…",
      "json.unwrapped": "Extracted JSON from a wrapper (JSONP, XSSI, or HTML).",
      "json.expand": "Expand",
      "json.collapse": "Collapse",
      "json.tree.hint": "Click the triangle to collapse. Hold Ctrl or ⌘ to toggle siblings too.",
      "json.valid": "JSON is valid.",
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
      "downloaded": "JSON file downloaded.",
      "copy.fail": "Could not copy. Select the text and copy it manually.",
      "copy.empty": "Nothing to copy yet.",
      "download.fail": "Could not download the file.",
      "download.empty": "Nothing to download yet.",
      "error.size": "Content exceeds 2 MB. Shorten it and try again.",
      "error.json": "Invalid JSON.",
      "error.json.empty": "Enter JSON or a URL first.",
      "error.json.pos": "Invalid JSON (line {line}, column {col}).",
      "error.json.pos.reason": "Line {line}, column {col}: {detail}",
      "error.json.reason.trailing_comma": "Trailing comma — JSON does not allow it.",
      "error.json.reason.expected_key": "Expected a double-quoted property name.",
      "error.json.reason.expected_colon": "Expected a colon after the property name.",
      "error.json.reason.comma_or_end": "Expected a comma or a closing } / ].",
      "error.json.reason.unterminated_string": "Unterminated string.",
      "error.json.reason.bad_escape": "Invalid escape sequence.",
      "error.json.reason.control": "Control characters in strings must be escaped.",
      "error.json.reason.number": "Invalid JSON number.",
      "error.json.reason.trailing": "Unexpected data after the JSON value.",
      "error.json.reason.not_json": "This is not JSON.",
      "error.json.reason.unexpected": "Unexpected character or structure.",
      "error.json.depth": "JSON is nested too deeply to process.",
      "error.json.fetch": "Could not fetch JSON from that URL. Check CORS or paste the body instead.",
      "error.json.worker": "Could not process JSON. Try again or shorten the input.",
      "error.json.encoding": "The file is not valid UTF-8.",
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
