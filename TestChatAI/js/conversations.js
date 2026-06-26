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

  const updateTitleFromFirst = (convo, firstUserText) => {
    convo.title = truncate(firstUserText, MAX_TITLE);
  };

  const addMessage = (convo, message) => {
    convo.messages.push(message);
    convo.updatedAt = Date.now();
    if (convo.messages.length === 1 && message.role === 'user') {
      updateTitleFromFirst(convo, message.content);
    }
    const all = getAll().map(c => c.id === convo.id ? convo : c);
    set({ conversations: all });
  };

  const updateLastMessage = (convo, patch) => {
    if (!convo.messages.length) return;
    const last = convo.messages[convo.messages.length - 1];
    Object.assign(last, patch);
    convo.updatedAt = Date.now();
    const all = getAll().map(c => c.id === convo.id ? convo : c);
    set({ conversations: all });
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

  return { getAll, getById, getCurrent, create, ensure, select, remove, rename, addMessage, updateLastMessage, editMessage, deleteMessageFrom, clearAll };
})();
