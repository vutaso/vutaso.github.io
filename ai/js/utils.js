window.Utils = (() => {
  const escapeHTML = (str) => String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const SAFE_IMAGE_DATA_RE = /^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/]+=*$/i;

  const safeHref = (href) => {
    const raw = String(href || '').trim();
    if (!raw || /[\s<>]/.test(raw) || /^(javascript|vbscript|data):/i.test(raw)) return '';
    try {
      const url = new URL(raw, window.location.origin);
      if (url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:') {
        return raw;
      }
    } catch {}
    return '';
  };

  const isSafeImageDataUrl = (dataUrl) => {
    if (typeof dataUrl !== 'string') return false;
    if (dataUrl.length > 18_000_000) return false;
    return SAFE_IMAGE_DATA_RE.test(dataUrl.replace(/\s+/g, ''));
  };

  const compressImageDataUrl = (dataUrl, { maxDim = 2048, quality = 0.92, maxChars = 2_500_000 } = {}) => new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string') {
      resolve(dataUrl || '');
      return;
    }
    const image = new Image();
    image.onload = () => {
      const longest = Math.max(image.width, image.height, 1);
      if (longest <= maxDim && dataUrl.length <= maxChars) {
        resolve(dataUrl);
        return;
      }
      const scale = Math.min(1, maxDim / longest);
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(image, 0, 0, width, height);
      let next = canvas.toDataURL('image/jpeg', quality);
      if (next.length > maxChars) next = canvas.toDataURL('image/jpeg', 0.72);
      resolve(next && next.length < dataUrl.length ? next : dataUrl);
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });

  const safeImageSrc = (src) => {
    const raw = String(src || '').trim();
    if (!raw) return '';
    if (isSafeImageDataUrl(raw)) return raw;
    const href = safeHref(raw);
    return /^https?:/i.test(href) ? href : '';
  };

  let purifyHooked = false;
  const ensurePurifyHooks = () => {
    if (purifyHooked || !window.DOMPurify) return;
    purifyHooked = true;
    window.DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName === 'A') {
        const safe = safeHref(node.getAttribute('href'));
        if (!safe) node.removeAttribute('href');
        else {
          node.setAttribute('href', safe);
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }
      }
      if (node.tagName === 'IMG') {
        const safe = safeImageSrc(node.getAttribute('src'));
        if (!safe) node.removeAttribute('src');
        else node.setAttribute('src', safe);
      }
    });
  };

  const sanitizeHtml = (html) => {
    if (!html) return '';
    if (!window.DOMPurify) return String(html);
    ensurePurifyHooks();
    return window.DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true, svg: true, svgFilters: true },
      ADD_ATTR: ['target', 'rel'],
      ADD_TAGS: ['foreignObject']
    });
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    if (sameDay) return time;
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua';
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

  const debounce = (fn, ms) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  const DIACRITIC_RE = /[\u0300-\u036f]/g;

  const normalizeSearchQuery = (query) => String(query || '')
    .normalize('NFD')
    .replace(DIACRITIC_RE, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim();

  const buildSearchFold = (text) => {
    const source = String(text || '');
    if (!source) return { source: '', norm: '', starts: [] };

    const starts = [];
    let norm = '';
    for (let i = 0; i < source.length;) {
      const cp = source.codePointAt(i);
      const char = String.fromCodePoint(cp);
      let folded;
      if (cp === 0x111 || cp === 0x110) {
        folded = 'd';
      } else {
        folded = char.normalize('NFD').replace(DIACRITIC_RE, '').toLowerCase();
      }
      for (let j = 0; j < folded.length; j++) {
        starts.push(i);
        norm += folded[j];
      }
      i += char.length;
    }
    return { source, norm, starts };
  };

  const normalizeSearchText = (text) => buildSearchFold(text).norm;

  const includesSearchFold = (fold, normQuery) => {
    if (!normQuery) return true;
    return fold.norm.includes(normQuery);
  };

  const findSearchRangeInFold = (fold, normQuery) => {
    if (!normQuery) return null;
    const normIdx = fold.norm.indexOf(normQuery);
    if (normIdx < 0) return null;
    const start = fold.starts[normIdx];
    const lastNormIdx = normIdx + normQuery.length - 1;
    const endStart = fold.starts[lastNormIdx];
    const endChar = String.fromCodePoint(fold.source.codePointAt(endStart));
    return { start, end: endStart + endChar.length };
  };

  const findAllSearchRangesInFold = (fold, normQuery, max = 0) => {
    if (!normQuery || !fold?.norm) return [];
    const ranges = [];
    const nq = normQuery.length;
    let from = 0;
    while (from <= fold.norm.length - nq) {
      const normIdx = fold.norm.indexOf(normQuery, from);
      if (normIdx < 0) break;
      const start = fold.starts[normIdx];
      const lastNormIdx = normIdx + nq - 1;
      const endStart = fold.starts[lastNormIdx];
      const endChar = String.fromCodePoint(fold.source.codePointAt(endStart));
      ranges.push({ start, end: endStart + endChar.length });
      if (max > 0 && ranges.length >= max) break;
      from = lastNormIdx + 1;
    }
    return ranges;
  };

  const findSearchRange = (text, query) => {
    const normQuery = normalizeSearchQuery(query);
    if (!normQuery) return null;
    return findSearchRangeInFold(buildSearchFold(text), normQuery);
  };

  const includesSearch = (haystack, needle) => {
    const normQuery = normalizeSearchQuery(needle);
    if (!normQuery) return true;
    return includesSearchFold(buildSearchFold(haystack), normQuery);
  };

  const buildSearchSnippet = (fold, normQuery, radius = 28) => {
    const range = findSearchRangeInFold(fold, normQuery);
    if (!range) return '';
    const text = fold.source;
    const start = Math.max(0, range.start - radius);
    const end = Math.min(text.length, range.end + radius);
    let snippet = text.slice(start, end).replace(/\s+/g, ' ').trim();
    if (start > 0) snippet = '…' + snippet;
    if (end < text.length) snippet = snippet + '…';
    return snippet;
  };

  const highlightSearchText = (text, query, escapeFn = escapeHTML) => {
    const q = (query || '').trim();
    if (!q) return escapeFn(text);
    const normQuery = normalizeSearchQuery(q);
    const range = findSearchRangeInFold(buildSearchFold(text), normQuery);
    if (!range) return escapeFn(text);
    const before = text.slice(0, range.start);
    const match = text.slice(range.start, range.end);
    const after = text.slice(range.end);
    return escapeFn(before)
      + '<mark class="search-hl">' + escapeFn(match) + '</mark>'
      + escapeFn(after);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); document.body.removeChild(ta); return true; }
      catch { document.body.removeChild(ta); return false; }
    }
  };

  const dataUrlToBlob = async (dataUrl) => {
    const res = await fetch(dataUrl);
    return res.blob();
  };

  const extensionFromDataUrl = (dataUrl) => {
    const mime = (dataUrl.match(/^data:([^;,]+)/) || [])[1] || 'image/png';
    if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
    if (mime.includes('webp')) return 'webp';
    if (mime.includes('gif')) return 'gif';
    return 'png';
  };

  const copyImageToClipboard = async (dataUrl) => {
    if (!dataUrl || !navigator.clipboard?.write) return false;
    try {
      const blob = await dataUrlToBlob(dataUrl);
      const type = blob.type || 'image/png';
      await navigator.clipboard.write([new ClipboardItem({ [type]: blob })]);
      return true;
    } catch {
      return false;
    }
  };

  const downloadDataUrlImage = async (dataUrl, filename) => {
    if (!dataUrl) return;
    const ext = extensionFromDataUrl(dataUrl);
    const base = String(filename || 'hinh-ai')
      .replace(/\.(png|jpe?g|webp|gif)$/i, '')
      .replace(/[^\w\-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'hinh-ai';
    const blob = await dataUrlToBlob(dataUrl);
    downloadBlob(blob, base + '.' + ext);
  };

  const truncate = (str, n) => {
    const s = String(str).replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  };

  const autoResize = (el) => {
    if (!el) return;
    const style = getComputedStyle(el);
    const max = parseFloat(style.maxHeight) || 200;
    const min = parseFloat(style.minHeight) || 0;
    el.style.height = min + 'px';
    const next = Math.min(Math.max(el.scrollHeight, min), max);
    el.style.height = next + 'px';
    el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
  };

  const MAX_GROUNDING_CHUNKS = 24;
  const MAX_GROUNDING_QUERIES = 8;
  const MAX_GROUNDING_TITLE = 200;
  const MAX_GROUNDING_URL = 2048;

  const collectGroundingLinks = (meta) => {
    const seen = new Set();
    const links = [];
    for (const item of meta?.groundingChunks || []) {
      const raw = item?.web?.uri || item?.retrievedContext?.uri;
      const uri = safeHref(raw);
      if (!uri || !/^https?:\/\//i.test(uri) || uri.length > MAX_GROUNDING_URL || seen.has(uri)) continue;
      seen.add(uri);
      const title = truncate(item.web?.title || item.retrievedContext?.title || uri, MAX_GROUNDING_TITLE);
      links.push({ uri, title: title || uri });
      if (links.length >= MAX_GROUNDING_CHUNKS) break;
    }
    const queries = [...new Set((meta?.webSearchQueries || [])
      .map((q) => truncate(String(q || ''), 200))
      .filter(Boolean))].slice(0, MAX_GROUNDING_QUERIES);
    return { links, queries };
  };

  const sanitizeGroundingMetadata = (meta) => {
    const { links, queries } = collectGroundingLinks(meta);
    if (!links.length && !queries.length) return null;
    const out = {};
    if (links.length) {
      out.groundingChunks = links.map((link) => ({ web: { uri: link.uri, title: link.title } }));
    }
    if (queries.length) out.webSearchQueries = queries;
    return out;
  };

  const escapeMdLinkText = (value) => String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');

  const escapeMdLinkHref = (value) => String(value || '').replace(/[()]/g, (ch) => encodeURIComponent(ch));

  const formatGroundingAppendix = (meta, { plain = false } = {}) => {
    const { links, queries } = collectGroundingLinks(meta);
    if (!links.length && !queries.length) return '';
    const t = (key, params) => window.I18n?.t?.(key, params) || key;
    const lines = ['', t('sources') + ':'];
    if (queries.length) lines.push(t('sourcesQuery', { q: queries.join(' · ') }));
    links.forEach((link) => {
      lines.push(plain
        ? ('- ' + link.title + ' (' + link.uri + ')')
        : ('- [' + escapeMdLinkText(link.title) + '](' + escapeMdLinkHref(link.uri) + ')'));
    });
    return lines.join('\n');
  };

  const formatConversation = (convo) => {
    const parts = [];
    for (const msg of convo.messages) {
      if (msg.role === 'user') {
        const text = msg.content || '';
        const translateNote = msg.translateTo
          ? '\n\n_' + window.APP_CONFIG.getTranslateLabel(msg.translateTo) + '_'
          : '';
        const imageGenNote = msg.imageGen
          ? '\n\n_' + [
            'Tỷ lệ ' + window.APP_CONFIG.getImageGenRatio(msg.imageGen.ratio).label,
            msg.imageGen.style !== 'auto' ? window.APP_CONFIG.getImageGenStyle(msg.imageGen.style).label : '',
            msg.imageGen.template !== 'none' ? window.APP_CONFIG.getImageGenTemplate(msg.imageGen.template).label : '',
            msg.imageGen.quality && msg.imageGen.quality !== 'auto' ? window.APP_CONFIG.getImageGenQuality(msg.imageGen.quality).id : ''
          ].filter(Boolean).join(' · ') + '_'
          : '';
        const imgNote = msg.images && msg.images.length
          ? '\n\n_[' + msg.images.length + ' hình ảnh đính kèm]_'
          : '';
        const fileNote = msg.files && msg.files.length
          ? '\n\n' + msg.files.map((f) => window.Files.formatFileMarkdown(f, 'Tệp')).join('\n\n')
          : '';
        parts.push('**' + (text || (msg.files && msg.files[0] ? msg.files[0].name : 'Hình ảnh')) + '**' + translateNote + imageGenNote + imgNote + fileNote);
      } else {
        let body = window.Conversations.getAssistantContent(msg) || '';
        if (!body.trim() && msg.generatedImages?.length) {
          body = '_[' + msg.generatedImages.length + ' hình ảnh]_';
        }
        parts.push(body + formatGroundingAppendix(msg.groundingMetadata));
      }
    }
    return parts.join('\n\n---\n\n');
  };

  const INLINE_PLAIN_TAGS = new Set(['STRONG', 'B', 'EM', 'I', 'CODE', 'SPAN', 'A', 'DEL', 'S', 'SUB', 'SUP', 'MARK', 'U']);

  const plainTextFromNode = (node) => {
    if (!node) return '';
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const tag = node.tagName;
    if (tag === 'BR') return '\n';
    if (tag === 'IMG') {
      const alt = (node.getAttribute('alt') || '').trim();
      return alt ? '[hình: ' + alt + ']' : '';
    }
    if (tag === 'A') {
      const label = [...node.childNodes].map(plainTextFromNode).join('').replace(/\s+/g, ' ').trim();
      const href = (node.getAttribute('href') || '').trim();
      if (!href || href === label || href.startsWith('#')) return label;
      return label ? label + ' (' + href + ')' : href;
    }
    if (INLINE_PLAIN_TAGS.has(tag)) {
      return [...node.childNodes].map(plainTextFromNode).join('');
    }
    return [...node.childNodes].map(plainTextFromNode).join('');
  };

  const blockPlainText = (el) => {
    const tag = el.tagName;
    if (tag === 'PRE') {
      const code = el.querySelector('code') || el;
      return (code.textContent || '').replace(/\n$/, '');
    }
    if (tag === 'UL' || tag === 'OL') {
      return [...el.children]
        .filter((child) => child.tagName === 'LI')
        .map((li, index) => {
          const marker = tag === 'OL' ? (index + 1) + '. ' : '- ';
          const body = [...li.childNodes].map((child) => {
            if (child.nodeType === Node.ELEMENT_NODE && (child.tagName === 'UL' || child.tagName === 'OL')) {
              return '\n' + blockPlainText(child).split('\n').map((line) => (line ? '  ' + line : line)).join('\n');
            }
            if (child.nodeType === Node.ELEMENT_NODE && !INLINE_PLAIN_TAGS.has(child.tagName) && child.tagName !== 'BR' && child.tagName !== 'A' && child.tagName !== 'IMG') {
              return '\n' + blockPlainText(child);
            }
            return plainTextFromNode(child);
          }).join('').replace(/\n{3,}/g, '\n\n').trim();
          return marker + body;
        })
        .join('\n');
    }
    if (tag === 'TABLE') {
      const rows = [...el.querySelectorAll('tr')].map((tr) =>
        [...tr.children]
          .filter((cell) => cell.tagName === 'TH' || cell.tagName === 'TD')
          .map((cell) => plainTextFromNode(cell).replace(/\s+/g, ' ').trim())
          .join('\t')
      );
      return rows.filter(Boolean).join('\n');
    }
    if (tag === 'HR') return '---';
    if (tag === 'BLOCKQUOTE') {
      return [...el.childNodes].map((child) => (
        child.nodeType === Node.ELEMENT_NODE ? blockPlainText(child) : plainTextFromNode(child)
      )).join('\n').trim().split('\n').map((line) => line ? '> ' + line : '>').join('\n');
    }
    return [...el.childNodes].map(plainTextFromNode).join('').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  };

  const markdownToPlainText = (text) => {
    const source = String(text || '').replace(/\r\n/g, '\n');
    if (!source.trim()) return '';
    if (!window.Markdown?.render || typeof document === 'undefined') {
      return source
        .replace(/```[^\n]*\n([\s\S]*?)```/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, (_, alt) => alt ? '[hình: ' + alt + ']' : '')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        .replace(/^\s*[-*+]\s+/gm, '- ')
        .trim();
    }

    const html = window.Markdown.render(source);
    if (!html || !html.trim()) {
      return source.trim();
    }
    const host = document.createElement('div');
    host.innerHTML = html;
    const blocks = [...host.childNodes].map((node) => {
      if (node.nodeType === Node.TEXT_NODE) return (node.textContent || '').trim();
      if (node.nodeType !== Node.ELEMENT_NODE) return '';
      return blockPlainText(node);
    }).filter((block) => block && block.trim());
    return blocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
  };

  const formatConversationPlainText = (convo) => {
    const title = (convo.title || 'Cuộc trò chuyện').trim();
    const parts = [title, '='.repeat(Math.min(Math.max(title.length, 12), 72)), ''];

    for (const msg of convo.messages) {
      if (msg.role === 'user') {
        const text = markdownToPlainText(msg.content || '');
        const lines = ['BẠN:'];
        lines.push(text || (msg.files && msg.files[0] ? msg.files[0].name : 'Hình ảnh'));
        if (msg.translateTo) {
          lines.push('(' + window.APP_CONFIG.getTranslateLabel(msg.translateTo) + ')');
        }
        if (msg.imageGen) {
          lines.push('(' + [
            'Tỷ lệ ' + window.APP_CONFIG.getImageGenRatio(msg.imageGen.ratio).label,
            msg.imageGen.style !== 'auto' ? window.APP_CONFIG.getImageGenStyle(msg.imageGen.style).label : '',
            msg.imageGen.template !== 'none' ? window.APP_CONFIG.getImageGenTemplate(msg.imageGen.template).label : '',
            msg.imageGen.quality && msg.imageGen.quality !== 'auto' ? window.APP_CONFIG.getImageGenQuality(msg.imageGen.quality).id : ''
          ].filter(Boolean).join(' · ') + ')');
        }
        if (msg.images && msg.images.length) {
          lines.push('[' + msg.images.length + ' hình ảnh đính kèm]');
        }
        for (const f of msg.files || []) {
          lines.push('', 'Tệp: ' + f.name, f.content || '');
        }
        parts.push(lines.join('\n'));
      } else if (msg.role === 'assistant') {
        let content = markdownToPlainText(window.Conversations.getAssistantContent(msg));
        if (!content && msg.generatedImages?.length) {
          content = '[' + msg.generatedImages.length + ' hình ảnh]';
        }
        if (!content) continue;
        parts.push('TRỢ LÝ:\n' + content + formatGroundingAppendix(msg.groundingMetadata, { plain: true }));
      } else {
        continue;
      }
      parts.push('', '---', '');
    }

    return parts.join('\n').replace(/\n---\n\n$/, '\n').trim() + '\n';
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
    downloadBlob(blob, filename);
  };

  const DOWNLOAD_ALLOWED_KEY = 'testchatai_download_allowed';
  let downloadAnchor = null;

  const isIOSDevice = () =>
    /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const prefersCoarsePointer = () => window.matchMedia('(pointer: coarse)').matches;

  const isDownloadAllowed = () => {
    if (!isIOSDevice()) return true;
    try {
      return localStorage.getItem(DOWNLOAD_ALLOWED_KEY) === '1';
    } catch {
      return false;
    }
  };

  const markDownloadAllowed = () => {
    if (!isIOSDevice()) return;
    try {
      localStorage.setItem(DOWNLOAD_ALLOWED_KEY, '1');
    } catch {}
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    if (!downloadAnchor) {
      downloadAnchor = document.createElement('a');
      downloadAnchor.style.display = 'none';
      document.body.appendChild(downloadAnchor);
    }

    downloadAnchor.href = url;
    downloadAnchor.download = filename;
    downloadAnchor.click();

    const revokeDelay = isIOSDevice() ? 120000 : 1000;
    setTimeout(() => {
      if (downloadAnchor?.href === url) downloadAnchor.removeAttribute('href');
      URL.revokeObjectURL(url);
    }, revokeDelay);

    markDownloadAllowed();
  };

  const deliverDownload = (blob, filename) => {
    if (isDownloadAllowed()) {
      downloadBlob(blob, filename);
      return 'downloaded';
    }
    return 'needs_gesture';
  };


  const exportSafeName = (title) =>
    (title || 'conversation').replace(/[^a-zA-Z0-9\u00C0-\u1EF9_\-\s]/g, '').trim() || 'conversation';

  const filterExportMessages = (convo) => (convo.messages || []).filter((m) => {
    if (m.role !== 'user' && m.role !== 'assistant') return false;
    if (m.role === 'assistant' && !window.Conversations.getAssistantContent(m) && !(m.generatedImages && m.generatedImages.length)) return false;
    return true;
  });

  const DOCX_IMAGE_MAX_PX = 420;
  const exportLabel = (key, fallback) => window.I18n?.t?.(key) || fallback;

  const dataUrlToBytes = (dataUrl) => {
    const base64 = String(dataUrl).split(',')[1];
    if (!base64) throw new Error('Dữ liệu ảnh không hợp lệ');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  };

  const prepareDocxImage = (src, maxPx) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(image.width, image.height, 1));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(image, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/png');
      resolve({
        data: dataUrlToBytes(dataUrl),
        type: 'png',
        width,
        height,
      });
    };
    image.onerror = () => reject(new Error('Không tải được ảnh'));
    image.src = src;
  });

  const DOCX_CODE_FONT = 'Courier New';
  const DOCX_CODE_SIZE = 20;

  const buildDocxCodeLineParagraph = (line, docxLib, { first, last }) => {
    const { Paragraph, TextRun, ShadingType } = docxLib;
    return new Paragraph({
      spacing: { before: first ? 100 : 0, after: last ? 100 : 0, line: 240 },
      indent: { left: 360, right: 360 },
      shading: { fill: 'F5F5F5', type: ShadingType.CLEAR },
      children: [
        new TextRun({
          text: line.length ? line : '\u00A0',
          font: DOCX_CODE_FONT,
          size: DOCX_CODE_SIZE,
        }),
      ],
    });
  };

  const buildDocxCodeBlockParagraphs = (rawCode, docxLib, lang) => {
    const { Paragraph, TextRun } = docxLib;
    const paragraphs = [];
    const code = String(rawCode ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = code.split('\n');

    if (lang) {
      paragraphs.push(new Paragraph({
        spacing: { before: 120, after: 40 },
        indent: { left: 360, right: 360 },
        children: [new TextRun({ text: lang, font: DOCX_CODE_FONT, size: 18, color: '888888', italics: true })],
      }));
    }

    if (!lines.length) {
      paragraphs.push(buildDocxCodeLineParagraph('', docxLib, { first: true, last: true }));
      return paragraphs;
    }

    lines.forEach((line, i) => {
      paragraphs.push(buildDocxCodeLineParagraph(line, docxLib, {
        first: i === 0 && !lang,
        last: i === lines.length - 1,
      }));
    });

    return paragraphs;
  };

  const buildDocxRoleParagraph = (role, docxLib) => {
    const { Paragraph, TextRun } = docxLib;
    return new Paragraph({
      spacing: { before: 240, after: 80 },
      children: [new TextRun({ text: role, bold: true, size: 18, color: '666666', allCaps: true })],
    });
  };

  const appendDocxImages = async (paragraphs, images, docxLib) => {
    const { Paragraph, TextRun, ImageRun } = docxLib;
    for (const img of images || []) {
      if (!img?.dataUrl) continue;
      try {
        const imageData = await prepareDocxImage(img.dataUrl, DOCX_IMAGE_MAX_PX);
        paragraphs.push(new Paragraph({
          spacing: { before: 120, after: 120 },
          children: [
            new ImageRun({
              type: imageData.type,
              data: imageData.data,
              transformation: { width: imageData.width, height: imageData.height },
            }),
          ],
        }));
      } catch {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: '[' + (img.name || exportLabel('viewImage', 'Hình ảnh')) + ']', italics: true, color: '888888' })],
        }));
      }
    }
  };

  const buildDocxUserParagraphs = async (msg, docxLib) => {
    const { Paragraph, TextRun } = docxLib;
    const paragraphs = [buildDocxRoleParagraph(exportLabel('exportRoleUser', 'Bạn'), docxLib)];

    if (msg.content && msg.content.trim()) {
      paragraphs.push(...await window.DocxExport.markdownToDocxParagraphs(msg.content, docxLib));
    }

    await appendDocxImages(paragraphs, msg.images, docxLib);

    for (const file of msg.files || []) {
      paragraphs.push(new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [
          new TextRun({ text: exportLabel('exportFileLabel', 'Tệp: '), bold: true }),
          new TextRun({ text: file.name || 'file' }),
          new TextRun({ text: ' (' + window.Files.formatSize(file.size || 0) + ')', color: '888888' }),
        ],
      }));
      if (file.content && file.content.trim()) {
        const lang = window.Files.getCodeLanguage(file.name);
        paragraphs.push(...buildDocxCodeBlockParagraphs(file.content, docxLib, lang || undefined));
      }
    }

    return paragraphs;
  };

  const buildDocxGroundingParagraphs = (meta, docxLib) => {
    const { links, queries } = collectGroundingLinks(meta);
    if (!links.length && !queries.length) return [];
    const { Paragraph, TextRun, ExternalHyperlink } = docxLib;
    const t = (key, params) => window.I18n?.t?.(key, params) || key;
    const out = [
      new Paragraph({
        spacing: { before: 160, after: 60 },
        children: [new TextRun({ text: t('sources'), bold: true, size: 20, color: '4A4A58' })],
      }),
    ];
    if (queries.length) {
      out.push(new Paragraph({
        spacing: { after: 60 },
        children: [new TextRun({
          text: t('sourcesQuery', { q: queries.join(' · ') }),
          italics: true,
          size: 20,
          color: '6B6B78',
        })],
      }));
    }
    links.forEach((link) => {
      const children = [];
      if (ExternalHyperlink && /^https?:/i.test(link.uri)) {
        children.push(new ExternalHyperlink({
          link: link.uri,
          children: [new TextRun({ text: link.title, color: '2563EB', underline: {} })],
        }));
      } else {
        children.push(new TextRun({ text: link.title, color: '2563EB' }));
      }
      children.push(new TextRun({ text: '  ' + link.uri, color: '6B6B78', size: 18 }));
      out.push(new Paragraph({ spacing: { after: 40 }, children }));
    });
    return out;
  };

  const buildDocxAssistantParagraphs = async (msg, docxLib) => {
    const content = window.Conversations.getAssistantContent(msg);
    const grounding = buildDocxGroundingParagraphs(msg.groundingMetadata, docxLib);
    const images = (msg.generatedImages || []).filter((img) => img?.dataUrl);
    if ((!content || !content.trim()) && !grounding.length && !images.length) return [];
    const paragraphs = [
      buildDocxRoleParagraph(exportLabel('exportRoleAssistant', 'Trợ lý'), docxLib),
      ...(content && content.trim()
        ? await window.DocxExport.markdownToDocxParagraphs(content, docxLib)
        : []),
      ...grounding,
    ];
    await appendDocxImages(paragraphs, images, docxLib);
    return paragraphs;
  };

  const exportToDocx = async (convo) => {
    if (!window.docx) throw new Error('Thư viện docx chưa tải');
    if (!window.DocxExport) throw new Error('Module xuất DOCX chưa tải');

    const messages = filterExportMessages(convo);
    if (!messages.length) throw new Error('Không có tin nhắn để xuất');

    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = window.docx;
    const children = [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 240 },
        children: [new TextRun({ text: convo.title || 'Cuộc trò chuyện', bold: true })],
      }),
    ];

    for (const msg of messages) {
      if (msg.role === 'user') {
        children.push(...await buildDocxUserParagraphs(msg, window.docx));
      } else {
        children.push(...await buildDocxAssistantParagraphs(msg, window.docx));
      }
    }

    const doc = new Document({
      title: convo.title || 'Cuộc trò chuyện',
      sections: [{
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children,
      }],
    });

    const blob = await Packer.toBlob(doc);
    return { blob, filename: exportSafeName(convo.title) + '.docx' };
  };

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Không đọc được file ảnh'));
    reader.readAsDataURL(file);
  });

  const getCodeBlockSource = (block) => {
    if (!block) return '';
    const code = block.querySelector('.code-block-body code') || block.querySelector('code');
    return (code?.textContent ?? '').replace(/\r\n/g, '\n');
  };

  // Cắt các object {...} cân bằng ngoặc ở cấp cao nhất, có nhận biết chuỗi
  // (không bị cắt nhầm bởi { } nằm trong string). Thay cho regex greedy dễ over-match.
  const balancedJsonSlices = (source) => {
    const slices = [];
    let depth = 0;
    let start = -1;
    let inStr = false;
    let quote = '';
    let esc = false;
    for (let i = 0; i < source.length; i++) {
      const ch = source[i];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === '\\') esc = true;
        else if (ch === quote) inStr = false;
        continue;
      }
      if (ch === '"' || ch === "'") {
        inStr = true;
        quote = ch;
      } else if (ch === '{') {
        if (depth === 0) start = i;
        depth++;
      } else if (ch === '}') {
        if (depth > 0) {
          depth--;
          if (depth === 0 && start >= 0) {
            slices.push(source.slice(start, i + 1));
            start = -1;
          }
        }
      }
    }
    return slices;
  };

  // Trả về danh sách object JSON đã parse được từ text của model:
  // thử MỌI fenced code block (```json ... ```) rồi tới các object cân bằng ngoặc.
  // Caller tự chạy normalize và lấy candidate đầu tiên hợp lệ.
  const extractJsonCandidates = (text) => {
    const source = String(text || '');
    if (!source.trim()) return [];
    const seen = new Set();
    const out = [];
    const add = (raw) => {
      const s = (raw || '').trim();
      if (!s || seen.has(s)) return;
      seen.add(s);
      try {
        out.push(JSON.parse(s));
      } catch {}
    };
    const fenceRe = /```(?:json)?\s*([\s\S]*?)```/gi;
    let m;
    while ((m = fenceRe.exec(source)) !== null) add(m[1]);
    for (const slice of balancedJsonSlices(source)) add(slice);
    return out;
  };

  return {
    escapeHTML, safeHref, safeImageSrc, isSafeImageDataUrl, compressImageDataUrl, sanitizeHtml,
    formatTime, uuid, debounce, normalizeSearchQuery, normalizeSearchText,
    getCodeBlockSource,
    buildSearchFold, includesSearchFold, findSearchRangeInFold, findAllSearchRangesInFold,
    buildSearchSnippet, includesSearch, findSearchRange, highlightSearchText,
    copyToClipboard, copyImageToClipboard, downloadDataUrlImage, truncate, autoResize,
    collectGroundingLinks, sanitizeGroundingMetadata, formatConversation, formatConversationPlainText, markdownToPlainText,
    downloadFile, downloadBlob, deliverDownload, isDownloadAllowed, markDownloadAllowed, isIOSDevice, prefersCoarsePointer,
    exportToDocx, readFileAsDataUrl,
    extractJsonCandidates
  };
})();
