// =====================================================================
//  LỜI MỜI VÀO NHÓM (module 23): mã nhóm ngẫu nhiên, link mời, bảng "Lời mời vào nhóm".
//  Chạy sau module 22 (đi chùa chung) và dùng API G.chung của nó: setCode, enable, cleanCode, isLive, inApp, IN_APP_TIP và sự kiện 'ui:chung-settings'.
//  - "Tạo mã nhóm mới": 3 nhóm × 4 ký tự từ bảng 31 ký tự (bỏ i, l, o, 0, 1), lấy bằng crypto.getRandomValues có loại mẫu lệch (byte ≥ 248 bị bỏ).
//    Chưa bật "Đi chùa cùng mọi người" thì đặt mã TRƯỚC rồi mới bật: người chơi không bao giờ đi qua phòng chung có người lạ.
//    Đang giữ phòng mặc định (có lời mời chưa trả lời) thì nút này còn kết thúc việc giữ bằng G.chung.releaseDefault(): vào thẳng nhóm mới, đúng một lần connect().
//  - "Gửi link mời": navigator.share (địa chỉ nằm trong text), rồi chép vào bộ nhớ tạm, cuối cùng là ô chữ chọn sẵn.
//  - Link mời có dạng <trang>#nhom=<mã>. Đọc lúc cài đặt, giữ nguyên cho tới khi người chơi trả lời bảng (trình duyệt nhúng thì không bao giờ gỡ,
//    để "Mở bằng trình duyệt" mang lời mời sang). Bảng hiện nhiều nhất một lần mỗi lần tải trang, không bao giờ đè lên bảng khác, hoạt động hay hướng dẫn.
//  - Đi chùa chung BẬT mặc định: link mời có mã khác mã đang lưu thì lúc cài đặt gọi G.chung.holdDefault(), để người được mời không đi qua phòng chung lúc vào chùa
//    và qua hướng dẫn. Mọi cách trả lời bảng (Vào nhóm, Để sau, ✕, Escape, chạm nền) kết thúc bằng G.chung.releaseDefault(): nối phòng theo cài đặt đã lưu nếu chưa vào phòng nào.
//    Dòng "Bạn sẽ rời …" của bảng chỉ hiện khi có gì để rời: nhóm đã lưu (mã khác rỗng) hay phòng chung đang ở; đang giữ mà chưa vào phòng nào thì không có dòng đó.
//  Mã nhóm là chìa khoá: ai có link đều vào được. Module này không lưu gì ngoài việc đặt mã qua G.chung.setCode (module 22 tự lưu).
//  API: G.loiMoi (cuối tệp).
// =====================================================================
function installLoiMoi(G) {
  const { util: U } = G;
  const C = G.chung;
  if (!C || !U || !G.ui || !G.events || !G.save || !G.activity) return; // thiếu module 22 thì không có nhóm nào để mời vào

  // ---------- Hằng số ----------
  const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'; // 31 ký tự, bỏ i, l, o, 0, 1 vì dễ nhầm khi đọc cho nhau nghe
  const GROUPS = 3, PER = 4;                           // 3 nhóm × 4 ký tự = 12 ký tự ≈ 59 bit
  const BYTE_LIMIT = Math.floor(256 / ALPHABET.length) * ALPHABET.length; // 248: byte ≥ 248 bị bỏ, nên byte % 31 chia đều cho 31 ký tự
  const LINK_MIN = 10, LINK_MAX = 24;                  // số chữ hoặc số (không tính dấu gạch) của mã trong link mời; 10 cũng là mức tối thiểu để có giọng nói
  const POLL_MS = 500, EARLIEST_MS = 3600;             // hỏi mỗi 500 ms; không hiện bảng sớm hơn 3,6 giây sau 'enter' (lời chào và hướng dẫn hiện lúc 3,3 giây)

  // ---------- Câu chữ (đúng từng chữ theo thiết kế, mục 3.1) ----------
  const TEXT = {
    newCode: 'Tạo mã nhóm mới',
    invite: 'Gửi link mời',
    shareTitle: 'Lên Chùa Cầu An',
    shareText: 'Mời bạn cùng đi chùa trong nhóm của mình: ',
    copied: 'Đã chép link mời. Dán vào Zalo hoặc Messenger để gửi cho bạn bè.',
    fieldLabel: 'Chép link này để gửi cho bạn bè:',
    fieldPanel: 'Link mời vào nhóm',
    done: 'Xong',
    created: 'Đã tạo mã nhóm mới. Bấm "Gửi link mời" để mời bạn bè.',
    confirmTitle: 'Tạo nhóm mới?',
    confirmBody: 'Bạn sẽ rời nhóm hiện tại và sang một nhóm mới chỉ có mình bạn. Những người đang cùng nhóm vẫn ở lại nhóm cũ.',
    confirmYes: 'Tạo nhóm mới',
    confirmNo: 'Thôi',
    bad: 'Link mời này không dùng được. Bạn nhờ người gửi tạo link mới nhé.',
    same: 'Bạn đang ở nhóm này rồi.',
    panelTitle: 'Lời mời vào nhóm',
    line2: 'Khi vào nhóm, trò chơi bật "Đi chùa cùng mọi người": tên, vị trí, việc bạn đang làm và lời bạn gõ được gửi tới những người trong nhóm. Giọng nói chỉ gửi đi khi bạn tự bấm mở micro.',
    leaveGroup: 'Bạn sẽ rời nhóm hiện tại.',
    leavePublic: 'Bạn sẽ rời phòng chung.',
    join: 'Vào nhóm',
    later: 'Để sau',
    laterToast: 'Muốn vào nhóm sau, bạn mở lại link mời nhé.',
  };
  const line1 = (code) => 'Bạn được mời vào nhóm riêng "' + code + '". Chỉ vào nếu bạn biết người gửi lời mời.';
  const joinedToast = (code) => 'Đã vào nhóm "' + code + '".';

  const alnum = (s) => String(s == null ? '' : s).replace(/[^a-z0-9]/gi, '').length; // chỉ đếm chữ và số
  const canMake = () => typeof crypto !== 'undefined' && !!crypto && typeof crypto.getRandomValues === 'function';
  const shareable = (code) => alnum(code) >= LINK_MIN; // mã ngắn gõ tay không đi qua được link mời (người nhận bị từ chối ở bước đọc link)

  // ---------- Mã nhóm ngẫu nhiên và link ----------
  function makeCode() { // '' khi thiết bị không có crypto.getRandomValues (nút ẩn, và chỗ gọi không bao giờ đặt mã rỗng vì mã rỗng là phòng chung)
    if (!canMake()) return '';
    const need = GROUPS * PER, out = [], buf = new Uint8Array(32);
    while (out.length < need) {
      crypto.getRandomValues(buf);
      for (let i = 0; i < buf.length && out.length < need; i++) if (buf[i] < BYTE_LIMIT) out.push(ALPHABET[buf[i] % ALPHABET.length]);
    }
    const parts = [];
    for (let g = 0; g < GROUPS; g++) parts.push(out.slice(g * PER, (g + 1) * PER).join(''));
    return parts.join('-');
  }
  const linkFor = (code) => location.href.split(/[?#]/)[0] + '#nhom=' + code;

  // { code } hợp lệ, { bad: true } có khoá nhom nhưng không dùng được, null khi không có khoá nhom
  function parseHash(hash) {
    try {
      const v = new URLSearchParams(String(hash == null ? '' : hash).replace(/^#/, '')).get('nhom');
      if (v === null) return null;
      const m = /^[A-Za-z0-9-]+/.exec(v.replace(/^\s+/, '')); // đoạn đầu gồm chữ, số, gạch: bỏ phần các ứng dụng chat nối thêm (?zarsrc=…, khoảng trắng, …)
      const n = m ? alnum(m[0]) : 0;
      if (n < LINK_MIN || n > LINK_MAX) return { bad: true };
      const code = C.cleanCode(m[0]);
      return alnum(code) >= LINK_MIN ? { code } : { bad: true }; // cleanCode cắt ở 24 ký tự: dãy gạch quá dài có thể làm mất chữ
    } catch (e) { return null; }
  }

  // ---------- Link mời đang chờ trả lời (đọc một lần lúc cài đặt) ----------
  let hashInfo = null;
  try { hashInfo = parseHash(location.hash); } catch (e) { hashInfo = null; }
  let pendingCode = hashInfo && hashInfo.code ? hashInfo.code : null;
  let badLink = !!(hashInfo && hashInfo.bad);
  if (pendingCode && pendingCode !== C.code) C.holdDefault(); // link hỏng hay cùng mã đang lưu thì không giữ: đi chùa chung vào phòng như thường
  function clearHash() { // trình duyệt nhúng: không bao giờ gỡ, để "Mở bằng trình duyệt" mang lời mời sang
    if (!hashInfo || C.inApp) return;
    try { history.replaceState(history.state, '', location.pathname + location.search); } catch (e) { /* bỏ qua */ }
  }

  // ---------- Ô chữ chứa link (chỗ cuối cùng khi không chia sẻ và không chép được) ----------
  function makeFieldBox() {
    const box = U.el('div', 'invite-field hidden');
    const lab = U.el('label', 'small muted', TEXT.fieldLabel);
    const field = document.createElement('input');
    field.id = 'inviteField'; field.className = 'field'; field.readOnly = true; field.spellcheck = false; field.autocomplete = 'off';
    lab.htmlFor = 'inviteField';
    box.append(lab, field);
    const select = () => { try { field.focus({ preventScroll: true }); field.select(); field.setSelectionRange(0, field.value.length); } catch (e) { /* bỏ qua */ } };
    return {
      box, field, forCode: '',
      show(link, code) { this.forCode = code; field.value = link; box.classList.remove('hidden'); select(); },
      hide() { this.forCode = ''; box.classList.add('hidden'); },
    };
  }
  let live = null; // hàng mời đang có trong bảng Cài đặt (null khi chưa mở bảng)
  function showField(link, code) {
    if (live && live.row.isConnected) { live.fb.show(link, code); return; }
    const fb = makeFieldBox(); // gọi share() khi bảng Cài đặt không mở: mở một bảng nhỏ chứa ô link
    G.ui.panel({ title: TEXT.fieldPanel, body: fb.box, actions: [{ label: TEXT.done, primary: true }] });
    fb.show(link, code);
  }

  // "Gửi link mời": 'shared' | 'copied' | 'field' | 'cancel'
  async function share(code) {
    code = C.cleanCode(code == null ? C.code : code);
    if (!code) return 'cancel';
    const link = linkFor(code);
    if (typeof navigator.share === 'function') { // gọi ngay trong cú chạm của người dùng (chưa có await nào đứng trước)
      try { await navigator.share({ title: TEXT.shareTitle, text: TEXT.shareText + link }); return 'shared'; } // địa chỉ chỉ nằm trong text: không ứng dụng nào bỏ mất hay lặp lại nó
      catch (e) { if (e && e.name === 'AbortError') return 'cancel'; } // người chơi tự đóng khung chia sẻ: không làm gì thêm
    }
    try { await navigator.clipboard.writeText(link); G.ui.toast(TEXT.copied, 5000); return 'copied'; }
    catch (e) { showField(link, code); return 'field'; }
  }

  // ---------- "Tạo mã nhóm mới" ----------
  function createGroup() {
    if (!canMake()) return;
    const go = () => {
      const code = makeCode();
      if (!code) return; // không bao giờ đặt mã rỗng: đó là phòng chung
      C.setCode(code);
      if (!C.on) C.enable(true); // đặt mã trước rồi mới bật: không qua phòng chung
      C.releaseDefault(); // đang giữ phòng mặc định (lời mời chưa trả lời): vào thẳng nhóm mới bằng một lần connect(); không giữ thì không làm gì
      G.ui.toast(TEXT.created, 6000);
    };
    if (C.list.some((p) => C.isLive(p))) {
      G.ui.panel({
        title: TEXT.confirmTitle, body: U.el('div', null, TEXT.confirmBody),
        actions: [{ label: TEXT.confirmYes, primary: true, onClick: (close) => { close(); go(); } }, { label: TEXT.confirmNo }],
      });
    } else go();
  }

  // ---------- Hàng mời trong bảng Cài đặt, ngay dưới công tắc "Đi chùa cùng mọi người" (ngoài .chung-more nên luôn hiện) ----------
  G.ui.addStyle(`
  #inviteRow{margin:8px 0 6px}
  .invite-btns{display:flex;gap:8px;flex-wrap:wrap}
  .invite-btns .btn{flex:1 1 150px;min-height:44px;font-size:15px;padding:8px 12px}
  .invite-field{display:flex;flex-direction:column;gap:4px;margin-top:8px}
  .invite-field .field{font-size:14px;padding:10px 12px}
  `);
  G.events.on('ui:chung-settings', (o) => {
    const block = o && o.block;
    if (!block || !block.insertBefore) return;
    const row = U.el('div'); row.id = 'inviteRow';
    const btns = U.el('div', 'invite-btns');
    const bNew = U.el('button', 'btn', TEXT.newCode); bNew.type = 'button'; bNew.id = 'btnNewCode';
    const bInv = U.el('button', 'btn', TEXT.invite); bInv.type = 'button'; bInv.id = 'btnInvite';
    btns.append(bNew, bInv);
    const fb = makeFieldBox();
    row.append(btns, fb.box);
    const head = block.querySelector('.snd-h'); // hàng công tắc
    block.insertBefore(row, head && head.parentNode === block ? head.nextSibling : block.firstChild);
    bNew.onclick = () => { G.audio?.play?.('ui'); createGroup(); };
    bInv.onclick = () => { G.audio?.play?.('ui'); share(C.code); };
    const paint = () => {
      const code = C.code;
      bNew.classList.toggle('hidden', !canMake());
      bInv.classList.toggle('hidden', !shareable(code));
      btns.classList.toggle('hidden', !canMake() && !shareable(code));
      if (fb.forCode && fb.forCode !== code) fb.hide(); // mã đã đổi: link cũ trong ô không còn đúng
      const inp = block.querySelector('#chungCode'); // ô mã của module 22 chỉ cập nhật khi người chơi tự gõ: nối nó với mã vừa tạo hay vừa nhận
      if (inp && document.activeElement !== inp && inp.value !== code) inp.value = code;
    };
    live = { row, fb };
    paint();
    const off = G.events.on('chung:change', () => { if (!row.isConnected) { off(); return; } paint(); });
  });

  // ---------- Bảng "Lời mời vào nhóm" ----------
  function joinGroup(code) {
    C.setCode(code);
    if (!C.on) C.enable(true);
    G.ui.toast(joinedToast(code), 4000);
  }
  function openInvite(code) {
    let joined = false;
    const body = U.el('div', 'col');
    body.appendChild(U.el('div', null, line1(code)));
    body.appendChild(U.el('div', 'small muted', TEXT.line2));
    if (C.on) { // dòng "rời": chỉ khi có gì để rời (nhóm đã lưu, hay phòng chung đang ở); đang giữ phòng mặc định mà chưa vào phòng nào thì không có dòng này
      if (C.code) body.appendChild(U.el('div', 'small', TEXT.leaveGroup));
      else if (C.room) body.appendChild(U.el('div', 'small', TEXT.leavePublic));
    }
    if (C.inApp) body.appendChild(U.el('div', 'small', C.IN_APP_TIP));
    G.ui.panel({
      title: TEXT.panelTitle, body,
      actions: [
        { label: TEXT.join, primary: true, onClick: (close) => { joined = true; joinGroup(code); close(); } },
        { label: TEXT.later },
      ],
      onClose: () => { pendingCode = null; if (!joined) G.ui.toast(TEXT.laterToast, 4000); clearHash(); C.releaseDefault(); }, // ✕, Escape, chạm nền, "Để sau" và "Vào nhóm" (sau setCode / enable) đều qua đây; việc cuối cùng: nối phòng nếu 'enter' đã bị giữ
    });
  }
  function present() {
    if (badLink) { badLink = false; G.ui.toast(TEXT.bad, 5000); clearHash(); return; }
    const code = pendingCode;
    if (!code) return;
    if (C.on && C.code === code) { pendingCode = null; G.ui.toast(TEXT.same, 4000); clearHash(); C.releaseDefault(); return; } // releaseDefault: nếu người chơi tự đặt đúng mã này trong lúc đang giữ
    openInvite(code);
  }
  const tutHidden = () => { const t = document.getElementById('tut'); return !t || t.classList.contains('hidden'); };
  const canShow = () => G.started && !G.ui.panelOpen && tutHidden() && !!G.save.data.tutorialDone && !G.activity.current;
  G.events.on('enter', () => {
    if (!pendingCode && !badLink) return;
    const t0 = performance.now();
    const timer = setInterval(() => {
      if (performance.now() - t0 < EARLIEST_MS || !canShow()) return;
      clearInterval(timer); // chỉ một lần mỗi lần tải trang
      present();
    }, POLL_MS);
  });

  // =====================================================================
  //  API CÔNG KHAI (G.loiMoi) — cũng dùng để kiểm tra headless
  // =====================================================================
  G.loiMoi = {
    ALPHABET, makeCode, linkFor, parseHash,
    get pending() { return pendingCode; }, // mã trong link mời đang chờ trả lời, hoặc null
    share,
  };
}
