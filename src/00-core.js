// =====================================================================
//  LÕI TRÒ CHƠI — nạp Three.js, đối tượng chung G, tiện ích, lưu, lọc chữ,
//  va chạm, dẫn đường, giao diện, điều khiển, máy quay, điểm hoạt động
// =====================================================================
import * as THREE from 'three';

const G = (window.__CHUA = { THREE, errors: [] });
const V3 = THREE.Vector3;
const TAU = Math.PI * 2;

// ---------------- Tiện ích số học & hình khối ----------------
const U = (G.util = {
  TAU,
  clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
  lerp: (a, b, t) => a + (b - a) * t,
  smoothstep(a, b, v) { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); },
  damp: (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt)),
  angleDiff(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; else if (d < -Math.PI) d += TAU; return d; },
  angleDamp(a, b, k, dt) { return a + U.angleDiff(a, b) * (1 - Math.exp(-k * dt)); },
  yawTo: (x0, z0, x1, z1) => Math.atan2(x1 - x0, z1 - z0),
  rand: (a = 0, b = 1) => a + Math.random() * (b - a),
  randInt: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: (arr) => arr[(Math.random() * arr.length) | 0],
  shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; },
  hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; },
  rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; },
  fmt: (n) => Math.round(n).toLocaleString('vi-VN'),
  todayKey() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); },
  dateVN(iso) { const d = iso ? new Date(iso) : new Date(); return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }); },
  el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; },
});

const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new V3(), _p = new V3(), _col = new THREE.Color();

// Biến một hình thành "mảnh" low-poly: bỏ uv, đặt vị trí/xoay/tỉ lệ, pháp tuyến phẳng, tô màu đỉnh (có rung màu nhẹ)
// o = { p:[x,y,z], r:[rx,ry,rz], s:number|[sx,sy,sz], m:Matrix4, j:độ rung màu }
U.piece = function (geo, color, o = {}) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  for (const k of Object.keys(g.attributes)) if (k !== 'position') g.deleteAttribute(k);
  _p.set(0, 0, 0); if (o.p) _p.set(o.p[0], o.p[1], o.p[2]);
  _e.set(0, 0, 0, o.order || 'XYZ'); if (o.r) _e.set(o.r[0], o.r[1], o.r[2], o.order || 'XYZ');
  _q.setFromEuler(_e);
  const s = o.s ?? 1; if (typeof s === 'number') _s.set(s, s, s); else _s.set(s[0], s[1], s[2]);
  _m4.compose(_p, _q, _s); g.applyMatrix4(_m4);
  if (o.m) g.applyMatrix4(o.m);
  g.computeVertexNormals();
  const n = g.attributes.position.count, arr = new Float32Array(n * 3);
  _col.set(color); const j = o.j ?? 0.07;
  for (let t = 0; t < n; t += 3) {
    const f = 1 + (Math.random() - 0.5) * 2 * j;
    for (let v = 0; v < 3 && t + v < n; v++) { const i = (t + v) * 3; arr[i] = _col.r * f; arr[i + 1] = _col.g * f; arr[i + 2] = _col.b * f; }
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
};
// Gộp nhiều mảnh (position/normal/color) thành một hình để vẽ một lần
U.merge = function (list) {
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
  let o = 0;
  for (const g of list) {
    pos.set(g.attributes.position.array, o); nor.set(g.attributes.normal.array, o); col.set(g.attributes.color.array, o);
    o += g.attributes.position.count * 3; g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.computeBoundingSphere(); out.computeBoundingBox();
  return out;
};
// Bộ gom mảnh: add(...) nhiều lần rồi mesh(material) một lần
U.batch = function () {
  const list = [];
  return {
    list,
    add(geo, color, o) { list.push(U.piece(geo, color, o)); return this; },
    addGeo(g) { list.push(g); return this; },
    mesh(mat, opt = {}) {
      const m = new THREE.Mesh(U.merge(list), mat);
      m.castShadow = opt.cast ?? true; m.receiveShadow = opt.receive ?? true; m.matrixAutoUpdate = !!opt.dynamic;
      if (!opt.dynamic) m.updateMatrix();
      list.length = 0; return m;
    },
  };
};
// Ma trận cho một thanh nối hai điểm (hộp dài theo trục z)
U.segMatrix = function (ax, ay, az, bx, by, bz) {
  const m = new THREE.Matrix4(), a = new V3(ax, ay, az), b = new V3(bx, by, bz);
  const up = Math.abs(bx - ax) + Math.abs(bz - az) < 1e-4 ? new V3(1, 0, 0) : new V3(0, 1, 0);
  m.lookAt(a, b, up); m.setPosition((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
  return { m, len: a.distanceTo(b) };
};
// Texture vẽ bằng canvas (chữ, hoa văn) — không tải ảnh ngoài
U.canvasTex = function (w, h, draw) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d'); draw(ctx, w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
};
U.wrapText = function (ctx, text, maxW) {
  const words = String(text).split(/\s+/); const lines = []; let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
};

// ---------------- Hoạt ảnh theo thời gian trò chơi ----------------
const tweens = [];
G.ease = {
  linear: (t) => t,
  inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t * t,
  sine: (t) => 0.5 - 0.5 * Math.cos(Math.PI * t),
  outBack: (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
};
G.tween = (dur, fn, ease = G.ease.linear) => new Promise((res) => tweens.push({ t: 0, dur: Math.max(1e-3, dur), fn, ease, res }));
G.wait = (sec) => G.tween(sec, () => {});
function updateTweens(dt) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const w = tweens[i]; w.t += dt; const k = Math.min(1, w.t / w.dur);
    try { w.fn(w.ease(k), k); } catch (e) { console.error(e); }
    if (k >= 1) { tweens.splice(i, 1); w.res(); }
  }
}

// ---------------- Sự kiện ----------------
G.bookSections = []; // các mục thêm vào "Sổ cầu an": fn(container)
G.events = {
  m: new Map(),
  on(n, f) { if (!this.m.has(n)) this.m.set(n, []); this.m.get(n).push(f); return () => this.off(n, f); },
  off(n, f) { const a = this.m.get(n); if (a) { const i = a.indexOf(f); if (i >= 0) a.splice(i, 1); } },
  emit(n, ...args) { const a = this.m.get(n); if (a) for (const f of a.slice()) { try { f(...args); } catch (e) { console.error(e); } } },
};

// =====================================================================
//  LƯU TRÊN MÁY (localStorage)
// =====================================================================
const SAVE_KEY = 'lenchua-cauan-v1';
// Các kênh âm thanh người chơi tự chỉnh: [khoá, tên, mô tả]; mỗi kênh bật/tắt + âm lượng 0–100 (70 = mức gốc)
const SOUND_CATS = [
  ['master', 'Âm lượng chung', 'Tất cả âm thanh trong chùa'],
  ['music', 'Nhạc nền', 'Thiền Mộng Sơn Lâm — tiếng sáo, cổ cầm'],
  ['chime', 'Chuông gió', 'Leng keng dưới mái hiên khi gió thổi'],
  ['amb', 'Âm thanh xung quanh', 'Gió, lá xào xạc, chim hót, dế kêu'],
  ['chant', 'Tụng kinh & chuông xa', 'Tiếng tụng kinh trong điện, chuông chùa ngân xa'],
  ['sfx', 'Hiệu ứng', 'Thỉnh chuông, gõ mõ, thắp hương, bước chân, nút bấm'],
];
const SOUND_DEF = () => Object.fromEntries(SOUND_CATS.map(([k]) => [k, { on: true, v: 70 }]));
const DEF_SAVE = () => ({
  v: 1, name: '', visits: 0, firstAt: null, lastAt: null,
  incense: 0, incenseSticks: 0, bell: 0, bellPerfect: 0, mo: 0,
  bestTamAn: 0, lastTamAn: null, prayers: [], fortunes: [], tutorialDone: false, muted: false, walkSpeed: 'vua', sound: SOUND_DEF(),
});
G.save = {
  data: DEF_SAVE(),
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) { const d = JSON.parse(raw); if (d && typeof d === 'object') this.data = Object.assign(DEF_SAVE(), d); }
    } catch (e) { /* trình duyệt chặn bộ nhớ: chơi bình thường, không lưu */ }
    if (!Array.isArray(this.data.prayers)) this.data.prayers = [];
    if (!Array.isArray(this.data.fortunes)) this.data.fortunes = [];
    const d = this.data, old = d.sound && typeof d.sound === 'object' ? d.sound : {};
    d.sound = {};
    for (const [k] of SOUND_CATS) { const o = old[k] || {}; d.sound[k] = { on: o.on !== false, v: Number.isFinite(o.v) ? U.clamp(Math.round(o.v), 0, 100) : 70 }; }
    if ('music' in d) { if (d.music === false) d.sound.music.on = false; delete d.music; } // bản cũ: cờ bật/tắt nhạc riêng
    return this.data;
  },
  persist() {
    this.data.lastAt = new Date().toISOString();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) {}
    G.events.emit('save', this.data);
  },
  reset() { const { muted, name, sound } = this.data; this.data = DEF_SAVE(); Object.assign(this.data, { muted, name, sound }); this.data.tutorialDone = true; this.persist(); },
  addPrayer(p) { this.data.prayers.unshift(Object.assign({ at: new Date().toISOString() }, p)); if (this.data.prayers.length > 60) this.data.prayers.length = 60; this.persist(); },
  addFortune(f) { this.data.fortunes.unshift(Object.assign({ at: new Date().toISOString() }, f)); if (this.data.fortunes.length > 40) this.data.fortunes.length = 40; this.persist(); },
};
G.save.load();
// Đọc/ghi cài đặt âm thanh; 10-audio.js đổi thành hệ số nhân cho từng kênh
G.sound = {
  cats: SOUND_CATS,
  get: (k) => G.save.data.sound[k],
  // hệ số âm lượng: 70 → 1 (mức gốc), 100 → ~2 (to gấp đôi), 0 hoặc tắt → 0
  gain(k) { const s = G.save.data.sound[k]; return s && s.on ? (s.v / 70) ** 2 : 0; },
  set(k, patch, save = true) {
    Object.assign(G.save.data.sound[k], patch);
    if (save) G.save.persist();
    try { G.audio?.applyLevels?.(); } catch (e) {}
    G.events.emit('sound:change', k);
  },
  reset() { G.save.data.sound = SOUND_DEF(); G.save.persist(); try { G.audio?.applyLevels?.(); } catch (e) {} G.events.emit('sound:change', '*'); },
};

