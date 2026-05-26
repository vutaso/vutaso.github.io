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
  if (!html.includes('id="pro-modal"')) throw new Error('missing pro modal');
  if (!html.includes('og-image.png')) throw new Error('missing og png');
  if (!html.includes('id="template-marketplace"')) throw new Error('missing template marketplace');
});

test('site.config.js has pro and analytics', () => {
  const cfg = read('site.config.js');
  if (!cfg.includes('batchMaxRowsPro')) throw new Error('missing pro batch');
  if (!cfg.includes('licenseKeys')) throw new Error('missing license keys');
});

test('site.config.js points to vutaso.com/qr', () => {
  const cfg = read('site.config.js');
  if (!cfg.includes('https://vutaso.com/qr')) throw new Error('site url not vutaso.com/qr');
  if (!cfg.includes("basePath: '/qr'")) throw new Error('missing basePath');
  if (cfg.includes('freeqrgenerator.com')) throw new Error('legacy domain still present');
});

test('no legacy domain references in HTML/XML/TXT', () => {
  const files = ['index.html', 'pricing.html', 'contact.html', 'privacy.html', 'terms.html', '404.html', 'sitemap.xml', 'robots.txt'];
  files.forEach((f) => {
    const src = read(f);
    if (src.includes('freeqrgenerator.com')) throw new Error(`legacy domain in ${f}`);
  });
});

test('internal page links are relative (work locally and on vutaso.com/qr/)', () => {
  const files = ['index.html', 'pricing.html', 'contact.html', 'privacy.html', 'terms.html', '404.html'];
  files.forEach((f) => {
    const src = read(f);
    if (src.includes('href="/qr/')) throw new Error(`absolute /qr/ link in ${f}`);
    if (/(href|src|action)="\/(?!\/)([a-zA-Z#])/.test(src)) {
      throw new Error(`root-absolute path in ${f} (breaks file:// open)`);
    }
  });
});

test('canonical URLs use vutaso.com/qr', () => {
  const files = ['index.html', 'pricing.html', 'contact.html', 'privacy.html', 'terms.html'];
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

test('pricing and contact pages exist', () => {
  if (!fs.existsSync(path.join(root, 'pricing.html'))) throw new Error('pricing missing');
  if (!fs.existsSync(path.join(root, 'contact.html'))) throw new Error('contact missing');
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

test('social templates use stBrand with ECL H and logo', () => {
  const src = read('assets/js/templates.js');
  ['soc-facebook', 'soc-youtube', 'soc-instagram', 'soc-twitter'].forEach((id) => {
    if (!src.includes(`id: '${id}'`) || !src.includes('brandLogo: true')) {
      throw new Error('missing brandLogo template: ' + id);
    }
  });
  if (!src.includes("stBrand('facebook'")) throw new Error('stBrand not used');
});

test('templates marketplace has 50+ templates', () => {
  const html = read('index.html');
  if (!html.includes('id="template-marketplace"')) throw new Error('template marketplace UI missing');
  const src = read('assets/js/templates.js');
  const count = (src.match(/cat: '/g) || []).length;
  if (count < 50) throw new Error('expected 50+ templates, got ' + count);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
