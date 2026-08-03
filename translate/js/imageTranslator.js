// Translates text embedded in images: OCR with Tesseract (reusing the
// lazy loader from FileParser), translate each recognized text line via
// Translator, erase the original text regions and draw the translations
// back onto the image. The edited image keeps its original dimensions, so
// a document that embeds it keeps its layout — only the media bytes in
// the ZIP change.
const ImageTranslator = {
  // Raster formats canvas can both decode AND re-encode — other embedded
  // media (emf/wmf/svg/tiff/gif…) is left untouched.
  SUPPORTED_IMAGE_RE: /\.(png|jpe?g|webp)$/i,
  // Safety caps: OCR costs seconds per image and each text line is an API
  // call, so an image-heavy file must not run unbounded.
  MAX_IMAGES: 50,
  // Recognized lines below this confidence or height are almost always
  // OCR noise (specks, borders, logos) — not worth an API call.
  MIN_CONFIDENCE: 55,
  MIN_LINE_HEIGHT: 7, // px

  // Load Tesseract (via FileParser's lazy loader) and create one worker.
  // Callers reuse the worker across all images of a file — starting a
  // worker per image would dominate the runtime.
  async createOcrWorker(langCode) {
    await FileParser._loadTesseract();
    return Tesseract.createWorker(langCode || 'eng+vie');
  },

  // OCR + translate + redraw one image. `bytes` is a Uint8Array of the
  // original file; `ext` is png/jpg/jpeg/webp. Returns
  // { bytes, lines } with the re-encoded image, or null when the image
  // has no usable text or can't be processed — the caller then keeps the
  // original bytes.
  async processImage(bytes, ext, { worker, sourceLang, targetLang, job, promptOptions = {} }) {
    const mime = ext === 'png' ? 'image/png'
      : ext === 'webp' ? 'image/webp'
      : 'image/jpeg';

    let bitmap;
    try {
      bitmap = await createImageBitmap(new Blob([bytes], { type: mime }));
    } catch {
      return null; // undecodable — leave the original image alone
    }

    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close?.();

    const result = await this._recognizeCancellable(worker, canvas, job);
    const paragraphs = this._collectParagraphs(result.data);
    if (!paragraphs.length) return null;

    // One API call per paragraph (not per line — cuts calls roughly
    // 3-5x): lines are joined with newlines, and the system prompt's
    // "preserve line breaks" instruction maps the translation back onto
    // the individual lines. A failed paragraph keeps its original text
    // (it is simply never erased); a cancellation stops the whole export.
    let translated = 0;
    for (const para of paragraphs) {
      try {
        const res = await Translator.translate(
          para.lines.map(l => l.text.trim()).join('\n'),
          sourceLang, targetLang, { ...promptOptions, job });
        this._assignTranslations(para.lines, res.text);
        translated++;
      } catch (err) {
        if (err.cancelled) throw err;
        para.lines.forEach(line => { line.translated = null; });
      }
    }
    if (!translated) return null;

    // Erase each translated line's region and draw the translation in its
    // place, sized and colored to match the original as closely as a
    // flat redraw allows.
    for (const para of paragraphs) {
      for (const line of para.lines) {
        if (typeof line.translated !== 'string' || !line.translated) continue;
        this._redrawLine(ctx, canvas, line);
      }
    }

    const blob = await new Promise(resolve =>
      canvas.toBlob(resolve, mime, mime === 'image/jpeg' ? 0.92 : undefined));
    if (!blob) return null; // encoder missing (e.g. webp on old Safari)
    return { bytes: new Uint8Array(await blob.arrayBuffer()), lines: translated };
  },

  // OCR a canvas, but abort as soon as the job is cancelled — otherwise a
  // multi-second recognition would run to completion before the caller
  // notices. Terminating the worker rejects the in-flight recognize, and
  // the caller treats the whole export as cancelled.
  _recognizeCancellable(worker, canvas, job) {
    if (!job) return worker.recognize(canvas);
    let timer;
    const cancelWatcher = new Promise((_, reject) => {
      timer = setInterval(() => {
        if (job.cancelled) {
          clearInterval(timer);
          worker.terminate().catch(() => {});
          const err = new Error('Cancelled.');
          err.cancelled = true;
          reject(err);
        }
      }, 250);
    });
    return Promise.race([worker.recognize(canvas), cancelWatcher])
      .finally(() => clearInterval(timer));
  },

  // Group Tesseract's recognized lines by paragraph (blocks → paragraphs
  // → lines), keeping only usable lines and dropping empty paragraphs.
  _collectParagraphs(data) {
    const paragraphs = [];
    for (const block of data?.blocks || []) {
      for (const para of block.paragraphs || []) {
        const lines = [];
        for (const line of para.lines || []) {
          if (!line?.text || !line.bbox) continue;
          const h = line.bbox.y1 - line.bbox.y0;
          if (line.text.trim() && line.confidence >= this.MIN_CONFIDENCE && h >= this.MIN_LINE_HEIGHT) {
            lines.push(line);
          }
        }
        if (lines.length) paragraphs.push({ lines });
      }
    }
    return paragraphs;
  },

  // Map a paragraph's translation back onto its lines. The happy path is
  // a 1:1 newline split (the translator is told to preserve line breaks);
  // a count mismatch falls back to distributing the text proportionally
  // to each line's original length — approximate, but layout-preserving
  // (same heuristic as writeAcrossRuns for Office runs).
  _assignTranslations(lines, translated) {
    const parts = translated.split('\n').map(s => s.trim());
    if (parts.length === lines.length) {
      lines.forEach((line, i) => { line.translated = parts[i]; });
      return;
    }
    const flat = parts.join(' ');
    const lengths = lines.map(l => l.text.trim().length);
    const total = lengths.reduce((a, b) => a + b, 0);
    if (!total) return;
    let offset = 0;
    lines.forEach((line, i) => {
      const share = i === lines.length - 1
        ? flat.length - offset
        : Math.min(Math.round(flat.length * lengths[i] / total), flat.length - offset);
      line.translated = flat.slice(offset, offset + Math.max(0, share)).trim();
      offset += Math.max(0, share);
    });
  },

  _redrawLine(ctx, canvas, line) {
    const { x0, y0, x1, y1 } = line.bbox;
    const w = x1 - x0;
    const h = y1 - y0;

    const bg = this._sampleBackground(ctx, canvas.width, canvas.height, line.bbox);
    ctx.fillStyle = `rgb(${bg.r},${bg.g},${bg.b})`;
    ctx.fillRect(x0 - 1, y0 - 1, w + 2, h + 2);

    // Pick a text color that contrasts with the sampled background — the
    // original glyph color is unknowable after erasing.
    const luminance = 0.299 * bg.r + 0.587 * bg.g + 0.114 * bg.b;
    ctx.fillStyle = luminance > 140 ? '#1a1a1a' : '#ffffff';
    ctx.textBaseline = 'middle';

    // Fit the translation into the original box: start from the box
    // height and shrink until the text fits the width.
    let fontSize = Math.max(5, Math.floor(h * 0.78));
    ctx.font = `600 ${fontSize}px Arial, Helvetica, sans-serif`;
    while (fontSize > 5 && ctx.measureText(line.translated).width > w) {
      fontSize--;
      ctx.font = `600 ${fontSize}px Arial, Helvetica, sans-serif`;
    }
    ctx.fillText(line.translated, x0, y0 + h / 2);
  },

  // Average the color of a thin frame just above and below the text box —
  // text pixels live inside the box, so the frame is almost pure
  // background. Two passes: the second drops outliers (stray glyph pixels)
  // before averaging. Falls back to white at image edges.
  _sampleBackground(ctx, W, H, bbox) {
    const strips = [];
    const specs = [
      { x: bbox.x0, y: bbox.y0 - 3, w: bbox.x1 - bbox.x0, h: 2 }, // above
      { x: bbox.x0, y: bbox.y1 + 1, w: bbox.x1 - bbox.x0, h: 2 }  // below
    ];
    for (const s of specs) {
      // A strip that would fall outside the image must be SKIPPED, not
      // clamped: clamping a negative y to 0 would sample rows inside the
      // text box itself and contaminate the background average.
      if (s.y < 0 || s.y >= H) continue;
      const x = Math.max(0, Math.floor(s.x));
      const y = Math.floor(s.y);
      const w = Math.min(W - x, Math.ceil(s.w));
      const h = Math.min(H - y, Math.ceil(s.h));
      if (w > 0 && h > 0) strips.push(ctx.getImageData(x, y, w, h).data);
    }
    if (!strips.length) return { r: 255, g: 255, b: 255 };

    const average = (predicate) => {
      let r = 0, g = 0, b = 0, n = 0;
      for (const data of strips) {
        for (let i = 0; i + 3 < data.length; i += 4) {
          if (data[i + 3] < 128) continue; // skip transparent pixels
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          if (predicate && Math.abs(lum - predicate) > 60) continue;
          r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
        }
      }
      return n ? { color: { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) }, lum: n ? (0.299 * (r / n) + 0.587 * (g / n) + 0.114 * (b / n)) : 255, n } : null;
    };

    const first = average(null);
    if (!first) return { r: 255, g: 255, b: 255 };
    const second = average(first.lum);
    return second && second.n >= first.n * 0.3 ? second.color : first.color;
  }
};
