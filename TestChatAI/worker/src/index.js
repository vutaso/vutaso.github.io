const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions';
const ALLOWED_MODELS = new Set(['deepseek-v4-flash', 'deepseek-v4-pro']);

const DEFAULT_ORIGINS = [
  'https://vutaso.com',
  'https://www.vutaso.com',
  'https://vutaso.github.io',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:8080',
  'http://127.0.0.1:8080'
];

const parseAllowedOrigins = (env) => {
  const raw = (env.ALLOWED_ORIGINS || '').trim();
  if (!raw) return DEFAULT_ORIGINS;
  return raw.split(',').map((o) => o.trim()).filter(Boolean);
};

const resolveOrigin = (requestOrigin, env) => {
  const allowed = parseAllowedOrigins(env);
  if (requestOrigin && allowed.includes(requestOrigin)) return requestOrigin;
  return allowed[0] || 'https://vutaso.com';
};

const corsHeaders = (requestOrigin, env) => ({
  'Access-Control-Allow-Origin': resolveOrigin(requestOrigin, env),
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
});

const jsonError = (message, status, requestOrigin, env) => new Response(JSON.stringify({ error: { message } }), {
  status,
  headers: {
    'Content-Type': 'application/json',
    ...corsHeaders(requestOrigin, env)
  }
});

const validateBody = (body) => {
  if (!body || typeof body !== 'object') return 'Invalid request body';
  if (!ALLOWED_MODELS.has(body.model)) return 'Model not allowed';
  if (!Array.isArray(body.messages) || !body.messages.length) return 'messages is required';
  if (body.stream !== true) return 'stream must be true';
  return null;
};

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }

    if (request.method !== 'POST') {
      return jsonError('Method not allowed', 405, origin, env);
    }

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

    const validationError = validateBody(body);
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

    const headers = new Headers({
      'Content-Type': upstream.headers.get('Content-Type') || 'text/event-stream',
      'Cache-Control': 'no-cache',
      ...corsHeaders(origin, env)
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers
    });
  }
};
