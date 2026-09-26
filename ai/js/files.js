window.Files = (() => {
  const {
    ACCEPTED_IMAGE_TYPES,
    ACCEPTED_FILE_EXTENSIONS,
    CODE_FILE_EXTENSIONS,
    FILE_EXTENSION_LANGUAGES
  } = window.APP_CONFIG;

  const MAX_FILE_BYTES = 100 * 1024 * 1024;
  const MAX_PDF_PAGES = 80;
  const MAX_XLSX_SHEETS = 30;
  const MAX_CONTENT_CHARS = 120000;
  const PDFJS_BASE = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/';

  const getExtension = (name) => {
    const idx = name.lastIndexOf('.');
    return idx >= 0 ? name.slice(idx).toLowerCase() : '';
  };

  const getKind = (file) => {
    if (ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'image';
    const ext = getExtension(file.name);
    if (ACCEPTED_FILE_EXTENSIONS.includes(ext)) return 'document';
    if (file.type === 'application/pdf') return 'document';
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'document';
    if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'document';
    if (file.type.startsWith('text/')) return 'document';
    return null;
  };

  const decodeTextBuffer = (buf) => {
    const bytes = new Uint8Array(buf);
    if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
      return new TextDecoder('utf-8').decode(bytes.subarray(3));
    }
    if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
      return new TextDecoder('utf-16le').decode(bytes.subarray(2));
    }
    if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
      return new TextDecoder('utf-16be').decode(bytes.subarray(2));
    }

    const sampleLen = Math.min(bytes.length, 4000);
    if (sampleLen >= 8) {
      let nulEven = 0;
      let nulOdd = 0;
      for (let i = 0; i < sampleLen; i++) {
        if (bytes[i] !== 0) continue;
        if (i % 2 === 0) nulEven++;
        else nulOdd++;
      }
      const pairs = Math.floor(sampleLen / 2);
      if (nulOdd / pairs > 0.3) return new TextDecoder('utf-16le').decode(bytes);
      if (nulEven / pairs > 0.3) return new TextDecoder('utf-16be').decode(bytes);
    }

    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      return new TextDecoder('windows-1258').decode(bytes);
    }
  };

  const readTextFile = async (file) => decodeTextBuffer(await file.arrayBuffer());

  const capContent = (text, note) => {
    if (text.length <= MAX_CONTENT_CHARS) return text;
    const omitted = text.length - MAX_CONTENT_CHARS;
    const suffix = '\n\n[' + (note || 'Nội dung bị cắt') + ': bỏ ' + omitted + ' ký tự cuối]';
    return text.slice(0, MAX_CONTENT_CHARS) + suffix;
  };

  const assertFileSize = (file) => {
    if (!file.size) throw new Error('File rỗng');
    if (file.size > MAX_FILE_BYTES) {
      throw new Error('File vượt quá 100 MB');
    }
  };

  const ensurePdfWorker = () => {
    if (!window.pdfjsLib) return;
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_BASE + 'build/pdf.worker.min.js';
  };

  const isPdfPasswordError = (err) => {
    const name = err && err.name;
    if (name === 'PasswordException') return true;
    return /password/i.test(String(err && err.message || ''));
  };

  const extractPdfText = async (file) => {
    if (!window.pdfjsLib) throw new Error('PDF.js chưa tải');
    ensurePdfWorker();
    const data = new Uint8Array(await file.arrayBuffer());
    const task = pdfjsLib.getDocument({
      data,
      cMapUrl: PDFJS_BASE + 'cmaps/',
      cMapPacked: true,
      standardFontDataUrl: PDFJS_BASE + 'standard_fonts/'
    });
    let pdf;
    try {
      pdf = await task.promise;
      const pageCount = pdf.numPages;
      const limit = Math.min(pageCount, MAX_PDF_PAGES);
      const chunks = [];
      for (let i = 1; i <= limit; i++) {
        const page = await pdf.getPage(i);
        try {
          const tc = await page.getTextContent();
          chunks.push(tc.items.map((x) => x.str).join(' '));
        } finally {
          page.cleanup();
        }
      }
      let text = chunks.join('\n\n').trim();
      if (!text) {
        throw new Error('PDF không có lớp chữ (có thể là bản scan). Chưa hỗ trợ OCR');
      }
      if (pageCount > limit) {
        text += '\n\n[Chỉ đọc ' + limit + '/' + pageCount + ' trang đầu]';
      }
      return text;
    } catch (err) {
      if (isPdfPasswordError(err)) throw new Error('PDF được bảo vệ bằng mật khẩu');
      throw err;
    } finally {
      if (pdf) {
        try { await pdf.destroy(); } catch { /* ignore */ }
      } else {
        try { await task.destroy(); } catch { /* ignore */ }
      }
    }
  };

  const extractDocxText = async (file) => {
    if (!window.mammoth) throw new Error('Mammoth chưa tải');
    const buf = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buf });
    return result.value;
  };

  const formatExcelCell = (value) => {
    if (value instanceof Date && !isNaN(value.getTime())) {
      const local = new Date(value.getTime() + value.getTimezoneOffset() * 60000);
      const y = local.getFullYear();
      const m = String(local.getMonth() + 1).padStart(2, '0');
      const d = String(local.getDate()).padStart(2, '0');
      const hh = local.getHours();
      const mm = local.getMinutes();
      const ss = local.getSeconds();
      if (!hh && !mm && !ss) return y + '-' + m + '-' + d;
      return y + '-' + m + '-' + d + ' ' + String(hh).padStart(2, '0')
        + ':' + String(mm).padStart(2, '0')
        + ':' + String(ss).padStart(2, '0');
    }
    return value == null ? '' : String(value);
  };

  const extractXlsxText = async (file) => {
    if (!window.XLSX) throw new Error('SheetJS chưa tải');
    const buf = await file.arrayBuffer();
    const workbook = XLSX.read(buf, { type: 'array', cellDates: true });
    if (!workbook.SheetNames?.length) {
      throw new Error('File Excel không có sheet');
    }

    const names = workbook.SheetNames.slice(0, MAX_XLSX_SHEETS);
    const parts = [];
    for (const sheetName of names) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;
      for (const addr of Object.keys(sheet)) {
        if (addr.charAt(0) === '!') continue;
        const cell = sheet[addr];
        if (!cell || !(cell.v instanceof Date) || isNaN(cell.v.getTime())) continue;
        const formatted = formatExcelCell(cell.v);
        cell.t = 's';
        cell.v = formatted;
        cell.w = formatted;
      }
      const csv = XLSX.utils.sheet_to_csv(sheet).trim();
      if (!csv) continue;
      parts.push('## Sheet: ' + sheetName + '\n' + csv);
    }

    if (!parts.length) {
      throw new Error('File Excel không có nội dung đọc được');
    }
    let text = parts.join('\n\n');
    if (workbook.SheetNames.length > names.length) {
      text += '\n\n[Chỉ đọc ' + names.length + '/' + workbook.SheetNames.length + ' sheet đầu]';
    }
    return text;
  };

  const extractRtfText = async (file) => {
    let raw = await readTextFile(file);
    if (!/\\rtf1?\b/.test(raw)) return raw;
    raw = raw
      .replace(/\\u(-?\d+)\??/g, (_, n) => {
        let code = parseInt(n, 10);
        if (code < 0) code += 65536;
        return String.fromCharCode(code);
      })
      .replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/\\par[d]?/g, '\n')
      .replace(/\\line/g, '\n')
      .replace(/\\tab/g, '\t')
      .replace(/\\[a-zA-Z]+-?\d* ?/g, '')
      .replace(/[{}]/g, '')
      .replace(/\\\\/g, '\\');
    return raw;
  };

  const extractContent = async (file) => {
    assertFileSize(file);
    const ext = getExtension(file.name);
    let text;
    if (ext === '.pdf' || file.type === 'application/pdf') {
      text = await extractPdfText(file);
    } else if (
      ext === '.docx'
      || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      text = await extractDocxText(file);
    } else if (
      ext === '.xlsx'
      || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      text = await extractXlsxText(file);
    } else if (ext === '.rtf' || file.type === 'application/rtf' || file.type === 'text/rtf') {
      text = await extractRtfText(file);
    } else {
      text = await readTextFile(file);
    }
    text = String(text || '').replace(/\u0000/g, '').trim();
    if (!text) throw new Error('File không có nội dung đọc được');
    return capContent(text);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getCodeLanguage = (name) => FILE_EXTENSION_LANGUAGES[getExtension(name)] || null;

  const formatFileMarkdown = (file, labelPrefix = 'Tệp đính kèm') => {
    const lang = getCodeLanguage(file.name);
    const content = file.content || '';
    let fenceLen = 3;
    const ticks = content.match(/`{3,}/g);
    if (ticks) {
      for (const run of ticks) fenceLen = Math.max(fenceLen, run.length + 1);
    }
    const fence = '`'.repeat(fenceLen);
    const open = lang ? fence + lang : fence;
    return '**' + labelPrefix + ': ' + file.name + '**\n' + open + '\n' + content + '\n' + fence;
  };

  const getIconClass = (name) => {
    const ext = getExtension(name);
    if (ext === '.pdf') return 'fa-file-pdf';
    if (ext === '.csv') return 'fa-file-csv';
    if (ext === '.xlsx') return 'fa-file-excel';
    if (CODE_FILE_EXTENSIONS.includes(ext)) return 'fa-file-code';
    if (['.doc', '.docx'].includes(ext)) return 'fa-file-word';
    return 'fa-file-lines';
  };

  return {
    getKind,
    getExtension,
    extractContent,
    formatSize,
    getIconClass,
    getCodeLanguage,
    formatFileMarkdown
  };
})();
