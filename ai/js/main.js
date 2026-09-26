(async () => {
  await window.Storage.load();
  window.Markdown.init();

  let state = window.Storage.get();
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
  let theme = state.theme || window.APP_CONFIG.DEFAULT_THEME;
  ui.setTheme(theme);
  theme = document.documentElement.getAttribute('data-theme');
  if (state.theme !== theme) window.Storage.set({ theme });

  if (state.workspace === 'image') {
    const imageModel = (state.imageModel && window.APP_CONFIG.modelSupportsImageGen(state.imageModel))
      ? state.imageModel
      : (window.APP_CONFIG.modelSupportsImageGen(state.currentModel)
        ? state.currentModel
        : window.APP_CONFIG.defaultImageModel());
    window.Storage.set({
      workspace: 'image',
      imageGenEnabled: true,
      webSearchEnabled: false,
      shellEnabled: false,
      translateEnabled: false,
      compareEnabled: false,
      currentModel: imageModel,
      imageModel
    });
    const current = convoMod.getCurrent();
    if (!current || current.kind !== 'image') {
      const latest = convoMod.getAll()
        .filter((c) => c.kind === 'image')
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
      if (latest) convoMod.select(latest.id);
      else convoMod.create(imageModel, { kind: 'image' });
    }
  } else {
    window.Storage.set({ workspace: 'chat', imageGenEnabled: false });
    const current = convoMod.getCurrent();
    if (current && current.kind === 'image') {
      const latestChat = convoMod.getAll()
        .filter((c) => c.kind !== 'image')
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
      if (latestChat) convoMod.select(latestChat.id);
      else window.Storage.set({ currentConversationId: null });
    }
  }
  state = window.Storage.get();

  ui.initModelSelect(state.currentModel);
  ui.syncSystemPromptModeUI(state);
  ui.initTranslateLangMenu();
  ui.initImageGenMenus();
  if (state.webSearchEnabled && state.imageGenEnabled) {
    window.Storage.set({ webSearchEnabled: false });
    state.webSearchEnabled = false;
  }
  if (state.shellEnabled && state.imageGenEnabled) {
    window.Storage.set({ shellEnabled: false });
    state.shellEnabled = false;
  }
  if (state.shellEnabled && !window.APP_CONFIG.modelSupportsShell(state.currentModel)) {
    window.Storage.set({ shellEnabled: false });
    state.shellEnabled = false;
  }
  ui.syncComposerToolsUI(state.currentModel, {
    webSearchEnabled: state.webSearchEnabled,
    shellEnabled: state.shellEnabled,
    imageGenEnabled: state.imageGenEnabled,
    thinkingEnabled: state.thinkingEnabled,
    translateEnabled: state.translateEnabled,
    translateTargetLang: state.translateTargetLang,
    imageGenRatio: state.imageGenRatio,
    imageGenStyle: state.imageGenStyle,
    imageGenQuality: state.imageGenQuality,
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
    setTimeout(() => {
      const isFirstVisit = !state.guideSeen && !(state.conversations?.length);
      if (isFirstVisit) {
        ui.openGuide({
          onClose: () => {
            window.Storage.set({ guideSeen: true });
            const latest = window.Storage.get();
            if (!window.APP_CONFIG.hasApiKey(latest, latest.currentModel)) {
              ui.openSettings(latest, { tab: 'api' });
            }
          }
        });
        return;
      }
      ui.openSettings(state, { tab: 'api' });
    }, 200);
  } else if (!window.Utils.prefersCoarsePointer()) {
    ui.els.composerInput.focus();
  }
})();
