/** @type {import('@lhci/cli').LHCI.ServerCommand.Options & { ci: import('@lhci/utils').LHCI.CiConfig }} */
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'python3 -m http.server 8765 --bind 127.0.0.1',
      startServerReadyPattern: '8765',
      startServerReadyTimeout: 15000,
      url: ['http://127.0.0.1:8765/'],
      numberOfRuns: 1,
      settings: {
        preset: 'desktop',
        chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.75 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'unused-javascript': 'off',
        'render-blocking-resources': 'off',
        'total-byte-weight': 'warn',
        'uses-long-cache-ttl': 'off'
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci'
    }
  }
};
