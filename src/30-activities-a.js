// =====================================================================
//  HOẠT ĐỘNG 1–3: THẮP HƯƠNG · THỈNH CHUÔNG · GÕ MÕ TỤNG KINH
//  Ba hoạt động nhẹ nhàng, không thắng thua. Mỗi phiên tự dọn lớp phủ,
//  trình nghe sự kiện, vật thể 3D, khói và quầng sáng khi kết thúc.
// =====================================================================
function installActivitiesA(G) {
  const { THREE, util: U } = G;
  const PI = Math.PI, TAU = PI * 2;
  const V3 = THREE.Vector3;
  const W = G.world;
  const sfx = (name, o) => { try { if (G.audio && G.audio.play) G.audio.play(name, o); } catch (e) { /* âm thanh lỗi thì bỏ qua */ } };
  const vib = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* thiết bị không hỗ trợ */ } };

  // =====================================================================
  //  KIỂU DÁNG: lớp phủ trò nhỏ, nút chọn, kết quả (nâu ấm – vàng kim)
  // =====================================================================
  G.ui.addStyle(`
  .aa-layer{position:absolute;inset:0;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none;cursor:pointer;animation:aa-fade .4s ease-out both}
  #overlay > .aa-passive{pointer-events:none;cursor:default}
  .aa-x{position:absolute;right:calc(12px + var(--sr));top:calc(58px + var(--st));width:48px;height:48px;border-radius:50%;border:1px solid var(--line);
    background:var(--panel);color:var(--gold2);font-size:26px;line-height:1;padding:0;display:grid;place-items:center;box-shadow:var(--shadow);cursor:pointer;pointer-events:auto}
  .aa-x:active{transform:scale(.94)}
  .aa-cap{position:absolute;left:50%;top:calc(128px + var(--st));transform:translateX(-50%);width:max-content;max-width:min(88vw,520px);text-align:center;
    font-family:var(--serif);font-size:19px;line-height:1.45;color:var(--cream);background:rgba(42,24,14,.68);border:1px solid var(--line);border-radius:18px;
    padding:9px 18px;text-shadow:0 1px 2px rgba(0,0,0,.5);pointer-events:none;opacity:0;transition:opacity .4s}
  .aa-cap.on{animation:aa-cap 1s ease-out both}
  .aa-cap.small{top:calc(172px + var(--st));font-size:14px;padding:6px 14px;color:var(--muted)}
  @media (max-height:520px){.aa-cap.small{display:none}}
  .aa-count{position:absolute;left:50%;top:calc(66px + var(--st));transform:translateX(-50%);font-family:var(--serif);font-weight:700;font-size:18px;color:var(--gold2);
    background:rgba(42,24,14,.72);border:1px solid var(--line);border-radius:20px;padding:6px 16px;pointer-events:none;white-space:nowrap}
  .aa-dots{position:absolute;left:50%;top:calc(106px + var(--st));transform:translateX(-50%);display:flex;gap:10px;pointer-events:none}
  .aa-dots i{width:12px;height:12px;border-radius:50%;border:2px solid var(--gold);background:transparent;transition:background .3s,box-shadow .3s}
  .aa-dots i.on{background:var(--gold2);box-shadow:0 0 10px rgba(247,215,147,.8)}
  .aa-pad{position:absolute;left:50%;width:0;height:0;pointer-events:none}
  .aa-pad canvas{position:absolute;left:0;top:0;transform:translate(-50%,-50%);pointer-events:none}
  .aa-target{position:absolute;left:0;top:0;width:88px;height:88px;margin:-44px 0 0 -44px;border-radius:50%;border:3px solid var(--gold2);
    background:radial-gradient(circle,rgba(247,215,147,.28),rgba(42,24,14,.62) 70%);box-shadow:0 0 0 5px rgba(42,24,14,.35),0 0 22px rgba(247,215,147,.35);
    display:grid;place-items:center;pointer-events:none}
  .aa-target svg{width:44px;height:44px;fill:none;stroke:var(--gold2);stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
  .aa-target.hit{animation:aa-hit .26s ease-out}
  .aa-target.beat{animation:aa-beat .32s ease-out}
  .aa-float{position:absolute;left:0;top:0;white-space:nowrap;font-family:var(--serif);font-weight:700;font-size:21px;text-shadow:0 2px 6px rgba(0,0,0,.65);
    pointer-events:none;animation:aa-float 1.1s ease-out forwards}
  .aa-float.g1{color:#ffe08a}.aa-float.g2{color:#a8e0c0}.aa-float.g3{color:#c9d8f2}
  .aa-bar{position:absolute;left:50%;top:calc(68px + var(--st));transform:translateX(-50%);width:min(44vw,240px);height:6px;border-radius:3px;
    background:rgba(255,255,255,.18);overflow:hidden;pointer-events:none}
  .aa-bar i{display:block;height:100%;width:100%;background:linear-gradient(90deg,var(--gold),var(--gold2));transform-origin:left center;transform:scaleX(0)}
  .aa-kara,.aa-cnt{position:absolute;left:50%;top:calc(112px + var(--st));transform:translateX(-50%);display:flex;align-items:baseline;justify-content:center;
    font-family:var(--serif);font-weight:700;font-size:22px;color:rgba(251,238,215,.62);background:rgba(42,24,14,.62);border:1px solid var(--line);
    border-radius:22px;padding:6px 12px;pointer-events:none;white-space:nowrap}
  .aa-kara span{display:inline-block;padding:0 4px;transition:color .12s,transform .12s,text-shadow .12s}
  .aa-kara span.s{padding:0 1px;opacity:.5}
  .aa-kara span.on{color:var(--gold2);transform:scale(1.2);text-shadow:0 0 12px rgba(247,215,147,.85)}
  .aa-cnt{font-size:30px;padding:3px 22px}
  .aa-cnt span{display:inline-block;padding:0 9px;opacity:.4;transition:opacity .15s,transform .15s}
  .aa-cnt span.on{opacity:1;color:var(--gold2);transform:scale(1.3)}
  .aa-cnt span.s{opacity:.35;padding:0 2px}
  .aa-choices{display:flex;flex-direction:column;gap:10px;margin-top:8px}
  .aa-choice{display:flex;align-items:center;gap:14px;text-align:left;min-height:68px;width:100%;padding:10px 14px;border-radius:16px;border:1px solid var(--line);
    background:rgba(255,255,255,.07);color:var(--cream);font-size:15px}
  .aa-choice:active{transform:scale(.98);background:rgba(255,255,255,.12)}
  .aa-choice b{display:block;font-family:var(--serif);font-size:19px;color:var(--gold2)}
  .aa-choice small{display:block;color:var(--muted);font-size:13.5px;margin-top:2px;line-height:1.35}
  .aa-sticks{flex:none;width:54px;height:48px;display:flex;align-items:flex-end;justify-content:center;gap:6px}
  .aa-sticks i{display:block;width:4px;border-radius:2px;background:linear-gradient(180deg,#ffb060 0,#ffb060 9%,#8c2a1c 9%)}
  .aa-res{display:flex;flex-direction:column;gap:10px;margin:8px 0 10px}
  .aa-res .row{justify-content:space-between}
  .aa-chip{display:inline-block;padding:3px 12px;border-radius:14px;font-weight:700;font-size:14px;border:1px solid var(--line)}
  .aa-chip.g1{color:#ffe08a;background:rgba(255,224,138,.12)}.aa-chip.g2{color:#a8e0c0;background:rgba(168,224,192,.1)}.aa-chip.g3{color:#c9d8f2;background:rgba(201,216,242,.1)}
  .aa-score{font-family:var(--serif);font-size:34px;font-weight:700;color:var(--gold2);text-align:center;margin:6px 0 10px;text-shadow:0 0 18px rgba(247,215,147,.35)}
  .aa-line{text-align:center;color:var(--cream);font-family:var(--serif);font-size:17px;line-height:1.5;margin:8px 0}
  .aa-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:6px 0 4px}
  .aa-stats div{background:rgba(255,255,255,.05);border:1px solid var(--line);border-radius:12px;padding:8px 4px;text-align:center}
  .aa-stats b{display:block;font-size:22px;font-family:var(--serif)}
  .aa-stats span{font-size:12.5px;color:var(--muted)}
  @keyframes aa-fade{from{opacity:0}to{opacity:1}}
  @keyframes aa-cap{0%{opacity:0;transform:translateX(-50%) translateY(8px)}22%,100%{opacity:1;transform:translateX(-50%)}}
  @keyframes aa-hit{0%{transform:scale(1)}30%{transform:scale(.9)}100%{transform:scale(1)}}
  @keyframes aa-beat{0%{box-shadow:0 0 0 5px rgba(42,24,14,.35),0 0 40px rgba(247,215,147,.85)}100%{box-shadow:0 0 0 5px rgba(42,24,14,.35),0 0 22px rgba(247,215,147,.35)}}
  @keyframes aa-float{0%{opacity:0;transform:translate(-50%,-30%) scale(.85)}18%{opacity:1;transform:translate(-50%,-60%) scale(1.06)}100%{opacity:0;transform:translate(-50%,-190%) scale(1)}}
  `);

  // =====================================================================
  //  PHIÊN CHẠY: gom mọi thứ cần dọn (trình nghe, hàm khung, lớp phủ…)
  //  và bảo đảm G.activity.end() được gọi đúng một lần ở MỌI lối thoát
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
    r.on('escape', () => { if (r.leave) r.leave(); else r.exit(); });
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
  G.onUpdate((dt) => {
    for (let i = frameFns.length - 1; i >= 0; i--) {
      try { frameFns[i](dt); } catch (e) { console.error(e); if (run) run.exit(); }
    }
  }, 30);

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
  function mkLayer(r, passive) {
    const el = U.el('div', 'aa-layer' + (passive ? ' aa-passive' : ''));
    G.ui.overlay.appendChild(el);
    r.defer(() => el.remove());
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
  function mkCaption(layer, small) {
    const el = U.el('div', 'aa-cap' + (small ? ' small' : '')); el.setAttribute('aria-live', 'polite');
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
  // Vòng tròn đích + vẽ vòng sáng thu nhỏ trên canvas (nét luôn đều, không phình khi co)
  function makePad(layer, icon) {
    const o = { R0: 130, R1: 46, size: 0, dpr: 1 };
    o.pad = U.el('div', 'aa-pad');
    o.target = U.el('div', 'aa-target'); o.target.innerHTML = G.icons[icon] || '';
    o.cv = document.createElement('canvas');
    o.c2 = o.cv.getContext('2d');
    o.pad.append(o.target, o.cv);
    layer.appendChild(o.pad);
    o.layout = () => {
      o.R0 = U.clamp(Math.min(G.size.w * 0.36, G.size.h * 0.27), 92, 142);
      o.size = Math.ceil((o.R0 + 16) * 2);
      o.dpr = Math.min(window.devicePixelRatio || 1, 2);
      o.cv.width = Math.round(o.size * o.dpr); o.cv.height = o.cv.width;
      o.cv.style.width = o.size + 'px'; o.cv.style.height = o.size + 'px';
      if (o.c2) o.c2.setTransform(o.dpr, 0, 0, o.dpr, 0, 0);
      o.pad.style.bottom = 'calc(' + Math.round(Math.max(o.R0 + 22, 150)) + 'px + var(--sb))';
    };
    o.clear = () => { if (o.c2) o.c2.clearRect(0, 0, o.size, o.size); };
    o.ring = (rad, a) => {
      const c = o.c2; if (!c || a <= 0.01) return;
      const m = o.size / 2;
      c.globalAlpha = a * 0.28; c.lineWidth = 11; c.strokeStyle = '#ffcf6e';
      c.beginPath(); c.arc(m, m, rad, 0, TAU); c.stroke();
      c.globalAlpha = a; c.lineWidth = 3.5; c.strokeStyle = '#ffeebb';
      c.beginPath(); c.arc(m, m, rad, 0, TAU); c.stroke();
      c.globalAlpha = 1;
    };
    o.layout();
    return o;
  }
  // Chữ nhỏ bay lên gần chiếc mõ / vòng tròn (đánh giá nhẹ nhàng)
  function addFloater(pad, list, text, cls) {
    const el = U.el('div', 'aa-float ' + cls, text);
    el.style.top = -(pad.R1 + 46) + 'px';
    pad.pad.appendChild(el);
    list.push({ el, age: 0 });
    while (list.length > 5) list.shift().el.remove();
  }
  function updateFloaters(list, dt) {
    for (let i = list.length - 1; i >= 0; i--) {
      const f = list[i]; f.age += dt;
      if (f.age > 1.15) { f.el.remove(); list.splice(i, 1); }
    }
  }

  // =====================================================================
  //  1) THẮP HƯƠNG — nén hương dùng chung hình khối, một bể quầng sáng
  // =====================================================================
  const STICK_LEN = 0.55, STICK_END = 0.07, ASH_LEN = 0.035;
  const MAX_PLANTED = 15, BURN_SEC = 240, GLOW_N = 32;
  const stickGeo = new THREE.CylinderGeometry(0.011, 0.012, 1, 5).translate(0, 0.5, 0);
  const ashGeo = new THREE.CylinderGeometry(0.0125, 0.011, 1, 5).translate(0, 0.5, 0);
  const emberGeo = new THREE.SphereGeometry(0.018, 6, 4);
  const stickMat = new THREE.MeshLambertMaterial({ color: 0x8c2a1c });
  const ashMat = new THREE.MeshLambertMaterial({ color: 0x9d988f });
  const emberMat = new THREE.MeshBasicMaterial({ color: 0xff8a3a });
  const SMOKE_OPT = { rate: 1.6, size: 0.1, grow: 0.14, alpha: 0.18, rise: 0.42, life: 3.4, spread: 0.012 };

  const sticks = [];          // mọi nén: cầm tay / đang bay / cắm trong lư / đang tàn
  let glow = null;            // bể quầng sáng dùng chung cho đầu hương
  let glowDirty = false;
  const freeSlots = [];
  const _tp = new V3(), _to = new V3(), _eu = new THREE.Euler();

  function ensureGlow() {
    if (glow || !G.fx || !G.fx.glowPoints) return;
    glow = G.fx.glowPoints(GLOW_N, { flicker: 1, intensity: 1 });
    for (let i = GLOW_N - 1; i >= 0; i--) freeSlots.push(i);
  }
  function makeStick() {
    const g = new THREE.Group();
    const red = new THREE.Mesh(stickGeo, stickMat);
    const ash = new THREE.Mesh(ashGeo, ashMat);
    const tip = new THREE.Object3D();
    const ember = new THREE.Mesh(emberGeo, emberMat);
    tip.add(ember); g.add(red, ash, tip);
    ember.visible = false; ash.visible = false;
    const s = {
      g, red, ash, tip, ember, state: 'held', slot: -1, smoke: null, litting: false, lit: 0,
      burn: 0, dur: BURN_SEC, fade: 0, fadeDur: 1, h: STICK_LEN,
      spot: false, sx: 0, sz: 0, tiltX: 0, tiltZ: 0, yawR: 0,
      from: new V3(), qFrom: new THREE.Quaternion(), qTo: new THREE.Quaternion(),
    };
    setStickLen(s, STICK_LEN);
    return s;
  }
  // Nén ngắn dần: phần đỏ thấp xuống, tro xám nằm ngay trên đầu cháy
  function setStickLen(s, h) {
    s.h = h;
    s.red.scale.set(1, h, 1);
    s.ash.position.y = h; s.ash.scale.set(1, ASH_LEN, 1);
    s.tip.position.y = h + 0.004;
  }
  function lightStick(s) {
    ensureGlow();
    s.litting = true; s.ember.visible = true; s.ash.visible = true;
    s.ember.scale.setScalar(0.35);
    if (glow && s.slot < 0 && freeSlots.length) s.slot = freeSlots.pop();
    if (!s.smoke && G.fx && G.fx.addSmokeSource) s.smoke = G.fx.addSmokeSource(s.tip, SMOKE_OPT);
  }
  function fadeStick(s, dur) {
    if (s.state === 'fading') return;
    s.state = 'fading'; s.fade = 0; s.fadeDur = dur;
    if (s.smoke) { s.smoke.remove(); s.smoke = null; }
  }
  function disposeStick(s) {
    if (s.smoke) { s.smoke.remove(); s.smoke = null; }
    if (s.slot >= 0 && glow) { glow.hide(s.slot); freeSlots.push(s.slot); s.slot = -1; glowDirty = true; }
    if (s.g.parent) s.g.parent.remove(s.g);
    const i = sticks.indexOf(s); if (i >= 0) sticks.splice(i, 1);
    // hình khối và vật liệu dùng chung nên không giải phóng ở đây
  }
  function countPlanted() {
    let n = 0;
    for (let i = 0; i < sticks.length; i++) if (sticks[i].state === 'planted' || sticks[i].state === 'flying') n++;
    return n;
  }
  // Tối đa 24 nén của người chơi cắm trong lư: nén cũ nhất tàn đi nhường chỗ
  function makeRoom(n) {
    let guard = 0;
    while (countPlanted() + n > MAX_PLANTED && guard++ < 40) {
      let old = null;
      for (let i = 0; i < sticks.length; i++) if (sticks[i].state === 'planted') { old = sticks[i]; break; }
      if (!old) break;
      fadeStick(old, 0.6);
    }
  }
  // Chọn chỗ cắm ở nửa phía nam (gần người chơi), cách xa các nén khác
  function assignSpot(s) {
    const B = W.burner, R = B.sandR - 0.07;
    let bx = B.x, bz = B.z + R * 0.5, bd = -1;
    for (let c = 0; c < 12; c++) {
      const a = U.rand(0.08, 0.92) * PI, rr = Math.sqrt(U.rand(0.05, 1)) * R;
      const x = B.x + Math.cos(a) * rr, z = B.z + Math.sin(a) * rr;
      let d = 9;
      for (let i = 0; i < sticks.length; i++) {
        const o = sticks[i];
        if (o !== s && o.spot && o.state !== 'fading') d = Math.min(d, Math.hypot(x - o.sx, z - o.sz));
      }
      if (d > bd) { bd = d; bx = x; bz = z; }
    }
    s.sx = bx; s.sz = bz; s.spot = true;
    s.tiltX = U.rand(-0.12, 0.12); s.tiltZ = U.rand(-0.12, 0.12); s.yawR = U.rand(0, TAU);
  }
  function beginFlight(s) {
    G.scene.attach(s.g); // giữ nguyên vị trí thế giới khi rời khỏi bàn tay
    s.from.copy(s.g.position); s.qFrom.copy(s.g.quaternion);
    _eu.set(s.tiltX, s.yawR, s.tiltZ); s.qTo.setFromEuler(_eu);
    s.state = 'flying';
  }
  function flyStick(s, k) {
    const e = G.ease.inOut(k);
    _to.set(s.sx, W.burner.sandY, s.sz);
    s.g.position.lerpVectors(s.from, _to, e);
    s.g.position.y += Math.sin(PI * e) * 0.28;
    s.g.quaternion.copy(s.qFrom).slerp(s.qTo, e);
  }
  function plantNow(s) {
    if (!s.spot) assignSpot(s);
    if (s.g.parent !== G.scene) G.scene.add(s.g);
    s.g.scale.setScalar(1);
    s.g.position.set(s.sx, W.burner.sandY, s.sz);
    _eu.set(s.tiltX, s.yawR, s.tiltZ); s.g.quaternion.setFromEuler(_eu);
    s.state = 'planted'; s.burn = 0; s.dur = BURN_SEC * U.rand(0.92, 1.08);
  }
  // Mỗi khung: sáng dần, cháy ngắn dần, tàn dần, cập nhật quầng sáng ở đầu hương
  function updateSticks(dt) {
    if (!sticks.length) { if (glowDirty && glow) { glow.commit(); glowDirty = false; } return; }
    const gi = 0.85 + (G.tod ? G.tod.night : 0) * 0.45;
    for (let i = sticks.length - 1; i >= 0; i--) {
      const s = sticks[i];
      if (s.litting && s.lit < 1) { s.lit = Math.min(1, s.lit + dt / 0.9); s.ember.scale.setScalar(0.35 + 0.65 * s.lit); }
      let fa = 1;
      if (s.state === 'planted') {
        s.burn += dt;
        const k = s.burn / s.dur;
        if (k >= 1) fadeStick(s, 1.4); else setStickLen(s, STICK_LEN + (STICK_END - STICK_LEN) * k);
      }
      if (s.state === 'fading') {
        s.fade += dt / s.fadeDur;
        if (s.fade >= 1) { disposeStick(s); continue; }
        fa = 1 - s.fade; s.g.scale.setScalar(Math.max(0.001, 1 - s.fade));
      }
      if (glow && s.slot >= 0) {
        s.tip.getWorldPosition(_tp);
        glow.set(s.slot, _tp.x, _tp.y + 0.01, _tp.z, 0.16 + 0.05 * s.lit, 1.0, 0.4, 0.13, s.lit * fa * gi);
      }
    }
    if (glow) { glow.commit(); glowDirty = false; }
  }
  G.onUpdate(updateSticks, 32);

  function startIncense() {
    if (busy || G.activity.current) return;
    busy = true;
    let chosen = false;
    let pan = null;
    const body = U.el('div');
    body.appendChild(U.el('div', 'muted', 'Chọn số nén hương bạn muốn thắp. Thong thả thôi, không cần vội.'));
    const list = U.el('div', 'aa-choices');
    const mk = (n, title, sub) => {
      const b = U.el('button', 'aa-choice'); b.type = 'button';
      const ic = U.el('span', 'aa-sticks');
      for (const h of (n === 1 ? [40] : [34, 44, 34])) { const i = document.createElement('i'); i.style.height = h + 'px'; ic.appendChild(i); }
      const tx = U.el('span'); tx.append(U.el('b', null, title), U.el('small', null, sub));
      b.append(ic, tx);
      b.addEventListener('click', () => {
        if (chosen) return;
        chosen = true; sfx('ui'); pan.close();
        launch('incense', () => runIncense(n));
      });
      return b;
    };
    list.append(mk(1, '1 nén', 'Một nén tâm hương thành kính'), mk(3, '3 nén', 'Ba nén: Phật – Pháp – Tăng'));
    body.appendChild(list);
    body.appendChild(U.el('div', 'note', 'Hương cắm vào lư sẽ tàn dần sau vài phút.'));
    pan = G.ui.panel({
      title: 'Thắp hương', body,
      actions: [{ label: 'Để sau', onClick: (close) => close() }],
      onClose: () => { if (!chosen) busy = false; },
    });
  }

  async function runIncense(n) {
    const B = W.burner, P = G.player;
    if (!G.activity.begin('incense', { cam: B.cam })) { busy = false; return; }
    const r = newRun('incense');
    const mine = [];
    let lighted = false, credited = false;
    const layer = mkLayer(r, true);
    const cap = mkCaption(layer);
    mkClose(layer, () => r.exit());
    r.defer(() => {
      // Thoát giữa chừng: nén đã châm thì cắm ngay vào lư, chưa châm thì gỡ bỏ
      for (const s of mine.slice()) {
        if (s.state === 'held' || s.state === 'flying') { if (lighted) plantNow(s); else disposeStick(s); }
      }
      if (lighted && !credited) {
        credited = true;
        const d = G.save.data;
        d.incense = (d.incense || 0) + 1; d.incenseSticks = (d.incenseSticks || 0) + n;
        G.save.persist();
        G.ui.toast('Bạn đã thắp ' + n + ' nén hương. Mong bình an đến với bạn và gia đình.', 4600);
      }
    });

    if (!(await goTo(r, B.stand))) return;
    // nén hương trên tay: hơi xoè ra khi cầm ba nén
    for (let i = 0; i < n; i++) {
      const s = makeStick(), o = i - (n - 1) / 2;
      s.g.position.set(o * 0.034, -0.1, 0); s.g.rotation.set(0, 0, -o * 0.1);
      P.handsMid.add(s.g); sticks.push(s); mine.push(s);
    }
    P.poseParam = 0; P.setPose('incense');
    cap.say('Chắp tay, hướng lòng về điều lành…');
    if (!(await r.sleep(1.2))) return;
    // châm hương: đầu hương sáng lên, khói nhẹ bốc lên
    lighted = true; sfx('incense');
    for (const s of mine) lightStick(s);
    if (!(await r.sleep(1.2))) return;
    // ba lần lạy chậm (mỗi lần 2,4 giây)
    P.poseT = 0; P.poseParam = 1;
    if (!(await r.sleep(3.6))) return;
    cap.say('Nguyện cho người thân luôn bình an');
    if (!(await r.sleep(3.6))) return;
    // đưa hương vào lư
    cap.say('');
    P.poseParam = 0; P.setPose('offer');
    makeRoom(n);
    for (const s of mine) { assignSpot(s); beginFlight(s); }
    const T = 0.95 + (n - 1) * 0.16;
    const ok = await r.tween(T, (e, k) => {
      for (let i = 0; i < mine.length; i++) flyStick(mine[i], U.clamp((k * T - i * 0.16) / 0.95, 0, 1));
    });
    if (!ok) return;
    for (const s of mine) plantNow(s);
    P.setPose('pray');
    if (!(await r.sleep(1.5))) return;
    r.exit(); // phần ghi sổ và lời chúc nằm trong hàm dọn ở trên
  }

  // =====================================================================
  //  2) THỈNH CHUÔNG — vòng sáng khép dần; chạm là chày gỗ đánh vào chuông
  // =====================================================================
  const BELL_APPROACH = 1.5, BELL_LINGER = 0.4, BELL_CYCLE = BELL_APPROACH + BELL_LINGER, BELL_COOLDOWN = 2.2;
  const BELL_GRADE = {
    perfect: { name: 'Ngân vang', cls: 'g1' },
    good: { name: 'Tốt', cls: 'g2' },
    early: { name: 'Hơi sớm', cls: 'g3' },
    late: { name: 'Hơi muộn', cls: 'g3' },
  };
  // Vật lý nhẹ cho chày gỗ (lò xo giảm chấn) và chuông đung đưa — chạy mãi cho tới khi lặng
  const bellPhys = { z: 0, v: 0, drive: false };
  const sway = { z: 0, vz: 0, x: 0, vx: 0, on: false };
  G.onUpdate((dt) => {
    const BL = W.bell; if (!BL) return;
    const bp = bellPhys;
    if (bp.drive) BL.swing.rotation.z = bp.z;
    else if (bp.z !== 0 || bp.v !== 0) {
      let rem = dt;
      while (rem > 0) {
        const h = Math.min(rem, 1 / 60); rem -= h;
        bp.v += (-70 * bp.z - 12 * bp.v) * h; bp.z += bp.v * h;
        if (bp.z < BL.strikeTheta) { bp.z = BL.strikeTheta; if (bp.v < 0) bp.v = 0; } // chạm mặt chuông thì dừng
      }
      if (Math.abs(bp.z) < 5e-4 && Math.abs(bp.v) < 5e-3) { bp.z = 0; bp.v = 0; }
      BL.swing.rotation.z = bp.z;
    }
    if (sway.on) {
      let rem = dt;
      while (rem > 0) {
        const h = Math.min(rem, 1 / 60); rem -= h;
        sway.vz += (-14 * sway.z - 0.9 * sway.vz) * h; sway.z += sway.vz * h;
        sway.vx += (-19 * sway.x - 1.1 * sway.vx) * h; sway.x += sway.vx * h;
      }
      if (Math.abs(sway.z) + Math.abs(sway.x) + Math.abs(sway.vz) + Math.abs(sway.vx) < 4e-4) { sway.z = sway.x = sway.vz = sway.vx = 0; sway.on = false; }
      BL.pivot.rotation.z = sway.z; BL.pivot.rotation.x = sway.x;
    }
  }, 31);

  // Vòng gợn sóng vàng nhạt lan ra từ chỗ chày chạm chuông (bể nhỏ, tự giải phóng khi xong)
  function makeRipples(r, pos) {
    const geo = new THREE.RingGeometry(0.9, 1.0, 48);
    const list = [];
    for (let i = 0; i < 4; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, side: THREE.DoubleSide, fog: false });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false; mesh.renderOrder = 9; mesh.frustumCulled = false; mesh.position.copy(pos);
      G.scene.add(mesh);
      list.push({ mesh, mat, age: 0, dur: 1.3, peak: 0.6, max: 1.4, on: false });
    }
    r.defer(() => { for (const q of list) { G.scene.remove(q.mesh); q.mat.dispose(); } geo.dispose(); });
    return {
      spawn(delay, peak, max, dur) {
        for (let i = 0; i < list.length; i++) {
          const q = list[i];
          if (!q.on) { q.on = true; q.age = -delay; q.peak = peak; q.max = max; q.dur = dur; q.mesh.visible = false; return; }
        }
      },
      update(dt) {
        for (let i = 0; i < list.length; i++) {
          const q = list[i]; if (!q.on) continue;
          q.age += dt;
          if (q.age < 0) continue;
          const k = q.age / q.dur;
          if (k >= 1) { q.on = false; q.mesh.visible = false; continue; }
          q.mesh.visible = true;
          q.mesh.scale.setScalar(0.2 + (q.max - 0.2) * (1 - Math.pow(1 - k, 3)));
          q.mat.opacity = q.peak * (1 - k) * (1 - k);
          q.mesh.quaternion.copy(G.camera.quaternion);
        }
      },
    };
  }

  function startBell() {
    if (busy || G.activity.current) return;
    busy = true;
    launch('bell', runBell);
  }

  async function runBell() {
    const B = W.bell, P = G.player, bp = bellPhys;
    if (!G.activity.begin('bell', { cam: B.cam })) { busy = false; return; }
    const r = newRun('bell');
    const results = [];
    let mode = 'wait';            // wait | pull | hit | cool | done
    let pull = 0, ringT0 = 0, tapOkAt = 0, tapRes = null, pan = null;
    const floaters = [];
    r.defer(() => {
      bp.drive = false; bp.v = 0;   // chày tự về chỗ cũ nhờ lò xo
      P.poseParam = 0;
      if (tapRes) { const f = tapRes; tapRes = null; f(null); }
      if (pan) { const p = pan; pan = null; p.close(); }
    });

    // --- lớp phủ: cả màn hình là vùng chạm ---
    const layer = mkLayer(r, false);
    layer.addEventListener('pointerdown', (e) => { e.preventDefault(); onTap(); });
    r.on('key:action', () => onTap());
    mkClose(layer, () => r.exit());
    const count = U.el('div', 'aa-count', 'Tiếng chuông 1/3');
    const dots = U.el('div', 'aa-dots');
    const dotEls = [0, 1, 2].map(() => dots.appendChild(document.createElement('i')));
    const cap = mkCaption(layer);
    layer.append(count, dots);
    const pad = makePad(layer, 'bell');
    r.on('resize', pad.layout);
    const rip = makeRipples(r, B.hitPoint);

    function beginRing() {
      pull = 0; ringT0 = performance.now(); tapOkAt = ringT0 + 250;
      bp.v = 0; bp.drive = true; bp.z = 0; mode = 'pull';
    }
    function waitTap() { return new Promise((res) => { tapRes = res; }); }
    function onTap() {
      if (mode !== 'pull' || !tapRes) return;
      const now = performance.now();
      if (now < tapOkAt) return;
      const delta = ((now - ringT0) / 1000) % BELL_CYCLE - BELL_APPROACH, ad = Math.abs(delta); // âm = sớm
      const grade = ad <= 0.11 ? 'perfect' : ad <= 0.26 ? 'good' : delta < 0 ? 'early' : 'late';
      mode = 'hit'; pad.clear();
      const f = tapRes; tapRes = null; f({ grade, pull });
    }
    r.frame((dt) => {
      rip.update(dt); updateFloaters(floaters, dt);
      if (mode !== 'pull') return;
      const tc = ((performance.now() - ringT0) / 1000) % BELL_CYCLE;
      const p = tc < BELL_APPROACH ? tc / BELL_APPROACH : 1;
      pull = p >= pull ? p : U.damp(pull, p, 14, dt);
      bp.drive = true; bp.z = 0.5 * pull;       // chày kéo ngược ra sau
      P.poseParam = pull;                       // người kéo dây
      pad.clear();
      const a = tc < BELL_APPROACH ? Math.min(1, tc / 0.3) : Math.max(0, 1 - (tc - BELL_APPROACH) / BELL_LINGER);
      pad.ring(pad.R1 + (pad.R0 - pad.R1) * (1 - p), a);
    });

    async function strike(res) {
      const perfect = res.grade === 'perfect';
      const z0 = bp.z, p0 = res.pull;
      // chày vung tới chuông (0,16 giây)
      if (!(await r.tween(0.16, (e) => { bp.z = U.lerp(z0, B.strikeTheta, e); P.poseParam = p0 * (1 - e); }, G.ease.in))) return false;
      const strength = perfect ? 1 : res.grade === 'good' ? 0.82 : res.grade === 'late' ? 0.68 : 0.4 + 0.45 * p0;
      sfx('bell', { strength, perfect });
      bp.drive = false; bp.z = B.strikeTheta; bp.v = perfect ? 1.5 : 1.1; // bật ngược lại, giảm chấn
      P.poseParam = 0;
      sway.vz -= perfect ? 0.26 : 0.1 + 0.1 * strength; sway.vx += (results.length % 2 ? -1 : 1) * 0.04; sway.on = true;
      G.cam.shake(perfect ? 0.18 : 0.08, 0.5);
      vib(perfect ? 60 : 25);
      rip.spawn(0, perfect ? 0.7 : 0.45, perfect ? 1.7 : 1.2, 1.4);
      rip.spawn(0.16, perfect ? 0.5 : 0.3, perfect ? 2.2 : 1.5, 1.5);
      if (perfect) rip.spawn(0.34, 0.35, 2.7, 1.6);
      results.push(res.grade);
      dotEls[results.length - 1].classList.add('on');
      addFloater(pad, floaters, BELL_GRADE[res.grade].name, BELL_GRADE[res.grade].cls);
      return true;
    }

    if (!(await goTo(r, B.stand))) return;
    P.poseParam = 0; P.setPose('strike');
    cap.say(G.isTouch ? 'Chạm khi vòng sáng khép vào vòng tròn' : 'Bấm chuột hoặc phím Space khi vòng sáng khép vào vòng tròn');
    if (!(await r.sleep(0.9))) return;
    for (let i = 0; i < 3; i++) {
      count.textContent = 'Tiếng chuông ' + (i + 1) + '/3';
      beginRing();
      const res = await waitTap();
      if (!res || r.dead) return;
      if (i === 0) cap.say('');
      if (!(await strike(res))) return;
      mode = 'cool';
      if (!(await r.sleep(BELL_COOLDOWN - 0.16))) return; // để tiếng chuông ngân hết
    }
    // xong ba tiếng: ghi sổ và hiện kết quả
    mode = 'done';
    layer.remove();
    const d = G.save.data;
    d.bell = (d.bell || 0) + 1;
    d.bellPerfect = (d.bellPerfect || 0) + results.filter((g) => g === 'perfect').length;
    G.save.persist();
    const body = U.el('div');
    const lst = U.el('div', 'aa-res');
    results.forEach((g, i) => {
      const row = U.el('div', 'row');
      row.append(U.el('span', null, 'Tiếng chuông thứ ' + (i + 1)), U.el('span', 'aa-chip ' + BELL_GRADE[g].cls, BELL_GRADE[g].name));
      lst.appendChild(row);
    });
    body.append(lst, U.el('div', 'aa-line', 'Tiếng chuông giúp tâm mình trở về hiện tại.'),
      U.el('div', 'note center', 'Hít vào thật chậm, thở ra thật chậm — nghe tiếng chuông tan dần.'));
    pan = G.ui.panel({
      title: 'Ba tiếng chuông đã ngân', body, clear: true,
      actions: [{ label: 'Xong', primary: true, onClick: (close) => close() }],
      onClose: () => { pan = null; r.exit(); },
    });
  }

  // =====================================================================
  //  3) GÕ MÕ TỤNG KINH — nhịp 70 BPM, 35 nhịp (~30 giây), đồng hồ chính xác
  // =====================================================================
  const MO_BPM = 70, MO_BEATS = 35, MO_COUNTIN = 3, MO_LEAD = 1.5;
  const MO_P = 60 / MO_BPM;                   // giây mỗi nhịp
  const MO_WIN = 0.25, MO_PERFECT = 0.09, MO_OK = 0.18, MO_RING = 1.3;
  const SEAT_LIFT = 0.2;                      // ngồi cao hơn một chút trên bồ đoàn để dùi chạm tới mõ
  const SYL = ['Nam', 'mô', 'A', 'Di', 'Đà', 'Phật'];
  const MO_GRADE = [{ name: 'Lệch nhịp', cls: 'g3' }, { name: 'Được', cls: 'g2' }, { name: 'Tĩnh tâm', cls: 'g1' }];
  const _k = new V3(), _up = new V3(0, 1, 0), _md = new V3(0, -0.3, 0.954).normalize();

  function audioNow() {
    try { const v = G.audio && typeof G.audio.now === 'function' ? G.audio.now() : NaN; return typeof v === 'number' ? v : NaN; } catch (e) { return NaN; }
  }
  // Giây hiện tại theo đồng hồ âm thanh nếu có (chính xác), nếu không thì performance.now
  function clockOf(x) {
    if (x.useAudio) {
      const ctx = G.audio && G.audio.ctx, a = ctx && ctx.state !== 'running' ? NaN : audioNow(); // tắt tiếng / bị tạm dừng: đồng hồ âm thanh đứng yên
      if (Number.isFinite(a)) { x.lastT = a; return a; }
      const pn = performance.now() / 1000; // đồng hồ âm thanh hỏng giữa chừng: chuyển sang đồng hồ trình duyệt, giữ nguyên tiến độ
      x.ts = pn - (x.lastT - x.ts); x.useAudio = false; x.lastT = pn; return pn;
    }
    const pn = performance.now() / 1000; x.lastT = pn; return pn;
  }
  const beatT = (x, i) => x.ts + (i + MO_COUNTIN) * MO_P;
  function praise(S) {
    if (S >= 90) return 'Tâm bạn tĩnh lặng như mặt hồ thu.';
    if (S >= 70) return 'Nhịp mõ đều đặn, lòng thật an.';
    if (S >= 40) return 'Mỗi tiếng mõ là một hơi thở chậm lại. Rất tốt!';
    return 'Không sao cả — quan trọng là bạn đã ngồi xuống và lắng lòng.';
  }
  // Dùi mõ: cán gỗ ngắn, đầu tròn; gắn vào bàn tay phải
  function makeMallet() {
    const handleGeo = new THREE.CylinderGeometry(0.014, 0.018, 0.26, 7);
    const knobGeo = new THREE.SphereGeometry(0.042, 10, 8);
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x9a6a3c });
    const knobMat = new THREE.MeshLambertMaterial({ color: 0x7a4a26 });
    const g = new THREE.Group();
    const h = new THREE.Mesh(handleGeo, woodMat); h.position.y = 0.075;
    const k = new THREE.Mesh(knobGeo, knobMat); k.position.y = 0.235; k.scale.set(1, 1.1, 1);
    const knob = new THREE.Object3D(); knob.position.y = 0.235;
    g.add(h, k, knob);
    g.quaternion.setFromUnitVectors(_up, _md); // chếch lên phía trước, sẵn sàng gõ xuống
    return { g, knob, dispose() { handleGeo.dispose(); knobGeo.dispose(); woodMat.dispose(); knobMat.dispose(); } };
  }

  function startMo() {
    if (busy || G.activity.current) return;
    busy = true;
    launch('mo', runMo);
  }

  async function runMo() {
    const H = W.hall, P = G.player, mo = H.mo;
    if (!G.activity.begin('mo', { cam: H.cam })) { busy = false; return; }
    const r = newRun('mo');
    const orig = { x: mo.position.x, y: mo.position.y, z: mo.position.z, s: mo.scale.x };
    let seated = false, moved = false, leaving = false, mallet = null, pan = null, rd = null;
    let moBase = orig.s, bounceT = 1;

    // --- dọn một ván (lớp phủ, trình nghe) ---
    function endRound() {
      if (!rd) return;
      const x = rd; rd = null;
      for (const f of x.cleanups) { try { f(); } catch (e) { console.error(e); } }
    }
    function disposeMallet() {
      if (!mallet) return;
      const m = mallet; mallet = null;
      if (m.g.parent) m.g.parent.remove(m.g);
      m.dispose();
    }
    function restoreMo() {
      mo.position.set(orig.x, orig.y, orig.z); mo.scale.setScalar(orig.s); moved = false; moBase = orig.s;
    }
    r.defer(() => {
      endRound();
      if (pan) { const p = pan; pan = null; p.close(); }
      disposeMallet();
      if (moved) restoreMo();
      if (seated) P.placeAt(H.stand.x, H.stand.z, H.stand.yaw); // đứng dậy về chỗ cũ
    });
    // Thoát nhẹ nhàng: đứng dậy, mõ trượt về chỗ cũ rồi mới kết thúc
    r.leave = async () => {
      if (leaving || r.dead) return;
      leaving = true; endRound();
      if (pan) { const p = pan; pan = null; p.close(); }
      disposeMallet();
      if (seated) P.setPose('sit');
      if (moved) {
        const f = { x: mo.position.x, y: mo.position.y, z: mo.position.z, s: mo.scale.x };
        const ok = await r.tween(0.45, (e) => {
          mo.position.set(U.lerp(f.x, orig.x, e), U.lerp(f.y, orig.y, e), U.lerp(f.z, orig.z, e)); mo.scale.setScalar(U.lerp(f.s, orig.s, e));
        }, G.ease.inOut);
        if (!ok) return;
      }
      r.exit();
    };
    // Tạm dừng khi tab bị ẩn: đồng hồ ván được dời đi đúng khoảng đã ẩn, thêm chút thời gian định thần
    const onVis = () => {
      const x = rd; if (!x || x.st !== 'play') return;
      if (document.hidden) { if (x.hiddenAt == null) x.hiddenAt = clockOf(x); }
      else if (x.hiddenAt != null) {
        x.ts += (clockOf(x) - x.hiddenAt) + 1.2; x.hiddenAt = null;
        if (x.cap) x.cap.say('Tiếp tục nhé…');
      }
    };
    document.addEventListener('visibilitychange', onVis);
    r.defer(() => document.removeEventListener('visibilitychange', onVis));
    r.on('key:action', () => moTap());

    // --- mỗi khung: mõ nảy, vòng nhịp, chữ kinh, chấm nhịp ---
    r.frame((dt) => {
      if (bounceT < 1) {
        bounceT = Math.min(1, bounceT + dt / 0.2);
        const s = Math.sin(bounceT * PI);
        mo.scale.set(moBase * (1 + 0.07 * s), moBase * (1 - 0.1 * s), moBase * (1 + 0.07 * s));
      }
      const x = rd; if (!x) return;
      updateFloaters(x.floaters, dt);
      if (x.st !== 'play' || x.hiddenAt != null) return;
      let t = clockOf(x);
      if (x.useAudio && !x.checked) { // 0,4 giây đầu (còn trong lúc chuẩn bị): kiểm tra đồng hồ âm thanh có chạy đúng tốc độ không
        const pn = performance.now() / 1000;
        if (pn - x.p0 < 0.4) return;
        x.checked = true;
        const ratio = (t - x.a0) / (pn - x.p0);
        if (!(ratio > 0.7 && ratio < 1.4)) { x.ts = x.p0 + MO_LEAD; x.useAudio = false; t = pn; } // đồng hồ đứng/lệch đơn vị: dùng đồng hồ trình duyệt, giữ nguyên mốc bắt đầu
      }
      // sinh vòng nhịp sắp tới
      while (x.nextRing < MO_BEATS && beatT(x, x.nextRing) - MO_RING <= t) {
        let k = -1;
        for (let q = 0; q < 4; q++) if (!x.ringOn[q]) { k = q; break; }
        if (k < 0) break;
        x.ringOn[k] = true; x.ringBeat[k] = x.nextRing; x.nextRing++;
      }
      x.pad.clear();
      for (let q = 0; q < 4; q++) {
        if (!x.ringOn[q]) continue;
        const d = t - beatT(x, x.ringBeat[q]);   // âm: nhịp chưa tới
        if (d > 0.2) { x.ringOn[q] = false; continue; }
        if (d <= 0) { const u = -d / MO_RING; x.pad.ring(x.pad.R1 + (x.pad.R0 - x.pad.R1) * u, Math.min(1, (1 - u) * 5)); }
        else x.pad.ring(x.pad.R1 + d * 60, 1 - d / 0.2);
      }
      // nhịp hiện tại: đếm lùi 3·2·1 rồi chữ kinh
      const cb = Math.floor((t - x.ts) / MO_P) - MO_COUNTIN;
      if (cb !== x.cb) {
        x.cb = cb;
        if (cb >= -MO_COUNTIN && cb < 0) {
          for (let i = 0; i < 3; i++) x.nums[i].classList.toggle('on', i === cb + MO_COUNTIN);
        } else if (cb >= 0) {
          x.cnt.style.display = 'none'; x.kara.style.display = '';
          const si = cb < MO_BEATS ? cb % SYL.length : -1;
          for (let i = 0; i < SYL.length; i++) x.syl[i].classList.toggle('on', i === si);
          x.target.classList.remove('beat'); void x.target.offsetWidth; x.target.classList.add('beat');
          if (cb === 6 && x.cap) x.cap.say('');
        }
      }
      // nhịp nào quá 250 ms mà chưa ai gõ thì lặng lẽ tính là lệch nhịp
      while (x.nextJudge < MO_BEATS && t > beatT(x, x.nextJudge) + MO_WIN) {
        if (x.res[x.nextJudge] < 0) { x.res[x.nextJudge] = 0; x.counts[0]++; }
        x.nextJudge++;
      }
      const prog = U.clamp((t - beatT(x, 0)) / (MO_BEATS * MO_P), 0, 1);
      if (prog > x.prog) { x.prog = prog; x.fill.style.transform = 'scaleX(' + prog.toFixed(3) + ')'; }
      if (t > beatT(x, MO_BEATS - 1) + 0.75) finishRound(x);
    });

    // --- một cú gõ ---
    function moTap() {
      const x = rd; if (!x || x.st !== 'play' || x.hiddenAt != null) return;
      const t = clockOf(x);
      const j = Math.round((t - x.ts) / MO_P) - MO_COUNTIN;   // nhịp gần nhất
      P.tap();
      sfx('mo', { accent: j >= 0 && j % SYL.length === 0 });
      bounceT = 0;
      x.target.classList.remove('hit'); void x.target.offsetWidth; x.target.classList.add('hit');
      if (x.useAudio && !x.checked) return; // đồng hồ chưa được xác nhận (chỉ trong 0,4 giây đầu): chưa tính nhịp
      if (j >= 0 && j < MO_BEATS && x.res[j] < 0) {
        const ad = Math.abs(t - beatT(x, j));
        if (ad <= MO_WIN) {
          const g = ad <= MO_PERFECT ? 2 : ad <= MO_OK ? 1 : 0;
          x.res[j] = g; x.counts[g]++;
          addFloater(x.pad, x.floaters, MO_GRADE[g].name, MO_GRADE[g].cls);
          return;
        }
      }
      // gõ thừa: không phạt, chỉ hiện chữ nhẹ tối đa một lần mỗi nhịp
      if (t >= beatT(x, 0) - 0.43 && j !== x.lastExtra) {
        x.lastExtra = j;
        addFloater(x.pad, x.floaters, MO_GRADE[0].name, MO_GRADE[0].cls);
      }
    }

    // --- bắt đầu một ván: lớp phủ + đếm lùi ---
    function startRound() {
      endRound();
      const x = (rd = {
        st: 'lead', cleanups: [], res: new Int8Array(MO_BEATS).fill(-1), counts: [0, 0, 0],
        nextJudge: 0, nextRing: -MO_COUNTIN, ringBeat: [0, 0, 0, 0], ringOn: [false, false, false, false],
        floaters: [], lastExtra: -999, cb: -99, prog: 0, hiddenAt: null,
        useAudio: false, ts: 0, p0: 0, a0: 0, lastT: 0, checked: false,
        pad: null, target: null, cnt: null, kara: null, fill: null, cap: null, nums: [], syl: [],
      });
      const layer = U.el('div', 'aa-layer');
      G.ui.overlay.appendChild(layer);
      x.cleanups.push(() => layer.remove());
      layer.addEventListener('pointerdown', (e) => { e.preventDefault(); moTap(); });
      mkClose(layer, () => r.leave());
      const bar = U.el('div', 'aa-bar'); x.fill = document.createElement('i'); bar.appendChild(x.fill);
      x.cnt = U.el('div', 'aa-cnt');
      ['3', '2', '1'].forEach((n, i) => {
        if (i) x.cnt.appendChild(U.el('span', 's', '·'));
        const sp = U.el('span', null, n); x.nums.push(sp); x.cnt.appendChild(sp);
      });
      x.kara = U.el('div', 'aa-kara'); x.kara.style.display = 'none';
      SYL.forEach((w, i) => {
        if (i) x.kara.appendChild(U.el('span', 's', '·'));
        const sp = U.el('span', null, w); x.syl.push(sp); x.kara.appendChild(sp);
      });
      layer.append(bar, x.cnt, x.kara);
      x.cap = mkCaption(layer, true);
      x.pad = makePad(layer, 'mo'); x.target = x.pad.target;
      x.cleanups.push(G.events.on('resize', x.pad.layout));
      x.cap.say(G.isTouch ? 'Chạm khi vòng nhịp khép vào chiếc mõ' : 'Bấm chuột hoặc phím Space khi vòng nhịp khép vào chiếc mõ');
      // đồng hồ: ưu tiên đồng hồ âm thanh nếu chạy ổn định
      x.useAudio = Number.isFinite(audioNow());
      x.p0 = performance.now() / 1000; x.a0 = x.useAudio ? audioNow() : 0;
      x.ts = clockOf(x) + MO_LEAD;
      x.st = 'play';
      sfx('bowlBell');
    }

    // --- kết thúc ván: tính "Tâm an", ghi sổ, hiện kết quả ---
    function finishRound(x) {
      x.st = 'done';
      for (let j = x.nextJudge; j < MO_BEATS; j++) if (x.res[j] < 0) { x.res[j] = 0; x.counts[0]++; }
      x.fill.style.transform = 'scaleX(1)';
      sfx('bowlBell');
      const S = U.clamp(Math.round(100 * (x.counts[2] + 0.6 * x.counts[1]) / MO_BEATS), 0, 100);
      const d = G.save.data;
      d.mo = (d.mo || 0) + 1; d.lastTamAn = S; d.bestTamAn = Math.max(d.bestTamAn || 0, S);
      G.save.persist();
      G.events.emit('tamAn', S);
      const counts = x.counts.slice(), best = d.bestTamAn;
      endRound();
      showResult(S, counts, best);
    }
    function showResult(S, counts, best) {
      let again = false;
      const body = U.el('div');
      body.append(U.el('div', 'aa-score', 'Tâm an: ' + S + '/100'));
      const st = U.el('div', 'aa-stats');
      [[counts[2], 'Tĩnh tâm'], [counts[1], 'Được'], [counts[0], 'Lệch nhịp']].forEach(([n, label]) => {
        const c = U.el('div'); c.append(U.el('b', null, String(n)), U.el('span', null, label)); st.appendChild(c);
      });
      body.append(st, U.el('div', 'aa-line', praise(S)), U.el('div', 'note center', 'Điểm cao nhất của bạn: ' + best + '/100'));
      pan = G.ui.panel({
        title: 'Gõ mõ xong rồi', body, clear: true,
        actions: [
          { label: 'Gõ lại', primary: true, onClick: (close) => { again = true; close(); startRound(); } },
          { label: 'Đứng dậy', onClick: (close) => close() },
        ],
        onClose: () => { pan = null; if (!again) r.leave(); },
      });
    }
    function showIntro() {
      let go = false;
      const body = U.el('div');
      body.append(U.el('div', null, 'Gõ mõ theo nhịp trong khoảng 30 giây, mỗi khi vòng nhịp khép vào chiếc mõ.'),
        U.el('div', 'note', G.isTouch ? 'Chạm vào bất kỳ đâu trên màn hình để gõ.' : 'Bấm chuột vào màn hình, hoặc nhấn phím Space / E để gõ.'));
      body.lastChild.style.marginTop = '8px';
      pan = G.ui.panel({
        title: 'Gõ mõ tụng kinh', body, clear: true,
        actions: [{ label: 'Bắt đầu', primary: true, onClick: (close) => { go = true; close(); startRound(); } }],
        onClose: () => { pan = null; if (!go) r.leave(); },
      });
    }

    // --- đi tới, ngồi lên bồ đoàn, cầm dùi ---
    if (!(await goTo(r, H.stand))) return;
    P.placeAt(H.cushion.x, H.cushion.z, H.cushion.yaw);
    P.pos.y = H.cushion.y + SEAT_LIFT; seated = true;
    P.poseParam = 0; P.setPose('sitMo');
    mallet = makeMallet(); P.handR.add(mallet.g);
    if (!(await r.sleep(1.1))) return;
    // đưa chiếc mõ lại sát dưới đầu dùi để cú gõ chạm đúng (sẽ trả về chỗ cũ khi đứng dậy)
    mallet.knob.getWorldPosition(_k);
    const to = { x: _k.x, y: H.cushion.y, z: _k.z - 0.1, s: U.clamp((_k.y - 0.25 - H.cushion.y) / 0.63, 0.6, 1) };
    const from = { x: mo.position.x, y: mo.position.y, z: mo.position.z, s: mo.scale.x };
    moved = true;
    if (!(await r.tween(0.8, (e) => {
      if (leaving) return; // đang đứng dậy: để tween trả mõ về chỗ cũ làm việc của nó
      mo.position.set(U.lerp(from.x, to.x, e), U.lerp(from.y, to.y, e), U.lerp(from.z, to.z, e)); mo.scale.setScalar(U.lerp(from.s, to.s, e));
    }, G.ease.inOut)) || leaving) return;
    moBase = to.s;
    showIntro();
  }

  // =====================================================================
  //  ĐĂNG KÝ ĐIỂM HOẠT ĐỘNG
  // =====================================================================
  if (W.burner) {
    G.poi.add({ id: 'incense', label: 'Thắp hương', icon: 'incense', x: W.burner.poi.x, z: W.burner.poi.z, r: W.burner.poi.r,
      desc: 'Thắp nén tâm hương ở lư hương giữa sân', onAction: startIncense });
  }
  if (W.bell) {
    G.poi.add({ id: 'bell', label: 'Thỉnh chuông', icon: 'bell', x: W.bell.poi.x, z: W.bell.poi.z, r: W.bell.poi.r,
      desc: 'Kéo chày gỗ, thỉnh ba tiếng chuông ngân', onAction: startBell });
  }
  if (W.hall && W.hall.mo) {
    G.poi.add({ id: 'mo', label: 'Gõ mõ tụng kinh', icon: 'mo', x: W.hall.poi.x, z: W.hall.poi.z, r: W.hall.poi.r,
      desc: 'Ngồi trên bồ đoàn trong chính điện, gõ mõ theo nhịp kinh', onAction: startMo });
  }
}
