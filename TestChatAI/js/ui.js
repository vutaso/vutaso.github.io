window.UI = (() => {
  const { escapeHTML, formatTime, truncate, copyToClipboard, autoResize } = window.Utils;
  const { DEFAULT_SYSTEM_PROMPT } = window.APP_CONFIG;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const els = {};

  const cacheEls = () => {
    els.sidebar = $('#sidebar');
    els.sidebarOverlay = $('#sidebarOverlay');
    els.conversationList = $('#conversationList');
    els.messages = $('#messages');
    els.composer = $('#composer');
    els.composerInput = $('#composerInput');
    els.sendBtn = $('#sendBtn');
    els.stopBtn = $('#stopBtn');
    els.newChatBtn = $('#newChatBtn');
    els.themeToggleBtn = $('#themeToggleBtn');
    els.themeIcon = $('#themeIcon');
    els.openSidebarBtn = $('#openSidebarBtn');
    els.settingsModal = $('#settingsModal');
    els.apiKeyInput = $('#apiKeyInput');
    els.apiKeyIcon = $('#apiKeyIcon');
    els.systemPromptInput = $('#systemPromptInput');
    els.settingsForm = $('#settingsForm');
    els.toast = $('#toast');
    els.openSettingsBtn = $('#openSettingsBtn');
    els.headerSettingsBtn = $('#headerSettingsBtn');
    els.downloadConvoBtn = $('#downloadConvoBtn');
    els.copyMarkdownBtn = $('#copyMarkdownBtn');
    els.pdfExportBtn = $('#pdfExportBtn');
    els.clearAllBtn = $('#clearAllBtn');
    els.toggleApiKeyBtn = $('#toggleApiKeyBtn');
  };

  const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    const mc = document.querySelector('meta[name="theme-color"]');
    if (mc) mc.setAttribute('content', theme === 'dark' ? '#0c0c0e' : '#f8f9fc');
    els.themeIcon.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  };

  const renderConversationList = (conversations, currentId) => {
    const html = conversations.length
      ? conversations.map(c => `
          <li class="conversation-item ${c.id === currentId ? 'active' : ''}" data-id="${c.id}">
            <span class="icon" aria-hidden="true"><i class="fa-solid fa-message"></i></span>
            <span class="title" title="${escapeHTML(c.title)}">${escapeHTML(c.title)}</span>
            <span class="actions">
              <button type="button" class="btn btn-icon" data-action="rename" title="Đổi tên"><i class="fa-solid fa-pen"></i></button>
              <button type="button" class="btn btn-icon" data-action="delete" title="Xoá"><i class="fa-solid fa-trash"></i></button>
            </span>
          </li>`).join('')
      : `<li class="conversation-empty" style="padding:12px 16px;color:var(--text-dim);font-size:13px;">Chưa có cuộc trò chuyện nào</li>`;
    els.conversationList.innerHTML = html;
  };

  const renderEmpty = () => {
    els.messages.innerHTML = '<div class="messages-empty"><div class="brand-avatar brand-avatar-lg" aria-hidden="true">V</div><h2>Xin chào!</h2><p class="messages-empty-sub">Tôi có thể giúp gì cho bạn hôm nay? Hỏi bất cứ điều gì — viết, phân tích, lập trình và hơn thế nữa.</p></div>';
  };

  const renderMessages = (convo) => {
    if (!convo || !convo.messages.length) {
      renderEmpty();
      return;
    }
    const shown = convo.messages.map((m, i) => ({ m, i })).filter(({ m }) => {
      if (m.role === 'assistant' && !m.content) return false;
      return true;
    });
    if (!shown.length) {
      renderEmpty();
      return;
    }
    els.messages.innerHTML = shown.map(({ m, i }) => messageHTML(m, i)).join('');
    scrollToBottom();
  };

  const messageHTML = (m, idx) => {
    const isUser = m.role === 'user';
    const avatar = isUser
      ? '<div class="avatar user-av"><i class="fa-solid fa-user"></i></div>'
      : '<div class="avatar assistant-av">V</div>';
    const body = isUser
      ? '<div class="content"><p>' + escapeHTML(m.content).replace(/\n/g, '<br>') + '</p></div>'
      : '<div class="content">' + window.Markdown.render(m.content) + '</div>';
    const idxAttr = idx !== undefined ? ' data-idx="' + idx + '"' : '';
    const editBtn = isUser
      ? '<button type="button" class="tb-btn" data-action="edit" title="Sửa"><i class="fa-solid fa-pen-to-square"></i></button>'
      : '';
    const delBtn = isUser
      ? '<button type="button" class="tb-btn" data-action="delete-msg" title="Xoá"><i class="fa-solid fa-trash"></i></button>'
      : '';
    return '<article class="message ' + m.role + '" data-role="' + m.role + '"' + idxAttr + '>'
      + avatar
      + '<div class="body">' + body
      + '<div class="toolbar">'
      + editBtn
      + '<button type="button" class="tb-btn" data-action="copy" title="Sao chép"><i class="fa-solid fa-copy"></i></button>'
      + delBtn
      + '</div>'
      + '</div></article>';
  };

  const appendMessage = (m, idx) => {
    const empty = els.messages.querySelector('.messages-empty');
    if (empty) empty.remove();
    const div = document.createElement('div');
    div.innerHTML = messageHTML(m, idx);
    const article = div.firstElementChild;
    els.messages.appendChild(article);
    scrollToBottom();
    return article;
  };

  const appendStreamingMessage = () => {
    const empty = els.messages.querySelector('.messages-empty');
    if (empty) empty.remove();
    const article = appendMessage({ role: 'assistant', content: '', ts: Date.now() });
    article.classList.add('streaming');
    const content = article.querySelector('.content');
    return { article, content };
  };

  let streamThrottle = null;
  let _latestCE = null;
  let _latestText = '';
  const updateStreamingContent = (contentEl, text) => {
    _latestCE = contentEl;
    _latestText = text;
    if (streamThrottle) return;
    streamThrottle = requestAnimationFrame(() => {
      if (_latestCE) {
        _latestCE.innerHTML = window.Markdown.render(_latestText);
        rehighlight(_latestCE);
        scrollToBottomIfNear();
      }
      streamThrottle = null;
    });
  };

  const finalizeStreaming = (article, text) => {
    article.classList.remove('streaming');
    const content = article.querySelector('.content');
    if (content) {
      content.innerHTML = window.Markdown.render(text);
      rehighlight(content);
    }
    scrollToBottomIfNear();
  };

  const enterEditMode = (article) => {
    if (article.classList.contains('editing')) return;
    const contentEl = article.querySelector('.content');
    const toolbarEl = article.querySelector('.toolbar');
    article._editOriginal = {
      content: contentEl.innerHTML,
      toolbar: toolbarEl.innerHTML
    };
    const p = contentEl.querySelector('p');
    const text = p ? p.innerText : contentEl.innerText;
    contentEl.innerHTML = '<textarea class="edit-textarea" rows="1">' + escapeHTML(text) + '</textarea>';
    toolbarEl.innerHTML =
      '<button type="button" class="tb-btn" data-action="save-edit" title="Lưu"><i class="fa-solid fa-check"></i></button>' +
      '<button type="button" class="tb-btn" data-action="cancel-edit" title="Huỷ"><i class="fa-solid fa-xmark"></i></button>';
    article.classList.add('editing');
    const textarea = contentEl.querySelector('.edit-textarea');
    autoResize(textarea);
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  };

  const exitEditMode = (article) => {
    if (!article.classList.contains('editing')) return;
    const saved = article._editOriginal;
    if (saved) {
      article.querySelector('.content').innerHTML = saved.content;
      article.querySelector('.toolbar').innerHTML = saved.toolbar;
    }
    article.classList.remove('editing');
    delete article._editOriginal;
  };

  const rehighlight = (root) => {
    if (!window.hljs) return;
    root.querySelectorAll('pre code').forEach(b => {
      if (window.hljs.getLanguage(b.className)) {
        try { window.hljs.highlightElement(b); } catch {}
      }
    });
  };

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      els.messages.scrollTop = els.messages.scrollHeight;
    });
  };

  const isNearBottom = () => {
    const el = els.messages;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  };

  const scrollToBottomIfNear = () => {
    if (isNearBottom()) scrollToBottom();
  };

  const showError = (err) => {
    removeError();
    const div = document.createElement('div');
    div.className = 'error-banner';
    div.id = 'errorBanner';
    div.textContent = `Lỗi: ${err.message || err}. Kiểm tra API key trong Cài đặt.`;
    els.composer.insertAdjacentElement('beforebegin', div);
  };

  const removeError = () => {
    const e = document.getElementById('errorBanner');
    if (e) e.remove();
  };

  const setStreaming = (on) => {
    els.sendBtn.classList.toggle('hidden', on);
    els.stopBtn.classList.toggle('hidden', !on);
    els.composerInput.disabled = on;
  };

  const openSettings = (state) => {
    els.apiKeyInput.value = state.apiKey || '';
    els.systemPromptInput.value = state.systemPrompt || DEFAULT_SYSTEM_PROMPT;
    const radios = els.settingsForm.querySelectorAll('input[name="theme"]');
    radios.forEach(r => { r.checked = r.value === (state.theme || 'dark'); });
    els.apiKeyInput.type = 'password';
    els.apiKeyIcon.innerHTML = '<i class="fa-solid fa-eye"></i>';
    els.settingsModal.classList.remove('hidden');
    setTimeout(() => els.apiKeyInput.focus(), 50);
  };

  const closeSettings = () => els.settingsModal.classList.add('hidden');

  const toggleSidebar = (force) => {
    const app = document.getElementById('app');
    const current = app.getAttribute('data-sidebar');
    let next;
    if (force === true) {
      next = 'open';
    } else if (force === false) {
      next = 'closed';
    } else {
      next = current === 'open' ? 'closed' : 'open';
    }
    app.setAttribute('data-sidebar', next);
    const btn = document.getElementById('openSidebarBtn');
    if (btn) btn.title = next === 'open' ? 'Đóng sidebar' : 'Mở sidebar';
  };

  const downloadConversation = (convo) => {
    const { formatConversation, downloadFile } = window.Utils;
    const md = formatConversation(convo);
    const safeName = (convo.title || 'conversation').replace(/[^a-zA-Z0-9\u00C0-\u1EF9_\-\s]/g, '').trim() || 'conversation';
    downloadFile(md, safeName + '.md', 'text/markdown');
  };

  let toastTimer;
  const showToast = (msg) => {
    els.toast.textContent = msg;
    els.toast.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.add('hidden'), 1800);
  };

  return {
    cacheEls, setTheme,
    renderConversationList, renderMessages, renderEmpty,
    appendMessage, appendStreamingMessage, updateStreamingContent, finalizeStreaming,
    enterEditMode, exitEditMode, downloadConversation,
    scrollToBottom, scrollToBottomIfNear, showError, removeError, setStreaming,
    openSettings, closeSettings, toggleSidebar, showToast, els
  };
})();
