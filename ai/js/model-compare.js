window.ModelCompare = (() => {
  const { COMPARE_MIN_MODELS, COMPARE_MAX_MODELS, MODELS } = window.APP_CONFIG;

  const DEFAULT_PICKS = [
    'gemini-2.5-flash-lite',
    'deepseek-v4-flash',
    'claude-haiku-4-5',
    'gpt-5.4-mini',
    'nvidia-mistral-small-4',
  ];

  const getDefaultModels = (currentModelId) => {
    const valid = new Set(MODELS.map((m) => m.id));
    const picks = [];
    const current = currentModelId || window.APP_CONFIG.DEFAULT_MODEL;
    if (valid.has(current)) picks.push(current);
    for (const id of DEFAULT_PICKS) {
      if (picks.length >= COMPARE_MAX_MODELS) break;
      if (valid.has(id) && !picks.includes(id)) picks.push(id);
    }
    for (const m of MODELS) {
      if (picks.length >= COMPARE_MAX_MODELS) break;
      if (!picks.includes(m.id)) picks.push(m.id);
    }
    while (picks.length < COMPARE_MIN_MODELS) {
      picks.push(picks[0] || MODELS[0]?.id || current);
    }
    return picks.slice(0, COMPARE_MAX_MODELS);
  };

  const normalizeModelList = (models) => {
    const valid = new Set(MODELS.map((m) => m.id));
    const seen = new Set();
    const out = [];
    for (const id of models || []) {
      if (!id || !valid.has(id) || seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
    return out.slice(0, COMPARE_MAX_MODELS);
  };

  const getActiveModels = (state) => normalizeModelList(state?.compareModels);

  const streamOne = (convo, modelId, settings, columnEl, columnData) => new Promise((resolve) => {
    if (!columnEl) {
      resolve({ modelId, text: '', reasoning: '', aborted: false, error: 'Missing compare column' });
      return;
    }

    const contentEl = columnEl.querySelector('.model-compare-col-body');
    const statusEl = columnEl.querySelector('.model-compare-col-status');
    let buffer = '';
    let reasoningBuffer = '';
    let groundingMetadata = null;
    let generatedImages = [];
    let finished = false;

    const isPickable = () => !!(buffer.trim() || generatedImages.length);

    const setStatus = (key, { state = 'done' } = {}) => {
      const statusText = statusEl?.querySelector('.model-compare-status-text');
      if (statusText) statusText.textContent = window.I18n.t(key);
      if (statusEl) {
        statusEl.classList.remove('is-streaming', 'is-done', 'is-error', 'is-warning');
        if (state) statusEl.classList.add('is-' + state);
      }
      columnEl.dataset.status = key;
    };

    const refresh = () => {
      if (columnData) {
        columnData[modelId] = {
          text: buffer,
          reasoning: reasoningBuffer,
          generatedImages: generatedImages.slice(),
          groundingMetadata,
          error: null,
        };
      }
      window.UI.setCompareColumnPickable(columnEl, isPickable());
      window.UI.updateCompareColumnContent(contentEl, buffer, generatedImages, reasoningBuffer, {
        reasoningOpen: !!reasoningBuffer && !buffer,
        groundingMetadata,
      });
    };

    setStatus('compareStatusStreaming', { state: 'streaming' });
    columnEl.classList.add('is-streaming');
    window.UI.setCompareColumnPickable(columnEl, false);

    const finish = (payload) => {
      if (finished) return;
      finished = true;
      columnEl.classList.remove('is-streaming');
      window.UI.setCompareColumnPickable(columnEl, isPickable());
      if (columnData && columnData[modelId]) {
        columnData[modelId].done = true;
        columnData[modelId].error = payload.error || null;
      }
      window.UI.syncComparePickButtons();
      resolve(payload);
    };

    window.API.send({
      allowConcurrent: true,
      apiKey: window.APP_CONFIG.getApiKey(settings, modelId),
      model: modelId,
      systemPrompt: settings.systemPrompt,
      convo,
      webSearch: false,
      imageGen: false,
      thinking: false,
      reasoningEffort: 'default',
      onToken: (delta) => {
        buffer += delta;
        refresh();
        window.UI.syncComparePickButtons();
      },
      onReasoningToken: (delta) => {
        reasoningBuffer += delta;
        refresh();
      },
      onGroundingMetadata: (meta) => {
        groundingMetadata = meta;
        refresh();
      },
      onUsage: (usage) => {
        if (usage) window.Conversations.addTokenUsage(convo, modelId, usage);
      },
      onDone: (info) => {
        if (info?.aborted) {
          setStatus(buffer ? 'compareStatusStopped' : 'compareStatusAborted', { state: 'warning' });
          window.UI.finalizeCompareColumn(columnEl, buffer, {
            generatedImages,
            reasoningContent: reasoningBuffer,
            groundingMetadata,
          });
          finish({
            modelId,
            text: buffer,
            reasoning: reasoningBuffer,
            aborted: true,
            error: null,
          });
          return;
        }
        if (!buffer && !generatedImages.length) {
          setStatus('compareStatusEmpty', { state: 'warning' });
        } else {
          setStatus('compareStatusDone', { state: 'done' });
        }
        window.UI.finalizeCompareColumn(columnEl, buffer, {
          generatedImages,
          reasoningContent: reasoningBuffer,
          groundingMetadata,
        });
        finish({
          modelId,
          text: buffer,
          reasoning: reasoningBuffer,
          aborted: false,
          error: null,
        });
      },
      onError: (err) => {
        setStatus('compareStatusError', { state: 'error' });
        columnEl.classList.add('has-error');
        const errEl = columnEl.querySelector('.model-compare-col-error');
        const errMsg = err.message || String(err);
        if (errEl) errEl.textContent = errMsg;
        if (columnData) {
          columnData[modelId] = {
            text: buffer,
            reasoning: reasoningBuffer,
            generatedImages: generatedImages.slice(),
            groundingMetadata,
            error: errMsg,
            done: true,
          };
        }
        window.UI.setCompareColumnPickable(columnEl, isPickable());
        finish({
          modelId,
          text: buffer,
          reasoning: reasoningBuffer,
          aborted: false,
          error: err.message || String(err),
        });
      },
    });
  });

  const run = async ({ convo, modelIds, question, settings, columnData } = {}) => {
    const ids = normalizeModelList(modelIds);
    if (ids.length < COMPARE_MIN_MODELS) {
      throw new Error(window.I18n.t('compareNeedModels'));
    }

    for (const id of ids) {
      if (!window.APP_CONFIG.hasApiKey(settings, id)) {
        throw new Error(window.APP_CONFIG.getMissingApiKeyMessage(id));
      }
    }

    window.UI.openModelCompareOverlay(question, ids);
    window.UI.setStreaming(true);

    const columns = window.UI.getModelCompareColumns();
    const results = await Promise.all(ids.map((modelId, i) => streamOne(convo, modelId, settings, columns[i], columnData)));

    window.UI.setStreaming(false);
    window.UI.syncComparePickButtons();

    return results;
  };

  return {
    getDefaultModels,
    normalizeModelList,
    getActiveModels,
    run,
    COMPARE_MIN_MODELS,
    COMPARE_MAX_MODELS,
  };
})();
