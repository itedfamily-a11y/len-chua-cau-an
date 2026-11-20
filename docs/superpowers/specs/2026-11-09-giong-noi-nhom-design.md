# Giọng nói trong nhóm (group voice): design

Date: 2026-11-09. Revision 4 (2026-11-11).

Status:
- On 2026-11-09 the owner approved the summary in chat ("Như gọi nhóm", then "Đồng ý").
- This document is Claude's detailed design. An independent three-way review (workflow `wf_aa80e046-a74`) corrected it: a code-claim check, a design/test critique, and a live Chrome check of the send path.
- On 2026-11-09 the owner also approved all six choices listed under "Những điểm tôi đã tự chọn" ("Đồng ý cả 6").
- Revision 3 (2026-11-10) rebases the design on two changes the owner asked for on the night of 2026-11-09: multiplayer is on by default, and pairs that cannot connect directly go through the owner's ExpressTURN relay. What changed here: the privacy texts name the relay (summary, 3.6, the module 22 notes); a valid invite link holds the default room until the invite panel is answered, so an invited player never passes through the public room (3.1, `G.chung.holdDefault` / `releaseDefault`); the tests seed multiplayer off (6.1); the scope and network notes describe the relay. These follow from choices the owner already made; Claude listed them for the owner in chat.
- Revision 4 (2026-11-11) applies the findings of three independent reviews (the multiplayer change, plan Tasks 1–4, plan Tasks 5–8). The multiplayer change itself now: shows a fuller once-per-device notice, also in in-app browsers ("Bạn đang đi chùa cùng mọi người: người khác thấy tên và nhân vật của bạn. Muốn đi một mình thì tắt trong Cài đặt."); says on the splash screen that the mode is on; goes back to the default and connects after "Xoá dữ liệu trên máy"; is OFF by default on copies run on the machine (localhost, 127.0.0.1, file://) so test and preview copies never meet real players; names the ExpressTURN relay in its texts only while `TURN_SERVERS` holds a valid list (`G.chung.relay`), and says the relay sees the IP of every player who connects while it is configured. This design follows: the voice privacy texts are relay-aware (3.6), the hold remembers whether the notice is still due (3.1), "Tạo mã nhóm mới" during the hold joins the new group at once (3.1), the panel's "Bạn sẽ rời phòng chung." line shows only when the player is really in the public room (3.1), the mic button title has no key hint on touch screens (3.3), old clients get the per-person chip like everyone else (5), and the tests keep the real default only on guarded pages and check free RAM before starting browsers (6.1).
- Implemented 2026-11-13 (modules 23-25 and the hooks in 00 / 10 / 22 / 45 / 99-boot / shell.html; contracts in src/API.md). Still to do: the owner's phone checklist (6.3) and a check of voice through a real TURN relay.

## Tóm tắt cho chủ trò chơi

Người cùng một nhóm riêng nghe và nói chuyện với nhau như gọi nhóm Zalo: ai cũng nghe rõ như nhau, đứng đâu trong chùa cũng vậy.
- **Mời bạn:** gửi một đường link có mã nhóm ngẫu nhiên.
- **Micro:** luôn tắt cho tới khi mình bấm mở, và không bao giờ tự mở. Người chỉ muốn nghe không phải cho phép micro.
- **Phòng chung:** không có giọng nói.
- **Riêng tư:** trò chơi không ghi âm, không lưu, không dùng máy chủ nào ngoài các điểm hẹn và (khi đã khai) máy chủ chuyển tiếp. Tiếng nói đi qua máy chủ chuyển tiếp vẫn được mã hoá, máy chủ không nghe được.

Những điểm tôi đã tự chọn (bạn đổi được):
1. **Thắp hương, gõ chuông… khi micro đang mở:** micro vẫn mở. Trên màn hình có nút nhỏ "Micro đang mở · Tắt" để tắt bất cứ lúc nào.
2. **Ngồi thiền hoặc tụng kinh:** khi công tắc "Tự im" đang bật, micro tắt hẳn. Xong, muốn nói tiếp thì bạn tự bấm micro.
3. **Nhóm hơn 8 người đang cùng nghe:** chưa mở được micro, nhưng vẫn nghe được. Lý do: mỗi người nói phải gửi riêng tiếng của mình tới từng người nghe, nhóm đông thì điện thoại gửi không kịp.
4. **Nút loa và phím M:** chỉ tắt tiếng trò chơi, không tắt micro. Lần đầu mở micro có câu nhắc điều này.
5. **"Tạo mã nhóm mới":** bấm được cả khi chưa bật "Đi chùa cùng mọi người". Bạn vào thẳng nhóm riêng, không đi qua phòng chung có người lạ.
6. **Sau lần mở micro đầu tiên:** máy gửi liên tục một tín hiệu im lặng rất nhỏ, khoảng 12 kbps cho mỗi người. Nhờ vậy những lần mở micro sau, người khác nghe ngay chứ không bị trễ hơn 1 giây.

## 1. Scope

In scope:
- **Party-line voice:** no distance attenuation and no panning, between members of the same **private group** (room `chua-an-lac-1-<code>`). Voice is limited to groups of up to 8 listening people; see 3.3.
- **Invite flow:** random group code generator, shareable invite link, invite panel.
- **Voice controls:** mic toggle, listening switch, per-person voice mute, voice volume channel, speaking marker, music ducking, auto-quiet during meditation and chanting, a cap of 6 open mics.

Out of scope:
- Voice in the public room.
- Spatial (distance) voice.
- Push-to-talk.
- A TURN relay of our own. Voice uses the same ExpressTURN relay as multiplayer data (the multiplayer change of 2026-11-10) for pairs that cannot connect directly.
- Recording.
- Voice inside in-app browsers (Zalo, Messenger, Facebook…).
- Any server or account.

Project constraints that apply:
- Vietnamese UI with diacritics.
- No login, data collection, ads or money.
- External libraries: only Three.js r160 and Trystero 0.26.0. Voice uses Trystero's media API and plain WebRTC/Web Audio, nothing new.
- User and peer text only via `textContent` or canvas `fillText`; panel bodies are built from DOM nodes, not HTML strings.
- Respectful Buddhist tone.

## 2. Evidence

Feasibility workflow `wf_8366790d-d1c` and review workflow `wf_aa80e046-a74`. The harnesses and logs are in the session scratchpad under `v6/voice/`: `spike`, `ios`, `map`, `review-code`, `check-send`.

What works:
- Trystero 0.26.0 `room.addStream(stream, {target, metadata})` and `room.onPeerStream(stream, peerId, metadata)` carry Opus between headless Chromes. Audio is heard about 0.25 s after the first `addStream`, costs about 44 kbps per stream including RTP headers, and simultaneous enables (glare) are clean.
- Renegotiation travels over the existing data channel, not over Nostr.

Trystero pitfalls:
- `addStream` reaches only peers present at call time.
- The positional form `addStream(stream, id)` silently goes to **everyone**.
- `removeStream` leaves a stale m-line, and the offer grows by about 1.16 KB per remove and re-add. After about 12 cycles it exceeds `maxReceiveBytes` 16384 and voice stalls silently. **Never call `removeStream` during a room session.**
- **Never call `room.replaceTrack`.** Each call also sends a track-metadata message. From the second call on, the receiver cannot match it and parks it in a per-peer queue capped at 64. At the cap the receiver drops the sender's whole connection: measured at call 65 or 66, including peers that never got a stream. Calling `RTCRtpSender.replaceTrack` directly has no such effect (250 cycles: 0 drops, 0 renegotiations).
- **Never stop the RTP flow on a live sender.** A gap longer than about 1.5 s, from `track.stop()` or `replaceTrack(null)`, ratchets every listener's jitter buffer:
  - From the second re-open on, the time until listeners hear the speaker grows from 0.2 s to 1.1 s, and playout delay grows to 0.9–1.6 s.
  - It does not recover while the speaker talks.
  - `track.enabled = false` (keeps sending silence) is fine but keeps the OS mic indicator on.
  - Swapping the mic for a silent keep-alive track before stopping the mic is fine: onset 0.22–0.28 s, buffer 20–50 ms, OS mic released. The keep-alive costs about 12.5 kbps per peer at RTP level.
- When a peer drops and reconnects, the new connection has the same Trystero id but a new `RTCPeerConnection` with no senders. Per-peer send state must be keyed by the connection object, not only by the id.
- `onPeerStream` is never emitted again for a stream that already arrived, so the receiver must keep every incoming stream.

Receiving:
- In Chrome, a `MediaStreamAudioSourceNode` on a remote stream gets samples only while some `<audio>` element holds the stream as `srcObject`. The element may be muted, detached or paused.
- With a muted element, WebRTC stats `audioLevel` stays 0, so metering uses an `AnalyserNode`.
- A suspended `AudioContext` freezes analysers. `10-audio.js` suspends the game context 650 ms after mute and while the page is hidden.

iOS (from research notes, unverified on hardware):
- An open capture makes page audio quieter (WebKit bug 236219).
- `HTMLMediaElement.volume` is read-only.
- `navigator.audioSession.type` is available from iOS 16.4.
- Safari 27.0.x has an autoplay bug for `srcObject` audio, so call `play()` explicitly.
- Echo cancellation ignores page audio.
- Voice stops when the page is hidden.
- In-app browsers very likely cannot open the mic.

Compatibility:
- Old 512ef27 clients ignore unknown fields in the `st` packet (7 hostile `vo` values injected: 0 drops, 0 errors), so voice flags ride on `st`.

## 3. User-facing behaviour

### 3.1 Inviting

Placement: an invite row sits directly under the "Đi chùa cùng mọi người" switch row in Settings. It is **outside** `.chung-more`, so it is visible whether the switch is on or off.

**"Tạo mã nhóm mới"**
- Generates a code: three groups of four characters from `abcdefghjkmnpqrstuvwxyz23456789` joined by `-`, e.g. `k7m2-xp9q-4tnd`. That is 12 symbols (about 59 bits), and `cleanCode` leaves it unchanged.
- Uses `crypto.getRandomValues` with rejection sampling: bytes ≥ 248 are discarded. If `crypto.getRandomValues` is missing, the button is hidden.
- If live peers are present, it first asks in a panel:
  - Title "Tạo nhóm mới?"
  - Body "Bạn sẽ rời nhóm hiện tại và sang một nhóm mới chỉ có mình bạn. Những người đang cùng nhóm vẫn ở lại nhóm cũ."
  - Buttons "Tạo nhóm mới" / "Thôi"
- Then: `setCode(code)`, followed by `enable(true)` if the switch was off, then `releaseDefault()` (while an invite link holds the default room, nothing else would connect; outside a hold it does nothing). This way the player never passes through the public room.
- Toast (6 s): 'Đã tạo mã nhóm mới. Bấm "Gửi link mời" để mời bạn bè.'

**"Gửi link mời"**
- Shown only when a code is set.
- Link: `location.href.split(/[?#]/)[0] + '#nhom=' + code`.
- If `navigator.share` exists, it calls `navigator.share({ title: 'Lên Chùa Cầu An', text: 'Mời bạn cùng đi chùa trong nhóm của mình: ' + link })`. The URL goes inside `text` only, so no share target drops or duplicates it.
  - `AbortError` (the user cancelled): do nothing.
  - Any other error falls through to the clipboard.
- Clipboard: `navigator.clipboard.writeText(link)`, then toast (5 s) "Đã chép link mời. Dán vào Zalo hoặc Messenger để gửi cho bạn bè."
- If that also fails: a read-only field with the link, auto-selected, labelled "Chép link này để gửi cho bạn bè:".

**Opening a link** (module 23, at install):
- Read `v = new URLSearchParams(location.hash.slice(1)).get('nhom')` inside try/catch.
- Take the longest leading run of `[A-Za-z0-9-]` from `v`. This strips `?zarsrc=…`, spaces and other junk that apps append.
- Accept the code only if the run has 10–24 letters or digits. The pending code is then `cleanCode(run)`.
- A `nhom` value that fails the check gives toast (5 s) after enter: "Link mời này không dùng được. Bạn nhờ người gửi tạo link mới nhé."
- **Hold the default room.** Multiplayer is on by default (2026-11-10), so without a hold an invited player would join the public room at `'enter'` and stay there through the tutorial. When the code is accepted and differs from the current code (`G.chung.code`), module 23 calls `G.chung.holdDefault()` at install. On `'enter'` module 22 then joins no room and shows no once-per-device notice (the in-app tip still shows). Any `connect()` ends the hold, for example the player turning the switch on in Settings. The invite panel's answer ends it too: module 23 calls `G.chung.releaseDefault()` after every answer (see below), which does what `'enter'` would have done.
- **The notice under the hold.** At `'enter'` while held, module 22 remembers whether the once-per-device notice is due (the player never chose). `releaseDefault()` shows it when it was due then, even if the player changed a voice setting or the code during the hold (which writes the save). In-app browsers get the notice too (and the in-app tip as before). "Xoá dữ liệu trên máy" during the hold connects to the default room, which ends the hold; the panel's answer still works afterwards.
- **Keep the hash** until the player answers the panel. Then remove it with `history.replaceState`. In an in-app browser never remove it, so that "Mở bằng trình duyệt" carries the invite over. A reload on the splash screen still shows the invite.

**When the panel shows** (polled every 500 ms after `'enter'`), all of these must hold:
- `G.started`
- no panel open (`!G.ui.panelOpen`)
- tutorial hidden (`#tut.hidden`)
- `G.save.data.tutorialDone`
- no activity running (`!G.activity.current`)
- at least 3.6 s since `'enter'`

First-time visitors therefore finish the tutorial first. The panel shows at most once per page load.

**The invite panel:**
- If already on with the same code: no panel; toast "Bạn đang ở nhóm này rồi." and the hash is removed.
- Otherwise the panel is titled **"Lời mời vào nhóm"**. Its body is DOM text lines:
  1. 'Bạn được mời vào nhóm riêng "<code>". Chỉ vào nếu bạn biết người gửi lời mời.'
  2. 'Khi vào nhóm, trò chơi bật "Đi chùa cùng mọi người": tên, vị trí, việc bạn đang làm và lời bạn gõ được gửi tới những người trong nhóm. Giọng nói chỉ gửi đi khi bạn tự bấm mở micro.'
  3. Only if currently on: "Bạn sẽ rời nhóm hiện tại." (a code is saved) or "Bạn sẽ rời phòng chung." (no code saved and the player is really in the public room). While the hold keeps the player out of every room and no code is saved, there is no line 3.
  4. In an in-app browser: the existing `IN_APP_TIP`.
- **"Vào nhóm"** (primary): `setCode(code)`, then `if (!isOn()) enable(true)`, then `releaseDefault()` (it joins the invited group if nothing joined yet). Toast 'Đã vào nhóm "<code>".'
- **"Để sau"**, ✕, Escape or a backdrop click: nothing changes except `releaseDefault()` (it joins the room from the saved setting if the hold kept the player out). Toast (4 s) "Muốn vào nhóm sau, bạn mở lại link mời nhé."

**Voice eligibility:**
- Typed codes keep working for text and gestures. Voice needs a code with **at least 10 letters or digits** (hyphens not counted).
- With a shorter code the voice block shows: 'Mã nhóm này ngắn nên người lạ dễ đoán. Bấm "Tạo mã nhóm mới" để dùng giọng nói.'
- This is a length rule only; generated codes are the strong path.

### 3.2 Listening

- New switch **"Nghe giọng nói trong nhóm"** in the voice block. Default **on**, saved as `G.save.data.chung.voice`.
  - Description: "Nghe người cùng nhóm nói chuyện. Muốn nói thì bấm nút micro ở dưới màn hình."
  - Old saves that have `chung` but no `voice` key read as on: the value is read with `!== false`.
- The player is announced as listening (`vo` bit 1) when all of these hold: the switch is on, the code is voice-eligible, and the voice channel gain is above 0.
- Listening needs no permission prompt. Others send audio only to listening players.
- When the switch is off:
  - Nothing is played and the mic button is hidden.
  - An open mic is closed.
  - `vo` bit 1 clears, so others switch their sender to this player to the silent track (see 4.2).
- The voice block (switches, hint, privacy note) sits inside `.chung-more`, shown only while the multiplayer switch is on and a code is set.

### 3.3 Speaking

**The mic button**
- Lives in `#chungBar`, before "Nói" (the typed chat button).
  - Label "Micro" (icon only on narrow screens, like the gesture buttons), `title` "Bật/tắt micro (phím V)" ("Bật/tắt micro" on touch screens, which have no V key), `aria-label` "Micro nói chuyện".
  - Open state: gold background and a ring that follows the player's own level. `aria-pressed` is true only while open; `aria-busy` is set while the mic is opening.
  - The bar must fit 320 px and 360 px widths without wrapping or overflow.
- Visible when all of these hold: multiplayer is on, the code is voice-eligible, and the listening switch is on.
- During any activity the bar is hidden by the existing `body.in-activity #chungBar` rule. **An open mic always has a visible off control:** while an activity runs and the mic is open, a small pill "🎙 Micro đang mở · Tắt" shows near the top centre. Its exact position is chosen in the plan so it covers no activity control. Tapping it closes the mic.

**Key V** (desktop) toggles the mic with the guards of the gesture keys: no focus in INPUT or TEXTAREA, no Ctrl/Cmd/Alt, no panel or tutorial open, `G.started`. During an activity V can only close the mic, never open it. After a click the mic button is blurred, so Space and Enter (core action keys) cannot toggle it again.

**Opening (tap when off):**
1. Pre-checks, in order:
   - in-app browser → in-app toast;
   - no `navigator.mediaDevices` → toast;
   - 6 or more live peers with `vo` bit 2 → cap toast;
   - more than 7 listeners (live peers with `vo` bit 1, not hidden by me) → group toast.
   Nobody is prompted just to be refused.
2. `state = 'opening'`. Further taps are ignored until it settles.
3. `getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false })`, called inside the tap handler.
4. When it resolves, stop the new track at once and stay off if any of these happened meanwhile:
   - the room changed (room generation counter);
   - the page is hidden;
   - the listening switch went off;
   - multiplayer went off;
   - close was requested.
   The pre-checks run again here too.
5. When no other peer is live, opening is allowed, with toast (4 s) "Chưa có ai khác trong nhóm. Khi có người vào, họ sẽ nghe bạn."
6. First successful open per page load: toast (6 s) "Nên đeo tai nghe để mọi người không nghe thấy tiếng vọng. Nút loa và phím M chỉ tắt tiếng trò chơi, không tắt micro."

**Closing:**
- A tap when open, the V key, or the pill.
- The mic is **always off** at page load and never opens without the player's tap.

**Caps (courtesy checks; `vo` is self-reported, so a race can briefly allow 7 or 8):**
- **Mic cap:** opening is refused when 6 or more live peers have `vo` bit 2. Silenced and hidden peers count, because they still send. While the cap is reached the button is dimmed with `title` "Đang đủ 6 người nói". A tap shows (5 s) "Đã có 6 người đang mở micro. Bạn vẫn nghe được; khi có người tắt micro thì thử lại nhé." The button undims when a slot frees; there is no automatic retry.
- **Group size:** with more than 7 listeners, opening is refused (5 s): "Nhóm đang có hơn 8 người nên chưa mở được micro. Bạn vẫn nghe được." If the count passes 7 while the mic is open, the mic closes (5 s): "Nhóm đã hơn 8 người nên micro tạm tắt. Bạn vẫn nghe được."

**Automatic close:**
- After 120 s with the player's own level continuously below the speaking threshold. Toast (5 s): "Micro đã tự tắt vì 2 phút không nghe thấy bạn nói."
- Immediately, with no toast, on `visibilitychange` to hidden and on `pagehide`.
- On track `ended` or `mute` (phone call, other app, Bluetooth change). Toast (6 s): "Micro bị ngắt (có thể do cuộc gọi, ứng dụng khác hoặc đổi tai nghe). Bấm micro để mở lại."
- On a code change while open. Toast: "Micro đã tắt vì bạn đổi nhóm."
- On meditation or chanting when "Tự im" is on (3.5).
- When the multiplayer switch or the listening switch is turned off (no toast).

**In-app browser:**
- `G.chung.inApp` is `ENV.inApp && navigator.standalone !== true`, so Home Screen web apps are not blocked.
- The button is visible but dimmed. A tap shows (6 s): 'Micro chưa dùng được trong trình duyệt của Zalo, Messenger, Facebook… Bấm nút ⋯ / ⋮ rồi chọn "Mở bằng trình duyệt".'

**`getUserMedia` errors.** Each shows a toast (6 s) and the mic stays off:

| Error | Toast text |
|---|---|
| `NotAllowedError` on iOS | "Bạn chưa cho phép dùng micro. Trên iPhone: bấm aA trên thanh địa chỉ → Cài đặt trang web → Micro → Cho phép." |
| `NotAllowedError` elsewhere | "Bạn chưa cho phép dùng micro. Bấm biểu tượng ổ khóa cạnh địa chỉ trang → Micro → Cho phép, rồi bấm micro lần nữa." |
| `SecurityError` | "Trang này chưa được phép dùng micro. Bạn mở trang trực tiếp bằng Safari hoặc Chrome nhé." |
| `NotFoundError` / `OverconstrainedError` | "Không tìm thấy micro trên máy này." |
| `NotReadableError` / `AbortError` | "Micro đang bị ứng dụng khác dùng." |
| no `navigator.mediaDevices` | "Trình duyệt này không mở được micro. Bạn thử Safari hoặc Chrome nhé." |
| anything else | "Chưa mở được micro, bạn thử lại nhé." |

### 3.4 Hearing others

**Volume channel**
- All voices play at the same level (party line) through a new sound channel **"Âm lượng giọng nói"**, described as "Tiếng người cùng nhóm nói chuyện". Default 70, like the other channels.
- The channel has no preview sound.
- If the channel is off or at 0, `vo` bit 1 clears (see 3.2).
- On Path B the slider shows the note "Trên máy này chưa chỉnh được âm lượng giọng nói." (see 4.3).

**People list**
- Every peer in a voice-eligible group gets a chip **"Tắt giọng"** / **"Nghe lại"**, even while their mic is closed, so a person can be silenced in advance. The setting lasts for the session only, like "Ẩn người này".
- A 🎙 mark follows the name while their mic is open, and a "· đang nói" marker shows while they speak.
- "Ẩn người này" also silences them and stops sending this player's voice to them.
- The hint line becomes: 'Người đang cùng nhóm: "Ẩn người này" giấu nhân vật, lời và giọng nói của họ; "Tắt giọng" chỉ tắt giọng nói. Cả hai giữ tới khi bạn tải lại trang.'
- If someone must be removed: the group moves to a new code ("Tạo mã nhóm mới", then "Gửi link mời" to the others).

**Speaking marker in the world**
- A small gold sound-wave sprite, about 0.22 m, beside the name tag on its left in camera space, at the tag's height. Position: tag centre + camera-right × −(tag half-width + 0.14 m). It never overlaps the chat bubble, whose bottom is at +2.35 m.
- Opacity = smoothed heard level × the tag's own visibility factor (`p.vis` × 40 m distance fade). Faded, hidden or wedged peers show no marker. A peer muted by me shows a dim marker (speaking, but muted).
- Only peers with an avatar slot (at most `MAX_SHOW`) get one.

**Music ducking**
- Music × 0.35 and ambience × 0.5 (ramped), multiplied with the existing activity duck, while either holds:
  - this player's mic is open;
  - any voice the player actually hears (level × that peer's gain target, so muted, hidden and quieted peers do not count) was above the threshold in the last 1.5 s.
- It recovers 1.5 s after the last voice.

**Game muted**
- When the game is muted (button / key M), voices are silent too: the game `AudioContext` is suspended.
- Once per page load, when a live peer has `vo` bit 2 and a stream from them exists, a toast (5 s) shows "Trò chơi đang tắt tiếng nên bạn chưa nghe được giọng nói. Bấm nút loa để bật lại." This is driven by flags, not by levels.

**First voice heard** (once per page load), toast (5 s): "Có người trong nhóm đang nói. Muốn nhỏ tiếng hoặc tắt giọng một người, mở Cài đặt."

**Hidden tab:** incoming voices are silent and the mic is closed. The player is out of the conversation until they come back.

**Receiver cap:** at most 8 voice streams are played at once. Extra streams are kept but not played until a slot frees.

### 3.5 Meditation and chanting

- New switch **"Tự im khi ngồi thiền / tụng kinh"**. Default **on** (read with `!== false`), saved as `G.save.data.chung.voiceQuiet`.
  - Description: "Khi bạn ngồi thiền hoặc tụng kinh, micro của bạn tự tắt; tiếng trong nhóm im hẳn khi thiền và nhỏ lại khi tụng kinh. Xong bạn bấm micro nếu muốn nói tiếp."
- **When on:**
  - On entering meditation (`thien`) or chanting (`tung`), an open mic closes with toast (4 s) "Micro đã tắt vì bạn đang ngồi thiền." or "Micro đã tắt vì bạn đang tụng kinh."
  - Incoming voice gain becomes 0 for meditation and 0.25 for chanting. On Path B chanting is also fully silent.
  - On leaving, gains return to 1. The mic stays closed.
- **When off:** nothing changes during these activities, so groups who want to chant together keep talking. The pill from 3.3 keeps an open mic controllable.
- Other activities (incense, bell, prayer writing…) never change the mic. The pill shows while it is open.

### 3.6 Privacy note (shown in the voice block)

While a relay is configured (`G.chung.relay`):

"Giọng nói đi thẳng giữa các máy trong nhóm; khi hai máy không nối thẳng được thì đi qua máy chủ chuyển tiếp, vẫn được mã hoá nên máy chủ không nghe được. Trò chơi không ghi âm và không lưu. Người trong nhóm vẫn có thể tự ghi âm, và lời nói không được lọc như chữ, nên chỉ nói chuyện với người bạn tin. Ai có link mời cũng vào nhóm và nghe được. Sau khi bạn cho phép micro, người cùng nhóm có thể thấy thêm địa chỉ mạng nội bộ (trong nhà) của bạn. Trẻ em nên chơi cùng người lớn. Giọng nói dùng tốt nhất khi nhóm có tối đa 8 người."

Without a relay the note starts "Giọng nói đi thẳng giữa các máy trong nhóm; trò chơi không ghi âm và không lưu. Người trong nhóm" and the rest is the same. The note is chosen when the voice block is painted.

The module 22 notes `IP_PUBLIC` and `IP_GROUP` say who sees the IP exactly as the multiplayer change does, built when the settings row is built: "vài điểm hẹn công cộng (relay Nostr, máy chủ STUN của Google và Cloudflare, máy chủ chuyển tiếp ExpressTURN) cũng thấy IP của bạn; máy chủ chuyển tiếp chỉ chuyển dữ liệu, đã mã hoá, khi hai máy không nối thẳng được" while a relay is configured, and "vài điểm hẹn công cộng (relay Nostr, máy chủ STUN của Google và Cloudflare) cũng thấy IP của bạn" without one. The switch description gains "Trong nhóm riêng, giọng nói chỉ đi khi bạn tự bấm micro, cũng theo cách đó và được mã hoá." and the code note says voice goes "(đi giữa các máy, được mã hoá, không ghi âm, không lưu)".

The existing static texts that mention only text sharing are updated to mention voice: `22-di-chua-chung.js` around lines 776, 795 and 810, and README lines 19–20.

## 4. Architecture

Three new modules. All are registered in `99-boot.js` right after "đi chùa chung", each guarded with `typeof … === 'function'`, and `build.js` picks them up automatically. Each installer returns early if `G.chung` is missing.

| Module | Owns | Est. lines |
|---|---|---|
| `src/23-loi-moi.js`: `installLoiMoi(G)` | Code generator; the invite row in Settings ("Tạo mã nhóm mới", "Gửi link mời", fallback field); `#nhom=` parsing; invite panel and its timing. | 180 |
| `src/24-giong-noi.js`: `installGiongNoi(G)` | Voice engine, with no UI text. Mic lifecycle; private voice `AudioContext` (`vctx`) with the silent keep-alive track and own-level meter; senders (`sentTo`, `reconcile`); receivers (stream map, Path A/B, per-peer gains, receiver cap); metering; caps; auto-close; quiet rule; voice duck. Exposes `G.voice`; emits `voice:state` and `voice:notice`. | 450 |
| `src/25-giong-noi-giao-dien.js`: `installGiongNoiUI(G)` | Mic button, pill, key V, settings voice block (two switches, hint, privacy note), people-list chips and markers, speaking sprites, and all voice toasts (it maps `voice:notice` codes to the texts in section 3). | 330 |

Changes elsewhere:

| File | Change |
|---|---|
| `22-di-chua-chung.js` | See 4.1. |
| `10-audio.js` | `voiceBus` (GainNode) → `voiceG` (level from `CAT.voice`) → `master`. Voices go through the shared lowpass and compressor, which is accepted. `G.audio.voiceIn()` returns `voiceBus`, or `null` with no context. `G.audio.voiceDuck(on)`: `setDuck` and `voiceDuck` compute one combined target per bus, so the two ducks never fight. `applyLevels` handles `voice`. `preview('voice')` is a no-op. |
| `00-core.js` | `SOUND_CATS` row `['voice', 'Âm lượng giọng nói', 'Tiếng người cùng nhóm nói chuyện']`. The migration loop fills it for old saves. |
| `45-ngoi-tung-kinh.js` | Module-scope `let mode = null`. Set `'tung'` in `startChant` after `newScreen()` and after the `!total` early return; `'thien'` in `startThien` after `newScreen()`; `null` in `endScreen`. Add a `G.ngoi.mode` getter and emit `G.events.emit('ngoi:mode', mode)` on change. `newScreen` calls `endScreen` first, so listeners apply only the last value per tick. |
| `shell.html` | `#toasts` gets `role="status" aria-live="polite"`. |
| `API.md`, `AREA2.md`, `HUONG-DAN-CONG-KHAI.md`, `README.md` | `G.voice`, new events, change log, privacy lines. |

### 4.1 Module 22 additions

**Peer state and events**
- `mkPeer` initialises `vo: 0`.
- `myState()` adds `vo: G.voice ? G.voice.flags() : 0`, and it is part of the `changed` comparison.
- `onState` parses `vo = (data.vo | 0) & 3`. On change it stores `p.vo` and emits `chung:vo (id, vo)`.
- `room.onPeerJoin` emits `chung:peer-join (id)`.
- `room.onPeerLeave` sets `p.vo = 0`, emitting `chung:vo` if that changed, and emits `chung:peer-leave (id)`.
- `removePeer` emits `chung:peer-remove (id)`.
- Module 24 must not overwrite `room.onPeerJoin` / `onPeerLeave`. These are Trystero setters that replay for already-connected peers, so module 24 treats a repeated join as a no-op.
- `connect()` emits `chung:room {room, code}` after joining. `disconnect()` emits `chung:room {room: null}`. Module 24 ignores a repeat with the same room object.
- `hide(id, on)` emits `chung:hide (id, on)`.

**API**

| Name | What it does |
|---|---|
| `G.chung.isHidden(id)` | Whether this player hid that peer. |
| `G.chung.voiceEligible` | The code has ≥ 10 letters or digits. |
| `G.chung.inApp` | `ENV.inApp && navigator.standalone !== true`. |
| `G.chung.IN_APP_TIP` | The existing in-app tip text. |
| `G.chung.holdDefault()` | Called by module 23 at install when a valid invite link names another code. On `'enter'` module 22 then joins no room and shows no once-per-device notice, until `releaseDefault()` or any `connect()`. |
| `G.chung.relay` | `true` while `TURN_SERVERS` holds a valid list (from the multiplayer change). Module 25 reads it for the privacy note. |
| `G.chung.defaultOn` | The default of the switch for a player who never chose: on for the public site, off for copies run on the machine (from the multiplayer change). |
| `G.chung.releaseDefault()` | Ends the hold. If `'enter'` came while held, multiplayer is on and no room is joined: joins the room from the saved setting, and shows the once-per-device notice if the player never chose. Otherwise does nothing. |
| `G.chung.diagErr(msg)` | Adds a message to the existing diagnostics errors. |
| `G.chung.relist()` | Invalidates the people-list signature so the list rebuilds on the next paint. |
| `G.chung.anchor(p)` | `{x, y, z, k, half}` for the name tag: centre, visibility factor `p.vis` × distance fade, half-width in metres; `null` without a slot. |
| `G.chung.voiceCfg` / `G.chung.setVoiceCfg(patch)` | Reads `{voice, voiceQuiet}`, each defaulting to true via `!== false`; writes and persists. |

`DEF_CHUNG` and the literal in `cfgWrite` both gain `voice: true, voiceQuiet: true`. Normalisation is `c.voice = c.voice !== false` (likewise `voiceQuiet`), never `!!`.

**Settings and people list**
- After building its Settings block, module 22 emits `ui:chung-settings ({block, more})`. Module 23 inserts the invite row in `block`, under the switch row; module 25 appends the voice block to `more`.
- The people-list signature adds `(q.vo & 2 ? '+' : '')`.
- After building each row, module 22 emits `ui:chung-person ({peer, row})`. Module 25 keeps `Map<id, {chip, mark}>`, replaced on each emission and pruned by `isConnected`. It writes the "đang nói" marker directly at 15 Hz.
- The hint and the static texts change as in 3.4 and 3.6. The word "phòng" becomes "nhóm" when a code is set.

### 4.2 Sending (module 24)

**Page-level:**
- `vctx`: a private `AudioContext`, created inside the first mic-open tap and kept for the page. `10-audio` never suspends it, so the keep-alive does not stop when the game is muted.
- `silent`: one MediaStreamTrack: `OscillatorNode` → `GainNode(0)` → `vctx.createMediaStreamDestination()`. It is digital silence.

**Per room session** (reset on `chung:room`):
- `mic`: the current getUserMedia track, or `null`.
- `out`: a `MediaStream` that always holds exactly one track, the current track (`mic` while open, otherwise `silent`).
- `sentTo: Map<id, {pc, sender}>`.

**Desired track for a peer:** `mic` if all of these hold, otherwise `silent`:
- `state === 'open'`
- the peer is live (`got`, not `gone`, younger than `STALE_S`)
- the peer has `vo & 1`
- the peer is not hidden by this player

**`reconcile()`**
- Runs on: open, close, `chung:vo`, `chung:hide`, `chung:peer-leave`, `chung:peer-remove`, the room event, and a 1 s tick for staleness.
- For each id in `sentTo`:
  - drop the entry if the peer is gone;
  - drop the entry if `room.getPeers()[id] !== entry.pc` (reconnected peer: new connection).
- For each live peer:
  - **No entry, and the desired track is `mic`:**
    - Call `room.addStream(out, { target: id, metadata: { v: 1, k: 'voice' } })`.
    - Find the sender: `pc.getSenders().find(s => s.track === mic)`. Look right after the call, and again after the promise settles. Store `{pc, sender}`.
    - If no sender is found: `diagErr`, no entry, and retry on later ticks at most 3 times per peer per session.
    - No entry is ever created for a peer that only needs silence.
  - **Entry exists and `entry.sender.track !== desired`:** call `entry.sender.replaceTrack(desired)`.
  - Hidden peers and non-listeners get `silent`, never `null`. This keeps their jitter buffer healthy for a later un-hide or listening-on.
- Forbidden: `room.replaceTrack`, `room.removeStream`, `room.onPeerTrack`, a second `addStream` on the same connection, and the positional `addStream(stream, id)`.

**Open**
1. Synchronously inside the tap handler, before any `await`: create `vctx` and `silent` if missing, or call `vctx.resume()`. iOS only lets a context start inside the gesture.
2. Remember `navigator.audioSession.type` and set it to `'play-and-record'` (try/catch, only if present).
3. `getUserMedia` (3.3). If it has not answered after `openWaitMs` (30 000 ms; Firefox "Not now" never answers), the state goes back to `'off'` with no notice, and an answer that arrives later is stopped at once.
4. Put `mic` into `out` (remove the old track, add the new one).
5. Build the own-level analyser on `vctx` (mic source → analyser → `GainNode(0)` → `vctx.destination`). It is rebuilt on every open, because a source node is bound to its track.
6. `state = 'open'`, emit `voice:state`, `reconcile()`.

**Close**
1. `mic.enabled = false` at once (a disabled track sends silence even if a swap stalls), then `state = 'off'` and put `silent` into `out`.
2. Replace every sender's track with `silent` and wait for all of them (`await Promise.allSettled`).
3. Then `mic.stop()`, which releases the OS indicator and the iOS capture.
4. Disconnect the own-level analyser.
5. Restore the remembered `audioSession.type`.
6. Emit `voice:state` and the matching `voice:notice`.

**Fallbacks and teardown**
- If `vctx` or `silent` cannot be created, close uses `sender.replaceTrack(null)`. The delay growth from section 2 is accepted, and `stats.silentFallback` counts it.
- On room change or disconnect: stop `mic`, clear `out` and `sentTo` (Trystero closes the connections). `silent` and `vctx` stay.

### 4.3 Receiving (module 24)

- Module 24 sets `room.onPeerStream` on each new room. Streams with `meta?.k !== 'voice'` are ignored. Every voice stream is stored in `streams: Map<id, MediaStream>` before any listening or hidden check. A repeated stream for the same id replaces the old one and tears down its nodes.
- Playback nodes for an id exist only when all of these hold: the listening switch is on, the peer is not hidden, a stream exists, and fewer than 8 nodes are active. `syncNodes(id)` runs on stream arrival, on the switches, on `chung:hide`, and when a slot frees. Turning listening off drops the nodes but keeps `streams`. Turning it back on rebuilds from `streams`. If a stored track has `readyState === 'ended'`, the stream is rebuilt from that connection's audio receiver: `new MediaStream([receiver.track])`.
- **Path A** (default whenever `G.audio.voiceIn()` is not `null`):
  - Playback element: a detached `<audio muted playsinline>` with `srcObject = stream` and `play().catch(() => {})`. Chrome needs an element holding the stream; Safari needs the explicit `play()`.
  - Graph: `src = gctx.createMediaStreamSource(stream)`, then src → `AnalyserNode` (fftSize 2048), and src → per-peer `GainNode` → `voiceIn()`.
- **Path B** (`voiceIn()` is `null`, or `G.voice.route = 'element'` after the device test):
  - The `<audio>` element is unmuted. `el.muted = !(gainTarget > 0)`, and it also follows `audio:mute`.
  - Volume sliders and the 0.25 chanting level do not apply (the slider note in 3.4).
  - An analyser tap is attached if a context exists (src → analyser → `GainNode(0)` → destination). If it reads nothing, markers and ducking simply do not happen.
- **Gain target per peer:** 0 if muted by me; otherwise the quiet factor (1, 0.25 for chanting, 0 for meditation). Ramped with `setTargetAtTime(…, 0.08)`. Hidden peers have no nodes at all.
- **Teardown** (peer leave or removal, room change, hide, listening off): disconnect the nodes, set `el.srcObject = null`, drop the element. On leave, removal and room change, also delete the `streams` entry.

### 4.4 Levels and speaking (modules 24, 25)

- One meter loop at 15 Hz in module 24.
  - Each analyser gives a time-domain RMS, smoothed with attack 0.05 s and release 0.4 s.
  - Speaking threshold: `SPEAK_RMS = 0.02` (a constant).
  - Remote levels read as 0 unless `gctx.state === 'running'` and the page is visible.
- `G.voice.levels`: `Map<id, {raw, heard}>`, where `heard = raw × gainTarget`.
- `G.voice.ownLevel`: from the `vctx` analyser. It drives the ring and the 120 s timer. It is independent of game mute.
- Module 25 registers `G.onUpdate(…, 23)`, after module 22's avatar write, to position the sprites and set their opacity every frame.
  - Sprite pool: `MAX_SHOW` sprites, each with its own `SpriteMaterial` sharing one `CanvasTexture`.
  - Levels are read from `G.voice.levels`.

### 4.5 Quiet rule and activities (module 24 / 25)

- Module 24 applies `ngoi:mode` at the end of the tick (debounced with `setTimeout(0)`):
  - With `voiceQuiet` on and mode `thien` or `tung`: close an open mic with notice `quiet-thien` / `quiet-tung`, and set the quiet factor to 0 or 0.25.
  - On `null`: factor back to 1.
- Module 25 shows the pill on `activity:start` while `state === 'open'`, and hides it on `activity:end` or on close.

### 4.6 Public API `G.voice` (module 24)

**Read-only state**

| Name | Value |
|---|---|
| `flags()` | `vo` bits |
| `listening` | listening bit is set |
| `state` | `'off' \| 'opening' \| 'open'` |
| `available` | whether the mic can be offered at all |
| `blockReason` | `''`, `'public'`, `'short-code'`, `'switch-off'`, `'in-app'`, `'no-devices'`, `'cap'` or `'group'` |
| `levels` | per-peer levels (4.4) |
| `ownLevel` | own mic level (4.4) |
| `stats` | `{ sentTo, streams, activeNodes, opens, autoClosed, refusedCap, refusedGroup, errors, silentFallback }` |

**Actions**
- `openMic()`: call from a user gesture.
- `closeMic(reason)`.
- `mutePeer(id, on)` / `isMuted(id)`. `mutePeer` calls `G.chung.relist()` and emits `chung:change`.

**Test hooks**
- `route`: `'graph' | 'element'`.
- `silenceMs`: default 120000.

**Events**
- `voice:state (state)`.
- `voice:notice (code, extra)`. Codes: `first-open`, `alone`, `cap`, `group`, `group-close`, `silence`, `ended`, `code-change`, `quiet-thien`, `quiet-tung`, `in-app`, `err-<name>`, `muted-game`, `first-voice`. Module 25 maps each code to the text in section 3.

## 5. Error handling and edge cases

- Every call that can fail is wrapped. That covers `getUserMedia`, `audioSession`, `play()`, `addStream`, `sender.replaceTrack`, `AudioContext` creation and `resume()`. Failures go to a `voice:notice` toast (the user-facing cases above) and to `G.chung.diagErr`, never to an unhandled rejection.
- **Two people opening at once:** Trystero's perfect negotiation handles it (measured clean).
- **A peer crashes:** their audio stops at once. Nodes, the `streams` entry and the `sentTo` entry are removed on `chung:peer-leave` (measured 12 s) or `chung:peer-remove`. Their stale `vo` is cleared on leave.
- **A peer reconnects with the same id:** the connection-identity check drops the old `sentTo` entry, and `reconcile` sends to the new connection. Test T8.
- **A stream arrives before the peer's first `st`:** it is stored. Nodes follow once `vo` and the hidden state are known.
- **A second tab in the same browser** is another person: a separate peer id with its own cap count. Documented, no detection.
- **Old clients** (`vo` 0): never receive `addStream` and behave as before. In an eligible group they still get the "Tắt giọng" chip like every peer (3.4): an old client and a new one with listening off both send `vo` 0, so they cannot be told apart.
- **A reload:** others may count the old id as open for up to `STALE_S`. A ghost marker can last until removal.
- **Peer count above `MAX_SHOW`:** voice works, but those peers have no sprite.
- **Turning the multiplayer switch off:** voice is fully torn down first. No track is left live (`readyState` is `'ended'` for all).
- **The game `AudioContext` failed:** Path B.
- **`vo` is untrusted.** A peer faking `vo = 3` can occupy cap slots. The caps are best effort, and the receiver cap bounds the local cost.

## 6. Testing

### 6.1 Headless tests

Rules for the headless runs:
- **Scratchpad only.** Private group codes or throwaway app ids only, never the public room `chua-an-lac-1`.
- **Multiplayer is on by default** in the build under test. The harness writes `chung.on = false` into each page's save before the page's scripts run, unless a test opts out (only under the WebSocket guard that blocks every relay), and a test fails if any page joins a room with an empty code. Copies run on 127.0.0.1 are off by default since revision 4; the WebSocket guard sets `window.__chungLocalDefaultOn = true` so guarded pages keep the public-site default. The harness waits for at least 4 GB of free RAM before it starts a browser (the owner's PC has 32 GB and must not freeze), runs one test file per command, and `run-all` waits for 5 GB before each file.
- **Private ports 99xx**, never 5174.
- **Chrome flags:** `--use-fake-device-for-media-stream --use-fake-ui-for-media-stream --disable-features=WebRtcHideLocalIpsWithMdns`.
- **Harnesses:** from `v6/voice/spike/lib4.mjs` and `v6/voice/check-send/`.
- **Unmute first.** Headless Chrome starts muted (`navigator.webdriver`), so every audio test first calls `G.audio.setMuted(false)` and waits for `ctx.state === 'running'`.

| ID | Test |
|---|---|
| T1 | **Link parsing.** A table: valid, upper case, `%20`, `&fbclid=…`, `?zarsrc=30` after the hash, 9 and 25 letters or digits, empty, junk. Each gives the expected code or the bad-link toast. |
| T2 | **Invite flow.** Fresh save: the tutorial comes first, the panel after it closes. Returning save: the panel appears ≥ 3.6 s after enter, never over a panel or activity. The hash is kept until the answer, and kept after a splash reload. An in-app user agent never strips it. "Vào nhóm" from off, from the public room, and from another code. The same code gives a toast. "Để sau", ✕ and Escape give the toast. The panel body is text nodes only. With multiplayer on by default and a never-chose save, a valid link joins no room before the answer (under the WebSocket guard); "Vào nhóm" then joins the invited group, "Để sau" joins the default room and shows the once-per-device notice. |
| T3 | **Generator.** Format and alphabet; 100k samples with no collision and a loose uniformity check; `cleanCode` no-op. "Tạo mã nhóm mới" while off joins only the new room: spy on `joinRoom`, the public room is never joined. The confirm panel appears when peers are live. |
| T4 | **Share.** A `navigator.share` stub that resolves, rejects with `AbortError` (no clipboard, no toast), or rejects otherwise (clipboard fallback). A clipboard rejection gives the selected field. |
| T5 | **Availability and saves.** Public room: no button, `vo` 0. Short code: hint, no button. Strong code: button. Switch off: no button and `vo` bit 1 cleared. Voice channel at 0: `vo` bit 1 cleared. Old save `{chung:{on:true,code:'k7m2-xp9q-4tnd',muteChat:false}}`: both switches read on. |
| T6 | **Hearing.** A opens; B and C hear the right tone within 600 ms. Late joiner D while A is closed hears within 600 ms of A's next open. Late joiner E while A is open hears within 1 s of joining. |
| T7 | **Regression guard: 100 open/close cycles.** Peers: A speaking, B and C listening, N with listening off, and O on the old build. After each open, B and C hear within 600 ms, and the average `jitterBufferDelay` over the next 2 s is < 150 ms. Zero renegotiation events after the first open. No "too many pending" warning. No `onPeerLeave` anywhere. Largest signalling message < 16 KB. |
| T8 | **Reconnect.** Force-close the A↔B connection while A's mic is open. After Trystero reconnects, B hears A within 3 s, and A's `sentTo` holds the new connection. |
| T9 | **Listening off/on, 20 times on B.** B hears A every time it is on. While off, A's sender to B carries `silent`. Signalling stays < 16 KB. |
| T10 | **Hide and mute.** B hides A: B's sender to A carries `silent` (A hears nothing while B talks), B has no nodes for A, and toggling A's mic leaks nothing to B. Un-hide restores both directions within 1 s. "Tắt giọng" gives gain 0 and "Nghe lại" restores it. The chip exists for a peer whose mic is closed. A `vo` change rebuilds the list. |
| T11 | **Caps.** 6 injected `vo = 3` peers: the 7th open is refused and the button is dimmed. 8 listeners: open refused. A 9th listener joining while open closes the mic with the toast. The receiver plays at most 8 streams. |
| T12 | **Opening race.** A deferred `getUserMedia` resolving after a code change, a hidden page, or the switch going off: the track is stopped and the state is off. A double tap is ignored. The cap is re-checked after resolve. |
| T13 | **Quiet and activities.** Meditation: the mic closes with the toast and incoming gain is 0. Chanting: 0.25 on Path A, muted on Path B. After leaving, the mic stays off. With `voiceQuiet` off nothing changes. Incense or bell with the mic open: the pill is visible and a tap closes the mic. During an activity, V closes but never opens. |
| T14 | **Lifecycle.** Shortened `silenceMs` closes with the toast. Hidden and pagehide close. Track `ended` gives the toast. A code change gives the toast. Multiplayer off leaves all tracks ended. After a reload the mic is off. |
| T15 | **Meters and duck.** While A speaks, the music target is × 0.35, recovering 1.5 s after. A muted peer causes no duck. Game muted: levels read 0 and the muted toast shows once. The first-voice toast shows once. |
| T16 | **Errors.** Each `getUserMedia` error name gives the matching toast for iOS and non-iOS user agents. An in-app user agent gives the dimmed button and tip. An iOS standalone user agent is not dimmed. No `mediaDevices` gives the toast. |
| T17 | **Keys and layout.** V is ignored in the chat and code inputs, with Ctrl+V, and while a panel or the tutorial is open. Space after clicking the mic does not toggle it. `aria-pressed` and `aria-busy` are correct. `#chungBar` fits at 320 and 360 px. |
| T18 | **Old and new builds mixed, both directions.** They see each other and chat, there are no errors, and the new build never sends a stream to the old one. |
| T19 | **Sprites.** The marker sits beside the name tag and does not overlap a chat bubble (screenshot). Hidden or faded peers show no marker. Peers beyond 16 get no sprite. |
| T20 | **Regression.** Existing private-room suites; smoke boot/enter/hall on desktop and touch emulation; multiplayer off loads no Trystero; voice is inert when multiplayer is off; no console errors. |

### 6.2 Rule-to-test map

| Rule | Tests |
|---|---|
| 3.1 inviting | T1–T4 |
| 3.2 listening | T5, T9 |
| 3.3 speaking | T6, T11, T12, T14, T16, T17 |
| 3.4 hearing | T10, T15, T19 |
| 3.5 quiet and activities | T13 |
| 4.2 sending | T7, T8, T9, T10 |
| 4.3 receiving | T6, T9, T10 |
| 4.4 levels | T15, T19 |
| 5 edge cases | T8, T12, T14, T18, T20 |

### 6.3 Kiểm tra trên điện thoại thật (chủ trò chơi làm, trước khi công khai)

Cần một iPhone và một điện thoại Android. Mỗi bước: làm theo, xem "Kỳ vọng"; nếu không đúng thì ghi lại bước số mấy và chụp màn hình.

1. Điện thoại A dùng 4G, điện thoại B dùng Wi-Fi. Trên A: Cài đặt → bấm "Tạo mã nhóm mới" → "Gửi link mời" → gửi qua Zalo cho B.
   - Kỳ vọng: A vào nhóm mới; khung chia sẻ hoặc câu "Đã chép link mời" hiện ra.
2. Trên B, mở link ngay trong Zalo.
   - Kỳ vọng: có câu nhắc mở bằng trình duyệt. Thử bấm micro: nút mờ, có câu hướng dẫn.
3. Trên B, chọn ⋯ → "Mở bằng trình duyệt" (Safari / Chrome), bấm "Vào chùa".
   - Kỳ vọng: hiện bảng "Lời mời vào nhóm"; bấm "Vào nhóm" thì sau một lúc thấy nhân vật của A.
4. A bấm micro, cho phép micro, rồi nói.
   - Kỳ vọng: B nghe rõ trong khoảng nửa giây, thấy dấu sóng vàng cạnh tên A, nhạc nền nhỏ lại.
5. A tắt rồi mở micro 5 lần, mỗi lần nói một câu.
   - Kỳ vọng: lần nào B cũng nghe ngay, không trễ dần.
6. B cũng mở micro. Hai bên nói chuyện, không đeo tai nghe, rồi có đeo tai nghe.
   - Kỳ vọng: nghe được nhau; ghi lại nếu có tiếng vọng.
7. Trên iPhone: gạt nút im lặng (bên hông) bật và tắt, khi micro tắt và khi micro mở.
   - Kỳ vọng: vẫn nghe giọng nói; ghi lại nếu mất tiếng hoặc chuyển sang loa trong (nghe nhỏ như gọi điện).
8. Trên iPhone: kết nối rồi ngắt tai nghe Bluetooth khi đang mở micro.
   - Kỳ vọng: micro tự tắt kèm câu báo, hoặc vẫn dùng được; không bị treo.
9. Chuyển sang ứng dụng khác 5 giây rồi quay lại; sau đó thử 1 phút.
   - Kỳ vọng: micro đã tắt; sau khi mở lại, bên kia nghe không bị trễ (ghi lại nếu trễ).
10. Bấm micro lần đầu và chọn "Không cho phép"; sau đó làm theo câu hướng dẫn để cho phép lại.
    - Kỳ vọng: câu hướng dẫn đúng với máy đang dùng.
11. Ngồi thiền 1 phút khi micro đang mở.
    - Kỳ vọng: micro tắt kèm câu báo; không nghe tiếng nhóm; nhạc thiền nghe bình thường.
12. Nếu có thể: một nhóm 4 người trở lên nói chuyện vài phút.
    - Kỳ vọng: nghe rõ, máy không quá nóng.

Các bước 4, 6 và 7 quyết định cách phát tiếng trên iPhone (Path A hay Path B). Nếu iPhone không nghe được ở bước 4 thì báo lại để chuyển iPhone sang Path B.

## 7. Risks and open points

**Bandwidth** (RTP level; on the wire it is a little higher):

| Direction | Situation | Cost | Bound |
|---|---|---|---|
| Download | heard open mics | ≈ 44 kbps × open mics | ≤ 6, so ≤ 264 kbps |
| Download | keep-alive from each peer that has opened its mic once | + ≈ 12.5 kbps each | |
| Upload | own mic open | ≈ 44 kbps × listeners | ≤ 7, so ≤ 308 kbps |
| Upload | own mic closed, after the first open | ≈ 12.5 kbps × peers in `sentTo` | |

- Each listener is a separate encoder in the mesh. A larger group needs a server (SFU), which is out of scope. The group limit of 8 can be revisited after the device test.

**Unverified on hardware:**
- On mobile, an app switch shorter than the ICE timeout leaves an RTP gap, after which listeners may hear that person about 1 s late. Device test step 9 checks this. If it shows up, a later design can rebuild that sender once after a long gap, within the 16 KB signalling budget.
- iOS: Path A routing, earpiece or loudspeaker, the silent switch, the keep-alive track while capture is closed, and `audioSession` restore. The device test decides Path A vs B for iOS.

**Network and trust:**
- Pairs that cannot connect directly (for example 4G with Wi-Fi) go through the ExpressTURN relay, like data. The relay sees addresses and traffic volume, not the audio (DTLS-SRTP end to end). If the relay is not configured, over its free plan (1000 GB a month; one heard stream is about 44 kbps, about 20 MB an hour) or blocked by the network (UDP and TCP 3478 only), those pairs hear nothing, same as data.
- Group links are bearer secrets: anyone with the link can join and listen. The privacy note and the invite panel say so.
- `vo` is self-reported; the caps are courtesy checks.

**Size:** about 960 new lines in three files, plus about 120 lines of changes in modules 22, 10, 00 and 45.
