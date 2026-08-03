# AI Translate — Hướng dẫn sử dụng chi tiết

Ứng dụng dịch thuật AI chạy hoàn toàn trên trình duyệt, dùng DeepSeek API. Không cần cài đặt, không cần server backend.

---

## Mục lục

1. [Bắt đầu](#bắt-đầu)
2. [Nhập API Key](#nhập-api-key)
3. [Tab Text — Dịch văn bản](#tab-text--dịch-văn-bản)
4. [Tab File — Dịch file](#tab-file--dịch-file)
5. [Tab Batch — Dịch hàng loạt](#tab-batch--dịch-hàng-loạt)
6. [Tab History — Lịch sử](#tab-history--lịch-sử)
7. [Tuỳ chỉnh giao diện](#tuỳ-chỉnh-giao-diện)
8. [Phím tắt](#phím-tắt)
9. [Glossary Presets](#glossary-presets)
10. [Lưu ý kỹ thuật](#lưu-ý-kỹ-thuật)

---

## Bắt đầu

1. Mở `index.html` trong trình duyệt hiện đại:
   - **Chrome** 90+, **Firefox** 90+, **Safari** 15+, **Edge** 90+
   - Không hỗ trợ IE
2. Nhập **DeepSeek API Key** ở góc phải header → nhấn **Save**
3. Chọn tab phù hợp (Text / File / Batch) → bắt đầu dịch

> **Yêu cầu:** Trình duyệt phải hỗ trợ `fetch`, `ReadableStream`, `AbortController`, `localStorage`. Hầu hết trình duyệt hiện đại đều hỗ trợ.

---

## Nhập API Key

### Cách lấy key
1. Truy cập [platform.deepseek.com](https://platform.deepseek.com)
2. Đăng nhập / tạo tài khoản
3. Vào **API Keys** → **Create new secret key**
4. Sao chép key (chỉ hiển thị 1 lần)

### Nhập key vào app
1. Dán key vào ô **DeepSeek API Key** ở góc phải header
2. Nhấn **Save**
3. App tự động kiểm tra key bằng cách gọi `GET /v1/models` (không tốn token)
4. Nếu key hợp lệ → thông báo "API key saved and verified"
5. Nếu key sai → thông báo lỗi, ô key được focus để chỉnh sửa
6. Nếu mạng lỗi khi kiểm tra → key vẫn được lưu với cảnh báo "Could not verify the key"

### Lưu trữ
- Key lưu trong `localStorage` với key `deepseek_api_key`
- Chỉ gửi tới `api.deepseek.com` — không gửi nơi khác
- Nhập rỗng + Save → xoá key

---

## Tab Text — Dịch văn bản

### Dịch cơ bản

1. Chọn **From** (ngôn ngữ nguồn):
   - Chọn cụ thể (English, Vietnamese, Japanese, ...) hoặc **Auto Detect**
   - Auto Detect: AI tự nhận diện ngôn ngữ, hiển thị kết quả nhận diện trên giao diện
2. Chọn **To** (ngôn ngữ đích)
3. Nhập text vào ô bên trái
4. Nhấn **Translate** hoặc `Ctrl+Enter` (Windows/Linux) / `Cmd+Enter` (Mac)

### Giới hạn

| Thông số | Giá trị |
|----------|---------|
| Ký tự tối đa | 200.000 |
| Ký tự mỗi chunk | 10.000 |
| Số chunk tối đa | 20 (200k / 10k) |

- Text > 10.000 ký tự: tự động chia thành nhiều chunk, dịch tuần tự, ghép lại
- Text > 200.000 ký tự: hiện lỗi "Text too long"

### Streaming (truyền trực tiếp)

- Kết quả hiện dần theo từng token (từ trái sang phải)
- Timeout 90 giây nếu không nhận data mới (stall)
- Nếu stream bị cắt → tự động retry 3 lần với backoff

### Huỷ dịch

- Nhấn **Cancel** khi đang dịch
- Phần đã dịch được giữ nguyên trên giao diện
- Thông báo "Translation cancelled" (thành công, không phải lỗi)

### Tuỳ chọn nâng cao (nhấn Advanced)

#### Domain (lĩnh vực)
| Giá trị | Mô tả |
|---------|-------|
| General | Dịch chung, phù hợp hầu hết nội dung |
| Medical | Thuật ngữ y khoa |
| Legal | Thuật ngữ pháp lý |
| Technology | Công nghệ, IT |
| Finance | Tài chính, ngân hàng |
| Academic | Học thuật, nghiên cứu |

#### Tone (giọng văn)
| Giá trị | Mô tả |
|---------|-------|
| Professional | Chuyên nghiệp |
| Formal | Trang trọng |
| Casual | Thân mật, đời thường |
| Technical | Kỹ thuật |

#### Custom Glossary (từ điển riêng)
- Định nghĩa từ cần dịch theo cách riêng
- Mỗi dòng một từ, định dạng: `English = Tiếng Việt`
- Ví dụ:
  ```
  COVID-19 = Bệnh dịch COVID-19
  blockchain = chuỗi khối
  AI = Trí tuệ nhân tạo
  ```
- **Lưu ý:** Chỉ tách trên dấu `=` đầu tiên. Dòng `A=B testing = Thử nghiệm A=B` sẽ đúng

#### Context/Notes (ngữ cảnh)
- Cung cấp thông tin bổ sung giúp AI dịch chính xác hơn
- Ví dụ:
  ```
  This is a medical report about heart disease for a patient in Vietnam.
  Use medical terminology. Keep patient names unchanged.
  ```

### Nút ⇄ (Swap)
- Hoán đổi ngôn ngữ nguồn ↔ đích
- Nếu nguồn đang là Auto Detect → hiện lỗi "Set source language first"

### Nút Reuse
- Dùng kết quả dịch làm input mới
- Tự động hoán đổi hướng dịch (nguồn ↔ đích)
- Ví dụ: EN→VI → nhấn Reuse → tự chuyển thành VI→EN với kết quả làm input

### Nút Copy
- Sao chép toàn bộ kết quả dịch
- Bị disable khi đang streaming (chỉ enable sau khi dịch xong)

### Nút Bilingual (xem song ngữ)
- Bật/tắt chế độ xem song ngữ ngay trong ô kết quả: mỗi đoạn gốc hiển thị với bản dịch của nó ngay bên dưới (bản dịch tô màu nhấn), kiểu đọc song song như các công cụ immersive translate
- Có ở cả tab Text và tab File; trạng thái bật giữ nguyên trong phiên — lần dịch sau tự hiển thị song ngữ khi xong
- Ghép cặp theo thứ tự đoạn (tách theo dòng trống): prompt yêu cầu model giữ nguyên cấu trúc đoạn nên thường khớp 1-1; nếu số đoạn lệch, các đoạn dư được xếp nối ở cuối
- Văn bản gốc dùng để ghép cặp được chụp tại thời điểm bấm Translate — sửa input (hoặc đổi page range PDF) sau khi dịch xong không làm lệch cặp
- Copy / Download / Reuse vẫn chỉ lấy bản dịch (không lẫn text gốc) dù đang bật chế độ này
- Khác với **Chế độ song ngữ** của keep-format export (tab File): tính năng này chỉ thay đổi cách hiển thị trên màn hình, không ảnh hưởng file tải về

### Nút Clear
- Xoá input, kết quả, và bản nháp (draft) trong localStorage

### Bản nháp (Draft)
- Text nhập vào tự động lưu sau 400ms (debounce)
- Nếu refresh trang → text được khôi phục
- Nhấn Clear → xoá bản nháp

### Hiển thị token & chi phí
- Sau mỗi lần dịch: hiển thị tổng số token + chi phí ước tính
- Hover để xem chi tiết: `Prompt tokens` + `Completion tokens`
- Chi phí dựa trên giá DeepSeek chat (USD/1M tokens):
  - Input: $0.27
  - Output: $1.10

---

## Tab File — Dịch file

### Upload file

#### Cách upload
1. **Kéo-thả** file vào vùng upload
2. Hoặc **nhấp** vào vùng upload → chọn file
3. Hoặc **nhấn phím Enter/Space** trên vùng upload (keyboard)

#### Định dạng hỗ trợ
| Định dạng | Kích thước tối đa | Ghi chú |
|-----------|-------------------|---------|
| `.pdf` | 10MB | Văn bản hoặc scan (OCR) |
| `.docx` | 10MB | Microsoft Word |
| `.pptx` | 10MB | Microsoft PowerPoint |
| `.xlsx` | 10MB | Microsoft Excel |
| `.txt` | 10MB | Text thuần |

#### File dài
- **Không giới hạn số ký tự** cho file (khác tab Text — tối đa 200.000 ký tự/lần)
- Text vượt 200.000 ký tự tự động chia thành các **section** ~200.000 ký tự (ngắt ở ranh giới đoạn văn), mỗi section lại chia chunk 10.000 ký tự như thường
- Dịch tuần tự từng section rồi ghép lại nguyên vẹn — giới hạn thực tế chỉ còn dung lượng file 10MB
- Tiến trình hiển thị "Translating part X/Y…" theo số section |

#### Upload nhiều file
- Chọn nhiều file cùng lúc → tự chuyển sang chế độ **hàng đợi**
- File được dịch tuần tự từng file
- Mỗi file có: tên, kích thước, trạng thái (Pending/Extracting/Translating/Done/Error)

### Xử lý PDF

#### PDF văn bản
1. Trích xuất text tự động theo trang
2. Hiển thị preview (tối đa 5.000 ký tự đầu)
3. Chọn **khoảng trang** (From/To) nếu PDF nhiều trang
4. Nhấn **Translate**

#### PDF scan (ảnh)
1. App phát hiện không có text có thể chọn
2. Hiện thông báo: "No selectable text found — this looks like a scanned PDF"
3. Nhấn **Run OCR** để bắt đầu
4. Chọn khoảng trang (tối đa 20 trang/lần):
   - Mặc định: trang 1 đến min(20, tổng số trang)
   - Nếu PDF > 20 trang: chỉ OCR tối đa 20 trang mỗi lần
5. OCR chạy locally bằng Tesseract.js — file không rời khỏi máy
6. Hiển thị tiến trình: "OCR in progress… page X/Y"

#### Tái dựng text PDF
- Text được tái dựng theo toạ độ Y của từng item
- Phát hiện ngắt dòng và ngắt đoạn dựa trên khoảng cách giữa các dòng
- Giữ nguyên cấu trúc đoạn văn, danh sách

### Xử lý DOCX
- Dùng Mammoth.js trích xuất text thuần
- Giữ nguyên thứ tự từ, ngắt dòng
- **Lưu ý:** Không giữ format (heading, bold, italic) — dùng **Keep-format export** nếu cần giữ

### Xử lý PPTX
- Dùng JSZip (lazy-load) giải nén, đọc `ppt/slides/slideN.xml` theo đúng thứ tự slide
- Trích xuất text theo paragraph `<a:p>` trong từng slide, các slide cách nhau bởi dòng trống
- **Lưu ý:** Chỉ lấy text — dùng **Keep-format export** để dịch ngay trong file gốc

### Xử lý XLSX
- Dùng JSZip đọc `xl/sharedStrings.xml`, trích xuất các chuỗi `<si>` theo thứ tự trong file
- **Lưu ý:** Đường text thuần chỉ trả về các chuỗi duy nhất (mất vị trí ô/sheet) — dùng **Keep-format export** để dịch đúng vị trí từng ô

### Xử lý TXT
- Đọc UTF-8 mặc định
- Hỗ trợ UTF-16 LE/BE (BOM detection)
- Kiểm tra file binary (nếu >5% ký tự điều khiển → báo lỗi)

### OCR (nhận dạng ký tự quang học)

#### Khi nào cần OCR
- PDF scan (ảnh) — không có text có thể chọn
- App tự phát hiện và hiện prompt

#### Cài đặt OCR
- **Ngôn ngữ OCR**: tự động chọn theo ngôn ngữ nguồn
  - English → `eng`
  - Vietnamese → `vie`
  - Japanese → `jpn`
  - Korean → `kor`
  - Chinese → `chi_sim`
  - Auto Detect → `eng+vie`
- **Khoảng trang**: From/To (1-based, bao gồm)
- **Tối đa**: 20 trang/lần
- **Scale**: 2x (cải thiện độ chính xác với font nhỏ)

#### Hủy OCR
- Nhấn **Cancel** trong overlay
- OCR bị terminate ngay lập tức (không chờ trang hiện tại xong)

### Xuất kết quả

#### Nút Bilingual (xem song ngữ)
- Hiển thị kết quả trong ô preview dạng song ngữ (đoạn gốc + bản dịch xen kẽ) — giống nút Bilingual ở tab Text
- Chỉ thay đổi cách hiển thị: các nút Download/Copy vẫn xuất đúng bản dịch thuần

#### Download .txt
- File text thuần UTF-8 với BOM (Windows Notepad detect đúng)
- Tên file: `{tên_gốc}_translated_{ngôn ngữ_đích}.txt`

#### Download .docx (tạo mới)
- Dùng thư viện `docx` (~300KB, lazy-load từ CDN)
- Mỗi dòng = 1 paragraph
- Blank lines = empty paragraphs (giữ rhythm)
- Tên file: `{tên_gốc}_translated_{ngôn ngữ_đích}.docx`

#### Download giữ nguyên định dạng (keep format)
- **Khả dụng khi upload file `.docx`, `.pptx` hoặc `.xlsx`** — nút hiển thị theo đúng đuôi file đã nạp
- **Chọn trước khi upload:** bật checkbox **Keep original format** (ngay dưới khung upload) để nút **Translate** chạy thẳng luồng keep-format và tải file đã định dạng về ngay, không cần dịch preview trước; áp dụng cho `.docx`/`.pptx`/`.xlsx`/`.pdf` — file `.txt` không áp dụng được (app báo và dịch dạng text thường). Khi bật, dropdown **output mode** (Replace original / Bilingual) hiện cạnh checkbox (chỉ DOCX/PPTX)
- **Không áp dụng cho hàng đợi nhiều file:** upload >1 file → queue dịch dạng text thường; nếu toggle đang bật app sẽ toast nhắc upload từng file một để lấy output giữ định dạng
- Dùng JSZip (~100KB, lazy-load) giải nén ZIP, sửa XML rồi nén lại — mọi thành phần khác trong file (media, theme, rels) nguyên vẹn
- Phần XML được dịch theo định dạng:
  - **DOCX**: `word/document.xml` + `word/header*.xml` / `word/footer*.xml`, đơn vị dịch là paragraph `<w:p>`
  - **PPTX**: `ppt/slides/slideN.xml` + `ppt/notesSlides/notesSlideN.xml`, đơn vị dịch là paragraph `<a:p>`
  - **XLSX**: `xl/sharedStrings.xml`, đơn vị dịch là chuỗi `<si>` (dịch đúng vị trí từng ô dùng chung chuỗi)
- Dịch từng đơn vị (song song qua pool 3 luồng), đếm tiến trình gộp trên tất cả các phần
- Ghi bản dịch **phân phối theo tỷ lệ** vào các run `<t>` gốc (`writeAcrossRuns`)
- **Giữ nguyên:** styles (heading, list, alignment), tables, hình ảnh, font chữ, header/footer (DOCX), notes (PPTX), formatting từng run (bold/italic giữa câu)
- **Trade-off:** ranh giới formatting giữa câu là xấp xỉ khi bản dịch dài/ngắn hơn bản gốc; footnotes/endnotes (DOCX) không được dịch
- Tên file: `{tên_gốc}_translated_{ngôn ngữ_đích}.{đuôi gốc}`

#### Keep format cho PDF
- Khả dụng khi upload file `.pdf` **có text layer** (PDF scan không hỗ trợ — dùng OCR + dịch thường)
- Cơ chế khác Office: từng trang được **render thành ảnh** bằng pdf.js (scale 2x), text layer cho biết vị trí từng dòng → gom dòng thành đoạn, dịch theo đoạn (1 API call/đoạn, chạy song song pool 3) → **xóa vùng text gốc và vẽ bản dịch lên đúng chỗ** → đóng gói các trang thành PDF mới bằng jsPDF (lazy-load ~350KB)
- **Giữ nguyên:** toàn bộ bố cục, hình ảnh, bảng, màu sắc, font hiển thị — trang là ảnh chụp nên không thể lệch layout
- **Trade-off:**
  - Text trong file kết quả **không chọn/tìm kiếm được** (trang là ảnh raster, JPEG chất lượng 0.87)
  - Dung lượng file thường tăng
  - Text xoay/dọc bị bỏ qua (giữ nguyên gốc); dòng chỉ có số/ký hiệu không dịch
  - Nền vùng text lấy mẫu từ viền quanh dòng — nền phức tạp (ảnh, gradient) có thể lộ vệt xóa
- **Giới hạn:** dịch tối đa 50 trang đầu (các trang sau vẫn có mặt trong file nhưng không dịch, có toast báo); từ chối chạy với PDF > 150 trang; PDF có mật khẩu không mở được
- Không có chế độ Bilingual cho PDF (không thể chèn thêm đoạn vào trang ảnh)
- Tên file: `{tên_gốc}_translated_{ngôn ngữ_đích}.pdf`

#### Chế độ song ngữ (Bilingual)
- Dropdown **output mode** nằm cạnh checkbox **Keep original format** (hiện khi đã bật checkbox và file nạp lên — nếu có — là `.docx` / `.pptx`), gồm 2 lựa chọn: **Replace original** (mặc định) và **Bilingual (gốc + dịch)**
- Khi chọn Bilingual: mỗi đoạn gốc được **giữ nguyên**, bản dịch chèn ngay sau thành một đoạn mới kế tiếp (xen kẽ gốc/dịch)
- Đoạn dịch thừa hưởng style của đoạn gốc (heading, list, alignment) và formatting từng run
- Không áp dụng cho `.xlsx` (một ô không chứa được hai đoạn văn)

#### Dịch hình ảnh trong file (OCR)
- Bật checkbox **Translate text inside embedded images** trong Advanced (tab File), áp dụng cho keep-format export của cả `.docx` / `.pptx` / `.xlsx`
- Quy trình: Tesseract OCR chạy local trên từng ảnh trong `*/media/` của ZIP → dịch **theo đoạn** (các dòng cùng paragraph gom thành 1 API call, bản dịch map ngược về từng dòng nhờ ngắt dòng) → **xóa vùng text gốc và vẽ bản dịch lên đúng vị trí** (canvas)
- Ảnh giữ nguyên kích thước nên bố cục file không thay đổi; chỉ bytes ảnh trong ZIP bị thay
- Nền vùng text được lấy mẫu từ viền quanh bounding box; màu chữ tự chọn tương phản (đen/trắng); cỡ chữ tự co để vừa khung gốc
- **Hỗ trợ:** PNG/JPEG/WebP. Định dạng khác (EMF/WMF/SVG/TIFF/GIF) giữ nguyên bản gốc
- **Giới hạn:** tối đa 50 ảnh/lần (toast kết quả báo `N of M images — capped at 50` khi bị cắt); dòng OCR có confidence < 55 hoặc cao < 7px bị bỏ qua (nhiễu); ảnh lỗi được giữ nguyên bản gốc
- **Lưu ý:** chậm với file nhiều ảnh (OCR vài giây/ảnh + 1 API call/đoạn text); ngôn ngữ OCR theo ngôn ngữ nguồn đang chọn
- **Trade-off:** khi bản dịch một đoạn không giữ đúng số dòng gốc, text được phân phối lại theo tỷ lệ độ dài từng dòng (xấp xỉ, tương tự `writeAcrossRuns`)
- **File chỉ có ảnh (không có text):** vẫn nạp được — app hiện hướng dẫn thay vì lỗi; keep-format export khi đó chỉ dịch phần ảnh (bắt buộc bật checkbox Translate images, nếu không export sẽ báo lỗi nhắc bật)

### Hàng đợi file (multi-file queue)

#### Kích hoạt
- Upload > 1 file cùng lúc (kéo-thả hoặc chọn nhiều)
- Hoặc thêm file khi queue đang chạy

#### Quản lý queue
- Mỗi file có trạng thái: Pending → Extracting → Translating → Done/Error
- Hiển thị: tên file, kích thước, trạng thái, kết quả
- **Copy**: sao chép kết quả dịch
- **Download .txt/.docx**: xuất kết quả

#### Hủy queue
- **Cancel**: dừng xử lý file hiện tại + các file tiếp theo
- **Clear**: xoá toàn bộ queue (chỉ khi queue đã dừng)

#### Xử lý lỗi
- File scan (PDF): đánh dấu "needs-ocr" — cần mở file riêng để chạy OCR
- File rỗng: đánh dấu "skipped"
- Lỗi API key: dừng toàn bộ queue, focus ô API key

---

## Tab Batch — Dịch hàng loạt

### Thêm dòng
- Nhấn **Add Row** để thêm dòng mới
- Mặc định: 3 dòng khi mở tab
- Mỗi dòng có: ô nhập text, chọn source language, nút dịch/xoá

### Dịch một dòng
- Nhấn nút **►** bên cạnh mỗi dòng
- Hoặc `Ctrl+Enter` / `Cmd+Enter` trong textarea
- Kết quả hiển thị bên phải dòng

### Dịch tất cả
- Nhấn **Translate All**
- Dịch **3 luồng song song** (BATCH_CONCURRENCY = 3)
- Hiển thị tiến trình: `X/Y`
- **Retry Failed**: chạy lại các dòng bị lỗi (nút hiện sau khi có lỗi)

### Hủy batch
- Nhấn **Cancel** → dừng giữa chừng
- Phần đã dịch được giữ nguyên
- Các dòng chưa dịch giữ nguyên trạng thái "Pending"

### Source Language mỗi dòng
- Mỗi dòng có thể chọn nguồn riêng (Auto Detect hoặc cụ thể)
- Nếu nguồn = đích → bỏ qua dòng đó ("Skipped: same language")

### Import CSV

#### Định dạng file
```csv
source_text,source_lang,translation
Hello World,English,
Xin chào,auto,
```

#### Quy tắc
- **Cột bắt buộc:** `source_text` (cột đầu tiên)
- **Cột tùy chọn:** `source_lang` (mặc định: auto), `translation` (kết quả đã có)
- **Header row:** tự phát hiện (bỏ qua nếu cột đầu = `source_text`)
- **Encoding:** UTF-8 với hoặc không BOM
- **RFC-4180:** hỗ trợ field có dấu phẩy, newline, quotes

#### Khi import
- Thay thế toàn bộ các dòng hiện tại
- Điền sẵn text, source language, và kết quả (nếu có)

### Export CSV

#### Định dạng xuất
```csv
source_text,source_lang,translation
"Hello World","English","Xin chào"
```

#### Quy tắc
- Luôn quote field (an toàn cho dấu phẩy, newline, quotes)
- BOM `\uFEFF` đầu file (Excel detect UTF-8 đúng)
- Chỉ xuất dòng có nội dung (bỏ dòng trống)
- Tên file: `batch_translations_{ngôn ngữ_đích}.csv`

### Tuỳ chọn nâng cao
- **Domain / Tone / Glossary / Context**: áp dụng cho tất cả dòng trong batch
- Giống hệt Advanced options của Tab Text

---

## Tab History — Lịch sử

### Tự động lưu
- Mọi bản dịch (Text, File, Batch) đều được lưu tự động
- Lưu trong `localStorage` với key `translation_history`
- Tối đa **100 entry** — tự xoá cũ khi đầy

### Mỗi entry bao gồm
- `id`: định danh duy nhất
- `sourceLang` / `targetLang`: ngôn ngữ nguồn/đích
- `sourceText` / `translatedText`: nội dung
- `timestamp`: thời gian ISO 8601
- `type`: text / file / batch
- `domain`: lĩnh vực

### Tìm kiếm
- Nhập từ khoá vào ô tìm kiếm
- Không phân biệt hoa thường
- Tìm trong: sourceText, translatedText, sourceLang, targetLang

### Lọc theo loại
- **All types:** hiển thị tất cả
- **Text:** chỉ dịch text
- **File:** chỉ dịch file
- **Batch:** chỉ dịch batch

### Xem chi tiết
- Nhấn vào text dài (>200 ký tự) → hiện popup modal
- **Copy:** sao chép toàn bộ text
- **Escape** hoặc nhấn nút Close: đóng popup
- Focus được giữ nguyên (trả về element đã mở popup)

### Hành động trên mỗi entry
- **Copy Source:** sao chép source text
- **Copy Translation:** sao chép translated text
- **Delete:** xoá entry (xác nhận trước khi xoá)

### Export CSV
- Xuất các entry đang hiển thị (sau khi lọc)
- Định dạng: `timestamp,type,source_lang,target_lang,domain,source_text,translation`
- BOM `\uFEFF` cho Excel
- Tên file: `translation_history.csv`

### Xoá toàn bộ
- Nhấn **Clear All** → xác nhận
- Xoá toàn bộ lịch sử (không thể hoàn tác)

---

## Tuỳ chỉnh giao diện

### Dark / Light Theme
- Nhấn nút ☀️/🌙 ở header
- Mặc định theo hệ thống (`prefers-color-scheme: dark`)
- Lưu tuỳ chọn qua `localStorage` (key: `translation_theme`)
- Nếu chọn thủ công → hệ thống tự động bị ghi đè
- Refresh trang → giữ nguyên tuỳ chọn đã chọn

### Tuỳ chọn được nhớ
Tất cả tuỳ chọn sau được lưu tự động và khôi phục khi mở lại:
- Ngôn ngữ nguồn/đích (mỗi tab)
- Domain / Tone (mỗi tab)
- Glossary / Context (mỗi tab)
- Theme (dark/light)
- API Key

---

## Phím tắt

| Phím | Chức năng | Nơi áp dụng |
|------|-----------|-------------|
| `Ctrl+Enter` / `Cmd+Enter` | Dịch | Text tab, Batch row |
| `Escape` | Đóng popup modal | History modal |
| `Tab` | Di chuyển giữa các phần tử | Toàn bộ app |
| `Enter` / `Space` | Kích hoạt vùng upload | File tab drop zone |

---

## Glossary Presets

### Lưu preset
1. Nhập glossary vào ô Custom Glossary
2. Nhấn **Save as preset**
3. Nhập tên preset → **OK**
4. Nếu tên đã tồn tại → xác nhận ghi đè

### Tải preset
1. Chọn tên preset từ dropdown **Load preset…**
2. Glossary được điền vào ô textarea
3. Thông báo "Loaded preset "{tên}""

### Xoá preset
1. Chọn preset từ dropdown
2. Nhấn **Delete** (bên phải)
3. Xác nhận → preset bị xoá, glossary trong textarea giữ nguyên

### Lưu trữ
- Lưu trong `localStorage` (key: `translation_glossary_presets`)
- Dạng: `{ "tên preset": "nội dung glossary", ... }`
- Chia sẻ giữa 3 tab (Text, File, Batch)

---

## Chi phí

### Bảng giá DeepSeek Chat (deepseek-chat)

| Loại token | Giá (USD/1M tokens) |
|------------|---------------------|
| Input (prompt) | $0.27 |
| Output (completion) | $1.10 |

### Hiển thị
- Sau mỗi lần dịch: `X tokens · ~$Y.YYYY`
- Hover để xem chi tiết: `X input + Y output tokens`
- Chi phí là **ước tính** (dựa trên giá hiện tại, có thể thay đổi)

### Ví dụ
- Text 1.000 ký tự → ~1.500 tokens → ~$0.001
- Text 10.000 ký tự → ~15.000 tokens → ~$0.01
- Text 100.000 ký tự → ~150.000 tokens → ~$0.10

---

## Lưu ý kỹ thuật

### An toàn
- API key lưu trong `localStorage` — rủi ro XSS (giới hạn cố hữu của client-side)
- Chỉ gửi key tới `api.deepseek.com`
- OCR chạy locally — file không rời khỏi máy
- `escapeHtml` trên mọi innerHTML — chống XSS

### Hiệu suất
- Streaming với `requestAnimationFrame` coalesce — ghi DOM tối đa 1 lần/frame
- Lazy-load lib nặng: Tesseract (~2MB), docx (~300KB), JSZip (~100KB)
- History evict tự động khi đầy storage
- Draft lưu debounce 400ms

### Giới hạn

| Thông số | Giá trị |
|----------|---------|
| Ký tự tối đa (text) | 200.000 |
| Ký tự tối đa (file) | Không giới hạn — tự chia section ~200.000 ký tự |
| Chunk size | 10.000 ký tự |
| File tối đa | 10MB |
| OCR tối đa | 20 trang/lần |
| History tối đa | 100 entry |
| Streaming timeout | 90 giây |
| Retry tối đa | 3 lần/request |
| Batch concurrency | 3 luồng |

### Trình duyệt hỗ trợ

| Trình duyệt | Phiên bản tối thiểu |
|-------------|---------------------|
| Chrome | 90+ |
| Firefox | 90+ |
| Safari | 15+ |
| Edge | 90+ |

### Yêu cầu API
- DeepSeek API key (tạo tại [platform.deepseek.com](https://platform.deepseek.com))
- Endpoint: `https://api.deepseek.com/v1/chat/completions`
- Model: `deepseek-chat`
- Streaming: hỗ trợ SSE (Server-Sent Events)
