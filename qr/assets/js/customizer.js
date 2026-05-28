/**
 * QR Customizer — advanced styling, independent colors, frame custom, presets
 */
const QRCustomizer = (() => {
  const THEMES = {
    classic: { label: 'Classic', dotsOptions: { type: 'square', color: '#000000' }, cornersSquareOptions: { type: 'square', color: '#000000' }, cornersDotOptions: { type: 'square', color: '#000000' }, backgroundOptions: { color: '#ffffff' } },
    dark: { label: 'Dark', dotsOptions: { type: 'rounded', color: '#ffffff' }, cornersSquareOptions: { type: 'extra-rounded', color: '#ffffff' }, cornersDotOptions: { type: 'dot', color: '#ffffff' }, backgroundOptions: { color: '#1a1a2e' } },
    ocean: { label: 'Ocean', dotsOptions: { type: 'rounded', color: '#0077b6' }, cornersSquareOptions: { type: 'extra-rounded', color: '#023e8a' }, cornersDotOptions: { type: 'dot', color: '#48cae4' }, backgroundOptions: { color: '#caf0f8' } },
    sunset: { label: 'Sunset', dotsOptions: { type: 'extra-rounded', color: '#e63946' }, cornersSquareOptions: { type: 'extra-rounded', color: '#f4a261' }, cornersDotOptions: { type: 'dot', color: '#e76f51' }, backgroundOptions: { color: '#fefae0' } },
    forest: { label: 'Forest', dotsOptions: { type: 'classy-rounded', color: '#2d6a4f' }, cornersSquareOptions: { type: 'extra-rounded', color: '#1b4332' }, cornersDotOptions: { type: 'dot', color: '#52b788' }, backgroundOptions: { color: '#d8f3dc' } },
    purple: { label: 'Purple', dotsOptions: { type: 'dots', color: '#7b2cbf' }, cornersSquareOptions: { type: 'dot', color: '#5a189a' }, cornersDotOptions: { type: 'dot', color: '#c77dff' }, backgroundOptions: { color: '#f3e8ff' } },
    gold: { label: 'Gold', dotsOptions: { type: 'classy', color: '#b8860b' }, cornersSquareOptions: { type: 'square', color: '#8b6914' }, cornersDotOptions: { type: 'square', color: '#daa520' }, backgroundOptions: { color: '#fff8e7' } },
    'dots-minimal': { label: 'Dots', dotsOptions: { type: 'dots', color: '#333333' }, cornersSquareOptions: { type: 'dot', color: '#333333' }, cornersDotOptions: { type: 'dot', color: '#333333' }, backgroundOptions: { color: '#fafafa' } },
    classy: { label: 'Classy', dotsOptions: { type: 'classy-rounded', color: '#1d3557' }, cornersSquareOptions: { type: 'extra-rounded', color: '#457b9d' }, cornersDotOptions: { type: 'dot', color: '#a8dadc' }, backgroundOptions: { color: '#f1faee' } },
    custom: { label: 'Custom', dotsOptions: { type: 'square', color: '#0071e3' }, cornersSquareOptions: { type: 'square', color: '#0071e3' }, cornersDotOptions: { type: 'square', color: '#0071e3' }, backgroundOptions: { color: '#ffffff' } }
  };

  const FRAMES = {
    none: { label: 'None', className: 'qr-frame--none', showLabel: false },
    border: { label: 'Border', className: 'qr-frame--border', showLabel: false },
    badge: { label: 'Badge', className: 'qr-frame--badge', showLabel: false },
    scanme: { label: 'Scan Me', className: 'qr-frame--scanme', showLabel: true, labelText: 'Scan Me' },
    banner: { label: 'Banner', className: 'qr-frame--banner', showLabel: true, labelText: 'Scan to open' },
    social: { label: 'Social', className: 'qr-frame--social', showLabel: true, labelText: 'Follow us' }
  };

  const DOT_STYLES = [
    { id: 'square', label: 'Square', shape: 'square' },
    { id: 'dots', label: 'Dots', shape: 'circle' },
    { id: 'rounded', label: 'Rounded', shape: 'rounded' },
    { id: 'extra-rounded', label: 'Extra', shape: 'extra-rounded' },
    { id: 'classy', label: 'Classy', shape: 'classy' },
    { id: 'classy-rounded', label: 'Classy+', shape: 'classy-rounded' }
  ];

  const CORNER_SQUARE_STYLES = [
    { id: 'square', label: 'Square', shape: 'square' },
    { id: 'extra-rounded', label: 'Rounded', shape: 'extra-rounded' },
    { id: 'dot', label: 'Dot', shape: 'circle' }
  ];

  const CORNER_DOT_STYLES = [
    { id: 'square', label: 'Square', shape: 'square' },
    { id: 'dot', label: 'Dot', shape: 'circle' }
  ];

  const STYLE_COMBOS = [
    { id: 'classic', label: 'Classic', dots: 'square', cornerSq: 'square', cornerDot: 'square' },
    { id: 'soft', label: 'Soft', dots: 'rounded', cornerSq: 'extra-rounded', cornerDot: 'dot' },
    { id: 'bubble', label: 'Bubble', dots: 'extra-rounded', cornerSq: 'extra-rounded', cornerDot: 'dot' },
    { id: 'dotted', label: 'Dotted', dots: 'dots', cornerSq: 'dot', cornerDot: 'dot' },
    { id: 'elegant', label: 'Elegant', dots: 'classy-rounded', cornerSq: 'extra-rounded', cornerDot: 'dot' },
    { id: 'bold', label: 'Bold', dots: 'classy', cornerSq: 'square', cornerDot: 'square' }
  ];

  const CUSTOM_THEMES_KEY = 'qr-custom-themes';
  const MAX_CUSTOM_THEMES = 20;

  let qrInstance = null;
  let container = null;
  let debounceTimer = null;
  let pickrInstances = {};

  function cloneDefaultStyle() {
    return {
      width: 300, height: 300, type: 'canvas', data: 'https://example.com', margin: 1,
      qrOptions: { errorCorrectionLevel: 'M' },
      dotsOptions: { type: 'square', color: '#000000' },
      cornersSquareOptions: { type: 'square', color: '#000000' },
      cornersDotOptions: { type: 'square', color: '#000000' },
      backgroundOptions: { color: '#ffffff' },
      imageOptions: { margin: 5, imageSize: 0.4, hideBackgroundDots: true },
      image: null,
      colorMode: 'solid', fgColor2: '#0071e3', gradientRotation: 0,
      unifiedColors: true,
      transparentBg: false, bgColorMode: 'solid', bgColor2: '#e2e8f0', bgGradientRotation: 45,
      activeTheme: 'classic', activeFrame: 'none',
      customFrameLabel: '', useCustomFrameColors: false,
      frameColors: { border: '#0071e3', background: '#e3f2fd', label: '#64748b', bannerFrom: '#0071e3', bannerTo: '#2196f3' }
    };
  }

  let styleOptions = cloneDefaultStyle();

  function buildColorOptions(color, color2, mode, rotation = 0) {
    if (mode === 'linear') {
      return {
        gradient: {
          type: 'linear',
          rotation: (rotation * Math.PI) / 180,
          colorStops: [{ offset: 0, color }, { offset: 1, color: color2 || color }]
        }
      };
    }
    if (mode === 'radial') {
      return {
        gradient: {
          type: 'radial',
          colorStops: [{ offset: 0, color }, { offset: 1, color: color2 || color }]
        }
      };
    }
    return { color };
  }

  function buildDotsColorOpts() {
    const fg = styleOptions.dotsOptions.color || '#000000';
    return buildColorOptions(fg, styleOptions.fgColor2 || fg, styleOptions.colorMode || 'solid', styleOptions.gradientRotation || 0);
  }

  function buildPartOpts(partKey) {
    const part = styleOptions[partKey];
    if (styleOptions.unifiedColors || partKey === 'dotsOptions') {
      return { type: part.type, ...buildDotsColorOpts() };
    }
    return { type: part.type, color: part.color || '#000000' };
  }

  function buildBackgroundOpts() {
    if (styleOptions.transparentBg) return { color: 'transparent' };
    const bg = styleOptions.backgroundOptions.color || '#ffffff';
    const mode = styleOptions.bgColorMode || 'solid';
    if (mode === 'solid') return { color: bg };
    return buildColorOptions(bg, styleOptions.bgColor2 || bg, mode, styleOptions.bgGradientRotation || 0);
  }

  /** crossOrigin on data:/blob: URLs breaks image load in qr-code-styling (blank preview). */
  function isRemoteImageSrc(src) {
    return typeof src === 'string' && /^https?:\/\//i.test(src);
  }

  function sanitizeImageOptions() {
    if (styleOptions.image && !isRemoteImageSrc(styleOptions.image)) {
      delete styleOptions.imageOptions.crossOrigin;
    }
  }

  function buildImageOptions() {
    const opts = {
      margin: styleOptions.imageOptions.margin,
      imageSize: styleOptions.imageOptions.imageSize,
      hideBackgroundDots: styleOptions.imageOptions.hideBackgroundDots
    };
    if (styleOptions.image && isRemoteImageSrc(styleOptions.image)) {
      opts.crossOrigin = 'anonymous';
    }
    return opts;
  }

  function buildConfig(overrides = {}) {
    const config = {
      width: overrides.width ?? styleOptions.width,
      height: overrides.height ?? styleOptions.height,
      type: 'canvas',
      data: overrides.data ?? styleOptions.data ?? ' ',
      margin: overrides.margin ?? styleOptions.margin,
      qrOptions: { errorCorrectionLevel: styleOptions.qrOptions.errorCorrectionLevel },
      dotsOptions: buildPartOpts('dotsOptions'),
      cornersSquareOptions: buildPartOpts('cornersSquareOptions'),
      cornersDotOptions: buildPartOpts('cornersDotOptions'),
      backgroundOptions: buildBackgroundOpts(),
      imageOptions: buildImageOptions()
    };
    if (styleOptions.image) config.image = styleOptions.image;
    return config;
  }

  function invalidateQRInstance() {
    qrInstance = null;
  }

  /** Warm canvas draw on WebKit; failures must not blank the preview. */
  async function warmQRRender(instance) {
    if (!instance || typeof instance.getRawData !== 'function') return;
    try {
      await instance.getRawData('png');
    } catch {
      /* preview may still be valid without warm-up */
    }
  }

  function hasPreviewGraphic(rootEl) {
    if (!rootEl) return false;
    const node = rootEl.querySelector('canvas, svg');
    if (!node) return false;
    if (node.tagName.toLowerCase() === 'svg') return true;
    if (node.tagName.toLowerCase() === 'canvas') {
      const w = Number(node.width || 0);
      const h = Number(node.height || 0);
      return w > 0 && h > 0;
    }
    return true;
  }

  function mountQRInstance(config) {
    container.innerHTML = '';
    qrInstance = new QRCodeStyling(config);
    qrInstance.append(container);
    return qrInstance;
  }

  async function renderNow() {
    if (!container) return;
    sanitizeImageOptions();
    const config = buildConfig();
    const needsFresh = !!config.image || !qrInstance;
    if (needsFresh) {
      mountQRInstance(config);
    } else {
      container.innerHTML = '';
      qrInstance.update(config);
      qrInstance.append(container);
    }
    if (config.image) await warmQRRender(qrInstance);
    if (!hasPreviewGraphic(container)) throw new Error('preview_render_failed');
    updateFrameDOM();
  }

  function render() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      renderNow().catch(() => {
        invalidateQRInstance();
        if (!container) return;
        try {
          mountQRInstance(buildConfig());
          updateFrameDOM();
        } catch {
          container.innerHTML = '';
        }
      });
    }, 150);
  }

  function getFrameLabelText() {
    if (styleOptions.customFrameLabel?.trim()) return styleOptions.customFrameLabel.trim();
    const frame = FRAMES[styleOptions.activeFrame];
    return frame?.showLabel ? (frame.labelText || 'Scan Me') : '';
  }

  function updateFrameDOM() {
    const frameEl = document.getElementById('qr-frame');
    const labelEl = document.getElementById('frame-label');
    if (!frameEl) return;

    const frame = FRAMES[styleOptions.activeFrame] || FRAMES.none;
    frameEl.className = 'qr-frame ' + frame.className;

    if (styleOptions.useCustomFrameColors) {
      const fc = styleOptions.frameColors;
      frameEl.style.setProperty('--frame-border', fc.border);
      frameEl.style.setProperty('--frame-bg', fc.background);
      frameEl.style.setProperty('--frame-label', fc.label);
      frameEl.classList.add('qr-frame--custom-colors');
    } else {
      frameEl.classList.remove('qr-frame--custom-colors');
      frameEl.style.removeProperty('--frame-border');
      frameEl.style.removeProperty('--frame-bg');
      frameEl.style.removeProperty('--frame-label');
    }

    if (styleOptions.activeFrame === 'banner' || styleOptions.useCustomFrameColors) {
      const fc = styleOptions.frameColors;
      frameEl.style.setProperty('--frame-banner-from', fc.bannerFrom);
      frameEl.style.setProperty('--frame-banner-to', fc.bannerTo);
    } else {
      frameEl.style.removeProperty('--frame-banner-from');
      frameEl.style.removeProperty('--frame-banner-to');
    }

    const labelText = getFrameLabelText();
    if (labelEl) {
      labelEl.hidden = !labelText;
      labelEl.textContent = labelText;
    }
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function applyStyleCombo(comboId) {
    const combo = STYLE_COMBOS.find(c => c.id === comboId);
    if (!combo) return;
    styleOptions.dotsOptions.type = combo.dots;
    styleOptions.cornersSquareOptions.type = combo.cornerSq;
    styleOptions.cornersDotOptions.type = combo.cornerDot;
    styleOptions.activeTheme = 'custom';
    syncStylePickerActiveStates();
    render();
  }

  function applyStylePart(partKey, type) {
    styleOptions[partKey].type = type;
    styleOptions.activeTheme = 'custom';
    syncStylePickerActiveStates();
    render();
  }

  function stylePreviewCells(shape) {
    const cells = Array.from({ length: 9 }, (_, i) => {
      const on = [0, 1, 2, 3, 5, 6, 7, 8].includes(i);
      return `<span class="dot-style-preview__cell dot-style-preview__cell--${shape}${on ? ' dot-style-preview__cell--on' : ''}"></span>`;
    }).join('');
    return `<span class="dot-style-preview">${cells}</span>`;
  }

  function renderStylePickers() {
    const grids = [
      ['style-combo-grid', STYLE_COMBOS, (id) => applyStyleCombo(id), 'style-combo-btn', null],
      ['dot-style-grid', DOT_STYLES, (id) => applyStylePart('dotsOptions', id), 'dot-style-btn', () => styleOptions.dotsOptions.type],
      ['corner-square-style-grid', CORNER_SQUARE_STYLES, (id) => applyStylePart('cornersSquareOptions', id), 'dot-style-btn', () => styleOptions.cornersSquareOptions.type],
      ['corner-dot-style-grid', CORNER_DOT_STYLES, (id) => applyStylePart('cornersDotOptions', id), 'dot-style-btn', () => styleOptions.cornersDotOptions.type]
    ];

    grids.forEach(([containerId, items, onClick, btnClass, getActive]) => {
      const container = document.getElementById(containerId);
      if (!container) return;
      const activeId = getActive ? getActive() : null;
      container.innerHTML = '';
      items.forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = btnClass + (item.id === activeId ? ` ${btnClass}--active` : '');
        btn.title = item.label;
        if (containerId === 'style-combo-grid') {
          btn.innerHTML = `<span class="style-combo-preview">${stylePreviewCells('square')}</span><span class="dot-style-btn__label">${item.label}</span>`;
        } else {
          btn.innerHTML = `${stylePreviewCells(item.shape)}<span class="dot-style-btn__label">${item.label}</span>`;
        }
        btn.addEventListener('click', () => {
          container.querySelectorAll(`.${btnClass}`).forEach(b => b.classList.remove(`${btnClass}--active`));
          btn.classList.add(`${btnClass}--active`);
          onClick(item.id);
        });
        container.appendChild(btn);
      });
    });
  }

  function syncStylePickerActiveStates() {
    const map = [
      ['dot-style-grid', styleOptions.dotsOptions.type, DOT_STYLES],
      ['corner-square-style-grid', styleOptions.cornersSquareOptions.type, CORNER_SQUARE_STYLES],
      ['corner-dot-style-grid', styleOptions.cornersDotOptions.type, CORNER_DOT_STYLES]
    ];
    map.forEach(([id, active, list]) => {
      const container = document.getElementById(id);
      if (!container) return;
      container.querySelectorAll('.dot-style-btn').forEach(btn => {
        const label = btn.querySelector('.dot-style-btn__label')?.textContent;
        const item = list.find(s => s.label === label);
        btn.classList.toggle('dot-style-btn--active', item?.id === active);
      });
    });
  }

  function getCustomThemes() {
    try {
      const raw = localStorage.getItem(CUSTOM_THEMES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function persistCustomThemes(themes) {
    try {
      localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: 'storage_full' };
    }
  }

  function extractThemeStyle() {
    const style = exportStyleJSON();
    return JSON.parse(style);
  }

  function saveCustomTheme(name) {
    const trimmed = (name || '').trim();
    if (!trimmed) return { ok: false, error: 'name_required' };
    const themes = getCustomThemes();
    if (themes.length >= MAX_CUSTOM_THEMES) return { ok: false, error: 'limit' };
    const theme = {
      id: 'ct_' + Date.now(),
      name: trimmed,
      createdAt: new Date().toISOString(),
      style: extractThemeStyle()
    };
    themes.unshift(theme);
    const result = persistCustomThemes(themes);
    if (!result.ok) return result;
    renderCustomThemePresets(document.getElementById('custom-theme-presets'));
    return { ok: true, theme };
  }

  function deleteCustomTheme(id) {
    const themes = getCustomThemes().filter(t => t.id !== id);
    persistCustomThemes(themes);
    if (styleOptions.activeTheme === id) {
      styleOptions.activeTheme = 'custom';
    }
    renderCustomThemePresets(document.getElementById('custom-theme-presets'));
    refreshThemeHighlights();
  }

  function applyCustomTheme(id) {
    const theme = getCustomThemes().find(t => t.id === id);
    if (!theme?.style) return;
    importStyleJSON(JSON.stringify(theme.style));
    styleOptions.activeTheme = id;
    refreshThemeHighlights();
  }

  function renderCustomThemePresets(container) {
    if (!container) return;
    const themes = getCustomThemes();
    const emptyEl = document.getElementById('custom-theme-empty');
    if (emptyEl) emptyEl.hidden = themes.length > 0;
    container.innerHTML = '';
    themes.forEach(theme => {
      const wrap = document.createElement('div');
      wrap.className = 'custom-theme-item';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'custom-theme-btn' + (styleOptions.activeTheme === theme.id ? ' custom-theme-btn--active' : '');
      btn.dataset.themeId = theme.id;
      const swatchColor = theme.style?.dotsOptions?.color || '#0071e3';
      btn.innerHTML = `<span class="theme-btn__swatch"></span><span class="theme-btn__label">${escapeHtml(theme.name)}</span>`;
      const swatch = btn.querySelector('.theme-btn__swatch');
      swatch.style.background = /^#[0-9a-fA-F]{3,8}$/.test(swatchColor) ? swatchColor : '#0071e3';
      btn.addEventListener('click', () => applyCustomTheme(theme.id));
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'custom-theme-delete';
      del.title = 'Delete theme';
      del.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteCustomTheme(theme.id);
      });
      wrap.appendChild(btn);
      wrap.appendChild(del);
      container.appendChild(wrap);
    });
  }
  function initPreviewEl(el) {
    container = el;
    renderNow().catch(() => invalidateQRInstance());
  }
  function updateData(data) { styleOptions.data = data || ' '; render(); }
  function getStyleOptions() { return styleOptions; }

  function setStyleOptions(partial) {
    Object.assign(styleOptions, partial);
    render();
  }

  function updateStyle(key, value) {
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      if (!styleOptions[parent]) styleOptions[parent] = {};
      styleOptions[parent][child] = value;
    } else {
      styleOptions[key] = value;
    }
    styleOptions.activeTheme = 'custom';

    const frameOnly = key === 'customFrameLabel'
      || key === 'useCustomFrameColors'
      || key === 'activeFrame'
      || key.startsWith('frameColors.');
    if (frameOnly) {
      updateFrameDOM();
      return;
    }
    render();
  }

  function applyTheme(themeId) {
    const theme = THEMES[themeId];
    if (!theme) return;
    styleOptions.activeTheme = themeId;
    styleOptions.dotsOptions = { ...styleOptions.dotsOptions, ...theme.dotsOptions };
    styleOptions.cornersSquareOptions = { ...styleOptions.cornersSquareOptions, ...theme.cornersSquareOptions };
    styleOptions.cornersDotOptions = { ...styleOptions.cornersDotOptions, ...theme.cornersDotOptions };
    styleOptions.backgroundOptions = { ...styleOptions.backgroundOptions, ...theme.backgroundOptions };
    styleOptions.unifiedColors = false;
    styleOptions.colorMode = 'solid';
    styleOptions.bgColorMode = 'solid';
    styleOptions.transparentBg = false;
    syncUIControls();
    refreshThemeHighlights();
    render();
  }

  function applyFrame(frameId) {
    styleOptions.activeFrame = frameId;
    updateFrameDOM();
    syncUIControls();
  }

  function syncUIControls() {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    const setCheck = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };

    set('qr-size', styleOptions.width);
    set('qr-margin', styleOptions.margin);
    set('error-correction', styleOptions.qrOptions.errorCorrectionLevel);
    setCheck('transparent-bg', styleOptions.transparentBg);
    setCheck('unified-colors', styleOptions.unifiedColors);
    set('gradient-rotation', styleOptions.gradientRotation);
    set('bg-gradient-rotation', styleOptions.bgGradientRotation);

    syncStylePickerActiveStates();

    const sizeVal = document.getElementById('qr-size-val');
    if (sizeVal) sizeVal.textContent = styleOptions.width + 'px';
    const marginVal = document.getElementById('qr-margin-val');
    if (marginVal) marginVal.textContent = styleOptions.margin;
    const gradVal = document.getElementById('gradient-rotation-val');
    if (gradVal) gradVal.textContent = styleOptions.gradientRotation + '°';
    const bgGradVal = document.getElementById('bg-gradient-rotation-val');
    if (bgGradVal) bgGradVal.textContent = styleOptions.bgGradientRotation + '°';

    document.querySelectorAll('input[name="color-mode"]').forEach(r => { r.checked = r.value === styleOptions.colorMode; });
    document.querySelectorAll('input[name="bg-color-mode"]').forEach(r => { r.checked = r.value === styleOptions.bgColorMode; });

    const hide = (id, h) => { const el = document.getElementById(id); if (el) el.hidden = h; };
    hide('fg-color2-wrap', styleOptions.colorMode === 'solid');
    hide('bg-color2-wrap', styleOptions.bgColorMode === 'solid');
    hide('corner-colors-wrap', styleOptions.unifiedColors);
    hide('gradient-rotation-wrap', styleOptions.colorMode !== 'linear');
    hide('bg-gradient-rotation-wrap', styleOptions.bgColorMode !== 'linear');

    const pickrMap = {
      fg: styleOptions.dotsOptions.color, fg2: styleOptions.fgColor2,
      bg: styleOptions.backgroundOptions.color, bg2: styleOptions.bgColor2,
      cornerSq: styleOptions.cornersSquareOptions.color,
      cornerDot: styleOptions.cornersDotOptions.color
    };
    Object.entries(pickrMap).forEach(([k, c]) => { if (pickrInstances[k]) pickrInstances[k].setColor(c); });
  }

  const PICKR_KEYS = {
    'dotsOptions.color': 'fg', fgColor2: 'fg2', 'backgroundOptions.color': 'bg', bgColor2: 'bg2',
    'cornersSquareOptions.color': 'cornerSq', 'cornersDotOptions.color': 'cornerDot'
  };

  function initPickr() {
    const configs = [
      ['#fg-color-picker', 'dotsOptions.color', styleOptions.dotsOptions.color],
      ['#fg-color2-picker', 'fgColor2', styleOptions.fgColor2],
      ['#bg-color-picker', 'backgroundOptions.color', styleOptions.backgroundOptions.color],
      ['#bg-color2-picker', 'bgColor2', styleOptions.bgColor2],
      ['#corner-square-color-picker', 'cornersSquareOptions.color', styleOptions.cornersSquareOptions.color],
      ['#corner-dot-color-picker', 'cornersDotOptions.color', styleOptions.cornersDotOptions.color]
    ];

    configs.forEach(([sel, key, defColor]) => {
      const el = document.querySelector(sel);
      if (!el) return;
      const pickrKey = PICKR_KEYS[key];
      pickrInstances[pickrKey] = Pickr.create({
        el: sel, theme: 'nano', default: defColor,
        swatches: ['#000', '#fff', '#0071e3', '#ef4444', '#22c55e', '#2196f3', '#f59e0b', '#ec4899', '#14b8a6'],
        components: { preview: true, opacity: true, hue: true, interaction: { hex: true, rgba: true, input: true, save: true } }
      }).on('save', (color) => {
        updateStyle(key, color.toHEXA().toString());
        pickrInstances[pickrKey].hide();
      });
    });
  }

  function getQRInstance() { return qrInstance; }

  function createInstance(data, options = {}) {
    const savedData = styleOptions.data;
    if (options.width || options.height) {
      const config = buildConfig({ data: data || ' ', width: options.width, height: options.height });
      return new QRCodeStyling(config);
    }
    const config = buildConfig({ data: data || ' ' });
    styleOptions.data = savedData;
    return new QRCodeStyling(config);
  }

  function exportStyleJSON() {
    const exportable = { ...styleOptions };
    delete exportable.data;
    return JSON.stringify(exportable, null, 2);
  }

  function getStyleSnapshot() {
    return JSON.parse(exportStyleJSON());
  }

  function importStyleJSON(json) {
    const parsed = JSON.parse(json);
    delete parsed.data;
    const def = cloneDefaultStyle();
    styleOptions = {
      ...def, ...parsed,
      dotsOptions: { ...def.dotsOptions, ...(parsed.dotsOptions || {}) },
      cornersSquareOptions: { ...def.cornersSquareOptions, ...(parsed.cornersSquareOptions || {}) },
      cornersDotOptions: { ...def.cornersDotOptions, ...(parsed.cornersDotOptions || {}) },
      backgroundOptions: { ...def.backgroundOptions, ...(parsed.backgroundOptions || {}) },
      imageOptions: { ...def.imageOptions, ...(parsed.imageOptions || {}) },
      qrOptions: { ...def.qrOptions, ...(parsed.qrOptions || {}) },
      frameColors: { ...def.frameColors, ...(parsed.frameColors || {}) }
    };
    styleOptions.image = parsed.image || null;
    sanitizeImageOptions();
    invalidateQRInstance();
    syncUIControls();
    renderCustomThemePresets(document.getElementById('custom-theme-presets'));
    refreshThemeHighlights();
    render();
  }

  function resetStyle() {
    const data = styleOptions.data;
    styleOptions = cloneDefaultStyle();
    styleOptions.data = data;
    syncUIControls();
    renderCustomThemePresets(document.getElementById('custom-theme-presets'));
    refreshThemeHighlights();
    render();
  }

  function downloadStylePreset() {
    const blob = new Blob([exportStyleJSON()], { type: 'application/json' });
    saveAs(blob, `qr-style-${new Date().toISOString().slice(0, 10)}.json`);
  }

  function renderThemePresets(container) {
    container.innerHTML = '';
    Object.entries(THEMES).forEach(([id, theme]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.themeId = id;
      btn.className = 'theme-btn' + (id === styleOptions.activeTheme ? ' theme-btn--active' : '');
      btn.innerHTML = `<span class="theme-btn__swatch" style="background:${theme.dotsOptions.color}"></span><span class="theme-btn__label">${theme.label}</span>`;
      btn.addEventListener('click', () => {
        container.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('theme-btn--active'));
        document.querySelectorAll('#custom-theme-presets .custom-theme-btn').forEach(b => b.classList.remove('custom-theme-btn--active'));
        btn.classList.add('theme-btn--active');
        applyTheme(id);
      });
      container.appendChild(btn);
    });
  }

  function refreshThemeHighlights() {
    document.querySelectorAll('#theme-presets .theme-btn').forEach(b => {
      b.classList.toggle('theme-btn--active', b.dataset.themeId === styleOptions.activeTheme);
    });
    document.querySelectorAll('#custom-theme-presets .custom-theme-btn').forEach(b => {
      b.classList.toggle('custom-theme-btn--active', b.dataset.themeId === styleOptions.activeTheme);
    });
  }

  function refreshFrameHighlights() {
    document.querySelectorAll('#frame-presets .frame-btn').forEach(b => {
      b.classList.toggle('frame-btn--active', b.dataset.frameId === styleOptions.activeFrame);
    });
  }

  function applyTemplateStyle(stylePartial) {
    if (!stylePartial) return;
    const def = cloneDefaultStyle();
    const currentData = styleOptions.data;
    styleOptions = {
      ...def, ...stylePartial,
      data: currentData,
      dotsOptions: { ...def.dotsOptions, ...(stylePartial.dotsOptions || {}) },
      cornersSquareOptions: { ...def.cornersSquareOptions, ...(stylePartial.cornersSquareOptions || {}) },
      cornersDotOptions: { ...def.cornersDotOptions, ...(stylePartial.cornersDotOptions || {}) },
      backgroundOptions: { ...def.backgroundOptions, ...(stylePartial.backgroundOptions || {}) },
      imageOptions: { ...def.imageOptions, ...(stylePartial.imageOptions || {}) },
      qrOptions: { ...def.qrOptions, ...(stylePartial.qrOptions || {}) },
      frameColors: { ...def.frameColors, ...(stylePartial.frameColors || {}) }
    };
    styleOptions.activeTheme = 'custom';
    styleOptions.image = stylePartial.image || null;
    sanitizeImageOptions();
    invalidateQRInstance();
    syncUIControls();
    refreshThemeHighlights();
    refreshFrameHighlights();
    updateFrameDOM();
    render();
  }

  function renderFramePresets(container) {
    container.innerHTML = '';
    Object.entries(FRAMES).forEach(([id, frame]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.frameId = id;
      btn.className = 'frame-btn' + (id === styleOptions.activeFrame ? ' frame-btn--active' : '');
      btn.textContent = frame.label;
      btn.addEventListener('click', () => {
        container.querySelectorAll('.frame-btn').forEach(b => b.classList.remove('frame-btn--active'));
        btn.classList.add('frame-btn--active');
        applyFrame(id);
      });
      container.appendChild(btn);
    });
  }

  return {
    THEMES, FRAMES, DOT_STYLES, STYLE_COMBOS, initPreviewEl, initPickr, updateData, updateStyle, setStyleOptions,
    getStyleOptions, getStyleSnapshot, applyTheme, applyFrame, getQRInstance,
    createInstance, renderThemePresets, renderFramePresets, renderStylePickers, renderCustomThemePresets,
    saveCustomTheme, deleteCustomTheme, applyCustomTheme, render, renderNow,
    exportStyleJSON, importStyleJSON, resetStyle, downloadStylePreset, getFrameLabelText,
    buildConfig, syncUIControls, refreshThemeHighlights, refreshFrameHighlights, applyTemplateStyle
  };
})();
