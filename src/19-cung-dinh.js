// =====================================================================
//  TRANG TRÍ CUNG ĐÌNH cho chính điện v4 (phong cách các cung điện cổ Bắc Kinh: đá trắng, đồng, vàng son)
//  Đại Hùng Bảo Điện vẫn là điện thờ Phật: ở đây chỉ mượn NÉT cung đình (tường son, mái ngói vàng, thềm đá trắng,
//  sư tử đồng, vạc đồng, hạc đồng, hoa biểu) — không ngai vàng, không chữ của vua chúa.
//  Dựng theo toạ độ THẾ GIỚI, sau chính điện (18) và trước các điện phụ (17), trang trí sân (12).
//  v4: chân thang, ba tầng nền và thân điện đã lùi 8 m (thân điện còn sâu thêm 10 m, cao thêm 2,5 m) — các vật dưới đây lùi theo (v3 ghi trong ngoặc):
//    - sân chính điện (y 1,2): đôi sư tử đồng trên bệ đá (±9,0; −73,6) [v3 −65,6], ngay trước chân thang (z −74); đôi hoa biểu đá trắng (±9,8; −58,6) giữ nguyên
//    - thềm nền thượng (y 4,8, z −83…−85,3): vạc đồng mạ vàng (±12,8), hạc đồng trên lưng rùa (±5,8),
//      nhật quỹ (−16,4), gia lượng (16,4), cùng z −84,2 [v3 −76,2]
//    - cánh cửa chính mở ép sát mặt TRONG tường trước (z −86,7) [v3 −78,7]: đinh vàng 9×9 + khoen cửa; ô cửa của điện nay cao 6,0 m nên cánh cao 5,8 m [v3 4,35]
//    - kìm nóc (đuôi cá-rồng cuộn) ở hai đầu sống mái ĐỈNH (x ±4,45, y 22,70, z −99,75) [v3 ±7,25, 19,97, −86,5]
//  Mỗi vật gộp vào ít mesh (vc / đồng / vàng), có vật cản, vùng cấm cho cây cảnh (G.decorBans), vài quầng sáng ấm về đêm.
//  Ngân sách ≤ 9 nghìn tam giác (G.cungDinh.tris, G.cungDinh.tally theo từng nhóm).
// =====================================================================
function buildCungDinh(G) {
  const { THREE, util: U, scene } = G;
  const GB = G.build, W = G.world, col = G.collide;
  if (!GB || !W || !G.mats || !G.cam) return;
  const { box, boxMM, cyl, beam, lathe, glow } = GB;
  const PI = Math.PI, TAU = PI * 2, V3 = THREE.Vector3;
  const safe = (name, fn) => { try { fn(); } catch (e) { console.error('[cung đình]', name, e); G.errors.push('cung đình/' + name + ': ' + (e && e.message)); } };

  // ---------- Mốc cao độ (mét) ----------
  const COURT = 1.2, APRON = 4.8; // sân chính điện / mặt thềm thượng (trước hàng cột hiên)

  // ---------- Bảng màu ----------
  const K = {
    marble: 0xece4d4, marbleD: 0xd9d0bd, relief: 0xbfb49c, dragon: 0xb9a679,
    bronze: 0xb08040, bronzeD: 0x7a5530, bronzeL: 0xc9a05a,
    gold: 0xe2b04a, goldL: 0xf6d77c, goldD: 0xa87c2c, kim: 0xf0c050,
    red: 0xb3261e, lac: 0x9a2a1e, lacD: 0x6e1a12, ivory: 0xf3e9d2, dark: 0x1a100a, water: 0x3a6a70, roofY: 0xd6a334, roofD: 0xb8862a,
  };

  // ---------- Bộ gom (một mesh mỗi loại vật liệu) ----------
  const V = U.batch(), M = U.batch(), GL = U.batch();      // sơn (Lambert) / đồng (Phong) / vàng
  const DV = U.batch(), DG = U.batch();                    // cánh cửa chính: sơn / vàng (nội thất: cắt cảnh cùng chính điện)
  // hình chóp chỉ gồm mặt thật (ConeGeometry của three giữ cả tam giác suy biến ở đỉnh): đáy bán kính 0,5 ở y −0,5, đỉnh y +0,5
  const pyr = (n, open) => {
    const pos = [], v = (i) => [0.5 * Math.sin((i / n) * TAU), -0.5, 0.5 * Math.cos((i / n) * TAU)];
    for (let i = 0; i < n; i++) pos.push(0, 0.5, 0, ...v(i), ...v(i + 1));
    if (!open) for (let i = 1; i < n - 1; i++) pos.push(...v(0), ...v(i + 1), ...v(i));
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return g;
  };
  const SPHM = new THREE.SphereGeometry(1, 8, 5), SPHS = new THREE.SphereGeometry(1, 6, 4), SPHT = new THREE.SphereGeometry(1, 5, 3);
  const PY3 = pyr(3), PY4 = pyr(4), NAIL = pyr(4, true);
  const TORC = new THREE.TorusGeometry(0.28, 0.04, 3, 8), TORH = new THREE.TorusGeometry(0.14, 0.035, 3, 6), TORK = new THREE.TorusGeometry(0.13, 0.028, 3, 10), TORB = new THREE.TorusGeometry(0.79, 0.03, 3, 8);
  const VAT = lathe([[0.001, 0], [0.34, 0], [0.5, 0.1], [0.7, 0.4], [0.78, 0.75], [0.8, 1.0], [0.86, 1.1], [0.86, 1.2], [0.7, 1.2], [0.68, 1.0]], 8);
  const MEASURE = lathe([[0.001, 0], [0.28, 0], [0.32, 0.06], [0.31, 0.6], [0.36, 0.66], [0.34, 0.7], [0.28, 0.66]], 8);
  const own = [SPHM, SPHS, SPHT, PY3, PY4, NAIL, TORC, TORH, TORK, TORB, VAT, MEASURE];
  const put = (B, g, color, x, y, z, sx, sy = sx, sz = sx, o) => B.add(g, color, Object.assign({ p: [x, y, z], s: [sx, sy, sz] }, o));
  // thanh tròn rỗng hai đầu nối a → b (bán kính ra ở a, rb ở b): rẻ hơn GB.branch (không nắp)
  const rod = (B, a, b, ra, rb, color, sg = 5) => {
    const g = new THREE.CylinderGeometry(ra, rb, 1, sg, 1, true); g.rotateX(PI / 2);
    const { m, len } = U.segMatrix(a[0], a[1], a[2], b[0], b[1], b[2]);
    B.add(g, color, { s: [1, 1, len], m });
  };
  const trisOf = (B) => { let n = 0; for (const g of B.list) n += g.attributes.position.count / 3; return n; };
  const tally = {}, totalNow = () => trisOf(V) + trisOf(M) + trisOf(GL) + trisOf(DV) + trisOf(DG);
  const count = (name, fn) => { const t0 = totalNow(); safe(name, fn); tally[name] = Math.round(totalNow() - t0); };

  // lật chiều mặt tam giác của hình đã bị soi gương (scale x âm)
  const flipWinding = (g) => {
    for (const k of ['position', 'normal', 'color']) {
      const a = g.attributes[k].array;
      for (let i = 0; i < a.length; i += 9) for (let j = 0; j < 3; j++) { const t = a[i + 3 + j]; a[i + 3 + j] = a[i + 6 + j]; a[i + 6 + j] = t; }
    }
  };
  const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new V3(), _s = new V3(), _m = new THREE.Matrix4();
  // gộp bộ gom tạm T (toạ độ cục bộ) rồi đặt tại (x,y,z): xoay yaw ry rồi nghiêng rx (thứ tự YXZ), thu phóng sc, soi gương mir = −1; đưa vào bộ gom B
  const carry = (T, B, x, y, z, ry = 0, sc = 1, mir = 1, rx = 0) => {
    if (!T.list.length) return;
    const g = U.merge(T.list); T.list.length = 0;
    _e.set(rx, ry, 0, 'YXZ'); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(sc * mir, sc, sc);
    _m.compose(_p, _q, _s); g.applyMatrix4(_m);
    if (mir < 0) flipWinding(g);
    B.addGeo(g);
  };
  const trio = () => ({ V: U.batch(), M: U.batch(), G: U.batch() });
  const carryTrio = (T, x, y, z, ry, sc, mir, rx) => { carry(T.V, V, x, y, z, ry, sc, mir, rx); carry(T.M, M, x, y, z, ry, sc, mir, rx); carry(T.G, GL, x, y, z, ry, sc, mir, rx); };
  const jm = { j: 0.025 };

  // =====================================================================
  //  ĐÔI SƯ TỬ ĐỒNG TRÊN BỆ ĐÁ TRẮNG — sân chính điện, hai bên lối giữa
  // =====================================================================
  // bệ đá trắng 1,4 × 1,8 × 1,1 (gốc: tâm bệ, mặt đất y 0)
  const pedestal = (VB, GB2) => {
    boxMM(VB, -0.7, 0, -0.9, 0.7, 0.16, 0.9, K.marbleD, jm);          // đế
    boxMM(VB, -0.65, 0.16, -0.85, 0.65, 0.26, 0.85, K.marble, jm);    // gờ chân
    boxMM(VB, -0.55, 0.26, -0.75, 0.55, 0.86, 0.75, K.marble, jm);    // thân (eo thắt kiểu bệ Tu Di)
    for (const sz of [-1, 1]) { // ô chạm lõm mặt trước / sau: khung nổi + hoa tròn vàng
      boxMM(VB, -0.4, 0.4, sz * 0.75, 0.4, 0.72, sz * 0.78, K.relief, jm);
      boxMM(VB, -0.32, 0.46, sz * 0.78, 0.32, 0.66, sz * 0.79, K.marbleD, jm);
      cyl(GB2, 0, 0.56, sz * 0.805, 0.09, 0.09, 0.02, K.gold, 6, { r: [PI / 2, 0, 0] });
    }
    boxMM(VB, -0.65, 0.86, -0.85, 0.65, 0.94, 0.85, K.marbleD, jm);   // gờ cổ
    boxMM(VB, -0.7, 0.94, -0.9, 0.7, 1.1, 0.9, K.marble, jm);         // mặt bệ
  };

  // sư tử ngồi (gốc cục bộ: mặt bệ, hướng +z, chân phải = −x đặt lên quả cầu / chú sư tử con); đầu quay ~20° về phía −x
  function lionBody(B, kind) {
    const b = K.bronze, bd = K.bronzeD, bl = K.bronzeL;
    const Mb = B.M, Gb = B.G, Vb = B.V;
    for (const s of [-1, 1]) { // đùi gập + bàn chân sau
      put(Mb, SPHS, b, s * 0.3, 0.34, -0.36, 0.23, 0.3, 0.33);
      put(Mb, SPHT, bd, s * 0.3, 0.06, -0.05, 0.11, 0.06, 0.2);
    }
    put(Mb, SPHM, b, 0, 0.8, -0.1, 0.31, 0.45, 0.55, { r: [-0.45, 0, 0] });   // thân ngả ra sau, ngực ưỡn
    put(Mb, SPHS, bl, 0, 0.9, 0.2, 0.34, 0.4, 0.3);                           // ngực nở
    rod(Mb, [0, 0.95, 0.15], [0, 1.26, 0.32], 0.28, 0.25, b, 6);              // cổ
    for (const [mx, my, mz, mr] of [[0, 0.98, -0.16, 0.15], [0, 0.88, -0.38, 0.15], [0, 0.74, -0.58, 0.13]]) put(Mb, SPHT, bd, mx, my, mz, mr);  // bờm chạy dọc sống lưng
    // chân trước: trái (+x) chống đất; phải (−x) đặt lên quả cầu / con
    rod(Mb, [0.25, 0.98, 0.2], [0.25, 0.1, 0.4], 0.13, 0.1, b, 6);
    put(Mb, SPHT, bd, 0.25, 0.07, 0.5, 0.13, 0.08, 0.19);
    const ph = kind === 'ball' ? 0.4 : 0.35;
    rod(Mb, [-0.25, 0.98, 0.2], [-0.25, ph + 0.06, 0.5], 0.13, 0.1, b, 6);
    put(Mb, SPHT, bd, -0.25, ph, 0.58, 0.13, 0.08, 0.19);
    if (kind === 'ball') { // quả cầu thêu: cầu vàng
      put(Gb, SPHS, K.gold, -0.25, 0.17, 0.64, 0.19, 0.19, 0.19);
    } else { // sư tử con nằm dưới chân: thân, đầu, bờm, tai
      put(Mb, SPHS, K.goldL, -0.25, 0.16, 0.64, 0.16, 0.14, 0.2);             // con: thân sáng màu hơn để dễ nhận
      put(Mb, SPHS, K.goldL, -0.25, 0.25, 0.86, 0.12, 0.11, 0.12);
      for (const s of [-1, 1]) { put(Mb, PY3, bd, -0.25 + s * 0.09, 0.37, 0.83, 0.06, 0.09, 0.06); put(Mb, SPHT, bd, -0.25 + s * 0.11, 0.24, 0.8, 0.055); }
      put(Mb, SPHT, bd, -0.25, 0.15, 0.46, 0.06);
    }
    // vòng cổ dải lụa đỏ + ba chuông vàng + hai đuôi dải
    put(Vb, TORC, K.red, 0, 1.0, 0.25, 1, 1, 1.15, { r: [PI / 2 - 0.45, 0, 0] });
    for (const [bx, by, bz] of [[0, 0.88, 0.5], [-0.13, 0.91, 0.47], [0.13, 0.91, 0.47]]) put(Gb, SPHT, K.gold, bx, by, bz, 0.055);
    boxMM(Vb, 0.03, 0.66, 0.48, 0.1, 0.84, 0.5, K.red); boxMM(Vb, -0.1, 0.64, 0.47, -0.03, 0.82, 0.49, K.red);
    // đuôi cuộn lên lưng
    [[0, 0.5, -0.78, 0.12], [0.02, 0.72, -0.84, 0.12], [0.07, 0.92, -0.8, 0.11], [0.1, 1.06, -0.68, 0.09]].forEach(([tx, ty, tz, tr], i) => put(Mb, SPHT, i % 2 ? bd : bl, tx, ty, tz, tr));
    // đầu (toạ độ đầu: gốc tại trục cổ, +z phía trước)
    const H = trio();
    put(H.M, SPHM, b, 0, 0, 0, 0.35, 0.3, 0.3);                      // sọ + má: mặt rộng, dẹt
    put(H.M, SPHS, bl, 0, -0.1, 0.24, 0.22, 0.12, 0.15);             // mõm ngắn, bè
    put(H.M, SPHT, K.dark, 0, -0.04, 0.37, 0.09, 0.055, 0.05);       // mũi
    box(H.M, 0, -0.33, 0.23, 0.2, 0.06, 0.28, bd, { r: [0.3, 0, 0] });  // hàm dưới (há miệng)
    put(H.V, SPHT, K.red, 0, -0.26, 0.25, 0.14, 0.05, 0.17);         // lòng miệng đỏ
    for (const [tx, tz] of [[-0.08, 0.36], [0.08, 0.36], [-0.15, 0.27], [0.15, 0.27]]) put(H.V, PY3, K.ivory, tx, -0.24, tz, 0.06, 0.12, 0.06, { r: [PI, 0, 0] }); // nanh trên
    for (const tx of [-0.06, 0.06]) put(H.V, PY3, K.ivory, tx, -0.29, 0.34, 0.05, 0.1, 0.05);                                                                   // nanh dưới
    for (const s of [-1, 1]) {
      put(H.G, SPHT, K.gold, s * 0.17, 0.1, 0.24, 0.085);                                      // mắt vàng to
      put(H.M, SPHT, K.dark, s * 0.17, 0.1, 0.31, 0.035);                                      // đồng tử
      put(H.M, PY3, bd, s * 0.17, 0.22, 0.24, 0.1, 0.16, 0.1, { r: [0, 0, s * -1.2] });         // lông mày
      put(H.M, SPHT, b, s * 0.28, 0.2, -0.04, 0.06, 0.08, 0.04);                               // tai nhỏ, ẩn trong bờm
    }
    for (let i = 0; i < 10; i++) { // bờm: vòng cầu xoăn quanh mặt
      const a = (i / 10) * TAU + 0.3, r = 0.43, rad = i % 2 ? 0.13 : 0.16;
      put(H.M, SPHS, i % 2 ? b : bd, Math.sin(a) * r, Math.cos(a) * r * 0.95 - 0.02, -0.1 + (i % 2 ? -0.05 : 0.02), rad);
    }
    for (const [mx, my, mz, mr] of [[-0.2, 0.05, -0.32, 0.18], [0.2, 0.05, -0.32, 0.18], [0, 0.26, -0.3, 0.17], [0, -0.28, 0.04, 0.12], [-0.13, -0.27, 0.02, 0.1], [0.13, -0.27, 0.02, 0.1]]) put(H.M, SPHT, bl, mx, my, mz, mr);
    carry(H.M, Mb, 0, 1.36, 0.36, -0.35, 1.18, 1, -0.08); carry(H.G, Gb, 0, 1.36, 0.36, -0.35, 1.18, 1, -0.08); carry(H.V, Vb, 0, 1.36, 0.36, -0.35, 1.18, 1, -0.08);
  }

  const LION_X = 9.0, LION_Z = -73.6, LION_SC = 0.9; // v4: z −73,6 (v3 −65,6), lùi cùng chân thang; bệ chiếm z −74,55 … −72,65 (sau lưng bệ còn 1,25 m tới mặt tầng 1, z −75,8); heightAt = 1,2 trên cả bệ
  const lionAt = (x, z, mir, kind) => {
    const L = trio();
    pedestal(L.V, L.G);
    const B = trio();
    lionBody(B, kind);
    carry(B.V, L.V, 0, 1.1, 0.07, 0, LION_SC); carry(B.M, L.M, 0, 1.1, 0.07, 0, LION_SC); carry(B.G, L.G, 0, 1.1, 0.07, 0, LION_SC);
    carry(L.V, V, x, COURT, z, 0, 1, mir); carry(L.M, M, x, COURT, z, 0, 1, mir); carry(L.G, GL, x, COURT, z, 0, 1, mir);
  };
  count('sư tử', () => {
    lionAt(LION_X, LION_Z, 1, 'ball');      // đông: quả cầu dưới chân phải
    lionAt(-LION_X, LION_Z, -1, 'cub');     // tây: sư tử con (soi gương: chân có con là chân trái)
  });

  // =====================================================================
  //  ĐÔI HOA BIỂU ĐÁ TRẮNG — hai bên lối giữa, ngay sau Tích Thiện Am
  // =====================================================================
  function hoaBieu(x, z, hand) {
    const y0 = COURT;
    // đế bát giác hai tầng + bốn trụ nhỏ ở góc
    cyl(V, x, y0 + 0.13, z, 0.78, 0.82, 0.26, K.marbleD, 8, { r: [0, PI / 8, 0], j: 0.03 });
    cyl(V, x, y0 + 0.39, z, 0.62, 0.66, 0.26, K.marble, 8, { r: [0, PI / 8, 0], j: 0.03 });
    for (let k = 0; k < 4; k++) { const a = PI / 8 + (k / 4) * TAU, px = x + Math.sin(a) * 0.72, pz = z + Math.cos(a) * 0.72; boxMM(V, px - 0.06, y0 + 0.26, pz - 0.06, px + 0.06, y0 + 0.52, pz + 0.06, K.marbleD, jm); }
    // thân cột bát giác 6,5 m, thon dần, chân cột có gờ
    const Hb = y0 + 0.55, SH = 6.5;
    cyl(V, x, Hb + 0.08, z, 0.48, 0.52, 0.16, K.marbleD, 8, { r: [0, PI / 8, 0], j: 0.03 });
    cyl(V, x, Hb + SH / 2, z, 0.36, 0.42, SH, K.marble, 8, { r: [0, PI / 8, 0], j: 0.03 });
    // rồng cuốn quanh thân: dải xoắn mảnh màu vàng xám + vảy vàng + đầu rồng ở chân cột
    const N = 12, turns = 2.2, a0 = hand > 0 ? 0.5 : 2.2;
    let prev = null;
    for (let i = 0; i <= N; i++) {
      const t = i / N, a = a0 + hand * t * turns * TAU, f = 0.07 + 0.72 * t, rr = 0.42 - 0.06 * f + 0.025;
      const pt = [x + Math.sin(a) * rr, Hb + SH * f, z + Math.cos(a) * rr];
      if (prev) beam(V, prev, pt, 0.13, 0.09, K.dragon);
      if (i % 4 === 2) put(GL, SPHT, K.gold, pt[0], pt[1], pt[2], 0.07);
      if (i === 0) { put(GL, SPHT, K.gold, pt[0], pt[1], pt[2], 0.12, 0.1, 0.13); put(GL, PY3, K.goldD, pt[0] + Math.sin(a) * 0.05, pt[1] + 0.13, pt[2] + Math.cos(a) * 0.05, 0.07, 0.16, 0.07); }
      prev = pt;
    }
    // vân mây: hai tấm đá giao nhau (đông–tây và nam–bắc) ở độ cao 5 m
    const yc = y0 + 5.0;
    for (const rot of [0, PI / 2]) {
      const T = { V: U.batch() };
      boxMM(T.V, -0.8, -0.2, -0.045, 0.8, 0.2, 0.045, K.marble, jm);
      for (const s of [-1, 1]) put(T.V, SPHT, K.marble, s * 0.8, 0.0, 0, 0.27, 0.27, 0.05);
      put(T.V, SPHT, K.marbleD, 0, 0.24, 0, 0.26, 0.2, 0.05);
      carry(T.V, V, x, yc, z, rot);
    }
    // đỉnh: mũ cột loe, đĩa thừa lộ bàn tròn, thú nhỏ ngồi xổm trên đĩa
    const ys = Hb + SH;
    cyl(V, x, ys + 0.09, z, 0.52, 0.36, 0.18, K.marbleD, 8, { r: [0, PI / 8, 0], j: 0.03 });
    cyl(V, x, ys + 0.24, z, 0.62, 0.62, 0.12, K.marble, 10, { j: 0.03 });
    const yd = ys + 0.3;
    put(V, SPHS, K.marbleD, x, yd + 0.2, z, 0.2, 0.19, 0.27);
    put(V, SPHT, K.marble, x, yd + 0.42, z + 0.2, 0.13, 0.12, 0.13);
    for (const s of [-1, 1]) { put(V, PY3, K.marbleD, x + s * 0.09, yd + 0.58, z + 0.17, 0.08, 0.17, 0.08); put(V, SPHT, K.marbleD, x + s * 0.13, yd + 0.08, z + 0.26, 0.07, 0.06, 0.1); }
    put(V, PY3, K.marbleD, x, yd + 0.3, z - 0.3, 0.12, 0.32, 0.12, { r: [-1.2, 0, 0] });
  }
  count('hoa biểu', () => { hoaBieu(9.8, -58.6, 1); hoaBieu(-9.8, -58.6, -1); });

  // =====================================================================
  //  THỀM THƯỢNG (y 4,8): VẠC ĐỒNG MẠ VÀNG, HẠC ĐỒNG TRÊN LƯNG RÙA, NHẬT QUỸ, GIA LƯỢNG
  // =====================================================================
  const AZ = -84.2; // v4: giữa thềm thượng (chân thang trên cùng −83, hàng cột hiên −85,9); v3 −76,2
  function vat(x) {
    const y = APRON;
    cyl(V, x, y + 0.14, AZ, 0.88, 0.95, 0.28, K.marbleD, 8, { j: 0.03 });                  // vòng đá đỡ
    cyl(V, x, y + 0.33, AZ, 0.8, 0.86, 0.1, K.marble, 8, { j: 0.03 });
    GL.add(VAT, K.gold, { p: [x, y + 0.38, AZ], j: 0.05 });                                // thân vạc mạ vàng
    cyl(M, x, y + 0.38 + 1.1, AZ, 0.69, 0.69, 0.025, K.water, 6);                           // mặt nước
    GL.add(TORB, K.goldD, { p: [x, y + 0.38 + 0.78, AZ], r: [PI / 2, 0, 0] });              // đai chạm quanh bụng
    for (const s of [-1, 1]) { // hai quai vòng + mặt thú ngậm vòng
      put(GL, SPHT, K.gold, x + s * 0.83, y + 0.38 + 1.02, AZ, 0.1, 0.1, 0.07);
      put(GL, PY3, K.goldD, x + s * 0.83, y + 0.38 + 1.14, AZ + 0.05, 0.07, 0.13, 0.07);
      put(GL, TORH, K.goldL, x + s * 0.88, y + 0.38 + 0.84, AZ, 1, 1, 1, { r: [0, PI / 2, 0] });
    }
  }
  count('vạc', () => { vat(12.8); vat(-12.8); });

  // hạc đồng đứng trên lưng rùa — dáng và màu như đôi hạc trong điện (18), thu nhỏ để vừa thềm
  function crane(x, yaw) {
    const TM = U.batch(), TG = U.batch(), bz = K.bronze, bd = K.bronzeD;
    put(TM, SPHS, bd, 0, 0.22, 0, 0.95, 0.22, 1.25);                      // yếm rùa
    put(TM, SPHM, bz, 0, 0.5, 0, 0.85, 0.42, 1.12);                       // mai
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.4; put(TG, SPHT, K.goldD, Math.sin(a) * 0.4, 0.86, Math.cos(a) * 0.5, 0.22, 0.06, 0.22); }
    put(TG, SPHT, K.goldD, 0, 0.92, 0, 0.26, 0.06, 0.28);
    put(TM, SPHT, bz, 0, 0.46, 1.1, 0.2, 0.17, 0.3);                      // đầu rùa (ngắn lại để không chạm lan can)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(TM, SPHT, bd, sx * 0.86, 0.16, sz * 0.62, 0.32, 0.11, 0.22, { r: [0, sx * sz * 0.5, 0] });
    put(TM, PY3, bd, 0, 0.3, -1.4, 0.2, 0.4, 0.14, { r: [-PI / 2 - 0.2, 0, 0] });
    for (const sx of [-1, 1]) rod(TG, [sx * 0.17, 0.9, 0.05], [sx * 0.17, 2.1, 0.05], 0.04, 0.045, K.goldD, 5); // chân hạc
    put(TM, SPHS, bz, 0, 2.3, 0, 0.3, 0.27, 0.66);                        // thân
    for (const sx of [-1, 1]) put(TM, SPHT, bd, sx * 0.3, 2.28, -0.12, 0.07, 0.27, 0.6, { r: [0, 0, sx * 0.14] }); // cánh
    for (const dx of [-0.1, 0, 0.1]) put(TM, PY3, bd, dx, 2.18, -1.0, 0.12, 0.95, 0.06, { r: [-1.35, 0, dx * 1.5] }); // đuôi
    const neck = [[0, 2.45, 0.5], [0, 2.8, 0.7], [0, 3.15, 0.52], [0, 3.42, 0.62], [0, 3.55, 0.86]];
    for (let i = 0; i < 4; i++) rod(TM, neck[i], neck[i + 1], 0.07 - i * 0.008, 0.063 - i * 0.008, bz, 5);
    cyl(TG, 0, 2.5, 0.48, 0.1, 0.1, 0.07, K.gold, 6);
    put(TM, SPHT, bz, 0, 3.58, 0.92, 0.085, 0.085, 0.13);                 // đầu
    put(TG, SPHT, 0xb32a1e, 0, 3.67, 0.9, 0.055);                         // chỏm đỏ
    rod(TG, [0, 3.56, 1.04], [0, 3.48, 1.6], 0.035, 0.01, K.gold, 5);      // mỏ ngậm nụ sen
    put(TG, PY4, 0xf2a8c0, 0, 3.5, 1.66, 0.2, 0.32, 0.2, { r: [PI / 2 + 0.2, 0, 0] });
    carry(TM, M, x, APRON, AZ, yaw, 0.86); carry(TG, GL, x, APRON, AZ, yaw, 0.86);
  }
  count('hạc đồng', () => { crane(-5.8, 0.5); crane(5.8, -0.5); });

  // nhật quỹ: bệ vuông + mặt đồng hồ tròn nghiêng (12 vạch ở mặt hướng nam–xuống, kim ở giữa)
  count('nhật quỹ', () => {
    const x = -16.4, y = APRON;
    boxMM(V, x - 0.5, y, AZ - 0.5, x + 0.5, y + 0.16, AZ + 0.5, K.marbleD, jm);
    boxMM(V, x - 0.4, y + 0.16, AZ - 0.4, x + 0.4, y + 0.26, AZ + 0.4, K.marble, jm);
    boxMM(V, x - 0.28, y + 0.26, AZ - 0.28, x + 0.28, y + 0.95, AZ + 0.28, K.marble, jm);
    boxMM(GL, x - 0.295, y + 0.52, AZ - 0.295, x + 0.295, y + 0.57, AZ + 0.295, K.gold);
    boxMM(V, x - 0.4, y + 0.95, AZ - 0.4, x + 0.4, y + 1.07, AZ + 0.4, K.marbleD, jm);
    boxMM(V, x - 0.1, y + 1.07, AZ - 0.1, x + 0.1, y + 1.74, AZ + 0.1, K.marble, jm);     // trụ đỡ mặt đồng hồ
    // mặt đồng hồ: đĩa đá (trục y cục bộ) nghiêng 50° — mặt có vạch quay xuống phía nam, hơi hướng vào lối giữa; kim xuyên tâm
    const T = trio();
    cyl(T.V, 0, 0.0, 0, 0.72, 0.72, 0.1, K.marble, 16, { j: 0.03 });
    cyl(T.V, 0, 0.0, 0, 0.77, 0.77, 0.05, K.marbleD, 16, { j: 0.03 });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; box(T.G, Math.sin(a) * 0.5, -0.06, Math.cos(a) * 0.5, 0.05, 0.02, 0.22, i % 3 ? K.goldD : K.gold, { r: [0, a, 0] }); }
    cyl(T.G, 0, 0.12, 0, 0.02, 0.02, 0.9, K.gold, 5);
    put(T.G, SPHT, K.goldL, 0, 0.58, 0, 0.045);
    put(T.G, SPHT, K.gold, 0, -0.33, 0, 0.045);
    carryTrio(T, x, y + 1.74, AZ, 0.55, 1, 1, -0.87);
  });

  // gia lượng (đồ đong lúa chuẩn): đài đá vuông, bốn cột son, mái ngói vàng chóp tứ giác, bình đồng bên trong
  count('gia lượng', () => {
    const x = 16.4, y = APRON;
    boxMM(V, x - 0.65, y, AZ - 0.65, x + 0.65, y + 0.2, AZ + 0.65, K.marbleD, jm);
    boxMM(V, x - 0.55, y + 0.2, AZ - 0.55, x + 0.55, y + 0.34, AZ + 0.55, K.marble, jm);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(V, x + sx * 0.46, y + 0.34 + 0.7, AZ + sz * 0.46, 0.06, 0.07, 1.4, K.lac, 6);
    for (const s of [-1, 1]) { boxMM(V, x - 0.52, y + 1.74, AZ + s * 0.46 - 0.04, x + 0.52, y + 1.82, AZ + s * 0.46 + 0.04, K.lacD); boxMM(V, x + s * 0.46 - 0.04, y + 1.74, AZ - 0.52, x + s * 0.46 + 0.04, y + 1.82, AZ + 0.52, K.lacD); }
    boxMM(V, x - 0.8, y + 1.82, AZ - 0.8, x + 0.8, y + 1.9, AZ + 0.8, K.roofD);
    put(V, PY4, K.roofY, x, y + 2.15, AZ, 2.2, 0.5, 2.2, { r: [0, PI / 4, 0] });
    put(GL, SPHT, K.gold, x, y + 2.47, AZ, 0.07, 0.1, 0.07);
    M.add(MEASURE, K.bronze, { p: [x, y + 0.34, AZ], j: 0.05 });
    cyl(GL, x, y + 0.34 + 0.45, AZ, 0.345, 0.345, 0.05, K.gold, 8);
    for (const s of [-1, 1]) boxMM(M, x + s * 0.33 - 0.04, y + 0.34 + 0.45, AZ - 0.06, x + s * 0.33 + 0.04, y + 0.34 + 0.6, AZ + 0.06, K.bronzeD);
  });

  // =====================================================================
  //  CỬA CHÍNH: hai cánh mở ép sát mặt TRONG tường trước (z −86,7), mặt có đinh vàng 9×9 + khoen cửa quay vào lòng điện
  // =====================================================================
  // v4: mặt trong tường trước = ZF + DZ − WT = −64,3 − 22 − 0,4 = −86,7 (v3 −78,7). Ô cửa chính của 18 rộng 7,2 m (x ±3,6; khuôn gỗ x ±3,45 … ±3,75), mở cao đúng 6,0 m trên sàn:
  // đỉnh ô cửa ở thế giới y 10,8 = sàn 4,8 + 6,0 (đà cửa nằm trên đỉnh đó). Cánh cao 5,8 m → đỉnh cánh y 10,6, cách đỉnh ô cửa 0,2 m (≥ 0,1 m); v3 cao 4,35 m trong ô cửa chỉ cao ≈ 4,5 m.
  const ZWALL = -86.7, DZF = ZWALL - 0.115, DOOR_H = 5.8;
  count('cửa chính', () => {
    const y0 = APRON, y1 = APRON + DOOR_H, zf = DZF - 0.012, fr = 0.12;
    for (const sx of [-1, 1]) {
      const xh = sx * 3.62, xf = sx * 7.1;                          // đầu bản lề (sát khung cửa) → cạnh tự do
      boxMM(DV, xh, y0, DZF, xf, y1, ZWALL - 0.005, K.lac, jm);     // cánh sơn son dày 0,115
      boxMM(DG, xh, y0, zf, xf, y0 + fr, DZF, K.goldD); boxMM(DG, xh, y1 - fr, zf, xf, y1, DZF, K.goldD);
      boxMM(DG, xh, y0, zf, xh + sx * fr, y1, DZF, K.goldD); boxMM(DG, xf - sx * fr, y0, zf, xf, y1, DZF, K.goldD);
      const wid = Math.abs(xf - xh), gx = (wid - 0.56) / 8, gy = (DOOR_H - 1.0) / 8;
      for (let c = 0; c < 9; c++) for (let r = 0; r < 9; r++) {
        if (c === 7 && r === 4) continue;                           // chỗ khoen cửa
        put(DG, NAIL, K.goldL, xh + sx * (0.28 + c * gx), y0 + 0.5 + r * gy, DZF - 0.03, 0.15, 0.06, 0.15, { r: [-PI / 2, PI / 4, 0], j: 0.04 });
      }
      const kx = xh + sx * (0.28 + 7 * gx), ky = y0 + 0.5 + 4 * gy;
      put(DG, SPHT, K.gold, kx, ky, DZF - 0.02, 0.17, 0.17, 0.07);  // núm cửa
      put(DG, TORK, K.goldL, kx, ky - 0.17, DZF - 0.06, 1, 1, 1);   // khoen tròn
    }
  });

  // =====================================================================
  //  KÌM NÓC: đuôi cá-rồng cuộn ở hai đầu sống ba mái (đuôi cuốn vào trong, vây lưng nhọn, đầu há ngậm sống mái)
  // =====================================================================
  const KP = [[-0.25, 0.0], [0.0, 0.45], [0.18, 0.95], [0.08, 1.45], [-0.2, 1.8], [-0.55, 1.85], [-0.8, 1.6], [-0.82, 1.3]];
  const KR = [0.28, 0.27, 0.24, 0.21, 0.17, 0.12, 0.08, 0.04];
  function kim(sx, x, y, z, sc) {
    const T = trio();
    for (let i = 0; i < 7; i++) rod(T.G, [KP[i][0], KP[i][1], 0], [KP[i + 1][0], KP[i + 1][1], 0], KR[i], KR[i + 1], i % 2 ? K.goldL : K.kim, 5);
    for (let i = 1; i <= 6; i++) { // vây lưng: gai nhọn ở phía lồi của đường cong
      const a = KP[i - 1], b = KP[i + 1], tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty), nx = ty / tl, ny = -tx / tl, L = 0.42 - i * 0.04;
      put(T.G, PY3, K.gold, KP[i][0] + nx * (KR[i] + L * 0.3), KP[i][1] + ny * (KR[i] + L * 0.3), 0, 0.12, L, 0.12, { r: [0, 0, -Math.atan2(nx, ny)] });
    }
    put(T.G, SPHT, K.kim, -0.3, 0.24, 0, 0.36, 0.26, 0.28);                                             // đầu
    put(T.G, PY4, K.gold, -0.72, 0.3, 0, 0.28, 0.46, 0.28, { r: [0, 0, PI / 2] });                      // hàm trên (mõm hướng vào trong)
    put(T.G, PY4, K.goldD, -0.64, 0.04, 0, 0.22, 0.36, 0.22, { r: [0, 0, PI / 2 + 0.35] });             // hàm dưới
    put(T.G, PY3, K.goldD, -0.2, 0.56, 0, 0.14, 0.4, 0.14, { r: [0, 0, 0.5] });                          // sừng
    for (const s of [-1, 1]) put(T.V, SPHT, K.red, -0.4, 0.4, s * 0.17, 0.07);                           // mắt đỏ
    carry(T.G, GL, sx * x, y, z, 0, sc, sx); carry(T.V, V, sx * x, y, z, 0, sc, sx);
  }
  // đầu sống mái sau khi dời (v4): x = ±(R + 0,25), y = mặt trên khối nóc (= tâm sống + 0,13; v3 cũng đặt đúng ở đó), z trục chung ZC.
  // Mái đỉnh trong 18 (khung v2): addRoof(X.S, 0, 17,1, ZC −77,75, rộng 23,4, sâu 15, cao 2,53, {pearl}) → R = (23,4 − 15)/2 = 4,2; khối nóc cao 0,26 có tâm ở 17,1 + 2,53 + 0,06 = 19,69,
  // mặt trên v2 19,82 → thế giới 22,70 (+DY 2,88); ZC → thế giới −77,75 − 22 = −99,75. (v3: R = 7, mặt trên 19,97, z −86,5.)
  // Chỉ mái tầng 3 (mái đỉnh) có sống nóc lộ ra: sống mái tầng 2 (R = 2,5, y v2 17,1) nằm trọn trong tường gác + mái tầng 3, còn sống mái
  // tầng 1 (R = 4,5) bị 18 cắt bỏ cùng phần mái gian giữa — kìm đặt ở đó sẽ chìm trong mái (đã thử ở v3, chỉ thấy hàm nhô ra khỏi ngói).
  const KIM_X = 4.45, KIM_Y = 22.7, KIM_Z = -99.75, KIM_SC = 1.3;
  count('kìm nóc', () => {
    for (const sx of [-1, 1]) kim(sx, KIM_X, KIM_Y, KIM_Z, KIM_SC);
  });

  // =====================================================================
  //  GỘP MESH, VẬT CẢN, VÙNG CẤM, QUẦNG SÁNG
  // =====================================================================
  let tris = 0;
  const meshes = [];
  const addMesh = (B, mat, name, o) => {
    if (!B.list.length) return null;
    const m = B.mesh(mat, o); m.name = 'cungDinh:' + name; scene.add(m); meshes.push(m); tris += m.geometry.attributes.position.count / 3;
    return m;
  };
  safe('mesh', () => {
    addMesh(V, G.mats.vc, 'son', { cast: true, receive: true });
    addMesh(M, G.mats.metal, 'dong', { cast: true, receive: true });
    addMesh(GL, G.mats.gold, 'vang', { cast: true, receive: true });
    const dm = [addMesh(DV, G.mats.vc, 'cua-son', { cast: false, receive: true }), addMesh(DG, G.mats.gold, 'cua-vang', { cast: false, receive: true })].filter(Boolean);
    if (W.chinhDien && W.chinhDien.meshIn) for (const m of dm) W.chinhDien.meshIn.push(m); // cánh cửa ở trong điện: chỉ vẽ khi máy quay lại gần (cắt cảnh của 18)
  });
  for (const g of own) g.dispose();

  safe('vật cản', () => {
    G.decorBans = G.decorBans || [];
    const ban = (x, z, rx, rz = rx) => G.decorBans.push([x - rx, x + rx, z - rz, z + rz]);
    for (const s of [-1, 1]) {
      col.box(s * LION_X - 0.75, LION_Z - 0.95, s * LION_X + 0.75, LION_Z + 0.95, 'lion');              // bệ sư tử (1,4 × 1,8 + đệm 5 cm)
      G.cam.blockers.push(new THREE.Box3(new V3(s * LION_X - 0.7, COURT, LION_Z - 0.9), new V3(s * LION_X + 0.7, COURT + 2.7, LION_Z + 0.9)));
      ban(s * LION_X, LION_Z, 1.3, 1.5);
      col.circle(s * 9.8, -58.6, 0.85, 'hoabieu'); ban(s * 9.8, -58.6, 1.2);
      col.circle(s * 12.8, AZ, 0.9, 'vac'); ban(s * 12.8, AZ, 1.4, 1.2);
      col.circle(s * 5.8, AZ, 0.8, 'hac'); ban(s * 5.8, AZ, 1.2, 1.2);
    }
    col.circle(-16.4, AZ, 0.7, 'nhatqui'); ban(-16.4, AZ, 1.1, 1.1);
    col.circle(16.4, AZ, 0.9, 'gialuong'); ban(16.4, AZ, 1.3, 1.2);
  });

  safe('quầng sáng', () => { // vừa đủ ấm về đêm: chân bệ sư tử và miệng vạc
    for (const s of [-1, 1]) {
      glow(s * LION_X, COURT + 1.5, LION_Z + 0.5, 1.1, [1.0, 0.78, 0.42], true);
      glow(s * 12.8, APRON + 1.9, AZ, 1.0, [1.0, 0.74, 0.38], true);
    }
  });

  G.cungDinh = { tris: Math.round(tris), tally, meshes };
}
