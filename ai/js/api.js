window.API = (() => {
  const { OPENAI_ENDPOINT, RESPONSES_ENDPOINT, ANTHROPIC_ENDPOINT, ANTHROPIC_VERSION, DEEPSEEK_ENDPOINT, NVIDIA_ENDPOINT, KIMI_ENDPOINT } = window.APP_CONFIG;
  const activeControllers = new Set();
  const isStreaming = () => activeControllers.size > 0;

  const appendFilesToText = (text, files) => {
    if (!files || !files.length) return text || '';
    const blocks = files.map((f) => window.Files.formatFileMarkdown(f)).join('\n\n');
    return text ? text + '\n\n' + blocks : blocks;
  };

  const appendTranslateInstruction = (text, m) => {
    if (!m.translateTo) return text || '';
    const lang = window.APP_CONFIG.getTranslateLanguage(m.translateTo);
    const instruction = 'Dịch sang ' + lang.label + '. Chỉ trả về bản dịch, không thêm giải thích hay nội dung khác.';
    const userText = text || '';
    return userText ? instruction + '\n\n' + userText : instruction;
  };

  const appendSlidesInstruction = (text, m) => {
    if (!m.slides || !window.PptxExport) return text || '';
    return window.PptxExport.appendSlidesInstruction(text, m);
  };

  const appendExcelInstruction = (text, m) => {
    if (!m.excel || !window.XlsxExport) return text || '';
    return window.XlsxExport.appendExcelInstruction(text, m);
  };

  const appendDocumentInstruction = (text, m) => {
    if (!m.document || !window.DocxCreate) return text || '';
    return window.DocxCreate.appendDocumentInstruction(text, m);
  };

  const appendPdfInstruction = (text, m) => {
    if (!m.pdf || !window.PdfCreate) return text || '';
    return window.PdfCreate.appendPdfInstruction(text, m);
  };

  const appendUserInstructions = (text, m) => {
    let result = appendTranslateInstruction(text, m);
    result = appendSlidesInstruction(result, m);
    result = appendExcelInstruction(result, m);
    result = appendDocumentInstruction(result, m);
    result = appendPdfInstruction(result, m);
    return result;
  };

  const parseDataUrl = (dataUrl) => {
    if (!dataUrl) return null;
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    return { media_type: match[1], data: match[2] };
  };

  const buildAnthropicMessageContent = (m) => {
    const images = m.images || [];
    let text = appendFilesToText(m.content || '', m.files);
    if (m.role === 'user') {
      text = appendUserInstructions(text, m);
    }

    if (m.role === 'user' && images.length > 0) {
      const blocks = [];
      if (text.trim()) blocks.push({ type: 'text', text });
      for (const img of images) {
        const parsed = parseDataUrl(img.dataUrl);
        if (parsed) {
          blocks.push({
            type: 'image',
            source: { type: 'base64', media_type: parsed.media_type, data: parsed.data }
          });
        }
      }
      return blocks.length ? blocks : (text || '');
    }
    return text;
  };

  const buildAnthropicMessages = (convo) => {
    const msgs = [];
    const all = convo.messages || [];
    for (let i = 0; i < all.length; i++) {
      const m = all[i];
      if (m.role !== 'user' && m.role !== 'assistant') continue;
      if (i === all.length - 1 && m.role === 'assistant' && !m.content) continue;
      msgs.push({ role: m.role, content: buildAnthropicMessageContent(m) });
    }
    return msgs;
  };

  const buildGeminiParts = (m) => {
    const images = m.images || [];
    let text = appendFilesToText(m.content || '', m.files);
    if (m.role === 'user') {
      text = appendUserInstructions(text, m);
      if (m.imageGen) {
        text = window.APP_CONFIG.buildImageGenPrompt(text, {
          ratioId: m.imageGen.ratio,
          styleId: m.imageGen.style,
          templateId: m.imageGen.template
        });
      }
    }

    if (m.role === 'user' && images.length > 0) {
      const parts = [];
      if (text.trim()) parts.push({ text });
      for (const img of images) {
        const parsed = parseDataUrl(img.dataUrl);
        if (parsed) {
          parts.push({
            inlineData: { mimeType: parsed.media_type, data: parsed.data }
          });
        }
      }
      return parts.length ? parts : [{ text: text || '' }];
    }
    return [{ text: text || '' }];
  };

  const buildGeminiContents = (convo) => {
    const contents = [];
    const all = convo.messages || [];
    for (let i = 0; i < all.length; i++) {
      const m = all[i];
      if (m.role !== 'user' && m.role !== 'assistant') continue;
      if (i === all.length - 1 && m.role === 'assistant' && !m.content) continue;
      contents.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: buildGeminiParts(m)
      });
    }
    return contents;
  };

  const buildMessageContent = (m, format = 'chat') => {
    const images = m.images || [];
    let text = appendFilesToText(m.content || '', m.files);
    if (m.role === 'user') {
      text = appendUserInstructions(text, m);
      if (m.imageGen) {
        text = window.APP_CONFIG.buildImageGenPrompt(text, {
          ratioId: m.imageGen.ratio,
          styleId: m.imageGen.style,
          templateId: m.imageGen.template
        });
      }
    }
    const isResponses = format === 'responses';

    if (m.role === 'user' && images.length > 0) {
      const parts = [];
      if (text.trim()) {
        parts.push(isResponses
          ? { type: 'input_text', text }
          : { type: 'text', text });
      }
      for (const img of images) {
        if (img.dataUrl) {
          parts.push(isResponses
            ? { type: 'input_image', image_url: img.dataUrl, detail: 'auto' }
            : { type: 'image_url', image_url: { url: img.dataUrl, detail: 'auto' } });
        }
      }
      return parts.length ? parts : (text || '');
    }
    return text;
  };

  const buildConversationMessages = (convo, format = 'chat') => {
    const msgs = [];
    const all = convo.messages || [];
    for (let i = 0; i < all.length; i++) {
      const m = all[i];
      if (m.role !== 'user' && m.role !== 'assistant') continue;
      if (i === all.length - 1 && m.role === 'assistant' && !m.content) continue;
      msgs.push({ role: m.role, content: buildMessageContent(m, format) });
    }
    return msgs;
  };

  const buildMessages = (convo, systemPrompt) => {
    const msgs = [];
    if (systemPrompt && systemPrompt.trim()) {
      msgs.push({ role: 'system', content: systemPrompt });
    }
    return msgs.concat(buildConversationMessages(convo));
  };

  const buildAnthropicTools = ({ webSearch }) => {
    const tools = [];
    if (webSearch) {
      tools.push({ type: 'web_search_20250305', name: 'web_search' });
    }
    return tools;
  };

  const buildResponsesTools = ({ webSearch, imageGen, imageGenOptions }) => {
    const tools = [];
    if (webSearch) {
      tools.push({
        type: 'web_search',
        search_context_size: window.APP_CONFIG.SEARCH_CONTEXT_SIZE || 'high'
      });
    }
    if (imageGen) {
      const tool = { type: 'image_generation' };
      if (imageGenOptions?.size) tool.size = imageGenOptions.size;
      if (imageGenOptions?.action) tool.action = imageGenOptions.action;
      tools.push(tool);
    }
    return tools;
  };

  const normalizeByteplusResponsesInput = (input) => input.map((msg) => {
    if (msg.role !== 'user' || typeof msg.content !== 'string' || !msg.content) return msg;
    return {
      role: msg.role,
      content: [{ type: 'input_text', text: msg.content }]
    };
  });

  const mergeGroundingMetadata = (prev, next) => {
    if (!next) return prev;
    if (!prev) return { ...next };
    const merged = { ...prev, ...next };
    if (next.groundingChunks?.length) {
      const seen = new Set((prev.groundingChunks || []).map((c) => c.web?.uri).filter(Boolean));
      merged.groundingChunks = [...(prev.groundingChunks || [])];
      for (const chunk of next.groundingChunks) {
        const uri = chunk.web?.uri;
        if (!uri || !seen.has(uri)) {
          merged.groundingChunks.push(chunk);
          if (uri) seen.add(uri);
        }
      }
    }
    if (next.webSearchQueries?.length) {
      const qs = new Set(prev.webSearchQueries || []);
      next.webSearchQueries.forEach((q) => qs.add(q));
      merged.webSearchQueries = [...qs];
    }
    return merged;
  };

  const toGeminiInlineDataUrl = (inlineData) => {
    if (!inlineData?.data) return '';
    const mime = inlineData.mimeType || 'image/png';
    return 'data:' + mime + ';base64,' + inlineData.data;
  };

  const toImageDataUrl = (b64) => {
    if (!b64) return '';
    if (b64.startsWith('data:')) return b64;
    return 'data:image/png;base64,' + b64;
  };

  const toImageDataUrlFromB64 = (b64, mediaType) => {
    if (!b64) return '';
    if (b64.startsWith('data:')) return b64;
    const mime = mediaType || 'image/png';
    return 'data:' + mime + ';base64,' + b64;
  };

  const getOpenRouterImagePromptFromConvo = (convo) => {
    const users = (convo.messages || []).filter((m) => m.role === 'user');
    const last = users[users.length - 1];
    if (!last) return { prompt: '', images: [] };
    const prompt = (last.content || '').trim();
    const images = (last.images || []).filter((img) => img?.dataUrl);
    return { prompt, images };
  };

  const parseApiError = async (res, provider = 'openai') => {
    let errMsg = 'HTTP ' + res.status;
    try {
      const errJson = await res.json();
      if (provider === 'anthropic' && errJson.error) {
        errMsg = errJson.error.message || JSON.stringify(errJson.error);
      } else if (provider === 'google' && errJson.error) {
        errMsg = errJson.error.message || JSON.stringify(errJson.error);
      } else if (provider === 'nvidia') {
        errMsg = errJson.detail || errJson.error?.message || errJson.title || errMsg;
      } else if (provider === 'openrouter') {
        const meta = errJson.error?.metadata;
        errMsg = meta?.raw || meta?.message || errJson.error?.message || errMsg;
      } else if (provider === 'opencode-go') {
        errMsg = errJson.error?.message || errJson.error?.type || errMsg;
      } else if (provider === 'perplexity') {
        errMsg = errJson.error?.message || errJson.detail || errMsg;
      } else {
        errMsg = errJson.error ? errJson.error.message || JSON.stringify(errJson.error) : errMsg;
      }
    } catch {
      try { errMsg = await res.text() || errMsg; } catch {}
    }
    return new Error(errMsg);
  };

  const emptyUsage = () => ({ prompt: 0, completion: 0, total: 0 });

  const mergeUsageDelta = (acc, delta) => {
    if (!delta) return acc || emptyUsage();
    const hasPrompt = (delta.prompt || 0) > 0;
    const hasCompletion = (delta.completion || 0) > 0;
    if (hasPrompt && hasCompletion) {
      const prompt = delta.prompt || 0;
      const completion = delta.completion || 0;
      return {
        prompt,
        completion,
        total: delta.total || (prompt + completion)
      };
    }
    const next = acc ? { ...acc } : emptyUsage();
    next.prompt += delta.prompt || 0;
    next.completion += delta.completion || 0;
    next.total = next.prompt + next.completion;
    if (delta.total && delta.total > next.total) next.total = delta.total;
    return next;
  };

  const extractUsage = (json) => {
    if (!json || typeof json !== 'object') return null;
    if (json.usage) {
      const u = json.usage;
      const prompt = u.prompt_tokens ?? u.input_tokens ?? 0;
      const completion = u.completion_tokens ?? u.output_tokens ?? 0;
      const total = u.total_tokens ?? (prompt + completion);
      if (!prompt && !completion && !total) return null;
      return { prompt, completion, total };
    }
    if (json.type === 'message_start' && json.message?.usage) {
      const prompt = json.message.usage.input_tokens ?? 0;
      if (!prompt) return null;
      return { prompt, completion: 0, total: prompt };
    }
    if (json.type === 'message_delta' && json.usage) {
      const completion = json.usage.output_tokens ?? 0;
      if (!completion) return null;
      return { prompt: 0, completion, total: completion };
    }
    if (json.usageMetadata) {
      const u = json.usageMetadata;
      const prompt = u.promptTokenCount ?? 0;
      const thoughts = u.thoughtsTokenCount ?? 0;
      const completion = (u.candidatesTokenCount ?? 0) + thoughts;
      const total = u.totalTokenCount ?? (prompt + completion);
      if (!prompt && !completion && !total) return null;
      return { prompt, completion, total };
    }
    if (json.type === 'response.completed' && json.response?.usage) {
      const u = json.response.usage;
      const prompt = u.input_tokens ?? 0;
      const completion = u.output_tokens ?? 0;
      const total = u.total_tokens ?? (prompt + completion);
      if (!prompt && !completion && !total) return null;
      return { prompt, completion, total };
    }
    return null;
  };

  const emitUsage = (handlers, usage) => {
    if (!usage || !handlers.onUsage) return;
    handlers.onUsage(usage);
  };

  const handleStreamData = (data, handlers) => {
    if (!data || data === '[DONE]') {
      return data === '[DONE]' ? 'done' : null;
    }
    try {
      const json = JSON.parse(data);
      emitUsage(handlers, extractUsage(json));
      if (json.type === 'response.output_text.delta' && json.delta) {
        if (handlers.onToken) handlers.onToken(json.delta);
        return null;
      }
      if (json.type === 'response.reasoning_summary_text.delta' && json.delta) {
        if (handlers.onReasoningToken) handlers.onReasoningToken(json.delta);
        return null;
      }
      if (json.type === 'response.reasoning_text.delta' && json.delta) {
        if (handlers.onReasoningToken) handlers.onReasoningToken(json.delta);
        return null;
      }
      if (json.type === 'response.web_search_call.in_progress'
        || json.type === 'response.web_search_call.searching') {
        if (handlers.onSearchStatus) handlers.onSearchStatus('searching');
        return null;
      }
      if (json.type === 'response.image_generation_call.in_progress'
        || json.type === 'response.image_generation_call.generating') {
        if (handlers.onImageStatus) handlers.onImageStatus('generating');
        return null;
      }
      if (json.type === 'response.image_generation_call.partial_image' && json.partial_image_b64) {
        if (handlers.onImagePartial) {
          handlers.onImagePartial({
            dataUrl: toImageDataUrl(json.partial_image_b64),
            index: json.partial_image_index ?? 0,
            partial: true
          });
        }
        return null;
      }
      if (json.type === 'response.image_generation_call.completed') {
        if (handlers.onImageStatus) handlers.onImageStatus('completed');
        const result = json.result || json.item?.result;
        if (result && handlers.onImageComplete) {
          handlers.onImageComplete({ dataUrl: toImageDataUrl(result) });
        }
        return null;
      }
      if (json.type === 'response.output_item.done' && json.item?.type === 'image_generation_call') {
        const result = json.item.result;
        if (result && handlers.onImageComplete) {
          handlers.onImageComplete({ dataUrl: toImageDataUrl(result) });
        }
        return null;
      }
      if (json.type === 'error' || json.type === 'response.failed') {
        const msg = json.message || (json.error && json.error.message) || 'API error';
        throw new Error(msg);
      }
      if (json.type === 'content_block_start' && json.content_block) {
        const block = json.content_block;
        if (block.type === 'server_tool_use' && block.name === 'web_search') {
          if (handlers.onSearchStatus) handlers.onSearchStatus('searching');
          return null;
        }
      }
      if (json.type === 'content_block_delta' && json.delta) {
        if (json.delta.type === 'thinking_delta' && json.delta.thinking) {
          if (handlers.onReasoningToken) handlers.onReasoningToken(json.delta.thinking);
          return null;
        }
        if (json.delta.text) {
          if (handlers.onToken) handlers.onToken(json.delta.text);
          return null;
        }
      }
      if (json.candidates && json.candidates[0]) {
        const candidate = json.candidates[0];
        const queries = candidate.groundingMetadata?.webSearchQueries;
        if (queries?.length && handlers.onSearchStatus) {
          handlers.onSearchStatus('searching');
        }
        if (candidate.groundingMetadata && handlers.onGroundingMetadata) {
          handlers.onGroundingMetadata(candidate.groundingMetadata);
        }
        const parts = candidate.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            const dataUrl = toGeminiInlineDataUrl(part.inlineData);
            if (dataUrl && handlers.onImageComplete) {
              handlers.onImageComplete({ dataUrl });
            }
            continue;
          }
          if (!part.text) continue;
          if (part.thought) {
            if (handlers.onReasoningToken) handlers.onReasoningToken(part.text);
          } else if (handlers.onToken) {
            handlers.onToken(part.text);
          }
        }
        return null;
      }
      const delta = json.choices && json.choices[0] && json.choices[0].delta;
      if (delta) {
        if (delta.reasoning_content) {
          if (handlers.onReasoningToken) handlers.onReasoningToken(delta.reasoning_content);
        } else if (delta.reasoning) {
          if (handlers.onReasoningToken) handlers.onReasoningToken(delta.reasoning);
        } else if (Array.isArray(delta.reasoning_details)) {
          for (const detail of delta.reasoning_details) {
            if (detail?.type === 'reasoning.text' && detail.text && handlers.onReasoningToken) {
              handlers.onReasoningToken(detail.text);
            }
          }
        }
        if (delta.content) {
          if (handlers.onToken) handlers.onToken(delta.content);
        }
      }
      if (json.search_results?.length && handlers.onGroundingMetadata) {
        handlers.onGroundingMetadata({
          groundingChunks: json.search_results.map((r) => ({
            web: { uri: r.url, title: r.title || r.url }
          }))
        });
      } else if (json.citations?.length && handlers.onGroundingMetadata) {
        handlers.onGroundingMetadata({
          groundingChunks: json.citations.map((url) => ({
            web: { uri: url, title: url }
          }))
        });
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        console.warn('SSE parse failed:', data, e);
        return null;
      }
      throw e;
    }
    return null;
  };

  const readSseStream = async (reader, handlers) => {
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    const flushLine = (line) => {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) return null;
      return handleStreamData(trimmed.slice(5).trim(), handlers);
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sep;
      while ((sep = buffer.indexOf('\n\n')) >= 0) {
        const block = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        for (const line of block.split('\n')) {
          if (flushLine(line) === 'done') return;
        }
      }

      let idx;
      while ((idx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        if (flushLine(line) === 'done') return;
      }
    }

    if (buffer.trim()) {
      for (const line of buffer.split('\n')) {
        if (flushLine(line) === 'done') return;
      }
    }
  };

  const appendImagesAsTextNote = (text, images) => {
    if (!images?.length) return text || '';
    const note = images.map((img, i) => img.name || ('Hình ảnh ' + (i + 1))).join(', ');
    const suffix = '\n\n_[' + images.length + ' hình ảnh đính kèm: ' + note + ' — DeepSeek không hỗ trợ phân tích hình ảnh]_';
    return text ? text + suffix : suffix.trim();
  };

  const buildDeepseekMessageContent = (m) => {
    let text = appendFilesToText(m.content || '', m.files);
    if (m.role === 'user') {
      text = appendUserInstructions(text, m);
    }
    return appendImagesAsTextNote(text, m.images);
  };

  const buildDeepseekMessages = (convo, systemPrompt) => {
    const msgs = [];
    if (systemPrompt && systemPrompt.trim()) {
      msgs.push({ role: 'system', content: systemPrompt });
    }
    const all = convo.messages || [];
    for (let i = 0; i < all.length; i++) {
      const m = all[i];
      if (m.role !== 'user' && m.role !== 'assistant') continue;
      if (i === all.length - 1 && m.role === 'assistant' && !m.content) continue;
      msgs.push({ role: m.role, content: buildDeepseekMessageContent(m) });
    }
    return msgs;
  };

  const withStreamUsage = (body) => {
    body.stream_options = { include_usage: true };
    return body;
  };

  const buildDeepseekBody = (model, systemPrompt, convo, thinking, reasoningEffort) => {
    const cfg = window.APP_CONFIG.getDeepSeekThinkingConfig(reasoningEffort, thinking);
    const body = withStreamUsage({
      model,
      messages: buildDeepseekMessages(convo, systemPrompt),
      stream: true,
      thinking: { type: cfg.thinking ? 'enabled' : 'disabled' }
    });
    if (cfg.reasoning_effort) {
      body.reasoning_effort = cfg.reasoning_effort;
    }
    const maxOutputTokens = window.APP_CONFIG.getMaxOutputTokens(model);
    if (maxOutputTokens) {
      body.max_tokens = maxOutputTokens;
    }
    return body;
  };

  const buildByteplusBody = (model, systemPrompt, convo, thinking, reasoningEffort) => {
    const apiModel = window.APP_CONFIG.getApiModel(model);
    const body = withStreamUsage({
      model: apiModel,
      messages: buildDeepseekMessages(convo, systemPrompt),
      stream: true
    });
    const maxOutputTokens = window.APP_CONFIG.getMaxOutputTokens(model);

    if (window.APP_CONFIG.modelUsesByteplusOpenAIReasoning(model)) {
      if (thinking) {
        body.reasoning_effort = window.APP_CONFIG.normalizeEffortForModel(
          reasoningEffort || window.APP_CONFIG.DEFAULT_EFFORT,
          model
        );
      }
      if (maxOutputTokens) {
        body.max_completion_tokens = maxOutputTokens;
      }
      return body;
    }

    const cfg = window.APP_CONFIG.getDeepSeekThinkingConfig(reasoningEffort, thinking);
    body.thinking = { type: cfg.thinking ? 'enabled' : 'disabled' };
    if (cfg.reasoning_effort) {
      body.reasoning_effort = cfg.reasoning_effort;
    }
    if (maxOutputTokens) {
      body.max_tokens = maxOutputTokens;
    }
    return body;
  };

  const buildNvidiaBody = (model, systemPrompt, convo, thinking, reasoningEffort) => {
    const body = {
      model: window.APP_CONFIG.getApiModel(model),
      messages: buildMessages(convo, systemPrompt),
      stream: true
    };
    if (window.APP_CONFIG.modelUsesGptOssReasoning(model)) {
      if (thinking) {
        body.reasoning_effort = window.APP_CONFIG.normalizeEffortForModel(
          reasoningEffort || window.APP_CONFIG.getDefaultEffortForModel(model),
          model
        );
      }
      const maxOutputTokens = window.APP_CONFIG.getMaxOutputTokens(model);
      if (maxOutputTokens) {
        body.max_tokens = maxOutputTokens;
      }
      return body;
    }
    if (window.APP_CONFIG.modelUsesNvidiaDeepSeekChatTemplate(model)) {
      body.chat_template_kwargs = { thinking: !!thinking };
    } else if (window.APP_CONFIG.modelUsesNvidiaEnableThinkingTemplate(model)) {
      body.chat_template_kwargs = { enable_thinking: !!thinking };
    } else if (window.APP_CONFIG.modelUsesNemotronReasoning(model)) {
      if (window.APP_CONFIG.modelUsesNemotronBudgetReasoning(model)) {
        if (!thinking) {
          body.chat_template_kwargs = { enable_thinking: false };
        } else {
          body.reasoning_budget = window.APP_CONFIG.getNemotronReasoningBudget(model);
          body.chat_template_kwargs = { enable_thinking: true };
        }
      } else {
        const effort = thinking
          ? window.APP_CONFIG.normalizeNemotronEffort(reasoningEffort)
          : 'default';
        if (effort === 'default') {
          body.reasoning_effort = 'none';
          body.chat_template_kwargs = { enable_thinking: false };
        } else if (effort === 'medium') {
          body.reasoning_effort = 'medium';
          body.chat_template_kwargs = { enable_thinking: true, medium_effort: true };
        } else {
          body.reasoning_effort = 'high';
          body.chat_template_kwargs = { enable_thinking: true };
        }
      }
    } else if (window.APP_CONFIG.modelUsesNvidiaStepModel(model)) {
      // Step trả reasoning_content mà không cần reasoning_effort.
    } else if (!thinking) {
      // Bỏ qua reasoning_effort — endpoint Step/Mistral và nhiều model NVIDIA khác từ chối 'none'.
    } else if (window.APP_CONFIG.modelUsesNvidiaLmReasoningEffort(model)) {
      body.reasoning_effort = window.APP_CONFIG.normalizeNvidiaLmReasoningEffort(reasoningEffort, model);
    } else {
      const effort = window.APP_CONFIG.normalizeDeepSeekEffort(reasoningEffort);
      body.reasoning_effort = effort === 'max' ? 'max' : 'high';
    }
    const maxOutputTokens = window.APP_CONFIG.getMaxOutputTokens(model);
    if (maxOutputTokens) {
      body.max_tokens = maxOutputTokens;
    }
    return body;
  };

  const buildKimiMessages = (convo, systemPrompt, modelId) => {
    const msgs = [];
    if (systemPrompt && systemPrompt.trim()) {
      msgs.push({ role: 'system', content: systemPrompt });
    }
    const preserved = window.APP_CONFIG.kimiRequiresPreservedThinking(modelId);
    const all = convo.messages || [];
    for (let i = 0; i < all.length; i++) {
      const m = all[i];
      if (m.role !== 'user' && m.role !== 'assistant') continue;
      if (i === all.length - 1 && m.role === 'assistant' && !m.content) continue;
      const msg = { role: m.role, content: buildMessageContent(m) };
      if (preserved && m.role === 'assistant' && m.reasoningContent) {
        msg.reasoning_content = m.reasoningContent;
      }
      msgs.push(msg);
    }
    return msgs;
  };

  const buildKimiBody = (model, systemPrompt, convo, thinking) => {
    const body = withStreamUsage({
      model,
      messages: buildKimiMessages(convo, systemPrompt, model),
      stream: true,
      thinking: window.APP_CONFIG.getKimiThinkingConfig(model, thinking)
    });
    const maxOutputTokens = window.APP_CONFIG.getMaxOutputTokens(model);
    if (maxOutputTokens) {
      body.max_tokens = maxOutputTokens;
    }
    return body;
  };

  const buildOpenAIChatBody = (model, systemPrompt, convo, thinking, reasoningEffort) => {
    const body = withStreamUsage({
      model,
      messages: buildMessages(convo, systemPrompt),
      stream: true
    });
    const maxOutputTokens = window.APP_CONFIG.getMaxOutputTokens(model);
    if (maxOutputTokens) {
      body.max_completion_tokens = maxOutputTokens;
    }
    if (thinking) {
      const effort = window.APP_CONFIG.normalizeEffortForModel(
        reasoningEffort || window.APP_CONFIG.DEFAULT_EFFORT,
        model
      );
      body.reasoning_effort = effort;
    }
    return body;
  };

  const buildOpenRouterBody = (model, systemPrompt, convo, thinking, reasoningEffort) => {
    const body = {
      model: window.APP_CONFIG.getApiModel(model),
      messages: buildMessages(convo, systemPrompt),
      stream: true
    };
    const maxOutputTokens = window.APP_CONFIG.getMaxOutputTokens(model);
    if (maxOutputTokens) {
      body.max_tokens = maxOutputTokens;
    }
    const reasoning = window.APP_CONFIG.getOpenRouterThinkingConfig(model, thinking, reasoningEffort);
    if (reasoning) {
      body.reasoning = reasoning;
    }
    return body;
  };

  const buildOpencodeGoBody = (model, systemPrompt, convo, thinking, reasoningEffort) => {
    const body = {
      model: window.APP_CONFIG.getApiModel(model),
      messages: buildMessages(convo, systemPrompt),
      stream: true
    };
    const maxOutputTokens = window.APP_CONFIG.getMaxOutputTokens(model);
    if (maxOutputTokens) {
      body.max_tokens = maxOutputTokens;
    }
    const reasoning = window.APP_CONFIG.getOpencodeGoThinkingConfig(model, thinking, reasoningEffort);
    if (reasoning) {
      body.reasoning = reasoning;
    }
    return body;
  };

  const buildPerplexityBody = (model, systemPrompt, convo) => {
    const body = withStreamUsage({
      model: window.APP_CONFIG.getApiModel(model),
      messages: buildMessages(convo, systemPrompt),
      stream: true,
      search_context_size: window.APP_CONFIG.getPerplexitySearchContextSize()
    });
    const maxOutputTokens = window.APP_CONFIG.getMaxOutputTokens(model);
    if (maxOutputTokens) {
      body.max_tokens = maxOutputTokens;
    }
    return body;
  };

  const getPerplexitySearchQueryFromConvo = (convo) => {
    const users = (convo.messages || []).filter((m) => m.role === 'user');
    const last = users[users.length - 1];
    if (!last) return '';
    let text = appendFilesToText(last.content || '', last.files);
    text = appendUserInstructions(text, last);
    return text.trim();
  };

  const formatPerplexitySearchResult = (item, index) => {
    const title = item.title || item.url || ('Kết quả ' + (index + 1));
    const snippet = (item.snippet || '').trim();
    const url = item.url || '';
    const meta = [item.date, item.last_updated].filter(Boolean).join(' · ');
    let block = '### ' + (index + 1) + '. ' + title;
    if (meta) block += '\n_' + meta + '_';
    if (snippet) block += '\n\n' + snippet;
    if (url) block += '\n\n' + url;
    return block;
  };

  const sleep = (ms, signal) => new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });

  const emitSimulatedStream = async (text, handlers, signal, { chunkSize = 28, delayMs = 14 } = {}) => {
    if (!handlers.onToken || !text) return;
    for (let i = 0; i < text.length; i += chunkSize) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      handlers.onToken(text.slice(i, i + chunkSize));
      if (i + chunkSize < text.length) await sleep(delayMs, signal);
    }
  };

  const emitPerplexitySearchStream = async (results, handlers, signal) => {
    if (!results.length) {
      await emitSimulatedStream('Không tìm thấy kết quả.', handlers, signal);
      return;
    }
    for (let i = 0; i < results.length; i++) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const block = formatPerplexitySearchResult(results[i], i);
      const chunk = (i === 0 ? '' : '\n\n') + block;
      await emitSimulatedStream(chunk, handlers, signal, { chunkSize: 32, delayMs: 12 });
      if (i < results.length - 1) await sleep(80, signal);
    }
  };

  const toPerplexitySearchGrounding = (results) => ({
    groundingChunks: (results || []).map((r) => ({
      web: { uri: r.url, title: r.title || r.url }
    }))
  });

  const sendPerplexitySearch = async ({ apiKey, convo, controller, handlers, endpoint }) => {
    const query = getPerplexitySearchQueryFromConvo(convo);
    if (!query) {
      throw new Error('Không có truy vấn tìm kiếm');
    }

    if (handlers.onSearchStatus) handlers.onSearchStatus('searching');

    const body = {
      query: [query],
      max_results: 10,
      search_context_size: window.APP_CONFIG.getPerplexitySearchContextSize()
    };

    const res = await fetch(endpoint || window.APP_CONFIG.PERPLEXITY_SEARCH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!res.ok) throw await parseApiError(res, 'perplexity');

    const json = await res.json();
    const results = json.results || [];
    if (handlers.onGroundingMetadata) {
      handlers.onGroundingMetadata(toPerplexitySearchGrounding(results));
    }
    await emitPerplexitySearchStream(results, handlers, controller.signal);
  };

  const sendOpenRouterImages = async ({ apiKey, model, convo, controller, handlers, imageGenOptions }) => {
    const { prompt, images } = getOpenRouterImagePromptFromConvo(convo);
    if (!prompt) {
      throw new Error('Không có mô tả ảnh để tạo');
    }

    const body = {
      model: window.APP_CONFIG.getApiModel(model),
      prompt
    };
    if (imageGenOptions?.aspectRatio && window.APP_CONFIG.openRouterImagesSupportsAspectRatio(model)) {
      body.aspect_ratio = imageGenOptions.aspectRatio;
    }
    if (images.length) {
      body.input_references = images.map((img) => ({
        image_url: { url: img.dataUrl }
      }));
    }

    if (handlers.onImageStatus) handlers.onImageStatus('generating');

    const res = await fetch(window.APP_CONFIG.getOpenRouterImagesEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!res.ok) throw await parseApiError(res, 'openrouter');

    const json = await res.json();
    emitUsage(handlers, extractUsage(json));

    const items = json.data || [];
    if (!items.length) {
      throw new Error('API không trả về ảnh');
    }

    if (handlers.onImageStatus) handlers.onImageStatus('completed');
    for (const item of items) {
      if (!item?.b64_json) continue;
      const dataUrl = toImageDataUrlFromB64(item.b64_json, item.media_type);
      if (dataUrl && handlers.onImageComplete) {
        handlers.onImageComplete({ dataUrl });
      }
    }
  };

  const sendChatCompletions = async ({ apiKey, model, systemPrompt, convo, controller, handlers, endpoint, provider, thinking, reasoningEffort }) => {
    const body = provider === 'deepseek'
      ? buildDeepseekBody(model, systemPrompt, convo, thinking, reasoningEffort)
      : provider === 'byteplus'
        ? buildByteplusBody(model, systemPrompt, convo, thinking, reasoningEffort)
        : provider === 'nvidia'
          ? buildNvidiaBody(model, systemPrompt, convo, thinking, reasoningEffort)
          : provider === 'openrouter'
            ? buildOpenRouterBody(model, systemPrompt, convo, thinking, reasoningEffort)
          : provider === 'opencode-go'
            ? buildOpencodeGoBody(model, systemPrompt, convo, thinking, reasoningEffort)
          : provider === 'perplexity'
            ? buildPerplexityBody(model, systemPrompt, convo)
          : provider === 'kimi'
            ? buildKimiBody(model, systemPrompt, convo, thinking)
            : buildOpenAIChatBody(model, systemPrompt, convo, thinking, reasoningEffort);

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers.Authorization = 'Bearer ' + apiKey;
    if (provider === 'openrouter') {
      headers['HTTP-Referer'] = window.location.origin || 'https://vutaso.github.io';
      headers['X-Title'] = 'Vutaso AI';
    }

    const res = await fetch(endpoint || OPENAI_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!res.ok) throw await parseApiError(res, provider || 'openai');
    if (!res.body || !res.body.getReader) {
      throw new Error('Trình duyệt không hỗ trợ streaming response');
    }

    await readSseStream(res.body.getReader(), handlers);
  };

  const sendOpencodeGoMessages = async ({ apiKey, model, systemPrompt, convo, thinking, reasoningEffort, controller, handlers, endpoint }) => {
    const messages = buildAnthropicMessages(convo);
    if (!messages.length) {
      throw new Error('Không có tin nhắn để gửi');
    }

    const body = {
      model: window.APP_CONFIG.getApiModel(model),
      messages,
      stream: true
    };
    const maxOutputTokens = window.APP_CONFIG.getMaxOutputTokens(model);
    if (maxOutputTokens) {
      body.max_tokens = maxOutputTokens;
    }
    if (systemPrompt && systemPrompt.trim()) {
      body.system = systemPrompt.trim();
    }
    const reasoning = window.APP_CONFIG.getOpencodeGoThinkingConfig(model, thinking, reasoningEffort);
    if (reasoning) {
      body.reasoning = reasoning;
    }

    const res = await fetch(endpoint || window.APP_CONFIG.OPENCODE_GO_MESSAGES_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!res.ok) throw await parseApiError(res, 'opencode-go');
    if (!res.body || !res.body.getReader) {
      throw new Error('Trình duyệt không hỗ trợ streaming response');
    }

    await readSseStream(res.body.getReader(), handlers);
  };

  const sendAnthropic = async ({ apiKey, model, appModelId, systemPrompt, convo, webSearch, thinking, reasoningEffort, controller, handlers, endpoint }) => {
    const configModelId = appModelId || model;
    const messages = buildAnthropicMessages(convo);
    if (!messages.length) {
      throw new Error('Không có tin nhắn để gửi');
    }

    const body = {
      model,
      messages,
      stream: true
    };
    const maxOutputTokens = window.APP_CONFIG.getMaxOutputTokens(configModelId);
    if (maxOutputTokens) {
      body.max_tokens = maxOutputTokens;
    }
    const tools = buildAnthropicTools({ webSearch });
    if (tools.length) body.tools = tools;
    if (systemPrompt && systemPrompt.trim()) {
      body.system = systemPrompt.trim();
    }
    if (thinking) {
      if (window.APP_CONFIG.modelUsesAnthropicAdaptiveThinking(configModelId)) {
        const effort = window.APP_CONFIG.normalizeAnthropicApiEffort(configModelId, reasoningEffort);
        body.thinking = { type: 'adaptive' };
        body.output_config = { effort };
      } else if (window.APP_CONFIG.modelUsesAnthropicManualThinking(configModelId)) {
        body.thinking = {
          type: 'enabled',
          budget_tokens: window.APP_CONFIG.getAnthropicHaikuThinkingBudget(configModelId)
        };
      }
    }

    const apiEndpoint = endpoint || ANTHROPIC_ENDPOINT;
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'anthropic-dangerous-direct-browser-access': 'true'
    };

    const res = await fetch(apiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!res.ok) throw await parseApiError(res, 'anthropic');
    if (!res.body || !res.body.getReader) {
      throw new Error('Trình duyệt không hỗ trợ streaming response');
    }

    await readSseStream(res.body.getReader(), handlers);
  };

  const sendGemini = async ({ apiKey, model, systemPrompt, convo, webSearch, imageGen, thinking, reasoningEffort, controller, handlers }) => {
    const contents = buildGeminiContents(convo);
    if (!contents.length) {
      throw new Error('Không có tin nhắn để gửi');
    }

    const requestModel = imageGen ? window.APP_CONFIG.getGeminiImageModel(model) : model;

    const body = {
      contents,
      generationConfig: {}
    };
    const maxOutputTokens = window.APP_CONFIG.getMaxOutputTokens(model);
    if (maxOutputTokens) {
      body.generationConfig.maxOutputTokens = maxOutputTokens;
    }
    if (imageGen) {
      body.generationConfig.responseModalities = ['TEXT', 'IMAGE'];
      const imageGenOptions = getImageGenOptionsFromConvo(convo);
      if (imageGenOptions?.aspectRatio && window.APP_CONFIG.geminiSupportsImageAspectRatio(model)) {
        body.generationConfig.imageConfig = { aspectRatio: imageGenOptions.aspectRatio };
      }
      if (handlers.onImageStatus) handlers.onImageStatus('generating');
    } else {
      if (webSearch) {
        body.tools = [{ google_search: {} }];
      }
      if (thinking) {
        body.generationConfig.thinkingConfig = window.APP_CONFIG.getGeminiThinkingConfig(
          model,
          reasoningEffort
        );
      }
    }
    if (systemPrompt && systemPrompt.trim()) {
      body.systemInstruction = { parts: [{ text: systemPrompt.trim() }] };
    }

    const res = await fetch(window.APP_CONFIG.geminiStreamUrl(requestModel), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!res.ok) throw await parseApiError(res, 'google');
    if (!res.body || !res.body.getReader) {
      throw new Error('Trình duyệt không hỗ trợ streaming response');
    }

    await readSseStream(res.body.getReader(), handlers);
  };

  const sendByteplusResponses = async ({ apiKey, model, systemPrompt, convo, thinking, reasoningEffort, controller, handlers }) => {
    const input = normalizeByteplusResponsesInput(buildConversationMessages(convo, 'responses'));
    if (!input.length) {
      throw new Error('Không có tin nhắn để gửi');
    }

    const mcpTools = window.APP_CONFIG.getByteplusMcpTools(model);
    const body = {
      model: window.APP_CONFIG.getApiModel(model),
      input,
      stream: true
    };
    if (mcpTools.length) {
      body.tools = mcpTools;
    }
    const maxOutputTokens = window.APP_CONFIG.getMaxOutputTokens(model);
    if (maxOutputTokens) {
      body.max_output_tokens = maxOutputTokens;
    }
    if (systemPrompt && systemPrompt.trim()) {
      body.instructions = systemPrompt.trim();
    }
    Object.assign(
      body,
      window.APP_CONFIG.getByteplusResponsesThinkingConfig(model, thinking, reasoningEffort)
    );

    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey
    };
    if (mcpTools.length) {
      headers['ark-beta-mcp'] = 'true';
    }

    const res = await fetch(window.APP_CONFIG.getByteplusEndpoint(model), {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!res.ok) throw await parseApiError(res, 'byteplus');
    if (!res.body || !res.body.getReader) {
      throw new Error('Trình duyệt không hỗ trợ streaming response');
    }

    await readSseStream(res.body.getReader(), handlers);
  };

  const sendWithResponsesTools = async ({ apiKey, model, systemPrompt, convo, tools, thinking, reasoningEffort, controller, handlers }) => {
    const input = buildConversationMessages(convo, 'responses');
    if (!input.length) {
      throw new Error('Không có tin nhắn để gửi');
    }

    const body = {
      model,
      input,
      tools,
      stream: true
    };
    const maxOutputTokens = window.APP_CONFIG.getMaxOutputTokens(model);
    if (maxOutputTokens) {
      body.max_output_tokens = maxOutputTokens;
    }
    if (systemPrompt && systemPrompt.trim()) {
      body.instructions = systemPrompt;
    }
    if (thinking) {
      const effort = window.APP_CONFIG.normalizeEffortForModel(
        reasoningEffort || window.APP_CONFIG.DEFAULT_EFFORT,
        model
      );
      body.reasoning = { effort };
    }

    const res = await fetch(RESPONSES_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!res.ok) throw await parseApiError(res);
    if (!res.body || !res.body.getReader) {
      throw new Error('Trình duyệt không hỗ trợ streaming response');
    }

    await readSseStream(res.body.getReader(), handlers);
  };

  const getImageGenOptionsFromConvo = (convo) => {
    const users = (convo.messages || []).filter((m) => m.role === 'user');
    const last = users[users.length - 1];
    if (!last?.imageGen) return null;
    const ratio = window.APP_CONFIG.getImageGenRatio(last.imageGen.ratio);
    const hasRef = !!(last.images && last.images.length);
    return {
      size: ratio.size,
      aspectRatio: ratio.id,
      action: hasRef ? 'edit' : 'auto'
    };
  };

  const send = async ({
    apiKey, model, systemPrompt, convo,
    webSearch, imageGen, thinking, reasoningEffort,
    allowConcurrent = false,
    onToken, onReasoningToken, onUsage, onDone, onError, onSearchStatus, onImageStatus, onImagePartial, onImageComplete, onGroundingMetadata
  }) => {
    if (!allowConcurrent && activeControllers.size > 0) {
      throw new Error('Đang có yêu cầu khác đang chạy');
    }

    const provider = window.APP_CONFIG.getModelProvider(model);

    if (!apiKey) {
      throw new Error(window.APP_CONFIG.getMissingApiKeyError(model));
    }

    const controller = new AbortController();
    activeControllers.add(controller);
    const releaseController = () => { activeControllers.delete(controller); };
    let groundingMeta = null;
    let requestUsage = null;
    const handlers = {
      onToken,
      onReasoningToken,
      onSearchStatus,
      onImageStatus,
      onImagePartial,
      onImageComplete,
      onGroundingMetadata: (meta) => {
        groundingMeta = mergeGroundingMetadata(groundingMeta, meta);
        if (onGroundingMetadata) onGroundingMetadata(groundingMeta);
      },
      onUsage: (usage) => {
        requestUsage = mergeUsageDelta(requestUsage, usage);
        if (onUsage) onUsage(requestUsage);
      }
    };
    const imageGenOptions = imageGen ? getImageGenOptionsFromConvo(convo) : null;
    const tools = buildResponsesTools({ webSearch, imageGen, imageGenOptions });

    const effort = window.APP_CONFIG.normalizeEffortForModel(
      reasoningEffort || window.APP_CONFIG.DEFAULT_EFFORT,
      model
    );
    try {
      if (provider === 'anthropic') {
        await sendAnthropic({ apiKey, model, systemPrompt, convo, webSearch, thinking, reasoningEffort: effort, controller, handlers });
      } else if (provider === 'google') {
        await sendGemini({ apiKey, model, systemPrompt, convo, webSearch, imageGen, thinking, reasoningEffort: effort, controller, handlers });
      } else if (provider === 'deepseek') {
        await sendChatCompletions({
          apiKey, model, systemPrompt, convo, controller, handlers,
          endpoint: DEEPSEEK_ENDPOINT, provider: 'deepseek', thinking, reasoningEffort: effort
        });
      } else if (provider === 'nvidia') {
        if (window.APP_CONFIG.nvidiaRequiresProxy() && !window.APP_CONFIG.NVIDIA_PROXY_ENDPOINT) {
          throw new Error(window.APP_CONFIG.getNvidiaProxyRequiredError());
        }
        await sendChatCompletions({
          apiKey, model, systemPrompt, convo, controller, handlers,
          endpoint: window.APP_CONFIG.getNvidiaEndpoint(), provider: 'nvidia', thinking, reasoningEffort: effort
        });
      } else if (provider === 'byteplus') {
        if (window.APP_CONFIG.byteplusRequiresProxy() && !window.APP_CONFIG.getByteplusProxyEndpoint(model)) {
          throw new Error(window.APP_CONFIG.getByteplusProxyRequiredError());
        }
        if (window.APP_CONFIG.modelUsesByteplusResponses(model)) {
          await sendByteplusResponses({
            apiKey, model, systemPrompt, convo, controller, handlers, thinking, reasoningEffort: effort
          });
        } else {
          await sendChatCompletions({
            apiKey, model, systemPrompt, convo, controller, handlers,
            endpoint: window.APP_CONFIG.getByteplusEndpoint(model), provider: 'byteplus', thinking, reasoningEffort: effort
          });
        }
      } else if (provider === 'kimi') {
        await sendChatCompletions({
          apiKey, model, systemPrompt, convo, controller, handlers,
          endpoint: KIMI_ENDPOINT, provider: 'kimi', thinking
        });
      } else if (provider === 'openrouter') {
        if (window.APP_CONFIG.modelUsesOpenRouterImages(model)) {
          await sendOpenRouterImages({
            apiKey, model, convo, controller, handlers, imageGenOptions
          });
        } else {
          await sendChatCompletions({
            apiKey, model, systemPrompt, convo, controller, handlers,
            endpoint: window.APP_CONFIG.getOpenRouterEndpoint(), provider: 'openrouter', thinking, reasoningEffort: effort
          });
        }
      } else if (provider === 'opencode-go') {
        if (window.APP_CONFIG.opencodeGoRequiresProxy() && !window.APP_CONFIG.getOpencodeGoProxyEndpoint(model)) {
          throw new Error(window.APP_CONFIG.getOpencodeGoProxyRequiredError());
        }
        const opencodeEndpoint = window.APP_CONFIG.getOpencodeGoEndpoint(model);
        if (window.APP_CONFIG.modelUsesOpencodeGoMessages(model)) {
          await sendOpencodeGoMessages({
            apiKey, model, systemPrompt, convo, controller, handlers,
            endpoint: opencodeEndpoint, thinking, reasoningEffort: effort
          });
        } else {
          await sendChatCompletions({
            apiKey, model, systemPrompt, convo, controller, handlers,
            endpoint: opencodeEndpoint, provider: 'opencode-go', thinking, reasoningEffort: effort
          });
        }
      } else if (provider === 'perplexity') {
        if (window.APP_CONFIG.perplexityRequiresProxy() && !window.APP_CONFIG.getPerplexityProxyEndpoint(model)) {
          throw new Error(window.APP_CONFIG.getPerplexityProxyRequiredError());
        }
        const perplexityEndpoint = window.APP_CONFIG.getPerplexityEndpoint(model);
        if (window.APP_CONFIG.modelUsesPerplexitySearch(model)) {
          await sendPerplexitySearch({
            apiKey, convo, controller, handlers, endpoint: perplexityEndpoint
          });
        } else {
          await sendChatCompletions({
            apiKey, model, systemPrompt, convo, controller, handlers,
            endpoint: perplexityEndpoint, provider: 'perplexity', thinking: false, reasoningEffort: effort
          });
        }
      } else if (tools.length || (thinking && provider === 'openai')) {
        await sendWithResponsesTools({ apiKey, model, systemPrompt, convo, tools, thinking, reasoningEffort: effort, controller, handlers });
      } else {
        await sendChatCompletions({ apiKey, model, systemPrompt, convo, controller, handlers, thinking, reasoningEffort: effort });
      }
      releaseController();
      if (onDone) onDone({ usage: requestUsage });
    } catch (err) {
      releaseController();
      if (err.name === 'AbortError') {
        if (onDone) onDone({ aborted: true, usage: requestUsage });
        return;
      }
      if (onError) onError(new Error(window.APP_CONFIG.formatApiError(err, model)));
    }
  };

  const abort = () => {
    for (const controller of activeControllers) {
      try { controller.abort(); } catch { /* ignore */ }
    }
    activeControllers.clear();
  };

  return { send, abort, isStreaming };
})();
