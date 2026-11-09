// =====================================================================
//  ĐI CHÙA CHUNG (module 22): nhiều người cùng dạo chùa, cùng ngồi thiền qua kết nối NGANG HÀNG (WebRTC).
//  Thư viện: Trystero 0.26.0 (MIT, import map "trystero" → jsDelivr +esm, ghim đúng phiên bản; chỉ tải khi người chơi BẬT công tắc,
//  tắt mặc định nên người không dùng không tải thêm byte nào). Đây là NGOẠI LỆ duy nhất của luật "không tài sản ngoài" (xem src/API.md).
//  Chiến lược tìm nhau: NOSTR (mặc định của Trystero). Lý do: không cần khoá API hay tài khoản (Supabase / Firebase cần), không cần máy chủ
//  riêng (ws-relay cần); Trystero 0.26 kèm danh sách 29 relay công cộng, trò chơi dùng 8 relay cùng lúc (RELAYS, chọn theo appId); relay chỉ chuyển "lời mời
//  kết nối" đã mã hoá (AES-GCM, khoá suy từ appId + tên phòng) rồi hai trình duyệt nói chuyện thẳng với nhau qua WebRTC. ICE: STUN mặc định
//  của Trystero (stun.l.google.com / stun1 / stun2 và stun.cloudflare.com), KHÔNG có TURN. Không có máy chủ nào của trò chơi.
//  Chia sẻ: tên hiển thị (≤ 20 ký tự, đã lọc), vị trí x/z + độ cao + hướng, tư thế / hoạt động đang làm (thắp hương, thỉnh chuông, gõ mõ,
//  ngồi tụng kinh / thiền + chỉ số bồ đoàn), 3 cử chỉ đặt sẵn (chắp tay, cúi chào, vẫy tay) — 10 lần/giây khi có thay đổi — và LỜI NÓI
//  gõ tự do (người dùng quyết định 2026-11-08): ≤ 60 ký tự Unicode, 1 câu / 2 giây (áp ở CẢ phía gửi lẫn phía nhận), lọc từ thô → "•••"
//  (bắt cả dạng không dấu, chữ lặp, chèn dấu chấm / khoảng trắng / ký tự vô hình), chặn hẳn câu có địa chỉ web hay dãy ≥ 8 chữ số,
//  nút "Ẩn người này" (theo phiên, không lưu), công tắc "Tắt mọi bong bóng chat". Bong bóng dùng chung hệ G.ui.bubble của khách AI (textContent).
//  Phía nhận là hàng rào thật: gói sai kiểu / quá dài bị bỏ trước mọi xử lý, hạn mức theo từng người (trạng thái 25/giây, cử chỉ 2/giây,
//  lời 1 / 2 giây, đổi tên 1 / 30 giây), tối đa 48 người theo dõi, Trystero nhận tối đa 16 KiB một gói (maxReceiveBytes).
//  Không lưu lịch sử chat; chỉ giữ bộ đếm và một nhật ký ngắn (≤ 80 dòng) trong bộ nhớ để gỡ lỗi — không ghi xuống máy, mất khi tải lại.
//  Lưu: G.save.data.chung = { on, code, muteChat } (chỉ tạo khi người chơi bật hoặc nhập mã). API: G.chung (cuối tệp). Bảng cài đặt: 'ui:settings'.
// =====================================================================
function installDiChuaChung(G) {
  const { THREE, util: U, scene } = G;
  if (!G.player || !G.chibi || !G.assets || !G.save || !G.ui || !G.events) return;
  const V3 = THREE.Vector3, M4 = THREE.Matrix4, PI = Math.PI, TAU = PI * 2;
  const P = G.player, geos = G.chibi.geos, LY = G.chibi.layout;
  const HIP = LY.hipY, NECK = LY.neckY, SHX = LY.shoulderX, SHY = LY.shoulderY;
  const clamp = U.clamp, damp = U.damp;
  const now = () => performance.now() / 1000;

  // ---------- Hằng số ----------
  const APP_ID = 'len-chua-cau-an';           // định danh ứng dụng trong Trystero (chung cho mọi người chơi)
  const ROOM = 'chua-an-lac-1';               // phòng công khai cố định; mã nhóm riêng nối thêm "-<mã>"
  const MAX_SHOW = 16;                        // số người hiển thị tối đa
  const MAX_PEERS = 48;                       // số người theo dõi tối đa (quá thì bỏ qua gói của người mới)
  const MAX_RECV = 16384;                     // Trystero: gói nhận tối đa (byte) — cũng là trần cho gói "signal" nội bộ (SDP vài KB), nên không đặt nhỏ hơn
  const RELAYS = 8;                           // số relay Nostr dùng cùng lúc (mặc định 5 trong danh sách 29): thêm điểm hẹn chung để hai bên tìm thấy nhau sớm hơn
  const SEND_HZ = 10, HEARTBEAT = 1.0;        // gửi khi có thay đổi (≤ 10 lần/giây), ít nhất 1 lần/giây để báo còn đó
  const ST_RATE = 25, GE_GAP = 0.5;           // phía nhận: trạng thái > 25 gói/giây → bỏ; cử chỉ cách nhau < 0,5 giây → bỏ
  const NAME_GAP = 30;                        // đổi tên hiển thị tối đa 1 lần / 30 giây mỗi người
  const LIM = { id: 64, n: 40, a: 32, p: 16, t: 240, g: 8 }; // độ dài (đơn vị UTF-16) tối đa của từng trường; vượt là bỏ cả gói
  const STALE_S = 5, DROP_S = 30, FADE_RATE = 0.5; // > 5 giây không tin → mờ dần (2 giây), > 30 giây → gỡ
  const SEAT_LIFT = 0.17;                     // ngồi cao hơn mặt bồ đoàn một chút (giống module 45)
  const CHAT_MAX = 60, CHAT_GAP = 2.0, CHAT_RUN = 20; // lời nói: ≤ 60 ký tự Unicode, 1 câu / 2 giây, chèn khoảng trắng vào chuỗi > 20 ký tự liền
  const ROBES = [0xe0b85a, 0xd7a447, 0xe8c56e, 0xcf9a3c, 0xe3bd63, 0xd9ab50, 0xdcb24f, 0xe6c070]; // áo vàng nhạt, mỗi người một sắc
  const SKIN = 0xf3c9a0, HAIR = 0x2a1d16, SHOE = 0x4a3426;
  const POSES = new Set(['idle', 'pray', 'bow', 'incense', 'offer', 'strike', 'sit', 'sitPray', 'sitMo', 'shake', 'write', 'release', 'wave']);
  const GEST = { pray: { label: 'Chắp tay', dur: 3.0, key: 'Digit1' }, bow: { label: 'Cúi chào', dur: 2.6, key: 'Digit2' }, wave: { label: 'Vẫy tay', dur: 2.4, key: 'Digit3' } };
  const isGest = (g) => typeof g === 'string' && g.length <= LIM.g && Object.prototype.hasOwnProperty.call(GEST, g); // thuộc tính RIÊNG: 'constructor' / '__proto__' không lọt (không dùng Object.hasOwn: cần Chrome 93, README hứa 89+)
  const seats = (G.world && G.world.seats) || (G.spots && G.spots.hallSeats) || [];
  const tutOpen = () => { const t = document.getElementById('tut'); return !!t && !t.classList.contains('hidden'); };

  // ---------- Cài đặt lưu trên máy: ĐỌC không tạo khoá (người chưa từng bật không có gì thêm trong save), GHI mới tạo ----------
  const cleanCode = (s) => G.text.strip(String(s || '')).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24);
  const DEF_CHUNG = Object.freeze({ on: false, code: '', muteChat: false });
  function cfgRead() { const c = G.save.data.chung; return c && typeof c === 'object' ? c : DEF_CHUNG; }
  const isOn = () => !!cfgRead().on, codeOf = () => cleanCode(cfgRead().code), isMuted = () => !!cfgRead().muteChat;
  function cfgWrite() {
    const d = G.save.data;
    if (!d.chung || typeof d.chung !== 'object') d.chung = { on: false, code: '', muteChat: false };
    const c = d.chung; c.on = !!c.on; c.code = cleanCode(c.code); c.muteChat = !!c.muteChat;
    return c;
  }
  const persist = () => { try { G.save.persist(); } catch (e) { /* không lưu được thì thôi */ } };
  const myName = () => G.text.cleanName(P.name || G.save.data.name) || 'Phật tử';

  // =====================================================================
  //  LỜI NÓI: làm sạch, lọc từ thô, chặn địa chỉ web / dãy số — áp ở CẢ phía gửi (người gõ thấy ngay) lẫn phía nhận (hàng rào thật)
  // =====================================================================
  // Từ thô bị thay bằng "•••" — HAI tầng, bạn tự thêm vào đây:
  // 1) TU_THO: so khớp ĐÚNG DẤU (chữ thường), chấp nhận chữ lặp "lồnnn" và tối đa 2 ký tự chèn giữa các chữ "l.ồ.n", "l ồ n". Từ ngắn như
  //    lồn / cặc / đĩ / đụ / đéo / cứt / buồi chỉ bắt khi có dấu: bỏ dấu sẽ bắt nhầm "lon ton", "các bạn", "đi chùa", "du lịch", "đeo kính", "buổi sáng".
  const TU_THO = [
    'lồn', 'cặc', 'buồi', 'địt', 'đụ', 'đéo', 'đĩ', 'cứt', 'đồ chó', 'chó chết', 'óc chó', 'chó đẻ', 'mẹ mày', 'bố mày', 'con mẹ mày', 'thằng ngu',
    'đồ ngu', 'khốn nạn', 'khốn kiếp', 'thằng khốn', 'con khốn', 'mả mẹ', 'mẹ kiếp', 'chết mẹ', 'mất dạy', 'cờ hó', 'hiếp dâm', 'dâm đãng', 'đồ dâm',
    'gái phò', 'con phò', 'đù má', 'đụ má', 'địt mẹ', 'đéo mẹ', 'đầu buồi', 'ngu như chó', 'đồ điên', 'đồ khùng', 'thằng điên', 'con điên',
  ];
  // 2) TU_THO_KHONG_DAU: so khớp trên chuỗi ĐÃ BỎ DẤU (viết thường, không dấu) — chỉ đưa vào những chuỗi không trùng lời thường. KHÔNG đưa:
  //    'lon', 'cac', 'di', 'du', 'deo', 'cut', 'buoi', 'dau buoi' (đầu buổi lễ), 'dam dang' (đảm đang), 'mat day' (mặt dày), 'du ma' (dù mà),
  //    'cho de' (cho dễ), 'do ngu' (đồ ngủ), 'oc cho' (ốc cho), 'con pho' (con phố). Riêng 'dm' và 'dit' đứng một mình KHÔNG có ở đây nhưng vẫn bị
  //    bộ lọc của lõi (G.text.hasBad, dùng chung cho ô tên và lời cầu an) che qua maskHasBad — không sửa lõi vì ảnh hưởng người không bật chế độ này.
  const TU_THO_KHONG_DAU = [
    // tiếng Việt không dấu / tiếng lóng
    'dit me', 'ditme', 'dit con me', 'djt', 'dmm', 'dcm', 'dkm', 'dcl', 'vcl', 'vkl', 'vcc', 'clgt', 'clm', 'cmm', 'cmn', 'cml', 'loz',
    'cho chet', 'khon nan', 'khon kiep', 'thang ngu', 'ngu nhu cho', 'hiep dam',
    // tiếng Anh cơ bản
    'fuck', 'fucking', 'fucker', 'motherfucker', 'shit', 'bullshit', 'bitch', 'cunt', 'asshole', 'dick', 'pussy', 'bastard', 'whore', 'slut',
    'porn', 'nigger', 'faggot',
  ];
  const SEP = '[^\\p{L}\\p{N}]{0,2}'; // tối đa 2 ký tự chèn giữa hai chữ (dấu chấm, khoảng trắng, gạch…)
  const mkBadRe = (letters) => (letters.length ? new RegExp('(?<![\\p{L}\\p{N}])' + letters.map((c) => c + '+').join(SEP) + '(?![\\p{L}\\p{N}])', 'giu') : null);
  const BAD_RE_DAU = TU_THO.map((w) => mkBadRe(Array.from(w.normalize('NFC').toLowerCase()).filter((c) => /\p{L}/u.test(c)))).filter(Boolean);
  const BAD_RE_KHONG_DAU = TU_THO_KHONG_DAU.map((w) => mkBadRe(G.text.strip(w).toLowerCase().replace(/[^a-z0-9]/g, '').split(''))).filter(Boolean);
  // ký tự vô hình / dấu kết hợp rời / ký tự độn (Hangul filler, braille trống, variation selector) — bỏ trước khi so khớp để không chèn được vào giữa từ
  const JUNK_RE = /[\p{Cf}\p{Mn}\p{Me}ㅤᅟᅠ⠀︀-️]/gu;
  // địa chỉ web: giao thức, www., hoặc "nhãn.đuôi" chung với nhãn và đuôi chỉ gồm ASCII (bit.ly, discord.gg, t.me…), so trên chuỗi gốc chữ thường (NFC)
  // để "ch.ết", "s.ống" không bị coi là tên miền; "T.P.HCM" viết liền vẫn bị chặn — giới hạn đã biết, ghi trong tài liệu
  const URL_RE = /(https?:\/\/|wss?:\/\/|ftp:\/\/|www\.|(?<![a-z0-9])[a-z0-9-]+\.[a-z]{2,6}(?![a-z]))/i;
  const DIGIT_SEP_RE = /(\d)[ .,\/\-_()]+(?=\d)/g, DIGITS_RE = /\d{8,}/; // ≥ 8 chữ số sau khi bỏ dấu phân cách (cách, chấm, phẩy, gạch, gạch chéo, ngoặc)
  // hai bản chuẩn hoá 1:1 theo đơn vị UTF-16 (độ dài không đổi, nên chỉ số khớp quay về chuỗi gốc được): chữ thường giữ dấu, và bỏ dấu
  function lowChars(str) { let o = ''; for (let i = 0; i < str.length; i++) { const c = str[i].toLowerCase(); o += c.length === 1 ? c : str[i]; } return o; }
  function normChars(str) { let o = ''; for (let i = 0; i < str.length; i++) { const c = G.text.strip(str[i]).toLowerCase(); o += c.length ? c[0] : str[i]; } return o; }
  function cleanChat(v) { // NFKC, bỏ ký tự vô hình / độn, ≤ 60 ký tự Unicode, gộp khoảng trắng, bỏ ký tự điều khiển, chèn khoảng trắng vào chuỗi > 20 ký tự liền
    let t = String(v == null ? '' : v).slice(0, LIM.t).normalize('NFKC').replace(JUNK_RE, '');
    t = G.text.cleanText(t, CHAT_MAX).replace(/\s+/g, ' ').trim();
    t = t.replace(new RegExp('\\S{' + CHAT_RUN + '}(?=\\S)', 'gu'), '$& ');
    return Array.from(t).slice(0, CHAT_MAX).join('').trim();
  }
  function maskHasBad(str) { // bộ lọc của lõi (G.text.hasBad) bắt thêm dạng dính "fuckyou", "ditmemay": che từng từ, không tách được thì che cả câu
    if (!G.text.hasBad(str)) return str;
    const parts = str.split(' ');
    let any = false;
    for (let i = 0; i < parts.length; i++) if (parts[i] && G.text.hasBad(parts[i])) { parts[i] = '•••'; any = true; }
    const out = parts.join(' ').replace(/(?:•••\s*){2,}/g, '••• ').trim();
    return any && !G.text.hasBad(out) ? out : '•••';
  }
  // Trả về chữ đã lọc (từ thô → "•••") hoặc null nếu phải chặn hẳn (địa chỉ web, dãy số dài, rỗng). str phải đã qua cleanChat (hoặc là tên ngắn).
  function filterChat(str) {
    if (!str) return null;
    const norm = normChars(str), low = lowChars(str);
    if (URL_RE.test(low) || DIGITS_RE.test(norm.replace(DIGIT_SEP_RE, '$1'))) return null;
    const keep = new Array(str.length).fill(true); let hit = false;
    const scan = (res, text) => {
      for (let k = 0; k < res.length; k++) {
        const re = res[k]; re.lastIndex = 0; let m;
        while ((m = re.exec(text)) !== null) { hit = true; for (let i = m.index; i < m.index + m[0].length; i++) keep[i] = false; if (!m[0].length) re.lastIndex++; }
      }
    };
    scan(BAD_RE_DAU, low); scan(BAD_RE_KHONG_DAU, norm);
    let out = str;
    if (hit) {
      out = ''; let inBad = false;
      for (let i = 0; i < str.length; i++) { if (keep[i]) { out += str[i]; inBad = false; } else if (!inBad) { out += '•••'; inBad = true; } }
      out = out.replace(/\s+/g, ' ').trim();
    }
    return maskHasBad(out) || null;
  }

  // =====================================================================
  //  LỚP VẼ: InstancedMesh cho 16 người (dựng khi bật lần đầu; không bật thì không tốn gì)
  // =====================================================================
  let built = false;
  const meshes = [];
  let mShadow, mBody, mHead, mHair, mFace, mArms, mHands, mFeet, mLegs;
  const tags = new Array(MAX_SHOW).fill(null); // bảng tên: { canvas, tex, sprite, name }
  const ZERO = new M4().makeScale(0, 0, 0);
  const WHITE = new THREE.Color(1, 1, 1), _col = new THREE.Color();
  function mk(geo, mat, cap, colored) {
    const m = new THREE.InstancedMesh(geo, mat, cap);
    m.frustumCulled = false; m.castShadow = false; m.receiveShadow = false;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < cap; i++) m.setMatrixAt(i, ZERO);
    if (colored) { for (let i = 0; i < cap; i++) m.setColorAt(i, WHITE); m.instanceColor.setUsage(THREE.DynamicDrawUsage); }
    m.count = 0; m.name = 'chung:' + (geo.name || 'phan');
    scene.add(m); meshes.push(m);
    return m;
  }
  function ensureMeshes() {
    if (built) return;
    built = true;
    const mats = {
      robe: new THREE.MeshLambertMaterial({ flatShading: true }),
      skin: new THREE.MeshLambertMaterial({ color: SKIN }),
      hair: new THREE.MeshLambertMaterial({ color: HAIR }),
      face: new THREE.MeshBasicMaterial({ vertexColors: true }),
      shoe: new THREE.MeshLambertMaterial({ color: SHOE }),
      shadow: G.assets.blobMat.clone(),
    };
    mShadow = mk(G.assets.blobGeo, mats.shadow, MAX_SHOW, false); mShadow.renderOrder = 1;
    mBody = mk(geos.body, mats.robe, MAX_SHOW, true);
    mHead = mk(geos.head, mats.skin, MAX_SHOW, false);
    mHair = mk(geos.hairShort, mats.hair, MAX_SHOW, false);
    mFace = mk(geos.face, mats.face, MAX_SHOW, false);
    mArms = mk(geos.arm, mats.robe, MAX_SHOW * 2, true);
    mHands = mk(geos.hand, mats.skin, MAX_SHOW * 2, false);
    mFeet = mk(geos.foot, mats.shoe, MAX_SHOW * 2, false);
    mLegs = mk(geos.sitLegs, mats.robe, MAX_SHOW, true);
  }
  function dressSlot(sl) { // màu áo theo ô (ổn định, dễ phân biệt)
    _col.setHex(ROBES[sl % ROBES.length]);
    mBody.setColorAt(sl, _col); mLegs.setColorAt(sl, _col); mArms.setColorAt(sl * 2, _col); mArms.setColorAt(sl * 2 + 1, _col);
    mBody.instanceColor.needsUpdate = mLegs.instanceColor.needsUpdate = mArms.instanceColor.needsUpdate = true;
  }
  function tagFor(sl) {
    let t = tags[sl];
    if (t) return t;
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 112;
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sprite.scale.set(1.25, 0.27, 1); sprite.renderOrder = 5; sprite.visible = false; sprite.name = 'chung:ten';
    scene.add(sprite);
    t = tags[sl] = { canvas, tex, sprite, name: '' };
    return t;
  }
  function drawTag(t, n) { // tên người thật: viền ngọc (khác viền vàng của người chơi); chỉ fillText, không bao giờ innerHTML
    t.name = n;
    const g = t.canvas.getContext('2d'), w = t.canvas.width, h = t.canvas.height;
    g.clearRect(0, 0, w, h);
    g.font = '700 54px system-ui, "Segoe UI", Roboto, Arial, sans-serif';
    const tw = Math.min(w - 20, g.measureText(n).width + 56), x0 = (w - tw) / 2;
    g.fillStyle = 'rgba(24,40,30,0.8)'; g.strokeStyle = 'rgba(121,184,147,0.9)'; g.lineWidth = 4;
    const r = 40; g.beginPath(); g.moveTo(x0 + r, 8); g.arcTo(x0 + tw, 8, x0 + tw, h - 8, r); g.arcTo(x0 + tw, h - 8, x0, h - 8, r); g.arcTo(x0, h - 8, x0, 8, r); g.arcTo(x0, 8, x0 + tw, 8, r); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#eaf6ee'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(n, w / 2, h / 2 + 2, w - 60);
    t.tex.needsUpdate = true;
  }

  // =====================================================================
  //  NGƯỜI Ở XA: dữ liệu nhận được (đích) + trạng thái nội suy (đang vẽ)
  // =====================================================================
  const peers = new Map();   // id → peer (mọi người trong phòng, kể cả người chưa có ô vẽ)
  const plist = [];          // cùng nội dung, dạng mảng để duyệt không cấp phát
  const slotOf = new Array(MAX_SHOW).fill(null);
  const hidden = new Set();  // peerId bị ẩn trong phiên này — KHÔNG lưu
  const stStats = { recv: 0, dropped: 0, limited: 0 }, geStats = { recv: 0, dropped: 0, limited: 0 };
  let lastHandlerMs = 0;     // thời gian xử lý gói 'st' gần nhất (ms) — kiểm tra
  function mkPeer(id) {
    const p = {
      id, slot: -1, name: 'Phật tử', nameRaw: null, nameAt: 0, got: false,
      tx: 0, tz: 0, tyaw: PI, h: 0, hGot: false, x: 0, z: 0, y: 0, gy: 0, yaw: PI, px: 0, pz: 0, speed: 0, phase: 0, walkAmt: 0, ph: Math.random() * TAU,
      pose: 'idle', poseT: 0, act: '', seat: -1, seatMarked: -1, markTry: 0, gest: '', gestT: 0, lastGe: -9,
      last: now(), gone: false, vis: 0, visT: 1, wedged: false, said: false, heard: false, lastChat: -9, stN: 0, stWin: 0, bv: new V3(), getBV: null, bub: null, // last = lúc vào phòng: không bị coi là im lặng 30 giây rồi gỡ ngay khi vừa nối
      a: { lx: 0.05, lz: 0.34, rx: 0.05, rz: -0.34, hip: 0, head: 0, sit: 0 },
    };
    p.getBV = () => p.bv;
    return p;
  }
  function addPeer(id) { // null khi đã đủ MAX_PEERS người
    let p = peers.get(id);
    if (p) { p.gone = false; return p; }
    if (peers.size >= MAX_PEERS) return null;
    p = mkPeer(id); peers.set(id, p); plist.push(p);
    giveSlot(p);
    return p;
  }
  function giveSlot(p) {
    if (p.slot >= 0 || !built) return;
    for (let i = 0; i < MAX_SHOW; i++) if (!slotOf[i]) { slotOf[i] = p; p.slot = i; dressSlot(i); return; }
  }
  function freeSlot(p) {
    if (p.slot < 0) return;
    const sl = p.slot;
    mShadow.setMatrixAt(sl, ZERO); mBody.setMatrixAt(sl, ZERO); mHead.setMatrixAt(sl, ZERO); mHair.setMatrixAt(sl, ZERO); mFace.setMatrixAt(sl, ZERO); mLegs.setMatrixAt(sl, ZERO);
    for (let k = 0; k < 2; k++) { mArms.setMatrixAt(sl * 2 + k, ZERO); mHands.setMatrixAt(sl * 2 + k, ZERO); mFeet.setMatrixAt(sl * 2 + k, ZERO); }
    if (tags[sl]) tags[sl].sprite.visible = false;
    slotOf[sl] = null; p.slot = -1; p.vis = 0;
  }
  function removePeer(p) {
    dbg('peer:remove', p.id);
    unmarkSeat(p);
    freeSlot(p);
    peers.delete(p.id);
    const i = plist.indexOf(p); if (i >= 0) plist.splice(i, 1);
  }
  // Ô vẽ: người đang chờ (có vị trí, đang hiện) lấy ô của người bị ẩn / chưa gửi vị trí / đã im lặng
  const wantsSlot = (p, t) => p.slot < 0 && p.got && !p.gone && !hidden.has(p.id) && t - p.last < STALE_S;
  const canYield = (q, t) => hidden.has(q.id) || !q.got || q.gone || t - q.last >= STALE_S;
  function reclaimSlots(t) {
    for (let i = 0; i < plist.length; i++) {
      const p = plist[i];
      if (!wantsSlot(p, t)) continue;
      giveSlot(p);
      if (p.slot >= 0) continue;
      for (let s = 0; s < MAX_SHOW; s++) { const q = slotOf[s]; if (q && canYield(q, t)) { freeSlot(q); giveSlot(p); break; } }
    }
  }
  // Bồ đoàn người khác đang ngồi: đánh dấu trong bảng chỗ của đám đông để khách AI và nút "Ngồi xuống" bỏ qua; không đụng chỗ người chơi đang giữ.
  // Thử lại mỗi ~1 giây khi chưa đánh dấu được (khách AI đang ngồi đó ở máy này rồi đứng dậy); nhả khi người đó bị ẩn / không có ô / đã cũ.
  function markSeat(p, s) {
    if (p.seatMarked === s) return;
    unmarkSeat(p);
    const cs = G.crowd && G.crowd.seats;
    if (s >= 0 && cs && cs.markRemote) { try { if (cs.markRemote(s, p.id)) p.seatMarked = s; } catch (e) { /* bỏ qua */ } }
  }
  function unmarkSeat(p) {
    if (p.seatMarked < 0) return;
    const cs = G.crowd && G.crowd.seats;
    if (cs && cs.unmarkRemote) { try { cs.unmarkRemote(p.id); } catch (e) { /* bỏ qua */ } }
    p.seatMarked = -1;
  }
  let lastToast = -9;
  function setName(p, raw) { // tên từ xa: cùng bộ lọc với lời nói (địa chỉ web / số / từ thô → "Phật tử"), đổi tối đa 1 lần / 30 giây, bỏ qua nếu không đổi
    if (raw === p.nameRaw) return;
    const t = now();
    if (p.nameAt > 0 && t - p.nameAt < NAME_GAP) return;
    p.nameRaw = raw; p.nameAt = t;
    let n = G.text.cleanName(String(raw).normalize('NFKC').replace(JUNK_RE, ''));
    const f = n ? filterChat(n) : null;
    if (!n || f === null || f !== n || G.text.hasBad(n)) n = 'Phật tử';
    p.name = n;
    if (!p.said) { // chào một lần khi biết tên (toast dùng textContent); người đã bị ẩn thì im
      p.said = true;
      if (!hidden.has(p.id) && t - lastToast > 2.5 && G.started) { lastToast = t; G.ui.toast(n + ' vừa vào chùa cùng bạn', 3200); }
    }
  }
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const badStr = (v, max) => v !== undefined && (typeof v !== 'string' || v.length > max); // trường chữ: thiếu thì được, sai kiểu / quá dài thì bỏ gói
  function onState(data, peerId) {
    const t0 = performance.now();
    stStats.recv++;
    // 1) loại ngay gói sai kiểu / quá dài, TRƯỚC mọi xử lý chuỗi
    if (!data || typeof data !== 'object' || typeof peerId !== 'string' || !peerId || peerId.length > LIM.id
      || badStr(data.n, LIM.n) || badStr(data.a, LIM.a) || badStr(data.p, LIM.p)) { stStats.dropped++; lastHandlerMs = performance.now() - t0; return; }
    const p = addPeer(peerId);
    if (!p) { stStats.dropped++; lastHandlerMs = performance.now() - t0; return; }
    // 2) hạn mức theo từng người: > 25 gói / giây → bỏ
    const t = now();
    if (t - p.stWin >= 1) { p.stWin = t; p.stN = 0; }
    if (++p.stN > ST_RATE) { stStats.limited++; lastHandlerMs = performance.now() - t0; return; }
    const b = G.collide && G.collide.bounds;
    const x = num(data.x), z = num(data.z), yaw = num(data.y), h = num(data.h);
    if (x !== null && z !== null) {
      p.tx = b ? clamp(x, b.x0, b.x1) : x; p.tz = b ? clamp(z, b.z0, b.z1) : z;
      if (!p.got) { p.got = true; p.x = p.px = p.tx; p.z = p.pz = p.tz; p.y = p.gy = G.heightAt(p.x, p.z); if (statusMsg && status === 'on') setStatus('on', ''); } // có người nối được → xoá lời báo "chưa nối được"
    }
    if (yaw !== null) { p.tyaw = yaw; if (!p.got) p.yaw = yaw; }
    if (h !== null) { p.h = h; p.hGot = true; } else p.hGot = false;
    const pose = typeof data.p === 'string' && POSES.has(data.p) ? data.p : 'idle';
    if (pose !== p.pose) { p.pose = pose; p.poseT = 0; }
    p.act = typeof data.a === 'string' ? data.a.replace(/[^a-zA-Z]/g, '').slice(0, 16) : '';
    const s = Number.isInteger(data.s) && data.s >= 0 && data.s < seats.length ? data.s : -1;
    if (s !== p.seat) { unmarkSeat(p); p.seat = s; p.markTry = 0; }
    if (s >= 0) { const st = seats[s]; p.tx = st.x; p.tz = st.z; p.tyaw = st.yaw != null ? st.yaw : PI; }
    if (typeof data.n === 'string') setName(p, data.n);
    if (!p.heard) { p.heard = true; dbg('peer:first-state', peerId); }
    p.last = t; p.gone = false;
    lastHandlerMs = performance.now() - t0;
  }
  function onGesture(data, peerId) {
    geStats.recv++;
    if (!data || typeof data !== 'object' || typeof peerId !== 'string' || peerId.length > LIM.id || !isGest(data.g)) { geStats.dropped++; return; }
    const p = peers.get(peerId);
    if (!p) { geStats.dropped++; return; }
    const t = now();
    if (t - p.lastGe < GE_GAP) { geStats.limited++; return; }
    p.lastGe = t; p.gest = data.g; p.gestT = 0; p.last = t;
  }

  // ---------- Lời nói: nhận (hạn mức theo từng người, lọc lại), gửi (hạn mức + lọc), ẩn người (theo phiên) ----------
  const chatStats = { sent: 0, shown: 0, limited: 0, blocked: 0, hiddenDrop: 0, muted: 0, dropped: 0, unseen: 0 }; // đếm để kiểm tra, không lưu nội dung (unseen: người đang mờ / trong nêm / chưa có vị trí)
  let lastShown = '', lastChatSent = -9, chatNoteShown = false;
  const bubbleMs = (t) => 4000 + Math.min(2000, Array.from(t).length * 40); // 4–6 giây tuỳ độ dài
  function onChat(data, peerId) {
    if (!data || typeof data !== 'object' || typeof peerId !== 'string' || peerId.length > LIM.id || typeof data.t !== 'string' || data.t.length > LIM.t) { chatStats.dropped++; return; }
    const p = peers.get(peerId);
    if (!p) { chatStats.dropped++; return; }
    const t = now();
    if (t - p.lastChat < CHAT_GAP) { chatStats.limited++; return; } // vượt hạn mức 1 câu / 2 giây: bỏ qua
    p.lastChat = t;
    if (hidden.has(peerId)) { chatStats.hiddenDrop++; return; }
    if (isMuted()) { chatStats.muted++; return; }
    const f = filterChat(cleanChat(data.t));
    if (f === null) { chatStats.blocked++; return; }
    // như 20-crowd: người bị nêm máy quay giấu, đã im lặng (mờ dần) hay chưa có vị trí thì không có lời lơ lửng. Xét điều kiện "đáng được thấy",
    // KHÔNG xét độ mờ hiện tại: người vừa xuất hiện còn đang hiện dần (≈ 0,5–1 giây) — câu chào gửi ngay lúc đó trước đây bị bỏ im lặng.
    if (p.slot < 0 || !p.got || p.wedged || p.gone || t - p.last >= STALE_S) { chatStats.unseen++; return; }
    chatStats.shown++; lastShown = f;
    p.bub = G.ui.bubble(p.getBV, f, bubbleMs(f), 2.35); // hệ bong bóng của khách AI (00-core): textContent, ẩn khi xa máy quay
  }
  function chat(text) {
    if (!room || !sendCh) { G.ui.toast('Bạn hãy bật "Đi chùa cùng mọi người" trong Cài đặt trước nhé.', 3000); return false; }
    const t = now();
    if (t - lastChatSent < CHAT_GAP) { G.ui.toast('Chờ một chút rồi nói tiếp nhé.', 1800); return false; }
    const txt = cleanChat(text);
    if (!txt) return false;
    const f = filterChat(txt);
    if (f === null) { G.ui.toast('Không gửi được: lời nhắn có địa chỉ web hoặc dãy số dài.', 3200); return false; }
    lastChatSent = t; chatStats.sent++;
    try { sendCh({ t: f }); } catch (e) { /* mất kết nối thì bỏ qua */ }
    if (!isMuted()) G.ui.bubble(P.root, f, bubbleMs(f), 2.35); // chính mình cũng thấy câu đã lọc
    return true;
  }
  // Kiểm thử: gửi thẳng một gói không qua lọc / hạn mức phía gửi (phía nhận mới là hàng rào thật); gọi thẳng hàm nhận với dữ liệu giả
  function raw(kind, obj) { const f = kind === 'st' ? sendSt : kind === 'ge' ? sendGe : kind === 'ch' ? sendCh : null; if (!room || !f) return false; try { f(obj); return true; } catch (e) { return false; } }
  function inject(kind, data, peerId) { const t0 = performance.now(); (kind === 'st' ? onState : kind === 'ge' ? onGesture : onChat)(data, peerId); return performance.now() - t0; }
  function hide(peerId, on) {
    if (on === undefined) on = !hidden.has(peerId);
    if (on) hidden.add(peerId); else hidden.delete(peerId);
    const p = peers.get(peerId);
    if (p) { if (on) unmarkSeat(p); else p.markTry = 0; }
    G.events.emit('chung:change');
    return on;
  }

  // =====================================================================
  //  TƯ THẾ (cùng bảng với 06-player.js) + cử chỉ đặt sẵn
  // =====================================================================
  const T = { lx: 0, lz: 0, rx: 0, rz: 0, hip: 0, head: 0, sit: 0 };
  const set = (lx, lz, rx, rz, hip = 0, head = 0, sit = 0) => { T.lx = lx; T.lz = lz; T.rx = rx; T.rz = rz; T.hip = hip; T.head = head; T.sit = sit; };
  const bowCurve = (x) => 0.5 - 0.5 * Math.cos(x * TAU);
  function poseTargets(p, time) {
    const t = p.poseT;
    switch (p.pose) {
      case 'pray': set(-1.15, -0.5, -1.15, 0.5, 0.06, 0.16); break;
      case 'bow': { const b = bowCurve(t / 2.6); set(-1.15, -0.5, -1.15, 0.5, 0.08 + b * 0.42, 0.18 + b * 0.15); break; }
      case 'incense': { const b = bowCurve(t / 2.4); set(-1.55, -0.42, -1.55, 0.42, 0.05 + b * 0.3, 0.1 + b * 0.12); break; }
      case 'offer': set(-1.35, -0.25, -1.35, 0.25, 0.25, 0.3); break;
      case 'strike': set(-1.5, -0.16, -1.5, 0.16, -0.07, -0.05); break;
      case 'sit': set(-0.55, -0.32, -0.55, 0.32, 0.02, 0.1, 1); break;
      case 'sitPray': set(-1.15, -0.5, -1.15, 0.5, 0.04, 0.16, 1); break;
      case 'sitMo': set(-1.1, -0.42, -1.2, 0.18, 0.04, 0.12, 1); break;
      case 'shake': { const s = Math.sin(t * 30) * 0.1; set(-0.95 + s, -0.46, -0.95 + s, 0.46, 0.06, 0.12); break; }
      case 'write': set(-0.75, -0.34, -0.85, 0.3, 0.08, 0.3); break;
      case 'release': set(-0.75, -0.25, -0.75, 0.25, 0.5, 0.25); break;
      case 'wave': set(0.05, 0.34, -2.6 + Math.sin(t * 9) * 0.25, 0.25, 0, 0); break;
      default: { const w = Math.sin(time * 1.6 + p.ph) * 0.03; set(0.05 + w, 0.34, 0.05 + w, -0.34, 0, Math.sin(time * 0.7 + p.ph) * 0.03); }
    }
    if (p.gest) { // cử chỉ đè lên tư thế trong vài giây (giữ nguyên ngồi / đứng)
      const g = GEST[p.gest], t2 = p.gestT;
      if (!g || t2 > g.dur) p.gest = '';
      else if (p.gest === 'pray') { T.lx = -1.15; T.lz = -0.5; T.rx = -1.15; T.rz = 0.5; T.hip = Math.max(T.hip, 0.05); T.head = 0.16; }
      else if (p.gest === 'bow') { const b = bowCurve(t2 / 2.6); T.lx = -1.15; T.lz = -0.5; T.rx = -1.15; T.rz = 0.5; T.hip = (T.sit ? 0.04 : 0.08) + b * (T.sit ? 0.3 : 0.42); T.head = 0.18 + b * 0.15; }
      else if (p.gest === 'wave') { T.rx = -2.6 + Math.sin(t2 * 9) * 0.25; T.rz = 0.25; }
    }
  }

  // =====================================================================
  //  GHI MA TRẬN (cùng cách với 20-crowd.js: gốc × hông × từng bộ phận; biến tạm dùng lại)
  // =====================================================================
  const _pv = new V3(), _sv = new V3(), _one = new V3(1, 1, 1), _zeroV = new V3(), _tv = new V3();
  const _q = new THREE.Quaternion(), _qI = new THREE.Quaternion(), _e = new THREE.Euler();
  const _rootM = new M4(), _hipM = new M4(), _neckM = new M4(), _bodyM = new M4(), _armM = new M4(), _loc = new M4(), _tmp = new M4();
  function writeAvatar(p, time) {
    const a = p.a, sl = p.slot, sit = a.sit, k = p.vis * p.vis * (3 - 2 * p.vis); // k: thu về chân khi mờ dần
    const bob = p.walkAmt * Math.abs(Math.sin(p.phase)) * 0.045 + Math.sin(time * 1.6 + p.ph) * 0.006 * (1 - p.walkAmt);
    const vy = p.y + bob - sit * 0.34;
    const hy = p.yaw * 0.5; _q.set(0, Math.sin(hy), 0, Math.cos(hy));
    _rootM.compose(_pv.set(p.x, vy, p.z), _q, _sv.set(k, k, k));
    _e.set(a.hip, 0, 0, 'XYZ'); _q.setFromEuler(_e);
    _hipM.multiplyMatrices(_rootM, _loc.compose(_pv.set(0, HIP, 0), _q, _one));
    _bodyM.copy(_hipM); const be = _bodyM.elements; be[12] -= HIP * be[4]; be[13] -= HIP * be[5]; be[14] -= HIP * be[6];
    mBody.setMatrixAt(sl, _bodyM);
    _e.set(a.head, 0, 0, 'YXZ'); _q.setFromEuler(_e);
    _neckM.multiplyMatrices(_hipM, _loc.compose(_pv.set(0, NECK - HIP, 0), _q, _one));
    mHead.setMatrixAt(sl, _neckM); mHair.setMatrixAt(sl, _neckM); mFace.setMatrixAt(sl, _neckM);
    for (let j = 0; j < 2; j++) {
      const left = j === 0;
      _e.set(left ? a.lx : a.rx, 0, left ? a.lz : a.rz, 'XYZ'); _q.setFromEuler(_e);
      _armM.multiplyMatrices(_hipM, _loc.compose(_pv.set(left ? SHX : -SHX, SHY - HIP, 0), _q, _one));
      mArms.setMatrixAt(sl * 2 + j, _armM); mHands.setMatrixAt(sl * 2 + j, _armM);
    }
    if (sit > 0.5) { mFeet.setMatrixAt(sl * 2, ZERO); mFeet.setMatrixAt(sl * 2 + 1, ZERO); }
    else {
      const fs = Math.sin(p.phase) * p.walkAmt;
      _tmp.multiplyMatrices(_rootM, _loc.compose(_pv.set(0.11, 0.05 + Math.max(0, fs) * 0.05, 0.04 + fs * 0.1), _qI, _one)); mFeet.setMatrixAt(sl * 2, _tmp);
      _tmp.multiplyMatrices(_rootM, _loc.compose(_pv.set(-0.11, 0.05 + Math.max(0, -fs) * 0.05, 0.04 - fs * 0.1), _qI, _one)); mFeet.setMatrixAt(sl * 2 + 1, _tmp);
    }
    if (sit > 0.12) { _tmp.multiplyMatrices(_rootM, _loc.compose(_zeroV, _qI, _sv.setScalar(Math.max(0.01, sit)))); mLegs.setMatrixAt(sl, _tmp); }
    else mLegs.setMatrixAt(sl, ZERO);
    mShadow.setMatrixAt(sl, _loc.compose(_pv.set(p.x, p.gy + 0.025, p.z), _qI, _sv.set(0.95 * k * (1 + sit * 0.1), 1, 0.95 * k)));
    // bảng tên: trên đầu, mờ theo khoảng cách máy quay và theo độ hiện (ẩn cùng người khi trong nêm máy quay gõ mõ)
    const t = tagFor(sl);
    if (t.name !== p.name) drawTag(t, p.name);
    t.sprite.position.set(p.x, vy + 1.95, p.z);
    p.bv.set(p.x, vy, p.z); // điểm gắn bong bóng lời nói (G.ui.bubble đọc qua p.getBV)
    _tv.set(p.x, vy + 1, p.z);
    const d = _tv.distanceTo(G.camera.position);
    const op = p.vis * clamp((40 - d) / 8, 0, 1);
    t.sprite.material.opacity = op; t.sprite.visible = op > 0.02;
  }

  // =====================================================================
  //  KẾT NỐI: Trystero (tải động khi bật), một phòng cố định (+ mã nhóm riêng), ba "hành động": st (trạng thái), ge (cử chỉ), ch (lời nói)
  // =====================================================================
  let lib = null, room = null, sendSt = null, sendGe = null, sendCh = null, gen = 0, sendTimer = 0;
  let status = 'off', statusMsg = '', statusMsgAt = 0; // off | loading | connecting | on | error; statusMsg (từ onJoinError) tự xoá sau 30 giây hoặc khi có người mới gửi trạng thái
  let lastSent = null, lastSentAt = 0;
  const evlog = []; // nhật ký ngắn (≤ 80 dòng, chỉ trong bộ nhớ) để gỡ lỗi / kiểm tra: { t (giây), ev, id }
  function dbg(ev, id) { evlog.push({ t: Math.round(now() * 1000) / 1000, ev, id: id || '' }); if (evlog.length > 80) evlog.shift(); }
  // ---------- Chẩn đoán hiện trong Cài đặt ("Chi tiết kết nối"): để người dùng điện thoại chụp màn hình khi không thấy nhau ----------
  // Chỉ là bộ đếm và lời lỗi ngắn trong bộ nhớ (không địa chỉ IP, không lưu xuống máy): số điểm hẹn đang mở, số lần bắt tay WebRTC
  // (nối được / hỏng / bỏ dở), lỗi gần nhất của thư viện, phiên bản iOS và việc trang đang mở trong trình duyệt nhúng của một ứng dụng.
  const diag = { hs: 0, ok: 0, fail: 0, drop: 0, err: [], rej: new Set() }; // rej: điểm hẹn từ chối loại tin của Trystero (vô hại khi các điểm hẹn khác vẫn nhận)
  function diagErr(m) { m = String(m == null ? '' : m).replace(/\s+/g, ' ').trim().slice(0, 160); if (!m) return;
    const rj = /relay failure from wss?:\/\/([^\s/]+)/i.exec(m); if (rj) { if (!diag.rej.has(rj[1])) { diag.rej.add(rj[1]); G.events.emit('chung:change'); } return; } if (diag.err[diag.err.length - 1] === m) return; diag.err.push(m); if (diag.err.length > 3) diag.err.shift(); G.events.emit('chung:change'); }
  const ENV = (() => {
    const ua = navigator.userAgent || '';
    const iosDev = /\b(?:iPhone|iPad|iPod)\b/.test(ua);
    const m = / OS (\d+)_(\d+)/.exec(ua);
    // trình duyệt nhúng: Facebook / Messenger / Instagram / Zalo / Line / TikTok / ứng dụng Google; WebView Android có "; wv)";
    // trên iPhone, Safari / Chrome / Firefox / Edge đều có "Safari/" trong UA, còn WKWebView của ứng dụng thì không
    const inApp = /FBAN|FBAV|FB_IAB|Messenger|Instagram|Zalo|Line\/|TikTok|musical_ly|Bytedance|; wv\)|GSA\//i.test(ua) || (iosDev && !/Safari\//.test(ua));
    return { ios: iosDev && m ? m[1] + '.' + m[2] : '', inApp, rtc: typeof window.RTCPeerConnection === 'function' };
  })();
  let rtcClass = null;
  function makeRtcClass() { // lớp RTCPeerConnection riêng truyền cho Trystero (tuỳ chọn rtcPolyfill): chỉ ĐẾM trạng thái bắt tay, không đọc địa chỉ
    if (rtcClass || !ENV.rtc) return rtcClass;
    const O = window.RTCPeerConnection;
    rtcClass = class extends O {
      constructor(...a) {
        super(...a);
        let seen = false, done = false;
        const check = () => {
          if (!seen && this.remoteDescription) { seen = true; diag.hs++; G.events.emit('chung:change'); }
          if (!seen || done) return;
          const c = this.connectionState, i = this.iceConnectionState;
          if (c === 'connected' || i === 'connected' || i === 'completed') { done = true; diag.ok++; G.events.emit('chung:change'); }
          else if (c === 'failed' || i === 'failed') { done = true; diag.fail++; G.events.emit('chung:change'); }
        };
        this.addEventListener('signalingstatechange', check);
        this.addEventListener('iceconnectionstatechange', check);
        this.addEventListener('connectionstatechange', check);
        this.__chungDone = () => { if (seen && !done) { done = true; diag.drop++; G.events.emit('chung:change'); } };
      }
      close() { try { if (this.__chungDone) this.__chungDone(); } catch (e) { /* bỏ qua */ } return super.close(); }
    };
    return rtcClass;
  }
  let diagHooked = false;
  function hookDiag() { // một lần: bắt cảnh báo "Trystero…" (relay từ chối, announce hỏng) và lỗi promise không ai bắt trong lúc đang bật
    if (diagHooked) return; diagHooked = true;
    const ow = console.warn.bind(console);
    console.warn = (...a) => { try { if (typeof a[0] === 'string' && /^Trystero/.test(a[0])) diagErr(a.map((x) => (x && x.message) || String(x)).join(' ').replace(/^Trystero:?\s*/, '')); } catch (e) { /* bỏ qua */ } return ow(...a); };
    const oe = console.error.bind(console);
    console.error = (...a) => { try { if (typeof a[0] === 'string' && /^Trystero/.test(a[0])) diagErr(a.map((x) => (x && x.message) || String(x)).join(' ').replace(/^Trystero:?\s*/, '')); } catch (e) { /* bỏ qua */ } return oe(...a); };
    window.addEventListener('unhandledrejection', (e) => { if (status === 'off') return; const r = e && e.reason; diagErr('lỗi: ' + ((r && r.message) || String(r))); });
  }
  function relayStats() { let open = 0, total = 0; try { const o = lib && lib.getRelaySockets ? lib.getRelaySockets() : {}; for (const k in o) { total++; if (o[k] && o[k].readyState === 1) open++; } } catch (e) { /* bỏ qua */ } return { open, total }; }
  function diagText() {
    if (!isOn() || status === 'off') return '';
    const r = relayStats();
    const parts = ['Chi tiết kết nối: điểm hẹn ' + r.open + '/' + (r.total || RELAYS) + (diag.rej.size ? ' (' + diag.rej.size + ' từ chối)' : ''), 'bắt tay ' + diag.hs + ' (nối ' + diag.ok + ', hỏng ' + diag.fail + ', bỏ dở ' + diag.drop + ')'];
    if (ENV.ios) parts.push('iOS ' + ENV.ios);
    if (ENV.inApp) parts.push('trình duyệt trong ứng dụng');
    if (!ENV.rtc) parts.push('không có WebRTC');
    let t = parts.join(' · ');
    if (diag.err.length) t += '\nLỗi gần nhất: ' + diag.err[diag.err.length - 1];
    return t;
  }
  const IN_APP_TIP = 'Bạn đang mở trang trong trình duyệt của một ứng dụng (Zalo, Messenger, Facebook…). Nếu không thấy ai, hãy mở bằng Safari hoặc Chrome: bấm nút ⋯ / ⋮ rồi chọn "Mở bằng trình duyệt".';
  function setStatus(s, msg) { status = s; statusMsg = msg || ''; statusMsgAt = statusMsg ? now() : 0; dbg('status:' + s); G.events.emit('chung:change'); }
  // Trystero 0.26: makeAction() trả về { send, onMessage }; bản cũ trả về [send, get] — hỗ trợ cả hai
  const quiet = (r) => { if (r && typeof r.catch === 'function') r.catch(() => { /* người nhận từ chối (quá cỡ) hoặc vừa rời đi: bỏ qua, không văng lỗi ra console */ }); return r; };
  function hook(action, fn) {
    if (Array.isArray(action)) { action[1]((data, peerId) => fn(data, peerId)); return (data, target) => quiet(action[0](data, target)); }
    action.onMessage = (data, meta) => fn(data, meta && meta.peerId);
    return (data, target) => quiet(action.send(data, target ? { target } : undefined));
  }
  function myState() {
    const act = G.activity.current || '';
    let seat = -1;
    if (act === 'ngoi' && G.crowd && G.crowd.seats) seat = G.crowd.seats.held;
    const r2 = (v) => Math.round(v * 100) / 100;
    return { v: 1, n: myName(), x: r2(P.pos.x), z: r2(P.pos.z), h: r2(P.pos.y), y: r2(P.yaw), p: P.pose, a: act, s: seat };
  }
  function maybeSend(force, target) {
    if (!room || !sendSt || !G.started) return;
    const st = myState(), t = now();
    const changed = force || !lastSent || st.x !== lastSent.x || st.z !== lastSent.z || st.h !== lastSent.h || st.y !== lastSent.y || st.p !== lastSent.p || st.a !== lastSent.a || st.s !== lastSent.s || st.n !== lastSent.n || t - lastSentAt > HEARTBEAT;
    if (!changed) return;
    if (!target) { lastSent = st; lastSentAt = t; }
    try { sendSt(st, target); } catch (e) { /* mất kết nối thì bỏ qua, lần sau gửi lại */ }
  }
  const onUnload = () => { if (room) { try { room.leave(); } catch (e) { /* bỏ qua */ } } };
  function closeRelays() { // tắt công tắc: đóng luôn các socket tới relay Nostr (không để mở tới khi tải lại trang); bật lại sẽ nối lại
    if (!lib) return;
    try { if (lib.pauseRelayReconnection) lib.pauseRelayReconnection(); } catch (e) { /* bỏ qua */ }
    try { const o = lib.getRelaySockets ? lib.getRelaySockets() : {}; for (const k in o) { try { if (o[k] && o[k].readyState < 2) o[k].close(); } catch (e) { /* bỏ qua */ } } } catch (e) { /* bỏ qua */ }
  }
  async function connect() {
    const g = ++gen;
    dbg('connect', codeOf());
    diag.hs = diag.ok = diag.fail = diag.drop = 0; diag.err.length = 0; diag.rej.clear();
    hookDiag();
    if (!ENV.rtc) { setStatus('error', 'Trình duyệt này không hỗ trợ kết nối ngang hàng (WebRTC). Bạn mở trang bằng Safari hoặc Chrome nhé.'); return; }
    if (!lib) {
      setStatus('loading');
      try { lib = await import('trystero'); dbg('lib:loaded'); }
      catch (e) {
        console.warn('[đi chùa chung] không tải được thư viện kết nối', e); diagErr('không tải được thư viện: ' + ((e && e.message) || e));
        // trình duyệt ghi nhớ import() hỏng suốt đời trang: bật lại không đủ, phải tải lại trang; báo mỗi lần bật
        if (g === gen) { const msg = 'Không tải được phần kết nối. Bạn tải lại trang rồi bật lại nhé.'; setStatus('error', msg); G.ui.toast(msg, 3600); }
        return;
      }
    }
    if (g !== gen) return; // đã tắt hoặc đổi mã trong lúc tải
    ensureMeshes();
    setStatus('connecting');
    try { if (lib.resumeRelayReconnection) lib.resumeRelayReconnection(); } catch (e) { /* bỏ qua */ }
    const code = codeOf();
    try {
      const rc = makeRtcClass();
      room = lib.joinRoom({ appId: APP_ID, maxReceiveBytes: MAX_RECV, relayConfig: { redundancy: RELAYS, warnOnRelayFailure: true }, ...(rc ? { rtcPolyfill: rc } : {}) }, ROOM + (code ? '-' + code : ''), {
        onJoinError: (d) => { console.warn('[đi chùa chung] một người chưa kết nối được', d && d.error); diagErr(d && d.error); dbg('join:error', d && d.peerId); if (g === gen) setStatus('on', 'Có người chưa kết nối được tới bạn (mạng của một trong hai bên chặn kết nối trực tiếp).'); },
      });
      sendSt = hook(room.makeAction('st'), onState);
      sendGe = hook(room.makeAction('ge'), onGesture);
      sendCh = hook(room.makeAction('ch'), onChat);
      room.onPeerJoin = (id) => { if (g !== gen) return; dbg('peer:join', id); if (addPeer(id)) maybeSend(true, id); G.events.emit('chung:change'); };
      room.onPeerLeave = (id) => { if (g !== gen) return; dbg('peer:leave', id); const p = peers.get(id); if (p) p.gone = true; G.events.emit('chung:change'); };
    } catch (e) {
      console.warn('[đi chùa chung] chưa vào được phòng', e); diagErr('chưa vào được phòng: ' + ((e && e.message) || e)); room = null; sendSt = sendGe = sendCh = null;
      setStatus('error', 'Chưa kết nối được. Bạn thử lại sau nhé.'); return;
    }
    window.addEventListener('beforeunload', onUnload);
    setStatus('on');
    clearInterval(sendTimer);
    sendTimer = setInterval(() => maybeSend(false), 1000 / SEND_HZ); // đồng hồ riêng (không theo khung hình): ≤ 10 lần/giây khi đổi, ≥ 1 lần/giây để báo "còn đó" kể cả khi thẻ bị ẩn
    maybeSend(true);
    paintBar();
  }
  function disconnect() {
    gen++;
    dbg('disconnect');
    clearInterval(sendTimer); sendTimer = 0;
    window.removeEventListener('beforeunload', onUnload);
    if (room) { try { room.leave(); } catch (e) { /* bỏ qua */ } }
    room = null; sendSt = sendGe = sendCh = null; lastSent = null;
    closeRelays();
    for (let i = 0; i < plist.length; i++) plist[i].gone = true; // mờ dần rồi gỡ
    setStatus('off');
    closeChat();
  }
  function enable(on) {
    on = !!on;
    const c = cfgWrite();
    const was = c.on; c.on = on; persist();
    if (on) { if (G.started) connect(); if (!was) G.ui.toast(ENV.inApp ? IN_APP_TIP : 'Đang kết nối với mọi người cùng đi chùa…', ENV.inApp ? 6000 : 2600); }
    else { disconnect(); if (was) G.ui.toast('Đã tắt đi chùa chung. Không còn gửi gì nữa.', 2600); }
    paintBar(); G.events.emit('chung:change');
  }
  function setCode(code) {
    const nc = cleanCode(code);
    if (nc === codeOf()) return; // không đổi thì không tạo khoá trong save
    const c = cfgWrite(); c.code = nc; persist();
    if (c.on && room) { disconnect(); connect(); }
    G.events.emit('chung:change');
  }
  G.events.on('enter', () => { if (isOn()) connect(); paintBar(); });
  G.events.on('save', () => { if (!isOn() && room) disconnect(); }); // "Xoá dữ liệu trên máy" tắt luôn công tắc
  G.events.on('activity:start', () => { maybeSend(true); closeChat(); });
  G.events.on('activity:end', () => maybeSend(true));

  // ---------- Cử chỉ: gửi cho mọi người + tự làm trên nhân vật mình ----------
  let gestLock = 0, gestTimer = 0;
  function gesture(g) {
    if (!isGest(g) || !room) return;
    const t = now(); if (t - gestLock < 0.8) return; gestLock = t;
    try { if (sendGe) sendGe({ g }); } catch (e) { /* bỏ qua */ }
    G.audio?.play?.('ui');
    if (!G.activity.current && !P.locked) {
      P.setPose(g);
      clearTimeout(gestTimer);
      gestTimer = setTimeout(() => { if (P.pose === g && !G.activity.current) P.setPose('idle'); }, GEST[g].dur * 1000);
    }
  }

  // =====================================================================
  //  GIAO DIỆN: thanh cử chỉ + số người + ô nói (HUD) và mục trong bảng Cài đặt
  // =====================================================================
  G.ui.addStyle(`
  #chungBar{position:absolute;left:50%;bottom:calc(50px + var(--sb));transform:translateX(-50%);display:flex;align-items:center;gap:8px;pointer-events:none;transition:opacity .25s}
  #chungBar > *{pointer-events:auto} /* khoảng trống giữa các nút cho chạm xuyên qua */
  body.touch #chungBar{bottom:calc(160px + var(--sb))} /* trên cần điều khiển (tới 154px) và nút hành động (tới 104px) */
  body:not(.touch) #actionBtn.show ~ #chungBar{bottom:calc(116px + var(--sb))} /* máy tính: nút hành động (dải 36–104px, neo phải, rộng theo nhãn) đang hiện → thanh nâng lên trên dải đó, không bao giờ giao nhau */
  body:not(.touch) #actionBtn.show ~ #chungChat{bottom:calc(170px + var(--sb))}
  #chungBar.hidden{display:none}
  body.in-activity #chungBar{opacity:0!important;pointer-events:none!important}
  body.in-activity #chungBar > *{pointer-events:none!important}
  .chung-n{display:flex;align-items:center;gap:6px;height:44px;padding:0 12px;border-radius:12px;border:1px solid var(--line);background:var(--panel);color:var(--gold2);font-weight:700;font-size:14px;box-shadow:var(--shadow);white-space:nowrap}
  .chung-n svg{width:20px;height:20px;fill:none;stroke:var(--gold2);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  .chung-g{display:flex;align-items:center;gap:6px;width:auto;padding:0 12px;color:var(--gold2);font-weight:600;font-size:14px}
  .chung-g .l{white-space:nowrap}
  @media (max-width:1120px){.chung-g{padding:0;width:44px}.chung-g .l{display:none}} /* màn hẹp: chỉ biểu tượng (thanh đủ nhãn rộng ≈ 490px) */
  .chung-st{font-size:13px;color:var(--gold2);margin-top:6px;min-height:18px}
  .chung-dg{font-size:12px;color:var(--muted);margin-top:4px;line-height:1.4;white-space:pre-line;overflow-wrap:anywhere}
  .chung-dg:empty,.chung-adv.hidden{display:none}
  .chung-adv{font-size:13px;color:var(--gold2);margin-top:6px;line-height:1.4}
  .chung-ip{font-size:13px;color:var(--muted);margin-top:6px;line-height:1.4}
  .chung-code{display:flex;gap:10px;align-items:center;margin-top:10px}
  .chung-code input{flex:1;min-width:0;text-align:center;font-size:16px;padding:10px 12px}
  .snd-row.chung-off .chung-more{display:none}
  #chungChat{position:absolute;left:50%;bottom:calc(104px + var(--sb));transform:translateX(-50%);width:min(94vw,520px);background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:10px 10px 8px;box-shadow:var(--shadow);pointer-events:auto}
  body.touch #chungChat{bottom:calc(214px + var(--sb))}
  #chungChat.hidden,body.in-activity #chungChat{display:none}
  .chung-chat-row{display:flex;gap:8px;align-items:center}
  .chung-chat-row input{flex:1;min-width:0;padding:10px 12px;font-size:16px}
  .chung-chat-row .btn{min-height:44px;padding:8px 14px}
  .chung-chat-hint{display:flex;justify-content:space-between;gap:10px;margin-top:6px;font-size:12px;color:var(--muted);font-style:italic}
  .bubble{overflow-wrap:anywhere;word-break:break-word}
  .chung-sub{margin-top:10px}
  .chung-people{display:flex;flex-direction:column;gap:6px;margin-top:10px}
  .chung-person{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:4px 4px 4px 10px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid var(--line)}
  .chung-person b{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .chung-person .chip{min-height:40px;flex:none}
  .chung-person.off b{opacity:.5;text-decoration:line-through}
  `);
  const SVG = {
    people: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c0-3.2 2.5-5.3 5.5-5.3s5.5 2.1 5.5 5.3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M15.5 13.6c2.9.2 5 2.2 5 5.4"/></svg>',
    pray: '<svg viewBox="0 0 24 24"><path d="M12 3.5c-1.4 2.6-2.4 5.3-2.4 8.2V19"/><path d="M12 3.5c1.4 2.6 2.4 5.3 2.4 8.2V19"/><path d="M9.6 12.5c-1.6.6-3.1 1.7-3.9 3.2L4 19h5.6"/><path d="M14.4 12.5c1.6.6 3.1 1.7 3.9 3.2L20 19h-5.6"/></svg>',
    bow: '<svg viewBox="0 0 24 24"><circle cx="16.5" cy="7.5" r="2.5"/><path d="M15 10.5c-3 .5-5.5 2.5-7 5.5l-1.5 4"/><path d="M8.5 15.5 13 13.5l3 1"/><path d="M7 20h8"/></svg>',
    talk: '<svg viewBox="0 0 24 24"><path d="M4 5.5h16v10H9.5L4.5 19.5z"/><path d="M8 9.5h8M8 12.5h5"/></svg>',
    wave: '<svg viewBox="0 0 24 24"><path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12"/><path d="M11 11.5V5a1.5 1.5 0 0 1 3 0v7"/><path d="M14 11.5V6a1.5 1.5 0 0 1 3 0v7.5"/><path d="M17 12.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-5.1-2.8L4.5 13.5a1.5 1.5 0 0 1 2.6-1.5L8 14"/><path d="M3.5 7.5c.3-1.6 1.2-2.9 2.5-3.8"/></svg>',
  };
  const hud = document.getElementById('hud');
  const bar = U.el('div', 'hidden'); bar.id = 'chungBar';
  const nEl = U.el('div', 'chung-n'); nEl.innerHTML = SVG.people; const nTxt = U.el('span', null, '0'); nEl.appendChild(nTxt);
  nEl.title = 'Số người đang cùng đi chùa với bạn';
  bar.appendChild(nEl);
  for (const g in GEST) {
    const b = U.el('button', 'ibtn chung-g'); b.type = 'button';
    b.innerHTML = SVG[g]; b.appendChild(U.el('span', 'l', GEST[g].label));
    b.setAttribute('aria-label', GEST[g].label); b.title = GEST[g].label + (G.isTouch ? '' : ' (phím ' + GEST[g].key.slice(-1) + ')');
    b.onclick = () => gesture(g);
    bar.appendChild(b);
  }
  const talkBtn = U.el('button', 'ibtn chung-g'); talkBtn.type = 'button'; talkBtn.id = 'chungTalk';
  talkBtn.innerHTML = SVG.talk; talkBtn.appendChild(U.el('span', 'l', 'Nói'));
  talkBtn.setAttribute('aria-label', 'Nói một câu với mọi người'); talkBtn.title = 'Nói một câu' + (G.isTouch ? '' : ' (Enter)');
  talkBtn.onclick = () => openChat();
  bar.appendChild(talkBtn);
  if (hud) hud.appendChild(bar);
  // ô nhập lời nói (đáy màn hình): Enter gửi, Esc đóng; đếm ký tự; dòng nhắc giữ lời thanh tịnh
  const chatBox = U.el('div', 'hidden'); chatBox.id = 'chungChat';
  const chatRow = U.el('div', 'chung-chat-row');
  const chatIn = document.createElement('input'); chatIn.id = 'chungChatIn'; chatIn.className = 'field'; chatIn.maxLength = CHAT_MAX; chatIn.autocomplete = 'off'; chatIn.spellcheck = false; chatIn.enterKeyHint = 'send';
  chatIn.placeholder = 'Nói một câu với mọi người…'; chatIn.setAttribute('aria-label', 'Lời bạn muốn nói');
  const chatSend = U.el('button', 'btn primary', 'Gửi'); chatSend.type = 'button';
  const chatX = U.el('button', 'panel-x', '×'); chatX.type = 'button'; chatX.setAttribute('aria-label', 'Đóng');
  chatRow.append(chatIn, chatSend, chatX);
  const chatHint = U.el('div', 'chung-chat-hint'), chatCnt = U.el('span', null, '0/' + CHAT_MAX);
  chatHint.append(U.el('span', null, 'Lời bạn gõ hiện cho mọi người trong chùa, xin giữ lời thanh tịnh.'), chatCnt);
  chatBox.append(chatRow, chatHint);
  if (hud) hud.appendChild(chatBox);
  function openChat() {
    if (!room) { G.ui.toast('Bạn hãy bật "Đi chùa cùng mọi người" trong Cài đặt trước nhé.', 3000); return false; }
    if (G.activity.current || G.ui.panelOpen || !G.started || tutOpen()) return false;
    chatBox.classList.remove('hidden'); chatIn.value = ''; chatCnt.textContent = '0/' + CHAT_MAX; chatIn.focus();
    if (!chatNoteShown) { chatNoteShown = true; G.ui.toast('Lời bạn gõ hiện cho mọi người trong chùa, xin giữ lời thanh tịnh 🙏', 4200); }
    return true;
  }
  function closeChat() { if (chatBox.classList.contains('hidden')) return; chatBox.classList.add('hidden'); chatIn.blur(); const c = document.getElementById('c'); if (c) c.focus({ preventScroll: true }); }
  function submitChat() { if (chat(chatIn.value)) { chatIn.value = ''; closeChat(); } }
  chatSend.onclick = submitChat; chatX.onclick = closeChat;
  chatIn.oninput = () => { chatCnt.textContent = Array.from(chatIn.value).length + '/' + CHAT_MAX; };
  chatIn.addEventListener('keydown', (e) => {
    if (e.isComposing || e.keyCode === 229) return; // đang ghép dấu (Telex / VNI / bộ gõ): chưa gửi
    if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); submitChat(); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeChat(); }
  });
  // Enter (không ở trong ô nhập, không bảng, không hoạt động, không hướng dẫn) mở ô nói — bắt ở pha capture để lõi không coi Enter là "làm hoạt động"
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Enter' || e.repeat || e.isComposing || e.ctrlKey || e.metaKey || e.altKey || !room || !G.started || G.activity.current || G.ui.panelOpen || tutOpen()) return;
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'SELECT') return;
    e.preventDefault(); e.stopImmediatePropagation();
    openChat();
  }, true);
  let shownN = -1;
  function liveCount() { let n = 0; const t = now(); for (let i = 0; i < plist.length; i++) if (!plist[i].gone && plist[i].got && t - plist[i].last < STALE_S) n++; return n; }
  function paintBar() {
    if (statusMsg && statusMsgAt && now() - statusMsgAt > 30) setStatus(status, ''); // lời báo lỗi nối không dính mãi
    const on = isOn() && G.started && status === 'on'; // chỉ hiện khi đã vào phòng
    bar.classList.toggle('hidden', !on);
    const n = liveCount();
    if (n !== shownN) { shownN = n; nTxt.textContent = String(n); }
  }
  window.addEventListener('keydown', (e) => { // phím 1 / 2 / 3: cử chỉ (máy tính); bỏ qua tổ hợp Ctrl / Alt / ⌘ và khi đang mở hướng dẫn
    if (!room || e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.isComposing || G.activity.current || G.ui.panelOpen || !G.started || tutOpen()) return;
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    for (const g in GEST) if (GEST[g].key === e.code) { gesture(g); return; }
  });

  // ---------- Mục trong bảng "Cài đặt" (00-core phát 'ui:settings' với hộp nội dung) ----------
  function statusText() {
    if (!isOn()) return 'Đang tắt: không gửi gì đi, không nhận gì về.';
    if (status === 'loading') return 'Đang tải phần kết nối…';
    if (status === 'connecting') return 'Đang nối tới điểm hẹn…';
    if (status === 'error') return statusMsg || 'Chưa kết nối được.';
    const n = liveCount();
    const base = n === 0 ? 'Đã kết nối. Chưa thấy ai khác đang bật.' : 'Đang có ' + U.fmt(n) + ' người cùng đi chùa với bạn.';
    return statusMsg ? base + ' ' + statusMsg : base;
  }
  G.events.on('ui:settings', (box) => {
    if (!box || !box.appendChild) return;
    const row = U.el('div', 'snd-row');
    const head = U.el('div', 'snd-h'), txt = U.el('div', 'snd-t');
    txt.append(U.el('div', 'snd-l', 'Đi chùa cùng mọi người'),
      U.el('div', 'small muted', 'Khi bật, tên bạn đặt, vị trí nhân vật, việc bạn đang làm và lời bạn gõ được gửi thẳng tới những người cũng đang bật — kết nối ngang hàng giữa các trình duyệt, không qua máy chủ của trò chơi. Tắt là ngừng ngay.'));
    const sw = U.el('button', 'snd-sw'); sw.type = 'button'; sw.id = 'chungSw'; sw.setAttribute('role', 'switch'); sw.setAttribute('aria-label', 'Đi chùa cùng mọi người');
    head.append(txt, sw);
    // luôn hiện (kể cả khi đang tắt): điều cần biết trước khi bật
    const ip = U.el('div', 'chung-ip', 'Lưu ý: người cùng phòng là người lạ trên mạng và thấy địa chỉ mạng (IP) của nhau như mọi kết nối ngang hàng; vài điểm hẹn công cộng (relay Nostr, máy chủ STUN của Google và Cloudflare) cũng thấy IP của bạn. Lời họ gõ hiện cho bạn, trò chơi chỉ lọc từ thô và cho bạn ẩn từng người.');
    const more = U.el('div', 'chung-more');
    const st = U.el('div', 'chung-st'); st.id = 'chungStatus';
    const dg = U.el('div', 'chung-dg'); dg.id = 'chungDiag';
    const adv = U.el('div', 'chung-adv' + (ENV.inApp ? '' : ' hidden'), IN_APP_TIP); adv.id = 'chungInApp';
    const muteRow = U.el('div', 'snd-h chung-sub'), muteTxt = U.el('div', 'snd-t');
    muteTxt.append(U.el('div', 'snd-l', 'Tắt mọi bong bóng chat'), U.el('div', 'small muted', 'Vẫn thấy mọi người đi lại, chỉ không hiện lời họ gõ (và lời của bạn).'));
    const muteSw = U.el('button', 'snd-sw'); muteSw.type = 'button'; muteSw.id = 'chungMute'; muteSw.setAttribute('role', 'switch'); muteSw.setAttribute('aria-label', 'Tắt mọi bong bóng chat');
    muteRow.append(muteTxt, muteSw);
    const people = U.el('div', 'chung-people'); people.id = 'chungPeople';
    let peopleSig = '';
    const codeRow = U.el('div', 'chung-code');
    const inp = document.createElement('input'); inp.className = 'field'; inp.id = 'chungCode'; inp.maxLength = 24; inp.autocomplete = 'off'; inp.spellcheck = false;
    inp.placeholder = 'Mã nhóm riêng (tuỳ chọn)'; inp.setAttribute('aria-label', 'Mã nhóm riêng'); inp.value = codeOf();
    codeRow.appendChild(inp);
    const note = U.el('div', 'note', 'Chia sẻ: tên, vị trí, việc đang làm (thắp hương, ngồi thiền…), ba cử chỉ đặt sẵn và lời bạn gõ (tối đa 60 ký tự, một câu mỗi 2 giây; câu có địa chỉ web hoặc dãy số dài bị chặn). Không lưu lịch sử. Để tìm nhau, trình duyệt gọi tới vài điểm hẹn công cộng (relay Nostr, máy chủ STUN của Google và Cloudflare): chúng thấy địa chỉ mạng của bạn, không thấy tên hay vị trí trong chùa. Mã nhóm không phải mật khẩu: ai biết mã đều vào được; để trống là vào phòng chung.');
    note.style.marginTop = '8px';
    more.append(st, dg, muteRow, people, codeRow, note);
    row.append(head, adv, ip, more); box.appendChild(row);
    const paint = () => {
      const on = isOn();
      row.classList.toggle('chung-off', !on); sw.classList.toggle('on', on); sw.setAttribute('aria-checked', String(on));
      st.textContent = statusText();
      const dt = diagText(); if (dg.textContent !== dt) dg.textContent = dt;
      const mute = isMuted(); muteSw.classList.toggle('on', mute); muteSw.setAttribute('aria-checked', String(mute));
      // danh sách người cùng phòng (textContent) + "Ẩn người này" / "Hiện lại"; chỉ dựng lại khi có thay đổi để không mất nút đang bấm
      let sig = '';
      for (let i = 0; i < plist.length; i++) if (!plist[i].gone) sig += plist[i].id + (hidden.has(plist[i].id) ? '!' : '') + plist[i].name + '|';
      if (sig !== peopleSig) {
        peopleSig = sig; people.textContent = '';
        if (sig) people.appendChild(U.el('div', 'small muted', 'Người đang cùng phòng — "Ẩn người này" giấu nhân vật và lời của họ cho tới khi bạn tải lại trang.'));
        for (let i = 0; i < plist.length; i++) {
          const q = plist[i]; if (q.gone) continue;
          const isOff = hidden.has(q.id);
          const rowP = U.el('div', 'chung-person' + (isOff ? ' off' : ''));
          const b = U.el('button', 'chip', isOff ? 'Hiện lại' : 'Ẩn người này'); b.type = 'button';
          b.onclick = () => { G.audio?.play?.('ui'); hide(q.id); paint(); };
          rowP.append(U.el('b', null, q.name), b); people.appendChild(rowP);
        }
      }
    };
    sw.onclick = () => { G.audio?.play?.('ui'); enable(!isOn()); paint(); };
    muteSw.onclick = () => { G.audio?.play?.('ui'); const c = cfgWrite(); c.muteChat = !c.muteChat; persist(); paint(); };
    inp.onchange = () => { setCode(inp.value); inp.value = codeOf(); paint(); };
    inp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } };
    const off = G.events.on('chung:change', paint);
    const tick = setInterval(() => { if (!row.isConnected) { clearInterval(tick); off(); return; } paint(); }, 1000);
    paint();
  });

  // =====================================================================
  //  CẬP NHẬT MỖI KHUNG: nội suy và vẽ người khác (gửi đi chạy theo đồng hồ riêng)
  // =====================================================================
  let paintAcc = 0;
  G.onUpdate((dt, time) => {
    paintAcc += dt; if (paintAcc > 0.25) { paintAcc = 0; paintBar(); }
    if (!built || !plist.length) return;
    const t = now();
    const inWedgeFn = G.crowd && G.crowd.inWedge; // nêm trước máy quay gõ mõ (20-crowd): người thật trong nêm cũng ẩn như khách AI
    let hi = -1, waiting = false;
    for (let i = plist.length - 1; i >= 0; i--) {
      const p = plist[i];
      const fresh = !p.gone && t - p.last < STALE_S, isHidden = hidden.has(p.id);
      const inW = !!(inWedgeFn && p.got && inWedgeFn(p.x, p.z));
      p.visT = fresh && p.got && !isHidden && !inW ? 1 : 0;
      if (!p.visT && p.bub) { if (p.bub.live) p.bub.until = 0; p.bub = null; } // vừa bị ẩn / vào nêm / im lặng: rút bong bóng đang hiện
      if (inW) p.wedged = true; else if (p.vis >= p.visT) p.wedged = false; // nêm: ẩn / hiện lại nhanh (0,2 giây) như khách AI, giữ tốc độ nhanh tới khi hiện đủ
      if (p.vis < p.visT) p.vis = Math.min(p.visT, p.vis + (p.wedged ? 5 : FADE_RATE * 2) * dt); // hiện: 1 giây
      else if (p.vis > p.visT) p.vis = Math.max(p.visT, p.vis - (p.wedged ? 5 : FADE_RATE) * dt); // mờ dần: 2 giây
      if ((p.gone || t - p.last > DROP_S) && p.vis <= 0.001) { removePeer(p); continue; }
      // bồ đoàn: chỉ giữ dấu khi người đó đang hiện (có ô, không ẩn, còn tin); thử lại mỗi giây khi chưa đánh dấu được
      if (p.seat >= 0) {
        if (!fresh || isHidden || p.slot < 0) { if (p.seatMarked >= 0) unmarkSeat(p); }
        else if (p.seatMarked !== p.seat && t - p.markTry >= 1) { p.markTry = t; markSeat(p, p.seat); }
      }
      if (p.slot < 0) { if (wantsSlot(p, t)) waiting = true; continue; }
      if (!p.got) continue;
      // nội suy vị trí / hướng về đích mới nhận (10 lần/giây)
      p.x = damp(p.x, p.tx, 10, dt); p.z = damp(p.z, p.tz, 10, dt);
      p.yaw = U.angleDamp(p.yaw, p.tyaw, 10, dt);
      const dx = p.x - p.px, dz = p.z - p.pz; p.px = p.x; p.pz = p.z;
      p.speed = damp(p.speed, dt > 0 ? Math.hypot(dx, dz) / dt : 0, 8, dt);
      const seat = p.seat >= 0 ? seats[p.seat] : null;
      const ground = G.heightAt(p.x, p.z);
      const gy = seat ? (seat.y || ground) : ground;
      p.gy = damp(p.gy, gy, 14, dt);
      // độ cao: bồ đoàn → mặt bồ đoàn; còn lại dùng độ cao bên kia gửi (ghế đá, bậc…), kẹp quanh mặt đất để không bay / chui
      const yT = seat ? gy + SEAT_LIFT : p.hGot ? clamp(p.h, ground - 0.5, ground + 3) : ground;
      p.y = damp(p.y, yT, 14, dt);
      const moving = p.speed > 0.25 && p.a.sit < 0.5;
      p.walkAmt = damp(p.walkAmt, moving ? 1 : 0, 8, dt);
      if (moving) p.phase += p.speed * dt * 2.6;
      // tư thế
      p.poseT += dt; p.gestT += dt;
      poseTargets(p, time);
      if (moving && (p.pose === 'idle' || p.pose === 'wave') && !p.gest) { const s = Math.sin(p.phase); T.lx = s * 0.6; T.rx = -s * 0.6; T.lz = 0.3; T.rz = -0.3; }
      const a = p.a;
      a.lx = damp(a.lx, T.lx, 12, dt); a.lz = damp(a.lz, T.lz, 12, dt); a.rx = damp(a.rx, T.rx, 12, dt); a.rz = damp(a.rz, T.rz, 12, dt);
      a.hip = damp(a.hip, T.hip, 12, dt); a.head = damp(a.head, T.head, 12, dt); a.sit = damp(a.sit, T.sit, 6, dt);
      writeAvatar(p, time);
      if (p.slot > hi) hi = p.slot;
    }
    if (waiting) reclaimSlots(t);
    const n = hi + 1;
    mShadow.count = mBody.count = mHead.count = mHair.count = mFace.count = mLegs.count = n;
    mArms.count = mHands.count = mFeet.count = n * 2;
    for (let i = 0; i < meshes.length; i++) meshes[i].instanceMatrix.needsUpdate = true;
  }, 22);

  // =====================================================================
  //  API CÔNG KHAI (G.chung) — cũng dùng để kiểm tra headless
  // =====================================================================
  G.chung = {
    get on() { return isOn(); },
    get code() { return codeOf(); },
    get status() { return status; },
    get statusMsg() { return statusMsg; },
    get count() { return liveCount(); },
    get list() { return plist; },        // mỗi phần tử: { id, name, x, z, y, yaw, pose, act, seat, seatMarked, vis, gest, slot, got, … }
    get room() { return room; },
    get selfId() { return lib ? lib.selfId : null; },
    get events() { return evlog; },
    get relays() { // trạng thái các relay Nostr đang dùng: { url: readyState }
      try { const o = lib && lib.getRelaySockets ? lib.getRelaySockets() : {}; const r = {}; for (const k in o) r[k] = o[k] ? o[k].readyState : -1; return r; } catch (e) { return {}; }
    },
    get hiddenIds() { return Array.from(hidden); },
    get diag() { return { hs: diag.hs, ok: diag.ok, fail: diag.fail, drop: diag.drop, err: diag.err.slice(), rejected: Array.from(diag.rej), relays: relayStats(), env: ENV, text: diagText() }; },
    get chatStats() { return chatStats; },  // { sent, shown, limited, blocked, hiddenDrop, muted, dropped } — chỉ số đếm, không có nội dung
    get stStats() { return stStats; }, get geStats() { return geStats; }, get lastHandlerMs() { return lastHandlerMs; },
    get lastShown() { return lastShown; },  // câu vừa hiện gần nhất (đã lọc) — để kiểm tra
    get muteChat() { return isMuted(); }, set muteChat(v) { cfgWrite().muteChat = !!v; persist(); G.events.emit('chung:change'); },
    enable, setCode, gesture, statusText, diagText, chat, raw, chatRaw: (obj) => raw('ch', obj), inject, openChat, closeChat, hide, cleanChat, filterChat,
    GEST, MAX_SHOW, MAX_PEERS, SEND_HZ, STALE_S, DROP_S, CHAT_MAX, CHAT_GAP, LIM,
  };
}
