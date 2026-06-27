window.Utils = (() => {
  const escapeHTML = (str) => String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

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

  const truncate = (str, n) => {
    const s = String(str).replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  };

  const autoResize = (el) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  const formatConversation = (convo) => {
    const parts = [];
    for (const msg of convo.messages) {
      if (msg.role === 'user') {
        const text = msg.content || '';
        const imgNote = msg.images && msg.images.length
          ? '\n\n_[' + msg.images.length + ' hình ảnh đính kèm]_'
          : '';
        const fileNote = msg.files && msg.files.length
          ? '\n\n' + msg.files.map((f) => '**Tệp: ' + f.name + '**\n```\n' + f.content + '\n```').join('\n\n')
          : '';
        parts.push('**' + (text || (msg.files && msg.files[0] ? msg.files[0].name : 'Hình ảnh')) + '**' + imgNote + fileNote);
      } else {
        parts.push(window.Conversations.getAssistantContent(msg));
      }
    }
    return parts.join('\n\n---\n\n');
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
    downloadBlob(blob, filename);
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const PDF_RASTER_SCALE = 2;
  const PDF_PAGE_JPEG_QUALITY = 0.94;
  const PDF_IMAGE_JPEG_QUALITY = 0.82;
  const PDF_IMAGE_MAX_PX = 200;
  const PDF_FONT_URL = 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts/hinted/ttf/NotoSans/NotoSans-Regular.ttf';

  let cachedPdfFontBase64 = null;

  const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunk = 8192;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  };

  const ensurePdfFont = async (pdf) => {
    if (!cachedPdfFontBase64) {
      const res = await fetch(PDF_FONT_URL);
      if (!res.ok) throw new Error('Không tải được font PDF');
      cachedPdfFontBase64 = arrayBufferToBase64(await res.arrayBuffer());
    }
    pdf.addFileToVFS('NotoSans-Regular.ttf', cachedPdfFontBase64);
    pdf.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
    pdf.setFont('NotoSans');
  };

  const stripMarkdownForPdf = (text) => String(text || '')
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```[^\n]*\n?/g, '').replace(/```/g, '').trim())
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[$1]')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '$1')
    .replace(/^[-*+]\s+/gm, '• ')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/<[^>]+>/g, '')
    .trim();

  const pdfSafeName = (title) =>
    (title || 'conversation').replace(/[^a-zA-Z0-9\u00C0-\u1EF9_\-\s]/g, '').trim() || 'conversation';

  const filterPdfMessages = (convo) => (convo.messages || []).filter((m) => {
    if (m.role !== 'user' && m.role !== 'assistant') return false;
    if (m.role === 'assistant' && !window.Conversations.getAssistantContent(m)) return false;
    return true;
  });

  const hasMathContent = (text) => {
    const t = String(text || '');
    return /\$\$[\s\S]+?\$\$/.test(t)
      || /\\\[[\s\S]+?\\\]/.test(t)
      || /\\\([\s\S]+?\\\)/.test(t)
      || /(?<!\$)\$(?!\$)(?:\\.|[^$\n])+?\$(?!\$)/.test(t);
  };

  const hasRichMarkdown = (text) => {
    const t = String(text || '');
    if (!t.trim()) return false;
    return /```[\s\S]*?```/.test(t)
      || /`[^`\n]+`/.test(t)
      || hasMathContent(t)
      || /!\[[^\]]*\]\([^)]+\)/.test(t)
      || /^#{1,6}\s/m.test(t)
      || /^\s*[-*+]\s+/m.test(t)
      || /^\s*\d+\.\s+/m.test(t)
      || /^>\s/m.test(t)
      || /\*\*[^*\n]+\*\*/.test(t)
      || /(?<!\*)\*[^*\n]+\*(?!\*)/.test(t)
      || /\|[^|\n]+\|/.test(t)
      || /^(?:graph\s|flowchart\s|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie\s|gitGraph)/im.test(t);
  };

  const getMessageText = (msg) => {
    if (msg.role === 'assistant') return window.Conversations.getAssistantContent(msg);
    return msg.content || '';
  };

  const needsFormattedPdf = (messages) => messages.some((m) => {
    if (m.images && m.images.length) return true;
    return hasRichMarkdown(getMessageText(m));
  });

  const resizeImageSource = (src, maxPx) => new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(image.width, image.height, 1));
      const w = Math.max(1, Math.round(image.width * scale));
      const h = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(image, 0, 0, w, h);
      resolve({ dataUrl: canvas.toDataURL('image/jpeg', PDF_IMAGE_JPEG_QUALITY), w, h });
    };
    image.onerror = () => reject(new Error('Không tải được ảnh'));
    image.src = src;
  });

  const clampImagesInElement = async (root, maxPx) => {
    const imgs = [...root.querySelectorAll('img')].filter((img) => !img.closest('.katex'));
    await Promise.all(imgs.map(async (img) => {
      const src = img.getAttribute('src');
      if (!src) return;
      try {
        const { dataUrl, w, h } = await resizeImageSource(src, maxPx);
        img.src = dataUrl;
        img.width = w;
        img.height = h;
        img.style.width = w + 'px';
        img.style.height = h + 'px';
        img.style.maxWidth = w + 'px';
        img.style.maxHeight = h + 'px';
        img.style.objectFit = 'contain';
      } catch {
        img.remove();
      }
    }));
  };

  const writePdfLines = (pdf, lines, margin, maxY, lineH) => {
    let y = margin;
    for (const line of lines) {
      if (y > maxY) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += lineH;
    }
    return y;
  };

  const exportTextPDF = async (convo, messages) => {
    if (!window.jspdf) throw new Error('Thư viện jsPDF chưa tải');

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
    await ensurePdfFont(pdf);

    const margin = 14;
    const pageH = 297;
    const maxW = 210 - margin * 2;
    const maxY = pageH - margin;
    const bodyLineH = 5;
    let y = margin;

    pdf.setFontSize(15);
    const titleLines = pdf.splitTextToSize(convo.title || 'Cuộc trò chuyện', maxW);
    y = writePdfLines(pdf, titleLines, margin, maxY, 7) + 4;

    for (const msg of messages) {
      const role = msg.role === 'user' ? 'BẠN' : 'TRỢ LÝ';
      let body = '';
      if (msg.role === 'user') {
        body = msg.content || '';
        if (msg.files && msg.files.length) {
          body += (body ? '\n\n' : '') + msg.files.map((f) => '[Tệp: ' + f.name + ']').join('\n');
        }
      } else {
        body = stripMarkdownForPdf(window.Conversations.getAssistantContent(msg));
      }
      if (!body.trim()) continue;

      if (y > maxY - 12) { pdf.addPage(); y = margin; }
      pdf.setFontSize(8);
      pdf.setTextColor(110);
      pdf.text(role, margin, y);
      y += 4.5;

      pdf.setFontSize(10.5);
      pdf.setTextColor(20);
      const lines = pdf.splitTextToSize(body, maxW);
      for (const line of lines) {
        if (y > maxY) { pdf.addPage(); y = margin; }
        pdf.text(line, margin, y);
        y += bodyLineH;
      }
      y += 5;
    }

    pdf.save(pdfSafeName(convo.title) + '.pdf');
  };

  const KATEX_FONT_FAMILIES = [
    'KaTeX_Main', 'KaTeX_Math', 'KaTeX_AMS', 'KaTeX_Caligraphic',
    'KaTeX_Fraktur', 'KaTeX_SansSerif', 'KaTeX_Script',
    'KaTeX_Size1', 'KaTeX_Size2', 'KaTeX_Size3', 'KaTeX_Size4',
    'KaTeX_Typewriter',
  ];

  const preloadKatexFonts = async () => {
    if (!document.fonts) return;
    const variants = ['normal normal 400 1em ', 'italic normal 400 1em ', 'normal normal 700 1em '];
    const specs = KATEX_FONT_FAMILIES.flatMap((f) => variants.map((v) => v + f));
    try {
      await Promise.allSettled(specs.map((s) => document.fonts.load(s)));
    } catch {}
  };

  const waitForPdfLayout = async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    await preloadKatexFonts();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await new Promise((resolve) => setTimeout(resolve, 120));
  };

  const PDF_PAGE_MARGIN_MM = 14;
  const PDF_CONTENT_WIDTH = 760;
  const PDF_PAGE_PAD_PX = 12;

  const getPdfPageStyleCss = () => {
    const c = {
      text: '#111118',
      textMuted: '#4a4a58',
      textDim: '#7a7a8a',
      border: '#e2e4ec',
      bgElev: '#f8f9fc',
      accent: '#2563eb',
      codeBg: '#1e1e2e',
      radius: '10px',
    };
    const p = '.pdf-export-page';
    return p + '{font-variant-ligatures:none;font-feature-settings:"liga" 0}'
      + p + ' h1{font-size:1.3em;margin:0 0 12px;border-bottom:2px solid ' + c.text + ';padding-bottom:6px;font-weight:700}'
      + p + ' .msg{margin:16px 0;padding-bottom:12px;border-bottom:1px solid ' + c.border + '}'
      + p + ' .msg:last-child{border-bottom:0;padding-bottom:0}'
      + p + ' .msg>strong{color:' + c.textDim + ';display:block;margin-bottom:6px;font-size:0.78em;text-transform:uppercase;letter-spacing:0.6px;font-weight:600}'
      + p + ' p{margin:0 0 8px}'
      + p + ' h1:not(:first-child),'+p+' h2,'+p+' h3,'+p+' h4,'+p+' h5,'+p+' h6{margin:14px 0 6px;font-weight:600;line-height:1.35}'
      + p + ' h2{font-size:1.22em}' + p + ' h3{font-size:1.12em}' + p + ' h4{font-size:1.05em}'
      + p + ' ul,'+p+' ol{margin:6px 0 10px 22px;padding:0}'
      + p + ' li{margin-bottom:4px}'
      + p + ' a{color:' + c.accent + ';text-decoration:none}'
      + p + ' hr{border:0;border-top:1px solid ' + c.border + ';margin:12px 0}'
      + '.pre-header,.copy-code-btn,.copy-table-btn,.preview-md-btn,.toggle-mermaid-btn,.table-header,.mermaid-source,.mermaid-source-raw{display:none!important}'
      + p + ' pre{background:' + c.codeBg + ';border:1px solid #2a2a35;border-radius:' + c.radius + ';padding:0;margin:12px 0;overflow:hidden}'
      + p + ' pre code{display:block;padding:12px 14px;font-family:"SFMono-Regular",Menlo,Consolas,monospace;font-size:12.5px;line-height:1.55;background:transparent!important;color:#abb2bf;white-space:pre-wrap;word-break:break-word;overflow-x:auto}'
      + p + ' :not(pre)>code{background:' + c.bgElev + ';border:1px solid ' + c.border + ';border-radius:5px;padding:2px 6px;font-family:"SFMono-Regular",Menlo,Consolas,monospace;font-size:0.88em;color:' + c.text + '}'
      + p + ' blockquote{border-left:3px solid ' + c.accent + ';padding-left:12px;margin:10px 0;color:' + c.textMuted + ';font-style:italic}'
      + p + ' .table-block{margin:12px 0;border:1px solid ' + c.border + ';border-radius:' + c.radius + ';overflow:hidden;background:#fff}'
      + p + ' .table-scroll{overflow:visible}'
      + p + ' table{border-collapse:collapse;width:100%;margin:0}'
      + p + ' th,'+p+' td{border:1px solid ' + c.border + ';padding:7px 11px;text-align:left;font-size:13px}'
      + p + ' th{background:' + c.bgElev + ';font-weight:600}'
      + p + ' .mermaid-block{margin:12px 0;border:1px solid ' + c.border + ';border-radius:' + c.radius + ';overflow:hidden;background:#fff}'
      + p + ' .mermaid-view{padding:14px;text-align:center}'
      + p + ' .mermaid-view svg{max-width:100%;height:auto;display:block;margin:0 auto}'
      + p + ' .pdf-user-img{display:block;object-fit:contain;border-radius:' + c.radius + ';margin:8px 0;max-width:100%}'
      + p + ' .math-inline{display:inline;vertical-align:middle;margin:0 2px}'
      + p + ' .math-inline .katex{font-size:1.08em;color:' + c.text + ';vertical-align:middle}'
      + p + ' .math-inline .katex-html{vertical-align:middle}'
      + p + ' .math-block{display:block;margin:12px 0;padding:8px 0;overflow:visible;text-align:center;width:100%}'
      + p + ' .math-block .katex-display{margin:0;overflow:visible!important;}'
      + p + ' .math-block>.katex,.math-block .katex-display>.katex{font-size:1.2em;color:' + c.text + '}'
      + p + ' .katex{color:' + c.text + ';overflow:visible!important}'
      + p + ' .katex .katex-html{overflow:visible!important}'
      + p + ' .katex-display>.katex>.katex-html{display:block;position:relative;overflow:visible!important}';
  };

  const getPdfPageShellCss = () =>
    'width:' + PDF_CONTENT_WIDTH + 'px;padding:' + PDF_PAGE_PAD_PX + 'px;box-sizing:border-box;'
    + 'font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.6;color:#1a1a1a;background:#fff;';

  const pushMdBlocks = (parent, blocks) => {
    for (const child of parent.children) {
      if (child.matches('h1,h2,h3,h4,h5,h6,p,pre,.math-block,.table-block,blockquote,.mermaid-block,.pdf-user-img')) {
        blocks.push(child);
      } else if (child.matches('ul,ol')) {
        [...child.children].forEach((li) => blocks.push(li));
      } else if (child.matches('.md-content')) {
        pushMdBlocks(child, blocks);
      } else if (child.tagName === 'DIV') {
        pushMdBlocks(child, blocks);
      } else {
        blocks.push(child);
      }
    }
  };

  const collectPdfBlocks = (root) => {
    const blocks = [];
    const title = root.querySelector('h1');
    if (title) blocks.push(title);
    root.querySelectorAll('.msg').forEach((msg) => {
      const label = msg.querySelector(':scope > strong');
      if (label) blocks.push(label);
      const md = msg.querySelector('.md-content');
      if (md) {
        pushMdBlocks(md, blocks);
      }
      msg.querySelectorAll(':scope > p, :scope > .pdf-user-img, :scope > div:not(.md-content)').forEach((el) => {
        if (el !== label) blocks.push(el);
      });
    });
    return blocks;
  };

  const paginateBlocks = (blocks, pageFullHeight, styleCSS, measureHost) => {
    const measureGroup = (group) => {
      if (!group.length) return 0;
      const probe = document.createElement('div');
      probe.className = 'pdf-export-page';
      probe.style.cssText = getPdfPageShellCss() + 'position:absolute;left:-9999px;top:0;visibility:hidden;';
      group.forEach((block) => probe.appendChild(block.cloneNode(true)));
      probe.insertAdjacentHTML('beforeend', '<style>' + styleCSS + '</style>');
      measureHost.appendChild(probe);
      const h = probe.offsetHeight;
      measureHost.removeChild(probe);
      return h;
    };

    const pages = [];
    let i = 0;
    while (i < blocks.length) {
      let lo = 1;
      let hi = blocks.length - i;
      let best = 1;

      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (measureGroup(blocks.slice(i, i + mid)) <= pageFullHeight) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }

      pages.push(blocks.slice(i, i + best));
      i += best;
    }
    return pages;
  };

  const buildPdfPageDiv = (sourceBlocks, styleCSS) => {
    const page = document.createElement('div');
    page.className = 'pdf-export-page';
    page.style.cssText = getPdfPageShellCss();
    sourceBlocks.forEach((block) => page.appendChild(block.cloneNode(true)));
    page.insertAdjacentHTML('beforeend', '<style>' + styleCSS + '</style>');
    return page;
  };

  const getKatexStylesheetHref = () => {
    const link = document.querySelector('link[href*="katex"][rel="stylesheet"]');
    return link ? link.href : 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css';
  };

  const capturePdfPage = async (pageEl) => window.html2canvas(pageEl, {
    scale: PDF_RASTER_SCALE,
    useCORS: true,
    allowTaint: false,
    logging: false,
    width: PDF_CONTENT_WIDTH,
    windowWidth: PDF_CONTENT_WIDTH,
    backgroundColor: '#ffffff',
    imageTimeout: 15000,
    onclone: (clonedDoc, clonedEl) => {
      const existing = clonedDoc.querySelector('link[href*="katex"]');
      if (!existing) {
        const link = clonedDoc.createElement('link');
        link.rel = 'stylesheet';
        link.crossOrigin = 'anonymous';
        link.href = getKatexStylesheetHref();
        clonedDoc.head.appendChild(link);
      }
      clonedEl.querySelectorAll('.katex-display').forEach((node) => {
        node.style.setProperty('overflow', 'visible', 'important');
      });
      clonedEl.querySelectorAll('.katex-html').forEach((node) => {
        node.style.setProperty('overflow', 'visible', 'important');
      });
      clonedEl.querySelectorAll('.katex').forEach((node) => {
        node.style.setProperty('color', '#111118', 'important');
        node.style.setProperty('overflow', 'visible', 'important');
      });
    },
  });

  const exportRasterPDF = async (convo, messages) => {
    if (!window.html2canvas) throw new Error('Thư viện html2canvas chưa tải');
    if (!window.jspdf) throw new Error('Thư viện jsPDF chưa tải');
    if (!window.Markdown) throw new Error('Markdown chưa sẵn sàng');

    const styleCSS = getPdfPageStyleCss();
    const messagesHTML = messages.map((msg) => {
      if (msg.role === 'user') {
        const text = msg.content
          ? (hasRichMarkdown(msg.content)
            ? '<div class="md-content">' + window.Markdown.render(msg.content) + '</div>'
            : '<p>' + escapeHTML(msg.content).replace(/\n/g, '<br>') + '</p>')
          : '';
        const imgs = (msg.images || []).map((img) =>
          '<img class="pdf-user-img" src="' + img.dataUrl + '" alt="' + escapeHTML(img.name || 'image') + '" />'
        ).join('');
        const files = (msg.files || []).map((f) =>
          '<div style="margin-top:8px;padding:8px 12px;border:1px solid #ddd;border-radius:8px;font-size:13px">'
          + '<strong>' + escapeHTML(f.name) + '</strong>'
          + ' <span style="color:#888">(' + window.Files.formatSize(f.size || 0) + ')</span>'
          + '</div>'
        ).join('');
        return '<div class="msg"><strong>User:</strong>' + text + imgs + files + '</div>';
      }
      return '<div class="msg"><strong>Assistant:</strong><div class="md-content">' + window.Markdown.render(window.Conversations.getAssistantContent(msg)) + '</div></div>';
    }).join('');
    const titleHTML = '<h1 style="font-size:1.3em;margin-bottom:12px;border-bottom:2px solid #333;padding-bottom:6px">' + escapeHTML(convo.title) + '</h1>';
    const measureRoot = document.createElement('div');
    measureRoot.className = 'pdf-export-root';
    measureRoot.style.cssText = 'position:fixed;left:-9999px;top:0;' + getPdfPageShellCss();
    measureRoot.innerHTML = titleHTML + messagesHTML + '<style>' + styleCSS + '</style>';
    document.body.appendChild(measureRoot);
    const renderHost = document.createElement('div');
    renderHost.style.cssText = 'position:fixed;left:-9999px;top:0;';
    document.body.appendChild(renderHost);
    try {
      await window.Markdown.prepareForExport(measureRoot);
      await clampImagesInElement(measureRoot, PDF_IMAGE_MAX_PX);
      await waitForPdfLayout();

      const cw = 210 - PDF_PAGE_MARGIN_MM * 2;
      const ch = 297 - PDF_PAGE_MARGIN_MM * 2;
      const pageFullHeight = Math.floor(PDF_CONTENT_WIDTH * (ch / cw));
      const blocks = collectPdfBlocks(measureRoot);
      const pageGroups = paginateBlocks(blocks, pageFullHeight, styleCSS, measureRoot);

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });

      for (let i = 0; i < pageGroups.length; i++) {
        const pageEl = buildPdfPageDiv(pageGroups[i], styleCSS);
        renderHost.appendChild(pageEl);
        window.Markdown.rehighlightCode(pageEl);
        await waitForPdfLayout();
        const canvas = await capturePdfPage(pageEl);
        pageEl.remove();

        if (!canvas.width || !canvas.height) {
          throw new Error('Không thể render nội dung hội thoại');
        }

        const pxPerMm = canvas.width / cw;
        const imgHmm = Math.min(canvas.height / pxPerMm, ch);
        if (i > 0) pdf.addPage();
        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          PDF_PAGE_MARGIN_MM,
          PDF_PAGE_MARGIN_MM,
          cw,
          imgHmm,
          undefined,
          'FAST'
        );
      }

      pdf.save(pdfSafeName(convo.title) + '.pdf');
    } catch (err) {
      if (err.name === 'SecurityError') {
        throw new Error('Không thể xuất ảnh ngoài (CORS). Thử xuất hội thoại không có ảnh.');
      }
      throw err;
    } finally {
      if (measureRoot.parentNode) measureRoot.parentNode.removeChild(measureRoot);
      if (renderHost.parentNode) renderHost.parentNode.removeChild(renderHost);
    }
  };

  const exportToPDF = async (convo) => {
    const messages = filterPdfMessages(convo);
    if (!messages.length) throw new Error('Không có tin nhắn để xuất');

    if (needsFormattedPdf(messages)) {
      await exportRasterPDF(convo, messages);
    } else {
      await exportTextPDF(convo, messages);
    }
  };

  const DOCX_IMAGE_MAX_PX = 420;
  const DOCX_PAGE_WIDTH_TWIPS = 12240;
  const DOCX_H_MARGIN_TWIPS = 720;

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

  const parseFencedCodeBlock = (segment) => {
    const closed = segment.match(/^```([^\n`]*)\n([\s\S]*)```$/);
    if (closed) {
      return { lang: closed[1].trim(), code: closed[2].replace(/\n$/, '') };
    }
    const open = segment.match(/^```([^\n`]*)\n?([\s\S]*)$/);
    if (open) {
      return { lang: open[1].trim(), code: open[2].replace(/\n$/, '') };
    }
    return { lang: '', code: segment.replace(/^```[^\n]*\n?/, '').replace(/```$/, '') };
  };

  const isIndentedCodeLine = (line) => /^(?: {4}|\t)/.test(line);

  const stripIndentedCodePrefix = (line) => {
    if (/^ {4}/.test(line)) return line.slice(4);
    if (/^\t/.test(line)) return line.slice(1);
    return line;
  };

  const parseInlineMarkdown = (text, docxLib) => {
    const { TextRun, ShadingType } = docxLib;
    const runs = [];
    const parts = String(text).split(/(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g);
    for (const part of parts) {
      if (!part) continue;
      if (part.startsWith('**') && part.endsWith('**')) {
        runs.push(new TextRun({ text: part.slice(2, -2), bold: true }));
      } else if (part.startsWith('*') && part.endsWith('*')) {
        runs.push(new TextRun({ text: part.slice(1, -1), italics: true }));
      } else if (part.startsWith('`') && part.endsWith('`')) {
        runs.push(new TextRun({
          text: part.slice(1, -1),
          font: DOCX_CODE_FONT,
          size: DOCX_CODE_SIZE,
          shading: { fill: 'EEEEEE', type: ShadingType.CLEAR },
        }));
      } else {
        runs.push(new TextRun({ text: part }));
      }
    }
    return runs.length ? runs : [new TextRun({ text: '' })];
  };

  const parseMarkdownTableCells = (line) => {
    let trimmed = String(line || '').trim();
    if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
    if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
    return trimmed.split('|').map((cell) => cell.trim());
  };

  const isMarkdownTableSeparator = (line) => {
    const cells = parseMarkdownTableCells(line);
    return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
  };

  const isMarkdownTableRow = (line) => {
    const trimmed = String(line || '').trim();
    if (!trimmed.includes('|')) return false;
    if (isMarkdownTableSeparator(trimmed)) return true;
    return /^\|/.test(trimmed);
  };

  const buildDocxTable = (rows, docxLib) => {
    const {
      Table, TableRow, TableCell, Paragraph, WidthType, ShadingType, BorderStyle, TableLayoutType,
    } = docxLib;
    const parsedRows = rows.map(parseMarkdownTableCells);
    const colCount = Math.max(1, ...parsedRows.map((cells) => cells.length));
    const contentWidth = DOCX_PAGE_WIDTH_TWIPS - DOCX_H_MARGIN_TWIPS * 2;
    const colWidthTwips = Math.floor(contentWidth / colCount);
    const columnWidths = Array(colCount).fill(colWidthTwips);
    const cellBorders = {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    };

    const tableRows = parsedRows.map((cells, rowIndex) => {
      const padded = cells.slice();
      while (padded.length < colCount) padded.push('');
      const isHeader = rowIndex === 0;

      return new TableRow({
        tableHeader: isHeader,
        children: padded.map((cellText) => new TableCell({
          width: { size: colWidthTwips, type: WidthType.DXA },
          borders: cellBorders,
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          shading: isHeader ? { fill: 'F0F4F8', type: ShadingType.CLEAR } : undefined,
          children: [
            new Paragraph({
              children: parseInlineMarkdown(cellText, docxLib),
            }),
          ],
        })),
      });
    });

    return new Table({
      layout: TableLayoutType.FIXED,
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths,
      rows: tableRows,
    });
  };

  const processMarkdownLines = (text, docxLib) => {
    const { Paragraph, TextRun, HeadingLevel } = docxLib;
    const paragraphs = [];
    const lines = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trimEnd();

      if (isIndentedCodeLine(line)) {
        const codeLines = [];
        while (i < lines.length && isIndentedCodeLine(lines[i])) {
          codeLines.push(stripIndentedCodePrefix(lines[i]));
          i++;
        }
        paragraphs.push(...buildDocxCodeBlockParagraphs(codeLines.join('\n'), docxLib));
        continue;
      }

      if (!trimmed) {
        paragraphs.push(new Paragraph({ children: [] }));
        i++;
        continue;
      }

      const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const headingMap = {
          1: HeadingLevel.HEADING_1,
          2: HeadingLevel.HEADING_2,
          3: HeadingLevel.HEADING_3,
          4: HeadingLevel.HEADING_4,
          5: HeadingLevel.HEADING_5,
          6: HeadingLevel.HEADING_6,
        };
        paragraphs.push(new Paragraph({
          heading: headingMap[level] || HeadingLevel.HEADING_3,
          children: parseInlineMarkdown(headingMatch[2], docxLib),
        }));
        i++;
        continue;
      }

      const bulletMatch = trimmed.match(/^[-*+]\s+(.+)$/);
      if (bulletMatch) {
        paragraphs.push(new Paragraph({
          indent: { left: 360 },
          children: parseInlineMarkdown('• ' + bulletMatch[1], docxLib),
        }));
        i++;
        continue;
      }

      const numMatch = trimmed.match(/^\d+\.\s+(.+)$/);
      if (numMatch) {
        paragraphs.push(new Paragraph({
          children: parseInlineMarkdown(trimmed, docxLib),
        }));
        i++;
        continue;
      }

      const quoteMatch = trimmed.match(/^>\s*(.*)$/);
      if (quoteMatch) {
        paragraphs.push(new Paragraph({
          indent: { left: 720 },
          children: [new TextRun({ text: quoteMatch[1], italics: true, color: '666666' })],
        }));
        i++;
        continue;
      }

      if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
        paragraphs.push(new Paragraph({
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text: '—'.repeat(24), color: 'CCCCCC' })],
        }));
        i++;
        continue;
      }

      if (isMarkdownTableRow(trimmed)) {
        const tableLines = [];
        while (i < lines.length) {
          const rowTrimmed = lines[i].trim();
          if (!rowTrimmed || !isMarkdownTableRow(rowTrimmed)) break;
          tableLines.push(rowTrimmed);
          i++;
        }
        const dataRows = tableLines.filter((line) => !isMarkdownTableSeparator(line));
        if (dataRows.length) {
          paragraphs.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
          paragraphs.push(buildDocxTable(dataRows, docxLib));
          paragraphs.push(new Paragraph({ spacing: { before: 80 }, children: [] }));
        }
        continue;
      }

      paragraphs.push(new Paragraph({
        children: parseInlineMarkdown(trimmed, docxLib),
      }));
      i++;
    }

    return paragraphs;
  };

  const markdownToDocxParagraphs = (text, docxLib) => {
    const paragraphs = [];
    const segments = String(text || '').split(/(```[\s\S]*?```)/g);

    for (const seg of segments) {
      if (!seg.trim()) continue;
      if (seg.startsWith('```')) {
        const { lang, code } = parseFencedCodeBlock(seg);
        paragraphs.push(...buildDocxCodeBlockParagraphs(code, docxLib, lang || undefined));
        continue;
      }
      paragraphs.push(...processMarkdownLines(seg, docxLib));
    }

    return paragraphs;
  };

  const buildDocxRoleParagraph = (role, docxLib) => {
    const { Paragraph, TextRun } = docxLib;
    return new Paragraph({
      spacing: { before: 240, after: 80 },
      children: [new TextRun({ text: role, bold: true, size: 18, color: '666666', allCaps: true })],
    });
  };

  const buildDocxUserParagraphs = async (msg, docxLib) => {
    const { Paragraph, TextRun, ImageRun } = docxLib;
    const paragraphs = [buildDocxRoleParagraph('Bạn', docxLib)];

    if (msg.content && msg.content.trim()) {
      paragraphs.push(...markdownToDocxParagraphs(msg.content, docxLib));
    }

    for (const img of msg.images || []) {
      if (!img.dataUrl) continue;
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
          children: [new TextRun({ text: '[' + (img.name || 'Hình ảnh') + ']', italics: true, color: '888888' })],
        }));
      }
    }

    for (const file of msg.files || []) {
      paragraphs.push(new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [
          new TextRun({ text: 'Tệp: ', bold: true }),
          new TextRun({ text: file.name || 'file' }),
          new TextRun({ text: ' (' + window.Files.formatSize(file.size || 0) + ')', color: '888888' }),
        ],
      }));
      if (file.content && file.content.trim()) {
        paragraphs.push(...buildDocxCodeBlockParagraphs(file.content, docxLib));
      }
    }

    return paragraphs;
  };

  const buildDocxAssistantParagraphs = (msg, docxLib) => {
    const content = window.Conversations.getAssistantContent(msg);
    if (!content || !content.trim()) return [];
    return [
      buildDocxRoleParagraph('Trợ lý', docxLib),
      ...markdownToDocxParagraphs(content, docxLib),
    ];
  };

  const exportToDocx = async (convo) => {
    if (!window.docx) throw new Error('Thư viện docx chưa tải');

    const messages = filterPdfMessages(convo);
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
        children.push(...buildDocxAssistantParagraphs(msg, window.docx));
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
    downloadBlob(blob, pdfSafeName(convo.title) + '.docx');
  };

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Không đọc được file ảnh'));
    reader.readAsDataURL(file);
  });

  return { escapeHTML, formatTime, uuid, debounce, copyToClipboard, truncate, autoResize, formatConversation, downloadFile, downloadBlob, exportToPDF, exportToDocx, readFileAsDataUrl };
})();
