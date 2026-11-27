// =====================================================================
//  ĐÈN HOA ĐĂNG = HOA SEN MÔ HÌNH 3D (2026-11-28)
//  Chủ chùa gửi file "Lotus Flower by Geometry Nodes" của Shiki trên Sketchfab và bảo: "sửa hoa đăng bằng hoa này".
//  Giấy phép CC BY-NC 4.0: PHI THƯƠNG MẠI. Trò chơi không quảng cáo, không thu tiền, không nhận quyên góp nên dùng được, kèm ghi công;
//  nếu sau này trò chơi có bất kỳ khoản thu nào thì phải bỏ hai file mô hình này (game tự quay về đèn dựng bằng mã).
//  - Hình đèn (thân đèn của MỌI đèn hoa đăng: 18 đèn của khách + tối đa 6 của người chơi, cả đèn đang cầm trên tay) là một InstancedMesh của
//    40-activities-b.js (G.activitiesB.state().meshes.body). Module này chỉ thay geometry của nó bằng bông sen, giữ nguyên chất liệu
//    (màu theo đỉnh, tự sáng dần về đêm, sắc riêng từng đèn), vị trí, cách trôi, ngọn lửa, quầng sáng, nhãn giấy.
//  - File trong game: giảm số mặt (1,23 triệu → 4 200 / 1 600), đưa trục hoa về gốc, thêm màu đỉnh (file gốc chỉ có một màu tím hồng, không có ảnh bề mặt):
//    lõi hoa màu kem ấm như được nến soi, cánh hồng tím, mép cánh ngoài đậm hơn. Lệnh dựng: tests-local/quan-am-tools/LENH-HOA-DANG-SEN.md.
//      assets/mo-hinh/hoa-dang-sen.glb      4 200 mặt, 105 KB — máy tính;
//      assets/mo-hinh/hoa-dang-sen-nhe.glb  1 600 mặt,  44 KB — máy cảm ứng, đồ hoạ thấp, và lần thử lại.
//  - Bông sen rộng khoảng 0,70 m (đèn cũ 0,67 m), đáy cao hơn mặt nước 3 cm. Lõi hoa khép kín nên không còn cây nến: ngọn lửa đặt ngay trên đỉnh lõi hoa
//    (G.activitiesB.lanternTop = { flame, glow }: độ cao ngọn lửa / quầng sáng mà 40-activities-b.js đọc mỗi khung).
//  - Tải khi người chơi vào trong 75 m quanh hồ sen; máy bật "tiết kiệm dữ liệu" thì không tải. Lỗi ở bất kỳ bước nào: giữ đèn dựng bằng mã,
//    một dòng console.warn; lỗi tải file thử lại một lần sau 45 giây (bằng bản nhẹ).
//  - Trạng thái: G.hoaDangSen = { state: 'idle' | 'loading' | 'ready' | 'failed' | 'skipped', url, error, tris, credit, show(bool) }.
//    Ghi công tác giả ở cuối bảng Cài đặt khi bông sen đang hiện.
// =====================================================================
function installHoaDangSen(G) {
  const { THREE, util: U } = G;
  const A = G.activitiesB;
  let st = null; try { st = A && A.state && A.state(); } catch (e) { st = null; }
  const body = st && st.meshes && st.meshes.body, TOP = A && A.lanternTop, POND = st && st.pond;
  if (!body || !body.isInstancedMesh || !body.material || !TOP || !POND || !G.onUpdate) return;

  const low = !!G.isTouch || !!(G.quality && G.quality.low);
  const CFG = {
    url: 'assets/mo-hinh/hoa-dang-sen-nhe.glb', urlHi: 'assets/mo-hinh/hoa-dang-sen.glb',
    near: 75,          // m quanh hồ
    span: 0.74,        // bề ngang bông sen trong đơn vị của hình đèn (đèn vẽ ở cỡ 0,95: khoảng 0,70 m)
    y0: -0.01,         // đáy hoa so với gốc đèn (gốc đèn nổi cao hơn mặt nước 4 cm): mọi phần của đèn ở trên lớp vẽ cá của 19-nuoc-ca.js
    flame: -0.012, glow: 0.04, // ngọn lửa / quầng sáng so với đỉnh lõi hoa
    retryAfter: 45,    // giây
  };
  const CREDIT = {
    text: 'Đèn hoa đăng là mô hình 3D "Lotus Flower by Geometry Nodes" của Shiki trên Sketchfab, giấy phép CC BY-NC 4.0 (phi thương mại), đã chỉnh sửa cho vừa trò chơi (giảm số mặt, thêm màu cho cánh hoa).',
    href: 'https://sketchfab.com/3d-models/lotus-flower-by-geometry-nodes-398b0f0eafe640a2a3dec98305a8e1c3',
    licence: 'https://creativecommons.org/licenses/by-nc/4.0/', // CC BY-NC 4.0: nêu tên tác giả, nguồn, giấy phép (kèm đường dẫn) và việc đã chỉnh sửa; không dùng cho mục đích thương mại
  };
  const S = (G.hoaDangSen = { state: 'idle', url: CFG.url, error: null, tris: 0, tries: 0, next: 0, credit: null, show: null });
  const mat = body.material, old = { geo: body.geometry, flat: !!mat.flatShading, side: mat.side, flame: TOP.flame, glow: TOP.glow };
  let Loader = null, now = 0;

  function place(gltf) {
    const root = gltf && (gltf.scene || (gltf.scenes && gltf.scenes[0]));
    if (!root) throw new Error('mô hình không có cảnh');
    root.updateMatrixWorld(true);
    let src = null; root.traverse((o) => { if (!src && o.isMesh && o.geometry && o.geometry.attributes.position) src = o; });
    if (!src) throw new Error('mô hình không có lưới');
    const geo = src.geometry.clone(); geo.applyMatrix4(src.matrixWorld);
    if (!geo.attributes.color) throw new Error('mô hình không có màu đỉnh');           // thân đèn tô màu theo đỉnh: thiếu thì hoa trắng trơn, thà giữ đèn cũ
    if (!geo.attributes.normal) geo.computeVertexNormals();
    for (const name of Object.keys(geo.attributes)) if (name !== 'position' && name !== 'normal' && name !== 'color') geo.deleteAttribute(name);
    geo.computeBoundingBox();
    const b = geo.boundingBox, span = Math.max(b.max.x - b.min.x, b.max.z - b.min.z);
    if (!(span > 1e-6) || !isFinite(span)) throw new Error('mô hình rỗng');
    const k = CFG.span / span;
    geo.translate(0, -b.min.y, 0); geo.scale(k, k, k); geo.translate(0, CFG.y0, 0);     // trục hoa đã ở x = z = 0 trong file
    const p = geo.attributes.position; let bud = 0, tall = 0;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > tall) tall = y; if (Math.hypot(p.getX(i), p.getZ(i)) < CFG.span * 0.11 && y > bud) bud = y; }
    if (!(bud > 0)) bud = tall;
    geo.computeBoundingSphere(); geo.computeBoundingBox();
    S.tris = Math.round((geo.index ? geo.index.count : p.count) / 3);
    S.show = (on) => { // true: bông sen mô hình; false: đèn dựng bằng mã (để so sánh / gỡ lỗi)
      body.geometry = on ? geo : old.geo;
      mat.flatShading = on ? false : old.flat; mat.side = on ? THREE.DoubleSide : old.side; mat.needsUpdate = true; // cánh hoa mượt; vẽ hai mặt vì cánh mỏng sau khi giảm số mặt có chỗ chỉ còn một lớp
      TOP.flame = on ? bud + CFG.flame : old.flame; TOP.glow = on ? bud + CFG.glow : old.glow;
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
      else { S.state = 'failed'; console.warn('[hoa đăng] không tải được mô hình hoa sen — giữ đèn dựng bằng mã: ' + S.error); }
    }
  }

  const near2 = CFG.near * CFG.near;
  G.onUpdate((dt, t) => {
    now = t || 0;
    if (S.state !== 'idle' || now < S.next) return;
    const P = G.player; if (!P || !P.pos) return;
    const dx = P.pos.x - POND.x, dz = P.pos.z - POND.z;
    if (dx * dx + dz * dz > near2) return;
    const conn = navigator.connection;
    if (conn && conn.saveData) { S.state = 'skipped'; return; }                           // máy bật "tiết kiệm dữ liệu": giữ đèn dựng bằng mã
    load();
  }, 58);

  // ghi công tác giả (CC BY-NC 4.0) ở cuối bảng Cài đặt, khi bông sen mô hình đang hiện
  if (G.events && G.events.on) G.events.on('ui:settings', (box) => {
    if (!box || !box.appendChild || !S.credit) return;
    const p = U.el('p', 'muted small', S.credit.text + ' ');
    [['Xem mô hình gốc', S.credit.href], ['Giấy phép CC BY-NC 4.0', S.credit.licence]].forEach(([label, href], i) => {
      const a = U.el('a', null, label); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.style.cssText = 'color:inherit;display:inline-block;padding:13px 4px;margin:-13px -4px';
      if (i) p.append(' · ');
      p.append(a);
    });
    box.appendChild(p);
  });
}
