(() => {
  const STRINGS = {
    en: {
      back: 'Back to VUTASO AI',
      title: 'Model Pricing',
      subtitle: 'USD per 1M tokens — standard API rates (cache-miss input). Sorted by input price, lowest first.',
      updated: 'Last updated: June 29, 2026',
      colRank: '#',
      colModel: 'Model',
      colProvider: 'Provider',
      colInput: 'Input / 1M',
      colOutput: 'Output / 1M',
      free: 'Free',
      note: '{count} models with published pricing. Actual cost may vary by provider tier, caching, and tool usage (web search, image generation).',
      modelPricing: 'Model Pricing',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service'
    },
    vi: {
      back: 'Về VUTASO AI',
      title: 'Bảng giá model',
      subtitle: 'USD / 1M token — giá API chuẩn (input cache miss). Sắp xếp theo giá input từ thấp đến cao.',
      updated: 'Cập nhật: 29/06/2026',
      colRank: '#',
      colModel: 'Model',
      colProvider: 'Nhà cung cấp',
      colInput: 'Input / 1M',
      colOutput: 'Output / 1M',
      free: 'Miễn phí',
      note: '{count} model có bảng giá. Chi phí thực tế có thể khác theo tier, cache và công cụ (tìm web, tạo ảnh).',
      modelPricing: 'Bảng giá model',
      privacy: 'Chính sách bảo mật',
      terms: 'Điều khoản dịch vụ'
    },
    jp: {
      back: 'VUTASO AI に戻る',
      title: 'モデル料金',
      subtitle: '100万トークンあたりの USD — 標準 API 単価（キャッシュミス入力）。入力単価の安い順。',
      updated: '最終更新: 2026年6月29日',
      colRank: '#',
      colModel: 'モデル',
      colProvider: 'プロバイダー',
      colInput: '入力 / 1M',
      colOutput: '出力 / 1M',
      free: '無料',
      note: '公開料金があるモデル {count} 件。実際のコストは tier、キャッシュ、ツール利用（Web 検索・画像生成）により異なる場合があります。',
      modelPricing: 'モデル料金',
      privacy: 'プライバシーポリシー',
      terms: '利用規約'
    },
    zh: {
      back: '返回 VUTASO AI',
      title: '模型价格',
      subtitle: '每 100 万 Token 的 USD 价格 — 标准 API 单价（未命中缓存输入）。按输入价格从低到高排序。',
      updated: '最后更新：2026 年 6 月 29 日',
      colRank: '#',
      colModel: '模型',
      colProvider: '提供商',
      colInput: '输入 / 1M',
      colOutput: '输出 / 1M',
      free: '免费',
      note: '共 {count} 个模型有公开价格。实际费用可能因 tier、缓存及工具使用（联网搜索、图像生成）而异。',
      modelPricing: '模型价格',
      privacy: '隐私政策',
      terms: '服务条款'
    }
  };

  const HTML_LANG = { en: 'en', vi: 'vi', jp: 'ja', zh: 'zh-CN' };

  const getLocale = () => {
    try {
      const raw = localStorage.getItem('testchatai');
      if (!raw) return 'en';
      const loc = JSON.parse(raw).locale;
      return STRINGS[loc] ? loc : 'en';
    } catch {
      return 'en';
    }
  };

  const t = (key, vars = {}) => {
    const loc = getLocale();
    let text = STRINGS[loc][key] || STRINGS.en[key] || key;
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
    return text;
  };

  const applyTheme = () => {
    try {
      const raw = localStorage.getItem('testchatai');
      if (!raw) return;
      const data = JSON.parse(raw);
      const themeColors = {
        dark: '#0c0c0e',
        'vs-dark': '#1e1e1e',
        apple: '#f5f5f7',
        'apple-dark': '#1c1c1e',
        'hello-kitty': '#fff5f9',
        cyberpunk: '#0a0a12',
        nvidia: '#0d0d0d',
        'liquid-glass': '#0d0d0f'
      };
      if (themeColors[data.theme]) {
        document.documentElement.setAttribute('data-theme', data.theme);
        const mc = document.querySelector('meta[name="theme-color"]');
        if (mc) mc.setAttribute('content', themeColors[data.theme]);
      }
    } catch {}
  };

  const formatUsd = (value) => {
    if (value === 0) return t('free');
    if (value < 0.1) return `$${value.toFixed(3)}`;
    if (value < 10) return `$${value.toFixed(2)}`;
    return `$${value.toFixed(2)}`;
  };

  const renderTable = () => {
    const rows = window.APP_CONFIG.getSortedModelPricing();
    const tbody = document.getElementById('pricingTableBody');
    if (!tbody) return;

    tbody.innerHTML = rows.map((row, index) => {
      const inputClass = row.input === 0 ? 'pricing-price pricing-price-free' : 'pricing-price';
      const outputClass = row.output === 0 ? 'pricing-price pricing-price-free' : 'pricing-price';
      return `<tr>
        <td class="pricing-col-rank">${index + 1}</td>
        <td class="pricing-model-name">${escapeHtml(row.label)}</td>
        <td class="pricing-provider pricing-col-provider">${escapeHtml(row.providerLabel)}</td>
        <td class="pricing-col-price ${inputClass}">${formatUsd(row.input)}</td>
        <td class="pricing-col-price ${outputClass}">${formatUsd(row.output)}</td>
      </tr>`;
    }).join('');

    const note = document.getElementById('pricingNote');
    if (note) note.textContent = t('note', { count: rows.length });
  };

  const escapeHtml = (str) => String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const applyLabels = () => {
    const loc = getLocale();
    document.documentElement.lang = HTML_LANG[loc] || 'en';
    document.title = `${t('title')} — VUTASO AI`;

    const setText = (id, key) => {
      const el = document.getElementById(id);
      if (el) el.textContent = t(key);
    };

    setText('pricingBackText', 'back');
    setText('pricingTitle', 'title');
    setText('pricingSubtitle', 'subtitle');
    setText('pricingUpdated', 'updated');
    setText('pricingColRank', 'colRank');
    setText('pricingColModel', 'colModel');
    setText('pricingColProvider', 'colProvider');
    setText('pricingColInput', 'colInput');
    setText('pricingColOutput', 'colOutput');
    setText('pricingFooterLink', 'modelPricing');
    setText('privacyFooterLink', 'privacy');
    setText('termsFooterLink', 'terms');
  };

  const init = () => {
    applyTheme();
    applyLabels();
    renderTable();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
