window.XlsxExport = (() => {
  const EXCEL_INSTRUCTION = [
    'Bạn là chuyên gia tạo bảng tính Excel.',
    'Người dùng mô tả dữ liệu/báo cáo cần tạo file Excel.',
    '',
    'Trả lời theo format:',
    '1. Một đoạn mô tả ngắn (2-3 câu) về file Excel.',
    '2. Một khối code JSON hợp lệ (```json ... ```) theo schema:',
    '',
    '{',
    '  "title": "Tên file Excel",',
    '  "sheets": [',
    '    {',
    '      "name": "Tên sheet",',
    '      "headers": ["Cột 1", "Cột 2", "Cột 3"],',
    '      "rows": [',
    '        ["Giá trị 1", 100, "Ghi chú"],',
    '        ["Giá trị 2", 200, "Ghi chú"]',
    '      ]',
    '    }',
    '  ]',
    '}',
    '',
    'Quy tắc:',
    '- Có thể có 1 hoặc nhiều sheet.',
    '- "headers" là hàng tiêu đề; "rows" là các hàng dữ liệu (không lặp header).',
    '- Số giữ nguyên kiểu number, không bọc chuỗi nếu là số.',
    '- Tên sheet tối đa 31 ký tự, không chứa: \\ / ? * [ ]',
    '- JSON phải parse được, không có comment.',
    '- Ngôn ngữ nội dung theo ngôn ngữ người dùng nhập.',
  ].join('\n');

  const sanitizeFilename = (name) => {
    const base = String(name || 'spreadsheet')
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
    return base || 'spreadsheet';
  };

  const sanitizeSheetName = (name, index) => {
    const cleaned = String(name || 'Sheet' + (index + 1))
      .replace(/[\\/?*[\]:]/g, '')
      .trim()
      .slice(0, 31);
    return cleaned || 'Sheet' + (index + 1);
  };

  const buildFilename = (data) => sanitizeFilename(data?.title) + '.xlsx';

  const tryParseJson = (raw) => {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const toCellValue = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    return String(value);
  };

  const sheetToAoa = (sheet) => {
    const headers = Array.isArray(sheet.headers) ? sheet.headers.map(toCellValue) : [];
    const rows = Array.isArray(sheet.rows)
      ? sheet.rows.map((row) => (Array.isArray(row) ? row.map(toCellValue) : [toCellValue(row)]))
      : [];

    if (headers.length) return [headers, ...rows];
    if (rows.length) return rows;
    return [['']];
  };

  const normalizeExcelData = (parsed) => {
    if (!parsed || typeof parsed !== 'object') return null;
    const sheets = Array.isArray(parsed.sheets) ? parsed.sheets : null;
    if (!sheets || !sheets.length) return null;

    const normalizedSheets = sheets
      .map((sheet, index) => {
        if (!sheet || typeof sheet !== 'object') return null;
        const aoa = sheetToAoa(sheet);
        if (!aoa.length) return null;
        return {
          name: sanitizeSheetName(sheet.name, index),
          rows: aoa,
          rowCount: aoa.length,
          colCount: Math.max(...aoa.map((row) => row.length), 1),
        };
      })
      .filter(Boolean);

    if (!normalizedSheets.length) return null;

    const title = String(parsed.title || normalizedSheets[0]?.name || 'Spreadsheet').trim();
    return {
      title,
      sheets: normalizedSheets,
      sheetCount: normalizedSheets.length,
      totalRows: normalizedSheets.reduce((sum, s) => sum + s.rowCount, 0),
    };
  };

  const extractExcelData = (text) => {
    const source = String(text || '');
    if (!source.trim()) return null;

    const fenced = source.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      const parsed = tryParseJson(fenced[1].trim());
      const normalized = normalizeExcelData(parsed);
      if (normalized) return normalized;
    }

    const objectMatch = source.match(/\{[\s\S]*"sheets"\s*:\s*\[[\s\S]*\][\s\S]*\}/);
    if (objectMatch) {
      const parsed = tryParseJson(objectMatch[0]);
      const normalized = normalizeExcelData(parsed);
      if (normalized) return normalized;
    }

    return null;
  };

  const generateXlsx = async (data) => {
    const XLSX = window.XLSX;
    if (!XLSX) throw new Error('SheetJS chưa tải');

    const normalized = normalizeExcelData(data);
    if (!normalized) throw new Error('Dữ liệu Excel không hợp lệ');

    const workbook = XLSX.utils.book_new();
    normalized.sheets.forEach((sheet) => {
      const worksheet = XLSX.utils.aoa_to_sheet(sheet.rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    });

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    return {
      blob,
      filename: buildFilename(normalized),
      sheetCount: normalized.sheetCount,
      totalRows: normalized.totalRows,
      title: normalized.title,
    };
  };

  const appendExcelInstruction = (text, m) => {
    if (!m.excel) return text || '';
    const userText = text || '';
    return userText
      ? EXCEL_INSTRUCTION + '\n\n---\n\n' + userText
      : EXCEL_INSTRUCTION;
  };

  return {
    EXCEL_INSTRUCTION,
    extractExcelData,
    generateXlsx,
    buildFilename,
    appendExcelInstruction,
  };
})();
