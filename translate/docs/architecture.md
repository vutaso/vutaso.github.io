# AI Translate — Architecture

Ứng dụng dịch thuật AI client-side dùng **DeepSeek API**, chạy hoàn toàn trên trình duyệt (static HTML + CDN, không build tool, không backend).

## Thành phần

| File | Vai trò |
|------|---------|
| `index.html` | Giao diện chính, 4 tab: Text / File / Batch / History |
| `css/style.css` | Tất cả styles (dark/light theme, responsive, a11y) |
| `js/app.js` | Controller UI + streaming renderer + keep-format Office (docx/pptx/xlsx) + CSV |
| `js/imageTranslator.js` | Dịch text trong ảnh nhúng: OCR (bbox) → translate → vẽ lại lên ảnh |
| `js/translator.js` | Client DeepSeek API: chunking, retry, streaming, cancel, pool |
| `js/fileParser.js` | Đọc file PDF/DOCX/TXT + OCR (Tesseract) |
| `js/history.js` | Lịch sử dịch (localStorage, 100 entry) |
| `js/languages.js` | Danh sách ngôn ngữ tập trung (single source of truth) |
| `js/glossaryPresets.js` | Preset glossary (localStorage) |

## Kiến trúc & luồng chính

```mermaid
flowchart TD
    subgraph LOAD["Khởi động (index.html)"]
        A[load scripts:<br/>languages → glossaryPresets<br/>→ translator → fileParser → history → app] --> B[app.js: init]
        B --> C[populateLanguageSelects<br/>+ loadPreferences + setup tabs]
        C --> D[Kích hoạt 4 tab: Text / File / Batch / History]
    end

    subgraph TEXT["Luồng dịch Text"]
        E[Nhập text + chọn ngôn ngữ/domain/tone] --> F[app: translateTextTab]
        F --> G[translator.translate]
        G --> G1{split length > 10k?}
        G1 -- no --> G2[_translateChunk]
        G1 -- yes --> G3[_splitIntoChunks<br/>tách theo đoạn/dòng/câu]
        G3 --> G2
        G2 --> H{_callApiWithRetry<br/>tối đa 3 lần}
        H --> I[fetch DeepSeek /chat/completions<br/>stream: true + include_usage]
        I --> J{finish_reason = length?}
        J -- yes --> K[chia đôi chunk, đệ quy tối đa depth 2]
        K --> G2
        J -- no --> L[onStream → renderer rAF coalesce → DOM]
        L --> M[history.add + formatUsage + detectedLang]
    end

    subgraph FILE["Luồng dịch File"]
        N[Drop/select PDF·DOCX·PPTX·XLSX·TXT ≤ 10MB] --> O{1 file & queue rỗng?}
        O -- yes --> P[handleFileSelect → FileParser.parseFile]
        O -- no --> Q[enqueueFiles → processFileQueue<br/>tuần tự từng file]
        P --> R{Loại file}
        R -- txt --> R1[_decodeText BOM + binary check]
        R -- pdf --> R2[_parsePdf: getTextContent<br/>tái dựng theo toạ độ Y]
        R -- docx --> R3[mammoth.extractRawText]
        R -- pptx --> R4[JSZip: ppt/slides/*.xml<br/>gom a:t theo a:p từng slide]
        R -- xlsx --> R5[JSZip: xl/sharedStrings.xml<br/>gom t theo si]
        R1 & R2 & R3 & R4 & R5 --> S{Text rỗng & có pages?}
        S -- yes (PDF scan) --> T[Prompt OCR → ocrPdf<br/>Tesseract + chọn khoảng ≤ 20 trang]
        S -- no --> U[commitParsedFile → preview + page range]
        T --> U
        U --> V[translateFileTab → translator.translateLong<br/>text > 200k: chia section theo ranh đoạn<br/>rồi dịch tuần tự như TEXT]
        V --> W[Download .txt/.docx]
    end

    subgraph BATCH["Luồng Batch"]
        X[Thêm dòng / Import CSV] --> Y[translateBatchAll]
        Y --> Z[_runPool: 3 luồng song song, 1 job chung]
        Z --> AA[per row: translator.translate]
        AA --> AB[resultDiv + usage + history.add]
        AA -- lỗi --> AC[mark failed → Retry Failed]
    end

    subgraph OFFICEKF["Keep-format Office export (docx/pptx/xlsx)"]
        AD[downloadKeepingFormat] --> AE[loadJsZip → giải nén]
        AE --> AF[Parse parts theo OFFICE_FORMATS:<br/>word/*.xml · ppt/slides/*.xml · xl/sharedStrings.xml<br/>gom thẻ t theo đơn vị p/si]
        AF --> AG[_runPool dịch song song từng đơn vị]
        AG --> AG2{Bilingual?}
        AG2 -- no --> AH[writeAcrossRuns: phân phối bản dịch<br/>theo tỷ lệ run gốc, giữ formatting]
        AG2 -- yes, docx/pptx --> AH2[Clone đơn vị gốc, chèn sau bản gốc<br/>writeAcrossRuns trên clone]
        AH --> AI[Đóng gói ZIP lại → download đúng đuôi gốc]
        AH2 --> AI
        AG -. images enabled .-> IM[translateEmbeddedImages:<br/>OCR Tesseract từng ảnh media<br/>dịch từng dòng → vẽ lại lên ảnh]
        IM --> AI
    end

    subgraph PDFKF["Keep-format PDF export"]
        PK[downloadPdfKeepingFormat] --> PK1[PdfTranslator: render từng trang<br/>ra canvas 2x bằng pdf.js]
        PK1 --> PK2[Text layer → gom dòng theo baseline<br/>→ gom đoạn theo khoảng cách dọc]
        PK2 --> PK3[_runPool dịch 1 call/đoạn<br/>map bản dịch về từng dòng]
        PK3 --> PK4[Xóa vùng text gốc, vẽ bản dịch<br/>tái dùng ImageTranslator._redrawLine]
        PK4 --> PK5[jsPDF: addImage từng trang<br/>→ download .pdf]
    end

    M --> Z
    M --> AA
    D --> E
    D --> N
    D --> X
    B --> D
```

## Sơ đồ lớp dữ liệu

```mermaid
flowchart LR
    UI[UI DOM<br/>index.html + style.css] --> APP[app.js<br/>Controller + streaming renderer]
    APP --> TR[translator.js<br/>chunk/retry/cancel/job/pool]
    APP --> FP[fileParser.js<br/>PDF·DOCX·TXT + OCR]
    APP --> HI[history.js<br/>localStorage 100 entry]
    APP --> GP[glossaryPresets.js<br/>localStorage]
    TR --> DEEP[DeepSeek API<br/>api.deepseek.com]
    FP --> PDF[pdf.js CDN]
    FP --> TESS[Tesseract.js lazy-load]
    APP --> DOCX[docx + JSZip lazy-load]
    DEEP --> LOCAL[localStorage<br/>api key · prefs · draft]
```

## Ghi chú

- API key lưu trong `localStorage` — rủi ro XSS, chỉ gửi tới DeepSeek.
- Các thư viện nặng (Tesseract, docx, JSZip) lazy-load từ CDN khi cần.
- Giá DeepSeek hardcode trong `app.js` (`PRICE_PER_MILLION_*`) — cần cập nhật theo bảng giá hiện tại.
