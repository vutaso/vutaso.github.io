window.Events = (() => {
  const { copyToClipboard, autoResize, escapeHTML, debounce } = window.Utils;
  const { send: apiSend, abort: apiAbort } = window.API;
  const state = window.Storage;
  const convoMod = window.Conversations;
  const ui = window.UI;

  let streamingContext = null;
  let pdfExporting = false;

  const buildPdfConvo = () => {
    const convo = convoMod.getCurrent();
    if (!convo) return null;

    const messages = convo.messages.filter((m) => {
      if (m.role !== 'user' && m.role !== 'assistant') return false;
      if (m.role === 'assistant' && !m.content) return false;
      return true;
    });

    if (streamingContext && streamingContext.convo.id === convo.id && streamingContext.buffer) {
      messages.push({
        role: 'assistant',
        content: streamingContext.buffer,
        ts: Date.now()
      });
    }

    return { ...convo, messages };
  };

  const updateSendEnabled = () => {
    const s = state.get();
    const hasKey = !!s.apiKey;
    const hasText = ui.els.composerInput.value.trim().length > 0;
    ui.els.sendBtn.disabled = !hasKey || !hasText;
    if (!window.API.isStreaming()) {
      ui.els.composerInput.disabled = false;
    }
  };

  const streamResponse = async (convo) => {
    const s = state.get();
    const { article, content } = ui.appendStreamingMessage();
    let buffer = '';
    ui.setStreaming(true);
    ui.removeError();

    streamingContext = { convo, contentEl: content, article, buffer: '' };

    await apiSend({
      apiKey: s.apiKey,
      model: window.APP_CONFIG.MODEL,
      systemPrompt: s.systemPrompt,
      convo,
      onToken: (delta) => {
        buffer += delta;
        if (streamingContext) streamingContext.buffer = buffer;
        ui.updateStreamingContent(content, buffer);
      },
      onDone: (info) => {
        if (info && info.aborted) {
          if (buffer) convoMod.addMessage(convo, { role: 'assistant', content: buffer, ts: Date.now() });
          ui.showToast('Đã dừng');
        } else if (buffer) {
          convoMod.addMessage(convo, { role: 'assistant', content: buffer, ts: Date.now() });
        }
        ui.finalizeStreaming(article, buffer);
        ui.setStreaming(false);
        streamingContext = null;
        updateSendEnabled();
      },
      onError: (err) => {
        const finalText = buffer || '_Đã xảy ra lỗi, tin nhắn trống._';
        convoMod.addMessage(convo, { role: 'assistant', content: finalText, ts: Date.now() });
        ui.finalizeStreaming(article, finalText);
        ui.setStreaming(false);
        streamingContext = null;
        ui.showError(err);
        updateSendEnabled();
      }
    });
  };

  const sendCurrent = async () => {
    const s = state.get();
    if (!s.apiKey) {
      ui.openSettings(s);
      ui.showToast('Nhập API key trong Cài đặt trước');
      return;
    }
    const text = ui.els.composerInput.value.trim();
    if (!text) return;
    if (window.API.isStreaming()) return;

    const convo = convoMod.ensure();

    const userMsg = { role: 'user', content: text, ts: Date.now() };
    convoMod.addMessage(convo, userMsg);
    const userMsgIdx = convo.messages.length - 1;

    ui.els.composerInput.value = '';
    autoResize(ui.els.composerInput);
    ui.removeError();
    ui.appendMessage(userMsg, userMsgIdx);
    ui.renderConversationList(convoMod.getAll(), convo.id);
    updateSendEnabled();

    await streamResponse(convo);
  };

  const stopStreaming = () => {
    if (!window.API.isStreaming()) return;
    apiAbort();
  };

  const saveEdit = (msg) => {
    const idx = parseInt(msg.dataset.idx, 10);
    if (isNaN(idx)) return;
    const textarea = msg.querySelector('.edit-textarea');
    if (!textarea) return;
    const newContent = textarea.value.trim();
    if (!newContent) return;
    const convo = convoMod.getCurrent();
    if (!convo) return;
    convoMod.editMessage(convo, idx, newContent);
    ui.renderMessages(convo);
    ui.showToast('Đã lưu chỉnh sửa');
    streamResponse(convo);
  };

  const bind = () => {
    ui.els.composer.addEventListener('submit', (e) => {
      e.preventDefault();
      sendCurrent();
    });

    ui.els.composerInput.addEventListener('input', () => {
      autoResize(ui.els.composerInput);
      updateSendEnabled();
    });

    ui.els.composerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        sendCurrent();
      }
    });

    ui.els.stopBtn.addEventListener('click', stopStreaming);

    ui.els.newChatBtn.addEventListener('click', () => {
      const c = convoMod.create();
      ui.renderConversationList(convoMod.getAll(), c.id);
      ui.renderMessages(c);
      ui.els.composerInput.focus();
    });

    ui.els.conversationList.addEventListener('click', (e) => {
      const item = e.target.closest('.conversation-item');
      if (!item) return;
      const id = item.dataset.id;
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'delete') {
        if (!confirm('Bạn có chắc muốn xoá cuộc trò chuyện này?')) return;
        convoMod.remove(id);
        const list = convoMod.getAll();
        const cur = convoMod.getCurrent();
        ui.renderConversationList(list, cur ? cur.id : null);
        ui.renderMessages(cur);
      } else if (action === 'rename') {
        const c = convoMod.getById(id);
        if (!c) return;
        const next = prompt('Đổi tên cuộc trò chuyện:', c.title);
        if (next !== null) {
          convoMod.rename(id, next.trim() || c.title);
          ui.renderConversationList(convoMod.getAll(), convoMod.getCurrent()?.id || null);
        }
      } else {
        const c = convoMod.select(id);
        if (c) {
          ui.renderConversationList(convoMod.getAll(), id);
          ui.renderMessages(c);
          ui.toggleSidebar(false);
          ui.els.composerInput.focus();
        }
      }
    });

    ui.els.downloadConvoBtn.addEventListener('click', () => {
      const convo = convoMod.getCurrent();
      if (!convo || !convo.messages.length) {
        ui.showToast('Chưa có hội thoại để tải');
        return;
      }
      ui.downloadConversation(convo);
      ui.showToast('Đã tải về');
    });

    ui.els.copyMarkdownBtn.addEventListener('click', async () => {
      const convo = convoMod.getCurrent();
      if (!convo || !convo.messages.length) {
        ui.showToast('Chưa có hội thoại để sao chép');
        return;
      }
      const md = window.Utils.formatConversation(convo);
      if (await copyToClipboard(md)) {
        ui.showToast('Đã sao chép toàn bộ hội thoại');
      }
    });

    ui.els.pdfExportBtn.addEventListener('click', async () => {
      if (pdfExporting) return;

      const pdfConvo = buildPdfConvo();
      if (!pdfConvo || !pdfConvo.messages.length) {
        ui.showToast('Chưa có hội thoại để xuất');
        return;
      }

      pdfExporting = true;
      ui.els.pdfExportBtn.disabled = true;
      const streaming = window.API.isStreaming();
      ui.showToast(streaming ? 'Đang xuất PDF (gồm tin đang trả lời)...' : 'Đang xuất PDF...');

      try {
        await window.Utils.exportToPDF(pdfConvo);
        ui.showToast('Đã xuất PDF thành công');
      } catch (err) {
        ui.showToast('Xuất PDF thất bại: ' + (err.message || err));
      } finally {
        pdfExporting = false;
        ui.els.pdfExportBtn.disabled = false;
      }
    });

    ui.els.openSettingsBtn.addEventListener('click', () => ui.openSettings(state.get()));
    ui.els.headerSettingsBtn.addEventListener('click', () => ui.openSettings(state.get()));
    ui.els.themeToggleBtn.addEventListener('click', () => {
      const next = state.get().theme === 'dark' ? 'light' : 'dark';
      state.set({ theme: next });
      ui.setTheme(next);
    });

    ui.els.toggleApiKeyBtn.addEventListener('click', () => {
      const isPwd = ui.els.apiKeyInput.type === 'password';
      ui.els.apiKeyInput.type = isPwd ? 'text' : 'password';
      ui.els.apiKeyIcon.innerHTML = isPwd ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    });

    ui.els.clearAllBtn.addEventListener('click', () => {
      if (!confirm('Xoá tất cả hội thoại? Hành động này không thể hoàn tác.')) return;
      convoMod.clearAll();
      ui.renderConversationList([], null);
      ui.renderMessages(null);
      ui.showToast('Đã xoá tất cả hội thoại');
    });

    ui.els.settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const apiKey = ui.els.apiKeyInput.value.trim();
      const systemPrompt = ui.els.systemPromptInput.value.trim() || window.APP_CONFIG.DEFAULT_SYSTEM_PROMPT;
      const theme = ui.els.settingsForm.querySelector('input[name="theme"]:checked')?.value || 'dark';
      state.set({ apiKey, systemPrompt, theme });
      ui.setTheme(theme);
      ui.closeSettings();
      ui.showToast('Đã lưu cài đặt');
      updateSendEnabled();
    });

    document.querySelectorAll('[data-modal-close]').forEach(el => {
      el.addEventListener('click', () => ui.closeSettings());
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const editing = document.querySelector('.message.editing');
        if (editing) {
          e.preventDefault();
          ui.exitEditMode(editing);
          return;
        }
        if (!ui.els.settingsModal.classList.contains('hidden')) {
          ui.closeSettings();
          return;
        }
        if (document.getElementById('app').getAttribute('data-sidebar') === 'open') {
          ui.toggleSidebar(false);
          return;
        }
      }
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        const editingMsg = document.querySelector('.message.editing .edit-textarea');
        if (editingMsg && document.activeElement === editingMsg) {
          e.preventDefault();
          saveEdit(editingMsg.closest('.message'));
          return;
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        ui.els.composerInput.focus();
      }
    });

    ui.els.openSidebarBtn.addEventListener('click', () => ui.toggleSidebar());
    ui.els.sidebarOverlay.addEventListener('click', () => ui.toggleSidebar(false));

    document.addEventListener('click', async (e) => {
      const copyBtn = e.target.closest('[data-copy-code]');
      if (copyBtn) {
        const pre = copyBtn.closest('pre');
        const code = pre?.querySelector('code')?.innerText || '';
        if (await copyToClipboard(code)) ui.showToast('Đã sao chép code');
        return;
      }
      const msgCopy = e.target.closest('[data-action="copy"]');
      if (msgCopy) {
        const msg = msgCopy.closest('.message');
        const txt = msg?.querySelector('.content')?.innerText || '';
        if (await copyToClipboard(txt)) ui.showToast('Đã sao chép tin nhắn');
        return;
      }
      const editBtn = e.target.closest('[data-action="edit"]');
      if (editBtn) {
        const msg = editBtn.closest('.message');
        if (msg && !window.API.isStreaming()) {
          ui.enterEditMode(msg);
        }
        return;
      }
      const saveBtn = e.target.closest('[data-action="save-edit"]');
      if (saveBtn) {
        const msg = saveBtn.closest('.message');
        if (msg) saveEdit(msg);
        return;
      }
      const cancelBtn = e.target.closest('[data-action="cancel-edit"]');
      if (cancelBtn) {
        const msg = cancelBtn.closest('.message');
        if (msg) ui.exitEditMode(msg);
        return;
      }
      const delBtn = e.target.closest('[data-action="delete-msg"]');
      if (delBtn) {
        const msg = delBtn.closest('.message');
        if (!msg || window.API.isStreaming()) return;
        const idx = parseInt(msg.dataset.idx, 10);
        if (isNaN(idx)) return;
        if (!confirm('Xoá tin nhắn này và tất cả tin nhắn phía sau?')) return;
        const convo = convoMod.getCurrent();
        if (!convo) return;
        convoMod.deleteMessageFrom(convo, idx);
        ui.renderMessages(convo);
        return;
      }
    });

    updateSendEnabled();
  };

  return { bind };
})();
