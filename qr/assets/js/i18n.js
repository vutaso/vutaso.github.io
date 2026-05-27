/**
 * Internationalization — EN / VI
 */
const I18n = (() => {
  const LANG_KEY = 'qr-lang';

  const messages = {
    en: {
      'nav.batch': 'Batch Mode',
      'nav.moneybay': 'Get MoneyBay',
      'nav.moneybayShort': 'MoneyBay',
      'nav.qrbay': 'Get QRBay',
      'nav.qrbayShort': 'QRBay',
      'nav.lang': 'Language',
      'panel.qrType': 'QR Type',
      'panel.content': 'Content',
      'panel.customize': 'Customize',
      'panel.preview': 'Preview',
      'panel.presetThemes': 'Preset Themes',
      'panel.frameTemplate': 'Frame Template',
      'accordion.dots': 'Dot & Corner Styles',
      'accordion.colors': 'Colors',
      'accordion.logo': 'Logo',
      'accordion.size': 'Size & Quality',
      'export.download': 'Download',
      'export.copy': 'Copy Image',
      'export.share': 'Share',
      'export.encoded': 'Encoded Data',
      'export.stickyPng': 'Download PNG',
      'batch.title': 'Batch QR Generator',
      'batch.desc': 'Enter CSV data with columns: type, data, label.',
      'batch.csv': 'CSV Data',
      'batch.parse': 'Generate Preview',
      'batch.zipPng': 'Download ZIP (PNG)',
      'batch.zipSvg': 'Download ZIP (SVG)',
      'batch.progress': 'Generating {current} / {total}…',
      'batch.truncated': 'Only first {max} rows processed.',
      'batch.empty': 'No valid rows. Check CSV format (see guide below).',
      'batch.cancel': 'Cancel',
      'batch.cancelled': 'Batch export cancelled.',
      'batch.helpTitle': 'CSV format guide',
      'batch.helpBody': 'type,data,label\nurl,https://example.com,Site\nsocial,instagram,mybrand,Instagram\nwifi,MyWiFi|password|WPA,Office\nvcard,John|Doe|+1234567890|john@example.com,Contact',
      'validation.required': 'This field is required.',
      'validation.invalid_email': 'Enter a valid email address.',
      'validation.invalid_url': 'Enter a valid URL.',
      'validation.invalid_phone': 'Enter a valid phone number.',
      'validation.invalid_lat': 'Latitude must be between -90 and 90.',
      'validation.invalid_lng': 'Longitude must be between -180 and 180.',
      'validation.invalid_address': 'Enter a valid wallet address.',
      'validation.appstore_required': 'Enter at least one store URL.',
      'validation.appstore_dual': 'Both store links are set. This QR uses the iOS App Store URL. Create a second QR for Google Play if needed.',
      'validation.empty_payload': 'Please fill in the required fields to generate a QR code.',
      'validation.logo_too_large': 'Logo must be under 2 MB.',
      'validation.logo_invalid': 'Please upload an image file.',
      'toast.download': 'Download started!',
      'toast.copy': 'Copied to clipboard!',
      'toast.share': 'Shared successfully!',
      'toast.shareClipboard': 'Share unavailable — copied image to clipboard instead.',
      'toast.exportFail': 'Export failed',
      'toast.invalid': 'Fix form errors before exporting.',
      'toast.styleLoaded': 'Style loaded!',
      'toast.styleInvalid': 'Invalid style file.',
      'toast.styleReset': 'Style reset to defaults.',
      'usecases.title': 'Use Cases',
      'usecases.subtitle': 'Create QR codes for every scenario — free and instant.',
      'faq.title': 'Frequently Asked Questions',
      'footer.tagline': 'Create beautiful QR codes for free. No signup required. 100% client-side — your data never leaves your browser.',
      'footer.types': 'Supported QR Types',
      'footer.features': 'Features',
      'contentSuffix': ' Content',
      'type.url': 'URL',
      'type.text': 'Text',
      'type.wifi': 'WiFi',
      'type.vcard': 'vCard',
      'type.email': 'Email',
      'type.sms': 'SMS',
      'type.phone': 'Phone',
      'type.location': 'Location',
      'type.social': 'Social',
      'type.appstore': 'App Store',
      'type.crypto': 'Crypto',
      'pro.upgrade': 'Upgrade Pro',
      'pro.badge': 'PRO',
      'pro.modal.title': 'Upgrade to Pro',
      'pro.modal.desc': 'Remove watermark, export up to 1000px, batch 500 rows.',
      'pro.modal.placeholder': 'Enter license key',
      'pro.modal.activate': 'Activate',
      'pro.toastActivated': 'Pro activated!',
      'pro.modal.pricing': 'View pricing',
      'history.title': 'Recent',
      'history.clear': 'Clear',
      'history.empty': 'No recent QR codes yet.',
      'history.restored': 'Restored from history.',
      'tips.title': 'Scan quality',
      'tips.logo_ecl': 'Use error correction H or Q when embedding a logo.',
      'tips.gradient_transparent': 'Gradient + transparent background may reduce scan reliability.',
      'tips.low_contrast': 'Low contrast between QR and background — use darker colors.',
      'tips.small_size': 'QR size under 250px may be hard to scan when printed.',
      'tips.good': 'Settings look good for reliable scanning.',
      'accordion.frame': 'Frame & Label',
      'accordion.presets': 'Design Presets',
      'panel.customThemes': 'My Themes',
      'customTheme.save': 'Save current',
      'customTheme.namePlaceholder': 'Theme name',
      'customTheme.empty': 'No saved themes yet.',
      'customTheme.saved': 'Theme saved!',
      'customTheme.nameRequired': 'Enter a theme name.',
      'customTheme.limit': 'Maximum 20 saved themes.',
      'customTheme.storageFull': 'Storage is full — delete a theme or remove the logo.',
      'frame.bannerGradient': 'Banner Gradient',
      'frame.bannerFrom': 'Gradient Start',
      'frame.bannerTo': 'Gradient End',
      'nav.pricing': 'Pricing',
      'nav.contact': 'Contact',
      'templates.title': 'Templates',
      'templates.subtitle': 'Pick a ready-made design — customize content in one click.',
      'templates.search': 'Search templates…',
      'templates.hide': 'Hide',
      'templates.show': 'Show templates',
      'templates.showAll': 'Show all templates',
      'templates.showLess': 'Show less',
      'templates.empty': 'No templates match your search.',
      'templates.count': '{count} templates',
      'templates.applied': 'Template applied: {name}',
      'templates.cat.all': 'All',
      'templates.cat.business': 'Business',
      'templates.cat.restaurant': 'Restaurant',
      'templates.cat.social': 'Social',
      'templates.cat.events': 'Events',
      'templates.cat.retail': 'Retail',
      'templates.cat.personal': 'Personal',
      'templates.cat.marketing': 'Marketing',
      'templates.cat.hospitality': 'Hospitality',
      'templates.cat.education': 'Education',
      'templates.cat.realestate': 'Real Estate'
    },
    vi: {
      'nav.batch': 'Hàng loạt',
      'nav.moneybay': 'Tải MoneyBay',
      'nav.moneybayShort': 'MoneyBay',
      'nav.qrbay': 'Tải QRBay',
      'nav.qrbayShort': 'QRBay',
      'nav.lang': 'Ngôn ngữ',
      'panel.qrType': 'Loại QR',
      'panel.content': 'Nội dung',
      'panel.customize': 'Tùy chỉnh',
      'panel.preview': 'Xem trước',
      'panel.presetThemes': 'Theme có sẵn',
      'panel.frameTemplate': 'Khung QR',
      'accordion.dots': 'Kiểu chấm & góc',
      'accordion.colors': 'Màu sắc',
      'accordion.logo': 'Logo',
      'accordion.size': 'Kích thước & chất lượng',
      'export.download': 'Tải xuống',
      'export.copy': 'Sao chép ảnh',
      'export.share': 'Chia sẻ',
      'export.encoded': 'Dữ liệu mã hóa',
      'export.stickyPng': 'Tải PNG',
      'batch.title': 'Tạo QR hàng loạt',
      'batch.desc': 'Nhập CSV với cột: type, data, label.',
      'batch.csv': 'Dữ liệu CSV',
      'batch.parse': 'Tạo xem trước',
      'batch.zipPng': 'Tải ZIP (PNG)',
      'batch.zipSvg': 'Tải ZIP (SVG)',
      'batch.progress': 'Đang tạo {current} / {total}…',
      'batch.truncated': 'Chỉ xử lý {max} dòng đầu tiên.',
      'batch.empty': 'Không có dòng hợp lệ. Kiểm tra định dạng CSV (xem hướng dẫn bên dưới).',
      'batch.cancel': 'Hủy',
      'batch.cancelled': 'Đã hủy xuất batch.',
      'batch.helpTitle': 'Hướng dẫn định dạng CSV',
      'batch.helpBody': 'type,data,label\nurl,https://example.com,Trang\nsocial,instagram,mybrand,Instagram\nwifi,MyWiFi|password|WPA,Văn phòng\nvcard,An|Nguyen|+84901234567|an@example.com,Liên hệ',
      'validation.required': 'Trường này là bắt buộc.',
      'validation.invalid_email': 'Nhập email hợp lệ.',
      'validation.invalid_url': 'Nhập URL hợp lệ.',
      'validation.invalid_phone': 'Nhập số điện thoại hợp lệ.',
      'validation.invalid_lat': 'Vĩ độ phải từ -90 đến 90.',
      'validation.invalid_lng': 'Kinh độ phải từ -180 đến 180.',
      'validation.invalid_address': 'Nhập địa chỉ ví hợp lệ.',
      'validation.appstore_required': 'Nhập ít nhất một URL cửa hàng.',
      'validation.appstore_dual': 'Đã nhập cả hai link cửa hàng. Mã QR này dùng URL App Store (iOS). Tạo mã QR thứ hai cho Google Play nếu cần.',
      'validation.empty_payload': 'Vui lòng điền các trường bắt buộc để tạo mã QR.',
      'validation.logo_too_large': 'Logo phải nhỏ hơn 2 MB.',
      'validation.logo_invalid': 'Vui lòng tải lên file ảnh.',
      'toast.download': 'Đang tải xuống!',
      'toast.copy': 'Đã sao chép!',
      'toast.share': 'Đã chia sẻ!',
      'toast.shareClipboard': 'Không chia sẻ được — đã sao chép ảnh vào clipboard.',
      'toast.exportFail': 'Xuất file thất bại',
      'toast.invalid': 'Sửa lỗi form trước khi xuất.',
      'toast.styleLoaded': 'Đã tải style!',
      'toast.styleInvalid': 'File style không hợp lệ.',
      'toast.styleReset': 'Đã đặt lại style mặc định.',
      'usecases.title': 'Trường hợp sử dụng',
      'usecases.subtitle': 'Tạo mã QR cho mọi nhu cầu — miễn phí, tức thì.',
      'faq.title': 'Câu hỏi thường gặp',
      'footer.tagline': 'Tạo mã QR đẹp miễn phí. Không cần đăng ký. 100% trên trình duyệt — dữ liệu không rời khỏi thiết bị.',
      'footer.types': 'Loại QR hỗ trợ',
      'footer.features': 'Tính năng',
      'contentSuffix': '',
      'type.url': 'URL',
      'type.text': 'Văn bản',
      'type.wifi': 'WiFi',
      'type.vcard': 'Danh thiếp',
      'type.email': 'Email',
      'type.sms': 'SMS',
      'type.phone': 'Điện thoại',
      'type.location': 'Vị trí',
      'type.social': 'Mạng XH',
      'type.appstore': 'App Store',
      'type.crypto': 'Crypto',
      'pro.upgrade': 'Nâng cấp Pro',
      'pro.badge': 'PRO',
      'pro.modal.title': 'Nâng cấp Pro',
      'pro.modal.desc': 'Bỏ watermark, xuất tới 1000px, batch 500 dòng.',
      'pro.modal.placeholder': 'Nhập license key',
      'pro.modal.activate': 'Kích hoạt',
      'pro.toastActivated': 'Đã kích hoạt Pro!',
      'pro.modal.pricing': 'Xem bảng giá',
      'history.title': 'Gần đây',
      'history.clear': 'Xóa',
      'history.empty': 'Chưa có mã QR gần đây.',
      'history.restored': 'Đã khôi phục từ lịch sử.',
      'tips.title': 'Chất lượng quét',
      'tips.logo_ecl': 'Dùng mức sửa lỗi H hoặc Q khi nhúng logo.',
      'tips.gradient_transparent': 'Gradient + nền trong suốt có thể khó quét.',
      'tips.low_contrast': 'Độ tương phản thấp — dùng màu đậm hơn.',
      'tips.small_size': 'QR dưới 250px có thể khó quét khi in.',
      'tips.good': 'Cài đặt ổn — quét tin cậy.',
      'nav.pricing': 'Giá',
      'nav.contact': 'Liên hệ',
      'accordion.frame': 'Khung & Nhãn',
      'accordion.presets': 'Lưu thiết kế',
      'panel.customThemes': 'Theme của tôi',
      'customTheme.save': 'Lưu hiện tại',
      'customTheme.namePlaceholder': 'Tên theme',
      'customTheme.empty': 'Chưa có theme đã lưu.',
      'customTheme.saved': 'Đã lưu theme!',
      'customTheme.nameRequired': 'Nhập tên theme.',
      'customTheme.limit': 'Tối đa 20 theme.',
      'customTheme.storageFull': 'Hết dung lượng — xóa bớt theme hoặc bỏ logo.',
      'frame.bannerGradient': 'Gradient Banner',
      'frame.bannerFrom': 'Màu bắt đầu',
      'frame.bannerTo': 'Màu kết thúc',
      'templates.title': 'Mẫu QR',
      'templates.subtitle': 'Chọn thiết kế có sẵn — tùy chỉnh nội dung chỉ với một click.',
      'templates.search': 'Tìm mẫu…',
      'templates.hide': 'Ẩn',
      'templates.show': 'Hiện mẫu',
      'templates.showAll': 'Xem tất cả mẫu',
      'templates.showLess': 'Thu gọn',
      'templates.empty': 'Không tìm thấy mẫu phù hợp.',
      'templates.count': '{count} mẫu',
      'templates.applied': 'Đã áp mẫu: {name}',
      'templates.cat.all': 'Tất cả',
      'templates.cat.business': 'Kinh doanh',
      'templates.cat.restaurant': 'Nhà hàng',
      'templates.cat.social': 'Mạng XH',
      'templates.cat.events': 'Sự kiện',
      'templates.cat.retail': 'Bán lẻ',
      'templates.cat.personal': 'Cá nhân',
      'templates.cat.marketing': 'Marketing',
      'templates.cat.hospitality': 'Khách sạn',
      'templates.cat.education': 'Giáo dục',
      'templates.cat.realestate': 'Bất động sản'
    }
  };

  const useCases = {
    en: [
      { icon: 'fa-store', title: 'Business & Marketing', desc: 'Link QR codes on flyers, packaging, and storefronts to your website or promo page.' },
      { icon: 'fa-wifi', title: 'WiFi Sharing', desc: 'Let guests connect instantly — no typing long passwords.' },
      { icon: 'fa-address-card', title: 'Contact Cards', desc: 'Share vCard QR codes at events so contacts save your info in one scan.' },
      { icon: 'fa-utensils', title: 'Restaurants & Menus', desc: 'Digital menus, table ordering, and review links via QR.' },
      { icon: 'fa-share-nodes', title: 'Social Media', desc: 'Grow followers with QR codes linking to Instagram, TikTok, YouTube, and more.' },
      { icon: 'fa-layer-group', title: 'Batch Production', desc: 'Generate hundreds of QR codes from CSV for events, inventory, or asset tags.' }
    ],
    vi: [
      { icon: 'fa-store', title: 'Kinh doanh & Marketing', desc: 'Gắn QR trên tờ rơi, bao bì, cửa hàng dẫn tới website hoặc trang khuyến mãi.' },
      { icon: 'fa-wifi', title: 'Chia sẻ WiFi', desc: 'Khách kết nối WiFi ngay — không cần gõ mật khẩu dài.' },
      { icon: 'fa-address-card', title: 'Danh thiếp', desc: 'Chia sẻ vCard tại sự kiện — lưu liên hệ chỉ với một lần quét.' },
      { icon: 'fa-utensils', title: 'Nhà hàng & Menu', desc: 'Menu số, đặt món bàn, link đánh giá qua QR.' },
      { icon: 'fa-share-nodes', title: 'Mạng xã hội', desc: 'Tăng follower với QR dẫn tới Instagram, TikTok, YouTube…' },
      { icon: 'fa-layer-group', title: 'Sản xuất hàng loạt', desc: 'Tạo hàng trăm QR từ CSV cho sự kiện, kho, tem tài sản.' }
    ]
  };

  const faq = {
    en: [
      { q: 'Is this QR code generator really free?', a: 'Yes. All QR types, styling, batch mode, and exports are free with no watermark and no signup.' },
      { q: 'Is my data safe?', a: 'All QR generation happens in your browser. Your URLs, WiFi passwords, and contact info are never sent to our servers.' },
      { q: 'What file formats can I download?', a: 'PNG (1×, 2×, 3×), SVG, JPEG, and PDF. Frame templates are included in PNG, JPEG, and PDF exports.' },
      { q: 'Will my QR codes expire?', a: 'No. Static QR codes never expire. The encoded content stays the same forever.' },
      { q: 'Can I add my logo?', a: 'Yes. Upload a logo, adjust size and margin, and use high error correction (H) for best scan results.' },
      { q: 'How does batch mode work?', a: 'Paste CSV with columns type, data, label. Preview all QR codes and download as a ZIP file.' }
    ],
    vi: [
      { q: 'Công cụ tạo QR này có thật sự miễn phí?', a: 'Có. Đủ loại QR, tùy chỉnh, batch và export — miễn phí, không watermark, không cần đăng ký.' },
      { q: 'Dữ liệu của tôi có an toàn?', a: 'Mọi thao tác tạo QR diễn ra trên trình duyệt. URL, mật khẩu WiFi, liên hệ không gửi lên máy chủ.' },
      { q: 'Tải được những định dạng nào?', a: 'PNG (1×, 2×, 3×), SVG, JPEG và PDF. Khung QR được gộp vào PNG, JPEG và PDF.' },
      { q: 'Mã QR có hết hạn không?', a: 'Không. Mã QR tĩnh không hết hạn — nội dung mã hóa giữ nguyên vĩnh viễn.' },
      { q: 'Có thêm logo được không?', a: 'Có. Tải logo, chỉnh kích thước/lề, dùng mức sửa lỗi H để quét tốt nhất.' },
      { q: 'Batch mode hoạt động thế nào?', a: 'Dán CSV với cột type, data, label. Xem trước tất cả và tải ZIP.' }
    ]
  };

  let lang = 'en';

  function getLang() {
    return lang;
  }

  function t(key, vars) {
    if (!key) return null;
    let str = (messages[lang] && messages[lang][key]) || messages.en[key];
    if (str == null) return null;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, v);
      });
    }
    return str;
  }

  const NAV_APP_LABELS = [
    { id: 'nav-label-moneybay', full: 'nav.moneybay', short: 'nav.moneybayShort' },
    { id: 'nav-label-qrbay', full: 'nav.qrbay', short: 'nav.qrbayShort' }
  ];

  function labelKey(el) {
    const shortKey = el.getAttribute('data-i18n-short');
    if (shortKey && window.matchMedia('(max-width: 768px)').matches) return shortKey;
    return el.getAttribute('data-i18n');
  }

  function applyHeaderNav() {
    const mobile = window.matchMedia('(max-width: 768px)').matches;
    NAV_APP_LABELS.forEach(({ id, full, short }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const text = t(mobile ? short : full);
      if (text != null) el.textContent = text;
    });
  }

  function errorMsg(code) {
    return t('validation.' + code) || code;
  }

  function warningMsg(code) {
    return t('validation.' + code) || code;
  }

  function setLang(next) {
    if (!messages[next]) return;
    lang = next;
    localStorage.setItem(LANG_KEY, next);
    document.documentElement.lang = next;
    apply();
  }

  function init() {
    const stored = localStorage.getItem(LANG_KEY);
    const browser = (navigator.language || '').startsWith('vi') ? 'vi' : 'en';
    lang = stored || browser;
    document.documentElement.lang = lang;
    apply();
    const navMq = window.matchMedia('(max-width: 768px)');
    if (typeof navMq.addEventListener === 'function') {
      navMq.addEventListener('change', apply);
    } else if (typeof navMq.addListener === 'function') {
      navMq.addListener(apply);
    }
  }

  function apply() {
    applyHeaderNav();
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key == null) return;
      const resolvedKey = el.hasAttribute('data-i18n-short') ? labelKey(el) : key;
      const vars = {};
      if (el.dataset.i18nMax) vars.max = el.dataset.i18nMax;
      const translated = t(resolvedKey, Object.keys(vars).length ? vars : undefined);
      if (translated != null) el.textContent = translated;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const ph = t(el.getAttribute('data-i18n-placeholder'));
      if (ph != null) el.placeholder = ph;
    });
    document.querySelectorAll('[data-qr-aria]').forEach((el) => {
      const label = t(el.getAttribute('data-qr-aria'));
      if (label != null) el.setAttribute('aria-label', label);
    });
    renderUseCases();
    renderFaq();
    document.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang } }));
  }

  function renderUseCases() {
    const grid = document.getElementById('usecases-grid');
    if (!grid) return;
    grid.innerHTML = useCases[lang].map((item) => `
      <article class="usecase-card">
        <i class="fa-solid ${item.icon} usecase-card__icon" aria-hidden="true"></i>
        <h3>${item.title}</h3>
        <p>${item.desc}</p>
      </article>
    `).join('');
  }

  function renderFaq() {
    const list = document.getElementById('faq-list');
    if (!list) return;
    list.innerHTML = faq[lang].map((item, i) => `
      <details class="faq-item" ${i === 0 ? 'open' : ''}>
        <summary>${item.q}</summary>
        <p>${item.a}</p>
      </details>
    `).join('');
  }

  return { init, setLang, getLang, t, errorMsg, warningMsg, faq, useCases };
})();
