/**
 * Analytics (Plausible / GA4) — loads when enabled in site.config.js
 */
const QRAnalytics = (() => {
  let loaded = false;

  function getPagePath() {
    try {
      const base = (window.SITE && SITE.basePath) || '/qr';
      const path = window.location.pathname || base;
      if (path.includes(base)) return path;
      return base.endsWith('/') ? base : base + '/';
    } catch {
      return '/qr/';
    }
  }

  function getDefaultProps() {
    return {
      app: 'qr',
      page_path: getPagePath(),
      page_location: window.location.href.split('?')[0]
    };
  }

  function mergeProps(props) {
    const merged = { ...getDefaultProps(), ...(props || {}) };
    const forPlausible = {};
    Object.entries(merged).forEach(([k, v]) => {
      forPlausible[k] = v == null ? '' : String(v);
    });
    return { merged, forPlausible };
  }

  function isEnabled() {
    const cfg = window.SITE && SITE.analytics;
    return cfg && cfg.provider && cfg.provider !== 'none';
  }

  function loadScript() {
    if (loaded || !isEnabled()) return;
    const cfg = SITE.analytics;

    if (cfg.provider === 'plausible' && cfg.plausibleDomain) {
      const s = document.createElement('script');
      s.defer = true;
      s.dataset.domain = cfg.plausibleDomain;
      s.src = cfg.scriptUrl || 'https://plausible.io/js/script.js';
      document.head.appendChild(s);
      loaded = true;
    }

    if (cfg.provider === 'ga4' && cfg.ga4Id) {
      const g = document.createElement('script');
      g.async = true;
      g.src = `https://www.googletagmanager.com/gtag/js?id=${cfg.ga4Id}`;
      document.head.appendChild(g);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { dataLayer.push(arguments); };
      gtag('js', new Date());
      gtag('config', cfg.ga4Id, {
        anonymize_ip: true,
        page_path: getPagePath(),
        page_location: window.location.href
      });
      loaded = true;
    }
  }

  function track(event, props) {
    if (!isEnabled()) return;
    const cfg = SITE.analytics;

    const { merged, forPlausible } = mergeProps(props);

    if (cfg.provider === 'plausible' && window.plausible) {
      window.plausible(event, { props: forPlausible });
    }
    if (cfg.provider === 'ga4' && window.gtag) {
      gtag('event', event, merged);
    }
  }

  function init() {
    if (!isEnabled()) return;
    loadScript();
    track('page_view', { page_title: document.title });
  }

  return { init, loadScript, track, getPagePath, getDefaultProps };
})();
