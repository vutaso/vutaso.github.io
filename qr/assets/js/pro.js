/**
 * Pro tier — license unlock, watermark, limits
 */
const QRPro = (() => {
  const STORAGE_KEY = 'qr-pro-license';

  function isEnabled() {
    return !!(window.SITE && SITE.pro && SITE.pro.enabled);
  }

  function isPro() {
    if (!isEnabled()) return true;
    const key = localStorage.getItem(STORAGE_KEY);
    return !!(key && SITE.pro.licenseKeys && SITE.pro.licenseKeys.includes(key));
  }

  function getMaxBatchRows() {
    if (isPro()) return (SITE.batchMaxRowsPro || 500);
    return SITE.batchMaxRows || 100;
  }

  function getMaxQrSize() {
    if (!isEnabled()) return 1000;
    return isPro() ? (SITE.pro.proMaxSize || 1000) : (SITE.pro.freeMaxSize || 600);
  }

  function shouldWatermark() {
    return isEnabled() && SITE.pro.watermarkFree && !isPro();
  }

  function activateLicense(key) {
    const normalized = (key || '').trim().toUpperCase();
    if (!normalized || !SITE.pro.licenseKeys) return false;
    const match = SITE.pro.licenseKeys.find(k => k.toUpperCase() === normalized);
    if (!match) return false;
    localStorage.setItem(STORAGE_KEY, match);
    return true;
  }

  function deactivateLicense() {
    localStorage.removeItem(STORAGE_KEY);
  }

  async function applyWatermark(blob) {
    if (!shouldWatermark()) return blob;

    const text = SITE.pro.watermarkText || 'FreeQRGenerator.com';
    const img = await blobToImage(blob);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const fontSize = Math.max(12, Math.round(canvas.width * 0.035));
    ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(99, 102, 241, 0.55)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 6);
    const step = fontSize * 5;
    for (let y = -canvas.height; y < canvas.height; y += step) {
      for (let x = -canvas.width; x < canvas.width; x += step * 2.5) {
        ctx.fillText(text, x, y);
      }
    }
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillRect(canvas.width - fontSize * 8, canvas.height - fontSize * 1.8, fontSize * 7.5, fontSize * 1.4);
    ctx.fillStyle = '#6366f1';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(text, canvas.width - 8, canvas.height - 6);

    return canvasToBlob(canvas);
  }

  function blobToImage(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = reject;
      img.src = url;
    });
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Watermark failed')), 'image/png');
    });
  }

  function updateProUI() {
    const badge = document.getElementById('pro-badge');
    const upgrade = document.getElementById('pro-upgrade');
    const ads = document.querySelectorAll('.ad-slot');

    if (badge) {
      badge.hidden = !isPro();
      badge.textContent = 'PRO';
    }

    if (upgrade) {
      upgrade.hidden = isPro() || !isEnabled();
    }

    const hideAds = !SITE.ads?.enabled || (SITE.ads.hideForPro && isPro());
    ads.forEach((el) => { el.hidden = hideAds; });

    const sizeSlider = document.getElementById('qr-size');
    if (sizeSlider) {
      const max = getMaxQrSize();
      sizeSlider.max = max;
      if (parseInt(sizeSlider.value, 10) > max) {
        sizeSlider.value = max;
        sizeSlider.dispatchEvent(new Event('input'));
      }
      const hint = document.getElementById('qr-size-limit');
      if (hint) {
        hint.textContent = isPro() ? '' : `(Free max ${max}px — upgrade for ${SITE.pro.proMaxSize}px)`;
      }
    }

    document.dispatchEvent(new CustomEvent('pro:change', { detail: { isPro: isPro() } }));
  }

  function initModal() {
    const modal = document.getElementById('pro-modal');
    const openBtn = document.getElementById('pro-upgrade');
    const closeBtn = document.getElementById('pro-modal-close');
    const activateBtn = document.getElementById('pro-activate');
    const input = document.getElementById('pro-license-input');

    if (!modal) return;

    openBtn?.addEventListener('click', () => { modal.hidden = false; input?.focus(); });
    closeBtn?.addEventListener('click', () => { modal.hidden = true; });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.hidden = true; });

    activateBtn?.addEventListener('click', () => {
      const ok = activateLicense(input?.value);
      if (ok) {
        modal.hidden = true;
        updateProUI();
        if (typeof showToast === 'function') showToast('Pro activated!', 'success');
        else if (window.__showToast) window.__showToast('Pro activated!', 'success');
        QRAnalytics.track('pro_activate');
      } else if (input) {
        input.classList.add('input--error');
      }
    });

    updateProUI();
  }

  return {
    isPro,
    isEnabled,
    shouldWatermark,
    applyWatermark,
    activateLicense,
    deactivateLicense,
    getMaxBatchRows,
    getMaxQrSize,
    updateProUI,
    initModal
  };
})();
