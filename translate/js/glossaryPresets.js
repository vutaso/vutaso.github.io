// Named glossary presets stored in localStorage. A preset maps a
// user-chosen name to a glossary text (same "English = Tiếng Việt"
// line format as the glossary textareas). All operations are fail-safe —
// a broken/full storage never throws into the UI flow.
const GlossaryPresets = {
  STORAGE_KEY: 'translation_glossary_presets',

  getAll() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      return data && typeof data === 'object' ? data : {};
    } catch {
      return {};
    }
  },

  save(name, text) {
    const all = this.getAll();
    all[name] = text;
    this._write(all);
  },

  remove(name) {
    const all = this.getAll();
    delete all[name];
    this._write(all);
  },

  _write(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage full/blocked — presets are a convenience, not critical
    }
  }
};
