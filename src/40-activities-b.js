// =====================================================================
//  HOẠT ĐỘNG B: viết lời cầu an (dải lụa đỏ trên cây bồ đề / hoa đăng trên hồ sen),
//  xin quẻ đầu năm, "Sổ cầu an của tôi" và ảnh chia sẻ
// =====================================================================
function installActivitiesB(G) {
  const { THREE, util: U } = G;
  const scene = G.scene, W = G.world;
  const V3 = THREE.Vector3;
  const PI = Math.PI, TAU = PI * 2;
  // Times New Roman đứng trước Georgia vì Georgia thiếu nhiều chữ Việt có dấu chồng (ầ, ế, ố…)
  const SERIF = '"Noto Serif", "Times New Roman", Georgia, serif';
  const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  const TREE = W.tree, POND = W.pond, FORT = W.fortune;
  const MAX_RIB = 12, MAX_LAN = 6, N_PIL_RIB = 45, N_PIL_LAN = 18, LMAX = MAX_LAN + N_PIL_LAN;
  const WY = POND.waterY + 0.02; // độ cao đèn nổi trên mặt nước
  const LS = 0.95; // cỡ đèn hoa đăng (đường kính khoảng 0,67 m cho dễ nhìn)
  const ui = () => G.audio?.play?.('ui');
  const pname = () => G.save.data.name || G.player.name || 'Phật tử';

  // vật tạm dùng lại mỗi khung (không cấp phát trong vòng lặp)
  const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _m4 = new THREE.Matrix4();
  const _p = new V3(), _s = new V3(), _col = new THREE.Color();

  // =====================================================================
  //  VĂN BẢN: chủ đề, gợi ý nhẹ nhàng và 40 lời chúc của quẻ đầu năm
  // =====================================================================
  const CATS = ['Gia đình', 'Sức khoẻ', 'Thi cử', 'Bình an', 'Công việc', 'Khác'];
  const SUGGEST = {
    'Gia đình': ['Mong cả nhà luôn bình an, sum vầy bên nhau.', 'Con biết ơn cha mẹ, mong gia đình mình luôn thương yêu nhau.', 'Nguyện cho mọi người trong nhà đều khoẻ mạnh và vui vẻ.'],
    'Sức khoẻ': ['Mong mình và người thân giữ được sức khoẻ, ngủ ngon mỗi đêm.', 'Nguyện cho những ai đang mệt mỏi được nghỉ ngơi và bình tâm.', 'Mong mình biết chăm sóc bản thân: ăn ngủ đúng giờ, đi bộ mỗi ngày.'],
    'Thi cử': ['Mong mình giữ được sự bình tĩnh và học tập chăm chỉ.', 'Nguyện cho các bạn sĩ tử có tinh thần vững vàng trước kỳ thi.', 'Mong mình ôn bài đều đặn và tin vào sự cố gắng của bản thân.'],
    'Bình an': ['Mong tâm mình được nhẹ nhàng, an yên giữa bộn bề.', 'Nguyện cho mọi người đều được bình an.', 'Mong mình biết đủ, biết ơn và sống chậm lại một chút.'],
    'Công việc': ['Mong công việc thuận hoà, đồng nghiệp hiểu và giúp đỡ nhau.', 'Nguyện giữ được sự kiên nhẫn và tử tế trong công việc.', 'Mong mình làm việc tận tâm và biết nghỉ ngơi đúng lúc.'],
    'Khác': ['Biết ơn một ngày bình yên. Mong mọi điều lành đến với mọi người.', 'Mong mình luôn biết sống tử tế và biết lắng nghe.', 'Cảm ơn những điều nhỏ bé đã đến trong cuộc sống của mình.'],
  };
  const NOTE_PRAYER = 'Lời cầu an là để gửi gắm tâm ý thiện lành — điều tốt đẹp đến từ chính tâm và việc làm của mỗi người.';
  const SHARE_TEXT = 'Mình vừa dạo một vòng Chùa An Lạc trong trò chơi "Lên Chùa Cầu An" — một góc thư giãn nhẹ nhàng.';

  // 40 quẻ: [tên quẻ, lời nhắn] — nhẹ nhàng, khích lệ, chỉ mang tính giải trí
  const FORTUNES = [
    ['Khởi Sắc', 'Một ngày mới đang mở ra. Hãy bắt đầu bằng một nụ cười và một việc nhỏ làm hết lòng; những bước nhỏ đều đặn thường đưa ta đi rất xa.'],
    ['An Lành', 'Lòng nhẹ thì việc cũng nhẹ. Hôm nay, hãy hít một hơi thật sâu và cho phép những điều chưa xong được chờ thêm một chút.'],
    ['Hanh Thông', 'Biết lắng nghe và nói lời dịu dàng giúp mở ra nhiều cánh cửa. Hãy kiên nhẫn trò chuyện với người bạn quý.'],
    ['Bình Yên', 'Ngủ đủ giấc, ăn đúng bữa và đi bộ nhẹ nhàng mỗi ngày là cách giản dị để chăm sóc cơ thể và giữ tâm bình yên.'],
    ['Sum Vầy', 'Một bữa cơm chung hay một cuộc gọi hỏi thăm cũng đủ làm ấm lòng cả nhà. Hãy dành thời gian cho người thân yêu.'],
    ['Thuận Hoà', 'Nhường nhau một lời, hiểu nhau một chút, mọi chuyện trong nhà ngoài ngõ sẽ êm ả hơn.'],
    ['Vững Vàng', 'Cây có gốc sâu thì gió lớn cũng đứng vững. Hãy chăm chút nền tảng: học đều, làm đều và biết nghỉ đúng lúc.'],
    ['Hoan Hỷ', 'Niềm vui thường nằm ở những điều rất nhỏ: một tách trà ấm, một buổi chiều nắng nhẹ. Hãy mỉm cười với chúng.'],
    ['Tinh Tấn', 'Mỗi trang sách đọc hôm nay là một viên gạch cho ngày mai. Cứ chăm chỉ từng chút một, không cần vội vàng.'],
    ['Biết Ơn', 'Hãy nhớ lại ba điều đã giúp bạn trong hôm nay và thầm gửi lời cảm ơn. Lòng biết ơn làm tâm hồn ấm áp hơn.'],
    ['Nhẫn Nại', 'Việc tốt cần thời gian để chín. Kiên nhẫn với chính mình cũng là một cách yêu thương.'],
    ['Thanh Thản', 'Đặt điện thoại xuống một lát, nhìn ra cửa sổ và thở thật chậm. Tâm trí cũng cần những khoảng lặng.'],
    ['Từ Tâm', 'Một hành động tử tế nhỏ, như nhường chỗ hay giúp ai đó xách đồ, có thể làm sáng cả một ngày của người khác.'],
    ['Tươi Sáng', 'Sau một ngày bận rộn, hãy tự nhắc mình: mình đã cố gắng rồi. Nghỉ ngơi cũng là một phần của việc tiến bước.'],
    ['Thong Dong', 'Không cần so bì với ai. Mỗi người có nhịp bước riêng, hãy bước theo nhịp của mình.'],
    ['Ấm Áp', 'Một lời hỏi han chân thành có thể là điều người ấy đang cần. Hôm nay, hãy nhắn cho một người bạn lâu ngày chưa gặp.'],
    ['Mở Lòng', 'Thử lắng nghe nhiều hơn một chút. Khi hiểu nhau, nhiều chuyện khó cũng trở nên nhẹ nhàng hơn.'],
    ['Kiên Định', 'Giữ một thói quen tốt đều đặn, dù chỉ mười phút mỗi ngày. Thói quen nhỏ là nền cho những đổi thay lớn.'],
    ['Viên Mãn', 'Biết đủ là một niềm vui. Hãy ngắm nhìn những gì mình đang có và để lòng ấm lên.'],
    ['Nhẹ Nhõm', 'Điều gì làm bạn lo lắng, hãy viết ra giấy rồi chia thành từng việc nhỏ. Làm từng việc một sẽ nhẹ nhàng hơn nhiều.'],
    ['Đoàn Viên', 'Dù ở gần hay xa, gia đình vẫn là nơi để trở về. Hãy gửi một lời nhắn yêu thương cho người nhà hôm nay.'],
    ['Sáng Suốt', 'Trước một việc quan trọng, hãy ngủ một giấc ngon rồi nghĩ lại. Đầu óc tỉnh táo giúp ta chọn điều hợp lý.'],
    ['Chân Thành', 'Sống thật và nói thật bằng lời ôn hoà. Sự chân thành luôn được trân trọng.'],
    ['Điềm Đạm', 'Khi thấy nóng nảy, hãy đếm chậm đến mười. Một khoảng dừng ngắn giúp lời nói thêm hiền hoà.'],
    ['Tươi Vui', 'Hôm nay thử học một điều mới thật nhỏ: một từ vựng, một món ăn, một bài hát. Sự tò mò giữ cho tâm hồn luôn trẻ.'],
    ['Hiền Hoà', 'Tập nói lời cảm ơn và xin lỗi sớm hơn một chút. Những lời giản dị ấy giữ cho tình cảm luôn mềm mại.'],
    ['Chuyên Cần', 'Việc học hay việc làm đều cần sự đều đặn. Mỗi ngày tiến thêm một chút, rồi bạn sẽ nhận ra mình đã đi được một quãng.'],
    ['Nhân Ái', 'Hãy tử tế với cả chính mình. Khi tự nhủ bằng lời dịu dàng, ta có thêm sức để giúp người khác.'],
    ['Thảnh Thơi', 'Một buổi đi dạo giữa cây xanh hay một vòng quanh hồ có thể làm đầu óc nhẹ đi nhiều.'],
    ['Tâm An', 'Bình an không đến từ việc mọi thứ hoàn hảo, mà từ việc ta chấp nhận và làm tốt phần việc của mình.'],
    ['Đồng Lòng', 'Việc nhà hay việc nhóm đều nhẹ hơn khi mọi người cùng chia sẻ. Hãy chủ động giúp một tay.'],
    ['Sáng Tỏ', 'Khi thấy rối bời, hãy dọn gọn một góc bàn hay một ngăn tủ. Không gian gọn gàng giúp tâm trí rõ ràng hơn.'],
    ['Hoà Ái', 'Một nụ cười dành cho người lạ cũng là món quà nhỏ. Hôm nay, hãy mỉm cười nhiều hơn một chút.'],
    ['An Nhiên', 'Không phải điều gì cũng cần trả lời ngay. Cho mình một khoảng thời gian để nghĩ, lòng sẽ nhẹ hơn.'],
    ['Hướng Thiện', 'Mỗi ngày làm một việc tốt nhỏ, mỗi tối nhớ lại một điều đáng biết ơn. Thói quen ấy nuôi dưỡng tâm lành.'],
    ['Tươi Mới', 'Mở cửa sổ cho gió vào, uống một ly nước, duỗi người nhẹ nhàng. Một khởi đầu nhỏ cho một ngày dễ chịu.'],
    ['Chu Đáo', 'Hãy để ý những điều nhỏ với người thân: một chiếc áo ấm, một lời nhắc ăn uống đúng giờ.'],
    ['Sẻ Chia', 'Chia sẻ niềm vui thì niềm vui nhân đôi, chia sẻ nỗi lo thì nỗi lo nhẹ bớt. Hãy tìm một người để trò chuyện.'],
    ['Vui Học', 'Học không chỉ để thi mà còn để hiểu biết thêm và bình tĩnh hơn. Hãy ôn từng phần nhỏ và dành cho mình những quãng nghỉ.'],
    ['Bền Lòng', 'Con đường nào cũng có đoạn dốc. Cứ đi chậm mà đều, mệt thì nghỉ, và nhớ rằng bạn không đơn độc.'],
  ];

  // =====================================================================
  //  TIỆN ÍCH: ngắt dòng chữ, vẽ khung bo góc, trích đoạn, sắp xếp theo ngày
  // =====================================================================
  // ngắt dòng theo từ (từ quá dài thì cắt theo ký tự); cần đặt ctx.font trước
  function wrapLines(ctx, text, maxW) {
    const out = []; let cur = '';
    const words = String(text).replace(/\s+/g, ' ').trim().split(' ');
    for (let w of words) {
      if (!w) continue;
      while (ctx.measureText(w).width > maxW && w.length > 1) {
        let n = w.length - 1;
        while (n > 1 && ctx.measureText(w.slice(0, n)).width > maxW) n--;
        const cc = w.charCodeAt(n - 1); if (cc >= 0xd800 && cc <= 0xdbff && n > 1) n--;
        if (cur) { out.push(cur); cur = ''; }
        out.push(w.slice(0, n)); w = w.slice(n);
      }
      const t = cur ? cur + ' ' + w : w;
      if (cur && ctx.measureText(t).width > maxW) { out.push(cur); cur = w; } else cur = t;
    }
    if (cur) out.push(cur);
    return out;
  }
  // chọn cỡ chữ lớn nhất mà đoạn văn còn vừa khung; quá dài thì cắt và thêm "…"
  function fitText(ctx, text, maxW, maxH, sizes, weight, family, lk) {
    let lines = [], size = sizes[sizes.length - 1];
    for (let i = 0; i < sizes.length; i++) {
      size = sizes[i]; ctx.font = weight + ' ' + size + 'px ' + family;
      lines = wrapLines(ctx, text, maxW);
      if (lines.length * size * lk <= maxH) return { lines, size };
    }
    const maxLines = Math.max(1, Math.floor(maxH / (size * lk)));
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      let last = lines[maxLines - 1];
      while (last.length > 1 && ctx.measureText(last + '…').width > maxW) last = last.slice(0, -1);
      lines[maxLines - 1] = last.replace(/[\s,.;:!?-]+$/, '') + '…';
    }
    return { lines, size };
  }
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function excerpt(s, n) {
    s = String(s).replace(/\s+/g, ' ').trim();
    if (s.length <= n) return s;
    let c = s.slice(0, n); const sp = c.lastIndexOf(' ');
    if (sp > n * 0.5) c = c.slice(0, sp);
    return c.replace(/[\s,.;:!?-]+$/, '') + '…';
  }
  const fmtDate = (iso) => (Number.isFinite(Date.parse(iso)) ? U.dateVN(iso) : '');
  // mới nhất lên đầu (giữ thứ tự cũ nếu thiếu ngày)
  function newestFirst(arr) {
    return arr.map((x, i) => ({ x, i, t: Date.parse(x && x.at) })).sort((a, b) => (Number.isFinite(b.t) ? b.t : 0) - (Number.isFinite(a.t) ? a.t : 0) || a.i - b.i).map((o) => o.x);
  }
  // hoa sen vẽ bằng đường cong, tâm ở đáy hoa (cx, cy), cao khoảng s
  function drawLotus(ctx, cx, cy, s) {
    const petal = (ang, len, wid) => {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-wid, -len * 0.35, -wid * 0.7, -len * 0.85, 0, -len);
      ctx.bezierCurveTo(wid * 0.7, -len * 0.85, wid, -len * 0.35, 0, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    };
    petal(-1.2, s * 0.6, s * 0.2); petal(1.2, s * 0.6, s * 0.2);
    petal(-0.62, s * 0.82, s * 0.23); petal(0.62, s * 0.82, s * 0.23);
    petal(0, s, s * 0.25);
  }

  // =====================================================================
  //  GIAO DIỆN: kiểu dáng cho bảng viết lời cầu an, xin quẻ, sổ và chia sẻ
  // =====================================================================
  G.ui.addStyle(`
/* Viết lời cầu an */
.cb-sec{margin:0 0 14px}
.cb-lbl{font-size:13px;color:var(--muted);margin:0 0 6px 2px}
.cb-chip{min-height:44px;padding:8px 14px}
.cb-wrap{position:relative}
textarea.field.cb-ta{min-height:108px;padding-bottom:28px}
.cb-count{position:absolute;right:12px;bottom:8px;font-size:12px;color:var(--muted);pointer-events:none}
.cb-hint{min-height:20px;margin-top:6px;font-size:13px;line-height:1.4;color:#ffc9b8}
.cb-sug{display:flex;flex-direction:column;gap:8px}
.cb-sug button{min-height:44px;text-align:left;font-size:14px;line-height:1.35;padding:10px 12px;border-radius:12px;border:1px dashed var(--line);background:rgba(255,255,255,.04);color:var(--cream)}
.cb-sug button:active{background:rgba(232,184,92,.16)}
.cb-dest{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cb-opt{min-height:68px;border-radius:14px;border:1px solid var(--line);background:rgba(255,255,255,.05);padding:10px 8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:13.5px;font-weight:600;line-height:1.25;text-align:center;color:var(--cream)}
.cb-opt .cb-ic svg{width:26px;height:26px;fill:none;stroke:var(--gold2);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.cb-opt.on{background:rgba(232,184,92,.2);border-color:var(--gold);box-shadow:0 0 0 2px rgba(232,184,92,.35) inset}
.cb-note{margin:2px 2px 0;line-height:1.5}
.bk-toast-btn{margin-top:8px;min-height:44px;padding:8px 20px}

/* Xin quẻ đầu năm */
#overlay > .fq-ov{position:fixed;inset:0;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;pointer-events:none;padding:0 12px calc(12px + var(--sb))}
.fq-ov > *{pointer-events:auto}
.fq-x{position:absolute;top:calc(10px + var(--st));right:calc(10px + var(--sr));width:46px;height:46px;border-radius:50%;border:1px solid var(--line);background:var(--panel);color:var(--gold2);font-size:26px;line-height:1;box-shadow:var(--shadow)}
.fq-box{width:min(100%,460px);max-height:88vh;max-height:88dvh;overflow:auto;background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:12px 14px 14px;text-align:center;box-shadow:var(--shadow);animation:fqIn .3s ease-out}
@keyframes fqIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
.fq-help{font-size:15px;line-height:1.4;font-weight:600;color:var(--cream)}
.fq-sub{font-size:12.5px;color:var(--muted);margin-top:2px}
.fq-stage{height:min(25vh,190px);margin:6px auto 6px;display:grid;place-items:center;touch-action:none;cursor:pointer;-webkit-touch-callout:none}
.fq-stage svg{display:block;height:min(25vh,190px);width:auto;max-width:100%;overflow:visible;transform-origin:50% 90%}
.fq-stage svg.rattle{animation:fqRattle .11s linear infinite alternate}
@keyframes fqRattle{from{transform:rotate(-5deg) translateX(-3px)}to{transform:rotate(5deg) translateX(3px)}}
.fq-pick{transition:transform .75s cubic-bezier(.2,1.25,.35,1);transform-origin:100px 230px}
.fq-pick.out{transform:translateY(-96px) rotate(-6deg)}
.fq-prog{height:6px;border-radius:3px;background:rgba(255,255,255,.12);overflow:hidden}
.fq-prog i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--gold),#fff0c8)}
.fq-motion{margin-top:10px;min-height:44px;font-size:14px}
.fq-hold{margin-top:10px;min-height:64px;border-radius:32px;border:2px solid #fff3cf;background:linear-gradient(180deg,#f6cf7c,#e0a344);color:var(--ink);font-size:18px;font-weight:800;display:flex;align-items:center;justify-content:center;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;cursor:pointer}
.fq-hold.on{background:linear-gradient(180deg,#ffe29a,#f0b24d);transform:scale(.985)}
.fq-card{display:none;padding:4px 2px 0}
.fq-box.res .fq-live{display:none}
.fq-box.pop .fq-hold,.fq-box.pop .fq-prog,.fq-box.pop .fq-motion{display:none}
.fq-box.res .fq-card{display:block;animation:fqFlip .75s cubic-bezier(.2,.9,.3,1) both}
@keyframes fqFlip{from{transform:perspective(800px) rotateY(90deg);opacity:0}to{transform:perspective(800px) rotateY(0);opacity:1}}
.fq-no{font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:var(--gold)}
.fq-title{font-family:var(--serif);font-size:30px;font-weight:700;color:var(--gold2);margin:2px 0 8px}
.fq-text{margin:0 0 8px;font-size:16px;line-height:1.55;color:var(--cream)}
.fq-fun{font-size:13.5px;font-style:italic;color:var(--muted);margin-bottom:12px}
.fq-btns{display:flex;flex-direction:column;gap:8px}
.fq-btns .row{gap:8px}.fq-btns .row .btn{flex:1}
@media (prefers-reduced-motion:reduce){.fq-box.res .fq-card,.fq-box,.fq-pick{animation:none;transition:none}.fq-stage svg.rattle{animation:none}}

/* Sổ cầu an của tôi */
.bk-name{display:flex;align-items:center;justify-content:space-between;gap:10px}
.bk-who b{display:block;font-family:var(--serif);font-size:21px;color:var(--gold2);overflow-wrap:anywhere}
.bk-small{min-height:44px;padding:8px 16px;font-size:14px}
.bk-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:12px}
.bk-stat{background:rgba(255,255,255,.05);border:1px solid var(--line);border-radius:14px;padding:10px 12px}
.bk-stat b{display:block;font-family:var(--serif);font-size:24px;line-height:1.2;color:var(--gold2)}
.bk-stat span{font-size:13px;color:var(--muted)}
.bk-h{font-family:var(--serif);font-size:17px;font-weight:700;color:var(--gold2);margin:18px 0 8px}
.bk-empty{font-size:14px;line-height:1.5;color:var(--muted);background:rgba(255,255,255,.04);border:1px dashed var(--line);border-radius:14px;padding:12px}
.bk-item{padding:10px 12px}
.bk-meta{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;font-size:12.5px;color:var(--muted)}
.bk-tag{border:1px solid var(--line);border-radius:10px;padding:0 8px;line-height:20px;color:var(--gold2)}
.bk-text{margin-top:6px;font-size:15px;line-height:1.5;overflow-wrap:anywhere}
.bk-fun{margin-top:4px;font-size:12px;font-style:italic;color:var(--muted)}
.bk-del{margin-top:18px}
.bk-del .small{line-height:1.5;margin:0 0 10px}
.bk-danger{width:100%;color:#ffc9b8}
.bk-foot{margin-top:14px;text-align:center}

/* Ảnh chia sẻ */
.sh-img{-webkit-touch-callout:default;-webkit-user-select:auto;user-select:auto;display:block;margin:0 auto;max-width:100%;max-height:55vh;max-height:55dvh;border-radius:12px;border:1px solid var(--line);box-shadow:var(--shadow)}
.sh-wait{display:grid;place-items:center;min-height:160px;color:var(--muted);font-size:14px}
.sh-msg{margin-top:10px;font-size:13.5px;line-height:1.5;text-align:center;color:var(--muted)}
`);

  // =====================================================================
  //  NỀN HOẠT ĐỘNG: bắt đầu / kết thúc an toàn trên mọi lối thoát, Esc để dừng
  // =====================================================================
  const run = { active: false, id: 0, cleanups: [] };
  function beginRun(name, cam) {
    if (run.active || G.activity.current) return false;
    if (!G.activity.begin(name, { cam })) return false;
    run.active = true; run.id++; run.cleanups.length = 0;
    return true;
  }
  const onCleanup = (fn) => { run.cleanups.push(fn); };
  function endRun() {
    if (!run.active) return;
    run.active = false;
    const list = run.cleanups.splice(0).reverse();
    for (const f of list) { try { f(); } catch (e) { console.error(e); } }
    G.activity.end();
  }
  function abortRun() { if (!run.active) return; try { G.player.stopWalk(); } catch (e) {} endRun(); }
  G.events.on('escape', abortRun);
  // đi tới chỗ đứng và quay mặt đúng hướng; false nếu hoạt động đã bị huỷ
  async function goStand(st, alive) {
    const P = G.player;
    await P.walkTo(st.x, st.z);
    if (!alive()) return false;
    if (Math.hypot(P.pos.x - st.x, P.pos.z - st.z) > 0.9) P.placeAt(st.x, st.z, P.yaw);
    await P.faceTo(st.yaw, 0.4);
    return alive();
  }

  // =====================================================================
  //  DẢI LỤA ĐỎ: hình lụa cong, hoa văn vẽ canvas, dải của người chơi và của khách
  // =====================================================================
  const RW = 0.17, RH = 0.75;
  // lưới lụa: segs = [[v0, v1, dải vàng 0|1, số đoạn]], gốc ở đỉnh, cong nhẹ như lụa rủ
  function buildRibbonGeo(segs, pilgrim) {
    const pos = [], uv = [], band = [], idx = [];
    let base = 0;
    for (const sg of segs) {
      const v0 = sg[0], v1 = sg[1], n = sg[3];
      for (let r = 0; r <= n; r++) {
        const v = v0 + (v1 - v0) * (r / n);
        const z = Math.sin(v * PI * 0.92) * 0.028 + v * v * 0.012;
        for (let c = 0; c < 3; c++) {
          const u = c / 2, cup = (1 - Math.pow(2 * u - 1, 2)) * 0.014;
          pos.push((u - 0.5) * RW, -v * RH, z + cup); uv.push(u, 1 - v); band.push(sg[2]);
        }
      }
      for (let r = 0; r < n; r++) for (let c = 0; c < 2; c++) {
        const a = base + r * 3 + c; idx.push(a, a + 3, a + 1, a + 1, a + 3, a + 4);
      }
      base += (n + 1) * 3;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    if (pilgrim) {
      g.setAttribute('band', new THREE.Float32BufferAttribute(band, 1));
      g.setAttribute('color', new THREE.Float32BufferAttribute(new Array(pos.length).fill(1), 3));
    }
    g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere();
    return g;
  }
  // hình dùng chung cho mọi dải lụa (không giải phóng vì luôn còn dùng)
  const ribGeo = buildRibbonGeo([[0, 1, 0, 9]], false);
  const pilGeo = buildRibbonGeo([[0, 0.05, 1, 1], [0.05, 0.84, 0, 6], [0.84, 0.89, 1, 1], [0.89, 1, 0, 2]], true);

  function drawRibbonTex(c, w, h, text, name) {
    const g = c.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#a3231d'); g.addColorStop(0.5, '#d23c33'); g.addColorStop(1, '#a3231d');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.globalAlpha = 0.08; c.fillStyle = '#3a0805';
    for (let x = 2; x < w; x += 5) c.fillRect(x, 0, 1.4, h);
    c.globalAlpha = 1;
    c.fillStyle = '#7a1712'; c.fillRect(0, 0, w, 30);
    c.fillStyle = '#e6b64f'; c.fillRect(0, 30, w, 3);
    c.strokeStyle = '#e8b85c'; c.lineWidth = 4; c.strokeRect(5, 5, w - 10, h - 10);
    c.strokeStyle = 'rgba(247,215,147,0.65)'; c.lineWidth = 1.2; c.strokeRect(12, 40, w - 24, h - 52);
    c.fillStyle = '#f2cc73';
    c.beginPath(); c.moveTo(w / 2, 45); c.lineTo(w / 2 + 6, 52); c.lineTo(w / 2, 59); c.lineTo(w / 2 - 6, 52); c.closePath(); c.fill();
    const y0 = 66, y1 = h - 60, maxW = w - 38;
    const fit = fitText(c, text, maxW, y1 - y0, [20, 18, 17, 16, 15, 14, 13, 12, 11], '600', SERIF, 1.28);
    const lh = fit.size * 1.28, top = y0 + ((y1 - y0) - lh * fit.lines.length) / 2 + lh / 2;
    c.font = '600 ' + fit.size + 'px ' + SERIF; c.fillStyle = '#fff1cf'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = 'rgba(60,8,4,0.55)'; c.shadowBlur = 2; c.shadowOffsetY = 1;
    for (let i = 0; i < fit.lines.length; i++) c.fillText(fit.lines[i], w / 2, top + i * lh);
    c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetY = 0;
    c.strokeStyle = 'rgba(247,215,147,0.7)'; c.lineWidth = 1; c.beginPath(); c.moveTo(w / 2 - 22, h - 46); c.lineTo(w / 2 + 22, h - 46); c.stroke();
    let nsz = 14; c.font = '700 ' + nsz + 'px ' + SANS;
    while (nsz > 9 && c.measureText(name).width > maxW) { nsz--; c.font = '700 ' + nsz + 'px ' + SANS; }
    c.fillStyle = '#f7d793'; c.fillText(name, w / 2, h - 28, maxW);
  }

  // ---------- Neo treo trên cây: giữ chỗ gần chỗ đứng cho người chơi ----------
  const A = TREE.anchors;
  const aUse = new Uint8Array(A.length); // 0 trống, 1 dải của khách, 2 dải của người chơi
  const aReserved = new Uint8Array(A.length);
  let minAY = 1e9; for (const a of A) if (a.y < minAY) minAY = a.y;
  const aOrder = A.map((a, i) => i).sort((i, j) => aScore(A[i]) - aScore(A[j]));
  function aScore(a) { return Math.hypot(a.x - TREE.stand.x, a.z - TREE.stand.z) + (a.y - minAY) * 0.6; }
  for (let i = 0; i < Math.min(14, aOrder.length); i++) aReserved[aOrder[i]] = 1;
  function pickAnchor() {
    for (let i = 0; i < aOrder.length; i++) if (!aUse[aOrder[i]]) return aOrder[i];
    return aOrder[0];
  }

  // ---------- 45 dải lụa của khách: một InstancedMesh, dải vàng bằng thuộc tính đỉnh ----------
  const goldLin = new THREE.Color(0xe6b64f);
  const pilMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  pilMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float band;')
      .replace('#include <color_vertex>', '#include <color_vertex>\n#if defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )\n vColor.rgb = mix( vColor.rgb, vec3( ' + goldLin.r.toFixed(4) + ', ' + goldLin.g.toFixed(4) + ', ' + goldLin.b.toFixed(4) + ' ), band );\n#endif');
  };
  pilMat.customProgramCacheKey = () => 'cauan-pilgrim-ribbon';
  const pilMesh = new THREE.InstancedMesh(pilGeo, pilMat, N_PIL_RIB);
  pilMesh.frustumCulled = false; pilMesh.castShadow = false; pilMesh.receiveShadow = false;
  const pil = [];
  {
    const cand = []; for (let i = 0; i < A.length; i++) if (!aReserved[i]) cand.push(i);
    U.shuffle(cand);
    const cRed = new THREE.Color(0xc8302a), cDeep = new THREE.Color(0x9a1f1a), cYel = new THREE.Color(0xe9bd42);
    const n = Math.min(N_PIL_RIB, cand.length);
    for (let k = 0; k < n; k++) {
      const ai = cand[k], a = A[ai]; aUse[ai] = 1;
      pil.push({ pos: new V3(a.x, a.y, a.z), yaw: Math.atan2(TREE.stand.x - a.x, TREE.stand.z - a.z) + U.rand(-0.9, 0.9), ph: Math.random() * TAU, sp: U.rand(0.7, 1.2), amp: U.rand(0.7, 1.3), sc: U.rand(0.88, 1.12) });
      const r = Math.random(); pilMesh.setColorAt(k, r < 0.62 ? cRed : r < 0.87 ? cDeep : cYel);
    }
    pilMesh.count = n;
    if (pilMesh.instanceColor) pilMesh.instanceColor.needsUpdate = true;
    scene.add(pilMesh);
  }

  // ---------- Dải lụa của người chơi (tối đa 12) ----------
  const ribbons = []; // cũ nhất ở đầu
  function createRibbon(text) {
    while (ribbons.length >= MAX_RIB) removeRibbon(ribbons[0]);
    const nm = pname();
    const tex = U.canvasTex(128, 512, (c, w, h) => drawRibbonTex(c, w, h, text, nm));
    const mat = new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide, emissive: 0x4a3c34, emissiveMap: tex });
    const mesh = new THREE.Mesh(ribGeo, mat); mesh.rotation.order = 'YXZ'; mesh.castShadow = false;
    const ai = pickAnchor(); aUse[ai] = 2; const a = A[ai];
    const r = { mesh, mat, tex, anchor: ai, ax: a.x, ay: a.y, az: a.z, yaw: Math.atan2(TREE.stand.x - a.x, TREE.stand.z - a.z), ph: Math.random() * TAU, amp: 0.85 + Math.random() * 0.4, ready: false, dead: false, committed: false, text };
    ribbons.push(r);
    return r;
  }
  function removeRibbon(r) {
    const i = ribbons.indexOf(r); if (i < 0) return;
    ribbons.splice(i, 1); r.dead = true;
    if (r.mesh.parent) r.mesh.parent.remove(r.mesh);
    r.mat.dispose(); r.tex.dispose();
    aUse[r.anchor] = 0;
  }
  function placeRibbon(r) { r.mesh.position.set(r.ax, r.ay, r.az); r.mesh.rotation.set(0, r.yaw, 0); scene.add(r.mesh); r.ready = true; }
  function holdRibbon(text) {
    const r = createRibbon(text);
    G.player.handsMid.add(r.mesh); r.mesh.position.set(0, 0.02, 0.06); r.mesh.rotation.set(0.08, PI, 0);
    return r;
  }
  // lụa bay theo một vòng cung từ tay lên cành, rồi treo và đung đưa
  function flyRibbon(r) {
    const mesh = r.mesh;
    scene.attach(mesh);
    const x0 = mesh.position.x, y0 = mesh.position.y, z0 = mesh.position.z, yaw0 = G.player.yaw, dyaw = U.angleDiff(yaw0, r.yaw);
    mesh.scale.setScalar(1);
    return G.tween(1.5, (k, raw) => {
      if (r.dead) return;
      mesh.position.set(U.lerp(x0, r.ax, k), U.lerp(y0, r.ay, k) + Math.sin(PI * k) * 0.9, U.lerp(z0, r.az, k));
      const f = 1 - k;
      mesh.rotation.set(Math.sin(raw * 15) * 0.4 * f, yaw0 + dyaw * k, Math.sin(raw * 11) * 0.5 * f);
    }, G.ease.inOut).then(() => { if (!r.dead) { mesh.position.set(r.ax, r.ay, r.az); r.committed = true; r.ready = true; } });
  }
  // đổi tên ở Sổ thì vẽ lại tên nhỏ ở cuối mỗi dải
  function redrawRibbonNames() {
    const nm = pname();
    for (const r of ribbons) {
      const cv = r.tex.image; if (!cv || !cv.getContext) continue;
      const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height);
      drawRibbonTex(c, cv.width, cv.height, r.text, nm); r.tex.needsUpdate = true;
    }
  }

  // =====================================================================
  //  ĐÈN HOA ĐĂNG: đèn sen low-poly dùng chung một lô hình, trôi nhẹ trên hồ
  // =====================================================================
  const lanBody = (() => {
    const parts = [], SPH = new THREE.SphereGeometry(1, 6, 4);
    const add = (geo, color, o) => parts.push(U.piece(geo, color, o));
    add(new THREE.CylinderGeometry(0.2, 0.23, 0.05, 10), 0xd9b46a, { p: [0, 0.025, 0], j: 0.04 });
    add(new THREE.TorusGeometry(0.215, 0.012, 4, 14), 0xb9892f, { p: [0, 0.05, 0], r: [PI / 2, 0, 0], j: 0.03 });
    for (let k = 0; k < 8; k++) { // vòng cánh sen ngoài (hồng)
      const a = (k / 8) * TAU, tilt = 1.0, half = 0.15, R = 0.1 + Math.sin(tilt) * half, y = 0.05 + Math.cos(tilt) * half;
      add(SPH, k % 2 ? 0xf7b3c6 : 0xf29bb5, { p: [Math.sin(a) * R, y, Math.cos(a) * R], r: [tilt, a, 0], s: [0.075, half, 0.026], order: 'YXZ', j: 0.05 });
    }
    for (let k = 0; k < 8; k++) { // vòng cánh sen trong (trắng hồng)
      const a = ((k + 0.5) / 8) * TAU, tilt = 0.55, half = 0.14, R = 0.05 + Math.sin(tilt) * half, y = 0.075 + Math.cos(tilt) * half;
      add(SPH, k % 2 ? 0xfff0f4 : 0xfde0e8, { p: [Math.sin(a) * R, y, Math.cos(a) * R], r: [tilt, a, 0], s: [0.065, half, 0.024], order: 'YXZ', j: 0.04 });
    }
    add(new THREE.CylinderGeometry(0.055, 0.065, 0.07, 8), 0xe0b04e, { p: [0, 0.1, 0] }); // đài sen
    add(new THREE.CylinderGeometry(0.022, 0.022, 0.14, 7), 0xfff1d4, { p: [0, 0.2, 0], j: 0.02 }); // nến
    SPH.dispose();
    return U.merge(parts);
  })();
  const lanFlame = U.merge([
    U.piece(new THREE.ConeGeometry(0.03, 0.1, 6), 0xffa93a, { p: [0, 0.05, 0], j: 0 }),
    U.piece(new THREE.SphereGeometry(0.02, 6, 4), 0xfff3b8, { p: [0, 0.03, 0], s: [1, 1.5, 1], j: 0 }),
  ]);
  const lanMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, emissive: 0x7a3a4a, emissiveIntensity: 0.25 });
  const flameMat = G.mats.lantern || new THREE.MeshBasicMaterial({ vertexColors: true });
  const bodyIM = new THREE.InstancedMesh(lanBody, lanMat, LMAX), flameIM = new THREE.InstancedMesh(lanFlame, flameMat, LMAX);
  for (const im of [bodyIM, flameIM]) { im.count = 0; im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false; scene.add(im); }
  const tints = [new THREE.Color(0xffffff), new THREE.Color(0xfff0e6), new THREE.Color(0xffe6ee)];
  bodyIM.setColorAt(0, tints[0]);
  const lanGlow = G.fx.glowPoints(LMAX, { flicker: 1, intensity: 1 });
  const tagGeo = new THREE.PlaneGeometry(0.36, 0.24);
  const lanterns = []; // chỉ số = ô trong InstancedMesh
  let lanSeq = 0;

  function drawTagTex(c, w, h, text) {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#fff6df'); g.addColorStop(1, '#f1ddb0');
    rrect(c, 3, 3, w - 6, h - 6, 12); c.fillStyle = g; c.fill();
    c.lineWidth = 3; c.strokeStyle = '#c9a24a'; c.stroke();
    c.lineWidth = 1; c.strokeStyle = 'rgba(184,50,42,0.55)'; rrect(c, 10, 10, w - 20, h - 20, 8); c.stroke();
    c.fillStyle = '#b8322a'; c.font = '700 14px ' + SANS; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Cầu an', w / 2, 24);
    const fit = fitText(c, excerpt(text, 34), w - 40, h - 62, [22, 20, 18, 16, 14], '700', SERIF, 1.25);
    const lh = fit.size * 1.25, top = 36 + ((h - 50 - 36) - lh * fit.lines.length) / 2 + lh / 2;
    c.font = '700 ' + fit.size + 'px ' + SERIF; c.fillStyle = '#4a2410';
    for (let i = 0; i < fit.lines.length; i++) c.fillText(fit.lines[i], w / 2, top + i * lh);
  }
  function disposeTag(L) {
    if (!L.tag) return;
    scene.remove(L.tag.mesh); L.tag.mat.dispose(); L.tag.tex.dispose(); L.tag = null;
  }
  // chọn một điểm trên mặt hồ (cách mép và cách các đèn khác)
  function pondPoint(margin, minGap) {
    for (let t = 0; t < 40; t++) {
      const a = Math.random() * TAU, r = Math.sqrt(0.05 + Math.random() * 0.95);
      const x = POND.x + Math.cos(a) * (POND.rx - margin) * r, z = POND.z + Math.sin(a) * (POND.rz - margin) * r;
      if (!POND.inside(x, z, margin)) continue;
      if (Math.hypot(x - POND.release.x, z - POND.release.z) < 1.6) continue;
      let ok = true; for (const o of lanterns) if (Math.hypot(o.x - x, o.z - z) < minGap) { ok = false; break; }
      if (ok) return { x, z };
    }
    return { x: POND.x + U.rand(-1.5, 1.5), z: POND.z + U.rand(-1, 1) };
  }
  function addLantern(o) {
    if (lanterns.length >= LMAX) return null;
    const L = {
      own: !!o.own, mode: o.mode || 'drift', x: o.x, y: WY, z: o.z, yaw: Math.random() * TAU, vx: 0, vz: 0,
      heading: Math.random() * TAU, speed: U.rand(0.05, 0.11), ph: Math.random() * 100, tint: (Math.random() * 3) | 0,
      age: o.age ?? 10, tagK: 0, tag: null, seq: ++lanSeq, dead: false, committed: false,
    };
    const i = lanterns.length; lanterns.push(L);
    bodyIM.count = flameIM.count = lanterns.length;
    bodyIM.setColorAt(i, tints[L.tint]); bodyIM.instanceColor.needsUpdate = true;
    if (o.text) {
      const tex = U.canvasTex(192, 128, (c, w, h) => drawTagTex(c, w, h, o.text));
      const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(tagGeo, mat); mesh.rotation.order = 'YXZ'; mesh.visible = false; mesh.renderOrder = 2;
      scene.add(mesh); L.tag = { mesh, mat, tex };
    }
    return L;
  }
  function removeLantern(L) {
    const i = lanterns.indexOf(L); if (i < 0) return;
    L.dead = true; disposeTag(L);
    const last = lanterns.length - 1;
    if (i !== last) { lanterns[i] = lanterns[last]; bodyIM.setColorAt(i, tints[lanterns[i].tint]); }
    lanterns.pop(); lanGlow.hide(last);
    bodyIM.count = flameIM.count = lanterns.length;
    bodyIM.instanceColor.needsUpdate = true;
  }
  function createOwnLantern(text, o) {
    for (;;) { // tối đa 6 đèn của người chơi: bỏ đèn cũ nhất
      let n = 0, oldest = null;
      for (const L of lanterns) if (L.own) { n++; if (!oldest || L.seq < oldest.seq) oldest = L; }
      if (n < MAX_LAN) break;
      removeLantern(oldest);
    }
    return addLantern({ own: true, text, ...o });
  }
  function holdLantern(text) { const hw = G.player.handsWorld; return createOwnLantern(text, { mode: 'held', x: hw.x, z: hw.z, age: 0 }); }
  // đèn rơi nhẹ từ tay xuống mặt nước rồi bắt đầu trôi
  function flyLantern(L) {
    const x0 = L.x, y0 = L.y, z0 = L.z, x1 = POND.release.x, z1 = POND.release.z;
    L.mode = 'fly';
    return G.tween(1.4, (k) => {
      if (L.dead) return;
      L.x = U.lerp(x0, x1, k); L.z = U.lerp(z0, z1, k);
      L.y = U.lerp(y0, WY, k * k * (3 - 2 * k)) + Math.sin(PI * k) * 0.22;
    }, G.ease.sine).then(() => {
      if (L.dead) return;
      L.mode = 'drift'; L.x = x1; L.z = z1; L.y = WY; L.vx = 0; L.vz = 0; L.committed = true;
      L.heading = U.yawTo(x1, z1, POND.x, POND.z) + U.rand(-0.6, 0.6);
      G.audio?.play?.('water'); ripple(x1, z1);
    });
  }

  // ---------- Gợn nước khi đèn chạm mặt hồ ----------
  const ripGeo = new THREE.RingGeometry(0.2, 0.26, 28); ripGeo.rotateX(-PI / 2);
  const ripples = [];
  for (let i = 0; i < 5; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xd6ecf0, transparent: true, opacity: 0, depthWrite: false });
    const mesh = new THREE.Mesh(ripGeo, mat); mesh.visible = false; mesh.renderOrder = 1; scene.add(mesh);
    ripples.push({ mesh, mat, t: -1 });
  }
  function ripple(x, z) {
    const r = ripples.find((q) => q.t < 0) || ripples[0];
    r.t = 0; r.mesh.position.set(x, POND.waterY + 0.03, z); r.mesh.visible = true;
  }

  // ---------- Mười lăm đèn trên hồ: 9 của khách + tối đa 6 của người chơi ----------
  for (let i = 0; i < N_PIL_LAN; i++) { const pt = pondPoint(0.9, 1.1); addLantern({ x: pt.x, z: pt.z }); }

  // ---------- Cập nhật mỗi khung ----------
  const SEP = 0.8, SEP2 = SEP * SEP;
  function updateRibbons(t) {
    const gust = 0.65 + 0.35 * Math.sin(t * 0.31);
    for (let i = 0; i < pil.length; i++) {
      const p = pil[i], a = p.amp * gust;
      _e.set(Math.sin(t * p.sp * 0.73 + p.ph * 1.9) * 0.07 * a, p.yaw, Math.sin(t * p.sp + p.ph) * 0.09 * a, 'YXZ');
      _q.setFromEuler(_e); _s.set(1, p.sc, 1);
      _m4.compose(p.pos, _q, _s); pilMesh.setMatrixAt(i, _m4);
    }
    if (pil.length) pilMesh.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < ribbons.length; i++) {
      const r = ribbons[i]; if (!r.ready) continue;
      r.mesh.rotation.set(Math.sin(t * 0.8 + r.ph * 1.7) * 0.06 * r.amp * gust, r.yaw, Math.sin(t * 1.05 + r.ph) * 0.08 * r.amp * gust);
    }
  }
  function driftStep(L, dt, t) {
    const ax = POND.rx - 0.7, az = POND.rz - 0.7;
    const ang = L.heading + Math.sin(t * 0.11 + L.ph) * 1.1 + Math.sin(t * 0.037 + L.ph * 2.3) * 1.6;
    const kk = 1 - Math.exp(-0.6 * dt);
    L.vx += (Math.sin(ang) * L.speed - L.vx) * kk; L.vz += (Math.cos(ang) * L.speed - L.vz) * kk;
    const ex = (L.x - POND.x) / ax, ez = (L.z - POND.z) / az; let k = ex * ex + ez * ez;
    if (k > 0.72) { // gần mép: nhẹ nhàng quay vào giữa hồ
      const dx = POND.x - L.x, dz = POND.z - L.z, d = Math.hypot(dx, dz) || 1, f = (k - 0.72) * 0.35 * dt;
      L.vx += (dx / d) * f; L.vz += (dz / d) * f;
      L.heading = U.angleDamp(L.heading, Math.atan2(dx, dz), 0.9, dt);
    }
    const IS = POND.island; // né đảo nhỏ giữa hồ
    if (IS) { const ix = L.x - IS.x, iz = L.z - IS.z, id = Math.hypot(ix, iz) || 1, lim = IS.r + 0.7; if (id < lim + 0.8) { const f = (lim + 0.8 - id) * 0.6 * dt; L.vx += (ix / id) * f; L.vz += (iz / id) * f; } if (id < lim) { L.x = IS.x + (ix / id) * lim; L.z = IS.z + (iz / id) * lim; } }
    L.x += L.vx * dt; L.z += L.vz * dt;
    if (k > 1.4) { const s = Math.sqrt(1.4 / k); L.x = POND.x + (L.x - POND.x) * s; L.z = POND.z + (L.z - POND.z) * s; }
    L.yaw += (0.06 + Math.sin(t * 0.17 + L.ph) * 0.05) * dt;
  }
  function updateLanterns(dt, t) {
    const n = lanterns.length, night = (G.tod && G.tod.night) || 0;
    lanMat.emissiveIntensity = 0.2 + night * 0.5;
    lanGlow.material.uniforms.uIntensity.value = 0.55 + night * 0.6;
    for (let i = 0; i < n; i++) { // các đèn nhẹ nhàng tránh nhau
      const a = lanterns[i]; if (a.mode !== 'drift') continue;
      for (let j = i + 1; j < n; j++) {
        const b = lanterns[j]; if (b.mode !== 'drift') continue;
        const dx = b.x - a.x, dz = b.z - a.z, d2 = dx * dx + dz * dz;
        if (d2 >= SEP2) continue;
        const d = Math.sqrt(d2), f = (SEP - d) * 1.1 * dt, nx = d > 1e-4 ? dx / d : 1, nz = d > 1e-4 ? dz / d : 0;
        a.vx -= nx * f; a.vz -= nz * f; b.vx += nx * f; b.vz += nz * f;
      }
    }
    const hw = G.player.handsWorld, cx = G.camera.position.x, cz = G.camera.position.z;
    for (let i = 0; i < n; i++) {
      const L = lanterns[i];
      L.age += dt;
      if (L.mode === 'held') { L.x = hw.x; L.y = hw.y - 0.07; L.z = hw.z; L.yaw = G.player.yaw; }
      else if (L.mode === 'drift') { driftStep(L, dt, t); L.y = WY + Math.sin(t * 1.25 + L.ph) * 0.007; }
      const sc = LS * (0.45 + 0.55 * G.ease.out(Math.min(1, L.age * 1.6)));
      const drifting = L.mode === 'drift';
      _e.set(drifting ? Math.sin(t * 0.9 + L.ph) * 0.035 : 0, L.yaw, drifting ? Math.sin(t * 1.1 + L.ph * 1.3) * 0.035 : 0, 'YXZ');
      _q.setFromEuler(_e);
      _p.set(L.x, L.y, L.z); _s.setScalar(sc); _m4.compose(_p, _q, _s); bodyIM.setMatrixAt(i, _m4);
      const fl = 1 + Math.sin(t * 11 + L.ph) * 0.16 + Math.sin(t * 17.3 + L.ph * 1.7) * 0.1;
      _p.set(L.x, L.y + 0.27 * sc, L.z); _s.set(sc * (1 - (fl - 1) * 0.5), sc * fl, sc * (1 - (fl - 1) * 0.5));
      _m4.compose(_p, _q, _s); flameIM.setMatrixAt(i, _m4);
      lanGlow.set(i, L.x, L.y + 0.32 * sc, L.z, 0.85 * sc, 1.0, 0.72, 0.36, 0.9);
      const tg = L.tag;
      if (tg) { // nhãn giấy nhỏ luôn hướng về máy quay, đặt bên cạnh đèn
        if (drifting) L.tagK = Math.min(1, L.tagK + dt * 1.6);
        if (L.tagK > 0.001) {
          const dx = cx - L.x, dz = cz - L.z, d = Math.hypot(dx, dz) || 1;
          tg.mesh.position.set(L.x - (dz / d) * 0.62 + (dx / d) * 0.12, L.y + 0.16, L.z + (dx / d) * 0.62 + (dz / d) * 0.12);
          tg.mesh.rotation.set(-0.15, Math.atan2(dx, dz), 0);
          tg.mesh.scale.setScalar(Math.max(0.01, G.ease.outBack(L.tagK)));
          tg.mesh.visible = true;
        } else tg.mesh.visible = false;
      }
    }
    if (n) { bodyIM.instanceMatrix.needsUpdate = true; flameIM.instanceMatrix.needsUpdate = true; }
    lanGlow.commit();
  }
  function updateRipples(dt) {
    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i]; if (r.t < 0) continue;
      r.t += dt; const k = r.t / 1.8;
      if (k >= 1) { r.t = -1; r.mesh.visible = false; r.mat.opacity = 0; continue; }
      r.mesh.scale.setScalar(0.6 + k * 3.2); r.mat.opacity = 0.5 * (1 - k) * (1 - k);
    }
  }

  // =====================================================================
  //  VIẾT LỜI CẦU AN: bảng soạn lời, đi tới cây / hồ rồi gửi gắm
  // =====================================================================
  let composer = null;
  function openComposer(dest) {
    if ((composer && !composer.closed) || G.activity.current) return;
    let kind = dest === 'hoadang' ? 'hoadang' : 'lua', cat = 'Bình an';
    const box = U.el('div');

    const secCat = U.el('div', 'cb-sec');
    secCat.appendChild(U.el('div', 'cb-lbl', 'Chủ đề'));
    const chipBox = U.el('div', 'chips');
    const chipEls = CATS.map((c) => {
      const b = U.el('button', 'chip cb-chip', c); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
      b.onclick = () => { ui(); setCat(c); };
      chipBox.appendChild(b); return b;
    });
    secCat.appendChild(chipBox);

    const secText = U.el('div', 'cb-sec');
    secText.appendChild(U.el('div', 'cb-lbl', 'Lời cầu an của bạn'));
    const wrap = U.el('div', 'cb-wrap');
    const ta = U.el('textarea', 'field cb-ta');
    ta.maxLength = 120; ta.rows = 3; ta.spellcheck = false; ta.autocomplete = 'off';
    ta.placeholder = 'Viết đôi dòng gửi gắm tâm ý của bạn…'; ta.setAttribute('aria-label', 'Lời cầu an của bạn');
    const count = U.el('div', 'cb-count', '0/120');
    wrap.append(ta, count);
    const hint = U.el('div', 'cb-hint'); hint.setAttribute('aria-live', 'polite');
    secText.append(wrap, hint);
    const setHint = (s) => { hint.textContent = s; };
    const onInput = () => { count.textContent = ta.value.length + '/120'; if (hint.textContent) setHint(''); };
    ta.addEventListener('input', onInput);

    const secSug = U.el('div', 'cb-sec');
    secSug.appendChild(U.el('div', 'cb-lbl', 'Gợi ý nhẹ nhàng (chạm để điền)'));
    const sug = U.el('div', 'cb-sug');
    secSug.appendChild(sug);

    const secDest = U.el('div', 'cb-sec');
    secDest.appendChild(U.el('div', 'cb-lbl', 'Nơi gửi gắm'));
    const optBox = U.el('div', 'cb-dest'); optBox.setAttribute('role', 'radiogroup'); optBox.setAttribute('aria-label', 'Nơi gửi gắm lời cầu an');
    const opts = [['lua', 'Dải lụa đỏ trên cây bồ đề', G.icons.ribbon], ['hoadang', 'Đèn hoa đăng trên hồ sen', G.icons.lantern]].map(([k, label, icon]) => {
      const b = U.el('button', 'cb-opt'); b.type = 'button'; b.setAttribute('role', 'radio');
      const ic = U.el('span', 'cb-ic'); ic.innerHTML = icon; // biểu tượng SVG tĩnh do mã viết
      b.append(ic, U.el('span', null, label));
      b.onclick = () => { ui(); setKind(k); };
      optBox.appendChild(b); return [k, b];
    });
    secDest.appendChild(optBox);

    box.append(secCat, secText, secSug, secDest, U.el('div', 'note cb-note', NOTE_PRAYER));

    function setCat(c) {
      cat = c;
      chipEls.forEach((b, i) => { const on = CATS[i] === c; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      sug.textContent = '';
      for (const s of SUGGEST[c] || []) {
        const b = U.el('button', null, s); b.type = 'button';
        b.onclick = () => { ui(); ta.value = s; onInput(); };
        sug.appendChild(b);
      }
    }
    function setKind(k) {
      kind = k;
      for (const [key, b] of opts) { b.classList.toggle('on', key === k); b.setAttribute('aria-checked', key === k ? 'true' : 'false'); }
    }
    setCat(cat); setKind(kind);

    const submit = (close) => {
      const text = G.text.cleanText(ta.value, 120).replace(/\s*\n\s*/g, ' ').normalize('NFC');
      if (!text) { setHint('Bạn viết đôi dòng hoặc chọn một gợi ý nhé.'); ta.focus(); return; }
      if (G.text.hasBad(text)) { setHint('Lời cầu an nên nhẹ nhàng, bạn viết lại giúp mình nhé.'); ta.focus(); return; }
      const dst = kind === 'lua' ? TREE : POND;
      if (!beginRun('cau-an', dst.cam)) { setHint('Lúc này chưa viết được, bạn thử lại sau một chút nhé.'); return; }
      close();
      prayerSequence(text, cat, kind);
    };
    composer = G.ui.panel({
      title: 'Viết lời cầu an', body: box,
      actions: [{ label: 'Gửi lời cầu an', primary: true, onClick: (close) => submit(close) }],
      onClose: () => { composer = null; },
    });
  }

  // đi tới nơi gửi gắm → viết → chắp tay → thả lụa / thả đèn → lưu → báo nhẹ nhàng
  async function prayerSequence(text, cat, kind) {
    const my = run.id, alive = () => run.active && run.id === my;
    const P = G.player, isRibbon = kind === 'lua', dest = isRibbon ? TREE : POND;
    let item = null, saved = false;
    const xb = U.el('button', 'fq-x', '×'); xb.type = 'button'; xb.setAttribute('aria-label', 'Dừng lại');
    xb.onclick = () => { ui(); abortRun(); };
    G.ui.overlay.appendChild(xb);
    onCleanup(() => {
      xb.remove();
      P.poseParam = 0;
      if (item && !item.committed) { if (isRibbon) removeRibbon(item); else removeLantern(item); }
    });
    try {
      if (!(await goStand(dest.stand, alive))) return;
      item = isRibbon ? holdRibbon(text) : holdLantern(text);
      P.setPose('write');
      await G.wait(1.2); if (!alive()) return;
      P.setPose('pray');
      await G.wait(1.2); if (!alive()) return;
      if (isRibbon) {
        G.audio?.play?.('ribbon');
        G.save.addPrayer({ text, kind, cat }); saved = true; item.committed = true; // từ đây dải lụa tự bay tới nơi dù bị huỷ
        P.setPose('offer');
        await flyRibbon(item); if (!alive()) return;
      } else {
        P.setPose('release');
        await G.wait(0.7); if (!alive()) return;
        G.save.addPrayer({ text, kind, cat }); saved = true; item.committed = true;
        await flyLantern(item); if (!alive()) return;
      }
      P.setPose('pray');
      await G.wait(1.1);
    } catch (e) {
      console.error(e); G.ui.toast('Có lỗi nhỏ, bạn thử lại nhé.');
    } finally {
      if (alive()) endRun();
      if (saved) prayerDoneToast();
    }
  }
  function prayerDoneToast() {
    G.audio?.play?.('chime');
    const t = G.ui.toast('Lời cầu an của bạn đã được gửi gắm. Mong mọi điều an lành.', 6500);
    if (!t) return;
    t.style.pointerEvents = 'auto';
    const b = U.el('button', 'btn primary bk-toast-btn', 'Chia sẻ'); b.type = 'button';
    b.onclick = () => { ui(); t.remove(); openShare(); };
    const row = U.el('div'); row.appendChild(b); t.appendChild(row);
  }
  // phục hồi dải lụa / đèn đã gửi từ những lần trước
  function restoreSaved() {
    const ps = (G.save.data.prayers || []).filter((p) => p && p.text);
    for (const p of ps.filter((q) => q.kind === 'lua').slice(0, 6).reverse()) placeRibbon(createRibbon(String(p.text)));
    for (const p of ps.filter((q) => q.kind === 'hoadang').slice(0, 3).reverse()) {
      const pt = pondPoint(0.9, 1.1); createOwnLantern(String(p.text), { x: pt.x, z: pt.z, age: 10 });
    }
  }
  function clearPlayerItems() {
    for (const r of ribbons.slice()) removeRibbon(r);
    for (const L of lanterns.slice()) if (L.own) removeLantern(L);
  }

  // =====================================================================
  //  XIN QUẺ ĐẦU NĂM: lắc ống xăm (giữ / lắc điện thoại), rút một quẻ, thẻ lật
  // =====================================================================
  let fq = null; // phiên xin quẻ đang chạy
  const TUBE_SVG = (() => {
    const tops = [58, 40, 66, 34, 50, 62, 42, 56, 46];
    let sticks = '';
    tops.forEach((top, i) => {
      const x = 60 + i * 10, ang = (i - 4) * 3.4;
      sticks += '<g transform="rotate(' + ang + ' ' + (x + 4.5) + ' 150)"><rect x="' + x + '" y="' + top + '" width="9" height="120" rx="3" fill="url(#fqS)"/><rect x="' + x + '" y="' + top + '" width="9" height="10" rx="3" fill="#b3261e"/></g>';
    });
    return '<svg viewBox="0 -4 200 274" aria-hidden="true" focusable="false">'
      + '<defs><linearGradient id="fqG" x1="0" x2="1"><stop offset="0" stop-color="#b98a35"/><stop offset=".35" stop-color="#e6bf68"/><stop offset=".7" stop-color="#d1a247"/><stop offset="1" stop-color="#9c712a"/></linearGradient>'
      + '<linearGradient id="fqS" x1="0" x2="1"><stop offset="0" stop-color="#dcbd7e"/><stop offset="1" stop-color="#b8935a"/></linearGradient></defs>'
      + '<ellipse cx="100" cy="112" rx="48" ry="9" fill="#5a3a10"/>' + sticks
      + '<g class="fq-pick"><rect x="95" y="100" width="10" height="130" rx="3" fill="url(#fqS)"/><rect x="92" y="100" width="16" height="30" rx="4" fill="#b3261e" stroke="#f7d793" stroke-width="1.2"/>'
      + '<text class="fq-pno" x="100" y="121" text-anchor="middle" font-size="15" font-weight="700" fill="#fff3cf" font-family="system-ui,sans-serif"></text></g>'
      + '<path d="M52 112 H148 V250 Q148 262 136 262 H64 Q52 262 52 250 Z" fill="url(#fqG)" stroke="#7a5a1e" stroke-width="2"/>'
      + '<rect x="52" y="150" width="96" height="5" fill="#8a6522" opacity=".45"/><rect x="52" y="222" width="96" height="5" fill="#8a6522" opacity=".45"/>'
      + '<rect x="52" y="168" width="96" height="38" fill="#a8291f"/><rect x="52" y="168" width="96" height="3" fill="#e6b64f"/><rect x="52" y="203" width="96" height="3" fill="#e6b64f"/>'
      + '<circle cx="100" cy="187" r="9" fill="none" stroke="#f2cc73" stroke-width="2"/><circle cx="100" cy="187" r="3" fill="#f2cc73"/>'
      + '<path d="M52 112 Q100 128 148 112" fill="none" stroke="#f0cf80" stroke-width="3" stroke-linecap="round"/>'
      + '<path d="M66 124 V246" stroke="#fff3cf" stroke-width="3" opacity=".25" stroke-linecap="round"/></svg>';
  })();

  function makeStickGeo() {
    return U.merge([
      U.piece(new THREE.BoxGeometry(1, 1, 1), 0xd2ad6c, { s: [0.02, 0.52, 0.009], j: 0.03 }),
      U.piece(new THREE.BoxGeometry(1, 1, 1), 0xb3261e, { p: [0, 0.2, 0], s: [0.0215, 0.09, 0.0095], j: 0 }),
    ]);
  }
  function removeStick(s) {
    const st = s.stick; if (!st) return;
    st.dead = true; scene.remove(st.mesh); st.geo.dispose(); s.stick = null;
  }
  // que văng khỏi ống rồi rơi xuống mặt bàn, nảy nhẹ một cái
  function dropStick(s) {
    removeStick(s);
    const geo = makeStickGeo(), mesh = new THREE.Mesh(geo, G.mats.vc);
    mesh.rotation.order = 'YZX'; mesh.castShadow = false; mesh.frustumCulled = false;
    const st = (s.stick = { mesh, geo, dead: false });
    const tp = FORT.tubeTop, REST = 0.852;
    const x0 = tp.x, z0 = tp.z, y0 = tp.y - 0.15, x1 = -14.02 + U.rand(-0.1, 0.08), z1 = 14.46 + U.rand(-0.1, 0.1), yaw1 = U.rand(-0.8, 0.8);
    mesh.position.set(x0, y0, z0); scene.add(mesh);
    return G.tween(1.0, (k, raw) => {
      if (st.dead) return;
      if (raw < 0.3) {
        const a = G.ease.out(raw / 0.3);
        mesh.position.set(x0, U.lerp(y0, 1.52, a), z0); mesh.rotation.set(0, 0, 0.3 * a);
      } else {
        const a = (raw - 0.3) / 0.7, e = G.ease.out(a);
        mesh.position.set(U.lerp(x0, x1, e), U.lerp(1.52, REST, a * a), U.lerp(z0, z1, e));
        mesh.rotation.set(0, yaw1 * a, U.lerp(0.3, PI / 2, e));
      }
    }).then(() => {
      if (st.dead) return;
      G.audio?.play?.('stickDrop');
      return G.tween(0.32, (k) => {
        if (st.dead) return;
        mesh.position.set(x1, REST + Math.sin(PI * k) * 0.045 * (1 - k), z1);
        mesh.rotation.set(0, yaw1, PI / 2 + Math.sin(k * PI * 2) * 0.04 * (1 - k));
      });
    });
  }

  function attachMotion(s) {
    if (s.motion) return;
    s.motion = (e) => {
      const a = e.acceleration, g = e.accelerationIncludingGravity;
      let m = 0, thr = 8;
      if (a && a.x != null) m = Math.hypot(a.x, a.y || 0, a.z || 0);
      else if (g && g.x != null) { m = Math.abs(Math.hypot(g.x, g.y || 0, g.z || 0) - 9.81); thr = 6; }
      else return;
      if (m > thr) s.motionAt = performance.now();
    };
    window.addEventListener('devicemotion', s.motion);
  }
  // iOS cần người dùng chạm mới được bật cảm biến; nơi khác thì bật luôn
  function setupMotion(s, mb) {
    const DME = window.DeviceMotionEvent;
    if (typeof DME === 'undefined') return;
    if (typeof DME.requestPermission !== 'function') { attachMotion(s); return; }
    mb.classList.remove('hidden');
    mb.onclick = () => {
      const done = (ok) => {
        if (ok) { attachMotion(s); G.ui.toast('Đã bật lắc điện thoại. Bạn lắc nhẹ thử nhé.', 2400); }
        else G.ui.toast('Không sao, bạn chạm và giữ để lắc nhé.', 2600);
        mb.classList.add('hidden');
      };
      try { DME.requestPermission().then((r) => done(r === 'granted')).catch(() => done(false)); } catch (e) { done(false); }
    };
  }

  function buildFortuneUI(s) {
    const ov = U.el('div', 'fq-ov');
    const x = U.el('button', 'fq-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Đóng');
    x.onclick = () => { ui(); endRun(); };
    const box = U.el('div', 'fq-box');
    const help = U.el('div', 'fq-help fq-live', 'Lắc điện thoại hoặc chạm và giữ để lắc ống xăm');
    const sub = U.el('div', 'fq-sub fq-live', G.isTouch ? '' : 'Máy tính: giữ chuột hoặc giữ phím Space.');
    if (G.isTouch) sub.classList.add('hidden');
    const stage = U.el('div', 'fq-stage fq-live'); stage.innerHTML = TUBE_SVG; // SVG tĩnh do mã viết
    const tube = stage.firstElementChild, pick = stage.querySelector('.fq-pick'), pickNo = stage.querySelector('.fq-pno');
    const prog = U.el('div', 'fq-prog fq-live'); const bar = U.el('i'); prog.appendChild(bar);
    const mb = U.el('button', 'btn fq-motion fq-live hidden', 'Bật lắc điện thoại'); mb.type = 'button';
    const hold = U.el('div', 'fq-hold fq-live'); hold.setAttribute('role', 'button'); hold.tabIndex = 0;
    hold.setAttribute('aria-label', 'Chạm và giữ để lắc ống xăm');
    const holdLbl = U.el('span', null, 'Chạm và giữ để lắc'); hold.appendChild(holdLbl);
    const card = U.el('div', 'fq-card');
    box.append(help, sub, stage, prog, mb, hold, card);
    ov.append(x, box);
    G.ui.overlay.appendChild(ov);
    const down = (e) => {
      if (s.state !== 'shake') return;
      e.preventDefault(); s.holds.add(e.pointerId);
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* không bắt được con trỏ: vẫn chạy bình thường */ }
    };
    const up = (e) => { s.holds.delete(e.pointerId); };
    for (const el of [hold, stage]) {
      el.addEventListener('pointerdown', down);
      for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(ev, up);
      el.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    setupMotion(s, mb);
    return { ov, box, tube, pick, pickNo, bar, hold, holdLbl, card };
  }

  async function startFortune() {
    const P = G.player;
    if (!beginRun('xin-que', FORT.cam)) return;
    const my = run.id, alive = () => run.active && run.id === my;
    const s = (fq = { state: 'walk', prog: 0, holds: new Set(), key: false, motionAt: -1e9, sndAcc: 0, pct: -1, shaking: false, held: null, stick: null, ui: null, motion: null, no: 0, hist: [] });
    const onKeyDown = (e) => { if (e.code === 'Space' && s.state === 'shake') { s.key = true; e.preventDefault(); } };
    const onKeyUp = (e) => { if (e.code === 'Space') { s.key = false; if (s.state === 'shake') e.preventDefault(); } };
    const onBlur = () => { s.key = false; s.holds.clear(); };
    window.addEventListener('keydown', onKeyDown); window.addEventListener('keyup', onKeyUp); window.addEventListener('blur', onBlur);
    onCleanup(() => {
      window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); window.removeEventListener('blur', onBlur);
      if (s.motion) { window.removeEventListener('devicemotion', s.motion); s.motion = null; }
      if (s.ui) { s.ui.ov.remove(); s.ui = null; }
      removeStick(s);
      if (s.held) { P.handsMid.remove(s.held); s.held = null; }
      FORT.tube.visible = true;
      P.poseParam = 0; s.state = 'done';
      if (fq === s) fq = null;
    });
    try {
      if (!(await goStand(FORT.stand, alive))) return;
      // cầm ống xăm trên tay, ống trên bàn tạm ẩn đi
      s.held = FORT.tube.clone(true); s.held.visible = true;
      FORT.tube.visible = false;
      P.handsMid.add(s.held); s.held.position.set(0, -0.2, 0.06); s.held.rotation.set(0.12, 0, 0);
      P.setPose('shake'); P.poseParam = 0;
      s.ui = buildFortuneUI(s);
      s.state = 'shake';
    } catch (e) {
      console.error(e); G.ui.toast('Có lỗi nhỏ, bạn thử lại nhé.');
      if (alive()) endRun();
    }
  }
  function pickFortuneNo(s) {
    let no = 0;
    for (let i = 0; i < 12; i++) { no = U.randInt(1, FORTUNES.length); if (!s.hist.includes(no)) break; }
    s.hist.push(no); if (s.hist.length > 4) s.hist.shift();
    return no;
  }
  // đủ thời gian lắc: một que văng ra, rơi xuống bàn, rồi thẻ quẻ lật lên
  async function fortunePop(s, my) {
    const alive = () => run.active && run.id === my && fq === s && s.ui;
    s.state = 'pop'; s.holds.clear(); s.key = false;
    G.player.poseParam = 0;
    try {
      const u = s.ui;
      u.box.classList.add('pop'); u.tube.classList.remove('rattle');
      const no = pickFortuneNo(s); s.no = no;
      u.pickNo.textContent = String(no); u.pick.classList.add('out');
      await dropStick(s); if (!alive()) return;
      await G.wait(0.45); if (!alive()) return;
      showFortuneCard(s, no);
    } catch (e) {
      console.error(e); G.ui.toast('Có lỗi nhỏ, bạn thử lại nhé.');
      if (alive()) endRun();
    }
  }
  function showFortuneCard(s, no) {
    const f = FORTUNES[no - 1], u = s.ui, card = u.card;
    s.state = 'card'; G.audio?.play?.('chime');
    card.textContent = '';
    // quẻ được tự lưu vào sổ ngay khi lật thẻ
    G.save.addFortune({ no, title: f[0], text: f[1] });
    const save = U.el('div', 'note center', 'Đã lưu vào Sổ cầu an của bạn.');
    const again = U.el('button', 'btn', 'Xin quẻ khác'); again.type = 'button';
    again.onclick = () => {
      if (s.state !== 'card') return;
      s.state = 'shake'; s.prog = 0; s.pct = -1; s.shaking = false;
      u.box.classList.remove('pop', 'res'); u.pick.classList.remove('out'); u.bar.style.width = '0%';
      removeStick(s); card.textContent = '';
    };
    const close = U.el('button', 'btn', 'Đóng'); close.type = 'button';
    close.onclick = () => endRun();
    const row = U.el('div', 'row'); row.append(again, close);
    const btns = U.el('div', 'fq-btns'); btns.append(save, row);
    card.append(U.el('div', 'fq-no', 'Quẻ số ' + no), U.el('div', 'fq-title', f[0]), U.el('p', 'fq-text', f[1]), U.el('div', 'fq-fun', 'Mang tính giải trí'), btns);
    u.box.classList.add('res');
  }
  function updateFortune(dt, t) {
    const s = fq; if (!s) return;
    const P = G.player;
    if (s.held) { // ống xăm rung trên tay khi đang lắc
      const pp = P.poseParam;
      s.held.rotation.set(0.12 + Math.sin(t * 31) * 0.05 * pp, 0, Math.sin(t * 29) * 0.16 * pp);
      s.held.position.y = -0.2 + Math.abs(Math.sin(t * 27)) * 0.035 * pp;
    }
    if (s.state !== 'shake' || !s.ui) return;
    const u = s.ui, shaking = s.holds.size > 0 || s.key || performance.now() - s.motionAt < 320;
    P.poseParam = U.damp(P.poseParam, shaking ? 1 : 0, 14, dt);
    if (shaking) {
      s.prog = Math.min(1, s.prog + dt / 1.6);
      s.sndAcc -= dt;
      if (s.sndAcc <= 0) { G.audio?.play?.('shake', { dur: 0.5 }); s.sndAcc = 0.45; }
    }
    if (shaking !== s.shaking) {
      s.shaking = shaking;
      u.tube.classList.toggle('rattle', shaking); u.hold.classList.toggle('on', shaking);
      u.holdLbl.textContent = shaking ? 'Đang lắc…' : 'Chạm và giữ để lắc';
    }
    const pct = Math.round(s.prog * 100);
    if (pct !== s.pct) { s.pct = pct; u.bar.style.width = pct + '%'; }
    if (s.prog >= 1) fortunePop(s, run.id);
  }

  // =====================================================================
  //  SỔ CẦU AN CỦA TÔI: tên, thống kê, lời cầu an và quẻ đã xin
  // =====================================================================
  let bookPanel = null;
  function openBook() {
    if (G.activity.current || (bookPanel && !bookPanel.closed)) return;
    const box = U.el('div');
    bookPanel = G.ui.panel({
      title: 'Sổ cầu an của tôi', body: box,
      actions: [{ label: 'Chia sẻ', primary: true, onClick: () => openShare() }],
      onClose: () => { bookPanel = null; },
    });
    renderBook(box);
  }
  function renderBook(box) {
    box.textContent = '';
    const d = G.save.data;

    // --- tên người chơi, có thể đổi ---
    const nameHost = U.el('div'); box.appendChild(nameHost);
    const showName = () => {
      nameHost.textContent = '';
      const who = U.el('div', 'bk-who'); who.append(U.el('div', 'small muted', 'Tên của bạn'), U.el('b', null, G.save.data.name || 'Phật tử'));
      const b = U.el('button', 'btn bk-small', 'Đổi tên'); b.type = 'button'; b.onclick = () => { ui(); editName(); };
      const row = U.el('div', 'bk-name'); row.append(who, b); nameHost.appendChild(row);
    };
    const editName = () => {
      nameHost.textContent = '';
      const inp = U.el('input', 'field'); inp.maxLength = 20; inp.value = G.save.data.name || ''; inp.autocomplete = 'off'; inp.setAttribute('aria-label', 'Tên của bạn');
      const err = U.el('div', 'cb-hint'); err.setAttribute('aria-live', 'polite');
      const ok = U.el('button', 'btn primary bk-small', 'Lưu'); ok.type = 'button';
      const no = U.el('button', 'btn bk-small', 'Huỷ'); no.type = 'button';
      const doSave = () => {
        const n = G.text.cleanName(inp.value);
        if (!n) { err.textContent = 'Bạn nhập một cái tên nhé.'; return; }
        if (G.text.hasBad(n)) { err.textContent = 'Bạn chọn một cái tên nhẹ nhàng hơn nhé.'; return; }
        G.save.data.name = n; G.save.persist();
        try { G.player.setName(n); } catch (e) { console.error(e); }
        redrawRibbonNames(); G.ui.toast('Đã đổi tên.', 1800); showName();
      };
      ok.onclick = () => { ui(); doSave(); }; no.onclick = () => { ui(); showName(); };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doSave(); } });
      inp.addEventListener('input', () => { err.textContent = ''; });
      const row = U.el('div', 'row'); row.append(ok, no);
      nameHost.append(U.el('div', 'small muted', 'Tên của bạn'), inp, err, row);
      inp.focus();
    };
    showName();

    // --- thống kê ---
    const rows = [['Lần lên chùa', U.fmt(d.visits || 0)], ['Lần thắp hương', U.fmt(d.incense || 0)], ['Số nén hương', U.fmt(d.incenseSticks || 0)],
      ['Lần thỉnh chuông', U.fmt(d.bell || 0)], ['Lượt gõ mõ', U.fmt(d.mo || 0)], ['Tâm an cao nhất', d.bestTamAn ? Math.round(d.bestTamAn) + '/100' : '—']];
    const grid = U.el('div', 'bk-stats');
    for (const [label, val] of rows) { const c = U.el('div', 'bk-stat'); c.append(U.el('b', null, val), U.el('span', null, label)); grid.appendChild(c); }
    box.appendChild(grid);

    // --- lời cầu an đã viết ---
    box.appendChild(U.el('h3', 'bk-h', 'Lời cầu an đã viết'));
    const prayers = newestFirst(d.prayers || []);
    if (!prayers.length) box.appendChild(U.el('div', 'bk-empty', 'Bạn chưa viết lời cầu an nào. Khi muốn, hãy ghé cây bồ đề hoặc hồ sen để gửi gắm tâm ý nhé.'));
    else {
      const list = U.el('div', 'col');
      for (const p of prayers) {
        const it = U.el('div', 'card bk-item'), meta = U.el('div', 'bk-meta');
        const dt = fmtDate(p.at); if (dt) meta.appendChild(U.el('span', null, dt));
        meta.appendChild(U.el('span', 'bk-tag', p.kind === 'hoadang' ? 'Hoa đăng' : 'Dải lụa'));
        if (p.cat) meta.appendChild(U.el('span', 'bk-tag', String(p.cat)));
        it.append(meta, U.el('div', 'bk-text', String(p.text || ''))); list.appendChild(it);
      }
      box.appendChild(list);
    }

    // --- quẻ đã xin ---
    box.appendChild(U.el('h3', 'bk-h', 'Quẻ đã xin'));
    const fortunes = newestFirst(d.fortunes || []);
    if (!fortunes.length) box.appendChild(U.el('div', 'bk-empty', 'Bạn chưa xin quẻ nào. Ghé bàn xin quẻ đầu năm để nhận một lời chúc nhẹ nhàng nhé.'));
    else {
      const list = U.el('div', 'col');
      for (const f of fortunes) {
        const it = U.el('div', 'card bk-item'), meta = U.el('div', 'bk-meta');
        const dt = fmtDate(f.at); if (dt) meta.appendChild(U.el('span', null, dt));
        meta.appendChild(U.el('span', 'bk-tag', 'Quẻ số ' + f.no));
        if (f.title) meta.appendChild(U.el('span', 'gold', String(f.title)));
        it.append(meta, U.el('div', 'bk-text', String(f.text || '')), U.el('div', 'bk-fun', 'Mang tính giải trí')); list.appendChild(it);
      }
      box.appendChild(list);
    }

    // --- các mục do phần khác thêm vào (vd. dấu ấn hành hương ở khu mở rộng) ---
    for (const fn of G.bookSections || []) { try { fn(box); } catch (e) { console.error(e); } }

    // --- xoá dữ liệu (có bước xác nhận) ---
    const del = U.el('div', 'bk-del'); box.appendChild(del);
    const showDel = () => {
      del.textContent = '';
      const b = U.el('button', 'btn bk-danger', 'Xoá dữ liệu trên máy'); b.type = 'button';
      b.onclick = () => { ui(); confirmDel(); };
      del.appendChild(b);
    };
    const confirmDel = () => {
      del.textContent = '';
      const yes = U.el('button', 'btn red bk-small', 'Xoá'); yes.type = 'button';
      const no = U.el('button', 'btn bk-small', 'Giữ lại'); no.type = 'button';
      yes.onclick = () => {
        G.save.reset(); clearPlayerItems();
        G.ui.toast('Đã xoá dữ liệu trên máy.', 2200);
        renderBook(box);
      };
      no.onclick = () => { ui(); showDel(); };
      const row = U.el('div', 'row'); row.append(yes, no); row.style.flexWrap = 'wrap';
      del.append(U.el('p', 'small', 'Bạn có chắc muốn xoá lời cầu an, quẻ đã xin và số liệu trên máy này không? Tên của bạn sẽ được giữ lại.'), row);
    };
    showDel();

    box.appendChild(U.el('div', 'note bk-foot', 'Mọi dữ liệu chỉ lưu trên máy của bạn.'));
  }

  // =====================================================================
  //  CHIA SẺ: ảnh 1080×1350 (cảnh chùa + thẻ nâu), xem trước, chia sẻ hoặc tải về
  // =====================================================================
  function latestPrayerText() {
    const ps = (G.save.data.prayers || []).filter((p) => p && p.text);
    if (!ps.length) return '';
    return String(newestFirst(ps)[0].text).trim();
  }
  function drawShareImage() {
    const Wd = 1080, Ht = 1350, IH = 860;
    const cv = document.createElement('canvas'); cv.width = Wd; cv.height = Ht;
    const c = cv.getContext('2d');
    c.fillStyle = '#2a170e'; c.fillRect(0, 0, Wd, Ht);

    // ảnh cảnh chùa ở trên, mờ dần vào thẻ nâu
    let snap = null;
    try { snap = G.snapshot(Wd, IH, { view: 'postcard' }); } catch (e) { console.error(e); }
    if (snap) { c.drawImage(snap, 0, 0, Wd, IH); snap.width = snap.height = 1; }
    else {
      const sky = c.createLinearGradient(0, 0, 0, IH); sky.addColorStop(0, '#3b4b86'); sky.addColorStop(0.5, '#f08a5b'); sky.addColorStop(1, '#ffc77a');
      c.fillStyle = sky; c.fillRect(0, 0, Wd, IH);
    }
    const warm = c.createLinearGradient(0, IH - 340, 0, IH - 60); warm.addColorStop(0, 'rgba(255,170,90,0)'); warm.addColorStop(1, 'rgba(255,170,90,0.16)');
    c.fillStyle = warm; c.fillRect(0, IH - 340, Wd, 280);
    const fade = c.createLinearGradient(0, IH - 250, 0, IH + 6); fade.addColorStop(0, 'rgba(42,23,14,0)'); fade.addColorStop(0.55, 'rgba(52,29,17,0.74)'); fade.addColorStop(1, 'rgba(42,23,14,1)');
    c.fillStyle = fade; c.fillRect(0, IH - 250, Wd, 256);
    const card = c.createLinearGradient(0, IH, 0, Ht); card.addColorStop(0, '#2a170e'); card.addColorStop(1, '#1d120c');
    c.fillStyle = card; c.fillRect(0, IH, Wd, Ht - IH);

    // khung vàng đôi + hoa sen ở bốn góc
    c.lineJoin = 'round';
    c.strokeStyle = '#e8b85c'; c.lineWidth = 5; c.strokeRect(20, 20, Wd - 40, Ht - 40);
    c.strokeStyle = 'rgba(247,215,147,0.8)'; c.lineWidth = 1.5; c.strokeRect(34, 34, Wd - 68, Ht - 68);
    c.fillStyle = 'rgba(232,184,92,0.92)'; c.strokeStyle = 'rgba(42,23,14,0.6)'; c.lineWidth = 1.5;
    for (const [px, py, ang] of [[70, 70, -PI / 4], [Wd - 70, 70, PI / 4], [70, Ht - 54, -PI * 0.75], [Wd - 70, Ht - 54, PI * 0.75]]) {
      c.save(); c.translate(px, py); c.rotate(ang); drawLotus(c, 0, 14, 38); c.restore();
    }

    const d = G.save.data;
    const name = d.name || G.player.name || 'Phật tử';
    const prayer = latestPrayerText() || 'Nguyện cầu bình an cho mọi người.';
    const tam = d.bestTamAn > 0 ? 'Tâm an: ' + Math.round(d.bestTamAn) + '/100' : 'Tâm an: chưa gõ mõ';
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';

    // tên trò chơi và tên chùa
    const tg = c.createLinearGradient(0, 826, 0, 900); tg.addColorStop(0, '#fbe3a6'); tg.addColorStop(1, '#d9a84a');
    c.font = '700 84px ' + SERIF; c.fillStyle = tg; c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 10; c.shadowOffsetY = 3;
    c.fillText('Lên Chùa Cầu An', Wd / 2, 892, Wd - 140);
    c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetY = 0;
    c.font = '500 34px ' + SERIF; c.fillStyle = '#e9d3ab';
    try { c.letterSpacing = '4px'; } catch (e) { /* trình duyệt cũ không có letterSpacing */ }
    c.fillText('Chùa An Lạc', Wd / 2, 940);
    try { c.letterSpacing = '0px'; } catch (e) {}

    // đường kẻ có hoa sen nhỏ ở giữa
    c.strokeStyle = 'rgba(232,184,92,0.75)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(Wd / 2 - 250, 972); c.lineTo(Wd / 2 - 46, 972); c.moveTo(Wd / 2 + 46, 972); c.lineTo(Wd / 2 + 250, 972); c.stroke();
    c.fillStyle = '#e8b85c'; c.strokeStyle = 'rgba(42,23,14,0.5)'; c.lineWidth = 1;
    drawLotus(c, Wd / 2, 982, 30);

    // tên người chơi
    let nsz = 46; c.font = '700 ' + nsz + 'px ' + SANS;
    while (nsz > 26 && c.measureText(name).width > 820) { nsz -= 2; c.font = '700 ' + nsz + 'px ' + SANS; }
    c.fillStyle = '#fbeed7'; c.fillText(name, Wd / 2, 1038, 820);

    // lời cầu an gần nhất, trong dấu ngoặc kép
    const fit = fitText(c, '“' + prayer + '”', 840, 150, [38, 34, 30, 27], 'italic 500', SERIF, 1.36);
    const lh = fit.size * 1.36;
    c.font = 'italic 500 ' + fit.size + 'px ' + SERIF; c.fillStyle = '#f3dfb8';
    const qy = 1090 + Math.max(0, 3 - fit.lines.length) * lh * 0.5; // ít dòng thì đặt giữa khoảng trống
    for (let i = 0; i < fit.lines.length; i++) c.fillText(fit.lines[i], Wd / 2, qy + i * lh);

    // tâm an, ngày, chân trang
    c.font = '600 30px ' + SANS; c.fillStyle = '#f7d793'; c.fillText(tam, Wd / 2, 1236);
    c.font = '400 24px ' + SANS; c.fillStyle = '#cdb690'; c.fillText(U.dateVN(), Wd / 2, 1270);
    c.font = '400 22px ' + SANS; c.fillStyle = '#a8946f'; c.fillText('Trò chơi thư giãn · Lên Chùa Cầu An', Wd / 2, 1301, Wd - 160);
    return cv;
  }

  let sharePanel = null;
  function openShare() {
    if (G.activity.current || (sharePanel && !sharePanel.closed)) return;
    const body = U.el('div');
    const frame = U.el('div', 'sh-wait', 'Đang chuẩn bị ảnh…');
    const msg = U.el('div', 'sh-msg'); msg.setAttribute('aria-live', 'polite');
    body.append(frame, msg);
    let url = null, file = null, cv = null, gone = false, sharing = false;

    const doShare = async () => {
      if (!file || sharing) return;
      sharing = true;
      try { await navigator.share({ files: [file], title: 'Lên Chùa Cầu An', text: SHARE_TEXT }); }
      catch (e) { if (!(e && e.name === 'AbortError')) G.ui.toast('Chưa chia sẻ được lúc này, bạn thử tải ảnh về nhé.', 3200); }
      sharing = false;
    };
    const doDownload = () => {
      if (!url) return;
      try {
        const a = document.createElement('a'); a.href = url; a.download = 'len-chua-cau-an.png';
        document.body.appendChild(a); a.click(); a.remove();
        G.ui.toast('Đang tải ảnh về máy…', 2200);
      } catch (e) { G.ui.toast('Chưa tải được ảnh, bạn thử lại sau nhé.', 3000); }
    };
    const pan = (sharePanel = G.ui.panel({
      title: 'Chia sẻ', body,
      actions: [{ label: 'Chia sẻ ảnh', primary: true, onClick: doShare }, { label: 'Tải ảnh', onClick: doDownload }],
      onClose: () => {
        gone = true; sharePanel = null;
        if (url) { URL.revokeObjectURL(url); url = null; }
        file = null;
        const im = frame.querySelector('img'); if (im) im.removeAttribute('src');
        if (cv) { cv.width = cv.height = 1; cv = null; }
      },
    }));
    const btns = pan.footer.querySelectorAll('button'), shareBtn = btns[0], dlBtn = btns[1];
    shareBtn.disabled = true; dlBtn.disabled = true;

    // vẽ ảnh sau một nhịp để bảng kịp hiện
    setTimeout(() => {
      if (gone) return;
      try { cv = drawShareImage(); } catch (e) { console.error(e); cv = null; }
      if (!cv) { frame.textContent = ''; msg.textContent = 'Chưa tạo được ảnh, bạn thử lại sau nhé.'; return; }
      const mine = cv;
      mine.toBlob((blob) => {
        mine.width = mine.height = 1; if (cv === mine) cv = null;
        if (gone) return;
        if (!blob) { frame.textContent = ''; msg.textContent = 'Chưa tạo được ảnh, bạn thử lại sau nhé.'; return; }
        try { file = new File([blob], 'len-chua-cau-an.png', { type: 'image/png' }); } catch (e) { file = null; }
        url = URL.createObjectURL(blob);
        const im = U.el('img', 'sh-img'); im.alt = 'Ảnh kỷ niệm Lên Chùa Cầu An'; im.src = url;
        frame.className = ''; frame.textContent = ''; frame.appendChild(im);
        dlBtn.disabled = false;
        let can = false;
        try { can = !!(file && navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share); } catch (e) { can = false; }
        if (can) shareBtn.disabled = false;
        else { shareBtn.style.display = 'none'; msg.textContent = G.isTouch ? 'Máy chưa hỗ trợ chia sẻ trực tiếp — bạn bấm "Tải ảnh", hoặc nhấn giữ vào ảnh để lưu.' : 'Máy chưa hỗ trợ chia sẻ trực tiếp — bạn tải ảnh về nhé.'; }
      }, 'image/png');
    }, 80);
  }

  // =====================================================================
  //  ĐĂNG KÝ: điểm hoạt động, sự kiện, vòng cập nhật, phục hồi từ lần trước
  // =====================================================================
  G.poi.add({ id: 'cau-an', label: 'Viết lời cầu an', icon: 'ribbon', x: TREE.poi.x, z: TREE.poi.z, r: TREE.poi.r, desc: 'Treo dải lụa đỏ lên cây bồ đề', onAction: () => openComposer('lua') });
  G.poi.add({ id: 'hoa-dang', label: 'Thả hoa đăng', icon: 'lantern', x: POND.poi.x, z: POND.poi.z, r: POND.poi.r, desc: 'Thả đèn hoa đăng xuống hồ sen', onAction: () => openComposer('hoadang') });
  G.poi.add({ id: 'xin-que', label: 'Xin quẻ đầu năm', icon: 'fortune', x: FORT.poi.x, z: FORT.poi.z, r: FORT.poi.r, desc: 'Lắc ống xăm, nhận một lời chúc (giải trí)', onAction: () => startFortune() });
  G.events.on('ui:book', openBook);
  G.events.on('enter', () => { try { redrawRibbonNames(); } catch (e) { console.error(e); } });
  G.events.on('ui:share', openShare);
  G.onUpdate((dt, t) => { updateRibbons(t); updateLanterns(dt, t); updateRipples(dt); updateFortune(dt, t); }, 32);
  G.activitiesB = { openComposer, startFortune, openBook, openShare, drawShareImage, fortunes: FORTUNES };
  try { restoreSaved(); } catch (e) { console.error(e); }
}
