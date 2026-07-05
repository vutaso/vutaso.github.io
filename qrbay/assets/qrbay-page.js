/* Navbar scroll */
window.addEventListener('scroll', () => {
    const nav = document.getElementById('nav');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

/* Mobile menu */
const ham = document.getElementById('ham');
const mob = document.getElementById('mob');

function toggleM() {
    if (!ham || !mob) return;
    ham.classList.toggle('open');
    mob.classList.toggle('open');
    document.body.style.overflow = mob.classList.contains('open') ? 'hidden' : '';
}

function closeM() {
    if (!ham || !mob) return;
    ham.classList.remove('open');
    mob.classList.remove('open');
    document.body.style.overflow = '';
}

/* FAQ */
function toggleFaq(btn) {
    const item = btn.closest('.faq-item');
    if (!item) return;
    const open = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!open) item.classList.add('open');
}

/* Testimonials carousel */
(function () {
    const track = document.getElementById('rtrack');
    const dotsWrap = document.getElementById('cdots');
    if (!track || !dotsWrap) return;

    const cards = track.querySelectorAll('.rev-card');
    if (!cards.length) return;

    let idx = 0;
    let timer;

    cards.forEach((_, i) => {
        const d = document.createElement('div');
        d.className = 'car-dot' + (i === 0 ? ' on' : '');
        d.addEventListener('click', () => { clearInterval(timer); goTo(i); startAuto(); });
        dotsWrap.appendChild(d);
    });

    function cardWidth() {
        const c = track.querySelector('.rev-card');
        return c ? c.offsetWidth + 20 : 340;
    }

    function goTo(n) {
        idx = (n + cards.length) % cards.length;
        track.style.transform = `translateX(-${idx * cardWidth()}px)`;
        dotsWrap.querySelectorAll('.car-dot').forEach((d, i) => d.classList.toggle('on', i === idx));
    }

    function startAuto() {
        timer = setInterval(() => goTo(idx + 1), 4200);
    }

    window.carNext = () => { clearInterval(timer); goTo(idx + 1); startAuto(); };
    window.carPrev = () => { clearInterval(timer); goTo(idx - 1); startAuto(); };

    startAuto();
})();
