window.UI = (() => {
  const { escapeHTML, formatTime, truncate, copyToClipboard, autoResize, highlightSearchText } = window.Utils;
  const { DEFAULT_SYSTEM_PROMPT } = window.APP_CONFIG;
  const t = (key, params) => window.I18n.t(key, params);

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const els = {};

  const cacheEls = () => {
    els.sidebar = $('#sidebar');
    els.sidebarOverlay = $('#sidebarOverlay');
    els.conversationList = $('#conversationList');
    els.messages = $('#messages');
    els.composer = $('#composer');
    els.composerInput = $('#composerInput');
    els.sendBtn = $('#sendBtn');
    els.stopBtn = $('#stopBtn');
    els.newChatBtn = $('#newChatBtn');
    els.themeToggleBtn = $('#themeToggleBtn');
    els.themeIcon = $('#themeIcon');
    els.openSidebarBtn = $('#openSidebarBtn');
    els.settingsModal = $('#settingsModal');
    els.apiKeyInput = $('#apiKeyInput');
    els.apiKeyIcon = $('#apiKeyIcon');
    els.anthropicApiKeyInput = $('#anthropicApiKeyInput');
    els.anthropicApiKeyIcon = $('#anthropicApiKeyIcon');
    els.deepseekApiKeyInput = $('#deepseekApiKeyInput');
    els.deepseekApiKeyIcon = $('#deepseekApiKeyIcon');
    els.nvidiaApiKeyInput = $('#nvidiaApiKeyInput');
    els.nvidiaApiKeyIcon = $('#nvidiaApiKeyIcon');
    els.byteplusApiKeyInput = $('#byteplusApiKeyInput');
    els.byteplusApiKeyIcon = $('#byteplusApiKeyIcon');
    els.geminiApiKeyInput = $('#geminiApiKeyInput');
    els.geminiApiKeyIcon = $('#geminiApiKeyIcon');
    els.kimiApiKeyInput = $('#kimiApiKeyInput');
    els.kimiApiKeyIcon = $('#kimiApiKeyIcon');
    els.openrouterApiKeyInput = $('#openrouterApiKeyInput');
    els.openrouterApiKeyIcon = $('#openrouterApiKeyIcon');
    els.systemPromptInput = $('#systemPromptInput');
    els.settingsLocaleSelect = $('#settingsLocaleSelect');
    els.settingsThemeSelect = $('#settingsThemeSelect');
    els.settingsForm = $('#settingsForm');
    els.toast = $('#toast');
    els.selectionReplyTooltip = $('#selectionReplyTooltip');
    els.openSettingsBtn = $('#openSettingsBtn');
    els.guideModal = $('#guideModal');
    els.openGuideBtn = $('#openGuideBtn');
    els.settingsGuideBtn = $('#settingsGuideBtn');
    els.guideOpenSettingsBtn = $('#guideOpenSettingsBtn');
    els.guideBody = $('#guideModal')?.querySelector('.guide-body');
    els.copyMarkdownBtn = $('#copyMarkdownBtn');
    els.shareChatBtn = $('#shareChatBtn');
    els.shareModal = $('#shareModal');
    els.shareLoading = $('#shareLoading');
    els.shareResult = $('#shareResult');
    els.shareError = $('#shareError');
    els.shareLinkInput = $('#shareLinkInput');
    els.shareCopyBtn = $('#shareCopyBtn');
    els.shareViewHeader = $('#shareViewHeader');
    els.shareViewTitle = $('#shareViewTitle');
    els.shareViewModelPill = $('#shareViewModelPill');
    els.shareViewReadonlyText = $('#shareViewReadonlyText');
    els.shareViewOpenApp = $('#shareViewOpenApp');
    els.headerDownloadWrap = $('#headerDownloadWrap');
    els.headerDownloadBtn = $('#headerDownloadBtn');
    els.headerDownloadMenu = $('#headerDownloadMenu');
    els.headerNewChatBtn = $('#headerNewChatBtn');
    els.pdfExportOverlay = $('#pdfExportOverlay');
    els.pdfExportLoadingTitle = $('#pdfExportLoadingTitle');
    els.pdfExportLoadingText = $('#pdfExportLoadingText');
    els.pdfExportSpinner = $('#pdfExportSpinner');
    els.pdfExportDownloadBtn = $('#pdfExportDownloadBtn');
    els.toggleExportSelectBtn = $('#toggleExportSelectBtn');
    els.exportSelectBar = $('#exportSelectBar');
    els.exportSelectCount = $('#exportSelectCount');
    els.exportSelectAllBtn = $('#exportSelectAllBtn');
    els.exportSelectClearBtn = $('#exportSelectClearBtn');
    els.exitExportSelectBtn = $('#exitExportSelectBtn');
    els.clearAllBtn = $('#clearAllBtn');
    els.clearAllSidebarBtn = $('#clearAllSidebarBtn');
    els.toggleApiKeyBtn = $('#toggleApiKeyBtn');
    els.toggleAnthropicApiKeyBtn = $('#toggleAnthropicApiKeyBtn');
    els.toggleDeepseekApiKeyBtn = $('#toggleDeepseekApiKeyBtn');
    els.toggleNvidiaApiKeyBtn = $('#toggleNvidiaApiKeyBtn');
    els.toggleByteplusApiKeyBtn = $('#toggleByteplusApiKeyBtn');
    els.toggleGeminiApiKeyBtn = $('#toggleGeminiApiKeyBtn');
    els.toggleKimiApiKeyBtn = $('#toggleKimiApiKeyBtn');
    els.toggleOpenrouterApiKeyBtn = $('#toggleOpenrouterApiKeyBtn');
    els.composerAttachments = $('#composerAttachments');
    els.composerTools = $('#composerTools');
    els.webSearchBtn = $('#webSearchBtn');
    els.imageGenBtn = $('#imageGenBtn');
    els.thinkingBtn = $('#thinkingBtn');
    els.translateBtn = $('#translateBtn');
    els.systemPromptModeSelect = $('#systemPromptModeSelect');
    els.systemPromptModeHint = $('#systemPromptModeHint');
    els.settingsTokenUsageModel = $('#settingsTokenUsageModel');
    els.settingsTokenUsageInput = $('#settingsTokenUsageInput');
    els.settingsTokenUsageOutput = $('#settingsTokenUsageOutput');
    els.settingsTokenUsageTotal = $('#settingsTokenUsageTotal');
    els.settingsTokenUsageCost = $('#settingsTokenUsageCost');
    els.tokenCostWarningModal = $('#tokenCostWarningModal');
    els.tokenCostWarningMessage = $('#tokenCostWarningMessage');
    els.tokenCostWarningSettingsBtn = $('#tokenCostWarningSettingsBtn');
    els.composerTranslateBar = $('#composerTranslateBar');
    els.translateChipClose = $('#translateChipClose');
    els.translateLangBtn = $('#translateLangBtn');
    els.translateLangLabel = $('#translateLangLabel');
    els.translateLangMenu = $('#translateLangMenu');
    els.translateLangOptions = $('#translateLangOptions');
    els.composerImageGenBar = $('#composerImageGenBar');
    els.imageGenChipClose = $('#imageGenChipClose');
    els.imageGenRefBtn = $('#imageGenRefBtn');
    els.imageGenRefLabel = $('#imageGenRefLabel');
    els.imageGenRefInput = $('#imageGenRefInput');
    els.imageGenRatioBtn = $('#imageGenRatioBtn');
    els.imageGenRatioPicker = $('#imageGenRatioPicker');
    els.imageGenRatioChip = $('#imageGenRatioChip');
    els.imageGenRatioChipLabel = $('#imageGenRatioChipLabel');
    els.imageGenRatioChipClear = $('#imageGenRatioChipClear');
    els.imageGenRatioMenu = $('#imageGenRatioMenu');
    els.imageGenRatioOptions = $('#imageGenRatioOptions');
    els.imageGenStyleBtn = $('#imageGenStyleBtn');
    els.imageGenStylePicker = $('#imageGenStylePicker');
    els.imageGenStyleChip = $('#imageGenStyleChip');
    els.imageGenStyleChipLabel = $('#imageGenStyleChipLabel');
    els.imageGenStyleChipClear = $('#imageGenStyleChipClear');
    els.imageGenStyleMenu = $('#imageGenStyleMenu');
    els.imageGenStyleOptions = $('#imageGenStyleOptions');
    els.imageGenTemplateBtn = $('#imageGenTemplateBtn');
    els.imageGenTemplatePicker = $('#imageGenTemplatePicker');
    els.imageGenTemplateChip = $('#imageGenTemplateChip');
    els.imageGenTemplateChipLabel = $('#imageGenTemplateChipLabel');
    els.imageGenTemplateChipClear = $('#imageGenTemplateChipClear');
    els.imageGenTemplateMenu = $('#imageGenTemplateMenu');
    els.imageGenTemplateOptions = $('#imageGenTemplateOptions');
    els.composerDropZone = $('#composerDropZone');
    els.appDropOverlay = $('#appDropOverlay');
    els.app = $('#app');
    els.attachBtn = $('#attachBtn');
    els.attachFileInput = $('#attachFileInput');
    els.markdownPreviewPanel = $('#markdownPreviewPanel');
    els.markdownPreviewContent = $('#markdownPreviewContent');
    els.mdPreviewResizeHandle = $('#mdPreviewResizeHandle');
    els.mdPreviewHeader = $('.md-preview-header');
    els.closeMdPreviewBtn = $('#closeMdPreviewBtn');
    els.mdPreviewOverlay = $('#mdPreviewOverlay');
    els.main = $('.main');
    els.imagePreviewOverlay = $('#imagePreviewOverlay');
    els.imagePreviewImg = $('#imagePreviewImg');
    els.imagePreviewCaption = $('#imagePreviewCaption');
    els.closeImagePreviewBtn = $('#closeImagePreviewBtn');
    els.previewPanelIcon = $('#previewPanelIcon');
    els.previewPanelTitle = $('#previewPanelTitle');
    els.renameModal = $('#renameModal');
    els.renameForm = $('#renameForm');
    els.renameInput = $('#renameInput');
    els.modelSelect = $('#modelSelect');
    els.providerSelect = $('#providerSelect');
    els.effortSelect = $('#effortSelect');
    els.toggleSidebarSearchBtn = $('#toggleSidebarSearchBtn');
    els.sidebarSearchWrap = $('#sidebarSearchWrap');
    els.sidebarSearchInput = $('#sidebarSearchInput');
    els.sidebarSearchClear = $('#sidebarSearchClear');
    els.messageScrollRail = $('#messageScrollRail');
    els.messageScrollRailTicks = $('#messageScrollRailTicks');
    els.messageScrollRailIndicator = $('#messageScrollRailIndicator');
    els.messageScrollRailTooltip = $('#messageScrollRailTooltip');
    els.messageScrollRailPrev = $('#messageScrollRailPrev');
    els.messageScrollRailNext = $('#messageScrollRailNext');
    bindMessagesScroll();
    bindMessageScrollRail();
  };

  const syncComposerToolsUI = (modelId, toolState) => {
    const {
      webSearchEnabled, imageGenEnabled, thinkingEnabled, translateEnabled, translateTargetLang,
      imageGenRatio, imageGenStyle, imageGenTemplate
    } = toolState;
    const showWebSearch = window.APP_CONFIG.modelSupportsWebSearch(modelId);
    const showImageGen = window.APP_CONFIG.modelSupportsImageGen(modelId);
    const showThinking = window.APP_CONFIG.modelSupportsThinking(modelId);
    const hasTools = showWebSearch || showImageGen || showThinking || true;

    if (els.composerTools) {
      els.composerTools.classList.toggle('hidden', !hasTools);
    }
    if (els.webSearchBtn) {
      els.webSearchBtn.classList.toggle('hidden', !showWebSearch);
      const active = showWebSearch && !!webSearchEnabled;
      els.webSearchBtn.classList.toggle('is-active', active);
      els.webSearchBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
    if (els.imageGenBtn) {
      els.imageGenBtn.classList.toggle('hidden', !showImageGen);
      const active = showImageGen && !!imageGenEnabled;
      els.imageGenBtn.classList.toggle('is-active', active);
      els.imageGenBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
    if (els.thinkingBtn) {
      els.thinkingBtn.classList.toggle('hidden', !showThinking);
      const thinkingRequired = window.APP_CONFIG.modelThinkingRequired(modelId);
      const active = showThinking && (!!thinkingEnabled || thinkingRequired);
      els.thinkingBtn.classList.toggle('is-active', active);
      els.thinkingBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
    const thinkingActive = showThinking && (!!thinkingEnabled || window.APP_CONFIG.modelThinkingRequired(modelId));
    const reasoningEffort = window.Storage.get().reasoningEffort;
    syncEffortSelect(modelId, reasoningEffort, thinkingActive);
    if (els.translateBtn) {
      const active = !!translateEnabled;
      els.translateBtn.classList.toggle('is-active', active);
      els.translateBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
    syncTranslateUI({ translateEnabled, translateTargetLang: translateTargetLang || stateTranslateLang });
    syncImageGenUI({
      imageGenEnabled: showImageGen && !!imageGenEnabled,
      imageGenRatio,
      imageGenStyle,
      imageGenTemplate,
      referenceImage: toolState.referenceImage,
      imageGenRatioPicked: toolState.imageGenRatioPicked,
      imageGenStylePicked: toolState.imageGenStylePicked,
      imageGenTemplatePicked: toolState.imageGenTemplatePicked
    });
    syncComposerPlaceholder({ imageGenEnabled, translateEnabled });
  };

  let stateTranslateLang = window.APP_CONFIG.DEFAULT_TRANSLATE_LANG;

  const initTranslateLangMenu = () => {
    if (!els.translateLangOptions) return;
    const { TRANSLATE_LANGUAGES } = window.APP_CONFIG;
    els.translateLangOptions.innerHTML = TRANSLATE_LANGUAGES.map((lang) =>
      '<button type="button" class="translate-lang-option" role="option" data-lang="' + escapeHTML(lang.code) + '">'
      + '<span>' + escapeHTML(lang.label) + '</span>'
      + '<i class="fa-solid fa-check" aria-hidden="true"></i>'
      + '</button>'
    ).join('');
  };

  const closeTranslateLangMenu = () => {
    if (!els.translateLangMenu) return;
    els.translateLangMenu.classList.add('hidden');
    if (els.translateLangBtn) els.translateLangBtn.setAttribute('aria-expanded', 'false');
  };

  const syncTranslateUI = ({ translateEnabled, translateTargetLang }) => {
    const langCode = translateTargetLang || window.APP_CONFIG.DEFAULT_TRANSLATE_LANG;
    stateTranslateLang = langCode;

    if (els.composerTranslateBar) {
      const on = !!translateEnabled;
      els.composerTranslateBar.classList.toggle('hidden', !on);
      els.composerTranslateBar.setAttribute('aria-hidden', on ? 'false' : 'true');
    }
    if (els.translateLangLabel) {
      els.translateLangLabel.textContent = window.I18n.getTranslateLabel(langCode);
    }
    if (els.composerInput && !els.composerInput.dataset.mode) {
      els.composerInput.placeholder = t('composerPlaceholder');
    }
    if (els.translateLangOptions) {
      els.translateLangOptions.querySelectorAll('.translate-lang-option').forEach((btn) => {
        const selected = btn.dataset.lang === langCode;
        btn.classList.toggle('is-selected', selected);
        btn.setAttribute('aria-selected', selected ? 'true' : 'false');
      });
    }
    closeTranslateLangMenu();
  };

  const syncComposerPlaceholder = ({ imageGenEnabled, translateEnabled }) => {
    if (!els.composerInput) return;
    if (imageGenEnabled) {
      els.composerInput.placeholder = t('composerPlaceholderImageGen');
      els.composerInput.dataset.mode = 'imagegen';
    } else if (translateEnabled) {
      els.composerInput.placeholder = t('composerPlaceholderTranslate');
      els.composerInput.dataset.mode = 'translate';
    } else {
      els.composerInput.placeholder = t('composerPlaceholder');
      delete els.composerInput.dataset.mode;
    }
  };

  const closeImageGenMenus = () => {
    [els.imageGenRatioMenu, els.imageGenStyleMenu, els.imageGenTemplateMenu].forEach((menu) => {
      if (menu) menu.classList.add('hidden');
    });
    [els.imageGenRatioBtn, els.imageGenStyleBtn, els.imageGenTemplateBtn].forEach((btn) => {
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  };

  const toggleImageGenMenu = (menu, btn) => {
    const isOpen = !menu.classList.contains('hidden');
    closeImageGenMenus();
    closeTranslateLangMenu();
    if (!isOpen) {
      menu.classList.remove('hidden');
      btn.setAttribute('aria-expanded', 'true');
    }
  };

  const initImageGenMenus = () => {
    if (els.imageGenRatioOptions) {
      els.imageGenRatioOptions.innerHTML = window.APP_CONFIG.IMAGE_GEN_RATIOS.map((ratio) =>
        '<button type="button" class="composer-dropdown-option" role="option" data-value="' + escapeHTML(ratio.id) + '">'
        + '<span class="ratio-icon" data-ratio="' + escapeHTML(ratio.id) + '" aria-hidden="true"></span>'
        + '<span class="composer-dropdown-option-text">'
        + '<span class="composer-dropdown-option-title">' + escapeHTML(ratio.label) + '</span> '
        + '<span class="composer-dropdown-option-desc">(' + escapeHTML(window.I18n.imageGenLabel('ratio', ratio.id, 'desc')) + ')</span>'
        + '</span>'
        + '<i class="fa-solid fa-check" aria-hidden="true"></i>'
        + '</button>'
      ).join('');
    }
    if (els.imageGenStyleOptions) {
      els.imageGenStyleOptions.innerHTML = window.APP_CONFIG.IMAGE_GEN_STYLES.map((style) =>
        '<button type="button" class="composer-dropdown-option" role="option" data-value="' + escapeHTML(style.id) + '">'
        + '<span class="composer-dropdown-option-text">' + escapeHTML(window.I18n.imageGenLabel('style', style.id)) + '</span>'
        + '<i class="fa-solid fa-check" aria-hidden="true"></i>'
        + '</button>'
      ).join('');
    }
    if (els.imageGenTemplateOptions) {
      els.imageGenTemplateOptions.innerHTML = window.APP_CONFIG.IMAGE_GEN_TEMPLATES.map((tpl) =>
        '<button type="button" class="composer-dropdown-option" role="option" data-value="' + escapeHTML(tpl.id) + '">'
        + '<span class="composer-dropdown-option-text">' + escapeHTML(window.I18n.imageGenLabel('template', tpl.id)) + '</span>'
        + '<i class="fa-solid fa-check" aria-hidden="true"></i>'
        + '</button>'
      ).join('');
    }
  };

  const setImageGenOptionPicked = (type, picked, { ratioId, styleId, templateId } = {}) => {
    const ratio = window.APP_CONFIG.getImageGenRatio(ratioId || window.APP_CONFIG.DEFAULT_IMAGE_GEN_RATIO);
    const style = window.APP_CONFIG.getImageGenStyle(styleId || window.APP_CONFIG.DEFAULT_IMAGE_GEN_STYLE);
    const template = window.APP_CONFIG.getImageGenTemplate(templateId || window.APP_CONFIG.DEFAULT_IMAGE_GEN_TEMPLATE);

    if (type === 'ratio') {
      if (els.imageGenRatioPicker) els.imageGenRatioPicker.classList.toggle('hidden', picked);
      if (els.imageGenRatioChip) els.imageGenRatioChip.classList.toggle('hidden', !picked);
      if (picked && els.imageGenRatioChipLabel) {
        els.imageGenRatioChipLabel.textContent = ratio.label;
      }
      if (picked && els.imageGenRatioChip) {
        const icon = els.imageGenRatioChip.querySelector('.ratio-icon');
        if (icon) icon.setAttribute('data-ratio', ratio.id);
      }
      if (picked) closeImageGenMenus();
    }

    if (type === 'style') {
      if (els.imageGenStylePicker) els.imageGenStylePicker.classList.toggle('hidden', picked);
      if (els.imageGenStyleChip) els.imageGenStyleChip.classList.toggle('hidden', !picked);
      if (picked && els.imageGenStyleChipLabel) {
        els.imageGenStyleChipLabel.textContent = window.I18n.imageGenLabel('style', styleId);
      }
      if (picked) closeImageGenMenus();
    }

    if (type === 'template') {
      if (els.imageGenTemplatePicker) els.imageGenTemplatePicker.classList.toggle('hidden', picked);
      if (els.imageGenTemplateChip) els.imageGenTemplateChip.classList.toggle('hidden', !picked);
      if (picked && els.imageGenTemplateChipLabel) {
        els.imageGenTemplateChipLabel.textContent = window.I18n.imageGenLabel('template', templateId);
      }
      if (picked) closeImageGenMenus();
    }
  };

  const syncImageGenUI = ({
    imageGenEnabled, imageGenRatio, imageGenStyle, imageGenTemplate, referenceImage,
    imageGenRatioPicked, imageGenStylePicked, imageGenTemplatePicked
  }) => {
    const ratioId = imageGenRatio || window.APP_CONFIG.DEFAULT_IMAGE_GEN_RATIO;
    const styleId = imageGenStyle || window.APP_CONFIG.DEFAULT_IMAGE_GEN_STYLE;
    const templateId = imageGenTemplate || window.APP_CONFIG.DEFAULT_IMAGE_GEN_TEMPLATE;

    if (els.composerImageGenBar) {
      const on = !!imageGenEnabled;
      els.composerImageGenBar.classList.toggle('hidden', !on);
      els.composerImageGenBar.setAttribute('aria-hidden', on ? 'false' : 'true');
    }
    if (els.imageGenRatioBtn) {
      const icon = els.imageGenRatioBtn.querySelector('.ratio-icon');
      if (icon) icon.setAttribute('data-ratio', ratioId);
    }
    setImageGenOptionPicked('ratio', !!imageGenRatioPicked, { ratioId });
    setImageGenOptionPicked('style', !!imageGenStylePicked, { styleId });
    setImageGenOptionPicked('template', !!imageGenTemplatePicked, { templateId });
    if (els.imageGenRatioOptions) {
      els.imageGenRatioOptions.querySelectorAll('.composer-dropdown-option').forEach((btn) => {
        const selected = btn.dataset.value === ratioId;
        btn.classList.toggle('is-selected', selected);
        btn.setAttribute('aria-selected', selected ? 'true' : 'false');
      });
    }
    if (els.imageGenStyleOptions) {
      els.imageGenStyleOptions.querySelectorAll('.composer-dropdown-option').forEach((btn) => {
        const selected = btn.dataset.value === styleId;
        btn.classList.toggle('is-selected', selected);
        btn.setAttribute('aria-selected', selected ? 'true' : 'false');
      });
    }
    if (els.imageGenTemplateOptions) {
      els.imageGenTemplateOptions.querySelectorAll('.composer-dropdown-option').forEach((btn) => {
        const selected = btn.dataset.value === templateId;
        btn.classList.toggle('is-selected', selected);
        btn.setAttribute('aria-selected', selected ? 'true' : 'false');
      });
    }
    if (els.imageGenRefBtn) {
      const hasRef = !!referenceImage;
      els.imageGenRefBtn.classList.toggle('is-active', hasRef);
      if (els.imageGenRefLabel) {
        els.imageGenRefLabel.textContent = hasRef
          ? truncate(referenceImage.name || t('referenceImage'), 18)
          : t('referenceImage');
      }
    }
    if (!imageGenEnabled) {
      closeImageGenMenus();
      setImageGenOptionPicked('ratio', false);
      setImageGenOptionPicked('style', false);
      setImageGenOptionPicked('template', false);
    }
  };

  const setStreamingSearchStatus = (article, status) => {
    if (!article) return;
    let badge = article.querySelector('.streaming-search-badge');
    if (status === 'searching') {
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'streaming-tool-badge streaming-search-badge';
        badge.innerHTML = '<i class="fa-solid fa-globe" aria-hidden="true"></i> ' + t('searchingWeb');
        article.querySelector('.content')?.prepend(badge);
      }
    } else if (badge) {
      badge.remove();
    }
  };

  const setStreamingImageStatus = (article, status) => {
    if (!article) return;
    let badge = article.querySelector('.streaming-image-badge');
    if (status === 'generating') {
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'streaming-tool-badge streaming-image-badge';
        badge.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> ' + t('generatingImage');
        article.querySelector('.content')?.prepend(badge);
      }
    } else if (badge) {
      badge.remove();
    }
  };

  const generatedImagesHTML = (images) => {
    if (!images || !images.length) return '';
    return '<div class="message-images message-generated-images">' + images.map((img, i) => {
      const alt = escapeHTML(img.name || t('aiImage', { n: i + 1 }));
      return '<div class="message-image-wrap message-generated-image-wrap">'
        + '<img class="message-preview-image" src="' + img.dataUrl + '" alt="' + alt + '" loading="lazy" title="' + escapeHTML(t('viewImage')) + '" />'
        + '<div class="generated-image-actions" aria-label="' + escapeHTML(t('copy')) + '">'
        + '<button type="button" class="generated-image-btn" data-copy-generated-image title="' + escapeHTML(t('copyImage')) + '" aria-label="' + escapeHTML(t('copyImage')) + '">'
        + '<i class="fa-solid fa-copy" aria-hidden="true"></i></button>'
        + '<button type="button" class="generated-image-btn" data-download-generated-image title="' + escapeHTML(t('downloadImage')) + '" aria-label="' + escapeHTML(t('downloadImage')) + '">'
        + '<i class="fa-solid fa-download" aria-hidden="true"></i></button>'
        + '</div></div>';
    }).join('') + '</div>';
  };

  const reasoningHTML = (reasoning, { open = false } = {}) => {
    if (!reasoning || !reasoning.trim()) return '';
    return '<details class="message-reasoning"' + (open ? ' open' : '') + '>'
      + '<summary><i class="fa-solid fa-brain" aria-hidden="true"></i> ' + escapeHTML(t('reasoning')) + '</summary>'
      + '<div class="message-reasoning-body">' + window.Markdown.render(reasoning) + '</div>'
      + '</details>';
  };

  const groundingHTML = (meta) => {
    if (!meta) return '';
    const chunks = (meta.groundingChunks || []).filter((c) => c.web?.uri);
    const queries = meta.webSearchQueries || [];
    if (!chunks.length && !queries.length) return '';
    let html = '<details class="message-grounding"><summary><i class="fa-solid fa-globe" aria-hidden="true"></i> ' + escapeHTML(t('sources'));
    if (queries.length) {
      html += '<span class="message-grounding-queries">' + escapeHTML(queries.join(', ')) + '</span>';
    }
    html += '</summary>';
    if (chunks.length) {
      html += '<ul class="message-grounding-sources">';
      chunks.forEach((chunk) => {
        const uri = chunk.web.uri;
        const title = chunk.web.title || uri;
        html += '<li><a href="' + escapeHTML(uri) + '" target="_blank" rel="noopener noreferrer">'
          + escapeHTML(title) + '</a></li>';
      });
      html += '</ul>';
    }
    html += '</details>';
    return html;
  };

  const assistantContentHTML = (m) => {
    const text = window.Conversations.getAssistantContent(m);
    return reasoningHTML(m.reasoningContent)
      + groundingHTML(m.groundingMetadata)
      + window.Markdown.render(text)
      + generatedImagesHTML(m.generatedImages);
  };

  const updateModelSelect = (providerId, selectedModelId) => {
    if (!els.modelSelect) return;
    const models = window.APP_CONFIG.getModelsByProvider(providerId);
    const selected = models.some((m) => m.id === selectedModelId)
      ? selectedModelId
      : (models[0]?.id || window.APP_CONFIG.DEFAULT_MODEL);
    els.modelSelect.innerHTML = models.map((m) =>
      '<option value="' + escapeHTML(m.id) + '"' + (m.id === selected ? ' selected' : '') + '>'
      + escapeHTML(window.APP_CONFIG.getModelDisplayLabel(m)) + '</option>'
    ).join('');
    els.modelSelect.value = selected;
    return selected;
  };

  const syncProviderSelect = (providerId) => {
    if (!els.providerSelect) return;
    if (els.providerSelect.value !== providerId) {
      els.providerSelect.value = providerId;
    }
  };

  const initProviderSelects = (currentModel) => {
    const { DEFAULT_MODEL } = window.APP_CONFIG;
    const modelId = currentModel || DEFAULT_MODEL;
    const providerId = window.APP_CONFIG.getModelProvider(modelId);

    if (els.providerSelect) {
      const providers = window.APP_CONFIG.getProviders();
      els.providerSelect.innerHTML = providers.map((p) =>
        '<option value="' + escapeHTML(p.id) + '"' + (p.id === providerId ? ' selected' : '') + '>'
        + escapeHTML(p.label) + '</option>'
      ).join('');
      els.providerSelect.value = providerId;
    }

    updateModelSelect(providerId, modelId);
  };

  const initModelSelect = (currentModel) => {
    initProviderSelects(currentModel);
  };

  const EFFORT_LABEL_KEYS = {
    minimal: 'effortMinimal',
    default: 'effortDefault',
    low: 'effortLow',
    medium: 'effortMedium',
    high: 'effortHigh',
    xhigh: 'effortXhigh',
    max: 'effortMax'
  };

  const initEffortSelect = (modelId, currentEffort, thinkingActive) => {
    if (!els.effortSelect) return;
    const levels = window.APP_CONFIG.getEffortLevels(modelId);
    if (!levels.length) {
      els.effortSelect.classList.add('hidden');
      els.effortSelect.disabled = false;
      return;
    }
    els.effortSelect.classList.remove('hidden');
    const t = window.I18n.t;
    const fallback = window.APP_CONFIG.modelUsesEffortLinkedThinking(modelId)
      ? 'high'
      : window.APP_CONFIG.getDefaultEffortForModel(modelId);
    const normalized = window.APP_CONFIG.normalizeEffortForModel(currentEffort, modelId);
    const selected = levels.includes(normalized) ? normalized : fallback;
    els.effortSelect.innerHTML = levels.map((lv) =>
      '<option value="' + lv + '"' + (lv === selected ? ' selected' : '') + '>'
      + escapeHTML(t(EFFORT_LABEL_KEYS[lv] || lv)) + '</option>'
    ).join('');
    const alwaysEnabled = window.APP_CONFIG.modelEffortDropdownAlwaysEnabled(modelId);
    const active = alwaysEnabled || thinkingActive !== false;
    els.effortSelect.disabled = !active;
    els.effortSelect.classList.toggle('is-disabled', !active);
  };

  const syncEffortSelect = (modelId, currentEffort, thinkingActive) => {
    initEffortSelect(modelId, currentEffort, thinkingActive);
  };

  const userFilesHTML = (files) => {
    if (!files || !files.length) return '';
    return '<div class="message-files">' + files.map((f) =>
      '<div class="message-file-chip">'
      + '<i class="fa-solid ' + window.Files.getIconClass(f.name) + '"></i>'
      + '<span class="message-file-name" title="' + escapeHTML(f.name) + '">' + escapeHTML(f.name) + '</span>'
      + '<span class="message-file-size">' + window.Files.formatSize(f.size || 0) + '</span>'
      + '</div>'
    ).join('') + '</div>';
  };

  const userImagesHTML = (images) => {
    if (!images || !images.length) return '';
    return '<div class="message-images">' + images.map((img, i) =>
      '<div class="message-image-wrap">'
      + '<img class="message-preview-image" src="' + img.dataUrl + '" alt="' + escapeHTML(img.name || t('image', { n: i + 1 })) + '" loading="lazy" title="' + escapeHTML(t('viewImage')) + '" />'
      + '</div>'
    ).join('') + '</div>';
  };

  const userContentHTML = (m) => {
    let text = '';
    if (m.content && m.content.trim()) {
      const escaped = escapeHTML(m.content).replace(/\n/g, '<br>');
      if (m.translateTo) {
        const label = window.APP_CONFIG.getTranslateLabel(m.translateTo);
        text = '<p class="message-translate-original">' + escaped + '</p>'
          + '<p class="message-translate-label">' + escapeHTML(label) + '</p>';
      } else if (m.imageGen) {
        const parts = [t('ratioPrefix') + window.APP_CONFIG.getImageGenRatio(m.imageGen.ratio).label];
        const styleId = m.imageGen.style;
        const templateId = m.imageGen.template;
        if (styleId !== 'auto') parts.push(t('stylePrefix') + window.I18n.imageGenLabel('style', styleId).toLowerCase());
        if (templateId !== 'none') parts.push(t('templatePrefix') + window.I18n.imageGenLabel('template', templateId).toLowerCase());
        text = '<p class="message-imagegen-prompt">' + escaped + '</p>'
          + '<p class="message-imagegen-label">' + escapeHTML(parts.join(' · ')) + '</p>';
      } else {
        text = '<p>' + escaped + '</p>';
      }
    }
    return text + userImagesHTML(m.images) + userFilesHTML(m.files);
  };

  const THEME_META_COLORS = {
    dark: '#0c0c0e',
    'vs-dark': '#1e1e1e',
    apple: '#f5f5f7',
    'apple-dark': '#1c1c1e',
    'hello-kitty': '#fff5f9',
    cyberpunk: '#0a0a12',
    nvidia: '#0d0d0d',
    'liquid-glass': '#0d0d0f'
  };
  const THEME_ICONS = {
    dark: '<i class="fa-solid fa-sun"></i>',
    'vs-dark': '<i class="fa-brands fa-microsoft"></i>',
    apple: '<i class="fa-brands fa-apple"></i>',
    'apple-dark': '<i class="fa-solid fa-moon"></i>',
    'hello-kitty': '<i class="fa-solid fa-heart"></i>',
    cyberpunk: '<i class="fa-solid fa-bolt"></i>',
    nvidia: '<i class="fa-solid fa-microchip"></i>',
    'liquid-glass': '<i class="fa-solid fa-droplet"></i>'
  };
  const HIGHLIGHT_THEMES = {
    dark: 'atom-one-dark',
    'vs-dark': 'vs2015',
    apple: 'atom-one-light',
    'apple-dark': 'atom-one-dark',
    'hello-kitty': 'atom-one-light',
    cyberpunk: 'atom-one-dark',
    nvidia: 'atom-one-dark',
    'liquid-glass': 'atom-one-dark'
  };

  const updateHighlightTheme = (theme) => {
    const hl = HIGHLIGHT_THEMES[theme] || 'atom-one-dark';
    const link = document.getElementById('hljs-theme');
    if (!link) return;
    const next = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${hl}.min.css`;
    if (link.href !== next) link.href = next;
  };

  const setTheme = (theme) => {
    const resolved = THEME_META_COLORS[theme] ? theme : 'dark';
    document.documentElement.setAttribute('data-theme', resolved);
    const mc = document.querySelector('meta[name="theme-color"]');
    if (mc) mc.setAttribute('content', THEME_META_COLORS[resolved]);
    if (els.themeIcon) els.themeIcon.innerHTML = THEME_ICONS[resolved] || THEME_ICONS.dark;
    updateHighlightTheme(resolved);
  };

  const renderConversationList = (conversations, currentId, searchQuery = '', snippetMap = null) => {
    const q = (searchQuery || '').trim();
    const emptyMsg = q ? t('noSearchResults') : t('noConversations');
    const html = conversations.length
      ? conversations.map(c => {
          const snippet = snippetMap ? (snippetMap.get(c.id) || '') : '';
          const snippetHTML = snippet
            ? '<span class="conversation-snippet">' + highlightSearchText(snippet, q) + '</span>'
            : '';
          return `
          <li class="conversation-item ${c.id === currentId ? 'active' : ''}" data-id="${c.id}">
            <span class="icon" aria-hidden="true"><i class="fa-solid fa-message"></i></span>
            <span class="conversation-item-body">
              <span class="title" title="${escapeHTML(c.title)}">${highlightSearchText(c.title, q)}</span>
              ${snippetHTML}
            </span>
            <span class="actions">
              <button type="button" class="btn btn-icon" data-action="rename" title="${escapeHTML(t('rename'))}"><i class="fa-solid fa-pen"></i></button>
              <button type="button" class="btn btn-icon" data-action="delete" title="${escapeHTML(t('delete'))}"><i class="fa-solid fa-trash"></i></button>
            </span>
          </li>`;
        }).join('')
      : `<li class="conversation-empty" style="padding:12px 16px;color:var(--text-dim);font-size:13px;">${emptyMsg}</li>`;
    els.conversationList.innerHTML = html;
  };

  let conversationSearchQuery = '';
  let conversationSearchOpen = false;
  let conversationSearchRenderId = 0;

  let exportSelectMode = false;
  const exportSelected = new Set();

  const updateExportSelectCount = () => {
    if (!els.exportSelectCount) return;
    const n = exportSelected.size;
    els.exportSelectCount.textContent = n
      ? t('exportSelectCount', { n })
      : t('exportSelectPrompt');
  };

  const syncExportSelectOnMessages = () => {
    els.messages.querySelectorAll('.message[data-idx]').forEach((article) => {
      const idx = parseInt(article.dataset.idx, 10);
      if (!exportSelectMode) {
        article.classList.remove('export-selectable', 'export-selected');
        article.removeAttribute('aria-selected');
        return;
      }
      article.classList.add('export-selectable');
      const selected = exportSelected.has(idx);
      article.classList.toggle('export-selected', selected);
      article.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
  };

  const syncExportSelectUI = () => {
    els.exportSelectBar?.classList.toggle('hidden', !exportSelectMode);
    els.toggleExportSelectBtn?.setAttribute('aria-pressed', exportSelectMode ? 'true' : 'false');
    els.app?.classList.toggle('export-select-mode', exportSelectMode);
    updateExportSelectCount();
    syncExportSelectOnMessages();
  };

  const isExportSelectMode = () => exportSelectMode;

  const setExportSelectMode = (enabled) => {
    exportSelectMode = !!enabled;
    if (!exportSelectMode) exportSelected.clear();
    syncExportSelectUI();
  };

  const toggleExportSelectMode = () => setExportSelectMode(!exportSelectMode);

  const getExportSelectedIndices = () => [...exportSelected].sort((a, b) => a - b);

  const toggleExportSelectIndex = (idx) => {
    if (!exportSelectMode || isNaN(idx)) return;
    if (exportSelected.has(idx)) exportSelected.delete(idx);
    else exportSelected.add(idx);
    updateExportSelectCount();
    syncExportSelectOnMessages();
  };

  const selectAllExportMessages = () => {
    if (!exportSelectMode) return;
    els.messages.querySelectorAll('.message[data-idx]').forEach((article) => {
      const idx = parseInt(article.dataset.idx, 10);
      if (!isNaN(idx)) exportSelected.add(idx);
    });
    updateExportSelectCount();
    syncExportSelectOnMessages();
  };

  const clearExportSelection = () => {
    exportSelected.clear();
    updateExportSelectCount();
    syncExportSelectOnMessages();
  };

  const getConversationSearchQuery = () => conversationSearchQuery;

  const isConversationSearchOpen = () => conversationSearchOpen;

  const syncSearchClearBtn = () => {
    if (!els.sidebarSearchClear) return;
    els.sidebarSearchClear.classList.toggle('hidden', !conversationSearchQuery);
  };

  const refreshConversationList = (currentId) => {
    const id = currentId !== undefined
      ? currentId
      : (window.Conversations.getCurrent()?.id || null);
    const q = conversationSearchQuery.trim();
    if (!q) {
      renderConversationList(window.Conversations.getAll(), id, '');
      return;
    }
    const results = window.Conversations.searchConversations(q);
    const snippetMap = new Map(results.map((r) => [r.convo.id, r.snippet]));
    renderConversationList(results.map((r) => r.convo), id, q, snippetMap);
  };

  const setConversationSearchQuery = (query) => {
    conversationSearchQuery = query || '';
    if (els.sidebarSearchInput && els.sidebarSearchInput.value !== conversationSearchQuery) {
      els.sidebarSearchInput.value = conversationSearchQuery;
    }
    syncSearchClearBtn();
    const renderId = ++conversationSearchRenderId;
    requestAnimationFrame(() => {
      if (renderId !== conversationSearchRenderId) return;
      refreshConversationList();
    });
  };

  const toggleConversationSearch = (open) => {
    const next = open !== undefined ? !!open : !conversationSearchOpen;
    conversationSearchOpen = next;
    if (els.sidebarSearchWrap) {
      els.sidebarSearchWrap.classList.toggle('hidden', !next);
    }
    if (els.toggleSidebarSearchBtn) {
      els.toggleSidebarSearchBtn.classList.toggle('is-active', next);
      els.toggleSidebarSearchBtn.setAttribute('aria-expanded', next ? 'true' : 'false');
    }
    if (next) {
      els.sidebarSearchInput?.focus();
    } else if (!conversationSearchQuery) {
      if (els.sidebarSearchInput) els.sidebarSearchInput.value = '';
      syncSearchClearBtn();
    }
  };

  const clearConversationSearch = () => {
    conversationSearchQuery = '';
    if (els.sidebarSearchInput) els.sidebarSearchInput.value = '';
    syncSearchClearBtn();
    refreshConversationList();
  };

  const renderEmpty = (animate = false) => {
    closeMarkdownPreview();
    els.messages.innerHTML = '<div class="messages-empty"><div class="brand-avatar brand-avatar-lg" aria-hidden="true">V</div><h2>' + escapeHTML(t('hello')) + '</h2><p class="messages-empty-sub">' + escapeHTML(t('emptySub')) + '</p></div>';
    updateMessageScrollRail();
    if (!animate) return;
    const empty = els.messages.querySelector('.messages-empty');
    if (empty) requestAnimationFrame(() => empty.classList.add('is-entering'));
  };

  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let clearingAll = false;

  const animateClearAll = () => {
    if (clearingAll) return Promise.resolve(false);
    const items = [...els.conversationList.querySelectorAll('.conversation-item')];
    const messages = [...els.messages.querySelectorAll('.message')];
    if (!items.length && !messages.length) return Promise.resolve(true);

    if (prefersReducedMotion()) return Promise.resolve(true);

    clearingAll = true;
    const STAGGER = 28;
    const MAX_STAGGER = 10;
    const BASE = 260;

    items.forEach((item, i) => {
      item.style.transitionDelay = Math.min(i, MAX_STAGGER) * STAGGER + 'ms';
      item.classList.add('is-removing');
    });

    messages.forEach((msg, i) => {
      msg.style.transitionDelay = Math.min(i, MAX_STAGGER) * 22 + 'ms';
      msg.classList.add('is-clearing');
    });

    const sidebarMs = items.length ? BASE + Math.min(items.length - 1, MAX_STAGGER) * STAGGER : 0;
    const chatMs = messages.length ? 240 + Math.min(messages.length - 1, MAX_STAGGER) * 22 : 0;
    const total = Math.max(sidebarMs, chatMs, 180) + 40;

    return new Promise((resolve) => {
      setTimeout(() => {
        clearingAll = false;
        resolve(true);
      }, total);
    });
  };

  const renderMessages = (convo, { animateEmpty = false } = {}) => {
    closeMarkdownPreview();
    if (!convo || !convo.messages.length) {
      renderEmpty(animateEmpty);
      return;
    }
    const shown = convo.messages.map((m, i) => ({ m, i })).filter(({ m }) => {
      if (m.role === 'assistant') {
        const hasText = !!window.Conversations.getAssistantContent(m);
        const hasImages = !!(m.generatedImages && m.generatedImages.length);
        if (!hasText && !hasImages) return false;
      }
      return true;
    });
    if (!shown.length) {
      renderEmpty(animateEmpty);
      return;
    }
    els.messages.innerHTML = shown.map(({ m, i }) => messageHTML(m, i)).join('');
    polishContent(els.messages);
    if (exportSelectMode) syncExportSelectOnMessages();
    scrollToBottom();
    updateMessageScrollRail();
  };

  const messageEdgeScrollBtnsHTML = () => (
    '<button type="button" class="msg-edge-scroll msg-edge-scroll-bottom" data-action="scroll-msg-bottom" title="' + escapeHTML(t('scrollMsgBottom')) + '" aria-label="' + escapeHTML(t('scrollMsgBottom')) + '">'
      + '<i class="fa-solid fa-chevron-down"></i></button>'
    + '<button type="button" class="msg-edge-scroll msg-edge-scroll-top" data-action="scroll-msg-top" title="' + escapeHTML(t('scrollMsgTop')) + '" aria-label="' + escapeHTML(t('scrollMsgTop')) + '">'
      + '<i class="fa-solid fa-chevron-up"></i></button>'
  );

  const assistantToolbarHTML = (m) => {
    const variants = m.variants && m.variants.length ? m.variants : (m.content ? [m.content] : []);
    const variantIndex = m.variantIndex ?? 0;
    const total = variants.length;
    const current = variantIndex + 1;

    let pager = '';
    if (total > 1) {
      pager = '<span class="variant-nav">'
        + '<button type="button" class="tb-btn variant-btn" data-action="variant-prev" title="' + escapeHTML(t('variantPrev')) + '"'
        + (variantIndex <= 0 ? ' disabled' : '')
        + '><i class="fa-solid fa-chevron-left"></i></button>'
        + '<span class="variant-count">' + current + ' / ' + total + '</span>'
        + '<button type="button" class="tb-btn variant-btn" data-action="variant-next" title="' + escapeHTML(t('variantNext')) + '"'
        + (variantIndex >= total - 1 ? ' disabled' : '')
        + '><i class="fa-solid fa-chevron-right"></i></button>'
        + '</span>';
    }

    const hasImages = !!(m.generatedImages && m.generatedImages.length);
    const imageExportOption = hasImages
      ? '<button type="button" class="msg-export-option" data-export-format="image" role="menuitem">'
        + '<i class="fa-solid fa-image" aria-hidden="true"></i><span>' + escapeHTML(t('exportFormatImage')) + '</span></button>'
      : '';

    const exportMenu = '<div class="msg-export-wrap">'
      + '<button type="button" class="tb-btn" data-action="export-toggle" title="' + escapeHTML(t('exportMessage')) + '" aria-haspopup="menu" aria-expanded="false">'
      + '<i class="fa-solid fa-download"></i></button>'
      + '<div class="msg-export-menu hidden" role="menu" aria-label="' + escapeHTML(t('exportMessage')) + '">'
      + '<button type="button" class="msg-export-option" data-export-format="md" role="menuitem">'
      + '<i class="fa-brands fa-markdown" aria-hidden="true"></i><span>' + escapeHTML(t('exportFormatMd')) + '</span></button>'
      + '<button type="button" class="msg-export-option" data-export-format="txt" role="menuitem">'
      + '<i class="fa-solid fa-file-lines" aria-hidden="true"></i><span>' + escapeHTML(t('exportFormatTxt')) + '</span></button>'
      + '<button type="button" class="msg-export-option" data-export-format="pdf" role="menuitem">'
      + '<i class="fa-solid fa-file-pdf" aria-hidden="true"></i><span>' + escapeHTML(t('exportFormatPdf')) + '</span></button>'
      + '<button type="button" class="msg-export-option" data-export-format="docx" role="menuitem">'
      + '<i class="fa-solid fa-file-word" aria-hidden="true"></i><span>' + escapeHTML(t('exportFormatDocs')) + '</span></button>'
      + imageExportOption
      + '</div></div>';

    return '<button type="button" class="tb-btn" data-action="copy" title="' + escapeHTML(t('copy')) + '"><i class="fa-solid fa-copy"></i></button>'
      + '<button type="button" class="tb-btn" data-action="retry" title="' + escapeHTML(t('retry')) + '"><i class="fa-solid fa-rotate-right"></i></button>'
      + exportMenu
      + pager;
  };

  const messageHTML = (m, idx) => {
    const isUser = m.role === 'user';
    const avatar = isUser
      ? '<div class="avatar user-av"><i class="fa-solid fa-user"></i></div>'
      : '<div class="avatar assistant-av">V</div>';
    const body = isUser
      ? '<div class="content">' + userContentHTML(m) + '</div>'
      : '<div class="content">' + assistantContentHTML(m) + '</div>';
    const idxAttr = idx !== undefined ? ' data-idx="' + idx + '"' : '';
    const editBtn = isUser
      ? '<button type="button" class="tb-btn" data-action="edit" title="' + escapeHTML(t('edit')) + '"><i class="fa-solid fa-pen-to-square"></i></button>'
      : '';
    const delBtn = isUser
      ? '<button type="button" class="tb-btn" data-action="delete-msg" title="' + escapeHTML(t('delete')) + '"><i class="fa-solid fa-trash"></i></button>'
      : '';
    const toolbar = isUser
      ? editBtn
        + '<button type="button" class="tb-btn" data-action="copy" title="' + escapeHTML(t('copy')) + '"><i class="fa-solid fa-copy"></i></button>'
        + delBtn
      : assistantToolbarHTML(m);
    return '<article class="message ' + m.role + '" data-role="' + m.role + '"' + idxAttr + '>'
      + avatar
      + '<div class="body">'
      + messageEdgeScrollBtnsHTML()
      + body
      + '<div class="toolbar">' + toolbar + '</div>'
      + '</div></article>';
  };

  const appendMessage = (m, idx) => {
    const empty = els.messages.querySelector('.messages-empty');
    if (empty) empty.remove();
    const div = document.createElement('div');
    div.innerHTML = messageHTML(m, idx);
    const article = div.firstElementChild;
    els.messages.appendChild(article);
    scrollToBottom();
    updateMessageScrollRail();
    return article;
  };

  const appendStreamingMessage = (idx) => {
    resetStreamingCodeScroll();
    const empty = els.messages.querySelector('.messages-empty');
    if (empty) empty.remove();
    const article = appendMessage({ role: 'assistant', content: '', variants: [''], variantIndex: 0, ts: Date.now() }, idx);
    article.classList.add('streaming');
    const content = article.querySelector('.content');
    return { article, content };
  };

  const setAssistantToolbar = (article, m) => {
    const toolbar = article?.querySelector('.toolbar');
    if (toolbar && m?.role === 'assistant') toolbar.innerHTML = assistantToolbarHTML(m);
  };

  const updateAssistantMessage = (idx, m) => {
    const article = els.messages.querySelector('[data-idx="' + idx + '"]');
    if (!article) return;
    const content = article.querySelector('.content');
    if (content) {
      content.innerHTML = assistantContentHTML(m);
      polishContent(content, { renderMermaid: true });
    }
    setAssistantToolbar(article, m);
  };

  const beginRetryStreaming = (idx) => {
    resetStreamingCodeScroll();
    els.messages.querySelectorAll('.message').forEach((article) => {
      const i = parseInt(article.dataset.idx, 10);
      if (!isNaN(i) && i > idx) article.remove();
    });

    let article = els.messages.querySelector('[data-idx="' + idx + '"]');
    if (!article) return null;

    article.classList.add('streaming');
    const content = article.querySelector('.content');
    if (content) content.innerHTML = '';
    updateMessageScrollRail();
    return { article, content };
  };

  let streamThrottle = null;
  let _latestCE = null;
  let _latestText = '';
  let _latestImages = null;
  let _streamingCodeScrollTarget = 0;
  let _stickToBottom = true;
  let _ignoreScrollEvent = false;
  let _messagesScrollBound = false;

  let _latestReasoning = '';
  let _latestGrounding = null;
  let _reasoningOpen = false;

  const renderStreamingAssistantHTML = (text, images, reasoning, { reasoningOpen = false, groundingMetadata = null } = {}) => {
    return reasoningHTML(reasoning, { open: reasoningOpen })
      + groundingHTML(groundingMetadata)
      + window.Markdown.render(text || '') + generatedImagesHTML(images);
  };

  const updateStreamingAssistantContent = (contentEl, text, images, reasoning, { reasoningOpen = false, groundingMetadata = null } = {}) => {
    _latestCE = contentEl;
    _latestText = text;
    _latestImages = images;
    _latestReasoning = reasoning || '';
    _latestGrounding = groundingMetadata;
    _reasoningOpen = reasoningOpen;
    if (streamThrottle) return;
    streamThrottle = requestAnimationFrame(() => {
      if (_latestCE) {
        const messagesEl = els.messages;
        const preserveScroll = !_stickToBottom && messagesEl;
        const prevTop = preserveScroll ? messagesEl.scrollTop : 0;

        _latestCE.innerHTML = renderStreamingAssistantHTML(
          _latestText, _latestImages, _latestReasoning, {
            reasoningOpen: _reasoningOpen,
            groundingMetadata: _latestGrounding
          }
        );
        polishContent(_latestCE, { streaming: true });

        if (preserveScroll) {
          // Keep reading position stable while tokens append below.
          messagesEl.scrollTop = prevTop;
        } else {
          scrollStreamingCodeToEnd(_latestCE, _latestText);
          scrollToBottomIfNear();
        }
      }
      streamThrottle = null;
    });
  };

  const updateStreamingContent = (contentEl, text) => {
    updateStreamingAssistantContent(
      contentEl, text, _latestImages, _latestReasoning, {
        reasoningOpen: _reasoningOpen,
        groundingMetadata: _latestGrounding
      }
    );
  };

  const finalizeStreaming = (article, text, message) => {
    resetStreamingCodeScroll();
    _latestImages = null;
    _latestText = '';
    _latestReasoning = '';
    _latestGrounding = null;
    _reasoningOpen = false;
    _latestCE = null;
    article.classList.remove('streaming');
    const content = article.querySelector('.content');
    if (content) {
      content.innerHTML = renderStreamingAssistantHTML(
        text, message?.generatedImages, message?.reasoningContent, {
          reasoningOpen: false,
          groundingMetadata: message?.groundingMetadata
        }
      );
      polishContent(content, { renderMermaid: true });
    }
    if (message) setAssistantToolbar(article, message);
    scrollToBottomIfNear();
    updateMessageScrollRail();
  };

  const rerenderMermaid = () => {
    window.Markdown.updateMermaidTheme();
    window.Markdown.resetMermaidBlocks(els.messages);
    window.Markdown.renderMermaid(els.messages, { skipIfStreaming: false });
    if (els.markdownPreviewPanel?.classList.contains('is-open')
      && els.markdownPreviewContent
      && !els.markdownPreviewContent.classList.contains('is-html-preview')) {
      window.Markdown.resetMermaidBlocks(els.markdownPreviewContent);
      window.Markdown.renderMermaid(els.markdownPreviewContent, { skipIfStreaming: false });
    }
  };

  const enterEditMode = (article) => {
    if (article.classList.contains('editing')) return;
    const contentEl = article.querySelector('.content');
    const toolbarEl = article.querySelector('.toolbar');
    article._editOriginal = {
      content: contentEl.innerHTML,
      toolbar: toolbarEl.innerHTML
    };
    const p = contentEl.querySelector('p');
    const text = p ? p.innerText : contentEl.innerText;
    contentEl.innerHTML = '<textarea class="edit-textarea" rows="1">' + escapeHTML(text) + '</textarea>';
    toolbarEl.innerHTML =
      '<button type="button" class="tb-btn" data-action="save-edit" title="' + escapeHTML(t('save')) + '"><i class="fa-solid fa-check"></i></button>' +
      '<button type="button" class="tb-btn" data-action="cancel-edit" title="' + escapeHTML(t('cancel')) + '"><i class="fa-solid fa-xmark"></i></button>';
    article.classList.add('editing');
    const textarea = contentEl.querySelector('.edit-textarea');
    autoResize(textarea);
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  };

  const exitEditMode = (article) => {
    if (!article.classList.contains('editing')) return;
    const saved = article._editOriginal;
    if (saved) {
      article.querySelector('.content').innerHTML = saved.content;
      article.querySelector('.toolbar').innerHTML = saved.toolbar;
    }
    article.classList.remove('editing');
    delete article._editOriginal;
  };

  const rehighlight = (root) => {
    if (!window.hljs) return;
    root.querySelectorAll('pre code').forEach((block) => {
      try { window.hljs.highlightElement(block); } catch {}
    });
  };

  const polishContent = (root, { renderMermaid = true, streaming = false } = {}) => {
    window.Markdown.enhanceCodeBlocks(root);
    window.Markdown.enhanceTables(root);
    window.Markdown.enhanceLinks(root);
    if (!streaming) rehighlight(root);
    if (!streaming) window.Markdown.typesetMath(root);
    if (renderMermaid) window.Markdown.renderMermaid(root);
  };

  const waitForLayout = () =>
    new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const preparePdfExportRoot = async (convo) => {
    const root = document.createElement('div');
    root.className = 'pdf-export-root';
    root.setAttribute('data-theme', 'light');

    const sheet = document.createElement('div');
    sheet.className = 'pdf-export-sheet';

    const titleEl = document.createElement('h1');
    titleEl.className = 'pdf-export-title';
    titleEl.textContent = convo.title || t('conversation');
    sheet.appendChild(titleEl);

    const messagesWrap = document.createElement('div');
    messagesWrap.className = 'pdf-export-messages messages';

    for (const m of convo.messages) {
      const isUser = m.role === 'user';
      const article = document.createElement('article');
      article.className = 'message ' + m.role + ' pdf-export-message';

      const avatar = document.createElement('div');
      avatar.className = 'avatar ' + (isUser ? 'user-av' : 'assistant-av');
      avatar.setAttribute('aria-hidden', 'true');
      avatar.innerHTML = isUser ? '<i class="fa-solid fa-user"></i>' : 'V';

      const body = document.createElement('div');
      body.className = 'body';

      const content = document.createElement('div');
      content.className = 'content';
      content.innerHTML = isUser ? userContentHTML(m) : assistantContentHTML(m);

      body.appendChild(content);
      article.appendChild(avatar);
      article.appendChild(body);
      messagesWrap.appendChild(article);
    }

    sheet.appendChild(messagesWrap);
    root.appendChild(sheet);
    document.body.appendChild(root);

    polishContent(root, { renderMermaid: true });
    if (window.mermaid) {
      try {
        window.mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'Inter, system-ui, sans-serif',
          logLevel: 'error',
          suppressErrorRendering: true
        });
      } catch {}
    }
    await window.Markdown.renderMermaid(root, { skipIfStreaming: false });
    await document.fonts.ready;
    await waitForLayout();

    return root;
  };

  const hasOpenCodeFence = (text) => {
    const count = (text.match(/```/g) || []).length;
    return count % 2 === 1;
  };

  const CODE_SCROLL_LERP = 0.18;
  const CODE_SCROLL_SNAP_GAP = 96;
  const codeScrollStates = new WeakMap();
  const codeScrollElements = new Set();

  const stopCodeScrollAnimations = () => {
    codeScrollElements.forEach((el) => {
      const state = codeScrollStates.get(el);
      if (state?.rafId) cancelAnimationFrame(state.rafId);
      if (state) state.rafId = null;
    });
    codeScrollElements.clear();
  };

  const resetStreamingCodeScroll = () => {
    _streamingCodeScrollTarget = 0;
    stopCodeScrollAnimations();
  };

  const animateCodeScroll = (el, targetTop) => {
    let state = codeScrollStates.get(el);
    if (!state) {
      state = { rafId: null, target: 0 };
      codeScrollStates.set(el, state);
    }
    state.target = Math.max(0, targetTop);
    codeScrollElements.add(el);

    if (state.rafId) return;

    const tick = () => {
      const st = codeScrollStates.get(el);
      if (!st) return;

      const dest = st.target;
      const cur = el.scrollTop;
      const diff = dest - cur;

      if (Math.abs(diff) < 0.5) {
        el.scrollTop = dest;
        st.rafId = null;
        codeScrollElements.delete(el);
        return;
      }

      el.scrollTop = cur + diff * CODE_SCROLL_LERP;
      st.rafId = requestAnimationFrame(tick);
    };

    state.rafId = requestAnimationFrame(tick);
  };

  const scrollElementToEnd = (el, { streaming = false } = {}) => {
    if (!el || el.scrollHeight <= el.clientHeight) {
      if (streaming) _streamingCodeScrollTarget = 0;
      return;
    }

    const target = el.scrollHeight - el.clientHeight;

    if (streaming) {
      stopCodeScrollAnimations();

      if (_streamingCodeScrollTarget > 0 && target >= _streamingCodeScrollTarget - 4) {
        el.scrollTop = Math.min(_streamingCodeScrollTarget, target);
        if (target - el.scrollTop > 0.5) animateCodeScroll(el, target);
        _streamingCodeScrollTarget = target;
        return;
      }

      if (target > CODE_SCROLL_SNAP_GAP) {
        el.scrollTop = target;
        _streamingCodeScrollTarget = target;
        return;
      }

      animateCodeScroll(el, target);
      _streamingCodeScrollTarget = target;
      return;
    }

    el.scrollTop = target;
  };

  const scrollStreamingCodeToEnd = (root, text) => {
    if (!root || !hasOpenCodeFence(text)) return;

    const blocks = root.querySelectorAll('.code-block');
    const lastBlock = blocks[blocks.length - 1];
    if (lastBlock) {
      scrollElementToEnd(lastBlock, { streaming: true });
      return;
    }

    const pres = root.querySelectorAll('pre:not(.code-block-body pre)');
    const lastPre = pres[pres.length - 1];
    if (!lastPre) return;

    if (lastPre.classList.contains('mermaid-pending')) {
      scrollElementToEnd(lastPre, { streaming: true });
      scrollElementToEnd(lastPre.closest('.mermaid-view'), { streaming: true });
      return;
    }

    if (lastPre.closest('.mermaid-block')) {
      const source = lastPre.closest('.mermaid-source');
      scrollElementToEnd(source || lastPre, { streaming: true });
      return;
    }

    scrollElementToEnd(lastPre, { streaming: true });
  };

  const SCROLL_UNPIN_THRESHOLD = 48;
  const SCROLL_REPIN_THRESHOLD = 24;

  let _messageScrollRailBound = false;
  let _messageScrollRailResizeObserver = null;
  let _messageScrollRailHoverIdx = -1;
  let _messageScrollRailRaf = null;

  const getUserMessageArticles = () => [...els.messages.querySelectorAll('.message.user')];

  const getUserMessagePreview = (article) => {
    if (!article) return '';
    const content = article.querySelector('.content');
    if (!content) return '';
    const original = content.querySelector('.message-translate-original');
    if (original) {
      return (original.textContent || '').replace(/\s+/g, ' ').trim() || t('scrollRailNoText');
    }
    const prompt = content.querySelector('.message-imagegen-prompt');
    if (prompt) {
      return (prompt.textContent || '').replace(/\s+/g, ' ').trim() || t('scrollRailNoText');
    }
    const firstP = content.querySelector(':scope > p');
    const text = (firstP?.textContent || content.textContent || '').replace(/\s+/g, ' ').trim();
    return text || t('scrollRailNoText');
  };

  const getMessageScrollRatio = (article, messagesEl) => {
    if (!article || !messagesEl) return 0;
    const maxScroll = Math.max(messagesEl.scrollHeight - messagesEl.clientHeight, 1);
    return Math.min(1, Math.max(0, article.offsetTop / maxScroll));
  };

  const getTickWidth = (preview, maxLen) => {
    const len = preview.length;
    if (maxLen <= 0) return 10;
    const ratio = len / maxLen;
    if (ratio < 0.35) return 8;
    if (ratio < 0.7) return 12;
    return 16;
  };

  const syncMessageScrollRailI18n = () => {
    if (!els.messageScrollRail) return;
    els.messageScrollRail.setAttribute('aria-label', t('scrollRailLabel'));
    if (els.messageScrollRailPrev) {
      els.messageScrollRailPrev.title = t('scrollRailPrev');
      els.messageScrollRailPrev.setAttribute('aria-label', t('scrollRailPrev'));
    }
    if (els.messageScrollRailNext) {
      els.messageScrollRailNext.title = t('scrollRailNext');
      els.messageScrollRailNext.setAttribute('aria-label', t('scrollRailNext'));
    }
    const userLabel = els.messageScrollRailTooltip?.querySelector('.message-scroll-rail-tooltip-user');
    if (userLabel) userLabel.textContent = t('scrollRailYou');
  };

  const hideMessageScrollRailTooltip = () => {
    _messageScrollRailHoverIdx = -1;
    els.messageScrollRailTooltip?.classList.add('hidden');
    els.messageScrollRailTooltip?.setAttribute('aria-hidden', 'true');
  };

  const showMessageScrollRailTooltip = (tickEl, preview) => {
    const tooltip = els.messageScrollRailTooltip;
    const rail = els.messageScrollRail;
    if (!tooltip || !rail || !tickEl) return;

    const idx = parseInt(tickEl.dataset.idx, 10);
    const users = getUserMessageArticles();
    const text = !isNaN(idx) && users[idx] ? getUserMessagePreview(users[idx]) : (preview || '');

    const textEl = tooltip.querySelector('.message-scroll-rail-tooltip-text');
    if (textEl) textEl.textContent = text;

    const tickRect = tickEl.getBoundingClientRect();
    const railRect = rail.getBoundingClientRect();
    const gap = 12;
    const margin = 8;

    tooltip.classList.remove('hidden');
    tooltip.setAttribute('aria-hidden', 'false');
    tooltip.style.top = (tickRect.top + tickRect.height / 2) + 'px';
    tooltip.style.transform = 'translateY(-50%)';

    tooltip.style.left = 'auto';
    tooltip.style.right = (window.innerWidth - railRect.left + gap) + 'px';

    const tipRect = tooltip.getBoundingClientRect();
    if (tipRect.left < margin) {
      tooltip.style.right = 'auto';
      tooltip.style.left = margin + 'px';
      tooltip.style.maxWidth = (railRect.left - gap - margin) + 'px';
    } else {
      tooltip.style.maxWidth = '';
    }
  };

  const updateMessageScrollRailNav = () => {
    const users = getUserMessageArticles();
    const activeIdx = users.findIndex((el) => el.classList.contains('is-rail-active'));
    if (els.messageScrollRailPrev) els.messageScrollRailPrev.disabled = activeIdx <= 0;
    if (els.messageScrollRailNext) els.messageScrollRailNext.disabled = activeIdx < 0 || activeIdx >= users.length - 1;
  };

  const updateMessageScrollRailIndicator = () => {
    const messagesEl = els.messages;
    const track = els.messageScrollRail?.querySelector('.message-scroll-rail-track');
    const indicator = els.messageScrollRailIndicator;
    if (!messagesEl || !track || !indicator) return;

    const trackHeight = track.clientHeight;
    if (!trackHeight) return;

    const maxScroll = Math.max(messagesEl.scrollHeight - messagesEl.clientHeight, 0);
    const ratio = maxScroll > 0 ? messagesEl.scrollTop / maxScroll : 0;
    indicator.style.top = (ratio * trackHeight) + 'px';
    indicator.classList.toggle('hidden', maxScroll <= 0);

    const users = getUserMessageArticles();
    if (!users.length) {
      updateMessageScrollRailNav();
      return;
    }

    const anchor = messagesEl.scrollTop + 24;
    let active = users[0];
    for (const article of users) {
      if (article.offsetTop <= anchor) active = article;
      else break;
    }

    users.forEach((article) => article.classList.toggle('is-rail-active', article === active));
    els.messageScrollRailTicks?.querySelectorAll('.message-scroll-rail-tick').forEach((tick) => {
      const idx = parseInt(tick.dataset.idx, 10);
      const article = users[idx];
      tick.classList.toggle('is-active', article === active);
    });

    if (_messageScrollRailHoverIdx >= 0) {
      const hovered = els.messageScrollRailTicks?.querySelector('.message-scroll-rail-tick[data-idx="' + _messageScrollRailHoverIdx + '"]');
      if (hovered) showMessageScrollRailTooltip(hovered);
    }

    updateMessageScrollRailNav();
  };

  const scheduleMessageScrollRailIndicator = () => {
    if (_messageScrollRailRaf) return;
    _messageScrollRailRaf = requestAnimationFrame(() => {
      _messageScrollRailRaf = null;
      updateMessageScrollRailIndicator();
    });
  };

  const scrollToUserMessage = (article) => {
    const messagesEl = els.messages;
    if (!messagesEl || !article) return;
    _stickToBottom = false;
    _ignoreScrollEvent = true;
    const targetTop = Math.max(0, article.offsetTop - 12);
    messagesEl.scrollTo({ top: targetTop, behavior: 'smooth' });
    window.setTimeout(() => {
      _ignoreScrollEvent = false;
      updateMessageScrollRailIndicator();
    }, 450);
  };

  const scrollMessageEdge = (article, edge) => {
    const messagesEl = els.messages;
    if (!messagesEl || !article) return;
    _stickToBottom = false;
    _ignoreScrollEvent = true;
    const pad = 12;
    let targetTop;
    if (edge === 'bottom') {
      targetTop = Math.max(0, article.offsetTop + article.offsetHeight - messagesEl.clientHeight + pad);
    } else {
      targetTop = Math.max(0, article.offsetTop - pad);
    }
    const maxTop = Math.max(0, messagesEl.scrollHeight - messagesEl.clientHeight);
    messagesEl.scrollTo({ top: Math.min(targetTop, maxTop), behavior: 'smooth' });
    window.setTimeout(() => {
      _ignoreScrollEvent = false;
      updateMessageScrollRailIndicator();
    }, 450);
  };

  const scrollMessageToTop = (article) => scrollMessageEdge(article, 'top');
  const scrollMessageToBottom = (article) => scrollMessageEdge(article, 'bottom');

  const scrollToAdjacentUserMessage = (direction) => {
    const users = getUserMessageArticles();
    if (!users.length) return;
    let idx = users.findIndex((el) => el.classList.contains('is-rail-active'));
    if (idx < 0) idx = 0;
    const next = Math.min(users.length - 1, Math.max(0, idx + direction));
    scrollToUserMessage(users[next]);
  };

  const updateMessageScrollRail = () => {
    const rail = els.messageScrollRail;
    const ticksEl = els.messageScrollRailTicks;
    const messagesEl = els.messages;
    if (!rail || !ticksEl || !messagesEl) return;

    syncMessageScrollRailI18n();
    hideMessageScrollRailTooltip();

    const users = getUserMessageArticles();
    const scrollable = messagesEl.scrollHeight > messagesEl.clientHeight + 4;
    const show = users.length > 0 && (users.length > 1 || scrollable);
    rail.classList.toggle('hidden', !show);
    if (!show) {
      ticksEl.innerHTML = '';
      return;
    }

    const previews = users.map(getUserMessagePreview);
    const maxLen = Math.max(...previews.map((p) => p.length), 1);
    const track = rail.querySelector('.message-scroll-rail-track');
    const trackHeight = track?.clientHeight || 1;

    ticksEl.innerHTML = users.map((article, idx) => {
      const preview = previews[idx];
      const ratio = getMessageScrollRatio(article, messagesEl);
      const top = ratio * trackHeight;
      const width = getTickWidth(preview, maxLen);
      return '<button type="button" class="message-scroll-rail-tick" data-idx="' + idx + '"'
        + ' data-preview="' + escapeHTML(preview) + '"'
        + ' style="top:' + top + 'px;--tick-width:' + width + 'px"'
        + ' aria-label="' + escapeHTML(truncate(preview, 80)) + '"></button>';
    }).join('');

    scheduleMessageScrollRailIndicator();
  };

  const bindMessageScrollRail = () => {
    if (_messageScrollRailBound) return;
    _messageScrollRailBound = true;

    const messagesEl = els.messages;
    if (!messagesEl || !els.messageScrollRailTicks) return;

    if (els.messageScrollRailTooltip && els.messageScrollRailTooltip.parentElement !== document.body) {
      document.body.appendChild(els.messageScrollRailTooltip);
    }

    if (typeof ResizeObserver !== 'undefined') {
      let resizeTimer = null;
      _messageScrollRailResizeObserver = new ResizeObserver(() => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          resizeTimer = null;
          const hoverIdx = _messageScrollRailHoverIdx;
          updateMessageScrollRail();
          if (hoverIdx >= 0) {
            _messageScrollRailHoverIdx = hoverIdx;
            const hovered = els.messageScrollRailTicks?.querySelector('.message-scroll-rail-tick[data-idx="' + hoverIdx + '"]');
            if (hovered) showMessageScrollRailTooltip(hovered);
          }
        }, 80);
      });
      _messageScrollRailResizeObserver.observe(messagesEl);
    }

    els.messageScrollRailTicks.addEventListener('mouseover', (e) => {
      const tick = e.target.closest('.message-scroll-rail-tick');
      if (!tick) return;
      _messageScrollRailHoverIdx = parseInt(tick.dataset.idx, 10);
      showMessageScrollRailTooltip(tick);
    });

    els.messageScrollRailTicks.addEventListener('mouseout', (e) => {
      const tick = e.target.closest('.message-scroll-rail-tick');
      if (!tick) return;
      const related = e.relatedTarget;
      if (related && tick.contains(related)) return;
      hideMessageScrollRailTooltip();
    });

    els.messageScrollRailTicks.addEventListener('click', (e) => {
      const tick = e.target.closest('.message-scroll-rail-tick');
      if (!tick) return;
      const idx = parseInt(tick.dataset.idx, 10);
      const users = getUserMessageArticles();
      if (!isNaN(idx) && users[idx]) scrollToUserMessage(users[idx]);
    });

    els.messageScrollRailPrev?.addEventListener('click', () => scrollToAdjacentUserMessage(-1));
    els.messageScrollRailNext?.addEventListener('click', () => scrollToAdjacentUserMessage(1));

    els.messageScrollRail?.addEventListener('mouseleave', (e) => {
      if (e.relatedTarget && els.messageScrollRail.contains(e.relatedTarget)) return;
      hideMessageScrollRailTooltip();
    });
  };

  const distanceFromBottom = () => {
    const el = els.messages;
    if (!el) return 0;
    return el.scrollHeight - el.scrollTop - el.clientHeight;
  };

  const unpinFromBottom = () => {
    _stickToBottom = false;
  };

  const bindMessagesScroll = () => {
    if (_messagesScrollBound || !els.messages) return;
    _messagesScrollBound = true;
    const el = els.messages;

    el.addEventListener('scroll', () => {
      if (_ignoreScrollEvent) return;
      const dist = distanceFromBottom();
      if (_stickToBottom) {
        if (dist > SCROLL_UNPIN_THRESHOLD) unpinFromBottom();
      } else if (dist < SCROLL_REPIN_THRESHOLD) {
        _stickToBottom = true;
      }
      scheduleMessageScrollRailIndicator();
    }, { passive: true });

    // Unpin immediately on intentional upward scroll so streaming cannot yank the view back down.
    el.addEventListener('wheel', (e) => {
      if (e.deltaY < 0) unpinFromBottom();
    }, { passive: true });

    let touchY = null;
    el.addEventListener('touchstart', (e) => {
      touchY = e.touches[0]?.clientY ?? null;
    }, { passive: true });
    el.addEventListener('touchmove', (e) => {
      const y = e.touches[0]?.clientY;
      if (touchY != null && y != null && y - touchY > 6) unpinFromBottom();
      touchY = y ?? touchY;
    }, { passive: true });
  };

  const scrollToBottom = ({ stick = true } = {}) => {
    const el = els.messages;
    if (!el) return;
    if (stick) _stickToBottom = true;
    else if (!_stickToBottom) return;
    _ignoreScrollEvent = true;
    requestAnimationFrame(() => {
      // User may have scrolled away while this frame was pending.
      if (!_stickToBottom) {
        _ignoreScrollEvent = false;
        return;
      }
      el.scrollTop = el.scrollHeight;
      requestAnimationFrame(() => {
        _ignoreScrollEvent = false;
      });
    });
  };

  const scrollToBottomIfNear = () => {
    if (!_stickToBottom) return;
    // Follow the bottom without re-forcing stick (avoids fighting user scroll-up).
    scrollToBottom({ stick: false });
  };

  const showError = (err) => {
    removeError();
    const div = document.createElement('div');
    div.className = 'error-banner';
    div.id = 'errorBanner';
    const msg = err?.message || String(err || '');
    const key = /cors|proxy|load failed|failed to fetch|network/i.test(msg)
      && !/api key|authorization|forbidden|401|403/i.test(msg)
      ? 'toastErrorNetwork'
      : /provider returned error|rate.limit|rate-limited|429|temporarily|upstream|credits|can only afford|max_tokens|degraded function cannot be invoked/i.test(msg)
        ? 'toastErrorNetwork'
        : 'toastErrorApiKey';
    div.textContent = t(key, { err: msg });
    els.composer.insertAdjacentElement('beforebegin', div);
  };

  const removeError = () => {
    const e = document.getElementById('errorBanner');
    if (e) e.remove();
  };

  const setStreaming = (on) => {
    if (on) _stickToBottom = true;
    els.sendBtn.classList.toggle('hidden', on);
    els.stopBtn.classList.toggle('hidden', !on);
    els.composerInput.disabled = on;
    els.attachBtn.disabled = on;
    if (els.webSearchBtn) els.webSearchBtn.disabled = on;
    if (els.imageGenBtn) els.imageGenBtn.disabled = on;
    if (els.translateBtn) els.translateBtn.disabled = on;
    if (els.translateChipClose) els.translateChipClose.disabled = on;
    if (els.translateLangBtn) els.translateLangBtn.disabled = on;
    if (els.imageGenChipClose) els.imageGenChipClose.disabled = on;
    if (els.imageGenRefBtn) els.imageGenRefBtn.disabled = on;
    if (els.imageGenRatioBtn) els.imageGenRatioBtn.disabled = on;
    if (els.imageGenStyleBtn) els.imageGenStyleBtn.disabled = on;
    if (els.imageGenTemplateBtn) els.imageGenTemplateBtn.disabled = on;
    if (els.imageGenRatioChipClear) els.imageGenRatioChipClear.disabled = on;
    if (els.imageGenStyleChipClear) els.imageGenStyleChipClear.disabled = on;
    if (els.imageGenTemplateChipClear) els.imageGenTemplateChipClear.disabled = on;
    els.messages.classList.toggle('is-streaming', on);
  };

  const renderComposerAttachments = (images, files) => {
    const imgList = images || [];
    const fileList = files || [];
    if (!imgList.length && !fileList.length) {
      els.composerAttachments.innerHTML = '';
      els.composerAttachments.classList.add('hidden');
      return;
    }
    els.composerAttachments.classList.remove('hidden');
    const imageHtml = imgList.map((img, i) =>
      '<div class="composer-attachment composer-attachment-image" data-type="image" data-idx="' + i + '">'
      + '<img src="' + img.dataUrl + '" alt="' + escapeHTML(img.name || 'Ảnh ' + (i + 1)) + '" />'
      + '<button type="button" class="composer-attachment-remove" data-remove-type="image" data-remove-idx="' + i + '" title="' + escapeHTML(t('removeImage')) + '" aria-label="' + escapeHTML(t('removeImage')) + '">'
      + '<i class="fa-solid fa-xmark"></i></button>'
      + '</div>'
    ).join('');
    const fileHtml = fileList.map((f, i) =>
      '<div class="composer-attachment composer-attachment-file" data-type="file" data-idx="' + i + '">'
      + '<i class="fa-solid ' + window.Files.getIconClass(f.name) + '"></i>'
      + '<span class="composer-file-name" title="' + escapeHTML(f.name) + '">' + escapeHTML(f.name) + '</span>'
      + '<span class="composer-file-size">' + window.Files.formatSize(f.size || 0) + '</span>'
      + '<button type="button" class="composer-attachment-remove" data-remove-type="file" data-remove-idx="' + i + '" title="' + escapeHTML(t('removeFile')) + '" aria-label="' + escapeHTML(t('removeFile')) + '">'
      + '<i class="fa-solid fa-xmark"></i></button>'
      + '</div>'
    ).join('');
    els.composerAttachments.innerHTML = imageHtml + fileHtml;
  };

  const DROP_OVERLAY_KINDS = {
    image: {
      icon: 'fa-image',
      title: 'Thả ảnh vào đây',
      hint: 'JPEG, PNG, GIF, WebP'
    },
    file: {
      icon: 'fa-file-lines',
      title: 'Thả tài liệu vào đây',
      hint: 'PDF, Word, Excel, TXT, JSON...'
    },
    mixed: {
      icon: 'fa-cloud-arrow-up',
      title: 'Thả để đính kèm',
      hint: 'Ảnh hoặc tài liệu (PDF, Word, Excel...)'
    }
  };

  const setDragOverlay = (visible, kind = 'mixed') => {
    if (!els.appDropOverlay) return;
    const meta = DROP_OVERLAY_KINDS[kind] || DROP_OVERLAY_KINDS.mixed;
    els.appDropOverlay.classList.toggle('hidden', !visible);
    els.appDropOverlay.setAttribute('aria-hidden', visible ? 'false' : 'true');
    if (visible) {
      els.appDropOverlay.dataset.kind = kind;
      const icon = els.appDropOverlay.querySelector('.app-drop-overlay-icon i');
      const title = els.appDropOverlay.querySelector('.app-drop-overlay-title');
      const hint = els.appDropOverlay.querySelector('.app-drop-overlay-hint');
      if (icon) icon.className = 'fa-solid ' + meta.icon;
      if (title) title.textContent = meta.title;
      if (hint) hint.textContent = meta.hint;
    } else {
      delete els.appDropOverlay.dataset.kind;
    }
    if (els.composerDropZone) els.composerDropZone.classList.toggle('drag-over', visible);
  };

  const formatTokenCount = (n) => {
    const value = Number(n) || 0;
    return value.toLocaleString();
  };

  const formatTokenCost = (usd) => {
    const value = Number(usd) || 0;
    if (value <= 0) return '$0';
    if (value >= 1) {
      return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    }
    if (value >= 0.01) {
      return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    }
    if (value >= 0.0001) return '$' + value.toFixed(4);
    if (value >= 0.000001) return '$' + value.toFixed(6);
    return '< $0.000001';
  };

  const updateSettingsTokenUsage = (appState) => {
    if (!els.settingsTokenUsageModel) return;
    const modelId = appState?.currentModel || window.APP_CONFIG.DEFAULT_MODEL;
    const model = window.APP_CONFIG.getModel(modelId);
    const convo = window.Conversations.getCurrent();
    const usage = window.Conversations.getTokenUsage(convo, modelId);
    const cost = window.APP_CONFIG.calcTokenUsageCost(modelId, usage);

    els.settingsTokenUsageModel.textContent = model?.label || modelId;
    els.settingsTokenUsageInput.textContent = formatTokenCount(usage.prompt);
    els.settingsTokenUsageOutput.textContent = formatTokenCount(usage.completion);
    els.settingsTokenUsageTotal.textContent = formatTokenCount(usage.total);
    if (els.settingsTokenUsageCost) {
      els.settingsTokenUsageCost.textContent = cost == null ? '—' : formatTokenCost(cost);
    }
  };

  const checkTokenCostWarning = (appState) => {
    const threshold = window.APP_CONFIG.TOKEN_COST_WARNING_USD ?? 1;
    const modelId = appState?.currentModel || window.APP_CONFIG.DEFAULT_MODEL;
    const convo = window.Conversations.getCurrent();
    if (!convo || window.Conversations.isCostWarningShown(convo, modelId)) return;

    const usage = window.Conversations.getTokenUsage(convo, modelId);
    const cost = window.APP_CONFIG.calcTokenUsageCost(modelId, usage);
    if (cost == null || cost < threshold) return;

    const model = window.APP_CONFIG.getModel(modelId);
    window.Conversations.markCostWarningShown(convo, modelId);
    openTokenCostWarning({
      cost,
      threshold,
      modelLabel: model?.label || modelId,
      usage
    });
  };

  const openTokenCostWarning = ({ cost, threshold, modelLabel, usage }) => {
    if (!els.tokenCostWarningModal) return;
    if (els.tokenCostWarningMessage) {
      els.tokenCostWarningMessage.textContent = t('tokenCostWarningMessage', {
        cost: formatTokenCost(cost),
        threshold: formatTokenCost(threshold),
        model: modelLabel,
        input: formatTokenCount(usage.prompt),
        output: formatTokenCount(usage.completion)
      });
    }
    els.tokenCostWarningModal.classList.remove('hidden');
  };

  const closeTokenCostWarning = () => {
    if (els.tokenCostWarningModal) els.tokenCostWarningModal.classList.add('hidden');
  };

  const isTokenCostWarningOpen = () => {
    return !!(els.tokenCostWarningModal && !els.tokenCostWarningModal.classList.contains('hidden'));
  };

  const syncSystemPromptModeUI = (appState) => {
    const locale = appState?.locale || window.APP_CONFIG.DEFAULT_LOCALE;
    let mode = appState?.systemPromptMode || 'default';
    const prompt = (appState?.systemPrompt || '').trim();
    if (mode !== 'custom' && prompt && prompt !== window.I18n.getSystemPromptForMode(mode, locale)) {
      mode = window.I18n.detectSystemPromptMode(prompt, locale);
    }
    if (appState?.systemPromptMode === 'custom') {
      mode = 'custom';
    }
    window.I18n.populateSystemPromptModeSelect(els.systemPromptModeSelect, mode);
    if (els.systemPromptModeHint) {
      els.systemPromptModeHint.textContent = window.I18n.getSystemPromptModeHint(mode);
    }
  };

  const openSettings = (state) => {
    els.apiKeyInput.value = state.apiKey || '';
    els.anthropicApiKeyInput.value = state.anthropicApiKey || '';
    els.deepseekApiKeyInput.value = state.deepseekApiKey || '';
    els.nvidiaApiKeyInput.value = state.nvidiaApiKey || '';
    els.byteplusApiKeyInput.value = state.byteplusApiKey || '';
    els.geminiApiKeyInput.value = state.geminiApiKey || '';
    els.kimiApiKeyInput.value = state.kimiApiKey || '';
    els.openrouterApiKeyInput.value = state.openrouterApiKey || '';
    const promptForInput = state.systemPromptMode === 'custom'
      ? (state.customSystemPrompt || state.systemPrompt || '')
      : (state.systemPrompt || window.I18n.getDefaultSystemPrompt(state.locale));
    els.systemPromptInput.value = promptForInput;
    syncSystemPromptModeUI(state);
    window.I18n.populateThemeSelect(els.settingsThemeSelect, state.theme || window.APP_CONFIG.DEFAULT_THEME);
    window.I18n.populateLocaleSelect(els.settingsLocaleSelect, state.locale || window.APP_CONFIG.DEFAULT_LOCALE);
    els.apiKeyInput.type = 'password';
    els.apiKeyIcon.innerHTML = '<i class="fa-solid fa-eye"></i>';
    els.anthropicApiKeyInput.type = 'password';
    els.anthropicApiKeyIcon.innerHTML = '<i class="fa-solid fa-eye"></i>';
    els.deepseekApiKeyInput.type = 'password';
    els.deepseekApiKeyIcon.innerHTML = '<i class="fa-solid fa-eye"></i>';
    els.nvidiaApiKeyInput.type = 'password';
    els.nvidiaApiKeyIcon.innerHTML = '<i class="fa-solid fa-eye"></i>';
    els.byteplusApiKeyInput.type = 'password';
    els.byteplusApiKeyIcon.innerHTML = '<i class="fa-solid fa-eye"></i>';
    els.geminiApiKeyInput.type = 'password';
    els.geminiApiKeyIcon.innerHTML = '<i class="fa-solid fa-eye"></i>';
    els.kimiApiKeyInput.type = 'password';
    els.kimiApiKeyIcon.innerHTML = '<i class="fa-solid fa-eye"></i>';
    els.openrouterApiKeyInput.type = 'password';
    els.openrouterApiKeyIcon.innerHTML = '<i class="fa-solid fa-eye"></i>';
    updateSettingsTokenUsage(state);
    els.settingsModal.classList.remove('hidden');
    setTimeout(() => els.apiKeyInput.focus(), 50);
  };

  const closeSettings = () => els.settingsModal.classList.add('hidden');

  const applyLocale = (appState) => {
    window.I18n.setLocale(appState.locale || window.APP_CONFIG.DEFAULT_LOCALE);
    window.I18n.applyToDOM();
    initImageGenMenus();
    syncComposerToolsUI(appState.currentModel, {
      webSearchEnabled: appState.webSearchEnabled,
      imageGenEnabled: appState.imageGenEnabled,
      thinkingEnabled: appState.thinkingEnabled,
      translateEnabled: appState.translateEnabled,
      translateTargetLang: appState.translateTargetLang,
      imageGenRatio: appState.imageGenRatio,
      imageGenStyle: appState.imageGenStyle,
      imageGenTemplate: appState.imageGenTemplate,
      imageGenRatioPicked: false,
      imageGenStylePicked: false,
      imageGenTemplatePicked: false,
      referenceImage: null
    });
    refreshConversationList(window.Conversations.getCurrent()?.id || null);
    const convo = window.Conversations.getCurrent();
    if (convo) renderMessages(convo);
    else renderEmpty();
    updateExportSelectCount();
    syncMessageScrollRailI18n();
  };

  const openGuide = () => {
    closeSettings();
    if (!els.guideModal) return;
    els.guideModal.classList.remove('hidden');
    if (els.guideBody) els.guideBody.scrollTop = 0;
  };

  const closeGuide = () => {
    if (els.guideModal) els.guideModal.classList.add('hidden');
  };

  const isGuideModalOpen = () => !!(els.guideModal && !els.guideModal.classList.contains('hidden'));

  const openShareModal = () => {
    if (!els.shareModal) return;
    els.shareLoading?.classList.add('hidden');
    els.shareResult?.classList.add('hidden');
    els.shareError?.classList.add('hidden');
    if (els.shareLinkInput) els.shareLinkInput.value = '';
    if (els.shareError) els.shareError.textContent = '';
    els.shareModal.classList.remove('hidden');
  };

  const setShareModalLoading = () => {
    els.shareLoading?.classList.remove('hidden');
    els.shareResult?.classList.add('hidden');
    els.shareError?.classList.add('hidden');
  };

  const setShareModalResult = (url) => {
    els.shareLoading?.classList.add('hidden');
    els.shareError?.classList.add('hidden');
    els.shareResult?.classList.remove('hidden');
    if (els.shareLinkInput) {
      els.shareLinkInput.value = url || '';
      els.shareLinkInput.focus();
      els.shareLinkInput.select();
    }
  };

  const setShareModalError = (message) => {
    els.shareLoading?.classList.add('hidden');
    els.shareResult?.classList.add('hidden');
    els.shareError?.classList.remove('hidden');
    if (els.shareError) els.shareError.textContent = message || t('shareError');
  };

  const closeShareModal = () => {
    if (els.shareModal) els.shareModal.classList.add('hidden');
  };

  const isShareModalOpen = () => !!(els.shareModal && !els.shareModal.classList.contains('hidden'));

  const applyShareViewChrome = () => {
    document.body.classList.add('share-view-mode');
    els.shareViewHeader?.classList.remove('hidden');
    els.shareViewHeader?.removeAttribute('aria-hidden');
    els.shareViewOpenApp?.classList.remove('hidden');
    if (els.shareChatBtn) els.shareChatBtn.classList.add('hidden');
    if (els.composer) els.composer.classList.add('hidden');
    if (els.sidebar) els.sidebar.classList.add('share-view-hidden');
    if (els.openSidebarBtn) els.openSidebarBtn.classList.add('hidden');
    if (els.headerNewChatBtn) els.headerNewChatBtn.classList.add('hidden');
    if (els.toggleExportSelectBtn) els.toggleExportSelectBtn.classList.add('hidden');
  };

  const enterShareLoadingMode = () => {
    applyShareViewChrome();
    if (els.shareViewTitle) {
      els.shareViewTitle.textContent = t('shareLoadingView');
      els.shareViewTitle.classList.add('is-loading');
    }
    if (els.shareViewModelPill) els.shareViewModelPill.classList.add('hidden');
    if (els.shareViewReadonlyText) els.shareViewReadonlyText.textContent = t('shareViewBanner');
    if (els.messages) {
      els.messages.innerHTML = '<div class="messages-empty share-loading-state">'
        + '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>'
        + '<p>' + escapeHTML(t('shareLoadingView')) + '</p>'
        + '</div>';
    }
  };

  const enterShareViewMode = (snapshot) => {
    applyShareViewChrome();

    const convo = {
      id: 'shared',
      title: snapshot.title || t('shareTitle'),
      model: snapshot.model || '',
      messages: snapshot.messages || [],
      createdAt: snapshot.createdAt || Date.now(),
      updatedAt: snapshot.createdAt || Date.now()
    };

    if (els.shareViewTitle) {
      els.shareViewTitle.textContent = convo.title;
      els.shareViewTitle.classList.remove('is-loading');
    }
    if (els.shareViewModelPill) {
      const model = snapshot.model ? window.APP_CONFIG.getModel(snapshot.model) : null;
      const modelLabel = model ? window.APP_CONFIG.getModelDisplayLabel(model) : '';
      if (modelLabel) {
        els.shareViewModelPill.textContent = modelLabel;
        els.shareViewModelPill.classList.remove('hidden');
      } else {
        els.shareViewModelPill.classList.add('hidden');
      }
    }
    if (els.shareViewReadonlyText) els.shareViewReadonlyText.textContent = t('shareViewBanner');

    renderMessages(convo);
  };

  const showShareLoadError = (message) => {
    applyShareViewChrome();
    if (els.shareViewTitle) {
      els.shareViewTitle.textContent = t('shareLoadError');
      els.shareViewTitle.classList.add('is-loading');
    }
    if (els.shareViewModelPill) els.shareViewModelPill.classList.add('hidden');
    if (els.messages) {
      els.messages.innerHTML = '<div class="messages-empty share-load-error">'
        + '<h2>' + escapeHTML(message || t('shareLoadError')) + '</h2>'
        + '<p><a href="./index.html">' + escapeHTML(t('shareOpenApp')) + '</a></p>'
        + '</div>';
    }
  };

  let renameResolve = null;

  const openRenameModal = (title) => {
    return new Promise((resolve) => {
      renameResolve = resolve;
      els.renameInput.value = title || '';
      els.renameModal.classList.remove('hidden');
      setTimeout(() => {
        els.renameInput.focus();
        els.renameInput.select();
      }, 50);
    });
  };

  const closeRenameModal = (result = null) => {
    els.renameModal.classList.add('hidden');
    if (renameResolve) {
      renameResolve(result);
      renameResolve = null;
    }
  };

  const isRenameModalOpen = () => !els.renameModal.classList.contains('hidden');

  const PREVIEW_WIDTH_MIN = 260;
  const PREVIEW_CHAT_MIN = 220;

  const isMobileSidebar = () => window.matchMedia('(max-width: 768px)').matches;

  const getPreviewRightEdge = () => {
    if (isMobileSidebar()) return window.innerWidth;
    return els.main?.getBoundingClientRect().right ?? window.innerWidth;
  };

  const clampPreviewWidth = (widthPx) => {
    const rightEdge = getPreviewRightEdge();
    const mainWidth = isMobileSidebar()
      ? window.innerWidth
      : (els.main?.getBoundingClientRect().width ?? rightEdge);
    const min = PREVIEW_WIDTH_MIN;
    const max = Math.max(min, mainWidth - PREVIEW_CHAT_MIN);
    return Math.min(max, Math.max(min, widthPx));
  };

  const clearPreviewPanelWidth = () => {
    if (!els.markdownPreviewPanel) return;
    els.markdownPreviewPanel.classList.remove('is-user-sized');
    els.markdownPreviewPanel.style.removeProperty('--md-preview-user-width');
    els.markdownPreviewPanel.style.width = '';
    els.markdownPreviewPanel.style.flex = '';
  };

  const setPreviewPanelWidth = (widthPx, { save = false } = {}) => {
    if (!els.markdownPreviewPanel) return clampPreviewWidth(widthPx);
    const w = clampPreviewWidth(widthPx);
    els.markdownPreviewPanel.classList.add('is-user-sized');
    els.markdownPreviewPanel.style.setProperty('--md-preview-user-width', `${w}px`);
    els.markdownPreviewPanel.style.width = `${w}px`;
    els.markdownPreviewPanel.style.flex = `0 0 ${w}px`;
    if (save && !isMobileSidebar()) window.Storage.set({ mdPreviewWidth: w });
    return w;
  };

  const applyPreviewPanelWidth = (savedWidth) => {
    if (!els.markdownPreviewPanel?.classList.contains('is-open')) return;
    if (isMobileSidebar()) {
      clearPreviewPanelWidth();
      return;
    }
    const n = Number(savedWidth);
    if (Number.isFinite(n) && n > 0) {
      setPreviewPanelWidth(n);
    } else {
      clearPreviewPanelWidth();
    }
  };

  const getPreviewWidthFromPointer = (clientX) => getPreviewRightEdge() - clientX;

  let previewResizeDragging = false;
  let previewResizeWheelSaveTimer = null;
  let previewResizeCaptureEl = null;

  const isPreviewResizeStartTarget = (e) => {
    if (e.target.closest('#closeMdPreviewBtn')) return false;
    if (e.target.closest('#mdPreviewResizeHandle')) return true;
    if (e.target.closest('.md-preview-header')) return true;
    const panel = els.markdownPreviewPanel;
    if (!panel?.classList.contains('is-open')) return false;
    if (!e.target.closest('#markdownPreviewPanel')) return false;
    if (e.target.closest('.html-preview-frame, .md-preview-content')) return false;
    const x = e.clientX;
    if (x == null) return false;
    const rect = panel.getBoundingClientRect();
    return x - rect.left <= 28;
  };

  const unbindPreviewResizePointer = () => {
    if (!previewResizeCaptureEl) return;
    previewResizeCaptureEl.removeEventListener('pointermove', onPreviewResizeMove);
    previewResizeCaptureEl.removeEventListener('pointerup', endPreviewResize);
    previewResizeCaptureEl.removeEventListener('pointercancel', endPreviewResize);
    previewResizeCaptureEl = null;
  };

  const endPreviewResize = (e) => {
    if (!previewResizeDragging || !els.markdownPreviewPanel) return;
    if (e?.pointerId != null && previewResizeCaptureEl?.hasPointerCapture?.(e.pointerId)) {
      previewResizeCaptureEl.releasePointerCapture(e.pointerId);
    }
    previewResizeDragging = false;
    els.markdownPreviewPanel.classList.remove('is-resizing');
    document.body.classList.remove('md-preview-resizing');
    unbindPreviewResizePointer();
    setPreviewPanelWidth(els.markdownPreviewPanel.getBoundingClientRect().width, { save: true });
  };

  const onPreviewResizeMove = (e) => {
    if (!previewResizeDragging) return;
    e.preventDefault();
    setPreviewPanelWidth(getPreviewWidthFromPointer(e.clientX));
  };

  const startPreviewResize = (e) => {
    if (!els.markdownPreviewPanel?.classList.contains('is-open')) return;
    if (!isPreviewResizeStartTarget(e)) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    if (previewResizeDragging) return;
    previewResizeDragging = true;
    previewResizeCaptureEl = e.currentTarget;
    els.markdownPreviewPanel.classList.add('is-resizing');
    document.body.classList.add('md-preview-resizing');
    previewResizeCaptureEl.setPointerCapture(e.pointerId);
    previewResizeCaptureEl.addEventListener('pointermove', onPreviewResizeMove);
    previewResizeCaptureEl.addEventListener('pointerup', endPreviewResize);
    previewResizeCaptureEl.addEventListener('pointercancel', endPreviewResize);
    setPreviewPanelWidth(getPreviewWidthFromPointer(e.clientX));
  };

  const onPreviewWheelResize = (e) => {
    if (!els.markdownPreviewPanel?.classList.contains('is-open')) return;
    const inZone = e.target.closest('#mdPreviewResizeHandle, .md-preview-header')
      || (e.target.closest('#markdownPreviewPanel') && (e.altKey || e.metaKey));
    if (!inZone) return;

    let delta = 0;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) delta = e.deltaX;
    else if (e.shiftKey && Math.abs(e.deltaY) > 0) delta = e.deltaY;
    if (!delta) return;

    e.preventDefault();
    const current = els.markdownPreviewPanel.getBoundingClientRect().width;
    setPreviewPanelWidth(current - delta);
    clearTimeout(previewResizeWheelSaveTimer);
    previewResizeWheelSaveTimer = setTimeout(() => {
      if (!els.markdownPreviewPanel?.classList.contains('is-open')) return;
      setPreviewPanelWidth(els.markdownPreviewPanel.getBoundingClientRect().width, { save: true });
    }, 280);
  };

  const bindPreviewResize = () => {
    const panel = els.markdownPreviewPanel;
    const handle = els.mdPreviewResizeHandle;
    const header = els.mdPreviewHeader;
    if (!panel || !handle) return;

    handle.addEventListener('pointerdown', startPreviewResize);
    header?.addEventListener('pointerdown', startPreviewResize);
    panel.addEventListener('pointerdown', startPreviewResize);
    panel.addEventListener('wheel', onPreviewWheelResize, { passive: false });

    window.addEventListener('resize', () => {
      if (!panel.classList.contains('is-open')) return;
      const saved = window.Storage.get().mdPreviewWidth;
      applyPreviewPanelWidth(saved || panel.getBoundingClientRect().width);
    });
  };

  const toggleSidebar = (force) => {
    const app = els.app || document.getElementById('app');
    const current = app.getAttribute('data-sidebar');
    let next;
    if (force === true) {
      next = 'open';
    } else if (force === false) {
      next = 'closed';
    } else {
      next = current === 'open' ? 'closed' : 'open';
    }
    app.setAttribute('data-sidebar', next);
    window.I18n.updateSidebarMenuTitle();
  };

  const closeMobileSidebar = () => {
    if (isMobileSidebar()) toggleSidebar(false);
  };

  const initSidebar = () => {
    const app = els.app || document.getElementById('app');
    if (isMobileSidebar()) {
      toggleSidebar(false);
    } else if (app.getAttribute('data-sidebar') === 'closed') {
      toggleSidebar(true);
    }
    app.setAttribute('data-sidebar-init', '');
  };

  let sidebarWasMobile = isMobileSidebar();

  const bindSidebarResize = () => {
    window.addEventListener('resize', () => {
      const mobile = isMobileSidebar();
      if (mobile === sidebarWasMobile) return;
      sidebarWasMobile = mobile;
      if (mobile) toggleSidebar(false);
      else toggleSidebar(true);
    });
  };

  const bindComposerViewport = () => {
    const composer = els.composer;
    const vv = window.visualViewport;
    if (!composer || !vv) return;

    const sync = () => {
      if (!isMobileSidebar()) {
        composer.style.removeProperty('transform');
        return;
      }
      const gap = window.innerHeight - vv.height - vv.offsetTop;
      composer.style.transform = gap > 50 ? `translateY(-${gap}px)` : '';
    };

    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
    window.addEventListener('resize', sync);
  };

  const setPreviewPanelTitle = (mode) => {
    if (els.previewPanelIcon) {
      els.previewPanelIcon.className = mode === 'html'
        ? 'fa-brands fa-html5'
        : 'fa-brands fa-markdown';
    }
    if (els.previewPanelTitle) {
      els.previewPanelTitle.textContent = mode === 'html' ? t('previewHtml') : t('previewMarkdown');
    }
    if (els.markdownPreviewPanel) {
      els.markdownPreviewPanel.setAttribute('aria-label', mode === 'html' ? t('previewHtml') : t('previewMarkdown'));
    }
  };

  const HTML_PREVIEW_HEAD = '<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>';

  const wrapHtmlPreview = (source) => {
    const trimmed = (source || '').trim();
    if (!trimmed) return '';
    if (/<!doctype\s+html/i.test(trimmed) || /<html[\s>]/i.test(trimmed)) return trimmed;
    if (/<head[\s>]/i.test(trimmed)) {
      if (/<body[\s>]/i.test(trimmed)) {
        return '<!DOCTYPE html><html>' + trimmed + '</html>';
      }
      return '<!DOCTYPE html><html>' + trimmed + '<body></body></html>';
    }
    if (/<body[\s>]/i.test(trimmed)) {
      return '<!DOCTYPE html><html>' + HTML_PREVIEW_HEAD + trimmed + '</html>';
    }
    return '<!DOCTYPE html><html>' + HTML_PREVIEW_HEAD + '<body>' + trimmed + '</body></html>';
  };

  const openPreviewPanel = () => {
    els.markdownPreviewPanel.classList.add('is-open');
    els.markdownPreviewPanel.setAttribute('aria-hidden', 'false');
    els.app.setAttribute('data-md-preview', 'open');
    if (els.mdPreviewOverlay) els.mdPreviewOverlay.classList.remove('hidden');
    applyPreviewPanelWidth(window.Storage.get().mdPreviewWidth);
  };

  const openMarkdownPreview = (source) => {
    if (!source || !els.markdownPreviewPanel || !els.markdownPreviewContent) return;
    setPreviewPanelTitle('markdown');
    els.markdownPreviewContent.classList.remove('is-html-preview');
    els.markdownPreviewContent.innerHTML = window.Markdown.render(source);
    polishContent(els.markdownPreviewContent, { renderMermaid: true });
    els.markdownPreviewContent.scrollTop = 0;
    openPreviewPanel();
  };

  const openHtmlPreview = (source) => {
    const trimmed = (source || '').trim();
    if (!trimmed || !els.markdownPreviewPanel || !els.markdownPreviewContent) return;
    setPreviewPanelTitle('html');
    els.markdownPreviewContent.classList.remove('is-html-preview');
    els.markdownPreviewContent.innerHTML = '';
    els.markdownPreviewContent.classList.add('is-html-preview');
    const iframe = document.createElement('iframe');
    iframe.className = 'html-preview-frame';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-modals');
    iframe.setAttribute('title', t('previewHtml'));
    iframe.srcdoc = wrapHtmlPreview(trimmed);
    els.markdownPreviewContent.appendChild(iframe);
    els.markdownPreviewContent.scrollTop = 0;
    openPreviewPanel();
  };

  const closeMarkdownPreview = () => {
    if (!els.markdownPreviewPanel) return;
    clearTimeout(previewResizeWheelSaveTimer);
    previewResizeWheelSaveTimer = null;
    previewResizeDragging = false;
    unbindPreviewResizePointer();
    els.markdownPreviewPanel.classList.remove('is-resizing');
    document.body.classList.remove('md-preview-resizing');
    clearPreviewPanelWidth();
    els.markdownPreviewPanel.classList.remove('is-open');
    els.markdownPreviewPanel.setAttribute('aria-hidden', 'true');
    els.app.removeAttribute('data-md-preview');
    if (els.mdPreviewOverlay) els.mdPreviewOverlay.classList.add('hidden');
    if (els.markdownPreviewContent) {
      els.markdownPreviewContent.classList.remove('is-html-preview');
      els.markdownPreviewContent.innerHTML = '';
    }
  };

  const openImagePreview = (src, alt = '') => {
    if (!src || !els.imagePreviewOverlay || !els.imagePreviewImg) return;
    els.imagePreviewImg.src = src;
    els.imagePreviewImg.alt = alt || 'Ảnh';
    if (els.imagePreviewCaption) {
      const caption = (alt || '').trim();
      if (caption) {
        els.imagePreviewCaption.textContent = caption;
        els.imagePreviewCaption.classList.remove('hidden');
      } else {
        els.imagePreviewCaption.textContent = '';
        els.imagePreviewCaption.classList.add('hidden');
      }
    }
    els.imagePreviewOverlay.classList.remove('hidden');
    els.imagePreviewOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('image-preview-open');
  };

  const closeImagePreview = () => {
    if (!els.imagePreviewOverlay) return;
    els.imagePreviewOverlay.classList.add('hidden');
    els.imagePreviewOverlay.setAttribute('aria-hidden', 'true');
    if (els.imagePreviewImg) {
      els.imagePreviewImg.removeAttribute('src');
      els.imagePreviewImg.alt = '';
    }
    if (els.imagePreviewCaption) {
      els.imagePreviewCaption.textContent = '';
      els.imagePreviewCaption.classList.add('hidden');
    }
    document.body.classList.remove('image-preview-open');
  };

  const isImagePreviewOpen = () =>
    !!(els.imagePreviewOverlay && !els.imagePreviewOverlay.classList.contains('hidden'));

  const closeAllMsgExportMenus = () => {
    document.querySelectorAll('.msg-export-menu:not(.hidden)').forEach((menu) => {
      menu.classList.add('hidden');
      const toggle = menu.closest('.msg-export-wrap')?.querySelector('[data-action="export-toggle"]');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    });
  };

  const closeHeaderDownloadMenu = () => {
    if (!els.headerDownloadMenu) return;
    els.headerDownloadMenu.classList.add('hidden');
    if (els.headerDownloadBtn) els.headerDownloadBtn.setAttribute('aria-expanded', 'false');
  };

  const toggleHeaderDownloadMenu = () => {
    if (!els.headerDownloadMenu || !els.headerDownloadBtn) return;
    const open = els.headerDownloadMenu.classList.contains('hidden');
    els.headerDownloadMenu.classList.toggle('hidden', !open);
    els.headerDownloadBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  const setHeaderDownloadOptionDisabled = (format, disabled) => {
    const option = els.headerDownloadMenu?.querySelector(`[data-export-format="${format}"]`);
    if (option) option.disabled = disabled;
  };

  const downloadConversation = (convo) => {
    const { formatConversation, downloadFile } = window.Utils;
    const md = formatConversation(convo);
    const safeName = (convo.title || 'conversation').replace(/[^a-zA-Z0-9\u00C0-\u1EF9_\-\s]/g, '').trim() || 'conversation';
    downloadFile(md, safeName + '.md', 'text/markdown');
  };

  const downloadConversationTxt = (convo) => {
    const { formatConversationPlainText, downloadFile } = window.Utils;
    const text = formatConversationPlainText(convo);
    const safeName = (convo.title || 'conversation').replace(/[^a-zA-Z0-9\u00C0-\u1EF9_\-\s]/g, '').trim() || 'conversation';
    downloadFile(text, safeName + '.txt', 'text/plain');
  };

  let toastTimer;
  const showToast = (msg) => {
    els.toast.textContent = msg;
    els.toast.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.add('hidden'), 1800);
  };

  let pendingExportDownload = null;
  let pendingExportKind = null;

  const setPdfExportLoading = (visible, { title, hint, ready = false, downloadLabel } = {}) => {
    if (!els.pdfExportOverlay) return;
    if (visible) {
      if (title && els.pdfExportLoadingTitle) els.pdfExportLoadingTitle.textContent = title;
      if (hint && els.pdfExportLoadingText) els.pdfExportLoadingText.textContent = hint;
      if (downloadLabel && els.pdfExportDownloadBtn) els.pdfExportDownloadBtn.textContent = downloadLabel;
      els.pdfExportSpinner?.classList.toggle('hidden', ready);
      els.pdfExportDownloadBtn?.classList.toggle('hidden', !ready);
      els.pdfExportOverlay.classList.remove('hidden');
      els.pdfExportOverlay.setAttribute('aria-hidden', 'false');
      els.pdfExportOverlay.setAttribute('aria-busy', ready ? 'false' : 'true');
      document.body.classList.add('pdf-export-loading');
    } else {
      pendingExportDownload = null;
      pendingExportKind = null;
      els.pdfExportSpinner?.classList.remove('hidden');
      els.pdfExportDownloadBtn?.classList.add('hidden');
      els.pdfExportOverlay.classList.add('hidden');
      els.pdfExportOverlay.setAttribute('aria-hidden', 'true');
      els.pdfExportOverlay.setAttribute('aria-busy', 'false');
      document.body.classList.remove('pdf-export-loading');
    }
  };

  const showExportDownloadPrompt = (blob, filename, { title, hint, downloadLabel, kind = 'pdf' }) => {
    pendingExportDownload = { blob, filename };
    pendingExportKind = kind;
    setPdfExportLoading(true, { title, hint, ready: true, downloadLabel });
  };

  const consumeExportDownload = () => {
    const pending = pendingExportDownload;
    const kind = pendingExportKind;
    pendingExportDownload = null;
    pendingExportKind = null;
    return pending ? { ...pending, kind } : null;
  };

  const finishExportDownload = (result, { readyTitle, readyHint, readyDownloadLabel, kind = 'pdf' }) => {
    const { deliverDownload } = window.Utils;
    if (deliverDownload(result.blob, result.filename) === 'downloaded') {
      setPdfExportLoading(false);
      return 'downloaded';
    }
    showExportDownloadPrompt(result.blob, result.filename, {
      title: readyTitle,
      hint: readyHint,
      downloadLabel: readyDownloadLabel,
      kind,
    });
    return 'needs_gesture';
  };

  return {
    cacheEls, setTheme, initModelSelect, initProviderSelects, updateModelSelect, syncProviderSelect,
    initEffortSelect, syncEffortSelect, initTranslateLangMenu, initImageGenMenus,
    syncComposerToolsUI, syncTranslateUI, closeTranslateLangMenu, closeImageGenMenus, toggleImageGenMenu, setImageGenOptionPicked,
    setStreamingSearchStatus, setStreamingImageStatus, updateStreamingAssistantContent,
    renderConversationList, refreshConversationList, getConversationSearchQuery,
    setConversationSearchQuery, toggleConversationSearch, clearConversationSearch,
    renderMessages, renderEmpty, animateClearAll,
    appendMessage, appendStreamingMessage, updateStreamingContent, finalizeStreaming,
    enterEditMode, exitEditMode, downloadConversation, downloadConversationTxt,
    scrollToBottom, scrollToBottomIfNear, scrollMessageToTop, scrollMessageToBottom,
    showError, removeError, setStreaming,
    renderComposerAttachments, setDragOverlay,
    openSettings, closeSettings, updateSettingsTokenUsage, syncSystemPromptModeUI, checkTokenCostWarning,
    openTokenCostWarning, closeTokenCostWarning, isTokenCostWarningOpen,
    applyLocale, openGuide, closeGuide, isGuideModalOpen,
    openShareModal, closeShareModal, isShareModalOpen,
    setShareModalLoading, setShareModalResult, setShareModalError,
    enterShareLoadingMode, enterShareViewMode, showShareLoadError,
    openRenameModal, closeRenameModal, isRenameModalOpen, toggleSidebar, closeMobileSidebar, initSidebar, bindSidebarResize, bindComposerViewport, showToast, rerenderMermaid,
    setAssistantToolbar, updateAssistantMessage, beginRetryStreaming,
    openMarkdownPreview, openHtmlPreview, closeMarkdownPreview, bindPreviewResize,
    openImagePreview, closeImagePreview, isImagePreviewOpen,
    setPdfExportLoading,
    showExportDownloadPrompt, consumeExportDownload, finishExportDownload,
    isExportSelectMode, toggleExportSelectMode, setExportSelectMode,
    getExportSelectedIndices, toggleExportSelectIndex,
    selectAllExportMessages, clearExportSelection,
    preparePdfExportRoot,
    closeAllMsgExportMenus,
    closeHeaderDownloadMenu, toggleHeaderDownloadMenu, setHeaderDownloadOptionDisabled,
    els
  };
})();
