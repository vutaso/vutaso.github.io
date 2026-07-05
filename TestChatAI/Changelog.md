# Changelog

Tất cả các thay đổi đáng chú ý của **VUTASO AI** được ghi lại trong file này.

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/).

---

## [Unreleased]

### Added
- Model **North Mini Code** (OpenRouter, `cohere/north-mini-code:free`) — agentic coding, reasoning, miễn phí.
- Model **Mistral Nemo** (OpenRouter, `mistralai/mistral-nemo`) — 12B, context 128K.
- Model **Mistral Small 3.2 24B** (OpenRouter, `mistralai/mistral-small-3.2-24b-instruct`) — vision, context 128K.
- Model **Mistral Small 4** (OpenRouter, `mistralai/mistral-small-2603`) — reasoning, vision, context 262K.
- Model **MiniMax M2.7 Nitro** (OpenRouter, `minimax/minimax-m2.7:nitro`) — reasoning, routing nhanh, context 205K.
- Model **Nemotron 3 Ultra free** (OpenRouter, `nvidia/nemotron-3-ultra-550b-a55b:free`) — reasoning, context 1M, miễn phí.
- Model **Nemotron 3 Ultra** (OpenRouter, `nvidia/nemotron-3-ultra-550b-a55b`) — reasoning, context 1M.
- Model **Nemotron 3 Super free** (OpenRouter, `nvidia/nemotron-3-super-120b-a12b:free`) — reasoning, context 1M, miễn phí.
- Model **Nemotron 3 Super** (OpenRouter, `nvidia/nemotron-3-super-120b-a12b`) — reasoning, context 1M.
- Model **Nemotron 3 Nano free** (OpenRouter, `nvidia/nemotron-3-nano-30b-a3b:free`) — reasoning, context 256K, miễn phí.
- Model **Nemotron 3 Nano Omni free** (OpenRouter, `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`) — reasoning, vision, context 256K, miễn phí.
- Model **Gemma 4 31B free** (OpenRouter, `google/gemma-4-31b-it:free`) — reasoning, vision, context 262K, miễn phí.
- Model **Kimi K2.7 Code** (OpenRouter, `moonshotai/kimi-k2.7-code`) — coding, reasoning bắt buộc, vision, context 262K.
- Model **Kimi K2.6** (OpenRouter, `moonshotai/kimi-k2.6`) — reasoning, vision, context 262K.
- Model **Claude Sonnet 5** (Anthropic).
- Dropdown **Reasoning Effort** trên composer — mức suy luận theo từng provider/model (`low` → `max`, `minimal` cho Gemini 3.5).
- Menu **Tải xuống** trên header — gom các tùy chọn xuất hội thoại.

### Changed
- Cải thiện xuất **PDF** và **HTML** (layout, phân trang, theme).
- Cấu hình thinking nâng cao cho Anthropic (adaptive thinking, Haiku manual budget).

---

## [1.8.0] — 2026-06-30

### Added
- Theme **Hello Kitty Pink**.
- Theme **Cyberpunk Neon**.
- Theme **NVIDIA**.
- Theme **Liquid Glass Dark**.
- Theme **Dark (Visual Studio)** — highlight.js `vs2015`.

### Changed
- Refactor biến CSS (`variables.css`) hỗ trợ đa theme.
- Mermaid và Highlight.js tự đổi theme theo giao diện đang chọn.
- Cập nhật layout sidebar, chat, modals cho các theme mới.

---

## [1.7.0] — 2026-06-29

### Added
- Nhà cung cấp **Kimi** với 4 model: K2.5, K2.6, K2.7 Code, K2.7 Code HighSpeed.
- Trường **Kimi API Key** trong Cài đặt.
- Theo dõi **chi phí token** theo từng tin nhắn (ước tính USD từ `MODEL_PRICING`).
- Modal **cảnh báo chi phí** khi phiên chat vượt ngưỡng (`TOKEN_COST_WARNING_USD`, mặc định $1).
- Modal **Hướng dẫn sử dụng** (onboarding) cho người dùng mới.
- **System Prompt presets** — 20+ chế độ (Creative, Debug, Code Review, Architecture, v.v.) hỗ trợ 4 ngôn ngữ.
- Bảng giá model (`MODEL_PRICING`) cho 16 model, cập nhật 2026-06-29.

### Changed
- Mặc định model: `gemini-3.5-flash`.
- Cải thiện API Anthropic (adaptive thinking cho Sonnet 4.6, Opus 4.8).

---

## [1.6.0] — 2026-06-28

### Added
- Theme **Apple Light** và **Apple Dark**.
- Bộ chọn theme trong Cài đặt (thay cho toggle Dark/Light đơn giản).
- **Tìm kiếm lịch sử** trong sidebar — lọc hội thoại theo tiêu đề và nội dung tin nhắn.

### Changed
- Bật **web search** và **tạo ảnh** cho model Google Gemini.
- Cải thiện luồng chuyển theme và lưu preference.

