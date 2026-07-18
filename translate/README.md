# AI Translate

Ứng dụng dịch thuật AI client-side sử dụng **DeepSeek API**, chạy hoàn toàn trên trình duyệt — không cần server backend.

## Tính năng

### Dịch văn bản
- Dịch văn bản thông thường với hỗ trợ **200.000 ký tự/lần**
- Text dài tự động được **chia nhỏ theo đoạn/câu** (10.000 ký tự/đoạn), dịch tuần tự, ghép lại nguyên vẹn
- **Streaming** đầu ra: kết quả hiện dần theo từng token, timeout 90s
- **Huỷ** dịch giữa chừng — giữ lại phần đã dịch

### Dịch file
- Hỗ trợ: **PDF, DOCX, TXT** (tối đa 10MB)
- **PDF scan**: Tesseract.js OCR tự động (tối đa 20 trang/lần)
- **Chọn khoảng trang** cho PDF nhiều trang
- **Progress** hiển thị tiến trình xử lý (trích xuất, OCR)
- Xuất kết quả dưới dạng `.txt` hoặc `.docx`

### Dịch hàng loạt (Batch)
- Thêm nhiều dòng văn bản, dịch **một lúc với 3 luồng đồng thời**
- Mỗi dòng có thể chọn ngôn ngữ nguồn riêng (Auto Detect hoặc cụ thể)
- **Import CSV** (tự động phát hiện header, xác thực cột)
- **Export CSV** (RFC-4180, BOM cho Excel)
- Huỷ batch giữa chừng

### Phát hiện ngôn ngữ tự động
- Chọn **Auto Detect** → model tự nhận diện ngôn ngữ nguồn
- Hiển thị ngôn ngữ phát hiện được trên giao diện

### Tuỳ chỉnh nâng cao
- **Domain**: General, Medical, Legal, Technology, Finance, Academic
- **Tone/Giọng văn**: Professional, Formal, Casual, Technical
- **Custom Glossary**: từ điển riêng (vd: `blockchain = chuỗi khối`) — lưu thành preset
- **Context/Notes**: ngữ cảnh giúp AI hiểu đúng nội dung
- Tất cả tuỳ chỉnh được **lưu lại** qua các lần dùng

### Lịch sử (History)
- Lưu tự động mọi bản dịch
- **Tìm kiếm** (không phân biệt hoa thường) + **lọc theo loại** (Text/File/Batch)
- Dung lượng tối đa 100 entry — tự động xoá cũ khi đầy
- **Export CSV** lịch sử
- Xoá toàn bộ

### Theo dõi token & chi phí
- Hiển thị số token đã dùng + chi phí ước tính sau mỗi lần dịch
- Cộng dồn qua các đoạn/chunk
- Chi tiết: `Prompt tokens` / `Completion tokens` (hover)

### API Key
- Nhập API key DeepSeek ngay trên giao diện
- **Validate** trước khi lưu: kiểm tra key hợp lệ (gọi `GET /models`)
- Lưu vào `localStorage`

### Giao diện
- **Dark/Light theme** tự động theo hệ thống, có nút chuyển
- Thiết kế responsive, phông chữ Inter
- Toast thông báo, loading overlay, empty state

## Cách dùng

1. Mở `index.html` trong trình duyệt (hoặc deploy lên static hosting)
2. Nhập **DeepSeek API Key** ở góc phải header → Save (tự động kiểm tra)
3. Chọn tab Text / File / Batch → nhập nội dung → **Translate**

Yêu cầu: trình duyệt hiện đại (Chrome, Firefox, Safari, Edge).

## Cấu trúc thư mục

```
translate/
├── index.html          # Giao diện chính
├── css/
│   └── style.css       # Tất cả styles
├── js/
│   ├── app.js          # Controller UI chính
│   ├── translator.js   # Client DeepSeek API (chunking, streaming, pool)
│   ├── fileParser.js   # Đọc file (PDF, DOCX, TXT) + OCR
│   ├── history.js      # Quản lý lịch sử (localStorage)
│   ├── languages.js    # Danh sách ngôn ngữ tập trung
│   └── glossaryPresets.js  # Preset glossary (localStorage)
└── README.md
```

## Công nghệ

- **DeepSeek API** (`deepseek-chat` model)
- **pdf.js** (CDN) — render PDF
- **Mammoth.js** (CDN) — đọc DOCX
- **Tesseract.js** (lazy-load từ CDN) — OCR cho PDF scan
- **docx** (lazy-load từ CDN) — tạo file DOCX
- **Inter** font (Google Fonts)

## Lưu ý

- API key được lưu trong `localStorage` — không gửi đi đâu ngoài DeepSeek.
- Không có server backend — mọi thứ chạy trên trình duyệt.
- OCR dùng Tesseract.js chạy local — file PDF scan không rời khỏi máy.
