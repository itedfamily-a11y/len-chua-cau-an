// =====================================================================
//  SEN TRONG HỒ VƯỜN SAU — LÁ, HOA, NỤ, GƯƠNG SEN THEO MÔ HÌNH 3D (2026-11-28)
//  Chủ chùa gửi file "Lotus" của 寅虎 (yinhu) trên Sketchfab, giấy phép CC BY 4.0, và bảo: "sửa lá sen và hoa sen trong hồ theo file sau".
//  File gốc là MỘT cụm sen tạc liền (hoa nở, nụ, gương sen, ba lá, cuống có gai), 5,2 triệu mặt, tô màu theo đỉnh, không có ảnh bề mặt.
//  File trong game (assets/mo-hinh/sen-ho.glb 95 KB, sen-ho-nhe.glb 75 KB cho máy cảm ứng / đồ hoạ thấp) tách cụm ấy thành bốn lưới rời:
//    hoa  bông sen nở (1 611 / 1 432 mặt): trục hoa ở gốc, đáy gương ở y = 0, đường kính 1; nhị dựng lại bằng lá mỏng (nhị thật là hàng trăm sợi li ti);
//    nu   nụ sen (260 / 140 mặt): đáy ở y = 0, cao 1;
//    dai  gương sen già (344 / 204 mặt): chỗ nối cuống ở gốc, đường kính 1;
//    la   một lá sen tròn (640 / 280 mặt): rốn lá ở gốc, mặt lá đã xoay nằm ngang, đường kính 1.
//  Cuống không lấy từ file (mỗi cuống gần 600 nghìn mặt gai): game dựng cuống thẳng năm cạnh. Lệnh dựng: tests-local/quan-am-tools/LENH-SEN-HO.md.
//  Chỗ đặt lấy từ 19-vuon-sau.js, không đổi: G.vuonSau.pads (60 lá nổi; 22 lá đầu có hoa, 10 lá kế có nụ) và G.vuonSau.senCao (12 lá vươn cao).
//  (Chiều 2026-11-28 hồ kéo dài thành 32 × 52 m: 86 lá nổi, 30 hoa, 14 nụ, 16 lá vươn cao, 8 gương sen; lá nào mang gì đọc ở G.vuonSau.senChia.)
//    - Lá nổi: lá mô hình ép dẹp (gợn cao 3 cm) đặt trên mặt nước đúng độ cao lá cũ (nước + 3 cm), rộng hơn lá cũ một chút.
//    - Lá vươn cao: lá mô hình nguyên dáng trên cuống cao 0,35–0,85 m, nghiêng nhẹ.
//    - Hoa: trước nằm sát mặt nước trên lá, nay nở trên cuống cao 0,45–0,8 m cạnh lá (cao hơn đèn hoa đăng đang trôi), rộng 0,46–0,6 m, vài bông ngả trắng.
//    - Nụ: trên cuống cao 0,4–0,85 m. Gương sen: thêm 6 chiếc trên cuống cạnh sáu lá nổi kế tiếp, hơi cúi (file gốc có gương sen, hồ cũ không có).
//  Mỗi loại là một InstancedMesh (5 lần vẽ: lá, hoa, nụ, gương, cuống), một chất liệu tô màu theo đỉnh, nằm trong nhóm "near" của vườn nên ẩn hiện theo vườn.
//  Sen dựng bằng mã (lưới 'vuonSau:sen') là bản dự phòng: ẩn khi mô hình hiện. Vật cản, lối đi, chỗ đặt đèn, vùng bơi của cá không đổi.
//  Tải khi người chơi vào trong 85 m quanh hồ; máy bật "tiết kiệm dữ liệu" thì không tải. Lỗi: giữ sen dựng bằng mã, một dòng console.warn;
//  lỗi tải file thử lại một lần sau 45 giây (bằng bản nhẹ).
//  Trạng thái: G.senHo = { state: 'idle' | 'loading' | 'ready' | 'failed' | 'skipped', url, error, tris, counts, credit, show(bool) }.
//  Ghi công tác giả ở cuối bảng Cài đặt khi mô hình đang hiện.
// =====================================================================
function installSenHo(G) {
  const { THREE, util: U } = G;
  const V = G.vuonSau;
  if (!V || !V.pond || !V.pads || !V.pads.length || !V.groups || !V.groups.near || !G.onUpdate) return;
  const near = V.groups.near, code = near.getObjectByName('vuonSau:sen');
  const POND = V.pond, WY = POND.water, CX = (POND.x0 + POND.x1) / 2, CZ = (POND.z0 + POND.z1) / 2;
  const low = !!G.isTouch || !!(G.quality && G.quality.low);
  const CFG = {
    url: 'assets/mo-hinh/sen-ho-nhe.glb', urlHi: 'assets/mo-hinh/sen-ho.glb',
    near: 85,            // m quanh hồ
    padY: 0.03,          // lá nổi: đáy lá trên mặt nước (như lá dựng bằng mã; trên lớp vẽ cá của 19-nuoc-ca.js là nước + 0,026)
    padRelief: 0.03,     // lá nổi: độ gợn tối đa sau khi ép dẹp (m), để đèn hoa đăng trôi qua không cắm vào lá
    padWide: 1.12,       // lá nổi rộng hơn lá cũ (lá cũ là đĩa tròn bán kính r)
    stem: [0.38, 0.52, 0.2], // màu cuống (sRGB)
    retryAfter: 45,      // giây
  };
  const CREDIT = {
    text: 'Lá sen, hoa sen, nụ và gương sen trong hồ là mô hình 3D "Lotus" của 寅虎 (yinhu) trên Sketchfab, giấy phép CC BY 4.0, đã chỉnh sửa cho vừa trò chơi (tách từng phần, giảm số mặt, dựng lại nhị và cuống).',
    href: 'https://sketchfab.com/3d-models/lotus-a96bda0564d34674acc0431d32aad81a',
    licence: 'https://creativecommons.org/licenses/by/4.0/', // CC BY 4.0: nêu tên tác giả, nguồn, giấy phép (kèm đường dẫn) và việc đã chỉnh sửa
  };
  const S = (G.senHo = { state: 'idle', url: CFG.url, error: null, tris: 0, tries: 0, next: 0, counts: null, credit: null, show: null });
  let Loader = null, now = 0;

  function place(gltf) {
    const root = gltf && (gltf.scene || (gltf.scenes && gltf.scenes[0]));
    if (!root) throw new Error('mô hình không có cảnh');
    root.updateMatrixWorld(true);
    const part = (name) => {
      const o = root.getObjectByName(name);
      if (!o || !o.isMesh || !o.geometry || !o.geometry.attributes.position) throw new Error('mô hình thiếu lưới "' + name + '"');
      const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
      if (!g.attributes.color) throw new Error('lưới "' + name + '" không có màu đỉnh');
      if (!g.attributes.normal) g.computeVertexNormals();
      for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'color') g.deleteAttribute(k);
      g.computeBoundingBox(); g.computeBoundingSphere();
      return g;
    };
    const gLa = part('la'), gHoa = part('hoa'), gNu = part('nu'), gDai = part('dai');
    // cuống: ống năm cạnh, đáy ở y = 0, đỉnh ở y = 1, bán kính 1 (co theo từng cuống)
    const gThan = new THREE.CylinderGeometry(0.8, 1, 1, 5, 1, true); gThan.translate(0, 0.5, 0);
    { const c = new THREE.Color().setRGB(CFG.stem[0], CFG.stem[1], CFG.stem[2], THREE.SRGBColorSpace), n = gThan.attributes.position.count, a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const k = 0.8 + 0.25 * gThan.attributes.position.getY(i); a[i * 3] = c.r * k; a[i * 3 + 1] = c.g * k; a[i * 3 + 2] = c.b * k; }
      gThan.setAttribute('color', new THREE.BufferAttribute(a, 3)); gThan.deleteAttribute('uv'); }
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });

    // ---------- chỗ đặt (số ngẫu nhiên cố định: ai chơi cũng thấy cùng một hồ sen) ----------
    const r = U.rng ? U.rng(4711) : Math.random, TAU = Math.PI * 2;
    const pads = V.pads, tall = V.senCao || [];
    const CHIA = V.senChia || { hoa: [0, 22], nu: [22, 32], cao: [32, 44], dai: [44, 50] };       // lá nào mang hoa / nụ / gương (19-vuon-sau.js; hồ dài thêm thì nhiều hơn)
    const L = [], H = [], N = [], D = [], T = [];   // lá, hoa, nụ, gương, cuống: { x, y, z, sx, sy, sz, rx, ry, rz, c: [r, g, b] }
    const laLo = gLa.boundingBox.min.y, laRelief = Math.max(1e-4, gLa.boundingBox.max.y - laLo);
    for (const p of pads) { // lá nổi
      const d = 2 * p.r * CFG.padWide, sy = Math.min(d, CFG.padRelief / laRelief), k = 0.86 + r() * 0.26;
      L.push({ x: p.x, y: WY + CFG.padY - laLo * sy, z: p.z, sx: d, sy, sz: d, rx: 0, ry: r() * TAU, rz: 0, c: [k, k * (0.97 + r() * 0.08), k * 0.92] });
    }
    const stem = (x, z, h, rad) => T.push({ x, y: WY - 0.04, z, sx: rad, sy: h + 0.04, sz: rad, rx: 0, ry: r() * TAU, rz: 0, c: [1, 1, 1] });
    for (const p of tall) { // lá vươn cao
      const d = 0.8 + r() * 0.35, k = 0.9 + r() * 0.2;
      L.push({ x: p.x, y: WY + p.h, z: p.z, sx: d, sy: d, sz: d, rx: (r() - 0.5) * 0.44, ry: r() * TAU, rz: (r() - 0.5) * 0.44, c: [k, k, k * 0.95] });
      stem(p.x, p.z, p.h, 0.018);
    }
    const beside = (p, d0, d1) => { const a = r() * TAU, d = d0 + r() * (d1 - d0); return [p.x + Math.cos(a) * d, p.z + Math.sin(a) * d]; };
    pads.slice(CHIA.hoa[0], CHIA.hoa[1]).forEach((p) => { // hoa
      const [x, z] = beside(p, 0.1, 0.24), h = 0.45 + r() * 0.35, d = 0.46 + r() * 0.14, w = r() < 0.3 ? 0.25 + r() * 0.3 : 0; // w: ngả trắng
      H.push({ x, y: WY + h, z, sx: d, sy: d, sz: d, rx: (r() - 0.5) * 0.28, ry: r() * TAU, rz: (r() - 0.5) * 0.28, c: [1 + w * 0.1, 1 + w * 0.5, 1 + w * 0.4] });
      stem(x, z, h, 0.016);
    });
    pads.slice(CHIA.nu[0], CHIA.nu[1]).forEach((p) => { // nụ
      const x = p.x + 0.15, z = p.z, h = 0.4 + r() * 0.45, s = 0.26 + r() * 0.08;
      N.push({ x, y: WY + h, z, sx: s, sy: s, sz: s, rx: (r() - 0.5) * 0.32, ry: r() * TAU, rz: (r() - 0.5) * 0.32, c: [1, 1, 1] });
      stem(x, z, h, 0.013);
    });
    pads.slice(CHIA.dai[0], CHIA.dai[1]).forEach((p) => { // gương sen
      const [x, z] = beside(p, 0.12, 0.26), h = 0.5 + r() * 0.3, d = 0.2 + r() * 0.06, a = r() * TAU, t = 0.25 + r() * 0.25;
      D.push({ x, y: WY + h, z, sx: d, sy: d, sz: d, rx: Math.cos(a) * t, ry: r() * TAU, rz: Math.sin(a) * t, c: [1, 1, 1] });
      stem(x, z, h, 0.016);
    });

    const grp = new THREE.Group(); grp.name = 'senHo';
    const dummy = new THREE.Object3D(), col = new THREE.Color();
    const batch = (name, geo, list, shadow) => {
      if (!list.length) return 0;
      const im = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((q, i) => {
        dummy.position.set(q.x, q.y, q.z); dummy.rotation.set(q.rx, q.ry, q.rz, 'YXZ'); dummy.scale.set(q.sx, q.sy, q.sz); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix);
        im.setColorAt(i, col.setRGB(q.c[0], q.c[1], q.c[2]));
      });
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.castShadow = false; im.receiveShadow = !!shadow; im.matrixAutoUpdate = false; im.name = 'senHo:' + name;
      grp.add(im);
      return list.length * ((geo.index ? geo.index.count : geo.attributes.position.count) / 3);
    };
    S.tris = Math.round(batch('la', gLa, L, true) + batch('hoa', gHoa, H) + batch('nu', gNu, N) + batch('dai', gDai, D) + batch('than', gThan, T));
    S.counts = { la: L.length, hoa: H.length, nu: N.length, dai: D.length, than: T.length };
    near.add(grp);
    S.show = (on) => { // true: sen mô hình; false: sen dựng bằng mã (để so sánh / gỡ lỗi)
      grp.visible = !!on; if (code) code.visible = !on;
      S.credit = on ? CREDIT : null;
    };
    S.show(true);
  }

  async function load() {
    S.state = 'loading'; S.tries++;
    try {
      if (!Loader) {
        try { Loader = (await import('three/addons/loaders/GLTFLoader.js')).GLTFLoader; } catch (e) { S.tries = 99; throw e; }
        if (!Loader) { S.tries = 99; throw new Error('addon không có GLTFLoader'); }
      }
      S.url = S.tries > 1 || low ? CFG.url : CFG.urlHi;                                  // lần thử lại: bản nhẹ
      const gltf = await new Loader().loadAsync(S.url);
      try { place(gltf); } catch (e) { S.tries = 99; throw e; }
      S.state = 'ready'; S.error = null;
    } catch (e) {
      S.error = (e && e.message) || String(e);
      if (S.tries < 2) { S.state = 'idle'; S.next = now + CFG.retryAfter; }
      else { S.state = 'failed'; console.warn('[hồ sen] không tải được mô hình sen — giữ sen dựng bằng mã: ' + S.error); }
    }
  }

  const near2 = CFG.near * CFG.near;
  G.onUpdate((dt, t) => {
    now = t || 0;
    if (S.state !== 'idle' || now < S.next) return;
    const P = G.player; if (!P || !P.pos) return;
    const dx = P.pos.x - CX, dz = P.pos.z - CZ;
    if (dx * dx + dz * dz > near2) return;
    const conn = navigator.connection;
    if (conn && conn.saveData) { S.state = 'skipped'; return; }                           // máy bật "tiết kiệm dữ liệu": giữ sen dựng bằng mã
    load();
  }, 59);

  // ghi công tác giả (CC BY 4.0) ở cuối bảng Cài đặt, khi sen mô hình đang hiện
  if (G.events && G.events.on) G.events.on('ui:settings', (box) => {
    if (!box || !box.appendChild || !S.credit) return;
    const p = U.el('p', 'muted small', S.credit.text + ' ');
    [['Xem mô hình gốc', S.credit.href], ['Giấy phép CC BY 4.0', S.credit.licence]].forEach(([label, href], i) => {
      const a = U.el('a', null, label); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.style.cssText = 'color:inherit;display:inline-block;padding:13px 4px;margin:-13px -4px';
      if (i) p.append(' · ');
      p.append(a);
    });
    box.appendChild(p);
  });
}