---

## [1.5.0] — 2026-06-28

### Added
- **Đa ngôn ngữ giao diện (i18n):** English, Tiếng Việt, 日本語, 中文.
- Bộ chọn ngôn ngữ trong Cài đặt; system prompt mặc định theo locale.
- Xuất **HTML** — hội thoại dạng trang web độc lập.
- Module xuất **DOCX** riêng (`docx-export.js`) với định dạng Markdown đầy đủ.
- Trang **Privacy Policy** (`privacy.html`) và **Terms of Service** (`terms.html`).
- Nội dung pháp lý song ngữ Anh/Việt (`legal-content.js`).

### Changed
- Xuất **PDF** nâng cao — phân trang, chunking tin nhắn dài, stylesheet riêng.
- Cải thiện sidebar, modals, responsive cho locale mới.

### Fixed
- Sửa lỗi đọc và hiển thị file **PDF** đính kèm (nhiều lần tinh chỉnh v1 → v3).

---

## [1.4.0] — 2026-06-28

### Added
- Lưu trữ **IndexedDB** — hỗ trợ hội thoại lớn, ảnh và file đính kèm.
- Xuất hội thoại ra **PDF** (`pdf-export.js`).

### Changed
- Sidebar — cải thiện danh sách hội thoại, cuộn và hiển thị.
- Migration dữ liệu từ `localStorage` sang IndexedDB.

---

## [1.3.0] — 2026-06-27

### Added
- Nhà cung cấp **Google Gemini**: Gemini 2.5 Flash Lite, 2.5 Flash, 3.5 Flash.
- Model **GPT-5.5**, **Claude Sonnet 4.6**, **Claude Opus 4.8**.
- Trường **Gemini API Key** trong Cài đặt.
- Dropdown chọn model trên header.

### Changed
- Mở rộng modal Cài đặt — API key theo từng provider.
- Cập nhật `FEATURES.md`.

---

## [1.2.1] — 2026-06-27

### Added
- **Cloudflare Worker** proxy (`worker/`) — tùy chọn gọi API qua proxy thay vì trực tiếp từ trình duyệt.

---

## [1.2.0] — 2026-06-27

### Added
- Hỗ trợ **đa model / đa nhà cung cấp:**
  - OpenAI: GPT-5.4 nano, mini, 5.4
  - Anthropic: Claude Haiku 4.5
  - DeepSeek: V4 Flash, V4 Pro
- API key riêng cho Anthropic và DeepSeek.
- Composer tools: **Thinking**, **Tìm kiếm web**, **Tạo hình ảnh**, **Dịch**.
- Nút **Stop** — hủy phản hồi đang streaming.

### Changed
- Refactor `api.js` — streaming đa provider.
- Giao diện composer và header mới.

---

## [1.1.0] — 2026-06-27

### Added
- Render Markdown nâng cao: **KaTeX**, **Mermaid**, **Highlight.js**, sao chép code/bảng.
- **Đính kèm file & ảnh** — vision, kéo thả, dán clipboard.
- Đọc **PDF** (PDF.js), **DOCX** (Mammoth), **XLSX** (SheetJS).
- Thao tác tin nhắn: **Sửa**, **Xóa**, **Retry** (nhiều phiên bản 1/N), **Reply theo đoạn chọn**.
- Xuất hội thoại: **Markdown**, **TXT**, **DOCX**.
- File `FEATURES.md` — tài liệu tính năng.

### Changed
- Cải thiện giao diện chat, composer, sidebar, modals.

---

## [1.0.0] — 2026-06-26

### Added
- Phiên bản đầu tiên **VUTASO AI** — chat AI chạy trên trình duyệt.
- Chat với **OpenAI** (`gpt-4o-mini`), phản hồi **streaming**.
- Quản lý hội thoại — tạo mới, lịch sử, đổi tên, xóa; lưu `localStorage`.
- **Dark / Light** theme.
- Sidebar thu gọn/mở rộng, responsive mobile.
- Modal **Cài đặt** — API key OpenAI, system prompt.
- Render Markdown cơ bản.
- Kiến trúc frontend thuần: HTML, CSS, JavaScript (không build step).

---

## Ghi chú phiên bản

| Phiên bản | Model hỗ trợ | Provider | Theme |
|-----------|:------------:|:--------:|:-----:|
| 1.0.0 | 1 | 1 | 2 |
| 1.2.0 | 6 | 3 | 2 |
| 1.3.0 | 12 | 4 | 2 |
| 1.5.0 | 12 | 4 | 2 |
| 1.6.0 | 12 | 4 | 4 |
| 1.7.0 | 16 | 5 | 4 |
| 1.8.0 | 16 | 5 | 8 |
| Unreleased | 17 | 5 | 8 |

**Provider:** OpenAI · Anthropic · DeepSeek · Google Gemini · Kimi

**Ngôn ngữ giao diện (từ 1.5.0):** `en` · `vi` · `jp` · `zh`
