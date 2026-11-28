# Lên Chùa Cầu An

Trò chơi 3D thư giãn chạy ngay trong trình duyệt: dạo quanh một ngôi chùa Việt, thắp hương, thỉnh chuông,
gõ mõ tụng kinh, ngồi thiền trên bồ đoàn, viết lời cầu an và xin một quẻ đầu năm. Có khách hành hương AI
đi lại, lễ Phật và ngồi tụng kinh cùng bạn.

**Chơi ngay:** https://itedfamily-a11y.github.io/len-chua-cau-an/

## Nguyên tắc của trò chơi

- Không đăng nhập, không quảng cáo, không thu thập dữ liệu. Tiến trình chơi lưu trong trình duyệt của bạn.
- **Đi chùa cùng mọi người — bật sẵn trên trang công khai** (bản chạy ngay trên máy thì tắt sẵn). Lần đầu vào, trò chơi báo một câu; muốn đi một mình thì tắt trong *Cài đặt* (đã tắt thì trò chơi nhớ; nút *Xoá dữ liệu trên máy* đưa công tắc về mặc định, tức bật sẵn, và nối lại ngay). Khi bật, tên bạn đặt, vị trí nhân vật và việc bạn đang làm (thắp hương,
  thỉnh chuông, ngồi tụng kinh / thiền trên bồ đoàn nào) cùng ba cử chỉ đặt sẵn (chắp tay, cúi chào, vẫy tay) được gửi thẳng tới những
  người cũng đang bật lúc đó, qua kết nối ngang hàng WebRTC giữa các trình duyệt ([Trystero](https://github.com/dmotz/trystero), dùng mạng
  Nostr để tìm nhau). Không có máy chủ của trò chơi. **Giọng nói chỉ có trong nhóm riêng** (mã nhóm từ 10 chữ hoặc số trở lên, thường qua link mời: *Cài đặt* → *Tạo mã nhóm mới* → *Gửi link mời*): micro luôn tắt cho tới khi bạn tự bấm, giọng nói đi thẳng giữa các máy như một cuộc gọi nhóm (khi hai máy không nối thẳng được thì đi qua máy chủ chuyển tiếp nếu chủ trò chơi đã khai nó, vẫn được mã hoá nên máy chủ không nghe được), trò chơi không ghi âm và không lưu; giọng nói không lọc được như chữ, người trong nhóm vẫn có thể tự ghi âm, và sau khi bạn cho phép micro họ có thể thấy thêm địa chỉ mạng nội bộ của bạn. Phòng chung không có giọng nói; trẻ em nên chơi cùng người lớn. Bạn có thể gõ một câu ngắn (tối đa 60 ký tự, một câu mỗi 2 giây) hiện thành bong
  bóng trên đầu nhân vật cho mọi người cùng phòng: trò chơi không kiểm duyệt được lời người khác, chỉ lọc từ thô (thay bằng •••), chặn câu
  có địa chỉ web hoặc dãy số dài, và cho bạn ẩn từng người hoặc tắt mọi bong bóng. Không lưu lịch sử chat xuống máy; trong lúc chơi chỉ
  giữ vài bộ đếm và một nhật ký ngắn trong bộ nhớ để gỡ lỗi, mất khi tải lại trang. Để tìm nhau, trình duyệt gọi tới vài điểm hẹn công
  cộng (8 trong 29 relay Nostr có sẵn trong Trystero, máy chủ STUN của Google và Cloudflare, và máy chủ chuyển tiếp ExpressTURN khi chủ
  trò chơi đã khai nó trong `TURN_SERVERS`: máy chủ này thấy IP của mọi người đang nối và chỉ chuyển dữ liệu đã mã hoá lúc hai máy không
  nối thẳng được, ví dụ một máy 5G với một máy Wi-Fi): chúng thấy địa chỉ mạng (IP) của bạn,
  không thấy tên hay vị trí trong chùa; người cùng phòng là người lạ và thấy IP của nhau như mọi kết nối ngang hàng. Tắt công tắc là
  ngừng ngay và đóng luôn kết nối tới relay. Mã nhóm riêng không phải mật khẩu: ai biết mã (hoặc có link mời) đều vào được và nghe được.
- Không thắng thua, không xếp hạng, không mua bán hay quyên góp.
- Tôn trọng đạo Phật: không khẳng định lời cầu nguyện chắc chắn linh nghiệm; quẻ xin chỉ mang tính giải trí.
- Toàn bộ chữ trong trò chơi là tiếng Việt có dấu.

## Kỹ thuật

- Một file `index.html` duy nhất, dựng từ các phần trong `src/` bằng `node build.js`.
- Dùng [Three.js](https://threejs.org/) r160 tải từ CDN jsDelivr (kể cả phần phụ trợ `three/addons/` cho hậu kỳ);
  không có tệp ảnh hay phông chữ ngoài. Mọi hình khối, tranh phông và biểu tượng đều vẽ bằng mã, trừ mô hình 3D do chủ chùa chọn:
  tượng Quan Âm nghìn mắt nghìn tay ở Quan Âm Các là bản quét 3D pho tượng chùa Bút Tháp
  ([Tuong Phat Ba 5K](https://sketchfab.com/3d-models/tuong-phat-ba-5k-da1a8fe064df40bf892adb03fa115e3d) của vudn54,
  giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), đã giảm số mặt, cắt phần nền, thu nhỏ ảnh bề mặt và chỉnh vật liệu),
  lưu thành hai bản trong `assets/mo-hinh/`: `quan-am-but-thap-4k.glb` (3,6 MB, máy tính) và `quan-am-but-thap.glb` (1,9 MB, điện thoại);
  game chỉ tải một bản, khi người chơi tới gần; thiếu file hoặc tải lỗi thì game dùng tượng dựng bằng mã.
  Tượng Địa Tạng Vương Bồ Tát ở Điện Địa Tạng là mô hình
  [diZangPuSa_v2022-HiPory-4K-MaterialTest](https://sketchfab.com/3d-models/dizangpusa-v2022-hipory-4k-materialtest-c65b04e74d5843b6898b2918c2969d73) của chiwei,
  giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), đã giảm số mặt, thu nhỏ ảnh bề mặt và chỉnh vật liệu,
  lưu thành `assets/mo-hinh/dia-tang-4k.glb` (4,1 MB, máy tính) và `assets/mo-hinh/dia-tang.glb` (1,1 MB, điện thoại);
  cũng chỉ tải một bản khi người chơi tới gần, lỗi thì giữ tượng dựng bằng mã.
  Cổng ba gian sang sân Tàng Kinh Các (trên tường đông sân trước) dựng từ mô hình
  [Vietnam Temple Gate](https://sketchfab.com/3d-models/vietnam-temple-gate-4fad9643769f4ff5b71ea66d7f42b8c5) của ptdtch,
  giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), đã chỉnh sửa (giảm từ 490 nghìn xuống 69 nghìn / 29 nghìn tam giác, đổi màu ngói và gỗ theo mái chùa,
  gỡ chữ trên bảng giữa để treo biển "Tàng Kinh Các"), lưu thành `assets/mo-hinh/cong-tkc.glb` (0,23 MB, máy tính) và `assets/mo-hinh/cong-tkc-nhe.glb` (0,11 MB, điện thoại);
  tải sau khi game chạy vài giây, chưa có file hoặc tải lỗi thì game hiện cổng dựng tạm bằng khối.
  Tàng Kinh Các ở sân đông (qua cổng ba gian nói trên) dựng từ mô hình
  [Procedural asian architecture test 11](https://sketchfab.com/3d-models/procedural-asian-architecture-test-11-fea52a7cf45a4f5893c872c84da501e0) của ghostnoface,
  giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), đã giản lược từ 410 nghìn xuống 63 nghìn tam giác (vách cửa và lan can thành tấm phẳng dán ảnh),
  lưu ở `assets/mo-hinh/tang-kinh-cac.glb`, tải sau khi game chạy vài giây; chưa có file hoặc tải lỗi thì game hiện bản dựng tạm bằng khối hộp.
  Quan Âm Các (toà điện hai tầng mái ở góc đông nam sân trước, cửa quay ra lối giữa sân) dựng từ mô hình
  [Procedural asian architecture test 3](https://sketchfab.com/3d-models/procedural-asian-architecture-test-3-0384ffc832f44e979770b98a6d124f64) của ghostnoface,
  giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), đã chỉnh sửa (bỏ tấm trần, mở ba gian cửa, lan can và cửa thành tấm phẳng dán ảnh, giảm từ 429 nghìn xuống 133 nghìn tam giác, thu nhỏ ảnh bề mặt),
  lưu thành `assets/mo-hinh/quan-am-cac.glb` (2,3 MB, máy tính) và `assets/mo-hinh/quan-am-cac-nhe.glb` (1,1 MB, điện thoại);
  tải một bản sau khi game chạy vài giây, chưa có file hoặc tải lỗi thì game hiện bản dựng tạm bằng khối.
  Đàn cá trong hồ sen vườn sau (hồ thả đèn hoa đăng) dùng mô hình
  [Shiny Fish](https://sketchfab.com/3d-models/shiny-fish-e0bddbcafc5e48c097b40b4bada3811a) của GenEugene,
  giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), đã giảm số mặt (407 nghìn xuống 3 000), thu nhỏ ảnh bề mặt và nắn thẳng thân để cá tự bơi,
  lưu thành `assets/mo-hinh/ca-vang.glb` (212 KB, máy tính) và `assets/mo-hinh/ca-vang-nhe.glb` (106 KB, điện thoại);
  tải một bản khi người chơi tới gần hồ, lỗi thì game dùng cá dựng bằng mã. Sóng nước, phản chiếu và vòng sóng trên hồ đều viết bằng mã.
  Đèn hoa đăng trên hồ là bông sen từ mô hình
  [Lotus Flower by Geometry Nodes](https://sketchfab.com/3d-models/lotus-flower-by-geometry-nodes-398b0f0eafe640a2a3dec98305a8e1c3) của Shiki,
  giấy phép [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) (**phi thương mại**: chỉ dùng được chừng nào trò chơi không có quảng cáo, không thu tiền, không nhận quyên góp),
  đã chỉnh sửa (giảm từ 1,23 triệu xuống 4 200 mặt, thêm màu cho cánh hoa),
  lưu thành `assets/mo-hinh/hoa-dang-sen.glb` (105 KB, máy tính) và `assets/mo-hinh/hoa-dang-sen-nhe.glb` (44 KB, điện thoại);
  tải một bản khi người chơi tới gần hồ, lỗi thì game dùng đèn dựng bằng mã.
  Lá sen, hoa sen, nụ và gương sen trong hồ lấy từ mô hình
  [Lotus](https://sketchfab.com/3d-models/lotus-a96bda0564d34674acc0431d32aad81a) của 寅虎 (yinhu),
  giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), đã chỉnh sửa (tách cụm sen thành hoa, nụ, gương, lá; giảm từ 5,2 triệu mặt xuống còn vài nghìn; dựng lại nhị và cuống),
  lưu thành `assets/mo-hinh/sen-ho.glb` (95 KB, máy tính) và `assets/mo-hinh/sen-ho-nhe.glb` (75 KB, điện thoại);
  tải một bản khi người chơi tới gần hồ, lỗi thì game dùng sen dựng bằng mã.
  Tượng Quan Âm trên đảo giữa hồ sen dựng từ mô hình
  [Tsz Shan Monastery - Guan Yin Statue](https://sketchfab.com/3d-models/tsz-shan-monastery-guan-yin-statue-b9d823667b1e4bfb9b68e124ba4e28d9) của Patrick Kin Yu YOUNG
  (dữ liệu gốc của Chính quyền Đặc khu Hồng Kông), giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/),
  đã chỉnh sửa (bỏ toà đế, gộp đỉnh cho bề mặt mịn, làm rõ nếp áo, tô bóng khe nếp vào màu đỉnh),
  lưu thành `assets/mo-hinh/quan-am-ho.glb` (670 KB, máy tính) và `assets/mo-hinh/quan-am-ho-nhe.glb` (254 KB, điện thoại);
  tải một bản khi người chơi tới gần hồ, lỗi thì game dùng tượng dựng bằng mã.
  Đàn cá chép trong hồ sen vườn sau dùng mô hình
  [Fish-4K-BakeMaterialTest](https://sketchfab.com/3d-models/fish-4k-bakematerialtest-632d5b01bd914a7cbd2502acfd9127b1) của chiwei,
  giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), đã chỉnh sửa (bỏ cái đĩa, xoay thẳng thân, giảm từ 35 nghìn xuống 2 000 mặt, đổi ảnh màu gỗ thành ảnh xám để game tự tô màu cá chép từng con),
  lưu thành `assets/mo-hinh/ca-chep.glb` (138 KB, máy tính) và `assets/mo-hinh/ca-chep-nhe.glb` (52 KB, điện thoại);
  tải một bản khi người chơi tới gần hồ, lỗi thì game dùng cá dựng bằng mã.
  Đèn đá trong vườn sau (dọc lối đi quanh hồ và trên đảo) lấy từ mô hình
  [Japanese stone lanterns](https://sketchfab.com/3d-models/japanese-stone-lanterns-bc153f0de79442289c449141834703c0) của patrakeevasveta,
  giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), đã chỉnh sửa (lấy ba trong năm kiểu đèn, giảm số mặt, thu nhỏ ảnh bề mặt, chỉ giữ ảnh màu và ảnh ô cửa sáng),
  lưu thành `assets/mo-hinh/den-da.glb` (754 KB, máy tính) và `assets/mo-hinh/den-da-nhe.glb` (232 KB, điện thoại);
  tải một bản khi người chơi tới gần hồ, lỗi thì game dùng đèn dựng bằng mã. Đom đóm và sương mờ trên hồ viết bằng mã.
  Cây sồi và cây thông trong cảnh (cây quanh tường, cây đa đầu lối vào, cây bồ đề ở vườn sau, tùng, cây trong chậu) lấy từ hai mô hình
  [Oak trees pack (17var, LODs, seasons, gameready)](https://sketchfab.com/3d-models/oak-trees-pack-17var-lods-seasons-gameready-a5e4e64f9f1d4089bdcc6170a9333393) của LOLIPOP và
  [Pine Forest at Sunset](https://sketchfab.com/3d-models/pine-forest-at-sunset-bef89be6b189456095db79107045d726) của Jagobo,
  đều theo giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), đã chỉnh sửa (chọn 9 dáng sồi, tách 5 cây thông khỏi cảnh rừng, bỏ nhánh nhỏ, giảm số mặt, thu nhỏ ảnh bề mặt),
  lưu thành `assets/mo-hinh/cay-soi.glb` (1,8 MB) và `assets/mo-hinh/cay-thong.glb` (0,8 MB) cho máy tính, `cay-soi-nhe.glb` (0,9 MB) và `cay-thong-nhe.glb` (0,3 MB) cho điện thoại;
  game tải một cặp sau khi chạy vài giây (máy bật tiết kiệm dữ liệu thì không tải); chưa có file hoặc tải lỗi thì game giữ cây dựng bằng mã.
  Cau, dừa, chuối, tre, hoa đại, mai, quất, phượng và bụi hoa vẫn dựng bằng mã.
- Nhân vật người chơi chọn được ở màn chào và trong *Cài đặt* (10 nhân vật): hai mô hình
  [AI Generated - Ancient Chinese Scholar](https://sketchfab.com/3d-models/ai-generated-ancient-chinese-scholar-a75bd588c991496f96f05ef92a23d910) của OGL (GaryLim) và
  [Chinese dress with irregular hemline](https://sketchfab.com/3d-models/chinese-dress-with-irregular-hemline-9b53c1ae37a84c90ac6d112511fecaa6) của Style3D Meta,
  đều theo giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), đã chỉnh sửa (giảm từ 1,48 triệu và 256 nghìn mặt xuống khoảng 25 nghìn, bỏ phần khuất,
  vẽ lại thành một ảnh bề mặt 2048 px, gắn 12 xương để nhân vật đi, chắp tay, lạy, ngồi; thêm các màu áo bằng chương trình tô),
  lưu thành `assets/nhan-vat/thu-sinh.glb` (0,6 MB) và `assets/nhan-vat/thieu-nu.glb` (0,5 MB), ảnh nhỏ từng nhân vật ở `assets/nhan-vat/anh/`;
  file gốc không có xương và hoạt ảnh nên mọi cử động do game tính; chưa tải được mô hình thì game dùng nhân vật hoạt hình áo lam dựng bằng mã (vẫn là một lựa chọn trong danh sách).
  Khách hành hương AI cũng vẽ bằng hai mô hình này: bản nhẹ `thu-sinh-nhe.glb` và `thieu-nu-nhe.glb` (khoảng 7 nghìn mặt, 0,2 MB mỗi file), mỗi khách một thân,
  màu áo nhuộm theo màu áo của từng khách; máy bật tiết kiệm dữ liệu, máy yếu (tụt khung hình) hoặc tải lỗi thì khách giữ dáng hoạt hình cũ.
  Thêm tám mô hình người nữa, đều giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), đã chỉnh sửa cùng cách (giảm số mặt, bỏ phần khuất, vẽ lại ảnh bề mặt, gắn xương):
  [Female Older People](https://sketchfab.com/3d-models/female-older-people-e11baf74d2fb4ec7938c415c02c53c08) và
  [Male Older People](https://sketchfab.com/3d-models/male-older-people-e9affff312624b7fbb53ba89cf16e1f5) của Ob1to (cụ bà, cụ ông; mẫu cụ ông đã bỏ cây gậy),
  [A-Pose - Male Full Body 3D Scan](https://sketchfab.com/3d-models/a-pose-male-full-body-3d-scan-78c2d136f91c46a8a696d5bacfde2daf) của OverseerThuror (chàng trai áo nỉ),
  [Dreamy Starry Night sleeveless dress](https://sketchfab.com/3d-models/dreamy-starry-night-sleeveless-dress-f456aec7c1644681be3f71047b96676e) và
  [Red and black plaid Christmas suit](https://sketchfab.com/3d-models/red-and-black-plaid-christmas-suit-13ab49e2d1d2416ba84497cdaf08c44d) của Style3D Meta,
  [Ao Dai Hoa Van](https://sketchfab.com/3d-models/ao-dai-hoa-van-f292f0c690544f77af145ca74f9ca2b4) của Dung.Anh.Trieu,
  [Women's oversize raincoat](https://sketchfab.com/3d-models/womens-oversize-raincoat-a94ea598baeb46ec88626cf08725f2a5) của Ahmad Riazi,
  [Buddhist monk in orange robes](https://sketchfab.com/3d-models/buddhist-monk-in-orange-robes-579b84eaed8e42f4ba08d1be6100d8f3) của restore50.
  Bốn mẫu đầu (cụ bà, cụ ông, chàng trai, thiếu nữ đầm sao) cử động tay được nên người chơi cũng chọn được (`cu-ba.glb`, `cu-ong.glb`, `chang-trai.glb`, `dam-sao.glb`);
  bốn mẫu sau có tay dính vào thân trong mô hình nên chỉ dùng cho khách AI (đi lại, cúi lạy, ngồi; tay đứng yên), mẫu sư chỉ ngồi tụng kinh / thiền trong chính điện.
  Mỗi mẫu có một bản nhẹ `*-nhe.glb` (0,13 đến 0,35 MB) cho khách AI, tải dần sau hai mẫu gốc.
- Hậu kỳ trong chính điện: khử răng cưa MSAA, GTAO, bloom, đường cong màu mềm; tự hạ mức trên máy yếu
  hoặc khi trình duyệt không hỗ trợ, và vẫn chạy ở chế độ vẽ thường nếu phần phụ trợ không tải được.
- Yêu cầu trình duyệt: Chrome / Edge 89+, Safari 16.4+, Firefox 108+ (cần import map và WebGL2).
- Chế độ đi chùa chung dùng [Trystero](https://github.com/dmotz/trystero) 0.26.0 (MIT) tải từ jsDelivr khi công tắc đang bật (bật sẵn trên trang
  công khai, nên mỗi người vào chùa tải thêm khoảng 70 kB trừ khi đã tắt; bản chạy ngay trên máy tắt sẵn);
  đây là một trong hai ngoại lệ của luật "không tài sản ngoài" (ngoại lệ kia là các file mô hình 3D trong thư mục `assets/`). Cần trang chạy qua https (GitHub Pages có sẵn) hoặc localhost. Hai người sau
  mạng khắt khe (NAT đối xứng, thường gặp ở 4G/5G) chỉ nối được qua máy chủ chuyển tiếp TURN, khai trong `TURN_SERVERS`
  (`src/22-di-chua-chung.js`, cách khai ở `HUONG-DAN-CONG-KHAI.md`); khi danh sách còn trống họ có thể không nối được với nhau. Dữ liệu qua
  máy chủ chuyển tiếp vẫn mã hoá; máy chủ đó thấy IP của mọi người đang nối. Dòng "Chi tiết kết nối" trong *Cài đặt* cho biết có bao nhiêu
  người nối qua máy chủ chuyển tiếp. Hai người thường
  thấy nhau sau vài giây, có lúc tới nửa phút. Giọng nói dùng chính phần media của Trystero (WebRTC) và Web Audio của trình duyệt, không thêm thư viện nào; trình duyệt chỉ cho dùng micro ở trang https hoặc localhost, và trong trình duyệt của Zalo / Messenger / Facebook thì chưa dùng được micro. Khi hai máy không nối thẳng được, giọng nói đi qua cùng máy chủ chuyển tiếp TURN như dữ liệu, nhưng chỉ khi chủ trò chơi đã khai `TURN_SERVERS` (vẫn mã hoá đầu-cuối, máy chủ không nghe được); chưa khai thì hai máy như vậy không nghe được nhau.

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
