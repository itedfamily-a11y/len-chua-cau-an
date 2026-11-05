// =====================================================================
//  NỘI THẤT CHÍNH ĐIỆN — PHẦN KIẾN TRÚC (dựng theo ảnh tham khảo: điện đỏ – vàng ấm)
//  Trần hai tầng có kèo + diềm, hai xà ngang đỏ chạm mây vàng, bốn cột sơn then quấn rồng vàng trên đế sen
//  phát sáng, đèn chùm hoa sen, hai phướn vải, cửa sổ chấn song, chuông (trái) – trống (phải).
//  Mọi thứ gộp vào 5 mesh: gỗ (Lambert), vàng (Phong), đèn tự sáng, tranh chữ/hoa văn (atlas canvas), cửa sổ.
//  Không đèn thật: chỉ vật liệu tự sáng + quầng sáng (W.glows). Không cast bóng (nằm dưới mái).
// =====================================================================
function buildHallArch(G) {
  const { THREE, util: U, scene } = G;
  const GB = G.build, W = G.world, col = G.collide;
  if (!GB || !W) return;
  const { C, BOX, box, boxMM, cyl, lathe, glow, beam, branch } = GB;
  const PI = Math.PI, TAU = PI * 2, V3 = THREE.Vector3;
  const safe = (name, fn) => { try { fn(); } catch (e) { console.error('[nội thất chính điện]', name, e); } };
  const Y0 = G.L.hall.h; // mặt nền điện (0,6)
  const fm = G.frame.mark(); // dựng theo toạ độ gốc, cuối hàm dời nguyên khối lên chỗ chính điện đứng

  // ---------- Bảng màu ----------
  const K = {
    lac: 0x8a2018, lacD: 0x66160f, red: 0xa3261c, rafter: 0x3f2014, plank: [0x8a6244, 0x7c5a3e],
    gold: 0xe8b64e, goldL: 0xf9de8a, goldD: 0xb88a2e, lamp: 0xffeeb0, stone: C.stone,
    board: 0x2b110b, bronze: 0x76592c, bronzeD: 0x4c3d24, skin: 0xe9d2a0, drum: 0xa5281c,
  };

  // ---------- Hình gốc dùng chung + bộ gom ----------
  const OCT = new THREE.OctahedronGeometry(1, 0), SPH = new THREE.SphereGeometry(1, 8, 6), SPHS = new THREE.SphereGeometry(1, 6, 4);
  const SPK4 = new THREE.ConeGeometry(0.5, 1, 4, 1, true); // gai nhọn hở đáy (4 tam giác)
  const CUP = new THREE.ConeGeometry(0.5, 1, 6, 1, true);   // chén đèn
  const WD = U.batch(), GD = U.batch(), LP = U.batch();     // gỗ / vàng / tự sáng
  const goldMat = new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 70, specular: 0xffe6a0, emissive: 0x6e4410, flatShading: true });
  const put = (B, g, color, x, y, z, sx, sy = sx, sz = sx, o) => B.add(g, color, Object.assign({ p: [x, y, z], s: [sx, sy, sz] }, o));
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new V3(), _s = new V3(), _up = new V3(0, 1, 0), _d = new V3();
  // đặt hình có trục chính là +y sao cho trục hướng theo dir; tâm tại p; tỉ lệ s
  const aim = (B, geo, color, p, dir, s) => {
    _d.set(dir[0], dir[1], dir[2]).normalize(); _q.setFromUnitVectors(_up, _d);
    _m.compose(_v.set(p[0], p[1], p[2]), _q, _s.set(s[0], s[1], s[2]));
    B.add(geo, color, { m: _m });
  };

  // Ống thon bám theo đường cong pts (khung quay song song, không xoắn); rad(u), u∈[0,1] = bán kính; colr(i,j) = màu từng mặt phẳng
  function tubeGeo(pts, rad, sides, colr, up0) {
    const n = pts.length, T = new V3(), A = new V3(), B2 = new V3(), P = new V3(), rings = [];
    for (let i = 0; i < n; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(n - 1, i + 1)];
      T.set(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]).normalize();
      if (i === 0) {
        P.set(up0 ? up0[0] : 0, up0 ? up0[1] : 1, up0 ? up0[2] : 0);
        if (Math.abs(T.dot(P)) > 0.95) P.set(1, 0, 0);
        A.crossVectors(T, P).normalize();
      } else A.addScaledVector(T, -A.dot(T)).normalize();
      B2.crossVectors(T, A).normalize();
      const r = rad(i / (n - 1)), ring = [];
      for (let j = 0; j < sides; j++) {
        const a = (j / sides) * TAU, ca = Math.cos(a) * r, sa = Math.sin(a) * r;
        ring.push([pts[i][0] + A.x * ca + B2.x * sa, pts[i][1] + A.y * ca + B2.y * sa, pts[i][2] + A.z * ca + B2.z * sa]);
      }
      rings.push(ring);
    }
    const pos = [], cl = [], c = new THREE.Color();
    const tri = (a, b, d, hex) => { c.set(hex); for (const v of [a, b, d]) { pos.push(v[0], v[1], v[2]); cl.push(c.r, c.g, c.b); } };
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < sides; j++) {
      const j2 = (j + 1) % sides, a = rings[i][j], b = rings[i][j2], d = rings[i + 1][j], e = rings[i + 1][j2], hex = colr(i, j);
      tri(a, b, d, hex); tri(b, e, d, hex);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
    g.computeVertexNormals(); // hình không chỉ mục → pháp tuyến phẳng từng mặt (đúng phong cách low-poly)
    return g;
  }

  // Mặt phẳng có UV: tâm (cx,cy,cz), rộng w, cao h, quay yaw quanh trục đứng (pháp tuyến = (sin yaw, 0, cos yaw)); r = [u0,v0,u1,v1]
  const newQ = () => ({ pos: [], nor: [], uv: [] });
  function quad(Q, cx, cy, cz, w, h, yaw, r) {
    const nx = Math.sin(yaw), nz = Math.cos(yaw), tx = Math.cos(yaw), tz = -Math.sin(yaw), hw = w / 2, hh = h / 2;
    const cs = [[-hw, -hh, r[0], r[1]], [hw, -hh, r[2], r[1]], [hw, hh, r[2], r[3]], [-hw, hh, r[0], r[3]]];
    for (const k of [0, 1, 2, 0, 2, 3]) {
      const c = cs[k];
      Q.pos.push(cx + tx * c[0], cy + c[1], cz + tz * c[0]); Q.nor.push(nx, 0, nz); Q.uv.push(c[2], c[3]);
    }
  }
  const quadGeo = (Q) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(Q.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(Q.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(Q.uv, 2));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  };

  // =====================================================================
  //  ATLAS HOA VĂN + CHỮ (một canvas 1024²): phướn, bảng câu đối, diềm mây vàng trên nền đỏ
  // =====================================================================
  const AW = 1024, AH = 1024, ATL = newQ();
  const RG = { // vùng ảnh (px): x, y, w, h — chừa 4 px giữa các vùng
    banA: [0, 0, 224, 880], banB: [228, 0, 224, 880], cplA: [456, 0, 144, 588], cplB: [604, 0, 144, 588],
    fasc: [752, 0, 256, 272], medal: [0, 886, 512, 128], unit: [516, 886, 256, 128],
  };
  const UV = {};
  for (const k of Object.keys(RG)) { const r = RG[k]; UV[k] = [(r[0] + 0.5) / AW, 1 - (r[1] + r[3] - 0.5) / AH, (r[0] + r[2] - 0.5) / AW, 1 - (r[1] + 0.5) / AH]; }
  let atlasTex = null;
  safe('atlas', () => {
    atlasTex = U.canvasTex(AW, AH, (g) => {
      const gold = '#f4cd68', goldD = '#8a5a16', FONT = (fs) => `700 ${fs}px "Noto Serif", "Times New Roman", serif`;
      const reg = (name, fn) => { const r = RG[name]; g.save(); g.translate(r[0], r[1]); g.beginPath(); g.rect(0, 0, r[2], r[3]); g.clip(); fn(r[2], r[3]); g.restore(); };
      // nét xoắn ốc (cuộn mây)
      const spiral = (cx, cy, r0, turns, a0, dir, lw) => {
        g.beginPath();
        for (let i = 0; i <= 28; i++) {
          const t = i / 28, a = a0 + dir * t * turns * TAU, r = r0 * (1 - 0.86 * t);
          const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
          if (i) g.lineTo(x, y); else g.moveTo(x, y);
        }
        g.lineWidth = lw; g.stroke();
      };
      // một "đám mây" kiểu chạm gỗ: cuộn lớn + cuộn nhỏ nối bằng nét lượn
      const cloud = (cx, cy, s, dir) => {
        g.save(); g.translate(cx, cy); g.scale(s * dir, s); g.lineCap = 'round'; g.lineJoin = 'round';
        for (const pass of [0, 1]) {
          g.save(); if (!pass) g.translate(1.8, 2);
          g.strokeStyle = pass ? gold : goldD; g.fillStyle = g.strokeStyle;
          spiral(-48, -2, 27, 1.25, -0.3, 1, 5.5);
          spiral(62, 10, 17, 1.2, PI + 0.2, -1, 4.8);
          g.beginPath(); g.lineWidth = 5; g.moveTo(-22.2, -10); g.bezierCurveTo(0, -30, 20, 30, 45.3, 6.6); g.stroke();
          g.beginPath(); g.lineWidth = 4.2; g.moveTo(-74, 14); g.bezierCurveTo(-66, 24, -50, 28, -38, 24); g.stroke();
          for (const [dx, dy, r] of [[-8, -30, 3.2], [16, -33, 2.6], [42, -26, 2.8], [84, -12, 2.6], [88, 20, 2.4]]) { g.beginPath(); g.arc(dx, dy, r, 0, TAU); g.fill(); }
          g.restore();
        }
        g.restore();
      };
      const bandBg = (w, h) => { const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#a6261c'); bg.addColorStop(1, '#7d1710'); g.fillStyle = bg; g.fillRect(0, 0, w, h); };
      const bandLines = (w, h, m) => { g.fillStyle = gold; g.fillRect(0, m, w, 4); g.fillRect(0, m + 7, w, 1.6); g.fillRect(0, h - m - 4, w, 4); g.fillRect(0, h - m - 8.6, w, 1.6); };
      // diềm xà: một ô lặp (0,88 m)
      reg('unit', (w, h) => { bandBg(w, h); bandLines(w, h, 6); cloud(w / 2, h / 2, 1.15, 1); });
      // ô giữa xà: hoa sen trong vòng tròn, hai bên là mây đối xứng
      reg('medal', (w, h) => {
        bandBg(w, h); bandLines(w, h, 6); cloud(96, h / 2, 0.82, 1); cloud(w - 96, h / 2, 0.82, -1);
        g.save(); g.translate(w / 2, h / 2);
        g.fillStyle = '#69120d'; g.beginPath(); g.arc(0, 0, 51, 0, TAU); g.fill();
        g.strokeStyle = gold; g.lineWidth = 4.5; g.stroke();
        g.lineWidth = 1.6; g.beginPath(); g.arc(0, 0, 43, 0, TAU); g.stroke();
        for (let i = 0; i < 8; i++) {
          g.save(); g.rotate((i * TAU) / 8); g.beginPath(); g.ellipse(0, -24, 8, 17, 0, 0, TAU);
          g.fillStyle = i % 2 ? '#f4cd68' : '#ffe39a'; g.fill(); g.strokeStyle = goldD; g.lineWidth = 1.2; g.stroke(); g.restore();
        }
        g.fillStyle = gold; g.beginPath(); g.arc(0, 0, 10, 0, TAU); g.fill(); g.strokeStyle = goldD; g.lineWidth = 1.5; g.stroke();
        g.restore();
      });
      // diềm của hộp trần (0,8 × 0,85 m)
      reg('fasc', (w, h) => {
        bandBg(w, h); bandLines(w, h, 10); cloud(w / 2, h / 2, 1.3, 1);
        g.fillStyle = gold; for (const [dx, dy] of [[40, 52], [128, 46], [216, 52], [40, 220], [128, 226], [216, 220]]) { g.beginPath(); g.arc(dx, dy, 4, 0, TAU); g.fill(); }
      });
      // phướn vải: nền kem vàng, viền đỏ + chỉ vàng, chữ đỏ, đuôi nheo hình chữ V (trong suốt ngoài hình cờ)
      const banner = (w, h, lines) => {
        const tail = 66;
        const path = (d) => { g.beginPath(); g.moveTo(d, d); g.lineTo(w - d, d); g.lineTo(w - d, h - tail - d * 0.6); g.lineTo(w / 2, h - 4 - d * 1.8); g.lineTo(d, h - tail - d * 0.6); g.closePath(); };
        path(0); g.save(); g.clip();
        const bg = g.createLinearGradient(0, 0, w, 0); bg.addColorStop(0, '#f1dc9a'); bg.addColorStop(0.5, '#fbeec4'); bg.addColorStop(1, '#eed48c');
        g.fillStyle = bg; g.fillRect(0, 0, w, h);
        g.fillStyle = '#a8231a'; g.fillRect(0, 0, w, 20); g.fillStyle = gold; g.fillRect(0, 20, w, 3);
        g.strokeStyle = '#a8231a'; g.lineWidth = 11; path(5); g.stroke();
        g.strokeStyle = '#d9a640'; g.lineWidth = 2.4; path(15); g.stroke();
        g.restore();
        const top = 46, bot = h - tail - 18, step = (bot - top) / lines.length;
        let fs = Math.min(step * 0.8, 120); g.font = FONT(fs);
        for (const l of lines) while (g.measureText(l).width > w * 0.8 && fs > 8) { fs *= 0.94; g.font = FONT(fs); }
        g.fillStyle = '#a0150d'; g.textAlign = 'center'; g.textBaseline = 'middle';
        lines.forEach((l, i) => g.fillText(l, w / 2, top + step * (i + 0.5)));
      };
      reg('banA', (w, h) => banner(w, h, ['NAM', 'MÔ', 'A', 'DI', 'ĐÀ', 'PHẬT']));
      reg('banB', (w, h) => banner(w, h, ['NAM', 'MÔ', 'QUÁN', 'THẾ', 'ÂM', 'BỒ', 'TÁT']));
      // bảng sơn then chữ vàng (câu đối đóng vào cột)
      const couplet = (w, h, lines) => {
        const bg = g.createLinearGradient(0, 0, w, 0); bg.addColorStop(0, '#2c100a'); bg.addColorStop(0.5, '#401a10'); bg.addColorStop(1, '#2a0f09');
        g.fillStyle = bg; g.fillRect(0, 0, w, h);
        g.strokeStyle = gold; g.lineWidth = 5; g.strokeRect(5, 5, w - 10, h - 10); g.lineWidth = 1.6; g.strokeRect(13, 13, w - 26, h - 26);
        const top = 30, bot = h - 30, step = (bot - top) / lines.length;
        let fs = Math.min(step * 0.78, 80); g.font = FONT(fs);
        for (const l of lines) while (g.measureText(l).width > w * 0.84 && fs > 8) { fs *= 0.94; g.font = FONT(fs); }
        g.fillStyle = '#f6d27a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 4; g.shadowOffsetY = 2;
        lines.forEach((l, i) => g.fillText(l, w / 2, top + step * (i + 0.5)));
      };
      reg('cplA', (w, h) => couplet(w, h, ['TÂM', 'AN', 'VẠN', 'SỰ', 'AN']));
      reg('cplB', (w, h) => couplet(w, h, ['PHƯỚC', 'LÀNH', 'KHẮP', 'NƠI']));
    });
  });
  const signMat = atlasTex ? new THREE.MeshLambertMaterial({ map: atlasTex, emissive: 0xffffff, emissiveMap: atlasTex, emissiveIntensity: 0.42, alphaTest: 0.5 }) : null;
  const aq = (cx, cy, cz, w, h, yaw, name) => { if (signMat) quad(ATL, cx, cy, cz, w, h, yaw, UV[name]); };
  // lát một đoạn a0..a1 bằng các ô lặp ~unit (chia đều cho khít)
  const run = (a0, a1, unit, fn) => { const n = Math.max(1, Math.round((a1 - a0) / unit)), len = (a1 - a0) / n; for (let i = 0; i < n; i++) fn(a0 + len * (i + 0.5), len); };

  // =====================================================================
  //  TRẦN HAI TẦNG: tầng thấp (5,15) bao quanh, tầng cao (6,0) ở giữa; kèo tối + ván lót; diềm đỏ viền vàng
  // =====================================================================
  safe('trần', () => {
    // ván lót chạy dọc z, kèo (đỏ sẫm) ở mọi mối nối bên dưới
    const ceil = (x0, x1, z0, z1, yb, th, wMax) => {
      const n = Math.max(1, Math.round((x1 - x0) / wMax)), st = (x1 - x0) / n, zc = (z0 + z1) / 2, L = z1 - z0;
      for (let i = 0; i < n; i++) box(WD, x0 + st * (i + 0.5), yb + th / 2, zc, st, th, L, K.plank[i % 2]);
      for (let i = 0; i <= n; i++) box(WD, x0 + st * i, yb - 0.07, zc, 0.12, 0.14, L, K.rafter);
    };
    ceil(-5.5, 5.5, -20.5, -12.1, 6.0, 0.1, 0.72);      // tầng cao (hõm giữa)
    ceil(-8.8, -5.4, -20.4, -12.2, 5.15, 0.12, 0.72);    // tầng thấp: hai bên
    ceil(5.4, 8.8, -20.4, -12.2, 5.15, 0.12, 0.72);
    ceil(-8.8, 8.8, -12.2, -11.2, 5.15, 0.12, 0.74);     // phía cửa
    ceil(-8.8, 8.8, -22.5, -20.4, 5.15, 0.12, 0.74);     // phía sau bàn thờ
    for (const z of [-13.8, -14.9, -16.0, -17.1, -19.0, -19.9]) box(WD, 0, 5.93, z, 11.0, 0.1, 0.1, K.rafter); // nẹp ngang tầng cao
    // xà viền dọc tường (đỏ, gờ vàng)
    for (const sx of [-1, 1]) { box(WD, sx * 8.71, 4.97, -16.85, 0.18, 0.36, 11.3, K.lac); box(GD, sx * 8.615, 4.82, -16.85, 0.03, 0.04, 11.3, K.gold); }
    box(WD, 0, 4.97, -22.485, 17.6, 0.36, 0.03, K.lac); // xà sau: mỏng, nằm sau phông đỏ (z -22,41) và tường vạn Phật (z -22,46) để không che đỉnh tranh
    // diềm đứng quanh hộp tầng cao (5,15 → 6,0). Diềm sau (z -20,4, hướng +z) chừa giữa trơn để gắn biển "ĐẠI HÙNG BẢO ĐIỆN"
    boxMM(WD, -5.5, 5.15, -12.2, 5.5, 6.0, -12.1, K.red);      // trước
    boxMM(WD, -5.5, 5.15, -20.5, 5.5, 6.0, -20.4, K.red);      // sau
    boxMM(WD, -5.5, 5.15, -20.5, -5.4, 6.0, -12.1, K.red);     // trái
    boxMM(WD, 5.4, 5.15, -20.5, 5.5, 6.0, -12.1, K.red);       // phải
    for (const y of [5.13, 5.98]) { // khung viền vàng trên dưới
      boxMM(GD, -5.56, y, -12.26, 5.56, y + 0.04, -12.06, K.gold); boxMM(GD, -5.56, y, -20.54, 5.56, y + 0.04, -20.34, K.gold);
      boxMM(GD, -5.56, y, -20.54, -5.36, y + 0.04, -12.06, K.gold); boxMM(GD, 5.36, y, -20.54, 5.56, y + 0.04, -12.06, K.gold);
    }
    // hoa văn mây vàng trên diềm
    const fy = 5.575, fh = 0.81, o = 0.006;
    run(-5.4, 5.4, 0.8, (c, l) => { aq(c, fy, -12.1 + o, l, fh, 0, 'fasc'); aq(c, fy, -12.2 - o, l, fh, PI, 'fasc'); });
    run(-5.4, -2.2, 0.8, (c, l) => aq(c, fy, -20.4 + o, l, fh, 0, 'fasc'));
    run(2.2, 5.4, 0.8, (c, l) => aq(c, fy, -20.4 + o, l, fh, 0, 'fasc'));
    run(-20.4, -12.2, 0.8, (c, l) => {
      aq(-5.4 + o, fy, c, l, fh, PI / 2, 'fasc'); aq(-5.5 - o, fy, c, l, fh, -PI / 2, 'fasc');
      aq(5.4 - o, fy, c, l, fh, -PI / 2, 'fasc'); aq(5.5 + o, fy, c, l, fh, PI / 2, 'fasc');
    });
  });

  // =====================================================================
  //  HAI XÀ NGANG ĐỎ (z -12,9 và -18,0): chạm mây vàng hai mặt, ô sen ở giữa; đấu đỡ trên đầu cột
  // =====================================================================
  safe('xà ngang', () => {
    const yc = 4.97;
    for (const z of [-12.9, -18.0]) {
      boxMM(WD, -8.85, 4.74, z - 0.21, 8.85, 5.2, z + 0.21, K.red);
      boxMM(GD, -8.85, 4.72, z - 0.23, 8.85, 4.76, z + 0.23, K.goldD); // gờ vàng dưới đáy xà
      for (const px of [-4.6, 4.6]) { box(WD, px, 4.66, z, 0.78, 0.1, 0.5, K.lacD); box(GD, px, 4.6, z, 0.84, 0.035, 0.56, K.gold); } // đấu
      for (const [zz, yaw] of [[z + 0.214, 0], [z - 0.214, PI]]) {
        for (let k = -10; k < 10; k++) if (k !== -1 && k !== 0) aq((k + 0.5) * 0.88, yc, zz, 0.88, 0.4, yaw, 'unit');
        aq(0, yc, zz, 1.76, 0.4, yaw, 'medal');
      }
    }
  });

  // =====================================================================
  //  ĐẾ SEN VÀNG PHÁT SÁNG dưới chân cột
  // =====================================================================
  function lotus(x, z, plinth) {
    if (plinth) cyl(WD, x, Y0 + 0.12, z, 0.38, 0.4, 0.24, K.stone, 8);
    cyl(GD, x, Y0 + 0.04, z, 0.62, 0.66, 0.08, K.goldD, 16);
    const ring = (n, R, y, hh, w, tilt, color, B, off) => { // n cánh sen dẹt, nghiêng ra ngoài tilt rad
      for (let i = 0; i < n; i++) {
        const a = ((i + off) / n) * TAU, Rc = R + hh * Math.sin(tilt);
        B.add(OCT, color, { p: [x + Math.sin(a) * Rc, y + hh * Math.cos(tilt), z + Math.cos(a) * Rc], s: [w, hh, 0.04], r: [tilt, a, 0], order: 'YXZ' });
      }
    };
    ring(14, 0.42, Y0 + 0.07, 0.27, 0.13, 0.78, K.gold, GD, 0);
    ring(12, 0.34, Y0 + 0.2, 0.3, 0.12, 0.42, K.goldL, GD, 0.5);
    ring(10, 0.27, Y0 + 0.38, 0.3, 0.1, 0.16, 0xffd978, LP, 0);      // vòng cánh trong tự sáng
    LP.add(new THREE.TorusGeometry(0.5, 0.02, 3, 18), K.lamp, { p: [x, Y0 + 0.2, z], r: [PI / 2, 0, 0] });
    cyl(GD, x, Y0 + 0.97, z, 0.26, 0.29, 0.07, K.gold, 12);
    glow(x, Y0 + 0.45, z, 1.7, [1.0, 0.82, 0.4], false);
  }

  // =====================================================================
  //  RỒNG VÀNG QUẤN CỘT: thân ống thon xoắn ~1,7 vòng (gợn sóng, bậc vảy), gai lưng, chân + vuốt, đầu có sừng – râu – ngọc
  // =====================================================================
  // s = ±1 chiều xoắn (đối xứng hai cột); aHead = hướng đầu (rad, 0 = +z); weave = uốn lượn phía sau/hai bên cột, chừa mặt trước cho bảng câu đối
  function dragon(cx, cz, rcol, s, aHead, weave) {
    const N = 76, yb = Y0 + 0.78, yt = Y0 + 3.78;
    const rho = (t) => 0.04 + 0.072 * Math.pow(t, 0.8);                // bán kính thân: đuôi nhỏ → cổ to
    const ang = weave
      ? (t) => { const aw = -s * (PI - 1.75 * Math.cos(TAU * 2.25 * t)); return aw + (aHead - aw) * U.smoothstep(0.86, 1, t); }
      : (t) => aHead - s * TAU * 2.0 * Math.pow(1 - t, 1.35);          // vòng xoắn dày ở gốc, thưa dần rồi hất ra ngoài ở cổ
    const pts = [], dirs = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, a = ang(t);
      const R = rcol + rho(t) * 0.78 + 0.018 + 0.02 * Math.sin(t * TAU * 5.5) + 0.3 * U.smoothstep(0.9, 1.0, t);
      pts.push([cx + Math.sin(a) * R, yb + (yt - yb) * t + 0.07 * Math.sin(t * TAU * 4.2), cz + Math.cos(a) * R]);
      dirs.push([Math.sin(a), 0, Math.cos(a)]);
    }
    const last = pts[N], dl = dirs[N];
    for (let k = 1; k <= 4; k++) pts.push([last[0] + dl[0] * 0.05 * k, last[1] + 0.05 * k - 0.022 * k * k, last[2] + dl[2] * 0.05 * k]); // cổ cong xuống
    const n = pts.length;
    GD.addGeo(tubeGeo(pts, (u) => { const i = u * (n - 1); return i <= N ? rho(i / N) : rho(1) * (1 - 0.05 * (i - N)); }, 6,
      (i, j) => ((i >> 1) % 2 === 0 ? (j % 3 === 0 ? K.goldL : K.gold) : (j % 3 === 0 ? K.gold : K.goldD)), dirs[0]));
    // gai lưng dọc phía ngoài thân
    for (let i = 5; i <= N; i += 2) {
      const d = dirs[i], r = rho(i / N);
      aim(GD, SPK4, K.goldL, [pts[i][0] + d[0] * r * 0.7, pts[i][1] + 0.02, pts[i][2] + d[2] * r * 0.7], [d[0], 0.45, d[2]], [0.04 + 0.35 * r, 0.06 + 1.1 * r, 0.04 + 0.35 * r]);
    }
    { // chóp đuôi: ba gai nhỏ
      const b = [pts[0][0] - pts[1][0], pts[0][1] - pts[1][1], pts[0][2] - pts[1][2]];
      for (let k = -1; k <= 1; k++) aim(GD, SPK4, K.goldL, [pts[0][0] + b[0] * 0.5, pts[0][1] + b[1] * 0.5, pts[0][2] + b[2] * 0.5], [b[0] * 3 + k * 0.4 * dirs[0][2], b[1] * 3 + k * 0.15, b[2] * 3 - k * 0.4 * dirs[0][0]], [0.035, 0.13, 0.035]);
    }
    for (const ti of [0.62, 0.36]) { // hai chân có vuốt
      const i = Math.round(ti * N), d = dirs[i], tg = [Math.cos(ang(i / N)), 0, -Math.sin(ang(i / N))], r = rho(i / N);
      const a0 = [pts[i][0] + d[0] * r * 0.6, pts[i][1] - 0.02, pts[i][2] + d[2] * r * 0.6];
      const a1 = [a0[0] + d[0] * 0.1, a0[1] - 0.09, a0[2] + d[2] * 0.1], a2 = [a1[0] + d[0] * 0.08, a1[1] - 0.07, a1[2] + d[2] * 0.08];
      branch(GD, a0, a1, 0.03, 0.022, K.gold, 4); branch(GD, a1, a2, 0.022, 0.018, K.gold, 4);
      for (let k = -1; k <= 1; k++) aim(GD, SPK4, K.goldL, [a2[0] + d[0] * 0.03 + tg[0] * 0.02 * k, a2[1] - 0.03, a2[2] + d[2] * 0.03 + tg[2] * 0.02 * k], [d[0] * 0.6 + tg[0] * 0.35 * k, -0.7, d[2] * 0.6 + tg[2] * 0.35 * k], [0.018, 0.07, 0.018]);
    }
    // ----- đầu rồng (toạ độ cục bộ: +z = hướng nhìn, +y = lên) -----
    const T = U.batch();
    put(T, SPH, K.gold, 0, 0, 0, 0.105, 0.095, 0.12);                                   // sọ
    put(T, SPH, K.goldL, 0, -0.012, 0.165, 0.074, 0.055, 0.13);                         // mõm trên
    put(T, SPHS, K.gold, 0, 0.005, 0.29, 0.05, 0.04, 0.045);                            // mũi
    put(T, SPH, K.goldD, 0, -0.07, 0.135, 0.06, 0.028, 0.115, { r: [0.2, 0, 0] });      // hàm dưới (hé mở)
    for (const sx of [-1, 1]) {
      put(T, SPHS, 0x2a0e06, sx * 0.068, 0.04, 0.075, 0.026);                           // mắt
      put(T, BOX, K.gold, sx * 0.075, 0.078, 0.085, 0.075, 0.022, 0.05, { r: [0, 0, -sx * 0.35] }); // chân mày
      aim(T, SPK4, 0xfff3d0, [sx * 0.035, -0.05, 0.25], [0, -1, 0.2], [0.02, 0.05, 0.02]);          // nanh
      branch(T, [sx * 0.05, 0.08, -0.02], [sx * 0.085, 0.17, -0.1], 0.024, 0.016, K.goldL, 4);      // sừng
      branch(T, [sx * 0.085, 0.17, -0.1], [sx * 0.1, 0.22, -0.21], 0.016, 0.006, K.goldL, 4);
      aim(T, SPK4, K.gold, [sx * 0.105, 0.0, -0.03], [sx, 0.2, -0.5], [0.06, 0.12, 0.012]);         // vây tai
      const wp = []; // râu dài lượn xuống
      for (let k = 0; k <= 10; k++) { const u = k / 10; wp.push([sx * (0.06 + 0.2 * Math.sin(u * 2.4)), -0.015 - 0.27 * u * u + 0.02 * Math.sin(u * 9), 0.27 - 0.42 * u + 0.02 * Math.cos(u * 9)]); }
      T.addGeo(tubeGeo(wp, (u) => 0.011 * (1 - u) + 0.003, 3, () => K.goldL));
    }
    for (let k = 0; k < 5; k++) aim(T, SPK4, K.goldL, [0, 0.075 - 0.01 * k, -0.08 - 0.07 * k], [0, 1, -0.7], [0.06, 0.1 + 0.01 * k, 0.018]); // bờm
    for (let k = 0; k < 3; k++) aim(T, SPK4, K.gold, [0, -0.1, 0.0 + 0.05 * k], [0, -1, -0.5], [0.035, 0.09, 0.035]);               // râu cằm
    const hp = pts[n - 1], mh = new THREE.Matrix4();
    mh.compose(new V3(hp[0] + Math.sin(aHead) * 0.05, hp[1], hp[2] + Math.cos(aHead) * 0.05), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.45, aHead, 0, 'YXZ')), new V3(1.35, 1.35, 1.35)); // đầu to hơn một chút cho dễ nhìn từ xa
    const hg = U.merge(T.list); hg.applyMatrix4(mh); GD.addGeo(hg);
    const pearl = new V3(0, 0.03, 0.56).applyMatrix4(mh); // ngọc chầu trước miệng rồng
    put(LP, SPH, K.lamp, pearl.x, pearl.y, pearl.z, 0.08);
    glow(pearl.x, pearl.y, pearl.z, 1.1, [1.0, 0.88, 0.5], false);
  }

  // =====================================================================
  //  CỘT: hai cột trong cũ (±4,6; -18) quấn rồng + hai cột mới (±4,6; -12,9) có bảng câu đối sơn then
  // =====================================================================
  safe('cột', () => {
    const newPillar = (x, z) => {
      cyl(WD, x, (Y0 + 4.78) / 2, z, 0.24, 0.254, 4.78 - Y0, K.lac, 10);
      cyl(GD, x, 4.62, z, 0.275, 0.275, 0.12, K.gold, 10);
    };
    for (const sx of [-1, 1]) {
      const x = sx * 4.6;
      // cột trong cũ: chỉ thêm đế sen + rồng; cột mới: dựng thân + đế đá
      lotus(x, -18.0, false); dragon(x, -18.0, 0.233, sx, -sx * 0.55);
      newPillar(x, -12.9); lotus(x, -12.9, true); dragon(x, -12.9, 0.25, sx, -sx * 0.7, true);
      col.circle(x, -18.0, 0.5, 'pillar'); col.circle(x, -12.9, 0.5, 'pillar');
      // bảng gỗ sơn then chữ vàng đóng ở mặt trước cột mới (một chữ một dòng)
      const bz = -12.9 + 0.28, by = 2.7;
      box(WD, x, by, bz, 0.56, 2.1, 0.07, K.board);
      aq(x, by, bz + 0.0405, 0.56, 2.1, 0, sx < 0 ? 'cplA' : 'cplB');
      for (const y of [by - 1.08, by + 1.08]) { cyl(GD, x, y, -12.9, 0.262, 0.262, 0.05, K.gold, 10); box(GD, x, y, bz, 0.6, 0.04, 0.1, K.gold); }
    }
  });

  // =====================================================================
  //  ĐÈN CHÙM HOA SEN NHIỀU TẦNG (chén đèn vàng + ngọn lửa tự sáng) — treo từ trần, đáy ≥ 3,9
  // =====================================================================
  function chandelier(x, z, yTop, big) {
    const rings = big ? [[0.85, 5.36, 14], [0.64, 4.98, 10], [0.4, 4.62, 7]] : [[0.52, 4.9, 9], [0.32, 4.58, 6]];
    // đầu nụ sen cao hơn tầm máy quay trong điện (4,03) ~0,2 m: đi dọc x ≈ ±2,6 không bị nụ chắn ống kính
    const tip = big ? 4.25 : 4.3, bud = big ? 1 : 0.78, budTop = tip + 0.55 * bud, y1 = rings[0][1];
    box(GD, x, (yTop + y1) / 2, z, 0.03, yTop - y1, 0.03, K.goldD);                  // xích treo
    cyl(GD, x, yTop - 0.05, z, 0.2, 0.12, 0.1, K.goldD, 10);                         // đế bám trần
    cyl(GD, x, (y1 + budTop) / 2, z, 0.03, 0.03, y1 - budTop, K.gold, 6);            // trục giữa
    GD.add(lathe([[0, 0], [0.04, 0.07], [0.1, 0.17], [0.135, 0.3], [0.12, 0.42], [0.07, 0.5], [0.045, 0.55]].map((p) => [p[0] * bud, p[1] * bud]), 8), K.gold, { p: [x, tip, z] }); // nụ sen rủ
    rings.forEach(([r, y, n], ri) => {
      GD.add(new THREE.TorusGeometry(r, 0.022, 3, 20), K.gold, { p: [x, y, z], r: [PI / 2, 0, 0] });
      GD.add(new THREE.TorusGeometry(r * 0.52, 0.014, 3, 14), K.goldD, { p: [x, y - 0.06, z], r: [PI / 2, 0, 0] }); // vành trong nhỏ (bánh xe)
      put(GD, SPHS, K.gold, x, y - 0.14, z, 0.07);
      const ns = ri === 0 ? 10 : 8; // nan hoa hơi võng xuống về tâm, như chiếc ô lật ngược
      for (let k = 0; k < ns; k++) { const a = (k / ns) * TAU + 0.2; beam(GD, [x, y - 0.14, z], [x + Math.sin(a) * r, y, z + Math.cos(a) * r], 0.02, 0.02, K.goldD); }
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + ri * 0.4, px = x + Math.sin(a) * r, pz = z + Math.cos(a) * r;
        GD.add(CUP, K.goldL, { p: [px, y + 0.07, pz], s: [0.15, 0.13, 0.15], r: [PI, 0, 0] });                  // chén đèn hình hoa sen
        LP.add(OCT, 0xfff6d4, { p: [px, y + 0.19, pz], s: [0.045, 0.1, 0.045] });                              // ngọn lửa
        GD.add(new THREE.ConeGeometry(0.5, 1, 4, 1, true), K.goldD, { p: [px, y - 0.08, pz], s: [0.05, 0.14, 0.05], r: [PI, 0, 0] }); // giọt vàng rủ dưới chén
      }
    });
    glow(x, rings[0][1] + 0.1, z, big ? 2.3 : 1.5, [1.0, 0.82, 0.44], false);
    glow(x, rings[rings.length - 1][1] + 0.05, z, big ? 1.7 : 1.1, [1.0, 0.8, 0.42], false);
    if (big) glow(x, tip + 0.3, z, 1.1, [1.0, 0.76, 0.36], false);
  }
  safe('đèn chùm', () => {
    for (const sx of [-1, 1]) { chandelier(sx * 2.6, -14.35, 6.0, true); chandelier(sx * 2.6, -16.55, 6.0, true); chandelier(sx * 6.8, -15.6, 5.15, false); }
  });

  // =====================================================================
  //  HAI PHƯỚN VẢI treo từ trần (±6,9; -12,0): "NAM MÔ A DI ĐÀ PHẬT" (trái) / "NAM MÔ QUÁN THẾ ÂM BỒ TÁT" (phải), tua vàng
  // =====================================================================
  safe('phướn', () => {
    for (const sx of [-1, 1]) {
      const x = sx * 6.9, z = -12.0, top = 4.9, H = 3.14, name = sx < 0 ? 'banA' : 'banB';
      aq(x, top - H / 2, z + 0.006, 0.82, H, 0, name); aq(x, top - H / 2, z - 0.006, 0.82, H, PI, name);
      cyl(WD, x, top + 0.03, z, 0.028, 0.028, 1.0, K.lacD, 6, { r: [0, 0, PI / 2] });                  // thanh ngang trên
      for (const e of [-1, 1]) { put(GD, SPHS, K.gold, x + e * 0.5, top + 0.03, z, 0.05); box(WD, x + e * 0.36, (top + 5.15) / 2, z, 0.012, 5.15 - top, 0.012, K.rafter); } // núm vàng + dây treo
      const sideY = top - H + 0.235, tipY = top - H + 0.02;                                           // đuôi nheo chữ V
      for (const e of [-1, 1]) beam(GD, [x + e * 0.4, sideY, z], [x, tipY, z], 0.022, 0.022, K.gold);
      for (const [tx, ty] of [[-0.4, sideY], [-0.2, (sideY + tipY) / 2 + 0.02], [0, tipY], [0.2, (sideY + tipY) / 2 + 0.02], [0.4, sideY]]) {
        put(GD, SPHS, K.gold, x + tx, ty - 0.01, z, 0.025);
        aim(GD, SPK4, K.gold, [x + tx, ty - 0.1, z], [0, -1, 0], [0.04, 0.16, 0.04]);               // tua rua
      }
    }
  });

  // =====================================================================
  //  CỬA SỔ CHẤN SONG hai bên tường (z -15,5 và -19,3): giấy dó sáng ấm, tự phát sáng
  // =====================================================================
  const WQ = newQ();
  safe('cửa sổ', () => {
    for (const sx of [-1, 1]) for (const zc of [-15.5, -19.3]) {
      quad(WQ, sx * 8.788, 2.9, zc, 1.9, 1.85, sx < 0 ? PI / 2 : -PI / 2, [0, 0, 1, 1]);
      const fx = sx * 8.75;
      box(WD, fx, 2.9 + 0.99, zc, 0.09, 0.14, 2.14, K.lacD); box(WD, fx, 2.9 - 0.99, zc, 0.09, 0.14, 2.14, K.lacD);
      for (const e of [-1, 1]) box(WD, fx, 2.9, zc + e * 1.0, 0.09, 1.84, 0.14, K.lacD);
      box(WD, sx * 8.7, 2.9 - 1.1, zc, 0.22, 0.05, 2.3, K.lac);
      box(GD, sx * 8.7, 2.9 - 1.08, zc, 0.23, 0.02, 2.3, K.gold);
    }
  });
  let winTex = null;
  safe('ảnh cửa sổ', () => {
    winTex = U.canvasTex(256, 256, (g, w, h) => {
      const bg = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.78); bg.addColorStop(0, '#fff8e0'); bg.addColorStop(1, '#ffd890');
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      const rnd = U.rng(77), cell = w / 5;
      for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) { g.fillStyle = `rgba(255,255,255,${0.08 + rnd() * 0.22})`; g.fillRect(i * cell, j * cell, cell, cell); }
      g.strokeStyle = '#4e2614'; g.lineCap = 'square'; g.lineWidth = 7;
      for (let k = 1; k < 5; k++) { g.beginPath(); g.moveTo(k * cell, 0); g.lineTo(k * cell, h); g.moveTo(0, k * cell); g.lineTo(w, k * cell); g.stroke(); }
      g.lineWidth = 12; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke();
      g.lineWidth = 16; g.strokeRect(0, 0, w, h);
    });
  });
  const winMat = winTex ? new THREE.MeshBasicMaterial({ map: winTex }) : null;

  // =====================================================================
  //  CHUÔNG ĐỒNG (trái) trong khung gỗ + TRỐNG (phải) trên giá — "tả chung hữu cổ"; mỗi khung ≤ 1,1 × 1,1 m, có vật cản
  // =====================================================================
  safe('chuông', () => {
    const bx = -7.0, bz = -16.6, y = Y0;
    for (const sx of [-1, 1]) {
      box(WD, bx + sx * 0.5, y + 0.06, bz, 0.12, 0.12, 1.1, K.lacD);                                  // thanh chân
      box(WD, bx + sx * 0.5, y + 1.12, bz, 0.12, 2.0, 0.12, K.lac);                                   // trụ
      beam(WD, [bx + sx * 0.5, y + 1.7, bz], [bx + sx * 0.22, y + 2.12, bz], 0.07, 0.07, K.lacD);      // giằng góc
      aim(GD, SPK4, K.gold, [bx + sx * 0.7, y + 2.3, bz], [sx * 0.6, 1, 0], [0.09, 0.22, 0.09]);       // đầu xà cong vàng
    }
    box(WD, bx, y + 2.2, bz, 1.3, 0.14, 0.16, K.lac); box(GD, bx, y + 2.12, bz, 1.3, 0.025, 0.18, K.gold);
    cyl(GD, bx, y + 2.08, bz, 0.025, 0.025, 0.1, K.goldD, 5);
    GD.add(new THREE.TorusGeometry(0.05, 0.014, 4, 8), K.gold, { p: [bx, y + 2.03, bz] });
    const ym = y + 1.05; // miệng chuông
    WD.add(lathe([[0.36, 0], [0.37, 0.05], [0.335, 0.12], [0.29, 0.35], [0.245, 0.58], [0.2, 0.76], [0.12, 0.88], [0.05, 0.94], [0, 0.96]], 12), K.bronze, { p: [bx, ym, bz], j: 0.1 });
    WD.add(new THREE.CircleGeometry(0.34, 12), K.bronzeD, { p: [bx, ym + 0.02, bz], r: [PI / 2, 0, 0] });  // lòng chuông tối
    for (const [by, r] of [[0.1, 0.352], [0.5, 0.262], [0.8, 0.173]]) GD.add(new THREE.TorusGeometry(r, 0.016, 3, 14), K.gold, { p: [bx, ym + by, bz], r: [PI / 2, 0, 0] });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; put(GD, SPHS, K.goldD, bx + Math.sin(a) * 0.27, ym + 0.64, bz + Math.cos(a) * 0.27, 0.03); } // núm chuông
    box(WD, bx, y + 0.07, bz, 0.9, 0.05, 0.9, K.lacD); // bệ gỗ dưới chuông
    col.box(bx - 0.55, bz - 0.55, bx + 0.55, bz + 0.55, 'bell');
  });
  safe('trống', () => {
    const dx = 7.0, dz = -16.6, yc = Y0 + 0.93, tilt = 0.2;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(WD, dx + sx * 0.3, Y0 + 0.26, dz + sz * 0.4, 0.1, 0.52, 0.1, K.lac);   // bốn chân giá
    for (const sx of [-1, 1]) box(WD, dx + sx * 0.3, Y0 + 0.55, dz, 0.1, 0.07, 0.95, K.lacD);                                       // thanh đỡ dọc
    for (const sz of [-1, 1]) box(WD, dx, Y0 + 0.2, dz + sz * 0.4, 0.7, 0.06, 0.07, K.lacD);                                         // giằng thấp
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(GD, SPHS, K.gold, dx + sx * 0.3, Y0 + 0.53, dz + sz * 0.46, 0.04);       // núm vàng đầu thanh
    // thùng trống dựng theo trục y rồi nghiêng nằm ngang (mặt trước ngẩng lên đón người vào điện)
    const T1 = U.batch(), T2 = U.batch();
    T1.add(lathe([[0.4, -0.43], [0.44, -0.38], [0.465, -0.2], [0.475, 0], [0.465, 0.2], [0.44, 0.38], [0.4, 0.43]], 14), K.drum);
    for (const sg of [-1, 1]) {
      T1.add(new THREE.CircleGeometry(0.4, 14).rotateX(sg > 0 ? -PI / 2 : PI / 2), K.skin, { p: [0, 0.432 * sg, 0] });                // mặt trống
      T1.add(new THREE.CircleGeometry(0.2, 12).rotateX(sg > 0 ? -PI / 2 : PI / 2), K.drum, { p: [0, 0.438 * sg, 0] });
      T2.add(new THREE.CircleGeometry(0.07, 8).rotateX(sg > 0 ? -PI / 2 : PI / 2), K.gold, { p: [0, 0.444 * sg, 0] });
      for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; T2.add(OCT, K.gold, { p: [Math.cos(a) * 0.41, 0.405 * sg, Math.sin(a) * 0.41], s: 0.024 }); } // đinh tán
      T2.add(new THREE.TorusGeometry(0.468, 0.014, 3, 16), K.gold, { p: [0, 0.2 * sg, 0], r: [PI / 2, 0, 0] });                        // đai vàng
    }
    const mt = new THREE.Matrix4().makeRotationX(PI / 2 - tilt).setPosition(dx, yc, dz);
    const g1 = U.merge(T1.list), g2 = U.merge(T2.list); g1.applyMatrix4(mt); g2.applyMatrix4(mt); WD.addGeo(g1); GD.addGeo(g2);
    col.box(dx - 0.55, dz - 0.55, dx + 0.55, dz + 0.55, 'drum');
  });

  // =====================================================================
  //  GỘP MESH + CẮT CẢNH TRONG ĐIỆN KHI Ở XA + ĐỔI SÁNG THEO GIỜ
  // =====================================================================
  const meshes = [];
  const addMesh = (m) => { m.castShadow = false; scene.add(m); meshes.push(m); return m; };
  safe('gộp mesh', () => {
    if (WD.list.length) addMesh(WD.mesh(G.mats.vc, { cast: false, receive: true }));
    if (GD.list.length) addMesh(GD.mesh(goldMat, { cast: false, receive: true }));
    if (LP.list.length) addMesh(LP.mesh(G.mats.lantern, { cast: false, receive: false }));
    for (const [Q, mat] of [[ATL, signMat], [WQ, winMat]]) {
      if (!mat || !Q.pos.length) continue;
      const m = new THREE.Mesh(quadGeo(Q), mat); m.receiveShadow = false; m.matrixAutoUpdate = false; m.updateMatrix(); addMesh(m);
    }
  });
  G.frame.shift(fm, G.L.hall.dy, G.L.hall.dz);
  let tris = 0; for (const m of meshes) tris += m.geometry.attributes.position.count / 3;
  W.hallArch = { meshes, tris, drawCalls: meshes.length };

  const gDay = new THREE.Color(0x6e4410), gNight = new THREE.Color(0x8a5818), wDay = new THREE.Color(1.0, 0.98, 0.9), wNight = new THREE.Color(0.9, 0.6, 0.34);
  let shown = true;
  const nc = G.frame.xf(0, 3, -11); // cửa điện (toạ độ gốc (0, 3, -11) → xf)
  const near = (p) => { const dx = p.x - nc.x, dy = p.y - nc.y, dz = p.z - nc.z; return dx * dx + dy * dy + dz * dz < 38 * 38; }; // cách cửa điện hơn 38 m thì ẩn nội thất
  const setVis = (v) => { for (const m of meshes) m.visible = v; };
  const tint = () => {
    const n = G.tod ? G.tod.night : 0;
    goldMat.emissive.copy(gDay).lerp(gNight, n);
    if (signMat) signMat.emissiveIntensity = 0.42 + n * 0.3;
    if (winMat) winMat.color.copy(wDay).lerp(wNight, n);
  };
  G.onUpdate(() => {
    const vis = near(G.camera.position);
    if (vis !== shown) { shown = vis; setVis(vis); }
    if (vis) tint();
  }, 90);
  // ảnh chia sẻ chụp bằng máy quay riêng (nhìn thẳng vào điện): bật nội thất theo máy đó rồi trả lại như cũ
  G.events.on('snapshot:before', (sc) => { if (sc && near(sc.position)) { setVis(true); tint(); } });
  G.events.on('snapshot:after', () => setVis(shown));
  if (G.nav) G.nav.built = false; // vật cản mới → dựng lại đồ thị dẫn đường khi G.start()
}
