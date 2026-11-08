// =====================================================================
//  NGỒI BỒ ĐOÀN · TỤNG KINH · NGỒI THIỀN (module 45)
//  Đến gần một bồ đoàn trống trong chính điện thì hiện nút "Ngồi xuống" (hoặc bấm E). Ngồi rồi chọn:
//  Tụng kinh (chọn bài trong G.kinh, chạm để tụng từng chữ hoặc bật "Mõ tự động", hết bài có ba tiếng khánh, nhớ chỗ đã tụng),
//  Thiền (vòng tròn thở 7 giây, 1–5 phút, ba tiếng khánh) hoặc Đứng dậy. Không thắng thua, không điểm số.
//  Mọi lối thoát (nút ×, Escape, Đứng dậy, lỗi) đều dọn sạch và gọi G.activity.end() đúng một lần.
//  Lưu: G.save.data.kinh = { last, prog: { [id]: { part, i, n, at } }, done: { [id]: số lần } }, G.save.data.kinhCuaToi (chữ),
//  G.save.data.thien = { lan, phut }. Cần G.kinh (21-kinh-van.js); có G.crowd.seats (20-crowd.js) thì giữ chỗ ngồi để khách AI không ngồi trùng.
// =====================================================================
function installNgoiTungKinh(G) {
  const { util: U } = G;
  const PI = Math.PI;
  const W = G.world || {};
  const P = G.player;
  const seats = W.seats || (G.spots && G.spots.hallSeats) || [];
  if (!seats.length || !P || !G.poi || !G.activity || !G.ui) return;
  const sfx = (name, o) => { try { if (G.audio && G.audio.play) G.audio.play(name, o); } catch (e) { /* âm thanh lỗi thì bỏ qua */ } };
  const crowdSeats = () => (G.crowd && G.crowd.seats) || null;
  const persist = () => { try { G.save.persist(); } catch (e) { /* không lưu được thì thôi */ } };

  const SEAT_R = 1.7;          // tìm bồ đoàn trống trong bán kính này quanh người chơi
  const SEAT_LIFT = 0.17;      // ngồi cao hơn mặt bồ đoàn một chút
  const ZIN = -87.3;           // máy quay không lùi sát hơn nữa vào tường trước (mặt trong z −86,7)
  const FAR_Z = 9999;
  const BPMS = [['Chậm', 52], ['Vừa', 66], ['Nhanh', 80]];
  const BLURBS = ['Mỗi câu kinh là một hơi thở chậm lại.', 'Lòng nhẹ như vừa đặt gánh xuống.', 'Tâm an là vui rồi.'];

  // =====================================================================
  //  KIỂU DÁNG (tiền tố nk-): chữ kinh, chọn bài, vòng thở. Dùng thêm lớp aa-* của 30-activities-a.js
  // =====================================================================
  G.ui.addStyle(`
  .nk-top{position:absolute;left:50%;top:calc(62px + var(--st));transform:translateX(-50%);width:min(58vw,300px);padding:6px 12px 8px;border-radius:14px;background:rgba(42,24,14,.55);text-align:center;pointer-events:none}
  .nk-top b{display:block;font-family:var(--serif);font-size:16px;line-height:1.25;color:var(--gold2);text-shadow:0 1px 3px rgba(0,0,0,.8);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .nk-top small{display:block;font-size:12.5px;color:var(--cream);opacity:.85;margin:0 0 5px;text-shadow:0 1px 3px rgba(0,0,0,.8)}
  .nk-top .aa-bar{position:relative;left:auto;top:auto;transform:none;width:min(46vw,220px);margin:0 auto}
  .nk-mid{position:absolute;left:50%;top:calc(124px + var(--st));transform:translateX(-50%);width:min(92vw,640px);display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none}
  .nk-card{width:100%;padding:12px 14px 13px;border-radius:20px;background:rgba(42,24,14,.6);border:1px solid var(--line);text-align:center;box-shadow:0 6px 22px rgba(0,0,0,.28)}
  .nk-line{display:flex;flex-wrap:wrap;justify-content:center;align-items:baseline;gap:1px 10px;font-family:var(--serif);font-weight:700;font-size:clamp(22px,5.6vw,30px);line-height:1.38;color:var(--cream);min-height:1.38em;text-shadow:0 2px 6px rgba(0,0,0,.55)}
  .nk-line span{display:inline-block;transition:color .14s,transform .14s,text-shadow .14s,opacity .14s}
  .nk-line span.d{opacity:.4}
  .nk-line span.on{color:var(--gold2);transform:scale(1.1);text-shadow:0 0 14px rgba(247,215,147,.85)}
  .nk-line.in{animation:nk-in .38s ease-out both}
  .nk-next{margin-top:8px;font-family:var(--serif);font-size:clamp(14px,3.8vw,18px);line-height:1.35;color:var(--cream);opacity:.6;min-height:1.35em}
  .nk-cap{max-width:100%;text-align:center;font-family:var(--serif);font-size:16px;line-height:1.4;color:var(--cream);background:rgba(42,24,14,.7);border:1px solid var(--line);border-radius:16px;padding:6px 14px;
    text-shadow:0 1px 2px rgba(0,0,0,.5);opacity:0;transition:opacity .4s}
  .nk-cap.on{opacity:1}
  .nk-ctl{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(174px + var(--sb));display:flex;flex-wrap:wrap;justify-content:center;gap:8px;width:min(94vw,560px);pointer-events:none}
  .nk-ctl > *{pointer-events:auto}
  .nk-chip{min-height:44px;min-width:44px;padding:8px 16px;border-radius:22px;border:1px solid var(--line);background:rgba(42,24,14,.8);color:var(--cream);font-size:15px;font-weight:600;cursor:pointer}
  .nk-chip.on{background:var(--gold);color:var(--ink);border-color:#fff0c8;font-weight:800}
  .nk-chip:active{transform:scale(.96)}
  .nk-chip[hidden]{display:none}
  .nk-pad{position:absolute;left:50%;width:0;height:0;pointer-events:none;bottom:calc(108px + var(--sb))}
  .nk-pad .aa-target{pointer-events:none}
  .nk-pick{display:flex;flex-direction:column;gap:10px}
  .nk-gh{font-family:var(--serif);font-size:15px;font-weight:700;color:var(--gold);margin:8px 2px 0;letter-spacing:.3px}
  .nk-item{display:block;width:100%;text-align:left;cursor:pointer;color:var(--cream);font:inherit;font-size:14px;line-height:1.4;min-height:60px}
  .nk-item:active{transform:scale(.99);background:rgba(255,255,255,.1)}
  .nk-item b{display:block;font-family:var(--serif);font-size:17px;color:var(--gold2);line-height:1.3}
  .nk-item .nk-d{margin-top:4px;color:var(--cream);opacity:.88}
  .nk-item .nk-m{margin-top:5px;color:var(--muted);font-size:12.5px}
  .nk-badge{display:inline-block;margin-left:8px;padding:1px 10px;border-radius:12px;background:var(--gold);color:var(--ink);font-family:var(--font);font-size:11.5px;font-weight:800;vertical-align:middle}
  .nk-last{display:flex;align-items:center;gap:12px;flex-wrap:wrap;border-color:rgba(247,215,147,.7)}
  .nk-last > div{flex:1 1 180px;min-width:0}
  .nk-last b{font-family:var(--serif);font-size:17px;color:var(--gold2)}
  .nk-last .btn{flex:0 0 auto}
  .nk-own textarea{margin:8px 0 10px}
  .nk-med{cursor:default}
  .nk-vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,rgba(10,6,4,0) 36%,rgba(10,6,4,.55) 100%)}
  .nk-time{position:absolute;left:50%;top:calc(66px + var(--st));transform:translateX(-50%);font-family:var(--serif);font-size:16px;color:var(--cream);opacity:.88;text-shadow:0 1px 3px rgba(0,0,0,.8);font-variant-numeric:tabular-nums;pointer-events:none}
  .nk-bw{--nk-d:clamp(150px,36vmin,250px);position:absolute;left:50%;top:38%;width:var(--nk-d);height:var(--nk-d);transform:translate(-50%,-50%);pointer-events:none}
  .nk-breath{position:absolute;inset:0;border-radius:50%;border:3px solid rgba(255,226,160,.85);background:radial-gradient(circle,rgba(255,226,160,.42),rgba(247,215,147,.2) 58%,rgba(247,215,147,.05) 74%);
    box-shadow:0 0 46px rgba(255,226,160,.45),inset 0 0 34px rgba(255,226,160,.28);transform:scale(.55);animation:nk-breath 7s ease-in-out infinite}
  .nk-bcap{position:absolute;left:50%;top:calc(100% + 14px);transform:translateX(-50%);width:max-content;height:34px;pointer-events:none}
  .nk-bcap span{position:absolute;left:50%;top:0;transform:translateX(-50%);white-space:nowrap;font-family:var(--serif);font-size:22px;color:var(--gold2);text-shadow:0 1px 4px rgba(0,0,0,.85);opacity:0}
  .nk-bcap .i{animation:nk-cin 7s ease-in-out infinite}
  .nk-bcap .o{animation:nk-cout 7s ease-in-out infinite}
  @keyframes nk-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
  @keyframes nk-breath{0%,100%{transform:scale(.55)}50%{transform:scale(1)}}
  @keyframes nk-cin{0%{opacity:0}8%,44%{opacity:1}54%,100%{opacity:0}}
  @keyframes nk-cout{0%,50%{opacity:0}58%,94%{opacity:1}100%{opacity:0}}
  @media (max-height:520px){.nk-next{display:none}.nk-mid{top:calc(112px + var(--st))}.nk-line{font-size:22px}.nk-ctl{bottom:calc(120px + var(--sb))}.nk-pad{bottom:calc(60px + var(--sb))}.nk-bw{--nk-d:clamp(120px,36vmin,190px);top:47%}}
  @media (prefers-reduced-motion:reduce){.nk-line.in{animation:none}.nk-breath{animation-duration:12s}.nk-bcap .i,.nk-bcap .o{animation-duration:12s}}
  `);

  // =====================================================================
  //  PHIÊN CHẠY (cùng mẫu với 30-activities-a.js): gom mọi thứ cần dọn, bảo đảm G.activity.end() đúng một lần ở MỌI lối thoát
  // =====================================================================
  let busy = false;      // chặn bắt đầu hai lần
  let run = null;        // phiên hiện tại
  const frameFns = [];   // hàm cập nhật mỗi khung của phiên hiện tại
  const timers = [];     // hẹn giờ theo thời gian trò chơi (chạy ngay trong khung, nên G.debugStep tua nhanh đi hết cả chuỗi)
  const after = (sec, fn) => { timers.push({ t: sec, fn }); };
  let seatIdx = -1;      // bồ đoàn trống gần người chơi nhất (-1 = không có)
  let heldSeat = -1;     // chỗ đang giữ trong G.crowd.seats
  let scr = null;        // màn hình con đang mở (chữ kinh / thiền)
  let bpmSel = 66;       // nhịp mõ tự động đã chọn (nhớ trong lúc chơi)

  function releaseHeld() {
    if (heldSeat < 0) return;
    const i = heldSeat; heldSeat = -1;
    const cs = crowdSeats();
    try { if (cs && cs.release) cs.release(i); } catch (e) { console.error(e); }
  }
  function newRun(name) {
    const r = {
      name, dead: false, offs: [], cleanups: [],
      on(evt, fn) { r.offs.push(G.events.on(evt, fn)); },
      defer(fn) { r.cleanups.push(fn); },
      frame(fn) { frameFns.push(fn); r.cleanups.push(() => { const i = frameFns.indexOf(fn); if (i >= 0) frameFns.splice(i, 1); }); },
      exit() {
        if (r.dead) return;
        r.dead = true;
        for (const off of r.offs) { try { off(); } catch (e) { console.error(e); } }
        for (let i = r.cleanups.length - 1; i >= 0; i--) { try { r.cleanups[i](); } catch (e) { console.error(e); } }
        r.offs.length = 0; r.cleanups.length = 0; timers.length = 0;
        releaseHeld();
        if (G.activity.current === name) G.activity.end();
        if (run === r) run = null;
        busy = false;
      },
    };
    run = r;
    r.on('escape', () => { if (r.leave) r.leave(); else r.exit(); });
    // Escape luôn là "đứng dậy" ở mọi màn (kể cả khi đang mở bảng); ô nhập chữ thì để lõi bỏ lấy nét trước
    const onKey = (e) => {
      if (e.code !== 'Escape' || r.dead) return;
      const tag = e.target && e.target.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') return;
      e.preventDefault(); e.stopImmediatePropagation();
      if (r.leave) r.leave(); else r.exit();
    };
    window.addEventListener('keydown', onKey, true);
    r.defer(() => window.removeEventListener('keydown', onKey, true));
    return r;
  }
  // Chạy một hàm bất đồng bộ; nếu lỗi thì dọn sạch để không kẹt hoạt động
  function launch(name, fn) {
    fn().catch((e) => {
      console.error(e);
      if (run) run.exit();
      else { releaseHeld(); if (G.activity.current === name) G.activity.end(); }
      busy = false;
    });
  }

  // ---------- Thành phần giao diện dùng chung (sao chép từ 30-activities-a.js) ----------
  function mkLayer(owner) {
    const el = U.el('div', 'aa-layer');
    G.ui.overlay.appendChild(el);
    owner.defer(() => el.remove());
    return el;
  }
  function mkClose(layer, fn) {
    const b = U.el('button', 'aa-x', '×');
    b.type = 'button'; b.setAttribute('aria-label', 'Đóng'); b.title = 'Xong';
    b.addEventListener('pointerdown', (e) => e.stopPropagation());
    b.addEventListener('click', (e) => { e.stopPropagation(); sfx('ui'); fn(); });
    layer.appendChild(b);
    return b;
  }
  // Dòng chữ nhỏ dưới thẻ kinh: gợi ý lúc đầu, "Hết …" giữa các phần
  function mkCaption(parent) {
    const el = U.el('div', 'nk-cap'); el.setAttribute('aria-live', 'polite');
    parent.appendChild(el);
    return {
      el, tag: '',
      say(t, tag) {
        this.tag = tag || '';
        el.classList.remove('on');
        if (!t) return;
        el.textContent = t; void el.offsetWidth; el.classList.add('on');
      },
    };
  }
  // Vòng tròn mõ ở dưới màn hình: chỉ để chạm / nhấp nháy theo mỗi tiếng gõ (không có vòng nhịp như trò gõ mõ)
  function makePad(layer, icon) {
    const o = { pad: U.el('div', 'nk-pad'), target: U.el('div', 'aa-target') };
    o.target.innerHTML = G.icons[icon] || '';
    o.pad.appendChild(o.target);
    layer.appendChild(o.pad);
    o.hit = () => { o.target.classList.remove('hit'); void o.target.offsetWidth; o.target.classList.add('hit'); };
    return o;
  }

  // ---------- Màn hình con: một lúc chỉ có một (chữ kinh hoặc thiền) ----------
  function newScreen() {
    endScreen();
    const s = { dead: false, fns: [], update: null, onEnd: null, finished: false };
    s.defer = (fn) => { s.fns.push(fn); };
    s.on = (evt, fn) => { s.fns.push(G.events.on(evt, fn)); };
    scr = s;
    return s;
  }
  function endScreen() {
    if (!scr) return;
    const s = scr; scr = null; s.dead = true; s.update = null;
    try { if (s.onEnd) s.onEnd(); } catch (e) { console.error(e); }
    for (let i = s.fns.length - 1; i >= 0; i--) { try { s.fns[i](); } catch (e) { console.error(e); } }
    s.fns.length = 0;
  }

  // ---------- Bảng: một lúc chỉ có một; đóng bằng mã thì không gọi hành động "bỏ qua" ----------
  let pan = null;
  function closePanel() { if (pan) { const p = pan; pan = null; p.close(); } }
  function openPanel(o, onDismiss) {
    closePanel();
    let me = null;
    me = G.ui.panel(Object.assign({}, o, { clear: true, onClose: () => { if (pan === me) { pan = null; if (onDismiss) onDismiss(); } } }));
    pan = me;
    return me;
  }

  // =====================================================================
  //  ĐIỂM "NGỒI XUỐNG" — bám theo bồ đoàn trống gần người chơi nhất
  // =====================================================================
  function nearestFreeSeat(x, z, maxD) {
    const cs = crowdSeats();
    if (cs && cs.nearestFree) return cs.nearestFree(x, z, maxD);
    let best = -1, bd = maxD * maxD;
    for (let i = 0; i < seats.length; i++) {
      const dx = seats[i].x - x, dz = seats[i].z - z, d = dx * dx + dz * dz;
      if (d <= bd) { bd = d; best = i; }
    }
    return best;
  }
  const poi = G.poi.add({
    id: 'ngoi', label: 'Ngồi xuống', icon: 'lotus', x: 0, z: FAR_Z, r: SEAT_R,
    desc: 'Ngồi lên một bồ đoàn trống trong chính điện', onAction: startNgoi, available: () => seatIdx >= 0,
  });
  poi.enabled = false; // chỉ bật khi đang đứng cạnh một bồ đoàn trống (cũng để khỏi hiện trong "Bản đồ chùa")
  function followSeat() {
    let idx = -1;
    if (G.started && !G.activity.current && !busy && G.insideHall && G.insideHall(P.pos.x, P.pos.z)) idx = nearestFreeSeat(P.pos.x, P.pos.z, SEAT_R - 0.02);
    seatIdx = idx;
    if (idx >= 0) { const s = seats[idx]; poi.x = s.x; poi.z = s.z; poi.y = s.y; poi.enabled = true; }
    else if (poi.z !== FAR_Z) { poi.x = 0; poi.z = FAR_Z; poi.y = 0; poi.enabled = false; }
  }
  G.onUpdate((dt) => {
    followSeat();
    for (let i = frameFns.length - 1; i >= 0; i--) {
      try { frameFns[i](dt); } catch (e) { console.error(e); if (run) run.exit(); }
    }
    for (let i = 0; i < timers.length; i++) {
      const h = timers[i];
      h.t -= dt;
      if (h.t > 0) continue;
      timers.splice(i, 1); i--;
      try { h.fn(); } catch (e) { console.error(e); if (run) run.exit(); }
    }
  }, 25);

  // =====================================================================
  //  MÁY QUAY: sau lưng người ngồi, nhìn về bàn thờ và tượng Phật giữa
  // =====================================================================
  function camFor(seat) {
    const asp = G.size.w / G.size.h, phone = asp < 0.8;
    const pull = asp < 1 ? U.clamp(0.66 / asp, 1, 1.5) : 1;   // lõi lùi máy quay ở màn dọc: chia trước để máy dừng đúng chỗ muốn
    const sx = seat.x;
    const zc = Math.min(seat.z + (phone ? 7.0 : 8.5), ZIN);
    const back = zc - seat.z;                                  // khoảng lùi thật sau lưng (hàng đầu sát tường: rất ngắn)
    const yc = U.lerp(CAM.yLow, phone ? CAM.yPhone : CAM.yDesk, U.smoothstep(CAM.d0, CAM.d1, back));
    const span = zc + 108;                                     // tới tường sau (tượng Phật)
    const halfH = Math.atan(Math.tan(((asp < 1 ? 64 : 52) / 2) * PI / 180) * asp);   // nửa góc nhìn ngang
    const xc = phone ? sx - U.clamp(sx, -1.2, 1.2) : U.clamp(sx, -CAM.xMax, CAM.xMax); // cột son ở x ±15,4: máy (màn ngang) không áp sát cột; màn dọc hẹp: máy dịch về trục giữa tối đa 1,2 m để cả hai pho bên lọt khung (người ngồi lệch ≤ 10° so với trục máy, vẫn trong khung)
    const bp = Math.atan2(Math.abs(sx - xc), Math.max(back, 0.3));   // người ngồi lệch khỏi trục máy bao nhiêu khi máy dịch vào trong
    const phi = Math.min(Math.atan(Math.abs(sx) / span) * CAM.mix, Math.max(0, halfH * CAM.keep - bp));   // nhìn chếch về tượng giữa, nhưng vẫn giữ người ngồi trong khung
    const look = [xc - Math.sign(sx) * Math.tan(phi) * span, yc - CAM.tilt * span, -108];
    const pos = [xc, yc, zc], eye = pos.slice();
    if (pull > 1) for (let k = 0; k < 3; k++) pos[k] = look[k] + (pos[k] - look[k]) / pull;
    return { pos, look, dur: 1.1, eye };
  }
  const CAM = { yLow: 6.8, yDesk: 7.7, yPhone: 7.4, d0: 1.2, d1: 5.5, mix: 0.6, keep: 0.85, tilt: 0.04, xMax: 12.9 };

  // =====================================================================
  //  NGỒI XUỐNG
  // =====================================================================
  function startNgoi() {
    if (busy || G.activity.current) return;
    const i = seatIdx;
    if (i < 0) return;
    busy = true;
    launch('ngoi', () => runNgoi(i));
  }

  async function runNgoi(i) {
    const seat = seats[i];
    const cs = crowdSeats();
    if (cs && cs.hold) {
      if (!cs.hold(i)) { G.ui.toast('Chỗ này vừa có người ngồi. Bạn thử bồ đoàn khác nhé.'); busy = false; return; }
      heldSeat = i;
    }
    if (!G.activity.begin('ngoi', { cam: camFor(seat) })) { releaseHeld(); busy = false; return; }
    const r = newRun('ngoi');
    let leaving = false;
    const K = G.kinh;      // dữ liệu kinh (21-kinh-van.js); thiếu thì chỉ còn thiền
    const cntCache = {};
    r.defer(() => { endScreen(); closePanel(); });
    r.leave = () => {   // đứng dậy (mọi lối thoát đi qua đây): chỗ ngồi được nhả, người chơi ở lại trên bồ đoàn
      if (leaving || r.dead) return;
      leaving = true;
      r.exit();
    };
    r.on('resize', () => { if (!r.dead) G.cam.focus(camFor(seat)); });
    r.on('key:action', () => { if (!leaving && !pan && !scr && !G.ui.panelOpen) showMenu(); });
    r.frame((dt) => { if (scr && scr.update) scr.update(dt); });

    P.placeAt(seat.x, seat.z, PI);
    P.pos.y = seat.y + SEAT_LIFT;
    P.poseParam = 0; P.setPose('sit');
    showMenu();

    // ---------- Bảng ngồi ----------
    function showMenu() {
      if (r.dead || leaving) return;
      endScreen();
      P.poseParam = 0; P.setPose('sit');
      openPanel({
        title: 'Ngồi trên bồ đoàn',
        body: U.el('div', null, 'Bạn đang ngồi giữa chính điện. Lắng lòng một chút nhé.'),
        actions: [
          { label: 'Tụng kinh', primary: true, onClick: () => { closePanel(); showPicker(); } },
          { label: 'Thiền', onClick: () => { closePanel(); showThienSetup(); } },
          { label: 'Đứng dậy', onClick: () => { closePanel(); r.leave(); } },
        ],
      }, () => r.leave());
    }

    // =====================================================================
    //  TỤNG KINH — chọn bài
    // =====================================================================
    const countOf = (item) => (item.id === 'cuaToi' ? K.count(item) : (cntCache[item.id] || (cntCache[item.id] = K.count(item))));
    const pctOf = (pr) => Math.min(99, Math.max(1, Math.round((100 * pr.i) / pr.n)));
    function kdata() {
      const d = G.save.data;
      let k = d.kinh;
      if (!k || typeof k !== 'object') k = d.kinh = {};
      if (!k.prog || typeof k.prog !== 'object') k.prog = {};
      if (!k.done || typeof k.done !== 'object') k.done = {};
      if (typeof k.last !== 'string') k.last = null;
      return k;
    }
    function itemById(id) {
      if (id === 'cuaToi') {
        const t = G.save.data.kinhCuaToi;
        return typeof t === 'string' && t ? K.custom(t) : null;
      }
      return K.get(id) || null;
    }
    // Bài tụng dở gần nhất (nếu còn tiến độ hợp lệ)
    function lastResumable() {
      const kd = kdata(), id = kd.last;
      if (!id) return null;
      const pr = kd.prog[id];
      if (!pr || !(pr.i > 0) || !(pr.n > pr.i)) return null;
      const item = itemById(id);
      if (!item || countOf(item).syl !== pr.n) return null;
      return { item, prog: pr };
    }
    function metaOf(item, pr) {
      const c = countOf(item);
      let s = '≈ ' + K.minutes(item) + ' phút · ' + (item.group === 'thoikhoa' ? item.parts.length + ' phần' : c.lines + ' câu');
      if (pr && pr.i > 0 && pr.n === c.syl) s += ' · đã tụng ' + pctOf(pr) + '%';
      return s;
    }

    function showPicker() {
      if (r.dead || leaving) return;
      endScreen();
      P.poseParam = 0; P.setPose('sit');
      if (!K || !K.list) { G.ui.toast('Các bài kinh chưa sẵn sàng, bạn thử lại sau nhé.'); showMenu(); return; }
      const kd = kdata();
      const body = U.el('div', 'nk-pick');
      body.appendChild(U.el('div', null, 'Chọn một bài rồi chạm vào mõ để tụng từng chữ, hoặc bấm “Mõ tự động” để nghe mõ gõ đều theo nhịp; hết bài có ba tiếng khánh. Mới bắt đầu, bạn có thể thử Thời khóa ngắn.'));
      const lr = lastResumable();
      if (lr) {
        const card = U.el('div', 'card nk-last');
        const tx = U.el('div');
        const ln = U.el('div'); ln.append(U.el('b', null, lr.item.title), document.createTextNode(' · đã tụng ' + pctOf(lr.prog) + '%'));
        tx.append(U.el('div', 'small muted', 'Lần trước'), ln);
        const go = U.el('button', 'btn primary', 'Tiếp tục'); go.type = 'button';
        go.onclick = () => { closePanel(); startChant(lr.item, lr.prog); };
        card.append(tx, go);
        body.appendChild(card);
      }
      for (const g of K.groups) {
        const items = K.list.filter((it) => it.group === g.id);
        if (!items.length) continue;
        body.appendChild(U.el('div', 'nk-gh', g.title));
        for (const item of items) {
          const card = U.el('button', 'card nk-item'); card.type = 'button';
          const h = U.el('b', null, item.title);
          if (item.badge) h.appendChild(U.el('span', 'nk-badge', item.badge));
          card.appendChild(h);
          if (item.sub) card.appendChild(U.el('div', 'small muted', item.sub));
          if (item.desc) card.appendChild(U.el('div', 'nk-d', item.desc));
          card.appendChild(U.el('div', 'nk-m', metaOf(item, kd.prog[item.id])));
          card.onclick = () => { closePanel(); startChant(item, null); };
          body.appendChild(card);
        }
      }
      // Bài kinh của tôi
      body.appendChild(U.el('div', 'nk-gh', 'Bài kinh của tôi'));
      const own = U.el('div', 'card nk-own');
      own.appendChild(U.el('div', 'small muted', 'Dán hoặc gõ một bài kinh, bài chú hay lời nguyện riêng; mỗi dòng là một câu.'));
      const ta = U.el('textarea', 'field'); ta.maxLength = 4000; ta.rows = 5;
      ta.placeholder = 'Dán hoặc gõ bài kinh bạn muốn tụng…';
      ta.setAttribute('aria-label', 'Bài kinh của tôi');
      const saved = G.save.data.kinhCuaToi;
      if (typeof saved === 'string' && saved) {
        ta.value = saved;
        const op = kd.prog.cuaToi, oi = itemById('cuaToi');
        if (op && op.i > 0 && oi && countOf(oi).syl === op.n) own.appendChild(U.el('div', 'nk-m', 'Bài đang tụng dở · đã tụng ' + pctOf(op) + '%'));
      }
      const go = U.el('button', 'btn primary', 'Tụng bài này'); go.type = 'button';
      go.style.width = '100%';
      go.onclick = () => {
        const raw = ta.value;
        const t = G.text.cleanText(raw, 4000);
        if (G.text.hasBad(raw) || G.text.hasBad(t)) { G.ui.toast('Bài kinh có từ không phù hợp, bạn sửa lại nhé.'); return; }
        const item = K.custom(t);
        if (!t || !item.parts[0].lines.length) { G.ui.toast('Bạn hãy dán hoặc gõ bài kinh trước nhé.'); return; }
        G.save.data.kinhCuaToi = t; persist();
        closePanel();
        startChant(item, null);
      };
      own.append(ta, go);
      body.appendChild(own);
      openPanel({
        title: 'Tụng kinh', body,
        actions: [{ label: 'Quay lại', onClick: () => { closePanel(); showMenu(); } }],
      }, showMenu);
    }

    // =====================================================================
    //  TỤNG KINH — màn chữ: chạm một lần = một chữ; "Mõ tự động" gõ đều theo nhịp
    // =====================================================================
    function startChant(item, resume) {
      if (r.dead || leaving) return;
      const s = newScreen();
      const parts = [];
      let total = 0;
      for (let p = 0; p < item.parts.length; p++) {
        const src = item.parts[p].lines || [], lines = [];
        let n = 0;
        for (let l = 0; l < src.length; l++) { const a = K.syls(src[l]); if (a.length) { lines.push(a); n += a.length; } }
        if (!lines.length) continue;
        parts.push({ title: item.parts[p].title || item.title, lines, n });
        total += n;
      }
      if (!total) { endScreen(); G.ui.toast('Bài này chưa có chữ để tụng.'); showPicker(); return; }

      let pi = 0, li = 0, si = 0, done = 0;     // phần, câu, chữ hiện tại; số chữ đã tụng cả bài
      if (resume && resume.n === total && resume.i > 0 && resume.i < total) {
        let rem = resume.i;
        while (pi < parts.length && rem >= parts[pi].n) { rem -= parts[pi].n; pi++; }
        if (pi >= parts.length) { pi = 0; rem = 0; }
        while (li < parts[pi].lines.length - 1 && rem >= parts[pi].lines[li].length) { rem -= parts[pi].lines[li].length; li++; }
        si = Math.min(rem, parts[pi].lines[li].length - 1);
        done = resume.i;
      }
      let state = 'chant';                      // 'chant' | 'between' | 'end'
      let auto = false, acc = 0, bpm = bpmSel;

      // --- dựng giao diện ---
      const layer = mkLayer(s);
      layer.addEventListener('contextmenu', (e) => e.preventDefault());
      mkClose(layer, () => { // × : lưu chỗ đã tụng rồi về danh sách bài
        if (s.dead || r.dead) return;
        endScreen();
        P.setPose('sit');
        showPicker();
      });
      const top = U.el('div', 'nk-top'), ttl = U.el('b'), sub = U.el('small');
      const bar = U.el('div', 'aa-bar'), fill = document.createElement('i'); bar.appendChild(fill);
      top.append(ttl, sub, bar);
      const mid = U.el('div', 'nk-mid'), card = U.el('div', 'nk-card');
      const curEl = U.el('div', 'nk-line'), nextEl = U.el('div', 'nk-next');
      card.append(curEl, nextEl);
      mid.appendChild(card);
      const cap = mkCaption(mid);
      const ctl = U.el('div', 'nk-ctl');
      const chip = (label) => {
        const b = U.el('button', 'nk-chip', label); b.type = 'button';
        b.addEventListener('pointerdown', (e) => e.stopPropagation());
        return b;
      };
      const autoBtn = chip('Mõ tự động'); autoBtn.setAttribute('aria-pressed', 'false');
      const tempoBtns = BPMS.map(([name, v]) => {
        const b = chip(name); b.hidden = true; b.classList.toggle('on', v === bpm);
        b.addEventListener('click', (e) => {
          e.stopPropagation(); sfx('ui'); bpm = bpmSel = v; acc = 0; b.blur();   // bỏ lấy nét để Space / Enter chỉ còn là "gõ mõ"
          for (const o of tempoBtns) o.classList.toggle('on', o === b);
        });
        return b;
      });
      autoBtn.addEventListener('click', (e) => {
        e.stopPropagation(); sfx('ui'); autoBtn.blur();
        auto = !auto; acc = 0;
        autoBtn.classList.toggle('on', auto); autoBtn.setAttribute('aria-pressed', auto ? 'true' : 'false');
        for (const o of tempoBtns) o.hidden = !auto;
      });
      ctl.append(autoBtn, ...tempoBtns);
      const pad = makePad(layer, 'mo');
      layer.append(top, mid, ctl);

      // --- hiển thị câu / phần ---
      let spans = [], cur = parts[pi].lines[li];
      function fillLine() {
        cur = parts[pi].lines[li];
        curEl.textContent = '';
        spans.length = 0;
        const frag = document.createDocumentFragment();
        for (let i = 0; i < cur.length; i++) {
          const sp = document.createElement('span');
          sp.textContent = cur[i];
          if (i < si) sp.className = 'd'; else if (i === si) sp.className = 'on';
          frag.appendChild(sp); spans.push(sp);
        }
        curEl.appendChild(frag);
        const pt = parts[pi];
        nextEl.textContent = li + 1 < pt.lines.length ? pt.lines[li + 1].join(' ') : (pi + 1 < parts.length ? parts[pi + 1].lines[0].join(' ') : '');
      }
      function showLine(anim) {
        fillLine();
        if (anim) { curEl.classList.remove('in'); void curEl.offsetWidth; curEl.classList.add('in'); }
      }
      function showPart() {
        ttl.textContent = parts[pi].title;
        sub.textContent = 'phần ' + (pi + 1) + '/' + parts.length;
        showLine(true);
      }
      const paintBar = () => { fill.style.transform = 'scaleX(' + (total ? done / total : 0).toFixed(3) + ')'; };
      showPart(); paintBar();

      // --- lưu tiến độ ---
      function saveProg() {
        if (done <= 0 || done >= total || s.finished) return;
        const kd = kdata();
        kd.last = item.id;
        kd.prog[item.id] = { part: pi, i: done, n: total, at: Date.now() };
        persist();
      }
      s.onEnd = saveProg;

      // --- một cú gõ mõ = một chữ ---
      function strike() {
        if (state !== 'chant' || s.dead) return;
        sfx('mo', { accent: si === 0 });
        P.tap();
        pad.hit();
        spans[si].className = 'd';
        done++; si++;
        paintBar();
        if (done % 20 === 0) saveProg();
        if (si < cur.length) { spans[si].className = 'on'; return; }
        si = 0; li++;
        if (li < parts[pi].lines.length) { showLine(true); return; }
        endPart();
      }
      function endPart() {
        if (pi + 1 >= parts.length) { finishItem(); return; }
        const doneTitle = parts[pi].title;
        pi++; li = 0; si = 0; state = 'between';
        saveProg();
        sfx('bowlBell');
        cap.say('Hết ' + doneTitle, 'part');
        after(1.6, () => { if (s.dead) return; showPart(); state = 'chant'; acc = 0; });
      }
      function finishItem() {
        state = 'end'; s.finished = true;
        const kd = kdata();
        delete kd.prog[item.id];
        kd.done[item.id] = (kd.done[item.id] | 0) + 1;
        kd.last = item.id;
        persist();
        const times = kd.done[item.id];
        fill.style.transform = 'scaleX(1)';
        cap.say('Hết ' + item.title, 'end');
        let k = 0;   // ba tiếng khánh, cách nhau 1,4 giây, rồi mới hiện bảng kết quả
        const stroke = () => {
          if (s.dead) return;
          sfx('khanh'); k++;
          after(1.4, k < 3 ? stroke : () => { if (!s.dead) showChantResult(item, times); });
        };
        stroke();
      }

      // --- nhập: chạm bất kỳ đâu trên màn, Space / E / Enter ---
      const manual = () => { if (state !== 'chant' || s.dead) return; acc = 0; strike(); };
      layer.addEventListener('pointerdown', (e) => { if (e.button > 0) return; e.preventDefault(); manual(); });
      s.on('key:action', manual);
      s.update = (dt) => {   // mõ tự động: đồng hồ cộng dồn theo thời gian trò chơi, dừng khi tab bị ẩn
        if (!auto || state !== 'chant' || document.hidden) return;
        acc += dt;
        const per = 60 / bpm;
        for (let n = 0; acc >= per && n < 6 && state === 'chant'; n++) { acc -= per; strike(); }
        if (acc > per) acc = 0;
      };

      P.poseParam = 0; P.setPose('sitPray');
      acc = -0.6;   // mõ tự động chờ một nhịp ngắn lúc bắt đầu
      cap.say('Chạm vào màn hình (hoặc Space) để tụng từng chữ · Mõ tự động: mõ gõ đều cho bạn', 'hint');
      after(4, () => { if (!s.dead && cap.tag === 'hint') cap.say(''); });
    }

    function showChantResult(item, times) {
      if (r.dead || leaving) return;
      endScreen();
      P.poseParam = 0; P.setPose('sit');
      const body = U.el('div', 'center');
      const t = U.el('div', 'gold', item.title); t.style.cssText = 'font-family:var(--serif);font-size:19px;font-weight:700;margin:2px 0 8px';
      body.append(t, U.el('div', 'aa-line', U.pick(BLURBS)), U.el('div', 'note', 'Bạn đã tụng bài này ' + times + ' lần.'));
      openPanel({
        title: 'Đã tụng xong', body,
        actions: [
          { label: 'Tụng bài khác', primary: true, onClick: () => { closePanel(); showPicker(); } },
          { label: 'Ngồi tiếp', onClick: () => { closePanel(); showMenu(); } },
          { label: 'Đứng dậy', onClick: () => { closePanel(); r.leave(); } },
        ],
      }, showMenu);
    }

    // =====================================================================
    //  THIỀN — vòng tròn thở 7 giây
    // =====================================================================
    function showThienSetup() {
      if (r.dead || leaving) return;
      endScreen();
      P.poseParam = 0; P.setPose('sit');
      let mins = 3;
      const body = U.el('div');
      body.appendChild(U.el('div', null, 'Ngồi yên, thở chậm theo vòng tròn sáng. Không cần làm gì thêm.'));
      const chips = U.el('div', 'chips'); chips.style.marginTop = '12px';
      for (const m of [1, 3, 5]) {
        const c = U.el('button', 'chip nk-chip' + (m === mins ? ' on' : ''), m + ' phút'); c.type = 'button';
        c.onclick = () => { mins = m; sfx('ui'); chips.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === c)); };
        chips.appendChild(c);
      }
      body.appendChild(chips);
      openPanel({
        title: 'Ngồi thiền', body,
        actions: [
          { label: 'Bắt đầu', primary: true, onClick: () => { closePanel(); startThien(mins); } },
          { label: 'Quay lại', onClick: () => { closePanel(); showMenu(); } },
        ],
      }, showMenu);
    }

    function startThien(mins) {
      if (r.dead || leaving) return;
      const s = newScreen();
      const total = mins * 60;
      let el = 0, shown = -1, ended = false, committed = false;
      const layer = mkLayer(s);
      layer.classList.add('nk-med');
      layer.addEventListener('pointerdown', (e) => e.preventDefault());   // chạm vào màn hình: không làm gì
      layer.addEventListener('contextmenu', (e) => e.preventDefault());
      layer.appendChild(U.el('div', 'nk-vig'));
      const tm = U.el('div', 'nk-time');
      const bw = U.el('div', 'nk-bw');
      const cap = U.el('div', 'nk-bcap');
      cap.append(U.el('span', 'i', 'Hít vào…'), U.el('span', 'o', 'Thở ra…'));
      bw.append(U.el('div', 'nk-breath'), cap);
      layer.append(tm, bw);
      const mmss = (n) => Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0');
      // Ghi sổ số phút đã ngồi (kể cả khi kết thúc sớm); chưa tới nửa phút thì không ghi
      function commit() {
        if (committed) return;
        committed = true;
        const secs = Math.min(el, total), whole = Math.floor(secs / 60);
        if (secs < 30) return;
        const d = G.save.data, o = d.thien && typeof d.thien === 'object' ? d.thien : {};
        d.thien = { lan: (o.lan | 0) + 1, phut: (o.phut | 0) + whole };
        persist();
      }
      s.onEnd = commit;
      function showEnd() {
        const whole = Math.floor(Math.min(el, total) / 60);
        commit();
        endScreen();
        showThienResult(whole);
      }
      mkClose(layer, () => { if (s.dead || r.dead || ended) return; ended = true; showEnd(); });   // × : kết thúc sớm, vẫn tính số phút đã ngồi
      function natural() {
        el = total; commit();
        let k = 0;
        const stroke = () => {
          if (s.dead) return;
          sfx('khanh'); k++;
          after(1.4, k < 3 ? stroke : () => { if (!s.dead) showEnd(); });
        };
        stroke();
      }
      s.update = (dt) => {
        if (ended || document.hidden) return;
        el += dt;
        const left = Math.max(0, Math.ceil(total - el));
        if (left !== shown) { shown = left; tm.textContent = mmss(left); }
        if (el >= total) { ended = true; natural(); }
      };
      tm.textContent = mmss(total); shown = total;
      P.poseParam = 0; P.setPose('sit');
      sfx('bowlBell');
    }

    function showThienResult(whole) {
      if (r.dead || leaving) return;
      P.poseParam = 0; P.setPose('sit');
      const body = U.el('div', 'center');
      body.append(U.el('div', 'aa-line', whole >= 1 ? 'Bạn đã ngồi thiền ' + whole + ' phút.' : 'Bạn đã ngồi lặng một lúc.'), U.el('div', 'note', 'Tâm an là vui rồi.'));
      openPanel({
        title: 'Hết thời thiền', body,
        actions: [
          { label: 'Ngồi tiếp', primary: true, onClick: () => { closePanel(); showMenu(); } },
          { label: 'Đứng dậy', onClick: () => { closePanel(); r.leave(); } },
        ],
      }, showMenu);
    }
  }

  // Gỡ lỗi / kiểm thử
  G.ngoi = { poi, camFor, CAM, get seatIdx() { return seatIdx; }, get busy() { return busy; }, start: startNgoi };
}
