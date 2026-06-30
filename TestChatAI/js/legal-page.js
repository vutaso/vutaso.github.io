(() => {
  const applyTheme = () => {
    try {
      const raw = localStorage.getItem('testchatai');
      if (!raw) return;
      const data = JSON.parse(raw);
      const themeColors = {
        dark: '#0c0c0e',
        'vs-dark': '#1e1e1e',
        apple: '#f5f5f7',
        'apple-dark': '#1c1c1e',
        'hello-kitty': '#fff5f9',
        cyberpunk: '#0a0a12',
        nvidia: '#0d0d0d',
        'liquid-glass': '#1a4a7a'
      };
      if (themeColors[data.theme]) {
        document.documentElement.setAttribute('data-theme', data.theme);
        const mc = document.querySelector('meta[name="theme-color"]');
        if (mc) mc.setAttribute('content', themeColors[data.theme]);
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
