// =====================================================================
//  CHÍNH ĐIỆN v4 — "ĐẠI HÙNG BẢO ĐIỆN": gian rộng 37 m, sâu 27 m, trần gian giữa cao 11,7 m, ba tầng mái vàng lưu ly, chỗ cho 160 người ngồi tụng kinh,
//  đặt trên nền đá trắng ba tầng (kiểu "Tu Di toạ") với thang lớn ba chặng và thềm rồng ở giữa, tường đỏ — phong cách cung đình
//  (chỉ là PHONG CÁCH: tường son, ngói vàng, đá trắng, lan can, thềm rồng; vẫn là điện thờ Phật, không có ngai vàng hay chữ của vua).
//  Phỏng theo nét điện Tam Bảo lớn của các chùa Bắc Bộ: ba pho Phật Tam Thế ngồi trước ba hào quang
//  hình lá bồ đề dát vàng, cột gỗ sẫm to, bảng hiệu nền đen chữ vàng, một bàn thờ dài đủ lễ vật,
//  đôi hạc đồng đứng trên lưng rùa, sàn đỏ có thảm lối giữa, đèn chùm hoa sen.
//
//  KHUNG TOẠ ĐỘ (đọc kỹ trước khi sửa): THÂN ĐIỆN (tường, mái, cột, nội thất, tượng, hạc…) vẫn dựng ở "khung v2" — sàn Y0 = 1,92,
//  mép nền trước z −63,3, tường sau z −91,2 (v4: sâu 27 m; v3 là −81,2) — rồi dời cả khối bằng MỘT THREE.Group (hallGrp) đặt ở (0, DY, DZ) = (0, +2,88, −22).
//  Nhờ vậy ~150 số liệu hình học giữ nguyên (nội thất v4 được tính lại theo độ sâu / độ cao mới, không kéo giãn). Mọi toạ độ LOGIC của thân điện — vật cản (colH), chắn máy quay (blocker), quầng sáng (cuối bước mesh dời một lượt),
//  điểm khói, chỗ ngồi, nút dẫn đường, mõ, camera gõ mõ, đèn, vùng mái, tâm cắt cảnh, tượng — đi qua các hàm trợ giúp / cộng DY, DZ (chữ "+DZ" xuất hiện ở từng chỗ).
//  Người sửa sau: nếu thêm gì vào thân điện, hoặc dùng toạ độ khung v2 (cộng DY/DZ khi đưa vào thế giới), hoặc dùng toạ độ thế giới (đừng đưa vào hallGrp).
//  NỀN ĐÁ ba tầng + thang + thềm rồng + lan can dựng RIÊNG ở toạ độ THẾ GIỚI, thẳng vào scene, KHÔNG nằm trong hallGrp (xem khối "NỀN ĐÁ BA TẦNG").
//  Hai nhóm mesh của thân điện — "ngoài" (mái, tường) và "trong" (chỉ vẽ khi máy quay cách điện dưới 45 m).
//  Thay 15-hall-arch.js + 16-hall-altar.js (hai file cũ không còn được gọi).
// =====================================================================
function buildChinhDien(G) {
  const { THREE, util: U, scene } = G;
  const GB = G.build, W = G.world, col = G.collide;
  if (!GB || !W || !G.mats || !G.L || !G.L.hall || !G.L.hall.v2) return;
  const { C, BOX, box, boxMM, cyl, sph, lathe, branch, addRoof, glow, hangLanternInto, columnInto } = GB;
  const PI = Math.PI, TAU = PI * 2, V3 = THREE.Vector3;
  const safe = (name, fn) => { try { fn(); } catch (e) { console.error('[chính điện]', name, e); G.errors.push('chính điện/' + name + ': ' + (e && e.message)); } };

  // ---------- Khung toạ độ: thân điện dựng ở "khung v2" rồi dời (DY, DZ) ----------
  const Y0 = 1.92;                          // mặt sàn điện trong khung v2 (thân điện dựng quanh mức này; thế giới: Y0 + DY = 4,8)
  const DY = Math.round(((G.L.hall.dy + G.L.hall.h) - Y0) * 1000) / 1000, DZ = Math.round((G.L.hall.dz + 57.7) * 1000) / 1000; // = +2,88, −22 (suy từ G.L.hall ở 00-core: dz −79,7)
  const FLOOR = Y0 + DY;                    // 4,8: mặt sàn điện / tầng nền trên cùng (thế giới)
  const hallGrp = new THREE.Group();        // toàn bộ mesh của THÂN điện nằm trong nhóm này (toạ độ khung v2)
  hallGrp.name = 'chinhDien:than'; hallGrp.position.set(0, DY, DZ); hallGrp.updateMatrix(); scene.add(hallGrp);
  hallGrp.matrixAutoUpdate = false;
  // vật cản của thân điện: toạ độ khung v2 → thế giới (cộng DZ)
  const colH = { box: (x0, z0, x1, z1, t) => col.box(x0, z0 + DZ, x1, z1 + DZ, t), circle: (x, z, r, t) => col.circle(x, z + DZ, r, t) };
  // bỏ quầng sáng của pho tượng cũ (05-world dựng + frame.shift dời theo G.L.hall MỚI → ở (0, 4,03 + dy, −21,05 + dz)): quầng mới đặt ở từng hào quang. So theo vị trí mới, không theo số cũ.
  { const og = G.frame.xf(0, 4.03, -21.05); for (let i = W.glows.length - 1; i >= 0; i--) { const q = W.glows[i]; if (Math.abs(q.x - og.x) < 0.01 && Math.abs(q.y - og.y) < 0.05 && Math.abs(q.z - og.z) < 0.05) W.glows.splice(i, 1); } }
  // quầng sáng: các hàm dựng chung (hangLanternInto…) và glow() ghi toạ độ khung v2; cuối bước "mesh" cả lô được dời (+DY, +DZ) một lượt
  const glowMark = W.glows.length;

  // ---------- Kích thước chính (mét, toạ độ KHUNG v2 — thế giới = +DY, +DZ) ----------
  const XW = 18.5, ZB = -91.2, ZS = -63.3; // tường ngoài x ±18,5; tường sau (v4: −91,2 = thế giới −113,2; sâu trong 26,9 m); mép nền phía trước (thế giới ZS −85,3 — chỉ còn là một đường trên sân thượng trên cùng)
  const ZF = -64.3, WT = 0.4;              // mặt ngoài tường trước (thế giới −86,3; hiên nông 1 m); tường dày 0,4 (0,25 vữa + 0,15 ván lót)
  const YW = 10.7, YE = 10.5;              // đỉnh tường / mép mái tầng dưới (v4: +2,5 m so với v3 8,2 / 8,0)
  const YB = YW - 0.85, YAI = YE + 0.02;   // đáy dải đà ngang quanh đỉnh tường / trần hai gian bên
  const ZC = -77.75;                       // trục chung của ba tầng mái (= giữa ZF và ZB)
  const NAVE = 15.4;                       // nửa bề ngang gian giữa (hàng cột ngoài)
  const YCE = 13.62;                       // trần gian giữa (cao 11,7 m so với sàn)
  const TT = Y0 + 1.45;                    // mặt bàn thờ (kể cả viền vàng)
  const ZBUD = -86.0;                      // tâm bệ ba pho Phật (thế giới −108); bệ giữa r 3,19 → mặt sau cách tường sau (−90,8) ≥ 1,6 m
  const PH = 1.17, SIDE_X = 12.4;          // bệ cao 1,17 (= 0,9 × 1,3: chân tượng ở Y0 + PH); hai pho bên đặt ở x ±12,4 (≤ NAVE − 2,5 = 12,9: nằm trong gian giữa)
  // lưới trần / đà ngang (7 hàng ≈ 4,3 m): hai hàng đầu mút ở sát tường; ba hàng cột (CROWS) đặt GIỮA hai hàng bồ đoàn (cách ≥ 0,65 m) để bồ đoàn không đụng chân cột; hai hàng sau là đà ngang phía trên bàn thờ / bệ (không có cột: bàn thờ ở đó)
  const ZL = [-64.9, -69.05, -72.95, -76.85, -81.42, -85.98, -90.55], CROWS = [-69.05, -72.95, -76.85];
  const BAYS = ZL.slice(1).map((z, i) => (z + ZL[i]) / 2); // tâm sáu ô trần (cửa sổ hai bên, đèn lồng, ô sáng gác mái)
  const ROWS = [-65.8, -67.1, -68.4, -69.7, -71.0, -72.3, -73.6, -74.9, -76.2, -77.5]; // 10 hàng bồ đoàn, bước 1,3 m
  const NO_FP = [-20.4, 20.4, -117.8, -73.8]; // THẾ GIỚI: khuôn viên nền đá + điện: dọn nút dẫn đường / chỗ đứng cũ nằm trong đó

  // ---------- Bảng màu ----------
  const K = {
    plaster: 0xa3342b, plasterD: 0x8f2b24, skirt: C.stoneD, stone: C.stone, stoneL: C.stoneL, // tường son đậm kiểu cung đình (chân tường vẫn đá)
    wood: 0x8e2a22, woodD: 0x5e2c1a, woodL: 0x8a4626, dark: 0x24120a, panel: 0x6a2a1c, ceil: 0x5a2a1a,
    gold: 0xe2b04a, goldL: 0xf6d77c, goldD: 0xa87c2c, red: 0x9a2a1e, redD: 0x8a2418, lac: 0x8a2216,
    floor: 0x9a3826, mat: 0x8a281c, bronze: 0x7a6244, bronzeD: 0x54442f, cream: 0xf3e3c3,
  };

  // ---------- Bộ gom: ngoài / trong ----------
  const mk = () => ({ S: U.batch(), F: U.batch(), M: U.batch(), G: U.batch(), L: U.batch() }); // sơn (Lambert) / sàn / đồng / vàng / tự sáng
  const X = mk(), I = mk();
  const SPH = new THREE.SphereGeometry(1, 10, 7), SPHS = new THREE.SphereGeometry(1, 6, 4);
  const CN4 = new THREE.ConeGeometry(0.5, 1, 4), CN6 = new THREE.ConeGeometry(0.5, 1, 6);
  const OCT = new THREE.OctahedronGeometry(1, 0);
  const own = [SPH, SPHS, CN4, CN6, OCT];
  const put = (B, g, color, x, y, z, sx, sy = sx, sz = sx, o) => B.add(g, color, Object.assign({ p: [x, y, z], s: [sx, sy, sz] }, o));
  const _mp = new THREE.Matrix4(), _sv = new V3();
  // dựng một cụm theo toạ độ cục bộ rồi đặt tại (x,y,z), xoay yaw, thu phóng sc, đưa vào bộ gom B
  const grp = (B, T, x, y, z, yaw, sc) => {
    if (!T.list.length) return;
    const g = U.merge(T.list); _mp.makeRotationY(yaw); _mp.scale(_sv.set(sc, sc, sc)); _mp.setPosition(x, y, z); g.applyMatrix4(_mp); B.addGeo(g);
  };
  // chắn máy quay của thân điện: toạ độ khung v2 → thế giới (+DY, +DZ)
  const blocker = (x0, y0, z0, x1, y1, z1) => G.cam.blockers.push(new THREE.Box3(new V3(x0, y0 + DY, z0 + DZ), new V3(x1, y1 + DY, z1 + DZ)));
  // biển chữ: addSign tự scene.add(mesh) → chuyển vào hallGrp (Group.add gỡ khỏi scene); mesh giữ ma trận cục bộ (matrixAutoUpdate = false) nên vẫn đúng chỗ khi nhóm dời
  const sign = (...a) => { const m = GB.addSign(...a); hallGrp.add(m); return m; };
  // cửa sổ chấn song: nền tối + khung gỗ + song; face: 'S' (+z) 'N' (−z) 'E' (+x) 'W' (−x); (cx, cy, cz) là tâm cửa trên mặt tường
  function win(B, cx, cy, cz, w, h, face, nx = 4, ny = 3) {
    const flat = face === 'S' || face === 'N', sg = face === 'S' || face === 'E' ? 1 : -1;
    const at = (u, v, d) => (flat ? [cx + u, cy + v, cz + sg * d] : [cx + sg * d, cy + v, cz + u]);
    const sz = (a, b, c) => (flat ? [a, b, c] : [c, b, a]);
    const one = (u, v, d, a, b, c, color) => B.add(BOX, color, { p: at(u, v, d), s: sz(a, b, c), j: 0.04 });
    one(0, 0, 0.03, w, h, 0.06, K.dark);
    for (const s of [-1, 1]) { one(0, (s * h) / 2, 0.07, w + 0.24, 0.16, 0.14, K.woodD); one((s * w) / 2, 0, 0.07, 0.16, h, 0.14, K.woodD); }
    for (let i = 1; i < nx; i++) one(-w / 2 + (w * i) / nx, 0, 0.09, 0.06, h, 0.08, K.woodL);
    for (let j = 1; j < ny; j++) one(0, -h / 2 + (h * j) / ny, 0.09, w, 0.06, 0.08, K.woodL);
  }

  // bốn vách mỏng bao một hình chữ nhật (không có đáy / nắp): dùng cho tường gác tầng 2
  const ring = (B, x0, x1, z0, z1, y0, y1, t, color) => {
    boxMM(B, x0, y0, z0, x0 + t, y1, z1, color); boxMM(B, x1 - t, y0, z0, x1, y1, z1, color);
    boxMM(B, x0 + t, y0, z0, x1 - t, y1, z0 + t, color); boxMM(B, x0 + t, y0, z1 - t, x1 - t, y1, z1, color);
  };
  const meshIn = [], meshOut = [];
  // vật liệu vàng trong điện (sáng hơn vàng ngoài sân) + đồng sẫm cho tượng; đổi độ sáng theo ngày/đêm ở cuối hàm
  const goldI = new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 60, specular: 0xffe6a0, emissive: 0x6e4410, flatShading: true });
  const buddhaMat = new THREE.MeshPhongMaterial({ vertexColors: true, color: 0xb08a5c, shininess: 45, specular: 0x8a6a30, emissive: 0x2a1a0a, flatShading: true });

  // =====================================================================
  //  NỀN ĐÁ BA TẦNG ("Tu Di toạ") + THANG LỚN BA CHẶNG + THỀM RỒNG (đan bệ) + LAN CAN + ĐẦU RỒNG THOÁT NƯỚC
  //  >>> DỰNG Ở TOẠ ĐỘ THẾ GIỚI, thẳng vào scene (KHÔNG nằm trong hallGrp, KHÔNG cộng DY/DZ). <<<  Thay nền + 3 bậc thềm nhỏ cũ của điện v2.
  //  v4: toàn bộ nền + thang lùi thêm 8 m so với v3 (chân thang −74; mặt sau tầng 1 sát mặt trong tường bao z −117,7).
  //  Nằm trên tầng nền chính điện (y 1,2; 08/09-world2). Tầng 1: x ±20,2, z −75,8 … −117,7, mặt y 2,4; tầng 2: x ±19,6, z −79,4 … −117,1, mặt 3,6;
  //  tầng 3 (nền điện): x ±19,0, z −83,0 … −116,5, mặt 4,8. Mặt trước thẳng đứng; mặt bên tầng 1 trùng tường hông tầng nền (x ±20,2), tầng 2/3 thụt 0,6 m mỗi tầng.
  //  Thang trên trục |x| ≤ 7: ba chặng 6 bậc (cao 0,2 / sâu 0,3): F1 z −74 → −75,8 (y 1,2 → 2,4), F2 −77,6 → −79,4 (→ 3,6), F3 −81,2 → −83 (→ 4,8);
  //  hai bên thềm rồng (|x| < 1,3) là hai chặng bậc, má thang đá 7 ≤ |x| ≤ 7,5. Chiếu nghỉ: L1 −75,8…−77,6, L2 −79,4…−81,2, sân thượng −83…−85,3 trước cột hiên (z −85,9).
  //  Độ cao dưới chân (G.heightAt) bọc ở cuối hàm; vật cản (tường mặt tầng, má thang, lan can, chặn lối hẹp) dựng ngay trong khối này.
  // =====================================================================
  const baseMeshes = [];
  let baseTris = 0;
  safe('nền đá ba tầng', () => {
    const BS = U.batch(), BG = U.batch();                    // đá (Lambert, màu đỉnh) / chi tiết mạ vàng (đầu rồng thềm, núm trụ góc)
    // hộp không đáy (đáy luôn úp sát mặt dưới nên không bao giờ thấy): bớt 1/6 số tam giác. Thứ tự mặt của BoxGeometry: +x −x +y −y +z −z
    const BOXT = (() => { const g = new THREE.BoxGeometry(1, 1, 1), a = g.index.array, keep = []; for (let f = 0; f < 6; f++) if (f !== 3) for (let k = 0; k < 6; k++) keep.push(a[f * 6 + k]); g.setIndex(keep); return g; })();
    const PLN = new THREE.PlaneGeometry(1, 1); PLN.rotateX(-PI / 2);   // tấm phẳng hướng lên (đường chỉ lát, đường giữa)
    const KNOB = new THREE.SphereGeometry(1, 6, 3), NECK = new THREE.CylinderGeometry(0.5, 0.5, 1, 5);
    own.push(BOXT, PLN, KNOB, NECK);
    const M1 = 0xece4d4, M2 = 0xd9d0bd, MR = 0xe6dcc6, MRD = 0xb3a88f, MC = 0xcfc5ad, MLN = 0xc4baa3; // đá trắng hai tông / thềm rồng ấm hơn / nét chạm sẫm / mây / đường chỉ lát
    const GD = 0xd9a84a, GDL = 0xf0cf70;                                                          // vàng cho chi tiết mạ
    const bx = (B, x0, y0, z0, x1, y1, z1, color, j = 0.03) => B.add(BOXT, color, { p: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], s: [Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)], j });
    // hộp "xiên" giữa hai mặt phẳng z (zA < zB): tại zA cao yA0…yA1, tại zB cao yB0…yB1 (khối dưới thềm rồng, má thang, mũ má dốc)
    const wedge = (B, x0, x1, zA, zB, yA0, yA1, yB0, yB1, color, j = 0.03) => {
      const g = new THREE.BoxGeometry(1, 1, 1), P = g.attributes.position;
      for (let i = 0; i < P.count; i++) { const px = P.getX(i) > 0, py = P.getY(i) > 0, pz = P.getZ(i) > 0; P.setXYZ(i, px ? x1 : x0, pz ? (py ? yB1 : yB0) : (py ? yA1 : yA0), pz ? zB : zA); }
      B.add(g, color, { j }); g.dispose();
    };
    const lnX = (x0, x1, z, y) => BS.add(PLN, MLN, { p: [(x0 + x1) / 2, y + 0.011, z], s: [x1 - x0, 1, 0.035], j: 0.01 });
    const lnZ = (x, z0, z1, y) => BS.add(PLN, MLN, { p: [x, y + 0.011, (z0 + z1) / 2], s: [0.035, 1, Math.abs(z1 - z0)], j: 0.01 });

    const SX = 7, RW = 1.3, CHW = 0.5;                       // nửa bề rộng thang / nửa bề rộng thềm rồng / dày má thang
    const TIER = [
      { hx: 20.2, zf: -75.8, zb: -117.7, y0: 1.2, y1: 2.4 },
      { hx: 19.6, zf: -79.4, zb: -117.1, y0: 2.4, y1: 3.6 },
      { hx: 19.0, zf: -83.0, zb: -116.5, y0: 3.6, y1: 4.8 },
    ];
    const FL = [{ zf: -74.0, zt: -75.8, y0: 1.2 }, { zf: -77.6, zt: -79.4, y0: 2.4 }, { zf: -81.2, zt: -83.0, y0: 3.6 }];
    const INS = 0.16;                                        // tâm lan can lùi vào so với mép tầng

    // ---------- Ba tầng: chân – thân dưới – eo lõm (Tu Di) có trụ nhỏ – thân trên – gờ chỉ sẫm 0,12 m – mặt đá nhô ra ----------
    TIER.forEach((T) => {
      const { hx, zf, zb, y0, y1 } = T;
      const ring = (o, ya, yb, color) => bx(BS, -hx - o, ya, zb - o, hx + o, yb, zf + o, color);
      ring(0.05, y0, y0 + 0.14, M2);                         // chân
      ring(0, y0 + 0.14, y0 + 0.45, M1);                     // thân dưới
      ring(-0.07, y0 + 0.45, y0 + 0.75, M2);                 // eo lõm cao 0,3 giữa mặt
      ring(0, y0 + 0.75, y1 - 0.24, M1);                     // thân trên
      ring(0.03, y1 - 0.24, y1 - 0.12, M2);                  // gờ chỉ sẫm dưới mép trên 0,12 m
      ring(0.07, y1 - 0.12, y1, M1);                         // mặt đá (mép nhô)
      // trụ nhỏ trong eo lõm (mặt trước + hai mặt bên; mặt sau khuất)
      const ya = y0 + 0.45, yb = y0 + 0.75, runF = 2 * hx, nF = Math.max(2, Math.round(runF / 1.5)), runS = zf - zb, nS = Math.max(2, Math.round(runS / 2.0));
      for (let i = 0; i <= nF; i++) { const x = -hx + (runF * i) / nF; bx(BS, x - 0.08, ya, zf - 0.075, x + 0.08, yb, zf + 0.005, M1, 0.02); }
      for (const s of [-1, 1]) for (let i = 1; i <= nS; i++) { const z = zf - (runS * i) / nS; bx(BS, s > 0 ? hx - 0.075 : -hx - 0.005, ya, z - 0.08, s > 0 ? hx + 0.005 : -hx + 0.075, yb, z + 0.08, M1, 0.02); }
    });

    // ---------- Mặt lát: đường chỉ trên phần chiếu của từng tầng, đường giữa ấm màu (lối "ngự đạo" chạy suốt trục) ----------
    {
      const xg = []; for (let x = SX + 0.5 + 1.8; x < 20.0; x += 1.8) xg.push(x);                   // đường chỉ dọc z ở hai cánh: 9,3 11,1 … 18,3
      TIER.forEach((T, i) => {
        const zNext = i < 2 ? TIER[i + 1].zf : ZF + DZ, hxc = i < 2 ? T.hx - 0.1 : 18.5; // tầng 3: tới mặt ngoài tường trước điện (thế giới −86,3)
        for (const s of [-1, 1]) for (const x of xg) if (x < hxc) lnZ(s * x, T.zf - 0.04, zNext + 0.04, T.y1);
        const zm = (T.zf + zNext) / 2;
        lnX(SX + 0.5, hxc, zm, T.y1); lnX(-hxc, -(SX + 0.5), zm, T.y1);
      });
      // đường giữa (|x| < 1,3) trên ba chiếu: tông ấm + hai đường viền
      for (const [za, zb2, y] of [[-75.8, -77.6, 2.4], [-79.4, -81.2, 3.6], [-83.0, ZF + DZ, 4.8]]) {
        BS.add(PLN, MR, { p: [0, y + 0.008, (za + zb2) / 2], s: [2 * RW, 1, Math.abs(zb2 - za)], j: 0.015 });
        for (const s of [-1, 1]) lnZ(s * (RW - 0.02), za, zb2, y + 0.002);
      }
    }

    // ---------- Trụ + tấm lan can ----------
    // trụ: 'n' thường 0,28 × 1,0 + cổ + núm cầu; 'b' trụ góc lớn 0,40 × 1,2 núm mạ vàng; 's' trụ nhỏ trên má thang 0,24 × 0,85
    const post = (x, z, yf, kind = 'n') => {
      const big = kind === 'b', sm = kind === 's', w = big ? 0.4 : sm ? 0.24 : 0.28, h = big ? 1.2 : sm ? 0.85 : 1.0, r = big ? 0.16 : sm ? 0.085 : 0.105, c = w / 2;
      bx(BS, x - c - 0.04, yf, z - c - 0.04, x + c + 0.04, yf + 0.1, z + c + 0.04, M2);          // chân trụ
      bx(BS, x - c, yf + 0.1, z - c, x + c, yf + h, z + c, M1);                                  // thân trụ
      BS.add(NECK, M2, { p: [x, yf + h + 0.035, z], s: [w * 0.62, 0.07, w * 0.62], j: 0.02 });   // cổ
      (big ? BG : BS).add(KNOB, big ? GD : M1, { p: [x, yf + h + 0.07 + r * 0.75, z], s: [r, r * 1.12, r], j: 0.02 }); // núm đầu trụ (cầu)
    };
    // tấm lan can phẳng giữa hai trụ: thân lõm (có hoa thoi chạm nổi) + thanh trên + thanh chân; cao 0,95, dày ≈ 0,12 (rộng hơn ở hai thanh)
    const panel = (cx, cz, alongX, len, yf, light) => {
      const hl = len / 2, T = (tt, y0, y1, color) => (alongX ? bx(BS, cx - hl, yf + y0, cz - tt, cx + hl, yf + y1, cz + tt, color) : bx(BS, cx - tt, yf + y0, cz - hl, cx + tt, yf + y1, cz + hl, color));
      T(0.05, 0.1, 0.85, M1);                                  // thân (lõm so với hai thanh)
      T(0.08, 0.85, 0.95, M2);                                 // thanh trên
      if (light) return;
      T(0.08, 0.0, 0.1, M2);                                   // thanh chân
      BS.add(BOX, MC, { p: [cx, yf + 0.475, cz], s: alongX ? [0.34, 0.34, 0.13] : [0.13, 0.34, 0.34], r: alongX ? [0, 0, PI / 4] : [PI / 4, 0, 0], j: 0.02 }); // hoa thoi chạm nổi
    };
    // lan can thẳng dọc một cạnh (song song trục x hoặc z): từ (ax,az) tới (bx2,bz), sàn yf; trụ cách nhau ≈ 1,5 m; ends = loại trụ hai đầu (null: không dựng — đã có trụ góc)
    const balu = (ax, az, bx2, bz, yf, ends, o = {}) => {
      const alongX = Math.abs(bx2 - ax) >= Math.abs(bz - az), len = alongX ? Math.abs(bx2 - ax) : Math.abs(bz - az);
      const n = Math.max(1, Math.round(len / (o.sp || 1.5))), sp = len / n, sx = alongX ? Math.sign(bx2 - ax) : 0, sz = alongX ? 0 : Math.sign(bz - az);
      for (let i = 0; i <= n; i++) { const kind = i === 0 ? ends[0] : i === n ? ends[1] : 'n'; if (kind) post(ax + sx * sp * i, az + sz * sp * i, yf, kind); }
      for (let i = 0; i < n; i++) panel(ax + sx * sp * (i + 0.5), az + sz * sp * (i + 0.5), alongX, sp - 0.24, yf, o.light);
    };
    // đầu rồng thoát nước (螭首): cầu (đầu) + nón (mõm) dài 0,45 m nhô ra khỏi mặt đá dưới gờ chỉ, chúc nhẹ xuống; hai sừng nhỏ; (nx, nz) = hướng ra ngoài
    const spout = (x, y, z, nx, nz) => {
      const tip = [x + nx * 0.46, y - 0.1, z + nz * 0.46], mid = [x + nx * 0.2, y - 0.02, z + nz * 0.2], g = new THREE.ConeGeometry(0.1, 1, 6); g.rotateX(PI / 2);
      const sm = U.segMatrix(tip[0], tip[1], tip[2], mid[0], mid[1], mid[2]);
      BS.add(g, M2, { s: [1, 1, sm.len], m: sm.m, j: 0.02 }); g.dispose();                                                         // mõm
      BS.add(SPHS, M1, { p: [x + nx * 0.12, y + 0.02, z + nz * 0.12], s: [0.18, 0.15, 0.18], j: 0.02 });                              // đầu
      BG.add(KNOB, GDL, { p: tip, s: 0.045, j: 0.02 });                                                                              // ngọc ngậm trong miệng (mạ vàng)
      for (const sd of [-1, 1]) {
        BS.add(CN4, M2, { p: [x + nx * 0.08 - nz * sd * 0.09, y + 0.2, z + nz * 0.08 + nx * sd * 0.09], s: [0.055, 0.2, 0.055], r: [0, 0, 0], j: 0.02 }); // sừng
        BG.add(OCT, GD, { p: [x + nx * 0.22 - nz * sd * 0.09, y + 0.09, z + nz * 0.22 + nx * sd * 0.09], s: 0.03, j: 0.02 });          // mắt
      }
    };

    // ---------- Lan can mọi mép trên + đầu rồng ----------
    TIER.forEach((T, i) => {
      const { hx, zf, zb, y1 } = T, xs = hx - INS, zFr = zf - INS, zBk = zb + INS, x0f = SX + 0.25;
      const run = xs - x0f, nn = Math.max(1, Math.round(run / 1.5)), spf = run / nn;
      for (const s of [-1, 1]) {
        balu(s * x0f, zFr, s * xs, zFr, y1, ['n', 'b']);                                  // mép trước: từ má thang tới góc
        balu(s * xs, zFr, s * xs, zBk, y1, [null, i === 0 ? 'n' : 'b'], { sp: 2.0 });       // mép bên: góc trước → góc sau (tầng 1 chạm tường bao); v4: cạnh dài 42 m nên trụ thưa hơn (2,0 m) để giữ ngân sách tam giác
        for (let k = 2; k < nn; k += 2) spout(s * (x0f + spf * k), y1 - 0.36, zf, 0, 1);   // đầu rồng dưới mỗi trụ thứ hai
        spout(s * hx, y1 - 0.36, zf, s * 0.7071, 0.7071);                                  // góc trước
        if (i > 0) spout(s * hx, y1 - 0.36, zb, s * 0.7071, -0.7071);                      // góc sau (tầng 2, 3)
      }
      if (i > 0) balu(-xs, zBk, xs, zBk, y1, [null, null], { light: true, sp: 2.4 });     // mép sau (chỉ thấy từ trên cao hoặc ngoài tường)
    });

    // ---------- Ba chặng thang + má thang + thềm rồng ----------
    const slope = Math.atan2(1.2, 1.8), SL = Math.hypot(1.8, 1.2), dirZ = -1.8 / SL, dirY = 1.2 / SL, nrmY = 1.8 / SL, nrmZ = 1.2 / SL; // dốc 33,7°
    FL.forEach((F, fi) => {
      const { zf, zt, y0 } = F, Lz = (z) => y0 + (1.2 * (zf - z)) / 1.8;                    // đường dốc = công thức heightAt
      // sáu bậc, hai bên thềm rồng (|x| 1,3 … 7)
      for (let k = 0; k < 6; k++) {
        const za = zf - 0.3 * k, zb2 = zf - 0.3 * (k + 1), top = y0 + 0.2 * (k + 1), c = k % 2 ? 0xe8dfce : M1;
        bx(BS, RW, y0, zb2, SX, top, za, c); bx(BS, -SX, y0, zb2, -RW, top, za, c);
      }
      // thềm rồng: khối đá dốc phủ lên đường dốc 0,03 m, nền ấm 0xe6dcc6, viền nổi, rồng uốn + mây nổi + ngọc
      wedge(BS, -RW, RW, zt, zf, y0, Lz(zt) + 0.03, y0, Lz(zf) + 0.03, MR, 0.015);
      for (const s of [-1, 1]) wedge(BS, s > 0 ? RW - 0.17 : -RW, s > 0 ? RW : -RW + 0.17, zt, zf, Lz(zt) + 0.03, Lz(zt) + 0.15, Lz(zf) + 0.03, Lz(zf) + 0.15, M2, 0.02); // viền hai bên
      bx(BS, -RW, y0, zf - 0.14, RW, y0 + 0.15, zf, M2, 0.02); bx(BS, -RW, Lz(zt) + 0.0, zt, RW, Lz(zt) + 0.15, zt + 0.14, M2, 0.02);                            // viền chân, viền đỉnh
      const pt = (u, v, lift) => [v, y0 + 0.03 + dirY * u + nrmY * lift, zf + dirZ * u + nrmZ * lift];
      // dải chạm nổi trên mặt thềm: (u dọc theo dốc từ chân, v ngang, lift nhô lên theo pháp tuyến mặt dốc); các đoạn thẳng dựng bằng segMatrix giữa hai điểm 3D
      const seg3 = (B, geo, color, a, b, w, h, grow = 0.02) => { const sm = U.segMatrix(a[0], a[1], a[2], b[0], b[1], b[2]); B.add(geo, color, { s: [w, h, sm.len + grow], m: sm.m, j: 0.03 }); };
      const cone3 = (B, color, tip, base, rad) => { const g = new THREE.ConeGeometry(rad, 1, 5); g.rotateX(PI / 2); const sm = U.segMatrix(tip[0], tip[1], tip[2], base[0], base[1], base[2]); B.add(g, color, { s: [1, 1, sm.len], m: sm.m, j: 0.03 }); g.dispose(); };
      const sg = fi % 2 ? -1 : 1, ph = fi * 1.3, AMP = 0.5, KK = 3.9, u0 = 0.3, u1 = SL - 0.62;
      const vOf = (u) => sg * AMP * Math.sin(KK * (u - u0) + ph);
      // rồng uốn lượn: lấy mẫu đều theo độ dài cung → 16 điểm; thân = 15 đoạn hộp (đuôi mảnh dưới chân → cổ to dần phía trên) nối bằng khối thoi; vây lưng mạ vàng; tông đá sẫm
      const dense = [[u0, vOf(u0), 0]];
      for (let i = 1; i <= 240; i++) { const u = u0 + ((u1 - u0) * i) / 240, v = vOf(u), p = dense[i - 1]; dense.push([u, v, p[2] + Math.hypot(u - p[0], v - p[1])]); }
      const NB = 15, samp = [], arc = dense[240][2];
      for (let i = 0; i <= NB; i++) { const s = (arc * i) / NB; let j = 1; while (j < 240 && dense[j][2] < s) j++; const a = dense[j - 1], b = dense[j], t = (s - a[2]) / Math.max(1e-6, b[2] - a[2]); samp.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
      for (let i = 0; i < NB; i++) {
        const t = i / NB, w = 0.07 + 0.075 * t, h = 0.09 + 0.07 * t, pa = pt(samp[i][0], samp[i][1], h / 2), pb = pt(samp[i + 1][0], samp[i + 1][1], h / 2);
        seg3(BS, BOXT, MRD, pa, pb, w, h, 0.03);
        BS.add(OCT, MRD, { p: pb, s: [w * 0.66, h * 0.62, w * 0.66], j: 0.03 });
        if (i % 2 === 1) BG.add(CN4, GD, { p: pt(samp[i][0], samp[i][1], h + 0.045), s: [0.05, 0.1, 0.045], r: [slope, 0, 0], j: 0.02 });
      }
      const tg = (a, b) => { const du = b[0] - a[0], dv = b[1] - a[1], l = Math.hypot(du, dv) || 1; return [du / l, dv / l]; };
      const t0 = tg(samp[1], samp[0]), tH = tg(samp[NB - 1], samp[NB]), lat = [-tH[1], tH[0]];
      const at = (o, d, sd, lf) => pt(o[0] + tH[0] * d + lat[0] * sd, o[1] + tH[1] * d + lat[1] * sd, lf);       // điểm cách đầu thân d dọc hướng đầu, sd ngang
      cone3(BS, MRD, pt(samp[0][0] + t0[0] * 0.2, samp[0][1] + t0[1] * 0.2, 0.05), pt(samp[0][0], samp[0][1], 0.05), 0.045);                              // vây đuôi
      // đầu rồng mạ vàng: sọ, hàm trên + hàm dưới, hai sừng, hai râu, hai mắt, ngọc phía trước
      const hd = samp[NB];
      BG.add(SPHS, GD, { p: at(hd, 0.07, 0, 0.13), s: [0.15, 0.12, 0.15], r: [slope, 0, 0], j: 0.02 });
      seg3(BG, BOXT, GDL, at(hd, 0.08, 0, 0.15), at(hd, 0.34, 0, 0.13), 0.14, 0.07, 0.02);                    // hàm trên
      seg3(BG, BOXT, GD, at(hd, 0.08, 0, 0.07), at(hd, 0.28, 0, 0.055), 0.11, 0.05, 0.02);                    // hàm dưới
      for (const sd of [-1, 1]) {
        cone3(BG, GD, at(hd, -0.14, sd * 0.14, 0.34), at(hd, 0.0, sd * 0.07, 0.2), 0.04);                       // sừng
        seg3(BG, BOXT, GD, at(hd, 0.33, sd * 0.04, 0.1), at(hd, -0.1, sd * 0.4, 0.09), 0.018, 0.018, 0);       // râu
        BS.add(OCT, 0x40342a, { p: at(hd, 0.14, sd * 0.08, 0.21), s: 0.026, j: 0.01 });
      }
      BG.add(KNOB, GDL, { p: at(hd, 0.56, 0, 0.1), s: [0.1, 0.1, 0.1], j: 0.02 });                              // ngọc
      // mây nổi: cụm ba mô cầu dẹt, đặt ở chỗ cách thân rồng ≥ 0,32 m
      const rnd = U.rng(17 + fi * 5), nearD = (u, v) => samp.reduce((m, q) => Math.min(m, Math.hypot(q[0] - u, q[1] - v)), 9);
      for (let uu = 0.22; uu < SL - 0.18; uu += 0.4) for (let vv = -0.92; vv <= 0.93; vv += 0.46) {
        const u = uu + (rnd() - 0.5) * 0.14, v = vv + (rnd() - 0.5) * 0.14;
        if (Math.abs(v) > 0.98 || nearD(u, v) < 0.34 || nearD(u + 0.1, v) < 0.3) continue;
        const k = 0.9 + rnd() * 0.4;
        for (const [du2, dv2, rr] of [[0, -0.1, 0.085], [0.02, 0.0, 0.115], [0, 0.1, 0.08]]) BS.add(KNOB, MC, { p: pt(u + du2 * k, v + dv2 * k, 0.015), s: [rr * k, 0.06, rr * 0.8 * k], r: [slope, 0, 0], j: 0.03 });
      }
      for (const sx of [-1, 1]) for (const [u, lf] of [[0.02, 0.15], [SL - 0.06, 0.15]]) BG.add(KNOB, GDL, { p: pt(u, sx * (RW - 0.085), lf), s: 0.07, j: 0.02 });   // bốn núm vàng ở góc viền
      // má thang đá: khối dốc cao hơn đường dốc 0,5 m + mũ dốc nhô ra 0,06 + trụ đầu (núm cầu) + lan can dốc có trụ giữa
      for (const s of [-1, 1]) {
        const xa = s > 0 ? SX : -SX - CHW, xb = s > 0 ? SX + CHW : -SX;
        wedge(BS, xa, xb, zt, zf, y0, Lz(zt) + 0.5, y0, Lz(zf) + 0.5, M1);
        wedge(BS, xa - 0.06, xb + 0.06, zt, zf, Lz(zt) + 0.5, Lz(zt) + 0.58, Lz(zf) + 0.5, Lz(zf) + 0.58, M2);
        const xc = s * (SX + CHW / 2), zp = [zf - 0.17, (zf + zt) / 2, zt + 0.17], yp = zp.map((z) => Lz(z) + 0.5);       // đáy trụ hạ 0,08 để không hở trên mũ dốc
        zp.forEach((z, k) => post(xc, z, yp[k], 's'));
        for (let k = 0; k < 2; k++) {
          const a = [xc, yp[k] + 0.55, zp[k]], b = [xc, yp[k + 1] + 0.55, zp[k + 1]], d = Math.hypot(b[1] - a[1], b[2] - a[2]), ux = (b[2] - a[2]) / d, uy = (b[1] - a[1]) / d;
          const a2 = [xc, a[1] + uy * 0.12, a[2] + ux * 0.12], b2 = [xc, b[1] - uy * 0.12, b[2] - ux * 0.12];
          const sm = U.segMatrix(a2[0], a2[1], a2[2], b2[0], b2[1], b2[2]);
          BS.add(BOXT, M1, { s: [0.12, 0.62, sm.len], m: sm.m, j: 0.02 });
          const a3 = [xc, a2[1] + 0.31, a2[2]], b3 = [xc, b2[1] + 0.31, b2[2]], sm2 = U.segMatrix(a3[0], a3[1], a3[2], b3[0], b3[1], b3[2]);
          BS.add(BOXT, M2, { s: [0.17, 0.09, sm2.len + 0.04], m: sm2.m, j: 0.02 });
        }
      }
    });

    // ---------- Vật cản (thế giới) ----------
    for (const s of [-1, 1]) {
      const sb = (xa, za, xb, zb2, tag) => col.box(s * xa, za, s * xb, zb2, tag);       // hộp đối xứng qua trục x = 0
      TIER.forEach((T, i) => {
        sb(SX + CHW, T.zf, T.hx, T.zf + 0.3, 'tier');                                    // mặt trước tầng (phía thấp), ngoài các chặng thang
        sb(SX + CHW, T.zf - INS - 0.17, T.hx, T.zf - INS + 0.17, 'rail');                // lan can mép trước (phía cao)
        sb(T.hx - INS - 0.17, T.zb, T.hx - INS + 0.17, T.zf, 'rail');                   // lan can mép bên
        if (i > 0) col.box(-T.hx, T.zb + INS - 0.17, T.hx, T.zb + INS + 0.17, 'rail');  // lan can mép sau
      });
      FL.forEach((F) => sb(SX, F.zt, SX + CHW, F.zf, 'cheek'));                           // má thang (chỉ dọc chặng; chiếu nghỉ để ngỏ với cánh tầng)
      sb(19.6, -79.7, 20.2, -79.1, 'rail'); sb(19.0, -83.3, 19.6, -82.7, 'rail'); sb(18.5, -85.6, 19.0, -85.0, 'rail'); // (v4: dời −8 so với v3) chặn lối hẹp bên cạnh tầng 2, tầng 3 và dải 0,5 m cạnh tường điện
    }

    // ---------- Gộp mesh (vào scene thế giới) ----------
    const addBase = (B, name, mat) => { if (!B.list.length) return; const m = B.mesh(mat, { cast: true, receive: true }); m.name = 'chinhDien:' + name; baseTris += m.geometry.attributes.position.count / 3; scene.add(m); baseMeshes.push(m); };
    addBase(BS, 'nen-da', G.mats.vc); addBase(BG, 'nen-vang', G.mats.gold);
  });

  // =====================================================================
  //  TƯỜNG, CỬA, CỘT HIÊN, MÁI BA TẦNG (phần "ngoài")
  // =====================================================================
  safe('tường', () => {
    // đoạn tường trước (mặt ngoài z = ZF): vữa ngoài + ván lót trong
    const fw = (xa, xb, yA, yB, solid) => {
      boxMM(X.S, xa, yA, ZF - 0.25, xb, yB, ZF, K.plaster);
      boxMM(I.S, xa, yA, ZF - WT, xb, yB, ZF - 0.25, K.panel);
      if (solid) { boxMM(X.S, xa, Y0, ZF - 0.2, xb, Y0 + 1.1, ZF + 0.06, K.skirt); colH.box(xa, ZF - WT, xb, ZF, 'hall'); }
      blocker(xa, yA, ZF - WT, xb, yB, ZF);
    };
    const DM = 3.6, DT = Y0 + 6.0;              // cửa chính: rộng ±3,6, mở cao đúng 6,0 m trên sàn (đỉnh ở khung v2 y 7,92; để ngỏ — cánh cửa do 19-cung-dinh.js, cao ≤ 5,8 m)
    const D2a = 9.4, D2b = 12.0, D2t = Y0 + 5.4; // cửa hông (đóng, cánh gỗ sơn son, cao 5,4 m): giữa hai cột x 8 và 13,4
    for (const sx of [-1, 1]) {
      const a = (u, v) => (sx > 0 ? [u, v] : [-v, -u]);
      fw(...a(DM, D2a), Y0, YW, true); fw(...a(D2a, D2b), Y0, YW, true); fw(...a(D2b, XW), Y0, YW, true);
      // cửa hông: hai cánh có đinh vàng + ô thoáng chấn song phía trên; khung gỗ sẫm
      const dc = sx * ((D2a + D2b) / 2);
      for (const dx of [-0.65, 0.65]) {
        box(X.S, dc + dx, Y0 + 2.1, ZF + 0.05, 1.2, 4.2, 0.1, K.lac);
        box(X.G, dc + dx, Y0 + 2.1, ZF + 0.11, 0.9, 3.7, 0.03, K.goldD);
        for (let i = 0; i < 3; i++) for (let j = 0; j < 5; j++) sph(X.G, dc + dx + (i - 1) * 0.3, Y0 + 0.5 + j * 0.85, ZF + 0.14, 0.05, K.goldL, 5, 4);
        sph(X.G, dc + (dx > 0 ? 0.12 : -0.12), Y0 + 2.1, ZF + 0.15, 0.09, K.gold, 6, 4);
      }
      win(X.S, dc, Y0 + 4.85, ZF, D2b - D2a - 0.3, 1.1, 'S', 6, 1);
      for (const u of [D2a, D2b]) box(X.S, sx * u, (Y0 + D2t) / 2, ZF + 0.02, 0.26, D2t - Y0, 0.22, K.woodD);
      box(X.S, dc, D2t - 0.1, ZF + 0.02, D2b - D2a + 0.26, 0.2, 0.22, K.woodD);
      box(X.S, sx * 3.6, (Y0 + DT) / 2, ZF + 0.02, 0.3, DT - Y0, 0.24, K.woodD);
      for (const cx of [5.3, 15.7]) win(X.S, sx * cx, Y0 + 3.9, ZF, 2.4, 3.6, 'S', 4, 4);
      // tường hông
      const sw = (za, zb) => {
        const o = sx * XW, i = sx * (XW - 0.25), n = sx * (XW - WT);
        boxMM(X.S, Math.min(o, i), Y0, za, Math.max(o, i), YW, zb, K.plaster);
        boxMM(I.S, Math.min(i, n), Y0, za, Math.max(i, n), YW, zb, K.panel);
        boxMM(X.S, Math.min(o + sx * 0.06, o - sx * 0.2), Y0, za, Math.max(o + sx * 0.06, o - sx * 0.2), Y0 + 1.1, zb, K.skirt);
      };
      sw(ZB, ZF - WT);
      colH.box(sx * XW, ZB, sx * (XW - WT), ZF - WT, 'hall'); blocker(Math.min(sx * XW, sx * (XW - WT)), Y0, ZB, Math.max(sx * XW, sx * (XW - WT)), YW, ZF - WT);
      for (const z of BAYS) win(X.S, sx * XW, Y0 + 3.9, z, 2.6, 3.6, sx > 0 ? 'E' : 'W', 3, 4); // sáu cửa sổ mỗi bên, giữa sáu ô trần
    }
    // cửa chính: mái hiên đã che; thêm đà ngang vàng trên khung
    fw(-DM, DM, DT, YW, false);
    box(X.S, 0, DT + 0.1, ZF + 0.02, 2 * DM + 0.3, 0.2, 0.24, K.woodD); // v4: đà cửa nằm TRÊN đỉnh ô cửa (mặt dưới đúng ở DT) để khoảng thông cửa rộng 7,2 × 6,0 m còn nguyên
    box(X.G, 0, DT + 0.03, ZF + 0.16, 2 * DM, 0.06, 0.04, K.gold);
    box(I.S, 0, 0.02 + Y0, (ZF - 0.2), 2 * DM, 0.06, 0.8, K.woodD);   // ngưỡng cửa gỗ
    // tường sau
    boxMM(X.S, -XW, Y0, ZB, XW, YW, ZB + 0.25, K.plaster);
    boxMM(I.S, -XW + WT, Y0, ZB + 0.25, XW - WT, YW, ZB + WT, K.panel);
    boxMM(X.S, -XW, Y0, ZB - 0.06, XW, Y0 + 1.1, ZB + 0.2, K.skirt);
    colH.box(-XW, ZB, XW, ZB + WT, 'hall'); blocker(-XW, Y0, ZB, XW, YW, ZB + WT);
    for (const x of [-13, -6.5, 6.5, 13]) win(X.S, x, Y0 + 3.9, ZB, 2.4, 3.6, 'N', 3, 4);
    // đà ngang gỗ sẫm + viền vàng quanh đỉnh tường (dưới mái): bốn dải
    boxMM(X.S, -XW - 0.1, YB, ZF - 0.3, XW + 0.1, YW, ZF + 0.05, K.woodD);
    boxMM(X.S, -XW - 0.1, YB, ZB - 0.1, XW + 0.1, YW, ZB + 0.3, K.woodD);
    for (const sx of [-1, 1]) boxMM(X.S, sx * (XW + 0.1), YB, ZB - 0.1, sx * (XW - 0.3), YW, ZF + 0.05, K.woodD);
    boxMM(X.G, -XW - 0.12, YB - 0.05, ZF - 0.32, XW + 0.12, YB, ZF + 0.07, K.gold);
    boxMM(X.G, -XW - 0.12, YB - 0.05, ZB - 0.12, XW + 0.12, YB, ZB + 0.32, K.gold);
    for (const sx of [-1, 1]) boxMM(X.G, sx * (XW + 0.12), YB - 0.05, ZB - 0.12, sx * (XW - 0.32), YB, ZF + 0.07, K.gold);
  });

  // cột hiên, đà ngang, đèn lồng, bảng hiệu
  safe('hiên', () => {
    for (const x of [-18, -13.4, -8, -2.6, 2.6, 8, 13.4, 18]) { columnInto(X.S, X.F, x, -63.9, Y0, YE - Y0, 0.56, false); colH.circle(x, -63.9, 0.66, 'col'); } // columnInto tự đặt vật cản ở toạ độ thế giới → tắt, tự đặt qua colH (v4: cột hiên cao 8,6 m, r 0,56)
    boxMM(X.S, -18.6, YE - 0.95, -64.25, 18.6, YE, -63.55, K.woodD);
    boxMM(X.G, -18.6, YE - 1.01, -64.27, 18.6, YE - 0.95, -63.53, K.gold);
    for (const x of [-15.7, -10.7, -5.3, 0, 5.3, 10.7, 15.7]) hangLanternInto(X.S, X.L, x, YE - 1.01, -63.9, 0.8, 1.25);
  });

  // cắt bỏ phần mái nằm trong hình chữ nhật xa..xb × za..zb (chỗ gian giữa cao: trần ở đó, không để mái tầng 1 chui vào lòng điện);
  // giữ phần ngoài, nội suy vị trí + màu đỉnh. Miền giữ lại chia thành 4 vùng rời nhau (trái, phải, trước, sau)
  const clipOut = (g, xa, xb, za, zb) => {
    const P = g.attributes.position.array, Cl = g.attributes.color.array, pos = [], clr = [];
    const regs = [[[-1, 0, -xa]], [[1, 0, xb]], [[1, 0, xa], [-1, 0, -xb], [0, 1, zb]], [[1, 0, xa], [-1, 0, -xb], [0, -1, -za]]];
    for (let i = 0; i < P.length; i += 9) {
      const tri = [0, 1, 2].map((k) => [P[i + k * 3], P[i + k * 3 + 1], P[i + k * 3 + 2], Cl[i + k * 3], Cl[i + k * 3 + 1], Cl[i + k * 3 + 2]]);
      for (const reg of regs) {
        let poly = tri;
        for (const [nx, nz, d] of reg) {
          const nxt = [];
          for (let a = 0; a < poly.length; a++) {
            const A = poly[a], B = poly[(a + 1) % poly.length], da = nx * A[0] + nz * A[2] - d, db = nx * B[0] + nz * B[2] - d;
            if (da >= 0) nxt.push(A);
            if ((da >= 0) !== (db >= 0)) { const t = da / (da - db); nxt.push(A.map((v, k) => v + (B[k] - v) * t)); }
          }
          poly = nxt; if (poly.length < 3) break;
        }
        if (poly.length < 3) continue;
        for (let k = 1; k < poly.length - 1; k++) for (const V of [poly[0], poly[k], poly[k + 1]]) { pos.push(V[0], V[1], V[2]); clr.push(V[3], V[4], V[5]); }
      }
    }
    const o = new THREE.BufferGeometry();
    o.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); o.setAttribute('color', new THREE.Float32BufferAttribute(clr, 3));
    o.computeVertexNormals(); g.dispose();
    return o;
  };

  safe('mái', () => {
    const M = X.M;
    const TILE = { color: 0xd6a334, ridge: 0xb8862a, edge: 0x8c5a1e }; // ngói lưu ly vàng kiểu cung đình: mặt ngói / bờ nóc + đầu đao / mép diềm
    // v4: ba tầng mái ở y YE (10,5) / 13,9 / 17,1; sâu 30,4 / 28,6 / 15 (rộng 39,4 / 33,6 / 23,4 như v3), cao 3,75 / 2,97 / 2,53 (+10 %)
    const NZ0 = ZB + 0.2, NZ1 = ZF - 0.2;                     // gian giữa (nave) trong mặt bằng: x ±15,8, z −91,0 … −64,5 (khung v2)
    // tầng 1: mái hiên rộng bao quanh (mép y YE). Dựng vào bộ gom tạm rồi cắt phần nằm trong gian giữa (x ±15,8, z NZ0 … NZ1)
    { const T = U.batch(), TM = U.batch(), c = new V3();
      addRoof(T, 0, YE, ZC, 39.4, 30.4, 3.75, Object.assign({ curl: 0.7, sag: 0.1, seg: 18, thick: 0.2, metal: TM }, TILE));
      for (const g of T.list.splice(0)) {
        if (g.attributes.position.count > 300) { X.S.addGeo(clipOut(g, -15.8, 15.8, NZ0, NZ1)); continue; } // mặt mái
        g.computeBoundingBox(); g.boundingBox.getCenter(c); // sống mái, đầu đao: bỏ những mảnh nằm trong gian giữa
        if (Math.abs(c.x) < 15.8 && c.z > NZ0 && c.z < NZ1) g.dispose(); else X.S.addGeo(g);
      }
      for (const g of TM.list.splice(0)) X.M.addGeo(g); }
    // tầng 2: tường gác có cửa sổ + mái
    ring(X.S, -15.8, 15.8, NZ0, NZ1, YE - 0.4, 13.9, 0.2, K.plasterD);      // bốn vách (rỗng: nhìn từ trong lên là trần gian giữa, không có đáy hộp)
    ring(X.S, -15.95, 15.95, NZ0 - 0.05, NZ1 + 0.05, 13.45, 13.9, 0.55, K.woodD);   // đai gỗ sẫm quanh đỉnh
    ring(X.G, -15.97, 15.97, NZ0 - 0.07, NZ1 + 0.07, 13.4, 13.45, 0.6, K.gold);
    boxMM(I.S, -15.4, YAI - 0.1, ZB + WT, -15.35, YCE, ZF - WT, K.panel); boxMM(I.S, 15.35, YAI - 0.1, ZB + WT, 15.4, YCE, ZF - WT, K.panel);
    boxMM(I.S, -15.4, YAI - 0.1, ZF - WT - 0.05, 15.4, YCE, ZF - WT, K.panel); boxMM(I.S, -15.4, YAI - 0.1, ZB + WT, 15.4, YCE, ZB + WT + 0.05, K.panel);
    for (const x of [-12.9, -8.7, 8.7, 12.9]) win(X.S, x, 12.4, NZ1, 2.6, 1.6, 'S', 5, 2);
    for (const sx of [-1, 1]) for (const z of BAYS) win(X.S, sx * 15.8, 12.4, z, 2.6, 1.6, sx > 0 ? 'E' : 'W', 5, 2);
    sign(['ĐẠI HÙNG BẢO ĐIỆN'], 9.0, 1.7, 0, 12.35, NZ1 + 0.05, 0, { ppu: 200, bg1: '#1b1210', bg2: '#0d0908' });
    addRoof(X.S, 0, 13.9, ZC, 33.6, 28.6, 2.97, Object.assign({ curl: 0.6, sag: 0.1, seg: 16, thick: 0.2, metal: M }, TILE));
    // tầng 3: tường gác nhỏ + mái đỉnh có ngọc (mái đỉnh y 17,1: dòng addRoof dưới cùng là mái ĐỈNH — 19-cung-dinh.js đặt kìm nóc theo dòng này)
    boxMM(X.S, -10.4, 14.5, ZC - 6.4, 10.4, 17.1, ZC + 6.4, K.plasterD);
    boxMM(X.S, -10.55, 16.7, ZC - 6.55, 10.55, 17.1, ZC + 6.55, K.woodD);
    for (const x of [-6.2, -2.1, 2.1, 6.2]) win(X.S, x, 16.2, ZC + 6.4, 1.8, 1.3, 'S', 3, 2);
    addRoof(X.S, 0, 17.1, ZC, 23.4, 15, 2.53, Object.assign({ curl: 0.5, sag: 0.08, seg: 12, thick: 0.18, pearl: true, metal: M }, TILE));
  });

  // =====================================================================
  //  NỘI THẤT: sàn, thảm, cột, trần, đèn
  // =====================================================================
  safe('sàn', () => {
    const XI = XW - WT, ZI0 = ZB + WT, ZI1 = ZF - WT; // mặt trong: x ±18,1; z −90,8 … −64,7
    boxMM(I.F, -XI, Y0, ZI0, XI, Y0 + 0.015, ZI1, K.floor);
    for (const sx of [-1, 1]) boxMM(I.G, sx * 17.45, Y0 + 0.014, ZI0 + 0.4, sx * 17.55, Y0 + 0.02, ZI1 - 0.4, K.gold);
    // thảm lối giữa (x ±1,2) viền vàng; thảm vuông trước bàn thờ (x ±4,6, z −80,5 … −77,9: chỗ người chơi gõ mõ); chiếu dài dưới từng hàng bồ đoàn
    boxMM(I.F, -1.2, Y0 + 0.015, -78.05, 1.2, Y0 + 0.024, ZI1 - 0.05, K.redD);
    for (const sx of [-1, 1]) boxMM(I.G, sx * 1.2 - 0.04, Y0 + 0.024, -78.05, sx * 1.2 + 0.04, Y0 + 0.03, ZI1 - 0.05, K.gold);
    boxMM(I.F, -4.6, Y0 + 0.015, -80.5, 4.6, Y0 + 0.024, -78.05, K.redD);
    for (const z of [-80.5, -78.05]) boxMM(I.G, -4.6, Y0 + 0.024, z - 0.04, 4.6, Y0 + 0.03, z + 0.04, K.gold);
    for (const z of ROWS) for (const sx of [-1, 1]) {
      boxMM(I.F, sx * 1.45, Y0 + 0.015, z - 0.52, sx * 14.85, Y0 + 0.022, z + 0.52, K.mat);
      for (const dz of [-0.52, 0.52]) boxMM(I.G, sx * 1.45, Y0 + 0.022, z + dz - 0.025, sx * 14.85, Y0 + 0.027, z + dz + 0.025, K.goldD);
    }
  });

  // cột gỗ sẫm: x ±8,025 (giữa hai bồ đoàn) và ±15,4; ba hàng ở z CROWS (giữa các hàng bồ đoàn). Đà ngang / trần theo lưới ZL (7 hàng, 6 ô)
  safe('cột', () => {
    const cx = [-NAVE, -8.025, 8.025, NAVE];
    for (const x of cx) for (const z of CROWS) {
      cyl(I.F, x, Y0 + 0.2, z, 0.8, 0.86, 0.4, K.stone, 8);
      cyl(I.G, x, Y0 + 0.46, z, 0.6, 0.66, 0.12, K.gold, 10);
      const h = YCE - Y0 - 0.5;
      cyl(I.S, x, Y0 + 0.52 + h / 2, z, 0.5, 0.56, h, K.woodD, 10);
      for (const yy of [3.6, 7.0, 10.4]) cyl(I.G, x, yy, z, 0.56, 0.56, 0.1, K.gold, 10);
      cyl(I.G, x, YCE - 0.2, z, 0.62, 0.56, 0.2, K.gold, 10);
      colH.circle(x, z, 0.6, 'col');
    }
    // đà ngang nối đầu cột + đà dọc; viền vàng dưới đà (đà cao 0,75: y YCE − 0,75 … YCE)
    const YBM = YCE - 0.75;
    for (const z of ZL) {
      boxMM(I.S, -NAVE, YBM, z - 0.27, NAVE, YCE, z + 0.27, K.woodD);
      boxMM(I.G, -NAVE, YBM - 0.04, z - 0.27, NAVE, YBM, z + 0.27, K.goldD);
    }
    for (const x of [-NAVE + 0.27, -8.025, 0, 8.025, NAVE - 0.27]) {
      boxMM(I.S, x - 0.27, YBM, ZB + WT, x + 0.27, YCE, ZF - WT, K.woodD);
      boxMM(I.G, x - 0.27, YBM - 0.04, ZB + WT, x + 0.27, YBM, ZF - WT, K.goldD);
    }
    // trần: ô hộp đỏ sẫm có hoa vàng giữa mỗi ô (4 × 6 ô)
    boxMM(I.S, -NAVE, YCE, ZB + WT, NAVE, YCE + 0.14, ZF - WT, K.ceil);
    const xl = [-NAVE, -8.025, 0, 8.025, NAVE];
    for (let i = 0; i < 4; i++) for (let j = 0; j < ZL.length - 1; j++) {
      const xa = xl[i] + 0.3, xb = xl[i + 1] - 0.3, za = ZL[j + 1] + 0.3, zb = ZL[j] - 0.3;
      boxMM(I.S, xa, YCE - 0.04, za, xb, YCE, zb, K.redD);
      cyl(I.G, (xa + xb) / 2, YCE - 0.08, (za + zb) / 2, 0.4, 0.4, 0.06, K.gold, 10);
    }
    // trần hai gian bên (thấp, y YAI ≈ 10,5) + vách gác trong (ván sẫm có đường chỉ vàng)
    for (const sx of [-1, 1]) {
      boxMM(I.S, sx * NAVE, YAI, ZB + WT, sx * 18.1, YAI + 0.12, ZF - WT, K.ceil);
      boxMM(I.G, sx * (NAVE + 0.02), YAI - 0.04, ZB + WT, sx * (NAVE + 0.1), YAI, ZF - WT, K.goldD);
      for (const z of BAYS) { // ô sáng gác mái (cửa sổ trời nhìn từ trong), mỗi ô trần một ô
        boxMM(I.L, sx * (NAVE - 0.06), YAI + 0.9, z - 1.3, sx * (NAVE - 0.02), YCE - 0.8, z + 1.3, 0xc98a42);
        for (const dz of [-0.45, 0.45]) boxMM(I.S, sx * (NAVE - 0.1), YAI + 0.9, z + dz - 0.03, sx * (NAVE - 0.03), YCE - 0.8, z + dz + 0.03, K.woodD);
      }
    }
    // đường chỉ vàng quanh vách trong (cao 4,0 m)
    for (const sx of [-1, 1]) boxMM(I.G, sx * 18.08, 4.0, ZB + WT, sx * 18.0, 4.07, ZF - WT, K.gold);
    boxMM(I.G, -XW + WT, 4.0, ZB + WT, XW - WT, 4.07, ZB + WT + 0.04, K.gold);
  });

  // câu đối dọc trên bốn cột hàng gần bàn thờ nhất (hàng CROWS cuối, z −76,85), mặt hướng ra cửa
  safe('câu đối', () => {
    const txt = [['TỪ', 'BI', 'HỈ', 'XẢ'], ['GIỚI', 'ĐỊNH', 'TUỆ'], ['BÌNH', 'AN', 'HÒA', 'THUẬN'], ['TRÍ', 'TUỆ', 'AN', 'LẠC']];
    [-NAVE, -8.025, 8.025, NAVE].forEach((x, i) => { const m = sign(txt[i], 0.85, 4.0, x, 6.7, CROWS[CROWS.length - 1] + 0.58, 0, { vertical: true, ppu: 170, bg1: '#1b1210', bg2: '#0d0908' }); meshIn.push(m); });
  });

  // đèn chùm hoa sen: ba tầng cánh vàng quanh quả cầu sáng, xích treo từ trần
  safe('đèn chùm', () => {
    const lotus = (x, z, yc, k = 1.25) => { // k: hệ số to hơn v3 (điện cao 11,7 m)
      cyl(I.M, x, (YCE + yc + 0.5 * k) / 2, z, 0.04, 0.04, YCE - yc - 0.5 * k, K.goldD, 5);
      cyl(I.G, x, YCE - 0.1, z, 0.22 * k, 0.4 * k, 0.18, K.gold, 8);
      const tier = (R, n, len, wid, tilt, y, color, ph) => { // cánh sen bầu: elip dẹt nghiêng ra ngoài
        const st = Math.sin(tilt), ct = Math.cos(tilt); R *= k; len *= k; wid *= k; y = yc - (yc - y) * k;
        for (let i = 0; i < n; i++) { const a = ph + (i / n) * TAU, m = R + (st * len) / 2; I.G.add(SPHS, color, { p: [x + Math.sin(a) * m, y + (ct * len) / 2, z + Math.cos(a) * m], s: [wid, len / 2, wid * 0.32], r: [tilt, a, 0], order: 'YXZ' }); }
      };
      tier(0.35, 12, 1.15, 0.36, 1.05, yc - 0.65, K.gold, 0);
      tier(0.25, 9, 0.95, 0.32, 0.7, yc - 0.42, K.goldL, 0.35);
      tier(0.12, 7, 0.8, 0.27, 0.36, yc - 0.2, K.gold, 0.1);
      I.L.add(SPH, 0xffe9a8, { p: [x, yc + 0.32 * k, z], s: 0.3 * k, j: 0.02 });
      I.G.add(CN6, K.gold, { p: [x, yc + 0.72 * k, z], s: [0.18 * k, 0.4 * k, 0.18 * k] });
      I.G.add(CN6, K.gold, { p: [x, yc - 0.85 * k, z], s: [0.3 * k, 0.5 * k, 0.3 * k], r: [PI, 0, 0] });
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + 0.2; I.L.add(SPHS, 0xffd27a, { p: [x + Math.sin(a) * 1.3 * k, yc - 0.2 * k, z + Math.cos(a) * 1.3 * k], s: 0.1 * k, j: 0.02 }); }
      glow(x, yc, z, 3.6 * k, [1.0, 0.78, 0.4], false); glow(x, yc, z, 2.4 * k, [1.0, 0.6, 0.25], true);
    };
    for (const sx of [-1, 1]) for (const z of [-68, -74.5, -81]) lotus(sx * 5, z, 9.4); // 6 đèn chùm (v3: 4)
  });

  // đèn lồng đỏ: hai bên gian giữa dưới đà, và dọc hai gian bên
  safe('đèn lồng', () => {
    for (const sx of [-1, 1]) for (const z of BAYS.slice(0, 5)) for (const x of [2.0, 11.7]) hangLanternInto(I.S, I.L, sx * x, YCE - 0.79, z, 2.0, 1.3); // gian giữa: 5 ô đầu (ô sau cùng là hào quang) × 2 hàng × 2 bên = 20 đèn, treo dưới đà
    for (const sx of [-1, 1]) for (const z of BAYS) hangLanternInto(I.S, I.L, sx * 16.9, YAI, z, 0.8, 1.1);                                        // hai gian bên: 6 đèn mỗi bên
  });

  // =====================================================================
  //  160 BỒ ĐOÀN (10 hàng × 16) + CHỖ NGỒI CỦA NGƯỜI CHƠI + MÕ
  // =====================================================================
  const CUSH = lathe([[0, 0], [0.3, 0], [0.34, 0.04], [0.32, 0.11], [0.18, 0.15], [0, 0.155]], 8);
  const BIGC = lathe([[0, 0], [0.46, 0], [0.5, 0.05], [0.47, 0.15], [0.3, 0.2], [0, 0.205]], 12);
  own.push(CUSH, BIGC);
  const sxAt = (k) => 1.9 + k * 1.75; // k = 0…7 → 1,9 … 14,15 (ROWS: 10 hàng khai báo ở khối kích thước chính)
  const HALL = G.world.hall;
  // máy quay hoạt động gõ mõ (30-activities-a đọc W.hall.cam lúc bắt đầu): sau lưng, hơi lệch trái người chơi, thấy cả người chơi + mõ + pho Phật giữa + hào quang.
  // Lõi máy quay lùi máy ×pull trên màn dọc hẹp; ở đây chia trước cho pull để máy dừng đúng chỗ mong muốn (như 17-dien-phu.js)
  const CAMD = { pos: [-1.0, 4.9, -69.6], look: [0, 4.7, -86] }, CAMP = { pos: [-1.0, 4.6, -71.4], look: [0, 4.4, -86] }; // toạ độ KHUNG v2 (dùng cho lối nhìn bồ đoàn bên dưới); v4: pho Phật cao 1,3× nên máy lùi + nâng
  const camW = (c) => ({ pos: [c.pos[0], c.pos[1] + DY, c.pos[2] + DZ], look: [c.look[0], c.look[1] + DY, c.look[2] + DZ] }); // → thế giới (+DY, +DZ)
  const CAMDW = camW(CAMD), CAMPW = camW(CAMP);
  const camNow = (k) => {
    const asp = G.size.w / G.size.h, c = asp < 0.8 ? CAMPW : CAMDW, pull = asp < 1 ? U.clamp(0.66 / asp, 1, 1.5) : 1;
    return k === 'look' ? c.look.slice() : [0, 1, 2].map((i) => c.look[i] + (c.pos[i] - c.look[i]) / pull);
  };
  HALL.cam = { get pos() { return camNow('pos'); }, get look() { return camNow('look'); }, desktop: CAMDW, phone: CAMPW };
  const MO = { x: 0.1, z: -79.3 };       // chỗ chiếc mõ (bên phải, hơi lên trước bồ đoàn của người chơi) — v4: hàng bồ đoàn cuối −77,5, dải trống, rồi chỗ gõ mõ
  let seatTotal = 0;
  safe('bồ đoàn', () => {
    // đoạn thẳng từ máy quay hoạt động gõ mõ (cả bản máy tính lẫn màn dọc) tới tượng: bồ đoàn nằm trên lối nhìn chỉ bày, không cho khách ngồi
    const lane = (c, x, z) => {
      const lx = c.look[0], lz = c.look[2], dx = c.pos[0] - lx, dz = c.pos[2] - lz;
      const t = U.clamp(((x - lx) * dx + (z - lz) * dz) / (dx * dx + dz * dz), 0, 1);
      return Math.hypot(x - lx - dx * t, z - lz - dz * t) < 0.6;
    };
    const inCamLane = (x, z) => lane(CAMD, x, z) || lane(CAMP, x, z);
    for (const z of ROWS) for (const sx of [-1, 1]) for (let k = 0; k < 8; k++) {
      const x = sx * sxAt(k);
      I.S.add(CUSH, 0xd9a441, { p: [x, Y0 + 0.027, z], j: 0.06 });
      seatTotal++;
      if (inCamLane(x, z)) continue;
      W.seats.push({ x, z: z + DZ, y: 1.95 + DY, yaw: PI });
    }
    // hàng trước: bốn bồ đoàn lớn; chỗ (−1, −78,9) là của người chơi, ba chỗ còn lại chỉ bày
    for (const x of [-3, -1, 1, 3]) I.S.add(BIGC, x === -1 ? 0xe2b04a : 0xd9a441, { p: [x, Y0 + 0.027, -78.9], j: 0.05 });
    I.S.add(lathe([[0, 0], [0.5, 0], [0.55, 0.03], [0.48, 0.075], [0, 0.08]], 10), 0xf0cf70, { p: [MO.x, Y0 + 0.025, MO.z], j: 0.04 }); // đệm tròn dưới chiếc mõ (cho khỏi lẫn với thảm đỏ)
  });

  // =====================================================================
  //  BÀN THỜ DÀI + LỄ VẬT + BA BỆ
  // =====================================================================
  safe('bàn thờ', () => {
    // v4: bàn dài ±15,9 (v3 ±14,45; không dài tới 1,3× vì tường trong ở ±18,1 và lối dọc hai bên x ±16,9 phải còn đi qua được), sâu 1,3, mặt bàn Y0 + 1,42 (+ viền vàng = TT)
    const z0 = -82.3, z1 = -81.0, AL = 15.9;
    boxMM(I.S, -(AL - 0.15), Y0, z0, AL - 0.15, Y0 + 1.32, z1, K.lac);                         // thân bàn sơn son
    boxMM(I.S, -AL, Y0 + 1.32, z0 - 0.1, AL, Y0 + 1.42, z1 + 0.1, 0x8a2418);                  // mặt bàn
    for (const [a, b, c, d] of [[-AL - 0.05, z0 - 0.12, AL + 0.05, z0 - 0.08], [-AL - 0.05, z1 + 0.08, AL + 0.05, z1 + 0.12]]) boxMM(I.G, a, Y0 + 1.42, b, c, Y0 + 1.45, d, K.gold);
    for (const sx of [-1, 1]) boxMM(I.G, sx * (AL + 0.05) - 0.02, Y0 + 1.42, z0 - 0.12, sx * (AL + 0.05) + 0.02, Y0 + 1.45, z1 + 0.12, K.gold);
    boxMM(I.G, -(AL - 0.1), Y0 + 0.02, z1, AL - 0.1, Y0 + 0.13, z1 + 0.04, K.goldD);
    boxMM(I.G, -(AL - 0.1), Y0 + 1.2, z1, AL - 0.1, Y0 + 1.32, z1 + 0.04, K.gold);
    // ô chạm vàng mặt trước: mười bốn ô, giữa có hoa tròn
    for (let i = 0; i < 14; i++) {
      const xc = (i - 6.5) * 2.2;
      boxMM(I.G, xc - 0.85, Y0 + 0.22, z1, xc + 0.85, Y0 + 0.27, z1 + 0.05, K.gold); boxMM(I.G, xc - 0.85, Y0 + 1.0, z1, xc + 0.85, Y0 + 1.05, z1 + 0.05, K.gold);
      boxMM(I.G, xc - 0.85, Y0 + 0.22, z1, xc - 0.8, Y0 + 1.05, z1 + 0.05, K.gold); boxMM(I.G, xc + 0.8, Y0 + 0.22, z1, xc + 0.85, Y0 + 1.05, z1 + 0.05, K.gold);
      I.G.add(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 10), i % 2 ? K.goldD : K.goldL, { p: [xc, Y0 + 0.635, z1 + 0.03], r: [PI / 2, 0, 0] });
    }
    colH.box(-AL - 0.05, z0 - 0.1, AL + 0.05, z1 + 0.1, 'altar');
    // lư hương đồng ba chân + nén hương: giữa (k 1,6) và hai bên (k 1,3), khói bay lên
    const bowl = (x, z, k) => {
      I.M.add(lathe([[0, 0], [0.2, 0], [0.34, 0.1], [0.42, 0.3], [0.46, 0.5], [0.52, 0.58], [0.46, 0.62], [0.4, 0.55]], 12), K.bronze, { p: [x, TT, z], s: k });
      for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 0.5; cyl(I.M, x + Math.sin(a) * 0.24 * k, TT + 0.05 * k, z + Math.cos(a) * 0.24 * k, 0.05 * k, 0.07 * k, 0.1 * k, K.bronze, 6); }
      for (const sx of [-1, 1]) I.M.add(new THREE.TorusGeometry(0.16 * k, 0.04 * k, 4, 8, PI), K.bronze, { p: [x + sx * 0.5 * k, TT + 0.58 * k, z] });
      cyl(I.S, x, TT + 0.55 * k, z, 0.4 * k, 0.4 * k, 0.04, 0x6b6158, 10);
      const rnd = U.rng(Math.round(x * 7) + 3);
      for (let i = 0; i < 16; i++) { const a = rnd() * TAU, r = Math.sqrt(rnd()) * 0.32 * k, h = (0.3 + rnd() * 0.3) * k; box(I.S, x + Math.cos(a) * r, TT + 0.57 * k + h / 2, z + Math.sin(a) * r, 0.016 * k, h, 0.016 * k, 0x8a3020, { r: [(rnd() - 0.5) * 0.2, 0, (rnd() - 0.5) * 0.2] }); }
      W.smokeSpots.push([x, TT + 1.35 * k + DY, z + DZ]);
    };
    const zt = (z0 + z1) / 2;
    bowl(0, zt, 1.6); bowl(-SIDE_X, zt, 1.3); bowl(SIDE_X, zt, 1.3);
    // nến: ba đôi (hai bên lư hương giữa và hai lư hương bên)
    const candle = (x, k = 1.3) => {
      cyl(I.S, x, TT + 0.26 * k, zt, 0.055 * k, 0.06 * k, 0.52 * k, 0xc8302a, 7, { j: 0.04 });
      cyl(I.G, x, TT + 0.03 * k, zt, 0.1 * k, 0.12 * k, 0.06 * k, K.gold, 7);
      I.L.add(CN4, 0xffd27a, { p: [x, TT + 0.6 * k, zt], s: [0.09 * k, 0.16 * k, 0.09 * k] });
      glow(x, TT + 0.62 * k, zt, 0.7 * k, [1.0, 0.72, 0.32], false);
    };
    for (const x of [-1.9, 1.9, -SIDE_X + 2.0, -SIDE_X - 2.0, SIDE_X - 2.0, SIDE_X + 2.0]) candle(x);
    // bình hoa sứ (men lam) cắm hoa
    const vase = (x, tall) => {
      I.S.add(lathe([[0, 0], [0.16, 0], [0.21, 0.15], [0.2, 0.4], [0.12, 0.62], [0.14, 0.72], [0.18, 0.78], [0.1, 0.76]], 10), 0xe8edf0, { p: [x, TT, zt], s: tall, j: 0.03 });
      I.S.add(lathe([[0.19, 0.2], [0.215, 0.24], [0.205, 0.38], [0.19, 0.4]], 10), 0x2f5a98, { p: [x, TT, zt], s: tall, j: 0.03 });
      const cols = [0xf2a0b8, 0xf5c43a, 0xfbe4ea, 0xe8602c, 0xf5c43a, 0xf2a0b8, 0xffffff];
      for (let i = 0; i < 9; i++) {
        const a = i * 2.4, r = (i % 3) * 0.1, yy = TT + (0.85 + (i % 4) * 0.1) * tall;
        sph(I.S, x + Math.cos(a) * r, yy, zt + Math.sin(a) * r, 0.1 * tall, cols[i % cols.length], 6, 4);
      }
      cyl(I.S, x, TT + 0.95 * tall, zt, 0.012, 0.012, 0.35 * tall, 0x4c7a35, 4);
    };
    for (const x of [-4.6, 4.6, -7.5, 7.5]) vase(x, 1.5);
    // mâm ngũ quả trên đế vàng (k 1,2)
    const tray = (x, k = 1.2) => {
      I.G.add(lathe([[0, 0], [0.22, 0], [0.2, 0.08], [0.07, 0.2], [0.07, 0.34], [0.3, 0.46], [0.34, 0.5], [0, 0.5]], 10), K.gold, { p: [x, TT, zt], s: k });
      const fr = [0xf39a2a, 0xd8322a, 0x7cbf4a, 0xf5d03a, 0xf39a2a, 0xd8322a];
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; sph(I.S, x + Math.cos(a) * 0.2 * k, TT + 0.58 * k, zt + Math.sin(a) * 0.2 * k, 0.1 * k, fr[i], 6, 4); }
      for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 0.5; sph(I.S, x + Math.cos(a) * 0.1 * k, TT + 0.7 * k, zt + Math.sin(a) * 0.1 * k, 0.095 * k, fr[i + 1], 6, 4); }
      sph(I.S, x, TT + 0.82 * k, zt, 0.1 * k, 0xf5d03a, 6, 4);
    };
    for (const x of [-3.2, 3.2, -6.0, 6.0, -8.9, 8.9]) tray(x);
    // ba bệ đá tám cạnh hai tầng sau bàn (v4: ×1,3, cao PH = 1,17; hai bệ bên ở x ±SIDE_X)
    for (const x of [-SIDE_X, 0, SIDE_X]) {
      const r = x === 0 ? 3.19 : 2.99;
      cyl(I.F, x, Y0 + 0.325, ZBUD, r, r + 0.06, 0.65, K.stone, 8, { r: [0, PI / 8, 0] });
      cyl(I.G, x, Y0 + 0.65, ZBUD, r + 0.025, r + 0.025, 0.07, K.gold, 8, { r: [0, PI / 8, 0] });
      cyl(I.F, x, Y0 + 0.91, ZBUD, r - 0.3, r - 0.25, 0.52, K.stoneL, 8, { r: [0, PI / 8, 0] });
      cyl(I.G, x, Y0 + PH, ZBUD, r - 0.27, r - 0.27, 0.05, K.goldD, 8, { r: [0, PI / 8, 0] });
      colH.circle(x, ZBUD, r + 0.05, 'pedestal');
    }
  });

  // =====================================================================
  //  BA PHO PHẬT TAM THẾ + HÀO QUANG HÌNH LÁ + BẢNG HIỆU
  // =====================================================================
  const statueMeshes = [];
  safe('tượng', () => {
    const base = W.statue;
    if (!base) return;
    const sets = [{ x: 0, s: 2.21 }, { x: -SIDE_X, s: 2.015 }, { x: SIDE_X, s: 2.015 }]; // v4: 1,3× v3 (1,7 / 1,55)
    sets.forEach((p, i) => {
      const m = i === 0 ? base : base.clone();
      m.material = buddhaMat; // đồng sẫm hơn hào quang vàng cho nổi bật
      m.position.set(p.x, Y0 + PH, ZBUD); m.scale.setScalar(p.s); m.rotation.set(0, 0, 0); m.updateMatrix();
      hallGrp.add(m); // pho giữa là mesh của 05-world (đang nằm trong scene, ngay cả khi 05 đặt nó ở chỗ khác sau G.frame.shift) → chuyển vào hallGrp; hai pho bên là bản sao. Không còn pho nào ở chỗ cũ (thế giới (0, 5,68, −100,3)).
      statueMeshes.push(m);
    });
    W.statueFocus.set(0, Y0 + PH + 1.62 * 2.21 + DY, ZBUD + 0.4 + DZ); // vị trí LOGIC (thế giới)
  });

  safe('hào quang', () => {
    const ZF2 = ZBUD - 1.25 * 1.3; // mặt trước hào quang (−87,625; v3: ZBUD − 1,25)
    const mandorla = (cx, Hm, Wm, sc) => {
      const y0 = Y0 + PH + 0.08, cyL = 0.42 * Hm;
      const prof = (t) => Wm * Math.pow(Math.max(0, Math.sin(PI * Math.pow(t, 0.72))), 0.9);
      const P = (s, t, side) => [side * s * prof(t), cyL + s * (Hm * t - cyL)];
      const outline = (s) => {
        const pts = [], N = 40;
        for (let i = 0; i <= N; i++) { const q = P(s, i / N, 1); pts.push(new THREE.Vector2(q[0], q[1])); }
        for (let i = N - 1; i >= 1; i--) { const q = P(s, i / N, -1); pts.push(new THREE.Vector2(q[0], q[1])); }
        return pts;
      };
      const layer = (s, front, depth, color) => {
        const g = new THREE.ExtrudeGeometry(new THREE.Shape(outline(s)), { depth, bevelEnabled: false });
        I.G.add(g, color, { p: [cx, y0, ZF2 + front - depth], j: 0.035 }); g.dispose();
      };
      layer(1.0, 0.0, 0.24, 0x8a1e14);       // viền đỏ mảnh
      layer(0.975, 0.03, 0.27, 0xf2c75e);    // đường chỉ vàng sáng
      layer(0.955, 0.05, 0.29, 0xb4842c);    // dải hoa văn vàng sẫm
      layer(0.8, 0.08, 0.32, 0xf2c75e);
      layer(0.785, 0.1, 0.34, 0xe3ae48);     // lòng hào quang
      // hạt tròn dọc dải hoa văn; ngọn lửa nhọn quanh mép ngoài
      for (let i = 1; i < 24; i++) for (const sd of [-1, 1]) {
        const q = P(0.875, 0.04 + (i / 24) * 0.9, sd);
        I.G.add(OCT, K.goldL, { p: [cx + q[0], y0 + q[1], ZF2 + 0.08], s: [0.1, 0.1, 0.05] });
      }
      for (let i = 0; i < 20; i++) for (const sd of [-1, 1]) {
        const t = 0.1 + (i / 19) * 0.86, a = P(1.0, t - 0.01, sd), b = P(1.0, t + 0.01, sd);
        let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        const nx = sd > 0 ? ty : -ty, ny = sd > 0 ? -tx : tx, L = 0.65 + 0.13 * (i % 2);
        I.G.add(CN4, i % 2 ? K.gold : K.goldL, { p: [cx + (a[0] + b[0]) / 2 + nx * L * 0.45, y0 + (a[1] + b[1]) / 2 + ny * L * 0.45, ZF2 - 0.1], s: [0.26, L, 0.09], r: [0, 0, -Math.atan2(nx, ny)] });
      }
      // vầng sáng sau đầu: đĩa kem + vòng vàng + tia
      const hy = Y0 + PH + 2.43 * sc, hr = 1.45 * sc / 1.7 + 0.1;
      I.G.add(new THREE.CircleGeometry(hr, 22), 0xf7e8b4, { p: [cx, hy, ZF2 + 0.125], j: 0.02 });
      I.G.add(new THREE.TorusGeometry(hr, 0.08, 4, 28), K.gold, { p: [cx, hy, ZF2 + 0.13] });
      I.G.add(new THREE.TorusGeometry(hr * 0.78, 0.04, 4, 24), K.goldD, { p: [cx, hy, ZF2 + 0.13] });
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * TAU, rr = hr + 0.7;
        I.G.add(CN4, K.goldL, { p: [cx + Math.sin(a) * rr, hy + Math.cos(a) * rr, ZF2 + 0.12], s: [0.12, 1.0, 0.05], r: [0, 0, -a] });
      }
      glow(cx, hy, ZF2 + 0.9, 4.2 * sc / 1.7 + 0.6, [1.0, 0.8, 0.42], false);
    };
    mandorla(0, 9.1, 3.77, 2.21);                 // 1,3× v3 (7,0 / 2,9 / 1,7)
    mandorla(-SIDE_X, 8.19, 3.38, 2.015);
    mandorla(SIDE_X, 8.19, 3.38, 2.015);
    // bảng hiệu nền đen chữ vàng: v4 treo dưới trần, TRƯỚC mặt hào quang 0,33 m (không còn áp tường sau). Ở tường sau, đỉnh hào quang giữa (9,1 m) che chữ giữa bảng
    // theo thị sai từ máy quay gõ mõ (máy thấp 4,9, bảng cao 13). Tâm bảng 12,0 → bảng 11,5…12,5: đỉnh hào quang (12,27) khuất sau bảng, tia vầng sáng sau đầu (≤ 11,15) hở dưới bảng.
    // Thân gỗ sẫm phía sau mặt chữ (PlaneGeometry một mặt: nhìn từ lối đi sau tượng không bị xuyên) + hai thanh treo từ trần xuống mép trên bảng.
    const ZBRD = ZF2 + 0.33, YBRD = 12.0; // mặt chữ −87,295 (thế giới −109,3)
    [['QUÁ KHỨ PHẬT', -SIDE_X], ['HIỆN TẠI PHẬT', 0], ['VỊ LAI PHẬT', SIDE_X]].forEach(([t, x]) => {
      meshIn.push(sign([t], 6.4, 1.0, x, YBRD, ZBRD, 0, { ppu: 200, bg1: '#1b1210', bg2: '#0d0908' }));
      I.G.add(BOX, 0x1b1210, { p: [x, YBRD, ZBRD - 0.05], s: [6.5, 1.1, 0.09] });
      for (const sx of [-1, 1]) I.G.add(BOX, K.goldD, { p: [x + sx * 2.7, (YCE + YBRD + 0.55) / 2, ZBRD - 0.05], s: [0.07, YCE - YBRD - 0.55, 0.07] });
    });
  });

  // =====================================================================
  //  ĐÔI HẠC ĐỒNG ĐỨNG TRÊN LƯNG RÙA
  // =====================================================================
  safe('hạc', () => {
    const crane = (x, z, yaw) => {
      const TM = U.batch(), TG = U.batch();
      // rùa: yếm, mai, hoa văn, đầu, bốn chân, đuôi
      TM.add(SPH, K.bronzeD, { p: [0, 0.22, 0], s: [0.95, 0.22, 1.25] });
      TM.add(SPH, K.bronze, { p: [0, 0.5, 0], s: [0.85, 0.42, 1.12] });
      for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU; TG.add(SPHS, K.goldD, { p: [Math.sin(a) * 0.4, 0.86, Math.cos(a) * 0.52], s: [0.2, 0.06, 0.2] }); }
      TG.add(SPHS, K.goldD, { p: [0, 0.92, 0], s: [0.24, 0.06, 0.26] });
      TM.add(SPH, K.bronze, { p: [0, 0.46, 1.32], s: [0.2, 0.17, 0.3] });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) TM.add(SPH, K.bronzeD, { p: [sx * 0.86, 0.16, sz * 0.62], s: [0.32, 0.11, 0.22], r: [0, sx * sz * 0.5, 0] });
      TM.add(CN4, K.bronzeD, { p: [0, 0.3, -1.4], s: [0.14, 0.35, 0.1], r: [-PI / 2 - 0.2, 0, 0] });
      // hạc: chân, thân, cánh, đuôi, cổ dài, đầu, mỏ ngậm nụ sen
      for (const sx of [-1, 1]) cyl(TG, sx * 0.17, 1.5, 0.05, 0.04, 0.045, 1.2, K.goldD, 6);
      TM.add(SPH, K.bronze, { p: [0, 2.3, 0], s: [0.3, 0.27, 0.66] });
      for (const sx of [-1, 1]) TM.add(SPH, K.bronzeD, { p: [sx * 0.3, 2.28, -0.12], s: [0.07, 0.27, 0.6], r: [0, 0, sx * 0.14] });
      for (const dx of [-0.1, 0, 0.1]) TM.add(CN4, K.bronzeD, { p: [dx, 2.18, -1.0], s: [0.09, 0.95, 0.05], r: [-1.35, 0, dx * 1.5] });
      const neck = [[0, 2.45, 0.5], [0, 2.8, 0.7], [0, 3.15, 0.52], [0, 3.42, 0.62], [0, 3.55, 0.86]];
      for (let i = 0; i < 4; i++) branch(TM, neck[i], neck[i + 1], 0.07 - i * 0.008, 0.063 - i * 0.008, K.bronze, 6);
      cyl(TG, 0, 2.5, 0.48, 0.1, 0.1, 0.07, K.gold, 8);
      TM.add(SPH, K.bronze, { p: [0, 3.58, 0.92], s: [0.085, 0.085, 0.13] });
      TG.add(SPHS, 0xb32a1e, { p: [0, 3.67, 0.9], s: 0.055 });
      branch(TG, [0, 3.56, 1.04], [0, 3.48, 1.6], 0.035, 0.01, K.gold, 5);
      TG.add(CN4, 0xf2a8c0, { p: [0, 3.5, 1.66], s: [0.14, 0.3, 0.14], r: [PI / 2 + 0.2, 0, 0] });
      grp(I.M, TM, x, Y0, z, yaw, 1.15); grp(I.G, TG, x, Y0, z, yaw, 1.15); // v4: 1,15× (v3 0,95)
      colH.circle(x, z, 0.8, 'crane');
    };
    crane(-7.6, -79.6, 0.55); crane(7.6, -79.6, -0.55); // đứng trước bàn thờ, hai bên thảm (z −79,6: đuôi rùa sát mặt bàn −80,9, đầu rùa cách hàng bồ đoàn cuối −77,5 ≥ 0,4 m)
  });

  // =====================================================================
  //  GỘP MESH, CHỖ NGỒI CỦA NGƯỜI CHƠI, MÕ, ĐÈN, DẪN ĐƯỜNG, CẮT CẢNH
  // =====================================================================
  safe('mesh', () => {
    const add = (list, name, B, mat, o) => { if (!B.list.length) return; const m = B.mesh(mat, o); m.name = 'chinhDien:' + name; hallGrp.add(m); list.push(m); }; // vào hallGrp (toạ độ khung v2)
    add(meshOut, 'ngoai-son', X.S, G.mats.vc, { cast: true, receive: true });
    add(meshOut, 'ngoai-nen', X.F, G.mats.vc, { cast: false, receive: true });
    add(meshOut, 'ngoai-dong', X.M, G.mats.metal, { cast: true, receive: true });
    add(meshOut, 'ngoai-vang', X.G, G.mats.gold, { cast: false, receive: true });
    add(meshOut, 'ngoai-den', X.L, G.mats.lantern, { cast: false, receive: false });
    add(meshIn, 'trong-son', I.S, G.mats.vc, { cast: false, receive: true });
    add(meshIn, 'trong-san', I.F, G.mats.vc, { cast: false, receive: true });
    add(meshIn, 'trong-dong', I.M, G.mats.metal, { cast: false, receive: true });
    add(meshIn, 'trong-vang', I.G, goldI, { cast: false, receive: true });
    add(meshIn, 'trong-den', I.L, G.mats.lantern, { cast: false, receive: false });
    for (const m of statueMeshes) meshIn.push(m);
    // mọi quầng sáng ghi từ đầu hàm (đèn chùm, nến, hào quang, đèn lồng hiên + đèn lồng trong điện qua hangLanternInto) đang ở toạ độ khung v2 → dời sang thế giới một lượt
    for (let i = glowMark; i < W.glows.length; i++) { W.glows[i].y += DY; W.glows[i].z += DZ; }
    hallGrp.updateMatrixWorld(true);
  });
  for (const g of own) g.dispose();

  safe('tay nắm', () => {
    // vùng mái (máy quay đứng gần, không chui lên mái) + đèn trong điện — toạ độ THẾ GIỚI (khung v2 −90,6…−64,0 → +DZ = −112,6…−86,0)
    G.roofZones[0] = [-17.5, 17.5, Math.round((ZB + 0.6 + DZ) * 1000) / 1000, Math.round((ZF + 0.3 + DZ) * 1000) / 1000];
    W.hallFloorY = Y0 + DY;
    const hl = W.lights && W.lights.hall;
    if (hl) { hl.position.set(0, 7.5 + DY, -77.75 + DZ); hl.distance = 50; hl.decay = 1.0; }
    // chỗ ngồi gõ mõ: bồ đoàn lớn bên trái lối giữa, mõ ở phía trước bên phải (thế giới: +DY, +DZ)
    const H = HALL;
    H.cushion = { x: -1.0, z: -78.9 + DZ, y: Y0 + DY, yaw: PI };
    H.poi = { x: 0, z: -77.9 + DZ, r: 2.6 }; H.stand = { x: 0, z: -78.3 + DZ, yaw: PI };
    H.mo.position.set(MO.x, Y0 + DY, MO.z + DZ); H.moTop.set(MO.x, Y0 + 0.66 + DY, MO.z + DZ); // mõ là nhóm động của 05-world nằm trong scene (hoạt động gõ mõ nảy / dời nó) → KHÔNG đưa vào hallGrp
    const moCol = col.list.find((c) => c.tag === 'mo'); if (moCol) { moCol.x = MO.x; moCol.z = MO.z + DZ; }
  });

  // dẫn đường: dọn nút / chỗ đứng cũ trong khuôn viên điện rồi thêm nút mới (lối giữa, giữa các cột, hai gian bên)
  safe('dẫn đường', () => {
    const inFp = (x, z) => x > NO_FP[0] && x < NO_FP[1] && z > NO_FP[2] && z < NO_FP[3];
    G.nav.nodes = G.nav.nodes.filter((n) => !inFp(n.x, n.z));
    for (const k of Object.keys(G.spots)) { const a = G.spots[k]; if (Array.isArray(a) && a !== W.seats) for (let i = a.length - 1; i >= 0; i--) if (inFp(a[i].x, a[i].z)) a.splice(i, 1); }
    const N = (x, z, id) => G.nav.add(x, z, id);
    // trục (thế giới): chân thang → chiếu 1 → chiếu 2 → sân thượng → cửa điện → trong điện (nút trong điện: toạ độ khung v2 + DZ = thế giới −87,9 … −100,3)
    N(0, -73.2, 'hallStairFoot'); N(0, -76.7, 'hallTier1'); N(0, -80.3, 'hallTier2'); N(0, -84.2, 'hallApron');
    N(0, -65.9 + DZ, 'hallDoor'); N(0, -68.9 + DZ); N(0, -71.9 + DZ); N(0, -74.9 + DZ); N(0, -78.3 + DZ, 'hallMo');
    for (const sx of [-1, 1]) {
      N(sx * 14, -77); N(sx * 10.5, -80.3); N(sx * 18.5, -82);        // cánh tầng 1 (y 2,4) và tầng 2 (y 3,6), đi lên từ chiếu nghỉ (nút (±10,5, −80,3) nối chiếu nghỉ 2 với (±18,5, −82): má thang chắn đường thẳng)
      N(sx * 4.6, -66.3 + DZ); N(sx * 4.6, -73.0 + DZ); N(sx * 11.6, -66.3 + DZ); N(sx * 11.6, -73.0 + DZ); N(sx * 11.6, -80.0 + DZ);
      for (const z of [-66, -72, -78, -84, -89]) N(sx * 16.9, z + DZ);   // gian bên (thế giới −88 … −111)
    }
    G.nav.built = false;
  });

  // cắt cảnh: nội thất chỉ vẽ khi máy quay cách tâm điện dưới 52 m — tâm (0, 7 + DY, −77,75 + DZ) = (0, 9,88, −99,75)
  let shown = true;
  const near = (p) => { const dx = p.x, dy = p.y - (7 + DY), dz = p.z - (-77.75 + DZ); return dx * dx + dy * dy + dz * dz < 52 * 52; };
  const setVis = (v) => { for (const m of meshIn) m.visible = v; };
  const CD = (W.chinhDien = { lightK: 0.6 });
  const gDay = new THREE.Color(0x6e4410), gNight = new THREE.Color(0x8a5818), bDay = new THREE.Color(0x2a1a0a), bNight = new THREE.Color(0x4a3012), hl0 = W.lights && W.lights.hall;
  G.onUpdate(() => {
    const s = near(G.camera.position); if (s !== shown) { shown = s; setVis(s); }
    if (s) { goldI.emissive.copy(gDay).lerp(gNight, G.tod.night); buddhaMat.emissive.copy(bDay).lerp(bNight, G.tod.night); }
    if (hl0) hl0.intensity *= CD.lightK; // 05-world đặt lại độ sáng mỗi khung (order 5); điện rộng hơn nhiều và đèn suy giảm chậm (decay 1) nên nhân hệ số riêng
  }, 90);
  G.events.on('snapshot:before', (sc) => { if (sc && near(sc.position)) setVis(true); });
  G.events.on('snapshot:after', () => setVis(shown));
  CD.meshIn = meshIn; CD.meshOut = meshOut.concat(baseMeshes); CD.base = baseMeshes; CD.baseTris = Math.round(baseTris); CD.seats = seatTotal;
  CD.offset = { DY, DZ, Y0 }; // thân điện dựng ở khung v2 (sàn Y0), dời (0, DY, DZ); nền đá ba tầng ở toạ độ thế giới

  // ĐỘ CAO MẶT ĐẤT trong khu nền (thế giới), bọc lên trên chuỗi heightAt hiện có (00-core → 08 …); cố ý cài Ở CUỐI hàm. Thang trên trục, ba tầng 4,8 / 3,6 / 2,4, hai cánh sân trước tầng 1 ở 1,2.
  // v4: hộp |x| ≤ 20,2, −117,7 ≤ z ≤ −74 (ngoài hộp: chuỗi cũ — 1,2 trên sân chính điện / tầng nền, 0 ở hành lang)
  safe('heightAt', () => {
    const base = G.heightAt;
    G.heightAt = (x, z) => {
      const ax = Math.abs(x);
      if (ax <= 20.2 && z <= -74 && z >= -117.7) {
        if (ax <= 7 && z > -83) {                                 // trục bậc thang (|x| ≤ 7)
          if (z > -75.8) return 1.2 + (1.2 * (-74 - z)) / 1.8;    // F1
          if (z > -77.6) return 2.4;                              // L1
          if (z > -79.4) return 2.4 + (1.2 * (-77.6 - z)) / 1.8;  // F2
          if (z > -81.2) return 3.6;                              // L2
          return 3.6 + (1.2 * (-81.2 - z)) / 1.8;                 // F3 (−81,2 … −83)
        }
        if (ax <= 19.0 && z <= -83) return 4.8;                   // tầng 3 (nền điện)
        if (ax <= 19.6 && z <= -79.4) return 3.6;                 // tầng 2
        if (ax <= 20.2 && z <= -75.8) return 2.4;                 // tầng 1
        return 1.2;                                               // hai cánh sân trước tầng 1 (z −74 … −75,8)
      }
      return base(x, z);
    };
  });
}
