/**
 * Analytics + cookie consent (Plausible / GA4)
 */
const QRAnalytics = (() => {
  const CONSENT_KEY = 'qr-cookie-consent';
  let loaded = false;

  function hasConsent() {
    return localStorage.getItem(CONSENT_KEY) === 'accepted';
  }

  function loadScript() {
    if (loaded || !hasConsent()) return;
    const cfg = window.SITE && SITE.analytics;
    if (!cfg || cfg.provider === 'none') return;

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
      gtag('config', cfg.ga4Id, { anonymize_ip: true });
      loaded = true;
    }
  }

  function track(event, props) {
    if (!hasConsent()) return;
    const cfg = window.SITE && SITE.analytics;
    if (!cfg || cfg.provider === 'none') return;

    if (cfg.provider === 'plausible' && window.plausible) {
      window.plausible(event, props ? { props } : undefined);
    }
    if (cfg.provider === 'ga4' && window.gtag) {
      gtag('event', event, props || {});
    }
  }

  function initBanner() {
    const banner = document.getElementById('cookie-banner');
    if (!banner) return;

    if (hasConsent()) {
      loadScript();
      banner.hidden = true;
      return;
    }

    banner.hidden = false;

    document.getElementById('cookie-accept').addEventListener('click', () => {
      localStorage.setItem(CONSENT_KEY, 'accepted');
      banner.hidden = true;
      loadScript();
      track('cookie_consent', { action: 'accept' });
    });

    document.getElementById('cookie-decline').addEventListener('click', () => {
      localStorage.setItem(CONSENT_KEY, 'declined');
      banner.hidden = true;
    });
  }

  return { initBanner, loadScript, track, hasConsent };
})();
