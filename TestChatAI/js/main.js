(() => {
  window.Storage.load();
  window.Markdown.init();

  const state = window.Storage.get();
  const ui = window.UI;
  const convoMod = window.Conversations;

  ui.cacheEls();
  ui.initSidebar();
  ui.setTheme(state.theme || window.APP_CONFIG.DEFAULT_THEME);
  ui.initModelSelect(state.currentModel);

  const list = convoMod.getAll();
  const current = convoMod.getCurrent();
  ui.renderConversationList(list, current ? current.id : null);
  ui.renderMessages(current);

  window.Events.bind();

  if (!state.apiKey) {
    setTimeout(() => ui.openSettings(state), 200);
  } else {
    ui.els.composerInput.focus();
  }
})();
