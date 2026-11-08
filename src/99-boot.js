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
    ['trang trí sân chùa', typeof buildDecorInside === 'function' ? buildDecorInside : null],
    ['biển báo trước cổng', typeof buildGateSign === 'function' ? buildGateSign : null], // trước cảnh vật: quầy hàng tự lùi chỗ
    ['cảnh vật quanh chùa', typeof buildScenery === 'function' ? buildScenery : null],
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
    ['đi chùa chung', typeof installDiChuaChung === 'function' ? installDiChuaChung : null], // 22: nhiều người cùng dạo chùa qua kết nối ngang hàng (Trystero), tắt mặc định; chạy sau mọi hoạt động để đọc G.world.seats, G.crowd.seats
  ];
  for (const [name, fn] of steps) {
    if (!fn) continue;
    try { fn(G); } catch (e) { console.error('[khởi động]', name, e); G.errors.push(name + ': ' + (e && e.message)); }
  }
  G.start();
}
