// =====================================================================
//  BÀN THỜ CHÍNH ĐIỆN — phông đỏ viền vàng có bánh xe pháp luân, màn vàng vén hai bên, biển
//  "ĐẠI HÙNG BẢO ĐIỆN", hào quang toả tia, lọng vàng, nến – đèn sen – bình sen, hạc chầu rùa,
//  hai bức tường vạn Phật (ô vòm có tượng Phật nhỏ, ánh đèn ấm), hai bàn thờ phụ Bồ Tát,
//  thảm đỏ viền vàng chia chiếu vuông và 18 bồ đoàn vàng (chỗ ngồi cho khách điền vào W.seats).
//  Gộp thành 5 mesh: vàng (Phong) / sơn đỏ (Lambert) / tự sáng + 2 tấm texture canvas có phát sáng.
// =====================================================================
function buildHallAltar(G) {
  const { THREE, util: U, scene } = G;
  const W = G.world, col = G.collide, GB = G.build;
  if (!W || !GB || !G.mats) return;
  const { BOX, lathe, branch, glow } = GB;
  const PI = Math.PI, TAU = PI * 2;
  const FY = (G.L && G.L.hall && G.L.hall.h) || 0.6;       // mặt nền điện (gạch đỏ ≈ FY + 0,02)
  const fm = G.frame.mark();                                 // dựng theo toạ độ gốc, cuối hàm dời nguyên khối lên chỗ chính điện đứng
  const safe = (name, fn) => { try { fn(); } catch (e) { console.error('[bàn thờ chính điện]', name, e); } };
  const TQ = G.isTouch ? 0.7 : 1;                            // độ phân giải texture (máy cảm ứng giảm bớt)
  const K = {
    gold: 0xe2b04a, goldL: 0xf4d27a, goldD: 0xa87c2c, bronze: 0x8f6a36, bronzeD: 0x5a4220,
    red: 0x8f2418, redD: 0x5e140e, redL: 0xb82c20, lac: 0x7a2418,
    yel: 0xffb52a, yelD: 0xc9780f, cream: 0xf3e3c3, pink: 0xf2a8c0, pinkL: 0xfbe4ea, leaf: 0x4c7a35, blue: 0x2f5f9e,
  };
  const rgb = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };

  // ---------- Hình gốc dùng chung + bộ gom ----------
  const CONE3 = new THREE.ConeGeometry(0.5, 1, 3), CONE4 = new THREE.ConeGeometry(0.5, 1, 4), CONE6 = new THREE.ConeGeometry(0.5, 1, 6);
  const SPH = new THREE.SphereGeometry(1, 8, 6), SPHS = new THREE.SphereGeometry(1, 6, 4);
  const PLANE_UP = new THREE.PlaneGeometry(1, 1).rotateX(-PI / 2);
  const discGeo = {};
  const DISC = (sg) => discGeo[sg] || (discGeo[sg] = new THREE.CylinderGeometry(1, 1, 1, sg).rotateX(PI / 2)); // đĩa trục z, bán kính 1, dày 1
  const V = U.batch(), GD = U.batch(), LT = U.batch(); // sơn đỏ (Lambert) / vàng (Phong) / tự sáng (Basic)
  const put = (B, g, c, x, y, z, sx, sy = sx, sz = sx, o) => B.add(g, c, Object.assign({ p: [x, y, z], s: [sx, sy, sz] }, o));
  const bmm = (B, x0, y0, z0, x1, y1, z1, c, j = 0.03) => B.add(BOX, c, { p: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], s: [Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)], j });
  const cylY = (B, x, y, z, rt, rb, h, c, sg = 10, o) => B.add(new THREE.CylinderGeometry(rt, rb, h, sg), c, Object.assign({ p: [x, y + h / 2, z] }, o));
  const flat = (B, x0, z0, x1, z1, y, c, j = 0.015) => B.add(PLANE_UP, c, { p: [(x0 + x1) / 2, y, (z0 + z1) / 2], s: [Math.abs(x1 - x0), 1, Math.abs(z1 - z0)], j });
  const disc = (B, x, y, z, rx, ry, t, c, sg = 14, o) => B.add(DISC(sg), c, Object.assign({ p: [x, y, z], s: [rx, ry, t] }, o));
  const _mp = new THREE.Matrix4(), _sv = new THREE.Vector3();
  // dựng một cụm theo toạ độ cục bộ (gốc ở nền) rồi đặt tại (x,y,z), xoay yaw quanh trục đứng, thu phóng sc
  const grp = (B, x, y, z, yaw, sc, fn) => {
    const T = U.batch(); fn(T);
    if (!T.list.length) return;
    const g = U.merge(T.list); _mp.makeRotationY(yaw); _mp.scale(_sv.set(sc, sc, sc)); _mp.setPosition(x, y, z); g.applyMatrix4(_mp); B.addGeo(g);
  };
  // gom các tam giác có màu đỉnh (không chỉ mục) thành một hình; tự lật mặt để pháp tuyến quay về +z (nhìn từ cửa điện)
  // tris: [p0, p1, p2, c0, c1, c2] — p = [x,y,z], c = [r,g,b] (không gian tuyến tính, lấy từ rgb())
  function triGeo(tris) {
    const pos = [], colr = [];
    for (const t of tris) {
      const a = t[0], b = t[1], c = t[2];
      const cz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      const o = cz >= 0 ? [0, 1, 2] : [0, 2, 1];
      for (const k of o) { pos.push(t[k][0], t[k][1], t[k][2]); colr.push(t[3 + k][0], t[3 + k][1], t[3 + k][2]); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
    g.computeVertexNormals();
    return g;
  }
  // tấm phẳng có UV: mỗi quad = { p: [BL, BR, TR, TL], uv: [u0, v0, u1, v1] }
  function quadsGeo(qs) {
    const pos = [], uv = [], nor = [], idx = [];
    qs.forEach((q, n) => {
      const a = q.p[0], b = q.p[1], d = q.p[3];
      const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
      let nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0];
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const [u0, v0, u1, v1] = q.uv, us = [u0, u1, u1, u0], vs = [v0, v0, v1, v1];
      for (let k = 0; k < 4; k++) { pos.push(q.p[k][0], q.p[k][1], q.p[k][2]); uv.push(us[k], vs[k]); nor.push(nx, ny, nz); }
      idx.push(n * 4, n * 4 + 1, n * 4 + 2, n * 4, n * 4 + 2, n * 4 + 3);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeBoundingSphere();
    return g;
  }
  const uvR = (x0, y0, x1, y1, w, h) => [x0 / w, 1 - y1 / h, x1 / w, 1 - y0 / h]; // hình chữ nhật pixel (y từ trên) → UV

  // =====================================================================
  //  TEXTURE 1 (atlas): phông đỏ sau tượng (0,0)–(1800,910) = 200 px/m, và biển chữ (0,960)–(1060,1133)
  //    phông: x_px = (X + 4,5)·200, y_px = (5,15 − Y)·200  (X, Y theo mét; Y = 0,6 … 5,15)
  // =====================================================================
  const AW = 1808, AH = 1140;
  const texA = U.canvasTex(Math.round(AW * TQ), Math.round(AH * TQ), (g, w, h) => {
    g.scale(w / AW, h / AH);
    const gold = '#e8b84a', goldL = '#f8dc84';
    g.fillStyle = '#3e0c07'; g.fillRect(0, 0, AW, AH);
    // ----- phông -----
    g.save(); g.beginPath(); g.rect(0, 0, 1800, 910); g.clip();
    const bg = g.createLinearGradient(0, 0, 0, 910); bg.addColorStop(0, '#821b11'); bg.addColorStop(1, '#5c0f08');
    g.fillStyle = bg; g.fillRect(0, 0, 1800, 910);
    g.strokeStyle = 'rgba(232,184,74,.10)'; g.lineWidth = 2; // hoa văn gấm chìm
    for (let y = 30, r = 0; y < 920; y += 44, r++) for (let x = r & 1 ? 22 : 0; x < 1800; x += 44) { g.beginPath(); g.arc(x, y, 14, 0, TAU); g.stroke(); }
    const rg = g.createRadialGradient(900, 370, 30, 900, 370, 580); // quầng sáng sau tượng
    rg.addColorStop(0, 'rgba(255,200,100,.9)'); rg.addColorStop(0.3, 'rgba(246,146,54,.55)'); rg.addColorStop(0.65, 'rgba(204,64,28,.24)'); rg.addColorStop(1, 'rgba(120,20,10,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 1800, 910);
    for (const [r, lw, a] of [[385, 5, 0.6], [428, 3, 0.45], [474, 3, 0.32], [528, 2, 0.22]]) { g.strokeStyle = `rgba(248,214,120,${a})`; g.lineWidth = lw; g.beginPath(); g.arc(900, 370, r, 0, TAU); g.stroke(); }
    g.strokeStyle = 'rgba(248,214,120,.16)'; g.lineWidth = 2;
    for (let k = 0; k < 56; k++) { const a = (k / 56) * TAU; g.beginPath(); g.moveTo(900 + Math.cos(a) * 392, 370 + Math.sin(a) * 392); g.lineTo(900 + Math.cos(a) * 600, 370 + Math.sin(a) * 600); g.stroke(); }
    // bánh xe pháp luân (tám nan) trong ô vuông viền vàng
    const wheel = (cx, cy, R) => {
      g.strokeStyle = gold; g.fillStyle = gold;
      g.lineWidth = R * 0.15; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
      g.lineWidth = R * 0.1; g.beginPath(); g.arc(cx, cy, R * 0.42, 0, TAU); g.stroke();
      g.lineWidth = R * 0.1;
      for (let k = 0; k < 8; k++) {
        const a = (k * PI) / 4, ca = Math.cos(a), sa = Math.sin(a);
        g.beginPath(); g.moveTo(cx + ca * R * 0.42, cy + sa * R * 0.42); g.lineTo(cx + ca * R, cy + sa * R); g.stroke();
        g.beginPath(); g.arc(cx + ca * R * 1.22, cy + sa * R * 1.22, R * 0.1, 0, TAU); g.fill();
      }
      g.beginPath(); g.arc(cx, cy, R * 0.17, 0, TAU); g.fill();
    };
    const cell = (cx, cy) => {
      g.fillStyle = 'rgba(40,4,2,.30)'; g.fillRect(cx - 82, cy - 82, 164, 164);
      g.strokeStyle = gold; g.lineWidth = 5; g.strokeRect(cx - 82, cy - 82, 164, 164);
      g.strokeStyle = 'rgba(248,214,120,.55)'; g.lineWidth = 2; g.strokeRect(cx - 73, cy - 73, 146, 146);
      g.fillStyle = 'rgba(232,184,74,.5)';
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        const a0 = Math.atan2(-sy, -sx); g.beginPath(); g.moveTo(cx + sx * 73, cy + sy * 73); g.arc(cx + sx * 73, cy + sy * 73, 30, a0 - PI / 4, a0 + PI / 4); g.closePath(); g.fill();
      }
      wheel(cx, cy, 46);
    };
    for (const cx of [150, 1650]) {
      g.fillStyle = 'rgba(52,6,3,.5)'; g.fillRect(cx - 95, 0, 190, 910);
      g.strokeStyle = gold; g.lineWidth = 5; g.strokeRect(cx - 93, 14, 186, 882);
      for (const cy of [140, 350, 560]) cell(cx, cy);
    }
    // dải hoa văn mây dưới trần, giữa hai cột ô
    g.strokeStyle = 'rgba(248,214,120,.8)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(262, 38); g.lineTo(1538, 38); g.moveTo(262, 100); g.lineTo(1538, 100); g.stroke();
    for (let x = 292; x < 1520; x += 58) {
      g.lineWidth = 3.5; g.beginPath(); g.arc(x - 11, 74, 8, PI, TAU); g.arc(x + 11, 74, 8, PI, TAU); g.moveTo(x - 22, 74); g.lineTo(x + 22, 74); g.stroke();
      g.fillStyle = gold; g.beginPath(); g.arc(x, 56, 3.5, 0, TAU); g.fill();
    }
    g.strokeStyle = gold; g.lineWidth = 16; g.strokeRect(8, 8, 1784, 894);          // viền ngoài vàng
    g.strokeStyle = 'rgba(248,214,120,.7)'; g.lineWidth = 4; g.strokeRect(28, 28, 1744, 854);
    g.restore();
    // ----- biển "ĐẠI HÙNG BẢO ĐIỆN" -----
    g.save(); g.translate(0, 960);
    const sg = g.createLinearGradient(0, 0, 0, 173); sg.addColorStop(0, '#7e1a10'); sg.addColorStop(1, '#560f09');
    g.fillStyle = sg; g.fillRect(0, 0, 1060, 173);
    g.strokeStyle = gold; g.lineWidth = 10; g.strokeRect(6, 6, 1048, 161);
    g.strokeStyle = 'rgba(248,214,120,.75)'; g.lineWidth = 3; g.strokeRect(20, 20, 1020, 133);
    const chars = Array.from('ĐẠI HÙNG BẢO ĐIỆN'), font = (s) => `700 ${s}px "Noto Serif", "Times New Roman", serif`;
    let fs = 100, sp = 8, tw = 0;
    for (; fs > 20; fs -= 2) { g.font = font(fs); sp = fs * 0.06; tw = chars.reduce((a, c) => a + g.measureText(c).width, 0) + sp * (chars.length - 1); if (tw <= 950) break; }
    const tg = g.createLinearGradient(0, 40, 0, 135); tg.addColorStop(0, '#fff0b8'); tg.addColorStop(1, '#eab444');
    g.fillStyle = tg; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 6; g.shadowOffsetY = 3;
    let tx = 530 - tw / 2;
    for (const c of chars) { g.fillText(c, tx, 90); tx += g.measureText(c).width + sp; }
    g.restore();
  });
  const matA = new THREE.MeshLambertMaterial({ map: texA, emissive: 0xffffff, emissiveMap: texA, emissiveIntensity: 0.4 });

  // =====================================================================
  //  TEXTURE 2: tường vạn Phật — lưới 9 × 8 ô vòm sáng đèn, mỗi ô có tượng Phật nhỏ ngồi toà sen
  // =====================================================================
  const NC = 9, NR = 8, CW = 128, CH = 153;
  const texN = U.canvasTex(Math.round(NC * CW * TQ), Math.round(NR * CH * TQ), (g, w, h) => {
    g.scale(w / (NC * CW), h / (NR * CH));
    const rnd = U.rng(77), PW = NC * CW, PH = NR * CH;
    const bg = g.createLinearGradient(0, 0, 0, PH); bg.addColorStop(0, '#6c140c'); bg.addColorStop(1, '#4c0c07');
    g.fillStyle = bg; g.fillRect(0, 0, PW, PH);
    const arch = (l, r, t, b) => { const R = (r - l) / 2; g.beginPath(); g.moveTo(l, b); g.lineTo(l, t + R); g.arc(l + R, t + R, R, PI, 0); g.lineTo(r, b); g.closePath(); };
    for (let j = 0; j < NR; j++) for (let i = 0; i < NC; i++) {
      const x0 = i * CW, y0 = j * CH, cx = x0 + CW / 2, l = x0 + 17, r = x0 + CW - 17, t = y0 + 20, b = y0 + CH - 20, R = (r - l) / 2;
      g.fillStyle = '#d9a640'; arch(l - 5, r + 5, t - 5, b + 4); g.fill();                  // gờ vàng quanh ô
      const rg = g.createRadialGradient(cx, t + R + 10, 4, cx, t + R + 10, 82);
      rg.addColorStop(0, '#fff6cc'); rg.addColorStop(0.45, '#ffd87a'); rg.addColorStop(1, '#e88f2a');
      g.fillStyle = rg; arch(l, r, t, b); g.fill();
      g.save(); arch(l, r, t, b); g.clip();                                                 // bóng lõm + đèn sáng tối không đều
      g.strokeStyle = 'rgba(110,40,8,.42)'; g.lineWidth = 9; arch(l, r, t, b); g.stroke();
      g.fillStyle = `rgba(60,16,2,${rnd() * 0.2})`; g.fillRect(l, t, r - l, b - t);
      // tượng Phật nhỏ: đài sen, thân, tay thiền, đầu + hào quang
      g.fillStyle = '#9b5b17'; g.beginPath(); g.ellipse(cx, b - 8, 28, 8, 0, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(cx - 24, b - 9); g.quadraticCurveTo(cx - 27, b - 38, cx - 12, b - 50); g.lineTo(cx + 12, b - 50); g.quadraticCurveTo(cx + 27, b - 38, cx + 24, b - 9); g.closePath(); g.fill();
      g.fillStyle = '#c98524'; g.beginPath(); g.ellipse(cx, b - 25, 12, 6, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,252,226,.9)'; g.beginPath(); g.arc(cx, b - 66, 15, 0, TAU); g.fill();
      g.fillStyle = '#9b5b17'; g.beginPath(); g.arc(cx, b - 65, 8.5, 0, TAU); g.fill();
      g.beginPath(); g.arc(cx, b - 75, 3.2, 0, TAU); g.fill();
      g.restore();
      if (i && j) { g.fillStyle = '#c99a3a'; g.save(); g.translate(x0, y0); g.rotate(PI / 4); g.fillRect(-3, -3, 6, 6); g.restore(); } // chấm vàng ở góc ô
    }
    g.strokeStyle = '#e2b04c'; g.lineWidth = 12; g.strokeRect(6, 6, PW - 12, PH - 12);       // khung vàng quanh bức
    g.strokeStyle = 'rgba(248,214,120,.7)'; g.lineWidth = 3; g.strokeRect(14, 14, PW - 28, PH - 28);
  });
  const matN = new THREE.MeshLambertMaterial({ map: texN, emissive: 0xffffff, emissiveMap: texN, emissiveIntensity: 0.8 });

  // =====================================================================
  //  PHÔNG ĐỎ + BIỂN CHỮ (một mesh dùng atlas) và hai bức tường vạn Phật
  // =====================================================================
  const quadsA = [], quadsN = [];
  safe('phong', () => {
    const zb = -22.41;
    quadsA.push({ p: [[-4.5, 0.6, zb], [4.5, 0.6, zb], [4.5, 5.15, zb], [-4.5, 5.15, zb]], uv: uvR(0, 0, 1800, 910, AW, AH) });
    // biển treo kiểu hoành phi trên mặt trước xà ngang z = -18 (ngay trên bàn thờ): đứng ở cửa hay theo sau lưng đều đọc được
    const zs = -17.74, y0 = 4.555, y1 = 5.165;
    quadsA.push({ p: [[-1.87, y0, zs], [1.87, y0, zs], [1.87, y1, zs], [-1.87, y1, zs]], uv: uvR(0, 960, 1060, 1133, AW, AH) });
    // khung vàng nổi quanh biển
    bmm(GD, -1.94, y0 - 0.065, zs - 0.015, 1.94, y0 + 0.005, zs + 0.035, K.gold); bmm(GD, -1.94, y1 - 0.005, zs - 0.015, 1.94, y1 + 0.065, zs + 0.035, K.gold);
    bmm(GD, -1.94, y0 - 0.065, zs - 0.015, -1.87, y1 + 0.065, zs + 0.035, K.gold); bmm(GD, 1.87, y0 - 0.065, zs - 0.015, 1.94, y1 + 0.065, zs + 0.035, K.gold);
    bmm(V, -1.94, y0 - 0.065, -17.8, 1.94, 4.75, zs - 0.015, K.lac); // tấm lưng phần biển thò dưới đáy xà
    for (const s of [-1, 1]) {
      // cột chia ô + viền ngoài (vàng nổi)
      bmm(GD, s * 3.27, 1.6, -22.415, s * 3.34, 5.15, -22.35, K.gold); bmm(GD, s * 4.43, 1.6, -22.415, s * 4.52, 5.15, -22.35, K.gold);
      // ba bánh xe pháp luân nổi trên ô viền
      for (const y of [4.45, 3.4, 2.35]) {
        const x = s * 3.75, z = -22.37;
        put(GD, new THREE.TorusGeometry(0.27, 0.028, 4, 16), K.goldL, x, y, z, 1);
        put(GD, new THREE.TorusGeometry(0.115, 0.02, 4, 10), K.gold, x, y, z, 1);
        for (let k = 0; k < 4; k++) put(GD, BOX, K.gold, x, y, z, 0.5, 0.035, 0.03, { r: [0, 0, (k * PI) / 4], j: 0.02 });
        put(GD, SPHS, K.goldL, x, y, z, 0.06, 0.06, 0.035);
      }
    }
  });

  safe('vanPhat-tuong', () => {
    for (const s of [-1, 1]) {
      const xl = s > 0 ? 4.62 : -8.58, xr = s > 0 ? 8.58 : -4.62, zp = -22.46, ya = 0.95, yb = 5.1;
      quadsN.push({ p: [[xl, ya, zp], [xr, ya, zp], [xr, yb, zp], [xl, yb, zp]], uv: [0, 0, 1, 1] });
      // khung vàng mảnh nổi (ngoài + chia khối 3 cột × 2 nửa)
      const xa = xl - 0.06, xb = xr + 0.06, zf0 = -22.5, zf1 = -22.42;
      bmm(GD, xa, 0.93, zf0, xb, 0.99, zf1, K.gold); bmm(GD, xa, 5.06, zf0, xb, 5.12, zf1, K.gold);
      bmm(GD, xa, 0.93, zf0, xl, 5.12, zf1, K.gold); bmm(GD, xr, 0.93, zf0, xb, 5.12, zf1, K.gold);
      const cw = (xr - xl) / NC;
      for (const k of [3, 6]) bmm(GD, xl + cw * k - 0.02, 0.99, zf0, xl + cw * k + 0.02, 5.06, zf1 + 0.01, K.goldD);
      bmm(GD, xl, 3.0, zf0, xr, 3.04, zf1 + 0.01, K.goldD);
      // tủ thấp phía dưới: thân đỏ sơn son, gờ vàng, bốn ô lõm có hai huy chương vàng bầu dục
      const cx0 = Math.min(xa, xb), cx1 = Math.max(xa, xb);
      bmm(V, cx0, FY, -22.5, cx1, 0.9, -22.15, K.lac);
      bmm(GD, cx0 - 0.02, 0.9, -22.5, cx1 + 0.02, 0.96, -22.11, K.gold);
      bmm(GD, cx0, FY, -22.5, cx1, 0.69, -22.13, K.goldD);
      const pw = (cx1 - cx0) / 4;
      for (let k = 0; k < 4; k++) {
        const pc = cx0 + pw * (k + 0.5), hw = pw * 0.43;
        bmm(V, pc - hw, 0.72, -22.16, pc + hw, 0.88, -22.145, K.redD);
        bmm(GD, pc - hw - 0.02, 0.7, -22.17, pc + hw + 0.02, 0.73, -22.14, K.gold); bmm(GD, pc - hw - 0.02, 0.87, -22.17, pc + hw + 0.02, 0.9, -22.14, K.gold);
        bmm(GD, pc - hw - 0.02, 0.7, -22.17, pc - hw + 0.01, 0.9, -22.14, K.gold); bmm(GD, pc + hw - 0.01, 0.7, -22.17, pc + hw + 0.02, 0.9, -22.14, K.gold);
        for (const d of [-0.2, 0.2]) disc(GD, pc + d, 0.8, -22.15, 0.09, 0.055, 0.025, K.goldL, 10);
      }
      col.box(cx0, -22.5, cx1, -22.12, 'cabinet');
      // ánh sáng ấm hắt ra từ tường vạn Phật
      const cxm = (xl + xr) / 2;
      glow(cxm - 1.0, 4.0, -22.3, 3.2, [1.0, 0.78, 0.38], false); glow(cxm + 1.0, 4.0, -22.3, 3.2, [1.0, 0.78, 0.38], false); glow(cxm, 2.0, -22.3, 3.0, [1.0, 0.74, 0.34], false);
    }
  });

  // =====================================================================
  //  MÀN VÀNG VÉN HAI BÊN TƯỢNG (vải gợn nếp, buộc dây giữa) + diềm trên
  // =====================================================================
  function curtain(s) {
    const NU = 14, NV = 14, NF = 6, vt = 0.62, yTop = 5.06, yBot = 1.7, xo = 3.35;
    const cD = rgb(0xb85c08), cL = rgb(0xffc02e);
    const P = [], Cc = [];
    for (let j = 0; j <= NV; j++) {
      const v = j / NV;
      const xi = v < vt ? U.lerp(1.8, 3.0, Math.pow(v / vt, 1.4)) : U.lerp(3.0, 2.25, Math.pow((v - vt) / (1 - vt), 0.75));
      const amp = 0.012 + 0.075 * Math.min(1, (xo - xi) / 1.4);
      for (let i = 0; i <= NU; i++) {
        const u = i / NU, ph = u * NF * TAU + v * 0.9;
        const flare = v > vt ? 0.34 * Math.pow((v - vt) / (1 - vt), 2) * u : 0;
        const x = U.lerp(xo, xi, u), y = yTop - v * (yTop - yBot), z = -21.93 + amp * Math.sin(ph) + flare;
        const m = U.clamp((0.5 + 0.5 * Math.sin(ph - 0.5)) * 0.85 * (0.82 + 0.18 * Math.min(1, v / 0.3)) + 0.1, 0, 1);
        P.push([x * s, y, z]); Cc.push([U.lerp(cD[0], cL[0], m), U.lerp(cD[1], cL[1], m), U.lerp(cD[2], cL[2], m)]);
      }
    }
    const tris = [], id = (i, j) => j * (NU + 1) + i;
    for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) {
      const a = id(i, j), b = id(i + 1, j), c = id(i + 1, j + 1), d = id(i, j + 1);
      tris.push([P[a], P[b], P[c], Cc[a], Cc[b], Cc[c]], [P[a], P[c], P[d], Cc[a], Cc[c], Cc[d]]);
    }
    LT.addGeo(triGeo(tris));
    // diềm trên (năm múi tròn) + thanh treo vàng
    const x0 = 1.7, x1 = 3.42, N = 5, cA = rgb(0xffb92a), cB = rgb(0xe08a14), zv = -21.86;
    const vt3 = [];
    for (let k = 0; k < N; k++) {
      const xa = U.lerp(x0, x1, k / N) * s, xb = U.lerp(x0, x1, (k + 1) / N) * s, xm = (xa + xb) / 2, c = k % 2 ? cB : cA;
      const TL = [xa, 5.1, zv], TR = [xb, 5.1, zv], BL = [xa, 4.97, zv], BR = [xb, 4.97, zv], BM = [xm, 4.76, zv + 0.02];
      vt3.push([TL, BL, BM, c, c, c], [TL, BM, TR, c, c, c], [TR, BM, BR, c, c, c]);
    }
    LT.addGeo(triGeo(vt3));
    bmm(GD, s * 1.62, 5.08, -21.96, s * 3.46, 5.15, -21.82, K.gold);
    // dây buộc + tua đỏ ở chỗ thắt
    bmm(GD, s * 2.92, 2.95, -21.99, s * 3.42, 3.01, -21.86, K.goldL);
    put(LT, CONE3, 0xd8322a, s * 3.15, 2.76, -21.9, 0.1, 0.34, 0.1, { r: [PI, 0, 0] });
    put(GD, SPHS, K.gold, s * 3.15, 2.96, -21.9, 0.055);
  }
  safe('man', () => { curtain(-1); curtain(1); });

  // =====================================================================
  //  HÀO QUANG TOẢ TIA vàng sau hào quang của tượng
  // =====================================================================
  safe('haoquang', () => {
    const cx = 0, cy = 3.35, z = -21.3;
    put(GD, new THREE.TorusGeometry(1.28, 0.03, 4, 48), K.goldL, cx, cy, z, 1);
    put(GD, new THREE.TorusGeometry(1.5, 0.024, 4, 56), K.gold, cx, cy, z, 1);
    for (let k = 0; k < 48; k++) {
      const a = (k / 48) * TAU, long = k % 2 === 0, r0 = 1.54, r1 = long ? 1.72 : 1.62, rm = (r0 + r1) / 2;
      put(GD, CONE3, long ? K.goldL : K.gold, cx + Math.cos(a) * rm, cy + Math.sin(a) * rm, z, 0.07, r1 - r0, 0.03, { r: [0, 0, a - PI / 2], j: 0.02 });
    }
    for (let k = 0; k < 24; k++) { // chấm vàng nhỏ trên vành trong
      const a = ((k + 0.5) / 24) * TAU;
      put(GD, SPHS, K.goldL, cx + Math.cos(a) * 1.28, cy + Math.sin(a) * 1.28, z, 0.035, 0.035, 0.03);
    }
  });

  // =====================================================================
  //  LỌNG VÀNG (hai chiếc) đặt trên mặt bàn thờ
  // =====================================================================
  function parasol(x, z) {
    cylY(GD, x, 1.6, z, 0.2, 0.26, 0.07, K.goldD, 10);
    cylY(GD, x, 1.67, z, 0.05, 0.1, 0.14, K.gold, 8);
    cylY(GD, x, 1.8, z, 0.028, 0.028, 1.2, K.gold, 6);                                  // cán đến mép tán
    const yr = 2.98;
    LT.add(lathe([[0.8, 0], [0.7, 0.12], [0.48, 0.28], [0.24, 0.4], [0.03, 0.46]], 12), K.yel, { p: [x, yr, z], j: 0.08 });             // mặt ngoài tán
    LT.add(lathe([[0.02, 0.42], [0.22, 0.36], [0.46, 0.24], [0.68, 0.08], [0.78, -0.02]], 12), K.yelD, { p: [x, yr, z], j: 0.06 });    // mặt trong (thấy từ dưới nhìn lên)
    put(GD, new THREE.TorusGeometry(0.8, 0.03, 4, 24), K.gold, x, yr, z, 1, 1, 1, { r: [PI / 2, 0, 0] });
    put(GD, SPHS, K.gold, x, yr + 0.5, z, 0.06);
    put(GD, CONE3, K.gold, x, yr + 0.6, z, 0.06, 0.16, 0.06);
    for (let k = 0; k < 20; k++) { // tua rua
      const a = (k / 20) * TAU;
      put(LT, CONE3, k % 2 ? 0xd8322a : 0xf0c040, x + Math.sin(a) * 0.8, yr - 0.12, z + Math.cos(a) * 0.8, 0.05, 0.22, 0.05, { r: [PI, 0, 0], j: 0.03 });
    }
  }

  // =====================================================================
  //  ĐỒ BÀY TRÊN BÀN THỜ: nến cao, đèn hoa sen, bình sen, mâm tròn vàng ở mặt trước
  // =====================================================================
  function flame(x, y, z, s) {
    put(LT, CONE6, 0xffd070, x, y, z, 0.07 * s, 0.17 * s, 0.07 * s, { j: 0.02 });
    put(LT, CONE6, 0xfff2b8, x, y - 0.01 * s, z, 0.035 * s, 0.1 * s, 0.035 * s, { j: 0.02 });
  }
  function tallCandle(x, z) {
    cylY(GD, x, 1.6, z, 0.11, 0.13, 0.04, K.gold, 8);
    cylY(GD, x, 1.64, z, 0.03, 0.045, 0.2, K.gold, 6);
    cylY(GD, x, 1.84, z, 0.085, 0.045, 0.05, K.gold, 8);
    cylY(V, x, 1.89, z, 0.06, 0.06, 0.62, K.redL, 8, { j: 0.04 });
    cylY(GD, x, 2.2, z, 0.064, 0.064, 0.025, K.gold, 8);
    flame(x, 2.6, z, 1);
    glow(x, 2.6, z, 1.1, [1.0, 0.72, 0.32], false);
  }
  function lotusLamp(x, z) { // đèn hoa sen: đế vàng, hai vòng cánh hồng, ngọn lửa giữa
    const y = 1.6;
    cylY(GD, x, y, z, 0.1, 0.12, 0.05, K.gold, 8);
    for (let ring = 0; ring < 2; ring++) {
      const n = ring ? 6 : 8, rr = ring ? 0.035 : 0.075;
      for (let k = 0; k < n; k++) {
        const a = ((k + ring * 0.5) / n) * TAU;
        put(V, CONE4, ring ? K.pinkL : K.pink, x + Math.sin(a) * rr, y + (ring ? 0.1 : 0.08), z + Math.cos(a) * rr, 0.085, 0.17, 0.04, { r: [0.55 - ring * 0.3, a, 0], order: 'YXZ', j: 0.04 });
      }
    }
    flame(x, y + 0.2, z, 0.55);
    glow(x, y + 0.22, z, 0.5, [1.0, 0.72, 0.34], false);
  }
  function lotusFlower(B, x, y, z, s) {
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU, up = k % 2;
      put(B, CONE4, up ? K.pinkL : K.pink, x + Math.sin(a) * 0.05 * s, y + (0.06 + up * 0.02) * s, z + Math.cos(a) * 0.05 * s, 0.12 * s, 0.19 * s, 0.05 * s, { r: [0.5 - up * 0.25, a, 0], order: 'YXZ', j: 0.04 });
    }
    put(B, SPHS, 0xf5d03a, x, y + 0.05 * s, z, 0.035 * s);
  }
  function lotusVase(x, z) {
    const y = 1.6;
    V.add(lathe([[0, 0], [0.1, 0], [0.15, 0.1], [0.17, 0.24], [0.13, 0.4], [0.075, 0.5], [0.1, 0.57], [0.08, 0.58]], 9), K.blue, { p: [x, y, z], j: 0.04 });
    cylY(GD, x, y + 0.24, z, 0.172, 0.172, 0.022, K.gold, 9);
    cylY(GD, x, y + 0.56, z, 0.1, 0.1, 0.02, K.gold, 9);
    const st = [[0.12, 0.62, 0.02], [-0.1, 0.9, -0.05], [0.0, 1.12, 0.1], [-0.2, 0.55, 0.12]];
    for (const [dx, h, dz] of st) {
      branch(V, [x, y + 0.58, z], [x + dx, y + 0.58 + h * 0.75, z + dz], 0.014, 0.011, K.leaf, 4);
      lotusFlower(V, x + dx, y + 0.58 + h * 0.75, z + dz, h > 0.8 ? 1.5 : 1.2);
    }
    for (const [dx, dz, a] of [[0.2, 0.1, 0.5], [-0.25, -0.05, -0.5]]) { // lá sen
      branch(V, [x, y + 0.58, z], [x + dx, y + 0.84, z + dz], 0.012, 0.01, K.leaf, 4);
      cylY(V, x + dx, y + 0.84, z + dz, 0.2, 0.2, 0.012, K.leaf, 6, { r: [a * 0.3, 0, a * 0.3], j: 0.05 });
    }
  }
  function wheelFront(x, y, z, R) { // huy chương vàng tròn trước bàn thờ
    disc(GD, x, y, z, R, R, 0.03, K.gold, 16);
    put(GD, new THREE.TorusGeometry(R * 0.72, R * 0.07, 4, 16), K.goldL, x, y, z + 0.02, 1);
    for (let k = 0; k < 4; k++) put(GD, BOX, K.goldD, x, y, z + 0.025, R * 1.3, R * 0.1, 0.02, { r: [0, 0, (k * PI) / 4], j: 0.02 });
    put(GD, SPHS, K.goldL, x, y, z + 0.03, R * 0.22, R * 0.22, 0.04);
  }
  safe('ban-tho', () => {
    parasol(-3.1, -20.2); parasol(3.1, -20.2);
    for (const s of [-1, 1]) {
      tallCandle(s * 1.75, -19.05);
      lotusLamp(s * 0.62, -18.85); lotusLamp(s * 2.6, -18.85);
      lotusVase(s * 3.55, -19.2);
    }
    // mặt trước bàn thờ: gờ chân vàng, năm ô sơn sẫm có huy chương vàng
    bmm(GD, -4.15, FY, -18.46, 4.15, 0.7, -18.37, K.goldD);
    for (const x of [-3.2, -1.6, 0, 1.6, 3.2]) {
      bmm(V, x - 0.62, 0.8, -18.405, x + 0.62, 1.36, -18.385, K.redD);
      bmm(GD, x - 0.65, 0.77, -18.415, x + 0.65, 0.81, -18.375, K.gold); bmm(GD, x - 0.65, 1.35, -18.415, x + 0.65, 1.39, -18.375, K.gold);
      bmm(GD, x - 0.65, 0.77, -18.415, x - 0.61, 1.39, -18.375, K.gold); bmm(GD, x + 0.61, 0.77, -18.415, x + 0.65, 1.39, -18.375, K.gold);
      wheelFront(x, 1.08, -18.39, 0.24);
    }
  });

  // =====================================================================
  //  HẠC CHẦU RÙA: hai con hạc vàng đứng trên lưng rùa ở hai góc trước bàn thờ
  // =====================================================================
  function crane(x, z, yaw) {
    const shell = 0x6a4a1c, body = 0xf4d27a, wingC = 0xe2b04a, dark = 0x3a2814, leg = 0x9a7430;
    grp(GD, x, FY, z, yaw, 0.88, (T) => {
      // rùa: mai tròn có sáu mảnh vàng, đầu, đuôi, bốn chân bơi
      put(T, SPH, shell, 0, 0.2, 0, 0.42, 0.22, 0.56);
      put(T, SPHS, K.gold, 0, 0.41, 0, 0.13, 0.04, 0.15);
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU, px = Math.sin(a) * 0.2, pz = Math.cos(a) * 0.27;
        put(T, SPHS, K.goldD, px, 0.2 + 0.22 * Math.sqrt(Math.max(0, 1 - (px / 0.42) ** 2 - (pz / 0.56) ** 2)) - 0.01, pz, 0.1, 0.035, 0.12, { r: [0, a, 0] });
      }
      put(T, SPH, K.bronze, 0, 0.2, 0.68, 0.1, 0.08, 0.14);
      put(T, SPHS, K.bronze, 0, 0.17, -0.62, 0.05, 0.04, 0.1);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(T, SPHS, K.bronze, sx * 0.4, 0.07, sz * 0.3, 0.17, 0.04, 0.1, { r: [0, sx * sz * 0.5, 0] });
      // hạc: hai chân cao, thân thon nghiêng, cổ cong chữ S, đầu mào đỏ, mỏ dài, cánh xếp đầu cánh đen, đuôi xoè
      for (const sx of [-1, 1]) {
        branch(T, [sx * 0.07, 0.4, -0.02], [sx * 0.07, 1.02, 0.0], 0.022, 0.016, leg, 5);
        put(T, SPHS, leg, sx * 0.07, 0.42, 0.05, 0.05, 0.02, 0.11);
      }
      put(T, SPH, body, 0, 1.17, -0.06, 0.17, 0.19, 0.46, { r: [-0.3, 0, 0] });        // thân
      put(T, SPH, body, 0, 1.3, 0.22, 0.13, 0.15, 0.2, { r: [-0.5, 0, 0] });          // ngực
      const neck = [[0, 1.36, 0.3], [0, 1.58, 0.44], [0, 1.82, 0.36], [0, 2.02, 0.44]];
      for (let k = 0; k < 3; k++) branch(T, neck[k], neck[k + 1], 0.06 - k * 0.012, 0.05 - k * 0.012, body, 5);
      put(T, SPH, body, 0, 2.07, 0.48, 0.05, 0.05, 0.08);
      put(T, SPHS, 0xc8302a, 0, 2.12, 0.46, 0.03);
      branch(T, [0, 2.06, 0.54], [0, 2.0, 0.8], 0.018, 0.004, K.bronze, 4);
      for (const sx of [-1, 1]) {
        put(T, SPH, wingC, sx * 0.17, 1.2, -0.1, 0.045, 0.18, 0.44, { r: [-0.3, 0, sx * 0.12] });
        put(T, SPH, dark, sx * 0.19, 1.08, -0.46, 0.04, 0.08, 0.2, { r: [-0.3, 0, sx * 0.1] });
        branch(T, [sx * 0.08, 1.08, -0.38], [sx * 0.16, 1.16, -0.82], 0.045, 0.004, dark, 4);
      }
      branch(T, [0, 1.1, -0.38], [0, 1.2, -0.86], 0.05, 0.004, dark, 4);
    });
  }
  safe('hac', () => {
    // chân hạc nằm giữa cột rồng (±4,6; −18,0) và hông bàn thờ; lệch vào trong một chút để khỏi chạm cột
    crane(-3.25, -17.55, 0.45); crane(3.25, -17.55, -0.45);
    col.circle(-3.25, -17.55, 0.42, 'crane'); col.circle(3.25, -17.55, 0.42, 'crane');
  });

  // =====================================================================
  //  HAI BÀN THỜ PHỤ: bàn sơn son, vòm niche sáng đèn, Bồ Tát ngồi toà sen, nến + bình hoa
  // =====================================================================
  function shrine(s) {
    const ox = s * 6.6, oz = -21.4, yt = 1.25;
    // bàn
    bmm(V, ox - 0.85, FY, oz - 0.55, ox + 0.85, 1.2, oz + 0.45, K.lac);
    bmm(V, ox - 0.68, 0.76, oz + 0.44, ox + 0.68, 1.1, oz + 0.46, K.redD);
    bmm(GD, ox - 0.9, 1.18, oz - 0.6, ox + 0.9, yt, oz + 0.5, K.gold);
    bmm(GD, ox - 0.88, FY, oz - 0.58, ox + 0.88, 0.7, oz + 0.48, K.goldD);
    bmm(GD, ox - 0.72, 0.74, oz + 0.44, ox + 0.72, 0.78, oz + 0.47, K.gold); bmm(GD, ox - 0.72, 1.08, oz + 0.44, ox + 0.72, 1.12, oz + 0.47, K.gold);
    for (const d of [-0.7, 0.7]) bmm(GD, ox + d - 0.02, 0.74, oz + 0.44, ox + d + 0.02, 1.12, oz + 0.47, K.gold);
    for (const d of [-0.3, 0.3]) disc(GD, ox + d, 0.93, oz + 0.465, 0.12, 0.08, 0.02, K.goldL, 10);
    // lưng bàn thờ: tấm đỏ viền vàng
    bmm(V, ox - 0.88, yt, oz - 0.58, ox + 0.88, 4.0, oz - 0.48, K.red);
    bmm(GD, ox - 0.9, yt, oz - 0.6, ox - 0.82, 4.04, oz - 0.44, K.gold); bmm(GD, ox + 0.82, yt, oz - 0.6, ox + 0.9, 4.04, oz - 0.44, K.gold);
    bmm(GD, ox - 0.9, 3.96, oz - 0.6, ox + 0.9, 4.04, oz - 0.44, K.gold);
    // niche vòm phát sáng (quạt màu: tâm vàng nhạt → mép cam)
    const y0n = 1.3, y1n = 3.1, hw = 0.6, zf = oz - 0.465, N = 12, ring = [[ox + hw, y0n, zf]];
    for (let k = 0; k <= N; k++) { const a = (k / N) * PI; ring.push([ox + Math.cos(a) * hw, y1n + Math.sin(a) * hw, zf]); }
    ring.push([ox - hw, y0n, zf]);
    const cc = [ox, 2.45, zf], cIn = rgb(0xfff0b0), cOut = rgb(0xf09a30), tr = [];
    for (let k = 0; k < ring.length; k++) { const a = ring[k], b = ring[(k + 1) % ring.length]; tr.push([cc, a, b, cIn, cOut, cOut]); }
    LT.addGeo(triGeo(tr));
    put(GD, new THREE.TorusGeometry(hw + 0.03, 0.04, 4, 14, PI), K.gold, ox, y1n, zf + 0.01, 1);
    for (const d of [-1, 1]) bmm(GD, ox + d * (hw + 0.03) - 0.04, y0n, zf - 0.005, ox + d * (hw + 0.03) + 0.04, y1n, zf + 0.04, K.gold);
    // Bồ Tát ngồi toà sen
    const fx = ox, fz = oz - 0.2, fy = yt;
    cylY(GD, fx, fy, fz, 0.52, 0.56, 0.1, K.goldD, 10);
    for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU; put(GD, CONE4, K.gold, fx + Math.sin(a) * 0.42, fy + 0.2, fz + Math.cos(a) * 0.42, 0.2, 0.34, 0.08, { r: [0.7, a, 0], order: 'YXZ' }); }
    for (let k = 0; k < 8; k++) { const a = ((k + 0.5) / 8) * TAU; put(GD, CONE4, K.goldL, fx + Math.sin(a) * 0.27, fy + 0.28, fz + Math.cos(a) * 0.27, 0.16, 0.28, 0.07, { r: [0.4, a, 0], order: 'YXZ' }); }
    cylY(GD, fx, fy + 0.27, fz, 0.34, 0.38, 0.08, K.gold, 10);
    GD.add(lathe([[0, 0], [0.4, 0], [0.44, 0.1], [0.36, 0.3], [0.27, 0.52], [0.2, 0.72], [0.18, 0.9], [0.12, 1.0], [0, 1.02]], 10), 0xf0dcae, { p: [fx, fy + 0.35, fz], j: 0.04 }); // thân áo trắng
    put(GD, SPH, 0xf0dcae, fx, fy + 1.2, fz, 0.26, 0.13, 0.17);
    for (const sx of [-1, 1]) branch(GD, [fx + sx * 0.22, fy + 1.18, fz], [fx + sx * 0.07, fy + 0.8, fz + 0.2], 0.065, 0.05, 0xf0dcae, 5);
    put(GD, SPHS, 0xf0cf70, fx, fy + 0.8, fz + 0.22, 0.06);
    cylY(GD, fx, fy + 1.24, fz, 0.07, 0.08, 0.08, 0xf0cf70, 6);
    put(GD, SPH, 0xf0cf70, fx, fy + 1.5, fz, 0.14, 0.155, 0.14);
    put(GD, SPH, 0x3a2a14, fx, fy + 1.7, fz - 0.01, 0.075, 0.07, 0.075);
    put(GD, new THREE.TorusGeometry(0.14, 0.014, 4, 12), K.gold, fx, fy + 1.58, fz, 1, 1, 1, { r: [PI / 2 - 0.3, 0, 0] });
    put(GD, new THREE.TorusGeometry(0.36, 0.028, 4, 20), K.gold, fx, fy + 1.55, fz - 0.14, 1);
    put(GD, new THREE.TorusGeometry(0.28, 0.016, 4, 18), K.goldL, fx, fy + 1.55, fz - 0.14, 1);
    // đồ cúng trên bàn: hai cây nến, lư hương, hai bình hoa nhỏ
    for (const d of [-1, 1]) {
      cylY(V, ox + d * 0.62, yt, oz + 0.05, 0.04, 0.04, 0.34, K.redL, 7, { j: 0.04 });
      cylY(GD, ox + d * 0.62, yt, oz + 0.05, 0.075, 0.09, 0.03, K.gold, 7);
      flame(ox + d * 0.62, yt + 0.44, oz + 0.05, 0.7);
      glow(ox + d * 0.62, yt + 0.44, oz + 0.05, 0.6, [1.0, 0.72, 0.32], false);
      V.add(lathe([[0, 0], [0.06, 0], [0.08, 0.1], [0.05, 0.2], [0.07, 0.25]], 6), K.blue, { p: [ox + d * 0.36, yt, oz + 0.22], j: 0.04 });
      for (let k = 0; k < 4; k++) put(V, SPHS, k % 2 ? 0xf5a623 : 0xffc20e, ox + d * 0.36 + (k - 1.5) * 0.05, yt + 0.31 + (k % 2) * 0.04, oz + 0.22, 0.045);
    }
    GD.add(lathe([[0, 0], [0.12, 0.01], [0.17, 0.09], [0.18, 0.16], [0.15, 0.17]], 8), K.bronze, { p: [ox, yt, oz + 0.2] });
    for (let k = 0; k < 3; k++) bmm(V, ox + (k - 1) * 0.04 - 0.006, yt + 0.16, oz + 0.2 - 0.006, ox + (k - 1) * 0.04 + 0.006, yt + 0.5, oz + 0.2 + 0.006, 0x7a2a1a);
    glow(ox, 2.55, oz - 0.3, 2.4, [1.0, 0.76, 0.36], false);
    col.box(ox - 0.9, oz - 0.6, ox + 0.9, oz + 0.5, 'shrine');
  }
  safe('ban-phu', () => { shrine(-1); shrine(1); });

  // =====================================================================
  //  THẢM ĐỎ VIỀN VÀNG CHIA CHIẾU VUÔNG + 18 BỒ ĐOÀN VÀNG (W.seats)
  //    thảm x ∈ [−7,2; 7,2], z ∈ [−17,2; −11,6]; ba lớp mỏng y = 0,625 / 0,629 / 0,633 (trên nền 0,62)
  // =====================================================================
  safe('tham', () => {
    const Y0 = 0.625, Y1 = 0.629, Y2 = 0.633, x0 = -7.2, x1 = 7.2, z0 = -17.2, z1 = -11.6;
    flat(V, x0, z0, x1, z1, Y0, 0x7a1510);
    const band = (d0, d1, y, c) => {
      flat(V, x0 + d0, z0 + d0, x1 - d0, z0 + d1, y, c); flat(V, x0 + d0, z1 - d1, x1 - d0, z1 - d0, y, c);
      flat(V, x0 + d0, z0 + d1, x0 + d1, z1 - d1, y, c); flat(V, x1 - d1, z0 + d1, x1 - d0, z1 - d1, y, c);
    };
    band(0, 0.07, Y2, K.gold); band(0.07, 0.15, Y1, 0xa5261c); band(0.15, 0.185, Y2, K.gold);
    // lối giữa: dải đỏ sẫm hai mép vàng
    flat(V, -1.1, z0 + 0.19, 1.1, z1 - 0.19, Y1, 0x6c0f0a);
    flat(V, -1.12, z0 + 0.19, -1.08, z1 - 0.19, Y2, K.gold); flat(V, 1.08, z0 + 0.19, 1.12, z1 - 0.19, Y2, K.gold);
    // chiếu vuông
    const mat = (cx, cz) => {
      const hw = 0.6, hd = 0.6, t = 0.035;
      flat(V, cx - hw, cz - hd, cx + hw, cz + hd, Y1, 0x971d14);
      flat(V, cx - hw, cz - hd, cx + hw, cz - hd + t, Y2, K.gold); flat(V, cx - hw, cz + hd - t, cx + hw, cz + hd, Y2, K.gold);
      flat(V, cx - hw, cz - hd + t, cx - hw + t, cz + hd - t, Y2, K.gold); flat(V, cx + hw - t, cz - hd + t, cx + hw, cz + hd - t, Y2, K.gold);
      flat(V, cx - hw + 0.1, cz - hd + 0.1, cx + hw - 0.1, cz + hd - 0.1, Y2, 0x84150e);
    };
    const rows = [-12.5, -13.8, -15.1, -16.4];
    for (const s of [-1, 1]) for (let r = 0; r < rows.length; r++) {
      mat(s * 1.9, rows[r]); mat(s * 3.2, rows[r]); mat(s * 6.0, rows[r]);
      if (r > 0) mat(s * 4.5, rows[r]); // hàng đầu có cột (±4,6; −12,9) đứng giữa → bỏ chiếu ở đó
    }
    // bồ đoàn vàng: 18 cái (bỏ chỗ cách cột / chuông-trống dưới 0,7 m), quay mặt về bàn thờ; chỗ nằm trên làn máy quay gõ mõ chỉ bày, không cho khách ngồi
    const keep = [[-4.6, -12.9, 0.5], [4.6, -12.9, 0.5], [-4.6, -18.0, 0.5], [4.6, -18.0, 0.5], [-7.0, -16.6, 0.8], [7.0, -16.6, 0.8]]; // [x, z, bán kính vật]
    // làn nhìn của máy quay hoạt động gõ mõ (W.hall.cam), tính cả lúc màn dọc kéo máy lùi tới ×1,5
    const HC = W.hall && W.hall.cam, HL = G.L.hall; // W.hall.cam là toạ độ thế giới, bồ đoàn còn toạ độ gốc → quy ngược về gốc (xf ngược: x/s, z = pz + (z - dz - pz)/s)
    const lz0 = (z) => HL.pz + (z - HL.dz - HL.pz) / HL.s;
    const inCamLane = (x, z) => {
      if (!HC) return false;
      const lx = HC.look[0] / HL.s, lz = lz0(HC.look[2]), dx = (HC.pos[0] - HC.look[0]) / HL.s * 1.5, dz = (HC.pos[2] - HC.look[2]) / HL.s * 1.5;
      const t = U.clamp(((x - lx) * dx + (z - lz) * dz) / (dx * dx + dz * dz), 0, 1);
      return Math.hypot(x - lx - dx * t, z - lz - dz * t) < 0.6;
    };
    const CUSH = lathe([[0, 0], [0.34, 0], [0.37, 0.05], [0.35, 0.1], [0.2, 0.13], [0, 0.135]], 12);
    for (const sx of [-1, 1]) for (const ax of [1.9, 3.2, 6.0]) for (const z of [-12.5, -13.8, -15.1]) {
      const x = sx * ax;
      if (keep.some((k) => Math.hypot(x - k[0], z - k[1]) < k[2] + 0.7)) continue;
      V.add(CUSH, 0xe3a53c, { p: [x, 0.633, z], j: 0.05 });
      if (inCamLane(x, z)) continue; // bồ đoàn vẫn bày, nhưng khách không ngồi chắn máy quay gõ mõ
      W.seats.push({ x, z, y: FY + 0.03, yaw: Math.PI }); // khách AI ngồi ở y + 0,14 = đúng mặt bồ đoàn (0,77)
    }
  });

  // =====================================================================
  //  GỘP MESH, CHỈ VẼ KHI Ở GẦN, ĐỘ SÁNG THEO NGÀY/ĐÊM
  // =====================================================================
  const meshes = [];
  const addMesh = (m, name) => { m.name = 'hallAltar:' + name; scene.add(m); meshes.push(m); };
  safe('mesh', () => {
    addMesh(V.mesh(G.mats.vc, { cast: false, receive: true }), 'son-do');
    addMesh(GD.mesh(G.mats.gold, { cast: false, receive: true }), 'vang');
    addMesh(LT.mesh(G.mats.lantern, { cast: false, receive: false }), 'tu-sang');
    for (const [qs, mat] of [[quadsA, matA], [quadsN, matN]]) {
      if (!qs.length) continue;
      const m = new THREE.Mesh(quadsGeo(qs), mat);
      m.castShadow = false; m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix();
      addMesh(m, mat === matA ? 'phong' : 'van-phat');
    }
  });
  G.frame.shift(fm, G.L.hall.dy, G.L.hall.dz);
  let shown = true;
  const nc = G.frame.xf(0, 2.0, -11); // cửa điện (toạ độ gốc (0, 2, -11) → xf)
  const near = (p) => { const dx = p.x - nc.x, dy = p.y - nc.y, dz = p.z - nc.z; return dx * dx + dy * dy + dz * dz < 38 * 38; }; // xa cửa điện hơn 38 m thì khỏi vẽ nội thất
  const setVis = (v) => { for (const m of meshes) m.visible = v; };
  const tint = () => { const n = G.tod ? G.tod.night : 0; matA.emissiveIntensity = 0.4 + n * 0.2; matN.emissiveIntensity = 0.8 + n * 0.2; };
  G.onUpdate(() => {
    const show = near(G.camera.position);
    if (show !== shown) { shown = show; setVis(show); }
    if (show) tint();
  }, 90);
  // ảnh chia sẻ chụp bằng máy quay riêng (nhìn thẳng vào điện): bật nội thất theo máy đó rồi trả lại như cũ
  G.events.on('snapshot:before', (sc) => { if (sc && near(sc.position)) { setVis(true); tint(); } });
  G.events.on('snapshot:after', () => setVis(shown));

  if (G.nav) G.nav.built = false; // bàn thờ phụ, tủ, hạc có vật cản mới: dựng lại đồ thị dẫn đường khi bắt đầu
}
