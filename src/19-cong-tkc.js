// =====================================================================
//  CỔNG SÂN TÀNG KINH CÁC (2026-11-28) — cổng ba gian, mái giữa cao, dựng theo mô hình "Vietnam Temple Gate" của ptdtch (Sketchfab, CC BY 4.0)
//  Chủ chùa (gửi ảnh khoảng sân trống trước tường đông, sau khi Quan Âm Các dời vào góc đông nam):
//  "Di chuyển cổng của tàng thư các ra khu này, thu gọn mái hiên đỏ lại sang bên trái. <link Sketchfab>. Lấy cổng theo mẫu link, file GLB làm nét".
//  - Chỗ đặt: trên tim tường đông sân trước (x 36,3), thẳng trục bậc tây và cửa tây của Tàng Kinh Các (z −3,4): đứng giữa khoảng sân nhìn sang là thấy
//    cổng, qua cổng đi thẳng tới bậc. Trước đó là cổng nách nhỏ dựng bằng mã ở z 9…13, khuất sau góc đông bắc của Quan Âm Các.
//  - Mẫu trong đường dẫn ("璧鸡牌坊", bản quét cổng Bích Kê ở Côn Minh, của zhujiming79) không có giấy phép và không cho tải: chỉ dùng làm mẫu dáng
//    và màu. Hình khối lấy từ file GLB chủ chùa tải (cùng kiểu cổng ba gian, mái giữa cao); màu đổi theo mẫu và theo mái chùa: ngói đỏ đất, gỗ son,
//    bờ nóc nâu sẫm, nền đá, chữ vàng (bảng MAU; đặt MAU = null thì giữ màu gốc của file: ngói men xanh, gỗ đỏ hồng).
//  - File: assets/mo-hinh/cong-tkc.glb (66 787 tam giác, 0,22 MB, máy tính) và cong-tkc-nhe.glb (27 494 tam giác, 0,10 MB: máy cảm ứng, máy yếu,
//    tiết kiệm dữ liệu, lần thử lại). Đổi bằng tests-local/cong-tkc-tools/convert-gate.mjs từ file gốc 489 582 tam giác: giản lược (sai số 4 mm / 16 mm,
//    phần mạ vàng 1,5 / 2,5 mm cho viền bảng còn sắc), bỏ pháp tuyến và UV (file không có ảnh bề mặt; game tô phẳng), tách nền đá thành vật liệu riêng,
//    gỡ chữ "阮大王祀" (đền thờ Nguyễn Đại Vương, không hợp cổng lầu kinh) trên bảng giữa: game treo biển "TÀNG KINH CÁC" vào đúng chỗ ấy.
//    Cùng đêm chủ chùa: "Sửa 2 câu đối 2 bên sang tiếng việt sao cho đúng ý nghĩa của tàng kinh các" — chữ Hán 一心報國 / 鐵石剛忠 (một lòng báo quốc /
//    trung kiên như sắt đá) cũng gỡ khỏi file (giữ tấm và viền vàng); game treo đôi câu đối tiếng Việt (CAU_DOI) lên hai tấm ấy.
//  - Hệ cục bộ của file: y lên, chân ở y 0, giữa ở x = z = 0, MẶT TRƯỚC (bảng, câu đối) = +z; rộng 7,32 (x) × cao 5,23 × sâu 3,13 m (cả mái vươn).
//    Ra thế giới: xoay YAW = −π/2 quanh tâm (GX, GZ): thế giới x = GX − z, thế giới z = GZ + x, mặt trước nhìn về TÂY (ra sân trước).
//  - Số đo cục bộ (đo từ file): nền đá |x| ≤ 3,02, |z| ≤ 0,9, cao 0,18; bốn cột cái x ±1,53, z ±0,77 (vuông 0,18, cao 3,83); bốn cột con x ±2,88,
//    z ±0,77 (cao 2,48); lối giữa rộng 2,88 m, dưới bảng cao 3,34 m; hai gian bên chắn bằng tấm câu đối (x ±1,91…2,54, z 0…0,06, cao tới 2,02);
//    bảng giữa x ±1,35, y 3,34…3,78, mặt trước z 0,88 (viền vàng 0,89); xà gian giữa y 3,57…3,83; mái giữa y ≈ 4,0…5,23; mái bên y ≈ 2,2…3,9.
//  - Gọi từ 19-tang-kinh-cac.js (khối 'cổng nách'), sau độ cao, ranh giới và nút dẫn đường của sân Tàng Kinh Các; khoảng hở trên tường đông là
//    TKC_SITE.gate (05-world.js dựng hai đoạn tường hai bên, dừng ở hai cột con).
//  - Trạng thái: W.congTKC = { state: 'idle' | 'loading' | 'ready' | 'failed', url, error, tris, credit, show(bool) }.
// =====================================================================
function buildCongTKC(G, T) {
  const { THREE, util: U, scene } = G;
  const W = G.world, col = G.collide, KB = G.build;
  if (!W || !KB || !col || !T || !T.gate) return null;
  const { C, boxMM, addRoof, addSign } = KB;
  const PI = Math.PI;
  const GX = 36.3, GZ = (T.gate.z0 + T.gate.z1) / 2, YAW = -PI / 2, BH = 0.18;           // tâm cổng trên tim tường đông; nền đá cao 0,18
  const wx = (x, z) => GX - z, wz = (x, z) => GZ + x;                                     // cục bộ → thế giới (YAW = −π/2)
  const wbox = (x0, z0, x1, z1) => { const a = [wx(x0, z0), wx(x1, z1)], b = [wz(x0, z0), wz(x1, z1)]; return [Math.min(...a), Math.max(...a), Math.min(...b), Math.max(...b)]; };
  const POSTS = [[-1.53, -0.77], [-1.53, 0.77], [1.53, -0.77], [1.53, 0.77], [-2.88, -0.77], [-2.88, 0.77], [2.88, -0.77], [2.88, 0.77]];

  // ---------- vật cản: tám cột, tấm câu đối chắn hai gian bên (tường hai bên do 05-world.js dựng, dừng ở cột con) ----------
  for (const [x, z] of POSTS) col.circle(wx(x, z), wz(x, z), 0.15, 'cong');
  for (const s of [-1, 1]) { const b = wbox(s * 1.62, -0.14, s * 2.79, 0.14); col.box(b[0], b[2], b[1], b[3], 'cong'); }

  // ---------- độ cao: nền đá 0,18 m, vuốt 0,25 m ở hai mép trước / sau cho chân khỏi giật ----------
  const baseH = G.heightAt;
  G.heightAt = (x, z) => {
    const lx = z - GZ, lz = GX - x;
    if (Math.abs(lx) <= 3.02 && Math.abs(lz) <= 0.9) return Math.max(BH * U.clamp((0.9 - Math.abs(lz)) / 0.25, 0, 1), baseH(x, z));
    return baseH(x, z);
  };

  // ---------- máy quay: bảng + xà + mái giữa, hai mái bên, hai tấm câu đối chắn tia ngắm (lối giữa để trống) ----------
  const blk = (x0, y0, z0, x1, y1, z1) => { const b = wbox(x0, z0, x1, z1); G.cam.blockers.push(new THREE.Box3(new THREE.Vector3(b[0], y0, b[2]), new THREE.Vector3(b[1], y1, b[3]))); };
  blk(-2.3, 3.34, -1.0, 2.3, 4.9, 1.0);
  for (const s of [-1, 1]) { blk(s * 1.6, 2.2, -1.0, s * 3.4, 3.6, 1.0); blk(s * 1.62, BH, -0.1, s * 2.79, 2.25, 0.1); }
  (G.decorBans = G.decorBans || []).push([GX - 3.3, GX + 0.7, GZ - 4.4, GZ + 4.4]);       // 12-decor-inside.js không đặt chậu, đèn, bồn hoa sát cổng (mái vươn tới |x| 3,66)

  // ---------- biển "TÀNG KINH CÁC" ở mặt trước bảng giữa (chữ gốc của file đã gỡ lúc chuyển đổi) ----------
  addSign(['TÀNG KINH CÁC'], 2.5, 0.36, wx(0, 0.9), 3.56, wz(0, 0.9), YAW, { ppu: 320, bg1: '#6e1c1e', bg2: '#561416', fg: '#ecc46e' });
  // ---------- đôi câu đối tiếng Việt trên hai tấm ở gian bên (chữ Hán gốc đã gỡ lúc chuyển đổi) ----------
  // Thất ngôn, đối thanh đủ ở chữ 2 / 4 / 6 / 7: vế trên (tấm TRÁI khi đứng ngoài sân nhìn vào, cục bộ x < 0; đọc trái sang phải) kết vần trắc,
  // vế dưới (tấm phải) kết vần bằng. Nghĩa: lầu tàng kinh gìn giữ lời Phật dạy quý như vàng ngọc; học pháp để mở mang trí tuệ.
  // Tấm gỗ x ±1,91…2,54, y 0,18…2,02, mặt trước z 0,04 (viền vàng 0,06): biển dọc 0,55 × 1,74 đặt ở z 0,07, mỗi chữ một dòng.
  const CAU_DOI = [['Tàng', 'Kinh', 'Gìn', 'Giữ', 'Lời', 'Vàng', 'Ngọc'], ['Học', 'Pháp', 'Mở', 'Mang', 'Trí', 'Tuệ', 'Người']];
  CAU_DOI.forEach((lines, i) => { const x = (i ? 1 : -1) * 2.225; addSign(lines, 0.55, 1.74, wx(x, 0.07), 1.1, wz(x, 0.07), YAW, { vertical: true, ppu: 360, bg1: '#6e1c1e', bg2: '#561416', fg: '#ecc46e' }); });

  // =====================================================================
  //  BẢN DỰNG TẠM bằng khối, cùng số đo (hiện ngay; ẩn khi mô hình tải xong; ở lại nếu tải lỗi)
  // =====================================================================
  const standIn = new THREE.Group(); standIn.name = 'cong-tkc:tam';
  {
    const SB = U.batch(), MB = U.batch();
    const bm = (x0, y0, z0, x1, y1, z1, c) => boxMM(SB, Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1), Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1), c);
    bm(-3.02, 0, -0.9, 3.02, BH, 0.9, C.stoneD);                                                    // nền đá
    for (const [x, z] of POSTS) bm(x - 0.09, BH, z - 0.09, x + 0.09, Math.abs(x) < 2 ? 3.83 : 2.48, z + 0.09, C.wood);
    for (const s of [-1, 1]) {
      bm(s * 1.44, 2.22, -0.86, s * 3.11, 2.48, 0.86, C.wood);                                       // xà gian bên
      bm(s * 1.91, BH, 0, s * 2.54, 2.02, 0.04, C.wood); bm(s * 1.95, 0.3, 0.04, s * 2.5, 1.9, 0.06, C.gold); // tấm câu đối
      addRoof(SB, s * 2.55, 2.72, 0, 2.3, 3.1, 0.8, { curl: 0.5, sag: 0.06, seg: 4, color: C.roof, metal: MB });
    }
    bm(-1.76, 3.57, -0.86, 1.76, 3.83, 0.86, C.wood); bm(-1.53, 3.83, -0.8, 1.53, 4.1, 0.8, C.wood); // xà và vách gian giữa
    bm(-1.35, 3.34, 0.79, 1.35, 3.78, 0.88, C.wood);                                                // bảng giữa (biển treo phía trước)
    addRoof(SB, 0, 4.05, 0, 4.6, 3.1, 1.15, { curl: 0.5, sag: 0.06, seg: 6, color: C.roof, metal: MB });
    for (const B of [SB, MB]) {
      if (!B.list.length) continue;
      const m = B.mesh(G.mats.vc, { cast: true, receive: true }); m.name = 'cong-tkc:tam';
      m.position.set(GX, 0, GZ); m.rotation.y = YAW; m.matrixAutoUpdate = false; m.updateMatrix(); standIn.add(m);
    }
  }
  scene.add(standIn);

  // =====================================================================
  //  MÔ HÌNH: tải sau khi game chạy; lỗi thì giữ bản tạm
  // =====================================================================
  const CREDIT = {
    text: 'Cổng sân Tàng Kinh Các là mô hình "Vietnam Temple Gate" của ptdtch trên Sketchfab, giấy phép CC BY 4.0, đã chỉnh sửa cho vừa trò chơi (giảm số mặt, đổi màu theo mái chùa, thay chữ trên bảng giữa bằng biển "Tàng Kinh Các" và đôi câu đối chữ Hán bằng câu đối tiếng Việt).',
    href: 'https://sketchfab.com/3d-models/vietnam-temple-gate-4fad9643769f4ff5b71ea66d7f42b8c5',
    licence: 'https://creativecommons.org/licenses/by/4.0/',
  };
  const URL_HI = 'assets/mo-hinh/cong-tkc.glb', URL_LO = 'assets/mo-hinh/cong-tkc-nhe.glb';
  // màu theo tên vật liệu trong file (tên do Fusion / Sketchfab đặt theo màu gốc); null = giữ màu của file
  const MAU = { Opaque376869: C.roof, Opaque1253239: C.wood, Opaque636363: C.ridge, Opaque22617783: C.gold, 'da-nen': C.stoneD };
  const V = (W.congTKC = { state: 'idle', url: null, error: null, tris: 0, tries: 0, next: 3, credit: null, mesh: null, standIn, show: null });
  let Loader = null, Decoder = null, now = 0;
  const pickUrl = () => {
    const lowSaved = (() => { const a = Date.now() - ((G.save && G.save.data && +G.save.data.lowQ) || 0); return a >= 0 && a < 7 * 864e5; })();
    return (G.isTouch || lowSaved || (G.quality && G.quality.low) || !!(navigator.connection && navigator.connection.saveData)) ? URL_LO : URL_HI;
  };
  function place(gltf) {
    const root = gltf && (gltf.scene || (gltf.scenes && gltf.scenes[0]));
    if (!root) throw new Error('mô hình không có cảnh');
    root.updateMatrixWorld(true);
    const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
    // file đã đúng cỡ thật (7,32 × 5,23 × 3,13 m): lệch quá 0,3 m nghĩa là file sai, thà giữ bản tạm còn hơn lệch với vật cản
    if (!(Math.abs(size.x - 7.32) < 0.3 && Math.abs(size.y - 5.23) < 0.3 && Math.abs(size.z - 3.13) < 0.3)) throw new Error('mô hình sai cỡ: ' + [size.x, size.y, size.z].map((v) => v.toFixed(2)).join(' × '));
    let tris = 0; const swap = new Map();
    const lam = (m) => { // vật liệu PBR của file → Lambert tô phẳng (file không có pháp tuyến), hai mặt (tấm mỏng nhìn được cả hai phía)
      if (!swap.has(m)) {
        const name = (m && m.name) || '', c = MAU && MAU[name] != null ? MAU[name] : (m && m.color ? m.color.getHex() : 0x8a8070);
        swap.set(m, new THREE.MeshLambertMaterial({ color: c, flatShading: true, side: THREE.DoubleSide }));
      }
      return swap.get(m);
    };
    root.traverse((o) => {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
      tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
      const old = o.material; o.material = Array.isArray(old) ? old.map(lam) : lam(old);
      o.castShadow = true; o.receiveShadow = true;
    });
    if (tris < 1000) throw new Error('mô hình quá ít mặt: ' + tris);
    for (const m of swap.keys()) if (m && m.dispose) m.dispose();
    const hold = new THREE.Group(); hold.name = 'cong-tkc:mo-hinh';
    hold.position.set(GX, 0, GZ); hold.rotation.y = YAW; hold.add(root);
    scene.add(hold); hold.updateMatrixWorld(true);
    hold.traverse((o) => { o.matrixAutoUpdate = false; });
    V.mesh = hold; V.tris = Math.round(tris);
    V.show = (model) => { hold.visible = !!model; standIn.visible = !model; V.credit = model ? CREDIT : null; try { G.renderer.shadowMap.needsUpdate = true; } catch (e) { /* bỏ qua */ } };
    V.show(true);
  }
  async function load() {
    V.state = 'loading'; V.tries++;
    try {
      if (!Loader || !Decoder) {
        try {
          const [L, M] = await Promise.all([import('three/addons/loaders/GLTFLoader.js'), import('three/addons/libs/meshopt_decoder.module.js')]);
          Loader = L.GLTFLoader; Decoder = M.MeshoptDecoder || M.default;
        } catch (e) { V.tries = 99; throw e; }
        if (!Loader || !Decoder || Decoder.supported === false) { V.tries = 99; throw new Error(Loader && Decoder ? 'trình duyệt không chạy được WebAssembly (MeshoptDecoder không dùng được)' : 'addon không có GLTFLoader / MeshoptDecoder'); }
      }
      V.url = (V.tries > 1 && V.url === URL_HI) ? URL_LO : pickUrl(); // lần thử lại: bản nét hỏng thì lùi về bản nhẹ
      const loader = new Loader(); loader.setMeshoptDecoder(Decoder);
      const gltf = await loader.loadAsync(V.url);
      try { place(gltf); } catch (e) { V.tries = 99; throw e; }
      V.state = 'ready'; V.error = null;
    } catch (e) {
      V.error = (e && e.message) || String(e);
      if (V.tries < 2) { V.state = 'idle'; V.next = now + 45; }
      else { V.state = 'failed'; console.warn('[cổng Tàng Kinh Các] không tải được mô hình — giữ bản dựng tạm: ' + V.error); }
    }
  }
  if (G.onUpdate) G.onUpdate((dt, t) => {
    now = t || 0;
    if (V.state !== 'idle' || now < V.next) return;
    const conn = navigator.connection;
    if (conn && conn.saveData) { const P = G.player; if (!P || !P.pos || Math.hypot(P.pos.x - GX, P.pos.z - GZ) > 50) return; } // tiết kiệm dữ liệu: chỉ tải khi đã vào sân trước (chỗ vào game cách cổng 54 m)
    load();
  }, 58);

  // ghi công tác giả (CC BY 4.0) ở cuối bảng Cài đặt, khi mô hình đang hiện
  if (G.events && G.events.on) G.events.on('ui:settings', (box) => {
    if (!box || !box.appendChild || !V.credit) return;
    const p = U.el('p', 'muted small', V.credit.text + ' ');
    [['Xem mô hình gốc', V.credit.href], ['Giấy phép CC BY 4.0', V.credit.licence]].forEach(([label, href], i) => {
      const a = U.el('a', null, label); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.style.cssText = 'color:inherit;display:inline-block;padding:13px 4px;margin:-13px -4px';
      if (i) p.append(' · ');
      p.append(a);
    });
    box.appendChild(p);
  });
  return V;
}
