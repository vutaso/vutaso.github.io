window.API = (() => {
  const { OPENAI_ENDPOINT, RESPONSES_ENDPOINT, ANTHROPIC_ENDPOINT, ANTHROPIC_VERSION, DEEPSEEK_ENDPOINT } = window.APP_CONFIG;

  let currentController = null;
  const isStreaming = () => currentController !== null;

  const appendFilesToText = (text, files) => {
    if (!files || !files.length) return text || '';
    const blocks = files.map((f) =>
      '**Tệp đính kèm: ' + f.name + '**\n```\n' + f.content + '\n```'
    ).join('\n\n');
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
      tools.push({ type: 'web_search_20250305', name: 'web_search', max_uses: 5 });
    }
    return tools;
  };

  const buildResponsesTools = ({ webSearch, imageGen, imageGenOptions }) => {
    const tools = [];
    if (webSearch) {
      tools.push({ type: 'web_search', search_context_size: 'medium' });
    }
    if (imageGen) {
      const tool = { type: 'image_generation', partial_images: 2 };
      if (imageGenOptions?.size) tool.size = imageGenOptions.size;
      if (imageGenOptions?.action) tool.action = imageGenOptions.action;
      tools.push(tool);
    }
    return tools;
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

  const sendChatCompletions = async ({ apiKey, model, systemPrompt, convo, controller, handlers, endpoint, provider, thinking }) => {
    const body = {
      model,
      messages: buildMessages(convo, systemPrompt),
      stream: true
    };
    if (provider === 'deepseek') {
      body.max_tokens = 16384;
      body.thinking = { type: thinking ? 'enabled' : 'disabled' };
    } else {
      body.max_completion_tokens = 16384;
      if (thinking) body.reasoning_effort = 'medium';
    }

    const res = await fetch(endpoint || OPENAI_ENDPOINT, {
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

  const sendAnthropic = async ({ apiKey, model, systemPrompt, convo, webSearch, thinking, controller, handlers }) => {
    const messages = buildAnthropicMessages(convo);
    if (!messages.length) {
      throw new Error('Không có tin nhắn để gửi');
    }

    const body = {
      model,
      messages,
      max_tokens: 16384,
      stream: true
    };
    const tools = buildAnthropicTools({ webSearch });
    if (tools.length) body.tools = tools;
    if (systemPrompt && systemPrompt.trim()) {
      body.system = systemPrompt.trim();
    }
    if (thinking) {
      body.thinking = {
        type: 'enabled',
        budget_tokens: window.APP_CONFIG.THINKING_BUDGET_TOKENS
      };
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

  const sendWithResponsesTools = async ({ apiKey, model, systemPrompt, convo, tools, thinking, controller, handlers }) => {
    const input = buildConversationMessages(convo, 'responses');
    if (!input.length) {
      throw new Error('Không có tin nhắn để gửi');
    }

    const body = {
      model,
      input,
      tools,
      stream: true,
      max_output_tokens: 16384
    };
    if (systemPrompt && systemPrompt.trim()) {
      body.instructions = systemPrompt;
    }
    if (thinking) {
      body.reasoning = { effort: 'medium' };
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
      action: hasRef ? 'edit' : 'auto'
    };
  };

  const send = async ({
    apiKey, model, systemPrompt, convo,
    webSearch, imageGen, thinking,
    onToken, onReasoningToken, onDone, onError, onSearchStatus, onImageStatus, onImagePartial, onImageComplete
  }) => {
    if (currentController) {
      throw new Error('Đang có yêu cầu khác đang chạy');
    }
    if (!apiKey) {
      throw new Error(window.APP_CONFIG.getMissingApiKeyError(model));
    }

    const controller = new AbortController();
    currentController = controller;
    const handlers = { onToken, onReasoningToken, onSearchStatus, onImageStatus, onImagePartial, onImageComplete };
    const imageGenOptions = imageGen ? getImageGenOptionsFromConvo(convo) : null;
    const tools = buildResponsesTools({ webSearch, imageGen, imageGenOptions });
    const provider = window.APP_CONFIG.getModelProvider(model);

    try {
      if (provider === 'anthropic') {
        await sendAnthropic({ apiKey, model, systemPrompt, convo, webSearch, thinking, controller, handlers });
      } else if (provider === 'deepseek') {
        await sendChatCompletions({
          apiKey, model, systemPrompt, convo, controller, handlers,
          endpoint: DEEPSEEK_ENDPOINT, provider: 'deepseek', thinking
        });
      } else if (tools.length) {
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
