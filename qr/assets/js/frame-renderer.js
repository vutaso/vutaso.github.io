/**
 * Frame renderer — composite QR + frame for raster export
 */
const FrameRenderer = (() => {
  const FRAME_LAYOUT = {
    none: { pad: 0, labelH: 0 },
    border: { pad: 24, border: 2, borderColor: '#e2e8f0', bg: '#f1f3f9', radius: 12, labelH: 0 },
    badge: { pad: 28, border: 3, borderColor: '#0071e3', bg: '#e3f2fd', radius: 24, labelH: 0 },
    scanme: { pad: 24, border: 2, borderColor: '#1a1a2e', bg: '#ffffff', radius: 12, labelH: 44 },
    banner: { pad: 32, bg: 'gradient', radius: 12, labelH: 48, qrPad: 10, qrBg: '#ffffff' },
    social: { pad: 28, border: 2, borderColor: '#e2e8f0', bg: '#ffffff', radius: 20, labelH: 44, shadow: true }
  };

  function roundRect(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
  }

  function drawGradientBg(ctx, x, y, w, h, radius) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#0071e3');
    g.addColorStop(1, '#2196f3');
    roundRect(ctx, x, y, w, h, radius);
    ctx.fillStyle = g;
    ctx.fill();
  }

  async function render(qrBlob, options = {}) {
    const {
      frameId = 'none',
      labelText = '',
      scale = 1,
      frameColors = null
    } = options;

    const layout = FRAME_LAYOUT[frameId] || FRAME_LAYOUT.none;
    const img = await blobToImage(qrBlob);
    const qrSize = img.width;

    const pad = layout.pad * scale;
    const labelH = layout.labelH * scale;
    const border = (layout.border || 0) * scale;
    const qrPad = (layout.qrPad || 0) * scale;

    const borderColor = frameColors?.border || layout.borderColor || '#e2e8f0';
    const bgColor = frameColors?.background || layout.bg;
    const labelColor = frameColors?.label || (frameId === 'banner' ? '#ffffff' : '#64748b');
    const bannerFrom = frameColors?.bannerFrom || '#0071e3';
    const bannerTo = frameColors?.bannerTo || '#2196f3';

    const innerW = qrSize + qrPad * 2;
    const innerH = innerW;
    const frameW = innerW + pad * 2 + border * 2;
    const frameH = innerH + pad * 2 + border * 2 + labelH;

    const canvas = document.createElement('canvas');
    canvas.width = frameW;
    canvas.height = frameH;
    const ctx = canvas.getContext('2d');

    if (layout.shadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.12)';
      ctx.shadowBlur = 16 * scale;
      ctx.shadowOffsetY = 4 * scale;
    }

    if (layout.bg === 'gradient') {
      const g = ctx.createLinearGradient(0, 0, frameW, frameH);
      g.addColorStop(0, bannerFrom);
      g.addColorStop(1, bannerTo);
      roundRect(ctx, 0, 0, frameW, frameH, layout.radius * scale);
      ctx.fillStyle = g;
      ctx.fill();
    } else if (bgColor && bgColor !== 'gradient') {
      roundRect(ctx, 0, 0, frameW, frameH, layout.radius * scale);
      ctx.fillStyle = bgColor;
      ctx.fill();
    }

    ctx.shadowColor = 'transparent';

    if (layout.border) {
      roundRect(ctx, border / 2, border / 2, frameW - border, frameH - border, layout.radius * scale);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = border;
      ctx.stroke();
    }

    const qrX = pad + border + qrPad;
    const qrY = pad + border + qrPad;

    if (layout.qrBg) {
      roundRect(ctx, pad + border, pad + border, innerW, innerH, 8 * scale);
      ctx.fillStyle = layout.qrBg;
      ctx.fill();
    }

    ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

    if (labelH > 0 && labelText) {
      const fontSize = Math.round(14 * scale);
      ctx.font = `700 ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = labelColor;
      ctx.fillText(labelText.toUpperCase(), frameW / 2, frameH - labelH / 2);
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to render frame'));
      }, 'image/png');
    });
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

  function getFrameLabel(frameId) {
    if (typeof QRCustomizer !== 'undefined' && QRCustomizer.getFrameLabelText) {
      return QRCustomizer.getFrameLabelText();
    }
    const frames = QRCustomizer?.FRAMES || {};
    const frame = frames[frameId];
    return frame?.showLabel ? (frame.labelText || 'Scan Me') : '';
  }

  function getFrameColorsFromStyle() {
    const style = QRCustomizer?.getStyleOptions?.();
    if (!style) return null;
    if (style.useCustomFrameColors) return style.frameColors;
    if (style.activeFrame === 'banner') {
      return {
        bannerFrom: style.frameColors.bannerFrom,
        bannerTo: style.frameColors.bannerTo
      };
    }
    return null;
  }

  return { render, getFrameLabel, getFrameColorsFromStyle, FRAME_LAYOUT };
})();
