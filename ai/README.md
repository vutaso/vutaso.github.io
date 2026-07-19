# Vutaso AI

Ứng dụng chat AI chạy trên trình duyệt — hỗ trợ nhiều nhà cung cấp, lưu trữ cục bộ, không cần cài đặt hay build.

**Developed by [VUTASO.com](https://vutaso.com)**

---

## Tổng quan

Vutaso AI là giao diện web để trò chuyện với các model AI từ OpenAI, Anthropic, DeepSeek, Google Gemini và Kimi. Bạn tự cấu hình API key; dữ liệu hội thoại được lưu trên thiết bị của bạn (IndexedDB + localStorage). Yêu cầu chat được gửi trực tiếp từ trình duyệt tới nhà cung cấp bạn chọn.

- **Frontend thuần:** HTML, CSS, JavaScript — không framework, không build step
- **Đa ngôn ngữ:** English, Tiếng Việt, 日本語, 中文
- **8 theme:** Dark, VS Dark, Apple Light/Dark, Hello Kitty, Cyberpunk, NVIDIA, Liquid Glass Dark

---

## Bắt đầu nhanh

### Chạy local

1. Clone hoặc tải thư mục `TestChatAI/`.
2. Mở bằng static server (khuyến nghị — tránh lỗi CORS với một số CDN):

```bash
# Ví dụ với Python
cd TestChatAI
python3 -m http.server 5500
```

3. Truy cập `http://localhost:5500` trong trình duyệt.
4. Mở **Cài đặt** → nhập API key cho provider tương ứng với model bạn muốn dùng.
5. Chọn model trên header và bắt đầu chat.

### Triển khai GitHub Pages

Repo này nằm trong [vutaso.github.io](https://github.com/vutaso/vutaso.github.io). App có thể truy cập tại:

`https://vutaso.github.io/TestChatAI/`

---

## Model hỗ trợ

| Nhà cung cấp | Model | Web search | Tạo ảnh | Thinking |
|--------------|-------|:----------:|:-------:|:--------:|
| **OpenAI** | GPT-5.4 nano, GPT-5.4 mini, GPT-5.4, GPT-5.5 | ✓ | ✓ | ✓ |
| **Anthropic** | Claude Haiku 4.5, Sonnet 4.6, Sonnet 5, Opus 4.8 | ✓ | — | ✓ |
| **DeepSeek** | DeepSeek V4 Flash, V4 Pro | — | — | ✓ |
| **Google** | Gemini 2.5 Flash Lite, 2.5 Flash, 3.5 Flash | ✓ | ✓ | ✓ |
| **Kimi** | K2.5, K2.6, K2.7 Code, K2.7 Code HighSpeed | — | — | ✓ |

Model mặc định: `gemini-3.5-flash`

---

## Tính năng

### 1. Chat & AI

| Tính năng | Mô tả |
|-----------|--------|
| **Trò chuyện với AI** | Gửi tin nhắn văn bản và nhận phản hồi streaming từ model đang chọn |
| **Chọn model** | Dropdown trên header với 17 model từ 5 nhà cung cấp |
| **Streaming** | Hiển thị câu trả lời theo thời gian thực (token-by-token) |
| **Dừng phản hồi** | Nút Stop để hủy yêu cầu đang chạy; nội dung đã nhận được vẫn được giữ lại |
| **System Prompt** | Tùy chỉnh hướng dẫn hệ thống; 20+ preset (Creative, Debug, Code Review, Architecture, v.v.) |
| **Vision** | Gửi ảnh kèm tin nhắn để AI phân tích (JPEG, PNG, GIF, WebP) |
| **Đính kèm tài liệu** | Gửi nội dung file văn bản kèm tin nhắn (txt, md, csv, json, pdf, docx, xlsx, code...) |
| **Tạo lại câu trả lời** | Nút Retry trên tin nhắn assistant để sinh phiên bản mới |
| **Nhiều phiên bản trả lời** | Lưu và chuyển đổi giữa các phiên bản khi dùng Retry (điều hướng 1/N) |
| **Sửa tin nhắn người dùng** | Chỉnh sửa tin nhắn user và tự động gửi lại từ điểm đó |
| **Xóa tin nhắn** | Xóa một tin nhắn user và toàn bộ tin nhắn phía sau |
| **Reply theo đoạn chọn** | Bôi đen văn bản trong tin nhắn → tooltip Reply → chèn trích dẫn blockquote vào ô nhập |
| **Chi phí token** | Ước tính chi phí USD theo từng tin nhắn; cảnh báo khi vượt ngưỡng phiên chat |

### 2. Công cụ Composer

Thanh công cụ phía trên ô nhập tin nhắn; tự ẩn/hiện tùy model đang chọn.

| Tính năng | Mô tả | Model hỗ trợ |
|-----------|--------|--------------|
| **Thinking** | Bật chế độ suy nghĩ; hiển thị reasoning trong khối có thể mở/đóng | Tất cả model |
| **Reasoning Effort** | Mức suy luận (`low` → `max`, `minimal` cho Gemini 3.5) | Theo từng model |
| **Tìm kiếm web** | AI tra cứu thông tin trên web khi trả lời | OpenAI, Anthropic, Google Gemini |
| **Tạo hình ảnh** | Sinh ảnh từ mô tả văn bản | OpenAI, Google Gemini |
| **Dịch** | Dịch văn bản sang ngôn ngữ đích; chỉ trả về bản dịch | Tất cả model |

#### Tạo hình ảnh — tuỳ chọn

| Tuỳ chọn | Giá trị |
|----------|---------|
| **Tỷ lệ** | 1:1, 2:3, 3:4, 4:3, 9:16, 16:9 |
| **Phong cách** | Tự động, Ảnh thật, Minh họa, Anime, Tranh sơn dầu, Pixel art |
| **Mẫu** | Không dùng mẫu, Chân dung, Sản phẩm, Logo, Nền trừu tượng, Tối giản |
| **Ảnh tham chiếu** | Đính kèm ảnh để chỉnh sửa/biến tấu (edit mode) |

> Khi bật **Tạo hình ảnh**, đính kèm ảnh/tài liệu thường bị tắt. **Dịch** và **Tạo hình ảnh** loại trừ lẫn nhau.

#### Dịch — ngôn ngữ đích

English, Tiếng Việt, 中文, 日本語, 한국어, العربية, Deutsch, Español, Español (España), Filipino, Français, Bahasa Indonesia, Italiano, Bahasa Melayu.

### 3. Quản lý hội thoại

| Tính năng | Mô tả |
|-----------|--------|
| **Cuộc trò chuyện mới** | Tạo hội thoại mới từ sidebar |
| **Lịch sử hội thoại** | Danh sách cuộc trò chuyện, sắp xếp theo thời gian cập nhật |
| **Tìm kiếm lịch sử** | Lọc hội thoại theo tiêu đề và nội dung tin nhắn |
| **Chuyển hội thoại** | Click vào mục trong sidebar để mở |
| **Đặt tên tự động** | Tiêu đề hội thoại lấy từ tin nhắn user đầu tiên |
| **Đổi tên** | Đổi tên hiển thị qua modal |
| **Xóa hội thoại** | Xóa từng cuộc hoặc xóa tất cả (sidebar / Cài đặt) |
| **Lưu trữ cục bộ** | Hội thoại, ảnh và file lưu trong IndexedDB + localStorage |

### 4. Đính kèm file & ảnh

| Tính năng | Mô tả |
|-----------|--------|
| **Chọn ảnh** | Nút đính kèm ảnh hoặc file picker (JPEG, PNG, GIF, WebP) |
| **Chọn tài liệu** | Nút đính kèm tài liệu văn bản |
| **Kéo thả** | Kéo thả ảnh/tài liệu vào vùng app (overlay hướng dẫn) |
| **Dán ảnh từ clipboard** | Ctrl/Cmd+V ảnh trực tiếp vào ô nhập |
| **Xem trước đính kèm** | Thumbnail ảnh và chip tên file trước khi gửi |
| **Xóa đính kèm** | Gỡ từng ảnh/file trước khi gửi |
| **Đọc PDF** | Trích xuất toàn bộ text từ PDF bằng PDF.js |
| **Đọc DOCX** | Trích xuất text từ Word bằng Mammoth |
| **Đọc XLSX** | Trích xuất dữ liệu từng sheet Excel dạng CSV bằng SheetJS |

**Định dạng tài liệu hỗ trợ:** `.txt`, `.md`, `.csv`, `.json`, `.xml`, `.html`, `.css`, `.js`, `.ts`, `.py`, `.java`, `.c`, `.cpp`, `.yaml`, `.log`, `.rtf`, `.pdf`, `.docx`, `.xlsx` và các file `text/*`.

### 5. Hiển thị Markdown

| Tính năng | Mô tả |
|-----------|--------|
| **Render Markdown** | Phản hồi assistant hiển thị qua Marked (GFM, xuống dòng) |
| **Syntax highlighting** | Highlight code block với Highlight.js (theme theo giao diện) |
| **Công thức toán** | KaTeX cho `$...$`, `$$...$$`, `\(...\)`, `\[...\]` |
| **Sơ đồ Mermaid** | Tự nhận diện và render flowchart, sequence, gantt, pie... |
| **Chuyển mã/sơ đồ Mermaid** | Toggle xem sơ đồ hoặc mã nguồn Mermaid |
| **Bảng** | Bảng Markdown có header, cuộn ngang, nút sao chép |
| **Sao chép code** | Nút sao chép trên từng code block |
| **Sao chép bảng** | Sao chép bảng dưới dạng Markdown |
| **Preview Markdown** | Panel bên phải xem trước nội dung trong code block `markdown`/`md` |
| **Theme Mermaid** | Sơ đồ Mermaid đổi theme theo giao diện đang chọn |
| **Reasoning** | Khối suy nghĩ (thinking) có thể thu gọn/mở rộng |
| **Nguồn web (Gemini)** | Hiển thị liên kết nguồn khi dùng Google Search grounding |
| **Ảnh AI sinh ra** | Hiển thị ảnh được tạo bởi model trong phản hồi |

### 6. Xuất & sao chép

| Tính năng | Mô tả |
|-----------|--------|
| **Tải Markdown** | Xuất toàn bộ hội thoại hiện tại ra file `.md` |
| **Tải TXT** | Xuất hội thoại dạng văn bản thuần |
| **Sao chép Markdown** | Copy toàn bộ hội thoại dạng Markdown vào clipboard |
| **Xuất Word (.docx)** | Xuất hội thoại ra file `.docx` (tiêu đề, code block, bảng, ảnh) |
| **Xuất PDF** | Xuất hội thoại ra file `.pdf` |
| **Xuất HTML** | Xuất hội thoại dạng trang web độc lập |
| **Sao chép tin nhắn** | Copy nội dung từng tin nhắn (user/assistant) |
| **Menu tải xuống** | Gom các tùy chọn xuất trên header |

### 7. Giao diện & trải nghiệm

| Tính năng | Mô tả |
|-----------|--------|
| **8 theme** | Dark, VS Dark, Apple Light/Dark, Hello Kitty, Cyberpunk, NVIDIA, Liquid Glass Dark |
| **Đa ngôn ngữ** | English, Tiếng Việt, 日本語, 中文 |
| **Sidebar** | Panel lịch sử hội thoại, thu gọn/mở rộng |
| **Responsive mobile** | Sidebar overlay trên màn hình ≤768px |
| **Composer tự co giãn** | Textarea tự điều chỉnh chiều cao theo nội dung |
| **Placeholder động** | Ô nhập đổi gợi ý khi bật Tạo hình ảnh hoặc Dịch |
| **Toast thông báo** | Phản hồi ngắn cho các thao tác (lưu, sao chép, lỗi...) |
| **Banner lỗi API** | Hiển thị lỗi kết nối/API phía trên composer |
| **Màn hình chào** | Empty state khi chưa có tin nhắn |
| **Hướng dẫn sử dụng** | Modal onboarding cho người dùng mới |
| **Cuộn thông minh** | Tự cuộn xuống khi đang ở gần cuối danh sách tin nhắn |
| **Font Inter** | Typography hiện đại qua Google Fonts |
| **Icon Font Awesome** | Bộ icon nhất quán trên toàn app |

### 8. Cài đặt

| Tính năng | Mô tả |
|-----------|--------|
| **API Key (OpenAI)** | Dùng cho model GPT; ẩn/hiện bằng nút mắt |
| **API Key (Anthropic)** | Dùng cho model Claude |
| **API Key (DeepSeek)** | Dùng cho model DeepSeek |
| **API Key (Gemini)** | Dùng cho model Google Gemini |
| **API Key (Kimi)** | Dùng cho model Kimi |
| **System Prompt** | Chỉnh prompt hệ thống hoặc chọn preset |
| **Ngôn ngữ** | Chọn ngôn ngữ giao diện |
| **Theme** | Chọn theme trong modal hoặc nút toggle sidebar |
| **Xóa tất cả hội thoại** | Nút trong Cài đặt (có xác nhận) |
| **Tự mở Cài đặt** | Hiện modal khi chưa có API key cho model đang chọn |

> API key chỉ lưu trong `localStorage` trên máy bạn và chỉ gửi tới nhà cung cấp tương ứng khi chat. **Không** hardcode key trong mã nguồn.

### 9. Phím tắt

| Phím | Hành động |
|------|-----------|
| `Enter` | Gửi tin nhắn (hoặc lưu khi đang sửa tin nhắn) |
| `Shift + Enter` | Xuống dòng trong composer |
| `Ctrl/Cmd + K` | Focus vào ô nhập tin nhắn |
| `Escape` | Thoát sửa tin / đóng tooltip Reply / đóng modal / đóng preview MD / đóng sidebar (mobile) |

---

## Kiến trúc kỹ thuật

- **Frontend thuần:** HTML, CSS, JavaScript (không framework, không build step)
- **API đa nhà cung cấp:**
  - OpenAI: Chat Completions + Responses API (web search, image gen, thinking)
  - Anthropic: Messages API (web search, thinking, adaptive thinking)
  - DeepSeek: Chat Completions (thinking) — gọi trực tiếp từ trình duyệt
  - Google: Gemini `streamGenerateContent` (web search, image gen, thinking)
  - Kimi: Chat Completions (binary thinking)
- **Lưu trữ:** IndexedDB + `localStorage` (key: `testchatai`)
- **Thư viện CDN:** Marked, KaTeX, Highlight.js, Mermaid, PDF.js, Mammoth, SheetJS, docx, html2canvas-pro, jsPDF
- **Tuỳ chỉnh API** (`config.js`): `API_MAX_OUTPUT_TOKENS` (65536), `REASONING_EFFORT` (`high`), `SEARCH_CONTEXT_SIZE` (`high`)

---

## Cấu trúc thư mục

```
TestChatAI/
├── index.html              # Giao diện chính
├── privacy.html            # Chính sách bảo mật
├── terms.html              # Điều khoản dịch vụ
├── README.md               # File này
├── Changelog.md            # Lịch sử phiên bản
├── assets/                 # Favicon, static assets
├── css/                    # Stylesheet (reset, layout, themes...)
├── js/
│   ├── config.js           # Model, endpoint, cấu hình API
│   ├── i18n.js             # Đa ngôn ngữ & system prompt presets
│   ├── storage.js          # IndexedDB + localStorage
│   ├── conversations.js    # CRUD hội thoại & tin nhắn
│   ├── api.js              # Streaming API đa nhà cung cấp
│   ├── files.js            # Đọc file/ảnh đính kèm
│   ├── markdown.js         # Render MD, KaTeX, Mermaid
│   ├── ui.js               # DOM & render giao diện
│   ├── events.js           # Sự kiện & luồng tương tác
│   ├── utils.js            # Tiện ích chung
│   ├── docx-export.js      # Xuất Word
│   ├── pdf-export.js       # Xuất PDF
│   ├── html-export.js      # Xuất HTML
│   ├── legal-content.js    # Nội dung trang pháp lý
│   └── main.js             # Khởi tạo app
└── worker/                 # Cloudflare Worker proxy (tùy chọn)
    ├── src/index.js
    └── wrangler.toml
```

---

## Cấu hình

Chỉnh sửa `js/config.js` nếu cần:

| Tuỳ chọn | Mặc định | Mô tả |
|----------|----------|--------|
| `DEFAULT_MODEL` | `gemini-3.5-flash` | Model khi mở app lần đầu |
| `DEFAULT_LOCALE` | `en` | Ngôn ngữ giao diện |
| `API_MAX_OUTPUT_TOKENS` | `65536` | Giới hạn token đầu ra |
| `REASONING_EFFORT` | `high` | Mức suy luận mặc định |
| `TOKEN_COST_WARNING_USD` | `1` | Ngưỡng cảnh báo chi phí phiên chat |

---

## Cloudflare Worker (tùy chọn)

Thư mục `worker/` chứa proxy Cloudflare:

- **DeepSeek** — tránh CORS khi cần (dùng API key server-side)
- **NVIDIA** — **bắt buộc** cho model DeepSeek V4 Flash (NVIDIA), vì `integrate.api.nvidia.com` không hỗ trợ CORS từ trình duyệt
- **Share** — lưu snapshot hội thoại vào KV (`POST/GET /share`), link `?share=id` xem được trên trình duyệt ẩn danh (chỉ đọc, hết hạn 30 ngày)

Triển khai:

```bash
cd worker
npm install
npx wrangler secret put DEEPSEEK_API_KEY   # chỉ cần nếu dùng proxy DeepSeek
npx wrangler deploy
```

Sau khi deploy, cập nhật trong `js/config.js`:

- `DEEPSEEK_PROXY_ENDPOINT` — URL workers.dev (path gốc)
- `NVIDIA_PROXY_ENDPOINT` — cùng URL + `/nvidia` (ví dụ `https://testchatai-deepseek-proxy.<account>.workers.dev/nvidia`)
- `SHARE_ENDPOINT` — cùng URL + `/share`

API key NVIDIA do người dùng nhập trong Cài đặt; worker chỉ chuyển tiếp header `Authorization`, không lưu key.

---

## Bảo mật & quyền riêng tư

- Hội thoại và API key lưu **cục bộ** trên thiết bị của bạn
- VUTASO.com **không** vận hành máy chủ trung tâm lưu dữ liệu chat
- Khi gửi tin nhắn, nội dung được truyền trực tiếp tới nhà cung cấp AI bạn chọn
- [Privacy Policy](privacy.html) · [Terms of Service](terms.html)

---

## Changelog

Xem [Changelog.md](Changelog.md) để biết lịch sử phiên bản và thay đổi.

---

## Giấy phép & bản quyền

© [VUTASO.com](https://vutaso.com). All rights reserved.
