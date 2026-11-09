# Hướng dẫn đưa "Lên Chùa Cầu An" lên mạng

Trò chơi là **một file tĩnh** `index.html` (cộng thư mục `assets/` nếu sau này dùng mô hình ngoài).
Không cần máy chủ, không cơ sở dữ liệu, không đăng nhập. Người chơi chỉ cần trình duyệt mới và kết nối mạng
(Three.js và phần phụ trợ hậu kỳ `three/addons/` tải từ CDN jsDelivr; nếu phần phụ trợ không tải được, trò chơi vẫn chạy ở chế độ vẽ thường). Trò chơi không thu thập dữ liệu; tiến trình chơi lưu trong localStorage của trình duyệt người chơi, không gửi đi đâu.
Chế độ **Đi chùa cùng mọi người** (tắt mặc định) nối thẳng các trình duyệt với nhau bằng WebRTC qua thư viện Trystero (tải từ jsDelivr
khi bật, dùng mạng Nostr công cộng để tìm nhau) — vẫn không cần máy chủ riêng, nhưng trang phải chạy qua **https** (GitHub Pages / Netlify /
Cloudflare đều có sẵn) hoặc localhost; mở thẳng tệp `index.html` bằng `file://` thì phần này có thể không hoạt động.

## Danh sách kiểm trước khi công khai

- [ ] `node build.js` chạy xong, không lỗi; `git status` sạch (đã commit).
- [ ] Mở thử bản dựng trên máy tính **và điện thoại thật**: vào cổng, chính điện, ngồi tụng kinh; âm thanh bật sau khi bấm *Vào chùa*.
- [ ] Nếu có mô hình GLB / ảnh texture: thư mục `assets/mo-hinh/` phải đi kèm `index.html`.
- [ ] Trình duyệt tối thiểu của người chơi: Chrome 89+, Edge 89+, Safari 16.4+, Firefox 108+ (cần *import map* và WebGL2).
- [ ] Dung lượng tải một lần: khoảng 3,8 MB (nén còn khoảng 2,4 MB).

## Cách 1 — GitHub Pages (khuyên dùng: miễn phí, cập nhật bằng `git push`)

1. Đăng nhập **github.com** → nút **New repository** → tên gợi ý `len-chua-cau-an`, chọn **Public**,
   **không** tích "Add a README" (để kho trống).
2. Gửi địa chỉ kho cho Claude (dạng `https://github.com/<tên-bạn>/len-chua-cau-an.git`), hoặc tự chạy trong `D:\dichua`:

   ```bash
   git remote add origin https://github.com/<tên-bạn>/len-chua-cau-an.git
   ```

   ```bash
   git push -u origin main
   ```

   Lần đầu, Git Credential Manager mở cửa sổ đăng nhập GitHub; đăng nhập xong lệnh đẩy tiếp tục.
3. Trên trang kho: **Settings → Pages → Build and deployment**: Source *Deploy from a branch*,
   Branch `main`, thư mục `/ (root)` → **Save**.
4. Chờ 1–2 phút. Địa chỉ công khai: `https://<tên-bạn>.github.io/len-chua-cau-an/`
5. Cập nhật sau này: `node build.js` → commit → `git push`. Pages tự dựng lại sau khoảng một phút.

Ghi chú: cả kho (mã nguồn `src/`, tài liệu) sẽ công khai cùng trò chơi. Nếu chỉ muốn đưa `index.html` lên, dùng cách 2.
Tên miền riêng (tuỳ chọn): **Settings → Pages → Custom domain**, ở nhà cung cấp tên miền tạo bản ghi CNAME trỏ về `<tên-bạn>.github.io`.

## Cách 2 — Kéo thả (Netlify Drop / Cloudflare Pages)

- **Netlify**: mở `app.netlify.com/drop`, kéo thư mục chứa `index.html` (và `assets/` nếu có) vào → có địa chỉ ngay.
  Đăng nhập để giữ trang lâu dài; cập nhật bằng cách kéo thả lại ở mục *Deploys*.
- **Cloudflare Pages**: `dash.cloudflare.com` → *Workers & Pages* → *Create* → *Pages* → *Upload assets* → kéo thư mục vào.

## Sau khi lên mạng

- Mở địa chỉ trên điện thoại và máy tính, chơi thử một vòng; nếu máy yếu, trò chơi tự hạ chất lượng.
- Chia sẻ địa chỉ cho mọi người. Trò chơi không thu thập dữ liệu; thứ trình duyệt tải từ bên ngoài là thư viện Three.js trên jsDelivr,
  và chỉ khi người chơi bật *Đi chùa cùng mọi người* thì thêm thư viện Trystero (cũng trên jsDelivr).
- Muốn thử đi chùa chung: hai người (hoặc hai trình duyệt trên hai máy) cùng mở trang, cùng bật công tắc trong *Cài đặt*; thường vài giây,
  có lúc tới nửa phút, sẽ thấy nhau. Nhập cùng một mã nhóm để đi riêng (mã không phải mật khẩu: ai biết đều vào được). Nếu một bên không
  nối được (mạng chặn kết nối trực tiếp), dòng trạng thái trong *Cài đặt* sẽ báo.
  Trên điện thoại, hãy mở trang bằng Safari hoặc Chrome, không mở trong trình duyệt của Zalo / Messenger / Facebook (trò chơi tự nhận ra
  và nhắc). Nếu vẫn không thấy nhau, chụp dòng *Chi tiết kết nối* trong *Cài đặt* (số điểm hẹn đang mở, số lần bắt tay nối được / hỏng,
  lỗi gần nhất): nó cho biết hỏng ở bước tìm nhau hay ở bước kết nối trực tiếp.
  Lời gõ (Enter hoặc nút *Nói*) hiện cho mọi người cùng phòng; có lọc từ thô, chặn câu có địa chỉ web hoặc dãy số dài, nút *Ẩn người này*
  và công tắc *Tắt mọi bong bóng chat*.
- Không thêm quảng cáo, đếm lượt truy cập hay đăng nhập: những thứ đó nằm ngoài quy tắc của dự án.
