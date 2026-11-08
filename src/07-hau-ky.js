// =====================================================================
//  HẬU KỲ (G.post): làm ảnh bên trong chính điện "như phim" — không cháy trắng ở vàng / hào quang / ngọn nến,
//  quầng sáng mềm (bloom), tối góc nhẹ (AO), khử răng cưa MSAA, tối viền nhẹ, làm nét nhẹ.
//  Chỉ chạy khi máy quay ở trong chính điện và đã qua cửa (trong vùng zone + mix > 0.02); ngoài ra renderer.render() như cũ, không đổi một điểm ảnh (tư thế đứng ở cửa cũng vẽ thẳng).
//  Dùng G.renderFrame (00-core.js). Addon Three.js tải bằng import() từ import map "three/addons/"; không tải được
//  (mất mạng / CDN lỗi) → im lặng vẽ thẳng như cũ (console.warn, KHÔNG ghi vào G.errors vì đó không phải lỗi của trò chơi).
//  Cũng vậy khi GPU không nhận mục tiêu half-float MSAA (fboOk kiểm sau khi tạo): bỏ MSAA → hạ mức 2 → 1 → 0 (vẽ thẳng), chỉ console.warn một lần. GTAOPass là tuỳ chọn (thiếu → tối đa mức 1, không AO).
//
//  Cách làm: cảnh được vẽ vào một mục tiêu HalfFloat (MSAA) NHƯNG vẫn mã hoá sRGB ngay trong shader vật liệu, y như khi vẽ ra màn hình
//  (r160 chỉ làm vậy với mục tiêu XR: ta đặt cờ isXRRenderTarget + texture.colorSpace = sRGB; bản three được ghim đúng 0.160.0).
//  Nhờ đó: pha trộn trong suốt / cộng sáng (quầng 07-fx, hào quang, bụi sáng, vòng POI, bóng blob), gộp mẫu MSAA và chương trình
//  shader của vật liệu GIỐNG HỆT vẽ thẳng — vào / ra chính điện không "nhảy" — còn giá trị vượt 1.0 (vàng, hào quang) không bị cắt vì mục tiêu là half-float.
//  Chuỗi:  cảnh → rtM (đã gộp mẫu) → [mức 2: GTAO nửa độ phân giải, nhân vào ảnh → rtA] → bloom (lọc sáng riêng: chỉ phần năng lượng vượt 1.0 toả sáng;
//          nửa độ phân giải, mức 1 = một phần tư) → chỉnh màu (giải mã sRGB → vai mũ + tương phản + giảm bão hoà vùng sáng + làm nét CAS + tối viền → mã hoá sRGB) → màn hình.
//  Không dùng EffectComposer (nhân đôi mục tiêu MSAA cho mọi bước) và không cần OutputPass (bước chỉnh màu đã mã hoá sRGB; renderer.toneMapping vẫn NoToneMapping).
// =====================================================================
function installHauKy(G) {
  const THREE = G.THREE, renderer = G.renderer, scene = G.scene, camera = G.camera;
  const plainRender = G.renderFrame; // vẽ thẳng (00-core.js)
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const MAX_PIX = 4.2e6; // trần số điểm ảnh của các mục tiêu trung gian (màn 4K / DPR cao): vượt thì co đều hai chiều; bước chỉnh màu vẫn ghi ra canvas đúng cỡ của nó
  const gl0 = renderer.getContext();
  const clr0 = new THREE.Color(); renderer.getClearColor(clr0); const ca0 = renderer.getClearAlpha(); // màu / alpha xoá lúc cài: trả lại khi chuỗi chết giữa chừng

  // tham số chỉnh được lúc chạy (G.post.params.*), giá trị đã đo — xem API.md
  const params = {
    exposure: 0.9, aces: 0.0, knee: 0.55, contrast: 1.06, ceil: 0.88, desat: 0.45, vig: 0.25, vigStart: 0.55, sharp: 0.18,
    ao: 0.6, aoRadius: 0.55, aoSamples: 12, aoScale: 0.5,
    bloomDay: 0.2, bloomNight: 0.14, bloomThr: 1.3, bloomKnee: 0.5, bloomRadius: 0.3,
    zoneX: 19.5, zoneY: 18, zoneZ0: -116, zoneZ1: -84, mixZ0: -85.5, mixZ1: -87.2, // dốc trộn -85.5 → -87.2 xong trước máy quay chân dung anh hùng (z ≈ -87.35) và máy quay ngồi / tụng kinh (z ≈ -87.3) nên hai máy này có mix 1; cửa (z -84.3) có mix 0 → chuỗi tắt hẳn, vẽ thẳng
  };
  const P = (G.post = {
    level: 0, maxLevel: 0, active: false, mix: 0, enabled: true, ready: false, loaded: false, reason: 'đang tải',
    glowGain: 1, // 07-fx nhân quầng sáng với số này; hiện luôn 1 vì pha trộn cộng sáng giữ nguyên không gian sRGB như vẽ thẳng
    params, passes: null, stats: { frames: 0, ms: 0, prewarmMs: 0, samples: 0, targets: '' },
    set(level) { setLevel(level); }, rebuild() { build(); },
  });
  let rtM = null, rtA = null, gtao = null, bloom = null, grade = null, lib = null;
  let busy = false, lost = false, lostN = 0, lastW = 0, lastH = 0, warnedFbo = false; // lostN: số lần mất ngữ cảnh — để lùi mức thay vì dựng lại y nguyên
  const _cc = new THREE.Color(), _black = new THREE.Color(0, 0, 0);

  // ---------- chỉnh màu: một lượt đủ vai mũ + tương phản + giảm bão hoà + làm nét CAS + tối viền ----------
  const gradeShader = {
    uniforms: {
      tDiffuse: { value: null }, tBloom: { value: null }, uBloomOn: { value: 0 }, uTexel: { value: new THREE.Vector2(1, 1) }, uMix: { value: 0 },
      uExposure: { value: params.exposure }, uAces: { value: params.aces }, uKnee: { value: params.knee }, uContrast: { value: params.contrast },
      uCeil: { value: params.ceil }, uVig: { value: params.vig }, uVigStart: { value: params.vigStart }, uSharp: { value: params.sharp }, uDesat: { value: params.desat },
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform sampler2D tDiffuse, tBloom; uniform vec2 uTexel; uniform float uBloomOn;
      uniform float uMix, uExposure, uAces, uKnee, uContrast, uCeil, uVig, uVigStart, uSharp, uDesat;
      varying vec2 vUv;
      const vec3 LW = vec3(0.2126, 0.7152, 0.0722);
      // ảnh trong mục tiêu đã MÃ HOÁ sRGB (giá trị có thể > 1 nếu năng lượng tuyến tính > 1)
      vec3 dec(vec3 e) { return mix(pow((e + 0.055) / 1.055, vec3(2.4)), e / 12.92, step(e, vec3(0.04045))); }
      vec3 enc(vec3 l) { return mix(1.055 * pow(l, vec3(1.0 / 2.4)) - 0.055, l * 12.92, step(l, vec3(0.0031308))); }
      vec3 aces(vec3 x) { x *= uExposure; return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
      // vai mũ: giữ nguyên tới uKnee, rồi cong mượt về trần uCeil (không cháy trắng); bóng và trung gian không đổi
      vec3 shoulder(vec3 x) { vec3 o = max(x - uKnee, 0.0); return min(x, vec3(uKnee)) + (uCeil - uKnee) * (1.0 - exp(-o / (uCeil - uKnee))); }
      // uMix = 0: đúng như vẽ thẳng (cắt ở 1.0); uMix = 1: bloom + tương phản mềm (luỹ thừa quanh 0.18) + vai mũ (pha uAces phần ACES). Trả về sRGB 0..1
      vec3 look(vec3 e, vec3 bl) {
        e = max(e, vec3(0.0));
        vec3 plain = min(e, vec3(1.0));
        vec3 l = dec(e) + bl;
        vec3 k = 0.18 * pow(max(l, vec3(1e-5)) / 0.18, vec3(uContrast));
        vec3 t = mix(shoulder(k), min(aces(l), vec3(1.0)) * uCeil, uAces);
        return mix(plain, enc(clamp(t, 0.0, 1.0)), uMix);
      }
      void main() {
        vec3 raw = texture2D(tDiffuse, vUv).rgb;
        // uMix ≈ 0 (chuỗi chỉ chạy khi mix > 0.02 nhưng tham số / thử nghiệm có thể ép 0): đúng ảnh vẽ thẳng, khỏi tính look() năm lần
        if (uMix < 0.002) { gl_FragColor = vec4(clamp(raw, 0.0, 1.0), 1.0); return; }
        vec3 bl = uBloomOn > 0.5 ? texture2D(tBloom, vUv).rgb : vec3(0.0);
        vec3 e = look(raw, bl);
        vec3 b = look(texture2D(tDiffuse, vUv + vec2(0.0, -uTexel.y)).rgb, vec3(0.0));
        vec3 d = look(texture2D(tDiffuse, vUv + vec2(-uTexel.x, 0.0)).rgb, vec3(0.0));
        vec3 f = look(texture2D(tDiffuse, vUv + vec2(uTexel.x, 0.0)).rgb, vec3(0.0));
        vec3 h = look(texture2D(tDiffuse, vUv + vec2(0.0, uTexel.y)).rgb, vec3(0.0));
        // CAS (làm nét thích ứng, trên ảnh đã mã hoá): chỉ nét hơn ở chỗ còn dư biên độ, không viền sáng ở nơi đã sát 0 / 1
        vec3 mn = min(min(min(d, e), min(f, b)), h), mx = max(max(max(d, e), max(f, b)), h);
        vec3 amp = sqrt(clamp(min(mn, 1.0 - mx) / max(mx, vec3(1e-4)), 0.0, 1.0));
        vec3 w = amp * (-1.0 / mix(8.0, 5.0, uSharp)) * uMix;
        vec3 col = clamp(((b + d + f + h) * w + e) / (1.0 + 4.0 * w), 0.0, 1.0);
        // vùng sáng rực ngả về trắng ấm, không ngả vàng cam gắt
        float ds = smoothstep(0.7, 1.2, dot(dec(max(raw, vec3(0.0))), LW)) * uDesat * uMix;
        vec3 warm = vec3(1.0, 0.965, 0.87); warm /= dot(warm, LW);
        col = mix(col, vec3(dot(col, LW)) * warm, ds);
        // tối viền hình elip: bắt đầu ở uVigStart (1 = góc), tính ngay trên ảnh hiển thị
        float r = length((vUv - 0.5) * 2.0) * 0.70710678;
        col *= 1.0 - uVig * uMix * smoothstep(uVigStart, 1.0, r);
        gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
      }`,
  };

  // bước lọc sáng của bloom: chỉ phần năng lượng TUYẾN TÍNH vượt ngưỡng (theo kênh sáng nhất, đầu gối mềm) mới toả sáng, không phải cả bề mặt vàng
  const highPass = `
    uniform sampler2D tDiffuse; uniform float luminosityThreshold; uniform float smoothWidth; varying vec2 vUv;
    void main() {
      vec3 e = max(texture2D(tDiffuse, vUv).rgb, vec3(0.0));
      vec3 c = mix(pow((e + 0.055) / 1.055, vec3(2.4)), e / 12.92, step(e, vec3(0.04045)));
      float br = max(max(c.r, c.g), c.b);
      float kn = max(smoothWidth, 1e-3);
      float soft = clamp(br - luminosityThreshold + kn, 0.0, 2.0 * kn); soft = soft * soft / (4.0 * kn);
      float k = max(soft, br - luminosityThreshold) / max(br, 1e-4);
      gl_FragColor = vec4(c * k, 1.0);
    }`;

  // ---------- chọn phần nào của cảnh vào bước GTAO (pháp tuyến + độ sâu) ----------
  // Bỏ: điểm / đường / sprite, vật trong suốt hay cộng sáng, alphaTest, mặt trong của vòm trời, vật không ghi độ sâu (quầng, hào quang, vòng sáng, bóng blob, bụi sáng...).
  // Giữ vật đặc kể cả InstancedMesh (khách hành hương) để độ sâu khớp với ảnh chính.
  // Danh sách vật cần bỏ được nhớ lại và chỉ dò lại cảnh tối đa 1 giây (G.time) một lần, hoặc khi số con trực tiếp của cảnh đổi; mỗi khung chỉ bật / tắt .visible trên danh sách đó.
  const hidden = [];                              // vật đã tắt trong khung này (aoShow bật lại đúng những vật ấy; vật vốn đã ẩn vì lý do khác vẫn ẩn)
  const cand = [];                                // vật ứng viên (noAO) tìm được ở lần dò gần nhất
  let candT = -1e9, candN = -1;
  const badMat = (m) => m.transparent || m.alphaTest > 0 || m.depthWrite === false || m.side === THREE.BackSide || m.blending === THREE.AdditiveBlending || m.colorWrite === false;
  const noAO = (o) => {
    if (o.isPoints || o.isLine || o.isSprite) return true;
    if (!o.isMesh) return false;
    const m = o.material; if (!m) return true;
    if (Array.isArray(m)) { for (let i = 0; i < m.length; i++) if (badMat(m[i])) return true; return false; }
    return badMat(m);
  };
  const scanOne = (o) => { if (noAO(o)) cand.push(o); };
  function aoScan() { cand.length = 0; scene.traverse(scanOne); candT = G.time || 0; candN = scene.children.length; }
  function aoHide() {
    const t = G.time || 0;
    if (candN !== scene.children.length || !(t >= candT && t - candT < 1.0)) aoScan();
    hidden.length = 0;
    for (let i = 0; i < cand.length; i++) { const o = cand[i]; if (o.visible) { o.visible = false; hidden.push(o); } }
  }
  function aoShow() { for (let i = 0; i < hidden.length; i++) hidden[i].visible = true; hidden.length = 0; }
  // trả lại mọi thứ chuỗi có thể đã đổi giữa chừng khi ném lỗi: vật bị ẩn cho AO, vật liệu ghi đè, autoClear, màu xoá, mục tiêu vẽ
  function resetState() {
    try { aoShow(); } catch (e) {}
    scene.overrideMaterial = null; renderer.autoClear = true; renderer.setClearColor(clr0, ca0);
    if (gtao) gtao.camera = camera;
    renderer.setRenderTarget(null);
  }

  // ---------- GPU có thật sự nhận mục tiêu này không? ----------
  // Vài GPU di động báo đủ extension nhưng framebuffer half-float (nhất là có MSAA) không hoàn chỉnh → cả chính điện đen thui.
  // probe = true: vẽ thử một tam giác vào mục tiêu (kể cả bước gộp mẫu MSAA) rồi đọc cờ lỗi; false: chỉ hỏi trạng thái framebuffer + cờ lỗi.
  function glErr() { const e = gl0.getError(); for (let i = 0; i < 16 && gl0.getError() !== gl0.NO_ERROR; i++); return e; } // đọc rồi xoá hết cờ lỗi, trả về lỗi đầu tiên
  function fboOk(rt, probe) {
    if (gl0.isContextLost()) return true; // mất ngữ cảnh: chưa kết luận được — 'webglcontextrestored' sẽ dựng lại và kiểm tra lại
    let ok = false, g = null, m = null;
    const sm = renderer.shadowMap.needsUpdate;
    try {
      if (probe) glErr(); // bỏ cờ lỗi cũ không phải của ta
      renderer.setRenderTarget(rt);
      ok = gl0.checkFramebufferStatus(gl0.FRAMEBUFFER) === gl0.FRAMEBUFFER_COMPLETE;
      if (ok && probe) {
        g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 0, 1, 0], 3));
        m = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false;
        const sc = new THREE.Scene(); sc.add(mesh);
        renderer.render(sc, new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1)); // xoá + vẽ + gộp mẫu MSAA
      }
      ok = ok && glErr() === gl0.NO_ERROR;
    } catch (e) { ok = false; }
    if (g) g.dispose(); if (m) m.dispose();
    renderer.shadowMap.needsUpdate = sm;
    renderer.setRenderTarget(null);
    return ok;
  }
  // mọi mục tiêu của chuỗi (dùng cuối prewarm, sau khi cả chuỗi đã chạy thử): GL không báo lỗi và framebuffer nào cũng hoàn chỉnh
  function fboAll() {
    if (gl0.isContextLost()) return true;
    if (glErr() !== gl0.NO_ERROR) return false;
    const l = [rtM, rtA];
    if (bloom) l.push(bloom.renderTargetBright, ...bloom.renderTargetsHorizontal, ...bloom.renderTargetsVertical);
    if (gtao) l.push(gtao.normalRenderTarget, gtao.gtaoRenderTarget, gtao.pdRenderTarget);
    for (let i = 0; i < l.length; i++) if (l[i] && !fboOk(l[i], false)) return false;
    return true;
  }
  function warnFbo(msg) { if (warnedFbo) return; warnedFbo = true; console.warn('[hậu kỳ] ' + msg); } // giới hạn của GPU, không phải lỗi trò chơi → không vào G.errors

  // ---------- dựng / huỷ ----------
  function sizes() {
    const pr = renderer.getPixelRatio();
    let W = Math.round(G.size.w * pr), H = Math.round(G.size.h * pr);
    if (W * H > MAX_PIX) { const k = Math.sqrt(MAX_PIX / (W * H)); W = Math.round(W * k); H = Math.round(H * k); }
    return { W: Math.max(2, W), H: Math.max(2, H) };
  }
  function dispose() {
    // GTAOPass.dispose của r160 bỏ sót hai vật liệu này
    if (gtao) for (const k of ['gtaoMaterial', 'blendMaterial']) { try { gtao[k] && gtao[k].dispose(); } catch (e) {} }
    if (bloom && bloom.materialHighPassFilter) { try { bloom.materialHighPassFilter.dispose(); } catch (e) {} } // UnrealBloomPass.dispose không giải phóng vật liệu high-pass tự thay
    for (const o of [rtM, rtA, gtao, bloom, grade]) { try { o && o.dispose && o.dispose(); } catch (e) {} }
    rtM = rtA = gtao = bloom = grade = null; P.passes = null;
    P.active = false; P.mix = 0; P.stats.targets = ''; P.stats.samples = 0;
    cand.length = 0; hidden.length = 0; candN = -1; // bỏ tham chiếu tới vật của cảnh; lần sau dò lại
  }
  const HF = { type: THREE.HalfFloatType, depthBuffer: false, stencilBuffer: false, generateMipmaps: false };
  function newSceneTarget(W, H, samples) {
    const rt = new THREE.WebGLRenderTarget(W, H, { ...HF, depthBuffer: true, samples }); rt.texture.name = 'hauKy.canh';
    // vật liệu vẫn mã hoá sRGB khi vẽ vào mục tiêu này (three r160 đọc cờ này để chọn outputColorSpace) — xem đầu file
    rt.isXRRenderTarget = true; rt.texture.colorSpace = THREE.SRGBColorSpace;
    return rt;
  }
  function buildRest(W, H, full) {
    rtA = new THREE.WebGLRenderTarget(W, H, HF); rtA.texture.name = 'hauKy.a';
    if (full) {
      const aw = Math.max(2, Math.round(W * params.aoScale)), ah = Math.max(2, Math.round(H * params.aoScale));
      gtao = new lib.GTAOPass(scene, camera, aw, ah);
      gtao.normalMaterial.side = THREE.DoubleSide; // mặt trong của tường / sàn / trần cũng phải chắn
      gtao.overrideVisibility = aoHide; gtao.restoreVisibility = aoShow;
      gtao.updateGtaoMaterial({ radius: params.aoRadius, distanceExponent: 1, thickness: 1, scale: 1, samples: params.aoSamples, screenSpaceRadius: false });
      gtao.output = lib.GTAOPass.OUTPUT.Default; gtao.renderToScreen = false;
    }
    bloom = new lib.UnrealBloomPass(new THREE.Vector2(W, H), 0.3, params.bloomRadius, params.bloomThr);
    bloom.materialHighPassFilter.fragmentShader = highPass; bloom.materialHighPassFilter.needsUpdate = true;
    bloom.setSize(full ? W : W >> 1, full ? H : H >> 1); // UnrealBloomPass tự lấy nửa kích thước: mức 2 = nửa, mức 1 = một phần tư
    grade = new lib.ShaderPass(gradeShader);
    grade.uniforms.uTexel.value.set(1 / W, 1 / H);
    grade.uniforms.tBloom.value = bloom.renderTargetsHorizontal[0].texture;
    P.passes = { gtao, bloom, grade, rtM, rtA }; // để chỉnh / soi lúc chạy (ví dụ P.passes.gtao.output = 4 xem riêng AO)
    P.stats.targets = W + 'x' + H + (full ? ' ao' + gtao.width + 'x' + gtao.height : '') + ' bloom' + (full ? '1/2' : '1/4');
  }
  function build() {
    dispose();
    if (!lib || P.level <= 0) return;
    const lv0 = P.level; let dropped = false;
    while (P.level > 0) {
      const { W, H } = sizes(); lastW = W; lastH = H;
      const full = P.level >= 2;
      const want = full ? (W * H > 2.5e6 ? 2 : 4) : 2; // trên 2,5 Mpx (màn lớn / DPR 2) chỉ 2 mẫu: nửa bộ nhớ half-float
      for (const samples of [want, 0]) { // MSAA mà GPU không nhận → thử lại không MSAA
        const rt = newSceneTarget(W, H, samples);
        if (fboOk(rt, true)) { rtM = rt; break; }
        dropped = true; try { rt.dispose(); } catch (e) {}
      }
      if (rtM) {
        try { buildRest(W, H, full); } catch (e) { dispose(); throw e; } // không để lại mục tiêu dựng dở
        P.stats.samples = rtM.samples;
        break;
      }
      P.level--; P.maxLevel = Math.min(P.maxLevel, P.level); // không nhận cả khi bỏ MSAA → hạ một mức
    }
    if (P.level < lv0) P.reason = 'GPU không nhận mục tiêu half-float' + (P.level ? ' — hạ xuống mức ' + P.level : ' — vẽ thẳng');
    if (dropped) warnFbo('GPU không nhận mục tiêu cảnh half-float MSAA — ' + (P.level === 0 ? 'tắt hậu kỳ, vẽ thẳng' : P.level < lv0 ? 'hạ xuống mức ' + P.level : 'bỏ MSAA'));
  }
  function resize() {
    if (!rtM) return;
    const { W, H } = sizes();
    if (W === lastW && H === lastH) return;
    const full = P.level >= 2;
    if (full && (W * H > 2.5e6) !== (lastW * lastH > 2.5e6)) { build(); return; }
    lastW = W; lastH = H;
    rtM.setSize(W, H); rtA.setSize(W, H);
    if (gtao) gtao.setSize(Math.max(2, Math.round(W * params.aoScale)), Math.max(2, Math.round(H * params.aoScale)));
    bloom.setSize(full ? W : W >> 1, full ? H : H >> 1);
    grade.uniforms.uTexel.value.set(1 / W, 1 / H);
    grade.uniforms.tBloom.value = bloom.renderTargetsHorizontal[0].texture;
    P.stats.targets = W + 'x' + H + (gtao ? ' ao' + gtao.width + 'x' + gtao.height : '') + ' bloom' + (full ? '1/2' : '1/4');
  }
  function setLevel(l, why) {
    l = clamp(Math.round(+l || 0), 0, P.maxLevel);
    if (l === P.level && (rtM || l === 0)) return;
    P.level = l; if (why) P.reason = why;
    build();
    if (P.level > 0 && rtM) prewarm(); // build có thể đã hạ mức / tắt
  }
  // cuối prewarm phát hiện mục tiêu không dùng được: hạ một mức, dựng lại (build tự kiểm), dựng trước lại
  function degrade(why) {
    if (P.level <= 0) return;
    P.level--; P.maxLevel = Math.min(P.maxLevel, P.level); P.reason = why + (P.level ? ' — hạ xuống mức ' + P.level : ' — vẽ thẳng');
    warnFbo(why + (P.level ? ' — hạ xuống mức ' + P.level : ' — tắt hậu kỳ, vẽ thẳng'));
    build();
    if (P.level > 0 && rtM) prewarm();
  }

  // bloom: các bước của UnrealBloomPass (lọc sáng → làm mờ 5 mức → gộp) nhưng KHÔNG cộng ngược vào ảnh nguồn: kết quả nằm ở renderTargetsHorizontal[0]
  function runBloom(srcTex, strength) {
    const b = bloom, q = b.fsQuad, n = b.nMips;
    const oa = renderer.autoClear, oal = renderer.getClearAlpha(); renderer.getClearColor(_cc);
    renderer.autoClear = false; renderer.setClearColor(_black, 0);
    b.highPassUniforms.tDiffuse.value = srcTex; b.highPassUniforms.luminosityThreshold.value = params.bloomThr; b.highPassUniforms.smoothWidth.value = params.bloomKnee;
    q.material = b.materialHighPassFilter; renderer.setRenderTarget(b.renderTargetBright); renderer.clear(); q.render(renderer);
    let inp = b.renderTargetBright;
    for (let i = 0; i < n; i++) {
      const m = b.separableBlurMaterials[i];
      q.material = m; m.uniforms.colorTexture.value = inp.texture; m.uniforms.direction.value = b.constructor.BlurDirectionX;
      renderer.setRenderTarget(b.renderTargetsHorizontal[i]); renderer.clear(); q.render(renderer);
      m.uniforms.colorTexture.value = b.renderTargetsHorizontal[i].texture; m.uniforms.direction.value = b.constructor.BlurDirectionY;
      renderer.setRenderTarget(b.renderTargetsVertical[i]); renderer.clear(); q.render(renderer);
      inp = b.renderTargetsVertical[i];
    }
    q.material = b.compositeMaterial;
    b.compositeMaterial.uniforms.bloomStrength.value = strength; b.compositeMaterial.uniforms.bloomRadius.value = params.bloomRadius;
    renderer.setRenderTarget(b.renderTargetsHorizontal[0]); renderer.clear(); q.render(renderer);
    renderer.setClearColor(_cc, oal); renderer.autoClear = oa;
  }

  // ---------- chạy chuỗi ----------
  function run(cam, toScreen) {
    renderer.setRenderTarget(rtM);
    renderer.render(scene, cam); // xoá + vẽ + gộp mẫu MSAA vào rtM.texture
    const mix = P.mix;
    let src = rtM;
    if (gtao) { gtao.camera = cam; gtao.blendIntensity = mix * params.ao; gtao.render(renderer, rtA, rtM); gtao.camera = camera; src = rtA; }
    const night = G.tod ? G.tod.night : 0;
    const bs = (params.bloomDay + (params.bloomNight - params.bloomDay) * night) * mix;
    const u = grade.uniforms;
    if (bs > 0.002) { runBloom(src.texture, bs); u.uBloomOn.value = 1; } else u.uBloomOn.value = 0;
    u.uMix.value = mix; u.uExposure.value = params.exposure; u.uAces.value = params.aces; u.uKnee.value = params.knee; u.uContrast.value = params.contrast;
    u.uCeil.value = params.ceil; u.uVig.value = params.vig; u.uVigStart.value = params.vigStart; u.uSharp.value = params.sharp; u.uDesat.value = params.desat;
    grade.renderToScreen = !!toScreen;
    grade.render(renderer, src === rtM ? rtA : rtM, src); // khi không ra màn hình (dựng trước) ghi vào mục tiêu còn lại
    renderer.setRenderTarget(null);
  }

  // dựng trước chương trình shader của GTAO / bloom / chỉnh màu (+ pháp tuyến cho vật đang thấy) để lần đầu vào điện không giật.
  // Chương trình của vật liệu cảnh chính là chương trình vẽ thẳng (cùng outputColorSpace) nên đã có sẵn từ G.start().
  // Cuối lượt: GL không được báo lỗi và mọi mục tiêu của chuỗi phải hoàn chỉnh (fboAll), không thì hạ mức.
  function prewarm() {
    const t0 = performance.now();
    const sm = renderer.shadowMap.needsUpdate, mix0 = P.mix;
    let ok = true;
    try {
      renderer.shadowMap.needsUpdate = false; // lượt vẽ thử không được "ăn" lần cập nhật bóng đang chờ
      glErr(); // bỏ cờ lỗi cũ, để cuối lượt chỉ còn lỗi do chính chuỗi gây ra
      const wc = new THREE.PerspectiveCamera(camera.fov, camera.aspect, camera.near, camera.far);
      wc.position.set(0, 7.6, -92); wc.lookAt(0, 8.5, -108); wc.updateMatrixWorld();
      P.mix = 1; run(wc, false);
      ok = fboAll();
    } catch (e) { console.warn('[hậu kỳ] dựng trước lỗi:', e && e.message); resetState(); ok = false; } // lỗi lúc dựng trước → coi như không đạt → degrade() hạ mức
    P.mix = mix0; renderer.setRenderTarget(null); renderer.shadowMap.needsUpdate = sm;
    P.stats.prewarmMs = +(performance.now() - t0).toFixed(1);
    if (!ok) degrade('GPU không vẽ được chuỗi hậu kỳ (framebuffer không hoàn chỉnh / GL báo lỗi)');
  }

  // ---------- quyết định mỗi khung (sau updateCamera 50) ----------
  G.onUpdate(() => {
    const p = camera.position, z = params;
    const on = P.enabled && P.ready && P.level > 0 && !!rtM && !lost;
    const inside = on && p.x > -z.zoneX && p.x < z.zoneX && p.y < z.zoneY && p.z > z.zoneZ0 && p.z < z.zoneZ1;
    P.mix = inside ? smooth(0, 1, (z.mixZ0 - p.z) / (z.mixZ0 - z.mixZ1)) : 0;
    P.active = inside && P.mix > 0.02; // mix ≈ 0 (đứng ở cửa): chuỗi cho đúng ảnh vẽ thẳng mà tốn gấp đôi lệnh vẽ → vẽ thẳng luôn
  }, 61);

  G.renderFrame = function (cam = camera) {
    if (!P.active || cam !== camera || busy) return plainRender(cam);
    busy = true;
    const t0 = performance.now();
    try {
      run(cam, true);
      const s = P.stats; s.frames++; s.ms += (performance.now() - t0 - s.ms) * 0.1;
    } catch (e) {
      // lỗi thật khi chạy (shader / thiếu bộ nhớ): tắt hậu kỳ, vẽ thẳng, ghi một dòng để biết
      resetState(); // trả lại vật bị ẩn cho AO, overrideMaterial, autoClear, màu xoá, mục tiêu vẽ
      console.error('[hậu kỳ]', e);
      G.errors.push('hậu kỳ: ' + (e && e.message));
      P.level = 0; P.reason = 'lỗi khi chạy'; dispose();
      plainRender(cam);
    } finally { busy = false; }
  };

  // ---------- sự kiện ----------
  G.events.on('resize', resize);
  G.events.on('quality:low', () => { if (P.level > 0) setLevel(0, 'máy yếu (quality:low)'); P.maxLevel = 0; });
  const cv = renderer.domElement;
  cv.addEventListener('webglcontextlost', () => { lost = true; lostN++; });
  // 00-core.js đã đăng ký trước nên chạy trước (resize xong); ở đây dựng lại mục tiêu + chương trình
  cv.addEventListener('webglcontextrestored', () => {
    lost = false;
    if (P.level > 0) { // mất ngữ cảnh thường do thiếu bộ nhớ GPU (điện thoại): lần đầu lùi về mức 1, lần sau vẽ thẳng — không lặp mất → dựng → mất
      const nl = lostN >= 2 ? 0 : Math.min(P.level, 1);
      if (nl < P.level) { P.level = nl; P.maxLevel = Math.min(P.maxLevel, nl); P.reason = 'mất ngữ cảnh WebGL — hạ xuống mức ' + nl; }
    }
    if (P.level > 0) {
      try { build(); if (P.level > 0 && rtM) prewarm(); }
      catch (e) { console.warn('[hậu kỳ] dựng lại sau khi mất ngữ cảnh lỗi:', e && e.message); resetState(); P.level = 0; dispose(); }
    }
  });

  // ---------- tải addon (không đồng bộ) ----------
  P.whenReady = (async () => {
    let noAo = false;
    try {
      // bloom + chỉnh màu bắt buộc; GTAOPass tuỳ chọn (thiếu → tối đa mức 1, không AO) nên một addon lỗi không kéo cả chuỗi chết theo
      const [g, b, s] = await Promise.allSettled([
        import('three/addons/postprocessing/GTAOPass.js'), import('three/addons/postprocessing/UnrealBloomPass.js'),
        import('three/addons/postprocessing/ShaderPass.js'),
      ]);
      if (b.status !== 'fulfilled') throw b.reason;
      if (s.status !== 'fulfilled') throw s.reason;
      lib = { GTAOPass: g.status === 'fulfilled' && g.value.GTAOPass || null, UnrealBloomPass: b.value.UnrealBloomPass, ShaderPass: s.value.ShaderPass };
      if (!lib.GTAOPass) {
        noAo = true;
        console.warn('[hậu kỳ] không tải được GTAOPass' + (g.status === 'rejected' ? ': ' + (g.reason && g.reason.message) : '') + ' — chỉ chạy tới mức 1 (bloom + chỉnh màu, không AO)');
      }
    } catch (e) {
      P.reason = 'không tải được addon: ' + (e && e.message);
      console.warn('[hậu kỳ] ' + P.reason + ' — vẽ thẳng như cũ');
      P.loaded = true;
      return P;
    }
    try {
      const ext = renderer.extensions;
      const half = renderer.capabilities.isWebGL2 && (ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float'));
      P.maxLevel = !half ? 0 : G.isTouch || noAo ? 1 : 2;
      if (G.quality.low) P.maxLevel = 0;
      const lq = +(G.save && G.save.data && G.save.data.lowQ) || 0, lqAge = Date.now() - lq;
      if (lqAge >= 0 && lqAge < 7 * 864e5 && P.maxLevel > 1) P.maxLevel = 1; // máy từng yếu trong 7 ngày gần đây: không mở mức nặng nhất ngay
      P.reason = P.maxLevel ? (noAo && !G.isTouch ? 'không tải được GTAOPass — không có AO (mức 1)' : '') : (!renderer.capabilities.isWebGL2 ? 'không có WebGL2' : !half ? 'không vẽ được vào mục tiêu half-float' : 'máy yếu');
      P.level = P.maxLevel;
      build();
      P.ready = true;
      if (P.level > 0 && rtM) prewarm();
    } catch (e) {
      console.error('[hậu kỳ]', e); G.errors.push('hậu kỳ: ' + (e && e.message));
      P.level = 0; P.maxLevel = 0; P.reason = 'lỗi dựng'; P.ready = true; dispose();
    }
    P.loaded = true;
    return P;
  })();
}
