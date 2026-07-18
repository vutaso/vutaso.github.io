const History = {
  STORAGE_KEY: 'translation_history',
  MAX_ITEMS: 100,
  // Last-resort size cap per text field when a single entry is too large
  // to fit into localStorage even on its own — it is stored truncated.
  FALLBACK_ENTRY_CHARS: 50000,
  _idCounter: 0,

  _nextId() {
    this._idCounter++;
    return `${Date.now()}_${this._idCounter}`;
  },

  getAll() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  add(entry) {
    const history = this.getAll();
    history.unshift({
      id: this._nextId(),
      sourceLang: entry.sourceLang,
      targetLang: entry.targetLang,
      sourceText: entry.sourceText,
      translatedText: entry.translatedText,
      timestamp: new Date().toISOString(),
      type: entry.type || 'text',
      domain: entry.domain || 'general'
    });
    if (history.length > this.MAX_ITEMS) {
      history.length = this.MAX_ITEMS;
    }
    this._save(history);
    return history;
  },

  remove(id) {
    const history = this.getAll().filter(item => item.id !== id);
    this._save(history);
    return history;
  },

  clear() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {
      // Storage unavailable — nothing to clear anyway
    }
  },

  // Client-side filtering for the History tab: free-text query matches
  // source/translation/language names (case-insensitive), type is an
  // exact match ('text' | 'file' | 'batch'), empty means "all".
  filter(items, { query = '', type = '' } = {}) {
    const q = query.trim().toLowerCase();
    return items.filter(item => {
      if (type && item.type !== type) return false;
      if (!q) return true;
      return (item.sourceText || '').toLowerCase().includes(q) ||
        (item.translatedText || '').toLowerCase().includes(q) ||
        (item.sourceLang || '').toLowerCase().includes(q) ||
        (item.targetLang || '').toLowerCase().includes(q);
    });
  },

  // Persist history without EVER throwing — a failed history write must
  // not surface as an error in the translation flow that triggered it.
  // When localStorage runs out of room (long translations pile up fast),
  // the oldest entries are evicted first; if a single entry is still too
  // large on its own, it is stored truncated as a last resort.
  _save(history) {
    let items = history.slice(0, this.MAX_ITEMS);

    while (items.length > 1) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
        return;
      } catch {
        // Evict the oldest half and try again
        items = items.slice(0, Math.ceil(items.length / 2));
      }
    }

    if (items.length === 1) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
        return;
      } catch {
        const item = { ...items[0] };
        if (item.sourceText && item.sourceText.length > this.FALLBACK_ENTRY_CHARS) {
          item.sourceText = item.sourceText.slice(0, this.FALLBACK_ENTRY_CHARS) + '…';
        }
        if (item.translatedText && item.translatedText.length > this.FALLBACK_ENTRY_CHARS) {
          item.translatedText = item.translatedText.slice(0, this.FALLBACK_ENTRY_CHARS) + '…';
        }
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify([item]));
        } catch {
          // Storage completely full/blocked — give up silently
        }
        return;
      }
    }

    // History is empty (or nothing fit) — store the empty list
    try {
      localStorage.setItem(this.STORAGE_KEY, '[]');
    } catch {
      // ignore
    }
  },

  formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
};
