# AppIcon

Trình tạo bộ app icon chạy trực tiếp trên trình duyệt cho các nền tảng Apple và Android.

## Tính năng

- Kéo thả hoặc chọn ảnh PNG, JPG, JPEG và WEBP.
- Kiểm tra kích thước ảnh đầu vào; khuyến nghị ảnh vuông tối thiểu `1024 × 1024 px`.
- Xem trước app icon trước khi xuất file.
- Tạo file ZIP chứa:
  - `AppIcon.appiconset` và `Contents.json` cho Xcode.
  - Các thư mục `mipmap-*` cho Android / Android Studio.
- Hỗ trợ iOS / iPadOS, macOS, watchOS, tvOS và Android.
- Tùy chỉnh màu nền cho Android Adaptive Icon.
- Không tải ảnh lên máy chủ; ảnh được xử lý hoàn toàn trên thiết bị.

## Cách sử dụng

1. Mở [AppIcon](https://vutaso.com/appicon/).
2. Chọn hoặc kéo thả một ảnh vào vùng tải ảnh.
3. Chọn nền tảng cần xuất icon.
4. Kiểm tra bản xem trước và trạng thái xác thực.
5. Nhấn **Tải AppIcon.appiconset.zip**.

### Dùng với Xcode

1. Giải nén file ZIP.
2. Mở `Assets.xcassets` trong project Xcode.
3. Kéo thư mục `AppIcon.appiconset` vào `Assets.xcassets`.
4. Vào **Target → General → App Icons Source** và chọn app icon vừa thêm.

### Dùng với Android Studio

1. Giải nén file ZIP.
2. Sao chép các thư mục `mipmap-*` vào `app/src/main/res`.
3. Khai báo `@mipmap/ic_launcher` trong `AndroidManifest.xml`, hoặc dùng **Image Asset** trong Android Studio.

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
└── vendor/
    └── jszip.min.js
```

## Ghi chú

Gói PNG legacy phù hợp với asset catalog truyền thống. Với Xcode mới, có thể dùng artwork nguồn trong Icon Composer để tạo các biến thể Default, Dark, Tinted và Clear theo workflow của Apple.

© VUTASO
