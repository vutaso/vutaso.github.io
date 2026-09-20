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

  const PRESET_SLASH = {
    'preset-codeReview': ['review', 'code'],
    'preset-summarizeDoc': ['summary', 'summarize'],
    'preset-writeEmail': ['email', 'mail', 'write'],
    'preset-explainSimple': ['explain'],
    'preset-polishText': ['polish'],
  };

  const SLASH_SYNONYMS = {
    summarize: ['summary'],
    summary: ['summarize'],
    mail: ['email'],
    email: ['mail'],
  };

  const unique = (items) => {
    const seen = new Set();
    const out = [];
    items.forEach((item) => {
      if (!item || seen.has(item)) return;
      seen.add(item);
      out.push(item);
    });
    return out;
  };

  const foldText = (text) => {
    const fold = window.Utils?.normalizeSearchQuery;
    return fold ? fold(text) : String(text || '').toLowerCase().trim();
  };

  const wordsFromTitle = (title) => {
    const norm = foldText(title);
    return norm.match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) || [];
  };

  const getSlashAliases = (snippet) => {
    if (!snippet) return [];
    const aliases = [];
    const preset = PRESET_SLASH[snippet.id];
    if (preset) aliases.push(...preset);
    const words = wordsFromTitle(snippet.title);
    aliases.push(...words);
    words.forEach((word) => {
      const extra = SLASH_SYNONYMS[word];
      if (extra) aliases.push(...extra);
    });
    return unique(aliases.filter((a) => a.length >= 2));
  };

  const getSlashCommand = (snippet) => getSlashAliases(snippet)[0] || '';

  const aliasMatchesQuery = (aliases, q) => {
    if (!q) return false;
    return aliases.some((a) => a.startsWith(q) || (q.startsWith(a) && a.length >= 3));
  };

  const slashRank = (snippet, q, titleQuery) => {
    if (!q && !titleQuery) return 1;
    const aliases = getSlashAliases(snippet);
    if (q && aliases.some((a) => a === q)) return 0;
    if (q && aliases.some((a) => a.startsWith(q))) return 1;
    if (q && q.length >= 2 && window.Utils?.includesSearch?.(snippet.title, q)) return 2;
    if (titleQuery && window.Utils?.includesSearch?.(snippet.title, titleQuery)) return 2;
    return 3;
  };

  const searchBySlash = (query) => {
    const raw = String(query || '').trim();
    const q = foldText(raw).replace(/[^a-z0-9-]/g, '');
    const list = getAll();
    if (!raw) return list.slice();
    const titleQuery = q ? '' : raw;
    const matched = list.filter((s) => {
      const aliases = getSlashAliases(s);
      if (q && aliasMatchesQuery(aliases, q)) return true;
      if (q && q.length >= 2 && window.Utils?.includesSearch?.(s.title, q)) return true;
      if (titleQuery && window.Utils?.includesSearch?.(s.title, titleQuery)) return true;
      return false;
    });
    matched.sort((a, b) => {
      const rank = slashRank(a, q, titleQuery) - slashRank(b, q, titleQuery);
      if (rank) return rank;
      return String(a.title || '').localeCompare(String(b.title || ''));
    });
    return matched;
  };

  return {
    ensureSeeded,
    getAll,
    getById,
    add,
    update,
    remove,
    search,
    getSlashCommand,
    getSlashAliases,
    searchBySlash,
  };
})();
