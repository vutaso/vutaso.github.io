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

  const captureElementImage = async (el, maxWidth = DOCX_MATH_MAX_WIDTH) => {
    const html2canvas = window.html2canvas?.default || window.html2canvas;
    if (!html2canvas) throw new Error('html2canvas chưa tải');

    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;left:0;top:0;z-index:-1;opacity:1;background:#fff;padding:2px 6px;color:#111118;';
    wrap.appendChild(el.cloneNode(true));
    document.body.appendChild(wrap);
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
      wrap.remove();
    }
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

  const buildTable = (tableEl, docxLib) => {
    const {
      Table, TableRow, TableCell, Paragraph, TextRun, WidthType, ShadingType, BorderStyle, TableLayoutType,
    } = docxLib;
    const parsedRows = [...tableEl.querySelectorAll('tr')].map((tr) =>
      [...tr.querySelectorAll('th, td')].map((cell) => (cell.textContent || '').trim())
    );
    if (!parsedRows.length) return null;

    const colCount = Math.max(1, ...parsedRows.map((cells) => cells.length));
    const contentWidth = DOCX_PAGE_WIDTH_TWIPS - DOCX_H_MARGIN_TWIPS * 2;
    const colWidthTwips = Math.floor(contentWidth / colCount);
    const columnWidths = Array(colCount).fill(colWidthTwips);
    const cellBorders = {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    };

    const tableRows = parsedRows.map((cells, rowIndex) => {
      const padded = cells.slice();
      while (padded.length < colCount) padded.push('');
      const isHeader = rowIndex === 0 || tableEl.querySelectorAll('th').length > 0 && rowIndex === 0;

      return new TableRow({
        tableHeader: isHeader,
        children: padded.map((cellText) => new TableCell({
          width: { size: colWidthTwips, type: WidthType.DXA },
          borders: cellBorders,
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          shading: isHeader ? { fill: 'F0F4F8', type: ShadingType.CLEAR } : undefined,
          children: [new Paragraph({ children: [new TextRun({ text: cellText })] })],
        })),
      });
    });

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
    || el.classList?.contains('katex-display')
    || !!el.querySelector?.('.katex');

  const mathCaptureTarget = (el) => {
    if (el.classList?.contains('math-block')) return el;
    if (el.classList?.contains('math-inline')) return el;
    if (el.classList?.contains('katex-display')) return el.closest('.math-block') || el;
    if (el.classList?.contains('katex')) return el.closest('.math-inline, .math-block') || el;
    return el;
  };

  const walkInline = async (node, docxLib) => {
    const { TextRun, ShadingType } = docxLib;
    const runs = [];

    const appendText = (text) => {
      if (!text) return;
      runs.push(new TextRun({ text }));
    };

    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        appendText(child.textContent);
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;

      const el = child;
      const tag = el.tagName;

      if (isMathElement(el)) {
        try {
          const target = mathCaptureTarget(el);
          const image = await captureElementImage(target);
          runs.push(buildMathImageRun(image, docxLib, { inline: !target.classList.contains('math-block') }));
        } catch {
          appendText(el.textContent || '');
        }
        continue;
      }

      if (tag === 'STRONG' || tag === 'B') {
        runs.push(new TextRun({ text: el.textContent || '', bold: true }));
      } else if (tag === 'EM' || tag === 'I') {
        runs.push(new TextRun({ text: el.textContent || '', italics: true }));
      } else if (tag === 'CODE') {
        runs.push(new TextRun({
          text: el.textContent || '',
          font: DOCX_CODE_FONT,
          size: DOCX_CODE_SIZE,
          shading: { fill: 'EEEEEE', type: ShadingType.CLEAR },
        }));
      } else if (tag === 'A') {
        runs.push(new TextRun({ text: el.textContent || '', color: '2563EB', underline: {} }));
      } else if (tag === 'BR') {
        runs.push(new TextRun({ text: '\n', break: 1 }));
      } else {
        runs.push(...await walkInline(el, docxLib));
      }
    }

    return runs;
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
        blocks.push(new Paragraph({ children: [new TextRun({ text: el.textContent || '' })] }));
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
      for (const li of el.querySelectorAll(':scope > li')) {
        const runs = await walkInline(li, docxLib);
        blocks.push(new Paragraph({
          indent: { left: 360 },
          children: runs.length
            ? [new TextRun({ text: '• ' }), ...runs]
            : [new TextRun({ text: '• ' + (li.textContent || '') })],
        }));
      }
      return blocks;
    }

    if (tag === 'OL') {
      let index = 0;
      for (const li of el.querySelectorAll(':scope > li')) {
        index += 1;
        const runs = await walkInline(li, docxLib);
        blocks.push(new Paragraph({
          children: runs.length
            ? [new TextRun({ text: index + '. ' }), ...runs]
            : [new TextRun({ text: index + '. ' + (li.textContent || '') })],
        }));
      }
      return blocks;
    }

    if (tag === 'PRE') {
      const code = el.querySelector('code');
      const lang = [...(code?.classList || [])].find((c) => c.startsWith('language-'))?.slice(9) || '';
      blocks.push(...buildCodeBlockParagraphs(code?.textContent || el.textContent || '', docxLib, lang));
      return blocks;
    }

    if (tag === 'BLOCKQUOTE') {
      blocks.push(new Paragraph({
        indent: { left: 720 },
        children: [new TextRun({ text: el.textContent || '', italics: true, color: '666666' })],
      }));
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
        const docxTable = buildTable(table, docxLib);
        if (docxTable) blocks.push(docxTable);
        blocks.push(new Paragraph({ spacing: { before: 80 }, children: [] }));
      }
      return blocks;
    }

    if (tag === 'TABLE') {
      blocks.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
      const docxTable = buildTable(el, docxLib);
      if (docxTable) blocks.push(docxTable);
      blocks.push(new Paragraph({ spacing: { before: 80 }, children: [] }));
      return blocks;
    }

    if (el.classList?.contains('mermaid-block')) {
      const view = el.querySelector('.mermaid-view svg, .mermaid-view');
      if (view) {
        try {
          const image = await captureElementImage(view, DOCX_MATH_MAX_WIDTH);
          blocks.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 80 },
            children: [buildMathImageRun(image, docxLib)],
          }));
          return blocks;
        } catch {}
      }
      const code = el.querySelector('.mermaid-source code, .mermaid-view code');
      if (code) {
        blocks.push(...buildCodeBlockParagraphs(code.textContent || '', docxLib, 'mermaid'));
      }
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
    host.style.cssText = 'position:fixed;left:0;top:0;width:620px;z-index:-1;background:#fff;color:#111118;padding:8px;';
    host.innerHTML = window.Markdown.render(text);
    document.body.appendChild(host);

    window.Markdown.enhanceCodeBlocks(host);
    window.Markdown.enhanceTables(host);
    window.Markdown.typesetMath(host);

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
    await window.Markdown.renderMermaid(host, { skipIfStreaming: false });
    await document.fonts.ready;
    await waitForLayout();

    try {
      return await convertChildren([...host.childNodes], docxLib);
    } finally {
      host.remove();
      window.Markdown?.updateMermaidTheme?.();
    }
  };

  return { markdownToDocxParagraphs };
})();
