window.ContextCompress = (() => {
  const { COMPRESS_MIN_MESSAGES, COMPRESS_KEEP_RECENT_MESSAGES, COMPRESS_MAX_TRANSCRIPT_CHARS } = window.APP_CONFIG;

  const getKeepRecent = () => Math.max(0, COMPRESS_KEEP_RECENT_MESSAGES || 0);

  const estimateContextSize = (convo) => {
    const messages = convo?.messages || [];
    let charCount = 0;
    for (const m of messages) {
      if (m.role === 'user') {
        charCount += (m.content || '').length;
        for (const f of m.files || []) charCount += (f.content || '').length + (f.name || '').length;
        charCount += (m.images?.length || 0) * 200;
      } else if (m.role === 'assistant') {
        charCount += (window.Conversations.getAssistantContent(m) || '').length;
      }
    }
    return { messageCount: messages.length, charCount };
  };

  const shouldOfferCompress = (convo) => {
    if (!convo?.messages?.length) return false;
    const { messageCount } = estimateContextSize(convo);
    const keep = getKeepRecent();
    return messageCount >= COMPRESS_MIN_MESSAGES && messageCount > keep;
  };

  const getCompressibleCount = (convo) => {
    const total = convo?.messages?.length || 0;
    const keep = getKeepRecent();
    return Math.max(0, total - keep);
  };

  const formatMessagesForSummary = (messages) => {
    const t = (key) => window.I18n.t(key);
    const parts = [];
    for (const m of messages) {
      if (m.contextSummary) {
        parts.push(t('compressSummaryLabel') + ':\n' + (m.content || ''));
        continue;
      }
      if (m.role === 'user') {
        const chunks = [];
        if (m.content?.trim()) chunks.push(m.content.trim());
        if (m.translateTo) {
          chunks.push('(' + window.APP_CONFIG.getTranslateLabel(m.translateTo) + ')');
        }
        if (m.files?.length) {
          for (const f of m.files) {
            const body = (f.content || '').slice(0, 4000);
            chunks.push('[File: ' + f.name + ']\n' + body);
          }
        }
        if (m.images?.length) {
          chunks.push('[' + m.images.length + ' ' + t('compressImagesAttached') + ']');
        }
        if (chunks.length) parts.push('USER:\n' + chunks.join('\n'));
      } else if (m.role === 'assistant') {
        const text = window.Conversations.getAssistantContent(m);
        if (text?.trim()) parts.push('ASSISTANT:\n' + text.trim());
      }
    }
    return parts.join('\n\n---\n\n');
  };

  const capTranscript = (text) => {
    const max = COMPRESS_MAX_TRANSCRIPT_CHARS || 100000;
    if (text.length <= max) return text;
    const head = Math.floor(max * 0.45);
    const tail = Math.floor(max * 0.45);
    return text.slice(0, head)
      + '\n\n[... ' + window.I18n.t('compressTranscriptTruncated') + ' ...]\n\n'
      + text.slice(-tail);
  };

  const requestSummary = async ({ transcript, modelId, apiKey, locale, convo, onProgress }) => {
    if (window.API.isStreaming()) {
      throw new Error(window.I18n.t('compressBusyStreaming'));
    }
    const tempConvo = {
      messages: [{
        role: 'user',
        content: window.I18n.t('compressSummaryRequest') + '\n\n---\n\n' + transcript,
        ts: Date.now()
      }]
    };
    const systemPrompt = window.I18n.getSystemPromptForMode('contentSummarizer', locale);

    let buffer = '';
    await new Promise((resolve, reject) => {
      window.API.send({
        apiKey,
        model: modelId,
        systemPrompt,
        convo: tempConvo,
        webSearch: false,
        imageGen: false,
        thinking: false,
        reasoningEffort: 'default',
        onToken: (chunk) => {
          buffer += chunk;
          if (typeof onProgress === 'function') onProgress(buffer);
        },
        onUsage: (usage) => {
          if (usage && convo) window.Conversations.addTokenUsage(convo, modelId, usage);
        },
        onDone: () => resolve(),
        onError: reject
      });
    });

    const summary = buffer.trim();
    if (!summary) throw new Error(window.I18n.t('compressSummaryEmpty'));
    return summary;
  };

  const compressConversation = async (convo, { modelId, apiKey, locale, onProgress } = {}) => {
    const keep = getKeepRecent();
    const messages = convo?.messages || [];
    if (messages.length <= keep) {
      throw new Error(window.I18n.t('compressTooShort'));
    }

    const toCompress = messages.slice(0, messages.length - keep);
    const transcript = capTranscript(formatMessagesForSummary(toCompress));
    if (!transcript.trim()) {
      throw new Error(window.I18n.t('compressNothingToSummarize'));
    }

    const summary = await requestSummary({ transcript, modelId, apiKey, locale, convo, onProgress });
    const applied = window.Conversations.compressWithSummary(convo, summary, keep);
    if (!applied) throw new Error(window.I18n.t('compressFailed'));

    return {
      summary,
      removedCount: toCompress.length,
      keptCount: keep,
    };
  };

  return {
    estimateContextSize,
    shouldOfferCompress,
    getCompressibleCount,
    getKeepRecent,
    compressConversation,
  };
})();
