# VUTASO AI — Danh sách tính năng

Ứng dụng chat AI chạy trên trình duyệt, hỗ trợ nhiều nhà cung cấp (OpenAI, Anthropic, DeepSeek, Google Gemini). Dữ liệu được lưu cục bộ trên máy người dùng.

---

## 1. Chat & AI

| Tính năng | Mô tả |
|-----------|--------|
| **Trò chuyện với AI** | Gửi tin nhắn văn bản và nhận phản hồi streaming từ model đang chọn |
| **Chọn model** | Dropdown trên header với 12 model từ 4 nhà cung cấp (mặc định: `gemini-3.5-flash`) |
| **Streaming** | Hiển thị câu trả lời theo thời gian thực (token-by-token) |
| **Dừng phản hồi** | Nút Stop để hủy yêu cầu đang chạy; nội dung đã nhận được vẫn được giữ lại |
| **System Prompt** | Tùy chỉnh hướng dẫn hệ thống cho AI (mặc định: trợ lý tiếng Việt, trả lời có cấu trúc) |
| **Vision (đa phương thức)** | Gửi ảnh kèm tin nhắn để AI phân tích (JPEG, PNG, GIF, WebP) |
| **Đính kèm tài liệu** | Gửi nội dung file văn bản kèm tin nhắn (txt, md, csv, json, pdf, docx, code...) |
| **Tạo lại câu trả lời** | Nút Retry trên tin nhắn assistant để sinh phiên bản mới |
| **Nhiều phiên bản trả lời** | Lưu và chuyển đổi giữa các phiên bản khi dùng Retry (điều hướng 1/N) |
| **Sửa tin nhắn người dùng** | Chỉnh sửa tin nhắn user và tự động gửi lại từ điểm đó |
| **Xóa tin nhắn** | Xóa một tin nhắn user và toàn bộ tin nhắn phía sau |
| **Reply theo đoạn chọn** | Bôi đen văn bản trong tin nhắn → tooltip Reply → chèn trích dẫn dạng blockquote vào ô nhập |

### Model hỗ trợ

| Nhà cung cấp | Model | Web search | Tạo ảnh | Thinking |
|--------------|-------|:----------:|:-------:|:--------:|
| **OpenAI** | GPT-5.4 nano, GPT-5.4 mini, GPT-5.4, GPT-5.5 | ✓ | ✓ | ✓ |
| **Anthropic** | Claude Haiku 4.5, Claude Sonnet 4.6, Claude Opus 4.8 | ✓ | — | ✓ |
| **DeepSeek** | DeepSeek V4 Flash, DeepSeek V4 Pro | — | — | ✓ |
| **Google** | Gemini 2.5 Flash Lite, Gemini 2.5 Flash, Gemini 3.5 Flash | ✓ | ✓ | ✓ |

---

## 2. Công cụ Composer

Thanh công cụ phía trên ô nhập tin nhắn; tự ẩn/hiện tùy model đang chọn.

| Tính năng | Mô tả | Model hỗ trợ |
|-----------|--------|--------------|
| **Thinking** | Bật chế độ suy nghĩ (reasoning); hiển thị nội dung reasoning trong khối `<details>` có thể mở/đóng | Tất cả model |
| **Tìm kiếm web** | AI tra cứu thông tin trên web khi trả lời | OpenAI, Anthropic, Google Gemini |
| **Tạo hình ảnh** | Sinh ảnh từ mô tả văn bản | OpenAI (Responses API), Google Gemini (tự chuyển sang model image: `gemini-2.5-flash-image`, `gemini-3.1-flash-image`) |
| **Dịch** | Dịch văn bản sang ngôn ngữ đích; chỉ trả về bản dịch | Tất cả model |

### Tạo hình ảnh — tuỳ chọn

| Tuỳ chọn | Giá trị |
|----------|---------|
| **Tỷ lệ** | 1:1, 2:3, 3:4, 4:3, 9:16, 16:9 |
| **Phong cách** | Tự động, Ảnh thật, Minh họa, Anime, Tranh sơn dầu, Pixel art |
| **Mẫu** | Không dùng mẫu, Chân dung, Sản phẩm, Logo, Nền trừu tượng, Tối giản |
| **Ảnh tham chiếu** | Đính kèm ảnh để chỉnh sửa/biến tấu (edit mode) |

> Khi bật **Tạo hình ảnh**, đính kèm ảnh/tài liệu thường bị tắt. **Dịch** và **Tạo hình ảnh** loại trừ lẫn nhau.

