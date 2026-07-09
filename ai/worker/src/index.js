const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions';
const NVIDIA_API = 'https://integrate.api.nvidia.com/v1/chat/completions';
const BYTEPLUS_API = 'https://ark.ap-southeast.bytepluses.com/api/v3/chat/completions';
const BYTEPLUS_RESPONSES_API = 'https://ark.ap-southeast.bytepluses.com/api/v3/responses';
const ALLOWED_DEEPSEEK_MODELS = new Set(['deepseek-v4-flash', 'deepseek-v4-pro']);
const ALLOWED_NVIDIA_MODELS = new Set([
  'nvidia/nemotron-3-ultra-550b-a55b',
  'nvidia/nemotron-3-super-120b-a12b',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
  'openai/gpt-oss-120b',
  'z-ai/glm-5.2',
  'minimaxai/minimax-m3',
  'minimaxai/minimax-m2.7',
  'stepfun-ai/step-3.7-flash',
  'mistralai/mistral-small-4-119b-2603',
  'mistralai/mistral-medium-3.5-128b'
]);
const ALLOWED_BYTEPLUS_MODELS = new Set(['deepseek-v4-flash-260425', 'glm-5-2-260617', 'gpt-oss-120b-250805']);
const ALLOWED_BYTEPLUS_RESPONSES_MODELS = new Set([
  'seed-2-0-lite-260428',
  'seed-2-0-mini-260428',
  'seed-2-0-pro-260328',
  'seed-2-0-code-preview-260328'
]);

const DEFAULT_ORIGINS = [
  'https://vutaso.com',
  'https://www.vutaso.com',
  'https://vutaso.github.io',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

const parseAllowedOrigins = (env) => {
  const raw = (env.ALLOWED_ORIGINS || '').trim();
  const fromEnv = raw ? raw.split(',').map((o) => o.trim()).filter(Boolean) : [];
  return [...new Set([...DEFAULT_ORIGINS, ...fromEnv])];
};

const resolveOrigin = (requestOrigin, env) => {
  const allowed = parseAllowedOrigins(env);
  if (requestOrigin && allowed.includes(requestOrigin)) return requestOrigin;
  return null;
};

const corsHeaders = (requestOrigin, env) => {
  const origin = resolveOrigin(requestOrigin, env);
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
  if (origin) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
};

// NVIDIA proxy: client gửi API key riêng — cho phép mọi origin (kể cả null / Cursor preview).
const nvidiaCorsHeaders = (requestOrigin) => ({
  'Access-Control-Allow-Origin': requestOrigin || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, ark-beta-mcp',
  'Access-Control-Max-Age': '86400'
});

const nvidiaJsonError = (message, status, requestOrigin) => new Response(JSON.stringify({ error: { message } }), {
  status,
  headers: {
    'Content-Type': 'application/json',
    ...nvidiaCorsHeaders(requestOrigin)
  }
});

const nvidiaStreamResponse = (upstream, requestOrigin) => new Response(upstream.body, {
  status: upstream.status,
  headers: new Headers({
    'Content-Type': upstream.headers.get('Content-Type') || 'text/event-stream',
    'Cache-Control': 'no-cache',
    ...nvidiaCorsHeaders(requestOrigin)
  })
});

const jsonError = (message, status, requestOrigin, env) => new Response(JSON.stringify({ error: { message } }), {
  status,
  headers: {
    'Content-Type': 'application/json',
    ...corsHeaders(requestOrigin, env)
  }
});

const validateDeepseekBody = (body) => {
  if (!body || typeof body !== 'object') return 'Invalid request body';
  if (!ALLOWED_DEEPSEEK_MODELS.has(body.model)) return 'Model not allowed';
  if (!Array.isArray(body.messages) || !body.messages.length) return 'messages is required';
  if (body.stream !== true) return 'stream must be true';
  return null;
};

const validateNvidiaBody = (body) => {
  if (!body || typeof body !== 'object') return 'Invalid request body';
  if (!ALLOWED_NVIDIA_MODELS.has(body.model)) return 'Model not allowed';
  if (!Array.isArray(body.messages) || !body.messages.length) return 'messages is required';
  if (body.stream !== true) return 'stream must be true';
  return null;
};

const validateByteplusBody = (body) => {
  if (!body || typeof body !== 'object') return 'Invalid request body';
  if (!ALLOWED_BYTEPLUS_MODELS.has(body.model)) return 'Model not allowed';
  if (!Array.isArray(body.messages) || !body.messages.length) return 'messages is required';
  if (body.stream !== true) return 'stream must be true';
  return null;
};

const validateByteplusResponsesBody = (body) => {
  if (!body || typeof body !== 'object') return 'Invalid request body';
  if (!ALLOWED_BYTEPLUS_RESPONSES_MODELS.has(body.model)) return 'Model not allowed';
  if (!Array.isArray(body.input) || !body.input.length) return 'input is required';
  if (body.stream !== true) return 'stream must be true';
  return null;
};

const proxyStreamResponse = (upstream, requestOrigin, env) => new Response(upstream.body, {
  status: upstream.status,
  headers: new Headers({
    'Content-Type': upstream.headers.get('Content-Type') || 'text/event-stream',
    'Cache-Control': 'no-cache',
    ...corsHeaders(requestOrigin, env)
  })
});

// --- Share snapshots (KV) ---
const SHARE_ID_RE = /^[a-zA-Z0-9_-]{8,32}$/;
const SHARE_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const SHARE_MAX_BYTES = 900_000; // stay under KV 1 MiB value limit
const SHARE_MAX_MESSAGES = 200;
const SHARE_MAX_TEXT = 100_000;
const SHARE_MAX_IMAGES = 8;
const SHARE_MAX_IMAGE_CHARS = 120_000; // ~90KB base64

// Share create/read: allow any origin (including null / Cursor preview / file://).
// Snapshots are intentionally public; size limits still apply.
const shareCorsHeaders = (requestOrigin) => ({
  'Access-Control-Allow-Origin': requestOrigin || '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
});

const shareJson = (data, status, requestOrigin) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': status === 200 || status === 201 ? 'public, max-age=60' : 'no-store',
    ...shareCorsHeaders(requestOrigin)
  }
});

