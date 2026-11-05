// =====================================================================
//  ĐIỆN PHỤ: bộ dựng điện nhỏ dùng chung (cột son, mái cong, biển tên, bệ thờ, tượng) rồi dựng
//  Điện Dược Sư, Điện Địa Tạng, Quan Âm Các; cộng điện Văn Thù trong lòng tháp Báo Nghiêm.
//  Mỗi điện dựng ở toạ độ cục bộ (gốc ở giữa mép cửa, +z hướng ra sân, trong điện là −z) rồi dời nguyên khối ra thế giới.
//  Hoạt động "Lễ": ngồi trước tượng, đọc vài dòng giới thiệu, chọn lời mong, lễ ba lạy nhẹ — không hứa điều gì sẽ thành.
//  Chạy trước buildDecorInside (99-boot.js) để cây cảnh, đèn đá tự tránh các điện này.
// =====================================================================
function buildDienPhu(G) {
  const { THREE, util: U, scene } = G;
  const PI = Math.PI, W = G.world, col = G.collide, L2 = G.L2, KB = G.build;
  if (!KB || !W || !L2) return;
  const { C, BOX, box, boxMM, cyl, lathe, branch, addRoof, addSign, glow, hangLanternInto, columnInto } = KB;
  W.smokeSpots = W.smokeSpots || [];
  G.decorBans = G.decorBans || [];

  // ---------- Bộ gom chung: 5 mesh cho cả bốn điện ----------
  const WS = U.batch(), WF = U.batch(), WM = U.batch(), WL = U.batch(), WG = U.batch();
  const SPH = new THREE.SphereGeometry(1, 10, 7), SPL = new THREE.SphereGeometry(1, 7, 5), HEAD = new THREE.SphereGeometry(1, 14, 10);
  const CAP = new THREE.SphereGeometry(1, 14, 7, 0, PI * 2, 0, PI * 0.43), HOOD = new THREE.SphereGeometry(1, 14, 8, 0, PI * 2, 0, PI * 0.62);
  const CN4 = new THREE.ConeGeometry(0.5, 1, 4), CN6 = new THREE.ConeGeometry(0.5, 1, 6);
  const own = [SPH, SPL, HEAD, CAP, HOOD, CN4, CN6];
  const frame = (ox, oz, yaw) => { // toạ độ cục bộ (x ngang, z ra sân) ↔ thế giới
    const c = Math.cos(yaw), s = Math.sin(yaw);
    return { ox, oz, yaw, mat: new THREE.Matrix4().makeRotationY(yaw).setPosition(ox, 0, oz),
      X: (x, z) => ox + x * c + z * s, Z: (x, z) => oz - x * s + z * c, lx: (X, Z) => (X - ox) * c - (Z - oz) * s, lz: (X, Z) => (X - ox) * s + (Z - oz) * c };
  };
  const locals = () => ({ S: U.batch(), F: U.batch(), M: U.batch(), L: U.batch(), G: U.batch() });
  const flush = (T, fr) => {
    for (const [k, w] of [['S', WS], ['F', WF], ['M', WM], ['L', WL], ['G', WG]]) {
      if (T[k].list.length) { const g = U.merge(T[k].list); g.applyMatrix4(fr.mat); w.addGeo(g); T[k].list.length = 0; }
    }
  };
  const colBox = (fr, x0, z0, x1, z1, tag) => col.box(fr.X(x0, z0), fr.Z(x0, z0), fr.X(x1, z1), fr.Z(x1, z1), tag);
  const colCirc = (fr, x, z, r, tag) => col.circle(fr.X(x, z), fr.Z(x, z), r, tag);
  const blk = (fr, x0, y0, z0, x1, y1, z1) => {
    const xa = fr.X(x0, z0), xb = fr.X(x1, z1), za = fr.Z(x0, z0), zb = fr.Z(x1, z1);
    G.cam.blockers.push(new THREE.Box3(new THREE.Vector3(Math.min(xa, xb), y0, Math.min(za, zb)), new THREE.Vector3(Math.max(xa, xb), y1, Math.max(za, zb))));
  };
  const bboxW = (fr, x0, z0, x1, z1) => { // hộp cục bộ → hộp thế giới [x0, x1, z0, z1]
    const xs = [fr.X(x0, z0), fr.X(x1, z1), fr.X(x0, z1), fr.X(x1, z0)], zs = [fr.Z(x0, z0), fr.Z(x1, z1), fr.Z(x0, z1), fr.Z(x1, z0)];
    return [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
  };
  const toWorldFx = (fr, g0, s0) => { // quầng sáng + khói dựng ở toạ độ cục bộ → thế giới
    for (const q of W.glows.slice(g0)) { const x = q.x, z = q.z; q.x = fr.X(x, z); q.z = fr.Z(x, z); }
    for (const q of W.smokeSpots.slice(s0)) { const x = q[0], z = q[2]; q[0] = fr.X(x, z); q[2] = fr.Z(x, z); }
  };
  const owner = [];            // các toà đã dựng: dùng để dọn nút dẫn đường / chỗ đứng cũ nằm trong toà
  const floors = [];           // hàm độ cao nền của từng toà
  const hallsLe = {};          // dữ liệu cho hoạt động Lễ

  // ---------- Hình dùng lại cho tượng ----------
  const ell = (T, x, y, z, rx, ry, rz, c, o) => T.add(SPH, c, Object.assign({ p: [x, y, z], s: [rx, ry, rz] }, o));
  const limb = (T, a, b, r1, r2, c) => branch(T, a, b, r1, r2, c, 7);
  const petals = (T, cx, y, cz, R, n, len, wid, tilt, c, ph = 0) => { // vòng cánh sen: gốc ở bán kính R, nghiêng tilt
    const st = Math.sin(tilt), ct = Math.cos(tilt);
    for (let i = 0; i < n; i++) { const a = ph + (i / n) * PI * 2, m = R + (st * len) / 2; T.add(CN4, c, { p: [cx + Math.sin(a) * m, y + (ct * len) / 2, cz + Math.cos(a) * m], s: [wid, len, wid * 0.4], r: [tilt, a, 0], order: 'YXZ' }); }
  };
  const goldC = C.gold, goldD = C.goldD, maroon = 0x7a2418;
  const lotusBig = (T, c1, c2, c3) => { // đài sen lớn như tượng chính điện (cao ~0.82)
    T.add(lathe([[1.3, 0], [1.32, 0.16], [1.18, 0.22], [1.02, 0.36], [0, 0.36]], 14), c1);
    for (let i = 0; i < 14; i++) { const a = (i / 14) * PI * 2; T.add(SPL, c3, { p: [Math.sin(a) * 0.98, 0.5, Math.cos(a) * 0.98], s: [0.27, 0.3, 0.126], r: [0.5, a, 0], order: 'YXZ' }); }
    for (let i = 0; i < 14; i++) { const a = ((i + 0.5) / 14) * PI * 2; T.add(SPL, c2, { p: [Math.sin(a) * 0.8, 0.66, Math.cos(a) * 0.8], s: [0.24, 0.29, 0.11], r: [0.28, a, 0], order: 'YXZ' }); }
    cyl(T, 0, 0.76, 0, 0.86, 0.8, 0.12, c3, 14);
  };
  // thân ngồi kết già (quay về +z, đầu cao ~3.0 nếu có đài sen): o = { robe, trim, skin, hair, lotus }
  const seatedBody = (T, o) => {
    if (o.lotus) lotusBig(T, maroon, goldC, goldD);
    ell(T, 0, 0.98, 0.1, 0.98, 0.33, 0.64, o.robe);                                                                       // hai chân xếp bằng
    T.add(new THREE.TorusGeometry(0.96, 0.03, 5, 26), o.trim, { p: [0, 0.8, 0.1], r: [PI / 2, 0, 0], s: [1, 0.66, 1] });  // viền vàng gấu áo
    T.add(lathe([[0.56, 0], [0.6, 0.2], [0.56, 0.5], [0.5, 0.8], [0.42, 0.98], [0.22, 1.06], [0, 1.08]], 16), o.robe, { p: [0, 0.98, 0], s: [1, 1, 0.76] }); // thân áo
    T.add(BOX, o.trim, { p: [0.08, 1.62, 0.4], s: [o.sash || 0.16, 1.15, 0.06], r: [0.05, 0, 0.55] });                      // dải y vắt chéo
    cyl(T, 0, 1.98, 0, 0.17, 0.19, 0.1, o.trim, 10);                                                                       // cổ áo
  };
  const seatedHead = (T, o) => { // đầu, cổ, mặt (tâm đầu ở y 2.43)
    cyl(T, 0, 2.09, 0, 0.15, 0.17, 0.22, o.skin, 10);
    T.add(HEAD, o.skin, { p: [0, 2.43, 0.02], s: [0.38, 0.42, 0.39] });
    for (const sx of [-1, 1]) {
      ell(T, sx * 0.39, 2.33, -0.02, 0.06, 0.22, 0.09, o.skin);
      T.add(BOX, 0x4a2e12, { p: [sx * 0.14, 2.44, 0.384], s: [0.13, 0.02, 0.02], r: [0, 0, sx * 0.14] });
      T.add(BOX, o.brow || 0x6e4f22, { p: [sx * 0.15, 2.53, 0.378], s: [0.17, 0.022, 0.02], r: [0, 0, -sx * 0.14] });
    }
    T.add(BOX, 0xb98a4a, { p: [0, 2.38, 0.392], s: [0.05, 0.11, 0.05] });
    T.add(BOX, 0xb8704a, { p: [0, 2.27, 0.38], s: [0.1, 0.022, 0.02] });
    ell(T, 0, 2.58, 0.397, 0.026, 0.026, 0.02, 0xc07a4a);
  };
  const halo = (T, y, z, big) => { // hào quang sau đầu + quầng sau lưng
    T.add(new THREE.TorusGeometry(0.74, 0.045, 6, 36), goldC, { p: [0, y, z] });
    if (big) T.add(new THREE.TorusGeometry(1.0, 0.04, 6, 40), goldD, { p: [0, 1.62, z - 0.06], s: [1.25, 1.55, 1] });
  };
  const hand = (T, p, c) => ell(T, p[0], p[1], p[2], 0.15, 0.08, 0.16, c);

  // Dược Sư Lưu Ly Quang Vương Phật: áo lưu ly xanh thẫm viền vàng, tay trái (bên +x) cầm bình thuốc
  const drugBuddha = (T, Lb) => {
    const o = { robe: 0x2f6af0, trim: goldC, skin: 0xe0b455, lotus: true };
    seatedBody(T, o); seatedHead(T, o);
    T.add(CAP, 0x24407e, { p: [0, 2.43, 0], r: [-0.2, 0, 0], s: [0.4, 0.44, 0.41] });                                       // tóc xanh
    ell(T, 0, 2.85, -0.04, 0.19, 0.19, 0.19, 0x24407e); ell(T, 0, 3.04, -0.04, 0.06, 0.06, 0.06, goldC);                    // nhục kế, ngọc
    halo(T, 2.43, -0.42, true);
    for (const [sx, el, hd] of [[1, [0.68, 1.3, 0.1], [0.36, 1.12, 0.5]], [-1, [-0.68, 1.3, 0.1], [-0.5, 1.02, 0.46]]]) {
      limb(T, [sx * 0.5, 1.86, 0], el, 0.15, 0.13, o.robe); limb(T, el, hd, 0.12, 0.1, o.robe); hand(T, hd, o.skin);
      ell(T, el[0], el[1], el[2], 0.15, 0.15, 0.15, 0x1f4fb5); // khuỷu áo sẫm
    }
    T.add(lathe([[0, 0], [0.1, 0], [0.18, 0.05], [0.21, 0.17], [0.17, 0.29], [0.1, 0.33], [0.1, 0.36], [0, 0.36]], 10), 0x1b3a8c, { p: [0.36, 1.2, 0.5] }); // bình thuốc
    cyl(T, 0.36, 1.44, 0.5, 0.19, 0.2, 0.04, goldC, 10); cyl(T, 0.36, 1.58, 0.5, 0.11, 0.11, 0.05, goldC, 8); ell(T, 0.36, 1.64, 0.5, 0.05, 0.05, 0.05, goldC);
    Lb.add(SPL, 0x9fd0ff, { p: [0.36, 1.84, 0.5], s: [0.05, 0.05, 0.05], j: 0 });                                          // đốm sáng nhỏ trên nắp bình
  };

  // Địa Tạng Vương Bồ Tát: áo xanh lục dải vàng, đầu trần, tay phải (bên −x) cầm tích trượng, tay trái giữ minh châu sáng
  const diaTang = (T, Lb) => {
    const o = { robe: 0x3d7a52, trim: goldC, skin: 0xe0b455, lotus: true, sash: 0.3 };
    seatedBody(T, o); seatedHead(T, o);
    ell(T, 0, 2.86, -0.02, 0.07, 0.05, 0.07, goldD);                                                                        // chỏm đầu trần
    halo(T, 2.43, -0.42, true);
    for (const [sx, el, hd] of [[1, [0.7, 1.35, 0.12], [0.42, 1.2, 0.52]], [-1, [-0.78, 1.4, 0.15], [-0.95, 1.5, 0.5]]]) {
      limb(T, [sx * 0.5, 1.86, 0], el, 0.15, 0.13, o.robe); limb(T, el, hd, 0.12, 0.1, o.robe); hand(T, hd, o.skin);
      T.add(BOX, goldC, { p: [(el[0] + hd[0]) / 2, (el[1] + hd[1]) / 2, (el[2] + hd[2]) / 2], s: [0.2, 0.06, 0.2], r: [0.3, 0, 0] }); // cổ tay áo vàng
    }
    const sx = -0.95, sz = 0.5;
    cyl(T, sx, 2.2, sz, 0.035, 0.035, 2.9, goldC, 6);                                                                      // tích trượng
    T.add(new THREE.TorusGeometry(0.27, 0.035, 5, 20), goldC, { p: [sx, 3.5, sz] });
    for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2 + 0.5; T.add(new THREE.TorusGeometry(0.07, 0.02, 4, 8), goldC, { p: [sx + Math.cos(a) * 0.27, 3.5 + Math.sin(a) * 0.27, sz] }); }
    ell(T, sx, 3.5, sz, 0.08, 0.08, 0.08, goldC); T.add(CN4, goldC, { p: [sx, 3.92, sz], s: [0.14, 0.3, 0.14] }); ell(T, sx, 3.8, sz, 0.06, 0.06, 0.06, goldD);
    Lb.add(SPH, 0xfff0b0, { p: [0.42, 1.46, 0.52], s: [0.14, 0.14, 0.14], j: 0 });                                          // minh châu
    glow(0.42, 1.46, 0.52, 0.9, [1.0, 0.88, 0.5], false);
  };
  // glow gọi trong hàm tượng dùng toạ độ của tượng: đổi sang toạ độ cục bộ của điện ở putFigure

  // Quan Thế Âm Bồ Tát: đứng trên đài sen, áo trắng, khăn trùm đầu, tay phải cầm cành dương liễu, tay trái cầm bình nước
  const quanAm = (T, Lb) => {
    const wh = 0xf2ede2, whD = 0xd6cfbf, sk = 0xf0d8b4;
    T.add(lathe([[0.64, 0], [0.68, 0.1], [0.6, 0.16], [0.5, 0.24], [0, 0.24]], 14), maroon);
    petals(T, 0, 0.08, 0, 0.5, 14, 0.34, 0.26, 0.95, goldD); petals(T, 0, 0.2, 0, 0.36, 12, 0.34, 0.24, 0.45, goldC, 0.26);
    cyl(T, 0, 0.38, 0, 0.3, 0.34, 0.08, goldD, 14);
    T.add(lathe([[0, 0.4], [0.44, 0.4], [0.47, 0.48], [0.41, 0.8], [0.32, 1.3], [0.24, 1.66], [0.2, 1.86], [0.24, 1.96], [0.26, 2.04], [0.18, 2.1], [0, 2.1]], 14), wh, { s: [1, 1, 0.8] }); // áo trắng xòe
    for (let i = 0; i < 5; i++) T.add(BOX, 0xe9e2d2, { p: [(i - 2) * 0.1, 0.85, 0.345], s: [0.025, 0.9 - Math.abs(i - 2) * 0.1, 0.02] }); // nếp áo
    T.add(new THREE.TorusGeometry(0.31, 0.022, 5, 18), goldC, { p: [0, 1.4, 0], r: [PI / 2, 0, 0], s: [1, 0.8, 1] });         // đai lưng
    cyl(T, 0, 2.12, 0, 0.08, 0.1, 0.14, sk, 8);
    ell(T, 0, 2.3, 0.02, 0.16, 0.19, 0.17, sk);                                                                            // đầu
    T.add(HOOD, wh, { p: [0, 2.32, -0.02], r: [-PI / 2, 0, 0], s: [0.25, 0.27, 0.27] });                                  // khăn trùm
    for (const s of [-1, 1]) {
      T.add(BOX, wh, { p: [s * 0.22, 2.0, -0.03], s: [0.08, 0.55, 0.24], r: [0, 0, s * 0.1] });                            // vạt khăn rủ hai vai
      T.add(BOX, 0x4a2e12, { p: [s * 0.065, 2.31, 0.172], s: [0.06, 0.012, 0.015], r: [0, 0, s * 0.12] });                  // mắt khép
      ell(T, s * 0.17, 2.27, 0, 0.025, 0.07, 0.03, sk);
    }
    T.add(BOX, wh, { p: [0, 1.9, -0.2], s: [0.4, 0.75, 0.06] });
    T.add(BOX, 0xb98a4a, { p: [0, 2.26, 0.178], s: [0.03, 0.05, 0.03] }); T.add(BOX, 0xb8704a, { p: [0, 2.2, 0.178], s: [0.05, 0.015, 0.02] });
    ell(T, 0, 2.43, 0.17, 0.02, 0.02, 0.015, 0xd04a30); T.add(CN4, goldC, { p: [0, 2.5, 0.19], s: [0.08, 0.1, 0.03] });     // bạch hào, trang sức trán
    T.add(new THREE.TorusGeometry(0.4, 0.035, 6, 30), goldC, { p: [0, 2.3, -0.3] });                                      // quầng sáng sau đầu
    T.add(new THREE.TorusGeometry(1.0, 0.04, 6, 40), goldD, { p: [0, 1.5, -0.36], s: [0.8, 1.5, 1] });
    // tay phải: cành dương liễu; tay trái: bình nước cam lồ
    const shR = [-0.26, 1.9, 0], elR = [-0.38, 1.55, 0.12], hdR = [-0.32, 1.72, 0.34];
    limb(T, shR, elR, 0.09, 0.075, wh); limb(T, elR, hdR, 0.075, 0.06, wh); ell(T, hdR[0], hdR[1], hdR[2], 0.06, 0.05, 0.06, sk);
    const w = [hdR, [-0.34, 2.12, 0.38], [-0.52, 2.34, 0.4], [-0.78, 2.22, 0.38], [-0.9, 1.9, 0.36], [-0.9, 1.6, 0.34]];
    for (let i = 0; i < w.length - 1; i++) limb(T, w[i], w[i + 1], 0.016, 0.012, 0x5d8c3d);
    for (let i = 2; i < w.length; i++) for (const d of [-0.04, 0.04]) ell(T, w[i][0] + d, w[i][1] - 0.07, w[i][2], 0.03, 0.1, 0.012, 0x6f9a45, { r: [0, 0, d * 6] });
    const shL = [0.26, 1.9, 0], elL = [0.36, 1.5, 0.14], hdL = [0.24, 1.3, 0.4];
    limb(T, shL, elL, 0.09, 0.075, wh); limb(T, elL, hdL, 0.075, 0.06, wh); ell(T, hdL[0], hdL[1], hdL[2], 0.07, 0.04, 0.08, sk);
    T.add(lathe([[0, 0], [0.08, 0], [0.15, 0.08], [0.17, 0.2], [0.11, 0.34], [0.06, 0.4], [0.09, 0.45], [0, 0.45]], 10), 0xbfe0d0, { p: [0.24, 1.32, 0.42] }); // bình nước
    cyl(T, 0.24, 1.78, 0.42, 0.095, 0.095, 0.03, goldC, 8);
    limb(T, [0.24, 1.78, 0.42], [0.3, 1.96, 0.42], 0.012, 0.012, 0x5d8c3d);                                              // nhành nhỏ trong bình
  };

  // Văn Thù Sư Lợi Bồ Tát cưỡi sư tử xanh: tay phải (bên −x) giơ kiếm, tay trái cầm đóa sen có cuốn kinh
  const figureAt = (T, Lb, fn, x, y, z, s) => { // dựng con tượng nhỏ rồi thu nhỏ/đặt lên chỗ khác
    const A = U.batch(), B = U.batch(); fn(A, B);
    const m = new THREE.Matrix4().makeScale(s, s, s).setPosition(x, y, z);
    for (const [t, d] of [[A, T], [B, Lb]]) if (t.list.length) { const g = U.merge(t.list); g.applyMatrix4(m); d.addGeo(g); }
  };
  const vanThu = (T, Lb) => {
    const lb = 0x4b9d95, ld = 0x2f6f75, dk = 0x1d3a3c;
    ell(T, 0, 0.74, -0.02, 0.42, 0.4, 0.78, lb); ell(T, 0, 0.84, 0.5, 0.4, 0.44, 0.38, lb);                                  // thân, ngực sư tử
    for (const [sx, sz] of [[-1, 0.52], [1, 0.52], [-1, -0.5], [1, -0.5]]) { limb(T, [sx * 0.26, 0.6, sz], [sx * 0.28, 0.1, sz], 0.14, 0.1, lb); ell(T, sx * 0.28, 0.06, sz + 0.08, 0.13, 0.06, 0.19, ld); }
    ell(T, 0, 1.0, 0.98, 0.3, 0.3, 0.27, lb); ell(T, 0, 0.88, 1.24, 0.17, 0.12, 0.14, lb);                                    // đầu, mõm
    for (let i = 0; i < 14; i++) { const a = (i / 14) * PI * 2; ell(T, Math.sin(a) * 0.34, 0.98 + Math.cos(a) * 0.34, 0.8, 0.1, 0.1, 0.08, i % 2 ? 0xe0b455 : 0xc99a3a); }           // bờm xoăn vàng
    for (let i = 0; i < 9; i++) { const a = (i / 9) * PI * 2 + 0.3; if (Math.cos(a) < 0.2) ell(T, Math.sin(a) * 0.4, 0.92 + Math.cos(a) * 0.4, 0.66, 0.11, 0.11, 0.09, i % 2 ? 0xc99a3a : 0xe0b455); }
    ell(T, 0, 0.93, 1.34, 0.05, 0.04, 0.03, dk);
    for (const s of [-1, 1]) { ell(T, s * 0.12, 1.1, 1.17, 0.045, 0.04, 0.03, 0xfff0c0); ell(T, s * 0.12, 1.1, 1.2, 0.02, 0.02, 0.02, dk); T.add(CN4, ld, { p: [s * 0.2, 1.3, 0.9], s: [0.1, 0.14, 0.08] }); }
    limb(T, [0, 0.92, -0.74], [0, 1.1, -1.12], 0.07, 0.05, lb); limb(T, [0, 1.1, -1.12], [0, 1.5, -1.0], 0.05, 0.04, lb); ell(T, 0, 1.55, -0.98, 0.1, 0.14, 0.1, ld); // đuôi
    T.add(new THREE.TorusGeometry(0.36, 0.045, 5, 18), goldC, { p: [0, 0.92, 0.5], r: [0, 0.2, 0], s: [1, 1, 1] });         // vòng cổ vàng
    T.add(BOX, 0x9a2a20, { p: [0, 1.12, 0.02], s: [0.95, 0.07, 0.8] });                                                     // yên đỏ
    petals(T, 0, 1.12, 0, 0.3, 12, 0.22, 0.2, 0.4, goldC); cyl(T, 0, 1.2, 0, 0.3, 0.32, 0.06, goldD, 12);                  // đài sen trên lưng sư tử
    figureAt(T, Lb, (A) => {
      const o = { robe: 0xd9b45a, trim: 0x2f7a78, skin: 0xf0c874, lotus: false, sash: 0.2 };
      seatedBody(A, o); seatedHead(A, o);
      ell(A, 0, 2.78, -0.04, 0.37, 0.22, 0.37, 0x2a2018);                                                                // tóc búi
      cyl(A, 0, 2.7, 0, 0.36, 0.38, 0.12, goldC, 12);                                                                    // mũ ngũ phật
      for (let i = 0; i < 5; i++) { const a = (i / 5) * PI * 2 + PI / 5; A.add(CN4, goldC, { p: [Math.sin(a) * 0.3, 2.93, Math.cos(a) * 0.3], s: [0.14, 0.26, 0.09], r: [0, a, 0] }); }
      ell(A, 0, 2.72, 0.37, 0.04, 0.04, 0.03, 0xd8322a);
      halo(A, 2.43, -0.46, false);
      const sh = (sx) => [sx * 0.5, 1.86, 0];
      limb(A, sh(-1), [-0.7, 1.6, 0.2], 0.15, 0.12, o.robe); limb(A, [-0.7, 1.6, 0.2], [-0.62, 1.95, 0.4], 0.12, 0.1, o.robe); hand(A, [-0.62, 1.95, 0.4], o.skin);   // tay phải giơ kiếm
      limb(A, sh(1), [0.7, 1.5, 0.2], 0.15, 0.12, o.robe); limb(A, [0.7, 1.5, 0.2], [0.56, 1.34, 0.42], 0.12, 0.1, o.robe); hand(A, [0.56, 1.34, 0.42], o.skin);       // tay trái cầm sen
      A.add(BOX, 0xe9e4d2, { p: [-0.62, 2.7, 0.4], s: [0.09, 1.4, 0.025] }); A.add(CN4, 0xe9e4d2, { p: [-0.62, 3.5, 0.4], s: [0.1, 0.34, 0.03] }); // lưỡi kiếm
      A.add(BOX, goldC, { p: [-0.62, 2.04, 0.4], s: [0.34, 0.05, 0.08] }); cyl(A, -0.62, 1.95, 0.4, 0.04, 0.04, 0.22, goldD, 6);
      limb(A, [0.56, 1.34, 0.42], [0.72, 2.0, 0.34], 0.025, 0.02, 0x5d8c3d);                                           // cuống sen
      petals(A, 0.72, 1.98, 0.34, 0.06, 8, 0.24, 0.2, 0.7, 0xf5c9d0); petals(A, 0.72, 1.98, 0.34, 0.03, 6, 0.2, 0.17, 0.25, 0xfff0f2, 0.3);
      A.add(BOX, goldC, { p: [0.72, 2.2, 0.34], s: [0.4, 0.03, 0.3], r: [0.1, 0, 0.12] }); A.add(BOX, 0xf2e6c4, { p: [0.72, 2.23, 0.34], s: [0.36, 0.04, 0.26], r: [0.1, 0, 0.12] }); // cuốn kinh
    }, 0, 0.69, 0, 0.6);
  };
  // đưa một tượng vào điện: dựng ở toạ độ tượng, thu phóng s và đặt tại (x,y,z) cục bộ; quầng sáng của tượng đã nằm trong W.glows ở toạ độ tượng
  const putFigure = (T, fn, x, y, z, s) => {
    const g0 = W.glows.length;
    figureAt(T.G, T.L, fn, x, y, z, s);
    for (const q of W.glows.slice(g0)) { q.x = x + q.x * s; q.y = y + q.y * s; q.z = z + q.z * s; q.size *= s; }
  };

  // ---------- Đồ thờ chung ----------
  const candleAt = (T, x, y, z) => {
    cyl(T.S, x, y + 0.15, z, 0.035, 0.04, 0.3, C.cream, 6); T.L.add(CN6, 0xffd27a, { p: [x, y + 0.36, z], s: [0.07, 0.13, 0.07] });
    glow(x, y + 0.42, z, 0.55, [1.0, 0.7, 0.3], false);
  };
  const bowlAt = (T, x, y, z, r) => { // lư hương đồng + vài nén hương + khói
    T.M.add(lathe([[0, 0], [0.12 * r, 0.01], [0.17 * r, 0.09], [0.18 * r, 0.16], [0.15 * r, 0.17]], 10), C.bronze, { p: [x, y, z] });
    for (let i = 0; i < 3; i++) box(T.S, x + (i - 1) * 0.04 * r, y + 0.3 * r, z, 0.012, 0.34 * r, 0.012, 0x7a2a1a);
    glow(x, y + 0.5 * r, z, 0.2, [1, 0.35, 0.1], false); W.smokeSpots.push([x, y + 0.55 * r, z]);
  };
  const vaseAt = (T, x, y, z, c) => { // bình hoa nhỏ
    T.S.add(lathe([[0, 0], [0.1, 0.02], [0.08, 0.2], [0.05, 0.32], [0.08, 0.38]], 8), c, { p: [x, y, z] });
    for (let i = 0; i < 5; i++) ell(T.S, x + Math.cos(i * 1.3) * 0.12, y + 0.44 + (i % 2) * 0.08, z + Math.sin(i * 1.3) * 0.1, 0.07, 0.07, 0.07, [0xf39a2a, 0xf5d03a, 0xd8322a, 0xf39a2a, 0xf5d03a][i]);
  };
  const cushion = (T, x, y, z, big) => { cyl(T.S, x, y + 0.08, z, big ? 0.4 : 0.34, big ? 0.43 : 0.37, 0.16, 0xd9a441, 10); if (big) cyl(T.S, x, y + 0.17, z, 0.16, 0.16, 0.02, 0xa8281f, 10); };
  const lampWindow = (T, x, y, z, ry) => { // cửa sổ tròn có song chéo, mặt quay theo ry
    T.S.add(new THREE.TorusGeometry(0.55, 0.08, 6, 16), C.woodD, { p: [x, y, z], r: [0, ry, 0] });
    for (const a of [0, PI / 2]) T.S.add(BOX, C.woodD, { p: [x, y, z], s: [0.06, 1.1, 0.05], r: [0, ry, a] });
  };

  // ---------- Điện nhỏ: dựng một toà theo spec ----------
  function dien(sp) {
    const S_ = sp.face === 'S', Wd = S_ ? sp.x1 - sp.x0 : sp.z1 - sp.z0, D = S_ ? sp.z1 - sp.z0 : sp.x1 - sp.x0;
    const fr = S_ ? frame((sp.x0 + sp.x1) / 2, sp.z1, 0) : frame(sp.x0, (sp.z0 + sp.z1) / 2, -PI / 2);
    const fh = sp.floorH, two = sp.tiers === 2, HW = two ? 5.2 : 4.3, wt = fh + HW, hx = Wd / 2, bay = 1.75, cx = hx - 0.5, stepH = 2.6;
    const T = locals(), g0 = W.glows.length, s0 = W.smokeSpots.length;
    // bệ đá + ba bậc + nền gạch + thảm
    boxMM(T.F, -hx, 0, -D, hx, fh, 0, C.stone);
    for (let i = 0; i < 3; i++) boxMM(T.F, -stepH, 0, i * 0.4, stepH, (fh * (3 - i)) / 3, (i + 1) * 0.4, i === 1 ? C.stone : C.stoneL);
    boxMM(T.F, -hx + 0.35, fh, -D + 0.35, hx - 0.35, fh + 0.02, -0.1, 0x8f4e34);
    // tường sau, hai bên, mảng tường hai bên gian giữa; chân tường đá; dải gỗ dưới mái
    boxMM(T.S, -hx + 0.1, fh, -D + 0.1, hx - 0.1, wt, -D + 0.4, C.ochre);
    boxMM(T.S, -hx + 0.06, fh, -D + 0.06, hx - 0.06, fh + 0.3, -D + 0.45, C.stoneD); boxMM(T.S, -hx + 0.06, wt - 0.5, -D + 0.06, hx - 0.06, wt, -D + 0.45, C.woodD);
    for (const sx of [-1, 1]) {
      boxMM(T.S, sx * (hx - 0.4), fh, -D + 0.1, sx * (hx - 0.1), wt, -0.05, C.ochre);
      boxMM(T.S, sx * (hx - 0.46), fh, -D + 0.06, sx * (hx - 0.04), fh + 0.3, 0, C.stoneD); boxMM(T.S, sx * (hx - 0.46), wt - 0.5, -D + 0.06, sx * (hx - 0.04), wt, 0, C.woodD);
      boxMM(T.S, sx * bay, fh, -0.5, sx * (hx - 0.4), wt - 0.34, -0.2, C.ochre);
      lampWindow(T, sx * (hx - 0.05), fh + 2.7, -D / 2, PI / 2); lampWindow(T, sx * (hx - 0.45), fh + 2.7, -D / 2, PI / 2);          // cửa sổ tròn hai mặt tường bên
      lampWindow(T, sx * (bay + hx - 0.4) / 2, fh + 2.5, -0.17, 0);                                                                  // cửa sổ tròn mặt trước
    }
    // cột son mặt trước + xà ngang + biển tên + hai đèn lồng
    for (const x of [-cx, -bay, bay, cx]) { columnInto(T.S, T.F, x, -0.25, fh, HW - 0.3, 0.24, false); box(T.S, x, wt - 0.15, -D / 2 - 0.1, 0.28, 0.3, D - 0.4, C.woodD); }
    box(T.S, 0, wt - 0.15, -0.25, Wd - 0.2, 0.34, 0.34, C.woodD);
    box(T.S, 0, wt - 0.82, 0.02, 3.1, 0.82, 0.14, C.woodD);
    addSign([sp.name], 2.9, 0.66, fr.X(0, 0.1), wt - 0.82, fr.Z(0, 0.1), fr.yaw, { ppu: 260 });
    for (const sx of [-1, 1]) hangLanternInto(T.S, T.L, sx * 2.95, wt - 0.3, 0.55, 0.45, 1);
    // mái
    if (!two) addRoof(T.S, 0, wt, -D / 2, Wd + 1.6, D + 1.6, 1.9, { curl: 0.45, sag: 0.1, seg: 8, finial: true, metal: T.M });
    else {
      addRoof(T.S, 0, wt, -D / 2, Wd + 2.0, D + 2.0, 1.5, { curl: 0.5, sag: 0.1, seg: 8, metal: T.M });
      box(T.S, 0, wt + 1.5, -D / 2, Wd - 2.8, 2.2, D - 2.8, C.ochreD);
      for (const sx of [-1, 1]) for (let k = -2; k <= 2; k++) { box(T.S, sx * (Wd / 2 - 1.37), wt + 1.65, -D / 2 + k * 1.2, 0.06, 0.9, 0.5, C.wood); box(T.S, k * 1.2, wt + 1.65, -D / 2 + sx * (D / 2 - 1.37), 0.5, 0.9, 0.06, C.wood); }
      addRoof(T.S, 0, wt + 2.6, -D / 2, Wd - 1.0, D - 1.0, 1.7, { curl: 0.5, sag: 0.08, seg: 8, pearl: true, metal: T.M });
    }
    // phông đỏ sau + viền vàng, bệ tượng, bàn thờ, đồ cúng
    box(T.S, 0, fh + HW / 2 - 0.1, -D + 0.43, Wd - 0.9, HW - 0.8, 0.05, 0x5e1a12);
    boxMM(T.S, -hx + 0.45, fh + 0.5, -D + 0.4, hx - 0.45, fh + 0.58, -D + 0.47, C.gold); boxMM(T.S, -hx + 0.45, wt - 0.7, -D + 0.4, hx - 0.45, wt - 0.62, -D + 0.47, C.gold);
    const pw = two ? 3.8 : 3.2, pd = 1.7, ph = two ? 0.95 : 0.8, pz0 = -D + 0.45, pzc = pz0 + pd / 2;
    boxMM(T.S, -pw / 2, fh, pz0, pw / 2, fh + ph, pz0 + pd, maroon); boxMM(T.S, -pw / 2 - 0.05, fh + ph, pz0, pw / 2 + 0.05, fh + ph + 0.08, pz0 + pd + 0.05, C.gold);
    boxMM(T.S, -pw / 2 + 0.2, fh + 0.18, pz0 + pd, pw / 2 - 0.2, fh + ph - 0.18, pz0 + pd + 0.03, C.goldD);
    const tz = pz0 + pd + 0.6, tf = tz + 0.4, th = 0.95;   // bàn thờ trước bệ
    boxMM(T.S, -1.3, fh, tz - 0.4, 1.3, fh + th, tf, maroon); boxMM(T.S, -1.36, fh + th, tz - 0.44, 1.36, fh + th + 0.06, tf + 0.04, C.gold);
    boxMM(T.S, -1.1, fh + 0.18, tf, 1.1, fh + th - 0.16, tf + 0.03, C.goldD);
    bowlAt(T, 0, fh + th + 0.06, tz, 1.4); candleAt(T, -0.85, fh + th + 0.06, tz); candleAt(T, 0.85, fh + th + 0.06, tz);
    vaseAt(T, -1.15, fh + th + 0.06, tz, 0x3a64a0); vaseAt(T, 1.15, fh + th + 0.06, tz, 0x3a64a0);
    boxMM(T.F, -0.9, fh + 0.02, tf, 0.9, fh + 0.035, -0.1, 0x7a2418);
    const c1 = tf + 1.4, c2 = c1 + 1.3;                      // hai hàng bồ đoàn
    cushion(T, 0, fh, c1, true); cushion(T, -1.7, fh, c1); cushion(T, 1.7, fh, c1); cushion(T, 0, fh, c2);
    putFigure(T, sp.deity, 0, fh + ph + 0.08, pzc, sp.scale || 0.62);
    glow(0, fh + ph + 0.08 + (sp.haloY || 1.6), pzc + 0.3, 3.0, [1.0, 0.78, 0.36], false);
    flush(T, fr); toWorldFx(fr, g0, s0);
    // vật cản, kính chắn máy quay, độ cao, vùng mái, dẫn đường, vùng chừa, chỗ đứng cho khách
    const wy1 = wt, eyeY = fh + 1.9;
    colBox(fr, -hx + 0.1, -D + 0.1, hx - 0.1, -D + 0.4, 'dienphu'); blk(fr, -hx + 0.1, fh, -D + 0.1, hx - 0.1, wy1, -D + 0.4);
    for (const sx of [-1, 1]) {
      colBox(fr, sx * (hx - 0.4), -D + 0.1, sx * (hx - 0.1), -0.05, 'dienphu'); blk(fr, sx * (hx - 0.4), fh, -D + 0.1, sx * (hx - 0.1), wy1, -0.05);
      colBox(fr, sx * bay, -0.5, sx * (hx - 0.4), -0.2, 'dienphu'); blk(fr, sx * bay, fh, -0.5, sx * (hx - 0.4), wy1, -0.2);
    }
    for (const x of [-cx, -bay, bay, cx]) colCirc(fr, x, -0.25, 0.34, 'col');
    colBox(fr, -pw / 2, pz0, pw / 2, pz0 + pd, 'altar'); colBox(fr, -1.3, tz - 0.4, 1.3, tf, 'altar');
    const fl = (x, z) => { const lx = fr.lx(x, z), lz = fr.lz(x, z); if (Math.abs(lx) > hx) return null; if (lz <= 0 && lz >= -D) return fh; if (lz > 0 && lz < 1.2 && Math.abs(lx) <= stepH) return fh * (1 - lz / 1.2); return null; };
    floors.push(fl);
    const rz = bboxW(fr, -hx + 0.3, -D + 0.3, hx - 0.3, -0.2); G.roofZones.push(rz);
    const fp = bboxW(fr, -hx - 0.3, -D - 0.3, hx + 0.3, 0.2); owner.push(fp);
    const bn = bboxW(fr, -hx - 1, -D - (sp.back || 1), hx + 1, 2.5); G.decorBans.push(bn);
    const nodes = [[0, 0.3, sp.id + 'Door'], [0, (c1 + c2) / 2, sp.id + 'In'], [-1.8, 2.6], [1.8, 2.6]];
    const alt = { x: fr.X(0, pzc), z: fr.Z(0, pzc) };
    const sp3 = [[-1.7, c1], [1.7, c1], [0, c2]].map(([x, z]) => ({ x: fr.X(x, z), z: fr.Z(x, z), yaw: U.yawTo(fr.X(x, z), fr.Z(x, z), alt.x, alt.z) }));
    const front = { x: fr.X(0, 2.6), z: fr.Z(0, 2.6) };
    const lp = [fr.X(0, -D / 2 - 0.5), fh + (two ? 3.8 : 3.2), fr.Z(0, -D / 2 - 0.5)];
    const h = { id: sp.id, title: sp.title, extra: sp.extra || [], lamp: lp, cushion: { x: fr.X(0, c1), z: fr.Z(0, c1), y: fh + 0.16, yaw: U.yawTo(fr.X(0, c1), fr.Z(0, c1), alt.x, alt.z) }, altar: alt, front, nodes: nodes.map(([x, z, id]) => ({ x: fr.X(x, z), z: fr.Z(x, z), id })), spots: sp3,
      cam: { pos: [fr.X(0.3, -0.1), fh + 2.5, fr.Z(0.3, -0.1)], look: [fr.X(1.8, pzc), fh + ph + 0.08 + (sp.scale || 0.62) * 1.25, fr.Z(1.8, pzc)] }, // nhìn lệch phải để tượng nằm bên trái bảng đặt sát góc phải
      camP: { pos: [fr.X(0, 7.6), fh + 1.9, fr.Z(0, 7.6)], look: [fr.X(0, -4), fh - 1.9, fr.Z(0, -4)] } }; // camP: màn hình dọc hẹp — đứng ngoài thềm nhìn qua gian giữa, nhường nửa dưới cho bảng
    hallsLe[sp.id] = h;
    return h;
  }

  // ---------- Điện Văn Thù trong lòng tháp Báo Nghiêm ----------
  function vanThuRoom() {
    const BN = L2.baoNghiem, fy = BN.floorY, fr = frame(BN.x, BN.z, 0), T = locals(), g0 = W.glows.length, s0 = W.smokeSpots.length;
    // sàn đá, bàn thờ sát tường bắc, tượng, đồ cúng, bồ đoàn, đèn treo
    cyl(T.F, 0, fy + 0.01, 0, 1.58, 1.58, 0.02, 0x7d6b58, 8, { r: [0, PI / 8, 0] });
    boxMM(T.S, -0.6, fy, -1.5, 0.6, fy + 0.6, -0.4, maroon); boxMM(T.S, -0.66, fy + 0.6, -1.5, 0.66, fy + 0.66, -0.34, C.gold); boxMM(T.S, -0.45, fy + 0.15, -0.4, 0.45, fy + 0.5, -0.37, C.goldD);
    box(T.S, 0, fy + 1.95, -1.46, 1.1, 2.3, 0.04, 0x5e1a12); boxMM(T.S, -0.55, fy + 0.8, -1.5, 0.55, fy + 0.86, -1.43, C.gold); boxMM(T.S, -0.55, fy + 3.05, -1.5, 0.55, fy + 3.11, -1.43, C.gold);
    putFigure(T, vanThu, 0, fy + 0.66, -0.95, 0.74);
    glow(0, fy + 2.1, -0.75, 1.3, [1.0, 0.78, 0.36], false); glow(0, fy + 1.9, 0.5, 1.6, [1.0, 0.75, 0.4], false);
    candleAt(T, -0.45, fy + 0.66, -0.52); candleAt(T, 0.45, fy + 0.66, -0.52); bowlAt(T, 0, fy + 0.66, -0.52, 1.1);
    cushion(T, 0, fy, 1.0, true);
    hangLanternInto(T.S, T.L, 0, fy + 3.58, 0.2, 0.55, 0.9);
    addSign(['ĐIỆN VĂN THÙ'], 1.3, 0.34, BN.x, fy + 2.62, BN.z + 1.79, 0, { ppu: 300 });
    flush(T, fr); toWorldFx(fr, g0, s0);
    const cush = { x: BN.x, z: BN.z + 1.0, y: fy + 0.16, yaw: PI };
    colBox(fr, -0.6, -1.5, 0.6, -0.4, 'altar');
    floors.push((x, z) => { const dx = x - BN.x, dz = z - BN.z; if (Math.abs(dx) < 1.5 && Math.abs(dz) < 1.5) return fy; if (Math.abs(dx) <= 1.15 && dz >= 1.5 && dz < 3.0) return fy * U.clamp((3.0 - dz) / 0.9, 0, 1); return null; });
    G.roofZones.push([BN.x - 2.1, BN.x + 2.1, BN.z - 2.1, BN.z + 2.1]);
    const h = { id: 'van-thu', title: 'Văn Thù Sư Lợi Bồ Tát', lamp: [BN.x, fy + 3.0, BN.z + 0.6], lampK: 0.3, cushion: cush, altar: { x: BN.x, z: BN.z - 0.95 }, front: { x: BN.x, z: BN.z + 4.8 }, poi: { x: BN.x, z: BN.z + 4.4 },
      nodes: [{ x: BN.x, z: BN.z + 2.6, id: 'vanThuDoor' }, { x: BN.x, z: BN.z + 0.8, id: 'vanThuIn' }], spots: [],
      cam: { pos: [BN.x, fy + 1.6, BN.z + 4.6], look: [BN.x + 2.0, fy + 1.55, BN.z - 1.0] }, camP: { pos: [BN.x, fy + 1.5, BN.z + 9.5], look: [BN.x, fy - 1.4, BN.z - 1.0] } };
    hallsLe['van-thu'] = h;
    return h;
  }

  // ---------- Dựng ----------
  const specs = [
    { id: 'duoc-su', title: 'Dược Sư Lưu Ly Quang Vương Phật', name: 'ĐIỆN DƯỢC SƯ', x0: 11.5, x1: 19.5, z0: -26, z1: -18, face: 'S', floorH: 0.45, tiers: 1, deity: drugBuddha, scale: 0.62, haloY: 1.8, extra: [[16.8, -27.4, 'dsBack']] },
    { id: 'dia-tang', title: 'Địa Tạng Vương Bồ Tát', name: 'ĐIỆN ĐỊA TẠNG', x0: -19.5, x1: -11.5, z0: -26, z1: -18, face: 'S', floorH: 0.45, tiers: 1, deity: diaTang, scale: 0.6, haloY: 1.8, extra: [[-16.8, -27.4, 'dtBack']] },
    { id: 'quan-am-cac', title: 'Quan Thế Âm Bồ Tát', name: 'QUAN ÂM CÁC', x0: 12.5, x1: 21.5, z0: -1.0, z1: 7.2, face: 'W', floorH: 0.45, tiers: 2, deity: quanAm, scale: 1.0, haloY: 1.5, back: 2.2, extra: [[22.0, -2.4, 'qaE1'], [22.0, 3.0, 'qaE2'], [22.0, 10.0, 'qaE3']] }, // ao sen lớn tới z 7.2 nên điện lùi lên 1 m; lối bên đông 2,2 m
  ];
  // dọn nút dẫn đường / chỗ đứng cũ nằm trong khuôn viên các toà mới (phải làm trước khi thêm nút mới)
  const preFp = [];
  for (const sp of specs) preFp.push([sp.x0 - 0.3, sp.x1 + 0.3, sp.z0 - 0.3, sp.z1 + 0.3]);
  const inAny = (x, z) => preFp.some((f) => x > f[0] && x < f[1] && z > f[2] && z < f[3]);
  G.nav.nodes = G.nav.nodes.filter((n) => !inAny(n.x, n.z));
  for (const k of Object.keys(G.spots)) { const a = G.spots[k]; if (Array.isArray(a)) for (let i = a.length - 1; i >= 0; i--) if (inAny(a[i].x, a[i].z)) a.splice(i, 1); }

  const built = specs.map(dien); built.push(vanThuRoom());
  // độ cao nền: quanh các toà (cầu thang, bệ, sàn)
  const baseH = G.heightAt;
  G.heightAt = (x, z) => { for (let i = 0; i < floors.length; i++) { const h = floors[i](x, z); if (h != null) return h; } return baseH(x, z); };
  for (const h of built) { for (const n of h.nodes) G.nav.add(n.x, n.z, n.id); for (const [x, z, id] of h.extra || []) G.nav.add(x, z, id); }
  for (const h of built) for (const s of h.spots) G.spots.hallFront.push(s);

  // ---------- Đưa vào cảnh ----------
  for (const [B, mat, o] of [[WS, G.mats.vc, { cast: true, receive: true }], [WF, G.mats.vc, { cast: false, receive: true }], [WM, G.mats.metal, { cast: true, receive: true }], [WL, G.mats.lantern, { cast: false, receive: false }], [WG, G.mats.gold, { cast: false, receive: true }]]) {
    if (!B.list.length) continue;
    const m = B.mesh(mat, o); m.name = 'dienPhu'; scene.add(m);
  }
  for (const g of own) g.dispose();
  // một đèn điểm dùng chung: sáng dần ở điện gần người chơi nhất (rẻ hơn mỗi điện một đèn)
  const lamp = new THREE.PointLight(0xffb070, 0, 9, 1.6); scene.add(lamp);
  G.onUpdate((dt) => {
    const P = G.player; if (!P) return;
    let best = null, bd = 1e9;
    for (const h of built) { const d = Math.hypot(P.pos.x - h.lamp[0], P.pos.z - h.lamp[2]); if (d < bd) { bd = d; best = h; } }
    const want = best && bd < 15 ? U.clamp((15 - bd) / 7, 0, 1) * (13 + G.tod.night * 9) * (best.lampK || 1) : 0;
    if (best && want > 0.01) lamp.position.set(best.lamp[0], best.lamp[1], best.lamp[2]);
    lamp.intensity += (want - lamp.intensity) * Math.min(1, dt * 4);
  }, 55);

  // ---------- Bản đồ chùa + điểm hoạt động ----------
  const LE = {
    'duoc-su': { short: 'Dược Sư', desc: 'Vào Điện Dược Sư, lễ Phật Dược Sư Lưu Ly Quang Vương', place: 'Điện Dược Sư',
      intro: ['Dược Sư Lưu Ly Quang Vương Phật là vị Phật được nhắc đến trong kinh Dược Sư, gắn với lời nguyện làm vơi bớt bệnh khổ của thân và tâm.', 'Người con Phật thường hướng về Ngài để nuôi lòng thương yêu, biết chăm sóc sức khỏe của mình và của người xung quanh.'],
      wishes: ['Mong người thân mạnh khỏe', 'Mong tâm được an', 'Mong ai đang đau ốm sớm nhẹ bớt'] },
    'dia-tang': { short: 'Địa Tạng', desc: 'Vào Điện Địa Tạng, lễ Địa Tạng Vương Bồ Tát', place: 'Điện Địa Tạng',
      intro: ['Địa Tạng Vương Bồ Tát được biết đến với đại nguyện ở lại cùng chúng sinh trong cảnh khổ đau, cho đến khi tất cả được thoát khổ.', 'Nhiều người cũng nhớ đến Ngài khi hướng về ông bà, tổ tiên. Tích trượng và viên minh châu tượng trưng cho sự thức tỉnh và ánh sáng soi đường.'],
      wishes: ['Mong ông bà tổ tiên được an ổn', 'Mong mình biết ơn và sống tử tế', 'Mong ai gặp hoạn nạn sớm qua khó khăn'] },
    'quan-am-cac': { short: 'Quan Âm', desc: 'Vào Quan Âm Các, lễ Quan Thế Âm Bồ Tát', place: 'Quan Âm Các',
      intro: ['Quan Thế Âm Bồ Tát là biểu tượng của lòng từ bi: lắng nghe tiếng kêu của thế gian và đưa tay giúp đỡ.', 'Cành dương liễu và bình nước cam lồ gợi nhớ sự dịu mát, xoa dịu nỗi đau. Đứng trước Ngài, ta nhắc nhau lắng nghe và thương yêu nhiều hơn.'],
      wishes: ['Mong gia đình hòa thuận', 'Mong mình biết lắng nghe', 'Mong người khó khăn được che chở'] },
    'van-thu': { short: 'Văn Thù', desc: 'Vào lòng tháp Báo Nghiêm, lễ Văn Thù Sư Lợi Bồ Tát', place: 'Tháp Báo Nghiêm – điện Văn Thù',
      intro: ['Văn Thù Sư Lợi Bồ Tát là biểu tượng của trí tuệ. Thanh kiếm tượng trưng cho trí tuệ cắt đứt phiền não; cuốn kinh trên đóa sen nhắc việc học hỏi và hiểu đúng.', 'Nhiều người đến trước Ngài với mong muốn học hành sáng suốt, làm việc tỉnh táo và rõ ràng.'],
      wishes: ['Mong học hành sáng suốt', 'Mong tâm trí tỉnh táo', 'Mong biết lắng nghe và hiểu đúng'] },
  };
  const sfx = (n, o) => { try { G.audio?.play?.(n, o); } catch (e) { /* âm thanh lỗi thì bỏ qua */ } };
  // bảng chọn lời mong: trên máy tính để sát góc phải dưới, nhường chỗ cho tượng ở giữa màn hình
  G.ui.addStyle('@media (min-width:760px) and (min-height:560px){.pwrap.clear:has(.panel.le-panel){align-items:flex-end;justify-content:flex-end;padding:0 24px 24px 0}.panel.le-panel{max-width:420px}}');
  let run = null;
  async function runLe(h) {
    const P = G.player, info = LE[h.id], name = 'le-' + h.id;
    if (run || G.activity.current || !P) return;
    const asp = G.size.w / G.size.h, c = asp < 0.8 ? h.camP : h.cam, pull = asp < 1 ? U.clamp(0.66 / asp, 1, 1.5) : 1; // lõi máy quay kéo lùi máy ×pull trên màn hình hẹp: chia trước để máy dừng đúng chỗ
    const cam = { pos: [c.look[0] + (c.pos[0] - c.look[0]) / pull, c.look[1] + (c.pos[1] - c.look[1]) / pull, c.look[2] + (c.pos[2] - c.look[2]) / pull], look: c.look };
    if (!G.activity.begin(name, { cam })) return;
    const r = (run = { dead: false, offs: [], pan: null, seated: false, bowing: false });
    const quit = () => {
      if (r.dead) return;
      r.dead = true;
      for (const f of r.offs) { try { f(); } catch (e) { console.error(e); } }
      if (r.pan) { const p = r.pan; r.pan = null; p.close(); }
      if (P.walking) P.stopWalk();
      if (G.activity.current === name) G.activity.end();
      if (run === r) run = null;
    };
    r.offs.push(G.events.on('escape', quit));
    try {
      await P.walkTo(h.cushion.x, h.cushion.z);
      if (r.dead) return;
      P.placeAt(h.cushion.x, h.cushion.z, h.cushion.yaw);
      await P.faceTo(U.yawTo(h.cushion.x, h.cushion.z, h.altar.x, h.altar.z), 0.3);
      if (r.dead) return;
      P.pos.y = h.cushion.y; r.seated = true; P.poseParam = 0; P.setPose('sitPray');
      await G.wait(0.9);
      if (r.dead) return;
      const body = U.el('div'), chips = U.el('div', 'chips');
      for (const t of info.intro) body.append(U.el('p', 'small', t));
      body.append(U.el('div', 'muted small', 'Chọn một lời mong nhẹ nhàng (không bắt buộc), rồi lễ:'));
      info.wishes.forEach((t) => { const c = U.el('button', 'chip', t); c.type = 'button'; c.onclick = () => { for (const o of chips.children) o.classList.toggle('on', o === c && !o.classList.contains('on')); sfx('ui'); }; chips.append(c); });
      body.append(chips, U.el('div', 'note small', 'Lời mong là tấm lòng của riêng bạn; điều lành đến từ việc làm lành mỗi ngày.'));
      r.pan = G.ui.panel({
        title: h.title, body, clear: true, className: 'le-panel',
        actions: [
          { label: 'Lễ', primary: true, onClick: (close) => { if (r.bowing) return; r.bowing = true; close(); bow(); } },
          { label: 'Để sau', onClick: (close) => close() },
        ],
        onClose: () => { r.pan = null; if (!r.bowing) quit(); },
      });
    } catch (e) { console.error(e); quit(); }
    async function bow() {
      try {
        P.setPose('bow'); sfx('bowlBell');
        await G.wait(1.6); if (r.dead) return;
        sfx('chime');
        await G.wait(1.5); if (r.dead) return;
        const d = G.save.data; if (!d.le || typeof d.le !== 'object') d.le = {};
        d.le[h.id] = (d.le[h.id] | 0) + 1; G.save.persist();
        G.ui.toast('Bạn đã lễ trước ' + h.title + '. Điều lành bắt đầu từ việc làm lành mỗi ngày.', 4200);
      } catch (e) { console.error(e); }
      quit();
    }
  }
  for (const h of built) {
    const info = LE[h.id];
    G.poi.add({ id: h.id, label: 'Lễ ' + info.short, icon: 'hall', x: (h.poi || h.front).x, z: (h.poi || h.front).z, r: 2.4, desc: info.desc, available: () => !run, onAction: () => { runLe(h); } });
    W.places.push({ label: info.place, desc: info.desc, icon: h.id === 'van-thu' ? 'stupa' : 'hall', x: h.front.x, z: h.front.z });
  }
  G.dienPhu = built;
}
