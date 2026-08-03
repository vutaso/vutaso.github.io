// Keep-format PDF export. A PDF can't be edited in place like the Office
// ZIP formats, so each page is re-rendered instead: pdf.js draws the page
// onto a canvas, the text layer tells us where every line of text sits,
// the lines are grouped into paragraphs and translated (one API call per
// paragraph), then each line's region is erased and the translation drawn
// at the same position (reusing ImageTranslator's erase/redraw helpers).
// The pages are finally packed into a new PDF with jsPDF.
//
// Trade-offs of this approach: output pages are raster images (text is no
// longer selectable and the file usually grows), and rotated/vertical text
// is left untranslated. Layout, images, tables and visual fonts survive
// exactly as rendered.
const PdfTranslator = {
  // Pages beyond MAX_TRANSLATED_PAGES are still included in the output but
  // left untranslated (each page costs seconds of render + API calls).
  // Beyond MAX_TOTAL_PAGES the export refuses to run — rendering hundreds
  // of pages would hang the tab.
  MAX_TRANSLATED_PAGES: 50,
  MAX_TOTAL_PAGES: 150,
  // Render scale: 2x keeps text crisp after the JPEG round-trip without
  // exploding memory. Very large pages are scaled down to stay under the
  // canvas dimension cap.
  SCALE: 2,
  MAX_CANVAS_DIM: 4096,
  JPEG_QUALITY: 0.87,

  // jsPDF (~350KB) is only needed for this export — lazy-loaded from the
  // CDN on first use, same pattern as the docx/JSZip loaders.
  _jsPdfPromise: null,
  _loadJsPdf() {
    if (window.jspdf?.jsPDF) return Promise.resolve();
    if (!this._jsPdfPromise) {
      this._jsPdfPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => resolve();
        script.onerror = () => {
          this._jsPdfPromise = null; // allow retry on the next click
          reject(new Error('Failed to load the PDF writer library. Check your internet connection and try again.'));
        };
        document.head.appendChild(script);
      });
    }
    return this._jsPdfPromise;
  },

  // Translate a PDF file keeping its visual layout. Returns
  // { blob, translatedParas, failedParas, pages, cappedAtPage } where
  // cappedAtPage is the 1-based last translated page when the page cap
  // cut translation short (null otherwise).
  async translatePdf(file, { sourceLang, targetLang, promptOptions = {}, job, onProgress } = {}) {
    await this._loadJsPdf();
    const pdf = await FileParser._openPdf(file);
    if (pdf.numPages > this.MAX_TOTAL_PAGES) {
      throw new Error(`This PDF has ${pdf.numPages} pages — keep-format supports up to ${this.MAX_TOTAL_PAGES}. Use the regular text translation instead.`);
    }

    let doc = null;
    let translatedParas = 0;
    let failedParas = 0;
    let sawAnyText = false;
    const capped = pdf.numPages > this.MAX_TRANSLATED_PAGES;

    try {
      for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
        if (job?.cancelled) {
          const err = new Error('Cancelled.');
          err.cancelled = true;
          throw err;
        }
        onProgress?.({ page: pageNo, pages: pdf.numPages });

        const page = await pdf.getPage(pageNo);
        const baseViewport = page.getViewport({ scale: 1 }); // PDF pt dimensions
        const scale = Math.min(
          this.SCALE,
          this.MAX_CANVAS_DIM / Math.max(baseViewport.width, baseViewport.height)
        );
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        // A PDF whose first pages have no text layer at all is almost
        // certainly scanned — bail out before rendering the whole file.
        if (pageNo > 5 && !sawAnyText) {
          throw new Error('No selectable text found in this PDF — it is likely scanned. Use OCR + regular translation instead (keep-format needs a text layer).');
        }

        // Translate only within the page cap; later pages ship as-is.
        if (pageNo <= this.MAX_TRANSLATED_PAGES) {
          const paragraphs = this._collectParagraphs(await page.getTextContent(), viewport);
          if (paragraphs.length) sawAnyText = true;

          // One API call per paragraph, run through the shared pool so the
          // page's paragraphs translate concurrently. A failed paragraph
          // keeps its original pixels; cancellation aborts the export.
          let cancelled = null;
          await Translator._runPool(paragraphs, async (para) => {
            try {
              const res = await Translator.translate(
                para.lines.map(l => l.text.trim()).join('\n'),
                sourceLang, targetLang, { ...promptOptions, job });
              ImageTranslator._assignTranslations(para.lines, res.text);
              translatedParas++;
            } catch (err) {
              if (err.cancelled) { cancelled = err; return false; }
              para.lines.forEach(line => { line.translated = null; });
              failedParas++;
            }
            return true;
          }, 3);
          if (cancelled) throw cancelled;

          for (const para of paragraphs) {
            for (const line of para.lines) {
              if (typeof line.translated !== 'string' || !line.translated) continue;
              ImageTranslator._redrawLine(ctx, canvas, line);
            }
          }
        }

        const w = baseViewport.width;
        const h = baseViewport.height;
        const orientation = w > h ? 'l' : 'p';
        if (!doc) {
          doc = new jspdf.jsPDF({ unit: 'pt', format: [w, h], orientation });
        } else {
          doc.addPage([w, h], orientation);
        }
        doc.addImage(canvas.toDataURL('image/jpeg', this.JPEG_QUALITY), 'JPEG', 0, 0, w, h);
        canvas.width = canvas.height = 0; // release the bitmap promptly
      }
    } finally {
      pdf.destroy().catch(() => {});
    }

    if (!sawAnyText) {
      throw new Error('No selectable text found in this PDF — it is likely scanned. Use OCR + regular translation instead (keep-format needs a text layer).');
    }

    return {
      blob: doc.output('blob'),
      translatedParas,
      failedParas,
      pages: pdf.numPages,
      cappedAtPage: capped ? this.MAX_TRANSLATED_PAGES : null
    };
  },

  // Build translatable paragraphs from a page's text layer. pdf.js gives
  // positioned text items (fragments of arbitrary length); they are glued
  // into visual lines by baseline, split at column-sized gaps, and lines
  // are stacked into paragraphs by vertical proximity + left-edge
  // alignment. Every bbox is in canvas pixels, ready for redraw.
  _collectParagraphs(textContent, viewport) {
    const frags = [];
    for (const item of textContent.items) {
      if (!item.str || !item.str.trim()) continue;
      const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
      // Rotated / vertical text: a flat horizontal redraw would be wrong,
      // so it is left untranslated.
      if (Math.abs(tx[1]) > 0.5 || Math.abs(tx[2]) > 0.5) continue;
      const fontH = Math.abs(tx[3]);
      if (fontH < 4) continue; // sub-4px text is decoration/noise
      frags.push({
        str: item.str,
        x: tx[4],
        baseline: tx[5],
        width: item.width * viewport.scale,
        fontH
      });
    }
    if (!frags.length) return [];

    // ---- Fragments → lines (same baseline, no column-wide gap) ----
    frags.sort((a, b) => (a.baseline - b.baseline) || (a.x - b.x));
    const lines = [];
    let current = null;
    for (const frag of frags) {
      const sameBaseline = current &&
        Math.abs(frag.baseline - current.baseline) < current.fontH * 0.5;
      const prevEnd = current ? current.x1 : 0;
      const columnGap = current && (frag.x - prevEnd) > current.fontH * 2.5;
      if (sameBaseline && !columnGap) {
        // Fragments inside a line may need a synthetic space: pdf.js often
        // splits mid-word (no space) but also drops inter-word spaces.
        if (frag.x - prevEnd > current.fontH * 0.15) current.text += ' ';
        current.text += frag.str;
        current.x1 = Math.max(current.x1, frag.x + frag.width);
        current.fontH = Math.max(current.fontH, frag.fontH);
      } else {
        current = {
          text: frag.str,
          x0: frag.x,
          x1: frag.x + frag.width,
          baseline: frag.baseline,
          fontH: frag.fontH
        };
        lines.push(current);
      }
    }

    // Lines the translator can't help with (pure numbers/symbols) are
    // skipped — erasing them would only degrade the page.
    const usable = lines.filter(l => /\p{L}/u.test(l.text));
    for (const line of usable) {
      line.bbox = {
        x0: line.x0,
        x1: line.x1,
        y0: line.baseline - line.fontH * 0.95,
        y1: line.baseline + line.fontH * 0.25
      };
    }

    // ---- Lines → paragraphs (vertical proximity + aligned left edge) ----
    const paragraphs = [];
    let para = null;
    for (const line of usable) {
      const prev = para && para.lines[para.lines.length - 1];
      const close = prev &&
        (line.baseline - prev.baseline) < prev.fontH * 1.8 &&
        (line.baseline - prev.baseline) > 0 &&
        Math.abs(line.x0 - prev.x0) < prev.fontH * 8 &&
        Math.abs(line.fontH - prev.fontH) < prev.fontH * 0.4;
      if (close) {
        para.lines.push(line);
      } else {
        para = { lines: [line] };
        paragraphs.push(para);
      }
    }
    return paragraphs;
  }
};
