# Changelog

Tất cả các thay đổi đáng chú ý của **Vutaso AI** được ghi lại trong file này.

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/).

---

## [Unreleased]

### Added

#### Slash command từ thư viện prompt (`js/snippets.js`, `js/ui.js`, `js/events.js`)
**Ý nghĩa:** Bookmark vẫn dùng được, nhưng prompt hay dùng nên gõ nhanh ngay trong ô nhập — `/review`, `/summary` — không mở menu.

**Cách dùng:**
- Gõ `/` ở đầu dòng trong ô nhập để mở danh sách prompt. Tiếp tục gõ để lọc (`/rev` → Review code).
- `↑` `↓` chọn, `Enter` / `Tab` / `Space` chèn, `Esc` đóng. Click một dòng cũng chèn.
- Lệnh slash lấy từ tiêu đề prompt (preset: `/review`, `/summary`, `/email`, `/explain`, `/polish`). Không thêm field mới vào dữ liệu; backup JSON không đổi.
- Menu bookmark vẫn hiện `/review` cạnh tiêu đề để dễ nhớ lệnh.
- **Enter** khi mới gõ `/` chỉ đóng palette, không chèn prompt đầu danh sách. **Gửi** expand `/review` rồi mới gửi. Lọc theo lệnh/tiêu đề, không theo nội dung prompt.

#### Trích dẫn web search thống nhất (`js/api.js`, `js/ui.js`)
**Ý nghĩa:** Gemini đã hiện nguồn; OpenAI/Anthropic thì chưa đều. Một khối **Nguồn** dưới tin assistant giúp kiểm chứng, đúng tinh thần disclaimer “AI có thể mắc lỗi”.

**Cách dùng:**
- Bật tìm web rồi hỏi. Khi model trả citation, khối **Nguồn** hiện dưới câu trả lời (số nguồn, từ khóa đã tìm, liên kết http/https).
- Gemini Google Search, OpenAI Responses (`url_citation` + `web_search_call.action.sources`), Anthropic `web_search` (kể cả query stream `input_json_delta`), và `search_results`/`citations` (OpenRouter) đều gom vào cùng hình dạng.
- Tối đa 24 URL / 8 query, trùng URI thì gộp. Tiếp tục sinh giữ nguồn đã có (merge từ seed). So sánh model: nếu đang bật tìm web và model hỗ trợ thì cột đó cũng hiện nguồn.
- HTML/PDF xuất theo DOM; Markdown/TXT/DOCX thêm appendix nguồn. Nút Phát âm bỏ khối nguồn; Copy vẫn giữ.

---

#### Dashboard chi phí theo ngày / model (`js/storage.js`, `js/ui.js`)
**Ý nghĩa:** Settings vốn chỉ hiện In/Out/Tổng/$ của **chat + model đang chọn**. User BYOK cần biết tuần này tốn bao nhiêu và model nào đắt — trên mọi cuộc chat.

**Cách dùng:**
- Mở **Cài đặt** → **Chi phí theo ngày**. Xem tổng ước tính, biểu đồ nhỏ theo ngày, và xếp hạng model.
- Chọn **7 ngày** / **30 ngày** / **Kỳ này**. **Kỳ này** gồm mọi ngày còn trong sổ cái từ lúc reset (hoặc ngày cũ nhất). Reset kỳ xóa dashboard; tổng token từng chat vẫn giữ.
- Sổ cái local (90 ngày), theo ngày máy. Backup JSON **thay thế** mang theo sổ cái; **gộp** lấy mức cao hơn theo ngày/model (không cộng dồn, tránh nhân đôi khi gộp file cũ). Chat cũ trước khi có tính năng này không được gán vào hôm nay.
- Stream lỗi vẫn ghi token nếu API đã trả usage. So sánh/nén refresh dashboard khi Settings đang mở. Biểu đồ fallback theo token nếu chưa có giá. Ranking hiện mọi model.

---

#### Tiếp tục sinh khi bị cắt (`js/api.js`, `js/events.js`, `js/ui.js`)
**Ý nghĩa:** Output hay đụng `max_tokens` hoặc stream đứt — đặc biệt OpenRouter (credit / `max_tokens`). Nút **Tiếp tục** gửi tiếp từ đoạn đang có, không tạo phiên bản mới như Retry.

