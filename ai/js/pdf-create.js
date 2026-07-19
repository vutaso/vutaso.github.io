window.PdfCreate = (() => {
  const PDF_INSTRUCTION = [
    'Bạn là chuyên gia soạn thảo tài liệu PDF chuyên nghiệp.',
    'Người dùng mô tả loại tài liệu và nội dung cần tạo file PDF.',
    '',
    'Trả lời theo format:',
    '1. Một đoạn mô tả ngắn (2-3 câu) về tài liệu.',
    '2. Một khối code JSON hợp lệ (```json ... ```) theo schema:',
    '',
    '{',
    '  "title": "Tên tài liệu",',
    '  "blocks": [',
    '    { "type": "heading1", "text": "TIÊU ĐỀ CHÍNH" },',
    '    { "type": "heading2", "text": "Mục 1" },',
    '    { "type": "heading3", "text": "Mục 1.1" },',
    '    { "type": "paragraph", "text": "Đoạn văn bản. Hỗ trợ **in đậm**, *in nghiêng*, `mã`." },',
    '    { "type": "bullet", "items": ["Mục 1", "Mục 2"] },',
    '    { "type": "numbered", "items": ["Bước 1", "Bước 2"] },',
    '    { "type": "table", "headers": ["Cột A", "Cột B"], "rows": [["a", "b"]] },',
    '    { "type": "quote", "text": "Trích dẫn hoặc ghi chú" },',
    '    { "type": "code", "text": "console.log(1)", "lang": "javascript" },',
    '    { "type": "math", "text": "E = mc^2", "display": true },',
    '    { "type": "math", "text": "F = ma", "display": false }',
    '  ]',
    '}',
    '',
    'Quy tắc:',
    '- Types hỗ trợ: heading1, heading2, heading3, paragraph, bullet, numbered, table, quote, code, math.',
    '- Có thể dùng heading1/heading2/heading3 hoặc h1/h2/h3.',
    '- Công thức toán học, vật lý, hóa học phải dùng LaTeX/KaTeX:',
    '  + Inline trong text: $E = mc^2$, $\\vec{F} = m\\vec{a}$, $\\frac{a}{b}$',
    '  + Block riêng: type "math" với display: true (công thức lớn, căn giữa)',
    '  + Block inline: type "math" với display: false',
    '  + Trong JSON, escape backslash: viết \\\\frac{a}{b} thay vì \\frac{a}{b}',
    '- Ví dụ paragraph: "Theo định luật II Newton: $F = ma$."',
    '- Ví dụ math block: { "type": "math", "text": "\\\\int_0^1 x^2 \\\\, dx = \\\\frac{1}{3}", "display": true }',
    '- Tạo nội dung đầy đủ, có cấu trúc rõ ràng theo mô tả người dùng.',
    '- JSON phải parse được, không có comment.',
    '- Ngôn ngữ nội dung theo ngôn ngữ người dùng nhập.',
  ].join('\n');

  const HEADING_LEVELS = {
    heading1: 1, h1: 1,
    heading2: 2, h2: 2,
    heading3: 3, h3: 3,
    heading4: 4, h4: 4,
    heading5: 5, h5: 5,
    heading6: 6, h6: 6,
  };

  const sanitizeFilename = (name) => {
    const base = String(name || 'document')
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
    return base || 'document';
  };

  const buildFilename = (data) => sanitizeFilename(data?.title) + '.pdf';

  const tryParseJson = (raw) => {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const normalizePdfData = (parsed) => {
    if (!parsed || typeof parsed !== 'object') return null;
    const title = String(parsed.title || 'Document').trim();
    const blocks = Array.isArray(parsed.blocks) ? parsed.blocks.filter(Boolean) : null;
    if (!blocks || !blocks.length) return null;
    return {
      title,
      blocks,
      blockCount: blocks.length,
    };
  };

  const extractPdfData = (text) => {
    const source = String(text || '');
    if (!source.trim()) return null;

    const fenced = source.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      const parsed = tryParseJson(fenced[1].trim());
      const normalized = normalizePdfData(parsed);
      if (normalized) return normalized;
    }

    const objectMatch = source.match(/\{[\s\S]*"blocks"\s*:\s*\[[\s\S]*\][\s\S]*\}/);
    if (objectMatch) {
      const parsed = tryParseJson(objectMatch[0]);
      const normalized = normalizePdfData(parsed);
      if (normalized) return normalized;
    }

    return null;
  };

  const renderMarkdown = (text) => {
    if (window.Markdown?.render) return window.Markdown.render(String(text || ''));
    return window.Utils.escapeHTML(String(text || ''));
  };

  const renderInlineMarkdown = (text) => {
    const html = renderMarkdown(text);
    return html
      .replace(/^<p>/i, '')
      .replace(/<\/p>\s*$/i, '')
      .replace(/^<p>/i, '')
      .replace(/<\/p>\s*$/i, '');
  };

  const renderMathBlock = (block) => {
    const tex = String(block?.text || block?.latex || block?.formula || '').trim();
    if (!tex) return '';
    const display = block.display !== false;
    if (window.Markdown?.wrapMath) return window.Markdown.wrapMath(tex, display);
    if (window.katex) {
      try {
        const rendered = window.katex.renderToString(tex, {
          displayMode: display,
          throwOnError: false,
          strict: 'ignore',
          trust: false,
          output: 'html',
        });
        return display
          ? '<div class="math-block">' + rendered + '</div>'
          : '<span class="math-inline">' + rendered + '</span>';
      } catch {
        return window.Utils.escapeHTML(tex);
      }
    }
    return display ? '$$' + tex + '$$' : '$' + tex + '$';
  };

  const blockToHtml = (block) => {
    const type = String(block?.type || 'paragraph').toLowerCase();

    if (type === 'math' || type === 'formula' || type === 'equation' || type === 'latex') {
      return renderMathBlock(block);
    }

    const level = HEADING_LEVELS[type];
    if (level) {
      return '<h' + level + '>' + renderInlineMarkdown(block.text || '') + '</h' + level + '>';
    }

    if (type === 'paragraph' || type === 'p') {
      return renderMarkdown(block.text || '');
    }

    if (type === 'bullet' || type === 'ul') {
      const items = Array.isArray(block.items) ? block.items : [];
      return '<ul>'
        + items.map((item) => '<li>' + renderMarkdown(String(item ?? '')) + '</li>').join('')
        + '</ul>';
    }

    if (type === 'numbered' || type === 'ol') {
      const items = Array.isArray(block.items) ? block.items : [];
      return '<ol>'
        + items.map((item) => '<li>' + renderMarkdown(String(item ?? '')) + '</li>').join('')
        + '</ol>';
    }

    if (type === 'quote' || type === 'blockquote') {
      return '<blockquote>' + renderMarkdown(block.text || '') + '</blockquote>';
    }

    if (type === 'code' || type === 'pre') {
      const lang = block.lang || block.language || '';
      return '```' + lang + '\n' + String(block.text || '') + '\n```';
    }

    if (type === 'table') {
      const headers = Array.isArray(block.headers) ? block.headers : [];
      const rows = Array.isArray(block.rows) ? block.rows : [];
      let html = '<table><thead><tr>';
      headers.forEach((cell) => {
        html += '<th>' + renderMarkdown(String(cell ?? '')) + '</th>';
      });
      html += '</tr></thead><tbody>';
      rows.forEach((row) => {
        if (!Array.isArray(row)) return;
        html += '<tr>';
        row.forEach((cell) => {
          html += '<td>' + renderMarkdown(String(cell ?? '')) + '</td>';
        });
        html += '</tr>';
      });
      html += '</tbody></table>';
      return html;
    }

    if (block.text) return renderMarkdown(block.text);
    return '';
  };

  const blocksToHtml = (blocks) =>
    (Array.isArray(blocks) ? blocks : []).map(blockToHtml).join('\n');

  const waitForLayout = () =>
    new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const preparePdfCreateRoot = async (data) => {
    const root = document.createElement('div');
    root.className = 'pdf-export-root';
    root.setAttribute('data-theme', 'light');

    const sheet = document.createElement('div');
    sheet.className = 'pdf-export-sheet';

    const titleEl = document.createElement('h1');
    titleEl.className = 'pdf-export-title';
    titleEl.textContent = data.title || 'Document';
    sheet.appendChild(titleEl);

    const messagesWrap = document.createElement('div');
    messagesWrap.className = 'pdf-export-messages messages';

    const article = document.createElement('article');
    article.className = 'message assistant pdf-export-message';

    const avatar = document.createElement('div');
    avatar.className = 'avatar assistant-av';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = 'V';

    const body = document.createElement('div');
    body.className = 'body';

    const content = document.createElement('div');
    content.className = 'content';
    content.innerHTML = blocksToHtml(data.blocks);

    body.appendChild(content);
    article.appendChild(avatar);
    article.appendChild(body);
    messagesWrap.appendChild(article);
    sheet.appendChild(messagesWrap);
    root.appendChild(sheet);
    document.body.appendChild(root);

    window.Markdown.enhanceCodeBlocks(root);
    window.Markdown.enhanceTables(root);
    window.Markdown.enhanceLinks(root);
    window.Markdown.typesetMath(root);
    if (window.katex?.renderToString) {
      try {
        await document.fonts.ready;
      } catch {}
    }
    window.Markdown.typesetMath(root);
    if (window.mermaid) {
      try {
        window.mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'Inter, system-ui, sans-serif',
          logLevel: 'error',
          suppressErrorRendering: true,
        });
      } catch {}
    }
    await window.Markdown.renderMermaid(root, { skipIfStreaming: false });
    await document.fonts.ready;
    await waitForLayout();

    return root;
  };

  const generatePdf = async (data, { onProgress } = {}) => {
    if (!window.PdfExport?.exportRootToPdf) throw new Error('Thư viện in PDF chưa tải');

    const normalized = normalizePdfData(data);
    if (!normalized) throw new Error('Dữ liệu PDF không hợp lệ');

    const root = await preparePdfCreateRoot(normalized);
    try {
      const result = await window.PdfExport.exportRootToPdf(root, {
        filename: buildFilename(normalized),
        onProgress,
      });
      return {
        printed: !!result?.printed,
        blockCount: normalized.blockCount,
        title: normalized.title,
      };
    } finally {
      root.remove();
      window.Markdown?.updateMermaidTheme?.();
    }
  };

  const appendPdfInstruction = (text, m) => {
    if (!m.pdf) return text || '';
    const userText = text || '';
    return userText
      ? PDF_INSTRUCTION + '\n\n---\n\n' + userText
      : PDF_INSTRUCTION;
  };

  return {
    PDF_INSTRUCTION,
    extractPdfData,
    generatePdf,
    buildFilename,
    appendPdfInstruction,
  };
})();
