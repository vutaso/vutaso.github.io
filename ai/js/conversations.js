window.Conversations = (() => {
  const {
    uuid, normalizeSearchQuery, buildSearchFold, includesSearchFold, buildSearchSnippet
  } = window.Utils;
  const { get, set } = window.Storage;

  const MAX_MESSAGE_SEARCH_CHARS = 8000;

  let searchIndexCache = null;
  let searchIndexKey = '';
  let searchIndexById = null;

  const getAll = () => get().conversations || [];

  const getById = (id) => getAll().find(c => c.id === id) || null;

  const isPersisted = (id) => getAll().some((c) => c.id === id);

  const getCurrent = () => {
    const s = get();
    return s.currentConversationId ? getById(s.currentConversationId) : null;
  };

  const getModel = (convo) => {
    if (!convo) return window.Storage.get().currentModel || window.APP_CONFIG.DEFAULT_MODEL;
    const validIds = window.APP_CONFIG.MODELS.map((m) => m.id);
    if (convo.model && validIds.includes(convo.model)) return convo.model;
    return window.Storage.get().currentModel || window.APP_CONFIG.DEFAULT_MODEL;
  };

  const setModel = (id, modelId) => {
    const validIds = window.APP_CONFIG.MODELS.map((m) => m.id);
    const next = validIds.includes(modelId) ? modelId : window.APP_CONFIG.DEFAULT_MODEL;
    const all = getAll().map((c) => c.id === id ? { ...c, model: next, updatedAt: Date.now() } : c);
    set({ conversations: all });
  };

  const messageSearchText = (message) => {
    if (!message) return '';
    if (message.role === 'assistant') return getAssistantContent(message);
    return message.content || messagePreviewText(message);
  };

  const foldSearchText = (text) => {
    const source = String(text || '');
    const capped = source.length > MAX_MESSAGE_SEARCH_CHARS
      ? source.slice(0, MAX_MESSAGE_SEARCH_CHARS)
      : source;
    return buildSearchFold(capped);
  };

  const getSearchIndexKey = () => {
    const all = getAll();
    let key = String(all.length);
    for (const c of all) {
      key += '|' + c.id + ':' + c.updatedAt + ':' + c.messages.length;
    }
    return key;
  };

  const getSearchIndex = () => {
    const key = getSearchIndexKey();
    if (searchIndexCache && searchIndexKey === key) return searchIndexCache;
    searchIndexKey = key;
    searchIndexById = new Map();
    searchIndexCache = getAll().map((convo) => {
      const model = window.APP_CONFIG.getModel(getModel(convo));
      const entry = {
        convo,
        titleFold: foldSearchText(convo.title || ''),
        modelLabelFold: foldSearchText(model.label),
        modelIdFold: foldSearchText(model.id),
        messageFolds: convo.messages.map((m) => foldSearchText(messageSearchText(m)))
      };
      searchIndexById.set(convo.id, entry);
      return entry;
    });
    return searchIndexCache;
  };

  const getSearchEntry = (convoId) => {
    getSearchIndex();
    return searchIndexById.get(convoId) || null;
  };

  const matchSearchEntry = (entry, normQuery) => {
    if (includesSearchFold(entry.titleFold, normQuery)) {
      return { snippet: '' };
    }
    if (includesSearchFold(entry.modelLabelFold, normQuery)) {
      return { snippet: entry.modelLabelFold.source };
    }
    if (includesSearchFold(entry.modelIdFold, normQuery)) {
      return { snippet: entry.modelLabelFold.source };
    }
    for (const fold of entry.messageFolds) {
      if (includesSearchFold(fold, normQuery)) {
        return { snippet: buildSearchSnippet(fold, normQuery) };
      }
    }
    return null;
  };

  const searchConversations = (query) => {
    const normQuery = normalizeSearchQuery(query);
    if (!normQuery) {
      return getAll().map((convo) => ({ convo, snippet: '' }));
    }
    const results = [];
    for (const entry of getSearchIndex()) {
      const match = matchSearchEntry(entry, normQuery);
      if (match) results.push({ convo: entry.convo, snippet: match.snippet });
    }
    return results;
  };

  const matchesSearch = (convo, query) => {
    const normQuery = normalizeSearchQuery(query);
    if (!normQuery) return true;
    const entry = getSearchEntry(convo.id);
    return entry ? !!matchSearchEntry(entry, normQuery) : false;
  };

  const filterBySearch = (query) => searchConversations(query).map((r) => r.convo);

  const getSearchSnippet = (convo, query) => {
    const normQuery = normalizeSearchQuery(query);
    if (!normQuery) return '';
    const entry = getSearchEntry(convo.id);
    if (!entry || includesSearchFold(entry.titleFold, normQuery)) return '';
    return matchSearchEntry(entry, normQuery)?.snippet || '';
  };

  const create = (modelId) => {
    const model = modelId || window.Storage.get().currentModel || window.APP_CONFIG.DEFAULT_MODEL;
    const convo = {
      id: uuid(),
      title: window.I18n.t('newConversation'),
      model,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    };
    const all = [convo, ...getAll()];
    set({ conversations: all, currentConversationId: convo.id });
    return convo;
  };

  const ensure = () => {
    let c = getCurrent();
    if (!c) c = create();
    return c;
  };

  const select = (id) => {
    if (!getById(id)) return null;
    set({ currentConversationId: id });
    return getById(id);
  };

  const remove = (id) => {
    const all = getAll().filter(c => c.id !== id);
    const cur = get().currentConversationId;
    let nextCur = cur;
    if (cur === id) nextCur = all[0] ? all[0].id : null;
    set({ conversations: all, currentConversationId: nextCur });
    return nextCur;
  };

  const rename = (id, title) => {
    const all = getAll().map(c => c.id === id ? { ...c, title: title || c.title, updatedAt: Date.now() } : c);
    set({ conversations: all });
  };

  const messagePreviewText = (message) => {
    if (message.content && message.content.trim()) return message.content;
    if (message.files && message.files.length) return message.files[0].name;
    if (message.images && message.images.length) return 'Hình ảnh';
    return '';
  };

  const updateTitleFromFirst = (convo, firstUserText) => {
    const text = (firstUserText || '').trim();
    if (text) convo.title = text;
  };

  const addMessage = (convo, message) => {
    if (!isPersisted(convo.id)) return;
    convo.messages.push(message);
    convo.updatedAt = Date.now();
    if (convo.messages.length === 1 && message.role === 'user') {
      updateTitleFromFirst(convo, messagePreviewText(message));
    }
    const all = getAll().map(c => c.id === convo.id ? convo : c);
    set({ conversations: all });
  };

  const saveConvo = (convo) => {
    if (!isPersisted(convo.id)) return;
    convo.updatedAt = Date.now();
    const all = getAll().map(c => c.id === convo.id ? convo : c);
    set({ conversations: all });
  };

  const getAssistantContent = (message) => {
    if (!message || message.role !== 'assistant') return '';
    if (message.variants && message.variants.length) {
      const i = message.variantIndex ?? 0;
      return message.variants[i] ?? message.variants[0] ?? '';
    }
    return message.content || '';
  };

  const initAssistantVariants = (message) => {
    if (!message || message.role !== 'assistant') return;
    if (!message.variants) {
      message.variants = [message.content || ''];
      message.variantIndex = 0;
    }
  };

  const updateMessage = (convo, messageIndex, patch) => {
    const msg = convo.messages[messageIndex];
    if (!msg) return;
    Object.assign(msg, patch);
    saveConvo(convo);
  };

  const prepareRetry = (convo, messageIndex) => {
    const msg = convo.messages[messageIndex];
    if (!msg || msg.role !== 'assistant') return null;
    convo.messages = convo.messages.slice(0, messageIndex + 1);
    initAssistantVariants(msg);
    msg.variants.push('');
    msg.variantIndex = msg.variants.length - 1;
    msg.content = '';
    msg.generatedImages = [];
    saveConvo(convo);
    return msg;
  };

  const setAssistantVariant = (convo, messageIndex, variantIndex) => {
    const msg = convo.messages[messageIndex];
    if (!msg || msg.role !== 'assistant') return;
    initAssistantVariants(msg);
    const next = Math.max(0, Math.min(variantIndex, msg.variants.length - 1));
    msg.variantIndex = next;
    msg.content = msg.variants[next] || '';
    saveConvo(convo);
  };

  const cancelRetryVariant = (convo, messageIndex) => {
    const msg = convo.messages[messageIndex];
    if (!msg || !msg.variants || msg.variants.length <= 1) return;
    if (msg.variants[msg.variantIndex] === '') {
      msg.variants.pop();
      msg.variantIndex = msg.variants.length - 1;
      msg.content = msg.variants[msg.variantIndex] || '';
      saveConvo(convo);
    }
  };

  const finalizeAssistantMessage = (convo, messageIndex, content, extra = {}) => {
    const msg = convo.messages[messageIndex];
    if (!msg) return;
    initAssistantVariants(msg);
    msg.variants[msg.variantIndex] = content;
    msg.content = content;
    msg.ts = Date.now();
    if (extra.generatedImages !== undefined) {
      msg.generatedImages = extra.generatedImages;
    }
    if (extra.reasoningContent) {
      msg.reasoningContent = extra.reasoningContent;
    } else {
      delete msg.reasoningContent;
    }
    if (extra.groundingMetadata) {
      msg.groundingMetadata = extra.groundingMetadata;
    } else {
      delete msg.groundingMetadata;
    }
    saveConvo(convo);
  };

  const editMessage = (convo, messageIndex, newContent) => {
    convo.messages[messageIndex].content = newContent;
    convo.messages[messageIndex].ts = Date.now();
    convo.messages = convo.messages.slice(0, messageIndex + 1);
    convo.updatedAt = Date.now();
    const all = getAll().map(c => c.id === convo.id ? convo : c);
    set({ conversations: all });
  };

  const deleteMessageFrom = (convo, messageIndex) => {
    convo.messages = convo.messages.slice(0, messageIndex);
    convo.updatedAt = Date.now();
    const all = getAll().map(c => c.id === convo.id ? convo : c);
    set({ conversations: all });
  };

  const emptyTokenUsage = () => ({ prompt: 0, completion: 0, total: 0 });

  const getTokenUsage = (convo, modelId) => {
    if (!convo?.tokenUsageByModel) return emptyTokenUsage();
    const usage = convo.tokenUsageByModel[modelId];
    if (!usage) return emptyTokenUsage();
    return {
      prompt: usage.prompt || 0,
      completion: usage.completion || 0,
      total: usage.total || (usage.prompt || 0) + (usage.completion || 0)
    };
  };

  const addTokenUsage = (convo, modelId, delta) => {
    if (!convo || !modelId || !delta) return;
    if (!isPersisted(convo.id)) return;
    if (!convo.tokenUsageByModel) convo.tokenUsageByModel = {};
    const prev = getTokenUsage(convo, modelId);
    convo.tokenUsageByModel[modelId] = {
      prompt: prev.prompt + (delta.prompt || 0),
      completion: prev.completion + (delta.completion || 0),
      total: prev.total + (delta.total || (delta.prompt || 0) + (delta.completion || 0))
    };
    saveConvo(convo);
  };

  const markCostWarningShown = (convo, modelId) => {
    if (!convo || !modelId || !isPersisted(convo.id)) return;
    if (!convo.costWarningShownByModel) convo.costWarningShownByModel = {};
    convo.costWarningShownByModel[modelId] = true;
    saveConvo(convo);
  };

  const isCostWarningShown = (convo, modelId) => {
    return !!(convo?.costWarningShownByModel?.[modelId]);
  };

  const clearAll = () => {
    set({ conversations: [], currentConversationId: null });
  };

  return {
    getAll, getById, getCurrent, create, ensure, select, remove, rename,
    getModel, setModel, getTokenUsage, addTokenUsage, isCostWarningShown, markCostWarningShown, matchesSearch, filterBySearch, searchConversations, getSearchSnippet,
    addMessage, updateMessage, editMessage, deleteMessageFrom, clearAll,
    getAssistantContent, prepareRetry, setAssistantVariant, cancelRetryVariant, finalizeAssistantMessage
  };
})();
