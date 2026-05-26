/**
 * Scan quality tips based on current QR settings
 */
const QRScanTips = (() => {
  function getTips(style, hasLogo) {
    const tips = [];
    const ecl = style.qrOptions?.errorCorrectionLevel || 'M';

    if (hasLogo && ecl !== 'H' && ecl !== 'Q') {
      tips.push({ level: 'warn', key: 'logo_ecl' });
    }

    if (style.colorMode !== 'solid' && style.transparentBg) {
      tips.push({ level: 'warn', key: 'gradient_transparent' });
    }

    const fg = style.dotsOptions?.color || '#000';
    const bg = style.transparentBg ? '#fff' : (style.backgroundOptions?.color || '#fff');
    if (isLowContrast(fg, bg)) {
      tips.push({ level: 'warn', key: 'low_contrast' });
    }

    if ((style.width || 300) < 250) {
      tips.push({ level: 'info', key: 'small_size' });
    }

    if (!tips.length) {
      tips.push({ level: 'ok', key: 'good' });
    }

    return tips;
  }

  function isLowContrast(fg, bg) {
    const l1 = luminance(parseColor(fg));
    const l2 = luminance(parseColor(bg));
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    return ratio < 3;
  }

  function parseColor(hex) {
    const str = String(hex || '').trim();
    const rgba = str.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (rgba) {
      return { r: +rgba[1], g: +rgba[2], b: +rgba[3] };
    }
    const c = str.replace('#', '').slice(0, 6);
    if (c.length < 6) return { r: 0, g: 0, b: 0 };
    return {
      r: parseInt(c.slice(0, 2), 16),
      g: parseInt(c.slice(2, 4), 16),
      b: parseInt(c.slice(4, 6), 16)
    };
  }

  function luminance({ r, g, b }) {
    const [rs, gs, bs] = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  function render(style, hasLogo) {
    const el = document.getElementById('scan-tips');
    if (!el) return;

    const tips = getTips(style, hasLogo);
    el.innerHTML = tips.map((t) => {
      const msg = typeof I18n !== 'undefined' ? I18n.t('tips.' + t.key) : t.key;
      return `<li class="scan-tip scan-tip--${t.level}">${msg}</li>`;
    }).join('');
  }

  return { getTips, render };
})();