const shareJsonError = (message, status, requestOrigin) =>
  shareJson({ error: { message } }, status, requestOrigin);

const makeShareId = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  let s = '';
  for (const b of bytes) s += b.toString(16).padStart(2, '0');
  return s; // 24 hex chars
};

const truncateText = (value, max) => {
  const text = typeof value === 'string' ? value : '';
  if (text.length <= max) return text;
  return text.slice(0, max) + '\n\n…';
};

const sanitizeShareImage = (img) => {
  if (!img || typeof img !== 'object') return null;
  const dataUrl = typeof img.dataUrl === 'string' ? img.dataUrl : '';
  if (!dataUrl.startsWith('data:image/') || dataUrl.length > SHARE_MAX_IMAGE_CHARS) return null;
  return {
    dataUrl,
    name: truncateText(String(img.name || 'image'), 120),
    mime: typeof img.mime === 'string' ? img.mime.slice(0, 80) : undefined
  };
};

const sanitizeShareMessage = (m) => {
  if (!m || typeof m !== 'object') return null;
  if (m.role !== 'user' && m.role !== 'assistant') return null;

  const out = {
    role: m.role,
    content: truncateText(m.content || '', SHARE_MAX_TEXT),
    ts: typeof m.ts === 'number' ? m.ts : Date.now()
  };

  if (m.role === 'assistant') {
    if (typeof m.reasoningContent === 'string' && m.reasoningContent) {
      out.reasoningContent = truncateText(m.reasoningContent, SHARE_MAX_TEXT);
    }
    if (m.groundingMetadata && typeof m.groundingMetadata === 'object') {
      out.groundingMetadata = m.groundingMetadata;
    }
    if (Array.isArray(m.generatedImages) && m.generatedImages.length) {
      const images = [];
      for (const img of m.generatedImages) {
        if (images.length >= SHARE_MAX_IMAGES) break;
        const clean = sanitizeShareImage(img);
        if (clean) images.push(clean);
      }
      if (images.length) out.generatedImages = images;
    }
  }

  if (m.role === 'user') {
    if (Array.isArray(m.images) && m.images.length) {
      const images = [];
      for (const img of m.images) {
        if (images.length >= SHARE_MAX_IMAGES) break;
        const clean = sanitizeShareImage(img);
        if (clean) images.push(clean);
      }
      if (images.length) out.images = images;
    }
    if (Array.isArray(m.files) && m.files.length) {
      out.files = m.files.slice(0, 20).map((f) => ({
        name: truncateText(String(f?.name || 'file'), 120),
        mime: typeof f?.mime === 'string' ? f.mime.slice(0, 80) : undefined,
        size: typeof f?.size === 'number' ? f.size : undefined,
        content: truncateText(String(f?.content || ''), 20_000)
      }));
    }
    if (m.imageGen && typeof m.imageGen === 'object') {
      out.imageGen = {
        ratio: String(m.imageGen.ratio || '').slice(0, 40),
        style: String(m.imageGen.style || '').slice(0, 40),
        template: String(m.imageGen.template || '').slice(0, 40)
      };
    }
    if (m.translateTo) out.translateTo = String(m.translateTo).slice(0, 20);
  }

  return out;
};

