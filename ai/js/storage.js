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
    openrouterApiKey: '',
    geminiApiKey: '',
    kimiApiKey: '',
    currentModel: window.APP_CONFIG.DEFAULT_MODEL,
    webSearchEnabled: false,
    imageGenEnabled: false,
    thinkingEnabled: window.APP_CONFIG.DEFAULT_EFFORT !== 'default'
      && window.APP_CONFIG.modelUsesEffortLinkedThinking(window.APP_CONFIG.DEFAULT_MODEL),
    reasoningEffort: window.APP_CONFIG.DEFAULT_EFFORT,
    imageGenRatio: window.APP_CONFIG.DEFAULT_IMAGE_GEN_RATIO,
    imageGenStyle: window.APP_CONFIG.DEFAULT_IMAGE_GEN_STYLE,
    imageGenTemplate: window.APP_CONFIG.DEFAULT_IMAGE_GEN_TEMPLATE,
    translateEnabled: false,
    translateTargetLang: window.APP_CONFIG.DEFAULT_TRANSLATE_LANG,
    tokenSaveEnabled: false,
    systemPromptMode: 'default',
    systemPrompt: window.APP_CONFIG.DEFAULT_SYSTEM_PROMPT,
    customSystemPrompt: '',
    mdPreviewWidth: null,
    theme: window.APP_CONFIG.DEFAULT_THEME,
    locale: window.APP_CONFIG.DEFAULT_LOCALE,
    currentConversationId: null,
    conversations: [],
    promptSnippets: [],
    promptSnippetsSeeded: false,
    compareEnabled: false,
    compareModels: [],
    usageLedger: { resetAt: 0, days: {} },
    guideSeen: false
  });

  const USAGE_LEDGER_MAX_DAYS = 90;
  const USAGE_DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

  const emptyUsageLedger = () => ({ resetAt: 0, days: {} });

  const localDayKey = (ts = Date.now()) => {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  };

  const toTok = (value) => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  const usageWeight = (usage) => toTok(usage?.prompt) + toTok(usage?.completion);

  const addUsageDelta = (prev, delta) => {
    const prompt = toTok(prev?.prompt) + toTok(delta?.prompt);
    const completion = toTok(prev?.completion) + toTok(delta?.completion);
    return { prompt, completion, total: prompt + completion };
  };

  const pickHeavierUsage = (a, b) => {
    if (!a) return b;
    if (!b) return a;
    return usageWeight(b) > usageWeight(a) ? b : a;
  };

  const pruneUsageDays = (days) => {
    const keys = Object.keys(days).filter((k) => USAGE_DAY_RE.test(k)).sort();
    if (keys.length <= USAGE_LEDGER_MAX_DAYS) return days;
    const keep = new Set(keys.slice(-USAGE_LEDGER_MAX_DAYS));
    const next = {};
    for (const key of keys) {
      if (keep.has(key)) next[key] = days[key];
    }
    return next;
  };

  const sanitizeUsageLedger = (raw) => {
    const out = emptyUsageLedger();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
    const resetAt = Number(raw.resetAt);
    out.resetAt = Number.isFinite(resetAt) && resetAt > 0 ? resetAt : 0;
    const src = raw.days && typeof raw.days === 'object' && !Array.isArray(raw.days) ? raw.days : {};
    for (const [day, models] of Object.entries(src)) {
      if (!USAGE_DAY_RE.test(day) || !models || typeof models !== 'object' || Array.isArray(models)) continue;
      const bucket = {};
      for (const [modelId, usage] of Object.entries(models)) {
        if (!modelId || !usage || typeof usage !== 'object') continue;
        const prompt = toTok(usage.prompt);
        const completion = toTok(usage.completion);
        if (!prompt && !completion) continue;
        bucket[modelId] = { prompt, completion, total: prompt + completion };
      }
      if (Object.keys(bucket).length) out.days[day] = bucket;
    }
    out.days = pruneUsageDays(out.days);
    return out;
  };

  const mergeUsageLedgers = (a, b) => {
    const left = sanitizeUsageLedger(a);
    const right = sanitizeUsageLedger(b);
    const days = { ...left.days };
    for (const [day, models] of Object.entries(right.days)) {
      if (!days[day]) {
        days[day] = { ...models };
        continue;
      }
      const bucket = { ...days[day] };
      for (const [modelId, usage] of Object.entries(models)) {
        bucket[modelId] = pickHeavierUsage(bucket[modelId], usage);
      }
      days[day] = bucket;
    }
    return {
      resetAt: Math.max(left.resetAt || 0, right.resetAt || 0),
      days: pruneUsageDays(days)
    };
  };

  const parseDayKey = (key) => {
    const parts = String(key || '').split('-').map(Number);
    if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };

  const consecutiveDayKeysEnding = (endDate, count) => {
    const keys = [];
    const n = Math.max(1, count);
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(endDate.getDate() - i);
      keys.push(localDayKey(d.getTime()));
    }
    return keys;
  };

  const localDaysInclusive = (fromDate, toDate, maxCount) => {
    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);
    const to = new Date(toDate);
    to.setHours(0, 0, 0, 0);
    if (from > to) return 1;
    let n = 1;
    const cur = new Date(from);
    while (cur < to) {
      cur.setDate(cur.getDate() + 1);
      n++;
      if (n >= maxCount) break;
    }
    return n;
  };

  const listUsageDayKeys = (range, ledger) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (range === '30d') return consecutiveDayKeysEnding(today, 30);
    if (range !== 'period') return consecutiveDayKeysEnding(today, 7);

    const existing = Object.keys(ledger.days).filter((k) => USAGE_DAY_RE.test(k)).sort();
    let start = null;
    if (ledger.resetAt) {
      start = new Date(ledger.resetAt);
      start.setHours(0, 0, 0, 0);
    } else if (existing.length) {
      start = parseDayKey(existing[0]);
    }
    const stored = start
      ? existing.filter((k) => {
          const d = parseDayKey(k);
          return d && d >= start;
        })
      : existing;
    const fillCount = start
      ? localDaysInclusive(start, today, USAGE_LEDGER_MAX_DAYS)
      : 7;
    const keys = new Set(consecutiveDayKeysEnding(today, fillCount));
    for (const key of stored) keys.add(key);
    return [...keys].sort();
  };

  const recordUsage = (modelId, delta) => {
    if (!modelId || !delta) return;
    const prompt = toTok(delta.prompt);
    const completion = toTok(delta.completion);
    if (!prompt && !completion) return;
    const ledger = sanitizeUsageLedger(state.usageLedger);
    const day = localDayKey();
    if (!ledger.days[day]) ledger.days[day] = {};
    ledger.days[day][modelId] = addUsageDelta(ledger.days[day][modelId], { prompt, completion });
    ledger.days = pruneUsageDays(ledger.days);
    state = { ...state, usageLedger: ledger };
    save();
  };

  const resetUsageLedger = () => {
    state = { ...state, usageLedger: { resetAt: Date.now(), days: {} } };
    save();
  };

  const getUsageSummary = (range = '7d') => {
    const ledger = sanitizeUsageLedger(state.usageLedger);
    const keys = listUsageDayKeys(range, ledger);
    const calcCost = (id, usage) => {
      const cost = window.APP_CONFIG?.calcTokenUsageCost?.(id, usage);
      const n = Number(cost);
      return Number.isFinite(n) && n > 0 ? n : 0;
    };
    const days = keys.map((key) => {
      const models = ledger.days[key] || {};
      let prompt = 0;
      let completion = 0;
      let cost = 0;
      for (const [modelId, usage] of Object.entries(models)) {
        prompt += usage.prompt || 0;
        completion += usage.completion || 0;
        cost += calcCost(modelId, usage);
      }
      return { key, prompt, completion, cost };
    });
    const byModel = {};
    for (const key of keys) {
      const models = ledger.days[key] || {};
      for (const [modelId, usage] of Object.entries(models)) {
        byModel[modelId] = addUsageDelta(byModel[modelId], usage);
      }
    }
    const models = Object.entries(byModel).map(([id, usage]) => ({
      id,
      prompt: usage.prompt,
      completion: usage.completion,
      cost: calcCost(id, usage)
    })).sort((a, b) => (b.cost - a.cost) || ((b.prompt + b.completion) - (a.prompt + a.completion)));
    const totals = days.reduce((acc, d) => ({
      prompt: acc.prompt + d.prompt,
      completion: acc.completion + d.completion,
      cost: acc.cost + d.cost
    }), { prompt: 0, completion: 0, cost: 0 });
    return { range, days, models, totals, resetAt: ledger.resetAt };
  };

  let state = defaultState();
  let loaded = false;
  let usingIdbBackend = false;
  let heavySavePending = false;
  let idbPromise = null;
  let idbWriteChain = Promise.resolve();

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
    let migrated = false;
    const setField = (key, value) => {
      if (state[key] !== value) {
        state[key] = value;
        migrated = true;
      }
    };

    const validIds = window.APP_CONFIG.MODELS.map((m) => m.id);
    if (!validIds.includes(state.currentModel)) {
      let next = window.APP_CONFIG.DEFAULT_MODEL;
      if (/^gemini-/.test(state.currentModel) && validIds.includes('gemini-3.8-flash')) {
        next = 'gemini-3.8-flash';
      } else if (/^openrouter-gemini-/.test(state.currentModel) && validIds.includes('openrouter-gemini-3.8-flash')) {
        next = 'openrouter-gemini-3.8-flash';
      } else if (state.currentModel === 'openrouter-mistral-small-4' && validIds.includes('openrouter-deepseek-v4.1-flash')) {
        next = 'openrouter-deepseek-v4.1-flash';
      } else if (state.currentModel === 'gpt-5.4-mini' && validIds.includes('gpt-5.6-luna')) {
        next = 'gpt-5.6-luna';
      } else if (state.currentModel === 'gpt-5.4' && validIds.includes('gpt-5.6-terra')) {
        next = 'gpt-5.6-terra';
      } else if (state.currentModel === 'gpt-5.5' && validIds.includes('gpt-5.6-sol')) {
        next = 'gpt-5.6-sol';
      } else if (state.currentModel === 'claude-sonnet-4-6' && validIds.includes('claude-sonnet-5')) {
        next = 'claude-sonnet-5';
      } else if (state.currentModel === 'openrouter-claude-haiku-4-5' && validIds.includes('openrouter-claude-haiku-latest')) {
        next = 'openrouter-claude-haiku-latest';
      } else if (state.currentModel === 'openrouter-claude-sonnet-5' && validIds.includes('openrouter-claude-sonnet-latest')) {
        next = 'openrouter-claude-sonnet-latest';
      } else if (state.currentModel === 'openrouter-claude-opus-5' && validIds.includes('openrouter-claude-opus-latest')) {
        next = 'openrouter-claude-opus-latest';
      }
      setField('currentModel', next);
    }
    const validLangs = window.APP_CONFIG.TRANSLATE_LANGUAGES.map((l) => l.code);
    if (!validLangs.includes(state.translateTargetLang)) {
      setField('translateTargetLang', window.APP_CONFIG.DEFAULT_TRANSLATE_LANG);
    }
    const validRatios = window.APP_CONFIG.IMAGE_GEN_RATIOS.map((r) => r.id);
    if (!validRatios.includes(state.imageGenRatio)) {
      setField('imageGenRatio', window.APP_CONFIG.DEFAULT_IMAGE_GEN_RATIO);
    }
    const validStyles = window.APP_CONFIG.IMAGE_GEN_STYLES.map((s) => s.id);
    if (!validStyles.includes(state.imageGenStyle)) {
      setField('imageGenStyle', window.APP_CONFIG.DEFAULT_IMAGE_GEN_STYLE);
    }
    const validTemplates = window.APP_CONFIG.IMAGE_GEN_TEMPLATES.map((t) => t.id);
    if (!validTemplates.includes(state.imageGenTemplate)) {
      setField('imageGenTemplate', window.APP_CONFIG.DEFAULT_IMAGE_GEN_TEMPLATE);
    }
    const allEfforts = ['minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'default'];
    if (!allEfforts.includes(state.reasoningEffort)) {
      setField('reasoningEffort', window.APP_CONFIG.DEFAULT_EFFORT);
    }
    setField('reasoningEffort', window.APP_CONFIG.normalizeEffortForModel(state.reasoningEffort, state.currentModel));
    if (window.APP_CONFIG.modelUsesEffortLinkedThinking(state.currentModel)) {
      setField('thinkingEnabled', state.reasoningEffort !== 'default');
    }
    if (window.APP_CONFIG.modelThinkingRequired(state.currentModel)) {
      setField('thinkingEnabled', true);
    }
    if (!window.APP_CONFIG.LOCALES.includes(state.locale)) {
      setField('locale', window.APP_CONFIG.DEFAULT_LOCALE);
    }
    if (parsed && !('locale' in parsed) && parsed.conversations?.length) {
      setField('locale', 'vi');
    }
    if (!state.systemPromptMode) {
      setField('systemPromptMode', state.tokenSaveEnabled ? 'tokenSave' : 'default');
    }
    if (!window.I18n.SYSTEM_PROMPT_MODE_IDS.includes(state.systemPromptMode)) {
      setField('systemPromptMode', 'custom');
    }
    if (!state.customSystemPrompt?.trim()) {
      if (state.systemPromptMode === 'custom' && state.systemPrompt?.trim()) {
        setField('customSystemPrompt', state.systemPrompt);
      } else if (state.systemPrompt?.trim() && !window.I18n.isPresetSystemPrompt(state.systemPrompt)) {
        setField('customSystemPrompt', state.systemPrompt);
      }
    }
    if (state.systemPromptMode !== 'custom') {
      if (window.I18n.isPresetSystemPrompt(state.systemPrompt) || !state.systemPrompt?.trim()) {
        setField('systemPrompt', window.I18n.getSystemPromptForMode(state.systemPromptMode, state.locale));
      } else {
        setField('systemPromptMode', window.I18n.detectSystemPromptMode(state.systemPrompt, state.locale));
      }
    }
    if ('tokenSaveEnabled' in (parsed || {})) migrated = true;
    delete state.tokenSaveEnabled;
    const prevLedger = state.usageLedger;
    const sanitizedLedger = sanitizeUsageLedger(state.usageLedger);
    state.usageLedger = sanitizedLedger;
    if (JSON.stringify(prevLedger || null) !== JSON.stringify(sanitizedLedger)) migrated = true;
    return migrated;
  };

  const queueIdbSave = ({ silent = false } = {}) => {
    const run = idbWriteChain.then(async () => {
      await idbSet(state);
      writeLocalPointer();
      usingIdbBackend = true;
    });
    idbWriteChain = run.catch((err) => {
      console.error('IndexedDB save failed', err);
      if (!silent) notify(window.I18n.t('storageFail'), 'error');
    });
    return run;
  };

  const saveToIndexedDb = () => queueIdbSave();

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
      queueIdbSave().catch(() => {});
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
      openrouterApiKey: state.openrouterApiKey,
      geminiApiKey: state.geminiApiKey,
      kimiApiKey: state.kimiApiKey,
      currentModel: state.currentModel,
      systemPrompt: state.systemPrompt,
      theme: state.theme
    };
    save();
  };

  const persistNow = async () => {
    if (usingIdbBackend) {
      await queueIdbSave({ silent: true });
      return;
    }
    try {
      tryWriteLocalStorage(state);
    } catch (err) {
      if (!isQuotaError(err)) throw err;
      await queueIdbSave({ silent: true });
    }
  };

  const getBackend = () => (usingIdbBackend ? 'indexeddb' : 'localStorage');

  const BACKUP_APP = 'vutaso-ai';
  const BACKUP_KIND = 'backup';
  const BACKUP_VERSION = 1;
  const BACKUP_WARN_BYTES = 20 * 1024 * 1024;
  const BACKUP_MAX_BYTES = 120 * 1024 * 1024;
  const API_KEY_FIELDS = [
    'apiKey',
    'anthropicApiKey',
    'deepseekApiKey',
    'openrouterApiKey',
    'geminiApiKey',
    'kimiApiKey'
  ];

  const cloneJson = (value) => JSON.parse(JSON.stringify(value));

  const hasAnyApiKey = (obj) => API_KEY_FIELDS.some((field) => {
    const val = obj?.[field];
    return typeof val === 'string' && val.trim();
  });

  const stripApiKeys = (obj) => {
    const next = { ...obj };
    API_KEY_FIELDS.forEach((field) => { next[field] = ''; });
    delete next[BACKEND_FIELD];
    return next;
  };

  const copyApiKeys = (from, to) => {
    const next = { ...to };
    API_KEY_FIELDS.forEach((field) => { next[field] = from?.[field] || ''; });
    return next;
  };

  const countMessages = (conversations) => (conversations || []).reduce(
    (n, convo) => n + (Array.isArray(convo?.messages) ? convo.messages.length : 0),
    0
  );

  const sanitizeConversations = (list) => {
    if (!Array.isArray(list)) return [];
    const uuid = window.Utils?.uuid;
    return list
      .filter((convo) => convo && typeof convo === 'object')
      .map((convo) => {
        const id = typeof convo.id === 'string' && convo.id.trim()
          ? convo.id
          : (uuid ? uuid() : ('convo_' + Date.now().toString(36)));
        const messages = Array.isArray(convo.messages)
          ? convo.messages.filter((m) => m && typeof m === 'object')
          : [];
        return {
          ...convo,
          id,
          title: typeof convo.title === 'string' ? convo.title : '',
          createdAt: Number(convo.createdAt) || Date.now(),
          updatedAt: Number(convo.updatedAt) || Date.now(),
          messages
        };
      });
  };

  const sanitizeSnippets = (list) => {
    if (!Array.isArray(list)) return [];
    return list
      .filter((s) => s && typeof s === 'object')
      .map((s, i) => ({
        ...s,
        id: typeof s.id === 'string' && s.id.trim()
          ? s.id
          : ('snip_import_' + Date.now().toString(36) + '_' + i),
        title: typeof s.title === 'string' ? s.title : '',
        content: typeof s.content === 'string' ? s.content : '',
        preset: !!s.preset,
        createdAt: Number(s.createdAt) || Date.now(),
        updatedAt: Number(s.updatedAt) || Date.now()
      }))
      .filter((s) => s.title.trim() && s.content.trim());
  };

  const backupFilename = (includesApiKeys) => {
    const day = new Date().toISOString().slice(0, 10);
    return includesApiKeys
      ? 'vutaso-ai-backup-' + day + '-keys.json'
      : 'vutaso-ai-backup-' + day + '.json';
  };

  const buildBackup = ({ includeApiKeys = false } = {}) => {
    let snapshot = cloneJson(state);
    delete snapshot[BACKEND_FIELD];
    if (!includeApiKeys) snapshot = stripApiKeys(snapshot);
    const includesApiKeys = !!(includeApiKeys && hasAnyApiKey(snapshot));
    const conversations = sanitizeConversations(snapshot.conversations);
    const promptSnippets = sanitizeSnippets(snapshot.promptSnippets);
    snapshot.conversations = conversations;
    snapshot.promptSnippets = promptSnippets;
    return {
      app: BACKUP_APP,
      kind: BACKUP_KIND,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      includesApiKeys,
      stats: {
        conversations: conversations.length,
        messages: countMessages(conversations),
        snippets: promptSnippets.length
      },
      state: snapshot,
      filename: backupFilename(includesApiKeys)
    };
  };

  const parseBackup = (text) => {
    let data;
    try {
      data = JSON.parse(String(text || '').replace(/^\uFEFF/, ''));
    } catch {
      const err = new Error('invalid-json');
      err.code = 'invalid-json';
      throw err;
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      const err = new Error('invalid-format');
      err.code = 'invalid-format';
      throw err;
    }

    const asWrapped = (stateObj, extra = {}) => {
      if (!stateObj || typeof stateObj !== 'object' || Array.isArray(stateObj)) {
        const err = new Error('invalid-format');
        err.code = 'invalid-format';
        throw err;
      }
      const snapshot = cloneJson(stateObj);
      delete snapshot[BACKEND_FIELD];
      snapshot.conversations = sanitizeConversations(snapshot.conversations);
      snapshot.promptSnippets = sanitizeSnippets(snapshot.promptSnippets);
      return {
        app: BACKUP_APP,
        kind: BACKUP_KIND,
        version: Number(extra.version) || BACKUP_VERSION,
        exportedAt: extra.exportedAt || null,
        includesApiKeys: extra.includesApiKeys === true || hasAnyApiKey(snapshot),
        stats: {
          conversations: snapshot.conversations.length,
          messages: countMessages(snapshot.conversations),
          snippets: snapshot.promptSnippets.length
        },
        state: snapshot
      };
    };

    if (data.app === BACKUP_APP || data.kind === BACKUP_KIND) {
      return asWrapped(data.state, data);
    }
    if (Array.isArray(data.conversations) || Array.isArray(data.promptSnippets)) {
      return asWrapped(data);
    }
    const err = new Error('invalid-format');
    err.code = 'invalid-format';
    throw err;
  };

  const resolveCurrentConversationId = (preferredId) => {
    const list = state.conversations || [];
    if (preferredId && list.some((c) => c.id === preferredId)) {
      state.currentConversationId = preferredId;
      return;
    }
    if (state.currentConversationId && list.some((c) => c.id === state.currentConversationId)) return;
    state.currentConversationId = list[0]?.id || null;
  };

  const persistBackupOrRollback = async (previous, previousIdb) => {
    try {
      await persistNow();
    } catch (err) {
      applyLoadedState(previous);
      usingIdbBackend = previousIdb;
      try { await persistNow(); } catch {}
      const fail = new Error('save-failed');
      fail.code = 'save-failed';
      fail.cause = err;
      throw fail;
    }
  };

  const applyBackup = async (backup, { mode = 'replace', restoreApiKeys = false } = {}) => {
    if (!backup?.state || typeof backup.state !== 'object') {
      const err = new Error('invalid-format');
      err.code = 'invalid-format';
      throw err;
    }

    const previous = cloneJson(state);
    const previousIdb = usingIdbBackend;
    const incoming = cloneJson(backup.state);
    incoming.conversations = sanitizeConversations(incoming.conversations);
    incoming.promptSnippets = sanitizeSnippets(incoming.promptSnippets);
    const currentKeys = {};
    API_KEY_FIELDS.forEach((field) => { currentKeys[field] = state[field] || ''; });
    const incomingHasKeys = hasAnyApiKey(incoming);
    const useIncomingKeys = restoreApiKeys && incomingHasKeys;

    if (mode === 'merge') {
      const existingConvoIds = new Set((state.conversations || []).map((c) => c.id));
      const addedConversations = incoming.conversations.filter((c) => !existingConvoIds.has(c.id));
      const existingSnippetIds = new Set((state.promptSnippets || []).map((s) => s.id));
      const addedSnippets = incoming.promptSnippets.filter((s) => !existingSnippetIds.has(s.id));
      const keepCurrentId = state.currentConversationId;
      const beforeLedger = sanitizeUsageLedger(state.usageLedger);
      const mergedLedger = mergeUsageLedgers(state.usageLedger, incoming.usageLedger);
      const usageChanged = JSON.stringify(beforeLedger) !== JSON.stringify(mergedLedger);
      const merged = {
        ...state,
        conversations: [...addedConversations, ...(state.conversations || [])],
        promptSnippets: [...(state.promptSnippets || []), ...addedSnippets],
        promptSnippetsSeeded: true,
        usageLedger: mergedLedger
      };
      applyLoadedState(copyApiKeys(useIncomingKeys ? incoming : currentKeys, merged));
      resolveCurrentConversationId(keepCurrentId || addedConversations[0]?.id || null);
      await persistBackupOrRollback(previous, previousIdb);
      return {
        mode: 'merge',
        conversations: addedConversations.length,
        snippets: addedSnippets.length,
        restoredApiKeys: useIncomingKeys,
        usageChanged
      };
    }

    const next = copyApiKeys(useIncomingKeys ? incoming : currentKeys, incoming);
    if (!next.currentConversationId || !next.conversations.some((c) => c.id === next.currentConversationId)) {
      next.currentConversationId = next.conversations[0]?.id || null;
    }
    if (!('promptSnippetsSeeded' in next)) next.promptSnippetsSeeded = next.promptSnippets.length > 0;
    applyLoadedState(next);
    resolveCurrentConversationId(next.currentConversationId);
    await persistBackupOrRollback(previous, previousIdb);
    return {
      mode: 'replace',
      conversations: (state.conversations || []).length,
      snippets: (state.promptSnippets || []).length,
      restoredApiKeys: useIncomingKeys
    };
  };

  return {
    load, save, get, set, resetAll, getBackend,
    buildBackup, parseBackup, applyBackup,
    recordUsage, resetUsageLedger, getUsageSummary,
    BACKUP_WARN_BYTES, BACKUP_MAX_BYTES
  };
})();
