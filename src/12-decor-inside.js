// =====================================================================
//  TRANG TRÍ TRONG SÂN CHÙA — dây cờ ngũ sắc Phật giáo, hòn non bộ, tượng Bồ Tát Di Lặc,
//  chậu mai – quất ngày Tết, bồn hoa, ghế đá, cây hoa sứ / bồ đề, đèn đá, đèn lồng dưới mái hiên.
//  Mọi thứ đặt qua canPlace (tránh nút dẫn đường, điểm đứng, lối đi, vật cản) rồi gộp vào 5 mesh.
// =====================================================================
function buildDecorInside(G) {
  const { THREE, util: U, scene } = G;
  const W = G.world, col = G.collide, GB = G.build;
  if (!W || !GB || !G.nav || !G.spots) return;
  const { C, BOX, box, boxMM, cyl, lathe, branch, glow } = GB;
  const PI = Math.PI;
  const hy = (x, z) => G.heightAt(x, z);
  const safe = (name, fn) => { try { fn(); } catch (e) { console.error('[trang trí sân]', name, e); } };

  // ---------- Hình gốc dùng chung + bộ gom ----------
  const ICO = new THREE.IcosahedronGeometry(1, 0), OCT = new THREE.OctahedronGeometry(1, 0), DOD = new THREE.DodecahedronGeometry(1, 0);
  const SPH = new THREE.SphereGeometry(1, 8, 6), SPHS = new THREE.SphereGeometry(1, 5, 4), SPHH = new THREE.SphereGeometry(1, 10, 7);
  const CONE4 = new THREE.ConeGeometry(0.5, 1, 4), CONE6 = new THREE.ConeGeometry(0.5, 1, 6);
  const ARC = new THREE.TorusGeometry(1, 0.2, 4, 8, PI); // nửa vòng ∩ (xoay π thành nụ cười ∪)
  const TET = new THREE.TetrahedronGeometry(1, 0), CIRC8 = new THREE.CircleGeometry(1, 8).rotateX(-PI / 2);
  const S = U.batch(), F = U.batch(), GD = U.batch(), LB = U.batch();
  const put = (B, g, color, x, y, z, sx, sy = sx, sz = sx, o) => B.add(g, color, Object.assign({ p: [x, y, z], s: [sx, sy, sz] }, o));
  const _mp = new THREE.Matrix4();
  // dựng một cụm theo toạ độ cục bộ rồi đặt tại (x,y,z), xoay yaw quanh trục đứng
  const grp = (B, x, y, z, yaw, fn) => {
    const T = U.batch(); fn(T);
    if (!T.list.length) return;
    const g = U.merge(T.list); g.applyMatrix4(_mp.makeRotationY(yaw).setPosition(x, y, z)); B.addGeo(g);
  };
  const rot = (yaw, dx, dz) => { const c = Math.round(Math.cos(yaw)), s = Math.round(Math.sin(yaw)); return [dx * c + dz * s, -dx * s + dz * c]; };
  const rnd0 = U.rng(20251);
  // cành mảnh hở hai đầu (nhẹ hơn G.build.branch)
  const twig = (B, a, b, ra, rb, color, sg = 4) => { const g = new THREE.CylinderGeometry(ra, rb, 1, sg, 1, true); g.rotateX(PI / 2); const s = U.segMatrix(a[0], a[1], a[2], b[0], b[1], b[2]); B.add(g, color, { s: [1, 1, s.len], m: s.m }); };

  // =====================================================================
  //  BỘ KIỂM TRA CHỖ ĐẶT (canPlace): không đè nút dẫn đường, điểm đứng / POI, lối đi, vật cản.
  //  Cạnh đồ thị: cho phép chắn một cạnh chỉ khi vẫn còn đường vòng ≤ 1,2 lần (kiểm tra bằng đồ thị còn lại),
  //  và mỗi điểm đứng vẫn nhìn thấy đủ nút dẫn đường — nhờ vậy sân đi lại thông suốt mà không phải bỏ trống cả sân.
  // =====================================================================
  G.nav.build();
  const NODES = G.nav.nodes, NN = NODES.length;
  const SP = [];
  const addPt = (p) => { if (p && Number.isFinite(p.x) && Number.isFinite(p.z)) SP.push(p.x, p.z); };
  for (const v of Object.values(G.spots)) { if (Array.isArray(v)) v.forEach(addPt); else addPt(v); }
  for (const v of Object.values(W)) if (v && typeof v === 'object') { addPt(v.poi); addPt(v.stand); addPt(v.release); }
  if (W.ext) for (const v of Object.values(W.ext)) if (v && typeof v === 'object') { addPt(v.poi); addPt(v.stand); }
  const E = [], adj = new Float32Array(NN * NN), cutAll = [];
  for (let i = 0; i < NN; i++) for (const e of NODES[i].n) if (e.i > i) {
    const a = NODES[i], b = NODES[e.i];
    E.push({ a: i, b: e.i, ax: a.x, az: a.z, dx: b.x - a.x, dz: b.z - a.z, l2: (b.x - a.x) ** 2 + (b.z - a.z) ** 2, len: e.d,
      x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), z0: Math.min(a.z, b.z), z1: Math.max(a.z, b.z), alive: true, via: -1 });
    adj[i * NN + e.i] = adj[e.i * NN + i] = e.d;
  }
  // Mỗi điểm đứng / POI nhìn thấy vài nút dẫn đường (G.nav.nearest dựa vào đó): giữ lại ít nhất min(2, hiện có) nút cho từng điểm
  const SPN = SP.length / 2, SE = [], spCnt = new Int16Array(SPN), spNeed = new Int16Array(SPN), spTmp = new Int16Array(SPN);
  {
    const ord = [];
    for (let s = 0; s < SPN; s++) {
      const x = SP[s * 2], z = SP[s * 2 + 1];
      ord.length = 0; for (let i = 0; i < NN; i++) ord.push(i);
      ord.sort((a, b) => (NODES[a].x - x) ** 2 + (NODES[a].z - z) ** 2 - ((NODES[b].x - x) ** 2 + (NODES[b].z - z) ** 2));
      for (let k = 0; k < 14 && k < NN; k++) {
        const n = NODES[ord[k]];
        if (G.nav.los(x, z, n.x, n.z, 0.3)) { SE.push({ ax: x, az: z, dx: n.x - x, dz: n.z - z, l2: (n.x - x) ** 2 + (n.z - z) ** 2, x0: Math.min(x, n.x), x1: Math.max(x, n.x), z0: Math.min(z, n.z), z1: Math.max(z, n.z), sp: s, alive: true }); spCnt[s]++; }
      }
      spNeed[s] = Math.min(2, spCnt[s]);
    }
  }
  const segDist = (px, pz, e) => { const t = e.l2 > 0 ? U.clamp(((px - e.ax) * e.dx + (pz - e.az) * e.dz) / e.l2, 0, 1) : 0; return Math.hypot(px - e.ax - e.dx * t, pz - e.az - e.dz * t); };
  const inR = (x, z, r, x0, x1, z0, z1) => x > x0 - r && x < x1 + r && z > z0 - r && z < z1 + r;
  const BN = G.L2 && G.L2.baoNghiem;
  // vùng cấm: lối giữa, nền chính điện, cổng, cầu, bậc, hành lang, vòng nhiễu tháp
  function banned(x, z, r) {
    if (inR(x, z, r, -2.6, 2.6, -13.4, 31)) return true;     // lối giữa sân trước, đến đầu cầu
    if (inR(x, z, r, -2.6, 2.6, -62, -13.4)) return true;    // lối giữa phía sau: cầu → bậc → tầng nền → trước Tích Thiện Am
    if (inR(x, z, r, -2.6, 2.6, -65.5, -57)) return true;    // lối giữa sân chính điện (sau Tích Thiện Am)
    if (inR(x, z, r, -20.4, 20.4, -117.8, -73.8)) return true;  // toàn bộ nền ba tầng đá trắng + bậc thềm + chính điện (18-chinh-dien.js): x ±20,4, z −117,8…−73,8 (v4; v3: −99,8…−65,8)
    if (inR(x, z, r, -20.2, 20.2, -73.8, -62.3)) return true;  // sân chính điện trước chân tầng 1 (y 1,2, z −62,3…−73,8; v4 sâu 12 m): sư tử đồng, chỗ đứng chắp tay, nút đường — để trống, không bồn hoa / chậu / ghế
    if (inR(x, z, r, -8.5, 8.5, 28.6, 40)) return true;
    if (inR(x, z, r, -4.4, 4.4, -25.4, -22.6)) return true;  // bậc trước tầng nền
    if (inR(x, z, r, -13.3, -10.7, -43.3, -36.7)) return true; // bậc tây
    if (inR(x, z, r, 15.0, 19.0, -62.4, -59.2) || inR(x, z, r, -19.0, -15.0, -62.4, -59.2)) return true; // hai bậc góc lên tầng nền chính điện
    if (Math.abs(x) > 20.3 - r && z < -11) return true;      // hành lang
    if (BN && Math.hypot(x - BN.x, z - BN.z) < (BN.banR || 4.4) + r) return true;
    for (const b of G.decorBans || []) if (inR(x, z, r, b[0], b[1], b[2], b[3])) return true; // vùng chừa do toà khác đăng ký [x0, x1, z0, z1] (17-dien-phu.js)
    return x < -23.0 + r || x > 23.0 - r || z > 30.0 - r || z < -117.0 + r; // (v4: tường bao sau ở z −118, mặt trong −117,7)
  }
  const reserved = []; // chỗ chừa cho người đứng xem [x, z, r]
  const resv = (x, z, r) => { for (const q of reserved) if (Math.hypot(x - q[0], z - q[1]) < r + q[2]) return true; return false; };
  const okFree = (x, z, r) => !banned(x, z, r) && !col.hit(x, z, r) && !resv(x, z, r);
  // canPlace: vật rắn bán kính r tại (x,z) — không đè nút dẫn đường (r+0,6), điểm đứng/POI (r+1,0), lối đi, vật cản có sẵn
  function canPlace(x, z, r) {
    if (banned(x, z, r) || col.hit(x, z, r + 0.45) || resv(x, z, r)) return false;
    for (let i = 0; i < NN; i++) { const n = NODES[i], d = r + 0.6, dx = n.x - x, dz = n.z - z; if (dx * dx + dz * dz < d * d) return false; }
    for (let i = 0; i < SP.length; i += 2) { const d = r + 1.0, dx = SP[i] - x, dz = SP[i + 1] - z; if (dx * dx + dz * dz < d * d) return false; }
    return true;
  }
  // chân đế = danh sách [dx, dz, r, free?]; free = chỗ chừa trống (không có vật cản)
  const fit = (x, z, foot) => { for (const f of foot) { if (f[3] ? !okFree(x + f[0], z + f[1], f[2]) : !canPlace(x + f[0], z + f[1], f[2])) return false; } return true; };
  const cutBuf = [], supBuf = [];
  function edgeCuts(x, z, foot) {
    cutBuf.length = 0; supBuf.length = 0;
    for (let k = 0; k < SE.length; k++) {
      const e = SE[k]; if (!e.alive) continue;
      for (const f of foot) {
        if (f[3]) continue;
        const px = x + f[0], pz = z + f[1], m = f[2] + 0.3;
        if (px < e.x0 - m || px > e.x1 + m || pz < e.z0 - m || pz > e.z1 + m) continue;
        if (segDist(px, pz, e) < m) { supBuf.push(k); break; }
      }
    }
    for (let k = 0; k < E.length; k++) {
      const e = E[k]; if (!e.alive) continue;
      for (const f of foot) {
        if (f[3]) continue;
        const px = x + f[0], pz = z + f[1], m = f[2] + 0.45;
        if (px < e.x0 - m || px > e.x1 + m || pz < e.z0 - m || pz > e.z1 + m) continue;
        if (segDist(px, pz, e) < m) { cutBuf.push(k); break; }
      }
    }
    return cutBuf;
  }
  function supportsOK() { // sau khi chắn các đoạn trong supBuf, mỗi điểm đứng còn đủ nút nhìn thấy?
    for (const k of supBuf) spTmp[SE[k].sp]++;
    let ok = true;
    for (const k of supBuf) { const s = SE[k].sp; if (spTmp[s] && spCnt[s] - spTmp[s] < spNeed[s]) ok = false; }
    for (const k of supBuf) spTmp[SE[k].sp] = 0;
    return ok;
  }
  function detour(e) {
    const lim = e.len * 1.2 + 0.4;
    for (let m = 0; m < NN; m++) { const d1 = adj[e.a * NN + m]; if (d1 > 0) { const d2 = adj[m * NN + e.b]; if (d2 > 0 && d1 + d2 <= lim) { e.via = m; return true; } } }
    e.via = -1; return false;
  }
  const savedVia = [];
  function tryCut(list) {
    if (!list.length) return true;
    savedVia.length = 0;
    for (const k of list) { const e = E[k]; e.alive = false; adj[e.a * NN + e.b] = adj[e.b * NN + e.a] = 0; }
    let ok = true;
    for (const k of list) if (!detour(E[k])) { ok = false; break; }
    if (ok) for (const o of cutAll) {
      if (adj[o.a * NN + o.via] > 0 && adj[o.via * NN + o.b] > 0) continue;
      savedVia.push(o, o.via);
      if (!detour(o)) { ok = false; break; }
    }
    if (!ok) {
      for (const k of list) { const e = E[k]; e.alive = true; adj[e.a * NN + e.b] = adj[e.b * NN + e.a] = e.len; }
      for (let i = 0; i < savedVia.length; i += 2) savedVia[i].via = savedVia[i + 1];
      return false;
    }
    for (const k of list) cutAll.push(E[k]);
    return true;
  }
  const OFFS = {};
  function offs(rad, step) {
    const key = rad + '/' + step; if (OFFS[key]) return OFFS[key];
    const a = [[0, 0]];
    for (let dx = -rad; dx <= rad + 1e-6; dx += step) for (let dz = -rad; dz <= rad + 1e-6; dz += step) if ((dx || dz) && Math.hypot(dx, dz) <= rad + 1e-6) a.push([dx, dz]);
    a.sort((p, q) => Math.hypot(p[0], p[1]) - Math.hypot(q[0], q[1]));
    return (OFFS[key] = a);
  }
  // tìm chỗ đặt gần (x,z) nhất; axis 'x' / 'z' = chỉ trượt dọc theo hàng
  function find(x, z, foot, rad = 2, step = 0.4, axis) {
    let lst;
    if (axis) { lst = [[0, 0]]; for (let d = step; d <= rad + 1e-6; d += step) lst.push(axis === 'x' ? [d, 0] : [0, d], axis === 'x' ? [-d, 0] : [0, -d]); } else lst = offs(rad, step);
    for (const o of lst) {
      const X = x + o[0], Z = z + o[1];
      if (!fit(X, Z, foot)) continue;
      const cuts = edgeCuts(X, Z, foot);
      if (!supportsOK() || !tryCut(cuts)) continue;
      for (const k of supBuf) { SE[k].alive = false; spCnt[SE[k].sp]--; }
      for (const f of foot) if (f[3]) reserved.push([X + f[0], Z + f[1], f[2]]);
      return { x: X, z: Z };
    }
    return null;
  }
  const items = []; // [x, z, r] các hạng mục đã đặt (tính khoảng trống)
  const mark = (x, z, r) => items.push([x, z, r]);
  const pot1 = [[0, 0, 0.5]]; // chân đế một chậu
  const myCols = []; // vật cản do file này tạo
  const circ = (x, z, r, tag) => { const c = col.circle(x, z, r, tag); myCols.push(c); return c; };
  const bbox = (x0, z0, x1, z1, tag) => { const c = col.box(x0, z0, x1, z1, tag); myCols.push(c); return c; };

  // =====================================================================
  //  CHẬU MAI VÀNG & CÂY QUẤT (Tết)
  // =====================================================================
  const POT_G = lathe([[0.25, 0], [0.33, 0.08], [0.43, 0.36], [0.45, 0.5], [0.39, 0.6], [0.43, 0.64], [0.4, 0.67]], 8);
  const BAND_G = new THREE.CylinderGeometry(0.465, 0.465, 0.08, 8, 1, true);
  const GLAZE = [0x2f5f9e, 0xb8392c, 0xc9902e, 0x3d7a6c];
  const MAIC = [0xffd23a, 0xffc61a, 0xffe066, 0xf5b800], LEAFG = [0x4c7a35, 0x5d8c3d, 0x3f6b30, 0x6f9a45];
  function potBase(x, y0, z, r) {
    put(S, POT_G, GLAZE[(r() * GLAZE.length) | 0], x, y0, z, 1, 1, 1, { j: 0.04, r: [0, r() * 6, 0] });
    put(S, BAND_G, 0xf0e2c0, x, y0 + 0.45, z, 1, 1, 1);
    put(S, CIRC8, 0x4a3524, x, y0 + 0.67, z, 0.38, 1, 0.38);
  }
  function mai(x, z, seed) {
    const r = U.rng(seed), y0 = hy(x, z), bark = 0x5c4636;
    potBase(x, y0, z, r);
    const t = [[0, 0.66, 0]]; let cx = 0, cz = 0;
    for (let i = 1; i <= 3; i++) { cx += (r() - 0.5) * 0.3; cz += (r() - 0.5) * 0.3; t.push([cx, 0.66 + i * 0.5, cz]); }
    for (let i = 0; i < 3; i++) branch(S, [x + t[i][0], y0 + t[i][1], z + t[i][2]], [x + t[i + 1][0], y0 + t[i + 1][1], z + t[i + 1][2]], 0.075 - i * 0.02, 0.06 - i * 0.017, bark, 5);
    const tips = [[x + t[3][0], y0 + t[3][1] + 0.1, z + t[3][2]]];
    for (let i = 0; i < 6; i++) {
      const b = t[1 + (i % 3)], a = r() * 6.28 + i, len = 0.5 + r() * 0.45;
      const sx = x + b[0], sy = y0 + b[1], sz = z + b[2], ex = sx + Math.cos(a) * len, ey = sy + (0.15 + r() * 0.5) * len + 0.15, ez = sz + Math.sin(a) * len;
      twig(S, [sx, sy, sz], [ex, ey, ez], 0.026, 0.012, bark, 4);
      tips.push([ex, ey, ez], [(sx + ex) / 2, (sy + ey) / 2 + 0.05, (sz + ez) / 2]);
    }
    for (const p of tips) for (let k = 0; k < 5; k++) {
      const s = 0.1 + r() * 0.06;
      put(S, TET, MAIC[(r() * 4) | 0], p[0] + (r() - 0.5) * 0.36, p[1] + (r() - 0.3) * 0.28, p[2] + (r() - 0.5) * 0.36, s, s * 0.85, s, { r: [r() * 3, r() * 3, r() * 3] });
    }
    for (let k = 0; k < 5; k++) put(S, TET, LEAFG[3], x + (r() - 0.5) * 1.1, y0 + 1.1 + r() * 1.1, z + (r() - 0.5) * 1.1, 0.08, 0.08, 0.08);
    if (seed % 2 === 0) for (let k = 0; k < 2; k++) { // bao lì xì đỏ treo cành
      const p = tips[1 + k * 2], hx = p[0], hz = p[2] + 0.05;
      box(S, hx, p[1] - 0.2, hz, 0.012, 0.22, 0.012, 0xd8c09a); box(S, hx, p[1] - 0.38, hz, 0.1, 0.15, 0.015, 0xd8322a); box(S, hx, p[1] - 0.33, hz, 0.1, 0.03, 0.018, C.gold);
    }
    circ(x, z, 0.5, 'pot');
    W.petalSources.length < 40 && seed % 3 === 0 && W.petalSources.push({ x, y: y0 + 2.0, z, r: 1.4, kind: 'flower' });
  }
  function quat(x, z, seed) {
    const r = U.rng(seed), y0 = hy(x, z);
    potBase(x, y0, z, r);
    branch(S, [x, y0 + 0.66, z], [x + 0.03, y0 + 1.05, z], 0.06, 0.045, 0x5c4636, 5);
    const bl = [[0, 1.4, 0, 0.52], [0.3, 1.18, 0.12, 0.37], [-0.28, 1.22, -0.1, 0.39], [0.04, 1.72, 0.02, 0.35], [-0.1, 1.38, 0.3, 0.33]];
    bl.forEach((b, i) => put(S, ICO, LEAFG[i % 3], x + b[0], y0 + b[1], z + b[2], b[3], b[3] * 0.85, b[3], { j: 0.1 }));
    for (let k = 0; k < 22; k++) {
      const b = bl[(r() * bl.length) | 0], a = r() * 6.28, e = r() * 1.7 - 0.45, cy = Math.cos(e), d = b[3] * 0.95;
      const s = 0.055 + r() * 0.025;
      put(S, OCT, r() < 0.8 ? 0xf08a1c : 0xff9f2a, x + b[0] + Math.cos(a) * cy * d, y0 + b[1] + Math.sin(e) * d * 0.85, z + b[2] + Math.sin(a) * cy * d, s, s, s);
    }
    if (seed % 3 === 0) { box(S, x + 0.35, y0 + 1.0, z + 0.3, 0.012, 0.3, 0.012, 0xd8322a); box(S, x + 0.35, y0 + 0.82, z + 0.3, 0.08, 0.12, 0.012, 0xd8322a); }
    circ(x, z, 0.5, 'pot');
  }
  // hàng chậu mai – quất dọc tường (trượt dọc theo hàng để tránh vật cản)
  let potSeed = 100;
  function rowPots(x0, z0, x1, z1, gap, kind0, slide) {
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.floor(L / gap) + 1, axis = Math.abs(x1 - x0) > Math.abs(z1 - z0) ? 'x' : 'z';
    let placed = 0;
    for (let i = 0; i < n; i++) {
      const t = n > 1 ? i / (n - 1) : 0, p = find(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, pot1, slide, 0.25, axis);
      if (!p) continue;
      ((i + kind0) % 2 ? quat : mai)(p.x, p.z, potSeed++); mark(p.x, p.z, 0.6); placed++;
    }
    return placed;
  }

  // =====================================================================
  //  BỒN HOA (viền đá thấp, cúc vạn thọ vàng cam, hoa hồng đỏ, hoa hồng phấn, cúc trắng)
  // =====================================================================
  const PALS = [[0xf5a623, 0xffc20e, 0xe8870e, 0xffd23a], [0xd8322a, 0xe8553f, 0xb8261f, 0xf06a4a], [0xf29bb5, 0xf7b8cc, 0xe27a9c, 0xfbe4ea], [0xfff1d6, 0xf5d03a, 0xfbe4ea, 0xffe7a8]];
  let bedSeed = 300;
  function bed(x, z, w, d, pal, round) {
    const r = U.rng(bedSeed++), y0 = hy(x, z);
    if (round) {
      cyl(F, x, y0 + 0.13, z, d / 2, d / 2 + 0.05, 0.26, C.stoneL, 10);
      cyl(F, x, y0 + 0.265, z, d / 2 - 0.12, d / 2 - 0.12, 0.03, 0x3f6b30, 10);
    } else {
      const t = 0.14, hh = 0.26;
      box(F, x, y0 + hh / 2, z - d / 2 + t / 2, w, hh, t, C.stoneL); box(F, x, y0 + hh / 2, z + d / 2 - t / 2, w, hh, t, C.stoneL);
      box(F, x - w / 2 + t / 2, y0 + hh / 2, z, t, hh, d - 2 * t, C.stone); box(F, x + w / 2 - t / 2, y0 + hh / 2, z, t, hh, d - 2 * t, C.stone);
      box(F, x, y0 + 0.2, z, w - 2 * t, 0.12, d - 2 * t, 0x3f6b30);
    }
    const n = Math.round((round ? 0.75 : 1) * w * d * 10);
    for (let i = 0; i < n; i++) {
      let px, pz;
      if (round) { const a = r() * 6.28, rr = Math.sqrt(r()) * (d / 2 - 0.2); px = x + Math.cos(a) * rr; pz = z + Math.sin(a) * rr; }
      else { px = x + (r() - 0.5) * (w - 0.4); pz = z + (r() - 0.5) * (d - 0.4); }
      const s = 0.07 + r() * 0.035;
      put(F, OCT, pal[(r() * pal.length) | 0], px, y0 + 0.32 + r() * 0.1, pz, s, s * 0.8, s, { r: [r(), r() * 3, 0] });
    }
    for (let i = 0; i < 3; i++) put(F, ICO, LEAFG[(r() * 3) | 0], x + (r() - 0.5) * (w - 0.6), y0 + 0.27, z + (r() - 0.5) * (d - 0.6), 0.32, 0.14, 0.28, { j: 0.1 });
    if (round) circ(x, z, d / 2 + 0.1, 'bed'); else bbox(x - w / 2 - 0.05, z - d / 2 - 0.05, x + w / 2 + 0.05, z + d / 2 + 0.05, 'bed');
  }
  const footBed = (w, d) => { // vài hình tròn phủ kín hộp w×d (kể cả góc) để kiểm tra cạnh dẫn đường không sót
    const L = Math.max(w, d), Sd = Math.min(w, d), k = Math.max(1, Math.min(4, Math.round((L / Sd) * 1.5))), seg = L / k, r = Math.hypot(seg / 2, Sd / 2) + 0.12, out = [];
    for (let i = 0; i < k; i++) { const o = -L / 2 + seg * (i + 0.5); out.push(w >= d ? [o, 0, r] : [0, o, r]); }
    return out;
  };
  let palI = 0;
  function placeBed(x, z, w, d, rad, round, pal) {
    const ft = round ? [[0, 0, d / 2 + 0.15]] : footBed(w, d), p = find(x, z, ft, rad, 0.4);
    if (!p) return null;
    bed(p.x, p.z, w, d, pal || PALS[palI++ % PALS.length], round); mark(p.x, p.z, Math.max(w, d) / 2 + 0.1);
    return p;
  }

  // =====================================================================
  //  GHẾ ĐÁ, ĐÈN ĐÁ, CÂY HOA SỨ, CÂY BỒ ĐỀ NHỎ
  // =====================================================================
  const newBench = [];
  function bench(x, z, yaw) { // yaw = hướng mặt ngồi quay về (bội π/2)
    const y0 = hy(x, z);
    grp(S, x, y0, z, yaw, (T) => { box(T, 0, 0.42, 0, 1.8, 0.14, 0.55, C.stoneL); for (const s of [-0.65, 0.65]) box(T, s, 0.2, 0, 0.2, 0.4, 0.45, C.stoneD); });
    for (const s of [-0.75, 0.75]) { const d = rot(yaw, s, 0); circ(x + d[0], z + d[1], 0.22, 'bench'); }
    newBench.push({ x: x + Math.sin(yaw) * 0.05, z: z + Math.cos(yaw) * 0.05, yaw, y: y0 + 0.42 });
  }
  const footBench = (yaw) => { const a = rot(yaw, -0.75, 0), b = rot(yaw, 0.75, 0), c = rot(yaw, 0, 0.85); return [[a[0], a[1], 0.4], [b[0], b[1], 0.4], [0, 0, 0.45], [c[0], c[1], 0.35, 1]]; };
  function placeBench(x, z, yaw, rad) { const p = find(x, z, footBench(yaw), rad || 2.5, 0.4); if (!p) return null; bench(p.x, p.z, yaw); mark(p.x, p.z, 1.0); return p; }
  function stoneLamp(x, z) {
    const y0 = hy(x, z);
    box(S, x, y0 + 0.15, z, 0.62, 0.3, 0.62, C.stoneD); box(S, x, y0 + 0.75, z, 0.28, 0.9, 0.28, C.stone);
    box(S, x, y0 + 1.32, z, 0.56, 0.12, 0.56, C.stone); LB.add(BOX, 0xffd98a, { p: [x, y0 + 1.6, z], s: [0.36, 0.4, 0.36] });
    put(S, CONE4, C.stoneD, x, y0 + 2.0, z, 1.0, 0.36, 1.0, { r: [0, PI / 4, 0] });
    glow(x, y0 + 1.6, z, 1.4, [1.0, 0.75, 0.38], true);
    circ(x, z, 0.42, 'stonelamp');
  }
  function placeLamp(x, z, rad) { const p = find(x, z, [[0, 0, 0.42]], rad || 1.5, 0.3); if (!p) return null; stoneLamp(p.x, p.z); mark(p.x, p.z, 0.6); return p; }
  function frangipani(x, z, seed, ring) {
    const r = U.rng(seed), y0 = hy(x, z), trunk = 0x8a7a68;
    if (ring) { cyl(F, x, y0 + 0.17, z, 0.85, 0.92, 0.34, C.stone, 10); cyl(F, x, y0 + 0.35, z, 0.72, 0.72, 0.03, 0x5a4030, 10); }
    branch(S, [x, y0, z], [x + 0.1, y0 + 1.3, z], 0.2, 0.15, trunk, 7);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * PI * 2 + r(), d = 1.0 + r() * 0.5, top = [x + Math.cos(a) * d, y0 + 2.2 + r() * 0.5, z + Math.sin(a) * d];
      branch(S, [x + 0.1, y0 + 1.25, z], top, 0.12, 0.07, trunk, 6);
      put(S, ICO, 0x3f6a32, top[0], top[1] + 0.25, top[2], 0.7 + r() * 0.25, 0.5, 0.7 + r() * 0.25, { j: 0.12 });
      for (let k = 0; k < 7; k++) put(S, OCT, k % 2 ? 0xfff4dc : 0xffe7a8, top[0] + (r() - 0.5) * 1.0, top[1] + 0.5 + r() * 0.2, top[2] + (r() - 0.5) * 1.0, 0.075, 0.075, 0.075);
    }
    circ(x, z, ring ? 0.95 : 0.4, 'tree');
    W.petalSources.push({ x, y: y0 + 2.8, z, r: 1.7, kind: 'flower' });
  }
  function bodhi(x, z, seed) { // cây bồ đề nhỏ trong bồn đá tròn
    const r = U.rng(seed), y0 = hy(x, z);
    cyl(F, x, y0 + 0.18, z, 0.9, 0.98, 0.36, C.stone, 10); cyl(F, x, y0 + 0.37, z, 0.78, 0.78, 0.03, 0x5a4030, 10);
    branch(S, [x, y0 + 0.3, z], [x + 0.08, y0 + 2.0, z - 0.05], 0.3, 0.2, C.bark, 7);
    for (let i = 0; i < 3; i++) { const a = r() * 6.28; branch(S, [x + 0.08, y0 + 1.7, z], [x + Math.cos(a) * 1.0, y0 + 2.7 + r() * 0.5, z + Math.sin(a) * 1.0], 0.14, 0.07, C.bark, 5); }
    for (let i = 0; i < 8; i++) { const a = i * 2.4, rr = 0.2 + (i / 8) * 1.1; put(S, ICO, C.leaf[i % 4], x + Math.cos(a) * rr, y0 + 3.0 + (i % 3) * 0.35, z + Math.sin(a) * rr, 0.85 + r() * 0.3, 0.7, 0.85 + r() * 0.3, { j: 0.12 }); }
    circ(x, z, 0.98, 'tree');
    W.petalSources.push({ x, y: y0 + 3.4, z, r: 1.6, kind: 'leaf' });
  }

  // =====================================================================
  //  TƯỢNG BỒ TÁT DI LẶC (mạ vàng, ngồi trên toà sen đá) + bàn thờ nhỏ với lư hương
  // =====================================================================
  function diLac(x, z, yaw) { // tượng quay mặt về phía +z cục bộ (yaw xoay cả cụm)
    const y0 = hy(x, z);
    grp(S, x, y0, z, yaw, (T) => { // bệ đá + toà sen
      cyl(T, 0, 0.09, 0, 1.18, 1.26, 0.18, C.stoneD, 8); cyl(T, 0, 0.27, 0, 1.0, 1.1, 0.18, C.stone, 8);
      for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; T.add(CONE4, i % 2 ? 0xf6dfe5 : 0xf2c4cf, { p: [Math.sin(a) * 0.86, 0.5, Math.cos(a) * 0.86], s: [0.36, 0.5, 0.15], r: [0.6, a, 0], order: 'YXZ' }); }
      for (let i = 0; i < 9; i++) { const a = ((i + 0.5) / 9) * PI * 2; T.add(CONE4, 0xfbe9ee, { p: [Math.sin(a) * 0.62, 0.58, Math.cos(a) * 0.62], s: [0.3, 0.46, 0.13], r: [0.28, a, 0], order: 'YXZ' }); }
      cyl(T, 0, 0.66, 0, 0.62, 0.7, 0.1, C.goldD, 10);
      // bàn thờ nhỏ phía trước: lư hương đồng, ba nén hương, hai bình hoa cúc
      boxMM(T, -0.5, 0, 1.3, 0.5, 0.66, 1.85, 0x7a2418); boxMM(T, -0.55, 0.64, 1.25, 0.55, 0.7, 1.9, C.gold);
      T.add(lathe([[0, 0], [0.12, 0.01], [0.17, 0.09], [0.18, 0.16], [0.15, 0.17]], 8), C.bronze, { p: [0, 0.7, 1.58] });
      for (let i = 0; i < 3; i++) box(T, (i - 1) * 0.04, 1.0, 1.58, 0.012, 0.34, 0.012, 0x7a2a1a);
      for (const sx of [-1, 1]) { cyl(T, sx * 0.34, 0.77, 1.58, 0.06, 0.07, 0.14, 0x3a64a0, 6); for (let k = 0; k < 4; k++) put(T, OCT, k % 2 ? 0xf5a623 : 0xffc20e, sx * 0.34 + (k - 1.5) * 0.04, 0.91 + (k % 2) * 0.04, 1.58, 0.06, 0.05, 0.06); }
    });
    const gp = rot(yaw, 0, 1.58); glow(x + gp[0], y0 + 1.1, z + gp[1], 0.2, [1, 0.35, 0.1], false);
    grp(GD, x, y0 + 0.7, z, yaw, (T) => { // thân tượng (đơn vị gốc ~2,4 m, thu 0,64)
      const k = 0.64, g1 = 0xe0b044, g2 = 0xc99a36, g3 = 0xf0cf70, g4 = 0xf7dc8a, dark = 0x5a3412;
      const sp = (g, px, py, pz, rx, ry, rz, c, o) => T.add(g, c, Object.assign({ p: [px * k, py * k, pz * k], s: [rx * k, ry * k, rz * k] }, o));
      sp(SPH, 0, 0.26, 0.16, 1.12, 0.34, 0.8, g2);                      // chân xếp bằng, bè ra
      sp(SPHS, -0.8, 0.36, 0.6, 0.32, 0.26, 0.3, g2); sp(SPHS, 0.8, 0.36, 0.6, 0.32, 0.26, 0.3, g2); // hai đầu gối
      sp(SPH, 0, 1.36, -0.14, 0.78, 0.68, 0.52, g2);                    // áo choàng phía sau
      sp(SPH, 0, 0.98, 0.2, 0.72, 0.66, 0.62, g3);                      // bụng tròn trĩnh
      sp(SPH, 0, 1.56, 0.0, 0.64, 0.46, 0.44, g1);                      // ngực + vai
      sp(SPHH, 0, 2.06, 0.04, 0.47, 0.44, 0.44, g3);                    // đầu
      sp(SPHS, -0.24, 1.94, 0.26, 0.16, 0.12, 0.11, g4); sp(SPHS, 0.24, 1.94, 0.26, 0.16, 0.12, 0.11, g4); // má phính
      sp(SPHS, -0.48, 2.04, -0.02, 0.08, 0.25, 0.1, g1); sp(SPHS, 0.48, 2.04, -0.02, 0.08, 0.25, 0.1, g1); // tai dài
      sp(SPHS, 0, 2.5, 0, 0.11, 0.1, 0.11, g1);                          // búi tóc nhỏ
      sp(SPHS, 0, 2.03, 0.46, 0.055, 0.045, 0.045, g2);                  // mũi
      T.add(ARC, dark, { p: [0, 2.0 * k, 0.45 * k], s: k * 0.17, r: [0, 0, PI] });  // nụ cười rộng
      for (const sx of [-1, 1]) T.add(ARC, dark, { p: [sx * 0.18 * k, 2.14 * k, 0.43 * k], s: k * 0.07 });   // mắt cười
      // hai tay: tay trái ôm bao vải, tay phải cầm tràng hạt đưa lên ngực
      branch(T, [-0.7 * k, 1.64 * k, 0], [-0.92 * k, 1.2 * k, 0.24 * k], 0.18 * k, 0.15 * k, g1, 6); branch(T, [-0.92 * k, 1.2 * k, 0.24 * k], [-0.8 * k, 0.86 * k, 0.6 * k], 0.15 * k, 0.13 * k, g1, 6);
      branch(T, [0.7 * k, 1.64 * k, 0], [0.96 * k, 1.3 * k, 0.24 * k], 0.18 * k, 0.15 * k, g1, 6); branch(T, [0.96 * k, 1.3 * k, 0.24 * k], [0.56 * k, 1.52 * k, 0.72 * k], 0.15 * k, 0.13 * k, g1, 6);
      sp(SPHS, -0.8, 0.84, 0.62, 0.15, 0.15, 0.15, g4); sp(SPHS, 0.54, 1.52, 0.74, 0.15, 0.15, 0.15, g4);
      sp(SPH, -1.12, 0.5, 0.42, 0.5, 0.42, 0.42, 0xb98a2e);             // bao vải đặt cạnh
      sp(SPHS, -1.12, 0.92, 0.42, 0.14, 0.12, 0.14, 0xa87a26);
      T.add(new THREE.TorusGeometry(0.32 * k, 0.03 * k, 4, 10), 0x8a3a1c, { p: [0, 1.5 * k, 0.44 * k], r: [-0.55, 0, 0], s: [1, 1.2, 1] }); // tràng hạt
    });
  }
  const rotFoot = (yaw, list) => list.map((f) => { const d = rot(yaw, f[0], f[1]); return f.length > 3 ? [d[0], d[1], f[2], f[3]] : [d[0], d[1], f[2]]; });
  const footDL = (yaw) => rotFoot(yaw, [[0, 0, 1.3], [0, 1.6, 0.7], [0, 2.6, 0.5, 1], [-1.2, 2.5, 0.5, 1], [1.2, 2.5, 0.5, 1]]);

  // =====================================================================
  //  HÒN NON BỘ: chậu đá có nước, núi đá lởm chởm, cây cảnh nhỏ, tháp nhỏ, cầu nhỏ
  // =====================================================================
  function honNonBo(x, z, yaw) {
    const y0 = hy(x, z), r = U.rng(1357), stones = [0x8f8a80, 0x7d776d, 0xa8a094, 0x9a948a];
    grp(S, x, y0, z, yaw, (T) => {
      box(T, 0, 0.1, 0, 3.7, 0.2, 2.2, C.stoneD);
      boxMM(T, -2.05, 0.2, -1.3, 2.05, 0.56, -1.05, C.stoneL); boxMM(T, -2.05, 0.2, 1.05, 2.05, 0.56, 1.3, C.stoneL);
      boxMM(T, -2.05, 0.2, -1.05, -1.8, 0.56, 1.05, C.stone); boxMM(T, 1.8, 0.2, -1.05, 2.05, 0.56, 1.05, C.stone);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(T, SPHS, C.stoneL, sx * 2.05, 0.66, sz * 1.3, 0.13, 0.15, 0.13);
      const rock = (g, px, py, pz, sx, sy, sz, ci, tilt) => put(T, g, stones[ci % 4], px, py, pz, sx, sy, sz, { r: tilt || [r(), r() * 6, r() * 0.3], j: 0.1 });
      // ba đỉnh núi đá
      rock(DOD, -0.5, 0.75, -0.1, 0.95, 0.5, 0.78, 0); rock(DOD, -0.5, 1.2, -0.08, 0.66, 0.5, 0.56, 1); rock(OCT, -0.5, 1.8, -0.06, 0.4, 0.95, 0.36, 2, [0, 0.5, 0.06]);
      rock(OCT, -0.95, 1.1, -0.2, 0.26, 0.62, 0.24, 3, [0, 1.2, 0.22]); rock(OCT, -0.1, 1.35, 0.3, 0.22, 0.55, 0.2, 1, [0.1, 0.4, -0.18]);
      rock(DOD, 0.95, 0.72, 0.05, 0.72, 0.46, 0.6, 1); rock(OCT, 0.92, 1.38, 0.08, 0.34, 0.72, 0.3, 0, [0, 0.9, -0.1]); rock(OCT, 1.3, 1.0, 0.0, 0.2, 0.46, 0.18, 2, [0.15, 0.2, 0.25]);
      rock(DOD, -1.5, 0.66, 0.3, 0.5, 0.4, 0.46, 3); rock(OCT, -1.5, 1.05, 0.28, 0.24, 0.5, 0.22, 1, [0, 0.3, 0.12]);
      rock(DOD, 0.55, 0.62, 0.55, 0.42, 0.14, 0.36, 2, [0, 0.4, 0]);                       // thềm đặt tháp
      for (const [px, pz, s] of [[1.5, -0.5, 0.2], [-0.9, 0.7, 0.18], [1.55, 0.6, 0.16], [-0.1, -0.7, 0.22]]) rock(DOD, px, 0.52, pz, s, s * 0.7, s, 3); // đá nhỏ giữa nước
      for (const [px, py, pz] of [[-0.8, 0.9, 0.3], [0.7, 1.05, 0.42], [-1.4, 0.95, 0.5], [0.2, 0.7, 0.55], [-0.5, 1.45, 0.25]]) put(T, ICO, 0x5d8c3d, px, py, pz, 0.15, 0.06, 0.13, { j: 0.1 }); // rêu
      box(T, -0.12, 1.0, 0.36, 0.09, 0.9, 0.04, 0xbfe4ee, { r: [0, 0, 0.04] });             // thác nước nhỏ
      // cây cảnh nhỏ trên đá
      const tree = (px, py, pz, s, ci) => {
        branch(T, [px, py, pz], [px + 0.06 * s, py + 0.2 * s, pz], 0.035 * s, 0.025 * s, 0x5c4636, 4); branch(T, [px + 0.06 * s, py + 0.2 * s, pz], [px - 0.04 * s, py + 0.42 * s, pz + 0.03 * s], 0.025 * s, 0.015 * s, 0x5c4636, 4);
        put(T, ICO, LEAFG[ci % 4], px + 0.1 * s, py + 0.34 * s, pz, 0.2 * s, 0.1 * s, 0.18 * s, { j: 0.1 }); put(T, ICO, LEAFG[(ci + 1) % 4], px - 0.08 * s, py + 0.5 * s, pz + 0.03 * s, 0.16 * s, 0.09 * s, 0.14 * s, { j: 0.1 });
      };
      tree(-0.5, 2.0, -0.06, 1.0, 0); tree(0.92, 1.68, 0.08, 0.8, 1); tree(-1.5, 1.22, 0.28, 0.7, 2); tree(0.15, 0.9, 0.55, 0.6, 3);
      // tháp nhỏ ba tầng trên thềm
      const px = 0.55, pz = 0.55;
      box(T, px, 0.76, pz, 0.26, 0.14, 0.26, C.stoneL); put(T, CONE4, 0x7a4a3a, px, 0.92, pz, 0.42, 0.14, 0.42, { r: [0, PI / 4, 0] });
      box(T, px, 1.04, pz, 0.18, 0.12, 0.18, C.stoneL); put(T, CONE4, 0x7a4a3a, px, 1.18, pz, 0.32, 0.12, 0.32, { r: [0, PI / 4, 0] });
      box(T, px, 1.28, pz, 0.12, 0.1, 0.12, C.stoneL); put(T, CONE4, 0x7a4a3a, px, 1.4, pz, 0.24, 0.12, 0.24, { r: [0, PI / 4, 0] });
      cyl(T, px, 1.52, pz, 0.01, 0.02, 0.14, C.gold, 4);
      // cầu đá vồng nhỏ ở mặt trước
      for (let i = 0; i < 6; i++) {
        const t0 = i / 6, t1 = (i + 1) / 6, h = (t) => 0.5 + Math.sin(PI * t) * 0.3, x0 = -0.2 + t0 * 1.2, x1 = -0.2 + t1 * 1.2;
        const s = U.segMatrix(x0, h(t0), 0.88, x1, h(t1), 0.88); T.add(BOX, C.stoneL, { s: [0.3, 0.07, s.len + 0.02], m: s.m });
        const q = U.segMatrix(x0, h(t0) + 0.1, 0.99, x1, h(t1) + 0.1, 0.99); T.add(BOX, C.stone, { s: [0.03, 0.04, q.len], m: q.m });
        const q2 = U.segMatrix(x0, h(t0) + 0.1, 0.77, x1, h(t1) + 0.1, 0.77); T.add(BOX, C.stone, { s: [0.03, 0.04, q2.len], m: q2.m });
      }
    });
    grp(F, x, y0, z, yaw, (T) => { // mặt nước + lá sen
      box(T, 0, 0.47, 0, 3.55, 0.03, 2.05, 0x2b6b78);
      for (const [px, pz] of [[-1.3, -0.75], [1.45, 0.45], [-1.2, 0.8], [0.9, -0.7]]) { cyl(T, px, 0.5, pz, 0.17, 0.17, 0.02, 0x4f8a3c, 6); }
      put(T, CONE4, 0xf28aaa, -1.3, 0.56, -0.75, 0.1, 0.14, 0.1);
    });
    const a = rot(yaw, 2.1, 1.35), b = rot(yaw, -2.1, -1.35);
    bbox(x + Math.min(a[0], b[0]), z + Math.min(a[1], b[1]), x + Math.max(a[0], b[0]), z + Math.max(a[1], b[1]), 'honnonbo');
  }
  const footHon = (yaw) => rotFoot(yaw, [[-1.4, 0, 1.62], [0, 0, 1.62], [1.4, 0, 1.62], [-1.0, 2.1, 0.5, 1], [0, 3.0, 0.7, 1], [1.0, 2.1, 0.5, 1]]);

  // =====================================================================
  //  HOA VĂN SEN DÁT TRÊN NỀN SÂN (phẳng, đi lên được, không va chạm): bớt mảng gạch trống ở giữa sân
  // =====================================================================
  const CIRC24 = new THREE.CircleGeometry(1, 24).rotateX(-PI / 2), RING24 = new THREE.RingGeometry(0.88, 1, 24).rotateX(-PI / 2);
  function medallion(x, z, R, y) {
    put(F, CIRC24, 0xc9b48a, x, y, z, R, 1, R, { j: 0.03 });
    put(F, RING24, 0x9b5d42, x, y + 0.004, z, R, 1, R, { j: 0.03 });
    put(F, RING24, 0x7a4a3a, x, y + 0.004, z, R * 0.62, 1, R * 0.62, { j: 0.03 });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; put(F, CIRC24, i % 2 ? 0xf2d9c4 : 0xe0a58a, x + Math.sin(a) * R * 0.37, y + 0.008, z + Math.cos(a) * R * 0.37, R * 0.12, 1, R * 0.27, { r: [0, a, 0], j: 0.03 }); }
    put(F, CIRC24, C.goldD, x, y + 0.012, z, R * 0.14, 1, R * 0.14, { j: 0.02 });
  }

  // =====================================================================
  //  CỘT NÊU + DÂY CỜ NGŨ SẮC (xanh – vàng – đỏ – trắng – cam), đung đưa nhẹ
  // =====================================================================
  const FLAGC = [0x2064c8, 0xf6c915, 0xd8322a, 0xf7f2e6, 0xf28a1e];
  const fP = [], fN = [], fC = [], fB = [], fNx = [], fNz = [], fPh = [], fSc = [];
  const cP = [], cN = [], cC = [];
  const _cc = new THREE.Color();
  function cordQuad(ax, ay, az, bx, by, bz, w) {
    const ux = bx - ax, uz = bz - az, l = Math.hypot(ux, uz) || 1, sx = (-uz / l) * w, sz = (ux / l) * w;
    cP.push(ax, ay + w, az, bx, by + w, bz, bx, by - w, bz, ax, ay - w, az); for (let i = 0; i < 4; i++) cN.push(-uz / l, 0, ux / l);
    cP.push(ax - sx, ay, az - sz, bx - sx, by, bz - sz, bx + sx, by, bz + sz, ax + sx, ay, az + sz); for (let i = 0; i < 4; i++) cN.push(0, 1, 0);
    _cc.set(0x5a4636); for (let i = 0; i < 8; i++) cC.push(_cc.r, _cc.g, _cc.b);
  }
  let flagCi = 0;
  function addString(A, B2, sagK) {
    const dx = B2[0] - A[0], dz = B2[2] - A[2], L = Math.hypot(dx, dz);
    if (L < 2.5) return;
    const sag = U.clamp((sagK || 0.07) * L, 0.45, 1.5), n = Math.max(3, Math.round(L / 0.6));
    const px = [], py = [], pz = [];
    for (let i = 0; i <= n; i++) { const t = i / n; px.push(A[0] + dx * t); py.push(A[1] + (B2[1] - A[1]) * t - 4 * sag * t * (1 - t)); pz.push(A[2] + dz * t); }
    for (let i = 0; i < n; i++) cordQuad(px[i], py[i], pz[i], px[i + 1], py[i + 1], pz[i + 1], 0.014);
    const ux = dx / L, uz = dz / L, nx = -uz, nz = ux, w = 0.15, h = 0.4;
    flagCi += (rnd0() * 5) | 0;
    for (let i = 1; i < n; i++) {
      const x = px[i], y = py[i], z = pz[i], f = 0.94 + rnd0() * 0.1;
      _cc.set(FLAGC[flagCi++ % 5]);
      fP.push(x - ux * w, y, z - uz * w, x + ux * w, y, z + uz * w, x + ux * w, y - h, z + uz * w, x - ux * w, y - h, z - uz * w);
      for (let k = 0; k < 4; k++) { fN.push(nx, 0, nz); fC.push(_cc.r * f, _cc.g * f, _cc.b * f); }
      fB.push(x + ux * w, y - h, z + uz * w, x - ux * w, y - h, z - uz * w); fNx.push(nx); fNz.push(nz); fPh.push(rnd0() * 6.28 + i * 0.4); fSc.push(0.75 + rnd0() * 0.5);
    }
  }
  const poleTop = (p) => [p.x, p.y0 + 6.5, p.z];
  function pole(x, z) { // cột nêu bằng tre cao 7 m, ngọn có túm lá và dải vải đỏ
    const y0 = hy(x, z), h = 7.0;
    box(S, x, y0 + 0.12, z, 0.5, 0.24, 0.5, C.stoneD);
    cyl(S, x, y0 + 0.24 + h / 2, z, 0.04, 0.075, h, 0x9fae4f, 6);
    for (let k = 0; k < 5; k++) put(S, new THREE.CylinderGeometry(0.085 - k * 0.005, 0.085 - k * 0.005, 0.05, 6, 1, true), 0x7a8a3a, x, y0 + 0.9 + k * 1.4, z, 1, 1, 1);
    for (let k = 0; k < 3; k++) { const a = k * 2.1; put(S, CONE6, k % 2 ? 0x5d8c3d : 0x4c7a35, x + Math.cos(a) * 0.12, y0 + h + 0.05, z + Math.sin(a) * 0.12, 0.3, 1.1, 0.3, { r: [Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5] }); }
    box(S, x + 0.3, y0 + h - 0.45, z, 0.6, 0.34, 0.012, 0xd8322a); box(S, x + 0.3, y0 + h - 0.45, z, 0.6, 0.06, 0.016, 0xf6c915);
    circ(x, z, 0.22, 'pole');
    return { x, z, y0 };
  }
  const gateEave = (x) => [x, 4.66, 29.15], tru = (s) => [s * 7.9, 5.15, 30.95];
  function placePole(x, z, rad) { const p = find(x, z, [[0, 0, 0.22]], rad || 3.2, 0.4); if (!p) return null; mark(p.x, p.z, 0.5); return pole(p.x, p.z); }

  // =====================================================================
  //  ĐÈN LỒNG NHỎ DƯỚI MÁI HIÊN (gác chuông, nhà xin quẻ)
  // =====================================================================
  const LANT_G = lathe([[0, -0.22], [0.15, -0.16], [0.21, 0], [0.15, 0.17], [0, 0.23]], 6);
  const LCOL = [[0xd8322a, [1.0, 0.42, 0.18]], [0xf28a1e, [1.0, 0.6, 0.2]], [0xf6c915, [1.0, 0.8, 0.3]]];
  let lantI = 0;
  function miniLantern(x, yTop, z, s) {
    const c = LCOL[lantI % 3], len = 0.2;
    box(S, x, yTop - len / 2, z, 0.014, len, 0.014, 0x2a1a10);
    const y = yTop - len - 0.22 * s;
    LB.add(LANT_G, c[0], { p: [x, y, z], s, j: 0.03 });
    cyl(S, x, y + 0.24 * s, z, 0.09 * s, 0.1 * s, 0.05 * s, C.gold, 6); box(S, x, y - 0.33 * s, z, 0.015, 0.16 * s, 0.015, 0xd8322a);
    if (lantI % 2 === 0) glow(x, y, z, 1.0 * s, c[1], true);
    lantI++;
  }

  // =====================================================================
  //  BỐ TRÍ
  // =====================================================================
  const wanderAdd = [], prayAdd = [], honView = [];
  const stand = (x, z, yaw) => ({ x, z, yaw });
  const standOK = (x, z) => !col.hit(x, z, 0.5) && !banned(x, z, 0.2);

  // 1. Tượng Di Lặc ở sân trước, bên trái sau cổng, quay mặt về lối giữa
  safe('diLac', () => {
    const yaw = PI / 2, p = find(-14.2, 25.0, footDL(yaw), 6.0, 0.4);
    if (!p) return;
    diLac(p.x, p.z, yaw); circ(p.x, p.z, 1.28, 'dilac');
    const al = rot(yaw, -0.55, 1.28), ar = rot(yaw, 0.55, 1.9); bbox(p.x + Math.min(al[0], ar[0]), p.z + Math.min(al[1], ar[1]), p.x + Math.max(al[0], ar[0]), p.z + Math.max(al[1], ar[1]), 'altar');
    mark(p.x, p.z, 1.6);
    for (const [dx, dz] of [[-0.9, 2.6], [0.9, 2.6], [0, 3.1]]) { const d = rot(yaw, dx, dz), sx = p.x + d[0], sz = p.z + d[1]; if (standOK(sx, sz)) prayAdd.push(stand(sx, sz, U.yawTo(sx, sz, p.x, p.z))); }
    W.decor = Object.assign(W.decor || {}, { diLac: { x: p.x, z: p.z, yaw } });
  });
  // 2. Hòn non bộ ở sân phía tây (quay mặt về lối giữa)
  safe('honNonBo', () => {
    const yaw = PI / 2, p = find(-19.4, 18.0, footHon(yaw), 6.0, 0.4);
    if (!p) return;
    honNonBo(p.x, p.z, yaw); mark(p.x, p.z, 2.3);
    for (const [dx, dz] of [[2.9, -1.0], [2.9, 1.1], [3.1, 0]]) if (standOK(p.x + dx, p.z + dz)) { const w = { x: p.x + dx, z: p.z + dz }; wanderAdd.push(w); honView.push(w); }
    W.decor = Object.assign(W.decor || {}, { honNonBo: { x: p.x, z: p.z } });
  });
  // 3. Hai cây ở góc sân phía tây (hoa sứ, bồ đề nhỏ) + ghế đá
  safe('trees', () => {
    const f = find(-21.0, 9.5, [[0, 0, 1.0]], 4.5, 0.4);
    if (f) { frangipani(f.x, f.z, 411, true); mark(f.x, f.z, 1.2); placeBench(f.x + 2.6, f.z, -PI / 2, 2.0); }
    const b = find(-20.0, -5.2, [[0, 0, 1.1]], 4.5, 0.4);
    if (b) { bodhi(b.x, b.z, 412); mark(b.x, b.z, 1.2); placeBench(b.x + 2.7, b.z, -PI / 2, 2.2); }
  });
  // 4. Ghế đá dưới các cây có sẵn
  safe('benches', () => {
    placeBench(-20.8, 24.2, PI / 2, 2.5);   // dưới cây tròn góc tây sân trước, quay mặt vào sân
    placeBench(20.9, 24.6, -PI / 2, 2.5);   // dưới cây tròn góc đông, nhìn ra hồ sen
    placeBench(19.6, -8.6, -PI / 2, 3.0); // cạnh cây bồ đề lớn
  });
  // 5. Hàng chậu mai – quất dọc tường trước, tường hai bên, hai bên bậc chính điện, bên cổng
  safe('pots', () => {
    rowPots(-10.4, 29.3, -22.2, 29.3, 2.7, 0, 1.4);
    rowPots(10.4, 29.3, 22.2, 29.3, 2.7, 1, 1.4);
    rowPots(-22.5, 25.0, -22.5, -8.0, 3.3, 0, 1.6);
    rowPots(22.5, 27.0, 22.5, -8.0, 3.4, 1, 1.6);
  });
  safe('potsGate', () => {
    for (const s of [-1, 1]) { const p = find(s * 4.3, 27.6, pot1, 1.6, 0.3); if (p) { (s < 0 ? mai : quat)(p.x, p.z, potSeed++); mark(p.x, p.z, 0.6); } }
    // chậu ở hai góc sân chính điện (sân sâu 5,4 m, rộng đến mép tầng nền ±11, có lan can thấp ở z −62; giữ lối giữa ±2,6; đèn đá xen giữa hai chậu)
    for (const s of [-1, 1]) for (const [x, z] of [[10.1, -60.7], [10.1, -57.9]]) { const p = find(s * x, z, pot1, 1.2, 0.3); if (p) { (potSeed % 2 ? mai : quat)(p.x, p.z, potSeed++); mark(p.x, p.z, 0.6); } }
  });
  // 6. Bồn hoa quanh sân (cạnh tường, quanh gác chuông, sân sau, góc tầng nền)
  safe('beds', () => {
    const slots = [
      [-17.8, 27.8, 2.4, 1.1], [17.2, 28.0, 2.4, 1.1], [-19.5, 3.5, 2.2, 1.2], [-9.0, 20.0, 1.4, 2.4], [20.4, 1.5, 2.4, 1.2], [-8.8, 8.5, 1.4, 2.4],
      [-15.0, -10.5, 2.4, 1.2], [15.0, -12.5, 2.4, 1.2], [-6.5, -9.0, 2.2, 1.2], [6.5, -9.0, 2.2, 1.2],
      [-9.4, -27.8, 1.6, 1.6], [9.4, -27.8, 1.6, 1.6], [-16.5, -16.0, 2.4, 1.2], [16.5, -22.0, 2.4, 1.2],
    ];
    for (const [x, z, w, d] of slots) placeBed(x, z, w, d, 2.8, w === d && z < -22);
  });
  // 7. Đèn đá nhỏ quanh các hạng mục
  safe('lamps', () => {
    const d = W.decor || {};
    if (d.diLac) for (const s of [-1, 1]) { const o = rot(d.diLac.yaw, s * 2.3, 0.9); placeLamp(d.diLac.x + o[0], d.diLac.z + o[1], 1.2); }
    if (d.honNonBo) { placeLamp(d.honNonBo.x + 1.9, d.honNonBo.z - 2.9, 1.2); placeLamp(d.honNonBo.x + 1.9, d.honNonBo.z + 2.9, 1.2); }
    for (const [x, z] of [[-21, 15], [21.5, -1], [-10.4, -59.3], [10.4, -59.3], [-8.5, -10], [8.5, -10], [-18, 0], [21, 12], [-12, 22], [-6.5, -28.5], [6.5, -28.5]]) placeLamp(x, z, 1.8);
  });
  // 7b. Hoa văn sen lát trên lối giữa sân trước và sân sau
  safe('medallions', () => { medallion(0, 18.2, 1.85, 0.034); medallion(0, 11.0, 1.85, 0.034); medallion(0, -2.0, 1.85, 0.034); medallion(0, -9.0, 1.7, 0.044); });
  // 8. Cột nêu + dây cờ
  safe('flags', () => {
    const P = { W: [], E: [] };
    for (const s of [-1, 1]) {
      const arr = s < 0 ? P.W : P.E;
      for (const [x, z] of [[8.3, 23.5], [8.1, 13.5], [9.0, 2.8]]) arr.push(placePole(s * x, z, 3.4));
      for (const [x, z] of [[6.4, -10.4], [9.0, -23.6], [7.6, -29.0]]) arr.push(placePole(s * x, z, 3.2));
    }
    const chain = (s, nodes) => { const pts = nodes.filter(Boolean); for (let i = 0; i + 1 < pts.length; i++) addString(pts[i], pts[i + 1]); };
    for (const s of [-1, 1]) {
      const a = s < 0 ? P.W : P.E, T = (i) => a[i] && poleTop(a[i]);
      chain(s, [tru(s), T(0), T(1), T(2), T(3)]);
      if (T(0)) addString(gateEave(s * 3.0), T(0));
      if (T(2)) addString(T(2), [s * 12.3, 4.74, -3.0]);
      chain(s, [T(3), T(4), T(5)]);
    }
    const x2 = (i, j) => { const w = P.W[i], e = P.E[j]; if (w && e) addString(poleTop(w), poleTop(e)); };
    x2(0, 0); x2(2, 2); x2(3, 3); x2(4, 4); x2(0, 1); x2(5, 5);
    if (P.E[1] && P.W[2]) addString(poleTop(P.E[1]), poleTop(P.W[2]));
    if (P.W[1] && P.E[2]) addString(poleTop(P.W[1]), poleTop(P.E[2]));
  });
  // 9. Đèn lồng nhỏ dưới mái hiên gác chuông + nhà xin quẻ
  safe('eaves', () => {
    const bt = (s) => 4.82 + 0.6 * Math.pow(Math.abs(2 * s - 1), 3) - 0.34;
    for (const s of [0.2, 0.4, 0.6, 0.8]) {
      miniLantern(-12.35, bt(s), -6 + 6 * s, 0.7); miniLantern(-18.05, bt(s), -6 + 6 * s, 0.7);
      miniLantern(-18.2 + 6 * s, bt(s), -5.85, 0.7); miniLantern(-18.2 + 6 * s, bt(s), -0.15, 0.7);
    }
    const ft = (s) => 3.0 + 0.5 * Math.pow(Math.abs(2 * s - 1), 3) - 0.3;
    for (const s of [0.2, 0.4, 0.6, 0.8]) { miniLantern(-16.4 + 4.8 * s, ft(s), 16.05, 0.6); miniLantern(-16.4 + 4.8 * s, ft(s), 12.45, 0.6); }
    for (const s of [0.3, 0.7]) { miniLantern(-16.25, ft(s), 12.3 + 3.9 * s, 0.6); miniLantern(-11.75, ft(s), 12.3 + 3.9 * s, 0.6); }
  });
  // 10. Lấp các khoảng trống lớn còn lại bằng bồn hoa
  safe('fill', () => {
    const dist = (x, z) => {
      let d = 99;
      for (const c of col.list) {
        let dd;
        if (c.t === 0) dd = Math.hypot(x - c.x, z - c.z) - c.r;
        else if (c.t === 1) dd = Math.hypot(x - U.clamp(x, c.x0, c.x1), z - U.clamp(z, c.z0, c.z1));
        else dd = Math.hypot(x - c.x, z - c.z) - Math.min(c.rx, c.rz);
        if (dd < d) d = dd;
      }
      return d;
    };
    const cand = []; // ứng viên + khoảng cách cũ (khoảng cách chỉ giảm dần nên giá trị cũ là cận trên)
    for (let z = 27; z >= -12; z -= 1.5) for (let x = -22; x <= 22; x += 1.5) if (canPlace(x, z, 1.0)) cand.push([x, z, dist(x, z)]);
    for (let it = 0; it < 14; it++) {
      let best = null, bd = 2.7;
      for (const c of cand) {
        if (c[2] <= bd) continue;
        if (!canPlace(c[0], c[1], 1.0)) { c[2] = 0; continue; }
        c[2] = dist(c[0], c[1]);
        if (c[2] > bd) { bd = c[2]; best = c; }
      }
      if (!best) break;
      const round = it % 2 === 1, p = placeBed(best[0], best[1], round ? 2.0 : 2.4, round ? 2.0 : 1.2, 1.2, round);
      if (!p) best[2] = 0;
    }
  });

  // =====================================================================
  //  GỘP MESH + THÊM ĐIỂM ĐỨNG CHO KHÁCH AI + ĐUNG ĐƯA DÂY CỜ
  // =====================================================================
  const meshes = [];
  const addMesh = (m) => { scene.add(m); meshes.push(m); return m; };
  addMesh(S.mesh(G.mats.vc, { cast: true, receive: true }));
  addMesh(F.mesh(G.mats.vc, { cast: false, receive: true }));
  addMesh(GD.mesh(G.mats.gold, { cast: false, receive: false }));
  addMesh(LB.mesh(G.mats.lantern, { cast: false, receive: false }));
  let flagMesh = null;
  safe('flagMesh', () => {
    const nF = fNx.length, nC = cP.length / 12, nQ = nF + nC;
    if (!nQ) return;
    const pos = new Float32Array([...fP, ...cP]), nor = new Float32Array([...fN, ...cN]), cl = new Float32Array([...fC, ...cC]), idx = nQ * 4 < 65536 ? new Uint16Array(nQ * 6) : new Uint32Array(nQ * 6);
    for (let q = 0; q < nQ; q++) idx.set([q * 4, q * 4 + 1, q * 4 + 2, q * 4, q * 4 + 2, q * 4 + 3], q * 6);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(cl, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeBoundingSphere(); g.boundingSphere.radius += 1.5;
    flagMesh = new THREE.Mesh(g, G.mats.vcDouble); flagMesh.castShadow = false; flagMesh.receiveShadow = false; flagMesh.matrixAutoUpdate = false; flagMesh.updateMatrix();
    addMesh(flagMesh);
    const base = new Float32Array(fB), pa = g.attributes.position; let acc = 0;
    G.onUpdate((dt, t) => {
      acc += dt; if (acc < 0.05) return; acc = 0;
      const gust = 0.6 + 0.4 * Math.sin(t * 0.31), arr = pa.array;
      for (let i = 0; i < nF; i++) {
        const o = i * 12, b = i * 6, s = Math.sin(t * 1.8 + fPh[i]) * 0.085 * gust * fSc[i], s2 = Math.sin(t * 1.8 + fPh[i] - 0.5) * 0.085 * gust * fSc[i];
        arr[o + 6] = base[b] + fNx[i] * s; arr[o + 7] = base[b + 1] + Math.abs(s) * 0.12; arr[o + 8] = base[b + 2] + fNz[i] * s;
        arr[o + 9] = base[b + 3] + fNx[i] * s2; arr[o + 10] = base[b + 4] + Math.abs(s2) * 0.12; arr[o + 11] = base[b + 5] + fNz[i] * s2;
      }
      pa.needsUpdate = true;
    }, 58);
  });

  // thêm chỗ đứng cho khách AI (cầu nguyện trước tượng Di Lặc, ngồi ghế mới, đi dạo ngắm hoa)
  safe('spots', () => {
    const S2 = G.spots;
    // điểm chỉ dùng khi có ít nhất 1 nút dẫn đường nhìn thấy (trong 8,5 m): khách AI chắc chắn đi tới được
    const seen = (x, z) => { for (let i = 0; i < NN; i++) { const nd = NODES[i]; if (Math.hypot(nd.x - x, nd.z - z) < 8.5 && G.nav.los(x, z, nd.x, nd.z, 0.3)) return true; } return false; };
    const pray = prayAdd.filter((p) => seen(p.x, p.z));
    if (S2.hallFront && pray.length) S2.hallFront.push(...pray);
    const bn = newBench.filter((b) => seen(b.x, b.z));
    if (S2.bench && bn.length) S2.bench.push(...bn);
    if (S2.wander) {
      const own = wanderAdd.filter((w) => seen(w.x, w.z)); let n = 0;
      for (const w of own) { S2.wander.push(w); n++; }
      for (const it of items) {
        if (it[2] < 1.0 || n >= 16) continue;
        for (const a of [0.8, 2.4, 4.0, 5.5]) {
          const x = it[0] + Math.cos(a) * (it[2] + 1.1), z = it[1] + Math.sin(a) * (it[2] + 1.1);
          if (standOK(x, z) && !SP.some((v, i) => i % 2 === 0 && Math.hypot(v - x, SP[i + 1] - z) < 1.2) && !S2.wander.some((w) => Math.hypot(w.x - x, w.z - z) < 3) && seen(x, z)) { S2.wander.push({ x, z }); n++; break; }
        }
      }
    }
    // thêm vào "Bản đồ chùa" (chạm để tự đi tới)
    const d = W.decor || {}, pl = pray[pray.length - 1], hv = honView.find((w) => seen(w.x, w.z));
    if (d.diLac && pl) W.places.push({ label: 'Tượng Bồ Tát Di Lặc', desc: 'Nụ cười hiền hoà ở sân trước', icon: 'lotus', x: pl.x, z: pl.z });
    if (d.honNonBo && hv) W.places.push({ label: 'Hòn non bộ', desc: 'Núi đá nhỏ giữa chậu nước, có tháp và cầu bé xinh', icon: 'stupa', x: hv.x, z: hv.z });
  });

  W.decor = Object.assign(W.decor || {}, { meshes, flags: flagMesh, colliders: myCols, cut: cutAll.length });
  G.nav.built = false; // dựng lại đồ thị dẫn đường với các vật cản mới (G.start)
}