const buildShareSnapshot = (body) => {
  if (!body || typeof body !== 'object') return { error: 'Invalid request body' };
  if (!Array.isArray(body.messages) || !body.messages.length) {
    return { error: 'messages is required' };
  }
  if (body.messages.length > SHARE_MAX_MESSAGES) {
    return { error: 'Too many messages (max ' + SHARE_MAX_MESSAGES + ')' };
  }

  const messages = [];
  for (const m of body.messages) {
    const clean = sanitizeShareMessage(m);
    if (clean) messages.push(clean);
  }
  if (!messages.length) return { error: 'No valid messages' };

  const snapshot = {
    v: 1,
    title: truncateText(String(body.title || 'Shared chat'), 200),
    model: truncateText(String(body.model || ''), 80),
    createdAt: Date.now(),
    messages
  };

  const encoded = new TextEncoder().encode(JSON.stringify(snapshot));
  if (encoded.byteLength > SHARE_MAX_BYTES) {
    return { error: 'Share payload too large. Remove large images or shorten the chat.' };
  }

  return { snapshot, bytes: encoded.byteLength };
};

const handleShareCreate = async (request, env, origin) => {
  if (!env.SHARES) return shareJsonError('Share storage not configured', 503, origin);
  // Origin check intentionally skipped — share payloads are public by design.

  let body;
  try {
    body = await request.json();
  } catch {
    return shareJsonError('Invalid JSON', 400, origin);
  }

  const built = buildShareSnapshot(body);
  if (built.error) return shareJsonError(built.error, 400, origin);

  const id = makeShareId();
  await env.SHARES.put('share:' + id, JSON.stringify(built.snapshot), {
    expirationTtl: SHARE_TTL_SECONDS
  });

  return shareJson({
    id,
    expiresIn: SHARE_TTL_SECONDS,
    bytes: built.bytes,
    v: 'share-cors-open'
  }, 201, origin);
};

const handleShareGet = async (request, env, origin, id) => {
  if (!env.SHARES) return shareJsonError('Share storage not configured', 503, origin);
  if (!SHARE_ID_RE.test(id)) return shareJsonError('Invalid share id', 400, origin);

  const raw = await env.SHARES.get('share:' + id);
  if (!raw) return shareJsonError('Share not found or expired', 404, origin);

  let snapshot;
  try {
    snapshot = JSON.parse(raw);
  } catch {
    return shareJsonError('Corrupt share data', 500, origin);
  }

  return shareJson(snapshot, 200, origin);
};

