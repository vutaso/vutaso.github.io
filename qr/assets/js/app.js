/**
 * Main App — state, form builder, validation, i18n, analytics
 */
(function () {
  'use strict';

  const state = {
    typeId: 'url',
    formData: {},
    batchMode: false,
    validation: { valid: true, errors: {} }
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function showToast(message, type = 'success') {
    const toast = $('#toast');
    toast.textContent = message;
    toast.className = `toast toast--${type}`;
    toast.hidden = false;
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => { toast.hidden = true; }, 3000);
  }

  function typeLabel(type) {
    const key = 'type.' + type.id;
    const translated = typeof I18n !== 'undefined' ? I18n.t(key) : null;
    return translated && translated !== key ? translated : type.label;
  }

  /* ── Theme ── */
  function initTheme() {
    const stored = localStorage.getItem('qr-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('qr-theme', next);
    updateThemeIcon(next);
  }

  function updateThemeIcon(theme) {
    const icon = $('#theme-toggle i');
    if (icon) icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }

  /* ── Language ── */
  function initLangToggle() {
    $$('[data-lang]').forEach((btn) => {
      btn.addEventListener('click', () => {
        I18n.setLang(btn.dataset.lang);
        updateLangButtons();
        renderTypeSelector();
        const type = getTypeById(state.typeId);
        $('#form-title').textContent = typeLabel(type) + I18n.t('contentSuffix');
        renderForm();
        applyValidationUI();
      });
    });
    updateLangButtons();
    document.addEventListener('i18n:change', updateLangButtons);
  }

  function updateLangButtons() {
    const lang = I18n.getLang();
    $$('[data-lang]').forEach((btn) => {
      btn.classList.toggle('lang-btn--active', btn.dataset.lang === lang);
      btn.setAttribute('aria-pressed', btn.dataset.lang === lang);
    });
  }

  /* ── Type Selector ── */
  function renderTypeSelector() {
    const nav = $('#type-selector');
    nav.innerHTML = '';
    QR_TYPES.forEach((type) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'type-btn' + (type.id === state.typeId ? ' type-btn--active' : '');
      btn.dataset.type = type.id;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', type.id === state.typeId);
      btn.innerHTML = `<i class="fa-solid ${type.icon}" aria-hidden="true"></i><span>${typeLabel(type)}</span>`;
      btn.addEventListener('click', () => selectType(type.id));
      nav.appendChild(btn);
    });
  }

  function selectType(typeId) {
    state.typeId = typeId;
    const type = getTypeById(typeId);
    state.formData = { ...type.defaultData };
    renderTypeSelector();
    renderForm();
    updateQR();
    $('#form-title').textContent = typeLabel(type) + I18n.t('contentSuffix');
    QRAnalytics.track('select_type', { type: typeId });
  }

  /* ── Form ── */
  function bindFormEvents() {
    $('#qr-form').addEventListener('input', onFormChange);
    $('#qr-form').addEventListener('change', onFormChange);
  }

  function renderForm() {
    const form = $('#qr-form');
    const type = getTypeById(state.typeId);
    form.innerHTML = '';

    type.fields.forEach((field) => {
      if (field.showWhen) {
        const [key, val] = Object.entries(field.showWhen)[0];
        if (state.formData[key] !== val) return;
      }

      const group = document.createElement('div');
      group.className = 'form-group';
      group.dataset.field = field.name;

      if (field.type === 'checkbox') {
        group.innerHTML = `
          <label class="checkbox-label">
            <input type="checkbox" name="${field.name}" ${state.formData[field.name] ? 'checked' : ''}>
            ${field.label}
          </label>`;
      } else {
        const req = field.required ? ' <span class="required">*</span>' : '';
        group.innerHTML = `<label for="field-${field.name}">${field.label}${req}</label>`;

        if (field.type === 'select') {
          const opts = field.options.map(o =>
            `<option value="${o.value}" ${state.formData[field.name] === o.value ? 'selected' : ''}>${o.label}</option>`
          ).join('');
          group.innerHTML += `<select id="field-${field.name}" name="${field.name}" class="select">${opts}</select>`;
        } else if (field.type === 'textarea') {
          group.innerHTML += `<textarea id="field-${field.name}" name="${field.name}" class="textarea" placeholder="${field.placeholder || ''}" rows="3">${escapeHtml(state.formData[field.name] || '')}</textarea>`;
        } else {
          group.innerHTML += `<input id="field-${field.name}" name="${field.name}" type="${field.type}" class="input" placeholder="${field.placeholder || ''}" value="${escapeAttr(state.formData[field.name] || '')}">`;
        }
        group.innerHTML += `<span class="field-error" id="error-${field.name}" role="alert"></span>`;
      }

      form.appendChild(group);
    });

    applyValidationUI();
  }

  function onFormChange(e) {
    const target = e.target;
    const name = target.name;
    if (!name) return;

    state.formData[name] = target.type === 'checkbox' ? target.checked : target.value;
    if (name === 'mode' || name === 'showUtm') renderForm();
    updateQR();
  }

  function escapeAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ── Validation ── */
  function applyValidationUI() {
    const { valid, errors } = state.validation;
    const banner = $('#form-errors');

    $$('.form-group[data-field]').forEach((group) => {
      const name = group.dataset.field;
      const input = group.querySelector('.input, .select, .textarea');
      const errEl = group.querySelector('.field-error');
      const err = errors[name];

      if (input) input.classList.toggle('input--error', !!err);
      if (errEl) {
        errEl.textContent = err ? I18n.errorMsg(err) : '';
        errEl.hidden = !err;
      }
    });

    if (banner) {
      if (errors._form && !valid) {
        banner.hidden = false;
        banner.textContent = I18n.errorMsg(errors._form);
      } else {
        banner.hidden = true;
      }
    }

    const exportBtns = $$('[data-export], #copy-btn, #share-btn');
    exportBtns.forEach((btn) => {
      btn.disabled = !valid;
      btn.setAttribute('aria-disabled', !valid);
    });

    $('#qr-preview').classList.toggle('qr-preview--invalid', !valid);
  }

  let historyAddTimer = null;

  function updateQR() {
    state.validation = QRValidation.validate(state.typeId, state.formData);
    applyValidationUI();

    if (state.validation.valid) {
      QRCustomizer.updateData(state.validation.encoded);
      $('#encoded-output').value = state.validation.encoded;

      clearTimeout(historyAddTimer);
      const encoded = state.validation.encoded;
      const typeId = state.typeId;
      const formSnapshot = { ...state.formData };
      historyAddTimer = setTimeout(() => {
        const last = QRHistory.load()[0];
        if (!last || last.encoded !== encoded || last.typeId !== typeId) {
          QRHistory.add({ typeId, formData: formSnapshot, encoded });
        }
      }, 800);
    } else {
      QRCustomizer.updateData(' ');
      $('#encoded-output').value = '';
    }

    const style = QRCustomizer.getStyleOptions();
    QRScanTips.render(style, !!style.image);
  }

  function requireValid(action) {
    if (!state.validation.valid) {
      showToast(I18n.t('toast.invalid'), 'error');
      return false;
    }
    return true;
  }

  /* ── Customizer ── */
  function initCustomizerControls() {
    $$('input[name="color-mode"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        QRCustomizer.updateStyle('colorMode', e.target.value);
        QRCustomizer.syncUIControls();
      });
    });

    $$('input[name="bg-color-mode"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        QRCustomizer.updateStyle('bgColorMode', e.target.value);
        QRCustomizer.syncUIControls();
      });
    });

    $('#transparent-bg').addEventListener('change', (e) => QRCustomizer.updateStyle('transparentBg', e.target.checked));

    $('#unified-colors').addEventListener('change', (e) => {
      QRCustomizer.updateStyle('unifiedColors', e.target.checked);
      QRCustomizer.syncUIControls();
    });

    $('#use-custom-frame-colors').addEventListener('change', (e) => {
      QRCustomizer.updateStyle('useCustomFrameColors', e.target.checked);
      QRCustomizer.syncUIControls();
    });

    $('#custom-frame-label').addEventListener('input', (e) => {
      QRCustomizer.updateStyle('customFrameLabel', e.target.value);
    });

    $('#custom-theme-name').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        $('#custom-theme-save').click();
      }
    });

    $('#gradient-rotation').addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      $('#gradient-rotation-val').textContent = val + '°';
      QRCustomizer.updateStyle('gradientRotation', val);
    });

    $('#bg-gradient-rotation').addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      $('#bg-gradient-rotation-val').textContent = val + '°';
      QRCustomizer.updateStyle('bgGradientRotation', val);
    });

    $('#style-save').addEventListener('click', () => {
      QRCustomizer.downloadStylePreset();
      showToast(I18n.t('toast.download'));
    });

    $('#style-load').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          QRCustomizer.importStyleJSON(ev.target.result);
          showToast('Style loaded!');
        } catch {
          showToast('Invalid style file', 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    $('#style-reset').addEventListener('click', () => {
      QRCustomizer.resetStyle();
      showToast('Style reset');
    });

    $('#custom-theme-save').addEventListener('click', () => {
      const name = $('#custom-theme-name').value;
      const result = QRCustomizer.saveCustomTheme(name);
      if (!result.ok) {
        const key = result.error === 'limit'
          ? 'customTheme.limit'
          : result.error === 'storage_full'
            ? 'customTheme.storageFull'
            : 'customTheme.nameRequired';
        showToast(I18n.t(key), 'error');
        return;
      }
      $('#custom-theme-name').value = '';
      showToast(I18n.t('customTheme.saved'));
    });

    $('#qr-size').addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      $('#qr-size-val').textContent = val + 'px';
      QRCustomizer.setStyleOptions({ width: val, height: val });
      QRScanTips.render(QRCustomizer.getStyleOptions(), !!QRCustomizer.getStyleOptions().image);
    });

    $('#qr-margin').addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      $('#qr-margin-val').textContent = val;
      QRCustomizer.updateStyle('margin', val);
    });

    $('#error-correction').addEventListener('change', (e) => QRCustomizer.updateStyle('qrOptions.errorCorrectionLevel', e.target.value));

    $('#logo-size').addEventListener('input', (e) => {
      $('#logo-size-val').textContent = e.target.value + '%';
      QRCustomizer.updateStyle('imageOptions.imageSize', parseInt(e.target.value, 10) / 100);
    });

    $('#logo-margin').addEventListener('input', (e) => {
      $('#logo-margin-val').textContent = e.target.value + 'px';
      QRCustomizer.updateStyle('imageOptions.margin', parseInt(e.target.value, 10));
    });

    $('#logo-hide-bg').addEventListener('change', (e) => QRCustomizer.updateStyle('imageOptions.hideBackgroundDots', e.target.checked));

    $('#logo-upload').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const check = QRValidation.validateLogoFile(file);
      if (!check.valid) {
        showToast(I18n.errorMsg(check.error === 'too_large' ? 'logo_too_large' : 'logo_invalid'), 'error');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        QRCustomizer.setLogo(ev.target.result);
        $('#logo-remove').hidden = false;
      };
      reader.readAsDataURL(file);
    });

    $('#logo-remove').addEventListener('click', () => {
      QRCustomizer.removeLogo();
      $('#logo-upload').value = '';
      $('#logo-remove').hidden = true;
    });

    QRCustomizer.initPickr();
    QRCustomizer.renderStylePickers();
    QRCustomizer.renderThemePresets($('#theme-presets'));
    QRCustomizer.renderCustomThemePresets($('#custom-theme-presets'));
    QRCustomizer.renderFramePresets($('#frame-presets'));
    QRCustomizer.syncUIControls();

    const sizeSlider = $('#qr-size');
    if (sizeSlider && typeof QRPro !== 'undefined') {
      sizeSlider.max = QRPro.getMaxQrSize();
    }

    document.addEventListener('pro:change', () => {
      if (sizeSlider) sizeSlider.max = QRPro.getMaxQrSize();
      QRScanTips.render(QRCustomizer.getStyleOptions(), !!QRCustomizer.getStyleOptions().image);
    });
  }

  /* ── Export ── */
  function initExport() {
    $$('[data-export]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!requireValid()) return;
        const qr = QRCustomizer.getQRInstance();
        if (!qr) return;

        const format = btn.dataset.export;
        const scale = parseInt(btn.dataset.scale || '1', 10);

        try {
          if (format === 'png') await QRExporter.downloadPNG(qr, scale);
          else if (format === 'svg') QRExporter.downloadSVG(qr);
          else if (format === 'jpeg') await QRExporter.downloadJPEG(qr);
          else if (format === 'pdf') await QRExporter.downloadPDF(qr, typeLabel(getTypeById(state.typeId)) + ' QR');
          showToast(I18n.t('toast.download'));
          QRAnalytics.track('export', { format, scale });
        } catch (err) {
          showToast(I18n.t('toast.exportFail') + ': ' + err.message, 'error');
        }
      });
    });

    $('#copy-btn').addEventListener('click', async () => {
      if (!requireValid()) return;
      try {
        await QRExporter.copyToClipboard(QRCustomizer.getQRInstance());
        showToast(I18n.t('toast.copy'));
        QRAnalytics.track('export', { format: 'clipboard' });
      } catch (err) {
        showToast(I18n.t('toast.exportFail') + ': ' + err.message, 'error');
      }
    });

    $('#share-btn').addEventListener('click', async () => {
      if (!requireValid()) return;
      try {
        await QRExporter.shareQR(QRCustomizer.getQRInstance());
        showToast(I18n.t('toast.share'));
        QRAnalytics.track('export', { format: 'share' });
      } catch (err) {
        if (err.name !== 'AbortError') showToast(I18n.t('toast.exportFail'), 'error');
      }
    });
  }

  /* ── Batch ── */
  function setBatchProgress(current, total) {
    const wrap = $('#batch-progress');
    const bar = $('#batch-progress-bar');
    const label = $('#batch-progress-label');
    if (!wrap || !bar) return;

    wrap.hidden = false;
    const pct = Math.round((current / total) * 100);
    bar.style.width = pct + '%';
    label.textContent = I18n.t('batch.progress', { current, total });
  }

  function hideBatchProgress() {
    const wrap = $('#batch-progress');
    if (wrap) wrap.hidden = true;
  }

  function initBatchMode() {
    const batchToggle = $('#batch-toggle');
    const singleMode = $('#single-mode');
    const batchMode = $('#batch-mode');

    batchToggle.addEventListener('click', () => {
      state.batchMode = !state.batchMode;
      batchToggle.setAttribute('aria-pressed', state.batchMode);
      singleMode.hidden = state.batchMode;
      batchMode.hidden = !state.batchMode;
      batchToggle.classList.toggle('btn--active', state.batchMode);
      QRAnalytics.track('toggle_batch', { enabled: state.batchMode });
    });

    $('#batch-parse').addEventListener('click', () => {
      const result = QRBatch.parseCSV($('#batch-csv').value);
      QRBatch.renderPreview($('#batch-preview'), result);

      const hasRows = result.rows.length > 0;
      $('#batch-download-png').disabled = !hasRows;
      $('#batch-download-svg').disabled = !hasRows;

      const msg = result.rows.length
        ? (result.truncated ? I18n.t('batch.truncated', { max: QRBatch.getMaxRows() }) : `✓ ${result.rows.length} QR`)
        : I18n.errorMsg('empty_payload');
      showToast(msg, result.rows.length ? 'success' : 'error');
      QRAnalytics.track('batch_parse', { count: result.rows.length });
    });

    async function zipDownload(format) {
      const rows = QRBatch.getParsedRows();
      if (!rows.length) return;

      $('#batch-download-png').disabled = true;
      $('#batch-download-svg').disabled = true;

      try {
        await QRBatch.downloadZip(format, setBatchProgress);
        showToast(I18n.t('toast.download'));
        QRAnalytics.track('batch_export', { format, count: rows.length });
      } catch (err) {
        showToast(I18n.t('toast.exportFail') + ': ' + err.message, 'error');
      } finally {
        hideBatchProgress();
        $('#batch-download-png').disabled = false;
        $('#batch-download-svg').disabled = false;
      }
    }

    $('#batch-download-png').addEventListener('click', () => zipDownload('png'));
    $('#batch-download-svg').addEventListener('click', () => zipDownload('svg'));
  }

  function applyQRTemplate(templateId) {
    const tpl = QRTemplates.getById(templateId);
    if (!tpl) return;

    clearTimeout(historyAddTimer);

    state.typeId = tpl.type;
    const type = getTypeById(tpl.type);
    state.formData = { ...type.defaultData, ...tpl.form };

    renderTypeSelector();
    renderForm();
    $('#form-title').textContent = typeLabel(type) + I18n.t('contentSuffix');

    QRCustomizer.applyTemplateStyle(tpl.style);
    updateQR();

    QRTemplates.setActive(templateId);
    showToast(I18n.t('templates.applied', { name: QRTemplates.getName(tpl) }));

    document.getElementById('qr-preview')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    QRAnalytics.track('apply_template', { id: templateId, category: tpl.cat });
  }

  function getTemplateIdFromUrl() {
    const q = new URLSearchParams(location.search).get('template');
    if (q) return q;
    const hash = location.hash;
    if (hash.startsWith('#template=')) return decodeURIComponent(hash.slice(10));
    if (hash.startsWith('#template/')) return decodeURIComponent(hash.slice(10));
    return null;
  }

  function initTemplates() {
    QRTemplates.init(applyQRTemplate);

    const fromUrl = getTemplateIdFromUrl();
    if (fromUrl && QRTemplates.getById(fromUrl)) {
      setTimeout(() => applyQRTemplate(fromUrl), 300);
    }
  }

  /* ── Init ── */
  function init() {
    I18n.init();
    initTheme();
    initLangToggle();
    QRAnalytics.initBanner();

    window.__showToast = showToast;
    window.__restoreQR = (item) => {
      if (!item) return;
      state.typeId = item.typeId;
      state.formData = { ...item.formData };
      renderTypeSelector();
      renderForm();
      updateQR();
      const type = getTypeById(item.typeId);
      $('#form-title').textContent = typeLabel(type) + I18n.t('contentSuffix');
    };

    $('#theme-toggle').addEventListener('click', toggleTheme);

    renderTypeSelector();
    selectType('url');

    bindFormEvents();
    QRCustomizer.initPreviewEl($('#qr-preview'));
    initCustomizerControls();
    initTemplates();
    initExport();
    initBatchMode();
    QRPro.initModal();
    QRHistory.init();

    QRAnalytics.track('page_view');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
