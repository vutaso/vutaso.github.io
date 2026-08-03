window.Storage = (() => {
  const KEY = window.APP_CONFIG.STORAGE_KEY;

  const defaultState = () => ({
    apiKey: '',
    currentModel: window.APP_CONFIG.DEFAULT_MODEL,
    systemPrompt: window.APP_CONFIG.DEFAULT_SYSTEM_PROMPT,
    theme: window.APP_CONFIG.DEFAULT_THEME,
    currentConversationId: null,
    conversations: []
  });

  let state = defaultState();
  let loaded = false;

  const load = () => {
    if (loaded) return state;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state = { ...defaultState(), ...parsed };
        const def = window.APP_CONFIG.DEFAULT_SYSTEM_PROMPT;
        if (state.systemPrompt && state.systemPrompt !== def && state.systemPrompt.includes('ngắn gọn')) {
          state.systemPrompt = def;
          save();
        }
      }
    } catch (e) {
      console.warn('Storage load failed, resetting.', e);
      state = defaultState();
    }
    loaded = true;
    return state;
  };

  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Storage save failed', e);
    }
  };

  const get = () => state;

  const set = (patch) => {
    state = { ...state, ...patch };
    save();
  };

  const resetAll = () => {
    const fresh = defaultState();
    state = { ...fresh, apiKey: state.apiKey, currentModel: state.currentModel, systemPrompt: state.systemPrompt, theme: state.theme };
    save();
  };

  return { load, save, get, set, resetAll };
})();
