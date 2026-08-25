# Screenshot Studio

Trình tạo ảnh quảng bá cho App Store và Google Play, chạy hoàn toàn trên trình duyệt.

## Tính năng

- Preset kích thước cho iPhone, iPad và Google Play phone/tablet.
- Kéo thả hoặc chọn tối đa 10 screenshot PNG, JPG, JPEG, WEBP.
- Tuỳ chỉnh tiêu đề, mô tả, màu nền, màu chữ, kiểu fit và frame thiết bị.
- Hiển thị vùng an toàn và cảnh báo khi ảnh nguồn có độ phân giải thấp.
- Xuất PNG hiện tại hoặc ZIP chứa toàn bộ ảnh.
- Không upload ảnh lên server; cấu hình template được lưu cục bộ trong `localStorage`.

## Chạy cục bộ

Từ thư mục gốc:

```bash
python3 -m http.server 8080
```

Mở `http://localhost:8080/screenshot/`. Vì ứng dụng dùng ES modules, không nên mở `index.html` trực tiếp bằng `file://`.

## Ghi chú

Preset cung cấp kích thước pixel phổ biến để chuẩn bị asset. Trước khi submit, hãy kiểm tra lại yêu cầu mới nhất trong App Store Connect hoặc Google Play Console. Ảnh không được lưu lâu dài; hãy tải file ZIP trước khi đóng tab.
