window.Storage = (() => {
  const KEY = window.APP_CONFIG.STORAGE_KEY;
  const IDB_NAME = 'testchatai-db';
  const IDB_VERSION = 1;
  const IDB_STORE = 'state';
  const IDB_RECORD_KEY = 'app';
  const BACKEND_FIELD = '_backend';
  const BACKEND_IDB = 'indexeddb';

  const defaultState = () => ({
    apiKey: '',
    anthropicApiKey: '',
    deepseekApiKey: '',
    geminiApiKey: '',
    kimiApiKey: '',
    currentModel: window.APP_CONFIG.DEFAULT_MODEL,
    webSearchEnabled: false,
    imageGenEnabled: false,
    thinkingEnabled: false,
    imageGenRatio: window.APP_CONFIG.DEFAULT_IMAGE_GEN_RATIO,
    imageGenStyle: window.APP_CONFIG.DEFAULT_IMAGE_GEN_STYLE,
    imageGenTemplate: window.APP_CONFIG.DEFAULT_IMAGE_GEN_TEMPLATE,
    translateEnabled: false,
    translateTargetLang: window.APP_CONFIG.DEFAULT_TRANSLATE_LANG,
    tokenSaveEnabled: false,
    systemPrompt: window.APP_CONFIG.DEFAULT_SYSTEM_PROMPT,
    theme: window.APP_CONFIG.DEFAULT_THEME,
    locale: window.APP_CONFIG.DEFAULT_LOCALE,
    currentConversationId: null,
    conversations: []
  });

  let state = defaultState();
  let loaded = false;
  let usingIdbBackend = false;
  let heavySavePending = false;
  let idbPromise = null;

  const isQuotaError = (err) => {
    if (!err) return false;
    if (err.name === 'QuotaExceededError') return true;
    if (err.code === 22 || err.code === 1014) return true;
    return /quota/i.test(String(err.message || err));
  };

  const notify = (message, level = 'warning') => {
    window.dispatchEvent(new CustomEvent('app-storage-notify', {
      detail: { message, level }
    }));
  };

  const openDb = () => {
    if (idbPromise) return idbPromise;
    idbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB không khả dụng'));
        return;
      }
      const request = indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Không mở được IndexedDB'));
    });
    return idbPromise;
  };

  const idbGet = async () => {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const request = store.get(IDB_RECORD_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('Không đọc được IndexedDB'));
    });
  };

  const idbSet = async (value) => {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Không ghi được IndexedDB'));
      tx.objectStore(IDB_STORE).put(value, IDB_RECORD_KEY);
    });
  };

  const idbDelete = async () => {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Không xóa được IndexedDB'));
      tx.objectStore(IDB_STORE).delete(IDB_RECORD_KEY);
    });
  };

  const writeLocalPointer = () => {
    localStorage.setItem(KEY, JSON.stringify({ [BACKEND_FIELD]: BACKEND_IDB }));
  };

  const tryWriteLocalStorage = (payload) => {
    localStorage.setItem(KEY, JSON.stringify(payload));
  };

  const compressDataUrl = (dataUrl, maxDim = 1280, quality = 0.82) => new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      resolve(dataUrl);
      return;
    }
    if (dataUrl.length < 280000) {
      resolve(dataUrl);
      return;
    }

    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(image.width, image.height, 1));
      if (scale >= 0.99 && dataUrl.length < 400000) {
        resolve(dataUrl);
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const mime = dataUrl.includes('image/png') && scale >= 1 ? 'image/png' : 'image/jpeg';
      try {
        resolve(canvas.toDataURL(mime, mime === 'image/jpeg' ? quality : undefined));
      } catch {
        resolve(dataUrl);
      }
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });

  const compressImages = async (images, maxDim, quality) => {
    if (!images?.length) return false;
    let changed = false;
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (!img?.dataUrl) continue;
      const next = await compressDataUrl(img.dataUrl, maxDim, quality);
      if (next !== img.dataUrl) {
        img.dataUrl = next;
        changed = true;
      }
    }
    return changed;
  };

  const compressStateImages = async (targetState, { maxDim = 1280, quality = 0.82 } = {}) => {
    let changed = false;
    for (const convo of targetState.conversations || []) {
      for (const message of convo.messages || []) {
        if (await compressImages(message.images, maxDim, quality)) changed = true;
        if (await compressImages(message.generatedImages, maxDim, quality)) changed = true;
      }
    }
    return changed;
  };

  const applyLoadedState = (parsed) => {
    state = { ...defaultState(), ...parsed };
    delete state[BACKEND_FIELD];

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
    if (!window.APP_CONFIG.LOCALES.includes(state.locale)) {
      state.locale = window.APP_CONFIG.DEFAULT_LOCALE;
    }
    if (parsed && !('locale' in parsed) && parsed.conversations?.length) {
      state.locale = 'vi';
    }
    if (state.tokenSaveEnabled) {
      if (window.I18n?.isDefaultSystemPrompt(state.systemPrompt) || window.I18n?.isTokenSaveSystemPrompt(state.systemPrompt)) {
        state.systemPrompt = window.I18n.getTokenSaveSystemPrompt(state.locale);
      }
    } else if (window.I18n?.isTokenSaveSystemPrompt(state.systemPrompt)) {
      state.systemPrompt = window.I18n.getDefaultSystemPrompt(state.locale);
    } else if (window.I18n?.isDefaultSystemPrompt(state.systemPrompt)) {
      state.systemPrompt = window.I18n.getDefaultSystemPrompt(state.locale);
    }
    return false;
  };

  const saveToIndexedDb = async () => {
    await idbSet(state);
    writeLocalPointer();
    usingIdbBackend = true;
  };

  const scheduleHeavySave = () => {
    if (heavySavePending) return;
    heavySavePending = true;

    (async () => {
      try {
        const compressed = await compressStateImages(state, { maxDim: 1280, quality: 0.82 });
        if (compressed) {
          try {
            tryWriteLocalStorage(state);
            usingIdbBackend = false;
            notify(window.I18n.t('storageCompress'));
            return;
          } catch (err) {
            if (!isQuotaError(err)) throw err;
          }
        }

        const compressedMore = await compressStateImages(state, { maxDim: 960, quality: 0.72 });
        if (compressedMore) {
          try {
            tryWriteLocalStorage(state);
            usingIdbBackend = false;
            notify(window.I18n.t('storageCompress'));
            return;
          } catch (err) {
            if (!isQuotaError(err)) throw err;
          }
        }

        await saveToIndexedDb();
        notify(window.I18n.t('storageIdb'));
      } catch (err) {
        console.error('Storage heavy save failed', err);
        notify(window.I18n.t('storageFail'), 'error');
      } finally {
        heavySavePending = false;
      }
    })();
  };

  const save = () => {
    if (usingIdbBackend) {
      idbSet(state).catch((err) => {
        console.error('IndexedDB save failed', err);
        notify(window.I18n.t('storageFail'), 'error');
      });
      return true;
    }

    try {
      tryWriteLocalStorage(state);
      return true;
    } catch (err) {
      if (!isQuotaError(err)) {
        console.error('Storage save failed', err);
        notify(window.I18n.t('storageSettingsFail'), 'error');
        return false;
      }
      scheduleHeavySave();
      return false;
    }
  };

  const load = async () => {
    if (loaded) return state;

    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        loaded = true;
        return state;
      }

      const parsed = JSON.parse(raw);
      let migrated = false;
      if (parsed[BACKEND_FIELD] === BACKEND_IDB) {
        usingIdbBackend = true;
        const idbState = await idbGet();
        if (idbState && typeof idbState === 'object') {
          migrated = applyLoadedState(idbState);
        } else {
          console.warn('IndexedDB state missing, resetting storage.');
          state = defaultState();
          usingIdbBackend = false;
          try { localStorage.removeItem(KEY); } catch {}
          try { await idbDelete(); } catch {}
        }
      } else {
        migrated = applyLoadedState(parsed);
      }

      if (migrated) save();
    } catch (e) {
      console.warn('Storage load failed, resetting.', e);
      state = defaultState();
      usingIdbBackend = false;
    }

    loaded = true;
    return state;
  };

  const get = () => state;

  const set = (patch) => {
    state = { ...state, ...patch };
    save();
  };

  const resetAll = () => {
    const fresh = defaultState();
    state = {
      ...fresh,
      apiKey: state.apiKey,
      anthropicApiKey: state.anthropicApiKey,
      deepseekApiKey: state.deepseekApiKey,
      geminiApiKey: state.geminiApiKey,
      kimiApiKey: state.kimiApiKey,
      currentModel: state.currentModel,
      systemPrompt: state.systemPrompt,
      theme: state.theme
    };
    save();
  };

  const getBackend = () => (usingIdbBackend ? 'indexeddb' : 'localStorage');

  return { load, save, get, set, resetAll, getBackend };
})();
