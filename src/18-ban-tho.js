// =====================================================================
//  BAN THỜ CHÍNH ĐIỆN v6 — "đẹp như ảnh": tượng ngồi thẳng trên MỘT phiến đá kem đặt trên một bàn son dài (không còn bệ cao, không còn gấm).
//  Cụm thờ ở giữa: Đức Phật Thích Ca Mâu Ni (vàng, thiền định ấn, bát) trên toà sen ba hàng cánh mỏng; bên trái (phía người xem)
//  Bồ Tát Quán Thế Âm (sứ trắng, khăn choàng, tịnh bình); bên phải Bồ Tát Địa Tạng (vàng, mũ tỳ lư, tích trượng, minh châu, hào quang lửa SAU lưng).
//  Phía sau: tấm phông son vẽ mạn-đà-la (atlas, vẽ ở 18-ban-tho-tranh.js) có KHUNG sơn đen viền vàng kép; vòm vàng ogee có búp lửa + hai ruy-ý mỗi bên;
//  vầng sáng ĐẶC sau đầu (đĩa son sẫm + tia vàng, hoặc đĩa dự phòng) + vầng sáng cộng màu rất nhẹ; trên cao: bảng ĐẠI HÙNG BẢO ĐIỆN.
//  Trước: bàn son dài có dải sóng nước vàng; lễ vật (bát, lư hương, nến, mâm quả, bình sứ lam cắm sen) đặt thẳng trên phiến đá.
//  Hai bên gian sau: tả chung (đại hồng chung trên giá son), hữu cổ (trống lớn trên giá son); hai đèn nến cao hai bên bàn.
//  KỸ THUẬT: tượng dựng từ hình CÓ CHỈ SỐ (lathe / sphere / tube / capsule…) rồi tự gộp, GIỮ pháp tuyến nhẵn (không qua U.piece).
//  Vật liệu PBR: vàng kim loại (MeshStandard) soi bản đồ phản chiếu PMREM dựng từ "phòng ấm" thủ tục (3 hộp sáng rộng, sàn + trần tối → bóng chuyển
//  mềm như sa-tanh thay vì vệt kim); mặt tượng vàng một vật liệu riêng (matFace); son / men / sáp phủ bóng; sứ trắng phủ bóng; tóc vàng sẫm nhám.
//  Hậu kỳ (07-hau-ky.js: vai mũ + bloom + AO) lo phần không cháy sáng; đèn rọi đổ bóng (bản đồ bóng dựng MỘT lần, tĩnh) + bóng giả dưới toà sen cho máy không có AO.
//  Toạ độ KHUNG v2 như 18-chinh-dien. Mesh thêm vào hallGrp → push meshIn (cắt cảnh); tượng → statueMeshes (18 tự đưa vào meshIn).
// =====================================================================
function buildBanTho(G, ctx) {
  const { THREE, util: U, world: W } = G;
  const { hallGrp, meshIn, statueMeshes, I, K, safe, sign, glow, colH, blocker, Y0, DY, DZ, TT, ZBUD, PH, ZB, WT, YCE, BOX, CN4, boxMM, cyl, lathe } = ctx;
  const PI = Math.PI, TAU = PI * 2, V3 = THREE.Vector3, V2 = THREE.Vector2;
  // máy yếu: G.quality.low chỉ bật SAU khi điện đã dựng (00-core đo khung hình chậm) → khối 'máy yếu' cuối file ghi nhớ vào save, lần mở sau dựng một nửa số đoạn
  const LOW = !!(G.quality && G.quality.low) || (() => { const a = Date.now() - ((G.save && G.save.data && +G.save.data.lowQ) || 0); return a >= 0 && a < 7 * 864e5; })(), Q = LOW ? 0.5 : 1; // lowQ = mốc thời gian lần máy yếu gần nhất; cờ 1 cũ coi như hết hạn
  const sg = (n, min = 6) => Math.max(min, Math.round(n * Q)); // số đoạn chia (máy yếu: một nửa)

  // ---------- Kích thước cụm thờ (khung v2) ----------
  const SLABY = Y0 + 1.58, SLABT = 0.18, TABY = SLABY - SLABT;   // mặt phiến đá 3,50 (thế giới 6,38); mặt bàn son 3,32
  const ZST0 = -89.9, ZT1 = -81.0, ZSL1 = -80.9;                  // bàn son từ sát tường sau tới mặt trước −81,0 (≤ −80,9: không chạm đôi hạc ±7,6 / −79,6); phiến đá nhô trước 0,1
  const TABW = 6.5, SLW = 6.7;                                    // nửa dài bàn / phiến đá (phiến nhô khỏi tấm phông 0,4 mỗi bên)
  const PANW = 6.2, FRW = 0.28, ZPAN0 = -89.75, ZPAN1 = -89.25;    // tấm phông: mặt tranh nửa rộng 6,2; khung sơn đen rộng 0,28 bao quanh
  const PANY0 = SLABY + FRW, PANY1 = 11.62, PANTOP = PANY1 + FRW;  // mặt tranh y 3,78 … 11,62; đỉnh khung 11,90 (bảng hiệu bắt đầu ở 11,97)
  const ZARCH = -88.6, ARCHHW = 4.0, ARCHY = 11.3;                  // vòm vàng: nửa rộng 4,0; đỉnh ống 11,30; búp lửa tới 11,65
  const SX = 4.35, SZ = ZBUD + 0.6;                                // hai pho bên: x ±4,35, hơi lên trước
  const FS = 0.94, HEADY = 5.4;                                    // pho giữa thu 0,94 (vòm cao ≈ 1,25 × tượng: thoáng hơn; bảng hiệu chặn đỉnh vòm); tâm đầu cục bộ
  const YHEAD = SLABY + HEADY * FS, ZHEAD = ZBUD + 0.06 * FS;      // tâm đầu pho giữa (khung v2)
  const ZDISC = ZHEAD - 0.6, RDISC = 1.25;                         // đĩa hào quang đặc: sau đầu 0,6 m, bán kính 1,25 (đầu rộng ≈ 1,10 → tỉ lệ ≈ 2,3)

  // ---------- Màu: thang vàng sâm-panh (màu đỉnh nhân với phản chiếu) ----------
  const GLH = 0xf7e2a0, GLL = 0xe5bf69, GL = 0xd4a843, GLD = 0xb8913f, GLDD = 0x6e4d1e, HAIR = 0x8a6428, GLINE = 0xe7c375; // sáng nhất / sáng / giữa / bóng / sâu / tóc / chỉ vàng
  const SKIN = GLL, LIP = GLD;                                      // thân tượng vàng / môi
  const WH = 0xefe0c8, WHL = 0xfff8ee, WHD = 0xbba685, BR = 0xa8864e, BRD = 0x86683c, LAC = 0x7d0910, RED = 0xa8141a, BLK = 0x14100c, STONE = 0xe0c99a;
  const AUR = 0xd9a63c, EYE = 0x1c1a24, PEARL = 0xfff2d2, HIDE = 0xf0e4c8, CHAIN = 0x3a2a1a, LEAF = 0x4c7a35, LEAFL = 0x5d8c3d, NAVY = 0x1c2b5e; // hào quang lửa / khe mắt / minh châu / da trống / xích / lá / men lam
  const METAL = new Set([GLH, GLL, GL, GLD, GLDD, GLINE, BR, BRD, AUR]), MATTE = new Set([EYE, HIDE, CHAIN, LEAF, LEAFL]); // chia vật liệu theo màu (xem part)

  // =====================================================================
  //  MẢNH NHẴN: giữ pháp tuyến của hình gốc, tô một màu đỉnh đều; gộp bằng U.merge (position / normal / color)
  // =====================================================================
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new V3(), _p = new V3(), _c = new THREE.Color();
  const xform = (o) => {
    _p.set(0, 0, 0); if (o.p) _p.set(o.p[0], o.p[1], o.p[2]);
    _e.set(0, 0, 0, o.order || 'XYZ'); if (o.r) _e.set(o.r[0], o.r[1], o.r[2], o.order || 'XYZ');
    _q.setFromEuler(_e);
    const s = o.s ?? 1; if (typeof s === 'number') _s.set(s, s, s); else _s.set(s[0], s[1], s[2]);
    return _m.compose(_p, _q, _s);
  };
  // o = { p, r, s, order, m: ma trận áp sau cùng (nhóm) }. Mảnh gửi vào LG tự chia theo màu: vàng-đồng → LG (kim loại), tóc → LH (vàng sẫm nhám),
  // màu mờ (mắt, da trống, xích, lá) → LM, còn lại (son, sáp, men, quả, ngọc) → LX (bóng phủ); các danh sách khác giữ nguyên
  const route = (list, color) => (list !== LG ? list : METAL.has(color) ? LG : color === HAIR ? LH : MATTE.has(color) ? LM : LX);
  const part = (list0, geo, color, o = {}) => {
    const list = route(list0, color);
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (!g.attributes.normal) g.computeVertexNormals();
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    g.applyMatrix4(xform(o)); if (o.m) g.applyMatrix4(o.m);
    const n = g.attributes.position.count, arr = new Float32Array(n * 3), Ng = g.attributes.normal, bake = list === LG || list === LF || list === LH; _c.set(color);
    for (let i = 0; i < n; i++) { // vàng: mặt hướng xuống tối dần (×0,66 … ×1) — "AO" nướng sẵn vào màu đỉnh, tăng tương phản sáng / tối trên thân
      let k = 1; if (bake) { const t = U.clamp((Ng.getY(i) + 0.75) / 1.25, 0, 1); k = 0.66 + 0.34 * t * t * (3 - 2 * t); }
      arr[i * 3] = _c.r * k; arr[i * 3 + 1] = _c.g * k; arr[i * 3 + 2] = _c.b * k;
    }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    list.push(g);
  };
  const bx = (list, x0, y0, z0, x1, y1, z1, color) => part(list, BOX, color, { p: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], s: [Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)] });
  const SPH = (r, a = 32, b = 20) => new THREE.SphereGeometry(r, sg(a), sg(b));
  // pháp tuyến các đỉnh trùng vị trí (đường nối kinh tuyến, hai cực của cầu / cánh) → lấy trung bình: hết vệt gấp trên vàng bóng
  const smoothSame = (g) => {
    const P = g.attributes.position, N = g.attributes.normal, same = new Map(), key = (v) => Math.round(v * 1e4) / 1e4;
    for (let i = 0; i < P.count; i++) { const k = key(P.getX(i)) + ',' + key(P.getY(i)) + ',' + key(P.getZ(i)); const e = same.get(k); if (e) e.push(i); else same.set(k, [i]); }
    for (const ids of same.values()) { if (ids.length < 2) continue; let x = 0, y = 0, z = 0; for (const i of ids) { x += N.getX(i); y += N.getY(i); z += N.getZ(i); } const l = Math.hypot(x, y, z) || 1; for (const i of ids) N.setXYZ(i, x / l, y / l, z / l); }
    return g;
  };
  // cánh sen (hoa cắm bình): cầu biến dạng — thon về gốc, nhọn ở đỉnh (y > 0), mũi hơi ngả ra ngoài (+z)
  const petalGeo = (ws, hs) => {
    const g = new THREE.SphereGeometry(1, ws, hs), P = g.attributes.position;
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i), t = (y + 1) / 2;
      const w = Math.sin(Math.min(1, t * 1.12) * PI) * 0.85 + 0.15;
      P.setXYZ(i, x * w, y, z * (0.4 + 0.6 * w) + 0.35 * t * t);
    }
    g.computeVertexNormals();
    return smoothSame(g);
  };
  // cánh sen MỎNG của toà sen (dạng thấu kính dày ~0,05; gốc ở (0,0,0), dọc theo +y dài len, rộng ±1 — nhân chiều rộng bằng ma trận; mũi cong ra ngoài 0,12 rad)
  const petalThin = (len, ws, hs) => {
    const nA = Math.max(6, ws), nT = Math.max(5, hs), pos = [], idx = [];
    for (let j = 0; j <= nT; j++) {
      const t = j / nT, hw = Math.pow(Math.sin(PI * Math.pow(t, 0.6)), 0.6), th = 0.03 * (0.35 + Math.sin(PI * t) * 0.65), curl = 0.06 * len * t * t;
      for (let i = 0; i <= nA; i++) { const a = (i / nA) * TAU; pos.push(Math.cos(a) * hw, t * len * (1 - 0.04 * t), Math.sin(a) * th + curl + 0.1 * hw * Math.sin(a) ** 2); }
    }
    for (let j = 0; j < nT; j++) for (let i = 0; i < nA; i++) { const a = j * (nA + 1) + i, b = a + nA + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    // mặt "trước" của cánh (cột a = 90°, phía +z) phải có pháp tuyến +z; sai chiều (vật liệu vàng một mặt sẽ chỉ thấy mặt trong, tối) thì đảo thứ tự tam giác
    if (g.attributes.normal.getZ(Math.floor(nT / 2) * (nA + 1) + Math.floor(nA / 4)) < 0) { const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const t0 = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t0; } g.computeVertexNormals(); }
    const N = g.attributes.normal; // mép nối kinh tuyến: trung bình hai cột đầu / cuối
    for (let j = 0; j <= nT; j++) { const a = j * (nA + 1), b = a + nA; const x = N.getX(a) + N.getX(b), y = N.getY(a) + N.getY(b), z = N.getZ(a) + N.getZ(b), l = Math.hypot(x, y, z) || 1; N.setXYZ(a, x / l, y / l, z / l); N.setXYZ(b, x / l, y / l, z / l); }
    return smoothSame(g);
  };
  // lưỡi lửa thon (hào quang Địa Tạng): nón dẹt, cong về một bên, đáy ở gốc toạ độ, đỉnh dọc +y
  const flameGeo = (len, w, bend) => {
    const g = new THREE.ConeGeometry(w, len, sg(8, 5), 6, true), P = g.attributes.position;
    for (let i = 0; i < P.count; i++) { const t = (P.getY(i) + len / 2) / len; P.setXYZ(i, P.getX(i) * (1 - 0.25 * t) + bend * len * t * t + 0.07 * len * Math.sin(t * TAU) * Math.sign(bend || 1), P.getY(i) + len / 2, P.getZ(i) * 0.3); }
    g.computeVertexNormals(); return smoothSame(g);
  };
  // tấm chữ nhật có UV trong một ô của atlas (A B C D ngược chiều kim đồng hồ nhìn từ phía mặt; chia nx × ny ô, mỗi ô lặp cả vùng uv)
  const quad = (list, A, B, C, D, uv, nx = 1, ny = 1) => {
    const pos = [], nor = [], uvs = [];
    const ax = B[0] - A[0], ay = B[1] - A[1], az = B[2] - A[2], bx = D[0] - A[0], by = D[1] - A[1], bz = D[2] - A[2];
    let nX = ay * bz - az * by, nY = az * bx - ax * bz, nZ = ax * by - ay * bx; const nl = Math.hypot(nX, nY, nZ) || 1; nX /= nl; nY /= nl; nZ /= nl;
    const P = (u, v) => [0, 1, 2].map((k) => A[k] * (1 - u) * (1 - v) + B[k] * u * (1 - v) + C[k] * u * v + D[k] * (1 - u) * v);
    const [u0, v0, u1, v1] = uv;
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const p00 = P(i / nx, j / ny), p10 = P((i + 1) / nx, j / ny), p11 = P((i + 1) / nx, (j + 1) / ny), p01 = P(i / nx, (j + 1) / ny);
      for (const [p, u, v] of [[p00, u0, v0], [p10, u1, v0], [p11, u1, v1], [p00, u0, v0], [p11, u1, v1], [p01, u0, v1]]) { pos.push(p[0], p[1], p[2]); nor.push(nX, nY, nZ); uvs.push(u, v); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    list.push(g);
  };
  const mergeUV = (list) => {
    let n = 0; for (const g of list) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
    for (const g of list) { const c = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); uv.set(g.attributes.uv.array, o * 2); o += c; g.dispose(); }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    out.computeBoundingSphere(); return out;
  };
  const casters = []; // mesh đổ bóng cho đèn rọi (bóng dựng một lần, tĩnh)
  const addMesh = (geo, mat, name, isStatue, cast) => {
    const m = new THREE.Mesh(geo, mat); m.castShadow = !!cast; m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'chinhDien:' + name;
    hallGrp.add(m); (isStatue ? statueMeshes : meshIn).push(m); if (cast) casters.push(m); return m;
  };

  // =====================================================================
  //  BẢN ĐỒ PHẢN CHIẾU: "phòng ấm" thủ tục — BA hộp sáng rộng (trước-trên, hai bên) + sàn và trần TỐI + tường nâu sẫm
  //  → nửa dưới mọi mặt cong tối dần (sa-tanh), nửa trên đón ba mảng sáng lớn (không còn vệt kim). PMREM dựng MỘT lần. Hỏng → vật liệu dự phòng.
  // =====================================================================
  let envTex = null;
  const buildEnv = () => {
    const es = new THREE.Scene();
    const pane = (w, h, x, y, z, rx, ry, c, k = 1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); es.add(m); };
    pane(40, 40, 0, -6, 0, -PI / 2, 0, 0x2a140a, 0.35);                // sàn: tối (nửa dưới cong tối dần)
    pane(40, 40, 0, 9, 0, PI / 2, 0, 0x9a7448, 1.15);                  // trần: nâu vàng sáng (mặt hướng lên ánh vàng; sàn tối lo phần nửa dưới)
    pane(40, 30, 0, 2, 14, 0, PI, 0x4a2a18, 0.5);                      // tường trước (sau lưng người xem)
    pane(40, 30, 0, 2, -14, 0, 0, 0x3a1a10, 0.5);                      // tường sau nâu đỏ sẫm
    for (const sx of [-1, 1]) pane(30, 30, sx * 14, 2, 0, 0, -sx * PI / 2, 0x4a2616, 0.55); // hai bên
    pane(30, 16, 0, 9, 10, 0, PI, 0xfff0d8, 1.9);                      // hộp sáng 1 (chính): trước – trên, RỘNG (phủ góc ngẩng 6° … 60°)
    pane(16, 16, 0, 8.9, 0, PI / 2, 0, 0xffeccc, 1.3);                 // ô sáng trần: mặt hướng lên (cánh sen, vai, đùi) ánh vàng thay vì nâu tối
    for (const sx of [-1, 1]) pane(9, 12, sx * 13.6, 3.5, 3, 0, -sx * PI / 2, 0xffe2b8, 1.5); // hộp sáng 2, 3: hai bên, hơi trước
    // PMREM đổi trạng thái renderer dùng chung (autoClear, toneMapping, render target) và r160 không tự khôi phục khi ném lỗi giữa chừng → luôn trả lại
    const r = G.renderer, ac = r.autoClear, tm = r.toneMapping, rt = r.getRenderTarget(); let pm = null;
    try { pm = new THREE.PMREMGenerator(r); return pm.fromScene(es, 0.04).texture; }
    finally { r.autoClear = ac; r.toneMapping = tm; r.setRenderTarget(rt); if (pm) pm.dispose(); es.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
  };
  safe('phản chiếu', () => { envTex = buildEnv(); });

  // =====================================================================
  //  VẬT LIỆU (màu đỉnh): vàng kim loại · mặt tượng vàng · tóc vàng sẫm nhám · sơn son-men-sáp bóng phủ · mờ (đá, quả) · sứ trắng · hoa văn atlas · vầng sáng
  // =====================================================================
  const env = envTex ? { envMap: envTex } : {};
  const GI = 1.15, HI = 1.0, FI = 0.6; // cường độ phản chiếu ban ngày: vàng / tóc / mặt
  const matGold = new THREE.MeshStandardMaterial(Object.assign({ vertexColors: true, metalness: envTex ? 1 : 0.45, roughness: 0.4, envMapIntensity: GI, emissive: envTex ? 0x000000 : 0x3a2608 }, env));
  const matFace = new THREE.MeshStandardMaterial(Object.assign({ vertexColors: true, metalness: envTex ? 0.9 : 0.4, roughness: 0.45, envMapIntensity: FI, emissive: envTex ? 0x000000 : 0x2e1e06 }, env));
  const matHair = new THREE.MeshStandardMaterial(Object.assign({ vertexColors: true, metalness: envTex ? 1 : 0.5, roughness: 0.5, envMapIntensity: HI, emissive: envTex ? 0x000000 : 0x2a1a06 }, env));
  const matGloss = new THREE.MeshPhysicalMaterial(Object.assign({ vertexColors: true, metalness: 0, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.25, envMapIntensity: 0.9 }, env)); // sơn son, men lam, nến
  const matMatte = new THREE.MeshStandardMaterial(Object.assign({ vertexColors: true, metalness: 0.05, roughness: 0.55, envMapIntensity: 0.4 }, env)); // phiến đá kem, quả, lá
  const whiteMat = new THREE.MeshPhysicalMaterial(Object.assign({ vertexColors: true, metalness: 0, roughness: 0.3, clearcoat: 0.4, clearcoatRoughness: 0.25, envMapIntensity: 0.52, side: THREE.DoubleSide }, env)); // sứ trắng: không tự phát sáng
  const LG = [], LH = [], LF = [], LX = [], LM = [], LW = [], LO = []; // mảnh: vàng-đồng / tóc / mặt vàng / bóng phủ / mờ / sứ trắng / hoa văn (có UV)

  // ---------- ATLAS 2048²: vẽ ở 18-ban-tho-tranh.js (banThoAtlas → { AT, UV, draw }); ở đây chỉ dùng AT / UV ----------
  const LACS = '#7d0910';
  const ATL = banThoAtlas(G, { PI, TAU, LACS, PANY0, PANY1, YHALO: YHEAD }), AT = ATL.AT, UV = ATL.UV;
  let atlas = null, ornMat = null, haloMat = null, discMat = null;
  safe('atlas hoa văn', () => {
    atlas = U.canvasTex(AT, AT, ATL.draw);
    ornMat = new THREE.MeshStandardMaterial(Object.assign({ map: atlas, color: 0xd8e2f4, emissive: 0xffffff, emissiveMap: atlas, emissiveIntensity: 0.3, roughness: 0.5, metalness: 0, envMapIntensity: 0.5 }, env)); // tự phát sáng nhẹ (0,30 ngày / 0,50 đêm)
    haloMat = new THREE.MeshBasicMaterial({ map: atlas, color: 0xffb860, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.6, fog: false }); // vầng sáng mềm: bloom lo phần toả
    if (UV.haloDisc) discMat = new THREE.MeshStandardMaterial(Object.assign({ map: atlas, emissive: 0xffffff, emissiveMap: atlas, emissiveIntensity: 0.55, alphaTest: 0.5, roughness: 1, metalness: 0, envMapIntensity: 0.1 }, env));
  });
  safe('mất ngữ cảnh', () => {
    // mất ngữ cảnh WebGL (máy ít bộ nhớ): bản đồ phản chiếu là render target nên không tự dựng lại như texture canvas → dựng lại rồi gán cho các vật liệu;
    // bản đồ bóng của đèn rọi (tĩnh) cũng dựng lại
    G.renderer.domElement.addEventListener('webglcontextrestored', () => safe('khôi phục (ban thờ)', () => {
      if (envTex) { const old = envTex; envTex = buildEnv(); for (const m of [matGold, matFace, matHair, matGloss, matMatte, whiteMat, ornMat, discMat]) if (m && m.envMap) { m.envMap = envTex; m.needsUpdate = true; } if (old) old.dispose(); }
      if (spotRef.l) { spotRef.l.shadow.needsUpdate = true; G.renderer.shadowMap.needsUpdate = true; }
    }));
  });
  const spotRef = { l: null }; // đèn rọi (gán ở khối 'đèn rọi')

  // =====================================================================
  //  PHO TƯỢNG NGỒI — toạ độ cục bộ (gốc = tâm mặt phiến đá, +z = mặt trước, mét ở pho giữa; T = ma trận đặt / xoay / thu phóng)
  //  c = { skin, hair, lip, gold, goldL, goldD }; o = { bowl, up: [[x,y,z] tay phải, [x,y,z] tay trái] giơ, hood, crown, staff, pearl, aureole, vase }
  // =====================================================================
  const figure = (L, T, c, o = {}) => {
    const P = (geo, col, op = {}) => part(L, geo, col, Object.assign({ m: T }, op));
    const FC = L === LG ? LF : L; // da mặt: vật liệu riêng (vàng) / sứ
    const PF = (geo, col, op = {}) => part(FC, geo, col, Object.assign({ m: T }, op));
    const seg = (a, b, ra, rb, col) => { const g = new THREE.CylinderGeometry(ra, rb, 1, sg(20), 1, true); g.rotateX(PI / 2); const s = U.segMatrix(a[0], a[1], a[2], b[0], b[1], b[2]); P(g, col, { s: [1, 1, s.len], m: T.clone().multiply(s.m) }); };
    const tube = (pts, r, col) => P(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new V3(p[0], p[1], p[2]))), sg(pts.length * 6), r, sg(10), false), col);
    // dải nếp áo thon hai đầu (mặt cắt hình thấu kính w × h, nằm theo mặt thân): thay ống tròn "đũa" bằng nếp vải mềm; ref = hướng pháp tuyến mặt thân
    const sweep = (pts, w, h, col, ref = [0, 0, 1], taper = 0.35) => {
      const cv = new THREE.CatmullRomCurve3(pts.map((p) => new V3(p[0], p[1], p[2]))), N = sg(pts.length * 5, 12), M = sg(10, 6), pos = [], idx = [];
      const R = new V3(ref[0], ref[1], ref[2]), T = new V3(), B = new V3(), S = new V3(), p = new V3();
      for (let i = 0; i <= N; i++) {
        const t = i / N; cv.getPointAt(t, p); cv.getTangentAt(t, T); B.copy(R).addScaledVector(T, -R.dot(T)).normalize(); S.crossVectors(T, B).normalize();
        const k = Math.pow(Math.sin(PI * Math.min(1 - 1e-4, Math.max(1e-4, t))), taper);
        for (let j = 0; j < M; j++) { const a = (j / M) * TAU, c = Math.cos(a) * w * k, s = Math.sin(a) * h * k; pos.push(p.x + S.x * c + B.x * s, p.y + S.y * c + B.y * s, p.z + S.z * c + B.z * s); }
      }
      for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * M + j, b = i * M + (j + 1) % M, c = (i + 1) * M + j, d = (i + 1) * M + (j + 1) % M; idx.push(a, c, b, b, c, d); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      // mặt cắt đầu tiên của đoạn giữa phải quay pháp tuyến RA NGOÀI (xa trục đường cong); sai chiều thì đảo thứ tự tam giác
      const mid = Math.floor(N / 2) * M, cp = cv.getPointAt(0.5), N0 = g.attributes.normal, P0 = g.attributes.position;
      if ((P0.getX(mid) - cp.x) * N0.getX(mid) + (P0.getY(mid) - cp.y) * N0.getY(mid) + (P0.getZ(mid) - cp.z) * N0.getZ(mid) < 0) { const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const t0 = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t0; } g.computeVertexNormals(); }
      P(g, col);
    };
    const { skin, hair, lip, gold, goldL, goldD } = c;
    // --- toà sen: đế tiện thấp – BA hàng cánh mỏng (16 / 12 / 10, khe 0,04 m, mũi cong 0,12 rad) – gương sen ---
    P(lathe([[0, 0], [2.3, 0], [2.36, 0.12], [2.3, 0.26], [2.02, 0.38], [1.8, 0.5], [1.74, 0.7], [1.86, 0.8], [0, 0.8]], sg(48)), goldD);
    const tier = (n, R, y, tilt, len, col, ph, geo) => {
      const half = (TAU * (R + Math.sin(tilt) * len * 0.45) / n - 0.04) / 2;
      for (let i = 0; i < n; i++) { const a = ph + (i / n) * TAU; P(geo, col, { p: [Math.sin(a) * R, y, Math.cos(a) * R], s: [half, 1, 1], r: [tilt, a, 0], order: 'YXZ' }); }
    };
    tier(16, 1.95, 0.35, 0.9, 1.25, gold, 0, petalThin(1.25, sg(12), sg(10)));
    tier(12, 1.6, 0.55, 0.62, 1.25, goldL, 0.26, petalThin(1.25, sg(12), sg(10)));
    tier(10, 1.2, 0.78, 0.34, 1.1, goldL, 0.31, petalThin(1.1, sg(12), sg(10)));
    P(lathe([[0, 0], [1.5, 0], [1.58, 0.14], [1.52, 0.34], [1.4, 0.42], [0, 0.42]], sg(48)), gold, { p: [0, 0.9, 0] });
    // --- thân: vạt áo (đùi bắt chéo) + hai gối + gấu trước + 5 nếp gấp phủ chân; thân trên tiện (dẹt theo z); cổ ---
    P(SPH(1, 32, 20), skin, { p: [0, 1.74, 0.12], s: [1.95, 0.52, 1.32] });
    for (const sx of [-1, 1]) P(SPH(1, 20, 14), skin, { p: [sx * 1.45, 1.88, 0.62], s: [0.52, 0.4, 0.58] });
    tube([[-1.85, 1.6, 0.3], [-1.0, 1.44, 1.22], [0, 1.38, 1.44], [1.0, 1.44, 1.22], [1.85, 1.6, 0.3]], 0.085, goldD); // gấu áo trước (tối hơn: nếp sâu)
    const thY = (x, z) => 1.74 + 0.52 * Math.sqrt(Math.max(0, 1 - (x / 1.95) ** 2 - ((z - 0.12) / 1.32) ** 2)) + 0.035;
    for (const sx of [-1, 1]) for (const [a, b, bulge] of [[[0.5, 1.32], [1.78, 0.55], 0.14], [[0.85, 1.22], [1.62, 0.85], 0.1], [[0.3, 1.4], [1.15, 1.22], 0.07]].slice(0, sx < 0 ? 3 : 2)) {
      const pts = []; for (let k = 0; k <= 6; k++) { const t = k / 6, x = sx * (a[0] + (b[0] - a[0]) * t), z = a[1] + (b[1] - a[1]) * t + bulge * Math.sin(PI * t); pts.push([x, thY(x, z), z]); }
      sweep(pts, 0.075, 0.042, goldL, [0, 1, 0], 0.5);
    }
    const TP = [[0, 1.45], [1.3, 1.45], [1.3, 1.9], [1.15, 2.4], [1.03, 2.95], [1.09, 3.45], [1.32, 3.82], [1.37, 4.05], [1.25, 4.3], [0.98, 4.43], [0.7, 4.52], [0.5, 4.58], [0, 4.58]]; // eo −8 %, vai dốc ≈ 6°
    P(lathe(TP, sg(64)), skin, { s: [1, 1, 0.76] });
    P(new THREE.CylinderGeometry(0.34, 0.43, 0.56, sg(24), 1, true), skin, { p: [0, 4.78, 0.03] }); // cổ dài hơn
    // nếp y bám theo mặt thân: z của mặt trước = max(thân tiện dẹt, khối đùi) + nhô; vạt y choàng vai trái (+x) chéo xuống hông phải gồm BA nếp song song,
    // cổ áo trong hình chữ V, mép cổ áo bên phải
    const rOf = (y) => { for (let i = 1; i < TP.length - 1; i++) if (y <= TP[i + 1][1]) { const a = TP[i], b = TP[i + 1], t = U.clamp((y - a[1]) / Math.max(1e-6, b[1] - a[1]), 0, 1); return a[0] + (b[0] - a[0]) * t; } return 0.3; };
    const zs = (x, y, lift) => { const r = rOf(y), zt = 0.76 * Math.sqrt(Math.max(0, r * r - x * x)), q = 1 - (x / 1.95) ** 2 - ((y - 1.74) / 0.52) ** 2, zl = q > 0 ? 0.12 + 1.32 * Math.sqrt(q) : 0; return Math.max(zt, zl) + lift; };
    const onBody = (pts, lift) => pts.map(([x, y]) => [x, y, zs(x, y, lift)]);
    sweep(onBody([[0.6, 4.3], [0.35, 3.9], [-0.1, 3.3], [-0.6, 2.7], [-1.1, 2.2], [-1.55, 1.95]], 0.03), 0.14, 0.08, goldL, [0, 0, 1], 0.8);
    sweep(onBody([[0.95, 4.2], [0.65, 3.75], [0.2, 3.1], [-0.3, 2.5], [-0.8, 2.08], [-1.3, 1.9]], 0.02), 0.09, 0.06, goldL, [0, 0, 1], 0.8);
    sweep(onBody([[1.2, 4.05], [0.95, 3.6], [0.55, 3.0], [0.1, 2.4], [-0.4, 2.0]], 0.015), 0.08, 0.055, goldL, [0, 0, 1], 0.8);
    tube(onBody([[-0.62, 4.42], [-0.3, 4.0], [0, 3.6], [0.3, 4.0], [0.62, 4.42]], 0.03), 0.05, skin);
    tube(onBody([[-0.4, 4.5], [-0.75, 4.4], [-1.0, 4.15]], 0.03), 0.06, skin);
    seg([1.24, 3.98, 0.05], [1.5, 2.72, 0.42], 0.4, 0.34, skin);
    // --- tay: vai – cánh tay – khuỷu – cẳng tay – cổ tay; bàn tay đặt trong lòng (thiền định ấn) hoặc giơ lên (o.up) ---
    const SH = o.hood ? 0.8 : 1; // Quán Âm: bàn tay nhỏ hơn
    for (const sx of [-1, 1]) {
      const up = o.up && o.up[sx < 0 ? 0 : 1];
      const sh = [sx * 1.24, 3.98, 0.05], el = [sx * 1.5, 2.72, 0.42], wr = up ? [sx * up[0], up[1], up[2]] : [sx * 0.55, 2.1, 0.98];
      P(SPH(0.4, 20, 14), skin, { p: [sx * 1.2, 4.02, 0.02], s: [sx > 0 ? 1.12 : 1, sx > 0 ? 0.98 : 0.9, sx > 0 ? 1.02 : 0.9] }); // vai trái có y phủ: to hơn
      seg(sh, el, 0.34, 0.29, skin); P(SPH(0.3, 20, 14), skin, { p: el });
      seg(el, wr, 0.28, 0.22, skin); P(SPH(0.23, 16, 12), skin, { p: wr });
      if (up) P(SPH(1, 16, 12), skin, { p: [wr[0], wr[1] + 0.1, wr[2] + 0.06], s: [0.2 * SH, 0.3 * SH, 0.22 * SH] });
      else if (o.up) P(SPH(1, 20, 14), skin, { p: [sx * 0.3, 2.08, 1.02], s: [0.4, 0.13, 0.34] }); // bàn tay ngửa trong lòng (pho bên)
    }
    if (!o.up) { // thiền định ấn: hai bàn tay dẹt chồng lên nhau (0,54 × 0,11 × 0,34), mỗi tay bốn ngón nổi, hai ngón cái chạm nhau, bát đặt trên tay
      const palm = (x, y, z, ry) => {
        P(SPH(1, 24, 14), skin, { p: [x, y, z], s: [0.27, 0.055, 0.17], r: [0, ry, 0] });
        for (let i = 0; i < 4; i++) { const u = (i - 1.5) * 0.115, cs = Math.cos(ry), sn = Math.sin(ry); P(new THREE.CapsuleGeometry(0.03, 0.1, 4, sg(8)), skin, { p: [x + u * cs + 0.24 * sn, y - 0.005, z - u * sn + 0.24 * cs], r: [PI / 2 + 0.4, ry, 0], order: 'YXZ' }); }
      };
      palm(0.16, 2.2, 1.0, -0.1); palm(-0.1, 2.29, 1.03, 0.08);
      for (const sx of [-1, 1]) P(new THREE.CapsuleGeometry(0.033, 0.13, 4, sg(8)), skin, { p: [sx * 0.085, 2.4, 1.14], r: [0, 0, PI / 2 - sx * 0.2] });
    }
    if (o.bowl) { P(lathe([[0, 0], [0.3, 0], [0.38, 0.1], [0.43, 0.26], [0.42, 0.34], [0.38, 0.32], [0.35, 0.14], [0, 0.12]], sg(40)), GLH, { p: [0, 2.37, 1.0], s: 0.9 }); }
    if (o.pearl) P(SPH(0.2, 20, 14), PEARL, { p: [0.55, 2.32, 1.0] });
    // --- đầu: nhỏ hơn 12 % (r 0,6), cổ dài; mũ tóc nhẵn vàng sẫm + 120 lọn xoắn nhỏ + nhục kế có búp lửa; tai dài mảnh; mặt (vật liệu riêng) ---
    const H = [0, HEADY, 0.06], F = (dx, dy, dz) => [H[0] + dx, H[1] + dy, H[2] + (dz > 0.2 ? dz - 0.025 : dz)], hk = o.hood ? 0.9 : 1; // hk: mặt Quán Âm thon hơn
    PF(SPH(0.575, 32, 24), skin, { p: H, s: [0.95 * hk, 1.08, 0.98] });
    P(new THREE.SphereGeometry(0.6, sg(32), sg(16), 0, TAU, 0, 1.45), hair, { p: H, s: [0.96 * hk, 1.1, 0.99], r: [-0.3, 0, 0] });
    P(SPH(0.22, 20, 14), hair, { p: F(0, 0.68, -0.05), s: [1, 0.85, 1] });
    if (!o.hood) {
      const CU = SPH(0.04, 6, 4), n = LOW ? 70 : 130, ct = Math.cos(-0.3), st = Math.sin(-0.3);
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n, th = Math.acos(1 - t * 0.76), ph = i * 2.39996, r = 0.61;
        const x = Math.sin(th) * Math.sin(ph) * 0.96 * r, y = Math.cos(th) * 1.1 * r, z = Math.sin(th) * Math.cos(ph) * 0.99 * r;
        P(CU, hair, { p: F(x, y * ct - z * st, y * st + z * ct) });
      }
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; P(CU, hair, { p: F(Math.sin(a) * 0.2, 0.74 + (i % 2) * 0.08, -0.05 + Math.cos(a) * 0.2), s: 0.9 }); }
      P(lathe([[0, 0], [0.12, 0.02], [0.15, 0.08], [0.13, 0.16], [0.09, 0.24], [0.045, 0.3], [0, 0.34]], sg(14)), goldL, { p: F(0, 0.84, -0.05) }); // búp lửa trên nhục kế
    }
    for (const sx of [-1, 1]) {
      PF(SPH(1, 16, 12), skin, { p: F(sx * 0.545 * hk, -0.05, -0.02), s: [0.07, 0.27, 0.14] });                                         // tai dài mảnh
      PF(SPH(1, 12, 9), skin, { p: F(sx * 0.53 * hk, -0.37, 0.02), s: [0.052, 0.12, 0.085] });                                          // dái tai: nhỏ hơn 25 %, tỉ lệ 1 : 2,2
      PF(SPH(1, 14, 10), skin, { p: F(sx * 0.215 * hk, 0.1, 0.512), s: [0.145 * hk, 0.047, 0.06], r: [0.3, sx * 0.4, sx * 0.12] });      // mí mắt khép hờ
      P(SPH(1, 12, 8), EYE, { p: F(sx * 0.215 * hk, 0.06, 0.524), s: [0.12 * hk, 0.011, 0.026], r: [0, sx * 0.4, sx * 0.14] });          // khe mắt
      P(new THREE.TorusGeometry(0.18, 0.01, sg(6), sg(16), 1.4), lip, { p: F(sx * 0.23 * hk, 0.06, 0.52), r: [0, sx * 0.3, PI / 2 - 0.7] }); // lông mày
      PF(SPH(0.035, 10, 7), skin, { p: F(sx * 0.052, -0.125, 0.56) });                                                                  // cánh mũi
    }
    PF(SPH(1, 12, 9), skin, { p: F(0, -0.03, 0.54), s: [0.048, 0.19, 0.065], r: [0.18, 0, 0] });                                         // sống mũi: nêm dài
    PF(SPH(0.058, 12, 9), skin, { p: F(0, -0.125, 0.575), s: [1.2, 0.7, 0.85] });                                                       // đầu mũi dẹt
    PF(SPH(1, 12, 9), lip, { p: F(0, -0.255, 0.525), s: [0.13 * hk, 0.024, 0.034] });                                                   // môi trên
    PF(SPH(1, 12, 9), lip, { p: F(0, -0.295, 0.52), s: [0.1 * hk, 0.027, 0.038] });                                                     // môi dưới
    PF(SPH(0.15, 14, 10), skin, { p: F(0, -0.46, 0.24), s: [1.0 * hk, 0.72, 0.95] });                                                         // cằm
    P(SPH(0.03, 8, 6), goldL, { p: F(0, 0.26, 0.54) });                                                                                  // bạch hào
    // --- tuỳ chọn hai pho bên ---
    if (o.hood) { // khăn choàng Quán Âm: một mặt tiện nhẵn (khăn rủ có 6 nếp), hở phía trước, phủ từ đỉnh đầu xuống vai
      const hp = [[0, 0.78], [0.34, 0.74], [0.6, 0.52], [0.68, 0.14], [0.73, -0.3], [0.88, -0.78], [1.18, -1.15], [1.36, -1.3]].map((q) => new V2(q[0], H[1] + q[1]));
      const lg = new THREE.LatheGeometry(hp, sg(72), 0.34 * PI, 1.32 * PI), Pv = lg.attributes.position;
      for (let i = 0; i < Pv.count; i++) { const x = Pv.getX(i), z = Pv.getZ(i), a = Math.atan2(x, z), g = 1 - 0.035 * (0.5 - 0.5 * Math.cos(a * 9)); Pv.setXYZ(i, x * g, Pv.getY(i), z * g); } // 6 rãnh nếp rủ
      lg.computeVertexNormals();
      P(lg, skin, { p: [0, 0, H[2]] });
      P(SPH(0.08, 12, 9), goldL, { p: F(0, 0.64, 0.38) });
    }
    if (o.crown) { // mũ tỳ lư: đai vàng + năm lá nhọn phía trước, ngọc đỏ
      P(new THREE.TorusGeometry(0.58, 0.06, sg(8), sg(32)), gold, { p: F(0, 0.22, 0), r: [PI / 2, 0, 0], s: [0.97, 1, 1] });
      for (let k = -2; k <= 2; k++) { const a = k * 0.5; P(new THREE.ConeGeometry(0.15, 0.44, sg(10)), gold, { p: F(Math.sin(a) * 0.58, 0.44, Math.cos(a) * 0.58), s: [1, 1, 0.3], r: [0.22, a, 0], order: 'YXZ' }); P(SPH(0.045, 8, 6), 0xc8302a, { p: F(Math.sin(a) * 0.63, 0.4, Math.cos(a) * 0.63) }); }
    }
    if (o.staff) { // tích trượng trong tay phải (−x): gậy + vòng lớn + sáu khoen + nụ sen
      const X0 = -1.15, Z0 = 0.95;
      P(new THREE.CylinderGeometry(0.05, 0.05, 5.4, sg(10), 1, true), goldD, { p: [X0, 4.3, Z0] });
      P(new THREE.TorusGeometry(0.34, 0.035, sg(8), sg(28)), goldL, { p: [X0, 7.3, Z0] });
      for (let k = 0; k < 6; k++) { const a = PI + (k - 2.5) * 0.42; P(new THREE.TorusGeometry(0.085, 0.018, sg(6), sg(14)), goldL, { p: [X0 + Math.cos(a) * 0.37, 7.3 + Math.sin(a) * 0.37 - 0.06, Z0] }); }
      P(lathe([[0, 0], [0.1, 0.02], [0.13, 0.12], [0.08, 0.3], [0, 0.42]], sg(16)), goldL, { p: [X0, 7.62, Z0] });
    }
    if (o.vase) { // tịnh bình giữa hai tay trước ngực
      P(lathe([[0, 0], [0.18, 0], [0.24, 0.06], [0.23, 0.32], [0.12, 0.46], [0.1, 0.6], [0.15, 0.68], [0.1, 0.7], [0, 0.66]], sg(32)), goldL, { p: [0, 3.3, 1.12] });
      P(new THREE.TorusGeometry(0.2, 0.025, sg(6), sg(24)), 0x3a5a9a, { p: [0, 3.5, 1.12], r: [PI / 2, 0, 0] });
      P(new THREE.CylinderGeometry(0.012, 0.014, 0.42, sg(6), 1, true), LEAF, { p: [0.04, 4.15, 1.1], r: [0, 0, 0.18] }); // nhành dương
      for (let k = 0; k < 4; k++) P(SPH(1, 8, 6), LEAFL, { p: [0.0 + k * 0.045, 4.12 + k * 0.07, 1.1 + (k % 2) * 0.03], s: [0.035, 0.09, 0.02], r: [0, 0, 0.6 - k * 0.3] });
    }
    if (o.aureole) { // hào quang lửa SAU lưng (ngay sau lưng áo, z −1,1 cục bộ): vòng 16 lưỡi lửa rộng, lượn sóng, chồng nhau toả quanh đầu – vai; hai lớp (vàng + vàng sáng)
      const NF = 16, cx = 0, cy = 4.3, R0 = 1.5, a0 = -0.3, a1 = PI + 0.3, ZA = -1.1;
      for (let i = 0; i < NF; i++) {
        const a = a0 + (a1 - a0) * (i / (NF - 1)), len = 1.05 + 0.3 * Math.sin(i * 1.9) ** 2 + (i % 2 ? 0 : 0.2), bend = (a > PI / 2 ? -1 : 1) * 0.16;
        const px = cx + Math.cos(a) * (R0 - 0.05), py = cy + Math.sin(a) * (R0 - 0.05);
        P(flameGeo(len, 0.4, bend), gold, { p: [px, py, ZA + (i % 2) * 0.05], r: [0, 0, a - PI / 2] });
        P(flameGeo(len * 0.62, 0.22, bend), GLH, { p: [px, py, ZA + 0.09], r: [0, 0, a - PI / 2] });
      }
      P(new THREE.TorusGeometry(R0 - 0.05, 0.05, sg(8), sg(48), a1 - a0 + 0.1), GLL, { p: [cx, cy, ZA + 0.04], r: [0, 0, a0 - 0.05] });
    }
  };
  const mat4 = (x, y, z, yaw, s) => new THREE.Matrix4().compose(new V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), new V3(s, s, s));

  // =====================================================================
  //  BA PHO TƯỢNG (đứng thẳng trên phiến đá) + VẦNG SÁNG
  // =====================================================================
  const CGOLD = { skin: SKIN, hair: HAIR, lip: LIP, gold: GL, goldL: GLL, goldD: GLD };
  const CWHITE = { skin: WH, hair: 0xe0d0b8, lip: 0xc99a88, gold: WH, goldL: WHL, goldD: WHD }; // Quán Âm toàn sứ trắng ngà
  safe('tượng giữa', () => figure(LG, mat4(0, SLABY, ZBUD, 0, FS), CGOLD, { bowl: true }));
  const TL = mat4(-SX, SLABY, SZ, 0.2, 0.6), TR = mat4(SX, SLABY, SZ, -0.2, 0.62); // mỗi pho bên một khối safe: pho này lỗi không kéo theo pho kia
  safe('tượng Quán Âm', () => {
    figure(LW, TL, CWHITE, { hood: true, vase: true, up: [[0.32, 3.25, 1.05], [0.32, 3.25, 1.05]] });
    const h1 = new V3(0, 5.4, -0.9).applyMatrix4(TL); glow(h1.x, h1.y, h1.z, 2.0, [0.8, 0.76, 0.68], false);
  });
  safe('tượng Địa Tạng', () => {
    figure(LG, TR, CGOLD, { crown: true, staff: true, pearl: true, aureole: true, up: [[1.15, 3.35, 0.9], null] });
    const q = new V3(0.55, 2.35, 1.0).applyMatrix4(TR); glow(q.x, q.y, q.z, 0.8, [1.0, 0.92, 0.65], false); // minh châu
    const h2 = new V3(0, 5.4, -0.9).applyMatrix4(TR); glow(h2.x, h2.y, h2.z, 2.0, [0.8, 0.62, 0.36], false);
  });
  safe('hào quang', () => {
    // đĩa ĐẶC sau đầu pho giữa (0,6 m sau đầu): đĩa son sẫm + tia vàng + vòng hạt (UV.haloDisc, alphaTest 0,5) — hoặc đĩa dự phòng bằng hình học; đầu hiện rõ trên nền sẫm
    if (discMat && UV.haloDisc) {
      const g = new THREE.CircleGeometry(RDISC, sg(64, 24)), uv = g.attributes.uv, d = UV.haloDisc;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, d[0] + uv.getX(i) * (d[2] - d[0]), d[1] + uv.getY(i) * (d[3] - d[1]));
      g.translate(0, YHEAD, ZDISC); addMesh(g, discMat, 'dia-hao-quang', false, false);
    } else {
      part(LM, new THREE.CircleGeometry(RDISC, sg(64, 24)), 0x5a0e10, { p: [0, YHEAD, ZDISC] });
      part(LG, new THREE.TorusGeometry(RDISC * 0.92, 0.05, sg(8), sg(64)), GLL, { p: [0, YHEAD, ZDISC + 0.03] });
      part(LG, new THREE.TorusGeometry(RDISC * 0.62, 0.025, sg(6), sg(48)), GL, { p: [0, YHEAD, ZDISC + 0.03] });
      for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU, r = RDISC * 0.77; part(LG, new THREE.ConeGeometry(0.045, 0.34, 5), GLL, { p: [Math.cos(a) * r, YHEAD + Math.sin(a) * r, ZDISC + 0.03], r: [0, 0, a - PI / 2], s: [1, 1, 0.5] }); }
    }
    // vầng sáng cộng màu mềm quanh đĩa (yếu: bloom lo phần toả)
    const g2 = new THREE.PlaneGeometry(4.6, 4.6), uv2 = g2.attributes.uv;
    for (let i = 0; i < uv2.count; i++) uv2.setXY(i, UV.halo[0] + uv2.getX(i) * (UV.halo[2] - UV.halo[0]), UV.halo[1] + uv2.getY(i) * (UV.halo[3] - UV.halo[1]));
    g2.translate(0, YHEAD, ZDISC - 0.25);
    if (haloMat) addMesh(g2, haloMat, 'hao-quang', false, false);
    glow(0, YHEAD, ZDISC - 0.3, 4.2, [0.8, 0.58, 0.3], false);
  });

  // =====================================================================
  //  PHIẾN ĐÁ KEM + BÀN SON DÀI (một khối) + TẤM PHÔNG CÓ KHUNG + VÒM VÀNG + BẢNG HIỆU + CÂU ĐỐI
  // =====================================================================
  safe('bàn thờ', () => {
    // bàn son: thân + chân vàng + thanh vàng trên / dưới + dải sóng nước vàng mặt trước và hai đầu
    bx(LX, -TABW, Y0 + 0.12, ZST0, TABW, TABY, ZT1, LAC);
    bx(LG, -TABW - 0.04, Y0, ZT1 - 0.12, TABW + 0.04, Y0 + 0.14, ZT1 + 0.04, GLD);                      // chân váy
    for (const sx of [-1, 1]) bx(LG, sx * (TABW - 0.04), Y0, ZST0, sx * (TABW + 0.04), Y0 + 0.14, ZT1 + 0.04, GLD);
    bx(LG, -TABW, TABY - 0.12, ZT1, TABW, TABY - 0.02, ZT1 + 0.04, GL);                                 // thanh vàng dưới phiến đá
    bx(LG, -TABW, Y0 + 0.14, ZT1, TABW, Y0 + 0.26, ZT1 + 0.04, GL);                                     // thanh vàng trên chân váy
    for (const sx of [-1, 1]) bx(LG, sx * (TABW - 0.16), Y0 + 0.14, ZT1, sx * TABW, TABY - 0.02, ZT1 + 0.04, GL);
    const yb0 = Y0 + 0.3, yb1 = TABY - 0.16;
    quad(LO, [-TABW + 0.16, yb0, ZT1 + 0.025], [TABW - 0.16, yb0, ZT1 + 0.025], [TABW - 0.16, yb1, ZT1 + 0.025], [-TABW + 0.16, yb1, ZT1 + 0.025], UV.wave, 7, 1);
    const xs = TABW + 0.005;
    quad(LO, [xs, yb0, ZT1 - 0.1], [xs, yb0, ZST0 + 0.5], [xs, yb1, ZST0 + 0.5], [xs, yb1, ZT1 - 0.1], UV.wave, 4, 1);
    quad(LO, [-xs, yb0, ZST0 + 0.5], [-xs, yb0, ZT1 - 0.1], [-xs, yb1, ZT1 - 0.1], [-xs, yb1, ZST0 + 0.5], UV.wave, 4, 1);
    // phiến đá kem (dày 0,18, nhô khỏi tấm phông 0,4 mỗi bên): mặt trên có ô đá nếu atlas có UV.stone, không thì màu đỉnh; chỉ vàng mảnh quanh mép
    if (UV.stone) {
      quad(LO, [-SLW, SLABY, ZSL1], [SLW, SLABY, ZSL1], [SLW, SLABY, ZST0], [-SLW, SLABY, ZST0], UV.stone, 5, 4);
      bx(LM, -SLW, TABY, ZST0, SLW, SLABY - 0.002, ZSL1, STONE);
    } else bx(LM, -SLW, TABY, ZST0, SLW, SLABY, ZSL1, STONE);
    bx(LG, -SLW - 0.02, SLABY - 0.07, ZSL1 - 0.01, SLW + 0.02, SLABY + 0.004, ZSL1 + 0.02, GL);       // mép vàng trước
    for (const sx of [-1, 1]) bx(LG, sx * (SLW - 0.01), SLABY - 0.07, ZST0, sx * (SLW + 0.02), SLABY + 0.004, ZSL1 + 0.02, GL);
    colH.box(-SLW - 0.05, ZST0, SLW + 0.05, ZSL1 + 0.02, 'pedestal'); colH.box(-SLW, ZB + WT, SLW, ZST0, 'altar'); // cả khe sau tấm phông
    blocker(-SLW - 0.05, Y0, ZST0, SLW + 0.05, PANTOP + 0.3, ZSL1 + 0.02); // chắn máy quay tự do (khung v2): không chui vào bàn / tượng / tấm phông
  });
  safe('phông', () => {
    const X = PANW, y0 = PANY0, y1 = PANY1, z0 = ZPAN0, z1 = ZPAN1, xo = X + FRW, zf = z1 + 0.04;
    quad(LO, [-X, y0, z1], [X, y0, z1], [X, y1, z1], [-X, y1, z1], UV.mandala);                       // mặt tranh mạn-đà-la
    bx(LX, -X, y0, z0, X, y1, z1 - 0.003, 0x3a0a0a);                                                    // thân phông (sau tranh)
    // khung sơn đen rộng 0,28 + hai đường chỉ vàng kép (ngoài: sát mép ngoài; trong: sát mép tranh)
    bx(LM, -xo, SLABY, z0, -X, PANTOP, zf, BLK); bx(LM, X, SLABY, z0, xo, PANTOP, zf, BLK);
    bx(LM, -X, y1, z0, X, PANTOP, zf, BLK); bx(LM, -X, SLABY, z0, X, y0, zf, BLK);
    const line = (x0, yy0, x1, yy1, w) => { // khung chữ nhật rỗng bằng bốn thanh chỉ vàng
      bx(LG, x0, yy0, zf - 0.004, x0 + w, yy1, zf + 0.012, GLINE); bx(LG, x1 - w, yy0, zf - 0.004, x1, yy1, zf + 0.012, GLINE);
      bx(LG, x0, yy0, zf - 0.004, x1, yy0 + w, zf + 0.012, GLINE); bx(LG, x0, yy1 - w, zf - 0.004, x1, yy1, zf + 0.012, GLINE);
    };
    line(-xo + 0.05, SLABY + 0.05, xo - 0.05, PANTOP - 0.05, 0.026);
    line(-X - 0.05, y0 - 0.05, X + 0.05, y1 + 0.05, 0.026);
  });
  safe('khung vòm', () => {
    // vòm ogee vàng ôm pho giữa: hai nửa trái / phải gặp nhau ở một đỉnh nhọn, búp lửa trên đỉnh; hai ruy-ý (xoắn mây) mỗi bên ở vai vòm; hạt dọc vòm
    const hw = ARCHHW, y0 = SLABY + 0.1, ya = ARCHY;
    const half = [[hw, y0], [hw, y0 + 2.6], [hw, y0 + 4.4], [hw - 0.12, ya - 3.15], [hw - 0.6, ya - 2.0], [hw - 1.5, ya - 1.05], [hw - 2.7, ya - 0.5], [0.9, ya - 0.2], [0.3, ya - 0.06], [0, ya]];
    const mk = (sx) => new THREE.CatmullRomCurve3(half.map((q) => new V3(q[0] * sx, q[1], ZARCH)), false, 'centripetal');
    for (const sx of [-1, 1]) {
      const cv = mk(sx);
      part(LG, new THREE.TubeGeometry(cv, sg(70), 0.12, sg(12), false), GL);
      for (let i = 0; i <= 14; i++) { const p = cv.getPointAt(i / 14); part(LG, SPH(0.075, 10, 7), GLL, { p: [p.x, p.y, p.z + 0.12] }); } // hạt dọc vòm
      // ruy-ý: xoắn ốc Archimedes (ống r 0,03, rộng ≈ 0,5) ở hai độ cao vai; lệch nhẹ vào trong, gắn vào vòm bằng một cán ngắn
      for (const [yy, ph] of [[SLABY + 4.6, 0], [SLABY + 5.55, 0.5]]) {
        const cx = sx * (hw - 0.55 - (yy > SLABY + 5 ? 0.35 : 0)), pts = [];
        for (let k = 0; k <= 26; k++) { const t = k / 26, a = ph + t * 2.1 * PI + 0.6, r = 0.3 * (1 - t * 0.8); pts.push(new V3(cx + sx * Math.cos(a) * r, yy + Math.sin(a) * r, ZARCH + 0.02)); }
        part(LG, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), sg(28), 0.035, sg(6), false), GL);
        part(LG, new THREE.CylinderGeometry(0.03, 0.03, 0.5, sg(6), 1, true), GL, { p: [sx * (hw - 0.28 - (yy > SLABY + 5 ? 0.18 : 0)), yy + 0.02, ZARCH + 0.02], r: [0, 0, PI / 2 + sx * 0.18] });
      }
    }
    // búp lửa trên đỉnh (0,35 m) + đế sen dưới hai chân vòm
    part(LG, lathe([[0, 0], [0.12, 0.02], [0.17, 0.09], [0.11, 0.18], [0.075, 0.27], [0.03, 0.36], [0, 0.4]], sg(18)), GLL, { p: [0, ya - 0.02, ZARCH] });
    for (const sx of [-1, 1]) part(LG, lathe([[0, 0], [0.36, 0], [0.38, 0.08], [0.24, 0.14], [0.19, 0.3], [0, 0.3]], sg(28)), GLD, { p: [sx * hw, SLABY, ZARCH] });
  });
  safe('bảng hiệu', () => {
    // bảng đen chữ vàng treo trước đỉnh vòm, trên đỉnh khung tấm phông (đỉnh bảng 12,82 < đà ngang 12,87); thân gỗ sẫm phía sau + hai thanh treo lên trần
    const ZP = -88.0, YP = 12.395, HP = 0.85;
    meshIn.push(sign(['ĐẠI HÙNG BẢO ĐIỆN'], 6.2, HP, 0, YP, ZP, 0, { ppu: 200, bg1: '#14100c', bg2: '#0a0806' }));
    I.G.add(BOX, BLK, { p: [0, YP, ZP - 0.05], s: [6.3, HP + 0.1, 0.09] });
    for (const sx of [-1, 1]) I.G.add(BOX, K.goldD, { p: [sx * 2.7, (YCE + YP + HP / 2) / 2, ZP - 0.05], s: [0.07, YCE - YP - HP / 2, 0.07] });
  });
  safe('câu đối tường sau', () => {
    const o = { vertical: true, ppu: 170, bg1: '#14100c', bg2: '#0a0806' };
    [[['GIỚI', 'ĐỊNH', 'TUỆ'], -(PANW + FRW + 1.9)], [['BÌNH', 'AN', 'HÒA', 'THUẬN'], PANW + FRW + 1.9]].forEach(([t, x]) => meshIn.push(sign(t, 0.85, 4.0, x, 7.4, ZB + WT + 0.06, 0, o)));
  });

  // =====================================================================
  //  LỄ VẬT trên phiến đá (bát, lư hương, nến, mâm quả, bình sứ lam cắm sen) + ĐÈN NẾN CAO hai bên bàn + bóng giả dưới toà sen
  // =====================================================================
  safe('lễ vật', () => {
    const TS = SLABY, zt = -81.8;
    part(LG, lathe([[0, 0], [0.3, 0], [0.42, 0.08], [0.5, 0.22], [0.52, 0.36], [0.49, 0.44], [0.45, 0.42], [0.43, 0.3], [0.38, 0.14], [0, 0.1]], sg(40)), GLL, { p: [0, TS, -81.45] }); // bát vàng giữa trước
    // lư hương đồng nhỏ sau bát: thân tiện, ba chân, hai tai, tro + nén hương, khói
    const k = 0.75, zl = -82.4;
    part(LG, lathe([[0, 0], [0.2, 0], [0.34, 0.1], [0.42, 0.3], [0.46, 0.5], [0.52, 0.58], [0.46, 0.62], [0.4, 0.55], [0, 0.5]], sg(32)), BR, { p: [0, TS, zl], s: k });
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 0.5; part(LG, new THREE.CylinderGeometry(0.05 * k, 0.07 * k, 0.1 * k, sg(10)), BR, { p: [Math.sin(a) * 0.24 * k, TS + 0.05 * k, zl + Math.cos(a) * 0.24 * k] }); }
    for (const sx of [-1, 1]) part(LG, new THREE.TorusGeometry(0.15 * k, 0.035 * k, sg(6), sg(14), PI), BR, { p: [sx * 0.5 * k, TS + 0.58 * k, zl] });
    part(LM, new THREE.CylinderGeometry(0.38 * k, 0.38 * k, 0.04, 12), 0x6b6158, { p: [0, TS + 0.52 * k, zl] });
    const rnd = U.rng(31);
    for (let i = 0; i < 12; i++) { const a = rnd() * TAU, r = Math.sqrt(rnd()) * 0.26 * k, h = (0.32 + rnd() * 0.28) * k; part(LM, BOX, 0x8a3020, { p: [Math.cos(a) * r, TS + 0.54 * k + h / 2, zl + Math.sin(a) * r], s: [0.014, h, 0.014], r: [(rnd() - 0.5) * 0.2, 0, (rnd() - 0.5) * 0.2] }); }
    W.smokeSpots.push([0, TS + 0.9 + DY, zl + DZ]); // ngay trên đầu nén hương (≈ TS + 0,85): khói thấy rõ bốc lên từ lư
    // nến đỏ (chỉ ngọn lửa tự sáng) trên chân đèn vàng, hai bên
    const candle = (x) => {
      part(LG, lathe([[0, 0], [0.22, 0], [0.24, 0.05], [0.1, 0.1], [0.07, 0.3], [0.12, 0.36], [0.14, 0.46], [0.11, 0.48], [0, 0.48]], sg(28)), GLL, { p: [x, TS, zt - 0.1] });
      part(LX, new THREE.CylinderGeometry(0.085, 0.09, 0.95, sg(20)), RED, { p: [x, TS + 0.955, zt - 0.1] });
      I.L.add(CN4, 0xffd27a, { p: [x, TS + 1.5, zt - 0.1], s: [0.1, 0.2, 0.1] }); glow(x, TS + 1.52, zt - 0.1, 0.8, [1.0, 0.72, 0.32], false);
    };
    candle(-2.9); candle(2.9);
    // mâm quả trên đế vàng: táo đỏ, cam, lê xanh, chùm nho tím (quả nhám)
    const plate = (x) => {
      part(LG, lathe([[0, 0], [0.2, 0], [0.18, 0.08], [0.1, 0.12], [0.1, 0.2], [0.4, 0.26], [0.46, 0.3], [0.44, 0.32], [0, 0.3]], sg(36)), GL, { p: [x, TS, zt] });
      const FR = [[0.14, 0xd8322a], [0.14, 0xf39a2a], [0.13, 0x8cc050], [0.13, 0xf5d03a], [0.14, 0xe0402a], [0.13, 0xf39a2a]];
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.3, [r, c] = FR[i]; part(LM, SPH(r, 14, 10), c, { p: [x + Math.cos(a) * 0.24, TS + 0.31 + r * 0.9, zt + Math.sin(a) * 0.24] }); }
      for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; part(LM, SPH(0.13, 14, 10), i ? 0xf39a2a : 0xd8322a, { p: [x + Math.cos(a) * 0.11, TS + 0.55, zt + Math.sin(a) * 0.11] }); }
      const rg = U.rng(7 + Math.round(x * 3));
      for (let i = 0; i < 10; i++) part(LM, SPH(0.05, 8, 6), 0x5a2a6a, { p: [x + 0.3 + (rg() - 0.5) * 0.16, TS + 0.34 + rg() * 0.12, zt + 0.32 + (rg() - 0.5) * 0.16] });
    };
    plate(-1.5); plate(1.5);
    // bình sứ men lam (#1C2B5E, dải vàng) cắm sen hồng (ba bông, hai nụ, lá)
    const PG = petalGeo(sg(8), sg(6));
    const vase = (x) => {
      part(LX, lathe([[0, 0], [0.2, 0], [0.26, 0.06], [0.3, 0.3], [0.27, 0.58], [0.16, 0.78], [0.13, 0.92], [0.17, 1.02], [0.12, 1.04], [0, 1.0]], sg(36)), NAVY, { p: [x, TS, zt] });
      part(LG, new THREE.TorusGeometry(0.3, 0.02, sg(6), sg(32)), GL, { p: [x, TS + 0.34, zt], r: [PI / 2, 0, 0] });        // dải vàng quanh bụng bình
      part(LG, new THREE.TorusGeometry(0.16, 0.02, sg(6), sg(24)), GL, { p: [x, TS + 1.02, zt], r: [PI / 2, 0, 0] });
      const stem = (fx, fy, fz) => part(LM, new THREE.CylinderGeometry(0.012, 0.016, fy - TS - 0.95, sg(6), 1, true), LEAF, { p: [fx, (fy + TS + 0.95) / 2, fz] });
      const flower = (fx, fy, fz, kk) => {
        stem(fx, fy, fz); part(LM, SPH(0.06 * kk, 10, 7), 0xf5d03a, { p: [fx, fy, fz] });
        for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, tilt = 0.85 + (i % 2) * 0.35; part(LM, PG, i % 2 ? 0xf2a0b8 : 0xf6b6c8, { p: [fx + Math.sin(a) * 0.05 * kk, fy + 0.02, fz + Math.cos(a) * 0.05 * kk], s: [0.07 * kk, 0.11 * kk, 0.03 * kk], r: [tilt, a, 0], order: 'YXZ' }); }
      };
      const bud = (fx, fy, fz) => { stem(fx, fy, fz); part(LM, SPH(1, 10, 8), 0xf2a0b8, { p: [fx, fy + 0.06, fz], s: [0.07, 0.12, 0.07] }); };
      flower(x - 0.14, TS + 1.55, zt + 0.08, 1.0); flower(x + 0.16, TS + 1.72, zt - 0.05, 1.1); flower(x + 0.02, TS + 1.42, zt + 0.18, 0.9);
      bud(x - 0.22, TS + 1.8, zt - 0.1); bud(x + 0.26, TS + 1.5, zt + 0.12);
      part(LM, new THREE.CircleGeometry(0.16, sg(16)), LEAF, { p: [x + 0.1, TS + 1.3, zt - 0.14], r: [-PI / 2 + 0.3, 0.4, 0] });
    };
    vase(-5.5); vase(5.5);
    // hai đèn nến cao hai bên bàn (x ±7,8): cột vàng tiện, đài sen, nến đỏ, ngọn lửa
    const lamp = (x) => {
      part(LG, lathe([[0, 0], [0.42, 0], [0.44, 0.06], [0.22, 0.1], [0.14, 0.3], [0.1, 0.5], [0.1, 1.9], [0.15, 2.05], [0.32, 2.22], [0.36, 2.36], [0.32, 2.4], [0.28, 2.38], [0, 2.3]], sg(32)), GL, { p: [x, Y0, -82] });
      for (const yy of [0.9, 1.4]) part(LG, new THREE.TorusGeometry(0.14, 0.035, sg(6), sg(20)), GLL, { p: [x, Y0 + yy, -82], r: [PI / 2, 0, 0] });
      part(LX, new THREE.CylinderGeometry(0.1, 0.11, 0.55, sg(20)), RED, { p: [x, Y0 + 2.575, -82] });
      I.L.add(CN4, 0xffd27a, { p: [x, Y0 + 2.95, -82], s: [0.12, 0.24, 0.12] }); glow(x, Y0 + 2.98, -82, 1.2, [1.0, 0.74, 0.34], false);
      colH.circle(x, -82, 0.5, 'lamp');
    };
    lamp(-7.8); lamp(7.8);
  });

  // =====================================================================
  //  TẢ CHUNG (đại hồng chung trên giá son) — HỮU CỔ (trống lớn trên giá son)
  // =====================================================================
  safe('tả chung', () => {
    const X = -11.5, Z = -86, L = LG;
    for (const sx of [-1, 1]) { cyl(I.S, X + sx * 1.4, Y0 + 2.3, Z, 0.15, 0.17, 4.6, K.lac, 10); cyl(I.F, X + sx * 1.4, Y0 + 0.1, Z, 0.32, 0.36, 0.2, K.stone, 8); cyl(I.G, X + sx * 1.4, Y0 + 4.55, Z, 0.19, 0.19, 0.1, K.gold, 10); }
    boxMM(I.S, X - 1.75, Y0 + 4.6, Z - 0.18, X + 1.75, Y0 + 4.95, Z + 0.18, K.lac);
    boxMM(I.G, X - 1.8, Y0 + 4.95, Z - 0.22, X + 1.8, Y0 + 5.02, Z + 0.22, K.gold);
    part(L, lathe([[0.92, 0], [0.96, 0.08], [0.92, 0.22], [0.87, 0.7], [0.84, 1.3], [0.74, 1.8], [0.52, 2.05], [0.24, 2.2], [0, 2.22]], sg(48)), BR, { p: [X, Y0 + 0.75, Z] });
    part(L, new THREE.CircleGeometry(0.9, sg(32)), BRD, { p: [X, Y0 + 0.8, Z], r: [PI / 2, 0, 0] });                 // đáy kín (nhìn từ dưới không hở)
    for (const yy of [0.35, 1.25]) part(L, new THREE.TorusGeometry(0.88 - yy * 0.03, 0.035, sg(6), sg(40)), GLD, { p: [X, Y0 + 0.75 + yy, Z], r: [PI / 2, 0, 0] });
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; part(L, SPH(0.05, 8, 6), GLD, { p: [X + Math.sin(a) * 0.82, Y0 + 2.25 + (i % 2) * 0.18, Z + Math.cos(a) * 0.82] }); }
    part(L, new THREE.TorusGeometry(0.2, 0.06, sg(8), sg(20)), BRD, { p: [X, Y0 + 3.1, Z] });                        // quai
    part(L, new THREE.CylinderGeometry(0.03, 0.03, 1.3, sg(8), 1, true), CHAIN, { p: [X, Y0 + 3.95, Z] });             // xích treo
    colH.circle(X, Z, 1.6, 'bell'); blocker(X - 1.6, Y0, Z - 1.6, X + 1.6, Y0 + 5.1, Z + 1.6);
  });
  safe('hữu cổ', () => {
    // cả cụm (giá + trống) dựng cục bộ quanh (X, Z) rồi xoay −0,55 rad: mặt trống hướng chếch về giữa điện, thấy cả thân trống từ gian giữa
    const X = 11.5, Z = -86, L = LG, YC = Y0 + 1.5, T = mat4(X, 0, Z, -0.55, 1);
    const bxl = (x0, y0, z0, x1, y1, z1, col) => part(L, BOX, col, { p: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], s: [x1 - x0, y1 - y0, z1 - z0], m: T });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) bxl(sx * 1.3 - 0.09, Y0, sz * 0.62 - 0.09, sx * 1.3 + 0.09, Y0 + 1.1, sz * 0.62 + 0.09, LAC);
    for (const sx of [-1, 1]) bxl(sx * 1.3 - 0.1, Y0 + 1.0, -0.8, sx * 1.3 + 0.1, Y0 + 1.18, 0.8, LAC);
    for (const sz of [-1, 1]) bxl(-1.4, Y0 + 0.25, sz * 0.62 - 0.08, 1.4, Y0 + 0.4, sz * 0.62 + 0.08, LAC);
    for (const sz of [-1, 1]) part(L, new THREE.TorusGeometry(1.2, 0.07, sg(8), sg(24), PI), LAC, { p: [0, YC, sz * 0.55], r: [0, 0, PI], m: T }); // vòng đỡ dưới thân
    part(L, lathe([[1.0, -0.8], [1.08, -0.5], [1.12, 0], [1.08, 0.5], [1.0, 0.8]], sg(48)), 0xb0301f, { p: [0, YC, 0], r: [PI / 2, 0, 0], m: T });   // thân trống (trục z cục bộ)
    for (const sz of [-1, 1]) {
      part(L, new THREE.CircleGeometry(1.0, sg(40)), HIDE, { p: [0, YC, sz * 0.8], r: [0, sz > 0 ? 0 : PI, 0], m: T });                         // mặt da
      part(L, new THREE.TorusGeometry(1.0, 0.045, sg(8), sg(40)), GLD, { p: [0, YC, sz * 0.8], m: T });
      for (let i = 0; i < 20; i++) { const a = (i / 20) * TAU; part(L, SPH(0.035, 8, 6), GLD, { p: [Math.cos(a) * 1.03, YC + Math.sin(a) * 1.03, sz * 0.68], m: T }); } // đinh đồng
    }
    colH.circle(X, Z, 1.6, 'drum'); blocker(X - 1.6, Y0, Z - 1.6, X + 1.6, Y0 + 5.1, Z + 1.6);
  });

  // =====================================================================
  //  GỘP MESH (đổ bóng: vàng / tóc / mặt / sứ / bóng phủ / mờ), BÓNG GIẢ, TƯỢNG CŨ, ĐIỂM NHÌN, ĐÈN, BỤI SÁNG, NGÀY / ĐÊM
  // =====================================================================
  safe('gộp', () => {
    // mỗi mesh một khối safe riêng: một nhóm gộp lỗi không làm mất các nhóm còn lại
    for (const [name, list, mat, isStatue] of [['tuong-vang', LG, matGold, true], ['toc-tuong', LH, matHair, true], ['mat-tuong', LF, matFace, true], ['tuong-su', LW, whiteMat, true], ['son-men-bong', LX, matGloss, false], ['mo', LM, matMatte, false]])
      if (list.length) safe('gộp ' + name, () => addMesh(U.merge(list), mat, name, isStatue, true));
    if (LO.length && ornMat) safe('gộp hoa-van', () => addMesh(mergeUV(LO), ornMat, 'hoa-van', false, false));
  });
  let blobMat = null;
  safe('bóng giả', () => {
    // bóng tiếp xúc giả (đĩa chuyển sắc đen → trong, 1,6 × diện tích chân) dưới ba toà sen và hai bình: chỉ hiện khi KHÔNG có AO (máy yếu / ngoài vùng hậu kỳ)
    const tex = U.canvasTex(64, 64, (c) => { const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,0.95)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); });
    blobMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.35, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, fog: false });
    const list = [], add = (x, z, r) => { const g = new THREE.PlaneGeometry(r * 2, r * 2); g.rotateX(-PI / 2); g.translate(x, SLABY + 0.006, z); list.push(g.toNonIndexed()); };
    add(0, ZBUD, 3.4 * FS); add(-SX, SZ, 3.4 * 0.62); add(SX, SZ, 3.4 * 0.62); add(-5.5, -81.8, 0.75); add(5.5, -81.8, 0.75); add(0, -81.45, 0.8);
    const m = addMesh(mergeUV(list), blobMat, 'bong-gia', false, false); m.receiveShadow = false;
  });
  safe('tượng cũ', () => {
    const s = W.statue; if (s) { s.visible = false; if (s.parent) s.parent.remove(s); } // pho cách điệu của 05-world: không dùng nữa
    if (W.statueFocus) W.statueFocus.set(0, SLABY + 3.58 * FS + DY, ZBUD + 0.4 * FS + DZ);                              // ngực pho giữa (THẾ GIỚI)
    // số đo cho máy quay chính điện (THẾ GIỚI): phiến đá, mặt bàn, đầu, ngực, đỉnh vòm, nửa rộng
    W.banTho = { slabTop: SLABY + DY, tableFront: ZT1 + DZ, headY: YHEAD + DY, chestY: SLABY + 3.58 * FS + DY, archTop: ARCHY + 0.38 + DY, halfWidth: SLW, archHalfWidth: ARCHHW, panelTop: PANTOP + DY, plaqueY: 12.395 + DY, centerZ: ZBUD + DZ, headZ: ZHEAD + DZ };
  });
  const SPOT_I = 38; // cường độ đèn rọi ban ngày (một hằng cho cả lúc tạo lẫn bộ cập nhật ngày đêm)
  let spot = null, motes = null, moteMat = null, moteVel = null, lowFx = false; // lowFx: máy yếu đã tắt hạt bụi — giữ tắt dù setVis của điện bật lại khi vào/ra vùng 52 m
  safe('đèn rọi', () => {
    // hai đèn (toạ độ THẾ GIỚI, thẳng vào scene): đèn rọi ấm từ trên-trước chiếu vào pho giữa (ĐỔ BÓNG, bản đồ bóng tĩnh dựng một lần) + đèn điểm nhỏ cạnh bàn thờ
    spot = new THREE.SpotLight(0xfffaf0, SPOT_I, 22, 0.62, 0.65, 1); // tầm 22 m: tới tượng (≈ 13 m) nhưng không xuyên tường sau ra vườn phía sau
    spot.position.set(0, 11.4 + DY, -75.5 + DZ); spot.target.position.set(0, 7.0 + DY, ZBUD + DZ);
    spot.castShadow = true; // đặt TRƯỚC renderer.compile (G.start): chương trình shader đã có sẵn nhánh bóng đèn rọi
    spot.shadow.mapSize.set(G.isTouch ? 1024 : 2048, G.isTouch ? 1024 : 2048);
    spot.shadow.camera.near = 8; /* far: three tự lấy theo distance (22) */ spot.shadow.bias = -0.0005; spot.shadow.normalBias = 0.025; spot.shadow.radius = 2;
    spot.shadow.autoUpdate = false; spot.shadow.needsUpdate = true; // tĩnh: chỉ dựng lại khi điện hiện ra lần đầu (xem bộ cập nhật) / khi mất ngữ cảnh
    G.scene.add(spot); G.scene.add(spot.target); spotRef.l = spot;
    // (v6) bỏ PointLight phụ 5 ở mép bàn: mỗi đèn thêm làm mọi shader có ánh sáng của cả trò chơi đắt hơn; đèn rọi 38 + bloom đủ sáng, bàn trước tối hơn đúng ý tham chiếu
  });
  safe('bụi sáng', () => {
    const n = LOW ? 45 : 90, pos = new Float32Array(n * 3), rnd = U.rng(91); moteVel = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { pos[i * 3] = (rnd() - 0.5) * 12; pos[i * 3 + 1] = 3 + rnd() * 8.5; pos[i * 3 + 2] = -89 + rnd() * 8.5; moteVel[i * 2] = 0.08 + rnd() * 0.12; moteVel[i * 2 + 1] = rnd() * TAU; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const tex = U.canvasTex(64, 64, (c) => { const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(0.35, 'rgba(255,220,150,0.6)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); });
    moteMat = new THREE.PointsMaterial({ size: 0.1, map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffd48a, opacity: 0.55, fog: false });
    motes = new THREE.Points(g, moteMat); motes.frustumCulled = false; motes.matrixAutoUpdate = false; motes.updateMatrix(); motes.name = 'chinhDien:bui-sang';
    hallGrp.add(motes); meshIn.push(motes);
  });
  safe('máy yếu', () => {
    // 00-core bật quality:low giữa chừng (khung hình chậm kéo dài): tắt bụi sáng ngay; ghi nhớ vào save để lần mở sau dựng tượng một nửa số đoạn (LOW đầu file)
    G.events.on('quality:low', () => { lowFx = true; if (motes) motes.visible = false; try { G.save.data.lowQ = Date.now(); G.save.persist(); } catch (e) {} }); // lowQ là mốc thời gian: hết hạn sau 7 ngày (xem LOW)
  });
  safe('ngày đêm', () => {
    // đêm: vàng kim loại không có khuếch tán → tăng nhẹ phản chiếu + tự phát sáng để vàng không "chết"; sứ / sơn bóng sáng nhẹ hơn
    const eDay = new THREE.Color(envTex ? 0x000000 : 0x3a2608), eNight = new THREE.Color(envTex ? 0x2c1c08 : 0x4a3012);
    const wDay = new THREE.Color(0x000000), wNight = new THREE.Color(0x0c0906), xDay = new THREE.Color(0x000000), xNight = new THREE.Color(0x1a0c06);
    const shownLast = { v: false }, redo = { n: 3 }; // dựng lại bóng đèn rọi mỗi khi điện hiện ra (meshIn bị ẩn khi máy quay ở xa: bản đồ bóng lần đầu rỗng)
    G.onUpdate((dt, t) => {
      const n = G.tod.night;
      matGold.emissive.copy(eDay).lerp(eNight, n); matHair.emissive.copy(eDay).lerp(eNight, n); matFace.emissive.copy(eDay).lerp(eNight, n);
      matGold.envMapIntensity = GI * (1 + 0.25 * n); matHair.envMapIntensity = HI * (1 + 0.25 * n); matFace.envMapIntensity = FI * (1 + 0.25 * n);
      whiteMat.emissive.copy(wDay).lerp(wNight, n); matGloss.emissive.copy(xDay).lerp(xNight, n); matMatte.emissive.copy(xDay).lerp(xNight, n);
      if (ornMat) ornMat.emissiveIntensity = 0.3 + 0.2 * n;
      if (haloMat) haloMat.opacity = 0.6 + 0.15 * n;
      if (spot) spot.intensity = SPOT_I * (1 + 0.35 * n);
      const shown = statueMeshes.length ? statueMeshes[0].visible : true;
      if (shown && !shownLast.v) redo.n = 3;
      shownLast.v = shown;
      if (spot && shown && redo.n > 0) { redo.n--; spot.shadow.needsUpdate = true; G.renderer.shadowMap.needsUpdate = true; }
      if (blobMat) { const Pp = G.post, f = Pp && Pp.enabled && Pp.active && Pp.level === 2 ? U.clamp((Pp.mix - 0.3) / 0.6, 0, 1) : 0; blobMat.opacity = 0.35 * (1 - f); blobMat.visible = f < 0.98; } // có GTAO (mức 2) thì bóng giả mờ dần theo mix, không tắt phụt
      if (lowFx && motes) motes.visible = false;
      if (motes && motes.visible) {
        const P = motes.geometry.attributes.position, a = P.array, m = Math.min(dt, 0.1);
        for (let i = 0; i < P.count; i++) { a[i * 3 + 1] += moteVel[i * 2] * m; a[i * 3] += Math.sin(t * 0.6 + moteVel[i * 2 + 1]) * 0.05 * m; if (a[i * 3 + 1] > 11.6) a[i * 3 + 1] = 3; }
        P.needsUpdate = true; moteMat.opacity = 0.45 + 0.3 * n;
      }
    }, 91);
  });
}
