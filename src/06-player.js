// =====================================================================
//  NHÂN VẬT NGƯỜI CHƠI: chibi mặc áo lam, đi lại, va chạm, các tư thế
//  (chắp tay, lạy, cầm hương, kéo chày chuông, ngồi gõ mõ, lắc ống xăm…)
//  Hình khối chibi được chia sẻ qua G.chibi để khách AI dùng chung kiểu dáng.
// =====================================================================
function installPlayer(G) {
  const { THREE, util: U, scene } = G;
  const V3 = THREE.Vector3, PI = Math.PI;

  // ---------- Hình khối chibi dùng chung (gốc ở chân, mặt quay về +z) ----------
  const L = { hipY: 0.38, neckY: 0.9, shoulderX: 0.2, shoulderY: 0.8, armLen: 0.36, headR: 0.34, headC: 0.3 };
  const lathe = (pts, sg) => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), sg);
  const geos = {
    body: lathe([[0, 0.05], [0.33, 0.05], [0.335, 0.12], [0.3, 0.32], [0.25, 0.52], [0.22, 0.68], [0.19, 0.8], [0.11, 0.88], [0, 0.9]], 12),
    beads: new THREE.TorusGeometry(0.175, 0.03, 5, 14).rotateX(PI / 2 - 0.25).translate(0, 0.79, 0.02),
    head: new THREE.SphereGeometry(L.headR, 16, 12).scale(1, 0.95, 0.96).translate(0, L.headC, 0), // tâm cách cổ 0.3
    hairShort: new THREE.SphereGeometry(0.355, 16, 8, 0, PI * 2, 0, PI * 0.52).rotateX(-0.32).translate(0, L.headC + 0.01, -0.02),
    bun: new THREE.SphereGeometry(0.13, 10, 8).translate(0, L.headC + 0.3, -0.2),
    hat: new THREE.ConeGeometry(0.62, 0.34, 16, 1, true).translate(0, L.headC + 0.36, 0), // nón lá
    face: null,
    arm: new THREE.CylinderGeometry(0.065, 0.078, 0.34, 7).translate(0, -0.17, 0),
    hand: new THREE.SphereGeometry(0.078, 8, 6).translate(0, -L.armLen, 0),
    foot: new THREE.SphereGeometry(0.085, 8, 6).scale(1, 0.6, 1.45),
    sitLegs: new THREE.SphereGeometry(0.3, 12, 8).scale(1.3, 0.34, 0.85).translate(0, 0.1, 0.14),
  };
  // mặt: mắt nhắm hiền, má hồng (tô màu đỉnh)
  {
    const parts = [];
    for (const sx of [-1, 1]) {
      parts.push(U.piece(new THREE.SphereGeometry(0.038, 6, 4), 0x3a2418, { p: [sx * 0.12, L.headC + 0.0, 0.315], s: [1.25, 0.45, 0.5], j: 0 }));
      parts.push(U.piece(new THREE.SphereGeometry(0.05, 6, 4), 0xf09a8a, { p: [sx * 0.19, L.headC - 0.08, 0.28], s: [1.2, 0.7, 0.35], j: 0 }));
    }
    parts.push(U.piece(new THREE.SphereGeometry(0.025, 6, 4), 0xc0604a, { p: [0, L.headC - 0.12, 0.318], s: [1.4, 0.6, 0.5], j: 0 }));
    geos.face = U.merge(parts);
  }
  G.chibi = { geos, layout: L };

  // bóng mờ dưới chân (dùng chung)
  const blobTex = U.canvasTex(64, 64, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 2, w / 2, w / 2, w / 2);
    r.addColorStop(0, 'rgba(0,0,0,0.55)'); r.addColorStop(0.6, 'rgba(0,0,0,0.25)'); r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, w);
  });
  G.assets = {
    blobGeo: new THREE.PlaneGeometry(1, 1).rotateX(-PI / 2),
    blobMat: new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  };

  // ---------- Dựng nhân vật người chơi ----------
  const COL = { robe: 0x86a3c8, robeD: 0x6f8cb3, skin: 0xf3c9a0, hair: 0x2a1d16, beads: 0xb8742a, shoe: 0x4a3426 };
  const mRobe = new THREE.MeshLambertMaterial({ color: COL.robe, flatShading: true });
  const mSkin = new THREE.MeshLambertMaterial({ color: COL.skin });
  const mHair = new THREE.MeshLambertMaterial({ color: COL.hair });
  const mBeads = new THREE.MeshLambertMaterial({ color: COL.beads, flatShading: true });
  const mShoe = new THREE.MeshLambertMaterial({ color: COL.shoe });
  const mFace = new THREE.MeshBasicMaterial({ vertexColors: true });

  const root = new THREE.Group(); root.name = 'player';
  const blob = new THREE.Mesh(G.assets.blobGeo, G.assets.blobMat); blob.scale.set(0.95, 1, 0.95); blob.position.y = 0.02; root.add(blob);
  const inner = new THREE.Group(); root.add(inner);
  const footL = new THREE.Mesh(geos.foot, mShoe), footR = new THREE.Mesh(geos.foot, mShoe);
  footL.position.set(0.11, 0.05, 0.04); footR.position.set(-0.11, 0.05, 0.04); inner.add(footL, footR);
  const sitLegs = new THREE.Mesh(geos.sitLegs, mRobe); sitLegs.visible = false; inner.add(sitLegs);
  const hip = new THREE.Group(); hip.position.y = L.hipY; inner.add(hip);
  const body = new THREE.Mesh(geos.body, mRobe); body.position.y = -L.hipY; hip.add(body);
  const beads = new THREE.Mesh(geos.beads, mBeads); beads.position.y = -L.hipY; hip.add(beads);
  const neck = new THREE.Group(); neck.position.y = L.neckY - L.hipY; hip.add(neck);
  const head = new THREE.Mesh(geos.head, mSkin); neck.add(head);
  const hair = new THREE.Mesh(geos.hairShort, mHair); neck.add(hair);
  const bun = new THREE.Mesh(geos.bun, mHair); bun.scale.setScalar(0.8); neck.add(bun);
  const face = new THREE.Mesh(geos.face, mFace); neck.add(face);
  const mkArm = (sx) => {
    const piv = new THREE.Group(); piv.position.set(sx * L.shoulderX, L.shoulderY - L.hipY, 0);
    const a = new THREE.Mesh(geos.arm, mRobe), h = new THREE.Mesh(geos.hand, mSkin);
    const tip = new THREE.Object3D(); tip.position.set(0, -L.armLen - 0.02, 0.02);
    piv.add(a, h, tip); hip.add(piv); return { piv, tip };
  };
  const armL = mkArm(1), armR = mkArm(-1);
  for (const m of [body, head, hair, bun, footL, footR, sitLegs]) m.castShadow = false;
  const handsMid = new THREE.Object3D(); root.add(handsMid);
  // nhãn tên trên đầu
  const tagCanvas = document.createElement('canvas'); tagCanvas.width = 512; tagCanvas.height = 112;
  const tagTex = new THREE.CanvasTexture(tagCanvas); tagTex.colorSpace = THREE.SRGBColorSpace;
  const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: tagTex, transparent: true, depthWrite: false }));
  tag.scale.set(1.25, 0.27, 1); tag.position.y = 1.95; tag.renderOrder = 5; root.add(tag);
  scene.add(root);

  const start = { x: 0, z: 37 };
  root.position.set(start.x, 0, start.z); root.rotation.y = PI;

  // Tốc độ đi (m/giây) — người chơi chọn trong Bản đồ chùa, lưu trên máy
  const SPEEDS = { cham: 2.0, vua: 2.8, nhanh: 4.0 };
  G.speeds = SPEEDS;
  const maxSpeed = () => SPEEDS[G.save.data.walkSpeed] || SPEEDS.vua;

  const P = (G.player = {
    root, pos: root.position, yaw: PI, vel: new V3(), moving: false, speedK: 0, radius: 0.35,
    locked: false, pose: 'idle', poseT: 0, poseParam: 0, name: '',
    handR: armR.tip, handL: armL.tip, handsMid, handsWorld: new V3(), head: neck,
    colors: COL,
    setPose(name) { if (name !== this.pose) { this.pose = name; this.poseT = 0; } },
    lock(b) { this.locked = !!b; if (b) this.vel.set(0, 0, 0); },
    placeAt(x, z, yaw) { this.pos.x = x; this.pos.z = z; this.pos.y = G.heightAt(x, z); if (yaw != null) this.yaw = yaw; this.vel.set(0, 0, 0); },
    faceTo(yaw, dur = 0.35) { const y0 = this.yaw, d = U.angleDiff(y0, yaw); return G.tween(dur, (k) => { this.yaw = y0 + d * k; }, G.ease.inOut); },
    tap() { tapT = 0; },
    setName(n) { this.name = n; drawTag(n); },
    walkTo(x, z) { this.stopWalk(); return new Promise((res) => { walk = { q: G.nav.path(this.pos.x, this.pos.z, x, z), res, goal: { x, z }, lastD: 1e9, stuck: 0 }; }); },
    stopWalk() { if (walk) { const w = walk; walk = null; w.res(false); } },
    get walking() { return !!walk; },
  });
  let walk = null, tapT = 9, phase = 0, lastStepSign = 1;

  function drawTag(n) {
    const g = tagCanvas.getContext('2d'), w = tagCanvas.width, h = tagCanvas.height;
    g.clearRect(0, 0, w, h);
    g.font = '700 54px system-ui, "Segoe UI", Roboto, Arial, sans-serif';
    const tw = Math.min(w - 20, g.measureText(n).width + 56), x0 = (w - tw) / 2;
    g.fillStyle = 'rgba(42,24,14,0.78)'; g.strokeStyle = 'rgba(247,215,147,0.85)'; g.lineWidth = 4;
    const r = 40; g.beginPath(); g.moveTo(x0 + r, 8); g.arcTo(x0 + tw, 8, x0 + tw, h - 8, r); g.arcTo(x0 + tw, h - 8, x0, h - 8, r); g.arcTo(x0, h - 8, x0, 8, r); g.arcTo(x0, 8, x0 + tw, 8, r); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#f7d793'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(n, w / 2, h / 2 + 2, w - 60);
    tagTex.needsUpdate = true;
  }
  drawTag('');

  // ---------- Tư thế ----------
  const A = { lx: 0.05, lz: 0.34, rx: 0.05, rz: -0.34, hip: 0, head: 0, sit: 0 };
  const Tg = { ...A };
  const set = (lx, lz, rx, rz, hipv = 0, headv = 0, sit = 0) => { Tg.lx = lx; Tg.lz = lz; Tg.rx = rx; Tg.rz = rz; Tg.hip = hipv; Tg.head = headv; Tg.sit = sit; };
  function poseTargets(t) {
    const prm = P.poseParam;
    switch (P.pose) {
      case 'pray': set(-1.15, -0.5, -1.15, 0.5, 0.06, 0.16); break;
      case 'bow': { const b = 0.5 - 0.5 * Math.cos((t * PI * 2) / 2.6); set(-1.15, -0.5, -1.15, 0.5, 0.08 + b * 0.42, 0.18 + b * 0.15); break; }
      case 'incense': { const b = prm > 0 ? 0.5 - 0.5 * Math.cos((t * PI * 2) / 2.4) : 0; set(-1.55, -0.42, -1.55, 0.42, 0.05 + b * 0.3, 0.1 + b * 0.12); break; }
      case 'offer': set(-1.35, -0.25, -1.35, 0.25, 0.25, 0.3); break; // đưa tay ra phía trước (cắm hương, đặt đồ)
      case 'strike': set(-1.75 + prm * 0.55, -0.16, -1.75 + prm * 0.55, 0.16, -0.14 * prm, -0.05); break;
      case 'sit': set(-0.55, -0.32, -0.55, 0.32, 0.02, 0.1, 1); break;
      case 'sitPray': set(-1.15, -0.5, -1.15, 0.5, 0.04, 0.16, 1); break;
      case 'sitMo': set(-1.1, -0.42, -1.2, 0.18, 0.04, 0.12, 1); break;
      case 'shake': set(-0.95 + Math.sin(t * 30) * 0.13 * prm, -0.46, -0.95 + Math.sin(t * 30) * 0.13 * prm, 0.46, 0.04 + prm * 0.04, 0.12); break;
      case 'write': set(-0.75, -0.34, -0.85, 0.3, 0.08, 0.3); break;
      case 'release': set(-0.75, -0.25, -0.75, 0.25, 0.5, 0.25); break;
      case 'wave': set(0.05, 0.34, -2.6 + Math.sin(t * 9) * 0.25, 0.25, 0, 0); break;
      default: set(0.05 + Math.sin(t * 1.6) * 0.03, 0.34, 0.05 + Math.sin(t * 1.6) * 0.03, -0.34, 0, Math.sin(t * 0.7) * 0.03);
    }
  }

  // ---------- Cập nhật mỗi khung ----------
  const _hl = new V3(), _hr = new V3();
  G.onUpdate((dt, time) => {
    P.poseT += dt;
    // 1) di chuyển
    let tx = 0, tz = 0, spd = 0;
    const mv = G.input.moveVector();
    if (!P.locked && mv.mag > 0.01 && G.started) {
      if (walk) P.stopWalk();
      tx = mv.x; tz = mv.z; spd = maxSpeed() * mv.mag;
    } else if (walk) {
      const wp = walk.q[0];
      if (!wp) { const w = walk; walk = null; w.res(true); }
      else {
        const dx = wp.x - P.pos.x, dz = wp.z - P.pos.z, d = Math.hypot(dx, dz), last = walk.q.length === 1;
        if (d < (last ? 0.12 : 0.45)) { walk.q.shift(); walk.stuck = 0; }
        else {
          tx = dx / d; tz = dz / d; spd = Math.min(maxSpeed() * 0.9, d * 4 + 0.6);
          if (d > walk.lastD - 0.004) walk.stuck += dt; else walk.stuck = Math.max(0, walk.stuck - dt);
          walk.lastD = d;
          if (walk.stuck > 1.1) {
            walk.q.shift(); walk.stuck = 0; walk.lastD = 1e9;
            if (!walk.q.length) { const w = walk; walk = null; w.res(Math.hypot(w.goal.x - P.pos.x, w.goal.z - P.pos.z) < 1.4); }
          }
        }
      }
    }
    const acc = spd > 0 ? 12 : 14;
    P.vel.x = U.damp(P.vel.x, tx * spd, acc, dt); P.vel.z = U.damp(P.vel.z, tz * spd, acc, dt);
    const sp = Math.hypot(P.vel.x, P.vel.z);
    if (sp > 0.01) { P.pos.x += P.vel.x * dt; P.pos.z += P.vel.z * dt; G.collide.resolve(P.pos, P.radius); }
    P.moving = sp > 0.25; P.speedK = U.clamp(sp / maxSpeed(), 0, 1);
    if (P.moving) P.yaw = U.angleDamp(P.yaw, Math.atan2(P.vel.x, P.vel.z), 12, dt);
    if (!P.locked || walk) P.pos.y = U.damp(P.pos.y, G.heightAt(P.pos.x, P.pos.z), 14, dt);
    root.rotation.y = P.yaw;

    // 2) hoạt ảnh tư thế
    poseTargets(P.poseT);
    const walking = P.moving && (P.pose === 'idle' || P.locked);
    if (walking) {
      phase += sp * dt * 2.6;
      const s = Math.sin(phase);
      Tg.lx = s * 0.6; Tg.rx = -s * 0.6; Tg.lz = 0.3; Tg.rz = -0.3;
      if (Math.sign(s) !== lastStepSign) { lastStepSign = Math.sign(s); G.events.emit('footstep', P.pos); }
    }
    const k = 12;
    for (const key in A) A[key] = U.damp(A[key], Tg[key], key === 'sit' ? 6 : k, dt);
    if (tapT < 0.26) { tapT += dt; const p = tapT / 0.26; const o = p < 0.22 ? p / 0.22 : 1 - (p - 0.22) / 0.78; A.rx = Tg.rx + 0.62 * o; }
    armL.piv.rotation.set(A.lx, 0, A.lz); armR.piv.rotation.set(A.rx, 0, A.rz);
    hip.rotation.x = A.hip; neck.rotation.x = A.head;
    const bob = walking ? Math.abs(Math.sin(phase)) * 0.045 : Math.sin(time * 1.6) * 0.006;
    inner.position.y = bob - A.sit * 0.34;
    const fs = walking ? Math.sin(phase) : 0;
    footL.position.z = 0.04 + fs * 0.1; footR.position.z = 0.04 - fs * 0.1;
    footL.position.y = 0.05 + Math.max(0, fs) * 0.05; footR.position.y = 0.05 + Math.max(0, -fs) * 0.05;
    footL.visible = footR.visible = A.sit < 0.5; sitLegs.visible = A.sit > 0.15;
    sitLegs.scale.setScalar(Math.max(0.01, A.sit));
    blob.visible = true;
    tag.visible = !G.activity.current; // ẩn tên khi đang làm hoạt động cho khỏi che cảnh
    // điểm giữa hai bàn tay (để gắn nén hương, ống xăm…)
    root.updateMatrixWorld(true);
    armL.tip.getWorldPosition(_hl); armR.tip.getWorldPosition(_hr);
    P.handsWorld.copy(_hl).add(_hr).multiplyScalar(0.5);
    handsMid.position.copy(P.handsWorld); root.worldToLocal(handsMid.position);
  }, 10);
}
