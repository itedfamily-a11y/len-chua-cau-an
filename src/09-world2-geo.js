// =====================================================================
//  KHU MỞ RỘNG — HÌNH KHỐI: nền đá, ao Long Trì & cầu đá, tầng nền & bậc đá,
//  sân linh thú, Tích Thiện Am + tháp Cửu phẩm, điện Quan Âm, tháp Báo Nghiêm,
//  vườn tháp, hai dãy hành lang. Toạ độ và vật cản lấy từ G.L2 (08-world2.js);
//  phỏng theo nét kiến trúc chùa Bút Tháp và chùa Phật Tích, cách điệu cho trò chơi.
// =====================================================================
function buildWorld2Geo(G) {
  const { THREE, util: U, scene } = G;
  const PI = Math.PI;
  const { C, BOX, box, boxMM, cyl, branch, addRoof, addSign, glow, hangLanternInto, columnInto } = G.build;
  const L = G.L2, W = G.world, col = G.collide;
  if (!L || !W) return; // chưa có bố cục khu mở rộng

  // ---------- Bộ gom hình (5 mesh chính) + hình gốc dùng chung ----------
  const S = U.batch(), F = U.batch(), M = U.batch(), LB = U.batch();
  const own = [], mk = (g) => (own.push(g), g);
  const PLANE = mk(new THREE.PlaneGeometry(1, 1).rotateX(-PI / 2));
  const SPH = mk(new THREE.SphereGeometry(1, 6, 4)), SPHS = mk(new THREE.SphereGeometry(1, 5, 3));
  const ICO = mk(new THREE.IcosahedronGeometry(1, 0)), OCTA = mk(new THREE.OctahedronGeometry(1, 0));
  const CIRC = mk(new THREE.CircleGeometry(1, 14).rotateX(-PI / 2));
  const PAD = mk(new THREE.CircleGeometry(1, 8, 0.3, PI * 1.85).rotateX(-PI / 2));
  const TORUS = mk(new THREE.TorusGeometry(1, 0.1, 4, 12)), CYL = mk(new THREE.CylinderGeometry(1, 1, 1, 10));
  const CYLO = mk(new THREE.CylinderGeometry(1, 1.06, 1, 8, 1, true)), ARM = mk(new THREE.CylinderGeometry(0.03, 0.024, 1, 4, 1, true).rotateX(PI / 2));
  const CONE = {}; for (const n of [4, 5, 6, 8]) CONE[n] = mk(new THREE.ConeGeometry(0.5, 1, n)); // đáy đường kính 1, cao 1
  const rng = U.rng(9091);
  const shade = (hex, f) => new THREE.Color(hex).multiplyScalar(f).getHex();
  const ell = (B, x, y, z, rx, ry, rz, color, o) => B.add(SPH, color, Object.assign({ p: [x, y, z], s: [rx, ry, rz] }, o));
  const ellS = (B, x, y, z, rx, ry, rz, color, o) => B.add(SPHS, color, Object.assign({ p: [x, y, z], s: [rx, ry, rz] }, o));
  const cone = (B, n, x, y0, z, w, h, color, o) => B.add(CONE[n], color, Object.assign({ p: [x, y0 + h / 2, z], s: [w, h, w] }, o)); // y0 = đáy
  // lăng trụ bát giác (mặt phẳng quay ra bốn hướng), r = bán kính ngoại tiếp, y0 = đáy
  const oct = (B, x, y0, z, r, h, color, o) => cyl(B, x, y0 + h / 2, z, r, r, h, color, 8, Object.assign({ r: [0, PI / 8, 0] }, o));
  // lăng trụ/chóp cụt bát giác hở hai đầu (đầu bị tầng trên/dưới che) — nhẹ hơn một nửa
  const octO = (B, x, y0, z, rt, rb, h, color, o) => B.add(new THREE.CylinderGeometry(rt, rb, h, 8, 1, true), color, Object.assign({ p: [x, y0 + h / 2, z], r: [0, PI / 8, 0] }, o));
  // thanh nối hai điểm (rộng wd, dày ht); trả về ma trận để gắn thêm hoạ tiết theo hệ toạ độ của thanh
  const sbox = (B, a, b, wd, ht, color, ext = 0) => { const s = U.segMatrix(a[0], a[1], a[2], b[0], b[1], b[2]); B.add(BOX, color, { s: [wd, ht, s.len + ext], m: s.m }); return s.m; };
  // nụ sen đặt đỉnh trụ
  const bud = (B, x, y, z, s, color) => { ellS(B, x, y + 0.1 * s, z, 0.11 * s, 0.13 * s, 0.11 * s, color); cone(B, 6, x, y + 0.18 * s, z, 0.13 * s, 0.17 * s, color); };
  // vòng cánh sen: n cánh quanh trục, gốc ở bán kính R, nghiêng tilt (rad) so với phương đứng
  const petalRing = (B, cx, y, cz, R, n, len, wid, tilt, color, ph = 0, thick = 0.4) => {
    const st = Math.sin(tilt), ct = Math.cos(tilt);
    for (let i = 0; i < n; i++) {
      const a = ph + (i / n) * PI * 2, mx = R + (st * len) / 2, my = (ct * len) / 2;
      B.add(CONE[4], color, { p: [cx + Math.sin(a) * mx, y + my, cz + Math.cos(a) * mx], s: [wid, len, wid * thick], r: [tilt, a, 0], order: 'YXZ' });
    }
  };
  // dựng một nhóm theo toạ độ cục bộ rồi đặt tại (x,y,z) xoay yaw
  const _mp = new THREE.Matrix4();
  const placed = (B, x, y, z, yaw, fn) => {
    const T = U.batch(); fn(T);
    if (!T.list.length) return;
    const g = U.merge(T.list); g.applyMatrix4(_mp.makeRotationY(yaw).setPosition(x, y, z)); B.addGeo(g);
  };
  const sub = (B, dx, dy, dz, fn) => { const T = U.batch(); fn(T); if (!T.list.length) return; const g = U.merge(T.list); g.translate(dx, dy, dz); B.addGeo(g); };
  // mặt phẳng lát đá: nền tối + các phiến sáng
  const flags = (x0, z0, x1, z1, y, tw, td, color, base) => {
    F.add(PLANE, base, { p: [(x0 + x1) / 2, y, (z0 + z1) / 2], s: [x1 - x0, 1, z1 - z0], j: 0 });
    const nx = Math.max(1, Math.round((x1 - x0) / tw)), nz = Math.max(1, Math.round((z1 - z0) / td)), w = (x1 - x0) / nx, d = (z1 - z0) / nz;
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) F.add(PLANE, color, { p: [x0 + (i + 0.5) * w, y + 0.004, z0 + (j + 0.5) * d], s: [w - 0.06, 1, d - 0.06], j: 0.07 });
  };
  // lối đi lát phiến so le (z0 phía bắc < z1 phía nam)
  const slabPath = (x0, x1, z0, z1, y) => {
    F.add(PLANE, 0x6f6455, { p: [(x0 + x1) / 2, y, (z0 + z1) / 2], s: [x1 - x0, 1, z1 - z0], j: 0 });
    const sw = 1.1, sd = 1.0;
    for (let row = 0, z = z1; z > z0 + 0.01; z -= sd, row++) {
      const zc = Math.max(z - sd, z0), off = row % 2 ? sw / 2 : 0;
      for (let x = x0 - off; x < x1 - 0.01; x += sw) {
        const xa = Math.max(x, x0), xb = Math.min(x + sw, x1);
        if (xb - xa < 0.2) continue;
        F.add(PLANE, 0xd2bd9c, { p: [(xa + xb) / 2, y + 0.004, (z + zc) / 2], s: [xb - xa - 0.06, 1, z - zc - 0.06], j: 0.07 });
      }
    }
  };
  const K = { // bảng màu bổ sung, hoà với G.build.C
    brick: [0x9b5d42, 0x8f5238, 0xa4684a], brickD: 0x7a4632, floorRed: 0x8f4e34, plaster: C.ochre, lacquer: 0x9a2a20, lacquerD: 0x6c1b14,
    blue: 0x8e98a3, blueD: 0x6d7884, blueL: 0xaab3bc, cream: C.cream, flame: 0xffd27a,
    sand: [0x9d917e, 0x948a77, 0xa59a86, 0x8f8470, 0x9a8f7b],
  };
  const stoneLantern = (x, z, y0 = 0, withCol = true) => { // đèn đá có quầng sáng
    box(S, x, y0 + 0.15, z, 0.62, 0.3, 0.62, C.stoneD); box(S, x, y0 + 0.75, z, 0.28, 0.9, 0.28, C.stone);
    box(S, x, y0 + 1.32, z, 0.56, 0.12, 0.56, C.stone); LB.add(BOX, 0xffd98a, { p: [x, y0 + 1.6, z], s: [0.36, 0.4, 0.36] });
    cone(S, 4, x, y0 + 1.82, z, 1.0, 0.36, C.stoneD, { r: [0, PI / 4, 0] });
    glow(x, y0 + 1.6, z, 1.4, [1.0, 0.75, 0.38], true);
    if (withCol) col.circle(x, z, 0.42, 'stonelamp');
  };
  const bench = (b) => { // ghế đá như ghế bên hồ sen phía trước
    box(S, b.x, 0.42, b.z, 1.8, 0.14, 0.55, C.stoneL, { r: [0, b.yaw, 0] });
    for (const s of [-0.65, 0.65]) box(S, b.x + Math.cos(b.yaw) * s, 0.2, b.z - Math.sin(b.yaw) * s, 0.2, 0.4, 0.45, C.stoneD, { r: [0, b.yaw, 0] });
  };
  // vòng tròn mảnh (xuyến) bán kính r, tiết diện ~tube; sx kéo giãn theo x (hào quang hình trứng)
  const ring = (B, x, y, z, r, tube, color, rot, sx = 1, seg = 16) => B.add(mk(new THREE.TorusGeometry(1, tube / r, 4, seg)), color, { p: [x, y, z], s: [r * sx, r, r], r: rot });
  const incenseBowl = (x, y, z, r = 1) => { // lư hương nhỏ bằng đồng + vài nén hương
    M.add(lathe2([[0, 0], [0.12 * r, 0.01], [0.17 * r, 0.09], [0.18 * r, 0.16], [0.15 * r, 0.17]], 10), C.bronze, { p: [x, y, z] });
    for (let i = 0; i < 3; i++) box(S, x + (i - 1) * 0.04 * r, y + 0.3 * r, z, 0.012, 0.34 * r, 0.012, 0x7a2a1a);
    glow(x, y + 0.5 * r, z, 0.2, [1, 0.35, 0.1], false);
  };
  function lathe2(pts, sg) { return mk(new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), sg)); }
  const candle = (x, y, z) => { // nến + quầng sáng (luôn sáng)
    cyl(S, x, y + 0.15, z, 0.035, 0.04, 0.3, K.cream, 6); cone(LB, 5, x, y + 0.3, z, 0.07, 0.13, K.flame);
    glow(x, y + 0.42, z, 0.55, [1.0, 0.7, 0.3], false);
  };
  const stele = (x, z, ry, lines, w = 1.1) => { // bia đá có biển chữ, mặt quay theo ry
    placed(S, x, 0, z, ry, (B) => {
      box(B, 0, 0.25, 0, 1.6, 0.5, 0.7, C.stoneD); box(B, 0, 1.2, 0, 1.3, 1.4, 0.3, C.stone); box(B, 0, 2.0, 0, 1.5, 0.14, 0.44, C.stoneD);
      box(B, 0, 2.17, 0.1, 1.5, 0.1, 0.34, C.stoneD, { r: [-0.5, 0, 0] }); box(B, 0, 2.17, -0.1, 1.5, 0.1, 0.34, C.stoneD, { r: [0.5, 0, 0] }); box(B, 0, 2.27, 0, 1.52, 0.1, 0.12, C.stone);
    });
    addSign(lines, w, 0.8, x + Math.sin(ry) * 0.16, 1.22, z + Math.cos(ry) * 0.16, ry, { ppu: 260, bg1: '#5a4a3a', bg2: '#3e3226', fg: '#f3e3c3' });
    const sw = Math.abs(Math.sin(ry)) > 0.5; col.box(x - (sw ? 0.35 : 0.8), z - (sw ? 0.8 : 0.35), x + (sw ? 0.35 : 0.8), z + (sw ? 0.8 : 0.35), 'stele');
  };
  // ---------- Cây cối ----------
  function frangipani(x, z, seed) { // cây hoa sứ như cây ở sân trước
    const r = U.rng(seed), trunk = 0x8a7a68;
    branch(S, [x, 0, z], [x + 0.1, 1.3, z], 0.2, 0.15, trunk, 7);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * PI * 2 + r(), d = 1.0 + r() * 0.5, top = [x + Math.cos(a) * d, 2.2 + r() * 0.5, z + Math.sin(a) * d];
      branch(S, [x + 0.1, 1.25, z], top, 0.12, 0.07, trunk, 6);
      S.add(new THREE.IcosahedronGeometry(0.62 + r() * 0.25, 0), 0x3f6a32, { p: [top[0], top[1] + 0.25, top[2]], s: [1.1, 0.7, 1.1], j: 0.12 });
      for (let k = 0; k < 5; k++) S.add(OCTA, k % 2 ? 0xfff4dc : 0xffe7a8, { p: [top[0] + (r() - 0.5) * 0.9, top[1] + 0.48 + r() * 0.18, top[2] + (r() - 0.5) * 0.9], s: 0.075 });
    }
    col.circle(x, z, 0.4, 'tree');
    W.petalSources.push({ x, y: 2.8, z, r: 1.6, kind: 'flower' });
  }
  function cypress(x, z, s, seed) { // cây tùng/bách thon cao
    const r = U.rng(seed);
    branch(S, [x, 0, z], [x, 1.2 * s, z], 0.16 * s, 0.12 * s, C.bark, 5);
    for (let i = 0; i < 4; i++) {
      const w = (1.5 - i * 0.28) * s, h = (1.7 - i * 0.12) * s;
      cone(S, 6, x + (r() - 0.5) * 0.06, (0.7 + i * 0.95) * s, z + (r() - 0.5) * 0.06, w, h, i % 2 ? 0x3a6232 : 0x355a2e, { j: 0.1 });
    }
    col.circle(x, z, 0.34 * s + 0.05, 'tree');
  }
  function bonsai(x, z) { // chậu cảnh như sân trước
    F.add(lathe2([[0, 0], [0.3, 0], [0.42, 0.12], [0.46, 0.42], [0.5, 0.46], [0, 0.46]], 10), 0x3c6aa0, { p: [x, 0, z] });
    cyl(F, x, 0.43, z, 0.49, 0.49, 0.04, 0xeef0f4, 10);
    branch(S, [x, 0.45, z], [x + 0.15, 1.05, z + 0.05], 0.07, 0.05, 0x6b5240, 5);
    S.add(new THREE.IcosahedronGeometry(0.34, 0), 0x4c7a35, { p: [x + 0.18, 1.15, z + 0.05], s: [1.2, 0.6, 1.0], j: 0.12 });
    S.add(new THREE.IcosahedronGeometry(0.24, 0), 0x5d8c3d, { p: [x - 0.18, 0.9, z], s: [1.2, 0.6, 1.0], j: 0.12 });
    col.circle(x, z, 0.46, 'pot');
  }

  // =====================================================================
  //  0. MẶT CỎ: đồi cỏ của 05-world.js cao dần về phía sau (z < -45) sẽ trồi lên khỏi nền đá,
  //     nên san phẳng các đỉnh lưới cỏ nằm trong khu mới (vẫn nằm trong tường bao)
  // =====================================================================
  {
    const grass = scene.children.find((o) => o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry' && o.geometry.parameters.width > 400);
    if (grass) {
      const gp = grass.geometry.attributes.position; let n = 0;
      for (let i = 0; i < gp.count; i++) { const x = gp.getX(i), z = gp.getZ(i); if (x > -26 && x < 26 && z > -86 && z < -24) { gp.setY(i, -0.03); n++; } }
      if (n) { gp.needsUpdate = true; grass.geometry.computeVertexNormals(); grass.geometry.computeBoundingSphere(); }
    }
  }

  // =====================================================================
  //  1. NỀN ĐÁ: sân sau + tầng nền (cùng hoạ tiết gạch với sân trước), lối đi giữa
  // =====================================================================
  const T = L.terrace, HT = L.hallTerrace, TH = T.h, Z = L.zone;
  {
    const tileTex = U.canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#7f7566'; g.fillRect(0, 0, w, h);
      const r = U.rng(3);
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
        const v = 0.9 + r() * 0.16, s = w / 2;
        g.fillStyle = `rgb(${(196 * v) | 0},${(184 * v) | 0},${(165 * v) | 0})`; g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
        for (let k = 0; k < 90; k++) { g.fillStyle = `rgba(${r() < 0.5 ? '70,55,40' : '255,245,225'},${r() * 0.09})`; g.fillRect(i * s + r() * s, j * s + r() * s, 3, 3); }
      }
    });
    tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
    tileTex.anisotropy = Math.min(8, G.renderer.capabilities.getMaxAnisotropy());
    const pos = [], nor = [], uv = [];
    // uv theo toạ độ thế giới (2.4 m / ô) để khớp pha với sân trước
    const quad = (x0, z0, x1, z1, y) => { for (const [x, z] of [[x0, z0], [x0, z1], [x1, z1], [x0, z0], [x1, z1], [x1, z0]]) { pos.push(x, y, z); nor.push(0, 1, 0); uv.push((x + 24) / 2.4, (31 - z) / 2.4); } };
    quad(Z.x0, Z.z0, Z.x1, Z.z1, 0.005); quad(T.x0, T.z0, T.x1, T.z1, TH + 0.004); quad(HT.x0, HT.z0 - 0.15, HT.x1, HT.z1, TH + 0.004); // lấn 0,15 m vào thân tường bao (mặt trong z=-83.775) cho khỏi hở khe
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    const ground = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: tileTex }));
    ground.receiveShadow = true; ground.matrixAutoUpdate = false; ground.updateMatrix(); scene.add(ground); W.ground2 = ground;
  }
  // lối đi phiến đá dọc trục: sau cầu → bậc, trên tầng nền → Tích Thiện Am (đoạn sân sau → cầu do lối đi giữa của 05-world.js kéo dài tới đầu cầu)
  slabPath(-2.2, 2.2, L.stairsFront.z1 + 0.0, L.bridge.z0, 0.02);
  slabPath(-2.2, 2.2, L.am.frontZ, T.z1, TH + 0.02);

  // =====================================================================
  //  2. AO LONG TRÌ + CẦU ĐÁ (lan can chạm nổi) + 4 trụ đèn đầu cầu
  // =====================================================================
  {
    const P = L.pond, Bd = L.bridge, hB = (z) => Bd.peak * Math.sin((PI * (Bd.z1 - z)) / (Bd.z1 - Bd.z0));
    const water = new THREE.Mesh(new THREE.PlaneGeometry(P.x1 - P.x0, P.z1 - P.z0), W.water ? W.water.material : new THREE.MeshPhongMaterial({ color: 0x1f5566, shininess: 90 }));
    water.rotation.x = -PI / 2; water.position.set((P.x0 + P.x1) / 2, P.waterY, (P.z0 + P.z1) / 2);
    water.receiveShadow = true; water.matrixAutoUpdate = false; water.updateMatrix(); scene.add(water); W.water2 = water; // cùng vật liệu → đổi màu theo giờ
    // bờ đá ghép từng tảng
    const pal = [C.stone, 0x9d9382, C.stoneL, 0x948a79];
    const rim = (xc, zc, sx, sz) => { const h = 0.28 + rng() * 0.06; box(S, xc, h / 2, zc, sx, h, sz, pal[(rng() * pal.length) | 0]); };
    const rimRow = (a0, a1, f) => { const n = Math.max(1, Math.round((a1 - a0) / 0.93)), w = (a1 - a0) / n; for (let i = 0; i < n; i++) f(a0 + (i + 0.5) * w, w - 0.03); };
    for (const [a0, a1] of [[-10.4, -1.52], [1.52, 10.4]]) for (const z of [P.z1 + 0.2, P.z0 - 0.2]) rimRow(a0, a1, (xc, w) => rim(xc, z, w, 0.4));
    for (const x of [P.x0 - 0.2, P.x1 + 0.2]) rimRow(P.z0, P.z1, (zc, w) => rim(x, zc, 0.4, w));
    // sen: lá và hoa
    const pads = [];
    for (let i = 0; i < 30; i++) {
      let x = 0, z = 0, ok = false;
      for (let t = 0; t < 40 && !ok; t++) { x = P.x0 + 0.9 + rng() * (P.x1 - P.x0 - 1.8); z = P.z0 + 0.7 + rng() * (P.z1 - P.z0 - 1.4); ok = Math.abs(x) > 2.4 && pads.every((q) => Math.hypot(q[0] - x, q[1] - z) > 0.95); }
      if (!ok) continue;
      const r = 0.26 + rng() * 0.26; pads.push([x, z, r]);
      F.add(PAD, i % 2 ? 0x4f8a3c : 0x3f7a33, { p: [x, 0.08, z], s: [r, 1, r], r: [0, rng() * 6, 0] });
    }
    pads.slice(0, 9).forEach(([x, z], i) => {
      const pk = i % 3 ? 0xf29bb5 : 0xfff0f4;
      petalRing(S, x, 0.1, z, 0.03, 6, 0.17, 0.09, 0.7, pk, rng() * 6, 0.5); petalRing(S, x, 0.1, z, 0.0, 4, 0.12, 0.08, 0.25, i % 3 ? 0xf8b9cc : 0xffffff, rng() * 6, 0.5);
      ellS(S, x, 0.14, z, 0.045, 0.04, 0.045, 0xf5d03a);
    });
    pads.slice(9, 13).forEach(([x, z]) => { cyl(S, x + 0.15, 0.3, z, 0.012, 0.012, 0.45, 0x4f8a3c, 4); cone(S, 6, x + 0.15, 0.5, z, 0.14, 0.26, 0xf28aaa); });
    // cầu vồng: mặt cầu bám đúng G.heightAt (hình sin), dầm hai bên
    const NB = 12, ds = (Bd.z1 - Bd.z0) / NB;
    for (let i = 0; i < NB; i++) {
      const za = Bd.z1 - i * ds, zb = Bd.z1 - (i + 1) * ds;
      sbox(S, [0, hB(za) - 0.15, za], [0, hB(zb) - 0.15, zb], 3.0, 0.3, i % 2 ? C.stoneL : 0xb9ae9b, 0.03);
      for (const s of [-1, 1]) sbox(S, [s * 1.4, hB(za) - 0.1, za], [s * 1.4, hB(zb) - 0.1, zb], 0.24, 0.42, C.stone, 0.03);
    }
    for (const s of [-1, 1]) {
      const zp = (i) => Bd.z1 - i * 1.2;
      for (let i = 0; i <= 6; i++) { // trụ lan can đầu nụ sen
        const z = zp(i), big = i === 0 || i === 6, y = hB(z), hw = big ? 0.34 : 0.26;
        box(S, s * 1.4, y + 0.1, z, hw + 0.08, 0.2, hw + 0.08, C.stone);
        box(S, s * 1.4, y + (big ? 0.65 : 0.5), z, hw, big ? 1.1 : 0.9, hw, C.stoneL); bud(S, s * 1.4, y + (big ? 1.2 : 0.95), z, big ? 1.5 : 1.1, C.stoneL);
      }
      for (let i = 0; i < 6; i++) { // tấm lan can chạm nổi (khung – ô lõm – hoạ tiết thoi) cả hai mặt
        const za = zp(i) - 0.14, zb = zp(i + 1) + 0.14;
        const m = sbox(S, [s * 1.4, hB(za) + 0.42, za], [s * 1.4, hB(zb) + 0.42, zb], 0.14, 0.52, C.stone);
        sbox(S, [s * 1.4, hB(za) + 0.81, za], [s * 1.4, hB(zb) + 0.81, zb], 0.2, 0.1, C.stoneL, 0.02);
        for (const f of [-1, 1]) {
          S.add(BOX, C.stoneL, { p: [f * 0.075, 0, 0], s: [0.01, 0.4, 0.88], m, j: 0.04 });
          S.add(BOX, 0x7d7464, { p: [f * 0.0825, 0, 0], s: [0.01, 0.3, 0.78], m, j: 0.04 });
          S.add(BOX, C.stoneL, { p: [f * 0.0875, 0, 0], s: [0.01, 0.17, 0.17], r: [PI / 4, 0, 0], m, j: 0.04 });
        }
      }
    }
    for (const sx of [-1, 1]) for (const z of [P.z1 + 0.2, P.z0 - 0.2]) stoneLantern(sx * 2.0, z, 0.28, false); // 4 trụ đèn ở hai đầu cầu (đứng trên bờ đá)
  }

  // =====================================================================
  //  3. TẦNG NỀN: tường kè đá, lan can thấp, bậc đá trước, bậc phía tây và hai bậc bên
  // =====================================================================
  function blockWall(x0, z0, x1, z1, thick, seed) { // tường kè xếp tảng đá 3 hàng so le
    const r = U.rng(seed), alongX = Math.abs(x1 - x0) >= Math.abs(z1 - z0);
    const a0 = alongX ? Math.min(x0, x1) : Math.min(z0, z1), a1 = alongX ? Math.max(x0, x1) : Math.max(z0, z1);
    const c = alongX ? (z0 + z1) / 2 : (x0 + x1) / 2, ch = TH / 3, pal = [0xa89d8b, 0x9d9382, 0xb1a692, 0x948a79, 0xa39887];
    const seg = (A, B2, y0, y1, w, color) => (alongX ? boxMM(S, A, y0, c - w / 2, B2, y1, c + w / 2, color) : boxMM(S, c - w / 2, y0, A, c + w / 2, y1, B2, color));
    seg(a0 - 0.02, a1 + 0.02, 0, 0.12, thick + 0.12, C.stoneD); // chân tường
    for (let k = 0; k < 3; k++) {
      let a = a0, first = true;
      while (a < a1 - 0.05) {
        let len = 1.7 + r() * 1.0; if (k % 2 && first) len *= 0.45;
        first = false; let b = a + len; if (a1 - b < 0.55) b = a1;
        seg(a + 0.014, b - 0.014, k * ch + 0.01, (k + 1) * ch - 0.012, thick, pal[(r() * pal.length) | 0]);
        a = b;
      }
    }
    seg(a0 - 0.06, a1 + 0.06, TH, TH + 0.1, thick + 0.16, C.stoneL); // mũ tường
  }
  blockWall(-10.75, -25, -4.0, -25, 0.5, 11); blockWall(4.0, -25, 10.75, -25, 0.5, 12);
  blockWall(11, -62.25, 11, -24.75, 0.5, 14); blockWall(-11, -62.25, -11, -43.0, 0.5, 15); blockWall(-11, -37.0, -11, -24.75, 0.5, 16);
  // tầng nền chính điện nới ra ±14.5: tường chắn bước ra ở z=-62, tường hai bên (chừa hai bậc bên), phía sau không có tường — tầng nền chạy sát mặt trong tường bao (z=-83.7)
  blockWall(10.75, -62, 14.75, -62, 0.5, 17); blockWall(-14.75, -62, -10.75, -62, 0.5, 18);
  blockWall(14.5, -62.25, 14.5, -69.8, 0.5, 19); blockWall(14.5, -74.2, 14.5, -83.7, 0.5, 20);
  blockWall(-14.5, -62.25, -14.5, -69.8, 0.5, 21); blockWall(-14.5, -74.2, -14.5, -83.7, 0.5, 22);
  function balustrade(x0, z0, x1, z1, first, last) { // lan can đá thấp: trụ đầu nụ sen, thanh trên, chấn song
    const alongX = Math.abs(x1 - x0) >= Math.abs(z1 - z0), len = Math.abs(alongX ? x1 - x0 : z1 - z0);
    const n = Math.max(1, Math.round(len / 2.2)), sp = len / n, yb = TH + 0.1;
    const at = (t) => (alongX ? [x0 + (x1 - x0) * t, z0] : [x0, z0 + (z1 - z0) * t]);
    for (let i = 0; i <= n; i++) {
      if ((i === 0 && !first) || (i === n && !last)) continue;
      const [px, pz] = at(i / n), big = i === 0 || i === n;
      box(S, px, yb + 0.43, pz, big ? 0.3 : 0.24, 0.86, big ? 0.3 : 0.24, C.stoneL); bud(S, px, yb + 0.86, pz, big ? 1.3 : 1.0, C.stoneL);
    }
    for (let i = 0; i < n; i++) {
      const [ax, az] = at((i + 0.5) / n), l = sp - 0.26;
      if (alongX) { box(S, ax, yb + 0.7, az, l, 0.1, 0.16, C.stoneL); box(S, ax, yb + 0.18, az, l, 0.2, 0.18, C.stone); } else { box(S, ax, yb + 0.7, az, 0.16, 0.1, l, C.stoneL); box(S, ax, yb + 0.18, az, 0.18, 0.2, l, C.stone); }
      for (let k = -1; k <= 1; k++) box(S, ax + (alongX ? (k * l) / 4 : 0), yb + 0.45, az + (alongX ? 0 : (k * l) / 4), 0.08, 0.36, 0.08, C.stoneL);
    }
  }
  balustrade(-11, -25, -4.45, -25, true, true); balustrade(4.45, -25, 11, -25, true, true);
  balustrade(11, -25, 11, -62, false, true); balustrade(-11, -62, -11, -43.3, false, true); balustrade(-11, -36.7, -11, -25, true, false);
  balustrade(11, -62, 14.5, -62, false, true); balustrade(-11, -62, -14.5, -62, false, true);
  balustrade(14.5, -62, 14.5, -69.5, false, true); balustrade(14.5, -74.5, 14.5, -83.4, true, true);
  balustrade(-14.5, -62, -14.5, -69.5, false, true); balustrade(-14.5, -74.5, -14.5, -83.4, true, true);
  function stairs(x, z, yaw, hw) { // 6 bậc nâng 1.2 m trên 2 m (bám G.heightAt); gốc ở giữa chân bậc, bậc đi lên theo -z cục bộ
    placed(S, x, 0, z, yaw, (B) => {
      for (let k = 0; k < 6; k++) {
        const za = -k / 3, zb = -(k + 1) / 3, top = 0.1 + 0.2 * k;
        boxMM(B, -hw, 0, zb, hw, top, za, k % 2 ? C.stoneL : 0xb9ae9b);
        for (const s of [-1, 1]) boxMM(B, s * hw, 0, zb, s * (hw + 0.3), top + 0.58, za, C.stone); // má bậc xếp theo từng bậc
      }
      for (const s of [-1, 1]) {
        sbox(B, [s * (hw + 0.15), 0.6, 0], [s * (hw + 0.15), 1.8, -2], 0.42, 0.18, C.stoneL, 0.02); // mũ má bậc nghiêng theo dốc
        box(B, s * (hw + 0.15), 0.62, -0.15, 0.32, 1.24, 0.3, C.stoneL); bud(B, s * (hw + 0.15), 1.24, -0.15, 1.3, C.stoneL); // trụ đầu bậc
      }
    });
  }
  stairs(0, -23, 0, 4); stairs(-13, -40, -PI / 2, 3);
  stairs(16.5, -72, PI / 2, 2.2); stairs(-16.5, -72, -PI / 2, 2.2); // hai bậc bên lên tầng nền chính điện (bậc đi lên về phía tầng nền)

  // =====================================================================
  //  4. SÂN LINH THÚ: 10 con trên bệ sen (sư tử, voi, tê giác, trâu, ngựa), mỗi loài một cặp
  // =====================================================================
  function rectPetals(B, hx, hz, y, nz, nx, len, wid, tilt, color) { // cánh sen quanh bệ chữ nhật
    const st = Math.sin(tilt), ct = Math.cos(tilt);
    for (let i = 0; i < nz; i++) { const z = ((i + 0.5) / nz - 0.5) * 2 * hz; for (const s of [-1, 1]) B.add(CONE[4], color, { p: [s * (hx + (st * len) / 2), y + (ct * len) / 2, z], s: [wid * 0.45, len, wid], r: [0, 0, -s * tilt] }); }
    for (let i = 0; i < nx; i++) { const x = ((i + 0.5) / nx - 0.5) * 2 * hx; for (const s of [-1, 1]) B.add(CONE[4], color, { p: [x, y + (ct * len) / 2, s * (hz + (st * len) / 2)], s: [wid, len, wid * 0.45], r: [s * tilt, 0, 0] }); }
  }
  function lotusBase(B, c) { // bệ hoa sen 1.2 × 1.9, cao 0.36
    box(B, 0, 0.06, 0, 1.16, 0.12, 1.86, c.b);
    box(B, 0, 0.19, 0, 0.9, 0.14, 1.6, c.a);
    rectPetals(B, 0.5, 0.86, 0.1, 5, 3, 0.26, 0.34, 0.72, c.d);   // vòng cánh lớn
    rectPetals(B, 0.4, 0.78, 0.2, 5, 2, 0.24, 0.3, 0.3, c.a);      // vòng cánh nhỏ dựng hơn
    box(B, 0, 0.3, 0, 0.78, 0.06, 1.46, c.b);
  }
  const ANI = {
    sutu(T2, c) { // sư tử phục: bờm xoăn, miệng há
      ell(T2, 0, 0.36, -0.12, 0.34, 0.30, 0.60, c.a); ell(T2, 0, 0.27, -0.52, 0.35, 0.25, 0.32, c.a);
      for (const s of [-1, 1]) {
        ell(T2, s * 0.29, 0.17, -0.48, 0.12, 0.16, 0.28, c.b); box(T2, s * 0.27, 0.045, -0.16, 0.13, 0.09, 0.24, c.d);
        box(T2, s * 0.17, 0.09, 0.40, 0.13, 0.16, 0.64, c.a); box(T2, s * 0.17, 0.055, 0.78, 0.16, 0.11, 0.2, c.d);
        ellS(T2, s * 0.16, 0.97, 0.42, 0.05, 0.05, 0.03, c.b); box(T2, s * 0.085, 0.83, 0.655, 0.045, 0.028, 0.04, c.e); box(T2, s * 0.085, 0.865, 0.64, 0.1, 0.035, 0.07, c.b);
        cone(T2, 4, s * 0.055, 0.59, 0.77, 0.035, 0.07, 0xe8dfca, { r: [PI, 0, 0] });
      }
      branch(T2, [0.1, 0.3, -0.84], [0.34, 0.26, -0.86], 0.045, 0.04, c.b, 5); branch(T2, [0.34, 0.26, -0.86], [0.46, 0.2, -0.66], 0.04, 0.035, c.b, 5);
      T2.add(ICO, c.d, { p: [0.46, 0.2, -0.6], s: [0.07, 0.07, 0.1] });
      ell(T2, 0, 0.58, 0.28, 0.22, 0.28, 0.22, c.a); ell(T2, 0, 0.80, 0.50, 0.18, 0.18, 0.2, c.a);
      box(T2, 0, 0.72, 0.68, 0.19, 0.12, 0.2, c.d); box(T2, 0, 0.61, 0.66, 0.16, 0.05, 0.22, c.b); box(T2, 0, 0.665, 0.67, 0.12, 0.035, 0.18, c.e); box(T2, 0, 0.765, 0.775, 0.08, 0.05, 0.04, c.e);
      const mc = [c.b, c.a, shade(c.a, 1.12)]; // bờm: hai vòng khối xoăn quanh đầu
      for (let i = 0; i < 10; i++) { const a = (i / 10) * PI * 2; T2.add(ICO, mc[i % 3], { p: [Math.sin(a) * 0.28, 0.8 + Math.cos(a) * 0.28, 0.4], s: [0.115, 0.125, 0.085] }); }
      for (let i = 0; i < 12; i++) { const a = ((i + 0.5) / 12) * PI * 2; T2.add(ICO, mc[(i + 1) % 3], { p: [Math.sin(a) * 0.41, 0.8 + Math.cos(a) * 0.41, 0.31], s: [0.13, 0.14, 0.09] }); }
      for (let i = 0; i < 2; i++) T2.add(ICO, mc[i], { p: [0, 0.64, 0.1 - i * 0.28], s: [0.13, 0.1, 0.13] });
    },
    voi(T2, c) { // voi quỳ: tai lớn, vòi cuộn xuống, ngà nhỏ
      ell(T2, 0, 0.5, -0.3, 0.44, 0.4, 0.56, c.a);
      for (const s of [-1, 1]) {
        ell(T2, s * 0.34, 0.22, -0.58, 0.19, 0.22, 0.24, c.b); box(T2, s * 0.26, 0.11, 0.26, 0.22, 0.22, 0.5, c.b); box(T2, s * 0.26, 0.05, 0.56, 0.24, 0.1, 0.2, c.d);
        ell(T2, s * 0.4, 0.88, 0.18, 0.045, 0.3, 0.26, c.b, { r: [0, s * 0.5, 0] }); ell(T2, s * 0.405, 0.86, 0.2, 0.03, 0.2, 0.17, c.d, { r: [0, s * 0.5, 0] }); // tai lớn
        cone(T2, 4, s * 0.14, 0.52, 0.66, 0.06, 0.3, 0xe8dfca, { r: [1.9, 0, 0], p: [s * 0.15, 0.5, 0.74] }); // ngà
        ellS(T2, s * 0.17, 0.82, 0.5, 0.03, 0.03, 0.025, c.e);
      }
      ell(T2, 0, 0.76, 0.32, 0.29, 0.3, 0.28, c.a); ell(T2, 0, 1.0, 0.3, 0.22, 0.12, 0.18, c.a); // đầu và trán nổi
      const tr = [[0, 0.66, 0.55, 0.12], [0, 0.48, 0.68, 0.105], [0, 0.28, 0.76, 0.09], [0, 0.12, 0.82, 0.075], [0, 0.07, 0.86, 0.06], [0, 0.15, 0.92, 0.045]]; // vòi
      for (let i = 0; i + 1 < tr.length; i++) branch(T2, tr[i], tr[i + 1], tr[i][3], tr[i + 1][3], c.a, 6);
      branch(T2, [0, 0.52, -0.84], [0.06, 0.28, -0.9], 0.04, 0.03, c.b, 5);
    },
    tegiac(T2, c) { // tê giác: sừng trên mũi, các nếp da như giáp
      ell(T2, 0, 0.46, -0.22, 0.42, 0.38, 0.62, c.a);
      for (const z of [0.24, -0.46]) T2.add(TORUS, c.b, { p: [0, 0.46, z], s: [0.435, 0.405, 0.435] }); // nếp da quanh thân
      for (const s of [-1, 1]) {
        ell(T2, s * 0.3, 0.2, -0.58, 0.18, 0.22, 0.26, c.b); box(T2, s * 0.25, 0.11, 0.3, 0.22, 0.22, 0.5, c.b); box(T2, s * 0.25, 0.05, 0.58, 0.24, 0.1, 0.2, c.d);
        cone(T2, 4, s * 0.15, 0.7, 0.3, 0.09, 0.17, c.b, { r: [0, 0, -s * 0.5] }); ellS(T2, s * 0.2, 0.56, 0.6, 0.03, 0.025, 0.025, c.e);
      }
      ell(T2, 0, 0.5, 0.58, 0.22, 0.2, 0.34, c.a, { r: [0.2, 0, 0] }); ell(T2, 0, 0.44, 0.84, 0.17, 0.14, 0.12, c.a);
      T2.add(CONE[6], shade(c.a, 1.2), { p: [0, 0.79, 0.88], s: [0.15, 0.42, 0.15], r: [0.55, 0, 0] }); // sừng chính
      T2.add(CONE[6], shade(c.a, 1.2), { p: [0, 0.74, 0.62], s: [0.1, 0.2, 0.1], r: [0.3, 0, 0] });      // sừng nhỏ
      box(T2, 0, 0.36, 0.9, 0.14, 0.035, 0.1, c.e);
      branch(T2, [0, 0.4, -0.84], [0.04, 0.24, -0.9], 0.04, 0.025, c.b, 5);
    },
    trau(T2, c) { // trâu: đầu rộng, sừng cong ra sau
      ell(T2, 0, 0.44, -0.24, 0.4, 0.36, 0.62, c.a); ell(T2, 0, 0.72, 0.1, 0.22, 0.14, 0.26, c.a);
      for (const s of [-1, 1]) {
        ell(T2, s * 0.3, 0.2, -0.56, 0.17, 0.2, 0.26, c.b); box(T2, s * 0.22, 0.1, 0.34, 0.17, 0.2, 0.46, c.b); box(T2, s * 0.22, 0.05, 0.62, 0.2, 0.1, 0.18, c.d);
        ellS(T2, s * 0.27, 0.68, 0.5, 0.12, 0.035, 0.06, c.b, { r: [0, 0, s * 0.3] }); box(T2, s * 0.17, 0.64, 0.66, 0.045, 0.03, 0.04, c.e); box(T2, s * 0.06, 0.52, 0.935, 0.05, 0.04, 0.02, c.e);
        const h = [[s * 0.17, 0.72, 0.55, 0.06], [s * 0.4, 0.8, 0.52, 0.05], [s * 0.58, 0.92, 0.4, 0.04], [s * 0.6, 1.06, 0.28, 0.026], [s * 0.5, 1.14, 0.2, 0.01]]; // sừng cong
        for (let i = 0; i + 1 < h.length; i++) branch(T2, h[i], h[i + 1], h[i][3], h[i + 1][3], c.b, 5);
      }
      ell(T2, 0, 0.58, 0.4, 0.2, 0.22, 0.22, c.a); ell(T2, 0, 0.58, 0.62, 0.19, 0.19, 0.26, c.a); box(T2, 0, 0.5, 0.86, 0.24, 0.16, 0.14, c.d);
      branch(T2, [0, 0.4, -0.84], [-0.08, 0.2, -0.9], 0.04, 0.03, c.b, 5);
    },
    ngua(T2, c) { // ngựa quỳ: cổ dày cong, bờm dọc gáy, đầu dài chúi xuống, đuôi xoã
      ell(T2, 0, 0.4, -0.26, 0.3, 0.32, 0.58, c.a); ell(T2, 0, 0.56, 0.16, 0.27, 0.32, 0.26, c.a);
      for (const s of [-1, 1]) {
        ell(T2, s * 0.27, 0.2, -0.52, 0.14, 0.2, 0.27, c.b); box(T2, s * 0.14, 0.09, 0.42, 0.12, 0.17, 0.58, c.a); box(T2, s * 0.14, 0.045, 0.74, 0.13, 0.09, 0.15, c.e);
        cone(T2, 4, s * 0.075, 1.34, 0.46, 0.07, 0.18, c.b, { r: [-0.3, 0, 0] }); box(T2, s * 0.12, 1.25, 0.55, 0.035, 0.035, 0.05, c.e); box(T2, s * 0.045, 1.0, 0.87, 0.035, 0.03, 0.03, c.e);
      }
      branch(T2, [0, 0.62, 0.14], [0, 1.16, 0.42], 0.23, 0.15, c.a, 6); ell(T2, 0, 0.9, 0.28, 0.17, 0.3, 0.18, c.a, { r: [0.55, 0, 0] });
      for (let i = 0; i < 6; i++) { const t = i / 5; box(T2, 0, 0.76 + 0.44 * t, 0.04 + 0.3 * t, 0.07, 0.16, 0.1, c.b, { r: [-0.55, 0, 0] }); }
      ell(T2, 0, 1.2, 0.6, 0.135, 0.16, 0.27, c.a, { r: [0.62, 0, 0] }); box(T2, 0, 1.04, 0.8, 0.13, 0.12, 0.17, c.d, { r: [0.62, 0, 0] }); box(T2, 0, 1.36, 0.5, 0.05, 0.13, 0.07, c.b, { r: [0.3, 0, 0] });
      branch(T2, [0, 0.45, -0.84], [0, 0.25, -0.94], 0.07, 0.06, c.b, 5); branch(T2, [0, 0.25, -0.94], [0.02, 0.06, -0.9], 0.06, 0.03, c.b, 5);
    },
  };
  L.animals.forEach((a, i) => {
    const base = K.sand[(i >> 1) % K.sand.length], f = 0.96 + rng() * 0.08;
    const c = { a: shade(base, f), b: shade(base, 0.82 * f), d: shade(base, 1.14 * f), e: 0x4a4034 };
    placed(S, a.x, TH, a.z, a.yaw, (B) => { lotusBase(B, c); sub(B, 0, 0.33, 0, (T2) => ANI[a.kind](T2, c)); });
  });
  stoneLantern(-5.7, -34.0, TH, true); stoneLantern(5.7, -34.0, TH, true); // hai đèn đá hai bên sân linh thú

  // =====================================================================
  //  5. TÍCH THIỆN AM + THÁP CỬU PHẨM LIÊN HOA (nhóm riêng, xoay quanh trục)
  // =====================================================================
  const A = L.am, y0 = A.floorY, yT = A.wallTop, zcA = (A.z0 + A.z1) / 2;
  {
    flags(-5.7, -56.6, 5.7, -45.4, y0 + 0.012, 1.425, 1.4, K.floorRed, 0x5a2a1c); // nền gạch đỏ trong am
    boxMM(S, A.x0, y0, A.z0, A.x1, yT, A.z0 + 0.4, K.plaster);                      // tường sau
    boxMM(S, A.x0, y0, A.z0, A.x0 + 0.3, yT, A.frontZ - 0.2, K.plaster); boxMM(S, A.x1 - 0.3, y0, A.z0, A.x1, yT, A.frontZ - 0.2, K.plaster); // hai tường bên
    boxMM(S, A.x0 - 0.06, y0, A.z0 - 0.06, A.x1 + 0.06, y0 + 0.36, A.z0 + 0.1, C.stoneD);                // chân tường
    boxMM(S, A.x0 - 0.06, y0, A.z0, A.x0 + 0.06, y0 + 0.36, A.frontZ - 0.2, C.stoneD); boxMM(S, A.x1 - 0.06, y0, A.z0, A.x1 + 0.06, y0 + 0.36, A.frontZ - 0.2, C.stoneD);
    boxMM(S, A.x0 - 0.05, yT - 0.5, A.z0 - 0.05, A.x1 + 0.05, yT, A.z0 + 0.45, C.woodD);                  // dải gỗ dưới mái
    boxMM(S, A.x0 - 0.05, yT - 0.5, A.z0, A.x0 + 0.35, yT, A.frontZ - 0.15, C.woodD); boxMM(S, A.x1 - 0.35, yT - 0.5, A.z0, A.x1 + 0.05, yT, A.frontZ - 0.15, C.woodD);
    boxMM(S, -5.6, y0 + 0.4, A.z0 + 0.4, 5.6, y0 + 4.9, A.z0 + 0.44, 0x5e1a12);                           // phông đỏ sau
    boxMM(S, -5.6, y0 + 4.82, A.z0 + 0.4, 5.6, y0 + 4.9, A.z0 + 0.46, C.gold); boxMM(S, -5.6, y0 + 0.4, A.z0 + 0.4, 5.6, y0 + 0.48, A.z0 + 0.46, C.gold);
    for (const wx of [-6.02, -5.68, 5.68]) { // cửa sổ tròn trên tường bên: hai mặt tường tây, mặt trong tường đông
      ring(S, wx, y0 + 3.5, zcA, 0.72, 0.09, C.woodD, [0, PI / 2, 0], 1, 12);
      box(S, wx, y0 + 3.5, zcA, 0.06, 1.44, 0.06, C.woodD); box(S, wx, y0 + 3.5, zcA, 0.06, 0.06, 1.44, C.woodD);
    }
    for (const x of A.frontCols) columnInto(S, F, x, A.frontZ, y0, yT - y0 - 0.3, 0.27, false);       // 4 cột cái đỏ phía trước
    box(S, 0, yT - 0.15, A.frontZ, 12.3, 0.36, 0.34, C.woodD);                                         // xà ngang cửa
    for (const x of [-5.0, -1.9, 1.9, 5.0]) box(S, x, yT - 0.15, zcA, 0.28, 0.32, A.z1 - A.z0 - 0.5, C.woodD); // xà dọc
    boxMM(S, -1.7, yT - 1.1, A.frontZ + 0.1, 1.7, yT - 0.3, A.frontZ + 0.2, C.woodD);
    addSign(['TÍCH THIỆN AM'], 3.1, 0.7, 0, yT - 0.72, A.frontZ + 0.215, 0, { ppu: 260 });
    for (const x of [-3.45, 3.45]) hangLanternInto(S, LB, x, yT - 0.35, A.frontZ + 0.6, 0.45);        // đèn lồng treo trước hiên
    for (const x of [-5.0, 5.0]) hangLanternInto(S, LB, x, yT - 0.35, zcA, 0.5, 1.05);                 // đèn lồng treo trong am
    // mái hai tầng
    addRoof(S, 0, yT, zcA, 13.8, 13.0, 1.9, { curl: 0.85, sag: 0.1, seg: 8, metal: M });
    box(S, 0, yT + 1.6, zcA, 7.4, 1.5, 6.6, C.ochreD);
    for (const sz of [-1, 1]) for (let k = -2; k <= 2; k++) box(S, k * 1.5, yT + 1.65, zcA + sz * 3.33, 0.5, 0.9, 0.06, C.wood);
    addRoof(S, 0, yT + 2.3, zcA, 9.6, 8.4, 1.6, { curl: 0.7, sag: 0.08, seg: 7, pearl: true, metal: M });
    // bàn thờ sau, lư hương, nến, hoa
    boxMM(S, -2.8, y0, -56.55, 2.8, y0 + 0.86, -55.75, 0x7a2418); boxMM(S, -2.9, y0 + 0.86, -56.6, 2.9, y0 + 0.96, -55.7, 0x5a1a10); boxMM(S, -2.82, y0 + 0.74, -55.77, 2.82, y0 + 0.8, -55.73, C.gold);
    boxMM(S, -2.5, y0 + 0.12, -55.76, 2.5, y0 + 0.62, -55.74, C.goldD);
    col.box(-2.9, -56.6, 2.9, -55.7, 'altar');
    incenseBowl(0, y0 + 0.96, -56.1, 1.2); candle(-1.7, y0 + 0.96, -56.1); candle(1.7, y0 + 0.96, -56.1);
    for (const sx of [-1, 1]) { S.add(lathe2([[0, 0], [0.1, 0.02], [0.08, 0.2], [0.05, 0.32], [0.08, 0.38]], 8), 0x3a64a0, { p: [sx * 0.95, y0 + 0.96, -56.1] }); for (let i = 0; i < 5; i++) ellS(S, sx * 0.95 + Math.cos(i * 1.3) * 0.12, y0 + 1.4 + (i % 2) * 0.08, -56.1 + Math.sin(i * 1.3) * 0.1, 0.07, 0.07, 0.07, 0xf5d03a); }
    W.smokeSpots && W.smokeSpots.push([0, y0 + 1.5, -56.1]);
  }
  function buildCuuPham() { // 9 tầng bát giác sơn son thếp vàng, thu nhỏ dần, ô khám tượng nhỏ; gốc nhóm ở tâm trục, ngang sàn
    const B = U.batch(), red = K.lacquer, redD = K.lacquerD, gold = C.gold, goldD = C.goldD, dark = 0x4a1810, wood = 0x5a2418;
    oct(B, 0, 0, 0, 1.78, 0.26, redD); oct(B, 0, 0.26, 0, 1.8, 0.05, gold);
    let y = 0.31;
    for (let i = 0; i < 9; i++) {
      const k = i / 8, rb = U.lerp(1.5, 0.6, k), hb = U.lerp(0.54, 0.44, k), ap = rb * 0.9239, u = rb * 0.55;
      octO(B, 0, y, 0, rb, rb, hb, red);
      for (let f = 0; f < 8; f++) {
        const a = (f * PI) / 4, sa = Math.sin(a), ca = Math.cos(a);
        B.add(BOX, dark, { p: [sa * (ap + 0.012), y + hb * 0.52, ca * (ap + 0.012)], s: [u, hb * 0.6, 0.04], r: [0, a, 0] });        // ô khám
        B.add(BOX, gold, { p: [sa * (ap + 0.035), y + hb * 0.41, ca * (ap + 0.035)], s: [u * 0.3, hb * 0.26, 0.03], r: [0, a, 0] });   // thân tượng nhỏ
        B.add(OCTA, gold, { p: [sa * (ap + 0.04), y + hb * 0.62, ca * (ap + 0.04)], s: u * 0.1 });                                     // đầu tượng
      }
      oct(B, 0, y + hb, 0, rb + 0.1, 0.05, goldD);                                                                                      // đĩa mái vàng
      petalRing(B, 0, y + hb + 0.03, 0, rb * 0.95, 8, 0.2 + rb * 0.16, rb * 0.72, 0.95, gold, 0, 0.35);                               // vòng cánh sen vàng
      petalRing(B, 0, y + hb + 0.03, 0, rb * 0.93, 8, 0.15 + rb * 0.12, rb * 0.5, 0.95, red, PI / 8, 0.35);                            // vòng cánh sen son xen kẽ
      y += hb;
    }
    B.add(lathe2([[0, 0], [0.24, 0], [0.27, 0.04], [0.13, 0.1], [0.15, 0.2], [0.21, 0.3], [0.13, 0.4], [0.05, 0.5], [0, 0.54]], 8), gold, { p: [0, y + 0.05, 0] }); // đỉnh bình bát
    // vòng tay đẩy ở độ cao ngực: tám nan toả + vành bát giác
    const hy = 0.56, hr = 1.9;
    for (let f = 0; f < 8; f++) {
      const a = (f * PI) / 4, b = a + PI / 8, rc = hr * 0.9239;
      B.add(BOX, wood, { p: [Math.sin(a) * 1.65, hy, Math.cos(a) * 1.65], s: [0.09, 0.09, 0.62], r: [0, a, 0] });
      B.add(BOX, wood, { p: [Math.sin(b) * rc, hy, Math.cos(b) * rc], s: [0.08, 0.08, 1.52], r: [0, b + PI / 2, 0] });
      B.add(OCTA, gold, { p: [Math.sin(a) * hr, hy, Math.cos(a) * hr], s: 0.08 });
    }
    return B.mesh(G.mats.gold, { cast: true, receive: true, dynamic: true });
  }
  {
    const tw = new THREE.Group(); tw.name = 'cuuPham'; tw.position.set(A.tower.x, y0, A.tower.z);
    tw.add(buildCuuPham()); scene.add(tw);
    if (W.ext && W.ext.cuuPham) W.ext.cuuPham.tower = tw;
  }

  // =====================================================================
  //  6. ĐIỆN QUAN ÂM (mở về phía nam) + tượng Quan Âm nghìn mắt nghìn tay
  // =====================================================================
  const Q = L.quanAm, qzc = (Q.z0 + Q.z1) / 2, qxc = (Q.x0 + Q.x1) / 2, altarY = y0 + 0.7;
  {
    flags(Q.x0 + 0.3, Q.z0 + 0.4, Q.x1 - 0.3, Q.z1, y0 + 0.012, 0.95, 0.95, K.floorRed, 0x5a2a1c);
    boxMM(S, Q.x0, y0, Q.z0, Q.x1, Q.wallTop, Q.z0 + 0.4, K.plaster);
    boxMM(S, Q.x0, y0, Q.z0, Q.x0 + 0.3, Q.wallTop, Q.z1, K.plaster); boxMM(S, Q.x1 - 0.3, y0, Q.z0, Q.x1, Q.wallTop, Q.z1, K.plaster);
    boxMM(S, Q.x0 - 0.05, y0, Q.z0 - 0.05, Q.x1 + 0.05, y0 + 0.3, Q.z0 + 0.1, C.stoneD);
    boxMM(S, Q.x0 - 0.05, y0, Q.z0, Q.x0 + 0.05, y0 + 0.3, Q.z1, C.stoneD); boxMM(S, Q.x1 - 0.05, y0, Q.z0, Q.x1 + 0.05, y0 + 0.3, Q.z1, C.stoneD);
    boxMM(S, Q.x0 - 0.04, Q.wallTop - 0.4, Q.z0 - 0.04, Q.x1 + 0.04, Q.wallTop, Q.z0 + 0.44, C.woodD);
    boxMM(S, Q.x0 - 0.04, Q.wallTop - 0.4, Q.z0, Q.x0 + 0.34, Q.wallTop, Q.z1 + 0.1, C.woodD); boxMM(S, Q.x1 - 0.34, Q.wallTop - 0.4, Q.z0, Q.x1 + 0.04, Q.wallTop, Q.z1 + 0.1, C.woodD);
    boxMM(S, Q.x0 + 0.3, y0 + 0.3, Q.z0 + 0.4, Q.x1 - 0.3, Q.wallTop - 0.5, Q.z0 + 0.44, 0x5e1a12);               // phông đỏ sau tượng
    for (const x of [Q.x0 + 0.15, Q.x1 - 0.15]) columnInto(S, F, x, Q.z1 + 0.2, y0, Q.wallTop - y0 - 0.35, 0.22, false); // hai cột cái trước điện
    box(S, qxc, Q.wallTop - 0.2, Q.z1 + 0.2, Q.x1 - Q.x0 + 0.5, 0.32, 0.3, C.woodD);
    boxMM(S, qxc - 1.3, Q.wallTop - 1.12, Q.z1 + 0.15, qxc + 1.3, Q.wallTop - 0.45, Q.z1 + 0.25, C.woodD);
    addSign(['ĐIỆN QUAN ÂM'], 2.4, 0.56, qxc, Q.wallTop - 0.8, Q.z1 + 0.265, 0, { ppu: 260 });
    for (const x of [Q.x0 + 1.1, Q.x1 - 1.1]) hangLanternInto(S, LB, x, Q.wallTop - 0.4, Q.z1 + 0.7, 0.4, 0.9);
    addRoof(S, qxc, Q.wallTop, qzc, 7.9, 4.8, 1.5, { ry: PI / 2, curl: 0.55, sag: 0.1, seg: 8, finial: true, metal: M });
    // bệ thờ
    boxMM(S, 7.6, y0, -53.6, 9.6, altarY - 0.1, -51.0, 0x7a2418); boxMM(S, 7.55, altarY - 0.1, -53.65, 9.65, altarY, -50.95, C.gold);
    boxMM(S, 7.8, y0 + 0.12, -51.01, 9.4, altarY - 0.2, -50.97, C.goldD);
    incenseBowl(8.6, altarY, -51.35, 1.0); candle(7.85, altarY, -51.3); candle(9.35, altarY, -51.3);
    for (const sx of [-1, 1]) for (let i = 0; i < 5; i++) ellS(S, 8.6 + sx * 0.72 + Math.cos(i * 1.26) * 0.12, altarY + 0.1 + (i === 4 ? 0.08 : 0), -51.4 + Math.sin(i * 1.26) * 0.1, 0.07, 0.07, 0.07, [0xf39a2a, 0xf5d03a, 0x7cbf4a, 0xd8322a, 0xf39a2a][i]);
    W.smokeSpots && W.smokeSpots.push([8.6, altarY + 0.55, -51.35]);
  }
  function buildQuanAm() { // tượng cao ~2.6 m, đứng trên đài sen; quầng nghìn tay xoè như đuôi công
    const B = U.batch(), g1 = 0xd9a84a, g2 = 0xb98a35, g3 = 0xe8c06a, hair = 0x5a4020;
    cyl(B, 0, 0.04, 0, 0.5, 0.52, 0.08, g2, 14); // đài sen hai vòng cánh
    petalRing(B, 0, 0.04, 0, 0.42, 14, 0.3, 0.26, 1.0, g2, 0, 0.4); petalRing(B, 0, 0.1, 0, 0.32, 12, 0.34, 0.24, 0.45, g1, 0.26, 0.4);
    cyl(B, 0, 0.33, 0, 0.3, 0.32, 0.06, g2, 14);
    B.add(lathe2([[0, 0.34], [0.44, 0.34], [0.46, 0.4], [0.42, 0.62], [0.36, 0.9], [0.27, 1.18], [0.21, 1.38], [0.2, 1.5], [0.24, 1.66], [0.28, 1.82], [0.24, 1.92], [0.14, 2.0], [0.1, 2.04], [0.1, 2.12]], 14), g1, { s: [1, 1, 0.78] }); // thân áo
    for (let i = 0; i < 5; i++) B.add(BOX, i % 2 ? g2 : g3, { p: [(i - 2) * 0.1, 0.62 - Math.abs(i - 2) * 0.03, 0.31], s: [0.045, 0.5 - Math.abs(i - 2) * 0.05, 0.03] }); // nếp áo
    ring(B, 0, 1.78, 0.05, 0.21, 0.025, g3, [PI / 2.4, 0, 0], 1, 12); ring(B, 0, 1.38, 0.0, 0.215, 0.03, g2, [PI / 2, 0, 0], 1, 12); // chuỗi anh lạc, đai lưng
    ellS(B, 0, 1.7, 0.2, 0.04, 0.05, 0.03, 0xe05a3a);
    ell(B, 0, 2.2, 0.01, 0.16, 0.19, 0.17, g1); cyl(B, 0, 2.04, 0, 0.08, 0.1, 0.12, g1, 8); // đầu và cổ
    for (const s of [-1, 1]) {
      box(B, s * 0.065, 2.225, 0.165, 0.05, 0.012, 0.02, 0x4a2e12); box(B, s * 0.065, 2.265, 0.165, 0.06, 0.01, 0.015, 0x4a2e12); ellS(B, s * 0.17, 2.17, 0.0, 0.025, 0.07, 0.03, g1);
      box(B, s * 0.18, 1.93, -0.02, 0.05, 0.52, 0.13, hair, { r: [0, 0, s * 0.12] }); // tóc/khăn buông vai
      const sh = [s * 0.27, 1.8, 0.0], el = [s * 0.34, 1.52, 0.12], hd = [s * 0.035, 1.62, 0.37]; // hai tay chính chắp trước ngực
      branch(B, sh, el, 0.065, 0.055, g1, 6); branch(B, el, hd, 0.055, 0.045, g1, 6); ellS(B, s * 0.27, 1.82, 0, 0.1, 0.07, 0.09, g1);
    }
    box(B, 0, 2.15, 0.172, 0.03, 0.05, 0.03, g2); box(B, 0, 2.1, 0.178, 0.05, 0.015, 0.02, 0xa0502a); ellS(B, 0, 2.285, 0.165, 0.014, 0.014, 0.01, 0xd04a30); // mũi, miệng, bạch hào
    B.add(BOX, g3, { p: [0, 1.65, 0.38], s: [0.11, 0.22, 0.05], r: [-0.15, 0, 0] }); // bàn tay chắp
    cyl(B, 0, 2.4, 0, 0.17, 0.19, 0.12, g3, 10); petalRing(B, 0, 2.44, 0, 0.12, 5, 0.2, 0.1, 0.12, g3, 0, 0.5); ell(B, 0, 2.62, -0.02, 0.09, 0.09, 0.09, g1); // mão và búi tóc
    cyl(B, 0, 2.2, -0.14, 0.34, 0.34, 0.02, g3, 20, { r: [PI / 2, 0, 0] }); ring(B, 0, 2.2, -0.13, 0.36, 0.03, g1, [0, 0, 0], 1, 20); // quầng sáng sau đầu
    for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; B.add(CONE[4], g3, { p: [Math.sin(a) * 0.46, 2.2 + Math.cos(a) * 0.46, -0.14], s: [0.06, 0.1, 0.03], r: [0, 0, -a] }); }
    // nghìn tay: ba vòng, mỗi vòng một dải tay xoè rộng 300° (chừa phía dưới), mọc từ sau lưng; mỗi bàn tay có một con mắt nhỏ
    const ax = 0.86, cy = 1.75, rings = [[15, 0.4, 0.8, -0.3, g1], [17, 0.76, 1.16, -0.36, g3], [19, 1.1, 1.5, -0.42, g1]];
    for (const [n, r0, r1, z, cc] of rings) {
      for (let i = 0; i < n; i++) {
        const phi = (((i / (n - 1)) * 2 - 1) * PI * 5) / 6, sp = Math.sin(phi), cp = Math.cos(phi), th = Math.atan2(ax * sp, cp);
        { const sg = U.segMatrix(ax * r0 * sp, cy + r0 * cp, z, ax * r1 * sp, cy + r1 * cp, z); B.add(ARM, g2, { s: [1, 1, sg.len], m: sg.m }); }
        const hx = ax * r1 * sp + Math.sin(th) * 0.07, hy = cy + r1 * cp + Math.cos(th) * 0.07;
        // bàn tay mở: lòng bàn tay tròn dẹt (không nhọn), giữa lòng có một con mắt nhỏ
        ell(B, hx, hy, z, 0.06, 0.085, 0.022, cc, { r: [0, 0, -th] });
        ell(B, hx + Math.sin(th) * 0.075, hy + Math.cos(th) * 0.075, z, 0.045, 0.03, 0.018, cc, { r: [0, 0, -th] }); // các ngón khép
        B.add(OCTA, 0x6a3a14, { p: [hx, hy, z + 0.022], s: [0.016, 0.016, 0.01] });
      }
    }
    ring(B, 0, cy, -0.46, 1.62, 0.03, g2, [0, 0, 0], ax, 30); // vành hào quang ngoài (hình trứng)
    return B.mesh(G.mats.gold, { cast: false, receive: true, dynamic: true });
  }
  {
    const st = new THREE.Group(); st.name = 'quanAm'; st.position.set(Q.statue.x, altarY, Q.statue.z);
    st.add(buildQuanAm()); scene.add(st);
    glow(Q.statue.x, altarY + 1.7, Q.statue.z + 0.35, 3.2, [1.0, 0.78, 0.36], false);
    if (W.ext && W.ext.quanAm) W.ext.quanAm.statue = st;
  }

  // =====================================================================
  //  7. THÁP BÁO NGHIÊM: tháp đá bát giác 5 tầng ~15 m, tầng trệt rỗng (điện Văn Thù, cửa ở mặt nam), lối nhiễu tháp, bia, đèn đá
  // =====================================================================
  const BN = L.baoNghiem;
  {
    const bl = K.blue, bd = K.blueD, bL = K.blueL, kx = 1.45, kh = 1.2, fy = BN.floorY; // kx: nở ngang, kh: cao thêm; fy: mặt bệ = sàn điện Văn Thù
    const ao = 1.3 * kx * 0.9239, ai = 1.5, Ro = ao / 0.9239, Ri = ai / 0.9239, dw = 0.65, dh = 2.2; // tầng trệt rỗng: trung đoạn ngoài/trong, nửa rộng và cao cửa
    const jz = ai - (dw - ai * Math.tan(PI / 8));                                                    // chân khung cửa chạm mặt chéo bên trong
    placed(S, BN.x, 0, BN.z, 0, (B) => {
      oct(B, 0, 0, 0, 1.9 * kx, 0.16, bd); oct(B, 0, 0.16, 0, 1.5 * kx, fy - 0.16, bl);               // bệ hai cấp thấp
      const R = [1.3, 1.16, 1.03, 0.91, 0.8].map((v) => v * kx), H = [3.1, 2.0, 1.55, 1.25, 1.1].map((v) => v * kh);
      let y = fy;
      for (let t = 0; t < 5; t++) {
        const r = R[t], h = H[t], ap = r * 0.9239, yc = y + h;
        if (t === 0) { // tường rỗng: vành bát giác có khe cửa ở mặt nam (+z), cao dh; trên cửa là lanh-tô
          const sh = [[dw, ao]], dg = PI / 180;
          for (const d of [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5]) sh.push([Ro * Math.sin(d * dg), Ro * Math.cos(d * dg)]);
          sh.push([-dw, ao], [-dw, jz]);
          for (const d of [-67.5, -112.5, -157.5, -202.5, -247.5, -292.5]) sh.push([Ri * Math.sin(d * dg), Ri * Math.cos(d * dg)]);
          sh.push([dw, jz]);
          B.add(mk(new THREE.ExtrudeGeometry(new THREE.Shape(sh.map((p) => new THREE.Vector2(p[0], -p[1]))), { depth: h, bevelEnabled: false }).rotateX(-PI / 2)), bl, { p: [0, y, 0] });
          B.add(BOX, bl, { p: [0, y + dh + (h - dh) / 2, (ao + jz) / 2], s: [dw * 2 + 0.02, h - dh, ao - jz + 0.02] });                        // mảng tường trên cửa
          B.add(BOX, 0x4a3a30, { p: [0, y + dh + 0.1, ao + 0.04], s: [dw * 2 + 0.34, 0.3, 0.3] });                                           // lanh-tô gỗ sẫm
          for (const sx of [-1, 1]) B.add(BOX, 0x5a2418, { p: [sx * (dw + 0.02), y + dh / 2, (ao + jz) / 2], s: [0.1, dh, ao - jz + 0.04] }); // khung cửa
          oct(B, 0, yc - 0.14, 0, 1.8, 0.12, bd);                                                                                            // trần phòng
        } else { oct(B, 0, y, 0, r + 0.08, 0.18, bd); octO(B, 0, y + 0.18, 0, r, r, h - 0.18, bl); } // gờ chân tầng + thân
        for (let f = 0; f < 8; f++) { // dải ô chạm: khung sáng – ô tối – nụ hoa văn
          if (t === 0 && f === 0) continue;
          const a = (f * PI) / 4, sa = Math.sin(a), ca = Math.cos(a), pw = r * 0.6, py = y + 0.18 + (h - 0.18) * (t === 0 ? 0.68 : 0.5), ph = (h - 0.18) * (t === 0 ? 0.3 : 0.5);
          B.add(BOX, bL, { p: [sa * (ap + 0.015), py, ca * (ap + 0.015)], s: [pw, ph, 0.04], r: [0, a, 0] });
          B.add(BOX, bd, { p: [sa * (ap + 0.03), py, ca * (ap + 0.03)], s: [pw * 0.82, ph * 0.78, 0.03], r: [0, a, 0] });
          B.add(BOX, bL, { p: [sa * (ap + 0.045), py, ca * (ap + 0.045)], s: [pw * 0.22, pw * 0.22, 0.03], r: [0, a, PI / 4], order: 'YXZ' });
        }
        if (t === 0) { // ô khám nhỏ đặt tượng ở mặt bắc (cửa chính đã chuyển sang mặt nam)
          const zn = -(ap + 0.02);
          B.add(BOX, 0x3e444c, { p: [0, y + 1.0, zn], s: [0.62, 1.0, 0.06] }); B.add(CYL, 0x3e444c, { p: [0, y + 1.5, zn], s: [0.31, 0.06, 0.31], r: [PI / 2, 0, 0] });
          B.add(BOX, bL, { p: [0, y + 0.72, zn - 0.04], s: [0.2, 0.44, 0.06] }); ellS(B, 0, y + 1.02, zn - 0.04, 0.07, 0.08, 0.05, bL);
        }
        octO(B, 0, yc, 0, r + 0.32, r + 0.02, 0.1, bd);          // mặt dưới mái chìa
        oct(B, 0, yc + 0.1, 0, r + 0.36, 0.08, bl);              // bờ mái
        octO(B, 0, yc + 0.18, 0, (R[t + 1] || 0.55 * kx) + 0.05, r + 0.32, 0.2, bd); // mái dốc thấp
        petalRing(B, 0, yc + 0.1, 0, r + 0.33, 8, 0.28, 0.1, 0.8, bL, PI / 8, 1.0); // đầu đao vút ở tám góc
        y = yc + 0.38;
      }
      // đỉnh: đế sen, bầu, ngọn
      oct(B, 0, y, 0, 0.5 * kx, 0.12, bd); petalRing(B, 0, y + 0.12, 0, 0.3 * kx, 8, 0.28 * kx, 0.2 * kx, 0.5, bl, 0, 0.5);
      B.add(lathe2([[0, 0], [0.28, 0.02], [0.4, 0.2], [0.3, 0.44], [0.17, 0.54], [0.26, 0.74], [0.28, 0.94], [0.17, 1.1], [0.06, 1.24], [0, 1.4]].map((p) => [p[0] * 1.3, p[1] * 1.5]), 10), bl, { p: [0, y + 0.1, 0] });
    });
    // ba bậc lên cửa (mặt nam) và bát hương đồng bên cửa
    for (let i = 0; i < 3; i++) { const top = (fy * (i + 1)) / 3; box(S, BN.x, top / 2, BN.z + 2.85 - i * 0.3, 2.3, top, 0.3, C.stoneL); }
    const bx = BN.x - 1.4, bz = BN.z + 2.5;
    box(S, bx, 0.2, bz, 0.5, 0.4, 0.5, C.stoneD); incenseBowl(bx, 0.4, bz, 1.5); col.circle(bx, bz, 0.34, 'stonelamp');
    W.smokeSpots && W.smokeSpots.push([bx, 1.2, bz]);
    // lối nhiễu tháp lát đá hình vành khăn (từ 3.1 đến 4.4, đi giữa lối ở bán kính 3.8)
    const ringTile = (r0, r1, a0, a1) => F.add(mk(new THREE.RingGeometry(r0, r1, 2, 1, a0, a1 - a0).rotateX(-PI / 2)), 0xcdb996, { p: [BN.x, 0.026, BN.z], j: 0.07 });
    F.add(mk(new THREE.RingGeometry(2.45, 4.46, 48, 1).rotateX(-PI / 2)), 0x6a6050, { p: [BN.x, 0.016, BN.z], j: 0 });
    [[3.1, 3.75, 32], [3.75, 4.4, 40]].forEach(([r0, r1, n], ri) => { for (let i = 0; i < n; i++) { const a0 = ((i + (ri % 2) * 0.5) / n) * PI * 2, d = (PI * 2) / n; ringTile(r0 + 0.03, r1 - 0.03, a0 + 0.012, a0 + d - 0.012); } });
    G.cam.blockers.push(new THREE.Box3(new THREE.Vector3(BN.x - 2.0, 0, BN.z - 2.0), new THREE.Vector3(BN.x + 2.0, 16, BN.z + 2.0)));
    stele(-19.0, -32.4, 0, ['THÁP BÁO NGHIÊM', 'phỏng theo chùa Bút Tháp'], 1.1);
    stoneLantern(-12.6, -47.5, 0, true); stoneLantern(-19.8, -47.3, 0, true); // hai đèn đá ngoài vành nhiễu tháp
  }

  // =====================================================================
  //  8. VƯỜN THÁP: chín ngôi tháp gạch/đá, ghế đá, bàn thờ nhỏ, cây, đèn đá, bia
  // =====================================================================
  const VT = L.vuonThap;
  function stupa(s, idx) { // tháp nhiều tầng vuông hoặc bát giác, mái chìa, đỉnh sen – bầu
    const oc = s.main || idx % 2 === 1, br = K.brick[idx % 3], st = s.main ? 0xb7ab96 : 0xaea28d, n = s.main ? 5 : s.h > 3.9 ? 4 : 3, fin = s.main ? 1.5 : 1.0;
    const r = oc ? s.r : (s.r + 0.18) / 1.4142, ov = oc ? 0.2 : 0.15; // tháp vuông thu nhỏ để góc chân không vượt quá vật cản tròn của G.L2
    placed(S, s.x, 0, s.z, 0, (B) => {
      const pl = r + (oc ? 0.22 : 0.12), k8 = 1 / 0.9239; // k8: đổi nửa bề rộng (trung đoạn) sang bán kính ngoại tiếp của bát giác
      if (oc) { oct(B, 0, 0, 0, pl * k8, 0.24, C.stoneD); oct(B, 0, 0.24, 0, (pl - 0.1) * k8, 0.14, st); } else { box(B, 0, 0.12, 0, pl * 2, 0.24, pl * 2, C.stoneD); box(B, 0, 0.31, 0, (pl - 0.1) * 2, 0.14, (pl - 0.1) * 2, st); }
      const avail = s.h - 0.38 - fin - n * 0.26, wsum = Array.from({ length: n }, (_, i) => 1.2 - 0.16 * i).reduce((q, w) => q + w, 0);
      let y = 0.38;
      for (let i = 0; i < n; i++) {
        const a = r * (1 - 0.13 * i), h = (avail * (1.2 - 0.16 * i)) / wsum, ce = a + ov, c = i % 2 ? shade(br, 0.94) : br;
        if (oc) { octO(B, 0, y, 0, a * k8, a * k8, h, c); oct(B, 0, y + h, 0, ce * k8, 0.08, st); octO(B, 0, y + h + 0.08, 0, a * 0.7 * k8, ce * k8, 0.18, i % 2 ? st : K.brickD); } else {
          box(B, 0, y + h / 2, 0, a * 2, h, a * 2, c); box(B, 0, y + h + 0.04, 0, ce * 2, 0.08, ce * 2, st);
          cyl(B, 0, y + h + 0.17, 0, a * 0.7 * 1.4142, ce * 1.4142, 0.18, i % 2 ? st : K.brickD, 4, { r: [0, PI / 4, 0] });
        }
        if (i === 0) { // ô khám quay về phía tây (phía lối đi): khung sáng, lòng tối
          B.add(BOX, st, { p: [-a - 0.015, y + h * 0.5, 0], s: [0.03, h * 0.66, a * 0.86], j: 0.03 });
          B.add(BOX, 0x3a2a22, { p: [-a - 0.035, y + h * 0.48, 0], s: [0.03, h * 0.52, a * 0.66], j: 0 });
        }
        y += h + 0.26;
      }
      petalRing(B, 0, y, 0, n === 3 ? 0.26 : 0.32, 6, 0.28, 0.22, 0.5, st, 0, 0.5);
      B.add(lathe2([[0, 0], [0.24, 0.02], [0.32, 0.18], [0.24, 0.4], [0.14, 0.5], [0.2, 0.66], [0.2, 0.8], [0.1, 0.9], [0.04, fin - 0.12], [0, fin - 0.1]], 8), s.main ? 0xc9b99c : st, { p: [0, y + 0.1, 0], s: s.main ? [1.15, 1, 1.15] : [0.9, 1, 0.9] });
    });
  }
  VT.stupas.forEach((s, i) => {
    stupa(s, i);
    F.add(CIRC, i % 2 ? 0x5d8a3d : 0x6a9444, { p: [s.x, 0.014, s.z], s: [s.r + 1.15, 1, s.r + 0.95], j: 0.1 });  // thảm cỏ quanh chân tháp
  });
  {
    const ms = VT.stupas[0], tx = ms.x - 2.2; // bàn thờ nhỏ trước tháp Tổ (phía bệ ngồi)
    box(S, tx, 0.28, ms.z, 0.52, 0.56, 0.86, 0x7a2418); box(S, tx, 0.58, ms.z, 0.6, 0.06, 0.94, 0x5a1a10); box(S, tx, 0.56, ms.z, 0.56, 0.03, 0.9, C.gold);
    incenseBowl(tx, 0.61, ms.z, 1.0); for (const sz of [-0.3, 0.3]) { ellS(S, tx, 0.7, ms.z + sz, 0.07, 0.07, 0.07, 0xf5d03a); cone(S, 5, tx, 0.62, ms.z + sz * 1.2, 0.12, 0.2, 0xf29bb5); }
    col.box(tx - 0.3, ms.z - 0.47, tx + 0.3, ms.z + 0.47, 'table');
    W.smokeSpots && W.smokeSpots.push([tx, 0.95, ms.z]);
    bench(VT.bench);
    stele(14.45, -28.4, 0, ['VƯỜN THÁP', 'phỏng theo chùa Phật Tích'], 1.1);
    stoneLantern(14.2, -46.4, 0, true); stoneLantern(14.2, -39.6, 0, true); stoneLantern(14.4, -57.5, 0, true);
  }

  // =====================================================================
  //  9. HÀNH LANG: hai dãy dài có mái cong, hàng cột trong, xà, đèn lồng treo
  // =====================================================================
  {
    const Cq = L.corridors, cols = Cq.cols, zN = cols[cols.length - 1], zS = cols[0], zc = (zN + zS) / 2, zl = zS - zN + 0.5, zr = (Cq.z0 + Cq.z1) / 2 - 0.25; // mái phủ z −80…−12.5
    for (const sx of [-1, 1]) {
      flags(sx > 0 ? 20.4 : -23.78, -79.4, sx > 0 ? 23.78 : -20.4, -12.8, 0.022, 1.13, 3.2, 0xc7b392, 0x6f6455); // nền phiến đá
      for (const z of cols) { // cột như cột hiên điện nhưng ít cạnh hơn: đế đá, thân son hở đầu, đai vàng
        cyl(F, sx * Cq.inner, 0.12, z, 0.28, 0.32, 0.24, C.stone, 6); S.add(CYLO, C.wood, { p: [sx * Cq.inner, 1.52, z], s: [0.2, 2.56, 0.2] });
        S.add(CYLO, C.gold, { p: [sx * Cq.inner, 2.7, z], s: [0.23, 0.14, 0.23] });
      }
      box(S, sx * Cq.inner, 2.62, zc, 0.26, 0.24, zl, C.woodD);                                       // xà dọc nối đầu cột
      box(S, sx * Cq.inner, 2.94, zc, 0.12, 0.4, zl, C.woodD);                                        // diềm gỗ dưới mái
      box(S, sx * 22.4, 2.62, zc, 0.16, 0.14, zl, C.woodD);                                           // thanh dọc để treo đèn
      for (const z of cols) box(S, sx * 22.3, 2.62, z, 3.1, 0.2, 0.2, C.woodD);                       // xà ngang gác lên tường
      boxMM(S, sx * 23.5, 2.0, -79.6, sx * 24.3, 2.86, -12.4, K.plaster);                              // dải tường trát nối tường bao lên mép mái
      addRoof(S, sx * 22.25, 2.98, zr, 67.5, 3.9, 1.2, { ry: PI / 2, curl: 0.25, sag: 0.05, seg: 12, metal: M });
      cols.forEach((z, k) => { if (k % 2 === 0 && k + 1 < cols.length) hangLanternInto(S, LB, sx * 22.4, 2.55, (z + cols[k + 1]) / 2, 0.3, 0.9); }); // đèn lồng mỗi hai gian
    }
    G.roofZones.push([20.4, 24, -80, -12.5], [-24, -20.4, -80, -12.5]); // trong hành lang máy quay đứng gần như trong điện (có mái)
  }

  // =====================================================================
  //  10. GHẾ ĐÁ BÊN AO, CÂY, CHẬU CẢNH, ĐÈN DỌC TRỤC
  // =====================================================================
  L.pondBenches.forEach(bench);
  frangipani(-18.6, -13.6, 81); frangipani(18.6, -13.6, 82); // dời ra sân trước điện Địa Tạng / Dược Sư (17-dien-phu.js)
  for (const sx of [-1, 1]) { bonsai(sx * 10.9, -13.2); bonsai(sx * 7.6, -23.2); }
  cypress(-12.8, -55.5, 1.1, 91); cypress(-18.4, -55.0, 1.0, 92); cypress(19.7, -28.4, 1.1, 93); cypress(19.55, -58.2, 1.0, 94);
  cypress(19.6, -45.6, 1.1, 95); frangipani(13.45, -34.2, 83); frangipani(16.8, -47.8, 84);

  // =====================================================================
  //  GỘP & ĐƯA VÀO CẢNH
  // =====================================================================
  const meshes = {};
  const add = (key, B, mat, opt) => { if (!B.list.length) return; const m = B.mesh(mat, opt); scene.add(m); meshes[key] = m; };
  add('S', S, G.mats.vc, { cast: true, receive: true }); add('F', F, G.mats.vc, { cast: false, receive: true });
  add('M', M, G.mats.metal, { cast: true, receive: true }); add('L', LB, G.mats.lantern, { cast: false, receive: false });
  W.meshes2 = meshes;
  for (const g of own) g.dispose();
}