// =====================================================================
//  LỌC CHỮ THÔ TỤC (danh sách đơn giản)
// =====================================================================
G.text = (() => {
  // Từ có dấu: so khớp nguyên từ / cụm từ (chữ thường). Tránh từ đơn dễ trùng lời cầu bình thường (phò hộ, tà dâm…)
  const VI = ['lồn', 'cặc', 'buồi', 'địt', 'đụ', 'đéo', 'đĩ', 'đĩ điếm', 'cứt', 'đcm', 'đmm', 'đm', 'đkm', 'đcl', 'vcc', 'vãi lồn', 'vãi cả lồn',
    'chó chết', 'đồ chó', 'đồ óc chó', 'chó đẻ', 'mẹ mày', 'bố mày', 'con mẹ mày', 'thằng ngu', 'đồ ngu', 'ngu như chó', 'khốn nạn', 'khốn kiếp',
    'thằng khốn', 'con khốn', 'mả mẹ', 'mẹ kiếp', 'chết mẹ', 'chết tiệt', 'mất dạy', 'cờ hó', 'hiếp dâm', 'dâm đãng', 'đồ dâm', 'gái phò', 'con phò',
    'đù má', 'đụ má', 'địt mẹ', 'đéo mẹ', 'đầu buồi'];
  // Viết không dấu / tiếng lóng: chỉ so khớp khi người viết gõ không dấu (bỏ những cụm trùng chữ thường như "cai lon" = cái lon)
  const ASCII = ['dm', 'dmm', 'dcm', 'dkm', 'dmcs', 'dcl', 'vcl', 'vkl', 'vcc', 'clgt', 'clm', 'cmm', 'cmn', 'cml', 'dit', 'djt', 'dit me', 'loz',
    'fuck', 'fucking', 'fck', 'shit', 'bitch', 'pussy', 'cunt', 'bastard', 'motherfucker', 'porn'];
  // Gốc từ dính liền ở đầu một từ (vd. "ditmemay")
  const JOINED = ['ditme', 'ditconme', 'dmm', 'dcm', 'vcl'];
  const vi = new Set(VI), as = new Set(ASCII);
  const INVIS = /[​-‏‪-‮⁠-⁯﻿­]/g;
  const strip = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  const tokens = (s) => String(s || '').replace(INVIS, '').toLowerCase().normalize('NFC').split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  function badToken(list, k, i, n) {
    const ph = list.slice(i, i + k).join(' ');
    if (vi.has(ph)) return true;
    return /^[a-z0-9 ]+$/.test(ph) && as.has(ph);
  }
  function hasBad(s) {
    const t = tokens(s), n = t.length;
    const c = t.map((w) => w.replace(/(\p{L})\1+/gu, '$1')); // "lồnnn" → "lồn"
    for (let i = 0; i < n; i++) {
      for (let k = 1; k <= 3 && i + k <= n; k++) if (badToken(t, k, i, n) || badToken(c, k, i, n)) return true;
      if (/^[a-z0-9]+$/.test(t[i])) {
        if (t[i].includes('fuck')) return true;
        for (const w of JOINED) if (t[i].length > w.length && t[i].startsWith(w)) return true;
      }
    }
    return false;
  }
  function cleanName(s) { return Array.from(String(s || '').replace(INVIS, '').normalize('NFC').replace(/[<>{}[\]\`]/g, '').replace(/[\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim()).slice(0, 20).join('').trim(); }
  function cleanText(s, max = 120) { return Array.from(String(s || '').replace(INVIS, '').normalize('NFC').replace(/[\u0000-\u0009\u000b-\u001f]/g, '').replace(/[ \t]+/g, ' ').trim()).slice(0, max).join('').trim(); }
  return { hasBad, cleanName, cleanText, strip };
})();

// =====================================================================
//  KẾT XUẤT: renderer, cảnh, máy quay, chất lượng tự điều chỉnh
// =====================================================================
const canvas = document.getElementById('c');
const renderer = (G.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', stencil: false }));
G.isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (G.isTouch) document.body.classList.add('touch');
const DPR = Math.min(window.devicePixelRatio || 1, G.isTouch ? 1.75 : 2);
G.quality = { pr: DPR, max: DPR, low: false };
renderer.setPixelRatio(DPR);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;
const scene = (G.scene = new THREE.Scene());
scene.fog = new THREE.Fog(0xf0a878, 60, 330);
const camera = (G.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 900));
G.size = { w: 1, h: 1 };
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  G.size.w = w; G.size.h = h;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.fov = w < h ? 64 : 52; camera.updateProjectionMatrix();
  if (G.cam) G.cam.baseFov = camera.fov; // góc nhìn gốc theo tỉ lệ màn hình; cam.focus({fov}) kéo về/đi từ giá trị này
  G.events.emit('resize', w, h);
}
window.addEventListener('resize', resize);
G.resize = resize;
// mất / khôi phục ngữ cảnh WebGL (điện thoại thiếu bộ nhớ): vẽ lại bóng đổ tĩnh
canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
canvas.addEventListener('webglcontextrestored', () => { renderer.shadowMap.needsUpdate = true; resize(); });

let qAcc = 0, qN = 0, qT = 0, qWarm = 0, qCap = 0;
function qualityTick(raw) {
  qWarm += raw; if (qWarm < 4 || raw > 0.25 || document.hidden) return;
  qAcc += raw; qN++; qT += raw;
  if (raw > 0.031 && raw < 0.036) qCap++; // khung đều 33 ms: máy đang tự khoá 30 hình/giây
  if (qT < 3) return;
  const avg = qAcc / qN, capped = qCap / qN > 0.8; qAcc = qN = qT = qCap = 0;
  if (capped) return;
  if (avg > 1 / 38 && G.quality.pr > 1) {
    G.quality.pr = Math.max(1, +(G.quality.pr - 0.25).toFixed(2));
    renderer.setPixelRatio(G.quality.pr); resize();
  } else if (avg > 1 / 28 && G.quality.pr <= 1 && !G.quality.low) {
    G.quality.low = true; G.events.emit('quality:low');
  }
}

// =====================================================================
//  VA CHẠM: hình tròn / hộp / elip trên mặt phẳng XZ
// =====================================================================
G.collide = {
  list: [],
  bounds: { x0: -31, x1: 31, z0: -119, z1: 76 }, // z0: tường bao phía sau đã lùi từ −84 ra −100 (v3) rồi ra −118 (v4: chính điện sâu 27 m, tường sau điện z −113,2; hành lang tới −113)
  circle(x, z, r, tag) { const c = { t: 0, x, z, r, tag }; this.list.push(c); return c; },
  box(x0, z0, x1, z1, tag) { const c = { t: 1, x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), tag }; this.list.push(c); return c; },
  ellipse(x, z, rx, rz, tag) { const c = { t: 2, x, z, rx, rz, tag }; this.list.push(c); return c; },
  remove(c) { const i = this.list.indexOf(c); if (i >= 0) this.list.splice(i, 1); },
  // đẩy điểm p {x,z} ra khỏi mọi vật cản (bán kính r)
  resolve(p, r) {
    for (let it = 0; it < 2; it++) for (let i = 0; i < this.list.length; i++) pushOut(this.list[i], p, r);
    const b = this.bounds;
    p.x = U.clamp(p.x, b.x0 + r, b.x1 - r); p.z = U.clamp(p.z, b.z0 + r, b.z1 - r);
    return p;
  },
  hit(x, z, r = 0) { for (let i = 0; i < this.list.length; i++) if (inside(this.list[i], x, z, r)) return this.list[i]; return null; },
};
function inside(c, x, z, r) {
  if (c.t === 0) { const dx = x - c.x, dz = z - c.z, m = c.r + r; return dx * dx + dz * dz < m * m; }
  if (c.t === 1) { const qx = U.clamp(x, c.x0, c.x1), qz = U.clamp(z, c.z0, c.z1), dx = x - qx, dz = z - qz; return dx * dx + dz * dz < r * r || (x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1); }
  const ux = (x - c.x) / (c.rx + r), uz = (z - c.z) / (c.rz + r); return ux * ux + uz * uz < 1;
}
function pushOut(c, p, r) {
  if (c.t === 0) {
    const dx = p.x - c.x, dz = p.z - c.z, m = c.r + r, d2 = dx * dx + dz * dz;
    if (d2 >= m * m) return;
    const d = Math.sqrt(d2);
    if (d < 1e-5) { p.x = c.x + m; return; }
    p.x = c.x + (dx / d) * m; p.z = c.z + (dz / d) * m;
  } else if (c.t === 1) {
    const inX = p.x > c.x0 && p.x < c.x1, inZ = p.z > c.z0 && p.z < c.z1;
    if (inX && inZ) { // tâm nằm trong hộp: đẩy ra cạnh gần nhất
      const l = p.x - c.x0, rr = c.x1 - p.x, b = p.z - c.z0, f = c.z1 - p.z, mn = Math.min(l, rr, b, f);
      if (mn === l) p.x = c.x0 - r; else if (mn === rr) p.x = c.x1 + r; else if (mn === b) p.z = c.z0 - r; else p.z = c.z1 + r;
      return;
    }
    const qx = U.clamp(p.x, c.x0, c.x1), qz = U.clamp(p.z, c.z0, c.z1), dx = p.x - qx, dz = p.z - qz, d2 = dx * dx + dz * dz;
    if (d2 >= r * r || d2 < 1e-10) return;
    const d = Math.sqrt(d2); p.x = qx + (dx / d) * r; p.z = qz + (dz / d) * r;
  } else {
    const dx = p.x - c.x, dz = p.z - c.z, ux = dx / (c.rx + r), uz = dz / (c.rz + r), k = Math.sqrt(ux * ux + uz * uz);
    if (k >= 1) return;
    if (k < 1e-5) { p.x = c.x + c.rx + r; return; }
    p.x = c.x + dx / k; p.z = c.z + dz / k;
  }
}

// Độ cao mặt đất (chính điện v3/v4: ba tầng nền đá trắng 1.2 / 2.4 / 3.6 → sàn điện 4.8, bậc thang giữa; heightAt đầy đủ của khu nền do 18-chinh-dien.js bọc lên trên)
// Chính điện v2→v4 (18-chinh-dien.js): s = 1 nên toạ độ gốc → thế giới chỉ là phép dời (0, dy, dz) = (0, 4.08, −79.7); thân điện dựng ở "khung v2" (sàn 1.92, mép nền trước z −63.3)
// rồi dời cả khối (DZ = dz + 57.7 = −22): x ±18.5, z −113.2 … −85.3 (mép nền), sàn dy + h = 4.8 (v4: điện sâu 27 m — tường sau z −113,2 — nên z0 = −33.5: hộp gốc zl ∈ (−33.5, −4.7) ↔ z ∈ (−113.2, −84.4)).
// Công thức dưới đây chỉ còn là nền gốc của chuỗi heightAt (dấu chân điện cũ, bên ngoài khu nền 18 lo)
G.L = { hall: { x0: -18.5, x1: 18.5, z0: -33.5, zTop: -5.6, zStep: -4.7, h: 0.72, dy: 4.08, dz: -79.7, s: 1, pz: -33.5, v2: true, stepX: 7 } };
G.heightAt = (x, z) => {
  const H = G.L.hall, s = H.s, xl = x / s, zl = H.pz + (z - H.dz - H.pz) / s; // về toạ độ gốc của điện
  if (xl > H.x0 && xl < H.x1 && zl < H.zStep && zl > H.z0) {
    if (H.v2 && Math.abs(xl) > H.stepX) return zl < H.zTop ? H.dy + H.h : H.dy; // v2: chỉ giữa (|x| < stepX) có bậc thềm; hai bên mép nền dựng đứng, trước mép là tầng nền 1,2
    return H.dy + s * Math.min(1, (H.zStep - zl) / (H.zStep - H.zTop)) * H.h;
  }
  return 0;
};
G.insideHall = (x, z) => { for (const r of G.roofZones) if (x > r[0] && x < r[1] && z > r[2] && z < r[3]) return true; return false; };

// Dựng một toà theo toạ độ gốc của nó rồi dời nguyên khối: ghi mốc trước khi dựng, dời mọi thứ thêm vào sau mốc
G.frame = {
  mark() {
    const W = G.world || {};
    return { col: G.collide.list.length, blk: G.cam.blockers.length, kids: scene.children.length, glow: (W.glows || []).length,
      smoke: (W.smokeSpots || []).length, petal: (W.petalSources || []).length, seats: (W.seats || []).length };
  },
  // toạ độ gốc → thế giới: phóng đều s quanh (0, pz) rồi dời (0, dy, dz)
  xf(x, y, z, out = new V3()) {
    const H = G.L.hall, s = H.s;
    return out.set(x * s, y * s + H.dy, H.pz + (z - H.pz) * s + H.dz);
  },
  // dời + phóng mọi thứ thêm vào sau mốc m (mỗi vật chỉ qua đây một lần)
  shift(m, dy, dz) {
    const W = G.world || {}, H = G.L.hall, s = H.s, pz = H.pz;
    const fy = (y) => y * s + dy, fz = (z) => pz + (z - pz) * s + dz;
    for (const c of G.collide.list.slice(m.col)) {
      if (c.t === 1) { c.x0 *= s; c.x1 *= s; c.z0 = fz(c.z0); c.z1 = fz(c.z1); } // hộp: hai góc
      else { c.x *= s; c.z = fz(c.z); if (c.t === 0) c.r *= s; else { c.rx *= s; c.rz *= s; } } // tròn/elip: tâm + bán kính
    }
    for (const b of G.cam.blockers.slice(m.blk)) { b.min.set(b.min.x * s, fy(b.min.y), fz(b.min.z)); b.max.set(b.max.x * s, fy(b.max.y), fz(b.max.z)); }
    for (const o of scene.children.slice(m.kids)) {
      o.position.set(o.position.x * s, fy(o.position.y), fz(o.position.z)); o.scale.multiplyScalar(s);
      if (o.isPointLight && o.distance) o.distance *= s;
      o.updateMatrix();
    }
    for (const [list, i0, grow] of [[W.glows, m.glow, 'size'], [W.petalSources, m.petal, 'r'], [W.seats, m.seats, '']]) for (const q of (list || []).slice(i0)) {
      q.x *= s; q.y = fy(q.y); q.z = fz(q.z); if (grow) q[grow] *= s;
    }
    for (const q of (W.smokeSpots || []).slice(m.smoke)) { q[0] *= s; q[1] = fy(q[1]); q[2] = fz(q[2]); }
  },
};
// trong nhà có mái (máy quay đứng gần, không chui lên mái): chính điện + các toà khu mở rộng
G.roofZones = [[-17.5, 17.5, -112.6, -86.0]]; // chính điện v4 (lùi 22 m so với v2, sâu 27 m; 18-chinh-dien.js đặt lại cho khớp tường)

// =====================================================================
//  DẪN ĐƯỜNG: đồ thị điểm mốc, tự nối các điểm nhìn thấy nhau
// =====================================================================
G.nav = {
  nodes: [], built: false,
  add(x, z, id) { this.nodes.push({ x, z, id: id || 'n' + this.nodes.length, n: [] }); this.built = false; },
  _near: [],
  los(x0, z0, x1, z1, r = 0.45) {
    // lọc trước các vật cản nằm gần đoạn thẳng rồi mới lấy mẫu dọc đường
    const near = this._near; near.length = 0;
    const ax = Math.min(x0, x1) - r, bx = Math.max(x0, x1) + r, az = Math.min(z0, z1) - r, bz = Math.max(z0, z1) + r;
    for (const c of G.collide.list) {
      let cx0, cx1, cz0, cz1;
      if (c.t === 0) { cx0 = c.x - c.r; cx1 = c.x + c.r; cz0 = c.z - c.r; cz1 = c.z + c.r; }
      else if (c.t === 1) { cx0 = c.x0; cx1 = c.x1; cz0 = c.z0; cz1 = c.z1; }
      else { cx0 = c.x - c.rx; cx1 = c.x + c.rx; cz0 = c.z - c.rz; cz1 = c.z + c.rz; }
      if (cx1 >= ax && cx0 <= bx && cz1 >= az && cz0 <= bz) near.push(c);
    }
    if (!near.length) return true;
    const dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz), steps = Math.max(1, Math.ceil(len / 0.3));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, x = x0 + dx * t, z = z0 + dz * t;
      for (let k = 0; k < near.length; k++) if (inside(near[k], x, z, r)) return false;
    }
    return true;
  },
  build() {
    const N = this.nodes; for (const a of N) a.n = [];
    for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) {
      const a = N[i], b = N[j], d = Math.hypot(a.x - b.x, a.z - b.z);
      if (d < 34 && this.los(a.x, a.z, b.x, b.z)) { a.n.push({ i: j, d }); b.n.push({ i, d }); }
    }
    this.built = true;
  },
  _order: [],
  nearest(x, z, needLos = true) {
    const ord = this._order; ord.length = 0;
    for (let i = 0; i < this.nodes.length; i++) ord.push(i);
    const d = (i) => (this.nodes[i].x - x) ** 2 + (this.nodes[i].z - z) ** 2;
    ord.sort((a, b) => d(a) - d(b));
    if (!needLos) return ord.length ? ord[0] : -1;
    for (let k = 0; k < ord.length && k < 14; k++) { const n = this.nodes[ord[k]]; if (this.los(x, z, n.x, n.z, 0.3)) return ord[k]; }
    return ord.length ? ord[0] : -1;
  },
  // trả về danh sách điểm {x,z} (kể cả đích)
  path(x0, z0, x1, z1) {
    if (!this.built) this.build();
    if (this.los(x0, z0, x1, z1, 0.3)) return [{ x: x1, z: z1 }];
    const s = this.nearest(x0, z0), g = this.nearest(x1, z1), N = this.nodes;
    if (s < 0 || g < 0) return [{ x: x1, z: z1 }];
    const dist = new Array(N.length).fill(1e9), prev = new Array(N.length).fill(-1), done = new Array(N.length).fill(false);
    dist[s] = 0;
    for (;;) {
      let u = -1, bd = 1e9;
      for (let i = 0; i < N.length; i++) if (!done[i] && dist[i] < bd) { bd = dist[i]; u = i; }
      if (u < 0 || u === g) break;
      done[u] = true;
      for (const e of N[u].n) { const nd = dist[u] + e.d; if (nd < dist[e.i]) { dist[e.i] = nd; prev[e.i] = u; } }
    }
    const seq = []; for (let v = g; v >= 0; v = prev[v]) { seq.unshift({ x: N[v].x, z: N[v].z }); if (v === s) break; }
    seq.push({ x: x1, z: z1 });
    // bỏ bớt điểm thừa nếu nhìn thấy thẳng
    const out = []; let cx = x0, cz = z0, i = 0;
    while (i < seq.length) {
      let j = seq.length - 1;
      while (j > i && !this.los(cx, cz, seq[j].x, seq[j].z, 0.3)) j--;
      out.push(seq[j]); cx = seq[j].x; cz = seq[j].z; i = j + 1;
    }
    return out;
  },
};

// =====================================================================
//  GIAO DIỆN: biểu tượng, thông báo, bảng, bong bóng chữ, nhãn
// =====================================================================
const $ = (s) => document.querySelector(s);
const svg = (inner) => `<svg viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
G.icons = {
  incense: svg('<path d="M8 21h8M9 21l1-5h4l1 5"/><path d="M10 16V7M12 16V5M14 16V7"/><path d="M12 3c1 1 1 1.6 0 2.4M10 5c-.8.7-.8 1.2 0 1.8M14 5c.8.7.8 1.2 0 1.8"/>'),
  bell: svg('<path d="M12 3v2"/><path d="M7 17c0-6 1-10 5-10s5 4 5 10"/><path d="M5 17h14"/><path d="M10.5 20a1.8 1.8 0 0 0 3 0"/>'),
  mo: svg('<ellipse cx="12" cy="13" rx="7" ry="6"/><path d="M6 13c2 1.5 10 1.5 12 0"/><path d="M17 4l-3 5"/><circle cx="17.5" cy="3.5" r="1.2"/>'),
  ribbon: svg('<path d="M4 5c5 0 11 0 16 0"/><path d="M9 5v13l2-2 2 2V5"/><path d="M15 5v9l1.5-1.5L18 14V5"/>'),
  lantern: svg('<path d="M3 17c3 2 15 2 18 0"/><path d="M6 15c1-3 3-5 6-5s5 2 6 5"/><path d="M9 14l3-4 3 4"/><path d="M12 10V7"/><path d="M12 5c.8.8.8 1.4 0 2"/>'),
  fortune: svg('<path d="M8 10h8l-1 11H9z"/><path d="M10 10l-1-7M12 10V2.5M14 10l1-7"/><path d="M17 15l4-2"/>'),
  gate: svg('<path d="M3 9c3 0 5-2 6-4h6c1 2 3 4 6 4"/><path d="M5 9v12M19 9v12M9 12v9M15 12v9M9 12h6"/>'),
  hall: svg('<path d="M2 10c4 0 6-2 7-5h6c1 3 3 5 7 5"/><path d="M5 10v10h14V10M10 20v-5h4v5"/>'),
  sound: svg('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9c1.3 1.6 1.3 4.4 0 6M18.5 6.5c2.6 3 2.6 8 0 11"/>'),
  mute: svg('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9l5 6M21 9l-5 6"/>'),
  map: svg('<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>'),
  book: svg('<path d="M4 4h7a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z"/><path d="M20 4h-5a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h5z"/>'),
  share: svg('<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>'),
  mixer: svg('<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>'),
  help: svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.6 2.6 0 0 1 5 1c0 1.8-2.5 2-2.5 3.6"/><circle cx="12" cy="17.3" r=".6"/>'),
  lotus: svg('<path d="M12 19c-4 0-8-2-9-6 3 0 6 1 9 6 3-5 6-6 9-6-1 4-5 6-9 6z"/><path d="M12 19c-2-3-2-8 0-12 2 4 2 9 0 12z"/>'),
  walk: svg('<circle cx="13" cy="4" r="2"/><path d="M10 21l2-6 3 3v3M9 11l3-3 3 3 3 1M12 8l-1 5"/>'),
  stupa: svg('<path d="M12 2v3"/><path d="M9 8h6l-1-3h-4z"/><path d="M7 12h10l-2-4H9z"/><path d="M6 17h12l-1.5-5h-9z"/><path d="M4 21h16l-2-4H6z"/>'),
  beads: svg('<circle cx="12" cy="12" r="7" stroke-dasharray="2.2 2.2"/><circle cx="12" cy="5" r="1.6"/><path d="M12 19v3M10.5 22h3"/>'),
  wheel: svg('<path d="M12 3l2 3h-4z"/><path d="M8 9h8l-1-3H9z"/><path d="M7 13h10l-1-4H8z"/><path d="M6 18h12l-1-5H7z"/><path d="M3 21c3 1.3 15 1.3 18 0"/><path d="M19 9c2 1 2 4 0 5"/>'),
  beast: svg('<path d="M4 17c0-4 3-7 8-7 3 0 5 1 6 3l2-1-1 4H4z"/><path d="M16 10c0-3 2-4 4-4"/><path d="M3 21h18"/><path d="M6 17v4M16 17v4"/>'),
  breath: svg('<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7" opacity=".6"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>'),
  dot: svg('<circle cx="12" cy="12" r="5"/>'),
};

const toastsEl = $('#toasts');
const panelsEl = $('#panels');
const panelStack = [];
let panelSeq = 0; // đánh số tiêu đề bảng (aria-labelledby)
G.ui = {
  toast(text, ms = 2800) {
    const t = U.el('div', 'toast', text); toastsEl.appendChild(t);
    while (toastsEl.children.length > 3) toastsEl.firstChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 450); }, ms);
    return t;
  },
  addStyle(css) { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); return s; },
  // Bảng trượt từ dưới lên (điện thoại) / hộp giữa màn (máy tính)
  // opts: { title, body: Node|string(HTML tĩnh do mã viết), actions:[{label, primary, cls, onClick(close)}], onClose, closable, clear }
  panel(opts = {}) {
    const wrap = U.el('div', 'pwrap' + (opts.clear ? ' clear' : ''));
    const p = U.el('div', 'panel' + (opts.className ? ' ' + opts.className : ''));
    const h = U.el('div', 'panel-h'); const t = U.el('div', 'panel-t', opts.title || ''); h.appendChild(t);
    t.id = 'pt' + (++panelSeq); p.setAttribute('role', 'dialog'); p.setAttribute('aria-modal', 'true'); p.setAttribute('aria-labelledby', t.id);
    const closable = opts.closable !== false;
    if (closable) { const x = U.el('button', 'panel-x', '×'); x.setAttribute('aria-label', 'Đóng'); x.onclick = () => api.close(); h.appendChild(x); }
    const b = U.el('div', 'panel-b');
    if (opts.body instanceof Node) b.appendChild(opts.body); else if (opts.body) b.innerHTML = opts.body;
    p.append(h, b);
    let f = null;
    if (opts.actions && opts.actions.length) {
      f = U.el('div', 'panel-f');
      for (const a of opts.actions) {
        const btn = U.el('button', 'btn' + (a.primary ? ' primary' : '') + (a.cls ? ' ' + a.cls : ''), a.label);
        if (a.id) btn.id = a.id;
        btn.onclick = () => { G.audio?.play?.('ui'); a.onClick ? a.onClick(api.close, btn) : api.close(); };
        f.appendChild(btn);
      }
      p.appendChild(f);
    }
    wrap.appendChild(p);
    if (closable && !opts.clear) {
      let downOnWrap = false;
      const hasDraft = () => [...p.querySelectorAll('textarea, input')].some((f) => f.type !== 'checkbox' && f.type !== 'radio' && f.type !== 'range' && f.value && f.value.trim());
      wrap.addEventListener('pointerdown', (e) => { downOnWrap = e.target === wrap; });
      wrap.addEventListener('click', (e) => { if (e.target === wrap && downOnWrap && !hasDraft()) api.close(); });
    }
    panelsEl.appendChild(wrap);
    let closed = false;
    const api = {
      el: p, body: b, footer: f, title: t, closable,
      close() {
        if (closed) return; closed = true; wrap.remove();
        const i = panelStack.indexOf(api); if (i >= 0) panelStack.splice(i, 1);
        try { opts.onClose && opts.onClose(); } catch (e) { console.error(e); }
      },
      get closed() { return closed; },
    };
    panelStack.push(api);
    return api;
  },
  closeTop() { const p = panelStack[panelStack.length - 1]; if (p && p.closable) { p.close(); return true; } return false; },
  get panelOpen() { return panelStack.length > 0; },
  overlay: $('#overlay'),
};

// ---- Chiếu điểm 3D lên màn hình ----
const _proj = new V3();
G.ui.worldToScreen = (v, out = {}) => {
  _proj.copy(v).project(camera);
  out.x = (_proj.x * 0.5 + 0.5) * G.size.w; out.y = (-_proj.y * 0.5 + 0.5) * G.size.h;
  out.visible = _proj.z < 1 && _proj.z > -1 && out.x > -60 && out.x < G.size.w + 60 && out.y > -60 && out.y < G.size.h + 60;
  return out;
};

// ---- Bong bóng chữ (dùng cho khách hành hương AI) ----
const bubblesEl = $('#bubbles');
const bubblePool = [];
for (let i = 0; i < 7; i++) { const el = U.el('div', 'bubble'); bubblesEl.appendChild(el); bubblePool.push({ el, target: null, until: 0, y: 1.9, live: false }); }
const _bv = new V3(), _sc = {};
// target: Object3D | Vector3 | () => Vector3 ; trả về handle {done}
G.ui.bubble = (target, text, ms = 3800, yOff = 1.95) => {
  let b = bubblePool.find((x) => !x.live) || bubblePool.reduce((a, c) => (a.until < c.until ? a : c));
  b.target = target; b.el.textContent = text; b.until = G.time + ms / 1000; b.y = yOff; b.live = true;
  b.el.classList.add('on');
  return b;
};
G.ui.bubbleCount = () => bubblePool.filter((b) => b.live).length;
function updateBubbles() {
  for (const b of bubblePool) {
    if (!b.live) continue;
    if (G.time > b.until) { b.live = false; b.el.classList.remove('on'); continue; }
    const t = b.target;
    if (typeof t === 'function') _bv.copy(t()); else if (t && t.isObject3D) t.getWorldPosition(_bv); else if (t) _bv.copy(t);
    _bv.y += b.y;
    const d = _bv.distanceTo(camera.position);
    G.ui.worldToScreen(_bv, _sc);
    if (!_sc.visible || d > 34) { b.el.style.opacity = '0'; continue; }
    b.el.style.opacity = '';
    b.el.style.transform = `translate3d(${_sc.x.toFixed(1)}px,${_sc.y.toFixed(1)}px,0) translate(-50%,-100%)`;
  }
}

// =====================================================================
//  ĐIỀU KHIỂN: bàn phím, cần ảo, kéo xoay góc nhìn, chụm để thu phóng
// =====================================================================
const input = (G.input = { keys: new Set(), joyX: 0, joyY: 0, lastDrag: -10, enabled: true });
const MOVE_KEYS = { KeyW: 1, KeyA: 1, KeyS: 1, KeyD: 1, ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1 };
window.addEventListener('keydown', (e) => {
  const tag = (e.target && e.target.tagName) || '';
  const slider = tag === 'INPUT' && e.target.type === 'range';
  if ((tag === 'INPUT' && !slider) || tag === 'TEXTAREA') { if (e.code === 'Escape') e.target.blur(); return; }
  if (MOVE_KEYS[e.code] && !slider) { input.keys.add(e.code); e.preventDefault(); } // mũi tên trên thanh trượt: chỉnh âm lượng, không đi
  if (e.code === 'Escape') { if (!G.ui.closeTop()) G.events.emit('escape'); }
  if (e.repeat) return;
  if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
    const inPanel = e.target && e.target.closest && e.target.closest('.panel, #tut');
    if (tutOpen() || inPanel) return; // để nút đang được chọn tự xử lý phím
    if (G.activity.current || G.ui.panelOpen) { G.events.emit('key:action', e.code); if (e.code === 'Space') e.preventDefault(); return; }
    if (G.poi.current) { e.preventDefault(); triggerPoi(G.poi.current); }
  }
  if (e.code === 'KeyM') G.setMuted(!G.save.data.muted);
});
window.addEventListener('keyup', (e) => input.keys.delete(e.code));
window.addEventListener('blur', () => input.keys.clear());

const joyEl = $('#joy'), knobEl = $('#joyKnob');
const joy = { id: null, cx: 0, cy: 0, R: 52 };
const camPtrs = new Map();
let pinchD = 0;
function joyHome() { joyEl.style.left = ''; joyEl.style.top = ''; joyEl.style.bottom = ''; knobEl.style.transform = ''; joyEl.classList.remove('active'); }
canvas.addEventListener('pointerdown', (e) => {
  if (!G.started) return;
  canvas.focus({ preventScroll: true });
  const w = G.size.w, h = G.size.h;
  const isTouch = e.pointerType !== 'mouse';
  if (isTouch && !document.body.classList.contains('touch')) document.body.classList.add('touch');
  if (isTouch && joy.id === null && e.clientX < w * 0.44 && e.clientY > h * 0.42 && !G.activity.current) {
    joy.id = e.pointerId;
    const rad = 62;
    joy.cx = U.clamp(e.clientX, rad + 8, w * 0.44); joy.cy = U.clamp(e.clientY, h * 0.42, h - rad - 8);
    joyEl.style.left = joy.cx - rad + 'px'; joyEl.style.top = joy.cy - rad + 'px'; joyEl.style.bottom = 'auto';
    joyEl.classList.add('active');
    canvas.setPointerCapture(e.pointerId);
    moveJoy(e.clientX, e.clientY);
    return;
  }
  camPtrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  canvas.setPointerCapture(e.pointerId);
  if (camPtrs.size === 2) { const [a, b] = [...camPtrs.values()]; pinchD = Math.hypot(a.x - b.x, a.y - b.y); }
});
function moveJoy(x, y) {
  let dx = x - joy.cx, dy = y - joy.cy; const d = Math.hypot(dx, dy);
  if (d > joy.R) { dx *= joy.R / d; dy *= joy.R / d; }
  knobEl.style.transform = `translate(${dx}px,${dy}px)`;
  let jx = dx / joy.R, jy = -dy / joy.R; const m = Math.hypot(jx, jy);
  if (m < 0.12) { jx = 0; jy = 0; }
  input.joyX = jx; input.joyY = jy;
}
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerId === joy.id) { moveJoy(e.clientX, e.clientY); return; }
  const p = camPtrs.get(e.pointerId); if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  if (camPtrs.size >= 2) {
    const [a, b] = [...camPtrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchD > 0) G.cam.distT = U.clamp(G.cam.distT * (pinchD / d), 3.4, 11);
    pinchD = d; return;
  }
  if (G.cam.blend > 0.5) return;
  G.cam.yaw -= dx * 0.0062; G.cam.pitch = U.clamp(G.cam.pitch + dy * 0.0045, 0.05, 1.05);
  input.lastDrag = G.time;
});
function endPtr(e) {
  if (e.pointerId === joy.id) { joy.id = null; input.joyX = input.joyY = 0; joyHome(); }
  camPtrs.delete(e.pointerId); if (camPtrs.size < 2) pinchD = 0;
}
canvas.addEventListener('pointerup', endPtr);
canvas.addEventListener('pointercancel', endPtr);
canvas.addEventListener('lostpointercapture', endPtr);
canvas.addEventListener('wheel', (e) => { e.preventDefault(); G.cam.distT = U.clamp(G.cam.distT + e.deltaY * 0.006, 3.4, 11); }, { passive: false });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());

