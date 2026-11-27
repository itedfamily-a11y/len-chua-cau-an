// =====================================================================
//  TƯỢNG ĐỊA TẠNG VƯƠNG BỒ TÁT — MÔ HÌNH 3D TẢI VỀ (2026-11-27)
//  Thay tượng dựng bằng mã ở Điện Địa Tạng (17-dien-phu.js, hàm diaTang, dựng riêng nhờ spec solo: 'diaTang') bằng mô hình
//  "diZangPuSa_v2022-HiPory-4K-MaterialTest" của chiwei trên Sketchfab, giấy phép CC BY 4.0: Bồ Tát ngồi trên tảng đá, một chân buông,
//  tay phải cầm tích trượng, tay trái nâng minh châu, vầng hào quang lửa sau đầu; thếp vàng cũ.
//  File trong game đã giảm số mặt (610 nghìn → 150 / 70 nghìn), chỉ giữ ảnh màu (bỏ ảnh pháp tuyến gần như phẳng và ảnh kim loại – nhám),
//  chuẩn hoá trục (y hướng lên, mặt tượng quay về +z, đáy ở y = 0, tâm ở x = z = 0, cao 1). Lệnh dựng: tests-local/quan-am-tools/LENH-TUONG-DIA-TANG.md.
//  - Chỉ tải khi người chơi tới gần Điện Địa Tạng (CFG.near mét). Máy bật "tiết kiệm dữ liệu" thì không tải.
//  - Hai bản:  dia-tang-4k.glb  150 nghìn mặt, ảnh 4096 px, khoảng 4,1 MB — máy tính;
//              dia-tang.glb     70 nghìn mặt, ảnh 2048 px, khoảng 1,1 MB — máy cảm ứng, mức đồ hoạ thấp, máy đã được ghi nhớ là yếu trong 7 ngày,
//                               máy không nhận ảnh 4096 px; cũng là bản dùng khi thử lại sau khi bản nét tải hỏng.
//  - GLTFLoader và MeshoptDecoder: addon Three.js r160 qua import map "three/addons/" (như 17-quan-am-quet.js).
//  - Lỗi ở bất kỳ bước nào: giữ tượng dựng bằng mã, ghi một dòng console.warn. Lỗi tải file thử lại một lần sau 45 giây (bằng bản nhẹ);
//    lỗi import() và mô hình hỏng thì không thử lại.
//  - Khi bản tải về hiển thị: quầng sáng minh châu dời tới viên ngọc trên tay trái của tượng mới; quầng sáng lớn của điện hạ thấp xuống trước bệ
//    (như Quan Âm Các) để không loá mặt tượng; bảng Lễ ghi công tác giả (W.ext.diaTang.credit).
//  - Trạng thái: W.ext.diaTang.scan = { state: 'idle' | 'loading' | 'ready' | 'failed' | 'skipped', error, tris, show(bool) }.
// =====================================================================
function installDiaTangQuet(G) {
  const { THREE, world: W } = G;
  const D = W && W.ext && W.ext.diaTang, st = D && D.statue;
  if (!st || !D.seat || !G.onUpdate) return;

  const CFG = {
    url: 'assets/mo-hinh/dia-tang.glb',       // bản nhẹ
    urlHi: 'assets/mo-hinh/dia-tang-4k.glb',  // bản nét cho máy tính
    near: 30,                 // m
    height: 2.5,              // m, đáy tảng đá → đỉnh hào quang. Tượng cũ (cả tích trượng) cao khoảng 2,44 m; đỉnh tượng mới ở 3,83 m, dưới nẹp vàng trên phông (4,05 m)
    x: 0, y: -0.01, z: 0, yaw: 0, // y: lún 1 cm vào mặt bệ cho kín mép đáy đá
    // Vật liệu: thếp vàng. Có bản đồ phản chiếu "phòng ấm" (W.banTho.envTex, 18-ban-tho.js) thì để bán kim loại như vàng ở chính điện;
    // col > 1 nâng ảnh màu (vàng cũ ngả cam, khá tối) lên gần vàng thếp; glow: ảnh màu tự sáng nhẹ để phần khuất đèn vẫn đọc được nếp áo.
    // Đã chụp thử trong game 2026-11-27 (Chrome headless, ngày và đêm, trong điện và ngoài thềm): tượng vàng ngả cam như ảnh màu của file gốc, rõ nếp áo, không loá.
    // Muốn vàng hơn / bớt cam: tăng số giữa của col (ví dụ [1.2, 1.4, 1.15]); muốn bớt bóng: giảm metal hoặc env.
    withEnv: { rough: 0.42, metal: 0.75, env: 1.1, col: [1.3, 1.25, 1.1], glow: 0.14 },
    noEnv: { rough: 0.7, metal: 0, env: 0, col: [0.9, 0.88, 0.84], glow: 0.35 },
    pearl: [0.012, 0.426, 0.014], pearlSize: 0.45, // viên minh châu trong hệ của file (cao 1): đo bằng tests-local/quan-am-tools/pearl.mjs
    hallGlow: { y: -0.05, z: 1.35, r: 1.5, c: [0.5, 0.36, 0.16] }, // so với chỗ đặt tượng (mặt bệ): như quầng của Quan Âm Các
    retryAfter: 45,           // giây
  };
  const CREDIT = {
    text: 'Tượng trong điện là mô hình 3D "diZangPuSa_v2022-HiPory-4K-MaterialTest" của chiwei trên Sketchfab, giấy phép CC BY 4.0, đã chỉnh sửa cho vừa trò chơi (giảm số mặt, thu nhỏ ảnh bề mặt, chỉnh vật liệu).',
    href: 'https://sketchfab.com/3d-models/dizangpusa-v2022-hipory-4k-materialtest-c65b04e74d5843b6898b2918c2969d73',
    licence: 'https://creativecommons.org/licenses/by/4.0/', // CC BY 4.0: nêu tên tác giả, nguồn, giấy phép (kèm đường dẫn) và việc đã chỉnh sửa
  };
  const S = (D.scan = { state: 'idle', url: CFG.url, error: null, tris: 0, tries: 0, next: 0, mesh: null, show: null });
  let Loader = null, Decoder = null, now = 0;
  const pickUrl = () => {
    const lowSaved = (() => { const a = Date.now() - ((G.save && G.save.data && +G.save.data.lowQ) || 0); return a >= 0 && a < 7 * 864e5; })();
    let small = !!G.isTouch || lowSaved || !!(G.quality && G.quality.low);
    try { if (G.renderer.capabilities.maxTextureSize < 4096) small = true; } catch (e) { small = true; }
    return small ? CFG.url : CFG.urlHi;
  };
  const seat = D.seat, cy = Math.cos(seat.yaw), sy = Math.sin(seat.yaw);
  const toW = (lx, ly, lz) => [seat.x + lx * cy + lz * sy, seat.y + ly, seat.z - lx * sy + lz * cy]; // toạ độ quanh chỗ đặt (x ngang, z ra cửa) → thế giới, như frame() của 17-dien-phu.js
  // quầng sáng tĩnh (07-fx.js gắn q.fx = { pts, i }): đặt lại vị trí / cỡ / màu; q giữ số gốc để trả về tượng cũ
  const glowTo = (q, x, y, z, size, r, g, b) => { if (!q || !q.fx) return; q.fx.pts.set(q.fx.i, x, y, z, size, r, g, b, 1); q.fx.pts.commit(); };
  const glowBack = (q) => glowTo(q, q && q.x, q && q.y, q && q.z, q && q.size, q && q.r, q && q.g, q && q.b);

  function place(gltf) {
    const root = gltf && (gltf.scene || (gltf.scenes && gltf.scenes[0]));
    if (!root) throw new Error('mô hình không có cảnh');
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    if (!(size.y > 1e-6) || !isFinite(size.x + size.y + size.z)) throw new Error('mô hình rỗng');
    const env = W.banTho && W.banTho.envTex && W.banTho.envTex();
    const M = env ? CFG.withEnv : CFG.noEnv;
    const aniso = Math.min(8, G.renderer.capabilities.getMaxAnisotropy());
    const mats = new Set(), swap = new Map(); let tris = 0;
    const std = (m) => { // vật liệu "không bóng" (MeshBasicMaterial) → MeshStandardMaterial cùng ảnh, để đèn và phản chiếu của điện có tác dụng
      if (!m || m.isMeshStandardMaterial) return m;
      if (!swap.has(m)) swap.set(m, new THREE.MeshStandardMaterial({ map: m.map || null, color: m.color ? m.color.clone() : 0xffffff, side: m.side, transparent: !!m.transparent, alphaTest: m.alphaTest || 0 }));
      return swap.get(m);
    };
    root.traverse((o) => {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
      o.castShadow = false; o.receiveShadow = false;
      tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
      o.material = Array.isArray(o.material) ? o.material.map(std) : std(o.material);
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) if (m) mats.add(m);
    });
    if (tris < 1) throw new Error('mô hình không có mặt nào');
    let withMap = 0; for (const m of mats) if (m.map && m.map.image) withMap++; // GLTFLoader nuốt lỗi giải mã ảnh (map = null): tượng trơn thì thà giữ tượng cũ
    if (!withMap) throw new Error('mô hình không có ảnh bề mặt');
    for (const m of mats) {
      if (!m.isMeshStandardMaterial) continue;
      m.roughness = M.rough; m.metalness = M.metal; m.roughnessMap = null; m.metalnessMap = null; m.normalMap = null; m.aoMap = null;
      m.color.setRGB(M.col[0], M.col[1], M.col[2]);
      if (m.map) {
        m.map.anisotropy = aniso; m.map.needsUpdate = true;
        m.emissive.setHex(0xffffff); m.emissiveMap = m.map; m.emissiveIntensity = M.glow;
        try { G.renderer.initTexture(m.map); } catch (e) { /* đẩy ảnh lên máy ngay lúc tải; lỗi thì để lần vẽ đầu tự làm */ }
      }
      if (env && M.env > 0) { m.envMap = env; m.envMapIntensity = M.env; if (W.banTho.envMats) W.banTho.envMats.push(m); } // 18-ban-tho.js gán lại bản đồ phản chiếu khi khôi phục ngữ cảnh WebGL
      m.needsUpdate = true;
    }
    // đưa tâm đáy về gốc, co cho vừa chiều cao, đặt lên bệ, quay mặt ra cửa
    const k = CFG.height / size.y;
    const hold = new THREE.Group(); hold.name = 'diaTangQuet';
    root.position.x -= c.x; root.position.y -= box.min.y; root.position.z -= c.z;
    hold.add(root); hold.scale.setScalar(k);
    const p0 = toW(CFG.x, CFG.y, CFG.z); hold.position.set(p0[0], p0[1], p0[2]); hold.rotation.y = seat.yaw + CFG.yaw;
    G.scene.add(hold); hold.updateMatrixWorld(true);
    const pv = root.localToWorld(new THREE.Vector3(CFG.pearl[0], CFG.pearl[1], CFG.pearl[2])); // root giữ hệ của file (đã chuẩn hoá cao 1)
    const pq = D.glows && D.glows[0], hq = D.hallGlow, hg = CFG.hallGlow, hp = toW(0, hg.y, hg.z);
    const old = st.children.slice();
    S.mesh = hold; S.tris = Math.round(tris);
    S.show = (scan) => { // true: mô hình tải về; false: tượng dựng bằng mã (để so sánh / gỡ lỗi)
      hold.visible = !!scan; st.visible = !scan;
      if (scan) { if (pq) glowTo(pq, pv.x, pv.y, pv.z, CFG.pearlSize, pq.r, pq.g, pq.b); if (hq) glowTo(hq, hp[0], hp[1], hp[2], hg.r, hg.c[0], hg.c[1], hg.c[2]); }
      else { glowBack(pq); glowBack(hq); }
      D.credit = scan ? CREDIT : null;
    };
    S.show(true);
    for (const o of old) o.traverse((n) => { if (n.geometry) n.geometry.dispose(); }); // trả bộ nhớ đồ hoạ của tượng cũ; hiện lại thì Three.js tự đẩy lên lại
  }

  async function load() {
    S.state = 'loading'; S.tries++;
    try {
      if (!Loader || !Decoder) {
        try {
          const [L, Mo] = await Promise.all([import('three/addons/loaders/GLTFLoader.js'), import('three/addons/libs/meshopt_decoder.module.js')]);
          Loader = L.GLTFLoader; Decoder = Mo.MeshoptDecoder || Mo.default;
        } catch (e) { S.tries = 99; throw e; }
        if (!Loader || !Decoder || Decoder.supported === false) { S.tries = 99; throw new Error(Loader && Decoder ? 'trình duyệt không chạy được WebAssembly (MeshoptDecoder không dùng được)' : 'addon không có GLTFLoader / MeshoptDecoder'); }
      }
      S.url = (S.tries > 1 && S.url === CFG.urlHi) ? CFG.url : pickUrl(); // lần thử lại sau khi bản nét hỏng: lùi về bản nhẹ
      const loader = new Loader(); loader.setMeshoptDecoder(Decoder);
      const gltf = await loader.loadAsync(S.url);
      try { place(gltf); } catch (e) { S.tries = 99; throw e; }
      S.state = 'ready'; S.error = null;
    } catch (e) {
      S.error = (e && e.message) || String(e);
      if (S.tries < 2) { S.state = 'idle'; S.next = now + CFG.retryAfter; }
      else { S.state = 'failed'; console.warn('[Địa Tạng] không tải được mô hình 3D — giữ tượng dựng bằng mã: ' + S.error); }
    }
  }

  const near2 = CFG.near * CFG.near;
  G.onUpdate((dt, t) => {
    now = t || 0;
    if (S.state !== 'idle' || now < S.next) return;
    const P = G.player; if (!P || !P.pos) return;
    const dx = P.pos.x - seat.x, dz = P.pos.z - seat.z;
    if (dx * dx + dz * dz > near2) return;
    const conn = navigator.connection;
    if (conn && conn.saveData) { S.state = 'skipped'; return; }
    load();
  }, 56);
}
