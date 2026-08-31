const FileParser = {
  SUPPORTED_EXTENSIONS: ['txt', 'pdf', 'docx', 'pptx', 'xlsx'],
  DRAWING_NS: 'http://schemas.openxmlformats.org/drawingml/2006/main',
  SHEET_NS: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
  // OCR is slow (seconds per page) — cap it so a huge scanned PDF can't
  // run forever. Pages beyond the cap are skipped (the UI warns about it).
  OCR_MAX_PAGES: 20,
  // Rendered pages must stay under the browser's canvas dimension cap —
  // an oversized page (A0 scan, blueprint) at 2x would fail to render.
  OCR_MAX_CANVAS_DIM: 4096,

  // Returns { text, pages: string[] | null, numPages?: number }
  // `pages` is the per-page text for PDFs (enables page-range selection);
  // null for txt/docx. onProgress({stage, current, total}) is called as
  // pages are processed. `signal` (AbortSignal) cancels PDF extraction
  // between pages.
  async parseFile(file, { onProgress, signal } = {}) {
    if (!file.name.includes('.')) {
      throw new Error('File has no extension. Supported types: .pdf, .docx, .pptx, .xlsx, .txt');
    }

    const extension = file.name.split('.').pop().toLowerCase();

    if (!this.SUPPORTED_EXTENSIONS.includes(extension)) {
      throw new Error(`Unsupported file type: .${extension}. Supported types: .pdf, .docx, .pptx, .xlsx, .txt`);
    }

    if (file.size === 0) {
      throw new Error('This file is empty.');
    }

    if (extension === 'txt') {
      return { text: await this._parseTxt(file), pages: null };
    } else if (extension === 'pdf') {
      return this._parsePdf(file, onProgress, signal);
    } else if (extension === 'docx') {
      const { text, imageCount } = await this._parseDocx(file);
      return { text, pages: null, imageCount };
    } else if (extension === 'pptx') {
      const { text, imageCount } = await this._parsePptx(file);
      return { text, pages: null, imageCount };
    } else {
      const { text, imageCount } = await this._parseXlsx(file);
      return { text, pages: null, imageCount };
    }
  },

  _throwIfAborted(signal) {
    if (signal?.aborted) {
      const err = new Error('Cancelled.');
      err.cancelled = true;
      throw err;
    }
  },

  // Join a 1-based inclusive page range of a pages array into one text,
  // clamping the range to valid bounds.
  joinPages(pages, from, to) {
    const f = Math.max(1, Math.min(from, pages.length));
    const t = Math.max(f, Math.min(to, pages.length));
    return pages.slice(f - 1, t).join('\n\n').trim();
  },

  // Map an app language name to a Tesseract language code. For 'auto' /
  // unknown we use eng+vie: this app's primary language pair, and
  // Latin-script OCR of most other languages still works with 'eng'.
  tesseractLangFor(appLang) {
    const map = {
      English: 'eng', Vietnamese: 'vie', Japanese: 'jpn', Korean: 'kor',
      Chinese: 'chi_sim', French: 'fra', German: 'deu', Spanish: 'spa',
      Russian: 'rus', Thai: 'tha', Arabic: 'ara', Portuguese: 'por',
      Italian: 'ita'
    };
    if (!appLang || appLang === 'auto') return 'eng+vie';
    return map[appLang] || 'eng';
  },

  _readAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result));
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsArrayBuffer(file);
    });
  },

  _parseTxt(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = this._decodeText(reader.result);
        // Binary files misnamed as .txt decode to a wall of replacement/
        // control characters — surface that instead of feeding garbage
        // into the translator.
        if (this._looksBinary(text)) {
          reject(new Error('This file does not appear to be plain text. It may be corrupted or in an unsupported encoding.'));
          return;
        }
        resolve(text);
      };
      reader.onerror = () => reject(new Error('Failed to read text file.'));
      reader.readAsArrayBuffer(file);
    });
  },

  // Decode a text file honoring a BOM when present. UTF-16 LE/BE files
  // (common from Windows Notepad's "Unicode" save) would otherwise decode
  // as garbage under UTF-8 and trip the binary check. Without a BOM,
  // assume UTF-8 (TextDecoder strips a UTF-8 BOM itself).
  _decodeText(buffer) {
    const bytes = new Uint8Array(buffer);
    if (bytes.length >= 2) {
      if (bytes[0] === 0xFF && bytes[1] === 0xFE) {
        return new TextDecoder('utf-16le').decode(bytes.subarray(2));
      }
      if (bytes[0] === 0xFE && bytes[1] === 0xFF) {
        return new TextDecoder('utf-16be').decode(bytes.subarray(2));
      }
    }
    return new TextDecoder('utf-8').decode(bytes);
  },

  _looksBinary(text) {
    if (!text) return false;
    const sample = text.slice(0, 2000);
    if (!sample.length) return false;
    // eslint-disable-next-line no-control-regex
    const controlChars = sample.match(/[\x00-\x08\x0E-\x1F�]/g);
    return !!controlChars && controlChars.length / sample.length > 0.05;
  },

  async _parsePdf(file, onProgress, signal) {
    const pdf = await this._openPdf(file);

    try {
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        this._throwIfAborted(signal);
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        pages.push(this._reconstructPageText(content.items));
        if (onProgress) {
          onProgress({ stage: 'extract', current: i, total: pdf.numPages });
        }
      }

      return { text: pages.join('\n\n').trim(), pages, numPages: pdf.numPages };
    } finally {
      // Release the pdf.js worker + buffers — without this every opened
      // PDF stays in memory for the lifetime of the page.
      pdf.destroy().catch(() => {});
    }
  },

  // OCR a scanned PDF: render each page to a canvas via pdf.js and run
  // Tesseract over it. Heavy (loads several MB of OCR data on first use,
  // then seconds per page) — always user-initiated.
  // Options: from/to — 1-based inclusive page range, capped at
  // OCR_MAX_PAGES per run; signal — AbortSignal (between pages, and
  // mid-page by terminating the Tesseract worker).
  // Returns { text, pages, numPages, from, to, truncated } where
  // `truncated` means the PDF has pages beyond the processed range.
  async ocrPdf(file, { onProgress, langCode, from, to, signal } = {}) {
    await this._loadTesseract();
    this._throwIfAborted(signal);

    const pdf = await this._openPdf(file);
    // Clamp the requested range, then cap it at OCR_MAX_PAGES per run.
    const first = Math.max(1, Math.min(from || 1, pdf.numPages));
    const last = Math.max(first,
      Math.min(to || pdf.numPages, pdf.numPages, first + this.OCR_MAX_PAGES - 1));

    const worker = await Tesseract.createWorker(langCode || this.tesseractLangFor('auto'));
    // Mid-page cancellation: aborting terminates the worker, which rejects
    // the in-flight recognize() promise.
    const onAbort = () => worker.terminate();
    if (signal) signal.addEventListener('abort', onAbort, { once: true });
    try {
      const pages = [];
      for (let i = first; i <= last; i++) {
        this._throwIfAborted(signal);
        const page = await pdf.getPage(i);
        // 2x scale noticeably improves OCR accuracy on small fonts; very
        // large pages are scaled down to stay under the canvas cap.
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(2,
          this.OCR_MAX_CANVAS_DIM / Math.max(baseViewport.width, baseViewport.height));
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ocrCtx = canvas.getContext('2d');
        // A page with no background fill renders transparent, which
        // Tesseract effectively reads as black — wrecking recognition.
        ocrCtx.fillStyle = '#ffffff';
        ocrCtx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ocrCtx, viewport, background: '#ffffff' }).promise;

        const result = await worker.recognize(canvas);
        pages.push((result.data.text || '').trim());
        canvas.width = canvas.height = 0; // release the bitmap promptly
        if (onProgress) {
          onProgress({ stage: 'ocr', current: i - first + 1, total: last - first + 1 });
        }
      }

      return {
        text: pages.join('\n\n').trim(),
        pages,
        numPages: pdf.numPages,
        from: first,
        to: last,
        truncated: last < pdf.numPages
      };
    } catch (err) {
      // A worker killed by the abort listener rejects with a generic
      // error — surface it as a clean cancellation instead.
      this._throwIfAborted(signal);
      throw err;
    } finally {
      if (signal) signal.removeEventListener('abort', onAbort);
      await worker.terminate().catch(() => {});
      pdf.destroy().catch(() => {});
    }
  },

  // Tesseract.js (~2MB core + language data) is only fetched when the
  // user actually runs OCR on a scanned PDF.
  _loadTesseract() {
    if (window.Tesseract) return Promise.resolve();
    if (!this._tesseractPromise) {
      this._tesseractPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        script.onload = () => resolve();
        script.onerror = () => {
          this._tesseractPromise = null; // allow retry
          reject(new Error('Failed to load the OCR library. Check your internet connection and try again.'));
        };
        document.head.appendChild(script);
      });
    }
    return this._tesseractPromise;
  },

  async _openPdf(file) {
    const data = await this._readAsArrayBuffer(file);

    if (typeof pdfjsLib === 'undefined') {
      throw new Error('PDF.js library not loaded. Please refresh the page.');
    }

    if (!this._workerConfigured) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      this._workerConfigured = true;
    }

    try {
      return await pdfjsLib.getDocument({ data }).promise;
    } catch (err) {
      if (err.name === 'PasswordException') {
        throw new Error('This PDF is password-protected. Please remove the password and try again.');
      }
      throw new Error('Failed to open PDF. The file may be corrupted or not a valid PDF.');
    }
  },

  // Reconstruct readable text from PDF.js text items, restoring line
  // breaks and paragraph gaps based on item Y position (item.str alone
  // has no whitespace info, so naive joining collapses everything to
  // one line and destroys the structure the translator is asked to preserve).
  _reconstructPageText(items) {
    if (!items.length) return '';

    const lines = [];
    let currentLine = [];
    let lastY = null;
    let lastLineHeight = null;

    for (const item of items) {
      const y = item.transform[5];
      const height = item.height || Math.abs(item.transform[3]) || 1;

      if (lastY === null) {
        currentLine.push(item.str);
      } else {
        const yDiff = Math.abs(lastY - y);
        const threshold = (lastLineHeight || height) * 0.5;

        if (yDiff > threshold) {
          lines.push(currentLine.join(''));
          // A gap much bigger than one line height signals a paragraph break
          if (yDiff > (lastLineHeight || height) * 1.8) {
            lines.push('');
          }
          currentLine = [item.str];
        } else {
          const needsSpace = currentLine.length > 0 &&
            !/\s$/.test(currentLine[currentLine.length - 1]) &&
            !/^\s/.test(item.str);
          currentLine.push(needsSpace ? ' ' + item.str : item.str);
        }
      }

      lastY = y;
      lastLineHeight = height;
    }

    if (currentLine.length) lines.push(currentLine.join(''));

    return lines
      .map(line => line.replace(/[ \t]+/g, ' ').trimEnd())
      .join('\n');
  },

  async _parseDocx(file) {
    const text = await new Promise((resolve, reject) => {
      if (typeof mammoth === 'undefined') {
        reject(new Error('Mammoth.js library not loaded. Please refresh the page.'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        mammoth.extractRawText({ arrayBuffer: event.target.result })
          .then(result => resolve(result.value))
          .catch(() => reject(new Error('Failed to parse DOCX. The file may be corrupted, encrypted, or not a valid .docx document.')));
      };
      reader.onerror = () => reject(new Error('Failed to read DOCX file.'));
      reader.readAsArrayBuffer(file);
    });

    // Image-only DOCX: mammoth returns empty text. Detect embedded images
    // so the UI can offer the image-translation path instead of a dead
    // end. The extra unzip only runs for textless files — the common path
    // stays on mammoth alone.
    let imageCount = 0;
    if (!text.trim()) {
      try {
        const zip = await this._openOfficeZip(file, 'DOCX');
        imageCount = this._countOfficeImages(zip);
      } catch { /* keep the plain "no text" outcome */ }
    }
    return { text, imageCount };
  },

  // JSZip (~100KB) is needed to unzip PPTX/XLSX (both are ZIP+XML, like
  // DOCX) — lazy-loaded from the CDN on first use, same pattern as the
  // Tesseract loader above.
  _loadJsZip() {
    if (window.JSZip) return Promise.resolve();
    if (!this._jsZipPromise) {
      this._jsZipPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
        script.onload = () => resolve();
        script.onerror = () => {
          this._jsZipPromise = null; // allow retry
          reject(new Error('Failed to load the Office parser library. Check your internet connection and try again.'));
        };
        document.head.appendChild(script);
      });
    }
    return this._jsZipPromise;
  },

  async _openOfficeZip(file, label) {
    await this._loadJsZip();
    const data = await this._readAsArrayBuffer(file);
    try {
      return await JSZip.loadAsync(data);
    } catch {
      throw new Error(`Failed to open ${label}. The file may be corrupted or not a valid .${label.toLowerCase()} document.`);
    }
  },

  // Parse one XML part from an Office ZIP; returns null when the part is
  // missing or malformed (callers decide whether that's fatal).
  async _parseXmlPart(zip, name) {
    const partFile = zip.file(name);
    if (!partFile) return null;
    const xmlDoc = new DOMParser().parseFromString(await partFile.async('string'), 'application/xml');
    return xmlDoc.getElementsByTagName('parsererror').length ? null : xmlDoc;
  },

  // PPTX text lives in ppt/slides/slideN.xml as <a:t> runs inside <a:p>
  // paragraphs (DrawingML). Extract slide-by-slide, in slide order.
  async _parsePptx(file) {
    const zip = await this._openOfficeZip(file, 'PPTX');
    const slideNames = Object.keys(zip.files)
      .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => this._partNumber(a) - this._partNumber(b));

    const slides = [];
    for (const name of slideNames) {
      const xmlDoc = await this._parseXmlPart(zip, name);
      if (!xmlDoc) continue;
      const lines = [];
      for (const p of xmlDoc.getElementsByTagNameNS(this.DRAWING_NS, 'p')) {
        const line = [...p.getElementsByTagNameNS(this.DRAWING_NS, 't')]
          .map(t => t.textContent).join('').trim();
        if (line) lines.push(line);
      }
      slides.push(lines.join('\n'));
    }
    return { text: slides.filter(s => s).join('\n\n').trim(), imageCount: this._countOfficeImages(zip) };
  },

  // XLSX text lives in xl/sharedStrings.xml as <si> items (each with one
  // or more <t> runs). Cell positions across sheets are NOT recoverable
  // from sharedStrings alone, so the plain-text path returns the unique
  // strings in document order — use the keep-format export to translate
  // the workbook in place with full fidelity.
  async _parseXlsx(file) {
    const zip = await this._openOfficeZip(file, 'XLSX');
    const xmlDoc = await this._parseXmlPart(zip, 'xl/sharedStrings.xml');
    const strings = [];
    if (xmlDoc) {
      for (const si of xmlDoc.getElementsByTagNameNS(this.SHEET_NS, 'si')) {
        const text = [...si.getElementsByTagNameNS(this.SHEET_NS, 't')]
          .map(t => t.textContent).join('').trim();
        if (text) strings.push(text);
      }
    }
    return { text: strings.join('\n'), imageCount: this._countOfficeImages(zip) };
  },

  // Count OCR-translatable raster images embedded in an Office ZIP
  // (matches the set ImageTranslator can process).
  _countOfficeImages(zip) {
    return Object.keys(zip.files)
      .filter(name => /^(word|ppt|xl)\/media\//.test(name) && /\.(png|jpe?g|webp)$/i.test(name))
      .length;
  },

  // Extract the trailing number of a part name (slide2.xml → 2) so slide
  // parts sort numerically instead of lexicographically (slide10 after
  // slide9, not after slide1).
  _partNumber(name) {
    const m = name.match(/(\d+)\.xml$/);
    return m ? parseInt(m[1], 10) : 0;
  }
};
