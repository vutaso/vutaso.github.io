window.Storage = (() => {
  const KEY = window.APP_CONFIG.STORAGE_KEY;

  const defaultState = () => ({
    apiKey: '',
    anthropicApiKey: '',
    deepseekApiKey: '',
    geminiApiKey: '',
    currentModel: window.APP_CONFIG.DEFAULT_MODEL,
    webSearchEnabled: false,
    imageGenEnabled: false,
    thinkingEnabled: false,
    imageGenRatio: window.APP_CONFIG.DEFAULT_IMAGE_GEN_RATIO,
    imageGenStyle: window.APP_CONFIG.DEFAULT_IMAGE_GEN_STYLE,
    imageGenTemplate: window.APP_CONFIG.DEFAULT_IMAGE_GEN_TEMPLATE,
    translateEnabled: false,
    translateTargetLang: window.APP_CONFIG.DEFAULT_TRANSLATE_LANG,
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
        const validIds = window.APP_CONFIG.MODELS.map((m) => m.id);
        if (!validIds.includes(state.currentModel)) {
          state.currentModel = window.APP_CONFIG.DEFAULT_MODEL;
        }
        const validLangs = window.APP_CONFIG.TRANSLATE_LANGUAGES.map((l) => l.code);
        if (!validLangs.includes(state.translateTargetLang)) {
          state.translateTargetLang = window.APP_CONFIG.DEFAULT_TRANSLATE_LANG;
        }
        const validRatios = window.APP_CONFIG.IMAGE_GEN_RATIOS.map((r) => r.id);
        if (!validRatios.includes(state.imageGenRatio)) {
          state.imageGenRatio = window.APP_CONFIG.DEFAULT_IMAGE_GEN_RATIO;
        }
        const validStyles = window.APP_CONFIG.IMAGE_GEN_STYLES.map((s) => s.id);
        if (!validStyles.includes(state.imageGenStyle)) {
          state.imageGenStyle = window.APP_CONFIG.DEFAULT_IMAGE_GEN_STYLE;
        }
        const validTemplates = window.APP_CONFIG.IMAGE_GEN_TEMPLATES.map((t) => t.id);
        if (!validTemplates.includes(state.imageGenTemplate)) {
          state.imageGenTemplate = window.APP_CONFIG.DEFAULT_IMAGE_GEN_TEMPLATE;
        }
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
    state = { ...fresh, apiKey: state.apiKey, anthropicApiKey: state.anthropicApiKey, deepseekApiKey: state.deepseekApiKey, geminiApiKey: state.geminiApiKey, currentModel: state.currentModel, systemPrompt: state.systemPrompt, theme: state.theme };
    save();
  };

  return { load, save, get, set, resetAll };
})();
