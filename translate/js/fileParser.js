const FileParser = {
  SUPPORTED_EXTENSIONS: ['txt', 'pdf', 'docx'],

  async parseFile(file) {
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
      return this._parseTxt(file);
    } else if (extension === 'pdf') {
      return this._parsePdf(file);
    } else {
      return this._parseDocx(file);
    }
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

  async _parsePdf(file) {
    const data = await this._readAsArrayBuffer(file);

    if (typeof pdfjsLib === 'undefined') {
      throw new Error('PDF.js library not loaded. Please refresh the page.');
    }

    if (!this._workerConfigured) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      this._workerConfigured = true;
    }

    let pdf;
    try {
      pdf = await pdfjsLib.getDocument({ data }).promise;
    } catch (err) {
      if (err.name === 'PasswordException') {
        throw new Error('This PDF is password-protected. Please remove the password and try again.');
      }
      throw new Error('Failed to open PDF. The file may be corrupted or not a valid PDF.');
    }

    const texts = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      texts.push(this._reconstructPageText(content.items));
    }

    return texts.join('\n\n').trim();
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
