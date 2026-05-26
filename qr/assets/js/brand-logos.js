/**
 * Brand logo presets for social QR templates (Facebook, YouTube, Instagram, X)
 */
const QRBrandLogos = (() => {
  const BASE = 'assets/img/brand/';

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
    return {
      ...style,
      image: assetUrl(brandId),
      unifiedColors: extra.unifiedColors ?? false,
      colorMode: preset.colorMode || style.colorMode || 'solid',
      fgColor2: preset.fgColor2 ?? style.fgColor2,
      gradientRotation: preset.gradientRotation ?? style.gradientRotation ?? 0,
      qrOptions: { errorCorrectionLevel: 'H', ...(style.qrOptions || {}) },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: extra.logoMargin ?? 4,
        imageSize: logoSize,
        hideBackgroundDots: true,
        ...(style.imageOptions || {})
      }
    };
  }

  return { PRESETS, assetUrl, getPreset, applyBrand };
})();