### Dịch — ngôn ngữ đích

English, Tiếng Việt, 中文, 日本語, 한국어, العربية, Deutsch, Español, Español (España), Filipino, Français, Bahasa Indonesia, Italiano, Bahasa Melayu.

---

## 3. Quản lý hội thoại

| Tính năng | Mô tả |
|-----------|--------|
| **Cuộc trò chuyện mới** | Tạo hội thoại mới từ sidebar |
| **Lịch sử hội thoại** | Danh sách cuộc trò chuyện, sắp xếp theo thời gian cập nhật |
| **Chuyển hội thoại** | Click vào mục trong sidebar để mở |
| **Đặt tên tự động** | Tiêu đề hội thoại lấy từ tin nhắn user đầu tiên |
| **Đổi tên** | Đổi tên hiển thị qua modal |
| **Xóa hội thoại** | Xóa từng cuộc hoặc xóa tất cả (sidebar / Cài đặt) |
| **Lưu trữ cục bộ** | Toàn bộ hội thoại lưu trong `localStorage` |

---

## 4. Đính kèm file & ảnh

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

**Định dạng tài liệu hỗ trợ:** `.txt`, `.md`, `.csv`, `.json`, `.xml`, `.html`, `.css`, `.js`, `.ts`, `.py`, `.java`, `.c`, `.cpp`, `.yaml`, `.log`, `.rtf`, `.pdf`, `.docx` và các file `text/*`.

---

## 5. Hiển thị Markdown

| Tính năng | Mô tả |
|-----------|--------|
| **Render Markdown** | Phản hồi assistant hiển thị qua Marked (GFM, xuống dòng) |
| **Syntax highlighting** | Highlight code block với Highlight.js (Atom One Dark) |
| **Công thức toán** | KaTeX cho `$...$`, `$$...$$`, `\(...\)`, `\[...\]` |
| **Sơ đồ Mermaid** | Tự nhận diện và render flowchart, sequence, gantt, pie... |
| **Chuyển mã/sơ đồ Mermaid** | Toggle xem sơ đồ hoặc mã nguồn Mermaid |
| **Bảng** | Bảng Markdown có header, cuộn ngang, nút sao chép |
| **Sao chép code** | Nút sao chép trên từng code block |
| **Sao chép bảng** | Sao chép bảng dưới dạng Markdown |
| **Preview Markdown** | Panel bên phải xem trước nội dung trong code block `markdown`/`md` |
| **Theme Mermaid** | Sơ đồ Mermaid đổi theme theo Dark/Light |
| **Reasoning** | Khối suy nghĩ (thinking) có thể thu gọn/mở rộng trên tin nhắn assistant |
| **Nguồn web (Gemini)** | Hiển thị liên kết nguồn khi dùng Google Search grounding |
| **Ảnh AI sinh ra** | Hiển thị ảnh được tạo bởi model trong phản hồi |

---

## 6. Xuất & sao chép

| Tính năng | Mô tả |
|-----------|--------|
| **Tải Markdown** | Xuất toàn bộ hội thoại hiện tại ra file `.md` |
| **Sao chép Markdown** | Copy toàn bộ hội thoại dạng Markdown vào clipboard |
| **Xuất PDF** | Xuất hội thoại ra PDF (hỗ trợ cả tin đang stream) |
| **PDF có định dạng** | Tự chọn chế độ raster (html2canvas) khi có code/bảng/toán/ảnh, hoặc text thuần (jsPDF + Noto Sans) |
| **Xuất Word (.docx)** | Xuất hội thoại ra file `.docx` với định dạng Markdown (tiêu đề, code block, bảng, ảnh đính kèm) |
| **Sao chép tin nhắn** | Copy nội dung từng tin nhắn (user/assistant) |

---

## 7. Giao diện & trải nghiệm

| Tính năng | Mô tả |
|-----------|--------|
| **Dark / Light theme** | Chuyển theme từ sidebar, Cài đặt, hoặc nút toggle |
| **Sidebar** | Panel lịch sử hội thoại, thu gọn/mở rộng |
| **Responsive mobile** | Sidebar overlay trên màn hình ≤768px |
| **Composer tự co giãn** | Textarea tự điều chỉnh chiều cao theo nội dung |
| **Placeholder động** | Ô nhập đổi gợi ý khi bật Tạo hình ảnh hoặc Dịch |
| **Enter gửi / Shift+Enter xuống dòng** | Phím tắt nhập liệu quen thuộc |
| **Toast thông báo** | Phản hồi ngắn cho các thao tác (lưu, sao chép, lỗi...) |
| **Banner lỗi API** | Hiển thị lỗi kết nối/API phía trên composer |
| **Màn hình chào** | Empty state khi chưa có tin nhắn |
| **Cuộn thông minh** | Tự cuộn xuống khi đang ở gần cuối danh sách tin nhắn |
| **Font Inter** | Typography hiện đại qua Google Fonts |
| **Icon Font Awesome** | Bộ icon nhất quán trên toàn app |