// Hướng di chuyển mong muốn (đã quy đổi theo góc máy quay): trả về {x, z, mag}
const _mv = { x: 0, z: 0, mag: 0 };
G.input.moveVector = () => {
  let ix = 0, iy = 0;
  const k = input.keys;
  if (k.has('KeyW') || k.has('ArrowUp')) iy += 1;
  if (k.has('KeyS') || k.has('ArrowDown')) iy -= 1;
  if (k.has('KeyA') || k.has('ArrowLeft')) ix -= 1;
  if (k.has('KeyD') || k.has('ArrowRight')) ix += 1;
  ix += input.joyX; iy += input.joyY;
  let m = Math.hypot(ix, iy); if (m > 1) { ix /= m; iy /= m; m = 1; }
  const y = G.cam.yaw, fx = Math.sin(y), fz = Math.cos(y), rx = -Math.cos(y), rz = Math.sin(y);
  _mv.x = fx * iy + rx * ix; _mv.z = fz * iy + rz * ix; _mv.mag = m;
  return _mv;
};

// =====================================================================
//  MÁY QUAY: theo sau lưng nhân vật, kéo để xoay, có chế độ "nhìn cận" cho hoạt động
// =====================================================================
const cam = (G.cam = {
  yaw: Math.PI, pitch: 0.42, dist: 7.2, distT: 7.2, blend: 0, blendT: 0, blendDur: 1,
  target: new V3(0, 1.3, 40), focusPos: new V3(), focusLook: new V3(), shakeT: 0, shakeA: 0, shakeD: 0.4,
  blockers: [], collDist: 99, baseFov: 52, focusFov: null,
  focus({ pos, look, dur = 1.1, fov }) { this.focusPos.set(pos[0], pos[1], pos[2]); this.focusLook.set(look[0], look[1], look[2]); this.focusFov = fov > 0 ? fov : null; this.blendT = 1; this.blendDur = dur; },
  release(dur = 0.9) { this.blendT = 0; this.blendDur = dur; },
  shake(a = 0.12, d = 0.4) { this.shakeA = a; this.shakeT = d; this.shakeD = d; },
  snapBehind() { this.yaw = G.player ? G.player.yaw : this.yaw; },
});
const _ray = new THREE.Ray(), _hit = new V3(), _fp = new V3(), _fl = new V3(), _fq = new V3(), _dir = new V3();
function updateCamera(dt) {
  const P = G.player;
  if (P) {
    cam.target.x = U.damp(cam.target.x, P.pos.x, 9, dt);
    cam.target.z = U.damp(cam.target.z, P.pos.z, 9, dt);
    cam.target.y = U.damp(cam.target.y, P.pos.y + 1.55, 7, dt);
    // tự xoay nhẹ ra sau lưng khi đang đi tới
    if (P.moving && G.time - input.lastDrag > 1.4 && cam.blend < 0.01) {
      const diff = Math.abs(U.angleDiff(cam.yaw, P.yaw));
      if (diff < 2.3) cam.yaw = U.angleDamp(cam.yaw, P.yaw, 1.1 * P.speedK, dt);
    }
  }
  // vừa bước ra khỏi điện: giữ giới hạn tới khi chính máy quay ra khỏi mái (đi ra lệch lối giữa thì máy quay không vọt lên xuyên đèn hoa sen).
  // Chỉ "giữ", không tự bật: đứng ngoài sát mái mà máy quay lơ lửng trên vùng mái thì không bị giật qua lại.
  cam.hallHold = !!P && (G.insideHall(P.pos.x, P.pos.z) || (cam.hallHold && G.insideHall(camera.position.x, camera.position.z)));
  const inHall = cam.hallHold;
  const maxD = inHall ? 4.6 : cam.distT;
  cam.dist = U.damp(cam.dist, Math.min(cam.distT, maxD), 5, dt);
  const pitch = inHall ? Math.min(cam.pitch, 0.42) : cam.pitch;
  const cp = Math.cos(pitch);
  _dir.set(-Math.sin(cam.yaw) * cp, Math.sin(pitch), -Math.cos(cam.yaw) * cp);
  // không để máy quay xuyên tường
  let want = cam.dist;
  _ray.origin.copy(cam.target); _ray.direction.copy(_dir);
  for (const b of cam.blockers) { if (_ray.intersectBox(b, _hit)) { const d = _hit.distanceTo(cam.target) - 0.3; if (d < want) want = Math.max(1.2, d); } }
  cam.collDist = want < cam.collDist ? U.damp(cam.collDist, want, 25, dt) : U.damp(cam.collDist, want, 4, dt);
  _fp.copy(cam.target).addScaledVector(_dir, cam.collDist);
  if (_fp.y < 0.4) _fp.y = 0.4;
  _fl.copy(cam.target); _fl.y += G.size.h > G.size.w ? 0.75 : 0.3; // nhìn hơi cao để nhân vật nằm thấp trong khung
  // pha trộn sang góc nhìn hoạt động
  const sp = 1 / Math.max(0.05, cam.blendDur);
  cam.blend = cam.blendT > cam.blend ? Math.min(cam.blendT, cam.blend + dt * sp) : Math.max(cam.blendT, cam.blend - dt * sp);
  const k = G.ease.inOut(cam.blend);
  if (k > 0) {
    // màn dọc hẹp ngang: lùi máy quay ra xa một chút để thấy đủ cảnh
    const asp = G.size.w / G.size.h, pull = asp < 1 ? U.clamp(0.66 / asp, 1, 1.5) : 1;
    _fq.copy(cam.focusPos).sub(cam.focusLook).multiplyScalar(pull).add(cam.focusLook);
    _fp.lerp(_fq, k); _fl.lerp(cam.focusLook, k);
  }
  // góc nhìn (fov): cùng hệ số pha trộn k với vị trí máy quay; thả máy quay thì về góc nhìn gốc
  const wantFov = cam.focusFov != null && k > 0 ? cam.baseFov + (cam.focusFov - cam.baseFov) * k : cam.baseFov;
  if (Math.abs(camera.fov - wantFov) > 1e-4) { camera.fov = wantFov; camera.updateProjectionMatrix(); }
  camera.position.copy(_fp);
  if (cam.shakeT > 0) {
    cam.shakeT -= dt; const a = cam.shakeA * Math.max(0, cam.shakeT / cam.shakeD);
    camera.position.x += (Math.random() - 0.5) * a; camera.position.y += (Math.random() - 0.5) * a;
  }
  camera.lookAt(_fl);
  camera.updateMatrixWorld();
}

