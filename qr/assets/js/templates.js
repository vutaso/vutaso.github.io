/**
 * QR Templates Marketplace — ready-made designs for every use case
 */
const QRTemplates = (() => {
  const CATEGORIES = [
    { id: 'all', icon: 'fa-table-cells-large' },
    { id: 'business', icon: 'fa-briefcase' },
    { id: 'restaurant', icon: 'fa-utensils' },
    { id: 'social', icon: 'fa-share-nodes' },
    { id: 'events', icon: 'fa-calendar-days' },
    { id: 'retail', icon: 'fa-bag-shopping' },
    { id: 'personal', icon: 'fa-user' },
    { id: 'marketing', icon: 'fa-bullhorn' },
    { id: 'hospitality', icon: 'fa-hotel' },
    { id: 'education', icon: 'fa-graduation-cap' },
    { id: 'realestate', icon: 'fa-house' }
  ];

  /** Social brand icons — SVG from QRBrandLogos (reliable on GitHub Pages; FA brands CDN can fail) */
  const FA_TO_BRAND = {
    'fa-linkedin': 'linkedin',
    'fa-instagram': 'instagram',
    'fa-tiktok': 'tiktok',
    'fa-youtube': 'youtube',
    'fa-facebook': 'facebook',
    'fa-whatsapp': 'whatsapp',
    'fa-telegram': 'telegram',
    'fa-x-twitter': 'x'
  };

  const BRAND_ICONS = new Set(Object.keys(FA_TO_BRAND));

  function iconClass(icon) {
    const family = BRAND_ICONS.has(icon) ? 'fa-brands' : 'fa-solid';
    return `${family} ${icon}`;
  }

  function templateIconMarkup(icon) {
    const brandId = FA_TO_BRAND[icon];
    if (brandId && typeof QRBrandLogos !== 'undefined' && QRBrandLogos.DATA_URI[brandId]) {
      return `<img class="template-card__brand-img" src="${QRBrandLogos.DATA_URI[brandId]}" alt="" width="28" height="28" loading="lazy" decoding="async">`;
    }
    return `<i class="${iconClass(icon)}"></i>`;
  }

  function tr(key, vars) {
    if (typeof I18n === 'undefined') return null;
    return I18n.t(key, vars);
  }

  function st(fg, bg, opts = {}) {
    const frame = opts.frame || 'none';
    const style = {
      dotsOptions: { type: opts.dots || 'rounded', color: fg },
      cornersSquareOptions: { type: opts.cornerSq || 'extra-rounded', color: opts.cornerSqColor || fg },
      cornersDotOptions: { type: opts.cornerDot || 'dot', color: opts.cornerDotColor || fg },
      backgroundOptions: { color: bg },
      unifiedColors: opts.unifiedColors ?? false,
      colorMode: opts.colorMode || 'solid',
      fgColor2: opts.fgColor2 || fg,
      gradientRotation: opts.gradientRotation ?? 0,
      bgColorMode: 'solid',
      transparentBg: false,
      activeFrame: frame,
      customFrameLabel: opts.label || '',
      qrOptions: { errorCorrectionLevel: opts.ecl || 'M' },
      margin: opts.margin ?? 1,
      width: opts.width || 300,
      height: opts.width || 300
    };
    if (opts.banner) {
      style.useCustomFrameColors = true;
      style.frameColors = {
        border: fg,
        background: bg,
        label: opts.labelColor || '#ffffff',
        bannerFrom: opts.bannerFrom || fg,
        bannerTo: opts.bannerTo || fg
      };
    }
    if (opts.brand && typeof QRBrandLogos !== 'undefined') {
      return QRBrandLogos.applyBrand(style, opts.brand, opts);
    }
    return style;
  }

  /** Social brand preset: logo + ECL H + official colors */
  function stBrand(brandId, opts = {}) {
    const p = typeof QRBrandLogos !== 'undefined' ? QRBrandLogos.getPreset(brandId) : null;
    if (!p) return st('#0071e3', '#ffffff', opts);
    return st(p.fg, p.bg, {
      dots: p.dots,
      cornerSq: p.cornerSq,
      cornerDot: p.cornerDot,
      cornerSqColor: p.cornerSqColor,
      cornerDotColor: p.cornerDotColor,
      colorMode: p.colorMode,
      fgColor2: p.fgColor2,
      gradientRotation: p.gradientRotation,
      ecl: 'H',
      brand: brandId,
      ...opts
    });
  }

  const TEMPLATES = [
    // Business
    { id: 'biz-website', cat: 'business', icon: 'fa-globe', accent: '#1d4ed8', type: 'url',
      name: { en: 'Business Website', vi: 'Website doanh nghiệp' },
      form: { url: 'https://yourcompany.com' },
      style: st('#1e3a8a', '#eff6ff', { frame: 'scanme', label: 'Visit Website', dots: 'classy-rounded' }) },
    { id: 'biz-card', cat: 'business', icon: 'fa-id-card', accent: '#0f766e', type: 'vcard',
      name: { en: 'Business Card', vi: 'Danh thiếp' },
      form: { firstName: 'Jane', lastName: 'Smith', phone: '+1 555 0100', email: 'jane@company.com', org: 'Acme Inc.', title: 'Director', website: 'https://acme.com' },
      style: st('#134e4a', '#ecfdf5', { frame: 'badge', dots: 'classy', ecl: 'Q' }) },
    { id: 'biz-linkedin', cat: 'business', icon: 'fa-linkedin', accent: '#0a66c2', type: 'social',
      name: { en: 'LinkedIn Profile', vi: 'LinkedIn cá nhân' },
      form: { platform: 'linkedin', username: 'yourname' },
      style: st('#0a66c2', '#e8f4fc', { frame: 'social', label: 'Connect on LinkedIn', dots: 'rounded' }) },
    { id: 'biz-email', cat: 'business', icon: 'fa-envelope', accent: '#7c3aed', type: 'email',
      name: { en: 'Contact Email', vi: 'Email liên hệ' },
      form: { to: 'hello@company.com', subject: 'Inquiry', body: 'Hi, I would like to know more about...' },
      style: st('#6d28d9', '#f5f3ff', { frame: 'scanme', label: 'Email Us', dots: 'dots' }) },
    { id: 'biz-review', cat: 'business', icon: 'fa-star', accent: '#eab308', type: 'url',
      name: { en: 'Google Review', vi: 'Đánh giá Google' },
      form: { url: 'https://g.page/r/your-business/review' },
      style: st('#ca8a04', '#fefce8', { frame: 'banner', label: 'Leave a Review', banner: true, bannerFrom: '#f59e0b', bannerTo: '#d97706' }) },
    { id: 'biz-booking', cat: 'business', icon: 'fa-calendar-check', accent: '#059669', type: 'url',
      name: { en: 'Book Appointment', vi: 'Đặt lịch hẹn' },
      form: { url: 'https://calendly.com/yourname' },
      style: st('#047857', '#ecfdf5', { frame: 'scanme', label: 'Book Now', dots: 'extra-rounded' }) },
    { id: 'biz-portfolio', cat: 'business', icon: 'fa-briefcase', accent: '#0071e3', type: 'url',
      name: { en: 'Portfolio', vi: 'Portfolio' },
      form: { url: 'https://portfolio.example.com' },
      style: st('#005bb5', '#e3f2fd', { frame: 'border', dots: 'classy-rounded', cornerSq: 'square' }) },
    { id: 'biz-pitch', cat: 'business', icon: 'fa-display', accent: '#dc2626', type: 'url',
      name: { en: 'Pitch Deck', vi: 'Pitch deck' },
      form: { url: 'https://docs.google.com/presentation/d/your-deck' },
      style: st('#b91c1c', '#fef2f2', { frame: 'scanme', label: 'View Deck', dots: 'square' }) },

    // Restaurant
    { id: 'rest-menu', cat: 'restaurant', icon: 'fa-book-open', accent: '#dc2626', type: 'url',
      name: { en: 'Digital Menu', vi: 'Menu số' },
      form: { url: 'https://yourrestaurant.com/menu' },
      style: st('#991b1b', '#fff7ed', { frame: 'scanme', label: 'View Menu', dots: 'rounded', banner: false }) },
    { id: 'rest-wifi', cat: 'restaurant', icon: 'fa-wifi', accent: '#ea580c', type: 'wifi',
      name: { en: 'Guest WiFi', vi: 'WiFi khách' },
      form: { ssid: 'Restaurant_Guest', password: 'Welcome2026', security: 'WPA' },
      style: st('#c2410c', '#ffedd5', { frame: 'badge', dots: 'dots', ecl: 'H' }) },
    { id: 'rest-order', cat: 'restaurant', icon: 'fa-cart-shopping', accent: '#16a34a', type: 'url',
      name: { en: 'Order Online', vi: 'Đặt món online' },
      form: { url: 'https://order.yourrestaurant.com' },
      style: st('#15803d', '#f0fdf4', { frame: 'banner', label: 'Order Now', banner: true, bannerFrom: '#22c55e', bannerTo: '#16a34a' }) },
    { id: 'rest-table', cat: 'restaurant', icon: 'fa-utensils', accent: '#b45309', type: 'url',
      name: { en: 'Table Ordering', vi: 'Gọi món tại bàn' },
      form: { url: 'https://yourrestaurant.com/table/12' },
      style: st('#92400e', '#fef3c7', { frame: 'scanme', label: 'Order at Table', dots: 'classy' }) },
    { id: 'rest-review', cat: 'restaurant', icon: 'fa-heart', accent: '#e11d48', type: 'url',
      name: { en: 'Leave a Review', vi: 'Để lại đánh giá' },
      form: { url: 'https://g.page/r/your-restaurant/review' },
      style: st('#be123c', '#fff1f2', { frame: 'social', label: 'Rate Us ★', dots: 'extra-rounded' }) },
    { id: 'rest-happyhour', cat: 'restaurant', icon: 'fa-martini-glass', accent: '#9333ea', type: 'url',
      name: { en: 'Happy Hour', vi: 'Happy hour' },
      form: { url: 'https://yourrestaurant.com/happy-hour' },
      style: st('#7e22ce', '#faf5ff', { frame: 'banner', label: 'Happy Hour', banner: true, bannerFrom: '#a855f7', bannerTo: '#7c3aed' }) },

    // Social
    { id: 'soc-instagram', cat: 'social', icon: 'fa-instagram', accent: '#e1306c', type: 'social', brandLogo: true,
      name: { en: 'Instagram Bio', vi: 'Instagram bio' },
      form: { platform: 'instagram', username: 'yourbrand' },
      style: stBrand('instagram', { frame: 'social', label: 'Follow Us' }) },
    { id: 'soc-tiktok', cat: 'social', icon: 'fa-tiktok', accent: '#010101', type: 'social',
      name: { en: 'TikTok Profile', vi: 'TikTok' },
      form: { platform: 'tiktok', username: 'yourbrand' },
      style: st('#18181b', '#fafafa', { frame: 'banner', label: 'Follow on TikTok', banner: true, bannerFrom: '#25f4ee', bannerTo: '#fe2c55', labelColor: '#fff' }) },
    { id: 'soc-youtube', cat: 'social', icon: 'fa-youtube', accent: '#ff0000', type: 'social', brandLogo: true,
      name: { en: 'YouTube Channel', vi: 'Kênh YouTube' },
      form: { platform: 'youtube', username: '@yourchannel' },
      style: stBrand('youtube', { frame: 'scanme', label: 'Subscribe' }) },
    { id: 'soc-facebook', cat: 'social', icon: 'fa-facebook', accent: '#1877f2', type: 'social', brandLogo: true,
      name: { en: 'Facebook Page', vi: 'Trang Facebook' },
      form: { platform: 'facebook', username: 'yourpage' },
      style: stBrand('facebook', { frame: 'social', label: 'Like Our Page' }) },
    { id: 'soc-whatsapp', cat: 'social', icon: 'fa-whatsapp', accent: '#25d366', type: 'social',
      name: { en: 'WhatsApp Chat', vi: 'Chat WhatsApp' },
      form: { platform: 'whatsapp', username: '15550100' },
      style: st('#16a34a', '#f0fdf4', { frame: 'scanme', label: 'Chat on WhatsApp', dots: 'dots', ecl: 'H' }) },
    { id: 'soc-telegram', cat: 'social', icon: 'fa-telegram', accent: '#0088cc', type: 'social',
      name: { en: 'Telegram Channel', vi: 'Kênh Telegram' },
      form: { platform: 'telegram', username: 'yourchannel' },
      style: st('#0369a1', '#e0f2fe', { frame: 'badge', dots: 'rounded' }) },
    { id: 'soc-linktree', cat: 'social', icon: 'fa-link', accent: '#10b981', type: 'url',
      name: { en: 'Link in Bio', vi: 'Link in bio' },
      form: { url: 'https://linktr.ee/yourname' },
      style: st('#059669', '#ecfdf5', { frame: 'banner', label: 'All My Links', banner: true, bannerFrom: '#34d399', bannerTo: '#10b981' }) },
    { id: 'soc-twitter', cat: 'social', icon: 'fa-x-twitter', accent: '#000000', type: 'social', brandLogo: true,
      name: { en: 'X / Twitter', vi: 'X / Twitter' },
      form: { platform: 'twitter', username: 'yourhandle' },
      style: stBrand('x', { frame: 'social', label: 'Follow on X' }) },

    // Events
    { id: 'evt-wedding', cat: 'events', icon: 'fa-ring', accent: '#be185d', type: 'url',
      name: { en: 'Wedding RSVP', vi: 'RSVP đám cưới' },
      form: { url: 'https://yourwedding.com/rsvp' },
      style: st('#9d174d', '#fdf2f8', { frame: 'banner', label: 'RSVP Here', banner: true, bannerFrom: '#ec4899', bannerTo: '#be185d' }) },
    { id: 'evt-ticket', cat: 'events', icon: 'fa-ticket', accent: '#7c3aed', type: 'url',
      name: { en: 'Event Ticket', vi: 'Vé sự kiện' },
      form: { url: 'https://eventbrite.com/your-event' },
      style: st('#6d28d9', '#f5f3ff', { frame: 'scanme', label: 'Get Tickets', dots: 'classy-rounded' }) },
    { id: 'evt-conference', cat: 'events', icon: 'fa-microphone', accent: '#2563eb', type: 'vcard',
      name: { en: 'Conference Badge', vi: 'Badge hội nghị' },
      form: { firstName: 'Alex', lastName: 'Chen', title: 'Speaker', org: 'Tech Summit 2026', email: 'alex@techsummit.com', phone: '+1 555 0200' },
      style: st('#1d4ed8', '#dbeafe', { frame: 'badge', dots: 'square', ecl: 'Q' }) },
    { id: 'evt-birthday', cat: 'events', icon: 'fa-cake-candles', accent: '#f97316', type: 'url',
      name: { en: 'Birthday Invite', vi: 'Thiệp sinh nhật' },
      form: { url: 'https://partiful.com/your-party' },
      style: st('#ea580c', '#fff7ed', { frame: 'banner', label: 'You\'re Invited!', banner: true, bannerFrom: '#fb923c', bannerTo: '#f97316' }) },
    { id: 'evt-fundraiser', cat: 'events', icon: 'fa-hand-holding-heart', accent: '#059669', type: 'url',
      name: { en: 'Fundraiser', vi: 'Gây quỹ' },
      form: { url: 'https://gofundme.com/your-campaign' },
      style: st('#047857', '#ecfdf5', { frame: 'scanme', label: 'Donate Now', dots: 'rounded' }) },
    { id: 'evt-meetup', cat: 'events', icon: 'fa-people-group', accent: '#0891b2', type: 'url',
      name: { en: 'Meetup Check-in', vi: 'Check-in meetup' },
      form: { url: 'https://meetup.com/your-group/events' },
      style: st('#0e7490', '#ecfeff', { frame: 'social', label: 'Join Meetup', dots: 'dots' }) },

    // Retail
    { id: 'ret-product', cat: 'retail', icon: 'fa-tag', accent: '#dc2626', type: 'url',
      name: { en: 'Product Page', vi: 'Trang sản phẩm' },
      form: { url: 'https://yourshop.com/products/item' },
      style: st('#b91c1c', '#fef2f2', { frame: 'scanme', label: 'Shop Now', dots: 'square' }) },
    { id: 'ret-promo', cat: 'retail', icon: 'fa-percent', accent: '#9333ea', type: 'text',
      name: { en: 'Promo Code', vi: 'Mã giảm giá' },
      form: { text: 'SAVE20 — 20% off your next order!' },
      style: st('#7e22ce', '#faf5ff', { frame: 'badge', dots: 'classy', ecl: 'H' }) },
    { id: 'ret-store', cat: 'retail', icon: 'fa-store', accent: '#0891b2', type: 'url',
      name: { en: 'Online Store', vi: 'Cửa hàng online' },
      form: { url: 'https://yourshop.com' },
      style: st('#0e7490', '#ecfeff', { frame: 'banner', label: 'Shop Online', banner: true, bannerFrom: '#06b6d4', bannerTo: '#0891b2' }) },
    { id: 'ret-loyalty', cat: 'retail', icon: 'fa-gift', accent: '#d97706', type: 'url',
      name: { en: 'Loyalty Program', vi: 'Khách hàng thân thiết' },
      form: { url: 'https://yourshop.com/rewards' },
      style: st('#b45309', '#fffbeb', { frame: 'scanme', label: 'Join Rewards', dots: 'rounded' }) },
    { id: 'ret-giftcard', cat: 'retail', icon: 'fa-credit-card', accent: '#e11d48', type: 'url',
      name: { en: 'Gift Card', vi: 'Thẻ quà tặng' },
      form: { url: 'https://yourshop.com/gift-cards' },
      style: st('#be123c', '#fff1f2', { frame: 'badge', dots: 'extra-rounded' }) },
    { id: 'ret-pricelist', cat: 'retail', icon: 'fa-list', accent: '#005bb5', type: 'url',
      name: { en: 'Price List PDF', vi: 'Bảng giá PDF' },
      form: { url: 'https://yourshop.com/price-list.pdf' },
      style: st('#0060c4', '#e3f2fd', { frame: 'border', dots: 'classy-rounded' }) },

    // Personal
    { id: 'per-vcard', cat: 'personal', icon: 'fa-address-card', accent: '#0d9488', type: 'vcard',
      name: { en: 'Personal vCard', vi: 'Danh thiếp cá nhân' },
      form: { firstName: 'John', lastName: 'Doe', phone: '+1 555 0300', email: 'john@email.com', website: 'https://johndoe.com' },
      style: st('#0f766e', '#f0fdfa', { frame: 'scanme', label: 'Save Contact', dots: 'rounded', ecl: 'Q' }) },
    { id: 'per-phone', cat: 'personal', icon: 'fa-phone', accent: '#2563eb', type: 'phone',
      name: { en: 'Phone Contact', vi: 'Số điện thoại' },
      form: { phone: '+1 555 0400' },
      style: st('#1d4ed8', '#eff6ff', { frame: 'scanme', label: 'Call Me', dots: 'dots' }) },
    { id: 'per-wifi', cat: 'personal', icon: 'fa-wifi', accent: '#7c3aed', type: 'wifi',
      name: { en: 'Home WiFi', vi: 'WiFi nhà' },
      form: { ssid: 'HomeNetwork', password: 'MySecurePass', security: 'WPA' },
      style: st('#6d28d9', '#f5f3ff', { frame: 'badge', dots: 'rounded', ecl: 'H' }) },
    { id: 'per-emergency', cat: 'personal', icon: 'fa-kit-medical', accent: '#dc2626', type: 'vcard',
      name: { en: 'Emergency Contact', vi: 'Liên hệ khẩn cấp' },
      form: { firstName: 'Emergency', lastName: 'Contact', phone: '+1 555 0911', email: 'family@email.com' },
      style: st('#b91c1c', '#fef2f2', { frame: 'scanme', label: 'Emergency', dots: 'square', ecl: 'H' }) },
    { id: 'per-pet', cat: 'personal', icon: 'fa-paw', accent: '#d97706', type: 'text',
      name: { en: 'Pet Tag', vi: 'Thẻ thú cưng' },
      form: { text: 'If found, call: +1 555 0500 — Reward offered!' },
      style: st('#92400e', '#fffbeb', { frame: 'badge', dots: 'dots', ecl: 'H' }) },
    { id: 'per-resume', cat: 'personal', icon: 'fa-file-lines', accent: '#475569', type: 'url',
      name: { en: 'Resume / CV Link', vi: 'Link CV' },
      form: { url: 'https://linkedin.com/in/yourname' },
      style: st('#334155', '#f8fafc', { frame: 'border', dots: 'classy', cornerSq: 'square' }) },

    // Marketing
    { id: 'mkt-landing', cat: 'marketing', icon: 'fa-rocket', accent: '#0071e3', type: 'url',
      name: { en: 'Landing Page + UTM', vi: 'Landing page + UTM' },
      form: { url: 'https://yoursite.com/offer', showUtm: true, utm_source: 'qr', utm_medium: 'print', utm_campaign: 'spring2026' },
      style: st('#005bb5', '#e3f2fd', { frame: 'banner', label: 'Special Offer', banner: true, bannerFrom: '#2196f3', bannerTo: '#0071e3' }) },
    { id: 'mkt-app', cat: 'marketing', icon: 'fa-mobile-screen', accent: '#000000', type: 'appstore',
      name: { en: 'App Download', vi: 'Tải app' },
      form: { appName: 'My App', iosUrl: 'https://apps.apple.com/app/id123', androidUrl: 'https://play.google.com/store/apps/details?id=com.app' },
      style: st('#171717', '#fafafa', { frame: 'scanme', label: 'Download App', dots: 'extra-rounded' }) },
    { id: 'mkt-newsletter', cat: 'marketing', icon: 'fa-envelope-open-text', accent: '#0891b2', type: 'url',
      name: { en: 'Newsletter Signup', vi: 'Đăng ký newsletter' },
      form: { url: 'https://yoursite.com/newsletter' },
      style: st('#0e7490', '#ecfeff', { frame: 'social', label: 'Subscribe', dots: 'rounded' }) },
    { id: 'mkt-survey', cat: 'marketing', icon: 'fa-clipboard-list', accent: '#059669', type: 'url',
      name: { en: 'Customer Survey', vi: 'Khảo sát khách hàng' },
      form: { url: 'https://forms.google.com/your-survey' },
      style: st('#047857', '#ecfdf5', { frame: 'scanme', label: 'Take Survey', dots: 'dots' }) },
    { id: 'mkt-coupon', cat: 'marketing', icon: 'fa-ticket-simple', accent: '#e11d48', type: 'text',
      name: { en: 'Coupon Code', vi: 'Mã coupon' },
      form: { text: 'QR10OFF — Scan for 10% discount!' },
      style: st('#be123c', '#fff1f2', { frame: 'banner', label: '10% OFF', banner: true, bannerFrom: '#f43f5e', bannerTo: '#e11d48' }) },
    { id: 'mkt-video', cat: 'marketing', icon: 'fa-play', accent: '#dc2626', type: 'url',
      name: { en: 'Video Campaign', vi: 'Chiến dịch video' },
      form: { url: 'https://youtube.com/watch?v=yourvideo' },
      style: st('#b91c1c', '#fef2f2', { frame: 'scanme', label: 'Watch Video', dots: 'classy-rounded' }) },

    // Hospitality
    { id: 'hos-wifi', cat: 'hospitality', icon: 'fa-wifi', accent: '#1e40af', type: 'wifi',
      name: { en: 'Hotel WiFi', vi: 'WiFi khách sạn' },
      form: { ssid: 'Hotel_Guest', password: 'WelcomeGuest', security: 'WPA' },
      style: st('#1e3a8a', '#dbeafe', { frame: 'badge', dots: 'rounded', ecl: 'H' }) },
    { id: 'hos-checkin', cat: 'hospitality', icon: 'fa-door-open', accent: '#0d9488', type: 'url',
      name: { en: 'Hotel Check-in', vi: 'Check-in khách sạn' },
      form: { url: 'https://yourhotel.com/checkin' },
      style: st('#0f766e', '#f0fdfa', { frame: 'scanme', label: 'Check In', dots: 'classy' }) },
    { id: 'hos-roomservice', cat: 'hospitality', icon: 'fa-concierge-bell', accent: '#b45309', type: 'url',
      name: { en: 'Room Service Menu', vi: 'Menu room service' },
      form: { url: 'https://yourhotel.com/room-service' },
      style: st('#92400e', '#fef3c7', { frame: 'banner', label: 'Room Service', banner: true, bannerFrom: '#fbbf24', bannerTo: '#d97706' }) },
    { id: 'hos-spa', cat: 'hospitality', icon: 'fa-spa', accent: '#9333ea', type: 'url',
      name: { en: 'Spa Booking', vi: 'Đặt spa' },
      form: { url: 'https://yourhotel.com/spa-booking' },
      style: st('#7e22ce', '#faf5ff', { frame: 'social', label: 'Book Spa', dots: 'extra-rounded' }) },

    // Education
    { id: 'edu-course', cat: 'education', icon: 'fa-chalkboard-user', accent: '#2563eb', type: 'url',
      name: { en: 'Course Enrollment', vi: 'Đăng ký khóa học' },
      form: { url: 'https://yourcourse.com/enroll' },
      style: st('#1d4ed8', '#eff6ff', { frame: 'scanme', label: 'Enroll Now', dots: 'rounded' }) },
    { id: 'edu-wifi', cat: 'education', icon: 'fa-wifi', accent: '#059669', type: 'wifi',
      name: { en: 'Campus WiFi', vi: 'WiFi campus' },
      form: { ssid: 'Campus_Student', password: 'Student2026', security: 'WPA' },
      style: st('#047857', '#ecfdf5', { frame: 'badge', dots: 'square', ecl: 'H' }) },
    { id: 'edu-library', cat: 'education', icon: 'fa-book', accent: '#7c2d12', type: 'url',
      name: { en: 'Library Catalog', vi: 'Thư viện' },
      form: { url: 'https://library.university.edu/catalog' },
      style: st('#78350f', '#fef3c7', { frame: 'border', dots: 'classy-rounded' }) },
    { id: 'edu-portal', cat: 'education', icon: 'fa-user-graduate', accent: '#0060c4', type: 'url',
      name: { en: 'Student Portal', vi: 'Cổng sinh viên' },
      form: { url: 'https://portal.university.edu' },
      style: st('#004a99', '#e3f2fd', { frame: 'scanme', label: 'Student Portal', dots: 'dots' }) },

    // Real estate
    { id: 're-listing', cat: 'realestate', icon: 'fa-house', accent: '#0891b2', type: 'url',
      name: { en: 'Property Listing', vi: 'Bất động sản' },
      form: { url: 'https://yourlisting.com/property/123' },
      style: st('#0e7490', '#ecfeff', { frame: 'scanme', label: 'View Property', dots: 'classy-rounded' }) },
    { id: 're-tour', cat: 'realestate', icon: 'fa-vr-cardboard', accent: '#0071e3', type: 'url',
      name: { en: 'Virtual Tour', vi: 'Tour ảo 360°' },
      form: { url: 'https://matterport.com/your-tour' },
      style: st('#005bb5', '#e3f2fd', { frame: 'banner', label: 'Virtual Tour', banner: true, bannerFrom: '#2196f3', bannerTo: '#005bb5' }) },
    { id: 're-openhouse', cat: 'realestate', icon: 'fa-map-location-dot', accent: '#059669', type: 'location',
      name: { en: 'Open House', vi: 'Nhà mở cửa' },
      form: { mode: 'address', address: '123 Oak Street, Springfield' },
      style: st('#047857', '#ecfdf5', { frame: 'scanme', label: 'Open House', dots: 'rounded' }) },
    { id: 're-agent', cat: 'realestate', icon: 'fa-user-tie', accent: '#1e40af', type: 'vcard',
      name: { en: 'Real Estate Agent', vi: 'Môi giới BĐS' },
      form: { firstName: 'Sarah', lastName: 'Miller', phone: '+1 555 0600', email: 'sarah@realty.com', org: 'Premier Realty', title: 'Agent', website: 'https://premierrealty.com' },
      style: st('#1e3a8a', '#dbeafe', { frame: 'badge', dots: 'classy', ecl: 'Q' }) }
  ];

  let activeCategory = 'all';
  let searchQuery = '';
  let activeTemplateId = null;
  let onApplyCallback = null;

  function getAll() { return TEMPLATES; }

  function getById(id) {
    return TEMPLATES.find(t => t.id === id) || null;
  }

  function getName(tpl) {
    if (!tpl?.name) return tpl?.id || '';
    const lang = typeof I18n !== 'undefined' ? I18n.getLang() : 'en';
    return tpl.name[lang] || tpl.name.en || tpl.id;
  }

  function getCategoryLabel(catId) {
    if (typeof I18n !== 'undefined') return I18n.t('templates.cat.' + catId);
    return catId;
  }

  function filtered() {
    const q = searchQuery.trim().toLowerCase();
    return TEMPLATES.filter(t => {
      if (activeCategory !== 'all' && t.cat !== activeCategory) return false;
      if (!q) return true;
      const name = getName(t).toLowerCase();
      const cat = getCategoryLabel(t.cat).toLowerCase();
      return name.includes(q) || cat.includes(q) || t.type.includes(q);
    });
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function escapeAttr(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function renderCategories(container) {
    if (!container) return;
    container.innerHTML = CATEGORIES.map(c => `
      <button type="button" class="template-cat-btn${c.id === activeCategory ? ' template-cat-btn--active' : ''}"
        data-cat="${c.id}">
        <i class="${iconClass(c.icon)}" aria-hidden="true"></i>
        <span>${escapeHtml(getCategoryLabel(c.id))}</span>
      </button>
    `).join('');

    container.querySelectorAll('.template-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        renderCategories(container);
        renderGrid(document.getElementById('template-grid'));
      });
    });
  }

  function renderGrid(container) {
    if (!container) return;
    const items = filtered();
    const countEl = document.getElementById('template-count');
    if (countEl) {
      const countLabel = tr('templates.count', { count: items.length });
      if (countLabel != null) countEl.textContent = countLabel;
    }

    if (!items.length) {
      container.innerHTML = `<p class="template-empty">${typeof I18n !== 'undefined' ? I18n.t('templates.empty') : 'No templates found.'}</p>`;
      return;
    }

    container.innerHTML = items.map(t => {
      const active = t.id === activeTemplateId;
      const accent = escapeHtml(t.accent || '#0071e3');
      const brandBadge = t.brandLogo
        ? '<span class="template-card__badge template-card__badge--brand"><i class="fa-solid fa-image" aria-hidden="true"></i></span>'
        : '';
      return `
      <button type="button" class="template-card${active ? ' template-card--active' : ''}"
        data-template-id="${t.id}" title="${escapeHtml(getName(t))}"
        style="--card-accent:${accent}">
        <span class="template-card__icon-wrap" aria-hidden="true">
          ${templateIconMarkup(t.icon)}
        </span>
        <span class="template-card__body">
          <span class="template-card__name">${escapeHtml(getName(t))}</span>
          <span class="template-card__meta">
            <span class="template-card__cat">${escapeHtml(getCategoryLabel(t.cat))}</span>
            <span class="template-card__type">${escapeHtml(t.type.toUpperCase())}</span>
          </span>
        </span>
        ${brandBadge}
        ${active ? '<span class="template-card__check" aria-hidden="true"><i class="fa-solid fa-check"></i></span>' : ''}
      </button>`;
    }).join('');

    container.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.templateId;
        if (onApplyCallback) onApplyCallback(id);
      });
    });
  }

  function setActive(id) {
    activeTemplateId = id;
    renderGrid(document.getElementById('template-grid'));
  }

  function render() {
    renderCategories(document.getElementById('template-categories'));
    renderGrid(document.getElementById('template-grid'));
  }

  function setGridExpanded(expanded) {
    const marketplace = document.getElementById('template-marketplace');
    const expandBtn = document.getElementById('template-grid-expand');
    if (marketplace) marketplace.classList.toggle('template-marketplace--expanded', expanded);
    if (expandBtn) expandBtn.setAttribute('aria-expanded', String(expanded));
  }

  function init(onApply) {
    onApplyCallback = onApply;
    const search = document.getElementById('template-search');
    if (search) {
      search.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (searchQuery.trim()) setGridExpanded(true);
        renderGrid(document.getElementById('template-grid'));
      });
    }

    const expandBtn = document.getElementById('template-grid-expand');
    if (expandBtn) {
      expandBtn.addEventListener('click', () => {
        const marketplace = document.getElementById('template-marketplace');
        const expanded = marketplace && !marketplace.classList.contains('template-marketplace--expanded');
        setGridExpanded(expanded);
      });
    }

    const toggle = document.getElementById('template-marketplace-toggle');
    const body = document.getElementById('template-marketplace-body');
    if (toggle && body) {
      toggle.addEventListener('click', () => {
        const hidden = body.hidden;
        body.hidden = !hidden;
        toggle.setAttribute('aria-expanded', String(hidden));
        const section = document.getElementById('template-marketplace');
        if (section) section.classList.toggle('template-marketplace--collapsed', !hidden);
      });
    }

    document.addEventListener('i18n:change', () => {
      render();
      const marketplace = document.getElementById('template-marketplace');
      if (marketplace) {
        setGridExpanded(marketplace.classList.contains('template-marketplace--expanded'));
      }
    });
    render();
  }

  return {
    CATEGORIES, getAll, getById, getName, getCategoryLabel, filtered,
    init, render, setActive, get count() { return TEMPLATES.length; }
  };
})();
