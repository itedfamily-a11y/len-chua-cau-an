// =====================================================================
//  HỒ SEN VƯỜN SAU (hồ thả đèn hoa đăng) — HIỆU ỨNG MẶT NƯỚC + ĐÀN CÁ BƠI (2026-11-27)
//  Chạy sau 19-vuon-sau.js (đọc G.vuonSau, mesh 'vuonSau:nuoc'). Không đổi hình hồ, vật cản, hoạt động.
//
//  1. MẶT NƯỚC. Thay chất liệu của mặt hồ (trước là chất liệu nước dùng chung, phẳng một màu) bằng một bản riêng, màu vẫn đổi theo giờ như cũ:
//     - sóng lăn tăn: 5 lớp sóng nhỏ chạy theo các hướng khác nhau (máy cảm ứng / đồ hoạ thấp: 3 lớp), chỉ làm nghiêng pháp tuyến, lưới mặt nước giữ nguyên;
//     - phản chiếu bầu trời theo góc nhìn (nhìn xiên thì mặt nước sáng màu trời, nhìn thẳng xuống thì thấy màu nước), lấy màu trời đang hiện (05-world.js);
//     - lấp lánh nắng / trăng theo hướng đèn mặt trời (W.lights.sun);
//     - ven bờ và quanh đảo nước nông: màu trong hơn, ban ngày có vệt sáng đáy nước lay động;
//     - vòng sóng lan: G.hoNuoc.ring(x, z, mạnh) — 40-activities-b.js gọi khi đèn hoa đăng chạm nước, cá gọi khi ngoi lên đớp nước;
//     - quầng sáng ấm loang trên mặt nước dưới mỗi đèn hoa đăng đang trôi (đọc G.activitiesB.state().lanterns), rõ dần về đêm.
//  2. ĐÀN CÁ. 16 con (máy cảm ứng / đồ hoạ thấp: 9; từ chiều 2026-11-28 hồ kéo dài 32 × 52 m: 22 / 12 con, 4 / 3 nhóm), bơi thành 3 (2) nhóm quanh những "điểm hẹn" đổi chỗ sau mỗi 9–18 giây; tránh bờ, đảo, thủy tạ, tránh nhau;
//     người chơi đứng gần bờ thì một nhóm bơi lại gần; đèn hoa đăng chạm nước thì cá gần đó giật mình tản ra; thỉnh thoảng một con ngoi lên đớp nước (vòng sóng).
//     - Hình cá: mô hình "Shiny Fish" của GenEugene trên Sketchfab, giấy phép CC BY 4.0 (assets/mo-hinh/ca-vang.glb 3 000 mặt, ảnh 1024 px; ca-vang-nhe.glb 1 700 mặt, ảnh 512 px).
//       File trong game đã giảm số mặt (407 nghìn → 3 000), chỉ giữ ảnh màu, và NẮN THẲNG thân (bản gốc tạc sẵn thế uốn mình): dài 1 theo z, mũi ở +z, sống lưng x = 0.
//       Lệnh dựng: tests-local/quan-am-tools/LENH-CA-VANG.md. Tải khi người chơi vào trong 75 m quanh hồ; máy bật "tiết kiệm dữ liệu" thì không tải.
//       Trước khi tải xong / tải lỗi: cá dựng bằng mã (cá chép cam – trắng, khoảng 50 mặt). Lỗi tải thử lại một lần sau 45 giây bằng bản nhẹ.
//     - Bơi: shader uốn thân theo sóng chạy từ đầu tới đuôi (đuôi vẫy mạnh hơn đầu), nhịp vẫy theo tốc độ, thân cong theo hướng rẽ.
//     - "Ở dưới nước" mà không khoét đất: mặt đất dưới hồ nằm ở y −0,03, sát dưới mặt nước (y 0,04), nên cá không thể đặt thật dưới nước.
//       Cá dài 0,46–0,78 m (cả đuôi), vẫn có độ sâu riêng (tâm thân 0,2–0,55 m dưới mặt nước); khi vẽ, mỗi đỉnh được kéo dọc theo tia nhìn lên một lớp mỏng ngay trên mặt nước (y 0,044…0,066: trên mặt nước, dưới lá sen 0,07
//       và đèn 0,08). Vị trí trên màn hình vì thế đúng như cá ở sâu thật (có thị sai khi máy quay di chuyển), còn thứ tự che khuất do bộ đệm chiều sâu lo:
//       lá sen, đèn, bờ đá, người, thủy tạ đều che được cá. Phần cá mà tia nhìn không đi qua mặt nước của hồ (ngoài mép nước, trong đảo) bị bỏ.
//       Cá vẽ hai lượt: lượt 1 chỉ ghi chiều sâu, lượt 2 vẽ màu trong suốt (không lộ vây phía sau qua thân); độ trong giảm theo quãng đường tia nhìn đi trong nước
//       và theo góc nhìn (nhìn xiên: mặt nước phản chiếu trời, cá mờ dần), màu ngả xanh nước theo độ sâu, hình cá lung linh theo gợn sóng phía trên.
//  3. Trạng thái: G.hoNuoc = { ring, uniforms, water, fish: { state, url, error, tris, credit, list, groups, meshes() } }.
//     Ghi công tác giả mô hình cá ở cuối bảng Cài đặt khi mô hình đang hiện (như cây mô hình, 13-cay-mo-hinh.js).
//  Mô hình "Realistic Water and Plants" (Negitropic) chủ chùa gửi kèm KHÔNG dùng: giấy phép Sketchfab Standard không cho đưa file lên kho công khai; hiệu ứng nước ở đây viết bằng mã.
// =====================================================================
function installNuocCa(G) {
  const { THREE, util: U, scene } = G;
  const W = G.world, V = G.vuonSau;
  if (!W || !V || !V.pond || !V.island || !V.groups || !V.groups.far || !G.onUpdate) return;
  const water = V.groups.far.getObjectByName('vuonSau:nuoc');
  if (!water) return;

  const POND = V.pond, ISL = V.island, LP = V.lanternPond;
  const CX = (POND.x0 + POND.x1) / 2, CZ = (POND.z0 + POND.z1) / 2, HX = (POND.x1 - POND.x0) / 2, HZ = (POND.z1 - POND.z0) / 2, WY = POND.water;
  const low = !!G.isTouch || !!(G.quality && G.quality.low);
  const NR = low ? 4 : 6;                                   // số vòng sóng lan cùng lúc
  const TAU = Math.PI * 2, TWRAP = 20 * Math.PI;            // mọi hệ số thời gian trong shader là bội của 0,1 → quấn thời gian ở 20π giây không giật

  const UNI = {
    uHoT: { value: 0 }, uHoAmp: { value: 1 },
    uHoC: { value: new THREE.Vector2(CX, CZ) }, uHoHalf: { value: new THREE.Vector2(HX, HZ) }, uHoR: { value: POND.r },
    uHoIsle: { value: new THREE.Vector3(ISL.x - CX, ISL.z - CZ, ISL.r) }, uHoY: { value: WY },
    uHoRing: { value: Array.from({ length: NR }, () => new THREE.Vector4(0, 0, -1, 0)) }, // x, z (so với tâm hồ), tuổi (giây; âm = tắt), độ mạnh
    uHoSun: { value: new THREE.Vector3(0, 1, 0) }, uHoSunCol: { value: new THREE.Color(0) },
    uHoTop: { value: new THREE.Color(0x4b6fb2) }, uHoHor: { value: new THREE.Color(0xffbc7c) },
    uHoDay: { value: 1 }, uHoRefl: { value: 0.8 },
    uHoLit: { value: 1 },                                     // cá tối bớt về đêm
    uHoMurk: { value: 0.8 }, uHoTint: { value: new THREE.Color(0.55, 0.9, 0.86) },
  };
  const opq = (src) => (src.includes('#include <opaque_fragment>') ? '#include <opaque_fragment>' : '#include <output_fragment>'); // three r154 đổi tên đoạn này

  // ---------- GLSL dùng chung ----------
  // độ dốc mặt nước (dh/dx, dh/dz) tại p (mét, so với tâm hồ)
  const GL_WAVE = `
uniform float uHoT; uniform float uHoAmp;
vec2 hoWave(vec2 p) {
  p += 0.4 * vec2(sin(p.y * 0.61 + uHoT * 0.3), cos(p.x * 0.53 - uHoT * 0.2));
  vec2 g = vec2(0.0);
  g += vec2( 0.80,  0.60) * (cos(dot(p, vec2( 0.80,  0.60)) *  2.3 + uHoT * 1.3) * 0.026);
  g += vec2(-0.55,  0.83) * (cos(dot(p, vec2(-0.55,  0.83)) *  3.9 + uHoT * 1.9) * 0.024);
  g += vec2( 0.26, -0.97) * (cos(dot(p, vec2( 0.26, -0.97)) *  6.3 + uHoT * 2.6) * 0.022);
#ifndef HO_NHE
  g += vec2(-0.93, -0.36) * (cos(dot(p, vec2(-0.93, -0.36)) * 10.1 + uHoT * 3.4) * 0.020);
  g += vec2( 0.64, -0.77) * (cos(dot(p, vec2( 0.64, -0.77)) * 15.7 + uHoT * 4.7) * 0.016);
#endif
  return g * uHoAmp;
}
`;
  // khoảng cách có dấu tới mép nước (hình chữ nhật bo góc; âm = trong hồ), p so với tâm hồ
  const GL_SD = `
uniform vec2 uHoC; uniform vec2 uHoHalf; uniform float uHoR; uniform vec3 uHoIsle; uniform float uHoY;
float hoSd(vec2 p) { vec2 q = abs(p) - (uHoHalf - uHoR); return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uHoR; }
`;

  // =====================================================================
  //  1. MẶT NƯỚC
  // =====================================================================
  const base = W.water && W.water.material;
  const wMat = new THREE.MeshLambertMaterial({ color: base ? base.color.getHex() : 0x1f5566, emissive: base && base.emissive ? base.emissive.getHex() : 0x0b2c38 });
  wMat.defines = { HO_VONG: NR }; if (low) wMat.defines.HO_NHE = 1;
  wMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, UNI);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vHoP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvHoP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    const o = opq(sh.fragmentShader);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vHoP;' + GL_WAVE + GL_SD + `
