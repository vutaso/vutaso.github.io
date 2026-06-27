window.Events = (() => {
  const { copyToClipboard, autoResize, escapeHTML, debounce, readFileAsDataUrl } = window.Utils;
  const { send: apiSend, abort: apiAbort } = window.API;
  const { MAX_IMAGES_PER_MESSAGE, MAX_IMAGE_SIZE_MB, ACCEPTED_IMAGE_TYPES, MAX_FILES_PER_MESSAGE, MAX_FILE_SIZE_MB } = window.APP_CONFIG;
  const fileMod = window.Files;
  const state = window.Storage;
  const convoMod = window.Conversations;
  const ui = window.UI;

  let streamingContext = null;
  let pdfExporting = false;
  let docxExporting = false;
  let pendingImages = [];
  let pendingFiles = [];
  let pendingReplyText = '';

  const getContentFromNode = (node) => {
    if (!node) return null;
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    return el?.closest?.('.message .content') || null;
  };

  const getMessageSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return null;

    const range = sel.getRangeAt(0);
    const startContent = getContentFromNode(range.startContainer);
    const endContent = getContentFromNode(range.endContainer);
    if (!startContent || startContent !== endContent) return null;
    if (!ui.els.messages.contains(startContent)) return null;
    if (startContent.closest('.message.editing')) return null;

    const text = sel.toString().trim();
    if (!text) return null;
    return { text, range };
  };

  const hideSelectionReplyTooltip = () => {
    pendingReplyText = '';
    ui.els.selectionReplyTooltip.classList.add('hidden');
  };

  const showSelectionReplyTooltip = ({ text, range }) => {
    pendingReplyText = text;
    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) {
      hideSelectionReplyTooltip();
      return;
    }

    const tooltip = ui.els.selectionReplyTooltip;
    const pad = 12;
    const centerX = rect.left + rect.width / 2;
    const left = Math.max(pad, Math.min(centerX, window.innerWidth - pad));
    const top = Math.max(pad, rect.top);

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    tooltip.classList.remove('hidden');
  };

  const formatQuoteForComposer = (text) =>
    text.split('\n').map((line) => '> ' + line).join('\n');

  const applySelectionReply = () => {
    if (!pendingReplyText) return;
    const quote = formatQuoteForComposer(pendingReplyText);
    const prefix = quote + '\n\n';
    const input = ui.els.composerInput;
    const existing = input.value.trim();

    input.value = existing ? prefix + existing : prefix;
    autoResize(input);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
    updateSendEnabled();
    hideSelectionReplyTooltip();
    window.getSelection()?.removeAllRanges();
  };

  const bindSelectionReply = () => {
    ui.els.messages.addEventListener('mousedown', hideSelectionReplyTooltip);

    ui.els.messages.addEventListener('mouseup', () => {
      requestAnimationFrame(() => {
        const info = getMessageSelection();
        if (info) showSelectionReplyTooltip(info);
        else hideSelectionReplyTooltip();
      });
    });

    ui.els.messages.addEventListener('touchend', () => {
      requestAnimationFrame(() => {
        const info = getMessageSelection();
        if (info) showSelectionReplyTooltip(info);
      });
    });

    ui.els.messages.addEventListener('scroll', hideSelectionReplyTooltip, { passive: true });

    ui.els.selectionReplyTooltip.addEventListener('mousedown', (e) => {
      if (!e.target.closest('[data-action="selection-reply"]')) return;
      e.preventDefault();
      applySelectionReply();
    });

    document.addEventListener('mousedown', (e) => {
      if (e.target.closest('#selectionReplyTooltip')) return;
      if (e.target.closest('#messages')) return;
      hideSelectionReplyTooltip();
    });

    document.addEventListener('selectionchange', () => {
      if (ui.els.selectionReplyTooltip.classList.contains('hidden')) return;
      const info = getMessageSelection();
      if (!info || info.text !== pendingReplyText) hideSelectionReplyTooltip();
    });
  };

  const buildExportConvo = () => {
    const convo = convoMod.getCurrent();
    if (!convo) return null;

    const messages = convo.messages.filter((m) => {
      if (m.role !== 'user' && m.role !== 'assistant') return false;
      if (m.role === 'assistant' && !convoMod.getAssistantContent(m)) return false;
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
    const hasAttachments = pendingImages.length > 0 || pendingFiles.length > 0;
    ui.els.sendBtn.disabled = !hasKey || (!hasText && !hasAttachments);
    if (!window.API.isStreaming()) {
      ui.els.composerInput.disabled = false;
      ui.els.attachImageBtn.disabled = false;
      ui.els.attachFileBtn.disabled = false;
    }
  };

  const clearPendingAttachments = () => {
    pendingImages = [];
    pendingFiles = [];
    ui.renderComposerAttachments(pendingImages, pendingFiles);
    updateSendEnabled();
  };

  const addPendingImages = async (files) => {
    if (!files || !files.length) return;
    const maxBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;
    const remaining = MAX_IMAGES_PER_MESSAGE - pendingImages.length;
    if (remaining <= 0) {
      ui.showToast('Tối đa ' + MAX_IMAGES_PER_MESSAGE + ' ảnh mỗi tin nhắn');
      return;
    }

    const imageFiles = Array.from(files).filter(f => ACCEPTED_IMAGE_TYPES.includes(f.type));
    if (!imageFiles.length) {
      ui.showToast('Chỉ hỗ trợ JPEG, PNG, GIF, WebP');
      return;
    }

    let added = 0;
    for (const file of imageFiles.slice(0, remaining)) {
      if (file.size > maxBytes) {
        ui.showToast('Ảnh "' + file.name + '" vượt quá ' + MAX_IMAGE_SIZE_MB + 'MB');
        continue;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        pendingImages.push({ dataUrl, name: file.name, mime: file.type });
        added++;
      } catch {
        ui.showToast('Không đọc được ảnh "' + file.name + '"');
      }
    }

    if (imageFiles.length > remaining) {
      ui.showToast('Chỉ thêm được ' + remaining + ' ảnh nữa');
    }

    if (added > 0) {
      ui.renderComposerAttachments(pendingImages, pendingFiles);
      updateSendEnabled();
    }
  };

  const addPendingDocuments = async (files) => {
    if (!files || !files.length) return;
    const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
    const remaining = MAX_FILES_PER_MESSAGE - pendingFiles.length;
    if (remaining <= 0) {
      ui.showToast('Tối đa ' + MAX_FILES_PER_MESSAGE + ' tệp mỗi tin nhắn');
      return;
    }

    const docFiles = Array.from(files).filter((f) => fileMod.getKind(f) === 'document');
    if (!docFiles.length) {
      ui.showToast('Định dạng tài liệu không được hỗ trợ');
      return;
    }

    let added = 0;
    for (const file of docFiles.slice(0, remaining)) {
      if (file.size > maxBytes) {
        ui.showToast('Tệp "' + file.name + '" vượt quá ' + MAX_FILE_SIZE_MB + 'MB');
        continue;
      }
      try {
        ui.showToast('Đang đọc "' + file.name + '"...');
        const content = await fileMod.extractContent(file);
        pendingFiles.push({
          name: file.name,
          mime: file.type || fileMod.getExtension(file.name),
          size: file.size,
          content
        });
        added++;
      } catch (err) {
        ui.showToast('Không đọc được "' + file.name + '": ' + (err.message || err));
      }
    }

    if (docFiles.length > remaining) {
      ui.showToast('Chỉ thêm được ' + remaining + ' tệp nữa');
    }

    if (added > 0) {
      ui.renderComposerAttachments(pendingImages, pendingFiles);
      updateSendEnabled();
      ui.showToast('Đã thêm ' + added + ' tệp');
    }
  };

  const addDroppedFiles = async (files) => {
    if (!files || !files.length) return;
    const imageFiles = [];
    const docFiles = [];
    for (const file of files) {
      const kind = fileMod.getKind(file);
      if (kind === 'image') imageFiles.push(file);
      else if (kind === 'document') docFiles.push(file);
    }
    if (!imageFiles.length && !docFiles.length) {
      ui.showToast('Chỉ hỗ trợ ảnh và tài liệu (txt, pdf, docx, csv, json...)');
      return;
    }
    if (imageFiles.length) await addPendingImages(imageFiles);
    if (docFiles.length) await addPendingDocuments(docFiles);
  };

  const removePendingImage = (idx) => {
    if (idx < 0 || idx >= pendingImages.length) return;
    pendingImages.splice(idx, 1);
    ui.renderComposerAttachments(pendingImages, pendingFiles);
    updateSendEnabled();
  };

  const removePendingFile = (idx) => {
    if (idx < 0 || idx >= pendingFiles.length) return;
    pendingFiles.splice(idx, 1);
    ui.renderComposerAttachments(pendingImages, pendingFiles);
    updateSendEnabled();
  };

  const streamResponse = async (convo, { retryIdx } = {}) => {
    const s = state.get();
    let article;
    let content;
    let messageIndex;

    if (retryIdx !== undefined) {
      messageIndex = retryIdx;
      const streaming = ui.beginRetryStreaming(retryIdx);
      if (!streaming) {
        ui.renderMessages(convo);
        const retry = ui.beginRetryStreaming(retryIdx);
        if (!retry) return;
        article = retry.article;
        content = retry.content;
      } else {
        article = streaming.article;
        content = streaming.content;
      }
    } else {
      messageIndex = convo.messages.length;
      const streaming = ui.appendStreamingMessage(messageIndex);
      article = streaming.article;
      content = streaming.content;
    }

    let buffer = '';
    ui.setStreaming(true);
    ui.removeError();

    streamingContext = { convo, contentEl: content, article, buffer: '', retryIdx };

    await apiSend({
      apiKey: s.apiKey,
      model: s.currentModel || window.APP_CONFIG.DEFAULT_MODEL,
      systemPrompt: s.systemPrompt,
      convo,
      onToken: (delta) => {
        buffer += delta;
        if (streamingContext) streamingContext.buffer = buffer;
        ui.updateStreamingContent(content, buffer);
      },
      onDone: (info) => {
        const msg = convo.messages[messageIndex];
        if (info && info.aborted) {
          if (buffer) {
            if (retryIdx !== undefined) {
              convoMod.finalizeAssistantMessage(convo, messageIndex, buffer);
            } else {
              convoMod.addMessage(convo, {
                role: 'assistant',
                content: buffer,
                variants: [buffer],
                variantIndex: 0,
                ts: Date.now()
              });
            }
            ui.showToast('Đã dừng');
          } else if (retryIdx !== undefined) {
            convoMod.cancelRetryVariant(convo, messageIndex);
            if (msg) ui.updateAssistantMessage(messageIndex, msg);
          }
        } else if (buffer) {
          if (retryIdx !== undefined) {
            convoMod.finalizeAssistantMessage(convo, messageIndex, buffer);
          } else {
            convoMod.addMessage(convo, {
              role: 'assistant',
              content: buffer,
              variants: [buffer],
              variantIndex: 0,
              ts: Date.now()
            });
          }
        } else if (retryIdx !== undefined) {
          convoMod.cancelRetryVariant(convo, messageIndex);
        }

        const finalMsg = convo.messages[messageIndex];
        if (!article.dataset.idx && messageIndex !== undefined) {
          article.dataset.idx = String(messageIndex);
        }
        ui.finalizeStreaming(article, buffer || convoMod.getAssistantContent(finalMsg) || '', finalMsg);
        ui.setStreaming(false);
        streamingContext = null;
        updateSendEnabled();
      },
      onError: (err) => {
        const finalText = buffer || '_Đã xảy ra lỗi, tin nhắn trống._';
        if (retryIdx !== undefined) {
          convoMod.finalizeAssistantMessage(convo, messageIndex, finalText);
        } else {
          convoMod.addMessage(convo, {
            role: 'assistant',
            content: finalText,
            variants: [finalText],
            variantIndex: 0,
            ts: Date.now()
          });
        }
        const finalMsg = convo.messages[messageIndex];
        if (!article.dataset.idx) article.dataset.idx = String(messageIndex);
        ui.finalizeStreaming(article, finalText, finalMsg);
        ui.setStreaming(false);
        streamingContext = null;
        ui.showError(err);
        updateSendEnabled();
      }
    });
  };

  const retryAssistantMessage = async (idx) => {
    const s = state.get();
    if (!s.apiKey) {
      ui.openSettings(s);
      ui.showToast('Nhập API key trong Cài đặt trước');
      return;
    }
    if (window.API.isStreaming()) return;

    const convo = convoMod.getCurrent();
    if (!convo) return;
    const msg = convo.messages[idx];
    if (!msg || msg.role !== 'assistant') return;

    convoMod.prepareRetry(convo, idx);
    const updated = convo.messages[idx];
    ui.updateAssistantMessage(idx, updated);
    await streamResponse(convo, { retryIdx: idx });
  };

  const sendCurrent = async () => {
    const s = state.get();
    if (!s.apiKey) {
      ui.openSettings(s);
      ui.showToast('Nhập API key trong Cài đặt trước');
      return;
    }
    const text = ui.els.composerInput.value.trim();
    if (!text && !pendingImages.length && !pendingFiles.length) return;
    if (window.API.isStreaming()) return;

    const convo = convoMod.ensure();

    const userMsg = {
      role: 'user',
      content: text,
      ts: Date.now()
    };
    if (pendingImages.length) {
      userMsg.images = pendingImages.map(img => ({
        dataUrl: img.dataUrl,
        name: img.name,
        mime: img.mime
      }));
    }
    if (pendingFiles.length) {
      userMsg.files = pendingFiles.map(f => ({
        name: f.name,
        mime: f.mime,
        size: f.size,
        content: f.content
      }));
    }
    convoMod.addMessage(convo, userMsg);
    const userMsgIdx = convo.messages.length - 1;

    ui.els.composerInput.value = '';
    clearPendingAttachments();
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

    ui.els.composerInput.addEventListener('paste', (e) => {
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      const imageFiles = [];
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (!imageFiles.length) return;
      e.preventDefault();
      addPendingImages(imageFiles);
    });

    ui.els.attachImageBtn.addEventListener('click', () => {
      ui.els.imageFileInput.click();
    });

    ui.els.attachFileBtn.addEventListener('click', () => {
      ui.els.documentFileInput.click();
    });

    ui.els.imageFileInput.addEventListener('change', () => {
      addPendingImages(ui.els.imageFileInput.files);
      ui.els.imageFileInput.value = '';
    });

    ui.els.documentFileInput.addEventListener('change', () => {
      addPendingDocuments(ui.els.documentFileInput.files);
      ui.els.documentFileInput.value = '';
    });

    ui.els.composerAttachments.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove-idx]');
      if (!btn) return;
      const idx = parseInt(btn.dataset.removeIdx, 10);
      if (btn.dataset.removeType === 'file') removePendingFile(idx);
      else removePendingImage(idx);
    });

    const hasFileDrag = (e) => e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files');
    const canAcceptImageDrop = () => ui.els.settingsModal.classList.contains('hidden');

    const appEl = ui.els.app;

    document.addEventListener('dragover', (e) => {
      if (!hasFileDrag(e) || !canAcceptImageDrop()) return;
      if (!appEl.contains(e.target)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    appEl.addEventListener('dragenter', (e) => {
      if (!hasFileDrag(e) || !canAcceptImageDrop()) return;
      e.preventDefault();
      const related = e.relatedTarget;
      if (related && appEl.contains(related)) return;
      ui.setDragOverlay(true);
    });

    appEl.addEventListener('dragleave', (e) => {
      if (!hasFileDrag(e)) return;
      const related = e.relatedTarget;
      if (related && appEl.contains(related)) return;
      ui.setDragOverlay(false);
    });

    appEl.addEventListener('drop', (e) => {
      if (!hasFileDrag(e) || !canAcceptImageDrop()) return;
      e.preventDefault();
      ui.setDragOverlay(false);
      if (e.dataTransfer.files.length) {
        addDroppedFiles(e.dataTransfer.files);
        ui.els.composerInput.focus();
      }
    });

    ui.els.stopBtn.addEventListener('click', stopStreaming);

    ui.els.newChatBtn.addEventListener('click', () => {
      const c = convoMod.create();
      clearPendingAttachments();
      ui.renderConversationList(convoMod.getAll(), c.id);
      ui.renderMessages(c);
      ui.els.composerInput.focus();
    });

    ui.els.conversationList.addEventListener('click', async (e) => {
      const item = e.target.closest('.conversation-item');
      if (!item) return;
      const id = item.dataset.id;
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'delete') {
        e.stopPropagation();
        if (!confirm('Bạn có chắc muốn xoá cuộc trò chuyện này?')) return;
        convoMod.remove(id);
        const list = convoMod.getAll();
        const cur = convoMod.getCurrent();
        ui.renderConversationList(list, cur ? cur.id : null);
        ui.renderMessages(cur);
        ui.closeMobileSidebar();
      } else if (action === 'rename') {
        e.stopPropagation();
        const c = convoMod.getById(id);
        if (!c) return;
        const next = await ui.openRenameModal(c.title);
        if (next !== null) {
          convoMod.rename(id, next.trim() || c.title);
          ui.renderConversationList(convoMod.getAll(), convoMod.getCurrent()?.id || null);
        }
      } else {
        const c = convoMod.select(id);
        if (!c) return;
        ui.renderConversationList(convoMod.getAll(), id);
        ui.renderMessages(c);
        ui.closeMobileSidebar();
        ui.els.composerInput.focus();
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

      const exportConvo = buildExportConvo();
      if (!exportConvo || !exportConvo.messages.length) {
        ui.showToast('Chưa có hội thoại để xuất');
        return;
      }

      pdfExporting = true;
      ui.els.pdfExportBtn.disabled = true;
      const streaming = window.API.isStreaming();
      ui.showToast(streaming ? 'Đang xuất PDF (gồm tin đang trả lời)...' : 'Đang xuất PDF...');

      try {
        await window.Utils.exportToPDF(exportConvo);
        ui.showToast('Đã xuất PDF thành công');
      } catch (err) {
        ui.showToast('Xuất PDF thất bại: ' + (err.message || err));
      } finally {
        pdfExporting = false;
        ui.els.pdfExportBtn.disabled = false;
      }
    });

    ui.els.docxExportBtn.addEventListener('click', async () => {
      if (docxExporting) return;

      const exportConvo = buildExportConvo();
      if (!exportConvo || !exportConvo.messages.length) {
        ui.showToast('Chưa có hội thoại để xuất');
        return;
      }

      docxExporting = true;
      ui.els.docxExportBtn.disabled = true;
      const streaming = window.API.isStreaming();
      ui.showToast(streaming ? 'Đang xuất Word (gồm tin đang trả lời)...' : 'Đang xuất Word...');

      try {
        await window.Utils.exportToDocx(exportConvo);
        ui.showToast('Đã xuất Word thành công');
      } catch (err) {
        ui.showToast('Xuất Word thất bại: ' + (err.message || err));
      } finally {
        docxExporting = false;
        ui.els.docxExportBtn.disabled = false;
      }
    });

    ui.els.openSettingsBtn.addEventListener('click', () => ui.openSettings(state.get()));
    ui.els.headerSettingsBtn.addEventListener('click', () => ui.openSettings(state.get()));
    ui.els.modelSelect.addEventListener('change', () => {
      const modelId = ui.els.modelSelect.value;
      state.set({ currentModel: modelId });
      const label = ui.els.modelSelect.selectedOptions[0]?.textContent || modelId;
      ui.showToast('Model: ' + label);
    });

    ui.els.themeToggleBtn.addEventListener('click', () => {
      const next = state.get().theme === 'dark' ? 'light' : 'dark';
      state.set({ theme: next });
      ui.setTheme(next);
      ui.rerenderMermaid();
    });

    ui.els.toggleApiKeyBtn.addEventListener('click', () => {
      const isPwd = ui.els.apiKeyInput.type === 'password';
      ui.els.apiKeyInput.type = isPwd ? 'text' : 'password';
      ui.els.apiKeyIcon.innerHTML = isPwd ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    });

    const handleClearAll = () => {
      if (!confirm('Xoá tất cả hội thoại? Hành động này không thể hoàn tác.')) return;
      convoMod.clearAll();
      ui.renderConversationList([], null);
      ui.renderMessages(null);
      ui.showToast('Đã xoá tất cả hội thoại');
    };

    ui.els.clearAllBtn.addEventListener('click', handleClearAll);
    ui.els.clearAllSidebarBtn.addEventListener('click', handleClearAll);

    ui.els.settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const apiKey = ui.els.apiKeyInput.value.trim();
      const systemPrompt = ui.els.systemPromptInput.value.trim() || window.APP_CONFIG.DEFAULT_SYSTEM_PROMPT;
      const theme = ui.els.settingsForm.querySelector('input[name="theme"]:checked')?.value || 'dark';
      const prevTheme = state.get().theme;
      state.set({ apiKey, systemPrompt, theme });
      ui.setTheme(theme);
      if (prevTheme !== theme) ui.rerenderMermaid();
      ui.closeSettings();
      ui.showToast('Đã lưu cài đặt');
      updateSendEnabled();
    });

    ui.els.renameForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = ui.els.renameInput.value.trim();
      if (!value) {
        ui.els.renameInput.focus();
        return;
      }
      ui.closeRenameModal(value);
    });

    document.querySelectorAll('[data-modal-close]').forEach(el => {
      el.addEventListener('click', () => {
        if (el.closest('#renameModal')) {
          ui.closeRenameModal(null);
          return;
        }
        ui.closeSettings();
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const editing = document.querySelector('.message.editing');
        if (editing) {
          e.preventDefault();
          ui.exitEditMode(editing);
          return;
        }
        hideSelectionReplyTooltip();
        if (ui.isRenameModalOpen()) {
          ui.closeRenameModal(null);
          return;
        }
        if (!ui.els.settingsModal.classList.contains('hidden')) {
          ui.closeSettings();
          return;
        }
        if (ui.els.app.getAttribute('data-md-preview') === 'open') {
          ui.closeMarkdownPreview();
          return;
        }
        if (ui.els.app.getAttribute('data-sidebar') === 'open') {
          ui.closeMobileSidebar();
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
    ui.els.closeMdPreviewBtn.addEventListener('click', () => ui.closeMarkdownPreview());
    ui.els.mdPreviewOverlay?.addEventListener('click', () => ui.closeMarkdownPreview());

    document.addEventListener('click', async (e) => {
      const previewMdBtn = e.target.closest('[data-preview-md]');
      if (previewMdBtn) {
        const pre = previewMdBtn.closest('pre');
        const code = pre?.querySelector('code')?.innerText || '';
        if (code) ui.openMarkdownPreview(code);
        return;
      }
      const toggleMermaid = e.target.closest('[data-toggle-mermaid]');
      if (toggleMermaid) {
        const block = toggleMermaid.closest('.mermaid-block');
        if (block) {
          block.classList.toggle('show-source');
          const showing = block.classList.contains('show-source');
          toggleMermaid.title = showing ? 'Xem sơ đồ' : 'Xem mã nguồn';
          toggleMermaid.innerHTML = showing
            ? '<i class="fa-solid fa-diagram-project"></i>'
            : '<i class="fa-solid fa-code"></i>';
        }
        return;
      }
      const copyBtn = e.target.closest('[data-copy-code]');
      if (copyBtn) {
        const mermaidBlock = copyBtn.closest('.mermaid-block');
        const code = mermaidBlock
          ? window.Markdown.getMermaidSource(mermaidBlock)
          : (copyBtn.closest('pre')?.querySelector('code')?.innerText || '');
        if (await copyToClipboard(code)) ui.showToast('Đã sao chép code');
        return;
      }
      const copyTableBtn = e.target.closest('[data-copy-table]');
      if (copyTableBtn) {
        const table = copyTableBtn.closest('.table-block')?.querySelector('table');
        if (table && await copyToClipboard(window.Markdown.tableToMarkdown(table))) {
          ui.showToast('Đã sao chép bảng (Markdown)');
        }
        return;
      }
      const msgCopy = e.target.closest('[data-action="copy"]');
      if (msgCopy) {
        const msg = msgCopy.closest('.message');
        const txt = msg?.querySelector('.content')?.innerText || '';
        if (await copyToClipboard(txt)) ui.showToast('Đã sao chép tin nhắn');
        return;
      }
      const retryBtn = e.target.closest('[data-action="retry"]');
      if (retryBtn) {
        if (window.API.isStreaming()) return;
        const msgEl = retryBtn.closest('.message');
        const idx = parseInt(msgEl?.dataset.idx, 10);
        if (!isNaN(idx)) retryAssistantMessage(idx);
        return;
      }
      const variantPrev = e.target.closest('[data-action="variant-prev"]');
      if (variantPrev && !variantPrev.disabled) {
        const msgEl = variantPrev.closest('.message');
        const idx = parseInt(msgEl?.dataset.idx, 10);
        if (isNaN(idx)) return;
        const convo = convoMod.getCurrent();
        if (!convo) return;
        const current = convo.messages[idx];
        if (!current) return;
        convoMod.setAssistantVariant(convo, idx, (current.variantIndex ?? 0) - 1);
        ui.updateAssistantMessage(idx, convo.messages[idx]);
        return;
      }
      const variantNext = e.target.closest('[data-action="variant-next"]');
      if (variantNext && !variantNext.disabled) {
        const msgEl = variantNext.closest('.message');
        const idx = parseInt(msgEl?.dataset.idx, 10);
        if (isNaN(idx)) return;
        const convo = convoMod.getCurrent();
        if (!convo) return;
        const current = convo.messages[idx];
        if (!current) return;
        convoMod.setAssistantVariant(convo, idx, (current.variantIndex ?? 0) + 1);
        ui.updateAssistantMessage(idx, convo.messages[idx]);
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

    bindSelectionReply();
    updateSendEnabled();
  };

  return { bind };
})();
