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
    textDomain: document.getElementById('textDomain'),
    textTone: document.getElementById('textTone'),
    textGlossary: document.getElementById('textGlossary'),
    textContext: document.getElementById('textContext'),
    toggleTextAdvanced: document.getElementById('toggleTextAdvanced'),
    textAdvancedOptions: document.getElementById('textAdvancedOptions'),

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
    fileDomain: document.getElementById('fileDomain'),
    fileTone: document.getElementById('fileTone'),
    fileGlossary: document.getElementById('fileGlossary'),
    fileContext: document.getElementById('fileContext'),
    toggleFileAdvanced: document.getElementById('toggleFileAdvanced'),
    fileAdvancedOptions: document.getElementById('fileAdvancedOptions'),

    // Batch tab
    batchTargetLang: document.getElementById('batchTargetLang'),
    batchDomain: document.getElementById('batchDomain'),
    addBatchRow: document.getElementById('addBatchRow'),
    translateBatch: document.getElementById('translateBatch'),
    batchRows: document.getElementById('batchRows'),

    // History tab
    historyList: document.getElementById('historyList'),
    clearHistory: document.getElementById('clearHistory')

    // Theme toggle
  };

  const themeToggle = document.getElementById('themeToggle');

  let currentTab = 'text';
  let currentFileText = '';
  let batchRowCounter = 0;
  let isLoading = false;

  // ===== Initialize =====
  function init() {
    loadApiKey();
    setupThemeToggle();
    loadPreferences();
    setupTabSwitching();
    setupTextTab();
    setupFileTab();
    setupBatchTab();
    setupHistoryTab();
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
      batchDomain: dom.batchDomain.value
    };
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (e) {
      // Storage full — ignore
    }
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

  dom.saveApiKey.addEventListener('click', () => {
    const key = dom.apiKeyInput.value.trim();
    if (key) {
      Translator.setApiKey(key);
      showToast('API key saved', 'success');
    } else {
      Translator.clearApiKey();
      showToast('API key cleared', 'success');
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
    dom.textSourceLang.addEventListener('change', savePreferences);
    dom.textTargetLang.addEventListener('change', savePreferences);
    dom.textDomain.addEventListener('change', savePreferences);
    dom.textTone.addEventListener('change', savePreferences);

    // Character count & update copy button state
    dom.textInput.addEventListener('input', () => {
      const charCount = dom.textInput.value.length;
      const maxChars = 50000;
      let warning = '';
      if (charCount > maxChars) {
        warning = ' 🔴 Exceeds limit';
      } else if (charCount > 40000) {
        warning = ' ⚠️ Approaching limit';
      } else if (charCount > 20000) {
        warning = ' ℹ️ Large text';
      }
      dom.textCharCount.textContent = `${charCount.toLocaleString()} / ${maxChars.toLocaleString()} characters${warning}`;
    });

    // Result change - update copy button state
    const updateTextResultCopyBtn = () => {
      dom.copyTextResult.disabled = !dom.textResult.textContent;
    };

    // Observe result changes
    const resultObserver = new MutationObserver(updateTextResultCopyBtn);
    resultObserver.observe(dom.textResult, { childList: true, characterData: true, subtree: true });

    // Clear input
    dom.clearTextInput.addEventListener('click', () => {
      dom.textInput.value = '';
      dom.textResult.textContent = '';
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

      // Prepare translation options
      const options = {
        domain: dom.textDomain.value,
        tone: dom.textTone.value,
        glossary: dom.textGlossary.value,
        context: dom.textContext.value
      };

      const result = await Translator.translate(text, sourceLang, targetLang, options);
      dom.textResult.textContent = result.text;

      History.add({
        sourceLang: sourceLang === 'auto' ? 'Auto' : sourceLang,
        targetLang,
        sourceText: text,
        translatedText: result.text,
        type: 'text',
        domain: options.domain
      });

      if (result.truncated) {
        showToast('Output was truncated — text may be too long for one request', 'error');
      }
    } catch (err) {
      if (err.message.includes('API key')) {
        dom.apiKeyInput.focus();
        dom.apiKeyInput.select();
      }
      showToast(err.message, 'error');
    } finally {
      setButtonLoading(dom.translateText, false);
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
    dom.fileSourceLang.addEventListener('change', savePreferences);
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

    // Replace file
    dom.replaceFile.addEventListener('click', () => {
      dom.fileInput.value = '';
      dom.fileInput.click();
    });

    // Remove file
    dom.removeFile.addEventListener('click', () => {
      currentFileText = '';
      dom.fileInput.value = '';
      dom.filePreview.classList.add('hidden');
      dom.dropZone.style.display = '';
      dom.fileResult.textContent = '';
      updateFileResultCopyBtn();
    });

    // Translate
    dom.translateFile.addEventListener('click', () => translateFileTab());

    // Update copy button state for file result
    const updateFileResultCopyBtn = () => {
      dom.copyFileResult.disabled = !dom.fileResult.textContent;
    };

    // Observe file result changes
    const fileResultObserver = new MutationObserver(updateFileResultCopyBtn);
    fileResultObserver.observe(dom.fileResult, { childList: true, characterData: true, subtree: true });

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
      const text = await FileParser.parseFile(file);

      if (!text || !text.trim()) {
        showToast('No text could be extracted from this file. It may be an image-based PDF with no selectable text.', 'error');
        return;
      }

      // Parsing succeeded — now it's safe to commit the new file and
      // discard whatever was loaded before.
      currentFileText = text;
      dom.fileResult.textContent = '';

      const maxChars = 50000;
      let warning = '';
      if (text.length > maxChars) {
        warning = ' 🔴 Exceeds limit - file too large to translate';
      } else if (text.length > 40000) {
        warning = ' ⚠️ Approaching limit';
      }

      dom.fileName.textContent = `${file.name} (${formatFileSize(file.size)})`;
      dom.extractedText.textContent = text.length > 5000 ? text.substring(0, 5000) + '\n\n(truncated for preview...)' : text;
      dom.fileCharCount.textContent = `${text.length.toLocaleString()} / ${maxChars.toLocaleString()} characters${warning}`;
      dom.dropZone.style.display = 'none';
      dom.filePreview.classList.remove('hidden');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      dom.fileInput.value = '';
      showExtracting(false);
    }
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

      // Prepare translation options for file
      const options = {
        domain: dom.fileDomain.value,
        tone: dom.fileTone.value,
        glossary: dom.fileGlossary.value,
        context: dom.fileContext.value
      };

      const result = await Translator.translate(currentFileText, sourceLang, targetLang, options);
      dom.fileResult.textContent = result.text;

      History.add({
        sourceLang: sourceLang === 'auto' ? 'Auto' : sourceLang,
        targetLang,
        sourceText: currentFileText,
        translatedText: result.text,
        type: 'file',
        domain: options.domain
      });

      if (result.truncated) {
        showToast('Output was truncated — text may be too long for one request', 'error');
      }
    } catch (err) {
      if (err.message.includes('API key')) {
        dom.apiKeyInput.focus();
        dom.apiKeyInput.select();
      }
      showToast(err.message, 'error');
    } finally {
      setButtonLoading(dom.translateFile, false);
    }
  }

  // ===== Batch Tab =====
  function setupBatchTab() {
    dom.addBatchRow.addEventListener('click', () => addBatchRow());
    dom.translateBatch.addEventListener('click', () => translateBatchAll());

    // Save preferences on language/domain change
    dom.batchTargetLang.addEventListener('change', savePreferences);
    dom.batchDomain.addEventListener('change', savePreferences);

    // Start with 3 rows
    for (let i = 0; i < 3; i++) {
      addBatchRow();
    }
  }

  function addBatchRow() {
    batchRowCounter++;
    const rowId = batchRowCounter;

    const row = document.createElement('div');
    row.className = 'batch-row';
    row.dataset.rowId = rowId;
    row.innerHTML = `
      <div class="batch-row-input">
        <select class="lang-select batch-source-lang">
          <option value="auto">Auto Detect</option>
          <option value="Vietnamese">Vietnamese</option>
          <option value="English">English</option>
          <option value="Japanese">Japanese</option>
          <option value="Korean">Korean</option>
          <option value="Chinese">Chinese</option>
          <option value="French">French</option>
          <option value="German">German</option>
          <option value="Spanish">Spanish</option>
          <option value="Russian">Russian</option>
          <option value="Thai">Thai</option>
          <option value="Arabic">Arabic</option>
          <option value="Portuguese">Portuguese</option>
          <option value="Italian">Italian</option>
        </select>
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
        <div class="batch-row-result" data-result-id="${rowId}"></div>
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

    // Copy result — only enabled once there's an actual translation,
    // not for transient "Translating..." / "Error: ..." / "Skipped: ..." text.
    const placeholderPattern = /^(Translating\.\.\.|Error:|Skipped:)/;
    const updateCopyBtnState = () => {
      const content = resultDiv.textContent;
      const hasResult = !!content && !placeholderPattern.test(content);
      resultDiv.dataset.hasResult = hasResult ? 'true' : 'false';
      copyBtn.disabled = !hasResult;
    };
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
      translateBtn.disabled = true;
      removeBtn.disabled = true;
      textarea.readOnly = true;
      resultDiv.textContent = 'Translating...';

      // Prepare translation options
      const options = {
        domain: dom.batchDomain.value,
        tone: 'professional'
      };

      const result = await Translator.translate(text, sourceLang, targetLang, options);
      resultDiv.textContent = result.text;

      History.add({
        sourceLang: sourceLang === 'auto' ? 'Auto' : sourceLang,
        targetLang,
        sourceText: text,
        translatedText: result.text,
        type: 'batch',
        domain: options.domain
      });

      if (result.truncated) {
        showToast('Output was truncated — text may be too long for one request', 'error');
      }
    } catch (err) {
      resultDiv.textContent = '';
      if (err.message.includes('API key')) {
        dom.apiKeyInput.focus();
        dom.apiKeyInput.select();
      }
      showToast(err.message, 'error');
    } finally {
      translateBtn.disabled = false;
      removeBtn.disabled = false;
      textarea.readOnly = false;
    }
  }

  async function translateBatchAll() {
    const rows = dom.batchRows.querySelectorAll('.batch-row');
    let translations = 0;
    let emptySkipped = 0;
    let sameLangSkipped = 0;
    let errors = 0;
    let truncatedCount = 0;

    setButtonLoading(dom.translateBatch, true);
    setBatchRowsLocked(true);
    for (const row of rows) {
      const textarea = row.querySelector('textarea');
      const text = textarea.value.trim();
      if (!text) {
        emptySkipped++;
        continue;
      }

      const sourceLang = row.querySelector('.batch-source-lang').value;
      const targetLang = dom.batchTargetLang.value;
      const resultDiv = row.querySelector('.batch-row-result');

      if (sourceLang !== 'auto' && sourceLang === targetLang) {
        resultDiv.textContent = 'Skipped: same language';
        sameLangSkipped++;
        continue;
      }

      try {
        resultDiv.textContent = 'Translating...';

        // Prepare translation options
        const options = {
          domain: dom.batchDomain.value,
          tone: 'professional'
        };

        const result = await Translator.translate(text, sourceLang, targetLang, options);
        resultDiv.textContent = result.text;
        translations++;
        if (result.truncated) truncatedCount++;

        History.add({
          sourceLang: sourceLang === 'auto' ? 'Auto' : sourceLang,
          targetLang,
          sourceText: text,
          translatedText: result.text,
          type: 'batch',
          domain: options.domain
        });
      } catch (err) {
        resultDiv.textContent = 'Error: ' + err.message;
        errors++;
        if (err.message.includes('API key') && translations === 0) {
          dom.apiKeyInput.focus();
          dom.apiKeyInput.select();
        }
      }
    }
    setButtonLoading(dom.translateBatch, false);
    setBatchRowsLocked(false);

    const skippedTotal = emptySkipped + sameLangSkipped;

    if (translations > 0) {
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
  }

  function refreshHistory() {
    const scrollPos = dom.historyList.scrollTop;
    const items = History.getAll();
    dom.clearHistory.disabled = items.length === 0;

    if (items.length === 0) {
      dom.historyList.innerHTML = '<p class="empty-state">No translation history yet.</p>';
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

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ===== Start =====
  init();
})();
