window.API = (() => {
  const { OPENAI_ENDPOINT } = window.APP_CONFIG;

  let currentController = null;
  const isStreaming = () => currentController !== null;

  const buildMessages = (convo, systemPrompt) => {
    const msgs = [];
    if (systemPrompt && systemPrompt.trim()) {
      msgs.push({ role: 'system', content: systemPrompt });
    }
    const all = convo.messages || [];
    for (let i = 0; i < all.length; i++) {
      const m = all[i];
      if (m.role !== 'user' && m.role !== 'assistant') continue;
      if (i === all.length - 1 && m.role === 'assistant' && !m.content) continue;
      msgs.push({ role: m.role, content: m.content || '' });
    }
    return msgs;
  };

  const send = async ({ apiKey, model, systemPrompt, convo, onToken, onDone, onError }) => {
    if (currentController) {
      throw new Error('Đang có yêu cầu khác đang chạy');
    }
    if (!apiKey) {
      throw new Error('Chưa có API key. Mở Cài đặt để nhập.');
    }

    const controller = new AbortController();
    currentController = controller;

    let messages = buildMessages(convo, systemPrompt);

    const body = {
      model,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 16384
    };

    try {
      const res = await fetch(OPENAI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!res.ok) {
        let errMsg = 'HTTP ' + res.status;
        try {
          const errJson = await res.json();
          errMsg = errJson.error ? errJson.error.message || JSON.stringify(errJson.error) : errMsg;
        } catch {
          try { errMsg = await res.text() || errMsg; } catch {}
        }
        throw new Error(errMsg);
      }

      if (!res.body || !res.body.getReader) {
        throw new Error('Trình duyệt không hỗ trợ streaming response');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') {
            currentController = null;
            if (onDone) onDone();
            return;
          }
          if (!data) continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices && json.choices[0] && json.choices[0].delta;
            if (delta && delta.content) {
              if (onToken) onToken(delta.content);
            }
          } catch (e) {
            console.warn('SSE parse failed:', data, e);
          }
        }
      }

      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith('data:')) {
          const jsonStr = trimmed.slice(5).trim();
          if (jsonStr && jsonStr !== '[DONE]') {
            try {
              const json = JSON.parse(jsonStr);
              const delta = json.choices && json.choices[0] && json.choices[0].delta;
              if (delta && delta.content) {
                if (onToken) onToken(delta.content);
              }
            } catch (e) {
              console.warn('SSE tail parse failed:', jsonStr, e);
            }
          }
        }
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
