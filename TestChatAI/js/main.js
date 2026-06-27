(() => {
  window.Storage.load();
  window.Markdown.init();

  const state = window.Storage.get();
  const ui = window.UI;
  const convoMod = window.Conversations;

  ui.cacheEls();
  ui.initSidebar();
  ui.setTheme(state.theme || window.APP_CONFIG.DEFAULT_THEME);
  const list = convoMod.getAll();
  const current = convoMod.getCurrent();
  const initialModel = convoMod.getModel(current);

  ui.initModelSelect(initialModel);
  ui.initTranslateLangMenu();
  ui.initImageGenMenus();
  ui.syncComposerToolsUI(initialModel, {
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

  ui.renderConversationList(list, current ? current.id : null);
  ui.renderMessages(current);

  window.Events.bind();

  if (!window.APP_CONFIG.hasApiKey(state, initialModel)) {
    setTimeout(() => ui.openSettings(state), 200);
  } else {
    ui.els.composerInput.focus();
  }
})();