// =====================================================================
//  ĐIỂM HOẠT ĐỘNG (POI) + NÚT HÀNH ĐỘNG + VÒNG SÁNG DƯỚI ĐẤT
// =====================================================================
const actionBtn = $('#actionBtn'), poiLabelsEl = $('#poiLabels');
const ringGeo = new THREE.RingGeometry(0.85, 1.12, 40); ringGeo.rotateX(-Math.PI / 2);
const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
const rings = new THREE.InstancedMesh(ringGeo, ringMat, 16); rings.count = 0; rings.frustumCulled = false; rings.renderOrder = 2;
scene.add(rings);
G.poi = {
  list: [], current: null, rings,
  // def: { id, label, icon, x, z, r, desc, onAction(poi), available()->bool }
  add(def) {
    const p = Object.assign({ r: 3, icon: 'dot', desc: '', enabled: true }, def);
    p.y = G.heightAt(p.x, p.z);
    const lab = U.el('div', 'plabel'); lab.innerHTML = G.icons[p.icon] || G.icons.dot; lab.appendChild(document.createTextNode(p.label));
    poiLabelsEl.appendChild(lab); p.labelEl = lab;
    this.list.push(p); rings.count = Math.min(16, this.list.length);
    return p;
  },
  get(id) { return this.list.find((p) => p.id === id); },
};
const tutOpen = () => !document.getElementById('tut').classList.contains('hidden');
function triggerPoi(p) {
  if (!p || G.activity.current || G.ui.panelOpen || tutOpen()) return;
  G.audio?.play?.('ui');
  try { p.onAction && p.onAction(p); } catch (e) { console.error(e); G.ui.toast('Có lỗi nhỏ, bạn thử lại nhé.'); }
}
actionBtn.addEventListener('click', () => triggerPoi(G.poi.current));
let shownPoi = null;
const _rm = new THREE.Matrix4(), _lv = new V3(), _ls = {};
function updatePoi() {
  const P = G.player; let best = null, bd = 1e9;
  const free = !G.activity.current && !G.ui.panelOpen && G.started;
  for (let i = 0; i < G.poi.list.length; i++) {
    const p = G.poi.list[i];
    const ok = p.enabled && (!p.available || p.available());
    const d = Math.hypot(P.pos.x - p.x, P.pos.z - p.z);
    if (free && ok && d < p.r && d < bd) { bd = d; best = p; }
    if (i < 16) {
      const s = 1 + Math.sin(G.time * 2.4 + i) * 0.08;
      _rm.makeScale(s, 1, s); _rm.setPosition(p.x, p.y + 0.04, p.z); rings.setMatrixAt(i, _rm);
    }
    // nhãn nổi
    _lv.set(p.x, p.y + 2.4, p.z);
    G.ui.worldToScreen(_lv, _ls);
    const vis = ok && _ls.visible && d < 26 && d > 1.2;
    if (vis) {
      p.labelEl.style.display = '';
      p.labelEl.style.opacity = String(U.clamp((26 - d) / 8, 0, 1) * (d < 3.2 ? 0.4 : 1));
      p.labelEl.style.transform = `translate3d(${_ls.x.toFixed(1)}px,${_ls.y.toFixed(1)}px,0) translate(-50%,-100%)`;
    } else p.labelEl.style.display = 'none';
  }
  rings.instanceMatrix.needsUpdate = true;
  rings.visible = !G.activity.current;
  G.poi.current = best;
  if (best !== shownPoi) {
    shownPoi = best;
    if (best) {
      actionBtn.querySelector('.ico').innerHTML = G.icons[best.icon] || G.icons.dot;
      actionBtn.querySelector('.lbl').textContent = best.label;
      actionBtn.classList.add('show');
    } else actionBtn.classList.remove('show');
  }
}

