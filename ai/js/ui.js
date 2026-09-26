window.UI = (() => {
  const {
    escapeHTML, safeHref, safeImageSrc, formatTime, truncate, copyToClipboard, autoResize,
    highlightSearchText, normalizeSearchQuery, buildSearchFold, findAllSearchRangesInFold,
    collectGroundingLinks
  } = window.Utils;
  const { DEFAULT_SYSTEM_PROMPT } = window.APP_CONFIG;
  const t = (key, params) => window.I18n.t(key, params);
  const imageSrcAttr = (src) => {
    const safe = safeImageSrc(src);
    return safe ? escapeHTML(safe) : '';
  };

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
    els.imageStudioBtn = $('#imageStudioBtn');
    els.sidebarHistoryLabel = $('#sidebarHistoryLabel');
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
    els.openrouterApiKeyInput = $('#openrouterApiKeyInput');
    els.openrouterApiKeyIcon = $('#openrouterApiKeyIcon');
    els.systemPromptInput = $('#systemPromptInput');
    els.settingsLocaleSelect = $('#settingsLocaleSelect');
    els.settingsThemeSelect = $('#settingsThemeSelect');
    els.settingsForm = $('#settingsForm');
    els.settingsNavSearch = $('#settingsNavSearch');
    els.settingsNavList = $('#settingsNavList');
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
    els.pdfExportCancelBtn = $('#pdfExportCancelBtn');
    els.toggleExportSelectBtn = $('#toggleExportSelectBtn');
    els.exportSelectBar = $('#exportSelectBar');
    els.compressContextBar = $('#compressContextBar');
    els.compressContextHint = $('#compressContextHint');
    els.compressContextBtn = $('#compressContextBtn');
    els.compareBar = $('#compareBar');
    els.compareBarHint = $('#compareBarHint');
    els.compareBarCount = $('#compareBarCount');
    els.compareModelPickers = $('#compareModelPickers');
    els.compareAddModelBtn = $('#compareAddModelBtn');
    els.compareBtn = $('#compareBtn');
    els.modelCompareOverlay = $('#modelCompareOverlay');
    els.modelCompareQuestion = $('#modelCompareQuestion');
    els.modelCompareQuestionText = $('#modelCompareQuestionText');
    els.modelCompareColumns = $('#modelCompareColumns');
    els.closeModelCompareBtn = $('#closeModelCompareBtn');
    els.exportSelectCount = $('#exportSelectCount');
    els.exportSelectAllBtn = $('#exportSelectAllBtn');
    els.exportSelectClearBtn = $('#exportSelectClearBtn');
    els.exitExportSelectBtn = $('#exitExportSelectBtn');
    els.clearAllBtn = $('#clearAllBtn');
    els.clearAllSidebarBtn = $('#clearAllSidebarBtn');
    els.toggleApiKeyBtn = $('#toggleApiKeyBtn');
    els.toggleAnthropicApiKeyBtn = $('#toggleAnthropicApiKeyBtn');
    els.toggleDeepseekApiKeyBtn = $('#toggleDeepseekApiKeyBtn');
    els.toggleOpenrouterApiKeyBtn = $('#toggleOpenrouterApiKeyBtn');
    els.composerAttachments = $('#composerAttachments');
    els.composerTools = $('#composerTools');
    els.webSearchBtn = $('#webSearchBtn');
    els.shellBtn = $('#shellBtn');
    els.imageGenBtn = $('#imageGenBtn');
    els.thinkingBtn = $('#thinkingBtn');
    els.translateBtn = $('#translateBtn');
    els.systemPromptModeSelect = $('#systemPromptModeSelect');
    els.systemPromptModeBtn = $('#systemPromptModeBtn');
    els.systemPromptModeMenu = $('#systemPromptModeMenu');
    els.systemPromptModeHint = $('#systemPromptModeHint');
    els.settingsTokenUsageModel = $('#settingsTokenUsageModel');
    els.settingsTokenUsageInput = $('#settingsTokenUsageInput');
    els.settingsTokenUsageOutput = $('#settingsTokenUsageOutput');
    els.settingsTokenUsageTotal = $('#settingsTokenUsageTotal');
    els.settingsTokenUsageCost = $('#settingsTokenUsageCost');
    els.usageDashResetBtn = $('#usageDashResetBtn');
    els.usageDashRanges = $('#usageDashRanges');
    els.usageDashTotals = $('#usageDashTotals');
    els.usageDashCost = $('#usageDashCost');
    els.usageDashInOut = $('#usageDashInOut');
    els.usageDashChart = $('#usageDashChart');
    els.usageDashEmpty = $('#usageDashEmpty');
    els.usageDashResetAt = $('#usageDashResetAt');
    els.usageDashModels = $('#usageDashModels');
    els.settingsUsageDashModelsLabel = $('#settingsUsageDashModelsLabel');
    els.tokenCostWarningModal = $('#tokenCostWarningModal');
    els.tokenCostWarningMessage = $('#tokenCostWarningMessage');
    els.tokenCostWarningSettingsBtn = $('#tokenCostWarningSettingsBtn');
    els.backupIncludeKeys = $('#backupIncludeKeys');
    els.backupExportBtn = $('#backupExportBtn');
    els.backupRestoreBtn = $('#backupRestoreBtn');
    els.backupFileInput = $('#backupFileInput');
    els.backupRestoreModal = $('#backupRestoreModal');
    els.backupRestoreSummary = $('#backupRestoreSummary');
    els.backupRestoreDate = $('#backupRestoreDate');
    els.backupRestoreKeysWrap = $('#backupRestoreKeysWrap');
    els.backupRestoreKeys = $('#backupRestoreKeys');
    els.backupRestoreMergeBtn = $('#backupRestoreMergeBtn');
    els.backupRestoreReplaceBtn = $('#backupRestoreReplaceBtn');
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
    els.imageGenRefThumb = $('#imageGenRefThumb');
    els.imageGenRefClear = $('#imageGenRefClear');
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
    els.imageGenQualityBtn = $('#imageGenQualityBtn');
    els.imageGenQualityPicker = $('#imageGenQualityPicker');
    els.imageGenQualityChip = $('#imageGenQualityChip');
    els.imageGenQualityChipLabel = $('#imageGenQualityChipLabel');
    els.imageGenQualityChipClear = $('#imageGenQualityChipClear');
    els.imageGenQualityMenu = $('#imageGenQualityMenu');
    els.imageGenQualityOptions = $('#imageGenQualityOptions');
    els.slashCommandMenu = $('#slashCommandMenu');
    els.slashCommandList = $('#slashCommandList');
    els.slashCommandHint = $('#slashCommandHint');
    els.composerDropZone = $('#composerDropZone');
    els.appDropOverlay = $('#appDropOverlay');
    els.app = $('#app');
    els.attachBtn = $('#attachBtn');
    els.micBtn = $('#micBtn');
    els.snippetsBtn = $('#snippetsBtn');
    els.snippetsMenu = $('#snippetsMenu');
    els.snippetsMenuSearch = $('#snippetsMenuSearch');
    els.snippetsMenuList = $('#snippetsMenuList');
    els.snippetsManageBtn = $('#snippetsManageBtn');
    els.snippetsModal = $('#snippetsModal');
    els.snippetsModalSearch = $('#snippetsModalSearch');
    els.snippetsModalList = $('#snippetsModalList');
    els.snippetsListView = $('#snippetsListView');
    els.snippetsAddBtn = $('#snippetsAddBtn');
    els.snippetsSaveFromComposerBtn = $('#snippetsSaveFromComposerBtn');
    els.snippetForm = $('#snippetForm');
    els.snippetTitleInput = $('#snippetTitleInput');
    els.snippetContentInput = $('#snippetContentInput');
    els.snippetFormCancelBtn = $('#snippetFormCancelBtn');
    els.snippetsListFooter = $('#snippetsListFooter');
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
    els.artifactPreviewToolbar = $('#artifactPreviewToolbar');
    els.artifactRefreshBtn = $('#artifactRefreshBtn');
    els.artifactOpenTabBtn = $('#artifactOpenTabBtn');
    els.renameModal = $('#renameModal');
    els.renameForm = $('#renameForm');
    els.renameInput = $('#renameInput');
    els.modelSelect = $('#modelSelect');
    els.modelSelectBtn = $('#modelSelectBtn');
    els.modelSelectBtnLabel = $('#modelSelectBtnLabel');
    els.modelSelectMenu = $('#modelSelectMenu');
    els.providerSelect = $('#providerSelect');
    els.providerSelectBtn = $('#providerSelectBtn');
    els.providerSelectBtnIcon = $('#providerSelectBtnIcon');
    els.providerSelectBtnLabel = $('#providerSelectBtnLabel');
    els.providerSelectMenu = $('#providerSelectMenu');
    els.effortSelect = $('#effortSelect');
    els.effortSelectBtn = $('#effortSelectBtn');
    els.effortSelectBtnLabel = $('#effortSelectBtnLabel');
    els.effortSelectMenu = $('#effortSelectMenu');
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
    els.chatFindBtn = $('#chatFindBtn');
    els.chatFindBar = $('#chatFindBar');
    els.chatFindInput = $('#chatFindInput');
    els.chatFindCount = $('#chatFindCount');
    els.chatFindPrev = $('#chatFindPrev');
    els.chatFindNext = $('#chatFindNext');
    els.chatFindClose = $('#chatFindClose');
    bindMessagesScroll();
    bindMessageScrollRail();
    bindChatFind();
  };

  const syncComposerToolsUI = (modelId, toolState) => {
    const {
      webSearchEnabled, shellEnabled, imageGenEnabled, thinkingEnabled, translateEnabled, translateTargetLang,
      imageGenRatio, imageGenStyle, imageGenQuality
    } = toolState;
    const imageWorkspace = window.APP_CONFIG.isImageWorkspace();
    const showWebSearch = window.APP_CONFIG.modelSupportsWebSearch(modelId);
    const showShell = window.APP_CONFIG.modelSupportsShell(modelId);
    const showImageGen = window.APP_CONFIG.modelSupportsImageGen(modelId);
    const showThinking = window.APP_CONFIG.modelSupportsThinking(modelId);
    const hasTools = showWebSearch || showShell || showThinking || true;
    const imageOn = imageWorkspace && showImageGen && !!imageGenEnabled;

    if (els.composerTools) {
      els.composerTools.classList.toggle('hidden', imageWorkspace || !hasTools);
    }
    if (els.webSearchBtn) {
      els.webSearchBtn.classList.toggle('hidden', !showWebSearch);
      const active = showWebSearch && !!webSearchEnabled;
      els.webSearchBtn.classList.toggle('is-active', active);
      els.webSearchBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
    if (els.shellBtn) {
      els.shellBtn.classList.toggle('hidden', !showShell);
      const active = showShell && !!shellEnabled;
      els.shellBtn.classList.toggle('is-active', active);
      els.shellBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
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
    if (els.compareBtn) {
      const compareOn = !!window.Storage.get().compareEnabled;
      els.compareBtn.classList.toggle('is-active', compareOn);
      els.compareBtn.setAttribute('aria-pressed', compareOn ? 'true' : 'false');
    }
    syncCompareBar(window.Storage.get());
    syncTranslateUI({
      translateEnabled: imageWorkspace ? false : translateEnabled,
      translateTargetLang: translateTargetLang || stateTranslateLang
    });
    syncImageGenUI({
      imageGenEnabled: imageOn,
      imageGenRatio,
      imageGenStyle,
      imageGenQuality,
      referenceImage: toolState.referenceImage
    });
    syncComposerPlaceholder({ imageGenEnabled: imageOn, translateEnabled: imageWorkspace ? false : translateEnabled });
  };

  const syncWorkspaceNav = () => {
    const image = window.APP_CONFIG.isImageWorkspace();
    const app = els.app || document.getElementById('app');
    if (app) app.dataset.workspace = image ? 'image' : 'chat';
    if (image) closePromptModeMenu();
    if (els.imageStudioBtn) {
      els.imageStudioBtn.classList.toggle('is-active', image);
      els.imageStudioBtn.setAttribute('aria-pressed', image ? 'true' : 'false');
    }
    if (els.sidebarHistoryLabel) {
      els.sidebarHistoryLabel.textContent = t(image ? 'historyImage' : 'history');
    }
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
    [els.imageGenRatioMenu, els.imageGenStyleMenu, els.imageGenQualityMenu].forEach((menu) => {
      if (menu) menu.classList.add('hidden');
    });
    [els.imageGenRatioBtn, els.imageGenStyleBtn, els.imageGenQualityBtn].forEach((btn) => {
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
    if (els.imageGenQualityOptions) {
      els.imageGenQualityOptions.innerHTML = window.APP_CONFIG.IMAGE_GEN_QUALITIES.map((quality) =>
        '<button type="button" class="composer-dropdown-option" role="option" data-value="' + escapeHTML(quality.id) + '">'
        + '<span class="composer-dropdown-option-text">' + escapeHTML(window.I18n.imageGenLabel('quality', quality.id)) + '</span>'
        + '<i class="fa-solid fa-check" aria-hidden="true"></i>'
        + '</button>'
      ).join('');
    }
  };

  const setImageGenOptionPicked = (type, picked, { ratioId, styleId, qualityId } = {}) => {
    const ratio = window.APP_CONFIG.getImageGenRatio(ratioId || window.APP_CONFIG.DEFAULT_IMAGE_GEN_RATIO);
    const style = window.APP_CONFIG.getImageGenStyle(styleId || window.APP_CONFIG.DEFAULT_IMAGE_GEN_STYLE);

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

    if (type === 'quality') {
      if (els.imageGenQualityPicker) els.imageGenQualityPicker.classList.toggle('hidden', picked);
      if (els.imageGenQualityChip) els.imageGenQualityChip.classList.toggle('hidden', !picked);
      if (picked && els.imageGenQualityChipLabel) {
        els.imageGenQualityChipLabel.textContent = window.I18n.imageGenLabel('quality', qualityId);
      }
      if (picked) closeImageGenMenus();
    }
  };

  const syncImageGenUI = ({
    imageGenEnabled, imageGenRatio, imageGenStyle, imageGenQuality, referenceImage
  }) => {
    const ratioId = imageGenRatio || window.APP_CONFIG.DEFAULT_IMAGE_GEN_RATIO;
    const styleId = imageGenStyle || window.APP_CONFIG.DEFAULT_IMAGE_GEN_STYLE;
    const qualityId = imageGenQuality || window.APP_CONFIG.DEFAULT_IMAGE_GEN_QUALITY;
    const ratioActive = ratioId !== window.APP_CONFIG.DEFAULT_IMAGE_GEN_RATIO;
    const styleActive = styleId !== window.APP_CONFIG.DEFAULT_IMAGE_GEN_STYLE;
    const qualityActive = qualityId !== window.APP_CONFIG.DEFAULT_IMAGE_GEN_QUALITY;

    if (els.composerImageGenBar) {
      const on = !!imageGenEnabled;
      els.composerImageGenBar.classList.toggle('hidden', !on);
      els.composerImageGenBar.setAttribute('aria-hidden', on ? 'false' : 'true');
    }
    if (els.imageGenRatioBtn) {
      const icon = els.imageGenRatioBtn.querySelector('.ratio-icon');
      if (icon) icon.setAttribute('data-ratio', ratioId);
    }
    setImageGenOptionPicked('ratio', ratioActive, { ratioId });
    setImageGenOptionPicked('style', styleActive, { styleId });
    setImageGenOptionPicked('quality', qualityActive, { qualityId });
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
    if (els.imageGenQualityOptions) {
      els.imageGenQualityOptions.querySelectorAll('.composer-dropdown-option').forEach((btn) => {
        const selected = btn.dataset.value === qualityId;
        btn.classList.toggle('is-selected', selected);
        btn.setAttribute('aria-selected', selected ? 'true' : 'false');
      });
    }
    if (referenceImage !== undefined && els.imageGenRefBtn) {
      const hasRef = !!referenceImage;
      els.imageGenRefBtn.classList.toggle('is-active', hasRef);
      els.imageGenRefBtn.classList.toggle('has-thumb', hasRef);
      if (els.imageGenRefLabel) {
        els.imageGenRefLabel.textContent = hasRef
          ? truncate(referenceImage.name || t('referenceImage'), 18)
          : t('referenceImage');
      }
      if (els.imageGenRefThumb) {
        const src = hasRef ? safeImageSrc(referenceImage.dataUrl) : '';
        els.imageGenRefThumb.classList.toggle('hidden', !src);
        if (src) {
          els.imageGenRefThumb.src = src;
          els.imageGenRefThumb.alt = referenceImage.name || t('referenceImage');
        } else {
          els.imageGenRefThumb.removeAttribute('src');
        }
      }
      if (els.imageGenRefClear) els.imageGenRefClear.classList.toggle('hidden', !hasRef);
    }
    if (!imageGenEnabled) {
      closeImageGenMenus();
      setImageGenOptionPicked('ratio', false);
      setImageGenOptionPicked('style', false);
      setImageGenOptionPicked('quality', false);
    }
  };

  const setStreamingToolBadge = (article, className, html, show) => {
    if (!article) return;
    let badge = article.querySelector('.' + className);
    if (show) {
      if (badge) return;
      badge = document.createElement('div');
      badge.className = 'streaming-tool-badge ' + className;
      badge.innerHTML = html;
      const content = article.querySelector('.content');
      if (content) content.before(badge);
      else article.querySelector('.body')?.prepend(badge);
    } else if (badge) {
      badge.remove();
    }
  };

  const setStreamingSearchStatus = (article, status) => {
    const active = status === 'searching' || status === 'fetching';
    const label = status === 'fetching' ? t('fetchingWeb') : t('searchingWeb');
    const icon = status === 'fetching' ? 'fa-link' : 'fa-globe';
    setStreamingToolBadge(
      article,
      'streaming-search-badge',
      '<i class="fa-solid ' + icon + '" aria-hidden="true"></i> <span class="streaming-tool-shimmer">' + label + '</span>',
      active
    );
  };

  const setStreamingShellStatus = (article, status) => {
    if (!article) return;
    const active = status === 'running' || status === 'active';
    const className = 'streaming-shell-badge';
    const label = status === 'running' ? t('runningShell') : t('shellPending');
    const html = '<i class="fa-solid fa-terminal" aria-hidden="true"></i> <span class="streaming-tool-shimmer">' + label + '</span>';
    let badge = article.querySelector('.' + className);
    if (!active) {
      if (badge) badge.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'streaming-tool-badge ' + className;
      const content = article.querySelector('.content');
      if (content) content.before(badge);
      else article.querySelector('.body')?.prepend(badge);
    }
    badge.innerHTML = html;
  };

  const setStreamingImageStatus = (article, status) => {
    setStreamingToolBadge(
      article,
      'streaming-image-badge',
      '<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> ' + t('generatingImage'),
      status === 'generating'
    );
  };

  const generatedImagesHTML = (images) => {
    if (!images || !images.length) return '';
    return '<div class="message-images message-generated-images">' + images.map((img, i) => {
      if (!img?.dataUrl) return '';
      const src = imageSrcAttr(img.dataUrl);
      if (!src) return '';
      const alt = escapeHTML(img.name || t('aiImage', { n: i + 1 }));
      return '<div class="message-image-wrap message-generated-image-wrap">'
        + '<img class="message-preview-image" src="' + src + '" alt="' + alt + '" loading="lazy" title="' + escapeHTML(t('viewImage')) + '" />'
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

  const groundingHostLabel = (uri) => {
    try {
      return new URL(uri).hostname.replace(/^www\./i, '');
    } catch {
      return '';
    }
  };

  const parseGroundingMeta = (meta) => {
    const { links, queries } = collectGroundingLinks(meta);
    const chunks = [];
    for (const link of links) {
      const uri = safeHref(link.uri);
      if (!uri || !/^https?:/i.test(uri)) continue;
      chunks.push({ uri, title: link.title || uri });
    }
    return { chunks, queries };
  };

  const groundingFaviconSrc = (host) => {
    if (!host) return '';
    return 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(host) + '&sz=64';
  };

  const groundingFaviconHTML = (host) => {
    if (!host) {
      return '<span class="source-favicon source-favicon-fallback" aria-hidden="true"><i class="fa-solid fa-globe"></i></span>';
    }
    return '<img class="source-favicon" src="' + escapeHTML(groundingFaviconSrc(host)) + '" alt="" width="18" height="18" loading="lazy" decoding="async" referrerpolicy="no-referrer">';
  };

  const uniqueGroundingHosts = (chunks, max = 4) => {
    const hosts = [];
    const seen = new Set();
    for (const chunk of chunks || []) {
      const host = groundingHostLabel(chunk.uri);
      if (!host || seen.has(host)) continue;
      seen.add(host);
      hosts.push(host);
      if (hosts.length >= max) break;
    }
    return hosts;
  };

  const bindFaviconFallbacks = (root) => {
    if (!root) return;
    root.querySelectorAll('img.source-favicon').forEach((img) => {
      if (img.dataset.faviconBound) return;
      img.dataset.faviconBound = '1';
      const fail = () => {
        const span = document.createElement('span');
        span.className = 'source-favicon source-favicon-fallback';
        span.setAttribute('aria-hidden', 'true');
        span.innerHTML = '<i class="fa-solid fa-globe"></i>';
        img.replaceWith(span);
      };
      img.addEventListener('error', fail, { once: true });
      if (img.complete && img.naturalWidth === 0) fail();
    });
  };

  const groundingExportListHTML = (chunks, queries) => {
    let html = '<div class="message-grounding-export">';
    html += '<div class="message-grounding-header">';
    html += '<i class="fa-solid fa-globe" aria-hidden="true"></i>';
    html += '<span class="message-grounding-title">' + escapeHTML(t('sources')) + '</span>';
    if (chunks.length) {
      html += '<span class="message-grounding-count">' + escapeHTML(String(chunks.length)) + '</span>';
    }
    html += '</div>';
    if (queries.length) {
      html += '<p class="message-grounding-queries">' + escapeHTML(t('sourcesQuery', { q: queries.join(' · ') })) + '</p>';
    }
    if (chunks.length) {
      html += '<ul class="message-grounding-sources">';
      chunks.forEach((chunk) => {
        const host = groundingHostLabel(chunk.uri);
        html += '<li><a href="' + escapeHTML(chunk.uri) + '" target="_blank" rel="noopener noreferrer">'
          + escapeHTML(chunk.title) + '</a>';
        if (host && host !== chunk.title) {
          html += '<span class="message-grounding-host">' + escapeHTML(host) + '</span>';
        }
        html += '</li>';
      });
      html += '</ul>';
    }
    html += '</div>';
    return html;
  };

  const groundingHTML = (meta) => {
    const { chunks, queries } = parseGroundingMeta(meta);
    if (!chunks.length && !queries.length) return '';
    const hosts = uniqueGroundingHosts(chunks);
    const payload = JSON.stringify({ chunks, queries }).replace(/</g, '\\u003c');
    let html = '<section class="message-grounding" aria-label="' + escapeHTML(t('sources')) + '">';
    html += '<button type="button" class="message-grounding-btn" data-open-sources aria-expanded="false" aria-controls="markdownPreviewPanel" title="'
      + escapeHTML(t('sources')) + '">';
    if (hosts.length) {
      html += '<span class="message-grounding-favicons" aria-hidden="true">';
      hosts.forEach((host) => { html += groundingFaviconHTML(host); });
      html += '</span>';
    } else {
      html += '<i class="fa-solid fa-globe" aria-hidden="true"></i>';
    }
    html += '<span class="message-grounding-title">' + escapeHTML(t('sources')) + '</span>';
    if (chunks.length) {
      html += '<span class="message-grounding-count">' + escapeHTML(String(chunks.length)) + '</span>';
    }
    html += '<i class="fa-solid fa-chevron-right message-grounding-chevron" aria-hidden="true"></i>';
    html += '</button>';
    html += '<template class="message-grounding-json">' + payload + '</template>';
    html += groundingExportListHTML(chunks, queries);
    html += '</section>';
    return html;
  };

  const slidesDownloadHTML = (m) => {
    if (!m.slidesData?.slides?.length) return '';
    const title = escapeHTML(m.slidesData.title || t('slidesDefaultTitle'));
    const count = m.slidesData.slides.length;
    const filename = escapeHTML(window.PptxExport?.buildFilename?.(m.slidesData) || 'presentation.pptx');
    return '<div class="slides-download-card">'
      + '<div class="slides-download-info">'
      + '<span class="slides-download-icon" aria-hidden="true"><i class="fa-solid fa-file-powerpoint"></i></span>'
      + '<div class="slides-download-text">'
      + '<p class="slides-download-title">' + title + '</p>'
      + '<p class="slides-download-meta">' + escapeHTML(t('slidesCount', { n: count })) + ' · ' + filename + '</p>'
      + '</div></div>'
      + '<button type="button" class="btn btn-primary btn-sm slides-download-btn" data-download-slides title="' + escapeHTML(t('slidesDownloadBtn')) + '">'
      + '<i class="fa-solid fa-download" aria-hidden="true"></i> '
      + escapeHTML(t('slidesDownloadBtn'))
      + '</button></div>';
  };

  const excelDownloadHTML = (m) => {
    if (!m.excelData?.sheets?.length) return '';
    const title = escapeHTML(m.excelData.title || t('excelDefaultTitle'));
    const filename = escapeHTML(window.XlsxExport?.buildFilename?.(m.excelData) || 'spreadsheet.xlsx');
    const meta = escapeHTML(t('excelCount', {
      sheets: m.excelData.sheetCount,
      rows: m.excelData.totalRows,
    }));
    return '<div class="excel-download-card">'
      + '<div class="excel-download-info">'
      + '<span class="excel-download-icon" aria-hidden="true"><i class="fa-solid fa-file-excel"></i></span>'
      + '<div class="excel-download-text">'
      + '<p class="excel-download-title">' + title + '</p>'
      + '<p class="excel-download-meta">' + meta + ' · ' + filename + '</p>'
      + '</div></div>'
      + '<button type="button" class="btn btn-primary btn-sm excel-download-btn" data-download-excel title="' + escapeHTML(t('excelDownloadBtn')) + '">'
      + '<i class="fa-solid fa-download" aria-hidden="true"></i> '
      + escapeHTML(t('excelDownloadBtn'))
      + '</button></div>';
  };

  const documentDownloadHTML = (m) => {
    if (!m.documentData?.blocks?.length) return '';
    const title = escapeHTML(m.documentData.title || t('documentDefaultTitle'));
    const filename = escapeHTML(window.DocxCreate?.buildFilename?.(m.documentData) || 'document.docx');
    const meta = escapeHTML(t('documentCount', { n: m.documentData.blockCount }));
    return '<div class="document-download-card">'
      + '<div class="document-download-info">'
      + '<span class="document-download-icon" aria-hidden="true"><i class="fa-solid fa-file-word"></i></span>'
      + '<div class="document-download-text">'
      + '<p class="document-download-title">' + title + '</p>'
      + '<p class="document-download-meta">' + meta + ' · ' + filename + '</p>'
      + '</div></div>'
      + '<button type="button" class="btn btn-primary btn-sm document-download-btn" data-download-document title="' + escapeHTML(t('documentDownloadBtn')) + '">'
      + '<i class="fa-solid fa-download" aria-hidden="true"></i> '
      + escapeHTML(t('documentDownloadBtn'))
      + '</button></div>';
  };

  const pdfDownloadHTML = (m) => {
    if (!m.pdfData?.blocks?.length) return '';
    const title = escapeHTML(m.pdfData.title || t('pdfDefaultTitle'));
    const filename = escapeHTML(window.PdfCreate?.buildFilename?.(m.pdfData) || 'document.pdf');
    const meta = escapeHTML(t('pdfCount', { n: m.pdfData.blockCount }));
    return '<div class="pdf-download-card">'
      + '<div class="pdf-download-info">'
      + '<span class="pdf-download-icon" aria-hidden="true"><i class="fa-solid fa-file-pdf"></i></span>'
      + '<div class="pdf-download-text">'
      + '<p class="pdf-download-title">' + title + '</p>'
      + '<p class="pdf-download-meta">' + meta + ' · ' + filename + '</p>'
      + '</div></div>'
      + '<button type="button" class="btn btn-primary btn-sm pdf-download-btn" data-download-pdf title="' + escapeHTML(t('pdfDownloadBtn')) + '">'
      + '<i class="fa-solid fa-download" aria-hidden="true"></i> '
      + escapeHTML(t('pdfDownloadBtn'))
      + '</button></div>';
  };

  const messageModelLabelHTML = (m) => {
    if (!m || m.role !== 'assistant') return '';
    const modelId = window.Conversations.getResponseModel(m);
    if (!modelId) return '';
    const model = window.APP_CONFIG.getModel(modelId);
    const label = model ? window.APP_CONFIG.getModelDisplayLabel(model) : modelId;
    const providerId = model?.provider || window.APP_CONFIG.getModelProvider(modelId) || '';
    const parts = t('responseModelLabel', { model: '\u0001' }).split('\u0001');
    const before = (parts[0] || '').trim();
    const after = (parts[1] || '').trim();
    const kicker = (text) => text
      ? '<span class="message-model-kicker">' + escapeHTML(text) + '</span>'
      : '';
    return '<div class="message-model-label" data-provider="' + escapeHTML(providerId) + '" title="' + escapeHTML(t('responseModelLabel', { model: label })) + '">'
      + kicker(before)
      + '<span class="message-model-name">' + escapeHTML(label) + '</span>'
      + kicker(after)
      + '</div>';
  };

  const syncMessageModelLabel = (article, m) => {
    if (!article) return;
    const html = messageModelLabelHTML(m);
    let labelEl = article.querySelector('.message-model-label');
    if (!html) {
      labelEl?.remove();
      return;
    }
    if (labelEl) {
      labelEl.outerHTML = html;
      return;
    }
    const toolbar = article.querySelector('.toolbar');
    if (!toolbar) return;
    toolbar.insertAdjacentHTML('beforebegin', html);
  };

  const contextSummaryBodyHTML = (m) => {
    return '<div class="context-summary-badge"><i class="fa-solid fa-compress" aria-hidden="true"></i> '
      + escapeHTML(t('compressSummaryBadge')) + '</div>'
      + '<div class="context-summary-body">' + window.Markdown.render(m.content || '') + '</div>';
  };

  const assistantContentHTML = (m) => {
    if (m.contextSummary) return contextSummaryBodyHTML(m);
    const text = window.Conversations.getAssistantContent(m);
    return reasoningHTML(m.reasoningContent)
      + window.Markdown.render(text)
      + generatedImagesHTML(m.generatedImages)
      + slidesDownloadHTML(m)
      + excelDownloadHTML(m)
      + documentDownloadHTML(m)
      + pdfDownloadHTML(m)
      + groundingHTML(m.groundingMetadata);
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
    const selectedModel = models.find((m) => m.id === selected) || models[0];
    if (els.modelSelectBtnLabel) {
      els.modelSelectBtnLabel.textContent = selectedModel
        ? window.APP_CONFIG.getModelDisplayLabel(selectedModel)
        : '';
    }
    if (els.modelSelectMenu) {
      els.modelSelectMenu.innerHTML = models.map((m) =>
        '<button type="button" class="header-model-option' + (m.id === selected ? ' is-selected' : '') + '" role="option" data-model="'
        + escapeHTML(m.id) + '" aria-selected="' + (m.id === selected ? 'true' : 'false') + '">'
        + '<span>' + escapeHTML(window.APP_CONFIG.getModelDisplayLabel(m)) + '</span>'
        + '<i class="fa-solid fa-check header-provider-check" aria-hidden="true"></i>'
        + '</button>'
      ).join('');
    }
    return selected;
  };

  const closeEffortMenu = () => {
    if (!els.effortSelectMenu) return;
    els.effortSelectMenu.classList.add('hidden');
    if (els.effortSelectBtn) els.effortSelectBtn.setAttribute('aria-expanded', 'false');
    els.effortSelectBtn?.closest('.header-selects')?.classList.remove('is-effort-open');
  };

  const toggleEffortMenu = () => {
    if (!els.effortSelectMenu || !els.effortSelectBtn || els.effortSelectBtn.disabled) return;
    closeProviderMenu();
    closeModelMenu();
    closePromptModeMenu();
    const open = els.effortSelectMenu.classList.contains('hidden');
    els.effortSelectMenu.classList.toggle('hidden', !open);
    els.effortSelectBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    els.effortSelectBtn.closest('.header-selects')?.classList.toggle('is-effort-open', open);
  };

  const closePromptModeMenu = () => {
    if (!els.systemPromptModeMenu) return;
    els.systemPromptModeMenu.classList.add('hidden');
    if (els.systemPromptModeBtn) els.systemPromptModeBtn.setAttribute('aria-expanded', 'false');
    els.systemPromptModeBtn?.closest('.header-selects')?.classList.remove('is-prompt-open');
  };

  const togglePromptModeMenu = () => {
    if (!els.systemPromptModeMenu || !els.systemPromptModeBtn) return;
    closeProviderMenu();
    closeModelMenu();
    closeEffortMenu();
    const open = els.systemPromptModeMenu.classList.contains('hidden');
    els.systemPromptModeMenu.classList.toggle('hidden', !open);
    els.systemPromptModeBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    els.systemPromptModeBtn.closest('.header-selects')?.classList.toggle('is-prompt-open', open);
    if (open) {
      els.systemPromptModeMenu.querySelector('.header-model-option.is-selected')?.scrollIntoView({ block: 'nearest' });
    }
  };

  const closeModelMenu = () => {
    if (!els.modelSelectMenu) return;
    els.modelSelectMenu.classList.add('hidden');
    if (els.modelSelectBtn) els.modelSelectBtn.setAttribute('aria-expanded', 'false');
    els.modelSelectBtn?.closest('.header-selects')?.classList.remove('is-model-open');
  };

  const toggleModelMenu = () => {
    if (!els.modelSelectMenu || !els.modelSelectBtn) return;
    closeProviderMenu();
    closePromptModeMenu();
    closeEffortMenu();
    const open = els.modelSelectMenu.classList.contains('hidden');
    els.modelSelectMenu.classList.toggle('hidden', !open);
    els.modelSelectBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    els.modelSelectBtn.closest('.header-selects')?.classList.toggle('is-model-open', open);
    if (open) {
      const active = els.modelSelectMenu.querySelector('.header-model-option.is-selected');
      active?.scrollIntoView({ block: 'nearest' });
    }
  };

  const providerLogoHTML = (providerId) => window.APP_CONFIG.getProviderLogoHTML(providerId);

  const updateProviderPickerUI = (providerId) => {
    const p = window.APP_CONFIG.PROVIDERS.find((x) => x.id === providerId);
    const label = p?.label || providerId;
    if (els.providerSelectBtnIcon) els.providerSelectBtnIcon.innerHTML = providerLogoHTML(providerId);
    if (els.providerSelectBtnLabel) els.providerSelectBtnLabel.textContent = label;
    if (els.providerSelectBtn) els.providerSelectBtn.dataset.provider = providerId;
    els.providerSelectMenu?.querySelectorAll('.header-provider-option').forEach((opt) => {
      const selected = opt.dataset.provider === providerId;
      opt.classList.toggle('is-selected', selected);
      opt.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
  };

  const closeProviderMenu = () => {
    if (!els.providerSelectMenu) return;
    els.providerSelectMenu.classList.add('hidden');
    if (els.providerSelectBtn) els.providerSelectBtn.setAttribute('aria-expanded', 'false');
    els.providerSelectBtn?.closest('.header-selects')?.classList.remove('is-provider-open');
  };

  const isProviderMenuOpen = () => !!els.providerSelectMenu && !els.providerSelectMenu.classList.contains('hidden');

  const toggleProviderMenu = () => {
    if (!els.providerSelectMenu || !els.providerSelectBtn) return;
    closeHeaderDownloadMenu();
    closeModelMenu();
    closePromptModeMenu();
    closeEffortMenu();
    const open = els.providerSelectMenu.classList.contains('hidden');
    els.providerSelectMenu.classList.toggle('hidden', !open);
    els.providerSelectBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    els.providerSelectBtn.closest('.header-selects')?.classList.toggle('is-provider-open', open);
  };

  const syncProviderSelect = (providerId) => {
    if (!els.providerSelect) return;
    if (els.providerSelect.value !== providerId) {
      els.providerSelect.value = providerId;
    }
    updateProviderPickerUI(providerId);
  };

  const initProviderSelects = (currentModel) => {
    const { DEFAULT_MODEL } = window.APP_CONFIG;
    const modelId = currentModel || DEFAULT_MODEL;
    const providerId = window.APP_CONFIG.getModelProvider(modelId);
    const providers = window.APP_CONFIG.getProviders();

    if (els.providerSelect) {
      els.providerSelect.innerHTML = providers.map((p) =>
        '<option value="' + escapeHTML(p.id) + '"' + (p.id === providerId ? ' selected' : '') + '>'
        + escapeHTML(p.label) + '</option>'
      ).join('');
      els.providerSelect.value = providerId;
    }

    if (els.providerSelectMenu) {
      els.providerSelectMenu.innerHTML = providers.map((p) =>
        '<button type="button" class="header-provider-option" role="option" data-provider="'
        + escapeHTML(p.id) + '" aria-selected="' + (p.id === providerId ? 'true' : 'false') + '">'
        + providerLogoHTML(p.id)
        + '<span>' + escapeHTML(p.label) + '</span>'
        + '<i class="fa-solid fa-check header-provider-check" aria-hidden="true"></i>'
        + '</button>'
      ).join('');
    }

    updateProviderPickerUI(providerId);
    document.querySelectorAll('[data-provider-logo]').forEach((el) => {
      el.innerHTML = providerLogoHTML(el.dataset.providerLogo);
    });
    updateModelSelect(providerId, modelId);
  };

  const initModelSelect = (currentModel) => {
    initProviderSelects(currentModel);
  };

  const EFFORT_LABEL_KEYS = {
    none: 'effortNone',
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
    const wrap = els.effortSelectBtn?.closest('.header-effort-wrap');
    if (!levels.length || !window.APP_CONFIG.modelSupportsThinking(modelId)) {
      els.effortSelect.classList.add('hidden');
      els.effortSelect.disabled = false;
      wrap?.classList.add('hidden');
      closeEffortMenu();
      return;
    }
    els.effortSelect.classList.remove('hidden');
    wrap?.classList.remove('hidden');
    const t = window.I18n.t;
    const fallback = window.APP_CONFIG.modelUsesEffortLinkedThinking(modelId)
      ? 'high'
      : window.APP_CONFIG.getDefaultEffortForModel(modelId);
    const normalized = window.APP_CONFIG.normalizeEffortForModel(currentEffort, modelId);
    const selected = levels.includes(normalized) ? normalized : fallback;
    const labelFor = (lv) => t(EFFORT_LABEL_KEYS[lv] || lv);
    els.effortSelect.innerHTML = levels.map((lv) =>
      '<option value="' + lv + '"' + (lv === selected ? ' selected' : '') + '>'
      + escapeHTML(labelFor(lv)) + '</option>'
    ).join('');
    if (els.effortSelectBtnLabel) els.effortSelectBtnLabel.textContent = labelFor(selected);
    if (els.effortSelectMenu) {
      els.effortSelectMenu.innerHTML = levels.map((lv) =>
        '<button type="button" class="header-model-option' + (lv === selected ? ' is-selected' : '') + '" role="option" data-effort="'
        + lv + '" aria-selected="' + (lv === selected ? 'true' : 'false') + '"><span>'
        + escapeHTML(labelFor(lv)) + '</span><i class="fa-solid fa-check header-provider-check" aria-hidden="true"></i></button>'
      ).join('');
    }
    const alwaysEnabled = window.APP_CONFIG.modelEffortDropdownAlwaysEnabled(modelId);
    const active = alwaysEnabled || thinkingActive !== false;
    els.effortSelect.disabled = !active;
    els.effortSelect.classList.toggle('is-disabled', !active);
    if (els.effortSelectBtn) {
      els.effortSelectBtn.disabled = !active;
      els.effortSelectBtn.classList.toggle('is-disabled', !active);
    }
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
    return '<div class="message-images">' + images.map((img, i) => {
      const src = imageSrcAttr(img.dataUrl);
      if (!src) return '';
      return '<div class="message-image-wrap">'
      + '<img class="message-preview-image" src="' + src + '" alt="' + escapeHTML(img.name || t('image', { n: i + 1 })) + '" loading="lazy" title="' + escapeHTML(t('viewImage')) + '" />'
      + '</div>';
    }).join('') + '</div>';
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
        const qualityId = m.imageGen.quality;
        if (qualityId && qualityId !== 'auto') parts.push(t('qualityPrefix') + window.I18n.imageGenLabel('quality', qualityId).toLowerCase());
        text = '<p class="message-imagegen-prompt">' + escaped + '</p>'
          + '<p class="message-imagegen-label">' + escapeHTML(parts.join(' · ')) + '</p>';
      } else if (m.slides) {
        text = '<p class="message-slides-prompt">' + escaped + '</p>'
          + '<p class="message-slides-label"><i class="fa-solid fa-file-powerpoint" aria-hidden="true"></i> '
          + escapeHTML(t('slidesModeLabel')) + '</p>';
      } else if (m.excel) {
        text = '<p class="message-excel-prompt">' + escaped + '</p>'
          + '<p class="message-excel-label"><i class="fa-solid fa-file-excel" aria-hidden="true"></i> '
          + escapeHTML(t('excelModeLabel')) + '</p>';
      } else if (m.document) {
        text = '<p class="message-document-prompt">' + escaped + '</p>'
          + '<p class="message-document-label"><i class="fa-solid fa-file-word" aria-hidden="true"></i> '
          + escapeHTML(t('documentModeLabel')) + '</p>';
      } else if (m.contextSummary) {
        text = contextSummaryBodyHTML(m);
      } else {
        text = '<p>' + escaped + '</p>';
      }
    }
    return text + userImagesHTML(m.images) + userFilesHTML(m.files);
  };

  const THEME_META_COLORS = {
    claude: '#faf9f5',
    'claude-dark': '#262624'
  };
  const THEME_ICONS = {
    claude: '<i class="fa-solid fa-asterisk"></i>',
    'claude-dark': '<i class="fa-solid fa-moon"></i>'
  };
  const HIGHLIGHT_THEMES = {
    claude: 'github',
    'claude-dark': 'github-dark'
  };
  const LEGACY_DARK_THEMES = new Set(['dark', 'vs-dark', 'apple-dark', 'cyberpunk', 'nvidia', 'liquid-glass']);

  const updateHighlightTheme = (theme) => {
    const hl = HIGHLIGHT_THEMES[theme] || 'atom-one-dark';
    const link = document.getElementById('hljs-theme');
    if (!link) return;
    const next = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${hl}.min.css`;
    if (link.href !== next) link.href = next;
  };

  const normalizeTheme = (theme) => {
    const fallback = window.APP_CONFIG.DEFAULT_THEME;
    if (LEGACY_DARK_THEMES.has(theme)) return 'claude-dark';
    if (theme === 'apple' || theme === 'hello-kitty' || theme === 'light') return 'claude';
    return THEME_META_COLORS[theme] ? theme : fallback;
  };

  const syncSettingsThemeToggle = (theme) => {
    const resolved = normalizeTheme(theme);
    if (els.settingsThemeSelect) els.settingsThemeSelect.value = resolved;
    document.querySelectorAll('.settings-theme-btn').forEach((btn) => {
      const on = btn.dataset.themeValue === resolved;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  };

  const setTheme = (theme) => {
    const resolved = normalizeTheme(theme);
    document.documentElement.setAttribute('data-theme', resolved);
    const mc = document.querySelector('meta[name="theme-color"]');
    if (mc) mc.setAttribute('content', THEME_META_COLORS[resolved]);
    if (els.themeIcon) els.themeIcon.innerHTML = THEME_ICONS[resolved] || THEME_ICONS.claude;
    updateHighlightTheme(resolved);
    syncSettingsThemeToggle(resolved);
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
          const isBranchConvo = window.Conversations.isBranch(c);
          const branchMeta = isBranchConvo
            ? '<span class="conversation-branch-meta">' + escapeHTML(t('branchBadge')) + '</span>'
            : '';
          const iconClass = isBranchConvo ? 'fa-code-branch' : (c.kind === 'image' ? 'fa-image' : 'fa-message');
          const running = runningConversationIds.has(c.id);
          const runningLabel = escapeHTML(t('conversationGenerating'));
          const runningHTML = running
            ? '<span class="conversation-running" title="' + runningLabel + '" aria-label="' + runningLabel + '">'
              + '<span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>'
              + '</span>'
            : '';
          return `
          <li class="conversation-item ${c.id === currentId ? 'active' : ''}${isBranchConvo ? ' is-branch' : ''}${running ? ' is-running' : ''}" data-id="${c.id}">
            <span class="icon" aria-hidden="true"><i class="fa-solid ${iconClass}"></i></span>
            <span class="conversation-item-body">
              <span class="title" title="${escapeHTML(c.title)}">${highlightSearchText(c.title, q)}</span>
              ${branchMeta}
              ${snippetHTML}
            </span>
            ${runningHTML}
            <span class="actions">
              <button type="button" class="btn btn-icon" data-action="rename" title="${escapeHTML(t('rename'))}"><i class="fa-solid fa-pen"></i></button>
              <button type="button" class="btn btn-icon" data-action="delete" title="${escapeHTML(t('delete'))}"><i class="fa-solid fa-trash"></i></button>
            </span>
          </li>`;
        }).join('')
      : `<li class="conversation-empty" style="padding:12px 16px;color:var(--text-dim);font-size:13px;">${emptyMsg}</li>`;
    els.conversationList.innerHTML = html;
  };

  let runningConversationIds = new Set();

  const setRunningConversationIds = (ids) => {
    const next = new Set(ids || []);
    if (next.size === runningConversationIds.size) {
      let same = true;
      for (const id of next) {
        if (!runningConversationIds.has(id)) {
          same = false;
          break;
        }
      }
      if (same) return;
    }
    runningConversationIds = next;
    refreshConversationList();
  };

  const isConversationRunning = (id) => !!(id && runningConversationIds.has(id));

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

  const syncCompressContextBar = (convo) => {
    if (!els.compressContextBar) return;
    if (isShareViewMode() || exportSelectMode) {
      els.compressContextBar.classList.add('hidden');
      return;
    }
    const c = convo !== undefined ? convo : window.Conversations.getCurrent();
    const show = !!(c && window.ContextCompress?.shouldOfferCompress?.(c));
    els.compressContextBar.classList.toggle('hidden', !show);
    if (show && els.compressContextHint) {
      els.compressContextHint.textContent = t('compressContextHint', { n: c.messages.length });
    }
    if (els.compressContextBtn) {
      const id = c?.id;
      const busy = !!(id && (
        window.API?.isStreaming?.('chat:' + id)
        || window.API?.isStreaming?.('compress:' + id)
      ));
      els.compressContextBtn.disabled = busy;
    }
  };

  const buildCompareModelOptionsHTML = (selectedId, takenIds = []) => {
    const { MODELS } = window.APP_CONFIG;
    const taken = new Set(takenIds || []);
    return MODELS.filter((m) => !m.imageOnly).map((m) => {
      const selected = m.id === selectedId;
      const disabled = !selected && taken.has(m.id);
      return '<option value="' + escapeHTML(m.id) + '"'
        + (selected ? ' selected' : '')
        + (disabled ? ' disabled' : '')
        + '>'
        + escapeHTML(window.APP_CONFIG.getModelDisplayLabel(m))
        + '</option>';
    }).join('');
  };

  const COMPARE_SLOT_LABELS = ['A', 'B', 'C'];
  const COMPARE_SCROLL_NEAR_PX = 96;
  const compareStreamPending = new WeakMap();

  const getCompareProviderId = (modelId) => {
    const model = window.APP_CONFIG.getModel(modelId);
    return model?.provider || 'openai';
  };

  const syncCompareBar = (appState) => {
    if (!els.compareBar) return;
    if (isShareViewMode() || exportSelectMode) {
      els.compareBar.classList.add('hidden');
      return;
    }
    const enabled = !!appState?.compareEnabled;
    els.compareBar.classList.toggle('hidden', !enabled);
    if (!enabled) return;

    let models = window.ModelCompare.normalizeModelList(appState.compareModels);
    if (models.length < window.ModelCompare.COMPARE_MIN_MODELS) {
      models = window.ModelCompare.getDefaultModels(appState.currentModel);
    }

    if (els.compareBarHint) {
      els.compareBarHint.textContent = t('compareBarMode');
    }
    if (els.compareBarCount) {
      els.compareBarCount.textContent = String(models.length);
      els.compareBarCount.setAttribute('aria-label', t('compareBarHint', { n: models.length }));
    }
    if (els.compareAddModelBtn) {
      const canAdd = models.length < window.ModelCompare.COMPARE_MAX_MODELS;
      els.compareAddModelBtn.classList.toggle('hidden', !canAdd);
      els.compareAddModelBtn.title = t('compareAddModel');
      els.compareAddModelBtn.setAttribute('aria-label', t('compareAddModel'));
    }

    if (!els.compareModelPickers) return;
    const streaming = !!window.API?.isStreaming?.('compare');
    els.compareModelPickers.innerHTML = models.map((modelId, i) => {
      const canRemove = models.length > window.ModelCompare.COMPARE_MIN_MODELS;
      const providerId = getCompareProviderId(modelId);
      const slot = COMPARE_SLOT_LABELS[i] || String(i + 1);
      return '<div class="compare-model-chip" data-idx="' + i + '" data-provider="' + escapeHTML(providerId) + '">'
        + '<span class="compare-chip-slot" aria-hidden="true">' + slot + '</span>'
        + '<span class="compare-chip-dot" aria-hidden="true"></span>'
        + '<select class="compare-model-select" data-idx="' + i + '" aria-label="' + escapeHTML(t('compareModelSlot', { n: i + 1 })) + '"'
        + (streaming ? ' disabled' : '') + '>'
        + buildCompareModelOptionsHTML(modelId, models)
        + '</select>'
        + (canRemove
          ? '<button type="button" class="compare-model-remove" data-idx="' + i + '" title="' + escapeHTML(t('compareRemoveModel')) + '" aria-label="' + escapeHTML(t('compareRemoveModel')) + '"' + (streaming ? ' disabled' : '') + '>'
            + '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button>'
          : '')
        + '</div>';
    }).join('');
  };

  let compareOverlayModels = [];

  const getCompareProviderLabel = (providerId) => {
    return window.APP_CONFIG.PROVIDERS.find((p) => p.id === providerId)?.label || providerId;
  };

  const buildCompareColumnHTML = (modelId) => {
    const model = window.APP_CONFIG.getModel(modelId);
    const label = model ? window.APP_CONFIG.getModelDisplayLabel(model) : modelId;
    const providerId = getCompareProviderId(modelId);
    const providerLabel = getCompareProviderLabel(providerId);
    return '<article class="model-compare-col" data-model-id="' + escapeHTML(modelId) + '" data-provider="' + escapeHTML(providerId) + '" data-status="compareStatusStreaming" data-pickable="0">'
      + '<header class="model-compare-col-header">'
      + '<div class="model-compare-col-brand">'
      + '<span class="model-compare-col-dot" aria-hidden="true"></span>'
      + '<div class="model-compare-col-titles">'
      + '<span class="model-compare-col-title">' + escapeHTML(label) + '</span>'
      + '<span class="model-compare-col-provider">' + escapeHTML(providerLabel) + '</span>'
      + '</div>'
      + '</div>'
      + '<span class="model-compare-col-status is-streaming">'
      + '<span class="model-compare-status-dot" aria-hidden="true"></span>'
      + '<span class="model-compare-status-text">' + escapeHTML(t('compareStatusStreaming')) + '</span>'
      + '</span>'
      + '</header>'
      + '<div class="model-compare-col-error" role="alert"></div>'
      + '<div class="model-compare-col-body content"></div>'
      + '<footer class="model-compare-col-footer">'
      + '<button type="button" class="btn btn-primary model-compare-pick-btn" data-model-id="' + escapeHTML(modelId) + '" disabled>'
      + '<i class="fa-solid fa-check" aria-hidden="true"></i>'
      + '<span>' + escapeHTML(t('comparePick')) + '</span>'
      + '</button>'
      + '</footer>'
      + '</article>';
  };

  const openModelCompareOverlay = (question, modelIds) => {
    if (!els.modelCompareOverlay || !els.modelCompareColumns) return;
    compareOverlayModels = modelIds.slice();
    els.modelCompareOverlay.classList.remove('hidden');
    document.body.classList.add('model-compare-open');

    if (els.modelCompareQuestion && els.modelCompareQuestionText) {
      const q = (question || '').trim();
      els.modelCompareQuestion.classList.toggle('hidden', !q);
      els.modelCompareQuestionText.textContent = q;
    }

    els.modelCompareColumns.style.setProperty('--compare-cols', String(modelIds.length));
    els.modelCompareColumns.innerHTML = modelIds.map((id) => buildCompareColumnHTML(id)).join('');
  };

  const closeModelCompareOverlay = () => {
    if (!els.modelCompareOverlay) return;
    els.modelCompareOverlay.classList.add('hidden');
    document.body.classList.remove('model-compare-open');
    if (els.modelCompareColumns) els.modelCompareColumns.innerHTML = '';
    compareOverlayModels = [];
    if (currentSourcesPreview?.key?.startsWith('compare:')) closeMarkdownPreview();
  };

  const isModelCompareOpen = () => {
    return !!(els.modelCompareOverlay && !els.modelCompareOverlay.classList.contains('hidden'));
  };

  const getModelCompareColumns = () => {
    if (!els.modelCompareColumns) return [];
    return Array.from(els.modelCompareColumns.querySelectorAll('.model-compare-col'));
  };

  const setCompareColumnPickable = (columnEl, pickable) => {
    if (!columnEl) return;
    columnEl.dataset.pickable = pickable ? '1' : '0';
  };

  const scrollCompareBodyIfNear = (contentEl, { force = false } = {}) => {
    if (!contentEl) return;
    const dist = contentEl.scrollHeight - contentEl.scrollTop - contentEl.clientHeight;
    if (force || dist < COMPARE_SCROLL_NEAR_PX) {
      contentEl.scrollTop = contentEl.scrollHeight;
    }
  };

  const flushCompareColumnContent = (contentEl) => {
    const pending = compareStreamPending.get(contentEl);
    if (!pending) return;
    compareStreamPending.delete(contentEl);
    if (pending.raf) cancelAnimationFrame(pending.raf);
    const stick = pending.stickToBottom;
    contentEl.innerHTML = renderStreamingAssistantHTML(
      pending.text, pending.images, pending.reasoning, {
        reasoningOpen: pending.reasoningOpen,
        groundingMetadata: pending.groundingMetadata,
      }
    );
    polishContent(contentEl, { streaming: true });
    if (stick) scrollCompareBodyIfNear(contentEl, { force: true });
    else scrollCompareBodyIfNear(contentEl);
  };

  const updateCompareColumnContent = (contentEl, text, images, reasoning, { reasoningOpen = false, groundingMetadata = null } = {}) => {
    if (!contentEl) return;
    const dist = contentEl.scrollHeight - contentEl.scrollTop - contentEl.clientHeight;
    const stickToBottom = dist < COMPARE_SCROLL_NEAR_PX;
    let pending = compareStreamPending.get(contentEl);
    if (!pending) {
      pending = { raf: 0 };
      compareStreamPending.set(contentEl, pending);
    }
    pending.text = text;
    pending.images = images;
    pending.reasoning = reasoning;
    pending.reasoningOpen = reasoningOpen;
    pending.groundingMetadata = groundingMetadata;
    pending.stickToBottom = stickToBottom;
    if (pending.raf) return;
    pending.raf = requestAnimationFrame(() => {
      pending.raf = 0;
      flushCompareColumnContent(contentEl);
    });
  };

  const finalizeCompareColumn = (columnEl, text, { generatedImages, reasoningContent, groundingMetadata } = {}) => {
    if (!columnEl) return;
    const contentEl = columnEl.querySelector('.model-compare-col-body');
    if (contentEl) {
      const pending = compareStreamPending.get(contentEl);
      if (pending?.raf) {
        cancelAnimationFrame(pending.raf);
        compareStreamPending.delete(contentEl);
      }
      const stick = contentEl.scrollHeight - contentEl.scrollTop - contentEl.clientHeight < COMPARE_SCROLL_NEAR_PX;
      contentEl.innerHTML = renderStreamingAssistantHTML(
        text, generatedImages, reasoningContent, {
          reasoningOpen: false,
          groundingMetadata
        }
      );
      polishContent(contentEl, { renderMermaid: true });
      if (stick) scrollCompareBodyIfNear(contentEl, { force: true });
    }
    setCompareColumnPickable(columnEl, !!(String(text || '').trim() || (generatedImages && generatedImages.length)));
  };

  const syncComparePickButtons = () => {
    getModelCompareColumns().forEach((col) => {
      const btn = col.querySelector('.model-compare-pick-btn');
      const pickable = col.dataset.pickable === '1';
      const streaming = col.classList.contains('is-streaming');
      if (btn) btn.disabled = streaming || !pickable;
    });
  };

  const markCompareColumnPicked = (modelId) => {
    getModelCompareColumns().forEach((col) => {
      const picked = col.dataset.modelId === modelId;
      col.classList.toggle('is-picked', picked);
      const statusEl = col.querySelector('.model-compare-col-status');
      const statusText = col.querySelector('.model-compare-status-text');
      if (picked && statusEl && statusText) {
        statusEl.className = 'model-compare-col-status is-picked';
        statusText.textContent = t('compareStatusPicked');
      }
    });
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
    syncWorkspaceNav();
    const image = window.APP_CONFIG.isImageWorkspace();
    const inWorkspace = (c) => (c.kind === 'image') === image;
    const id = currentId !== undefined
      ? currentId
      : (window.Conversations.getCurrent()?.id || null);
    const q = conversationSearchQuery.trim();
    if (!q) {
      renderConversationList(window.Conversations.getAll().filter(inWorkspace), id, '');
      return;
    }
    const results = window.Conversations.searchConversations(q).filter((r) => inWorkspace(r.convo));
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
    syncCompressContextBar(null);
    const image = window.APP_CONFIG.isImageWorkspace();
    const title = image ? t('helloImage') : t('hello');
    const sub = image ? t('emptySubImage') : t('emptySub');
    els.messages.innerHTML = '<div class="messages-empty"><div class="brand-avatar brand-avatar-lg" aria-hidden="true">V</div><h2>' + escapeHTML(title) + '</h2><p class="messages-empty-sub">' + escapeHTML(sub) + '</p></div>';
    updateMessageScrollRail();
    refreshChatFind({ keepIndex: false, scroll: false });
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
    syncCompressContextBar(convo);
    scrollToBottom();
    updateMessageScrollRail();
    refreshChatFind({ keepIndex: true, scroll: chatFindOpen });
  };

  const messageEdgeScrollBtnsHTML = () => (
    '<button type="button" class="msg-edge-scroll msg-edge-scroll-bottom" data-action="scroll-msg-bottom" title="' + escapeHTML(t('scrollMsgBottom')) + '" aria-label="' + escapeHTML(t('scrollMsgBottom')) + '">'
      + '<i class="fa-solid fa-chevron-down"></i></button>'
    + '<button type="button" class="msg-edge-scroll msg-edge-scroll-top" data-action="scroll-msg-top" title="' + escapeHTML(t('scrollMsgTop')) + '" aria-label="' + escapeHTML(t('scrollMsgTop')) + '">'
      + '<i class="fa-solid fa-chevron-up"></i></button>'
  );

  const branchToolbarBtnHTML = () => {
    if (isShareViewMode()) return '';
    return '<button type="button" class="tb-btn" data-action="branch" title="' + escapeHTML(t('branch')) + '" aria-label="' + escapeHTML(t('branch')) + '"><i class="fa-solid fa-code-branch"></i></button>';
  };

  const assistantToolbarHTML = (m, idx) => {
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
      + '<i class="fa-solid fa-print" aria-hidden="true"></i><span>' + escapeHTML(t('exportFormatPdf')) + '</span></button>'
      + '<button type="button" class="msg-export-option" data-export-format="docx" role="menuitem">'
      + '<i class="fa-solid fa-file-word" aria-hidden="true"></i><span>' + escapeHTML(t('exportFormatDocs')) + '</span></button>'
      + imageExportOption
      + '</div></div>';

    const convo = window.Conversations.getCurrent();
    const isLast = Number.isInteger(idx) && convo && idx === convo.messages.length - 1;
    const hasText = !!(window.Conversations.getAssistantContent(m) || '').trim();
    const continueBtn = !isShareViewMode() && m.truncated && isLast && hasText
      ? '<button type="button" class="tb-btn tb-btn-continue" data-action="continue" title="' + escapeHTML(t('continueGenerationTitle')) + '" aria-label="' + escapeHTML(t('continueGeneration')) + '">'
        + '<i class="fa-solid fa-forward"></i><span>' + escapeHTML(t('continueGeneration')) + '</span></button>'
      : '';

    return '<button type="button" class="tb-btn" data-action="speak" title="' + escapeHTML(t('speak')) + '" aria-label="' + escapeHTML(t('speak')) + '"><i class="fa-solid fa-volume-high"></i></button>'
      + '<button type="button" class="tb-btn" data-action="copy" title="' + escapeHTML(t('copy')) + '"><i class="fa-solid fa-copy"></i></button>'
      + '<button type="button" class="tb-btn" data-action="retry" title="' + escapeHTML(t('retry')) + '"><i class="fa-solid fa-rotate-right"></i></button>'
      + continueBtn
      + branchToolbarBtnHTML()
      + exportMenu
      + pager;
  };

  const messageHTML = (m, idx) => {
    const isUser = m.role === 'user';
    const isSummary = !!m.contextSummary;
    const avatar = isUser
      ? '<div class="avatar user-av"><i class="fa-solid fa-user"></i></div>'
      : '<div class="avatar assistant-av">V</div>';
    const body = isSummary
      ? '<div class="content">' + contextSummaryBodyHTML(m) + '</div>'
      : isUser
        ? '<div class="content">' + userContentHTML(m) + '</div>'
        : '<div class="content">' + assistantContentHTML(m) + '</div>';
    const idxAttr = idx !== undefined ? ' data-idx="' + idx + '"' : '';
    const summaryClass = isSummary ? ' context-summary' : '';
    const editBtn = isUser && !isSummary
      ? '<button type="button" class="tb-btn" data-action="edit" title="' + escapeHTML(t('edit')) + '"><i class="fa-solid fa-pen-to-square"></i></button>'
      : '';
    const delBtn = isUser
      ? '<button type="button" class="tb-btn" data-action="delete-msg" title="' + escapeHTML(t('delete')) + '"><i class="fa-solid fa-trash"></i></button>'
      : '';
    const toolbar = isSummary
      ? '<button type="button" class="tb-btn" data-action="copy" title="' + escapeHTML(t('copy')) + '"><i class="fa-solid fa-copy"></i></button>'
      : isUser
        ? editBtn
          + branchToolbarBtnHTML()
          + '<button type="button" class="tb-btn" data-action="copy" title="' + escapeHTML(t('copy')) + '"><i class="fa-solid fa-copy"></i></button>'
          + delBtn
        : assistantToolbarHTML(m, idx);
    return '<article class="message ' + m.role + summaryClass + '" data-role="' + m.role + '"' + idxAttr + '>'
      + avatar
      + '<div class="body">'
      + messageEdgeScrollBtnsHTML()
      + body
      + (isUser || isSummary ? '' : messageModelLabelHTML(m))
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
    refreshChatFind({ keepIndex: true, scroll: false });
    return article;
  };

  const appendStreamingMessage = (idx, modelId) => {
    resetStreamingCodeScroll();
    const empty = els.messages.querySelector('.messages-empty');
    if (empty) empty.remove();
    const draft = {
      role: 'assistant',
      content: '',
      variants: [''],
      variantModels: modelId ? [modelId] : [],
      variantIndex: 0,
      responseModel: modelId || '',
      ts: Date.now()
    };
    const article = appendMessage(draft, idx);
    if (modelId) syncMessageModelLabel(article, draft);
    article.classList.add('streaming');
    const content = article.querySelector('.content');
    return { article, content };
  };

  const setAssistantToolbar = (article, m) => {
    const toolbar = article?.querySelector('.toolbar');
    if (!toolbar || m?.role !== 'assistant') return;
    const idx = parseInt(article.dataset.idx, 10);
    toolbar.innerHTML = assistantToolbarHTML(m, Number.isNaN(idx) ? undefined : idx);
  };

  const refreshUserMessage = (idx, m) => {
    const article = els.messages?.querySelector('.message.user[data-idx="' + idx + '"]');
    const content = article?.querySelector('.content');
    if (!content || !m) return;
    content.innerHTML = userContentHTML(m);
  };

  const updateAssistantMessage = (idx, m) => {
    const article = els.messages.querySelector('[data-idx="' + idx + '"]');
    if (!article) return;
    const content = article.querySelector('.content');
    if (content) {
      content.innerHTML = assistantContentHTML(m);
      polishContent(content, { renderMermaid: true });
    }
    syncMessageModelLabel(article, m);
    setAssistantToolbar(article, m);
    refreshChatFind({ keepIndex: true, scroll: false });
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
    refreshChatFind({ keepIndex: true, scroll: false });
    return { article, content };
  };

  const beginContinueStreaming = (idx) => {
    resetStreamingCodeScroll();
    els.messages.querySelectorAll('.message').forEach((article) => {
      const i = parseInt(article.dataset.idx, 10);
      if (!isNaN(i) && i > idx) article.remove();
    });

    const article = els.messages.querySelector('[data-idx="' + idx + '"]');
    if (!article) return null;

    article.classList.add('streaming');
    const content = article.querySelector('.content');
    updateMessageScrollRail();
    refreshChatFind({ keepIndex: true, scroll: false });
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
      + window.Markdown.render(text || '')
      + generatedImagesHTML(images)
      + groundingHTML(groundingMetadata);
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
        pruneDisconnectedChatFindMarks();

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
      content.innerHTML = message
        ? assistantContentHTML(message)
        : renderStreamingAssistantHTML(
          text, message?.generatedImages, message?.reasoningContent, {
            reasoningOpen: false,
            groundingMetadata: message?.groundingMetadata
          }
        );
      polishContent(content, { renderMermaid: true });
    }
    if (message) syncMessageModelLabel(article, message);
    if (message) setAssistantToolbar(article, message);
    scrollToBottomIfNear();
    updateMessageScrollRail();
    refreshChatFind({ keepIndex: true, scroll: false });
  };

  const rerenderMermaid = () => {
    window.Markdown.updateMermaidTheme();
    window.Markdown.resetMermaidBlocks(els.messages);
    window.Markdown.renderMermaid(els.messages, { skipIfStreaming: false });
    if (els.markdownPreviewPanel?.classList.contains('is-open')
      && els.markdownPreviewContent
      && !els.markdownPreviewContent.classList.contains('is-artifact-preview')) {
      window.Markdown.resetMermaidBlocks(els.markdownPreviewContent);
      window.Markdown.renderMermaid(els.markdownPreviewContent, { skipIfStreaming: false });
    }
  };

  const enterEditMode = (article) => {
    if (article.classList.contains('editing')) return;
    const contentEl = article.querySelector('.content');
    const toolbarEl = article.querySelector('.toolbar');
    unwrapFindMarksIn(contentEl);
    pruneDisconnectedChatFindMarks();
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
    if (chatFindOpen) refreshChatFind({ keepIndex: true, scroll: false });
  };

  const exitEditMode = (article) => {
    if (!article.classList.contains('editing')) return;
    const saved = article._editOriginal;
    if (saved) {
      const contentEl = article.querySelector('.content');
      contentEl.innerHTML = saved.content;
      unwrapFindMarksIn(contentEl);
      article.querySelector('.toolbar').innerHTML = saved.toolbar;
    }
    article.classList.remove('editing');
    delete article._editOriginal;
    if (chatFindOpen) refreshChatFind({ keepIndex: true, scroll: false });
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
    bindFaviconFallbacks(root);
    if (!streaming) rehighlight(root);
    if (!streaming) window.Markdown.typesetMath(root);
    if (renderMermaid) window.Markdown.renderMermaid(root);
    syncOpenSourcesPreview(root);
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
          securityLevel: 'strict',
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
    syncMessageScrollRailFindMarks();
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
      if (isNaN(idx) || !users[idx]) return;
      if (jumpChatFindToMessageBlock(users[idx])) return;
      scrollToUserMessage(users[idx]);
    });

    els.messageScrollRailPrev?.addEventListener('click', () => scrollToAdjacentUserMessage(-1));
    els.messageScrollRailNext?.addEventListener('click', () => scrollToAdjacentUserMessage(1));

    els.messageScrollRail?.addEventListener('mouseleave', (e) => {
      if (e.relatedTarget && els.messageScrollRail.contains(e.relatedTarget)) return;
      hideMessageScrollRailTooltip();
    });
  };

  const CHAT_FIND_MAX = 400;
  const CHAT_FIND_SKIP = [
    'script', 'style', 'textarea', 'input', 'button', 'select', 'option', 'svg', 'canvas', 'summary',
    '.toolbar', '.msg-edge-scroll', '.katex', '.mermaid', '.code-copy', '.message-grounding',
    '.streaming-tool-badge', '.export-select-check', '.message-translate-toggle', '.chat-find-bar', '.messages-empty',
    '.line-numbers', '.pre-header', '.table-header-actions', '.table-label',
    '.message-model-label', '.message.streaming'
  ].join(',');

  let chatFindOpen = false;
  let chatFindQuery = '';
  let chatFindIndex = 0;
  let chatFindMarks = [];
  let chatFindCapped = false;
  let chatFindInputTimer = null;
  let chatFindComposing = false;
  let chatFindBound = false;

  const isChatFindOpen = () => chatFindOpen;

  const getChatFindWrap = () => els.messages?.closest('.chat-scroll-wrap') || els.chatFindBar?.parentElement;

  const setChatFindNavDisabled = (disabled) => {
    if (els.chatFindPrev) els.chatFindPrev.disabled = disabled;
    if (els.chatFindNext) els.chatFindNext.disabled = disabled;
  };

  const syncChatFindI18n = () => {
    if (els.chatFindBar) els.chatFindBar.setAttribute('aria-label', t('chatFind'));
    if (els.chatFindBtn) {
      els.chatFindBtn.title = t('chatFind');
      els.chatFindBtn.setAttribute('aria-label', t('chatFind'));
    }
    if (els.chatFindInput) {
      els.chatFindInput.placeholder = t('chatFindPlaceholder');
      els.chatFindInput.setAttribute('aria-label', t('chatFindPlaceholder'));
    }
    if (els.chatFindPrev) {
      els.chatFindPrev.title = t('chatFindPrev');
      els.chatFindPrev.setAttribute('aria-label', t('chatFindPrev'));
    }
    if (els.chatFindNext) {
      els.chatFindNext.title = t('chatFindNext');
      els.chatFindNext.setAttribute('aria-label', t('chatFindNext'));
    }
    if (els.chatFindClose) {
      els.chatFindClose.title = t('chatFindClose');
      els.chatFindClose.setAttribute('aria-label', t('chatFindClose'));
    }
    syncChatFindCount();
  };

  const syncChatFindChrome = () => {
    getChatFindWrap()?.classList.toggle('is-find-open', chatFindOpen);
    els.chatFindBtn?.classList.toggle('is-active', chatFindOpen);
    els.chatFindBtn?.setAttribute('aria-pressed', chatFindOpen ? 'true' : 'false');
  };

  const syncChatFindCount = () => {
    if (!els.chatFindCount) return;
    const q = (chatFindQuery || '').trim();
    if (!chatFindOpen || !q) {
      els.chatFindCount.textContent = '';
      setChatFindNavDisabled(true);
      return;
    }
    const total = chatFindMarks.length;
    if (!total) {
      els.chatFindCount.textContent = t('chatFindNone');
      setChatFindNavDisabled(true);
      return;
    }
    const key = chatFindCapped ? 'chatFindCountCapped' : 'chatFindCount';
    els.chatFindCount.textContent = t(key, { current: chatFindIndex + 1, total });
    setChatFindNavDisabled(false);
  };

  const unwrapFindMarksIn = (root) => {
    if (!root) return;
    const parents = new Set();
    root.querySelectorAll('mark.chat-find-hl').forEach((mark) => {
      const parent = mark.parentNode;
      if (!parent) return;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
      parents.add(parent);
    });
    parents.forEach((parent) => parent.normalize());
  };

  const clearChatFindHighlights = (root = els.messages) => {
    chatFindMarks = [];
    chatFindCapped = false;
    unwrapFindMarksIn(root);
  };

  const pruneDisconnectedChatFindMarks = () => {
    if (!chatFindOpen) return;
    const prev = chatFindMarks[chatFindIndex] || null;
    chatFindMarks = chatFindMarks.filter((mark) => mark.isConnected);
    if (!chatFindMarks.length) {
      chatFindIndex = 0;
      syncChatFindCount();
      syncMessageScrollRailFindMarks();
      return;
    }
    let next = prev ? chatFindMarks.indexOf(prev) : -1;
    if (next < 0) next = Math.min(chatFindIndex, chatFindMarks.length - 1);
    setChatFindIndex(next, { scroll: false });
    syncMessageScrollRailFindMarks();
  };

  const wrapRangesInTextNode = (node, ranges) => {
    const marks = [];
    if (!node || !ranges.length) return marks;
    const text = node.nodeValue;
    const parent = node.parentNode;
    if (!text || !parent) return marks;
    const frag = document.createDocumentFragment();
    let last = 0;
    ranges.forEach(({ start, end }) => {
      const s = Math.max(last, start);
      const e = Math.min(text.length, end);
      if (e <= s) return;
      if (s > last) frag.appendChild(document.createTextNode(text.slice(last, s)));
      const mark = document.createElement('mark');
      mark.className = 'chat-find-hl';
      mark.textContent = text.slice(s, e);
      frag.appendChild(mark);
      marks.push(mark);
      last = e;
    });
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    parent.replaceChild(frag, node);
    return marks;
  };

  const collectFindTextNodes = (root) => {
    const nodes = [];
    if (!root) return nodes;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const el = node.parentElement;
        if (!el || el.closest(CHAT_FIND_SKIP)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let current;
    while ((current = walker.nextNode())) nodes.push(current);
    return nodes;
  };

  const applyChatFindHighlights = (query) => {
    clearChatFindHighlights();
    const normQuery = normalizeSearchQuery(query);
    if (!normQuery || !els.messages) return;
    const nodes = collectFindTextNodes(els.messages);
    for (const node of nodes) {
      if (chatFindMarks.length >= CHAT_FIND_MAX) {
        chatFindCapped = true;
        break;
      }
      const remaining = CHAT_FIND_MAX - chatFindMarks.length;
      const ranges = findAllSearchRangesInFold(buildSearchFold(node.nodeValue), normQuery, remaining + 1);
      if (!ranges.length) continue;
      if (ranges.length > remaining) {
        chatFindCapped = true;
        chatFindMarks.push(...wrapRangesInTextNode(node, ranges.slice(0, remaining)));
        break;
      }
      chatFindMarks.push(...wrapRangesInTextNode(node, ranges));
    }
  };

  const revealFindMatchAncestors = (mark) => {
    let el = mark.parentElement;
    while (el && el !== els.messages) {
      if (el.tagName === 'DETAILS' && !el.open) el.open = true;
      el = el.parentElement;
    }
  };

  const scrollMessagesToMark = (mark, { instant = false } = {}) => {
    const messagesEl = els.messages;
    if (!mark?.isConnected || !messagesEl) return;
    _stickToBottom = false;
    _ignoreScrollEvent = true;
    const markRect = mark.getBoundingClientRect();
    const boxRect = messagesEl.getBoundingClientRect();
    const offset = markRect.top - boxRect.top - (messagesEl.clientHeight / 2) + (markRect.height / 2);
    const maxTop = Math.max(0, messagesEl.scrollHeight - messagesEl.clientHeight);
    const top = Math.min(maxTop, Math.max(0, messagesEl.scrollTop + offset));
    const behavior = instant || prefersReducedMotion() ? 'auto' : 'smooth';
    messagesEl.scrollTo({ top, behavior });
    window.setTimeout(() => {
      _ignoreScrollEvent = false;
      updateMessageScrollRailIndicator();
    }, behavior === 'smooth' ? 450 : 60);
  };

  const scrollToFindMatch = (mark, { instant = false } = {}) => {
    if (!mark || !els.messages) return;
    revealFindMatchAncestors(mark);
    requestAnimationFrame(() => scrollMessagesToMark(mark, { instant }));
  };

  const setChatFindIndex = (idx, { scroll = true, instant = false } = {}) => {
    if (!chatFindMarks.length) {
      chatFindIndex = 0;
      syncChatFindCount();
      return;
    }
    const n = chatFindMarks.length;
    chatFindIndex = ((idx % n) + n) % n;
    chatFindMarks.forEach((mark, i) => {
      const current = i === chatFindIndex;
      mark.classList.toggle('is-current', current);
      if (current) mark.setAttribute('aria-current', 'true');
      else mark.removeAttribute('aria-current');
    });
    syncChatFindCount();
    if (scroll) scrollToFindMatch(chatFindMarks[chatFindIndex], { instant });
  };

  const getUserMessageBlock = (userArticle) => {
    const articles = [...(els.messages?.querySelectorAll('.message') || [])];
    const start = articles.indexOf(userArticle);
    if (start < 0) return userArticle ? [userArticle] : [];
    const block = [userArticle];
    for (let i = start + 1; i < articles.length; i++) {
      if (articles[i].classList.contains('user')) break;
      block.push(articles[i]);
    }
    return block;
  };

  const messageBlockHasFindMatch = (userArticle) => {
    if (!chatFindMarks.length) return false;
    const block = getUserMessageBlock(userArticle);
    return chatFindMarks.some((mark) => block.some((article) => article.contains(mark)));
  };

  const syncMessageScrollRailFindMarks = () => {
    const ticks = els.messageScrollRailTicks?.querySelectorAll('.message-scroll-rail-tick');
    if (!ticks?.length) return;
    const users = getUserMessageArticles();
    ticks.forEach((tick) => {
      const idx = parseInt(tick.dataset.idx, 10);
      const article = users[idx];
      tick.classList.toggle('is-find-match', !!(chatFindOpen && article && messageBlockHasFindMatch(article)));
    });
  };

  const jumpChatFindToMessageBlock = (userArticle) => {
    if (!chatFindOpen || !chatFindMarks.length || !userArticle) return false;
    const block = getUserMessageBlock(userArticle);
    const idx = chatFindMarks.findIndex((mark) => block.some((article) => article.contains(mark)));
    if (idx < 0) return false;
    setChatFindIndex(idx, { scroll: true });
    return true;
  };

  const refreshChatFind = ({ keepIndex = true, scroll = false, instant = false } = {}) => {
    if (!chatFindOpen) return;
    const prev = chatFindIndex;
    chatFindQuery = els.chatFindInput ? els.chatFindInput.value : chatFindQuery;
    applyChatFindHighlights(chatFindQuery);
    const nextIndex = keepIndex && chatFindMarks.length
      ? Math.min(prev, chatFindMarks.length - 1)
      : 0;
    setChatFindIndex(nextIndex, { scroll: scroll && chatFindMarks.length > 0, instant });
    syncMessageScrollRailFindMarks();
  };

  const openChatFind = (query, { jump = true, instant = false, focus = true, select = true } = {}) => {
    chatFindOpen = true;
    if (typeof query === 'string') {
      chatFindQuery = query;
      if (els.chatFindInput && els.chatFindInput.value !== query) els.chatFindInput.value = query;
    } else {
      chatFindQuery = els.chatFindInput?.value || chatFindQuery || '';
    }
    els.chatFindBar?.classList.remove('hidden');
    syncChatFindI18n();
    syncChatFindChrome();
    refreshChatFind({ keepIndex: false, scroll: false, instant });
    if (jump && chatFindMarks.length) {
      const mark = chatFindMarks[chatFindIndex];
      requestAnimationFrame(() => {
        const current = chatFindMarks[chatFindIndex] || mark;
        if (current && document.body.contains(current)) {
          scrollToFindMatch(current, { instant });
        }
      });
    }
    if (focus && els.chatFindInput) {
      els.chatFindInput.focus();
      if (select) els.chatFindInput.select();
    }
  };

  const closeChatFind = ({ restoreFocus = false } = {}) => {
    const focusFind = restoreFocus && document.activeElement === els.chatFindInput;
    chatFindOpen = false;
    chatFindCapped = false;
    clearTimeout(chatFindInputTimer);
    chatFindInputTimer = null;
    els.chatFindBar?.classList.add('hidden');
    clearChatFindHighlights();
    syncChatFindChrome();
    syncMessageScrollRailFindMarks();
    syncChatFindCount();
    if (focusFind && !isShareViewMode()) els.composerInput?.focus();
  };

  const toggleChatFind = () => {
    if (chatFindOpen) closeChatFind({ restoreFocus: true });
    else openChatFind(els.chatFindInput?.value || chatFindQuery || '');
  };

  const focusChatFind = () => {
    if (chatFindOpen) {
      els.chatFindInput?.focus();
      els.chatFindInput?.select();
      return;
    }
    openChatFind(els.chatFindInput?.value || chatFindQuery || '');
  };

  const stepChatFind = (dir, opts = {}) => {
    if (!chatFindOpen) {
      openChatFind(els.chatFindInput?.value || chatFindQuery || '');
      return;
    }
    if (!chatFindMarks.length) return;
    setChatFindIndex(chatFindIndex + dir, opts);
  };

  const bindChatFind = () => {
    if (chatFindBound) return;
    chatFindBound = true;
    syncChatFindI18n();
    syncChatFindChrome();
    setChatFindNavDisabled(true);

    els.chatFindBtn?.addEventListener('click', () => toggleChatFind());
    els.chatFindClose?.addEventListener('click', () => closeChatFind({ restoreFocus: true }));
    els.chatFindPrev?.addEventListener('click', () => stepChatFind(-1));
    els.chatFindNext?.addEventListener('click', () => stepChatFind(1));

    els.chatFindInput?.addEventListener('compositionstart', () => {
      chatFindComposing = true;
    });
    els.chatFindInput?.addEventListener('compositionend', () => {
      chatFindComposing = false;
      refreshChatFind({ keepIndex: false, scroll: true });
    });
    els.chatFindInput?.addEventListener('input', () => {
      if (chatFindComposing) return;
      clearTimeout(chatFindInputTimer);
      chatFindInputTimer = setTimeout(() => {
        refreshChatFind({ keepIndex: false, scroll: true });
      }, 80);
    });
    els.chatFindInput?.addEventListener('change', () => {
      if (chatFindComposing) return;
      refreshChatFind({ keepIndex: false, scroll: true });
    });
    els.chatFindInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault();
        e.stopPropagation();
        stepChatFind(e.shiftKey ? -1 : 1, { instant: true });
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeChatFind({ restoreFocus: true });
      }
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
    if (on) {
      _stickToBottom = true;
      window.Speech?.stopListening?.({ restoreInput: false });
      window.Speech?.stopSpeaking?.();
    }
    syncCompressContextBar();
    els.sendBtn.classList.toggle('hidden', on);
    els.stopBtn.classList.toggle('hidden', !on);
    els.composerInput.disabled = on;
    els.attachBtn.disabled = on;
    if (els.micBtn) els.micBtn.disabled = on;
    if (els.snippetsBtn) els.snippetsBtn.disabled = on;
    if (els.webSearchBtn) els.webSearchBtn.disabled = on;
    if (els.shellBtn) els.shellBtn.disabled = on;
    if (els.imageGenBtn) els.imageGenBtn.disabled = on;
    if (els.translateBtn) els.translateBtn.disabled = on;
    if (els.translateChipClose) els.translateChipClose.disabled = on;
    if (els.translateLangBtn) els.translateLangBtn.disabled = on;
    if (els.imageGenChipClose) els.imageGenChipClose.disabled = on;
    if (els.imageGenRefBtn) els.imageGenRefBtn.disabled = on;
    if (els.imageGenRatioBtn) els.imageGenRatioBtn.disabled = on;
    if (els.imageGenStyleBtn) els.imageGenStyleBtn.disabled = on;
    if (els.imageGenRatioChipClear) els.imageGenRatioChipClear.disabled = on;
    if (els.imageGenStyleChipClear) els.imageGenStyleChipClear.disabled = on;
    if (els.compareBtn) els.compareBtn.disabled = on;
    if (els.compareAddModelBtn) els.compareAddModelBtn.disabled = on;
    if (els.compareModelPickers) {
      els.compareModelPickers.querySelectorAll('select, button').forEach((el) => { el.disabled = on; });
    }
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
    const imageHtml = imgList.map((img, i) => {
      const src = imageSrcAttr(img.dataUrl);
      if (!src) return '';
      return '<div class="composer-attachment composer-attachment-image" data-type="image" data-idx="' + i + '">'
      + '<img src="' + src + '" alt="' + escapeHTML(img.name || 'Ảnh ' + (i + 1)) + '" />'
      + '<button type="button" class="composer-attachment-remove" data-remove-type="image" data-remove-idx="' + i + '" title="' + escapeHTML(t('removeImage')) + '" aria-label="' + escapeHTML(t('removeImage')) + '">'
      + '<i class="fa-solid fa-xmark"></i></button>'
      + '</div>';
    }).join('');
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

  const USAGE_DASH_RANGES = ['7d', '30d', 'period'];
  let usageDashRange = '7d';

  const usageLocaleTag = () => {
    const locale = window.I18n.getLocale?.() || window.APP_CONFIG.DEFAULT_LOCALE;
    return locale === 'vi' ? 'vi-VN' : locale === 'jp' ? 'ja-JP' : locale === 'zh' ? 'zh-CN' : 'en-US';
  };

  const parseUsageDayKey = (key) => {
    const parts = String(key || '').split('-').map(Number);
    if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };

  const formatUsageDayLabel = (key, dayCount) => {
    const date = parseUsageDayKey(key);
    if (!date || Number.isNaN(date.getTime())) return key;
    try {
      if (dayCount <= 8) {
        return date.toLocaleDateString(usageLocaleTag(), { weekday: 'short' });
      }
      return date.toLocaleDateString(usageLocaleTag(), { month: 'numeric', day: 'numeric' });
    } catch {
      return key.slice(5);
    }
  };

  const formatUsageDate = (ts) => {
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) return '';
    try {
      return date.toLocaleDateString(usageLocaleTag(), { dateStyle: 'medium' });
    } catch {
      return date.toISOString().slice(0, 10);
    }
  };

  const renderUsageChartSvg = (days) => {
    const n = days.length;
    if (!n) return '';
    const costs = days.map((d) => d.cost);
    const maxCost = Math.max(0, ...costs);
    const useTokens = maxCost <= 0;
    const values = useTokens
      ? days.map((d) => (d.prompt || 0) + (d.completion || 0))
      : costs;
    const max = Math.max(0, ...values);
    if (max <= 0) return '';
    const w = 320;
    const h = 72;
    const padL = 4;
    const padR = 4;
    const padT = 6;
    const padB = 16;
    const innerW = w - padL - padR;
    const innerH = h - padT - padB;
    const gap = n > 20 ? 1 : n > 10 ? 2 : 3;
    const barW = Math.max(1.5, (innerW - gap * Math.max(0, n - 1)) / n);
    const showLabel = (i) => {
      if (n <= 8) return true;
      if (i === 0 || i === n - 1) return true;
      const step = Math.max(1, Math.round((n - 1) / 4));
      return i % step === 0;
    };
    let markup = '';
    days.forEach((d, i) => {
      const value = values[i] || 0;
      const barH = (value / max) * innerH;
      const x = padL + i * (barW + gap);
      const y = padT + (innerH - barH);
      const title = d.key + ' · ' + formatTokenCost(d.cost)
        + (useTokens ? ' · ' + formatTokenCount((d.prompt || 0) + (d.completion || 0)) : '');
      markup += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barW.toFixed(2)}" height="${Math.max(barH, value > 0 ? 1.5 : 0).toFixed(2)}" rx="1.5" fill="var(--accent)" opacity="${value > 0 ? '0.92' : '0.18'}"><title>${escapeHTML(title)}</title></rect>`;
      if (showLabel(i)) {
        markup += `<text x="${(x + barW / 2).toFixed(2)}" y="${h - 3}" text-anchor="middle" fill="var(--text-dim)" font-size="8">${escapeHTML(formatUsageDayLabel(d.key, n))}</text>`;
      }
    });
    return `<svg class="settings-usage-chart-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeHTML(t('settingsUsageDash'))}">${markup}</svg>`;
  };

  const updateSettingsUsageDash = () => {
    if (!els.usageDashCost) return;
    const summary = window.Storage.getUsageSummary?.(usageDashRange) || {
      days: [],
      models: [],
      totals: { prompt: 0, completion: 0, cost: 0 },
      resetAt: 0
    };
    els.usageDashRanges?.querySelectorAll('[data-usage-range]').forEach((btn) => {
      const active = btn.getAttribute('data-usage-range') === usageDashRange;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    els.usageDashCost.textContent = formatTokenCost(summary.totals.cost);
    if (els.usageDashInOut) {
      els.usageDashInOut.textContent = t('settingsUsageDashInOut', {
        input: formatTokenCount(summary.totals.prompt),
        output: formatTokenCount(summary.totals.completion)
      });
    }
    const hasUsage = (summary.totals.prompt || 0) + (summary.totals.completion || 0) > 0;
    const svg = renderUsageChartSvg(summary.days || []);
    if (els.usageDashChart) {
      els.usageDashChart.hidden = !svg;
      els.usageDashChart.innerHTML = svg;
    }
    if (els.usageDashEmpty) els.usageDashEmpty.hidden = hasUsage;
    if (els.usageDashResetAt) {
      if (summary.resetAt) {
        els.usageDashResetAt.hidden = false;
        els.usageDashResetAt.textContent = t('settingsUsageDashResetAt', { date: formatUsageDate(summary.resetAt) });
      } else {
        els.usageDashResetAt.hidden = true;
        els.usageDashResetAt.textContent = '';
      }
    }
    const models = summary.models || [];
    if (els.settingsUsageDashModelsLabel) {
      els.settingsUsageDashModelsLabel.hidden = !models.length;
    }
    if (els.usageDashModels) {
      if (!models.length) {
        els.usageDashModels.innerHTML = '';
      } else {
        els.usageDashModels.innerHTML = models.map((row) => {
          const model = window.APP_CONFIG.MODELS.find((m) => m.id === row.id);
          const name = model?.label || row.id;
          return `<li class="settings-usage-model"><span class="settings-usage-model-name">${escapeHTML(name)}</span><span class="settings-usage-model-cost">${escapeHTML(formatTokenCost(row.cost))}</span><span class="settings-usage-model-meta">${escapeHTML(t('settingsUsageDashInOut', {
            input: formatTokenCount(row.prompt),
            output: formatTokenCount(row.completion)
          }))}</span></li>`;
        }).join('');
      }
    }
  };

  const setUsageDashRange = (range) => {
    if (!USAGE_DASH_RANGES.includes(range)) return;
    usageDashRange = range;
    updateSettingsUsageDash();
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
    updateSettingsUsageDash();
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

  const formatBackupDate = (iso) => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    const locale = window.I18n.getLocale?.() || window.APP_CONFIG.DEFAULT_LOCALE;
    const localeTag = locale === 'vi' ? 'vi-VN' : locale === 'jp' ? 'ja-JP' : locale === 'zh' ? 'zh-CN' : 'en-US';
    try {
      return date.toLocaleString(localeTag, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return date.toISOString();
    }
  };

  const openBackupRestoreModal = (backup) => {
    if (!els.backupRestoreModal || !backup) return;
    const stats = backup.stats || {};
    if (els.backupRestoreSummary) {
      els.backupRestoreSummary.textContent = t('backupRestoreSummary', {
        conversations: stats.conversations || 0,
        messages: stats.messages || 0,
        snippets: stats.snippets || 0
      });
    }
    if (els.backupRestoreDate) {
      const formatted = formatBackupDate(backup.exportedAt);
      els.backupRestoreDate.textContent = formatted
        ? t('backupRestoreDate', { date: formatted })
        : t('backupRestoreDateUnknown');
    }
    const showKeys = !!backup.includesApiKeys;
    els.backupRestoreKeysWrap?.classList.toggle('hidden', !showKeys);
    if (els.backupRestoreKeys) els.backupRestoreKeys.checked = false;
    els.backupRestoreModal.classList.remove('hidden');
  };

  const closeBackupRestoreModal = () => {
    if (els.backupRestoreModal) els.backupRestoreModal.classList.add('hidden');
    if (els.backupRestoreKeys) els.backupRestoreKeys.checked = false;
  };

  const isBackupRestoreOpen = () => {
    return !!(els.backupRestoreModal && !els.backupRestoreModal.classList.contains('hidden'));
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

  const showSettingsTab = (tab) => {
    const root = els.settingsModal;
    if (!root) return;
    const buttons = [...root.querySelectorAll('[data-settings-tab]')];
    let next = tab;
    const requested = buttons.find((btn) => btn.dataset.settingsTab === next && !btn.hidden);
    if (!requested) {
      const fallback = buttons.find((btn) => !btn.hidden)?.dataset.settingsTab;
      if (!fallback) return;
      next = fallback;
    }
    buttons.forEach((btn) => {
      const on = btn.dataset.settingsTab === next;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    root.querySelectorAll('[data-settings-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.settingsPanel !== next;
    });
    const main = root.querySelector('.settings-main');
    if (main) main.scrollTop = 0;
  };

  const filterSettingsNav = (query) => {
    const root = els.settingsModal;
    if (!root) return;
    const q = window.Utils.normalizeSearchQuery(query);
    const buttons = [...root.querySelectorAll('[data-settings-tab]')];
    buttons.forEach((btn) => {
      const panel = root.querySelector(`[data-settings-panel="${btn.dataset.settingsTab}"]`);
      const hay = `${btn.textContent || ''} ${panel?.textContent || ''}`;
      btn.hidden = Boolean(q) && !window.Utils.includesSearch(hay, q);
    });
    const any = buttons.some((btn) => !btn.hidden);
    const empty = root.querySelector('#settingsNavEmpty');
    const group = root.querySelector('#settingsNavGroupLabel');
    if (empty) empty.hidden = any;
    if (group) group.hidden = !any;
    const active = buttons.find((btn) => btn.classList.contains('is-active') && !btn.hidden);
    if (!active) showSettingsTab(buttons.find((btn) => !btn.hidden)?.dataset.settingsTab || 'general');
  };

  const openSettings = (state, opts = {}) => {
    els.apiKeyInput.value = state.apiKey || '';
    els.anthropicApiKeyInput.value = state.anthropicApiKey || '';
    els.deepseekApiKeyInput.value = state.deepseekApiKey || '';
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
    els.openrouterApiKeyInput.type = 'password';
    els.openrouterApiKeyIcon.innerHTML = '<i class="fa-solid fa-eye"></i>';
    updateSettingsTokenUsage(state);
    const keepTab = !opts.tab && els.settingsModal && !els.settingsModal.classList.contains('hidden');
    const currentTab = els.settingsModal?.querySelector('[data-settings-tab].is-active')?.dataset.settingsTab;
    if (!keepTab && els.settingsNavSearch) {
      els.settingsNavSearch.value = '';
      filterSettingsNav('');
    }
    const tab = opts.tab || (keepTab && currentTab) || 'general';
    showSettingsTab(tab);
    els.settingsModal.classList.remove('hidden');
    if (!keepTab) {
      setTimeout(() => {
        if (tab === 'api') els.apiKeyInput?.focus();
        else els.settingsNavSearch?.focus();
      }, 50);
    }
  };

  const closeSettings = () => els.settingsModal.classList.add('hidden');

  const applyLocale = (appState) => {
    window.Speech?.stopListening?.();
    window.Speech?.stopSpeaking?.();
    window.I18n.setLocale(appState.locale || window.APP_CONFIG.DEFAULT_LOCALE);
    window.I18n.applyToDOM();
    initImageGenMenus();
    syncComposerToolsUI(appState.currentModel, {
      webSearchEnabled: appState.webSearchEnabled,
      shellEnabled: appState.shellEnabled,
      imageGenEnabled: appState.imageGenEnabled,
      thinkingEnabled: appState.thinkingEnabled,
      translateEnabled: appState.translateEnabled,
      translateTargetLang: appState.translateTargetLang,
      imageGenRatio: appState.imageGenRatio,
      imageGenStyle: appState.imageGenStyle,
      imageGenQuality: appState.imageGenQuality
    });
    refreshConversationList(window.Conversations.getCurrent()?.id || null);
    const convo = window.Conversations.getCurrent();
    if (convo) renderMessages(convo);
    else renderEmpty();
    updateExportSelectCount();
    syncMessageScrollRailI18n();
    syncChatFindI18n();
    syncCompressContextBar(convo);
    if (currentPreviewMode) setPreviewPanelTitle(currentPreviewMode);
    updateSettingsTokenUsage(appState);
    refreshSnippetsViews();
    if (isSlashCommandMenuOpen()) syncSlashCommandMenu();
  };

  let guideOnClose = null;

  const openGuide = (opts = {}) => {
    closeSettings();
    guideOnClose = opts.onClose || null;
    if (!els.guideModal) return;
    els.guideModal.classList.remove('hidden');
    if (els.guideBody) els.guideBody.scrollTop = 0;
  };

  const closeGuide = (opts = {}) => {
    if (els.guideModal) els.guideModal.classList.add('hidden');
    if (opts.skipOnClose) {
      guideOnClose = null;
      return;
    }
    const cb = guideOnClose;
    guideOnClose = null;
    cb?.();
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

  let shareViewConvo = null;

  const getShareViewConvo = () => shareViewConvo;

  const isShareViewMode = () => document.body.classList.contains('share-view-mode');

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
    shareViewConvo = null;
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

    shareViewConvo = convo;
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

  let editingSnippetId = null;

  const truncateSnippetPreview = (text, max = 96) => {
    const oneLine = (text || '').replace(/\s+/g, ' ').trim();
    if (oneLine.length <= max) return oneLine;
    return oneLine.slice(0, max - 1) + '…';
  };

  const snippetSlashBadge = (snippet) => {
    const cmd = window.Snippets.getSlashCommand(snippet);
    if (!cmd) return '';
    return '<span class="snippets-slash-badge">/' + escapeHTML(cmd) + '</span>';
  };

  const renderSnippetMenuItems = (items) => {
    if (!els.snippetsMenuList) return;
    if (!items.length) {
      els.snippetsMenuList.innerHTML = '<p class="snippets-menu-empty">' + escapeHTML(t('snippetsEmpty')) + '</p>';
      return;
    }
    els.snippetsMenuList.innerHTML = items.map((s) =>
      '<button type="button" class="snippets-menu-item" role="menuitem" data-snippet-id="' + escapeHTML(s.id) + '">'
      + '<span class="snippets-menu-item-title-row">'
      + '<span class="snippets-menu-item-title">' + escapeHTML(s.title) + '</span>'
      + snippetSlashBadge(s)
      + '</span>'
      + '<span class="snippets-menu-item-preview">' + escapeHTML(truncateSnippetPreview(s.content)) + '</span>'
      + '</button>'
    ).join('');
  };

  const renderSnippetModalItems = (items) => {
    if (!els.snippetsModalList) return;
    if (!items.length) {
      els.snippetsModalList.innerHTML = '<p class="snippets-menu-empty">' + escapeHTML(t('snippetsEmpty')) + '</p>';
      return;
    }
    els.snippetsModalList.innerHTML = items.map((s) =>
      '<div class="snippets-modal-item" role="listitem" data-snippet-id="' + escapeHTML(s.id) + '">'
      + '<button type="button" class="snippets-modal-item-main" data-action="snippet-insert" data-snippet-id="' + escapeHTML(s.id) + '">'
      + '<span class="snippets-menu-item-title-row">'
      + '<span class="snippets-menu-item-title">' + escapeHTML(s.title) + '</span>'
      + snippetSlashBadge(s)
      + '</span>'
      + '<span class="snippets-menu-item-preview">' + escapeHTML(truncateSnippetPreview(s.content, 120)) + '</span>'
      + '</button>'
      + '<div class="snippets-modal-item-actions">'
      + '<button type="button" class="btn btn-icon" data-action="snippet-edit" data-snippet-id="' + escapeHTML(s.id) + '" title="' + escapeHTML(t('snippetsEdit')) + '" aria-label="' + escapeHTML(t('snippetsEdit')) + '"><i class="fa-solid fa-pen"></i></button>'
      + '<button type="button" class="btn btn-icon" data-action="snippet-delete" data-snippet-id="' + escapeHTML(s.id) + '" title="' + escapeHTML(t('snippetsDelete')) + '" aria-label="' + escapeHTML(t('snippetsDelete')) + '"><i class="fa-solid fa-trash"></i></button>'
      + '</div></div>'
    ).join('');
  };

  const refreshSnippetsViews = () => {
    const menuQ = els.snippetsMenuSearch?.value || '';
    const modalQ = els.snippetsModalSearch?.value || '';
    renderSnippetMenuItems(window.Snippets.search(menuQ));
    renderSnippetModalItems(window.Snippets.search(modalQ));
  };

  let slashMatches = [];
  let slashHighlightIndex = 0;
  let slashDismissedKey = '';

  const slashTokenKey = (token) => token ? token.start + '\0' + token.query : '';

  const getComposerSlashToken = () => {
    const el = els.composerInput;
    if (!el) return null;
    const value = el.value;
    const caret = el.selectionStart;
    if (caret !== el.selectionEnd) return null;
    const before = value.slice(0, caret);
    const lineStart = before.lastIndexOf('\n') + 1;
    const lineBefore = before.slice(lineStart);
    const restOfToken = (value.slice(caret).match(/^[^\s]*/) || [''])[0];
    const combined = lineBefore + restOfToken;
    const m = combined.match(/^(\s*)\/([^\s]*)$/);
    if (!m) return null;
    const query = m[2];
    if (query.includes('/')) return null;
    const slashStart = lineStart + m[1].length;
    const tokenEnd = slashStart + 1 + query.length;
    if (caret < slashStart || caret > tokenEnd) return null;
    return { start: slashStart, end: tokenEnd, query };
  };

  const closeSlashCommandMenu = ({ dismiss = false } = {}) => {
    if (dismiss) slashDismissedKey = slashTokenKey(getComposerSlashToken());
    else slashDismissedKey = '';
    if (!els.slashCommandMenu) return;
    els.slashCommandMenu.classList.add('hidden');
    slashMatches = [];
    slashHighlightIndex = 0;
    if (els.composerInput) {
      els.composerInput.setAttribute('aria-expanded', 'false');
      els.composerInput.removeAttribute('aria-activedescendant');
    }
  };

  const isSlashCommandMenuOpen = () => !!(els.slashCommandMenu && !els.slashCommandMenu.classList.contains('hidden'));

  const renderSlashCommandItems = () => {
    if (!els.slashCommandList) return;
    if (!slashMatches.length) {
      els.slashCommandList.innerHTML = '<p class="snippets-menu-empty">' + escapeHTML(t('slashCommandEmpty')) + '</p>';
      if (els.composerInput) els.composerInput.removeAttribute('aria-activedescendant');
      return;
    }
    if (slashHighlightIndex < 0 || slashHighlightIndex >= slashMatches.length) slashHighlightIndex = 0;
    els.slashCommandList.innerHTML = slashMatches.map((s, i) => {
      const cmd = window.Snippets.getSlashCommand(s);
      const active = i === slashHighlightIndex;
      const optId = 'slash-opt-' + i;
      return '<button type="button" class="slash-command-item' + (active ? ' is-active' : '') + '" role="option" id="' + optId + '"'
        + ' data-snippet-id="' + escapeHTML(s.id) + '" aria-selected="' + (active ? 'true' : 'false') + '">'
        + '<span class="slash-command-item-cmd">' + (cmd ? '/' + escapeHTML(cmd) : '/') + '</span>'
        + '<span class="slash-command-item-body">'
        + '<span class="snippets-menu-item-title">' + escapeHTML(s.title) + '</span>'
        + '<span class="snippets-menu-item-preview">' + escapeHTML(truncateSnippetPreview(s.content)) + '</span>'
        + '</span></button>';
    }).join('');
    const activeEl = els.slashCommandList.querySelector('.slash-command-item.is-active');
    if (activeEl) {
      const list = els.slashCommandList;
      const listTop = list.scrollTop;
      const itemTop = activeEl.offsetTop;
      const itemBottom = itemTop + activeEl.offsetHeight;
      const viewBottom = listTop + list.clientHeight;
      if (itemBottom > viewBottom) list.scrollTop = itemBottom - list.clientHeight;
      else if (itemTop < listTop) list.scrollTop = itemTop;
      if (els.composerInput) els.composerInput.setAttribute('aria-activedescendant', activeEl.id);
    }
  };

  const openSlashCommandMenu = (items) => {
    if (!els.slashCommandMenu) return;
    closeSnippetsMenu();
    closeImageGenMenus();
    closeTranslateLangMenu();
    slashMatches = items;
    if (slashHighlightIndex >= slashMatches.length) slashHighlightIndex = 0;
    const tools = els.composerTools;
    const toolsH = tools && !tools.classList.contains('hidden') ? tools.offsetHeight + 8 : 8;
    els.slashCommandMenu.style.setProperty('--slash-menu-gap', toolsH + 'px');
    renderSlashCommandItems();
    els.slashCommandMenu.classList.remove('hidden');
    if (els.composerInput) els.composerInput.setAttribute('aria-expanded', 'true');
  };

  const syncSlashCommandMenu = () => {
    const token = getComposerSlashToken();
    if (!token) {
      slashDismissedKey = '';
      closeSlashCommandMenu();
      return;
    }
    if (slashDismissedKey && slashDismissedKey === slashTokenKey(token)) return;
    slashDismissedKey = '';
    const items = window.Snippets.searchBySlash(token.query);
    if (!items.length && token.query) {
      closeSlashCommandMenu();
      return;
    }
    if (isSlashCommandMenuOpen() && slashMatches.length && items.length) {
      const prevId = slashMatches[slashHighlightIndex]?.id;
      const nextIdx = items.findIndex((s) => s.id === prevId);
      slashHighlightIndex = nextIdx >= 0 ? nextIdx : 0;
    } else {
      slashHighlightIndex = 0;
    }
    openSlashCommandMenu(items);
  };

  const moveSlashCommandHighlight = (delta) => {
    if (!isSlashCommandMenuOpen() || !slashMatches.length) return;
    const len = slashMatches.length;
    slashHighlightIndex = (slashHighlightIndex + delta + len) % len;
    renderSlashCommandItems();
  };

  const applySlashSnippet = (snippet) => {
    const el = els.composerInput;
    const token = getComposerSlashToken();
    const content = snippet?.content || '';
    if (!el || !snippet || !token || !content) return false;
    const before = el.value.slice(0, token.start);
    const after = el.value.slice(token.end);
    el.value = before + content + after;
    const caret = before.length + content.length;
    el.setSelectionRange(caret, caret);
    autoResize(el);
    el.focus();
    closeSlashCommandMenu();
    return true;
  };

  const confirmSlashCommand = ({ requireQuery = false } = {}) => {
    const token = getComposerSlashToken();
    if (!token) return false;
    if (requireQuery && !(token.query || '').trim()) return false;
    let snippet = null;
    if (isSlashCommandMenuOpen() && slashMatches.length) {
      snippet = slashMatches[slashHighlightIndex] || slashMatches[0];
    } else {
      const items = window.Snippets.searchBySlash(token.query);
      if (!items.length) return false;
      const q = window.Utils.normalizeSearchQuery(token.query);
      snippet = items.find((s) => window.Snippets.getSlashAliases(s).includes(q)) || items[0];
    }
    return applySlashSnippet(snippet);
  };

  const insertSnippetIntoComposer = (content, { closeMenus = true } = {}) => {
    const raw = content || '';
    const text = raw.trim();
    if (!text || !els.composerInput) return false;
    const token = getComposerSlashToken();
    if (token) {
      const applied = applySlashSnippet({ content: raw });
      if (applied) {
        if (closeMenus) {
          closeSnippetsMenu();
          closeSnippetsModal();
        }
        return true;
      }
    }
    const current = els.composerInput.value;
    if (!current.trim()) {
      els.composerInput.value = text;
    } else {
      const sep = /\n$/.test(current) ? '\n' : '\n\n';
      els.composerInput.value = current + sep + text;
    }
    autoResize(els.composerInput);
    els.composerInput.focus();
    if (closeMenus) {
      closeSlashCommandMenu();
      closeSnippetsMenu();
      closeSnippetsModal();
    }
    return true;
  };

  const openSnippetsMenu = () => {
    if (!els.snippetsMenu || !els.snippetsBtn) return;
    closeSlashCommandMenu();
    closeImageGenMenus();
    closeTranslateLangMenu();
    refreshSnippetsViews();
    els.snippetsMenu.classList.remove('hidden');
    els.snippetsBtn.classList.add('is-open');
    els.snippetsBtn.setAttribute('aria-expanded', 'true');
    if (els.snippetsMenuSearch) {
      els.snippetsMenuSearch.value = '';
      renderSnippetMenuItems(window.Snippets.getAll());
    }
  };

  const closeSnippetsMenu = () => {
    if (!els.snippetsMenu || !els.snippetsBtn) return;
    els.snippetsMenu.classList.add('hidden');
    els.snippetsBtn.classList.remove('is-open');
    els.snippetsBtn.setAttribute('aria-expanded', 'false');
    if (els.snippetsMenuSearch) els.snippetsMenuSearch.value = '';
  };

  const toggleSnippetsMenu = () => {
    if (!els.snippetsMenu) return;
    if (els.snippetsMenu.classList.contains('hidden')) openSnippetsMenu();
    else closeSnippetsMenu();
  };

  const isSnippetsMenuOpen = () => els.snippetsMenu && !els.snippetsMenu.classList.contains('hidden');

  const showSnippetForm = (snippet = null) => {
    editingSnippetId = snippet?.id || null;
    if (els.snippetsListView) els.snippetsListView.classList.add('hidden');
    if (els.snippetsListFooter) els.snippetsListFooter.classList.add('hidden');
    if (els.snippetForm) els.snippetForm.classList.remove('hidden');
    if (els.snippetTitleInput) els.snippetTitleInput.value = snippet?.title || '';
    if (els.snippetContentInput) els.snippetContentInput.value = snippet?.content || '';
    setTimeout(() => (snippet?.content ? els.snippetContentInput : els.snippetTitleInput)?.focus(), 50);
  };

  const showSnippetListView = () => {
    editingSnippetId = null;
    if (els.snippetForm) els.snippetForm.classList.add('hidden');
    if (els.snippetsListView) els.snippetsListView.classList.remove('hidden');
    if (els.snippetsListFooter) els.snippetsListFooter.classList.remove('hidden');
    refreshSnippetsViews();
  };

  const openSnippetsModal = () => {
    closeSnippetsMenu();
    if (!els.snippetsModal) return;
    showSnippetListView();
    if (els.snippetsModalSearch) els.snippetsModalSearch.value = '';
    els.snippetsModal.classList.remove('hidden');
    refreshSnippetsViews();
  };

  const closeSnippetsModal = () => {
    if (!els.snippetsModal) return;
    els.snippetsModal.classList.add('hidden');
    showSnippetListView();
  };

  const isSnippetsModalOpen = () => els.snippetsModal && !els.snippetsModal.classList.contains('hidden');

  const getEditingSnippetId = () => editingSnippetId;

  const saveSnippetFromForm = () => {
    const title = els.snippetTitleInput?.value || '';
    const content = els.snippetContentInput?.value || '';
    if (editingSnippetId) {
      if (!window.Snippets.update(editingSnippetId, { title, content })) return false;
    } else if (!window.Snippets.add({ title, content })) {
      return false;
    }
    showSnippetListView();
    refreshSnippetsViews();
    return true;
  };

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
  let currentPreviewMode = null;
  let currentArtifactPreview = null;
  let currentSourcesPreview = null;

  const isPreviewResizeStartTarget = (e) => {
    if (e.target.closest('.md-preview-header button, .md-preview-header a, .md-preview-header input, .md-preview-header select, .md-preview-header textarea, .md-preview-header [role="menuitem"]')) {
      return false;
    }
    if (e.target.closest('#mdPreviewResizeHandle')) return true;
    if (e.target.closest('.md-preview-header')) return true;
    const panel = els.markdownPreviewPanel;
    if (!panel?.classList.contains('is-open')) return false;
    if (!e.target.closest('#markdownPreviewPanel')) return false;
    if (e.target.closest('.html-preview-frame, .artifact-preview-frame, .md-preview-content')) return false;
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

  const PREVIEW_TITLE_KEYS = {
    markdown: 'previewMarkdown',
    html: 'previewHtml',
    react: 'previewReact',
    svg: 'previewSvg',
    mermaid: 'previewMermaid',
    css: 'previewCss',
    json: 'previewJson',
    yaml: 'previewYaml',
    vue: 'previewVue',
    svelte: 'previewSvelte',
    graphviz: 'previewGraphviz',
    csv: 'previewCsv',
    openapi: 'previewOpenapi',
    chart: 'previewChart',
    python: 'previewPython',
    sql: 'previewSql',
    sources: 'sources'
  };

  const PREVIEW_ICONS = {
    markdown: 'fa-brands fa-markdown',
    html: 'fa-brands fa-html5',
    react: 'fa-brands fa-react',
    svg: 'fa-solid fa-bezier-curve',
    mermaid: 'fa-solid fa-diagram-project',
    css: 'fa-brands fa-css3-alt',
    json: 'fa-solid fa-code',
    yaml: 'fa-solid fa-file-lines',
    vue: 'fa-brands fa-vuejs',
    svelte: 'fa-solid fa-bolt',
    graphviz: 'fa-solid fa-share-nodes',
    csv: 'fa-solid fa-table',
    openapi: 'fa-solid fa-book',
    chart: 'fa-solid fa-chart-column',
    python: 'fa-brands fa-python',
    sql: 'fa-solid fa-database',
    sources: 'fa-solid fa-globe'
  };

  const isIframeArtifactType = (type) => window.ArtifactPreview?.isIframeArtifact?.(type)
    ?? (type === 'html' || type === 'react' || type === 'svg' || type === 'css'
      || type === 'vue' || type === 'svelte' || type === 'chart' || type === 'python');
  const isDomArtifactType = (type) => window.ArtifactPreview?.isDomArtifact?.(type)
    ?? (type === 'mermaid' || type === 'json' || type === 'yaml' || type === 'graphviz'
      || type === 'csv' || type === 'openapi' || type === 'sql');

  const sourcesKeyFromEl = (el) => {
    if (!el) return '';
    const article = el.closest('.message');
    if (article?.dataset.idx != null && article.dataset.idx !== '') return 'msg:' + article.dataset.idx;
    const col = el.closest('.model-compare-col');
    if (col?.dataset.modelId) return 'compare:' + col.dataset.modelId;
    return '';
  };

  const readGroundingPayload = (section) => {
    const node = section?.querySelector?.('template.message-grounding-json, script.message-grounding-json');
    if (!node) return null;
    try {
      const raw = node.tagName === 'TEMPLATE'
        ? (node.content?.textContent || node.innerHTML || '')
        : (node.textContent || '');
      const data = JSON.parse(raw);
      const chunks = [];
      const seen = new Set();
      for (const item of data.chunks || []) {
        const uri = safeHref(item?.uri);
        if (!uri || !/^https?:/i.test(uri) || seen.has(uri)) continue;
        seen.add(uri);
        chunks.push({ uri, title: truncate(item.title || uri, 200) });
      }
      const queries = [...new Set((data.queries || [])
        .map((q) => truncate(String(q || ''), 200))
        .filter(Boolean))].slice(0, 8);
      if (!chunks.length && !queries.length) return null;
      return { chunks, queries };
    } catch {
      return null;
    }
  };

  const sourcesPanelHTML = ({ chunks = [], queries = [] } = {}) => {
    let html = '<div class="sources-panel">';
    if (queries.length) {
      html += '<p class="sources-panel-query"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>'
        + '<span>' + escapeHTML(t('sourcesQuery', { q: queries.join(' · ') })) + '</span></p>';
    }
    if (!chunks.length) {
      html += '</div>';
      return html;
    }
    html += '<ul class="sources-panel-list">';
    chunks.forEach((chunk, i) => {
      const host = groundingHostLabel(chunk.uri);
      html += '<li><a class="sources-panel-card" href="' + escapeHTML(chunk.uri)
        + '" target="_blank" rel="noopener noreferrer">';
      html += '<span class="sources-panel-index">' + escapeHTML(String(i + 1)) + '</span>';
      html += '<span class="sources-panel-favicon-wrap">' + groundingFaviconHTML(host) + '</span>';
      html += '<span class="sources-panel-text">';
      html += '<span class="sources-panel-card-title">' + escapeHTML(chunk.title) + '</span>';
      if (host) html += '<span class="sources-panel-host">' + escapeHTML(host) + '</span>';
      html += '</span>';
      html += '<i class="fa-solid fa-arrow-up-right-from-square sources-panel-open" aria-hidden="true"></i>';
      html += '</a></li>';
    });
    html += '</ul></div>';
    return html;
  };

  const markOpenSourcesButtons = () => {
    document.querySelectorAll('.message-grounding-btn.is-open').forEach((btn) => {
      btn.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    });
    if (currentPreviewMode !== 'sources' || !currentSourcesPreview?.key) return;
    document.querySelectorAll('.message-grounding-btn').forEach((btn) => {
      if (sourcesKeyFromEl(btn) !== currentSourcesPreview.key) return;
      btn.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
    });
  };

  const renderSourcesPreviewContent = (payload) => {
    if (!els.markdownPreviewContent) return;
    els.markdownPreviewContent.classList.add('is-sources-preview');
    els.markdownPreviewPanel?.classList.add('is-sources-preview-panel');
    els.markdownPreviewContent.innerHTML = sourcesPanelHTML(payload);
    bindFaviconFallbacks(els.markdownPreviewContent);
    els.markdownPreviewContent.scrollTop = 0;
  };

  const syncOpenSourcesPreview = (root) => {
    if (currentPreviewMode !== 'sources' || !currentSourcesPreview) return;
    const scope = root && root.querySelectorAll ? root : document;
    const sections = scope.querySelectorAll('.message-grounding');
    for (const section of sections) {
      if (sourcesKeyFromEl(section) !== currentSourcesPreview.key) continue;
      const payload = readGroundingPayload(section);
      if (!payload) break;
      const serialized = JSON.stringify(payload);
      if (serialized !== currentSourcesPreview.serialized) {
        currentSourcesPreview = { key: currentSourcesPreview.key, serialized, ...payload };
        if (els.markdownPreviewContent?.classList.contains('is-sources-preview')) {
          const top = els.markdownPreviewContent.scrollTop;
          renderSourcesPreviewContent(payload);
          els.markdownPreviewContent.scrollTop = top;
        }
      }
      break;
    }
    markOpenSourcesButtons();
  };

  const openSourcesPreview = (triggerEl) => {
    const section = triggerEl?.closest?.('.message-grounding');
    const payload = readGroundingPayload(section);
    if (!payload || !els.markdownPreviewPanel || !els.markdownPreviewContent) return;
    const key = sourcesKeyFromEl(section);
    if (currentPreviewMode === 'sources' && currentSourcesPreview?.key && currentSourcesPreview.key === key) {
      closeMarkdownPreview();
      return;
    }
    currentArtifactPreview = null;
    currentSourcesPreview = { key, serialized: JSON.stringify(payload), ...payload };
    setPreviewPanelTitle('sources');
    clearArtifactPreviewContent();
    renderSourcesPreviewContent(payload);
    openPreviewPanel();
    markOpenSourcesButtons();
  };

  const setPreviewPanelTitle = (mode) => {
    currentPreviewMode = mode || null;
    const showToolbar = isIframeArtifactType(mode) || isDomArtifactType(mode);
    const showOpenTab = isIframeArtifactType(mode);
    if (els.previewPanelIcon) {
      els.previewPanelIcon.className = PREVIEW_ICONS[mode] || PREVIEW_ICONS.markdown;
    }
    if (els.previewPanelTitle) {
      const key = PREVIEW_TITLE_KEYS[mode] || PREVIEW_TITLE_KEYS.markdown;
      els.previewPanelTitle.textContent = t(key);
    }
    if (els.markdownPreviewPanel) {
      const key = PREVIEW_TITLE_KEYS[mode] || PREVIEW_TITLE_KEYS.markdown;
      els.markdownPreviewPanel.setAttribute('aria-label', t(key));
    }
    if (els.artifactPreviewToolbar) {
      els.artifactPreviewToolbar.classList.toggle('hidden', !showToolbar);
    }
    if (els.artifactOpenTabBtn) {
      els.artifactOpenTabBtn.classList.toggle('hidden', !showOpenTab);
    }
  };

  const clearArtifactPreviewContent = () => {
    if (!els.markdownPreviewContent) return;
    els.markdownPreviewContent.classList.remove(
      'is-html-preview', 'is-artifact-preview', 'is-dom-artifact-preview',
      'is-mermaid-preview', 'is-json-preview', 'is-yaml-preview',
      'is-graphviz-preview', 'is-csv-preview', 'is-openapi-preview', 'is-python-preview', 'is-sql-preview',
      'is-sources-preview'
    );
    els.markdownPreviewPanel?.classList.remove('is-sources-preview-panel');
    els.markdownPreviewContent.innerHTML = '';
  };

  const renderArtifactPreviewFrame = (srcdoc) => {
    clearArtifactPreviewContent();
    els.markdownPreviewContent.classList.add('is-html-preview', 'is-artifact-preview');
    const iframe = document.createElement('iframe');
    iframe.className = 'html-preview-frame artifact-preview-frame';
    iframe.setAttribute('sandbox', 'allow-scripts allow-popups allow-modals');
    iframe.setAttribute('title', t(PREVIEW_TITLE_KEYS[currentPreviewMode] || 'previewHtml'));
    iframe.srcdoc = srcdoc;
    els.markdownPreviewContent.appendChild(iframe);
    els.markdownPreviewContent.scrollTop = 0;
  };

  const renderDomArtifactPreview = async (source, type, lang = '') => {
    clearArtifactPreviewContent();
    els.markdownPreviewContent.classList.add('is-dom-artifact-preview', 'is-artifact-preview');
    if (type === 'mermaid') {
      els.markdownPreviewContent.classList.add('is-mermaid-preview');
      await window.Markdown.renderMermaidPreview(source, els.markdownPreviewContent);
    } else if (type === 'graphviz') {
      els.markdownPreviewContent.classList.add('is-graphviz-preview');
      await window.ArtifactPreview.renderGraphvizPreview(els.markdownPreviewContent, source);
    } else if (type === 'csv') {
      els.markdownPreviewContent.classList.add('is-csv-preview');
      els.markdownPreviewContent.innerHTML = window.ArtifactPreview.buildDomHtml(source, type, lang);
      window.ArtifactPreview.bindCsvTableSort(els.markdownPreviewContent);
    } else if (type === 'openapi') {
      els.markdownPreviewContent.classList.add('is-openapi-preview');
      els.markdownPreviewContent.innerHTML = window.ArtifactPreview.buildDomHtml(source, type, lang);
      window.ArtifactPreview.bindOpenApiDocToggles(els.markdownPreviewContent);
    } else if (type === 'sql') {
      els.markdownPreviewContent.classList.add('is-sql-preview');
      await window.ArtifactPreview.renderSqlPreview(els.markdownPreviewContent, source);
    } else {
      els.markdownPreviewContent.classList.add(type === 'yaml' ? 'is-yaml-preview' : 'is-json-preview');
      els.markdownPreviewContent.innerHTML = window.ArtifactPreview.buildDomHtml(source, type, lang);
      window.ArtifactPreview.bindJsonTreeToggles(els.markdownPreviewContent);
    }
    els.markdownPreviewContent.scrollTop = 0;
  };

  const openArtifactPreview = async (source, type, lang = '') => {
    const trimmed = (source || '').trim();
    const artifactType = type || window.ArtifactPreview?.detectArtifactType?.(lang, trimmed) || 'html';
    if (!trimmed || !els.markdownPreviewPanel || !els.markdownPreviewContent) return;
    currentSourcesPreview = null;
    setPreviewPanelTitle(artifactType);
    markOpenSourcesButtons();
    if (isDomArtifactType(artifactType)) {
      currentArtifactPreview = { source: trimmed, type: artifactType, lang, srcdoc: null };
      await renderDomArtifactPreview(trimmed, artifactType, lang);
    } else {
      const srcdoc = window.ArtifactPreview.buildSrcdoc(trimmed, artifactType, lang);
      currentArtifactPreview = { source: trimmed, type: artifactType, lang, srcdoc };
      if (artifactType === 'python') els.markdownPreviewContent.classList.add('is-python-preview');
      renderArtifactPreviewFrame(srcdoc);
    }
    openPreviewPanel();
  };

  const refreshArtifactPreview = () => {
    if (!currentArtifactPreview) return;
    const { source, type, lang } = currentArtifactPreview;
    openArtifactPreview(source, type, lang);
  };

  const openArtifactPreviewInNewTab = () => {
    if (!currentArtifactPreview) return false;
    const srcdoc = currentArtifactPreview.srcdoc
      || (currentArtifactPreview.source
        ? window.ArtifactPreview.buildSrcdoc(
          currentArtifactPreview.source,
          currentArtifactPreview.type,
          currentArtifactPreview.lang
        )
        : '');
    if (!srcdoc) return false;
    return window.ArtifactPreview.openInNewTab(srcdoc);
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
    currentArtifactPreview = null;
    currentSourcesPreview = null;
    setPreviewPanelTitle('markdown');
    markOpenSourcesButtons();
    clearArtifactPreviewContent();
    els.markdownPreviewContent.innerHTML = window.Markdown.render(source);
    polishContent(els.markdownPreviewContent, { renderMermaid: true });
    els.markdownPreviewContent.scrollTop = 0;
    openPreviewPanel();
  };

  const openHtmlPreview = (source) => openArtifactPreview(source, 'html');

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
      clearArtifactPreviewContent();
    }
    currentArtifactPreview = null;
    currentSourcesPreview = null;
    currentPreviewMode = null;
    markOpenSourcesButtons();
  };

  const openImagePreview = (src, alt = '') => {
    const safe = safeImageSrc(src);
    if (!safe || !els.imagePreviewOverlay || !els.imagePreviewImg) return;
    els.imagePreviewImg.src = safe;
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
    closeProviderMenu();
    closeModelMenu();
    closePromptModeMenu();
    closeEffortMenu();
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
  let overlayCancellable = false;

  const setPdfExportLoading = (visible, { title, hint, ready = false, downloadLabel, cancellable } = {}) => {
    if (!els.pdfExportOverlay) return;
    if (visible) {
      if (typeof cancellable === 'boolean') overlayCancellable = cancellable;
      if (title && els.pdfExportLoadingTitle) els.pdfExportLoadingTitle.textContent = title;
      if (hint && els.pdfExportLoadingText) els.pdfExportLoadingText.textContent = hint;
      if (downloadLabel && els.pdfExportDownloadBtn) els.pdfExportDownloadBtn.textContent = downloadLabel;
      els.pdfExportSpinner?.classList.toggle('hidden', ready);
      els.pdfExportDownloadBtn?.classList.toggle('hidden', !ready);
      els.pdfExportCancelBtn?.classList.toggle('hidden', !(overlayCancellable && !ready));
      els.pdfExportOverlay.classList.remove('hidden');
      els.pdfExportOverlay.setAttribute('aria-hidden', 'false');
      els.pdfExportOverlay.setAttribute('aria-busy', ready ? 'false' : 'true');
      document.body.classList.add('pdf-export-loading');
    } else {
      pendingExportDownload = null;
      pendingExportKind = null;
      overlayCancellable = false;
      els.pdfExportSpinner?.classList.remove('hidden');
      els.pdfExportDownloadBtn?.classList.add('hidden');
      els.pdfExportCancelBtn?.classList.add('hidden');
      els.pdfExportOverlay.classList.add('hidden');
      els.pdfExportOverlay.setAttribute('aria-hidden', 'true');
      els.pdfExportOverlay.setAttribute('aria-busy', 'false');
      document.body.classList.remove('pdf-export-loading');
    }
  };

  const isPdfExportCancellable = () => !!(
    overlayCancellable
    && els.pdfExportOverlay
    && !els.pdfExportOverlay.classList.contains('hidden')
    && els.pdfExportCancelBtn
    && !els.pdfExportCancelBtn.classList.contains('hidden')
  );

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
    cacheEls, setTheme, initModelSelect, initProviderSelects, updateModelSelect, syncProviderSelect, syncWorkspaceNav,
    initEffortSelect, syncEffortSelect, initTranslateLangMenu, initImageGenMenus,
    syncComposerToolsUI, syncTranslateUI, closeTranslateLangMenu, closeImageGenMenus, toggleImageGenMenu, setImageGenOptionPicked,
    setStreamingSearchStatus, setStreamingShellStatus, setStreamingImageStatus, updateStreamingAssistantContent,
    renderConversationList, refreshConversationList, setRunningConversationIds, isConversationRunning, getConversationSearchQuery,
    setConversationSearchQuery, toggleConversationSearch, clearConversationSearch, isConversationSearchOpen,
    isChatFindOpen, openChatFind, closeChatFind, toggleChatFind, focusChatFind, stepChatFind,
    renderMessages, renderEmpty, animateClearAll,
    appendMessage, appendStreamingMessage, updateStreamingContent, finalizeStreaming,
    enterEditMode, exitEditMode, downloadConversation, downloadConversationTxt,
    scrollToBottom, scrollToBottomIfNear, scrollMessageToTop, scrollMessageToBottom,
    showError, removeError, setStreaming,
    renderComposerAttachments, setDragOverlay,
    openSettings, closeSettings, showSettingsTab, filterSettingsNav, updateSettingsTokenUsage, setUsageDashRange, syncSystemPromptModeUI, checkTokenCostWarning,
    openTokenCostWarning, closeTokenCostWarning, isTokenCostWarningOpen,
    openBackupRestoreModal, closeBackupRestoreModal, isBackupRestoreOpen,
    applyLocale, openGuide, closeGuide, isGuideModalOpen,
    openShareModal, closeShareModal, isShareModalOpen,
    setShareModalLoading, setShareModalResult, setShareModalError,
    enterShareLoadingMode, enterShareViewMode, showShareLoadError, getShareViewConvo, isShareViewMode,
    openRenameModal, closeRenameModal, isRenameModalOpen,
    toggleSnippetsMenu, closeSnippetsMenu, isSnippetsMenuOpen,
    openSnippetsModal, closeSnippetsModal, isSnippetsModalOpen,
    insertSnippetIntoComposer, refreshSnippetsViews, showSnippetForm, showSnippetListView,
    syncSlashCommandMenu, closeSlashCommandMenu, isSlashCommandMenuOpen,
    moveSlashCommandHighlight, confirmSlashCommand, applySlashSnippet,
    getEditingSnippetId, saveSnippetFromForm, toggleSidebar, closeMobileSidebar, initSidebar, bindSidebarResize, bindComposerViewport, showToast, rerenderMermaid,
    setAssistantToolbar, updateAssistantMessage, refreshUserMessage, syncMessageModelLabel, beginRetryStreaming, beginContinueStreaming,
    openMarkdownPreview, openHtmlPreview, openArtifactPreview, refreshArtifactPreview, openArtifactPreviewInNewTab,
    openSourcesPreview, closeMarkdownPreview, bindPreviewResize,
    openImagePreview, closeImagePreview, isImagePreviewOpen,
    setPdfExportLoading, isPdfExportCancellable,
    showExportDownloadPrompt, consumeExportDownload, finishExportDownload,
    isExportSelectMode, toggleExportSelectMode, setExportSelectMode,
    syncCompressContextBar,
    syncCompareBar,
    openModelCompareOverlay, closeModelCompareOverlay, isModelCompareOpen,
    getModelCompareColumns, updateCompareColumnContent, finalizeCompareColumn,
    syncComparePickButtons, setCompareColumnPickable, markCompareColumnPicked,
    getExportSelectedIndices, toggleExportSelectIndex,
    selectAllExportMessages, clearExportSelection,
    preparePdfExportRoot,
    closeAllMsgExportMenus,
    closeHeaderDownloadMenu, toggleHeaderDownloadMenu, setHeaderDownloadOptionDisabled,
    closeProviderMenu, toggleProviderMenu, isProviderMenuOpen,
    closeModelMenu, toggleModelMenu,
    closePromptModeMenu, togglePromptModeMenu,
    closeEffortMenu, toggleEffortMenu,
    els
  };
})();
