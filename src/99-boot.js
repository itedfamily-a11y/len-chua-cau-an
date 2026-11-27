// =====================================================================
//  KHỞI ĐỘNG: dựng cảnh → hiệu ứng → nhân vật → âm thanh → khách AI → hoạt động
//  Mỗi phần chạy trong try/catch: một phần lỗi không làm hỏng cả trò chơi.
// =====================================================================
{
  const steps = [
    ['cảnh', buildWorld],
    ['bố cục khu mở rộng', typeof buildWorld2 === 'function' ? buildWorld2 : null],
    ['dựng khu mở rộng', typeof buildWorld2Geo === 'function' ? buildWorld2Geo : null],
    ['chính điện', typeof buildChinhDien === 'function' ? buildChinhDien : null], // thay buildHallArch (15) + buildHallAltar (16): hai file cũ còn trong repo nhưng không gọi nữa
    ['trang trí cung đình', typeof buildCungDinh === 'function' ? buildCungDinh : null], // sau chính điện (18), trước điện phụ / trang trí sân: sư tử, hoa biểu, vạc, hạc, nhật quỹ, cửa chính, kìm nóc
    ['điện phụ & tháp Văn Thù', typeof buildDienPhu === 'function' ? buildDienPhu : null], // trước trang trí: chừa chỗ cho cây cảnh, đèn đá
    ['tượng Quan Âm (bản quét 3D)', typeof installQuanAmQuet === 'function' ? installQuanAmQuet : null], // 17-quan-am-quet.js: sau điện phụ (tượng dựng bằng mã đã đặt lên bệ); tải file mô hình khi người chơi tới gần, lỗi thì giữ tượng cũ
    ['tượng Địa Tạng (mô hình 3D)', typeof installDiaTangQuet === 'function' ? installDiaTangQuet : null], // 17-dia-tang-quet.js: sau điện phụ (tượng dựng bằng mã ở W.ext.diaTang); tải file mô hình khi người chơi tới gần, lỗi thì giữ tượng cũ
    ['vườn sau chùa', typeof buildVuonSau === 'function' ? buildVuonSau : null], // 19-vuon-sau.js: vườn sau chính điện (tường, hai cổng nách, hồ sen, thủy tạ, cây, đèn đá); phải đứng trước 12 và 13 vì hai nơi này đọc nút / chỗ đứng / vật cản lúc dựng, và trước 07-fx (quầng sáng, đom đóm)
    ['mặt nước hồ sen & đàn cá', typeof installNuocCa === 'function' ? installNuocCa : null], // 19-nuoc-ca.js: sau vườn sau chùa (đọc mặt nước và hình hồ của G.vuonSau): sóng lăn tăn, phản chiếu trời, vòng sóng, quầng đèn hoa đăng, cá bơi (mô hình tải sau, lỗi thì giữ cá dựng bằng mã)
    ['Tàng Kinh Các (sân đông)', typeof buildTangKinhCac === 'function' ? buildTangKinhCac : null], // 19-tang-kinh-cac.js: sân mới ngoài tường đông, cổng nách, lầu hai tầng (mô hình tải sau); trước 12 và 13 vì hai nơi này đọc vật cản, nút dẫn đường, vùng chừa lúc dựng
    ['trang trí sân chùa', typeof buildDecorInside === 'function' ? buildDecorInside : null],
    ['biển báo trước cổng', typeof buildGateSign === 'function' ? buildGateSign : null], // trước cảnh vật: quầy hàng tự lùi chỗ
    ['cảnh vật quanh chùa', typeof buildScenery === 'function' ? buildScenery : null],
    ['cây mô hình 3D (sồi, thông)', typeof installCayMoHinh === 'function' ? installCayMoHinh : null], // 13-cay-mo-hinh.js: sau mọi nơi dựng cây (05, 09, 12, 13, 19): các nơi ấy đã ghi chỗ đứng từng cây vào G.cayDat; tải hai file mô hình sau khi game chạy, lỗi thì giữ cây dựng bằng mã
    ['hiệu ứng', installFx],
    ['hậu kỳ', typeof installHauKy === 'function' ? installHauKy : null], // 07-hau-ky.js: bloom / AO / MSAA / chỉnh màu phim, chỉ chạy trong chính điện (G.post); tải addon three/addons không đồng bộ, lỗi thì vẽ thẳng như cũ
    ['nhân vật', installPlayer],
    ['âm thanh', typeof installAudio === 'function' ? installAudio : null],
    ['nhạc nền', typeof installMusic === 'function' ? installMusic : null],
    ['văn kinh', typeof installKinhVan === 'function' ? installKinhVan : null], // 21: dữ liệu kinh, chú, kệ Hán-Việt (G.kinh) — trước khách AI (bong bóng tụng) và hoạt động tụng kinh
    ['khách AI', typeof installCrowd === 'function' ? installCrowd : null],
    ['hoạt động 1–3', typeof installActivitiesA === 'function' ? installActivitiesA : null],
    ['hoạt động 4–5', typeof installActivitiesB === 'function' ? installActivitiesB : null],
    ['ngồi bồ đoàn, tụng kinh, thiền', typeof installNgoiTungKinh === 'function' ? installNgoiTungKinh : null], // 45: ngồi lên bồ đoàn trống trong chính điện (E / nút chạm), tụng kinh theo bài, ngồi thiền
    ['hoạt động khu mở rộng', typeof installActivitiesC === 'function' ? installActivitiesC : null],
    ['đi chùa chung', typeof installDiChuaChung === 'function' ? installDiChuaChung : null], // 22: nhiều người cùng dạo chùa qua kết nối ngang hàng (Trystero), bật mặc định từ 2026-11-09 (ai tự tắt thì giữ tắt); chạy sau mọi hoạt động để đọc G.world.seats, G.crowd.seats
    ['lời mời vào nhóm', typeof installLoiMoi === 'function' ? installLoiMoi : null], // 23: mã nhóm ngẫu nhiên, link mời, bảng "Lời mời vào nhóm"
    ['giọng nói trong nhóm', typeof installGiongNoi === 'function' ? installGiongNoi : null], // 24: micro, gửi/nhận giọng nói trong nhóm riêng (không có chữ hiển thị)
    ['giao diện giọng nói', typeof installGiongNoiUI === 'function' ? installGiongNoiUI : null], // 25: nút micro, công tắc, nhãn người nói, câu báo
  ];
  for (const [name, fn] of steps) {
    if (!fn) continue;
    try { fn(G); } catch (e) { console.error('[khởi động]', name, e); G.errors.push(name + ': ' + (e && e.message)); }
  }
  G.start();
}
