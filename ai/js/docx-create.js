window.DocxCreate = (() => {
  const DOCUMENT_INSTRUCTION = [
    'Bạn là chuyên gia soạn thảo văn bản Word chuyên nghiệp.',
    'Người dùng mô tả loại tài liệu và nội dung cần tạo file Word (.docx).',
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
    '    { "type": "code", "text": "console.log(1)", "lang": "javascript" }',
    '  ]',
    '}',
    '',
    'Quy tắc:',
    '- Types hỗ trợ: heading1, heading2, heading3, paragraph, bullet, numbered, table, quote, code.',
    '- Có thể dùng heading1/heading2/heading3 hoặc h1/h2/h3.',
    '- Tạo nội dung đầy đủ, có cấu trúc rõ ràng theo mô tả người dùng.',
    '- JSON phải parse được, không có comment.',
    '- Ngôn ngữ nội dung theo ngôn ngữ người dùng nhập.',
  ].join('\n');

  const DOCX_CODE_FONT = 'Courier New';
  const DOCX_CODE_SIZE = 20;
  const DOCX_PAGE_WIDTH_TWIPS = 12240;
  const DOCX_H_MARGIN_TWIPS = 720;

  const sanitizeFilename = (name) => {
    const base = String(name || 'document')
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
    return base || 'document';
  };

  const buildFilename = (data) => sanitizeFilename(data?.title) + '.docx';

  const tryParseJson = (raw) => {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const parseInlineMarkdown = (text, docxLib) => {
    const { TextRun, ShadingType } = docxLib;
    const runs = [];
    const parts = String(text || '').split(/(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g);
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

  const headingLevel = (type) => {
    const map = {
      heading1: 1, h1: 1,
      heading2: 2, h2: 2,
      heading3: 3, h3: 3,
      heading4: 4, h4: 4,
      heading5: 5, h5: 5,
      heading6: 6, h6: 6,
    };
    return map[String(type || '').toLowerCase()] || 0;
  };

  const normalizeDocumentData = (parsed) => {
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

  const extractDocumentData = (text) => {
    const source = String(text || '');
    if (!source.trim()) return null;

    const fenced = source.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      const parsed = tryParseJson(fenced[1].trim());
      const normalized = normalizeDocumentData(parsed);
      if (normalized) return normalized;
    }

    const objectMatch = source.match(/\{[\s\S]*"blocks"\s*:\s*\[[\s\S]*\][\s\S]*\}/);
    if (objectMatch) {
      const parsed = tryParseJson(objectMatch[0]);
      const normalized = normalizeDocumentData(parsed);
      if (normalized) return normalized;
    }

    return null;
  };

  const buildDocxTable = (headers, rows, docxLib) => {
    const {
      Table, TableRow, TableCell, Paragraph, WidthType, ShadingType, BorderStyle, TableLayoutType,
    } = docxLib;

    const dataRows = [];
    if (Array.isArray(headers) && headers.length) {
      dataRows.push(headers.map((cell) => String(cell ?? '')));
    }
    (Array.isArray(rows) ? rows : []).forEach((row) => {
      if (Array.isArray(row)) dataRows.push(row.map((cell) => String(cell ?? '')));
    });
    if (!dataRows.length) return null;

    const colCount = Math.max(1, ...dataRows.map((cells) => cells.length));
    const contentWidth = DOCX_PAGE_WIDTH_TWIPS - DOCX_H_MARGIN_TWIPS * 2;
    const colWidthTwips = Math.floor(contentWidth / colCount);
    const columnWidths = Array(colCount).fill(colWidthTwips);
    const cellBorders = {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    };

    const tableRows = dataRows.map((cells, rowIndex) => {
      const padded = cells.slice();
      while (padded.length < colCount) padded.push('');
      const isHeader = rowIndex === 0 && Array.isArray(headers) && headers.length > 0;

      return new TableRow({
        tableHeader: isHeader,
        children: padded.map((cellText) => new TableCell({
          width: { size: colWidthTwips, type: WidthType.DXA },
          borders: cellBorders,
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          shading: isHeader ? { fill: 'F0F4F8', type: ShadingType.CLEAR } : undefined,
          children: [new Paragraph({ children: parseInlineMarkdown(cellText, docxLib) })],
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

  const buildCodeParagraphs = (rawCode, docxLib, lang) => {
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

  const blockToChildren = (block, docxLib) => {
    const { Paragraph, HeadingLevel } = docxLib;
    const type = String(block?.type || 'paragraph').toLowerCase();
    const children = [];

    const level = headingLevel(type);
    if (level) {
      const headingMap = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
        4: HeadingLevel.HEADING_4,
        5: HeadingLevel.HEADING_5,
        6: HeadingLevel.HEADING_6,
      };
      children.push(new Paragraph({
        heading: headingMap[level] || HeadingLevel.HEADING_3,
        children: parseInlineMarkdown(block.text || '', docxLib),
      }));
      return children;
    }

    if (type === 'paragraph' || type === 'p') {
      children.push(new Paragraph({
        children: parseInlineMarkdown(block.text || '', docxLib),
      }));
      return children;
    }

    if (type === 'bullet' || type === 'ul') {
      const items = Array.isArray(block.items) ? block.items : [];
      items.forEach((item) => {
        children.push(new Paragraph({
          indent: { left: 360 },
          children: [
            new docxLib.TextRun({ text: '• ' }),
            ...parseInlineMarkdown(String(item ?? ''), docxLib),
          ],
        }));
      });
      return children;
    }

    if (type === 'numbered' || type === 'ol') {
      const items = Array.isArray(block.items) ? block.items : [];
      items.forEach((item, index) => {
        children.push(new Paragraph({
          children: [
            new docxLib.TextRun({ text: (index + 1) + '. ' }),
            ...parseInlineMarkdown(String(item ?? ''), docxLib),
          ],
        }));
      });
      return children;
    }

    if (type === 'quote' || type === 'blockquote') {
      children.push(new Paragraph({
        indent: { left: 720 },
        children: [new docxLib.TextRun({
          text: String(block.text || ''),
          italics: true,
          color: '666666',
        })],
      }));
      return children;
    }

    if (type === 'code' || type === 'pre') {
      children.push(...buildCodeParagraphs(block.text || '', docxLib, block.lang || block.language || ''));
      return children;
    }

    if (type === 'table') {
      const table = buildDocxTable(block.headers, block.rows, docxLib);
      if (table) {
        children.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
        children.push(table);
        children.push(new Paragraph({ spacing: { before: 80 }, children: [] }));
      }
      return children;
    }

    if (block.text) {
      children.push(new Paragraph({
        children: parseInlineMarkdown(block.text, docxLib),
      }));
    }

    return children;
  };

  const buildDocumentChildren = (data, docxLib) => {
    const children = [];
    for (const block of data.blocks) {
      children.push(...blockToChildren(block, docxLib));
    }
    return children;
  };

  const generateDocx = async (data) => {
    const docxLib = window.docx;
    if (!docxLib) throw new Error('Thư viện docx chưa tải');

    const normalized = normalizeDocumentData(data);
    if (!normalized) throw new Error('Dữ liệu tài liệu không hợp lệ');

    const { Document, Packer } = docxLib;
    const doc = new Document({
      title: normalized.title,
      sections: [{
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children: buildDocumentChildren(normalized, docxLib),
      }],
    });

    const blob = await Packer.toBlob(doc);
    return {
      blob,
      filename: buildFilename(normalized),
      blockCount: normalized.blockCount,
      title: normalized.title,
    };
  };

  const appendDocumentInstruction = (text, m) => {
    if (!m.document) return text || '';
    const userText = text || '';
    return userText
      ? DOCUMENT_INSTRUCTION + '\n\n---\n\n' + userText
      : DOCUMENT_INSTRUCTION;
  };

  return {
    DOCUMENT_INSTRUCTION,
    extractDocumentData,
    generateDocx,
    buildFilename,
    appendDocumentInstruction,
  };
})();
