// =====================================================================
//  TRANH / HOA VĂN BAN THỜ — atlas canvas 2048² (tách từ 18-ban-tho.js): mạn-đà-la tấm phông (tranh tô khối), ô sóng nước, ô gấm, đá kem, son / vàng trơn, đĩa hào quang, vầng sáng cộng màu.
//  banThoAtlas(G, env) → { AT, UV, draw }: 18-ban-tho.js gọi U.canvasTex(AT, AT, draw) và đọc UV.<ô> = [u0, v0, u1, v1] (gốc dưới-trái, v = 1 − y/AT) để gán toạ độ.
//  env = { PI, TAU, LACS (màu son — file này dùng son riêng #7D0910), PANY0 / PANY1 (đáy / đỉnh tấm phông, khung v2), YHALO (tâm vầng sáng sau đầu, khung v2) }. File này CHỈ vẽ canvas, không tạo mesh / vật liệu.
//
//  BỐ CỤC ATLAS 2048² (px, gốc trên-trái; "ô" = vùng UV đưa cho mesh, "ngăn" = vùng vẽ đã chừa lề ≥ 16 px cùng màu / lặp liền mạch để mip không kéo màu láng giềng vào mép ô):
//    ô          x0   y0   x1    y1   dùng cho
//    mandala     0    0  2048 1536   mặt trước tấm phông 12,4 × 9,9 (tranh tô khối; khung đen 28 px + hai vạch vàng đã vẽ SẴN ở mép ô)
//    wave       32 1552   480 1776   dải sóng mây bệ / bàn thờ — 448 × 224 (đúng tỉ lệ 2:1 của ô 512 × 256 cũ), lặp theo x: HAI chu kỳ liền mạch; ngăn 0…512 × 1536…1792
//    stone     544 1552   992 1776   đá kem lát — 448 × 224, lặp liền mạch CẢ HAI chiều; ngăn 512…1024 × 1536…1792 (lề 16/32 px là phần lặp tiếp của chính hoa văn)
//    silk     1056 1552  1504 1776   gấm son — 448 × 224 (lưới thoi 4 × 2 chu kỳ), lặp cả hai chiều; ngăn 1024…1536 × 1536…1792
//    red        64 1856   192 1984   son trơn #7D0910 (ngăn 0…256 × 1792…2048 son đặc)
//    gold      320 1856   448 1984   vàng trơn dốc #D4A843 → #B8913F từ trên xuống (ngăn 256…512 × 1792…2048, màu mép kéo dài)
//    halo      656 1808   880 2032   vầng sáng CỘNG MÀU (đen = tàng hình) 224², lõi #FFC070 ấm, không trắng; ngăn đen 640…896 × 1792…2048
//    haloDisc 1552 1552  2032 2032   đĩa hào quang đặc 480² (bán kính 238, alpha 1 trong đĩa, alpha 0 NGOÀI đĩa — mesh dùng alphaTest 0,5): nền đỏ thẫm, 36 tia vàng, vòng 28 hạt, ánh cam trong; ngăn 1536…2048 × 1536…2048
//  Vùng còn lại của dải dưới (y ≥ 1536, x < 1536) tô đen ấm #14100C (không ô nào dùng).
//  UV mới so với bản cũ: stone, haloDisc. Giữ khoá cũ: mandala, wave, silk, red, gold, halo (toạ độ ô ĐÃ ĐỔI → luôn đọc UV.<ô>, đừng cứng toạ độ).
// =====================================================================
function banThoAtlas(G, env) {
  const { util: U } = G;
  const { PI, TAU, PANY0, PANY1, YHALO } = env;
  const AT = 2048, uvRect = (x0, y0, x1, y1) => [x0 / AT, 1 - y1 / AT, x1 / AT, 1 - y0 / AT];
  const UV = {
    mandala: uvRect(0, 0, 2048, 1536),
    wave: uvRect(32, 1552, 480, 1776), stone: uvRect(544, 1552, 992, 1776), silk: uvRect(1056, 1552, 1504, 1776),
    red: uvRect(64, 1856, 192, 1984), gold: uvRect(320, 1856, 448, 1984),
    halo: uvRect(656, 1808, 880, 2032), haloDisc: uvRect(1552, 1552, 2032, 2032),
  };
  const RED0 = '#7D0910', INK = '#3A0608', BLK = '#14100C';
  const draw = (g) => {
    const rnd = U.rng(55);
    const MW = 2048, MH = 1536, cx = MW / 2, cy = (PANY1 - YHALO) / (PANY1 - PANY0) * MH, rh = 1.9 / (PANY1 - PANY0) * MH; // tâm = điểm vầng sáng sau đầu (≈ 589), rh ≈ 295
    g.lineCap = 'round'; g.lineJoin = 'round';
    // ===== 1. MẠN-ĐÀ-LA: tranh tô khối — nền hướng tâm đỏ thẫm, ba vòng cánh sen đặc, dải mây / phượng vàng, hoa góc, khung vẽ sẵn =====
    let gr = g.createRadialGradient(cx, cy, 0, cx, cy, 1000);                                       // (a) nền hướng tâm quanh đầu: cam → đỏ → đỏ thẫm → đỏ đen ở mép
    gr.addColorStop(0, '#E8742A'); gr.addColorStop(0.35, '#B0281C'); gr.addColorStop(0.7, '#7D0F14'); gr.addColorStop(1, '#4A0A0E');
    g.fillStyle = gr; g.fillRect(0, 0, MW, MH);
    g.save(); g.beginPath(); g.rect(0, 0, MW, MH); g.clip();
    const lens = (r0, r1, hw, k) => {                                                              // đường cánh sen (thấu kính nhọn hai đầu) theo trục +x, k = co vào trong để vẽ gờ sáng
      const L = r1 - r0, a = r0 + L * (k < 1 ? 0.07 : 0), b = r1 - L * (k < 1 ? 0.05 : 0), l = b - a, w = hw * 1.33 * k;
      g.beginPath(); g.moveTo(a, 0); g.bezierCurveTo(a + l * 0.1, -w, a + l * 0.66, -w * 0.84, b, 0); g.bezierCurveTo(a + l * 0.66, w * 0.84, a + l * 0.1, w, a, 0); g.closePath();
    };
    const petal = (a, r0, r1, hw) => {                                                              // (b) cánh sen tô đặc: đỏ thẫm ở gốc → vàng 25 % ở mũi, bóng một bên, viền tối 3 px + gờ vàng 2 px
      g.save(); g.translate(cx, cy); g.rotate(a);
      const fg = g.createLinearGradient(r0, 0, r1, 0);
      fg.addColorStop(0, '#8A1410'); fg.addColorStop(0.55, 'rgba(142,28,18,0.97)'); fg.addColorStop(0.85, 'rgba(140,34,20,0.74)'); fg.addColorStop(1, 'rgba(217,164,65,0.25)');
      lens(r0, r1, hw, 1); g.fillStyle = fg; g.fill();
      const sg = g.createLinearGradient(0, -hw, 0, hw); sg.addColorStop(0, 'rgba(36,0,2,0.42)'); sg.addColorStop(0.5, 'rgba(36,0,2,0.08)'); sg.addColorStop(1, 'rgba(255,150,70,0.14)');
      g.fillStyle = sg; g.fill();
      g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
      lens(r0, r1, hw * 0.8, 0.8); g.strokeStyle = 'rgba(241,207,122,0.85)'; g.lineWidth = 2; g.stroke();
      g.restore();
    };
    for (let i = 0; i < 32; i++) petal((i / 32) * TAU - PI / 2, 700, 1120, 92);                      // vòng ngoài 32 cánh (bị khung cắt bớt — tranh tràn mép)
    for (let i = 0; i < 24; i++) petal(((i + 0.5) / 24) * TAU - PI / 2, 440, 790, 82);              // vòng giữa 24 cánh (so le)
    for (let i = 0; i < 16; i++) petal((i / 16) * TAU - PI / 2, 250, 520, 78);                      // vòng trong 16 cánh
    // đĩa ấm CHỈ ngay sau đầu: nhỏ, cam ấm #FFB860 → trong suốt, không trắng (mặt tượng không bị lóa)
    gr = g.createRadialGradient(cx, cy, 0, cx, cy, rh * 0.85);
    gr.addColorStop(0, 'rgba(255,184,96,0.7)'); gr.addColorStop(0.5, 'rgba(255,184,96,0.32)'); gr.addColorStop(1, 'rgba(255,184,96,0)');
    g.fillStyle = gr; g.fillRect(cx - rh, cy - rh, rh * 2, rh * 2);
    // (c) dải mây / phượng: bút lông vàng #D9A441 14–22 px, thon dần, lõi sáng #F7E2A0, đầu cuộn như ý; mỗi bên hai dải
    const ribbon = (pts, w0, w1, turn) => {
      const S = [], n = pts.length;
      for (let i = 0; i < n - 1; i++) {                                                             // Catmull-Rom qua các điểm
        const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, n - 1)];
        for (let t = 0; t < 1; t += 1 / 20) { const t2 = t * t, t3 = t2 * t; S.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3))); }
      }
      S.push(pts[n - 1].slice());
      let h = Math.atan2(S[S.length - 1][1] - S[S.length - 4][1], S[S.length - 1][0] - S[S.length - 4][0]), px = S[S.length - 1][0], py = S[S.length - 1][1];
      for (let r = 70, k = 0; r > 15; k++) { px += Math.cos(h) * 4; py += Math.sin(h) * 4; h += (4 / r) * turn; r -= 0.55; S.push([px, py]); } // đuôi cuộn xoắn như ý (bán kính 70 → 15)
      const N = S.length, L = [], Rr = [], C = [];
      for (let i = 0; i < N; i++) {
        const a = S[Math.max(i - 1, 0)], b = S[Math.min(i + 1, N - 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
        const t = i / (N - 1), w = (w0 + (w1 - w0) * t) * (0.55 + 0.45 * Math.sin(Math.min(1, t * 6) * PI / 2)) * 0.5 + 3.5; // thon ở đầu, đều giữa thân, 14–22 px
        L.push([S[i][0] + nx * w, S[i][1] + ny * w]); Rr.push([S[i][0] - nx * w, S[i][1] - ny * w]); C.push(S[i]);
      }
      g.beginPath(); g.moveTo(L[0][0], L[0][1]); for (let i = 1; i < N; i++) g.lineTo(L[i][0], L[i][1]); for (let i = N - 1; i >= 0; i--) g.lineTo(Rr[i][0], Rr[i][1]); g.closePath();
      g.fillStyle = '#D9A441'; g.fill(); g.strokeStyle = 'rgba(58,6,8,0.85)'; g.lineWidth = 2.5; g.stroke();
      g.beginPath(); g.moveTo(C[2][0], C[2][1]); for (let i = 3; i < N - 2; i++) g.lineTo(C[i][0], C[i][1]); g.strokeStyle = '#F7E2A0'; g.lineWidth = 4.5; g.stroke();
    };
    for (const sx of [-1, 1]) {
      g.save(); if (sx > 0) { g.translate(MW, 0); g.scale(-1, 1); }
      ribbon([[250, 74], [430, 124], [560, 250], [520, 410], [370, 520], [292, 690], [372, 850], [500, 905]], 22, 15, 1);
      ribbon([[84, 214], [196, 320], [214, 480], [126, 640], [150, 800], [262, 900]], 18, 14, -1);
      g.restore();
    }
    // vài cuộn mây nhỏ ở vùng thưa (mảnh nhưng ít: bớt ~60 % nét mảnh so với bản cũ)
    const curl = (x, y, r, turns, dir, lw, col, a0) => { g.save(); g.translate(x, y); g.rotate(a0); g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); let rr = r; for (let t = 0; t <= turns * TAU; t += 0.12) { const qx = Math.cos(t) * rr * dir, qy = Math.sin(t) * rr; t === 0 ? g.moveTo(qx, qy) : g.lineTo(qx, qy); rr *= 0.955; } g.stroke(); g.restore(); };
    for (const [x, y, d, a0] of [[170, 1000, 1, 0.6], [330, 1230, -1, 3.2], [140, 1330, 1, 4.1]]) { curl(x, y, 46, 1.6, d, 6, 'rgba(231,195,117,0.5)', a0); curl(MW - x, y, 46, 1.6, -d, 6, 'rgba(231,195,117,0.5)', -a0); }
    g.restore();
    // (d) hoa góc 140 px ở hai góc trên
    const rosette = (x, y) => {
      g.save(); g.translate(x, y);
      for (const [n, r, w, f] of [[12, 70, 17, '#D9A441'], [8, 46, 15, '#F1CF7A']]) for (let i = 0; i < n; i++) {
        g.save(); g.rotate((i / n) * TAU + (r < 50 ? PI / n : 0)); g.beginPath(); g.moveTo(r * 0.16, 0); g.bezierCurveTo(r * 0.4, -w * 1.3, r * 0.78, -w * 0.9, r, 0); g.bezierCurveTo(r * 0.78, w * 0.9, r * 0.4, w * 1.3, r * 0.16, 0); g.closePath();
        g.fillStyle = f; g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke(); g.restore();
      }
      g.beginPath(); g.arc(0, 0, 14, 0, TAU); g.fillStyle = '#8A1410'; g.fill(); g.strokeStyle = '#F1CF7A'; g.lineWidth = 3; g.stroke();
      g.restore();
    };
    rosette(122, 122); rosette(MW - 122, 122);
    // (e) khung vẽ SẴN vào mép ô: viền đen 28 px #14100C, hai vạch vàng 5 px #E7C375 cách nhau 2 px
    g.fillStyle = BLK; g.fillRect(0, 0, MW, 28); g.fillRect(0, MH - 28, MW, 28); g.fillRect(0, 0, 28, MH); g.fillRect(MW - 28, 0, 28, MH);
    g.strokeStyle = '#E7C375'; g.lineWidth = 5; g.strokeRect(30.5, 30.5, MW - 61, MH - 61); g.strokeRect(37.5, 37.5, MW - 75, MH - 75);
    g.strokeStyle = BLK; g.lineWidth = 2; g.strokeRect(34, 34, MW - 68, MH - 68);                    // khe 2 px giữa hai vạch vàng
    // ===== 2. Dải bên dưới: nền đen ấm (không ô nào dùng) =====
    g.fillStyle = BLK; g.fillRect(0, 1536, 1536, 512);
    // phần lặp: vẽ một "chu kỳ" tại 3 × 3 vị trí cắt theo ngăn → phần lề là chính hoa văn lặp tiếp (mip không kéo màu lạ vào mép)
    const inSlot = (x, y, w, h, fn) => { g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); fn(); g.restore(); };
    // ===== 3. Ô sóng mây: 448 × 224, tỉ lệ 2:1; HAI chu kỳ sin → liền mạch theo x; nền #7D0910, vạch #E7C375, chấm lá nhỏ =====
    inSlot(0, 1536, 512, 256, () => {
      g.fillStyle = RED0; g.fillRect(0, 1536, 512, 256);
      g.translate(32, 1552); g.scale(0.875, 0.875);                                                  // hệ ảo 512 × 256
      const LWV = 256, AMP = 42, yw = (x, dy) => 128 + dy + Math.sin((x / LWV) * TAU) * AMP;
      const line = (dy, lw, col) => { g.beginPath(); for (let x = -64; x <= 576; x += 6) { const y = yw(x, dy); x === -64 ? g.moveTo(x, y) : g.lineTo(x, y); } g.strokeStyle = col; g.lineWidth = lw; g.stroke(); };
      line(0, 16, 'rgba(58,6,8,0.55)'); line(26, 4, '#E7C375'); line(-26, 4, '#E7C375'); line(0, 9, '#E7C375');
      g.fillStyle = '#E7C375'; g.strokeStyle = INK; g.lineWidth = 1.5;
      for (let x = -32; x <= 544; x += 64) for (const dy of [26, -26]) {                              // chấm lá nhỏ dọc hai đường sóng phụ, xoay theo tiếp tuyến
        const y = yw(x, dy), ang = Math.atan2(Math.cos((x / LWV) * TAU) * AMP * TAU / LWV, 1);
        g.save(); g.translate(x + 16, yw(x + 16, dy)); g.rotate(Math.atan2(Math.cos(((x + 16) / LWV) * TAU) * AMP * TAU / LWV, 1)); g.beginPath(); g.ellipse(0, 0, 11, 4.6, 0, 0, TAU); g.fill(); g.restore(); void y; void ang;
      }
      for (let i = -1; i < 3; i++) { const x = LWV * i; g.strokeStyle = '#E7C375'; g.lineWidth = 4; g.beginPath(); g.arc(x + LWV * 0.75, 128 - AMP - 46, 18, PI, TAU * 1.25); g.stroke(); g.beginPath(); g.arc(x + LWV * 0.25, 128 + AMP + 46, 18, 0, PI * 1.25); g.stroke(); }
      for (const y of [12, 244]) { g.beginPath(); g.moveTo(-64, y); g.lineTo(576, y); g.strokeStyle = '#E7C375'; g.lineWidth = 7; g.stroke(); }
    });
    // ===== 4. Đá kem (448 × 224, lặp liền mạch cả hai chiều): nền #D2B47E, vân #C2A36E / #E4CE9C tương phản thấp, đốm mịn =====
    const stoneTile = () => {                                                                       // một chu kỳ (0…448 × 0…224); mọi nét vẽ lặp quanh 3 × 3 để biên khít
      const W = 448, H = 224, r = U.rng(4242);
      g.fillStyle = '#D2B47E'; g.fillRect(0, 0, W, H);
      const at = (fn) => { for (let ox = -W; ox <= W; ox += W) for (let oy = -H; oy <= H; oy += H) { g.save(); g.translate(ox, oy); fn(); g.restore(); } };
      for (let i = 0; i < 70; i++) { const x = r() * W, y = r() * H, rad = 18 + r() * 46, c = r() < 0.5 ? '194,163,110' : '228,206,156', a = 0.05 + r() * 0.07; at(() => { const q = g.createRadialGradient(x, y, 0, x, y, rad); q.addColorStop(0, `rgba(${c},${a})`); q.addColorStop(1, `rgba(${c},0)`); g.fillStyle = q; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }); }
      for (let i = 0; i < 16; i++) {                                                               // vân đá: đường gấp khúc mềm, hai màu
        const pts = []; let x = r() * W, y = r() * H, a = r() * TAU; for (let k = 0; k < 12; k++) { pts.push([x, y]); a += (r() - 0.5) * 1.1; x += Math.cos(a) * (16 + r() * 18); y += Math.sin(a) * (10 + r() * 12); }
        const lw = 1 + r() * 1.4, col = i % 2 ? 'rgba(194,163,110,0.38)' : 'rgba(228,206,156,0.42)';
        at(() => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k < pts.length - 1; k++) g.quadraticCurveTo(pts[k][0], pts[k][1], (pts[k][0] + pts[k + 1][0]) / 2, (pts[k][1] + pts[k + 1][1]) / 2); g.strokeStyle = col; g.lineWidth = lw; g.stroke(); });
      }
      for (let i = 0; i < 420; i++) { const x = r() * W, y = r() * H, s = 1 + r() * 1.6; g.fillStyle = r() < 0.5 ? 'rgba(160,128,78,0.14)' : 'rgba(240,222,176,0.16)'; at(() => g.fillRect(x, y, s, s)); }
    };
    inSlot(512, 1536, 512, 256, () => { for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) { g.save(); g.translate(544 + ox * 448, 1552 + oy * 224); stoneTile(); g.restore(); } });
    // ===== 5. Ô gấm (448 × 224): lưới thoi vàng mờ 35 % + hoa nhỏ trên nền #7D0910, lặp hai chiều =====
    inSlot(1024, 1536, 512, 256, () => {
      g.fillStyle = RED0; g.fillRect(1024, 1536, 512, 256);
      g.translate(1056, 1552); g.scale(0.875, 0.875);
      g.strokeStyle = 'rgba(231,195,117,0.35)'; g.lineWidth = 3;
      for (let k = -6; k <= 8; k++) { g.beginPath(); g.moveTo(k * 128, -128); g.lineTo(k * 128 + 384, 256); g.stroke(); g.beginPath(); g.moveTo(k * 128, 384); g.lineTo(k * 128 + 384, 0); g.stroke(); }
      for (let i = -2; i <= 5; i++) for (let j = -2; j <= 3; j++) {
        const x = 64 + i * 128, y = 64 + j * 128;
        g.fillStyle = 'rgba(231,195,117,0.5)'; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(x + Math.cos(k * PI / 2) * 9, y + Math.sin(k * PI / 2) * 9, 9, 5, k * PI / 2, 0, TAU); g.fill(); }
        g.fillStyle = RED0; g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill();
        g.fillStyle = 'rgba(231,195,117,0.45)'; g.beginPath(); g.arc(x + 64, y + 64, 5, 0, TAU); g.fill();
      }
    });
    // ===== 6. Son trơn / vàng trơn =====
    g.fillStyle = RED0; g.fillRect(0, 1792, 256, 256);
    gr = g.createLinearGradient(0, 1856, 0, 1984); gr.addColorStop(0, '#D4A843'); gr.addColorStop(1, '#B8913F'); g.fillStyle = gr; g.fillRect(256, 1792, 256, 256);
    // ===== 7. Vầng sáng cộng màu 224² (đen = tàng hình; lõi #FFC070 ấm, không trắng; tắt hẳn trước mép ô) =====
    g.fillStyle = '#000'; g.fillRect(512, 1792, 1024, 256);
    g.save(); g.translate(768, 1920);
    g.strokeStyle = 'rgba(255,184,100,0.07)'; g.lineWidth = 3;
    for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; g.beginPath(); g.moveTo(Math.cos(a) * 20, Math.sin(a) * 20); g.lineTo(Math.cos(a) * 104, Math.sin(a) * 104); g.stroke(); }
    gr = g.createRadialGradient(0, 0, 0, 0, 0, 112);
    gr.addColorStop(0, 'rgba(255,192,112,1)'); gr.addColorStop(0.22, 'rgba(255,184,100,0.78)'); gr.addColorStop(0.5, 'rgba(255,150,72,0.34)'); gr.addColorStop(0.78, 'rgba(210,96,34,0.09)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(-128, -128, 256, 256);
    g.restore();
    // ===== 8. Đĩa hào quang 480² (bán kính 238): đỏ thẫm, 36 tia vàng tắt dần ra mép, vòng 28 hạt vàng, ánh cam trong; ngoài đĩa alpha 0 =====
    g.save(); g.translate(1792, 1792);
    g.beginPath(); g.arc(0, 0, 238, 0, TAU); g.clip();
    gr = g.createRadialGradient(0, 0, 0, 0, 0, 238); gr.addColorStop(0, '#6E1214'); gr.addColorStop(0.7, '#5A0E10'); gr.addColorStop(1, '#3A0608');
    g.fillStyle = gr; g.fillRect(-240, -240, 480, 480);
    for (let i = 0; i < 36; i++) {                                                                  // tia vàng hình nêm, nhạt dần về mép
      const a = (i / 36) * TAU, hw = 0.062; g.save(); g.rotate(a);
      const rg = g.createLinearGradient(40, 0, 228, 0); rg.addColorStop(0, 'rgba(231,195,117,0.85)'); rg.addColorStop(0.6, 'rgba(231,195,117,0.4)'); rg.addColorStop(1, 'rgba(231,195,117,0.06)');
      g.beginPath(); g.moveTo(40, -2); g.lineTo(228, -228 * Math.tan(hw)); g.lineTo(228, 228 * Math.tan(hw)); g.lineTo(40, 2); g.closePath(); g.fillStyle = rg; g.fill(); g.restore();
    }
    gr = g.createRadialGradient(0, 0, 0, 0, 0, 150); gr.addColorStop(0, 'rgba(232,116,42,0.35)'); gr.addColorStop(0.6, 'rgba(232,116,42,0.14)'); gr.addColorStop(1, 'rgba(232,116,42,0)');
    g.fillStyle = gr; g.fillRect(-240, -240, 480, 480);                                              // ánh cam mềm bên trong
    g.beginPath(); g.arc(0, 0, 232, 0, TAU); g.strokeStyle = '#E7C375'; g.lineWidth = 3; g.stroke();
    g.beginPath(); g.arc(0, 0, 202, 0, TAU); g.strokeStyle = 'rgba(231,195,117,0.55)'; g.lineWidth = 2; g.stroke();
    for (let i = 0; i < 28; i++) {                                                                  // vòng hạt vàng
      const a = (i / 28) * TAU, bx = Math.cos(a) * 217, by = Math.sin(a) * 217, bg = g.createRadialGradient(bx - 2, by - 2, 1, bx, by, 8);
      bg.addColorStop(0, '#F7E2A0'); bg.addColorStop(0.6, '#D9A441'); bg.addColorStop(1, '#8A5A18'); g.beginPath(); g.arc(bx, by, 7.5, 0, TAU); g.fillStyle = bg; g.fill();
    }
    g.restore();
  };
  return { AT, UV, draw };
}
