/**
 * Site configuration — single source of truth for deploy.
 */
window.SITE = {
  url: 'https://vutaso.com/qr',
  basePath: '/qr',
  name: 'Free QR Generator',
  email: 'vutaso.com@gmail.com',
  year: 2026,
  /** Bump when JS/CSS change to bust browser cache on GitHub Pages */
  assetVersion: 3,

  /** Batch CSV — practical upper bound (browser memory) */
  maxBatchRows: 10000,
  /** Max QR export dimension (px) */
  maxQrSize: 2048,

  pro: {
    enabled: false,
    watermarkFree: false,
    watermarkText: '',
    freeMaxSize: 2048,
    proMaxSize: 2048,
    licenseKeys: []
  },

  ads: {
    enabled: false,
    hideForPro: false,
    slots: {
      sidebar: '',
      footer: ''
    }
  },

  analytics: {
    provider: 'plausible',
    plausibleDomain: 'vutaso.com',
    scriptUrl: 'https://plausible.io/js/script.js',
    ga4Id: ''
  }
};
