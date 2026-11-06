// =====================================================================
//  CẢNH VẬT QUANH CHÙA: lối vào có hàng hương hoa, cây đa & miếu nhỏ, ruộng lúa bậc thang,
//  xóm làng (nhà ngói, đình, luỹ tre, cau, chuối), con sông có thuyền nan & cầu cong,
//  hàng cây sát tường, diều và cò trên trời. Mọi thứ dựng bằng code, gộp thành 6 lượt vẽ.
//  Chỉ đặt vật cản ở chỗ không chắn lối đi (canPlace); xa ngoài tầm đi bộ thì không cần vật cản.
// =====================================================================
function buildScenery(G) {
  const { THREE, util: U, scene } = G;
  const BD = G.build, W = G.world, col = G.collide;
  if (!BD || !W || !G.terrainY || !G.nav) return;
  const PI = Math.PI, TAU = PI * 2, C = BD.C, addRoof = BD.addRoof, clamp = U.clamp;
  const rnd = U.rng(130013);
  const rr = (a, b) => a + (b - a) * rnd();
  const pick = (a) => a[(rnd() * a.length) | 0];
  const safe = (name, fn) => { try { fn(); } catch (e) { console.error('[cảnh vật]', name, e); } };

  // ---------- Bộ ghi tam giác thô (nhanh hơn dựng từng mảnh) ----------
  const lcache = new Map();
  const lin = (hex) => { let k = lcache.get(hex); if (!k) { const t = new THREE.Color(hex); k = [t.r, t.g, t.b]; lcache.set(hex, k); } return k; };
  let jst = 0x2545f491;
  const jr = () => { jst = (Math.imul(jst, 1664525) + 1013904223) >>> 0; return jst / 4294967296; };
  const mkRaw = () => ({ p: [], c: [] });
  function T3(R, ax, ay, az, bx, by, bz, cx, cy, cz, hex, j = 0.06) {
    const k = lin(hex), f = 1 + (jr() - 0.5) * 2 * j, r = k[0] * f, g = k[1] * f, b = k[2] * f;
    R.p.push(ax, ay, az, bx, by, bz, cx, cy, cz); R.c.push(r, g, b, r, g, b, r, g, b);
  }
  const toGeo = (R) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(R.p), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(R.c), 3));
    g.computeVertexNormals();
    return g;
  };
  const BC = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
  const BF = [[4, 5, 6, 7], [1, 0, 3, 2], [5, 1, 2, 6], [0, 4, 7, 3], [7, 6, 2, 3], [0, 1, 5, 4]];
  const bv = new Float64Array(24);
  const ICO0 = Array.from(new THREE.IcosahedronGeometry(1, 0).attributes.position.array);
  const ICO1 = Array.from(new THREE.IcosahedronGeometry(1, 1).attributes.position.array);
  // khung toạ độ cục bộ: gốc (ox,oy,oz), xoay yaw quanh trục y; +z cục bộ là hướng "mặt trước"
  function fr(R, ox, oy, oz, yaw) {
    yaw = yaw || 0;
    const cs = Math.cos(yaw), sn = Math.sin(yaw);
    const X = (x, z) => ox + x * cs + z * sn, Z = (x, z) => oz - x * sn + z * cs;
    const f = {
      P: (x, y, z) => [X(x, z), oy + y, Z(x, z)],
      tri(ax, ay, az, bx, by, bz, cx, cy, cz, hex, j) { T3(R, X(ax, az), oy + ay, Z(ax, az), X(bx, bz), oy + by, Z(bx, bz), X(cx, cz), oy + cy, Z(cx, cz), hex, j); },
      quad(a, b, c, d, hex, j) { f.tri(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], hex, j); f.tri(a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2], hex, j); },
      // hộp: tâm (x,y,z), kích thước sx,sy,sz; o: rx,rz,ry nghiêng/xoay, top: màu mặt trên, bot: vẽ mặt đáy
      box(x, y, z, sx, sy, sz, hex, o = {}) {
        const rx = o.rx || 0, rz = o.rz || 0, ry = o.ry || 0;
        const crx = Math.cos(rx), srx = Math.sin(rx), crz = Math.cos(rz), srz = Math.sin(rz), cry = Math.cos(ry), sry = Math.sin(ry);
        for (let i = 0; i < 8; i++) {
          let px = (BC[i][0] * sx) / 2, py = (BC[i][1] * sy) / 2, pz = (BC[i][2] * sz) / 2;
          if (rx) { const y1 = py * crx - pz * srx, z1 = py * srx + pz * crx; py = y1; pz = z1; }
          if (rz) { const x1 = px * crz - py * srz, y1 = px * srz + py * crz; px = x1; py = y1; }
          if (ry) { const x1 = px * cry + pz * sry, z1 = -px * sry + pz * cry; px = x1; pz = z1; }
          px += x; py += y; pz += z;
          bv[i * 3] = X(px, pz); bv[i * 3 + 1] = oy + py; bv[i * 3 + 2] = Z(px, pz);
        }
        for (let q = 0; q < 6; q++) {
          if (q === 5 && !o.bot) continue;
          const [a, b, c, d] = BF[q], h = q === 4 && o.top != null ? o.top : hex;
          T3(R, bv[a * 3], bv[a * 3 + 1], bv[a * 3 + 2], bv[b * 3], bv[b * 3 + 1], bv[b * 3 + 2], bv[c * 3], bv[c * 3 + 1], bv[c * 3 + 2], h, o.j);
          T3(R, bv[a * 3], bv[a * 3 + 1], bv[a * 3 + 2], bv[c * 3], bv[c * 3 + 1], bv[c * 3 + 2], bv[d * 3], bv[d * 3 + 1], bv[d * 3 + 2], h, o.j);
        }
      },
      // trụ/nón cụt thẳng đứng: đáy tâm (x,y,z), bán kính đáy rb, đỉnh rt, cao h; o: lx,lz lệch đỉnh, top/bot: nắp
      cyl(x, y, z, rb, rt, h, seg, hex, o = {}) {
        const lx = o.lx || 0, lz = o.lz || 0, yt = y + h;
        for (let i = 0; i < seg; i++) {
          const a0 = (i / seg) * TAU, a1 = ((i + 1) / seg) * TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
          const Ax = x + rb * c0, Az = z + rb * s0, Bx = x + rb * c1, Bz = z + rb * s1, Cx = x + lx + rt * c1, Cz = z + lz + rt * s1, Dx = x + lx + rt * c0, Dz = z + lz + rt * s0;
          if (rt > 1e-4) f.tri(Ax, y, Az, Dx, yt, Dz, Cx, yt, Cz, hex, o.j);
          f.tri(Ax, y, Az, Cx, yt, Cz, Bx, y, Bz, hex, o.j);
          if (o.top && rt > 1e-4) f.tri(x + lx, yt, z + lz, Cx, yt, Cz, Dx, yt, Dz, o.topHex ?? hex, o.j);
          if (o.bot) f.tri(x, y, z, Ax, y, Az, Bx, y, Bz, hex, o.j);
        }
      },
      // khối cầu thô (20 hoặc 80 mặt) kéo giãn rx,ry,rz; o.hex2: màu mặt trên, o.ry: xoay
      blob(x, y, z, rx, ry, rz, hex, o = {}) {
        const src = o.d1 ? ICO1 : ICO0, cr = Math.cos(o.ry || 0), sr = Math.sin(o.ry || 0);
        for (let t = 0; t < src.length; t += 9) {
          for (let k = 0; k < 3; k++) { const px = src[t + k * 3] * rx, py = src[t + k * 3 + 1] * ry, pz = src[t + k * 3 + 2] * rz; bv[k * 3] = x + px * cr + pz * sr; bv[k * 3 + 1] = y + py; bv[k * 3 + 2] = z - px * sr + pz * cr; }
          const up = src[t + 1] + src[t + 4] + src[t + 7] > 0.9;
          f.tri(bv[0], bv[1], bv[2], bv[3], bv[4], bv[5], bv[6], bv[7], bv[8], o.hex2 != null && up ? o.hex2 : hex, o.j ?? 0.1);
        }
      },
    };
    return f;
  }
  // mặt phẳng luôn quay lên trên (dải đất, bờ ruộng, mặt nước)
  function upTri(R, a, b, c, hex, j) {
    const ny = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]);
    if (ny >= 0) T3(R, a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], hex, j); else T3(R, a[0], a[1], a[2], c[0], c[1], c[2], b[0], b[1], b[2], hex, j);
  }
  const upQuad = (R, a, b, c, d, hex, j) => { upTri(R, a, b, c, hex, j); upTri(R, a, c, d, hex, j); };
  // lá hai mặt (cau, chuối, tre, dừa): gốc (bx,by,bz), hướng ang, dài len, rộng wid, nâng rise, rủ drop
  function leaf(R, bx, by, bz, ang, len, wid, rise, drop, hex) {
    const dx = Math.cos(ang), dz = Math.sin(ang), sx = -dz, sz = dx, w0 = wid * 0.14, w1 = wid * 0.5;
    const mx = bx + dx * len * 0.5, my = by + rise, mz = bz + dz * len * 0.5;
    const tx = bx + dx * len, ty = by + rise - drop, tz = bz + dz * len;
    T3(R, bx - sx * w0, by, bz - sz * w0, bx + sx * w0, by, bz + sz * w0, mx + sx * w1, my, mz + sz * w1, hex, 0.08);
    T3(R, bx - sx * w0, by, bz - sz * w0, mx + sx * w1, my, mz + sz * w1, mx - sx * w1, my, mz - sz * w1, hex, 0.08);
    T3(R, mx - sx * w1, my, mz - sz * w1, mx + sx * w1, my, mz + sz * w1, tx, ty, tz, hex, 0.08);
  }

  // ---------- Địa hình: chiều cao đúng bằng lưới cỏ (47×47 ô 10 m) ----------
  const GRID = 470, CELL = 10;
  const th = (i, j) => G.terrainY(-GRID / 2 + i * CELL, -GRID / 2 + j * CELL);
  const gy = (x, z) => {
    const fx = (x + GRID / 2) / CELL, fz = (z + GRID / 2) / CELL, ix = Math.floor(fx), iz = Math.floor(fz), ux = fx - ix, uz = fz - iz;
    const h00 = th(ix, iz), h10 = th(ix + 1, iz), h01 = th(ix, iz + 1);
    if (ux + uz <= 1) return h00 + (h10 - h00) * ux + (h01 - h00) * uz;
    const h11 = th(ix + 1, iz + 1);
    return h11 + (h01 - h11) * (1 - ux) + (h10 - h11) * (1 - uz);
  };

  // ---------- Kiểm tra chỗ đặt: không chắn lối đi, điểm hoạt động, đồ thị dẫn đường ----------
  G.nav.build();
  const NV = G.nav.nodes, segs = [];
  for (let i = 0; i < NV.length; i++) for (const e of NV[i].n) if (e.i > i) segs.push(NV[i].x, NV[i].z, NV[e.i].x, NV[e.i].z);
  const pts = [];
  const addPt = (o) => { if (o && typeof o.x === 'number' && typeof o.z === 'number') pts.push(o.x, o.z); };
  for (const k of Object.keys(G.spots || {})) { const v = G.spots[k]; if (Array.isArray(v)) v.forEach(addPt); else addPt(v); }
  for (const k of Object.keys(W)) { const o = W[k]; if (o && typeof o === 'object' && !Array.isArray(o)) { addPt(o.poi); addPt(o.stand); } }
  if (W.ext) for (const k of Object.keys(W.ext)) { const o = W.ext[k]; if (o && typeof o === 'object' && !Array.isArray(o)) { addPt(o.poi); addPt(o.stand); } }
  if (G.poi && Array.isArray(G.poi.list)) G.poi.list.forEach(addPt);
  const bnd = col.bounds;
  const segD2 = (px, pz, ax, az, bx, bz) => {
    const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
    let t = l2 > 0 ? ((px - ax) * dx + (pz - az) * dz) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
    const qx = ax + dx * t - px, qz = az + dz * t - pz; return qx * qx + qz * qz;
  };
  const rectHit = (x, z, r, x0, z0, x1, z1) => { const dx = Math.max(x0 - x, 0, x - x1), dz = Math.max(z0 - z, 0, z - z1); return dx * dx + dz * dz < r * r; };
  // dải đi bộ 1.65 m sát tường ngoài (đông, tây, sau, hai cánh cổng) và sân trước cổng phải để trống
  const STRIPS = [[24.3, -120, 25.95, 33.6], [-25.95, -120, -24.3, 33.6], [-25.95, -119.95, 25.95, -118.3], [7, 31.3, 25.95, 32.95], [-25.95, 31.3, -7, 32.95], [-9, 28.5, 9, 34.5]]; // tường sau ở z = −118 (v4; ngoài tường −118,3; v3: −100)
  function canPlace(x, z, r) {
    if (col.hit(x, z, r)) return false;
    if (Math.abs(x) < 2.6 + r && z > 28 && z < 80) return false;                                  // lối vào chùa
    if (x > -24.3 - r && x < 24.3 + r && z > -118.4 - r && z < 31.4 + r) return false;            // trong khuôn viên (v4: tường sau z −118)
    for (const s of STRIPS) if (rectHit(x, z, r, s[0], s[1], s[2], s[3])) return false;
    if (x < bnd.x0 - 4 - r || x > bnd.x1 + 4 + r || z < bnd.z0 - 4 - r || z > bnd.z1 + 4 + r) return true; // ngoài tầm đi bộ
    for (const n of NV) { const dx = n.x - x, dz = n.z - z, m = r + 0.6; if (dx * dx + dz * dz < m * m) return false; }
    const me = r + 0.45, me2 = me * me;
    for (let i = 0; i < segs.length; i += 4) if (segD2(x, z, segs[i], segs[i + 1], segs[i + 2], segs[i + 3]) < me2) return false;
    const ms = r + 1.0, ms2 = ms * ms;
    for (let i = 0; i < pts.length; i += 2) { const dx = pts[i] - x, dz = pts[i + 1] - z; if (dx * dx + dz * dz < ms2) return false; }
    return true;
  }
  // hình chữ nhật (x0..x1, z0..z1): lấy mẫu mỗi ~0.8 m
  function rectOK(x0, z0, x1, z1, m = 0.2) {
    const nx = Math.max(1, Math.ceil((x1 - x0) / 0.8)), nz = Math.max(1, Math.ceil((z1 - z0) / 0.8));
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) if (!canPlace(x0 + ((x1 - x0) * i) / nx, z0 + ((z1 - z0) * j) / nz, m)) return false;
    return true;
  }
  // 64 cây có sẵn ngoài tường (05-world.js, dựng bằng U.rng(91)): tránh trồng đè lên thân cây
  const old = [];
  {
    const r91 = U.rng(91);
    for (let i = 0; i < 64; i++) {
      let x, z;
      for (;;) { x = (r91() * 2 - 1) * 46; z = -100 + r91() * 172; if (!(x > -26.5 && x < 26.5 && z > -120.5 && z < 33.5) && !(Math.abs(x) < 6 && z > 30)) break; } // (đúng như 05-world.js: sửa cả hai nơi cùng lúc)
      const s = i % 5 === 0 ? 0 : 0.9 + r91() * 0.6;
      old.push({ x, z, r: s ? 0.5 * s : 1.1 });
    }
  }
  const nearOld = (x, z, m) => { for (const o of old) if (Math.hypot(o.x - x, o.z - z) < o.r + m) return true; return false; };
  const inBounds = (x, z, m = 0) => x > bnd.x0 - m && x < bnd.x1 + m && z > bnd.z0 - m && z < bnd.z1 + m;

  // ---------- Các lượt vẽ ----------
  const NR = mkRaw(), FR = mkRaw(), LF = mkRaw(), WR = mkRaw(), LR = mkRaw();   // hình thô
  const NU = U.batch(), FU = U.batch(), WU = U.batch(), LU = U.batch();         // + mảnh dựng sẵn (mái, đèn lồng)
  const glow = BD.glow;
  const LEAF = [0x3f6b30, 0x4c7a35, 0x5d8c3d, 0x6f9a45, 0x35602b, 0x56883a], LEAF_L = [0x7aa84a, 0x86b050, 0x9ab855];
  const BAMB = [0x6f9a3f, 0x5d8c3d, 0x7fa84a];
  const solid = (x, z, r, tag) => { if (inBounds(x, z, 0.6)) col.circle(x, z, r, tag); };

  // =====================================================================
  //  CÂY CỐI: tán tròn, tán dù, cau, dừa, chuối, khóm tre
  // =====================================================================
  function domeTree(x, z, s, seed, near, collide) {
    const r = U.rng(seed), y0 = gy(x, z) - 0.05, f = fr(near ? NR : FR, x, y0, z, 0), h = 2.6 * s;
    f.cyl(0, 0, 0, 0.34 * s, 0.2 * s, h, near ? 7 : 5, C.bark, { lx: (r() - 0.5) * 0.4, lz: (r() - 0.5) * 0.4 });
    const n = near ? 5 : 3;
    for (let i = 0; i < n; i++) {
      const a = r() * TAU, d = (i === 0 ? 0 : 1.0 + r() * 0.9) * s, rad = (1.6 + r() * 0.8) * s;
      f.blob(Math.cos(a) * d, h + (0.5 + r() * 1.6) * s, Math.sin(a) * d, rad, rad * 0.78, rad, LEAF[(i + seed) % 6], { hex2: LEAF_L[i % 3] });
    }
    if (collide) solid(x, z, 0.36 * s + 0.12, 'tree');
  }
  function umbrellaTree(x, z, s, seed, near, collide, pal) {  // cây xoan/phượng: thân cao, tán dẹt (pal: bảng màu hoa)
    const r = U.rng(seed), y0 = gy(x, z) - 0.05, f = fr(near ? NR : FR, x, y0, z, 0), h = 5.2 * s;
    f.cyl(0, 0, 0, 0.26 * s, 0.14 * s, h, 5, C.bark, { lx: (r() - 0.5) * 0.8, lz: (r() - 0.5) * 0.8 });
    for (let i = 0; i < 3; i++) { const a = r() * TAU, d = i ? 1.2 * s : 0; f.blob(Math.cos(a) * d, h + i * 0.25 * s, Math.sin(a) * d, (2.4 - i * 0.2) * s, 0.9 * s, (2.4 - i * 0.2) * s, pal ? pal[i % pal.length] : LEAF[(i + seed + 1) % 6], { hex2: pal ? pal[(i + 1) % pal.length] : LEAF_L[(i + 1) % 3] }); }
    if (collide) solid(x, z, 0.26 * s + 0.12, 'tree');
  }
  function areca(x, z, h, near, collide) {  // cây cau: thân mảnh cao, ngọn xoè lá
    const y0 = gy(x, z) - 0.05, lx = (rnd() - 0.5) * 0.5, lz = (rnd() - 0.5) * 0.5, f = fr(near ? NR : FR, x, y0, z, 0);
    f.cyl(0, 0, 0, 0.1, 0.07, h, 5, 0x9ba46a, { lx, lz, j: 0.04 });
    for (let i = 0; i < 7; i++) leaf(LF, x + lx, y0 + h, z + lz, (i / 7) * TAU + rnd() * 0.4, 2.1 + rnd() * 0.6, 0.55, 0.55, 1.25, LEAF[1 + (i % 3)]);
    if (collide) solid(x, z, 0.22, 'tree');
  }
  function coconut(x, z, h, collide) {
    const y0 = gy(x, z) - 0.05, lx = (rnd() - 0.5) * 2, lz = (rnd() - 0.5) * 2, f = fr(FR, x, y0, z, 0);
    f.cyl(0, 0, 0, 0.17, 0.13, h * 0.5, 5, 0x8a7a5a, { lx: lx * 0.35, lz: lz * 0.35 });
    f.cyl(lx * 0.35, h * 0.5, lz * 0.35, 0.13, 0.1, h * 0.5, 5, 0x8a7a5a, { lx: lx * 0.65, lz: lz * 0.65 });
    for (let i = 0; i < 9; i++) leaf(LF, x + lx, y0 + h, z + lz, (i / 9) * TAU + rnd() * 0.3, 2.7 + rnd() * 0.6, 0.5, 0.6, 1.4, LEAF[(i % 3) + 1]);
    if (collide) solid(x, z, 0.25, 'tree');
  }
  function banana(x, z, s, near, collide) {
    const y0 = gy(x, z) - 0.05, f = fr(near ? NR : FR, x, y0, z, 0), h = 2.2 * s;
    f.cyl(0, 0, 0, 0.17 * s, 0.12 * s, h, 5, 0xa8b868, { j: 0.05 });
    for (let i = 0; i < 6; i++) leaf(LF, x, y0 + h, z, (i / 6) * TAU + rnd() * 0.5, 1.9 * s, 0.8 * s, 0.35, 0.9, i === 5 ? 0x9aae48 : pick([0x5d9a3a, 0x6aa843, 0x4f8a35]));
    if (collide) solid(x, z, 0.3 * s, 'tree');
  }
  function bamboo(x, z, seed, n, near, collide) {  // khóm tre: thân mảnh nghiêng, lá rủ
    const r = U.rng(seed), y0 = gy(x, z) - 0.05, f = fr(near ? NR : FR, x, y0, z, 0);
    for (let i = 0; i < n; i++) {
      const a = r() * TAU, d = Math.sqrt(r()) * 0.75, sx = Math.cos(a) * d, sz = Math.sin(a) * d, h = 4.8 + r() * 3.4, la = a + (r() - 0.5) * 0.8, lean = (0.25 + r() * 0.5) * h * 0.22;
      const lx = Math.cos(la) * lean, lz = Math.sin(la) * lean, tx = x + sx + lx, tz = z + sz + lz;
      f.cyl(sx, 0, sz, 0.07, 0.04, h, 4, i % 2 ? 0x8aa04a : 0x7a9440, { lx, lz, j: 0.05 });
      for (let k = 0; k < 3; k++) leaf(LF, tx, y0 + h, tz, r() * TAU, 1.5 + r() * 0.6, 0.75, 0.1, 0.9, BAMB[(i + k) % 3]);
      if (h > 6) leaf(LF, x + sx + lx * 0.7, y0 + h * 0.74, z + sz + lz * 0.7, r() * TAU, 1.1, 0.6, 0.05, 0.7, BAMB[(i + 1) % 3]);
    }
    if (collide) solid(x, z, 0.85, 'bamboo');
  }
  function bush(x, z, s, flower, collide) {  // bụi hoa giấy / râm bụt
    const y0 = gy(x, z) - 0.03, f = fr(NR, x, y0, z, 0);
    f.blob(0, 0.5 * s, 0, 0.8 * s, 0.55 * s, 0.75 * s, 0x4c7a35, { hex2: 0x6f9a45 });
    f.blob(0.35 * s, 0.4 * s, 0.25 * s, 0.55 * s, 0.4 * s, 0.5 * s, 0x3f6b30);
    for (let i = 0; i < 5; i++) { const a = i * 1.7 + x, d = 0.4 * s + (i % 2) * 0.2 * s; f.blob(Math.cos(a) * d, (0.75 + (i % 3) * 0.1) * s, Math.sin(a) * d, 0.17 * s, 0.1 * s, 0.17 * s, flower[i % flower.length], { j: 0.05 }); }
    if (collide) solid(x, z, 0.7 * s, 'bush');
  }

  // =====================================================================
  //  NHÀ, ĐÌNH, CHÒI, RƠM
  // =====================================================================
  const WALLS = [0xd6b06c, 0xe3c783, 0xe8dcc0, 0xcfa660, 0xd9b98a], ROOFS = [0xa8432d, 0x9c3a28, 0xb44e32, 0xa04630];
  function gquad(R, c4, hex, lift, j) { upQuad(R, [c4[0][0], gy(c4[0][0], c4[0][1]) + lift, c4[0][1]], [c4[1][0], gy(c4[1][0], c4[1][1]) + lift, c4[1][1]], [c4[2][0], gy(c4[2][0], c4[2][1]) + lift, c4[2][1]], [c4[3][0], gy(c4[3][0], c4[3][1]) + lift, c4[3][1]], hex, j); }
  function house(x, z, yaw, o) {
    const w = o.w, d = o.d, wh = o.wh, cs = Math.cos(yaw), sn = Math.sin(yaw);
    let hmin = 1e9, hmax = -1e9;
    for (const a of [-1, 0, 1]) for (const b of [-1, 0, 1]) { const h = gy(x + ((a * w) / 2) * cs + ((b * d) / 2) * sn, z - ((a * w) / 2) * sn + ((b * d) / 2) * cs); hmin = Math.min(hmin, h); hmax = Math.max(hmax, h); }
    const yb = hmax + 0.3, f = fr(FR, x, 0, z, yaw), eY = yb + wh, hd = d / 2 + 0.55, rh = o.rh, wallH = wh + 0.3;
    f.box(0, (hmin - 0.3 + yb) / 2, 0, w + 0.5, yb - hmin + 0.3, d + 0.5, 0x9a927f, { top: 0xb5ac98 });
    f.box(0, yb + wallH / 2, 0, w, wallH, d, o.wall, { j: 0.04 });
    if (o.curved) {
      addRoof(FU, x, eY + 0.15, z, w + 1.3, d + 1.3, rh, { ry: yaw, curl: 0.3, sag: 0.06, seg: 4, color: o.roof, metal: FU });
    } else if (o.hip) {
      const ex = w / 2 + 0.55, ez = hd, rl = Math.max(0.3, (w - d) / 2), ry = eY + rh;
      f.tri(-ex, eY, ez, ex, eY, ez, rl, ry, 0, o.roof, 0.08); f.tri(-ex, eY, ez, rl, ry, 0, -rl, ry, 0, o.roof, 0.08);
      f.tri(ex, eY, -ez, -ex, eY, -ez, -rl, ry, 0, o.roof, 0.08); f.tri(ex, eY, -ez, -rl, ry, 0, rl, ry, 0, o.roof, 0.08);
      f.tri(ex, eY, ez, ex, eY, -ez, rl, ry, 0, o.roof, 0.08); f.tri(-ex, eY, -ez, -ex, eY, ez, -rl, ry, 0, o.roof, 0.08);
      f.box(0, ry + 0.06, 0, 2 * rl + 0.3, 0.14, 0.24, 0x6e2a1c);
    } else {
      const L = Math.hypot(hd, rh), a = Math.atan2(rh, hd);
      for (const s of [-1, 1]) f.box(0, eY + rh / 2 + 0.04, (s * hd) / 2, w + 1.1, 0.14, L, o.roof, { rx: s * a, bot: true, j: 0.08 });
      f.box(0, eY + rh + 0.1, 0, w + 1.15, 0.16, 0.26, 0x6e2a1c);
      f.tri(w / 2, eY, d / 2, w / 2, eY, -d / 2, w / 2, eY + rh, 0, o.wall); f.tri(-w / 2, eY, -d / 2, -w / 2, eY, d / 2, -w / 2, eY + rh, 0, o.wall);
    }
    f.box(0, yb + 1.0, d / 2 + 0.03, 1.0, 2.0, 0.08, 0x5a2418);
    for (const s of [-1, 1]) {
      const wx = s * w * 0.3, wy = yb + 1.55;
      if (o.lit) { const p = f.P(wx, wy, d / 2 + 0.05); const g = fr(LR, p[0], p[1], p[2], yaw); g.box(0, 0, 0, 0.8, 0.8, 0.05, 0xffc86a, { j: 0.02 }); }
      else f.box(wx, wy, d / 2 + 0.03, 0.85, 0.85, 0.06, 0x3a5a40);
    }
    if (o.lit) { const p = f.P(0, yb + 1.5, d / 2 + 1.2); glow(p[0], p[1], p[2], 2.6, [1.0, 0.66, 0.28], true); }
    if (o.yard) gquad(FR, [f.P(-w / 2 - 0.4, 0, d / 2 + 0.4), f.P(w / 2 + 0.4, 0, d / 2 + 0.4), f.P(w / 2 + 0.4, 0, d / 2 + 4.6), f.P(-w / 2 - 0.4, 0, d / 2 + 4.6)].map((p) => [p[0], p[2]]), 0xbca57a, 0.05, 0.05);
    return { top: eY + rh };
  }
  function dinh(x, z, yaw, s) {  // đình làng: nền cao, tám cột son, mái cong bốn đao
    const y0 = gy(x, z), f = fr(FR, x, y0, z, yaw), w = 11 * s, d = 7.4 * s;
    f.box(0, 0.4, 0, w + 3.2, 0.8, d + 3.2, 0x9a927f, { top: 0xb5ac98 });
    f.box(0, 0.25, d / 2 + 2.3, 5.2, 0.5, 1.5, 0xb5ac98, { top: 0xc2b8a5 });
    f.box(0, 0.12, d / 2 + 3.3, 6.2, 0.24, 1.0, 0xb5ac98);
    for (const cx of [-w / 2 + 0.6, -w / 6, w / 6, w / 2 - 0.6]) for (const cz of [-d / 2 + 0.6, d / 2 - 0.6]) { f.cyl(cx, 0.8, cz, 0.27, 0.3, 4.0, 6, C.wood, { top: true }); f.cyl(cx, 0.8, cz, 0.38, 0.4, 0.3, 6, 0x6a6258); }
    f.box(0, 2.8, -d / 2 + 0.2, w - 0.6, 3.6, 0.3, 0x6a3a22);
    for (const sx of [-1, 1]) f.box(sx * (w / 2 - 0.3), 2.8, 0, 0.3, 3.6, d - 0.4, 0x6a3a22);
    f.box(0, 2.6, d / 2 - 0.5, w / 3, 3.4, 0.14, 0x5a2418); f.box(0, 4.65, d / 2 - 0.5, w - 0.6, 0.35, 0.4, C.woodD);
    addRoof(FU, x, y0 + 4.9, z, w + 3.6, d + 3.2, 2.7 * s, { ry: yaw, curl: 0.9, sag: 0.1, seg: 8, pearl: true, metal: FU });
    for (const sx of [-1, 1]) { const p = f.P(sx * 1.6, 3.3, d / 2 + 0.2); glow(p[0], p[1], p[2], 2.4, [1.0, 0.7, 0.3], true); }
  }
  function hay(x, z, s) {  // đống rơm
    const y0 = gy(x, z) - 0.05, f = fr(FR, x, y0, z, 0);
    f.cyl(0, 0, 0, 0.9 * s, 0.75 * s, 0.9 * s, 7, 0xcfae5a); f.cyl(0, 0.9 * s, 0, 0.75 * s, 0, 1.2 * s, 7, 0xd9b866);
  }
  function hut(x, z, yaw) {  // chòi canh ruộng trên bốn cột, mái rạ
    const y0 = gy(x, z), f = fr(FR, x, y0, z, yaw);
    for (const a of [-0.9, 0.9]) for (const b of [-0.9, 0.9]) f.box(a, 0.8, b, 0.12, 1.7, 0.12, 0x6a4a2e);
    f.box(0, 1.65, 0, 2.2, 0.12, 2.2, 0x8a6238, { bot: true }); f.cyl(0, 1.7, 0, 1.75, 0, 1.2, 4, 0xb89c5a, { bot: true, lx: 0 });
    f.box(0, 0.7, 1.15, 0.08, 1.5, 0.5, 0x6a4a2e, { rx: -0.35 });
  }
  function scarecrow(x, z, yaw) {  // bù nhìn giữ lúa
    const y0 = gy(x, z) + 0.4, f = fr(FR, x, y0, z, yaw);
    f.box(0, 0.7, 0, 0.06, 1.5, 0.06, 0x6a4a2e); f.box(0, 1.05, 0, 1.1, 0.06, 0.06, 0x6a4a2e); f.box(0, 0.95, 0, 0.42, 0.55, 0.14, 0x4a6a8a);
    f.blob(0, 1.62, 0, 0.13, 0.15, 0.13, 0xe0b48a); f.cyl(0, 1.66, 0, 0.34, 0, 0.16, 8, 0xdcc080);
  }
  function egret(x, z, yaw, y) {  // cò trắng đứng
    const y0 = y ?? gy(x, z) + 0.2, f = fr(FR, x, y0, z, yaw);
    f.box(-0.05, 0.4, 0, 0.05, 0.4, 0.04, 0x3a342c); f.box(0.05, 0.4, 0, 0.05, 0.4, 0.04, 0x3a342c);
    f.blob(0, 0.9, 0, 0.14, 0.14, 0.3, 0xf2efe6); f.box(0, 1.2, 0.2, 0.05, 0.4, 0.05, 0xf2efe6, { rx: -0.35 });
    f.blob(0, 1.4, 0.3, 0.06, 0.06, 0.08, 0xf2efe6); f.cyl(0, 1.4, 0.38, 0.025, 0, 0.2, 4, 0xe0b030, { lz: 0 });
  }

  function buffalo(x, z, yaw) {  // con trâu gặm cỏ
    const y0 = gy(x, z), f = fr(FR, x, y0, z, yaw);
    f.blob(0, 1.0, 0, 0.5, 0.42, 0.95, 0x4a4642, { hex2: 0x5a5650 });
    f.blob(0, 0.95, 1.0, 0.27, 0.26, 0.4, 0x3e3a36); f.blob(0, 0.78, 1.38, 0.17, 0.16, 0.2, 0x5a524a);
    for (const s of [-1, 1]) { f.cyl(s * 0.34, 0.9, 1.05, 0.05, 0, 0.5, 4, 0xd8d0c0, { lx: s * 0.45, lz: -0.1 }); for (const q of [-0.62, 0.62]) f.box(s * 0.28, 0.4, q, 0.13, 0.8, 0.13, 0x3a3632); }
    f.box(0, 0.95, -1.02, 0.05, 0.6, 0.05, 0x3a3632, { rx: 0.2 });
  }
  // =====================================================================
  //  SÔNG: dải nước + bờ đê thấp, cầu cong, bến thuyền
  // =====================================================================
  const RIVER = [];  // mẫu dọc dòng: {x,z,nx,nz,hw,lv}
  const EXC = [];    // vùng cấm dựng ruộng: hình tròn {x,z,r}
  safe('sông', () => {
    const CP = [[205, -160], [150, -140], [100, -136], [50, -140], [0, -144], [-42, -148], [-78, -128], [-76, -70], [-68, -30], [-74, 8], [-70, 40], [-76, 76], [-92, 110], [-112, 140]];
    const dense = [];
    for (let i = 0; i < CP.length - 1; i++) {
      const p0 = CP[Math.max(0, i - 1)], p1 = CP[i], p2 = CP[i + 1], p3 = CP[Math.min(CP.length - 1, i + 2)];
      for (let k = 0; k < 16; k++) {
        const u = k / 16, u2 = u * u, u3 = u2 * u;
        dense.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3)]);
      }
    }
    // lấy mẫu đều mỗi 5 m, thêm uốn lượn nhẹ
    const raw = [dense[0]]; let acc = 0;
    for (let i = 1; i < dense.length; i++) { const d = Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]); acc += d; if (acc >= 5) { raw.push(dense[i]); acc = 0; } }
    for (let i = 0; i < raw.length; i++) {
      const a = raw[Math.max(0, i - 1)], b = raw[Math.min(raw.length - 1, i + 1)], tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz) || 1, nx = -tz / l, nz = tx / l;
      const mo = 2.2 * Math.sin(i * 0.31) + 1.0 * Math.sin(i * 0.83 + 1);
      const x = raw[i][0] + nx * mo, z = raw[i][1] + nz * mo;
      if (Math.hypot(x, z + 20) > 175) continue;
      RIVER.push({ x, z, nx, nz, hw: 3.7 + 0.8 * Math.sin(i * 0.27 + 0.5), lv: 0 });
    }
    // mực nước: cao hơn mặt đất quanh đó, mượt dọc dòng
    const n = RIVER.length;
    for (const s of RIVER) { let m = -9; for (const k of [-1, 0, 1]) for (const e of [0, 0.7, 1.4]) m = Math.max(m, gy(s.x + s.nx * (s.hw + e) * k, s.z + s.nz * (s.hw + e) * k)); s.lv = m + 0.1; }
    for (let pass = 0; pass < 2; pass++) {
      const t = RIVER.map((s) => s.lv);
      for (let i = 0; i < n; i++) { let a = 0, c = 0; for (let k = -4; k <= 4; k++) { const j = i + k; if (j >= 0 && j < n) { a += t[j]; c++; } } RIVER[i].lv = Math.max(a / c, t[i] - 0.02 * pass); }
    }
    for (const s of RIVER) s.lv = Math.max(s.lv, gy(s.x, s.z) + 0.08);
    for (let i = 0; i < n - 1; i++) {
      const a = RIVER[i], b = RIVER[i + 1];
      const L0 = [a.x + a.nx * a.hw, a.z + a.nz * a.hw], R0 = [a.x - a.nx * a.hw, a.z - a.nz * a.hw], L1 = [b.x + b.nx * b.hw, b.z + b.nz * b.hw], R1 = [b.x - b.nx * b.hw, b.z - b.nz * b.hw];
      upQuad(WR, [L0[0], a.lv, L0[1]], [R0[0], a.lv, R0[1]], [R1[0], b.lv, R1[1]], [L1[0], b.lv, L1[1]], 0xffffff, 0.05);
      for (const sd of [1, -1]) {
        const e0 = [a.x + sd * a.nx * a.hw, a.z + sd * a.nz * a.hw], e1 = [b.x + sd * b.nx * b.hw, b.z + sd * b.nz * b.hw];
        const c0 = [a.x + sd * a.nx * (a.hw + 0.9), a.z + sd * a.nz * (a.hw + 0.9)], c1 = [b.x + sd * b.nx * (b.hw + 0.9), b.z + sd * b.nz * (b.hw + 0.9)];
        const f0 = [a.x + sd * a.nx * (a.hw + 3.3), a.z + sd * a.nz * (a.hw + 3.3)], f1 = [b.x + sd * b.nx * (b.hw + 3.3), b.z + sd * b.nz * (b.hw + 3.3)];
        upQuad(FR, [e0[0], a.lv - 0.03, e0[1]], [c0[0], a.lv + 0.26, c0[1]], [c1[0], b.lv + 0.26, c1[1]], [e1[0], b.lv - 0.03, e1[1]], 0x7a6a48, 0.06);
        upQuad(FR, [c0[0], a.lv + 0.26, c0[1]], [f0[0], gy(f0[0], f0[1]) - 0.02, f0[1]], [f1[0], gy(f1[0], f1[1]) - 0.02, f1[1]], [c1[0], b.lv + 0.26, c1[1]], i % 2 ? 0x62903c : 0x6f9a45, 0.07);
      }
      if (i % 4 === 0) EXC.push({ x: a.x, z: a.z, r: a.hw + 6.5 });
      if (i % 3 === 0) EXC.push({ x: (a.x + b.x) / 2, z: (a.z + b.z) / 2, r: a.hw + 6.5 });
    }
    // lau sậy ven bờ
    for (let i = 3; i < n - 2; i += 4) {
      const s = RIVER[i], sd = rnd() < 0.5 ? 1 : -1, bx = s.x + sd * s.nx * (s.hw + 1.1), bz = s.z + sd * s.nz * (s.hw + 1.1), by = s.lv + 0.2;
      if (Math.hypot(bx, bz + 20) > 150) continue;
      for (let k = 0; k < 5; k++) leaf(LF, bx + rr(-0.5, 0.5), by, bz + rr(-0.5, 0.5), rnd() * TAU, 1.1 + rnd() * 0.5, 0.22, 0.9, 0.25, pick([0x7aa04a, 0x8aaa4e, 0x6f9a3f]));
    }
  });
  const riverDist = (x, z) => { let m = 1e9; for (const s of RIVER) { const d = Math.hypot(s.x - x, s.z - z) - s.hw; if (d < m) m = d; } return m; };

  // cầu cong bắc qua sông, ở đoạn phía tây chùa gần z = 22
  const BRIDGE = { x: 0, z: 0, yaw: 0 };
  safe('cầu', () => {
    let bi = -1, bd = 1e9;
    for (let i = 0; i < RIVER.length; i++) { const d = Math.abs(RIVER[i].z - 22) + Math.abs(RIVER[i].x + 72) * 0.2; if (RIVER[i].x < -40 && d < bd) { bd = d; bi = i; } }
    if (bi < 0) return;
    const s = RIVER[bi], yaw = Math.atan2(s.nx, s.nz), f = fr(FR, s.x, 0, s.z, yaw);   // trục cầu dọc theo pháp tuyến dòng sông (local +z)
    BRIDGE.x = s.x; BRIDGE.z = s.z; BRIDGE.yaw = yaw;
    const hw = s.hw, half = hw + 3.4, yb = s.lv + 0.2, rise = 1.7, span = hw + 0.7, N = 14;
    const deckY = (z) => yb + 0.15 + rise * Math.max(0, 1 - (z / half) * (z / half));
    const soffit = (z) => (Math.abs(z) < span ? s.lv + 0.3 + (deckY(0) - s.lv - 0.9) * (1 - (z / span) * (z / span)) : s.lv - 0.3);
    for (let i = 0; i < N; i++) {
      const z0 = -half + (2 * half * i) / N, z1 = -half + (2 * half * (i + 1)) / N, zm = (z0 + z1) / 2, y0 = deckY(z0), y1 = deckY(z1), ym = (y0 + y1) / 2, a = -Math.atan2(y1 - y0, z1 - z0), L = Math.hypot(z1 - z0, y1 - y0);
      f.box(0, ym - 0.08, zm, 2.5, 0.16, L + 0.02, 0xb5ac98, { rx: a, bot: true, top: 0xd2bd9c });
      for (const sx of [-1.2, 1.2]) {
        f.box(sx, ym + 0.28, zm, 0.2, 0.46, L + 0.02, 0xa89d8b, { rx: a, top: 0xc2b8a5 });
        const top = ym - 0.16, bot = soffit(zm);
        if (top > bot + 0.05) f.box(sx, (top + bot) / 2, zm, 0.26, top - bot, (z1 - z0) + 0.02, 0x9b9282);
      }
    }
    for (const sz of [-half, half]) for (const sx of [-1.3, 1.3]) { f.box(sx, yb + 0.5, sz, 0.34, 1.0, 0.34, 0xa89d8b, { top: 0xc2b8a5 }); f.box(sx, yb + 1.1, sz, 0.44, 0.14, 0.44, 0xc2b8a5); }
    for (const sz of [-half - 0.6, half + 0.6]) { const p = f.P(1.3, yb + 1.5, sz); BD.lanternInto(FU, LU, p[0], p[1], p[2], 0.9); }
    EXC.push({ x: s.x, z: s.z, r: half + 7 });
    W.fireflyAreas.push({ x: s.x, z: s.z, r: 7 });
    // bến thuyền nhỏ bên bờ
    BRIDGE.hw = hw;
    const jz = -(hw + 0.4), jx = -7.5;
    for (const a of [-0.65, 0.65]) for (const b of [-1.6, 1.6]) f.box(jx + a, s.lv + 0.3, jz + b, 0.12, 1.1, 0.12, 0x5e3f24);
    f.box(jx, s.lv + 0.88, jz, 1.7, 0.1, 4.0, 0x8a6238, { bot: true });
    { const p = f.P(jx + 0.65, s.lv + 1.55, jz + 1.6); BD.lanternInto(FU, LU, p[0], p[1], p[2], 0.8); f.box(jx + 0.65, s.lv + 1.0, jz + 1.6, 0.08, 1.0, 0.08, 0x5e3f24); }
  });

  // =====================================================================
  //  ĐƯỜNG LÀNG, XÓM LÀNG
  // =====================================================================
  const ROADS = [
    { w: 2.6, pts: [[-96, 24], [-84, 25], [-72, 26], [-60, 34], [-52, 52], [-42, 70], [-26, 84], [-12, 91], [-2, 94]] },
    { w: 2.6, pts: [[60, 48], [54, 62], [44, 76], [30, 87], [14, 93], [2, 96]] },
  ];
  const roadDist = (x, z, roads) => { let m = 1e9; for (const r of roads) for (let i = 0; i < r.pts.length - 1; i++) m = Math.min(m, Math.sqrt(segD2(x, z, r.pts[i][0], r.pts[i][1], r.pts[i + 1][0], r.pts[i + 1][1])) - r.w / 2); return m; };
  function laneStrip(R, pts, w, hex, lift) {
    for (let i = 0; i < pts.length - 1; i++) {
      const dx = pts[i + 1][0] - pts[i][0], dz = pts[i + 1][1] - pts[i][1], L = Math.hypot(dx, dz), n = Math.max(1, Math.ceil(L / 4));
      const nx = -dz / L, nz = dx / L;
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n, x0 = pts[i][0] + dx * t0, z0 = pts[i][1] + dz * t0, x1 = pts[i][0] + dx * t1, z1 = pts[i][1] + dz * t1;
        gquad(R, [[x0 + nx * w / 2, z0 + nz * w / 2], [x0 - nx * w / 2, z0 - nz * w / 2], [x1 - nx * w / 2, z1 - nz * w / 2], [x1 + nx * w / 2, z1 + nz * w / 2]], hex, lift, 0.05);
      }
    }
  }
  safe('đường', () => { for (const r of ROADS) { laneStrip(FR, r.pts, r.w, 0xb89a68, 0.05); for (let i = 0; i < r.pts.length - 1; i++) for (let t = 0; t < 1; t += 0.25) EXC.push({ x: r.pts[i][0] + (r.pts[i + 1][0] - r.pts[i][0]) * t, z: r.pts[i][1] + (r.pts[i + 1][1] - r.pts[i][1]) * t, r: r.w / 2 + 2.2 }); } });

  const VILL = [
    { x: 86, z: 56, r: 25, n: 11, dinh: { x: 63, z: 44, s: 1.0 } },
    { x: -108, z: 24, r: 24, n: 9, gate: { x: -94, z: 24.4, yaw: PI / 2 } },
    { x: 70, z: -86, r: 20, n: 7, dinh: { x: 52, z: -78, s: 0.85 } },
  ];
  safe('xóm làng', () => {
    for (const v of VILL) {
      EXC.push({ x: v.x, z: v.z, r: v.r + 3 });
      const lanes = [{ w: 2.2, pts: [[v.x - v.r, v.z], [v.x + v.r, v.z + 1.5]] }, { w: 2, pts: [[v.x + 2, v.z - v.r * 0.8], [v.x - 1, v.z + v.r * 0.8]] }];
      for (const l of lanes) laneStrip(FR, l.pts, l.w, 0xb89a68, 0.05);
      const sites = [];
      for (let t = 0; t < 600 && sites.length < v.n; t++) {
        const a = rnd() * TAU, d = Math.sqrt(rnd()) * (v.r - 5), x = v.x + Math.cos(a) * d, z = v.z + Math.sin(a) * d;
        if (sites.some((q) => Math.hypot(q.x - x, q.z - z) < 10.5)) continue;
        if (v.dinh && Math.hypot(x - v.dinh.x, z - v.dinh.z) < 12) continue;
        if (roadDist(x, z, lanes) < 5 || roadDist(x, z, ROADS) < 5.5 || riverDist(x, z) < 11) continue;
        sites.push({ x, z });
      }
      let first = true;
      for (const s of sites) {
        const side = rnd() < 0.72 ? 0 : rnd() < 0.5 ? PI / 2 : -PI / 2, yaw = side + rr(-0.12, 0.12);
        const w = rr(5.8, 8), d = rr(4.4, 5.4);
        const hh = house(s.x, s.z, yaw, { w: first ? 8 : w, d: first ? 5.6 : d, wh: rr(2.5, 2.9), rh: first ? 1.6 : rr(1.4, 1.8), wall: pick(WALLS), roof: pick(ROOFS), hip: rnd() < 0.4, curved: first, lit: first || rnd() < 0.5, yard: rnd() < 0.7 });
        if (first) { (W.smokeSpots = W.smokeSpots || []).push([s.x - Math.sin(yaw) * 0.5, hh.top - 0.2, s.z - Math.cos(yaw) * 0.5]); first = false; }
        const cs = Math.cos(yaw), sn = Math.sin(yaw), at = (lx, lz) => [s.x + lx * cs + lz * sn, s.z - lx * sn + lz * cs];
        if (rnd() < 0.65) { const p = at(w / 2 + 1.6, rr(-0.5, 1.5)); banana(p[0], p[1], rr(0.9, 1.2), false); }
        if (rnd() < 0.55) { const p = at(-w / 2 - 1.6, rr(-1, 1.5)); areca(p[0], p[1], rr(7, 10), false); }
        if (rnd() < 0.5) { const p = at(rr(-2, 2), d / 2 + 5.3); areca(p[0], p[1], rr(6.5, 9), false); }
        if (rnd() < 0.35) { const p = at(w / 2 + 2.6, -d / 2); hay(p[0], p[1], rr(0.8, 1.1)); }
        if (rnd() < 0.4) { const p = at(rr(-3, 3), -d / 2 - 2.2); domeTree(p[0], p[1], rr(0.9, 1.2), (rnd() * 1e6) | 0, false); }
        if (rnd() < 0.2) { const p = at(-w / 2 - 2.0, d / 2 + 1.5); coconut(p[0], p[1], rr(8, 10)); }
      }
      if (v.dinh) dinh(v.dinh.x, v.dinh.z, U.yawTo(v.dinh.x, v.dinh.z, 0, 40), v.dinh.s);
      if (v.gate) {  // cổng làng
        const g = v.gate, f = fr(FR, g.x, gy(g.x, g.z), g.z, g.yaw);
        for (const sx of [-2.2, 2.2]) { f.box(sx, 1.9, 0, 0.7, 3.8, 0.7, 0xd6b06c, { top: C.ridge }); f.box(sx, 4.0, 0, 0.95, 0.25, 0.95, C.ridge); f.blob(sx, 4.45, 0, 0.32, 0.45, 0.32, 0xd6b06c); }
        f.box(0, 3.4, 0, 4.4, 0.45, 0.5, 0x8e2a22); f.box(0, 3.95, 0, 3.4, 0.3, 0.6, 0xa8432d, { bot: true });
        EXC.push({ x: g.x, z: g.z, r: 5 });
      }
      // vườn: ao làng nhỏ có sen
      for (let tr = 0; tr < 60; tr++) {
        const pa = rnd() * TAU, pr = rr(0.45, 0.85) * v.r, px = v.x + Math.cos(pa) * pr, pz = v.z + Math.sin(pa) * pr;
        if (riverDist(px, pz) > 14 && roadDist(px, pz, ROADS) > 8 && roadDist(px, pz, lanes) > 7 && !sites.some((q) => Math.hypot(q.x - px, q.z - pz) < 8.5)) {
          let lvl = -9; for (let k = 0; k < 12; k++) lvl = Math.max(lvl, gy(px + Math.cos(k / 12 * TAU) * 6, pz + Math.sin(k / 12 * TAU) * 4.5));
          for (let k = 0; k < 12; k++) {
            const a0 = (k / 12) * TAU, a1 = ((k + 1) / 12) * TAU;
            upTri(WR, [px, lvl + 0.1, pz], [px + Math.cos(a0) * 4.6, lvl + 0.1, pz + Math.sin(a0) * 3.4], [px + Math.cos(a1) * 4.6, lvl + 0.1, pz + Math.sin(a1) * 3.4], 0xe8f0f8, 0.05);
            upQuad(FR, [px + Math.cos(a0) * 4.5, lvl + 0.1, pz + Math.sin(a0) * 3.35], [px + Math.cos(a0) * 6.2, lvl + 0.02, pz + Math.sin(a0) * 4.7], [px + Math.cos(a1) * 6.2, lvl + 0.02, pz + Math.sin(a1) * 4.7], [px + Math.cos(a1) * 4.5, lvl + 0.1, pz + Math.sin(a1) * 3.35], 0x8a7448, 0.06);
            if (k % 2 === 0) { const lx = px + Math.cos(a0 + 0.3) * rr(1, 3), lz = pz + Math.sin(a0 + 0.3) * rr(0.8, 2.3); const F = fr(FR, lx, lvl + 0.13, lz, rnd() * 6); F.cyl(0, 0, 0, 0.42, 0.42, 0.02, 6, 0x4f8a3c, { top: true }); if (k % 4 === 0) F.cyl(0.1, 0.02, 0, 0.1, 0, 0.18, 5, 0xf29bb5); }
          }
          EXC.push({ x: px, z: pz, r: 8 });
          break;
        }
      }
      // trâu gặm cỏ ngoài rìa xóm
      for (let b = 0, got = 0; b < 14 && got < 2; b++) {
        const a = rnd() * TAU, d = rr(0.7, 0.95) * v.r, x = v.x + Math.cos(a) * d, z = v.z + Math.sin(a) * d;
        if (sites.some((q) => Math.hypot(q.x - x, q.z - z) < 7) || roadDist(x, z, lanes) < 3.5 || roadDist(x, z, ROADS) < 4 || riverDist(x, z) < 10) continue;
        buffalo(x, z, rnd() * TAU); got++;
      }
      // luỹ tre làng: vòng khóm tre quanh xóm, chừa lối vào theo đường
      const cnt = Math.ceil((TAU * v.r) / 10.5);
      for (let i = 0; i < cnt; i++) {
        const a = (i / cnt) * TAU + rr(-0.08, 0.08), rad = v.r + rr(-1.5, 2), x = v.x + Math.cos(a) * rad, z = v.z + Math.sin(a) * rad;
        if (roadDist(x, z, ROADS) < 4.5 || riverDist(x, z) < 8) continue;
        bamboo(x, z, 700 + i * 13 + ((v.x + 300) | 0), 5, false);
      }
      for (let i = 0; i < 5; i++) { const a = rnd() * TAU, d = rr(0.6, 0.95) * v.r, x = v.x + Math.cos(a) * d, z = v.z + Math.sin(a) * d; if (sites.every((q) => Math.hypot(q.x - x, q.z - z) > 6) && roadDist(x, z, lanes) > 3.5) { rnd() < 0.5 ? domeTree(x, z, rr(1.1, 1.6), (rnd() * 1e6) | 0, false) : banana(x, z, 1, false); } }
    }
  });

  // =====================================================================
  //  LỐI VÀO CHÙA: hàng hương hoa, cây đa cổ thụ, miếu nhỏ, xe đạp chở hoa, bụi hoa
  // =====================================================================
  const AWN = [[0xc8302a, 0xe6b43a], [0x2f6aa0, 0xf3e3c3], [0x3f7a4a, 0xe6b43a], [0xb0412a, 0xf3e3c3], [0xd89a2a, 0x8e2a22]];
  const CLOTH = [0xf3e3c3, 0xa8281f, 0xf3e3c3, 0x2f6aa0];
  function stall(x, z, side, kind, k) {
    const y0 = Math.max(0, gy(x, z)), yaw = side > 0 ? -PI / 2 : PI / 2, f = fr(NR, x, y0, z, yaw), pal = AWN[k % AWN.length], woodD = 0x5e3f24, top = 0.8;
    const para = kind === 'hoa' && k % 2 === 1;  // quầy hoa che dù lớn thay vì mái bạt
    if (para) {
      f.cyl(0, 0, 0.15, 0.045, 0.04, 2.7, 5, woodD);
      for (let i = 0; i < 8; i++) { const a0 = (i / 8) * TAU, a1 = ((i + 1) / 8) * TAU, c = pal[i % 2]; f.tri(0, 2.95, 0.15, Math.cos(a1) * 1.55, 2.3, 0.15 + Math.sin(a1) * 1.55, Math.cos(a0) * 1.55, 2.3, 0.15 + Math.sin(a0) * 1.55, c, 0.03); f.tri(0, 2.5, 0.15, Math.cos(a0) * 1.55, 2.3, 0.15 + Math.sin(a0) * 1.55, Math.cos(a1) * 1.55, 2.3, 0.15 + Math.sin(a1) * 1.55, 0x6a4a2e, 0.03); }
    } else {
      for (const sx of [-1.15, 1.15]) { f.box(sx, 1.0, 0.75, 0.07, 2.0, 0.07, woodD); f.box(sx, 1.2, -0.85, 0.07, 2.4, 0.07, woodD); }
      for (let i = 0; i < 4; i++) f.box(-1.05 + i * 0.7, 2.22, 0.1, 0.7, 0.035, 2.5, pal[i % 2], { rx: 0.15, bot: true, j: 0.03 });
      f.box(0, 1.92, 1.36, 2.85, 0.16, 0.03, pal[0]);
      f.box(0, 1.05, -0.95, 2.4, 1.6, 0.05, [0xb89a5e, 0x9a7a4a, 0xc2a468, 0xa8784a][k % 4]);
    }
    f.box(0, 0.4, 0.4, 2.2, 0.8, 0.7, 0x9a6a3a, { top: CLOTH[k % 4] }); f.box(0, 0.5, 0.76, 2.2, 0.5, 0.02, pal[1]);
    const bucket = (bx, bz, hex, fl, n) => {
      f.cyl(bx, top, bz, 0.14, 0.17, 0.28, 6, hex, { top: true });
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU, q = 0.06 + (i % 2) * 0.04, h = 0.3 + (i % 3) * 0.1;
        f.cyl(bx + Math.cos(a) * q, top + 0.2, bz + Math.sin(a) * q, 0.012, 0.012, h, 3, 0x4f8a35, { lx: Math.cos(a) * 0.05, lz: Math.sin(a) * 0.05 });
        f.cyl(bx + Math.cos(a) * (q + 0.05), top + 0.2 + h, bz + Math.sin(a) * (q + 0.05), 0.07, 0, 0.15, 5, fl[i % fl.length]);
      }
    };
    const tray = (tx, tz) => { f.cyl(tx, top, tz, 0.28, 0.3, 0.05, 8, 0xc8a060, { top: true }); for (let i = 0; i < 6; i++) { const a = i * 1.1; f.blob(tx + Math.cos(a) * 0.12 * (i ? 1 : 0), top + 0.1 + (i > 3 ? 0.06 : 0), tz + Math.sin(a) * 0.12 * (i ? 1 : 0), 0.075, 0.075, 0.075, [0xf39a2a, 0xf5d03a, 0x7cbf4a, 0xd8322a, 0xf39a2a, 0xf5d03a][i], { j: 0.05 }); } };
    if (kind === 'huong') {
      f.cyl(-0.7, top, 0.35, 0.14, 0.13, 0.22, 6, 0x3a64a0, { top: true });
      for (let i = 0; i < 5; i++) { f.cyl(-0.7 + (i - 2) * 0.03, top + 0.15, 0.35, 0.04, 0.05, 0.5, 5, 0x9a3a22, { lx: (i - 2) * 0.03 }); }
      f.cyl(-0.7, top + 0.4, 0.35, 0.062, 0.062, 0.05, 5, 0xe0b030);
      bucket(0.2, 0.4, 0xb8bcc0, [0xf29bb5, 0xfbe4ea], 6); bucket(0.8, 0.4, 0x4a7ab0, [0xf29bb5, 0xf5d03a], 5);
    } else if (kind === 'hoa') {
      bucket(-0.75, 0.4, 0x4a7ab0, [0xf5d03a, 0xf39a2a], 7); bucket(0, 0.4, 0xc84a3a, [0xfff4dc, 0xf6eac4], 7); bucket(0.75, 0.4, 0xb8bcc0, [0xf29bb5, 0xd8407a], 6);
      for (const bx of [-0.55, 0.6]) { f.cyl(bx, 0, 1.15, 0.2, 0.23, 0.4, 6, 0x4a7ab0, { top: true }); for (let i = 0; i < 5; i++) { const a = i * 1.3; f.cyl(bx + Math.cos(a) * 0.1, 0.4, 1.15 + Math.sin(a) * 0.1, 0.014, 0.014, 0.55, 3, 0x4f8a35, { lx: Math.cos(a) * 0.08 }); f.cyl(bx + Math.cos(a) * 0.18, 0.95, 1.15 + Math.sin(a) * 0.18, 0.08, 0, 0.16, 5, [0xf29bb5, 0xfbe4ea, 0xf5d03a][i % 3]); } }
    } else if (kind === 'qua') {
      tray(-0.6, 0.4); tray(0.4, 0.4); f.cyl(0.95, top, 0.35, 0.16, 0.2, 0.18, 6, 0xc8a060, { top: true }); f.blob(0.95, top + 0.2, 0.35, 0.14, 0.1, 0.14, 0x7cbf4a);
    } else {  // hàng nước chè
      f.blob(-0.6, top + 0.17, 0.4, 0.17, 0.15, 0.17, 0x6a7a8a, { hex2: 0x8a9aaa }); f.cyl(-0.45, top + 0.12, 0.4, 0.03, 0.02, 0.2, 4, 0x6a7a8a, { lx: 0.1 });
      for (let i = 0; i < 3; i++) f.cyl(0.1 + i * 0.22, top, 0.4, 0.045, 0.05, 0.1, 5, 0xe8e4d8);
      for (const sx of [-0.4, 0.5]) f.cyl(sx, 0, 1.2, 0.17, 0.19, 0.3, 6, 0x2a6a9a, { top: true });
    }
    // người bán ngồi sau quầy, đội nón lá
    const vx = 0.45, vz = -0.35, clothes = [0x7a5236, 0x3a4a5a, 0x5a7a4a, 0x8a4a3a][k % 4];
    f.cyl(vx, 0, vz, 0.2, 0.17, 0.32, 6, 0x5e3f24); f.cyl(vx, 0.32, vz, 0.25, 0.17, 0.52, 6, clothes, { top: true });
    f.blob(vx, 0.98, vz, 0.15, 0.17, 0.15, 0xe0b48a, { j: 0.04 }); f.cyl(vx, 1.04, vz, 0.38, 0, 0.18, 8, 0xdcc080);
    if (k % 2 === 0 && !para) { const p = f.P(1.0, 2.0, 1.25); BD.hangLanternInto(NU, LU, p[0], p[1], p[2], 0.28, 0.9); }
    const x0 = side > 0 ? x - 1.4 : x - 0.95, x1 = side > 0 ? x + 0.95 : x + 1.4;
    col.box(x0, z - 1.3, x1, z + 1.3, 'stall');
    return [x0, x1];
  }
  function bike(x, z, yaw, flowers) {  // xe đạp chở hoa (dọc theo lối)
    const y0 = Math.max(0, gy(x, z)), f = fr(NR, x, y0, z, yaw);
    for (const cx of [-0.45, 0.45]) for (let i = 0; i < 8; i++) {
      const a0 = (i / 8) * TAU, a1 = ((i + 1) / 8) * TAU, p = (a, r, zz) => [cx + Math.cos(a) * r, 0.34 + Math.sin(a) * r, zz];
      f.quad(p(a0, 0.29, 0.02), p(a0, 0.35, 0.02), p(a1, 0.35, 0.02), p(a1, 0.29, 0.02), 0x2a2622, 0.02); f.quad(p(a0, 0.29, -0.02), p(a1, 0.29, -0.02), p(a1, 0.35, -0.02), p(a0, 0.35, -0.02), 0x2a2622, 0.02);
    }
    f.box(-0.02, 0.8, 0, 0.74, 0.035, 0.035, 0xb8281f); f.box(0.15, 0.58, 0, 0.62, 0.035, 0.035, 0xb8281f, { rz: -0.62 }); f.box(-0.22, 0.58, 0, 0.62, 0.035, 0.035, 0xb8281f, { rz: 0.9 });
    f.box(0.4, 0.58, 0, 0.5, 0.035, 0.035, 0x2a2622, { rz: 1.35 }); f.box(0.35, 0.88, 0, 0.04, 0.04, 0.5, 0x2a2622); f.box(-0.4, 0.86, 0, 0.22, 0.05, 0.12, 0x2a2622);
    f.box(-0.52, 0.55, 0, 0.36, 0.3, 0.5, 0xb89a5e);
    if (flowers) for (let i = 0; i < 6; i++) f.cyl(-0.52 + ((i % 3) - 1) * 0.1, 0.7, ((i / 3) | 0) * 0.2 - 0.1, 0.09, 0, 0.18, 5, [0xf29bb5, 0xf5d03a, 0xfbe4ea][i % 3]);
    const horiz = Math.abs(Math.sin(yaw)) > 0.7;
    col.box(horiz ? x - 0.3 : x - 0.9, horiz ? z - 0.9 : z - 0.3, horiz ? x + 0.3 : x + 0.9, horiz ? z + 0.9 : z + 0.3, 'bike');
  }
  function banyan(bx, bz) {
    const y0 = gy(bx, bz), f = fr(NR, bx, y0, bz, 0), r = U.rng(4242), bark = 0x7a6450, bark2 = 0x6b5240;
    f.cyl(0, -0.1, 0, 2.1, 1.35, 1.8, 9, bark, { j: 0.06 }); f.cyl(0, 1.6, 0, 1.35, 1.0, 3.6, 9, bark2, { j: 0.06 });
    f.cyl(0, 1.7, 0, 1.43, 1.4, 0.3, 9, 0xb8281f, { j: 0.02 });  // dải lụa đỏ quấn gốc
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.3; f.cyl(Math.cos(a) * 1.25, 0, Math.sin(a) * 1.25, 0.5, 0.28, 3.4 + r() * 0.8, 6, bark, { lx: -Math.cos(a) * 0.5, lz: -Math.sin(a) * 0.5 }); }
    for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU + r() * 0.4, len = 3.2 + r() * 1.4; f.cyl(Math.cos(a) * 0.5, 4.6 + r() * 0.6, Math.sin(a) * 0.5, 0.42, 0.22, 1.5 + r() * 0.7, 6, bark2, { lx: Math.cos(a) * len, lz: Math.sin(a) * len }); }
    for (let i = 0; i < 15; i++) { const a = i * 2.39996 + 0.5, d = Math.sqrt(i / 15) * 4.6, rad = 1.9 + r() * 1.2; f.blob(Math.cos(a) * d, 6.4 + r() * 1.5 - d * 0.1, Math.sin(a) * d, rad, rad * 0.7, rad, LEAF[i % 6], { d1: i < 6, hex2: LEAF_L[i % 3] }); }
    for (let i = 0; i < 18; i++) { const a = r() * TAU, d = 1.3 + r() * 3.2, top = 4.6 + r() * 1.2, b = r() < 0.45 ? 0 : 0.9 + r() * 2.2; f.cyl(Math.cos(a) * d, b, Math.sin(a) * d, 0.04 + r() * 0.03, 0.05, top - b, 4, 0x8a7458, { lx: (r() - 0.5) * 0.2, lz: (r() - 0.5) * 0.2 }); }
    const props = [[-2.2, 1.0], [1.4, 2.0], [1.0, -2.2]];
    for (const [px, pz] of props) { f.cyl(px, 0, pz, 0.3, 0.17, 4.8, 6, bark, { lx: -px * 0.15, lz: -pz * 0.15 }); col.circle(bx + px, bz + pz, 0.5, 'banyan'); }
    for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU + 0.6; f.blob(Math.cos(a) * 2.5, 0.12, Math.sin(a) * 2.5, 1.5, 0.22, 0.36, bark, { ry: -a }); }
    // bàn thờ nhỏ dưới gốc đa, quay về phía lối vào
    f.box(-2.7, 0.2, -0.6, 0.9, 0.4, 0.7, 0xa89d8b, { top: 0xc2b8a5 }); f.box(-2.7, 0.7, -0.6, 0.62, 0.6, 0.42, 0x7a2418); f.cyl(-2.7, 1.0, -0.6, 0.45, 0, 0.3, 4, 0x6e2a1c, { bot: true });
    f.cyl(-2.45, 0.4, -0.2, 0.1, 0.08, 0.1, 6, C.bronze, { top: true }); for (let i = 0; i < 3; i++) f.box(-2.45 + (i - 1) * 0.03, 0.62, -0.2, 0.012, 0.3, 0.012, 0x7a2a1a);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.2; f.box(Math.cos(a) * 1.2, 3.0, Math.sin(a) * 1.2, 0.09, 0.9, 0.02, 0xc8302a, { ry: a }); }
    col.circle(bx, bz, 2.0, 'banyan'); col.box(bx - 3.25, bz - 1.05, bx - 2.15, bz - 0.15, 'banyan');
    if (G.cam && G.cam.blockers) G.cam.blockers.push(new THREE.Box3(new THREE.Vector3(bx - 1.7, y0, bz - 1.7), new THREE.Vector3(bx + 1.7, y0 + 4.5, bz + 1.7)));
    EXC.push({ x: bx, z: bz, r: 6.8 });
    W.fireflyAreas.push({ x: bx, z: bz, r: 5 });
  }
  function shrine(sx, sz, yaw) {  // miếu nhỏ ven đường: nền đá, ba mặt tường, mái cong, bàn thờ
    const y0 = Math.max(0, gy(sx, sz)), f = fr(NR, sx, y0, sz, yaw);
    f.box(0, 0.18, 0, 4.2, 0.36, 4.0, 0xa89d8b, { top: 0xc2b8a5 }); f.box(0, 0.12, 2.35, 2.4, 0.24, 0.7, 0xc2b8a5);
    f.box(0, 1.61, -1.55, 3.4, 2.5, 0.25, C.ochre); for (const s of [-1, 1]) f.box(s * 1.55, 1.61, -0.1, 0.25, 2.5, 3.0, C.ochre);
    for (const s of [-1.4, 1.4]) f.cyl(s, 0.36, 1.45, 0.12, 0.12, 2.5, 6, C.wood, { top: true });
    f.box(0, 2.9, 1.45, 3.1, 0.2, 0.2, C.woodD);
    addRoof(NU, sx, y0 + 3.0, sz, 4.6, 4.4, 1.25, { ry: yaw, curl: 0.42, seg: 6, metal: NU, finial: true });
    f.box(0, 0.75, -1.15, 1.5, 0.78, 0.5, 0x7a2418); f.box(0, 1.15, -1.15, 1.56, 0.06, 0.56, C.gold);
    f.box(0, 1.9, -1.4, 0.55, 1.0, 0.06, 0x8e1f18); f.box(0, 1.9, -1.37, 0.62, 1.08, 0.03, C.gold);
    f.cyl(0, 1.18, -1.15, 0.2, 0.24, 0.16, 8, C.bronze, { top: true });
    for (const s of [-0.55, 0.55]) { f.cyl(s, 1.18, -1.15, 0.04, 0.045, 0.3, 5, C.cream); const p = f.P(s, 1.55, -1.15); glow(p[0], p[1], p[2], 0.55, [1.0, 0.7, 0.3], false); }
    f.cyl(-1.05, 1.18, -1.1, 0.22, 0.26, 0.05, 8, 0xc8a060, { top: true }); for (let i = 0; i < 3; i++) f.blob(-1.05 + (i - 1) * 0.1, 1.31, -1.1 + (i % 2) * 0.06, 0.08, 0.08, 0.08, [0xf39a2a, 0xf5d03a, 0xd8322a][i]);
    f.box(0, 0.5, 3.4, 0.55, 0.3, 0.55, 0x8a8070); f.cyl(0, 0.65, 3.4, 0.25, 0.2, 0.22, 8, C.bronze, { top: true });
    for (let i = 0; i < 4; i++) f.box(0 + (i - 1.5) * 0.06, 1.0, 3.4, 0.015, 0.3, 0.015, 0x7a2a1a);
    const sp = f.P(0, 1.2, 3.4); (W.smokeSpots = W.smokeSpots || []).push([sp[0], sp[1], sp[2]]); glow(sp[0], sp[1] - 0.1, sp[2], 0.3, [1, 0.35, 0.1], false);
    const lp = f.P(0, 2.85, 1.45); BD.hangLanternInto(NU, LU, lp[0], lp[1], lp[2], 0.3, 0.9);
    // nền 4.2 × 4.0, bậc ra phía trước (+z cục bộ → +x thế giới khi yaw = π/2)
    col.box(sx - 2.0, sz - 2.1, sx + 2.8, sz + 2.1, 'shrine');
    EXC.push({ x: sx, z: sz, r: 7 });
  }

  safe('lối vào', () => {
    // cây đa cổ thụ phía đông, miếu nhỏ phía tây, ở đầu lối vào (nơi khách đến, z ≈ 63)
    for (const [x, z] of [[10.8, 63.5], [11.2, 61.5], [11.5, 66], [12, 59]]) if (canPlace(x, z, 2.4) && !nearOld(x, z, 6)) { banyan(x, z); break; }
    for (const [x, z, yaw] of [[-8.4, 63.2, PI / 2], [-8.8, 60.5, PI / 2], [-9, 66, PI / 2]]) if (rectOK(x - 2.4, z - 2.4, x + 3.2, z + 2.4, 0.3) && !nearOld(x, z, 3)) { shrine(x, z, yaw); break; }
    // hàng hương hoa hai bên lối, lùi ra sau để lối 4.2 m luôn thông
    const kinds = ['huong', 'hoa', 'qua', 'huong', 'nuoc', 'hoa', 'huong', 'qua', 'hoa', 'nuoc'];
    let ki = 0;
    for (const side of [1, -1]) {
      let last = -99;
      for (let z = side > 0 ? 36.4 : 36.0; z < 59; z += 0.5) {
        if (z - last < (side > 0 ? 5.7 : 5.9)) continue;
        const x = side * 6.5, x0 = side > 0 ? x - 1.4 : x - 0.95, x1 = side > 0 ? x + 0.95 : x + 1.4;
        if (!rectOK(x0, z - 1.3, x1, z + 1.3, 0.25) || nearOld(x, z, 2.0)) continue;
        stall(x, z, side, kinds[ki % kinds.length], ki); ki++; last = z;
      }
    }
    // xe đạp chở hoa và bụi hoa dọc sân
    for (const [x, z, yaw] of [[4.1, 49.5, PI / 2], [-4.1, 44.0, PI / 2], [4.1, 55.8, -PI / 2], [-4.1, 57.0, PI / 2]]) if (rectOK(x - 0.45, z - 1.0, x + 0.45, z + 1.0, 0.2)) bike(x, z, yaw, true);
    const FL = [[0xd8407a, 0xf27aa8, 0xfbe4ea], [0xf27aa8, 0xfbe4ea], [0xd8322a, 0xf39a2a]];
    for (let i = 0; i < 9; i++) for (const sx of [-1, 1]) { const x = sx * (10.3 + i * 1.9 + rr(-0.3, 0.3)), z = 34.2 + rr(0, 0.3); if (Math.abs(x) < 24 && canPlace(x, z, 0.8)) bush(x, z, rr(0.9, 1.2), FL[i % 3], true); }
    // cau cao đứng hai bên cổng, hai cây lớn che bóng ở sân trước
    for (const [x, z] of [[-11.5, 34.6], [11.5, 34.6], [-17.5, 34.8], [17.5, 34.8]]) if (canPlace(x, z, 0.5)) areca(x, z, rr(8.5, 10), true, true);
    for (const [x, z, s] of [[-15.5, 40.5, 1.3], [15.5, 40.5, 1.3]]) if (canPlace(x, z, 0.7) && !nearOld(x, z, 2)) domeTree(x, z, s, 900 + ((x * 7) | 0), true, true);
    for (const [x, z, s] of [[-22.5, 38, 1.2], [22.5, 38.5, 1.2]]) if (canPlace(x, z, 0.7) && !nearOld(x, z, 2)) umbrellaTree(x, z, s, 950 + ((x * 7) | 0), true, true, [0xd6603a, 0xe07a4a, 0xc84a2e]);  // phượng đỏ
  });

  // đất nện nơi khách đứng mua hàng + vài mảng cỏ đậm nhạt cho bãi cỏ bớt phẳng
  safe('đất nện', () => {
    for (const sx of [1, -1]) for (let z0 = 34.5; z0 < 61; z0 += 4.4) {
      const z1 = Math.min(z0 + 4.4, 61), xa = sx * 2.65, xb = sx * 5.6, e = (z0 | 0) % 3 * 0.003;
      gquad(FR, [[xa, z0], [xb, z0], [xb, z1], [xa, z1]], 0x9c8c64, 0.022 + e, 0.06);
    }
    for (let i = 0, n = 0; i < 400 && n < 60; i++) {
      const x = rr(-31, 31), z = rr(33.5, 75), w = rr(2.5, 6), d = rr(2.5, 6);
      if (Math.abs(x) < 6 || col.hit(x, z, Math.max(w, d) * 0.6) || STRIPS.some((q) => rectHit(x, z, Math.max(w, d) * 0.6, q[0], q[1], q[2], q[3]))) continue;
      gquad(FR, [[x - w, z - d], [x + w, z - d], [x + w, z + d], [x - w, z + d]], pick([0x6f9a45, 0x7d9a45, 0x5d8c3d, 0x86a24a]), 0.015 + (n % 5) * 0.002, 0.04); n++;
    }
  });
  // cỏ cao và hoa dại rải ở bãi cỏ ngoài tường cho thảm cỏ bớt phẳng
  safe('cỏ dại', () => {
    const zones = [[-31, 31, 33.8, 75.5], [26.2, 31, -119, 33], [-31, -26.2, -119, 33], [-25, 25, -123.5, -120.3]];
    let n = 0;
    for (let t = 0; t < 2400 && n < 230; t++) {
      const zn = zones[[0, 0, 1, 0, 2, 0, 3][t % 7]], x = rr(zn[0], zn[1]), z = rr(zn[2], zn[3]);
      if ((Math.abs(x) < 3.2 && z > 28) || col.hit(x, z, 0.25) || STRIPS.some((q) => rectHit(x, z, 0.2, q[0], q[1], q[2], q[3])) || (z > 59.5 && Math.abs(x) < 2.6)) continue;
      const y = gy(x, z) - 0.02;
      if (n % 4 === 3) { const F = fr(FR, x, y, z, rnd() * 6); F.cyl(0, 0, 0, 0.05, 0, 0.13, 4, pick([0xfbf2dc, 0xf5d03a, 0xf29bb5, 0xfff6e0])); F.cyl(0, 0, 0, 0.012, 0.012, 0.1, 3, 0x4f8a35); }
      else for (let k = 0; k < 3; k++) leaf(LF, x, y, z, k * 2.1 + rnd(), 0.4 + rnd() * 0.25, 0.14, 0.28, 0.12, pick(LEAF_L));
      n++;
    }
  });

  // tán lớn nhìn thấy qua tường ở hai bên, phía trước và vườn cây sau tường: đặt trước ruộng để ruộng tránh chỗ này
  safe('cây lớn', () => {
    for (const [x, z, s] of [[34, 22, 1.5], [-34, 20, 1.5], [33, -10, 1.6], [-33, -12, 1.6], [34, -45, 1.5], [-34, -48, 1.5], [37, 44, 1.5], [-37, 46, 1.5]]) {
      if (nearOld(x, z, 3) || !canPlace(x, z, 0.8)) continue;
      domeTree(x, z, s, 1800 + ((x + z) | 0), true, true); EXC.push({ x, z, r: 4.5 });
    }
    for (let row = 0; row < 3; row++) for (let x = -30; x < 31; x += rr(7, 10)) {
      const z = -124 - row * 5.2 + rr(-1, 1);  // hàng cây sau tường bao (v4: tường ở z −118, dải đi bộ ngoài tường đến −120): cách tường ≥ 6 m, và chừa bờ sông
      if (nearOld(x, z, 2.2) || riverDist(x, z) < 8) continue;
      const t = rnd(), sd = 1500 + ((x * 3) | 0) + row;
      t < 0.45 ? domeTree(x, z, rr(1.1, 1.6), sd, false) : t < 0.7 ? umbrellaTree(x, z, rr(1, 1.3), sd, false) : t < 0.85 ? bamboo(x, z, sd, 7, false) : areca(x, z, rr(8, 10.5), false);
    }
  });

  // =====================================================================
  //  RUỘNG LÚA BẬC THANG: ô ruộng phẳng, bờ đất thấp, lúa xanh / chín / nước phản trời
  // =====================================================================
  const placed = [];
  const cornersOf = (rc) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [rc.x + a * rc.hx * rc.cs + b * rc.hz * rc.sn, rc.z - a * rc.hx * rc.sn + b * rc.hz * rc.cs]);
  const overlapRect = (a, b) => {
    for (const [P, Q] of [[a, b], [b, a]]) for (const ax of [[P.cs, -P.sn], [P.sn, P.cs]]) {
      const rp = P.hx * Math.abs(ax[0] * P.cs - ax[1] * P.sn) + P.hz * Math.abs(ax[0] * P.sn + ax[1] * P.cs);
      const rq = Q.hx * Math.abs(ax[0] * Q.cs - ax[1] * Q.sn) + Q.hz * Math.abs(ax[0] * Q.sn + ax[1] * Q.cs);
      if (Math.abs((Q.x - P.x) * ax[0] + (Q.z - P.z) * ax[1]) > rp + rq + 0.2) return false;
    }
    return true;
  };
  const rectNear = (rc, x, z, m) => {  // khoảng cách từ điểm đến hình chữ nhật xoay < m ?
    const dx = x - rc.x, dz = z - rc.z, u = dx * rc.cs - dz * rc.sn, v = dx * rc.sn + dz * rc.cs;
    const ex = Math.max(Math.abs(u) - rc.hx, 0), ez = Math.max(Math.abs(v) - rc.hz, 0);
    return ex * ex + ez * ez < m * m;
  };
  function paddy(rc, kind) {
    const { x, z, hx, hz, yaw } = rc;
    let hmin = 1e9, hmax = -1e9;
    for (const a of [-1, 0, 1]) for (const b of [-1, 0, 1]) { const h = gy(x + a * hx * rc.cs + b * hz * rc.sn, z - a * hx * rc.sn + b * hz * rc.cs); hmin = Math.min(hmin, h); hmax = Math.max(hmax, h); }
    if (hmax - hmin > (inBounds(x, z, 4) ? 0.5 : 1.5)) return false;
    const top = hmax + 0.2, bot = hmin - 0.45, f = fr(FR, x, 0, z, yaw), ins = 0.35, near = Math.hypot(x, z - 20) < 70;
    f.box(0, (top + bot) / 2, 0, 2 * hx, top - bot, 2 * hz, 0x7e5e3a, { top: 0x9c7e50, j: 0.04 });
    const ux = hx - ins, uz = hz - ins, nst = near ? clamp(Math.round(uz / 0.65), 3, 10) : 3;
    const stripes = (y, hex, w) => { for (let k = 0; k < nst; k++) { const v = -uz + ((k + 0.5) * 2 * uz) / nst; f.quad([-ux, y, v - w], [-ux, y, v + w], [ux, y, v + w], [ux, y, v - w], hex, 0.04); } };
    const plate = (y, hex) => f.quad([-ux, y, -uz], [-ux, y, uz], [ux, y, uz], [ux, y, -uz], hex, 0.04);
    if (kind === 'young') { plate(top - 0.02, 0x84b94c); stripes(top, 0x6fa63e, 0.22); }
    else if (kind === 'green') { f.box(0, top + 0.1, 0, 2 * ux, 0.4, 2 * uz, 0x4d8230, { top: 0x5f9a3a, j: 0.04 }); stripes(top + 0.31, 0x4f8a35, 0.25); }
    else if (kind === 'ripe') { f.box(0, top + 0.18, 0, 2 * ux, 0.58, 2 * uz, 0xb98a2c, { top: 0xd9ac3f, j: 0.05 }); stripes(top + 0.49, 0xc89a34, 0.25); }
    else if (kind === 'stubble') { plate(top - 0.02, 0xb9a266); stripes(top, 0xa48c52, 0.2); for (let k = 0; k < 2; k++) hay(x + rr(-0.5, 0.5) * hx, z + rr(-0.5, 0.5) * hz, rr(0.7, 1.0)); }
    else if (kind === 'plow') { plate(top - 0.02, 0x7a5636); stripes(top, 0x65442a, 0.18); }
    else { const g = fr(WR, x, 0, z, yaw); g.quad([-ux, top - 0.1, -uz], [-ux, top - 0.1, uz], [ux, top - 0.1, uz], [ux, top - 0.1, -uz], 0xe8f0f8, 0.05); if (rnd() < 0.4) f.quad([-ux, top - 0.07, -uz], [-ux, top - 0.07, -uz + uz * 0.8], [-ux + ux * 0.7, top - 0.07, -uz + uz * 0.8], [-ux + ux * 0.7, top - 0.07, -uz], 0x9ccc58, 0.05); }
    return true;
  }
  const dview = (x, z) => Math.min(Math.hypot(x, z - 30), Math.hypot(x, z + 40));
  const noise2 = (x, z) => 0.5 + 0.25 * Math.sin(x * 0.043 + 1.7) * Math.cos(z * 0.051 - 0.4) + 0.25 * Math.sin((x + z) * 0.027 + 0.6);
  const kindFor = (x, z) => {  // vùng lúa chín vàng và lúa non xanh gom thành từng mảng lớn
    const n = clamp(noise2(x, z), 0, 1), w = [['water', 0.13], ['plow', 0.07], ['young', 0.2 + 0.25 * (1 - n)], ['green', 0.17], ['ripe', 0.12 + 0.45 * n], ['stubble', 0.06]];
    let t = rnd() * w.reduce((a, b) => a + b[1], 0);
    for (const [k, v] of w) { t -= v; if (t <= 0) return k; }
    return 'young';
  };
  let nPaddy = 0;
  // block: gốc (ox,oz), chiều u mở ra theo sx (±1), chiều v theo +z; yaw nghiêng nhẹ; ô trong tầm đi bộ giữ yaw = 0
  function block(ox, oz, sx, yaw, U_, V_) {
    let v = 0;
    while (v < V_) {
      const rowNear = inBounds(ox + sx * 15, oz + v + 4, 4), kv = 1 + clamp((dview(ox + sx * 50, oz + v) - 45) / 80, 0, 1) * 0.9, rh = rowNear ? rr(5.5, 8) : rr(6.5, 9.5) * kv;
      let u = 0;
      while (u < U_) {
        const cx0 = Math.cos(yaw), sn0 = Math.sin(yaw);
        const px = ox + sx * (u * cx0) + v * sn0, pz = oz - sx * (u * sn0) + v * cx0, ku = 1 + clamp((dview(px, pz) - 45) / 80, 0, 1) * 0.8, cw = inBounds(px + sx * 6, pz, 4) ? rr(6.5, 10) : rr(8, 13) * ku;
        const cu = u + cw / 2, cv = v + rh / 2, x = ox + sx * (cu * cx0) + cv * sn0, z = oz - sx * (cu * sn0) + cv * cx0;
        u += cw + (inBounds(x, z, 3) ? 2.0 : rr(0.9, 1.4));
        if (dview(x, z) > 150) continue;
        const near = inBounds(x, z, 4), yw = near ? 0 : yaw, rc = { x, z, hx: cw / 2, hz: rh / 2, yaw: yw, cs: Math.cos(yw), sn: Math.sin(yw) };
        if (EXC.some((e) => rectNear(rc, e.x, e.z, e.r))) continue;
        if (old.some((o) => rectNear(rc, o.x, o.z, o.r + 0.9))) continue;
        if (placed.some((q) => overlapRect(rc, q))) continue;
        if (near) {
          const cs = cornersOf(rc);
          if (!rectOK(x - rc.hx, z - rc.hz, x + rc.hx, z + rc.hz, 0.35) || cs.some((c) => !canPlace(c[0], c[1], 0.3))) continue;
        }
        if (paddy(rc, kindFor(x, z))) { placed.push(rc); nPaddy++; if (near) col.box(x - rc.hx, z - rc.hz, x + rc.hx, z + rc.hz, 'paddy'); }
      }
      v += rh + (inBounds(ox + sx * 15, oz + v + 3, 3) ? 2.0 : rr(0.9, 1.4));
    }
  }
  // sân cổng trước chùa (z 32…45) để thảm cỏ + cây; ruộng bắt đầu từ z = 46
  safe('ruộng', () => {
    block(11, 46, 1, 0, 122, 100); block(-11, 46, -1, 0, 122, 100);
    block(33, -62, 1, 0.08, 100, 106); block(-33, -62, -1, -0.08, 100, 106);
    block(31, -108, 1, 0.06, 105, 46); block(-31, -108, -1, -0.06, 105, 46);
    block(-10, 84, 1, 0, 20, 60);
  });
  // rơm, chòi, bù nhìn, cò: rải trên ruộng đã đặt
  safe('chi tiết ruộng', () => {
    let huts = 0, crows = 0, eg = 0;
    for (const rc of placed) {
      if (!inBounds(rc.x, rc.z, 4) && huts < 6 && rnd() < 0.07) { const c = cornersOf(rc)[(rnd() * 4) | 0]; hut(c[0], c[1], rnd() * 6); huts++; }
      else if (crows < 5 && !inBounds(rc.x, rc.z, 4) && rnd() < 0.05) { scarecrow(rc.x, rc.z, rnd() * 6); crows++; }
      else if (eg < 12 && rnd() < 0.08) { egret(rc.x + rr(-0.4, 0.4) * rc.hx, rc.z + rr(-0.4, 0.4) * rc.hz, rnd() * 6, Math.max(...cornersOf(rc).map((c) => gy(c[0], c[1]))) + 0.1); eg++; }
    }
  });

  // =====================================================================
  //  CÂY SÁT TƯỜNG: dải hai bên (chừa lối đi bộ 1.65 m sát tường), sau tường, vườn cây
  // =====================================================================
  safe('cây quanh tường', () => {
    let i = 0;
    const put = (x, z, kind) => {
      i++;
      if (kind === 0) { const s = rr(1.1, 1.5); if (canPlace(x, z, 0.36 * s + 0.4)) domeTree(x, z, s, 1100 + i, true, true); }
      else if (kind === 1) { if (canPlace(x, z, 1.0)) bamboo(x, z, 1200 + i, 8, true, true); }
      else if (kind === 2) { if (canPlace(x, z, 0.5)) areca(x, z, rr(7.5, 10.5), true, true); }
      else if (kind === 3) { const s = rr(1.0, 1.3); if (canPlace(x, z, 0.4)) umbrellaTree(x, z, s, 1300 + i, true, true); }
      else if (canPlace(x, z, 0.5)) banana(x, z, 1.1, true, true);
    };
    // dải hai bên tường (chừa lối đi bộ 1.65 m sát tường) và dải sau tường
    for (const sx of [1, -1]) for (let z = -116; z < 30; z += rr(7.5, 11)) put(sx * rr(28.6, 30.4), z, pick([0, 0, 1, 2, 3, 4]));
    for (let x = -22; x < 23; x += rr(6.5, 9.5)) put(x, rr(-122.6, -120.8), pick([0, 1, 1, 2, 3]));
    // rặng cây, cau, dừa dọc đường làng
    for (const r of ROADS) for (let k = 0; k < r.pts.length - 1; k++) for (let t = 0.2; t < 1; t += 0.5) {
      const x = r.pts[k][0] + (r.pts[k + 1][0] - r.pts[k][0]) * t, z = r.pts[k][1] + (r.pts[k + 1][1] - r.pts[k][1]) * t, sd = rnd() < 0.5 ? 1 : -1, ox = x + sd * 3.0, oz = z + sd * 1.0;
      if (inBounds(ox, oz, 1.5) && !canPlace(ox, oz, 0.6)) continue;
      const q = rnd(); q < 0.4 ? areca(ox, oz, rr(7, 10), false, inBounds(ox, oz, 0)) : q < 0.7 ? coconut(ox, oz, rr(8, 11), inBounds(ox, oz, 0)) : domeTree(ox, oz, rr(1.1, 1.5), (rnd() * 1e6) | 0, false, inBounds(ox, oz, 0));
    }
    // mảng cây trên vùng đất xa và quanh xóm (tránh ô ruộng đã đặt)
    for (let g = 0; g < 16; g++) {
      const gx = rr(-130, 130), gz = rr(-150, 150);
      if (Math.hypot(gx, gz - 20) < 75 || (gx > -34 && gx < 34 && gz > -128 && gz < 40) || EXC.some((e) => Math.hypot(e.x - gx, e.z - gz) < e.r + 8) || riverDist(gx, gz) < 14 || placed.some((q) => rectNear(q, gx, gz, 11))) continue;
      for (let k = 0; k < 4; k++) { const x = gx + rr(-8, 8), z = gz + rr(-8, 8); rnd() < 0.7 ? domeTree(x, z, rr(1.2, 1.9), (rnd() * 1e6) | 0, false) : bamboo(x, z, (rnd() * 1e6) | 0, 5, false); }
    }
  });

  // =====================================================================
  //  TRỜI: diều, đàn cò bay, thuyền nan trên sông (một lưới động nhỏ, cập nhật bằng một hàm nhẹ)
  // =====================================================================
  const parts = [];  // {kind,s,n,px,py,pz,ph,...}
  const SB = { p: [], c: [], w: [] };
  function sp(ax, ay, az, aw, bx, by, bz, bw, cx, cy, cz, cw, hex) {
    const k = lin(hex), f = 1 + (jr() - 0.5) * 0.08;
    SB.p.push(ax, ay, az, bx, by, bz, cx, cy, cz); SB.w.push(aw, bw, cw); SB.c.push(k[0] * f, k[1] * f, k[2] * f, k[0] * f, k[1] * f, k[2] * f, k[0] * f, k[1] * f, k[2] * f);
  }
  function newPart(kind, px, py, pz, ph, o) { const n0 = SB.w.length; const p = Object.assign({ kind, s: n0, n: 0, px, py, pz, ph }, o); parts.push(p); return p; }
  const endPart = (p) => { p.n = SB.w.length - p.s; };
  safe('trời', () => {
    // diều: ba chiếc ở xa, đuôi dài
    [[-46, 24, 46, 0xc8302a, 0xe6b43a], [58, 19, 30, 0x2f6aa0, 0xf3e3c3], [-12, 31, 96, 0x3f7a4a, 0xe6b43a]].forEach(([x, y, z, c1, c2], i) => {
      const p = newPart('kite', x, y, z, i * 2.1, { yaw: rr(0, TAU) });
      const hw = 1.15, hh = 1.55;
      sp(0, hh, 0, 0, -hw, 0, 0, 0, 0, 0, 0.0, 0, c1); sp(0, hh, 0, 0, 0, 0, 0, 0, hw, 0, 0, 0, c2);
      sp(0, -hh * 0.9, 0, 0, hw, 0, 0, 0, 0, 0, 0, 0, c1); sp(0, -hh * 0.9, 0, 0, 0, 0, 0, 0, -hw, 0, 0, 0, c2);
      for (let k = 0; k < 8; k++) { const y0 = -hh * 0.9 - k * 0.7, y1 = y0 - 0.62, c = k % 2 ? c2 : c1, w0 = (k + 1) / 8, w1 = (k + 2) / 8; sp(-0.17, y0, 0, w0, 0.17, y0, 0, w0, 0, y1, 0, w1, c); }
      endPart(p);
    });
    // cò bay: ba đàn bốn con, bay vòng trên đồng
    [[40, 40, 38, 14, 0.09], [-50, 10, 46, 9, -0.075], [72, -72, 44, 12, 0.08]].forEach(([cx, cz, R, h, om], i) => { // đàn 3: tâm (72,−72) R 44 (v3: (20,−70) R 52 — chính điện v4 sâu tới z −113 nên vòng bay cũ xuyên qua tường/mái điện; vòng mới nằm ngoài x > 22,6)
      for (let b = 0; b < 4; b++) {
        const p = newPart('bird', cx, h, cz, i * 1.7 + b * 0.16, { R: R + b * 1.8 * (b % 2 ? 1 : -1), om, h: h + b * 0.8 });
        const S = 0.55;
        sp(0, 0, 0.5 * S, 0, -0.18 * S, 0, -0.3 * S, 0, 0.18 * S, 0, -0.3 * S, 0, 0xf5f2ea);                 // thân
        sp(-0.1 * S, 0, 0.1 * S, 0, -1.5 * S, 0.1, -0.2 * S, 1, -0.1 * S, 0, -0.5 * S, 0, 0xf5f2ea);          // cánh trái
        sp(0.1 * S, 0, 0.1 * S, 0, 0.1 * S, 0, -0.5 * S, 0, 1.5 * S, 0.1, -0.2 * S, 1, 0xe8e4d8);             // cánh phải
        sp(0, 0, 0.5 * S, 0, 0, 0, 0.95 * S, 0, 0.05, 0, 0.5 * S, 0, 0xe0b030);                              // mỏ
        endPart(p);
      }
    });
    // thuyền nan: thân thuôn, mui tre, người chèo đội nón
    const bt = (px, pz, yaw, lv, mui) => {
      const p = newPart('boat', px, lv, pz, rnd() * 6, { yaw });
      const B = { p: [], c: [] }, f = fr(B, 0, 0, 0, yaw);
      f.blob(0, 0.12, 0, 1.75, 0.27, 0.58, 0x7a5a3a, { d1: true, hex2: 0x9a7a4a });
      f.blob(0, 0.3, 0, 1.4, 0.05, 0.42, 0xb89a60, { j: 0.04 });
      for (const sx of [-1, 1]) f.cyl(sx * 1.7, 0.1, 0, 0.1, 0, 0.5, 5, 0x7a5a3a, { lx: sx * 0.25 });
      if (mui) for (let i = 0; i < 5; i++) { const a0 = (i / 5) * PI, a1 = ((i + 1) / 5) * PI; f.quad([-0.7, 0.3 + Math.sin(a0) * 0.42, Math.cos(a0) * 0.42], [0.7, 0.3 + Math.sin(a0) * 0.42, Math.cos(a0) * 0.42], [0.7, 0.3 + Math.sin(a1) * 0.42, Math.cos(a1) * 0.42], [-0.7, 0.3 + Math.sin(a1) * 0.42, Math.cos(a1) * 0.42], 0x6a4a2a, 0.06); }
      else { f.blob(0.9, 0.55, 0, 0.15, 0.2, 0.15, 0x3a4a5a); f.blob(0.9, 0.86, 0, 0.12, 0.13, 0.12, 0xe0b48a); f.cyl(0.9, 0.92, 0, 0.34, 0, 0.17, 8, 0xdcc080); f.box(-0.2, 0.9, 0.55, 2.4, 0.04, 0.04, 0x6a4a2e, { rz: 0.12 }); }
      for (let t = 0; t < B.p.length; t += 9) sp(B.p[t], B.p[t + 1], B.p[t + 2], 0, B.p[t + 3], B.p[t + 4], B.p[t + 5], 0, B.p[t + 6], B.p[t + 7], B.p[t + 8], 0, 0x7a5a3a);
      // màu thật từng mặt: ghi đè theo B.c
      for (let t = 0; t < B.c.length; t++) SB.c[SB.c.length - B.c.length + t] = B.c[t];
      endPart(p);
    };
    if (RIVER.length > 20) {
      const near = (z) => { let b = RIVER[0], bd = 1e9; for (const s of RIVER) { const d = Math.abs(s.z - z) + Math.abs(s.x + 70) * 0.1; if (s.x < -40 && d < bd) { bd = d; b = s; } } return b; };
      const s1 = near(14), s2 = RIVER.filter((s) => s.z < -100 && s.x > -40 && s.x < 60);
      { const c = Math.cos(BRIDGE.yaw), sn = Math.sin(BRIDGE.yaw), lx = -4.6, lz = -((BRIDGE.hw || 3.7) - 1.7); bt(BRIDGE.x + lx * c + lz * sn, BRIDGE.z - lx * sn + lz * c, BRIDGE.yaw + 0.08, s1.lv + 0.05, true); }
      if (s2.length > 6) { const a = s2[Math.floor(s2.length * 0.25)], b = s2[Math.floor(s2.length * 0.7)]; bt(a.x + a.nx * 0.8, a.z + a.nz * 0.8, Math.atan2(a.nx, a.nz) + 0.12, a.lv + 0.05, false); bt(b.x - b.nx * 0.9, b.z - b.nz * 0.9, Math.atan2(b.nx, b.nz) - 0.1, b.lv + 0.05, true); W.fireflyAreas.push({ x: a.x, z: a.z + 4, r: 7 }); }
    }
  });

  // =====================================================================
  //  GỘP & ĐƯA VÀO CẢNH (6 lượt vẽ), cập nhật động nhẹ
  // =====================================================================
  const meshes = {};
  const addMesh = (key, R, Ub, mat, cast, recv) => {
    if (R && R.p.length) Ub.addGeo(toGeo(R));
    if (!Ub.list.length) return;
    const m = Ub.mesh(mat, { cast, receive: recv }); m.name = 'scenery-' + key; scene.add(m); meshes[key] = m;
  };
  addMesh('near', NR, NU, G.mats.vc, true, true);
  addMesh('far', FR, FU, G.mats.vc, false, false);
  addMesh('foliage', LF, U.batch(), G.mats.vcDouble, false, false);
  const waterMat = new THREE.MeshPhongMaterial({ vertexColors: true, color: 0x2a6a86, emissive: 0x0b2c38, shininess: 90, specular: 0x8a7a60 });
  addMesh('water', WR, WU, waterMat, false, false);
  addMesh('lights', LR, LU, G.mats.lantern, false, false);
  // lưới động: diều, cò, thuyền
  let skyMesh = null, skyPos = null, skyBase = null, skyW = null;
  if (SB.w.length) {
    const g = new THREE.BufferGeometry();
    skyBase = new Float32Array(SB.p); skyPos = new Float32Array(SB.p); skyW = new Float32Array(SB.w);
    g.setAttribute('position', new THREE.BufferAttribute(skyPos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(SB.c), 3));
    g.computeVertexNormals();
    skyMesh = new THREE.Mesh(g, G.mats.vcDouble); skyMesh.frustumCulled = false; skyMesh.castShadow = false; skyMesh.receiveShadow = false; skyMesh.name = 'scenery-sky';
    scene.add(skyMesh); meshes.sky = skyMesh;
  }
  const tint = new THREE.Color();
  let tintT = 0, hidden = false;
  const place = (p, ox, oy, oz, yaw, pitch, roll, amp, wag) => {  // ghi lại các đỉnh của một phần động
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cx = Math.cos(pitch), sx = Math.sin(pitch), cz = Math.cos(roll), sz = Math.sin(roll);
    for (let v = p.s, e = p.s + p.n; v < e; v++) {
      const i = v * 3, w = skyW[v];
      let x = skyBase[i] + w * wag, y = skyBase[i + 1] + w * amp, z = skyBase[i + 2];
      const x1 = x * cz - y * sz, y1 = x * sz + y * cz;
      const y2 = y1 * cx - z * sx, z2 = y1 * sx + z * cx;
      skyPos[i] = p.px + ox + x1 * cy + z2 * sy; skyPos[i + 1] = oy + y2; skyPos[i + 2] = p.pz + oz - x1 * sy + z2 * cy;
    }
  };
  const stepSky = (t) => {  // diều đung đưa, cò bay vòng, thuyền bập bềnh; ban đêm diều và cò ẩn đi
    const night = G.tod.night > 0.6;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (p.kind === 'boat') place(p, 0, p.py + Math.sin(t * 0.8 + p.ph) * 0.03, 0, 0, Math.sin(t * 0.5 + p.ph) * 0.015, Math.sin(t * 0.65 + p.ph) * 0.03, 0, 0);
      else if (night) { if (!hidden) place(p, 0, -400, 0, 0, 0, 0, 0, 0); }
      else if (p.kind === 'kite') place(p, Math.sin(t * 0.5 + p.ph) * 1.6, p.py + Math.sin(t * 0.37 + p.ph * 2) * 0.9, Math.cos(t * 0.43 + p.ph) * 1.2, p.yaw + Math.sin(t * 0.3 + p.ph) * 0.25, -0.28, Math.sin(t * 0.9 + p.ph) * 0.18, 0, Math.sin(t * 2.1 + p.ph) * 0.35);
      else { const a = p.ph + t * p.om, sg = Math.sign(p.om); place(p, p.R * Math.cos(a), p.h + Math.sin(t * 0.7 + p.ph) * 0.8, p.R * Math.sin(a), Math.atan2(-Math.sin(a) * sg, Math.cos(a) * sg), 0, 0.22 * sg, Math.sin(t * 9 + p.ph * 5) * 0.3, 0); }
    }
    hidden = night;
    skyMesh.geometry.attributes.position.needsUpdate = true;
  };
  if (skyMesh) stepSky(0);  // đặt sẵn vị trí đầu tiên, không để hình nằm ở gốc toạ độ
  G.onUpdate((dt, t) => {
    tintT -= dt;
    if (tintT <= 0) {  // màu nước theo giờ trong ngày, phản chiếu màu chân trời
      tintT = 0.3;
      if (W.water) tint.copy(W.water.material.color).lerp(scene.fog.color, 0.4); else tint.set(0x2a6a86);
      waterMat.color.copy(tint);
    }
    if (skyMesh) stepSky(t);
  }, 58);

  for (const R of [NR, FR, LF, WR, LR, SB]) { R.p.length = 0; R.c.length = 0; if (R.w) R.w.length = 0; }  // giải phóng bộ nhớ tạm
  W.scenery = { meshes, river: RIVER, bridge: BRIDGE, villages: VILL, roads: ROADS, paddies: nPaddy };
  G.nav.built = false;  // dựng lại đồ thị dẫn đường khi bắt đầu, có tính vật cản mới
}
