window.PdfExport = (() => {
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
    'button',
  ].join(', ');

  let cssCache = null;

  const waitForLayout = () =>
    new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const loadPrintCss = async () => {
    if (cssCache) return cssCache;
    const parts = [];
    for (const path of ['css/html-export.css', 'css/pdf-export.css']) {
      try {
        const res = await fetch(new URL(path, window.location.href));
        if (res.ok) parts.push(await res.text());
      } catch {}
    }
    parts.push(`
.pdf-export-root {
  position: static !important;
  left: auto !important;
  top: auto !important;
  width: 100% !important;
  z-index: auto !important;
  opacity: 1 !important;
  clip: auto !important;
  clip-path: none !important;
  overflow: visible !important;
  pointer-events: auto !important;
}
@media print {
  @page { size: A4; margin: 12mm; }
  body { padding: 0 !important; background: #fff !important; }
  .html-export-page { max-width: none !important; }
  .code-block, pre, .table-block, .mermaid-block, .math-block {
    break-inside: avoid-page;
    page-break-inside: avoid;
  }
  h1, h2, h3, h4 { break-after: avoid-page; page-break-after: avoid; }
}
`);
    cssCache = parts.join('\n') || 'body{font-family:system-ui,sans-serif;color:#111;background:#fff;padding:16px}';
    return cssCache;
  };

  const sanitizeRoot = (root) => {
    root.querySelectorAll('script').forEach((node) => node.remove());
    root.querySelectorAll(HIDDEN_SELECTORS).forEach((node) => node.remove());
    root.querySelectorAll('details').forEach((el) => el.setAttribute('open', ''));
    root.querySelectorAll('.code-block, pre, .table-scroll, .mermaid-view, .content').forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      el.style.maxHeight = 'none';
      el.style.height = 'auto';
      el.style.overflow = 'visible';
    });
    root.style.cssText = '';
    root.classList.remove('is-capturing');
  };

  const buildPrintHtml = (_title, css, bodyHtml) => {
    // Empty <title> so browser print headers don't show a URL/title line.
    // Document name stays in the page body (pdf-export-title).
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>&nbsp;</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" crossorigin="anonymous">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-light.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>${css}</style>
</head>
<body>
  <div class="html-export-page">${bodyHtml}</div>
</body>
</html>`;
  };

  const waitForPrintAssets = async (win) => {
    const doc = win.document;
    try {
      if (doc.fonts?.ready) await doc.fonts.ready;
    } catch {}
    const images = [...doc.images];
    await Promise.all(images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
        setTimeout(resolve, 3000);
      });
    }));
    await waitForLayout();
    await new Promise((resolve) => setTimeout(resolve, 100));
  };

  const printHtmlDocument = async (html, { onProgress } = {}) => {
    const report = (title, hint) => {
      if (typeof onProgress === 'function') onProgress({ title, hint });
    };
    report(
      window.I18n?.t?.('exportPdfTitle') || 'Đang mở hộp thoại in...',
      window.I18n?.t?.('exportPdfHint') || 'Tắt Headers and footers, rồi chọn Save as PDF'
    );

    // Blob URL avoids printing the app's file:///... path in browser headers/footers
    // (about:blank iframes often fall back to the parent page URL).
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);

    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Print PDF');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none';
    document.body.appendChild(iframe);

    const cleanup = () => {
      try { iframe.remove(); } catch {}
      try { URL.revokeObjectURL(blobUrl); } catch {}
    };

    try {
      await new Promise((resolve, reject) => {
        iframe.onload = () => resolve();
        iframe.onerror = () => reject(new Error('Không tải được bản in'));
        iframe.src = blobUrl;
        setTimeout(resolve, 5000);
      });

      const win = iframe.contentWindow;
      if (!win) throw new Error('Không mở được cửa sổ in');

      await waitForPrintAssets(win);
      try {
        // Keep title blank so header title/URL lines stay empty when footers are on
        if (win.document) win.document.title = ' ';
      } catch {}

      win.addEventListener('afterprint', cleanup, { once: true });
      setTimeout(cleanup, 120000);
      win.focus();
      win.print();
      return { printed: true };
    } catch (err) {
      cleanup();
      throw err;
    }
  };

  const exportRootToPdf = async (root, { filename, onProgress } = {}) => {
    if (!root) throw new Error('Không có nội dung để in PDF');
    sanitizeRoot(root);
    await waitForLayout();
    const css = await loadPrintCss();
    const title = (filename || 'document').replace(/\.pdf$/i, '');
    const html = buildPrintHtml(title, css, root.outerHTML);
    return printHtmlDocument(html, { onProgress });
  };

  const exportToPdf = async (convo, { onProgress } = {}) => {
    if (!convo?.messages?.length) throw new Error('Không có tin nhắn để xuất');
    const report = (title, hint) => {
      if (typeof onProgress === 'function') onProgress({ title, hint });
    };
    report(
      window.I18n?.t?.('exportPdfTitle') || 'Đang chuẩn bị in PDF...',
      window.I18n?.t?.('exportPdfHint') || 'Đang render nội dung'
    );

    const root = await window.UI.preparePdfExportRoot(convo);
    const filename = (convo.title || 'conversation').replace(/[^a-zA-Z0-9\u00C0-\u1EF9_\-\s]/g, '').trim() || 'conversation';

    try {
      return await exportRootToPdf(root, { filename, onProgress });
    } finally {
      root.remove();
      window.Markdown?.updateMermaidTheme?.();
    }
  };

  return { exportToPdf, exportRootToPdf };
})();
