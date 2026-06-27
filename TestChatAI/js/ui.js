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
    els.selectionReplyTooltip = $('#selectionReplyTooltip');
    els.openSettingsBtn = $('#openSettingsBtn');
    els.headerSettingsBtn = $('#headerSettingsBtn');
    els.downloadConvoBtn = $('#downloadConvoBtn');
    els.copyMarkdownBtn = $('#copyMarkdownBtn');
    els.pdfExportBtn = $('#pdfExportBtn');
    els.docxExportBtn = $('#docxExportBtn');
    els.clearAllBtn = $('#clearAllBtn');
    els.clearAllSidebarBtn = $('#clearAllSidebarBtn');
    els.toggleApiKeyBtn = $('#toggleApiKeyBtn');
    els.composerAttachments = $('#composerAttachments');
    els.composerDropZone = $('#composerDropZone');
    els.appDropOverlay = $('#appDropOverlay');
    els.app = $('#app');
    els.attachImageBtn = $('#attachImageBtn');
    els.attachFileBtn = $('#attachFileBtn');
    els.imageFileInput = $('#imageFileInput');
    els.documentFileInput = $('#documentFileInput');
    els.markdownPreviewPanel = $('#markdownPreviewPanel');
    els.markdownPreviewContent = $('#markdownPreviewContent');
    els.closeMdPreviewBtn = $('#closeMdPreviewBtn');
    els.mdPreviewOverlay = $('#mdPreviewOverlay');
    els.renameModal = $('#renameModal');
    els.renameForm = $('#renameForm');
    els.renameInput = $('#renameInput');
    els.modelSelect = $('#modelSelect');
  };

  const initModelSelect = (currentModel) => {
    const { MODELS, DEFAULT_MODEL } = window.APP_CONFIG;
    const selected = currentModel || DEFAULT_MODEL;
    els.modelSelect.innerHTML = MODELS.map((m) =>
      '<option value="' + escapeHTML(m.id) + '"' + (m.id === selected ? ' selected' : '') + '>'
      + escapeHTML(m.label) + '</option>'
    ).join('');
  };

  const userFilesHTML = (files) => {
    if (!files || !files.length) return '';
    return '<div class="message-files">' + files.map((f) =>
      '<div class="message-file-chip">'
      + '<i class="fa-solid ' + window.Files.getIconClass(f.name) + '"></i>'
      + '<span class="message-file-name" title="' + escapeHTML(f.name) + '">' + escapeHTML(f.name) + '</span>'
      + '<span class="message-file-size">' + window.Files.formatSize(f.size || 0) + '</span>'
      + '</div>'
    ).join('') + '</div>';
  };

  const userImagesHTML = (images) => {
    if (!images || !images.length) return '';
    return '<div class="message-images">' + images.map((img, i) =>
      '<div class="message-image-wrap">'
      + '<img src="' + img.dataUrl + '" alt="' + escapeHTML(img.name || 'Hình ảnh ' + (i + 1)) + '" loading="lazy" />'
      + '</div>'
    ).join('') + '</div>';
  };

  const userContentHTML = (m) => {
    const text = m.content && m.content.trim()
      ? '<p>' + escapeHTML(m.content).replace(/\n/g, '<br>') + '</p>'
      : '';
    return text + userImagesHTML(m.images) + userFilesHTML(m.files);
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
    closeMarkdownPreview();
    els.messages.innerHTML = '<div class="messages-empty"><div class="brand-avatar brand-avatar-lg" aria-hidden="true">V</div><h2>Xin chào!</h2><p class="messages-empty-sub">Tôi có thể giúp gì cho bạn hôm nay? Kéo thả ảnh hoặc tài liệu vào màn hình để phân tích.</p></div>';
  };

  const renderMessages = (convo) => {
    closeMarkdownPreview();
    if (!convo || !convo.messages.length) {
      renderEmpty();
      return;
    }
    const shown = convo.messages.map((m, i) => ({ m, i })).filter(({ m }) => {
      if (m.role === 'assistant' && !window.Conversations.getAssistantContent(m)) return false;
      return true;
    });
    if (!shown.length) {
      renderEmpty();
      return;
    }
    els.messages.innerHTML = shown.map(({ m, i }) => messageHTML(m, i)).join('');
    polishContent(els.messages);
    scrollToBottom();
  };

  const assistantToolbarHTML = (m) => {
    const variants = m.variants && m.variants.length ? m.variants : (m.content ? [m.content] : []);
    const variantIndex = m.variantIndex ?? 0;
    const total = variants.length;
    const current = variantIndex + 1;

    let pager = '';
    if (total > 1) {
      pager = '<span class="variant-nav">'
        + '<button type="button" class="tb-btn variant-btn" data-action="variant-prev" title="Phiên bản trước"'
        + (variantIndex <= 0 ? ' disabled' : '')
        + '><i class="fa-solid fa-chevron-left"></i></button>'
        + '<span class="variant-count">' + current + ' / ' + total + '</span>'
        + '<button type="button" class="tb-btn variant-btn" data-action="variant-next" title="Phiên bản sau"'
        + (variantIndex >= total - 1 ? ' disabled' : '')
        + '><i class="fa-solid fa-chevron-right"></i></button>'
        + '</span>';
    }

    return '<button type="button" class="tb-btn" data-action="copy" title="Sao chép"><i class="fa-solid fa-copy"></i></button>'
      + '<button type="button" class="tb-btn" data-action="retry" title="Tạo lại"><i class="fa-solid fa-rotate-right"></i></button>'
      + pager;
  };

  const messageHTML = (m, idx) => {
    const isUser = m.role === 'user';
    const avatar = isUser
      ? '<div class="avatar user-av"><i class="fa-solid fa-user"></i></div>'
      : '<div class="avatar assistant-av">V</div>';
    const assistantText = isUser ? '' : window.Conversations.getAssistantContent(m);
    const body = isUser
      ? '<div class="content">' + userContentHTML(m) + '</div>'
      : '<div class="content">' + window.Markdown.render(assistantText) + '</div>';
    const idxAttr = idx !== undefined ? ' data-idx="' + idx + '"' : '';
    const editBtn = isUser
      ? '<button type="button" class="tb-btn" data-action="edit" title="Sửa"><i class="fa-solid fa-pen-to-square"></i></button>'
      : '';
    const delBtn = isUser
      ? '<button type="button" class="tb-btn" data-action="delete-msg" title="Xoá"><i class="fa-solid fa-trash"></i></button>'
      : '';
    const toolbar = isUser
      ? editBtn
        + '<button type="button" class="tb-btn" data-action="copy" title="Sao chép"><i class="fa-solid fa-copy"></i></button>'
        + delBtn
      : assistantToolbarHTML(m);
    return '<article class="message ' + m.role + '" data-role="' + m.role + '"' + idxAttr + '>'
      + avatar
      + '<div class="body">' + body
      + '<div class="toolbar">' + toolbar + '</div>'
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

  const appendStreamingMessage = (idx) => {
    resetStreamingCodeScroll();
    const empty = els.messages.querySelector('.messages-empty');
    if (empty) empty.remove();
    const article = appendMessage({ role: 'assistant', content: '', variants: [''], variantIndex: 0, ts: Date.now() }, idx);
    article.classList.add('streaming');
    const content = article.querySelector('.content');
    return { article, content };
  };

  const setAssistantToolbar = (article, m) => {
    const toolbar = article?.querySelector('.toolbar');
    if (toolbar && m?.role === 'assistant') toolbar.innerHTML = assistantToolbarHTML(m);
  };

  const updateAssistantMessage = (idx, m) => {
    const article = els.messages.querySelector('[data-idx="' + idx + '"]');
    if (!article) return;
    const content = article.querySelector('.content');
    if (content) {
      content.innerHTML = window.Markdown.render(window.Conversations.getAssistantContent(m));
      polishContent(content, { renderMermaid: true });
    }
    setAssistantToolbar(article, m);
  };

  const beginRetryStreaming = (idx) => {
    resetStreamingCodeScroll();
    els.messages.querySelectorAll('.message').forEach((article) => {
      const i = parseInt(article.dataset.idx, 10);
      if (!isNaN(i) && i > idx) article.remove();
    });

    let article = els.messages.querySelector('[data-idx="' + idx + '"]');
    if (!article) return null;

    article.classList.add('streaming');
    const content = article.querySelector('.content');
    if (content) content.innerHTML = '';
    return { article, content };
  };

  let streamThrottle = null;
  let _latestCE = null;
  let _latestText = '';
  let _streamingCodeScrollTarget = 0;
  const updateStreamingContent = (contentEl, text) => {
    _latestCE = contentEl;
    _latestText = text;
    if (streamThrottle) return;
    streamThrottle = requestAnimationFrame(() => {
      if (_latestCE) {
        _latestCE.innerHTML = window.Markdown.render(_latestText);
        polishContent(_latestCE, { streaming: true });
        scrollStreamingCodeToEnd(_latestCE, _latestText);
        scrollToBottomIfNear();
      }
      streamThrottle = null;
    });
  };

  const finalizeStreaming = (article, text, message) => {
    resetStreamingCodeScroll();
    article.classList.remove('streaming');
    const content = article.querySelector('.content');
    if (content) {
      content.innerHTML = window.Markdown.render(text);
      polishContent(content, { renderMermaid: true });
    }
    if (message) setAssistantToolbar(article, message);
    scrollToBottomIfNear();
  };

  const rerenderMermaid = () => {
    window.Markdown.updateMermaidTheme();
    window.Markdown.resetMermaidBlocks(els.messages);
    window.Markdown.renderMermaid(els.messages, { skipIfStreaming: false });
    if (els.markdownPreviewPanel?.classList.contains('is-open') && els.markdownPreviewContent) {
      window.Markdown.resetMermaidBlocks(els.markdownPreviewContent);
      window.Markdown.renderMermaid(els.markdownPreviewContent, { skipIfStreaming: false });
    }
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
    root.querySelectorAll('pre code').forEach((block) => {
      try { window.hljs.highlightElement(block); } catch {}
    });
  };

  const polishContent = (root, { renderMermaid = true, streaming = false } = {}) => {
    window.Markdown.enhanceCodeBlocks(root);
    window.Markdown.enhanceTables(root);
    if (!streaming) rehighlight(root);
    if (!streaming) window.Markdown.typesetMath(root);
    if (renderMermaid) window.Markdown.renderMermaid(root);
  };

  const hasOpenCodeFence = (text) => {
    const count = (text.match(/```/g) || []).length;
    return count % 2 === 1;
  };

  const CODE_SCROLL_LERP = 0.18;
  const CODE_SCROLL_SNAP_GAP = 96;
  const codeScrollStates = new WeakMap();
  const codeScrollElements = new Set();

  const stopCodeScrollAnimations = () => {
    codeScrollElements.forEach((el) => {
      const state = codeScrollStates.get(el);
      if (state?.rafId) cancelAnimationFrame(state.rafId);
      if (state) state.rafId = null;
    });
    codeScrollElements.clear();
  };

  const resetStreamingCodeScroll = () => {
    _streamingCodeScrollTarget = 0;
    stopCodeScrollAnimations();
  };

  const animateCodeScroll = (el, targetTop) => {
    let state = codeScrollStates.get(el);
    if (!state) {
      state = { rafId: null, target: 0 };
      codeScrollStates.set(el, state);
    }
    state.target = Math.max(0, targetTop);
    codeScrollElements.add(el);

    if (state.rafId) return;

    const tick = () => {
      const st = codeScrollStates.get(el);
      if (!st) return;

      const dest = st.target;
      const cur = el.scrollTop;
      const diff = dest - cur;

      if (Math.abs(diff) < 0.5) {
        el.scrollTop = dest;
        st.rafId = null;
        codeScrollElements.delete(el);
        return;
      }

      el.scrollTop = cur + diff * CODE_SCROLL_LERP;
      st.rafId = requestAnimationFrame(tick);
    };

    state.rafId = requestAnimationFrame(tick);
  };

  const scrollElementToEnd = (el, { streaming = false } = {}) => {
    if (!el || el.scrollHeight <= el.clientHeight) {
      if (streaming) _streamingCodeScrollTarget = 0;
      return;
    }

    const target = el.scrollHeight - el.clientHeight;

    if (streaming) {
      stopCodeScrollAnimations();

      if (_streamingCodeScrollTarget > 0 && target >= _streamingCodeScrollTarget - 4) {
        el.scrollTop = Math.min(_streamingCodeScrollTarget, target);
        if (target - el.scrollTop > 0.5) animateCodeScroll(el, target);
        _streamingCodeScrollTarget = target;
        return;
      }

      if (target > CODE_SCROLL_SNAP_GAP) {
        el.scrollTop = target;
        _streamingCodeScrollTarget = target;
        return;
      }

      animateCodeScroll(el, target);
      _streamingCodeScrollTarget = target;
      return;
    }

    el.scrollTop = target;
  };

  const scrollStreamingCodeToEnd = (root, text) => {
    if (!root || !hasOpenCodeFence(text)) return;

    const pres = root.querySelectorAll('pre');
    const lastPre = pres[pres.length - 1];
    if (!lastPre) return;

    if (lastPre.classList.contains('mermaid-pending')) {
      scrollElementToEnd(lastPre, { streaming: true });
      scrollElementToEnd(lastPre.closest('.mermaid-view'), { streaming: true });
      return;
    }

    if (lastPre.closest('.mermaid-block')) {
      const source = lastPre.closest('.mermaid-source');
      scrollElementToEnd(source || lastPre, { streaming: true });
      return;
    }

    scrollElementToEnd(lastPre, { streaming: true });
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
    els.attachImageBtn.disabled = on;
    els.attachFileBtn.disabled = on;
    els.messages.classList.toggle('is-streaming', on);
  };

  const renderComposerAttachments = (images, files) => {
    const imgList = images || [];
    const fileList = files || [];
    if (!imgList.length && !fileList.length) {
      els.composerAttachments.innerHTML = '';
      els.composerAttachments.classList.add('hidden');
      return;
    }
    els.composerAttachments.classList.remove('hidden');
    const imageHtml = imgList.map((img, i) =>
      '<div class="composer-attachment composer-attachment-image" data-type="image" data-idx="' + i + '">'
      + '<img src="' + img.dataUrl + '" alt="' + escapeHTML(img.name || 'Ảnh ' + (i + 1)) + '" />'
      + '<button type="button" class="composer-attachment-remove" data-remove-type="image" data-remove-idx="' + i + '" title="Xoá ảnh" aria-label="Xoá ảnh">'
      + '<i class="fa-solid fa-xmark"></i></button>'
      + '</div>'
    ).join('');
    const fileHtml = fileList.map((f, i) =>
      '<div class="composer-attachment composer-attachment-file" data-type="file" data-idx="' + i + '">'
      + '<i class="fa-solid ' + window.Files.getIconClass(f.name) + '"></i>'
      + '<span class="composer-file-name" title="' + escapeHTML(f.name) + '">' + escapeHTML(f.name) + '</span>'
      + '<span class="composer-file-size">' + window.Files.formatSize(f.size || 0) + '</span>'
      + '<button type="button" class="composer-attachment-remove" data-remove-type="file" data-remove-idx="' + i + '" title="Xoá tệp" aria-label="Xoá tệp">'
      + '<i class="fa-solid fa-xmark"></i></button>'
      + '</div>'
    ).join('');
    els.composerAttachments.innerHTML = imageHtml + fileHtml;
  };

  const setDragOverlay = (visible) => {
    els.appDropOverlay.classList.toggle('hidden', !visible);
    els.composerDropZone.classList.toggle('drag-over', visible);
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

  let renameResolve = null;

  const openRenameModal = (title) => {
    return new Promise((resolve) => {
      renameResolve = resolve;
      els.renameInput.value = title || '';
      els.renameModal.classList.remove('hidden');
      setTimeout(() => {
        els.renameInput.focus();
        els.renameInput.select();
      }, 50);
    });
  };

  const closeRenameModal = (result = null) => {
    els.renameModal.classList.add('hidden');
    if (renameResolve) {
      renameResolve(result);
      renameResolve = null;
    }
  };

  const isRenameModalOpen = () => !els.renameModal.classList.contains('hidden');

  const isMobileSidebar = () => window.matchMedia('(max-width: 768px)').matches;

  const toggleSidebar = (force) => {
    const app = els.app || document.getElementById('app');
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
    const btn = els.openSidebarBtn;
    if (btn) btn.title = next === 'open' ? 'Đóng sidebar' : 'Mở sidebar';
  };

  const closeMobileSidebar = () => {
    if (isMobileSidebar()) toggleSidebar(false);
  };

  const initSidebar = () => {
    if (isMobileSidebar()) toggleSidebar(false);
  };

  const openMarkdownPreview = (source) => {
    if (!source || !els.markdownPreviewPanel || !els.markdownPreviewContent) return;
    els.markdownPreviewContent.innerHTML = window.Markdown.render(source);
    polishContent(els.markdownPreviewContent, { renderMermaid: true });
    els.markdownPreviewContent.scrollTop = 0;
    els.markdownPreviewPanel.classList.add('is-open');
    els.markdownPreviewPanel.setAttribute('aria-hidden', 'false');
    els.app.setAttribute('data-md-preview', 'open');
    if (els.mdPreviewOverlay) els.mdPreviewOverlay.classList.remove('hidden');
  };

  const closeMarkdownPreview = () => {
    if (!els.markdownPreviewPanel) return;
    els.markdownPreviewPanel.classList.remove('is-open');
    els.markdownPreviewPanel.setAttribute('aria-hidden', 'true');
    els.app.removeAttribute('data-md-preview');
    if (els.mdPreviewOverlay) els.mdPreviewOverlay.classList.add('hidden');
    if (els.markdownPreviewContent) els.markdownPreviewContent.innerHTML = '';
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
    cacheEls, setTheme, initModelSelect,
    renderConversationList, renderMessages, renderEmpty,
    appendMessage, appendStreamingMessage, updateStreamingContent, finalizeStreaming,
    enterEditMode, exitEditMode, downloadConversation,
    scrollToBottom, scrollToBottomIfNear, showError, removeError, setStreaming,
    renderComposerAttachments, setDragOverlay,
    openSettings, closeSettings, openRenameModal, closeRenameModal, isRenameModalOpen, toggleSidebar, closeMobileSidebar, initSidebar, showToast, rerenderMermaid,
    setAssistantToolbar, updateAssistantMessage, beginRetryStreaming,
    openMarkdownPreview, closeMarkdownPreview, els
  };
})();