**Cách dùng:**
- Khi câu trả lời assistant bị cắt, nút **Tiếp tục** hiện cạnh Retry trên toolbar tin đó.
- Bấm để model viết tiếp ngay sau đoạn hiện có (không lặp lại phần đã có). Có thể bấm lại nếu lần tiếp theo vẫn bị cắt.
- Dừng thủ công (Stop) không hiện nút này. Retry vẫn tạo phiên bản mới từ đầu.
- OpenRouter cắt giữa stream (`max_tokens_exceeded` / `token_limit_exceeded` / credit) vẫn hiện nút — kể cả khi HTTP vẫn 200.
- Tạo file (slides/Excel/Docs/PDF) bị cắt thì chưa parse; lần Tiếp tục xong mới xuất file. Tìm web tắt khi tiếp tục. 401/429/safety không hiện nút. Cột so sánh model bị cắt: chọn cột rồi Tiếp tục trên tin đã thêm.

---

#### Tìm trong cuộc chat đang mở (`js/ui.js`, `js/events.js`)
**Ý nghĩa:** Sidebar đã lọc theo tiêu đề/nội dung, nhưng chat dài không nhảy tới đoạn khớp. Find trong app (`Ctrl/Cmd + F`) highlight, prev/next, đếm số lần xuất hiện, và đánh dấu tick trên thanh cuộn câu hỏi.

**Cách dùng:**
- `Ctrl/Cmd + F` (hoặc nút kính lúp trên header) mở thanh tìm trong cuộc chat hiện tại. Enter / F3 / `Ctrl/Cmd + G` tới kết quả sau; Shift để lùi. Escape đóng.
- Mở một cuộc chat từ kết quả tìm sidebar sẽ tự mở find với cùng từ khóa và cuộn tới lần khớp đầu.
- Tick vàng trên thanh cuộn câu hỏi là khối hỏi–đáp có khớp; bấm tick để nhảy tới match trong khối đó.
- Hủy sửa tin không để lại highlight. Match trong code/bảng chỉ cuộn khung chat; thinking/sources đóng thì được mở. Đang stream thì không nháy lại toàn bộ highlight. Đếm hiện `400+` khi cắt trần. Không tô số dòng, header code, nhãn bảng, summary.

---

#### Sao lưu / khôi phục JSON (`js/storage.js`)
**Ý nghĩa:** Dữ liệu hội thoại chỉ nằm trên trình duyệt. Xuất file JSON để đổi máy, đổi trình duyệt, hoặc khôi phục sau khi xóa cache — không mất chat và prompt.

**Cách dùng:**
- Mở **Cài đặt** → **Sao lưu & khôi phục** → **Xuất JSON**. File gồm hội thoại, thư viện prompt và tuỳ chọn (theme, ngôn ngữ, system prompt, model…).
- API key **không** được đưa vào file trừ khi tick *Bao gồm API key*. File có key nên giữ riêng tư; tên file sẽ có hậu tố `-keys`.
- **Khôi phục…** chọn file → **Thay thế** (ghi đè chat/prompt trên máy) hoặc **Gộp** (giữ dữ liệu hiện có, thêm mục mới theo id). API key trên máy được giữ lại trừ khi file có key và bạn chọn khôi phục key.
- File JSON compact; file ≥ 20MB sẽ hỏi xác nhận, > 120MB bị từ chối. Gộp trên máy trống tự mở hội thoại đầu tiên. Restore lỗi lưu sẽ rollback, không báo thành công giả.

---

#### Giọng nói — STT & TTS (`js/speech.js`)
**Ý nghĩa:** Nhập tin nhắn bằng giọng nói (Speech-to-Text) và nghe phản hồi AI (Text-to-Speech), giúp chat hands-free hoặc khi khó gõ.

**Cách dùng:**
- **STT:** Bấm nút mic cạnh nút đính kèm trong composer → nói → văn bản hiện trực tiếp trong ô nhập (có bản nháp interim khi đang nói). Bấm lại để dừng.
- **TTS:** Trên toolbar tin assistant, bấm **Phát âm** → trình duyệt đọc nội dung tin đó. Gửi tin mới hoặc bấm Stop sẽ dừng đọc.
- Ngôn ngữ STT map theo locale app (`vi` → `vi-VN`, `jp` → `ja-JP`, …).

---

