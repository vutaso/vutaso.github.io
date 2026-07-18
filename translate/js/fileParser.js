const FileParser = {
  SUPPORTED_EXTENSIONS: ['txt', 'pdf', 'docx'],
  // OCR is slow (seconds per page) — cap it so a huge scanned PDF can't
  // run forever. Pages beyond the cap are skipped (the UI warns about it).
  OCR_MAX_PAGES: 20,

  // Returns { text, pages: string[] | null, numPages?: number }
  // `pages` is the per-page text for PDFs (enables page-range selection);
  // null for txt/docx. onProgress({stage, current, total}) is called as
  // pages are processed.
  async parseFile(file, { onProgress } = {}) {
    if (!file.name.includes('.')) {
      throw new Error('File has no extension. Supported types: .pdf, .docx, .txt');
    }

    const extension = file.name.split('.').pop().toLowerCase();

    if (!this.SUPPORTED_EXTENSIONS.includes(extension)) {
      throw new Error(`Unsupported file type: .${extension}. Supported types: .pdf, .docx, .txt`);
    }

    if (file.size === 0) {
      throw new Error('This file is empty.');
    }

    if (extension === 'txt') {
      return { text: await this._parseTxt(file), pages: null };
    } else if (extension === 'pdf') {
      return this._parsePdf(file, onProgress);
    } else {
      return { text: await this._parseDocx(file), pages: null };
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
        const text = reader.result;
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
      reader.readAsText(file, 'UTF-8');
    });
  },

  _looksBinary(text) {
    if (!text) return false;
    const sample = text.slice(0, 2000);
    if (!sample.length) return false;
    // eslint-disable-next-line no-control-regex
    const controlChars = sample.match(/[\x00-\x08\x0E-\x1F�]/g);
    return !!controlChars && controlChars.length / sample.length > 0.05;
  },

  async _parsePdf(file, onProgress) {
    const pdf = await this._openPdf(file);

    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pages.push(this._reconstructPageText(content.items));
      if (onProgress) {
        onProgress({ stage: 'extract', current: i, total: pdf.numPages });
      }
    }

    return { text: pages.join('\n\n').trim(), pages, numPages: pdf.numPages };
  },

  // OCR a scanned PDF: render each page to a canvas via pdf.js and run
  // Tesseract over it. Heavy (loads several MB of OCR data on first use,
  // then seconds per page) — always user-initiated.
  async ocrPdf(file, { onProgress, langCode } = {}) {
    await this._loadTesseract();

    const pdf = await this._openPdf(file);
    const total = Math.min(pdf.numPages, this.OCR_MAX_PAGES);

    const worker = await Tesseract.createWorker(langCode || this.tesseractLangFor('auto'));
    try {
      const pages = [];
      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        // 2x scale noticeably improves OCR accuracy on small fonts
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

        const result = await worker.recognize(canvas);
        pages.push((result.data.text || '').trim());
        if (onProgress) {
          onProgress({ stage: 'ocr', current: i, total });
        }
      }

      return {
        text: pages.join('\n\n').trim(),
        pages,
        numPages: pdf.numPages,
        truncated: pdf.numPages > total
      };
    } finally {
      await worker.terminate();
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
    return new Promise((resolve, reject) => {
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
  }
};
