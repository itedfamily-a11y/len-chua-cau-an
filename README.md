# Lên Chùa Cầu An

Trò chơi 3D thư giãn chạy ngay trong trình duyệt: dạo quanh một ngôi chùa Việt, thắp hương, thỉnh chuông,
gõ mõ tụng kinh, ngồi thiền trên bồ đoàn, viết lời cầu an và xin một quẻ đầu năm. Có khách hành hương AI
đi lại, lễ Phật và ngồi tụng kinh cùng bạn.

**Chơi ngay:** https://itedfamily-a11y.github.io/len-chua-cau-an/

## Nguyên tắc của trò chơi

- Không đăng nhập, không quảng cáo, không thu thập dữ liệu. Tiến trình chơi lưu trong trình duyệt của bạn.
- **Đi chùa cùng mọi người — tắt mặc định.** Bật trong *Cài đặt* thì tên bạn đặt, vị trí nhân vật và việc bạn đang làm (thắp hương,
  thỉnh chuông, ngồi tụng kinh / thiền trên bồ đoàn nào) cùng ba cử chỉ đặt sẵn (chắp tay, cúi chào, vẫy tay) được gửi thẳng tới những
  người cũng đang bật lúc đó, qua kết nối ngang hàng WebRTC giữa các trình duyệt ([Trystero](https://github.com/dmotz/trystero), dùng mạng
  Nostr để tìm nhau). Không có máy chủ của trò chơi. Bạn có thể gõ một câu ngắn (tối đa 60 ký tự, một câu mỗi 2 giây) hiện thành bong
  bóng trên đầu nhân vật cho mọi người cùng phòng: trò chơi không kiểm duyệt được lời người khác, chỉ lọc từ thô (thay bằng •••), chặn câu
  có địa chỉ web hoặc dãy số dài, và cho bạn ẩn từng người hoặc tắt mọi bong bóng. Không lưu lịch sử chat xuống máy; trong lúc chơi chỉ
  giữ vài bộ đếm và một nhật ký ngắn trong bộ nhớ để gỡ lỗi, mất khi tải lại trang. Để tìm nhau, trình duyệt gọi tới vài điểm hẹn công
  cộng (8 trong 29 relay Nostr có sẵn trong Trystero, máy chủ STUN của Google và Cloudflare): chúng thấy địa chỉ mạng (IP) của bạn,
  không thấy tên hay vị trí trong chùa; người cùng phòng là người lạ và thấy IP của nhau như mọi kết nối ngang hàng. Tắt công tắc là
  ngừng ngay và đóng luôn kết nối tới relay. Mã nhóm riêng không phải mật khẩu: ai biết mã đều vào được.
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
- Chế độ đi chùa chung dùng [Trystero](https://github.com/dmotz/trystero) 0.26.0 (MIT) tải từ jsDelivr **chỉ khi** người chơi bật công tắc;
  đây là ngoại lệ duy nhất của luật "không tài sản ngoài". Cần trang chạy qua https (GitHub Pages có sẵn) hoặc localhost. Không có máy chủ
  TURN nên hai người sau mạng khắt khe (NAT đối xứng) có thể không nối được với nhau — trò chơi báo trong *Cài đặt*. Hai người thường
  thấy nhau sau vài giây, có lúc tới nửa phút.

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
