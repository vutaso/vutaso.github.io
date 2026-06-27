# VUTASO AI — Danh sách tính năng

Ứng dụng chat AI chạy trên trình duyệt, kết nối trực tiếp với OpenAI API. Dữ liệu được lưu cục bộ trên máy người dùng.

---

## 1. Chat & AI

| Tính năng | Mô tả |
|-----------|--------|
| **Trò chuyện với AI** | Gửi tin nhắn văn bản và nhận phản hồi từ model `gpt-5.4-nano` qua OpenAI Chat Completions API |
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

---

## 2. Quản lý hội thoại

| Tính năng | Mô tả |
|-----------|--------|
| **Cuộc trò chuyện mới** | Tạo hội thoại mới từ sidebar |
| **Lịch sử hội thoại** | Danh sách tối đa 100 cuộc trò chuyện, sắp xếp theo thời gian cập nhật |
| **Chuyển hội thoại** | Click vào mục trong sidebar để mở |
| **Đặt tên tự động** | Tiêu đề hội thoại lấy từ tin nhắn user đầu tiên (tối đa 40 ký tự) |
| **Đổi tên** | Đổi tên hiển thị qua modal |
| **Xóa hội thoại** | Xóa từng cuộc hoặc xóa tất cả (sidebar / Cài đặt) |
| **Lưu trữ cục bộ** | Toàn bộ hội thoại lưu trong `localStorage` |

---

## 3. Đính kèm file & ảnh

| Tính năng | Mô tả |
|-----------|--------|
| **Chọn ảnh** | Nút đính kèm ảnh hoặc file picker (tối đa 5 ảnh/tin, 5MB/ảnh) |
| **Chọn tài liệu** | Nút đính kèm tài liệu (tối đa 5 file/tin, 10MB/file) |
| **Kéo thả** | Kéo thả ảnh/tài liệu vào vùng app (overlay hướng dẫn) |
| **Dán ảnh từ clipboard** | Ctrl/Cmd+V ảnh trực tiếp vào ô nhập |
| **Xem trước đính kèm** | Thumbnail ảnh và chip tên file trước khi gửi |
| **Xóa đính kèm** | Gỡ từng ảnh/file trước khi gửi |
| **Đọc PDF** | Trích xuất text từ PDF (tối đa 50 trang) bằng PDF.js |
| **Đọc DOCX** | Trích xuất text từ Word bằng Mammoth |
| **Giới hạn nội dung** | Nội dung file text cắt ở 80.000 ký tự |

**Định dạng tài liệu hỗ trợ:** `.txt`, `.md`, `.csv`, `.json`, `.xml`, `.html`, `.css`, `.js`, `.ts`, `.py`, `.java`, `.c`, `.cpp`, `.yaml`, `.log`, `.rtf`, `.pdf`, `.docx` và các file `text/*`.

---

## 4. Hiển thị Markdown

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

---

## 5. Xuất & sao chép

| Tính năng | Mô tả |
|-----------|--------|
| **Tải Markdown** | Xuất toàn bộ hội thoại hiện tại ra file `.md` |
| **Sao chép Markdown** | Copy toàn bộ hội thoại dạng Markdown vào clipboard |
| **Xuất PDF** | Xuất hội thoại ra PDF (hỗ trợ cả tin đang stream) |
| **PDF có định dạng** | Tự chọn chế độ raster (html2canvas) khi có code/bảng/toán/ảnh, hoặc text thuần (jsPDF + Noto Sans) |
| **Sao chép tin nhắn** | Copy nội dung từng tin nhắn (user/assistant) |

---

## 6. Giao diện & trải nghiệm

| Tính năng | Mô tả |
|-----------|--------|
| **Dark / Light theme** | Chuyển theme từ sidebar, Cài đặt, hoặc nút toggle |
| **Sidebar** | Panel lịch sử hội thoại, thu gọn/mở rộng |
| **Responsive mobile** | Sidebar overlay trên màn hình ≤768px |
| **Composer tự co giãn** | Textarea tự điều chỉnh chiều cao theo nội dung |
| **Enter gửi / Shift+Enter xuống dòng** | Phím tắt nhập liệu quen thuộc |
| **Toast thông báo** | Phản hồi ngắn cho các thao tác (lưu, sao chép, lỗi...) |
| **Banner lỗi API** | Hiển thị lỗi kết nối/API phía trên composer |
| **Màn hình chào** | Empty state khi chưa có tin nhắn |
| **Cuộn thông minh** | Tự cuộn xuống khi đang ở gần cuối danh sách tin nhắn |
| **Font Inter** | Typography hiện đại qua Google Fonts |
| **Icon Font Awesome** | Bộ icon nhất quán trên toàn app |

---

## 7. Cài đặt

| Tính năng | Mô tả |
|-----------|--------|
| **API Key OpenAI** | Nhập và lưu key (ẩn/hiện bằng nút mắt) |
| **System Prompt** | Chỉnh prompt hệ thống tùy ý |
| **Theme** | Chọn Dark hoặc Light trong modal |
| **Xóa tất cả hội thoại** | Nút trong Cài đặt (có xác nhận) |
| **Tự mở Cài đặt** | Hiện modal khi chưa có API key |

> API key chỉ lưu trong `localStorage` trên máy bạn và chỉ gửi tới OpenAI khi chat.

---

## 8. Phím tắt

| Phím | Hành động |
|------|-----------|
| `Enter` | Gửi tin nhắn (hoặc lưu khi đang sửa tin nhắn) |
| `Shift + Enter` | Xuống dòng trong composer |
| `Ctrl/Cmd + K` | Focus vào ô nhập tin nhắn |
| `Escape` | Thoát sửa tin / đóng tooltip Reply / đóng modal / đóng preview MD / đóng sidebar (mobile) |

---

## 9. Kiến trúc kỹ thuật

- **Frontend thuần:** HTML, CSS, JavaScript (không framework, không build step)
- **API:** OpenAI Chat Completions (`stream: true`, `max_completion_tokens: 16384`)
- **Lưu trữ:** `localStorage` (key: `testchatai`)
- **Thư viện CDN:** Marked, KaTeX, Highlight.js, Mermaid, jsPDF, html2canvas, PDF.js, Mammoth

### Giới hạn cấu hình

| Tham số | Giá trị |
|---------|---------|
| Số hội thoại tối đa | 100 |
| Độ dài tiêu đề | 40 ký tự |
| Ảnh / tin nhắn | 5 (≤ 5 MB/ảnh) |
| File / tin nhắn | 5 (≤ 10 MB/file) |
| Nội dung file gửi API | ≤ 80.000 ký tự |
| Trang PDF đọc | ≤ 50 trang |

---

## 10. Cấu trúc mã nguồn

```
TestChatAI/
├── index.html          # Giao diện chính
├── css/                # Reset, biến, layout, sidebar, chat, composer, modal, responsive
├── js/
│   ├── config.js       # Cấu hình app & giới hạn
│   ├── storage.js      # localStorage
│   ├── conversations.js# CRUD hội thoại & tin nhắn
│   ├── api.js          # OpenAI streaming API
│   ├── files.js        # Xử lý đọc file/ảnh
│   ├── markdown.js     # Render MD, KaTeX, Mermaid
│   ├── ui.js           # DOM & render giao diện
│   ├── events.js       # Sự kiện & luồng tương tác
│   ├── utils.js        # Tiện ích, xuất PDF
│   └── main.js         # Khởi tạo app
└── assets/             # Favicon
```
