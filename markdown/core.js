(function (root) {
  const MAX_DOC_CHARS = 2 * 1024 * 1024;
  const MAX_HIGHLIGHT_CHARS = 20000;
  const INDENT = "  ";

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function suggestFilename(source) {
    const match = String(source || "").match(/^#\s+(.+)$/m);
    const raw = (match ? match[1] : "document").trim();
    const safe = raw
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
    return safe || "document";
  }

  function isAllowedTextFile(file) {
    if (!file) return false;
    const name = String(file.name || "");
    if (/\.(md|markdown|txt)$/i.test(name)) return true;
    const type = String(file.type || "");
    return /^text\/(plain|markdown|x-markdown)(;.*)?$/i.test(type);
  }

  function wrapSelection(value, start, end, prefix, suffix, placeholder) {
    const selected = value.slice(start, end);
    const text = selected || placeholder;
    const next = value.slice(0, start) + prefix + text + suffix + value.slice(end);
    return {
      value: next,
      selectionStart: start + prefix.length,
      selectionEnd: start + prefix.length + text.length,
    };
  }

  function prefixLines(value, start, end, prefix, placeholder) {
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const chunk = value.slice(lineStart, end) || placeholder;
    const nextChunk = chunk
      .split("\n")
      .map((line) => (line.startsWith(prefix) ? line : prefix + (line || placeholder)))
      .join("\n");
    const next = value.slice(0, lineStart) + nextChunk + value.slice(end);
    return {
      value: next,
      selectionStart: lineStart,
      selectionEnd: lineStart + nextChunk.length,
    };
  }

  function toggleHeadingLine(line, fallback) {
    const match = String(line || "").match(/^(#{1,6})\s+(.*)$/);
    if (!match) return "# " + (line || fallback);
    if (match[1].length >= 6) return match[2];
    return match[1] + "# " + match[2];
  }

  function indentBlock(value, start, end, unindent) {
    if (start === end) {
      if (unindent) {
        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const before = value.slice(lineStart, start);
        const cut = before.endsWith(INDENT) ? INDENT.length : before.endsWith("\t") ? 1 : 0;
        if (!cut) return { value, selectionStart: start, selectionEnd: end };
        const next = value.slice(0, start - cut) + value.slice(start);
        return { value: next, selectionStart: start - cut, selectionEnd: start - cut };
      }
      const next = value.slice(0, start) + INDENT + value.slice(end);
      return { value: next, selectionStart: start + INDENT.length, selectionEnd: start + INDENT.length };
    }

    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    let rangeEnd = end;
    if (value[end - 1] === "\n") rangeEnd = end - 1;
    const nl = value.indexOf("\n", rangeEnd);
    const lineEnd = nl === -1 ? value.length : nl;
    const chunk = value.slice(lineStart, lineEnd);
    const lines = chunk.split("\n");
    const nextLines = lines.map((line) => {
      if (unindent) {
        if (line.startsWith(INDENT)) return line.slice(INDENT.length);
        if (line.startsWith("\t")) return line.slice(1);
        return line;
      }
      return INDENT + line;
    });
    const nextChunk = nextLines.join("\n");
    const next = value.slice(0, lineStart) + nextChunk + value.slice(lineEnd);
    const startDelta = unindent
      ? (lines[0].startsWith(INDENT) ? -INDENT.length : lines[0].startsWith("\t") ? -1 : 0)
      : INDENT.length;
    const delta = nextChunk.length - chunk.length;
    return {
      value: next,
      selectionStart: Math.max(lineStart, start + startDelta),
      selectionEnd: end + delta,
    };
  }

  function isRemoteImageSrc(src) {
    const value = String(src || "").trim();
    if (!value) return false;
    if (/^data:image\//i.test(value)) return false;
    return /^(https?:|\/\/)/i.test(value);
  }

  function scrubPreviewRoot(root, blockedAlt) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") || "";
      img.removeAttribute("srcset");
      if (isRemoteImageSrc(src) || (!/^data:image\//i.test(src) && src)) {
        img.removeAttribute("src");
        img.classList.add("img-blocked");
        if (!img.getAttribute("alt")) img.setAttribute("alt", blockedAlt || "");
      }
    });
    root.querySelectorAll("input").forEach((input) => {
      if ((input.getAttribute("type") || "").toLowerCase() !== "checkbox") {
        input.remove();
        return;
      }
      input.setAttribute("type", "checkbox");
      input.setAttribute("disabled", "");
    });
  }

  function tokenizeCode(token, langArg) {
    const code = token && typeof token === "object" && "text" in token
      ? String(token.text || "")
      : String(token || "");
    const lang = token && typeof token === "object" && "lang" in token
      ? String(token.lang || "")
      : String(langArg || "");
    return { code, lang: lang.trim() };
  }

  const MarkdownCore = {
    MAX_DOC_CHARS,
    MAX_HIGHLIGHT_CHARS,
    escapeHtml,
    suggestFilename,
    isAllowedTextFile,
    wrapSelection,
    prefixLines,
    toggleHeadingLine,
    indentBlock,
    isRemoteImageSrc,
    scrubPreviewRoot,
    tokenizeCode,
  };

  root.MarkdownCore = MarkdownCore;
})(typeof window !== "undefined" ? window : globalThis);
