window.APP_CONFIG = {
  STORAGE_KEY: 'testchatai',

  MODELS: [
    { id: 'gpt-5.4-nano', label: 'GPT-5.4 nano' },
    { id: 'gpt-5.4-mini', label: 'GPT-5.4 mini' },
    { id: 'gpt-5.4', label: 'GPT-5.4' }
  ],

  DEFAULT_MODEL: 'gpt-5.4-nano',
  DEFAULT_SYSTEM_PROMPT: 'Bạn là một trợ lý AI thông minh, tận tâm và chính xác. Hãy tuân thủ các nguyên tắc sau:\n\n1. Suy nghĩ từng bước trước khi trả lời các câu hỏi phức tạp.\n2. Trả lời chi tiết, đầy đủ và có cấu trúc rõ ràng. Sử dụng markdown để định dạng khi cần (tiêu đề, danh sách, bảng, code block).\n3. Nếu không chắc chắn, hãy nói rõ giới hạn kiến thức của bạn thay vì bịa đặt.\n4. Khi được hỏi về code hoặc kỹ thuật, hãy giải thích nguyên lý đằng sau, không chỉ đưa ra code.\n5. Luôn trả lời bằng tiếng Việt, trừ khi người dùng yêu cầu ngôn ngữ khác.\n6. Đưa ra ví dụ cụ thể khi có thể để minh họa cho câu trả lời.',
  DEFAULT_THEME: 'dark',

  OPENAI_ENDPOINT: 'https://api.openai.com/v1/chat/completions',

  MAX_TITLE_LENGTH: 40,
  MAX_CONVERSATIONS: 100,

  MAX_IMAGES_PER_MESSAGE: 5,
  MAX_IMAGE_SIZE_MB: 5,
  ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],

  MAX_FILES_PER_MESSAGE: 5,
  MAX_FILE_SIZE_MB: 10,
  MAX_FILE_CONTENT_CHARS: 80000,
  ACCEPTED_FILE_EXTENSIONS: [
    '.txt', '.md', '.markdown', '.csv', '.json', '.xml', '.html', '.htm',
    '.css', '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.c', '.cpp', '.h',
    '.yaml', '.yml', '.log', '.rtf', '.pdf', '.docx'
  ]
};
