window.Share = (() => {
  const getEndpoint = () => {
    const base = window.APP_CONFIG.SHARE_ENDPOINT;
    if (!base) return null;
    return base.replace(/\/$/, '');
  };

  const isConfigured = () => !!getEndpoint();

  const buildShareUrl = (id) => {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('share', id);
    return url.toString();
  };

  const getShareIdFromLocation = () => {
    try {
      const id = new URLSearchParams(window.location.search).get('share');
      if (id && /^[a-zA-Z0-9_-]{8,32}$/.test(id)) return id;
    } catch {}
    return null;
  };

  const sanitizeForUpload = (convo) => {
    if (!convo) return null;
    const messages = (convo.messages || []).map((m) => {
      const out = {
        role: m.role,
        content: m.content || '',
        ts: m.ts || Date.now()
      };
      if (m.role === 'assistant') {
        const text = window.Conversations.getAssistantContent
          ? window.Conversations.getAssistantContent(m)
          : (m.content || '');
        out.content = text;
        if (m.reasoningContent) out.reasoningContent = m.reasoningContent;
        if (m.groundingMetadata) out.groundingMetadata = m.groundingMetadata;
        if (m.generatedImages?.length) {
          out.generatedImages = m.generatedImages
            .filter((img) => img?.dataUrl)
            .map((img) => ({
              dataUrl: img.dataUrl,
              name: img.name || 'image',
              mime: img.mime
            }));
        }
      } else if (m.role === 'user') {
        if (m.images?.length) {
          out.images = m.images
            .filter((img) => img?.dataUrl)
            .map((img) => ({
              dataUrl: img.dataUrl,
              name: img.name || 'image',
              mime: img.mime
            }));
        }
        if (m.files?.length) {
          out.files = m.files.map((f) => ({
            name: f.name,
            mime: f.mime,
            size: f.size,
            content: f.content
          }));
        }
        if (m.imageGen) out.imageGen = m.imageGen;
        if (m.translateTo) out.translateTo = m.translateTo;
      }
      return out;
    }).filter((m) => m.role === 'user' || m.role === 'assistant');

    return {
      title: convo.title || '',
      model: convo.model || window.Storage.get().currentModel || '',
      messages
    };
  };

  const networkErrorMessage = (err) => {
    const raw = String(err?.message || err || '');
    if (/load failed|failed to fetch|networkerror|cors|blocked/i.test(raw)) {
      return window.I18n?.t?.('shareNetworkError') || raw;
    }
    return raw || (window.I18n?.t?.('shareError') || 'Share failed');
  };

  const create = async (convo) => {
    const endpoint = getEndpoint();
    if (!endpoint) throw new Error(window.I18n?.t?.('shareNotConfigured') || 'Share endpoint not configured');
    const payload = sanitizeForUpload(convo);
    if (!payload || !payload.messages.length) {
      throw new Error(window.I18n?.t?.('shareEmpty') || 'Nothing to share');
    }

    let res;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      throw new Error(networkErrorMessage(err));
    }

    let data = null;
    try {
      data = await res.json();
    } catch {}

    if (!res.ok) {
      const msg = data?.error?.message || ('HTTP ' + res.status);
      throw new Error(msg);
    }
    if (!data?.id) throw new Error(window.I18n?.t?.('shareError') || 'Invalid share response');
    return {
      id: data.id,
      url: buildShareUrl(data.id),
      expiresIn: data.expiresIn || 0
    };
  };

  const fetchShare = async (id) => {
    const endpoint = getEndpoint();
    if (!endpoint) throw new Error(window.I18n?.t?.('shareNotConfigured') || 'Share endpoint not configured');
    let res;
    try {
      res = await fetch(endpoint + '/' + encodeURIComponent(id));
    } catch (err) {
      throw new Error(networkErrorMessage(err));
    }
    let data = null;
    try {
      data = await res.json();
    } catch {}
    if (!res.ok) {
      const msg = data?.error?.message || ('HTTP ' + res.status);
      throw new Error(msg);
    }
    if (!data || !Array.isArray(data.messages)) {
      throw new Error(window.I18n?.t?.('shareLoadError') || 'Invalid share data');
    }
    return data;
  };

  return {
    isConfigured,
    getShareIdFromLocation,
    buildShareUrl,
    create,
    fetchShare
  };
})();
