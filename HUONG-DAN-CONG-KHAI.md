# Hướng dẫn đưa "Lên Chùa Cầu An" lên mạng

Trò chơi là **một file tĩnh** `index.html` (cộng thư mục `assets/` nếu sau này dùng mô hình ngoài).
Không cần máy chủ, không cơ sở dữ liệu, không đăng nhập. Người chơi chỉ cần trình duyệt mới và kết nối mạng
(Three.js và phần phụ trợ hậu kỳ `three/addons/` tải từ CDN jsDelivr; nếu phần phụ trợ không tải được, trò chơi vẫn chạy ở chế độ vẽ thường). Trò chơi không thu thập dữ liệu; tiến trình chơi lưu trong localStorage của trình duyệt người chơi, không gửi đi đâu.
Chế độ **Đi chùa cùng mọi người** (bật sẵn trên trang công khai từ 2026-11-09, ai tự tắt thì giữ tắt; bản chạy ngay trên máy tắt sẵn) nối thẳng các trình duyệt với nhau bằng WebRTC qua
thư viện Trystero (tải từ jsDelivr khi công tắc bật, tức khoảng 70 kB cho mỗi người vào trang công khai trừ người đã tắt; dùng mạng Nostr công cộng để tìm nhau;
khi hai bên không nối thẳng được, ví dụ một máy 5G với một máy Wi-Fi, thì đi qua máy chủ chuyển tiếp TURN nếu bạn đã khai nó trong `TURN_SERVERS` ở
`src/22-di-chua-chung.js`, xem mục *Khai máy chủ chuyển tiếp ExpressTURN* bên dưới) — vẫn không cần máy chủ riêng, nhưng trang phải chạy qua **https** (GitHub Pages / Netlify /
Cloudflare đều có sẵn) hoặc localhost; mở thẳng tệp `index.html` bằng `file://` thì phần này có thể không hoạt động.
Trong **nhóm riêng** (mã nhóm từ 10 chữ hoặc số, thường tạo bằng *Tạo mã nhóm mới* rồi gửi bằng link mời) còn có **giọng nói** như gọi nhóm: micro luôn tắt cho tới khi người chơi tự bấm; giọng nói đi thẳng giữa các trình duyệt (khi hai bên không nối thẳng được thì đi qua cùng máy chủ chuyển tiếp TURN như dữ liệu, nếu bạn đã khai `TURN_SERVERS`; vẫn mã hoá đầu-cuối); trang và trò chơi không ghi âm, không lưu, và không máy chủ nào nghe được giọng nói. Trình duyệt chỉ cho dùng micro ở trang **https** hoặc localhost (GitHub Pages có sẵn https). Phòng chung (không mã) không có giọng nói.

## Danh sách kiểm trước khi công khai

