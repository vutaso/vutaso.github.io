window.Conversations = (() => {
  const { uuid, truncate } = window.Utils;
  const { get, set } = window.Storage;
  const MAX = window.APP_CONFIG.MAX_CONVERSATIONS;
  const MAX_TITLE = window.APP_CONFIG.MAX_TITLE_LENGTH;

  const getAll = () => get().conversations || [];

  const getById = (id) => getAll().find(c => c.id === id) || null;

  const getCurrent = () => {
    const s = get();
    return s.currentConversationId ? getById(s.currentConversationId) : null;
  };

  const create = () => {
    const convo = {
      id: uuid(),
      title: 'Cuộc trò chuyện mới',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    };
    const all = [convo, ...getAll()].slice(0, MAX);
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
    convo.title = truncate(firstUserText, MAX_TITLE);
  };

  const addMessage = (convo, message) => {
    convo.messages.push(message);
    convo.updatedAt = Date.now();
    if (convo.messages.length === 1 && message.role === 'user') {
      updateTitleFromFirst(convo, messagePreviewText(message));
    }
    const all = getAll().map(c => c.id === convo.id ? convo : c);
    set({ conversations: all });
  };

  const saveConvo = (convo) => {
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

  const finalizeAssistantMessage = (convo, messageIndex, content) => {
    const msg = convo.messages[messageIndex];
    if (!msg) return;
    initAssistantVariants(msg);
    msg.variants[msg.variantIndex] = content;
    msg.content = content;
    msg.ts = Date.now();
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

  const clearAll = () => {
    set({ conversations: [], currentConversationId: null });
  };

  return {
    getAll, getById, getCurrent, create, ensure, select, remove, rename,
    addMessage, updateMessage, editMessage, deleteMessageFrom, clearAll,
    getAssistantContent, prepareRetry, setAssistantVariant, cancelRetryVariant, finalizeAssistantMessage
  };
})();
