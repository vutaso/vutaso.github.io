window.API = (() => {
  const { OPENAI_ENDPOINT, RESPONSES_ENDPOINT, ANTHROPIC_ENDPOINT, ANTHROPIC_VERSION, DEEPSEEK_ENDPOINT, KIMI_ENDPOINT } = window.APP_CONFIG;
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

  // Gộp các message cùng role liên tiếp thành một. Anthropic & Gemini bắt buộc
  // role phải xen kẽ user/assistant — nếu convo có 2 user liền nhau (ví dụ khi
  // compare gửi câu hỏi nhưng người dùng không chọn đáp án nào, để lại user "mồ côi")
  // thì request sẽ bị từ chối 400. Chuẩn hoá tại đây vá mọi đường sinh ra role trùng.
  const COALESCE_REQUEST_FLAGS = ['translateTo', 'imageGen', 'slides', 'excel', 'document', 'pdf'];

  const coalesceMessages = (messages) => {
    const out = [];
    for (const m of (messages || [])) {
      if (m.role !== 'user' && m.role !== 'assistant') {
        out.push(m);
        continue;
      }
      const prev = out[out.length - 1];
      if (prev && prev.role === m.role) {
        const prevText = prev.content || '';
        const curText = m.content || '';
        const merged = {
          ...prev,
          content: prevText && curText ? prevText + '\n\n' + curText : (prevText || curText),
        };
        if (prev.images || m.images) merged.images = [...(prev.images || []), ...(m.images || [])];
        if (prev.files || m.files) merged.files = [...(prev.files || []), ...(m.files || [])];
        // Ưu tiên cờ yêu cầu của message mới nhất (câu hỏi đang hoạt động).
        for (const k of COALESCE_REQUEST_FLAGS) {
          if (m[k] !== undefined) merged[k] = m[k];
        }
        out[out.length - 1] = merged;
      } else {
        out.push(m);
      }
    }
    return out;
  };

  const buildAnthropicMessages = (convo) => {
    const msgs = [];
    const all = coalesceMessages(convo.messages);
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
    const all = coalesceMessages(convo.messages);
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
    const all = coalesceMessages(convo.messages);
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
      const maxUses = Math.max(1, Number(window.APP_CONFIG.WEB_SEARCH_MAX_USES) || 5);
      tools.push({ type: 'web_search_20250305', name: 'web_search', max_uses: maxUses });
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


  const MAX_GROUNDING_CHUNKS = 24;
  const MAX_GROUNDING_QUERIES = 8;
  const MAX_GROUNDING_TITLE = 200;
  const MAX_GROUNDING_QUERY = 200;
  const MAX_GROUNDING_URL = 2048;

  const clipGroundingText = (value, max) => {
    const s = String(value || '').replace(/\s+/g, ' ').trim();
    if (!s) return '';
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
  };

  const clipQuery = (value) => clipGroundingText(value, MAX_GROUNDING_QUERY);

  const chunkFromWeb = (uri, title) => {
    const url = String(uri || '').trim();
    if (!/^https?:\/\//i.test(url) || url.length > MAX_GROUNDING_URL) return null;
    const label = clipGroundingText(title, MAX_GROUNDING_TITLE) || url;
    return { web: { uri: url, title: label } };
  };

  const collectWebResults = (list, chunks) => {
    if (!Array.isArray(list)) return;
    for (const item of list) {
      if (!item) continue;
      if (typeof item === 'string') {
        const chunk = chunkFromWeb(item, item);
        if (chunk) chunks.push(chunk);
        continue;
      }
      const chunk = chunkFromWeb(
        item.url || item.uri || item.href || item.link || item.web?.uri,
        item.title || item.name || item.web?.title
      );
      if (chunk) chunks.push(chunk);
    }
  };

  const collectMessageAnnotations = (content, chunks) => {
    if (!Array.isArray(content)) return;
    for (const part of content) {
      if (!part || typeof part !== 'object') continue;
      collectWebResults(part.annotations, chunks);
      collectWebResults(part.citations, chunks);
    }
  };

  const collectResponsesOutput = (output, chunks, queries) => {
    if (!Array.isArray(output)) return;
    for (const item of output) {
      if (!item || typeof item !== 'object') continue;
      if (item.type === 'web_search_call') {
        const query = clipQuery(item.action?.query || item.query);
        if (query) queries.push(query);
        collectWebResults(item.action?.sources, chunks);
        collectWebResults(item.results, chunks);
      }
      if (item.type === 'message') collectMessageAnnotations(item.content, chunks);
    }
  };

  const emitGroundingFromEvent = (json, handlers) => {
    if (!handlers?.onGroundingMetadata || !json || typeof json !== 'object') return;
    const chunks = [];
    const queries = [];

    const geminiMeta = json.candidates?.[0]?.groundingMetadata;
    if (geminiMeta) {
      for (const item of geminiMeta.groundingChunks || []) {
        const web = item?.web || item?.retrievedContext;
        const chunk = chunkFromWeb(web?.uri, web?.title);
        if (chunk) chunks.push(chunk);
      }
      for (const query of geminiMeta.webSearchQueries || []) {
        const q = clipQuery(query);
        if (q) queries.push(q);
      }
    }

    const annotation = json.annotation || (json.delta && json.delta.annotation);
    if (annotation && (annotation.url || annotation.uri || annotation.href || annotation.type === 'url_citation')) {
      const chunk = chunkFromWeb(annotation.url || annotation.uri || annotation.href, annotation.title);
      if (chunk) chunks.push(chunk);
    }
    collectWebResults(json.delta?.annotations, chunks);
    collectWebResults(json.choices?.[0]?.delta?.annotations, chunks);
    collectWebResults(json.choices?.[0]?.message?.annotations, chunks);

    const item = json.item;
    if (item?.type === 'web_search_call') {
      const query = clipQuery(item.action?.query || item.query);
      if (query) queries.push(query);
      collectWebResults(item.action?.sources, chunks);
      collectWebResults(item.results, chunks);
    }
    if (item?.type === 'message') collectMessageAnnotations(item.content, chunks);

    if (json.response?.output) collectResponsesOutput(json.response.output, chunks, queries);
    if (Array.isArray(json.output)) collectResponsesOutput(json.output, chunks, queries);

    const block = json.content_block;
    if (block) {
      if (block.type === 'server_tool_use' && block.name === 'web_search') {
        const idx = json.index ?? 0;
        handlers._wsSearchIdx = handlers._wsSearchIdx || new Set();
        handlers._wsSearchJson = handlers._wsSearchJson || {};
        handlers._wsSearchIdx.add(idx);
        handlers._wsSearchJson[idx] = '';
        const query = clipQuery(block.input?.query);
        if (query) queries.push(query);
      }
      if (block.type === 'web_search_tool_result') {
        collectWebResults(block.content, chunks);
      }
      collectWebResults(block.citations, chunks);
    }
    if (json.delta?.type === 'input_json_delta' || json.type === 'content_block_stop') {
      const idx = json.index ?? 0;
      if (handlers._wsSearchIdx?.has(idx)) {
        if (json.delta?.partial_json) {
          handlers._wsSearchJson[idx] = (handlers._wsSearchJson[idx] || '') + json.delta.partial_json;
        }
        try {
          const parsed = JSON.parse(handlers._wsSearchJson[idx] || '');
          const query = clipQuery(parsed && parsed.query);
          if (query) queries.push(query);
        } catch { /* partial JSON until the tool-use block completes */ }
      }
    }
    if (json.delta?.type === 'citations_delta' && json.delta.citation) {
      const citation = json.delta.citation;
      const chunk = chunkFromWeb(citation.url, citation.title);
      if (chunk) chunks.push(chunk);
    }

    collectWebResults(json.search_results, chunks);
    if (Array.isArray(json.citations)) collectWebResults(json.citations, chunks);
    if (json.url && (json.title || json.content)) {
      const chunk = chunkFromWeb(json.url, json.title);
      if (chunk) chunks.push(chunk);
    }

    if (!chunks.length && !queries.length) return;
    const payload = {};
    if (chunks.length) payload.groundingChunks = chunks.slice(0, MAX_GROUNDING_CHUNKS);
    if (queries.length) payload.webSearchQueries = queries.filter(Boolean).slice(0, MAX_GROUNDING_QUERIES);
    handlers.onGroundingMetadata(payload);
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
        if (!uri || !/^https?:\/\//i.test(uri) || seen.has(uri)) continue;
        merged.groundingChunks.push(chunk);
        seen.add(uri);
      }
      if (merged.groundingChunks.length > MAX_GROUNDING_CHUNKS) {
        merged.groundingChunks = merged.groundingChunks.slice(0, MAX_GROUNDING_CHUNKS);
      }
    }
    if (next.webSearchQueries?.length) {
      const qs = new Set(prev.webSearchQueries || []);
      next.webSearchQueries.forEach((q) => {
        const clipped = clipQuery(q);
        if (clipped) qs.add(clipped);
      });
      merged.webSearchQueries = [...qs].slice(0, MAX_GROUNDING_QUERIES);
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
      } else if (provider === 'openrouter') {
        const meta = errJson.error?.metadata;
        errMsg = meta?.raw || meta?.message || errJson.error?.message || errMsg;
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

  const LENGTH_FINISH_REASONS = new Set([
    'length', 'max_tokens', 'max_token', 'max_output_tokens', 'maxoutputtokens',
    'max_completion_tokens', 'output_limit', 'pause_turn', 'incomplete',
    'max_tokens_exceeded', 'token_limit_exceeded'
  ]);

  const normalizeFinishKey = (reason) => String(reason || '').trim().toLowerCase().replace(/[\s-]+/g, '_');

  const isLengthFinishReason = (reason) => LENGTH_FINISH_REASONS.has(normalizeFinishKey(reason));

  const NON_CONTINUE_ERROR_RE = /invalid.?api.?key|unauthorized|\b401\b|\b403\b|forbidden|content.?filter|moderation|safety|blocked|rate.?limit|\b429\b|too many requests/i;
  const CREDIT_OR_LENGTH_RE = /max_tokens|max.?output|token.?limit|output.?limit|length.?exceeded|insufficient.?credit|can only afford|credits? remaining|\b402\b|payment required|max_tokens_exceeded|token_limit_exceeded/i;
  const NETWORK_ERROR_RE = /failed to fetch|network|load failed|err_connection|err_internet|err_network|timeout|timed out|\b502\b|\b503\b|\b504\b|\b500\b|bad gateway|unavailable|econnreset|connection/i;

  const isContinueWorthyError = (err) => {
    if (err && err.name === 'TypeError') return true;
    const text = String((err && err.message) || err || '');
    if (!text) return false;
    if (NON_CONTINUE_ERROR_RE.test(text) && !CREDIT_OR_LENGTH_RE.test(text)) return false;
    return CREDIT_OR_LENGTH_RE.test(text) || NETWORK_ERROR_RE.test(text);
  };

  const isNearMaxOutput = (modelId, usage) => {
    const maxOut = window.APP_CONFIG.getMaxOutputTokens(modelId);
    const completion = usage?.completion || 0;
    if (!maxOut || !completion) return false;
    return completion >= Math.floor(maxOut * 0.98);
  };

  const getStreamError = (json) => {
    if (!json || typeof json !== 'object') return null;
    if (json.type === 'error' || json.type === 'response.failed') {
      if (json.error && typeof json.error === 'object') return json.error;
      return { message: json.message || (typeof json.error === 'string' ? json.error : '') || 'API error' };
    }
    if (json.error && typeof json.error === 'object') return json.error;
    if (typeof json.error === 'string' && json.error.trim()) return { message: json.error };
    const choiceErr = json.choices && json.choices[0] && json.choices[0].error;
    if (choiceErr && typeof choiceErr === 'object') return choiceErr;
    return null;
  };

  const noteFinishReason = (handlers, json) => {
    if (!handlers || !json || typeof json !== 'object') return;
    const choice = json.choices && json.choices[0];
    const errObj = getStreamError(json);
    const reasons = [
      choice && choice.native_finish_reason,
      choice && choice.finish_reason,
      errObj && errObj.metadata && errObj.metadata.error_type,
      json.type === 'message_delta' && json.delta && json.delta.stop_reason,
      json.candidates && json.candidates[0] && json.candidates[0].finishReason
    ].filter(Boolean);
    if (json.type === 'response.incomplete' || json.response?.status === 'incomplete') {
      reasons.push(json.response?.incomplete_details?.reason || json.incomplete_details?.reason || 'incomplete');
    }
    if (json.type === 'response.completed' && json.response?.status === 'incomplete') {
      reasons.push(json.response?.incomplete_details?.reason || 'incomplete');
    }
    const lengthReason = reasons.find(isLengthFinishReason);
    if (lengthReason) {
      handlers.finishReason = String(lengthReason);
      handlers.streamTruncated = true;
      return;
    }
    if (handlers.streamTruncated) return;
    const first = reasons.find(Boolean);
    if (first) handlers.finishReason = String(first);
  };

  const isShellActivityEventType = (type) => {
    if (!type || typeof type !== 'string') return false;
    if (/shell_call_command\.(added|delta)/i.test(type)) return true;
    if (/shell_call_output_content\.delta/i.test(type)) return true;
    if (/code_interpreter_call\.(in_progress|interpreting|code\.delta)/i.test(type)) return true;
    if (type === 'response.output_item.added') return false;
    if (/shell_call/i.test(type) && /in_progress|searching|executing|interpreting|added/i.test(type)) return true;
    return false;
  };

  const emitShellStatusFromStream = (json, handlers) => {
    if (!handlers?.onShellStatus || !json || typeof json !== 'object') return;
    const type = json.type || '';
    if (isShellActivityEventType(type)) {
      handlers.onShellStatus('running');
      return;
    }
    if (type === 'response.output_item.added' || type === 'response.output_item.done') {
      const itemType = json.item?.type || '';
      if (itemType === 'shell_call' || itemType === 'shell_call_output') {
        handlers.onShellStatus(itemType === 'shell_call' ? 'running' : 'running');
      }
    }
  };

  const handleStreamData = (data, handlers) => {
    if (!data || data === '[DONE]') {
      return data === '[DONE]' ? 'done' : null;
    }
    try {
      const json = JSON.parse(data);
      noteFinishReason(handlers, json);
      emitUsage(handlers, extractUsage(json));
      emitGroundingFromEvent(json, handlers);
      const streamErr = getStreamError(json);
      if (streamErr) {
        const errType = (streamErr.metadata && streamErr.metadata.error_type) || '';
        const msg = streamErr.message || json.message || 'API error';
        if (isLengthFinishReason(errType) || isLengthFinishReason(handlers.finishReason) || handlers.streamTruncated) {
          handlers.streamTruncated = true;
          if (!isLengthFinishReason(handlers.finishReason)) {
            handlers.finishReason = errType || handlers.finishReason || 'max_tokens';
          }
          return null;
        }
        throw new Error(msg);
      }
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
      emitShellStatusFromStream(json, handlers);
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
        if (Array.isArray(delta.tool_calls)) {
          for (const tc of delta.tool_calls) {
            const name = String(tc.function?.name || tc.type || '');
            if (/web_fetch/i.test(name) && handlers.onSearchStatus) handlers.onSearchStatus('fetching');
            else if (/web_search/i.test(name) && handlers.onSearchStatus) handlers.onSearchStatus('searching');
            else if (/shell/i.test(name) && handlers.onShellStatus) handlers.onShellStatus('running');
          }
        }
      }
      if (json.type === 'tool_call' || json.type === 'tool_call.start') {
        const name = String(json.name || json.tool_call?.name || json.tool_call?.type || '');
        if (/web_fetch/i.test(name) && handlers.onSearchStatus) {
          handlers.onSearchStatus('fetching');
        } else if (/web_search/i.test(name) && handlers.onSearchStatus) {
          handlers.onSearchStatus('searching');
        } else if (/shell/i.test(name) && handlers.onShellStatus) {
          handlers.onShellStatus('running');
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

  const buildDeepseekMessageContent = (m, modelId) => {
    let text = appendFilesToText(m.content || '', m.files);
    if (m.role === 'user') {
      text = appendUserInstructions(text, m);
    }
    const images = m.images || [];
    if (m.role === 'user' && images.length > 0 && window.APP_CONFIG.modelSupportsVision(modelId)) {
      const parts = [];
      if (text.trim()) parts.push({ type: 'text', text });
      for (const img of images) {
        if (img.dataUrl) {
          parts.push({ type: 'image_url', image_url: { url: img.dataUrl, detail: 'auto' } });
        }
      }
      return parts.length ? parts : (text || '');
    }
    return appendImagesAsTextNote(text, images);
  };

  const buildDeepseekMessages = (convo, systemPrompt, modelId) => {
    const msgs = [];
    if (systemPrompt && systemPrompt.trim()) {
      msgs.push({ role: 'system', content: systemPrompt });
    }
    const all = coalesceMessages(convo.messages);
    for (let i = 0; i < all.length; i++) {
      const m = all[i];
      if (m.role !== 'user' && m.role !== 'assistant') continue;
      if (i === all.length - 1 && m.role === 'assistant' && !m.content) continue;
      msgs.push({ role: m.role, content: buildDeepseekMessageContent(m, modelId) });
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
      messages: buildDeepseekMessages(convo, systemPrompt, model),
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

  const buildKimiMessages = (convo, systemPrompt, modelId) => {
    const msgs = [];
    if (systemPrompt && systemPrompt.trim()) {
      msgs.push({ role: 'system', content: systemPrompt });
    }
    const preserved = window.APP_CONFIG.kimiRequiresPreservedThinking(modelId);
    const all = coalesceMessages(convo.messages);
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

  const buildOpenRouterBody = (model, systemPrompt, convo, thinking, reasoningEffort, webSearch) => {
    const body = withStreamUsage({
      model: window.APP_CONFIG.getApiModel(model),
      messages: buildMessages(convo, systemPrompt),
      stream: true
    });
    const maxOutputTokens = window.APP_CONFIG.getMaxOutputTokens(model);
    if (maxOutputTokens) {
      body.max_tokens = maxOutputTokens;
    }
    const reasoning = window.APP_CONFIG.getOpenRouterThinkingConfig(model, thinking, reasoningEffort);
    if (reasoning) {
      body.reasoning = reasoning;
    }
    const serverFields = window.APP_CONFIG.getOpenRouterServerToolFields(model, webSearch);
    if (serverFields?.tools?.length) body.tools = serverFields.tools;
    if (serverFields?.plugins) body.plugins = serverFields.plugins;
    return body;
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

  const sendChatCompletions = async ({ apiKey, model, systemPrompt, convo, controller, handlers, endpoint, provider, thinking, reasoningEffort, webSearch }) => {
    const body = provider === 'deepseek'
      ? buildDeepseekBody(model, systemPrompt, convo, thinking, reasoningEffort)
      : provider === 'openrouter'
            ? buildOpenRouterBody(model, systemPrompt, convo, thinking, reasoningEffort, webSearch)
          : provider === 'kimi'
            ? buildKimiBody(model, systemPrompt, convo, thinking)
            : buildOpenAIChatBody(model, systemPrompt, convo, thinking, reasoningEffort);

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers.Authorization = 'Bearer ' + apiKey;
    if (provider === 'openrouter') {
      headers['HTTP-Referer'] = window.location.origin || 'https://vutaso.github.io';
      headers['X-Title'] = 'Vutaso AI';
      if (webSearch && body.plugins && handlers.onSearchStatus) {
        handlers.onSearchStatus('searching');
      }
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

  const sendWithResponsesTools = async ({ apiKey, model, systemPrompt, convo, tools, thinking, reasoningEffort, controller, handlers }) => {
    const input = buildConversationMessages(convo, 'responses');
    if (!input.length) {
      throw new Error('Không có tin nhắn để gửi');
    }

    const body = {
      model: window.APP_CONFIG.getApiModel(model),
      input,
      tools,
      stream: true,
      store: true,
      text: {
        format: { type: 'text' },
        verbosity: 'medium'
      }
    };
    const maxOutputTokens = window.APP_CONFIG.getMaxOutputTokens(model);
    if (maxOutputTokens) {
      body.max_output_tokens = maxOutputTokens;
    }
    if (systemPrompt && systemPrompt.trim()) {
      body.instructions = systemPrompt;
    }
    const include = [];
    if (thinking) {
      const effort = window.APP_CONFIG.normalizeEffortForModel(
        reasoningEffort || window.APP_CONFIG.DEFAULT_EFFORT,
        model
      );
      body.reasoning = {
        effort,
        mode: 'standard',
        summary: 'auto'
      };
      include.push('reasoning.encrypted_content');
    }
    if (tools.some((tool) => tool?.type === 'web_search' || tool?.type === 'web_search_preview')) {
      include.push('web_search_call.action.sources');
    }
    if (include.length) {
      body.include = include;
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

  const sendOpenRouterResponses = async ({
    apiKey, model, systemPrompt, convo, tools, thinking, reasoningEffort, controller, handlers
  }) => {
    const input = buildConversationMessages(convo, 'responses');
    if (!input.length) {
      throw new Error('Không có tin nhắn để gửi');
    }

    const body = {
      model: window.APP_CONFIG.getApiModel(model),
      input,
      tools,
      stream: true,
      store: false,
      text: {
        format: { type: 'text' },
        verbosity: 'medium'
      }
    };
    const maxOutputTokens = window.APP_CONFIG.getMaxOutputTokens(model);
    if (maxOutputTokens) {
      body.max_output_tokens = maxOutputTokens;
    }
    if (systemPrompt && systemPrompt.trim()) {
      body.instructions = systemPrompt;
    }
    const include = [];
    if (thinking) {
      const effort = window.APP_CONFIG.normalizeEffortForModel(
        reasoningEffort || window.APP_CONFIG.DEFAULT_EFFORT,
        model
      );
      body.reasoning = {
        effort,
        mode: 'standard',
        summary: 'auto'
      };
      include.push('reasoning.encrypted_content');
    }
    const usesWebTool = tools.some((tool) => (
      tool?.type === 'openrouter:web_search'
      || tool?.type === 'web_search'
      || tool?.type === 'web_search_preview'
    ));
    if (usesWebTool) {
      include.push('web_search_call.action.sources');
    }
    if (include.length) {
      body.include = include;
    }

    const res = await fetch(window.APP_CONFIG.getOpenRouterResponsesEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
        'HTTP-Referer': window.location.origin || 'https://vutaso.github.io',
        'X-Title': 'Vutaso AI'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!res.ok) throw await parseApiError(res, 'openrouter');
    if (!res.body || !res.body.getReader) {
      throw new Error('Trình duyệt không hỗ trợ streaming response');
    }

    const usesShell = tools.some((tool) => tool?.type === 'openrouter:shell');
    if (usesShell && handlers.onShellStatus) {
      handlers.onShellStatus('active');
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
    webSearch, shell, imageGen, thinking, reasoningEffort,
    seedGroundingMetadata,
    allowConcurrent = false,
    onToken, onReasoningToken, onUsage, onDone, onError, onSearchStatus, onShellStatus, onImageStatus, onImagePartial, onImageComplete, onGroundingMetadata
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
    let groundingMeta = seedGroundingMetadata
      ? mergeGroundingMetadata({ groundingChunks: [], webSearchQueries: [] }, seedGroundingMetadata)
      : null;
    let requestUsage = null;
    const handlers = {
      onToken,
      onReasoningToken,
      onSearchStatus,
      onShellStatus,
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
      } else if (provider === 'kimi') {
        await sendChatCompletions({
          apiKey, model, systemPrompt, convo, controller, handlers,
          endpoint: KIMI_ENDPOINT, provider: 'kimi', thinking
        });
      } else if (window.APP_CONFIG.isOpenRouterProvider(provider)) {
        if (window.APP_CONFIG.modelUsesOpenRouterImages(model)) {
          await sendOpenRouterImages({
            apiKey, model, convo, controller, handlers, imageGenOptions
          });
        } else if (shell && window.APP_CONFIG.modelSupportsShell(model)) {
          const orTools = window.APP_CONFIG.getOpenRouterResponsesTools(model, { webSearch, shell: true });
          if (!orTools.length) {
            throw new Error('Không có server tool để gửi');
          }
          await sendOpenRouterResponses({
            apiKey, model, systemPrompt, convo, tools: orTools,
            thinking, reasoningEffort: effort, controller, handlers
          });
        } else {
          await sendChatCompletions({
            apiKey, model, systemPrompt, convo, controller, handlers,
            endpoint: window.APP_CONFIG.getOpenRouterEndpoint(), provider: 'openrouter',
            thinking, reasoningEffort: effort, webSearch
          });
        }
      } else if (tools.length || (thinking && provider === 'openai')) {
        await sendWithResponsesTools({ apiKey, model, systemPrompt, convo, tools, thinking, reasoningEffort: effort, controller, handlers });
      } else {
        await sendChatCompletions({ apiKey, model, systemPrompt, convo, controller, handlers, thinking, reasoningEffort: effort });
      }
      releaseController();
      if (onDone) {
        const finishReason = handlers.finishReason || '';
        onDone({
          usage: requestUsage,
          truncated: !!(handlers.streamTruncated)
            || isLengthFinishReason(finishReason)
            || isNearMaxOutput(model, requestUsage),
          finishReason
        });
      }
    } catch (err) {
      releaseController();
      if (err.name === 'AbortError') {
        if (onDone) onDone({ aborted: true, usage: requestUsage, truncated: false });
        return;
      }
      if (onError) {
        const e = new Error(window.APP_CONFIG.formatApiError(err, model));
        e.truncated = !!(handlers.streamTruncated)
          || isLengthFinishReason(handlers.finishReason)
          || isContinueWorthyError(err);
        e.usage = requestUsage;
        onError(e);
      }
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