---

## 8. Cài đặt

| Tính năng | Mô tả |
|-----------|--------|
| **API Key (OpenAI)** | Dùng cho model GPT; ẩn/hiện bằng nút mắt |
| **API Key (Anthropic)** | Dùng cho model Claude |
| **API Key (DeepSeek)** | Tuỳ chọn — để trống sẽ dùng proxy server (nếu đã cấu hình) |
| **API Key (Gemini)** | Dùng cho model Google Gemini |
| **System Prompt** | Chỉnh prompt hệ thống tùy ý |
| **Theme** | Chọn Dark hoặc Light trong modal |
| **Xóa tất cả hội thoại** | Nút trong Cài đặt (có xác nhận) |
| **Tự mở Cài đặt** | Hiện modal khi chưa có API key cho model đang chọn |

> API key chỉ lưu trong `localStorage` trên máy bạn và chỉ gửi tới nhà cung cấp tương ứng khi chat. **Không** hardcode key trong mã nguồn.

---

## 9. Phím tắt

| Phím | Hành động |
|------|-----------|
| `Enter` | Gửi tin nhắn (hoặc lưu khi đang sửa tin nhắn) |
| `Shift + Enter` | Xuống dòng trong composer |
| `Ctrl/Cmd + K` | Focus vào ô nhập tin nhắn |
| `Escape` | Thoát sửa tin / đóng tooltip Reply / đóng modal / đóng preview MD / đóng sidebar (mobile) |

---

## 10. Kiến trúc kỹ thuật

- **Frontend thuần:** HTML, CSS, JavaScript (không framework, không build step)
- **API đa nhà cung cấp:**
  - OpenAI: Chat Completions + Responses API (web search, image gen, thinking)
  - Anthropic: Messages API (web search, thinking)
  - DeepSeek: Chat Completions (thinking) — trực tiếp hoặc qua proxy
  - Google: Gemini `streamGenerateContent` (web search, image gen, thinking)
- **DeepSeek proxy:** Cloudflare Worker (`worker/`) giữ API key phía server, CORS whitelist
- **Lưu trữ:** `localStorage` (key: `testchatai`)
- **Thư viện CDN:** Marked, KaTeX, Highlight.js, Mermaid, jsPDF, html2canvas, PDF.js, Mammoth, docx
- **Tuỳ chỉnh API** (`config.js`): `API_MAX_OUTPUT_TOKENS` (65536), `REASONING_EFFORT` (`high`), `SEARCH_CONTEXT_SIZE` (`high`)

### DeepSeek proxy (Cloudflare Worker)

```
TestChatAI/worker/
├── src/index.js       # Proxy POST → api.deepseek.com
├── wrangler.toml      # Cấu hình worker & ALLOWED_ORIGINS
├── .dev.vars.example  # Mẫu biến môi trường local
└── package.json
```

1. `cd TestChatAI/worker && npx wrangler secret put DEEPSEEK_API_KEY`
2. `npx wrangler deploy`
3. Điền URL `workers.dev` vào `DEEPSEEK_PROXY_ENDPOINT` trong `js/config.js`

---

## 11. Cấu trúc mã nguồn

```
TestChatAI/
├── index.html          # Giao diện chính
├── css/                # Reset, biến, layout, sidebar, chat, composer, modal, responsive
├── js/
│   ├── config.js       # Model, endpoint, cấu hình proxy
│   ├── storage.js      # localStorage
│   ├── conversations.js# CRUD hội thoại & tin nhắn
│   ├── api.js          # Streaming API đa nhà cung cấp
│   ├── files.js        # Xử lý đọc file/ảnh
│   ├── markdown.js     # Render MD, KaTeX, Mermaid
│   ├── ui.js           # DOM & render giao diện
│   ├── events.js       # Sự kiện & luồng tương tác
│   ├── utils.js        # Tiện ích, xuất PDF/DOCX
│   └── main.js         # Khởi tạo app
├── worker/             # Cloudflare Worker proxy DeepSeek
└── assets/             # Favicon
```
