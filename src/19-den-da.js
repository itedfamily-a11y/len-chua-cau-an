// =====================================================================
//  ĐÈN ĐÁ TRONG CHÙA — MÔ HÌNH 3D (2026-11-28)
//  Chủ chùa gửi file "Japanese stone lanterns" của patrakeevasveta trên Sketchfab, giấy phép CC BY 4.0, và bảo: "sửa đèn"; lúc đầu chỉ đèn vườn sau được thay,
//  rồi chủ chùa bảo: "tôi muốn file đèn sửa cho toàn bộ đèn của dự án chùa cầu an, chứ không phải chỉ mỗi khu vực hồ" → từ đêm 2026-11-28 thay MỌI đèn đá.
//  File gốc có 5 kiểu đèn đá dùng chung một bộ ảnh 4096 px. File trong game (lệnh dựng: tests-local/quan-am-tools/LENH-DEN-DA.md) giữ 3 kiểu,
//  mỗi kiểu một lưới có tên, tâm đáy ở gốc, kích thước thật (mét), ảnh màu + ảnh tự sáng (ô cửa đèn):
//    den4  đèn trụ mái vuông, cao 2,05 m        den5  đèn trụ tròn, cao 2,07 m        den3  đèn ba chân mái rộng (đèn ngắm tuyết), cao 1,64 m
//    assets/mo-hinh/den-da.glb      mỗi kiểu 1 400 mặt, ảnh 2048 px, 754 KB — máy tính;
//    assets/mo-hinh/den-da-nhe.glb  mỗi kiểu   700 mặt, ảnh 1024 px, 232 KB — máy cảm ứng, đồ hoạ thấp, và lần thử lại.
//  CÁCH LÀM (như cây mô hình, 13-cay-mo-hinh.js): nơi nào dựng đèn đá thì vẫn dựng đèn bằng mã như cũ nhưng vào lưới riêng, đưa lưới ấy vào G.denCu,
//  và ghi chỗ đứng từng đèn vào G.denDat = [{ x, y, z, h?, k? }]  (y: mặt nền dưới chân đèn; h: chiều cao muốn có, mặc định 2,25 m; k: 'den4' | 'den5' nếu muốn chỉ định kiểu).
//  Các nơi ghi: 05-world.js (3 đèn bên đông sân trước), 09-world2-geo.js (4 đèn hai đầu cầu, 2 đèn sân linh thú, 2 đèn tháp Báo Nghiêm, 3 đèn vườn tháp),
//  12-decor-inside.js (đèn quanh các hạng mục trong sân, tối đa 15), 19-tang-kinh-cac.js (đôi đèn hai bên bậc chính, h 2,0).
//  Đèn vườn sau (G.vuonSau.layout.lanterns: 18 chiếc dọc lối vòng quanh hồ, lối trục, lối từ cổng) module này tự đọc; lưới dựng bằng mã của chúng là
//  'vuonSau:denda' + hộp sáng 'vuonSau:denda-sang' (19-vuon-sau.js).
//  - Mô hình đặt ở ĐÚNG chỗ đèn cũ, phóng cho cao bằng đèn cũ (2,25 m; sân Tàng Kinh Các 2,0 m). Vật cản (bán kính 0,42) và quầng sáng đêm (cao 1,6 m) giữ nguyên.
//    Kiểu đèn: vườn sau den4 / den5 xen kẽ theo thứ tự; các nơi khác chọn theo chỗ đứng (|x|, |z|), nên hai đèn đối xứng qua trục chùa cùng một kiểu.
//  - Thêm hai đèn ba chân (den3) trên đảo giữa hồ, hai bên phía trước bệ sen của tượng Quan Âm (chỉ để ngắm, đảo không đi tới được).
//  - Ô cửa đèn tự sáng theo ảnh tự sáng của mô hình, mạnh dần về đêm.
//  - Đèn nằm trong lòng vườn sau (kể cả đèn tháp Báo Nghiêm, vườn tháp) vào nhóm "near" của vườn, ẩn cùng vườn khi máy quay còn ở phía trước chính điện; đèn khác nằm thẳng trong cảnh.
//  - KHÔNG đổi: đèn lồng treo dưới mái hiên, đèn trên bàn thờ, đèn hoa đăng (không phải đèn đá).
//  Tải sau khi game chạy 2,5 giây; máy bật "tiết kiệm dữ liệu" thì không tải. Lỗi: giữ đèn dựng bằng mã, một dòng console.warn;
//  lỗi tải file thử lại một lần sau 45 giây (bằng bản nhẹ).
//  Trạng thái: G.denDa = { state: 'idle' | 'loading' | 'ready' | 'failed' | 'skipped', url, error, tris, counts, credit, show(bool) }.
//  Ghi công tác giả ở cuối bảng Cài đặt khi mô hình đang hiện.
// =====================================================================
function installDenDa(G) {
  const { THREE, util: U, scene } = G;
  if (!scene || !G.onUpdate) return;
  const V = G.vuonSau || null;
  const near = (V && V.groups && V.groups.near) || null, far = (V && V.groups && V.groups.far) || null;
  const RECT = V && V.rect, ISL = V && V.island;
  const low = !!G.isTouch || !!(G.quality && G.quality.low);
  const CFG = {
    url: 'assets/mo-hinh/den-da-nhe.glb', urlHi: 'assets/mo-hinh/den-da.glb',
    start: 2.5,          // giây sau khi game chạy thì bắt đầu tải
    height: 2.25,        // m: chiều cao đèn (đèn dựng bằng mã cao khoảng 2,2 m)
    glowDay: 0.5, glowNight: 2.1, // độ sáng ô cửa đèn (nhân với ảnh tự sáng) ban ngày / về đêm
    retryAfter: 45,      // giây
  };
  const CREDIT = {
    text: 'Đèn đá trong chùa là mô hình 3D "Japanese stone lanterns" của patrakeevasveta trên Sketchfab, giấy phép CC BY 4.0, đã chỉnh sửa cho vừa trò chơi (lấy ba kiểu đèn, giảm số mặt, thu nhỏ ảnh bề mặt).',
    href: 'https://sketchfab.com/3d-models/japanese-stone-lanterns-bc153f0de79442289c449141834703c0',
    licence: 'https://creativecommons.org/licenses/by/4.0/', // CC BY 4.0: nêu tên tác giả, nguồn, giấy phép (kèm đường dẫn) và việc đã chỉnh sửa
  };
  const S = (G.denDa = { state: 'idle', url: CFG.url, error: null, tris: 0, tries: 0, next: CFG.start, counts: null, credit: null, show: null });
  let Loader = null, now = 0, mat = null;
  const inGarden = (x, z) => !!(near && RECT && x > RECT.x0 && x < RECT.x1 && z > RECT.z0 && z < RECT.z1);

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
    const GEO = { den4: part('den4'), den5: part('den5'), den3: part('den3') };
    const cao = (k) => GEO[k].boundingBox.max.y - GEO[k].boundingBox.min.y;
    if (!map || !map.image) throw new Error('mô hình không có ảnh bề mặt');                 // GLTFLoader nuốt lỗi giải mã ảnh: thà giữ đèn dựng bằng mã
    map.anisotropy = Math.min(4, G.renderer.capabilities.getMaxAnisotropy()); map.needsUpdate = true;
    mat = new THREE.MeshLambertMaterial({ map, side: THREE.DoubleSide });
    if (emap && emap.image) { mat.emissiveMap = emap; mat.emissive.setRGB(1, 0.86, 0.6); mat.emissiveIntensity = CFG.glowDay; } // ô cửa đèn sáng màu lửa ấm
    // ---------- chỗ đặt: mỗi (nhóm, kiểu) một danh sách ----------
    const B = {};                                                                           // 'v:den4' (trong vườn sau) / 's:den5' (ngoài vườn) … → [{ x, y, z, s, ry }]
    const them = (vuon, k, q) => { const key = (vuon ? 'v:' : 's:') + k; (B[key] || (B[key] = [])).push(q); };
    const r = U.rng ? U.rng(5511) : Math.random;
    if (V && V.layout && V.layout.lanterns) V.layout.lanterns.forEach((l, i) => { // đèn vườn sau: hai kiểu xen kẽ, quay mặt theo bội số 90° (đèn vuông bốn mặt như nhau)
      const k = i % 2 ? 'den5' : 'den4';
      them(!!near, k, { x: l.x, y: 0, z: l.z, s: CFG.height / cao(k), ry: ((r() * 4) | 0) * (Math.PI / 2) });
    });
    for (const d of G.denDat || []) { // đèn các khu khác: kiểu theo chỗ đứng (hai đèn đối xứng qua trục chùa cùng kiểu), hướng theo chỗ đứng
      if (!d || !isFinite(d.x) || !isFinite(d.z)) continue;
      const k = d.k === 'den4' || d.k === 'den5' ? d.k : ((Math.round(Math.abs(d.x) * 2) + Math.round(Math.abs(d.z) * 2)) & 1) ? 'den5' : 'den4';
      const q4 = ((Math.round(d.x * 7.3 + d.z * 3.1) % 4) + 4) % 4;
      them(inGarden(d.x, d.z), k, { x: d.x, y: d.y || 0, z: d.z, s: (d.h || CFG.height) / cao(k), ry: q4 * (Math.PI / 2) });
    }
    if (ISL && near) for (const sx of [-1, 1]) { // hai đèn ba chân trên đảo, chếch phía trước bệ sen (mặt tượng quay về +z)
      const a = (50 * Math.PI) / 180, d = Math.max(2.4, ISL.r - 1.2), frac = Math.min(0.98, d / (ISL.r - 0.3));
      them(true, 'den3', { x: ISL.x + sx * d * Math.sin(a), y: 0.9 + 0.3 * Math.sqrt(1 - frac * frac) - 0.06, z: ISL.z + d * Math.cos(a), s: 0.85, ry: sx * a });
    }
    const grpV = new THREE.Group(), grpS = new THREE.Group(); grpV.name = 'denDa:vuon'; grpS.name = 'denDa:ngoai';
    const dummy = new THREE.Object3D();
    S.tris = 0; S.counts = { den4: 0, den5: 0, den3: 0 };
    for (const key of Object.keys(B)) {
      const list = B[key], vuon = key[0] === 'v', k = key.slice(2), geo = GEO[k];
      const im = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((q, i) => { dummy.position.set(q.x, q.y, q.z); dummy.rotation.set(0, q.ry, 0); dummy.scale.setScalar(q.s); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); });
      im.instanceMatrix.needsUpdate = true; im.castShadow = true; im.receiveShadow = true; im.matrixAutoUpdate = false; im.name = 'denDa:' + key;
      (vuon ? grpV : grpS).add(im);
      S.counts[k] += list.length;
      S.tris += list.length * ((geo.index ? geo.index.count : geo.attributes.position.count) / 3);
    }
    S.tris = Math.round(S.tris);
    if (near) near.add(grpV);
    scene.add(grpS);
    // đèn dựng bằng mã: lưới của các nơi dựng (G.denCu) + hai lưới của vườn sau
    const CU = (G.denCu || []).slice();
    for (const m of [near && near.getObjectByName('vuonSau:denda'), far && far.getObjectByName('vuonSau:denda-sang')]) if (m && CU.indexOf(m) < 0) CU.push(m);
    S.show = (on) => { // true: đèn mô hình; false: đèn dựng bằng mã (để so sánh / gỡ lỗi)
      grpV.visible = grpS.visible = !!on;
      for (const m of CU) m.visible = !on;
      S.credit = on ? CREDIT : null;
      if (G.renderer && G.renderer.shadowMap) G.renderer.shadowMap.needsUpdate = true;
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
      else { S.state = 'failed'; console.warn('[đèn đá] không tải được mô hình đèn đá — giữ đèn dựng bằng mã: ' + S.error); }
    }
  }

  G.onUpdate((dt, t) => {
    now = t || 0;
    if (mat && mat.emissiveMap) mat.emissiveIntensity = CFG.glowDay + ((G.tod && G.tod.night) || 0) * (CFG.glowNight - CFG.glowDay);
    if (S.state !== 'idle' || now < S.next) return;
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
