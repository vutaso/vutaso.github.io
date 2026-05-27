/**
 * QR Type definitions — 12 types with field descriptors and encode functions
 */
const QR_TYPES = [
  {
    id: 'url',
    label: 'URL',
    icon: 'fa-link',
    defaultData: { url: 'https://example.com', showUtm: false, utm_source: '', utm_medium: '', utm_campaign: '', utm_term: '', utm_content: '' },
    fields: [
      { name: 'url', label: 'Website URL', type: 'url', placeholder: 'https://example.com', required: true },
      { name: 'showUtm', label: 'Add UTM campaign parameters', type: 'checkbox' },
      { name: 'utm_source', label: 'UTM Source', type: 'text', placeholder: 'google', showWhen: { showUtm: true } },
      { name: 'utm_medium', label: 'UTM Medium', type: 'text', placeholder: 'cpc', showWhen: { showUtm: true } },
      { name: 'utm_campaign', label: 'UTM Campaign', type: 'text', placeholder: 'spring_sale', showWhen: { showUtm: true } },
      { name: 'utm_term', label: 'UTM Term (optional)', type: 'text', placeholder: 'keyword', showWhen: { showUtm: true } },
      { name: 'utm_content', label: 'UTM Content (optional)', type: 'text', placeholder: 'banner_a', showWhen: { showUtm: true } }
    ],
    encode(data) {
      let url = (data.url || '').trim();
      if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
      if (!data.showUtm) return url;

      try {
        const u = new URL(url);
        const params = { utm_source: data.utm_source, utm_medium: data.utm_medium, utm_campaign: data.utm_campaign, utm_term: data.utm_term, utm_content: data.utm_content };
        Object.entries(params).forEach(([k, v]) => {
          if (v && String(v).trim()) u.searchParams.set(k, String(v).trim());
        });
        return u.toString();
      } catch {
        return url;
      }
    }
  },
  {
    id: 'text',
    label: 'Text',
    icon: 'fa-font',
    defaultData: { text: 'Hello, World!' },
    fields: [
      { name: 'text', label: 'Plain Text', type: 'textarea', placeholder: 'Enter your text...', required: true }
    ],
    encode(data) {
      return (data.text || '').trim();
    }
  },
  {
    id: 'wifi',
    label: 'WiFi',
    icon: 'fa-wifi',
    defaultData: { ssid: '', password: '', security: 'WPA', hidden: false },
    fields: [
      { name: 'ssid', label: 'Network Name (SSID)', type: 'text', placeholder: 'MyWiFi', required: true },
      { name: 'password', label: 'Password', type: 'password', placeholder: 'Password' },
      {
        name: 'security', label: 'Security', type: 'select', options: [
          { value: 'WPA', label: 'WPA/WPA2' },
          { value: 'WEP', label: 'WEP' },
          { value: 'nopass', label: 'None (Open)' }
        ]
      },
      { name: 'hidden', label: 'Hidden Network', type: 'checkbox' }
    ],
    encode(data) {
      const ssid = escapeWifi(data.ssid || '');
      const pass = escapeWifi(data.password || '');
      const sec = data.security === 'nopass' ? 'nopass' : (data.security || 'WPA');
      const hidden = data.hidden ? 'H:true;' : '';
      return `WIFI:T:${sec};S:${ssid};P:${pass};${hidden};`;
    }
  },
  {
    id: 'vcard',
    label: 'vCard',
    icon: 'fa-address-card',
    defaultData: { firstName: '', lastName: '', phone: '', email: '', org: '', title: '', website: '', address: '' },
    fields: [
      { name: 'firstName', label: 'First Name', type: 'text', placeholder: 'John', required: true },
      { name: 'lastName', label: 'Last Name', type: 'text', placeholder: 'Doe' },
      { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 234 567 8900' },
      { name: 'email', label: 'Email', type: 'email', placeholder: 'john@example.com' },
      { name: 'org', label: 'Organization', type: 'text', placeholder: 'Company Inc.' },
      { name: 'title', label: 'Job Title', type: 'text', placeholder: 'Software Engineer' },
      { name: 'website', label: 'Website', type: 'url', placeholder: 'https://example.com' },
      { name: 'address', label: 'Address', type: 'text', placeholder: '123 Main St, City' }
    ],
    encode(data) {
      const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
      const fn = [data.firstName, data.lastName].filter(Boolean).join(' ');
      if (fn) lines.push(`FN:${fn}`);
      if (data.firstName) lines.push(`N:${data.lastName || ''};${data.firstName};;;`);
      if (data.phone) lines.push(`TEL:${data.phone}`);
      if (data.email) lines.push(`EMAIL:${data.email}`);
      if (data.org) lines.push(`ORG:${data.org}`);
      if (data.title) lines.push(`TITLE:${data.title}`);
      if (data.website) lines.push(`URL:${data.website}`);
      if (data.address) lines.push(`ADR:;;${data.address};;;;`);
      lines.push('END:VCARD');
      return lines.join('\n');
    }
  },
  {
    id: 'email',
    label: 'Email',
    icon: 'fa-envelope',
    defaultData: { to: '', subject: '', body: '' },
    fields: [
      { name: 'to', label: 'To', type: 'email', placeholder: 'recipient@example.com', required: true },
      { name: 'subject', label: 'Subject', type: 'text', placeholder: 'Email subject' },
      { name: 'body', label: 'Body', type: 'textarea', placeholder: 'Email message...' }
    ],
    encode(data) {
      const params = [];
      if (data.subject) params.push(`subject=${encodeURIComponent(data.subject)}`);
      if (data.body) params.push(`body=${encodeURIComponent(data.body)}`);
      const qs = params.length ? '?' + params.join('&') : '';
      return `mailto:${(data.to || '').trim()}${qs}`;
    }
  },
  {
    id: 'sms',
    label: 'SMS',
    icon: 'fa-comment-sms',
    defaultData: { phone: '', message: '' },
    fields: [
      { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1234567890', required: true },
      { name: 'message', label: 'Message', type: 'textarea', placeholder: 'Your message...' }
    ],
    encode(data) {
      const phone = (data.phone || '').replace(/\s/g, '');
      const msg = data.message ? `?body=${encodeURIComponent(data.message)}` : '';
      return `sms:${phone}${msg}`;
    }
  },
  {
    id: 'phone',
    label: 'Phone',
    icon: 'fa-phone',
    defaultData: { phone: '' },
    fields: [
      { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1234567890', required: true }
    ],
    encode(data) {
      return `tel:${(data.phone || '').replace(/\s/g, '')}`;
    }
  },
  {
    id: 'location',
    label: 'Location',
    icon: 'fa-location-dot',
    defaultData: { mode: 'coords', lat: '', lng: '', address: '' },
    fields: [
      {
        name: 'mode', label: 'Input Mode', type: 'select', options: [
          { value: 'coords', label: 'Coordinates (Lat/Lng)' },
          { value: 'address', label: 'Address' }
        ]
      },
      { name: 'lat', label: 'Latitude', type: 'text', placeholder: '37.7749', showWhen: { mode: 'coords' } },
      { name: 'lng', label: 'Longitude', type: 'text', placeholder: '-122.4194', showWhen: { mode: 'coords' } },
      { name: 'address', label: 'Address', type: 'text', placeholder: '1600 Amphitheatre Pkwy, Mountain View, CA', showWhen: { mode: 'address' } }
    ],
    encode(data) {
      if (data.mode === 'address' && data.address) {
        return `https://maps.google.com/?q=${encodeURIComponent(data.address.trim())}`;
      }
      const lat = parseFloat(data.lat);
      const lng = parseFloat(data.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        return `geo:${lat},${lng}`;
      }
      return '';
    }
  },
  {
    id: 'social',
    label: 'Social',
    icon: 'fa-share-nodes',
    defaultData: { platform: 'instagram', username: '' },
    fields: [
      {
        name: 'platform', label: 'Platform', type: 'select', options: [
          { value: 'facebook', label: 'Facebook' },
          { value: 'instagram', label: 'Instagram' },
          { value: 'whatsapp', label: 'WhatsApp' },
          { value: 'telegram', label: 'Telegram' },
          { value: 'youtube', label: 'YouTube' },
          { value: 'tiktok', label: 'TikTok' },
          { value: 'linkedin', label: 'LinkedIn' },
          { value: 'twitter', label: 'X (Twitter)' }
        ]
      },
      { name: 'username', label: 'Username or URL', type: 'text', placeholder: '@username or full URL', required: true }
    ],
    encode(data) {
      const val = (data.username || '').trim();
      if (/^https?:\/\//i.test(val)) return val;
      const user = val.replace(/^@/, '');
      const urls = {
        facebook: `https://facebook.com/${user}`,
        instagram: `https://instagram.com/${user}`,
        whatsapp: `https://wa.me/${user.replace(/\D/g, '')}`,
        telegram: `https://t.me/${user}`,
        youtube: user.startsWith('@') ? `https://youtube.com/${user}` : `https://youtube.com/@${user}`,
        tiktok: `https://tiktok.com/@${user}`,
        linkedin: `https://linkedin.com/in/${user}`,
        twitter: `https://x.com/${user}`
      };
      return urls[data.platform] || val;
    }
  },
  {
    id: 'appstore',
    label: 'App Store',
    icon: 'fa-mobile-screen',
    defaultData: { appName: '', iosUrl: '', androidUrl: '' },
    fields: [
      { name: 'appName', label: 'App Name', type: 'text', placeholder: 'My App' },
      { name: 'iosUrl', label: 'iOS App Store URL', type: 'url', placeholder: 'https://apps.apple.com/app/...' },
      { name: 'androidUrl', label: 'Google Play URL', type: 'url', placeholder: 'https://play.google.com/store/apps/...' }
    ],
    encode(data) {
      const ios = String(data.iosUrl || '').trim();
      const android = String(data.androidUrl || '').trim();
      // One URL per QR — prefer iOS when both are set (see validation warning)
      return ios || android;
    }
  },
  {
    id: 'crypto',
    label: 'Crypto',
    icon: 'fa-bitcoin-sign',
    defaultData: { currency: 'BTC', address: '', amount: '', label: '' },
    fields: [
      {
        name: 'currency', label: 'Currency', type: 'select', options: [
          { value: 'BTC', label: 'Bitcoin (BTC)' },
          { value: 'ETH', label: 'Ethereum (ETH)' },
          { value: 'custom', label: 'Custom' }
        ]
      },
      { name: 'address', label: 'Wallet Address', type: 'text', placeholder: 'Wallet address', required: true },
      { name: 'amount', label: 'Amount (optional)', type: 'text', placeholder: '0.001' },
      { name: 'label', label: 'Label (optional)', type: 'text', placeholder: 'Payment for...' }
    ],
    encode(data) {
      const addr = (data.address || '').trim();
      if (!addr) return '';
      const cur = (data.currency || 'BTC').toUpperCase();
      const schemeMap = { BTC: 'bitcoin', ETH: 'ethereum' };
      const scheme = schemeMap[cur] || (cur === 'CUSTOM' ? 'bitcoin' : cur.toLowerCase());
      const params = [];
      if (data.amount) params.push(`amount=${data.amount}`);
      if (data.label) params.push(`label=${encodeURIComponent(data.label)}`);
      const qs = params.length ? '?' + params.join('&') : '';
      return `${scheme}:${addr}${qs}`;
    }
  }
];

function escapeWifi(str) {
  return String(str).replace(/([\\;,"])/g, '\\$1');
}

function getTypeById(id) {
  return QR_TYPES.find(t => t.id === id) || QR_TYPES[0];
}

function encodeQRData(typeId, formData) {
  const type = getTypeById(typeId);
  return type.encode(formData);
}

function parseBatchRow(typeId, rawData, extra = {}) {
  const type = QR_TYPES.find(t => t.id === typeId);
  if (!type) return '';

  const data = String(rawData || '').trim();
  if (!data) return '';

  if (typeId === 'url') return type.encode({ url: data });
  if (typeId === 'text') return data;
  if (typeId === 'phone') return type.encode({ phone: data });
  if (typeId === 'email') return type.encode({ to: data });
  if (typeId === 'sms') return type.encode({ phone: data, message: extra.message || '' });

  if (typeId === 'social') {
    if (/^https?:\/\//i.test(data)) return data;
    const platform = (extra.platform || '').trim().toLowerCase();
    if (platform) return type.encode({ platform, username: data });
    const colon = data.match(/^([a-z0-9_]+):(.+)$/i);
    if (colon) return type.encode({ platform: colon[1].toLowerCase(), username: colon[2].trim() });
    return type.encode({ platform: 'instagram', username: data });
  }

  if (typeId === 'wifi') {
    if (/^WIFI:/i.test(data)) return data;
    const parts = data.split('|').map((p) => p.trim());
    return type.encode({
      ssid: parts[0] || '',
      password: parts[1] || '',
      security: parts[2] || 'WPA'
    });
  }

  if (typeId === 'vcard') {
    if (/BEGIN:VCARD/i.test(data)) return data;
    const parts = data.split('|').map((p) => p.trim());
    return type.encode({
      firstName: parts[0] || '',
      lastName: parts[1] || '',
      phone: parts[2] || '',
      email: parts[3] || '',
      org: parts[4] || ''
    });
  }

  if (typeId === 'location') {
    if (/^geo:/i.test(data)) return data;
    const parts = data.split('|').map((p) => p.trim());
    if (parts.length >= 2 && !isNaN(parseFloat(parts[0]))) {
      return type.encode({ mode: 'coords', lat: parts[0], lng: parts[1] });
    }
    return type.encode({ mode: 'address', address: data });
  }

  // Pre-encoded payloads
  if (/^(WIFI:|mailto:|tel:|sms:|geo:|BEGIN:VCARD|https?:|bitcoin:|ethereum:|eth:)/i.test(data)) {
    return data;
  }

  return data;
}
