// =====================================================================
//  HIỆU ỨNG: khói hương (hạt mờ), quầng sáng đèn lồng lung linh, đom đóm,
//  cánh hoa / lá rơi nhẹ. Tất cả dùng bể hạt cố định, không tạo vật mới mỗi khung.
// =====================================================================
function installFx(G) {
  const { THREE, util: U, scene } = G;
  const fx = (G.fx = {});
  const scaled = []; // vật liệu cần biết cỡ màn hình để tính kích thước hạt
  function pointScale(hPx, fovDeg) { return hPx / (2 * Math.tan((fovDeg * Math.PI) / 360)); }
  function refreshScale(hPx, fov) { const s = pointScale(hPx, fov); for (const m of scaled) m.uniforms.uScale.value = s; }
  const _db = new THREE.Vector2();
  const onResize = () => { G.renderer.getDrawingBufferSize(_db); refreshScale(_db.y, G.camera.fov); };
  G.events.on('resize', onResize);
  G.events.on('snapshot:before', (cam, hPx) => refreshScale(hPx, cam.fov));
  G.events.on('snapshot:after', onResize);

  // ---------- Quầng sáng (cộng màu) ----------
  const glowVS = `attribute float size; attribute float alpha; attribute float phase; attribute vec3 color;
    uniform float uScale, uTime, uIntensity, uFlicker; varying vec3 vC; varying float vA;
    void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0);
      float fl = 1.0 + uFlicker * (sin(uTime * 7.0 + phase) * 0.6 + sin(uTime * 12.7 + phase * 2.3) * 0.4) * 0.14;
      gl_PointSize = min(size * fl * uScale / max(0.1, -mv.z), 900.0);
      vC = color; vA = alpha * uIntensity * fl; gl_Position = projectionMatrix * mv; }`;
  const glowFS = `varying vec3 vC; varying float vA;
    void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = pow(max(1.0 - d, 0.0), 2.4);
      gl_FragColor = vec4(vC * a * vA, 1.0); }`;
  // Tạo một nhóm quầng sáng; set(i, x,y,z, size, r,g,b, alpha); gọi commit() sau khi đổi
  fx.glowPoints = (count, o = {}) => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3), size = new Float32Array(count), alpha = new Float32Array(count), phase = new Float32Array(count), color = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) { phase[i] = Math.random() * 100; pos[i * 3 + 1] = -999; }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('size', new THREE.BufferAttribute(size, 1));
    g.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));
    g.setAttribute('phase', new THREE.BufferAttribute(phase, 1));
    g.setAttribute('color', new THREE.BufferAttribute(color, 3));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 800 }, uTime: { value: 0 }, uIntensity: { value: o.intensity ?? 1 }, uFlicker: { value: o.flicker ?? 0 } },
      vertexShader: glowVS, fragmentShader: glowFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    scaled.push(mat); onResize(); // nhóm tạo muộn (vd. đầu nén hương) cũng nhận đúng tỉ lệ
    const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 3; scene.add(pts);
    const api = {
      points: pts, material: mat, count,
      set(i, x, y, z, s, r, gg, b, a = 1) { pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; size[i] = s; color[i * 3] = r; color[i * 3 + 1] = gg; color[i * 3 + 2] = b; alpha[i] = a; },
      setPos(i, x, y, z) { pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; },
      setAlpha(i, a) { alpha[i] = a; },
      setSize(i, s) { size[i] = s; },
      hide(i) { alpha[i] = 0; pos[i * 3 + 1] = -999; },
      commit() { g.attributes.position.needsUpdate = true; g.attributes.size.needsUpdate = true; g.attributes.alpha.needsUpdate = true; g.attributes.color.needsUpdate = true; },
      dispose() { scene.remove(pts); g.dispose(); mat.dispose(); const k = scaled.indexOf(mat); if (k >= 0) scaled.splice(k, 1); },
    };
    G.onUpdate((dt, t) => { mat.uniforms.uTime.value = t; }, 61);
    return api;
  };
  // quầng sáng tĩnh của đèn lồng (đêm sáng hơn) và nến/tượng (luôn sáng)
  const gl = G.world.glows;
  const nightG = gl.filter((q) => q.night), constG = gl.filter((q) => !q.night);
  const gN = fx.glowPoints(Math.max(1, nightG.length), { flicker: 1 });
  nightG.forEach((q, i) => gN.set(i, q.x, q.y, q.z, q.size, q.r, q.g, q.b, 1)); gN.commit();
  const gC = fx.glowPoints(Math.max(1, constG.length), { flicker: 0.8, intensity: 0.75 });
  constG.forEach((q, i) => gC.set(i, q.x, q.y, q.z, q.size, q.r, q.g, q.b, 1)); gC.commit();
  G.onUpdate(() => { gN.material.uniforms.uIntensity.value = 0.18 + G.tod.night * 0.95; gC.material.uniforms.uIntensity.value = 0.55 + G.tod.night * 0.35; }, 62);

  // ---------- Khói hương: bể 520 hạt ----------
  const SM = 520;
  const sPos = new Float32Array(SM * 3), sSize = new Float32Array(SM), sAlpha = new Float32Array(SM);
  const sVel = new Float32Array(SM * 3), sAge = new Float32Array(SM), sLife = new Float32Array(SM), sGrow = new Float32Array(SM), sA0 = new Float32Array(SM);
  for (let i = 0; i < SM; i++) { sPos[i * 3 + 1] = -999; sLife[i] = 0; }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  sGeo.setAttribute('size', new THREE.BufferAttribute(sSize, 1));
  sGeo.setAttribute('alpha', new THREE.BufferAttribute(sAlpha, 1));
  const sMat = new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 800 }, uColor: { value: new THREE.Color(0xe8e0d6) } },
    vertexShader: `attribute float size; attribute float alpha; uniform float uScale; varying float vA;
      void main(){ vA = alpha; if (alpha < 0.01) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
        vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = min(size * uScale / max(0.1, -mv.z), 240.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; varying float vA;
      void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c) * 2.0; float a = 1.0 - smoothstep(0.2, 1.0, d); gl_FragColor = vec4(uColor, a * a * vA);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false,
  });
  scaled.push(sMat);
  const smokePts = new THREE.Points(sGeo, sMat); smokePts.frustumCulled = false; smokePts.renderOrder = 4; scene.add(smokePts);
  let sNext = 0;
  // phát khói tại (x,y,z); o: { size, life, rise, spread, alpha }
  fx.smoke = (x, y, z, o = {}) => {
    const i = sNext; sNext = (sNext + 1) % SM;
    sPos[i * 3] = x + (Math.random() - 0.5) * (o.spread ?? 0.04); sPos[i * 3 + 1] = y; sPos[i * 3 + 2] = z + (Math.random() - 0.5) * (o.spread ?? 0.04);
    sVel[i * 3] = (Math.random() - 0.5) * 0.08; sVel[i * 3 + 1] = (o.rise ?? 0.45) * (0.8 + Math.random() * 0.4); sVel[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
    sAge[i] = 0; sLife[i] = (o.life ?? 4.2) * (0.8 + Math.random() * 0.4);
    sSize[i] = o.size ?? 0.14; sGrow[i] = o.grow ?? 0.34; sA0[i] = o.alpha ?? 0.32;
  };
  // nguồn khói liên tục (ví dụ đầu nén hương). target: Object3D | Vector3; trả về {remove()}
  const sources = [];
  const _sp = new THREE.Vector3();
  fx.addSmokeSource = (target, o = {}) => {
    const s = { target, rate: o.rate ?? 3, acc: Math.random(), o, alive: true, remove() { this.alive = false; } };
    sources.push(s); return s;
  };
  for (const [x, y, z] of G.world.smokeSpots || []) fx.addSmokeSource(new THREE.Vector3(x, y, z), { rate: 3.5, size: 0.17, grow: 0.3, alpha: 0.18, rise: 0.55, life: 4.6, spread: 0.3 });
  const smokeLit = new THREE.Color(), smokeNight = new THREE.Color(0x8d94b4);
  G.onUpdate((dt, t) => {
    for (let k = sources.length - 1; k >= 0; k--) {
      const s = sources[k]; if (!s.alive) { sources.splice(k, 1); continue; }
      s.acc += dt * s.rate;
      while (s.acc >= 1) {
        s.acc -= 1;
        if (s.target.isObject3D) s.target.getWorldPosition(_sp); else _sp.copy(s.target);
        fx.smoke(_sp.x, _sp.y, _sp.z, s.o);
      }
    }
    const wind = Math.sin(t * 0.21) * 0.06 + 0.05;
    for (let i = 0; i < SM; i++) {
      if (sLife[i] <= 0) continue;
      sAge[i] += dt; const k = sAge[i] / sLife[i];
      if (k >= 1) { sLife[i] = 0; sAlpha[i] = 0; sPos[i * 3 + 1] = -999; continue; }
      const sway = Math.sin(t * 1.3 + i * 0.7) * 0.05;
      sPos[i * 3] += (sVel[i * 3] + wind + sway) * dt; sPos[i * 3 + 1] += sVel[i * 3 + 1] * dt; sPos[i * 3 + 2] += (sVel[i * 3 + 2] + sway * 0.6) * dt;
      sVel[i * 3 + 1] *= 1 - dt * 0.12;
      sSize[i] += sGrow[i] * dt;
      sAlpha[i] = sA0[i] * Math.min(1, k * 6) * (1 - k);
    }
    sGeo.attributes.position.needsUpdate = true; sGeo.attributes.size.needsUpdate = true; sGeo.attributes.alpha.needsUpdate = true;
    smokeLit.copy(G.world.lights.hemi.color).lerp(smokeNight, G.tod.night * 0.6);
    sMat.uniforms.uColor.value.setRGB(0.86, 0.83, 0.8).lerp(smokeLit, 0.35);
  }, 60);

  // ---------- Đom đóm (hiện dần khi trời tối) ----------
  const FF = 70, ffG = fx.glowPoints(FF, { flicker: 0 });
  const areas = G.world.fireflyAreas.length ? G.world.fireflyAreas : [{ x: 0, z: 0, r: 10 }];
  const ff = [];
  for (let i = 0; i < FF; i++) {
    const a = areas[i % areas.length] || { x: 0, z: 0, r: 8 };
    ff.push({ cx: a.x + (Math.random() - 0.5) * a.r * 1.6, cz: a.z + (Math.random() - 0.5) * a.r * 1.6, h: 0.4 + Math.random() * 2.2, p: Math.random() * 100, s: 0.3 + Math.random() * 0.4 });
  }
  // thêm đom đóm rải rác quanh sân và ngoài cổng
  for (let i = 0; i < 18; i++) ff[i].cx = (Math.random() - 0.5) * 40, ff[i].cz = -20 + Math.random() * 70;
  G.onUpdate((dt, t) => {
    const n = G.tod.night;
    for (let i = 0; i < FF; i++) {
      const f = ff[i], tt = t * f.s + f.p;
      const x = f.cx + Math.sin(tt * 0.7) * 1.4 + Math.sin(tt * 1.9) * 0.3, z = f.cz + Math.cos(tt * 0.6) * 1.4, y = f.h + Math.sin(tt * 1.3) * 0.35;
      const blink = Math.max(0, Math.sin(t * (1.1 + f.s) + f.p * 3));
      ffG.set(i, x, y, z, 0.32, 0.75, 1.0, 0.45, n * n * blink * blink);
    }
    ffG.commit();
  }, 63);

  // ---------- Cánh hoa sứ / lá bồ đề rơi nhẹ ----------
  const PN = 80;
  const petalGeo = new THREE.BufferGeometry();
  petalGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.07, 0.045, 0, 0, 0, 0, 0.07, 0, 0, -0.07, 0, 0, 0.07, -0.045, 0, 0], 3));
  petalGeo.computeVertexNormals();
  const petalMat = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });
  const petals = new THREE.InstancedMesh(petalGeo, petalMat, PN); petals.frustumCulled = false; scene.add(petals);
  const srcs = G.world.petalSources.length ? G.world.petalSources : [{ x: 0, y: 3, z: 0, r: 3 }];
  const pc = [new THREE.Color(0xfff3dc), new THREE.Color(0xffe2a0), new THREE.Color(0xf6c0c8), new THREE.Color(0x9cb84e), new THREE.Color(0xd8b84a)];
  const pd = [];
  const resetPetal = (p, first) => {
    const s = U.pick(srcs);
    p.x = s.x + (Math.random() - 0.5) * s.r * 2; p.z = s.z + (Math.random() - 0.5) * s.r * 2; p.y = first ? Math.random() * s.y : s.y + Math.random() * 1.5;
    p.vy = -(0.25 + Math.random() * 0.25); p.rx = Math.random() * 6; p.rz = Math.random() * 6; p.sp = 1 + Math.random() * 2; p.ph = Math.random() * 10;
    p.rest = 0; p.kind = s.kind;
    petals.setColorAt(p.i, s.kind === 'leaf' ? pc[3 + ((Math.random() * 2) | 0)] : pc[(Math.random() * 3) | 0]);
  };
  for (let i = 0; i < PN; i++) { const p = { i }; resetPetal(p, true); pd.push(p); }
  petals.instanceColor.needsUpdate = true;
  const dummy = new THREE.Object3D();
  G.onUpdate((dt, t) => {
    let colorDirty = false;
    for (const p of pd) {
      if (p.rest > 0) { p.rest -= dt; if (p.rest <= 0) { resetPetal(p, false); colorDirty = true; } }
      else {
        p.y += p.vy * dt; p.x += (Math.sin(t * p.sp + p.ph) * 0.35 + 0.12) * dt; p.z += Math.cos(t * p.sp * 0.8 + p.ph) * 0.25 * dt;
        p.rx += dt * p.sp; p.rz += dt * p.sp * 0.7;
        const gy = G.heightAt(p.x, p.z) + 0.02;
        if (p.y <= gy) { p.y = gy; p.rest = 3 + Math.random() * 4; p.rx = 0; p.rz = 0; }
      }
      dummy.position.set(p.x, p.y, p.z); dummy.rotation.set(p.rx, p.ph, p.rz); dummy.scale.setScalar(p.kind === 'leaf' ? 1.3 : 1);
      dummy.updateMatrix(); petals.setMatrixAt(p.i, dummy.matrix);
    }
    petals.instanceMatrix.needsUpdate = true;
    if (colorDirty) petals.instanceColor.needsUpdate = true;
  }, 64);

  onResize();
}
