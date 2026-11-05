// =====================================================================
//  KHỞI ĐỘNG: dựng cảnh → hiệu ứng → nhân vật → âm thanh → khách AI → hoạt động
//  Mỗi phần chạy trong try/catch: một phần lỗi không làm hỏng cả trò chơi.
// =====================================================================
{
  const steps = [
    ['cảnh', buildWorld],
    ['bố cục khu mở rộng', typeof buildWorld2 === 'function' ? buildWorld2 : null],
    ['dựng khu mở rộng', typeof buildWorld2Geo === 'function' ? buildWorld2Geo : null],
    ['nội thất chính điện', typeof buildHallArch === 'function' ? buildHallArch : null],
    ['bàn thờ chính điện', typeof buildHallAltar === 'function' ? buildHallAltar : null],
    ['điện phụ & tháp Văn Thù', typeof buildDienPhu === 'function' ? buildDienPhu : null], // trước trang trí: chừa chỗ cho cây cảnh, đèn đá
    ['trang trí sân chùa', typeof buildDecorInside === 'function' ? buildDecorInside : null],
    ['biển báo trước cổng', typeof buildGateSign === 'function' ? buildGateSign : null], // trước cảnh vật: quầy hàng tự lùi chỗ
    ['cảnh vật quanh chùa', typeof buildScenery === 'function' ? buildScenery : null],
    ['hiệu ứng', installFx],
    ['nhân vật', installPlayer],
    ['âm thanh', typeof installAudio === 'function' ? installAudio : null],
    ['nhạc nền', typeof installMusic === 'function' ? installMusic : null],
    ['khách AI', typeof installCrowd === 'function' ? installCrowd : null],
    ['hoạt động 1–3', typeof installActivitiesA === 'function' ? installActivitiesA : null],
    ['hoạt động 4–5', typeof installActivitiesB === 'function' ? installActivitiesB : null],
    ['hoạt động khu mở rộng', typeof installActivitiesC === 'function' ? installActivitiesC : null],
  ];
  for (const [name, fn] of steps) {
    if (!fn) continue;
    try { fn(G); } catch (e) { console.error('[khởi động]', name, e); G.errors.push(name + ': ' + (e && e.message)); }
  }
  G.start();
}
