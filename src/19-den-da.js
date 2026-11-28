// =====================================================================
//  ĐÈN ĐÁ VƯỜN SAU — MÔ HÌNH 3D (2026-11-28)
//  Chủ chùa gửi file "Japanese stone lanterns" của patrakeevasveta trên Sketchfab, giấy phép CC BY 4.0, và bảo: "sửa đèn".
//  File gốc có 5 kiểu đèn đá dùng chung một bộ ảnh 4096 px. File trong game (lệnh dựng: tests-local/quan-am-tools/LENH-DEN-DA.md) giữ 3 kiểu,
//  mỗi kiểu một lưới có tên, tâm đáy ở gốc, kích thước thật (mét), ảnh màu + ảnh tự sáng (ô cửa đèn):
//    den4  đèn trụ mái vuông, cao 2,05 m        den5  đèn trụ tròn, cao 2,07 m        den3  đèn ba chân mái rộng (đèn ngắm tuyết), cao 1,64 m
//    assets/mo-hinh/den-da.glb      mỗi kiểu 1 400 mặt, ảnh 2048 px, 754 KB — máy tính;
//    assets/mo-hinh/den-da-nhe.glb  mỗi kiểu   700 mặt, ảnh 1024 px, 232 KB — máy cảm ứng, đồ hoạ thấp, và lần thử lại.
//  - Thay các đèn đá dựng bằng mã của vườn sau (G.vuonSau.layout.lanterns: 18 chiếc dọc lối vòng quanh hồ, lối trục, lối từ cổng) ở ĐÚNG chỗ cũ:
//    den4 và den5 xen kẽ, phóng cho cao 2,25 m như đèn cũ; vật cản (bán kính 0,42) và quầng sáng đêm (y 1,6) giữ nguyên.
//  - Thêm hai đèn ba chân (den3) trên đảo, hai bên phía trước bệ sen của tượng Quan Âm (chỉ để ngắm, đảo không đi tới được).
//  - Ô cửa đèn tự sáng theo ảnh tự sáng của mô hình, mạnh dần về đêm.
//  - Đèn dựng bằng mã (lưới 'vuonSau:denda' + hộp sáng 'vuonSau:denda-sang' của 19-vuon-sau.js) là bản dự phòng: ẩn khi mô hình hiện.
//    Đèn đá ở các khu khác (sân trước, khu mở rộng) không đổi.
//  Tải khi người chơi vào trong 95 m quanh hồ; máy bật "tiết kiệm dữ liệu" thì không tải. Lỗi: giữ đèn dựng bằng mã, một dòng console.warn;
//  lỗi tải file thử lại một lần sau 45 giây (bằng bản nhẹ).
//  Trạng thái: G.denDa = { state: 'idle' | 'loading' | 'ready' | 'failed' | 'skipped', url, error, tris, counts, credit, show(bool) }.
//  Ghi công tác giả ở cuối bảng Cài đặt khi mô hình đang hiện.
// =====================================================================
function installDenDa(G) {
  const { THREE, util: U } = G;
  const V = G.vuonSau;
  if (!V || !V.layout || !V.layout.lanterns || !V.groups || !V.groups.near || !G.onUpdate) return;
  const near = V.groups.near, codeA = near.getObjectByName('vuonSau:denda'), codeB = V.groups.far && V.groups.far.getObjectByName('vuonSau:denda-sang');
  const POND = V.pond, CX = (POND.x0 + POND.x1) / 2, CZ = (POND.z0 + POND.z1) / 2, ISL = V.island;
  const low = !!G.isTouch || !!(G.quality && G.quality.low);
  const CFG = {
    url: 'assets/mo-hinh/den-da-nhe.glb', urlHi: 'assets/mo-hinh/den-da.glb',
    near: 95,            // m quanh hồ
    height: 2.25,        // m: chiều cao đèn dọc lối đi (đèn dựng bằng mã cao khoảng 2,2 m)
    glowDay: 0.5, glowNight: 2.1, // độ sáng ô cửa đèn (nhân với ảnh tự sáng) ban ngày / về đêm
    retryAfter: 45,      // giây
  };
  const CREDIT = {
    text: 'Đèn đá trong vườn sau là mô hình 3D "Japanese stone lanterns" của patrakeevasveta trên Sketchfab, giấy phép CC BY 4.0, đã chỉnh sửa cho vừa trò chơi (lấy ba kiểu đèn, giảm số mặt, thu nhỏ ảnh bề mặt).',
    href: 'https://sketchfab.com/3d-models/japanese-stone-lanterns-bc153f0de79442289c449141834703c0',
    licence: 'https://creativecommons.org/licenses/by/4.0/', // CC BY 4.0: nêu tên tác giả, nguồn, giấy phép (kèm đường dẫn) và việc đã chỉnh sửa
  };
  const S = (G.denDa = { state: 'idle', url: CFG.url, error: null, tris: 0, tries: 0, next: 0, counts: null, credit: null, show: null });
  let Loader = null, now = 0, mat = null;

  function place(gltf) {
    const root = gltf && (gltf.scene || (gltf.scenes && gltf.scenes[0]));
    if (!root) throw new Error('mô hình không có cảnh');
    root.updateMatrixWorld(true);
    let map = null, emap = null;
    const part = (name) => {
      const o = root.getObjectByName(name);
      if (!o || !o.isMesh || !o.geometry || !o.geometry.attributes.position || !o.geometry.attributes.uv) throw new Error('mô hình thiếu lưới "' + name + '"');
      if (o.material && o.material.map) { map = o.material.map; emap = o.material.emissiveMap || emap; }
      const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
      if (!g.attributes.normal) g.computeVertexNormals();
      g.computeBoundingBox(); g.computeBoundingSphere();
      return g;
    };
    const g4 = part('den4'), g5 = part('den5'), g3 = part('den3');
    if (!map || !map.image) throw new Error('mô hình không có ảnh bề mặt');                 // GLTFLoader nuốt lỗi giải mã ảnh: thà giữ đèn dựng bằng mã
    map.anisotropy = Math.min(4, G.renderer.capabilities.getMaxAnisotropy()); map.needsUpdate = true;
    mat = new THREE.MeshLambertMaterial({ map, side: THREE.DoubleSide });
    if (emap && emap.image) { mat.emissiveMap = emap; mat.emissive.setRGB(1, 0.86, 0.6); mat.emissiveIntensity = CFG.glowDay; } // ô cửa đèn sáng màu lửa ấm
    // ---------- chỗ đặt ----------
    const r = U.rng ? U.rng(5511) : Math.random, L4 = [], L5 = [], L3 = [];
    V.layout.lanterns.forEach((l, i) => { // đèn dọc lối đi: hai kiểu xen kẽ, quay mặt theo bội số 90° (đèn vuông bốn mặt như nhau)
      const g = i % 2 ? g5 : g4, k = CFG.height / (g.boundingBox.max.y - g.boundingBox.min.y);
      (i % 2 ? L5 : L4).push({ x: l.x, y: 0, z: l.z, s: k, ry: ((r() * 4) | 0) * (Math.PI / 2) });
    });
    if (ISL) for (const sx of [-1, 1]) { // hai đèn ba chân trên đảo, chếch phía trước bệ sen (mặt tượng quay về +z)
      const a = (50 * Math.PI) / 180, d = Math.max(2.4, ISL.r - 1.2), frac = Math.min(0.98, d / (ISL.r - 0.3));
      L3.push({ x: ISL.x + sx * d * Math.sin(a), y: 0.9 + 0.3 * Math.sqrt(1 - frac * frac) - 0.06, z: ISL.z + d * Math.cos(a), s: 0.85, ry: sx * a });
    }
    const grp = new THREE.Group(); grp.name = 'denDa';
    const dummy = new THREE.Object3D();
    const batch = (name, geo, list) => {
      if (!list.length) return 0;
      const im = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((q, i) => { dummy.position.set(q.x, q.y, q.z); dummy.rotation.set(0, q.ry, 0); dummy.scale.setScalar(q.s); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); });
      im.instanceMatrix.needsUpdate = true; im.castShadow = true; im.receiveShadow = true; im.matrixAutoUpdate = false; im.name = 'denDa:' + name;
      grp.add(im);
      return list.length * ((geo.index ? geo.index.count : geo.attributes.position.count) / 3);
    };
    S.tris = Math.round(batch('den4', g4, L4) + batch('den5', g5, L5) + batch('den3', g3, L3));
    S.counts = { den4: L4.length, den5: L5.length, den3: L3.length };
    near.add(grp);
    S.show = (on) => { // true: đèn mô hình; false: đèn dựng bằng mã (để so sánh / gỡ lỗi)
      grp.visible = !!on; if (codeA) codeA.visible = !on; if (codeB) codeB.visible = !on;
      S.credit = on ? CREDIT : null;
    };
    S.show(true);
    if (G.renderer && G.renderer.shadowMap) G.renderer.shadowMap.needsUpdate = true;
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
      else { S.state = 'failed'; console.warn('[vườn sau] không tải được mô hình đèn đá — giữ đèn dựng bằng mã: ' + S.error); }
    }
  }

  const near2 = CFG.near * CFG.near;
  G.onUpdate((dt, t) => {
    now = t || 0;
    if (mat && mat.emissiveMap) mat.emissiveIntensity = CFG.glowDay + ((G.tod && G.tod.night) || 0) * (CFG.glowNight - CFG.glowDay);
    if (S.state !== 'idle' || now < S.next) return;
    const P = G.player; if (!P || !P.pos) return;
    const dx = P.pos.x - CX, dz = P.pos.z - CZ;
    if (dx * dx + dz * dz > near2) return;
    const conn = navigator.connection;
    if (conn && conn.saveData) { S.state = 'skipped'; return; }                           // máy bật "tiết kiệm dữ liệu": giữ đèn dựng bằng mã
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
