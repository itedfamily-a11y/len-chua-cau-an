// =====================================================================
//  KHU MỞ RỘNG — BỐ CỤC: phỏng theo nét kiến trúc chùa Bút Tháp và chùa Phật Tích
//  (cầu đá & ao Long Trì, bậc đá lên tầng nền, sân linh thú, Tích Thiện Am với
//  tháp Cửu phẩm, điện Quan Âm, tháp Báo Nghiêm, vườn tháp, hai dãy hành lang).
//  Phần này chỉ đặt toạ độ, độ cao, vật cản, đường đi; hình khối dựng ở 09-world2-geo.js
// =====================================================================
function buildWorld2(G) {
  const { util: U } = G;
  const PI = Math.PI, col = G.collide, W = G.world;

  // ---------- Toạ độ các hạng mục (mét; trục chính x = 0, đi sâu vào trong là z âm) ----------
  const L = (G.L2 = {
    zone: { x0: -24, x1: 24, z0: -84, z1: -27 },                       // nền đá phía sau (z -27…-9 đã có mặt sân trước lát sẵn nên giữ nguyên, không dời)
    pond: { x0: -10, x1: 10, z0: -20, z1: -14, waterY: 0.05 },         // ao Long Trì (hình chữ nhật)
    bridge: { x0: -1.5, x1: 1.5, z0: -20.6, z1: -13.4, peak: 0.45 },   // cầu đá vồng qua ao
    terrace: { x0: -11, x1: 11, z0: -62, z1: -25, h: 1.2 },             // tầng nền trên (phần giữa, chỗ Tích Thiện Am)
    hallTerrace: { x0: -14.5, x1: 14.5, z0: -83.7, z1: -62, h: 1.2 },   // tầng nền rộng phía sau, đến sát mặt trong tường bao (chỗ chính điện)
    stairsFront: { x0: -4, x1: 4, z0: -25, z1: -23 },                   // bậc đá trước: cao 0 ở z=-23 → 1.2 ở z=-25
    stairsWest: { x0: -13, x1: -11, z0: -43, z1: -37 },                 // bậc đá phía tây: cao 0 ở x=-13 → 1.2 ở x=-11
    stairsEastHall: { x0: 14.5, x1: 16.5, z0: -74.2, z1: -69.8 },       // bậc đá phía đông lên tầng nền chính điện: cao 0 ở x=16.5 → 1.2 ở x=14.5
    stairsWestHall: { x0: -16.5, x1: -14.5, z0: -74.2, z1: -69.8 },     // bậc đá phía tây lên tầng nền chính điện: cao 0 ở x=-16.5 → 1.2 ở x=-14.5
    animals: [                                                          // 10 linh thú, mỗi loài một cặp, quay vào lối giữa
      { kind: 'sutu', name: 'Sư tử', z: -29.0 }, { kind: 'voi', name: 'Voi', z: -32.2 }, { kind: 'tegiac', name: 'Tê giác', z: -35.4 },
      { kind: 'trau', name: 'Trâu', z: -38.6 }, { kind: 'ngua', name: 'Ngựa', z: -41.8 },
    ].flatMap((a) => [Object.assign({ x: -3.7, yaw: PI / 2, side: 'tay' }, a), Object.assign({ x: 3.7, yaw: -PI / 2, side: 'dong' }, a)]),
    am: { x0: -6, x1: 6, z0: -57, z1: -45, floorY: 1.2, wallTop: 7.0, frontCols: [-5.0, -1.9, 1.9, 5.0], frontZ: -45.4,
      tower: { x: 0, z: -51.2, r: 1.7, h: 5.2, tiers: 9 } },            // Tích Thiện Am + tháp Cửu phẩm liên hoa
    quanAm: { x0: 6.6, x1: 10.6, z0: -54, z1: -47, floorY: 1.2, wallTop: 5.6, statue: { x: 8.6, z: -52.2 } }, // điện Quan Âm, mở về phía nam
    baoNghiem: { x: -16.2, z: -40, baseR: 2.75, ringR: 3.8, banR: 5.0, floorY: 0.28, h: 15.4, tiers: 5 }, // tháp đá 8 mặt 5 tầng, tầng trệt rỗng (điện Văn Thù), có lối đi nhiễu quanh
    vuonThap: { x0: 11.3, x1: 20.6, z0: -61, z1: -26,
      stupas: [ // x, z, nửa bề rộng chân, chiều cao
        { x: 16.8, z: -43.0, r: 1.5, h: 6.6, main: true },
        { x: 14.6, z: -31.6, r: 0.9, h: 3.6 }, { x: 18.6, z: -32.6, r: 1.0, h: 4.2 }, { x: 14.7, z: -37.0, r: 0.8, h: 3.2 },
        { x: 18.6, z: -38.0, r: 0.9, h: 3.8 }, { x: 18.6, z: -48.2, r: 0.9, h: 4.0 }, { x: 14.8, z: -49.4, r: 0.8, h: 3.4 },
        { x: 15.0, z: -55.0, r: 1.0, h: 4.4 }, { x: 18.6, z: -54.6, r: 0.85, h: 3.6 },
      ],
      bench: { x: 13.7, z: -43.0, yaw: PI / 2, y: 0.42 } },             // ghế đá nhìn về tháp Tổ (dùng cho hoạt động thở)
    corridors: { inner: 20.8, outer: 23.7, z0: -79, z1: -13, cols: Array.from({ length: 21 }, (_, k) => -13.6 - k * 3.2) },
    pondBenches: [{ x: -6.5, z: -22.6, yaw: 0, y: 0.42 }, { x: 6.5, z: -22.6, yaw: 0, y: 0.42 }],
  });

  // ---------- Độ cao mặt đất: cầu vồng, bậc đá, tầng nền ----------
  const baseHeight = G.heightAt;
  G.heightAt = (x, z) => {
    const B = L.bridge, T = L.terrace, HT = L.hallTerrace;
    if (G.L.hall.dz) { const hb = baseHeight(x, z); if (hb) return hb; } // chính điện đã dời lên tầng nền: xét nền chính điện trước (còn ở chỗ cũ thì bỏ qua)
    if (x > B.x0 && x < B.x1 && z < B.z1 && z > B.z0) return B.peak * Math.sin((PI * (B.z1 - z)) / (B.z1 - B.z0));
    if (x > -4 && x < 4 && z <= -23 && z > -25) return ((-23 - z) / 2) * T.h;
    if (z > -43 && z < -37 && x >= -13 && x < -11) return ((x + 13) / 2) * T.h;
    if (z > -74.2 && z < -69.8) { // hai bậc bên lên tầng nền chính điện
      if (x <= 16.5 && x > 14.5) return ((16.5 - x) / 2) * T.h;
      if (x >= -16.5 && x < -14.5) return ((x + 16.5) / 2) * T.h;
    }
    if (x >= T.x0 && x <= T.x1 && z <= T.z1 && z >= T.z0) return T.h;
    if (x >= HT.x0 && x <= HT.x1 && z <= HT.z1 && z >= HT.z0) return HT.h;
    return baseHeight(x, z);
  };
  G.roofZones.push([-5.7, 5.7, -56.6, -45.4], [6.9, 10.3, -53.6, -47.2]);

  // ---------- Vật cản (khớp với hình khối ở 09-world2-geo.js) ----------
  const P = L.pond;
  col.box(P.x0 - 0.4, P.z0 - 0.4, -1.45, P.z1 + 0.4, 'pond2'); col.box(1.45, P.z0 - 0.4, P.x1 + 0.4, P.z1 + 0.4, 'pond2');
  // mép tầng nền (tường kè đá + lan can), chừa bậc trước và bậc tây
  col.box(-11.3, -25.3, -4.0, -24.7, 'terrace'); col.box(4.0, -25.3, 11.3, -24.7, 'terrace');
  col.box(-4.3, -25.3, -4.0, -23.0, 'terrace'); col.box(4.0, -25.3, 4.3, -23.0, 'terrace');
  col.box(10.7, -62.3, 11.3, -24.7, 'terrace');
  col.box(-11.3, -62.3, -10.7, -43.0, 'terrace'); col.box(-11.3, -37.0, -10.7, -24.7, 'terrace');
  col.box(-13.0, -43.3, -11.0, -43.0, 'terrace'); col.box(-13.0, -37.0, -11.0, -36.7, 'terrace');
  // tầng nền chính điện nới ra ±14.5 sau z=-62: tường chắn bước ra, tường hai bên chạy đến mặt trong tường bao (chừa hai bậc bên); phía sau không có tường kè
  col.box(10.7, -62.3, 14.8, -61.7, 'terrace'); col.box(-14.8, -62.3, -10.7, -61.7, 'terrace');
  col.box(14.2, -69.8, 14.8, -62.3, 'terrace'); col.box(14.2, -83.7, 14.8, -74.2, 'terrace');
  col.box(-14.8, -69.8, -14.2, -62.3, 'terrace'); col.box(-14.8, -83.7, -14.2, -74.2, 'terrace');
  col.box(14.5, -74.5, 16.5, -74.2, 'terrace'); col.box(14.5, -69.8, 16.5, -69.5, 'terrace');
  col.box(-16.5, -74.5, -14.5, -74.2, 'terrace'); col.box(-16.5, -69.8, -14.5, -69.5, 'terrace');
  // linh thú (thân dài theo trục x vì quay vào lối giữa)
  for (const a of L.animals) col.box(a.x - 0.95, a.z - 0.65, a.x + 0.95, a.z + 0.65, 'linhthu');
  // Tích Thiện Am: tường sau, hai tường bên, cột trước, tháp Cửu phẩm
  const A = L.am;
  col.box(A.x0, A.z0, A.x1, A.z0 + 0.4, 'am'); col.box(A.x0, A.z0, A.x0 + 0.3, A.frontZ - 0.2, 'am'); col.box(A.x1 - 0.3, A.z0, A.x1, A.frontZ - 0.2, 'am');
  for (const x of A.frontCols) col.circle(x, A.frontZ, 0.32, 'col');
  col.circle(A.tower.x, A.tower.z, A.tower.r + 0.15, 'cuupham');
  G.cam.blockers.push(new G.THREE.Box3(new G.THREE.Vector3(A.x0, A.floorY, A.z0), new G.THREE.Vector3(A.x1, A.wallTop, A.z0 + 0.4)));
  G.cam.blockers.push(new G.THREE.Box3(new G.THREE.Vector3(A.x0, A.floorY, A.z0), new G.THREE.Vector3(A.x0 + 0.3, A.wallTop, A.frontZ - 0.2)));
  G.cam.blockers.push(new G.THREE.Box3(new G.THREE.Vector3(A.x1 - 0.3, A.floorY, A.z0), new G.THREE.Vector3(A.x1, A.wallTop, A.frontZ - 0.2)));
  // điện Quan Âm
  const Q = L.quanAm;
  col.box(Q.x0, Q.z0, Q.x1, Q.z0 + 0.4, 'quanam'); col.box(Q.x0, Q.z0, Q.x0 + 0.3, Q.z1, 'quanam'); col.box(Q.x1 - 0.3, Q.z0, Q.x1, Q.z1, 'quanam');
  col.box(7.6, -53.6, 9.6, -51.0, 'altar');
  G.cam.blockers.push(new G.THREE.Box3(new G.THREE.Vector3(Q.x0, Q.floorY, Q.z0), new G.THREE.Vector3(Q.x1, Q.wallTop, Q.z0 + 0.4)));
  G.cam.blockers.push(new G.THREE.Box3(new G.THREE.Vector3(Q.x0, Q.floorY, Q.z0), new G.THREE.Vector3(Q.x0 + 0.3, Q.wallTop, Q.z1)));
  G.cam.blockers.push(new G.THREE.Box3(new G.THREE.Vector3(Q.x1 - 0.3, Q.floorY, Q.z0), new G.THREE.Vector3(Q.x1, Q.wallTop, Q.z1)));
  // tháp Báo Nghiêm: tường tầng trệt (phòng rộng 3 m, cửa 1,3 m ở mặt nam), bệ tháp chặn bằng chuỗi cột tròn; lòng tháp và lối lên cửa để trống; lối nhiễu tháp r 3.1–4.4 để trống
  const BN = L.baoNghiem;
  {
    const a0 = 1.5, a1 = 1.74, g = 0.65;
    col.box(BN.x - a1, BN.z - a1, BN.x + a1, BN.z - a0, 'baonghiem'); col.box(BN.x - a1, BN.z - a0, BN.x - a0, BN.z + a0, 'baonghiem'); col.box(BN.x + a0, BN.z - a0, BN.x + a1, BN.z + a0, 'baonghiem');
    col.box(BN.x - a1, BN.z + a0, BN.x - g, BN.z + a1, 'baonghiem'); col.box(BN.x + g, BN.z + a0, BN.x + a1, BN.z + a1, 'baonghiem');
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) col.circle(BN.x + sx * 1.2, BN.z + sz * 1.2, 0.55, 'baonghiem'); // bốn mặt chéo của phòng
    for (let k = 0; k < 16; k++) if (k !== 0 && k !== 1 && k !== 15) col.circle(BN.x + Math.sin((k * PI) / 8) * 2.3, BN.z + Math.cos((k * PI) / 8) * 2.3, 0.6, 'baonghiem'); // bệ tháp, chừa lối lên cửa phía nam
  }
  // vườn tháp + ghế đá
  for (const s of L.vuonThap.stupas) col.circle(s.x, s.z, s.r + 0.15, 'stupa');
  const benchCols = (b) => { for (const s of [-0.75, 0.75]) col.circle(b.x + Math.cos(b.yaw) * s, b.z - Math.sin(b.yaw) * s, 0.22, 'bench'); };
  benchCols(L.vuonThap.bench); L.pondBenches.forEach(benchCols);
  // hành lang: hàng cột phía trong (tường ngoài chính là tường bao)
  for (const sx of [-1, 1]) for (const z of L.corridors.cols) col.circle(sx * L.corridors.inner, z, 0.26, 'col');

  // ---------- Điểm mốc dẫn đường ----------
  const N = (x, z, id) => G.nav.add(x, z, id);
  N(0, -11.6, 'backCourt'); N(-11.8, -11.6); N(11.8, -11.6); N(-18.5, -11.6); N(18.5, -11.6);
  for (const sx of [-1, 1]) for (const z of [-15, -24, -33, -42, -51, -59.5, -68.5, -77.5]) N(sx * 22.2, z);
  N(-12.2, -17); N(12.2, -17); N(-12.2, -22.6); N(12.2, -22.6); N(-6.5, -21.2); N(6.5, -21.2);
  N(0, -12.8, 'bridgeS'); N(0, -21.4, 'bridgeN'); N(0, -22.6, 'stairsBottom'); N(0, -26.2, 'stairsTop');
  N(0, -32); N(0, -38); N(0, -43.6, 'amFront');
  N(-7.5, -28.5); N(7.5, -28.5); N(-7.5, -37); N(7.5, -37); N(-9.6, -40, 'westStairTop');
  N(8.6, -45.6, 'quanAmFront'); N(-8.5, -45.5); N(-8.5, -51.5); N(-8.5, -59.6); N(0, -59.6); N(8.5, -59.6);
  N(-12.7, -40, 'westStairBottom'); N(-16.2, -36.2, 'ringS'); N(-20.0, -40); N(-16.2, -43.8); N(-13.8, -33.5); N(-13.8, -46.5);
  N(-16, -52); N(-16, -59.5); N(-14.5, -27);
  N(12.4, -28); N(12.4, -40); N(12.6, -45.4); N(12.4, -52); N(12.4, -60);
  N(16.8, -34.8); N(16.8, -51.6); N(17.0, -59.8); // dải đất cạnh vườn tháp

  // ---------- Chỗ đứng / ngồi cho khách hành hương AI ----------
  const look = (x, z, lx, lz) => ({ x, z, yaw: U.yawTo(x, z, lx, lz) });
  const S = G.spots;
  S.wander.push(...[[0, -11.6], [-12, -12], [12, -12], [-12.5, -26.5], [12.5, -26.5], [0, -30], [-7.5, -33], [7.5, -33], [-16.2, -48],
    [12.4, -46], [-22.2, -27], [22.2, -37], [0, -59.6], [-8.5, -59.6], [-16, -56]].map(([x, z]) => ({ x, z })));
  S.hallFront.push({ x: -1.4, z: -44.4, yaw: PI }, { x: 1.4, z: -44.4, yaw: PI }, { x: 7.7, z: -46.2, yaw: PI }, { x: 9.5, z: -46.2, yaw: PI },
    look(-16.2, -35.4, BN.x, BN.z), look(-19.9, -37.8, BN.x, BN.z), { x: 16.8, z: -40.4, yaw: PI }, look(15.0, -45.2, 16.8, -43.0));
  S.photo.push(
    { ...look(0, -12.4, 0, -42), subject: { x: 0, z: -42 } }, { ...look(6.4, -26.6, 3.7, -32), subject: { x: 3.7, z: -32 } },
    { ...look(-22.2, -17.5, -22.2, -42), subject: { x: -22.2, z: -42 } });
  S.bench.push(...L.pondBenches.map((b) => ({ x: b.x + Math.sin(b.yaw) * 0.05, z: b.z + Math.cos(b.yaw) * 0.05, yaw: b.yaw, y: b.y })));

  // ---------- Tay nắm cho hoạt động & điểm "dấu ấn hành hương" ----------
  W.ext = {
    cuuPham: { tower: null, center: { x: A.tower.x, z: A.tower.z }, poi: { x: 0, z: -47.2, r: 2.4 }, stand: { x: 0, z: -48.6, yaw: PI },
      cam: { pos: [-1.0, 3.8, -42.6], look: [0, 4.0, -51.2] } },
    baoNghiem: { center: { x: BN.x, z: BN.z }, ringR: BN.ringR, ringIn: 3.1, ringOut: 4.4, poi: { x: BN.x, z: -44.2, r: 2.4 } },
    quanAm: { statue: null, poi: { x: 8.6, z: -47.6, r: 2.2 }, stand: { x: 8.6, z: -48.6, yaw: PI }, cam: { pos: [7.4, 2.9, -44.2], look: [8.6, 2.8, -52.2] } },
    vuonThap: { poi: { x: 13.2, z: -40.4, r: 2.4 }, stand: { x: 12.6, z: -43.0, yaw: PI / 2 }, seat: L.vuonThap.bench, cam: { pos: [10.4, 2.6, -38.6], look: [16.8, 2.6, -43.5] } },
    linhThu: { poi: { x: 0, z: -27.2, r: 2.4 }, animals: L.animals },
    sites: [
      { id: 'cau-da', name: 'Cầu đá & ao Long Trì', rects: [[-11, 11, -21.5, -12.5]] },
      { id: 'linh-thu', name: 'Sân linh thú', rects: [[-6, 6, -43, -26]] },
      { id: 'tich-thien-am', name: 'Tích Thiện Am', rects: [[-5.7, 5.7, -56.6, -44]] },
      { id: 'quan-am', name: 'Điện Quan Âm', rects: [[6.6, 10.6, -54, -45.5]] },
      { id: 'bao-nghiem', name: 'Tháp Báo Nghiêm', rects: [[-20.4, -11.5, -45, -35]] },
      { id: 'vuon-thap', name: 'Vườn tháp', rects: [[11.5, 20.5, -61, -27]] },
      { id: 'hanh-lang', name: 'Hành lang', rects: [[-23.6, -20.6, -79, -13], [20.6, 23.6, -79, -13]] },
    ],
  };
  W.places.push({ label: 'Cầu đá – ao Long Trì', desc: 'Cầu đá vồng qua ao sen sau sân chùa', icon: 'lotus', x: 0, z: -12.2 },
    { label: 'Hành lang dài', desc: 'Hai dãy hành lang có mái chạy dọc hai bên chùa', icon: 'hall', x: -22.2, z: -22 });
  W.fireflyAreas.push({ x: 0, z: -17, r: 9 }, { x: 16, z: -44, r: 6 });
}
