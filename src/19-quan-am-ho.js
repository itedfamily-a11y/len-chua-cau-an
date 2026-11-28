// =====================================================================
//  TƯỢNG QUAN ÂM TRÊN ĐẢO GIỮA HỒ SEN — MÔ HÌNH 3D ĐÃ LÀM NÉT (2026-11-28)
//  Chủ chùa muốn tượng Phật Bà trong hồ giống một pho tượng đá đứng trên Sketchfab; pho ấy không cho tải và không có giấy phép.
//  Chủ chùa tải mẫu thay thế "Tsz Shan Monastery - Guan Yin Statue" của Patrick Kin Yu YOUNG (patrick.young), giấy phép CC BY 4.0,
//  dữ liệu gốc của Chính quyền Đặc khu Hồng Kông: tượng Quan Âm áo trắng đứng, đầu trùm khăn, hai tay nâng bình. Chủ chùa: "hình mô hình này khá mờ,
//  bạn có thể dựa vào file tượng này rồi làm nét nó không".
//  Vì sao file gốc mờ, và đã làm gì (tests-local/quan-am-tools/qa-net.mjs, lệnh trong LENH-QUAN-AM-HO.md):
//    - tượng không có ảnh bề mặt, mỗi tam giác tô phẳng riêng (126 nghìn đỉnh cho 42 nghìn tam giác) → gộp đỉnh trùng, pháp tuyến mượt;
//    - nút cha dời tượng tới toạ độ lưới Hồng Kông (839 260 m), số thực 32 bit làm tròn mọi đỉnh về bội số 6,25 cm → đọc toạ độ địa phương còn nguyên độ chính xác;
//    - làm rõ nếp áo, nét mặt, bàn tay (đẩy nhẹ phần chi tiết theo pháp tuyến) và tô bóng khe nếp vào màu đỉnh (đá trắng; khe tối và ấm hơn, gờ sáng hơn);
//    - bỏ toà đế tròn dưới chân tượng; khung: y lên, mặt quay +z, đáy ở y = 0, tâm chân tượng ở x = z = 0, cao 1.
//    Hình khối vẫn là của file gốc (42 540 tam giác): không thêm được chi tiết mà bản gốc không có.
//  File trong game:  assets/mo-hinh/quan-am-ho.glb      42 540 mặt, 670 KB — máy tính;
//                    assets/mo-hinh/quan-am-ho-nhe.glb  16 000 mặt, 254 KB — máy cảm ứng, đồ hoạ thấp, và lần thử lại.
//  Tượng đặt lên bệ sen sẵn có trên đảo, cao đúng G.vuonSau.statue.h. Bản đầu (sáng 2026-11-28): tâm (0, −150), mặt bệ y 1,6, tượng 3,8 m.
//  Chiều 2026-11-28 chủ chùa: "tượng Phật bé quá" → 19-vuon-sau.js phóng bệ sen + tượng gấp 3: tâm (0, −156), mặt bệ y 2,6, tượng cao 9,0 m, quay mặt về +z.
//  Thân tượng dựng bằng mã (lưới 'vuonSau:tuong' của 19-vuon-sau.js: áo, đầu, hào quang, tay, bình) là bản dự phòng: ẩn khi mô hình hiện. Bệ sen, đảo đá giữ nguyên.
//  Tải khi người chơi vào trong 95 m quanh tượng; máy bật "tiết kiệm dữ liệu" thì không tải. Lỗi: giữ tượng dựng bằng mã, một dòng console.warn;
//  lỗi tải file thử lại một lần sau 45 giây (bằng bản nhẹ).
//  Trạng thái: G.quanAmHo = { state: 'idle' | 'loading' | 'ready' | 'failed' | 'skipped', url, error, tris, credit, show(bool) }.
//  Ghi công tác giả ở cuối bảng Cài đặt khi mô hình đang hiện.
// =====================================================================
function installQuanAmHo(G) {
  const { THREE, util: U } = G;
  const V = G.vuonSau;
  if (!V || !V.statue || !V.groups || !V.groups.near || !G.onUpdate) return;
  const near = V.groups.near, code = near.getObjectByName('vuonSau:tuong'), ST = V.statue;
  const low = !!G.isTouch || !!(G.quality && G.quality.low);
  const CFG = {
    url: 'assets/mo-hinh/quan-am-ho-nhe.glb', urlHi: 'assets/mo-hinh/quan-am-ho.glb',
    near: 95,              // m quanh tượng
    height: ST.h > 0 ? ST.h : 3.8, // m, gót chân → đỉnh khăn trùm: lấy theo G.vuonSau.statue.h (2026-11-28: 9,0 m trên bệ sen cao 2,6 m; gấu áo rộng 3,5 × 2,5 m, vừa mặt bệ bán kính 1,74 m)
    dy: -0.01,             // lún 1 cm vào mặt bệ sen cho kín mép gấu áo
    // Đá trắng hơi bóng: màu lấy từ màu đỉnh (đã có bóng khe nếp); specular nhẹ cho nếp áo bắt nắng; emissive trắng hơi lạnh nâng phần khuất nắng
    // (nắng chiều của game màu cam: không nâng thì tượng ngả nâu) và giữ tượng không chìm hẳn về đêm.
    specular: 0x2c2a26, shininess: 26, emissive: 0x22242a,
    retryAfter: 45,        // giây
  };
  const CREDIT = {
    text: 'Tượng Quan Âm trên đảo giữa hồ dựng từ mô hình 3D "Tsz Shan Monastery - Guan Yin Statue" của Patrick Kin Yu YOUNG trên Sketchfab (dữ liệu gốc của Chính quyền Đặc khu Hồng Kông), giấy phép CC BY 4.0, đã chỉnh sửa cho vừa trò chơi (bỏ toà đế, làm mịn bề mặt, làm rõ nếp áo, tô bóng khe nếp).',
    href: 'https://sketchfab.com/3d-models/tsz-shan-monastery-guan-yin-statue-b9d823667b1e4bfb9b68e124ba4e28d9',
    licence: 'https://creativecommons.org/licenses/by/4.0/', // CC BY 4.0: nêu tên tác giả, nguồn, giấy phép (kèm đường dẫn) và việc đã chỉnh sửa
  };
  const S = (G.quanAmHo = { state: 'idle', url: CFG.url, error: null, tris: 0, tries: 0, next: 0, credit: null, show: null });
  let Loader = null, now = 0;

  function place(gltf) {
    const root = gltf && (gltf.scene || (gltf.scenes && gltf.scenes[0]));
    if (!root) throw new Error('mô hình không có cảnh');
    root.updateMatrixWorld(true);
    const mat = new THREE.MeshPhongMaterial({ vertexColors: true, specular: CFG.specular, shininess: CFG.shininess, emissive: CFG.emissive });
    let tris = 0, coloured = 0;
    root.traverse((o) => {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
      if (o.geometry.attributes.color) coloured++;
      if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
      tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
      o.material = mat; o.castShadow = true; o.receiveShadow = true;
    });
    if (tris < 1) throw new Error('mô hình không có mặt nào');
    if (!coloured) throw new Error('mô hình không có màu đỉnh');                         // màu đá và bóng khe nếp nằm ở màu đỉnh: thiếu thì thà giữ tượng cũ
    // kích thước nằm ở nút (file lượng tử hoá): đo cả cảnh, không đo geometry
    const box = new THREE.Box3().setFromObject(root), size = box.getSize(new THREE.Vector3());
    if (!(size.y > 1e-6) || !isFinite(size.x + size.y + size.z)) throw new Error('mô hình rỗng');
    const hold = new THREE.Group(); hold.name = 'quanAmHo';
    root.position.y -= box.min.y;                                                          // tâm chân tượng đã ở x = z = 0 trong file
    hold.add(root); hold.scale.setScalar(CFG.height / size.y);
    hold.position.set(ST.x, ST.base + CFG.dy, ST.z); hold.rotation.y = ST.yaw || 0;
    near.add(hold); hold.updateMatrixWorld(true);
    S.tris = Math.round(tris);
    S.show = (on) => { // true: mô hình tải về; false: tượng dựng bằng mã (để so sánh / gỡ lỗi)
      hold.visible = !!on; if (code) code.visible = !on;
      S.credit = on ? CREDIT : null;
    };
    S.show(true);
    if (G.renderer && G.renderer.shadowMap) G.renderer.shadowMap.needsUpdate = true;       // bóng của tượng mới
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
      else { S.state = 'failed'; console.warn('[hồ sen] không tải được mô hình tượng Quan Âm — giữ tượng dựng bằng mã: ' + S.error); }
    }
  }

  const near2 = CFG.near * CFG.near;
  G.onUpdate((dt, t) => {
    now = t || 0;
    if (S.state !== 'idle' || now < S.next) return;
    const P = G.player; if (!P || !P.pos) return;
    const dx = P.pos.x - ST.x, dz = P.pos.z - ST.z;
    if (dx * dx + dz * dz > near2) return;
    const conn = navigator.connection;
    if (conn && conn.saveData) { S.state = 'skipped'; return; }                           // máy bật "tiết kiệm dữ liệu": giữ tượng dựng bằng mã
    load();
  }, 59);

  // ghi công tác giả (CC BY 4.0) ở cuối bảng Cài đặt, khi mô hình đang hiện
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