#### Thư viện prompt / Snippets (`js/snippets.js`)
**Ý nghĩa:** Lưu và tái sử dụng các prompt hay dùng (review code, tóm tắt, viết email, …) thay vì gõ lại mỗi lần.

**Cách dùng:**
- Bấm nút **bookmark** cạnh composer → chọn prompt trong menu để chèn vào ô nhập.
- **Quản lý prompt:** Trong menu → *Quản lý prompt* → thêm / sửa / xóa snippet.
- **Lưu từ composer:** Trong modal quản lý → *Lưu nội dung composer* (cần có text trong ô nhập).
- Lần đầu mở app tự seed 5 prompt mẫu. Dữ liệu lưu trong `localStorage` / IndexedDB.

---

#### Nén context hội thoại dài (`js/context-compress.js`)
**Ý nghĩa:** Khi chat quá dài, tóm tắt các tin cũ thành một khối context gọn để tiết kiệm token nhưng vẫn giữ ý chính cho các tin tiếp theo.

**Cách dùng:**
- Khi hội thoại đủ dài (≥ 10 tin), thanh **Tóm tắt & tiếp tục** xuất hiện phía trên vùng chat.
- Bấm nút → xác nhận → AI tóm tắt tin cũ; giữ lại N tin gần nhất (mặc định 4).
- Tin tóm tắt hiển thị với badge **Context đã nén** trong luồng chat.
- Không dùng khi đang streaming phản hồi.

---

#### So sánh model A/B (`js/model-compare.js`)
**Ý nghĩa:** Gửi **cùng một câu hỏi** tới 2–3 model **song song**, xem kết quả cạnh nhau và chọn bản trả lời tốt nhất — hữu ích khi so sánh chất lượng model hoặc brainstorm.

**Cách dùng:**
1. Bấm **So sánh** trên thanh công cụ composer.
2. Trên thanh phía trên chat, chọn model (chip A / B / C); có thể thêm hoặc xóa cột (2–3 model).
3. Gõ câu hỏi (chỉ **text**, không đính kèm / web search / tạo ảnh / dịch) → Gửi.
4. Overlay full-screen hiển thị từng cột streaming song song.
5. Khi xong, bấm **Chọn bản này** trên cột ưng ý → câu trả lời được thêm vào chat; **Escape** hoặc **Đóng** để thoát (tin user vẫn giữ).
6. **Dừng** hủy tất cả stream; vẫn có thể chọn cột đã có nội dung một phần.

---

#### Nhánh hội thoại — Branch (`js/conversations.js`)
**Ý nghĩa:** Từ bất kỳ tin user hoặc assistant, tạo **cuộc chat mới** giữ nguyên context đến tin đó để thử hướng khác — bước tiếp theo tự nhiên sau regenerate / variant `1/N` khi brainstorm hoặc debug.

**Cách dùng:**
- Trên toolbar tin **user** hoặc **assistant**, bấm **Tạo nhánh mới** (icon nhánh `⎇`).
- App tạo hội thoại mới (cuộc gốc không đổi), copy toàn bộ tin từ đầu đến tin được chọn.
- Chuyển sang nhánh mới ngay — gõ tiếp để tiếp tục theo hướng khác.
- Sidebar: nhánh có icon nhánh, badge **Nhánh**, tiêu đề dạng `Nhánh · {gợi ý}`.
- Variant assistant đang xem được gộp thành một bản trong nhánh mới.

---

