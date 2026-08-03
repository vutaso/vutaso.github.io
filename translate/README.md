# AI Translate

Ứng dụng dịch thuật AI client-side sử dụng **DeepSeek API**, chạy hoàn toàn trên trình duyệt — không cần server backend.

## Tính năng

### Dịch văn bản
- Dịch văn bản thông thường với hỗ trợ **200.000 ký tự/lần**
- Text dài tự động được **chia nhỏ theo đoạn/câu** (10.000 ký tự/đoạn), dịch tuần tự, ghép lại nguyên vẹn
- **Streaming** đầu ra: kết quả hiện dần theo từng token, timeout 90s
- **Huỷ** dịch giữa chừng — giữ lại phần đã dịch

### Dịch file
- Hỗ trợ: **PDF, DOCX, PPTX, XLSX, TXT** (tối đa 10MB)
- **File dài không giới hạn số ký tự**: text vượt 200.000 ký tự tự động chia theo đoạn văn thành nhiều section, dịch tuần tự rồi ghép lại nguyên vẹn
- **PDF scan**: Tesseract.js OCR tự động (tối đa 20 trang/lần)
- **Chọn khoảng trang** cho PDF nhiều trang
- **Progress** hiển thị tiến trình xử lý (trích xuất, OCR)
- Xuất kết quả dưới dạng `.txt` hoặc `.docx`
- **Upload nhiều file cùng lúc**: kéo-thả hoặc chọn nhiều file → xếp thành hàng đợi, dịch tuần tự từng file
- **Keep-format Office export**: dịch file DOCX/PPTX/XLSX gốc mà giữ nguyên layout, heading, style, bảng, hình ảnh, font, header/footer (DOCX) và formatting từng run (bold/italic giữa câu) — tái dùng `JSZip` để sửa XML trong ZIP. Có thể bật checkbox **Keep original format** ngay từ trước khi upload để nút Translate xuất thẳng file định dạng
- **Keep-format PDF export**: render từng trang bằng `pdf.js`, gom text layer thành đoạn, dịch rồi **vẽ đè bản dịch lên đúng vị trí** trên trang, đóng gói lại bằng `jsPDF` — layout/hình/bảng giữ nguyên tuyệt đối về mặt hiển thị (trang trở thành ảnh nên text không chọn được)
- **Chế độ song ngữ (Bilingual)**: xen kẽ đoạn gốc/đoạn dịch trong keep-format DOCX/PPTX — bản dịch chèn thành đoạn mới ngay sau đoạn gốc, thừa hưởng style gốc
- **Xem song ngữ trên màn hình**: nút Bilingual ở ô kết quả (tab Text & File) hiển thị mỗi đoạn gốc kèm bản dịch ngay bên dưới — đọc đối chiếu kiểu immersive translate; Copy/Download vẫn chỉ lấy bản dịch
- **Dịch hình ảnh trong file**: OCR ảnh nhúng (PNG/JPEG/WebP) bằng Tesseract chạy local, dịch theo đoạn (1 API call/đoạn) rồi **vẽ lại trực tiếp lên ảnh** tại đúng vị trí/kích thước gốc — ảnh giữ nguyên kích thước nên layout file không đổi

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
- **Mobile-first UI**: header 1 hàng gọn, ô API key đủ rộng; nút điều khiển to dễ bấm
- **Fixed layout**: khung dịch cố định chiều cao + cuộn nội bộ (không tràn trang)

### Accessibility (A11y)
- **ARIA labels & roles**: tab pattern, live regions, dialog, status updates
- **Keyboard navigation**: Tab, Enter/Space để kích hoạt; focus ring hiển thị rõ
- **Focus management**: modal trap focus, khôi phục vị trí cũ khi đóng
- **Screen reader support**: label gắn control, placeholder text, động thái thông báo qua aria-live
- **Tất cả nút icon** có `aria-label` mô tả chức năng

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
- **JSZip** (lazy-load từ CDN) — giải nén/nén DOCX/PPTX/XLSX để giữ format khi dịch
- **Inter** font (Google Fonts)

## Lưu ý

- API key được lưu trong `localStorage` — không gửi đi đâu ngoài DeepSeek.
- Không có server backend — mọi thứ chạy trên trình duyệt.
- OCR dùng Tesseract.js chạy local — file PDF scan không rời khỏi máy.
