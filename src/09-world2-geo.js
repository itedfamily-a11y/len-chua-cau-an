// =====================================================================
//  KHU MỞ RỘNG — HÌNH KHỐI: nền đá, ao Long Trì & cầu đá, tầng nền & bậc đá,
//  sân linh thú, Tích Thiện Am + tháp Cửu phẩm, tượng Quan Âm nghìn tay (đặt ở Quan Âm Các), tháp Báo Nghiêm,
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
  const TR = U.batch(); // 2026-11-27: tùng và cây trong chậu cảnh đi riêng một lưới (W.meshes2.T) để 13-cay-mo-hinh.js ẩn đi khi mô hình cây tải xong; chỗ đứng ghi vào G.cayDat
  const cayGhi = (o) => { (G.cayDat || (G.cayDat = [])).push(o); };
  const own = [], mk = (g) => (own.push(g), g);
  const PLANE = mk(new THREE.PlaneGeometry(1, 1).rotateX(-PI / 2));
  const SPH = mk(new THREE.SphereGeometry(1, 6, 4)), SPHS = mk(new THREE.SphereGeometry(1, 5, 3)), SPHH = mk(new THREE.SphereGeometry(1, 10, 7));
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
  const ellH = (B, x, y, z, rx, ry, rz, color, o) => B.add(SPHH, color, Object.assign({ p: [x, y, z], s: [rx, ry, rz] }, o)); // cầu mịn hơn cho tượng lớn
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
    branch(TR, [x, 0, z], [x, 1.2 * s, z], 0.16 * s, 0.12 * s, C.bark, 5);
    for (let i = 0; i < 4; i++) {
      const w = (1.5 - i * 0.28) * s, h = (1.7 - i * 0.12) * s;
      cone(TR, 6, x + (r() - 0.5) * 0.06, (0.7 + i * 0.95) * s, z + (r() - 0.5) * 0.06, w, h, i % 2 ? 0x3a6232 : 0x355a2e, { j: 0.1 });
    }
    cayGhi({ k: 'tung', x, y: -0.04, z, s, seed });
    col.circle(x, z, 0.34 * s + 0.05, 'tree');
  }
  function bonsai(x, z) { // chậu cảnh như sân trước
    F.add(lathe2([[0, 0], [0.3, 0], [0.42, 0.12], [0.46, 0.42], [0.5, 0.46], [0, 0.46]], 10), 0x3c6aa0, { p: [x, 0, z] });
    cyl(F, x, 0.43, z, 0.49, 0.49, 0.04, 0xeef0f4, 10);
    branch(TR, [x, 0.45, z], [x + 0.15, 1.05, z + 0.05], 0.07, 0.05, 0x6b5240, 5);
    TR.add(new THREE.IcosahedronGeometry(0.34, 0), 0x4c7a35, { p: [x + 0.18, 1.15, z + 0.05], s: [1.2, 0.6, 1.0], j: 0.12 });
    TR.add(new THREE.IcosahedronGeometry(0.24, 0), 0x5d8c3d, { p: [x - 0.18, 0.9, z], s: [1.2, 0.6, 1.0], j: 0.12 });
    cayGhi({ k: 'chau', x, y: 0.45, z, s: 1, seed: 340 + Math.round(x * 7 + z * 3) });
    col.circle(x, z, 0.46, 'pot');
  }

  // =====================================================================
  //  0. MẶT CỎ: đồi cỏ của 05-world.js cao dần về phía sau (z < -45) sẽ trồi lên khỏi nền đá,
  //     nên san phẳng các đỉnh lưới cỏ nằm trong khu mới (vẫn nằm trong tường bao; 2026-11-26: tường bao dời ra x ±36,3 nên khu rộng tới x ±38,5, cùng ranh giới phẳng của 00-core)
  // =====================================================================
  {
    const grass = scene.children.find((o) => o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry' && o.geometry.parameters.width > 400);
    if (grass) {
      const gp = grass.geometry.attributes.position; let n = 0;
      for (let i = 0; i < gp.count; i++) { const x = gp.getX(i), z = gp.getZ(i); if (x > -38.5 && x < 38.5 && z > -120 && z < -24) { gp.setY(i, -0.03); n++; } }
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
    // uv theo toạ độ thế giới (2.4 m / ô) để khớp pha với sân trước (2026-11-26: nền rộng ra x ±36 vẫn khớp pha — dời gốc 12 m = đúng 5 ô — nên giữ nguyên gốc x + 24)
    const quad = (x0, z0, x1, z1, y) => { for (const [x, z] of [[x0, z0], [x0, z1], [x1, z1], [x0, z0], [x1, z1], [x1, z0]]) { pos.push(x, y, z); nor.push(0, 1, 0); uv.push((x + 24) / 2.4, (31 - z) / 2.4); } };
    quad(Z.x0, Z.z0, Z.x1, Z.z1, 0.005); quad(T.x0, T.z0, T.x1, T.z1, TH + 0.004); quad(HT.x0, HT.z0 - 0.15, HT.x1, HT.z1, TH + 0.004); // lấn 0,15 m vào thân tường bao (mặt trong z=-117.7 ở v4; v3: -99.7) cho khỏi hở khe
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
  // tầng nền chính điện nới ra ±20.2: tường chắn ở z=-62 chừa hai bậc góc (x ±15.2…18.8), tường hai bên (từ 2026-11-26 nhìn ra sân bên x ±(20,5…33,1); hành lang đã dời ra x ±33,1) chạy đến mặt trong tường bao, phía sau không có tường — tầng nền chạy sát mặt trong tường bao (v4: z=-117.7)
  // (sau z −67,8 trên tường chắn hai bên là ba tầng đá trắng của 18-chinh-dien.js nên lan can thấp bên hông chỉ còn đoạn sân z −62…−75,4 (v4; v3: −67,8))
  blockWall(10.75, -62, 15.2, -62, 0.5, 17); blockWall(-15.2, -62, -10.75, -62, 0.5, 18);
  blockWall(18.8, -62, 20.45, -62, 0.5, 19); blockWall(-20.45, -62, -18.8, -62, 0.5, 23);
  blockWall(20.2, -62.25, 20.2, -117.7, 0.5, 20); blockWall(-20.2, -62.25, -20.2, -117.7, 0.5, 22); // v4: đến mặt trong tường bao sau (z −117,7)
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
  balustrade(11, -62, 15.2, -62, false, true); balustrade(-11, -62, -15.2, -62, false, true);   // mép trước tầng nền chính điện, chừa hai bậc góc
  balustrade(18.8, -62, 20.2, -62, true, true); balustrade(-18.8, -62, -20.2, -62, true, true);
  balustrade(20.2, -62, 20.2, -75.4, false, true); balustrade(-20.2, -62, -20.2, -75.4, false, true); // v4: sân sâu 12 m → lan can bên dài đến mép trước tầng 1 (−75,8; trụ cuối cách mặt tầng 0,25 m); hai bên nhìn ra sân bên (trước 2026-11-26: sát hành lang), chỉ ở sân trước tầng 1 (z −62…−75,4); phía sau là mép tầng đá trắng có lan can riêng
  function stairs(x, z, yaw, hw, len = 2) { // 6 bậc nâng 1.2 m trên len m (mặc định 2 m; bám G.heightAt); gốc ở giữa chân bậc, bậc đi lên theo -z cục bộ
    placed(S, x, 0, z, yaw, (B) => {
      for (let k = 0; k < 6; k++) {
        const za = (-k * len) / 6, zb = (-(k + 1) * len) / 6, top = 0.1 + 0.2 * k;
        boxMM(B, -hw, 0, zb, hw, top, za, k % 2 ? C.stoneL : 0xb9ae9b);
        for (const s of [-1, 1]) boxMM(B, s * hw, 0, zb, s * (hw + 0.3), top + 0.58, za, C.stone); // má bậc xếp theo từng bậc
      }
      for (const s of [-1, 1]) {
        sbox(B, [s * (hw + 0.15), 0.6, 0], [s * (hw + 0.15), 1.8, -len], 0.42, 0.18, C.stoneL, 0.02); // mũ má bậc nghiêng theo dốc
        box(B, s * (hw + 0.15), 0.62, -0.15, 0.32, 1.24, 0.3, C.stoneL); bud(B, s * (hw + 0.15), 1.24, -0.15, 1.3, C.stoneL); // trụ đầu bậc
      }
    });
  }
  stairs(0, -23, 0, 4); stairs(-13, -40, -PI / 2, 3);
  const SF = [L.stairsFrontE, L.stairsFrontW]; // hai bậc góc ở mép trước tầng nền chính điện, bậc đi lên về phía bắc (lòng bậc rộng 3 m, má bậc 0,3 m nằm trong x ±15,2…18,8)
  for (const q of SF) stairs((q.x0 + q.x1) / 2, q.z1, 0, (q.x1 - q.x0) / 2 - 0.3, q.z1 - q.z0);

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
    const DX = A.door.x, DH = A.door.h; // cửa hậu (số đo ở L2.am.door: rộng ±1,6 m, cao 3,2 m), nhìn ra sân chính điện
    boxMM(S, A.x0, y0, A.z0, -DX, yT, A.z0 + 0.4, K.plaster); boxMM(S, DX, y0, A.z0, A.x1, yT, A.z0 + 0.4, K.plaster); boxMM(S, -DX, y0 + DH, A.z0, DX, yT, A.z0 + 0.4, K.plaster); // tường sau, chừa cửa
    boxMM(S, A.x0, y0, A.z0, A.x0 + 0.3, yT, A.frontZ - 0.2, K.plaster); boxMM(S, A.x1 - 0.3, y0, A.z0, A.x1, yT, A.frontZ - 0.2, K.plaster); // hai tường bên
    boxMM(S, A.x0 - 0.06, y0, A.z0 - 0.06, -DX, y0 + 0.36, A.z0 + 0.1, C.stoneD); boxMM(S, DX, y0, A.z0 - 0.06, A.x1 + 0.06, y0 + 0.36, A.z0 + 0.1, C.stoneD); // chân tường (trừ cửa hậu)
    boxMM(S, A.x0 - 0.06, y0, A.z0, A.x0 + 0.06, y0 + 0.36, A.frontZ - 0.2, C.stoneD); boxMM(S, A.x1 - 0.06, y0, A.z0, A.x1 + 0.06, y0 + 0.36, A.frontZ - 0.2, C.stoneD);
    boxMM(S, A.x0 - 0.05, yT - 0.5, A.z0 - 0.05, A.x1 + 0.05, yT, A.z0 + 0.45, C.woodD);                  // dải gỗ dưới mái
    boxMM(S, A.x0 - 0.05, yT - 0.5, A.z0, A.x0 + 0.35, yT, A.frontZ - 0.15, C.woodD); boxMM(S, A.x1 - 0.35, yT - 0.5, A.z0, A.x1 + 0.05, yT, A.frontZ - 0.15, C.woodD);
    for (const sx of [-1, 1]) { // phông đỏ sau: hai mảng hai bên cửa hậu, viền vàng
      boxMM(S, sx * 1.95, y0 + 0.4, A.z0 + 0.4, sx * 5.6, y0 + 4.9, A.z0 + 0.44, 0x5e1a12);
      boxMM(S, sx * 1.95, y0 + 4.82, A.z0 + 0.4, sx * 5.6, y0 + 4.9, A.z0 + 0.46, C.gold); boxMM(S, sx * 1.95, y0 + 0.4, A.z0 + 0.4, sx * 5.6, y0 + 0.48, A.z0 + 0.46, C.gold);
      boxMM(S, sx * 1.95, y0 + 0.48, A.z0 + 0.4, sx * 2.01, y0 + 4.82, A.z0 + 0.46, C.gold);
      boxMM(S, sx * DX, y0, A.z0 - 0.05, sx * (DX + 0.2), y0 + DH, A.z0 + 0.47, C.woodD);                                          // khung cửa hậu bằng gỗ sẫm
    }
    boxMM(S, -DX - 0.2, y0 + DH, A.z0 - 0.07, DX + 0.2, y0 + DH + 0.3, A.z0 + 0.49, C.woodD); boxMM(S, -DX, y0 + DH - 0.06, A.z0 - 0.06, DX, y0 + DH, A.z0 + 0.48, C.goldD); // dầm cửa + viền vàng
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
    // xà ngang gác dưới mái (ba cây theo trục x, tránh thân tháp) + gác lửng hai bên có lan can chấn song
    for (const z of [-46.4, -49.0, -55.4]) box(S, 0, 6.52, z, 11.4, 0.34, 0.3, C.woodD);
    for (const sx of [-1, 1]) {
      const xw = sx * (A.x1 - 0.3), xr = sx * (A.x1 - 0.92), yg = 3.3, zs = A.z0 + 0.5, ze = A.frontZ - 0.3; // mặt trong tường, mép lan can, mặt ván (y tuyệt đối)
      boxMM(S, Math.min(xw, xr), yg - 0.1, zs, Math.max(xw, xr), yg, ze, C.woodD);                                       // ván sàn gác
      for (let z = zs + 0.3; z < ze - 0.2; z += 2.0) sbox(S, [xw, yg - 0.95, z], [xr, yg - 0.1, z], 0.12, 0.12, C.woodD);   // đỡ chéo dưới ván
      for (let z = zs + 0.15; z <= ze - 0.1; z += 2.0) box(S, xr, yg + 0.45, z, 0.14, 0.9, 0.14, C.woodD);                // trụ lan can
      boxMM(S, xr - 0.08, yg + 0.84, zs, xr + 0.08, yg + 0.94, ze, C.woodD); boxMM(S, xr - 0.05, yg + 0.1, zs, xr + 0.05, yg + 0.18, ze, C.woodD); boxMM(S, xr - 0.04, yg + 0.46, zs, xr + 0.04, yg + 0.5, ze, C.woodD);
      for (let z = zs + 0.4; z < ze - 0.2; z += 0.26) box(S, xr, yg + 0.3, z, 0.05, 0.3, 0.04, 0x84552f); // chấn song dưới
      for (let z = zs + 0.4; z < ze - 0.2; z += 0.26) box(S, xr, yg + 0.66, z, 0.05, 0.34, 0.04, 0x84552f); // chấn song trên
    }
    // tượng Phật ngồi thiền trước tháp, quay mặt ra cửa (+z): bệ đá bát giác thấp, đài sen son sẫm, áo nâu đỏ, mặt tay ngực thếp vàng, tóc xoăn đen
    const BZ = -47.6;
    sub(S, 0, y0, BZ, (T) => {
      const robe = 0x55190f, robeD = 0x44140c, goldL = 0xe6bb5a, hair = 0x1b1613, ys = 0.9, k = 0.73;
      const e = (x, y, z, rx, ry, rz, c) => ellH(T, x * k, ys + y * k, z * k, rx * k, ry * k, rz * k, c), q = (x, y, z, rx, ry, rz, c) => ellS(T, x * k, ys + y * k, z * k, rx * k, ry * k, rz * k, c);
      oct(T, 0, 0, 0, 1.07, 0.1, C.stoneD); oct(T, 0, 0.1, 0, 0.98, 0.16, C.stone);                                                    // bệ đá bát giác
      oct(T, 0, 0.26, 0, 0.93, 0.2, 0x5a1912); oct(T, 0, 0.26, 0, 0.95, 0.025, C.gold); oct(T, 0, 0.435, 0, 0.95, 0.025, C.gold); oct(T, 0, 0.46, 0, 0.96, 0.04, C.goldD);
      for (let f = 0; f < 8; f++) { // dải hoa văn thếp vàng quanh bệ
        const a = (f * PI) / 4, sa = Math.sin(a), ca = Math.cos(a), ap = 0.93 * 0.9239 + 0.01;
        T.add(BOX, C.gold, { p: [sa * ap, 0.36, ca * ap], s: [0.46, 0.07, 0.03], r: [0, a, 0] });
        for (const d of [-0.3, 0.3]) T.add(BOX, C.gold, { p: [sa * ap + ca * d, 0.36, ca * ap - sa * d], s: [0.1, 0.1, 0.03], r: [0, a, 0] });
      }
      const lot = (y, R, n, len, wid, tilt, c, ph) => { // một hàng cánh sen tròn đầu: ICO dẹt hướng lên và ra ngoài
        for (let i = 0; i < n; i++) { const a = ph + (i / n) * PI * 2, m = R + Math.sin(tilt) * len * 0.5; T.add(ICO, c, { p: [Math.sin(a) * m, y + Math.cos(tilt) * len * 0.5, Math.cos(a) * m], s: [wid * 0.5, len * 0.5, wid * 0.2], r: [tilt, a, 0], order: 'YXZ' }); }
      };
      cyl(T, 0, 0.53, 0, 0.78, 0.82, 0.06, 0x4f140f, 16);                                                                               // đài sen: ba hàng cánh
      lot(0.52, 0.6, 12, 0.46, 0.44, 1.2, 0x7a1d16, 0); lot(0.63, 0.55, 12, 0.42, 0.4, 0.85, 0x8e2a20, PI / 12); lot(0.74, 0.48, 10, 0.36, 0.38, 0.45, 0x6a1812, 0); cyl(T, 0, 0.86, 0, 0.62, 0.66, 0.08, 0x5a1812, 16);
      e(0, 0.2, 0.05, 0.82, 0.24, 0.6, robe); e(-0.58, 0.22, 0.2, 0.3, 0.2, 0.38, robeD); e(0.58, 0.22, 0.2, 0.3, 0.2, 0.38, robeD); e(0, 0.33, 0.35, 0.5, 0.12, 0.28, robe); // chân xếp bằng
      e(0, 0.78, -0.03, 0.44, 0.6, 0.32, robe); e(-0.36, 1.12, -0.02, 0.2, 0.2, 0.22, robe); e(0.36, 1.12, -0.02, 0.2, 0.2, 0.22, robe);                    // thân + vai
      e(-0.46, 0.7, 0.04, 0.14, 0.42, 0.18, robe); e(0.46, 0.7, 0.04, 0.14, 0.42, 0.18, robe); e(-0.26, 0.42, 0.4, 0.22, 0.1, 0.13, robe); e(0.26, 0.42, 0.4, 0.22, 0.1, 0.13, robe);
      e(0, 0.4, 0.5, 0.2, 0.075, 0.14, C.gold); e(0, 0.98, 0.26, 0.17, 0.3, 0.07, C.gold);                                            // hai bàn tay đặt lòng, ngực lộ vàng
      e(0, 1.42, 0, 0.13, 0.12, 0.13, C.gold); e(0, 1.62, 0.02, 0.2, 0.25, 0.21, goldL); e(-0.21, 1.58, 0, 0.05, 0.14, 0.05, C.gold); e(0.21, 1.58, 0, 0.05, 0.14, 0.05, C.gold); // cổ, đầu, tai
      e(0, 1.77, -0.03, 0.215, 0.19, 0.23, hair); e(0, 1.96, -0.02, 0.1, 0.09, 0.1, hair);                                              // tóc + nhục kế
      for (const [th, n] of [[0.5, 6], [0.95, 10], [1.3, 12]]) for (let i = 0; i < n; i++) { // tóc xoắn ốc
        const ph = (i / n) * PI * 2 + th;
        q(0.215 * Math.sin(th) * Math.sin(ph) * 1.02, 1.77 + 0.19 * Math.cos(th) * 1.02, -0.03 + 0.23 * Math.sin(th) * Math.cos(ph) * 1.02, 0.05, 0.05, 0.05, hair);
      }
      for (const sx of [-1, 1]) T.add(BOX, 0x2a1a10, { p: [sx * 0.085 * k, ys + 1.66 * k, 0.215 * k], s: [0.07 * k, 0.016 * k, 0.03 * k] });   // mắt khép
      T.add(BOX, 0x7a2a1a, { p: [0, ys + 1.47 * k, 0.2 * k], s: [0.09 * k, 0.02 * k, 0.03 * k] }); e(0, 1.56, 0.225, 0.035, 0.05, 0.035, C.gold); // miệng, mũi
    });
    col.circle(0, BZ, 1.05, 'altar');
    glow(0, y0 + 2.1, BZ + 0.55, 1.3, [1.0, 0.82, 0.5], true);                                                                           // quầng sáng ấm gần mặt tượng về đêm
    // vạc hương sứ men lam trước tượng + nén hương, khói
    {
      const px = 0, pz = -46.2;
      S.add(lathe2([[0, 0], [0.2, 0], [0.26, 0.03], [0.31, 0.14], [0.335, 0.3], [0.34, 0.42], [0.325, 0.5], [0.345, 0.52], [0.3, 0.53], [0.26, 0.5], [0, 0.49]], 14), 0xe8edf0, { p: [px, y0, pz], j: 0.03 });
      S.add(lathe2([[0.3, 0.17], [0.326, 0.19], [0.342, 0.3], [0.347, 0.4], [0.335, 0.455], [0.322, 0.46]], 14), 0x2f5a98, { p: [px, y0, pz], j: 0.03 }); // dải men lam
      S.add(lathe2([[0.34, 0.5], [0.348, 0.5], [0.348, 0.52], [0.34, 0.522]], 14), 0x2f5a98, { p: [px, y0, pz], j: 0.03 });
      cyl(S, px, y0 + 0.47, pz, 0.27, 0.27, 0.03, 0x6d6a66, 12);                                                                         // tro hương
      for (let i = 0; i < 9; i++) { const a = i * 2.4, r0 = 0.04 + (i % 3) * 0.04, l = 0.1 + (i % 4) * 0.025; sbox(S, [px + Math.sin(a) * r0, y0 + 0.48, pz + Math.cos(a) * r0], [px + Math.sin(a) * (r0 + l), y0 + 1.08, pz + Math.cos(a) * (r0 + l)], 0.014, 0.014, 0x7a2a1a); }
      glow(px, y0 + 1.05, pz, 0.18, [1, 0.35, 0.1], false);
      col.circle(px, pz, 0.35, 'bowl');
      W.smokeSpots && W.smokeSpots.push([px, y0 + 1.08, pz]);
    }
  }
  function buildCuuPham() { // 9 tầng bát giác sơn son: mỗi mặt một tượng thếp vàng có hào quang, 8 trụ tiện ở góc, diềm "vảy" cánh sen hai hàng so le; gốc nhóm ở tâm trục, ngang sàn
    const B = U.batch(), red = K.lacquer, redD = K.lacquerD, redP = shade(K.lacquer, 0.84), redB = shade(K.lacquer, 0.8), gold = C.gold, goldD = C.goldD, postC = 0x5e1a12, goldL = 0xe6bb5a;
    const N = 9, rb = [], sk = [], hb = [], yP = [];                    // rb: bán kính ngoại tiếp thân; sk: độ rủ của diềm; hb: bước tầng; yP: mặt trên ván sàn (j = 0…8 tầng 1…9, j = 9 mũ đỉnh)
    for (let j = 0; j <= N; j++) { const k = Math.min(j, N - 1) / (N - 1); rb[j] = j < N ? U.lerp(1.5, 0.62, k) : 0.5; sk[j] = j < N ? U.lerp(0.26, 0.15, k) : 0.14; }
    yP[0] = 0.78; for (let j = 0; j < N; j++) { hb[j] = U.lerp(0.6, 0.43, j / (N - 1)); yP[j + 1] = yP[j] + hb[j]; }
    // hàng vảy cánh sen chạy dọc chu vi bát giác (per cánh mỗi mặt, so le off), đầu cánh chúc ra ngoài và xuống
    const scales = (y, R, per, len, tilt, color, off) => {
      const wid = ((2 * R * Math.sin(PI / 8)) / per) * 1.12, st = Math.sin(tilt), ct = Math.cos(tilt);
      for (let f = 0; f < 8; f++) {
        const a = (f * PI) / 4, a0 = a - PI / 8, a1 = a + PI / 8;
        for (let m = 0; m < per; m++) {
          const t = (m + off) / per, px = R * (Math.sin(a0) * (1 - t) + Math.sin(a1) * t), pz = R * (Math.cos(a0) * (1 - t) + Math.cos(a1) * t);
          B.add(ICO, color, { p: [px + Math.sin(a) * st * len * 0.5, y + ct * len * 0.5, pz + Math.cos(a) * st * len * 0.5], s: [wid * 0.5, len * 0.5, wid * 0.17], r: [tilt, a, 0], order: 'YXZ' });
        }
      }
    };
    const BAL = lathe2([[0, 0], [0.6, 0], [0.45, 0.1], [0.95, 0.3], [0.45, 0.52], [0.72, 0.66], [0.42, 0.82], [0.6, 0.96], [0, 1]], 5); // trụ tiện (đơn vị: bán kính phình = 1, cao = 1)
    const fig = (T, f) => { // tượng ngồi thếp vàng trước hào quang hình lá (cao ≈ 1,04 f), quay về +z
      const e = (x, y, z, rx, ry, rz, c) => ellS(T, x * f, y * f, z * f, rx * f, ry * f, rz * f, c);
      T.add(BOX, goldD, { p: [0, 0.045 * f, 0], s: [0.5 * f, 0.09 * f, 0.34 * f] });                       // bệ nhỏ
      e(0, 0.17, 0.01, 0.27, 0.08, 0.17, gold); e(0, 0.36, 0, 0.17, 0.24, 0.11, goldL); e(0, 0.62, 0.015, 0.08, 0.095, 0.085, goldL); // chân xếp bằng, thân, đầu
      T.add(OCTA, gold, { p: [0, 0.55 * f, -0.075 * f], s: [0.34 * f, 0.5 * f, 0.035 * f] });             // hào quang hình lá (thoi dẹt): viền vàng
      T.add(OCTA, 0x4a1810, { p: [0, 0.55 * f, -0.045 * f], s: [0.27 * f, 0.4 * f, 0.03 * f] });           // lòng hào quang sẫm
    };
    // đế + thân trụ dưới
    oct(B, 0, 0, 0, 1.84, 0.14, 0x4a1810); oct(B, 0, 0.14, 0, 1.8, 0.03, goldD);
    octO(B, 0, 0.14, 0, 1.36, 1.36, yP[0] - 0.14, red);
    for (let f = 0; f < 8; f++) {
      const a = (f * PI) / 4, sa = Math.sin(a), ca = Math.cos(a), ap = 1.36 * 0.9239 + 0.015;
      B.add(BOX, gold, { p: [sa * ap, 0.36, ca * ap], s: [0.5, 0.2, 0.03], r: [0, a, 0] });                // ô phù điêu thếp vàng
      for (const d of [-0.42, 0.42]) B.add(OCTA, gold, { p: [sa * ap + ca * d, 0.36, ca * ap - sa * d], s: 0.07, r: [0, a, 0] });
    }
    for (let j = 0; j <= N; j++) {
      const yb = yP[j] - 0.04, rp = rb[j] + 0.17, per = 3;
      oct(B, 0, yb, 0, rp, 0.04, redP);                                                                   // ván sàn mỏng
      scales(yb + 0.01, rb[j] + 0.14, per, sk[j] * 1.05, 2.2, red, 0.5);                                   // diềm cánh sen: hàng trên
      scales(yb - sk[j] * 0.4, rb[j] + 0.17, per, sk[j] * 1.0, 2.2, redB, 0);                              // hàng dưới (sẫm hơn), so le
      if (j === N) break;
      const ap = rb[j] * 0.9239, fs = (0.55 * hb[j]) / 1.04, wf = 0.765 * rb[j];
      octO(B, 0, yP[j], 0, rb[j], rb[j], hb[j], red);                                                      // thân
      for (let f = 0; f < 8; f++) {
        const a = (f * PI) / 4, sa = Math.sin(a), ca = Math.cos(a);
        placed(B, sa * (ap + 0.06), yP[j], ca * (ap + 0.06), a, (T) => fig(T, fs));                        // tượng trên ván sàn
        for (const d of [-0.3 * wf, 0.3 * wf]) B.add(BOX, gold, { p: [sa * (ap + 0.012) + ca * d, yP[j] + hb[j] * 0.42, ca * (ap + 0.012) - sa * d], s: [0.03, hb[j] * 0.6, 0.02], r: [0, a, 0] }); // nẹp hoa văn hai bên
        const ac = PI / 8 + (f * PI) / 4, rr = rb[j] + 0.04, rbal = U.lerp(0.075, 0.043, j / (N - 1));
        B.add(BAL, postC, { p: [Math.sin(ac) * rr, yP[j], Math.cos(ac) * rr], s: [rbal, hb[j] - 0.04, rbal] }); // trụ tiện ở góc
      }
    }
    // đỉnh: bệ nhỏ + nụ sen
    const yC = yP[N];
    oct(B, 0, yC, 0, 0.3, 0.1, goldD); petalRing(B, 0, yC + 0.1, 0, 0.1, 8, 0.2, 0.13, 0.75, gold, 0, 0.4);
    B.add(lathe2([[0, 0], [0.15, 0], [0.18, 0.05], [0.11, 0.11], [0.13, 0.2], [0.17, 0.3], [0.12, 0.4], [0.05, 0.48], [0, 0.52]], 8), gold, { p: [0, yC + 0.1, 0] });
    const TW = G.mats.gold.clone(); TW.specular.setHex(0x241a14); TW.shininess = 22; TW.emissive.setHex(0x100604); // vật liệu riêng: sơn son bóng nhẹ; vật liệu vàng chung (ánh vàng + phát sáng đêm) làm cả tháp ngả vàng phẳng
    return B.mesh(TW, { cast: false, receive: true, dynamic: true }); // không đổ bóng: tháp đứng dưới mái am, bóng đã nằm trong bóng mái
  }
  {
    const tw = new THREE.Group(); tw.name = 'cuuPham'; tw.position.set(A.tower.x, y0, A.tower.z);
    tw.add(buildCuuPham()); scene.add(tw);
    if (W.ext && W.ext.cuuPham) W.ext.cuuPham.tower = tw;
  }

  // =====================================================================
  //  6. TƯỢNG QUAN ÂM nghìn mắt nghìn tay — đặt trong Quan Âm Các (17-dien-phu.js), ở đây chỉ dựng nhóm tượng. 2026-11-27: dựng lại theo tượng chùa Bút Tháp (tượng ngồi, mười một mặt, vầng nghìn tay)
  // =====================================================================
  function buildQuanAm() { // 2026-11-27: tượng NGỒI kiết già theo tượng Quan Âm Thiên thủ Thiên nhãn chùa Bút Tháp (tỉ lệ đo trên ảnh, bề ngang hai gối = 1 m; cao ~3,3 m, 17 phóng 1,12 lần):
    // bệ sơn son bốn cấp, rồng đội đài sen 16 cánh, thân thon cao, hai đôi tay chính (chắp trước ngực, thiền định trước bụng), 28 tay lớn hai lớp chia nhóm xuôi / ngang / giơ lên,
    // vầng nghìn tay nhỏ 12 vòng phía sau (mỗi bàn tay một vệt vàng = con mắt), ba mặt + ba tầng đầu (3 – 3 – 2) + tượng A Di Đà + đầu trên đỉnh vượt trên vầng, tán gỗ sau đỉnh.
    // Dựng NHẴN như ban thờ chính điện: mảnh giữ pháp tuyến hình gốc, vàng kim loại PBR soi bản đồ phản chiếu (17 gắn envMap của 18 vào userData.mats), sơn then / sơn son nhám.
    const LOW = !!(G.quality && G.quality.low) || (() => { const a = Date.now() - ((G.save && G.save.data && +G.save.data.lowQ) || 0); return a >= 0 && a < 7 * 864e5; })();
    const sgn = (n, min = 6) => Math.max(min, Math.round(n * (LOW ? 0.5 : 1))); // số đoạn chia (máy yếu: một nửa, như 18-ban-tho.js)
    const GH = 0xf7e2a0, GS = 0xe5bf69, GM = 0xd4a843, GR = 0xb8913f, GB = 0x9c7a38, GA = 0x86683c, GA2 = 0x6e5530, GW = 0x5a4222, RL = 0x7d0910, RD = 0x4a0a0c, RC = 0xa8301c, AK = 0x14100c, AH = 0x2a1d16, AH2 = 0x3a2a1c, HR = 0x1c1a24, EYE = 0x1c1618, LIP = 0x8a2a1c;
    // thang vàng như ban thờ chính điện: GH sáng nhất, GS mặt và tay chính, GM mão / viền, GR áo sáng / cánh sen, GB thân áo, GA tay lớp trước / gối, GA2 tay lớp sau, GW gỗ tán; RL / RD sơn son, RC vải đỏ, AK nền vầng, AH / AH2 tay vầng, HR tóc / mày, EYE mắt, LIP môi
    const matGold = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.45, roughness: 0.42, envMapIntensity: 1.1, emissive: 0x3a2608 }); // chưa có bản đồ phản chiếu: bán kim loại + tự sáng nhẹ (17 đổi sang kim loại thật khi gắn envMap)
    const matLac = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0, roughness: 0.5, envMapIntensity: 0.55 });
    matGold.userData.metalEnv = 1; matLac.userData.metalEnv = 0.05;
    // <part> (schem.cjs của controller thay khối này bằng bản giả để vẽ sơ đồ mặt trước không cần trình duyệt)
    const _M = new THREE.Matrix4(), _Q = new THREE.Quaternion(), _E = new THREE.Euler(), _S = new THREE.Vector3(), _P = new THREE.Vector3(), _C = new THREE.Color();
    // mảnh nhẵn: giữ pháp tuyến hình gốc (o.flat: pháp tuyến phẳng), màu đỉnh đều; danh sách bake: mặt hướng xuống tối dần (×0,62 … ×1) như "AO" nướng sẵn
    const part = (list, geo, color, o = {}) => {
      const g = geo.index ? geo.toNonIndexed() : geo.clone();
      for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
      _P.set(0, 0, 0); if (o.p) _P.set(o.p[0], o.p[1], o.p[2]);
      _E.set(0, 0, 0, o.order || 'XYZ'); if (o.r) _E.set(o.r[0], o.r[1], o.r[2], o.order || 'XYZ');
      _Q.setFromEuler(_E); const s = o.s ?? 1; if (typeof s === 'number') _S.set(s, s, s); else _S.set(s[0], s[1], s[2]);
      g.applyMatrix4(_M.compose(_P, _Q, _S)); if (o.m) g.applyMatrix4(o.m);
      if (o.flat || !g.attributes.normal) g.computeVertexNormals();
      const n = g.attributes.position.count, arr = new Float32Array(n * 3), N = g.attributes.normal; _C.set(color);
      for (let i = 0; i < n; i++) { const t = Math.min(1, Math.max(0, (N.getY(i) + 0.75) / 1.25)), k = list.bake ? 0.62 + 0.38 * t * t * (3 - 2 * t) : 1; arr[i * 3] = _C.r * k; arr[i * 3 + 1] = _C.g * k; arr[i * 3 + 2] = _C.b * k; }
      g.setAttribute('color', new THREE.BufferAttribute(arr, 3)); list.push(g);
    };
    // hình lá / cánh sen / bàn tay khép ngón: cầu biến dạng, thon về gốc (y −1), nhọn ở đỉnh (y +1), mũi hơi ngả ra trước (+z)
    const petalG = (ws, hs) => {
      const g = new THREE.SphereGeometry(1, ws, hs), P = g.attributes.position;
      for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), t = (y + 1) / 2, w = Math.sin(Math.min(1, t * 1.12) * PI) * 0.85 + 0.15; P.setXYZ(i, x * w, y, z * (0.4 + 0.6 * w) + 0.35 * t * t); }
      g.computeVertexNormals(); return mk(g);
    };
    // </part>
    const mkB = (bake) => { const list = []; list.bake = bake; return { list, add(geo, color, o) { part(list, geo, color, o); return this; }, addGeo(g) { list.push(g); return this; } }; };
    const B = mkB(true), D = mkB(false); // B: thếp vàng (kim loại), D: sơn son / sơn then
    const SPX = mk(new THREE.SphereGeometry(1, sgn(20, 10), sgn(14, 8))), SPM = mk(new THREE.SphereGeometry(1, sgn(12, 8), sgn(8, 6))), SPL = mk(new THREE.SphereGeometry(1, 8, 6));
    const PET = petalG(sgn(10, 6), sgn(8, 5)), PETS = petalG(6, 5);
    const TOR = mk(new THREE.TorusGeometry(1, 0.1, 6, sgn(20, 10))), BROW = mk(new THREE.TorusGeometry(1, 0.07, 4, 8, 1.9)); // vòng (bán kính 1, ống 0,1) và cung mày
    const CONE4O = mk(new THREE.ConeGeometry(0.5, 1, 4, 1, true)), PL = mk(new THREE.PlaneGeometry(1, 1)); // chóp bốn mặt hở đáy (tay vầng, răng rồng), mảnh phẳng (vệt vàng)
    const sp = (Bt, geo, x, y, z, rx, ry, rz, color, o) => Bt.add(geo, color, Object.assign({ p: [x, y, z], s: [rx, ry, rz] }, o));
    const D2R = PI / 180, lerp = (a, b, t) => a + (b - a) * t;
    // gương mặt: khe mắt khép, mũi, môi; full = thêm mí trên và mày cong (mặt chính), còn lại mày thẳng nhỏ (k = tỉ lệ so với đầu rộng 0,33; yaw = hướng mặt)
    const face = (x, y, z, k, yaw, full) => {
      const c = Math.cos(yaw), s = Math.sin(yaw), P = (dx, dz) => [x + dx * c + dz * s, z - dx * s + dz * c];
      for (const e of [-1, 1]) {
        const p1 = P(e * 0.062 * k, 0.158 * k);
        D.add(SPL, EYE, { p: [p1[0], y + 0.018 * k, p1[1]], s: [0.03 * k, 0.007 * k, 0.012 * k], r: [0, yaw, e * -0.1], order: 'YXZ' });
        if (full) {
          const p0 = P(e * 0.062 * k, 0.15 * k), p2 = P(e * 0.06 * k, 0.144 * k);
          B.add(SPL, GS, { p: [p0[0], y + 0.036 * k, p0[1]], s: [0.036 * k, 0.013 * k, 0.02 * k], r: [0, yaw, e * -0.1], order: 'YXZ' });
          D.add(BROW, HR, { p: [p2[0], y + 0.022 * k, p2[1]], s: [0.058 * k, 0.058 * k, 0.03 * k], r: [0, yaw, 0.62], order: 'YXZ' });
        } else { const p2 = P(e * 0.064 * k, 0.152 * k); D.add(BOX, HR, { p: [p2[0], y + 0.064 * k, p2[1]], s: [0.064 * k, 0.01 * k, 0.012 * k], r: [0, yaw, e * -0.12], order: 'YXZ' }); }
      }
      const pn = P(0, 0.168 * k), pt = P(0, 0.178 * k), pl = P(0, 0.16 * k);
      B.add(SPL, GS, { p: [pn[0], y - 0.012 * k, pn[1]], s: [0.016 * k, 0.045 * k, 0.02 * k], r: [0, yaw, 0] });
      B.add(SPL, GS, { p: [pt[0], y - 0.042 * k, pt[1]], s: [0.022 * k, 0.016 * k, 0.018 * k], r: [0, yaw, 0] });
      D.add(SPL, LIP, { p: [pl[0], y - 0.08 * k, pl[1]], s: [0.03 * k, 0.009 * k, 0.012 * k], r: [0, yaw, 0] });
    };
    // bệ gỗ sơn son bốn cấp thắt lưng, viền vàng (cấp dưới cùng nằm dưới gốc toạ độ: cả nhóm được nâng 0,12 ở cuối hàm)
    box(D, 0, -0.06, 0, 1.58, 0.12, 1.04, RD); box(B, 0, 0.0, 0, 1.62, 0.02, 1.08, GM);
    box(D, 0, 0.05, 0, 1.5, 0.1, 1.0, RL); box(B, 0, 0.105, 0, 1.55, 0.025, 1.05, GM);
    box(D, 0, 0.16, 0, 1.24, 0.09, 0.82, RD);
    box(D, 0, 0.235, 0, 1.4, 0.06, 0.92, RL); box(B, 0, 0.275, 0, 1.44, 0.02, 0.96, GM);
    // rồng đội đài sen: thân trụ, đầu rồng thếp vàng nhô ra trước (miệng ngậm ngọc, hàm răng), hai tay rồng có vảy chống hai bên
    cyl(D, 0, 0.43, -0.02, 0.16, 0.2, 0.28, RD, sgn(16, 8));
    sp(B, SPM, 0, 0.42, 0.2, 0.14, 0.11, 0.17, GR); sp(B, SPL, 0, 0.385, 0.35, 0.075, 0.05, 0.07, GR);
    box(D, 0, 0.372, 0.41, 0.11, 0.035, 0.02, EYE); sp(B, SPL, 0, 0.352, 0.415, 0.03, 0.03, 0.02, GH);
    for (let i = -2; i <= 2; i++) B.add(CONE4O, GH, { p: [i * 0.022, 0.394, 0.43], s: [0.016, 0.04, 0.012], r: [PI, 0, 0], flat: true });
    for (const s of [-1, 1]) {
      sp(B, SPL, s * 0.065, 0.46, 0.32, 0.026, 0.026, 0.018, GH); sp(D, SPL, s * 0.065, 0.46, 0.336, 0.01, 0.014, 0.006, EYE);
      B.add(PETS, GM, { p: [s * 0.09, 0.56, 0.14], s: [0.022, 0.07, 0.022], r: [-0.5, 0, s * -0.3] });
      for (let k = 0; k < 5; k++) sp(B, SPL, s * (0.38 + (k % 2 ? 0.01 : -0.01)), 0.33 + k * 0.055, 0.06, 0.07 - k * 0.005, 0.034, 0.062 - k * 0.004, k % 2 ? GR : GA);
      sp(B, SPL, s * 0.38, 0.325, 0.16, 0.075, 0.035, 0.1, GA);
    }
    // đài sen: bầu đài sơn son, 16 cánh lớn nhọn thếp vàng có lòng son, một vòng cánh nhỏ úp xen kẽ, đáy đài, mặt đài; dải vải đỏ buộc bên trái
    D.add(lathe2([[0.24, 0.57], [0.34, 0.585], [0.44, 0.63], [0.52, 0.7], [0.56, 0.8], [0.55, 0.88]], sgn(24, 12)), RD);
    cyl(B, 0, 0.9, 0, 0.55, 0.55, 0.04, GR, sgn(24, 12));
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * PI * 2, sa = Math.sin(a), ca = Math.cos(a), b = a + PI / 16, sb = Math.sin(b), cb = Math.cos(b);
      B.add(PET, GR, { p: [sa * 0.545, 0.77, ca * 0.545], s: [0.105, 0.15, 0.06], r: [0.3, a, 0], order: 'YXZ' });
      D.add(PETS, RL, { p: [sa * 0.592, 0.775, ca * 0.592], s: [0.05, 0.08, 0.02], r: [0.3, a, 0], order: 'YXZ' });
      B.add(PETS, GA, { p: [sb * 0.5, 0.645, cb * 0.5], s: [0.085, 0.1, 0.045], r: [PI - 0.55, b, 0], order: 'YXZ' });
    }
    cyl(D, 0, 0.585, 0, 0.5, 0.36, 0.035, RD, sgn(16, 8));
    { const a = -1.29; box(D, Math.sin(a) * 0.6, 0.78, Math.cos(a) * 0.6, 0.13, 0.19, 0.05, RC, { r: [0, a, 0.08] }); }
    // chân xếp bằng dưới áo, hai đầu gối sẫm (bề ngang hai gối 1 m), vạt áo phủ trước có nếp
    for (const s of [-1, 1]) {
      sp(B, SPX, s * 0.2, 1.07, 0.12, 0.27, 0.13, 0.24, GR, { r: [0, s * -0.35, 0] });
      sp(B, SPX, s * 0.37, 1.08, 0.1, 0.13, 0.14, 0.16, GA);
    }
    sp(B, SPM, 0, 1.05, 0.34, 0.24, 0.1, 0.12, GR);
    for (let i = -3; i <= 3; i++) B.add(BOX, i % 2 ? GR : GB, { p: [i * 0.075, 1.03, 0.47], s: [0.06, 0.26, 0.025], r: [-0.5, 0, i * -0.1], order: 'YXZ' });
    // thân thon cao: hông – eo – ngực (màu áo), cổ thếp vàng có ngấn; vai, hai dải áo chéo, nút đai, vòng cổ và chuỗi hạt
    B.add(lathe2([[0.27, 0.94], [0.268, 1.0], [0.26, 1.06], [0.24, 1.13], [0.215, 1.2], [0.195, 1.28], [0.185, 1.36], [0.19, 1.43], [0.2, 1.5], [0.22, 1.57], [0.235, 1.64], [0.242, 1.7], [0.238, 1.74], [0.2, 1.785], [0.14, 1.815], [0.085, 1.835], [0.072, 1.87], [0.07, 1.9]], sgn(24, 12)), GB, { s: [1, 1, 0.72] });
    cyl(B, 0, 1.86, 0, 0.07, 0.078, 0.1, GS, sgn(16, 8));
    for (const yn of [1.842, 1.872]) B.add(TOR, GR, { p: [0, yn, 0], s: [0.077, 0.077, 0.045], r: [PI / 2, 0, 0] });
    for (const s of [-1, 1]) { sp(B, SPM, s * 0.25, 1.74, 0, 0.1, 0.075, 0.09, GB); B.add(BOX, GR, { p: [s * 0.1, 1.5, 0.145], s: [0.06, 0.46, 0.03], r: [0.04, 0, s * 0.35] }); }
    sp(B, SPL, 0, 1.42, 0.15, 0.042, 0.05, 0.026, GM);
    B.add(TOR, GH, { p: [0, 1.72, 0.04], s: [0.16, 0.16, 0.2], r: [PI / 2.5, 0, 0] });
    for (let i = -3; i <= 3; i++) { const x = i * 0.04, q = 1 - (i / 3.5) * (i / 3.5); sp(B, SPL, x, 1.69 - 0.075 * q, 0.72 * Math.sqrt(0.056 - x * x) + 0.004, i ? 0.014 : 0.024, i ? 0.014 : 0.03, i ? 0.012 : 0.016, i ? GH : GM); }
    // đầu chính nhỏ + hai mặt bên lùi ra sau (ba mặt), tóc, mão tròn có năm lá đề và hoa
    sp(B, SPX, 0, 2.02, 0.01, 0.125, 0.15, 0.135, GS); face(0, 2.02, 0.01, 0.78, 0, true); sp(B, SPL, 0, 2.085, 0.136, 0.011, 0.011, 0.008, GH);
    for (const s of [-1, 1]) { sp(B, SPM, s * 0.135, 2.01, -0.075, 0.07, 0.11, 0.09, GS); face(s * 0.135, 2.01, -0.075, 0.42, s * 0.95, false); }
    sp(D, SPM, 0, 2.09, -0.04, 0.132, 0.11, 0.125, HR);
    cyl(B, 0, 2.2, 0, 0.145, 0.135, 0.09, GM, sgn(20, 10)); sp(B, SPM, 0, 2.27, -0.005, 0.125, 0.075, 0.12, GM);
    for (let i = -2; i <= 2; i++) { const a = i * 0.5; B.add(PET, GH, { p: [Math.sin(a) * 0.142, 2.3 - Math.abs(i) * 0.014, Math.cos(a) * 0.142], s: [0.04, 0.078 - Math.abs(i) * 0.009, 0.02], r: [0.1, a, 0], order: 'YXZ' }); }
    for (let i = -3; i <= 3; i++) { const a = i * 0.42; sp(B, SPL, Math.sin(a) * 0.146, 2.2, Math.cos(a) * 0.146, 0.02, 0.02, 0.014, i % 2 ? GH : GR); }
    for (const s of [-1, 1]) { sp(B, SPL, s * 0.15, 2.23, 0.02, 0.045, 0.04, 0.04, GH); box(B, s * 0.172, 2.11, 0.03, 0.014, 0.13, 0.014, GM); }
    // ba tầng đầu nhỏ dần (3 – 3 – 2), mỗi đầu một búi tóc; đế đỡ dưới tầng thứ nhất; tượng A Di Đà ngồi có vầng sáng; trên cùng một đầu nhỏ
    cyl(B, 0, 2.37, 0, 0.1, 0.12, 0.06, GR, sgn(12, 8));
    const TW = [[2.46, 0.055, 0.105], [2.63, 0.05, 0.097], [2.79, 0.047, 0.05]];
    for (const [hy, hr, hx] of TW) {
      const row = hy > 2.7 ? [[-hx, 0.005, -0.25], [hx, 0.005, 0.25]] : [[0, 0.025, 0], [-hx, -0.015, -0.7], [hx, -0.015, 0.7]];
      for (const [x, z, yw] of row) { sp(B, SPM, x, hy, z, hr, hr * 1.15, hr, GS); face(x, hy, z - hr * 0.02, hr / 0.165, yw, false); sp(B, SPL, x, hy + hr * 1.1, z, hr * 0.62, hr * 0.75, hr * 0.62, GR); }
    }
    sp(B, SPL, 0, 2.93, 0, 0.065, 0.06, 0.05, GS); sp(B, SPL, 0, 3.015, 0.005, 0.036, 0.042, 0.036, GS);
    cyl(B, 0, 2.99, -0.045, 0.085, 0.085, 0.012, GH, sgn(16, 8), { r: [PI / 2, 0, 0] });
    sp(B, SPL, 0, 3.1, 0, 0.034, 0.04, 0.034, GS);
    // đôi tay chắp trước ngực (hai bàn tay khép hình lá, có khe giữa và vòng cổ tay) và đôi tay thiền định trước bụng
    for (const s of [-1, 1]) {
      const el = [s * 0.28, 1.5, 0.12]; branch(B, [s * 0.255, 1.72, 0.02], el, 0.05, 0.042, GS, sgn(10, 6)); branch(B, el, [s * 0.07, 1.62, 0.31], 0.042, 0.034, GS, sgn(10, 6));
      const e2 = [s * 0.34, 1.36, 0.15]; branch(B, [s * 0.25, 1.66, -0.02], e2, 0.046, 0.04, GS, sgn(10, 6)); branch(B, e2, [s * 0.09, 1.26, 0.33], 0.04, 0.032, GS, sgn(10, 6));
      sp(B, SPM, s * 0.04, 1.27, 0.36, 0.09, 0.03, 0.06, GS, { r: [0, s * 0.3, 0] });
      sp(B, SPL, s * 0.075, 1.615, 0.3, 0.046, 0.02, 0.046, GH);
      B.add(PETS, GS, { p: [s * 0.03, 1.665, 0.372], s: [0.016, 0.05, 0.014], r: [-0.12, 0, s * 0.25] });
    }
    B.add(PET, GS, { p: [0, 1.71, 0.33], s: [0.058, 0.14, 0.05], r: [-0.12, 0, 0] }); B.add(BOX, GA, { p: [0, 1.71, 0.374], s: [0.005, 0.2, 0.008], r: [-0.12, 0, 0] });
    // 28 tay lớn: mỗi bên hai lớp × 7 tay từ sau vai. Nhóm A (t < 0,7): tay xuôi xuống ngang gối rồi dần lên ngang vai; nhóm B: hai tay mỗi lớp giơ thẳng lên cạnh các tầng đầu.
    // Khuỷu gập, cổ tay bẻ; bàn tay hình lá khép ngón có ngón cái, lớp trước có một con mắt nhỏ giữa lòng. Tay sẫm hơn thân, bàn tay sáng hơn cẳng tay. Đầu ngón xa nhất cách tâm vầng ~1,0 m
    for (const s of [-1, 1]) for (let L = 0; L < 2; L++) for (let k = 0; k < 7; k++) {
      const t = (k + L * 0.5) / 6.5, v1 = ((k * 0.618 + L * 0.37) % 1) - 0.5, v2 = ((k * 0.37 + L * 0.21 + 0.3) % 1) - 0.5; // v1, v2: lệch nhẹ từng tay
      const A = t < 0.7, u = (t - 0.7) / 0.3, thd = A ? lerp(-68, 10, t / 0.7) : lerp(36, 60, u), th = thd * D2R;
      const ph = (A ? thd + lerp(8, 34, t / 0.7) + v2 * 12 : lerp(92, 100, u) + v2 * 8) * D2R, a1 = A ? 0.23 + 0.05 * L : 0.33, a2 = (A ? 0.19 + 0.03 * L + 0.1 * t * t : 0.34 + 0.06 * u) * (1 + v1 * 0.2), zr = -0.05 - 0.08 * L;
      const R0 = [s * 0.25, A ? lerp(1.6, 1.7, t / 0.7) : 1.7, zr], E = [R0[0] + s * a1 * Math.cos(th), R0[1] + a1 * Math.sin(th), zr + 0.03], H = [E[0] + a2 * s * Math.cos(ph), E[1] + a2 * Math.sin(ph), zr + 0.1 + (k % 3) * 0.035];
      const hw = ph + (A && t < 0.45 ? -0.35 : k % 2 ? 0.35 : -0.15), dx = s * Math.cos(hw), dy = Math.sin(hw), c = L ? GA2 : GA, hc = L ? GA : GB, al = Math.atan2(-dx, dy), px = -dy * s, py = dx * s; // (dx, dy): hướng bàn tay; (px, py): phía ngón cái
      branch(B, R0, E, 0.054, 0.046, c, sgn(8, 5)); branch(B, E, H, 0.044, 0.034, c, sgn(8, 5));
      sp(B, SPL, E[0], E[1], E[2], 0.047, 0.047, 0.047, c); // khuỷu tròn
      B.add(PET, hc, { p: [H[0] + dx * 0.09, H[1] + dy * 0.09, H[2]], s: [0.042, 0.1, 0.02], r: [0, 0, al] });
      B.add(PETS, hc, { p: [H[0] + dx * 0.05 + px * 0.045, H[1] + dy * 0.05 + py * 0.045, H[2] + 0.004], s: [0.016, 0.045, 0.012], r: [0, 0, al - s * 0.6] });
      if (!L) D.add(SPL, EYE, { p: [H[0] + dx * 0.085, H[1] + dy * 0.085, H[2] + 0.021], s: [0.006, 0.02, 0.004], r: [0, 0, al + PI / 2] });
    }
    // vầng nghìn tay: đĩa nền sơn then (bán kính 1,04; tâm cao 1,80: chỗ rộng nhất ngang dưới cằm, đáy vầng chìm sau đài sen), 12 vòng bàn tay nhỏ sẫm xếp so le dày, mỗi tay một vệt vàng
    const cy = 1.8, AZ = -0.34, AR = 1.04;
    cyl(D, 0, cy, AZ - 0.03, AR - 0.02, AR - 0.02, 0.04, AK, sgn(40, 20), { r: [PI / 2, 0, 0] });
    for (let j = 0; j < 12; j++) {
      const r = 0.42 + j * 0.05, n = Math.round((2 * PI * r) / 0.056), z = AZ + 0.03 - j * 0.003;
      for (let i = 0; i < n; i++) {
        const a = ((i + (j % 2) * 0.5) / n) * PI * 2, sa = Math.sin(a), ca = Math.cos(a), x = sa * r, y = cy + ca * r;
        if (y < 0.95 && Math.abs(x) < 0.6) continue; // khuất sau đài sen và gối
        D.add(CONE4O, (i + j) % 2 ? AH : AH2, { p: [x, y, z], s: [0.046, 0.11, 0.02], r: [0, 0, -a], flat: true });
        B.add(PL, GM, { p: [x + sa * 0.03, y + ca * 0.03, z + 0.012], s: [0.018, 0.04, 1], r: [0, 0, -a] });
      }
    }
    // tán gỗ có gờ sau đỉnh tháp đầu (không viền vàng quanh vầng)
    for (let i = -4; i <= 4; i++) { const th = i * 0.1, len = 0.06 + 0.16 * Math.cos(i * 0.35), rc = AR - 0.03 + len / 2; D.add(BOX, i % 2 ? GW : GA, { p: [Math.sin(th) * rc, cy + Math.cos(th) * rc, AZ - 0.01], s: [0.09, len, 0.03], r: [0, 0, -th] }); }
    const grp = new THREE.Group(); // hai lưới: thếp vàng (kim loại) + sơn son / sơn then
    grp.position.y = 0.12;         // cấp bệ dưới cùng nằm ở y −0,12…0
    for (const [Bt, mat] of [[B, matGold], [D, matLac]]) { const m = new THREE.Mesh(U.merge(Bt.list), mat); m.castShadow = false; m.receiveShadow = false; grp.add(m); }
    grp.userData.mats = [matGold, matLac];
    return grp;
  }
  {
    const st = new THREE.Group(), qa = buildQuanAm(); st.name = 'quanAm'; st.add(qa); // chưa vào cảnh: 17-dien-phu.js đặt lên bệ rồi thêm vào cảnh
    if (W.ext && W.ext.quanAm) { W.ext.quanAm.statue = st; W.ext.quanAm.mats = qa.userData.mats; } // mats: hai vật liệu PBR của tượng, 17 gắn bản đồ phản chiếu của chính điện
  }

  // =====================================================================
  //  7. BẢO THÁP (G.L2.baoNghiem; tên cũ tháp Báo Nghiêm): tháp gạch đỏ tám mặt cao 20 m, dựng theo tỉ lệ đo trên mô hình "Bảo tháp của chùa Phật Tích" (2026-11-26):
  //     đế rộng ~0,35 chiều cao; tầng đáy = hành lang vòm cuốn mở tám mặt (trụ gạch tám góc) bao quanh lõi là điện Văn Thù (cửa nam);
  //     mái ngói kem thứ nhất có viền gạch, tám bờ dải gạch và đầu cuộn; lan can gạch + tám trụ có linh thú; tầng hai có khám vòm đặt tượng + mái thứ hai;
  //     11 tầng nhỏ thon dần (mỗi tầng: thân có tám khám tượng, gờ gạch giật cấp chìa ra, mặt dốc thu vào); chóp đất nung (bầu + ngọn).
  //     Lối nhiễu tháp r 4,1…5,4 (nới ra theo đế), bia, đèn đá. Nằm trong vườn sau chùa (dải cỏ phía tây, tâm (−28,6; −151,5)). Trước nữa: tháp đá xanh 5 tầng ~15 m kiểu Bút Tháp
  // =====================================================================
  const BN = L.baoNghiem;
  {
    const BR = 0xc6917f, BRD = 0x936a5d, BRL = 0xdd9f90, BRK = 0x6e483f, CS = 0xe3b9ae, TR = 0xf1e7d8, DK = 0x3e3438, ST = 0xb9ad98, STD = 0x8f8473, FIG = 0x8f7378, FIGN = 0xa4736c, FN = 0x8a5f58; // gạch (nhạt, hồng như bản quét), gờ sẫm, gạch sáng (viền, bờ dải, lan can), khe răng cưa, mặt trên gờ, ngói sáng, lòng vòm, đá bệ, linh thú, tượng trong khám, chóp
    const fy = BN.floorY, k8 = 0.9239, s8 = Math.sin(PI / 8);
    const Ro = 1.9, ao = Ro * k8, ai = 1.5, Ri = ai / k8, dw = 0.65, dh = 1.95, hC = 3.72;           // lõi = điện Văn Thù: ngoại tiếp ngoài / trung đoạn trong 1,5, nửa rộng và cao cửa, cao tường (trần ở y 3,86)
    const jz = ai - (dw - ai * Math.tan(PI / 8));                                                    // chân khung cửa chạm mặt chéo bên trong
    const R1 = 3.74, a1o = R1 * k8, wt = 0.5, a1i = a1o - wt, yW = 2.55, hw = yW - fy, fw = 2 * R1 * s8, aw = 0.58, sh0 = 1.22; // hành lang vòm: ngoại tiếp, trung đoạn ngoài / trong, đỉnh tường, bề ngang một mặt, nửa rộng vòm, chân vòm
    const HALFD = mk(new THREE.CircleGeometry(1, 10, 0, PI)), ARCH = mk(new THREE.RingGeometry(1, 1.22, 10, 1, 0, PI));
    const PANEL = (() => { // một mặt tường có cửa vòm khoét thật (đùn dày wt về phía +z)
      const s = new THREE.Shape(); s.moveTo(-fw / 2, 0); s.lineTo(-aw, 0); s.lineTo(-aw, sh0);
      for (let i = 1; i <= 10; i++) { const t = PI - (i * PI) / 10; s.lineTo(Math.cos(t) * aw, sh0 + Math.sin(t) * aw); }
      s.lineTo(aw, 0); s.lineTo(fw / 2, 0); s.lineTo(fw / 2, hw); s.lineTo(-fw / 2, hw); s.closePath();
      return mk(new THREE.ExtrudeGeometry(s, { depth: wt, bevelEnabled: false }));
    })();
    // khám vòm trên một mặt (góc a, trung đoạn d): lòng tối, viền gạch sáng, tượng nhỏ
    const niche = (B, a, d, w, y0, hs, frame, fig) => {
      const sa = Math.sin(a), ca = Math.cos(a);
      B.add(BOX, DK, { p: [sa * d, y0 + hs / 2, ca * d], s: [w * 2, hs, 0.03], r: [0, a, 0] });
      B.add(HALFD, DK, { p: [sa * d, y0 + hs, ca * d], s: [w, w, 1], r: [0, a, 0] });
      if (frame) B.add(ARCH, BRL, { p: [sa * (d + 0.006), y0 + hs, ca * (d + 0.006)], s: [w, w, 1], r: [0, a, 0] });
      if (fig) { const d2 = d + 0.03; ellS(B, sa * d2, y0 + hs * 0.42, ca * d2, w * 0.62, hs * 0.5, w * 0.3, FIGN, { r: [0, a, 0] }); ellS(B, sa * d2, y0 + hs * 1.02, ca * d2, w * 0.3, w * 0.3, w * 0.22, FIGN); }
    };
    // gờ gạch giật cấp chìa ra từ rIn tới rOut (dải răng cưa sẫm ở giữa): trả về y đỉnh
    const corbel = (B, y, rIn, rOut, hc) => {
      const rm = rIn + (rOut - rIn) * 0.7;
      octO(B, 0, y, 0, rm, rIn, hc * 0.25, BRD); octO(B, 0, y + hc * 0.25, 0, rm, rm, hc * 0.17, BRK);
      octO(B, 0, y + hc * 0.42, 0, rOut, rm, hc * 0.18, BRD); octO(B, 0, y + hc * 0.6, 0, rOut, rOut, hc * 0.4, BRD);
      return y + hc;
    };
    // tám bờ dải gạch chạy theo góc mái, đầu dưới cuộn tròn vểnh lên
    const hips = (B, rT, yT, rB, yB, wd, cs) => {
      for (let k = 0; k < 8; k++) {
        const a = PI / 8 + (k * PI) / 4, sa = Math.sin(a), ca = Math.cos(a);
        sbox(B, [sa * rT, yT, ca * rT], [sa * rB, yB, ca * rB], wd, wd * 0.85, BRL);
        B.add(CYL, BRL, { p: [sa * (rB + cs * 0.45), yB + cs * 0.7, ca * (rB + cs * 0.45)], s: [cs, wd * 1.1, cs], r: [0, a, PI / 2], order: 'YXZ' }); // đầu cuộn đặc (đĩa tròn dựng đứng theo hướng bờ dải)
        B.add(CYL, BRK, { p: [sa * (rB + cs * 0.45), yB + cs * 0.7, ca * (rB + cs * 0.45)], s: [cs * 0.5, wd * 1.1 + 0.03, cs * 0.5], r: [0, a, PI / 2], order: 'YXZ' }); // lõi sẫm của vòng cuộn
      }
    };
    // tám trụ gạch ở các góc, trên mỗi trụ một linh thú nhỏ quay mặt ra ngoài
    const posts = (B, R, y0, hp, w, k) => {
      for (let i = 0; i < 8; i++) {
        const a = PI / 8 + (i * PI) / 4, sa = Math.sin(a), ca = Math.cos(a), x = sa * R, z = ca * R, yt = y0 + hp + 0.08;
        B.add(BOX, BR, { p: [x, y0 + hp / 2, z], s: [w, hp, w], r: [0, a, 0] }); B.add(BOX, BRL, { p: [x, y0 + hp + 0.04, z], s: [w + 0.1, 0.08, w + 0.1], r: [0, a, 0] });
        ellS(B, x, yt + 0.17 * k, z, 0.15 * k, 0.19 * k, 0.17 * k, FIG); ellS(B, x + sa * 0.1 * k, yt + 0.4 * k, z + ca * 0.1 * k, 0.1 * k, 0.11 * k, 0.11 * k, FIG);
      }
    };
    placed(S, BN.x, 0, BN.z, 0, (B) => {
      oct(B, 0, 0, 0, 4.3, 0.14, STD); oct(B, 0, 0.14, 0, 4.06, fy - 0.14, ST);                      // bệ đá bát giác hai cấp (trung đoạn 3,97 / 3,75): lên được từ mọi phía
      // lõi: vành tường bát giác có khe cửa ở mặt nam (+z), cao tới trong lòng mái
      const sh = [[dw, ao]], dg = PI / 180;
      for (const d of [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5]) sh.push([Ro * Math.sin(d * dg), Ro * Math.cos(d * dg)]);
      sh.push([-dw, ao], [-dw, jz]);
      for (const d of [-67.5, -112.5, -157.5, -202.5, -247.5, -292.5]) sh.push([Ri * Math.sin(d * dg), Ri * Math.cos(d * dg)]);
      sh.push([dw, jz]);
      B.add(mk(new THREE.ExtrudeGeometry(new THREE.Shape(sh.map((p) => new THREE.Vector2(p[0], -p[1]))), { depth: hC, bevelEnabled: false }).rotateX(-PI / 2)), BRD, { p: [0, fy, 0] });
      B.add(BOX, BRD, { p: [0, fy + dh + (hC - dh) / 2, (ao + jz) / 2], s: [dw * 2 + 0.02, hC - dh, ao - jz + 0.02] });       // mảng tường trên cửa
      B.add(BOX, 0x4a3a30, { p: [0, fy + dh + 0.1, ao + 0.04], s: [dw * 2 + 0.34, 0.3, 0.3] });                              // lanh-tô gỗ sẫm
      for (const sx of [-1, 1]) B.add(BOX, 0x7a2418, { p: [sx * (dw + 0.02), fy + dh / 2, (ao + jz) / 2], s: [0.1, dh, ao - jz + 0.04] }); // khung cửa sơn đỏ
      oct(B, 0, fy + hC - 0.14, 0, 1.8, 0.12, BRD);                                                  // trần phòng
      // hành lang vòm: tám mặt tường khoét vòm, viền vòm gạch sáng, tám trụ góc, trần
      for (let f = 0; f < 8; f++) {
        const a = (f * PI) / 4, sa = Math.sin(a), ca = Math.cos(a);
        B.add(PANEL, BR, { p: [sa * a1i, fy, ca * a1i], r: [0, a, 0] });
        B.add(ARCH, BRL, { p: [sa * (a1o + 0.012), fy + sh0, ca * (a1o + 0.012)], s: [aw, aw, 1], r: [0, a, 0] });
      }
      for (let k = 0; k < 8; k++) {
        const a = PI / 8 + (k * PI) / 4, sa = Math.sin(a), ca = Math.cos(a), rp = R1 - 0.1;
        B.add(BOX, BR, { p: [sa * rp, fy + hw / 2, ca * rp], s: [0.78, hw, 0.78], r: [0, a, 0] }); B.add(BOX, 0xb38a81, { p: [sa * rp, fy + 0.14, ca * rp], s: [0.9, 0.28, 0.9], r: [0, a, 0] });
      }
      B.add(mk(new THREE.RingGeometry(1.85, 3.6, 8, 1, PI / 8).rotateX(PI / 2)), BRD, { p: [0, yW - 0.02, 0] });   // trần hành lang (nhìn từ dưới lên)
      // mái thứ nhất: gờ giật cấp, viền gạch, mặt ngói kem, bờ dải + đầu cuộn
      let y = corbel(B, yW, R1 + 0.04, 4.46, 0.75);                                                   // gờ dày 0,75 (2,55 → 3,30)
      octO(B, 0, y, 0, 4.3, 4.46, 0.09, BRL); octO(B, 0, y + 0.09, 0, 2.95, 4.3, 0.76, TR);
      hips(B, 2.95, 4.2, 4.5, 3.42, 0.24, 0.2);
      const rails = (R, yr, wd, ht) => { for (let k = 0; k < 8; k++) { const a = PI / 8 + (k * PI) / 4, b = a + PI / 4; sbox(B, [Math.sin(a) * R, yr, Math.cos(a) * R], [Math.sin(b) * R, yr, Math.cos(b) * R], wd, ht, BRL); } }; // tám thanh lan can nối các trụ góc
      oct(B, 0, 4.1, 0, 3.0, 0.06, BRD); rails(2.9, 4.31, 0.18, 0.3); posts(B, 2.98, 4.1, 0.72, 0.38, 1.0);   // sàn hẹp quanh tầng hai, lan can thanh + trụ có linh thú (để lộ chân tường tầng hai)
      // tầng hai: thân, tám khám vòm đặt tượng, trụ góc, mái thứ hai
      const R2 = 2.52, a2 = R2 * k8, y2 = 4.15, yW2 = 5.6;
      octO(B, 0, y2, 0, R2, R2, yW2 - y2, BR);
      for (let f = 0; f < 8; f++) niche(B, (f * PI) / 4, a2 + 0.012, 0.36, 4.28, 0.6, true, true);
      for (let k = 0; k < 8; k++) { const a = PI / 8 + (k * PI) / 4; B.add(BOX, BR, { p: [Math.sin(a) * (R2 - 0.05), (y2 + yW2) / 2, Math.cos(a) * (R2 - 0.05)], s: [0.4, yW2 - y2, 0.4], r: [0, a, 0] }); }
      y = corbel(B, yW2, R2 + 0.03, 2.7, 0.4);                                                      // 5,6 → 6,0: gờ mỏng hơn so với tường, mái thứ hai nông
      octO(B, 0, y, 0, 2.58, 2.7, 0.05, BRL); octO(B, 0, y + 0.05, 0, 1.95, 2.58, 0.5, TR);
      hips(B, 1.95, 6.6, 2.74, 6.09, 0.19, 0.15);
      posts(B, 1.93, 6.5, 0.32, 0.3, 0.8);                                                           // bệ nhỏ + linh thú ở chân tầng ba
      oct(B, 0, 6.5, 0, 1.95, 0.05, TR); rails(1.88, 6.65, 0.14, 0.2);                               // lan can thấp quanh chân tầng ba
      // mười một tầng nhỏ thon dần: thân + tám khám, gờ giật cấp, mặt dốc thu vào
      // (đo trên bản quét) thân sáu tầng dưới gần như cùng bề ngang, chỉ thon nhanh từ tầng 7; gờ chìa 0,46 ở dưới giảm còn 0,10 ở trên; bước tầng 1,55 × 0,915^i
      const BODY = [1.71, 1.7, 1.67, 1.66, 1.63, 1.61, 1.57, 1.49, 1.33, 1.17, 1.03, 0.75], OV = [0.46, 0.42, 0.38, 0.32, 0.26, 0.19, 0.14, 0.11, 0.1, 0.1, 0.1];
      let yy = 6.55;
      for (let i = 0; i < 11; i++) {
        const p = 1.55 * Math.pow(0.915, i), hb = p * 0.44, hc = p * 0.4, hs = p * 0.16, ov = OV[i], Rb = BODY[i], Rn = BODY[i + 1];
        octO(B, 0, yy, 0, Rb * 0.99, Rb, hb, BR);
        const nw = Rb * Math.max(0.075, 0.1 - 0.005 * i), ap = Rb * 0.995 * k8 + 0.012;
        for (let f = 0; f < 8; f++) niche(B, (f * PI) / 4, ap, nw, yy + hb * 0.07, hb * 0.46, true, i < 7);
        const yc = corbel(B, yy + hb, Rb * 0.99, Rb + ov, hc);
        octO(B, 0, yc, 0, Rn + 0.02, Rb + ov, hs, CS);
        yy += p;
      }
      // chóp: nón gạch thu nhanh, bầu nhỏ, ngọn dài (đỉnh ~19,9 m)
      cyl(B, 0, yy + 0.25, 0, 0.32, 0.75, 0.5, BR, 8, { r: [0, PI / 8, 0] });
      B.add(lathe2([[0.26, 0], [0.38, 0.08], [0.43, 0.2], [0.36, 0.34], [0.2, 0.46], [0.12, 0.56]], 10), FN, { p: [0, yy + 0.5, 0] });
      cone(B, 8, 0, yy + 1.02, 0, 0.28, 1.0, 0xb3857f);
      // hai chậu cây cắt tỉa hai bên vòm trước (như ở tháp mẫu)
      for (const sx of [-1, 1]) { const tx = sx * 1.2, tz = 3.82; cyl(B, tx, 0.26, tz, 0.22, 0.19, 0.24, STD, 8); ellS(B, tx, 0.76, tz, 0.34, 0.4, 0.34, 0x3f6b30); ellS(B, tx, 1.14, tz, 0.2, 0.24, 0.2, 0x4c7a35); }
    });
    // lư hương đồng bên trái lối vào, ngoài vành nhiễu tháp
    const bx = BN.x - 1.9, bz = BN.z + 5.9;
    box(S, bx, 0.2, bz, 0.5, 0.4, 0.5, C.stoneD); incenseBowl(bx, 0.4, bz, 1.5); col.circle(bx, bz, 0.34, 'stonelamp');
    W.smokeSpots && W.smokeSpots.push([bx, 1.2, bz]);
    // lối nhiễu tháp lát đá hình vành khăn (từ 4,1 đến 5,4, đi giữa lối ở bán kính 4,75; nới ra theo đế tháp mới); tháp đứng trên thảm cỏ của vườn (y 0,006) nên nền vành ở 0,03 và phiến ở 0,04
    const ringTile = (r0, r1, a0, a1) => F.add(mk(new THREE.RingGeometry(r0, r1, 2, 1, a0, a1 - a0).rotateX(-PI / 2)), 0xcdb996, { p: [BN.x, 0.04, BN.z], j: 0.07 });
    F.add(mk(new THREE.RingGeometry(3.9, 5.46, 48, 1).rotateX(-PI / 2)), 0x6a6050, { p: [BN.x, 0.03, BN.z], j: 0 });
    [[4.1, 4.75, 40], [4.75, 5.4, 48]].forEach(([r0, r1, n], ri) => { for (let i = 0; i < n; i++) { const a0 = ((i + (ri % 2) * 0.5) / n) * PI * 2, d = (PI * 2) / n; ringTile(r0 + 0.03, r1 - 0.03, a0 + 0.012, a0 + d - 0.012); } });
    G.cam.blockers.push(new THREE.Box3(new THREE.Vector3(BN.x - 1.9, 0, BN.z - 1.9), new THREE.Vector3(BN.x + 1.9, 4.1, BN.z + 1.9)));           // lõi (hành lang vòm để trống cho máy quay)
    G.cam.blockers.push(new THREE.Box3(new THREE.Vector3(BN.x - 2.4, 4.1, BN.z - 2.4), new THREE.Vector3(BN.x + 2.4, BN.h || 20, BN.z + 2.4)));  // thân tháp phía trên
    stele(BN.x - 2.8, BN.z + 7.6, 0, ['BẢO THÁP', 'phỏng theo chùa Phật Tích'], 1.1); // 2026-11-26: theo BN (toạ độ cũ (−19,0; −32,4)); chữ đổi theo tháp mới
    stoneLantern(BN.x + 3.6, BN.z - 7.5, 0, true); stoneLantern(BN.x - 3.6, BN.z - 7.3, 0, true); // hai đèn đá ngoài vành nhiễu tháp (theo BN; cũ (−12,6; −47,5) và (−19,8; −47,3))
  }

  // =====================================================================
  //  8. VƯỜN THÁP: chín ngôi tháp gạch/đá, ghế đá, bàn thờ nhỏ, cây, đèn đá, bia. Từ 2026-11-26 nằm trong vườn sau chùa (dải cỏ phía đông), trên một nền lát đá (VT.pad)
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
  if (VT.pad) flags(VT.pad.x0, VT.pad.z0, VT.pad.x1, VT.pad.z1, 0.03, 1.13, 1.4, 0xc7b392, 0x6f6455); // nền lát đá của vườn tháp, cao hơn thảm cỏ của vườn (0,006) 2,4 cm
  VT.stupas.forEach((s, i) => {
    stupa(s, i);
    F.add(CIRC, i % 2 ? 0x5d8a3d : 0x6a9444, { p: [s.x, VT.pad ? 0.045 : 0.014, s.z], s: [s.r + 1.15, 1, s.r + 0.95], j: 0.1 });  // thảm cỏ quanh chân tháp (trên nền lát đá)
  });
  {
    const ms = VT.stupas[0], tx = ms.x - 2.2; // bàn thờ nhỏ trước tháp Tổ (phía bệ ngồi)
    box(S, tx, 0.28, ms.z, 0.52, 0.56, 0.86, 0x7a2418); box(S, tx, 0.58, ms.z, 0.6, 0.06, 0.94, 0x5a1a10); box(S, tx, 0.56, ms.z, 0.56, 0.03, 0.9, C.gold);
    incenseBowl(tx, 0.61, ms.z, 1.0); for (const sz of [-0.3, 0.3]) { ellS(S, tx, 0.7, ms.z + sz, 0.07, 0.07, 0.07, 0xf5d03a); cone(S, 5, tx, 0.62, ms.z + sz * 1.2, 0.12, 0.2, 0xf29bb5); }
    col.box(tx - 0.3, ms.z - 0.47, tx + 0.3, ms.z + 0.47, 'table');
    W.smokeSpots && W.smokeSpots.push([tx, 0.95, ms.z]);
    bench(VT.bench);
    stele(26.25, -136.9, 0, ['VƯỜN THÁP', 'phỏng theo chùa Phật Tích'], 1.1);
    stoneLantern(26.0, -154.9, 0, true); stoneLantern(26.0, -148.1, 0, true); stoneLantern(26.2, -166.0, 0, true);
  }

  // =====================================================================
  //  9. HÀNH LANG: hai dãy dài có mái cong, hàng cột trong, xà, đèn lồng treo. Từ 2026-11-26 dời ra ngoài +12,3 m cùng tường bao (cột trong x ±33,1, tường ngoài ±36,0); mọi toạ độ x tính theo Cq.inner
  // =====================================================================
  {
    const Cq = L.corridors, cols = Cq.cols, zN = cols[cols.length - 1], zS = cols[0], zc = (zN + zS) / 2, zl = zS - zN + 0.5, zr = (Cq.z0 + Cq.z1) / 2 - 0.25; // mái phủ z −114…−12.5 (dài (z1 − z0) + 1,5 m = 101,5 m)
    for (const sx of [-1, 1]) {
      flags(sx > 0 ? Cq.inner - 0.4 : -(Cq.inner + 2.98), Cq.z0 - 0.4, sx > 0 ? Cq.inner + 2.98 : -(Cq.inner - 0.4), -12.8, 0.022, 1.13, 3.2, 0xc7b392, 0x6f6455); // nền phiến đá (z0 −113,4)
      for (const z of cols) { // cột như cột hiên điện nhưng ít cạnh hơn: đế đá, thân son hở đầu, đai vàng
        cyl(F, sx * Cq.inner, 0.12, z, 0.28, 0.32, 0.24, C.stone, 6); S.add(CYLO, C.wood, { p: [sx * Cq.inner, 1.52, z], s: [0.2, 2.56, 0.2] });
        S.add(CYLO, C.gold, { p: [sx * Cq.inner, 2.7, z], s: [0.23, 0.14, 0.23] });
      }
      box(S, sx * Cq.inner, 2.62, zc, 0.26, 0.24, zl, C.woodD);                                       // xà dọc nối đầu cột
      box(S, sx * Cq.inner, 2.94, zc, 0.12, 0.4, zl, C.woodD);                                        // diềm gỗ dưới mái
      box(S, sx * (Cq.inner + 1.6), 2.62, zc, 0.16, 0.14, zl, C.woodD);                                           // thanh dọc để treo đèn
      for (const z of cols) box(S, sx * (Cq.inner + 1.5), 2.62, z, 3.1, 0.2, 0.2, C.woodD);                       // xà ngang gác lên tường
      boxMM(S, sx * (Cq.inner + 2.7), 2.0, Cq.z0 - 0.6, sx * (Cq.inner + 3.5), 2.86, -12.4, K.plaster);                       // dải tường trát nối tường bao lên mép mái
      addRoof(S, sx * (Cq.inner + 1.45), 2.98, zr, Cq.z1 - Cq.z0 + 1.5, 3.9, 1.2, { ry: PI / 2, curl: 0.25, sag: 0.05, seg: 18, metal: M }); // seg 18 (v4, mái dài 101,5 m): dải ngói rộng ≈ 5,6 m như khi mái dài 67,5 m (12 dải) / 83,5 m (15 dải)
      cols.forEach((z, k) => { if (k % 2 === 0 && k + 1 < cols.length) hangLanternInto(S, LB, sx * (Cq.inner + 1.6), 2.55, (z + cols[k + 1]) / 2, 0.3, 0.9); }); // đèn lồng mỗi hai gian
    }
    G.roofZones.push([Cq.inner - 0.4, Cq.inner + 3.2, Cq.z0 - 1, -12.5], [-(Cq.inner + 3.2), -(Cq.inner - 0.4), Cq.z0 - 1, -12.5]); // trong hành lang máy quay đứng gần như trong điện (có mái)
  }

  // =====================================================================
  //  10. GHẾ ĐÁ BÊN AO, CÂY, CHẬU CẢNH, ĐÈN DỌC TRỤC
  // =====================================================================
  L.pondBenches.forEach(bench);
  frangipani(-18.6, -13.6, 81); frangipani(18.6, -13.6, 82); // dời ra sân trước điện Địa Tạng / Dược Sư (17-dien-phu.js)
  for (const sx of [-1, 1]) { bonsai(sx * 10.9, -13.2); bonsai(sx * 7.6, -23.2); }
  cypress(-12.8, -55.5, 1.1, 91); cypress(-18.4, -55.0, 1.0, 92);
  cypress(31.5, -136.9, 1.1, 93); cypress(31.35, -166.7, 1.0, 94); cypress(31.4, -154.1, 1.1, 95); frangipani(25.25, -142.7, 83); frangipani(28.6, -156.3, 84); // ba cây tùng + hai cây hoa sứ của vườn tháp (trong vườn sau chùa từ 2026-11-26)

  // =====================================================================
  //  GỘP & ĐƯA VÀO CẢNH
  // =====================================================================
  const meshes = {};
  const add = (key, B, mat, opt) => { if (!B.list.length) return; const m = B.mesh(mat, opt); scene.add(m); meshes[key] = m; };
  add('S', S, G.mats.vc, { cast: true, receive: true }); add('F', F, G.mats.vc, { cast: false, receive: true });
  add('M', M, G.mats.metal, { cast: true, receive: true }); add('L', LB, G.mats.lantern, { cast: false, receive: false });
  add('T', TR, G.mats.vc, { cast: true, receive: true }); if (meshes.T) { meshes.T.name = 'cay-cu:khu-mo-rong'; (G.cayCu || (G.cayCu = [])).push(meshes.T); } // cây dựng bằng mã (bản dự phòng của mô hình cây)
  W.meshes2 = meshes;
  for (const g of own) g.dispose();
}