- Model **Claude Haiku Latest** (OpenRouter, `~anthropic/claude-haiku-latest`) — alias luôn trỏ tới Claude Haiku mới nhất, reasoning, vision, context 200K; $1/$5.
- Model **Claude Sonnet Latest** (OpenRouter, `~anthropic/claude-sonnet-latest`) — alias luôn trỏ tới Claude Sonnet mới nhất, reasoning, vision, context 1M; $2/$10.
- Model **Claude Opus Latest** (OpenRouter, `~anthropic/claude-opus-latest`) — alias luôn trỏ tới Claude Opus mới nhất, reasoning bắt buộc, vision, context 1M; $5/$25.
- Model **DeepSeek Flash Latest** (OpenRouter, `~deepseek/deepseek-flash-latest`) — alias luôn trỏ tới DeepSeek Flash mới nhất, reasoning, vision, context 1M; $0.13/$0.52.
- Model **GLM Flash Latest** (OpenRouter, `~z-ai/glm-flash-latest`) — alias luôn trỏ tới GLM Flash mới nhất, reasoning bắt buộc, vision (ảnh/video), context 1M; $0.075/$0.25.
- Model **Gemini 3.8 Flash** (Google, `gemini-3.8-flash`) — flagship, web search, tạo ảnh, thinking; $0.75/$3.75.
- Model **Gemini 3.8 Flash** (OpenRouter, `google/gemini-3.8-flash`) — reasoning, vision; $0.75/$3.75.
- Model **Claude Opus 5** (Anthropic, `claude-opus-5`) — thinking adaptive mặc định, effort tới `max`, web search; $5/$25.
- Model **GPT-5.6 Sol** (OpenAI, `gpt-5.6-sol`) — flagship, web search, image gen, reasoning; $5/$30.
- Model **GPT-5.6 Terra** (OpenAI, `gpt-5.6-terra`) — cân bằng, web search, image gen, reasoning; $2/$12.
- Model **GPT-5.6 Luna** (OpenAI, `gpt-5.6-luna`) — chi phí thấp, web search, image gen, reasoning; $0.20/$1.20.
- Model **GPT-5.6 Luna/Terra/Sol** (OpenRouter, `openai/gpt-5.6-*`) — reasoning, vision; $0.20/$1.20 – $2/$10.
- Model **GPT OSS 120B** (OpenRouter, `openai/gpt-oss-120b`) — reasoning; $0.15/$0.60.
- Model **DeepSeek V4.1 Flash** (OpenRouter, `deepseek/deepseek-v4.1-flash`) — reasoning, vision; $0.15/$0.60.
- Model **Kimi K2.6** (OpenRouter, `moonshotai/kimi-k2.6`) — reasoning, vision; $0.95/$4.00.
- Model **Kimi K3** (OpenRouter, `moonshotai/kimi-k3`) — reasoning, vision; $1.70/$8.50.
- Model **Claude Sonnet 5** (Anthropic).
- Dropdown **Reasoning Effort** trên composer — mức suy luận theo từng provider/model (`low` → `max`, `minimal` cho Gemini 3.x).
- Menu **Tải xuống** trên header — gom các tùy chọn xuất hội thoại.

### Removed

#### Nhà cung cấp NVIDIA (giữ theme NVIDIA)
**Ý nghĩa:** Gỡ toàn bộ tích hợp API NVIDIA — model, API key, proxy worker — để đơn giản hóa danh sách provider. **Theme giao diện NVIDIA** (`nvidia-theme.css`, chu kỳ theme) vẫn giữ nguyên.

- 11 model NVIDIA (DeepSeek V4 Flash/Pro, GPT OSS 20B, Step 3.5 Flash, Mistral Small 4, toàn bộ Qwen, Gemma 4 31B, Diffusion Gemma 26B, …).
- Trường **NVIDIA API Key** trong Cài đặt.
- Proxy worker `/nvidia` và logic gọi API NVIDIA trong `api.js`.

#### Nhà cung cấp Byte Plus
- Toàn bộ model Byte Plus (DeepSeek V4 Flash/Pro GA, V4.1 Flash, GLM-5.2/5.3 Flash, GPT OSS 120B, Dola Seed 2.0/2.1).
- Trường **Byte Plus API Key** trong Cài đặt.
- Proxy worker `/byteplus`, `/byteplus-responses` và logic gọi API Byte Plus trong `api.js`.

#### Nhà cung cấp OpenCode Go
- 14 model OpenCode Go.
- Trường **OpenCode Go API Key** trong Cài đặt.
- Proxy worker `/opencode-go-chat`, `/opencode-go-messages` và helper `buildOpencodeGoBody` / `sendOpencodeGoMessages`.

#### Nhà cung cấp Perplexity
- Model **Sonar**, **Sonar Pro**, **Sonar Reasoning Pro**, **Perplexity Search**.
- Trường **Perplexity API Key** trong Cài đặt.
- Web search qua Perplexity, helper `buildPerplexityBody` / `sendPerplexitySearch` và route proxy tương ứng trên worker.

