/**
 * QR History — save & restore recent codes (localStorage)
 */
const QRHistory = (() => {
  const KEY = 'qr-history';
  const MAX = 10;

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
      return [];
    }
  }

  function save(list) {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  }

  function add(entry) {
    const list = load().filter((item) =>
      !(item.typeId === entry.typeId && item.encoded === entry.encoded)
    );
    list.unshift({ ...entry, ts: Date.now() });
    save(list);
    render();
  }

  function remove(index) {
    const list = load();
    list.splice(index, 1);
    save(list);
    render();
  }

  function clear() {
    localStorage.removeItem(KEY);
    render();
  }

  function render() {
    const container = document.getElementById('history-list');
    if (!container) return;

    const list = load();
    if (!list.length) {
      container.innerHTML = '<p class="history-empty">No recent QR codes yet.</p>';
      return;
    }

    container.innerHTML = list.map((item, i) => {
      const type = getTypeById(item.typeId);
      const label = type ? type.label : item.typeId;
      const preview = (item.encoded || '').slice(0, 40);
      const encLen = (item.encoded || '').length;
      const time = new Date(item.ts).toLocaleDateString();
      return `
        <button type="button" class="history-item" data-index="${i}">
          <span class="history-item__type">${label}</span>
          <span class="history-item__text">${escapeHtml(preview)}${encLen > 40 ? '…' : ''}</span>
          <span class="history-item__date">${time}</span>
        </button>
      `;
    }).join('');

    container.querySelectorAll('.history-item').forEach((btn) => {
      btn.addEventListener('click', () => restore(parseInt(btn.dataset.index, 10)));
    });
  }

  function restore(index) {
    const item = load()[index];
    if (!item || typeof window.__restoreQR !== 'function') return;
    window.__restoreQR(item);
    QRAnalytics.track('history_restore');
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function init() {
    render();
    document.getElementById('history-clear')?.addEventListener('click', clear);
  }

  return { add, remove, clear, render, init, load };
})();
