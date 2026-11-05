# "Lên Chùa Cầu An" — module contract (read this first)

The game is ONE `index.html`, built by `node build.js` from `src/shell.html` + every `src/NN-*.js` file
concatenated (sorted by name) into a single `<script type="module">`. Three.js r160 is imported once in
`00-core.js` (`import * as THREE from 'three'`). Every module file must contain exactly ONE top-level
declaration: `function installXxx(G) { ... }` — no imports, no other top-level code/const/let (they would collide).
Boot order (`99-boot.js`): buildWorld → installFx → installPlayer → installAudio → installCrowd →
installActivitiesA → installActivitiesB → G.start(). Each install is wrapped in try/catch.

Hard rules
- No external assets: no images/models/audio/fonts URLs. Canvas textures and Web Audio synthesis only.
- All UI text Vietnamese (with diacritics). Gentle, respectful tone: no jokes about the Buddha, no monsters,
  no win/lose, no harsh ranking. Never claim prayers are guaranteed to come true. Never mention money/donations.
- User text (names, prayers) is ALWAYS inserted with `textContent` / canvas fillText — never innerHTML.
- Per-frame code (`G.onUpdate`) must not allocate: reuse module-level Vector3/Matrix4/Object3D temps.
- Dispose textures/geometries/materials you create when the object is removed.
- Mobile first (portrait ~390×844), tap targets ≥ 44px; desktop also works (mouse + keyboard).
- Comment style: a short Vietnamese header comment at the top of each section (match existing files).
- Coordinates: meters, y up. Character "yaw": forward = (sin yaw, 0, cos yaw); facing north (−z) is yaw = π.
  `G.util.yawTo(x0,z0,x1,z1)` gives the yaw that faces from point 0 to point 1.

## Shared object `G` (see src/00-core.js, 05-world.js, 06-player.js, 07-fx.js for exact code)
- `G.THREE`, `G.scene`, `G.camera`, `G.renderer`, `G.time` (game seconds), `G.dt`, `G.isTouch`, `G.size {w,h}`
- `G.onUpdate(fn(dt, time), order)` — per-frame callback. Orders: player 10, crowd 20, activities 30, camera 50, fx 60, UI 80.
- `G.tween(dur, fn(easedK, rawK), ease) → Promise`; `G.wait(sec) → Promise` (game time); `G.ease.{linear,inOut,out,in,sine,outBack}`
- `G.events.on(name, fn) → off()`, `.emit(name, ...)`. Emitted by core: `'enter'(name)`, `'activity:start'(name)`,
  `'activity:end'(name)`, `'footstep'(pos)`, `'resize'`, `'escape'`, `'key:action'(code)` (E/Space/Enter pressed while an
  activity or panel is open), `'ui:book'` (top-bar "Sổ cầu an" button), `'ui:share'` (top-bar "Chia sẻ" button), `'save'`, `'quality:low'`.
- `G.util`: clamp, lerp, smoothstep, damp(a,b,k,dt), angleDiff, angleDamp, yawTo, rand, randInt, pick, shuffle, hash, rng(seed),
  fmt(n) (vi-VN thousands), todayKey(), dateVN(iso), el(tag, cls, text),
  piece(geo, hexColor, {p:[x,y,z], r:[rx,ry,rz], s:num|[sx,sy,sz], m:Matrix4, j:colorJitter, order:'XYZ'}) → flat-shaded vertex-colored
  non-indexed geometry; merge(list) → one BufferGeometry; batch() → {add(geo,color,opts), addGeo(g), mesh(material,{cast,receive,dynamic})};
  segMatrix(ax,ay,az,bx,by,bz) → {m,len} (box/cylinder along z between two points); canvasTex(w,h,draw(ctx,w,h)) → sRGB CanvasTexture;
  wrapText(ctx, text, maxW) → lines.
- `G.mats`: `vc` (MeshLambert vertexColors — the house style), `vcDouble`, `metal` (Phong bronze), `gold`, `lantern` (MeshBasic vertexColors, brightens at night).
- `G.tod`: `t` (0 = golden sunset … 1 = night), `night` (0..1 smooth), `speed` (debug multiplier), `set(t)` debug.
- `G.heightAt(x,z)` ground height (the main hall stands on the back terrace behind Tích Thiện Am: terrace 1.2, hall floor 1.92, hall x ±12.6, front wall z −63.3, steps −62.4, back −81.2; the hall is built in its own
  local frame and placed by `G.frame.xf(x,y,z)` = (x·s, y·s+dy, −23.5+(z+23.5)·s+dz) with `G.L.hall` s = 1.2, dy = 1.2, dz = −57.7; `G.frame.mark()/shift()` applies it to everything built since the mark — never move a scene child, collider, blocker or glow by hand afterwards). `G.insideHall(x,z)`.
