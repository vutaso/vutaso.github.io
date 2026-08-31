/**
 * Site configuration — single source of truth for deploy.
 */
window.SITE = {
  url: 'https://vutaso.com/qr',
  basePath: '/qr',
  name: 'VUTASO QR',
  email: 'vutaso.com@gmail.com',
  year: 2026,
  /** Bump when JS/CSS change to bust browser cache on GitHub Pages */
  assetVersion: 10,

  /** Batch CSV — practical upper bound (browser memory) */
  maxBatchRows: 10000,
  /** Max QR cards rendered in batch preview (ZIP still exports all parsed rows) */
  maxBatchPreview: 50,
  /** Max encoded payload length (QR version 40 / ECL L ≈ 2953 bytes) */
  maxPayloadChars: 2953,
  /** Max QR export dimension (px) */
  maxQrSize: 2048,
  /** Cap for PNG 2×/3× so scale × size cannot exceed this */
  maxExportPx: 4096,
  /** Max original logo file size (bytes) before rasterize */
  maxLogoBytes: 2097152,
  /** Max logo edge after rasterize (px) */
  maxLogoPx: 256,

  pro: {
    enabled: false,
    watermarkFree: false,
    watermarkText: '',
    freeMaxSize: 2048,
    proMaxSize: 2048,
    licenseKeys: []
  },

  analytics: {
    provider: 'plausible',
    plausibleDomain: 'vutaso.com',
    scriptUrl: 'https://plausible.io/js/script.js',
    ga4Id: ''
  }
};
