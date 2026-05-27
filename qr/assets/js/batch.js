/**
 * Batch QR Generator — CSV parsing, preview grid, ZIP download
 */
const QRBatch = (() => {
  let parsedRows = [];
  let previewGeneration = 0;
  let zipAbortController = null;

  function getMaxRows() {
    return typeof QRPro !== 'undefined'
      ? QRPro.getMaxBatchRows()
      : ((window.SITE && (SITE.maxBatchRows || SITE.batchMaxRows)) || 10000);
  }

  function parseCSV(text) {
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) return { rows: [], truncated: false, total: 0 };

    const rows = [];
    let startIdx = 0;
    let truncated = false;

    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('type') && (firstLine.includes('data') || firstLine.includes('platform'));
    if (hasHeader) startIdx = 1;

    const dataLines = lines.length - startIdx;

    for (let i = startIdx; i < lines.length; i++) {
      if (rows.length >= getMaxRows()) {
        truncated = true;
        break;
      }

      const cols = parseCSVLine(lines[i]);
      if (cols.length < 2) continue;

      const type = cols[0].trim().toLowerCase();
      let data;
      let label;
      let extra = {};

      if (type === 'social' && cols.length >= 4) {
        extra.platform = cols[1].trim().toLowerCase();
        data = cols[2].trim();
        label = cols[3] ? cols[3].trim() : `qr-${i}`;
      } else if (type === 'sms' && cols.length >= 3) {
        data = cols[1].trim();
        extra.message = cols[2].trim();
        label = cols.length >= 4 ? cols[3].trim() : `qr-${i}`;
      } else {
        data = cols[1].trim();
        label = cols[2] ? cols[2].trim() : `qr-${i}`;
      }

      if (!data) continue;
      if (!QR_TYPES.some(t => t.id === type)) continue;

      const encoded = parseBatchRow(type, data, extra);
      if (!encoded || !encoded.trim()) continue;

      rows.push({ type, data, encoded, label, index: i, extra });
    }

    return { rows, truncated, total: dataLines };
  }

  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }

  function renderPreview(container, result) {
    const gen = ++previewGeneration;
    const { rows, truncated } = result;

    container.replaceChildren();
    parsedRows = rows;

    if (rows.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'batch-empty';
      empty.textContent = typeof I18n !== 'undefined'
        ? I18n.t('batch.empty')
        : 'No valid rows found. Check your CSV format.';
      container.appendChild(empty);
      return;
    }

    if (truncated) {
      const note = document.createElement('p');
      note.className = 'batch-note';
      note.textContent = typeof I18n !== 'undefined'
        ? I18n.t('batch.truncated', { max: getMaxRows() })
        : `Only first ${getMaxRows()} rows processed.`;
      container.appendChild(note);
    }

    const grid = document.createElement('div');
    grid.className = 'batch-grid';

    rows.forEach((row, idx) => {
      const card = document.createElement('div');
      card.className = 'batch-card';
      card.innerHTML = `
        <div class="batch-card__preview" id="batch-qr-${idx}"></div>
        <div class="batch-card__info">
          <span class="batch-card__type">${escapeHtml(row.type)}</span>
          <span class="batch-card__label" title="${escapeHtml(row.label)}">${escapeHtml(row.label)}</span>
        </div>
      `;
      grid.appendChild(card);

      requestAnimationFrame(() => {
        if (gen !== previewGeneration) return;
        const previewEl = document.getElementById(`batch-qr-${idx}`);
        if (!previewEl) return;
        previewEl.replaceChildren();
        const qr = QRCustomizer.createInstance(row.encoded, { width: 150, height: 150 });
        qr.append(previewEl);
      });
    });

    container.appendChild(grid);
  }

  function cancelDownload() {
    if (zipAbortController) {
      zipAbortController.abort();
      zipAbortController = null;
    }
  }

  async function downloadZip(format = 'png', onProgress) {
    if (parsedRows.length === 0) return;

    cancelDownload();
    zipAbortController = new AbortController();
    const { signal } = zipAbortController;

    const zip = new JSZip();
    const ext = format === 'svg' ? 'svg' : 'png';
    const total = parsedRows.length;
    const usedNames = new Map();

    try {
      for (let i = 0; i < parsedRows.length; i++) {
        if (signal.aborted) throw new DOMException('Batch export cancelled', 'AbortError');

        const row = parsedRows[i];
        const qr = QRCustomizer.createInstance(row.encoded, { width: 400, height: 400 });
        const blob = await QRExporter.exportBatchItem(qr, format);
        const base = sanitizeFilename(row.label) || 'qrcode';
        const count = usedNames.get(base) || 0;
        usedNames.set(base, count + 1);
        const filename = (count ? `${base}-${count + 1}` : base) + '.' + ext;
        zip.file(filename, blob);
        if (onProgress) onProgress(i + 1, total);
      }

      if (signal.aborted) throw new DOMException('Batch export cancelled', 'AbortError');

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `qr-batch-${new Date().toISOString().slice(0, 10)}.zip`);
    } finally {
      zipAbortController = null;
    }
  }

  function sanitizeFilename(name) {
    return name.replace(/[^a-z0-9_\-\.]/gi, '_').slice(0, 50) || 'qrcode';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function getParsedRows() {
    return parsedRows;
  }

  return {
    parseCSV,
    renderPreview,
    downloadZip,
    cancelDownload,
    getParsedRows,
    getMaxRows
  };
})();
