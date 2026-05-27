/**
 * Export limits — all features free, no watermark or Pro tier.
 */
const QRPro = (() => {
  function getMaxBatchRows() {
    return SITE.maxBatchRows || SITE.batchMaxRowsPro || 10000;
  }

  function getMaxQrSize() {
    return SITE.maxQrSize || SITE.pro?.proMaxSize || 2048;
  }

  function shouldWatermark() {
    return false;
  }

  async function applyWatermark(blob) {
    return blob;
  }

  function isPro() {
    return true;
  }

  function isEnabled() {
    return false;
  }

  function updateProUI() {
    ['pro-badge', 'pro-upgrade', 'pro-modal'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.hidden = true;
    });

    const sizeSlider = document.getElementById('qr-size');
    if (sizeSlider) {
      const max = getMaxQrSize();
      sizeSlider.max = max;
      if (parseInt(sizeSlider.value, 10) > max) {
        sizeSlider.value = max;
        sizeSlider.dispatchEvent(new Event('input'));
      }
    }

    const hint = document.getElementById('qr-size-limit');
    if (hint) hint.textContent = '';

    document.dispatchEvent(new CustomEvent('pro:change', { detail: { isPro: true } }));
  }

  function initModal() {
    updateProUI();
  }

  return {
    isPro,
    isEnabled,
    shouldWatermark,
    applyWatermark,
    activateLicense: () => true,
    deactivateLicense: () => {},
    getMaxBatchRows,
    getMaxQrSize,
    updateProUI,
    initModal
  };
})();