- [ ] `node build.js` chạy xong, không lỗi; `git status` sạch (đã commit).
- [ ] Mở thử bản dựng trên máy tính **và điện thoại thật**: vào cổng, chính điện, ngồi tụng kinh; âm thanh bật sau khi bấm *Vào chùa*.
- [ ] Nếu có mô hình GLB / ảnh texture: thư mục `assets/mo-hinh/` phải đi kèm `index.html` (từ 2026-11-27: `assets/mo-hinh/quan-am-but-thap-4k.glb` và `assets/mo-hinh/quan-am-but-thap.glb`, hai cỡ của bản quét tượng Quan Âm; thiếu file thì game vẫn chạy với tượng dựng bằng mã; `assets/mo-hinh/quan-am-cac.glb` và `assets/mo-hinh/quan-am-cac-nhe.glb`, hai cỡ của toà Quan Âm Các ở sân trước; thiếu file thì game hiện bản dựng tạm bằng khối; `assets/mo-hinh/dia-tang-4k.glb` và `assets/mo-hinh/dia-tang.glb`, hai cỡ của tượng Địa Tạng ở Điện Địa Tạng; thiếu file thì game vẫn chạy với tượng dựng bằng mã; và `assets/mo-hinh/tang-kinh-cac.glb`, toà Tàng Kinh Các ở sân đông; thiếu file thì game hiện bản dựng tạm bằng khối hộp; và `assets/mo-hinh/ca-vang.glb`, `assets/mo-hinh/ca-vang-nhe.glb`, hai cỡ của mô hình cá trong hồ sen vườn sau; thiếu file thì game hiện cá dựng bằng mã; và `assets/mo-hinh/cay-soi.glb`, `assets/mo-hinh/cay-thong.glb`, `assets/mo-hinh/cay-soi-nhe.glb`, `assets/mo-hinh/cay-thong-nhe.glb`, cây sồi và cây thông trong cảnh, hai cỡ; thiếu file thì game giữ cây dựng bằng mã).
- [ ] Trình duyệt tối thiểu của người chơi: Chrome 89+, Edge 89+, Safari 16.4+, Firefox 108+ (cần *import map* và WebGL2).
- [ ] Dung lượng tải một lần: khoảng 3,8 MB (nén còn khoảng 2,4 MB), cộng khoảng 70 kB thư viện Trystero cho mỗi người vào trang công khai trừ người đã tắt *Đi chùa cùng mọi người*. File mô hình tượng Quan Âm (3,6 MB trên máy tính, 1,9 MB trên điện thoại) chỉ tải khi người chơi tới gần Quan Âm Các. File mô hình toà Quan Âm Các (2,3 MB trên máy tính, 1,1 MB trên điện thoại) tải sau khi game chạy vài giây; máy bật *tiết kiệm dữ liệu* thì lấy bản nhẹ và chỉ tải khi người chơi đã qua cổng. File mô hình Tàng Kinh Các (khoảng 0,93 MB) tải sau khi game chạy vài giây; máy bật *tiết kiệm dữ liệu* thì chỉ tải khi người chơi tới gần sân đông. Hai file mô hình cây (sồi + thông: khoảng 2,6 MB trên máy tính, 1,2 MB trên điện thoại) tải sau khi game chạy vài giây; máy bật *tiết kiệm dữ liệu* thì không tải, game giữ cây dựng bằng mã.
- [ ] Muốn điện thoại 4G/5G và máy ở Wi-Fi thấy nhau: đã khai `TURN_SERVERS` (mục *Khai máy chủ chuyển tiếp ExpressTURN* bên dưới).

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

## Khai máy chủ chuyển tiếp ExpressTURN (để 4G/5G và Wi-Fi thấy nhau)

Hai người sau mạng khắt khe (điện thoại 4G/5G với máy ở Wi-Fi là trường hợp hay gặp) thường không nối thẳng được; khi đó dữ liệu phải đi qua một máy chủ chuyển tiếp (TURN).
Trò chơi đã có chỗ khai sẵn: dòng `const TURN_SERVERS = [];` trong `src/22-di-chua-chung.js` (đang để trống nên chỉ dùng STUN).

1. Mở bảng điều khiển ExpressTURN (tài khoản miễn phí; theo trang ExpressTURN lúc 2026-11-09 là 1000 GB mỗi tháng) và lấy `username` và `credential` của TURN. **Không** dùng mật khẩu tài khoản.
2. Chép đúng các địa chỉ (URL) mà trang đó liệt kê. Nhớ có một địa chỉ TCP (và một địa chỉ TLS / cổng 443 nếu có), vì nhiều mạng chặn UDP cổng 3478.
3. Sửa dòng đó, vẫn trên **một dòng** (không xuống dòng, không dấu chấm phẩy trong dấu ngoặc vuông), ví dụ (thay `MÁY-CHỦ`, `TÊN`, `MÃ` bằng giá trị thật):

   ```js
   const TURN_SERVERS = [{ urls: ['turn:MÁY-CHỦ:3478?transport=udp', 'turn:MÁY-CHỦ:3478?transport=tcp'], username: 'TÊN', credential: 'MÃ' }];
   ```

4. `node build.js`, thử trên máy, commit, `git push`.

Cần biết: `username` và `credential` nằm công khai trong mã trang (ai cũng đọc được; với loại dịch vụ này là bình thường), nên hãy theo dõi hạn mức trên bảng điều khiển và đổi mã nếu bị lạm dụng. Máy chủ chuyển tiếp thấy địa chỉ IP của mọi người chơi đang nối khi danh sách đã khai, và chỉ chuyển dữ liệu (đã mã hoá) lúc hai máy không nối thẳng được. Khai sai (thiếu `username` / `credential`, địa chỉ hỏng) thì trò chơi bỏ cả danh sách, ghi lý do vào dòng *Chi tiết kết nối* trong *Cài đặt* và vẫn chạy như khi để trống. Khi đã khai, các dòng về quyền riêng tư trong *Cài đặt* tự nhắc tới máy chủ chuyển tiếp.

## Sau khi lên mạng

