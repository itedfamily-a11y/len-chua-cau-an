// =====================================================================
//  QUAN ÂM CÁC MỚI (2026-11-27) — điện lớn hai tầng mái thay toà điện nhỏ 9 × 8,2 m
//  Chủ chùa: "Quan Âm Các quá bé và không phù hợp với tượng", rồi chọn mô hình "Procedural asian architecture test 3"
//  của ghostnoface trên Sketchfab (CC BY 4.0, cùng tác giả với Tàng Kinh Các) và cho phép dời ra khu đất mới nếu cần.
//  Không cần khu đất mới: nửa đông sân trước đủ chỗ khi xoay trục dài theo hướng đông – tây, mặt chính quay về NAM (ra phía cổng).
//
//  HỆ TOẠ ĐỘ CỤC BỘ (mét, gốc ở tâm toà nhà trên mặt đất): x sang đông, z ra nam (mặt chính), y lên. Thế giới = (OX + x, OZ + z), không xoay.
//  File mô hình đã được đổi sẵn về hệ này lúc chuyển đổi (x mới = −z gốc, z mới = x gốc). Mọi số dưới đây đo từ hình khối của mô hình
//  (scratchpad v7/hall/analyze3.mjs → analyze3.txt), KHÔNG ước lượng:
//    nền đá cao 1,0 m, |x| ≤ 9,63, |z| ≤ 7,6; bốn bậc thang giữa bốn cạnh, rộng 2,4 m, vươn tới |z| 9,46 / |x| 11,46;
//    lan can ở |z| 7,42 và |x| 9,42, hở 2,3 m chỗ bậc; 34 cột bán kính 0,17 trên lưới x ±8 / ±5,71 / ±3,43 / ±1,14, z ±6 / ±3,6 / ±1,2;
//    vách và cửa cao 3 m (y 1…4) trên các tuyến ghi ở WALLS; mái dưới y 4,25…6,4, mái trên y 6,6…10,3.
//  Hai chỗ đã sửa trong mô hình (lúc chuyển đổi, tests-local/quan-am-cac-tools): gỡ tấm trần gỗ ở y 4,85 (trần cũ chỉ cao 3,85 m, tượng cao 4,7 m);
//  mở ba gian giữa mặt nam (|x| < 3,43) làm lối vào. Gian chính: z −3,6…6, |x| < 5,7 (rộng tới |x| 8 ở phần z > 1,2). Tượng tựa mảng vách trơn giữa vách z −3,6.
//
//  Hàm này được 17-dien-phu.js gọi (không có bước khởi động riêng) và trả về bản ghi điện cùng dạng với dien(): { id, title, lamp, cushion, altar, front, nodes, spots, cam, camP }.
//  A = bộ hàm mượn của 17-dien-phu.js: { frame, locals, flush, toWorldFx, floors, cushion, bowlAt, candleAt, vaseAt }.
//  - Vật cản, độ cao, vùng mái, kính chắn máy quay, nút dẫn đường: đặt ngay, không chờ mô hình.
//  - Bản dựng tạm bằng khối (cùng số đo) hiện ngay; mô hình tải sau khi game chạy 2,5 giây (máy bật "tiết kiệm dữ liệu": bản nhẹ, và chỉ khi tới gần 40 m), tải được thì ẩn bản tạm.
//    Hai cỡ: quan-am-cac.glb (máy tính) và quan-am-cac-nhe.glb (máy cảm ứng, máy yếu). File dùng EXT_meshopt_compression, không có pháp tuyến (tô phẳng trong shader).
//  - Trạng thái: W.quanAmCac = { site, state: 'idle' | 'loading' | 'ready' | 'failed', url, error, tris, credit, show(bool) }.
//    Khi mô hình đang hiển thị, W.ext.quanAm.creditHall = credit để bảng Lễ ghi công tác giả (CC BY 4.0).
// =====================================================================
function buildQuanAmCac(G, A) {
  const { THREE, util: U, scene } = G;
  const W = G.world, col = G.collide, KB = G.build;
  if (!W || !KB || !A || !G.nav || !G.cam) return null;
  const { C, box, boxMM, cyl, addRoof, addSign, glow } = KB;
  const Q = W.ext && W.ext.quanAm;

  // ---------- số đo ----------
  const OX = 23.25, OZ = -0.95, FY = 1.0;   // gốc mô hình trong sân; sàn điện cao 1 m
  const PX = 9.63, PZ = 7.6, RX = 9.42, RZ = 7.42, SX = 11.46, SZ = 9.46, SW = 1.2;
  const wx = (x) => OX + x, wz = (z) => OZ + z;
  const fr = A.frame(OX, OZ, 0);
  const SITE = { ox: OX, oz: OZ, floor: FY, platform: [OX - PX, OX + PX, OZ - PZ, OZ + PZ], bbox: [OX - SX, OX + SX, OZ - SZ, OZ + SZ],
    url: 'assets/mo-hinh/quan-am-cac.glb', urlLo: 'assets/mo-hinh/quan-am-cac-nhe.glb' };
  const WALLS = [ // tim vách [x0, z0, x1, z1], dày 0,2 m
    [-8, 6, -3.43, 6], [3.43, 6, 8, 6],                                               // mặt nam: ba gian giữa đã mở
    [-3.43, -6, -1.14, -6], [1.14, -6, 3.43, -6],                                     // mặt bắc
    [-8, 1.15, -8, 6], [8, 1.15, 8, 6],                                               // hai đầu hồi
    [-1.2, -3.6, 1.2, -3.6], [-5.8, -3.6, -3.4, -3.6], [3.4, -3.6, 5.8, -3.6],        // vách ngăn sau gian chính (mảng giữa là lưng tượng)
    [-8, 1.2, -5.65, 1.2], [5.65, 1.2, 8, 1.2],
    [-5.7, -3.65, -5.7, 1.3], [5.7, -3.65, 5.7, 1.3],
    [-3.43, -6, -3.43, -3.5], [3.43, -6, 3.43, -3.5], [-1.14, -6, -1.14, -3.5], [1.14, -6, 1.14, -3.5],
  ];
  const RAILS = [ // lan can quanh nền (hở chỗ bậc) và tay vịn hai bên bậc
    [-RX, RZ, -1.15, RZ], [1.15, RZ, RX, RZ], [-RX, -RZ, -1.15, -RZ], [1.15, -RZ, RX, -RZ],
    [RX, -RZ, RX, -1.15], [RX, 1.15, RX, RZ], [-RX, -RZ, -RX, -1.15], [-RX, 1.15, -RX, RZ],
    [-SW, 7.5, -SW, SZ], [SW, 7.5, SW, SZ], [-SW, -SZ, -SW, -7.5], [SW, -SZ, SW, -7.5],
    [9.5, -SW, SX, -SW], [9.5, SW, SX, SW], [-SX, -SW, -9.5, -SW], [-SX, SW, -9.5, SW],
  ];
  const CXS = [-8, -5.71, -3.43, -1.14, 1.14, 3.43, 5.71, 8], COLS = [];
  for (const x of CXS) { COLS.push([x, -6], [x, -3.6], [x, 6]); if (Math.abs(x) > 5) COLS.push([x, -1.2], [x, 1.2]); if (Math.abs(x) > 7) COLS.push([x, 3.6]); }
  // nội thất dọc trục z: vách lưng −3,6 → bệ tượng → bàn thờ → hai hàng bồ đoàn → cửa 6
  const PW = 2.7, PD = 1.5, PH = 0.5, PZ0 = -3.47, PZC = PZ0 + PD / 2;       // bệ tượng thấp (tượng thật có sẵn đế 0,9 m)
  const TZ = PZ0 + PD + 0.75, TF = TZ + 0.4, TH = 0.95;                       // bàn thờ
  const C1 = TF + 1.4, C2 = C1 + 1.3;                                         // bồ đoàn
  const maroon = 0x7a2418;

  // ---------- dọn nút dẫn đường / chỗ đứng cũ nằm trong nền và bậc ----------
  const inFoot = (x, z, m = 0.5) => { const ax = Math.abs(x - OX), az = Math.abs(z - OZ); return (ax < PX + m && az < PZ + m) || (ax < SW + 0.4 && az < SZ + 0.3) || (az < SW + 0.4 && ax < SX + 0.3); };
  G.nav.nodes = G.nav.nodes.filter((n) => !inFoot(n.x, n.z)); G.nav.built = false;
  for (const k of Object.keys(G.spots || {})) { const a = G.spots[k]; if (Array.isArray(a)) for (let i = a.length - 1; i >= 0; i--) if (a[i] && inFoot(a[i].x, a[i].z)) a.splice(i, 1); }

  // ---------- vật cản ----------
  const seg = (s, t, tag) => { const [x0, z0, x1, z1] = s; col.box(wx(Math.min(x0, x1)) - t, wz(Math.min(z0, z1)) - t, wx(Math.max(x0, x1)) + t, wz(Math.max(z0, z1)) + t, tag); };
  for (const s of WALLS) seg(s, 0.1, 'qac');
  for (const s of RAILS) seg(s, 0.1, 'qac-rail');
  for (const [x, z] of COLS) col.circle(wx(x), wz(z), 0.22, 'col');
  col.box(wx(-PW / 2), wz(PZ0), wx(PW / 2), wz(PZ0 + PD), 'altar'); col.box(wx(-1.3), wz(TZ - 0.4), wx(1.3), wz(TF), 'altar');

  // ---------- độ cao: nền 1 m, bốn bậc là dốc thẳng ----------
  A.floors.push((x, z) => {
    const ax = Math.abs(x - OX), az = Math.abs(z - OZ);
    if (ax <= PX && az <= PZ) return FY;
    if (ax <= SW && az <= SZ) return FY * U.clamp((SZ - az) / (SZ - PZ), 0, 1);
    if (az <= SW && ax <= SX) return FY * U.clamp((SX - ax) / (SX - PX), 0, 1);
    return null;
  });

  // ---------- máy quay: dưới mái thì giữ máy thấp; vách và khối mái chắn tia ngắm ----------
  G.roofZones.push(SITE.platform.slice());
  const blk = (x0, y0, z0, x1, y1, z1) => G.cam.blockers.push(new THREE.Box3(new THREE.Vector3(wx(Math.min(x0, x1)), y0, wz(Math.min(z0, z1))), new THREE.Vector3(wx(Math.max(x0, x1)), y1, wz(Math.max(z0, z1)))));
  // vách bao (z ±6, hồi x ±8) có dải vách trên tới mái; vách ngăn trong chỉ cao 3 m
  for (const [x0, z0, x1, z1] of WALLS) { const outer = (Math.abs(z0) > 5.9 && Math.abs(z1) > 5.9) || (Math.abs(x0) > 7.9 && Math.abs(x1) > 7.9); blk(x0 - 0.1, FY, z0 - 0.1, x1 + 0.1, outer ? 6.5 : 4.0, z1 + 0.1); }
  blk(-10.3, 4.3, -8.3, 10.3, 10.4, 8.3);                                   // khối hai tầng mái
  blk(-PX, 0, -PZ, PX, FY - 0.05, PZ);                                      // khối nền đá
  (G.decorBans = G.decorBans || []).push([OX - SX - 1.2, OX + SX + 1.0, OZ - SZ - 1.0, OZ + SZ + 2.4]);

  // ---------- nội thất dựng bằng mã (gom chung lưới với các điện phụ): bệ tượng, bàn thờ, đồ cúng, thảm, bồ đoàn ----------
  const T = A.locals(), g0 = W.glows.length, s0 = (W.smokeSpots || []).length;
  boxMM(T.S, -PW / 2, FY, PZ0, PW / 2, FY + PH, PZ0 + PD, maroon); boxMM(T.S, -PW / 2 - 0.05, FY + PH, PZ0, PW / 2 + 0.05, FY + PH + 0.08, PZ0 + PD + 0.05, C.gold);
  boxMM(T.S, -PW / 2 + 0.2, FY + 0.1, PZ0 + PD, PW / 2 - 0.2, FY + PH - 0.1, PZ0 + PD + 0.03, C.goldD);
  boxMM(T.S, -1.3, FY, TZ - 0.4, 1.3, FY + TH, TF, maroon); boxMM(T.S, -1.36, FY + TH, TZ - 0.44, 1.36, FY + TH + 0.06, TF + 0.04, C.gold);
  boxMM(T.S, -1.1, FY + 0.18, TF, 1.1, FY + TH - 0.16, TF + 0.03, C.goldD);
  A.bowlAt(T, 0, FY + TH + 0.06, TZ, 1.4); A.candleAt(T, -0.85, FY + TH + 0.06, TZ); A.candleAt(T, 0.85, FY + TH + 0.06, TZ);
  A.vaseAt(T, -1.15, FY + TH + 0.06, TZ, 0x3a64a0); A.vaseAt(T, 1.15, FY + TH + 0.06, TZ, 0x3a64a0);
  boxMM(T.F, -1.1, FY + 0.012, TF, 1.1, FY + 0.03, 6.9, 0x7a2418);            // thảm đỏ từ bàn thờ ra tới thềm
  A.cushion(T, 0, FY, C1, true); A.cushion(T, -1.7, FY, C1); A.cushion(T, 1.7, FY, C1); A.cushion(T, 0, FY, C2); A.cushion(T, -1.7, FY, C2); A.cushion(T, 1.7, FY, C2);
  glow(0, FY + TH + 0.3, TZ, 1.5, [0.5, 0.36, 0.16], false);                  // quầng sáng nhỏ ở bàn thờ (toạ độ cục bộ, toWorldFx đổi ra thế giới)
  A.flush(T, fr); A.toWorldFx(fr, g0, s0);
  addSign(['QUAN ÂM CÁC'], 3.0, 0.62, wx(0), 6.35, wz(6.95), 0, { ppu: 260 });  // biển treo giữa hai tầng mái, mặt nam (y 6,04…6,66: dưới diềm mái trên ở 6,7)

  // ---------- tượng: đặt lên bệ, mặt quay ra cửa (nam); điểm đứng và máy quay của "Lần chuỗi hạt" ----------
  const alt = { x: wx(0), z: wz(PZC) }, sy = FY + PH + 0.08, ss = 1.12;
  if (Q && Q.statue) {
    const st = Q.statue;
    st.position.set(alt.x, sy, alt.z); st.rotation.y = 0; st.scale.setScalar(ss); scene.add(st);
    const env = W.banTho && W.banTho.envTex && W.banTho.envTex(); // tượng dựng bằng mã (dự phòng) mượn bản đồ phản chiếu của ban thờ chính điện
    if (env && Q.mats) for (const m of Q.mats) { m.envMap = env; if (m.userData.metalEnv != null) m.metalness = m.userData.metalEnv; m.emissive.setHex(0x000000); m.needsUpdate = true; W.banTho.envMats.push(m); }
    Q.poi = { x: wx(0), z: wz(C2 + 0.9), r: 2.2 };                                                   // sau hàng bồ đoàn thứ hai, trong điện
    Q.stand = { x: wx(0), z: wz(TF + 0.5), yaw: U.yawTo(wx(0), wz(TF + 0.5), alt.x, alt.z) };       // sát bàn thờ, quay vào tượng
    Q.cam = { pos: [wx(0.8), FY + 2.0, wz(5.4)], look: [alt.x, sy + 2.05 * ss, alt.z] };            // sát cửa trong (cách tượng ~8 m), máy thấp: trên màn hình dọc lõi máy quay kéo lùi tới ×1,5, ra ngoài thềm; máy ở y 3 thì tia ngắm vẫn lọt dưới dải vách trên cửa (y 4) và thấy trọn tượng
  }

  // ---------- nút dẫn đường (17-dien-phu.js thêm vào đồ thị) và chỗ đứng cho khách ----------
  const N = (x, z, id) => ({ x: wx(x), z: wz(z), id });
  const nodes = [
    N(0, 10.2, 'qacNam'), N(0, -10.2, 'qacBac'), N(-12.2, 0, 'qacTay'), N(12.2, 0, 'qacDong'),           // chân bốn bậc (bậc đông: nút nằm giữa đầu tay vịn 11,56 và tường bao 12,75 để còn nối được dọc dải đất sát tường)
    N(0, 6.72, 'qacThem'), N(0, -6.72), N(-8.72, 0), N(8.72, 0),                                         // đầu bốn bậc, trên nền
    N(-8.72, 6.72), N(8.72, 6.72), N(-8.72, -6.72), N(8.72, -6.72), N(-4.6, 6.72), N(4.6, 6.72), N(-4.6, -6.72), N(4.6, -6.72), // vòng hiên quanh điện
    N(0, 5.0, 'quan-am-cacDoor'), N(0, (C1 + C2) / 2 + 1.4, 'quan-am-cacIn'), N(-2.9, 2.6), N(2.9, 2.6), N(-4.2, 4.6), N(4.2, 4.6),
  ];
  const spots = [[-1.7, C1], [1.7, C1], [0, C2], [-1.7, C2], [1.7, C2]].map(([x, z]) => ({ x: wx(x), z: wz(z), yaw: U.yawTo(wx(x), wz(z), alt.x, alt.z) }));
  const h = {
    id: 'quan-am-cac', title: 'Quan Thế Âm Bồ Tát', extra: [], lamp: [wx(0), FY + 3.8, wz(1.4)], lampK: 0.85, // đèn điểm dùng chung của 17: đặt giữa gian, cách tượng hơn 4 m; mạnh hơn nữa thì tượng (vốn tự sáng 0,55) bị bạc màu
    cushion: { x: wx(0), z: wz(C1), y: FY + 0.16, yaw: U.yawTo(wx(0), wz(C1), alt.x, alt.z) }, altar: alt,
    front: { x: wx(0), z: wz(6.9) },                                                                    // điểm "Lễ Quan Âm": trên thềm, ngay trước ba gian cửa
    nodes, spots,
    cam: { pos: [wx(0.3), FY + 2.5, wz(5.6)], look: [wx(1.8), sy + ss * 1.25, wz(PZC)] },               // trong điện, sát cửa; nhìn lệch phải để tượng nằm bên trái bảng
    camP: { pos: [wx(0), FY + 1.9, wz(13.4)], look: [wx(0), FY - 1.9, wz(1.5)] },                       // màn hình dọc hẹp: đứng ngoài sân nhìn qua ba gian cửa
  };

  // =====================================================================
  //  BẢN DỰNG TẠM bằng khối (hiện ngay; ẩn khi mô hình tải xong; ở lại nếu tải lỗi)
  // =====================================================================
  const standIn = new THREE.Group(); standIn.name = 'qac:tam';
  {
    const SB = U.batch(), FB = U.batch(), MB = U.batch(), RC = 0x47474d, WD = 0x7e2a24;
    boxMM(FB, -PX, 0, -PZ, PX, FY, PZ, C.stone); boxMM(FB, -PX - 0.06, 0, -PZ - 0.06, PX + 0.06, 0.3, PZ + 0.06, C.stoneD);
    for (let k = 0; k < 5; k++) { // bốn bậc thang, mỗi bậc năm cấp
      const y = FY * (4.5 - k) / 5, a0 = k / 5, a1 = (k + 1) / 5, lz = (a) => PZ + a * (SZ - PZ), lx = (a) => PX + a * (SX - PX);
      for (const s of [-1, 1]) { boxMM(FB, -SW, 0, s * lz(a0), SW, y, s * lz(a1), k % 2 ? C.stone : C.stoneL); boxMM(FB, s * lx(a0), 0, -SW, s * lx(a1), y, SW, k % 2 ? C.stone : C.stoneL); }
    }
    for (const [x0, z0, x1, z1] of RAILS.slice(0, 8)) { boxMM(SB, Math.min(x0, x1) - 0.04, FY + 0.82, Math.min(z0, z1) - 0.04, Math.max(x0, x1) + 0.04, FY + 0.92, Math.max(z0, z1) + 0.04, WD); boxMM(SB, Math.min(x0, x1) - 0.03, FY + 0.12, Math.min(z0, z1) - 0.03, Math.max(x0, x1) + 0.03, FY + 0.82, Math.max(z0, z1) + 0.03, 0x93403a); }
    for (const [x0, z0, x1, z1] of WALLS) boxMM(SB, Math.min(x0, x1) - 0.08, FY, Math.min(z0, z1) - 0.08, Math.max(x0, x1) + 0.08, FY + 3, Math.max(z0, z1) + 0.08, WD);
    for (const [x, z] of COLS) cyl(SB, x, FY + 2.75, z, 0.17, 0.18, 5.5, C.wood, 8);
    for (const s of [-1, 1]) { boxMM(SB, -8, FY + 3, s * 6 - 0.08, 8, 5.3, s * 6 + 0.08, 0xb9907a); boxMM(SB, s * 8 - 0.08, FY + 3, -6, s * 8 + 0.08, 5.3, 6, 0xb9907a); }
    addRoof(SB, 0, 4.3, 0, 20.6, 16.6, 2.1, { curl: 0.45, sag: 0.1, seg: 8, color: RC, under: 0x8a5a3a, edge: 0x5a2420, metal: MB }); // under sáng: mặt dưới mái chỉ nhận ánh hắt từ đất, màu sẫm sẽ ra đen kịt
    for (const s of [-1, 1]) { boxMM(SB, -7.0, 6.0, s * 5.2 - 0.08, 7.0, 6.8, s * 5.2 + 0.08, 0x6a2a22); boxMM(SB, s * 7.0 - 0.08, 6.0, -5.2, s * 7.0 + 0.08, 6.8, 5.2, 0x6a2a22); } // dải vách giữa hai tầng mái (chỉ bốn mặt, để lòng điện thông lên mái)
    addRoof(SB, 0, 6.7, 0, 18.2, 14.6, 3.5, { curl: 0.45, sag: 0.08, seg: 8, color: RC, under: 0x8a5a3a, edge: 0x5a2420, metal: MB });
    const mv = (B, o) => { if (!B.list.length) return; const m = B.mesh(G.mats.vc, o); m.name = 'qac:tam'; m.position.set(OX, 0, OZ); m.matrixAutoUpdate = false; m.updateMatrix(); standIn.add(m); };
    mv(SB, { cast: true, receive: true }); mv(FB, { cast: false, receive: true }); mv(MB, { cast: false, receive: true });
  }
  scene.add(standIn);

  // =====================================================================
  //  MÔ HÌNH: tải sau khi game chạy; lỗi thì giữ bản tạm
  // =====================================================================
  const CREDIT = {
    text: 'Toà điện là mô hình "Procedural asian architecture test 3" của ghostnoface trên Sketchfab, giấy phép CC BY 4.0, đã chỉnh sửa cho vừa trò chơi (giảm số mặt, bỏ tấm trần, mở ba gian cửa, thu nhỏ ảnh bề mặt).',
    href: 'https://sketchfab.com/3d-models/procedural-asian-architecture-test-3-0384ffc832f44e979770b98a6d124f64',
    licence: 'https://creativecommons.org/licenses/by/4.0/',
  };
  const V = (W.quanAmCac = { site: SITE, state: 'idle', url: SITE.url, error: null, tris: 0, tries: 0, next: 2.5, credit: CREDIT, mesh: null, standIn, show: null });
  let Loader = null, Decoder = null, now = 0;
  const pickUrl = () => {
    const lowSaved = (() => { const a = Date.now() - ((G.save && G.save.data && +G.save.data.lowQ) || 0); return a >= 0 && a < 7 * 864e5; })();
    return (G.isTouch || lowSaved || (G.quality && G.quality.low) || !!(navigator.connection && navigator.connection.saveData)) ? SITE.urlLo : SITE.url; // tiết kiệm dữ liệu: lấy bản nhẹ
  };
  function place(gltf) {
    const root = gltf && (gltf.scene || (gltf.scenes && gltf.scenes[0]));
    if (!root) throw new Error('mô hình không có cảnh');
    root.updateMatrixWorld(true);
    const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
    // file đã ở đúng hệ toạ độ và đúng cỡ (18,9 × 22,9 m theo z × x): lệch cỡ quá 0,6 m nghĩa là file sai, thà giữ bản tạm còn hơn lệch với vật cản
    if (!(Math.abs(size.x - 2 * SX) < 0.6 && Math.abs(size.z - 2 * SZ) < 0.6 && size.y > 9 && size.y < 11.5)) throw new Error('mô hình sai cỡ: ' + [size.x, size.y, size.z].map((v) => v.toFixed(2)).join(' × '));
    const aniso = Math.min(8, G.renderer.capabilities.getMaxAnisotropy()), swap = new Map(); let tris = 0, maps = 0;
    const lam = (m) => { // vật liệu PBR của file → Lambert tô phẳng (file không có pháp tuyến), hai mặt; phần lưới mắt cáo dùng ảnh cắt theo alpha
      if (!m) return m;
      if (!swap.has(m)) {
        const cut = m.alphaTest > 0 || m.transparent;
        if (m.map) { m.map.anisotropy = aniso; m.map.needsUpdate = true; maps++; try { G.renderer.initTexture(m.map); } catch (e) { /* đẩy ảnh lên máy ngay lúc tải, như ba bộ nạp kia; lỗi thì để lần vẽ đầu tự làm */ } }
        swap.set(m, new THREE.MeshLambertMaterial({ map: m.map || null, color: m.color ? m.color.clone() : 0xffffff, flatShading: true, side: THREE.DoubleSide, alphaTest: cut ? 0.5 : 0 }));
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
    if (!maps) throw new Error('mô hình không có ảnh bề mặt');
    for (const m of swap.keys()) m.dispose();
    const hold = new THREE.Group(); hold.name = 'qac:mo-hinh'; hold.position.set(OX, 0, OZ); hold.add(root); hold.updateMatrixWorld(true);
    scene.add(hold);
    V.mesh = hold; V.tris = Math.round(tris);
    V.show = (model) => { hold.visible = !!model; standIn.visible = !model; if (Q) Q.creditHall = model ? CREDIT : null; try { G.renderer.shadowMap.needsUpdate = true; } catch (e) { /* bỏ qua */ } };
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
      V.url = (V.tries > 1 && V.url === SITE.url) ? SITE.urlLo : pickUrl(); // lần thử lại: bản nét hỏng thì lùi về bản nhẹ
      const loader = new Loader(); loader.setMeshoptDecoder(Decoder);
      const gltf = await loader.loadAsync(V.url);
      try { place(gltf); } catch (e) { V.tries = 99; throw e; }
      V.state = 'ready'; V.error = null;
    } catch (e) {
      V.error = (e && e.message) || String(e);
      if (V.tries < 2) { V.state = 'idle'; V.next = now + 45; }
      else { V.state = 'failed'; console.warn('[Quan Âm Các] không tải được mô hình toà điện — giữ bản dựng tạm: ' + V.error); }
    }
  }
  G.onUpdate((dt, t) => {
    now = t || 0;
    if (V.state !== 'idle' || now < V.next) return;
    const conn = navigator.connection;
    if (conn && conn.saveData) { const P = G.player; if (!P || !P.pos || Math.hypot(P.pos.x - OX, P.pos.z - OZ) > 40) return; } // tiết kiệm dữ liệu: chỉ tải khi đã qua cổng (chỗ vào game cách điện 44,5 m)
    load();
  }, 57);

  return h;
}
