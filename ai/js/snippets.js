window.Snippets = (() => {
  const PRESET_DEFS = [
    { id: 'preset-codeReview', titleKey: 'snippetPresetCodeReviewTitle', contentKey: 'snippetPresetCodeReviewContent' },
    { id: 'preset-summarizeDoc', titleKey: 'snippetPresetSummarizeDocTitle', contentKey: 'snippetPresetSummarizeDocContent' },
    { id: 'preset-writeEmail', titleKey: 'snippetPresetWriteEmailTitle', contentKey: 'snippetPresetWriteEmailContent' },
    { id: 'preset-explainSimple', titleKey: 'snippetPresetExplainSimpleTitle', contentKey: 'snippetPresetExplainSimpleContent' },
    { id: 'preset-polishText', titleKey: 'snippetPresetPolishTextTitle', contentKey: 'snippetPresetPolishTextContent' },
  ];

  const newId = () => 'snip_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);

  const getPresetDefinitions = () => PRESET_DEFS.map((def) => ({
    id: def.id,
    title: window.I18n.t(def.titleKey),
    content: window.I18n.t(def.contentKey),
    preset: true,
  }));

  const ensureSeeded = () => {
    const state = window.Storage.get();
    if (state.promptSnippetsSeeded) return;
    const now = Date.now();
    const snippets = getPresetDefinitions().map((s) => ({
      id: s.id,
      title: s.title,
      content: s.content,
      preset: true,
      createdAt: now,
      updatedAt: now,
    }));
    window.Storage.set({ promptSnippets: snippets, promptSnippetsSeeded: true });
  };

  const getAll = () => {
    const list = window.Storage.get().promptSnippets;
    return Array.isArray(list) ? list : [];
  };

  const saveAll = (snippets) => {
    window.Storage.set({ promptSnippets: snippets });
  };

  const getById = (id) => getAll().find((s) => s.id === id) || null;

  const add = ({ title, content }) => {
    const trimmedTitle = (title || '').trim();
    const trimmedContent = (content || '').trim();
    if (!trimmedTitle || !trimmedContent) return null;
    const now = Date.now();
    const snippet = {
      id: newId(),
      title: trimmedTitle,
      content: trimmedContent,
      preset: false,
      createdAt: now,
      updatedAt: now,
    };
    saveAll([snippet, ...getAll()]);
    return snippet;
  };

  const update = (id, { title, content }) => {
    const trimmedTitle = (title || '').trim();
    const trimmedContent = (content || '').trim();
    if (!id || !trimmedTitle || !trimmedContent) return false;
    const list = getAll();
    const idx = list.findIndex((s) => s.id === id);
    if (idx < 0) return false;
    list[idx] = {
      ...list[idx],
      title: trimmedTitle,
      content: trimmedContent,
      updatedAt: Date.now(),
    };
    saveAll(list);
    return true;
  };

  const remove = (id) => {
    if (!id) return false;
    const next = getAll().filter((s) => s.id !== id);
    if (next.length === getAll().length) return false;
    saveAll(next);
    return true;
  };

  const search = (query) => {
    const q = (query || '').trim().toLowerCase();
    const list = getAll();
    if (!q) return list;
    return list.filter((s) =>
      s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
    );
  };

  return {
    ensureSeeded,
    getAll,
    getById,
    add,
    update,
    remove,
    search,
  };
})();
