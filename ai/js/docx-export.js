window.DocxExport = (() => {
  const DOCX_MATH_MAX_WIDTH = 560;
  const DOCX_CODE_FONT = 'Courier New';
  const DOCX_CODE_SIZE = 20;
  const DOCX_PAGE_WIDTH_TWIPS = 12240;
  const DOCX_H_MARGIN_TWIPS = 720;

  const waitForLayout = () =>
    new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const dataUrlToBytes = (dataUrl) => {
    const base64 = String(dataUrl).split(',')[1];
    if (!base64) throw new Error('Dữ liệu ảnh không hợp lệ');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  };

  const mountOffscreen = (node) => {
    const clip = document.createElement('div');
    clip.setAttribute('data-docx-export-clip', '');
    clip.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;pointer-events:none;';
    clip.appendChild(node);
    document.body.appendChild(clip);
    return clip;
  };

  const captureElementImage = async (el, maxWidth = DOCX_MATH_MAX_WIDTH) => {
    const html2canvas = window.html2canvas?.default || window.html2canvas;
    if (!html2canvas) throw new Error('html2canvas chưa tải');

    const wrap = document.createElement('div');
    wrap.style.cssText = 'width:max-content;background:#fff;padding:2px 6px;color:#111118;';
    wrap.appendChild(el.cloneNode(true));
    const clip = mountOffscreen(wrap);
    await document.fonts.ready;
    await waitForLayout();

    try {
      const scale = 2;
      const canvas = await html2canvas(wrap, {
        scale,
        backgroundColor: '#ffffff',
        logging: false,
      });
      let width = Math.round(canvas.width / scale);
      let height = Math.round(canvas.height / scale);
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = Math.round(height * ratio);
      }
      const out = document.createElement('canvas');
      out.width = Math.max(1, width);
      out.height = Math.max(1, height);
      out.getContext('2d').drawImage(canvas, 0, 0, width, height);
      return {
        data: dataUrlToBytes(out.toDataURL('image/png')),
        type: 'png',
        width,
        height,
      };
    } finally {
      clip.remove();
    }
  };

  const embedImageSrc = (src, maxWidth) => new Promise((resolve, reject) => {
    const url = String(src || '').trim();
    if (!url || url.startsWith('blob:')) {
      reject(new Error('Ảnh không nhúng được'));
      return;
    }
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxWidth / Math.max(image.width, image.height, 1));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(image, 0, 0, width, height);
      try {
        resolve({
          data: dataUrlToBytes(canvas.toDataURL('image/png')),
          type: 'png',
          width,
          height,
        });
      } catch (err) {
        reject(err);
      }
    };
    image.onerror = () => reject(new Error('Không tải được ảnh'));
    if (!url.startsWith('data:')) image.crossOrigin = 'anonymous';
    image.src = url;
  });

  const mathSourceText = (el) => {
    const tex = el?.getAttribute?.('data-tex') || el?.closest?.('[data-tex]')?.getAttribute('data-tex') || '';
    return String(tex || '').trim();
  };

  const buildMathImageRun = (imageData, docxLib, { inline = false } = {}) => {
    const { ImageRun } = docxLib;
    let { width, height } = imageData;
    if (inline && height > 22) {
      const scale = 22 / height;
      width = Math.round(width * scale);
      height = 22;
    }
    return new ImageRun({
      type: imageData.type,
      data: imageData.data,
      transformation: { width, height },
    });
  };

  const buildCodeBlockParagraphs = (rawCode, docxLib, lang) => {
    const { Paragraph, TextRun, ShadingType } = docxLib;
    const paragraphs = [];
    const code = String(rawCode ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = code.split('\n');

    if (lang) {
      paragraphs.push(new Paragraph({
        spacing: { before: 120, after: 40 },
        indent: { left: 360, right: 360 },
        children: [new TextRun({ text: lang, font: DOCX_CODE_FONT, size: 18, color: '888888', italics: true })],
      }));
    }

    const addLine = (line, { first, last }) => {
      paragraphs.push(new Paragraph({
        spacing: { before: first ? 100 : 0, after: last ? 100 : 0, line: 240 },
        indent: { left: 360, right: 360 },
        shading: { fill: 'F5F5F5', type: ShadingType.CLEAR },
        children: [new TextRun({
          text: line.length ? line : '\u00A0',
          font: DOCX_CODE_FONT,
          size: DOCX_CODE_SIZE,
        })],
      }));
    };

    if (!lines.length) {
      addLine('', { first: true, last: true });
      return paragraphs;
    }

    lines.forEach((line, i) => {
      addLine(line, { first: i === 0 && !lang, last: i === lines.length - 1 });
    });
    return paragraphs;
  };

  const buildTable = async (tableEl, docxLib) => {
    const {
      Table, TableRow, TableCell, Paragraph, TextRun, WidthType, ShadingType, BorderStyle, TableLayoutType,
    } = docxLib;
    const rowEls = [...tableEl.querySelectorAll(':scope > tr, :scope > thead > tr, :scope > tbody > tr')];
    if (!rowEls.length) return null;

    // Chỉ coi hàng đầu là header khi nó thực sự chứa <th>.
    // Bảng có hàng đầu là dữ liệu (không có th) sẽ không bị tô nền header.
    const firstRow = rowEls[0];
    const firstRowIsHeader = !!(firstRow && firstRow.querySelector(':scope > th'));

    const colCount = rowEls.reduce((max, tr) => Math.max(max, tr.querySelectorAll(':scope > th, :scope > td').length), 1);
    const contentWidth = DOCX_PAGE_WIDTH_TWIPS - DOCX_H_MARGIN_TWIPS * 2;
    const colWidthTwips = Math.floor(contentWidth / colCount);
    const columnWidths = Array(colCount).fill(colWidthTwips);
    const cellBorders = {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    };

    const tableRows = [];
    for (let rowIndex = 0; rowIndex < rowEls.length; rowIndex++) {
      const cells = [...rowEls[rowIndex].querySelectorAll(':scope > th, :scope > td')];
      while (cells.length < colCount) cells.push(null);
      const isHeader = firstRowIsHeader && rowIndex === 0;
      const docxCells = [];
      for (const cell of cells) {
        const runs = cell ? await walkInline(cell, docxLib) : [];
        docxCells.push(new TableCell({
          width: { size: colWidthTwips, type: WidthType.DXA },
          borders: cellBorders,
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          shading: isHeader ? { fill: 'F0F4F8', type: ShadingType.CLEAR } : undefined,
          children: [new Paragraph({
            children: runs.length ? runs : [new TextRun({ text: '' })],
          })],
        }));
      }
      tableRows.push(new TableRow({
        tableHeader: isHeader,
        children: docxCells,
      }));
    }

    return new Table({
      layout: TableLayoutType.FIXED,
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths,
      rows: tableRows,
    });
  };

  const isMathElement = (el) =>
    el.classList?.contains('math-inline')
    || el.classList?.contains('math-block')
    || el.classList?.contains('katex')
    || el.classList?.contains('katex-display');

  const mathCaptureTarget = (el) => {
    if (el.classList?.contains('math-block')) return el;
    if (el.classList?.contains('math-inline')) return el;
    if (el.classList?.contains('katex-display')) return el.closest('.math-block') || el;
    if (el.classList?.contains('katex')) return el.closest('.math-inline, .math-block') || el;
    return el;
  };

  const textRun = (text, style, docxLib) => {
    if (text == null || text === '') return null;
    const { TextRun, ShadingType } = docxLib;
    const opts = { text: String(text) };
    if (style.bold) opts.bold = true;
    if (style.italics) opts.italics = true;
    if (style.strike) opts.strike = true;
    if (style.super) opts.superScript = true;
    if (style.sub) opts.subScript = true;
    if (style.code) {
      opts.font = DOCX_CODE_FONT;
      opts.size = DOCX_CODE_SIZE;
      opts.shading = { fill: 'EEEEEE', type: ShadingType.CLEAR };
    }
    if (style.link) {
      opts.color = '2563EB';
      opts.underline = {};
    } else if (style.color) {
      opts.color = style.color;
    }
    return new TextRun(opts);
  };

  const withStyle = (style, extra) => Object.assign({}, style, extra);

  const walkInline = async (node, docxLib, style = {}) => {
    const { TextRun, ExternalHyperlink } = docxLib;
    const runs = [];

    const appendText = (text) => {
      const run = textRun(text, style, docxLib);
      if (run) runs.push(run);
    };

    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        appendText(child.textContent);
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;

      const el = child;
      const tag = el.tagName;

      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'BUTTON') continue;

      if (isMathElement(el)) {
        const target = mathCaptureTarget(el);
        const display = target.classList.contains('math-block');
        try {
          const image = await captureElementImage(target);
          runs.push(buildMathImageRun(image, docxLib, { inline: !display }));
        } catch {
          const tex = mathSourceText(target) || mathSourceText(el);
          appendText(tex || el.textContent || '');
        }
        continue;
      }

      if (tag === 'STRONG' || tag === 'B') {
        runs.push(...await walkInline(el, docxLib, withStyle(style, { bold: true })));
      } else if (tag === 'EM' || tag === 'I') {
        runs.push(...await walkInline(el, docxLib, withStyle(style, { italics: true })));
      } else if (tag === 'DEL' || tag === 'S') {
        runs.push(...await walkInline(el, docxLib, withStyle(style, { strike: true })));
      } else if (tag === 'SUB') {
        runs.push(...await walkInline(el, docxLib, withStyle(style, { sub: true })));
      } else if (tag === 'SUP') {
        runs.push(...await walkInline(el, docxLib, withStyle(style, { super: true })));
      } else if (tag === 'CODE') {
        runs.push(...await walkInline(el, docxLib, withStyle(style, { code: true })));
      } else if (tag === 'A') {
        const href = el.getAttribute('href') || '';
        const inner = await walkInline(el, docxLib, withStyle(style, { link: true }));
        const linkRuns = inner.length ? inner : [textRun(href, withStyle(style, { link: true }), docxLib)].filter(Boolean);
        if (ExternalHyperlink && /^(https?:|mailto:)/i.test(href) && linkRuns.every((run) => run instanceof TextRun)) {
          runs.push(new ExternalHyperlink({ link: href, children: linkRuns }));
        } else {
          runs.push(...linkRuns);
        }
      } else if (tag === 'BR') {
        runs.push(new TextRun({ break: 1 }));
      } else if (tag === 'IMG') {
        const alt = (el.getAttribute('alt') || '').trim();
        const src = el.getAttribute('src') || '';
        try {
          const image = await embedImageSrc(src, DOCX_MATH_MAX_WIDTH);
          runs.push(buildMathImageRun(image, docxLib));
        } catch {
          if (alt) appendText(alt);
        }
      } else if (tag === 'INPUT' && (el.getAttribute('type') || '').toLowerCase() === 'checkbox') {
        appendText((el.checked || el.hasAttribute('checked')) ? '☑ ' : '☐ ');
      } else if (
        tag === 'UL' || tag === 'OL' || tag === 'PRE' || tag === 'TABLE' || tag === 'BLOCKQUOTE'
        || el.classList.contains('code-block')
        || el.classList.contains('table-block')
        || el.classList.contains('mermaid-block')
      ) {
        continue;
      } else {
        runs.push(...await walkInline(el, docxLib, style));
      }
    }

    return runs;
  };

  // Chuyển list (ul/ol) thành các Paragraph, xử lý list lồng nhau đệ quy:
  // mỗi cấp tăng indent, ol đánh số riêng theo cấp và tôn trọng thuộc tính `start`.
  const convertList = async (listEl, docxLib, { ordered = false, depth = 0 } = {}) => {
    const { Paragraph, TextRun } = docxLib;
    const blocks = [];
    const startAttr = ordered ? parseInt(listEl.getAttribute('start'), 10) : NaN;
    let index = Number.isNaN(startAttr) ? 0 : startAttr - 1;

    for (const li of listEl.querySelectorAll(':scope > li')) {
      index += 1;
      const marker = ordered ? index + '. ' : '• ';
      // walkInline đã bỏ qua ul/ol lồng bên trong li → chỉ lấy nội dung của chính li.
      const runs = await walkInline(li, docxLib);
      blocks.push(new Paragraph({
        indent: { left: 360 * (depth + 1) },
        children: runs.length ? [new TextRun({ text: marker }), ...runs] : [new TextRun({ text: marker })],
      }));

      for (const sub of li.querySelectorAll(':scope > ul, :scope > ol, :scope > pre, :scope > blockquote, :scope > table, :scope > div')) {
        if (sub.tagName === 'UL' || sub.tagName === 'OL') {
          blocks.push(...await convertList(sub, docxLib, {
            ordered: sub.tagName === 'OL',
            depth: depth + 1,
          }));
        } else if (
          sub.tagName === 'PRE'
          || sub.tagName === 'BLOCKQUOTE'
          || sub.tagName === 'TABLE'
          || sub.classList.contains('code-block')
          || sub.classList.contains('table-block')
          || sub.classList.contains('mermaid-block')
        ) {
          blocks.push(...await convertBlock(sub, docxLib));
        }
      }
    }
    return blocks;
  };

  const convertBlock = async (el, docxLib) => {
    const { Paragraph, TextRun, HeadingLevel, AlignmentType } = docxLib;
    const tag = el.tagName;
    const blocks = [];

    if (isMathElement(el)) {
      try {
        const target = mathCaptureTarget(el);
        const image = await captureElementImage(target);
        blocks.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 80 },
          children: [buildMathImageRun(image, docxLib)],
        }));
      } catch {
        const tex = mathSourceText(mathCaptureTarget(el)) || mathSourceText(el);
        blocks.push(new Paragraph({ children: [new TextRun({ text: tex || '' })] }));
      }
      return blocks;
    }

    if (tag === 'P') {
      const runs = await walkInline(el, docxLib);
      blocks.push(new Paragraph({ children: runs.length ? runs : [new TextRun({ text: '' })] }));
      return blocks;
    }

    if (/^H[1-6]$/.test(tag)) {
      const level = Number(tag[1]);
      const headingMap = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
        4: HeadingLevel.HEADING_4,
        5: HeadingLevel.HEADING_5,
        6: HeadingLevel.HEADING_6,
      };
      const runs = await walkInline(el, docxLib);
      blocks.push(new Paragraph({
        heading: headingMap[level] || HeadingLevel.HEADING_3,
        children: runs.length ? runs : [new TextRun({ text: el.textContent || '' })],
      }));
      return blocks;
    }

    if (tag === 'UL') {
      blocks.push(...await convertList(el, docxLib, { ordered: false, depth: 0 }));
      return blocks;
    }

    if (tag === 'OL') {
      blocks.push(...await convertList(el, docxLib, { ordered: true, depth: 0 }));
      return blocks;
    }

    if (tag === 'PRE') {
      const code = el.querySelector('code');
      const lang = [...(code?.classList || [])].find((c) => c.startsWith('language-'))?.slice(9) || '';
      blocks.push(...buildCodeBlockParagraphs(code?.textContent || el.textContent || '', docxLib, lang));
      return blocks;
    }

    if (tag === 'BLOCKQUOTE') {
      const quoteStyle = { italics: true, color: '666666' };
      for (const child of el.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = (child.textContent || '').trim();
          if (text) {
            blocks.push(new Paragraph({
              indent: { left: 720 },
              children: [textRun(text, quoteStyle, docxLib)],
            }));
          }
          continue;
        }
        if (child.nodeType !== Node.ELEMENT_NODE) continue;
        if (child.tagName === 'P') {
          const runs = await walkInline(child, docxLib, quoteStyle);
          blocks.push(new Paragraph({
            indent: { left: 720 },
            children: runs.length ? runs : [new TextRun({ text: '' })],
          }));
        } else {
          blocks.push(...await convertBlock(child, docxLib));
        }
      }
      if (!blocks.length) {
        blocks.push(new Paragraph({
          indent: { left: 720 },
          children: [new TextRun({ text: '', italics: true })],
        }));
      }
      return blocks;
    }

    if (tag === 'HR') {
      blocks.push(new Paragraph({
        spacing: { before: 120, after: 120 },
        children: [new TextRun({ text: '—'.repeat(24), color: 'CCCCCC' })],
      }));
      return blocks;
    }

    if (el.classList?.contains('table-block')) {
      const table = el.querySelector('table');
      if (table) {
        blocks.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
        const docxTable = await buildTable(table, docxLib);
        if (docxTable) blocks.push(docxTable);
        blocks.push(new Paragraph({ spacing: { before: 80 }, children: [] }));
      }
      return blocks;
    }

    if (tag === 'TABLE') {
      blocks.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
      const docxTable = await buildTable(el, docxLib);
      if (docxTable) blocks.push(docxTable);
      blocks.push(new Paragraph({ spacing: { before: 80 }, children: [] }));
      return blocks;
    }

    if (el.classList?.contains('mermaid-block')) {
      const failed = el.dataset.rendered === 'error' || !!el.querySelector('.mermaid-error');
      const svg = !failed && el.querySelector('.mermaid-view svg');
      if (svg) {
        try {
          const image = await captureElementImage(svg, DOCX_MATH_MAX_WIDTH);
          blocks.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 80 },
            children: [buildMathImageRun(image, docxLib)],
          }));
          return blocks;
        } catch {}
      }
      const source = window.Markdown?.getMermaidSource?.(el) || '';
      if (source.trim()) {
        blocks.push(...buildCodeBlockParagraphs(source, docxLib, 'mermaid'));
      }
      return blocks;
    }

    if (el.classList?.contains('code-block')) {
      const code = el.querySelector('.code-block-body code') || el.querySelector('pre code');
      const lang = [...(code?.classList || [])].find((c) => c.startsWith('language-'))?.slice(9)
        || (el.querySelector('.pre-header .lang')?.textContent || '').trim();
      blocks.push(...buildCodeBlockParagraphs(code?.textContent || '', docxLib, lang));
      return blocks;
    }

    if (tag === 'DETAILS') {
      const summary = el.querySelector('summary');
      if (summary) {
        blocks.push(new Paragraph({
          children: [new TextRun({ text: summary.textContent || '', bold: true, color: '666666' })],
        }));
      }
      const body = el.querySelector('.message-reasoning-body') || el;
      blocks.push(...await convertChildren([...body.childNodes].filter((n) => n !== summary), docxLib));
      return blocks;
    }

    if (tag === 'DIV' || tag === 'SECTION') {
      blocks.push(...await convertChildren([...el.childNodes], docxLib));
      return blocks;
    }

    blocks.push(new Paragraph({ children: [new TextRun({ text: el.textContent || '' })] }));
    return blocks;
  };

  const convertChildren = async (nodes, docxLib) => {
    const blocks = [];
    for (const node of nodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = (node.textContent || '').trim();
        if (text) blocks.push(new Paragraph({ children: [new TextRun({ text })] }));
        continue;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        blocks.push(...await convertBlock(node, docxLib));
      }
    }
    return blocks;
  };

  const markdownToDocxParagraphs = async (text, docxLib) => {
    if (!text?.trim() || !window.Markdown) return [];

    const host = document.createElement('div');
    host.className = 'docx-export-host';
    host.setAttribute('data-theme', 'light');
    host.style.cssText = 'width:620px;background:#fff;color:#111118;padding:8px;';
    host.innerHTML = window.Markdown.render(text);
    const clip = mountOffscreen(host);

    window.Markdown.enhanceCodeBlocks(host);
    window.Markdown.enhanceTables(host);
    window.Markdown.typesetMath(host);

    if (window.mermaid) {
      try {
        window.mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'strict',
          fontFamily: 'Inter, system-ui, sans-serif',
          logLevel: 'error',
          suppressErrorRendering: true,
        });
      } catch {}
    }
    await window.Markdown.renderMermaid(host, { skipIfStreaming: false });
    await document.fonts.ready;
    await waitForLayout();

    try {
      return await convertChildren([...host.childNodes], docxLib);
    } finally {
      clip.remove();
      window.Markdown?.updateMermaidTheme?.();
    }
  };

  return { markdownToDocxParagraphs };
})();
