/**
 * Smoke tests — run with: node tests/smoke.test.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('✓', name);
  } catch (e) {
    failed++;
    console.error('✗', name, '-', e.message);
  }
}

function read(p) {
  return fs.readFileSync(path.join(root, p), 'utf8');
}

test('index.html exists and has main sections', () => {
  const html = read('index.html');
  if (!html.includes('id="qr-preview"')) throw new Error('missing preview');
  if (html.includes('id="pro-upgrade"')) throw new Error('pro tier should be removed');
  if (!html.includes('og-image.png')) throw new Error('missing og png');
  if (!html.includes('id="template-marketplace"')) throw new Error('missing template marketplace');
});

test('site.config.js has free limits and analytics', () => {
  const cfg = read('site.config.js');
  if (!cfg.includes('maxBatchRows')) throw new Error('missing maxBatchRows');
  if (!cfg.includes('maxBatchPreview')) throw new Error('missing maxBatchPreview');
  if (!cfg.includes('maxPayloadChars')) throw new Error('missing maxPayloadChars');
  if (!cfg.includes('maxExportPx')) throw new Error('missing maxExportPx');
  if (!cfg.includes('maxQrSize')) throw new Error('missing maxQrSize');
  if (!cfg.includes("enabled: false")) throw new Error('pro should be disabled');
});

test('no public demo license keys in repo', () => {
  const files = ['site.config.js', 'pricing.html', 'index.html'];
  files.forEach((f) => {
    const src = read(f);
    if (src.includes('PRO-DEMO') || src.includes('PRO-VIP')) {
      throw new Error('demo license key exposed in ' + f);
    }
  });
});

test('SVG export uses watermark pipeline (not raw library download)', () => {
  const src = read('assets/js/exporter.js');
  if (src.includes('qrInstance.download({ name: getFilename(), extension: \'svg\' })')) {
    throw new Error('SVG still bypasses export pipeline');
  }
  if (!src.includes('blobToSvgBlob')) throw new Error('missing blobToSvgBlob');
  if (!src.includes('getExportBlob(qrInstance, 1)')) throw new Error('downloadSVG must use getExportBlob');
});

test('app store encode uses single URL', () => {
  const src = read('assets/js/types.js');
  if (src.includes("iosUrl.trim() + '\\n'")) throw new Error('appstore still joins URLs with newline');
});

test('batch parseBatchRow supports social and wifi', () => {
  const src = read('assets/js/types.js');
  if (!src.includes("typeId === 'social'")) throw new Error('social batch parse missing');
  if (!src.includes("typeId === 'wifi'")) throw new Error('wifi batch parse missing');
  if (!src.includes('extra.platform')) throw new Error('social platform extra missing');
});

test('batch export uses full export pipeline', () => {
  const batch = read('assets/js/batch.js');
  const exp = read('assets/js/exporter.js');
  if (!batch.includes('QRExporter.exportBatchItem')) throw new Error('batch missing exportBatchItem');
  if (!exp.includes('getExportBlob(qrInstance, 1)')) throw new Error('exportBatchItem must use getExportBlob');
  if (!batch.includes('cancelDownload')) throw new Error('batch cancel missing');
});

test('history saves style snapshot', () => {
  const app = read('assets/js/app.js');
  const customizer = read('assets/js/customizer.js');
  const history = read('assets/js/history.js');
  if (!customizer.includes('getStyleSnapshot')) throw new Error('getStyleSnapshot missing');
  if (!app.includes('style: styleSnapshot')) throw new Error('history style not saved');
  if (!app.includes('item.style')) throw new Error('history style not restored');
  if (!history.includes("I18n.t('history.empty')")) throw new Error('history i18n missing');
});

test('brand logos have data URI fallback', () => {
  const src = read('assets/js/brand-logos.js');
  if (!src.includes('DATA_URI')) throw new Error('brand DATA_URI missing');
  if (!src.includes('DATA_URI[brandId]')) throw new Error('brand prefers DATA_URI');
});

test('site.config.js points to vutaso.com/qr', () => {
  const cfg = read('site.config.js');
  if (!cfg.includes('https://vutaso.com/qr')) throw new Error('site url not vutaso.com/qr');
  if (!cfg.includes("basePath: '/qr'")) throw new Error('missing basePath');
  if (cfg.includes('freeqrgenerator.com')) throw new Error('legacy domain still present');
});

test('no legacy domain references in HTML/XML/TXT', () => {
  const files = ['index.html', 'privacy.html', 'terms.html', '404.html', 'sitemap.xml', 'robots.txt'];
  files.forEach((f) => {
    const src = read(f);
    if (src.includes('freeqrgenerator.com')) throw new Error(`legacy domain in ${f}`);
  });
});

test('internal page links are relative (work locally and on vutaso.com/qr/)', () => {
  const files = ['index.html', 'privacy.html', 'terms.html', '404.html', 'pricing.html', 'contact.html'];
  files.forEach((f) => {
    const src = read(f);
    if (src.includes('href="/qr/')) throw new Error(`absolute /qr/ link in ${f}`);
    if (/(href|src|action)="\/(?!\/)([a-zA-Z#])/.test(src)) {
      throw new Error(`root-absolute path in ${f} (breaks file:// open)`);
    }
  });
});

test('canonical URLs use vutaso.com/qr', () => {
  const files = ['index.html', 'privacy.html', 'terms.html'];
  files.forEach((f) => {
    const src = read(f);
    const m = src.match(/rel="canonical"\s+href="([^"]+)"/);
    if (!m) throw new Error(`canonical missing in ${f}`);
    if (!m[1].startsWith('https://vutaso.com/qr')) throw new Error(`bad canonical in ${f}: ${m[1]}`);
  });
});

test('self-hosted fonts exist', () => {
  const font = path.join(root, 'assets/fonts/inter-latin-400-normal.woff2');
  if (!fs.existsSync(font)) throw new Error('font missing');
});

test('og-image.png exists', () => {
  if (!fs.existsSync(path.join(root, 'assets/img/og-image.png'))) throw new Error('og png missing');
});

test('pricing and contact redirect to app', () => {
  ['pricing.html', 'contact.html'].forEach((f) => {
    const src = read(f);
    if (!src.includes("url=./") && !src.includes("location.replace('./')")) {
      throw new Error(`${f} should redirect to ./`);
    }
  });
});

test('index has no Pro upgrade UI', () => {
  const html = read('index.html');
  if (html.includes('id="pro-upgrade"')) throw new Error('pro upgrade button still in index');
  if (html.includes('id="pro-modal"')) throw new Error('pro modal still in index');
});

test('JS files parse', () => {
  const jsDir = path.join(root, 'assets/js');
  fs.readdirSync(jsDir).filter(f => f.endsWith('.js')).forEach((f) => {
    require('child_process').execSync(`node --check "${path.join(jsDir, f)}"`, { stdio: 'pipe' });
  });
});

test('types.js has UTM fields', () => {
  const src = read('assets/js/types.js');
  if (!src.includes('utm_source')) throw new Error('missing UTM');
});

test('parseBatchRow rejects unknown types', () => {
  const src = read('assets/js/types.js');
  if (!src.includes("QR_TYPES.find(t => t.id === typeId)")) throw new Error('batch type guard missing');
});

test('exporter passes frame scale', () => {
  const src = read('assets/js/exporter.js');
  if (src.includes('scale: 1, frameColors')) throw new Error('frame scale hardcoded to 1');
});

test('brand logo assets exist for social presets', () => {
  ['facebook', 'youtube', 'instagram', 'x'].forEach((id) => {
    const svg = path.join(root, 'assets/img/brand', id === 'x' ? 'x.svg' : id + '.svg');
    if (!fs.existsSync(svg)) throw new Error('missing brand svg: ' + id);
  });
  const brandJs = read('assets/js/brand-logos.js');
  if (!brandJs.includes('applyBrand')) throw new Error('brand-logos.js incomplete');
});

test('customizer strips crossOrigin for non-remote logo images', () => {
  const src = read('assets/js/customizer.js');
  if (!src.includes('sanitizeImageOptions')) throw new Error('sanitizeImageOptions missing');
  if (!src.includes('isRemoteImageSrc')) throw new Error('isRemoteImageSrc missing');
});

test('social templates use stBrand with ECL H and logo', () => {
  const src = read('assets/js/templates.js');
  ['soc-facebook', 'soc-youtube', 'soc-instagram', 'soc-twitter'].forEach((id) => {
    if (!src.includes(`id: '${id}'`) || !src.includes('brandLogo: true')) {
      throw new Error('missing brandLogo template: ' + id);
    }
  });
  if (!src.includes("stBrand('facebook'")) throw new Error('stBrand not used');
});

test('analytics attaches qr page_path to events', () => {
  const src = read('assets/js/analytics.js');
  if (!src.includes('page_path')) throw new Error('analytics missing page_path');
  if (!src.includes("app: 'qr'")) throw new Error('analytics missing app id');
  if (!src.includes('mergeProps')) throw new Error('analytics missing mergeProps');
});

test('form render escapes labels and placeholders', () => {
  const src = read('assets/js/app.js');
  if (!src.includes('escapeHtml(labelText)')) throw new Error('field label not escaped');
  if (!src.includes('escapeHtml(translateOptionLabel')) throw new Error('option label not escaped');
  if (!src.includes('escapeAttr(field.placeholder')) throw new Error('placeholder not escaped');
});

test('toast has icon and text structure', () => {
  const html = read('index.html');
  if (!html.includes('toast__icon')) throw new Error('toast icon missing');
  if (!html.includes('toast__text')) throw new Error('toast text missing');
  const app = read('assets/js/app.js');
  if (!app.includes('TOAST_DURATION')) throw new Error('toast durations missing');
});

test('self-hosted vendor libraries exist', () => {
  const vendor = path.join(root, 'assets/vendor');
  ['qr-code-styling.js', 'jspdf.umd.min.js', 'jszip.min.js', 'FileSaver.min.js', 'pickr.min.js', 'pickr.nano.min.css'].forEach((f) => {
    if (!fs.existsSync(path.join(vendor, f))) throw new Error('missing vendor file: ' + f);
  });
  const html = read('index.html');
  if (html.includes('unpkg.com/qr-code-styling')) throw new Error('index still references unpkg qr-code-styling');
});

test('mobile sticky CTA and CSP present', () => {
  const html = read('index.html');
  if (!html.includes('id="mobile-sticky-cta"')) throw new Error('mobile sticky CTA missing');
  if (!html.includes('Content-Security-Policy')) throw new Error('CSP meta missing');
});

test('public pages use self-hosted fonts not Google Fonts', () => {
  ['index.html', 'pricing.html', 'contact.html', 'privacy.html', 'terms.html', '404.html'].forEach((f) => {
    const html = read(f);
    if (html.includes('fonts.googleapis.com')) throw new Error(f + ' still uses Google Fonts');
  });
});

test('static pages have Content-Security-Policy', () => {
  ['privacy.html', 'terms.html', '404.html'].forEach((f) => {
    if (!read(f).includes('Content-Security-Policy')) throw new Error('missing CSP on ' + f);
  });
});

test('CI and Lighthouse config exist', () => {
  const workflow = path.join(__dirname, '..', '..', '.github', 'workflows', 'qr-ci.yml');
  if (!fs.existsSync(workflow)) throw new Error('missing .github/workflows/qr-ci.yml');
  if (!fs.existsSync(path.join(root, 'lighthouserc.cjs'))) throw new Error('missing lighthouserc.cjs');
  const pkg = JSON.parse(read('package.json'));
  if (!pkg.scripts['lighthouse:ci']) throw new Error('missing lighthouse:ci npm script');
});

test('playwright e2e config exists', () => {
  if (!fs.existsSync(path.join(root, 'playwright.config.js'))) throw new Error('playwright.config.js missing');
  if (!fs.existsSync(path.join(root, 'tests/e2e/app.spec.js'))) throw new Error('e2e spec missing');
});

test('templates marketplace has 50+ templates', () => {
  const html = read('index.html');
  if (!html.includes('id="template-marketplace"')) throw new Error('template marketplace UI missing');
  const src = read('assets/js/templates.js');
  const count = (src.match(/cat: '/g) || []).length;
  if (count < 50) throw new Error('expected 50+ templates, got ' + count);
});

test('i18n keeps empty-string translations', () => {
  const src = read('assets/js/i18n.js');
  if (!src.includes('hasOwnProperty.call(dict, key)')) {
    throw new Error('I18n.t still uses || fallback that drops empty strings');
  }
  if (!src.includes("'contentSuffix': ''")) throw new Error('vi contentSuffix should be empty string');
});

test('JPEG awaits toBlob and PDF keeps aspect ratio', () => {
  const src = read('assets/js/exporter.js');
  if (!src.includes('JPEG encode failed')) throw new Error('downloadJPEG must await toBlob');
  if (src.includes('pdf.addImage(imgData, \'PNG\', x, y, qrSize, qrSize)')) {
    throw new Error('PDF still forces square qrSize');
  }
  if (!src.includes('drawW') || !src.includes('drawH')) throw new Error('PDF missing aspect-ratio draw size');
  if (!src.includes('maxExportPx')) throw new Error('PNG scale cap missing');
});

test('WhatsApp requires digits and payload length is capped', () => {
  const src = read('assets/js/validation.js');
  if (!src.includes('invalid_whatsapp')) throw new Error('WhatsApp digit check missing');
  if (!src.includes('payload_too_long')) throw new Error('payload length cap missing');
});

test('batch preview is capped separately from ZIP rows', () => {
  const src = read('assets/js/batch.js');
  if (!src.includes('getMaxPreview')) throw new Error('getMaxPreview missing');
  if (!src.includes('previewCapped')) throw new Error('preview cap notice missing');
});

test('logo upload UI and customizer helpers exist', () => {
  const html = read('index.html');
  if (!html.includes("connect-src 'self' data: blob:")) {
    throw new Error('CSP connect-src must allow data: blob: for logo XHR');
  }
  if (!html.includes('id="logo-remove"')) throw new Error('logo remove missing');
  if (!html.includes('id="logo-size"')) throw new Error('logo size slider missing');
  const customizer = read('assets/js/customizer.js');
  if (!customizer.includes('setImageFromFile')) throw new Error('setImageFromFile missing');
  if (!customizer.includes("type: styleOptions.image ? 'svg'")) {
    throw new Error('logo preview must use SVG type (canvas nested-image is blank)');
  }
  if (!customizer.includes('fitPreviewSvg')) {
    throw new Error('preview SVG must set viewBox so QR scales inside the frame');
  }
  const css = read('assets/css/style.css');
  if (!/qr-preview canvas,\s*\.qr-preview svg \{[^}]*min-width:\s*0/.test(css)) {
    throw new Error('preview CSS must let QR shrink inside the frame');
  }
  const exporter = read('assets/js/exporter.js');
  if (!exporter.includes('rasterizeSvgBlobToPng')) throw new Error('PNG export must flatten SVG logos');
  if (!customizer.includes('clearImage')) throw new Error('clearImage missing');
  if (!customizer.includes('bumpEclForLogo')) throw new Error('ECL bump for logo missing');
  const cfg = read('site.config.js');
  if (!cfg.includes('maxLogoBytes')) throw new Error('maxLogoBytes missing');
  if (!cfg.includes('maxLogoPx')) throw new Error('maxLogoPx missing');
  const i18n = read('assets/js/i18n.js');
  if (!i18n.includes("'ui.logoChoose'")) throw new Error('logo i18n missing');
  if (!i18n.includes('upload PNG, JPEG')) throw new Error('FAQ should mention logo upload');
});

test('vCard website is normalized to https', () => {
  const src = read('assets/js/types.js');
  const encode = src.match(/id: 'vcard'[\s\S]*?encode\(data\) \{([\s\S]*?)\n\s*\}/);
  if (!encode) throw new Error('vcard encode missing');
  if (!encode[1].includes('https://')) throw new Error('vCard website must prepend https://');
});

test('history quota failure is not silent', () => {
  const src = read('assets/js/history.js');
  if (!src.includes('history.saveFailed')) throw new Error('history quota toast missing');
  if (!src.includes('__showToast')) throw new Error('history must call __showToast on failure');
});

test('batch parse reports skipped rows', () => {
  const src = read('assets/js/batch.js');
  if (!src.includes('skipped.push')) throw new Error('batch must track skipped rows');
  const app = read('assets/js/app.js');
  if (!app.includes('batch.parsedSkipped')) throw new Error('batch parse toast must mention skipped rows');
});

test('asset versions are in sync with site.config', () => {
  const html = read('index.html');
  const cfg = read('site.config.js');
  const m = cfg.match(/assetVersion:\s*(\d+)/);
  if (!m) throw new Error('assetVersion missing');
  const av = m[1];
  const versions = [...html.matchAll(/\?v=(\d+)/g)].map((x) => x[1]);
  if (!versions.length) throw new Error('no cache-busting ?v= found');
  const bad = versions.filter((v) => parseInt(v, 10) > parseInt(av, 10));
  if (bad.length) throw new Error(`?v=${bad.join(',')} exceeds assetVersion ${av}`);
});

test('WiFi string has no trailing empty segment', () => {
  const src = read('assets/js/types.js');
  const encode = src.match(/id: 'wifi'[\s\S]*?encode\(data\) \{([\s\S]*?)\n\s*\}/);
  if (!encode) throw new Error('wifi encode missing');
  if (encode[1].includes('`;${hidden};`') || /`\s*;\s*`/.test(encode[1])) {
    throw new Error('WiFi payload should not end with ;;');
  }
});

test('vCard escapes special characters', () => {
  const src = read('assets/js/types.js');
  const encode = src.match(/id: 'vcard'[\s\S]*?encode\(data\) \{([\s\S]*?)\n\s*\}/);
  if (!encode) throw new Error('vcard encode missing');
  if (!encode[1].includes('replace(/([\\\\;,])/g')) throw new Error('vCard must escape ; , backslash');
  if (!encode[1].includes("\\\\n")) throw new Error('vCard must escape newlines');
});

test('crypto custom requires explicit scheme', () => {
  const src = read('assets/js/types.js');
  const encode = src.match(/id: 'crypto'[\s\S]*?encode\(data\) \{([\s\S]*?)\n\s*\}/);
  if (!encode) throw new Error('crypto encode missing');
  if (!encode[1].includes('customScheme')) throw new Error('crypto custom must use customScheme field');
  if (!encode[1].includes("if (!scheme) return ''")) throw new Error('crypto custom should fail without scheme');
});

test('phone validation requires 7+ digits', () => {
  const src = read('assets/js/validation.js');
  if (!src.includes('digits.length < 7')) throw new Error('phone validation must count digits');
});

test('dark theme tokens are not overridden by light :root', () => {
  const html = read('index.html');
  const block = html.match(/<style id="qr-theme">([\s\S]*?)<\/style>/);
  if (!block) throw new Error('qr-theme style missing');
  const root = block[1].match(/:root\s*\{([^}]*)\}/);
  if (root && /--bg\s*:/.test(root[1])) {
    throw new Error('qr-theme still sets --bg on :root (breaks dark mode)');
  }
  if (!html.includes('[data-theme="dark"]')) throw new Error('qr-theme missing dark token block');
});

test('library-load fallback is deferred (CSP safe)', () => {
  const html = read('index.html');
  const cspIdx = html.indexOf('Content-Security-Policy');
  const inline = html.match(/<script>\s*[\s\S]*?QRCodeStyling[\s\S]*?<\/script>/);
  if (inline && html.indexOf(inline[0]) > cspIdx) {
    throw new Error('CSP blocks inline QRCodeStyling fallback script');
  }
  const app = read('assets/js/app.js');
  if (!app.includes("typeof QRCodeStyling !== 'function'")) {
    throw new Error('app.js must handle missing QRCodeStyling (CSP-safe fallback)');
  }
});

test('logo PNG export never falls back to preview SVG', () => {
  const src = read('assets/js/exporter.js');
  if (src.includes("#qr-preview svg") || src.includes('previewSvg')) {
    throw new Error('export fallback must not read #qr-preview svg (wrong scale)');
  }
});

test('SVG export discloses embedded raster', () => {
  const i18n = read('assets/js/i18n.js');
  if (!i18n.includes('raster embedded') && !i18n.includes('ảnh raster nhúng')) {
    throw new Error('FAQ should disclose SVG is raster-embedded');
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
