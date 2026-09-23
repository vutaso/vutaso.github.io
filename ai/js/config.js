window.APP_CONFIG = {
  STORAGE_KEY: 'testchatai',

  MODELS: [
    { id: 'gpt-5.6-luna', label: 'GPT-5.6 Luna', provider: 'openai', webSearch: true, imageGen: true, thinking: true },
    { id: 'gpt-5.6-terra', label: 'GPT-5.6 Terra', provider: 'openai', webSearch: true, imageGen: true, thinking: true },
    { id: 'gpt-5.6-sol', label: 'GPT-5.6 Sol', provider: 'openai', webSearch: true, imageGen: true, thinking: true },
    { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', provider: 'anthropic', webSearch: true, imageGen: false, thinking: true, maxOutputTokens: 64000 },
    { id: 'claude-sonnet-5', label: 'Claude Sonnet 5', provider: 'anthropic', webSearch: true, imageGen: false, thinking: true },
    { id: 'claude-opus-4-8', label: 'Claude Opus 4.8', provider: 'anthropic', webSearch: true, imageGen: false, thinking: true },
    { id: 'claude-opus-5', label: 'Claude Opus 5', provider: 'anthropic', webSearch: true, imageGen: false, thinking: true, thinkingRequired: true },
    { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash', provider: 'deepseek', webSearch: false, imageGen: false, thinking: true, vision: true },
    { id: 'openrouter-glm-flash-latest', apiModel: '~z-ai/glm-flash-latest', label: 'GLM Flash Latest (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, thinkingRequired: true, vision: true, maxOutputTokens: 131072 },
    { id: 'openrouter-deepseek-flash-latest', apiModel: '~deepseek/deepseek-flash-latest', label: 'DeepSeek Flash Latest (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: true },
    { id: 'openrouter-gpt-oss-120b', apiModel: 'openai/gpt-oss-120b', label: 'GPT OSS 120B (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: false },
    { id: 'openrouter-deepseek-v4.1-flash', apiModel: 'deepseek/deepseek-v4.1-flash', label: 'DeepSeek V4.1 Flash (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: true },
    { id: 'openrouter-gpt-5.6-luna', apiModel: 'openai/gpt-5.6-luna', label: 'GPT-5.6 Luna (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: true, maxOutputTokens: 128000 },
    { id: 'openrouter-gpt-5.6-terra', apiModel: 'openai/gpt-5.6-terra', label: 'GPT-5.6 Terra (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: true, maxOutputTokens: 128000 },
    { id: 'openrouter-gpt-5.6-sol', apiModel: 'openai/gpt-5.6-sol', label: 'GPT-5.6 Sol (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: true, maxOutputTokens: 128000 },
    { id: 'openrouter-gemini-3.8-flash', apiModel: 'google/gemini-3.8-flash', label: 'Gemini 3.8 Flash (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: true },
    { id: 'openrouter-kimi-k2.6', apiModel: 'moonshotai/kimi-k2.6', label: 'Kimi K2.6 (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: true },
    { id: 'openrouter-kimi-k3', apiModel: 'moonshotai/kimi-k3', label: 'Kimi K3 (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: true, maxOutputTokens: 128000 },
    { id: 'openrouter-claude-haiku-latest', apiModel: '~anthropic/claude-haiku-latest', label: 'Claude Haiku Latest (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: true, maxOutputTokens: 64000 },
    { id: 'openrouter-claude-sonnet-latest', apiModel: '~anthropic/claude-sonnet-latest', label: 'Claude Sonnet Latest (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: true, maxOutputTokens: 128000 },
    { id: 'openrouter-claude-opus-latest', apiModel: '~anthropic/claude-opus-latest', label: 'Claude Opus Latest (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, thinkingRequired: true, vision: true, maxOutputTokens: 128000 },
    { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro', provider: 'deepseek', webSearch: false, imageGen: false, thinking: true, vision: false },
    { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', provider: 'google', webSearch: true, imageGen: true, thinking: true },
    { id: 'kimi-k2.5', label: 'Kimi K2.5', provider: 'kimi', webSearch: false, imageGen: false, thinking: true },
    { id: 'kimi-k2.6', label: 'Kimi K2.6', provider: 'kimi', webSearch: false, imageGen: false, thinking: true },
    { id: 'kimi-k2.7-code', label: 'Kimi K2.7 Code', provider: 'kimi', webSearch: false, imageGen: false, thinking: true, thinkingRequired: true },
    { id: 'kimi-k2.7-code-highspeed', label: 'Kimi K2.7 Code HighSpeed', provider: 'kimi', webSearch: false, imageGen: false, thinking: true, thinkingRequired: true }
  ],

  // USD per 1M tokens — giá chuẩn (cache miss / standard tier), cập nhật 2026-09-20
  // Nguồn: openai.com/developers, platform.claude.com, api-docs.deepseek.com,
  //        ai.google.dev/gemini-api/docs/pricing, platform.kimi.ai, openrouter.ai/api/v1/models
  MODEL_PRICING: {
    'gpt-5.6-sol': { input: 5.00, output: 30.00 },
    'gpt-5.6-terra': { input: 2.00, output: 12.00 },
    'gpt-5.6-luna': { input: 0.20, output: 1.20 },
    'claude-haiku-4-5': { input: 1.00, output: 5.00 },
    'claude-sonnet-5': { input: 3.00, output: 15.00 },
    'claude-opus-4-8': { input: 5.00, output: 25.00 },
    'claude-opus-5': { input: 5.00, output: 25.00 },
    'deepseek-v4-flash': { input: 0.14, output: 0.28 },
    'openrouter-glm-flash-latest': { input: 0.075, output: 0.25 },
    'openrouter-deepseek-flash-latest': { input: 0.13, output: 0.52 },
    'openrouter-gpt-oss-120b': { input: 0.15, output: 0.60 },
    'openrouter-deepseek-v4.1-flash': { input: 0.15, output: 0.60 },
    'openrouter-gpt-5.6-luna': { input: 0.20, output: 1.20 },
    'openrouter-gemini-3.8-flash': { input: 0.75, output: 3.75 },
    'openrouter-kimi-k2.6': { input: 0.95, output: 4.00 },
    'openrouter-claude-haiku-latest': { input: 1.00, output: 5.00 },
    'openrouter-kimi-k3': { input: 1.70, output: 8.50 },
    'openrouter-gpt-5.6-sol': { input: 2.00, output: 10.00 },
    'openrouter-claude-sonnet-latest': { input: 2.00, output: 10.00 },
    'openrouter-gpt-5.6-terra': { input: 2.00, output: 12.00 },
    'openrouter-claude-opus-latest': { input: 5.00, output: 25.00 },
    'deepseek-v4-pro': { input: 0.435, output: 0.87 },
    'gemini-3.8-flash': { input: 0.75, output: 3.75 },
    'kimi-k2.5': { input: 0.60, output: 3.00 },
    'kimi-k2.6': { input: 0.95, output: 4.00 },
    'kimi-k2.7-code': { input: 0.95, output: 4.00 },
    'kimi-k2.7-code-highspeed': { input: 1.90, output: 8.00 }
  },

  TOKEN_COST_WARNING_USD: 1,

  COMPRESS_MIN_MESSAGES: 10,
  COMPRESS_KEEP_RECENT_MESSAGES: 4,
  COMPRESS_MAX_TRANSCRIPT_CHARS: 100000,

  COMPARE_MIN_MODELS: 2,
  COMPARE_MAX_MODELS: 3,

  DEFAULT_MODEL: 'deepseek-v4-flash',
  DEFAULT_LOCALE: 'en',
  LOCALES: ['en', 'vi', 'jp', 'zh'],

  PROVIDERS: [
    { id: 'anthropic', label: 'Anthropic' },
    { id: 'openai', label: 'OpenAI' },
    { id: 'deepseek', label: 'DeepSeek' },
    { id: 'kimi', label: 'Kimi' },
    { id: 'google', label: 'Gemini' },
    { id: 'openrouter', label: 'OpenRouter' }
  ],

  PROVIDER_LOGOS: {
    openai: 'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z',
    anthropic: 'M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z',
    deepseek: 'M23.748 4.651c-.254-.124-.364.113-.512.233-.051.04-.094.09-.137.137-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.155-.708-.311-.955-.65-.172-.24-.219-.509-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.094.172.187.129.323-.082.28-.18.553-.266.833-.055.179-.137.218-.328.14a5.5 5.5 0 0 1-1.737-1.179c-.857-.828-1.631-1.743-2.597-2.46a12 12 0 0 0-.689-.47c-.985-.957.13-1.743.387-1.836.27-.098.094-.433-.778-.428-.872.003-1.67.295-2.687.685a3 3 0 0 1-.465.136 9.6 9.6 0 0 0-2.883-.101c-1.885.21-3.39 1.1-4.497 2.622C.082 8.776-.231 10.854.152 13.02c.403 2.284 1.568 4.175 3.36 5.653 1.857 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.132-.284 4.994-1.86.47.234.962.328 1.78.398.629.058 1.235-.031 1.705-.129.735-.155.684-.836.418-.961-2.155-1.004-1.682-.595-2.112-.926 1.095-1.295 2.768-3.598 3.284-6.733.05-.346.115-.834.108-1.114-.004-.171.035-.238.23-.257a4.2 4.2 0 0 0 1.545-.475c1.397-.763 1.96-2.016 2.093-3.517.02-.23-.004-.467-.247-.588M11.58 18.168c-2.088-1.642-3.101-2.183-3.52-2.16-.39.024-.32.472-.234.763.09.288.207.487.371.74.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.168-1.361-.801-2.5-1.86-3.301-3.306-.775-1.393-1.225-2.888-1.299-4.482-.02-.385.094-.522.477-.592a4.7 4.7 0 0 1 1.53-.038c2.131.311 3.946 1.264 5.467 2.774.868.86 1.525 1.887 2.202 2.89.72 1.066 1.494 2.082 2.48 2.915.348.291.626.513.892.677-.802.09-2.14.109-3.055-.615zm1.001-6.44a.306.306 0 0 1 .415-.287.3.3 0 0 1 .113.074.3.3 0 0 1 .086.214c0 .17-.136.307-.308.307a.303.303 0 0 1-.306-.307m3.11 1.596c-.2.081-.4.151-.591.16a1.25 1.25 0 0 1-.798-.254c-.274-.23-.47-.358-.551-.758a1.7 1.7 0 0 1 .015-.588c.07-.327-.007-.537-.238-.727-.188-.156-.426-.199-.689-.199a.6.6 0 0 1-.254-.078.253.253 0 0 1-.114-.358 1 1 0 0 1 .192-.21c.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.392.451.462.576.685.915.176.264.336.536.446.848.066.194-.02.353-.25.45',
    kimi: 'M21.765.351C22.998.351 24 1.353 24 2.586S22.998 4.82 21.765 4.82h-1.974c-.15 0-.26-.12-.26-.26V2.586A2.237 2.237 0 0 1 21.765.35M9.41 13.388l8.447-8.377c.16-.16.07-.471-.14-.471h-4.55s-.1.02-.14.06l-9.099 9.029c-.14.14-.35.02-.35-.21V4.81c0-.15-.1-.27-.221-.27H.22c-.12 0-.22.12-.22.27v18.57c0 .15.1.27.22.27h3.137c.12 0 .22-.12.22-.27v-3.79c0-.08.03-.16.08-.21l2.826-2.796c.07-.07.16-.08.241-.03l7.546 5.551a8.9 8.9 0 0 0 4.018 1.493c.12.01.23-.11.23-.27V19.76c0-.14-.08-.25-.19-.26a5.8 5.8 0 0 1-2.355-.942l-6.533-4.73c-.14-.09-.15-.32-.03-.441',
    google: 'M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81',
    openrouter: 'M16.778 1.844v1.919q-.569-.026-1.138-.032-.708-.008-1.415.037c-1.93.126-4.023.728-6.149 2.237-2.911 2.066-2.731 1.95-4.14 2.75-.396.223-1.342.574-2.185.798-.841.225-1.753.333-1.751.333v4.229s.768.108 1.61.333c.842.224 1.789.575 2.185.799 1.41.798 1.228.683 4.14 2.75 2.126 1.509 4.22 2.11 6.148 2.236.88.058 1.716.041 2.555.005v1.918l7.222-4.168-7.222-4.17v2.176c-.86.038-1.611.065-2.278.021-1.364-.09-2.417-.357-3.979-1.465-2.244-1.593-2.866-2.027-3.68-2.508.889-.518 1.449-.906 3.822-2.59 1.56-1.109 2.614-1.377 3.978-1.466.667-.044 1.418-.017 2.278.02v2.176L24 6.014Z'
  },

  // Tuỳ chỉnh gọi API (để trống max output = dùng mặc định của provider)
  API_MAX_OUTPUT_TOKENS: 65536,
  REASONING_EFFORT: 'high',
  SEARCH_CONTEXT_SIZE: 'high',
  WEB_SEARCH_MAX_USES: 5,

  DEFAULT_EFFORT: 'high',

  EFFORT_LEVELS: {
    openai:    ['low', 'medium', 'high'],
    anthropic: ['low', 'medium', 'high', 'xhigh', 'max'],
    google:    ['low', 'medium', 'high'],
    deepseek:  ['default', 'high', 'max'],
    openrouter: ['low', 'medium', 'high'],
    kimi:      [] // binary thinking only: enabled/disabled via Thinking toggle
  },

  MODEL_EFFORT_LEVELS: {
    'gpt-5.6-sol': ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'],
    'gpt-5.6-terra': ['low', 'medium', 'high', 'xhigh', 'max'],
    'gpt-5.6-luna': ['low', 'medium', 'high', 'xhigh', 'max'],
    'claude-opus-4-8': ['low', 'medium', 'high', 'xhigh', 'max'],
    'claude-opus-5': ['low', 'medium', 'high', 'xhigh', 'max'],
    'claude-sonnet-5': ['low', 'medium', 'high', 'max'],
    'gemini-3.8-flash': ['minimal', 'low', 'medium', 'high'],
    'openrouter-gpt-oss-120b': ['low', 'medium', 'high'],
    'openrouter-deepseek-v4.1-flash': ['high', 'xhigh'],
    'openrouter-deepseek-flash-latest': ['low', 'high', 'max'],
    'openrouter-glm-flash-latest': ['low', 'high', 'max'],
    'openrouter-claude-haiku-latest': ['low', 'medium', 'high'],
    'openrouter-claude-sonnet-latest': ['low', 'medium', 'high', 'max'],
    'openrouter-claude-opus-latest': ['low', 'medium', 'high', 'xhigh', 'max'],
    'openrouter-gemini-3.8-flash': ['minimal', 'low', 'medium', 'high'],
    'openrouter-kimi-k2.6': ['low', 'medium', 'high'],
    'openrouter-kimi-k3': ['max'],
    'openrouter-gpt-5.6-sol': ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'],
    'openrouter-gpt-5.6-terra': ['low', 'medium', 'high', 'xhigh', 'max'],
    'openrouter-gpt-5.6-luna': ['low', 'medium', 'high', 'xhigh', 'max']
  },

  ANTHROPIC_HAIKU_THINKING_BUDGET: 16384,

  getEffortLevels(modelId) {
    if (this.modelUsesAnthropicManualThinking(modelId)) {
      return [];
    }
    if (this.modelUsesBinaryThinking(modelId)) {
      return [];
    }
    if (this.MODEL_EFFORT_LEVELS[modelId]) {
      return this.MODEL_EFFORT_LEVELS[modelId];
    }
    const provider = this.getModelProvider(modelId);
    return this.EFFORT_LEVELS[provider] || [];
  },

  modelSupportsEffort(modelId) {
    return this.getEffortLevels(modelId).length > 0;
  },

  modelEffortDropdownAlwaysEnabled(modelId) {
    return this.modelUsesEffortLinkedThinking(modelId);
  },

  modelUsesEffortLinkedThinking(modelId) {
    if (this.modelUsesGptOssReasoning(modelId)) return false;
    if (this.modelUsesOpenRouterReasoning(modelId)) return false;
    return this.getModelProvider(modelId) === 'deepseek';
  },

  modelUsesBinaryThinking(modelId) {
    return this.getModelProvider(modelId) === 'kimi';
  },

  getKimiThinkingConfig(modelId, thinkingEnabled) {
    if (this.kimiRequiresPreservedThinking(modelId)) {
      return { type: 'enabled', keep: 'all' };
    }
    if (this.modelThinkingRequired(modelId)) {
      return { type: 'enabled' };
    }
    return { type: thinkingEnabled ? 'enabled' : 'disabled' };
  },

  normalizeDeepSeekEffort(effort) {
    if (effort === 'max' || effort === 'xhigh') return 'max';
    if (effort === 'default') return 'default';
    return 'high';
  },

  getDeepSeekThinkingConfig(reasoningEffort, thinkingEnabled) {
    const effort = this.normalizeDeepSeekEffort(reasoningEffort);
    if (effort === 'default' || !thinkingEnabled) {
      return { thinking: false };
    }
    return { thinking: true, reasoning_effort: effort };
  },

  normalizeEffortForModel(effort, modelId) {
    const levels = this.getEffortLevels(modelId);
    if (!levels.length) return effort;

    if (this.modelUsesEffortLinkedThinking(modelId)) {
      const normalized = this.normalizeDeepSeekEffort(effort);
      return levels.includes(normalized) ? normalized : 'high';
    }

    if (effort === 'default') {
      const preferred = this.getDefaultEffortForModel(modelId);
      return levels.includes(preferred) ? preferred : levels[0];
    }

    if (levels.includes(effort)) return effort;

    const provider = this.getModelProvider(modelId);
    if (provider === 'anthropic') {
      if (effort === 'xhigh' && levels.includes('max')) return 'max';
      if ((effort === 'max' || effort === 'xhigh') && levels.includes('high')) return 'high';
    }

    if (provider === 'openai' || provider === 'google') {
      if (effort === 'max' || effort === 'xhigh') return this.getDefaultEffortForModel(modelId);
      if (provider === 'google' && effort === 'minimal' && !levels.includes('minimal') && levels.includes('low')) {
        return 'low';
      }
    }

    return levels.includes(this.getDefaultEffortForModel(modelId))
      ? this.getDefaultEffortForModel(modelId)
      : levels[levels.length - 1];
  },

  getDefaultEffortForModel(modelId) {
    if (modelId === 'gemini-3.8-flash' || modelId === 'openrouter-gemini-3.8-flash') return 'medium';
    if (modelId === 'openrouter-gpt-oss-120b') return 'medium';
    if (modelId === 'openrouter-deepseek-v4.1-flash' || modelId === 'openrouter-deepseek-flash-latest') return 'high';
    if (modelId === 'gpt-5.6-luna' || modelId === 'openrouter-gpt-5.6-luna') return 'low';
    if (modelId === 'gpt-5.6-terra' || modelId === 'openrouter-gpt-5.6-terra') return 'medium';
    if (modelId === 'openrouter-kimi-k3' || modelId === 'openrouter-glm-flash-latest') return 'max';
    if (modelId === 'gpt-5.6-sol' || modelId === 'openrouter-claude-haiku-latest' || modelId === 'openrouter-claude-sonnet-latest' || modelId === 'openrouter-claude-opus-latest' || modelId === 'openrouter-kimi-k2.6' || modelId === 'openrouter-gpt-5.6-sol') return 'high';
    return this.DEFAULT_EFFORT;
  },

  normalizeGeminiEffort(effort, modelId) {
    return this.normalizeEffortForModel(
      effort || this.getDefaultEffortForModel(modelId),
      modelId
    );
  },

  getGeminiThinkingConfig(modelId, effort) {
    const config = { includeThoughts: true };
    const normalized = this.normalizeGeminiEffort(effort, modelId);
    if (this.modelUsesGeminiThinkingLevel(modelId)) {
      config.thinkingLevel = normalized;
      return config;
    }
    config.thinkingBudget = this.getGeminiThinkingBudget(modelId, normalized);
    return config;
  },

  normalizeAnthropicApiEffort(modelId, effort) {
    return this.normalizeEffortForModel(effort || this.DEFAULT_EFFORT, modelId);
  },

  modelUsesGeminiThinkingLevel(modelId) {
    return /^gemini-3/.test(modelId || '');
  },

  modelUsesAnthropicAdaptiveThinking(modelId) {
    const id = modelId || '';
    return id === 'claude-sonnet-5' || id === 'claude-opus-4-8' || id === 'claude-opus-5';
  },

  modelUsesAnthropicManualThinking(modelId) {
    return modelId === 'claude-haiku-4-5';
  },

  getGeminiThinkingBudget(modelId, effort) {
    const map = { low: 4096, medium: -1, high: 24576 };
    return map[effort] ?? map.high;
  },

  getAnthropicHaikuThinkingBudget(modelId) {
    const cap = this.getMaxOutputTokens(modelId) || 64000;
    const budget = this.ANTHROPIC_HAIKU_THINKING_BUDGET;
    return Math.min(budget, Math.max(1024, cap - 1));
  },

  getProviders() {
    const ids = new Set(this.MODELS.map((m) => m.provider));
    return this.PROVIDERS.filter((p) => ids.has(p.id));
  },

  getProviderLogoHTML(providerId) {
    const d = this.PROVIDER_LOGOS[providerId];
    if (!d) return '';
    return '<svg class="provider-logo" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="' + d + '"/></svg>';
  },

  getModelsByProvider(providerId) {
    return this.MODELS.filter((m) => m.provider === providerId);
  },

  getModelDisplayLabel(model) {
    if (!model) return '';
    if (model.shortLabel) return model.shortLabel;
    return model.label.replace(/\s*\(OpenRouter\)\s*$/, '');
  },

  getModel(modelId) {
    const id = modelId || this.DEFAULT_MODEL;
    return this.MODELS.find((m) => m.id === id) || this.MODELS[0];
  },

  getApiModel(modelId) {
    const model = this.getModel(modelId);
    return model.apiModel || model.id;
  },

  getModelPricing(modelId) {
    return this.MODEL_PRICING[modelId || this.DEFAULT_MODEL] || null;
  },

  calcTokenUsageCost(modelId, usage) {
    const pricing = this.getModelPricing(modelId);
    if (!pricing || !usage) return null;
    const prompt = Number(usage.prompt) || 0;
    const completion = Number(usage.completion) || 0;
    if (!prompt && !completion) return 0;
    const inputCost = (prompt / 1_000_000) * pricing.input;
    const outputCost = (completion / 1_000_000) * pricing.output;
    return inputCost + outputCost;
  },

  getSortedModelPricing() {
    const providerLabel = (id) => this.PROVIDERS.find((p) => p.id === id)?.label || id;
    return this.MODELS
      .map((m) => ({ model: m, pricing: this.MODEL_PRICING[m.id] }))
      .filter((row) => row.pricing)
      .sort((a, b) => {
        const diff = a.pricing.input - b.pricing.input;
        if (diff !== 0) return diff;
        return a.pricing.output - b.pricing.output;
      })
      .map((row) => ({
        id: row.model.id,
        label: row.model.label,
        provider: row.model.provider,
        providerLabel: providerLabel(row.model.provider),
        input: row.pricing.input,
        output: row.pricing.output
      }));
  },

  getMaxOutputTokens(modelId) {
    const configured = this.API_MAX_OUTPUT_TOKENS;
    if (!configured) return null;
    if (this.getModelProvider(modelId) === 'openrouter') {
      // OpenRouter từ chối request nếu max_tokens vượt số credit còn lại — để null = không gửi max_tokens.
      return this.OPENROUTER_MAX_OUTPUT_TOKENS || null;
    }
    const cap = this.getModel(modelId).maxOutputTokens;
    return cap ? Math.min(configured, cap) : configured;
  },

  getModelProvider(modelId) {
    return this.getModel(modelId).provider || 'openai';
  },

  getApiKey(state, modelId) {
    const provider = this.getModelProvider(modelId);
    if (provider === 'anthropic') return state.anthropicApiKey || '';
    if (provider === 'deepseek') return state.deepseekApiKey || '';
    if (provider === 'openrouter') return state.openrouterApiKey || '';
    if (provider === 'google') return state.geminiApiKey || '';
    if (provider === 'kimi') return state.kimiApiKey || '';
    return state.apiKey || '';
  },

  getMissingApiKeyMessage(modelId) {
    if (window.I18n) return window.I18n.getMissingApiKeyMessage(modelId);
    const provider = this.getModelProvider(modelId);
    if (provider === 'anthropic') return 'Enter your Anthropic API key in Settings first';
    if (provider === 'deepseek') return 'Enter your DeepSeek API key in Settings first';
    if (provider === 'openrouter') return 'Enter your OpenRouter API key in Settings first';
    if (provider === 'google') return 'Enter your Gemini API key in Settings first';
    if (provider === 'kimi') return 'Enter your Kimi API key in Settings first';
    return 'Enter your API key in Settings first';
  },

  getMissingApiKeyError(modelId) {
    if (window.I18n) return window.I18n.getMissingApiKeyError(modelId);
    const provider = this.getModelProvider(modelId);
    if (provider === 'anthropic') return 'No Anthropic API key. Open Settings to enter one.';
    if (provider === 'deepseek') return 'No DeepSeek API key. Open Settings to enter one.';
    if (provider === 'openrouter') return 'No OpenRouter API key. Open Settings to enter one.';
    if (provider === 'google') return 'No Gemini API key. Open Settings to enter one.';
    if (provider === 'kimi') return 'No Kimi API key. Open Settings to enter one.';
    return 'No API key. Open Settings to enter one.';
  },

  formatApiError(err, modelId) {
    return err?.message || String(err || '');
  },

  hasApiKey(state, modelId) {
    return !!this.getApiKey(state, modelId);
  },

  modelSupportsWebSearch(modelId) {
    const m = this.MODELS.find((x) => x.id === modelId);
    return !!(m && m.webSearch);
  },

  modelSupportsImageGen(modelId) {
    const m = this.MODELS.find((x) => x.id === modelId);
    return !!(m && m.imageGen);
  },

  modelSupportsThinking(modelId) {
    const m = this.MODELS.find((x) => x.id === modelId);
    return !!(m && m.thinking);
  },

  modelThinkingRequired(modelId) {
    const m = this.MODELS.find((x) => x.id === modelId);
    return !!(m && m.thinkingRequired);
  },

  kimiRequiresPreservedThinking(modelId) {
    const id = modelId || '';
    return id === 'kimi-k2.7-code' || id === 'kimi-k2.7-code-highspeed';
  },

  modelSupportsVision(modelId) {
    const m = this.MODELS.find((x) => x.id === modelId);
    return m ? m.vision !== false : true;
  },

  modelHasComposerTools(modelId) {
    return this.modelSupportsWebSearch(modelId)
      || this.modelSupportsImageGen(modelId)
      || this.modelSupportsThinking(modelId)
      || true;
  },

  TRANSLATE_LANGUAGES: [
    { code: 'en', label: 'English' },
    { code: 'vi', label: 'Tiếng Việt' },
    { code: 'zh', label: '中文' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
    { code: 'ar', label: 'العربية' },
    { code: 'de', label: 'Deutsch' },
    { code: 'es', label: 'Español' },
    { code: 'es-ES', label: 'Español (España)' },
    { code: 'fil', label: 'Filipino' },
    { code: 'fr', label: 'Français' },
    { code: 'id', label: 'Bahasa Indonesia' },
    { code: 'it', label: 'Italiano' },
    { code: 'ms', label: 'Bahasa Melayu' }
  ],

  DEFAULT_TRANSLATE_LANG: 'en',

  getTranslateLanguage(code) {
    const langs = this.TRANSLATE_LANGUAGES;
    return langs.find((l) => l.code === code) || langs[0];
  },

  getTranslateLabel(code) {
    if (window.I18n) return window.I18n.getTranslateLabel(code);
    return 'Translate to ' + this.getTranslateLanguage(code).label;
  },

  IMAGE_GEN_RATIOS: [
    { id: '1:1', label: '1:1', desc: 'ảnh hồ sơ', size: '1024x1024', w: 1, h: 1 },
    { id: '2:3', label: '2:3', desc: 'ảnh tự sướng trên mạng xã hội', size: '1024x1536', w: 2, h: 3 },
    { id: '3:4', label: '3:4', desc: 'ảnh cổ điển', size: '1152x1536', w: 3, h: 4 },
    { id: '4:3', label: '4:3', desc: 'hình minh họa trong bài viết', size: '1536x1152', w: 4, h: 3 },
    { id: '9:16', label: '9:16', desc: 'hình nền thiết bị di động, dọc', size: '1152x2048', w: 9, h: 16 },
    { id: '16:9', label: '16:9', desc: 'hình nền máy tính, ngang', size: '2048x1152', w: 16, h: 9 }
  ],

  IMAGE_GEN_STYLES: [
    { id: 'auto', label: 'Tự động', prompt: '' },
    { id: 'photo', label: 'Ảnh thật', prompt: 'Phong cách ảnh chụp thực tế, chi tiết cao.' },
    { id: 'illustration', label: 'Minh họa', prompt: 'Phong cách minh họa kỹ thuật số.' },
    { id: 'anime', label: 'Anime', prompt: 'Phong cách anime Nhật Bản.' },
    { id: 'oil', label: 'Tranh sơn dầu', prompt: 'Phong cách tranh sơn dầu cổ điển.' },
    { id: 'pixel', label: 'Pixel art', prompt: 'Phong cách pixel art retro.' }
  ],

  IMAGE_GEN_TEMPLATES: [
    { id: 'none', label: 'Không dùng mẫu', prompt: '' },
    { id: 'portrait', label: 'Chân dung', prompt: 'Bố cục chân dung chuyên nghiệp.' },
    { id: 'product', label: 'Sản phẩm', prompt: 'Ảnh sản phẩm trên nền sạch, ánh sáng studio.' },
    { id: 'logo', label: 'Logo', prompt: 'Thiết kế logo tối giản, vector-like.' },
    { id: 'abstract', label: 'Nền trừu tượng', prompt: 'Hình nền trừu tượng, không có chủ thể rõ.' },
    { id: 'minimal', label: 'Tối giản', prompt: 'Bố cục tối giản, nhiều khoảng trống.' }
  ],

  DEFAULT_IMAGE_GEN_RATIO: '1:1',
  DEFAULT_IMAGE_GEN_STYLE: 'auto',
  DEFAULT_IMAGE_GEN_TEMPLATE: 'none',

  getImageGenRatio(id) {
    return this.IMAGE_GEN_RATIOS.find((r) => r.id === id) || this.IMAGE_GEN_RATIOS[0];
  },

  getImageGenStyle(id) {
    return this.IMAGE_GEN_STYLES.find((s) => s.id === id) || this.IMAGE_GEN_STYLES[0];
  },

  getImageGenTemplate(id) {
    return this.IMAGE_GEN_TEMPLATES.find((t) => t.id === id) || this.IMAGE_GEN_TEMPLATES[0];
  },

  buildImageGenPrompt(text, { ratioId, styleId, templateId }) {
    const hints = [];
    const style = this.getImageGenStyle(styleId);
    const template = this.getImageGenTemplate(templateId);
    const ratio = this.getImageGenRatio(ratioId);
    if (style.prompt) hints.push(style.prompt);
    if (template.prompt) hints.push(template.prompt);
    hints.push('Tỷ lệ khung hình ' + ratio.label + '.');
    const base = (text || '').trim();
    if (!hints.length) return base;
    return base ? base + '\n\n' + hints.join(' ') : hints.join(' ');
  },
  DEFAULT_SYSTEM_PROMPT: 'Bạn là một trợ lý AI thông minh, tận tâm và chính xác. Hãy tuân thủ các nguyên tắc sau:\n\n1. Suy nghĩ từng bước trước khi trả lời các câu hỏi phức tạp.\n2. Trả lời chi tiết, đầy đủ và có cấu trúc rõ ràng. Sử dụng markdown để định dạng khi cần (tiêu đề, danh sách, bảng, code block).\n3. Nếu không chắc chắn, hãy nói rõ giới hạn kiến thức của bạn thay vì bịa đặt.\n4. Khi được hỏi về code hoặc kỹ thuật, hãy giải thích nguyên lý đằng sau, không chỉ đưa ra code.\n5. Luôn trả lời bằng tiếng Việt, trừ khi người dùng yêu cầu ngôn ngữ khác.\n6. Đưa ra ví dụ cụ thể khi có thể để minh họa cho câu trả lời.',
  DEFAULT_THEME: 'claude-dark',

  OPENAI_ENDPOINT: 'https://api.openai.com/v1/chat/completions',
  RESPONSES_ENDPOINT: 'https://api.openai.com/v1/responses',
  ANTHROPIC_ENDPOINT: 'https://api.anthropic.com/v1/messages',
  ANTHROPIC_VERSION: '2023-06-01',
  DEEPSEEK_ENDPOINT: 'https://api.deepseek.com/v1/chat/completions',
  // Share snapshots: POST create / GET /share/:id (Cloudflare KV)
  SHARE_ENDPOINT: 'https://testchatai-deepseek-proxy.vutaso-chatai.workers.dev/share',
  OPENROUTER_ENDPOINT: 'https://openrouter.ai/api/v1/chat/completions',
  OPENROUTER_IMAGES_ENDPOINT: 'https://openrouter.ai/api/v1/images',
  // Để null: không gửi max_tokens (OpenRouter tự giới hạn theo credit). Đặt số (vd. 8192) nếu tài khoản có đủ credit.
  OPENROUTER_MAX_OUTPUT_TOKENS: 32768,
  KIMI_ENDPOINT: 'https://api.moonshot.ai/v1/chat/completions',
  GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models',

  geminiStreamUrl(modelId) {
    return this.GEMINI_API_BASE + '/' + modelId + ':streamGenerateContent?alt=sse';
  },

  modelUsesGptOssReasoning(modelId) {
    return /gpt-oss/i.test(this.getApiModel(modelId));
  },

  modelUsesOpenRouterReasoning(modelId) {
    return this.getModelProvider(modelId) === 'openrouter';
  },

  getOpenRouterThinkingConfig(modelId, thinkingEnabled, reasoningEffort) {
    const required = this.modelThinkingRequired(modelId);
    if (!thinkingEnabled && !required) return null;
    const effort = this.normalizeEffortForModel(
      reasoningEffort || this.getDefaultEffortForModel(modelId),
      modelId
    );
    return { enabled: true, effort };
  },

  getOpenRouterEndpoint() {
    return this.OPENROUTER_ENDPOINT;
  },

  getOpenRouterImagesEndpoint() {
    return this.OPENROUTER_IMAGES_ENDPOINT;
  },

  modelUsesOpenRouterImages(modelId) {
    return this.getModel(modelId).apiMode === 'openrouter-images';
  },

  openRouterImagesSupportsAspectRatio(modelId) {
    return this.modelUsesOpenRouterImages(modelId);
  },

  GEMINI_IMAGE_MODEL_MAP: {
    'gemini-3.8-flash': 'gemini-3.1-flash-image'
  },

  getGeminiImageModel(modelId) {
    return this.GEMINI_IMAGE_MODEL_MAP[modelId] || 'gemini-3.1-flash-image';
  },

  geminiSupportsImageAspectRatio(modelId) {
    const imageModel = this.getGeminiImageModel(modelId);
    return new Set(['gemini-3.1-flash-image', 'gemini-3.1-flash-lite-image']).has(imageModel);
  },

  ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],

  CODE_FILE_EXTENSIONS: [
    '.css', '.scss', '.sass', '.less',
    '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.vue', '.svelte',
    '.py', '.pyw', '.pyi', '.java', '.kt', '.kts', '.scala', '.sc',
    '.c', '.cc', '.cpp', '.cxx', '.h', '.hpp', '.hh', '.hxx',
    '.m', '.mm', '.swift',
    '.go', '.rs', '.rb', '.php', '.cs', '.fs', '.vb',
    '.sh', '.bash', '.zsh', '.ps1',
    '.sql', '.r', '.lua', '.dart', '.pl', '.pm',
    '.hs', '.ex', '.exs', '.clj', '.cljs',
    '.zig', '.nim', '.groovy', '.gradle',
    '.asm', '.s', '.f', '.f90', '.toml', '.ini'
  ],

  FILE_EXTENSION_LANGUAGES: {
    '.css': 'css', '.scss': 'scss', '.sass': 'sass', '.less': 'less',
    '.js': 'javascript', '.mjs': 'javascript', '.cjs': 'javascript',
    '.ts': 'typescript', '.tsx': 'tsx', '.jsx': 'jsx', '.vue': 'vue', '.svelte': 'svelte',
    '.py': 'python', '.pyw': 'python', '.pyi': 'python',
    '.java': 'java', '.kt': 'kotlin', '.kts': 'kotlin',
    '.scala': 'scala', '.sc': 'scala',
    '.c': 'c', '.cc': 'cpp', '.cpp': 'cpp', '.cxx': 'cpp',
    '.h': 'c', '.hpp': 'cpp', '.hh': 'cpp', '.hxx': 'cpp',
    '.m': 'objectivec', '.mm': 'objectivec', '.swift': 'swift',
    '.go': 'go', '.rs': 'rust', '.rb': 'ruby', '.php': 'php',
    '.cs': 'csharp', '.fs': 'fsharp', '.vb': 'vbnet',
    '.sh': 'bash', '.bash': 'bash', '.zsh': 'bash', '.ps1': 'powershell',
    '.sql': 'sql', '.r': 'r', '.lua': 'lua', '.dart': 'dart',
    '.pl': 'perl', '.pm': 'perl', '.hs': 'haskell',
    '.ex': 'elixir', '.exs': 'elixir', '.clj': 'clojure', '.cljs': 'clojure',
    '.zig': 'zig', '.nim': 'nim', '.groovy': 'groovy', '.gradle': 'groovy',
    '.asm': 'asm', '.s': 'asm', '.f': 'fortran', '.f90': 'fortran',
    '.json': 'json', '.xml': 'xml', '.html': 'html', '.htm': 'html',
    '.yaml': 'yaml', '.yml': 'yaml', '.toml': 'toml', '.ini': 'ini',
    '.md': 'markdown', '.markdown': 'markdown'
  },

  ACCEPTED_FILE_EXTENSIONS: [
    '.txt', '.md', '.markdown', '.csv', '.json', '.xml', '.html', '.htm',
    '.yaml', '.yml', '.log', '.rtf', '.pdf', '.docx', '.xlsx',
    '.css', '.scss', '.sass', '.less',
    '.js', '.mjs', '.cjs', '.ts', '.jsx', '.tsx', '.vue', '.svelte',
    '.py', '.pyw', '.pyi', '.java', '.kt', '.kts', '.scala', '.sc',
    '.c', '.cc', '.cpp', '.cxx', '.h', '.hpp', '.hh', '.hxx',
    '.m', '.mm', '.swift',
    '.go', '.rs', '.rb', '.php', '.cs', '.fs', '.vb',
    '.sh', '.bash', '.zsh', '.ps1',
    '.sql', '.r', '.lua', '.dart', '.pl', '.pm',
    '.hs', '.ex', '.exs', '.clj', '.cljs',
    '.zig', '.nim', '.groovy', '.gradle',
    '.asm', '.s', '.f', '.f90', '.toml', '.ini'
  ],

  getAttachFileAccept() {
    const docTypes = [
      'text/*',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    return [...this.ACCEPTED_IMAGE_TYPES, ...this.ACCEPTED_FILE_EXTENSIONS, ...docTypes].join(',');
  }
};