- `G.collide`: `circle(x,z,r,tag)`, `box(x0,z0,x1,z1,tag)`, `ellipse(x,z,rx,rz,tag)`, `remove(c)`, `resolve(p{x,z}, radius)` pushes p out of
  obstacles (mutates), `hit(x,z,r)` → collider|null. Colliders are XZ-only.
- `G.nav.path(x0,z0,x1,z1)` → array of `{x,z}` waypoints ending at the goal (uses a LOS waypoint graph; may return just the goal).
  `G.nav.los(x0,z0,x1,z1,r)` line-of-sight test.
- `G.spots` (for AI pilgrims): `gateOut{x,z}` (spawn point outside, z=72), `gate`, `gateIn`, and arrays of `{x,z,yaw}`:
  `incense` (8 around the burner, facing it), `hallFront` (15 in the hall court z −60.6/−59.4, facing the hall), `hallSeats` (16 usable cushions INSIDE the hall,
  each also has `y:1.956`), `tree` (7), `pond` (8), `bell` (3), `fortune` (2), `photo` (8, each also has `subject{x,z}`),
  `bench` (2 bench seats, `y:0.42`), and `wander` (22 `{x,z}` open points). The player's own activity spots are kept out of these.
- `G.world`: handles to scene objects
  - `burner {x:0,z:4,sandY:1.4,sandR:0.78,rimY:1.5, poi{x,z,r}, stand{x,z,yaw}, cam{pos:[..],look:[..]}}` (bronze incense burner)
  - `bell {x,z, pivot:Group (the bell; rotate .rotation.z/.x a little to sway), swing:Group (striker log pendulum; rotation.z>0 pulls it
    back east/up, rotation.z = strikeTheta(-0.087) is the contact angle), ropeEnd:Object3D (bottom of the pull rope, world pos via
    getWorldPosition), hitPoint:Vector3, poi, stand, cam}`
  - `hall {mo:Group (wooden fish drum, origin at its base; you may scale/bounce it), moTop:Vector3 (where the mallet hits),
    cushion{x,z,y,yaw} (where the player sits), poi, stand, cam}`; `statue` mesh, `statueFocus` Vector3
  - `tree {x:15.5,z:-5, anchors:[{x,y,z}] (~70 points under low branches where a ribbon's TOP can be tied), poi, stand, cam}` (bodhi tree)
  - `pond {x:14,z:15,rx:5.2,rz:3.8,waterY:0.06, inside(x,z,margin)→bool, poi, stand, release{x,z} (where a lantern is set on water), cam}`
  - `fortune {x,z, tube:Group (fortune-stick tube on the table; can hide/animate), tubeTop:Vector3, poi, stand, cam}`
  - `lights {hemi, sun, hall, burner}`, `water` mesh, `smokeSpots`.
  Every `poi` is `{x,z,r}` = a standable point + activation radius; `stand` = exact spot+yaw for the player during the activity;
  `cam` = suggested close-up camera `{pos:[x,y,z], look:[x,y,z]}` for `G.cam.focus`.
