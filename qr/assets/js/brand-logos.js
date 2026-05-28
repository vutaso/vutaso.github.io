/**
 * Brand logo presets for social QR templates (Facebook, YouTube, Instagram, X)
 */
const QRBrandLogos = (() => {
  const BASE = 'assets/img/brand/';

  function svgDataUri(svg) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.trim());
  }

  const DATA_URI = {
    facebook: svgDataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1877F2"/><path fill="#fff" d="M36.2 33.5h5.3l2.2-8.2h-7.2v-5.1c0-2.2 1.1-4.3 4.5-4.3h3.2V9.2h-5.4c-6.5 0-8.6 3.9-8.6 9.5v6.8h-5.5v8.2h5.5V55h9.4V33.5z"/></svg>'),
    youtube: svgDataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#FF0000"/><path fill="#fff" d="M44 32L26 22v20l18-10z"/></svg>'),
    instagram: svgDataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#F58529"/><stop offset="35%" stop-color="#DD2A7B"/><stop offset="65%" stop-color="#8134AF"/><stop offset="100%" stop-color="#515BD4"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#ig)"/><rect x="17" y="17" width="30" height="30" rx="8" fill="none" stroke="#fff" stroke-width="3"/><circle cx="44" cy="20" r="4" fill="#fff"/><circle cx="32" cy="32" r="7" fill="none" stroke="#fff" stroke-width="3"/></svg>'),
    x: svgDataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#000"/><path fill="#fff" d="M38.2 18h6.9L36.4 28.6 46 46h-8.6l-6.7-9.8-7.6 9.8H16l10.2-12.5L17 18h8.8l6 8.9L38.2 18zm-2.4 24.5h3.8L24.4 21.6h-4.1l15.5 21z"/></svg>'),
    linkedin: svgDataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0A66C2"/><path fill="#fff" d="M20 24h6v22h-6V24zm3-9a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zm9 9h5.7v3h.1c.8-1.5 2.7-3.1 5.6-3.1 6 0 7.1 3.9 7.1 9.5V46h-6v-9.8c0-2.3 0-5.3-3.2-5.3s-3.7 2.5-3.7 5.1V46h-6V24z"/></svg>'),
    tiktok: svgDataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#010101"/><path fill="#25F4EE" d="M42 18v14.2c-1.8-1.3-4-2-6.4-2-6.6 0-12 5.4-12 12s5.4 12 12 12c6.2 0 11.2-4.7 11.8-10.7V18H42z"/><path fill="#FE2C55" d="M46 18h4.2v10.2c-.6 6-5.6 10.7-11.8 10.7-6.6 0-12-5.4-12-12 0-6.6 5.4-12 12-12 2.4 0 4.6.7 6.4 2V18z"/></svg>'),
    whatsapp: svgDataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#25D366"/><path fill="#fff" d="M32 16c-8.8 0-16 7.2-16 16 0 2.8.7 5.5 2 7.9L16 48l8.4-2.2c2.3 1.3 4.9 2 7.6 2 8.8 0 16-7.2 16-16S40.8 16 32 16zm9.2 22.5c-.4.7-2.3 1.1-3.2 1.1-.8 0-1.9-.2-3.3-.7-1.1-.4-2.6-1-4.5-2-3.9-2.1-6.4-5.8-6.6-6.1-.2-.3-1.6-2.1-1.6-4.1 0-2 1-3 1.4-3.4.3-.4.8-.5 1.1-.5.3 0 .6 0 .9.1.3 0 .6.1.9.7.3.7.6 1.2 1.3 1.4 1.5.2.2.4.4.5.6.1.2 0 .4 0 .6-.1.2-.2.9-1.1 1.1-1.5.2-.4.4-.8.2-1.3-.1-.5-.6-2.4-.8-2.7-.2-.3-.4-.2-.6-.1-.2 0-1.5.7-1.9.8-.4.1-.8.1-1.1-.1-.3-.2-1.1-.4-1.4-.3-.3-.6-.2-1.1.1-.5.3-1 .7-1.7 1.2-.6.5-1.1 1-1.2 1.1-.1.1-.2.2-.3.4z"/></svg>'),
    telegram: svgDataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#229ED9"/><path fill="#fff" d="M46.5 21.2 17.8 33.1c-1.8.7-1.8 1.7-.3 2.2l7 2.2 2.6 8c.3.9.6 1.1 1.2 1.1.5 0 .7-.2 1-.7l3.8-3.7c.5-.5 1-.3 1.8.2l7.3 5.4c.7.5 1.2.2 1.4-.7l5.3-25.2c.3-1.3-.5-1.9-1.4-1.5z"/></svg>')
  };

  const PRESETS = {
    facebook: {
      file: 'facebook.svg',
      fg: '#1877F2',
      bg: '#ffffff',
      cornerSqColor: '#1877F2',
      cornerDotColor: '#60a5fa',
      dots: 'rounded',
      cornerSq: 'extra-rounded',
      cornerDot: 'dot',
      logoSize: 0.32
    },
    youtube: {
      file: 'youtube.svg',
      fg: '#FF0000',
      bg: '#ffffff',
      cornerSqColor: '#FF0000',
      cornerDotColor: '#f87171',
      dots: 'rounded',
      cornerSq: 'extra-rounded',
      cornerDot: 'dot',
      logoSize: 0.32
    },
    instagram: {
      file: 'instagram.svg',
      fg: '#E1306C',
      bg: '#ffffff',
      fgColor2: '#833AB4',
      colorMode: 'linear',
      gradientRotation: 45,
      cornerSqColor: '#C13584',
      cornerDotColor: '#F77737',
      dots: 'dots',
      cornerSq: 'extra-rounded',
      cornerDot: 'dot',
      logoSize: 0.3
    },
    x: {
      file: 'x.svg',
      fg: '#000000',
      bg: '#ffffff',
      cornerSqColor: '#171717',
      cornerDotColor: '#525252',
      dots: 'square',
      cornerSq: 'square',
      cornerDot: 'square',
      logoSize: 0.3
    }
  };

  function assetUrl(brandId) {
    if (DATA_URI[brandId]) return DATA_URI[brandId];
    const preset = PRESETS[brandId];
    if (!preset) return null;
    const rel = BASE + preset.file;
    try {
      return new URL(rel, window.location.href).href;
    } catch {
      return rel;
    }
  }

  function getPreset(brandId) {
    return PRESETS[brandId] || null;
  }

  /** Merge brand logo + ECL H + colors into a template style object from st() */
  function applyBrand(style, brandId, extra = {}) {
    const preset = PRESETS[brandId];
    if (!preset) return style;

    const logoSize = extra.logoSize ?? preset.logoSize ?? 0.32;
    const image = assetUrl(brandId);
    const imageOptions = {
      margin: extra.logoMargin ?? 4,
      imageSize: logoSize,
      hideBackgroundDots: true,
      ...(style.imageOptions || {})
    };
    if (/^https?:\/\//i.test(image)) imageOptions.crossOrigin = 'anonymous';
    return {
      ...style,
      image,
      unifiedColors: extra.unifiedColors ?? false,
      colorMode: preset.colorMode || style.colorMode || 'solid',
      fgColor2: preset.fgColor2 ?? style.fgColor2,
      gradientRotation: preset.gradientRotation ?? style.gradientRotation ?? 0,
      qrOptions: { errorCorrectionLevel: 'H', ...(style.qrOptions || {}) },
      imageOptions
    };
  }

  return { PRESETS, DATA_URI, assetUrl, getPreset, applyBrand };
})();
