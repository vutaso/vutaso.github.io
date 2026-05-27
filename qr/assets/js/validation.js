/**
 * Form validation for QR types
 */
const QRValidation = (() => {
  const MAX_LOGO_BYTES = 2 * 1024 * 1024;

  function isValidUrl(str) {
    try {
      const u = new URL(str);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function isValidEmail(str) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  }

  function isValidPhone(str) {
    return /^[+]?[\d\s\-().]{7,}$/.test(str.trim());
  }

  function validate(typeId, formData) {
    const errors = {};
    const warnings = {};
    const type = getTypeById(typeId);

    type.fields.forEach((field) => {
      if (field.showWhen) {
        const [key, val] = Object.entries(field.showWhen)[0];
        if (formData[key] !== val) return;
      }

      const value = formData[field.name];
      const str = value == null ? '' : String(value).trim();

      if (field.required && !str && field.type !== 'checkbox') {
        errors[field.name] = 'required';
        return;
      }

      if (!str) return;

      if (field.type === 'email' && !isValidEmail(str)) {
        errors[field.name] = 'invalid_email';
      }
      if (field.type === 'url' && !isValidUrl(/^https?:\/\//i.test(str) ? str : 'https://' + str)) {
        errors[field.name] = 'invalid_url';
      }
      if (field.type === 'tel' && !isValidPhone(str)) {
        errors[field.name] = 'invalid_phone';
      }
    });

    if (typeId === 'location') {
      if (formData.mode === 'coords') {
        const lat = parseFloat(formData.lat);
        const lng = parseFloat(formData.lng);
        if (isNaN(lat) || lat < -90 || lat > 90) errors.lat = 'invalid_lat';
        if (isNaN(lng) || lng < -180 || lng > 180) errors.lng = 'invalid_lng';
      } else if (!String(formData.address || '').trim()) {
        errors.address = 'required';
      }
    }

    if (typeId === 'appstore') {
      const ios = String(formData.iosUrl || '').trim();
      const android = String(formData.androidUrl || '').trim();
      if (!ios && !android) {
        errors.iosUrl = 'appstore_required';
        errors.androidUrl = 'appstore_required';
      } else {
        if (ios && !isValidUrl(ios)) errors.iosUrl = 'invalid_url';
        if (android && !isValidUrl(android)) errors.androidUrl = 'invalid_url';
        if (ios && android && !errors.iosUrl && !errors.androidUrl) {
          warnings._form = 'appstore_dual';
        }
      }
    }

    if (typeId === 'crypto') {
      const addr = String(formData.address || '').trim();
      if (addr && addr.length < 10) errors.address = 'invalid_address';
    }

    const encoded = encodeQRData(typeId, formData);
    if (!encoded || !encoded.trim()) {
      errors._form = 'empty_payload';
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      warnings,
      encoded: encoded || ''
    };
  }

  const LOGO_MIME_TYPES = new Set([
    'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml', 'image/pjpeg'
  ]);
  const LOGO_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']);

  function validateLogoFile(file) {
    if (!file) return { valid: true };
    const ext = (file.name || '').split('.').pop().toLowerCase();
    const mimeOk = !file.type || LOGO_MIME_TYPES.has(file.type);
    const extOk = LOGO_EXTENSIONS.has(ext);
    if (!mimeOk && !extOk) {
      return { valid: false, error: 'invalid_type' };
    }
    if (file.size > MAX_LOGO_BYTES) {
      return { valid: false, error: 'too_large' };
    }
    return { valid: true };
  }

  return { validate, validateLogoFile, MAX_LOGO_BYTES };
})();
