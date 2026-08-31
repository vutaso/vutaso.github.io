/**
 * QR Exporter — PNG, SVG, JPEG, PDF, clipboard, share (with frame support)
 */
const QRExporter = (() => {
  function getBrandFooter() {
    if (window.SITE && SITE.url) return SITE.url.replace(/^https?:\/\//, '');
    return 'vutaso.com/qr';
  }

  function getFilename(prefix = 'qrcode') {
    const ts = new Date().toISOString().slice(0, 10);
    return `${prefix}-${ts}`;
  }

  function loadImageSrc(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timer = setTimeout(() => reject(new Error('image timeout')), 8000);
      img.onload = () => { clearTimeout(timer); resolve(img); };
      img.onerror = () => { clearTimeout(timer); reject(new Error('image load failed')); };
      img.src = src;
    });
  }

  function canvasToPngBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('PNG encode failed'));
      }, 'image/png');
    });
  }

  /**
   * Chromium will not paint nested <image href="data:..."> when an SVG is used as an Image.
   * Strip logo nodes, rasterize the QR modules, then draw logos onto the canvas.
   */
  async function rasterizeSvgBlobToPng(svgBlob) {
    const text = await svgBlob.text();
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    const svg = doc.documentElement;
    if (!svg || svg.nodeName.toLowerCase() === 'parsererror') {
      throw new Error('Invalid SVG');
    }

    const logos = [];
    svg.querySelectorAll('image').forEach((el) => {
      const href = el.getAttribute('href')
        || el.getAttributeNS('http://www.w3.org/1999/xlink', 'href')
        || '';
      logos.push({
        href,
        x: parseFloat(el.getAttribute('x')) || 0,
        y: parseFloat(el.getAttribute('y')) || 0,
        w: parseFloat(String(el.getAttribute('width') || '0')) || 0,
        h: parseFloat(String(el.getAttribute('height') || '0')) || 0
      });
      el.remove();
    });

    const w = parseFloat(svg.getAttribute('width')) || 300;
    const h = parseFloat(svg.getAttribute('height')) || 300;
    const xml = new XMLSerializer().serializeToString(svg);
    const qrImg = await loadImageSrc('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('PNG encode failed');
    ctx.drawImage(qrImg, 0, 0, w, h);

    for (const logo of logos) {
      if (!logo.href || logo.w <= 0 || logo.h <= 0) continue;
      try {
        const logoImg = await loadImageSrc(logo.href);
        ctx.drawImage(logoImg, logo.x, logo.y, logo.w, logo.h);
      } catch {
        /* keep QR without this logo rather than failing export */
      }
    }

    return canvasToPngBlob(canvas);
  }

  async function getRawBlob(qrInstance, extension) {
    const hasLogo = !!(typeof QRCustomizer !== 'undefined' && QRCustomizer.getStyleOptions()?.image);
    if (extension === 'png' && hasLogo) {
      let svgBlob = null;
      try {
        svgBlob = await Promise.race([
          qrInstance.getRawData('svg'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
        ]);
      } catch {
        svgBlob = null;
      }
      if (!svgBlob) throw new Error('SVG export failed');
      return rasterizeSvgBlobToPng(svgBlob);
    }
    return qrInstance.getRawData(extension);
  }

  async function getExportBlob(qrInstance, scale = 1) {
    const style = QRCustomizer.getStyleOptions();
    const baseSize = style.width || 300;
    const maxPx = (window.SITE && SITE.maxExportPx) || 4096;
    const size = Math.min(Math.max(1, baseSize * scale), maxPx);
    const frameId = style.activeFrame || 'none';

    let qr;
    if (scale === 1 && qrInstance && size === baseSize) {
      qr = qrInstance;
    } else {
      qr = QRCustomizer.createInstance(style.data, { width: size, height: size });
    }

    const qrBlob = await getRawBlob(qr, 'png');

    let blob;
    if (frameId === 'none') {
      blob = qrBlob;
    } else {
      const label = FrameRenderer.getFrameLabel(frameId);
      const frameColors = FrameRenderer.getFrameColorsFromStyle();
      blob = await FrameRenderer.render(qrBlob, { frameId, labelText: label, scale, frameColors });
    }

    if (typeof QRPro !== 'undefined') {
      blob = await QRPro.applyWatermark(blob);
    }

    return blob;
  }

  /** SVG with embedded raster so frame + watermark match PNG exports */
  async function blobToSvgBlob(pngBlob) {
    const dataUrl = await blobToDataURL(pngBlob);
    const img = await blobToImage(pngBlob);
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <image width="${w}" height="${h}" xlink:href="${dataUrl}"/>
</svg>`;
    return new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  }

  async function downloadPNG(qrInstance, scale = 1) {
    const blob = await getExportBlob(qrInstance, scale);
    const suffix = scale > 1 ? `-${scale}x` : '';
    saveAs(blob, `${getFilename()}${suffix}.png`);
  }

  async function downloadSVG(qrInstance) {
    const pngBlob = await getExportBlob(qrInstance, 1);
    const svgBlob = await blobToSvgBlob(pngBlob);
    saveAs(svgBlob, `${getFilename()}.svg`);
  }

  async function downloadJPEG(qrInstance) {
    const blob = await getExportBlob(qrInstance, 1);
    const img = await blobToImage(blob);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const jpegBlob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error('JPEG encode failed'));
      }, 'image/jpeg', 0.92);
    });
    saveAs(jpegBlob, `${getFilename()}.jpg`);
  }

  async function downloadPDF(qrInstance, title = '') {
    const { jsPDF } = window.jspdf;
    const blob = await getExportBlob(qrInstance, 1);
    const img = await blobToImage(blob);
    const imgData = await blobToDataURL(blob);

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    if (title) {
      pdf.setFontSize(18);
      pdf.text(title, pageW / 2, 20, { align: 'center' });
    }

    const imgW = img.naturalWidth || img.width || 1;
    const imgH = img.naturalHeight || img.height || 1;
    const maxW = 90;
    const maxH = title ? Math.min(140, pageH - 55) : 90;
    const ratio = imgW / imgH;
    let drawW = maxW;
    let drawH = maxW / ratio;
    if (drawH > maxH) {
      drawH = maxH;
      drawW = maxH * ratio;
    }
    const x = (pageW - drawW) / 2;
    const y = title ? 40 : (pageH - drawH) / 2;
    pdf.addImage(imgData, 'PNG', x, y, drawW, drawH);

    pdf.setFontSize(10);
    pdf.setTextColor(150);
    pdf.text(`Generated at ${getBrandFooter()}`, pageW / 2, pageH - 10, { align: 'center' });

    pdf.save(`${getFilename()}.pdf`);
  }

  async function copyToClipboard(qrInstance) {
    const blob = await getExportBlob(qrInstance, 1);
    if (!navigator.clipboard || !window.ClipboardItem) {
      throw new Error('Clipboard API not supported');
    }
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
  }

  async function shareQR(qrInstance, title = 'QR Code') {
    const blob = await getExportBlob(qrInstance, 1);
    const file = new File([blob], `${getFilename()}.png`, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ title, files: [file] });
      return 'share';
    }

    if (navigator.share) {
      await navigator.share({ title, text: 'Check out this QR code' });
      return 'share';
    }

    await copyToClipboard(qrInstance);
    return 'clipboard';
  }

  function blobToImage(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = reject;
      img.src = url;
    });
  }

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function exportBatchItem(qrInstance, format = 'png') {
    const pngBlob = await getExportBlob(qrInstance, 1);
    if (format === 'svg') return blobToSvgBlob(pngBlob);
    return pngBlob;
  }

  return {
    downloadPNG,
    downloadSVG,
    downloadJPEG,
    downloadPDF,
    copyToClipboard,
    shareQR,
    exportBatchItem,
    blobToSvgBlob,
    getFilename,
    getExportBlob
  };
})();
