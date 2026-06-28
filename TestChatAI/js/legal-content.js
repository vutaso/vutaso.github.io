window.LegalContent = (() => {
  const STORAGE_KEY = 'testchatai';
  const UPDATED = 'June 28, 2026';

  const UI = {
    en: {
      back: 'Back to VUTASO AI',
      lastUpdated: 'Last updated: {date}',
      privacyTitle: 'Privacy Policy',
      privacyMeta: 'Privacy Policy for VUTASO AI — how your data is handled when using our AI chat application.',
      termsTitle: 'Terms of Service',
      termsMeta: 'Terms of Service for VUTASO AI — rules and conditions for using our AI chat application.',
      privacyLink: 'Privacy Policy',
      termsLink: 'Terms of Service',
      appLink: 'VUTASO AI',
      legalNav: 'Legal',
      copyright: '© VUTASO.com. All rights reserved.',
    },
    vi: {
      back: 'Quay lại VUTASO AI',
      lastUpdated: 'Cập nhật lần cuối: {date}',
      privacyTitle: 'Chính sách bảo mật',
      privacyMeta: 'Chính sách bảo mật VUTASO AI — cách xử lý dữ liệu khi bạn sử dụng ứng dụng chat AI.',
      termsTitle: 'Điều khoản dịch vụ',
      termsMeta: 'Điều khoản dịch vụ VUTASO AI — quy định và điều kiện sử dụng ứng dụng chat AI.',
      privacyLink: 'Chính sách bảo mật',
      termsLink: 'Điều khoản dịch vụ',
      appLink: 'VUTASO AI',
      legalNav: 'Pháp lý',
      copyright: '© VUTASO.com. Bảo lưu mọi quyền.',
    },
  };

  const PRIVACY = {
    en: [
      { title: '1. Introduction', html: '<p>VUTASO AI (“the App”) is provided by <a href="https://vutaso.com" target="_blank" rel="noopener noreferrer">VUTASO.com</a>. This Privacy Policy explains how information is handled when you use the App. By using VUTASO AI, you agree to the practices described in this policy.</p>' },
      { title: '2. How VUTASO AI Works', html: '<p>VUTASO AI is a browser-based chat application. Most data is stored locally on your device. When you send a message, your content and API credentials are transmitted directly from your browser to the AI provider you choose (such as OpenAI, Anthropic, DeepSeek, or Google Gemini).</p><p>VUTASO.com does not operate a central server that stores your conversations or API keys as part of the standard App experience.</p>' },
      { title: '3. Information Stored on Your Device', html: '<p>The App may store the following locally in your browser (localStorage and/or IndexedDB):</p><ul><li>API keys you enter in Settings</li><li>Chat conversations, messages, and attachments</li><li>App preferences (theme, language, model selection, system prompt, and tool settings)</li></ul><p>This data remains on your device unless you clear it through the App, your browser settings, or by uninstalling/clearing site data.</p>' },
      { title: '4. Information Sent to Third Parties', html: '<p>When you use AI features, the App sends data to third-party AI providers according to your configuration, including:</p><ul><li>Messages, prompts, and conversation context</li><li>Images, documents, and other files you attach</li><li>Your API key or authentication token for the selected provider</li></ul><p>Each provider processes data under its own privacy policy and terms. We encourage you to review the policies of OpenAI, Anthropic, DeepSeek, Google, and any other services you connect.</p>' },
      { title: '5. Cookies and Analytics', html: '<p>The App does not use advertising cookies. Fonts and libraries may be loaded from third-party CDNs (such as Google Fonts or jsDelivr), which may receive basic technical data (like your IP address) as part of normal web requests. We do not embed third-party analytics or advertising trackers in the App by default.</p>' },
      { title: '6. Your Choices and Controls', html: '<ul><li>You may delete individual conversations or clear all conversations in the App.</li><li>You may remove API keys and reset settings at any time.</li><li>You may clear all locally stored App data through your browser’s site data settings.</li><li>You choose which AI provider and model to use, and whether to enable features such as web search or image generation.</li></ul>' },
      { title: '7. Data Security', html: '<p>API keys and conversations are stored in your browser. You are responsible for keeping your device and browser secure. Do not share your API keys. Use keys with appropriate usage limits and revoke them if you suspect unauthorized access.</p>' },
      { title: '8. Children’s Privacy', html: '<p>VUTASO AI is not directed to children under 13 (or the minimum age required in your jurisdiction). We do not knowingly collect personal information from children.</p>' },
      { title: '9. International Users', html: '<p>If you use the App from outside your home country, your data may be processed by AI providers in other countries according to their policies and infrastructure locations.</p>' },
      { title: '10. Changes to This Policy', html: '<p>We may update this Privacy Policy from time to time. The “Last updated” date at the top of this page will reflect the most recent revision. Continued use of the App after changes constitutes acceptance of the updated policy.</p>' },
      { title: '11. Contact', html: '<p>If you have questions about this Privacy Policy, contact us at <a href="https://vutaso.com" target="_blank" rel="noopener noreferrer">VUTASO.com</a>.</p>' },
    ],
    vi: [
      { title: '1. Giới thiệu', html: '<p>VUTASO AI (“Ứng dụng”) được cung cấp bởi <a href="https://vutaso.com" target="_blank" rel="noopener noreferrer">VUTASO.com</a>. Chính sách bảo mật này giải thích cách thông tin được xử lý khi bạn sử dụng Ứng dụng. Bằng việc sử dụng VUTASO AI, bạn đồng ý với các thực hành được mô tả trong chính sách này.</p>' },
      { title: '2. VUTASO AI hoạt động như thế nào', html: '<p>VUTASO AI là ứng dụng chat chạy trên trình duyệt. Hầu hết dữ liệu được lưu cục bộ trên thiết bị của bạn. Khi bạn gửi tin nhắn, nội dung và thông tin xác thực API được truyền trực tiếp từ trình duyệt tới nhà cung cấp AI bạn chọn (như OpenAI, Anthropic, DeepSeek hoặc Google Gemini).</p><p>VUTASO.com không vận hành máy chủ trung tâm lưu trữ hội thoại hoặc API key của bạn trong trải nghiệm Ứng dụng tiêu chuẩn.</p>' },
      { title: '3. Thông tin lưu trên thiết bị của bạn', html: '<p>Ứng dụng có thể lưu cục bộ trong trình duyệt (localStorage và/hoặc IndexedDB) các mục sau:</p><ul><li>API key bạn nhập trong Cài đặt</li><li>Hội thoại, tin nhắn và tệp đính kèm</li><li>Tùy chọn ứng dụng (theme, ngôn ngữ, model, system prompt và cài đặt công cụ)</li></ul><p>Dữ liệu này ở trên thiết bị của bạn trừ khi bạn xóa qua Ứng dụng, cài đặt trình duyệt hoặc xóa dữ liệu trang web.</p>' },
      { title: '4. Thông tin gửi tới bên thứ ba', html: '<p>Khi dùng tính năng AI, Ứng dụng gửi dữ liệu tới nhà cung cấp AI theo cấu hình của bạn, bao gồm:</p><ul><li>Tin nhắn, prompt và ngữ cảnh hội thoại</li><li>Ảnh, tài liệu và tệp đính kèm khác</li><li>API key hoặc token xác thực của provider đã chọn</li></ul><p>Mỗi provider xử lý dữ liệu theo chính sách và điều khoản riêng. Bạn nên xem chính sách của OpenAI, Anthropic, DeepSeek, Google và các dịch vụ khác bạn kết nối.</p>' },
      { title: '5. Cookie và phân tích', html: '<p>Ứng dụng không dùng cookie quảng cáo. Font và thư viện có thể tải từ CDN bên thứ ba (Google Fonts, jsDelivr...), có thể nhận dữ liệu kỹ thuật cơ bản (như địa chỉ IP) trong yêu cầu web bình thường. Mặc định chúng tôi không nhúng công cụ phân tích hoặc quảng cáo bên thứ ba.</p>' },
      { title: '6. Lựa chọn và quyền kiểm soát của bạn', html: '<ul><li>Xóa từng hội thoại hoặc xóa tất cả hội thoại trong Ứng dụng.</li><li>Gỡ API key và đặt lại cài đặt bất cứ lúc nào.</li><li>Xóa toàn bộ dữ liệu Ứng dụng lưu cục bộ qua cài đặt dữ liệu trang của trình duyệt.</li><li>Tự chọn provider, model và bật/tắt tính năng như tìm kiếm web hoặc tạo ảnh.</li></ul>' },
      { title: '7. Bảo mật dữ liệu', html: '<p>API key và hội thoại được lưu trong trình duyệt. Bạn chịu trách nhiệm bảo vệ thiết bị và trình duyệt. Không chia sẻ API key. Dùng key có giới hạn phù hợp và thu hồi nếu nghi ngờ truy cập trái phép.</p>' },
      { title: '8. Quyền riêng tư trẻ em', html: '<p>VUTASO AI không hướng tới trẻ em dưới 13 tuổi (hoặc độ tuổi tối thiểu theo pháp luật địa phương). Chúng tôi không cố ý thu thập thông tin cá nhân từ trẻ em.</p>' },
      { title: '9. Người dùng quốc tế', html: '<p>Nếu bạn dùng Ứng dụng từ ngoài quốc gia của mình, dữ liệu có thể được xử lý bởi provider AI ở quốc gia khác theo chính sách và hạ tầng của họ.</p>' },
      { title: '10. Thay đổi chính sách', html: '<p>Chúng tôi có thể cập nhật Chính sách bảo mật theo thời gian. Ngày “Cập nhật lần cuối” ở đầu trang phản ánh bản sửa mới nhất. Tiếp tục dùng Ứng dụng sau khi thay đổi đồng nghĩa với việc chấp nhận chính sách mới.</p>' },
      { title: '11. Liên hệ', html: '<p>Nếu có câu hỏi về Chính sách bảo mật, liên hệ <a href="https://vutaso.com" target="_blank" rel="noopener noreferrer">VUTASO.com</a>.</p>' },
    ],
  };

  const TERMS = {
    en: [
      { title: '1. Acceptance of Terms', html: '<p>These Terms of Service (“Terms”) govern your use of VUTASO AI (“the App”), provided by <a href="https://vutaso.com" target="_blank" rel="noopener noreferrer">VUTASO.com</a>. By accessing or using the App, you agree to be bound by these Terms and our <a href="privacy.html">Privacy Policy</a>. If you do not agree, do not use the App.</p>' },
      { title: '2. Description of Service', html: '<p>VUTASO AI is a web-based interface for interacting with third-party artificial intelligence models. The App allows you to configure your own API keys, manage conversations, attach files, and use optional tools such as web search, image generation, translation, and reasoning modes—depending on the model and provider you select.</p>' },
      { title: '3. Eligibility', html: '<p>You must be at least 13 years old (or the minimum legal age in your jurisdiction) to use the App. You represent that you have the legal capacity to enter into these Terms.</p>' },
      { title: '4. Your Account and API Keys', html: '<p>The App uses API keys that you supply for third-party AI providers. You are solely responsible for:</p><ul><li>Obtaining valid API keys and complying with each provider’s terms</li><li>All usage charges, rate limits, and billing from those providers</li><li>Keeping your keys confidential and secure on your device</li><li>Any activity that occurs using your keys through the App</li></ul>' },
      { title: '5. Acceptable Use', html: '<p>You agree not to use VUTASO AI to:</p><ul><li>Violate any applicable law or regulation</li><li>Infringe intellectual property, privacy, or other rights of others</li><li>Generate, request, or distribute harmful, abusive, fraudulent, or illegal content</li><li>Attempt to bypass security, abuse APIs, or interfere with the App or connected services</li><li>Reverse engineer or misuse the App except as permitted by law</li></ul>' },
      { title: '6. AI-Generated Content', html: '<p>Responses are generated by third-party AI models and may be inaccurate, incomplete, outdated, or inappropriate. <strong>AI can make mistakes. Please double-check responses.</strong> Do not rely on AI output as professional, medical, legal, financial, or other expert advice. You are responsible for how you use, publish, or act on generated content.</p>' },
      { title: '7. Your Content', html: '<p>You retain ownership of the prompts, files, and other content you submit through the App. By using the App, you grant VUTASO.com a limited license to process your content only as needed to operate the App (for example, forwarding requests to your chosen AI provider). Content is primarily stored locally on your device unless transmitted to a third-party provider.</p>' },
      { title: '8. Third-Party Services', html: '<p>The App integrates with external AI providers and may load resources from CDNs. Those services are not controlled by VUTASO.com. Your use of them is subject to their respective terms and privacy policies. We are not responsible for third-party availability, pricing, or conduct.</p>' },
      { title: '9. Intellectual Property', html: '<p>The App’s name, branding, interface, and original code are owned by VUTASO.com or its licensors and are protected by applicable intellectual property laws. These Terms do not grant you any rights to our trademarks or branding except as needed to use the App.</p>' },
      { title: '10. Disclaimer of Warranties', html: '<p>THE APP IS PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.</p>' },
      { title: '11. Limitation of Liability', html: '<p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, VUTASO.COM AND ITS AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF DATA, PROFITS, GOODWILL, OR API CHARGES, ARISING FROM YOUR USE OF THE APP OR THIRD-PARTY AI SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>' },
      { title: '12. Indemnification', html: '<p>You agree to indemnify and hold harmless VUTASO.com from claims, damages, losses, and expenses (including reasonable legal fees) arising from your use of the App, your content, your API keys, or your violation of these Terms or applicable law.</p>' },
      { title: '13. Termination', html: '<p>You may stop using the App at any time by clearing your data or ceasing access. We may suspend or discontinue the App (or any part of it) at any time without liability. Sections that by nature should survive termination will remain in effect.</p>' },
      { title: '14. Changes to These Terms', html: '<p>We may modify these Terms from time to time. Updated Terms will be posted on this page with a revised “Last updated” date. Your continued use of the App after changes become effective constitutes acceptance.</p>' },
      { title: '15. Governing Law', html: '<p>These Terms are governed by applicable laws of the jurisdiction in which VUTASO.com operates, without regard to conflict-of-law principles. Mandatory consumer protection laws in your country may also apply.</p>' },
      { title: '16. Contact', html: '<p>For questions about these Terms, contact us at <a href="https://vutaso.com" target="_blank" rel="noopener noreferrer">VUTASO.com</a>.</p>' },
    ],
    vi: [
      { title: '1. Chấp nhận điều khoản', html: '<p>Điều khoản dịch vụ này (“Điều khoản”) điều chỉnh việc bạn sử dụng VUTASO AI (“Ứng dụng”), do <a href="https://vutaso.com" target="_blank" rel="noopener noreferrer">VUTASO.com</a> cung cấp. Khi truy cập hoặc dùng Ứng dụng, bạn đồng ý bị ràng buộc bởi Điều khoản này và <a href="privacy.html">Chính sách bảo mật</a>. Nếu không đồng ý, vui lòng không sử dụng Ứng dụng.</p>' },
      { title: '2. Mô tả dịch vụ', html: '<p>VUTASO AI là giao diện web để tương tác với các model trí tuệ nhân tạo bên thứ ba. Ứng dụng cho phép bạn cấu hình API key, quản lý hội thoại, đính kèm tệp và dùng công cụ tùy chọn như tìm kiếm web, tạo ảnh, dịch và chế độ suy luận — tùy model và provider bạn chọn.</p>' },
      { title: '3. Điều kiện sử dụng', html: '<p>Bạn phải từ 13 tuổi trở lên (hoặc độ tuổi tối thiểu theo pháp luật địa phương) để dùng Ứng dụng. Bạn xác nhận có đầy đủ năng lực pháp lý để ký kết Điều khoản này.</p>' },
      { title: '4. Tài khoản và API key', html: '<p>Ứng dụng dùng API key do bạn cung cấp cho provider AI bên thứ ba. Bạn hoàn toàn chịu trách nhiệm về:</p><ul><li>Lấy API key hợp lệ và tuân thủ điều khoản từng provider</li><li>Mọi phí, giới hạn tốc độ và hóa đơn từ các provider đó</li><li>Bảo mật key trên thiết bị của bạn</li><li>Mọi hoạt động phát sinh khi dùng key qua Ứng dụng</li></ul>' },
      { title: '5. Sử dụng chấp nhận được', html: '<p>Bạn đồng ý không dùng VUTASO AI để:</p><ul><li>Vi phạm pháp luật hoặc quy định hiện hành</li><li>Xâm phạm quyền sở hữu trí tuệ, quyền riêng tư hoặc quyền khác của người khác</li><li>Tạo, yêu cầu hoặc phân phối nội dung có hại, lạm dụng, gian lận hoặc bất hợp pháp</li><li>Phá vỡ bảo mật, lạm dụng API hoặc cản trở Ứng dụng hoặc dịch vụ liên kết</li><li>Dịch ngược hoặc lạm dụng Ứng dụng trái với pháp luật cho phép</li></ul>' },
      { title: '6. Nội dung do AI tạo', html: '<p>Phản hồi do model AI bên thứ ba tạo ra và có thể sai, thiếu, lỗi thời hoặc không phù hợp. <strong>AI có thể mắc lỗi. Vui lòng kiểm tra lại câu trả lời.</strong> Không coi đầu ra AI là tư vấn chuyên môn, y khoa, pháp lý, tài chính hoặc tư vấn chuyên gia khác. Bạn chịu trách nhiệm về cách sử dụng, công bố hoặc hành động theo nội dung được tạo.</p>' },
      { title: '7. Nội dung của bạn', html: '<p>Bạn giữ quyền sở hữu prompt, tệp và nội dung khác gửi qua Ứng dụng. Khi dùng Ứng dụng, bạn cấp cho VUTASO.com giấy phép hạn chế để xử lý nội dung chỉ trong phạm vi vận hành Ứng dụng (ví dụ chuyển tiếp yêu cầu tới provider AI bạn chọn). Nội dung chủ yếu lưu cục bộ trên thiết bị trừ khi gửi tới provider bên thứ ba.</p>' },
      { title: '8. Dịch vụ bên thứ ba', html: '<p>Ứng dụng tích hợp provider AI bên ngoài và có thể tải tài nguyên từ CDN. Các dịch vụ đó không do VUTASO.com kiểm soát. Việc sử dụng tuân theo điều khoản và chính sách bảo mật riêng. Chúng tôi không chịu trách nhiệm về tình trạng, giá cả hoặc hành vi của bên thứ ba.</p>' },
      { title: '9. Sở hữu trí tuệ', html: '<p>Tên, thương hiệu, giao diện và mã nguồn gốc của Ứng dụng thuộc VUTASO.com hoặc bên cấp phép và được bảo hộ theo luật sở hữu trí tuệ. Điều khoản này không cấp quyền dùng nhãn hiệu hoặc thương hiệu của chúng tôi ngoài phạm vi cần thiết để dùng Ứng dụng.</p>' },
      { title: '10. Tuyên bố miễn bảo đảm', html: '<p>ỨNG DỤNG ĐƯỢC CUNG CẤP “NGUYÊN TRẠNG” VÀ “SẴN CÓ” KHÔNG KÈM BẤT KỲ BẢO ĐẢM NÀO, DÙ RÕ RÀNG HAY NGỤ Ý, BAO GỒM KHẢ NĂNG THƯƠNG MẠI, PHÙ HỢP MỤC ĐÍCH CỤ THỂ VÀ KHÔNG VI PHẠM. CHÚNG TÔI KHÔNG BẢO ĐẢM ỨNG DỤNG LUÔN LIÊN TỤC, KHÔNG LỖI HOẶC AN TOÀN.</p>' },
      { title: '11. Giới hạn trách nhiệm', html: '<p>TRONG PHẠM VI PHÁP LUẬT CHO PHÉP TỐI ĐA, VUTASO.COM VÀ CÁC ĐƠN VỊ LIÊN KẾT KHÔNG CHỊU TRÁCH NHIỆM VỀ THIỆT HẠI GIÁN TIẾP, NGẪU NHIÊN, ĐẶC BIỆT, HẬU QUẢ HOẶC PHẠT, HOẶC MẤT DỮ LIỆU, LỢI NHUẬN, UY TÍN HOẶC PHÍ API PHÁT SINH TỪ VIỆC BẠN DÙNG ỨNG DỤNG HOẶC DỊCH VỤ AI BÊN THỨ BA, KỂ CẢ KHI ĐÃ ĐƯỢC CẢNH BÁO KHẢ NĂNG ĐÓ.</p>' },
      { title: '12. Bồi thường', html: '<p>Bạn đồng ý bồi thường và giữ cho VUTASO.com không bị thiệt hại từ khiếu nại, thiệt hại, tổn thất và chi phí (kể cả phí luật sư hợp lý) phát sinh từ việc bạn dùng Ứng dụng, nội dung, API key hoặc vi phạm Điều khoản hoặc pháp luật.</p>' },
      { title: '13. Chấm dứt', html: '<p>Bạn có thể ngừng dùng Ứng dụng bất cứ lúc nào bằng cách xóa dữ liệu hoặc ngừng truy cập. Chúng tôi có thể tạm ngừng hoặc ngừng Ứng dụng (hoặc một phần) bất cứ lúc nào mà không chịu trách nhiệm. Các điều khoản theo bản chất vẫn có hiệu lực sau khi chấm dứt sẽ tiếp tục áp dụng.</p>' },
      { title: '14. Thay đổi điều khoản', html: '<p>Chúng tôi có thể sửa Điều khoản theo thời gian. Bản cập nhật sẽ đăng trên trang này kèm ngày “Cập nhật lần cuối” mới. Tiếp tục dùng Ứng dụng sau khi thay đổi có hiệu lực đồng nghĩa với việc chấp nhận.</p>' },
      { title: '15. Luật áp dụng', html: '<p>Điều khoản này tuân theo pháp luật áp dụng tại khu vực VUTASO.com hoạt động, không tính xung đột quy định pháp luật. Luật bảo vệ người tiêu dùng bắt buộc tại quốc gia của bạn cũng có thể áp dụng.</p>' },
      { title: '16. Liên hệ', html: '<p>Câu hỏi về Điều khoản, liên hệ <a href="https://vutaso.com" target="_blank" rel="noopener noreferrer">VUTASO.com</a>.</p>' },
    ],
  };

  const BACKEND_FIELD = '_backend';
  const BACKEND_IDB = 'indexeddb';
  const IDB_NAME = 'testchatai-db';
  const IDB_STORE = 'state';
  const IDB_RECORD_KEY = 'app';

  const normalizeLocale = (value) => (value === 'vi' ? 'vi' : 'en');

  const readLocaleFromIdb = () => new Promise((resolve) => {
    if (!window.indexedDB) {
      resolve('en');
      return;
    }
    const request = indexedDB.open(IDB_NAME, 1);
    request.onerror = () => resolve('en');
    request.onsuccess = () => {
      try {
        const db = request.result;
        const tx = db.transaction(IDB_STORE, 'readonly');
        const getReq = tx.objectStore(IDB_STORE).get(IDB_RECORD_KEY);
        getReq.onsuccess = () => resolve(normalizeLocale(getReq.result?.locale));
        getReq.onerror = () => resolve('en');
      } catch {
        resolve('en');
      }
    };
  });

  const getLocale = async () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return 'en';
      const data = JSON.parse(raw);
      if (data[BACKEND_FIELD] === BACKEND_IDB) {
        return await readLocaleFromIdb();
      }
      return normalizeLocale(data.locale);
    } catch {
      return 'en';
    }
  };

  const ui = (loc) => UI[loc] || UI.en;

  const renderSections = (sections) =>
    sections.map((s) => `<section><h2>${s.title}</h2>${s.html}</section>`).join('');

  const renderPage = async (page) => {
    const loc = await getLocale();
    const strings = ui(loc);
    const isPrivacy = page === 'privacy';
    const sections = (isPrivacy ? PRIVACY[loc] : TERMS[loc]) || (isPrivacy ? PRIVACY.en : TERMS.en);
    const title = isPrivacy ? strings.privacyTitle : strings.termsTitle;
    const meta = isPrivacy ? strings.privacyMeta : strings.termsMeta;

    document.documentElement.lang = loc === 'vi' ? 'vi' : 'en';
    document.title = `${title} — VUTASO AI`;

    const metaEl = document.querySelector('meta[name="description"]');
    if (metaEl) metaEl.setAttribute('content', meta);

    const back = document.querySelector('.legal-back');
    if (back) {
      back.innerHTML = `<i class="fa-solid fa-arrow-left" aria-hidden="true"></i> ${strings.back}`;
    }

    const h1 = document.querySelector('.legal-header h1');
    if (h1) h1.textContent = title;

    const updated = document.querySelector('.legal-updated');
    if (updated) updated.textContent = strings.lastUpdated.replace('{date}', UPDATED);

    const main = document.getElementById('legalContent');
    if (main) main.innerHTML = renderSections(sections);

    const footerNav = document.querySelector('.legal-footer-links');
    if (footerNav) {
      footerNav.setAttribute('aria-label', strings.legalNav);
      footerNav.innerHTML = `
        <a href="privacy.html">${strings.privacyLink}</a>
        <a href="terms.html">${strings.termsLink}</a>
        <a href="index.html">${strings.appLink}</a>
      `;
    }

    const copyright = document.querySelector('.legal-footer > p');
    if (copyright) copyright.textContent = strings.copyright;
  };

  return { getLocale, renderPage };
})();