- `G.fx`: `smoke(x,y,z,{size,grow,life,rise,spread,alpha})` one puff; `addSmokeSource(Object3D|Vector3, {rate,...}) → {remove()}`
  continuous smoke (follows an Object3D's world position); `glowPoints(count,{flicker,intensity}) → {set(i,x,y,z,size,r,g,b,alpha),
  setPos, setAlpha, setSize, hide(i), commit(), dispose(), points, material}` additive soft glow sprites (call commit() after changes).
- `G.chibi`: shared chibi geometries (origin at feet, facing +z) `geos.{body, beads, head, hairShort, bun, hat(nón lá, open cone),
  face (vertex colors: closed eyes, pink cheeks), arm (pivot at shoulder, hangs −y), hand (same pivot, at arm end), foot, sitLegs}`
  and `layout {hipY:0.38, neckY:0.9, shoulderX:0.2, shoulderY:0.8, armLen:0.36, headC:0.3}`. head/hair/bun/hat/face are offset
  relative to a NECK pivot at y=neckY. Arms: pivot at (±shoulderX, shoulderY, 0) (+x is the character's LEFT); arm rotation.x
  negative = swing forward/up; rotation.z positive moves the hand toward +x. Euler order XYZ.
- `G.assets.blobGeo` (1×1 plane already flat) + `blobMat` — soft round shadow decal; scale ~0.9 and place at y≈0.02.
- `G.player`: `pos` (Vector3, = root.position), `yaw`, `root`, `moving`, `name`, `radius`,
  `setPose(name)` with names: 'idle','pray' (chắp tay),'bow' (looping bows),'incense' (sticks raised to forehead; set
  `poseParam=1` to also bow slowly),'offer' (reach forward to plant/put something),'strike' (both hands up on the bell rope;
  `poseParam` 0..1 = how far pulled back),'sit','sitPray','sitMo' (seated, left hand single-palm, right hand raised with mallet;
  call `tap()` for a quick downward strike),'shake' (hold a tube in front; `poseParam` 0..1 = shake strength),'write','release'
  (bend to set something down),'wave'. `poseParam` (number), `tap()`, `lock(bool)`, `placeAt(x,z,yaw)` (teleport),
  `faceTo(yaw,dur) → Promise`, `walkTo(x,z) → Promise<bool>` (auto-walk with pathfinding, works while locked),
  `stopWalk()`, `handR`/`handL` (Object3D at each hand tip — child objects follow the hand), `handsMid` (Object3D at the
  midpoint between hands, child of player.root, updated every frame), `handsWorld` (Vector3), `colors`.
- `G.cam`: `focus({pos:[x,y,z], look:[x,y,z], dur})` smooth close-up, `release(dur)` back to follow, `shake(amount=0.12, dur=0.4)`.
- `G.activity`: `begin(name, {cam}) → bool` (false if another activity runs; locks player, hides joystick/action button,
  focuses camera), `end()` (unlocks, pose idle, camera back). ALWAYS end() on every exit path (close button, Escape, finish).
- `G.poi.add({id, label, icon, x, z, r, desc, onAction(poi), available()})` registers an activity spot: a glowing ground ring,
  a floating label, the big action button when the player is within r, keyboard E, and an entry in the "Bản đồ chùa" sheet
  (tapping it auto-walks there). Icons available in `G.icons`: incense, bell, mo, ribbon, lantern, fortune, gate, hall, lotus, ...
- `G.ui`: `toast(text, ms)`; `panel({title, body: Node|staticHTMLString, actions:[{label, primary, cls, id, onClick(close, btn)}],
  onClose, closable=true, clear=false, className}) → {el, body, footer, close(), closed}` (bottom sheet on phones, centered on
  desktop; `clear:true` = no dim backdrop and the 3D scene stays visible/clickable around it);
  `overlay` (fixed full-screen div, z above HUD, for mini-game UIs — append your own element and remove it when done);
  `addStyle(css)`; `bubble(target Object3D|Vector3|()=>Vector3, text, ms, yOffset=1.95)` speech bubble above a world point
  (pool of 7; ONLY ever used for AI pilgrims, never the player); `bubbleCount()`; `worldToScreen(v, out)`; `panelOpen`; `closeTop()`.
  CSS helper classes exist in shell.html: .btn .btn.primary .btn.red .chips .chip .chip.on .card .field (input/textarea)
  .muted .small .note .row .col .grid2 .center .hr .gold. Palette CSS vars: --gold --gold2 --cream --muted --red --ink --panel --line.
- `G.save.data`: `{name, visits, incense (times), incenseSticks, bell, bellPerfect, mo, bestTamAn, lastTamAn, prayers:[{text, kind:
  'lua'|'hoadang', cat, at}], fortunes:[{no, title, text, at}], tutorialDone, muted}`; `G.save.persist()`, `addPrayer({text,kind,cat})`,
  `addFortune({no,title,text})`, `reset()` (keeps name/mute).
- `G.text.hasBad(str)` profanity check (Vietnamese + slang), `cleanText(str, max=120)`, `cleanName(str)`.
- `G.stats.add(n)` increments "Hôm nay có … người lên chùa cầu an"; `G.stats.visitors`.
- `G.snapshot(w, h, {view:'postcard'|'player'}) → HTMLCanvasElement` — renders the temple from a nice fixed angle (or the current
  camera) into a w×h canvas (synchronous).
- `G.audio` (provided by 10-audio.js): `init()` (called synchronously inside the "Vào chùa" click), `setMuted(bool)`,
  `play(name, opts)`. Other modules must call it null-safely: `G.audio?.play?.('bell', {strength:1, perfect:true})`.
  Sound names: 'ui', 'bell' {strength 0..1, perfect bool}, 'bellSoft' (distant small bell), 'mo' {accent bool},
  'incense' (light incense: soft match + whoosh), 'chime' (gentle success), 'shake' {dur} (fortune sticks rattling),
  'stickDrop', 'water' (lantern set on water), 'ribbon' (cloth flutter), 'step', 'bowlBell' (small standing bowl bell).
