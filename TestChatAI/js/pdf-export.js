window.PdfExport = (() => {
  const MARGIN_MM = 12;
  const BLOCK_GAP_MM = 3;
  const CONTINUATION_GAP_MM = 1;
  const CAPTURE_SCALE = 2;

  const SAFE_BREAK_SELECTORS = [
    'p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote',
    '.math-block', '.katex-display', '.table-block', '.mermaid-block',
    'tr', 'dt', 'dd', '.message-file-chip', '.message-image-wrap',
    'details', 'hr',
  ].join(', ');

  const safeFilename = (title) =>
    (title || 'conversation').replace(/[^a-zA-Z0-9\u00C0-\u1EF9_\-\s]/g, '').trim() || 'conversation';

  const getThemeBg = () => '#ffffff';

  const getLibs = () => {
    const html2canvas = window.html2canvas?.default || window.html2canvas;
    const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
    if (!html2canvas && !jsPDF) throw new Error('Thư viện PDF chưa tải (html2canvas, jsPDF)');
    if (!html2canvas) throw new Error('Thư viện html2canvas chưa tải');
    if (!jsPDF) throw new Error('Thư viện jsPDF chưa tải');
    return { html2canvas, jsPDF };
  };

  const waitForLayout = () =>
    new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const CANVAS_COLOR_PROPS = [
    'color', 'backgroundColor',
    'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
    'outlineColor', 'textDecorationColor', 'caretColor', 'fill', 'stroke',
  ];

  const sanitizeStylesForCanvas = (root) => {
    const nodes = [root, ...root.querySelectorAll('*')];
    for (const el of nodes) {
      if (!(el instanceof HTMLElement)) continue;
      const computed = getComputedStyle(el);
      const style = el.style;

      for (const prop of CANVAS_COLOR_PROPS) {
        const val = computed[prop];
        if (val && val !== 'initial' && val !== 'inherit' && val !== 'rgba(0, 0, 0, 0)') {
          style[prop] = val;
        }
      }

      style.backgroundColor = computed.backgroundColor;
      if (computed.boxShadow && computed.boxShadow !== 'none') {
        style.boxShadow = computed.boxShadow;
      }
      if (computed.border && computed.border !== 'none') {
        style.borderColor = computed.borderColor;
      }
    }
  };

  const expandScrollablesForExport = (root) => {
    root.querySelectorAll('pre, pre code, .table-scroll, .mermaid-view, .content').forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      el.style.maxHeight = 'none';
      el.style.height = 'auto';
      el.style.overflow = 'visible';
      el.style.overflowX = 'visible';
      el.style.overflowY = 'visible';
    });
    root.querySelectorAll('pre .pre-header').forEach((el) => {
      if (el instanceof HTMLElement) el.style.position = 'static';
    });
  };

  const avatarSlotHtml = (isUser, isFirst) => {
    if (isFirst) {
      return isUser
        ? '<div class="avatar user-av" aria-hidden="true"><i class="fa-solid fa-user"></i></div>'
        : '<div class="avatar assistant-av" aria-hidden="true">V</div>';
    }
    return '<div class="pdf-export-chunk-spacer" aria-hidden="true"></div>';
  };

  const restructureIntoChunks = (root) => {
    const messagesWrap = root.querySelector('.pdf-export-messages');
    const blocks = [];

    const title = root.querySelector('.pdf-export-title');
    if (title) blocks.push({ el: title, gapAfter: BLOCK_GAP_MM });

    [...root.querySelectorAll('.pdf-export-message')].forEach((msg) => {
      const isUser = msg.classList.contains('user');
      const content = msg.querySelector('.content');
      const children = content ? [...content.children] : [];

      if (!children.length) {
        blocks.push({ el: msg, gapAfter: BLOCK_GAP_MM });
        return;
      }

      children.forEach((child, index) => {
        const chunk = document.createElement('div');
        chunk.className = 'pdf-export-chunk message ' + [...msg.classList]
          .filter((c) => c !== 'pdf-export-message')
          .join(' ');
        if (index > 0) chunk.classList.add('continuation');

        chunk.insertAdjacentHTML('afterbegin', avatarSlotHtml(isUser, index === 0));

        const body = document.createElement('div');
        body.className = 'body';
        const contentWrap = document.createElement('div');
        contentWrap.className = 'content';
        contentWrap.appendChild(child);
        body.appendChild(contentWrap);
        chunk.appendChild(body);

        messagesWrap.appendChild(chunk);
        blocks.push({
          el: chunk,
          gapAfter: index < children.length - 1 ? CONTINUATION_GAP_MM : BLOCK_GAP_MM,
        });
      });

      msg.remove();
    });

    return blocks;
  };

  const captureBlock = async (html2canvas, el, bg, rootWidth) => {
    const canvas = await html2canvas(el, {
      scale: CAPTURE_SCALE,
      useCORS: true,
      allowTaint: false,
      backgroundColor: bg,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      width: rootWidth,
      height: el.scrollHeight,
      windowWidth: rootWidth,
      windowHeight: el.scrollHeight,
    });
    return canvas;
  };

  const sliceCanvas = (source, offsetPx, heightPx, bg) => {
    const top = Math.min(Math.max(0, Math.round(offsetPx)), source.height - 1);
    const maxH = source.height - top;
    const h = Math.max(1, Math.min(Math.round(heightPx), maxH));

    const slice = document.createElement('canvas');
    slice.width = source.width;
    slice.height = h;
    const ctx = slice.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(source, 0, top, source.width, h, 0, 0, source.width, h);
    return slice;
  };

  const canvasToImage = (canvas, widthMm, bg) => {
    const heightMm = (canvas.height * widthMm) / canvas.width;
    return { canvas, widthMm, heightMm, bg, dataUrl: canvas.toDataURL('image/png') };
  };

  const availableMm = (state, dims) => dims.contentHeight - (state.y - dims.margin);

  const startNewPage = (pdf, state) => {
    pdf.addPage();
    state.page += 1;
    state.y = MARGIN_MM;
  };

  const findSafeChunkPx = (blockEl, canvas, offsetPx, maxChunkPx) => {
    const remaining = canvas.height - offsetPx;
    if (maxChunkPx >= remaining) return remaining;

    const blockHeight = blockEl.offsetHeight;
    if (blockHeight <= 0) return Math.min(maxChunkPx, remaining);

    const scale = canvas.height / blockHeight;
    const startDom = offsetPx / scale;
    const endDom = (offsetPx + maxChunkPx) / scale;
    const blockRect = blockEl.getBoundingClientRect();
    let safeEndDom = endDom;

    blockEl.querySelectorAll(SAFE_BREAK_SELECTORS).forEach((el) => {
      const rect = el.getBoundingClientRect();
      const top = rect.top - blockRect.top;
      const bottom = rect.bottom - blockRect.top;
      if (top < endDom - 0.5 && bottom > endDom + 0.5 && top > startDom + 0.5) {
        safeEndDom = Math.min(safeEndDom, top);
      }
    });

    let chunkPx = (safeEndDom - startDom) * scale;
    if (chunkPx < 12) chunkPx = maxChunkPx;
    return Math.min(Math.max(1, Math.floor(chunkPx)), remaining);
  };

  const placeBlockOnPdf = (pdf, image, state, dims, blockEl, gapAfter) => {
    const { margin, contentWidth, contentHeight } = dims;
    const { canvas, heightMm, bg } = image;
    const totalPx = canvas.height;
    if (totalPx <= 0) return;

    const mmPerPx = heightMm / totalPx;

    if (heightMm <= contentHeight && heightMm > availableMm(state, dims) && state.y > margin) {
      startNewPage(pdf, state);
    }

    if (heightMm <= availableMm(state, dims)) {
      pdf.addImage(image.dataUrl, 'PNG', margin, state.y, contentWidth, heightMm);
      state.y += heightMm + gapAfter;
      return;
    }

    let offsetPx = 0;

    while (offsetPx < totalPx) {
      let spaceMm = availableMm(state, dims);
      if (spaceMm <= 0.5) {
        startNewPage(pdf, state);
        spaceMm = contentHeight;
      }

      const remainingPx = totalPx - offsetPx;
      const maxChunkPx = Math.min(remainingPx, Math.floor(spaceMm / mmPerPx));
      if (maxChunkPx <= 0) {
        startNewPage(pdf, state);
        continue;
      }

      const chunkPx = findSafeChunkPx(blockEl, canvas, offsetPx, maxChunkPx);
      const slice = sliceCanvas(canvas, offsetPx, chunkPx, bg);
      const chunkMm = (slice.height / totalPx) * heightMm;

      pdf.addImage(slice.toDataURL('image/png'), 'PNG', margin, state.y, contentWidth, chunkMm);

      offsetPx += slice.height;
      state.y += chunkMm;

      if (offsetPx < totalPx) startNewPage(pdf, state);
    }

    state.y += gapAfter;
  };

  const exportToPdf = async (convo, { onProgress } = {}) => {
    if (!convo?.messages?.length) throw new Error('Không có tin nhắn để xuất');

    const report = (title, hint) => {
      if (typeof onProgress === 'function') onProgress({ title, hint });
    };

    const { html2canvas, jsPDF } = getLibs();
    report('Đang chuẩn bị PDF...', 'Đang render nội dung và công thức toán');
    const root = await window.UI.preparePdfExportRoot(convo);
    const filename = safeFilename(convo.title) + '.pdf';
    const bg = getThemeBg();

    root.classList.add('is-capturing');

    try {
      const blocks = restructureIntoChunks(root);
      await waitForLayout();
      expandScrollablesForExport(root);
      await waitForLayout();
      sanitizeStylesForCanvas(root);

      const rootWidth = root.scrollWidth;
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const dims = {
        margin: MARGIN_MM,
        contentWidth: pageWidth - MARGIN_MM * 2,
        contentHeight: pageHeight - MARGIN_MM * 2,
      };

      const state = { page: 1, y: MARGIN_MM };
      const total = blocks.length;
      let index = 0;

      for (const { el, gapAfter } of blocks) {
        index += 1;
        report(
          'Đang xuất PDF A4...',
          total > 1 ? `Đang xử lý phần ${index}/${total}` : 'Vui lòng đợi trong giây lát'
        );
        const canvas = await captureBlock(html2canvas, el, bg, rootWidth);
        if (!canvas.height) continue;
        const image = canvasToImage(canvas, dims.contentWidth, bg);
        placeBlockOnPdf(pdf, image, state, dims, el, gapAfter);
      }

      report('Đang lưu file PDF...', 'Sắp hoàn tất');
      pdf.save(filename);
    } finally {
      root.remove();
      window.Markdown?.updateMermaidTheme?.();
    }
  };

  return { exportToPdf };
})();
