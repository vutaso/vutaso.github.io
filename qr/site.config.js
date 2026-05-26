/**
 * Site configuration — single source of truth for deploy.
 */
window.SITE = {
  url: 'https://vutaso.com/qr',
  basePath: '/qr',
  name: 'Free QR Generator',
  email: 'contact@vutaso.com',
  year: 2026,

  batchMaxRows: 100,
  batchMaxRowsPro: 500,

  pro: {
    enabled: true,
    watermarkFree: true,
    watermarkText: 'vutaso.com/qr',
    freeMaxSize: 600,
    proMaxSize: 1000,
    licenseKeys: ['PRO-DEMO-2026', 'PRO-VIP-2026']
  },

  ads: {
    enabled: true,
    hideForPro: true,
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
  },

  contact: {
    formspreeId: '',
    responseTime: '24 hours'
  }
};
