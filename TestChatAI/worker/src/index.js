const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions';
const NVIDIA_API = 'https://integrate.api.nvidia.com/v1/chat/completions';
const BYTEPLUS_API = 'https://ark.ap-southeast.bytepluses.com/api/v3/chat/completions';
const BYTEPLUS_RESPONSES_API = 'https://ark.ap-southeast.bytepluses.com/api/v3/responses';
const ALLOWED_DEEPSEEK_MODELS = new Set(['deepseek-v4-flash', 'deepseek-v4-pro']);
const ALLOWED_NVIDIA_MODELS = new Set([
  'deepseek-ai/deepseek-v4-flash',
  'deepseek-ai/deepseek-v4-pro',
  'nvidia/nemotron-3-ultra-550b-a55b',
  'nvidia/nemotron-3-super-120b-a12b',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'z-ai/glm-5.2',
  'minimaxai/minimax-m3',
  'minimaxai/minimax-m2.7',
  'stepfun-ai/step-3.7-flash',
  'stepfun-ai/step-3.5-flash',
  'mistralai/mistral-small-4-119b-2603',
  'mistralai/mistral-medium-3.5-128b',
  'qwen/qwen3.5-397b-a17b',
  'qwen/qwen3.5-122b-a10b',
  'qwen/qwen3-next-80b-a3b-instruct',
  'google/gemma-4-31b-it',
  'google/diffusiongemma-26b-a4b-it'
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
    const { pathname } = new URL(request.url);

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
