
/* ---------- Nav on scroll ---------- */
(function () {
  var nav = document.getElementById('nav');
  var onScroll = function () {
    nav.classList.toggle('scrolled', window.scrollY > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ---------- Mobile menu ---------- */
(function () {
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mmenu');

  function setOpen(open) {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
    document.body.style.overflow = open ? 'hidden' : '';
  }

  burger.addEventListener('click', function () {
    setOpen(!menu.classList.contains('open'));
  });

  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setOpen(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('open')) setOpen(false);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 900 && menu.classList.contains('open')) setOpen(false);
  });
})();

/* ---------- Phone chart ---------- */
(function () {
  var chart = document.getElementById('phChart');
  if (!chart) return;
  var heights = [34, 52, 40, 68, 48, 86, 60, 74, 52, 92];
  var bars = heights.map(function (h) {
    var i = document.createElement('i');
    if (h >= 70) i.className = 'hi';
    i.style.height = '0%';
    chart.appendChild(i);
    return { el: i, h: h };
  });
  requestAnimationFrame(function () {
    bars.forEach(function (b, idx) {
      setTimeout(function () { b.el.style.height = b.h + '%'; }, 90 * idx);
    });
  });
})();

/* ---------- Count up ---------- */
function countUp(el) {
  if (el.dataset.done) return;
  el.dataset.done = '1';

  var target = parseFloat(el.dataset.count);
  var decimals = el.dataset.dec ? 1 : 0;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function paint(value) {
    if (decimals) {
      el.textContent = value.toFixed(1);
    } else {
      el.textContent = Math.round(value).toLocaleString('vi-VN');
    }
  }

  if (reduce) {
    paint(target);
    return;
  }

  var duration = 1600;
  var start = performance.now();

  function frame(now) {
    var p = Math.min((now - start) / duration, 1);
    var eased = 1 - Math.pow(1 - p, 3);
    paint(target * eased);
    if (p < 1) requestAnimationFrame(frame);
    else paint(target);
  }

  requestAnimationFrame(frame);
}

/* ---------- Reveal on scroll ---------- */
(function () {
  var items = document.querySelectorAll('.rev');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('vis'); });
    document.querySelectorAll('.count').forEach(countUp);
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var delay = parseInt(el.dataset.delay || 0, 10);
      setTimeout(function () {
        el.classList.add('vis');
        el.querySelectorAll('.count').forEach(countUp);
      }, delay);
      io.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  items.forEach(function (el) { io.observe(el); });
})();

/* ---------- FAQ accordion ---------- */
(function () {
  var buttons = document.querySelectorAll('.faq-q');

  function close(item) {
    item.classList.remove('open');
    item.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      var isOpen = item.classList.contains('open');

      document.querySelectorAll('.faq-item.open').forEach(close);

      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();

