// =====================================================================
//  NHÂN VẬT CHỌN ĐƯỢC (2026-11-28)
//  Người chơi chọn nhân vật ở màn chào (và đổi lại trong Cài đặt). Hai mô hình 3D tải về, mỗi mô hình có vài màu áo,
//  cộng nhân vật hoạt hình cũ (dáng chibi áo lam của 06-player.js, cũng là dáng dự phòng khi mô hình không tải được):
//    - "AI Generated - Ancient Chinese Scholar" của OGL (GaryLim) trên Sketchfab, CC BY 4.0  → assets/nhan-vat/thu-sinh.glb
//    - "Chinese dress with irregular hemline" của Style3D Meta trên Sketchfab, CC BY 4.0    → assets/nhan-vat/thieu-nu.glb
//  Hai file gốc là người đứng tĩnh, KHÔNG có xương. File trong game đã được rút gọn lưới, vẽ lại một ảnh bề mặt 2048 px và
//  gắn 12 xương bằng công cụ tests-local/quan-am-tools/nv-lam.mjs (lệnh: LENH-NHAN-VAT.md ở cùng thư mục).
//  Cử động: KHÔNG có hoạt ảnh trong file. Mỗi khung, khối toán NV_TOAN đổi bảy số tư thế của dáng chibi
//  (lx, lz, rx, rz, hip, head, sit: 06-player.js, 22-di-chua-chung.js) thành góc xoay của 12 xương:
//    tay   : điểm bàn tay của dáng chibi → đích cổ tay của mô hình → giải hai đốt (vai – khuỷu – cổ tay);
//    thân  : cúi ở eo (hip), gật đầu (head); chân: bước theo pha đi; ngồi: hạ người, cắt phần dưới mặt ngồi, thêm khối đùi xếp bằng.
//  Vì vậy mọi tư thế sẵn có (chắp tay, lạy, dâng hương, thỉnh chuông, gõ mõ, lắc ống xăm, vẫy tay…) dùng được ngay, cả với người chơi khác.
//  Màu áo: chương trình tô của vật liệu nhuộm phần vải (thuộc tính đỉnh _giu = 1 là phần giữ nguyên: da, tóc, giày) theo độ sáng của ảnh.
//  Khách hành hương AI (20-crowd.js) cũng vẽ bằng hai mô hình này (bản nhẹ *-nhe.glb, mỗi khách một thân, màu áo nhuộm theo màu áo khách): G.nhanVat.khach.
//  API: G.nhanVat = { id, ds, chon(id), veXa(p, k), bo(p), caoThem, trangThai, ghiCong, khach: { san, ve(p, px, pz), an(p), xoa(), trangThai } }.
// =====================================================================

