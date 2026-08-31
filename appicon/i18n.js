window.AppIconI18n = (() => {
  const KEY = "appicon-lang";
  const messages = {
    vi: {
      "meta.title": "AppIcon — Tạo App Icon iOS & Android | VUTASO",
      "brand.home": "VUTASO",
      "brand.app": "AppIcon trang chủ",
      "header.note": "Chạy hoàn toàn trên trình duyệt",
      "workspace.label": "Công cụ tạo App Icon",
      "lang.label": "Ngôn ngữ",
      "hero.eyebrow": "APP ICON TOOLKIT",
      "hero.title": "Biến một hình ảnh<br /><em>thành App Icon.</em>",
      "hero.copy": "Tạo bộ icon cho iOS, iPadOS, macOS, watchOS, tvOS và Android ngay trên trình duyệt. Ảnh của bạn không bao giờ rời khỏi thiết bị.",
      "upload.step": "TẢI ẢNH GỐC",
      "upload.title": "Kéo thả ảnh vào đây",
      "upload.hintHtml": "hoặc <u>chọn file</u> từ máy tính",
      "upload.ready": "Ảnh đã sẵn sàng",
      "upload.change": "Chọn ảnh khác nếu muốn thay đổi",
      "upload.formats": "PNG, JPG hoặc WEBP · tối thiểu 1024 × 1024 px",
      "upload.choose": "Chọn ảnh PNG, JPG hoặc WEBP",
      "upload.remove": "Xóa ảnh",
      "upload.tip": "Ảnh vuông sẽ cho kết quả tốt nhất. Icon iOS tự động bo góc khi hiển thị.",
      "platform.label": "NỀN TẢNG",
      "platform.ios": "iOS / iPadOS",
      "platform.macos": "macOS",
      "platform.watchos": "watchOS",
      "platform.tvos": "tvOS",
      "platform.android": "Android / Android Studio",
      "android.bg": "MÀU NỀN ADAPTIVE ICON",
      "android.safe": "Foreground giữ vùng an toàn 66 × 66dp",
      "preview.step": "XEM TRƯỚC",
      "preview.empty": "Preview sẽ xuất hiện ở đây",
      "preview.meta": "Các kích thước được tạo",
      "preview.masks": "Preview mask Android: circle · rounded square · square",
      "preview.masksAria": "Preview mask Android",
      "preview.alt": "Preview App Icon",
      "upscale": "Cho phép upscale ảnh nhỏ",
      "output.step": "XUẤT FILE",
      "output.default": "Gói ZIP chứa toàn bộ PNG và <code>Contents.json</code> đã sẵn sàng cho Xcode.",
      "output.android": "ZIP Android Studio gồm nội dung <code>res/</code> (<code>mipmap-*</code>, <code>drawable-*</code>, <code>values/ic_launcher_colors.xml</code>) và Play icon 512×512.",
      "output.tvos": "ZIP tvOS gồm <code>App Icon &amp; Top Shelf Image.brandassets</code> (imagestack 3 lớp + Top Shelf) cho Xcode.",
      "output.apple": "ZIP {platform} gồm PNG và <code>Contents.json</code> cho Xcode.",
      "download.label": "Tải {platform}-AppIcon.zip",
      "download.working": "Đang tạo bộ icon…",
      "dim.android": "launcher + adaptive 108–432px + Play icon",
      "dim.tvos": "brandassets · 400×240, 1280×768 + Top Shelf",
      "dim.apple": "{count} files · {platform}",
      "guide.apple.label": "DÙNG TRONG XCODE",
      "guide.android.label": "DÙNG TRONG ANDROID STUDIO",
      "guide.heading": "Ba bước để bắt đầu.",
      "guide.zip": "Tải file ZIP",
      "guide.zipBody": "Giải nén file vừa tải về máy.",
      "guide.apple.title": "Mở Assets.xcassets",
      "guide.apple.body": "Kéo thư mục <code>AppIcon.appiconset</code> vào trong.",
      "guide.apple.bodyTv": "Kéo thư mục <code>App Icon &amp; Top Shelf Image.brandassets</code> vào trong.",
      "guide.apple.select": "Chọn App Icon",
      "guide.apple.selectBody": "Vào Target → General → App Icons Source.",
      "guide.android.merge": "Trộn vào res",
      "guide.android.mergeBody": "Chép nội dung thư mục <code>res</code> (<code>mipmap-*</code>, <code>drawable-*</code>, <code>values/ic_launcher_colors.xml</code>) vào <code>app/src/main/res</code>. Không chép cả thư mục <code>res</code> (tránh <code>res/res</code>).",
      "guide.android.manifest": "Khai báo launcher",
      "guide.android.manifestBody": "Gán <code>android:icon=\"@mipmap/ic_launcher\"</code> và <code>android:roundIcon=\"@mipmap/ic_launcher_round\"</code> trên <code>&lt;application&gt;</code>.",
      "composer.title": "Icon Composer và Xcode mới",
      "composer.body": "Gói PNG legacy này phù hợp với asset catalog truyền thống. Với Xcode mới, hãy đưa artwork nguồn vào Icon Composer để tạo các biến thể Default, Dark, Tinted hoặc Clear theo workflow của Apple.",
      "footer.left": "APPICON / MADE FOR APP BUILDERS",
      "footer.right": "© 2026 VUTASO.com · LOCAL · PRIVATE · OPEN",
      "footer.privacy": "Bảo mật",
      "footer.terms": "Điều khoản",
      "status.ok": "Ảnh hợp lệ và sẵn sàng xuất.",
      "status.note": "Lưu ý: {details}.",
      "warn.upscale": "ảnh sẽ được upscale khi xuất",
      "warn.upscaleOn": "đã cho phép upscale; chất lượng ở kích thước lớn có thể giảm",
      "warn.alphaIos": "có transparency; icon App Store sẽ được flatten trên nền trắng",
      "warn.alphaAndroid": "có transparency; foreground adaptive giữ alpha, Play icon flatten trên màu nền",
      "warn.alphaTvos": "có transparency; lớp Back và Top Shelf flatten trên nền trắng",
      "error.type": "Vui lòng chọn đúng file PNG, JPG hoặc WEBP.",
      "error.size": "File quá lớn. Vui lòng chọn ảnh nhỏ hơn 25 MB.",
      "error.decode": "Không thể đọc ảnh này. Hãy thử một file PNG hoặc JPG khác.",
      "error.upscale": "Ảnh nhỏ hơn 1024px. Hãy xác nhận upscale trước khi tải.",
      "error.zipLib": "Không tải được bộ nén. Hãy kiểm tra kết nối rồi thử lại.",
      "error.playSize": "Google Play icon vượt 1 MB. Hãy dùng ảnh đơn giản hơn hoặc giảm chi tiết.",
      "error.manifest": "Bộ icon không hợp lệ. Vui lòng thử lại.",
      "error.zip": "Có lỗi khi tạo file ZIP. Vui lòng thử lại.",
    },
    en: {
      "meta.title": "AppIcon — Generate iOS & Android App Icons | VUTASO",
      "brand.home": "VUTASO",
      "brand.app": "AppIcon home",
      "header.note": "Runs entirely in your browser",
      "workspace.label": "App Icon generator",
      "lang.label": "Language",
      "hero.eyebrow": "APP ICON TOOLKIT",
      "hero.title": "Turn one image<br /><em>into an App Icon.</em>",
      "hero.copy": "Build icon sets for iOS, iPadOS, macOS, watchOS, tvOS, and Android in your browser. Your image never leaves this device.",
      "upload.step": "SOURCE IMAGE",
      "upload.title": "Drop an image here",
      "upload.hintHtml": "or <u>choose a file</u> from your computer",
      "upload.ready": "Image ready",
      "upload.change": "Choose another image to replace it",
      "upload.formats": "PNG, JPG or WEBP · at least 1024 × 1024 px",
      "upload.choose": "Choose a PNG, JPG, or WEBP image",
      "upload.remove": "Remove image",
      "upload.tip": "Square images look best. iOS rounds corners when the icon is displayed.",
      "platform.label": "PLATFORM",
      "platform.ios": "iOS / iPadOS",
      "platform.macos": "macOS",
      "platform.watchos": "watchOS",
      "platform.tvos": "tvOS",
      "platform.android": "Android / Android Studio",
      "android.bg": "ADAPTIVE ICON BACKGROUND",
      "android.safe": "Foreground stays in the 66 × 66dp safe zone",
      "preview.step": "PREVIEW",
      "preview.empty": "Preview will appear here",
      "preview.meta": "Sizes that will be generated",
      "preview.masks": "Android mask preview: circle · rounded square · square",
      "preview.masksAria": "Android adaptive icon preview",
      "preview.alt": "App Icon preview",
      "upscale": "Allow upscaling a small image",
      "output.step": "EXPORT",
      "output.default": "ZIP with PNG files and <code>Contents.json</code>, ready for Xcode.",
      "output.android": "Android Studio ZIP with <code>res/</code> contents (<code>mipmap-*</code>, <code>drawable-*</code>, <code>values/ic_launcher_colors.xml</code>) and a 512×512 Play icon.",
      "output.tvos": "tvOS ZIP with <code>App Icon &amp; Top Shelf Image.brandassets</code> (3-layer imagestack + Top Shelf) for Xcode.",
      "output.apple": "{platform} ZIP with PNG files and <code>Contents.json</code> for Xcode.",
      "download.label": "Download {platform}-AppIcon.zip",
      "download.working": "Building icon set…",
      "dim.android": "launcher + adaptive 108–432px + Play icon",
      "dim.tvos": "brandassets · 400×240, 1280×768 + Top Shelf",
      "dim.apple": "{count} files · {platform}",
      "guide.apple.label": "USE IN XCODE",
      "guide.android.label": "USE IN ANDROID STUDIO",
      "guide.heading": "Three steps to start.",
      "guide.zip": "Download the ZIP",
      "guide.zipBody": "Unzip the file on your computer.",
      "guide.apple.title": "Open Assets.xcassets",
      "guide.apple.body": "Drag the <code>AppIcon.appiconset</code> folder into it.",
      "guide.apple.bodyTv": "Drag the <code>App Icon &amp; Top Shelf Image.brandassets</code> folder into it.",
      "guide.apple.select": "Select the App Icon",
      "guide.apple.selectBody": "Go to Target → General → App Icons Source.",
      "guide.android.merge": "Merge into res",
      "guide.android.mergeBody": "Copy the contents of the <code>res</code> folder (<code>mipmap-*</code>, <code>drawable-*</code>, <code>values/ic_launcher_colors.xml</code>) into <code>app/src/main/res</code>. Do not copy the <code>res</code> folder itself (that creates <code>res/res</code>).",
      "guide.android.manifest": "Declare the launcher",
      "guide.android.manifestBody": "Set <code>android:icon=\"@mipmap/ic_launcher\"</code> and <code>android:roundIcon=\"@mipmap/ic_launcher_round\"</code> on <code>&lt;application&gt;</code>.",
      "composer.title": "Icon Composer and newer Xcode",
      "composer.body": "This legacy PNG pack fits a traditional asset catalog. In current Xcode, drop source artwork into Icon Composer to build Default, Dark, Tinted, or Clear variants.",
      "footer.left": "APPICON / MADE FOR APP BUILDERS",
      "footer.right": "© 2026 VUTASO.com · LOCAL · PRIVATE · OPEN",
      "footer.privacy": "Privacy",
      "footer.terms": "Terms",
      "status.ok": "Image is valid and ready to export.",
      "status.note": "Note: {details}.",
      "warn.upscale": "the image will be upscaled on export",
      "warn.upscaleOn": "upscaling allowed; large sizes may look softer",
      "warn.alphaIos": "has transparency; the App Store icon will be flattened on white",
      "warn.alphaAndroid": "has transparency; adaptive foreground keeps alpha, Play icon flattens on the background color",
      "warn.alphaTvos": "has transparency; Back layer and Top Shelf flatten on white",
      "error.type": "Please choose a PNG, JPG, or WEBP file.",
      "error.size": "File is too large. Please choose an image under 25 MB.",
      "error.decode": "Could not read this image. Try another PNG or JPG file.",
      "error.upscale": "Image is smaller than 1024px. Confirm upscaling before download.",
      "error.zipLib": "The zipper library failed to load. Check your connection and try again.",
      "error.playSize": "The Google Play icon exceeds 1 MB. Use a simpler image or less detail.",
      "error.manifest": "The icon set is invalid. Please try again.",
      "error.zip": "Could not create the ZIP file. Please try again.",
    },
  };

  let lang = "vi";

  function interpolate(text, vars) {
    if (!vars) return text;
    return text.replace(/\{(\w+)\}/g, (_, name) => (vars[name] != null ? String(vars[name]) : ""));
  }

  function t(key, vars) {
    const table = messages[lang] || messages.vi;
    const text = table[key] != null ? table[key] : (messages.vi[key] || key);
    return interpolate(text, vars);
  }

  function apply() {
    document.documentElement.lang = lang;
    document.title = t("meta.title");
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const text = t(el.getAttribute("data-i18n"));
      if (text != null) el.textContent = text;
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const html = t(el.getAttribute("data-i18n-html"));
      if (html != null) el.innerHTML = html;
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const label = t(el.getAttribute("data-i18n-aria"));
      if (label != null) el.setAttribute("aria-label", label);
    });
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      const active = btn.getAttribute("data-lang") === lang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
    document.dispatchEvent(new CustomEvent("i18n:change", { detail: { lang } }));
  }

  function setLang(next) {
    if (!messages[next]) return;
    lang = next;
    localStorage.setItem(KEY, next);
    apply();
  }

  function init() {
    const stored = localStorage.getItem(KEY);
    lang = stored && messages[stored] ? stored : "vi";
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => setLang(btn.getAttribute("data-lang")));
    });
    apply();
  }

  return { t, setLang, getLang: () => lang, init, apply };
})();

window.AppIconI18n.init();
