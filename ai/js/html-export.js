window.HtmlExport = (() => {
  const safeFilename = (title) =>
    (title || 'conversation').replace(/[^a-zA-Z0-9\u00C0-\u1EF9_\-\s]/g, '').trim() || 'conversation';

  const HIDDEN_SELECTORS = [
    '.toolbar',
    '.msg-edge-scroll',
    '.copy-code-btn',
    '.copy-table-btn',
    '.preview-md-btn',
    '.toggle-mermaid-btn',
    '.generated-image-actions',
    '.mermaid-source',
    'script.mermaid-source-raw',
    '.message-grounding-btn',
    'script.message-grounding-json',
    'template.message-grounding-json',
    '.streaming-tool-badge',
  ].join(', ');

  let cssCache = null;
  let katexCssCache = null;

  const HTML_LANG = { en: 'en', vi: 'vi', jp: 'ja', zh: 'zh-CN' };
  const KATEX_CSS_URL = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css';
  const FONT_AWESOME_URL = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';

  const t = (key, fallback) => window.I18n?.t?.(key) || fallback;

  const htmlLang = () => HTML_LANG[window.I18n?.getLocale?.()] || document.documentElement.lang || 'en';

  const bytesToBase64 = (bytes) => {
    let binary = '';
    const chunk = 0x4000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  };

  const fontMime = (url) => {
    if (url.endsWith('.woff2')) return 'font/woff2';
    if (url.endsWith('.woff')) return 'font/woff';
    if (url.endsWith('.ttf')) return 'font/ttf';
    return 'application/octet-stream';
  };

  const inlineStylesheet = async (cssUrl) => {
    const res = await fetch(cssUrl);
    if (!res.ok) throw new Error('css');
    let css = await res.text();
    const base = new URL('.', cssUrl);
    const embedded = new Map();
    const urls = [...css.matchAll(/url\((['"]?)([^)'"]+)\1\)/g)].map((match) => match[2]);
    for (const raw of urls) {
      if (!raw || raw.startsWith('data:') || embedded.has(raw)) continue;
      const abs = new URL(raw, base).href;
      const path = abs.split('?')[0];
      if (!path.endsWith('.woff2')) {
        embedded.set(raw, abs);
        continue;
      }
      try {
        const fontRes = await fetch(abs);
        if (!fontRes.ok) throw new Error('font');
        const bytes = new Uint8Array(await fontRes.arrayBuffer());
        embedded.set(raw, 'data:' + fontMime(path) + ';base64,' + bytesToBase64(bytes));
      } catch {
        embedded.set(raw, abs);
      }
    }
    return css.replace(/url\((['"]?)([^)'"]+)\1\)/g, (full, _q, raw) => {
      const value = embedded.get(raw);
      return value ? 'url(' + value + ')' : full;
    });
  };

  const loadKatexCss = async () => {
    if (katexCssCache != null) return katexCssCache;
    try {
      katexCssCache = await inlineStylesheet(KATEX_CSS_URL);
    } catch {
      katexCssCache = '';
    }
    return katexCssCache;
  };

  const loadExportCss = async () => {
    if (cssCache) return cssCache;
    try {
      const url = new URL('css/html-export.css', window.location.href);
      const res = await fetch(url);
      if (res.ok) {
        cssCache = await res.text();
        return cssCache;
      }
    } catch {}
    cssCache = 'body{margin:0;padding:24px;font-family:Inter,system-ui,sans-serif;color:#111118;background:#fff}';
    return cssCache;
  };

  const sanitizeExportRoot = (root) => {
    root.querySelectorAll('script').forEach((node) => node.remove());
    root.querySelectorAll('button').forEach((node) => node.remove());
    root.querySelectorAll(HIDDEN_SELECTORS).forEach((node) => node.remove());
    root.querySelectorAll('.line-numbers').forEach((node) => node.remove());
    root.querySelectorAll('details').forEach((el) => el.setAttribute('open', ''));
    root.style.cssText = '';
    root.classList.remove('is-capturing');
  };

  const buildHtmlDocument = (title, css, katexCss, bodyHtml) => {
    const escapedTitle = window.Utils.escapeHTML(title || t('conversation', 'Cuộc trò chuyện'));
    const katexBlock = katexCss
      ? '<style>' + katexCss + '</style>'
      : '<link rel="stylesheet" href="' + KATEX_CSS_URL + '" crossorigin="anonymous">';
    return `<!DOCTYPE html>
<html lang="${htmlLang()}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedTitle}</title>
  <link rel="stylesheet" href="${FONT_AWESOME_URL}">
  ${katexBlock}
  <style>${css}</style>
</head>
<body>
  <div class="html-export-page">${bodyHtml}</div>
</body>
</html>`;
  };

  const exportToHtml = async (convo, { onProgress } = {}) => {
    const report = (title, hint) => onProgress?.({ title, hint });
    report(t('exportHtmlTitle', 'Đang xuất HTML...'), t('exportHtmlHint', 'Đang nhúng bố cục, công thức và sơ đồ'));

    const root = await window.UI.preparePdfExportRoot(convo);
    try {
      sanitizeExportRoot(root);
      const css = await loadExportCss();
      const katexCss = await loadKatexCss();
      const html = buildHtmlDocument(convo.title, css, katexCss, root.innerHTML);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      return { blob, filename: safeFilename(convo.title) + '.html' };
    } finally {
      root.remove();
      window.Markdown?.updateMermaidTheme?.();
    }
  };

  return { exportToHtml };
})();
