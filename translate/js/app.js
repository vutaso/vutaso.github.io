(function () {
  'use strict';

  // ===== DOM References =====
  const dom = {
    tabs: document.querySelectorAll('.tab'),
    panels: document.querySelectorAll('.tab-panel'),
    apiKeyInput: document.getElementById('apiKey'),
    saveApiKey: document.getElementById('saveApiKey'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingText: document.getElementById('loadingText'),
    loadingCancel: document.getElementById('loadingCancel'),

    // Text tab
    textSourceLang: document.getElementById('textSourceLang'),
    textTargetLang: document.getElementById('textTargetLang'),
    swapLangText: document.getElementById('swapLangText'),
    textInput: document.getElementById('textInput'),
    textResult: document.getElementById('textResult'),
    textCharCount: document.getElementById('textCharCount'),
    translateText: document.getElementById('translateText'),
    clearTextInput: document.getElementById('clearTextInput'),
    copyTextResult: document.getElementById('copyTextResult'),
    textTranslateProgress: document.getElementById('textTranslateProgress'),
    cancelTextTranslate: document.getElementById('cancelTextTranslate'),
    reuseTextResult: document.getElementById('reuseTextResult'),
    textDomain: document.getElementById('textDomain'),
    textTone: document.getElementById('textTone'),
    textGlossary: document.getElementById('textGlossary'),
    textContext: document.getElementById('textContext'),
    toggleTextAdvanced: document.getElementById('toggleTextAdvanced'),
    textAdvancedOptions: document.getElementById('textAdvancedOptions'),
    textDetectedLang: document.getElementById('textDetectedLang'),
    textUsage: document.getElementById('textUsage'),

    // File tab
    fileSourceLang: document.getElementById('fileSourceLang'),
    fileTargetLang: document.getElementById('fileTargetLang'),
    swapLangFile: document.getElementById('swapLangFile'),
    dropZone: document.getElementById('fileDropZone'),
    fileInput: document.getElementById('fileInput'),
    filePreview: document.getElementById('filePreview'),
    fileName: document.getElementById('fileName'),
    extractedText: document.getElementById('extractedText'),
    fileCharCount: document.getElementById('fileCharCount'),
    removeFile: document.getElementById('removeFile'),
    replaceFile: document.getElementById('replaceFile'),
    translateFile: document.getElementById('translateFile'),
    fileResult: document.getElementById('fileResult'),
    copyFileResult: document.getElementById('copyFileResult'),
    fileTranslateProgress: document.getElementById('fileTranslateProgress'),
    cancelFileTranslate: document.getElementById('cancelFileTranslate'),
    downloadFileTxt: document.getElementById('downloadFileTxt'),
    downloadFileDocx: document.getElementById('downloadFileDocx'),
    downloadFileDocxFormatted: document.getElementById('downloadFileDocxFormatted'),
    fileDomain: document.getElementById('fileDomain'),
    fileTone: document.getElementById('fileTone'),
    fileGlossary: document.getElementById('fileGlossary'),
    fileContext: document.getElementById('fileContext'),
    toggleFileAdvanced: document.getElementById('toggleFileAdvanced'),
    fileAdvancedOptions: document.getElementById('fileAdvancedOptions'),
    fileDetectedLang: document.getElementById('fileDetectedLang'),
    fileUsage: document.getElementById('fileUsage'),
    pageRangeRow: document.getElementById('pageRangeRow'),
    pageFrom: document.getElementById('pageFrom'),
    pageTo: document.getElementById('pageTo'),
    pageRangeInfo: document.getElementById('pageRangeInfo'),
    ocrPrompt: document.getElementById('ocrPrompt'),
    runOcr: document.getElementById('runOcr'),
    dismissOcr: document.getElementById('dismissOcr'),
    ocrPageRange: document.getElementById('ocrPageRange'),
    ocrPageFrom: document.getElementById('ocrPageFrom'),
    ocrPageTo: document.getElementById('ocrPageTo'),
    ocrPageInfo: document.getElementById('ocrPageInfo'),
    fileSingleArea: document.getElementById('fileSingleArea'),
    fileQueue: document.getElementById('fileQueue'),
    fileQueueList: document.getElementById('fileQueueList'),
    fileQueueSummary: document.getElementById('fileQueueSummary'),
    fileQueueCancel: document.getElementById('fileQueueCancel'),
    fileQueueClear: document.getElementById('fileQueueClear'),

    // Batch tab
    batchTargetLang: document.getElementById('batchTargetLang'),
    batchDomain: document.getElementById('batchDomain'),
    batchTone: document.getElementById('batchTone'),
    addBatchRow: document.getElementById('addBatchRow'),
    translateBatch: document.getElementById('translateBatch'),
    cancelBatch: document.getElementById('cancelBatch'),
    batchRows: document.getElementById('batchRows'),
    toggleBatchAdvanced: document.getElementById('toggleBatchAdvanced'),
    batchAdvancedOptions: document.getElementById('batchAdvancedOptions'),
    batchGlossary: document.getElementById('batchGlossary'),
    batchContext: document.getElementById('batchContext'),
    importBatchCsv: document.getElementById('importBatchCsv'),
    exportBatchCsv: document.getElementById('exportBatchCsv'),
    batchCsvInput: document.getElementById('batchCsvInput'),
    retryBatchFailed: document.getElementById('retryBatchFailed'),
    batchProgress: document.getElementById('batchProgress'),

    // History tab
    historyList: document.getElementById('historyList'),
    clearHistory: document.getElementById('clearHistory'),
    historySearch: document.getElementById('historySearch'),
    historyTypeFilter: document.getElementById('historyTypeFilter'),
    exportHistory: document.getElementById('exportHistory')

    // Theme toggle
  };

  const themeToggle = document.getElementById('themeToggle');

  let currentFileText = '';
  let currentFileName = '';
  let currentFileObject = null; // the loaded File itself (for keep-format .docx export)
  let currentFilePages = null; // per-page text for PDFs (page-range feature)
  let pendingOcrFile = null;   // scanned PDF waiting for a user-triggered OCR
  let pendingOcrNumPages = 0;  // total pages of pendingOcrFile (for the OCR range UI)
  let extractAbort = null;     // AbortController for file extraction / OCR
  let lastTextDetected = null; // auto-detected source lang of the last text translation
  let batchRowCounter = 0;
  let isLoading = false;

  // Multi-file queue (File tab): dropping/selecting >1 file switches the
  // File tab into a queue that extracts + translates each file in turn.
  let fileQueue = [];          // [{ id, file, status, text, error, detectedLang }]
  let fileQueueCounter = 0;
  let fileQueueRunning = false;

  // History tab filter state
  let historyQuery = '';
  let historyType = '';

  // Batch translations run this many rows concurrently — enough to be
  // noticeably faster, conservative enough to stay clear of rate limits.
  const BATCH_CONCURRENCY = 3;

  // ===== Initialize =====
  function init() {
    loadApiKey();
    setupThemeToggle();
    populateLanguageSelects(); // must run before loadPreferences sets values
    loadPreferences();
    setupTabSwitching();
    setupTextTab();
    setupFileTab();
    setupBatchTab();
    setupHistoryTab();
    setupGlossaryPersistence();
    wireGlossaryPresets();
  }

  // Build every language <select> from the single LANGUAGES list.
  // data-auto="Auto Detect" adds an auto option; data-default="English"
  // picks the initially selected value.
  function populateLanguageSelects() {
    document.querySelectorAll('[data-lang-select]').forEach(sel => {
      let html = '';
      if (sel.dataset.auto) {
        html += `<option value="auto">${escapeHtml(sel.dataset.auto)}</option>`;
      }
      html += LANGUAGES.map(l => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`).join('');
      sel.innerHTML = html;
      if (sel.dataset.default) {
        sel.value = sel.dataset.default;
      }
    });
  }

  // ===== Preferences (remember last language choices) =====
  const PREFS_KEY = 'translation_preferences';
  // Unsent text input survives reloads too — losing a long pasted text
  // on an accidental refresh is as annoying as losing settings.
  const TEXT_DRAFT_KEY = 'translation_text_draft';

  function loadPreferences() {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return;
      const prefs = JSON.parse(raw);

      if (prefs.textSourceLang) dom.textSourceLang.value = prefs.textSourceLang;
      if (prefs.textTargetLang) dom.textTargetLang.value = prefs.textTargetLang;
      if (prefs.textDomain) dom.textDomain.value = prefs.textDomain;
      if (prefs.textTone) dom.textTone.value = prefs.textTone;

      if (prefs.fileSourceLang) dom.fileSourceLang.value = prefs.fileSourceLang;
      if (prefs.fileTargetLang) dom.fileTargetLang.value = prefs.fileTargetLang;
      if (prefs.fileDomain) dom.fileDomain.value = prefs.fileDomain;
      if (prefs.fileTone) dom.fileTone.value = prefs.fileTone;

      if (prefs.batchTargetLang) dom.batchTargetLang.value = prefs.batchTargetLang;
      if (prefs.batchDomain) dom.batchDomain.value = prefs.batchDomain;
      if (prefs.batchTone) dom.batchTone.value = prefs.batchTone;

      // Glossary/context survive reloads (they take effort to write —
      // losing them on refresh was a recurring annoyance)
      if (prefs.textGlossary) dom.textGlossary.value = prefs.textGlossary;
      if (prefs.textContext) dom.textContext.value = prefs.textContext;
      if (prefs.fileGlossary) dom.fileGlossary.value = prefs.fileGlossary;
      if (prefs.fileContext) dom.fileContext.value = prefs.fileContext;
      if (prefs.batchGlossary) dom.batchGlossary.value = prefs.batchGlossary;
      if (prefs.batchContext) dom.batchContext.value = prefs.batchContext;
    } catch (e) {
      // Corrupted data — silently discard
      localStorage.removeItem(PREFS_KEY);
    }

    // Restore an unsent draft from the previous session
    try {
      const draft = localStorage.getItem(TEXT_DRAFT_KEY);
      if (draft) dom.textInput.value = draft;
    } catch (e) {
      // Storage unavailable — skip
    }
  }

  function savePreferences() {
    const prefs = {
      textSourceLang: dom.textSourceLang.value,
      textTargetLang: dom.textTargetLang.value,
      textDomain: dom.textDomain.value,
      textTone: dom.textTone.value,

      fileSourceLang: dom.fileSourceLang.value,
      fileTargetLang: dom.fileTargetLang.value,
      fileDomain: dom.fileDomain.value,
      fileTone: dom.fileTone.value,

      batchTargetLang: dom.batchTargetLang.value,
      batchDomain: dom.batchDomain.value,
      batchTone: dom.batchTone.value,

      textGlossary: dom.textGlossary.value,
      textContext: dom.textContext.value,
      fileGlossary: dom.fileGlossary.value,
      fileContext: dom.fileContext.value,
      batchGlossary: dom.batchGlossary.value,
      batchContext: dom.batchContext.value
    };
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (e) {
      // Storage full — ignore
    }
  }

  // Persist glossary/context on edit (the 'change' event fires on blur,
  // which is often enough — no need to save on every keystroke)
  function setupGlossaryPersistence() {
    [dom.textGlossary, dom.textContext, dom.fileGlossary, dom.fileContext,
      dom.batchGlossary, dom.batchContext]
      .forEach(el => el.addEventListener('change', savePreferences));
  }

  // ===== Glossary presets =====
  // Wires the Load/Save/Delete preset controls above every glossary
  // textarea (Text/File/Batch tabs). The preset list itself lives in
  // GlossaryPresets (localStorage) and is shared across all three tabs.
  function wireGlossaryPresets() {
    const controls = [...document.querySelectorAll('.glossary-preset-row')].map(row => {
      const select = row.querySelector('.glossary-preset-select');
      return {
        select,
        saveBtn: row.querySelector('.glossary-save-preset'),
        deleteBtn: row.querySelector('.glossary-delete-preset'),
        textarea: document.getElementById(select.dataset.target)
      };
    }).filter(c => c.select && c.saveBtn && c.deleteBtn && c.textarea);

    if (!controls.length || typeof GlossaryPresets === 'undefined') return;

    // Rebuild every select's options from storage, keeping each select's
    // current choice when that preset still exists.
    function refreshPresetSelects(keepSelection = true) {
      const names = Object.keys(GlossaryPresets.getAll()).sort((a, b) => a.localeCompare(b));
      controls.forEach(c => {
        const current = keepSelection ? c.select.value : '';
        c.select.innerHTML = '<option value="">Load preset…</option>' +
          names.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('');
        if (current && names.includes(current)) {
          c.select.value = current;
        }
        c.deleteBtn.disabled = !c.select.value;
      });
    }

    controls.forEach(c => {
      c.select.addEventListener('change', () => {
        const name = c.select.value;
        c.deleteBtn.disabled = !name;
        if (!name) return;
        const text = GlossaryPresets.getAll()[name];
        if (typeof text === 'string') {
          c.textarea.value = text;
          savePreferences();
          showToast(`Loaded preset "${name}"`, 'success');
        }
      });

      c.saveBtn.addEventListener('click', () => {
        const text = c.textarea.value.trim();
        if (!text) {
          showToast('Glossary is empty — nothing to save', 'error');
          return;
        }
        const name = (prompt('Preset name:', c.select.value || '') || '').trim();
        if (!name) return;
        const exists = GlossaryPresets.getAll()[name] !== undefined;
        if (exists && name !== c.select.value &&
            !confirm(`Preset "${name}" already exists. Overwrite it?`)) {
          return;
        }
        GlossaryPresets.save(name, text);
        refreshPresetSelects();
        c.select.value = name;
        c.deleteBtn.disabled = false;
        showToast(`Saved preset "${name}"`, 'success');
      });

      c.deleteBtn.addEventListener('click', () => {
        const name = c.select.value;
        if (!name) return;
        if (!confirm(`Delete preset "${name}"? The glossary text stays in the box.`)) return;
        GlossaryPresets.remove(name);
        refreshPresetSelects(false);
        showToast(`Deleted preset "${name}"`, 'success');
      });
    });

    refreshPresetSelects();
  }

  // ===== Theme Toggle =====
  function getTheme() {
    const saved = localStorage.getItem('translation_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  function setupThemeToggle() {
    const current = getTheme();
    applyTheme(current);

    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.hasAttribute('data-theme');
      const next = isDark ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem('translation_theme', next);
    });

    // Watch for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('translation_theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  // ===== API Key =====
  function loadApiKey() {
    const savedKey = Translator.getApiKey();
    if (savedKey) {
      dom.apiKeyInput.value = savedKey;
    }
  }

  dom.saveApiKey.addEventListener('click', async () => {
    const key = dom.apiKeyInput.value.trim();
    if (!key) {
      Translator.clearApiKey();
      showToast('API key cleared', 'success');
      return;
    }

    // Verify the key before saving — better to learn it's wrong now than
    // mid-translation. If verification itself can't run (network/server
    // hiccup), save anyway with a warning rather than blocking the user.
    dom.saveApiKey.classList.add('btn-loading');
    dom.saveApiKey.disabled = true;
    try {
      await Translator.validateApiKey(key);
      Translator.setApiKey(key);
      showToast('API key saved and verified', 'success');
    } catch (err) {
      if (err.unverified) {
        Translator.setApiKey(key);
      } else {
        dom.apiKeyInput.focus();
        dom.apiKeyInput.select();
      }
      showToast(err.message, 'error');
    } finally {
      dom.saveApiKey.classList.remove('btn-loading');
      dom.saveApiKey.disabled = false;
    }
  });

  // ===== Tabs =====
  function setupTabSwitching() {
    dom.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        if (isLoading) {
          showToast('Translation in progress. Please wait.', 'error');
          return;
        }
        const target = tab.dataset.tab;
        switchTab(target);
      });
    });
  }

  function switchTab(target) {
    dom.tabs.forEach(t => {
      const selected = t.dataset.tab === target;
      t.classList.toggle('active', selected);
      t.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
    dom.panels.forEach(p => p.classList.toggle('active', p.id === `tab-${target}`));
    if (target === 'history') refreshHistory();
  }

  // ===== Toast =====
  let toastTimeout = null;

  function showToast(message, type) {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
      toastTimeout = null;
    }
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    // Errors interrupt (assertive); success/info wait their turn (polite).
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    toast.textContent = message;
    document.body.appendChild(toast);

    toastTimeout = setTimeout(() => {
      toast.remove();
      toastTimeout = null;
    }, 3000);
  }

  // ===== Loading =====
  function setButtonLoading(btn, loading) {
    isLoading = loading;
    if (loading) {
      btn.classList.add('btn-loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('btn-loading');
      btn.disabled = false;
    }
  }

  // Keep overlay only for file extraction/OCR (no button to spin).
  // `cancellable` shows a Cancel button that aborts the in-flight work
  // through `extractAbort`.
  function showExtracting(show, cancellable = false) {
    if (show) {
      isLoading = true;
      dom.loadingText.textContent = 'Extracting text from file...';
      dom.loadingOverlay.classList.remove('hidden');
      dom.loadingCancel.classList.toggle('hidden', !cancellable);
      dom.loadingCancel.disabled = false;
    } else {
      isLoading = false;
      dom.loadingOverlay.classList.add('hidden');
      dom.loadingCancel.classList.add('hidden');
      extractAbort = null;
    }
  }

  // Show/hide a Cancel button next to its Translate button. The button is
  // re-enabled every time it is shown (it gets disabled on click so the
  // user can't cancel twice while the abort is still propagating).
  function showCancelButton(btn, show) {
    btn.classList.toggle('hidden', !show);
    if (show) btn.disabled = false;
  }

  function wireCancelButton(btn) {
    btn.addEventListener('click', () => {
      btn.disabled = true;
      Translator.cancel();
    });
  }

  // ===== Token usage display =====
  // Approximate deepseek-chat pricing (USD per 1M tokens, cache-miss
  // input rate) — check https://api-docs.deepseek.com/quick_start/pricing
  // for current rates. Displayed with "~" because actual cost depends on
  // cache hits and possible discounts.
  const PRICE_PER_MILLION_INPUT = 0.27;
  const PRICE_PER_MILLION_OUTPUT = 1.10;

  function estimateCost(usage) {
    return (usage.promptTokens / 1e6) * PRICE_PER_MILLION_INPUT +
      (usage.completionTokens / 1e6) * PRICE_PER_MILLION_OUTPUT;
  }

  function usageTitle(usage) {
    if (!usage || !usage.totalTokens) return '';
    return `${usage.promptTokens.toLocaleString()} input + ${usage.completionTokens.toLocaleString()} output tokens`;
  }

  function formatUsage(usage) {
    if (!usage || !usage.totalTokens) return '';
    return `${usage.totalTokens.toLocaleString()} tokens · ~$${estimateCost(usage).toFixed(4)}`;
  }

  // Streams arrive token-by-token, each carrying the FULL text so far —
  // writing all of it to the DOM per token is O(n²) on long translations.
  // Coalesce writes to at most one per animation frame instead; flush()
  // applies any queued write synchronously (before reading final state).
  function makeStreamRenderer(el) {
    let pending = null;
    let rafId = 0;
    const render = () => {
      rafId = 0;
      if (pending !== null) {
        el.textContent = pending;
        pending = null;
      }
    };
    return {
      push(text) {
        pending = text;
        if (!rafId) rafId = requestAnimationFrame(render);
      },
      flush() {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
        render();
      }
    };
  }

  // ===== Clipboard =====
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard', 'success');
    } catch {
      showToast('Failed to copy', 'error');
    }
  }

  // ===== Text Tab =====
  function setupTextTab() {
    // Toggle advanced options
    let textAdvancedVisible = false;
    dom.toggleTextAdvanced.addEventListener('click', () => {
      textAdvancedVisible = !textAdvancedVisible;
      dom.textAdvancedOptions.classList.toggle('hidden', !textAdvancedVisible);
      dom.toggleTextAdvanced.querySelector('.advanced-toggle-label').textContent =
        textAdvancedVisible ? 'Hide' : 'Advanced';
    });

    // Save preferences on language/domain/tone change
    dom.textSourceLang.addEventListener('change', () => {
      dom.textDetectedLang.textContent = '';
      savePreferences();
    });
    dom.textTargetLang.addEventListener('change', savePreferences);
    dom.textDomain.addEventListener('change', savePreferences);
    dom.textTone.addEventListener('change', savePreferences);

    // Character count & update copy button state
    let draftSaveTimer = null;
    dom.textInput.addEventListener('input', () => {
      const charCount = dom.textInput.value.length;
      const maxChars = Translator.MAX_CHARS;
      let warning = '';
      if (charCount > maxChars) {
        warning = ' 🔴 Exceeds limit';
      } else if (charCount > Translator.CHUNK_SIZE) {
        const parts = Math.ceil(charCount / Translator.CHUNK_SIZE);
        warning = ` ℹ️ Long text — will be translated in ~${parts} parts`;
      }
      dom.textCharCount.textContent = `${charCount.toLocaleString()} / ${maxChars.toLocaleString()} characters${warning}`;

      // Debounced draft auto-save (see TEXT_DRAFT_KEY)
      clearTimeout(draftSaveTimer);
      draftSaveTimer = setTimeout(() => {
        try {
          if (dom.textInput.value) {
            localStorage.setItem(TEXT_DRAFT_KEY, dom.textInput.value);
          } else {
            localStorage.removeItem(TEXT_DRAFT_KEY);
          }
        } catch (e) {
          // Storage full — drafts are a convenience, not critical
        }
      }, 400);
    });

    // Result change - update copy/reuse button state (locked while a
    // translation is streaming in, so partial text can't be copied)
    const updateTextResultCopyBtn = () => {
      const ready = !!dom.textResult.textContent && !isLoading;
      dom.copyTextResult.disabled = !ready;
      dom.reuseTextResult.disabled = !ready;
    };

    // Observe result changes
    const resultObserver = new MutationObserver(updateTextResultCopyBtn);
    resultObserver.observe(dom.textResult, { childList: true, characterData: true, subtree: true });

    // Clear input
    dom.clearTextInput.addEventListener('click', () => {
      dom.textInput.value = '';
      dom.textResult.textContent = '';
      dom.textDetectedLang.textContent = '';
      dom.textCharCount.textContent = '0 characters';
      try { localStorage.removeItem(TEXT_DRAFT_KEY); } catch (e) { /* ignore */ }
      updateTextResultCopyBtn();
    });

    // Reuse the translation as new input, reversing the language
    // direction — handy for back-and-forth conversations and for
    // checking a translation by translating it back.
    dom.reuseTextResult.addEventListener('click', () => {
      const resultText = dom.textResult.textContent;
      if (!resultText) return;

      const newSource = dom.textTargetLang.value;
      const oldSource = dom.textSourceLang.value === 'auto' ? lastTextDetected : dom.textSourceLang.value;
      // Fall back to the app's primary pair when the old source is
      // unknown (auto-detect never reported) or would collide.
      const newTarget = (oldSource && oldSource !== newSource)
        ? oldSource
        : (newSource === 'English' ? 'Vietnamese' : 'English');

      dom.textSourceLang.value = newSource;
      dom.textTargetLang.value = newTarget;
      savePreferences();

      dom.textInput.value = resultText;
      dom.textInput.dispatchEvent(new Event('input'));
      dom.textResult.textContent = '';
      dom.textDetectedLang.textContent = '';
      dom.textUsage.textContent = '';
      updateTextResultCopyBtn();
      dom.textInput.focus();
    });

    // Swap languages
    dom.swapLangText.addEventListener('click', () => {
      if (dom.textSourceLang.value === 'auto') {
        showToast('Set source language first before swapping', 'error');
        return;
      }
      const temp = dom.textSourceLang.value;
      dom.textSourceLang.value = dom.textTargetLang.value;
      dom.textTargetLang.value = temp;
      savePreferences();
    });

    // Translate
    dom.translateText.addEventListener('click', () => translateTextTab());
    wireCancelButton(dom.cancelTextTranslate);

    // Copy result
    dom.copyTextResult.addEventListener('click', () => {
      if (dom.textResult.textContent) {
        copyToClipboard(dom.textResult.textContent);
      } else {
        showToast('Nothing to copy', 'error');
      }
    });

    // Initial state (also refreshes the char count for a restored draft)
    updateTextResultCopyBtn();
    dom.textInput.dispatchEvent(new Event('input'));

    // Enter to translate (Ctrl+Enter)
    dom.textInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        translateTextTab();
      }
    });
  }

  async function translateTextTab() {
    const text = dom.textInput.value.trim();
    if (!text) {
      showToast('Please enter text to translate', 'error');
      return;
    }

    const sourceLang = dom.textSourceLang.value;
    const targetLang = dom.textTargetLang.value;

    if (sourceLang !== 'auto' && sourceLang === targetLang) {
      showToast('Source and target languages are the same', 'error');
      return;
    }

    const renderer = makeStreamRenderer(dom.textResult);

    try {
      setButtonLoading(dom.translateText, true);
      showCancelButton(dom.cancelTextTranslate, true);
      dom.textResult.textContent = '';
      dom.textDetectedLang.textContent = '';
      dom.textUsage.textContent = '';
      dom.textUsage.title = '';
      lastTextDetected = null;

      // Prepare translation options
      const options = {
        domain: dom.textDomain.value,
        tone: dom.textTone.value,
        glossary: dom.textGlossary.value,
        context: dom.textContext.value,
        onProgress: (p) => {
          dom.textTranslateProgress.textContent = p.total > 1
            ? `Translating part ${p.current}/${p.total}…`
            : '';
        },
        onStream: (s) => {
          renderer.push(s.text);
        },
        onDetectedLang: (lang) => {
          lastTextDetected = lang;
          dom.textDetectedLang.textContent = `Detected: ${lang}`;
        }
      };

      const result = await Translator.translate(text, sourceLang, targetLang, options);
      renderer.flush();
      if (result.detectedLang) lastTextDetected = result.detectedLang;
      dom.textResult.textContent = result.text;
      dom.textUsage.textContent = formatUsage(result.usage);
      dom.textUsage.title = usageTitle(result.usage);

      History.add({
        sourceLang: sourceLang === 'auto' ? (result.detectedLang || 'Auto') : sourceLang,
        targetLang,
        sourceText: text,
        translatedText: result.text,
        type: 'text',
        domain: options.domain
      });

      if (result.truncated) {
        showToast('Part of the output was truncated by the API length limit', 'error');
      }
    } catch (err) {
      // Show the newest partial text that may still be queued in the renderer
      renderer.flush();
      if (err.cancelled) {
        // Keep whatever partial translation already streamed into the
        // result area — the user may still want to copy it.
        showToast('Translation cancelled', 'success');
      } else {
        if (err.message.includes('API key')) {
          dom.apiKeyInput.focus();
          dom.apiKeyInput.select();
        }
        showToast(err.message, 'error');
      }
    } finally {
      showCancelButton(dom.cancelTextTranslate, false);
      dom.textTranslateProgress.textContent = '';
      setButtonLoading(dom.translateText, false);
      dom.copyTextResult.disabled = !dom.textResult.textContent;
      dom.reuseTextResult.disabled = !dom.textResult.textContent;
    }
  }

  // ===== File Tab =====
  function setupFileTab() {
    // Toggle advanced options
    let fileAdvancedVisible = false;
    dom.toggleFileAdvanced.addEventListener('click', () => {
      fileAdvancedVisible = !fileAdvancedVisible;
      dom.fileAdvancedOptions.classList.toggle('hidden', !fileAdvancedVisible);
      dom.toggleFileAdvanced.querySelector('.advanced-toggle-label').textContent =
        fileAdvancedVisible ? 'Hide' : 'Advanced';
    });

    // Save preferences on language/domain/tone change
    dom.fileSourceLang.addEventListener('change', () => {
      dom.fileDetectedLang.textContent = '';
      savePreferences();
    });
    dom.fileTargetLang.addEventListener('change', savePreferences);
    dom.fileDomain.addEventListener('change', savePreferences);
    dom.fileTone.addEventListener('change', savePreferences);

    // Click to upload
    dom.dropZone.addEventListener('click', () => dom.fileInput.click());
    // Keyboard activation for the role="button" drop zone (Enter/Space)
    dom.dropZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        dom.fileInput.click();
      }
    });
    dom.fileInput.addEventListener('change', (e) => handleFileSelection(e.target.files));

    // Swap languages
    dom.swapLangFile.addEventListener('click', () => {
      if (dom.fileSourceLang.value === 'auto') {
        showToast('Set source language first before swapping', 'error');
        return;
      }
      const temp = dom.fileSourceLang.value;
      dom.fileSourceLang.value = dom.fileTargetLang.value;
      dom.fileTargetLang.value = temp;
      savePreferences();
    });

    // Drag & drop — use a counter to prevent flicker from child elements
    let dragCounter = 0;

    function addDragOver() {
      dragCounter++;
      dom.dropZone.classList.add('drag-over');
      dom.filePreview.classList.add('drag-over-preview');
    }

    function removeDragOver() {
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        dom.dropZone.classList.remove('drag-over');
        dom.filePreview.classList.remove('drag-over-preview');
      }
    }

    [dom.dropZone, dom.filePreview].forEach(el => {
      el.addEventListener('dragenter', (e) => {
        e.preventDefault();
        addDragOver();
      });
      el.addEventListener('dragleave', (e) => {
        removeDragOver();
      });
      el.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      el.addEventListener('drop', (e) => {
        e.preventDefault();
        dragCounter = 0;
        dom.dropZone.classList.remove('drag-over');
        dom.filePreview.classList.remove('drag-over-preview');
        handleFileSelection(e.dataTransfer.files);
      });
    });

    // Dropping onto the queue panel appends more files to it
    dom.fileQueue.addEventListener('dragover', (e) => e.preventDefault());
    dom.fileQueue.addEventListener('drop', (e) => {
      e.preventDefault();
      handleFileSelection(e.dataTransfer.files);
    });

    // Page range selection (PDF only)
    dom.pageFrom.addEventListener('change', onPageRangeChange);
    dom.pageTo.addEventListener('change', onPageRangeChange);

    // OCR for scanned PDFs
    dom.runOcr.addEventListener('click', () => runOcrExtraction());
    dom.dismissOcr.addEventListener('click', () => {
      pendingOcrFile = null;
      pendingOcrNumPages = 0;
      dom.ocrPrompt.classList.add('hidden');
      dom.ocrPageRange.classList.add('hidden');
    });
    dom.ocrPageFrom.addEventListener('change', onOcrPageRangeChange);
    dom.ocrPageTo.addEventListener('change', onOcrPageRangeChange);

    // Cancel an in-flight extraction/OCR or keep-format translation
    dom.loadingCancel.addEventListener('click', () => {
      dom.loadingCancel.disabled = true;
      if (extractAbort) extractAbort.abort();
      Translator.cancel(); // keep-format export translates through jobs
    });

    // Multi-file queue controls
    dom.fileQueueCancel.addEventListener('click', () => {
      dom.fileQueueCancel.disabled = true;
      if (extractAbort) extractAbort.abort(); // stop an in-flight extraction
      Translator.cancel();                    // stop an in-flight translation
    });
    dom.fileQueueClear.addEventListener('click', () => {
      if (fileQueueRunning) return; // Cancel first
      exitFileQueueMode();
    });

    // Replace file
    dom.replaceFile.addEventListener('click', () => {
      dom.fileInput.value = '';
      dom.fileInput.click();
    });

    // Remove file
    dom.removeFile.addEventListener('click', () => {
      currentFileText = '';
      currentFileName = '';
      currentFileObject = null;
      currentFilePages = null;
      pendingOcrFile = null;
      pendingOcrNumPages = 0;
      dom.fileInput.value = '';
      dom.filePreview.classList.add('hidden');
      dom.ocrPrompt.classList.add('hidden');
      dom.ocrPageRange.classList.add('hidden');
      dom.pageRangeRow.classList.add('hidden');
      dom.downloadFileDocxFormatted.classList.add('hidden');
      dom.dropZone.style.display = '';
      dom.fileResult.textContent = '';
      dom.fileDetectedLang.textContent = '';
      dom.fileUsage.textContent = '';
      updateFileResultCopyBtn();
    });

    // Translate
    dom.translateFile.addEventListener('click', () => translateFileTab());
    wireCancelButton(dom.cancelFileTranslate);

    // Update copy/download button states for file result (locked while a
    // translation is streaming in, so partial text can't be copied)
    const updateFileResultCopyBtn = () => {
      const ready = !!dom.fileResult.textContent && !isLoading;
      dom.copyFileResult.disabled = !ready;
      dom.downloadFileTxt.disabled = !ready;
      dom.downloadFileDocx.disabled = !ready;
    };

    // Observe file result changes
    const fileResultObserver = new MutationObserver(updateFileResultCopyBtn);
    fileResultObserver.observe(dom.fileResult, { childList: true, characterData: true, subtree: true });

    // Download as .txt
    dom.downloadFileTxt.addEventListener('click', () => {
      const text = dom.fileResult.textContent;
      if (!text) {
        showToast('Nothing to download', 'error');
        return;
      }
      // BOM helps Windows tools (e.g. Notepad) detect UTF-8 correctly
      const blob = new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8' });
      triggerDownload(blob, buildFileDownloadName('txt'));
      showToast('Downloaded .txt file', 'success');
    });

    // Download as .docx (library is lazy-loaded on first use)
    dom.downloadFileDocx.addEventListener('click', async () => {
      const text = dom.fileResult.textContent;
      if (!text) {
        showToast('Nothing to download', 'error');
        return;
      }
      try {
        dom.downloadFileDocx.disabled = true;
        await downloadAsDocx(text, buildFileDownloadName('docx'));
        showToast('Downloaded .docx file', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        dom.downloadFileDocx.disabled = !dom.fileResult.textContent;
      }
    });

    // Download .docx keeping the original formatting (translates the
    // original document in place; runs its own translation pass)
    dom.downloadFileDocxFormatted.addEventListener('click', () => downloadDocxKeepingFormat());

    // Copy result
    dom.copyFileResult.addEventListener('click', () => {
      if (dom.fileResult.textContent) {
        copyToClipboard(dom.fileResult.textContent);
      } else {
        showToast('Nothing to copy', 'error');
      }
    });

    // Initial state
    updateFileResultCopyBtn();
  }

  async function handleFileSelect(file) {
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast('File too large. Maximum size is 10MB.', 'error');
      dom.fileInput.value = '';
      return;
    }

    // Note: we intentionally do NOT touch currentFileText / the preview UI
    // until parsing succeeds. If this is a "Replace" of an already-loaded
    // file and parsing fails, the previous valid file (and its translation
    // result) must stay intact instead of being wiped out by a failed attempt.
    extractAbort = new AbortController();
    try {
      showExtracting(true, true);
      const result = await FileParser.parseFile(file, {
        signal: extractAbort.signal,
        onProgress: (p) => {
          if (p.stage === 'extract') {
            dom.loadingText.textContent = `Extracting text… page ${p.current}/${p.total}`;
          }
        }
      });

      if (!result.text || !result.text.trim()) {
        // Likely a scanned (image-only) PDF — offer OCR instead of a
        // dead-end error toast.
        if (result.pages) {
          pendingOcrFile = file;
          pendingOcrNumPages = result.numPages || result.pages.length;
          dom.ocrPrompt.classList.remove('hidden');
          if (pendingOcrNumPages > 1) {
            dom.ocrPageRange.classList.remove('hidden');
            dom.ocrPageFrom.max = pendingOcrNumPages;
            dom.ocrPageTo.max = pendingOcrNumPages;
            dom.ocrPageFrom.value = 1;
            dom.ocrPageTo.value = Math.min(pendingOcrNumPages, FileParser.OCR_MAX_PAGES);
            dom.ocrPageInfo.textContent = `PDF has ${pendingOcrNumPages} pages · up to ${FileParser.OCR_MAX_PAGES} per run`;
          } else {
            dom.ocrPageRange.classList.add('hidden');
          }
        } else {
          showToast('No text could be extracted from this file.', 'error');
        }
        return;
      }

      // Parsing succeeded — now it's safe to commit the new file and
      // discard whatever was loaded before.
      dom.ocrPrompt.classList.add('hidden');
      dom.ocrPageRange.classList.add('hidden');
      pendingOcrFile = null;
      pendingOcrNumPages = 0;
      commitParsedFile(file, result);
    } catch (err) {
      if (err.cancelled) {
        showToast('Extraction cancelled', 'success');
      } else {
        showToast(err.message, 'error');
      }
    } finally {
      dom.fileInput.value = '';
      showExtracting(false);
    }
  }

  // ===== Multi-file queue =====
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  // Entry point for the input `change` / drop events. A single file (with
  // no queue already active) keeps the original rich single-file UI;
  // anything else routes into the sequential queue.
  function handleFileSelection(fileList) {
    const files = [...(fileList || [])];
    if (!files.length) return;

    if (files.length === 1 && !fileQueueRunning && fileQueue.length === 0) {
      handleFileSelect(files[0]); // unchanged single-file path
      return;
    }
    enqueueFiles(files);
    dom.fileInput.value = '';
  }

  function enqueueFiles(files) {
    const accepted = [];
    let rejected = 0;
    for (const file of files) {
      const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
      if (!FileParser.SUPPORTED_EXTENSIONS.includes(ext) || file.size === 0 || file.size > MAX_FILE_SIZE) {
        rejected++;
        continue;
      }
      accepted.push(file);
    }
    if (!accepted.length) {
      showToast('No supported files to add (PDF, DOCX, TXT up to 10MB).', 'error');
      return;
    }
    if (rejected) showToast(`Skipped ${rejected} unsupported or too-large file(s)`, 'error');

    enterFileQueueMode();
    for (const file of accepted) {
      fileQueue.push({ id: ++fileQueueCounter, file, status: 'pending', text: '', error: '', detectedLang: '', progress: '' });
    }
    renderFileQueue();
    if (!fileQueueRunning) processFileQueue();
  }

  // Switch the File tab from single-file to queue layout, discarding any
  // half-loaded single file.
  function enterFileQueueMode() {
    currentFileText = '';
    currentFileName = '';
    currentFilePages = null;
    pendingOcrFile = null;
    pendingOcrNumPages = 0;
    dom.filePreview.classList.add('hidden');
    dom.ocrPrompt.classList.add('hidden');
    dom.ocrPageRange.classList.add('hidden');
    dom.fileSingleArea.classList.add('hidden');
    dom.fileQueue.classList.remove('hidden');
  }

  function exitFileQueueMode() {
    fileQueue = [];
    dom.fileQueueList.innerHTML = '';
    dom.fileQueueSummary.textContent = '';
    dom.fileQueue.classList.add('hidden');
    dom.fileSingleArea.classList.remove('hidden');
    dom.dropZone.style.display = '';
    dom.filePreview.classList.add('hidden');
    dom.fileInput.value = '';
  }

  const FQ_STATUS_LABELS = {
    pending: '• Pending',
    extracting: '⟳ Extracting…',
    translating: '⟳ Translating…',
    done: '✓ Done',
    error: '⚠ Error',
    'needs-ocr': '⚠ Skipped — scanned PDF, open it on its own to run OCR',
    skipped: '⚠ Skipped — no text found',
    cancelled: '✕ Cancelled'
  };

  // Add a row for any queue item that doesn't have one yet, then patch all
  // rows. Rows are keyed by item id so streaming patches never rebuild the
  // whole list.
  function renderFileQueue() {
    for (const item of fileQueue) {
      if (!dom.fileQueueList.querySelector(`[data-qid="${item.id}"]`)) {
        dom.fileQueueList.appendChild(buildQueueRow(item));
      }
      updateQueueItemRow(item);
    }
    updateQueueSummary();
  }

  function buildQueueRow(item) {
    const row = document.createElement('div');
    row.className = 'file-queue-item';
    row.dataset.qid = item.id;
    row.setAttribute('role', 'listitem');
    row.innerHTML = `
      <div class="fq-head">
        <span class="fq-name"></span>
        <span class="fq-status" role="status" aria-live="polite"></span>
      </div>
      <div class="fq-detected"></div>
      <div class="fq-result"></div>
      <div class="fq-actions hidden">
        <button class="btn btn-text btn-sm fq-copy">Copy</button>
        <button class="btn btn-text btn-sm fq-txt">Download .txt</button>
        <button class="btn btn-text btn-sm fq-docx">Download .docx</button>
      </div>
    `;
    // textContent (not innerHTML) — filenames are user-controlled
    row.querySelector('.fq-name').textContent = `${item.file.name} (${formatFileSize(item.file.size)})`;
    row.querySelector('.fq-copy').addEventListener('click', () => {
      if (item.text) copyToClipboard(item.text);
    });
    row.querySelector('.fq-txt').addEventListener('click', () => downloadQueueItem(item, 'txt'));
    row.querySelector('.fq-docx').addEventListener('click', () => downloadQueueItem(item, 'docx'));
    return row;
  }

  function updateQueueItemRow(item) {
    const row = dom.fileQueueList.querySelector(`[data-qid="${item.id}"]`);
    if (!row) return;
    row.dataset.status = item.status;
    row.querySelector('.fq-status').textContent = item.progress || FQ_STATUS_LABELS[item.status] || item.status;
    row.querySelector('.fq-detected').textContent = item.detectedLang ? `Detected: ${item.detectedLang}` : '';

    const resultEl = row.querySelector('.fq-result');
    // While translating, the stream renderer owns .fq-result — don't clobber it.
    if (item.status === 'done') {
      resultEl.textContent = item.text || '';
    } else if (item.status === 'error' || item.status === 'needs-ocr' || item.status === 'skipped' || item.status === 'cancelled') {
      resultEl.textContent = item.error || item.text || '';
    } else if (item.status === 'pending' || item.status === 'extracting') {
      resultEl.textContent = '';
    }

    row.querySelector('.fq-actions').classList.toggle('hidden', !(item.status === 'done' && item.text));
  }

  function updateQueueSummary() {
    const total = fileQueue.length;
    if (!total) { dom.fileQueueSummary.textContent = ''; return; }
    if (fileQueueRunning) {
      const processed = fileQueue.filter(i => !['pending', 'extracting', 'translating'].includes(i.status)).length;
      dom.fileQueueSummary.textContent = `Processing… ${processed}/${total} done`;
      return;
    }
    const done = fileQueue.filter(i => i.status === 'done').length;
    const failed = fileQueue.filter(i => ['error', 'needs-ocr', 'skipped'].includes(i.status)).length;
    dom.fileQueueSummary.textContent = failed
      ? `${done} done · ${failed} skipped/failed · ${total} total`
      : `${done} done · ${total} total`;
  }

  async function downloadQueueItem(item, ext) {
    if (!item.text) {
      showToast('Nothing to download', 'error');
      return;
    }
    const base = (item.file.name.replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]/g, '_').trim()) || 'translation';
    const name = `${base}_translated_${dom.fileTargetLang.value}.${ext}`;
    if (ext === 'txt') {
      triggerDownload(new Blob(['﻿' + item.text], { type: 'text/plain;charset=utf-8' }), name);
      showToast('Downloaded .txt file', 'success');
    } else {
      try {
        await downloadAsDocx(item.text, name);
        showToast('Downloaded .docx file', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  }

  // Extract + translate each pending item, one at a time. New items dropped
  // while this runs are picked up by the live array iterator.
  async function processFileQueue() {
    if (fileQueueRunning) return;
    fileQueueRunning = true;
    isLoading = true;
    dom.fileQueueCancel.classList.remove('hidden');
    dom.fileQueueCancel.disabled = false;
    dom.fileQueueClear.disabled = true;

    const sourceLang = dom.fileSourceLang.value;
    const targetLang = dom.fileTargetLang.value;
    const job = Translator.createJob();
    let cancelledAll = false;

    try {
      for (const item of fileQueue) {
        if (cancelledAll) break;
        if (item.status !== 'pending') continue;

        // ---- Extract (no OCR — scanned PDFs are flagged and skipped) ----
        item.status = 'extracting';
        item.progress = '';
        updateQueueItemRow(item);
        updateQueueSummary();

        extractAbort = new AbortController();
        let parsed;
        try {
          parsed = await FileParser.parseFile(item.file, {
            signal: extractAbort.signal,
            onProgress: (p) => {
              if (p.stage === 'extract') {
                item.progress = `⟳ Extracting… page ${p.current}/${p.total}`;
                updateQueueItemRow(item);
              }
            }
          });
        } catch (err) {
          if (err.cancelled) { item.status = 'cancelled'; item.progress = ''; updateQueueItemRow(item); cancelledAll = true; break; }
          item.status = 'error'; item.error = err.message; item.progress = '';
          updateQueueItemRow(item); updateQueueSummary();
          continue;
        } finally {
          extractAbort = null;
        }

        const text = (parsed.text || '').trim();
        if (!text) {
          item.status = parsed.pages ? 'needs-ocr' : 'skipped';
          item.progress = '';
          updateQueueItemRow(item); updateQueueSummary();
          continue;
        }
        if (sourceLang !== 'auto' && sourceLang === targetLang) {
          item.status = 'error'; item.error = 'Source and target languages are the same.'; item.progress = '';
          updateQueueItemRow(item); updateQueueSummary();
          continue;
        }
        if (text.length > Translator.MAX_CHARS) {
          item.status = 'error'; item.error = `Too long (${text.length.toLocaleString()} characters).`; item.progress = '';
          updateQueueItemRow(item); updateQueueSummary();
          continue;
        }

        // ---- Translate ----
        item.status = 'translating';
        item.progress = '⟳ Translating…';
        item.text = '';
        updateQueueItemRow(item);
        updateQueueSummary();

        const resultEl = dom.fileQueueList.querySelector(`[data-qid="${item.id}"] .fq-result`);
        const renderer = makeStreamRenderer(resultEl);
        try {
          const result = await Translator.translate(text, sourceLang, targetLang, {
            domain: dom.fileDomain.value,
            tone: dom.fileTone.value,
            glossary: dom.fileGlossary.value,
            context: dom.fileContext.value,
            job,
            onProgress: (p) => {
              item.progress = p.total > 1 ? `⟳ Translating part ${p.current}/${p.total}…` : '⟳ Translating…';
              const st = dom.fileQueueList.querySelector(`[data-qid="${item.id}"] .fq-status`);
              if (st) st.textContent = item.progress;
            },
            onStream: (s) => renderer.push(s.text),
            onDetectedLang: (lang) => {
              item.detectedLang = lang;
              const d = dom.fileQueueList.querySelector(`[data-qid="${item.id}"] .fq-detected`);
              if (d) d.textContent = `Detected: ${lang}`;
            }
          });
          renderer.flush();
          item.status = 'done';
          item.text = result.text;
          item.progress = '';
          if (!item.detectedLang && result.detectedLang) item.detectedLang = result.detectedLang;
          updateQueueItemRow(item);
          updateQueueSummary();

          History.add({
            sourceLang: sourceLang === 'auto' ? (result.detectedLang || 'Auto') : sourceLang,
            targetLang,
            sourceText: text,
            translatedText: result.text,
            type: 'file',
            domain: dom.fileDomain.value
          });
        } catch (err) {
          renderer.flush();
          if (err.cancelled) { item.status = 'cancelled'; item.progress = ''; item.text = ''; updateQueueItemRow(item); cancelledAll = true; break; }
          item.status = 'error'; item.error = err.message; item.progress = ''; item.text = '';
          updateQueueItemRow(item); updateQueueSummary();
          // A bad API key will fail every remaining file — stop and prompt.
          if (err.message.includes('API key')) {
            dom.apiKeyInput.focus();
            dom.apiKeyInput.select();
            cancelledAll = true;
            break;
          }
        }
      }
    } finally {
      Translator.endJob(job);
      extractAbort = null;
      fileQueueRunning = false;
      isLoading = false;
      dom.fileQueueCancel.classList.add('hidden');
      dom.fileQueueClear.disabled = false;
      updateQueueSummary();
    }

    const done = fileQueue.filter(i => i.status === 'done').length;
    if (cancelledAll) {
      showToast('File queue cancelled', 'success');
    } else {
      showToast(`Translated ${done} of ${fileQueue.length} file(s)`, done ? 'success' : 'error');
    }
  }

  // OCR entry point for scanned PDFs (user-initiated — it is slow).
  async function runOcrExtraction() {
    const file = pendingOcrFile;
    if (!file) return;

    const from = pendingOcrNumPages ? parseInt(dom.ocrPageFrom.value, 10) || 1 : undefined;
    const to = pendingOcrNumPages ? parseInt(dom.ocrPageTo.value, 10) || pendingOcrNumPages : undefined;

    extractAbort = new AbortController();
    try {
      dom.ocrPrompt.classList.add('hidden');
      showExtracting(true, true);
      dom.loadingText.textContent = 'Loading OCR engine…';

      const result = await FileParser.ocrPdf(file, {
        langCode: FileParser.tesseractLangFor(dom.fileSourceLang.value),
        from,
        to,
        signal: extractAbort.signal,
        onProgress: (p) => {
          if (p.stage === 'ocr') {
            dom.loadingText.textContent = `OCR in progress… page ${p.current}/${p.total}`;
          }
        }
      });

      if (!result.text) {
        showToast('OCR could not extract any text from this PDF.', 'error');
        return;
      }

      pendingOcrFile = null;
      pendingOcrNumPages = 0;
      dom.ocrPageRange.classList.add('hidden');
      commitParsedFile(file, result);

      if (result.truncated) {
        showToast(`OCR processed pages ${result.from}-${result.to} only`, 'error');
      }
    } catch (err) {
      // OCR failed — restore the prompt so the user can retry
      dom.ocrPrompt.classList.remove('hidden');
      if (pendingOcrNumPages > 1) dom.ocrPageRange.classList.remove('hidden');
      if (err.cancelled) {
        showToast('OCR cancelled', 'success');
      } else {
        showToast(err.message, 'error');
      }
    } finally {
      showExtracting(false);
    }
  }

  // Commit a successfully parsed file to the preview/translation state
  function commitParsedFile(file, result) {
    currentFileText = result.text;
    currentFileName = file.name;
    currentFileObject = file;
    currentFilePages = result.pages || null;
    dom.fileResult.textContent = '';
    dom.fileUsage.textContent = '';

    dom.fileName.textContent = `${file.name} (${formatFileSize(file.size)})`;
    // The keep-format export only applies to real .docx sources (it edits
    // the original document's XML in place).
    const isDocx = /\.docx$/i.test(file.name);
    dom.downloadFileDocxFormatted.classList.toggle('hidden', !isDocx);
    setupPageRangeUI();
    refreshFilePreview();
    dom.dropZone.style.display = 'none';
    dom.filePreview.classList.remove('hidden');
  }

  function setupPageRangeUI() {
    if (currentFilePages && currentFilePages.length > 1) {
      dom.pageRangeRow.classList.remove('hidden');
      dom.pageFrom.max = currentFilePages.length;
      dom.pageTo.max = currentFilePages.length;
      dom.pageFrom.value = 1;
      dom.pageTo.value = currentFilePages.length;
      dom.pageRangeInfo.textContent = `of ${currentFilePages.length} pages`;
    } else {
      dom.pageRangeRow.classList.add('hidden');
    }
  }

  function onPageRangeChange() {
    if (!currentFilePages) return;
    const from = Math.max(1, Math.min(parseInt(dom.pageFrom.value, 10) || 1, currentFilePages.length));
    const to = Math.max(from, Math.min(parseInt(dom.pageTo.value, 10) || currentFilePages.length, currentFilePages.length));
    dom.pageFrom.value = from;
    dom.pageTo.value = to;
    currentFileText = FileParser.joinPages(currentFilePages, from, to);
    refreshFilePreview();
  }

  // Clamp the OCR page-range inputs to the PDF's bounds and OCR_MAX_PAGES
  // per run, mirroring onPageRangeChange for the extracted-text range.
  function onOcrPageRangeChange() {
    if (!pendingOcrNumPages) return;
    const from = Math.max(1, Math.min(parseInt(dom.ocrPageFrom.value, 10) || 1, pendingOcrNumPages));
    const maxTo = Math.min(pendingOcrNumPages, from + FileParser.OCR_MAX_PAGES - 1);
    const to = Math.max(from, Math.min(parseInt(dom.ocrPageTo.value, 10) || maxTo, maxTo));
    dom.ocrPageFrom.value = from;
    dom.ocrPageTo.value = to;
  }

  function refreshFilePreview() {
    const text = currentFileText;
    const maxChars = Translator.MAX_CHARS;
    let warning = '';
    if (text.length > maxChars) {
      warning = ' 🔴 Exceeds limit - file too large to translate';
    } else if (text.length > Translator.CHUNK_SIZE) {
      const parts = Math.ceil(text.length / Translator.CHUNK_SIZE);
      warning = ` ℹ️ Long file — will be translated in ~${parts} parts`;
    }

    dom.extractedText.textContent = text.length > 5000 ? text.substring(0, 5000) + '\n\n(truncated for preview...)' : text;
    dom.fileCharCount.textContent = `${text.length.toLocaleString()} / ${maxChars.toLocaleString()} characters${warning}`;
  }

  async function translateFileTab() {
    if (!currentFileText) {
      showToast('Please upload a file first', 'error');
      return;
    }

    const sourceLang = dom.fileSourceLang.value;
    const targetLang = dom.fileTargetLang.value;

    if (sourceLang !== 'auto' && sourceLang === targetLang) {
      showToast('Source and target languages are the same', 'error');
      return;
    }

    try {
      setButtonLoading(dom.translateFile, true);
      showCancelButton(dom.cancelFileTranslate, true);
      dom.fileResult.textContent = '';
      dom.fileDetectedLang.textContent = '';
      dom.fileUsage.textContent = '';
      dom.fileUsage.title = '';

      // Prepare translation options for file
      const options = {
        domain: dom.fileDomain.value,
        tone: dom.fileTone.value,
        glossary: dom.fileGlossary.value,
        context: dom.fileContext.value,
        onProgress: (p) => {
          dom.fileTranslateProgress.textContent = p.total > 1
            ? `Translating part ${p.current}/${p.total}…`
            : '';
        },
        onStream: (s) => {
          dom.fileResult.textContent = s.text;
        },
        onDetectedLang: (lang) => {
          dom.fileDetectedLang.textContent = `Detected: ${lang}`;
        }
      };

      const result = await Translator.translate(currentFileText, sourceLang, targetLang, options);
      dom.fileResult.textContent = result.text;
      dom.fileUsage.textContent = formatUsage(result.usage);
      dom.fileUsage.title = usageTitle(result.usage);

      History.add({
        sourceLang: sourceLang === 'auto' ? (result.detectedLang || 'Auto') : sourceLang,
        targetLang,
        sourceText: currentFileText,
        translatedText: result.text,
        type: 'file',
        domain: options.domain
      });

      if (result.truncated) {
        showToast('Part of the output was truncated by the API length limit', 'error');
      }
    } catch (err) {
      if (err.cancelled) {
        // Keep whatever partial translation already streamed into the
        // result area — the user may still want to copy/download it.
        showToast('Translation cancelled', 'success');
      } else {
        if (err.message.includes('API key')) {
          dom.apiKeyInput.focus();
          dom.apiKeyInput.select();
        }
        showToast(err.message, 'error');
      }
    } finally {
      showCancelButton(dom.cancelFileTranslate, false);
      dom.fileTranslateProgress.textContent = '';
      setButtonLoading(dom.translateFile, false);
      const ready = !!dom.fileResult.textContent;
      dom.copyFileResult.disabled = !ready;
      dom.downloadFileTxt.disabled = !ready;
      dom.downloadFileDocx.disabled = !ready;
    }
  }

  // ===== Batch Tab =====
  function setupBatchTab() {
    dom.addBatchRow.addEventListener('click', () => addBatchRow());
    dom.translateBatch.addEventListener('click', () => translateBatchAll());
    dom.retryBatchFailed.addEventListener('click', () => {
      const failedRows = [...dom.batchRows.querySelectorAll('.batch-row')]
        .filter(row => row.dataset.failed === 'true');
      if (failedRows.length) translateBatchAll(failedRows);
    });
    wireCancelButton(dom.cancelBatch);

    // Toggle advanced options
    let batchAdvancedVisible = false;
    dom.toggleBatchAdvanced.addEventListener('click', () => {
      batchAdvancedVisible = !batchAdvancedVisible;
      dom.batchAdvancedOptions.classList.toggle('hidden', !batchAdvancedVisible);
      dom.toggleBatchAdvanced.querySelector('.advanced-toggle-label').textContent =
        batchAdvancedVisible ? 'Hide' : 'Advanced';
    });

    // CSV import/export
    dom.importBatchCsv.addEventListener('click', () => dom.batchCsvInput.click());
    dom.batchCsvInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      dom.batchCsvInput.value = '';
      if (file) importBatchCsvFile(file);
    });
    dom.exportBatchCsv.addEventListener('click', () => exportBatchCsv());

    // Save preferences on language/domain/tone change
    dom.batchTargetLang.addEventListener('change', savePreferences);
    dom.batchDomain.addEventListener('change', savePreferences);
    dom.batchTone.addEventListener('change', savePreferences);

    // Start with 3 rows
    for (let i = 0; i < 3; i++) {
      addBatchRow();
    }
  }

  function addBatchRow() {
    batchRowCounter++;
    const rowId = batchRowCounter;

    // Language options come from the single LANGUAGES list
    const sourceLangOptions = '<option value="auto">Auto Detect</option>' +
      LANGUAGES.map(l => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`).join('');

    const row = document.createElement('div');
    row.className = 'batch-row';
    row.dataset.rowId = rowId;
    row.innerHTML = `
      <div class="batch-row-input">
        <select class="lang-select batch-source-lang" aria-label="Source language for this row">${sourceLangOptions}</select>
        <textarea placeholder="Enter text..." rows="3" aria-label="Text to translate"></textarea>
        <div class="batch-row-char-count">0 characters</div>
      </div>
      <div class="batch-row-actions">
        <button class="btn btn-icon translate-row-btn" title="Translate this row" aria-label="Translate this row">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
        <button class="btn btn-icon remove-row-btn" title="Remove row" aria-label="Remove this row">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="batch-row-output">
        <div class="batch-row-detected"></div>
        <div class="batch-row-result" data-result-id="${rowId}" role="region" aria-label="Row translation result"></div>
        <div class="batch-row-usage"></div>
        <button class="btn btn-icon copy-row-btn" title="Copy translation" aria-label="Copy this translation" disabled>
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
      </div>
    `;

    dom.batchRows.appendChild(row);

    const textarea = row.querySelector('textarea');
    const charCountEl = row.querySelector('.batch-row-char-count');
    const resultDiv = row.querySelector('.batch-row-result');
    const copyBtn = row.querySelector('.copy-row-btn');

    // Character count
    textarea.addEventListener('input', () => {
      const charCount = textarea.value.length;
      charCountEl.textContent = `${charCount.toLocaleString()} characters`;
    });

    // Translate single row
    row.querySelector('.translate-row-btn').addEventListener('click', () => translateBatchRow(row));
    // Remove row
    row.querySelector('.remove-row-btn').addEventListener('click', () => {
      if (dom.batchRows.children.length > 1) {
        row.remove();
        const anyFailed = [...dom.batchRows.querySelectorAll('.batch-row')]
          .some(r => r.dataset.failed === 'true');
        dom.retryBatchFailed.classList.toggle('hidden', !anyFailed);
      } else {
        showToast('Need at least one row', 'error');
      }
    });

    // Copy result — only enabled once there's an actual finished
    // translation, not for transient "Translating..." / "Error: ..." /
    // "Skipped: ..." text or partial text still streaming in.
    const placeholderPattern = /^(Translating\.\.\.|Error:|Skipped:)/;
    const updateCopyBtnState = () => {
      const content = resultDiv.textContent;
      const hasResult = !!content && !placeholderPattern.test(content) && row.dataset.translating !== 'true';
      resultDiv.dataset.hasResult = hasResult ? 'true' : 'false';
      copyBtn.disabled = !hasResult;
    };
    row._updateCopyBtn = updateCopyBtnState;
    new MutationObserver(updateCopyBtnState)
      .observe(resultDiv, { childList: true, characterData: true, subtree: true });

    copyBtn.addEventListener('click', () => {
      if (resultDiv.dataset.hasResult === 'true') {
        copyToClipboard(resultDiv.textContent);
      }
    });
    // Ctrl+Enter in textarea
    textarea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        translateBatchRow(row);
      }
    });
  }

  function setBatchRowsLocked(locked) {
    const rows = dom.batchRows.querySelectorAll('.batch-row');
    rows.forEach(row => {
      const btn = row.querySelector('.translate-row-btn');
      const removeBtn = row.querySelector('.remove-row-btn');
      const textarea = row.querySelector('textarea');
      if (btn) btn.disabled = locked;
      if (removeBtn) removeBtn.disabled = locked;
      if (textarea) textarea.readOnly = locked;
    });
    // New rows shouldn't be addable mid-batch either — they'd be born
    // unlocked and out of sync with the rest while Translate All is running.
    dom.addBatchRow.disabled = locked;
    // Importing/exporting mid-run would capture or clobber half-done rows.
    dom.importBatchCsv.disabled = locked;
    dom.exportBatchCsv.disabled = locked;
    dom.retryBatchFailed.disabled = locked;
  }

  async function translateBatchRow(row) {
    // Guard against ANY other in-flight translation: Translate All, or
    // another single row already streaming. All batch translations share
    // the one Cancel button, and Translator.cancel() aborts every job at
    // once — so two running together would clobber each other's cancel.
    // isLoading also gates tab-switching, keeping this consistent with the
    // Text/File/Translate-All flows.
    if (isLoading) {
      showToast('A translation is already in progress', 'error');
      return;
    }

    const textarea = row.querySelector('textarea');
    const translateBtn = row.querySelector('.translate-row-btn');
    const removeBtn = row.querySelector('.remove-row-btn');
    const text = textarea.value.trim();
    if (!text || text.length === 0) {
      showToast('Please enter text in this row', 'error');
      return;
    }

    const sourceLang = row.querySelector('.batch-source-lang').value;
    const targetLang = dom.batchTargetLang.value;
    const resultDiv = row.querySelector('.batch-row-result');

    if (sourceLang !== 'auto' && sourceLang === targetLang) {
      showToast('Source and target languages are the same', 'error');
      return;
    }

    try {
      isLoading = true;
      row.dataset.translating = 'true';
      delete row.dataset.failed;
      showCancelButton(dom.cancelBatch, true);
      translateBtn.disabled = true;
      removeBtn.disabled = true;
      textarea.readOnly = true;
      resultDiv.textContent = 'Translating...';
      row.querySelector('.batch-row-detected').textContent = '';

      // Prepare translation options
      const options = {
        domain: dom.batchDomain.value,
        tone: dom.batchTone.value,
        glossary: dom.batchGlossary.value,
        context: dom.batchContext.value,
        onProgress: (p) => {
          if (p.total > 1) {
            resultDiv.textContent = `Translating... (part ${p.current}/${p.total})`;
          }
        },
        onStream: (s) => {
          resultDiv.textContent = s.text;
        },
        onDetectedLang: (lang) => {
          row.querySelector('.batch-row-detected').textContent = `Detected: ${lang}`;
        }
      };

      const result = await Translator.translate(text, sourceLang, targetLang, options);
      resultDiv.textContent = result.text;
      const rowUsageEl = row.querySelector('.batch-row-usage');
      if (rowUsageEl) {
        rowUsageEl.textContent = formatUsage(result.usage);
        rowUsageEl.title = usageTitle(result.usage);
      }

      History.add({
        sourceLang: sourceLang === 'auto' ? (result.detectedLang || 'Auto') : sourceLang,
        targetLang,
        sourceText: text,
        translatedText: result.text,
        type: 'batch',
        domain: options.domain
      });

      if (result.truncated) {
        showToast('Part of the output was truncated by the API length limit', 'error');
      }
    } catch (err) {
      if (err.cancelled) {
        // Keep partial text that already streamed in; drop the placeholder
        // if nothing has arrived yet.
        if (/^Translating/.test(resultDiv.textContent)) {
          resultDiv.textContent = '';
        }
        showToast('Translation cancelled', 'success');
      } else {
        resultDiv.textContent = '';
        row.dataset.failed = 'true';
        dom.retryBatchFailed.classList.remove('hidden');
        if (err.message.includes('API key')) {
          dom.apiKeyInput.focus();
          dom.apiKeyInput.select();
        }
        showToast(err.message, 'error');
      }
    } finally {
      isLoading = false;
      showCancelButton(dom.cancelBatch, false);
      delete row.dataset.translating;
      row._updateCopyBtn();
      translateBtn.disabled = false;
      removeBtn.disabled = false;
      textarea.readOnly = false;
    }
  }

  // rowsOverride lets Retry Failed re-run just the rows still marked
  // dataset.failed, instead of every row in the batch.
  async function translateBatchAll(rowsOverride) {
    // Don't start on top of a single-row translation still in flight —
    // same shared-Cancel / shared-job hazard as the guard in
    // translateBatchRow. (setButtonLoading below then owns isLoading.)
    if (isLoading) {
      showToast('A translation is already in progress', 'error');
      return;
    }

    const rows = rowsOverride || [...dom.batchRows.querySelectorAll('.batch-row')];
    let translations = 0;
    let emptySkipped = 0;
    let sameLangSkipped = 0;
    let errors = 0;
    let truncatedCount = 0;
    let cancelled = false;
    let completed = 0;

    // Build the work list up front; rows that need no API call are
    // resolved synchronously exactly as before.
    const work = [];
    for (const row of rows) {
      const textarea = row.querySelector('textarea');
      const text = textarea.value.trim();
      const resultDiv = row.querySelector('.batch-row-result');

      if (!text) {
        emptySkipped++;
        continue;
      }

      const sourceLang = row.querySelector('.batch-source-lang').value;
      const targetLang = dom.batchTargetLang.value;

      if (sourceLang !== 'auto' && sourceLang === targetLang) {
        resultDiv.textContent = 'Skipped: same language';
        sameLangSkipped++;
        continue;
      }

      work.push({ row, text, sourceLang, targetLang, resultDiv });
    }

    setButtonLoading(dom.translateBatch, true);
    setBatchRowsLocked(true);
    showCancelButton(dom.cancelBatch, true);
    dom.retryBatchFailed.classList.add('hidden');
    dom.batchProgress.textContent = work.length ? `0/${work.length}` : '';

    // One shared cancellation job for the whole run — the Cancel button
    // aborts every in-flight row request at once.
    const job = Translator.createJob();

    try {
      await Translator._runPool(work, async ({ row, text, sourceLang, targetLang, resultDiv }) => {
        row.dataset.translating = 'true';
        delete row.dataset.failed;
        resultDiv.textContent = 'Translating...';

        try {
          // Prepare translation options
          const options = {
            domain: dom.batchDomain.value,
            tone: dom.batchTone.value,
            glossary: dom.batchGlossary.value,
            context: dom.batchContext.value,
            job,
            onProgress: (p) => {
              if (p.total > 1) {
                resultDiv.textContent = `Translating... (part ${p.current}/${p.total})`;
              }
            },
            onStream: (s) => {
              resultDiv.textContent = s.text;
            },
            onDetectedLang: (lang) => {
              const el = row.querySelector('.batch-row-detected');
              if (el) el.textContent = `Detected: ${lang}`;
            }
          };

          const result = await Translator.translate(text, sourceLang, targetLang, options);
          resultDiv.textContent = result.text;
          const usageEl = row.querySelector('.batch-row-usage');
          if (usageEl) {
            usageEl.textContent = formatUsage(result.usage);
            usageEl.title = usageTitle(result.usage);
          }
          translations++;
          if (result.truncated) truncatedCount++;

          History.add({
            sourceLang: sourceLang === 'auto' ? (result.detectedLang || 'Auto') : sourceLang,
            targetLang,
            sourceText: text,
            translatedText: result.text,
            type: 'batch',
            domain: options.domain
          });
        } catch (err) {
          if (err.cancelled) {
            // Stop the whole batch: keep this row's partial text (if any)
            // and leave the remaining rows untouched.
            cancelled = true;
            if (/^Translating/.test(resultDiv.textContent)) {
              resultDiv.textContent = '';
            }
            return false; // tells the pool to stop launching new rows
          }
          resultDiv.textContent = 'Error: ' + err.message;
          row.dataset.failed = 'true';
          errors++;
          if (err.message.includes('API key') && translations === 0) {
            dom.apiKeyInput.focus();
            dom.apiKeyInput.select();
          }
        } finally {
          delete row.dataset.translating;
          if (row._updateCopyBtn) row._updateCopyBtn();
          completed++;
          dom.batchProgress.textContent = `${completed}/${work.length}`;
        }
        return true;
      }, BATCH_CONCURRENCY);
    } finally {
      Translator.endJob(job);
      setButtonLoading(dom.translateBatch, false);
      setBatchRowsLocked(false);
      showCancelButton(dom.cancelBatch, false);
      dom.batchProgress.textContent = '';
      const anyFailed = [...dom.batchRows.querySelectorAll('.batch-row')]
        .some(row => row.dataset.failed === 'true');
      dom.retryBatchFailed.classList.toggle('hidden', !anyFailed);
    }

    const skippedTotal = emptySkipped + sameLangSkipped;

    if (cancelled) {
      showToast('Translation cancelled', 'success');
    } else if (translations > 0) {
      const details = [];
      if (skippedTotal > 0) details.push(`${skippedTotal} skipped`);
      if (errors > 0) details.push(`${errors} failed`);
      if (truncatedCount > 0) details.push(`${truncatedCount} truncated`);
      const message = details.length
        ? `Translated ${translations} row(s) — ${details.join(', ')}`
        : `Translated ${translations} row(s)`;
      showToast(message, errors > 0 || truncatedCount > 0 ? 'error' : 'success');
    } else if (errors > 0) {
      showToast(`Failed to translate ${errors} row(s). Check your API key and try again.`, 'error');
    } else {
      showToast('No text to translate', 'error');
    }
  }

  // ===== History =====
  function setupHistoryTab() {
    dom.clearHistory.addEventListener('click', () => {
      if (confirm('Clear all translation history?')) {
        History.clear();
        refreshHistory();
        showToast('History cleared', 'success');
      }
    });

    dom.historySearch.addEventListener('input', () => {
      historyQuery = dom.historySearch.value;
      refreshHistory();
    });

    dom.historyTypeFilter.addEventListener('change', () => {
      historyType = dom.historyTypeFilter.value;
      refreshHistory();
    });

    dom.exportHistory.addEventListener('click', () => exportHistoryCsv());
  }

  function refreshHistory() {
    const scrollPos = dom.historyList.scrollTop;
    const all = History.getAll();
    const items = History.filter(all, { query: historyQuery, type: historyType });
    const filtering = !!(historyQuery.trim() || historyType);
    dom.clearHistory.disabled = all.length === 0;
    dom.exportHistory.disabled = items.length === 0;

    if (items.length === 0) {
      dom.historyList.innerHTML = filtering && all.length > 0
        ? '<p class="empty-state">No results match your search.</p>'
        : '<p class="empty-state">No translation history yet.</p>';
      return;
    }

    dom.historyList.innerHTML = items.map(item => {
      const sourcePreview = item.sourceText || '';
      const translatedPreview = item.translatedText || '';
      const sourceIsTruncated = sourcePreview.length > 200;
      const translatedIsTruncated = translatedPreview.length > 200;

      return `
        <div class="history-item" data-id="${item.id}">
          <div class="history-meta">
            <span class="history-langs">
              ${escapeHtml(item.sourceLang)} → ${escapeHtml(item.targetLang)}
              <span style="color:var(--text-muted);font-weight:400">(${escapeHtml(item.type)}${item.domain && item.domain !== 'general' ? ' · ' + escapeHtml(item.domain) : ''})</span>
            </span>
            <span>${History.formatTime(item.timestamp)}</span>
          </div>
          <div class="history-pair">
            <div class="history-column">
              <div class="history-column-label">Source:</div>
              <div class="history-source" title="${sourceIsTruncated ? 'Click to view full text' : ''}" style="${sourceIsTruncated ? 'cursor: pointer;' : ''}">${escapeHtml(sourcePreview.substring(0, 200))}</div>
            </div>
            <div class="history-column">
              <div class="history-column-label">Translation:</div>
              <div class="history-translated" title="${translatedIsTruncated ? 'Click to view full text' : ''}" style="${translatedIsTruncated ? 'cursor: pointer;' : ''}">${escapeHtml(translatedPreview.substring(0, 200))}</div>
            </div>
          </div>
          <div class="history-actions">
            <button class="btn btn-sm btn-outline history-copy-source">Copy Source</button>
            <button class="btn btn-sm btn-outline history-copy-result">Copy Translation</button>
            <button class="btn btn-sm btn-text btn-danger history-delete">Delete</button>
          </div>
        </div>
      `;
    }).join('');

    dom.historyList.querySelectorAll('.history-item').forEach(itemEl => {
      const id = itemEl.dataset.id;
      const entry = items.find(i => i.id === id);

      if (entry) {
        // Click to view full source text
        itemEl.querySelector('.history-source').addEventListener('click', () => {
          if (entry.sourceText.length > 200) {
            showFullTextModal(entry.sourceText, `${entry.sourceLang} Text`);
          }
        });

        // Click to view full translation
        itemEl.querySelector('.history-translated').addEventListener('click', () => {
          if (entry.translatedText.length > 200) {
            showFullTextModal(entry.translatedText, `${entry.targetLang} Translation`);
          }
        });

        itemEl.querySelector('.history-copy-source').addEventListener('click', () => {
          copyToClipboard(entry.sourceText);
        });

        itemEl.querySelector('.history-copy-result').addEventListener('click', () => {
          copyToClipboard(entry.translatedText);
        });
      }

      itemEl.querySelector('.history-delete').addEventListener('click', () => {
        if (confirm('Delete this translation from history?')) {
          History.remove(id);
          refreshHistory();
          showToast('Deleted', 'success');
        }
      });
    });

    dom.historyList.scrollTop = scrollPos;
  }

  function showFullTextModal(text, title, opts = {}) {
    const closeLabel = opts.closeLabel || 'Close';

    const existingModal = document.querySelector('.text-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'text-modal';
    modal.innerHTML = `
      <div class="text-modal-overlay"></div>
      <div class="text-modal-content" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
        <div class="text-modal-header">
          <h3>${escapeHtml(title)}</h3>
          <button class="text-modal-close" title="Close (Esc)" aria-label="Close dialog">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="text-modal-body">${escapeHtml(text).replace(/\n/g, '<br>')}</div>
        <div class="text-modal-actions">
          <button class="btn btn-sm btn-outline text-modal-copy">Copy</button>
          <button class="btn btn-sm btn-text text-modal-close-btn">${escapeHtml(closeLabel)}</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Focus management: move focus into the dialog, restore it to the
    // element that opened the modal on close.
    const previouslyFocused = document.activeElement;
    modal.querySelector('.text-modal-close').focus();

    const closeModal = () => {
      modal.remove();
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
    modal.querySelector('.text-modal-close').addEventListener('click', closeModal);
    modal.querySelector('.text-modal-close-btn').addEventListener('click', closeModal);
    modal.querySelector('.text-modal-overlay').addEventListener('click', closeModal);
    // Copy only copies — it doesn't dismiss the popup, so the user can
    // keep reviewing the text (and copy again) before explicitly closing.
    modal.querySelector('.text-modal-copy').addEventListener('click', () => {
      copyToClipboard(text);
    });

    // Prevent modal close when clicking inside content
    modal.querySelector('.text-modal-content').addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Clean up listener when modal closes
    const originalRemove = modal.remove.bind(modal);
    modal.remove = function() {
      document.removeEventListener('keydown', handleEscape);
      originalRemove();
    };
  }

  // ===== Helpers =====
  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // ===== Downloads =====
  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function buildFileDownloadName(extension) {
    const base = (currentFileName || 'translation')
      .replace(/\.[^.]+$/, '')          // strip original extension
      .replace(/[\\/:*?"<>|]/g, '_')    // remove filesystem-hostile chars
      .trim() || 'translation';
    return `${base}_translated_${dom.fileTargetLang.value}.${extension}`;
  }

  // The docx library (~300KB) is only needed when the user actually
  // exports a .docx, so it is lazy-loaded from the CDN on first use.
  let docxLibPromise = null;
  function loadDocxLibrary() {
    if (window.docx) return Promise.resolve();
    if (!docxLibPromise) {
      docxLibPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js';
        script.onload = () => resolve();
        script.onerror = () => {
          docxLibPromise = null; // allow retry on the next click
          reject(new Error('Failed to load the DOCX library. Check your internet connection and try again.'));
        };
        document.head.appendChild(script);
      });
    }
    return docxLibPromise;
  }

  async function downloadAsDocx(text, filename) {
    await loadDocxLibrary();
    // One paragraph per line; blank lines become empty paragraphs so the
    // document keeps the same vertical rhythm as the plain-text result.
    const paragraphs = text.split('\n').map(line =>
      new docx.Paragraph({ children: line ? [new docx.TextRun(line)] : [] })
    );
    const doc = new docx.Document({
      sections: [{ properties: {}, children: paragraphs }]
    });
    const blob = await docx.Packer.toBlob(doc);
    triggerDownload(blob, filename);
  }

  // ===== Keep-format .docx export =====
  // JSZip (~100KB) is only needed for the keep-format export, so it's
  // lazy-loaded from the CDN on first use — same pattern as the docx lib.
  let jsZipPromise = null;
  function loadJsZip() {
    if (window.JSZip) return Promise.resolve();
    if (!jsZipPromise) {
      jsZipPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
        script.onload = () => resolve();
        script.onerror = () => {
          jsZipPromise = null; // allow retry
          reject(new Error('Failed to load the .docx packer library. Check your internet connection and try again.'));
        };
        document.head.appendChild(script);
      });
    }
    return jsZipPromise;
  }

  const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

  // Translate the loaded .docx in place: a .docx is a ZIP whose
  // word/document.xml holds the text as <w:t> runs inside <w:p> paragraphs.
  // We translate paragraph-by-paragraph (exact 1:1 mapping — no fragile
  // delimiter) and write each translation back into the paragraph's first
  // run, so paragraph styles (headings, lists, alignment), tables, and the
  // dominant run's formatting are all preserved. Intra-paragraph run
  // formatting (e.g. one bold word mid-sentence) and header/footer text are
  // NOT preserved — a documented, common trade-off.
  async function downloadDocxKeepingFormat() {
    if (!currentFileObject || !/\.docx$/i.test(currentFileObject.name)) {
      showToast('Load a .docx file first', 'error');
      return;
    }
    const sourceLang = dom.fileSourceLang.value;
    const targetLang = dom.fileTargetLang.value;
    if (sourceLang !== 'auto' && sourceLang === targetLang) {
      showToast('Source and target languages are the same', 'error');
      return;
    }

    const job = Translator.createJob();
    try {
      showExtracting(true, true);
      dom.loadingText.textContent = 'Loading .docx packer…';
      await loadJsZip();

      const buffer = await currentFileObject.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);
      const docXmlFile = zip.file('word/document.xml');
      if (!docXmlFile) throw new Error('This .docx is missing word/document.xml and cannot be processed.');

      const xmlText = await docXmlFile.async('string');
      const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');
      if (xmlDoc.getElementsByTagName('parsererror').length) {
        throw new Error('Could not parse the document XML.');
      }

      // Collect translatable paragraphs (those with non-empty text).
      const paras = [...xmlDoc.getElementsByTagNameNS(WORD_NS, 'p')];
      const targets = [];
      for (const p of paras) {
        const ts = [...p.getElementsByTagNameNS(WORD_NS, 't')];
        if (!ts.length) continue;
        const text = ts.map(t => t.textContent).join('');
        if (!text.trim()) continue;
        targets.push({ ts, text });
      }

      if (!targets.length) {
        throw new Error('No selectable text found in this .docx (it may be scanned images).');
      }

      let done = 0;
      dom.loadingText.textContent = `Translating… 0/${targets.length} paragraphs`;

      // Translate paragraphs concurrently through the shared pool; a single
      // shared job lets the overlay's Cancel abort them all at once.
      await Translator._runPool(targets, async (target) => {
        try {
          const result = await Translator.translate(target.text, sourceLang, targetLang, {
            domain: dom.fileDomain.value,
            tone: dom.fileTone.value,
            glossary: dom.fileGlossary.value,
            context: dom.fileContext.value,
            job
          });
          target.translated = result.text;
        } catch (err) {
          if (err.cancelled) return false; // stop the pool
          // Leave a failed paragraph untranslated rather than aborting the
          // whole document.
          target.translated = null;
          target.error = true;
        }
        done++;
        dom.loadingText.textContent = `Translating… ${done}/${targets.length} paragraphs`;
        return true;
      }, BATCH_CONCURRENCY);

      Translator._throwIfCancelled(job);

      // Write each translation back into the paragraph's first run and empty
      // the rest, preserving that run's formatting and the paragraph style.
      let failed = 0;
      for (const target of targets) {
        if (typeof target.translated !== 'string') { failed++; continue; }
        target.ts[0].textContent = target.translated;
        target.ts[0].setAttribute('xml:space', 'preserve');
        for (let k = 1; k < target.ts.length; k++) target.ts[k].textContent = '';
      }

      // Serialize back (XMLSerializer drops the XML declaration — re-add it).
      const serialized = new XMLSerializer().serializeToString(xmlDoc);
      const withDecl = serialized.startsWith('<?xml')
        ? serialized
        : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n' + serialized;
      zip.file('word/document.xml', withDecl);

      const blob = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const base = (currentFileObject.name.replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]/g, '_').trim()) || 'translation';
      triggerDownload(blob, `${base}_translated_${targetLang}.docx`);

      History.add({
        sourceLang: sourceLang === 'auto' ? 'Auto' : sourceLang,
        targetLang,
        sourceText: targets.map(t => t.text).join('\n'),
        translatedText: targets.map(t => (typeof t.translated === 'string' ? t.translated : t.text)).join('\n'),
        type: 'file',
        domain: dom.fileDomain.value
      });

      if (failed) {
        showToast(`Downloaded — but ${failed} paragraph(s) failed and kept the original text`, 'error');
      } else {
        showToast('Downloaded translated .docx with formatting preserved', 'success');
      }
    } catch (err) {
      if (err.cancelled) {
        showToast('Translation cancelled', 'success');
      } else {
        if (err.message.includes('API key')) {
          dom.apiKeyInput.focus();
          dom.apiKeyInput.select();
        }
        showToast(err.message, 'error');
      }
    } finally {
      Translator.endJob(job);
      showExtracting(false);
    }
  }

  // ===== Batch CSV import/export =====
  // Format: source_text, source_lang (optional), translation (optional).
  // Export writes a header row so files round-trip through Excel/Sheets;
  // import skips the header when present.

  const BATCH_CSV_LANGS = ['auto', ...LANGUAGES];

  function csvEscapeField(value) {
    // Always quote: safe for commas, quotes and embedded newlines
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  }

  // Minimal RFC-4180 parser (quoted fields, escaped quotes, CRLF)
  function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    // Strip a UTF-8 BOM if present
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += c;
        }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
      } else {
        field += c;
      }
    }
    if (field !== '' || row.length > 0) {
      row.push(field);
      rows.push(row);
    }
    return rows;
  }

  function exportBatchCsv() {
    const rows = [...dom.batchRows.querySelectorAll('.batch-row')];
    const lines = ['source_text,source_lang,translation'];
    let exported = 0;

    for (const row of rows) {
      const sourceText = row.querySelector('textarea').value;
      const sourceLang = row.querySelector('.batch-source-lang').value;
      const resultDiv = row.querySelector('.batch-row-result');
      const translation = resultDiv.dataset.hasResult === 'true' ? resultDiv.textContent : '';

      if (!sourceText.trim() && !translation) continue; // skip empty rows
      lines.push([sourceText, sourceLang, translation].map(csvEscapeField).join(','));
      exported++;
    }

    if (exported === 0) {
      showToast('Nothing to export — the rows are empty', 'error');
      return;
    }

    // BOM so Excel detects UTF-8 correctly
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    triggerDownload(blob, `batch_translations_${dom.batchTargetLang.value}.csv`);
    showToast(`Exported ${exported} row(s) to CSV`, 'success');
  }

  function importBatchCsvFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      let entries;
      try {
        const rows = parseCSV(String(reader.result || ''));
        entries = rows
          // Skip header row when present
          .filter((r, i) => !(i === 0 && /^source[\s_-]?text$/i.test((r[0] || '').trim())))
          .map(r => ({
            sourceText: (r[0] || '').trim(),
            sourceLang: normalizeBatchCsvLang(r[1]),
            translation: (r[2] || '').trim()
          }))
          .filter(e => e.sourceText);
      } catch {
        showToast('Failed to parse CSV file', 'error');
        return;
      }

      if (entries.length === 0) {
        showToast('No valid rows found in the CSV file', 'error');
        return;
      }

      // Replace current rows with the imported ones
      dom.batchRows.innerHTML = '';
      for (const entry of entries) {
        addBatchRow();
        const row = dom.batchRows.lastElementChild;
        const textarea = row.querySelector('textarea');
        textarea.value = entry.sourceText;
        textarea.dispatchEvent(new Event('input')); // refresh char count
        row.querySelector('.batch-source-lang').value = entry.sourceLang;
        if (entry.translation) {
          // Restore a previously exported translation as a finished result
          row.querySelector('.batch-row-result').textContent = entry.translation;
        }
      }
      showToast(`Imported ${entries.length} row(s) from CSV`, 'success');
    };
    reader.onerror = () => showToast('Failed to read the CSV file', 'error');
    reader.readAsText(file, 'UTF-8');
  }

  function normalizeBatchCsvLang(value) {
    const v = (value || '').trim().toLowerCase();
    const match = BATCH_CSV_LANGS.find(l => l.toLowerCase() === v);
    return match || 'auto';
  }

  // Export the currently VISIBLE (filtered) history entries to CSV
  function exportHistoryCsv() {
    const items = History.filter(History.getAll(), { query: historyQuery, type: historyType });
    if (items.length === 0) {
      showToast('Nothing to export', 'error');
      return;
    }

    const lines = ['timestamp,type,source_lang,target_lang,domain,source_text,translation'];
    for (const item of items) {
      lines.push([
        item.timestamp, item.type, item.sourceLang, item.targetLang,
        item.domain || 'general', item.sourceText, item.translatedText
      ].map(csvEscapeField).join(','));
    }

    // BOM so Excel detects UTF-8 correctly
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    triggerDownload(blob, 'translation_history.csv');
    showToast(`Exported ${items.length} history entr${items.length === 1 ? 'y' : 'ies'} to CSV`, 'success');
  }

  // Escapes for BOTH text-content and quoted-attribute contexts — a
  // textContent-based helper leaves " and ' intact, which is unsafe for
  // values placed inside value="..." (e.g. glossary preset <option>s).
  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ===== Start =====
  init();
})();
