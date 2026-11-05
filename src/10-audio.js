// =====================================================================
//  ÂM THANH: toàn bộ tiếng được tổng hợp bằng Web Audio (không dùng tệp âm thanh),
//  trừ bài nhạc nền người chơi tự chọn (11-music.js) — phát qua đường musicBus ở đây.
//  Mỗi nhóm tiếng đi qua một kênh (CAT) để người chơi bật/tắt, chỉnh to nhỏ trong "Cài đặt âm thanh".
//  Gồm chuỗi master + vang, âm nền (gió, lá xào xạc, chim, dế, tiếng tụng kinh xa,
//  chuông xa) và các hiệu ứng: chuông đồng, mõ, hương, xăm, nước, ruy băng, bước chân…
//  G.audio có sẵn ngay sau khi cài; init() được gọi trong cú chạm "Vào chùa".
// =====================================================================
function installAudio(G) {
  const { THREE, util: U } = G;
  const AC = window.AudioContext || window.webkitAudioContext;
  const rand = U.rand, randInt = U.randInt, clamp = U.clamp;
  const noop = () => {};
  const MIN = 0.0001; // sàn biên độ cho các đường cong hàm mũ

  // ===== Mức âm lượng & hằng số (chỉnh âm lượng tại đây) =====
  const LV = {
    master: 0.9,
    wind: 0.15, leaves: 0.07, birds: 0.04, crickets: 0.024, chant: 0.28, // âm nền
    bell: 0.15, bellSoft: 0.15, bowl: 0.17, mo: 0.3, ui: 0.11, chime: 0.15, step: 0.06, // hiệu ứng
    duck: 0.6, // khi đang làm hoạt động, âm nền còn 60% (hạ ~40%)
    music: 0.23, musicDuck: 0.4, // nhạc nền (bài gốc ~-13 LUFS → ~-26 LUFS); khi làm hoạt động còn 40%
    windChime: 0.045, // chuông gió dưới mái hiên: rất khẽ
  };
  const HALL = { x: 0, z: G.frame.xf(0, 0, -16).z }; // tâm chính điện (toạ độ gốc -16 → xf: phóng 1,2× + dời ra sau Tích Thiện Am): nơi nghe tụng kinh rõ nhất
  const CH_BASE = 118; // cao độ nền của đoàn tụng (Hz)

  // ===== Trạng thái chung =====
  let ctx = null, ready = false, initAt = -1e9;
  let master = null, tone = null, comp = null, sfxBus = null, ambBus = null, sfxRev = null, ambRev = null, musicBus = null;
  let convolver = null, revHP = null, revReturn = null;
  let bufWhite = null, bufPink = null;
  let muted = !!(G.save && G.save.data && G.save.data.muted), mutedTouched = false;
  let ducked = false, lowQ = false, hiddenSuspended = false;
  let suspendTimer = 0, lookTimer = 0;
  let budget = 160, budgetT = 0; // "ngân sách giọng": chống quá tải khi quá nhiều tiếng phát dồn dập
  let lastStep = -1, lastUi = -1, stepSide = 1, curVol = 1;
  let nightS = 0, proxS = 0.1;
  let windBus = null, gustG = null, cricketBus = null, chant = null;
  const SFXT = { dry: null, rev: null }; // đích của hiệu ứng: đường khô + đường vang
  const AMBT = { dry: null, rev: null }; // đích của âm thanh xung quanh: gió, lá, chim, dế (bị hạ khi đang làm hoạt động)
  const CHT = { dry: null, rev: null };  // đích của tiếng tụng kinh + chuông chùa ngân xa
  const WCT = { dry: null, rev: null };  // đích của chuông gió
  const CAT = {}; // kênh người chơi chỉnh trong "Cài đặt âm thanh": tên kênh → các nút gain
  const timers = new Set();
  const offs = []; // hàm huỷ đăng ký sự kiện
  const bells = [], softBells = [], bowls = [];
  const crickets = [];

  // ===== Tiện ích dựng nút Web Audio =====
  function mkGain(v) { const g = ctx.createGain(); g.gain.value = v; return g; }
  function mkFilter(type, f, q) { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q != null) b.Q.value = q; return b; }
  function mkOsc(type, f) { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; return o; }
  // mỗi lần phát tốn một ít "ngân sách", hồi dần theo giờ AudioContext; tiếng quan trọng (chuông, mõ) luôn được phát
  function spend(cost, vital) {
    const now = ctx.currentTime;
    budget = Math.min(160, budget + Math.max(0, now - budgetT) * 80); budgetT = now;
    if (budget < cost && !vital) return false;
    budget -= cost; return true;
  }
  const COST = { bell: 20, bellSoft: 14, bowlBell: 8, chime: 9, shake: 6, water: 8, incense: 6, ribbon: 5, stickDrop: 6, ui: 3, mo: 6, step: 3, windChime: 6 };
  // bao biên độ: lên nhanh rồi tắt dần theo hàm mũ
  function env(p, t, peak, atk, dec) {
    p.setValueAtTime(MIN, t); p.linearRampToValueAtTime(Math.max(peak, MIN * 2), t + atk); p.exponentialRampToValueAtTime(MIN, t + atk + dec);
  }
  // nguồn nhiễu phát một lần, tự dừng sau dur giây (bắt đầu ở vị trí ngẫu nhiên trong bộ đệm)
  function noiseSrc(buf, t, dur) {
    const s = ctx.createBufferSource(); s.buffer = buf;
    const span = buf.duration;
    if (dur < span - 0.1) s.start(t, rand(0, span - dur - 0.05));
    else { s.loop = true; s.start(t, rand(0, span)); }
    s.stop(t + dur);
    return s;
  }
  function loopNoise(buf) { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(0, rand(0, buf.duration)); return s; }
  function lfo(freq, depth, param) {
    const o = mkOsc('sine', freq), g = mkGain(depth);
    o.connect(g); g.connect(param); o.start(); return o;
  }
  function pan(node, p) {
    if (!ctx.createStereoPanner) return node;
    const s = ctx.createStereoPanner(); s.pan.value = clamp(p, -1, 1); node.connect(s); return s;
  }
  // nối node ra đường khô/đường vang của một đích (tgt), nhân với âm lượng riêng của lần phát (curVol)
  function out(node, tgt, dry, send, keep) {
    const d = dry * curVol, s = send * curVol;
    if (d > 0) {
      if (d === 1) node.connect(tgt.dry);
      else { const g = mkGain(d); node.connect(g); g.connect(tgt.dry); if (keep) keep.push(g); }
    }
    if (s > 0) { const g = mkGain(s); node.connect(g); g.connect(tgt.rev); if (keep) keep.push(g); }
  }
  // khi nguồn kết thúc, ngắt các nút của giọng đó khỏi đồ thị cho nhẹ
  function tidy(src, nodes) {
    if (!src) return;
    try { src.addEventListener('ended', () => { for (let i = 0; i < nodes.length; i++) { try { nodes[i].disconnect(); } catch (e) {} } }); } catch (e) {}
  }
  function resumeCtx() { try { const p = ctx.resume(); if (p && p.catch) p.catch(noop); } catch (e) {} }
  function suspendCtx() { try { const p = ctx.suspend && ctx.suspend(); if (p && p.catch) p.catch(noop); } catch (e) {} }
  // hẹn giờ có theo dõi (để dispose dọn được)
  function later(fn, ms) {
    const id = setTimeout(() => { timers.delete(id); try { fn(); } catch (e) { console.error('[âm thanh]', e); } }, ms);
    timers.add(id); return id;
  }
  const audible = () => ready && !muted && !document.hidden && ctx.state === 'running';
  // kênh trong "Cài đặt âm thanh" còn nghe được không; tắt hoặc kéo về 0 thì thôi tổng hợp tiếng của kênh đó
  const chOn = (k) => !G.sound || (G.sound.gain(k) > 0 && G.sound.gain('master') > 0);
  const PVT = { dry: null, rev: null }; // đích nghe thử 'Âm lượng chung': bỏ qua các kênh, chỉ qua âm lượng chung
  function canPlay() {
    if (!ready || muted || document.hidden) return false;
    return ctx.state === 'running' || performance.now() - initAt < 1500; // vừa khởi tạo: cho phép xếp lịch trước
  }

  // ===== Tạo đồ thị: master, vang, bộ đệm nhiễu =====
  // Xung vang ~3.5 s: nhiễu tắt dần theo hàm mũ, càng về sau càng tối, vài tiếng dội sớm
  function makeImpulse(sec) {
    const sr = ctx.sampleRate, n = Math.floor(sr * sec), buf = ctx.createBuffer(2, n, sr);
    const early = [0.011, 0.023, 0.037, 0.052, 0.071, 0.093];
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch), r = U.rng(4107 + ch * 31);
      const pre = Math.floor(sr * (0.012 + ch * 0.0013));
      const len = n - pre, eStep = Math.exp(-6.4 / len), cStep = Math.exp(-5.5 / len), fadeIn = Math.floor(sr * 0.015);
      let lp = 0, e = 1, cc = 1; // e: bao tắt dần, cc: độ sáng của bộ lọc (cập nhật bằng phép nhân, không gọi exp mỗi mẫu)
      for (let i = 0; i < pre; i++) d[i] = 0;
      for (let i = 0; i < len; i++) {
        lp += ((r() * 2 - 1) - lp) * (0.05 + 0.65 * cc); // thông thấp: sáng lúc đầu, tối dần
        d[pre + i] = lp * e * (i < fadeIn ? 1 - Math.exp((-i / sr) * 400) : 1) * 1.6;
        e *= eStep; cc *= cStep;
      }
      for (let q = 0; q < early.length; q++) {
        const j = pre + Math.floor(sr * (early[q] + ch * 0.0017));
        if (j < n) d[j] += (r() < 0.5 ? -1 : 1) * 0.5 * Math.pow(0.78, q);
      }
    }
    return buf;
  }
  function makeNoise() {
    const sr = ctx.sampleRate;
    bufWhite = ctx.createBuffer(1, sr * 2, sr);
    bufPink = ctx.createBuffer(1, sr * 4, sr);
    const r = U.rng(90210);
    const w = bufWhite.getChannelData(0), p = bufPink.getChannelData(0);
    for (let i = 0; i < w.length; i++) w[i] = r() * 2 - 1;
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < p.length; i++) { // lọc Paul Kellet cho nhiễu hồng
      const x = r() * 2 - 1;
      b0 = 0.99886 * b0 + x * 0.0555179; b1 = 0.99332 * b1 + x * 0.0750759; b2 = 0.969 * b2 + x * 0.153852;
      b3 = 0.8665 * b3 + x * 0.3104856; b4 = 0.55 * b4 + x * 0.5329522; b5 = -0.7616 * b5 - x * 0.016898;
      p[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + x * 0.5362; b6 = x * 0.115926;
    }
    // đưa cả hai về cùng độ to (RMS ≈ 0.35) để dễ cân chỉnh
    for (const d of [w, p]) {
      let s = 0; for (let i = 0; i < d.length; i++) s += d[i] * d[i];
      const k = 0.35 / Math.sqrt(s / d.length);
      for (let i = 0; i < d.length; i++) d[i] *= k;
    }
  }
  function buildGraph() {
    master = mkGain(0);
    tone = mkFilter('lowpass', 9500, 0.5); // cắt bớt âm chói cho loa điện thoại
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 22; comp.ratio.value = 3; comp.attack.value = 0.008; comp.release.value = 0.3;
    const userG = mkGain(1); // âm lượng chung người chơi chỉnh (tách khỏi master để tắt tiếng / hiện dần không đè nhau)
    master.connect(userG); userG.connect(tone); tone.connect(comp); comp.connect(ctx.destination);
    sfxBus = mkGain(1); sfxBus.connect(master);
    ambBus = mkGain(1); ambBus.connect(master);
    musicBus = mkGain(LV.music); // nhạc nền: khô, không qua vang (nối ra master qua kênh 'music' bên dưới)
    convolver = ctx.createConvolver(); convolver.buffer = makeImpulse(3.5);
    revHP = mkFilter('highpass', 110, 0.6); revReturn = mkGain(0.85);
    sfxRev = mkGain(1); ambRev = mkGain(1);
    sfxRev.connect(convolver); ambRev.connect(convolver);
    convolver.connect(revHP); revHP.connect(revReturn); revReturn.connect(master);
    // mỗi kênh một cặp gain khô/vang đổ vào bus chung (bus chung vẫn lo việc hạ âm khi làm hoạt động)
    const pair = (tgt, dry, rev) => { tgt.dry = mkGain(1); tgt.rev = mkGain(1); tgt.dry.connect(dry); tgt.rev.connect(rev); return [tgt.dry, tgt.rev]; };
    const musicG = mkGain(1); musicBus.connect(musicG); musicG.connect(master);
    CAT.master = [userG]; CAT.music = [musicG];
    CAT.sfx = pair(SFXT, sfxBus, sfxRev); CAT.amb = pair(AMBT, ambBus, ambRev);
    CAT.chant = pair(CHT, ambBus, ambRev); CAT.chime = pair(WCT, ambBus, ambRev);
    PVT.dry = master; PVT.rev = sfxRev;
    applyLevels(true);
    makeNoise();
  }

  // ===== Giọng cộng hưởng (chuông đồng, bát chuông, nốt chuông nhẹ) =====
  // parts: [tỉ lệ so với f0, biên độ, thời gian tắt (s), độ lệch cặp (gây phách)]
  function additive(o) {
    const t = o.t, parts = o.parts, ds = o.decayScale || 1;
    const outG = mkGain(o.level);
    const lp = mkFilter('lowpass', o.lp || 6000, 0.6);
    outG.connect(lp);
    const keep = [outG, lp];
    let src = lp;
    if (o.pan != null && ctx.createStereoPanner) { const pn = ctx.createStereoPanner(); pn.pan.value = clamp(o.pan, -1, 1); lp.connect(pn); keep.push(pn); src = pn; }
    out(src, o.tgt, o.dry, o.send, keep);
    const oscs = []; let lastOsc = null, end = t;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i], fr = o.f0 * p[0];
      if (fr > 7500) continue;
      const hi = p[0] >= 2.2 ? (o.hi == null ? 1 : o.hi) : 1; // đánh nhẹ thì các thành phần cao yếu đi
      const atk = p[0] < 1.6 ? (o.atk || 0.006) : (o.atk ? o.atk * 0.6 : 0.003);
      const dec = p[2] * ds, pair = p[3] > 0;
      const g = mkGain(MIN);
      env(g.gain, t, p[1] * hi * (pair ? 0.72 : 1), atk, dec);
      g.connect(outG);
      const stopT = t + atk + dec + 0.08;
      for (let k = 0; k < (pair ? 2 : 1); k++) {
        const os = mkOsc('sine', fr * (k ? 1 + p[3] : 1));
        os.connect(g); os.start(t); os.stop(stopT); oscs.push(os);
        if (stopT > end) { end = stopT; lastOsc = os; }
      }
    }
    tidy(lastOsc, keep);
    return { out: outG, oscs, end };
  }
  // tiếng "cộc" lúc chày chạm vào chuông/bát
  function strike(dst, t, f, amp) {
    const n = noiseSrc(bufWhite, t, 0.1), bp = mkFilter('bandpass', f, 0.9), g = mkGain(MIN);
    env(g.gain, t, amp, 0.001, 0.07);
    n.connect(bp); bp.connect(g); g.connect(dst);
  }
  // giữ tối đa max giọng cùng lúc: giọng cũ nhất được tắt dần
  function capVoices(list, max, t) {
    for (let i = list.length - 1; i >= 0; i--) if (list[i].end <= t) list.splice(i, 1);
    while (list.length >= max) fadeVoice(list.shift(), t);
  }
  function fadeVoice(v, t) {
    try {
      const g = v.out.gain; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.setTargetAtTime(0, t, 0.1);
      for (let i = 0; i < v.oscs.length; i++) { try { v.oscs[i].stop(t + 0.7); } catch (e) {} }
    } catch (e) {}
  }

  // Chuông đồng lớn: thành phần không hài hoà, các cặp lệch nhẹ tạo tiếng ngân "wa-wa-wa"
  const BELL = [
    [0.5, 0.42, 12.5, 0.0030], [1.0, 0.80, 10.0, 0.0022], [1.19, 0.48, 7.0, 0], [1.5, 0.34, 5.6, 0],
    [2.0, 0.70, 6.4, 0.0034], [2.74, 0.34, 4.2, 0], [3.0, 0.27, 3.6, 0.0040], [4.07, 0.20, 2.6, 0], [5.43, 0.11, 1.8, 0],
  ];
  const BELL_PERFECT = [ // tiếng chuông "tròn": thêm cặp phách và thành phần cao, ngân lâu hơn
    [0.5, 0.46, 12.5, 0.0030], [1.0, 0.86, 10.0, 0.0022], [1.19, 0.52, 7.0, 0.0028], [1.5, 0.38, 5.6, 0.0030],
    [2.0, 0.74, 6.4, 0.0034], [2.74, 0.38, 4.2, 0], [3.0, 0.30, 3.6, 0.0040], [3.76, 0.14, 3.0, 0], [4.07, 0.22, 2.6, 0],
    [5.43, 0.13, 1.8, 0.0035], [6.8, 0.08, 1.5, 0], [8.2, 0.045, 1.0, 0],
  ];
  const BOWL = [[1, 0.9, 4.2, 0.0042], [2.71, 0.34, 2.4, 0.003], [5.15, 0.12, 1.2, 0]]; // bát chuông nhỏ
  const CHIME = [[1, 1, 1.9, 0.0018], [2.76, 0.16, 0.7, 0], [5.4, 0.05, 0.3, 0]]; // nốt chuông nhẹ

  // ===== Hiệu ứng âm thanh (SFX) =====
  const SFX = Object.create(null);

  // giọt gỗ "tách": dùng cho mõ trong tụng kinh và que xăm rơi
  function woodTap(t, f, amp, dec, dst) {
    const a = mkOsc('sine', f * 1.25); a.frequency.setValueAtTime(f * 1.25, t); a.frequency.exponentialRampToValueAtTime(f, t + 0.018);
    const ga = mkGain(MIN); env(ga.gain, t, amp, 0.001, dec); a.connect(ga); ga.connect(dst);
    const b = mkOsc('triangle', f * 1.7), gb = mkGain(MIN);
    env(gb.gain, t, amp * 0.3, 0.001, dec * 0.45); b.connect(gb); gb.connect(dst);
    const n = noiseSrc(bufWhite, t, 0.02), nb = mkFilter('bandpass', f * 2.2, 2), ng = mkGain(MIN);
    env(ng.gain, t, amp * 0.8, 0.0008, 0.011); n.connect(nb); nb.connect(ng); ng.connect(dst);
    const e = t + dec + 0.04;
    a.start(t); a.stop(e); b.start(t); b.stop(e);
    return a;
  }

  // 'ui': tiếng gõ gỗ nhẹ khi bấm nút
  SFX.ui = (o, t) => {
    if (t - lastUi < 0.03) return;
    lastUi = t;
    const f = 880 * rand(0.97, 1.05);
    const os = mkOsc('triangle', f); os.frequency.setValueAtTime(f, t); os.frequency.exponentialRampToValueAtTime(f * 0.72, t + 0.07);
    const g = mkGain(MIN); env(g.gain, t, LV.ui, 0.002, 0.085);
    const lp = mkFilter('lowpass', 3200, 0.7);
    os.connect(g); g.connect(lp);
    const n = noiseSrc(bufWhite, t, 0.03), nb = mkFilter('bandpass', 2600, 1.2), ng = mkGain(MIN);
    env(ng.gain, t, LV.ui * 0.9, 0.001, 0.012); n.connect(nb); nb.connect(ng); ng.connect(lp);
    const keep = [lp]; out(lp, SFXT, 1, 0.12, keep);
    os.start(t); os.stop(t + 0.13); tidy(os, keep);
  };

  // 'bell' {strength 0..1, perfect}: chuông đồng lớn
  SFX.bell = (o, t) => {
    const str = clamp(o.strength == null ? 0.8 : o.strength, 0, 1), perfect = !!o.perfect;
    capVoices(bells, 4, t);
    const v = additive({
      t, f0: 118, parts: perfect ? BELL_PERFECT : BELL, level: LV.bell * (0.45 + 0.55 * str) * (perfect ? 1.1 : 1),
      hi: 0.3 + 0.7 * str, decayScale: (0.62 + 0.38 * str) * (perfect ? 1.45 : 1), lp: perfect ? 5600 : 4800,
      atk: 0.006, tgt: SFXT, dry: 1, send: perfect ? 0.85 : 0.6,
    });
    strike(v.out, t, 1100, 1.4 * (0.4 + 0.6 * str));
    bells.push(v);
  };

  // chuông xa: cùng mô hình nhưng nhỏ, tối, ngắn và nhiều vang (dest = đường sfx hoặc âm nền)
  function bellSoftAt(o, t, tgt) {
    const str = clamp(o.strength == null ? 0.7 : o.strength, 0, 1);
    capVoices(softBells, 2, t);
    const v = additive({
      t, f0: 132, parts: BELL, level: LV.bellSoft * (0.25 + 0.2 * str), hi: 0.25 + 0.5 * str, decayScale: 0.5,
      lp: 1400, atk: 0.018, tgt, dry: 0.55, send: 0.95,
    });
    strike(v.out, t, 700, 0.5 * (0.4 + 0.6 * str));
    softBells.push(v);
  }
  SFX.bellSoft = (o, t) => bellSoftAt(o, t, SFXT);

  // 'bowlBell': bát chuông đứng nhỏ, ~520 Hz, ngân ~4 s
  SFX.bowlBell = (o, t) => {
    capVoices(bowls, 3, t);
    const v = additive({
      t, f0: 520 * rand(0.995, 1.005), parts: BOWL, level: LV.bowl, hi: 1, lp: 5200, atk: 0.003, tgt: SFXT, dry: 1, send: 0.5,
    });
    strike(v.out, t, 3000, 0.35);
    bowls.push(v);
  };

  // 'mo' {accent}: mõ gỗ, tiếng "cộc" ngắn 120–180 ms, độ trễ thấp (xếp lịch ngay tại thời điểm hiện tại)
  SFX.mo = (o, t) => {
    const accent = !!o.accent;
    const f = (accent ? 850 : 780) * rand(0.988, 1.012);
    const amp = (accent ? 1.3 : 1) * LV.mo, dec = accent ? 0.17 : 0.125;
    const m = mkGain(1), lp = mkFilter('lowpass', 4200, 0.7), keep = [m, lp];
    m.connect(lp);
    const a = mkOsc('sine', f * 1.35); a.frequency.setValueAtTime(f * 1.35, t); a.frequency.exponentialRampToValueAtTime(f, t + 0.028);
    const ga = mkGain(MIN); env(ga.gain, t, amp, 0.0012, dec); a.connect(ga); ga.connect(m);
    const b = mkOsc('triangle', f * 1.62), gb = mkGain(MIN); env(gb.gain, t, amp * 0.35, 0.0012, dec * 0.5); b.connect(gb); gb.connect(m);
    const c = mkOsc('sine', f * 2.45), gc = mkGain(MIN); env(gc.gain, t, amp * 0.12, 0.0012, dec * 0.3); c.connect(gc); gc.connect(m);
    const n = noiseSrc(bufWhite, t, 0.03), nb = mkFilter('bandpass', 1900, 2.5), ng = mkGain(MIN);
    env(ng.gain, t, amp * 1.1, 0.0008, 0.014); n.connect(nb); nb.connect(ng); ng.connect(m);
    out(lp, SFXT, 1, accent ? 0.22 : 0.14, keep);
    const e = t + dec + 0.06;
    a.start(t); a.stop(e); b.start(t); b.stop(e); c.start(t); c.stop(e);
    tidy(a, keep);
  };

  // 'incense': quẹt que diêm nhẹ, "phụt" bắt lửa, rồi một hơi gió thoảng
  SFX.incense = (o, t) => {
    const m = mkGain(1), keep = [m];
    const s1 = noiseSrc(bufWhite, t, 0.15), hp = mkFilter('highpass', 1600, 0.7), bp = mkFilter('bandpass', 1800, 1.3), g1 = mkGain(MIN);
    bp.frequency.setValueAtTime(1800, t); bp.frequency.exponentialRampToValueAtTime(3400, t + 0.12);
    g1.gain.setValueAtTime(MIN, t); g1.gain.linearRampToValueAtTime(0.14, t + 0.015); g1.gain.linearRampToValueAtTime(0.08, t + 0.09); g1.gain.exponentialRampToValueAtTime(MIN, t + 0.15);
    s1.connect(hp); hp.connect(bp); bp.connect(g1); g1.connect(m);
    const t2 = t + 0.13;
    const s2 = noiseSrc(bufPink, t2, 0.8), bp2 = mkFilter('bandpass', 600, 0.8), g2 = mkGain(MIN);
    bp2.frequency.setValueAtTime(600, t2); bp2.frequency.exponentialRampToValueAtTime(1700, t2 + 0.3);
    env(g2.gain, t2, 0.32, 0.04, 0.6); s2.connect(bp2); bp2.connect(g2); g2.connect(m);
    const po = mkOsc('sine', 140), pg = mkGain(MIN); // tiếng "bụp" rất nhẹ
    env(pg.gain, t2, 0.05, 0.004, 0.07); po.connect(pg); pg.connect(m); po.start(t2); po.stop(t2 + 0.1);
    const t3 = t + 0.25;
    const s3 = noiseSrc(bufPink, t3, 1.6), bp3 = mkFilter('bandpass', 1000, 0.5), g3 = mkGain(MIN);
    bp3.frequency.setValueAtTime(1000, t3); bp3.frequency.linearRampToValueAtTime(2200, t3 + 1.0);
    env(g3.gain, t3, 0.13, 0.4, 1.1); s3.connect(bp3); bp3.connect(g3); g3.connect(m);
    out(m, SFXT, 1, 0.22, keep);
    tidy(s3, keep);
  };

  // 'chime': 2–3 nốt chuông nhẹ theo thang năm cung
  const CHIME_SETS = [[1, 1.25, 1.5], [1, 1.5, 5 / 3], [9 / 8, 1.5, 2], [1, 1.25, 5 / 3]];
  SFX.chime = (o, t) => {
    const base = U.pick([392, 440, 493.88, 523.25]);
    let set = U.pick(CHIME_SETS);
    if (Math.random() < 0.3) set = set.slice(1);
    for (let i = 0; i < set.length; i++) {
      const last = i === set.length - 1;
      additive({
        t: t + i * 0.16, f0: base * set[i], parts: CHIME, level: LV.chime * (last ? 1.1 : 0.9), decayScale: last ? 1.3 : 0.8,
        lp: 5000, atk: 0.004, tgt: o.tgt || SFXT, dry: 1, send: 0.75,
      });
    }
  };

  // 'shake' {dur}: ống xăm tre rung, nhiều tiếng lách cách nhỏ qua bộ lọc
  SFX.shake = (o, t) => {
    const dur = clamp(o.dur == null ? 0.6 : o.dur, 0.12, 4);
    const nz = noiseSrc(bufWhite, t, dur + 0.1);
    const hp = mkFilter('highpass', 900, 0.7), bp = mkFilter('bandpass', 2400, 4.5), g = mkGain(MIN);
    const kn = mkOsc('sine', 430), kg = mkGain(MIN); // tiếng gõ trầm của thân ống tre
    const m = mkGain(1), keep = [m];
    nz.connect(hp); hp.connect(bp); bp.connect(g); g.connect(m); kn.connect(kg); kg.connect(m);
    let tt = t;
    while (tt < t + dur) {
      const k = (tt - t) / dur, sw = 0.25 + 0.75 * Math.sin(Math.PI * Math.min(1, k)); // to dần rồi nhỏ dần
      kn.frequency.setValueAtTime(rand(380, 520), tt);
      kg.gain.setValueAtTime(MIN, tt); kg.gain.linearRampToValueAtTime(0.06 * sw * rand(0.7, 1.1), tt + 0.002); kg.gain.exponentialRampToValueAtTime(MIN, tt + 0.04);
      let ct = tt; const n = randInt(2, 5);
      for (let c = 0; c < n; c++) {
        if (c) ct += rand(0.011, 0.017);
        bp.frequency.setValueAtTime(rand(1600, 3800), ct);
        g.gain.setValueAtTime(MIN, ct); g.gain.linearRampToValueAtTime(rand(0.14, 0.34) * sw, ct + 0.0012);
        g.gain.exponentialRampToValueAtTime(MIN, ct + 0.0012 + rand(0.005, 0.008));
      }
      tt += 0.118 * rand(0.85, 1.15);
    }
    kn.start(t); kn.stop(t + dur + 0.1);
    out(m, SFXT, 1, 0.15, keep);
    tidy(nz, keep);
  };

  // 'stickDrop': một thanh xăm rơi, nảy vài lần trên bàn gỗ
  SFX.stickDrop = (o, t) => {
    const m = mkGain(1), keep = [m];
    const hits = [[0, 1], [0.09, 0.6], [0.16, 0.36], [0.205, 0.2], [0.232, 0.1]];
    const f0 = rand(900, 1350);
    let last = null;
    for (let i = 0; i < hits.length; i++) last = woodTap(t + hits[i][0], f0 * rand(0.92, 1.08), 0.32 * hits[i][1], 0.05, m);
    out(m, SFXT, 1, 0.2, keep);
    tidy(last, keep);
  };

  // 'water': giọt nước "tõm" nhẹ rồi gợn sóng lăn tăn
  function bubble(t, f0, f1, dur, amp, dst) {
    const o = mkOsc('sine', f0); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.8);
    const g = mkGain(MIN); env(g.gain, t, amp, 0.006, dur);
    o.connect(g); g.connect(dst); o.start(t); o.stop(t + dur + 0.05);
  }
  SFX.water = (o, t) => {
    const m = mkGain(1), keep = [m];
    bubble(t, 330, 1000, 0.17, 0.2, m);
    bubble(t + 0.075, 520, 1500, 0.11, 0.09, m);
    bubble(t + 0.21, 1300, 1900, 0.06, 0.035, m);
    bubble(t + 0.33, 1500, 2100, 0.05, 0.022, m);
    bubble(t + 0.47, 1200, 1700, 0.05, 0.014, m);
    const sp = noiseSrc(bufWhite, t, 0.16), sb = mkFilter('bandpass', 1500, 0.8), sg = mkGain(MIN); // nước bắn
    env(sg.gain, t, 0.1, 0.004, 0.12); sp.connect(sb); sb.connect(sg); sg.connect(m);
    const wash = noiseSrc(bufPink, t + 0.06, 0.9), wb = mkFilter('bandpass', 700, 1.2), wg = mkGain(MIN), wa = mkGain(0.6); // sóng lăn tăn
    const wl = mkOsc('sine', 8), wlg = mkGain(0.35); wl.connect(wlg); wlg.connect(wa.gain);
    env(wg.gain, t + 0.06, 0.1, 0.1, 0.75); wash.connect(wb); wb.connect(wa); wa.connect(wg); wg.connect(m);
    wl.start(t); wl.stop(t + 1.0);
    out(m, SFXT, 1, 0.38, keep);
    tidy(wash, keep);
  };

  // 'ribbon': vải bay phấp phới (nhiễu lọc, điều biên chậm)
  SFX.ribbon = (o, t) => {
    const dur = clamp(o.dur == null ? 0.9 : o.dur, 0.3, 3);
    const nz = noiseSrc(bufWhite, t, dur + 0.1);
    const bp = mkFilter('bandpass', 1500, 0.9), am = mkGain(0.5), g = mkGain(MIN), m = mkGain(1), keep = [m];
    bp.frequency.setValueAtTime(1100, t); bp.frequency.linearRampToValueAtTime(2300, t + dur * 0.5); bp.frequency.linearRampToValueAtTime(1500, t + dur);
    const l1 = mkOsc('sine', rand(9, 14)), g1 = mkGain(0.35), l2 = mkOsc('sine', rand(2.5, 4)), g2 = mkGain(0.15);
    l1.connect(g1); g1.connect(am.gain); l2.connect(g2); g2.connect(am.gain);
    g.gain.setValueAtTime(MIN, t); g.gain.linearRampToValueAtTime(0.16, t + dur * 0.25); g.gain.linearRampToValueAtTime(0.1, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(MIN, t + dur);
    nz.connect(bp); bp.connect(am); am.connect(g); g.connect(m);
    l1.start(t); l1.stop(t + dur + 0.05); l2.start(t); l2.stop(t + dur + 0.05);
    out(m, SFXT, 1, 0.2, keep);
    tidy(nz, keep);
  };

  // 'step' {surface, vol}: bước chân rất nhẹ (đá nhỏ hơn cỏ)
  SFX.step = (o, t) => {
    const surf = o.surface || 'stone';
    const base = LV.step * (o.vol == null ? 1 : o.vol) * (surf === 'grass' ? 0.7 : surf === 'hall' ? 0.5 : 0.55);
    const m = mkGain(1), keep = [m];
    const nz = noiseSrc(bufWhite, t, 0.16), f = mkFilter(surf === 'grass' ? 'lowpass' : 'bandpass', surf === 'grass' ? 650 : surf === 'hall' ? 520 : 1100, 1), ng = mkGain(MIN);
    if (surf === 'grass') env(ng.gain, t, base * 2.4, 0.012, 0.1); else env(ng.gain, t, base * 1.8, 0.002, surf === 'hall' ? 0.05 : 0.032);
    nz.connect(f); f.connect(ng); ng.connect(m);
    if (surf === 'grass') { // tiếng cỏ xào xạc
      const r = noiseSrc(bufWhite, t, 0.16), rb = mkFilter('bandpass', 3000, 0.8), rg = mkGain(MIN);
      env(rg.gain, t + 0.01, base * 0.7, 0.02, 0.11); r.connect(rb); rb.connect(rg); rg.connect(m);
    }
    const th = mkOsc('sine', surf === 'hall' ? 105 : 140), tg = mkGain(MIN); // tiếng "thịch" trầm
    env(tg.gain, t, base * 0.9, 0.004, surf === 'hall' ? 0.09 : 0.065); th.connect(tg); tg.connect(m);
    th.start(t); th.stop(t + 0.17);
    stepSide = -stepSide;
    const tail = pan(m, stepSide * 0.15);
    keep.push(tail);
    out(tail, SFXT, 1, surf === 'hall' ? 0.15 : 0.04, keep);
    tidy(th, keep);
  };

  // ===== Âm nền: gió, lá, chim, dế =====
  function buildWind() {
    gustG = mkGain(1); windBus = mkGain(LV.wind);
    gustG.connect(windBus); windBus.connect(AMBT.dry);
    const src = loopNoise(bufPink);
    // thân gió trầm
    const bp1 = mkFilter('bandpass', 430, 0.6), lp1 = mkFilter('lowpass', 1100, 0.5), g1 = mkGain(0.6);
    src.connect(bp1); bp1.connect(lp1); lp1.connect(g1); g1.connect(gustG);
    lfo(0.071, 0.25, g1.gain); lfo(0.113, 0.15, g1.gain);
    lfo(0.057, 130, bp1.frequency); lfo(0.093, 80, bp1.frequency);
    // hơi gió cao, thoảng
    const bp2 = mkFilter('bandpass', 1350, 1.1), g2 = mkGain(0.3);
    src.connect(bp2); bp2.connect(g2); g2.connect(gustG);
    lfo(0.083, 0.2, g2.gain); lfo(0.047, 0.1, g2.gain); lfo(0.061, 300, bp2.frequency);
  }
  // thỉnh thoảng một cơn gió nhẹ thổi qua
  function gustTick() {
    if (audible()) {
      const t = ctx.currentTime, g = gustG.gain;
      g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
      g.setTargetAtTime(rand(1.25, 1.7), t, 1.6); g.setTargetAtTime(1, t + rand(3, 5), 2.2);
      later(() => windChimes(randInt(3, 6)), rand(500, 1600)); // gió mạnh: chuông gió reo dày hơn
    }
    later(gustTick, rand(9000, 22000));
  }

  // lá xào xạc: nhiễu lọc dải ngắn, có rung nhẹ
  function leafBurst() {
    const t = ctx.currentTime + 0.02, dur = rand(0.5, 1.5);
    const nz = noiseSrc(bufWhite, t, dur + 0.1);
    const bp = mkFilter('bandpass', rand(2200, 4200), rand(0.7, 1.4)), am = mkGain(0.55), g = mkGain(MIN);
    const l = mkOsc('sine', rand(8, 16)), lg = mkGain(0.4); l.connect(lg); lg.connect(am.gain);
    const peak = LV.leaves * rand(0.5, 1) * 3;
    g.gain.setValueAtTime(MIN, t); g.gain.linearRampToValueAtTime(peak, t + rand(0.15, 0.35)); g.gain.exponentialRampToValueAtTime(MIN, t + dur);
    nz.connect(bp); bp.connect(am); am.connect(g);
    const tail = pan(g, rand(-0.7, 0.7)), keep = [g, tail];
    out(tail, AMBT, 1, 0.2, keep);
    l.start(t); l.stop(t + dur + 0.1);
    tidy(nz, keep);
  }
  function leafTick() {
    if (audible() && chOn('amb')) leafBurst();
    later(leafTick, rand(1500, 5500) * (lowQ ? 1.6 : 1));
  }

  // chim: mỗi loài một kiểu hót, mỗi tiếng gọi chỉ cần 1 dao động + 1 bao biên độ
  const PENTA = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2];
  const BIRD_W = [3, 2, 2, 1.5, 2.2, 1.5], BIRD_SUM = BIRD_W.reduce((a, b) => a + b, 0);
  function pickBird() {
    let r = Math.random() * BIRD_SUM;
    for (let i = 0; i < BIRD_W.length; i++) { r -= BIRD_W[i]; if (r <= 0) return i; }
    return 0;
  }
  function birdNotes(kind) {
    const notes = []; let end = 0;
    const add = (gap, f0, f1, d, a, atk) => { const t = end + gap; notes.push({ t, f0, f1, d, a, atk: atk || 0.008 }); end = t + d; };
    if (kind === 0) { // chíp chíp (sẻ)
      const n = randInt(3, 6), base = rand(3000, 3700);
      for (let i = 0; i < n; i++) { const f = base * rand(0.94, 1.08); add(i ? rand(0.05, 0.09) : 0, f, f * rand(1.12, 1.3), rand(0.045, 0.065), rand(0.6, 1)); }
    } else if (kind === 1) { // ba tiếng huýt đi xuống
      const base = rand(2300, 2900);
      for (let i = 0; i < 3; i++) add(i ? 0.07 : 0, base - i * 90, (base - i * 90) * 0.8, 0.17, 0.9, 0.02);
      if (Math.random() < 0.5) add(0.06, base * 0.7, base * 0.9, 0.08, 0.7, 0.01);
    } else if (kind === 2) { // trill: chuỗi nốt nhanh xen kẽ
      const n = randInt(9, 16), fa = rand(3300, 3900);
      for (let i = 0; i < n; i++) add(i ? 0.006 : 0, i % 2 ? fa * 1.14 : fa, i % 2 ? fa : fa * 1.14, 0.024, 0.35 + 0.65 * Math.sin((Math.PI * (i + 0.5)) / n), 0.004);
    } else if (kind === 3) { // cu gáy: tiếng trầm, mềm
      const base = rand(480, 560), durs = [0.16, 0.16, 0.34, 0.3];
      const n = randInt(3, 4);
      for (let i = 0; i < n; i++) add(i ? 0.1 : 0, base * (i === n - 1 ? 0.94 : 1), base * 0.9, durs[i], 0.75, 0.05);
    } else if (kind === 4) { // giai điệu ngắn (chích chòe)
      const n = randInt(4, 7), base = rand(1500, 1900);
      for (let i = 0; i < n; i++) { const f = base * PENTA[randInt(0, 5)]; add(i ? rand(0.03, 0.09) : 0, f, f * rand(0.92, 1.1), rand(0.1, 0.2), 0.8, 0.015); }
    } else { // tích tích tích, nhanh dần
      const n = randInt(5, 9), f = rand(2600, 3000);
      let gap = 0.13;
      for (let i = 0; i < n; i++) { add(i ? gap : 0, f, f * 1.07, 0.03, 0.8, 0.004); gap = Math.max(0.06, gap - 0.01); }
    }
    return notes;
  }
  function birdCall(kind, vol) {
    const notes = birdNotes(kind), t0 = ctx.currentTime + 0.04;
    const o1 = mkOsc('sine', 3000), o2 = mkOsc('sine', 6000);
    const h = mkGain(kind === 3 ? 0.05 : 0.14), g = mkGain(MIN);
    o1.connect(g); o2.connect(h); h.connect(g);
    const lp = mkFilter('lowpass', 3200 + 3800 * vol, 0.5);
    g.connect(lp);
    const tail = pan(lp, rand(-0.85, 0.85)), keep = [g, lp, tail];
    const amp = LV.birds * vol * (kind === 3 ? 0.9 : 1);
    out(tail, AMBT, 1, 0.3, keep);
    let end = t0;
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i], tn = t0 + n.t, te = tn + n.d;
      o1.frequency.setValueAtTime(n.f0, tn); o1.frequency.exponentialRampToValueAtTime(n.f1, tn + n.d * 0.9);
      o2.frequency.setValueAtTime(n.f0 * 2, tn); o2.frequency.exponentialRampToValueAtTime(n.f1 * 2, tn + n.d * 0.9);
      g.gain.setValueAtTime(MIN, tn); g.gain.linearRampToValueAtTime(Math.max(amp * n.a, MIN * 2), tn + n.atk); g.gain.exponentialRampToValueAtTime(MIN, te);
      end = te;
    }
    o1.start(t0); o2.start(t0); o1.stop(end + 0.1); o2.stop(end + 0.1);
    tidy(o1, keep);
  }
  function birdTick() {
    const day = 1 - U.smoothstep(0.05, 0.75, G.tod ? G.tod.night : 0); // ban đêm chim im
    if (audible() && chOn('amb') && day > 0.06 && Math.random() < day) {
      birdCall(pickBird(), rand(0.35, 1));
      if (Math.random() < 0.3) later(() => { if (audible()) birdCall(pickBird(), rand(0.3, 0.8)); }, rand(600, 1800)); // chim khác đáp lại
    }
    later(birdTick, (rand(2600, 8500) * (lowQ ? 1.5 : 1)) / Math.max(0.35, day));
  }

  // dế ban đêm: vài con, mỗi con một dao động chạy liên tục, xếp lịch các cụm xung bằng tự động hoá
  function buildCrickets() {
    cricketBus = mkGain(0);
    const lp = mkFilter('lowpass', 4800, 0.5);
    cricketBus.connect(lp); lp.connect(AMBT.dry);
    for (const f of [3420, 3860, 4180]) {
      const o = mkOsc('sine', f), g = mkGain(MIN);
      o.connect(g); g.connect(cricketBus); o.start();
      crickets.push({ g, next: 0, amp: rand(0.5, 0.8) });
    }
  }
  function scheduleCrickets(now, horizon) {
    if (nightS < 0.06) { for (const c of crickets) c.next = Math.max(c.next, horizon); return; }
    for (const c of crickets) {
      if (c.next < now) c.next = now + rand(0.1, 1.2);
      while (c.next < horizon) {
        const n = randInt(3, 5), sp = rand(0.052, 0.07), a = c.amp * rand(0.55, 1);
        let t = c.next;
        for (let i = 0; i < n; i++) {
          c.g.gain.setValueAtTime(MIN, t); c.g.gain.linearRampToValueAtTime(a, t + 0.006); c.g.gain.exponentialRampToValueAtTime(MIN, t + 0.034);
          t += sp;
        }
        c.next += rand(0.75, 1.5) + (Math.random() < 0.18 ? rand(1.5, 4) : 0);
      }
    }
  }

  // ===== Tiếng tụng "Nam mô A Di Đà Phật" từ xa =====
  // Ba giọng nam hơi lệch cao độ → ba bộ lọc formant song song, trượt giữa các nguyên âm theo từng âm tiết
  const VOW = {
    a: { f: [780, 1150, 2500], g: [1, 0.5, 0.16] },
    o: { f: [460, 820, 2500], g: [1, 0.45, 0.08] },
    i: { f: [330, 2050, 2800], g: [1, 0.4, 0.12] },
    e: { f: [640, 1120, 2450], g: [1, 0.5, 0.14] }, // "â" trong Phật
    m: { f: [270, 1000, 2200], g: [0.9, 0.12, 0.03] }, // âm mũi (m)
    d: { f: [350, 1500, 2500], g: [0.6, 0.25, 0.06] }, // phụ âm đầu mềm (Đ, D)
    p: { f: [500, 1100, 2400], g: [0.45, 0.2, 0.05] }, // ph / t cuối
  };
  const SYL = [
    { v: 'a', on: null, co: 'm', semi: 0, lvl: 1 }, // Nam
    { v: 'o', on: 'm', co: null, semi: 0, lvl: 0.85 }, // mô
    { v: 'a', on: null, co: null, semi: 2, lvl: 1 }, // A
    { v: 'i', on: 'd', co: null, semi: 2, lvl: 0.85 }, // Di
    { v: 'a', on: 'd', co: null, semi: 2, lvl: 0.95 }, // Đà
    { v: 'e', on: 'p', co: 'p', semi: -1, lvl: 0.9 }, // Phật
  ];
  function buildChant() {
    const src = mkGain(1), voices = [];
    const vib = mkOsc('sine', 5.1), vibG = mkGain(5); vib.connect(vibG); vib.start(); // rung giọng rất nhẹ (cent)
    const spec = [['sawtooth', 0.92], ['sawtooth', 1.0], ['triangle', 1.085]], drift = [0.13, 0.19, 0.23];
    for (let i = 0; i < spec.length; i++) {
      const o = mkOsc(spec[i][0], CH_BASE * spec[i][1]), g = mkGain(i === 2 ? 0.8 : 0.9);
      o.connect(g); g.connect(src); o.start();
      if (o.detune) { vibG.connect(o.detune); lfo(drift[i], 14, o.detune); } // mỗi giọng trôi cao độ riêng → nghe như đoàn người
      voices.push({ o, r: spec[i][1] });
    }
    const nz = loopNoise(bufPink), nzg = mkGain(0.22); nz.connect(nzg); nzg.connect(src); // hơi thở
    const fil = [], fg = [], mix = mkGain(1), Q = [7, 8, 9];
    for (let k = 0; k < 3; k++) {
      const b = mkFilter('bandpass', VOW.a.f[k], Q[k]), g = mkGain(VOW.a.g[k]);
      src.connect(b); b.connect(g); g.connect(mix); fil.push(b); fg.push(g);
    }
    const amp = mkGain(0), prox = mkGain(LV.chant * 0.2), lp = mkFilter('lowpass', 700, 0.5), send = mkGain(0.9);
    mix.connect(amp); amp.connect(prox); prox.connect(lp); lp.connect(CHT.dry); lp.connect(send); send.connect(CHT.rev);
    chant = { voices, fil, fg, amp, prox, lp, send, next: 0, idx: 0, d: 0.45, mo: false };
  }
  function chantSyllable(ts, idx, d) {
    const c = chant, s = SYL[idx], v = VOW[s.v], on = s.on ? VOW[s.on] : null, co = s.co ? VOW[s.co] : null;
    const last = idx === SYL.length - 1, tv = ts + (on ? 0.07 : 0);
    for (let k = 0; k < 3; k++) {
      const F = c.fil[k].frequency, Gp = c.fg[k].gain;
      if (on) { F.setTargetAtTime(on.f[k], ts, 0.012); Gp.setTargetAtTime(on.g[k], ts, 0.012); }
      F.setTargetAtTime(v.f[k], tv, 0.045); Gp.setTargetAtTime(v.g[k], tv, 0.045);
      if (co) { F.setTargetAtTime(co.f[k], ts + d * 0.74, 0.035); Gp.setTargetAtTime(co.g[k], ts + d * 0.74, 0.035); }
    }
    const pitch = Math.pow(2, s.semi / 12);
    for (let i = 0; i < c.voices.length; i++) c.voices[i].o.frequency.setTargetAtTime(CH_BASE * c.voices[i].r * pitch, ts, 0.04);
    c.amp.gain.setTargetAtTime(s.lvl, ts, 0.05);
    if (last) c.amp.gain.setTargetAtTime(0, ts + d * 0.7, 0.07); // hết câu: lấy hơi
    else c.amp.gain.setTargetAtTime(0.45 * s.lvl, ts + d * 0.72, 0.05); // lõm nhẹ giữa các âm tiết
  }
  function scheduleChant(now, horizon) {
    const c = chant;
    if (c.next < now) { c.next = now + 0.1; c.idx = 0; }
    while (c.next < horizon) {
      if (c.idx === 0) { c.d = 1 / rand(2.05, 2.35); c.mo = Math.random() < 0.55; }
      const d = c.d * rand(0.97, 1.04);
      chantSyllable(c.next, c.idx, d);
      if (c.mo && !(G.activity && G.activity.current)) woodTap(c.next, 600, c.idx === 0 ? 0.28 : 0.2, 0.1, c.prox); // tiếng mõ rất khẽ theo nhịp
      c.next += d; c.idx++;
      if (c.idx >= SYL.length) { c.idx = 0; c.next += Math.random() < 0.25 ? rand(3.2, 6) : rand(1.0, 2.0); }
    }
  }

  // ===== Bộ xếp lịch, cập nhật theo khung, hạ âm nền, bước chân =====
  function lookahead() {
    if (!ready || ctx.state !== 'running') return;
    const now = ctx.currentTime, horizon = now + 0.8;
    try {
      if (chant && chOn('chant')) scheduleChant(now, horizon);
      if (crickets.length && chOn('amb')) scheduleCrickets(now, horizon);
    } catch (e) { console.error('[âm thanh]', e); }
  }
  function softBellTick() {
    if (audible() && chOn('chant') && !(G.activity && G.activity.current)) {
      bellSoftAt({ strength: rand(0.5, 0.9) }, ctx.currentTime + 0.05, CHT);
      later(softBellTick, rand(45000, 100000));
    } else later(softBellTick, 8000);
  }
  // chuông gió dưới mái hiên: ống kim loại nhỏ, thang năm cung ở quãng cao, mỗi chùm vài tiếng lệch nhau
  const WCH = [[1, 1, 2.8, 0.0011], [2.76, 0.3, 1.3, 0], [5.4, 0.1, 0.6, 0], [8.93, 0.035, 0.3, 0]];
  const WCH_F = [1046.5, 1174.7, 1318.5, 1568, 1760, 2093]; // Đô Rê Mi Son La Đô (quãng 6–7)
  function windChimes(n, force) {
    if (force ? !canPlay() : (!audible() || !chOn('chime'))) return;
    if (!spend(COST.windChime, false)) return;
    let t = ctx.currentTime + 0.03;
    const p0 = rand(-0.6, 0.6);
    for (let i = 0; i < n; i++) {
      additive({
        t, f0: U.pick(WCH_F) * rand(0.997, 1.003), parts: WCH, level: LV.windChime * rand(0.55, 1), decayScale: rand(0.8, 1.2),
        lp: 7000, atk: 0.002, hi: rand(0.6, 1), pan: p0 + rand(-0.25, 0.25), tgt: WCT, dry: 1, send: 0.6,
      });
      t += rand(0.07, 0.45);
    }
  }
  function windChimeTick() {
    if (audible() && chOn('chime')) windChimes(randInt(1, 3) + (Math.random() < 0.25 ? 2 : 0));
    later(windChimeTick, rand(5000, 15000) * (lowQ ? 1.6 : 1));
  }
  // âm lượng từng kênh theo "Cài đặt âm thanh" (G.sound); gọi lại mỗi khi người chơi chỉnh
  function applyLevels(now) {
    if (!ctx || !CAT.master) return;
    const t = ctx.currentTime;
    for (const k in CAT) {
      const v = G.sound ? G.sound.gain(k) : 1;
      for (const n of CAT[k]) {
        const g = n.gain; g.cancelScheduledValues(t);
        if (now) g.value = v; else { g.setValueAtTime(g.value, t); g.setTargetAtTime(v, t, 0.06); }
      }
    }
  }
  // nghe thử một kênh ngay khi chỉnh (bảng cài đặt âm thanh)
  function preview(k) {
    if (!canPlay() || !chOn(k)) return;
    if (k === 'chime') windChimes(4, true);
    else if (k === 'sfx') play('chime');
    else if (k === 'master') play('chime', { tgt: PVT });
    else if (k === 'amb') { try { birdCall(pickBird(), 0.8); } catch (e) {} }
  }
  function startAmbience() {
    for (const build of [buildWind, buildCrickets, buildChant]) { // một lớp âm nền lỗi không làm hỏng các lớp khác
      try { build(); } catch (e) { console.error('[âm thanh]', e); }
    }
    nightS = G.tod ? G.tod.night : 0;
    later(gustTick, rand(6000, 12000));
    later(leafTick, rand(800, 3000));
    later(birdTick, rand(1500, 4000));
    later(softBellTick, rand(22000, 55000));
    later(windChimeTick, rand(3000, 8000));
    lookTimer = setInterval(lookahead, 160);
    lookahead();
  }
  // mỗi khung: làm mượt mức âm theo ban đêm và khoảng cách tới chính điện (chỉ gán giá trị, không tạo nút)
  G.onUpdate((dt) => {
    if (!ready || ctx.state !== 'running') return;
    nightS = U.damp(nightS, G.tod ? G.tod.night : 0, 1.5, dt);
    const P = G.player;
    let near = 0;
    if (P && P.pos) {
      const dx = P.pos.x - HALL.x, dz = P.pos.z - HALL.z;
      near = 1 - U.smoothstep(10, 44, Math.sqrt(dx * dx + dz * dz)); // trong ~10 m: rõ; từ ~40 m: rất mờ
    }
    proxS = U.damp(proxS, near, 2.5, dt);
    if (chant) {
      chant.prox.gain.value = LV.chant * (0.2 + 0.8 * proxS); // xa ~45 m vẫn còn mờ mờ
      chant.lp.frequency.value = 600 + 1050 * proxS;
      chant.send.gain.value = 1.1 - 0.5 * proxS; // xa thì nhiều vang hơn
    }
    if (windBus) windBus.gain.value = LV.wind * (1 - 0.3 * nightS);
    if (cricketBus) cricketBus.gain.value = LV.crickets * U.smoothstep(0.15, 0.7, nightS);
  }, 70);

  // hạ âm nền ~40% khi đang làm hoạt động
  function setDuck(on) {
    ducked = !!on;
    if (!ready) return;
    const t = ctx.currentTime, v = ducked ? LV.duck : 1, tc = ducked ? 0.35 : 0.9;
    for (const g of [ambBus.gain, ambRev.gain]) { g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.setTargetAtTime(v, t, tc); }
    const mg = musicBus.gain; mg.cancelScheduledValues(t); mg.setValueAtTime(mg.value, t); mg.setTargetAtTime(LV.music * (ducked ? LV.musicDuck : 1), t, tc);
  }

  // bước chân: đá > cỏ về độ to (đá nhỏ hơn), chống dồn dập
  function surfaceAt(p) {
    if (!p) return 'stone';
    if (G.insideHall && G.insideHall(p.x, p.z)) return 'hall';
    const ax = Math.abs(p.x);
    if ((ax < 24 && p.z > -84 && p.z < 31) || (ax < 2.4 && p.z >= 31)) return 'stone';
    return 'grass';
  }
  function onFootstep(pos) {
    if (!canPlay()) return;
    const t = ctx.currentTime;
    if (t - lastStep < 0.22) return;
    lastStep = t;
    if (!spend(COST.step, false)) return;
    try { SFX.step({ surface: surfaceAt(pos) }, t); } catch (e) { console.error('[âm thanh]', e); }
  }

  // ===== Khởi tạo, tắt/bật tiếng, tạm dừng khi ẩn tab =====
  function init() {
    if (ctx) { // đã khởi tạo: chỉ đảm bảo đang chạy
      if (!muted && !document.hidden && ctx.state !== 'running') resumeCtx();
      return;
    }
    if (!AC) return;
    try {
      try { ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { ctx = new AC(); }
      A.ctx = ctx;
      resumeCtx();
      try { // mở khoá âm thanh trên iOS bằng một mẫu im lặng
        const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource();
        s.buffer = b; s.connect(ctx.destination); s.start(0);
      } catch (e) {}
      initAt = performance.now();
      if (!mutedTouched) muted = !!(G.save && G.save.data && G.save.data.muted);
      buildGraph();
      ready = true; A.ready = true;
      const t = ctx.currentTime;
      if (muted) {
        master.gain.value = 0;
        suspendTimer = setTimeout(() => { if (muted && ctx && ctx.state === 'running') suspendCtx(); }, 650);
      } else {
        master.gain.setValueAtTime(0, t); master.gain.linearRampToValueAtTime(LV.master, t + 1.5); // vào chùa: âm thanh hiện dần
      }
      if (ducked) setDuck(true);
      startAmbience();
    } catch (e) {
      console.error('[âm thanh] không khởi tạo được', e);
      ready = false; A.ready = false;
      clearInterval(lookTimer);
      for (const id of timers) clearTimeout(id);
      timers.clear();
      if (ctx) { try { ctx.close(); } catch (e2) {} }
      ctx = null; A.ctx = null; // lần init sau sẽ thử lại từ đầu
    }
  }
  function setMuted(m) {
    const changed = muted !== !!m;
    muted = !!m; mutedTouched = true;
    G.events.emit('audio:mute', muted);
    if (!ready) return;
    if (!changed && !muted) { if (ctx.state !== 'running' && !document.hidden) resumeCtx(); return; } // vẫn đang bật: giữ đường hiện dần lúc vào chùa
    const t = ctx.currentTime;
    clearTimeout(suspendTimer);
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    if (muted) {
      master.gain.setTargetAtTime(0, t, 0.08);
      suspendTimer = setTimeout(() => { if (muted && ctx && ctx.state === 'running') suspendCtx(); }, 650); // ngủ yên cho đỡ tốn pin
    } else {
      if (ctx.state !== 'running' && !document.hidden) resumeCtx();
      master.gain.setTargetAtTime(LV.master, t, 0.15);
    }
  }
  function onVisibility() {
    if (!ctx || !ready) return;
    if (document.hidden) {
      if (ctx.state === 'running') { hiddenSuspended = true; suspendCtx(); }
    } else if (hiddenSuspended) {
      hiddenSuspended = false;
      if (!muted) resumeCtx();
    }
  }
  // chạm/phím bất kỳ: nếu trình duyệt đã tạm dừng âm thanh (iOS ngắt quãng…) thì thử bật lại
  function wake() { if (ctx && ready && !muted && !document.hidden && ctx.state !== 'running' && ctx.state !== 'closed') resumeCtx(); }
  document.addEventListener('visibilitychange', onVisibility);
  for (const ev of ['pointerdown', 'pointerup', 'touchend', 'click']) window.addEventListener(ev, wake, { passive: true, capture: true });
  window.addEventListener('keydown', wake);
  offs.push(G.events.on('activity:start', () => setDuck(true)));
  offs.push(G.events.on('activity:end', () => setDuck(false)));
  offs.push(G.events.on('footstep', onFootstep));
  offs.push(G.events.on('quality:low', () => { lowQ = true; }));

  // phát một hiệu ứng theo tên; opts có thể kèm vol (0..1), when (giờ AudioContext tuyệt đối) hoặc delay (giây)
  function play(name, opts) {
    const fn = SFX[name];
    if (!fn || !canPlay()) return false;
    if (!spend(COST[name] || 5, name === 'bell' || name === 'mo')) return false; // quá tải: bỏ tiếng phụ
    const o = opts || {};
    let t = ctx.currentTime;
    if (typeof o.when === 'number') t = Math.max(t, o.when); else if (o.delay > 0) t += o.delay;
    curVol = o.vol == null ? 1 : clamp(o.vol, 0, 1.5);
    try { fn(o, t); } catch (e) { console.error('[âm thanh]', name, e); curVol = 1; return false; }
    curVol = 1;
    return true;
  }
  function dispose() {
    for (const id of timers) clearTimeout(id);
    timers.clear(); clearTimeout(suspendTimer); clearInterval(lookTimer);
    document.removeEventListener('visibilitychange', onVisibility);
    for (const ev of ['pointerdown', 'pointerup', 'touchend', 'click']) window.removeEventListener(ev, wake, { capture: true });
    window.removeEventListener('keydown', wake);
    for (const f of offs) f();
    offs.length = 0;
    ready = false; A.ready = false;
    if (ctx) { try { ctx.close(); } catch (e) {} ctx = null; A.ctx = null; }
  }

  // ===== Đối tượng G.audio =====
  const A = (G.audio = {
    ctx: null, ready: false,
    init, setMuted, isMuted: () => muted, play, dispose,
    duck: setDuck, // hạ/khôi phục âm nền thủ công
    musicBus: () => musicBus, // đích nối nhạc nền (null khi chưa khởi tạo)
    applyLevels: () => applyLevels(false), // áp lại âm lượng các kênh sau khi người chơi chỉnh
    preview, // nghe thử một kênh: 'chime' | 'sfx' | 'master' | 'amb'
    channel: (k) => (CAT[k] ? CAT[k][0] : null), // nút gain của một kênh (để kiểm thử)
    now: () => (ctx ? ctx.currentTime : performance.now() / 1000), // giờ AudioContext (giây) để trò gõ mõ canh nhịp
  });
}
