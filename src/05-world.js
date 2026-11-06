// =====================================================================
//  CẢNH CHÙA: trời hoàng hôn → đêm, ánh sáng, sân gạch, tam quan, chính điện,
//  tượng Phật, lư hương, gác chuông, cây bồ đề, hồ sen, bàn xin quẻ, đèn lồng
//  (mọi hình khối dựng bằng code, gộp lại để vẽ ít lần cho nhẹ máy)
// =====================================================================
function buildWorld(G) {
  const { THREE, util: U, scene } = G;
  const V3 = THREE.Vector3;
  const PI = Math.PI;

  // ---------- Vật liệu dùng chung ----------
  G.mats = {
    vc: new THREE.MeshLambertMaterial({ vertexColors: true }),
    vcDouble: new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }),
    metal: new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 55, specular: 0x6a5030, flatShading: true }),
    gold: new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 40, specular: 0x8a6a30, emissive: 0x2a1a06, flatShading: true }),
    lantern: new THREE.MeshBasicMaterial({ vertexColors: true }),
  };
  const C = {
    ochre: 0xd6b06c, ochreD: 0xb98f4f, stone: 0xa89d8b, stoneD: 0x8a8070, stoneL: 0xc2b8a5,
    wood: 0x8e2a22, woodD: 0x5a2418, gold: 0xd9a84a, goldD: 0xa87c2c, roof: 0xa8432d, ridge: 0x6e2a1c,
    bronze: 0x8f6a36, leaf: [0x4c7a35, 0x5d8c3d, 0x3f6b30, 0x6f9a45], bark: 0x6b5240, red: 0xc8302a, cream: 0xf3e3c3,
  };
  const S = U.batch(), F = U.batch(), M = U.batch(), LB = U.batch(), FAR = U.batch();
  const BOX = new THREE.BoxGeometry(1, 1, 1);
  const box = (B, x, y, z, sx, sy, sz, color, o = {}) => B.add(BOX, color, Object.assign({ p: [x, y, z], s: [sx, sy, sz] }, o));
  const boxMM = (B, x0, y0, z0, x1, y1, z1, color, o) => box(B, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), color, o);
  const cyl = (B, x, y, z, rt, rb, h, color, sg = 8, o = {}) => B.add(new THREE.CylinderGeometry(rt, rb, h, sg), color, Object.assign({ p: [x, y, z] }, o));
  const sph = (B, x, y, z, r, color, ws = 8, hs = 6, o = {}) => B.add(new THREE.SphereGeometry(r, ws, hs), color, Object.assign({ p: [x, y, z] }, o));
  const lathe = (pts, sg = 12) => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), sg);
  // thanh/cành nối hai điểm (bán kính đầu a, đầu b)
  const branch = (B, a, b, ra, rb, color, sg = 7) => {
    const g = new THREE.CylinderGeometry(ra, rb, 1, sg); g.rotateX(PI / 2);
    const { m, len } = U.segMatrix(a[0], a[1], a[2], b[0], b[1], b[2]);
    B.add(g, color, { s: [1, 1, len], m });
  };
  const beam = (B, a, b, w, h, color) => { const { m, len } = U.segMatrix(a[0], a[1], a[2], b[0], b[1], b[2]); B.add(BOX, color, { s: [w, h, len], m }); };
  const col = G.collide;
  const W = (G.world = { glows: [], petalSources: [], fireflyAreas: [], places: [] });
  const glow = (x, y, z, size, rgb, night = true) => W.glows.push({ x, y, z, size, r: rgb[0], g: rgb[1], b: rgb[2], night });
  G.cam.blockers = [];
  const blocker = (x0, y0, z0, x1, y1, z1) => G.cam.blockers.push(new THREE.Box3(new V3(x0, y0, z0), new V3(x1, y1, z1)));

  // ---------- Mái cong có đầu đao vút lên ----------
  function addRoof(B, cx, cy, cz, w, d, h, o = {}) {
    if (o.ry) { // mái xoay (vd. hành lang chạy dọc trục z): dựng ở gốc rồi xoay
      const T = U.batch(), TM = U.batch();
      addRoof(T, 0, 0, 0, w, d, h, Object.assign({}, o, { ry: 0, metal: TM }));
      const m = new THREE.Matrix4().makeRotationY(o.ry).setPosition(cx, cy, cz);
      if (T.list.length) { const g = U.merge(T.list); g.applyMatrix4(m); B.addGeo(g); }
      if (TM.list.length) { const g = U.merge(TM.list); g.applyMatrix4(m); (o.metal || M).addGeo(g); }
      return;
    }
    const MB = o.metal || M;
    const Wd = w / 2, D = d / 2, R = Math.max(0.04, Wd - D);
    const curl = o.curl ?? 0.55, sag = o.sag ?? 0.12, th = o.thick ?? 0.18, NS = o.seg ?? 10, NV = 4;
    const cA = new THREE.Color(o.color ?? C.roof), cB = cA.clone().multiplyScalar(0.8), cU = new THREE.Color(o.under ?? 0x4a2416), cE = new THREE.Color(o.edge ?? 0x7a2a1c);
    const sides = [
      { e: (s) => [U.lerp(-Wd, Wd, s), D], r: (s) => [U.lerp(-R, R, s), 0], n: NS },
      { e: (s) => [U.lerp(Wd, -Wd, s), -D], r: (s) => [U.lerp(R, -R, s), 0], n: NS },
      { e: (s) => [-Wd, U.lerp(-D, D, s)], r: () => [-R, 0], n: Math.max(4, Math.round((NS * D) / Wd)) },
      { e: (s) => [Wd, U.lerp(D, -D, s)], r: () => [R, 0], n: Math.max(4, Math.round((NS * D) / Wd)) },
    ];
    const pt = (sd, s, v, down) => {
      const e = sd.e(s), r = sd.r(s);
      let x = U.lerp(e[0], r[0], v), z = U.lerp(e[1], r[1], v), y = h * v;
      const cw = Math.pow(Math.abs(2 * s - 1), 3), fv = (1 - v) * (1 - v);
      y += curl * cw * fv - sag * h * Math.sin(PI * v);
      const push = curl * 0.55 * cw * fv;
      x += Math.sign(e[0]) * push * 0.7071; z += Math.sign(e[1]) * push * 0.7071;
      if (down) y -= th;
      return [x + cx, y + cy, z + cz];
    };
    const pos = [], colr = [];
    const _a = new V3(), _b = new V3(), _n = new V3();
    const tri = (a, b, c, color, want) => {
      _a.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); _b.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]); _n.crossVectors(_a, _b);
      if (_n.lengthSq() < 1e-9) return;
      let flip = false;
      if (want === 'up') flip = _n.y < 0; else if (want === 'down') flip = _n.y > 0;
      else { const mx = (a[0] + b[0] + c[0]) / 3 - cx, mz = (a[2] + b[2] + c[2]) / 3 - cz; flip = _n.x * mx + _n.z * mz < 0; }
      const vs = flip ? [a, c, b] : [a, b, c];
      const f = 1 + (Math.random() - 0.5) * 0.08;
      for (const v of vs) { pos.push(v[0], v[1], v[2]); colr.push(color.r * f, color.g * f, color.b * f); }
    };
    for (const sd of sides) {
      for (let i = 0; i < sd.n; i++) {
        const s0 = i / sd.n, s1 = (i + 1) / sd.n;
        for (let j = 0; j < NV; j++) {
          const v0 = j / NV, v1 = (j + 1) / NV;
          const cc = i % 2 ? cA : cB;
          const a = pt(sd, s0, v0), b = pt(sd, s1, v0), c = pt(sd, s1, v1), d = pt(sd, s0, v1);
          tri(a, b, c, cc, 'up'); tri(a, c, d, cc, 'up');
          const a2 = pt(sd, s0, v0, 1), b2 = pt(sd, s1, v0, 1), c2 = pt(sd, s1, v1, 1), d2 = pt(sd, s0, v1, 1);
          tri(a2, b2, c2, cU, 'down'); tri(a2, c2, d2, cU, 'down');
        }
        const a = pt(sd, s0, 0), b = pt(sd, s1, 0), a2 = pt(sd, s0, 0, 1), b2 = pt(sd, s1, 0, 1);
        tri(a, b, b2, cE, 'out'); tri(a, b2, a2, cE, 'out');
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
    g.computeVertexNormals();
    B.addGeo(g);
    // nóc, bờ mái, đầu đao
    const rc = o.ridge ?? C.ridge;
    box(B, cx, cy + h + 0.06, cz, 2 * R + 0.5, 0.26, 0.3, rc);
    const coneZ = () => { const c = new THREE.ConeGeometry(0.11, 1, 5); c.rotateX(PI / 2); return c; };
    for (const sx of [-1, 1]) {
      const a = [cx + sx * (R + 0.2), cy + h + 0.1, cz], b = [cx + sx * (R + 0.55), cy + h + 0.55, cz];
      const { m, len } = U.segMatrix(b[0], b[1], b[2], a[0], a[1], a[2]); B.add(coneZ(), rc, { s: [1.3, 1.3, len], m });
    }
    for (const [sd, s] of [[sides[0], 0], [sides[0], 1], [sides[1], 0], [sides[1], 1]]) {
      let prev = pt(sd, s, 0);
      for (let k = 1; k <= 4; k++) { const p = pt(sd, s, k / 4); beam(B, prev, [p[0], p[1] + 0.02, p[2]], 0.16, 0.14, rc); prev = p; }
      const c0 = pt(sd, s, 0), dx = Math.sign(c0[0] - cx), dz = Math.sign(c0[2] - cz);
      const tip = [c0[0] + dx * 0.25, c0[1] + 0.55 * (o.tip ?? 1), c0[2] + dz * 0.25];
      const { m, len } = U.segMatrix(tip[0], tip[1], tip[2], c0[0], c0[1] + 0.05, c0[2]);
      B.add(coneZ(), rc, { s: [1.2, 1.2, len], m });
    }
    if (o.pearl) {
      sph(MB, cx, cy + h + 0.48, cz, 0.22, C.gold, 10, 8);
      MB.add(new THREE.ConeGeometry(0.1, 0.4, 6), C.gold, { p: [cx, cy + h + 0.82, cz] });
      for (const sx of [-1, 1]) { // hai đuôi rồng cách điệu chầu ngọc
        let prev = [cx + sx * 0.4, cy + h + 0.2, cz];
        for (let k = 1; k <= 5; k++) { const p = [cx + sx * (0.4 + k * 0.32), cy + h + 0.2 + Math.sin(k * 1.2) * 0.22 + k * 0.03, cz]; beam(B, prev, p, 0.12, 0.12, C.goldD); prev = p; }
      }
    }
    if (o.finial) {
      sph(MB, cx, cy + h + 0.35, cz, 0.2, C.gold, 8, 6, { s: [1, 1.3, 1] });
      MB.add(new THREE.ConeGeometry(0.09, 0.35, 6), C.gold, { p: [cx, cy + h + 0.68, cz] });
    }
  }

  // ---------- Biển chữ (chữ quốc ngữ, vẽ bằng canvas) ----------
  const signs = [];
  function signTexture(lines, cw, ch, o = {}) {
    return U.canvasTex(cw, ch, (g, w, h) => {
      const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, o.bg1 || '#7a1f16'); bg.addColorStop(1, o.bg2 || '#4f120c');
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      const b = Math.round(Math.min(w, h) * 0.07);
      g.strokeStyle = '#e2b458'; g.lineWidth = b * 0.55; g.strokeRect(b * 0.6, b * 0.6, w - b * 1.2, h - b * 1.2);
      g.lineWidth = Math.max(2, b * 0.16); g.strokeRect(b * 1.35, b * 1.35, w - b * 2.7, h - b * 2.7);
      g.fillStyle = o.fg || '#f6d27a'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = b * 0.4; g.shadowOffsetY = b * 0.12;
      const n = lines.length, font = (fs) => `700 ${fs}px "Noto Serif", "Times New Roman", serif`;
      if (o.vertical) {
        let fs = Math.min(w * 0.5, ((h * 0.84) / n) * 0.78);
        g.font = font(fs);
        for (const l of lines) while (g.measureText(l).width > w * 0.72 && fs > 8) { fs *= 0.93; g.font = font(fs); }
        const step = (h * 0.84) / n;
        lines.forEach((l, i) => g.fillText(l, w / 2, h * 0.08 + step * (i + 0.5)));
      } else {
        let fs = Math.min((h * 0.62) / n, h * 0.5);
        g.font = font(fs);
        for (const l of lines) while (g.measureText(l).width > w * 0.84 && fs > 8) { fs *= 0.95; g.font = font(fs); }
        const step = (h * 0.8) / n;
        lines.forEach((l, i) => g.fillText(l, w / 2, h * 0.1 + step * (i + 0.5)));
      }
    });
  }
  function addSign(lines, w, h, x, y, z, ry = 0, o = {}) {
    const ppu = o.ppu || 220;
    const tex = signTexture(lines, Math.min(2048, Math.round(w * ppu)), Math.min(2048, Math.round(h * ppu)), o);
    const mat = new THREE.MeshLambertMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.2 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z); m.rotation.y = ry; m.matrixAutoUpdate = false; m.updateMatrix();
    scene.add(m); signs.push(mat);
    return m;
  }

  // =====================================================================
  //  BẦU TRỜI + SAO + THỜI GIAN TRONG NGÀY (hoàng hôn → đêm)
  // =====================================================================
  const skyU = {
    top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, bot: { value: new THREE.Color() },
    sunDir: { value: new V3() }, sunCol: { value: new THREE.Color() }, sunVis: { value: 1 },
    moonDir: { value: new V3(0.35, 0.62, 0.7).normalize() }, moonA: { value: 0 },
  };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: `uniform vec3 top, hor, bot, sunCol; uniform vec3 sunDir, moonDir; uniform float sunVis, moonA; varying vec3 vDir;
      void main(){ vec3 d = normalize(vDir); float h = d.y;
        vec3 c = mix(hor, top, pow(smoothstep(-0.02, 0.62, h), 0.75));
        c = mix(c, bot, smoothstep(0.0, -0.3, h));
        float s = max(dot(d, sunDir), 0.0);
        c += sunCol * (pow(s, 6.0) * 0.32 + pow(s, 40.0) * 0.35) ;
        c += sunCol * sunVis * smoothstep(0.9986, 0.9992, s) * 1.6;
        float m = max(dot(d, moonDir), 0.0);
        c += vec3(0.92, 0.94, 1.0) * moonA * (smoothstep(0.99935, 0.99962, m) * 1.2 + pow(m, 120.0) * 0.18);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  }));
  sky.frustumCulled = false; sky.renderOrder = -10; scene.add(sky);
  // sao
  {
    const n = 900, p = new Float32Array(n * 3), rnd = U.rng(7);
    for (let i = 0; i < n; i++) {
      const u = rnd(), v = 0.08 + rnd() * 0.92, th = u * PI * 2, y = v, r = Math.sqrt(1 - y * y);
      p[i * 3] = Math.cos(th) * r * 470; p[i * 3 + 1] = y * 470; p[i * 3 + 2] = Math.sin(th) * r * 470;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    W.stars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xfff6e0, size: 1.7, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
    W.stars.frustumCulled = false; sky.add(W.stars);
  }
  G.onUpdate(() => sky.position.copy(G.camera.position), 55);

  // ánh sáng
  const hemi = new THREE.HemisphereLight(0xffe0b8, 0x7a5a40, 1.2); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffc27a, 2.4);
  sun.castShadow = true;
  const sm = G.isTouch ? 1024 : 2048;
  sun.shadow.mapSize.set(sm, sm);
  Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 190 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
  scene.add(sun); scene.add(sun.target); sun.target.position.set(0, 0, 0);
  const hallLight = new THREE.PointLight(0xffb070, 30, 17 * G.L.hall.s, 1.6); hallLight.position.copy(G.frame.xf(0, 3.7, -16.2)); scene.add(hallLight);
  const burnerLight = new THREE.PointLight(0xff8a40, 0, 11, 1.8); burnerLight.position.set(0, 2.3, 4); scene.add(burnerLight);
  W.lights = { hemi, sun, hall: hallLight, burner: burnerLight };

  const KEYS = [
    { t: 0.0, top: 0x4b6fb2, hor: 0xffbc7c, bot: 0x6b4a3a, sun: 0xffc884, sunI: 2.5, hs: 0xffe2bc, hg: 0x7a5a40, hI: 1.25, fog: 0xf2b484, el: 12 },
    { t: 0.38, top: 0x44569a, hor: 0xff8d5c, bot: 0x5a3a34, sun: 0xff9a58, sunI: 1.9, hs: 0xf7b896, hg: 0x6a4038, hI: 1.05, fog: 0xea9070, el: 3 },
    { t: 0.64, top: 0x262b60, hor: 0xa65c7a, bot: 0x2a2030, sun: 0xb07aa8, sunI: 0.35, hs: 0xa494c8, hg: 0x3a2a38, hI: 0.85, fog: 0x6c4c6e, el: -4 },
    { t: 1.0, top: 0x0c1436, hor: 0x2c3a6c, bot: 0x10121c, sun: 0xa8bcff, sunI: 0.75, hs: 0x7486c4, hg: 0x2e2834, hI: 0.75, fog: 0x1e2a54, el: -12 },
  ].map((k) => {
    const o = { t: k.t, sunI: k.sunI, hI: k.hI, el: k.el };
    for (const key of ['top', 'hor', 'bot', 'sun', 'hs', 'hg', 'fog']) o[key] = new THREE.Color(k[key]);
    return o;
  });
  const cur = { top: new THREE.Color(), hor: new THREE.Color(), bot: new THREE.Color(), sun: new THREE.Color(), hs: new THREE.Color(), hg: new THREE.Color(), fog: new THREE.Color(), sunI: 0, hI: 0, el: 0 };
  const SUN_AZ = new V3(-0.88, 0, 0.47).normalize(), MOON = new V3(0.36, 0.84, 0.42).normalize();
  const waterDeep = new THREE.Color(0x1f5566), _wc = new THREE.Color(), _ld = new V3(), _sd = new V3();
  const tod = (G.tod = { t: 0, night: 0, clock: 0, speed: 1, fixed: null, phases: [300, 240, 100], lastShadowT: -1, lastShadowTime: 0 });
  tod.set = (t) => { tod.fixed = t; };
  function sampleTod(t) {
    let i = 0; while (i < KEYS.length - 2 && t > KEYS[i + 1].t) i++;
    const a = KEYS[i], b = KEYS[i + 1], f = U.smoothstep(0, 1, U.clamp((t - a.t) / (b.t - a.t), 0, 1));
    for (const k of ['top', 'hor', 'bot', 'sun', 'hs', 'hg', 'fog']) cur[k].copy(a[k]).lerp(b[k], f);
    cur.sunI = U.lerp(a.sunI, b.sunI, f); cur.hI = U.lerp(a.hI, b.hI, f); cur.el = U.lerp(a.el, b.el, f);
  }
  function updateTod(dt) {
    if (G.started) tod.clock += dt * tod.speed;
    const [p1, p2, p3] = tod.phases, cyc = p1 + p2 + p3, c = tod.clock % cyc;
    let t = c < p1 ? c / p1 : c < p1 + p2 ? 1 : 1 - (c - p1 - p2) / p3;
    if (tod.fixed != null) t = tod.fixed;
    tod.t = t; tod.night = U.smoothstep(0.45, 0.92, t);
    sampleTod(t);
    skyU.top.value.copy(cur.top); skyU.hor.value.copy(cur.hor); skyU.bot.value.copy(cur.bot);
    const el = (cur.el * PI) / 180;
    _sd.copy(SUN_AZ).multiplyScalar(Math.cos(el)); _sd.y = Math.sin(el); _sd.normalize();
    skyU.sunDir.value.copy(_sd); skyU.sunCol.value.copy(cur.sun).multiplyScalar(1 - tod.night * 0.85);
    skyU.sunVis.value = U.smoothstep(-0.06, 0.02, _sd.y);
    skyU.moonA.value = tod.night;
    W.stars.material.opacity = tod.night * tod.night * 0.95;
    // hướng chiếu sáng: mặt trời (nâng góc cho bóng gọn) → trăng
    const lel = Math.max(el, (26 * PI) / 180);
    _ld.copy(SUN_AZ).multiplyScalar(Math.cos(lel)); _ld.y = Math.sin(lel); _ld.normalize();
    _ld.lerp(MOON, U.smoothstep(0.5, 0.72, t)).normalize();
    sun.position.copy(_ld).multiplyScalar(90);
    sun.color.copy(cur.sun); sun.intensity = cur.sunI;
    hemi.color.copy(cur.hs); hemi.groundColor.copy(cur.hg); hemi.intensity = cur.hI;
    scene.fog.color.copy(cur.fog); scene.fog.near = U.lerp(60, 40, tod.night); scene.fog.far = U.lerp(330, 240, tod.night);
    burnerLight.intensity = 3 + tod.night * 14;
    hallLight.intensity = 26 + tod.night * 16;
    G.mats.lantern.color.setScalar(0.7 + tod.night * 0.34);
    G.mats.gold.emissive.setRGB(0.04 + tod.night * 0.05, 0.026 + tod.night * 0.03, 0.006 + tod.night * 0.008);
    for (const m of signs) m.emissiveIntensity = 0.18 + tod.night * 0.32;
    if (W.water) { _wc.copy(waterDeep).lerp(cur.top, 0.25).multiplyScalar(0.75 - tod.night * 0.3); W.water.material.color.copy(_wc); }
    if (G.player) { // tâm vùng bóng bám theo người chơi, bước 12 m
      const sx = Math.round(G.player.pos.x / 12) * 12, sz = U.clamp(Math.round((G.player.pos.z - 16) / 12) * 12, -94, 4); // tới −94 (v4): chính điện lùi sâu đến z ≈ −113 vẫn nằm trong hộp bóng ±40 m
      if (sx !== tod.shX || sz !== tod.shZ) { tod.shX = sx; tod.shZ = sz; sun.target.position.set(sx, 0, sz); sun.target.updateMatrixWorld(); tod.lastShadowT = -1; }
    }
    sun.position.add(sun.target.position);
    if (Math.abs(t - tod.lastShadowT) > 0.012 && G.time - tod.lastShadowTime > 2) { tod.lastShadowT = t; tod.lastShadowTime = G.time; G.renderer.shadowMap.needsUpdate = true; }
  }
  G.onUpdate(updateTod, 5);
  { // ảnh chụp chia sẻ: dời vùng bóng về chỗ chính điện rồi trả lại
    const saved = new V3();
    G.events.on('snapshot:before', () => {
      saved.copy(sun.target.position); sun.target.position.set(0, 0, -96); sun.target.updateMatrixWorld();
      sun.position.copy(_ld).multiplyScalar(90).add(sun.target.position); G.renderer.shadowMap.needsUpdate = true;
    });
    G.events.on('snapshot:after', () => {
      sun.target.position.copy(saved); sun.target.updateMatrixWorld();
      sun.position.copy(_ld).multiplyScalar(90).add(sun.target.position); G.renderer.shadowMap.needsUpdate = true;
    });
  }
  updateTod(0);

  // độ cao mặt cỏ (phẳng khắp vùng đi lại được, nhấp nhô dần ra xa) — dùng chung cho cảnh vật bên ngoài
  G.terrainY = (x, z) => {
    const ox = Math.max(0, Math.abs(x) - 32), oz = Math.max(0, z - 77, -109 - z), dOut = Math.hypot(ox, oz);
    return (Math.sin(x * 0.031) * Math.cos(z * 0.027) * 3.2 + Math.sin(x * 0.012 + 1.3) * 4) * U.smoothstep(25, 120, dOut) - 0.03;
  };
  // =====================================================================
  //  MẶT ĐẤT: cỏ, sân gạch, lối đi
  // =====================================================================
  {
    const g = new THREE.PlaneGeometry(470, 470, 47, 47); g.rotateX(-PI / 2);
    const p = g.attributes.position, cArr = new Float32Array(p.count * 3), c = new THREE.Color(), a = new THREE.Color(0x5f8a3a), b = new THREE.Color(0x7d9a45), dk = new THREE.Color(0x4a7034);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), d = Math.hypot(x, z - 18);
      p.setY(i, G.terrainY(x, z));
      const n = Math.sin(x * 0.21) * Math.cos(z * 0.17) * 0.5 + 0.5;
      c.copy(a).lerp(b, n).lerp(dk, U.smoothstep(80, 200, d) * 0.6);
      cArr[i * 3] = c.r; cArr[i * 3 + 1] = c.g; cArr[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(cArr, 3)); g.computeVertexNormals();
    const grass = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }));
    grass.receiveShadow = true; grass.matrixAutoUpdate = false; scene.add(grass);
  }
  const tileTex = U.canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#7f7566'; g.fillRect(0, 0, w, h);
    const rnd = U.rng(3);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const v = 0.9 + rnd() * 0.16, s = w / 2;
      g.fillStyle = `rgb(${(196 * v) | 0},${(184 * v) | 0},${(165 * v) | 0})`; g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
      for (let k = 0; k < 90; k++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '70,55,40' : '255,245,225'},${rnd() * 0.09})`; g.fillRect(i * s + rnd() * s, j * s + rnd() * s, 3, 3); }
    }
  });
  tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping; tileTex.repeat.set(48 / 2.4, 58 / 2.4);
  tileTex.anisotropy = Math.min(8, G.renderer.capabilities.getMaxAnisotropy());
  const court = new THREE.Mesh(new THREE.PlaneGeometry(48, 58), new THREE.MeshLambertMaterial({ map: tileTex }));
  court.rotation.x = -PI / 2; court.position.set(0, 0.005, 2); court.receiveShadow = true; court.matrixAutoUpdate = false; court.updateMatrix(); scene.add(court);
  const slabTex = U.canvasTex(256, 512, (g, w, h) => {
    g.fillStyle = '#6f6455'; g.fillRect(0, 0, w, h);
    const rnd = U.rng(11);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) {
      const v = 0.92 + rnd() * 0.14, off = j % 2 ? w / 4 : 0;
      g.fillStyle = `rgb(${(214 * v) | 0},${(192 * v) | 0},${(160 * v) | 0})`;
      g.fillRect(((i * w) / 2 + off) % w + 3, (j * h) / 4 + 3, w / 2 - 6, h / 4 - 6);
      if (off) g.fillRect(3 - w / 4 + 3, (j * h) / 4 + 3, w / 4 - 6, h / 4 - 6);
    }
  });
  slabTex.wrapS = slabTex.wrapT = THREE.RepeatWrapping;
  const pathMat = (rep) => { const t = slabTex.clone(); t.needsUpdate = true; t.repeat.set(2, rep); return new THREE.MeshLambertMaterial({ map: t }); };
  const path1 = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 44.0), pathMat(11));
  path1.rotation.x = -PI / 2; path1.position.set(0, 0.012, 8.6); path1.receiveShadow = true; path1.matrixAutoUpdate = false; path1.updateMatrix(); scene.add(path1);
  const path2 = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 46), pathMat(11));
  path2.rotation.x = -PI / 2; path2.position.set(0, 0.012, 54); path2.receiveShadow = true; path2.matrixAutoUpdate = false; path2.updateMatrix(); scene.add(path2);

  // =====================================================================
  //  TƯỜNG BAO
  // =====================================================================
  function wall(x0, z0, x1, z1) {
    const lx = Math.abs(x1 - x0), lz = Math.abs(z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, alongX = lx > lz, L = Math.max(lx, lz);
    const sz = (a, b) => (alongX ? [a, 0, b] : [b, 0, a]);
    const s1 = sz(L, 0.45), s2 = sz(L + 0.1, 0.62), s3 = sz(L + 0.2, 0.8), s4 = sz(L + 0.2, 0.22);
    box(S, cx, 0.2, cz, s2[0], 0.4, s2[2], C.stoneD);
    box(S, cx, 1.05, cz, s1[0], 1.3, s1[2], C.ochre);
    box(S, cx, 1.78, cz, s3[0], 0.18, s3[2], C.roof);
    box(S, cx, 1.93, cz, s4[0], 0.14, s4[2], C.ridge);
    for (let t = 0; t <= L + 0.01; t += 6) {
      const px = alongX ? Math.min(x0, x1) + t : cx, pz = alongX ? cz : Math.min(z0, z1) + t;
      box(S, px, 1.0, pz, 0.62, 2.0, 0.62, C.ochreD);
      box(S, px, 2.08, pz, 0.78, 0.16, 0.78, C.ridge);
    }
    col.box(Math.min(x0, x1) - (alongX ? 0 : 0.3), Math.min(z0, z1) - (alongX ? 0.3 : 0), Math.max(x0, x1) + (alongX ? 0 : 0.3), Math.max(z0, z1) + (alongX ? 0.3 : 0), 'wall');
  }
  wall(-24, 31, -7.0, 31); wall(7.0, 31, 24, 31);
  wall(-24, -118, -24, 31); wall(24, -118, 24, 31); wall(-24, -118, 24, -118); // tường sau lùi từ z −84 về −100 (v3), rồi về −118 (v4: sân chính điện sâu 12 m, chính điện sâu 27 m trên nền ba bậc)

  // ---------- Cột gỗ đỏ ----------
  function column(x, z, y0, h, r = 0.24, collide = true) {
    cyl(F, x, y0 + 0.12, z, r + 0.13, r + 0.17, 0.24, C.stone, 8);
    cyl(S, x, y0 + h / 2, z, r, r * 1.06, h, C.wood, 10);
    cyl(S, x, y0 + h - 0.1, z, r + 0.03, r + 0.03, 0.14, C.gold, 10);
    if (collide) col.circle(x, z, r + 0.1, 'col');
  }

  // =====================================================================
  //  LANTERN: đèn lồng đỏ treo
  // =====================================================================
  const lanternBody = lathe([[0, -0.25], [0.12, -0.24], [0.21, -0.17], [0.25, 0], [0.21, 0.17], [0.12, 0.24], [0, 0.25]], 10);
  function lantern(x, y, z, s = 1, color = 0xd8322a, glowCol = [1.0, 0.42, 0.18]) {
    LB.add(lanternBody, color, { p: [x, y, z], s, j: 0.03 });
    cyl(S, x, y + 0.27 * s, z, 0.11 * s, 0.13 * s, 0.07 * s, C.gold, 8);
    cyl(S, x, y - 0.27 * s, z, 0.13 * s, 0.11 * s, 0.07 * s, C.gold, 8);
    cyl(S, x, y - 0.42 * s, z, 0.02 * s, 0.05 * s, 0.24 * s, C.red, 5);
    glow(x, y, z, 1.7 * s, glowCol, true);
  }
  function hangLantern(x, yTop, z, len = 0.35, s = 1) {
    box(S, x, yTop - len / 2, z, 0.025, len, 0.025, 0x2a1a10);
    lantern(x, yTop - len - 0.27 * s, z, s);
  }
  function lanternInto(SB, LBB, x, y, z, s = 1, color = 0xd8322a, glowCol = [1.0, 0.42, 0.18]) {
    LBB.add(lanternBody, color, { p: [x, y, z], s, j: 0.03 });
    cyl(SB, x, y + 0.27 * s, z, 0.11 * s, 0.13 * s, 0.07 * s, C.gold, 8);
    cyl(SB, x, y - 0.27 * s, z, 0.13 * s, 0.11 * s, 0.07 * s, C.gold, 8);
    cyl(SB, x, y - 0.42 * s, z, 0.02 * s, 0.05 * s, 0.24 * s, C.red, 5);
    glow(x, y, z, 1.7 * s, glowCol, true);
  }
  function hangLanternInto(SB, LBB, x, yTop, z, len = 0.35, s = 1) {
    box(SB, x, yTop - len / 2, z, 0.025, len, 0.025, 0x2a1a10);
    lanternInto(SB, LBB, x, yTop - len - 0.27 * s, z, s);
  }
  function columnInto(SB, FB, x, z, y0, h, r = 0.24, collide = true) {
    cyl(FB, x, y0 + 0.12, z, r + 0.13, r + 0.17, 0.24, C.stone, 8);
    cyl(SB, x, y0 + h / 2, z, r, r * 1.06, h, C.wood, 10);
    cyl(SB, x, y0 + h - 0.1, z, r + 0.03, r + 0.03, 0.14, C.gold, 10);
    if (collide) col.circle(x, z, r + 0.1, 'col');
  }
  // Bộ công cụ dựng hình dùng chung cho khu mở rộng (09-world2-geo.js)
  G.build = { C, BOX, box, boxMM, cyl, sph, lathe, branch, beam, addRoof, addSign, glow, lanternInto, hangLanternInto, columnInto, signMaterials: signs };

  // =====================================================================
  //  CỔNG TAM QUAN + biển "CHÙA AN LẠC"
  // =====================================================================
  {
    const z0 = 30.3, z1 = 31.7, zc = 31;
    for (const x of [-6.6, -2.3, 2.3, 6.6]) for (const z of [z0, z1]) column(x, z, 0, Math.abs(x) < 3 ? 4.7 : 3.6, 0.25);
    // xà, diềm, biển
    for (const z of [z0, z1]) { box(S, 0, 4.62, z, 5.0, 0.22, 0.24, C.woodD); for (const sx of [-1, 1]) box(S, sx * 4.45, 3.52, z, 4.6, 0.2, 0.22, C.woodD); }
    for (const x of [-2.3, 2.3]) box(S, x, 4.62, zc, 0.22, 0.22, 1.6, C.woodD);
    boxMM(S, -2.3, 3.5, 30.42, 2.3, 4.55, 31.58, 0x6a1e14);
    addSign(['CHÙA AN LẠC'], 3.6, 0.82, 0, 4.02, 31.6, 0, { ppu: 260 });
    addSign(['NAM MÔ A DI ĐÀ PHẬT'], 3.6, 0.6, 0, 4.02, 30.4, PI, { ppu: 240 });
    for (const sx of [-1, 1]) boxMM(S, sx * 2.45, 2.9, 30.45, sx * 6.45, 3.42, 31.55, 0x6a1e14);
    addRoof(S, 0, 4.72, zc, 7.2, 3.9, 1.6, { curl: 0.62 });
    box(S, 0, 6.15, zc, 3.4, 0.7, 1.5, C.ochreD);
    addRoof(S, 0, 6.35, zc, 4.8, 2.7, 1.3, { curl: 0.5, pearl: true });
    for (const sx of [-1, 1]) addRoof(S, sx * 4.6, 3.62, zc, 4.9, 3.3, 1.2, { curl: 0.45 });
    // trụ biểu hai bên + câu đối
    for (const sx of [-1, 1]) {
      const x = sx * 8.3, z = 31.6;
      box(S, x, 0.2, z, 1.25, 0.4, 1.25, C.stoneD);
      box(S, x, 2.7, z, 0.95, 4.8, 0.95, C.ochre);
      box(S, x, 5.2, z, 1.25, 0.28, 1.25, C.ridge);
      box(S, x, 5.5, z, 0.7, 0.35, 0.7, C.ochreD);
      sph(S, x, 6.05, z, 0.42, C.ochre, 8, 6, { s: [1, 1.35, 1] });
      S.add(new THREE.ConeGeometry(0.16, 0.5, 6), C.ochreD, { p: [x, 6.65, z] });
      col.box(x - 0.62, z - 0.62, x + 0.62, z + 0.62, 'pillar');
      addSign(sx < 0 ? ['TÂM', 'AN', 'VẠN', 'SỰ', 'AN'] : ['PHÚC', 'LÀNH', 'ĐẾN', 'MUÔN', 'NHÀ'], 0.62, 3.3, x, 2.75, z + 0.49, 0, { vertical: true, ppu: 200 });
    }
    for (const sx of [-1, 1]) { hangLantern(sx * 1.45, 3.5, 32.05, 0.3); hangLantern(sx * 1.45, 3.5, 29.95, 0.3); }
    W.gate = { x: 0, z: 31 };
  }

  // =====================================================================
  //  CHÍNH ĐIỆN: nền, bậc, tường, cột, mái hai tầng, biển "CHÍNH ĐIỆN"
  //  Dựng theo toạ độ gốc (nền 0,6) vào bộ gom riêng rồi dời nguyên khối (0, dy, dz) lên tầng nền sau Tích Thiện Am
  // =====================================================================
  const fm = G.frame.mark(), OS = S, OF = F, OM = M, OLB = LB;
  if (G.L.hall.v2) { W.seats = []; W.hallFloorY = G.L.hall.h; } // chính điện v2: vỏ điện, nội thất, bàn thờ do 18-chinh-dien.js dựng; ở đây chỉ giữ tượng + mõ (18 đặt lại vị trí)
  else {
    const S = U.batch(), F = U.batch(), M = U.batch(), LB = U.batch();
    const H = G.L.hall, y0 = H.h;
    boxMM(F, H.x0, 0, H.z0, H.x1, y0, H.zTop, C.stone);
    boxMM(F, H.x0, 0, H.zTop, H.x1, 0.4, -8.2, C.stoneL);
    boxMM(F, H.x0, 0, -8.2, H.x1, 0.2, H.zStep, C.stoneL);
    boxMM(F, -8.8, y0, -22.5, 8.8, y0 + 0.02, -11, 0x8f4e34); // nền gạch đỏ trong điện
    col.box(10.3, H.z0, 10.8, H.zTop, 'rail'); col.box(-10.8, H.z0, -10.3, H.zTop, 'rail'); col.box(H.x0, -23.8, H.x1, -23.3, 'rail');
    // tường
    const wy0 = y0, wy1 = 5.2;
    boxMM(S, -9.2, wy0, -22.9, 9.2, wy1, -22.5, C.ochre); col.box(-9.2, -22.9, 9.2, -22.5, 'hall'); blocker(-9.2, wy0, -22.9, 9.2, wy1, -22.5);
    for (const sx of [-1, 1]) {
      const xa = sx * 8.8, xb = sx * 9.2;
      boxMM(S, xa, wy0, -22.9, xb, wy1, -10.8, C.ochre); col.box(Math.min(xa, xb), -22.9, Math.max(xa, xb), -10.8, 'hall'); blocker(Math.min(xa, xb), wy0, -22.9, Math.max(xa, xb), wy1, -10.8);
      const fa = sx * 6.4, fb = sx * 9.2;
      boxMM(S, fa, wy0, -11.2, fb, wy1, -10.8, C.ochre); col.box(Math.min(fa, fb), -11.2, Math.max(fa, fb), -10.8, 'hall'); blocker(Math.min(fa, fb), wy0, -11.2, Math.max(fa, fb), wy1, -10.8);
      // cửa sổ tròn
      S.add(new THREE.TorusGeometry(0.62, 0.1, 6, 18), C.woodD, { p: [sx * 7.8, 2.9, -10.75] });
      box(S, sx * 7.8, 2.9, -10.76, 1.2, 0.08, 0.06, C.woodD); box(S, sx * 7.8, 2.9, -10.76, 0.08, 1.2, 0.06, C.woodD);
      // cánh cửa gỗ mở ra hai bên
      box(S, sx * 5.75, y0 + 1.8, -10.45, 1.25, 3.5, 0.08, C.wood, { r: [0, sx * 1.2, 0] });
      box(S, sx * 5.75, y0 + 1.8, -10.43, 1.05, 0.08, 0.1, C.gold, { r: [0, sx * 1.2, 0] });
    }
    boxMM(S, -6.4, 4.3, -11.2, 6.4, wy1, -10.8, C.ochreD); blocker(-6.4, 4.3, -11.2, 6.4, wy1, -10.8);
    box(S, 0, 2.6, -22.45, 9, 4.0, 0.06, 0x5e1a12); // phông đỏ sau tượng
    boxMM(S, -4.6, 0.6, -22.42, 4.6, 0.75, -22.38, C.gold);
    // cột hiên + cột trong
    for (const x of [-8.6, -5.4, -2.2, 2.2, 5.4, 8.6]) columnInto(S, F, x, -9.4, y0, 4.4, 0.24);
    for (const x of [-8.2, 8.2]) for (const z of [-13.5, -17.5, -21.0]) columnInto(S, F, x, z, y0, 4.6, 0.22);
    for (const x of [-4.6, 4.6]) columnInto(S, F, x, -18.0, y0, 4.6, 0.22);
    box(S, 0, 4.95, -9.4, 18.4, 0.3, 0.26, C.woodD);
    for (const x of [-8.6, -5.4, -2.2, 2.2, 5.4, 8.6]) box(S, x, 4.95, -10.1, 0.22, 0.26, 1.5, C.woodD);
    addSign(['CHÍNH ĐIỆN'], 2.8, 0.72, 0, 4.42, -9.22, 0, { ppu: 260 });
    box(S, 0, 4.42, -9.32, 3.0, 0.9, 0.14, C.woodD);
    // mái hai tầng
    addRoof(S, 0, 5.2, -16.05, 22.8, 16.8, 3.2, { curl: 1.0, sag: 0.1, seg: 14, metal: M });
    box(S, 0, 7.55, -16.05, 13.6, 1.0, 7.8, C.ochreD);
    for (const sx of [-1, 1]) for (let k = -2; k <= 2; k++) box(S, k * 2.6, 7.55, -16.05 + sx * 3.92, 0.5, 0.8, 0.06, C.wood);
    addRoof(S, 0, 7.95, -16.05, 15.4, 9.4, 2.7, { curl: 0.85, sag: 0.08, seg: 12, pearl: true, metal: M });
    for (const x of [-7.0, -3.8, 3.8, 7.0]) hangLanternInto(S, LB, x, 4.82, -8.95, 0.45);
    // (đèn trong điện: đèn chùm hoa sen do 15-hall-arch.js dựng)
    // bàn thờ, tượng, đồ cúng
    boxMM(S, -4.1, y0, -22.4, 4.1, 1.6, -18.4, 0x7a2418);
    boxMM(S, -4.15, 1.45, -18.45, 4.15, 1.62, -18.35, C.gold);
    col.box(-4.2, -22.5, 4.2, -18.35, 'altar');
    boxMM(S, -2.1, 1.4, -18.35, 2.1, 1.52, -17.55, 0x6a1e14);
    for (const x of [-1.95, 1.95]) for (const z of [-18.25, -17.65]) box(S, x, 1.0, z, 0.1, 0.8, 0.1, 0x4a1a10);
    col.box(-2.2, -18.4, 2.2, -17.45, 'altar');
    for (const sx of [-1, 1]) {
      cyl(M, sx * 0.95, 1.55, -17.95, 0.3, 0.22, 0.05, C.gold, 10);
      const fr = [0xf39a2a, 0xf5d03a, 0x7cbf4a, 0xd8322a, 0xf39a2a];
      fr.forEach((c, i) => sph(S, sx * 0.95 + Math.cos(i * 1.26) * 0.14, 1.66 + (i === 4 ? 0.1 : 0), -17.95 + Math.sin(i * 1.26) * 0.14, i === 4 ? 0.1 : 0.09, c, 7, 5));
      S.add(lathe([[0, 0], [0.12, 0.02], [0.1, 0.18], [0.06, 0.3], [0.08, 0.36]], 8), 0x3a64a0, { p: [sx * 1.65, 1.52, -17.95] });
      for (let i = 0; i < 5; i++) sph(S, sx * 1.65 + Math.cos(i * 1.3) * 0.12, 1.98 + (i % 2) * 0.08, -17.95 + Math.sin(i * 1.3) * 0.1, 0.07, 0xf5d03a, 6, 4);
      cyl(S, sx * 0.42, 1.68, -17.95, 0.045, 0.05, 0.32, C.cream, 6);
      LB.add(new THREE.ConeGeometry(0.035, 0.1, 5), 0xffd27a, { p: [sx * 0.42, 1.9, -17.95] });
      glow(sx * 0.42, 1.9, -17.95, 0.55, [1.0, 0.7, 0.3], false);
    }
    M.add(lathe([[0, 0], [0.16, 0.01], [0.2, 0.1], [0.19, 0.16]], 10), C.bronze, { p: [0, 1.52, -17.95] });
    for (let i = 0; i < 3; i++) box(S, (i - 1) * 0.05, 1.82, -17.95, 0.012, 0.4, 0.012, 0x7a2a1a);
    // chỗ ngồi tụng kinh cho khách: thảm + bồ đoàn do 16-hall-altar.js dựng và điền vào W.seats
    W.seats = [];
    cyl(S, 0, y0 + 0.07, -16.3, 0.36, 0.38, 0.14, 0xd9a441, 10);
    // chuông gia trì (bát chuông) bên trái chỗ ngồi
    cyl(S, -0.9, y0 + 0.08, -16.95, 0.3, 0.32, 0.16, 0xa8281f, 10);
    M.add(lathe([[0, 0], [0.18, 0.02], [0.26, 0.12], [0.28, 0.3], [0.25, 0.32]], 12), C.bronze, { p: [-0.9, y0 + 0.16, -16.95] });
    col.circle(-0.9, -16.95, 0.34, 'bowl');
    W.hallFloorY = y0;
    // gộp bộ gom cục bộ vào bộ gom chung, dời lên tầng nền
    for (const [T, B] of [[S, OS], [F, OF], [M, OM], [LB, OLB]]) if (T.list.length) { const g = U.merge(T.list); g.translate(0, 0, -H.pz); g.scale(H.s, H.s, H.s); g.translate(0, H.dy, H.dz + H.pz); B.addGeo(g); }
  }

  // ---------- Tượng Phật ngồi trên toà sen (cách điệu, trang nghiêm) ----------
  {
    const T = U.batch(), gold = C.gold, goldD = C.goldD;
    T.add(lathe([[1.3, 0], [1.32, 0.16], [1.18, 0.22], [1.02, 0.36], [0, 0.36]], 12), 0x7a2418);
    for (let i = 0; i < 14; i++) { const a = (i / 14) * PI * 2; T.add(new THREE.SphereGeometry(0.3, 6, 5), goldD, { p: [Math.sin(a) * 0.98, 0.5, Math.cos(a) * 0.98], s: [0.9, 1.0, 0.42], r: [0.5, a, 0], order: 'YXZ' }); }
    for (let i = 0; i < 14; i++) { const a = ((i + 0.5) / 14) * PI * 2; T.add(new THREE.SphereGeometry(0.28, 6, 5), gold, { p: [Math.sin(a) * 0.8, 0.66, Math.cos(a) * 0.8], s: [0.85, 1.05, 0.4], r: [0.28, a, 0], order: 'YXZ' }); }
    T.add(new THREE.CylinderGeometry(0.86, 0.8, 0.12, 14), goldD, { p: [0, 0.76, 0] });
    T.add(new THREE.SphereGeometry(1, 16, 9), gold, { p: [0, 0.98, 0.1], s: [0.98, 0.33, 0.64] });
    T.add(lathe([[0.56, 0], [0.6, 0.2], [0.56, 0.5], [0.5, 0.8], [0.42, 0.98], [0.22, 1.06], [0, 1.08]], 16), gold, { p: [0, 0.98, 0], s: [1, 1, 0.76] });
    T.add(BOX, goldD, { p: [0.08, 1.62, 0.4], s: [0.16, 1.15, 0.06], r: [0.05, 0, 0.55] });
    for (const sx of [-1, 1]) {
      const sh = [sx * 0.5, 1.86, 0], el = [sx * 0.66, 1.3, 0.08], hd = [sx * 0.2, 1.14, 0.44];
      const g1 = new THREE.CylinderGeometry(0.13, 0.15, 1, 8); g1.rotateX(PI / 2);
      let s = U.segMatrix(...sh, ...el); T.add(g1, gold, { s: [1, 1, s.len], m: s.m });
      const g2 = new THREE.CylinderGeometry(0.11, 0.13, 1, 8); g2.rotateX(PI / 2);
      s = U.segMatrix(...el, ...hd); T.add(g2, gold, { s: [1, 1, s.len], m: s.m });
    }
    T.add(new THREE.SphereGeometry(0.17, 8, 6), gold, { p: [0, 1.15, 0.47], s: [1.5, 0.5, 1.0] });
    T.add(new THREE.CylinderGeometry(0.15, 0.17, 0.22, 10), gold, { p: [0, 2.09, 0] });
    T.add(new THREE.SphereGeometry(0.4, 18, 14), gold, { p: [0, 2.43, 0.02], s: [0.95, 1.05, 0.97] });
    T.add(new THREE.SphereGeometry(0.415, 18, 8, 0, PI * 2, 0, PI * 0.43), 0x6e4f22, { p: [0, 2.43, 0.0], r: [-0.2, 0, 0], s: [0.96, 1.05, 0.98] });
    T.add(new THREE.SphereGeometry(0.19, 10, 8), 0x6e4f22, { p: [0, 2.85, -0.04] });
    T.add(new THREE.SphereGeometry(0.06, 6, 5), gold, { p: [0, 3.04, -0.04] });
    for (const sx of [-1, 1]) {
      T.add(new THREE.SphereGeometry(0.1, 6, 6), gold, { p: [sx * 0.39, 2.33, -0.02], s: [0.6, 2.2, 0.9] });
      T.add(BOX, 0x4a2e12, { p: [sx * 0.14, 2.45, 0.383], s: [0.13, 0.02, 0.02], r: [0, 0, sx * 0.14] });
      T.add(BOX, goldD, { p: [sx * 0.15, 2.53, 0.378], s: [0.17, 0.022, 0.02], r: [0, 0, -sx * 0.14] });
    }
    T.add(new THREE.SphereGeometry(0.026, 6, 4), 0xc07a4a, { p: [0, 2.57, 0.396] });
    T.add(BOX, goldD, { p: [0, 2.38, 0.392], s: [0.05, 0.11, 0.05] });
    T.add(BOX, 0xb8704a, { p: [0, 2.27, 0.378], s: [0.1, 0.022, 0.02] });
    T.add(new THREE.TorusGeometry(0.74, 0.045, 6, 36), gold, { p: [0, 2.43, -0.42] });
    T.add(new THREE.TorusGeometry(1.0, 0.04, 6, 40), goldD, { p: [0, 1.62, -0.48], s: [1.25, 1.55, 1] });
    const statue = T.mesh(G.mats.gold, { cast: false });
    statue.position.set(0, 1.6, -20.6); statue.updateMatrix(); scene.add(statue);
    glow(0, 4.03, -21.05, 3.4, [1.0, 0.78, 0.36], false);
    W.statue = statue;
    W.statueFocus = new V3(0, 3.4, -20.6);
  }

  // ---------- Mõ gỗ (nhóm riêng để hoạt động gõ mõ làm nảy) ----------
  {
    const B = U.batch();
    cyl(B, 0, 0.06, 0, 0.32, 0.34, 0.12, 0xa8281f, 10);
    B.add(new THREE.SphereGeometry(0.3, 12, 9), 0x8a3a1c, { p: [0, 0.37, 0], s: [1.15, 0.85, 1.0] });
    box(B, 0, 0.33, 0.24, 0.42, 0.045, 0.16, 0x2a120a);
    B.add(new THREE.TorusGeometry(0.29, 0.02, 5, 20), C.gold, { p: [0, 0.37, 0], r: [PI / 2, 0, 0], s: [1.15, 1.0, 1] });
    B.add(new THREE.SphereGeometry(0.06, 6, 5), C.gold, { p: [0, 0.64, -0.05] });
    const mo = new THREE.Group(); const mesh = B.mesh(G.mats.vc, { cast: false, dynamic: true });
    mo.add(mesh); mo.position.set(0.9, G.L.hall.h, -16.95); scene.add(mo);
    col.circle(0.9, -16.95, 0.36, 'mo');
    W.hall = {
      mo, moTop: new V3(0.9, G.L.hall.h + 0.66, -16.95), cushion: { x: 0, z: -16.3, y: G.L.hall.h, yaw: PI },
      poi: { x: 0, z: -14.9, r: 2.3 }, stand: { x: 0, z: -15.6, yaw: PI },
      cam: { pos: [1.9, 2.5, -12.6], look: [0.2, 1.5, -18.2] },
    };
  }
  { // dời mesh, vật cản, quầng sáng của chính điện (tượng, biển, mõ đã nằm trong cảnh) rồi dời các tay nắm
    const H = G.L.hall, h = W.hall, xf = G.frame.xf, t = new V3();
    G.frame.shift(fm, H.dy, H.dz); // mõ + tượng nằm trong cảnh → dời ở đây (đừng dời tay lần nữa)
    W.statueFocus.copy(xf(W.statueFocus.x, W.statueFocus.y, W.statueFocus.z, t)); h.moTop.copy(xf(h.moTop.x, h.moTop.y, h.moTop.z, t));
    for (const o of [h.cushion, h.poi, h.stand]) { xf(o.x, o.y || 0, o.z, t); o.x = t.x; o.z = t.z; if (o.y !== undefined) o.y = t.y; }
    h.poi.r *= H.s;
    for (const k of ['pos', 'look']) { xf(h.cam[k][0], h.cam[k][1], h.cam[k][2], t); h.cam[k][0] = t.x; h.cam[k][1] = t.y; h.cam[k][2] = t.z; }
    W.hallFloorY = H.dy + W.hallFloorY * H.s;
  }

  // =====================================================================
  //  LƯ HƯƠNG ĐỒNG LỚN GIỮA SÂN
  // =====================================================================
  {
    const x = 0, z = 4;
    F.add(new THREE.CylinderGeometry(1.25, 1.36, 0.42, 8), C.stone, { p: [x, 0.21, z] });
    F.add(new THREE.CylinderGeometry(1.32, 1.32, 0.08, 8), C.stoneL, { p: [x, 0.46, z] });
    for (let i = 0; i < 3; i++) { const a = (i / 3) * PI * 2 + 0.5; cyl(M, x + Math.sin(a) * 0.62, 0.62, z + Math.cos(a) * 0.62, 0.1, 0.14, 0.32, C.bronze, 6); }
    M.add(lathe([[0, 0], [0.55, 0], [0.82, 0.16], [0.95, 0.42], [0.98, 0.66], [1.07, 0.8], [1.0, 0.85], [0.92, 0.8]], 18), C.bronze, { p: [x, 0.66, z] });
    M.add(new THREE.TorusGeometry(0.96, 0.035, 5, 28), 0xb08848, { p: [x, 1.12, z], r: [PI / 2, 0, 0] });
    for (const sx of [-1, 1]) M.add(new THREE.TorusGeometry(0.2, 0.05, 6, 12, PI), C.bronze, { p: [x + sx * 1.0, 1.52, z] });
    F.add(new THREE.CircleGeometry(0.92, 18), 0x6b6158, { p: [x, 1.4, z], r: [-PI / 2, 0, 0] });
    // những nén hương đã cắm sẵn (một số còn đỏ đầu)
    const rnd = U.rng(5);
    for (let i = 0; i < 46; i++) {
      const a = rnd() * PI * 2, r = Math.sqrt(rnd()) * 0.72, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r, h = 0.25 + rnd() * 0.4;
      box(S, px, 1.4 + h / 2, pz, 0.018, h, 0.018, 0x8a3020, { r: [(rnd() - 0.5) * 0.25, 0, (rnd() - 0.5) * 0.25] });
      if (i % 3 === 0) glow(px, 1.4 + h, pz, 0.22, [1.0, 0.35, 0.1], false);
    }
    col.circle(x, z, 1.45, 'burner');
    W.burner = {
      x, z, sandY: 1.4, sandR: 0.78, rimY: 1.5,
      poi: { x: 0, z: 6.6, r: 3.0 }, stand: { x: 0, z: 6.1, yaw: PI },
      cam: { pos: [2.1, 2.5, 7.7], look: [-0.25, 1.35, 4.0] },
    };
    W.smokeSpots = [[x, 1.75, z], [x + 0.3, 1.7, z - 0.2], [x - 0.35, 1.7, z + 0.15]];
  }

  // =====================================================================
  //  GÁC CHUÔNG: chuông đồng lớn + chày gỗ treo
  // =====================================================================
  {
    const cx = -15.2, cz = -3;
    boxMM(F, -17.7, 0, -5.5, -12.7, 0.4, -0.5, C.stone);
    for (const x of [-17.3, -13.1]) for (const z of [-5.1, -0.9]) column(x, z, 0.4, 4.4, 0.22, false);
    for (const z of [-5.1, -0.9]) box(S, cx, 4.7, z, 4.6, 0.22, 0.22, C.woodD);
    for (const x of [-17.3, -13.1]) box(S, x, 4.7, cz, 0.22, 0.22, 4.6, C.woodD);
    box(S, -15.6, 4.52, cz, 0.24, 0.24, 4.4, C.woodD);
    box(S, -13.9, 4.52, cz, 0.2, 0.2, 4.4, C.woodD);
    addRoof(S, cx, 4.82, cz, 6.0, 6.0, 1.7, { curl: 0.6 });
    box(S, cx, 6.35, cz, 2.6, 0.6, 2.6, C.ochreD);
    addRoof(S, cx, 6.5, cz, 3.8, 3.8, 1.2, { curl: 0.45, finial: true });
    addSign(['GÁC CHUÔNG'], 1.7, 0.42, -12.97, 4.32, cz, PI / 2, { ppu: 240 });
    col.box(-17.75, -5.55, -12.65, -0.45, 'belltower');
    // chuông
    const BB = U.batch();
    BB.add(new THREE.TorusGeometry(0.12, 0.035, 6, 12), C.bronze, { p: [0, -0.12, 0] });
    BB.add(new THREE.CylinderGeometry(0.12, 0.14, 0.16, 8), C.bronze, { p: [0, -0.26, 0] });
    BB.add(lathe([[0, -0.32], [0.32, -0.33], [0.5, -0.42], [0.6, -0.6], [0.64, -0.9], [0.67, -1.3], [0.71, -1.7], [0.78, -1.95], [0.84, -2.06], [0.8, -2.1], [0.7, -2.08], [0, -2.06]], 18), C.bronze);
    BB.add(new THREE.TorusGeometry(0.635, 0.026, 5, 28), 0xb08848, { p: [0, -0.78, 0], r: [PI / 2, 0, 0] });
    BB.add(new THREE.TorusGeometry(0.705, 0.026, 5, 28), 0xb08848, { p: [0, -1.58, 0], r: [PI / 2, 0, 0] });
    for (let i = 0; i < 4; i++) { const a = (i / 4) * PI * 2 + PI / 2; BB.add(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 10), 0xb08848, { p: [Math.sin(a) * 0.745, -1.84, Math.cos(a) * 0.745], r: [PI / 2, a, 0], order: 'YXZ' }); }
    const bellPivot = new THREE.Group(); bellPivot.position.set(-15.6, 4.42, cz);
    const bellMesh = BB.mesh(G.mats.metal, { cast: true, dynamic: true }); bellPivot.add(bellMesh); scene.add(bellPivot);
    // chày gỗ treo bằng hai dây, có dây kéo
    const SB = U.batch();
    const logG = new THREE.CylinderGeometry(0.15, 0.15, 1.6, 9); logG.rotateZ(PI / 2);
    SB.add(logG, 0x8a5a32, { p: [0, -1.85, 0] });
    SB.add(new THREE.CylinderGeometry(0.155, 0.155, 0.06, 9), 0xa8281f, { p: [-0.6, -1.85, 0], r: [0, 0, PI / 2] });
    SB.add(new THREE.CylinderGeometry(0.155, 0.155, 0.06, 9), 0xa8281f, { p: [0.6, -1.85, 0], r: [0, 0, PI / 2] });
    for (const sx of [-0.55, 0.55]) SB.add(BOX, 0xd8c09a, { p: [sx, -0.92, 0], s: [0.025, 1.85, 0.025] });
    { const s = U.segMatrix(0.8, -1.85, 0, 1.45, -3.25, 0); SB.add(BOX, 0xd8c09a, { s: [0.03, 0.03, s.len], m: s.m }); }
    SB.add(new THREE.SphereGeometry(0.06, 6, 5), 0xa8281f, { p: [1.45, -3.28, 0] });
    const swing = new THREE.Group(); swing.position.set(-13.9, 4.42, cz);
    swing.add(SB.mesh(G.mats.vc, { cast: true, dynamic: true })); scene.add(swing);
    const ropeEnd = new THREE.Object3D(); ropeEnd.position.set(1.45, -3.28, 0); swing.add(ropeEnd);
    W.bell = {
      x: -15.6, z: cz, pivot: bellPivot, swing, ropeEnd, strikeTheta: -0.087, hitPoint: new V3(-14.85, 2.57, cz),
      poi: { x: -11.7, z: cz, r: 3.0 }, stand: { x: -12.05, z: cz, yaw: -PI / 2 },
      cam: { pos: [-9.3, 2.7, 0.6], look: [-14.6, 2.5, -3.4] },
    };
    hangLantern(-13.1, 4.58, -0.9, 0.35, 0.8);
  }

  // =====================================================================
  //  CÂY BỒ ĐỀ LỚN (có điểm treo dải lụa)
  // =====================================================================
  {
    const tx = 15.5, tz = -5;
    F.add(new THREE.CylinderGeometry(2.3, 2.42, 0.46, 18), C.stone, { p: [tx, 0.23, tz] });
    F.add(new THREE.CircleGeometry(2.14, 18), 0x5a4030, { p: [tx, 0.47, tz], r: [-PI / 2, 0, 0] });
    col.circle(tx, tz, 2.45, 'tree');
    const bark = C.bark, rnd = U.rng(21);
    branch(S, [tx, 0.4, tz], [tx + 0.1, 3.5, tz - 0.1], 0.9, 0.55, bark, 9);
    branch(S, [tx + 0.4, 0.45, tz + 0.2], [tx + 0.9, 3.4, tz + 0.6], 0.45, 0.32, bark);
    branch(S, [tx - 0.4, 0.45, tz - 0.3], [tx - 0.8, 3.2, tz - 0.7], 0.42, 0.3, bark);
    for (let i = 0; i < 7; i++) { const a = (i / 7) * PI * 2 + 0.3; branch(S, [tx + Math.cos(a) * 0.5, 0.62, tz + Math.sin(a) * 0.5], [tx + Math.cos(a) * 1.8, 0.48, tz + Math.sin(a) * 1.8], 0.3, 0.06, bark, 5); }
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * PI * 2 + rnd() * 0.4, r = 3.2 + rnd() * 0.8;
      branch(S, [tx, 3.1, tz], [tx + Math.cos(a) * r, 5.0 + rnd() * 1.2, tz + Math.sin(a) * r], 0.26, 0.12, bark, 6);
    }
    // cành thấp để buộc lụa
    const anchors = [];
    const low = [PI, PI + 0.95, PI - 0.95, 0.35, -0.65, 1.65, -1.75];
    for (const a of low) {
      const len = 3.7 + rnd() * 0.9, y0 = 2.75 + rnd() * 0.55, y1 = y0 + 0.15 + rnd() * 0.35;
      const ax = [tx + Math.cos(a) * 0.4, y0, tz + Math.sin(a) * 0.4], bx = [tx + Math.cos(a) * len, y1, tz + Math.sin(a) * len];
      branch(S, ax, bx, 0.18, 0.07, bark, 6);
      for (let t = 0.32; t <= 0.96; t += 0.065) {
        anchors.push({ x: U.lerp(ax[0], bx[0], t) + (rnd() - 0.5) * 0.12, y: U.lerp(ax[1], bx[1], t) - 0.07, z: U.lerp(ax[2], bx[2], t) + (rnd() - 0.5) * 0.12 });
      }
    }
    // tán lá
    for (let i = 0; i < 20; i++) {
      const a = i * 2.39996, rr = 1.2 + Math.sqrt(i / 20) * 3.4, r = 1.5 + rnd() * 1.1;
      S.add(new THREE.IcosahedronGeometry(r, 1), C.leaf[i % 4], { p: [tx + Math.cos(a) * rr, 6.9 - rr * 0.38 + rnd() * 0.6, tz + Math.sin(a) * rr], s: [1, 0.78, 1], j: 0.12 });
    }
    W.tree = {
      x: tx, z: tz, anchors, poi: { x: 11.6, z: tz, r: 3.1 }, stand: { x: 11.85, z: tz, yaw: PI / 2 },
      cam: { pos: [8.4, 2.9, -1.2], look: [14.2, 2.8, -5.4] },
    };
    W.petalSources.push({ x: tx, y: 4.6, z: tz, r: 4.2, kind: 'leaf' });
    W.fireflyAreas.push({ x: tx, z: tz, r: 5.5 });
  }

  // =====================================================================
  //  HỒ SEN THẢ HOA ĐĂNG (rộng, có đảo nhỏ với thuỷ đình)
  // =====================================================================
  {
    const px = 15.2, pz = 16.2, rx = 6.8, rz = 8.6;
    const isl = { x: 18.0, z: 19.4, r: 1.8 };
    const water = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshPhongMaterial({ color: 0x1f5566, emissive: 0x0b2c38, shininess: 90, specular: 0x8a7a60 }));
    water.rotation.x = -PI / 2; water.scale.set(rx, rz, 1); water.position.set(px, 0.05, pz); water.receiveShadow = true;
    water.matrixAutoUpdate = false; water.updateMatrix(); scene.add(water); W.water = water;
    const rnd = U.rng(31);
    // bờ đá quanh hồ: hai lớp đá xếp
    for (let i = 0; i < 70; i++) {
      const a = (i / 70) * PI * 2 + rnd() * 0.03;
      F.add(new THREE.DodecahedronGeometry(0.36, 0), i % 3 ? 0x8d8576 : 0x9d9585, { p: [px + Math.cos(a) * (rx + 0.24), 0.1, pz + Math.sin(a) * (rz + 0.24)], s: [1.3, 0.55, 0.95], r: [rnd(), a, rnd()], j: 0.1 });
      if (i % 2 === 0) F.add(new THREE.DodecahedronGeometry(0.26, 0), 0x7d7566, { p: [px + Math.cos(a) * (rx + 0.62), 0.07, pz + Math.sin(a) * (rz + 0.62)], s: [1.2, 0.45, 0.9], r: [rnd(), a, rnd()], j: 0.1 });
    }
    const inPond = (x, z, m = 0) => ((x - px) * (x - px)) / ((rx - m) * (rx - m)) + ((z - pz) * (z - pz)) / ((rz - m) * (rz - m)) < 1;
    const offIsle = (x, z, m = 0) => Math.hypot(x - isl.x, z - isl.z) > isl.r + m;
    // lá sen nổi, lá sen vươn cao, hoa sen, nụ sen
    const pads = [];
    for (let i = 0; i < 46; i++) {
      let x, z, tries = 0;
      do { x = px + (rnd() * 2 - 1) * rx; z = pz + (rnd() * 2 - 1) * rz; tries++; } while ((!inPond(x, z, 0.6) || !offIsle(x, z, 0.5) || Math.hypot(x - 9.0, z - pz) < 1.8) && tries < 40);
      const r = 0.28 + rnd() * 0.34; pads.push([x, z, r]);
      F.add(new THREE.CylinderGeometry(r, r, 0.03, 9, 1, false, 0.3, PI * 1.85), i % 2 ? 0x4f8a3c : 0x3f7a33, { p: [x, 0.08, z], r: [0, rnd() * 6, 0] });
    }
    for (let i = 0; i < 16; i++) {
      const [x, z] = pads[i];
      for (let k = 0; k < 7; k++) { const a = (k / 7) * PI * 2; S.add(new THREE.SphereGeometry(0.1, 6, 4), i % 4 ? 0xf29bb5 : 0xfbe4ea, { p: [x + Math.sin(a) * 0.08, 0.2, z + Math.cos(a) * 0.08], s: [1, 1.7, 0.5], r: [0.5, a, 0], order: 'YXZ' }); }
      sph(S, x, 0.2, z, 0.06, 0xf5d03a, 6, 4);
    }
    for (let i = 16; i < 24; i++) { const [x, z] = pads[i]; cyl(S, x + 0.15, 0.3, z, 0.012, 0.012, 0.45, 0x4f8a3c, 4); S.add(new THREE.ConeGeometry(0.07, 0.22, 6), 0xf28aaa, { p: [x + 0.15, 0.6, z] }); }
    for (let i = 24; i < 36; i++) { // lá sen vươn khỏi mặt nước
      const [x, z] = pads[i], h = 0.35 + rnd() * 0.5;
      cyl(S, x, 0.05 + h / 2, z, 0.014, 0.018, h, 0x4f7a34, 4);
      S.add(new THREE.ConeGeometry(0.34 + rnd() * 0.12, 0.12, 9, 1, true), 0x5a9440, { p: [x, 0.08 + h, z], r: [PI + (rnd() - 0.5) * 0.4, rnd() * 6, (rnd() - 0.5) * 0.4] });
    }
    // đảo nhỏ với thuỷ đình mái cong (để ngắm, không lên được)
    F.add(new THREE.CylinderGeometry(isl.r, isl.r + 0.25, 0.4, 14), 0x8d8576, { p: [isl.x, 0.05, isl.z] });
    F.add(new THREE.CircleGeometry(isl.r - 0.1, 14), 0x6f9a45, { p: [isl.x, 0.26, isl.z], r: [-PI / 2, 0, 0] });
    for (let i = 0; i < 14; i++) { const a = (i / 14) * PI * 2; F.add(new THREE.DodecahedronGeometry(0.3, 0), 0x9d9585, { p: [isl.x + Math.cos(a) * (isl.r + 0.1), 0.18, isl.z + Math.sin(a) * (isl.r + 0.1)], s: [1.2, 0.6, 1], r: [rnd(), a, 0], j: 0.1 }); }
    for (let k = 0; k < 6; k++) { const a = (k / 6) * PI * 2 + PI / 6; cyl(S, isl.x + Math.cos(a) * 1.0, 1.35, isl.z + Math.sin(a) * 1.0, 0.09, 0.1, 2.2, C.wood, 6); }
    cyl(F, isl.x, 0.3, isl.z, 1.2, 1.25, 0.1, C.stoneL, 6);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * PI * 2 + PI / 6, b = a + PI / 3; beam(S, [isl.x + Math.cos(a) * 1.0, 2.42, isl.z + Math.sin(a) * 1.0], [isl.x + Math.cos(b) * 1.0, 2.42, isl.z + Math.sin(b) * 1.0], 0.12, 0.14, C.woodD); }
    addRoof(S, isl.x, 2.5, isl.z, 3.0, 3.0, 1.15, { curl: 0.45, finial: true });
    hangLantern(isl.x, 2.4, isl.z, 0.3, 0.8);
    col.ellipse(px, pz, rx + 0.42, rz + 0.42, 'pond');
    // đèn đá bên hồ
    for (const [x, z] of [[7.6, 9.0], [9.4, 26.4], [22.9, 7.4]]) {
      box(S, x, 0.15, z, 0.6, 0.3, 0.6, C.stoneD); box(S, x, 0.75, z, 0.28, 0.9, 0.28, C.stone);
      box(S, x, 1.32, z, 0.56, 0.12, 0.56, C.stone); LB.add(BOX, 0xffd98a, { p: [x, 1.6, z], s: [0.36, 0.4, 0.36] });
      S.add(new THREE.ConeGeometry(0.5, 0.36, 4), C.stoneD, { p: [x, 2.0, z], r: [0, PI / 4, 0] });
      glow(x, 1.6, z, 1.4, [1.0, 0.75, 0.38], true); col.circle(x, z, 0.42, 'stonelamp');
    }
    // ghế đá ngắm hồ (bờ nam)
    W.benchSeats = [];
    for (const [x, z] of [[11.6, 27.2], [17.8, 27.4]]) {
      const yaw = U.yawTo(x, z, px, pz);
      box(S, x, 0.42, z, 1.8, 0.14, 0.55, C.stoneL, { r: [0, yaw, 0] });
      for (const s of [-0.65, 0.65]) box(S, x + Math.cos(yaw) * s, 0.2, z - Math.sin(yaw) * s, 0.2, 0.4, 0.45, C.stoneD, { r: [0, yaw, 0] });
      for (const s of [-0.75, 0.75]) col.circle(x + Math.cos(yaw) * s, z - Math.sin(yaw) * s, 0.22, 'bench');
      W.benchSeats.push({ x: x + Math.sin(yaw) * 0.05, z: z + Math.cos(yaw) * 0.05, yaw, y: 0.42 });
    }
    W.pond = {
      x: px, z: pz, rx, rz, waterY: 0.06, island: isl,
      inside: (x, z, m = 0) => inPond(x, z, m) && offIsle(x, z, m + 0.3),
      poi: { x: 7.1, z: pz, r: 3.0 }, stand: { x: 7.45, z: pz, yaw: PI / 2 }, release: { x: 8.8, z: pz },
      cam: { pos: [4.4, 3.9, 23.8], look: [14.0, 0.3, 15.4] },
    };
    W.fireflyAreas.push({ x: px, z: pz, r: 8.5 });
  }

  // =====================================================================
  //  BÀN XIN QUẺ (nhà nhỏ mái cong)
  // =====================================================================
  {
    const cx = -14, cz = 14.25;
    for (const x of [-15.6, -12.4]) for (const z of [13.0, 15.5]) { column(x, z, 0, 2.9, 0.18, true); }
    for (const z of [13.0, 15.5]) box(S, cx, 2.92, z, 3.6, 0.2, 0.2, C.woodD);
    for (const x of [-15.6, -12.4]) box(S, x, 2.92, cz, 0.2, 0.2, 2.9, C.woodD);
    addRoof(S, cx, 3.0, cz, 4.8, 3.9, 1.3, { curl: 0.5, finial: true });
    addSign(['XIN QUẺ ĐẦU NĂM'], 2.3, 0.42, cx, 2.6, 15.62, 0, { ppu: 240 });
    boxMM(S, -15.0, 0, 13.7, -13.0, 0.78, 14.7, 0xa52a24);
    boxMM(S, -15.05, 0.78, 13.65, -12.95, 0.84, 14.75, 0x5a2418);
    boxMM(S, -15.02, 0.55, 14.71, -12.98, 0.62, 14.73, C.gold);
    col.box(-15.1, 13.6, -12.9, 14.8, 'table');
    M.add(lathe([[0, 0], [0.15, 0.01], [0.19, 0.09], [0.18, 0.14]], 10), C.bronze, { p: [-13.55, 0.84, 14.15] });
    for (let i = 0; i < 3; i++) box(S, -13.55 + (i - 1) * 0.04, 1.12, 14.15, 0.012, 0.36, 0.012, 0x7a2a1a);
    glow(-13.55, 1.3, 14.15, 0.2, [1, 0.35, 0.1], false);
    sph(S, -13.3, 0.92, 14.45, 0.07, 0xf39a2a, 6, 4); sph(S, -13.18, 0.91, 14.4, 0.06, 0xf5d03a, 6, 4);
    // ống xăm
    const TB = U.batch();
    TB.add(new THREE.CylinderGeometry(0.12, 0.11, 0.42, 10), 0xd8b25a, { p: [0, 0.21, 0] });
    for (const y of [0.08, 0.3]) TB.add(new THREE.TorusGeometry(0.12, 0.012, 4, 14), 0x9a7a30, { p: [0, y, 0], r: [PI / 2, 0, 0] });
    const rnd = U.rng(41);
    for (let i = 0; i < 16; i++) {
      const a = rnd() * PI * 2, r = rnd() * 0.07, h = 0.42 + rnd() * 0.12;
      TB.add(BOX, 0xc9a46a, { p: [Math.cos(a) * r, h / 2 + 0.05, Math.sin(a) * r], s: [0.02, h, 0.008], r: [(rnd() - 0.5) * 0.2, rnd() * 3, (rnd() - 0.5) * 0.2] });
    }
    const tube = new THREE.Group(); tube.add(TB.mesh(G.mats.vc, { cast: false, dynamic: true }));
    tube.position.set(-14.35, 0.84, 14.2); scene.add(tube);
    hangLantern(cx - 1.25, 2.82, 15.62, 0.3, 0.8);
    W.fortune = {
      x: cx, z: cz, tube, tubeTop: new V3(-14.35, 1.3, 14.2),
      poi: { x: cx, z: 16.4, r: 2.6 }, stand: { x: cx, z: 15.65, yaw: PI },
      cam: { pos: [-11.9, 2.5, 19.2], look: [-14.0, 0.45, 14.9] },
    };
  }

  // =====================================================================
  //  HÀNG ĐÈN LỒNG DỌC LỐI ĐI
  // =====================================================================
  for (const z of [26, 20.5, 15, 9.5, -1.8]) for (const sx of [-1, 1]) {
    const x = sx * 3.0;
    box(S, x, 0.14, z, 0.46, 0.28, 0.46, C.stoneD);
    box(S, x, 1.45, z, 0.16, 2.6, 0.16, C.woodD);
    box(S, x - sx * 0.3, 2.68, z, 0.78, 0.1, 0.1, C.woodD);
    S.add(new THREE.ConeGeometry(0.16, 0.22, 4), C.ridge, { p: [x, 2.86, z], r: [0, PI / 4, 0] });
    box(S, x - sx * 0.6, 2.52, z, 0.02, 0.28, 0.02, 0x2a1a10);
    lantern(x - sx * 0.6, 2.13, z, 0.95);
    col.circle(x, z, 0.24, 'post');
  }

  // =====================================================================
  //  CÂY HOA SỨ, CHẬU CẢNH, TRE, CÂY GÓC SÂN
  // =====================================================================
  function frangipani(x, z, seed) {
    const rnd = U.rng(seed);
    const trunk = 0x8a7a68, leaves = [];
    branch(S, [x, 0, z], [x + 0.1, 1.3, z], 0.2, 0.15, trunk, 7);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * PI * 2 + rnd(), r = 1.0 + rnd() * 0.5, top = [x + Math.cos(a) * r, 2.2 + rnd() * 0.5, z + Math.sin(a) * r];
      branch(S, [x + 0.1, 1.25, z], top, 0.12, 0.07, trunk, 6);
      S.add(new THREE.IcosahedronGeometry(0.62 + rnd() * 0.25, 0), 0x3f6a32, { p: [top[0], top[1] + 0.25, top[2]], s: [1.1, 0.7, 1.1], j: 0.12 });
      for (let k = 0; k < 5; k++) sph(S, top[0] + (rnd() - 0.5) * 0.9, top[1] + 0.48 + rnd() * 0.18, top[2] + (rnd() - 0.5) * 0.9, 0.07, k % 2 ? 0xfff4dc : 0xffe7a8, 5, 4);
      leaves.push(top);
    }
    col.circle(x, z, 0.4, 'tree');
    W.petalSources.push({ x, y: 2.8, z, r: 1.6, kind: 'flower' });
  }
  frangipani(-8.6, -5.4, 51); frangipani(8.6, -5.4, 52); frangipani(-9.5, 24.5, 53);
  function bonsai(x, z) {
    F.add(lathe([[0, 0], [0.3, 0], [0.42, 0.12], [0.46, 0.42], [0.5, 0.46], [0, 0.46]], 10), 0x3c6aa0, { p: [x, 0, z] });
    cyl(F, x, 0.43, z, 0.49, 0.49, 0.04, 0xeef0f4, 10);
    branch(S, [x, 0.45, z], [x + 0.15, 1.05, z + 0.05], 0.07, 0.05, 0x6b5240, 5);
    S.add(new THREE.IcosahedronGeometry(0.34, 0), 0x4c7a35, { p: [x + 0.18, 1.15, z + 0.05], s: [1.2, 0.6, 1.0], j: 0.12 });
    S.add(new THREE.IcosahedronGeometry(0.24, 0), 0x5d8c3d, { p: [x - 0.18, 0.9, z], s: [1.2, 0.6, 1.0], j: 0.12 });
    col.circle(x, z, 0.46, 'pot');
  }
  for (const sx of [-1, 1]) { bonsai(sx * 4.7, 23.2); bonsai(sx * 4.7, 12.3); bonsai(sx * 10.0, -6.9); }
  function roundTree(x, z, s, seed, collide = true) {
    const rnd = U.rng(seed);
    branch(S, [x, 0, z], [x, 2.2 * s, z], 0.3 * s, 0.2 * s, C.bark, 6);
    for (let i = 0; i < 4; i++) S.add(new THREE.IcosahedronGeometry((1.3 + rnd() * 0.6) * s, 0), C.leaf[(i + seed) % 4], { p: [x + (rnd() - 0.5) * 1.6 * s, (2.8 + rnd() * 1.4) * s, z + (rnd() - 0.5) * 1.6 * s], j: 0.12 });
    if (collide) col.circle(x, z, 0.6 * s, 'tree');
  }
  function bamboo(x, z, seed, collide = true) {
    const rnd = U.rng(seed);
    for (let i = 0; i < 9; i++) {
      const bx = x + (rnd() - 0.5) * 1.2, bz = z + (rnd() - 0.5) * 1.2, h = 4 + rnd() * 3, lean = (rnd() - 0.5) * 0.6;
      branch(S, [bx, 0, bz], [bx + lean, h, bz + lean * 0.5], 0.06, 0.05, i % 2 ? 0x8aa04a : 0x7a9440, 5);
      S.add(new THREE.IcosahedronGeometry(0.6 + rnd() * 0.4, 0), 0x5d8c3d, { p: [bx + lean, h, bz + lean * 0.5], s: [1, 1.4, 1], j: 0.15 });
    }
    if (collide) col.circle(x, z, 0.85, 'bamboo');
  }
  roundTree(-21, 27.5, 1, 61); roundTree(21, 27.5, 1, 62);
  bamboo(-22.2, 6, 71); bamboo(-22.2, -8.0, 72);
  // cây cối bên ngoài tường
  {
    const rnd = U.rng(91);
    for (let i = 0; i < 64; i++) {
      let x, z;
      for (;;) {
        x = (rnd() * 2 - 1) * 46; z = -100 + rnd() * 172;
        const insideWalls = x > -26.5 && x < 26.5 && z > -120.5 && z < 33.5; // (13-scenery.js lấy mẫu y hệt: sửa cả hai nơi cùng lúc)
        const onPath = Math.abs(x) < 6 && z > 30;
        if (!insideWalls && !onPath) break;
      }
      if (i % 5 === 0) bamboo(x, z, 100 + i, false); else roundTree(x, z, 0.9 + rnd() * 0.6, 200 + i, false);
    }
    for (const z of [38, 46, 54, 62]) for (const sx of [-1, 1]) { const x = sx * 3.4; box(S, x, 0.5, z, 0.3, 1.0, 0.3, C.stoneD); LB.add(BOX, 0xffd98a, { p: [x, 1.12, z], s: [0.32, 0.26, 0.32] }); S.add(new THREE.ConeGeometry(0.34, 0.28, 4), C.stoneD, { p: [x, 1.4, z], r: [0, PI / 4, 0] }); glow(x, 1.12, z, 1.0, [1, 0.75, 0.38], true); }
    // bia đá nhỏ ở đầu lối vào
    box(S, 4.6, 0.25, 41, 1.6, 0.5, 0.7, C.stoneD); box(S, 4.6, 1.2, 41, 1.3, 1.4, 0.3, C.stone);
    addSign(['CHÙA AN LẠC', 'Xin mời vào lễ Phật'], 1.1, 0.8, 4.6, 1.22, 41.16, 0, { ppu: 260, bg1: '#5a4a3a', bg2: '#3e3226', fg: '#f3e3c3' });
    col.box(3.8, 40.65, 5.4, 41.35, 'stele');
  }
  // núi xa (đường viền hoàng hôn)
  {
    const rnd = U.rng(77);
    // v4: sông chạy sau tường bao (z ≈ −136…−148, 13-scenery.js) nên chân núi xa (nơi mặt nón cắt mặt đất) không được trùm lên sông ở đoạn sau chùa / bên tây, cũng không lấn vào khuôn viên:
    // núi nào lấn vào thì lùi ra xa và phóng to theo (k ≤ 1,4 — hình dáng trên đường chân trời giữ nguyên), nếu chưa đủ thì thu hẹp chân; núi không lấn thì giữ nguyên như cũ
    // (KEEP = tim sông từ (100,−136) về tây rồi xuống (−68,−30) — cùng điểm điều khiển với 13-scenery.js, lề 12 m; và các góc tường bao, lề 6 m)
    const KEEP = [];
    {
      const cp = [[100, -136], [50, -140], [0, -144], [-42, -148], [-78, -128], [-76, -70], [-68, -30]];
      for (let i = 0; i < cp.length - 1; i++) { const n = Math.ceil(Math.hypot(cp[i + 1][0] - cp[i][0], cp[i + 1][1] - cp[i][1]) / 10); for (let t = 0; t < n; t++) KEEP.push([cp[i][0] + ((cp[i + 1][0] - cp[i][0]) * t) / n, cp[i][1] + ((cp[i + 1][1] - cp[i][1]) * t) / n, 12]); }
      KEEP.push([-68, -30, 12]);
      for (const [x, z] of [[-26, -120], [26, -120], [0, -120], [-26, -60], [26, -60], [-26, 0], [26, 0], [-26, 33], [26, 33]]) KEEP.push([x, z, 6]);
    }
    for (let i = 0; i < 34; i++) {
      const a = (i / 34) * PI * 2 + rnd() * 0.15, d = 190 + rnd() * 120, h = 16 + rnd() * 34, r = 55 + rnd() * 45;
      const clear = (k, q) => { const cx = Math.cos(a) * d * k, cz = Math.sin(a) * d * k + 15, re = q * (1 - 3 / (h * k)); return KEEP.every((m) => Math.hypot(cx - m[0], cz - m[1]) >= re + m[2]); }; // re: bán kính chân thấy được (nón chìm 3 m)
      let k = 1, q;
      while (k < 1.4 && !clear(k, r * k)) k += 0.02;
      q = r * k; while (q > r * k * 0.6 && !clear(k, q)) q *= 0.96;
      FAR.add(new THREE.ConeGeometry(q, h * k, 5 + (i % 3)), i % 2 ? 0x6a4a62 : 0x55405a, { p: [Math.cos(a) * d * k, (h * k) / 2 - 3, Math.sin(a) * d * k + 15], r: [0, rnd() * 3, 0], j: 0.1 });
    }
  }

  // =====================================================================
  //  GỘP & ĐƯA VÀO CẢNH
  // =====================================================================
  const meshS = S.mesh(G.mats.vc, { cast: true, receive: true }); scene.add(meshS);
  const meshF = F.mesh(G.mats.vc, { cast: false, receive: true }); scene.add(meshF);
  const meshM = M.mesh(G.mats.metal, { cast: true, receive: true }); scene.add(meshM);
  const meshL = LB.mesh(G.mats.lantern, { cast: false, receive: false }); scene.add(meshL);
  const meshFar = FAR.mesh(G.mats.vc, { cast: false, receive: false }); scene.add(meshFar);
  W.meshes = { S: meshS, F: meshF, M: meshM, L: meshL };

  // =====================================================================
  //  ĐIỂM MỐC DẪN ĐƯỜNG + VỊ TRÍ HOẠT ĐỘNG CHO KHÁCH AI
  // =====================================================================
  const N = (x, z, id) => G.nav.add(x, z, id);
  N(0, 72, 'out3'); N(0, 58, 'out2'); N(0, 44, 'out1'); N(0, 35, 'out0');
  N(0, 31, 'gate'); N(-4.45, 31, 'gateL'); N(4.45, 31, 'gateR');
  N(0, 27.5, 'in0'); N(-5.2, 27.5); N(5.2, 27.5);
  N(-6, 22); N(6, 22); N(-6.5, 15); N(6, 8.5); N(-6.5, 8); N(0, 8.2, 'burnerS'); N(-3.4, 4); N(3.4, 4); N(0, -0.4, 'burnerN'); N(-7, 1); N(7, 1);
  N(-11, 9); N(-11, 17.5); N(-14, 18.0);
  N(-11.2, -3, 'bell'); N(-11.5, 1.8); N(-11.5, -7.5);
  N(11.0, 5.4); N(11.0, -5.0, 'tree'); N(15.5, -0.8); N(15.5, -9.4); N(19.8, -5);
  N(7.0, 12.0, 'pondW'); N(7.0, 20.6); N(11.5, 6.2, 'pondN'); N(18.5, 6.2); N(11.6, 25.6, 'pondS'); N(16.4, 26.0); N(23.0, 12.0); N(23.0, 20.0);
  const hx = (x, z, id) => { const p = G.frame.xf(x, 0, z); N(p.x, p.z, id); }; // chính điện đã dời + phóng 1,2×: nút trước điện / hiên / trong điện đi qua xf
  hx(0, -6.6, 'hallFront'); hx(-6, -6.6); hx(6, -6.6);
  hx(0, -9.8, 'porch'); hx(-3.8, -9.9); hx(3.8, -9.9);
  hx(0, -12.0, 'hallIn'); hx(-2.4, -11.8); hx(2.4, -11.8); hx(-2.4, -15.8); hx(2.4, -15.8); hx(0, -14.6);
  // sân chính điện, hai lối đi bên hông nền điện, dải sau điện, đỉnh và chân hai bậc bên
  N(0, -61.2, 'hallCourt'); N(-7.6, -61.2); N(7.6, -61.2);
  // (nút trong khuôn viên chính điện mới — x ±18,5, z −83,2…−61,8 — do 18-chinh-dien.js dọn rồi thêm lại; hai lối đi bên và bậc góc do 08-world2.js thêm)
  N(-17, 24); N(21.2, 28.6); N(-19, 10); N(19.8, 3.6);

  const ring = (cx, cz, r, angs, toCenter = true) => angs.map((a) => { const x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r; return { x, z, yaw: toCenter ? U.yawTo(x, z, cx, cz) : a }; });
  const look = (x, z, lx, lz) => ({ x, z, yaw: U.yawTo(x, z, lx, lz) });
  G.spots = {
    gateOut: { x: 0, z: 72 }, gate: { x: 0, z: 31 }, gateIn: { x: 0, z: 27.5 },
    incense: ring(0, 4, 2.3, [0.75, -0.75, 1.35, -1.35, 1.95, -1.95, 2.6, -2.6]),
    hallFront: [...[-8.4, -6, -3.6, -1.2, 1.2, 3.6, 6, 8.4].map((x) => ({ x, z: -71.4, yaw: PI })), ...[-7.2, -4.8, -2.4, 0, 2.4, 4.8, 7.2].map((x) => ({ x, z: -72.6, yaw: PI }))], // sân chính điện (v4: sau Tích Thiện Am −57,6 … chân bậc thềm −74); hai hàng đứng sát chân bậc, nhìn về điện
    hallSeats: W.seats,
    tree: [0, 0.9, 1.75, 2.5, -0.9, -1.75, -2.5].map((p) => { const x = 15.5 + Math.cos(p) * 3.3, z = -5 + Math.sin(p) * 3.3; return { x, z, yaw: U.yawTo(x, z, 15.5, -5) }; }),
    pond: [[10.4, 6.6], [14.4, 6.2], [18.8, 6.8], [23.0, 14.0], [23.0, 18.6], [14.6, 26.4], [20.4, 25.6], [9.0, 25.0]].map(([x, z]) => ({ x, z, yaw: U.yawTo(x, z, 15.2, 16.2) })),
    bell: [look(-11.2, -6.4, -15.6, -3), look(-11.4, 0.6, -15.6, -3), look(-13.2, 1.3, -15.6, -3)],
    fortune: [look(-15.3, 16.7, -14.35, 14.2), look(-12.7, 16.7, -14.35, 14.2)],
    photo: [
      { ...look(-8.2, -59.4, 0, -78), subject: { x: 0, z: -78 } }, { ...look(8.2, -59.4, 0, -78), subject: { x: 0, z: -78 } }, // v4: người chụp vẫn đứng cạnh hoa biểu, ngắm về chân bậc thềm (0, −78); người được chụp (cách 7,5 m) đứng giữa sân chính điện ≈ (±5,2; −66,3), điện ba tầng làm nền phía sau (đẩy chỗ chụp lùi theo sân thì ít người dùng hơn: khoảng cách tới cổng xa thêm 8 m → giảm gần 3 lần)
      { ...look(0, -3.5, 0, -17), subject: { x: 0, z: -17 } }, { ...look(-6.2, 6.6, 0, 4), subject: { x: 0, z: 4 } },
      { ...look(10.3, 1.4, 15.5, -5), subject: { x: 15.5, z: -5 } }, { ...look(6.6, 9.6, 15.2, 16.2), subject: { x: 15.2, z: 16.2 } },
      { ...look(-8.6, -0.4, -15.6, -3), subject: { x: -15.6, z: -3 } }, { ...look(-3.5, 25.5, 0, 31), subject: { x: 0, z: 31 } },
    ],
    wander: [[-5, 18], [5, 18], [-4, 9.5], [4.5, 10.5], [-9, 3], [8, 3], [-6, -3], [6, -3], [-3, 24], [3, 24], [-12, 10], [11, 7],
      [-16, 5], [19.8, 3.8], [-18, 22], [14.8, 28.6], [-18.5, -8], [-6, 13], [7, 26], [-13.5, -10.5], [13.5, -10.5]].map(([x, z]) => ({ x, z })),
    bench: W.benchSeats,
  };
  W.places.push({ label: 'Cổng tam quan', desc: 'Lối vào chùa', icon: 'gate', x: 0, z: 27.5 });
  W.places.push({ label: 'Trước chính điện', desc: 'Đứng chắp tay hướng về điện Phật', icon: 'hall', x: 0, z: -69.5 });
  W.lanternMaterial = G.mats.lantern;
}
