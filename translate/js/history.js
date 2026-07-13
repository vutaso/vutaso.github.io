const History = {
  STORAGE_KEY: 'translation_history',
  MAX_ITEMS: 100,
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
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    return history;
  },

  remove(id) {
    const history = this.getAll().filter(item => item.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    return history;
  },

  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
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
