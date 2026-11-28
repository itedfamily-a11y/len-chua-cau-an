// =====================================================================
//  TƯỜNG BAO GẠCH CŨ (2026-11-28) — thân tường bao dán ảnh gạch cũ loang vôi
//  Chủ chùa muốn công trình "màu cổ kính, đồng điệu màu sắc" với cổng Tàng Kinh Các (gỗ 0x642c20, ngói 0x4b5059, bờ nóc 0x3a3e46)
//  và gửi các mẫu tường đá / tường gạch trên Sketchfab; chủ chùa chọn "Grungy Brick Wall" của James Candy (Sketchfab, CC BY 4.0).
//  Chỉ lấy ảnh màu bề mặt của mẫu: cắt một ô đúng số viên gạch, nối liền mép, chỉnh màu cho hợp bảng màu cổ, thu nhỏ
//  (lệnh: tests-local/tuong-gach-tools/LENH-TUONG-GACH.md) → assets/tuong/gach-cu.webp (512 × 512 px, 56 KB; một ô = 2,7 m × 1,33 m tường, 12 viên × 18 hàng gạch).
//  CÁCH LÀM: ba nơi dựng tường bao (05-world.js wall(), 19-tang-kinh-cac.js wall(), 19-vuon-sau.js 'tường vườn') gọi tuongGach(G).than(x0, z0, x1, z1)
//  thay cho hộp thân tường vàng đất, rồi tuongGach(G).mesh(tên) ở chỗ gom lưới. Chân đá, mái ngói, bờ nóc, cột tường giữ nguyên như cũ.
//  - Thân tường: bốn mặt đứng y 0,4…1,7 m, dày 0,45 m (mặt trên và mặt dưới bị mái, chân đá che nên bỏ). Toạ độ ảnh lấy theo toạ độ thế giới
//    (u theo chiều dọc tường, v theo chiều cao từ mặt chân đá), nên các đoạn tường thẳng hàng nối gạch liền nhau, hàng gạch đầu nằm ngay trên chân đá.
//  - Vết loang ghi vào màu từng đỉnh (lưới ô CFG.cell m theo chiều dài × các tầng CFG.rows): mảng sáng tối lớn để ảnh lặp đỡ lộ, ố ẩm và rêu ở chân tường,
//    vệt tối dưới mái. Màu đỉnh là hệ số nhân (≈ 0,6…1,05), nhân với ảnh khi có ảnh, nhân với màu phẳng khi không có.
//  - Dự phòng: chưa tải / tải lỗi / máy bật tiết kiệm dữ liệu → vật liệu tô phẳng MAU_PHANG (màu trung bình của ảnh) nhân vết loang: vẫn ra tường gạch cũ, chỉ không có viên gạch.
//  Tải ảnh sau khi game chạy CFG.start giây; lỗi thử lại một lần sau CFG.retryAfter giây rồi thôi (một dòng console.warn).
//  Trạng thái: G.tuongGach = { state: 'idle' | 'loading' | 'ready' | 'failed' | 'skipped', url, error, credit, meshes, tex, than(), mesh(), show(bool) }.
//  Ghi công tác giả ở cuối bảng Cài đặt khi ảnh đang hiện.
// =====================================================================
function tuongGach(G) {
  if (G.tuongGach) return G.tuongGach;
  const { THREE, util: U } = G;
  const CFG = {
    url: 'assets/tuong/gach-cu.webp',
    px: 512,             // cỡ ảnh (px, vuông)
    tile: [2.7, 1.33],   // m: một ô ảnh phủ rộng × cao trên mặt tường = đúng 12 viên × 18 hàng gạch (viên 225 mm, hàng 74 mm, kể cả mạch vữa); ảnh vuông nên mỗi điểm ảnh dẹt theo chiều ngang
    y0: 0.4, y1: 1.7,    // thân tường: từ mặt chân đá tới dưới mái
    half: 0.225,         // nửa bề dày thân tường (0,45 m)
    cell: 1.5,           // m: bước chia theo chiều dài để ghi vết loang
    rows: [0.4, 0.58, 0.82, 1.15, 1.48, 1.7], // các tầng chia theo chiều cao (dày ở chân tường cho ố ẩm, rêu)
    start: 1.0,          // giây sau khi game chạy thì bắt đầu tải ảnh
    retryAfter: 45,      // giây
  };
  const MAU_PHANG = 0x77655e; // màu tô phẳng khi không có ảnh: trung bình của ảnh gạch (đã chỉnh màu)
  const MAU_ANH = 0xffffff;   // màu nhân thêm khi có ảnh
  const CREDIT = {
    text: 'Bề mặt tường bao gạch cũ lấy từ mẫu "Grungy Brick Wall" của James Candy trên Sketchfab, giấy phép CC BY 4.0, đã chỉnh sửa cho vừa trò chơi (cắt một ô gạch liền mép, chỉnh màu cho hợp bảng màu cổ, thu nhỏ ảnh).',
    href: 'https://sketchfab.com/3d-models/grungy-brick-wall-9534ee78eb3746fa893d8a80cee9c1bb',
    licence: 'https://creativecommons.org/licenses/by/4.0/',
  };
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, color: MAU_PHANG });
  mat.name = 'tuong-gach';
  (G.mats || (G.mats = {})).tuong = mat;

  // ---------- vết loang: nhiễu giá trị 3D (băm số nguyên) ----------
  const hash3 = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const sm = (t) => t * t * (3 - 2 * t);
  const vnoise = (x, y, z) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), fx = sm(x - xi), fy = sm(y - yi), fz = sm(z - zi);
    let v = 0;
    for (let k = 0; k < 8; k++) { const dx = k & 1, dy = (k >> 1) & 1, dz = k >> 2; v += hash3(xi + dx, yi + dy, zi + dz) * (dx ? fx : 1 - fx) * (dy ? fy : 1 - fy) * (dz ? fz : 1 - fz); }
    return v;
  };
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const REU = [0.74, 0.86, 0.6]; // hệ số màu rêu (xanh rêu, tối)
  function loang(x, y, z, out) { // hệ số màu tại một điểm trên mặt tường (toạ độ thế giới)
    const big = vnoise(x * 0.19 + 11, y * 0.5, z * 0.19 - 7), mid = vnoise(x * 0.62 - 3, y * 1.3 + 5, z * 0.62 + 13);
    let k = 0.93 + 0.2 * (big - 0.5) + 0.1 * (mid - 0.5);       // mảng sáng tối lớn: ảnh lặp mỗi 1,8 m đỡ lộ
    const h = (y - CFG.y0) / (CFG.y1 - CFG.y0);                    // 0 ở chân tường, 1 dưới mái
    const am = Math.pow(clamp01(1 - h / 0.42), 1.6) * (0.55 + 0.45 * vnoise(x * 0.45 + 40, 0.5, z * 0.45 - 40)); // ố ẩm ngấm từ chân lên
    k *= 1 - 0.3 * am;
    if (h > 0.86) k *= 1 - 0.1 * (h - 0.86) / 0.14;                 // vệt tối dưới mái
    let r = k, g = k, b = k;
    const reu = clamp01((vnoise(x * 0.33 - 21, 0.3, z * 0.33 + 9) - 0.48) * 2.6) * clamp01(1 - h / 0.36); // rêu từng đám ở chân tường
    if (reu > 0) { r *= 1 + (REU[0] - 1) * reu; g *= 1 + (REU[1] - 1) * reu; b *= 1 + (REU[2] - 1) * reu; }
    out[0] = r; out[1] = g; out[2] = b;
  }

  // ---------- gom hình: vị trí, pháp tuyến, toạ độ ảnh, màu đỉnh, chỉ số ----------
  let P = [], N = [], UV = [], C = [], I = [];
  const _c = [0, 0, 0];
  // một mặt đứng phẳng: chạy từ (ax, az) tới (bx, bz), pháp tuyến (nx, nz); u = toạ độ dọc tường theo chiều "sang phải" khi nhìn vào mặt
  function mat1(ax, az, bx, bz, nx, nz, nCell) {
    const base = P.length / 3, rows = CFG.rows, TW = CFG.tile[0], TH = CFG.tile[1];
    for (let i = 0; i <= nCell; i++) {
      const t = i / nCell, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
      const u = (nz > 0.5 ? x : nz < -0.5 ? -x : nx > 0.5 ? -z : z) / TW;  // +z: phải = +x; −z: phải = −x; +x: phải = −z; −x: phải = +z
      for (let j = 0; j < rows.length; j++) {
        const y = rows[j];
        P.push(x, y, z); N.push(nx, 0, nz); UV.push(u, (y - CFG.y0) / TH);
        loang(x, y, z, _c); C.push(_c[0], _c[1], _c[2]);
      }
    }
    const R = rows.length;
    for (let i = 0; i < nCell; i++) for (let j = 0; j < R - 1; j++) {
      const a = base + i * R + j, b = a + R, c = b + 1, d = a + 1;          // a (i, j), b (i+1, j), c (i+1, j+1), d (i, j+1)
      I.push(a, b, c, a, c, d);
    }
  }
  // thân một đoạn tường dọc trục x hoặc trục z, từ (x0, z0) tới (x1, z1), như hộp thân tường cũ (dài L, dày 0,45 m, cao 0,4…1,7 m)
  function than(x0, z0, x1, z1) {
    const lx = Math.abs(x1 - x0), lz = Math.abs(z1 - z0), alongX = lx > lz, L = Math.max(lx, lz), h = CFG.half;
    if (!(L > 0.01)) return;
    const n = Math.max(1, Math.ceil(L / CFG.cell));
    if (alongX) {
      const xa = Math.min(x0, x1), xb = Math.max(x0, x1), zc = (z0 + z1) / 2;
      mat1(xa, zc + h, xb, zc + h, 0, 1, n);  // mặt +z: vẽ ngược chiều kim đồng hồ khi nhìn từ +z → đi từ x nhỏ tới x lớn
      mat1(xb, zc - h, xa, zc - h, 0, -1, n); // mặt −z
      mat1(xa, zc - h, xa, zc + h, -1, 0, 1); // đầu x nhỏ (pháp tuyến −x)
      mat1(xb, zc + h, xb, zc - h, 1, 0, 1);  // đầu x lớn (pháp tuyến +x)
    } else {
      const za = Math.min(z0, z1), zb = Math.max(z0, z1), xc = (x0 + x1) / 2;
      mat1(xc + h, zb, xc + h, za, 1, 0, n);  // mặt +x
      mat1(xc - h, za, xc - h, zb, -1, 0, n); // mặt −x
      mat1(xc + h, za, xc - h, za, 0, -1, 1); // đầu z nhỏ (pháp tuyến −z)
      mat1(xc - h, zb, xc + h, zb, 0, 1, 1);  // đầu z lớn (pháp tuyến +z)
    }
  }
  // gom phần đã ghi thành một lưới (nơi gọi tự thêm vào cảnh / nhóm của mình); không có gì thì trả về null
  function mesh(name) {
    if (!I.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    g.setIndex(I); g.computeBoundingSphere(); g.computeBoundingBox();
    P = []; N = []; UV = []; C = []; I = [];
    const m = new THREE.Mesh(g, mat);
    m.name = 'tuong-gach:' + name; m.castShadow = true; m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix();
    T.meshes.push(m);
    return m;
  }

  // ---------- ảnh: tải sau khi game chạy; lỗi thì giữ màu phẳng ----------
  const T = (G.tuongGach = { state: 'idle', url: CFG.url, error: null, credit: null, meshes: [], tex: null, tries: 0, next: CFG.start, cfg: CFG, than, mesh, show: null });
  T.show = (anh) => { // true: dán ảnh gạch; false: tô phẳng màu dự phòng
    const on = !!anh && !!T.tex;
    if (on === !!mat.map) return;
    mat.map = on ? T.tex : null; mat.color.set(on ? MAU_ANH : MAU_PHANG); mat.needsUpdate = true;
    T.credit = on ? CREDIT : null;
  };
  let now = 0;
  function load() {
    T.state = 'loading'; T.tries++;
    new THREE.TextureLoader().load(CFG.url, (tex) => {
      try {
        const im = tex.image, w = im && (im.naturalWidth || im.width), h = im && (im.naturalHeight || im.height);
        if (!(w >= 16 && h >= 16)) throw new Error('ảnh hỏng: ' + w + ' × ' + h);
        tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.anisotropy = Math.min(8, (G.renderer && G.renderer.capabilities && G.renderer.capabilities.getMaxAnisotropy()) || 1);
        tex.needsUpdate = true;
        T.tex = tex; T.state = 'ready'; T.error = null;
        T.show(true);
      } catch (e) { fail(e, true); }
    }, undefined, (e) => fail(e, false));
  }
  function fail(e, hong) {
    T.error = (e && e.message) || (e && e.type) || String(e);
    if (!hong && T.tries < 2) { T.state = 'idle'; T.next = now + CFG.retryAfter; }
    else { T.state = 'failed'; console.warn('[tường gạch] không tải được ảnh — giữ màu phẳng: ' + T.error); }
  }
  if (G.onUpdate) G.onUpdate((dt, t) => {
    now = t || 0;
    if (T.state !== 'idle' || now < T.next) return;
    if (navigator.connection && navigator.connection.saveData) { T.state = 'skipped'; return; } // tiết kiệm dữ liệu: giữ màu phẳng
    load();
  }, 59);

  // ghi công tác giả (CC BY 4.0) ở cuối bảng Cài đặt, khi ảnh gạch đang hiện
  if (G.events && G.events.on) G.events.on('ui:settings', (box) => {
    if (!box || !box.appendChild || !T.credit || !U || !U.el) return;
    const p = U.el('p', 'muted small', T.credit.text + ' ');
    [['Xem mẫu gốc', T.credit.href], ['Giấy phép CC BY 4.0', T.credit.licence]].forEach(([label, href], i) => {
      const a = U.el('a', null, label); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.style.cssText = 'color:inherit;display:inline-block;padding:13px 4px;margin:-13px -4px';
      if (i) p.append(' · ');
      p.append(a);
    });
    box.appendChild(p);
  });
  return T;
}