// ---- Khung hoạt động: khoá di chuyển, ẩn điều khiển, đổi góc máy ----
G.activity = {
  current: null,
  begin(name, opts = {}) {
    if (this.current) return false;
    this.current = name;
    G.player.lock(true); G.player.stopWalk();
    document.body.classList.add('in-activity');
    if (opts.cam) G.cam.focus(opts.cam);
    G.events.emit('activity:start', name);
    return true;
  },
  end() {
    const n = this.current; if (!n) return;
    this.current = null;
    G.player.lock(false); G.player.setPose('idle');
    G.cam.release();
    document.body.classList.remove('in-activity');
    G.events.emit('activity:end', n);
  },
};

// =====================================================================
//  BỘ ĐẾM "Hôm nay có … người lên chùa cầu an"
// =====================================================================
const visitorsB = () => $('#visitors b');
G.stats = {
  visitors: 0,
  add(n = 1) {
    this.visitors += n;
    const b = visitorsB(); b.textContent = U.fmt(this.visitors);
    b.classList.add('pop'); setTimeout(() => b.classList.remove('pop'), 260);
  },
  init() {
    const d = new Date(), seed = U.hash(U.todayKey());
    const minutes = Math.max(0, (d.getHours() - 5) * 60 + d.getMinutes());
    this.visitors = 640 + (seed % 520) + Math.round(Math.min(minutes, 17 * 60) * 1.35);
    visitorsB().textContent = U.fmt(this.visitors);
  },
};
let nextVisitorTick = 6;

