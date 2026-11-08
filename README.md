# Lên Chùa Cầu An

Trò chơi 3D thư giãn chạy ngay trong trình duyệt: dạo quanh một ngôi chùa Việt, thắp hương, thỉnh chuông,
gõ mõ tụng kinh, ngồi thiền trên bồ đoàn, viết lời cầu an và xin một quẻ đầu năm. Có khách hành hương AI
đi lại, lễ Phật và ngồi tụng kinh cùng bạn.

**Chơi ngay:** https://itedfamily-a11y.github.io/len-chua-cau-an/

## Nguyên tắc của trò chơi

- Không đăng nhập, không quảng cáo, không thu thập dữ liệu. Tiến trình chơi lưu trong trình duyệt của bạn.
- Không thắng thua, không xếp hạng, không mua bán hay quyên góp.
- Tôn trọng đạo Phật: không khẳng định lời cầu nguyện chắc chắn linh nghiệm; quẻ xin chỉ mang tính giải trí.
- Toàn bộ chữ trong trò chơi là tiếng Việt có dấu.

## Kỹ thuật

- Một file `index.html` duy nhất, dựng từ các phần trong `src/` bằng `node build.js`.
- Dùng [Three.js](https://threejs.org/) r160 tải từ CDN jsDelivr (kể cả phần phụ trợ `three/addons/` cho hậu kỳ);
  không có tệp ảnh, mô hình hay phông chữ ngoài. Mọi hình khối, tranh phông và biểu tượng đều vẽ bằng mã.
- Hậu kỳ trong chính điện: khử răng cưa MSAA, GTAO, bloom, đường cong màu mềm; tự hạ mức trên máy yếu
  hoặc khi trình duyệt không hỗ trợ, và vẫn chạy ở chế độ vẽ thường nếu phần phụ trợ không tải được.
- Yêu cầu trình duyệt: Chrome / Edge 89+, Safari 16.4+, Firefox 108+ (cần import map và WebGL2).

## Chạy trên máy

Mở `index.html` bằng trình duyệt (cần mạng để tải Three.js), hoặc phát thư mục bằng một máy chủ tĩnh bất kỳ.
Sau khi sửa mã trong `src/`, chạy:

```bash
node build.js
```

## Tài liệu

- `src/API.md` — kiến trúc, các module và hợp đồng giữa chúng.
- `src/AREA2.md` — khu chính điện: bố cục, máy quay, ban thờ.
- `HUONG-DAN-CONG-KHAI.md` — cách đưa trò chơi lên mạng và cập nhật.

Mã nguồn được công khai để tham khảo. Mọi quyền khác thuộc về tác giả.
