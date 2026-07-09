window.APP_CONFIG = {
  STORAGE_KEY: 'testchatai',

  MODELS: [
    { id: 'gpt-5.4-nano', label: 'GPT-5.4 nano', provider: 'openai', webSearch: true, imageGen: true, thinking: true },
    { id: 'gpt-5.4-mini', label: 'GPT-5.4 mini', provider: 'openai', webSearch: true, imageGen: true, thinking: true },
    { id: 'gpt-5.4', label: 'GPT-5.4', provider: 'openai', webSearch: true, imageGen: true, thinking: true },
    { id: 'gpt-5.5', label: 'GPT-5.5', provider: 'openai', webSearch: true, imageGen: true, thinking: true },
    { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', provider: 'anthropic', webSearch: true, imageGen: false, thinking: true, maxOutputTokens: 64000 },
    { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', provider: 'anthropic', webSearch: true, imageGen: false, thinking: true },
    { id: 'claude-sonnet-5', label: 'Claude Sonnet 5', provider: 'anthropic', webSearch: true, imageGen: false, thinking: true },
    { id: 'claude-opus-4-8', label: 'Claude Opus 4.8', provider: 'anthropic', webSearch: true, imageGen: false, thinking: true },
    { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash', provider: 'deepseek', webSearch: false, imageGen: false, thinking: true, vision: false },
    { id: 'byteplus-deepseek-v4-flash', apiModel: 'deepseek-v4-flash-260425', label: 'DeepSeek V4 Flash (Byte Plus)', provider: 'byteplus', webSearch: false, imageGen: false, thinking: true, vision: false },
    { id: 'byteplus-glm-5-2', apiModel: 'glm-5-2-260617', label: 'GLM-5.2 (Byte Plus)', provider: 'byteplus', webSearch: false, imageGen: false, thinking: true, vision: false },
    { id: 'byteplus-gpt-oss-120b', apiModel: 'gpt-oss-120b-250805', label: 'GPT OSS 120B', provider: 'byteplus', webSearch: false, imageGen: false, thinking: true, vision: false },
    { id: 'openrouter-gpt-oss-120b', apiModel: 'openai/gpt-oss-120b', label: 'GPT OSS 120B (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: false },
    { id: 'openrouter-deepseek-v4-flash', apiModel: 'deepseek/deepseek-v4-flash', label: 'DeepSeek V4 Flash (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: false, maxOutputTokens: 16384 },
    { id: 'openrouter-deepseek-v4-pro', apiModel: 'deepseek/deepseek-v4-pro', label: 'DeepSeek V4 Pro (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: false },
    { id: 'openrouter-glm-5-2', apiModel: 'z-ai/glm-5.2', label: 'GLM 5.2 (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: false },
    { id: 'openrouter-mimo-v2-5', apiModel: 'xiaomi/mimo-v2.5', label: 'MiMo V2.5 (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: true, maxOutputTokens: 32000 },
    { id: 'openrouter-mimo-v2.5-pro', apiModel: 'xiaomi/mimo-v2.5-pro', label: 'MiMo V2.5 Pro (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: false },
    { id: 'openrouter-minimax-m3', apiModel: 'minimax/minimax-m3', label: 'MiniMax M3 (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: true, maxOutputTokens: 65536 },
    { id: 'openrouter-minimax-m2.7-nitro', apiModel: 'minimax/minimax-m2.7:nitro', label: 'MiniMax M2.7 Nitro (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: false },
    { id: 'openrouter-claude-3-haiku', apiModel: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: false, vision: true },
    { id: 'openrouter-claude-haiku-4-5', apiModel: 'anthropic/claude-haiku-4.5', label: 'Claude Haiku 4.5 (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: true, maxOutputTokens: 64000 },
    { id: 'openrouter-claude-sonnet-5', apiModel: 'anthropic/claude-sonnet-5', label: 'Claude Sonnet 5 (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: true },
    { id: 'openrouter-claude-opus-4-8', apiModel: 'anthropic/claude-opus-4.8', label: 'Claude Opus 4.8 (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: true },
    { id: 'openrouter-gemini-2.5-flash-lite', apiModel: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: true },
    { id: 'openrouter-gemini-2.5-flash', apiModel: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: true },
    { id: 'openrouter-gemini-3.5-flash', apiModel: 'google/gemini-3.5-flash', label: 'Gemini 3.5 Flash (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: true },
    { id: 'openrouter-north-mini-code', apiModel: 'cohere/north-mini-code:free', label: 'North Mini Code (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: false },
    { id: 'openrouter-mistral-nemo', apiModel: 'mistralai/mistral-nemo', label: 'Mistral Nemo (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: false, vision: false },
    { id: 'openrouter-mistral-small-4', apiModel: 'mistralai/mistral-small-2603', label: 'Mistral Small 4 (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: true },
    { id: 'openrouter-kimi-k2.7-code', apiModel: 'moonshotai/kimi-k2.7-code', label: 'Kimi K2.7 Code (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, thinkingRequired: true, vision: true },
    { id: 'openrouter-kimi-k2.6', apiModel: 'moonshotai/kimi-k2.6', label: 'Kimi K2.6 (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: true },
    { id: 'openrouter-grok-4.5', apiModel: 'x-ai/grok-4.5', label: 'Grok 4.5 (OpenRouter)', provider: 'openrouter', webSearch: false, imageGen: false, thinking: true, vision: true },
    { id: 'byteplus-dola-seed-2-0-mini', apiModel: 'seed-2-0-mini-260428', label: 'Dola Seed 2.0 Mini', provider: 'byteplus', apiMode: 'responses', webSearch: false, imageGen: false, thinking: true, vision: true },
    { id: 'byteplus-dola-seed-2-0-lite', apiModel: 'seed-2-0-lite-260428', label: 'Dola Seed 2.0 Lite', provider: 'byteplus', apiMode: 'responses', webSearch: false, imageGen: false, thinking: true, vision: true },
    { id: 'byteplus-dola-seed-2-0-pro', apiModel: 'seed-2-0-pro-260328', label: 'Dola Seed 2.0 Pro', provider: 'byteplus', apiMode: 'responses', webSearch: false, imageGen: false, thinking: true, vision: true },
    { id: 'byteplus-dola-seed-2-0-code', apiModel: 'seed-2-0-code-preview-260328', label: 'Dola Seed 2.0 Code', provider: 'byteplus', apiMode: 'responses', webSearch: false, imageGen: false, thinking: true, vision: false },
    { id: 'nvidia-nemotron-3-ultra-550b-a55b', apiModel: 'nvidia/nemotron-3-ultra-550b-a55b', label: 'Nemotron 3 Ultra (NVIDIA)', provider: 'nvidia', webSearch: false, imageGen: false, thinking: true, vision: false },
    { id: 'nvidia-nemotron-3-super', apiModel: 'nvidia/nemotron-3-super-120b-a12b', label: 'Nemotron 3 Super (NVIDIA)', provider: 'nvidia', webSearch: false, imageGen: false, thinking: true, vision: false, nemotronReasoningBudget: 16384 },
    { id: 'nvidia-nemotron-3-nano-omni', apiModel: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning', label: 'Nemotron 3 Nano Omni (NVIDIA)', provider: 'nvidia', webSearch: false, imageGen: false, thinking: true, vision: false, nemotronReasoningBudget: 16384 },
    { id: 'nvidia-gpt-oss-120b', apiModel: 'openai/gpt-oss-120b', label: 'GPT OSS 120B (NVIDIA)', provider: 'nvidia', webSearch: false, imageGen: false, thinking: true, vision: false },
    { id: 'nvidia-glm-5-2', apiModel: 'z-ai/glm-5.2', label: 'GLM 5.2 (NVIDIA)', provider: 'nvidia', webSearch: false, imageGen: false, thinking: true, vision: false },
    { id: 'nvidia-minimax-m3', apiModel: 'minimaxai/minimax-m3', label: 'MiniMax M3 (NVIDIA)', provider: 'nvidia', webSearch: false, imageGen: false, thinking: true, vision: true },
    { id: 'nvidia-minimax-m2-7', apiModel: 'minimaxai/minimax-m2.7', label: 'MiniMax M2.7 (NVIDIA)', provider: 'nvidia', webSearch: false, imageGen: false, thinking: true, vision: false },
    { id: 'nvidia-step-3-7-flash', apiModel: 'stepfun-ai/step-3.7-flash', label: 'Step 3.7 Flash (NVIDIA)', provider: 'nvidia', webSearch: false, imageGen: false, thinking: true, vision: false },
    { id: 'nvidia-mistral-small-4', apiModel: 'mistralai/mistral-small-4-119b-2603', label: 'Mistral Small 4 (NVIDIA)', provider: 'nvidia', webSearch: false, imageGen: false, thinking: true, vision: false },
    { id: 'nvidia-mistral-medium-3-5-128b', apiModel: 'mistralai/mistral-medium-3.5-128b', label: 'Mistral Medium 3.5 128B (NVIDIA)', provider: 'nvidia', webSearch: false, imageGen: false, thinking: true, vision: false },
    { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro', provider: 'deepseek', webSearch: false, imageGen: false, thinking: true, vision: false },
    { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', provider: 'google', webSearch: true, imageGen: true, thinking: true },
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'google', webSearch: true, imageGen: true, thinking: true },
    { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash', provider: 'google', webSearch: true, imageGen: true, thinking: true },
    { id: 'kimi-k2.5', label: 'Kimi K2.5', provider: 'kimi', webSearch: false, imageGen: false, thinking: true },
    { id: 'kimi-k2.6', label: 'Kimi K2.6', provider: 'kimi', webSearch: false, imageGen: false, thinking: true },
    { id: 'kimi-k2.7-code', label: 'Kimi K2.7 Code', provider: 'kimi', webSearch: false, imageGen: false, thinking: true, thinkingRequired: true },
    { id: 'kimi-k2.7-code-highspeed', label: 'Kimi K2.7 Code HighSpeed', provider: 'kimi', webSearch: false, imageGen: false, thinking: true, thinkingRequired: true }
  ],

  // USD per 1M tokens — giá chuẩn (cache miss / standard tier), cập nhật 2026-06-29
  // Nguồn: openai.com/developers, platform.claude.com, api-docs.deepseek.com,
  //        ai.google.dev/gemini-api/docs/pricing, platform.kimi.ai
  MODEL_PRICING: {
    'gpt-5.4-nano': { input: 0.20, output: 1.25 },
    'gpt-5.4-mini': { input: 0.75, output: 4.50 },
    'gpt-5.4': { input: 2.50, output: 15.00 },
    'gpt-5.5': { input: 5.00, output: 30.00 },
    'claude-haiku-4-5': { input: 1.00, output: 5.00 },
    'claude-sonnet-4-6': { input: 3.00, output: 15.00 },
    'claude-sonnet-5': { input: 3.00, output: 15.00 },
    'claude-opus-4-8': { input: 5.00, output: 25.00 },
    'deepseek-v4-flash': { input: 0.14, output: 0.28 },
    'byteplus-deepseek-v4-flash': { input: 0.14, output: 0.28 },
    'byteplus-glm-5-2': { input: 1.40, output: 4.40 },
    'byteplus-gpt-oss-120b': { input: 0.10, output: 0.50 },
    'openrouter-gpt-oss-120b': { input: 0.03, output: 0.15 },
    'openrouter-deepseek-v4-flash': { input: 0.09, output: 0.18 },
    'openrouter-deepseek-v4-pro': { input: 0.435, output: 0.87 },
    'openrouter-glm-5-2': { input: 0.93, output: 3.00 },
    'openrouter-mimo-v2-5': { input: 0.105, output: 0.28 },
    'openrouter-mimo-v2.5-pro': { input: 0.435, output: 0.87 },
    'openrouter-minimax-m3': { input: 0.30, output: 1.20 },
    'openrouter-minimax-m2.7-nitro': { input: 0.18, output: 0.72 },
    'openrouter-claude-3-haiku': { input: 0.25, output: 1.25 },
    'openrouter-claude-haiku-4-5': { input: 1.00, output: 5.00 },
    'openrouter-claude-sonnet-5': { input: 2.00, output: 10.00 },
    'openrouter-claude-opus-4-8': { input: 5.00, output: 25.00 },
    'openrouter-gemini-2.5-flash-lite': { input: 0.10, output: 0.40 },
    'openrouter-gemini-2.5-flash': { input: 0.30, output: 2.50 },
    'openrouter-gemini-3.5-flash': { input: 1.50, output: 9.00 },
    'openrouter-north-mini-code': { input: 0, output: 0 },
    'openrouter-mistral-nemo': { input: 0.02, output: 0.03 },
    'openrouter-mistral-small-4': { input: 0.15, output: 0.60 },
    'openrouter-kimi-k2.7-code': { input: 0.74, output: 3.50 },
    'openrouter-kimi-k2.6': { input: 0.66, output: 3.41 },
    'openrouter-grok-4.5': { input: 2.00, output: 6.00 },
    'byteplus-dola-seed-2-0-lite': { input: 0.25, output: 2.00 },
    'byteplus-dola-seed-2-0-mini': { input: 0.10, output: 0.40 },
    'byteplus-dola-seed-2-0-pro': { input: 0.50, output: 3.00 },
    'byteplus-dola-seed-2-0-code': { input: 0.50, output: 3.00 },
    'nvidia-nemotron-3-ultra-550b-a55b': { input: 0, output: 0 },
    'nvidia-nemotron-3-super': { input: 0, output: 0 },
    'nvidia-nemotron-3-nano-omni': { input: 0, output: 0 },
    'nvidia-gpt-oss-120b': { input: 0, output: 0 },
    'nvidia-glm-5-2': { input: 0, output: 0 },
    'nvidia-minimax-m3': { input: 0, output: 0 },
    'nvidia-minimax-m2-7': { input: 0, output: 0 },
    'nvidia-step-3-7-flash': { input: 0, output: 0 },
    'nvidia-mistral-small-4': { input: 0, output: 0 },
    'nvidia-mistral-medium-3-5-128b': { input: 0, output: 0 },
    'deepseek-v4-pro': { input: 0.435, output: 0.87 },
    'gemini-2.5-flash-lite': { input: 0.10, output: 0.40 },
    'gemini-2.5-flash': { input: 0.30, output: 2.50 },
    'gemini-3.5-flash': { input: 1.50, output: 9.00 },
    'kimi-k2.5': { input: 0.60, output: 3.00 },
    'kimi-k2.6': { input: 0.95, output: 4.00 },
    'kimi-k2.7-code': { input: 0.95, output: 4.00 },
    'kimi-k2.7-code-highspeed': { input: 1.90, output: 8.00 }
  },

  TOKEN_COST_WARNING_USD: 1,

  DEFAULT_MODEL: 'gemini-3.5-flash',
  DEFAULT_LOCALE: 'en',
  LOCALES: ['en', 'vi', 'jp', 'zh'],

  PROVIDERS: [
    { id: 'openai', label: 'OpenAI' },
    { id: 'anthropic', label: 'Anthropic' },
    { id: 'google', label: 'Gemini' },
    { id: 'deepseek', label: 'DeepSeek' },
    { id: 'kimi', label: 'Kimi' },
    { id: 'byteplus', label: 'Byte Plus' },
    { id: 'nvidia', label: 'NVIDIA' },
    { id: 'openrouter', label: 'OpenRouter' }
  ],

  // Tuỳ chỉnh gọi API (để trống max output = dùng mặc định của provider)
  API_MAX_OUTPUT_TOKENS: 65536,
  REASONING_EFFORT: 'high',
  SEARCH_CONTEXT_SIZE: 'high',

  DEFAULT_EFFORT: 'high',

  EFFORT_LEVELS: {
    openai:    ['low', 'medium', 'high'],
    anthropic: ['low', 'medium', 'high', 'xhigh', 'max'],
    google:    ['low', 'medium', 'high'],
    deepseek:  ['default', 'high', 'max'],
    nvidia:    ['default', 'high', 'max'],
    byteplus:  ['default', 'high', 'max'],
    openrouter: ['low', 'medium', 'high'],
    kimi:      [] // binary thinking only: enabled/disabled via Thinking toggle
  },

  MODEL_EFFORT_LEVELS: {
    'claude-opus-4-8': ['low', 'medium', 'high', 'xhigh', 'max'],
    'claude-sonnet-4-6': ['low', 'medium', 'high', 'max'],
    'claude-sonnet-5': ['low', 'medium', 'high', 'max'],
    'gemini-2.5-flash-lite': ['low', 'medium', 'high'],
    'gemini-2.5-flash': ['low', 'medium', 'high'],
    'gemini-3.5-flash': ['minimal', 'low', 'medium', 'high'],
    'nvidia-nemotron-3-ultra-550b-a55b': ['default', 'medium', 'high'],
    'nvidia-nemotron-3-super': ['default', 'medium', 'high'],
    'nvidia-nemotron-3-nano-omni': ['default', 'medium', 'high'],
    'nvidia-gpt-oss-120b': ['low', 'medium', 'high'],
    'nvidia-glm-5-2': ['default', 'high', 'max'],
    'nvidia-minimax-m3': ['low', 'medium', 'high'],
    'nvidia-minimax-m2-7': ['low', 'medium', 'high'],
    'nvidia-step-3-7-flash': [],
    'nvidia-mistral-small-4': ['low', 'medium', 'high'],
    'nvidia-mistral-medium-3-5-128b': ['low', 'medium', 'high'],
    'byteplus-dola-seed-2-0-lite': ['minimal', 'low', 'medium', 'high'],
    'byteplus-dola-seed-2-0-mini': ['minimal', 'low', 'medium', 'high'],
    'byteplus-dola-seed-2-0-pro': ['minimal', 'low', 'medium', 'high'],
    'byteplus-dola-seed-2-0-code': ['minimal', 'low', 'medium', 'high'],
    'byteplus-gpt-oss-120b': ['low', 'medium', 'high'],
    'openrouter-gpt-oss-120b': ['low', 'medium', 'high'],
    'openrouter-deepseek-v4-flash': ['high', 'xhigh'],
    'openrouter-deepseek-v4-pro': ['high', 'xhigh'],
    'openrouter-glm-5-2': ['high', 'xhigh'],
    'openrouter-mimo-v2-5': ['low', 'medium', 'high'],
    'openrouter-mimo-v2.5-pro': ['low', 'medium', 'high'],
    'openrouter-minimax-m3': ['low', 'medium', 'high'],
    'openrouter-minimax-m2.7-nitro': ['low', 'medium', 'high'],
    'openrouter-claude-haiku-4-5': ['low', 'medium', 'high'],
    'openrouter-claude-sonnet-5': ['low', 'medium', 'high', 'max'],
    'openrouter-claude-opus-4-8': ['low', 'medium', 'high', 'xhigh', 'max'],
    'openrouter-gemini-2.5-flash-lite': ['low', 'medium', 'high'],
    'openrouter-gemini-2.5-flash': ['low', 'medium', 'high'],
    'openrouter-gemini-3.5-flash': ['minimal', 'low', 'medium', 'high'],
    'openrouter-north-mini-code': ['low', 'medium', 'high'],
    'openrouter-mistral-small-4': ['low', 'medium', 'high'],
    'openrouter-kimi-k2.7-code': ['low', 'medium', 'high'],
    'openrouter-kimi-k2.6': ['low', 'medium', 'high'],
    'openrouter-grok-4.5': ['low', 'medium', 'high']
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
    if (this.modelUsesByteplusResponses(modelId)) return false;
    if (this.modelUsesByteplusOpenAIReasoning(modelId)) return false;
    if (this.modelUsesGptOssReasoning(modelId)) return false;
    if (this.modelUsesOpenRouterReasoning(modelId)) return false;
    if (this.modelUsesNvidiaEnableThinkingTemplate(modelId)) return false;
    if (this.modelUsesNvidiaStepModel(modelId)) return false;
    const provider = this.getModelProvider(modelId);
    return provider === 'deepseek' || provider === 'nvidia' || provider === 'byteplus';
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

  normalizeNemotronEffort(effort) {
    if (effort === 'default') return 'default';
    if (effort === 'medium') return 'medium';
    if (effort === 'high' || effort === 'max' || effort === 'xhigh') return 'high';
    return 'high';
  },

  modelUsesNvidiaDeepSeekChatTemplate(modelId) {
    if (this.getModelProvider(modelId) !== 'nvidia') return false;
    return /^deepseek-ai\//.test(this.getApiModel(modelId));
  },

  modelUsesNvidiaEnableThinkingTemplate(modelId) {
    if (this.getModelProvider(modelId) !== 'nvidia') return false;
    return /^google\/(gemma|diffusiongemma)/i.test(this.getApiModel(modelId));
  },

  modelUsesNvidiaStepModel(modelId) {
    if (this.getModelProvider(modelId) !== 'nvidia') return false;
    return /^stepfun-ai\/step-3\.[57]-flash$/i.test(this.getApiModel(modelId));
  },

  modelUsesNvidiaLmReasoningEffort(modelId) {
    if (this.getModelProvider(modelId) !== 'nvidia') return false;
    return /^mistralai\/mistral-(small|medium)/i.test(this.getApiModel(modelId));
  },

  normalizeNvidiaLmReasoningEffort(effort, modelId) {
    const levels = ['low', 'medium', 'high'];
    const normalized = this.normalizeEffortForModel(
      effort || this.getDefaultEffortForModel(modelId),
      modelId
    );
    if (levels.includes(normalized)) return normalized;
    if (normalized === 'default' || normalized === 'minimal') return 'medium';
    return 'high';
  },

  modelUsesNemotronReasoning(modelId) {
    const model = this.getModel(modelId);
    const apiModel = model.apiModel || model.id;
    return /nemotron/i.test(apiModel);
  },

  modelUsesNemotronBudgetReasoning(modelId) {
    return !!this.getModel(modelId).nemotronReasoningBudget;
  },

  getNemotronReasoningBudget(modelId) {
    const model = this.getModel(modelId);
    return model.nemotronReasoningBudget || 16384;
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
      if (this.modelUsesNemotronReasoning(modelId)) {
        const normalized = this.normalizeNemotronEffort(effort);
        return levels.includes(normalized) ? normalized : 'high';
      }
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
    if (modelId === 'gemini-3.5-flash' || modelId === 'openrouter-gemini-3.5-flash') return 'medium';
    if (modelId === 'byteplus-dola-seed-2-0-lite' || modelId === 'byteplus-dola-seed-2-0-mini' || modelId === 'byteplus-dola-seed-2-0-pro' || modelId === 'byteplus-dola-seed-2-0-code') return 'medium';
    if (modelId === 'byteplus-gpt-oss-120b' || modelId === 'nvidia-gpt-oss-120b') return 'medium';
    if (modelId === 'nvidia-glm-5-2') return 'high';
    if (modelId === 'nvidia-minimax-m3') return 'medium';
    if (modelId === 'nvidia-minimax-m2-7') return 'medium';
    if (modelId === 'nvidia-step-3-7-flash') return 'medium';
    if (modelId === 'nvidia-mistral-small-4') return 'medium';
    if (modelId === 'nvidia-mistral-medium-3-5-128b') return 'high';
    if (modelId === 'openrouter-gpt-oss-120b') return 'medium';
    if (modelId === 'openrouter-deepseek-v4-flash' || modelId === 'openrouter-deepseek-v4-pro' || modelId === 'openrouter-glm-5-2') return 'high';
    if (modelId === 'openrouter-mimo-v2-5' || modelId === 'openrouter-mimo-v2.5-pro') return 'medium';
    if (modelId === 'nvidia-nemotron-3-super') return 'high';
    if (modelId === 'nvidia-nemotron-3-nano-omni') return 'high';
    if (modelId === 'openrouter-minimax-m3' || modelId === 'openrouter-minimax-m2.7-nitro' || modelId === 'openrouter-north-mini-code' || modelId === 'openrouter-mistral-small-4') return 'medium';
    if (modelId === 'openrouter-claude-haiku-4-5' || modelId === 'openrouter-claude-sonnet-5' || modelId === 'openrouter-claude-opus-4-8' || modelId === 'openrouter-gemini-2.5-flash-lite' || modelId === 'openrouter-gemini-2.5-flash' || modelId === 'openrouter-kimi-k2.7-code' || modelId === 'openrouter-kimi-k2.6' || modelId === 'openrouter-grok-4.5') return 'high';
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
    return id === 'claude-sonnet-4-6' || id === 'claude-sonnet-5' || id === 'claude-opus-4-8';
  },

  modelUsesAnthropicManualThinking(modelId) {
    return modelId === 'claude-haiku-4-5';
  },

  getGeminiThinkingBudget(modelId, effort) {
    const isLite = modelId === 'gemini-2.5-flash-lite';
    const map = isLite
      ? { low: 512, medium: -1, high: 24576 }
      : { low: 4096, medium: -1, high: 24576 };
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

  getModelsByProvider(providerId) {
    return this.MODELS.filter((m) => m.provider === providerId);
  },

  getModelDisplayLabel(model) {
    if (!model) return '';
    if (model.shortLabel) return model.shortLabel;
    return model.label.replace(/\s*\((OpenRouter|NVIDIA|Byte Plus)\)\s*$/, '');
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
    if (this.getModelProvider(modelId) === 'nvidia') {
      return this.NVIDIA_MAX_OUTPUT_TOKENS || configured;
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
    if (provider === 'nvidia') return state.nvidiaApiKey || '';
    if (provider === 'byteplus') return state.byteplusApiKey || '';
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
    if (provider === 'nvidia') return 'Enter your NVIDIA API key in Settings first';
    if (provider === 'byteplus') return 'Enter your Byte Plus API key in Settings first';
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
    if (provider === 'nvidia') return 'No NVIDIA API key. Open Settings to enter one.';
    if (provider === 'byteplus') return 'No Byte Plus API key. Open Settings to enter one.';
    if (provider === 'openrouter') return 'No OpenRouter API key. Open Settings to enter one.';
    if (provider === 'google') return 'No Gemini API key. Open Settings to enter one.';
    if (provider === 'kimi') return 'No Kimi API key. Open Settings to enter one.';
    return 'No API key. Open Settings to enter one.';
  },

  getNvidiaProxyRequiredError() {
    if (window.I18n) return window.I18n.t('nvidiaProxyRequired');
    return 'NVIDIA API requires a CORS proxy. Deploy worker/ and set NVIDIA_PROXY_ENDPOINT in config.js.';
  },

  getByteplusProxyRequiredError() {
    if (window.I18n) return window.I18n.t('byteplusProxyRequired');
    return 'Byte Plus API requires a CORS proxy. Deploy worker/ and set BYTEPLUS_PROXY_ENDPOINT in config.js.';
  },

  formatApiError(err, modelId) {
    const msg = err?.message || String(err || '');
    const isNetwork = /load failed|failed to fetch|networkerror|network error/i.test(msg);
    const provider = this.getModelProvider(modelId);
    if (isNetwork && provider === 'nvidia') {
      if (!this.NVIDIA_PROXY_ENDPOINT) {
        return this.getNvidiaProxyRequiredError();
      }
      if (window.I18n) return window.I18n.t('nvidiaProxyNetworkError');
      return 'Could not reach NVIDIA proxy. Check API key, use a local server (not file://), and redeploy worker/.';
    }
    if (isNetwork && provider === 'byteplus') {
      if (!this.getByteplusProxyEndpoint(modelId)) {
        return this.getByteplusProxyRequiredError();
      }
      if (window.I18n) return window.I18n.t('byteplusProxyNetworkError');
      return 'Could not reach Byte Plus proxy. Check API key, use a local server (not file://), and redeploy worker/.';
    }
    if (/DEGRADED function cannot be invoked/i.test(msg) && provider === 'nvidia') {
      if (window.I18n) return window.I18n.t('nvidiaDegradedError');
      return 'Endpoint NVIDIA đang degraded (quá tải hoặc bảo trì). Thử lại sau hoặc dùng DeepSeek V4 Flash qua OpenRouter/Byte Plus.';
    }
    return msg;
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
  DEFAULT_THEME: 'dark',

  OPENAI_ENDPOINT: 'https://api.openai.com/v1/chat/completions',
  RESPONSES_ENDPOINT: 'https://api.openai.com/v1/responses',
  ANTHROPIC_ENDPOINT: 'https://api.anthropic.com/v1/messages',
  ANTHROPIC_VERSION: '2023-06-01',
  DEEPSEEK_ENDPOINT: 'https://api.deepseek.com/v1/chat/completions',
  NVIDIA_ENDPOINT: 'https://integrate.api.nvidia.com/v1/chat/completions',
  // Cloudflare Worker proxy — bắt buộc cho NVIDIA (API không hỗ trợ CORS từ trình duyệt).
  // Deploy: cd worker && npx wrangler deploy → dán URL + '/nvidia' vào đây.
  NVIDIA_PROXY_ENDPOINT: 'https://testchatai-deepseek-proxy.testchatai-deepseek.workers.dev/nvidia',
  BYTEPLUS_ENDPOINT: 'https://ark.ap-southeast.bytepluses.com/api/v3/chat/completions',
  BYTEPLUS_RESPONSES_ENDPOINT: 'https://ark.ap-southeast.bytepluses.com/api/v3/responses',
  // Deploy: cd worker && npx wrangler deploy → dán URL + '/byteplus' vào đây.
  BYTEPLUS_PROXY_ENDPOINT: 'https://testchatai-deepseek-proxy.testchatai-deepseek.workers.dev/byteplus',
  BYTEPLUS_RESPONSES_PROXY_ENDPOINT: 'https://testchatai-deepseek-proxy.testchatai-deepseek.workers.dev/byteplus-responses',
  // Share snapshots: POST create / GET /share/:id (Cloudflare KV)
  SHARE_ENDPOINT: 'https://testchatai-deepseek-proxy.testchatai-deepseek.workers.dev/share',

  BYTEPLUS_MCP_TOOLS: {
    'byteplus-dola-seed-2-0-lite': [
      {
        type: 'mcp',
        server_label: 'deepwiki',
        server_url: 'https://mcp.deepwiki.com/mcp',
        require_approval: 'never'
      }
    ],
    'byteplus-dola-seed-2-0-mini': [
      {
        type: 'mcp',
        server_label: 'deepwiki',
        server_url: 'https://mcp.deepwiki.com/mcp',
        require_approval: 'never'
      }
    ],
    'byteplus-dola-seed-2-0-pro': [
      {
        type: 'mcp',
        server_label: 'deepwiki',
        server_url: 'https://mcp.deepwiki.com/mcp',
        require_approval: 'never'
      }
    ],
    'byteplus-dola-seed-2-0-code': [
      {
        type: 'mcp',
        server_label: 'deepwiki',
        server_url: 'https://mcp.deepwiki.com/mcp',
        require_approval: 'never'
      }
    ]
  },
  OPENROUTER_ENDPOINT: 'https://openrouter.ai/api/v1/chat/completions',
  OPENROUTER_IMAGES_ENDPOINT: 'https://openrouter.ai/api/v1/images',
  // Để null: không gửi max_tokens (OpenRouter tự giới hạn theo credit). Đặt số (vd. 8192) nếu tài khoản có đủ credit.
  OPENROUTER_MAX_OUTPUT_TOKENS: 32768,
  NVIDIA_MAX_OUTPUT_TOKENS: 65536,
  KIMI_ENDPOINT: 'https://api.moonshot.ai/v1/chat/completions',
  GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models',

  geminiStreamUrl(modelId) {
    return this.GEMINI_API_BASE + '/' + modelId + ':streamGenerateContent?alt=sse';
  },

  getNvidiaEndpoint() {
    return this.NVIDIA_PROXY_ENDPOINT || this.NVIDIA_ENDPOINT;
  },

  nvidiaRequiresProxy() {
    return true;
  },

  getByteplusEndpoint(modelId) {
    if (this.modelUsesByteplusResponses(modelId)) {
      return this.BYTEPLUS_RESPONSES_PROXY_ENDPOINT || this.BYTEPLUS_RESPONSES_ENDPOINT;
    }
    return this.BYTEPLUS_PROXY_ENDPOINT || this.BYTEPLUS_ENDPOINT;
  },

  getByteplusProxyEndpoint(modelId) {
    if (this.modelUsesByteplusResponses(modelId)) {
      return this.BYTEPLUS_RESPONSES_PROXY_ENDPOINT;
    }
    return this.BYTEPLUS_PROXY_ENDPOINT;
  },

  modelUsesByteplusResponses(modelId) {
    return this.getModel(modelId).apiMode === 'responses';
  },

  modelUsesGptOssReasoning(modelId) {
    return /gpt-oss/i.test(this.getApiModel(modelId));
  },

  modelUsesByteplusOpenAIReasoning(modelId) {
    return this.getModelProvider(modelId) === 'byteplus' && this.modelUsesGptOssReasoning(modelId);
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

  getByteplusMcpTools(modelId) {
    return this.BYTEPLUS_MCP_TOOLS[modelId] || [];
  },

  getByteplusResponsesThinkingConfig(modelId, thinkingEnabled, reasoningEffort) {
    if (!thinkingEnabled) {
      return { thinking: { type: 'disabled' } };
    }
    const effort = this.normalizeEffortForModel(
      reasoningEffort || this.DEFAULT_EFFORT,
      modelId
    );
    return { reasoning: { effort } };
  },

  byteplusRequiresProxy() {
    return true;
  },

  // Model chat → model tạo ảnh (Nano Banana) khi bật Tạo hình ảnh
  GEMINI_IMAGE_MODEL_MAP: {
    'gemini-2.5-flash-lite': 'gemini-2.5-flash-image',
    'gemini-2.5-flash': 'gemini-2.5-flash-image',
    'gemini-3.5-flash': 'gemini-3.1-flash-image'
  },

  getGeminiImageModel(modelId) {
    return this.GEMINI_IMAGE_MODEL_MAP[modelId] || 'gemini-2.5-flash-image';
  },

  geminiSupportsImageAspectRatio(modelId) {
    const imageModel = this.getGeminiImageModel(modelId);
    return new Set(['gemini-2.5-flash-image', 'gemini-3.1-flash-image']).has(imageModel);
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
