(async () => {
  await window.Storage.load();
  window.Markdown.init();

  const state = window.Storage.get();
  const ui = window.UI;
  const convoMod = window.Conversations;

  ui.cacheEls();

  if (ui.els.attachFileInput) {
    ui.els.attachFileInput.accept = window.APP_CONFIG.getAttachFileAccept();
  }

  window.I18n.setLocale(state.locale || window.APP_CONFIG.DEFAULT_LOCALE);
  window.Snippets.ensureSeeded();
  window.I18n.applyToDOM();

  window.addEventListener('app-storage-notify', (e) => {
    const message = e.detail?.message;
    if (message) ui.showToast(message);
  });

  ui.initSidebar();
  ui.bindSidebarResize();
  ui.bindComposerViewport();
  ui.setTheme(state.theme || window.APP_CONFIG.DEFAULT_THEME);
  ui.initModelSelect(state.currentModel);
  ui.syncSystemPromptModeUI(state);
  ui.initTranslateLangMenu();
  ui.initImageGenMenus();
  ui.syncComposerToolsUI(state.currentModel, {
    webSearchEnabled: state.webSearchEnabled,
    imageGenEnabled: state.imageGenEnabled,
    thinkingEnabled: state.thinkingEnabled,
    translateEnabled: state.translateEnabled,
    translateTargetLang: state.translateTargetLang,
    imageGenRatio: state.imageGenRatio,
    imageGenStyle: state.imageGenStyle,
    imageGenTemplate: state.imageGenTemplate,
    imageGenRatioPicked: false,
    imageGenStylePicked: false,
    imageGenTemplatePicked: false,
    referenceImage: null
  });
  ui.syncCompareBar(state);

  const shareId = window.Share?.getShareIdFromLocation?.();
  if (shareId) {
    ui.enterShareLoadingMode();
    window.Events.bind();
    try {
      const snapshot = await window.Share.fetchShare(shareId);
      ui.enterShareViewMode(snapshot);
    } catch (err) {
      ui.showShareLoadError(err?.message || window.I18n.t('shareLoadError'));
    }
    return;
  }

  const current = convoMod.getCurrent();
  ui.refreshConversationList(current ? current.id : null);
  ui.renderMessages(current);

  window.Events.bind();

  if (!window.APP_CONFIG.hasApiKey(state, state.currentModel)) {
    setTimeout(() => ui.openSettings(state), 200);
  } else if (!window.Utils.prefersCoarsePointer()) {
    ui.els.composerInput.focus();
  }
})();