- Mở địa chỉ trên điện thoại và máy tính, chơi thử một vòng; nếu máy yếu, trò chơi tự hạ chất lượng.
- Chia sẻ địa chỉ cho mọi người. Trò chơi không thu thập dữ liệu; thứ trình duyệt tải từ bên ngoài là thư viện Three.js trên jsDelivr,
  và, trừ khi người chơi đã tắt *Đi chùa cùng mọi người* trong *Cài đặt* (trang công khai bật sẵn), thêm thư viện Trystero (cũng trên jsDelivr, khoảng 70 kB).
  Nếu bạn đã khai máy chủ chuyển tiếp ExpressTURN, dữ liệu của hai máy không nối thẳng được còn đi qua máy chủ đó.
- Muốn thử đi chùa chung: hai người (hoặc hai trình duyệt trên hai máy) cùng mở trang công khai (công tắc *Đi chùa cùng mọi người* bật sẵn; trên bản chạy ngay trên máy,
  hoặc khi ai đó đã tắt, thì cùng bật công tắc trong *Cài đặt*); thường vài giây,
  có lúc tới nửa phút, sẽ thấy nhau. Nhập cùng một mã nhóm để đi riêng (mã không phải mật khẩu: ai biết đều vào được). Nếu một bên không
  nối được (mạng chặn kết nối trực tiếp), dòng trạng thái trong *Cài đặt* sẽ báo; khi đó hãy khai máy chủ chuyển tiếp ở mục *Khai máy chủ chuyển tiếp ExpressTURN* ở trên.
  Trên điện thoại, hãy mở trang bằng Safari hoặc Chrome, không mở trong trình duyệt của Zalo / Messenger / Facebook (trò chơi tự nhận ra
  và nhắc). Nếu vẫn không thấy nhau, chụp dòng *Chi tiết kết nối* trong *Cài đặt* (số điểm hẹn đang mở, số lần bắt tay nối được / hỏng,
  lỗi gần nhất): nó cho biết hỏng ở bước tìm nhau hay ở bước kết nối trực tiếp.
  Lời gõ (Enter hoặc nút *Nói*) hiện cho mọi người cùng phòng; có lọc từ thô, chặn câu có địa chỉ web hoặc dãy số dài, nút *Ẩn người này*
  và công tắc *Tắt mọi bong bóng chat*.
  Giọng nói trong nhóm riêng: *Cài đặt* → *Tạo mã nhóm mới* → *Gửi link mời* (gửi qua Zalo hoặc Messenger; người nhận mở bằng Safari hoặc Chrome, không mở trong trình duyệt của ứng dụng chat), vào nhóm xong bấm nút *Micro* (hoặc phím V) và cho phép micro. Vì đi chùa chung bật sẵn trên trang công khai, khi mở một link mời hợp lệ trò chơi chưa vào phòng chung: bảng *Lời mời vào nhóm* hiện ra trước ("Vào nhóm" vào đúng nhóm đó; "Để sau" giữ thiết lập đã lưu của bạn, mặc định là vào phòng chung; người chưa từng chọn công tắc vẫn nhận câu báo một lần sau khi trả lời). Trên bản chạy ngay trên máy, đi chùa chung tắt sẵn nên phải bật công tắc trước. Ai có link mời đều vào nhóm và nghe được; lời nói không được lọc như chữ, người trong nhóm có thể tự ghi âm, và sau khi cho phép micro họ có thể thấy thêm địa chỉ mạng nội bộ (trong nhà) của bạn, nên chỉ nói chuyện với người mình tin; trẻ em nên chơi cùng người lớn; nhóm dùng tốt nhất khi có tối đa 8 người. Hai người ở sau mạng khắt khe (ví dụ một máy 4G với một máy Wi-Fi) nghe nhau qua máy chủ chuyển tiếp TURN như dữ liệu, nhưng chỉ khi bạn đã khai `TURN_SERVERS` (tài khoản ExpressTURN miễn phí; theo trang ExpressTURN lúc 2026-11-09 là 1000 GB mỗi tháng; một luồng giọng nói khoảng 44 kbps, tức khoảng 20 MB mỗi giờ); chưa khai máy chủ đó, hoặc mạng chặn cổng 3478, thì hai người như vậy không nghe được nhau, giống như dữ liệu. Trước khi báo cho mọi người, hãy thử bằng một iPhone và một điện thoại Android theo danh sách trong mục 6.3 của `docs/superpowers/specs/2026-11-09-giong-noi-nhom-design.md`.
- Không thêm quảng cáo, đếm lượt truy cập hay đăng nhập: những thứ đó nằm ngoài quy tắc của dự án.
