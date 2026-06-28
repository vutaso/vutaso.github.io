window.Utils = (() => {
  const escapeHTML = (str) => String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    if (sameDay) return time;
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua';
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

  const debounce = (fn, ms) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  const DIACRITIC_RE = /[\u0300-\u036f]/g;

  const normalizeSearchQuery = (query) => String(query || '')
    .normalize('NFD')
    .replace(DIACRITIC_RE, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim();

  const buildSearchFold = (text) => {
    const source = String(text || '');
    if (!source) return { source: '', norm: '', starts: [] };

    const starts = [];
    let norm = '';
    for (let i = 0; i < source.length;) {
      const cp = source.codePointAt(i);
      const char = String.fromCodePoint(cp);
      let folded;
      if (cp === 0x111 || cp === 0x110) {
        folded = 'd';
      } else {
        folded = char.normalize('NFD').replace(DIACRITIC_RE, '').toLowerCase();
      }
      for (let j = 0; j < folded.length; j++) {
        starts.push(i);
        norm += folded[j];
      }
      i += char.length;
    }
    return { source, norm, starts };
  };

  const normalizeSearchText = (text) => buildSearchFold(text).norm;

  const includesSearchFold = (fold, normQuery) => {
    if (!normQuery) return true;
    return fold.norm.includes(normQuery);
  };

  const findSearchRangeInFold = (fold, normQuery) => {
    if (!normQuery) return null;
    const normIdx = fold.norm.indexOf(normQuery);
    if (normIdx < 0) return null;
    const start = fold.starts[normIdx];
    const lastNormIdx = normIdx + normQuery.length - 1;
    const endStart = fold.starts[lastNormIdx];
    const endChar = String.fromCodePoint(fold.source.codePointAt(endStart));
    return { start, end: endStart + endChar.length };
  };

  const findSearchRange = (text, query) => {
    const normQuery = normalizeSearchQuery(query);
    if (!normQuery) return null;
    return findSearchRangeInFold(buildSearchFold(text), normQuery);
  };

  const includesSearch = (haystack, needle) => {
    const normQuery = normalizeSearchQuery(needle);
    if (!normQuery) return true;
    return includesSearchFold(buildSearchFold(haystack), normQuery);
  };

  const buildSearchSnippet = (fold, normQuery, radius = 28) => {
    const range = findSearchRangeInFold(fold, normQuery);
    if (!range) return '';
    const text = fold.source;
    const start = Math.max(0, range.start - radius);
    const end = Math.min(text.length, range.end + radius);
    let snippet = text.slice(start, end).replace(/\s+/g, ' ').trim();
    if (start > 0) snippet = '…' + snippet;
    if (end < text.length) snippet = snippet + '…';
    return snippet;
  };

  const highlightSearchText = (text, query, escapeFn = escapeHTML) => {
    const q = (query || '').trim();
    if (!q) return escapeFn(text);
    const normQuery = normalizeSearchQuery(q);
    const range = findSearchRangeInFold(buildSearchFold(text), normQuery);
    if (!range) return escapeFn(text);
    const before = text.slice(0, range.start);
    const match = text.slice(range.start, range.end);
    const after = text.slice(range.end);
    return escapeFn(before)
      + '<mark class="search-hl">' + escapeFn(match) + '</mark>'
      + escapeFn(after);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); document.body.removeChild(ta); return true; }
      catch { document.body.removeChild(ta); return false; }
    }
  };

  const dataUrlToBlob = async (dataUrl) => {
    const res = await fetch(dataUrl);
    return res.blob();
  };

  const extensionFromDataUrl = (dataUrl) => {
    const mime = (dataUrl.match(/^data:([^;,]+)/) || [])[1] || 'image/png';
    if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
    if (mime.includes('webp')) return 'webp';
    if (mime.includes('gif')) return 'gif';
    return 'png';
  };

  const copyImageToClipboard = async (dataUrl) => {
    if (!dataUrl || !navigator.clipboard?.write) return false;
    try {
      const blob = await dataUrlToBlob(dataUrl);
      const type = blob.type || 'image/png';
      await navigator.clipboard.write([new ClipboardItem({ [type]: blob })]);
      return true;
    } catch {
      return false;
    }
  };

  const downloadDataUrlImage = async (dataUrl, filename) => {
    if (!dataUrl) return;
    const ext = extensionFromDataUrl(dataUrl);
    const base = String(filename || 'hinh-ai')
      .replace(/\.(png|jpe?g|webp|gif)$/i, '')
      .replace(/[^\w\-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'hinh-ai';
    const blob = await dataUrlToBlob(dataUrl);
    downloadBlob(blob, base + '.' + ext);
  };

  const truncate = (str, n) => {
    const s = String(str).replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  };

  const autoResize = (el) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  const formatConversation = (convo) => {
    const parts = [];
    for (const msg of convo.messages) {
      if (msg.role === 'user') {
        const text = msg.content || '';
        const translateNote = msg.translateTo
          ? '\n\n_' + window.APP_CONFIG.getTranslateLabel(msg.translateTo) + '_'
          : '';
        const imageGenNote = msg.imageGen
          ? '\n\n_' + [
            'Tỷ lệ ' + window.APP_CONFIG.getImageGenRatio(msg.imageGen.ratio).label,
            msg.imageGen.style !== 'auto' ? window.APP_CONFIG.getImageGenStyle(msg.imageGen.style).label : '',
            msg.imageGen.template !== 'none' ? window.APP_CONFIG.getImageGenTemplate(msg.imageGen.template).label : ''
          ].filter(Boolean).join(' · ') + '_'
          : '';
        const imgNote = msg.images && msg.images.length
          ? '\n\n_[' + msg.images.length + ' hình ảnh đính kèm]_'
          : '';
        const fileNote = msg.files && msg.files.length
          ? '\n\n' + msg.files.map((f) => '**Tệp: ' + f.name + '**\n```\n' + f.content + '\n```').join('\n\n')
          : '';
        parts.push('**' + (text || (msg.files && msg.files[0] ? msg.files[0].name : 'Hình ảnh')) + '**' + translateNote + imageGenNote + imgNote + fileNote);
      } else {
        parts.push(window.Conversations.getAssistantContent(msg));
      }
    }
    return parts.join('\n\n---\n\n');
  };

  const formatConversationPlainText = (convo) => {
    const title = (convo.title || 'Cuộc trò chuyện').trim();
    const parts = [title, '='.repeat(Math.min(Math.max(title.length, 12), 72)), ''];

    for (const msg of convo.messages) {
      if (msg.role === 'user') {
        const text = msg.content || '';
        const lines = ['BẠN:'];
        lines.push(text || (msg.files && msg.files[0] ? msg.files[0].name : 'Hình ảnh'));
        if (msg.translateTo) {
          lines.push('(' + window.APP_CONFIG.getTranslateLabel(msg.translateTo) + ')');
        }
        if (msg.imageGen) {
          lines.push('(' + [
            'Tỷ lệ ' + window.APP_CONFIG.getImageGenRatio(msg.imageGen.ratio).label,
            msg.imageGen.style !== 'auto' ? window.APP_CONFIG.getImageGenStyle(msg.imageGen.style).label : '',
            msg.imageGen.template !== 'none' ? window.APP_CONFIG.getImageGenTemplate(msg.imageGen.template).label : ''
          ].filter(Boolean).join(' · ') + ')');
        }
        if (msg.images && msg.images.length) {
          lines.push('[' + msg.images.length + ' hình ảnh đính kèm]');
        }
        for (const f of msg.files || []) {
          lines.push('', 'Tệp: ' + f.name, f.content || '');
        }
        parts.push(lines.join('\n'));
      } else if (msg.role === 'assistant') {
        const content = window.Conversations.getAssistantContent(msg);
        if (!content) continue;
        parts.push('TRỢ LÝ:\n' + content);
      } else {
        continue;
      }
      parts.push('', '---', '');
    }

    return parts.join('\n').replace(/\n---\n\n$/, '\n').trim() + '\n';
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
    downloadBlob(blob, filename);
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };


  const exportSafeName = (title) =>
    (title || 'conversation').replace(/[^a-zA-Z0-9\u00C0-\u1EF9_\-\s]/g, '').trim() || 'conversation';

  const filterExportMessages = (convo) => (convo.messages || []).filter((m) => {
    if (m.role !== 'user' && m.role !== 'assistant') return false;
    if (m.role === 'assistant' && !window.Conversations.getAssistantContent(m)) return false;
    return true;
  });

  const DOCX_IMAGE_MAX_PX = 420;
  const DOCX_PAGE_WIDTH_TWIPS = 12240;
  const DOCX_H_MARGIN_TWIPS = 720;

  const dataUrlToBytes = (dataUrl) => {
    const base64 = String(dataUrl).split(',')[1];
    if (!base64) throw new Error('Dữ liệu ảnh không hợp lệ');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  };

  const prepareDocxImage = (src, maxPx) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(image.width, image.height, 1));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(image, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/png');
      resolve({
        data: dataUrlToBytes(dataUrl),
        type: 'png',
        width,
        height,
      });
    };
    image.onerror = () => reject(new Error('Không tải được ảnh'));
    image.src = src;
  });

  const DOCX_CODE_FONT = 'Courier New';
  const DOCX_CODE_SIZE = 20;

  const buildDocxCodeLineParagraph = (line, docxLib, { first, last }) => {
    const { Paragraph, TextRun, ShadingType } = docxLib;
    return new Paragraph({
      spacing: { before: first ? 100 : 0, after: last ? 100 : 0, line: 240 },
      indent: { left: 360, right: 360 },
      shading: { fill: 'F5F5F5', type: ShadingType.CLEAR },
      children: [
        new TextRun({
          text: line.length ? line : '\u00A0',
          font: DOCX_CODE_FONT,
          size: DOCX_CODE_SIZE,
        }),
      ],
    });
  };

  const buildDocxCodeBlockParagraphs = (rawCode, docxLib, lang) => {
    const { Paragraph, TextRun } = docxLib;
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

    if (!lines.length) {
      paragraphs.push(buildDocxCodeLineParagraph('', docxLib, { first: true, last: true }));
      return paragraphs;
    }

    lines.forEach((line, i) => {
      paragraphs.push(buildDocxCodeLineParagraph(line, docxLib, {
        first: i === 0 && !lang,
        last: i === lines.length - 1,
      }));
    });

    return paragraphs;
  };

  const parseFencedCodeBlock = (segment) => {
    const closed = segment.match(/^```([^\n`]*)\n([\s\S]*)```$/);
    if (closed) {
      return { lang: closed[1].trim(), code: closed[2].replace(/\n$/, '') };
    }
    const open = segment.match(/^```([^\n`]*)\n?([\s\S]*)$/);
    if (open) {
      return { lang: open[1].trim(), code: open[2].replace(/\n$/, '') };
    }
    return { lang: '', code: segment.replace(/^```[^\n]*\n?/, '').replace(/```$/, '') };
  };

  const isIndentedCodeLine = (line) => /^(?: {4}|\t)/.test(line);

  const stripIndentedCodePrefix = (line) => {
    if (/^ {4}/.test(line)) return line.slice(4);
    if (/^\t/.test(line)) return line.slice(1);
    return line;
  };

  const parseInlineMarkdown = (text, docxLib) => {
    const { TextRun, ShadingType } = docxLib;
    const runs = [];
    const parts = String(text).split(/(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g);
    for (const part of parts) {
      if (!part) continue;
      if (part.startsWith('**') && part.endsWith('**')) {
        runs.push(new TextRun({ text: part.slice(2, -2), bold: true }));
      } else if (part.startsWith('*') && part.endsWith('*')) {
        runs.push(new TextRun({ text: part.slice(1, -1), italics: true }));
      } else if (part.startsWith('`') && part.endsWith('`')) {
        runs.push(new TextRun({
          text: part.slice(1, -1),
          font: DOCX_CODE_FONT,
          size: DOCX_CODE_SIZE,
          shading: { fill: 'EEEEEE', type: ShadingType.CLEAR },
        }));
      } else {
        runs.push(new TextRun({ text: part }));
      }
    }
    return runs.length ? runs : [new TextRun({ text: '' })];
  };

  const parseMarkdownTableCells = (line) => {
    let trimmed = String(line || '').trim();
    if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
    if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
    return trimmed.split('|').map((cell) => cell.trim());
  };

  const isMarkdownTableSeparator = (line) => {
    const cells = parseMarkdownTableCells(line);
    return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
  };

  const isMarkdownTableRow = (line) => {
    const trimmed = String(line || '').trim();
    if (!trimmed.includes('|')) return false;
    if (isMarkdownTableSeparator(trimmed)) return true;
    return /^\|/.test(trimmed);
  };

  const buildDocxTable = (rows, docxLib) => {
    const {
      Table, TableRow, TableCell, Paragraph, WidthType, ShadingType, BorderStyle, TableLayoutType,
    } = docxLib;
    const parsedRows = rows.map(parseMarkdownTableCells);
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
      const isHeader = rowIndex === 0;

      return new TableRow({
        tableHeader: isHeader,
        children: padded.map((cellText) => new TableCell({
          width: { size: colWidthTwips, type: WidthType.DXA },
          borders: cellBorders,
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          shading: isHeader ? { fill: 'F0F4F8', type: ShadingType.CLEAR } : undefined,
          children: [
            new Paragraph({
              children: parseInlineMarkdown(cellText, docxLib),
            }),
          ],
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

  const processMarkdownLines = (text, docxLib) => {
    const { Paragraph, TextRun, HeadingLevel } = docxLib;
    const paragraphs = [];
    const lines = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trimEnd();

      if (isIndentedCodeLine(line)) {
        const codeLines = [];
        while (i < lines.length && isIndentedCodeLine(lines[i])) {
          codeLines.push(stripIndentedCodePrefix(lines[i]));
          i++;
        }
        paragraphs.push(...buildDocxCodeBlockParagraphs(codeLines.join('\n'), docxLib));
        continue;
      }

      if (!trimmed) {
        paragraphs.push(new Paragraph({ children: [] }));
        i++;
        continue;
      }

      const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const headingMap = {
          1: HeadingLevel.HEADING_1,
          2: HeadingLevel.HEADING_2,
          3: HeadingLevel.HEADING_3,
          4: HeadingLevel.HEADING_4,
          5: HeadingLevel.HEADING_5,
          6: HeadingLevel.HEADING_6,
        };
        paragraphs.push(new Paragraph({
          heading: headingMap[level] || HeadingLevel.HEADING_3,
          children: parseInlineMarkdown(headingMatch[2], docxLib),
        }));
        i++;
        continue;
      }

      const bulletMatch = trimmed.match(/^[-*+]\s+(.+)$/);
      if (bulletMatch) {
        paragraphs.push(new Paragraph({
          indent: { left: 360 },
          children: parseInlineMarkdown('• ' + bulletMatch[1], docxLib),
        }));
        i++;
        continue;
      }

      const numMatch = trimmed.match(/^\d+\.\s+(.+)$/);
      if (numMatch) {
        paragraphs.push(new Paragraph({
          children: parseInlineMarkdown(trimmed, docxLib),
        }));
        i++;
        continue;
      }

      const quoteMatch = trimmed.match(/^>\s*(.*)$/);
      if (quoteMatch) {
        paragraphs.push(new Paragraph({
          indent: { left: 720 },
          children: [new TextRun({ text: quoteMatch[1], italics: true, color: '666666' })],
        }));
        i++;
        continue;
      }

      if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
        paragraphs.push(new Paragraph({
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text: '—'.repeat(24), color: 'CCCCCC' })],
        }));
        i++;
        continue;
      }

      if (isMarkdownTableRow(trimmed)) {
        const tableLines = [];
        while (i < lines.length) {
          const rowTrimmed = lines[i].trim();
          if (!rowTrimmed || !isMarkdownTableRow(rowTrimmed)) break;
          tableLines.push(rowTrimmed);
          i++;
        }
        const dataRows = tableLines.filter((line) => !isMarkdownTableSeparator(line));
        if (dataRows.length) {
          paragraphs.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
          paragraphs.push(buildDocxTable(dataRows, docxLib));
          paragraphs.push(new Paragraph({ spacing: { before: 80 }, children: [] }));
        }
        continue;
      }

      paragraphs.push(new Paragraph({
        children: parseInlineMarkdown(trimmed, docxLib),
      }));
      i++;
    }

    return paragraphs;
  };

  const markdownToDocxParagraphs = (text, docxLib) => {
    const paragraphs = [];
    const segments = String(text || '').split(/(```[\s\S]*?```)/g);

    for (const seg of segments) {
      if (!seg.trim()) continue;
      if (seg.startsWith('```')) {
        const { lang, code } = parseFencedCodeBlock(seg);
        paragraphs.push(...buildDocxCodeBlockParagraphs(code, docxLib, lang || undefined));
        continue;
      }
      paragraphs.push(...processMarkdownLines(seg, docxLib));
    }

    return paragraphs;
  };

  const buildDocxRoleParagraph = (role, docxLib) => {
    const { Paragraph, TextRun } = docxLib;
    return new Paragraph({
      spacing: { before: 240, after: 80 },
      children: [new TextRun({ text: role, bold: true, size: 18, color: '666666', allCaps: true })],
    });
  };

  const buildDocxUserParagraphs = async (msg, docxLib) => {
    const { Paragraph, TextRun, ImageRun } = docxLib;
    const paragraphs = [buildDocxRoleParagraph('Bạn', docxLib)];

    if (msg.content && msg.content.trim()) {
      paragraphs.push(...markdownToDocxParagraphs(msg.content, docxLib));
    }

    for (const img of msg.images || []) {
      if (!img.dataUrl) continue;
      try {
        const imageData = await prepareDocxImage(img.dataUrl, DOCX_IMAGE_MAX_PX);
        paragraphs.push(new Paragraph({
          spacing: { before: 120, after: 120 },
          children: [
            new ImageRun({
              type: imageData.type,
              data: imageData.data,
              transformation: { width: imageData.width, height: imageData.height },
            }),
          ],
        }));
      } catch {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: '[' + (img.name || 'Hình ảnh') + ']', italics: true, color: '888888' })],
        }));
      }
    }

    for (const file of msg.files || []) {
      paragraphs.push(new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [
          new TextRun({ text: 'Tệp: ', bold: true }),
          new TextRun({ text: file.name || 'file' }),
          new TextRun({ text: ' (' + window.Files.formatSize(file.size || 0) + ')', color: '888888' }),
        ],
      }));
      if (file.content && file.content.trim()) {
        paragraphs.push(...buildDocxCodeBlockParagraphs(file.content, docxLib));
      }
    }

    return paragraphs;
  };

  const buildDocxAssistantParagraphs = (msg, docxLib) => {
    const content = window.Conversations.getAssistantContent(msg);
    if (!content || !content.trim()) return [];
    return [
      buildDocxRoleParagraph('Trợ lý', docxLib),
      ...markdownToDocxParagraphs(content, docxLib),
    ];
  };

  const exportToDocx = async (convo) => {
    if (!window.docx) throw new Error('Thư viện docx chưa tải');

    const messages = filterExportMessages(convo);
    if (!messages.length) throw new Error('Không có tin nhắn để xuất');

    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = window.docx;
    const children = [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 240 },
        children: [new TextRun({ text: convo.title || 'Cuộc trò chuyện', bold: true })],
      }),
    ];

    for (const msg of messages) {
      if (msg.role === 'user') {
        children.push(...await buildDocxUserParagraphs(msg, window.docx));
      } else {
        children.push(...buildDocxAssistantParagraphs(msg, window.docx));
      }
    }

    const doc = new Document({
      title: convo.title || 'Cuộc trò chuyện',
      sections: [{
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children,
      }],
    });

    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, exportSafeName(convo.title) + '.docx');
  };

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Không đọc được file ảnh'));
    reader.readAsDataURL(file);
  });

  return {
    escapeHTML, formatTime, uuid, debounce, normalizeSearchQuery, normalizeSearchText,
    buildSearchFold, includesSearchFold, findSearchRangeInFold, buildSearchSnippet,
    includesSearch, findSearchRange, highlightSearchText,
    copyToClipboard, copyImageToClipboard, downloadDataUrlImage, truncate, autoResize,
    formatConversation, formatConversationPlainText,
    downloadFile, downloadBlob, exportToDocx, readFileAsDataUrl
  };
})();