uniform vec4 uHoRing[HO_VONG]; uniform vec3 uHoSun; uniform vec3 uHoSunCol; uniform vec3 uHoTop; uniform vec3 uHoHor; uniform float uHoDay; uniform float uHoRefl;
vec2 hoRings(vec2 p) {                       // vòng sóng lan 0,75 m/s, tắt dần trong 3,2 giây
  vec2 g = vec2(0.0);
  for (int i = 0; i < HO_VONG; i++) {
    vec4 r = uHoRing[i];
    if (r.z < 0.0) continue;
    vec2 d = p - r.xy; float l = length(d) + 0.0001, x = l - (0.25 + r.z * 0.75);
    g += (d / l) * (cos(x * 14.0) * exp(-x * x * 9.0) * r.w * max(1.0 - r.z / 3.2, 0.0) * 0.17);
  }
  return g;
}
`)
      .replace('#include <color_fragment>', `#include <color_fragment>
vec2 hoP = vHoP.xz - uHoC;
vec2 hoG = hoWave(hoP) + hoRings(hoP);
float hoSh = 1.0 - smoothstep(0.0, 2.6, min(-hoSd(hoP), distance(hoP, uHoIsle.xy) - uHoIsle.z)); // 1 ở mép nước / chân đảo → 0 từ 2,6 m trở vào
diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.15, 1.6, 1.3), hoSh * 0.6);
vec2 hoQ = hoP * 2.2 + hoG * 9.0;
float hoCa = sin(hoQ.x + sin(hoQ.y * 1.3 + uHoT * 0.7)) * sin(hoQ.y + sin(hoQ.x * 1.1 - uHoT * 0.6));
diffuseColor.rgb += vec3(0.05, 0.085, 0.07) * (hoCa * hoCa * step(0.0, hoCa)) * (0.3 + 0.7 * hoSh) * uHoDay; // vệt sáng đáy nước, rõ nhất ở chỗ nông
diffuseColor.rgb *= 1.0 + (hoG.x + hoG.y) * 1.6;                                                    // sườn sóng sáng – tối nhẹ: nhìn thẳng xuống (ít phản chiếu trời) vẫn thấy gợn
`)
      .replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
vec3 hoN = normalize(vec3(-hoG.x, 1.0, -hoG.y));
normal = normalize((viewMatrix * vec4(hoN, 0.0)).xyz);
`)
      .replace(o, `
vec3 hoV = normalize(cameraPosition - vHoP);
float hoF = 0.02 + 0.98 * pow(1.0 - max(dot(hoN, hoV), 0.0), 5.0);
vec3 hoRf = reflect(-hoV, hoN);
float hoS = max(dot(hoRf, uHoSun), 0.0);
outgoingLight = mix(outgoingLight, mix(uHoHor, uHoTop, smoothstep(0.0, 0.55, hoRf.y)), hoF * uHoRefl) + uHoSunCol * (pow(hoS, 260.0) * 2.0 + pow(hoS, 28.0) * 0.06);
` + o);
  };
  wMat.customProgramCacheKey = () => 'ho-nuoc' + (low ? '-nhe' : '');
  water.material = wMat;

  // màu trời đang hiện: chất liệu bầu trời của 05-world.js (uniform top / hor / sunDir)
  let skyU = null;
  scene.traverse((o) => { const u = o.material && o.material.uniforms; if (!skyU && u && u.top && u.hor && u.sunDir) skyU = u; });

  // vòng sóng lan
  const rings = UNI.uHoRing.value; let ringI = 0;
  const fish = [], groups = [];
  const rnd = U.rng ? U.rng(2711) : Math.random;
  function ring(x, z, amp, quiet) {
    if (!isFinite(x) || !isFinite(z)) return;
    rings[ringI].set(x - CX, z - CZ, 0, amp == null ? 1 : amp); ringI = (ringI + 1) % NR;
    if (quiet) return;
    for (const f of fish) { // vật chạm nước: cá gần đó giật mình bơi ra xa
      if (Math.hypot(f.x - x, f.z - z) > 2.6) continue;
      f.flee = 0.8 + rnd() * 0.7; f.fa = Math.atan2(f.x - x, f.z - z) + (rnd() - 0.5) * 0.8; f.st = -1; f.rung = false;
    }
  }

  // quầng sáng đèn hoa đăng loang trên mặt nước (cộng màu)
  const NP = 30, poolGeo = new THREE.PlaneGeometry(2, 2); poolGeo.rotateX(-Math.PI / 2);
  const poolMat = new THREE.ShaderMaterial({
    uniforms: { uK: { value: 0.1 }, uHoT: UNI.uHoT },
    vertexShader: `varying vec2 vU; varying vec2 vW;
      void main(){ vU = uv * 2.0 - 1.0; vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0); vW = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uK, uHoT; varying vec2 vU; varying vec2 vW;
      void main(){ float a = pow(max(1.0 - length(vU), 0.0), 2.2);
        a *= 0.78 + 0.22 * sin(vW.x * 7.0 + uHoT * 2.6) * sin(vW.y * 6.0 - uHoT * 1.9);
        gl_FragColor = vec4(vec3(1.0, 0.6, 0.24) * a * uK, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pool = new THREE.InstancedMesh(poolGeo, poolMat, NP);
  pool.count = 0; pool.frustumCulled = false; pool.castShadow = pool.receiveShadow = false; pool.renderOrder = 1; pool.name = 'hoNuoc:quang-den'; scene.add(pool);
  let lanList = null;
  const dummy = new THREE.Object3D();
  function updatePools() {
    if (!lanList) { try { const s = G.activitiesB && G.activitiesB.state && G.activitiesB.state(); if (s && Array.isArray(s.lanterns)) lanList = s.lanterns; } catch (e) { /* hoạt động chưa cài: chưa có đèn */ } }
    if (!lanList) return;
    const n = Math.min(NP, lanList.length);
    for (let i = 0; i < n; i++) {
      const L = lanList[i], on = L && L.mode === 'drift';
      dummy.position.set(on ? L.x : 0, WY + 0.028, on ? L.z : 0); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(on ? 1.4 : 0); dummy.updateMatrix(); pool.setMatrixAt(i, dummy.matrix);
    }
    pool.count = n; pool.instanceMatrix.needsUpdate = true;
  }

  // =====================================================================
  //  2. ĐÀN CÁ
  // =====================================================================
  const BIG = HX * HZ * 4 > 1200;                            // 2026-11-28: hồ kéo dài (32 × 52 m) thì thêm cá và thêm một nhóm
  const N = BIG ? (low ? 12 : 22) : (low ? 9 : 16), NG = BIG ? (low ? 3 : 4) : (low ? 2 : 3), MARGIN = 0.9;
  const free = (x, z, m) => (LP && LP.inside ? LP.inside(x, z, m) : V.inPond(x, z, -m) && Math.hypot(x - ISL.x, z - ISL.z) > ISL.r + 0.3 + m); // mặt nước trống, cách bờ / đảo / thủy tạ ít nhất m
  const randPoint = (m) => {
    for (let k = 0; k < 80; k++) { const x = POND.x0 + m + rnd() * (POND.x1 - POND.x0 - 2 * m), z = POND.z0 + m + rnd() * (POND.z1 - POND.z0 - 2 * m); if (free(x, z, m)) return [x, z]; }
    return [CX - HX * 0.55, CZ + HZ * 0.5];
  };

  const FV_HEAD = GL_WAVE + `
attribute vec4 aCa;                       // pha vẫy đuôi, độ cong khi rẽ, biên độ vẫy, (để dành)
uniform float uHoY; uniform vec2 uHoC;
varying vec3 vHoW;
`;
  const FV_BEND = `
{
  float hoU = clamp(0.5 - position.z, 0.0, 1.0);                                        // 0 ở mũi → 1 ở chót đuôi
  float hoFin = smoothstep(0.07, 0.3, abs(position.y) + abs(position.x) * 0.7);          // vây: phần xa trục thân, vẫy trễ hơn thân
  transformed.x += sin(aCa.x - hoU * 5.5 - hoFin * 1.4) * aCa.z * (0.012 + 0.15 * hoU * hoU + 0.03 * hoFin) + aCa.y * hoU * hoU * 0.5;
}
`;
  const FV_PROJ = `
vec4 hoW4 = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
  hoW4 = instanceMatrix * hoW4;
#endif
hoW4 = modelMatrix * hoW4;
float hoDep = max(uHoY - hoW4.y, 0.0);
hoW4.xz += hoWave(hoW4.xz - uHoC) * hoDep * 1.2;                                      // khúc xạ: hình cá lung linh theo gợn sóng phía trên
vHoW = hoW4.xyz;
vec3 hoRay = hoW4.xyz - cameraPosition;
float hoYq = uHoY + mix(0.004, 0.026, clamp(1.0 - hoDep, 0.0, 1.0));                   // lớp mỏng ngay trên mặt nước (xem đầu file)
float hoTq = clamp((hoYq - cameraPosition.y) / min(hoRay.y, -0.001), 0.0, 1.0);
vec4 mvPosition = viewMatrix * vec4(cameraPosition + hoRay * hoTq, 1.0);
gl_Position = projectionMatrix * mvPosition;
`;
  const FF_HEAD = GL_SD + `
uniform float uHoMurk; uniform float uHoLit; uniform vec3 uHoTint;
varying vec3 vHoW;
`;
  const FF_CLIP = `
vec3 hoRay = vHoW - cameraPosition;
vec2 hoHit = cameraPosition.xz + hoRay.xz * ((uHoY - cameraPosition.y) / min(hoRay.y, -0.001)) - uHoC;   // chỗ tia nhìn xuyên qua mặt nước
if (hoSd(hoHit) > -0.05 || distance(hoHit, uHoIsle.xy) < uHoIsle.z + 0.05) discard;
`;
  const FF_OUT = `
float hoCos = clamp(-normalize(hoRay).y, 0.06, 1.0);
float hoPath = max(uHoY - vHoW.y, 0.0) / hoCos;                                         // quãng đường tia nhìn đi trong nước
outgoingLight = mix(outgoingLight, outgoingLight * uHoTint, clamp(hoPath * 1.2, 0.0, 0.85)) * uHoLit;
diffuseColor.a *= exp(-hoPath * uHoMurk) * (1.0 - 0.9 * (0.02 + 0.98 * pow(1.0 - hoCos, 5.0)));
`;
  const hookFish = (mat, colour) => {
    if (low) mat.defines = Object.assign(mat.defines || {}, { HO_NHE: 1 });
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, UNI);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\n' + FV_HEAD)
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + FV_BEND)
        .replace('#include <project_vertex>', FV_PROJ);
      let fs = sh.fragmentShader
        .replace('#include <common>', '#include <common>\n' + FF_HEAD)
        .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n' + FF_CLIP);
      if (colour) { const o = opq(fs); fs = fs.replace(o, FF_OUT + o); }
      sh.fragmentShader = fs;
    };
    mat.customProgramCacheKey = () => 'ho-ca-' + (colour ? 'mau' : 'sau') + (low ? '-nhe' : '');
    return mat;
  };
  const fishMat = (o) => hookFish(new THREE.MeshLambertMaterial(Object.assign({ side: THREE.DoubleSide, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }, o)), true);

  // thuộc tính theo từng con (dùng chung cho hai lượt vẽ và cho cả hình dựng bằng mã lẫn mô hình tải về)
  const iMat = new THREE.InstancedBufferAttribute(new Float32Array(N * 16), 16); iMat.setUsage(THREE.DynamicDrawUsage);
  const iCa = new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4); iCa.setUsage(THREE.DynamicDrawUsage);
  const iCol = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
  const BS = new THREE.Sphere(new THREE.Vector3(CX, WY, CZ), Math.hypot(HX, HZ) + 1);
  let meshA = null, meshB = null; // A: lượt chỉ ghi chiều sâu (sau mọi vật đặc), B: lượt màu (đầu lượt trong suốt)
  function setModel(geo, colMat) {
    const old = [meshA, meshB];
    geo.setAttribute('aCa', iCa);
    const mk = (mat, order, name) => {
      const m = new THREE.InstancedMesh(geo, mat, N);
      m.instanceMatrix = iMat; m.boundingSphere = BS; m.castShadow = m.receiveShadow = false; m.matrixAutoUpdate = false; m.renderOrder = order; m.name = name; m.visible = !old[0] || old[0].visible;
      scene.add(m); return m;
    };
    meshA = mk(hookFish(new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide }), false), 5, 'hoNuoc:ca-sau');
    meshB = mk(colMat, -5, 'hoNuoc:ca'); meshB.instanceColor = iCol;
    for (const o of old) if (o) { scene.remove(o); o.material.dispose(); }
    if (old[0]) old[0].geometry.dispose();
  }

  // cá dựng bằng mã: thân 7 vòng × 6 điểm, đuôi, vây lưng, hai vây ngực; cùng khung với mô hình (dài 1 theo z, mũi ở +0,5)
  function codeFish() {
    const P = [], C = [], I = [];
    const ST = [[0.5, 0.004, 0.004], [0.43, 0.05, 0.062], [0.29, 0.082, 0.11], [0.1, 0.085, 0.118], [-0.08, 0.06, 0.088], [-0.2, 0.03, 0.05], [-0.27, 0.012, 0.034]]; // z, nửa rộng, nửa cao
    const COL = [[1, 0.45, 0.1], [1, 0.5, 0.12], [1, 0.86, 0.72], [1, 0.48, 0.1], [1, 0.88, 0.76], [1, 0.5, 0.12], [1, 0.55, 0.15]];
    ST.forEach(([z, hw, hh], s) => { for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU, sh = Math.sin(a) > 0.3 ? 1 : 0.84; P.push(Math.cos(a) * hw, Math.sin(a) * hh, z); C.push(COL[s][0] * sh, COL[s][1] * sh, COL[s][2] * sh); } });
    for (let s = 0; s < ST.length - 1; s++) for (let k = 0; k < 6; k++) { const a = s * 6 + k, b = s * 6 + ((k + 1) % 6), c = a + 6, d = b + 6; I.push(a, c, b, b, c, d); }
    const fin = (pts, tris) => { const o = P.length / 3; for (const p of pts) { P.push(p[0], p[1], p[2]); C.push(1, 0.7, 0.45); } for (const t of tris) I.push(o + t[0], o + t[1], o + t[2]); };
    fin([[0, 0.03, -0.26], [0, -0.03, -0.26], [0, 0.17, -0.5], [0, 0, -0.41], [0, -0.17, -0.5]], [[0, 2, 3], [0, 3, 1], [1, 3, 4]]);          // đuôi
    fin([[0, 0.105, 0.2], [0, 0.2, 0.0], [0, 0.07, -0.14]], [[0, 1, 2]]);                                                                      // vây lưng
    for (const s of [-1, 1]) fin([[s * 0.075, -0.03, 0.27], [s * 0.2, -0.075, 0.13], [s * 0.085, -0.045, 0.14]], [[0, 1, 2]]);                  // vây ngực
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeVertexNormals();
    return g;
  }

  // ---------- đàn cá: khởi tạo ----------
  for (let g = 0; g < NG; g++) { const p = randPoint(2.2); groups.push({ x: p[0], z: p[1], next: 5 + rnd() * 8, visit: 0 }); }
  const TINT = [[1, 1, 1], [1, 1, 1], [1, 1, 1], [1.12, 1.05, 0.9], [1.08, 0.82, 0.78], [1.2, 1.18, 1.1]];
  for (let i = 0; i < N; i++) {
    const g = i % NG, gp = groups[g]; let x = gp.x, z = gp.z;
    for (let k = 0; k < 40; k++) { const a = rnd() * TAU, r = 0.4 + rnd() * 1.6, px = gp.x + Math.cos(a) * r, pz = gp.z + Math.sin(a) * r; if (free(px, pz, MARGIN)) { x = px; z = pz; break; } }
    const len = 0.46 + rnd() * 0.32;                                          // dài cả đuôi (m); đèn hoa đăng rộng 0,67 m
    fish.push({
      x, z, y: WY - 0.3, yaw: rnd() * TAU, pitch: 0, v: 0.2, vc: 0.2 + rnd() * 0.16, len, g,
      oa: rnd() * TAU, os: (rnd() - 0.5) * 0.24, or: 0.5 + rnd() * 1.3,       // chỗ riêng quanh điểm hẹn của nhóm (góc, tốc độ xoay, bán kính)
      wf: 0.25 + rnd() * 0.3, wp: rnd() * 40, ph: rnd() * TAU, turn: 0,       // lượn, pha vẫy đuôi, tốc độ rẽ (đã làm mượt)
      d0: 0.02 + 0.4 * len + rnd() * 0.2, df: 0.3 + rnd() * 0.4,              // độ sâu của tâm thân (cá lớn bơi sâu hơn cho vây lưng chìm dưới nước), nhịp lên xuống
      su: 10 + rnd() * 50, st: -1, rung: false,                               // đếm lùi tới lần ngoi lên, đang ngoi (giây), đã tạo vòng sóng
      flee: 0, fa: 0, side: rnd() < 0.5 ? -1 : 1,
    });
    const c = TINT[(rnd() * TINT.length) | 0]; iCol.setXYZ(i, c[0], c[1], c[2]);
  }
  function nextPoint(gp, t) {
    gp.visit = 0;
    const P = G.player && G.player.pos;
    if (P && rnd() < 0.7) { // người chơi đứng gần bờ: nhóm bơi lại chỗ nước gần người nhất
      const dx = CX - P.x, dz = CZ - P.z, d = Math.hypot(dx, dz) || 1;
      for (let s = 0.4; s <= 7; s += 0.3) {
        const x = P.x + (dx / d) * s, z = P.z + (dz / d) * s; if (!free(x, z, 1.2)) continue;
        if (!groups.some((o) => o !== gp && o.visit && Math.hypot(o.x - x, o.z - z) < 3)) { gp.x = x + (dx / d) * 0.5; gp.z = z + (dz / d) * 0.5; gp.visit = 1; }
        break;
      }
    }
    if (!gp.visit) for (let k = 0; k < 12; k++) { const p = randPoint(2.0); if (k === 11 || groups.every((o) => o === gp || Math.hypot(o.x - p[0], o.z - p[1]) > 5)) { gp.x = p[0]; gp.z = p[1]; break; } }
    gp.next = t + (gp.visit ? 12 + rnd() * 8 : 9 + rnd() * 9);
  }
  const wrap = (a) => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
  function swim(dt, t) {
    for (const gp of groups) if (t >= gp.next) nextPoint(gp, t);
    for (let i = 0; i < N; i++) {
      const f = fish[i], gp = groups[f.g];
      // hướng muốn bơi: tới chỗ riêng quanh điểm hẹn của nhóm, lượn nhẹ; tới nơi thì lững lờ
      const oa = f.oa + t * f.os, dx = gp.x + Math.cos(oa) * f.or - f.x, dz = gp.z + Math.sin(oa) * f.or - f.z, dist = Math.hypot(dx, dz);
      let want = dist < 0.7 ? f.yaw + Math.sin(t * f.wf * 1.7 + f.wp) * 0.9 : Math.atan2(dx, dz) + Math.sin(t * f.wf + f.wp) * 0.5;
      let wx = Math.sin(want), wz = Math.cos(want);
      for (let j = 0; j < N; j++) { // tránh nhau
        if (j === i) continue;
        const o = fish[j], ex = f.x - o.x, ez = f.z - o.z, d = Math.hypot(ex, ez), R = 0.5 * (f.len + o.len) + 0.15;
        if (d < R && d > 1e-4) { const k = ((1 - d / R) * 1.6) / d; wx += ex * k; wz += ez * k; }
      }
      want = Math.atan2(wx, wz);
      let hard = false;
      if (f.flee > 0) { f.flee -= dt; want = f.fa; hard = true; }
      // tránh bờ, đảo, thủy tạ: dò phía trước, rẽ về bên còn nước
      const look = 0.6 + f.v * 2.0;
      if (!free(f.x + Math.sin(f.yaw) * look, f.z + Math.cos(f.yaw) * look, MARGIN)) {
        const l = free(f.x + Math.sin(f.yaw + 0.95) * look, f.z + Math.cos(f.yaw + 0.95) * look, MARGIN), r = free(f.x + Math.sin(f.yaw - 0.95) * look, f.z + Math.cos(f.yaw - 0.95) * look, MARGIN);
        want = l && !r ? f.yaw + 1.4 : r && !l ? f.yaw - 1.4 : l && r ? f.yaw + f.side * 1.4 : Math.atan2(gp.x - f.x, gp.z - f.z);
        hard = true;
      }
      const maxT = (hard ? 2.6 : 1.1) * (0.5 + f.v * 2.2) * dt, turn = U.clamp(wrap(want - f.yaw), -maxT, maxT);
      f.yaw = wrap(f.yaw + turn);
      f.turn += (turn / Math.max(dt, 1e-3) - f.turn) * Math.min(1, dt * 5);
      const vt = f.flee > 0 ? f.vc * 3.4 : dist < 0.7 ? f.vc * 0.3 : f.vc * (0.8 + 0.3 * Math.sin(t * 0.23 + f.wp)) * (hard ? 0.75 : 1);
      f.v += (vt - f.v) * Math.min(1, dt * (f.flee > 0 ? 6 : 1.3));
      const nx = f.x + Math.sin(f.yaw) * f.v * dt, nz = f.z + Math.cos(f.yaw) * f.v * dt;
      if (free(nx, nz, 0.5)) { f.x = nx; f.z = nz; } else { f.yaw = wrap(f.yaw + f.side * 2.5 * dt); f.v *= 0.9; } // không bao giờ ra khỏi vùng nước trống
      // độ sâu; thỉnh thoảng ngoi lên đớp nước
      f.su -= dt;
      if (f.su <= 0 && f.st < 0 && f.flee <= 0) { f.st = 0; f.su = 25 + rnd() * 55; }
      let dep = f.d0 + Math.sin(t * f.df + f.wp) * 0.05;
      if (f.st >= 0) {
        f.st += dt; const k = Math.sin(Math.min(1, f.st / 2.6) * Math.PI); dep = U.lerp(dep, 0.075, k * k);
        if (!f.rung && f.st > 1.3) { f.rung = true; ring(f.x + Math.sin(f.yaw) * f.len * 0.4, f.z + Math.cos(f.yaw) * f.len * 0.4, 0.5, true); }
        if (f.st > 2.6) { f.st = -1; f.rung = false; }
      }
      const y = WY - dep;
      f.pitch += (U.clamp(((y - f.y) / Math.max(dt, 1e-3)) * 1.5, -0.35, 0.35) - f.pitch) * Math.min(1, dt * 3); f.y = y;
      // nhịp vẫy đuôi theo tốc độ (thân dài mỗi giây); thân cong theo hướng rẽ
      const bl = f.v / f.len;
      f.ph = (f.ph + dt * (1.6 + bl * 10.5)) % TAU;
      iCa.setXYZW(i, f.ph, U.clamp((f.turn * f.len) / Math.max(f.v, 0.18), -1.1, 1.1) * 0.55, 0.5 + Math.min(1, bl * 0.9) * 0.6 + Math.min(0.4, Math.abs(f.turn) * 0.25), 0);
      dummy.position.set(f.x, f.y, f.z); dummy.rotation.set(-f.pitch, f.yaw, -f.turn * 0.12, 'YXZ'); dummy.scale.setScalar(f.len); dummy.updateMatrix(); dummy.matrix.toArray(iMat.array, i * 16);
    }
    iMat.needsUpdate = true; iCa.needsUpdate = true;
  }
  setModel(codeFish(), fishMat({ vertexColors: true }));
  swim(0.016, 0);

  // ---------- mô hình cá tải về ----------
  const CFG = { url: 'assets/mo-hinh/ca-vang-nhe.glb', urlHi: 'assets/mo-hinh/ca-vang.glb', near: 75, retryAfter: 45 };
  const CREDIT = {
    text: 'Cá trong hồ sen là mô hình 3D "Shiny Fish" của GenEugene trên Sketchfab, giấy phép CC BY 4.0, đã chỉnh sửa cho vừa trò chơi (giảm số mặt, thu nhỏ ảnh bề mặt, nắn thẳng thân để cá tự bơi).',
    href: 'https://sketchfab.com/3d-models/shiny-fish-e0bddbcafc5e48c097b40b4bada3811a',
    licence: 'https://creativecommons.org/licenses/by/4.0/', // CC BY 4.0: nêu tên tác giả, nguồn, giấy phép (kèm đường dẫn) và việc đã chỉnh sửa
  };
  const S = { state: 'idle', url: CFG.url, error: null, tris: 0, tries: 0, next: 0, credit: null, list: fish, groups, meshes: () => ({ depth: meshA, colour: meshB, pools: pool }) };
  let Loader = null, now = 0;
  function place(gltf) {
    const root = gltf && (gltf.scene || (gltf.scenes && gltf.scenes[0]));
    if (!root) throw new Error('mô hình không có cảnh');
    root.updateMatrixWorld(true);
    let src = null; root.traverse((o) => { if (!src && o.isMesh && o.geometry && o.geometry.attributes.position) src = o; });
    if (!src) throw new Error('mô hình không có lưới');
    const map = src.material && src.material.map;
    if (!map || !map.image) throw new Error('mô hình không có ảnh bề mặt');               // GLTFLoader nuốt lỗi giải mã ảnh (map = null): thà giữ cá dựng bằng mã
    const geo = src.geometry.clone(); geo.applyMatrix4(src.matrixWorld);
    if (!geo.attributes.normal) geo.computeVertexNormals();
    geo.computeBoundingBox(); const b = geo.boundingBox, L = b.max.z - b.min.z;
    if (!(L > 1e-6) || !isFinite(L)) throw new Error('mô hình rỗng');
    if (Math.abs(L - 1) > 0.02 || Math.abs(b.max.z + b.min.z) > 0.02) { geo.translate(0, 0, -(b.max.z + b.min.z) / 2); geo.scale(1 / L, 1 / L, 1 / L); } // file đã chuẩn hoá sẵn; đề phòng file khác
    map.anisotropy = Math.min(4, G.renderer.capabilities.getMaxAnisotropy()); map.needsUpdate = true;
    setModel(geo, fishMat({ map, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.16 })); // ảnh màu tự sáng nhẹ: bụng và vây khuất nắng vẫn rõ màu
    S.tris = Math.round((geo.index ? geo.index.count : geo.attributes.position.count) / 3);
    S.credit = CREDIT;
  }
  async function load() {
    S.state = 'loading'; S.tries++;
    try {
      if (!Loader) {
        try { Loader = (await import('three/addons/loaders/GLTFLoader.js')).GLTFLoader; } catch (e) { S.tries = 99; throw e; }
        if (!Loader) { S.tries = 99; throw new Error('addon không có GLTFLoader'); }
      }
      S.url = S.tries > 1 || low ? CFG.url : CFG.urlHi;                                     // lần thử lại: bản nhẹ
      const gltf = await new Loader().loadAsync(S.url);
      try { place(gltf); } catch (e) { S.tries = 99; throw e; }
      S.state = 'ready'; S.error = null;
    } catch (e) {
      S.error = (e && e.message) || String(e);
      if (S.tries < 2) { S.state = 'idle'; S.next = now + CFG.retryAfter; }
      else { S.state = 'failed'; console.warn('[hồ sen] không tải được mô hình cá — giữ cá dựng bằng mã: ' + S.error); }
    }
  }

  // =====================================================================
  //  CẬP NHẬT MỖI KHUNG (sau giờ trong ngày 5, quy tắc ẩn của vườn 76, đèn hoa đăng 32 / 77)
  // =====================================================================
  const sunL = W.lights && W.lights.sun, cam = G.camera, near2 = CFG.near * CFG.near;
  G.onUpdate((dt, t) => {
    now = t || 0;
    UNI.uHoT.value = now % TWRAP;
    const night = (G.tod && G.tod.night) || 0;
    if (base) wMat.color.copy(base.color);                                                  // màu nước theo giờ (05-world.js)
    UNI.uHoDay.value = 1 - night;
    if (sunL) { UNI.uHoSun.value.copy(sunL.position).sub(sunL.target.position).normalize(); UNI.uHoSunCol.value.copy(sunL.color).multiplyScalar(Math.min(1, sunL.intensity / 2.5)); }
    if (skyU) { UNI.uHoTop.value.copy(skyU.top.value); UNI.uHoHor.value.copy(skyU.hor.value); }
    else if (scene.fog) { UNI.uHoHor.value.copy(scene.fog.color); UNI.uHoTop.value.copy(scene.fog.color).multiplyScalar(0.6); }
    for (const r of rings) if (r.z >= 0) { r.z += dt; if (r.z > 3.2) r.z = -1; }
    poolMat.uniforms.uK.value = 0.07 + night * 0.55;
    UNI.uHoLit.value = 1 - night * 0.4;
    // cá, quầng đèn: ẩn cùng phần trang trí của vườn, và khi máy quay ở xa hồ (không tính bước bơi)
    const cdx = cam.position.x - CX, cdz = cam.position.z - CZ, show = !V.decorHidden && cdx * cdx + cdz * cdz < 110 * 110;
    if (meshA) meshA.visible = show; if (meshB) meshB.visible = show; pool.visible = show;
    if (show) { swim(Math.min(dt || 0, 0.1), now); updatePools(); }
    // tải mô hình cá khi người chơi tới gần hồ
    if (S.state !== 'idle' || now < S.next) return;
    const P = G.player; if (!P || !P.pos) return;
    const dx = P.pos.x - CX, dz = P.pos.z - CZ;
    if (dx * dx + dz * dz > near2) return;
    const conn = navigator.connection;
    if (conn && conn.saveData) { S.state = 'skipped'; return; }                              // máy bật "tiết kiệm dữ liệu": giữ cá dựng bằng mã
    load();
  }, 78);

  // ghi công tác giả mô hình cá (CC BY 4.0) ở cuối bảng Cài đặt, khi mô hình đang hiện
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

  G.hoNuoc = { ring, uniforms: UNI, water: wMat, fish: S };
}