#### Model Google Gemini (dọn danh sách)
- Model **Gemini 2.5 Flash Lite**, **2.5 Flash**, **3.5 Flash** — thay bằng dòng Gemini 3.x mới nhất.
- Model **Gemini 3.1 Flash Lite**, **3.5 Flash Lite**, **3.6 Flash**, **2.5 Pro**, **3.1 Pro Preview** (Google) — chỉ giữ **Gemini 3.8 Flash**.

#### Model OpenAI (dọn danh sách)
- **GPT-5.4 nano** (OpenAI).

#### Model OpenRouter (dọn danh sách)
- Gemini 2.5 Flash Lite, 2.5 Flash, 3.5 Flash (OpenRouter).
- Gemini 3.1 Flash Lite, 3.5 Flash Lite, 3.6 Flash, 2.5 Pro, 3.1 Pro Preview (OpenRouter) — chỉ giữ **Gemini 3.8 Flash**.
- **DeepSeek V4 Flash**, **DeepSeek V4 Flash 0731** (OpenRouter).
- **North Mini Code**, **Mistral Nemo** (OpenRouter).
- **Muse Spark 1.1** (OpenRouter).
- **Kimi K2.7 Code** (OpenRouter).
- **Claude Opus 4.8** (OpenRouter).
- **Claude Haiku 4.5** (OpenRouter) — thay bằng **Claude Haiku Latest** (`~anthropic/claude-haiku-latest`).
- **Claude Sonnet 5** (OpenRouter) — thay bằng **Claude Sonnet Latest** (`~anthropic/claude-sonnet-latest`).
- **Claude Opus 5** (OpenRouter) — thay bằng **Claude Opus Latest** (`~anthropic/claude-opus-latest`).
- **MiMo V2.5**, **MiMo V2.5 Pro**, **MiniMax M3**, **MiniMax M2.7 Nitro** (OpenRouter).
- **DeepSeek V4 Pro**, **GLM 5.2** (OpenRouter).
- **Grok 4.5** (OpenRouter).
- **Claude 3 Haiku** (OpenRouter).
- GPT OSS Safeguard 20B, GPT-5.4 nano, Gemma 4 26B, Gemma 4 31B free, Hy3 Preview, Hy3 free, Laguna XS 2.1, Laguna XS 2.1 free, toàn bộ Nemotron (Ultra/Super/Nano/Content Safety).
- Gemini 3.1 Flash Image, GPT Image 2, Seedream 4.5, Qwen 3.7 Plus, Mistral Small 3.2 24B, **Mistral Small 4**.

### Changed
- **Google Gemini:** provider chỉ còn **Gemini 3.8 Flash**; tạo ảnh dùng `gemini-3.1-flash-image` (Nano Banana 2).
- **OpenRouter Gemini:** chỉ còn **Gemini 3.8 Flash** (`google/gemini-3.8-flash`).
- **OpenRouter Claude Haiku:** dùng alias **Claude Haiku Latest** (`~anthropic/claude-haiku-latest`) thay `anthropic/claude-haiku-4.5`.
- **OpenRouter Claude Sonnet:** dùng alias **Claude Sonnet Latest** (`~anthropic/claude-sonnet-latest`) thay `anthropic/claude-sonnet-5`.
- **OpenRouter Claude Opus:** dùng alias **Claude Opus Latest** (`~anthropic/claude-opus-latest`) thay `anthropic/claude-opus-5`.
- **OpenRouter pricing:** đồng bộ `MODEL_PRICING` theo [OpenRouter API](https://openrouter.ai/api/v1/models); sắp xếp model theo giá input tăng dần.
- **UI so sánh model:** thanh chọn model gọn (chip A/B/C), overlay split-pane dạng card với badge trạng thái và màu theo provider.
- `OPENROUTER_MAX_OUTPUT_TOKENS` = **32768** (tránh lỗi vượt credit còn lại khi gửi `max_tokens` quá cao).
- **README** và **bảng giá** (`pricing.html`) đồng bộ **27 model** / **6 provider** (cập nhật 2026-09-20).
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
- Phiên bản đầu tiên **Vutaso AI** — chat AI chạy trên trình duyệt.
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
| Unreleased | 27 | 6 | 8 |

**Provider:** OpenRouter · DeepSeek · OpenAI · Anthropic · Google Gemini · Kimi

**Ngôn ngữ giao diện (từ 1.5.0):** `en` · `vi` · `jp` · `zh`
