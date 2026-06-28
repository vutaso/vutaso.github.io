(() => {
  const applyTheme = () => {
    try {
      const raw = localStorage.getItem('testchatai');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.theme === 'light' || data.theme === 'dark') {
        document.documentElement.setAttribute('data-theme', data.theme);
        const mc = document.querySelector('meta[name="theme-color"]');
        if (mc) mc.setAttribute('content', data.theme === 'dark' ? '#0c0c0e' : '#f8f9fc');
      }
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
