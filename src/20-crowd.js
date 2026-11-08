// =====================================================================
//  KHÁCH HÀNH HƯƠNG AI: đám đông chibi vẽ bằng InstancedMesh (mỗi bộ phận một lần vẽ),
//  tự đi lại, thắp hương, chắp tay, ngồi tụng kinh, chụp ảnh, theo cờ hướng dẫn viên.
//  Mọi ma trận được ghép bằng các biến tạm dùng lại — không cấp phát mới mỗi khung.
// =====================================================================
function installCrowd(G) {
  const { THREE, util: U } = G;
  const V3 = THREE.Vector3, PI = Math.PI, TAU = PI * 2;
  const rand = U.rand, randInt = U.randInt, clamp = U.clamp, pick = U.pick;
  const geos = G.chibi.geos, LY = G.chibi.layout, S = G.spots, scene = G.scene;
  const HIP = LY.hipY, NECK = LY.neckY, SHX = LY.shoulderX, SHY = LY.shoulderY;

  // ---------- Hằng số ----------
  const POOL = 60, FLAGS = 4, FLASHES = 6;
  const M_WAIT = 0, M_WALK = 1, M_ACT = 2, M_GROUP = 3;
  const SEP = 0.8, SEP2 = SEP * SEP, PLR = 1.8, PLR2 = PLR * PLR;
  const BASE_TARGET = 34, LOW_TARGET = 32, MIN_STAY = 26, MAX_LEAVING = 9;
  // Người ngồi trong chính điện ("hall sitters"): thêm NGOÀI BASE_TARGET; chế độ ngồi: tụng kinh / thiền / lần chuỗi
  const SM_TUNG = 1, SM_THIEN = 2, SM_LAN = 3;
  const SIT_N = 14, SIT_LOW = 10, SIT_KEEP = 8, SIT_LEAD = 60, SIT_MIN = 180, SIT_MAX = 480; // SIT_KEEP: luôn chừa ≥ 8 ô trống cho đoàn khách
  // "Nêm" trước máy quay gõ mõ: khi gõ mõ, máy quay đứng cách người chơi ~12,4 m và nhìn lên ban thờ; bất kỳ khách nào (đứng hay ngồi)
  // trong 14 m đầu của khung hình đều thành cái đầu to bị cắt ở đáy khung → thu nhỏ dần về 0 (hệ số vis) khi 0 < d < WEDGE_D và |bên| < k·d + WEDGE_PAD
  // (d, bên: toạ độ ngang so với trục máy quay → hướng nhìn; k = min(WEDGE_K, 1,15 · tan(fov/2) · tỉ lệ khung) — máy tính 0,62, màn dọc hẹp hơn).
  // Nêm được "chốt" tới khi máy quay trả về chỗ cũ (G.cam.blend ≈ 0) để khách không mọc lại trong lúc máy còn thấp; hết gõ mõ mọi người hiện lại.
  const WEDGE_D = 14, WEDGE_K = 0.62, WEDGE_PAD = 0.7, VIS_RATE = 5; // VIS_RATE: tốc độ ẩn / hiện (đơn vị vis trên giây, 5 → 0,2 giây)

  // ---------- Biến tạm dùng lại (không cấp phát trong vòng lặp) ----------
  const _pv = new V3(), _pv2 = new V3(), _sv = new V3(), _one = new V3(1, 1, 1), _zeroV = new V3();
  const _tipL = new V3(), _tipR = new V3();
  const _q = new THREE.Quaternion(), _qI = new THREE.Quaternion(), _e = new THREE.Euler();
  const _rootM = new THREE.Matrix4(), _hipM = new THREE.Matrix4(), _neckM = new THREE.Matrix4(), _bodyM = new THREE.Matrix4();
  const _armM = new THREE.Matrix4(), _loc = new THREE.Matrix4(), _tmp = new THREE.Matrix4();
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  const _col = new THREE.Color(), WHITE = new THREE.Color(1, 1, 1);
  const _sc = {}; // kết quả worldToScreen dùng lại
  let wOn = false, wLatch = false, wCx = 0, wCz = 0, wFx = 0, wFz = 1, wK = WEDGE_K; // nêm trước máy quay gõ mõ (cập nhật mỗi khung trong update, chỉ khi đang gõ mõ)

  // =====================================================================
  //  VẬT LIỆU & CÁC LỚP InstancedMesh (mỗi bộ phận cơ thể một lớp)
  // =====================================================================
  const mats = {
    robe: new THREE.MeshLambertMaterial({ flatShading: true }),
    skin: new THREE.MeshLambertMaterial(),
    hair: new THREE.MeshLambertMaterial(),
    beads: new THREE.MeshLambertMaterial({ color: 0xb8742a, flatShading: true }),
    hat: new THREE.MeshLambertMaterial({ flatShading: true, side: THREE.DoubleSide }),
    face: new THREE.MeshBasicMaterial({ vertexColors: true }),
    shoe: new THREE.MeshLambertMaterial(),
    phone: new THREE.MeshLambertMaterial({ vertexColors: true }),
    stick: new THREE.MeshLambertMaterial({ color: 0x8a5a32 }),
    flag: new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }),
    shadow: G.assets.blobMat.clone(), // bản sao riêng (dùng chung ảnh bóng) để không đổi chương trình đổ bóng với nhân vật người chơi
  };
  const ownGeos = []; // hình tự tạo (cần giải phóng khi gỡ)
  const boxG = new THREE.BoxGeometry(1, 1, 1);
  const phoneGeo = U.merge([
    U.piece(boxG, 0x262a33, { s: [0.11, 0.19, 0.022], j: 0 }),
    U.piece(boxG, 0x7d9ac0, { p: [0, 0, -0.0125], s: [0.092, 0.168, 0.004], j: 0 }),
  ]);
  boxG.dispose();
  const stickGeo = new THREE.CylinderGeometry(0.018, 0.024, 2.4, 5).translate(0, 1.2, 0);
  const flagGeo = new THREE.BufferGeometry();
  flagGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.62, -0.1, 0, 0, -0.36, 0], 3));
  flagGeo.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  ownGeos.push(phoneGeo, stickGeo, flagGeo);

  const meshes = []; // mọi lớp, để gỡ bỏ
  function mk(geo, mat, cap, colored) {
    const m = new THREE.InstancedMesh(geo, mat, cap);
    m.frustumCulled = false; m.castShadow = false; m.receiveShadow = false;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < cap; i++) m.setMatrixAt(i, ZERO);
    if (colored) { for (let i = 0; i < cap; i++) m.setColorAt(i, WHITE); m.instanceColor.setUsage(THREE.DynamicDrawUsage); }
    m.count = 0;
    scene.add(m); meshes.push(m);
    return m;
  }
  const mShadow = mk(G.assets.blobGeo, mats.shadow, POOL, false); mShadow.renderOrder = 1;
  const mBody = mk(geos.body, mats.robe, POOL, true);
  const mBeads = mk(geos.beads, mats.beads, POOL, false);
  const mHead = mk(geos.head, mats.skin, POOL, true);
  const mHair = mk(geos.hairShort, mats.hair, POOL, true);
  const mBun = mk(geos.bun, mats.hair, POOL, true);
  const mHat = mk(geos.hat, mats.hat, POOL, true);
  const mFace = mk(geos.face, mats.face, POOL, false);
  const mArms = mk(geos.arm, mats.robe, POOL * 2, true);
  const mHands = mk(geos.hand, mats.skin, POOL * 2, true);
  const mFeet = mk(geos.foot, mats.shoe, POOL * 2, true);
  const mLegs = mk(geos.sitLegs, mats.robe, POOL, true);
  const mPhone = mk(phoneGeo, mats.phone, POOL, false);
  const mStick = mk(stickGeo, mats.stick, FLAGS, false);
  const mFlag = mk(flagGeo, mats.flag, FLAGS, true);
  const perPilgrim = [[mShadow, 1], [mBody, 1], [mBeads, 1], [mHead, 1], [mHair, 1], [mBun, 1], [mHat, 1], [mFace, 1],
    [mArms, 2], [mHands, 2], [mFeet, 2], [mLegs, 1], [mPhone, 1]];
  let colDirty = true;

  // Quầng sáng đèn chụp ảnh: một bể dùng chung
  const flashPts = G.fx && G.fx.glowPoints ? G.fx.glowPoints(FLASHES, { flicker: 0, intensity: 1 }) : null;
  const flashAge = new Float32Array(FLASHES).fill(9), flashPos = new Float32Array(FLASHES * 3);
  let flashN = 0, flashLive = false;
  const FLASH_LIFE = 0.3;
  function flashAt(x, y, z) {
    if (!flashPts) return;
    const dx = G.camera.position.x - x, dz = G.camera.position.z - z;
    if (dx * dx + dz * dz > 1600) return; // quá xa: không cần
    const i = flashN; flashN = (flashN + 1) % FLASHES;
    flashAge[i] = 0; flashPos[i * 3] = x; flashPos[i * 3 + 1] = y; flashPos[i * 3 + 2] = z;
  }
  function updateFlashes(dt) {
    if (!flashPts) return;
    let live = false;
    const nt = G.tod ? G.tod.night : 0;
    for (let i = 0; i < FLASHES; i++) {
      if (flashAge[i] >= FLASH_LIFE) { if (flashAge[i] < 9) { flashPts.hide(i); flashAge[i] = 9; live = true; } continue; }
      flashAge[i] += dt; live = true;
      const k = clamp(flashAge[i] / FLASH_LIFE, 0, 1), fade = (1 - k) * (1 - k);
      flashPts.set(i, flashPos[i * 3], flashPos[i * 3 + 1], flashPos[i * 3 + 2], 0.8 + k * 0.5, 1, 0.96, 0.86, fade * (0.45 + 0.4 * nt));
    }
    if (live || flashLive) flashPts.commit();
    flashLive = live;
  }

  // =====================================================================
  //  HÌNH DÁNG NGẪU NHIÊN: dáng người, màu áo, tóc, da, phụ kiện
  // =====================================================================
  const ROBE = {
    lam: [0x86a3c8, 0x7893bb, 0x6f8cb3, 0x93acd0, 0x5f7ca6],
    grey: [0x9a9a96, 0xb4b0a8, 0x7d7f84, 0xa8a49a],
    brown: [0x8a6a4a, 0x7a5a3a, 0x9a7a54, 0x6f5238],
    white: [0xf1efe6, 0xe8e6dc],
    cream: [0xe9dcbc, 0xe2d2a8],
    color: [0xe07a5f, 0xe0b040, 0x4fa3a0, 0xe8a0b0, 0x7fb069, 0x9a7ab8, 0xd9674f, 0x5b8fd0],
  };
  const HAIR_DARK = [0x1c1512, 0x2a1d16, 0x3a281c, 0x4a3426];
  const HAIR_GREY = [0x9a9a98, 0xc8c6c0, 0x6a6460, 0xe0ded8];
  const SKIN = [0xf3c9a0, 0xf0c297, 0xe8b88a, 0xdca978, 0xc99468, 0xf6d3ae, 0xe3b08a];
  const HAT = [0xe6d49a, 0xd9c27e, 0xf0e2b4, 0xcdb878];
  const SHOE = [0x2e2622, 0x5a4030, 0x8a8a88, 0x3b3f4a];
  const FLAGC = [0xd8322a, 0xf0b02a, 0x3a7cc4, 0x4f9a5a, 0xd05fa0, 0xff8a2a];

  function setC(mesh, idx, hex, mul) {
    _col.setHex(hex); if (mul !== 1) _col.multiplyScalar(mul);
    mesh.setColorAt(idx, _col);
  }
  function pickRobe(kind, tourist) {
    const r = Math.random();
    let arr;
    if (kind === 1) arr = r < 0.7 ? ROBE.color : r < 0.85 ? ROBE.white : ROBE.lam;
    else if (tourist) arr = r < 0.45 ? ROBE.color : r < 0.7 ? ROBE.lam : r < 0.82 ? ROBE.white : r < 0.92 ? ROBE.cream : ROBE.grey;
    else arr = r < 0.4 ? ROBE.lam : r < 0.54 ? ROBE.grey : r < 0.68 ? ROBE.brown : r < 0.8 ? ROBE.white : r < 0.88 ? ROBE.cream : ROBE.color;
    return arr[(Math.random() * arr.length) | 0];
  }
  // kind: 0 người lớn, 1 trẻ em, 2 người lớn tuổi
  function dress(p, kind, tourist) {
    const sl = p.slot;
    p.kind = kind;
    if (kind === 1) { p.scale = rand(0.68, 0.76); p.spd = rand(1.15, 1.5); p.stride = rand(5.4, 6.2); p.bobAmp = 0.075; p.swing = 0.85; p.hunch = 0; p.headS = 1.07; }
    else if (kind === 2) { p.scale = rand(0.92, 0.97); p.spd = rand(0.9, 1.02); p.stride = rand(3.4, 3.9); p.bobAmp = 0.03; p.swing = 0.38; p.hunch = rand(0.14, 0.24); p.headS = 1; }
    else { p.scale = rand(0.96, 1.06); p.spd = rand(1.05, 1.4); p.stride = rand(4.0, 4.5); p.bobAmp = 0.045; p.swing = 0.6; p.hunch = rand(0, 0.04); p.headS = 1; }
    p.baseSpd = p.spd;
    p.hat = Math.random() < (kind === 2 ? 0.45 : kind === 1 ? 0.06 : 0.22);
    p.bun = !p.hat && Math.random() < (kind === 2 ? 0.5 : kind === 1 ? 0.18 : 0.38);
    p.beads = kind !== 1 && Math.random() < (kind === 2 ? 0.6 : 0.28);
    const j = rand(0.93, 1.07), robe = pickRobe(kind, tourist);
    setC(mBody, sl, robe, j); setC(mLegs, sl, robe, j); setC(mArms, sl * 2, robe, j); setC(mArms, sl * 2 + 1, robe, j);
    const skin = pick(SKIN), sk = kind === 2 ? 0.95 : 1;
    setC(mHead, sl, skin, sk); setC(mHands, sl * 2, skin, sk); setC(mHands, sl * 2 + 1, skin, sk);
    const hair = kind === 2 && Math.random() < 0.78 ? pick(HAIR_GREY) : pick(HAIR_DARK);
    setC(mHair, sl, hair, 1); setC(mBun, sl, hair, 1);
    setC(mHat, sl, pick(HAT), rand(0.95, 1.05));
    const shoe = pick(SHOE); setC(mFeet, sl * 2, shoe, 1); setC(mFeet, sl * 2 + 1, shoe, 1);
    colDirty = true;
  }

  // =====================================================================
  //  BỂ KHÁCH: mỗi người là một đối tượng dựng sẵn (không tạo thêm khi chạy)
  // =====================================================================
  function makePilgrim(i) {
    const p = {
      slot: i, active: false, state: 'idle',
      pos: new V3(), bv: new V3(), yaw: 0, vx: 0, vz: 0, ox: 0, oz: 0, gy: 0, seatTop: 0, speedNow: 0,
      kind: 0, scale: 1, spd: 1.1, baseSpd: 1.1, stride: 4.2, bobAmp: 0.045, swing: 0.6, hunch: 0, headS: 1, bubbleY: 1.9,
      hat: false, bun: false, beads: false, flagSlot: -1,
      mode: M_WAIT, act: 'idle', lastKind: '', linger: false, at: 0, dur: 1, delay: 0, snap: false,
      spotKind: '', spotIdx: -1, gx: 0, gz: 0, gyaw: 0, hasYaw: false, benchSpot: null,
      path: null, pi: 0, pathReq: false, stuckT: 0, stuckN: 0, sx: 0, sz: 0, repaths: 0, fails: 0,
      born: 0, leave: false, grp: null, isGuide: false, row: 0, col: 0, gphi: 0, gr: 1.5,
      partner: null, partnerOf: null, phoneUp: false, cyc: 0, shotAt: 0, shotDone: true, flashReq: false, waveT: 0,
      bows: 2, bp: 3, bowEvery: 7, bowOff: 0, lookT: 4, shakeT: 4, gestEvery: 7, idleStyle: 0, seatStyle: 0, puffN: 0,
      phase: 0, ph: 0, walkAmt: 0, bob: 0,
      a: { la: 0.05, lz: 0.34, ra: 0.05, rz: -0.34, hip: 0, head: 0, hyaw: 0, roll: 0, sit: 0, phone: 0 },
      nextSpeak: 0, bub: null, getBV: null, sitter: false, sitMode: 0, vis: 1,
    };
    p.getBV = () => p.bv;
    return p;
  }
  const pool = [];
  for (let i = 0; i < POOL; i++) pool.push(makePilgrim(i));
  const act = [];             // khách đang hoạt động (danh sách công khai G.crowd.list)
  const sitList = [];         // người ngồi chính điện đang có mặt (cả người đang đi tới chỗ ngồi); cũng nằm trong act
  const groups = [];          // các đoàn đang đi
  const flagOwner = new Array(FLAGS).fill(null);
  let hi = -1;                // ô cao nhất đang dùng (để giới hạn số bản vẽ)
  let leavingN = 0;           // số người đã được hẹn ra về

  function resetState(p) {
    p.state = 'idle'; p.vx = p.vz = 0; p.ox = p.oz = 0; p.speedNow = 0; p.seatTop = 0;
    p.flagSlot = -1; p.mode = M_WAIT; p.act = 'idle'; p.lastKind = ''; p.linger = false; p.at = 0; p.dur = 1; p.delay = 0; p.snap = false;
    p.spotKind = ''; p.spotIdx = -1; p.hasYaw = false; p.benchSpot = null;
    p.path = null; p.pi = 0; p.pathReq = false; p.stuckT = 0; p.stuckN = 0; p.repaths = 0; p.fails = 0;
    p.leave = false; p.grp = null; p.isGuide = false; p.partner = null; p.partnerOf = null;
    p.phoneUp = false; p.cyc = 0; p.shotDone = true; p.flashReq = false; p.waveT = rand(2, 5);
    p.bowOff = rand(0, 6); p.gestEvery = rand(6, 9); p.idleStyle = randInt(0, 2); p.seatStyle = Math.random() < 0.6 ? 1 : 0; p.puffN = 0;
    p.phase = rand(0, TAU); p.ph = rand(0, TAU); p.walkAmt = 0; p.bob = 0;
    p.nextSpeak = 0; p.bub = null; p.sitter = false; p.sitMode = 0; p.vis = 1;
    const a = p.a; a.la = a.ra = 0.05; a.lz = 0.34; a.rz = -0.34; a.hip = a.head = a.hyaw = a.roll = a.sit = a.phone = 0;
  }
  function allocPilgrim() { for (let i = 0; i < POOL; i++) if (!pool[i].active) return pool[i]; return null; }
  function recomputeHi() { hi = -1; for (let i = 0; i < act.length; i++) if (act[i].slot > hi) hi = act[i].slot; }
  function activate(p, kind, tourist, x, z, yaw) {
    p.active = true;
    resetState(p);
    dress(p, kind, tourist);
    p.pos.set(x, G.heightAt(x, z), z); p.gy = p.pos.y; p.yaw = yaw;
    p.born = G.time;
    act.push(p); if (p.slot > hi) hi = p.slot;
    return p;
  }
  function hideSlot(sl) {
    for (let k = 0; k < perPilgrim.length; k++) {
      const m = perPilgrim[k][0], per = perPilgrim[k][1];
      for (let j = 0; j < per; j++) m.setMatrixAt(sl * per + j, ZERO);
    }
  }
  function despawn(p) {
    if (!p.active) return;
    releaseSpot(p); endPair(p); releaseFlag(p);
    if (p.sitter) dropSitter(p);
    if (p.leave) { p.leave = false; leavingN--; }
    if (p.bub && p.bub.target === p.getBV) p.bub.until = 0; // tắt bong bóng đang gắn vào người này
    p.bub = null;
    if (p.grp) { const g = p.grp; p.grp = null; const i = g.members.indexOf(p); if (i >= 0) g.members.splice(i, 1); if (g.guide === p) g.guide = null; }
    hideSlot(p.slot);
    p.active = false;
    const i = act.indexOf(p);
    if (i >= 0) { act[i] = act[act.length - 1]; act.pop(); }
    recomputeHi();
  }
  function takeFlag(p) {
    for (let i = 0; i < FLAGS; i++) if (!flagOwner[i]) {
      flagOwner[i] = p; p.flagSlot = i; setC(mFlag, i, pick(FLAGC), 1); colDirty = true; return true;
    }
    return false;
  }
  function releaseFlag(p) {
    if (p.flagSlot < 0) return;
    flagOwner[p.flagSlot] = null;
    mStick.setMatrixAt(p.flagSlot, ZERO); mFlag.setMatrixAt(p.flagSlot, ZERO);
    p.flagSlot = -1;
  }

  // =====================================================================
  //  ĐIỂM ĐẾN: đặt chỗ để hai người không bao giờ dùng chung một chỗ
  // =====================================================================
  const KINDS = {
    incense: S.incense || [], pray: S.hallFront || [], sit: S.hallSeats || [], photo: S.photo || [], tree: S.tree || [],
    pond: S.pond || [], bell: S.bell || [], fortune: S.fortune || [], bench: S.bench || [], wander: S.wander || [],
  };
  const ACT_OF = { incense: 'incense', pray: 'pray', sit: 'sit', photo: 'photo', tree: 'tree', pond: 'pond', bell: 'bell', fortune: 'fortune', bench: 'bench', wander: 'idle' };
  const ORDER = ['incense', 'pray', 'sit', 'photo', 'tree', 'pond', 'bell', 'fortune', 'bench', 'wander'];
  const WEIGHTS = [
    [14, 16, 12, 9, 9, 8, 6, 5, 5, 10],   // người lớn
    [6, 7, 3, 4, 8, 15, 6, 2, 2, 18],     // trẻ em
    [16, 18, 18, 4, 12, 6, 7, 5, 10, 6],  // người lớn tuổi
  ];
  const taken = {};
  for (const k in KINDS) taken[k] = new Array(KINDS[k].length).fill(null);
  const HELD = { held: true }; // dấu "người chơi đang giữ chỗ" trong taken.sit (chỉ một chỗ một lúc, xem G.crowd.seats)
  const _w = new Array(ORDER.length).fill(0);

  function farFromPlayer(s) {
    const P = G.player.pos, dx = s.x - P.x, dz = s.z - P.z;
    return dx * dx + dz * dz > 2.25 && !(wOn && inWedge(s.x, s.z)); // bỏ qua chỗ cách người chơi dưới 1,5 m; đang gõ mõ thì cũng bỏ chỗ nằm trong nêm trước máy quay (coi như đã có người)
  }
  // Chọn ngẫu nhiên một chỗ trống; nếu có người p thì bốc tối đa 3 chỗ và lấy chỗ gần nhất (đỡ đi xa)
  function pickSpot(kind, p) {
    const list = KINDS[kind], tk = taken[kind];
    let n = 0, shared = false;
    for (let i = 0; i < list.length; i++) if (!tk[i] && farFromPlayer(list[i])) n++;
    if (n === 0) {
      if (kind !== 'wander') return -1;
      shared = true; // điểm đi dạo có thể dùng chung khi hết chỗ
      for (let i = 0; i < list.length; i++) if (farFromPlayer(list[i])) n++;
      if (n === 0) return -1;
    }
    let bestI = -1, bestD = 1e9;
    const tries = p ? Math.min(3, n) : 1;
    for (let t = 0; t < tries; t++) {
      let r = (Math.random() * n) | 0;
      for (let i = 0; i < list.length; i++) {
        if ((!shared && tk[i]) || !farFromPlayer(list[i]) || r-- !== 0) continue;
        const d = p ? (list[i].x - p.pos.x) * (list[i].x - p.pos.x) + (list[i].z - p.pos.z) * (list[i].z - p.pos.z) : 0;
        if (d < bestD) { bestD = d; bestI = i; }
        break;
      }
    }
    return bestI;
  }
  // khoảng cách tới chỗ trống gần nhất của một loại hoạt động (−1 nếu hết chỗ)
  function nearestFree(kind, p) {
    const list = KINDS[kind], tk = taken[kind], shared = kind === 'wander';
    let best = -1;
    for (let i = 0; i < list.length; i++) {
      if ((!shared && tk[i]) || !farFromPlayer(list[i])) continue;
      const dx = list[i].x - p.pos.x, dz = list[i].z - p.pos.z, d = Math.sqrt(dx * dx + dz * dz);
      if (best < 0 || d < best) best = d;
    }
    return best;
  }
  function reserve(p, kind, idx) {
    releaseSpot(p);
    taken[kind][idx] = p; p.spotKind = kind; p.spotIdx = idx;
    const s = KINDS[kind][idx];
    p.seatTop = kind === 'sit' ? (s.y || 0.6) + 0.14 : kind === 'bench' ? (s.y || 0.42) + 0.07 : 0;
    if (kind === 'bench') p.benchSpot = s;
  }
  function releaseSpot(p) {
    if (p.spotIdx >= 0 && p.spotKind) {
      const tk = taken[p.spotKind];
      if (tk[p.spotIdx] === p) tk[p.spotIdx] = null;
    }
    p.spotIdx = -1; p.spotKind = '';
  }

  // =====================================================================
  //  DẪN ĐƯỜNG: xếp hàng yêu cầu đường đi, mỗi khung phục vụ tối đa 2 người
  // =====================================================================
  function travelTo(p, x, z, yaw) {
    p.gx = x; p.gz = z; p.hasYaw = yaw !== undefined && yaw !== null; p.gyaw = p.hasYaw ? yaw : 0;
    p.mode = M_WALK; p.path = null; p.pi = 0; p.pathReq = true;
    p.stuckT = 0; p.stuckN = 0; p.sx = p.pos.x; p.sz = p.pos.z; p.repaths = 0;
    p.snap = false;
  }
  let pathCursor = 0;
  function servePaths() {
    let budget = 2;
    const n = act.length;
    for (let k = 0; k < n && budget > 0; k++) {
      const p = act[(pathCursor + k) % n];
      if (!p.pathReq || p.mode !== M_WALK) continue;
      p.pathReq = false; budget--;
      let path = null;
      try { path = G.nav.path(p.pos.x, p.pos.z, p.gx, p.gz); } catch (err) { path = null; }
      if (!path || !path.length) path = [{ x: p.gx, z: p.gz }];
      p.path = path; p.pi = 0;
    }
    if (n) pathCursor = (pathCursor + 1) % n;
  }

  // =====================================================================
  //  CHỌN HOẠT ĐỘNG KẾ TIẾP & RA VỀ
  // =====================================================================
  let lowQ = false, entered = false, nextTrickle = 12, nextGroup = Infinity;
  function effTarget(time) {
    let t = lowQ ? LOW_TARGET : BASE_TARGET;
    if (entered && nextGroup - time < 40) t -= 6; // sắp có đoàn: bớt người cũ để khỏi quá đông
    return t;
  }
  function staying() { return act.length - leavingN - sitList.length; } // người ngồi chính điện nằm NGOÀI chỉ tiêu BASE_TARGET
  function markLeave(p) { if (!p.leave) { p.leave = true; leavingN++; } }

  function next(p) {
    if (!p.active) return;
    if (!p.leave && staying() > MIN_STAY) {
      const pl = clamp((G.time - p.born - 120) / 300, 0, 0.6); // ở càng lâu càng dễ ra về
      if (Math.random() < pl) markLeave(p);
    }
    if (p.leave) { beginLeave(p); return; }
    if (!p.linger && p.lastKind !== 'wander' && p.lastKind !== 'pose' && Math.random() < 0.4) { // đứng nán lại trò chuyện một lúc rồi mới đi tiếp
      p.linger = true; p.act = 'idle'; arrive(p); p.dur = rand(3, 8);
      return;
    }
    p.linger = false;
    chooseActivity(p);
  }
  function chooseActivity(p) {
    const wt = WEIGHTS[p.kind] || WEIGHTS[0];
    let tot = 0;
    for (let k = 0; k < ORDER.length; k++) {
      let w = wt[k];
      const d = nearestFree(ORDER[k], p);
      const dk = k === 2 ? 60 : k === 1 ? 42 : 10; // 'sit'/'pray' ở chính điện (cuối sân, ~115–145 m từ cổng; v3: 50/35): giảm nhẹ theo khoảng cách để điện có người lễ, ngồi
      w = d < 0 ? 0 : w / (1 + (d / dk) * (d / dk)); // việc ở gần được ưu tiên hơn việc ở xa
      if (ORDER[k] === p.lastKind) w *= 0.15;
      _w[k] = w; tot += w;
    }
    for (let tries = 0; tries < 6 && tot > 0; tries++) {
      let r = Math.random() * tot, k = 0;
      for (; k < ORDER.length - 1; k++) { r -= _w[k]; if (r <= 0) break; }
      const kind = ORDER[k], idx = pickSpot(kind, p);
      if (idx >= 0) { startSpotActivity(p, kind, idx); return; }
      tot -= _w[k]; _w[k] = 0; // hết chỗ loại này
    }
    p.mode = M_WAIT; p.act = 'idle'; p.delay = rand(1.5, 3); // không còn chỗ nào: đứng nghỉ chốc lát
  }
  function startSpotActivity(p, kind, idx) {
    reserve(p, kind, idx);
    const s = KINDS[kind][idx];
    p.act = ACT_OF[kind];
    travelTo(p, s.x, s.z, s.yaw);
    if (kind === 'photo' && Math.random() < 0.4) tryPair(p, s);
  }
  function beginLeave(p) {
    releaseSpot(p); endPair(p);
    p.act = 'leave';
    const o = S.gateOut;
    travelTo(p, o.x + rand(-1.2, 1.2), o.z, null);
  }
  function orderLeave(p) {
    if (p.leave || p.grp || p.isGuide) return;
    markLeave(p);
    if (p.mode === M_ACT) p.dur = Math.min(p.dur, p.at + rand(0.6, 2.4));
    else if (p.mode === M_WALK && p.act !== 'leave') beginLeave(p);
    else if (p.mode === M_WAIT) p.delay = Math.min(p.delay, rand(0.2, 1.5));
  }
  function oldestStaying(time) {
    let best = null;
    for (let i = 0; i < act.length; i++) {
      const p = act[i];
      if (p.leave || p.grp || p.isGuide || p.sitter || time - p.born < 40) continue;
      if (!best || p.born < best.born) best = p;
    }
    return best;
  }
  // người ra về: biến mất khi đã đi xa khuất tầm nhìn
  function leaveCheck(p) {
    const c = G.camera.position, dx = c.x - p.pos.x, dy = c.y - p.pos.y, dz = c.z - p.pos.z, d2 = dx * dx + dy * dy + dz * dz;
    const out = p.pos.z > 36; // đã ra khỏi cổng tam quan
    if (d2 > (out ? 1156 : 3600)) { despawn(p); return; }
    if (d2 > (out ? 225 : 900)) { _pv.set(p.pos.x, p.pos.y + 1, p.pos.z); G.ui.worldToScreen(_pv, _sc); if (!_sc.visible) despawn(p); }
  }

  // =====================================================================
  //  CHỤP ẢNH THEO CẶP: một người chụp, người kia đứng ở "cảnh" và vẫy tay
  // =====================================================================
  const POSE_T = [7.5, 6, 4.8, 3.8], _pp = { x: 0, z: 0 };
  function findPosePoint(spot) {
    const sj = spot.subject;
    if (!sj) return false;
    const dx = sj.x - spot.x, dz = sj.z - spot.z, dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 4.5) return false;
    const ux = dx / dist, uz = dz / dist;
    for (let k = 0; k < POSE_T.length; k++) {
      const t = POSE_T[k];
      if (t > dist - 1.5) continue;
      const x = spot.x + ux * t, z = spot.z + uz * t;
      if (!G.collide.hit(x, z, 0.5)) { _pp.x = x; _pp.z = z; return true; }
    }
    return false;
  }
  function tryPair(a, spot) {
    if (!findPosePoint(spot)) return;
    let best = null, bd = 1e9;
    for (let i = 0; i < act.length; i++) {
      const b = act[i];
      if (b === a || b.leave || b.grp || b.isGuide || b.partner || b.partnerOf || b.act !== 'idle' || b.a.sit > 0.3) continue;
      if (b.mode !== M_WALK && b.mode !== M_ACT) continue;
      const dx = b.pos.x - _pp.x, dz = b.pos.z - _pp.z, d = dx * dx + dz * dz;
      if (d < bd && d < 1225) { bd = d; best = b; }
    }
    if (!best) return;
    releaseSpot(best);
    best.act = 'pose'; best.partnerOf = a; a.partner = best;
    travelTo(best, _pp.x, _pp.z, U.yawTo(_pp.x, _pp.z, spot.x, spot.z));
  }
  function endPair(p) {
    const b = p.partner;
    if (b) {
      p.partner = null;
      if (b.active && b.partnerOf === p) {
        b.partnerOf = null;
        if (b.act === 'pose') { if (b.mode === M_ACT) b.dur = Math.min(b.dur, b.at); else b.act = 'idle'; }
      }
    }
    const a = p.partnerOf;
    if (a) { p.partnerOf = null; if (a.active && a.partner === p) a.partner = null; }
  }

  // =====================================================================
  //  ĐẾN NƠI & BẮT ĐẦU HOẠT ĐỘNG; KẾT THÚC & CHUYỂN VIỆC
  // =====================================================================
  function arriveWalk(p) {
    p.path = null;
    if (p.act === 'leave') { despawn(p); return; }
    if (p.isGuide && p.grp) { guideArrived(p); return; }
    arrive(p);
  }
  function arrive(p) {
    p.mode = M_ACT; p.at = 0; p.puffN = 0; p.vx = p.vz = 0; p.snap = true; p.stuckN = 0;
    switch (p.act) {
      case 'incense': p.bows = randInt(2, 3); p.bp = rand(2.4, 3.2); p.dur = 3.2 + p.bows * p.bp + 0.5; break;
      case 'pray': p.dur = rand(6, 14); p.bowEvery = rand(5.5, 8); break;
      case 'sit': // ngồi tụng trong chính điện lâu hơn: điện 160 chỗ trông có người; người ngồi thường trực (sitter) 3–8 phút
        p.dur = p.sitter ? rand(SIT_MIN, SIT_MAX) : rand(40, 110);
        if (p.sitter) p.nextSpeak = Math.max(p.nextSpeak, G.time + rand(3, 14));
        break;
      case 'photo': p.dur = rand(10, 22); p.phoneUp = false; p.cyc = rand(0.4, 1.4); p.shotDone = true; break;
      case 'tree': p.lookT = rand(3, 5); p.dur = p.lookT + rand(5, 9); break;
      case 'pond': p.dur = rand(10, 20); break;
      case 'bell': p.dur = rand(9, 18); break;
      case 'fortune': p.shakeT = rand(3.5, 5.5); p.dur = p.shakeT + rand(4, 7); break;
      case 'bench': p.dur = rand(20, 45); break;
      case 'pose': p.dur = 120; p.waveT = rand(0.5, 2.5); break;
      default: p.act = 'idle'; p.dur = rand(1.5, 5); p.snap = false; break;
    }
  }
  function guideArrived(p) {
    const g = p.grp;
    g.state = 1; g.t = 0;
    p.mode = M_ACT; p.act = 'guide'; p.at = 0; p.dur = 1e9; p.snap = false; p.vx = p.vz = 0;
    p.hasYaw = true; p.gyaw = 0; p.waveT = rand(0.5, 2);
  }
  function finishActivity(p) {
    if (!p.linger) p.lastKind = p.spotKind || (p.act === 'idle' ? 'wander' : p.act);
    endPair(p);
    releaseSpot(p);
    if (p.sitter) { dropSitter(p); markLeave(p); } // hết buổi ngồi: đứng dậy, ra về (người thay thế sẽ tới ngồi)
    if (p.a.sit > 0.4) { p.mode = M_WAIT; p.act = 'idle'; p.delay = 0.9; return; } // đứng dậy rồi mới đi
    next(p);
  }
  function puff(p) {
    const B = G.world && G.world.burner;
    if (!B || !G.fx || !G.fx.smoke) return;
    const dx = p.pos.x - B.x, dz = p.pos.z - B.z, d = Math.sqrt(dx * dx + dz * dz) || 1;
    G.fx.smoke(B.x + (dx / d) * 0.4 + rand(-0.15, 0.15), B.sandY + 0.3, B.z + (dz / d) * 0.4 + rand(-0.15, 0.15),
      { size: 0.16, grow: 0.4, life: 3.6, rise: 0.5, alpha: 0.3, spread: 0.12 });
  }
  function photoThink(p, dt) {
    if (p.partner && (!p.partner.active || p.partner.partnerOf !== p)) p.partner = null;
    p.cyc -= dt;
    if (p.phoneUp && !p.shotDone && p.cyc <= p.shotAt) { p.shotDone = true; p.flashReq = Math.random() < 0.8; }
    if (p.cyc <= 0) {
      if (p.phoneUp) { p.phoneUp = false; p.cyc = rand(1.3, 2.6); }
      else { p.phoneUp = true; p.cyc = rand(2.8, 4.4); p.shotAt = p.cyc - rand(1.2, 2.2); p.shotDone = false; }
    }
  }
  function stepAct(p, dt, time) {
    p.speedNow = 0; p.vx = p.vz = 0;
    if (p.snap) {
      const dx = p.gx - p.pos.x, dz = p.gz - p.pos.z;
      if (dx * dx + dz * dz < 1.4) { p.pos.x += dx * fSnap; p.pos.z += dz * fSnap; }
    }
    if (p.hasYaw) {
      let ty = p.gyaw;
      if (p.act === 'photo') ty += Math.sin(time * 0.4 + p.ph) * 0.1;
      p.yaw = U.angleDamp(p.yaw, ty, 5, dt);
    }
    p.at += dt;
    switch (p.act) {
      case 'incense':
        if (p.puffN < 3 && p.at >= 1.7 + p.puffN * 0.55) { p.puffN++; puff(p); }
        break;
      case 'photo': photoThink(p, dt); break;
      case 'pose': case 'guide':
        p.waveT -= dt; if (p.waveT < -2.4) p.waveT = rand(3, 6);
        break;
    }
    if (p.at >= p.dur) finishActivity(p);
  }

  // =====================================================================
  //  DI CHUYỂN: đi theo điểm dẫn đường, tránh nhau, nhường người chơi, va chạm
  // =====================================================================
  let fV = 0.1, fP = 0.15, fS = 0.1, fPh = 0.15, fW = 0.12, fG = 0.15, fSnap = 0.08, fOff = 0.08;
  function moveToward(p, ux, uz, sp, dt) {
    const px = p.pos.x, pz = p.pos.z;
    let dvx = ux * sp, dvz = uz * sp, sx = 0, sz = 0;
    for (let i = 0; i < act.length; i++) { // tránh nhau (n ≤ 60, lọc sớm theo khoảng cách)
      const q = act[i];
      if (q === p) continue;
      const ex = px - q.pos.x, ez = pz - q.pos.z;
      if (ex > SEP || ex < -SEP || ez > SEP || ez < -SEP) continue;
      const r2 = ex * ex + ez * ez;
      if (r2 >= SEP2) continue;
      if (r2 < 1e-6) { sx += p.slot > q.slot ? 1 : -1; sz += 0.5; continue; }
      const r = Math.sqrt(r2), f = (SEP - r) / SEP, nx = ex / r, nz = ez / r;
      sx += nx * f; sz += nz * f;
      if (-(nx * ux + nz * uz) > 0.5) { sx += -uz * f * 0.7; sz += ux * f * 0.7; } // người đối diện: lách sang bên phải
    }
    const P = G.player.pos, qx = px - P.x, qz = pz - P.z, q2 = qx * qx + qz * qz;
    if (q2 < PLR2) { // nhường và lách quanh người chơi
      const r = Math.sqrt(q2) + 1e-4, f = (PLR - r) / PLR, nx = qx / r, nz = qz / r;
      dvx += nx * f * 2.2; dvz += nz * f * 2.2;
      const tx = -nz, tz = nx, sg = tx * ux + tz * uz >= 0 ? 1 : -1;
      dvx += tx * sg * f * 1.6; dvz += tz * sg * f * 1.6;
    }
    dvx += sx * 1.5; dvz += sz * 1.5;
    p.vx += (dvx - p.vx) * fV; p.vz += (dvz - p.vz) * fV;
    let v2 = p.vx * p.vx + p.vz * p.vz;
    const lim = p.spd * 1.25;
    if (v2 > lim * lim) { const k = lim / Math.sqrt(v2); p.vx *= k; p.vz *= k; v2 = lim * lim; }
    p.speedNow = Math.sqrt(v2);
    p.pos.x += p.vx * dt; p.pos.z += p.vz * dt;
    let skip = false;
    if (p.benchSpot) { // ghế đá có vòng va chạm: đừng đẩy người đang lại gần / rời ghế
      const bx = p.pos.x - p.benchSpot.x, bz = p.pos.z - p.benchSpot.z;
      if (bx * bx + bz * bz < 2.56) skip = true; else p.benchSpot = null;
    }
    if (!skip) G.collide.resolve(p.pos, 0.3);
    const rx = p.pos.x - P.x, rz = p.pos.z - P.z, r2 = rx * rx + rz * rz; // không bao giờ chen vào người chơi
    if (r2 < 0.2916 && r2 > 1e-8) { const k = 0.54 / Math.sqrt(r2); p.pos.x = P.x + rx * k; p.pos.z = P.z + rz * k; }
    if (p.speedNow > 0.25) p.yaw = U.angleDamp(p.yaw, Math.atan2(p.vx, p.vz), 8, dt);
  }
  function onStuck(p, last, d) {
    if (last && d < 1.0) { arriveWalk(p); return; }
    if (p.repaths < 2) { p.repaths++; p.pathReq = true; p.path = null; return; }
    p.fails++;
    if (p.isGuide && p.grp) { // hướng dẫn viên kẹt: thử lại, quá lâu thì coi như đã tới điểm tập hợp
      if (p.fails >= 3) guideArrived(p); else { p.repaths = 0; p.pathReq = true; p.path = null; }
      return;
    }
    const c = G.camera.position, dx = c.x - p.pos.x, dz = c.z - p.pos.z, far = dx * dx + dz * dz > 625;
    if (p.act === 'leave') {
      if (far) { despawn(p); return; }
      p.repaths = 0; p.pathReq = true; p.path = null; return;
    }
    if (p.fails >= 3 && far) { p.pos.x = p.gx; p.pos.z = p.gz; p.fails = 0; p.repaths = 0; p.pathReq = true; p.path = null; return; }
    if (p.sitter) { // người ngồi chính điện kẹt đường: giữ nguyên chỗ, thử đường khác; quá 5 lần thì bỏ ý định ngồi, ra về
      if (p.fails < 5) { p.repaths = 0; p.pathReq = true; p.path = null; return; }
      releaseSpot(p); dropSitter(p); markLeave(p); beginLeave(p); return;
    }
    // đổi mục tiêu khác
    releaseSpot(p); endPair(p);
    if (p.fails >= 2) { p.mode = M_WAIT; p.act = 'idle'; p.delay = 1.2; } else chooseActivity(p);
  }
  function stepWalk(p, dt) {
    if (p.pathReq || !p.path) { p.speedNow = 0; p.vx = p.vz = 0; return; }
    const path = p.path;
    let wp = path[p.pi];
    if (!wp) { arriveWalk(p); return; }
    let dx = wp.x - p.pos.x, dz = wp.z - p.pos.z, d = Math.sqrt(dx * dx + dz * dz);
    let last = p.pi >= path.length - 1;
    if (d < (last ? 0.2 : 0.5)) {
      if (last) { arriveWalk(p); return; }
      p.pi++; wp = path[p.pi]; last = p.pi >= path.length - 1;
      dx = wp.x - p.pos.x; dz = wp.z - p.pos.z; d = Math.sqrt(dx * dx + dz * dz);
    }
    const inv = d > 1e-4 ? 1 / d : 0;
    let sp = p.spd;
    if (last) sp = Math.min(sp, 0.35 + d * 1.5);
    moveToward(p, dx * inv, dz * inv, sp, dt);
    if (p.act === 'leave') leaveCheck(p);
    if (!p.active) return;
    p.stuckT += dt; // kẹt: gần như không nhích trong 2 giây → tìm đường lại / đổi mục tiêu
    if (p.stuckT >= 1) {
      p.stuckT = 0;
      const mx = p.pos.x - p.sx, mz = p.pos.z - p.sz; p.sx = p.pos.x; p.sz = p.pos.z;
      if (mx * mx + mz * mz < 0.04) p.stuckN++; else p.stuckN = 0;
      if (p.stuckN >= 2) { p.stuckN = 0; onStuck(p, last, d); }
    }
  }
  function stepGroup(p, dt) {
    const g = p.grp;
    if (!g) { p.mode = M_WAIT; p.delay = 0.4; return; }
    const gd = g.guide;
    if (!gd || !gd.active) { disperseGroup(g); return; }
    let tx, tz, sp;
    if (g.state === 0) { // đang đi: giữ đội hình sau hướng dẫn viên
      const sn = Math.sin(gd.yaw), cs = Math.cos(gd.yaw), back = 1.5 + p.row * 1.0, side = (p.col - 1.5) * 0.95;
      tx = gd.pos.x + cs * side - sn * back; tz = gd.pos.z - sn * side - cs * back;
    } else { tx = g.cx + Math.sin(p.gphi) * p.gr; tz = g.cz + Math.cos(p.gphi) * p.gr; }
    const dx = tx - p.pos.x, dz = tz - p.pos.z, d = Math.sqrt(dx * dx + dz * dz);
    sp = g.state === 0 ? clamp(gd.spd * (0.8 + d * 0.3), 0.5, 1.6) : Math.min(p.spd, 0.3 + d * 1.4);
    if (d < 0.15) sp = 0;
    const inv = d > 1e-4 ? 1 / d : 0;
    moveToward(p, dx * inv, dz * inv, sp, dt);
    if (p.speedNow < 0.25) p.yaw = U.angleDamp(p.yaw, U.yawTo(p.pos.x, p.pos.z, gd.pos.x, gd.pos.z), 4, dt);
    p.stuckT += dt;
    if (p.stuckT >= 1.5) {
      p.stuckT = 0;
      const mx = p.pos.x - p.sx, mz = p.pos.z - p.sz; p.sx = p.pos.x; p.sz = p.pos.z;
      if (mx * mx + mz * mz < 0.04 && d > 1.4) p.stuckN++; else p.stuckN = 0;
      if (p.stuckN >= 3) { // kẹt lâu: nhấc về chỗ của mình nếu đang ở xa tầm nhìn
        p.stuckN = 0;
        const c = G.camera.position, cx = c.x - p.pos.x, cz = c.z - p.pos.z;
        if (cx * cx + cz * cz > 400) { p.pos.x = tx; p.pos.z = tz; }
      }
    }
  }

  // =====================================================================
  //  ĐOÀN KHÁCH: hướng dẫn viên cầm cờ dẫn đầu, mọi người đi theo hàng sau cổng tam quan
  // =====================================================================
  function spawnGroup(n) {
    n = Math.min(clamp(Math.round(n) || 12, 2, 24), POOL - act.length);
    if (n < 2) return null;
    const o = S.gateOut, gi = S.gateIn;
    const g = { guide: null, members: [], state: 0, t: 0, wait: rand(4, 6.5), announced: false, n, cx: gi.x, cz: gi.z - 3 };
    const gd = allocPilgrim();
    if (!gd) return null;
    activate(gd, 0, true, o.x, o.z, PI);
    gd.isGuide = true; gd.grp = g; gd.spd = rand(1.1, 1.25); gd.act = 'walk';
    takeFlag(gd);
    g.guide = gd;
    travelTo(gd, g.cx, g.cz, 0);
    groups.push(g);
    for (let i = 1; i < n; i++) {
      const m = allocPilgrim();
      if (!m) break;
      const idx = i - 1, r = Math.random();
      const x = o.x + ((idx & 3) - 1.5) * 0.9 + rand(-0.12, 0.12), z = o.z + 0.8 + (idx >> 2) * 0.65;
      activate(m, r < 0.62 ? 0 : r < 0.78 ? 1 : 2, true, x, z, PI);
      m.grp = g; m.mode = M_GROUP; m.act = 'walk'; m.row = idx >> 2; m.col = idx & 3;
      m.spd = Math.max(m.spd, gd.spd * 1.03); // cả đoàn đi kịp bước của hướng dẫn viên
      m.gphi = ((idx % 7) - 3) * 0.36; m.gr = 1.5 + Math.floor(idx / 7) * 1.05;
      m.sx = m.pos.x; m.sz = m.pos.z;
      g.members.push(m);
    }
    g.n = g.members.length + 1;
    return g;
  }
  function disperseGroup(g) {
    g.state = 2;
    for (let i = 0; i < g.members.length; i++) {
      const m = g.members[i];
      if (m.active && m.grp === g) { m.grp = null; m.spd = m.baseSpd; m.mode = M_WAIT; m.act = 'idle'; m.delay = rand(0.3, 7); }
    }
    g.members.length = 0;
    const gd = g.guide;
    if (gd && gd.active) { gd.grp = null; gd.isGuide = false; gd.spd = gd.baseSpd; releaseFlag(gd); gd.mode = M_WAIT; gd.act = 'idle'; gd.delay = rand(6, 10); }
    g.guide = null;
    const i = groups.indexOf(g); if (i >= 0) groups.splice(i, 1);
  }
  function updateGroups(dt) {
    for (let i = groups.length - 1; i >= 0; i--) {
      const g = groups[i], gd = g.guide;
      if (!gd || !gd.active) { disperseGroup(g); continue; }
      if (!g.announced && gd.pos.z < 38) {
        g.announced = true;
        G.stats.add(g.n);
        G.ui.toast('Một đoàn khách hành hương vừa đến cổng tam quan', 3600);
      }
      if (g.state === 1) { g.t += dt; if (g.t >= g.wait) disperseGroup(g); }
    }
  }
  function spawnSingle() {
    const p = allocPilgrim();
    if (!p) return null;
    const r = Math.random(), o = S.gateOut;
    activate(p, r < 0.62 ? 0 : r < 0.78 ? 1 : 2, false, o.x + rand(-1.5, 1.5), o.z + rand(0, 1.5), PI);
    chooseActivity(p);
    return p;
  }

  // =====================================================================
  //  TƯ THẾ & HOẠT ẢNH: đích tư thế theo hoạt động, làm mượt dần
  // =====================================================================
  const T = { la: 0, lz: 0, ra: 0, rz: 0, hip: 0, head: 0, hyaw: 0, roll: 0, sit: 0, phone: 0 };
  const arms = (la, lz, ra, rz) => { T.la = la; T.lz = lz; T.ra = ra; T.rz = rz; };
  const armsPray = () => arms(-1.15, -0.5, -1.15, 0.5);
  const bowCurve = (x) => 0.5 - 0.5 * Math.cos(x * TAU);

  function poseFor(p, time) {
    const t = p.at, ph = p.ph;
    const w = Math.sin(time * 1.6 + ph) * 0.03;
    arms(0.05 + w, 0.34, 0.05 + w, -0.34);
    T.hip = 0; T.head = Math.sin(time * 0.7 + ph) * 0.03; T.hyaw = 0; T.roll = 0; T.sit = 0; T.phone = 0;
    const walking = (p.mode === M_WALK || p.mode === M_GROUP) && p.speedNow > 0.3;
    if (walking) { // đi bộ: tay vung ngược chân
      const s = Math.sin(p.phase) * p.swing * p.walkAmt * clamp(p.speedNow, 0.5, 1.2);
      arms(s, 0.3, -s, -0.3);
      if (p.kind === 1) T.roll = Math.sin(p.phase) * 0.05 * p.walkAmt;
      if (p.kind === 2) T.head = 0.05;
      T.hyaw = Math.sin(time * 0.5 + ph) * 0.18;
    } else {
      switch (p.mode === M_ACT ? p.act : 'idle') { // chưa tới nơi thì chỉ đứng nghỉ, không làm dở tư thế cũ
        case 'incense':
          if (t < 1.3) { arms(-1.55, -0.42, -1.55, 0.42); T.hip = 0.05; T.head = 0.1; } // nâng hương lên trán
          else if (t < 3.2) { arms(-1.35, -0.25, -1.35, 0.25); T.hip = 0.25; T.head = 0.3; } // đưa tay cắm hương
          else {
            armsPray();
            const x = (t - 3.2) / p.bp, b = x < p.bows ? bowCurve(x - Math.floor(x)) : 0;
            T.hip = 0.06 + b * 0.45; T.head = 0.16 + b * 0.15;
          }
          break;
        case 'pray': {
          armsPray();
          const c = (t + p.bowOff) % p.bowEvery, b = c < 3 ? bowCurve(c / 3) : 0;
          T.hip = 0.06 + b * 0.42; T.head = 0.16 + b * 0.15;
          break;
        }
        case 'sit':
          T.sit = 1;
          if (p.sitMode >= SM_THIEN) { // ngồi thiền / lần chuỗi: tay đặt trong lòng, đầu hơi cúi, đứng yên hoàn toàn — chỉ nhịp thở chậm (hông ±0,012 ở 0,25 Hz), không xoay đầu
            arms(-0.55, -0.32, -0.55, 0.32); T.hip = 0.02 + Math.sin(time * 1.5708 + ph) * 0.012; T.head = 0.2; T.hyaw = 0;
            if (p.sitMode === SM_LAN) { T.ra = -1.0 + Math.sin(time * TAU + ph) * 0.05; T.rz = 0.42; } // lần chuỗi: tay phải nâng nhẹ, nhích đều 1 Hz
          }
          else if (p.seatStyle === 0 && p.sitMode !== SM_TUNG) { arms(-0.55, -0.32, -0.55, 0.32); T.hip = 0.02; T.head = 0.1; T.hyaw = Math.sin(time * 0.3 + ph) * 0.2; }
          else {
            armsPray();
            const c = (t + p.bowOff * 3) % 22, b = c < 3.4 ? bowCurve(c / 3.4) : 0;
            T.hip = 0.04 + Math.sin(time * 0.9 + ph) * 0.035 + b * 0.4; T.head = 0.16 + b * 0.12; // lắc lư nhẹ khi tụng
          }
          break;
        case 'bench':
          T.sit = 1; arms(-0.55, -0.32, -0.55, 0.32); T.hip = 0.02; T.head = 0.06; T.hyaw = Math.sin(time * 0.35 + ph) * 0.4;
          break;
        case 'photo':
          T.phone = 1; T.hyaw = Math.sin(time * 0.4 + ph) * 0.08;
          if (p.phoneUp) { arms(-2.1, -0.38, -2.1, 0.38); T.head = -0.04; }
          else { arms(-1.3, -0.36, -1.3, 0.36); T.head = 0.3; T.hip = 0.05; } // hạ máy xem ảnh
          break;
        case 'pose':
          if (p.waveT < 0) { T.ra = -2.6 + Math.sin(time * 9) * 0.25; T.rz = 0.25; }
          T.head = 0.02;
          break;
        case 'tree':
          if (t < p.lookT) { const k = Math.min(1, t / 0.9); T.head = -0.75 * k; T.hip = -0.04 * k; T.hyaw = Math.sin(time * 0.7 + ph) * 0.15; } // ngước nhìn tán bồ đề
          else {
            armsPray();
            const c = (t - p.lookT + p.bowOff) % 7, b = c < 3 ? bowCurve(c / 3) : 0;
            T.hip = 0.06 + b * 0.35; T.head = 0.16 + b * 0.12;
          }
          break;
        case 'pond':
          T.head = 0.14; T.hip = 0.05; T.hyaw = Math.sin(time * 0.5 + ph) * 0.25;
          if (t > 3 && (t + p.bowOff) % p.gestEvery > p.gestEvery - 1.7) { T.ra = -1.25; T.rz = -0.12; } // chỉ cho nhau xem cá
          break;
        case 'bell':
          T.head = -0.3 - 0.1 * Math.sin(time * 0.6 + ph);
          if (t > p.dur - 3.6) { armsPray(); T.hip = 0.08; T.head = 0.14; }
          break;
        case 'fortune':
          if (t < p.shakeT) { // lắc ống xăm
            const prm = U.smoothstep(0, 0.8, t) * (1 - U.smoothstep(p.shakeT - 0.6, p.shakeT, t)), sw = Math.sin(time * 28) * 0.13 * prm;
            arms(-0.95 + sw, -0.46, -0.95 + sw, 0.46); T.hip = 0.04 + prm * 0.04; T.head = 0.12;
          } else { armsPray(); T.hip = 0.1; T.head = 0.2; }
          break;
        case 'guide':
          if (p.waveT < 0) { T.la = -2.5 + Math.sin(time * 6) * 0.25; T.lz = 0.3; } // vẫy tay mời đoàn
          T.hyaw = Math.sin(time * 0.5 + ph) * 0.3;
          break;
        default: // đứng nghỉ, nhìn quanh
          T.hyaw = Math.sin(time * 0.6 + ph) * 0.45;
          if (p.idleStyle === 1) T.head = -0.3 + Math.sin(time * 0.4 + ph) * 0.05; // ngước nhìn mái chùa
      }
    }
    if (p.flagSlot >= 0) { T.ra = -1.3; T.rz = -0.3; } // tay phải cầm cán cờ
  }
  function snapPose(p) {
    poseFor(p, G.time);
    const a = p.a;
    a.la = T.la; a.lz = T.lz; a.ra = T.ra; a.rz = T.rz; a.hip = T.hip; a.head = T.head; a.hyaw = T.hyaw; a.roll = T.roll; a.sit = T.sit; a.phone = T.phone;
  }
  function anim(p, dt, time) {
    const a = p.a, moving = (p.mode === M_WALK || p.mode === M_GROUP) && p.speedNow > 0.3;
    p.walkAmt += ((moving ? 1 : 0) - p.walkAmt) * fW;
    if (moving) p.phase += p.speedNow * dt * p.stride;
    p.bob = p.walkAmt * Math.abs(Math.sin(p.phase)) * p.bobAmp + Math.sin(time * 1.6 + p.ph) * 0.006 * (1 - p.walkAmt);
    if (p.sitMode >= SM_THIEN) p.bob = 0; // thiền: không nhấp nhô
    poseFor(p, time);
    a.la += (T.la - a.la) * fP; a.lz += (T.lz - a.lz) * fP; a.ra += (T.ra - a.ra) * fP; a.rz += (T.rz - a.rz) * fP;
    a.hip += (T.hip - a.hip) * fP; a.head += (T.head - a.head) * fP; a.hyaw += (T.hyaw - a.hyaw) * fP; a.roll += (T.roll - a.roll) * fP;
    a.sit += (T.sit - a.sit) * fS; a.phone += (T.phone - a.phone) * fPh;
    // nhường chỗ: người đang đứng/ngồi nhích nhẹ sang bên khi người chơi bước tới sát
    let tx = 0, tz = 0;
    if (p.mode !== M_WALK && p.mode !== M_GROUP && a.sit < 0.5) {
      const P = G.player.pos, ex = p.pos.x - P.x, ez = p.pos.z - P.z, e2 = ex * ex + ez * ez;
      if (e2 < 1) {
        const d = Math.sqrt(e2) + 1e-3, push = Math.min(0.55, 1 - d);
        tx = (ex / d) * push; tz = (ez / d) * push;
      }
    }
    p.ox += (tx - p.ox) * fOff; p.oz += (tz - p.oz) * fOff;
  }

  // =====================================================================
  //  NÊM TRƯỚC MÁY QUAY GÕ MÕ: khách đứng / đi trong nêm thu nhỏ dần về 0 (hệ số vis), ra khỏi nêm hoặc hết gõ mõ thì lớn lại
  // =====================================================================
  function wedgeBegin() { // gọi một lần mỗi khung: đang gõ mõ thì dựng nêm từ máy quay thật (vị trí + hướng nhìn nằm ngang), không thì tắt
    wOn = false;
    const A = G.activity, cam = G.camera;
    if (!A || !cam) return;
    if (A.current === 'mo') wLatch = true; // chốt: G.activity.end() xoá current rồi mới G.cam.release() 0,9 s — giữ nêm tới khi máy quay về hẳn
    else if (A.current || !(G.cam && G.cam.blend > 0.05)) wLatch = false;
    if (!wLatch) return;
    _pv.set(0, 0, -1).applyQuaternion(cam.quaternion);
    const h = Math.sqrt(_pv.x * _pv.x + _pv.z * _pv.z);
    if (h < 0.2) return; // máy gần như nhìn thẳng xuống / lên: không có trục ngang
    wFx = _pv.x / h; wFz = _pv.z / h; wCx = cam.position.x; wCz = cam.position.z;
    wK = Math.min(WEDGE_K, 1.15 * Math.tan(cam.fov * PI / 360) * (cam.aspect || 1));
    wOn = true;
  }
  function wedgeDepth(x, z) { // khoảng cách dọc trục máy quay nếu (x, z) nằm trong nêm, ngược lại -1
    const dx = x - wCx, dz = z - wCz, d = dx * wFx + dz * wFz;
    if (d <= 0 || d >= WEDGE_D) return -1;
    const lat = dz * wFx - dx * wFz, w = wK * d + WEDGE_PAD;
    return lat < w && lat > -w ? d : -1;
  }
  function inWedge(x, z) { return wedgeDepth(x, z) >= 0; }
  function stepVis(p, dt) {
    const d = wOn ? wedgeDepth(p.pos.x + p.ox, p.pos.z + p.oz) : -1;
    const tgt = d >= 0 ? 0 : 1; // mọi khách trong nêm (đứng hay ngồi) đều ẩn
    if (tgt === 0 && p.bub) { if (p.bub.target === p.getBV) p.bub.until = 0; p.bub = null; } // không để bong bóng lơ lửng trên người đã ẩn
    if (p.vis < tgt) p.vis = Math.min(tgt, p.vis + VIS_RATE * dt);
    else if (p.vis > tgt) p.vis = Math.max(tgt, p.vis - VIS_RATE * dt);
  }
  function shrinkAt(mesh, i, k, cx, cy, cz) { // thu nhỏ ma trận thứ i của lớp mesh theo tỉ lệ k quanh điểm (cx, cy, cz)
    const e = mesh.instanceMatrix.array, o = i * 16;
    e[o] *= k; e[o + 1] *= k; e[o + 2] *= k; e[o + 4] *= k; e[o + 5] *= k; e[o + 6] *= k; e[o + 8] *= k; e[o + 9] *= k; e[o + 10] *= k;
    e[o + 12] = cx + (e[o + 12] - cx) * k; e[o + 13] = cy + (e[o + 13] - cy) * k; e[o + 14] = cz + (e[o + 14] - cz) * k;
  }
  function applyVis(p, cx, cz) { // gọi sau writePilgrim khi p.vis < 1: thu mọi bộ phận (kể cả bóng, cờ) về chân người đó; vis < 0.02 thì ẩn hẳn
    const v = p.vis, k = v * v * (3 - 2 * v), cy = p.gy, sl = p.slot, f = p.flagSlot;
    if (v < 0.02) {
      for (let q = 0; q < perPilgrim.length; q++) {
        const m = perPilgrim[q][0], per = perPilgrim[q][1];
        for (let j = 0; j < per; j++) m.setMatrixAt(sl * per + j, ZERO);
      }
      if (f >= 0) { mStick.setMatrixAt(f, ZERO); mFlag.setMatrixAt(f, ZERO); }
      return;
    }
    for (let q = 0; q < perPilgrim.length; q++) {
      const m = perPilgrim[q][0], per = perPilgrim[q][1];
      for (let j = 0; j < per; j++) shrinkAt(m, sl * per + j, k, cx, cy, cz);
    }
    if (f >= 0) { shrinkAt(mStick, f, k, cx, cy, cz); shrinkAt(mFlag, f, k, cx, cy, cz); }
  }

  // =====================================================================
  //  GHI MA TRẬN: gốc (vị trí, hướng, tỉ lệ) × nghiêng hông × từng bộ phận
  // =====================================================================
  function writePilgrim(p, time) {
    const a = p.a, s = p.scale, sl = p.slot, sit = a.sit;
    const vy = p.gy + sit * (p.seatTop - 0.05 * s - p.gy) + p.bob * s; // ngồi: hạ thân xuống ngang mặt bồ đoàn / ghế
    const px = p.pos.x + p.ox, pz = p.pos.z + p.oz;
    const hy = p.yaw * 0.5;
    _q.set(0, Math.sin(hy), 0, Math.cos(hy));
    _rootM.compose(_pv.set(px, vy, pz), _q, _sv.set(s, s * (1 + (p.sitMode >= SM_THIEN ? 0 : 0.012) * Math.sin(time * 1.7 + p.ph)), s));
    // hông (điểm xoay khi cúi / lắc lư)
    _e.set(a.hip + p.hunch, 0, a.roll, 'XYZ'); _q.setFromEuler(_e);
    _hipM.multiplyMatrices(_rootM, _loc.compose(_pv.set(0, HIP, 0), _q, _one));
    // thân + tràng hạt (gốc ở chân, xoay quanh hông)
    _bodyM.copy(_hipM);
    const be = _bodyM.elements; be[12] -= HIP * be[4]; be[13] -= HIP * be[5]; be[14] -= HIP * be[6];
    mBody.setMatrixAt(sl, _bodyM);
    mBeads.setMatrixAt(sl, p.beads ? _bodyM : ZERO);
    // cổ → đầu, tóc, búi tóc, nón lá, mặt
    _e.set(a.head, a.hyaw, 0, 'YXZ'); _q.setFromEuler(_e);
    _neckM.multiplyMatrices(_hipM, _loc.compose(_pv.set(0, NECK - HIP, 0), _q, _sv.setScalar(p.headS)));
    mHead.setMatrixAt(sl, _neckM); mHair.setMatrixAt(sl, _neckM); mFace.setMatrixAt(sl, _neckM);
    mHat.setMatrixAt(sl, p.hat ? _neckM : ZERO); mBun.setMatrixAt(sl, p.bun ? _neckM : ZERO);
    // hai tay + hai bàn tay (mỗi người hai ô liên tiếp: trái, phải)
    for (let k = 0; k < 2; k++) {
      const left = k === 0;
      _e.set(left ? a.la : a.ra, 0, left ? a.lz : a.rz, 'XYZ'); _q.setFromEuler(_e);
      _armM.multiplyMatrices(_hipM, _loc.compose(_pv.set(left ? SHX : -SHX, SHY - HIP, 0), _q, _one));
      mArms.setMatrixAt(sl * 2 + k, _armM); mHands.setMatrixAt(sl * 2 + k, _armM);
      (left ? _tipL : _tipR).set(0, -0.36, 0.03).applyMatrix4(_armM);
    }
    // hai bàn chân (bước theo nhịp đi) hoặc ẩn khi ngồi
    if (sit > 0.5) { mFeet.setMatrixAt(sl * 2, ZERO); mFeet.setMatrixAt(sl * 2 + 1, ZERO); }
    else {
      const fs = Math.sin(p.phase) * p.walkAmt, step = p.kind === 1 ? 0.08 : p.kind === 2 ? 0.07 : 0.1;
      _tmp.multiplyMatrices(_rootM, _loc.compose(_pv.set(0.11, 0.05 + Math.max(0, fs) * 0.05, 0.04 + fs * step), _qI, _one));
      mFeet.setMatrixAt(sl * 2, _tmp);
      _tmp.multiplyMatrices(_rootM, _loc.compose(_pv.set(-0.11, 0.05 + Math.max(0, -fs) * 0.05, 0.04 - fs * step), _qI, _one));
      mFeet.setMatrixAt(sl * 2 + 1, _tmp);
    }
    // hai chân xếp bằng khi ngồi
    if (sit > 0.12) { _tmp.multiplyMatrices(_rootM, _loc.compose(_zeroV, _qI, _sv.setScalar(Math.max(0.01, sit)))); mLegs.setMatrixAt(sl, _tmp); }
    else mLegs.setMatrixAt(sl, ZERO);
    // điện thoại nằm giữa hai bàn tay; đèn chụp ảnh lóe phía trước ống kính
    if (a.phone > 0.03) {
      _pv.copy(_tipL).add(_tipR).multiplyScalar(0.5);
      _tmp.copy(_hipM); const te = _tmp.elements; te[12] = _pv.x; te[13] = _pv.y; te[14] = _pv.z;
      _tmp.multiply(_loc.makeTranslation(0, 0.035, 0.055));
      _tmp.scale(_sv.setScalar(a.phone));
      mPhone.setMatrixAt(sl, _tmp);
      if (p.flashReq) { p.flashReq = false; if (p.vis > 0.5) flashAt(te[12] + te[8] * 0.25, te[13] + te[9] * 0.25, te[14] + te[10] * 0.25); }
    } else { mPhone.setMatrixAt(sl, ZERO); p.flashReq = false; }
    // cờ của hướng dẫn viên: cán cắm qua bàn tay phải, lá cờ bay về phía sau
    if (p.flagSlot >= 0) {
      const f = p.flagSlot, by = _tipR.y - 0.75 * s;
      mStick.setMatrixAt(f, _loc.makeTranslation(_tipR.x, by, _tipR.z));
      _e.set(0, p.yaw + PI / 2 + Math.sin(time * 2.4 + f) * 0.35 + Math.sin(time * 5.1 + f * 2) * 0.08, 0, 'XYZ'); _q.setFromEuler(_e);
      mFlag.setMatrixAt(f, _loc.compose(_pv2.set(_tipR.x, by + 2.34, _tipR.z), _q, _one));
    }
    // bóng mờ dưới chân
    mShadow.setMatrixAt(sl, _loc.compose(_pv.set(px, p.gy + 0.025, pz), _qI, _sv.set(0.95 * s * (1 + sit * 0.1), 1, 0.95 * s)));
    // điểm gắn bong bóng chữ
    p.bv.set(px, vy, pz);
    p.bubbleY = (p.hat ? 1.78 : 1.6) * s + 0.25;
    if (p.vis < 1) applyVis(p, px, pz); // đang ẩn / hiện dần (chỉ khi gõ mõ có khách trong nêm trước máy quay)
  }

  // =====================================================================
  //  LỜI THOẠI: khoảng 50 câu ngắn, ấm áp, hợp với việc người đó đang làm
  // =====================================================================
  const LINES = {
    pray: ['Cầu cho mẹ khoẻ', 'Mong thi đậu', 'Bình an cả nhà', 'Nam mô A Di Đà Phật', 'Mong ba sớm khoẻ lại', 'Cầu cho con ngoan, học giỏi',
      'Nguyện mọi người an vui', 'Năm nay mong mọi sự hanh thông', 'Tâm an là vui rồi', 'Cầu cho gia đình bình an', 'Nguyện cho thế gian an lành',
      'Mong người thân luôn mạnh khoẻ', 'Mong công việc suôn sẻ', 'Cầu cho mưa thuận gió hoà', 'Xin cảm ơn một ngày bình yên',
      'Mong ai cũng được an lành', 'Nguyện sống hiền lành, biết ơn', 'Cầu cho các cháu ngoan hiền'],
    ambient: ['Hương trầm thơm quá', 'Cảnh chùa đẹp ghê', 'Tiếng chuông nghe nhẹ lòng ghê', 'Ở đây yên tĩnh quá', 'Nghe nhẹ cả người',
      'Gió mát quá', 'Chùa hôm nay thanh bình ghê', 'Mùi hương thơm dịu', 'Đến chùa thấy lòng nhẹ hẳn', 'Trời hôm nay đẹp quá'],
    photo: ['Chụp một tấm kỷ niệm nhé!', 'Đứng sang bên này nhé', 'Cười lên nào!', 'Góc này đẹp quá', 'Một, hai, ba!', 'Chụp thêm tấm nữa nhé',
      'Đẹp quá, gửi cho mẹ xem'],
    child: ['Mẹ ơi, chùa đẹp quá!', 'Con thích tiếng chuông', 'Xem cá bơi kìa!', 'Bà ơi, mình vào chùa nhé', 'Con thắp hương cho bà nhé'],
    family: ['Đi chậm thôi con', 'Con ngoan, chắp tay nào', 'Nắm tay mẹ nhé', 'Con nhớ đi nhẹ thôi nhé'],
    elder: ['Nam mô A Di Đà Phật', 'Cầu cho con cháu bình an', 'Chùa đông vui quá', 'Lên chùa thấy lòng nhẹ hẳn ra', 'Lên chùa thấy lòng thanh thản'],
    pond: ['Sen nở đẹp quá', 'Cá bơi vui mắt ghê', 'Nước hồ trong quá', 'Hoa sen thơm dịu'],
    bench: ['Ngồi nghỉ một chút nhé', 'Chỗ này mát quá', 'Ngắm hồ sen thật thư thái'],
    bell: ['Tiếng chuông ngân xa quá', 'Gác chuông đẹp ghê', 'Nghe chuông thấy lòng lắng lại'],
    fortune: ['Xin một quẻ đầu năm nhé', 'Xin một lời chúc đầu năm nhé'],
    guide: ['Mời cả đoàn đi theo tôi', 'Đoàn mình đi chậm thôi nhé', 'Cùng vào lễ Phật nhé cả nhà', 'Mọi người giữ yên tĩnh nhé'],
    group: ['Đông vui quá nhỉ', 'Mình đi theo cờ nhé', 'Cùng vào chùa thôi', 'Chùa đẹp quá, cả đoàn nhỉ'],
  };
  const recent = ['', '', '', '', '', '', '', ''];
  let recentN = 0;
  function pickLine(p) {
    const r = Math.random();
    let pl;
    switch (p.act) {
      case 'incense': case 'pray': case 'sit': case 'tree':
        pl = r < 0.68 ? LINES.pray : r < 0.88 ? LINES.ambient : p.kind === 1 ? LINES.child : p.kind === 2 ? LINES.elder : LINES.family; break;
      case 'fortune': pl = r < 0.5 ? LINES.fortune : LINES.pray; break;
      case 'photo': case 'pose': pl = LINES.photo; break;
      case 'pond': pl = r < 0.55 ? LINES.pond : p.kind === 1 ? LINES.child : LINES.ambient; break;
      case 'bell': pl = r < 0.6 ? LINES.bell : LINES.ambient; break;
      case 'bench': pl = r < 0.5 ? LINES.bench : LINES.ambient; break;
      case 'guide': pl = LINES.guide; break;
      default:
        pl = p.kind === 1 ? (r < 0.65 ? LINES.child : LINES.ambient)
          : p.kind === 2 ? (r < 0.5 ? LINES.elder : LINES.ambient)
            : p.grp ? (r < 0.55 ? LINES.group : LINES.ambient)
              : (r < 0.15 ? LINES.family : LINES.ambient);
    }
    let line = pl[(Math.random() * pl.length) | 0];
    for (let k = 0; k < 5 && recent.indexOf(line) >= 0; k++) line = pl[(Math.random() * pl.length) | 0];
    recent[recentN] = line; recentN = (recentN + 1) % recent.length;
    return line;
  }
  // lời của người ngồi tụng: lấy nguyên văn từ G.kinh.shortLines (nếu có), không thì dùng LINES.pray; lần chuỗi chỉ niệm danh hiệu Phật A Di Đà
  function sitterLine(p) {
    if (p.sitMode === SM_LAN) return 'Nam mô A Di Đà Phật';
    const kv = G.kinh, pl = kv && kv.shortLines && kv.shortLines.length >= 4 ? kv.shortLines : LINES.pray;
    let line = pl[(Math.random() * pl.length) | 0];
    for (let k = 0; k < 5 && recent.indexOf(line) >= 0; k++) line = pl[(Math.random() * pl.length) | 0];
    recent[recentN] = line; recentN = (recentN + 1) % recent.length;
    return line;
  }
  function speak(time) {
    if (!G.started || !act.length || G.ui.bubbleCount() >= 2) return; // tối đa 2 bong bóng của đám đông cùng lúc
    const c = G.camera.position, W = G.size.w, H = G.size.h, PP = G.player.pos;
    const inHall = sitList.length > 0 && G.insideHall(PP.x, PP.z); // người chơi ở trong chính điện: ưu tiên lời của người ngồi tụng
    for (let tries = 0; tries < 16; tries++) {
      const p = inHall && tries < 10 ? sitList[(Math.random() * sitList.length) | 0] : act[(Math.random() * act.length) | 0];
      if (p.nextSpeak > time || p.mode === M_WAIT || p.act === 'leave' || p.vis < 0.99) continue; // người đang bị ẩn (nêm gõ mõ) không nói
      if (p.sitMode === SM_THIEN || (p.sitter && p.mode !== M_ACT)) continue; // ngồi thiền thì im lặng; người còn đang đi tới chỗ ngồi chưa tụng
      const dx = c.x - p.pos.x, dy = c.y - p.pos.y, dz = c.z - p.pos.z;
      if (dx * dx + dy * dy + dz * dz > 484) continue; // trong khoảng 22 m quanh máy quay
      G.ui.worldToScreen(_pv.set(p.bv.x, p.bv.y + p.bubbleY, p.bv.z), _sc); // vị trí bong bóng (trên đầu)
      if (!_sc.visible || _sc.x < 40 || _sc.x > W - 40 || _sc.y < 90 || _sc.y > H - 40) continue;
      p.bub = G.ui.bubble(p.getBV, p.sitter ? sitterLine(p) : pickLine(p), randInt(3200, 4200), p.bubbleY);
      p.nextSpeak = time + (p.sitMode === SM_TUNG ? rand(18, 40) : p.sitMode === SM_LAN ? rand(60, 90) : 25);
      return;
    }
  }

  // =====================================================================
  //  KHỞI TẠO ~34 KHÁCH ĐÃ CÓ MẶT SẴN, ĐANG LÀM DỞ VIỆC
  // =====================================================================
  function placeAtSpot(p, kind, idx) {
    const s = KINDS[kind][idx];
    reserve(p, kind, idx);
    p.act = ACT_OF[kind];
    p.gx = s.x; p.gz = s.z; p.hasYaw = s.yaw !== undefined; p.gyaw = s.yaw || 0;
    p.pos.set(s.x, G.heightAt(s.x, s.z), s.z); p.gy = p.pos.y;
    p.yaw = p.hasYaw ? p.gyaw : rand(0, TAU);
    arrive(p);
    if (kind === 'wander') p.snap = false;
    p.at = rand(0, p.dur * 0.8);
    if (p.act === 'incense') p.puffN = clamp(Math.floor((p.at - 1.7) / 0.55) + 1, 0, 3);
    if (p.act === 'photo') { p.phoneUp = Math.random() < 0.6; p.cyc = rand(0.5, 2.5); p.shotDone = true; }
    p.born = G.time - rand(0, 160);
    snapPose(p);
  }
  function seedPartner(a, spot) {
    if (!findPosePoint(spot)) return false;
    const b = allocPilgrim();
    if (!b) return false;
    const r = Math.random();
    activate(b, r < 0.75 ? 0 : r < 0.9 ? 1 : 2, false, _pp.x, _pp.z, 0);
    b.act = 'pose'; b.partnerOf = a; a.partner = b;
    b.gx = _pp.x; b.gz = _pp.z; b.hasYaw = true; b.gyaw = U.yawTo(_pp.x, _pp.z, spot.x, spot.z); b.yaw = b.gyaw;
    arrive(b); b.at = rand(0, 6); b.born = G.time - rand(0, 160);
    snapPose(b);
    return true;
  }
  function seedInitial() {
    let paired = false; // thử ghép một cặp chụp ảnh (người chụp + người đứng làm mẫu)
    const plan = [['incense', 4], ['pray', 6], ['sit', 10], ['photo', 3], ['tree', 3], ['pond', 2], ['bell', 1], ['fortune', 1], ['bench', 1], ['wander', 4]]; // chính điện 160 chỗ (v4; v3: 96): gieo sẵn 10 người ngồi
    for (let k = 0; k < plan.length; k++) {
      const kind = plan[k][0];
      for (let i = 0; i < plan[k][1]; i++) {
        const idx = pickSpot(kind);
        if (idx < 0) break;
        const p = allocPilgrim();
        if (!p) return;
        const r = Math.random();
        const sitLike = kind === 'sit' || kind === 'bench' || kind === 'pray' || kind === 'incense';
        const kd = sitLike && r < 0.3 ? 2 : r < 0.62 ? 0 : r < 0.78 ? 1 : 2;
        const s = KINDS[kind][idx];
        activate(p, kd, false, s.x, s.z, 0);
        placeAtSpot(p, kind, idx);
        if (kind === 'photo' && !paired) paired = seedPartner(p, s);
      }
    }
  }

  // =====================================================================
  //  NGƯỜI NGỒI TRONG CHÍNH ĐIỆN ("hall sitters"): đoàn người ngồi tụng kinh / thiền thường trực,
  //  thêm NGOÀI BASE_TARGET (14 người, 10 khi quality:low) để chính điện không bao giờ trống.
  //  Mỗi người ngồi 3–8 phút rồi đứng dậy ra về; người thay thế đi vào (từ điểm vào gần chính điện nhất mà máy quay
  //  không thấy, không có thì từ cổng), lên bậc, qua cửa chính điện và ngồi vào bồ đoàn trống. Giữ ≥ SIT_KEEP ô trống cho đoàn khách.
  // =====================================================================
  const SM_FRAC = [0, 0.55, 0.35, 0.10]; // tụng 55 % · thiền 35 % · lần chuỗi 10 %
  const ENT = [[0, -60.4, 1.8], [0, -38, 1.2], [0, -21.4, 0.8]]; // điểm vào dọc trục chùa, gần chính điện nhất trước: sân chính điện, trước Tích Thiện Am, đầu cầu đá ([x, z, độ lệch x]; cạnh nút dẫn đường)
  function entryHidden(ex, ez) { // máy quay ở xa, hoặc ở vừa phải mà điểm đó nằm ngoài màn hình / bị tường chắn → hiện ở đó không ai thấy
    const c = G.camera.position, dx = c.x - ex, dz = c.z - ez, d2 = dx * dx + dz * dz;
    if (d2 > 3600) return true;
    if (d2 < 400) return false;
    G.ui.worldToScreen(_pv.set(ex, 2.2, ez), _sc);
    return !_sc.visible || !G.nav.los(c.x, c.z, ex, ez, 0.2);
  }
  function dropSitter(p) {
    if (!p.sitter) return;
    p.sitter = false; p.sitMode = 0;
    const i = sitList.indexOf(p);
    if (i >= 0) { sitList[i] = sitList[sitList.length - 1]; sitList.pop(); }
  }
  // chọn chế độ cho người mới sao cho tỉ lệ các chế độ luôn gần 55 / 35 / 10 (bù chỗ thiếu, có chút ngẫu nhiên)
  function chooseSitMode() {
    let c1 = 0, c2 = 0, c3 = 0;
    for (let i = 0; i < sitList.length; i++) { const m = sitList[i].sitMode; if (m === SM_TUNG) c1++; else if (m === SM_THIEN) c2++; else c3++; }
    const n = sitList.length + 1;
    const d1 = SM_FRAC[1] * n - c1 + Math.random() * 0.7, d2 = SM_FRAC[2] * n - c2 + Math.random() * 0.7, d3 = SM_FRAC[3] * n - c3 + Math.random() * 0.7;
    return d1 >= d2 && d1 >= d3 ? SM_TUNG : d2 >= d3 ? SM_THIEN : SM_LAN;
  }
  // biến một người vừa kích hoạt thành người ngồi thường trực: không nón lá, áo lam / xám / nâu / trắng của người đi lễ, lần chuỗi thì đeo tràng hạt
  function makeSitter(p, mode) {
    p.sitter = true; p.sitMode = mode; sitList.push(p);
    p.hat = false; p.bun = p.bun || Math.random() < 0.3; if (mode === SM_LAN) p.beads = true;
    const r = Math.random(), arr = r < 0.6 ? ROBE.lam : r < 0.76 ? ROBE.grey : r < 0.9 ? ROBE.brown : ROBE.white;
    const robe = arr[(Math.random() * arr.length) | 0], j = rand(0.93, 1.07), sl = p.slot;
    setC(mBody, sl, robe, j); setC(mLegs, sl, robe, j); setC(mArms, sl * 2, robe, j); setC(mArms, sl * 2 + 1, robe, j);
    colDirty = true;
  }
  // chọn bồ đoàn trống cho người ngồi: lấy ngẫu nhiên 8 chỗ, ưu tiên chỗ có 1–2 người ngồi cạnh (thành từng nhóm nhỏ), tránh chỗ kín mít
  function pickSitterSeat() {
    const list = KINDS.sit, tk = taken.sit;
    let best = -1, bs = -1e9;
    for (let t = 0; t < 8; t++) {
      const i = (Math.random() * list.length) | 0;
      if (tk[i] || !farFromPlayer(list[i])) continue;
      const s = list[i];
      let nb = 0;
      for (let j = 0; j < list.length; j++) {
        if (j === i || !tk[j]) continue;
        const dx = list[j].x - s.x, dz = list[j].z - s.z;
        if (dx * dx + dz * dz < 4.6) nb++; // cạnh bên (1,75 m) hoặc hàng trước / sau (1,3 m)
      }
      const sc = (nb === 0 ? 0 : nb === 1 ? 1.2 : nb === 2 ? 0.8 : -0.6 * (nb - 2)) + Math.random() * 0.8;
      if (sc > bs) { bs = sc; best = i; }
    }
    return best;
  }
  function seedSitters() { // gieo sẵn SIT_N người đã ngồi từ trước; còn ≥ 110 giây nữa mới đứng dậy (một phút đầu không ai đi)
    for (let k = 0; k < SIT_N; k++) {
      const idx = pickSitterSeat();
      if (idx < 0) break;
      const p = allocPilgrim();
      if (!p) break;
      const s = KINDS.sit[idx];
      activate(p, Math.random() < 0.35 ? 2 : 0, false, s.x, s.z, 0);
      makeSitter(p, chooseSitMode());
      placeAtSpot(p, 'sit', idx);
      p.at = rand(0, p.dur - 110);
      p.nextSpeak = G.time + rand(2, 30);
    }
  }
  function spawnSitter() { // người thay thế: đi vào bằng đường dẫn thường, giữ sẵn một bồ đoàn
    if (POOL - act.length <= SIT_KEEP) return false;
    const idx = pickSitterSeat();
    if (idx < 0) return false;
    const p = allocPilgrim();
    if (!p) return false;
    const o = S.gateOut, s = KINDS.sit[idx], kd = Math.random() < 0.65 ? 0 : 2;
    let k = 0;
    while (k < ENT.length && !entryHidden(ENT[k][0], ENT[k][1])) k++;
    if (k < ENT.length) activate(p, kd, false, ENT[k][0] + rand(-ENT[k][2], ENT[k][2]), ENT[k][1] + rand(-0.6, 0.6), PI);
    else activate(p, kd, false, o.x + rand(-1.5, 1.5), o.z + rand(0, 1.5), PI); // không điểm vào nào kín: đi từ cổng như mọi khách
    makeSitter(p, chooseSitMode());
    reserve(p, 'sit', idx);
    p.act = 'sit';
    travelTo(p, s.x, s.z, s.yaw);
    return true;
  }
  // giữ đủ số người ngồi: người sắp đứng dậy (còn ≤ SIT_LEAD giây) không tính, nên người thay thế đã đi tới đúng lúc
  function sitterTick() {
    let eff = 0;
    for (let i = 0; i < sitList.length; i++) { const p = sitList[i]; if (p.mode !== M_ACT || p.dur - p.at > SIT_LEAD) eff++; }
    if (eff < (lowQ ? SIT_LOW : SIT_N)) spawnSitter();
  }
  function trimSitters() { // quality:low: mời bớt người ngồi dư (đứng dậy trong chốc lát), không cho người thay thế
    let extra = sitList.length - SIT_LOW;
    for (let i = 0; i < sitList.length && extra > 0; i++) {
      const p = sitList[i];
      if (p.mode === M_ACT) { p.dur = Math.min(p.dur, p.at + rand(8, 60)); extra--; }
    }
  }

  // =====================================================================
  //  VÒNG LẶP CHÍNH: lịch đến/đi, điều hoà số người, cập nhật từng người
  // =====================================================================
  let regT = 2, bubT = 5, sitT = 4, disposed = false;
  function schedule(dt, time) {
    if (!entered && G.started) { entered = true; nextGroup = time + 25; }
    if (time >= nextTrickle) { // khách lẻ đến từ cổng mỗi 10–25 giây khi còn ít người
      nextTrickle = time + rand(10, 25);
      if (staying() < effTarget(time) && act.length < POOL - 2) spawnSingle();
    }
    if (entered && time >= nextGroup) {
      const free = POOL - act.length;
      let n = randInt(10, 20);
      n = Math.min(n, Math.max(10, 56 - (act.length - sitList.length))); // người ngồi chính điện không tính vào cỡ đoàn (còn giới hạn bởi số ô trống)
      if (free < 8) { // bể gần đầy: mời những người ở lâu nhất ra về trước rồi thử lại
        for (let k = 0; k < 8 - free; k++) { const o = oldestStaying(time); if (o) orderLeave(o); }
        nextGroup = time + 10;
      } else { spawnGroup(Math.min(n, free)); nextGroup = time + rand(75, 140); }
    }
    sitT -= dt;
    if (sitT <= 0) { sitT = 2; if (G.started) sitterTick(); } // 2 giây một lần: bổ sung người ngồi chính điện nếu thiếu
    regT -= dt;
    if (regT <= 0) { // điều hoà: dư người thì mời người ở lâu nhất ra về (thong thả, không quá 9 người đang ra về)
      regT = 3;
      if (staying() > effTarget(time) && leavingN < MAX_LEAVING) { const o = oldestStaying(time); if (o) orderLeave(o); }
    }
  }
  function update(dt, time) {
    if (disposed) return;
    fV = 1 - Math.exp(-6 * dt); fP = 1 - Math.exp(-10 * dt); fS = 1 - Math.exp(-6 * dt); fPh = 1 - Math.exp(-9 * dt);
    fW = 1 - Math.exp(-8 * dt); fG = 1 - Math.exp(-10 * dt); fSnap = 1 - Math.exp(-5 * dt); fOff = 1 - Math.exp(-8 * dt);
    wedgeBegin(); // nêm trước máy quay gõ mõ (tắt khi không gõ mõ); đặt trước schedule để chỗ trong nêm bị coi là đã có người
    schedule(dt, time);
    servePaths();
    updateGroups(dt);
    for (let i = act.length - 1; i >= 0; i--) { // lùi về đầu để gỡ người ra về an toàn
      const p = act[i];
      if (!p.active) continue;
      switch (p.mode) {
        case M_WAIT:
          p.speedNow = 0; p.vx = p.vz = 0;
          p.delay -= dt; if (p.delay <= 0) next(p);
          break;
        case M_WALK: stepWalk(p, dt); break;
        case M_GROUP: stepGroup(p, dt); break;
        case M_ACT: stepAct(p, dt, time); break;
      }
      if (!p.active) continue;
      p.gy += (G.heightAt(p.pos.x, p.pos.z) - p.gy) * fG; p.pos.y = p.gy;
      p.state = p.mode === M_ACT ? p.act : p.mode === M_GROUP ? 'group' : p.act === 'leave' ? 'leave' : p.mode === M_WAIT ? 'wait' : 'walk';
      anim(p, dt, time);
    }
    for (let i = 0; i < act.length; i++) {
      const p = act[i];
      if (wOn || p.vis < 1) stepVis(p, dt); // một phép kiểm tra rẻ mỗi người mỗi khung, chỉ khi đang gõ mõ (hoặc còn đang hiện lại)
      writePilgrim(p, time);
    }
    // đẩy dữ liệu lên GPU; giới hạn số bản vẽ theo ô cao nhất đang dùng
    const n = hi + 1;
    for (let k = 0; k < perPilgrim.length; k++) {
      const m = perPilgrim[k][0];
      m.count = n * perPilgrim[k][1]; m.instanceMatrix.needsUpdate = true;
      if (colDirty && m.instanceColor) m.instanceColor.needsUpdate = true;
    }
    mStick.count = mFlag.count = FLAGS; mStick.instanceMatrix.needsUpdate = true; mFlag.instanceMatrix.needsUpdate = true;
    if (colDirty) { mFlag.instanceColor.needsUpdate = true; colDirty = false; }
    mats.face.color.setScalar(1 - 0.4 * (G.tod ? G.tod.night : 0)); // mặt tối dần về đêm cho hợp ánh sáng
    updateFlashes(dt);
    bubT -= dt;
    if (bubT <= 0) { bubT = rand(3, 6); speak(time); }
  }

  // =====================================================================
  //  SỰ KIỆN, GỠ BỎ & GIAO DIỆN GỌI TỪ NGOÀI (G.crowd)
  // =====================================================================
  const offs = [];
  offs.push(G.events.on('enter', () => { if (!entered) { entered = true; nextGroup = G.time + 25; } }));
  offs.push(G.events.on('quality:low', () => { lowQ = true; trimSitters(); }));
  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const off of offs) { try { off(); } catch (err) { /* bỏ qua */ } }
    for (const m of meshes) { scene.remove(m); m.dispose(); }
    for (const k in mats) mats[k].dispose();
    for (const g of ownGeos) g.dispose();
    if (flashPts) flashPts.dispose();
    act.length = 0; groups.length = 0; sitList.length = 0; heldSeat = -1;
  }
  // Chỗ ngồi trong chính điện cho người chơi (module 45): chỉ thao tác trên taken.sit, nên đám đông không bao giờ chọn chỗ đang giữ
  let heldSeat = -1;
  const seats = {
    isFree(i) { return i >= 0 && i < KINDS.sit.length && !taken.sit[i]; }, // không có khách (kể cả khách đang đi tới) và không bị giữ
    hold(i) { // người chơi ngồi vào chỗ i (false nếu đã có người); chỉ giữ một chỗ một lúc — giữ chỗ mới thì nhả chỗ cũ
      if (!(i >= 0 && i < KINDS.sit.length)) return false;
      i |= 0;
      if (heldSeat === i) return true;
      if (taken.sit[i]) return false;
      if (heldSeat >= 0 && taken.sit[heldSeat] === HELD) taken.sit[heldSeat] = null;
      taken.sit[i] = HELD; heldSeat = i;
      return true;
    },
    release(i) { // không truyền i = nhả chỗ đang giữ
      if (i === undefined) i = heldSeat;
      if (heldSeat >= 0 && i === heldSeat) { if (taken.sit[i] === HELD) taken.sit[i] = null; heldSeat = -1; }
    },
    get held() { return heldSeat; },
    nearestFree(x, z, maxD) { // chỗ trống gần (x, z) nhất trong maxD mét (mặc định 1,7); không áp luật "xa người chơi" của đám đông
      const list = KINDS.sit, tk = taken.sit;
      let best = -1, bd = (maxD === undefined ? 1.7 : maxD) ** 2;
      for (let i = 0; i < list.length; i++) {
        if (tk[i]) continue;
        const dx = list[i].x - x, dz = list[i].z - z, d = dx * dx + dz * dz;
        if (d <= bd) { bd = d; best = i; }
      }
      return best;
    },
  };
  G.crowd = {
    count: () => act.length,
    list: act,
    spawnGroup,
    target: () => (lowQ ? LOW_TARGET : BASE_TARGET),
    summary() { const o = {}; for (let i = 0; i < act.length; i++) o[act[i].state] = (o[act[i].state] || 0) + 1; return o; },
    seats,
    // người ngồi chính điện: n = đang ngồi (đã vào chỗ), walking = đang đi tới chỗ; tung / thien / lanHat chỉ tính người đang ngồi
    sitters() {
      let n = 0, tung = 0, thien = 0, lanHat = 0, walking = 0;
      for (let i = 0; i < sitList.length; i++) {
        const p = sitList[i];
        if (p.mode !== M_ACT || p.a.sit < 0.5) { walking++; continue; }
        n++;
        if (p.sitMode === SM_TUNG) tung++; else if (p.sitMode === SM_THIEN) thien++; else lanHat++;
      }
      return { n, tung, thien, lanHat, walking, target: lowQ ? SIT_LOW : SIT_N };
    },
    dispose,
  };

  seedInitial();
  seedSitters();
  G.onUpdate(update, 20);
}