// =====================================================================
//  ẢNH CHỤP CẢNH (dùng cho ảnh chia sẻ)
// =====================================================================
const snapCam = new THREE.PerspectiveCamera(48, 1, 0.1, 900);
// Trả về canvas w×h chụp cảnh chùa. opts.view: 'postcard' (toàn cảnh) | 'player' (góc nhìn hiện tại)
G.snapshot = (w, h, opts = {}) => {
  const out = document.createElement('canvas'); out.width = w; out.height = h;
  const ctx = out.getContext('2d');
  snapCam.aspect = w / h;
  if (opts.view === 'player') {
    snapCam.fov = 58; snapCam.position.copy(camera.position); snapCam.quaternion.copy(camera.quaternion);
  } else {
    snapCam.fov = 50; snapCam.position.set(34, 24, -40); snapCam.lookAt(-2, 9, -98); // nhìn chéo từ trên cao phía đông: Tích Thiện Am + sân chính điện phía trước, ba tầng nền đá trắng + thang rồng + chính điện ba tầng mái vàng phía sau
  }
  snapCam.updateProjectionMatrix(); snapCam.updateMatrixWorld();
  const pr = renderer.getPixelRatio();
  rings.visible = false;
  G.events.emit('snapshot:before', snapCam, h);
  try {
    renderer.setPixelRatio(1); renderer.setSize(w, h, false);
    renderer.render(scene, snapCam);
    ctx.drawImage(canvas, 0, 0, w, h);
  } finally {
    renderer.setPixelRatio(pr); renderer.setSize(G.size.w, G.size.h, false);
    rings.visible = true;
    G.events.emit('snapshot:after');
    renderer.render(scene, camera);
  }
  return out;
};

