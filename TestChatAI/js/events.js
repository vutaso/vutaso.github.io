window.Events = (() => {
  const { copyToClipboard, copyImageToClipboard, downloadDataUrlImage, autoResize, escapeHTML, debounce, readFileAsDataUrl } = window.Utils;
  const { send: apiSend, abort: apiAbort } = window.API;
  const { ACCEPTED_IMAGE_TYPES } = window.APP_CONFIG;
  const fileMod = window.Files;
  const state = window.Storage;
  const convoMod = window.Conversations;
  const ui = window.UI;
  const t = (key, params) => window.I18n.t(key, params);

  let streamingContext = null;
  let streamEndPromise = null;
  let streamEndResolve = null;

  let docxExporting = false;
  let htmlExporting = false;
  let pdfExporting = false;
  let pendingImages = [];
  let pendingFiles = [];
  let pendingReferenceImage = null;
  let imageGenRatioPicked = false;
  let imageGenStylePicked = false;
  let imageGenTemplatePicked = false;
  let pendingReplyText = '';

  const getToolState = (patch = {}) => {
    const s = { ...state.get(), ...patch };
    return {
      webSearchEnabled: s.webSearchEnabled,
      imageGenEnabled: s.imageGenEnabled,
      thinkingEnabled: s.thinkingEnabled,
      translateEnabled: s.translateEnabled,
      translateTargetLang: s.translateTargetLang,
      imageGenRatio: s.imageGenRatio,
      imageGenStyle: s.imageGenStyle,
      imageGenTemplate: s.imageGenTemplate,
      referenceImage: pendingReferenceImage,
      imageGenRatioPicked,
      imageGenStylePicked,
      imageGenTemplatePicked
    };
  };

  const resetImageGenPicked = () => {
    imageGenRatioPicked = false;
    imageGenStylePicked = false;
    imageGenTemplatePicked = false;
  };

  const syncComposerTools = (modelId, patch = {}) => {
    ui.syncComposerToolsUI(modelId || state.get().currentModel || window.APP_CONFIG.DEFAULT_MODEL, getToolState(patch));
  };

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

  const formatQuoteForComposer = (text) => text;

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
      const partial = {
        role: 'assistant',
        content: streamingContext.buffer,
        ts: Date.now()
      };
      if (streamingContext.reasoningBuffer) partial.reasoningContent = streamingContext.reasoningBuffer;
      messages.push(partial);
    }

    return { ...convo, messages };
  };

  const isExportableMessage = (m) => {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) return false;
    if (m.role === 'assistant') {
      const hasText = !!convoMod.getAssistantContent(m);
      const hasImages = !!(m.generatedImages && m.generatedImages.length);
      return hasText || hasImages;
    }
    return true;
  };

  const getMessageForExport = (convo, idx) => {
    const m = convo.messages[idx];
    if (m && isExportableMessage(m)) return m;
    if (
      streamingContext
      && streamingContext.convo.id === convo.id
      && streamingContext.messageIndex === idx
      && streamingContext.buffer
    ) {
      const partial = {
        role: 'assistant',
        content: streamingContext.buffer,
        ts: Date.now()
      };
      if (streamingContext.reasoningBuffer) partial.reasoningContent = streamingContext.reasoningBuffer;
      if (streamingContext.generatedImages?.length) {
        partial.generatedImages = streamingContext.generatedImages.slice();
      }
      return partial;
    }
    if (m && m.role === 'assistant' && m.generatedImages?.length) return m;
    return null;
  };

  const getExportConvoForDownload = () => {
    const convo = convoMod.getCurrent();
    if (!convo) return null;

    if (!ui.isExportSelectMode()) {
      return buildExportConvo();
    }

    const indices = ui.getExportSelectedIndices();
    if (!indices.length) return null;

    const messages = [];
    for (const idx of indices) {
      const m = getMessageForExport(convo, idx);
      if (m) messages.push(m);
    }
    if (!messages.length) return null;

    return {
      ...convo,
      title: (convo.title || t('conversation')) + t('exportSelectedSuffix'),
      messages
    };
  };

  const requireExportConvo = () => {
    const exportConvo = getExportConvoForDownload();
    if (exportConvo && exportConvo.messages.length) return exportConvo;
    if (ui.isExportSelectMode()) {
      ui.showToast(t('toastSelectOneExport'));
    } else {
      ui.showToast(t('toastNoConvoExport'));
    }
    return null;
  };

  const buildSingleMessageExportConvo = (idx) => {
    const convo = convoMod.getCurrent();
    if (!convo) return null;
    const m = getMessageForExport(convo, idx);
    if (!m) return null;
    const baseTitle = (convo.title || t('conversation')).replace(/[^a-zA-Z0-9\u00C0-\u1EF9_\-\s]/g, '').trim() || t('conversation');
    return {
      ...convo,
      title: baseTitle + ' - ' + t('exportMessageLabel', { n: idx + 1 }),
      messages: [m]
    };
  };

  const requireMessageExportConvo = (idx) => {
    const exportConvo = buildSingleMessageExportConvo(idx);
    if (exportConvo) return exportConvo;
    ui.showToast(t('toastNoConvoExport'));
    return null;
  };

  const exportSingleMessageMarkdown = (idx) => {
    const exportConvo = requireMessageExportConvo(idx);
    if (!exportConvo) return;
    const { formatConversation, downloadFile } = window.Utils;
    const md = formatConversation(exportConvo);
    const safeName = exportConvo.title.replace(/[^a-zA-Z0-9\u00C0-\u1EF9_\-\s]/g, '').trim() || 'message';
    downloadFile(md, safeName + '.md', 'text/markdown');
    ui.showToast(t('toastDownloadMd'));
  };

  const exportSingleMessageTxt = (idx) => {
    const exportConvo = requireMessageExportConvo(idx);
    if (!exportConvo) return;
    const { formatConversationPlainText, downloadFile } = window.Utils;
    const text = formatConversationPlainText(exportConvo);
    const safeName = exportConvo.title.replace(/[^a-zA-Z0-9\u00C0-\u1EF9_\-\s]/g, '').trim() || 'message';
    downloadFile(text, safeName + '.txt', 'text/plain');
    ui.showToast(t('toastDownloadTxt'));
  };

  const exportSingleMessageImages = async (idx) => {
    const convo = convoMod.getCurrent();
    if (!convo) {
      ui.showToast(t('toastNoConvoExport'));
      return;
    }
    const m = getMessageForExport(convo, idx);
    const images = (m?.generatedImages || []).filter((img) => img?.dataUrl);
    if (!images.length) {
      ui.showToast(t('toastNoImageExport'));
      return;
    }

    const baseTitle = (convo.title || t('conversation')).replace(/[^a-zA-Z0-9\u00C0-\u1EF9_\-\s]/g, '').trim() || 'message';
    const answerLabel = t('exportMessageLabel', { n: idx + 1 }).replace(/\s+/g, '-');

    try {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const fallbackName = images.length > 1
          ? baseTitle + '-' + answerLabel + '-' + (i + 1)
          : baseTitle + '-' + answerLabel;
        await downloadDataUrlImage(img.dataUrl, img.name || fallbackName);
        if (i < images.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
      ui.showToast(images.length > 1 ? t('toastDownloadImagesOk', { n: images.length }) : t('toastDownloadImageOk'));
    } catch {
      ui.showToast(t('toastDownloadImageFail'));
    }
  };

  const exportSingleMessageDocx = async (idx) => {
    if (docxExporting) return;
    const exportConvo = requireMessageExportConvo(idx);
    if (!exportConvo) return;

    docxExporting = true;
    ui.setPdfExportLoading(true, {
      title: t('toastExportingWord'),
      hint: t('exportPdfHint'),
    });

    try {
      const result = await window.Utils.exportToDocx(exportConvo);
      const status = ui.finishExportDownload(result, {
        readyTitle: t('exportDownloadReadyTitle'),
        readyHint: t('exportDownloadReadyHint'),
        readyDownloadLabel: t('exportDownloadWordBtn'),
        kind: 'docx',
      });
      if (status === 'downloaded') ui.showToast(t('toastExportWordOk'));
    } catch (err) {
      ui.setPdfExportLoading(false);
      ui.showToast(t('toastExportWordFail', { err: err.message || err }));
    } finally {
      docxExporting = false;
    }
  };

  const exportSingleMessagePdf = async (idx) => {
    if (pdfExporting) return;
    const exportConvo = requireMessageExportConvo(idx);
    if (!exportConvo) return;

    pdfExporting = true;
    ui.setPdfExportLoading(true, {
      title: t('exportPdfTitle'),
      hint: t('exportPdfHint'),
    });

    try {
      const result = await window.PdfExport.exportToPdf(exportConvo, {
        onProgress: ({ title, hint }) => ui.setPdfExportLoading(true, { title, hint }),
      });
      const status = ui.finishExportDownload(result, {
        readyTitle: t('exportDownloadReadyTitle'),
        readyHint: t('exportDownloadReadyHint'),
        readyDownloadLabel: t('exportDownloadPdfBtn'),
        kind: 'pdf',
      });
      if (status === 'downloaded') ui.showToast(t('toastExportPdfOk'));
    } catch (err) {
      ui.setPdfExportLoading(false);
      ui.showToast(t('toastExportPdfFail', { err: err.message || err }));
    } finally {
      pdfExporting = false;
    }
  };

  const updateSendEnabled = () => {
    const s = state.get();
    const modelId = s.currentModel || window.APP_CONFIG.DEFAULT_MODEL;
    const hasKey = window.APP_CONFIG.hasApiKey(s, modelId);
    const hasText = ui.els.composerInput.value.trim().length > 0;
    const hasAttachments = pendingImages.length > 0 || pendingFiles.length > 0;
    if (s.imageGenEnabled) {
      ui.els.sendBtn.disabled = !hasKey || !hasText;
    } else {
      ui.els.sendBtn.disabled = !hasKey || (!hasText && !hasAttachments);
    }
    if (!window.API.isStreaming()) {
      ui.els.composerInput.disabled = false;
      const imageGenOn = s.imageGenEnabled;
      ui.els.attachBtn.disabled = imageGenOn;
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

    const modelId = state.get().currentModel || window.APP_CONFIG.DEFAULT_MODEL;
    if (!window.APP_CONFIG.modelSupportsVision(modelId)) {
      ui.showToast(t('toastNoImageAttach'));
      return;
    }

    const imageFiles = Array.from(files).filter(f => ACCEPTED_IMAGE_TYPES.includes(f.type));
    if (!imageFiles.length) {
      ui.showToast(t('toastImageTypes'));
      return;
    }

    let added = 0;
    for (const file of imageFiles) {
      try {
        const dataUrl = await readFileAsDataUrl(file);
        pendingImages.push({ dataUrl, name: file.name, mime: file.type });
        added++;
      } catch {
        ui.showToast(t('toastReadImageFail', { name: file.name }));
      }
    }

    if (added > 0) {
      ui.renderComposerAttachments(pendingImages, pendingFiles);
      updateSendEnabled();
    }
  };

  const addPendingDocuments = async (files) => {
    if (!files || !files.length) return;

    const docFiles = Array.from(files).filter((f) => fileMod.getKind(f) === 'document');
    if (!docFiles.length) {
      ui.showToast(t('toastUnsupportedDoc'));
      return;
    }

    let added = 0;
    for (const file of docFiles) {
      try {
        ui.showToast(t('toastReadingFile', { name: file.name }));
        const content = await fileMod.extractContent(file);
        pendingFiles.push({
          name: file.name,
          mime: file.type || fileMod.getExtension(file.name),
          size: file.size,
          content
        });
        added++;
      } catch (err) {
        ui.showToast(t('toastReadFileFail', { name: file.name, err: err.message || err }));
      }
    }

    if (added > 0) {
      ui.renderComposerAttachments(pendingImages, pendingFiles);
      updateSendEnabled();
      ui.showToast(t('toastAddedFiles', { n: added }));
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
      ui.showToast(t('toastDropTypes'));
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

  const getStreamingConvoId = () => streamingContext?.convo?.id ?? null;

  const settleActiveStream = async ({ discard = false } = {}) => {
    if (!window.API.isStreaming()) return;
    if (streamingContext) streamingContext.discardSave = !!discard;
    const wait = streamEndPromise || Promise.resolve();
    apiAbort();
    await wait;
  };

  const settleIfStreamingConvo = async (convoId, options = {}) => {
    if (!window.API.isStreaming()) return;
    if (getStreamingConvoId() !== convoId) return;
    await settleActiveStream(options);
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
    let reasoningBuffer = '';
    let generatedImages = [];
    let groundingMetadata = null;
    ui.setStreaming(true);
    ui.removeError();
    ui.updateStreamingAssistantContent(content, '', [], '', { reasoningOpen: false });

    streamEndResolve = null;
    streamEndPromise = new Promise((resolve) => { streamEndResolve = resolve; });

    streamingContext = { convo, contentEl: content, article, buffer: '', reasoningBuffer: '', generatedImages, groundingMetadata, retryIdx, discardSave: false, messageIndex };

    const modelId = s.currentModel || window.APP_CONFIG.DEFAULT_MODEL;
    const users = convo.messages.filter((m) => m.role === 'user');
    let triggerUser = users[users.length - 1] || null;
    if (retryIdx !== undefined) {
      triggerUser = null;
      for (let i = retryIdx - 1; i >= 0; i--) {
        if (convo.messages[i].role === 'user') {
          triggerUser = convo.messages[i];
          break;
        }
      }
    }
    const useWebSearch = s.webSearchEnabled && window.APP_CONFIG.modelSupportsWebSearch(modelId);
    const useImageGen = !!(triggerUser?.imageGen && window.APP_CONFIG.modelSupportsImageGen(modelId));
    const isDeepSeek = window.APP_CONFIG.getModelProvider(modelId) === 'deepseek';
    const useThinking = isDeepSeek
      ? s.reasoningEffort !== 'default' && window.APP_CONFIG.modelSupportsThinking(modelId)
      : (s.thinkingEnabled || window.APP_CONFIG.modelThinkingRequired(modelId))
        && window.APP_CONFIG.modelSupportsThinking(modelId);

    const refreshStreamingContent = () => {
      const reasoningOpen = !!reasoningBuffer && !buffer;
      ui.updateStreamingAssistantContent(
        content, buffer, generatedImages, reasoningBuffer, { reasoningOpen, groundingMetadata }
      );
    };

    const upsertGeneratedImage = (payload) => {
      const img = {
        dataUrl: payload.dataUrl,
        name: payload.partial ? 'Xem trước ' + ((payload.index ?? 0) + 1) : 'Hình ảnh AI'
      };
      if (payload.partial) {
        generatedImages[payload.index ?? 0] = img;
      } else {
        generatedImages = [img];
      }
      generatedImages = generatedImages.filter(Boolean);
      if (streamingContext) streamingContext.generatedImages = generatedImages;
      refreshStreamingContent();
    };

    const saveAssistantResult = (text) => {
      if (streamingContext?.discardSave) return;
      if (!convoMod.getById(convo.id)) return;
      const extra = {};
      if (generatedImages.length) extra.generatedImages = generatedImages.slice();
      if (reasoningBuffer) extra.reasoningContent = reasoningBuffer;
      if (groundingMetadata) extra.groundingMetadata = groundingMetadata;
      if (retryIdx !== undefined) {
        convoMod.finalizeAssistantMessage(convo, messageIndex, text, extra);
      } else {
        convoMod.addMessage(convo, {
          role: 'assistant',
          content: text,
          variants: [text],
          variantIndex: 0,
          ts: Date.now(),
          ...extra
        });
      }
    };

    const finishStreamingResponse = (buffer, { aborted = false } = {}) => {
      ui.setStreamingSearchStatus(article, null);
      ui.setStreamingImageStatus(article, null);

      const finalMsg = convo.messages[messageIndex];
      const viewingConvo = convoMod.getCurrent();
      const shouldFinalizeUi = viewingConvo?.id === convo.id && article?.isConnected;

      if (shouldFinalizeUi) {
        if (!article.dataset.idx && messageIndex !== undefined) {
          article.dataset.idx = String(messageIndex);
        }
        ui.finalizeStreaming(article, buffer || convoMod.getAssistantContent(finalMsg) || '', finalMsg);
      }

      ui.setStreaming(false);
      streamingContext = null;

      if (streamEndResolve) {
        streamEndResolve();
        streamEndResolve = null;
        streamEndPromise = null;
      }

      if (useImageGen && generatedImages.length && !aborted) {
        state.set({ imageGenEnabled: false });
        resetImageGenPicked();
        syncComposerTools(modelId, { imageGenEnabled: false });
      }

      updateSendEnabled();
    };

    await apiSend({
      apiKey: window.APP_CONFIG.getApiKey(s, modelId),
      model: modelId,
      systemPrompt: s.systemPrompt,
      convo,
      webSearch: useWebSearch,
      imageGen: useImageGen,
      thinking: useThinking,
      reasoningEffort: s.reasoningEffort || window.APP_CONFIG.DEFAULT_EFFORT,
      onSearchStatus: (status) => {
        if (status === 'searching') ui.setStreamingSearchStatus(article, 'searching');
      },
      onImageStatus: (status) => {
        if (status === 'generating') ui.setStreamingImageStatus(article, 'generating');
        else ui.setStreamingImageStatus(article, null);
      },
      onImagePartial: upsertGeneratedImage,
      onImageComplete: (payload) => {
        ui.setStreamingImageStatus(article, null);
        upsertGeneratedImage(payload);
      },
      onToken: (delta) => {
        ui.setStreamingSearchStatus(article, null);
        buffer += delta;
        if (streamingContext) streamingContext.buffer = buffer;
        refreshStreamingContent();
      },
      onReasoningToken: (delta) => {
        reasoningBuffer += delta;
        if (streamingContext) streamingContext.reasoningBuffer = reasoningBuffer;
        refreshStreamingContent();
      },
      onGroundingMetadata: (meta) => {
        groundingMetadata = meta;
        if (streamingContext) streamingContext.groundingMetadata = meta;
        refreshStreamingContent();
      },
      onDone: (info) => {
        const discard = !!(streamingContext && streamingContext.discardSave);
        const msg = convo.messages[messageIndex];
        const hasResult = buffer || generatedImages.length;
        const aborted = !!(info && info.aborted);
        if (aborted) {
          if (hasResult && !discard) {
            saveAssistantResult(buffer);
            ui.showToast(t('toastStopped'));
          } else if (retryIdx !== undefined && !discard) {
            convoMod.cancelRetryVariant(convo, messageIndex);
            if (msg && convoMod.getById(convo.id)) ui.updateAssistantMessage(messageIndex, msg);
          }
        } else if (hasResult && !discard) {
          saveAssistantResult(buffer);
        } else if (retryIdx !== undefined && !discard) {
          convoMod.cancelRetryVariant(convo, messageIndex);
        }

        finishStreamingResponse(buffer, { aborted });
        if (info?.usage && !discard) {
          convoMod.addTokenUsage(convo, modelId, info.usage);
          ui.updateSettingsTokenUsage(state.get());
          ui.checkTokenCostWarning(state.get());
        }
      },
      onError: (err) => {
        const discard = !!(streamingContext && streamingContext.discardSave);
        if (!discard) {
          const finalText = buffer || '_Đã xảy ra lỗi, tin nhắn trống._';
          saveAssistantResult(finalText);
          ui.showError(err);
        }
        finishStreamingResponse(buffer || '');
      }
    });
  };

  const retryAssistantMessage = async (idx) => {
    const s = state.get();
    const modelId = s.currentModel || window.APP_CONFIG.DEFAULT_MODEL;
    if (!window.APP_CONFIG.hasApiKey(s, modelId)) {
      ui.openSettings(s);
      ui.showToast(window.APP_CONFIG.getMissingApiKeyMessage(modelId));
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
    const modelId = s.currentModel || window.APP_CONFIG.DEFAULT_MODEL;
    if (!window.APP_CONFIG.hasApiKey(s, modelId)) {
      ui.openSettings(s);
      ui.showToast(window.APP_CONFIG.getMissingApiKeyMessage(modelId));
      return;
    }
    const text = ui.els.composerInput.value.trim();
    if (window.API.isStreaming()) return;
    if (s.imageGenEnabled) {
      if (!text) return;
    } else if (!text && !pendingImages.length && !pendingFiles.length) {
      return;
    }

    const convo = convoMod.ensure();

    const userMsg = {
      role: 'user',
      content: text,
      ts: Date.now()
    };
    if (s.imageGenEnabled && text) {
      userMsg.imageGen = {
        ratio: s.imageGenRatio || window.APP_CONFIG.DEFAULT_IMAGE_GEN_RATIO,
        style: s.imageGenStyle || window.APP_CONFIG.DEFAULT_IMAGE_GEN_STYLE,
        template: s.imageGenTemplate || window.APP_CONFIG.DEFAULT_IMAGE_GEN_TEMPLATE
      };
      if (pendingReferenceImage) {
        userMsg.images = [{
          dataUrl: pendingReferenceImage.dataUrl,
          name: pendingReferenceImage.name,
          mime: pendingReferenceImage.mime,
          reference: true
        }];
      }
    } else {
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
      if (s.translateEnabled && text) {
        userMsg.translateTo = s.translateTargetLang || window.APP_CONFIG.DEFAULT_TRANSLATE_LANG;
      }
    }
    convoMod.addMessage(convo, userMsg);
    const userMsgIdx = convo.messages.length - 1;

    ui.els.composerInput.value = '';
    clearPendingAttachments();
    pendingReferenceImage = null;
    resetImageGenPicked();
    syncComposerTools();
    autoResize(ui.els.composerInput);
    ui.removeError();
    ui.appendMessage(userMsg, userMsgIdx);
    ui.refreshConversationList(convo.id);
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
    ui.showToast(t('toastEditSaved'));
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
      if (e.key === 'Enter' && e.shiftKey && !e.isComposing) {
        requestAnimationFrame(() => autoResize(ui.els.composerInput));
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        sendCurrent();
      }
    });

    ui.els.composerInput.addEventListener('paste', (e) => {
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) {
        requestAnimationFrame(() => autoResize(ui.els.composerInput));
        return;
      }
      const imageFiles = [];
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (!imageFiles.length) {
        requestAnimationFrame(() => autoResize(ui.els.composerInput));
        return;
      }
      e.preventDefault();
      addPendingImages(imageFiles);
    });

    ui.els.attachBtn.addEventListener('click', () => {
      ui.els.attachFileInput.click();
    });

    ui.els.attachFileInput.addEventListener('change', () => {
      addDroppedFiles(ui.els.attachFileInput.files);
      ui.els.attachFileInput.value = '';
    });

    ui.els.composerAttachments.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove-idx]');
      if (!btn) return;
      const idx = parseInt(btn.dataset.removeIdx, 10);
      if (btn.dataset.removeType === 'file') removePendingFile(idx);
      else removePendingImage(idx);
    });

    const hasFileDrag = (e) => e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files');
    const canAcceptImageDrop = () => {
      const settingsOpen = ui.els.settingsModal && !ui.els.settingsModal.classList.contains('hidden');
      const guideOpen = ui.els.guideModal && !ui.els.guideModal.classList.contains('hidden');
      return !settingsOpen && !guideOpen;
    };

    const getDragFileKind = (e) => {
      const items = e.dataTransfer?.items;
      if (!items || !items.length) return 'mixed';
      let hasImage = false;
      let hasOther = false;
      for (const item of items) {
        if (item.kind !== 'file') continue;
        if (item.type.startsWith('image/')) hasImage = true;
        else hasOther = true;
      }
      if (hasImage && hasOther) return 'mixed';
      if (hasImage) return 'image';
      if (hasOther) return 'file';
      return 'mixed';
    };

    let fileDragOverlayActive = false;
    let fileDragHideTimer = null;

    const clearFileDragHideTimer = () => {
      if (fileDragHideTimer) {
        clearTimeout(fileDragHideTimer);
        fileDragHideTimer = null;
      }
    };

    const hideFileDragOverlay = () => {
      clearFileDragHideTimer();
      if (!fileDragOverlayActive) return;
      fileDragOverlayActive = false;
      ui.setDragOverlay(false);
    };

    const keepFileDragOverlay = (e) => {
      if (!hasFileDrag(e) || !canAcceptImageDrop()) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      clearFileDragHideTimer();
      if (!fileDragOverlayActive) {
        fileDragOverlayActive = true;
        ui.setDragOverlay(true, getDragFileKind(e));
      }
      fileDragHideTimer = setTimeout(hideFileDragOverlay, 120);
    };

    document.addEventListener('dragenter', keepFileDragOverlay, true);
    document.addEventListener('dragover', keepFileDragOverlay, true);

    document.addEventListener('dragleave', (e) => {
      if (!fileDragOverlayActive || !hasFileDrag(e)) return;
      const related = e.relatedTarget;
      if (related == null || !document.body.contains(related)) {
        clearFileDragHideTimer();
        fileDragHideTimer = setTimeout(hideFileDragOverlay, 0);
      }
    });

    document.addEventListener('drop', (e) => {
      hideFileDragOverlay();
      if (!hasFileDrag(e) || !canAcceptImageDrop()) return;
      e.preventDefault();
      if (e.dataTransfer.files.length) {
        addDroppedFiles(e.dataTransfer.files);
        ui.els.composerInput.focus();
      }
    });

    document.addEventListener('dragend', hideFileDragOverlay);
    window.addEventListener('blur', hideFileDragOverlay);

    ui.els.stopBtn.addEventListener('click', stopStreaming);

    const startNewChat = async () => {
      await settleActiveStream({ discard: false });
      ui.setExportSelectMode(false);
      const c = convoMod.create();
      clearPendingAttachments();
      ui.refreshConversationList(c.id);
      ui.renderMessages(c);
      ui.updateSettingsTokenUsage(state.get());
      ui.els.composerInput.focus();
    };

    ui.els.newChatBtn.addEventListener('click', startNewChat);
    ui.els.headerNewChatBtn?.addEventListener('click', startNewChat);

    if (ui.els.toggleSidebarSearchBtn) {
      ui.els.toggleSidebarSearchBtn.addEventListener('click', () => {
        ui.toggleConversationSearch();
      });
    }

    const onSidebarSearchInput = debounce(() => {
      ui.setConversationSearchQuery(ui.els.sidebarSearchInput.value);
    }, 220);

    if (ui.els.sidebarSearchInput) {
      ui.els.sidebarSearchInput.addEventListener('input', onSidebarSearchInput);
      ui.els.sidebarSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          if (ui.getConversationSearchQuery()) {
            ui.clearConversationSearch();
          } else {
            ui.toggleConversationSearch(false);
          }
        }
      });
    }

    if (ui.els.sidebarSearchClear) {
      ui.els.sidebarSearchClear.addEventListener('click', () => {
        ui.clearConversationSearch();
        ui.els.sidebarSearchInput?.focus();
      });
    }

    ui.els.conversationList.addEventListener('click', async (e) => {
      const item = e.target.closest('.conversation-item');
      if (!item) return;
      const id = item.dataset.id;
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'delete') {
        e.stopPropagation();
        if (!confirm(t('confirmDeleteConvo'))) return;
        await settleIfStreamingConvo(id, { discard: true });
        convoMod.remove(id);
        const cur = convoMod.getCurrent();
        ui.refreshConversationList(cur ? cur.id : null);
        ui.renderMessages(cur);
        ui.closeMobileSidebar();
      } else if (action === 'rename') {
        e.stopPropagation();
        const c = convoMod.getById(id);
        if (!c) return;
        const next = await ui.openRenameModal(c.title);
        if (next !== null) {
          convoMod.rename(id, next.trim() || c.title);
          ui.refreshConversationList(convoMod.getCurrent()?.id || null);
        }
      } else {
        const streamingId = getStreamingConvoId();
        if (window.API.isStreaming() && streamingId && id !== streamingId) {
          await settleActiveStream({ discard: false });
        }
        ui.setExportSelectMode(false);
        const c = convoMod.select(id);
        if (!c) return;
        ui.refreshConversationList(id);
        ui.renderMessages(c);
        ui.updateSettingsTokenUsage(state.get());
        ui.closeMobileSidebar();
        ui.els.composerInput.focus();
      }
    });

    ui.els.toggleExportSelectBtn?.addEventListener('click', () => {
      ui.toggleExportSelectMode();
    });

    ui.els.exportSelectAllBtn?.addEventListener('click', () => {
      ui.selectAllExportMessages();
    });

    ui.els.exportSelectClearBtn?.addEventListener('click', () => {
      ui.clearExportSelection();
    });

    ui.els.exitExportSelectBtn?.addEventListener('click', () => {
      ui.setExportSelectMode(false);
    });

    ui.els.messages.addEventListener('click', (e) => {
      if (!ui.isExportSelectMode()) return;
      if (e.target.closest('.generated-image-btn')) return;

      const article = e.target.closest('.message[data-idx]');
      if (!article) return;
      const idx = parseInt(article.dataset.idx, 10);
      if (isNaN(idx)) return;
      e.preventDefault();
      ui.toggleExportSelectIndex(idx);
    });

    ui.els.headerDownloadBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      ui.toggleHeaderDownloadMenu();
    });

    ui.els.headerDownloadMenu?.addEventListener('click', async (e) => {
      const option = e.target.closest('.header-download-option');
      if (!option || option.disabled) return;
      const format = option.dataset.exportFormat;
      ui.closeHeaderDownloadMenu();

      if (format === 'md') {
        const exportConvo = requireExportConvo();
        if (!exportConvo) return;
        ui.downloadConversation(exportConvo);
        ui.showToast(ui.isExportSelectMode() ? t('toastDownloadMdSelected') : t('toastDownloadMd'));
        return;
      }

      if (format === 'txt') {
        const exportConvo = requireExportConvo();
        if (!exportConvo) return;
        ui.downloadConversationTxt(exportConvo);
        ui.showToast(ui.isExportSelectMode() ? t('toastDownloadTxtSelected') : t('toastDownloadTxt'));
        return;
      }

      if (format === 'docx') {
        if (docxExporting) return;
        const exportConvo = requireExportConvo();
        if (!exportConvo) return;

        docxExporting = true;
        ui.setHeaderDownloadOptionDisabled('docx', true);
        const streaming = window.API.isStreaming();
        ui.setPdfExportLoading(true, {
          title: t('toastExportingWord'),
          hint: streaming ? t('toastExportingWordStream') : t('exportPdfHint'),
        });

        try {
          const result = await window.Utils.exportToDocx(exportConvo);
          const status = ui.finishExportDownload(result, {
            readyTitle: t('exportDownloadReadyTitle'),
            readyHint: t('exportDownloadReadyHint'),
            readyDownloadLabel: t('exportDownloadWordBtn'),
            kind: 'docx',
          });
          if (status === 'downloaded') ui.showToast(t('toastExportWordOk'));
        } catch (err) {
          ui.setPdfExportLoading(false);
          ui.showToast(t('toastExportWordFail', { err: err.message || err }));
        } finally {
          docxExporting = false;
          ui.setHeaderDownloadOptionDisabled('docx', false);
        }
        return;
      }

      if (format === 'html') {
        if (htmlExporting) return;
        const exportConvo = requireExportConvo();
        if (!exportConvo) return;

        htmlExporting = true;
        ui.setHeaderDownloadOptionDisabled('html', true);
        const streaming = window.API.isStreaming();
        ui.setPdfExportLoading(true, {
          title: t('exportHtmlTitle'),
          hint: streaming ? t('toastExportingWordStream') : t('exportPdfHint'),
        });

        try {
          const result = await window.HtmlExport.exportToHtml(exportConvo, {
            onProgress: ({ title, hint }) => ui.setPdfExportLoading(true, { title, hint }),
          });
          const status = ui.finishExportDownload(result, {
            readyTitle: t('exportDownloadReadyTitle'),
            readyHint: t('exportDownloadReadyHint'),
            readyDownloadLabel: t('exportDownloadHtmlBtn'),
            kind: 'html',
          });
          if (status === 'downloaded') ui.showToast(t('toastExportHtmlOk'));
        } catch (err) {
          ui.setPdfExportLoading(false);
          ui.showToast(t('toastExportHtmlFail', { err: err.message || err }));
        } finally {
          htmlExporting = false;
          ui.setHeaderDownloadOptionDisabled('html', false);
        }
        return;
      }

      if (format === 'pdf') {
        if (pdfExporting) return;
        const exportConvo = requireExportConvo();
        if (!exportConvo) return;

        pdfExporting = true;
        ui.setHeaderDownloadOptionDisabled('pdf', true);
        const streaming = window.API.isStreaming();
        ui.setPdfExportLoading(true, {
          title: t('exportPdfTitle'),
          hint: streaming ? t('toastExportingWordStream') : t('exportPdfHint'),
        });

        try {
          const result = await window.PdfExport.exportToPdf(exportConvo, {
            onProgress: ({ title, hint }) => ui.setPdfExportLoading(true, { title, hint }),
          });
          const status = ui.finishExportDownload(result, {
            readyTitle: t('exportDownloadReadyTitle'),
            readyHint: t('exportDownloadReadyHint'),
            readyDownloadLabel: t('exportDownloadPdfBtn'),
            kind: 'pdf',
          });
          if (status === 'downloaded') ui.showToast(t('toastExportPdfOk'));
        } catch (err) {
          ui.setPdfExportLoading(false);
          ui.showToast(t('toastExportPdfFail', { err: err.message || err }));
        } finally {
          pdfExporting = false;
          ui.setHeaderDownloadOptionDisabled('pdf', false);
        }
      }
    });

    ui.els.copyMarkdownBtn.addEventListener('click', async () => {
      const exportConvo = requireExportConvo();
      if (!exportConvo) return;
      const md = window.Utils.formatConversation(exportConvo);
      if (await copyToClipboard(md)) {
        ui.showToast(ui.isExportSelectMode() ? t('toastCopiedSelected') : t('toastCopied'));
      }
    });

    ui.els.pdfExportDownloadBtn?.addEventListener('click', () => {
      const pending = ui.consumeExportDownload();
      if (!pending) return;
      window.Utils.downloadBlob(pending.blob, pending.filename);
      ui.setPdfExportLoading(false);
      const toastKey = pending.kind === 'docx'
        ? 'toastExportWordOk'
        : pending.kind === 'html'
          ? 'toastExportHtmlOk'
          : 'toastExportPdfOk';
      ui.showToast(t(toastKey));
    });

    const openGuideFromClick = (e) => {
      const trigger = e.target.closest('[data-action="open-guide"], #openGuideBtn, #settingsGuideBtn');
      if (!trigger) return;
      e.preventDefault();
      if (!ui.els.settingsModal.classList.contains('hidden')) {
        applySettingsFromForm();
      }
      ui.openGuide();
    };

    ui.els.openSettingsBtn.addEventListener('click', () => ui.openSettings(state.get()));
    ui.els.guideOpenSettingsBtn?.addEventListener('click', () => {
      ui.closeGuide();
      ui.openSettings(state.get());
    });
    ui.els.tokenCostWarningSettingsBtn?.addEventListener('click', () => {
      ui.closeTokenCostWarning();
      ui.openSettings(state.get());
    });
    ui.els.modelSelect.addEventListener('change', () => {
      const modelId = ui.els.modelSelect.value;
      const s = state.get();
      let webSearchEnabled = s.webSearchEnabled;
      let imageGenEnabled = s.imageGenEnabled;
      let thinkingEnabled = s.thinkingEnabled;
      let reasoningEffort = window.APP_CONFIG.normalizeEffortForModel(s.reasoningEffort, modelId);
      if (!window.APP_CONFIG.modelSupportsWebSearch(modelId)) webSearchEnabled = false;
      if (!window.APP_CONFIG.modelSupportsImageGen(modelId)) imageGenEnabled = false;
      if (!window.APP_CONFIG.modelSupportsThinking(modelId)) thinkingEnabled = false;
      if (window.APP_CONFIG.modelThinkingRequired(modelId)) thinkingEnabled = true;
      if (window.APP_CONFIG.getModelProvider(modelId) === 'deepseek') {
        thinkingEnabled = reasoningEffort !== 'default';
      }
      if (window.APP_CONFIG.modelUsesBinaryThinking(modelId)) {
        if (window.APP_CONFIG.modelThinkingRequired(modelId)) {
          thinkingEnabled = true;
        }
      }
      if (!window.APP_CONFIG.modelSupportsVision(modelId) && pendingImages.length) {
        pendingImages = [];
        ui.renderComposerAttachments(pendingImages, pendingFiles);
      }
      state.set({ currentModel: modelId, webSearchEnabled, imageGenEnabled, thinkingEnabled, reasoningEffort });
      syncComposerTools(modelId, { webSearchEnabled, imageGenEnabled, thinkingEnabled, reasoningEffort });
      updateSendEnabled();
      ui.updateSettingsTokenUsage(state.get());
      const label = ui.els.modelSelect.selectedOptions[0]?.textContent || modelId;
      ui.showToast(t('toastModel', { label }));
    });

    ui.els.effortSelect?.addEventListener('change', () => {
      const effort = ui.els.effortSelect.value;
      const modelId = state.get().currentModel || window.APP_CONFIG.DEFAULT_MODEL;
      const patch = { reasoningEffort: effort };
      if (window.APP_CONFIG.getModelProvider(modelId) === 'deepseek') {
        patch.thinkingEnabled = effort !== 'default';
      }
      state.set(patch);
      syncComposerTools(modelId, patch);
      const label = ui.els.effortSelect.selectedOptions[0]?.textContent || effort;
      ui.showToast(t('toastEffort', { label }));
    });

    ui.els.webSearchBtn.addEventListener('click', () => {
      const s = state.get();
      const modelId = s.currentModel || window.APP_CONFIG.DEFAULT_MODEL;
      if (!window.APP_CONFIG.modelSupportsWebSearch(modelId)) return;
      const next = !s.webSearchEnabled;
      state.set({ webSearchEnabled: next });
      syncComposerTools(modelId, { webSearchEnabled: next });
      ui.showToast(next ? t('toastWebSearchOn') : t('toastWebSearchOff'));
    });

    ui.els.thinkingBtn.addEventListener('click', () => {
      const s = state.get();
      const modelId = s.currentModel || window.APP_CONFIG.DEFAULT_MODEL;
      if (!window.APP_CONFIG.modelSupportsThinking(modelId)) return;
      if (window.APP_CONFIG.modelThinkingRequired(modelId)) return;
      const next = !s.thinkingEnabled;
      const patch = { thinkingEnabled: next };
      if (window.APP_CONFIG.getModelProvider(modelId) === 'deepseek') {
        patch.reasoningEffort = next
          ? (s.reasoningEffort === 'default' ? 'high' : s.reasoningEffort)
          : 'default';
      }
      state.set(patch);
      syncComposerTools(modelId, patch);
      ui.showToast(next ? t('toastThinkingOn') : t('toastThinkingOff'));
    });

    const setImageGenEnabled = (enabled) => {
      const s = state.get();
      const modelId = s.currentModel || window.APP_CONFIG.DEFAULT_MODEL;
      if (enabled && !window.APP_CONFIG.modelSupportsImageGen(modelId)) return;
      const patch = { imageGenEnabled: enabled };
      if (enabled) {
        patch.translateEnabled = false;
        clearPendingAttachments();
        resetImageGenPicked();
      } else {
        pendingReferenceImage = null;
        resetImageGenPicked();
      }
      state.set(patch);
      syncComposerTools(modelId, patch);
      updateSendEnabled();
      ui.showToast(enabled ? t('toastImageGenOn') : t('toastImageGenOff'));
    };

    ui.els.imageGenBtn.addEventListener('click', () => {
      setImageGenEnabled(!state.get().imageGenEnabled);
    });

    ui.els.imageGenChipClose.addEventListener('click', () => {
      setImageGenEnabled(false);
    });

    ui.els.imageGenRefBtn.addEventListener('click', () => {
      if (!state.get().imageGenEnabled) return;
      ui.els.imageGenRefInput.click();
    });

    ui.els.imageGenRefInput.addEventListener('change', async () => {
      const file = ui.els.imageGenRefInput.files && ui.els.imageGenRefInput.files[0];
      ui.els.imageGenRefInput.value = '';
      if (!file) return;
      if (!window.APP_CONFIG.ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        ui.showToast(t('toastImageTypes'));
        return;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        pendingReferenceImage = { dataUrl, name: file.name, mime: file.type };
        syncComposerTools();
        ui.showToast(t('toastRefImageAdded'));
      } catch {
        ui.showToast(t('toastRefImageFail'));
      }
    });

    ui.els.imageGenRatioBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!state.get().imageGenEnabled) return;
      ui.toggleImageGenMenu(ui.els.imageGenRatioMenu, ui.els.imageGenRatioBtn);
    });

    ui.els.imageGenStyleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!state.get().imageGenEnabled) return;
      ui.toggleImageGenMenu(ui.els.imageGenStyleMenu, ui.els.imageGenStyleBtn);
    });

    ui.els.imageGenTemplateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!state.get().imageGenEnabled) return;
      ui.toggleImageGenMenu(ui.els.imageGenTemplateMenu, ui.els.imageGenTemplateBtn);
    });

    ui.els.imageGenRatioOptions.addEventListener('click', (e) => {
      const option = e.target.closest('.composer-dropdown-option');
      if (!option) return;
      const ratioId = option.dataset.value;
      if (!ratioId) return;
      imageGenRatioPicked = true;
      state.set({ imageGenRatio: ratioId });
      syncComposerTools(null, { imageGenRatio: ratioId });
    });

    ui.els.imageGenStyleOptions.addEventListener('click', (e) => {
      const option = e.target.closest('.composer-dropdown-option');
      if (!option) return;
      const styleId = option.dataset.value;
      if (!styleId) return;
      imageGenStylePicked = true;
      state.set({ imageGenStyle: styleId });
      syncComposerTools(null, { imageGenStyle: styleId });
    });

    ui.els.imageGenTemplateOptions.addEventListener('click', (e) => {
      const option = e.target.closest('.composer-dropdown-option');
      if (!option) return;
      const templateId = option.dataset.value;
      if (!templateId) return;
      imageGenTemplatePicked = true;
      state.set({ imageGenTemplate: templateId });
      syncComposerTools(null, { imageGenTemplate: templateId });
    });

    ui.els.imageGenRatioChipClear.addEventListener('click', () => {
      imageGenRatioPicked = false;
      syncComposerTools();
      ui.els.imageGenRatioBtn?.click();
    });

    ui.els.imageGenStyleChipClear.addEventListener('click', () => {
      imageGenStylePicked = false;
      syncComposerTools();
      ui.els.imageGenStyleBtn?.click();
    });

    ui.els.imageGenTemplateChipClear.addEventListener('click', () => {
      imageGenTemplatePicked = false;
      syncComposerTools();
      ui.els.imageGenTemplateBtn?.click();
    });

    const setTranslateEnabled = (enabled) => {
      const modelId = state.get().currentModel || window.APP_CONFIG.DEFAULT_MODEL;
      const patch = { translateEnabled: enabled };
      if (enabled) {
        patch.imageGenEnabled = false;
        pendingReferenceImage = null;
      }
      state.set(patch);
      syncComposerTools(modelId, patch);
      updateSendEnabled();
      ui.showToast(enabled ? t('toastTranslateOn') : t('toastTranslateOff'));
    };

    ui.els.translateBtn.addEventListener('click', () => {
      setTranslateEnabled(!state.get().translateEnabled);
    });

    ui.els.translateChipClose.addEventListener('click', () => {
      setTranslateEnabled(false);
    });

    ui.els.translateLangBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!state.get().translateEnabled) return;
      ui.closeImageGenMenus();
      const menu = ui.els.translateLangMenu;
      const open = menu.classList.contains('hidden');
      if (open) {
        menu.classList.remove('hidden');
        ui.els.translateLangBtn.setAttribute('aria-expanded', 'true');
      } else {
        ui.closeTranslateLangMenu();
      }
    });

    ui.els.translateLangOptions.addEventListener('click', (e) => {
      const option = e.target.closest('.translate-lang-option');
      if (!option) return;
      const langCode = option.dataset.lang;
      if (!langCode) return;
      state.set({ translateTargetLang: langCode });
      syncComposerTools(null, { translateTargetLang: langCode });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.translate-lang-wrap')) {
        ui.closeTranslateLangMenu();
      }
      if (!e.target.closest('.composer-dropdown-wrap')) {
        ui.closeImageGenMenus();
      }
      if (!e.target.closest('.msg-export-wrap')) {
        ui.closeAllMsgExportMenus();
      }
      if (!e.target.closest('.header-download-wrap')) {
        ui.closeHeaderDownloadMenu();
      }
    });

    const THEME_CYCLE = ['dark', 'vs-dark', 'apple', 'apple-dark', 'hello-kitty', 'cyberpunk', 'nvidia', 'liquid-glass'];

    ui.els.themeToggleBtn.addEventListener('click', () => {
      const current = state.get().theme || 'dark';
      const idx = THEME_CYCLE.indexOf(current);
      const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
      state.set({ theme: next });
      ui.setTheme(next);
      ui.rerenderMermaid();
      if (ui.els.settingsThemeSelect) ui.els.settingsThemeSelect.value = next;
    });

    ui.els.toggleApiKeyBtn.addEventListener('click', () => {
      const isPwd = ui.els.apiKeyInput.type === 'password';
      ui.els.apiKeyInput.type = isPwd ? 'text' : 'password';
      ui.els.apiKeyIcon.innerHTML = isPwd ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    });

    ui.els.toggleAnthropicApiKeyBtn.addEventListener('click', () => {
      const isPwd = ui.els.anthropicApiKeyInput.type === 'password';
      ui.els.anthropicApiKeyInput.type = isPwd ? 'text' : 'password';
      ui.els.anthropicApiKeyIcon.innerHTML = isPwd ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    });

    ui.els.toggleDeepseekApiKeyBtn.addEventListener('click', () => {
      const isPwd = ui.els.deepseekApiKeyInput.type === 'password';
      ui.els.deepseekApiKeyInput.type = isPwd ? 'text' : 'password';
      ui.els.deepseekApiKeyIcon.innerHTML = isPwd ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    });

    ui.els.toggleGeminiApiKeyBtn.addEventListener('click', () => {
      const isPwd = ui.els.geminiApiKeyInput.type === 'password';
      ui.els.geminiApiKeyInput.type = isPwd ? 'text' : 'password';
      ui.els.geminiApiKeyIcon.innerHTML = isPwd ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    });

    ui.els.toggleKimiApiKeyBtn.addEventListener('click', () => {
      const isPwd = ui.els.kimiApiKeyInput.type === 'password';
      ui.els.kimiApiKeyInput.type = isPwd ? 'text' : 'password';
      ui.els.kimiApiKeyIcon.innerHTML = isPwd ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    });

    const handleClearAll = async () => {
      if (!confirm(t('confirmClearAll'))) return;
      await settleActiveStream({ discard: true });
      await ui.animateClearAll();
      convoMod.clearAll();
      ui.clearConversationSearch();
      ui.refreshConversationList(null);
      ui.renderMessages(null, { animateEmpty: true });
      ui.showToast(t('toastClearAll'));
    };

    ui.els.clearAllBtn.addEventListener('click', handleClearAll);
    ui.els.clearAllSidebarBtn.addEventListener('click', handleClearAll);

    let systemPromptSaveTimer = null;
    const scheduleApplySettingsFromForm = () => {
      clearTimeout(systemPromptSaveTimer);
      systemPromptSaveTimer = setTimeout(() => applySettingsFromForm(), 300);
    };

    const applySettingsFromForm = () => {
      const apiKey = ui.els.apiKeyInput.value.trim();
      const anthropicApiKey = ui.els.anthropicApiKeyInput.value.trim();
      const deepseekApiKey = ui.els.deepseekApiKeyInput.value.trim();
      const geminiApiKey = ui.els.geminiApiKeyInput.value.trim();
      const kimiApiKey = ui.els.kimiApiKeyInput.value.trim();
      const prev = state.get();
      const locale = ui.els.settingsLocaleSelect?.value || window.APP_CONFIG.DEFAULT_LOCALE;
      let mode = ui.els.systemPromptModeSelect?.value || 'default';
      let systemPrompt = ui.els.systemPromptInput.value.trim();

      if (mode !== 'custom' && systemPrompt) {
        const presetForMode = window.I18n.getSystemPromptForMode(mode, locale);
        if (systemPrompt !== presetForMode) {
          mode = 'custom';
        }
      }

      if (mode === 'custom') {
        systemPrompt = ui.els.systemPromptInput.value.trim();
      } else {
        systemPrompt = window.I18n.getSystemPromptForMode(mode, locale);
        ui.els.systemPromptInput.value = systemPrompt;
      }

      if (ui.els.systemPromptModeHint) {
        ui.els.systemPromptModeHint.textContent = window.I18n.getSystemPromptModeHint(mode);
      }

      const theme = ui.els.settingsThemeSelect?.value || 'dark';
      const prevTheme = prev.theme;
      const nextState = {
        apiKey, anthropicApiKey, deepseekApiKey, geminiApiKey, kimiApiKey,
        systemPrompt, systemPromptMode: mode, theme, locale
      };
      state.set(nextState);
      window.I18n.populateSystemPromptModeSelect(ui.els.systemPromptModeSelect, mode);
      ui.setTheme(theme);
      if (prevTheme !== theme) ui.rerenderMermaid();
      if (prev.locale !== locale) {
        ui.applyLocale({ ...prev, ...nextState });
        ui.syncSystemPromptModeUI({ ...prev, ...nextState });
      } else {
        window.I18n.applyToDOM();
      }
      updateSendEnabled();
    };

    ui.els.systemPromptModeSelect?.addEventListener('change', () => {
      const mode = ui.els.systemPromptModeSelect.value;
      const locale = ui.els.settingsLocaleSelect?.value || window.APP_CONFIG.DEFAULT_LOCALE;
      if (mode !== 'custom') {
        ui.els.systemPromptInput.value = window.I18n.getSystemPromptForMode(mode, locale);
      }
      if (ui.els.systemPromptModeHint) {
        ui.els.systemPromptModeHint.textContent = window.I18n.getSystemPromptModeHint(mode);
      }
      applySettingsFromForm();
      ui.showToast(t('toastSystemPromptMode', { label: window.I18n.getSystemPromptModeLabel(mode) }));
    });

    ui.els.systemPromptInput?.addEventListener('input', () => {
      const locale = ui.els.settingsLocaleSelect?.value || window.APP_CONFIG.DEFAULT_LOCALE;
      let mode = ui.els.systemPromptModeSelect?.value || 'default';
      const text = ui.els.systemPromptInput.value.trim();
      if (mode !== 'custom') {
        const preset = window.I18n.getSystemPromptForMode(mode, locale);
        if (text !== preset) {
          mode = 'custom';
          window.I18n.populateSystemPromptModeSelect(ui.els.systemPromptModeSelect, 'custom');
          if (ui.els.systemPromptModeHint) {
            ui.els.systemPromptModeHint.textContent = window.I18n.getSystemPromptModeHint('custom');
          }
        }
      }
      scheduleApplySettingsFromForm();
    });

    const closeSettingsModal = () => {
      clearTimeout(systemPromptSaveTimer);
      applySettingsFromForm();
      ui.closeSettings();
    };

    ui.els.settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      applySettingsFromForm();
    });

    ui.els.settingsLocaleSelect?.addEventListener('change', applySettingsFromForm);
    ui.els.settingsThemeSelect?.addEventListener('change', applySettingsFromForm);

    [
      ui.els.apiKeyInput,
      ui.els.anthropicApiKeyInput,
      ui.els.deepseekApiKeyInput,
      ui.els.geminiApiKeyInput,
      ui.els.kimiApiKeyInput,
      ui.els.systemPromptInput,
    ].forEach((input) => {
      input?.addEventListener('blur', applySettingsFromForm);
    });

    document.addEventListener('click', openGuideFromClick);

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
        if (el.closest('#guideModal')) {
          ui.closeGuide();
          return;
        }
        if (el.closest('#renameModal')) {
          ui.closeRenameModal(null);
          return;
        }
        if (el.closest('#tokenCostWarningModal')) {
          ui.closeTokenCostWarning();
          return;
        }
        if (el.closest('#settingsModal')) {
          closeSettingsModal();
        }
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
        if (ui.isExportSelectMode()) {
          e.preventDefault();
          ui.setExportSelectMode(false);
          return;
        }
        if (!ui.els.translateLangMenu.classList.contains('hidden')) {
          ui.closeTranslateLangMenu();
          return;
        }
        if (document.querySelector('.msg-export-menu:not(.hidden)')) {
          ui.closeAllMsgExportMenus();
          return;
        }
        if (!ui.els.headerDownloadMenu?.classList.contains('hidden')) {
          ui.closeHeaderDownloadMenu();
          return;
        }
        if (!ui.els.imageGenRatioMenu.classList.contains('hidden')
          || !ui.els.imageGenStyleMenu.classList.contains('hidden')
          || !ui.els.imageGenTemplateMenu.classList.contains('hidden')) {
          ui.closeImageGenMenus();
          return;
        }
        if (ui.isRenameModalOpen()) {
          ui.closeRenameModal(null);
          return;
        }
        if (ui.isTokenCostWarningOpen()) {
          ui.closeTokenCostWarning();
          return;
        }
        if (ui.isGuideModalOpen()) {
          ui.closeGuide();
          return;
        }
        if (!ui.els.settingsModal.classList.contains('hidden')) {
          closeSettingsModal();
          return;
        }
        if (ui.isImagePreviewOpen()) {
          e.preventDefault();
          ui.closeImagePreview();
          return;
        }
        if (ui.els.app.getAttribute('data-md-preview') === 'open') {
          ui.closeMarkdownPreview();
          return;
        }
        if (ui.isConversationSearchOpen()) {
          if (ui.getConversationSearchQuery()) {
            ui.clearConversationSearch();
          } else {
            ui.toggleConversationSearch(false);
          }
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

    ui.els.closeImagePreviewBtn?.addEventListener('click', () => ui.closeImagePreview());
    ui.els.imagePreviewOverlay?.addEventListener('click', (e) => {
      if (e.target === ui.els.imagePreviewOverlay) ui.closeImagePreview();
    });

    document.addEventListener('click', async (e) => {
      const previewMdBtn = e.target.closest('[data-preview-md]');
      if (previewMdBtn) {
        const block = previewMdBtn.closest('.code-block') || previewMdBtn.closest('pre');
        const code = block?.querySelector('code')?.innerText || '';
        if (code) ui.openMarkdownPreview(code);
        return;
      }
      const previewHtmlBtn = e.target.closest('[data-preview-html]');
      if (previewHtmlBtn) {
        const block = previewHtmlBtn.closest('.code-block') || previewHtmlBtn.closest('pre');
        const code = block?.querySelector('code')?.innerText || '';
        if (code) ui.openHtmlPreview(code);
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
      const previewMsgImg = e.target.closest('.message-preview-image');
      if (previewMsgImg && !e.target.closest('.generated-image-btn')) {
        const src = previewMsgImg.currentSrc || previewMsgImg.src;
        if (src) ui.openImagePreview(src, previewMsgImg.alt || '');
        return;
      }
      const copyGenImgBtn = e.target.closest('[data-copy-generated-image]');
      if (copyGenImgBtn) {
        const img = copyGenImgBtn.closest('.message-generated-image-wrap')?.querySelector('img');
        const src = img?.currentSrc || img?.src;
        if (src && await copyImageToClipboard(src)) ui.showToast(t('toastCopyImageOk'));
        else ui.showToast(t('toastCopyImageFail'));
        return;
      }
      const downloadGenImgBtn = e.target.closest('[data-download-generated-image]');
      if (downloadGenImgBtn) {
        const img = downloadGenImgBtn.closest('.message-generated-image-wrap')?.querySelector('img');
        const src = img?.currentSrc || img?.src;
        const name = img?.alt || 'hinh-ai';
        if (src) {
          try {
            await downloadDataUrlImage(src, name);
            ui.showToast(t('toastDownloadImageOk'));
          } catch {
            ui.showToast(t('toastDownloadImageFail'));
          }
        }
        return;
      }
      const copyBtn = e.target.closest('[data-copy-code]');
      if (copyBtn) {
        const mermaidBlock = copyBtn.closest('.mermaid-block');
        const code = mermaidBlock
          ? window.Markdown.getMermaidSource(mermaidBlock)
          : ((copyBtn.closest('.code-block') || copyBtn.closest('pre'))?.querySelector('code')?.innerText || '');
        if (await copyToClipboard(code)) ui.showToast(t('toastCopyCode'));
        return;
      }
      const copyTableBtn = e.target.closest('[data-copy-table]');
      if (copyTableBtn) {
        const table = copyTableBtn.closest('.table-block')?.querySelector('table');
        if (table && await copyToClipboard(window.Markdown.tableToMarkdown(table))) {
          ui.showToast(t('toastCopyTable'));
        }
        return;
      }
      const msgCopy = e.target.closest('[data-action="copy"]');
      if (msgCopy) {
        const msg = msgCopy.closest('.message');
        const txt = msg?.querySelector('.content')?.innerText || '';
        if (await copyToClipboard(txt)) ui.showToast(t('toastCopyMessage'));
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
      const exportToggle = e.target.closest('[data-action="export-toggle"]');
      if (exportToggle) {
        if (window.API.isStreaming()) return;
        e.stopPropagation();
        const wrap = exportToggle.closest('.msg-export-wrap');
        const menu = wrap?.querySelector('.msg-export-menu');
        if (!menu) return;
        const isOpen = !menu.classList.contains('hidden');
        ui.closeAllMsgExportMenus();
        if (!isOpen) {
          menu.classList.remove('hidden');
          exportToggle.setAttribute('aria-expanded', 'true');
        }
        return;
      }
      const exportOption = e.target.closest('[data-export-format]');
      if (exportOption) {
        if (window.API.isStreaming()) return;
        e.stopPropagation();
        ui.closeAllMsgExportMenus();
        const msgEl = exportOption.closest('.message');
        const idx = parseInt(msgEl?.dataset.idx, 10);
        if (isNaN(idx)) return;
        const format = exportOption.dataset.exportFormat;
        if (format === 'md') exportSingleMessageMarkdown(idx);
        else if (format === 'txt') exportSingleMessageTxt(idx);
        else if (format === 'pdf') exportSingleMessagePdf(idx);
        else if (format === 'docx') exportSingleMessageDocx(idx);
        else if (format === 'image') exportSingleMessageImages(idx);
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
        if (!confirm(t('confirmDeleteMsg'))) return;
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
