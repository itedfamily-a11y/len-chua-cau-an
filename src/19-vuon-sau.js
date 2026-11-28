// =====================================================================
//  VƯỜN SAU CHÙA (module 19-vuon-sau): khu vườn có tường bao, rộng ~5 000 m² (72 × 69,3 m) ngay sau Đại Hùng Bảo Điện.
//  Chính điện không mở cửa sau: vào vườn bằng hai cổng nách ở hai bên sân chùa, sau hai sân bên (từ 2026-11-26 hai dãy hành lang dời ra x ±33,1…36; cổng x ±(21,4…23,4), tường sau của sân chùa z −118).
//  Trong vườn: hồ sen giữa vườn với đảo đá và tượng Quan Âm đứng (phỏng theo, không nêu tên một pho tượng thật), thủy tạ lục giác bên hồ
//  (hoạt động "Ngồi ngắm hồ sen"), hàng cây cảnh, cây bồ đề có ghế đá quanh gốc, rừng trúc, hoa đại, tùng, mai, quất, đèn đá, đom đóm.
//  Phần này gồm: (1) cấu trúc — tường, cổng, thảm cỏ, lối đá, bờ hồ + mặt nước, sàn thủy tạ, bồn bồ đề, vật cản, nút dẫn đường, chỗ cho khách AI,
//  độ cao sàn thủy tạ (G.heightAt), mặt bước chân (G.vuonSau.surfaceAt); (2) mô hình nghệ thuật — tượng, cây, sen, đèn, mái thủy tạ (phần "NGHỆ THUẬT" bên dưới).
//  Dựng theo toạ độ THẾ GIỚI, sau điện phụ (17) và TRƯỚC trang trí sân (12), cảnh vật (13), hiệu ứng (07-fx): 12 và 13 đọc nút / chỗ đứng / vật cản lúc dựng.
//  Ngân sách: ≤ 50 000 tam giác cho mọi thứ vườn thêm (tường, cổng, vườn), ≤ 12 lần vẽ, ≤ 3 texture, 0 đèn thật (đêm: quầng sáng glow như đèn đá trước chùa).
//  Mọi phần chạy trong safe(): lỗi một phần chỉ ghi vào G.errors, trò chơi vẫn dựng tiếp (cổng vẫn mở ra bãi cỏ trống).
//  2026-11-23: hai hoạt động "Viết lời cầu an" (dải lụa trên cây bồ đề) và "Thả hoa đăng" (đèn trên hồ sen) dời vào vườn: G.vuonSau.ribbonTree / lanternPond, gán vào W.tree / W.pond
//  2026-11-26: vườn tháp (9 tháp, hoạt động "Ngồi thở chánh niệm") dời vào dải cỏ phía đông của vườn; mô hình vẫn do 08-world2.js / 09-world2-geo.js dựng (G.L2.vuonThap).
//  2026-11-26: tháp Báo Nghiêm (cả cụm: tháp, vành nhiễu tháp, bia, hai đèn đá, điện Văn Thù) dời vào dải cỏ phía tây, tâm (−28,6; −151,5) — đối xứng với tháp Tổ của vườn tháp; mô hình do 08 / 09 / 17 dựng (G.L2.baoNghiem). Vườn bỏ ba cây hoa đại phía tây z −140 / −150 / −160; surfaceAt trả 'stone' trên vành nhiễu tháp.
//  (2026-11-25: cây bồ đề lớn và hồ sen ở sân trước đã bỏ; chỗ đứng của khách AI kiểu 'tree' / 'pond' cũng ở vườn). Xem mục 11 của docs/superpowers/specs/2026-11-20-vuon-sau-design.md.
// =====================================================================
function buildVuonSau(G) {
  const { THREE, util: U, scene } = G;
  const GB = G.build, W = G.world, col = G.collide;
  if (!GB || !W || !G.mats || !G.cam || !G.nav || !G.spots) return;
  const { C, BOX, box, boxMM, cyl, glow, addRoof } = GB;
  const PI = Math.PI, abs = Math.abs, hypot = Math.hypot;
  const failed = new Set();                                                       // tên các phần đã lỗi: ribbonTree / lanternPond chỉ được gán vào W.tree / W.pond khi phần của chúng dựng xong
  const safe = (name, fn) => { try { fn(); } catch (e) { failed.add(name); console.error('[vườn sau]', name, e); G.errors.push('vườn sau/' + name + ': ' + (e && e.message)); } };

  // =====================================================================
  //  SỐ LIỆU BỐ CỤC (mét, toạ độ thế giới; sâu hơn = z âm hơn). Mọi mô hình và vật cản đều đọc từ đây.
  // =====================================================================
  // 2026-11-28 (chủ chùa: "tượng Phật bé quá, hồ cũng hơi bé, cho hồ to hơn, dài hơn, mở rộng không gian ra"): vườn kéo dài về phía sau thêm DAI = VUON_DAI mét (00-core.js),
  // hồ dài thêm đúng chừng ấy (mép bắc giữ ở z −138, mép nam lùi), đảo + tượng dời về z −156 và lớn gấp TK lần; mọi thứ ở nửa nam của vườn (lối vòng cạnh nam, bồn bồ đề, rừng trúc, tường sau) lùi DAI.
  const DAI = typeof VUON_DAI === 'number' ? VUON_DAI : 0, ZS = -DAI;              // ZS: độ dời (âm) của nửa nam so với bản v5
  const TK = 3.0;                                                                  // bệ sen + tượng lớn gấp mấy lần bản v5 (tượng dựng bằng mã 3,0 m → 9,0 m)
  const RECT = { x0: -36, x1: 36, z0: -187.6 - DAI, z1: -118.3 };                 // lòng vườn (72 × 97,3 m khi DAI = 28; bản v5: 72 × 69,3 m = 4 990 m²)
  const GATES = [{ x0: -23.4, x1: -21.4, z: -118 }, { x0: 21.4, x1: 23.4, z: -118 }]; // hai cổng nách trên tường sau của sân chùa
  // hồ: x0…z1 là mép NƯỚC; bờ đá rộng 0,4 m nằm ngoài mép nước (như bờ ao Long Trì, 09-world2-geo.js); mặt nước y 0,04 (mặt đất lưới cỏ y −0,03 chưa khoét được, nên không hạ nước xuống −0,25)
  const POND = { x0: -16, x1: 16, z0: -162 - DAI, z1: -138, r: 4, water: 0.04, rimTop: 0.25, rim: 0.4 }; // 32 × 52 m khi DAI = 28 (bản v5: 32 × 24 m)
  const PCZ = (POND.z0 + POND.z1) / 2, PHX = (POND.x1 - POND.x0) / 2, PHZ = (POND.z1 - POND.z0) / 2;      // tâm hồ theo z, nửa bề ngang, nửa chiều dài
  const ISLAND = { x: 0, z: -156, r: 5.5, top: 1.2 };                              // 2026-11-28: đảo dời từ z −150 về −156 (cách bờ bắc 18 m, phần hồ dài nằm sau lưng tượng), bán kính 3,2 → 5,5
  const STATUE = { x: 0, z: -156, base: 1.1 + 0.5 * TK, h: 3.0 * TK, yaw: 0, k: TK }; // quay mặt về +z (phía chính điện và hai cổng); base: mặt bệ sen (1,6 ở bản v5 → 2,6); h: chiều cao thân tượng (19-quan-am-ho.js đặt mô hình cao đúng h)
  const PAV = { x: 17.5, z: -150, R: 3.4, floor: 0.45 };                           // thủy tạ lục giác: cạnh phẳng quay ±x, đỉnh ở ±z
  const PLANTER = { x: 0, z: -177 + ZS, r: 4.5, h: 0.5 };
  const PLACE = { x: 0, z: -124.5 };                                               // mục "Vườn sau chùa" trên bản đồ
  const POI = { x: 16.2, z: -150, yaw: -PI / 2 };                                  // "Ngồi ngắm hồ sen": đứng ở đây, nhìn về −x (tượng Quan Âm)
  const LOOP = { cx: 0, cz: PCZ, hx: 21, hz: PHZ + 5, r: 6 };                       // đường tâm lối vòng quanh hồ (hình chữ nhật bo góc), cách mép nước 5 m
  const PATHW = 1.5;                                                               // nửa bề rộng lối đá (lối rộng 3 m)
  const BED = { x0: -17.5, x1: 17.5, z0: -122.3, z1: -118.3 };                      // bồn sỏi hàng cây cảnh (có gờ đá thấp), sát tường sau sân chùa
  const APRON = { x0: -20.7, x1: 20.7, z0: -125.3, z1: -122.3 };                    // thềm đá trước bồn cây cảnh
  const HEX_A = PAV.R * Math.cos(PI / 6);                                          // 2,9445: khoảng cách từ tâm tới cạnh phẳng
  const XE = PAV.x + HEX_A;                                                        // 20,4445: mép đông của sàn (chân bậc)
  const STEP_RUN = 1.05, STEP_HALF = 1.0;                                          // ba bậc dài 1,05 m, rộng 2,0 m (z −151…−149)

  // vị trí các vật trong vườn (mô hình dựng ở phần "NGHỆ THUẬT", vật cản + chỗ ngồi đăng ký ở phần cấu trúc)
  const BONSAI = [-16, -12, -8, -4, 0, 4, 8, 12, 16].map((x) => ({ x, z: -121.5 }));
  const LANTERNS = [
    [-23.2, -140], [-23.2, -157], [-23.2, -164], [23.2, -140], [23.2, -157], [23.2, -164],  // dọc lối vòng (phía ngoài; chừa đoạn z −149…−151 phía đông cho lối lên thủy tạ)
    [-2.1, -129], [2.1, -129], [-2.1, -169.5 + ZS], [2.1, -169.5 + ZS],                     // hai bên lối trục
    [-24.2, -127.5], [24.2, -127.5],                                                         // dọc lối từ cổng
    [-19.9, -120.4], [19.9, -120.4],                                                         // một đèn trong mỗi cổng
    ...(DAI >= 20 ? [[-23.2, -176], [23.2, -176], [-23.2, -162 + ZS], [23.2, -162 + ZS]] : []), // 2026-11-28: đoạn lối vòng mới dọc phần hồ kéo dài (phía nam vườn tháp / bảo tháp)
  ].map(([x, z]) => ({ x, z }));
  const benchAt = (x, z, yaw, where) => ({ x, z, yaw, y: 0.42, where });             // ghế đá 1,8 × 0,55, mặt ghế cao 0,42 trên nền
  const BENCHES = [];
  for (const a of [PI / 4, 3 * PI / 4, -PI / 4, -3 * PI / 4]) { // 4 ghế quanh gốc bồ đề (bán kính 6,5), mặt quay vào cây
    const x = PLANTER.x + 6.5 * Math.sin(a), z = PLANTER.z + 6.5 * Math.cos(a);
    BENCHES.push(benchAt(x, z, U.yawTo(x, z, PLANTER.x, PLANTER.z), 'bodhi'));
  }
  const HO_Z = [-142.5, -157.5]; for (let z = -172.5; z > POND.z0 + 3; z -= 15) HO_Z.push(z);                    // 2026-11-28: thêm ghế mỗi 15 m dọc phần hồ kéo dài (DAI = 28: z −172,5 và −187,5)
  for (const x of [-18.4, 18.4]) for (const z of HO_Z) BENCHES.push(benchAt(x, z, x < 0 ? PI / 2 : -PI / 2, 'ho')); // ghế dọc lối vòng, mặt quay ra hồ (bản v5: 4 ghế)
  const PAV_BENCHES = [{ x: 18.9, z: -151.7, yaw: -PI / 2, y: PAV.floor + 0.42 }, { x: 18.9, z: -148.3, yaw: -PI / 2, y: PAV.floor + 0.42 }]; // trong thủy tạ: chỉ người chơi ngồi (không cho khách AI)
  // hàng hoa đại hai bên; cả hai phía bỏ ba cây z −140 / −150 / −160 (2026-11-26: phía đông là vườn tháp, 08-world2.js G.L2.vuonThap; phía tây là tháp Báo Nghiêm, G.L2.baoNghiem; cùng dựng ở 09-world2-geo.js)
  const FRANGI = []; for (const sx of [-1, 1]) [-130, -140, -150, -160, -170].forEach((z, i) => { if (!(z <= -140 && z >= -160)) FRANGI.push({ x: sx * 29, z, seed: 700 + i + (sx > 0 ? 5 : 0) }); });
  for (const sx of [-1, 1]) for (let z = -182, i = 0; z > RECT.z0 + 16; z -= 12, i++) FRANGI.push({ x: sx * 29, z, seed: 720 + i + (sx > 0 ? 10 : 0) }); // 2026-11-28: thêm hoa đại dọc hai dải bên của phần vườn kéo dài
  const CYPRESS = []; for (const sx of [-1, 1]) for (const z of [-121.6, -125.6]) CYPRESS.push({ x: sx * 26.4, z, s: 1.5, seed: 800 + CYPRESS.length });
  const BAMBOO = [{ x: -30, z: -181 + ZS, r: 4.4, seed: 900 }, { x: 30, z: -181 + ZS, r: 4.4, seed: 901 }];
  const BEDS = [{ x: -30.8, z: -122.4, w: 4.0, d: 1.6 }, { x: 30.8, z: -122.4, w: 4.0, d: 1.6 }]; // bồn mai – quất gần mỗi cổng
  // hai điểm dạo gần chỗ đứng mới của hoạt động (đèn hoa đăng ở (0, −136,9), dải lụa ở (0, −171,75)) dời sang bên: cách chỗ đứng ≥ 2,5 m và không nằm trên lối đi thẳng tới chỗ đứng
  const STROLL = [[-6, -125.8, 0], [6, -125.8, 0], [-21, -146, PI / 2], [21, -146, -PI / 2], [-21, -154, PI / 2], [21, -154, -PI / 2], [-3.4, -135.2, U.yawTo(-3.4, -135.2, STATUE.x, STATUE.z)], [-3.2, -168.9 + ZS, U.yawTo(-3.2, -168.9 + ZS, PLANTER.x, PLANTER.z)]];
  const LAN_REL = { x: 0, z: -139.1 };                                            // chỗ đặt đèn hoa đăng xuống nước (cách mép nước bắc 1,1 m); lá sen, hoa, nụ cách chỗ này ≥ 1,8 m
  // 6 cành thấp của cây bồ đề để buộc dải lụa: [góc từ +x quay về +z (π/2 = phía bắc, phía chỗ đứng), bán kính ngang tới đầu cành, y chỗ mọc từ thân, y đầu cành]: 6 cành đối xứng qua trục bắc – nam (cặp chéo bắc 45° ±, cặp đông / tây, cặp lệch nam 20° so với đông / tây), không cành nào chĩa thẳng về phía chỗ đứng (dải xếp chồng lên nhau khi nhìn dọc cành) và không dải nào khuất sau thân; 20 / 30 neo nằm ở phía bắc thân cây
  const LOW = [[0.78, 4.0, 3.35, 3.72], [2.36, 4.0, 3.35, 3.72], [0.25, 3.9, 3.45, 3.82], [2.89, 3.9, 3.45, 3.82], [-0.35, 3.7, 3.5, 3.9], [3.49, 3.7, 3.5, 3.9]];

  // =====================================================================
  //  HÀM HÌNH HỌC THUẦN
  // =====================================================================
  const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
  const segD = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = clamp01(((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)); return hypot(px - ax - dx * t, pz - az - dz * t); };
  // khoảng cách có dấu tới hình chữ nhật bo góc (tâm cx,cz; nửa cạnh hx,hz; bán kính r): âm là bên trong
  const sdRR = (x, z, cx, cz, hx, hz, r) => { const qx = abs(x - cx) - (hx - r), qz = abs(z - cz) - (hz - r); return hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - r; };
  // trong lục giác (tâm PAV, bán kính ngoại tiếp R): các cạnh phẳng quay ±x và ±60°
  const inHex = (x, z, R = PAV.R) => {
    const a = R * Math.cos(PI / 6), dx = x - PAV.x, dz = z - PAV.z;
    return abs(dx) <= a && abs(dx * 0.5 + dz * 0.8660254) <= a && abs(dx * 0.5 - dz * 0.8660254) <= a;
  };
  // đi dọc chu vi hình chữ nhật bo góc, mỗi ~ds mét một điểm (khép kín)
  const rrPoints = (cx, cz, hx, hz, r, ds) => {
    const pts = [];
    const seg = (x0, z0, x1, z1) => { const n = Math.max(1, Math.round(hypot(x1 - x0, z1 - z0) / ds)); for (let i = 0; i < n; i++) pts.push([x0 + ((x1 - x0) * i) / n, z0 + ((z1 - z0) * i) / n]); };
    const arc = (ax, az, a0, a1) => { const n = Math.max(2, Math.round((r * abs(a1 - a0)) / ds)); for (let i = 0; i < n; i++) { const a = a0 + ((a1 - a0) * i) / n; pts.push([ax + r * Math.cos(a), az + r * Math.sin(a)]); } };
    seg(cx + hx, cz + hz - r, cx + hx, cz - hz + r); arc(cx + hx - r, cz - hz + r, 0, -PI / 2);
    seg(cx + hx - r, cz - hz, cx - hx + r, cz - hz); arc(cx - hx + r, cz - hz + r, -PI / 2, -PI);
    seg(cx - hx, cz - hz + r, cx - hx, cz + hz - r); arc(cx - hx + r, cz + hz - r, PI, PI / 2);
    seg(cx - hx + r, cz + hz, cx + hx - r, cz + hz); arc(cx + hx - r, cz + hz - r, PI / 2, 0);
    return pts;
  };

  // =====================================================================
  //  MẶT ĐÁ / MẶT CỎ / ĐỘ CAO SÀN THUỶ TẠ (dữ liệu thuần, đọc được ngay cả khi phần dựng hình lỗi)
  // =====================================================================
  const inside = (x, z) => x >= RECT.x0 && x <= RECT.x1 && z >= RECT.z0 && z <= RECT.z1;
  const onStone = (x, z) => {
    if (x >= APRON.x0 && x <= APRON.x1 && z <= APRON.z1 && z >= APRON.z0) return true;                       // thềm trước bồn cây cảnh
    for (const s of [-1, 1]) if (segD(x, z, s * 22.4, -118.3, s * 21, -133) <= PATHW) return true;             // lối từ cổng
    if (abs(sdRR(x, z, LOOP.cx, LOOP.cz, LOOP.hx, LOOP.hz, LOOP.r)) <= PATHW) return true;                    // lối vòng quanh hồ
    if (abs(x) <= PATHW && ((z <= APRON.z1 && z >= POND.z1) || (z <= POND.z0 && z >= -172.5 + ZS))) return true; // lối trục: thềm → bờ hồ, bờ hồ → bồn bồ đề
    return false;
  };
  const TP = G.L2 && G.L2.vuonThap && G.L2.vuonThap.pad;                                                    // nền lát đá của vườn tháp (2026-11-26)
  const BNT = G.L2 && G.L2.baoNghiem;                                                                       // tháp Báo Nghiêm (2026-11-26): vành nhiễu tháp lát đá r 2,45…4,46 + bệ tháp
  const surfaceAt = (x, z) => (!inside(x, z) ? null : onStone(x, z) || (TP && x >= TP.x0 && x <= TP.x1 && z >= TP.z0 && z <= TP.z1) || (BNT && hypot(x - BNT.x, z - BNT.z) <= 5.5) ? 'stone' : 'grass');
  // độ cao sàn thủy tạ + ba bậc ở phía đông (dốc tuyến tính như các bậc đá của 08-world2.js); null nếu ngoài thủy tạ
  const pavilionAt = (x, z) => {
    if (inHex(x, z)) return PAV.floor;
    if (x > XE && x < XE + STEP_RUN && abs(z - PAV.z) <= STEP_HALF) return PAV.floor * (1 - (x - XE) / STEP_RUN);
    return null;
  };
  const inPond = (x, z, m = 0) => abs(x) < PHX + m && z < POND.z1 + m && z > POND.z0 - m && sdRR(x, z, 0, PCZ, PHX + m, PHZ + m, POND.r + m) <= 0;

  // dữ liệu công khai (các module khác và bài kiểm tra đọc); tris / meshes điền ở cuối
  const V = (G.vuonSau = {
    rect: RECT, gates: GATES, pond: POND, island: ISLAND, statue: STATUE, pavilion: PAV, planter: PLANTER,
    place: PLACE, poi: POI, spots: [], tris: 0, meshes: 0, tally: {}, decorHidden: false, petalSources: 0,
    layout: { bonsai: BONSAI, lanterns: LANTERNS, benches: BENCHES, pavBenches: PAV_BENCHES, frangipani: FRANGI, cypress: CYPRESS, bamboo: BAMBOO, beds: BEDS, bed: BED, apron: APRON, loop: LOOP },
    inside, surfaceAt, pavilionAt, inPond, dai: DAI,
  });

  // heightAt: sàn thủy tạ và ba bậc (bọc lên chuỗi 00 → 08 → 17 → 18; chỉ vùng thủy tạ khác 0)
  {
    const baseHeight = G.heightAt;
    G.heightAt = (x, z) => {
      if (x > 13.9 && x < 21.7 && z < -145.9 && z > -154.1) { const h = pavilionAt(x, z); if (h !== null) return h; }
      return baseHeight(x, z);
    };
  }

  // =====================================================================
  //  VẬT CẢN (mặt phẳng XZ, như col.* của các module khác)
  // =====================================================================
  const WALLS = [[-36.6, -187.9 + ZS, 36.6, -187.9 + ZS], [36.3, -188.2 + ZS, 36.3, -118], [-36.3, -188.2 + ZS, -36.3, -118], [24.3, -118, 36.6, -118], [-36.6, -118, -24.3, -118]]; // sau, hai bên, hai đoạn chắn phía trước
  const benchCols = (b) => { for (const s of [-0.75, 0.75]) col.circle(b.x + Math.cos(b.yaw) * s, b.z - Math.sin(b.yaw) * s, 0.22, 'bench'); };
  safe('vật cản', () => {
    for (const [x0, z0, x1, z1] of WALLS) {
      const alongX = abs(x1 - x0) > abs(z1 - z0);
      const bx0 = Math.min(x0, x1) - (alongX ? 0 : 0.3), bz0 = Math.min(z0, z1) - (alongX ? 0.3 : 0), bx1 = Math.max(x0, x1) + (alongX ? 0 : 0.3), bz1 = Math.max(z0, z1) + (alongX ? 0.3 : 0);
      col.box(bx0, bz0, bx1, bz1, 'wall');
      // máy quay theo sau người chơi đứng sát tường không được xuyên ra ngoài (ngoài tường sau là dải cây cao 2…6 m, ngoài tường bên là dải cây và cỏ): hộp chắn cao 8 m (g01 B23)
      G.cam.blockers.push(new THREE.Box3(new THREE.Vector3(bx0, 0, bz0), new THREE.Vector3(bx1, 8, bz1)));
    }
    // hai đầu tường chắn phía trước kéo dài ra tới ranh giới đi lại x ±37 (vật cản thôi, không vẽ): ranh giới giữ tâm người chơi ở ±36,65 còn tường chỉ tới ±36,6, nên ở bước khung hình lớn
    // người chơi từ sân trước lọt nửa người vào đầu tường rồi đi dọc mặt ngoài tường bên (g03-rail-sweep.mjs). 2026-11-26: tường bao sân chùa đã dời ra x ±36,3 (nối thẳng với tường bên của vườn) nên không còn dải ngoài tường ở đây; hai hộp này chỉ còn vá mối nối, giữ nguyên
    col.box(36.6, -118.3, 37.4, -117.7, 'wall'); col.box(-37.4, -118.3, -36.6, -117.7, 'wall');
    // hồ + bờ (hình chữ nhật bo góc x ±16,4, z −137,6…−162,4, góc bo 4,4), chừa chỗ cho sàn thủy tạ ở mép đông (z −153…−147)
    // 2026-11-28: tính từ POND (hồ dài thêm): zs / zn = mép ngoài bờ nam / bắc
    const zs = POND.z0 - 0.4, zn = POND.z1 + 0.4;
    col.box(-16.4, zs + 4.4, 12, zn - 4.4, 'pond'); col.box(-12, zs, 12, zn, 'pond');
    col.box(12, zs + 4.4, 16.4, PAV.z - 3, 'pond'); col.box(12, PAV.z + 3, 16.4, zn - 4.4, 'pond'); col.box(12, PAV.z - 3, 14.4, PAV.z + 3, 'pond');
    for (const sx of [-1, 1]) for (const cz of [zn - 4.4, zs + 4.4]) col.circle(sx * 12, cz, 4.4, 'pond');
    col.circle(ISLAND.x, ISLAND.z, ISLAND.r + 0.3, 'island');
    // thủy tạ: sáu chân trụ ở đỉnh lục giác, lan can (chuỗi vòng tròn nhỏ) trên năm cạnh — trừ cạnh đông có bậc —, má bậc, hai ghế trong thủy tạ
    const hv = []; for (let k = 0; k < 6; k++) hv.push([PAV.x + PAV.R * Math.sin((k * PI) / 3), PAV.z + PAV.R * Math.cos((k * PI) / 3)]); // k=0: đỉnh +z; đi theo chiều kim đồng hồ nhìn từ trên
    // bán kính 0,35 (không phải 0,22 / 0,12 như nét vẽ): ở bước khung hình lớn (điện thoại ~30 hình/giây, tốc độ Nhanh 4 m/s) đẩy-ra tuần tự hai lượt của G.collide.resolve
    // làm điểm trượt qua khe giữa hai vòng tròn nhỏ; vòng 0,35 chồng nhau đủ dày để kín tới bước 0,13 m (g03-rail-sweep.mjs). Người chơi dừng cách lan can vẽ khoảng 0,7 m.
    for (const [x, z] of hv) col.circle(x, z, 0.35, 'pier');
    for (let k = 0; k < 6; k++) {
      const a = hv[k], b = hv[(k + 1) % 6];
      if (a[0] > XE - 0.01 && b[0] > XE - 0.01) continue; // cạnh đông (hai đỉnh x = 20,44): lối lên bậc
      for (let i = 1; i <= 3; i++) col.circle(a[0] + ((b[0] - a[0]) * i) / 4, a[1] + ((b[1] - a[1]) * i) / 4, 0.35, 'rail');
    }
    col.box(XE - 0.1, PAV.z - STEP_HALF - 0.4, XE + STEP_RUN + 0.1, PAV.z - STEP_HALF, 'step'); col.box(XE - 0.1, PAV.z + STEP_HALF, XE + STEP_RUN + 0.1, PAV.z + STEP_HALF + 0.4, 'step');
    for (const b of PAV_BENCHES) col.box(b.x - 0.275, b.z - 0.7, b.x + 0.275, b.z + 0.7, 'bench');
    // bồn cây cảnh, bồn bồ đề, ghế, đèn, cây
    col.box(BED.x0, BED.z0, BED.x1, BED.z1, 'bed');
    col.circle(PLANTER.x, PLANTER.z, PLANTER.r + 0.1, 'planter');
    for (const b of BENCHES) benchCols(b);
    for (const l of LANTERNS) col.circle(l.x, l.z, 0.42, 'stonelamp');
    for (const t of FRANGI) col.circle(t.x, t.z, 0.4, 'tree');
    for (const t of CYPRESS) col.circle(t.x, t.z, 0.34 * t.s + 0.05, 'tree');
    for (const t of BAMBOO) col.circle(t.x, t.z, t.r, 'bamboo');
    for (const b of BEDS) col.box(b.x - b.w / 2 - 0.05, b.z - b.d / 2 - 0.05, b.x + b.w / 2 + 0.05, b.z + b.d / 2 + 0.05, 'bed');
  });

  // =====================================================================
  //  ĐIỂM MỐC DẪN ĐƯỜNG (cạnh do G.nav.build() tự nối giữa các nút nhìn thấy nhau, như mọi khu khác)
  // =====================================================================
  safe('dẫn đường', () => {
    const N = (x, z, id) => G.nav.add(x, z, id);
    for (const s of [-1, 1]) {
      const t = s < 0 ? 'T' : 'D';                                                    // T = tây (x âm), D = đông
      N(s * 22.4, -116.5, 'vuonCongTrong' + t); N(s * 22.4, -120.2, 'vuonCongNgoai' + t);   // hai nút ở hai bên cổng (nối với nút sân bên (±27, −110) của 08-world2.js; từ 2026-11-26 hành lang ở x ±33,1…36)
      N(s * 22.3, -124.3, 'vuonLoiCong' + t); N(s * 21.6, -129); N(s * 21, -133);
      N(s * 12, -124.3); N(s * 6, -124.3); N(s * 17.5, -124.3);                         // thềm trước bồn cây cảnh
      N(s * 7.5, -133); N(s * 15, -133); N(s * 19.24, -134.76);                          // vòng quanh hồ: cạnh bắc + góc
      for (const z of [-139, -161 + ZS]) N(s * 21, z);                                   // hai đầu cạnh đông / tây
      N(s * 19.24, -164.24 + ZS); N(s * 15, -167 + ZS); N(s * 7.5, -167 + ZS);            // cạnh nam + góc
      for (const z of HO_Z) N(s * 17.2, z, 'vuonGheHo');                                  // trước các ghế dọc lối vòng
      N(s * 17.2, -139.5); N(s * 17.2, HO_Z[HO_Z.length - 1] - 3);                         // nối ghế với lối vòng (đi dọc hàng ghế, không xuyên mặt ghế)
      for (let z = -162.5; z > -161 + ZS + 2; z -= 7.5) N(s * 21, z);                      // 2026-11-28: dọc cạnh đông / tây của phần hồ kéo dài, mỗi 7,5 m
    }
    for (const z of [-145, -150, -155]) N(-21, z);                                       // cạnh tây của lối vòng
    N(22.3, -146); N(22.3, -154); N(22.3, -150, 'vuonChanBac');                          // cạnh đông đi vòng ngoài hai má bậc thủy tạ (x ≥ 22,3), nút giữa là chân ba bậc
    N(0, -133, 'vuonTruc'); N(0, -167 + ZS); N(0, -128.5);
    N(19.6, -150, 'vuonThuyTa'); N(17.4, -150, 'vuonThuyTaGiua');                         // trên sàn thủy tạ (giữa hai ghế, tới chỗ đứng (16,2; −150))
    for (let k = 0; k < 8; k++) { const a = (k * PI) / 4; N(PLANTER.x + 5.65 * Math.sin(a), PLANTER.z + 5.65 * Math.cos(a), 'vuonBoDe'); } // vòng quanh bồn bồ đề, trước bốn ghế
  });

  // =====================================================================
  //  CHỖ CHO KHÁCH AI (G.spots.vuon, kiểu 'vuon' của 20-crowd.js): ghế đá để ngồi, điểm dạo để đứng ngắm
  // =====================================================================
  safe('chỗ khách', () => {
    const list = G.spots.vuon = V.spots = [];
    for (const b of BENCHES) list.push({ x: b.x + Math.sin(b.yaw) * 0.05, z: b.z + Math.cos(b.yaw) * 0.05, yaw: b.yaw, y: b.y, kind: 'bench' });
    for (const [x, z, yaw] of STROLL) list.push({ x, z, yaw, kind: 'stroll' });
    // khách AI kiểu 'tree' (ngước nhìn tán, vái) và 'pond' (đứng ngắm hồ) của 20-crowd.js: cây bồ đề lớn và hồ sen ở sân trước đã bỏ 2026-11-25, nên chỗ đứng chỉ còn ở vườn
    // quanh bồn bồ đề (bán kính 5,6; tránh phía bắc là chỗ đứng treo dải lụa, tránh bốn góc chéo là bốn ghế) và trên cỏ bờ hồ (bắc, tây, nam; phía đông là thủy tạ), mặt quay vào cây / về tượng
    G.spots.tree = [PI / 2, -PI / 2, PI, PI - 0.45, 0.45 - PI].map((a) => { const x = PLANTER.x + 5.6 * Math.sin(a), z = PLANTER.z + 5.6 * Math.cos(a); return { x, z, yaw: U.yawTo(x, z, PLANTER.x, PLANTER.z) }; });
    G.spots.pond = [[-9, -136.6], [8.5, -136.6], [-17.3, -147], [-17.3, -153], [-8, -163.4 + ZS], [8, -163.4 + ZS], ...(DAI >= 20 ? [[-17.3, -165], [-17.3, -180], [17.3, -165], [17.3, -180]] : [])].map(([x, z]) => ({ x, z, yaw: U.yawTo(x, z, STATUE.x, STATUE.z) }));
  });

  // =====================================================================
  //  TAY NẮM CHO HOẠT ĐỘNG "NGỒI NGẮM HỒ SEN" + vùng mái, vùng cấm, đom đóm (đăng ký TRƯỚC 12, 13 và hiệu ứng)
  // =====================================================================
  safe('tay nắm', () => {
    const seat = PAV_BENCHES[0];
    W.ext = W.ext || {};
    W.ext.thuyTa = {
      poi: { x: POI.x, z: POI.z, r: 3.4 }, stand: { x: POI.x, z: POI.z, yaw: POI.yaw },
      seat: { x: seat.x, z: seat.z, yaw: seat.yaw, y: seat.y },                              // ghế phía nam trong thủy tạ, mặt ghế cao 0,87
      cam: { pos: [14.95, PAV.floor + 1.3, PAV.z - 0.4], look: [STATUE.x, STATUE.base + STATUE.h * 0.45, STATUE.z] },      // 2026-11-28: tượng nay cao 9 m và lệch về z −156: máy quay cũ (sau lưng người ngồi, [20,3; 1,75; −152,9] nhìn [9; 1,5; −150]) bị cột và mái thủy tạ che gần hết tượng, nên dời ra sát lan can phía tây, thấp, ngước nhìn qua hồ lên tượng (tầm mắt người ngồi)
    };
    G.roofZones.push([14.9, 20.1, -152.3, -147.7]);                                            // dưới mái thủy tạ: máy quay đứng gần, bước chân 'hall' (gỗ)
    G.decorBans = G.decorBans || []; G.decorBans.push([RECT.x0 - 1, RECT.x1 + 1, RECT.z0 - 1, RECT.z1 + 0.7]); // 12-decor-inside không rải gì vào vườn
    W.fireflyAreas.push({ x: 0, z: -150, r: 14 });                                             // đom đóm quanh hồ (dùng bể đom đóm có sẵn của 07-fx.js)
    if (DAI >= 20) W.fireflyAreas.push({ x: 0, z: -150 + ZS, r: 14 });                         // 2026-11-28: và quanh nửa nam của hồ kéo dài
  });

  // =====================================================================
  //  BỘ GOM HÌNH: mỗi vật liệu một mesh
  // =====================================================================
  // S: cấu trúc (tường, cổng, sàn thủy tạ, bồn; đổ bóng) · Fl: phẳng/nhỏ (thảm cỏ, bờ hồ; không đổ bóng) · PATH: lối đá · LB: thân đèn (MeshBasic) · GD: kim loại / vàng
  // DEC: trang trí rắn (cây, tượng, ghế, đèn đá; đổ bóng) · DECF: trang trí phẳng/nhỏ (sen; không đổ bóng). GD, DEC, DECF nằm trong nhóm "near", ẩn khi máy quay còn ở phía trước chính điện (xem 'ẩn khi xa')
  const S = U.batch(), Fl = U.batch(), PATH = U.batch(), LB = U.batch(), GD = U.batch(), DEC = U.batch(), DECF = U.batch();
  const CAY = U.batch(); // 2026-11-27: thân + tán của tùng, cây trong chậu cảnh và cây bồ đề (trừ 6 cành thấp buộc dải lụa, vẫn ở DEC) đi riêng một lưới 'vuonSau:cay' trong nhóm "near" để 13-cay-mo-hinh.js ẩn đi khi mô hình cây tải xong; chỗ đứng ghi vào G.cayDat (nhom: 'vuon' = mô hình cũng vào nhóm "near", ẩn hiện theo vườn)
  const SEN = U.batch(); // 2026-11-28: lá, hoa, nụ sen dựng bằng mã đi riêng một lưới 'vuonSau:sen' trong nhóm "near" để 19-sen-ho.js ẩn đi khi mô hình sen tải xong; chỗ đặt ghi vào V.pads (lá nổi, hoa trên 22 lá đầu, nụ ở 10 lá kế) và V.senCao (12 lá vươn cao)
  const TUONG = U.batch(); // 2026-11-28: thân tượng Quan Âm dựng bằng mã (áo, đầu, hào quang, tay, bình) đi riêng một lưới 'vuonSau:tuong' trong nhóm "near" để 19-quan-am-ho.js ẩn đi khi mô hình tượng tải xong; bệ sen vẫn ở DEC
  const DEN = U.batch(), DENS = U.batch(); // 2026-11-28: đèn đá dựng bằng mã đi riêng hai lưới 'vuonSau:denda' (thân đá, nhóm "near") và 'vuonSau:denda-sang' (hộp sáng, nhóm "far") để 19-den-da.js ẩn đi khi mô hình đèn tải xong; quầng sáng giữ nguyên
  const cayGhi = (o) => { (G.cayDat || (G.cayDat = [])).push(o); };
  const own = [];                                  // hình gốc tạm, giải phóng ở cuối
  const mk = (g) => (own.push(g), g);
  const _col = new THREE.Color();
  // ghi tam giác thô: vị trí + pháp tuyến hướng lên + màu theo đỉnh
  const Raw = () => ({ p: [], c: [] });
  const quadUp = (R, x0, z0, x1, z1, y, colFn) => { // x0<x1, z0<z1; colFn(x,z) → [r,g,b]
    for (const [x, z] of [[x0, z0], [x0, z1], [x1, z1], [x0, z0], [x1, z1], [x1, z0]]) { R.p.push(x, y, z); R.c.push(...colFn(x, z)); }
  };
  const rawGeo = (R) => {
    const g = new THREE.BufferGeometry(), n = R.p.length / 3, nor = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) nor[i * 3 + 1] = 1;
    g.setAttribute('position', new THREE.Float32BufferAttribute(R.p, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(R.c, 3));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  };
  const trisOf = (B) => { let n = 0; for (const g of B.list) n += g.attributes.position.count / 3; return n; };
  const tally = V.tally, totalNow = () => trisOf(S) + trisOf(Fl) + trisOf(PATH) + trisOf(LB) + trisOf(GD) + trisOf(DEC) + trisOf(DECF) + trisOf(CAY) + trisOf(SEN) + trisOf(TUONG) + trisOf(DEN) + trisOf(DENS);
  const count = (name, fn) => { const t0 = totalNow(); safe(name, fn); tally[name] = Math.round(totalNow() - t0); };

  // ---------- tường bao vườn: cùng kiểu và cùng chiều cao với tường sân chùa (wall() ở 05-world.js:349) ----------
  count('tường vườn', () => {
    for (const [x0, z0, x1, z1] of WALLS) {
      const lx = abs(x1 - x0), lz = abs(z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, alongX = lx > lz, L = Math.max(lx, lz);
      const sz = (a, b) => (alongX ? [a, 0, b] : [b, 0, a]);
      const s1 = sz(L, 0.45), s2 = sz(L + 0.1, 0.62), s3 = sz(L + 0.2, 0.8), s4 = sz(L + 0.2, 0.22);
      box(S, cx, 0.2, cz, s2[0], 0.4, s2[2], C.stoneD); box(S, cx, 1.05, cz, s1[0], 1.3, s1[2], C.ochre);
      box(S, cx, 1.78, cz, s3[0], 0.18, s3[2], C.roof); box(S, cx, 1.93, cz, s4[0], 0.14, s4[2], C.ridge);
      for (let t = 0; t <= L + 0.01; t += 6) {
        const px = alongX ? Math.min(x0, x1) + t : cx, pz = alongX ? cz : Math.min(z0, z1) + t;
        box(S, px, 1.0, pz, 0.62, 2.0, 0.62, C.ochreD); box(S, px, 2.08, pz, 0.78, 0.16, 0.78, C.ridge);
      }
    }
  });

  // ---------- hai cổng nách: hai trụ, xà, mái ngói nhỏ (cao thông thủy 2,9 m), ngưỡng đá ----------
  count('cổng nách', () => {
    for (const g of GATES) {
      const cx = (g.x0 + g.x1) / 2, sx = Math.sign(cx);
      for (const px of [sx * 21.15, sx * 23.65]) { box(S, px, 1.45, g.z, 0.5, 2.9, 0.7, C.ochreD); box(S, px, 2.98, g.z, 0.66, 0.16, 0.86, C.ridge); }
      box(S, cx, 3.0, g.z, 3.1, 0.2, 0.5, C.woodD);                                                                 // xà ngang trên hai trụ
      addRoof(S, cx, 3.1, g.z, 3.8, 1.9, 0.9, { curl: 0.3, seg: 4, metal: GD });
      boxMM(Fl, g.x0, 0, g.z - 0.5, g.x1, 0.024, g.z + 0.5, C.stoneL);                                              // ngưỡng đá lấp khe giữa nền sân (z −118) và vườn (z −118,3)
    }
  });

  // ---------- thảm cỏ: lưới ô 6 m, màu theo đỉnh (cùng bảng màu mặt cỏ ở 05-world.js:304) ----------
  count('thảm cỏ', () => {
    const a = new THREE.Color(0x5f8a3a), b = new THREE.Color(0x7d9a45), tmp = new THREE.Color(), R = Raw();
    const grass = (x, z) => { const n = Math.sin(x * 0.21) * Math.cos(z * 0.17) * 0.5 + 0.5; tmp.copy(a).lerp(b, n); return [tmp.r, tmp.g, tmp.b]; };
    const nx = 12, nz = Math.round((RECT.z1 - RECT.z0) / 6.3), dx = (RECT.x1 - RECT.x0) / nx, dz = (RECT.z1 - RECT.z0) / nz;
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) quadUp(R, RECT.x0 + i * dx, RECT.z0 + j * dz, RECT.x0 + (i + 1) * dx, RECT.z0 + (j + 1) * dz, 0.006, grass);
    Fl.addGeo(rawGeo(R));
  });

  // ---------- lối đá: lưới phiến 0,8 m, phiến nào nằm trong lối (onStone) thì có một ô sáng màu; khe giữa các phiến để lộ cỏ ----------
  count('lối đá', () => {
    const CELL = 0.8, SL = 0.72, R = Raw(), rnd = U.rng(1907), tmp = new THREE.Color();
    for (let i = Math.floor(RECT.x0 / CELL); i < Math.ceil(RECT.x1 / CELL); i++) for (let j = Math.floor(RECT.z0 / CELL); j < Math.ceil(RECT.z1 / CELL); j++) {
      const cx = (i + 0.5) * CELL, cz = (j + 0.5) * CELL;
      if (!inside(cx, cz) || !onStone(cx, cz)) continue;
      tmp.set(0xd2bd9c).multiplyScalar(0.9 + rnd() * 0.18);
      quadUp(R, cx - SL / 2, cz - SL / 2, cx + SL / 2, cz + SL / 2, 0.02, () => [tmp.r, tmp.g, tmp.b]);
    }
    PATH.addGeo(rawGeo(R));
  });

  // ---------- bồn sỏi hàng cây cảnh: gờ đá thấp (cây cảnh + bệ đá đặt ở phần "NGHỆ THUẬT") và thềm đá trước bồn ----------
  count('bồn cây cảnh', () => {
    boxMM(S, BED.x0, 0, BED.z0, BED.x1, 0.34, BED.z0 + 0.3, C.stoneL);                                              // gờ trước
    boxMM(S, BED.x0, 0, BED.z0, BED.x0 + 0.3, 0.34, BED.z1, C.stone); boxMM(S, BED.x1 - 0.3, 0, BED.z0, BED.x1, 0.34, BED.z1, C.stone); // hai gờ đầu
    boxMM(Fl, BED.x0 + 0.3, 0.26, BED.z0 + 0.3, BED.x1 - 0.3, 0.3, BED.z1, 0xb9b09a);                              // mặt sỏi
  });

  // ---------- hồ: bờ đá (khối hộp nối theo chu vi), mặt nước (dùng chung vật liệu nước của sân trước để đổi màu theo giờ) ----------
  let waterMesh = null;
  count('bờ hồ', () => {
    const cz0 = (POND.z0 + POND.z1) / 2, rim = POND.rim / 2;
    const pts = rrPoints(0, cz0, PHX + rim, PHZ + rim, POND.r + rim, 0.9), rnd = U.rng(2411), pal = [C.stone, 0x9d9382, C.stoneL, 0x948a79];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, len = hypot(b[0] - a[0], b[1] - a[1]);
      if (inHex(mx, mz, PAV.R + 0.3)) continue;                                                                      // dưới sàn thủy tạ không cần bờ
      const h = POND.rimTop - rnd() * 0.04;
      box(Fl, mx, h / 2, mz, len + 0.06, h, POND.rim, pal[(rnd() * pal.length) | 0], { r: [0, Math.atan2(-(b[1] - a[1]), b[0] - a[0]), 0] });
    }
    // mặt nước: quạt tam giác từ tâm hồ ra chu vi mép nước (mở rộng 0,2 m vào dưới bờ cho khỏi hở)
    const wp = rrPoints(0, cz0, PHX + rim, PHZ + rim, POND.r + rim, 1.2), pos = [], nor = [];
    const cxw = 0, czw = cz0, y = POND.water;
    for (let i = 0; i < wp.length; i++) {
      const a = wp[i], b = wp[(i + 1) % wp.length];
      const nrm = (b[0] - cxw) * (a[1] - czw) - (b[1] - czw) * (a[0] - cxw) >= 0 ? [a, b] : [b, a]; // thứ tự để pháp tuyến hướng lên
      pos.push(cxw, y, czw, nrm[0][0], y, nrm[0][1], nrm[1][0], y, nrm[1][1]); nor.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
    }
    const g = new THREE.BufferGeometry();                                                                          // giữ lại cho mesh mặt nước (không giải phóng ở cuối)
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.computeBoundingSphere();
    waterMesh = new THREE.Mesh(g, W.water ? W.water.material : new THREE.MeshPhongMaterial({ color: 0x1f5566, shininess: 90 }));
    waterMesh.receiveShadow = true; waterMesh.matrixAutoUpdate = false; waterMesh.updateMatrix(); waterMesh.name = 'vuonSau:nuoc';
    tally['mặt nước'] = pos.length / 9;
  });

  // ---------- thủy tạ: sàn lục giác trên sáu chân đá (y 0,25…0,45), ba bậc phía đông, lát ván gỗ; mái, cột, lan can, ghế dựng ở phần "NGHỆ THUẬT" ----------
  count('sàn thủy tạ', () => {
    cyl(S, PAV.x, 0.35, PAV.z, PAV.R, PAV.R, 0.2, C.stoneL, 6);                                                      // tấm sàn đá (đỉnh y 0,45)
    cyl(S, PAV.x, 0.245, PAV.z, PAV.R + 0.1, PAV.R + 0.1, 0.06, C.stoneD, 6);                                         // gờ dưới
    cyl(Fl, PAV.x, 0.452, PAV.z, PAV.R - 0.12, PAV.R - 0.12, 0.012, 0x8a5a3a, 6);                                     // lát ván gỗ
    for (let k = 0; k < 6; k++) cyl(S, PAV.x + PAV.R * Math.sin((k * PI) / 3), 0.125, PAV.z + PAV.R * Math.cos((k * PI) / 3), 0.22, 0.26, 0.25, C.stoneD, 6); // chân đá
    boxMM(S, XE, 0, PAV.z - STEP_HALF, XE + STEP_RUN / 3, 0.3, PAV.z + STEP_HALF, C.stoneL);                          // bậc 1 (đỉnh 0,30)
    boxMM(S, XE + STEP_RUN / 3, 0, PAV.z - STEP_HALF, XE + (2 * STEP_RUN) / 3, 0.15, PAV.z + STEP_HALF, C.stone);     // bậc 2 (đỉnh 0,15)
    boxMM(S, XE + (2 * STEP_RUN) / 3, 0, PAV.z - STEP_HALF, XE + STEP_RUN, 0.02, PAV.z + STEP_HALF, C.stoneD);       // bậc 3: viền chân bậc
  });

  // ---------- bồn bồ đề: thành gạch tròn (đỉnh y 0,48), mặt đất + vành đá (cây dựng ở phần "NGHỆ THUẬT") ----------
  count('bồn bồ đề', () => {
    cyl(S, PLANTER.x, (PLANTER.h - 0.02) / 2, PLANTER.z, PLANTER.r, PLANTER.r + 0.05, PLANTER.h - 0.02, 0x9b5d42, 28);
    Fl.add(mk(new THREE.CircleGeometry(PLANTER.r - 0.4, 28)), 0x5a4030, { p: [PLANTER.x, PLANTER.h, PLANTER.z], r: [-PI / 2, 0, 0], j: 0.04 });
    Fl.add(mk(new THREE.RingGeometry(PLANTER.r - 0.4, PLANTER.r + 0.1, 28)), C.stoneL, { p: [PLANTER.x, PLANTER.h + 0.004, PLANTER.z], r: [-PI / 2, 0, 0], j: 0.04 });
  });

  // ===================================================================
  //  NGHỆ THUẬT: mô hình trong vườn. Đọc bảng số LAYOUT / POND / ISLAND / STATUE / PAV / PLANTER ở trên; vật cản, chỗ ngồi, nút dẫn đường đã có từ phần cấu trúc.
  //  Hình gộp vào DEC (rắn, đổ bóng) / DECF (phẳng, nhỏ) / LB (thân đèn) / GD (vàng). Phong cách nhà: low-poly phẳng, màu theo đỉnh, jitter ±7 %.
  //  Mỗi phần: count(tên, fn) ghi số tam giác vào G.vuonSau.tally; phần phụ đi qua optional(tên, ước lượng, fn): vượt ngân sách thì bỏ.
  // ===================================================================
  const BUDGET = DAI >= 20 ? 66000 : 50000, TAU = PI * 2; // 2026-11-28: vườn dài thêm (thêm ghế, đèn, hoa đại, sen, tường) nên nới ngân sách
  const { branch, lathe, beam, hangLanternInto } = GB;
  const ICO = mk(new THREE.IcosahedronGeometry(1, 0)), ICO1 = mk(new THREE.IcosahedronGeometry(1, 1)), OCT = mk(new THREE.OctahedronGeometry(1, 0)), DOD = mk(new THREE.DodecahedronGeometry(1, 0));
  const TET = mk(new THREE.TetrahedronGeometry(1, 0)), CONE4 = mk(new THREE.ConeGeometry(0.5, 1, 4)), CONE6 = mk(new THREE.ConeGeometry(0.5, 1, 6));
  const SPHM = mk(new THREE.SphereGeometry(1, 8, 6)), SPHH = mk(new THREE.SphereGeometry(1, 12, 8)), SPHS = mk(new THREE.SphereGeometry(1, 6, 4));
  const put = (B, g, color, x, y, z, sx, sy = sx, sz = sx, o) => B.add(g, color, Object.assign({ p: [x, y, z], s: [sx, sy, sz] }, o));
  const rod = (B, a, b, ra, rb, color, sg = 5) => { // thanh tròn hở hai đầu nối a → b: nhẹ hơn GB.branch
    const g = mk(new THREE.CylinderGeometry(ra, rb, 1, sg, 1, true)); g.rotateX(PI / 2);
    const s = U.segMatrix(a[0], a[1], a[2], b[0], b[1], b[2]); B.add(g, color, { s: [1, 1, s.len], m: s.m });
  };
  const skipped = (V.skipped = []), ps0 = (W.petalSources || []).length;                                           // ps0: số nguồn cánh hoa trước khi vườn thêm (12-decor-inside nới trần mai thêm đúng số này)
  const optional = (name, est, fn) => { if (totalNow() + est > BUDGET) { skipped.push(name); tally[name] = 0; return; } count(name, fn); };
  const petalRing = (B, cx, y, cz, R, n, len, wid, tilt, color, ph = 0, thick = 0.4) => { // vòng cánh sen (như 09-world2-geo.js:40)
    const st = Math.sin(tilt), ct = Math.cos(tilt);
    for (let i = 0; i < n; i++) { const a = ph + (i / n) * TAU, mx = R + (st * len) / 2, my = (ct * len) / 2; B.add(CONE4, color, { p: [cx + Math.sin(a) * mx, y + my, cz + Math.cos(a) * mx], s: [wid, len, wid * thick], r: [tilt, a, 0], order: 'YXZ' }); }
  };

  // ---------- 1. Hàng cây cảnh: chín chậu trên bệ đá, trong bồn sỏi (bồn cao 0,3 m). Chậu và tán như bonsai ở 05-world.js:848 ----------
  count('hàng cây cảnh', () => {
    const POT = mk(lathe([[0, 0], [0.3, 0], [0.42, 0.12], [0.46, 0.42], [0.5, 0.46], [0, 0.46]], 10)), rnd = U.rng(3301);
    BONSAI.forEach((b, i) => {
      box(DEC, b.x, 0.53, b.z, 0.8, 0.46, 0.8, C.stoneD); box(DEC, b.x, 0.79, b.z, 0.92, 0.06, 0.92, C.stoneL);                       // bệ đá (đỉnh y 0,82)
      const y = 0.82;
      put(DEC, POT, 0x3c6aa0, b.x, y, b.z, 1, 1, 1, { j: 0.05 }); cyl(DEC, b.x, y + 0.43, b.z, 0.49, 0.49, 0.04, 0xeef0f4, 10);
      const k = 0.85 + rnd() * 0.35;
      branch(CAY, [b.x, y + 0.45, b.z], [b.x + 0.15 * k, y + 1.05 * k, b.z + 0.05], 0.07, 0.05, 0x6b5240, 5);
      put(CAY, ICO, C.leaf[i % 4], b.x + 0.18, y + 0.45 + 0.7 * k + 0.1, b.z + 0.05, 0.42 * k, 0.21 * k, 0.34 * k, { j: 0.12 });
      put(CAY, ICO, C.leaf[(i + 1) % 4], b.x - 0.18, y + 0.45 + 0.45 * k, b.z, 0.29 * k, 0.15 * k, 0.24 * k, { j: 0.12 });
      cayGhi({ k: 'chau', x: b.x, y: y + 0.45, z: b.z, s: k, seed: 3301 + i, nhom: 'vuon' });
    });
  });

  // ---------- 2. Đèn đá ×14 (như stoneLantern 09-world2-geo.js:79) + quầng sáng ấm về đêm (không đèn thật) ----------
  count('đèn đá', () => {
    for (const l of LANTERNS) {
      box(DEN, l.x, 0.15, l.z, 0.62, 0.3, 0.62, C.stoneD); box(DEN, l.x, 0.75, l.z, 0.28, 0.9, 0.28, C.stone); box(DEN, l.x, 1.32, l.z, 0.56, 0.12, 0.56, C.stone);
      DENS.add(BOX, 0xffd98a, { p: [l.x, 1.6, l.z], s: [0.36, 0.4, 0.36] });
      put(DEN, CONE4, C.stoneD, l.x, 2.0, l.z, 1.0, 0.36, 1.0, { r: [0, PI / 4, 0] });
      glow(l.x, 1.6, l.z, 1.4, [1.0, 0.75, 0.38], true);
    }
  });

  // ---------- 3. Ghế đá: 8 ghế quanh vườn + 2 ghế trong thủy tạ (như bench 09-world2-geo.js:86; mặt ghế cao 0,42 trên nền) ----------
  count('ghế đá', () => {
    for (const b of [...BENCHES, ...PAV_BENCHES]) {
      const y0 = b.y - 0.42;
      box(DEC, b.x, y0 + 0.42, b.z, 1.8, 0.14, 0.55, C.stoneL, { r: [0, b.yaw, 0] });
      for (const s of [-0.65, 0.65]) box(DEC, b.x + Math.cos(b.yaw) * s, y0 + 0.2, b.z - Math.sin(b.yaw) * s, 0.2, 0.4, 0.45, C.stoneD, { r: [0, b.yaw, 0] });
    }
  });

  // ---------- 4. Hoa đại (hoa sứ) ×4 dọc hai bên vườn (2026-11-26: bỏ sáu cây ở hai dải tháp): như frangipani 09-world2-geo.js:111 ----------
  count('hoa đại', () => {
    for (const t of FRANGI) {
      const r = U.rng(t.seed), x = t.x, z = t.z, trunk = 0x8a7a68;
      branch(DEC, [x, 0, z], [x + 0.1, 1.3, z], 0.2, 0.15, trunk, 7);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + r(), d = 1.0 + r() * 0.5, top = [x + Math.cos(a) * d, 2.2 + r() * 0.5, z + Math.sin(a) * d];
        branch(DEC, [x + 0.1, 1.25, z], top, 0.12, 0.07, trunk, 6);
        put(DEC, ICO, 0x3f6a32, top[0], top[1] + 0.25, top[2], 0.7 + r() * 0.25, 0.5, 0.7 + r() * 0.25, { j: 0.12 });
        for (let k = 0; k < 5; k++) put(DEC, OCT, k % 2 ? 0xfff4dc : 0xffe7a8, top[0] + (r() - 0.5) * 0.9, top[1] + 0.48 + r() * 0.18, top[2] + (r() - 0.5) * 0.9, 0.075);
      }
      W.petalSources.push({ x, y: 2.8, z, r: 1.6, kind: 'flower' });
    }
  });

  // ---------- 5. Tùng ×4 hai bên mỗi cổng (như cypress 09-world2-geo.js:123; cao ≈ 4,2 m) ----------
  count('tùng', () => {
    for (const t of CYPRESS) {
      const r = U.rng(t.seed), s = t.s;
      branch(CAY, [t.x, 0, t.z], [t.x, 1.2 * s, t.z], 0.16 * s, 0.12 * s, C.bark, 5);
      cayGhi({ k: 'tung', x: t.x, y: -0.04, z: t.z, s, seed: t.seed, nhom: 'vuon' });
      for (let i = 0; i < 4; i++) { const w = (1.5 - i * 0.28) * s, h = (1.7 - i * 0.12) * s; put(CAY, CONE6, i % 2 ? 0x3a6232 : 0x355a2e, t.x + (r() - 0.5) * 0.06, (0.7 + i * 0.95) * s + h / 2, t.z + (r() - 0.5) * 0.06, w, h, w, { j: 0.1 }); }
    }
  });

  // ---------- 6. Rừng trúc ×2 ở hai góc sau: 30 cây mỗi bụi, cao 5–8 m, ngọn ngả ra ngoài ----------
  count('rừng trúc', () => {
    for (const c of BAMBOO) {
      const r = U.rng(c.seed);
      for (let i = 0; i < 30; i++) {
        const a = r() * TAU, d = Math.sqrt(r()) * (c.r - 0.6), bx = c.x + Math.cos(a) * d, bz = c.z + Math.sin(a) * d, h = 5.2 + r() * 2.8 - d * 0.15, lean = 0.1 + d * 0.07;
        const tx = bx + Math.cos(a) * lean * h * 0.25, tz = bz + Math.sin(a) * lean * h * 0.25, col2 = i % 2 ? 0x8aa04a : 0x7a9440;
        rod(DEC, [bx, 0, bz], [tx, h, tz], 0.06, 0.045, col2, 5);
        put(DEC, ICO, 0x5d8c3d, tx, h, tz, 0.55 + r() * 0.3, 0.85 + r() * 0.3, 0.55 + r() * 0.3, { j: 0.15 });
        put(DEC, ICO, 0x4c7a35, (bx + tx) / 2 + (r() - 0.5) * 0.3, h * 0.72, (bz + tz) / 2 + (r() - 0.5) * 0.3, 0.45, 0.7, 0.45, { j: 0.15 });
      }
    }
  });

  // ---------- 7. Cây bồ đề ở bồn giữa (cao ≈ 12 m, tán rộng ≈ 14 m phủ bốn ghế đá): thân + rễ nổi + cành + 26 mảng lá + 6 cành thấp để buộc dải lụa cầu an (2026-11-23) ----------
  count('cây bồ đề', () => {
    const tx = PLANTER.x, tz = PLANTER.z, y0 = PLANTER.h, r = U.rng(6203), bark = C.bark;
    branch(CAY, [tx, y0 - 0.1, tz], [tx + 0.15, 5.2, tz - 0.1], 1.25, 0.8, bark, 9);
    for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU + 0.3; branch(CAY, [tx + Math.cos(a) * 0.6, y0 + 0.4, tz + Math.sin(a) * 0.6], [tx + Math.cos(a) * 2.6, y0 - 0.02, tz + Math.sin(a) * 2.6], 0.4, 0.07, bark, 5); }
    for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU + r() * 0.4, d = 4.6 + r() * 1.4; branch(CAY, [tx, 4.4, tz], [tx + Math.cos(a) * d, 7.4 + r() * 1.6, tz + Math.sin(a) * d], 0.34, 0.14, bark, 6); }
    for (let i = 0; i < 26; i++) { const a = i * 2.39996, rr = 1.5 + Math.sqrt(i / 26) * 5.4, rad = 2.0 + r() * 1.3; put(CAY, i < 12 ? ICO1 : ICO, C.leaf[i % 4], tx + Math.cos(a) * rr, 10.2 - rr * 0.42 + r() * 0.8, tz + Math.sin(a) * rr, rad, rad * 0.78, rad, { j: 0.12 }); }
    // 6 cành thấp để buộc dải lụa ("Viết lời cầu an"): mọc từ thân ở y 3,35…3,5, vươn ngang 3,7…4,0 m (không quá 4,3 m), 4 trong 6 cành ở nửa phía bắc (phía chỗ đứng). Bộ số ngẫu nhiên riêng (6204): thân, cành lớn và tán lá ở trên giữ nguyên.
    // Neo treo: mỗi cành 5 neo cách nhau 0,46…0,52 m dọc cành (t 0,35…0,95), thấp hơn cành 0,07 m; đáy dải dài nhất (0,75 × 1,12 = 0,84 m) còn cao hơn mặt đất trong bồn (y 0,5) 1,9 m trở lên; đầu cành ≤ 4,3 m nên không dải nào treo trên đầu người đi (vật cản bồn r 4,6 + 0,35).
    const rl = U.rng(6204), anchors = [], low = [];
    LOW.forEach(([a, R, ya, yb], b) => {
      const ca = Math.cos(a), sa = Math.sin(a), A0 = [tx + ca * 0.6, ya, tz + sa * 0.6], B0 = [tx + ca * R, yb, tz + sa * R];
      branch(DEC, A0, B0, 0.2, 0.08, bark, 6); low.push(A0);
      const L = hypot(B0[0] - A0[0], B0[1] - A0[1], B0[2] - A0[2]), n = Math.floor((0.6 * L) / 0.46) + 1;
      for (let k = 0; k < n; k++) {
        const t = 0.35 + (0.6 * k) / (n - 1), side = (rl() - 0.5) * 0.04, dy = (rl() - 0.5) * 0.06;                                 // lệch ngang vuông góc cành và lệch dọc nhỏ: khoảng cách dọc cành không giảm
        anchors.push({ x: A0[0] + (B0[0] - A0[0]) * t - sa * side, y: A0[1] + (B0[1] - A0[1]) * t - 0.07 + dy, z: A0[2] + (B0[2] - A0[2]) * t + ca * side, b, t });
      }
    });
    for (let i = anchors.length - 1; i > 0; i--) for (let j = 0; j < i; j++) if (hypot(anchors[i].x - anchors[j].x, anchors[i].y - anchors[j].y, anchors[i].z - anchors[j].z) < 0.42) { anchors.splice(i, 1); break; } // bảo đảm: hai neo bất kỳ cách nhau ≥ 0,42 m
    V.ribbonTree = {
      x: tx, z: tz, anchors,                                                                                                         // [{x, y, z, b: số cành, t}]
      poi: { x: 0, z: -171.0 + ZS, r: 3.1 }, stand: { x: 0, z: -171.75 + ZS, yaw: PI },                                              // lối trục phía bắc bồn, nhìn về cây; cách tâm bồn 5,25 m (vật cản bồn r 4,6 + người r 0,35 = 4,95)
      cam: { pos: [2.4, 2.6, -164.0 + ZS], look: [0.3, 3.0, -176.5 + ZS] },
      hidden: () => V.decorHidden,                                                                                                   // 40-activities-b.js ẩn dải lụa cùng lúc với nhóm "near" của vườn
    };
    W.petalSources.push({ x: tx, y: 7.5, z: tz, r: 5, kind: 'leaf' });
    cayGhi({ k: 'bode', x: tx, y: y0 - 0.08, z: tz, s: 1, seed: 6203, nhom: 'vuon', low }); // low: gốc của 6 cành thấp (cách trục bồn 0,6 m): mô hình cây có thân mảnh hơn thân dựng bằng mã nên 13-cay-mo-hinh.js nối từng gốc cành vào thân mới
  });

  // ---------- 8. Đảo đá giữa hồ: chân đảo, gò rêu, tảng đá lớn nhỏ, ba mỏm đá phía sau tượng, vài bụi cây ----------
  count('đảo đá', () => {
    const I = ISLAND, r = U.rng(5101), stones = [0x8f8a80, 0x7d776d, 0xa8a094, 0x9a948a], ks = I.r / 3.2;                              // ks: đảo lớn gấp mấy lần bản v5 (bán kính 3,2): khoảng cách ngang nhân theo, đá và mỏm đá lớn theo vừa phải
    cyl(DEC, I.x, 0.45, I.z, I.r - 0.2, I.r + 0.25, 0.9, 0x8d8576, 14);
    put(DEC, ICO1, 0x6f9a45, I.x, 0.9, I.z, I.r - 0.3, 0.3, I.r - 0.3, { j: 0.08 });                                                    // gò rêu (đỉnh ≈ 1,15; bệ tượng cắm vào)
    const nRim = Math.round(14 * ks);
    for (let i = 0; i < nRim; i++) { const a = (i / nRim) * TAU + r() * 0.2, d = I.r - 0.2 + r() * 0.5, s = (0.5 + r() * 0.4) * Math.sqrt(ks); put(DEC, DOD, stones[i % 4], I.x + Math.cos(a) * d, 0.25 + r() * 0.3, I.z + Math.sin(a) * d, s * 1.2, s * 0.7, s, { r: [r(), a, r() * 0.3], j: 0.1 }); }
    for (const [dx, dz, h, w] of [[-1.3, -2.1, 2.0, 0.55], [0.4, -2.5, 2.4, 0.62], [1.6, -1.9, 1.7, 0.5]]) put(DEC, OCT, stones[((h * 3) | 0) % 4], I.x + dx * ks * 1.45, 0.6 + (h * ks) / 2, I.z + dz * ks, w * ks, (h * ks) / 2, w * 0.8 * ks, { r: [0, r() * 3, 0.06], j: 0.1 }); // ba mỏm đá cao phía sau (2026-11-28: lớn theo đảo, giãn ra hai bên cho khỏi chạm bệ sen)
    for (let i = 0; i < 9; i++) { const a = r() * TAU, d = (1.1 + r() * 1.6) * ks + 1.2; put(DEC, DOD, stones[i % 4], I.x + Math.cos(a) * Math.min(d, I.r - 0.6), 1.0 + r() * 0.2, I.z + Math.sin(a) * Math.min(d, I.r - 0.6), 0.2 + r() * 0.15, 0.14, 0.2 + r() * 0.15, { r: [r(), r() * 6, 0], j: 0.1 }); }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.5, d = (2.3 + r() * 0.5) * ks; put(DEC, ICO, C.leaf[i % 4], I.x + Math.cos(a) * d, 1.15, I.z + Math.sin(a) * d, 0.34, 0.2, 0.3, { j: 0.12 }); } // bụi cây thấp
  });

  // ---------- 9. Tượng Quan Âm đứng (đá trắng, cao 3,0 m trên bệ sen; mặt quay +z): xem bản vẽ trong kế hoạch ----------
  count('tượng Quan Âm', () => {
    // 2026-11-28: bệ sen và thân tượng vẫn dựng theo số đo của bản v5 (mặt bệ y 1,6, tượng cao 3 m) vào hai bộ gom tạm PED / TUONG,
    // rồi cuối khối này phóng to cả hai TK lần quanh điểm (X; 1,1; Z) là chân bệ trên gò rêu: mặt bệ thành STATUE.base, tượng cao STATUE.h.
    const X = STATUE.x, Z = STATUE.z, Y = 1.6, stone = 0xeee9de, stoneL = 0xf6f2e8, rose = 0xf2d6d8, PED = U.batch();
    // bệ sen: đế tròn → hai vòng cánh sen → mặt bệ (đỉnh y 1,6 trước khi phóng to)
    cyl(PED, X, 1.2, Z, 0.95, 1.1, 0.2, 0xd8d0bf, 14);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; put(PED, CONE4, i % 2 ? 0xf6dfe5 : rose, X + Math.sin(a) * 0.82, 1.44, Z + Math.cos(a) * 0.82, 0.36, 0.5, 0.15, { r: [0.6, a, 0], order: 'YXZ' }); }
    for (let i = 0; i < 10; i++) { const a = ((i + 0.5) / 10) * TAU; put(PED, CONE4, 0xfbe9ee, X + Math.sin(a) * 0.55, 1.52, Z + Math.cos(a) * 0.55, 0.3, 0.42, 0.13, { r: [0.28, a, 0], order: 'YXZ' }); }
    cyl(PED, X, Y - 0.03, Z, 0.55, 0.62, 0.06, 0xf3ead8, 12);
    // áo choàng dài kèm khăn choàng vai: MỘT lathe 18 cạnh khép kín (đường viền đi từ gấu lên cổ, y tăng dần nên pháp tuyến hướng ra ngoài).
    // Khăn choàng nay nằm trong cùng mặt khép kín này: từ eo (y 1,40, bán kính 0,30) loe dần ra vai (bán kính tới 0,50 ở y 2,0); độ dốc ≤ 0,6 (bán kính / chiều cao)
    // để bóng của khăn không rơi xuống phần áo bên dưới. Trước đây khăn là lathe hở thứ hai vẽ từ cổ xuống (y giảm dần → pháp tuyến hướng vào trong): mặt gần bị cắt bỏ khi vẽ
    // nhưng vẫn vào bản đồ bóng (bóng chỉ vẽ mặt sau), cách ngực áo chừng 0,1 m, đúng bằng độ lệch bóng → đổ bóng lốm đốm lên ngực. Nay chỉ còn một mặt khép kín. Hơi dẹt theo trục z (0,88).
    const ROBE = mk(lathe([[0.001, 0.02], [0.58, 0.02], [0.62, 0.12], [0.55, 0.45], [0.42, 0.85], [0.32, 1.15], [0.3, 1.4], [0.37, 1.52], [0.44, 1.66], [0.49, 1.86], [0.5, 2.0], [0.47, 2.16], [0.4, 2.37], [0.2, 2.44], [0.001, 2.46]], 18));
    const robeG = U.piece(ROBE, stone, { p: [X, Y, Z], s: [1, 1, 0.88], j: 0.04 }), robeP = robeG.attributes.position, robeC = robeG.attributes.color;
    for (let t = 0; t < robeP.count; t += 3) {                                                 // phần khăn (từ gấu khăn trở lên) sáng hơn một chút: đá trắng khác tông với áo
      if (robeP.getY(t) < Y + 1.5 || robeP.getY(t + 1) < Y + 1.5 || robeP.getY(t + 2) < Y + 1.5) continue;
      const f = 1 + (Math.random() - 0.5) * 0.08; _col.set(stoneL);
      for (let v = 0; v < 3; v++) robeC.setXYZ(t + v, _col.r * f, _col.g * f, _col.b * f);
    }
    TUONG.addGeo(robeG);                                                                       // từ đây trở xuống là thân tượng: bộ gom TUONG (lưới 'vuonSau:tuong'), ẩn khi mô hình tượng hiện (19-quan-am-ho.js)
    // đầu: cúi nhẹ, búi tóc, vành trán; không vẽ chi tiết mặt
    put(TUONG, SPHH, stoneL, X, Y + 2.63, Z + 0.02, 0.19, 0.225, 0.2, { j: 0.03 });
    put(TUONG, SPHM, stone, X, Y + 2.9, Z - 0.02, 0.1, 0.1, 0.1, { j: 0.03 });
    TUONG.add(mk(new THREE.TorusGeometry(0.195, 0.022, 4, 14)), 0xe6d9a8, { p: [X, Y + 2.74, Z + 0.01], r: [PI / 2, 0, 0], s: [1, 1, 1.0], j: 0.03 });
    // vầng hào quang mảnh sau đầu
    TUONG.add(mk(new THREE.TorusGeometry(0.5, 0.03, 4, 20)), 0xe6d9a8, { p: [X, Y + 2.72, Z - 0.34], j: 0.03 });
    // hai tay: tay phải (bên −x) đưa ra trước, lòng bàn tay ngửa; tay trái (bên +x) cầm bình tịnh thủy
    const arm = (sx, e, h) => { const sh = [X + sx * 0.36, Y + 2.2, Z + 0.02]; branch(TUONG, sh, [X + e[0], Y + e[1], Z + e[2]], 0.1, 0.085, stone, 6); branch(TUONG, [X + e[0], Y + e[1], Z + e[2]], [X + h[0], Y + h[1], Z + h[2]], 0.085, 0.06, stone, 6); put(TUONG, SPHS, stoneL, X + h[0], Y + h[1], Z + h[2], 0.075); };
    arm(-1, [-0.5, 1.72, 0.12], [-0.34, 1.82, 0.5]);
    arm(1, [0.5, 1.62, 0.1], [0.4, 1.3, 0.44]);
    const VASE = mk(lathe([[0.001, 0], [0.05, 0], [0.09, 0.05], [0.115, 0.14], [0.1, 0.22], [0.05, 0.27], [0.055, 0.34], [0.07, 0.37], [0.001, 0.37]], 10));
    put(TUONG, VASE, stoneL, X + 0.4, Y + 1.24, Z + 0.5, 1, 1, 1, { j: 0.03 });
    for (const [dx, dz] of [[0.12, 0.05], [-0.05, 0.12], [0.05, -0.1]]) rod(TUONG, [X + 0.4, Y + 1.58, Z + 0.5], [X + 0.4 + dx * 2.2, Y + 2.0, Z + 0.5 + dz * 2.2], 0.012, 0.008, 0x4f7a34, 4); // cành dương liễu nhỏ trong bình
    // phóng to bệ sen + thân tượng quanh chân bệ; bệ sen nhập vào DEC, thân tượng ở lại TUONG
    for (const B of [PED, TUONG]) for (const g of B.list) { g.translate(-X, -1.1, -Z); g.scale(TK, TK, TK); g.translate(X, 1.1, Z); }
    for (const g of PED.list) DEC.addGeo(g); PED.list.length = 0;
  });

  // ---------- 10. Sen: 60 lá nổi, 22 hoa, 10 nụ, 12 lá vươn cao; tránh đảo, thủy tạ ----------
  count('sen', () => {
    const r = U.rng(31), pads = [], PAD = mk(new THREE.CircleGeometry(1, 8, 0.3, PI * 1.85).rotateX(-PI / 2)), y = POND.water;
    const ok = (x, z) => inPond(x, z, -1.0) && hypot(x - ISLAND.x, z - ISLAND.z) > ISLAND.r + 0.9 && !inHex(x, z, PAV.R + 1.3) && hypot(x - LAN_REL.x, z - LAN_REL.z) > 1.95 && pads.every((q) => hypot(q[0] - x, q[1] - z) > 0.95); // > 1,95 m: chỗ đặt đèn hoa đăng để trống (nụ và cuống lệch 0,15 m nên vẫn cách ≥ 1,8 m)
    // 2026-11-28: hồ dài hơn nên nhiều sen hơn (bản v5: 60 lá, 22 hoa, 10 nụ, 12 lá vươn cao). CHIA: lá nào mang gì, theo thứ tự đặt; 19-sen-ho.js đọc V.senChia
    const big = DAI >= 20, NPAD = big ? 86 : 60, CHIA = (V.senChia = big ? { hoa: [0, 30], nu: [30, 44], cao: [44, 60], dai: [60, 68] } : { hoa: [0, 22], nu: [22, 32], cao: [32, 44], dai: [44, 50] });
    for (let i = 0; i < NPAD; i++) {
      let x = 0, z = 0, good = false;
      for (let t = 0; t < 60 && !good; t++) { x = POND.x0 + 1 + r() * (POND.x1 - POND.x0 - 2); z = POND.z0 + 1 + r() * (POND.z1 - POND.z0 - 2); good = ok(x, z); }
      if (!good) continue;
      const rr = 0.28 + r() * 0.3; pads.push([x, z, rr]);
      SEN.add(PAD, i % 2 ? 0x4f8a3c : 0x3f7a33, { p: [x, y + 0.03, z], s: [rr, 1, rr], r: [0, r() * 6, 0] });
    }
    V.pads = pads.map(([x, z, rr]) => ({ x, z, r: rr }));                                                          // vị trí lá sen (bài kiểm tra: cách chỗ đặt đèn ≥ 1,8 m)
    pads.slice(CHIA.hoa[0], CHIA.hoa[1]).forEach(([x, z], i) => {
      const pk = i % 3 ? 0xf29bb5 : 0xfff0f4, ph = r() * 6;
      petalRing(SEN, x, y + 0.05, z, 0.03, 6, 0.2, 0.1, 0.7, pk, ph, 0.5); petalRing(SEN, x, y + 0.05, z, 0.0, 4, 0.14, 0.09, 0.25, i % 3 ? 0xf8b9cc : 0xffffff, ph + 0.4, 0.5);
      put(SEN, SPHS, 0xf5d03a, x, y + 0.1, z, 0.045, 0.04, 0.045);
    });
    pads.slice(CHIA.nu[0], CHIA.nu[1]).forEach(([x, z]) => { rod(SEN, [x + 0.15, y, z], [x + 0.15, y + 0.5, z], 0.012, 0.012, 0x4f8a3c, 4); put(SEN, CONE6, 0xf28aaa, x + 0.15, y + 0.62, z, 0.14, 0.26, 0.14); });
    V.senCao = [];                                                                                                 // 12 lá vươn cao: chỗ đặt + chiều cao cuống (19-sen-ho.js đặt lá mô hình vào đúng chỗ)
    pads.slice(CHIA.cao[0], CHIA.cao[1]).forEach(([x, z]) => { const h = 0.35 + r() * 0.5; V.senCao.push({ x, z, h }); rod(SEN, [x, y, z], [x, y + h, z], 0.014, 0.018, 0x4f7a34, 4); SEN.add(mk(new THREE.ConeGeometry(0.36, 0.12, 9, 1, true)), 0x5a9440, { p: [x, y + h + 0.06, z], r: [(r() - 0.5) * 0.4, r() * 6, (r() - 0.5) * 0.4] }); }); // nón hở đỉnh hướng lên (như chiếc ô): nhìn từ trên và từ bờ đều thấy mặt ngoài; bộ gom một mặt (G.mats.vc)
  });

  // ---------- 11. Bồn mai – quất ×2 gần hai cổng: bồn đá thấp 4,0 × 1,6, mỗi bồn hai chậu mai vàng + hai chậu quất (như mai / quat 12-decor-inside.js:197, 222) ----------
  optional('bồn mai quất', 3400, () => {
    const POT_G = mk(lathe([[0.25, 0], [0.33, 0.08], [0.43, 0.36], [0.45, 0.5], [0.39, 0.6], [0.43, 0.64], [0.4, 0.67]], 8)), BAND_G = mk(new THREE.CylinderGeometry(0.465, 0.465, 0.08, 8, 1, true)), CIRC8 = mk(new THREE.CircleGeometry(1, 8).rotateX(-PI / 2));
    const GLAZE = [0x2f5f9e, 0xb8392c, 0xc9902e, 0x3d7a6c], MAIC = [0xffd23a, 0xffc61a, 0xffe066, 0xf5b800], LEAFG = [0x4c7a35, 0x5d8c3d, 0x3f6b30, 0x6f9a45], Y0 = 0.26;
    const potBase = (x, z, r) => { put(DEC, POT_G, GLAZE[(r() * GLAZE.length) | 0], x, Y0, z, 1, 1, 1, { j: 0.04, r: [0, r() * 6, 0] }); put(DEC, BAND_G, 0xf0e2c0, x, Y0 + 0.45, z, 1, 1, 1); put(DEC, CIRC8, 0x4a3524, x, Y0 + 0.67, z, 0.38, 1, 0.38); };
    const mai = (x, z, seed) => {
      const r = U.rng(seed), bark = 0x5c4636; potBase(x, z, r);
      const t = [[0, 0.66, 0]]; let cx = 0, cz = 0;
      for (let i = 1; i <= 3; i++) { cx += (r() - 0.5) * 0.3; cz += (r() - 0.5) * 0.3; t.push([cx, 0.66 + i * 0.5, cz]); }
      for (let i = 0; i < 3; i++) branch(DEC, [x + t[i][0], Y0 + t[i][1], z + t[i][2]], [x + t[i + 1][0], Y0 + t[i + 1][1], z + t[i + 1][2]], 0.075 - i * 0.02, 0.06 - i * 0.017, bark, 5);
      const tips = [[x + t[3][0], Y0 + t[3][1] + 0.1, z + t[3][2]]];
      for (let i = 0; i < 6; i++) { const b = t[1 + (i % 3)], a = r() * 6.28 + i, len = 0.5 + r() * 0.45, sx = x + b[0], sy = Y0 + b[1], sz = z + b[2], ex = sx + Math.cos(a) * len, ey = sy + (0.15 + r() * 0.5) * len + 0.15, ez = sz + Math.sin(a) * len; rod(DEC, [sx, sy, sz], [ex, ey, ez], 0.026, 0.012, bark, 4); tips.push([ex, ey, ez], [(sx + ex) / 2, (sy + ey) / 2 + 0.05, (sz + ez) / 2]); }
      for (const p of tips) for (let k = 0; k < 4; k++) { const s = 0.1 + r() * 0.06; put(DEC, TET, MAIC[(r() * 4) | 0], p[0] + (r() - 0.5) * 0.36, p[1] + (r() - 0.3) * 0.28, p[2] + (r() - 0.5) * 0.36, s, s * 0.85, s, { r: [r() * 3, r() * 3, r() * 3] }); }
    };
    const quat = (x, z, seed) => {
      const r = U.rng(seed); potBase(x, z, r);
      branch(DEC, [x, Y0 + 0.66, z], [x + 0.03, Y0 + 1.05, z], 0.06, 0.045, 0x5c4636, 5);
      const bl = [[0, 1.4, 0, 0.52], [0.3, 1.18, 0.12, 0.37], [-0.28, 1.22, -0.1, 0.39], [0.04, 1.72, 0.02, 0.35], [-0.1, 1.38, 0.3, 0.33]];
      bl.forEach((b, i) => put(DEC, ICO, LEAFG[i % 3], x + b[0], Y0 + b[1], z + b[2], b[3], b[3] * 0.85, b[3], { j: 0.1 }));
      for (let k = 0; k < 16; k++) { const b = bl[(r() * bl.length) | 0], a = r() * 6.28, e = r() * 1.7 - 0.45, cy = Math.cos(e), d = b[3] * 0.95, s = 0.055 + r() * 0.025; put(DEC, OCT, r() < 0.8 ? 0xf08a1c : 0xff9f2a, x + b[0] + Math.cos(a) * cy * d, Y0 + b[1] + Math.sin(e) * d * 0.85, z + b[2] + Math.sin(a) * cy * d, s); }
    };
    BEDS.forEach((b, bi) => {
      const t = 0.14, hh = 0.26;
      box(DEC, b.x, hh / 2, b.z - b.d / 2 + t / 2, b.w, hh, t, C.stoneL); box(DEC, b.x, hh / 2, b.z + b.d / 2 - t / 2, b.w, hh, t, C.stoneL);
      box(DEC, b.x - b.w / 2 + t / 2, hh / 2, b.z, t, hh, b.d - 2 * t, C.stone); box(DEC, b.x + b.w / 2 - t / 2, hh / 2, b.z, t, hh, b.d - 2 * t, C.stone);
      box(DEC, b.x, 0.2, b.z, b.w - 2 * t, 0.12, b.d - 2 * t, 0x3f6b30);
      [-1.4, -0.47, 0.47, 1.4].forEach((dx, i) => ((i + bi) % 2 ? quat : mai)(b.x + dx, b.z, 4000 + bi * 10 + i));
      W.petalSources.push({ x: b.x, y: 1.8, z: b.z, r: 1.6, kind: 'flower' });
    });
  });

  // ---------- 12. Mái thủy tạ: sáu cột gỗ, xà trên, lan can thấp (năm cạnh), mái ngói lục giác cong vút, nút đỉnh vàng, một đèn lồng treo ----------
  count('mái thủy tạ', () => {
    const hv = []; for (let k = 0; k < 6; k++) hv.push([PAV.x + PAV.R * Math.sin((k * PI) / 3), PAV.z + PAV.R * Math.cos((k * PI) / 3)]);
    const F0 = PAV.floor, TOPY = F0 + 2.5;
    for (const [x, z] of hv) { box(DEC, x, F0 + 0.06, z, 0.4, 0.12, 0.4, C.stoneD); cyl(DEC, x, F0 + 1.25, z, 0.1, 0.12, 2.5, C.wood, 8); }
    for (let k = 0; k < 6; k++) {
      const a = hv[k], b = hv[(k + 1) % 6];
      beam(DEC, [a[0], TOPY, a[1]], [b[0], TOPY, b[1]], 0.16, 0.2, C.woodD);
      if (a[0] > XE - 0.01 && b[0] > XE - 0.01) continue;                                                                   // cạnh đông: lối lên bậc
      beam(DEC, [a[0], F0 + 0.95, a[1]], [b[0], F0 + 0.95, b[1]], 0.1, 0.1, C.woodD); beam(DEC, [a[0], F0 + 0.5, a[1]], [b[0], F0 + 0.5, b[1]], 0.07, 0.07, C.woodD);
    }
    // mái: vỏ lathe kín 6 cạnh (mặt ngoài cong lõm, rìa mái vểnh ở sáu đỉnh), gốc ở y TOPY + 0,1
    const outer = [[0.001, 2.1], [0.45, 1.78], [1.0, 1.34], [1.7, 0.9], [2.5, 0.55], [3.3, 0.32], [3.8, 0.24], [4.05, 0.36]];
    const under = [[4.0, 0.2], [3.3, 0.2], [2.5, 0.4], [1.7, 0.74], [1.0, 1.18], [0.45, 1.62], [0.001, 1.92]];
    const ROOF = mk(lathe([...outer, ...under].reverse(), 6));
    put(DEC, ROOF, C.roof, PAV.x, TOPY + 0.1, PAV.z, 1, 1, 1, { j: 0.05 });
    for (let k = 0; k < 6; k++) { // sống mái: ba đoạn dọc mỗi hông (theo đường cong ngoài)
      const a = (k * PI) / 3, sn = Math.sin(a), cs = Math.cos(a);
      for (let i = 0; i < outer.length - 1; i += 2) { const p = outer[i], q = outer[Math.min(i + 2, outer.length - 1)]; beam(DEC, [PAV.x + sn * p[0], TOPY + 0.1 + p[1] + 0.04, PAV.z + cs * p[0]], [PAV.x + sn * q[0], TOPY + 0.1 + q[1] + 0.04, PAV.z + cs * q[0]], 0.13, 0.12, C.ridge); }
    }
    put(GD, SPHS, C.gold, PAV.x, TOPY + 0.1 + 2.3, PAV.z, 0.2, 0.26, 0.2); GD.add(mk(new THREE.ConeGeometry(0.09, 0.4, 6)), C.gold, { p: [PAV.x, TOPY + 0.1 + 2.62, PAV.z] });
    hangLanternInto(DEC, LB, PAV.x, TOPY + 2.05, PAV.z, 2.02, 0.85);                                                      // đèn lồng đỏ treo giữa thủy tạ (có quầng sáng đêm): dây dài 2,02 m, đầu dây lọt 3 cm vào vỏ mái (mặt trong ở TOPY + 2,02); đáy tua cao 1,84 m trên sàn, trên đầu người chơi
  });

  // ---------- kiểm tra ngân sách tam giác (và ghi số nguồn cánh hoa / lá rơi mà vườn đã thêm) ----------
  V.petalSources = (W.petalSources || []).length - ps0;
  safe('ngân sách', () => {
    const t = totalNow() + (waterMesh ? waterMesh.geometry.attributes.position.count / 3 : 0); // gồm cả mặt nước (dựng ngoài các bộ gom): used = V.tris
    if (t > BUDGET) G.errors.push('vườn sau: ' + Math.round(t) + ' tam giác, vượt ngân sách ' + BUDGET);
    V.budget = { limit: BUDGET, used: Math.round(t) };
  });

  // ---------- ẩn phần trang trí (nhóm V.groups.near) khi máy quay còn ở phía trước chính điện hoặc ở trong lòng chính điện: vườn nằm sau toà điện cao 23 m
  //            (tường sau điện kín, cửa sổ là tấm tối), từ đó không nhìn thấy gì; tường, cổng, lối đá, bờ hồ, mặt nước (nhóm far) vẫn vẽ.
  //            Ẩn khi y < 16 và: (a) z > −75 và |x| < 20,4 (sân trước, tiền sảnh), hoặc (b) z > −113,2 và |x| < 18,4 (lòng chính điện, tới tường sau điện).
  //            Không ẩn khi máy quay ở hai sân bên / hành lang (từ 2026-11-26 x ±20,5…36) / ngoài tường (|x| ≥ 20,4: có thể nhìn qua khe cổng hoặc qua mái hành lang) hoặc trên cao (y ≥ 16). ----------
  safe('ẩn khi xa', () => {
    if (!G.onUpdate || !G.camera) return;
    const pos = G.camera.position, CULL_Z = -75, CULL_X = 20.4, CULL_Y = 16, HALL_Z = -113.2, HALL_X = 18.4;
    let hidden = null;
    G.onUpdate(() => {
      const near = V.groups && V.groups.near; if (!near) return;
      const ax = Math.abs(pos.x);
      const hide = pos.y < CULL_Y && ((pos.z > CULL_Z && ax < CULL_X) || (pos.z > HALL_Z && ax < HALL_X));
      if (hide === hidden) return;
      hidden = hide; V.decorHidden = hide; near.visible = !hide;
    }, 76);
  });

  // =====================================================================
  //  HAI HOẠT ĐỘNG DỜI VÀO VƯỜN (2026-11-23): "Viết lời cầu an" và "Thả hoa đăng". 40-activities-b.js đọc W.tree / W.pond MỘT lần lúc cài (sau bước này).
  //  Cây bồ đề + hồ sen ở sân trước đã bỏ (2026-11-25). Chỉ công bố khi các phần chúng cần đã dựng xong: lỗi thì không có hai hoạt động này (40-activities-b.js bỏ qua).
  //  lanternPond: cùng dạng với W.pond của 05-world.js, thêm floatY (độ cao đèn nổi), avoid (vật tròn đèn phải tránh: thủy tạ) và hidden() (ẩn cùng nhóm "near").
  // =====================================================================
  safe('hoạt động cầu an', () => {
    V.lanternPond = {
      x: 0, z: -144.9, rx: 12.6, rz: 6.1,                                                                                            // vùng trôi: elip trước tượng (z −138,8 … −151,0; 2026-11-28: mép bắc của đảo mới ở −150,5)
      waterY: POND.water, floatY: POND.water + 0.04,                                                                                 // đèn nổi trên đỉnh lá sen (lá ở y nước + 0,03)
      island: { x: ISLAND.x, z: ISLAND.z, r: ISLAND.r },
      avoid: [{ x: PAV.x, z: PAV.z, r: PAV.R + 0.3 }],                                                                               // thủy tạ: đường tròn ngoại tiếp lục giác + 0,3 m
      inside: (x, z, m = 0) => inPond(x, z, -m) && hypot(x - ISLAND.x, z - ISLAND.z) > ISLAND.r + 0.3 + m && !inHex(x, z, PAV.R + 0.3 + m), // mặt nước trống: trong mép nước trừ m, ngoài đảo, ngoài thủy tạ
      poi: { x: 0, z: -136.4, r: 3.0 }, stand: { x: 0, z: -136.9, yaw: PI }, release: { x: LAN_REL.x, z: LAN_REL.z },                // bờ bắc, cuối lối trục, nhìn về tượng Quan Âm qua mặt nước
      cam: { pos: [2.6, 3.4, -131.6], look: [-0.6, 0.6, -145] },
      hidden: () => V.decorHidden,
    };
    const built = (names) => names.every((n) => !failed.has(n));
    if (V.ribbonTree && built(['vật cản', 'dẫn đường', 'bồn bồ đề', 'cây bồ đề'])) W.tree = V.ribbonTree;
    if (waterMesh && built(['vật cản', 'dẫn đường', 'bờ hồ', 'đảo đá'])) W.pond = V.lanternPond;
  });

  // =====================================================================
  //  GOM VÀO CẢNH: tính tổng tam giác / lần vẽ
  // =====================================================================
  safe('gom mesh', () => {
    let tris = 0, meshes = 0;
    const gNear = new THREE.Group(), gFar = new THREE.Group();                                                      // gNear: mesh trang trí, ẩn khi vườn không thể nhìn thấy; gFar: tường, cổng, lối đá, bờ hồ, mặt nước (luôn vẽ khi trong tầm nhìn)
    gNear.name = 'vuonSau:near'; gFar.name = 'vuonSau:far';
    const addMesh = (m, name, hideable) => { m.name = 'vuonSau:' + name; (hideable ? gNear : gFar).add(m); tris += m.geometry.attributes.position.count / 3; meshes++; };
    const pathMat = new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); // lối đá không nhấp nháy với thảm cỏ
    if (S.list.length) addMesh(S.mesh(G.mats.vc, { cast: true, receive: true }), 'than');
    if (Fl.list.length) addMesh(Fl.mesh(G.mats.vc, { cast: false, receive: true }), 'phang');
    if (PATH.list.length) addMesh(PATH.mesh(pathMat, { cast: false, receive: true }), 'loi');
    if (LB.list.length) addMesh(LB.mesh(G.mats.lantern, { cast: false, receive: false }), 'den');
    if (GD.list.length) addMesh(GD.mesh(G.mats.metal, { cast: true, receive: true }), 'kimloai', true);
    if (DEC.list.length) addMesh(DEC.mesh(G.mats.vc, { cast: true, receive: true }), 'trangtri', true);
    if (CAY.list.length) { const m = CAY.mesh(G.mats.vc, { cast: true, receive: true }); addMesh(m, 'cay', true); (G.cayCu || (G.cayCu = [])).push(m); } // cây dựng bằng mã (bản dự phòng của mô hình cây)
    if (DECF.list.length) addMesh(DECF.mesh(G.mats.vc, { cast: false, receive: true }), 'trangtri-phang', true);
    if (DEN.list.length) addMesh(DEN.mesh(G.mats.vc, { cast: true, receive: true }), 'denda', true);                 // đèn đá dựng bằng mã (bản dự phòng của mô hình đèn, 19-den-da.js)
    if (DENS.list.length) addMesh(DENS.mesh(G.mats.lantern, { cast: false, receive: false }), 'denda-sang');         // hộp sáng của đèn đá (luôn vẽ như lưới 'den')
    if (TUONG.list.length) addMesh(TUONG.mesh(G.mats.vc, { cast: true, receive: true }), 'tuong', true);             // thân tượng Quan Âm dựng bằng mã (bản dự phòng của mô hình tượng, 19-quan-am-ho.js)
    if (SEN.list.length) addMesh(SEN.mesh(G.mats.vc, { cast: false, receive: true }), 'sen', true);                  // sen dựng bằng mã (bản dự phòng của mô hình sen, 19-sen-ho.js)
    if (waterMesh) addMesh(waterMesh, 'nuoc');
    scene.add(gFar, gNear);
    V.tris = Math.round(tris); V.meshes = meshes; V.groups = { near: gNear, far: gFar };
  });
  for (const g of own) g.dispose();
}
