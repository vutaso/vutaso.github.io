/* ============================================================
   NAVBAR
   ============================================================ */
window.addEventListener('scroll', () => {
  const nav = document.getElementById('nav');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

function toggleMob() {
  const ham = document.getElementById('ham');
  const mob = document.getElementById('mob');
  if (!ham || !mob) return;
  ham.classList.toggle('open');
  mob.classList.toggle('open');
  document.body.style.overflow = mob.classList.contains('open') ? 'hidden' : '';
}

function closeMob() {
  const ham = document.getElementById('ham');
  const mob = document.getElementById('mob');
  if (!ham || !mob) return;
  ham.classList.remove('open');
  mob.classList.remove('open');
  document.body.style.overflow = '';
}

/* ============================================================
   HERO TITLE
   ============================================================ */
function initHero() {
  const saved = localStorage.getItem('vutaso-lang');
  const lang = saved || ((navigator.language || '').toLowerCase().startsWith('vi') ? 'vi' : 'en');
  const phrases = typeof MB_TW !== 'undefined' ? (MB_TW[lang] || MB_TW['vi']) : ['Quản lý chi tiêu thông minh hơn'];
  window._twPhrases = phrases;
  const el = document.getElementById('tw-el');
  if (el) el.innerHTML = '<span class="gtext">' + phrases[0] + '</span>';
  buildPhoneChart();
}

function buildPhoneChart() {
  const c = document.getElementById('ph-chart');
  if (!c) return;
  const hs = [35, 50, 42, 68, 48, 82, 58, 72];
  c.innerHTML = '';
  hs.forEach((h) => {
    const b = document.createElement('div');
    b.className = 'ph-bar' + (h >= 75 ? ' hi' : '');
    b.style.height = h + '%';
    c.appendChild(b);
  });
}

initHero();

/* ============================================================
   RIPPLE
   ============================================================ */
function addRipple(e, btn) {
  const rect = btn.getBoundingClientRect();
  const r = document.createElement('span');
  r.className = 'ripple';
  const size = Math.max(rect.width, rect.height) * 2;
  r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
  btn.appendChild(r);
  setTimeout(() => r.remove(), 700);
}

document.querySelectorAll('.btn-main,.btn-ghost,.btn-nav,.pbtn,.btn-store').forEach(b => {
  b.addEventListener('click', e => addRipple(e, b));
});

/* ============================================================
   SCROLL REVEAL
   ============================================================ */
const ro = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target;
    const d = parseInt(el.dataset.delay || 0, 10);
    setTimeout(() => {
      el.classList.add('vis');
      el.querySelectorAll('.cu').forEach(triggerCU);
    }, d);
    ro.unobserve(el);
  });
}, { threshold: 0.13 });

document.querySelectorAll('.rev').forEach(el => ro.observe(el));

/* ============================================================
   COUNT UP
   ============================================================ */
function triggerCU(el) {
  if (el.dataset.done) return;
  el.dataset.done = '1';
  const target = parseFloat(el.dataset.t);
  const dur = 1800;
  const start = performance.now();
  function upd(now) {
    const prog = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - prog, 3);
    const val = target * ease;
    el.textContent = target >= 10000
      ? Math.floor(val).toLocaleString('vi-VN')
      : (Number.isInteger(target) ? Math.floor(val) : val.toFixed(1));
    if (prog < 1) requestAnimationFrame(upd);
    else el.textContent = Number.isInteger(target) ? target.toLocaleString('vi-VN') : target;
  }
  requestAnimationFrame(upd);
}

/* ============================================================
   PRICING TOGGLE
   ============================================================ */
let yearly = false;
function toggleP() {
  yearly = !yearly;
  document.getElementById('pt').classList.toggle('on', yearly);
  document.getElementById('pp').textContent = yearly ? '41.300 ₫' : '59.000 ₫';
  document.getElementById('pperiod').textContent = yearly ? '/tháng (thanh toán năm)' : '/tháng';
  document.getElementById('lp').textContent = yearly ? '299.000 ₫' : '299.000 ₫';
}

/* ============================================================
   TESTIMONIALS CAROUSEL
   ============================================================ */
(function () {
  const track = document.getElementById('rtrack');
  if (!track) return;
  const cards = track.querySelectorAll('.rev-card');
  const dotsWrap = document.getElementById('cdots');
  let idx = 0, timer;

  cards.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'car-dot' + (i === 0 ? ' on' : '');
    d.addEventListener('click', () => { clearInterval(timer); goTo(i); startAuto(); });
    dotsWrap.appendChild(d);
  });

  function cw() {
    const c = track.querySelector('.rev-card');
    return c ? c.offsetWidth + 20 : 340;
  }

  function goTo(n) {
    idx = (n + cards.length) % cards.length;
    track.style.transform = `translateX(-${idx * cw()}px)`;
    dotsWrap.querySelectorAll('.car-dot').forEach((d, i) => d.classList.toggle('on', i === idx));
    animStars();
  }

  function animStars() {
    track.querySelectorAll('.star').forEach(s => s.classList.remove('vis'));
    setTimeout(() => {
      cards[idx].querySelectorAll('.star').forEach((s, i) => {
        setTimeout(() => s.classList.add('vis'), i * 90);
      });
    }, 80);
  }

  function startAuto() {
    timer = setInterval(() => goTo(idx + 1), 4200);
  }

  window.carNext = () => { clearInterval(timer); goTo(idx + 1); startAuto(); };
  window.carPrev = () => { clearInterval(timer); goTo(idx - 1); startAuto(); };

  animStars();
  startAuto();
})();

/* ============================================================
   FAQ
   ============================================================ */
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const open = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
  if (!open) item.classList.add('open');
}

/* ============================================================
   SMOOTH SCROLL
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const t = document.querySelector(a.getAttribute('href'));
    if (t) t.scrollIntoView({ behavior: 'smooth' });
  });
});
