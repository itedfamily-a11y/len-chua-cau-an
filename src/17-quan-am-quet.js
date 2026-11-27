// =====================================================================
//  TƯỢNG QUAN ÂM NGHÌN TAY — BẢN QUÉT 3D (2026-11-27)
//  Thay tượng dựng bằng mã (09 buildQuanAm) bằng bản quét thật của pho tượng chùa Bút Tháp, khi tải được file mô hình.
//  Mô hình gốc: "Tuong Phat Ba 5K" của vudn54 trên Sketchfab, giấy phép CC BY 4.0. File trong game đã giảm số mặt, cắt phần nền,
//  thu nhỏ ảnh bề mặt và chuẩn hoá trục (y hướng lên, mặt tượng quay về +z, đáy ở y = 0, tâm ở x = z = 0).
//  - Chỉ tải khi người chơi tới gần Quan Âm Các (CFG.near mét). Máy bật "tiết kiệm dữ liệu" thì không tải.
//  - Hai bản của cùng một tượng (2026-11-27, dựng từ file GLB 8k của Sketchfab bằng tests-local/quan-am-tools):
//      quan-am-but-thap-4k.glb  150 nghìn mặt, ảnh 4096 px, khoảng 3,6 MB — máy tính;
//      quan-am-but-thap.glb     100 nghìn mặt, ảnh 2048 px, khoảng 1,9 MB — máy cảm ứng, máy đang ở mức đồ hoạ thấp hoặc đã được ghi nhớ là máy yếu
//                               trong 7 ngày, máy không nhận ảnh 4096 px; cũng là bản dùng khi thử lại sau khi bản nét tải hỏng.
//  - GLTFLoader và MeshoptDecoder là addon của Three.js r160, tải bằng import() qua import map "three/addons/" (như 07-hau-ky.js).
//    File dùng EXT_meshopt_compression (lưới nén, cần MeshoptDecoder), KHR_mesh_quantization và ảnh WebP (GLTFLoader đọc sẵn).
//  - Lỗi ở bất kỳ bước nào (chưa có file, mất mạng, mở bằng file://, addon lỗi, mô hình rỗng): giữ nguyên tượng dựng bằng mã và ghi một dòng console.warn.
//    Lỗi tải file được thử lại một lần sau 45 giây (bằng bản nhẹ nếu lần đầu là bản nét); lỗi import() (trình duyệt nhớ import() hỏng suốt đời trang) và mô hình hỏng
//    (rỗng, không có ảnh bề mặt) thì không thử lại.
//  - Trạng thái: W.ext.quanAm.scan = { state: 'idle' | 'loading' | 'ready' | 'failed' | 'skipped', error, tris, show(bool) }.
//    Khi bản quét đang hiển thị, W.ext.quanAm.credit = { text, href, licence } để bảng Lễ ở Quan Âm Các (17-dien-phu.js) ghi công tác giả.
// =====================================================================
function installQuanAmQuet(G) {
  const { THREE, world: W } = G;
  const Q = W && W.ext && W.ext.quanAm, st = Q && Q.statue;
  if (!st || !st.parent || !G.onUpdate) return;

  const CFG = {
    url: 'assets/mo-hinh/quan-am-but-thap.glb',      // bản nhẹ. Thư mục mô hình theo HUONG-DAN-CONG-KHAI.md: assets/ phải đi kèm index.html khi đưa lên mạng
    urlHi: 'assets/mo-hinh/quan-am-but-thap-4k.glb', // bản nét cho máy tính
    near: 30,                 // m: bắt đầu tải khi người chơi cách tượng chừng này (đi bộ tới nơi mất khoảng 10 giây)
    height: 3.26,             // chiều cao trong hệ của tượng cũ (đáy bệ → đỉnh), trước khi nhân tỉ lệ của điện (×1,12 → khoảng 3,65 m; bản quét sau khi cắt đá kê cao 3,66 m, tức gần đúng cỡ thật)
    x: 0, y: -0.012, z: 0, yaw: 0, // y: lún 1,3 cm vào bệ để che mép cắt lởm chởm ở đáy
    // Vật liệu (chọn 2026-11-27 từ năm bộ số chụp thử trong game, scratchpad v7/quanam/scan3): ảnh quét đã có sáng tối sẵn nên phần "tự sáng" (glow) giữ màu thật
    // của tượng — thân xám xanh, mặt còn vàng, sen và bệ sơn đỏ — còn đèn ấm của điện chỉ phủ thêm một lớp mỏng (col nhân vào phần bắt đèn). Không kim loại, không phản chiếu:
    // có phản chiếu thì cả tượng ngả cam và nhạt chi tiết.
    rough: 0.9, metal: 0, env: 0, glow: 0.55, col: 0.45,
    retryAfter: 45,           // giây
  };
  const CREDIT = {
    text: 'Tượng trong điện là bản quét 3D pho tượng Quan Âm nghìn mắt nghìn tay ở chùa Bút Tháp (Bắc Ninh): mô hình "Tuong Phat Ba 5K" của vudn54 trên Sketchfab, giấy phép CC BY 4.0, đã chỉnh sửa cho vừa trò chơi (giảm số mặt, cắt phần nền, thu nhỏ ảnh bề mặt, chỉnh vật liệu).',
    href: 'https://sketchfab.com/3d-models/tuong-phat-ba-5k-da1a8fe064df40bf892adb03fa115e3d',
    licence: 'https://creativecommons.org/licenses/by/4.0/', // CC BY 4.0 đòi nêu tên tác giả, nguồn, giấy phép (kèm đường dẫn) và việc đã chỉnh sửa
  };
  const S = (Q.scan = { state: 'idle', url: CFG.url, error: null, tris: 0, tries: 0, next: 0, mesh: null, show: null });
  let Loader = null, Decoder = null, now = 0;
  // chọn bản theo máy, đúng lúc sắp tải (mức đồ hoạ có thể đã hạ sau vài giây chơi)
  const pickUrl = () => {
    const lowSaved = (() => { const a = Date.now() - ((G.save && G.save.data && +G.save.data.lowQ) || 0); return a >= 0 && a < 7 * 864e5; })(); // như 09 và 18-ban-tho.js: máy từng yếu trong 7 ngày gần đây
    let small = !!G.isTouch || lowSaved || !!(G.quality && G.quality.low);
    try { if (G.renderer.capabilities.maxTextureSize < 4096) small = true; } catch (e) { small = true; }
    return small ? CFG.url : CFG.urlHi;
  };

  function place(gltf) {
    const root = gltf && (gltf.scene || (gltf.scenes && gltf.scenes[0]));
    if (!root) throw new Error('mô hình không có cảnh');
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    if (!(size.y > 1e-6) || !isFinite(size.x + size.y + size.z)) throw new Error('mô hình rỗng');
    const env = W.banTho && W.banTho.envTex && W.banTho.envTex();
    const aniso = Math.min(8, G.renderer.capabilities.getMaxAnisotropy());
    const mats = new Set(), swap = new Map(); let tris = 0;
    // vật liệu "không bóng" (KHR_materials_unlit → MeshBasicMaterial) đổi sang MeshStandardMaterial cùng ảnh bề mặt, để đèn và phản chiếu của điện có tác dụng
    const std = (m) => {
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
    let withMap = 0; for (const m of mats) if (m.map && m.map.image) withMap++; // GLTFLoader nuốt lỗi giải mã ảnh (map = null) nên loadAsync vẫn xong: tượng trắng trơn thì thà giữ tượng cũ
    if (!withMap) throw new Error('mô hình không có ảnh bề mặt');
    for (const m of mats) {
      if (!m.isMeshStandardMaterial) continue;
      m.roughness = CFG.rough; m.metalness = env ? CFG.metal : 0; m.roughnessMap = null; m.metalnessMap = null;
      m.color.setScalar(CFG.col);
      if (m.map) {
        m.map.anisotropy = aniso; m.map.needsUpdate = true;
        m.emissive.setHex(0xffffff); m.emissiveMap = m.map; m.emissiveIntensity = CFG.glow;
        try { G.renderer.initTexture(m.map); } catch (e) { /* đẩy ảnh lên máy ngay lúc tải (người chơi còn ở xa); lỗi thì để lần vẽ đầu tự làm */ }
      }
      if (env && CFG.env > 0) { m.envMap = env; m.envMapIntensity = CFG.env; if (W.banTho.envMats) W.banTho.envMats.push(m); } // chỉ khi bật phản chiếu; 18-ban-tho.js gán lại bản đồ phản chiếu khi khôi phục ngữ cảnh WebGL
      m.needsUpdate = true;
    }
    // đưa tâm đáy về gốc rồi co cho vừa chiều cao tượng cũ; st (nhóm do 17 đặt lên bệ) đã có sẵn vị trí, hướng và tỉ lệ của điện
    const hold = new THREE.Group(); hold.name = 'quanAmQuet';
    root.position.x -= c.x; root.position.y -= box.min.y; root.position.z -= c.z;
    hold.add(root); hold.scale.setScalar(CFG.height / size.y); hold.rotation.y = CFG.yaw; hold.position.set(CFG.x, CFG.y, CFG.z);
    const old = st.children.slice();
    st.add(hold);
    S.mesh = hold; S.tris = Math.round(tris);
    S.show = (scan) => { // true: bản quét; false: tượng dựng bằng mã (để so sánh / gỡ lỗi)
      hold.visible = !!scan; for (const o of old) o.visible = !scan;
      Q.credit = scan ? CREDIT : null;
    };
    S.show(true);
    for (const o of old) o.traverse((n) => { if (n.geometry) n.geometry.dispose(); }); // trả bộ nhớ đồ hoạ của tượng cũ; hiện lại thì Three.js tự đẩy lên lại
  }

  async function load() {
    S.state = 'loading'; S.tries++;
    try {
      if (!Loader || !Decoder) {
        try {
          const [L, M] = await Promise.all([import('three/addons/loaders/GLTFLoader.js'), import('three/addons/libs/meshopt_decoder.module.js')]);
          Loader = L.GLTFLoader; Decoder = M.MeshoptDecoder || M.default;
        } catch (e) { S.tries = 99; throw e; } // import() hỏng thì thử lại cũng vô ích
        // thiếu WebAssembly (iOS Lockdown, trình duyệt khoá chặt) thì MeshoptDecoder chỉ là { supported: false }: dừng ngay, khỏi tải file rồi mới hỏng
        if (!Loader || !Decoder || Decoder.supported === false) { S.tries = 99; throw new Error(Loader && Decoder ? 'trình duyệt không chạy được WebAssembly (MeshoptDecoder không dùng được)' : 'addon không có GLTFLoader / MeshoptDecoder'); }
      }
      S.url = (S.tries > 1 && S.url === CFG.urlHi) ? CFG.url : pickUrl(); // lần thử lại: bản nét hỏng (thiếu file, đứt mạng giữa chừng) thì lùi về bản nhẹ
      const loader = new Loader(); loader.setMeshoptDecoder(Decoder);
      const gltf = await loader.loadAsync(S.url);
      try { place(gltf); } catch (e) { S.tries = 99; throw e; } // file đã tải được nhưng mô hình hỏng: tải lại cũng vô ích
      S.state = 'ready'; S.error = null;
    } catch (e) {
      S.error = (e && e.message) || String(e);
      if (S.tries < 2) { S.state = 'idle'; S.next = now + CFG.retryAfter; }
      else { S.state = 'failed'; console.warn('[Quan Âm] không tải được bản quét 3D — giữ tượng dựng bằng mã: ' + S.error); }
    }
  }

  const p = st.position, near2 = CFG.near * CFG.near;
  G.onUpdate((dt, t) => {
    now = t || 0;
    if (S.state !== 'idle' || now < S.next) return;
    const P = G.player; if (!P || !P.pos) return;
    const dx = P.pos.x - p.x, dz = P.pos.z - p.z;
    if (dx * dx + dz * dz > near2) return;
    const conn = navigator.connection;
    if (conn && conn.saveData) { S.state = 'skipped'; return; } // người chơi bật tiết kiệm dữ liệu: không tải thêm file mô hình
    load();
  }, 56);
}
