window.API = (() => {
  const { OPENAI_ENDPOINT, RESPONSES_ENDPOINT, ANTHROPIC_ENDPOINT, ANTHROPIC_VERSION, DEEPSEEK_ENDPOINT, KIMI_ENDPOINT } = window.APP_CONFIG;

  let currentController = null;
  const isStreaming = () => currentController !== null;

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
      text = appendTranslateInstruction(text, m);
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
      text = appendTranslateInstruction(text, m);
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
      text = appendTranslateInstruction(text, m);
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

  const parseApiError = async (res, provider = 'openai') => {
    let errMsg = 'HTTP ' + res.status;
    try {
      const errJson = await res.json();
      if (provider === 'anthropic' && errJson.error) {
        errMsg = errJson.error.message || JSON.stringify(errJson.error);
      } else if (provider === 'google' && errJson.error) {
        errMsg = errJson.error.message || JSON.stringify(errJson.error);
      } else {
        errMsg = errJson.error ? errJson.error.message || JSON.stringify(errJson.error) : errMsg;
      }
    } catch {
      try { errMsg = await res.text() || errMsg; } catch {}
    }
    return new Error(errMsg);
  };

  const handleStreamData = (data, handlers) => {
    if (!data || data === '[DONE]') {
      return data === '[DONE]' ? 'done' : null;
    }
    try {
      const json = JSON.parse(data);
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
        }
        if (delta.content) {
          if (handlers.onToken) handlers.onToken(delta.content);
        }
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
      text = appendTranslateInstruction(text, m);
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

  const buildDeepseekBody = (model, systemPrompt, convo, thinking) => {
    const body = {
      model,
      messages: buildDeepseekMessages(convo, systemPrompt),
      stream: true,
      thinking: { type: thinking ? 'enabled' : 'disabled' }
    };
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
    const alwaysThinking = window.APP_CONFIG.modelThinkingRequired(model);
    const preserved = window.APP_CONFIG.kimiRequiresPreservedThinking(model);
    const body = {
      model,
      messages: buildKimiMessages(convo, systemPrompt, model),
      stream: true,
      thinking: preserved
        ? { type: 'enabled', keep: 'all' }
        : { type: (alwaysThinking || thinking) ? 'enabled' : 'disabled' }
    };
    const maxOutputTokens = window.APP_CONFIG.getMaxOutputTokens(model);
    if (maxOutputTokens) {
      body.max_tokens = maxOutputTokens;
    }
    return body;
  };

  const buildOpenAIChatBody = (model, systemPrompt, convo, thinking) => {
    const body = {
      model,
      messages: buildMessages(convo, systemPrompt),
      stream: true
    };
    const maxOutputTokens = window.APP_CONFIG.getMaxOutputTokens(model);
    if (maxOutputTokens) {
      body.max_completion_tokens = maxOutputTokens;
    }
    if (thinking) {
      body.reasoning_effort = window.APP_CONFIG.REASONING_EFFORT || 'high';
    }
    return body;
  };

  const sendChatCompletions = async ({ apiKey, model, systemPrompt, convo, controller, handlers, endpoint, provider, thinking }) => {
    const body = provider === 'deepseek'
      ? buildDeepseekBody(model, systemPrompt, convo, thinking)
      : provider === 'kimi'
        ? buildKimiBody(model, systemPrompt, convo, thinking)
        : buildOpenAIChatBody(model, systemPrompt, convo, thinking);

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers.Authorization = 'Bearer ' + apiKey;

    const res = await fetch(endpoint || OPENAI_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!res.ok) throw await parseApiError(res);
    if (!res.body || !res.body.getReader) {
      throw new Error('Trình duyệt không hỗ trợ streaming response');
    }

    await readSseStream(res.body.getReader(), handlers);
  };

  const sendAnthropic = async ({ apiKey, model, systemPrompt, convo, webSearch, thinking, controller, handlers }) => {
    const messages = buildAnthropicMessages(convo);
    if (!messages.length) {
      throw new Error('Không có tin nhắn để gửi');
    }

    const body = {
      model,
      messages,
      stream: true
    };
    const maxOutputTokens = window.APP_CONFIG.getMaxOutputTokens(model);
    if (maxOutputTokens) {
      body.max_tokens = maxOutputTokens;
    }
    const tools = buildAnthropicTools({ webSearch });
    if (tools.length) body.tools = tools;
    if (systemPrompt && systemPrompt.trim()) {
      body.system = systemPrompt.trim();
    }
    if (thinking) {
      body.thinking = { type: 'enabled' };
    }

    const res = await fetch(ANTHROPIC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!res.ok) throw await parseApiError(res, 'anthropic');
    if (!res.body || !res.body.getReader) {
      throw new Error('Trình duyệt không hỗ trợ streaming response');
    }

    await readSseStream(res.body.getReader(), handlers);
  };

  const sendGemini = async ({ apiKey, model, systemPrompt, convo, webSearch, imageGen, thinking, controller, handlers }) => {
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
        body.generationConfig.thinkingConfig = { includeThoughts: true };
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

  const sendWithResponsesTools = async ({ apiKey, model, systemPrompt, convo, tools, thinking, controller, handlers }) => {
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
      body.reasoning = { effort: window.APP_CONFIG.REASONING_EFFORT || 'high' };
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
    webSearch, imageGen, thinking,
    onToken, onReasoningToken, onDone, onError, onSearchStatus, onImageStatus, onImagePartial, onImageComplete, onGroundingMetadata
  }) => {
    if (currentController) {
      throw new Error('Đang có yêu cầu khác đang chạy');
    }

    const provider = window.APP_CONFIG.getModelProvider(model);

    if (!apiKey) {
      throw new Error(window.APP_CONFIG.getMissingApiKeyError(model));
    }

    const controller = new AbortController();
    currentController = controller;
    let groundingMeta = null;
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
      }
    };
    const imageGenOptions = imageGen ? getImageGenOptionsFromConvo(convo) : null;
    const tools = buildResponsesTools({ webSearch, imageGen, imageGenOptions });

    try {
      if (provider === 'anthropic') {
        await sendAnthropic({ apiKey, model, systemPrompt, convo, webSearch, thinking, controller, handlers });
      } else if (provider === 'google') {
        await sendGemini({ apiKey, model, systemPrompt, convo, webSearch, imageGen, thinking, controller, handlers });
      } else if (provider === 'deepseek') {
        await sendChatCompletions({
          apiKey, model, systemPrompt, convo, controller, handlers,
          endpoint: DEEPSEEK_ENDPOINT, provider: 'deepseek', thinking
        });
      } else if (provider === 'kimi') {
        await sendChatCompletions({
          apiKey, model, systemPrompt, convo, controller, handlers,
          endpoint: KIMI_ENDPOINT, provider: 'kimi', thinking
        });
      } else if (tools.length || (thinking && provider === 'openai')) {
        await sendWithResponsesTools({ apiKey, model, systemPrompt, convo, tools, thinking, controller, handlers });
      } else {
        await sendChatCompletions({ apiKey, model, systemPrompt, convo, controller, handlers, thinking });
      }
      currentController = null;
      if (onDone) onDone();
    } catch (err) {
      currentController = null;
      if (err.name === 'AbortError') {
        if (onDone) onDone({ aborted: true });
        return;
      }
      if (onError) onError(err);
    }
  };

  const abort = () => {
    if (currentController) {
      currentController.abort();
      currentController = null;
    }
  };

  return { send, abort, isStreaming };
})();