//@@NV-LOI-BAT-DAU  (khối thuần toán, không dùng THREE / DOM: tests-local/quan-am-tools/nv-thu.mjs đọc đúng khối này để dựng ảnh xem thử các tư thế)
const NV_TOAN = (() => {
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const len = (a) => Math.hypot(a[0], a[1], a[2]);
  const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const ss = (a, b, x) => { let t = (x - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
  const qMul = (a, b) => [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
  const qInv = (q) => [-q[0], -q[1], -q[2], q[3]];
  const qAxis = (x, y, z, a) => { const s = Math.sin(a / 2); return [x * s, y * s, z * s, Math.cos(a / 2)]; };
  const qRot = (q, v) => { // v' = q v q*
    const tx = 2 * (q[1] * v[2] - q[2] * v[1]), ty = 2 * (q[2] * v[0] - q[0] * v[2]), tz = 2 * (q[0] * v[1] - q[1] * v[0]);
    return [v[0] + q[3] * tx + q[1] * tz - q[2] * ty, v[1] + q[3] * ty + q[2] * tx - q[0] * tz, v[2] + q[3] * tz + q[0] * ty - q[1] * tx];
  };
  const qArc = (u, v) => { // phép xoay ngắn nhất đưa u tới v (hai vectơ đơn vị)
    const d = dot(u, v);
    if (d < -0.99999) { const a = Math.abs(u[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], c = norm([u[1] * a[2] - u[2] * a[1], u[2] * a[0] - u[0] * a[2], u[0] * a[1] - u[1] * a[0]]); return [c[0], c[1], c[2], 0]; }
    const c = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], w = 1 + d, l = Math.hypot(c[0], c[1], c[2], w);
    return [c[0] / l, c[1] / l, c[2] / l, w / l];
  };
  // Dáng chibi (06-player.js): vai ở (±0,2; 0,8), tay dài 0,36, buông tay nghiêng 0,34 rad → bàn tay ở (±0,32; HY0)
  const HY0 = 0.8 - 0.36 * Math.cos(0.34);
  // Một cánh tay. s = +1 tay trái (+x), −1 tay phải. (ax, az) = góc xoay x, z của tay chibi. Trả về [xoay cánh tay trên, xoay cẳng tay (so với cánh tay trên)].
  function tay(R, s, ax, az) {
    const S = [s * R.vai[0], R.vai[1], R.vai[2]], E = [s * R.khuyu[0], R.khuyu[1], R.khuyu[2]], W = [s * R.coTay[0], R.coTay[1], R.coTay[2]];
    const c0 = -Math.cos(az), hx = s * 0.2 + 0.36 * Math.sin(az), hy = 0.8 + 0.36 * c0 * Math.cos(ax), hz = 0.36 * c0 * Math.sin(ax);
    const t = (hy - HY0) / (0.8 - HY0), tr = t < 0 ? 0 : t > 1 ? 1 : t; // 0: tay buông, 1: bàn tay ngang vai
    const e0 = sub(E, S), l1 = len(e0), l2 = len(sub(W, E)), L = l1 + l2;
    const N = R.treo ? [s * R.treo[0], R.treo[1], R.treo[2]] : W; // cổ tay lúc buông tay tự nhiên: mẫu đứng dang tay (chữ A) thì khác dáng gốc
    const T = [N[0] * s * hx / 0.32, t <= 1 ? N[1] + (S[1] - N[1]) * t : S[1] + ((hy - 0.8) / 0.36) * L, N[2] + (S[2] - N[2]) * tr + (hz / 0.36) * R.voi * (hz >= 0 ? 1 : 0.6)];
    // tay còn thấp (đi, đứng, đặt tay lên đùi): vung cả cánh tay thẳng quanh vai như con lắc, không gập khuỷu
    const kl = 1 - ss(0.16, 0.42, t), an = ax * 0.55, ca = Math.cos(an), sa = Math.sin(an), w0 = sub(N, S);
    if (kl > 0) { const Pn = [S[0] + w0[0], S[1] + w0[1] * ca - w0[2] * sa, S[2] + w0[1] * sa + w0[2] * ca]; T[0] += (Pn[0] - T[0]) * kl; T[1] += (Pn[1] - T[1]) * kl; T[2] += (Pn[2] - T[2]) * kl; }
    if (R.gio != null && T[1] > S[1] + R.gio) { T[1] = S[1] + R.gio; if (Math.abs(T[0]) < R.vai[0] + 0.03 && tr >= 1 && hy > 0.9) T[0] = s * (R.vai[0] + 0.03); } // tay áo thụng: không giơ tay quá đầu (vải bị kéo thành tấm); vẫy tay thì bàn tay ở ngoài vai
    const zmin = R.truoc * (1 - ss(0.05, 0.13, Math.abs(T[0]))) * ss(0.1, 0.3, tr); // tay đưa vào giữa ngực: không chui vào thân
    if (T[2] < zmin) T[2] = zmin;
    let d = sub(T, S), dl = len(d);
    const n = dl > 1e-6 ? [d[0] / dl, d[1] / dl, d[2] / dl] : [0, -1, 0];
    dl = Math.min(L * 0.995, Math.max(Math.abs(l1 - l2) + 1e-3, dl));
    const a = (l1 * l1 - l2 * l2 + dl * dl) / (2 * dl), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    // hướng khuỷu: lúc buông tay đúng như dáng gốc; giơ tay thì khuỷu chĩa xuống dưới, hơi ra ngoài (cẳng tay dựng lên khi chắp tay)
    const n0 = norm(sub(W, S)), k0 = dot(e0, n0), p0 = [e0[0] - n0[0] * k0, e0[1] - n0[1] * k0, e0[2] - n0[2] * k0];
    const pl = len(p0) > 1e-3 ? norm(p0) : [s * 0.6, 0, -0.8], g = [s * 0.5, -0.85, -0.12];
    const pole = [pl[0] * (1 - tr) + g[0] * tr, pl[1] * (1 - tr) + g[1] * tr, pl[2] * (1 - tr) + g[2] * tr], kn = dot(pole, n);
    let pp = [pole[0] - n[0] * kn, pole[1] - n[1] * kn, pole[2] - n[2] * kn];
    if (len(pp) < 1e-4) pp = Math.abs(n[1]) < 0.9 ? [n[2], 0, -n[0]] : [1, 0, 0];
    pp = norm(pp);
    const E2 = [S[0] + n[0] * a + pp[0] * h, S[1] + n[1] * a + pp[1] * h, S[2] + n[2] * a + pp[2] * h], T2 = [S[0] + n[0] * dl, S[1] + n[1] * dl, S[2] + n[2] * dl];
    const qU = qArc(norm(e0), norm(sub(E2, S)));
    const qF = qArc(norm(sub(W, E)), qRot(qInv(qU), norm(sub(T2, E2))));
    return [qU, qF];
  }
  // Cả người. R: số đo của mô hình (vai, khuyu, coTay của bên TRÁI trong hệ cao 1; voi, truoc, buoc, goi, nhun).
  // a: { lx, lz, rx, rz, hip, head, pha (pha bước), di (0…1 đang đi) }. Trả về góc xoay (x, y, z, w) từng xương + độ nhún của hông.
  function tuThe(R, a) {
    const di = a.di || 0, sp = Math.sin(a.pha || 0), cp = Math.cos(a.pha || 0);
    const T = tay(R, 1, a.lx, a.lz), P = tay(R, -1, a.rx, a.rz);
    return {
      nguc: qMul(qAxis(1, 0, 0, a.hip || 0), qAxis(0, 1, 0, sp * 0.06 * di)),
      dau: qAxis(1, 0, 0, a.head || 0),
      tayTrenT: T[0], tayDuoiT: T[1], tayTrenP: P[0], tayDuoiP: P[1],
      duiT: qAxis(1, 0, 0, -R.buoc * sp * di), ongT: qAxis(1, 0, 0, R.goi * Math.max(0, cp) * di),
      duiP: qAxis(1, 0, 0, R.buoc * sp * di), ongP: qAxis(1, 0, 0, R.goi * Math.max(0, -cp) * di),
      nhun: Math.abs(sp) * R.nhun * di,
    };
  }
  // Số đo R của một mẫu từ bảng NV_MAU + vị trí gốc của vai, khuỷu, cổ tay, đầu ngón tay (bên trái, hệ cao 1). Game và nv-thu.mjs cùng gọi.
  // dang: 'A' = mô hình đứng dang tay → tính chỗ cổ tay khi buông tay tự nhiên (thẳng xuống, hơi ra ngoài và ra trước).
  function soDo(M, vai, khuyu, coTay, dauTay) {
    const R = { vai, khuyu, coTay, dauTay, voi: M.voi, truoc: M.truoc, buoc: M.buoc, goi: M.goi, nhun: M.nhun, gio: M.gio };
    if (M.dang === 'A') { const L = len(sub(khuyu, vai)) + len(sub(coTay, khuyu)); R.treo = [vai[0] + (M.treoX != null ? M.treoX : 0.04), vai[1] - 0.965 * L, vai[2] + 0.045]; }
    return R;
  }
  // Nhuộm một màu (tuyến tính 0…1) như chương trình tô: giữ độ sáng của ảnh, đổi sang màu áo mới.
  function nhuom(c, n) { if (!n) return c; const L = (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) * n[4]; return [c[0] + (n[0] * L - c[0]) * n[3], c[1] + (n[1] * L - c[1]) * n[3], c[2] + (n[2] * L - c[2]) * n[3]]; }
  return { qMul, qInv, qAxis, qRot, qArc, tay, tuThe, nhuom, ss, soDo };
})();
// Mẫu (mô hình). cao: chiều cao trong game (m). voi: tầm đưa tay ra trước; truoc: mặt trước ngực (tay không chui vào);
// nhe: bản nhẹ (khoảng 7 nghìn mặt, ảnh 1024 px) cho khách hành hương AI; sang: hệ số sáng khi nhuộm áo khách; non: [y, z, tỉ lệ] đặt nón lá của dáng chibi lên đầu (so với xương đầu; không ghi = không đội nón);
// buoc / goi: biên độ bước chân, gập gối (rad); nhun: nhún khi đi; gio: cổ tay được giơ cao hơn vai tối đa bao nhiêu (không ghi = không giới hạn); ngoi: độ cao đáy hông (mặt ngồi) trong hệ cao 1; dui: màu khối đùi khi ngồi (sRGB).
const NV_MAU = {
  'thu-sinh': { url: 'assets/nhan-vat/thu-sinh.glb', nhe: 'assets/nhan-vat/thu-sinh-nhe.glb', sang: 1.2, cao: 1.5, voi: 0.2, truoc: 0.15, buoc: 0.2, goi: 0.24, nhun: 0.005, gio: 0.07, ngoi: 0.45, dui: [222, 216, 196], thuDa: 1 },
  // Thêm 2026-11-28. dang: 'A' = mô hình đứng dang tay (game tự tính chỗ buông tay); tayCung: tay dính thân trong mô hình, đứng yên (chỉ dùng cho khách AI);
  // gu: dáng đã còng sẵn (không cộng thêm độ còng của khách lớn tuổi); khongNhuom: khách AI giữ nguyên màu áo của mô hình; chiNgoi: chỉ dùng cho người ngồi trong chính điện.
  'cu-ba': { url: 'assets/nhan-vat/cu-ba.glb', nhe: 'assets/nhan-vat/cu-ba-nhe.glb', sang: 1.9, dang: 'A', gu: 1, cao: 1.36, voi: 0.17, truoc: 0.11, buoc: 0.2, goi: 0.32, nhun: 0.004, ngoi: 0.46, dui: [52, 92, 200], thuDa: 0 },
  'cu-ong': { url: 'assets/nhan-vat/cu-ong.glb', nhe: 'assets/nhan-vat/cu-ong-nhe.glb', sang: 1.5, dang: 'A', gu: 1, cao: 1.46, voi: 0.17, truoc: 0.12, buoc: 0.2, goi: 0.32, nhun: 0.004, ngoi: 0.46, dui: [226, 222, 168], thuDa: 0 },
  'chang-trai': { url: 'assets/nhan-vat/chang-trai.glb', nhe: 'assets/nhan-vat/chang-trai-nhe.glb', khongNhuom: 1, dang: 'A', treoX: 0.055, cao: 1.56, voi: 0.19, truoc: 0.135, buoc: 0.3, goi: 0.5, nhun: 0.007, ngoi: 0.47, dui: [168, 142, 100], thuDa: 0 },
  'dam-sao': { url: 'assets/nhan-vat/dam-sao.glb', nhe: 'assets/nhan-vat/dam-sao-nhe.glb', khongNhuom: 1, cao: 1.46, voi: 0.17, truoc: 0.105, buoc: 0.22, goi: 0.38, nhun: 0.006, ngoi: 0.47, dui: [22, 62, 104], thuDa: 0 },
  'ao-dai': { nhe: 'assets/nhan-vat/ao-dai-nhe.glb', sang: 2.6, tayCung: 1, cao: 1.5, voi: 0.17, truoc: 0.1, buoc: 0.2, goi: 0.26, nhun: 0.005, ngoi: 0.47, dui: [196, 22, 26], thuDa: 2 },
  'ke-soc': { nhe: 'assets/nhan-vat/ke-soc-nhe.glb', khongNhuom: 1, tayCung: 1, cao: 1.46, voi: 0.17, truoc: 0.1, buoc: 0.26, goi: 0.42, nhun: 0.006, ngoi: 0.47, dui: [120, 24, 30], thuDa: 0 },
  'ao-mua': { nhe: 'assets/nhan-vat/ao-mua-nhe.glb', khongNhuom: 1, tayCung: 1, cao: 1.5, voi: 0.17, truoc: 0.1, buoc: 0.26, goi: 0.42, nhun: 0.006, ngoi: 0.47, dui: [158, 140, 122], thuDa: 0 },
  'su': { nhe: 'assets/nhan-vat/su-nhe.glb', khongNhuom: 1, tayCung: 1, chiNgoi: 1, cao: 1.56, voi: 0.17, truoc: 0.12, buoc: 0.16, goi: 0.2, nhun: 0.004, ngoi: 0.46, dui: [110, 18, 30], thuDa: 0 },
  'thieu-nu': { url: 'assets/nhan-vat/thieu-nu.glb', nhe: 'assets/nhan-vat/thieu-nu-nhe.glb', sang: 1.7, non: [-0.011, 0.012, 0.258], cao: 1.42, voi: 0.17, truoc: 0.105, buoc: 0.24, goi: 0.42, nhun: 0.006, ngoi: 0.47, dui: [150, 172, 205], thuDa: 0 },
};
// Danh sách nhân vật. nhuom: [đỏ, lục, lam (tuyến tính, màu áo mới), mức nhuộm 0…1, hệ số sáng] hoặc null (màu gốc). mau = null: dáng hoạt hình cũ.
const NV_DS = [
  { id: 'thu-sinh', mau: 'thu-sinh', ten: 'Thư sinh áo trắng', nhuom: null },
  { id: 'thu-sinh-lam', mau: 'thu-sinh', ten: 'Thư sinh áo lam', nhuom: [0.36, 0.5, 0.74, 0.9, 1.25] },
  { id: 'thu-sinh-nau', mau: 'thu-sinh', ten: 'Thư sinh áo nâu', nhuom: [0.6, 0.36, 0.2, 0.9, 1.15] },
  { id: 'thu-sinh-tham', mau: 'thu-sinh', ten: 'Thư sinh áo xám', nhuom: [0.52, 0.52, 0.56, 0.92, 0.95] },
  { id: 'thieu-nu', mau: 'thieu-nu', ten: 'Thiếu nữ áo lam', nhuom: null },
  { id: 'thieu-nu-hong', mau: 'thieu-nu', ten: 'Thiếu nữ áo hồng sen', nhuom: [0.95, 0.5, 0.62, 0.88, 1.75] },
  { id: 'thieu-nu-vang', mau: 'thieu-nu', ten: 'Thiếu nữ áo vàng mơ', nhuom: [1.0, 0.72, 0.3, 0.88, 1.75] },
  { id: 'thieu-nu-tim', mau: 'thieu-nu', ten: 'Thiếu nữ áo tím', nhuom: [0.62, 0.42, 0.85, 0.88, 1.6] },
  { id: 'thieu-nu-nau', mau: 'thieu-nu', ten: 'Thiếu nữ áo nâu', nhuom: [0.58, 0.36, 0.22, 0.9, 1.5] },
  { id: 'dam-sao', mau: 'dam-sao', ten: 'Thiếu nữ đầm sao', nhuom: null },
  { id: 'chang-trai', mau: 'chang-trai', ten: 'Chàng trai áo nỉ', nhuom: null },
  { id: 'cu-ba', mau: 'cu-ba', ten: 'Cụ bà áo lam', nhuom: null },
  { id: 'cu-ba-nau', mau: 'cu-ba', ten: 'Cụ bà áo nâu', nhuom: [0.5, 0.3, 0.17, 0.9, 2.3] },
  { id: 'cu-ong', mau: 'cu-ong', ten: 'Cụ ông áo đỏ', nhuom: null },
  { id: 'phat-tu', mau: null, ten: 'Phật tử áo lam (hoạt hình)', nhuom: null },
];
//@@NV-LOI-KET-THUC

function installNhanVat(G) {
  const { THREE, scene } = G, P = G.player, U = G.util;
  if (!P || !P.than || !G.chibi || !G.save) return;
  const K = G.chibi.k || 1, CHIBI_CAO = 1.57 * K, SEAT = 0.29 * K; // SEAT: mặt ngồi của dáng chibi nằm dưới gốc nhân vật bấy nhiêu mét khi ngồi (đáy thân 0,05 − 0,34)
  const XUONG = ['hong', 'nguc', 'dau', 'tayTrenT', 'tayDuoiT', 'tayTrenP', 'tayDuoiP', 'duiT', 'ongT', 'duiP', 'ongP'];
  const GHI_CONG = 'Nhân vật và khách hành hương dùng các mô hình 3D trên Sketchfab, giấy phép CC BY 4.0, đã chỉnh sửa cho vừa trò chơi (giảm số mặt, bỏ phần khuất, vẽ lại ảnh bề mặt, gắn xương, thêm màu áo): "AI Generated - Ancient Chinese Scholar" của OGL; "Chinese dress with irregular hemline", "Dreamy Starry Night sleeveless dress" và "Red and black plaid Christmas suit" của Style3D Meta; "Female Older People" và "Male Older People" của Ob1to; "A-Pose - Male Full Body 3D Scan" của OverseerThuror; "Ao Dai Hoa Van" của Dung.Anh.Trieu; "Women\'s oversize raincoat" của Ahmad Riazi; "Buddhist monk in orange robes" của restore50.';
  const GHI_CONG_NGAN = 'Nhân vật và khách hành hương dùng 10 mô hình 3D giấy phép CC BY 4.0 trên Sketchfab (đã chỉnh sửa); tên từng mô hình và tác giả ghi trong Cài đặt, mục Nhân vật.';
  const byId = new Map(NV_DS.map((d) => [d.id, d]));
  const S = { state: 'chibi', error: null, tris: 0, xa: 0 }; // state: chibi | loading | ready | failed

  // ---------- tải mô hình (mỗi mẫu một lần) ----------
  let libs = null;
  const mauCache = new Map(); // mẫu (+ ':nhe' cho bản nhẹ) → Promise<{ scene, R, map }>
  function taiMau(mid, nhe) {
    const key = nhe ? mid + ':nhe' : mid;
    if (mauCache.has(key)) return mauCache.get(key);
    const M = NV_MAU[mid];
    const p = (async () => {
      if (!libs) libs = Promise.all([import('three/addons/loaders/GLTFLoader.js'), import('three/addons/libs/meshopt_decoder.module.js'), import('three/addons/utils/SkeletonUtils.js')]);
      const [L, Mo, SU] = await libs;
      const Dec = Mo.MeshoptDecoder || Mo.default;
      if (!L.GLTFLoader || !Dec || Dec.supported === false) throw new Error('trình duyệt không chạy được bộ giải nén mô hình');
      const loader = new L.GLTFLoader(); loader.setMeshoptDecoder(Dec);
      const gltf = await loader.loadAsync(nhe ? M.nhe : M.url);
      const sc = gltf.scene; sc.updateMatrixWorld(true);
      let mesh = null; const node = {};
      sc.traverse((o) => { if (o.isSkinnedMesh && !mesh) mesh = o; if (o.name) node[o.name] = o; });
      if (!mesh || !mesh.geometry.attributes.skinIndex) throw new Error('mô hình không có lưới gắn xương');
      for (const n of XUONG.concat(['coTayT', 'dauTayT'])) if (!node[n]) throw new Error('mô hình thiếu xương "' + n + '"');
      const wp = (n) => { const v = new THREE.Vector3(); node[n].getWorldPosition(v); return [v.x, v.y, v.z]; };
      const map = mesh.material && mesh.material.map;
      if (!map || !map.image) throw new Error('mô hình không có ảnh bề mặt');
      map.anisotropy = Math.min(4, G.renderer.capabilities.getMaxAnisotropy());
      const R = NV_TOAN.soDo(M, wp('tayTrenT'), wp('tayDuoiT'), wp('coTayT'), wp('dauTayT'));
      const idx = mesh.geometry.index;
      return { scene: sc, clone: SU.clone, R, map, M, tris: idx ? idx.count / 3 : 0 };
    })();
    p.catch(() => mauCache.delete(key)); // lỗi mạng: lần chọn sau thử lại
    mauCache.set(key, p);
    return p;
  }

  // ---------- vật liệu: Lambert + nhuộm màu áo + mặt cắt khi ngồi ----------
  function vatLieu(T, d) {
    const n = d.nhuom, m = new THREE.MeshLambertMaterial({ map: T.map, side: THREE.DoubleSide });
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1e4); // luôn có một mặt cắt (để chương trình tô không đổi khi ngồi / đứng); đứng thì đặt rất thấp
    m.clippingPlanes = [plane];
    const un = { uNhuom: { value: new THREE.Vector4(n ? n[0] : 1, n ? n[1] : 1, n ? n[2] : 1, n ? n[3] : 0) }, uNhuomK: { value: new THREE.Vector2(n ? n[4] : 1, T.M.thuDa || 0) } };
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uNhuom = un.uNhuom; sh.uniforms.uNhuomK = un.uNhuomK;
      sh.vertexShader = sh.vertexShader.replace('void main() {', 'attribute float _giu;\nvarying float vGiu;\nvoid main() {\n\tvGiu = _giu;');
      sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'varying float vGiu;\nuniform vec4 uNhuom;\nuniform vec2 uNhuomK;\nvoid main() {')
        .replace('#include <map_fragment>', [
          '#ifdef USE_MAP',
          '\tvec4 sampledDiffuseColor = texture2D( map, vMapUv );',
          '\t{',
          '\t\tvec3 c = sampledDiffuseColor.rgb;',
          '\t\tfloat giu = clamp( vGiu, 0.0, 1.0 );',
          '\t\tfloat ngaDo = ( c.r - c.g ) / max( c.r, 0.04 );',
          '\t\tif ( uNhuomK.y > 1.5 ) giu = giu > 0.75 ? 1.0 : min( 1.0, giu * 2.0 ) * smoothstep( 0.10, 0.22, ngaDo ) * ( 1.0 - smoothstep( 0.55, 0.75, ngaDo ) );', // thuDa = 2 (áo đỏ): _giu = 1 giữ hẳn (đầu, giày); _giu = 0,5 là vùng bàn tay, chỉ giữ điểm ảnh ngả đỏ VỪA PHẢI (da), vải đỏ thẫm vẫn nhuộm
          '\t\telse if ( uNhuomK.y > 0.5 ) giu *= smoothstep( 0.10, 0.22, ngaDo );', // vùng da của mô hình một lớp vỏ: chỉ giữ điểm ảnh ngả đỏ (da, môi), vải lẫn trong vùng vẫn được nhuộm
          '\t\tfloat sang = dot( c, vec3( 0.2126, 0.7152, 0.0722 ) ) * uNhuomK.x;',
          '\t\tsampledDiffuseColor.rgb = mix( c, uNhuom.rgb * sang, uNhuom.a * ( 1.0 - giu ) );',
          '\t}',
          '\tdiffuseColor *= sampledDiffuseColor;',
          '#endif',
        ].join('\n'));
    };
    m.customProgramCacheKey = () => 'nhan-vat-1';
    m.userData.plane = plane; m.userData.un = un;
    return m;
  }
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };

  // ---------- một thân nhân vật (người chơi, người ở xa, hoặc khách hành hương AI khi khach = true) ----------
  const _q = new THREE.Quaternion();
  function taoThan(T, d, khach) {
    const M = T.M, R = T.R;
    const obj = T.clone(T.scene), bone = {}; let mesh = null;
    obj.traverse((o) => { if (o.isSkinnedMesh) mesh = o; if (o.name) bone[o.name] = o; });
    const mat = vatLieu(T, d);
    mesh.material = mat; mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = false;
    if (khach) { mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.5, 0), 0.85); mesh.frustumCulled = true; } // khách AI: mấy chục thân, người ngoài khung hình thì khỏi vẽ (quả cầu bao trong hệ cao 1 của mô hình, đủ cho mọi tư thế)
    const hold = new THREE.Group(); hold.name = 'nhanVat:' + d.id; hold.add(obj);
    const hongY = bone.hong.position.y;
    // khối đùi xếp bằng khi ngồi: cùng hình với dáng chibi, màu vải của nhân vật
    const c = NV_TOAN.nhuom([lin(M.dui[0]), lin(M.dui[1]), lin(M.dui[2])], d.nhuom);
    const dui = khach ? null : new THREE.Mesh(G.chibi.geos.sitLegs, new THREE.MeshLambertMaterial({ color: new THREE.Color(c[0], c[1], c[2]) })); // khách AI dùng lớp khối đùi sẵn có của 20-crowd.js
    if (dui) { dui.visible = false; dui.castShadow = false; }
    const LB = [(R.coTay[0] + R.dauTay[0]) / 2 - R.khuyu[0], (R.coTay[1] + R.dauTay[1]) / 2 - R.khuyu[1], (R.coTay[2] + R.dauTay[2]) / 2 - R.khuyu[2]]; // giữa lòng bàn tay trái so với khuỷu (hệ của xương cẳng tay)
    const a2 = { lx: 0, lz: 0, rx: 0, rz: 0, hip: 0, head: 0, pha: 0, di: 0 };
    return {
      d, M, R, hold, dui, bone, mesh, mat,
      // a: bảy số tư thế; pha, di: pha bước và mức đang đi (0…1)
      tuThe(a, pha, di) {
        a2.lx = a.lx; a2.lz = a.lz; a2.rx = a.rx; a2.rz = a.rz; a2.hip = a.hip; a2.head = a.head; a2.pha = pha; a2.di = a.sit > 0.3 ? 0 : di;
        const o = NV_TOAN.tuThe(R, a2);
        for (let i = 1; i < XUONG.length; i++) { const q = o[XUONG[i]]; bone[XUONG[i]].quaternion.set(q[0], q[1], q[2], q[3]); }
        bone.hong.position.y = hongY + o.nhun;
      },
      // đặt mặt cắt ngang ở độ cao y (thế giới); tat = true: không cắt
      cat(y, tat) { mat.userData.plane.constant = tat ? 1e4 : -y; },
      // đổi màu áo: n = [đỏ, lục, lam (tuyến tính), mức nhuộm, hệ số sáng] hoặc null (màu gốc)
      doiMau(n) { const u = mat.userData.un; u.uNhuom.value.set(n ? n[0] : 1, n ? n[1] : 1, n ? n[2] : 1, n ? n[3] : 0); u.uNhuomK.value.x = n ? n[4] : 1; },
      // điểm giữa lòng bàn tay trong thế giới (s = 1 tay trái, −1 tay phải); gọi sau hold.updateMatrixWorld(true)
      tay(s, out) { return out.set(s * LB[0], LB[1], LB[2]).applyMatrix4(bone[s > 0 ? 'tayDuoiT' : 'tayDuoiP'].matrixWorld); },
      huy() { if (hold.parent) hold.parent.remove(hold); if (dui) { if (dui.parent) dui.parent.remove(dui); dui.material.dispose(); } mat.dispose(); try { mesh.skeleton.dispose(); } catch (e) { /* ảnh ma trận xương của riêng thân này; lưới và ảnh bề mặt dùng chung thì giữ */ } },
    };
  }
  try { G.renderer.localClippingEnabled = true; } catch (e) { /* không cắt được thì phần chân khi ngồi nằm dưới mặt ngồi, vẫn chơi được */ }

  // ---------- nhân vật của người chơi ----------
  const C = P.than; // { inner, tag, armL, armR, A, tagY, di, pha } do 06-player.js đưa ra
  let cur = byId.get(G.save.data.nhanVat) || NV_DS[0], than = null, gen = 0, diK = 0;
  const TIP0 = { p: C.armL.tip.position.clone() };
  function gan(t) { // gắn thân mô hình vào gốc người chơi, giấu dáng chibi; hai điểm bàn tay (P.handL / P.handR) chuyển sang cẳng tay của mô hình
    go();
    than = t;
    const M = t.M, R = t.R;
    t.hold.scale.setScalar(M.cao / K); P.root.add(t.hold);
    t.dui.scale.setScalar(0.01); P.root.add(t.dui);
    C.inner.visible = false;
    for (const [tip, s, bn] of [[C.armL.tip, 1, 'tayDuoiT'], [C.armR.tip, -1, 'tayDuoiP']]) {
      const E = [s * R.khuyu[0], R.khuyu[1], R.khuyu[2]], W = [s * R.coTay[0], R.coTay[1], R.coTay[2]], D = [s * R.dauTay[0], R.dauTay[1], R.dauTay[2]];
      t.bone[bn].add(tip);
      tip.position.set((W[0] + D[0]) / 2 - E[0], (W[1] + D[1]) / 2 - E[1], (W[2] + D[2]) / 2 - E[2]); // giữa lòng bàn tay
      const f = [W[0] - E[0], W[1] - E[1], W[2] - E[2]], l = Math.hypot(f[0], f[1], f[2]) || 1, q = NV_TOAN.qArc([0, -1, 0], [f[0] / l, f[1] / l, f[2] / l]);
      tip.quaternion.set(q[0], q[1], q[2], q[3]); tip.scale.setScalar(K / M.cao); // vật cầm tay giữ cỡ như khi gắn vào tay chibi
    }
    C.tag.position.y = (M.cao + 0.36) / K;
    P.camY = M.cao - 0.04; P.cao = M.cao;
    S.state = 'ready'; S.tris = t.tris || 0;
  }
  function go() { // trả về dáng chibi
    if (than) {
      for (const [arm] of [[C.armL], [C.armR]]) { arm.piv.add(arm.tip); arm.tip.position.copy(TIP0.p); arm.tip.quaternion.identity(); arm.tip.scale.setScalar(1); }
      than.huy(); than = null;
    }
    C.inner.visible = true; C.tag.position.y = C.tagY; P.camY = 0; P.cao = CHIBI_CAO;
    S.state = 'chibi';
  }
  async function chon(id, luu = true) {
    const d = byId.get(id) || NV_DS[0];
    cur = d; const my = ++gen;
    if (luu) { G.save.data.nhanVat = d.id; G.save.persist(); }
    G.events.emit('nhanvat:chon', d.id);
    if (!d.mau) { go(); S.error = null; return true; }
    S.state = 'loading';
    try {
      const T = await taiMau(d.mau);
      if (my !== gen) return false; // đã chọn nhân vật khác trong lúc tải
      const t = taoThan(T, d); t.tris = T.tris;
      gan(t); S.error = null;
      try { G.renderer.compile(scene, G.camera); } catch (e) { /* dựng trước chương trình tô; lỗi thì lần vẽ đầu tự làm */ }
      return true;
    } catch (e) {
      if (my !== gen) return false;
      S.error = (e && e.message) || String(e); go(); S.state = 'failed';
      console.warn('[nhân vật] không tải được mô hình "' + d.id + '" — dùng nhân vật hoạt hình: ' + S.error);
      if (G.started && G.ui && G.ui.toast) G.ui.toast('Chưa tải được mô hình nhân vật, tạm dùng nhân vật hoạt hình.', 4200);
      return false;
    }
  }
  P.cao = CHIBI_CAO;

  // Mỗi khung, SAU 06-player.js (10): tư thế xương, ngồi, điểm giữa hai bàn tay
  const _hl = new THREE.Vector3(), _hr = new THREE.Vector3();
  G.onUpdate((dt) => {
    if (!than) return;
    const a = C.A, M = than.M;
    diK = U.damp(diK, C.di ? 1 : 0, 10, dt);
    than.tuThe(a, C.pha, diK);
    const sit = a.sit, chim = sit * (SEAT + M.ngoi * M.cao); // ngồi: hạ cả người cho đáy hông chạm mặt ngồi của dáng chibi
    than.hold.position.y = -chim / K;
    than.cat(P.pos.y - SEAT - 0.004, sit < 0.03);
    const dui = than.dui; dui.visible = sit > 0.15;
    if (dui.visible) { dui.position.set(0, -sit * 0.34, -0.04); dui.scale.set(1.0 * sit, 1.4 * Math.max(0.01, sit), 1.05 * sit); }
    P.root.updateMatrixWorld(true);
    C.armL.tip.getWorldPosition(_hl); C.armR.tip.getWorldPosition(_hr);
    P.handsWorld.copy(_hl).add(_hr).multiplyScalar(0.5);
    P.handsMid.position.copy(P.handsWorld); P.root.worldToLocal(P.handsMid.position);
  }, 10.5);

  // ---------- người chơi khác (22-di-chua-chung.js gọi mỗi khung cho từng người đang hiện) ----------
  const XA_MAX = G.isTouch ? 5 : 12; // quá số này thì người ở xa hiện bằng dáng hoạt hình
  const xa = new Map(); // peer → { id, than, wait }
  function than_(p, id) {
    let r = xa.get(p);
    if (r && r.id !== id) { if (r.than) r.than.huy(); xa.delete(p); r = null; S.xa = xa.size; }
    const d = byId.get(id);
    if (!d || !d.mau) return null;
    if (!r) {
      if (xa.size >= XA_MAX) return null;
      r = { id, than: null, hong: false }; xa.set(p, r); S.xa = xa.size;
      taiMau(d.mau).then((T) => { if (xa.get(p) !== r) return; r.than = taoThan(T, d); scene.add(r.than.hold); scene.add(r.than.dui); }).catch(() => { r.hong = true; });
    }
    return r.than;
  }
  // Vẽ người ở xa p bằng mô hình (true) hoặc báo để 22 vẽ dáng hoạt hình (false). k: độ hiện 0…1; trả thêm độ cao đầu qua p.nvCao.
  function veXa(p, k) {
    const t = p.nv ? than_(p, p.nv) : (xa.has(p) && bo(p), null);
    if (!t) { p.nvCao = 0; return false; }
    const M = t.M, a = p.a, sit = a.sit;
    t.tuThe(a, p.phase, p.walkAmt);
    t.hold.visible = k > 0.002;
    t.hold.position.set(p.x, p.y - sit * (SEAT + M.ngoi * M.cao), p.z); t.hold.rotation.y = p.yaw; t.hold.scale.setScalar(M.cao * Math.max(0.001, k));
    t.cat(p.y - SEAT - 0.004, sit < 0.03);
    const dui = t.dui; dui.visible = sit > 0.15 && k > 0.5;
    if (dui.visible) { dui.position.set(p.x - Math.sin(p.yaw) * 0.03, p.y - sit * 0.34 * K, p.z - Math.cos(p.yaw) * 0.03); dui.rotation.y = p.yaw; dui.scale.set(1.0 * sit * K, 1.4 * Math.max(0.01, sit) * K, 1.05 * sit * K); }
    p.nvCao = M.cao - CHIBI_CAO - sit * (M.ngoi * M.cao - 0.05 * K); // đỉnh đầu so với dáng chibi cùng tư thế (bảng tên, bong bóng lời)
    return true;
  }
  function bo(p) { const r = xa.get(p); if (!r) return; if (r.than) r.than.huy(); xa.delete(p); S.xa = xa.size; }

  // ---------- khách hành hương AI (20-crowd.js): mỗi khách một thân bản nhẹ, màu áo nhuộm theo màu áo khách đã chọn ----------
  // Tải hai bản nhẹ gốc ngay lúc khởi động (khoảng 0,4 MB), rồi tải dần các mẫu còn lại (khoảng 0,2 MB mỗi mẫu). Máy bật tiết kiệm dữ liệu, máy cảm ứng đã được ghi nhớ là yếu trong 7 ngày, hoặc tải hỏng: khách giữ dáng hoạt hình.
  // Đang chơi mà máy tụt khung hình (sự kiện quality:low): trả hết về dáng hoạt hình.
  const KH = { state: 'idle', error: null, san: false, n: 0, mau: 0 }; // state: idle | loading | ready | failed | skipped; mau: số mẫu đã tải
  const khTen = Object.keys(NV_MAU).filter((m) => NV_MAU[m].nhe), khT = khTen.map(() => null), khThan = new Map(); // khT: mẫu nhẹ đã tải (null = chưa); khThan: khách → { m, than }
  const KH_GOC = ['thu-sinh', 'thieu-nu']; // hai mẫu phải có trước khi đổi đám đông sang người thật; các mẫu khác tải dần sau, cũng là mẫu thế chỗ khi mẫu được chia chưa tải xong
  // Tỉ lệ chia mẫu theo loại khách: [phật tử, khách du lịch, trẻ em, người lớn tuổi]. Sư (su) không đi dạo: chỉ ngồi tụng kinh / thiền trong chính điện (20-crowd.js, makeSitter).
  const KH_TL = { 'thu-sinh': [20, 9, 14, 8], 'thieu-nu': [20, 11, 28, 8], 'cu-ba': [3, 2, 0, 42], 'cu-ong': [2, 2, 0, 42], 'chang-trai': [8, 24, 40, 0], 'dam-sao': [12, 14, 18, 0], 'ao-dai': [20, 14, 0, 0], 'ke-soc': [6, 13, 0, 0], 'ao-mua': [9, 11, 0, 0] };
  function khChon(kind, tourist) { // kind: 0 người lớn, 1 trẻ em, 2 người lớn tuổi → chỉ số mẫu (trong khTen)
    const c = kind === 1 ? 2 : kind === 2 ? 3 : tourist ? 1 : 0;
    let tong = 0; for (const m of khTen) tong += KH_TL[m] ? KH_TL[m][c] : 0;
    let r = Math.random() * tong;
    for (let i = 0; i < khTen.length; i++) { r -= KH_TL[khTen[i]] ? KH_TL[khTen[i]][c] : 0; if (r < 0) return i; }
    return 0;
  }
  const _kq = new THREE.Quaternion(), _kc = new THREE.Color(), _ky = new THREE.Vector3(0, 1, 0), _kz = new THREE.Vector3(0, 0, 1);
  const _ka = { lx: 0, lz: 0, rx: 0, rz: 0, hip: 0, head: 0, sit: 0 };
  function khXoa() { for (const r of khThan.values()) r.than.huy(); khThan.clear(); KH.n = 0; }
  function khBatDau() {
    if (KH.state !== 'idle') return;
    const conn = navigator.connection, tuoi = Date.now() - ((G.save.data && +G.save.data.lowQ) || 0);
    if ((conn && conn.saveData) || (G.isTouch && tuoi >= 0 && tuoi < 7 * 864e5) || (G.quality && G.quality.low)) { KH.state = 'skipped'; return; } // máy tính từng bị ghi nhớ là yếu vẫn thử lại mỗi lần mở (tụt khung hình thì quality:low trả về dáng hoạt hình); máy cảm ứng yếu thì khỏi tải
    KH.state = 'loading';
    const tai = (i) => taiMau(khTen[i], true).then((T) => { khT[i] = T; KH.mau++; });
    Promise.all(KH_GOC.map((m) => khTen.indexOf(m)).filter((i) => i >= 0).map(tai)).then(async () => {
      if (KH.state !== 'loading') return;
      KH.state = 'ready'; KH.san = true;
      for (let i = 0; i < khTen.length; i++) { // các mẫu còn lại: tải lần lượt; mẫu nào xong thì khách được chia mẫu ấy đổi thân ở khung kế tiếp
        if (khT[i] || !KH.san) continue;
        try { await tai(i); } catch (e) { console.warn('[nhân vật] không tải được mẫu khách "' + khTen[i] + '" — khách được chia mẫu này dùng mẫu khác: ' + ((e && e.message) || e)); }
      }
    }).catch((e) => { if (KH.state !== 'loading') return; KH.state = 'failed'; KH.error = (e && e.message) || String(e); console.warn('[nhân vật] không tải được mô hình cho khách hành hương — giữ dáng hoạt hình: ' + KH.error); });
  }
  G.events.on('quality:low', () => { KH.san = false; if (KH.state !== 'failed') KH.state = 'skipped'; khXoa(); });
  // Vẽ khách p (đối tượng của 20-crowd.js) tại (px, pz). Trả về thân (để 20-crowd.js hỏi vị trí bàn tay, đầu) hoặc null = vẽ dáng hoạt hình.
  // Đọc của p: nvM (mẫu), nvC / nvJ (màu áo, độ lệch sáng), nvMoi (vừa đổi áo), a { la lz ra rz hip head hyaw roll sit }, hunch, kind, scale, phase, walkAmt, yaw, gy, seatTop, vis.
  // Ghi vào p: nvLap (màu khối đùi, tuyến tính) + nvLapMoi, nvY (độ cao bàn chân), nvH (chiều cao người).
  function khVe(p, px, pz) {
    if (!KH.san) return null;
    let mi = p.nvM | 0;
    if (!(mi >= 0 && mi < khTen.length) || !khT[mi]) { mi = khTen.indexOf(KH_GOC[p.slot & 1]); if (mi < 0 || !khT[mi]) return null; } // mẫu được chia chưa tải xong (hoặc hỏng): tạm dùng một mẫu gốc
    let r = khThan.get(p);
    if (!r || r.m !== mi) {
      if (r) r.than.huy();
      r = { m: mi, than: taoThan(khT[mi], { id: 'khach', nhuom: null }, true) };
      scene.add(r.than.hold); khThan.set(p, r); KH.n = khThan.size; p.nvMoi = true;
    }
    const t = r.than, M = t.M, a = p.a;
    if (p.nvMoi) {
      p.nvMoi = false;
      _kc.setHex(p.nvC != null ? p.nvC : 0x86a3c8); const j = p.nvJ || 1;
      const n = M.khongNhuom || p.nvC == null ? null : [_kc.r * j, _kc.g * j, _kc.b * j, 0.9, M.sang || 1.2]; // mẫu ghi khongNhuom giữ nguyên màu áo của mô hình
      t.doiMau(n);
      p.nvLap = NV_TOAN.nhuom([lin(M.dui[0]), lin(M.dui[1]), lin(M.dui[2])], n); p.nvLapMoi = true;
    }
    const H = M.cao * p.scale, sit = a.sit, v = p.vis, k = v >= 1 ? 1 : v * v * (3 - 2 * v);
    _ka.lx = a.la; _ka.lz = a.lz; _ka.rx = a.ra; _ka.rz = a.rz; _ka.hip = a.hip + p.hunch * (M.gu ? 0.25 : 1); _ka.head = a.head; // mẫu cụ bà / cụ ông đã còng lưng sẵn _ka.sit = sit;
    t.tuThe(_ka, p.phase, p.walkAmt);
    if (a.roll) t.bone.nguc.quaternion.multiply(_kq.setFromAxisAngle(_kz, a.roll));   // lắc lư khi tụng
    if (a.hyaw) t.bone.dau.quaternion.premultiply(_kq.setFromAxisAngle(_ky, a.hyaw)); // quay đầu nhìn quanh
    t.bone.dau.scale.setScalar(p.kind === 1 ? 1.2 : 1); // trẻ em: người thu nhỏ theo p.scale, đầu to hơn một chút
    const chan = p.gy + sit * (p.seatTop - M.ngoi * H - p.gy); // ngồi: đáy hông chạm mặt bồ đoàn / ghế
    t.hold.visible = v >= 0.02;
    t.hold.position.set(px, p.gy + (chan - p.gy) * k, pz); t.hold.rotation.y = p.yaw; t.hold.scale.setScalar(H * Math.max(0.001, k));
    t.cat(p.seatTop - 0.004 - (1 - NV_TOAN.ss(0.05, 0.7, sit)) * 0.9, sit < 0.03); // mặt cắt dâng dần tới mặt ngồi trong lúc ngồi xuống
    p.nvY = chan; p.nvH = H;
    return t;
  }
  function khAn(p) { const r = khThan.get(p); if (r) r.than.hold.visible = false; }

  // ---------- giao diện: lưới chọn nhân vật (màn chào + Cài đặt) ----------
  const CHIBI_SVG = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160"><rect width="120" height="160" fill="#3a2417"/><ellipse cx="60" cy="150" rx="34" ry="6" fill="#000" opacity=".3"/><path d="M33 148c-2-34 8-60 27-60s29 26 27 60z" fill="#86a3c8"/><path d="M40 100c6-8 34-8 40 0" stroke="#b8742a" stroke-width="5" fill="none"/><circle cx="60" cy="58" r="33" fill="#f3c9a0"/><path d="M27 54c0-22 15-34 33-34s33 12 33 34c-8-14-20-20-33-20s-25 6-33 20z" fill="#2a1d16"/><circle cx="60" cy="20" r="9" fill="#2a1d16"/><path d="M44 62q5-4 10 0M66 62q5-4 10 0" stroke="#3a2418" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="42" cy="72" rx="6" ry="4" fill="#f09a8a"/><ellipse cx="78" cy="72" rx="6" ry="4" fill="#f09a8a"/><path d="M56 76q4 3 8 0" stroke="#c0604a" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>');
  const luoiDs = [];
  function veLuoi(host) {
    host.textContent = '';
    host.setAttribute('role', 'radiogroup'); host.setAttribute('aria-label', 'Chọn nhân vật');
    const nut = [];
    const ve = () => { for (const [b, d] of nut) { const on = d === cur; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; } };
    for (const d of NV_DS) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'nv-o'; b.setAttribute('role', 'radio');
      const im = document.createElement('img'); im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; im.width = 120; im.height = 160;
      im.src = d.mau ? 'assets/nhan-vat/anh/' + d.id + '.webp' : CHIBI_SVG;
      const t = document.createElement('span'); t.textContent = d.ten;
      b.append(im, t); b.title = d.ten;
      b.onclick = () => { try { G.audio && G.audio.play && G.audio.play('ui'); } catch (e) {} chon(d.id); };
      b.onkeydown = (e) => { // phím mũi tên chuyển ô như nhóm nút chọn
        const i = NV_DS.indexOf(d), j = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? i - 1 : -9;
        if (j === -9) return; e.preventDefault(); e.stopPropagation();
        const k = (j + NV_DS.length) % NV_DS.length; chon(NV_DS[k].id); nut[k][0].focus();
      };
      host.appendChild(b); nut.push([b, d]);
    }
    ve(); luoiDs.push({ host, ve });
    const on = nut.find((x) => x[1] === cur); if (on && on[0].scrollIntoView) setTimeout(() => { try { on[0].scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) {} }, 60);
    return ve;
  }
  G.events.on('nhanvat:chon', () => { for (let i = luoiDs.length - 1; i >= 0; i--) { if (!luoiDs[i].host.isConnected) luoiDs.splice(i, 1); else luoiDs[i].ve(); } });
  const splashHost = document.getElementById('nvLuoi');
  if (splashHost) veLuoi(splashHost);
  const gc = document.getElementById('nvGhiCong'); if (gc) gc.textContent = GHI_CONG_NGAN;
  G.events.on('ui:settings', (box) => {
    const row = U.el('div', 'snd-row nv-cd');
    const host = U.el('div', 'nv-luoi');
    row.append(U.el('div', 'snd-l', 'Nhân vật'), U.el('div', 'small muted', 'Chạm để đổi nhân vật; người chơi khác cũng thấy nhân vật bạn chọn.'), host, U.el('div', 'small muted nv-gc', GHI_CONG));
    box.appendChild(row); veLuoi(host);
  });

  G.nhanVat = {
    ds: NV_DS, mau: NV_MAU, trangThai: S, ghiCong: GHI_CONG, chon, veXa, bo,
    get id() { return cur.id; }, get than() { return than; },
    get caoThem() { return than ? than.M.cao - CHIBI_CAO : 0; }, // nhân vật của mình cao hơn dáng chibi bao nhiêu mét (bong bóng lời)
    hopLe: (id) => typeof id === 'string' && byId.has(id),
    // khách hành hương AI vẽ bằng mô hình: 20-crowd.js gọi khach.ve(p, px, pz) mỗi khung, khach.an(p) khi khách rời chùa
    khach: { trangThai: KH, ve: khVe, an: khAn, xoa: khXoa, chon: khChon, ten: khTen, su: khTen.indexOf('su'), get san() { return KH.san; } },
  };
  khBatDau();
  chon(cur.id, false); // tải sẵn nhân vật đã chọn lần trước (hoặc nhân vật đầu danh sách) ngay khi còn ở màn chào
}
