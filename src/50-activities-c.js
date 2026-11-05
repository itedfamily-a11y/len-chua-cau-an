// =====================================================================
//  HOẠT ĐỘNG KHU MỞ RỘNG (module 50): xoay tháp Cửu phẩm · đi nhiễu tháp Báo Nghiêm ·
//  lần chuỗi hạt trước Quan Âm · thở chánh niệm ở vườn tháp · linh thú · dấu ấn hành hương.
//  Mọi chữ về chùa thật đều ghi "phỏng theo" (chùa Bút Tháp, chùa Phật Tích — Bắc Ninh);
//  chùa An Lạc trong trò chơi chỉ là chùa hư cấu. Không thắng thua, không chấm điểm.
// =====================================================================
function installActivitiesC(G) {
  const { util: U } = G;
  const PI = Math.PI, TAU = PI * 2;
  const E = G.world && G.world.ext;
  if (!E) { console.warn('[khu mở rộng] thiếu G.world.ext, bỏ qua các hoạt động mở rộng'); return; }
  const sfx = (name, o) => { try { G.audio?.play?.(name, o); } catch (e) { /* âm thanh lỗi thì bỏ qua */ } };

  // =====================================================================
  //  LƯU TRÊN MÁY: d.ext = { stamps:{id:ngày}, animals:{loài:ngày}, cuuPham, nhieuThap, chuoiHat, thoChanhNiem }
  //  Luôn đọc lại qua X() vì "xoá dữ liệu" có thể thay cả đối tượng lưu.
  // =====================================================================
  const COUNT_KEYS = ['cuuPham', 'nhieuThap', 'chuoiHat', 'thoChanhNiem'];
  function X() {
    const d = G.save.data;
    let x = d.ext;
    if (!x || typeof x !== 'object') x = d.ext = {};
    if (!x.stamps || typeof x.stamps !== 'object') x.stamps = {};
    if (!x.animals || typeof x.animals !== 'object') x.animals = {};
    for (let i = 0; i < COUNT_KEYS.length; i++) if (typeof x[COUNT_KEYS[i]] !== 'number') x[COUNT_KEYS[i]] = 0;
    return x;
  }

  // =====================================================================
  //  DỮ LIỆU CHỮ: linh thú, dấu ấn hành hương, câu niệm
  // =====================================================================
  const SPECIES = [
    { kind: 'sutu', name: 'Sư tử', mean: 'sự uy dũng, che chở chánh pháp' },
    { kind: 'voi', name: 'Voi', mean: 'sức mạnh và sự vững chãi' },
    { kind: 'tegiac', name: 'Tê giác', mean: 'sự kiên định' },
    { kind: 'trau', name: 'Trâu', mean: 'sự cần mẫn, gắn bó với nhà nông' },
    { kind: 'ngua', name: 'Ngựa', mean: 'sự nhanh nhẹn, bền bỉ' },
  ];
  const SPEC = {};
  for (const s of SPECIES) SPEC[s.kind] = s;

  const SITE_INFO = {
    'cau-da': { icon: 'lotus', intro: 'Phỏng theo cầu đá chạm khắc chùa Bút Tháp và ao Long Trì chùa Phật Tích.' },
    'linh-thu': { icon: 'beast', intro: 'Phỏng theo bộ linh thú đá thời Lý ở chùa Phật Tích.' },
    'tich-thien-am': { icon: 'wheel', intro: 'Phỏng theo Tích Thiện Am và toà Cửu phẩm liên hoa ở chùa Bút Tháp.' },
    'quan-am': { icon: 'beads', intro: 'Phỏng theo tượng Quan Âm nghìn mắt nghìn tay ở chùa Bút Tháp.' },
    'bao-nghiem': { icon: 'stupa', intro: 'Phỏng theo tháp đá 8 mặt, 5 tầng của chùa Bút Tháp.' },
    'vuon-thap': { icon: 'stupa', intro: 'Phỏng theo vườn tháp ở chùa Phật Tích — một góc yên tĩnh để dừng chân.' },
    'hanh-lang': { icon: 'walk', intro: 'Phỏng theo hai dãy hành lang dài của chùa Bút Tháp.' },
  };

  const SYL = ['Nam', 'mô', 'A', 'Di', 'Đà', 'Phật'];
  const WORD_AT = [0, 1, 2, 3, 4, 5, 5, -1];   // 8 bước mỗi vòng: sáu chữ, "Phật" ngân thêm một bước, rồi nghỉ
  const BEAD_N = 21;
  const BEAD_LINES = [
    'Gửi lòng thương yêu đến người thân trong gia đình.',
    'Gửi lòng thương yêu đến bạn bè và những người bạn gặp mỗi ngày.',
    'Gửi lòng thương yêu đến chính mình — bạn cũng cần được dịu dàng.',
  ];

  // Hình bóng linh thú (nhìn nghiêng, quay sang phải, đặt trên bệ hoa sen) — chuỗi SVG tĩnh do mã viết
  const PED = '<path d="M10 68h76v3H10z"/><path opacity=".75" d="M14 68q4-9 8 0q4-9 8 0q4-9 8 0q4-9 8 0q4-9 8 0q4-9 8 0q4-9 8 0q4-9 8 0q4-9 8 0z"/>';
  const LINE = (d, w) => '<path d="' + d + '" fill="none" stroke="currentColor" stroke-width="' + w + '" stroke-linecap="round"/>';
  const SIL = {
    sutu: '<svg viewBox="0 0 96 72" aria-hidden="true" fill="currentColor"><ellipse cx="40" cy="54" rx="26" ry="10"/><rect x="54" y="54" width="24" height="9" rx="4"/>'
      + '<circle cx="62" cy="38" r="15"/><circle cx="66" cy="41" r="8.5" fill="#fff" fill-opacity=".3"/><circle cx="53" cy="27" r="4"/><circle cx="70" cy="25" r="4"/>'
      + LINE('M15 56Q5 54 7 42', 4) + PED + '</svg>',
    voi: '<svg viewBox="0 0 96 72" aria-hidden="true" fill="currentColor"><ellipse cx="40" cy="42" rx="25" ry="16"/><rect x="22" y="50" width="10" height="14" rx="3"/><rect x="48" y="50" width="10" height="14" rx="3"/>'
      + '<circle cx="66" cy="36" r="12"/><ellipse cx="58" cy="38" rx="7" ry="11" fill="#fff" fill-opacity=".25"/>'
      + LINE('M74 40Q86 46 80 62', 7) + '<path d="M72 46Q80 50 78 54" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>'
      + LINE('M15 36q-4 8-1 16', 3) + PED + '</svg>',
    tegiac: '<svg viewBox="0 0 96 72" aria-hidden="true" fill="currentColor"><ellipse cx="38" cy="44" rx="25" ry="14"/><rect x="20" y="52" width="10" height="12" rx="3"/><rect x="48" y="52" width="10" height="12" rx="3"/>'
      + '<path d="M56 34L80 44L78 58L58 58Z"/><path d="M75 44L80 28L82 46Z"/><path d="M67 38L70 30L72 40Z"/><path d="M58 34L60 26L64 34Z"/>'
      + LINE('M14 40q-4 6-2 12', 3) + PED + '</svg>',
    trau: '<svg viewBox="0 0 96 72" aria-hidden="true" fill="currentColor"><ellipse cx="36" cy="46" rx="23" ry="13"/><rect x="18" y="54" width="10" height="11" rx="3"/><rect x="44" y="54" width="10" height="11" rx="3"/>'
      + '<path d="M50 36L66 44L68 58L52 56Z"/><ellipse cx="68" cy="54" rx="9" ry="6" transform="rotate(25 68 54)"/>'
      + LINE('M64 47Q52 46 46 33', 4.5) + LINE('M13 44q-5 6-2 16', 3) + PED + '</svg>',
    ngua: '<svg viewBox="0 0 96 72" aria-hidden="true" fill="currentColor"><ellipse cx="38" cy="42" rx="23" ry="11"/><rect x="18" y="48" width="5" height="17" rx="2"/><rect x="27" y="48" width="5" height="17" rx="2"/>'
      + '<rect x="46" y="48" width="5" height="17" rx="2"/><rect x="55" y="48" width="5" height="17" rx="2"/><path d="M52 36L60 18L68 21L64 40Z"/>'
      + '<ellipse cx="72" cy="22" rx="10" ry="5.5" transform="rotate(30 72 22)"/><path d="M62 15L64 8L67 17Z"/>'
      + '<path d="M60 16Q52 26 50 38" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="3" stroke-linecap="round"/>'
      + LINE('M16 38Q6 46 10 60', 4) + PED + '</svg>',
  };

  // =====================================================================
  //  KIỂU DÁNG: nâu ấm – vàng kim (tiền tố ac-)
  // =====================================================================
  G.ui.addStyle(`
  @keyframes ac-fade{from{opacity:0}to{opacity:1}}
  @keyframes ac-cap{0%{opacity:0;transform:translateX(-50%) translateY(8px)}25%,100%{opacity:1;transform:translateX(-50%)}}
  @keyframes ac-chipin{from{opacity:0;transform:translateX(-50%) translateY(-8px)}to{opacity:1;transform:translateX(-50%)}}
  @keyframes ac-pop{0%{transform:scale(1)}35%{transform:scale(1.07)}100%{transform:scale(1)}}
  .ac-layer{position:absolute;inset:0;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;animation:ac-fade .4s ease-out both}
  .ac-layer.ac-drag{cursor:grab}
  .ac-layer.ac-drag:active{cursor:grabbing}
  #overlay > .ac-passive,#overlay > .ac-layer.ac-end{pointer-events:none}
  .ac-x{position:absolute;right:calc(12px + var(--sr));top:calc(58px + var(--st));width:48px;height:48px;border-radius:50%;border:1px solid var(--line);
    background:var(--panel);color:var(--gold2);font-size:26px;line-height:1;padding:0;display:grid;place-items:center;box-shadow:var(--shadow);cursor:pointer;pointer-events:auto}
  .ac-x:active{transform:scale(.94)}
  .ac-badge{position:absolute;left:50%;top:calc(66px + var(--st));transform:translateX(-50%);font-family:var(--serif);font-weight:700;font-size:18px;color:var(--gold2);
    background:rgba(42,24,14,.72);border:1px solid var(--line);border-radius:20px;padding:6px 16px;pointer-events:none;white-space:nowrap}
  .ac-cap{position:absolute;left:50%;top:calc(114px + var(--st));transform:translateX(-50%);width:max-content;max-width:min(86vw,520px);text-align:center;
    font-family:var(--serif);font-size:17px;line-height:1.45;color:var(--cream);background:rgba(42,24,14,.7);border:1px solid var(--line);border-radius:18px;
    padding:8px 16px;text-shadow:0 1px 2px rgba(0,0,0,.5);pointer-events:none;opacity:0}
  .ac-cap.on{animation:ac-cap .9s ease-out both}
  .ac-cap.small{font-size:14.5px;color:var(--muted);padding:6px 14px}
  .ac-kara{position:absolute;left:50%;bottom:calc(186px + var(--sb));transform:translateX(-50%);display:flex;align-items:baseline;justify-content:center;gap:2px;
    font-family:var(--serif);font-weight:700;font-size:22px;color:rgba(251,238,215,.62);background:rgba(42,24,14,.66);border:1px solid var(--line);
    border-radius:22px;padding:6px 14px;pointer-events:none;white-space:nowrap;transition:opacity .3s}
  .ac-kara span{display:inline-block;padding:0 4px;transition:color .15s,transform .15s,text-shadow .15s}
  .ac-kara span.on{color:var(--gold2);transform:scale(1.2);text-shadow:0 0 12px rgba(247,215,147,.85)}
  .ac-end .ac-kara,.ac-end .ac-hw{opacity:.25}
  .ac-end .ac-hold{pointer-events:none}
  .ac-hw{position:absolute;left:50%;bottom:calc(28px + var(--sb));width:136px;height:136px;margin-left:-68px;pointer-events:none;transition:opacity .3s}
  .ac-ringsvg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg);pointer-events:none}
  .ac-ringsvg circle{fill:none;stroke-linecap:round;stroke-width:6}
  .ac-ringsvg .bg{stroke:rgba(251,238,215,.2)}
  .ac-ringsvg .fg{stroke:var(--gold2);filter:drop-shadow(0 0 4px rgba(247,215,147,.7))}
  .ac-hold{position:absolute;left:14px;top:14px;width:108px;height:108px;border-radius:50%;border:2px solid #fff3cf;background:linear-gradient(180deg,#f6cf7c,#e0a344);color:var(--ink);
    font-size:14.5px;font-weight:800;line-height:1.15;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;pointer-events:auto;touch-action:none;
    -webkit-user-select:none;user-select:none;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.45);text-align:center}
  .ac-hold svg{width:30px;height:30px;fill:none;stroke:var(--ink);stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
  .ac-hold.on{background:linear-gradient(180deg,#ffe29a,#f0b24d);transform:scale(.97)}
  .ac-bz{position:absolute;left:50%;bottom:calc(112px + var(--sb));width:min(72vw,280px,46vh);aspect-ratio:1/1;transform:translateX(-50%);pointer-events:none}
  .ac-bz svg{width:100%;height:100%;display:block;overflow:visible}
  .ac-bg{transform-origin:120px 120px;transition:transform .45s cubic-bezier(.2,.9,.3,1)}
  .ac-thread{fill:none;stroke:rgba(247,215,147,.35);stroke-width:1.6}
  .ac-bead{fill:#5b3a22;stroke:rgba(247,215,147,.42);stroke-width:1.4;transition:fill .3s}
  .ac-bead.done{fill:#b97a35}
  .ac-bead.cur{fill:#ffe29a;stroke:#fff3cf;filter:drop-shadow(0 0 6px rgba(255,226,154,.9))}
  .ac-mark{fill:var(--gold2)}
  .ac-bc{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:var(--serif);color:var(--gold2);pointer-events:none;
    background:radial-gradient(circle,rgba(42,24,14,.62) 0,rgba(42,24,14,.4) 52%,rgba(42,24,14,0) 70%);border-radius:50%}
  .ac-bc b{font-size:46px;line-height:1.05}
  .ac-bc span{font-size:14px;color:var(--muted)}
  .ac-bc.pop{animation:ac-pop .22s ease-out}
  .ac-tap{position:absolute;left:50%;bottom:calc(26px + var(--sb));transform:translateX(-50%);width:min(88vw,380px);min-height:64px;border-radius:32px;border:2px solid #fff3cf;
    background:linear-gradient(180deg,#f6cf7c,#e0a344);color:var(--ink);font-size:18px;font-weight:800;display:flex;align-items:center;justify-content:center;
    box-shadow:0 8px 24px rgba(0,0,0,.45),0 0 0 6px rgba(247,215,147,.16);pointer-events:none;text-align:center;padding:0 16px}
  .ac-tap.hit{animation:ac-pop .2s ease-out}
  .ac-bz2{position:absolute;left:50%;bottom:calc(132px + var(--sb));width:min(64vw,250px,40vh);aspect-ratio:1/1;transform:translateX(-50%);pointer-events:none;display:grid;place-items:center}
  .ac-orb{position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 50% 42%,rgba(255,243,207,.55),rgba(232,184,92,.36) 55%,rgba(121,184,147,.2) 100%);
    border:2px solid rgba(255,243,207,.6);box-shadow:0 0 40px rgba(247,215,147,.35);transform:scale(.55);will-change:transform}
  .ac-btxt{position:relative;text-align:center;font-family:var(--serif);color:var(--cream);text-shadow:0 1px 6px rgba(0,0,0,.7)}
  .ac-btxt b{display:block;font-size:24px}
  .ac-btxt span{display:block;min-height:34px;font-size:30px;color:var(--gold2)}
  .ac-donebtn{position:absolute;left:0;right:0;margin:0 auto;bottom:calc(40px + var(--sb));width:min(60vw,240px);min-height:56px;font-size:18px;pointer-events:auto}
  .ac-chip{position:fixed;left:50%;top:calc(62px + var(--st));transform:translateX(-50%);display:flex;align-items:center;gap:8px;max-width:calc(100vw - 120px);
    padding:4px 4px 4px 8px;background:var(--panel);border:1px solid var(--line);border-radius:28px;box-shadow:var(--shadow);animation:ac-chipin .3s ease-out;pointer-events:auto}
  body.in-activity .ac-chip{opacity:0;pointer-events:none}
  body.ac-quest:not(.in-activity) #toasts{top:calc(126px + var(--st))}
  .ac-chip-ring{flex:none;width:36px;height:36px;transform:rotate(-90deg)}
  .ac-chip-ring circle{fill:none;stroke-width:3.4;stroke-linecap:round}
  .ac-chip-ring .bg{stroke:rgba(251,238,215,.2)}
  .ac-chip-ring .fg{stroke:var(--gold2)}
  .ac-chip-t{min-width:0;line-height:1.25}
  .ac-chip-t b{display:block;font-size:13.5px;color:var(--gold2)}
  .ac-chip-t span{display:block;font-size:11.5px;color:var(--muted)}
  .ac-chip-x{flex:none;width:44px;height:44px;border-radius:50%;border:1px solid var(--line);background:rgba(255,255,255,.06);color:var(--gold2);font-size:22px;line-height:1;padding:0}
  .ac-line{text-align:center;color:var(--cream);font-family:var(--serif);font-size:17px;line-height:1.5;margin:4px 0 8px}
  .ac-p{margin:0 0 10px;line-height:1.55}
  .ac-intro{font-size:14px;line-height:1.5}
  .ac-prog{margin:10px 0 0;font-family:var(--serif);font-weight:700;color:var(--gold2)}
  .ac-zoo{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:10px;margin:10px 0}
  .ac-an{border:1px dashed var(--line);border-radius:14px;padding:10px 8px;background:rgba(255,255,255,.03);text-align:center}
  .ac-an.on{border:1px solid var(--gold);background:linear-gradient(180deg,rgba(247,215,147,.16),rgba(232,184,92,.05))}
  .ac-sil{height:72px;display:grid;place-items:center;color:rgba(214,191,159,.3)}
  .ac-an.on .ac-sil{color:var(--gold)}
  .ac-sil svg{height:72px;width:96px}
  .ac-an b{display:block;font-family:var(--serif);font-size:17px;color:var(--gold2);margin-top:2px}
  .ac-an p{margin:4px 0 0;font-size:12.5px;line-height:1.4;color:var(--muted);min-height:35px}
  .ac-tag{display:inline-block;margin-top:6px;padding:1px 10px;border-radius:12px;font-size:12px;border:1px solid var(--line);color:var(--muted)}
  .ac-an.on .ac-tag{color:var(--ink);background:var(--gold);border-color:#fff0c8;font-weight:700}
  .ac-h{font-family:var(--serif);font-size:17px;font-weight:700;color:var(--gold2);margin:18px 0 8px}
  .ac-sub{font-size:13px;color:var(--muted);margin:0 0 8px}
  .ac-stamps{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}
  .ac-stamp{display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;padding:10px 6px;min-height:112px;border-radius:14px;border:1px dashed var(--line);
    background:rgba(255,255,255,.03);opacity:.62}
  .ac-stamp.on{opacity:1;border:1px solid var(--gold);background:linear-gradient(180deg,rgba(247,215,147,.2),rgba(232,184,92,.08));box-shadow:0 0 0 2px rgba(232,184,92,.18) inset}
  .ac-seal{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;border:2px solid var(--muted);color:var(--muted)}
  .ac-stamp.on .ac-seal{border-color:var(--gold2);color:var(--gold2);background:rgba(247,215,147,.14)}
  .ac-seal svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  .ac-sn{font-size:12.5px;font-weight:700;line-height:1.25}
  .ac-sd{font-size:11px;color:var(--muted)}
  .ac-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-top:10px}
  .ac-stat{background:rgba(255,255,255,.05);border:1px solid var(--line);border-radius:14px;padding:10px 12px}
  .ac-stat b{display:block;font-family:var(--serif);font-size:22px;line-height:1.2;color:var(--gold2)}
  .ac-stat span{font-size:13px;color:var(--muted)}
  @media (max-height:560px){
    .ac-hw{width:108px;height:108px;margin-left:-54px;bottom:calc(14px + var(--sb))}
    .ac-hold{left:10px;top:10px;width:88px;height:88px;font-size:12.5px}
    .ac-hold svg{width:22px;height:22px}
    .ac-kara{bottom:calc(130px + var(--sb));font-size:18px}
    .ac-bz{bottom:calc(84px + var(--sb));width:min(40vh,240px)}
    .ac-bz2{bottom:calc(96px + var(--sb));width:min(40vh,200px)}
    .ac-tap{min-height:52px;font-size:16px;bottom:calc(16px + var(--sb))}
    .ac-donebtn{bottom:calc(20px + var(--sb))}
    .ac-cap{top:calc(104px + var(--st));font-size:15px}
  }
  @media (prefers-reduced-motion:reduce){.ac-bg{transition:none}.ac-layer,.ac-cap.on,.ac-chip{animation:none}}
  `);

  // =====================================================================
  //  THÔNG BÁO NHẸ: xếp hàng, cách nhau ~3 giây, không hiện trước khi vào chùa,
  //  tạm hoãn khi đang làm hoạt động hoặc đang mở bảng
  // =====================================================================
  const tq = [];
  let nextToast = 0;
  function say(text, ms, snd, vol) { if (tq.length < 24) tq.push({ text, ms: ms || 4600, snd: snd || '', vol }); }
  function flushToasts() {
    if (!tq.length || !G.started || G.time < nextToast || G.activity.current || G.ui.panelOpen) return;
    const q = tq.shift();
    const t = G.ui.toast(q.text, q.ms);
    if (t && t.style) t.style.whiteSpace = 'pre-line';
    if (q.snd) sfx(q.snd, q.vol ? { vol: q.vol } : undefined);
    nextToast = G.time + 2.4;
  }

  // =====================================================================
  //  PHIÊN CHẠY: gom mọi thứ cần dọn; G.activity.end() được gọi đúng một lần ở MỌI lối thoát
  // =====================================================================
  let busy = false;      // chặn bắt đầu hai lần
  let run = null;        // phiên hiện tại
  const frameFns = [];   // hàm cập nhật mỗi khung của phiên hiện tại

  function newRun(name) {
    const r = {
      name, dead: false, offs: [], cleanups: [],
      on(evt, fn) { r.offs.push(G.events.on(evt, fn)); },
      defer(fn) { r.cleanups.push(fn); },
      frame(fn) { frameFns.push(fn); r.cleanups.push(() => { const i = frameFns.indexOf(fn); if (i >= 0) frameFns.splice(i, 1); }); },
      sleep(sec) { return G.wait(sec).then(() => !r.dead); },
      tween(dur, fn, ease) { return G.tween(dur, (e, k) => { if (!r.dead) fn(e, k); }, ease).then(() => !r.dead); },
      exit() {
        if (r.dead) return;
        r.dead = true;
        for (const off of r.offs) { try { off(); } catch (e) { console.error(e); } }
        for (let i = r.cleanups.length - 1; i >= 0; i--) { try { r.cleanups[i](); } catch (e) { console.error(e); } }
        r.offs.length = 0; r.cleanups.length = 0;
        if (G.player.walking) G.player.stopWalk();
        if (G.activity.current === name) G.activity.end();
        if (run === r) run = null;
        busy = false;
      },
    };
    run = r;
    r.on('escape', () => r.exit());
    return r;
  }
  // Chạy một hàm bất đồng bộ; nếu lỗi thì dọn sạch để không kẹt hoạt động
  function launch(name, fn) {
    fn().catch((e) => {
      console.error(e);
      if (run) run.exit();
      else if (G.activity.current === name) G.activity.end();
      busy = false;
    });
  }
  // Đi tới chỗ đứng rồi quay mặt đúng hướng; trả về false nếu phiên đã bị đóng
  async function goTo(r, st) {
    const P = G.player;
    const ok = await P.walkTo(st.x, st.z);
    if (r.dead) return false;
    if (!ok || Math.hypot(P.pos.x - st.x, P.pos.z - st.z) > 0.6) P.placeAt(st.x, st.z, st.yaw);
    await P.faceTo(st.yaw);
    return !r.dead;
  }

  // ---------- Thành phần giao diện dùng chung ----------
  function mkLayer(r, passive, cls) {
    const el = U.el('div', 'ac-layer' + (passive ? ' ac-passive' : '') + (cls ? ' ' + cls : ''));
    G.ui.overlay.appendChild(el);
    r.defer(() => el.remove());
    return el;
  }
  function mkClose(layer, fn) {
    const b = U.el('button', 'ac-x', '×');
    b.type = 'button'; b.setAttribute('aria-label', 'Đóng'); b.title = 'Xong';
    b.addEventListener('pointerdown', (e) => e.stopPropagation());
    b.addEventListener('click', (e) => { e.stopPropagation(); sfx('ui'); fn(); });
    layer.appendChild(b);
    return b;
  }
  function mkCaption(layer, small) {
    const el = U.el('div', 'ac-cap' + (small ? ' small' : '')); el.setAttribute('aria-live', 'polite');
    layer.appendChild(el);
    return {
      el,
      say(t) {
        el.classList.remove('on');
        if (!t) return;
        el.textContent = t; void el.offsetWidth; el.classList.add('on');
      },
    };
  }
  const NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function dropPanel(holder) { if (holder.p) { const p = holder.p; holder.p = null; p.close(); } }

  // =====================================================================
  //  1) XOAY THÁP CỬU PHẨM — đẩy toà tháp gỗ bát giác xoay quanh trục giữa, 3 vòng
  //  Quán tính: tốc độ góc w giảm dần (ma sát), vẫn quay tiếp sau khi hoạt động kết thúc.
  // =====================================================================
  const SPIN_MAX = 2.4, SPIN_HOLD = 1.8, SPIN_FRIC = 0.85, SPIN_DRAG = 0.011;
  const spin = { w: 0, total: 0, pend: 0, hold: 0, imp: 0 };   // total: tổng góc đã quay (rad, giá trị tuyệt đối)
  function updateSpin(dt) {
    if (spin.w === 0 && spin.pend === 0 && spin.hold === 0 && spin.imp === 0) return;
    let w = spin.w;
    if (spin.pend !== 0) { w += spin.pend * SPIN_DRAG; spin.pend = 0; }
    if (spin.imp !== 0) { w += spin.imp; spin.imp = 0; }
    if (spin.hold !== 0) w += spin.hold * SPIN_HOLD * dt;
    if (w > SPIN_MAX) w = SPIN_MAX; else if (w < -SPIN_MAX) w = -SPIN_MAX;
    w *= Math.exp(-(SPIN_FRIC + (w < 0.25 && w > -0.25 ? 1.6 : 0)) * dt);   // chậm dần rồi dừng êm
    if (spin.hold === 0 && w < 0.004 && w > -0.004) w = 0;
    spin.w = w;
    const dA = w * dt;
    spin.total += dA < 0 ? -dA : dA;
    const tw = E.cuuPham && E.cuuPham.tower;      // có thể chưa có hình khối: vẫn đếm vòng ảo
    if (tw) tw.rotation.y += dA;
  }

  function startCuuPham() {
    if (busy || G.activity.current) return;
    busy = true;
    launch('cuuPham', runCuuPham);
  }

  async function runCuuPham() {
    const C = E.cuuPham;
    if (!G.activity.begin('cuuPham', { cam: C.cam })) { busy = false; return; }
    const r = newRun('cuuPham');
    const holder = { p: null };
    let state = 'wait', base = spin.total, dragId = -1, dragX = 0, holdId = -1, again = false;
    let lastPq = -1, lastStep = -1, lastQ = 0, lastLap = 0;
    const RING_C = 2 * PI * 64;
    r.defer(() => { spin.hold = 0; spin.pend = 0; dropPanel(holder); });

    const layer = mkLayer(r, false);
    mkClose(layer, () => r.exit());
    const P = G.player;
    if (!(await goTo(r, C.stand))) return;
    P.poseParam = 0; P.setPose('offer');

    // --- giao diện: vòng đếm 3 vòng quanh nút giữ, dòng niệm, kéo ngang ở bất kỳ đâu ---
    layer.classList.add('ac-drag');
    const badge = U.el('div', 'ac-badge', 'Vòng 1/3');
    const cap = mkCaption(layer, true);
    const kara = U.el('div', 'ac-kara');
    const syl = SYL.map((w) => kara.appendChild(U.el('span', null, w)));
    const hw = U.el('div', 'ac-hw');
    hw.innerHTML = '<svg class="ac-ringsvg" viewBox="0 0 136 136" aria-hidden="true"><circle class="bg" cx="68" cy="68" r="64"/><circle class="fg" cx="68" cy="68" r="64"/></svg>';
    const fg = hw.querySelector('.fg');
    fg.style.strokeDasharray = RING_C.toFixed(2); fg.style.strokeDashoffset = RING_C.toFixed(2);
    const hold = U.el('div', 'ac-hold'); hold.setAttribute('role', 'button'); hold.setAttribute('aria-label', 'Giữ để đẩy tháp xoay');
    hold.innerHTML = G.icons.lotus + '<span>Giữ để đẩy</span>';
    hw.appendChild(hold);
    layer.append(badge, kara, hw);

    const setHold = (on) => {
      hold.classList.toggle('on', on);
      spin.hold = on ? (spin.w < -0.3 ? -1 : 1) : 0;    // đẩy tiếp theo chiều đang quay
    };
    hold.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (state !== 'spin' || holdId >= 0) return;
      holdId = e.pointerId; try { hold.setPointerCapture(e.pointerId); } catch (err) { /* bỏ qua */ }
      setHold(true);
    });
    const relHold = (e) => { if (e.pointerId === holdId) { holdId = -1; setHold(false); } };
    hold.addEventListener('pointerup', relHold); hold.addEventListener('pointercancel', relHold); hold.addEventListener('lostpointercapture', relHold);
    layer.addEventListener('pointerdown', (e) => {
      if (state !== 'spin' || dragId >= 0) return;
      e.preventDefault();
      dragId = e.pointerId; dragX = e.clientX;
      try { layer.setPointerCapture(e.pointerId); } catch (err) { /* bỏ qua */ }
    });
    layer.addEventListener('pointermove', (e) => { if (e.pointerId === dragId && state === 'spin') { spin.pend += e.clientX - dragX; dragX = e.clientX; } });
    const endDrag = (e) => { if (e.pointerId === dragId) dragId = -1; };
    layer.addEventListener('pointerup', endDrag); layer.addEventListener('pointercancel', endDrag); layer.addEventListener('lostpointercapture', endDrag);
    r.on('key:action', () => { if (state === 'spin') spin.imp += spin.w < -0.3 ? -0.7 : 0.7; });

    function resetRound() {
      state = 'spin'; base = spin.total; lastPq = -1; lastStep = -1; lastQ = 0; lastLap = 0;
      layer.classList.remove('ac-end'); layer.classList.add('ac-drag');
      badge.textContent = 'Vòng 1/3';
      fg.style.strokeDashoffset = RING_C.toFixed(2);
      for (let i = 0; i < syl.length; i++) syl[i].classList.remove('on');
      cap.say('Kéo ngang hoặc giữ nút để đẩy tháp xoay');
    }
    function showReflection() {
      const body = U.el('div');
      body.append(
        U.el('div', 'ac-line', 'Ba vòng tháp đã xoay xong.'),
        U.el('p', 'ac-p', 'Phỏng theo toà Cửu phẩm liên hoa ở chùa Bút Tháp: một toà tháp gỗ 9 tầng hình bát giác, xếp như đài sen và có thể xoay quanh trục giữa.'),
        U.el('p', 'ac-p', 'Chín tầng sen gợi nhắc rằng điều lành được làm nên từ những việc nhỏ: một lời nói dịu dàng, một việc tử tế hôm nay, cứ nhẹ nhàng, từng bước một.'),
        U.el('div', 'note', 'Tháp vẫn đang xoay chậm lại; bạn cứ ngắm cho tới khi tháp đứng yên nhé.'));
      holder.p = G.ui.panel({
        title: 'Cửu phẩm liên hoa', body, clear: true,
        actions: [
          { label: 'Xoay thêm', primary: true, onClick: (close) => { again = true; close(); } },
          { label: 'Xong', onClick: (close) => close() },
        ],
        onClose: () => { holder.p = null; if (again) { again = false; resetRound(); } else r.exit(); },
      });
    }
    function finish() {
      state = 'done'; spin.hold = 0; spin.pend = 0; holdId = -1; dragId = -1; hold.classList.remove('on');
      fg.style.strokeDashoffset = '0';
      layer.classList.remove('ac-drag'); layer.classList.add('ac-end');
      cap.say('');
      const x = X(); x.cuuPham += 1; G.save.persist();
      sfx('chime');
      showReflection();
    }

    r.frame(() => {
      if (state !== 'spin') return;
      const turns = (spin.total - base) / TAU;
      const pq = turns >= 3 ? 400 : ((turns / 3) * 400) | 0;
      if (pq !== lastPq) { lastPq = pq; fg.style.strokeDashoffset = (RING_C * (1 - pq / 400)).toFixed(1); }
      const lap = turns >= 3 ? 3 : (turns | 0) + 1;
      if (lap !== lastLap) { lastLap = lap; badge.textContent = 'Vòng ' + lap + '/3'; }
      const step = (turns * 8) | 0;                      // mỗi 1/8 vòng sáng một chữ
      if (step !== lastStep) {
        lastStep = step;
        const w = WORD_AT[step & 7];
        for (let i = 0; i < syl.length; i++) syl[i].classList.toggle('on', i === w);
      }
      const q = (turns * 4) | 0;                         // mỗi 1/4 vòng một tiếng mõ nhẹ
      if (q !== lastQ) { lastQ = q; sfx('mo', { vol: 0.5 }); }
      if (turns >= 3) finish();
    });

    resetRound();
    sfx('bowlBell', { vol: 0.6 });
  }

  // =====================================================================
  //  2) ĐI NHIỄU THÁP BÁO NGHIÊM — hành trình tự do: không khoá nhân vật
  //  Hệ toạ độ: x sang phải, z hướng về người xem; góc θ = atan2(dx, dz) (dx,dz so với tâm tháp).
  //  Nhìn từ trên xuống với phía bắc (−z) ở trên: bắc → đông → nam → tây ứng với θ = π → π/2 → 0 → −π/2,
  //  tức đi theo chiều kim đồng hồ (tháp ở bên tay phải) thì θ GIẢM. Chỉ cộng dồn phần giảm của θ.
  // =====================================================================
  const BN = E.baoNghiem;
  const Q_RIN = BN && BN.ringIn != null ? BN.ringIn : 3.1, Q_ROUT = BN && BN.ringOut != null ? BN.ringOut : 4.4;
  const Q_AREA2 = (Q_ROUT + 5) * (Q_ROUT + 5), Q_RIN2 = Q_RIN * Q_RIN, Q_ROUT2 = Q_ROUT * Q_ROUT;
  const Q_NEED = 3 * TAU;
  const Q_HINT = ['Quay lại lối đi quanh tháp để tiếp tục', 'Bước vào lối đá quanh tháp', 'Giữ tháp ở bên tay phải bạn', 'Hãy đổi chiều: tháp ở bên tay phải bạn'];
  const quest = { on: false, acc: 0, prev: 0, has: false, away: 0, dir: -1, hint: -1, lap: 0, pq: -1, chip: null, fg: null, title: null, sub: null };
  const CHIP_C = 2 * PI * 15;

  function startNhieu() {
    if (quest.on || G.activity.current || !BN) return;
    const q = quest;
    q.on = true; q.acc = 0; q.has = false; q.away = 0; q.dir = -1; q.hint = -1; q.lap = 0; q.pq = -1;
    const chip = (q.chip = U.el('div', 'ac-chip'));
    chip.setAttribute('role', 'status');
    const tmp = U.el('div');
    tmp.innerHTML = '<svg class="ac-chip-ring" viewBox="0 0 36 36" aria-hidden="true"><circle class="bg" cx="18" cy="18" r="15"/><circle class="fg" cx="18" cy="18" r="15"/></svg>';
    const ring = tmp.firstChild;
    q.fg = ring.querySelector('.fg');
    q.fg.style.strokeDasharray = CHIP_C.toFixed(2); q.fg.style.strokeDashoffset = CHIP_C.toFixed(2);
    const t = U.el('div', 'ac-chip-t');
    q.title = U.el('b', null, 'Đi nhiễu tháp: vòng 1/3'); q.sub = U.el('span', null, Q_HINT[1]);
    t.append(q.title, q.sub);
    const x = U.el('button', 'ac-chip-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Dừng đi nhiễu tháp');
    x.addEventListener('click', () => { sfx('ui'); endQuest('x'); });
    chip.append(ring, t, x);
    G.ui.overlay.appendChild(chip);
    document.body.classList.add('ac-quest');
    G.ui.toast('Đi vòng quanh tháp ba vòng, giữ tháp ở bên tay phải bạn (đi theo chiều kim đồng hồ).', 4600);
  }
  function endQuest(reason) {
    const q = quest;
    if (!q.on) return;
    q.on = false;
    if (q.chip) { q.chip.remove(); q.chip = null; }
    q.fg = q.title = q.sub = null;
    document.body.classList.remove('ac-quest');
    if (reason === 'away') say('Bạn đã rời xa tháp nên hành trình nhiễu tháp đã dừng. Khi muốn, hãy bắt đầu lại từ đầu nhé.', 4200);
    else if (reason === 'x') G.ui.toast('Đã dừng đi nhiễu tháp.', 2200);
  }
  function finishQuest() {
    endQuest('done');
    const x = X(); x.nhieuThap += 1; G.save.persist();
    sfx('bellSoft');
    G.ui.toast('Bạn đã đi nhiễu tháp ba vòng. Tâm an, bước chân nhẹ.', 3800);
    const body = U.el('div');
    body.append(
      U.el('div', 'ac-line', 'Bạn đã đi nhiễu tháp ba vòng.'),
      U.el('p', 'ac-p', 'Phỏng theo tháp Báo Nghiêm ở chùa Bút Tháp: tháp đá 8 mặt, 5 tầng, cao khoảng 13 m.'),
      U.el('p', 'ac-p', 'Đi nhiễu quanh tháp là cách bày tỏ lòng thành kính và giữ tâm chánh niệm: bước chân chậm rãi, hơi thở nhẹ nhàng.'));
    G.ui.panel({ title: 'Tháp Báo Nghiêm', body, actions: [{ label: 'Đóng', primary: true }] });
  }
  // mỗi khung khi hành trình đang chạy: không cấp phát đối tượng mới
  function updateQuest(dt) {
    const q = quest, P = G.player;
    const dx = P.pos.x - BN.center.x, dz = P.pos.z - BN.center.z, d2 = dx * dx + dz * dz;
    let st;                                            // 0: ở xa / đang làm hoạt động · 1: gần tháp nhưng ngoài lối · 2: trên lối đi
    if (G.activity.current) st = 0;
    else if (d2 >= Q_RIN2 && d2 <= Q_ROUT2) st = 2;
    else st = d2 <= Q_AREA2 ? 1 : 0;
    let hint = st;
    if (st === 2) {
      q.away = 0;
      const th = Math.atan2(dx, dz);
      if (q.has) {
        let dth = th - q.prev;
        if (dth > PI) dth -= TAU; else if (dth < -PI) dth += TAU;
        if (dth < 0.8 && dth > -0.8) {
          if (dth < -0.0015) { q.acc -= dth; q.dir = -1; }       // theo chiều kim đồng hồ: cộng dồn
          else if (dth > 0.0015) q.dir = 1;                      // ngược chiều: giữ nguyên tiến độ
        }
      }
      q.prev = th; q.has = true;
      hint = q.dir > 0 ? 3 : 2;
    } else {
      q.has = false;                                    // rời lối: bỏ mốc góc cũ để lần vào lại không bị tính nhảy vọt
      if (st === 0 && !G.activity.current) { q.away += dt; if (q.away > 12) { endQuest('away'); return; } } else if (st !== 0) q.away = 0;
    }
    if (hint !== q.hint) { q.hint = hint; q.sub.textContent = Q_HINT[hint]; }
    const lap = q.acc >= Q_NEED ? 3 : ((q.acc / TAU) | 0) + 1;
    if (lap !== q.lap) {
      if (q.lap > 0 && lap > q.lap) sfx('bowlBell', { vol: 0.6 });
      q.lap = lap; q.title.textContent = 'Đi nhiễu tháp: vòng ' + lap + '/3';
    }
    const pq = q.acc >= Q_NEED ? 300 : ((q.acc / Q_NEED) * 300) | 0;
    if (pq !== q.pq) { q.pq = pq; q.fg.style.strokeDashoffset = (CHIP_C * (1 - pq / 300)).toFixed(2); }
    if (q.acc >= Q_NEED) finishQuest();
  }

  // =====================================================================
  //  3) LẦN CHUỖI HẠT TRƯỚC QUAN ÂM — 21 hạt, nhịp tự do (không chấm điểm)
  // =====================================================================
  function startChuoiHat() {
    if (busy || G.activity.current) return;
    busy = true;
    launch('chuoiHat', runChuoiHat);
  }

  async function runChuoiHat() {
    const Q = E.quanAm;
    if (!G.activity.begin('chuoiHat', { cam: Q.cam })) { busy = false; return; }
    const r = newRun('chuoiHat');
    const holder = { p: null };
    let n = 0, done = false, again = false, ready = false;
    r.defer(() => dropPanel(holder));

    const layer = mkLayer(r, false);
    mkClose(layer, () => r.exit());
    const P = G.player;
    if (!(await goTo(r, Q.stand))) return;
    P.poseParam = 0; P.setPose('pray');

    // --- vòng 21 hạt: hạt vừa lần xoay lên đỉnh, hạt đã lần ngả màu vàng đồng ---
    const cap = mkCaption(layer);
    const bz = U.el('div', 'ac-bz');
    const svg = svgEl('svg', { viewBox: '0 0 240 240', 'aria-hidden': 'true' });
    const g = svgEl('g', { class: 'ac-bg' });
    g.appendChild(svgEl('circle', { cx: 120, cy: 120, r: 100, class: 'ac-thread' }));
    const beads = [];
    for (let i = 0; i < BEAD_N; i++) {
      const a = -PI / 2 + (i * TAU) / BEAD_N, big = i % 7 === 6;     // hạt thứ 7, 14, 21 to hơn
      const b = svgEl('circle', { cx: (120 + Math.cos(a) * 100).toFixed(2), cy: (120 + Math.sin(a) * 100).toFixed(2), r: big ? 11 : 8.2, class: 'ac-bead' });
      g.appendChild(b); beads.push(b);
    }
    svg.append(g, svgEl('path', { d: 'M120 -4 l8 -12 h-16 z', class: 'ac-mark' }));
    const bc = U.el('div', 'ac-bc'); const num = U.el('b', null, '0'); bc.append(num, U.el('span', null, '/ ' + BEAD_N + ' hạt'));
    bz.append(svg, bc);
    const tap = U.el('div', 'ac-tap', G.isTouch ? 'Chạm để lần một hạt' : 'Chạm hoặc nhấn Space để lần một hạt');
    layer.append(bz, tap);

    function resetBeads() {
      n = 0; done = false;
      for (let i = 0; i < beads.length; i++) beads[i].setAttribute('class', 'ac-bead');
      g.style.transform = 'rotate(0deg)';
      num.textContent = '0';
      cap.say('Chạm để lần từng hạt, chậm rãi theo nhịp thở của bạn.');
    }
    function showClose() {
      const body = U.el('div');
      body.append(
        U.el('div', 'ac-line', 'Hai mươi mốt hạt đã được lần xong.'),
        U.el('p', 'ac-p', 'Từ bi là lòng thương yêu, mong cho người khác được an vui và bớt khổ. Hãy bắt đầu từ một điều nhỏ: một lời nói dịu dàng, một cử chỉ giúp đỡ hôm nay.'),
        U.el('div', 'note', 'Phỏng theo tượng Quan Âm nghìn mắt nghìn tay ở chùa Bút Tháp. Hình tượng nghìn mắt nghìn tay thường được hiểu là biểu trưng cho việc lắng nghe và đưa tay giúp đỡ muôn người.'));
      holder.p = G.ui.panel({
        title: 'Từ bi', body, clear: true,
        actions: [
          { label: 'Lần thêm một vòng', primary: true, onClick: (close) => { again = true; close(); } },
          { label: 'Xong', onClick: (close) => close() },
        ],
        onClose: () => { holder.p = null; if (again) { again = false; resetBeads(); } else r.exit(); },
      });
    }
    function onTap() {
      if (!ready || done || r.dead) return;
      n++;
      if (n > 1) { beads[n - 2].setAttribute('class', 'ac-bead done'); }
      beads[n - 1].setAttribute('class', 'ac-bead cur');
      g.style.transform = 'rotate(' + (-(n - 1) * (360 / BEAD_N)).toFixed(2) + 'deg)';
      num.textContent = String(n);
      bc.classList.remove('pop'); void bc.offsetWidth; bc.classList.add('pop');
      tap.classList.remove('hit'); void tap.offsetWidth; tap.classList.add('hit');
      if (n % 7 === 1) cap.say(BEAD_LINES[((n - 1) / 7) | 0]);
      if (n === BEAD_N) {
        done = true;
        const x = X(); x.chuoiHat += 1; G.save.persist();
        sfx('chime');
        r.sleep(1.0).then((ok) => { if (ok) showClose(); });
      } else if (n % 7 === 0) sfx('bowlBell', { vol: 0.7 });
      else sfx('mo', { vol: 0.35 });
    }
    layer.addEventListener('pointerdown', (e) => { e.preventDefault(); onTap(); });
    r.on('key:action', onTap);
    ready = true;
    resetBeads();
  }

  // =====================================================================
  //  4) THỞ CHÁNH NIỆM Ở VƯỜN THÁP — hít vào 4 giây, thở ra 6 giây, 5 hơi; theo giờ trò chơi
  // =====================================================================
  const BREATHS = 5, IN_SEC = 4, OUT_SEC = 6, ORB_MIN = 0.55;
  function startBreath() {
    if (busy || G.activity.current) return;
    busy = true;
    launch('thoChanhNiem', runBreath);
  }

  async function runBreath() {
    const V = E.vuonThap;
    if (!G.activity.begin('thoChanhNiem', { cam: V.cam })) { busy = false; return; }
    const r = newRun('thoChanhNiem');
    let seated = false;
    r.defer(() => { if (seated) G.player.placeAt(V.stand.x, V.stand.z, V.stand.yaw); });   // đứng dậy về chỗ cũ

    const layer = mkLayer(r, true);
    mkClose(layer, () => r.exit());
    const P = G.player;
    if (!(await goTo(r, V.stand))) return;
    const seat = V.seat || V.stand;
    P.placeAt(seat.x, seat.z, seat.yaw);
    P.pos.y = (seat.y != null ? seat.y : 0.42) + 0.07 + 0.31;      // mặt ghế đá + nửa độ hạ thân khi ngồi
    seated = true;
    P.poseParam = 0; P.setPose('sitPray');

    const badge = U.el('div', 'ac-badge', 'Hơi thở 1/' + BREATHS);
    const cap = mkCaption(layer);
    const zone = U.el('div', 'ac-bz2');
    const orb = U.el('div', 'ac-orb');
    const txt = U.el('div', 'ac-btxt'); const label = U.el('b', null, ''); const secs = U.el('span', null, ''); txt.append(label, secs);
    zone.append(orb, txt);
    const doneBtn = U.el('button', 'btn primary ac-donebtn', 'Xong'); doneBtn.type = 'button';
    doneBtn.addEventListener('click', () => { sfx('ui'); r.exit(); });
    layer.append(badge, zone, doneBtn);

    let lastS = -1, lastLeft = -1;
    const orbAt = (s, dur, k) => {
      if (s - lastS > 0.002 || lastS - s > 0.002) { lastS = s; orb.style.transform = 'scale(' + s.toFixed(3) + ')'; }
      const left = Math.max(1, Math.ceil(dur * (1 - k)));
      if (left !== lastLeft) { lastLeft = left; secs.textContent = String(left); }
    };
    orb.style.transform = 'scale(' + ORB_MIN + ')';
    sfx('bowlBell', { vol: 0.6 });
    label.textContent = 'Sẵn sàng'; cap.say('Ngồi thẳng lưng, thả lỏng đôi vai…');
    if (!(await r.sleep(2.8))) return;
    for (let c = 1; c <= BREATHS; c++) {
      badge.textContent = 'Hơi thở ' + c + '/' + BREATHS;
      label.textContent = 'Hít vào…'; lastLeft = -1;
      if (c === 1) cap.say('Hít vào thật chậm bằng mũi');
      if (!(await r.tween(IN_SEC, (e, k) => orbAt(ORB_MIN + (1 - ORB_MIN) * e, IN_SEC, k), G.ease.sine))) return;
      label.textContent = 'Thở ra…'; lastLeft = -1;
      if (c === 1) cap.say('Thở ra nhẹ nhàng, dài hơn lúc hít vào');
      if (!(await r.tween(OUT_SEC, (e, k) => orbAt(1 - (1 - ORB_MIN) * e, OUT_SEC, k), G.ease.sine))) return;
    }
    badge.textContent = 'Năm hơi thở đã xong';
    label.textContent = 'Bình an'; secs.textContent = '';
    cap.say('Bạn đã thở xong năm hơi thở. Cứ ngồi yên thêm một chút nếu muốn.');
    const x = X(); x.thoChanhNiem += 1; G.save.persist();
    sfx('bowlBell');
  }

  // =====================================================================
  //  5) LINH THÚ — lại gần mỗi loài lần đầu thì "gặp"; bảng giới thiệu 5 loài
  // =====================================================================
  const AN_R = 3.3, AN_HX = 0.95, AN_HZ = 0.65;       // bán kính gặp, nửa thân (khớp vật cản 'linhthu' ở 08-world2.js)
  function checkAnimals() {
    const L = E.linhThu, P = G.player;
    if (!L || !L.animals) return;
    const A = L.animals, found = X().animals, px = P.pos.x, pz = P.pos.z;
    for (let i = 0; i < A.length; i++) {
      const a = A[i];
      if (found[a.kind] || !SPEC[a.kind]) continue;
      let dx = Math.abs(px - a.x) - AN_HX; if (dx < 0) dx = 0;      // khoảng cách tới thân linh thú, không phải tới tâm
      let dz = Math.abs(pz - a.z) - AN_HZ; if (dz < 0) dz = 0;
      if (dx * dx + dz * dz < AN_R * AN_R) discover(a.kind);
    }
  }
  function discover(kind) {
    const sp = SPEC[kind], x = X();
    x.animals[kind] = new Date().toISOString(); G.save.persist();
    say('Linh thú: ' + sp.name + ' — trong trò chơi gợi nhắc ' + sp.mean, 4800, 'bowlBell', 0.5);
    let n = 0; for (let i = 0; i < SPECIES.length; i++) if (x.animals[SPECIES[i].kind]) n++;
    if (n === SPECIES.length) say('Bạn đã gặp đủ ' + n + ' loài linh thú trong sân.', 4200, 'chime', 0.7);
  }
  function openGallery() {
    if (G.ui.panelOpen) return;
    const found = X().animals;
    let n = 0; for (let i = 0; i < SPECIES.length; i++) if (found[SPECIES[i].kind]) n++;
    const body = U.el('div');
    body.append(
      U.el('div', 'ac-intro', 'Phỏng theo bộ 10 linh thú đá thời Lý ở chùa Phật Tích: sư tử, voi, tê giác, trâu, ngựa — mỗi loài một cặp, tạc trên bệ hoa sen và đặt đối xứng trước điện.'),
      U.el('div', 'ac-prog', 'Đã gặp ' + n + '/' + SPECIES.length + ' loài'));
    const zoo = U.el('div', 'ac-zoo');
    for (const s of SPECIES) {
      const ok = !!found[s.kind];
      const c = U.el('div', 'ac-an' + (ok ? ' on' : ''));
      const sil = U.el('div', 'ac-sil'); sil.innerHTML = SIL[s.kind];
      c.append(sil, U.el('b', null, s.name),
        U.el('p', null, ok ? 'Gợi nhắc ' + s.mean + '.' : 'Hãy đi dọc sân và lại gần để gặp.'),
        U.el('span', 'ac-tag', ok ? 'Đã gặp' : 'Chưa gặp'));
      zoo.appendChild(c);
    }
    body.append(zoo, U.el('div', 'note', 'Ý nghĩa chỉ mang tính biểu tượng; mỗi người có thể cảm nhận theo cách riêng.'));
    G.ui.panel({ title: 'Sân linh thú', body, actions: [{ label: 'Đóng', primary: true }] });
  }

  // =====================================================================
  //  6) DẤU ẤN HÀNH HƯƠNG — bước vào mỗi khu lần đầu thì nhận một dấu ấn
  // =====================================================================
  function checkSites() {
    const S = E.sites, P = G.player;
    if (!S) return;
    const px = P.pos.x, pz = P.pos.z, st = X().stamps;
    for (let i = 0; i < S.length; i++) {
      const s = S[i];
      const R = s.rects;
      if (st[s.id] || !R) continue;
      for (let k = 0; k < R.length; k++) {
        const q = R[k];
        if (px >= q[0] && px <= q[1] && pz >= q[2] && pz <= q[3]) { award(s); break; }
      }
    }
  }
  function award(s) {
    const x = X(), info = SITE_INFO[s.id];
    x.stamps[s.id] = new Date().toISOString(); G.save.persist();
    say('Dấu ấn hành hương: ' + s.name + (info ? '\n' + info.intro : ''), 5400, 'bellSoft');
    const S = E.sites; let n = 0;
    for (let i = 0; i < S.length; i++) if (x.stamps[S[i].id]) n++;
    if (n === S.length) say('Bạn đã nhận đủ ' + n + ' dấu ấn hành hương. Chúc bạn một chuyến đi bình an.', 4600, 'chime', 0.7);
  }

  // ---------- Mục trong "Sổ cầu an": dấu ấn, linh thú, số lần làm ----------
  G.bookSections = G.bookSections || [];
  G.bookSections.push((box) => {
    const d = X(), S = E.sites || [];
    box.appendChild(U.el('h3', 'ac-h', 'Dấu ấn hành hương'));
    const grid = U.el('div', 'ac-stamps');
    let got = 0;
    for (const s of S) {
      const iso = d.stamps[s.id], info = SITE_INFO[s.id];
      if (iso) got++;
      const c = U.el('div', 'ac-stamp' + (iso ? ' on' : ''));
      const seal = U.el('div', 'ac-seal'); seal.innerHTML = G.icons[(info && info.icon) || 'lotus'] || G.icons.dot;
      c.append(seal, U.el('div', 'ac-sn', s.name), U.el('div', 'ac-sd', typeof iso === 'string' ? U.dateVN(iso) : 'Chưa ghé'));
      grid.appendChild(c);
    }
    box.append(U.el('div', 'ac-sub', got ? 'Đã nhận ' + got + '/' + S.length + ' dấu ấn ở khu Phật Tích – Bút Tháp' : 'Chưa có dấu ấn nào. Hãy dạo bước qua cầu đá, lên khu Phật Tích – Bút Tháp nhé.'), grid);
    let animals = 0; for (let i = 0; i < SPECIES.length; i++) if (d.animals[SPECIES[i].kind]) animals++;
    box.appendChild(U.el('div', 'ac-prog', 'Linh thú đã gặp: ' + animals + '/' + SPECIES.length));
    const stats = U.el('div', 'ac-stats');
    for (const [val, label] of [[U.fmt(d.cuuPham), 'Lần xoay tháp Cửu phẩm'], [U.fmt(d.nhieuThap), 'Lần đi nhiễu tháp'],
      [U.fmt(d.chuoiHat), 'Lượt lần chuỗi hạt'], [U.fmt(d.thoChanhNiem), 'Lần thở chánh niệm']]) {
      const c = U.el('div', 'ac-stat'); c.append(U.el('b', null, val), U.el('span', null, label)); stats.appendChild(c);
    }
    box.appendChild(stats);
  });

  // =====================================================================
  //  MỖI KHUNG: hàm khung của phiên, tháp quay theo quán tính, hành trình nhiễu tháp,
  //  và (5 lần/giây) gặp linh thú + dấu ấn + phát thông báo đang chờ
  // =====================================================================
  let slow = 0;
  G.onUpdate((dt) => {
    for (let i = frameFns.length - 1; i >= 0; i--) {
      try { frameFns[i](dt); } catch (e) { console.error(e); if (run) run.exit(); }
    }
    updateSpin(dt);
    if (!G.started) return;
    if (quest.on) updateQuest(dt);
    slow += dt;
    if (slow >= 0.2) {
      slow = 0;
      checkSites(); checkAnimals(); flushToasts();
    }
  }, 31);

  // =====================================================================
  //  ĐĂNG KÝ ĐIỂM HOẠT ĐỘNG
  // =====================================================================
  const reg = (ok, def) => { if (ok) { try { G.poi.add(def); } catch (e) { console.error(e); } } };
  const C0 = E.cuuPham, B0 = E.baoNghiem, Q0 = E.quanAm, V0 = E.vuonThap, L0 = E.linhThu;
  reg(C0 && C0.poi, { id: 'cuu-pham', label: 'Xoay tháp Cửu phẩm', icon: 'wheel', x: C0 && C0.poi.x, z: C0 && C0.poi.z, r: C0 && C0.poi.r,
    desc: 'Đẩy toà tháp gỗ bát giác xoay quanh trục giữa, phỏng theo chùa Bút Tháp', onAction: startCuuPham });
  reg(B0 && B0.poi, { id: 'nhieu-thap', label: 'Đi nhiễu tháp', icon: 'walk', x: B0 && B0.poi.x, z: B0 && B0.poi.z, r: B0 && B0.poi.r,
    desc: 'Đi ba vòng quanh tháp đá, giữ tháp ở bên tay phải', available: () => !quest.on, onAction: startNhieu });
  reg(Q0 && Q0.poi, { id: 'quan-am', label: 'Lần chuỗi hạt', icon: 'beads', x: Q0 && Q0.poi.x, z: Q0 && Q0.poi.z, r: Q0 && Q0.poi.r,
    desc: 'Lần 21 hạt trước tượng Quan Âm, theo nhịp của riêng bạn', onAction: startChuoiHat });
  reg(V0 && V0.poi, { id: 'vuon-thap', label: 'Ngồi thở chánh niệm', icon: 'breath', x: V0 && V0.poi.x, z: V0 && V0.poi.z, r: V0 && V0.poi.r,
    desc: 'Ngồi trên ghế đá trong vườn tháp, hít vào 4 giây, thở ra 6 giây', onAction: startBreath });
  reg(L0 && L0.poi, { id: 'linh-thu', label: 'Sân linh thú', icon: 'beast', x: L0 && L0.poi.x, z: L0 && L0.poi.z, r: L0 && L0.poi.r,
    desc: 'Xem năm loài linh thú đá, phỏng theo chùa Phật Tích', onAction: openGallery });
}
