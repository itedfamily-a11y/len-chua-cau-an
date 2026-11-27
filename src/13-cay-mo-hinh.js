// =====================================================================
//  CÂY MÔ HÌNH 3D: SỒI VÀ THÔNG (2026-11-27)
//  Chủ chùa gửi hai file mô hình và dặn "Sửa các loại cây trong giao diện bằng các loại cây sau":
//    - "Oak trees pack (17var, LODs, seasons, gameready)" của LOLIPOP trên Sketchfab, giấy phép CC BY 4.0  → assets/mo-hinh/cay-soi.glb
//    - "Pine Forest at Sunset" của Jagobo trên Sketchfab, giấy phép CC BY 4.0                              → assets/mo-hinh/cay-thong.glb
//  Hai file trong game đã được chọn lọc và làm nhẹ (tests-local/cay-tools/chuyen.mjs; lệnh ở LENH-CAY.md cùng thư mục): 9 dáng sồi, 5 dáng thông,
//  mỗi dáng ba mức chi tiết: g = gần, x = xa, b = rất xa (sồi: tấm phẳng chéo; thông: thân + vài chục tấm lá). Mỗi cây gốc ở (0,0,0), y hướng lên, đơn vị mét.
//  Tên dáng, chiều cao, bề rộng tán, trục thân nằm trong extras của từng nút (userData) — module này đọc từ file, không chép tay.
//
//  CÁCH LÀM: các nơi dựng cây (05, 09, 12, 13, 19-vuon-sau, 19-tang-kinh-cac) vẫn dựng cây bằng mã như cũ, nhưng vào lưới riêng (G.cayCu)
//  và ghi chỗ đứng từng cây vào G.cayDat = [{ k, x, y, z, s, seed, near?, nhom?, ua?, cols?, low? }]. Module này tải hai file sau khi game chạy,
//  đặt mỗi dáng cây thành các THREE.InstancedMesh (một lượt vẽ cho mọi cây cùng dáng, cùng mức), rồi ẩn các lưới cây cũ.
//  Lỗi ở bất kỳ bước nào (không có mạng, thiếu file, máy bật "tiết kiệm dữ liệu"): giữ cây dựng bằng mã, ghi một dòng console.warn.
//
//  LOẠI CÂY CŨ (k) → CÂY MỚI (hàm chon bên dưới):
//    tron    cây tán tròn ngoài tường và hai góc sân trước (05)      → sồi vừa / nhỏ, khoảng 3 trong 10 cây là thông
//    vom     cây tán vòm của cảnh vật (13)                           → sồi vừa / to, khoảng 2 trong 10 cây là thông
//    du      cây tán dù thân cao (13; trừ hai cây phượng đỏ)         → thông cao
//    da      cây đa cổ thụ đầu lối vào (13)                          → sồi cổ thụ gốc bạnh; dải lụa đỏ quấn lại quanh thân mới
//    bode    cây bồ đề treo dải lụa ở vườn sau (19)                  → sồi tán rộng đã tỉa cành thấp; 6 cành thấp buộc dải lụa giữ nguyên, nối vào thân mới
//    bodenho cây bồ đề nhỏ trong bồn đá ở sân trước (12)             → sồi nhỏ
//    tung    tùng ở sân và ở vườn (09, 19)                           → thông
//    chau    cây trong chậu cảnh (05, 09, 19)                        → thông con (dáng đầy từ gốc), thu nhỏ còn khoảng 1 m
//    tkc     chín cây tán tròn ở sân Tàng Kinh Các (19)              → sồi vừa / nhỏ
//  KHÔNG đổi (hai file chỉ có sồi và thông): cau, dừa, chuối, tre / trúc, hoa đại, mai, quất, phượng đỏ, bụi hoa giấy, cây con trên non bộ.
//
//  MỨC CHI TIẾT theo khoảng cách từ máy quay tới từng cây (khuôn viên dài 270 m nên phải đổi lúc chạy): xét lại mỗi khi máy quay đi được CFG.buoc mét,
//  có khoảng trễ CFG.tre để cây ở sát ngưỡng không nhấp nháy. Máy tính: < CFG.gan (thông: CFG.ganThong) → g; < CFG.xa → x; xa hơn → b (cây trong chậu: CFG.chauGan / CFG.chau).
//  Máy cảm ứng / máy yếu tải hai file "-nhe" (không có mức g, ảnh lá nhỏ hơn): < CFG.xaNhe → x; xa hơn → b.
//  Trạng thái: G.world.cayMoHinh = { state: 'idle' | 'loading' | 'ready' | 'failed' | 'skipped', error, urls, small, count, tris, calls, lv, show(bool), credit }.
// =====================================================================
function installCayMoHinh(G) {
  const { THREE, util: U, world: W, scene } = G;
  const DAT = G.cayDat, CU = G.cayCu || [];
  if (!DAT || !DAT.length || !G.onUpdate || !W) return;
  const TAU = Math.PI * 2;

  const CFG = {
    soi: 'assets/mo-hinh/cay-soi.glb', soiNhe: 'assets/mo-hinh/cay-soi-nhe.glb',          // 1,8 MB / 0,9 MB
    thong: 'assets/mo-hinh/cay-thong.glb', thongNhe: 'assets/mo-hinh/cay-thong-nhe.glb',  // 0,8 MB / 0,3 MB
    start: 1.5,            // giây sau khi game chạy thì bắt đầu tải
    retryAfter: 45,        // giây; lần thử lại dùng bản nhẹ
    gan: 42, ganThong: 30, // m từ máy quay: gần hơn thì dùng mức g (thông nhiều mặt hơn sồi nên ngưỡng ngắn hơn)
    xa: 100,               // gần hơn thì dùng mức x, xa hơn dùng mức b
    xaNhe: 46,             // bản nhẹ (không có mức g)
    chauGan: 13, chau: 34, // cây trong chậu (cao 1 m): gần hơn 13 m dùng mức g, gần hơn 34 m dùng mức x, xa hơn dùng mức b
    tre: 3, buoc: 3,       // m: khoảng trễ quanh ngưỡng; máy quay đi được chừng này thì xét lại
    thongTron: 0.3, thongVom: 0.2, // phần cây tán tròn / tán vòm đổi thành thông (còn lại là sồi)
    // hệ số nhân màu ảnh (không có ánh xạ tông màu; đèn trời + nắng khá mạnh): lá của hai gói khá tối so với màu lá vẽ bằng mã nên nâng lên
    mau: { 'vo-soi': [1.2, 1.15, 1.1], 'la-soi': [1.45, 1.55, 1.3], 'tam-soi': [0.95, 1.0, 0.88], 'vo-thong': [1.15, 1.1, 1.05], 'la-thong': [1.3, 1.4, 1.2] },
    cat: { 'la-soi': 0.38, 'la-thong': 0.3, 'tam-soi': 0.45 }, // ngưỡng cắt alpha của lá
  };
  const CREDIT = [
    { text: 'Cây sồi trong cảnh là mô hình 3D "Oak trees pack (17var, LODs, seasons, gameready)" của LOLIPOP trên Sketchfab, giấy phép CC BY 4.0, đã chỉnh sửa cho vừa trò chơi (chọn 9 dáng cây từ 8 cây của gói, lược bớt mức chi tiết, tỉa cụm lá thấp ở hai dáng, chỉnh pháp tuyến lá, thu nhỏ ảnh bề mặt).', href: 'https://sketchfab.com/3d-models/oak-trees-pack-17var-lods-seasons-gameready-a5e4e64f9f1d4089bdcc6170a9333393', licence: 'https://creativecommons.org/licenses/by/4.0/' },
    { text: 'Cây thông trong cảnh là mô hình 3D "Pine Forest at Sunset" của Jagobo trên Sketchfab, giấy phép CC BY 4.0, đã chỉnh sửa cho vừa trò chơi (tách 5 cây khỏi cảnh rừng, bỏ nhánh nhỏ, giảm số mặt và số cụm lá, chỉnh pháp tuyến lá, thu nhỏ ảnh bề mặt).', href: 'https://sketchfab.com/3d-models/pine-forest-at-sunset-bef89be6b189456095db79107045d726', licence: 'https://creativecommons.org/licenses/by/4.0/' },
  ];
  const S = (W.cayMoHinh = { state: 'idle', urls: [], small: false, error: null, tris: 0, calls: 0, count: 0, lv: null, tries: 0, next: CFG.start, show: null, lod: null, credit: null, shown: false, cfg: CFG });

  // ---------- chọn dáng cây cho từng chỗ đứng (tất định theo seed: không dùng bộ số ngẫu nhiên chung của cảnh vật) ----------
  const hsh = (n) => { let x = (n | 0) ^ 0x9e3779b9; x = Math.imul(x ^ (x >>> 16), 0x85ebca6b); x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
  const lay = (a, r) => a[Math.min(a.length - 1, (r * a.length) | 0)];
  // trả về [loại, dáng, chiều cao mong muốn (m)]
  function chon(t) {
    const sd = t.seed | 0, a = hsh(sd * 3 + 1), b = hsh(sd * 7 + 5), s = t.s || 1;
    switch (t.k) {
      case 'tron': {
        if (t.ua === 'soi') return ['soi', 'vua1', 7.6 * s];                         // cây trong sân (người đi dưới tán): dáng có thân trống cao nhất, tán bắt đầu từ khoảng 2 m
        if (a < CFG.thongTron) return ['thong', lay(['thong3', 'thong4', 'thong2'], b), 7.4 * s];
        const d = lay(['vua1', 'vua2', 'vua3', 'vua1', 'vua2', 'nho1', 'nho2'], b); return ['soi', d, (d[0] === 'n' ? 5.2 : 6.2) * s];
      }
      case 'vom': {
        if (a < CFG.thongVom) return ['thong', lay(['thong1', 'thong2', 'thong3'], b), 7.6 * s];
        const d = lay(s >= 1.35 ? ['to1', 'to3', 'vua3', 'vua2'] : ['vua1', 'vua2', 'vua3', 'nho1'], b); return ['soi', d, (d[0] === 't' ? 6.6 : d[0] === 'n' ? 5.4 : 6.3) * s];
      }
      case 'du': return ['thong', lay(['thong1', 'thong2', 'thong3'], b), 8.2 * s];
      case 'da': return ['soi', 'da', 12.5];
      case 'bode': return ['soi', 'bode', 13.2];
      case 'bodenho': return ['soi', lay(['nho1', 'nho2'], b), 4.6];
      case 'tung': return ['thong', lay(s >= 1.3 ? ['thong3', 'thong4'] : ['thong6', 'thong4'], b), 4.9 * s];
      case 'chau': return ['thong', 'thong6', (1.05 + 0.2 * b) * s, 1.35];             // số thứ tư: nới bề ngang cho tán đầy như cây thế
      case 'tkc': return ['soi', 'vua1', (6.9 + 0.8 * b) * s];                       // sân đi bộ được: như cây góc sân trước
    }
    return null;
  }

  let Loader = null, Decoder = null, now = 0;
  const lowSaved = () => { const a = Date.now() - ((G.save && G.save.data && +G.save.data.lowQ) || 0); return a >= 0 && a < 7 * 864e5; };
  const nhe = () => !!G.isTouch || lowSaved() || !!(G.quality && G.quality.low);

  // ---------- đặt cây: gltf sồi + gltf thông → các InstancedMesh ----------
  function place(gs, small) {
    // 1. mục lục: idx[loai][dang] = { u (extras), g: { than, la }, x: { … }, b: { bang } | { than, la } }
    const idx = { soi: {}, thong: {} }, mats = new Map();
    const aniso = Math.min(4, G.renderer.capabilities.getMaxAnisotropy());
    for (const g of gs) {
      const root = g && (g.scene || (g.scenes && g.scenes[0])); if (!root) throw new Error('mô hình không có cảnh');
      root.updateMatrixWorld(true);
      root.traverse((o) => {
        if (!o.isMesh || !o.geometry || !o.geometry.index) return;
        const u = o.userData || {}; if (!idx[u.loai] || !u.dang || !u.muc || !u.phan || !(u.cao > 0)) return;
        const D = idx[u.loai][u.dang] || (idx[u.loai][u.dang] = { u }), L = D[u.muc] || (D[u.muc] = {});
        L[u.phan] = o;
        const src = o.material, name = (src && src.name) || 'khac';
        if (!mats.has(name)) {
          if (!src || !src.map || !src.map.image) throw new Error('mô hình cây thiếu ảnh bề mặt: ' + name); // GLTFLoader nuốt lỗi giải mã ảnh
          src.map.anisotropy = aniso; src.map.needsUpdate = true;
          const cut = CFG.cat[name] != null ? CFG.cat[name] : src.alphaTest || 0, k = CFG.mau[name] || [1, 1, 1];
          const m = new THREE.MeshLambertMaterial({ map: src.map, alphaTest: cut, side: src.side === THREE.DoubleSide ? THREE.DoubleSide : THREE.FrontSide });
          m.color.setRGB(k[0], k[1], k[2]); m.name = 'cay:' + name; mats.set(name, m);
          // lá (hai mặt): pháp tuyến trong file đã "phồng" theo khối tán; không lật pháp tuyến ở mặt sau để hai mặt tấm lá sáng như nhau, tán bắt sáng thành khối thay vì lốm đốm tối
          if (m.side === THREE.DoubleSide) m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n\tnormal = normalize( vNormal );'); };
        }
      });
    }
    if (!Object.keys(idx.soi).length || !Object.keys(idx.thong).length) throw new Error('file mô hình cây không có dáng cây nào');

    // 2. xếp từng chỗ đứng vào ro (loại, dáng, nhóm ẩn hiện); mỗi ro có một InstancedMesh cho từng mức × từng phần, đủ chỗ cho mọi cây của ro
    const ro = new Map(), special = [];
    const P = new THREE.Vector3(), Q = new THREE.Quaternion(), SC = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), M = new THREE.Matrix4();
    let count = 0;
    for (const t of DAT) {
      const c = chon(t); if (!c) continue;
      const D = idx[c[0]][c[1]]; if (!D) throw new Error('file mô hình thiếu dáng cây ' + c[1]); // mọi dáng trong hàm chon phải có trong cả hai cỡ file
      const sc = c[2] / D.u.cao, yaw = hsh((t.seed | 0) * 13 + 11) * TAU;
      P.set(t.x, t.y, t.z); Q.setFromAxisAngle(UP, yaw); SC.set(sc * (c[3] || 1), sc, sc * (c[3] || 1));
      const key = c[0] + '|' + c[1] + '|' + (t.nhom || '');
      let B = ro.get(key); if (!B) ro.set(key, B = { key, D, nhom: t.nhom || '', list: [], im: {}, dirty: true });
      const tr = { m: new THREE.Matrix4().compose(P, Q, SC), x: t.x, y: t.y + c[2] * 0.5, z: t.z, lv: '', chau: t.k === 'chau', thong: c[0] === 'thong' };
      B.list.push(tr);
      t.dat = { loai: c[0], dang: c[1], cao: c[2], sc, yaw };                         // ghi lại để tra cứu / thử nghiệm
      if (t.k === 'da' || t.k === 'bode') special.push({ t, u: D.u, sc, m: tr.m });
      count++;
    }
    if (!count) throw new Error('không đặt được cây nào');
    const hold = new THREE.Group(); hold.name = 'cay:mo-hinh';
    const vuon = new THREE.Group(); vuon.name = 'cay:mo-hinh-vuon';
    const all = [];
    for (const B of ro.values()) for (const lv of ['g', 'x', 'b']) {
      const L = B.D[lv]; if (!L) continue;
      B.im[lv] = [];
      for (const phan of Object.keys(L)) {
        const src = L[phan], mat = mats.get((src.material && src.material.name) || 'khac'); if (!mat) continue;
        const im = new THREE.InstancedMesh(src.geometry, mat, B.list.length);
        im.count = 0; im.visible = false; im.matrixAutoUpdate = false; im.name = 'cay:' + B.key + ':' + lv + ':' + phan;
        im.castShadow = lv !== 'b'; im.receiveShadow = phan === 'than';
        im.userData.goc = src.matrixWorld; im.userData.tam = src.geometry.index.count / 3;
        (B.nhom === 'vuon' ? vuon : hold).add(im); B.im[lv].push(im); all.push(im);
      }
    }

    // 3. mức chi tiết theo khoảng cách tới máy quay
    let lx = 1e9, ly = 0, lz = 0;
    const cp = G.camera.position;
    S.lod = (force, at) => { // at: vị trí khác máy quay chính (máy quay chụp ảnh chia sẻ)
      const p = at || cp;
      if (!force && Math.abs(p.x - lx) + Math.abs(p.y - ly) + Math.abs(p.z - lz) < CFG.buoc) return;
      lx = p.x; ly = p.y; lz = p.z;
      const h = CFG.tre;
      let any = false;
      for (const B of ro.values()) {
        for (const tr of B.list) {
          const d = Math.hypot(tr.x - p.x, tr.y - p.y, tr.z - p.z);
          const R1 = small ? 0 : tr.chau ? CFG.chauGan : tr.thong ? CFG.ganThong : CFG.gan, R2 = tr.chau ? CFG.chau : small ? CFG.xaNhe : CFG.xa;
          let lv = R1 && d < R1 + (tr.lv === 'g' ? h : -h) ? 'g' : d < R2 + (tr.lv === 'b' ? -h : h) ? 'x' : 'b';
          if (!B.im[lv]) lv = lv === 'g' ? (B.im.x ? 'x' : 'b') : lv === 'b' ? (B.im.x ? 'x' : 'g') : (B.im.g ? 'g' : 'b'); // mức không có trong file: lấy mức kề
          if (lv !== tr.lv) { tr.lv = lv; B.dirty = true; }
        }
        if (!B.dirty) continue;
        B.dirty = false; any = true;
        for (const lv of Object.keys(B.im)) {
          const ims = B.im[lv]; let n = 0;
          for (const tr of B.list) { if (tr.lv !== lv) continue; for (const im of ims) { M.multiplyMatrices(tr.m, im.userData.goc); im.setMatrixAt(n, M); } n++; }
          for (const im of ims) { im.count = n; im.visible = n > 0; if (n) { im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); } }
        }
      }
      if (any) { let tris = 0, calls = 0; const lv = { g: 0, x: 0, b: 0 }; for (const im of all) if (im.visible) { tris += im.userData.tam * im.count; calls++; } for (const B of ro.values()) for (const tr of B.list) lv[tr.lv]++; S.tris = Math.round(tris); S.calls = calls + extraCalls; S.lv = lv; }
    };

    // 4. phần riêng của cây đa và cây bồ đề (dựng bằng mã, đi cùng mô hình)
    const C = (G.build && G.build.C) || {}, extra = U.batch(), extraV = U.batch();
    let extraCalls = 0;
    const axis = (sp, yW) => { // tâm thân (thế giới) và bán kính thân ở độ cao thế giới yW, nội suy theo trục thân ghi trong file
      const tr = sp.u.truc || [], h = (yW - sp.t.y) / sp.sc; let a = tr[0] || [0, 0, 0, 0.3], b = a;
      for (let i = 0; i < tr.length; i++) { if (tr[i][0] <= h) a = tr[i]; b = tr[i]; if (tr[i][0] >= h) break; }
      const f = b[0] > a[0] ? U.clamp((h - a[0]) / (b[0] - a[0]), 0, 1) : 0, cx = a[1] + (b[1] - a[1]) * f, cz = a[2] + (b[2] - a[2]) * f, r = a[3] + (b[3] - a[3]) * f;
      const p = new THREE.Vector3(cx, h, cz).applyMatrix4(sp.m); return { x: p.x, y: yW, z: p.z, r: r * sp.sc };
    };
    const cols = [];
    for (const sp of special) {
      if (sp.t.k === 'da') { // dải lụa đỏ quấn gốc + sáu dải lụa nhỏ, ôm theo thân mới
        const y0 = sp.t.y + 0.1, band = axis(sp, y0 + 1.15), rb = axis(sp, y0 + 0.72); // thân mô hình chẻ nhánh từ khoảng 1,5 m: dải lụa quấn ở đoạn thân còn là một cột, sáu dải nhỏ rủ xuống dưới dải quấn (cây dựng bằng mã quấn ở 1,85 m, dải nhỏ ở 3 m)
        extra.add(new THREE.CylinderGeometry(band.r + 0.05, band.r + 0.08, 0.3, 14, 1, true), 0xb8281f, { p: [band.x, band.y, band.z], j: 0.02 });
        for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.2, rr = Math.max(rb.r, band.r) + 0.1; extra.add(G.build.BOX, 0xc8302a, { p: [rb.x + Math.cos(a) * rr, rb.y, rb.z + Math.sin(a) * rr], s: [0.09, 0.56, 0.02], r: [0, Math.PI / 2 - a, 0] }); }
        if (sp.t.cols) cols.push(...sp.t.cols);
      } else if (sp.t.low && G.build && G.build.branch) { // nối gốc 6 cành thấp buộc dải lụa vào thân mới
        for (const A0 of sp.t.low) { const c = axis(sp, A0[1] - 0.22); G.build.branch(extraV, [c.x, c.y, c.z], A0, 0.2, 0.2, C.bark || 0x6b5240, 6); }
      }
    }
    if (extra.list.length) { const m = extra.mesh(G.mats.vcDouble, { cast: true, receive: true }); m.name = 'cay:dai-lua'; hold.add(m); extraCalls++; }
    if (extraV.list.length) { const m = extraV.mesh(G.mats.vc, { cast: true, receive: true }); m.name = 'cay:noi-canh'; vuon.add(m); extraCalls++; }

    // 5. đưa vào cảnh, ẩn cây cũ
    S.lod(true);
    scene.add(hold);
    const gNear = G.vuonSau && G.vuonSau.groups && G.vuonSau.groups.near;
    (gNear || scene).add(vuon);                                                     // cây trong vườn ẩn hiện theo nhóm "near" của vườn (19-vuon-sau.js 'ẩn khi xa')
    hold.updateMatrixWorld(true); vuon.updateMatrixWorld(true);
    S.show = (on) => {
      on = !!on; hold.visible = on; vuon.visible = on;
      for (const m of CU) m.visible = !on;
      for (const c of cols) { const L = G.collide.list, i = L.indexOf(c); if (on && i >= 0) L.splice(i, 1); else if (!on && i < 0) L.push(c); } // ba rễ chống của cây đa cũ: mô hình không có nên gỡ vật cản
      S.shown = on; S.credit = on ? CREDIT : null;
      G.renderer.shadowMap.needsUpdate = true;
    };
    S.show(true);
    for (const m of CU) if (m.geometry) m.geometry.dispose();                       // trả bộ nhớ đồ hoạ của cây cũ; hiện lại thì Three.js tự đẩy lên lại
    S.count = count; S.hold = hold; S.holdVuon = vuon;
  }

  async function load() {
    S.state = 'loading'; S.tries++;
    try {
      if (!Loader || !Decoder) {
        try {
          const [L, Mo] = await Promise.all([import('three/addons/loaders/GLTFLoader.js'), import('three/addons/libs/meshopt_decoder.module.js')]);
          Loader = L.GLTFLoader; Decoder = Mo.MeshoptDecoder || Mo.default;
        } catch (e) { S.tries = 99; throw e; }
        if (!Loader || !Decoder || Decoder.supported === false) { S.tries = 99; throw new Error('trình duyệt không giải nén được mô hình (thiếu WebAssembly)'); }
      }
      const small = S.tries > 1 || nhe();                                           // lần thử lại: lùi về bản nhẹ
      S.urls = small ? [CFG.soiNhe, CFG.thongNhe] : [CFG.soi, CFG.thong]; S.small = small;
      const loader = new Loader(); loader.setMeshoptDecoder(Decoder);
      const gs = await Promise.all(S.urls.map((u) => loader.loadAsync(u)));
      try { place(gs, small); } catch (e) { S.tries = 99; throw e; }
      S.state = 'ready'; S.error = null;
    } catch (e) {
      S.error = (e && e.message) || String(e);
      if (S.tries < 2) { S.state = 'idle'; S.next = now + CFG.retryAfter; }
      else { S.state = 'failed'; console.warn('[cây] không tải được mô hình cây — giữ cây dựng bằng mã: ' + S.error); }
    }
  }
  G.onUpdate((dt, t) => {
    now = t || 0;
    if (S.state === 'ready') { if (S.shown && S.lod) S.lod(false); return; }          // sau máy quay (thứ tự 50): xét lại mức chi tiết khi máy quay đã đi đủ xa
    if (S.state !== 'idle' || now < S.next) return;
    const conn = navigator.connection;
    if (conn && conn.saveData) { S.state = 'skipped'; return; }                       // máy bật "tiết kiệm dữ liệu": giữ cây dựng bằng mã
    load();
  }, 57);

  // ảnh chia sẻ (G.snapshot) chụp bằng máy quay riêng, có thể ở rất xa người chơi: xét mức chi tiết theo máy quay ấy, chụp xong trả về máy quay chính
  if (G.events && G.events.on) {
    G.events.on('snapshot:before', (sc) => { if (S.state === 'ready' && S.shown && S.lod && sc && sc.position) S.lod(true, sc.position); });
    G.events.on('snapshot:after', () => { if (S.state === 'ready' && S.shown && S.lod) S.lod(true); });
  }

  // ghi công tác giả hai mô hình (CC BY 4.0) ở cuối bảng Cài đặt, khi cây mô hình đang hiện
  if (G.events && G.events.on) G.events.on('ui:settings', (box) => {
    if (!box || !box.appendChild || !S.credit) return;
    for (const cr of S.credit) {
      const p = U.el('p', 'muted small', cr.text + ' ');
      [['Xem mô hình gốc', cr.href], ['Giấy phép CC BY 4.0', cr.licence]].forEach(([label, href], i) => {
        const a = U.el('a', null, label); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.style.cssText = 'color:inherit;display:inline-block;padding:13px 4px;margin:-13px -4px';
        if (i) p.append(' · ');
        p.append(a);
      });
      box.appendChild(p);
    }
  });
}
