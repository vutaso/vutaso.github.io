(() => {
  const applyTheme = () => {
    try {
      const raw = localStorage.getItem('testchatai');
      if (!raw) return;
      const data = JSON.parse(raw);
      const dark = new Set(['dark', 'vs-dark', 'apple-dark', 'cyberpunk', 'nvidia', 'liquid-glass', 'claude-dark']);
      const theme = dark.has(data.theme) ? 'claude-dark' : 'claude';
      document.documentElement.setAttribute('data-theme', theme);
      const mc = document.querySelector('meta[name="theme-color"]');
      if (mc) mc.setAttribute('content', theme === 'claude-dark' ? '#262624' : '#faf9f5');
    } catch {}
  };

  const render = () => {
    const page = document.body?.dataset?.legalPage;
    if (page && window.LegalContent) {
      window.LegalContent.renderPage(page).catch(() => {});
    }
  };

  applyTheme();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