// =====================================================================
//  TẮT / BẬT TIẾNG + CÁC NÚT TRÊN THANH
// =====================================================================
G.setMuted = (m) => {
  G.save.data.muted = !!m; G.save.persist();
  try { G.audio?.setMuted?.(!!m); } catch (e) {}
  paintMute();
};
// loa hiện "tắt" khi tắt tiếng hoặc kênh Âm lượng chung đang tắt / ở 0
const silentAll = () => G.save.data.muted || G.sound.gain('master') === 0;
function paintMute() {
  const off = silentAll();
  $('#btnMute').innerHTML = off ? G.icons.mute : G.icons.sound;
  $('#btnMute').setAttribute('aria-label', off ? 'Bật tiếng' : 'Tắt tiếng');
}
paintMute();
G.events.on('sound:change', paintMute);
$('#btnMap').innerHTML = G.icons.map;
$('#btnSound').innerHTML = G.icons.mixer;
$('#btnBook').innerHTML = G.icons.book;
$('#btnShare').innerHTML = G.icons.share;
$('#btnHelp').innerHTML = G.icons.help;
$('#btnMute').onclick = () => {
  // đang im vì Âm lượng chung tắt / về 0 (chứ không phải nút loa): bật lại kênh đó thay vì tắt tiếng thêm lần nữa
  if (!G.save.data.muted && G.sound.gain('master') === 0) { G.sound.set('master', { on: true, v: G.sound.get('master').v || 70 }); return; }
  G.setMuted(!G.save.data.muted);
};
$('#btnHelp').onclick = () => { if (!G.activity.current) showTutorial(); };
$('#btnMap').onclick = () => { if (!G.activity.current && !G.ui.panelOpen) openMap(); };
$('#btnSound').onclick = () => { if (!G.activity.current && !G.ui.panelOpen) openSound(); };
$('#btnBook').onclick = () => { if (G.activity.current || G.ui.panelOpen) return; G.audio?.play?.('ui'); if (!G.events.m.get('ui:book')?.length) G.ui.toast('Sổ cầu an đang được chuẩn bị.'); G.events.emit('ui:book'); };
$('#btnShare').onclick = () => { if (G.activity.current || G.ui.panelOpen) return; G.audio?.play?.('ui'); if (!G.events.m.get('ui:share')?.length) G.ui.toast('Tính năng chia sẻ đang được chuẩn bị.'); G.events.emit('ui:share'); };

// ---- Cài đặt âm thanh: mỗi kênh một công tắc + thanh trượt âm lượng ----
function openSound() {
  const box = U.el('div', 'col snd');
  // đang tắt tiếng chung (nút loa / phím M): nhắc và cho bật lại ngay tại đây; tự cập nhật khi đổi
  const note = U.el('div', 'snd-note');
  const unmute = U.el('button', 'chip', 'Bật tiếng'); unmute.type = 'button';
  unmute.onclick = () => G.setMuted(false);
  note.append(U.el('span', null, 'Đang tắt toàn bộ tiếng.'), unmute); box.appendChild(note);
  const paintNote = () => { note.hidden = !G.save.data.muted; };
  paintNote();
  const offMute = G.events.on('audio:mute', paintNote);
  const paints = [];
  for (const [k, label, hint] of G.sound.cats) {
    const row = U.el('div', 'snd-row');
    const head = U.el('div', 'snd-h'), txt = U.el('div', 'snd-t');
    txt.append(U.el('div', 'snd-l', label), U.el('div', 'small muted', hint));
    const sw = U.el('button', 'snd-sw'); sw.type = 'button'; sw.setAttribute('role', 'switch'); sw.setAttribute('aria-label', label);
    head.append(txt, sw);
    const line = U.el('div', 'snd-line');
    const r = document.createElement('input');
    r.type = 'range'; r.min = '0'; r.max = '100'; r.step = '1'; r.setAttribute('aria-label', k === 'master' ? label : 'Âm lượng ' + label.toLowerCase());
    const val = U.el('span', 'snd-v');
    line.append(r, val); row.append(head, line); box.appendChild(row);
    const paint = () => {
      const c = G.sound.get(k);
      row.classList.toggle('off', !c.on); sw.classList.toggle('on', c.on); sw.setAttribute('aria-checked', String(c.on));
      r.value = String(c.v); r.style.setProperty('--p', c.v + '%'); val.textContent = c.v + '%';
    };
    sw.onclick = () => {
      const on = !G.sound.get(k).on;
      G.sound.set(k, { on }); paint();
      if (on) setTimeout(() => G.audio?.preview?.(k), 160); // bật lên mới nghe thử (đợi kênh to lại); tắt thì im luôn
    };
    let tm = 0;
    r.oninput = () => { G.sound.set(k, { v: +r.value, on: true }, false); paint(); }; // kéo thanh trượt thì tự bật kênh
    r.onchange = () => { clearTimeout(tm); tm = setTimeout(() => { G.save.persist(); G.audio?.preview?.(k); }, 250); }; // giữ phím mũi tên: lưu + nghe thử một lần
    paints.push(paint); paint();
  }
  const pan = G.ui.panel({
    title: 'Cài đặt âm thanh', body: box, onClose: offMute,
    actions: [{ label: 'Mặc định', onClick: () => { G.sound.reset(); paints.forEach((f) => f()); } }, { label: 'Xong', primary: true }],
  });
  pan.el.tabIndex = -1; pan.el.focus({ preventScroll: true }); // đưa bàn phím / trình đọc màn hình vào bảng
}

