window.HtmlExport = (() => {
  const safeFilename = (title) =>
    (title || 'conversation').replace(/[^a-zA-Z0-9\u00C0-\u1EF9_\-\s]/g, '').trim() || 'conversation';

  const HIDDEN_SELECTORS = [
    '.toolbar',
    '.copy-code-btn',
    '.copy-table-btn',
    '.preview-md-btn',
    '.toggle-mermaid-btn',
    '.generated-image-actions',
    '.mermaid-source',
    'script.mermaid-source-raw',
  ].join(', ');

  let cssCache = null;

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
    root.querySelectorAll(HIDDEN_SELECTORS).forEach((node) => node.remove());
    root.querySelectorAll('.line-numbers').forEach((node) => node.remove());
    root.style.cssText = '';
    root.classList.remove('is-capturing');
  };

  const buildHtmlDocument = (title, css, bodyHtml) => {
    const escapedTitle = window.Utils.escapeHTML(title || 'Cuộc trò chuyện');
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" crossorigin="anonymous">
  <style>${css}</style>
</head>
<body>
  <div class="html-export-page">${bodyHtml}</div>
</body>
</html>`;
  };

  const exportToHtml = async (convo, { onProgress } = {}) => {
    const report = (title, hint) => onProgress?.({ title, hint });
    report('Đang chuẩn bị HTML...', 'Đang render nội dung và công thức toán');

    const root = await window.UI.preparePdfExportRoot(convo);
    try {
      sanitizeExportRoot(root);
      report('Đang tạo file HTML...', 'Đang nhúng CSS và nội dung');
      const css = await loadExportCss();
      const html = buildHtmlDocument(convo.title, css, root.innerHTML);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      return { blob, filename: safeFilename(convo.title) + '.html' };
    } finally {
      root.remove();
    }
  };

  return { exportToHtml };
})();
