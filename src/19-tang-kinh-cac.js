// =====================================================================
//  TÀNG KINH CÁC — LẦU HAI TẦNG Ở SÂN ĐÔNG (2026-11-27)
//  Chủ chùa đưa một mô hình 3D và nhờ dựng vào chỗ thích hợp, không có chỗ thì mở rộng. Toà lầu chiếm 28,5 × 31 m (kể cả sáu bậc thềm),
//  trong khuôn viên không còn khoảng trống cỡ ấy nên mở thêm một sân có tường bao ở phía đông, sát tường bao sân trước,
//  vào bằng một cổng nách mới trên tường đông (z 9…13).
//  Mô hình gốc: "Procedural asian architecture test 11" của ghostnoface trên Sketchfab, giấy phép CC BY 4.0
//  (https://sketchfab.com/3d-models/procedural-asian-architecture-test-11-fea52a7cf45a4f5893c872c84da501e0).
//  File trong game (assets/mo-hinh/tang-kinh-cac.glb, ~930 KB) đã giản lược: 410 nghìn → 63 nghìn tam giác; vách cửa, cửa sổ, lan can thành tấm phẳng dán ảnh;
//  cột thành khối tám cạnh; bỏ đầu ngói li ti ở diềm mái. Tỉ lệ 1:1, mặt chính quay về +z (như mọi toà trong chùa), không xoay.
//  - Số liệu bố cục: TKC_SITE (khai báo ở đầu file để 05-world.js và 13-scenery.js cùng đọc: cổng trên tường đông, vùng chừa, vùng đất phẳng).
//  - Nền, bậc, lan can, vách, cột, cửa, sàn tầng hai lấy từ chính mô hình, viết thẳng thành số ở dưới (toạ độ gốc của mô hình; +ox, +oz ra thế giới).
//  - Đi được (cùng ngày, chủ chùa hỏi "không lên được tầng 2 à, không vào trong được à"): sân, sáu bậc thềm, mặt nền, TRONG NHÀ (15 cửa đều mở,
//    cánh mở vuông góc vào trong) và TẦNG HAI qua cầu thang ngoài ở góc tây nam (hai vế, chiếu nghỉ, đầu thang nối sang ban công phía đông).
//    Một gian vách tầng hai (z 7,78; x −7,5…−4,5) được bỏ để ban công đầu thang thông sang hành lang tây, ban công trước và gian trước tầng hai.
//    Ba cửa tầng hai mở ra mép sàn không có lan can (trên mái hiên) thì nhìn thấy mở nhưng không đi qua được.
//  - HAI TẦNG: G.heightAt chỉ nhận (x, z) nên mô-đun này tự nhớ người chơi đang ở tầng nào (V.level). Tầng chỉ đổi khi đi qua cầu thang
//    (vùng cầu thang có một độ cao duy nhất tại mỗi điểm). Vật cản chia ba nhóm: chung (cầu thang), tầng một, tầng hai; đổi tầng thì đổi nhóm trong G.collide.list.
//    G.heightAt trả độ cao tầng hai chỉ cho điểm sát người chơi; G.heightAtY(x, z, y) chọn tầng theo độ cao y (22-di-chua-chung.js dùng cho người chơi khác).
//  - Mô hình tải sau khi game chạy vài giây (máy bật "tiết kiệm dữ liệu": chỉ tải khi tới gần). Chưa tải xong / tải lỗi (mở bằng file://, mất mạng):
//    hiện bản dựng tạm bằng khối hộp; khi ấy cửa và chân cầu thang bị chặn (bản tạm là khối đặc), sân và mặt nền vẫn đi được.
//  - Trạng thái: W.tangKinhCac = { site, state: 'idle' | 'loading' | 'ready' | 'failed', error, tris, credit, level, paved, inside(x,z), show(bool) }.
// =====================================================================
const TKC_SITE = {
  ox: 62.5, oz: -6.5,                                   // gốc mô hình đặt ở đây (bậc chính ở x 62,5, chân bậc z 11,5)
  court: { x0: 36.6, x1: 82.0, z0: -31.0, z1: 23.0 },   // lòng sân (mép tây = mặt ngoài tường đông của sân chùa)
  wallX: 82.3, wallZN: -31.3, wallZS: 23.3,             // tim ba bức tường mới (đông, bắc, nam)
  gate: { z0: 9.0, z1: 13.0 },                          // khoảng trống trên tường đông x 36,3 (giữa hai cột tường z 8 và z 14)
  keep: { x0: 36.6, x1: 84.6, z0: -33.6, z1: 25.6 },    // vùng cảnh vật ngoài tường phải chừa (sân + tường + 2 m)
  flatX: 62,                                            // địa hình phẳng tới x = flatX + 25 ở phía đông (phía tây vẫn 32 + 25)
  url: 'assets/mo-hinh/tang-kinh-cac.glb',
};
function buildTangKinhCac(G) {
  const { THREE, util: U, scene } = G;
  const GB = G.build, W = G.world, col = G.collide;
  if (!GB || !W || !G.mats || !G.cam || !G.nav) return;
  const { C, box, boxMM, addSign, glow } = GB;
  const PI = Math.PI, T = TKC_SITE, CT = T.court, OX = T.ox, OZ = T.oz;
  const safe = (name, fn) => { try { fn(); } catch (e) { console.error('[Tàng Kinh Các]', name, e); G.errors.push('Tàng Kinh Các/' + name + ': ' + (e && e.message)); } };
  const CREDIT = {
    text: 'Toà lầu dựng từ mô hình "Procedural asian architecture test 11" của ghostnoface trên Sketchfab, giấy phép CC BY 4.0, đã giảm chi tiết cho vừa trò chơi.',
    href: 'https://sketchfab.com/3d-models/procedural-asian-architecture-test-11-fea52a7cf45a4f5893c872c84da501e0',
  };

  // ---------- Số đo lấy từ mô hình (toạ độ gốc của mô hình, mét) ----------
  const TOP = 1.0, RUN = 1.74, MID = 2.87, UP = 4.71;                                // mặt nền 1 m; bậc thềm dài 1,74 m; chiếu nghỉ 2,87; sàn tầng hai 4,71
  // mặt nền chia theo dải z: [z0, z1, x0, x1]
  const BANDS = [[-13.1, -9.95, -6.04, 3.6], [-9.95, -6.79, -12.13, 3.6], [-6.79, -3.63, -12.13, 6.14], [-3.63, -0.47, -12.64, 6.14], [-0.47, 2.69, -15.68, 6.14],
    [2.69, 5.84, -15.68, 6.64], [5.84, 6.74, -15.68, 9.18], [6.74, 11.3, -12.94, 9.18], [11.3, 16.21, -6.55, 9.18]];
  // sàn tầng hai, cùng cách chia
  const UPPER = [[-12.09, -8.98, -2.7, 2.7], [-8.98, -8.13, -7.5, 2.7], [-8.13, -7.78, -7.85, 2.7], [-7.78, -1.91, -7.85, 1.85], [-1.91, 1.21, -10.85, 1.85], [1.21, 4.32, -13.85, 1.85],
    [4.32, 4.79, -13.85, 4.85], [4.79, 5.02, -7.72, 4.85], [5.02, 8.13, -7.72, 4.85], [8.13, 10.89, -5.7, 4.85], [10.89, 15.2, -5.7, 5.7]];
  // sáu bậc thềm: [x0, x1, z0, z1, trục, chiều đi xuống]
  const STAIRS = [[-0.95, 0.95, 16.21, 17.95, 'z', 1], [9.18, 10.92, 12.44, 14.44, 'x', 1], [-10.65, -8.65, 11.3, 13.04, 'z', 1],
    [-17.42, -15.68, 2.11, 4.11, 'x', -1], [-7.78, -6.04, -12.33, -10.33, 'x', -1], [3.75, 5.75, -8.53, -6.79, 'z', -1]];
  // cầu thang lên tầng hai: vế một đi về +x (z 7,92…9,08), chiếu nghỉ, vế hai đi về −z (x −8,68…−7,47), chiếu trên nối sang ban công ở phía đông
  const ST = { x0: -10.68, xm: -8.68, x1: -7.47, zt: 4.75, zf: 5.93, zm: 7.92, z1: 9.08 };
  // lan can quanh nền (tầng một): [trục, toạ độ, từ, tới]
  const RAILS = [['x', -15.4, -0.34, 1.99], ['x', -15.4, 4.23, 6.57], ['x', -12.7, 6.57, 11.05], ['x', -12.4, -3.46, -0.34], ['x', -11.9, -9.68, -3.46], ['x', -6.4, 11.05, 15.92],
    ['x', -5.9, -10.21, -9.68], ['x', -5.9, -12.79, -12.45], ['x', 3.4, -12.79, -6.57], ['x', 5.9, -6.57, 2.77], ['x', 6.4, 2.77, 5.88], ['x', 8.9, 5.88, 12.32], ['x', 8.9, 14.56, 15.9],
    ['z', -12.79, -5.9, 3.4], ['z', -9.68, -11.9, -5.9], ['z', -3.46, -12.4, -11.9], ['z', -0.34, -15.4, -12.4], ['z', 2.77, 5.9, 6.4], ['z', 5.88, 6.4, 8.9], ['z', 6.57, -15.4, -12.7],
    ['z', 11.05, -8.53, -6.4], ['z', 11.05, -12.7, -10.77], ['z', 15.9, 1.12, 8.9], ['z', 15.9, -6.42, -1.12]];
  // vách tầng một, đã chừa ô cửa (vách x −7,49 cạnh cầu thang tính riêng ở phần vật cản)
  const WALLS = [['x', -9.99, -7.8, -4.67], ['x', -7.5, -7.8, -4.64], ['x', -6.99, -7.8, 2.07], ['x', -6.99, 4.15, 4.67], ['x', -4.5, -7.8, 2.07], ['x', -4.5, 4.15, 14.02],
    ['x', -1.51, -10.89, -10.37], ['x', -1.51, -8.3, -7.78], ['x', 1.49, -10.91, 4.67], ['x', 4.5, 4.67, 11.41], ['x', 4.5, 13.48, 14], ['x', 7, 7.78, 11.41], ['x', 7, 13.48, 14],
    ['z', -10.88, -1.5, 1.52], ['z', -7.76, -10.02, -1.5], ['z', -4.67, -10.02, -9.58], ['z', -4.67, -7.92, -4.47], ['z', -1.56, -7.03, -4.47], ['z', 4.65, 1.5, 2], ['z', 4.65, 4, 4.5],
    ['z', 4.68, -7.53, -4.5], ['z', 7.78, -7.53, -4.47], ['z', 7.77, 4.5, 4.92], ['z', 7.77, 6.58, 7], ['z', 13.99, -4.53, -1], ['z', 13.99, 1, 7]];
  // vách tầng hai: ba cửa mở ra mép sàn không lan can (x 1,5; z 4,64; x −7,49) không chừa ô; gian z 7,78 (x −7,5…−4,49) đã bỏ
  const WALLS2 = [['x', -7.49, -7.8, -1.56], ['x', -4.53, -4.69, 4.67], ['x', -4.49, 7.75, 14.02], ['x', -1.5, -10.91, -7.75], ['x', -1.5, 4.67, 14.02], ['x', 1.5, -10.91, 4.69], ['x', 4.51, 4.67, 14],
    ['z', -10.88, -1.52, 1.52], ['z', -7.78, -7.53, -7], ['z', -7.78, -5, 1.52], ['z', -4.64, -7.5, -4.47], ['z', 4.64, 1.48, 4.5], ['z', 4.68, -4.5, -4], ['z', 4.68, -2, -1.5],
    ['z', 7.78, -4.49, -1.48], ['z', 13.99, -4.53, 2], ['z', 13.99, 4, 4.5], ['z', 7.92, -7.45, -5.6]];                         // cuối: chặn mép sàn phía tây của gian mở
  const RAILS2 = [['x', -13.5, 1.56, 4.67], ['x', -10.5, -1.56, 1.56], ['x', -7.35, -8.83, -7.93], ['x', -5.55, 7.93, 15.07], ['x', -2.55, -11.94, -8.83], ['x', 2.55, -11.94, -7.93],
    ['x', 5.55, 11.04, 15.05], ['z', -11.94, -2.55, 2.55], ['z', -8.83, -7.35, -2.55], ['z', -7.93, 1.65, 2.55], ['z', -1.56, -10.5, -7.5], ['z', 1.56, -13.5, -10.5], ['z', 4.67, -13.5, -7.5],
    ['z', 11.04, 4.65, 5.55], ['z', 15.05, -5.57, 5.55]];
  // cửa: [trục mặt vách, toạ độ, từ, tới, tầng (0 / 1), phía trong (±1)]
  const DOORS = [['z', 4.62, 2, 4, 0, 1], ['x', 4.55, 11.41, 13.48, 0, 1], ['z', 14.05, -1, 1, 0, -1], ['x', -4.55, 2.07, 4.15, 0, 1], ['x', -1.55, -10.37, -8.3, 0, 1], ['z', 7.73, 4.92, 6.58, 0, 1],
    ['x', -7.05, 2.07, 4.15, 0, 1], ['z', -4.62, -9.58, -7.92, 0, -1], ['x', 7.05, 11.41, 13.48, 0, -1],
    ['x', 1.55, 2.07, 4.15, 1, -1], ['z', 4.62, 2, 4, 1, 1], ['z', 14.05, 2, 4, 1, -1], ['z', 4.72, -4, -2, 1, 1], ['x', -7.55, -7.26, -5.19, 1, 1], ['z', -7.83, -7, -5, 1, 1]];
  const COLS = [[1.5, -10.89], [-1.5, -10.89], [-1.5, -7.78], [4.5, 4.67], [1.5, 4.67], [-4.5, 7.78], [4.5, 14], [-4.5, 14], [-10.5, -1.56], [-10.5, 1.56], [-13.5, 1.56], [-13.5, 4.67], [-7.5, -1.56],
    [-7.5, 4.67], [-7.5, 7.78], [-7.5, -7.78], [1.5, -7.78], [-4.5, -7.78], [1.5, -4.67], [1.5, -1.56], [1.5, 1.56], [4.5, 7.78], [4.5, 10.89], [-4.5, 10.89], [1.5, 14], [-1.5, 14], [-10.5, 4.67],
    [-7.5, -4.67], [-7.5, 1.56], [-4.5, -4.67], [-4.5, -1.56], [-4.5, 1.56], [-4.5, 4.67]];
  const COLS2 = COLS.concat([[-1.5, 4.67], [-1.5, 7.78]]);                             // tầng hai: cùng lưới cột, thêm hai cột
  const BODY1 = [[-4.5, 4.67, 4.5, 14, 9], [-4.5, -10.9, 1.5, 4.67, 9], [-7, -7.8, -4.5, 7.78, 9], [-10, -7.8, -7, -4.67, 4.5], [4.5, 7.78, 7, 14, 4.5]]; // khối nhà: x0, z0, x1, z1, cao (bản dựng tạm, vật chắn máy quay, vùng mái)
  const BODY2 = [[-4.5, 4.67, 4.5, 14], [-4.5, -7.78, 1.5, 4.67], [-1.5, -10.9, 1.5, -7.78], [-7.5, -7.8, -4.5, -1.56]];                               // khối tầng hai (bản dựng tạm)

  // ---------- Độ cao ----------
  const inBands = (B, lx, lz) => { for (const b of B) if (lz >= b[0] && lz < b[1] && lx > b[2] && lx < b[3]) return true; return false; };
  function stairH(lx, lz) { // cầu thang lên tầng hai: mỗi điểm một độ cao; null nếu ngoài cầu thang
    if (lx <= ST.x0 || lx >= ST.x1 || lz <= ST.zt || lz >= ST.z1) return null;
    if (lz > ST.zm) return lx < ST.xm ? TOP + U.clamp((lx - ST.x0) / (ST.xm - ST.x0), 0, 1) * (MID - TOP) : MID;       // vế một, chiếu nghỉ
    if (lx <= ST.xm) return null;
    return lz > ST.zf ? MID + U.clamp((ST.zm - lz) / (ST.zm - ST.zf), 0, 1) * (UP - MID) : UP;                          // vế hai, chiếu trên
  }
  function localH(lx, lz) {
    if (inBands(BANDS, lx, lz)) return TOP;
    for (const s of STAIRS) if (lx > s[0] && lx < s[1] && lz > s[2] && lz < s[3]) {
      const t = s[4] === 'z' ? (s[5] > 0 ? lz - s[2] : s[3] - lz) : (s[5] > 0 ? lx - s[0] : s[1] - lx);
      return TOP * (1 - U.clamp(t / RUN, 0, 1));
    }
    return null;
  }
  const inside = (x, z) => x > CT.x0 && x < CT.x1 && z > CT.z0 && z < CT.z1;
  const near = (x, z) => x > OX - 17.6 && x < OX + 11.1 && z > OZ - 13.2 && z < OZ + 18.1;
  const V = (W.tangKinhCac = { site: T, state: 'idle', url: T.url, error: null, tris: 0, tries: 0, next: 2.5, credit: CREDIT, level: 0, inside, mesh: null, standIn: null, show: null });

  safe('độ cao', () => {
    const base = G.heightAt;
    G.heightAt = (x, z) => {
      if (near(x, z)) {
        const lx = x - OX, lz = z - OZ, hs = stairH(lx, lz);
        if (hs !== null) return hs;
        if (V.level === 1 && inBands(UPPER, lx, lz)) { const P = G.player && G.player.pos; if (P && Math.abs(P.x - x) < 0.8 && Math.abs(P.z - z) < 0.8) return UP; } // tầng hai: chỉ cho điểm sát người chơi
        const h = localH(lx, lz); if (h !== null) return h;
      }
      return base(x, z);
    };
    // độ cao theo tầng gần y nhất (người chơi khác gửi kèm độ cao của họ)
    G.heightAtY = (x, z, y) => { if (y > 3.9 && near(x, z)) { const lx = x - OX, lz = z - OZ; if (stairH(lx, lz) === null && inBands(UPPER, lx, lz)) return UP; } return G.heightAt(x, z); };
  });

  // ---------- Ranh giới đi lại: chỉ trong dải z của sân mới được đi quá x 37 ----------
  safe('ranh giới', () => {
    const baseResolve = col.resolve, X1 = T.wallX + 0.7;
    col.x1At = (z) => (z > CT.z0 - 0.3 && z < CT.z1 + 0.3 ? Math.max(col.bounds.x1, X1) : col.bounds.x1); // 22-di-chua-chung.js dùng để kẹp vị trí người chơi khác
    col.resolve = function (p, r) {
      if (p.x > 35.5 && p.z > CT.z0 - 0.3 && p.z < CT.z1 + 0.3) {
        const b = this.bounds, keep = b.x1; b.x1 = Math.max(keep, X1);
        try { return baseResolve.call(this, p, r); } finally { b.x1 = keep; }
      }
      return baseResolve.call(this, p, r);
    };
  });

  // ---------- Vật cản: nhóm chung, tầng một, tầng hai, và nhóm "đóng cửa" khi còn bản dựng tạm ----------
  const SETS = [[], []], SHUT = [];
  let sink = null;                                                                    // null: nhóm chung (luôn có trong G.collide.list)
  const keepC = (c) => { if (sink) sink.push(c); return c; };
  const cbox = (x0, z0, x1, z1, tag) => keepC(col.box(OX + x0, OZ + z0, OX + x1, OZ + z1, tag));
  const seg = (s, h, tag) => (s[0] === 'x' ? cbox(s[1] - h, s[2], s[1] + h, s[3], tag) : cbox(s[2], s[1] - h, s[3], s[1] + h, tag));
  function setLevel(l) { // đổi tầng: rút vật cản tầng kia, đưa vật cản tầng này vào
    if (l === V.level) return;
    for (const c of SETS[V.level]) col.remove(c);
    for (const c of SETS[l]) col.list.push(c);
    V.level = l;
  }
  safe('vật cản', () => {
    // chung: cầu thang lên tầng hai (tay vịn hai vế, mép chiếu nghỉ, mép chiếu trên)
    for (const s of [['z', ST.zm, ST.x0, ST.xm], ['z', ST.z1, ST.x0, ST.x1], ['x', ST.xm, ST.zt, ST.zm], ['z', ST.zt, ST.xm, ST.x1], ['x', ST.x1, 6.0, ST.z1]]) seg(s, 0.04, 'tkc-stair');
    for (const s of STAIRS) { // hai tay vịn dọc mỗi bậc thềm (thò ra ngoài mặt bậc 0,1 m)
      if (s[4] === 'z') { for (const x of [s[0] - 0.1, s[1] + 0.1]) cbox(x - 0.1, s[2] - 0.35, x + 0.1, s[3] + 0.05, 'tkc-rail'); }
      else for (const z of [s[2] - 0.1, s[3] + 0.1]) cbox(s[0] - (s[5] > 0 ? 0.35 : 0.05), z - 0.1, s[1] + (s[5] > 0 ? 0.05 : 0.35), z + 0.1, 'tkc-rail');
    }
    // cánh cửa mở (hai nửa cánh vuông góc với vách, ở hai má cửa) theo từng tầng
    const leaves = (d) => { const w = d[3] - d[2], a = d[1], b = d[1] + d[5] * (w / 2), lo = Math.min(a, b), hi = Math.max(a, b); for (const j of [d[2] + 0.03, d[3] - 0.03]) { if (d[0] === 'z') cbox(j - 0.05, lo, j + 0.05, hi, 'tkc-door'); else cbox(lo, j - 0.05, hi, j + 0.05, 'tkc-door'); } };
    // tầng một
    sink = SETS[0];
    for (const s of RAILS) seg(s, 0.16, 'tkc-rail');
    for (const s of WALLS) seg(s, 0.15, 'tkc-wall');
    seg(['x', ST.x1, 4.64, 6.0], 0.04, 'tkc-wall');                                  // vách cạnh chiếu trên của cầu thang (tầng hai chỗ này là lối sang ban công)
    for (const [x, z] of COLS) keepC(col.circle(OX + x, OZ + z, 0.2, 'tkc-col'));
    for (const d of DOORS) if (d[4] === 0) leaves(d);
    // tầng hai (dựng xong thì rút ra, chỉ đưa vào khi người chơi lên tới nơi)
    sink = SETS[1];
    for (const s of RAILS2) seg(s, 0.06, 'tkc-rail');                                // mỏng hơn tầng một: ban công tầng hai chỉ rộng 1,05 m, người chơi bán kính 0,35 m vẫn phải lọt
    for (const s of WALLS2) seg(s, 0.08, 'tkc-wall');
    for (const [x, z] of COLS2) keepC(col.circle(OX + x, OZ + z, 0.2, 'tkc-col'));
    for (const d of DOORS) if (d[4] === 1) leaves(d);
    // bản dựng tạm là khối đặc: chặn mọi ô cửa tầng một và chân cầu thang cho tới khi mô hình tải xong
    sink = SHUT;
    for (const d of DOORS) if (d[4] === 0) seg([d[0], d[1], d[2] - 0.1, d[3] + 0.1], 0.15, 'tkc-shut');
    seg(['x', ST.x0, ST.zm, ST.z1], 0.06, 'tkc-shut');
    sink = null;
    for (const b of BODY1) {
      G.cam.blockers.push(new THREE.Box3(new THREE.Vector3(OX + b[0], 0, OZ + b[1]), new THREE.Vector3(OX + b[2], b[4], OZ + b[3])));
      G.roofZones.push([OX + b[0], OX + b[2], OZ + b[1], OZ + b[3]]);                // trong nhà: máy quay đứng gần, bước chân 'hall'
    }
    G.roofZones.push([OX - 13.9, OX - 7.0, OZ - 1.9, OZ + 5.0]);                      // dưới hiên hai tầng phía tây
    (G.decorBans = G.decorBans || []).push([33.4, 37, T.gate.z0 - 0.6, T.gate.z1 + 0.6]); // 12-decor-inside.js không đặt chậu cây, đèn chắn cổng mới
  });

  // ---------- Dẫn đường, bản đồ ----------
  safe('dẫn đường', () => {
    const N = (x, z, id) => G.nav.add(x, z, 'tkc' + id), gz = (T.gate.z0 + T.gate.z1) / 2;
    N(34.4, gz, 'CongTrong'); N(38.6, gz, 'CongNgoai');
    N(41, 16.5, 'TayNam'); N(OX, OZ + 21, 'TruocBac'); N(78, 16.5, 'DongNam'); N(78.5, OZ, 'Dong'); N(78, -26.5, 'DongBac'); N(60, -27, 'Bac'); N(41, -26.5, 'TayBac'); N(41, OZ, 'Tay');
    N(OX, OZ + 15.1, 'Them');                                                         // trên nền, trước cửa giữa
    W.places.push({ label: 'Tàng Kinh Các', desc: 'Lầu hai tầng ở sân đông, qua cổng nách trên tường đông sân trước', icon: 'hall', x: OX, z: OZ + 20.2 });
  });

  // ---------- Sân, tường, cổng, cây, bia ----------
  const S = U.batch(), F = U.batch(), IN = U.batch(), LB = U.batch(), own = [];
  const TR = U.batch(); // 2026-11-27: chín cây tán tròn của sân đi riêng một lưới 'tkc:cay' để 13-cay-mo-hinh.js ẩn đi khi mô hình cây tải xong; chỗ đứng ghi vào G.cayDat
  function wall(x0, z0, x1, z1) { // như tường bao của 05-world.js: chân đá, thân vàng đất, mái ngói, cột mỗi 6 m
    const lx = Math.abs(x1 - x0), lz = Math.abs(z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, alongX = lx > lz, L = Math.max(lx, lz);
    const sz = (a, b) => (alongX ? [a, b] : [b, a]);
    const s1 = sz(L, 0.45), s2 = sz(L + 0.1, 0.62), s3 = sz(L + 0.2, 0.8), s4 = sz(L + 0.2, 0.22);
    box(S, cx, 0.2, cz, s2[0], 0.4, s2[1], C.stoneD); box(S, cx, 1.05, cz, s1[0], 1.3, s1[1], C.ochre);
    box(S, cx, 1.78, cz, s3[0], 0.18, s3[1], C.roof); box(S, cx, 1.93, cz, s4[0], 0.14, s4[1], C.ridge);
    const lo = alongX ? Math.min(x0, x1) : Math.min(z0, z1);
    for (let t = 0; t <= L + 0.01; t += 6) { const q = Math.min(lo + t, lo + L), px = alongX ? q : cx, pz = alongX ? cz : q; box(S, px, 1.0, pz, 0.62, 2.0, 0.62, C.ochreD); box(S, px, 2.08, pz, 0.78, 0.16, 0.78, C.ridge); }
    col.box(Math.min(x0, x1) - (alongX ? 0 : 0.3), Math.min(z0, z1) - (alongX ? 0.3 : 0), Math.max(x0, x1) + (alongX ? 0 : 0.3), Math.max(z0, z1) + (alongX ? 0.3 : 0), 'wall');
  }
  safe('tường sân', () => {
    wall(36.6, T.wallZN, T.wallX, T.wallZN); wall(T.wallX, T.wallZN, T.wallX, T.wallZS); wall(36.6, T.wallZS, T.wallX, T.wallZS);
    box(S, T.wallX, 1.0, T.wallZS, 0.62, 2.0, 0.62, C.ochreD); box(S, T.wallX, 2.08, T.wallZS, 0.78, 0.16, 0.78, C.ridge); // cột góc đông nam
  });
  safe('cổng nách', () => { // hai trụ, xà gỗ, hai lớp mái ngói; ngưỡng đá
    const x = 36.3, gz = (T.gate.z0 + T.gate.z1) / 2, half = (T.gate.z1 - T.gate.z0) / 2 - 0.2;
    for (const s of [-1, 1]) {
      const z = gz + s * half;
      box(S, x, 1.35, z, 0.7, 2.7, 0.7, C.ochreD); box(S, x, 2.78, z, 0.86, 0.16, 0.86, C.ridge);
      col.box(x - 0.35, z - 0.35, x + 0.35, z + 0.35, 'wall');
    }
    box(S, x, 2.98, gz, 0.4, 0.24, half * 2 + 1.1, C.woodD);
    box(S, x, 3.19, gz, 1.7, 0.16, half * 2 + 2.0, C.roof); box(S, x, 3.34, gz, 1.0, 0.14, half * 2 + 1.6, C.roof); box(S, x, 3.48, gz, 0.3, 0.16, half * 2 + 1.8, C.ridge);
    boxMM(F, 35.8, 0, gz - half + 0.35, 36.9, 0.035, gz + half - 0.35, C.stoneL);
    G.cam.blockers.push(new THREE.Box3(new THREE.Vector3(x - 0.9, 2.8, gz - half - 1), new THREE.Vector3(x + 0.9, 3.6, gz + half + 1)));
  });
  safe('sân lát', () => {
    const tex = U.canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#7f7566'; g.fillRect(0, 0, w, h);
      const rnd = U.rng(27);
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
        const v = 0.9 + rnd() * 0.16, s = w / 2;
        g.fillStyle = `rgb(${(190 * v) | 0},${(182 * v) | 0},${(168 * v) | 0})`; g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
        for (let k = 0; k < 90; k++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '70,55,40' : '255,245,225'},${rnd() * 0.09})`; g.fillRect(i * s + rnd() * s, j * s + rnd() * s, 3, 3); }
      }
    });
    const x0 = 36.9, x1 = 78.4, z0 = -27.4, z1 = 21.0, w = x1 - x0, d = z1 - z0;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(w / 2.4, d / 2.4); tex.anisotropy = Math.min(8, G.renderer.capabilities.getMaxAnisotropy());
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ map: tex }));
    m.rotation.x = -PI / 2; m.position.set((x0 + x1) / 2, 0.012, (z0 + z1) / 2); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'tkc:san'; scene.add(m);
    V.paved = { x0, x1, z0, z1 };
  });
  safe('cây, đèn đá, bia', () => {
    const tree = (x, z, s, k) => { // cây tán tròn ở dải cỏ sát tường bắc và tường đông
      const trunk = new THREE.CylinderGeometry(0.16 * s, 0.24 * s, 2.6 * s, 6); own.push(trunk);
      TR.add(trunk, 0x6b4a2e, { p: [x, 1.3 * s, z] });
      const blob = new THREE.IcosahedronGeometry(1, 1); own.push(blob);
      const g = [0x4f7f36, 0x5b8c3d, 0x467231];
      TR.add(blob, g[k % 3], { p: [x, 3.5 * s, z], s: [1.9 * s, 1.5 * s, 1.9 * s] });
      TR.add(blob, g[(k + 1) % 3], { p: [x + 0.9 * s, 3.0 * s, z + 0.4 * s], s: [1.3 * s, 1.0 * s, 1.3 * s] });
      TR.add(blob, g[(k + 2) % 3], { p: [x - 0.8 * s, 3.1 * s, z - 0.5 * s], s: [1.2 * s, 1.0 * s, 1.2 * s] });
      (G.cayDat || (G.cayDat = [])).push({ k: 'tkc', x, y: -0.05, z, s, seed: 520 + k });
      col.circle(x, z, 0.3, 'tree');
    };
    let k = 0;
    for (const x of [43, 51, 59, 67, 75]) tree(x, -29.2, 1 + (k % 3) * 0.08, k++);
    for (const z of [-20, -8, 4, 16]) tree(80.2, z, 1.05 + (k % 3) * 0.07, k++);
    for (const s of [-1, 1]) { // đôi đèn đá hai bên bậc chính
      const x = OX + s * 2.4, z = OZ + 19.3;
      box(S, x, 0.12, z, 0.56, 0.24, 0.56, C.stoneD); box(S, x, 0.72, z, 0.26, 0.96, 0.26, C.stone); box(S, x, 1.27, z, 0.5, 0.14, 0.5, C.stoneD);
      box(S, x, 1.52, z, 0.36, 0.36, 0.36, 0xe9d7a4); box(S, x, 1.76, z, 0.6, 0.12, 0.6, C.stoneD); box(S, x, 1.88, z, 0.3, 0.12, 0.3, C.stone);
      col.circle(x, z, 0.36, 'stonelamp');
    }
    { // bia tên bên trái bậc chính, mặt quay về +z
      const x = OX - 5.4, z = OZ + 19.6;
      box(S, x, 0.25, z, 1.9, 0.5, 0.7, C.stoneD); box(S, x, 1.2, z, 1.6, 1.4, 0.3, C.stone);
      addSign(['TÀNG KINH CÁC', 'Lầu cất giữ kinh sách'], 1.4, 1.0, x, 1.22, z + 0.16, 0, { ppu: 260, bg1: '#5a4a3a', bg2: '#3e3226', fg: '#f3e3c3' });
      col.box(x - 0.95, z - 0.35, x + 0.95, z + 0.35, 'stele');
    }
  });

  // ---------- Trong nhà: kệ kinh dọc vách, bàn đọc kinh, bồ đoàn, án kinh, đèn lồng giấy (dựng bằng mã; toạ độ gốc của mô hình) ----------
  safe('nội thất', () => {
    const rnd = U.rng(411), CLOTH = [0xb8862f, 0x8e2a22, 0x2f4f6f, 0xcbb98a, 0x6d4a2a], WOOD = 0x5e3a26, WOODL = 0x7a4e32;
    const B3 = (x0, y0, z0, x1, y1, z1, c) => boxMM(IN, OX + x0, y0, OZ + z0, OX + x1, y1, OZ + z1, c);
    // kệ kinh sát vách: ax = trục của vách, wc = toạ độ vách, sd = phía kệ thò ra (±1), a…b = đoạn dọc vách, y = cao độ sàn, lv = tầng
    function shelf(ax, wc, sd, a, b, y, lv) {
      const d0 = wc + sd * 0.1, d1 = wc + sd * 0.55, lo = Math.min(d0, d1), hi = Math.max(d0, d1), H = 2.3;
      const R = (s0, y0, s1, y1, p0, p1, c) => (ax === 'x' ? B3(p0, y0, s0, p1, y1, s1, c) : B3(s0, y0, p0, s1, y1, p1, c));
      R(a, y, b, y + H, wc + sd * 0.08, wc + sd * 0.12, WOOD);                                                    // lưng kệ
      const bays = Math.max(1, Math.round((b - a) / 1.5)), bw = (b - a) / bays;
      for (let i = 0; i <= bays; i++) R(a + i * bw - 0.035, y, a + i * bw + 0.035, y + H, lo, hi, WOOD);            // trụ đứng
      for (let k = 0; k < 5; k++) {
        const yy = y + 0.1 + k * 0.53;
        R(a, yy, b, yy + 0.05, lo, hi, WOODL);                                                                       // đợt kệ
        if (k === 4) break;
        for (let i = 0; i < bays; i++) for (let j = 0; j < 3; j++) { // mỗi khoang ba chồng hộp kinh bọc vải
          if (rnd() < 0.12) continue;
          const s0 = a + i * bw + 0.08 + j * ((bw - 0.16) / 3), w = (bw - 0.16) / 3 - 0.05, h = 0.2 + rnd() * 0.2;
          R(s0, yy + 0.05, s0 + w, yy + 0.05 + h, Math.min(d0 + sd * 0.06, d1 - sd * 0.06), Math.max(d0 + sd * 0.06, d1 - sd * 0.06), CLOTH[(rnd() * CLOTH.length) | 0]);
        }
      }
      sink = SETS[lv];
      if (ax === 'x') cbox(Math.min(wc, d1), a, Math.max(wc, d1), b, 'tkc-ke'); else cbox(a, Math.min(wc, d1), b, Math.max(wc, d1), 'tkc-ke');
      sink = null;
    }
    // bàn đọc kinh thấp, kinh mở trên bàn, bồ đoàn hai bên; dài theo trục ax
    function table(cx, cz, L, ax, y, lv) {
      const hx = ax === 'x' ? L / 2 : 0.5, hz = ax === 'x' ? 0.5 : L / 2;
      B3(cx - hx, y + 0.36, cz - hz, cx + hx, y + 0.44, cz + hz, WOODL);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) B3(cx + sx * (hx - 0.12) - 0.05, y, cz + sz * (hz - 0.12) - 0.05, cx + sx * (hx - 0.12) + 0.05, y + 0.36, cz + sz * (hz - 0.12) + 0.05, WOOD);
      const n = Math.max(2, Math.round(L / 1.1));
      for (let i = 0; i < n; i++) {
        const t = -L / 2 + ((i + 0.5) * L) / n, px = ax === 'x' ? cx + t : cx, pz = ax === 'x' ? cz : cz + t;
        B3(px - 0.2, y + 0.44, pz - 0.14, px - 0.01, y + 0.47, pz + 0.14, 0xe9dfc2); B3(px + 0.01, y + 0.44, pz - 0.14, px + 0.2, y + 0.47, pz + 0.14, 0xe9dfc2); // quyển kinh mở
        for (const sd of [-1, 1]) { const qx = ax === 'x' ? px : cx + sd * 0.95, qz = ax === 'x' ? cz + sd * 0.95 : pz; B3(qx - 0.26, y, qz - 0.26, qx + 0.26, y + 0.09, qz + 0.26, 0xb07a2e); } // bồ đoàn
      }
      sink = SETS[lv]; cbox(cx - hx, cz - hz, cx + hx, cz + hz, 'tkc-ban'); sink = null;
    }
    const lamp = (x, z, y) => { // đèn lồng giấy treo
      boxMM(LB, OX + x - 0.17, y - 0.24, OZ + z - 0.17, OX + x + 0.17, y + 0.2, OZ + z + 0.17, 0xffd98a);
      B3(x - 0.2, y + 0.2, z - 0.2, x + 0.2, y + 0.25, z + 0.2, WOOD); B3(x - 0.015, y + 0.25, z - 0.015, x + 0.015, y + 0.7, z + 0.015, WOOD);
      glow(OX + x, y, OZ + z, 1.3, [1, 0.78, 0.42], true);
    };
    // tầng một: gian trước (x −4,5…4,5; z 4,67…14), gian sau (x −4,5…1,5; z −7,76…4,67), gian bắc (x −1,5…1,5; z −10,9…−7,78)
    shelf('x', -4.5, 1, 5.2, 13.6, TOP, 0); shelf('x', 4.5, -1, 5.9, 11.0, TOP, 0);
    shelf('x', 1.49, -1, -7.3, 4.2, TOP, 0); shelf('x', -4.5, 1, -7.4, 1.6, TOP, 0);
    table(0, 9.6, 3.3, 'x', TOP, 0); table(-1.5, -2.4, 3.3, 'z', TOP, 0);
    { // án kinh ở gian bắc, sát vách đông: án phủ vải đỏ, chồng hộp kinh, đôi chân nến, bát hương
      const y = TOP;
      B3(0.82, y, -10.15, 1.36, y + 0.86, -8.45, 0x8e2a22); B3(0.76, y + 0.86, -10.21, 1.4, y + 0.92, -8.39, WOODL);
      B3(0.95, y + 0.92, -9.6, 1.3, y + 1.04, -9.0, CLOTH[0]); B3(0.98, y + 1.04, -9.55, 1.27, y + 1.15, -9.05, CLOTH[2]); B3(1.0, y + 1.15, -9.5, 1.25, y + 1.25, -9.1, CLOTH[3]);
      for (const z of [-9.95, -8.65]) { B3(1.04, y + 0.92, z - 0.06, 1.16, y + 0.96, z + 0.06, 0x9a7a3a); B3(1.08, y + 0.96, z - 0.02, 1.12, y + 1.2, z + 0.02, 0x9a7a3a); boxMM(LB, OX + 1.08, y + 1.2, OZ + z - 0.02, OX + 1.12, y + 1.27, OZ + z + 0.02, 0xffe2a0); }
      B3(0.86, y + 0.92, -9.42, 1.0, y + 1.02, -9.18, 0x7a6a4a);
      sink = SETS[0]; cbox(0.74, -10.23, 1.42, -8.37, 'tkc-an'); sink = null;
    }
    for (const [x, z] of [[0, 7.2], [0, 11.8], [-1.5, 1.2], [-1.5, -5.6], [0, -9.3]]) lamp(x, z, TOP + 2.45);
    // tầng hai: gian trước (x −1,5…4,5; z 4,67…14), gian sau (x −4,5…1,5; z −7,78…4,67)
    shelf('x', 4.51, -1, 5.9, 12.8, UP, 1); shelf('x', -1.5, 1, 8.4, 13.6, UP, 1); shelf('x', 1.5, -1, -7.3, 1.7, UP, 1);
    table(1.6, 9.4, 2.2, 'z', UP, 1); table(-1.5, -2.0, 3.3, 'z', UP, 1);
    for (const [x, z] of [[1.6, 7.0], [1.6, 11.8], [-1.5, 1.4], [-1.5, -5.4], [-6, 1.5], [-10.5, 3.1]]) lamp(x, z, UP + 2.45);
  });

  // ---------- Bản dựng tạm (khi chưa tải được mô hình): nền, khối nhà hai tầng, cột, mái bậc ----------
  const standIn = new THREE.Group(); standIn.name = 'tkc:tam';
  safe('bản dựng tạm', () => {
    const B = U.batch();
    for (const b of BANDS) { boxMM(B, OX + b[2], 0, OZ + b[0], OX + b[3], 0.3, OZ + b[1], C.stoneD); boxMM(B, OX + b[2] + 0.12, 0.3, OZ + b[0] + (b === BANDS[0] ? 0.12 : 0), OX + b[3] - 0.12, 0.7, OZ + b[1], 0x8a8278); boxMM(B, OX + b[2], 0.7, OZ + b[0], OX + b[3], TOP, OZ + b[1], C.stoneL); }
    for (const s of STAIRS) for (let i = 0; i < 5; i++) { // năm bậc
      const a = (RUN * i) / 5, c = (RUN * (i + 1)) / 5, y = TOP * (1 - (i + 1) / 5) + 0.2;
      if (s[4] === 'z') boxMM(B, OX + s[0], 0, OZ + (s[5] > 0 ? s[2] + a : s[3] - c), OX + s[1], y, OZ + (s[5] > 0 ? s[2] + c : s[3] - a), C.stoneL);
      else boxMM(B, OX + (s[5] > 0 ? s[0] + a : s[1] - c), 0, OZ + s[2], OX + (s[5] > 0 ? s[0] + c : s[1] - a), y, OZ + s[3], C.stoneL);
    }
    for (const b of BODY1) boxMM(B, OX + b[0], TOP, OZ + b[1], OX + b[2], 4.4, OZ + b[3], 0x7e4a33);
    boxMM(B, OX - 13.9, 4.4, OZ - 12.1, OX + 4.9, 4.72, OZ + 14.4, 0x7a5638);                                    // sàn tầng hai
    for (const b of BODY2) { boxMM(B, OX + b[0], 4.72, OZ + b[1], OX + b[2], 8.1, OZ + b[3], 0x7e4a33); boxMM(B, OX + b[0] - 1.5, 8.1, OZ + b[1] - 1.5, OX + b[2] + 1.5, 8.5, OZ + b[3] + 1.5, 0x474b55); boxMM(B, OX + b[0] - 0.4, 8.5, OZ + b[1] - 0.4, OX + b[2] + 0.4, 9.3, OZ + b[3] + 0.4, 0x3e424b); boxMM(B, OX + b[0] + 0.9, 9.3, OZ + b[1] + 0.9, OX + b[2] - 0.9, 10.1, OZ + b[3] - 0.9, 0x363a42); }
    boxMM(B, OX - 14.6, 8.1, OZ - 2.6, OX - 6.4, 8.5, OZ + 5.7, 0x474b55); boxMM(B, OX - 13.4, 8.5, OZ - 1.5, OX - 7.6, 9.3, OZ + 4.6, 0x3e424b); // mái hiên hai tầng phía tây
    for (const [x, z] of COLS) { boxMM(B, OX + x - 0.17, TOP, OZ + z - 0.17, OX + x + 0.17, 4.4, OZ + z + 0.17, 0x7c2620); if (x <= -7.5 || BODY2.some((b) => x >= b[0] && x <= b[2] && z >= b[1] && z <= b[3])) boxMM(B, OX + x - 0.17, 4.72, OZ + z - 0.17, OX + x + 0.17, 8.1, OZ + z + 0.17, 0x7c2620); }
    standIn.add(B.mesh(G.mats.vc, { cast: true, receive: true }));
    scene.add(standIn); V.standIn = standIn;
  });
  safe('gom mesh', () => {
    if (S.list.length) { const m = S.mesh(G.mats.vc, { cast: true, receive: true }); m.name = 'tkc:than'; scene.add(m); }
    if (TR.list.length) { const m = TR.mesh(G.mats.vc, { cast: true, receive: true }); m.name = 'tkc:cay'; scene.add(m); (G.cayCu || (G.cayCu = [])).push(m); } // cây dựng bằng mã (bản dự phòng của mô hình cây)
    if (F.list.length) { const m = F.mesh(G.mats.vc, { cast: false, receive: true }); m.name = 'tkc:phang'; scene.add(m); }
    if (IN.list.length) { const m = IN.mesh(G.mats.vc, { cast: false, receive: true }); m.name = 'tkc:noi-that'; scene.add(m); V.interior = m; }
    if (LB.list.length) { const m = LB.mesh(G.mats.lantern, { cast: false, receive: false }); m.name = 'tkc:den'; scene.add(m); }
    for (const g of own) g.dispose();
  });
  for (const c of SETS[1]) col.remove(c);                                             // lúc đầu người chơi ở tầng một: vật cản tầng hai chưa có trong G.collide.list

  // ---------- Tải mô hình ----------
  let Loader = null, now = 0;
  function place(gltf) {
    const root = gltf && (gltf.scene || (gltf.scenes && gltf.scenes[0]));
    if (!root) throw new Error('mô hình không có cảnh');
    const aniso = Math.min(4, G.renderer.capabilities.getMaxAnisotropy());
    let tris = 0; const old = [];
    root.traverse((o) => {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
      tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
      const src = o.material, hasMap = !!(src && src.map);
      old.push(src);
      // file không có pháp tuyến: tô phẳng theo từng mặt (flatShading), hai mặt (mái là tấm đơn, nhìn được từ dưới hiên)
      if (hasMap) {
        src.map.anisotropy = aniso; src.map.needsUpdate = true;
        o.material = new THREE.MeshLambertMaterial({ map: src.map, alphaTest: 0.42, side: THREE.DoubleSide, flatShading: true });
        try { G.renderer.initTexture(src.map); } catch (e) { /* lần vẽ đầu tự đẩy ảnh lên */ }
      } else o.material = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, flatShading: true });
      o.castShadow = true; o.receiveShadow = true;
    });
    if (tris < 1) throw new Error('mô hình không có mặt nào');
    for (const m of old) if (m && m.dispose) m.dispose();
    const hold = new THREE.Group(); hold.name = 'tkc:mo-hinh';
    hold.add(root); hold.position.set(OX, 0, OZ);
    scene.add(hold); hold.updateMatrixWorld(true);
    hold.traverse((o) => { o.matrixAutoUpdate = false; });
    V.mesh = hold; V.tris = Math.round(tris);
    let shut = true;
    V.show = (model) => { // true: mô hình (mở cửa, mở chân cầu thang); false: bản dựng tạm (để so sánh / gỡ lỗi; đóng lại)
      hold.visible = !!model; standIn.visible = !model;
      if (!!model === shut) { shut = !model; for (const c of SHUT) { if (shut) col.list.push(c); else col.remove(c); } }
      G.renderer.shadowMap.needsUpdate = true;
    };
    V.show(true);
    standIn.traverse((n) => { if (n.geometry) n.geometry.dispose(); });               // trả bộ nhớ đồ hoạ của bản tạm; hiện lại thì Three.js tự đẩy lên lại
  }
  async function load() {
    V.state = 'loading'; V.tries++;
    try {
      if (!Loader) {
        try { Loader = (await import('three/addons/loaders/GLTFLoader.js')).GLTFLoader; }
        catch (e) { V.tries = 99; throw e; }                                          // import() hỏng thì thử lại cũng vô ích
        if (!Loader) { V.tries = 99; throw new Error('addon không có GLTFLoader'); }
      }
      place(await new Loader().loadAsync(T.url));
      V.state = 'ready'; V.error = null;
    } catch (e) {
      V.error = (e && e.message) || String(e);
      if (V.tries < 2) { V.state = 'idle'; V.next = now + 45; }
      else { V.state = 'failed'; console.warn('[Tàng Kinh Các] không tải được mô hình — giữ bản dựng tạm: ' + V.error); }
    }
  }
  if (G.onUpdate) G.onUpdate((dt, t) => {
    now = t || 0;
    const P = G.player && G.player.pos;
    if (P) { // người chơi đang ở tầng nào: trên cầu thang thì theo độ cao bậc; rời sàn tầng hai mà không qua cầu thang (dịch chuyển bằng bản đồ…) thì về tầng một
      if (near(P.x, P.z)) {
        const lx = P.x - OX, lz = P.z - OZ, hs = stairH(lx, lz);
        if (hs !== null) setLevel(hs >= 3.8 ? 1 : 0); else if (V.level === 1 && !inBands(UPPER, lx, lz)) setLevel(0);
      } else if (V.level === 1) setLevel(0);
    }
    if (V.state !== 'idle' || now < V.next) return;
    const conn = navigator.connection;
    if (conn && conn.saveData) {                                                       // máy bật tiết kiệm dữ liệu: chỉ tải khi người chơi tới gần (65 m, tức đã vào sân trước)
      if (!P) return;
      const dx = P.x - OX, dz = P.z - OZ; if (dx * dx + dz * dz > 65 * 65) return;
    }
    load();
  }, 57);
}