// ---- Bản đồ chùa: chạm để tự đi tới ----
function openMap() {
  const box = U.el('div', 'col');
  // chọn tốc độ đi của nhân vật
  const sp = U.el('div', 'row'); sp.style.cssText = 'justify-content:space-between;flex-wrap:wrap';
  const spLab = U.el('div', 'small muted', 'Tốc độ đi'); const chips = U.el('div', 'chips');
  for (const [k, name] of [['cham', 'Chậm'], ['vua', 'Vừa'], ['nhanh', 'Nhanh']]) {
    const c = U.el('button', 'chip' + ((G.save.data.walkSpeed || 'vua') === k ? ' on' : ''), name); c.type = 'button';
    c.onclick = () => {
      G.save.data.walkSpeed = k; G.save.persist(); G.audio?.play?.('ui');
      chips.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === c));
    };
    chips.appendChild(c);
  }
  sp.append(spLab, chips); box.appendChild(sp);
  const places = [...G.poi.list.filter((p) => p.enabled).map((p) => ({ label: p.label, desc: p.desc, icon: p.icon, x: p.x, z: p.z, place: 'chỗ ' + p.label.toLowerCase() }))];
  if (G.world && G.world.places) places.push(...G.world.places.map((p) => Object.assign({ place: p.label }, p)));
  for (const pl of places) {
    const b = U.el('button', 'btn'); b.style.justifyContent = 'flex-start'; b.style.textAlign = 'left';
    const ic = U.el('span'); ic.innerHTML = G.icons[pl.icon] || G.icons.dot; ic.style.cssText = 'width:26px;height:26px;display:grid;place-items:center;flex:none';
    ic.firstChild && (ic.firstChild.style.cssText = 'width:22px;height:22px;fill:none;stroke:#f7d793;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round');
    const tx = U.el('span'); const t1 = U.el('div', null, pl.label); t1.style.fontWeight = '700';
    const t2 = U.el('div', 'small muted', pl.desc || ''); t2.style.fontWeight = '400'; tx.append(t1, t2);
    b.append(ic, tx);
    b.onclick = () => {
      pan.close(); G.ui.toast('Đang đi tới ' + pl.place + '…', 1800);
      G.player.walkTo(pl.x, pl.z).then((ok) => { if (ok) G.audio?.play?.('ui'); });
    };
    box.appendChild(b);
  }
  const pan = G.ui.panel({ title: 'Bản đồ chùa', body: box });
  const n = U.el('div', 'note', G.isTouch ? 'Chạm vào một nơi để nhân vật tự đi tới. Kéo cần điều khiển để dừng.' : 'Bấm vào một nơi để nhân vật tự đi tới. Nhấn W A S D để dừng.'); n.style.marginTop = '10px';
  box.appendChild(n);
}
G.openMap = openMap;

// =====================================================================
//  HƯỚNG DẪN 3 BƯỚC
// =====================================================================
const TUT = [
  { t: 'Đi lại', p: G.isTouch ? 'Kéo cần điều khiển ở góc trái để đi. Kéo vào khoảng trống trên màn hình để xoay góc nhìn, chụm hai ngón để thu phóng.' : 'Dùng W A S D hoặc phím mũi tên để đi. Giữ chuột và kéo để xoay góc nhìn, lăn chuột để thu phóng.',
    i: '<svg viewBox="0 0 120 80"><circle cx="40" cy="44" r="28" fill="none" stroke="#f7d793" stroke-width="3" opacity=".6"/><circle cx="52" cy="34" r="12" fill="#e8b85c"/><path d="M80 44h26M98 36l8 8-8 8" stroke="#f7d793" stroke-width="3" fill="none" stroke-linecap="round"/></svg>' },
  { t: 'Tới gần nơi có vòng sáng', p: 'Lư hương, gác chuông, chính điện, cây bồ đề, hồ sen và bàn xin quẻ đều có một hoạt động nhỏ. Biểu tượng bản đồ ở góc trên giúp bạn tự đi tới.',
    i: '<svg viewBox="0 0 120 80"><ellipse cx="60" cy="62" rx="40" ry="10" fill="none" stroke="#ffd27a" stroke-width="3"/><path d="M48 60V30l12-10 12 10v30" fill="#b8322a"/><path d="M40 32h40l-20-16z" fill="#a7422c"/></svg>' },
  { t: 'Chạm nút hành động', p: G.isTouch ? 'Khi tới gần, một nút to màu vàng hiện ở góc phải. Chạm một lần là bắt đầu.' : 'Khi tới gần, một nút to màu vàng hiện ở góc phải. Bấm nút đó hoặc phím E là bắt đầu.',
    i: '<svg viewBox="0 0 120 80"><rect x="18" y="22" width="84" height="38" rx="19" fill="#e8b85c" stroke="#fff3cf" stroke-width="3"/><circle cx="40" cy="41" r="11" fill="#fff" opacity=".5"/><rect x="56" y="36" width="34" height="9" rx="4" fill="#2f1a0f" opacity=".8"/></svg>' },
];
let tutStep = 0;
function renderTut() {
  const box = $('#tut'), s = TUT[tutStep];
  box.querySelectorAll('.dots i').forEach((d, i) => d.classList.toggle('on', i === tutStep));
  box.querySelector('.ill').innerHTML = s.i;
  box.querySelector('.step').textContent = 'Bước ' + (tutStep + 1) + ' / 3';
  box.querySelector('h3').textContent = s.t;
  box.querySelector('p').textContent = s.p;
  $('#tutNext').textContent = tutStep === 2 ? 'Bắt đầu' : 'Tiếp';
}
function showTutorial() { tutStep = 0; renderTut(); $('#tut').classList.remove('hidden'); }
function closeTutorial() { $('#tut').classList.add('hidden'); if (!G.save.data.tutorialDone) { G.save.data.tutorialDone = true; G.save.persist(); } }
$('#tutNext').onclick = () => { G.audio?.play?.('ui'); if (tutStep < 2) { tutStep++; renderTut(); } else closeTutorial(); };
$('#tutSkip').onclick = () => { G.audio?.play?.('ui'); closeTutorial(); };
G.showTutorial = showTutorial;

// =====================================================================
//  MÀN CHÀO + VÀO CHÙA
// =====================================================================
const nameInput = $('#nameInput'), enterBtn = $('#enterBtn'), nameErr = $('#nameErr');
if (G.save.data.name) nameInput.value = G.save.data.name;
function enterTemple() {
  if (enterBtn.disabled) return;
  const name = G.text.cleanName(nameInput.value) || 'Phật tử';
  if (G.text.hasBad(name)) { nameErr.textContent = 'Bạn chọn một cái tên nhẹ nhàng hơn nhé.'; return; }
  nameErr.textContent = '';
  // Lần chạm này cũng dùng để bật âm thanh
  try { G.audio?.init?.(); G.audio?.setMuted?.(G.save.data.muted); } catch (e) { console.error(e); }
  const d = G.save.data;
  d.name = name; d.visits = (d.visits || 0) + 1; if (!d.firstAt) d.firstAt = new Date().toISOString();
  G.save.persist();
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
  G.player.setName(name);
  nameInput.blur();
  $('#splash').classList.add('out'); setTimeout(() => $('#splash').classList.add('hidden'), 800);
  $('#hud').classList.remove('hidden');
  G.started = true;
  G.stats.add(1);
  // máy quay lượn từ trên cao xuống sau lưng nhân vật
  cam.focusPos.set(0, 15, 60); cam.focusLook.set(0, 4, 8); cam.blend = 1; cam.blendT = 1;
  setTimeout(() => cam.release(3.2), 250);
  G.events.emit('enter', name);
  setTimeout(() => { if (!G.save.data.tutorialDone) showTutorial(); else G.ui.toast('Chào mừng ' + name + ' trở lại Chùa An Lạc 🙏'); }, 3300);
  setTimeout(() => { const k = $('#keysHint'); if (k) k.style.opacity = '0'; }, 14000);
}
enterBtn.addEventListener('click', enterTemple);
nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') enterTemple(); });

// =====================================================================
//  VÒNG LẶP CHÍNH
// =====================================================================
const clock = new THREE.Clock();
G.time = 0; G.dt = 0;
const updaters = [];
// đăng ký hàm cập nhật mỗi khung: fn(dt, time); order nhỏ chạy trước
G.onUpdate = (fn, order = 0) => { updaters.push({ fn, order }); updaters.sort((a, b) => a.order - b.order); };
const errOnce = new Set();
let frameAcc = 0;
// vẽ một khung: 07-hau-ky.js thay hàm này để đi qua chuỗi hậu kỳ khi ở trong chính điện; mặc định vẽ thẳng
G.renderFrame = (cam = camera) => renderer.render(scene, cam);
function frame() {
  requestAnimationFrame(frame);
  frameAcc += clock.getDelta();
  if (frameAcc < 0.0105) return; // màn 120/144 Hz: vẽ cách khung cho đỡ nóng máy
  const raw = frameAcc; frameAcc = 0;
  tick(Math.min(raw, 0.1));
  qualityTick(raw);
}
// chạy thử nhanh khi khung trình duyệt bị ẩn (dùng lúc kiểm tra)
G.debugStep = (sec, dt = 1 / 30) => { for (let t = 0; t < sec; t += dt) tick(dt); };
function tick(dt) {
  G.time += dt; G.dt = dt;
  updateTweens(dt);
  for (let i = 0; i < updaters.length; i++) {
    try { updaters[i].fn(dt, G.time); } catch (e) { if (!errOnce.has(updaters[i].fn)) { errOnce.add(updaters[i].fn); console.error(e); G.errors.push(String(e)); } }
  }
  if (G.started && (nextVisitorTick -= dt) < 0) { nextVisitorTick = U.rand(5, 13); G.stats.add(1); }
  G.renderFrame(camera);
}
G.onUpdate(updateCamera, 50);
G.onUpdate(() => { if (G.player) updatePoi(); updateBubbles(); }, 80);

G.start = () => {
  G.nav.build();
  G.stats.init();
  resize();
  renderer.shadowMap.needsUpdate = true;
  if (G.player) { cam.target.set(G.player.pos.x, 1.55, G.player.pos.z); cam.yaw = G.player.yaw; }
  // dựng trước shader để lúc vào chùa không bị giật
  try { renderer.compile(scene, camera); } catch (e) {}
  requestAnimationFrame(frame);
  clearTimeout(window.__bootTimer); clearTimeout(window.__bootTimer2);
  enterBtn.disabled = false; enterBtn.textContent = 'Vào chùa';
};
