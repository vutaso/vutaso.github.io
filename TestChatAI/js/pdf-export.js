window.PdfExport = (() => {
  const safeFilename = (title) =>
    (title || 'conversation').replace(/[^a-zA-Z0-9\u00C0-\u1EF9_\-\s]/g, '').trim() || 'conversation';

  const getThemeBg = () => {
    const theme = document.documentElement.getAttribute('data-theme');
    return theme === 'light' ? '#f8f9fc' : '#0c0c0e';
  };

  const getLibs = () => {
    const html2canvas = window.html2canvas?.default || window.html2canvas;
    const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
    if (!html2canvas && !jsPDF) throw new Error('Thư viện PDF chưa tải (html2canvas, jsPDF)');
    if (!html2canvas) throw new Error('Thư viện html2canvas chưa tải');
    if (!jsPDF) throw new Error('Thư viện jsPDF chưa tải');
    return { html2canvas, jsPDF };
  };

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

  const exportToPdf = async (convo) => {
    if (!convo?.messages?.length) throw new Error('Không có tin nhắn để xuất');

    const { html2canvas, jsPDF } = getLibs();
    const root = await window.UI.preparePdfExportRoot(convo);
    const filename = safeFilename(convo.title) + '.pdf';

    root.classList.add('is-capturing');
    sanitizeStylesForCanvas(root);

    try {
      const canvas = await html2canvas(root, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: getThemeBg(),
        logging: false,
        scrollX: 0,
        scrollY: 0,
        width: root.scrollWidth,
        height: root.scrollHeight,
        windowWidth: root.scrollWidth,
        windowHeight: root.scrollHeight,
      });

      const margin = 12;
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;

      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL('image/jpeg', 0.98);

      let offsetY = 0;
      let page = 0;

      while (offsetY < imgHeight) {
        if (page > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, margin - offsetY, imgWidth, imgHeight);
        offsetY += contentHeight;
        page += 1;
      }

      pdf.save(filename);
    } finally {
      root.remove();
    }
  };

  return { exportToPdf };
})();
