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

  // Excel: tên sheet phải duy nhất (không phân biệt hoa/thường) và tối đa 31 ký tự.
  // book_append_sheet sẽ THROW nếu trùng — nên phải khử trùng trước.
  const dedupeSheetName = (name, used) => {
    let candidate = name;
    let n = 2;
    while (used.has(candidate.toLowerCase())) {
      const suffix = ' (' + n + ')';
      candidate = name.slice(0, 31 - suffix.length) + suffix;
      n += 1;
    }
    used.add(candidate.toLowerCase());
    return candidate;
  };

  const buildFilename = (data) => sanitizeFilename(data?.title) + '.xlsx';

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

  const MAX_SHEETS = 50;
  const MAX_ROWS_PER_SHEET = 50000;

  const normalizeExcelData = (parsed) => {
    if (!parsed || typeof parsed !== 'object') return null;
    let sheets = Array.isArray(parsed.sheets) ? parsed.sheets : null;
    if (!sheets || !sheets.length) return null;
    if (sheets.length > MAX_SHEETS) {
      console.warn('[XlsxExport] Cắt bớt sheet: ' + sheets.length + ' -> ' + MAX_SHEETS);
      sheets = sheets.slice(0, MAX_SHEETS);
    }

    const usedNames = new Set();
    const normalizedSheets = sheets
      .map((sheet, index) => {
        if (!sheet || typeof sheet !== 'object') return null;
        let aoa = sheetToAoa(sheet);
        if (!aoa.length) return null;
        if (aoa.length > MAX_ROWS_PER_SHEET) {
          console.warn('[XlsxExport] Cắt bớt hàng ở sheet ' + index + ': ' + aoa.length + ' -> ' + MAX_ROWS_PER_SHEET);
          aoa = aoa.slice(0, MAX_ROWS_PER_SHEET);
        }
        return {
          name: dedupeSheetName(sanitizeSheetName(sheet.name, index), usedNames),
          rows: aoa,
          rowCount: aoa.length,
          colCount: aoa.reduce((max, row) => Math.max(max, row.length), 1),
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
    for (const parsed of window.Utils.extractJsonCandidates(text)) {
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
