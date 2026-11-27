// =====================================================================
//  GIAO DIỆN GIỌNG NÓI (module 25): nút micro có chữ ("Bật micro để nói") nằm riêng một hàng ngay trên thanh cử chỉ, hiện bất cứ khi nào đang
//  bật đi chùa chung (2026-11-28: trước đó chỉ là một biểu tượng không chữ và ẩn hẳn ngoài nhóm riêng mã dài, nên người chơi không tìm thấy);
//  chưa nói được (phòng chung, mã nhóm ngắn, tắt nghe) thì bấm nút sẽ mở bảng "Nói chuyện bằng giọng nói" kèm nút "Tạo nhóm và gửi link mời".
//  Ngoài ra: phím V, nút "Micro đang mở · Tắt" khi đang làm hoạt động,
//  khối "giọng nói" trong Cài đặt, nút "Tắt giọng" và chữ "đang nói" trong danh sách người, dấu sóng vàng cạnh bảng tên, và mọi câu báo.
//  Động cơ (module 24, G.voice) không có chữ: nó phát 'voice:notice' kèm mã; ở đây đổi mã thành câu (G.voiceUI.TEXT) và hiện bằng G.ui.toast.
//  Chạy sau module 22 (G.chung: sự kiện 'ui:chung-settings', 'ui:chung-person', G.chung.anchor) và module 24 (G.voice).
//  Chữ của người khác chỉ vào qua textContent hoặc canvas. innerHTML chỉ dùng cho hình SVG tĩnh của chính mã này.
//  API: G.voiceUI (cuối tệp).
// =====================================================================
function installGiongNoiUI(G) {
  const { THREE, util: U, scene } = G;
  const C = G.chung, V = G.voice;
  if (!C || !V || !THREE || !U || !G.ui || !G.events || !G.save) return; // thiếu module 22 hay 24 thì không có giọng nói để điều khiển
  const clamp = U.clamp;

  // ---------- Câu chữ (đúng từng chữ theo thiết kế, mục 3) ----------
  const TEXT = { // câu báo theo mã của 'voice:notice'
    'first-open': 'Nên đeo tai nghe để mọi người không nghe thấy tiếng vọng. Nút loa và phím M chỉ tắt tiếng trò chơi, không tắt micro.',
    'alone': 'Chưa có ai khác trong nhóm. Khi có người vào, họ sẽ nghe bạn.',
    'cap': 'Đã có 6 người đang mở micro. Bạn vẫn nghe được; khi có người tắt micro thì thử lại nhé.',
    'group': 'Nhóm đang có hơn 8 người nên chưa mở được micro. Bạn vẫn nghe được.',
    'group-close': 'Nhóm đã hơn 8 người nên micro tạm tắt. Bạn vẫn nghe được.',
    'silence': 'Micro đã tự tắt vì 2 phút không nghe thấy bạn nói.',
    'ended': 'Micro bị ngắt (có thể do cuộc gọi, ứng dụng khác hoặc đổi tai nghe). Bấm micro để mở lại.',
    'code-change': 'Micro đã tắt vì bạn đổi nhóm.',
    'quiet-thien': 'Micro đã tắt vì bạn đang ngồi thiền.',
    'quiet-tung': 'Micro đã tắt vì bạn đang tụng kinh.',
    'in-app': 'Micro chưa dùng được trong trình duyệt của Zalo, Messenger, Facebook… Bấm nút ⋯ / ⋮ rồi chọn "Mở bằng trình duyệt".',
    'no-devices': 'Trình duyệt này không mở được micro. Bạn thử Safari hoặc Chrome nhé.',
    'err-NotAllowedError': 'Bạn chưa cho phép dùng micro. Bấm biểu tượng ổ khóa cạnh địa chỉ trang → Micro → Cho phép, rồi bấm micro lần nữa.',
    'err-SecurityError': 'Trang này chưa được phép dùng micro. Bạn mở trang trực tiếp bằng Safari hoặc Chrome nhé.',
    'err-NotFoundError': 'Không tìm thấy micro trên máy này.',
    'err-OverconstrainedError': 'Không tìm thấy micro trên máy này.',
    'err-NotReadableError': 'Micro đang bị ứng dụng khác dùng.',
    'err-AbortError': 'Micro đang bị ứng dụng khác dùng.',
    'err-other': 'Chưa mở được micro, bạn thử lại nhé.',
    'muted-game': 'Trò chơi đang tắt tiếng nên bạn chưa nghe được giọng nói. Bấm nút loa để bật lại.',
    'first-voice': 'Có người trong nhóm đang nói. Muốn nhỏ tiếng hoặc tắt giọng một người, mở Cài đặt.',
  };
  const IOS_DENIED = 'Bạn chưa cho phép dùng micro. Trên iPhone: bấm aA trên thanh địa chỉ → Cài đặt trang web → Micro → Cho phép.'; // thay cho TEXT['err-NotAllowedError'] trên iPhone / iPad
  const UI = { // chữ cố định của nút, danh sách và khối cài đặt (không phải câu báo)
    // nút micro, nút nổi, danh sách người
    micOff: 'Bật micro để nói', micOpening: 'Đang mở micro…', micOn: 'Micro đang bật · Tắt', // chữ trên nút micro theo trạng thái (nút luôn có chữ, ở mọi cỡ màn)
    micAria: 'Micro nói chuyện', micTitle: 'Bật/tắt micro', micKey: ' (phím V)',
    hintMic: 'Trong nhóm đã có bạn rồi. Bấm "Bật micro để nói" ở dưới màn hình để nói chuyện với nhau.', // nhắc một lần mỗi lần tải trang, khi có người cùng nhóm mà micro của mình chưa mở
    // bảng "Nói chuyện bằng giọng nói": hiện khi bấm nút micro lúc chưa nói được (phòng chung, mã nhóm ngắn, đang tắt nghe)
    needTitle: 'Nói chuyện bằng giọng nói',
    needGroup: 'Giọng nói chỉ dùng trong nhóm riêng với người bạn mời, không dùng ở phòng chung có người lạ.',
    needLong: 'Mã nhóm bạn đang dùng ngắn nên người lạ dễ đoán, vì vậy nhóm này chưa dùng được giọng nói. Những người đang ở nhóm cũ cần mở link mời mới để sang nhóm mới.',
    needSteps: 'Bấm nút dưới đây để tạo nhóm riêng và gửi link mời cho bạn bè. Khi mọi người đã vào nhóm, mỗi người bấm "Bật micro để nói" ở dưới màn hình là nói chuyện được với nhau.',
    needManual: 'Mở Cài đặt, mục "Đi chùa cùng mọi người", đặt mã nhóm dài ít nhất 10 chữ hoặc số rồi báo mã đó cho bạn bè. Khi mọi người đã vào nhóm, mỗi người bấm "Bật micro để nói" là nói chuyện được với nhau.',
    needYes: 'Tạo nhóm và gửi link mời', needLater: 'Để sau', needOk: 'Đã hiểu',
    needListen: 'Bạn đang tắt "Nghe giọng nói trong nhóm" trong Cài đặt nên chưa mở được micro.', needListenYes: 'Bật lại và mở micro',
    micNeed: 'Bấm để xem cách nói chuyện bằng giọng nói',
    pill: '🎙 Micro đang mở · Tắt', pillAria: 'Micro đang mở. Bấm để tắt micro',
    dimInApp: 'Micro chưa dùng được trong trình duyệt này', dimNoDevices: 'Trình duyệt này không mở được micro',
    dimCap: 'Đang đủ 6 người nói', dimGroup: 'Nhóm đang có hơn 8 người nên chưa mở được micro',
    mute: 'Tắt giọng', unmute: 'Nghe lại', speaking: '· đang nói', mark: '🎙', markAria: 'đang mở micro',
    // khối trong Cài đặt
    listenL: 'Nghe giọng nói trong nhóm', listenD: 'Nghe người cùng nhóm nói chuyện. Muốn nói thì bấm nút "Bật micro để nói" ở dưới màn hình.',
    quietL: 'Tự im khi ngồi thiền / tụng kinh', quietD: 'Khi bạn ngồi thiền hoặc tụng kinh, micro của bạn tự tắt; tiếng trong nhóm im hẳn khi thiền và nhỏ lại khi tụng kinh. Xong bạn bấm micro nếu muốn nói tiếp.',
    shortHint: 'Mã nhóm này ngắn nên người lạ dễ đoán. Bấm "Tạo mã nhóm mới" để dùng giọng nói.',
    // Ghi chú riêng tư (thiết kế 3.6, rev 4): chọn LÚC VẼ khối theo G.chung.relay (có danh sách máy chủ chuyển tiếp dùng được hay không); phần sau giống nhau
    noteRelay: 'Giọng nói đi thẳng giữa các máy trong nhóm; khi hai máy không nối thẳng được thì đi qua máy chủ chuyển tiếp, vẫn được mã hoá nên máy chủ không nghe được. Trò chơi không ghi âm và không lưu. Người trong nhóm vẫn có thể tự ghi âm, và lời nói không được lọc như chữ, nên chỉ nói chuyện với người bạn tin. Ai có link mời cũng vào nhóm và nghe được. Sau khi bạn cho phép micro, người cùng nhóm có thể thấy thêm địa chỉ mạng nội bộ (trong nhà) của bạn. Trẻ em nên chơi cùng người lớn. Giọng nói dùng tốt nhất khi nhóm có tối đa 8 người.',
    notePlain: 'Giọng nói đi thẳng giữa các máy trong nhóm; trò chơi không ghi âm và không lưu. Người trong nhóm vẫn có thể tự ghi âm, và lời nói không được lọc như chữ, nên chỉ nói chuyện với người bạn tin. Ai có link mời cũng vào nhóm và nghe được. Sau khi bạn cho phép micro, người cùng nhóm có thể thấy thêm địa chỉ mạng nội bộ (trong nhà) của bạn. Trẻ em nên chơi cùng người lớn. Giọng nói dùng tốt nhất khi nhóm có tối đa 8 người.',
    routeNote: 'Trên máy này chưa chỉnh được âm lượng giọng nói.',
    voiceRow: 'Âm lượng giọng nói',
  };
  const DUR = { // thời gian hiện câu báo (ms); mã không có trong bảng: 5 giây
    'first-open': 6000, 'alone': 4000, 'cap': 5000, 'group': 5000, 'group-close': 5000, 'silence': 5000, 'ended': 6000, 'code-change': 4000,
    'quiet-thien': 4000, 'quiet-tung': 4000, 'in-app': 6000, 'no-devices': 6000, 'err-NotAllowedError': 6000, 'err-SecurityError': 6000,
    'err-NotFoundError': 6000, 'err-OverconstrainedError': 6000, 'err-NotReadableError': 6000, 'err-AbortError': 6000, 'err-other': 6000,
    'muted-game': 5000, 'first-voice': 5000,
  };
  function textFor(code, extra) { // 'err-NotAllowedError' có hai câu: iPhone / iPad và máy khác
    if (code === 'err-NotAllowedError') return C.ios ? IOS_DENIED : TEXT['err-NotAllowedError'];
    return Object.prototype.hasOwnProperty.call(TEXT, code) && typeof TEXT[code] === 'string' ? TEXT[code] : '';
  }
  const durFor = (code) => (Object.prototype.hasOwnProperty.call(DUR, code) ? DUR[code] : 5000);
  G.events.on('voice:notice', (code, extra) => {
    const t = textFor(code, extra);
    if (t) G.ui.toast(t, durFor(code));
  });

  const tutOpen = () => { const t = document.getElementById('tut'); return !!t && !t.classList.contains('hidden'); };
  const pathB = () => V.route === 'element' || (!!G.started && !!G.audio && typeof G.audio.voiceIn === 'function' && !G.audio.voiceIn()); // Path B: người chơi chọn, hoặc âm thanh của trò chơi không khởi tạo được

  // ---------- Kiểu dáng ----------
  G.ui.addStyle(`
  /* Nút micro: một viên dài CÓ CHỮ nằm riêng một hàng ngay trên thanh cử chỉ, giữa màn hình (neo vào #chungBar nên đi theo thanh ở mọi vị trí và ẩn cùng thanh). */
  #chungMic{position:absolute;left:0;right:0;bottom:calc(100% + 8px);margin:0 auto;width:max-content;max-width:calc(100vw - 24px);height:44px;padding:0 16px 0 12px;gap:8px;border-radius:22px;border:2px solid var(--gold2);font-size:14.5px;font-weight:700}
  #chungMic .l{display:inline}
  /* ô nói (module 22) nhường chỗ cho hàng micro: cao thêm 52px ở cả ba vị trí của nó */
  #chungChat{bottom:calc(156px + var(--sb))}
  body.touch #chungChat{bottom:calc(266px + var(--sb))}
  body:not(.touch) #actionBtn.show ~ #chungChat{bottom:calc(222px + var(--sb))}
  #chungMic.dim{opacity:.5}
  #chungMic[aria-busy="true"]{opacity:.65}
  #chungMic.on{background:linear-gradient(180deg,#f6cf7c,#e0a344);border-color:#fff0c8;color:var(--ink);box-shadow:0 0 0 calc(2px + var(--lv,0) * 9px) rgba(247,215,147,.55),var(--shadow)}
  #chungMic.on svg{stroke:var(--ink)}
  @media (max-width:359px){#chungBar{gap:4px}} /* 320px: sáu nút vừa khít, chừa lề hai bên */
  #voicePill{position:fixed;z-index:45;top:calc(10px + var(--st));right:calc(64px + var(--sr));height:40px;max-width:calc(100vw - 76px - var(--sr));padding:0 14px;border-radius:20px;border:2px solid #fff3cf;
    background:linear-gradient(180deg,#f6cf7c,#e0a344);color:var(--ink);font-size:13.5px;font-weight:800;white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center}
  #voicePill:active{transform:scale(.96)}
  @media (max-width:560px){#voicePill{font-size:12.5px;padding:0 10px}body.voice-pill-on .brand{visibility:hidden}} /* hàng trên cùng chật: nút nổi che tên chùa nên tạm giấu tên */
  .voice-block .snd-h{margin-top:10px}
  .voice-short{margin-top:10px}
  .chung-person.vg{flex-wrap:wrap} /* màn hẹp: hai nút xuống dòng dưới tên thay vì ép tên còn vài chữ */
  .chung-who{display:flex;align-items:center;gap:6px;min-width:0;flex:1 1 110px}
  .chung-acts{display:flex;align-items:center;gap:6px;flex:none;margin-left:auto}
  .chung-acts .chip{padding:8px 10px}
  .voice-mark{flex:none;font-size:14px}
  .voice-speaking{flex:none;color:var(--gold2);font-size:12.5px;white-space:nowrap}
  .voice-speaking:empty{display:none}
  .voice-route-note{margin:0 0 6px}
  `);

  // ---------- Nút micro trong thanh dưới (#chungBar), đứng trước nút "Nói" ----------
  const SVG_MIC = '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><path d="M12 18v3"/><path d="M9 21h6"/></svg>';
  const bar = document.getElementById('chungBar'), talk = document.getElementById('chungTalk');
  const mic = U.el('button', 'ibtn chung-g chung-mic hidden'); mic.type = 'button'; mic.id = 'chungMic';
  const micL = U.el('span', 'l', UI.micOff);
  mic.innerHTML = SVG_MIC; mic.appendChild(micL);
  mic.setAttribute('aria-label', UI.micAria); mic.setAttribute('aria-pressed', 'false'); mic.setAttribute('aria-busy', 'false');
  const micTitle = UI.micTitle + (G.isTouch ? '' : UI.micKey);
  mic.title = micTitle;
  if (bar) bar.insertBefore(mic, talk && talk.parentNode === bar ? talk : null);
  const DIM = { 'in-app': UI.dimInApp, 'no-devices': UI.dimNoDevices, 'cap': UI.dimCap, 'group': UI.dimGroup }; // bốn lý do làm nút mờ (nút vẫn hiện và bấm được: bấm để biết lý do)
  function paintMic() { // nút hiện bất cứ khi nào đang bật đi chùa chung (thanh #chungBar tự ẩn khi chưa vào phòng); chưa nói được thì bấm vào sẽ có bảng chỉ cách
    const show = C.on, st = V.state, why = V.blockReason;
    mic.classList.toggle('hidden', !show);
    const dim = show && st === 'off' && Object.prototype.hasOwnProperty.call(DIM, why);
    mic.classList.toggle('dim', dim);
    mic.classList.toggle('on', st === 'open');
    mic.setAttribute('aria-pressed', String(st === 'open'));
    mic.setAttribute('aria-busy', String(st === 'opening'));
    const label = st === 'open' ? UI.micOn : st === 'opening' ? UI.micOpening : UI.micOff;
    if (micL.textContent !== label) micL.textContent = label;
    const title = dim ? DIM[why] : !V.available ? UI.micNeed : micTitle;
    if (mic.title !== title) mic.title = title;
    mic.dataset.reason = why;
  }
  // Bảng "Nói chuyện bằng giọng nói": vì sao chưa nói được và một nút làm giúp phần còn lại. true = đã mở bảng.
  function explain(why) {
    if (G.ui.panelOpen || tutOpen() || G.activity.current) return false;
    const L = G.loiMoi, canMake = !!(L && L.canMake && typeof L.createGroup === 'function' && typeof L.share === 'function');
    const body = U.el('div', 'col');
    let actions;
    if (why === 'switch-off') {
      body.appendChild(U.el('div', null, UI.needListen));
      actions = [{ label: UI.needListenYes, primary: true, onClick: (close) => {
        close(); C.setVoiceCfg({ voice: true }); // vẫn trong cú chạm: mở micro luôn
        if (V.available && V.state === 'off') Promise.resolve(V.openMic()).catch(() => { /* module 24 tự ghi lỗi */ });
      } }, { label: UI.needLater }];
    } else if (why === 'public' || why === 'short-code') {
      body.appendChild(U.el('div', null, why === 'public' ? UI.needGroup : UI.needLong));
      body.appendChild(U.el('div', 'small muted', canMake ? UI.needSteps : UI.needManual));
      actions = canMake
        ? [{ label: UI.needYes, primary: true, onClick: (close) => { close(); L.createGroup((code) => { Promise.resolve(L.share(code)).catch(() => { /* bỏ qua */ }); }); } }, { label: UI.needLater }]
        : [{ label: UI.needOk, primary: true }];
    } else return false;
    G.ui.panel({ title: UI.needTitle, body, actions });
    return true;
  }
  function toggle() { // bật khi đang tắt, tắt khi đang mở, bỏ qua khi đang mở dở; chưa nói được (phòng chung, mã ngắn, tắt nghe) thì mở bảng chỉ cách. true = đã mở bảng
    if (V.state === 'open') Promise.resolve(V.closeMic('')).catch(() => { /* module 24 tự ghi lỗi */ });
    else if (V.state === 'off') {
      if (!V.available) return explain(V.blockReason);
      Promise.resolve(V.openMic()).catch(() => { /* module 24 tự ghi lỗi */ });
    }
    return false;
  }
  mic.onclick = () => {
    const panel = toggle(); // phải gọi ngay trong cú chạm: iOS chỉ cho AudioContext và micro bắt đầu từ đây
    mic.blur();
    if (!panel) { const cv = document.getElementById('c'); if (cv) cv.focus({ preventScroll: true }); } // Space / Enter (phím hành động của lõi) không bấm lại nút này
  };

  // ---------- Phím V ----------
  window.addEventListener('keydown', (e) => { // cùng hàng rào với phím cử chỉ 1 / 2 / 3
    if (e.code !== 'KeyV' || e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.isComposing || !G.started || G.ui.panelOpen || tutOpen()) return;
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable)) return;
    if (!V.available) return; // nút micro không hiện thì phím V cũng không làm gì
    if (G.activity.current) { if (V.state === 'open') { e.preventDefault(); toggle(); } return; } // đang làm hoạt động: V chỉ để tắt, không bao giờ để bật
    e.preventDefault();
    toggle();
  });

  // ---------- Nút nổi "Micro đang mở · Tắt": khi đang làm hoạt động thì thanh dưới ẩn, micro đang mở vẫn phải có chỗ tắt ----------
  const pill = U.el('button', 'hidden', UI.pill); pill.type = 'button'; pill.id = 'voicePill'; pill.setAttribute('aria-label', UI.pillAria);
  document.body.appendChild(pill);
  function paintPill() {
    const show = !!G.activity.current && V.state === 'open';
    pill.classList.toggle('hidden', !show);
    document.body.classList.toggle('voice-pill-on', show);
  }
  pill.onclick = () => { Promise.resolve(V.closeMic('')).catch(() => { /* module 24 tự ghi lỗi */ }); pill.classList.add('hidden'); document.body.classList.remove('voice-pill-on'); };

  // ---------- Khối "giọng nói" trong Cài đặt (nằm trong .chung-more, nên chỉ thấy khi đã bật "Đi chùa cùng mọi người") ----------
  function mkSwitchRow(id, label, desc) {
    const head = U.el('div', 'snd-h'), txt = U.el('div', 'snd-t');
    txt.append(U.el('div', 'snd-l', label), U.el('div', 'small muted', desc));
    const sw = U.el('button', 'snd-sw'); sw.type = 'button'; sw.id = id; sw.setAttribute('role', 'switch'); sw.setAttribute('aria-label', label);
    head.append(txt, sw);
    return { head, sw };
  }
  G.events.on('ui:chung-settings', (o) => {
    const more = o && o.more;
    if (!more || !more.appendChild) return;
    const box = U.el('div', 'voice-block hidden'); box.id = 'voiceBlock';
    const hint = U.el('div', 'chung-adv voice-short hidden', UI.shortHint); hint.id = 'voiceShortHint';
    const rListen = mkSwitchRow('voiceListen', UI.listenL, UI.listenD), rQuiet = mkSwitchRow('voiceQuietSw', UI.quietL, UI.quietD);
    const note = U.el('div', 'note'); note.id = 'voiceNote'; note.style.marginTop = '8px';
    box.append(hint, rListen.head, rQuiet.head, note);
    more.appendChild(box);
    const paint = () => {
      const code = C.code, ok = C.voiceEligible, cfg = C.voiceCfg;
      box.classList.toggle('hidden', !code); // không có mã = phòng chung: không có giọng nói
      note.textContent = C.relay === true ? UI.noteRelay : UI.notePlain; // câu về máy chủ chuyển tiếp chỉ khi trò chơi thật sự có danh sách dùng được
      hint.classList.toggle('hidden', !(code && !ok));
      for (const el of [rListen.head, rQuiet.head, note]) el.classList.toggle('hidden', !ok);
      for (const [sw, on] of [[rListen.sw, cfg.voice], [rQuiet.sw, cfg.voiceQuiet]]) { sw.classList.toggle('on', on); sw.setAttribute('aria-checked', String(on)); }
    };
    rListen.sw.onclick = () => { G.audio?.play?.('ui'); C.setVoiceCfg({ voice: !C.voiceCfg.voice }); paint(); };
    rQuiet.sw.onclick = () => { G.audio?.play?.('ui'); C.setVoiceCfg({ voiceQuiet: !C.voiceCfg.voiceQuiet }); paint(); };
    const off1 = G.events.on('chung:change', () => { if (!box.isConnected) { off1(); return; } paint(); });
    const off2 = G.events.on('voice:change', () => { if (!box.isConnected) { off2(); return; } paint(); });
    paint();
  });

  // ghi chú dưới thanh trượt "Âm lượng giọng nói" khi máy này phát giọng qua phần tử <audio> (Path B): thanh trượt không chỉnh được
  G.events.on('ui:settings', (box) => {
    if (!box || !box.querySelectorAll) return;
    let row = null;
    for (const r of box.querySelectorAll('.snd-row')) { const l = r.querySelector('.snd-l'); if (l && l.textContent === UI.voiceRow) row = r; }
    if (!row) return;
    const note = U.el('div', 'small muted voice-route-note hidden', UI.routeNote); note.id = 'voiceRouteNote';
    row.appendChild(note);
    const paint = () => note.classList.toggle('hidden', !pathB());
    paint();
    const off = G.events.on('voice:change', paint);
    const tick = setInterval(() => { if (!note.isConnected) { clearInterval(tick); off(); return; } paint(); }, 1000); // đổi V.route không có sự kiện riêng
  });

  // ---------- Danh sách người: "Tắt giọng" / "Nghe lại", dấu 🎙 khi mở micro, chữ "· đang nói" (cập nhật 15 lần/giây) ----------
  const people = new Map(); // id → { peer, speak }: hàng hiện có, thay mỗi lần module 22 dựng lại hàng, bỏ khi hàng rời khỏi trang
  let peopleT = 0;
  function tickPeople() {
    for (const [id, r] of people) {
      if (!r.speak.isConnected) { people.delete(id); continue; }
      const lv = V.levels.get(id);
      const t = lv && lv.raw > V.SPEAK_RMS ? UI.speaking : '';
      if (r.speak.textContent !== t) r.speak.textContent = t;
    }
    if (!people.size) { clearInterval(peopleT); peopleT = 0; }
  }
  G.events.on('ui:chung-person', (o) => {
    const p = o && o.peer, row = o && o.row;
    if (!p || !row || !C.code || !C.voiceEligible) return; // chỉ trong nhóm riêng đủ dài
    const nameEl = row.firstElementChild, hideBtn = row.querySelector('button.chip');
    if (!nameEl || !hideBtn) return;
    row.classList.add('vg');
    const who = U.el('span', 'chung-who');
    row.insertBefore(who, nameEl); who.appendChild(nameEl);
    if (p.vo & 2) { const m = U.el('span', 'voice-mark', UI.mark); m.setAttribute('role', 'img'); m.setAttribute('aria-label', UI.markAria); who.appendChild(m); }
    const speak = U.el('span', 'voice-speaking'); who.appendChild(speak);
    const acts = U.el('span', 'chung-acts');
    const muted = V.isMuted(p.id);
    const chip = U.el('button', 'chip voice-mute', muted ? UI.unmute : UI.mute); chip.type = 'button'; chip.setAttribute('aria-pressed', String(muted));
    chip.onclick = () => { G.audio?.play?.('ui'); V.mutePeer(p.id, !V.isMuted(p.id)); }; // mutePeer làm danh sách dựng lại nên nút đổi chữ
    row.insertBefore(acts, hideBtn); acts.append(hideBtn, chip); // "Ẩn người này" giữ vị trí đầu như trước (người dùng quen tay, các bộ kiểm cũ chọn nút đầu tiên)
    people.set(p.id, { peer: p, speak });
    if (!peopleT) peopleT = setInterval(tickPeople, 1000 / 15);
  });

  // ---------- Dấu sóng vàng cạnh bảng tên người đang nói (trong thế giới 3D) ----------
  const MAX_SHOW = C.MAX_SHOW || 16;
  const SPR = 0.22, GAP = 0.14, LV_LO = 0.01, LV_HI = 0.04, MUTED_K = 0.35; // cỡ (m), khoảng cách tới mép bảng tên (m), mức nghe → độ rõ, hệ số mờ khi bị tắt giọng
  const level01 = (h) => clamp((h - LV_LO) / (LV_HI - LV_LO), 0, 1);
  const sprites = new Array(MAX_SHOW).fill(null); // cùng chỉ số với ô vẽ của module 22: người có ô mới có dấu
  let tex = null;
  function drawWave() { // vẽ một lần: nền tròn tối và ba cung sóng vàng
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const g = cv.getContext('2d');
    g.fillStyle = 'rgba(42,24,14,0.82)'; g.beginPath(); g.arc(64, 64, 60, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#f7d793'; g.fillStyle = '#f7d793'; g.lineWidth = 8; g.lineCap = 'round';
    g.beginPath(); g.arc(38, 64, 6, 0, Math.PI * 2); g.fill();
    for (let i = 1; i <= 3; i++) { g.beginPath(); g.arc(38, 64, 12 + i * 13, -0.75, 0.75); g.stroke(); }
    return cv;
  }
  function spriteFor(slot) {
    let s = sprites[slot];
    if (s) return s;
    if (!tex) { tex = new THREE.CanvasTexture(drawWave()); tex.colorSpace = THREE.SRGBColorSpace; }
    s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 })); // mỗi dấu một vật liệu riêng (độ rõ riêng), chung một ảnh
    s.scale.set(SPR, SPR, 1); s.renderOrder = 6; s.visible = false; s.name = 'giong:song'; s.userData.stamp = -1;
    scene.add(s); sprites[slot] = s;
    return s;
  }
  const _r = new THREE.Vector3();
  let frameNo = 0, ringAcc = 0, ringV = 0, anyShown = false;
  function updateSprites() {
    frameNo++;
    if (!V.levels.size && !anyShown) return;
    const list = C.list;
    let rightDone = false;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      if (p.slot < 0 || p.slot >= MAX_SHOW) continue;
      const lv = V.levels.get(p.id);
      if (!lv) continue;
      const a = C.anchor(p);
      if (!a || a.k < 0.02) continue; // mờ, bị ẩn, nằm trong nêm máy quay hay quá xa: không có dấu
      const muted = V.isMuted(p.id);
      const op = (muted ? level01(lv.raw) * MUTED_K : level01(lv.heard)) * a.k; // người bị mình tắt giọng vẫn nói: dấu mờ
      if (op < 0.02) continue;
      if (!rightDone) { _r.setFromMatrixColumn(G.camera.matrixWorld, 0); rightDone = true; }
      const s = spriteFor(p.slot), off = a.half + GAP;
      s.position.set(a.x - _r.x * off, a.y - _r.y * off, a.z - _r.z * off); // tâm bảng tên + hướng phải của máy quay × −(nửa bề ngang + 0,14 m)
      s.material.opacity = op; s.material.color.setHex(muted ? 0xb9ab97 : 0xffffff);
      s.userData.stamp = frameNo; s.visible = true;
    }
    anyShown = false;
    for (let i = 0; i < MAX_SHOW; i++) {
      const s = sprites[i];
      if (!s || !s.visible) continue;
      if (s.userData.stamp !== frameNo) s.visible = false; else anyShown = true;
    }
  }
  function updateRing(dt) { // vòng sáng quanh nút micro theo mức giọng của chính mình, 15 lần/giây
    ringAcc += dt;
    if (ringAcc < 1 / 15) return;
    ringAcc = 0;
    const v = V.state === 'open' ? Math.min(1, V.ownLevel / 0.12) : 0;
    if (Math.abs(v - ringV) < 0.02 && !(v === 0 && ringV !== 0)) return;
    ringV = v; mic.style.setProperty('--lv', v.toFixed(2));
  }
  let hintAcc = 0, hintDone = false;
  function updateHint(dt) { // một lần mỗi lần tải trang: nhóm đã có người mà micro của mình chưa mở thì chỉ chỗ nút micro (xem mỗi giây)
    if (hintDone) return;
    hintAcc += dt;
    if (hintAcc < 1) return;
    hintAcc = 0;
    if (V.state !== 'off') { hintDone = true; return; } // đã tự tìm thấy nút
    if (!G.started || !V.available || V.blockReason || G.activity.current || G.ui.panelOpen || tutOpen()) return;
    const l = C.list;
    for (let i = 0; i < l.length; i++) if (C.isLive(l[i]) && !C.isHidden(l[i].id)) { hintDone = true; G.ui.toast(UI.hintMic, 7000); return; }
  }
  G.onUpdate((dt) => { updateSprites(); updateRing(dt); updateHint(dt); }, 23); // sau lúc module 22 (thứ tự 22) ghi vị trí người

  // ---------- Vẽ lại theo trạng thái ----------
  function paintAll() { paintMic(); paintPill(); }
  for (const ev of ['voice:state', 'voice:change', 'chung:change', 'sound:change', 'activity:start', 'activity:end', 'enter']) G.events.on(ev, paintAll);
  paintAll();

  // =====================================================================
  //  API CÔNG KHAI (G.voiceUI) — cũng dùng để kiểm tra headless
  // =====================================================================
  G.voiceUI = { TEXT, IOS_DENIED, DUR, textFor, durFor };
}
