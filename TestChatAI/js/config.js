window.APP_CONFIG = {
  STORAGE_KEY: 'testchatai',

  MODELS: [
    { id: 'gpt-5.4-nano', label: 'GPT-5.4 nano', provider: 'openai', webSearch: true, imageGen: true, thinking: true },
    { id: 'gpt-5.4-mini', label: 'GPT-5.4 mini', provider: 'openai', webSearch: true, imageGen: true, thinking: true },
    { id: 'gpt-5.4', label: 'GPT-5.4', provider: 'openai', webSearch: true, imageGen: true, thinking: true },
    { id: 'gpt-5.5', label: 'GPT-5.5', provider: 'openai', webSearch: true, imageGen: true, thinking: true },
    { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', provider: 'anthropic', webSearch: true, imageGen: false, thinking: true, maxOutputTokens: 64000 },
    { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', provider: 'anthropic', webSearch: true, imageGen: false, thinking: true },
    { id: 'claude-opus-4-8', label: 'Claude Opus 4.8', provider: 'anthropic', webSearch: true, imageGen: false, thinking: true },
    { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash', provider: 'deepseek', webSearch: false, imageGen: false, thinking: true, vision: false },
    { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro', provider: 'deepseek', webSearch: false, imageGen: false, thinking: true, vision: false },
    { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', provider: 'google', webSearch: true, imageGen: true, thinking: true },
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'google', webSearch: true, imageGen: true, thinking: true },
    { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash', provider: 'google', webSearch: true, imageGen: true, thinking: true }
  ],

  DEFAULT_MODEL: 'gemini-3.5-flash',

  // Tuỳ chỉnh gọi API (để trống max output = dùng mặc định của provider)
  API_MAX_OUTPUT_TOKENS: 65536,
  REASONING_EFFORT: 'high',
  SEARCH_CONTEXT_SIZE: 'high',

  getModel(modelId) {
    const id = modelId || this.DEFAULT_MODEL;
    return this.MODELS.find((m) => m.id === id) || this.MODELS[0];
  },

  getMaxOutputTokens(modelId) {
    const configured = this.API_MAX_OUTPUT_TOKENS;
    if (!configured) return null;
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
    if (provider === 'google') return state.geminiApiKey || '';
    return state.apiKey || '';
  },

  getMissingApiKeyMessage(modelId) {
    const provider = this.getModelProvider(modelId);
    if (provider === 'anthropic') return 'Nhập Anthropic API key trong Cài đặt trước';
    if (provider === 'deepseek') return 'Nhập DeepSeek API key trong Cài đặt trước';
    if (provider === 'google') return 'Nhập Gemini API key trong Cài đặt trước';
    return 'Nhập API key trong Cài đặt trước';
  },

  getMissingApiKeyError(modelId) {
    const provider = this.getModelProvider(modelId);
    if (provider === 'anthropic') return 'Chưa có Anthropic API key. Mở Cài đặt để nhập.';
    if (provider === 'deepseek') return 'Chưa có DeepSeek API key. Mở Cài đặt để nhập.';
    if (provider === 'google') return 'Chưa có Gemini API key. Mở Cài đặt để nhập.';
    return 'Chưa có API key. Mở Cài đặt để nhập.';
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
    return 'Dịch sang ' + this.getTranslateLanguage(code).label;
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
  GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models',

  geminiStreamUrl(modelId) {
    return this.GEMINI_API_BASE + '/' + modelId + ':streamGenerateContent?alt=sse';
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

  ACCEPTED_FILE_EXTENSIONS: [
    '.txt', '.md', '.markdown', '.csv', '.json', '.xml', '.html', '.htm',
    '.css', '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.c', '.cpp', '.h',
    '.yaml', '.yml', '.log', '.rtf', '.pdf', '.docx', '.xlsx'
  ]
};
