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

    // History tab
    historyList: document.getElementById('historyList'),
    clearHistory: document.getElementById('clearHistory'),
    historySearch: document.getElementById('historySearch'),
    historyTypeFilter: document.getElementById('historyTypeFilter'),
    exportHistory: document.getElementById('exportHistory')

    // Theme toggle
  };

  const themeToggle = document.getElementById('themeToggle');

  let currentTab = 'text';
  let currentFileText = '';
  let currentFileName = '';
  let currentFilePages = null; // per-page text for PDFs (page-range feature)
  let pendingOcrFile = null;   // scanned PDF waiting for a user-triggered OCR
  let batchRowCounter = 0;
  let isLoading = false;

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
    currentTab = target;
    dom.tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === target));
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

  // Keep overlay only for file extraction (no button to spin)
  function showExtracting(show) {
    if (show) {
      isLoading = true;
      dom.loadingText.textContent = 'Extracting text from file...';
      dom.loadingOverlay.classList.remove('hidden');
    } else {
      isLoading = false;
      dom.loadingOverlay.classList.add('hidden');
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
    });

    // Result change - update copy button state (locked while a
    // translation is streaming in, so partial text can't be copied)
    const updateTextResultCopyBtn = () => {
      dom.copyTextResult.disabled = !dom.textResult.textContent || isLoading;
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
      updateTextResultCopyBtn();
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

    // Initial state
    updateTextResultCopyBtn();

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

    try {
      setButtonLoading(dom.translateText, true);
      showCancelButton(dom.cancelTextTranslate, true);
      dom.textResult.textContent = '';
      dom.textDetectedLang.textContent = '';
      dom.textUsage.textContent = '';
      dom.textUsage.title = '';

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
          dom.textResult.textContent = s.text;
        },
        onDetectedLang: (lang) => {
          dom.textDetectedLang.textContent = `Detected: ${lang}`;
        }
      };

      const result = await Translator.translate(text, sourceLang, targetLang, options);
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
    dom.fileInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));

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
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
      });
    });

    // Page range selection (PDF only)
    dom.pageFrom.addEventListener('change', onPageRangeChange);
    dom.pageTo.addEventListener('change', onPageRangeChange);

    // OCR for scanned PDFs
    dom.runOcr.addEventListener('click', () => runOcrExtraction());
    dom.dismissOcr.addEventListener('click', () => {
      pendingOcrFile = null;
      dom.ocrPrompt.classList.add('hidden');
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
      currentFilePages = null;
      pendingOcrFile = null;
      dom.fileInput.value = '';
      dom.filePreview.classList.add('hidden');
      dom.ocrPrompt.classList.add('hidden');
      dom.pageRangeRow.classList.add('hidden');
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
    try {
      showExtracting(true);
      const result = await FileParser.parseFile(file, {
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
          dom.ocrPrompt.classList.remove('hidden');
        } else {
          showToast('No text could be extracted from this file.', 'error');
        }
        return;
      }

      // Parsing succeeded — now it's safe to commit the new file and
      // discard whatever was loaded before.
      dom.ocrPrompt.classList.add('hidden');
      pendingOcrFile = null;
      commitParsedFile(file, result);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      dom.fileInput.value = '';
      showExtracting(false);
    }
  }

  // OCR entry point for scanned PDFs (user-initiated — it is slow).
  async function runOcrExtraction() {
    const file = pendingOcrFile;
    if (!file) return;

    try {
      dom.ocrPrompt.classList.add('hidden');
      showExtracting(true);
      dom.loadingText.textContent = 'Loading OCR engine…';

      const result = await FileParser.ocrPdf(file, {
        langCode: FileParser.tesseractLangFor(dom.fileSourceLang.value),
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
      commitParsedFile(file, result);

      if (result.truncated) {
        showToast(`OCR processed the first ${FileParser.OCR_MAX_PAGES} pages only`, 'error');
      }
    } catch (err) {
      // OCR failed — restore the prompt so the user can retry
      dom.ocrPrompt.classList.remove('hidden');
      showToast(err.message, 'error');
    } finally {
      showExtracting(false);
    }
  }

  // Commit a successfully parsed file to the preview/translation state
  function commitParsedFile(file, result) {
    currentFileText = result.text;
    currentFileName = file.name;
    currentFilePages = result.pages || null;
    dom.fileResult.textContent = '';
    dom.fileUsage.textContent = '';

    dom.fileName.textContent = `${file.name} (${formatFileSize(file.size)})`;
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
        <select class="lang-select batch-source-lang">${sourceLangOptions}</select>
        <textarea placeholder="Enter text..." rows="3"></textarea>
        <div class="batch-row-char-count">0 characters</div>
      </div>
      <div class="batch-row-actions">
        <button class="btn btn-icon translate-row-btn" title="Translate this row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
        <button class="btn btn-icon remove-row-btn" title="Remove row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="batch-row-output">
        <div class="batch-row-detected"></div>
        <div class="batch-row-result" data-result-id="${rowId}"></div>
        <div class="batch-row-usage"></div>
        <button class="btn btn-icon copy-row-btn" title="Copy translation" disabled>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
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
  }

  async function translateBatchRow(row) {
    // Guard against concurrent Translate All
    if (dom.translateBatch.disabled) {
      showToast('Batch translation is already in progress', 'error');
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
      row.dataset.translating = 'true';
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
        if (err.message.includes('API key')) {
          dom.apiKeyInput.focus();
          dom.apiKeyInput.select();
        }
        showToast(err.message, 'error');
      }
    } finally {
      showCancelButton(dom.cancelBatch, false);
      delete row.dataset.translating;
      row._updateCopyBtn();
      translateBtn.disabled = false;
      removeBtn.disabled = false;
      textarea.readOnly = false;
    }
  }

  async function translateBatchAll() {
    const rows = [...dom.batchRows.querySelectorAll('.batch-row')];
    let translations = 0;
    let emptySkipped = 0;
    let sameLangSkipped = 0;
    let errors = 0;
    let truncatedCount = 0;
    let cancelled = false;

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

    // One shared cancellation job for the whole run — the Cancel button
    // aborts every in-flight row request at once.
    const job = Translator.createJob();

    try {
      await Translator._runPool(work, async ({ row, text, sourceLang, targetLang, resultDiv }) => {
        row.dataset.translating = 'true';
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
          errors++;
          if (err.message.includes('API key') && translations === 0) {
            dom.apiKeyInput.focus();
            dom.apiKeyInput.select();
          }
        } finally {
          delete row.dataset.translating;
          if (row._updateCopyBtn) row._updateCopyBtn();
        }
        return true;
      }, BATCH_CONCURRENCY);
    } finally {
      Translator.endJob(job);
      setButtonLoading(dom.translateBatch, false);
      setBatchRowsLocked(false);
      showCancelButton(dom.cancelBatch, false);
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
      <div class="text-modal-content">
        <div class="text-modal-header">
          <h3>${escapeHtml(title)}</h3>
          <button class="text-modal-close" title="Close (Esc)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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

    const closeModal = () => modal.remove();
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

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ===== Start =====
  init();
})();
