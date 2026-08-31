# AppIcon

Trình tạo bộ app icon chạy trực tiếp trên trình duyệt cho các nền tảng Apple và Android.

## Tính năng

- Kéo thả hoặc chọn ảnh PNG, JPG, JPEG và WEBP.
- Kiểm tra kích thước ảnh đầu vào; khuyến nghị ảnh vuông tối thiểu `1024 × 1024 px`.
- Xem trước app icon trước khi xuất file.
- Tạo file ZIP chứa:
  - `AppIcon.appiconset` và `Contents.json` cho iOS, iPadOS, macOS, watchOS.
  - `App Icon & Top Shelf Image.brandassets` (imagestack + Top Shelf) cho tvOS.
  - Các thư mục `mipmap-*`, `drawable-*` (adaptive 108–432px) và `values/ic_launcher_colors.xml` cho Android / Android Studio.
- Hỗ trợ iOS / iPadOS, macOS, watchOS, tvOS và Android.
- Tùy chỉnh màu nền cho Android Adaptive Icon.
- Không tải ảnh lên máy chủ; ảnh được xử lý hoàn toàn trên thiết bị. Trang không dùng Google Fonts.
- Giao diện tiếng Việt / English (nút VI · EN).
- SEO: canonical, Open Graph, JSON-LD, favicon, và URL trong `sitemap.xml`.

## Cách sử dụng

1. Mở [AppIcon](https://vutaso.com/appicon/).
2. Chọn hoặc kéo thả một ảnh vào vùng tải ảnh.
3. Chọn nền tảng cần xuất icon.
4. Kiểm tra bản xem trước và trạng thái xác thực.
5. Nhấn **Tải {platform}-AppIcon.zip**.

### Dùng với Xcode

1. Giải nén file ZIP.
2. Mở `Assets.xcassets` trong project Xcode.
3. Kéo thư mục `AppIcon.appiconset` vào `Assets.xcassets` (iOS, macOS, watchOS), hoặc kéo `App Icon & Top Shelf Image.brandassets` cho tvOS.
4. Vào **Target → General → App Icons Source** và chọn app icon vừa thêm.

### Dùng với Android Studio

1. Giải nén file ZIP.
2. Sao chép **nội dung** thư mục `res` (`mipmap-*`, `drawable-*`, `values/ic_launcher_colors.xml`) vào `app/src/main/res`. Không chép cả thư mục `res` — sẽ tạo `app/src/main/res/res`.
3. Không ghi đè `values/colors.xml` có sẵn; gói này dùng `ic_launcher_colors.xml` để trộn an toàn.
4. Khai báo `android:icon="@mipmap/ic_launcher"` và `android:roundIcon="@mipmap/ic_launcher_round"` trên phần tử `<application>` trong `AndroidManifest.xml`.

## Chạy cục bộ

Đây là ứng dụng frontend tĩnh, không cần cài đặt dependency. Có thể mở trực tiếp `index.html`, hoặc chạy một static server:

```bash
python3 -m http.server 8080
```

Sau đó truy cập `http://localhost:8080/appicon/`.

## Cấu trúc

```text
appicon/
├── index.html
├── styles.css
├── app.js
├── i18n.js
├── favicon.svg
├── og-image.png
├── tests/
│   └── smoke.test.js
└── vendor/
    ├── jszip.min.js
    └── LICENSE.md
```

Chạy smoke test:

```bash
node appicon/tests/smoke.test.js
```

## Ghi chú

Gói PNG legacy phù hợp với asset catalog truyền thống. Với Xcode mới, có thể dùng artwork nguồn trong Icon Composer để tạo các biến thể Default, Dark, Tinted và Clear theo workflow của Apple.

## Giấy phép bên thứ ba

- Giao diện dùng font hệ thống (`system-ui`, `ui-monospace`). Không nhúng file `.woff` / `.ttf`, không tải Google Fonts.
- `vendor/jszip.min.js` là JSZip 3.10.1, dùng theo **MIT**. Xem `vendor/LICENSE.md`.

© VUTASO
