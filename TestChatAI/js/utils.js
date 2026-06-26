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
        parts.push('**' + msg.content + '**');
      } else {
        parts.push(msg.content);
      }
    }
    return parts.join('\n\n---\n\n');
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const exportToPDF = async (convo) => {
    if (!window.html2canvas) throw new Error('Thư viện html2canvas chưa tải');
    if (!window.jspdf) throw new Error('Thư viện jsPDF chưa tải');
    if (!window.Markdown) throw new Error('Markdown chưa sẵn sàng');

    const messages = (convo.messages || []).filter((m) => {
      if (m.role !== 'user' && m.role !== 'assistant') return false;
      if (m.role === 'assistant' && !m.content) return false;
      return true;
    });
    if (!messages.length) throw new Error('Không có tin nhắn để xuất');

    const styleCSS = '.msg{margin-bottom:16px}.msg strong{color:#555;display:block;margin-bottom:2px;font-size:0.8em;text-transform:uppercase;letter-spacing:0.5px}.msg p{margin:0}.pre-header{display:none}pre{background:#f8f8f8;padding:10px;border-radius:4px;overflow-x:auto;font-size:0.85em;white-space:pre-wrap}code{font-family:monospace;font-size:0.85em}blockquote{border-left:3px solid #ddd;padding-left:10px;margin:8px 0;color:#666}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:4px 8px;text-align:left}th{background:#f0f0f0}img{max-width:100%}';
    const contentWidth = 760;
    const messagesHTML = messages.map(msg => {
      if (msg.role === 'user') {
        return '<div class="msg"><strong>User:</strong><p>' + escapeHTML(msg.content).replace(/\n/g, '<br>') + '</p></div>';
      } else {
        return '<div class="msg"><strong>Assistant:</strong><div>' + window.Markdown.render(msg.content) + '</div></div>';
      }
    }).join('');
    const titleHTML = '<h1 style="font-size:1.3em;margin-bottom:12px;border-bottom:2px solid #333;padding-bottom:6px">' + escapeHTML(convo.title) + '</h1>';
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:' + contentWidth + 'px;padding:16px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.65;color:#1a1a1a;background:#fff;';
    container.innerHTML = titleHTML + messagesHTML + '<style>' + styleCSS + '</style>';
    document.body.appendChild(container);
    try {
      const fullCanvas = await window.html2canvas(container, { scale: 2, useCORS: true, logging: false });
      if (!fullCanvas.width || !fullCanvas.height) {
        throw new Error('Không thể render nội dung hội thoại');
      }
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = 210;
      const pageH = 297;
      const margin = 14;
      const cw = pageW - margin * 2;
      const ch = pageH - margin * 2;
      const pxPerMm = fullCanvas.width / cw;
      const pagePx = ch * pxPerMm;
      const total = Math.ceil(fullCanvas.height / pagePx);
      for (let i = 0; i < total; i++) {
        const sy = Math.floor(i * pagePx);
        const sh = Math.min(pagePx, fullCanvas.height - sy);
        const slice = document.createElement('canvas');
        slice.width = fullCanvas.width;
        slice.height = sh;
        slice.getContext('2d').drawImage(fullCanvas, 0, sy, fullCanvas.width, sh, 0, 0, fullCanvas.width, sh);
        if (i > 0) pdf.addPage();
        pdf.addImage(slice.toDataURL('image/png'), 'PNG', margin, margin, cw, sh / pxPerMm);
      }
      const safeName = (convo.title || 'conversation').replace(/[^a-zA-Z0-9\u00C0-\u1EF9_\-\s]/g, '').trim() || 'conversation';
      pdf.save(safeName + '.pdf');
    } catch (err) {
      if (err.name === 'SecurityError') {
        throw new Error('Không thể xuất ảnh ngoài (CORS). Thử xuất hội thoại không có ảnh.');
      }
      throw err;
    } finally {
      if (container.parentNode) container.parentNode.removeChild(container);
    }
  };

  return { escapeHTML, formatTime, uuid, debounce, copyToClipboard, truncate, autoResize, formatConversation, downloadFile, exportToPDF };
})();