const handleDeepseek = async (request, env, origin) => {
  const apiKey = env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return jsonError('Proxy not configured', 503, origin, env);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400, origin, env);
  }

  const validationError = validateDeepseekBody(body);
  if (validationError) {
    return jsonError(validationError, 400, origin, env);
  }

  const upstream = await fetch(DEEPSEEK_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey
    },
    body: JSON.stringify(body)
  });

  return proxyStreamResponse(upstream, origin, env);
};

const handleNvidia = async (request, env, origin) => {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return nvidiaJsonError('Missing Authorization header', 401, origin);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return nvidiaJsonError('Invalid JSON', 400, origin);
  }

  const validationError = validateNvidiaBody(body);
  if (validationError) {
    return nvidiaJsonError(validationError, 400, origin);
  }

  const upstream = await fetch(NVIDIA_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: auth
    },
    body: JSON.stringify(body)
  });

  return nvidiaStreamResponse(upstream, origin);
};

const handleByteplus = async (request, env, origin) => {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return nvidiaJsonError('Missing Authorization header', 401, origin);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return nvidiaJsonError('Invalid JSON', 400, origin);
  }

  const validationError = validateByteplusBody(body);
  if (validationError) {
    return nvidiaJsonError(validationError, 400, origin);
  }

  const upstream = await fetch(BYTEPLUS_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: auth
    },
    body: JSON.stringify(body)
  });

  return nvidiaStreamResponse(upstream, origin);
};

const handleByteplusResponses = async (request, env, origin) => {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return nvidiaJsonError('Missing Authorization header', 401, origin);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return nvidiaJsonError('Invalid JSON', 400, origin);
  }

  const validationError = validateByteplusResponsesBody(body);
  if (validationError) {
    return nvidiaJsonError(validationError, 400, origin);
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: auth
  };
  const mcpHeader = request.headers.get('ark-beta-mcp');
  if (mcpHeader) {
    headers['ark-beta-mcp'] = mcpHeader;
  }

  const upstream = await fetch(BYTEPLUS_RESPONSES_API, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  return nvidiaStreamResponse(upstream, origin);
};

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);
    const { pathname } = url;

    // /share and /share/:id
    const shareMatch = pathname.match(/\/share(?:\/([a-zA-Z0-9_-]{8,32}))?\/?$/);
    if (shareMatch) {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: shareCorsHeaders(origin) });
      }
      if (shareMatch[1]) {
        if (request.method !== 'GET') {
          return shareJsonError('Method not allowed', 405, origin);
        }
        return handleShareGet(request, env, origin, shareMatch[1]);
      }
      if (request.method !== 'POST') {
        return shareJsonError('Method not allowed', 405, origin);
      }
      return handleShareCreate(request, env, origin);
    }

    if (pathname.endsWith('/nvidia')) {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: nvidiaCorsHeaders(origin) });
      }
      if (request.method !== 'POST') {
        return nvidiaJsonError('Method not allowed', 405, origin);
      }
      return handleNvidia(request, env, origin);
    }

    if (pathname.endsWith('/byteplus')) {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: nvidiaCorsHeaders(origin) });
      }
      if (request.method !== 'POST') {
        return nvidiaJsonError('Method not allowed', 405, origin);
      }
      return handleByteplus(request, env, origin);
    }

    if (pathname.endsWith('/byteplus-responses')) {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: nvidiaCorsHeaders(origin) });
      }
      if (request.method !== 'POST') {
        return nvidiaJsonError('Method not allowed', 405, origin);
      }
      return handleByteplusResponses(request, env, origin);
    }

    if (request.method === 'OPTIONS') {
      if (!resolveOrigin(origin, env)) {
        return new Response(null, { status: 403 });
      }
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }

    if (request.method !== 'POST') {
      return jsonError('Method not allowed', 405, origin, env);
    }

    if (pathname.endsWith('/nvidia')) {
      return handleNvidia(request, env, origin);
    }

    if (pathname.endsWith('/byteplus')) {
      return handleByteplus(request, env, origin);
    }

    if (pathname.endsWith('/byteplus-responses')) {
      return handleByteplusResponses(request, env, origin);
    }

    return handleDeepseek(request, env, origin);
  }
};
