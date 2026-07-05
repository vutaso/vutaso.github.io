/* ==================== RIPPLE (no-op) ==================== */
function addRipple() { }

/* ==================== SHOWCASE TABS ==================== */
function switchTab(id) {
  document.querySelectorAll('.showcase-tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-tab') === id);
  });
  document.querySelectorAll('.showcase-panel').forEach(p => {
    p.classList.toggle('active', p.id === 'panel-' + id);
  });
}

/* ==================== NAVBAR SCROLL ==================== */
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 60);
});

/* ==================== MOBILE MENU ==================== */
function toggleMob() {
  document.getElementById('ham').classList.toggle('open');
  document.getElementById('mob').classList.toggle('open');
}
function closeMob() {
  document.getElementById('ham').classList.remove('open');
  document.getElementById('mob').classList.remove('open');
  const mobUtils = document.getElementById('mob-utils-wrap');
  if (mobUtils) {
    mobUtils.classList.remove('open');
    mobUtils.querySelector('.mob-utils-toggle')?.setAttribute('aria-expanded', 'false');
  }
}

function toggleMobUtils() {
  const wrap = document.getElementById('mob-utils-wrap');
  if (!wrap) return;
  const open = wrap.classList.toggle('open');
  wrap.querySelector('.mob-utils-toggle')?.setAttribute('aria-expanded', open);
}

(function initNavDropdown() {
  const dd = document.getElementById('nav-utils');
  if (!dd) return;
  const btn = dd.querySelector('.n-drop-toggle');
  const menu = dd.querySelector('.n-drop-menu');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = dd.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });

  menu.addEventListener('click', (e) => e.stopPropagation());

  document.addEventListener('click', () => {
    dd.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dd.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
})();

/* ==================== FAQ ==================== */
function toggleFaq(btn) {
  const item = btn.parentElement;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => {
    i.classList.remove('open');
  });
  if (!isOpen) {
    item.classList.add('open');
  }
}

/* ==================== I18N ==================== */
function switchLang(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (VUTASO_HOME_I18N[lang] && VUTASO_HOME_I18N[lang][key]) {
      el.innerHTML = VUTASO_HOME_I18N[lang][key];
    }
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });
  document.documentElement.lang = lang;
  localStorage.setItem('vutaso-lang', lang);
}

// Auto-detect: saved preference → browser language → default vi
(function initLang() {
  const saved = localStorage.getItem('vutaso-lang');
  if (saved && (saved === 'vi' || saved === 'en')) {
    switchLang(saved);
    return;
  }
  const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
  const lang = browserLang.startsWith('vi') ? 'vi' : 'en';
  switchLang(lang);
})();
