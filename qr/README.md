# Free QR Generator (`vutaso.com/qr`)

Client-side QR code generator deployed under GitHub Pages at `/qr/`.

## Development

```bash
cd qr
npm install
python3 -m http.server 8765 --bind 127.0.0.1
# open http://127.0.0.1:8765/
```

## Tests

| Command | Description |
|---------|-------------|
| `npm test` | Smoke tests (no browser) |
| `npm run test:e2e:install` | Download Chromium for Playwright |
| `npm run test:e2e` | Playwright E2E |
| `npm run lighthouse:ci` | Lighthouse CI (starts local server, audits `/`) |

## CI

On push/PR touching `qr/**`, GitHub Actions runs [`.github/workflows/qr-ci.yml`](../.github/workflows/qr-ci.yml):

1. **Smoke** — `npm test`
2. **E2E** — Playwright against `http://127.0.0.1:8765`
3. **Lighthouse** — desktop audit with score gates in `lighthouserc.cjs`

### Lighthouse thresholds (P4a)

| Category | Minimum |
|----------|---------|
| Performance | 75 (raise to **85** after P4b lazy vendor) |
| Accessibility | 90 |
| Best Practices | 90 |
| SEO | 95 |

## Vendor libraries

Third-party scripts live in `assets/vendor/`. Re-download:

```bash
bash scripts/vendor-libs.sh
```

## Configuration

Edit `site.config.js` for URL, export limits, and analytics.
