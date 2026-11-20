// =====================================================================
//  GIỌNG NÓI TRONG NHÓM (động cơ): mở / tắt micro, gửi giọng tới từng người nghe, nhận và phát giọng của người khác.
//  Chỉ chạy trong nhóm riêng (mã đủ dài) của "đi chùa chung" (module 22). Chữ hiển thị đều ở module 25 (ở đây chỉ có câu chẩn đoán
//  'không tìm thấy sender' cho dòng "Chi tiết kết nối"): các câu báo đi ra dưới dạng mã qua sự kiện 'voice:notice'. API: G.voice (cuối tệp).
//  Quy tắc gửi (đã đo trên Chrome): mỗi kết nối chỉ gọi room.addStream MỘT lần, sau đó mọi lần đổi track là RTCRtpSender.replaceTrack
//  trên sender đã lưu. Không bao giờ dùng room.replaceTrack / room.removeStream / room.onPeerTrack, không dùng addStream(stream, id).
//  Không bao giờ stop() một track còn nằm trên sender sống: chuyển sang track im lặng (silent) trước, đợi xong rồi mới dừng micro.
// =====================================================================
function installGiongNoi(G) {
  const C = G.chung;
  if (!C || !G.events || !G.save || !G.sound) return;

  // ---------- Hằng số ----------
  const SPEAK_RMS = 0.02;                     // ngưỡng "đang nói" (RMS 0–1)
  const MAX_OPEN = 6;                         // số micro mở tối đa trong nhóm (kiểm tra lịch sự: cờ vo do người kia tự khai)
  const MAX_LISTENERS = 7;                    // số người đang nghe tối đa (không tính mình) khi mình mở micro
  const MAX_NODES = 8;                        // số luồng giọng phát cùng lúc
  const METER_HZ = 15, ATTACK_S = 0.05, RELEASE_S = 0.4; // vòng đo mức: lên nhanh 0,05 s, xuống chậm 0,4 s
  const RAMP = 0.08;                          // setTargetAtTime của gain từng người
  const DUCK_HOLD_MS = 1500;                  // hạ nhạc kéo dài thêm 1,5 giây sau tiếng nói cuối cùng nghe được
  const GUM_ERRORS = new Set(['NotAllowedError', 'SecurityError', 'NotFoundError', 'OverconstrainedError', 'NotReadableError', 'AbortError']); // tên lỗi getUserMedia có câu báo riêng; lỗi khác → 'err-other'
  const REFUSALS = new Set(['in-app', 'no-devices', 'cap', 'group']); // bốn lý do từ chối mở micro; blockReason mang đúng các giá trị này (nút micro vẫn hiện, chỉ mờ đi)
  const shut = (reason) => closeMic(reason).catch((e) => fail('close', e)); // đóng micro từ các nơi không chờ kết quả
  const META = { v: 1, k: 'voice' };          // nhãn đi kèm luồng: người nhận bỏ qua luồng không có k = 'voice'
  const GUM = { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false };
  const emit = (n, ...a) => G.events.emit(n, ...a);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const errMsg = (e) => String((e && ((e.name ? e.name + ': ' : '') + (e.message || ''))) || e).slice(0, 120);
  const fail = (what, e) => { stats.errors++; try { C.diagErr('voice ' + what + ': ' + errMsg(e)); } catch (x) { /* bỏ qua */ } };

  // ---------- Trạng thái ----------
  let state = 'off';                          // 'off' | 'opening' | 'open'
  let room = null, roomCode = '', roomGen = 0; // phòng Trystero hiện tại (module 22 báo qua 'chung:room'); roomGen tăng mỗi lần đổi phòng
  let openTok = 0, closing = false;           // openTok đổi mỗi lần mở / đóng / dọn phòng: lần mở đang chờ getUserMedia thấy số khác thì tự bỏ
  let vctx = null, silent = null;             // AudioContext riêng của giọng nói + track im lặng (giữ dòng RTP không bao giờ khô sau lần mở đầu)
  let mic = null, out = null;                 // track micro hiện tại; MediaStream gửi đi luôn đúng MỘT track (micro khi mở, silent khi không)
  let ownSrc = null, ownAn = null, ownMute = null, own = 0; // đo mức giọng của chính mình
  const sentTo = new Map();                   // id → { pc, sender, want, p }: đường gửi đã có tới người đó (theo kết nối, không chỉ theo id)
  const adds = new Map();                     // id → Promise của addStream đang chạy (chặn gọi addStream lần hai trên cùng kết nối)
  const tries = new Map();                    // id → { pc, n }: số lần không tìm thấy sender sau addStream (tối đa 3 mỗi kết nối)
  const streams = new Map();                  // id → MediaStream nhận được; giữ cả khi chưa phát (Trystero không phát lại)
  const nodes = new Map();                    // id → nút phát { id, stream, route, el, src, an, gain, lvl }
  const levels = new Map();                   // id → { raw, heard }
  const muted = new Set();                    // id bị mình "Tắt giọng" (chỉ trong phiên)
  let quiet = 1;                              // hệ số giọng đến: 1, 0,25 (tụng kinh) hoặc 0 (ngồi thiền)
  let route = 'graph';                        // 'graph' (Path A, qua Web Audio của trò chơi) | 'element' (Path B)
  let silenceMs = 120000;                     // bao lâu không nghe thấy mình nói thì tự tắt micro
  let openWaitMs = 30000;                     // chờ getUserMedia tối đa bao lâu thì bỏ (Firefox: bấm "Not now" thì lời hứa không bao giờ được trả lời)
  let meterT = 0, tickT = 0, lastMeter = 0, mbuf = null;
  let lastOwnSpeak = 0, lastHeard = -1e9, duckOn = false, quietT = 0, sessionPrev = null; // lần cuối mình nói / nghe thấy ai nói (ms), đang hạ nhạc, hẹn giờ quy tắc im, kiểu audioSession cũ
  let firstOpenDone = false, mutedGameDone = false, firstVoiceDone = false; // các câu báo chỉ hiện một lần mỗi lần tải trang
  const stats = { opens: 0, autoClosed: 0, refusedCap: 0, refusedGroup: 0, errors: 0, silentFallback: 0 };

  const peerById = (id) => { const l = C.list; for (let i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; };
  const pcMap = () => { try { return (room && room.getPeers()) || {}; } catch (e) { return {}; } }; // id → RTCPeerConnection

  // ---------- Điều kiện: ai được nghe, ai được nói ----------
  function baseReason() { // vì sao nút micro không hiện ('' = hiện); chưa tính trạng thái micro
    if (!C.on) return 'off';
    if (!C.code) return 'public';
    if (!C.voiceEligible) return 'short-code';
    if (!C.voiceCfg.voice) return 'switch-off';
    return '';
  }
  const available = () => baseReason() === '';
  function liveWith(bit, skipHidden) { // số người đang hiện diện có cờ vo này (tự khai); skipHidden: bỏ người mình đã ẩn
    let n = 0; const l = C.list;
    for (let i = 0; i < l.length; i++) { const p = l[i]; if (!p.gone && C.isLive(p) && (p.vo & bit) && !(skipHidden && C.isHidden(p.id))) n++; }
    return n;
  }
  function refusal() { // lý do không mở được micro lúc này, theo đúng thứ tự của đặc tả ('' = mở được); không ai bị hỏi quyền micro chỉ để bị từ chối
    if (C.inApp) return 'in-app';
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return 'no-devices';
    if (liveWith(2, false) >= MAX_OPEN) return 'cap'; // người bị ẩn hay bị tắt giọng vẫn đang gửi nên vẫn được đếm
    if (liveWith(1, true) > MAX_LISTENERS) return 'group'; // người mình đã ẩn không nhận giọng của mình nên không tính
    return '';
  }
  const blockReason = () => baseReason() || (state === 'off' ? refusal() : ''); // đang mở thì nút luôn bấm được để tắt
  function refuse(why) { // đếm và báo lý do từ chối; không bao giờ gọi getUserMedia
    if (why === 'cap') stats.refusedCap++; else if (why === 'group') stats.refusedGroup++;
    emit('voice:notice', why);
  }
  const modeNow = () => (G.ngoi && G.ngoi.mode) || null; // 'thien' | 'tung' | null (module 45)
  const quietFactor = () => (C.voiceCfg.voiceQuiet ? (modeNow() === 'thien' ? 0 : modeNow() === 'tung' ? 0.25 : 1) : 1);
  const quietHold = () => quietFactor() < 1; // đang ngồi thiền / tụng kinh với "Tự im" bật: micro không được mở
  const listening = () => available() && G.sound.gain('voice') > 0; // công tắc bật, mã đủ dài, đang bật đi chùa chung, kênh giọng nói > 0
  const flags = () => (listening() ? 1 : 0) | (state === 'open' ? 2 : 0); // bit 1: đang nghe, bit 2: đang mở micro (gói st của module 22)

  // Báo "voice:change" khi thứ giao diện cần vẽ lại đổi; luôn đồng bộ lại nút phát và đường gửi trước khi báo
  let sig = '';
  const signature = () => [listening() ? 1 : 0, available() ? 1 : 0, blockReason(), quiet, Array.from(muted).sort().join(',')].join('|');
  function refresh() {
    const q = quietFactor();
    if (q !== quiet) { quiet = q; applyGains(); } // ngồi thiền → 0, tụng kinh → 0,25, xong → 1 (cũng đổi khi bật / tắt "Tự im" giữa chừng)
    if (!available() && state !== 'off') shut(''); // công tắc nghe hoặc đi chùa chung tắt: đóng micro, không báo
    const s = signature();
    if (s === sig) return;
    sig = s;
    syncAll(); reconcile();
    emit('voice:change');
  }
  function setState(s) { if (s === state) return; state = s; emit('voice:state', s); updateDuck(); refresh(); }

  // ---------- AudioContext riêng + track im lặng ----------
  function ensureVctx() { // PHẢI chạy đồng bộ trong cú chạm, trước mọi await: iOS chỉ cho AudioContext bắt đầu ngay trong cú chạm
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!vctx || vctx.state === 'closed') { vctx = new AC(); silent = null; }
      const r = vctx.resume(); if (r && r.catch) r.catch(() => { /* chưa được phép thì thôi */ });
      if (!silent) {
        const osc = vctx.createOscillator(), g = vctx.createGain(), dest = vctx.createMediaStreamDestination();
        g.gain.value = 0; osc.connect(g); g.connect(dest); osc.start(); // im lặng tuyệt đối
        silent = dest.stream.getAudioTracks()[0] || null;
      }
    } catch (e) { fail('vctx', e); }
  }
  function swapOut(t) { // out luôn đúng một track (không có track nào khi không có silent)
    if (!out) return;
    for (const o of out.getTracks()) if (o !== t) out.removeTrack(o);
    if (t && !out.getTracks().includes(t)) out.addTrack(t);
  }
  function killMic(m) { if (!m) return; try { m.enabled = false; m.stop(); } catch (e) { /* đã dừng */ } }
  const stopStream = (s) => { try { for (const t of s.getTracks()) killMic(t); } catch (e) { /* bỏ qua */ } };
  function sessionSet() { // iOS 16.4+: cho phép vừa thu vừa phát; nhớ kiểu cũ để trả lại khi tắt micro
    try { const a = navigator.audioSession; if (a && 'type' in a) { if (sessionPrev === null) sessionPrev = a.type; a.type = 'play-and-record'; } } catch (e) { fail('audioSession', e); }
  }
  function sessionRestore() {
    try { const a = navigator.audioSession; if (a && sessionPrev !== null) a.type = sessionPrev; } catch (e) { fail('audioSession', e); }
    sessionPrev = null;
  }

  // ---------- Gửi: một đường (sender) cho mỗi người nghe, đổi track bằng sender.replaceTrack ----------
  function wantFor(p) { // track mong muốn trên đường tới người này: micro nếu đủ bốn điều kiện, ngược lại silent
    return state === 'open' && mic && C.isLive(p) && (p.vo & 1) && !C.isHidden(p.id) ? mic : silent;
  }
  function findSender(pc) { try { return pc.getSenders().find((s) => s.track && (s.track === mic || s.track === silent)) || null; } catch (e) { return null; } }
  const mkEntry = (pc, sender) => ({ pc, sender, want: sender.track, p: null });
  function setTrack(e, want) {
    if (e.want === want) return e.p;
    e.want = want;
    e.p = e.sender.replaceTrack(want).catch((err) => { e.want = e.sender.track; fail('replaceTrack', err); });
    return e.p;
  }
  function noteTry(id, pc) {
    const t = tries.get(id);
    if (t && t.pc === pc) t.n++; else tries.set(id, { pc, n: 1 });
    fail('addStream', 'không tìm thấy sender');
  }
  function addTo(id, pc) { // đúng MỘT addStream cho mỗi kết nối, luôn kèm target trong đối tượng tuỳ chọn
    if (!pc || !out || adds.has(id)) return;
    const t = tries.get(id);
    if (t && t.pc === pc && t.n >= 3) return;
    const known = findSender(pc);
    if (known) { sentTo.set(id, mkEntry(pc, known)); return; } // đã có sẵn đường gửi: không gọi addStream lần hai
    const g0 = roomGen;
    let ps;
    try { ps = [].concat(room.addStream(out, { target: id, metadata: META })); } catch (e) { fail('addStream', e); return; }
    const settled = Promise.allSettled(ps).then(() => {
      if (adds.get(id) === settled) adds.delete(id);
      if (g0 !== roomGen || !room) return;
      const cur = sentTo.get(id);
      if (cur && cur.pc === pc) return;
      const s = findSender(pc);
      if (s && pcMap()[id] === pc) { sentTo.set(id, mkEntry(pc, s)); reconcile(); } else noteTry(id, pc);
    });
    adds.set(id, settled);
    const s0 = findSender(pc); // sát sau lệnh gọi (nếu Trystero đã gắn track ngay); lần tìm thứ hai là sau khi promise xong
    if (s0) sentTo.set(id, mkEntry(pc, s0));
  }
  function reconcile() {
    if (!room) return;
    const pcs = pcMap();
    for (const [id, e] of sentTo) {
      const p = peerById(id);
      if (!p || p.gone || pcs[id] !== e.pc) { sentTo.delete(id); continue; } // người đã đi, hoặc nối lại bằng kết nối mới (cùng id, pc khác)
      setTrack(e, wantFor(p));
    }
    if (state === 'open' && mic) {
      const l = C.list;
      for (let i = 0; i < l.length; i++) { const p = l[i]; if (!p.gone && !sentTo.has(p.id) && wantFor(p) === mic) addTo(p.id, pcs[p.id]); } // người chỉ cần im lặng thì không tạo đường gửi
    }
  }
  async function settleAll() { // đợi mọi đường gửi (kể cả addStream đang chạy) xong và đã chuyển sang silent
    const want = silent || null;
    for (let i = 0; i < 3; i++) {
      reconcile();
      const ps = [];
      for (const e of sentTo.values()) if (e.p) ps.push(e.p);
      for (const p of adds.values()) ps.push(p);
      if (ps.length) await Promise.race([Promise.allSettled(ps), sleep(2000)]);
      if (!adds.size && Array.from(sentTo.values()).every((e) => e.sender.track === want)) return;
    }
  }

  // ---------- Đo mức ----------
  function buildOwn() { // đo giọng của chính mình trên vctx: nguồn micro → máy phân tích → gain 0 → đích (nguồn gắn với track nên dựng lại mỗi lần mở)
    dropOwn();
    if (!vctx || !mic) return;
    try {
      ownSrc = vctx.createMediaStreamSource(new MediaStream([mic]));
      ownAn = vctx.createAnalyser(); ownAn.fftSize = 2048; ownAn.smoothingTimeConstant = 0;
      ownMute = vctx.createGain(); ownMute.gain.value = 0;
      ownSrc.connect(ownAn); ownAn.connect(ownMute); ownMute.connect(vctx.destination);
    } catch (e) { fail('own-level', e); dropOwn(); return; }
    startMeter();
  }
  function dropOwn() {
    for (const n of [ownSrc, ownAn, ownMute]) { try { n && n.disconnect(); } catch (e) { /* bỏ qua */ } }
    ownSrc = ownAn = ownMute = null; own = 0;
  }
  function rms(an) { an.getFloatTimeDomainData(mbuf); let s = 0; for (let i = 0; i < mbuf.length; i++) s += mbuf[i] * mbuf[i]; return Math.sqrt(s / mbuf.length); }
  const smooth = (prev, x, dt) => prev + (x - prev) * (1 - Math.exp(-dt / (x > prev ? ATTACK_S : RELEASE_S)));
  function meter() {
    const t = performance.now(), dt = Math.min(0.5, Math.max(0.001, (t - lastMeter) / 1000)); lastMeter = t;
    const ac = G.audio && G.audio.ctx;
    const hear = !!ac && ac.state === 'running' && !document.hidden; // ngữ cảnh của trò chơi tạm dừng (tắt tiếng, ẩn thẻ) → máy phân tích đứng yên → mức 0
    for (const [id, n] of nodes) {
      n.lvl = hear && n.an ? smooth(n.lvl, rms(n.an), dt) : 0;
      let lv = levels.get(id); if (!lv) { lv = { raw: 0, heard: 0 }; levels.set(id, lv); }
      lv.raw = n.lvl; lv.heard = n.lvl * gainOf(id);
      if (lv.heard > SPEAK_RMS) lastHeard = t; // giọng thật sự nghe được (đã nhân mức đích): người bị tắt giọng, bị ẩn hay đang im không hạ nhạc
    }
    own = ownAn ? smooth(own, rms(ownAn), dt) : 0;
    if (state === 'open') {
      if (own >= SPEAK_RMS) lastOwnSpeak = t; // đang nói thì đồng hồ im lặng chạy lại từ đầu
      else if (t - lastOwnSpeak > silenceMs) { stats.autoClosed++; shut('silence'); }
    }
    updateDuck();
    if (!nodes.size && !ownAn) stopMeter();
  }
  function startMeter() { if (meterT) return; if (!mbuf) mbuf = new Float32Array(2048); lastMeter = performance.now(); meterT = setInterval(meter, 1000 / METER_HZ); }
  function stopMeter() { clearInterval(meterT); meterT = 0; own = 0; lastHeard = -1e9; updateDuck(); }
  function updateDuck() { // hạ nhạc (×0,35) và âm nền (×0,5) khi micro của mình đang mở hoặc vừa có giọng nghe được trong 1,5 giây qua
    const on = state === 'open' || performance.now() - lastHeard < DUCK_HOLD_MS;
    if (on === duckOn) return;
    duckOn = on;
    try { if (G.audio && G.audio.voiceDuck) G.audio.voiceDuck(on); } catch (e) { fail('duck', e); }
  }

  // ---------- Nhận: mỗi người một nút phát (Path A: Web Audio của trò chơi) ----------
  function gainOf(id) { return muted.has(id) ? 0 : quiet; } // mức đích của một người
  const gameMuted = () => !!(G.audio && G.audio.isMuted && G.audio.isMuted());
  const elementMuted = (id) => gainOf(id) < 1 || gameMuted(); // Path B không chỉnh được to nhỏ: chỉ tắt hẳn (tắt giọng, tụng kinh, thiền, hoặc trò chơi đang tắt tiếng)
  function applyGains() {
    for (const n of nodes.values()) {
      if (n.gain) { try { n.gain.gain.setTargetAtTime(gainOf(n.id), n.gain.context.currentTime, RAMP); } catch (e) { /* bỏ qua */ } }
      else if (n.route === 'element' && n.el) n.el.muted = elementMuted(n.id);
    }
  }
  function routeKind() { // 'graph' (Path A) | 'element' (Path B) | 'defer' (âm thanh của trò chơi chưa khởi tạo: đợi 'audio:ready')
    const bus = G.audio && G.audio.voiceIn && G.audio.voiceIn();
    if (bus && route === 'graph') return 'graph';
    if (!bus && G.audio && !G.started && route === 'graph') return 'defer'; // âm thanh được khởi tạo ngay trong cú chạm "Vào chùa"
    return 'element'; // khởi tạo hỏng, hoặc đã chọn route = 'element' sau khi thử trên máy thật
  }
  function freshStream(id) { // track đã 'ended' → dựng lại luồng từ bộ nhận (receiver) âm thanh của chính kết nối đó
    const s = streams.get(id);
    if (!s || !s.getAudioTracks().some((t) => t.readyState === 'ended')) return s;
    try {
      const pc = pcMap()[id];
      const r = pc && pc.getReceivers().find((x) => x.track && x.track.kind === 'audio' && x.track.readyState !== 'ended');
      if (r) { const ns = new MediaStream([r.track]); streams.set(id, ns); return ns; }
    } catch (e) { fail('receiver', e); }
    return s;
  }
  function buildGraph(id, stream) {
    const bus = G.audio.voiceIn(), ac = bus.context;
    const n = { id, stream, route: 'graph', el: null, src: null, an: null, gain: null, lvl: 0 };
    try {
      n.el = document.createElement('audio'); n.el.muted = true; n.el.setAttribute('playsinline', ''); n.el.srcObject = stream; // Chrome chỉ cấp mẫu cho Web Audio khi có phần tử giữ luồng; Safari cần play() rõ ràng
      const pl = n.el.play(); if (pl && pl.catch) pl.catch(() => { /* chưa được phép phát thì thôi */ });
      n.src = ac.createMediaStreamSource(stream);
      n.an = ac.createAnalyser(); n.an.fftSize = 2048; n.an.smoothingTimeConstant = 0;
      n.gain = ac.createGain(); n.gain.gain.value = gainOf(id);
      n.src.connect(n.an); n.src.connect(n.gain); n.gain.connect(bus);
    } catch (e) { fail('node', e); freeNode(n); return; }
    nodes.set(id, n);
    startMeter();
  }
  function buildElement(id, stream) { // Path B: phần tử <audio> không tắt tiếng phát thẳng; máy phân tích (nếu có ngữ cảnh) chỉ để đo mức, đầu ra gain 0
    const n = { id, stream, route: 'element', el: null, src: null, an: null, gain: null, tap: null, lvl: 0 };
    try {
      n.el = document.createElement('audio'); n.el.setAttribute('playsinline', ''); n.el.srcObject = stream; n.el.muted = elementMuted(id);
      const pl = n.el.play(); if (pl && pl.catch) pl.catch(() => { /* chưa được phép phát thì thôi */ });
    } catch (e) { fail('node', e); freeNode(n); return; }
    const ac = (G.audio && G.audio.ctx) || vctx;
    if (ac) {
      try {
        n.src = ac.createMediaStreamSource(stream);
        n.an = ac.createAnalyser(); n.an.fftSize = 2048; n.an.smoothingTimeConstant = 0;
        n.tap = ac.createGain(); n.tap.gain.value = 0;
        n.src.connect(n.an); n.an.connect(n.tap); n.tap.connect(ac.destination);
      } catch (e) { fail('tap', e); } // đo mức hỏng thì chỉ mất dấu sóng và hạ nhạc, tiếng vẫn phát
    }
    nodes.set(id, n);
    startMeter();
  }
  function freeNode(n) {
    for (const x of [n.src, n.an, n.gain, n.tap]) { try { x && x.disconnect(); } catch (e) { /* bỏ qua */ } }
    if (n.el) { try { n.el.pause(); n.el.srcObject = null; } catch (e) { /* bỏ qua */ } }
  }
  function dropNode(id) {
    const n = nodes.get(id);
    if (!n) return;
    nodes.delete(id); levels.delete(id);
    freeNode(n);
  }
  const wantNode = (id) => listening() && streams.has(id) && !C.isHidden(id) && (nodes.has(id) || nodes.size < MAX_NODES); // tối đa MAX_NODES luồng phát cùng lúc; luồng dư được giữ và phát khi có chỗ
  function syncNodes(id) { // nút phát của một người chỉ tồn tại khi: đang nghe, người đó không bị ẩn, có luồng
    const n = nodes.get(id);
    if (!wantNode(id)) { if (n) dropNode(id); return; }
    const kind = routeKind();
    if (kind === 'defer') { if (n) dropNode(id); return; }
    const s = freshStream(id);
    if (n && n.stream === s && n.route === kind) return;
    if (n) dropNode(id);
    if (kind === 'graph') buildGraph(id, s); else buildElement(id, s);
  }
  function syncAll() { for (const id of Array.from(streams.keys())) syncNodes(id); }
  function onStream(stream, id, meta) {
    if (!stream || typeof id !== 'string' || !meta || meta.k !== 'voice') return; // chỉ nhận luồng giọng nói của trò chơi
    dropNode(id); // luồng mới thay luồng cũ của cùng người
    streams.set(id, stream); // giữ trước mọi kiểm tra nghe / ẩn: Trystero không phát lại luồng đã tới
    syncNodes(id);
    checkNotices();
  }
  function forget(id) { // người đi hoặc bị gỡ: bỏ nút, luồng và đường gửi
    dropNode(id); streams.delete(id); sentTo.delete(id); adds.delete(id); tries.delete(id); levels.delete(id);
    reconcile(); syncAll(); // chỗ trống thì luồng đang chờ được phát
  }
  function checkNotices() { // mỗi câu một lần mỗi lần tải trang; theo cờ vo + luồng đã có, KHÔNG theo mức âm
    if (!room || !listening()) return;
    const gm = gameMuted(), l = C.list;
    for (let i = 0; i < l.length; i++) {
      const p = l[i];
      if (p.gone || !C.isLive(p) || !(p.vo & 2) || !streams.has(p.id)) continue;
      if (gm) { if (!mutedGameDone) { mutedGameDone = true; emit('voice:notice', 'muted-game'); } }
      else if (!firstVoiceDone && nodes.has(p.id) && gainOf(p.id) > 0) { firstVoiceDone = true; emit('voice:notice', 'first-voice'); }
    }
  }

  // ---------- Mở / tắt micro ----------
  async function openMic() {
    if (state !== 'off' || closing || !available() || !room || quietHold()) return false; // đang ngồi thiền / tụng kinh với "Tự im" bật: không mở
    const why = refusal();
    if (why) { refuse(why); return false; }
    const tok = ++openTok, g0 = roomGen;
    ensureVctx(); // 1. đồng bộ trong cú chạm
    sessionSet(); // 2.
    setState('opening');
    const wd = setTimeout(() => { if (tok === openTok && state === 'opening') { openTok++; sessionRestore(); setState('off'); } }, openWaitMs); // getUserMedia không trả lời: về "off"; trả lời muộn thì rơi vào nhánh "stale" bên dưới (dừng track, không báo gì)
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia(GUM); // 3. gọi ngay trong cú chạm
    } catch (e) {
      clearTimeout(wd);
      fail('getUserMedia', e);
      if (tok === openTok) { sessionRestore(); setState('off'); emit('voice:notice', GUM_ERRORS.has(e && e.name) ? 'err-' + e.name : 'err-other'); }
      return false;
    }
    clearTimeout(wd);
    const track = stream.getAudioTracks()[0];
    const stale = tok !== openTok || g0 !== roomGen || !room || !track; // đóng / đổi phòng trong lúc chờ
    const why2 = stale ? '' : !available() || document.hidden || quietHold() ? 'blocked' : refusal(); // điều kiện mở có còn đúng không, kể cả hạn mức: kiểm tra lại sau khi có micro
    if (stale || why2) { // dừng track mới ngay và ở yên trạng thái tắt
      stopStream(stream);
      if (tok === openTok) { sessionRestore(); setState('off'); if (REFUSALS.has(why2)) refuse(why2); }
      return false;
    }
    mic = track; // 4. đưa micro vào out
    if (!out) out = new MediaStream();
    swapOut(mic);
    const onEnd = () => { if (mic === track && state === 'open') shut('ended'); }; // cuộc gọi, ứng dụng khác, đổi tai nghe...
    track.addEventListener('ended', onEnd); track.addEventListener('mute', onEnd);
    buildOwn(); // 5.
    stats.opens++;
    lastOwnSpeak = performance.now();
    setState('open'); // 6.
    reconcile();
    if (!C.list.some((p) => !p.gone && C.isLive(p))) emit('voice:notice', 'alone'); // mở được, nhưng chưa ai trong nhóm để nghe
    if (!firstOpenDone) { firstOpenDone = true; emit('voice:notice', 'first-open'); }
    return true;
  }
  async function closeMic(reason) {
    if (state === 'opening') { openTok++; sessionRestore(); setState('off'); return; } // lần mở đang chờ getUserMedia tự dừng track khi nó xong
    if (state !== 'open' || closing) return;
    closing = true;
    const m = mic, g0 = roomGen;
    if (m) m.enabled = false; // track tắt tiếng ngay: dù replaceTrack chậm, giọng không còn tới người nghe (killMic nhả hẳn sau settleAll)
    state = 'off'; swapOut(silent); // 1. cờ vo bit 2 tắt ngay ở gói st kế tiếp; out chỉ còn silent
    if (!silent) stats.silentFallback++;
    try { await settleAll(); } catch (e) { fail('close', e); } // 2. mọi sender chuyển sang silent và đã xong
    killMic(m); // 3. rồi mới nhả micro (tắt chỉ báo của hệ điều hành)
    if (g0 === roomGen) { mic = null; dropOwn(); sessionRestore(); } // 4. và 5.
    closing = false;
    emit('voice:state', 'off'); // 6.
    if (reason) emit('voice:notice', reason);
    updateDuck();
    refresh();
  }

  // ---------- Phòng: gắn / dọn theo sự kiện 'chung:room' của module 22 ----------
  function teardownRoom() { // các kết nối sắp bị Trystero đóng: dừng micro ngay, không cần chuyển sang silent
    openTok++;
    const m = mic; mic = null; killMic(m);
    out = null; sentTo.clear(); adds.clear(); tries.clear();
    for (const id of Array.from(nodes.keys())) dropNode(id);
    streams.clear(); levels.clear();
    clearInterval(tickT); tickT = 0;
    if (state !== 'off') { state = 'off'; emit('voice:state', 'off'); }
    dropOwn(); sessionRestore(); stopMeter();
  }
  function onRoom(info) {
    const nr = (info && info.room) || null;
    if (nr === room) return; // lặp lại cùng phòng: bỏ qua
    const wasOpen = state === 'open', prevCode = roomCode;
    teardownRoom();
    if (wasOpen && info && String(info.code || '') !== prevCode) emit('voice:notice', 'code-change'); // đổi mã nhóm khi đang mở micro (tắt đi chùa chung giữ nguyên mã nên không báo)
    room = nr; roomCode = nr ? String(info.code || '') : '';
    roomGen++;
    if (nr) {
      const g = roomGen;
      nr.onPeerStream = (s, id, meta) => { if (g === roomGen) onStream(s, id, meta); };
      tickT = setInterval(() => { reconcile(); syncAll(); checkNotices(); refresh(); }, 1000); // kiểm tra người im quá lâu, kết nối đổi, luồng hỏng, số người nói / nghe
    }
    refresh();
  }

  // ---------- Đăng ký sự kiện ----------
  function limits() { // nhóm đông hơn MAX_LISTENERS người nghe khi mình đang nói: micro tạm tắt
    if (state === 'open' && liveWith(1, true) > MAX_LISTENERS) shut('group-close');
  }
  G.events.on('chung:room', onRoom);
  G.events.on('chung:vo', () => { reconcile(); limits(); checkNotices(); refresh(); });
  G.events.on('chung:hide', (id, on) => { if (on) dropNode(id); else syncNodes(id); reconcile(); syncAll(); limits(); refresh(); });
  G.events.on('chung:peer-leave', forget);
  G.events.on('chung:peer-remove', forget);
  G.events.on('chung:change', refresh);
  G.events.on('sound:change', refresh);
  G.events.on('audio:ready', () => syncAll());
  G.events.on('audio:mute', () => { applyGains(); checkNotices(); });
  G.events.on('ngoi:mode', () => { // vào / ra thiền hay tụng kinh: chỉ áp giá trị cuối cùng của nhịp này (newScreen() gọi endScreen() trước)
    clearTimeout(quietT);
    quietT = setTimeout(() => {
      refresh();
      if (!quietHold()) return;
      if (state === 'open') shut(modeNow() === 'thien' ? 'quiet-thien' : 'quiet-tung');
      else if (state === 'opening') { openTok++; sessionRestore(); setState('off'); }
    }, 0);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) shut(''); }); // ẩn thẻ: tắt micro, không báo
  window.addEventListener('pagehide', () => shut(''));
  sig = signature();

  // ---------- API công khai ----------
  function mutePeer(id, on) {
    if (typeof id !== 'string') return;
    if (on) muted.add(id); else muted.delete(id);
    applyGains();
    try { C.relist(); } catch (e) { /* bỏ qua */ }
    emit('chung:change'); // module 25 vẽ lại danh sách người; refresh() chạy qua sự kiện này
    refresh();
  }
  const trackKind = (t) => (t == null ? 'null' : t === mic ? 'mic' : t === silent ? 'silent' : 'other');
  G.voice = {
    SPEAK_RMS, MAX_OPEN, MAX_LISTENERS, MAX_NODES,
    flags,
    get listening() { return listening(); },
    get state() { return state; },
    get available() { return available(); },
    get blockReason() { return blockReason(); },
    get levels() { return levels; },
    get ownLevel() { return own; },
    get quiet() { return quiet; },
    get stats() { return Object.assign({ sentTo: sentTo.size, streams: streams.size, activeNodes: nodes.size }, stats); },
    openMic, closeMic, mutePeer,
    isMuted: (id) => muted.has(id),
    gainOf,
    analyserOf: (id) => { const n = nodes.get(id); return n && n.an ? n.an : null; },
    debug() {
      const pcs = pcMap();
      return {
        sentTo: Array.from(sentTo, ([id, e]) => ({ id, track: trackKind(e.sender.track), pcOk: pcs[id] === e.pc })),
        streams: Array.from(streams.keys()),
        nodes: Array.from(nodes.values(), (n) => ({ id: n.id, gain: gainOf(n.id), route: n.route })),
        vctx: vctx ? vctx.state : null, room: !!room, roomGen,
      };
    },
    get route() { return route; }, set route(v) { route = v === 'element' ? 'element' : 'graph'; syncAll(); },
    get silenceMs() { return silenceMs; }, set silenceMs(v) { const n = +v; if (n > 0) silenceMs = n; },
    get openWaitMs() { return openWaitMs; }, set openWaitMs(v) { const n = +v; if (n > 0) openWaitMs = n; },
  };
}
