# Bộ prompt dựng mô hình 3D cho ban thờ chính điện

Mục tiêu: bạn dùng dịch vụ AI dựng mô hình (bên thứ ba) tạo ra các file **GLB** và **ảnh texture**, chép vào thư mục
`D:\dichua\assets\mo-hinh\`, tôi viết phần nạp mô hình và dựng ánh sáng / hậu kỳ cho khớp ảnh mẫu.
Nếu thiếu file nào, trò chơi tự quay về bản tượng thủ tục hiện có (không hỏng).

## 1. Chọn dịch vụ

| Việc | Dịch vụ nên dùng | Ghi chú |
|---|---|---|
| Tượng (ảnh → 3D) | **Tripo** (tripo3d.ai) hoặc **Meshy** (meshy.ai) | nhanh, xuất GLB có texture PBR, có remesh giảm số tam giác |
| Tượng độ chi tiết cao | **Hyper3D Rodin** (hyper3d.ai) | mặt và nếp áo đẹp hơn, chậm và tốn hơn |
| Miễn phí, tự chạy | **Hunyuan3D 2.x** hoặc **TRELLIS** (bản demo trên Hugging Face) | chất lượng tốt, cần kiên nhẫn chờ hàng đợi |
| Ảnh concept + texture 2D | Midjourney / Ideogram / Flux / ChatGPT Images | dùng cho tranh phông mạn-đà-la, ô đá kem, và ảnh đầu vào cho bước ảnh → 3D |

Cách làm hiệu quả nhất: **tạo ảnh concept trước** (nền trơn, nhìn chính diện hơi chếch, ánh sáng đều), rồi đưa ảnh đó vào
Tripo / Meshy / Rodin ở chế độ *Image to 3D*. Kết quả ổn định hơn nhiều so với chỉ gõ chữ vào text-to-3D.

Lưu ý bản quyền: không đưa ảnh chụp màn hình của trò chơi khác vào công cụ. Dùng prompt chữ bên dưới hoặc ảnh tượng
thật ở chùa do bạn chụp.

## 2. Yêu cầu kỹ thuật chung (dán vào phần mô tả / cài đặt xuất file)

- Định dạng: **GLB (glTF 2.0 binary)**, texture nhúng trong file, **không nén Draco**, mỗi file ≤ 12 MB.
- Texture PBR: Base Color (sRGB) + Metallic/Roughness + Normal, **2048 × 2048**. Vàng: metallic 1.0, roughness 0.35–0.45.
- Số tam giác: tượng Phật giữa ≤ 60 000; hai tượng bên ≤ 35 000 mỗi tượng; đồ vật ≤ 20 000.
- Hướng: **trục Y lên**, mặt trước nhìn về **+Z**, gốc toạ độ ở **tâm đáy** (đáy toà sen chạm y = 0).
- Tỷ lệ: đơn vị mét, chiều cao toàn tượng kể cả toà sen = **1,0** (tôi tự phóng to trong trò chơi).
- Một khối liền (watertight), không có mảnh rời bay lơ lửng, không animation, không rig.
- Nền tượng phải có đáy phẳng để đặt lên bệ đá.

## 3. Prompt cho từng mô hình (tiếng Anh, dán nguyên)

### 3.1 Đức Phật Thích Ca Mâu Ni (tượng giữa) — file `phat-thich-ca.glb`

Ảnh concept (text-to-image):
```
Seated Shakyamuni Buddha statue in dhyana mudra (hands resting in lap, palms up, holding a small alms bowl),
polished gold with soft satin reflections, serene face with half-closed eyes and gentle smile, ushnisha with
small spiral hair curls, long earlobes, robe draped over the left shoulder with clean flowing folds across the
lap, sitting on a three-tier lotus throne with thin slightly curled petals. Stylized high-quality 3D game asset
in the manner of a modern Vietnamese Buddhist temple statue, smooth clean surfaces, symmetrical, front view
slightly from above, centered, plain light grey background, even studio lighting, no shadows on the background,
no text, no halo, no backdrop.
```
Negative: `low poly, cartoon, anime, extra arms, broken fingers, text, watermark, dark background, cropped`

Image-to-3D (ghi vào ô mô tả nếu có): `single gold statue on lotus base, closed watertight mesh, PBR metal gold,
smooth surfaces, keep symmetry, flat bottom`.

### 3.2 Bồ Tát Quán Thế Âm (bên trái) — file `quan-am.glb`

```
Seated Avalokiteshvara (Quan Am) Bodhisattva statue in white glossy porcelain, gentle serene female face,
eyes lowered, long flowing veil draped from the crown over the shoulders with soft pleats, hands in front of
the chest holding a small willow vase (purification vase), simple robe with smooth folds, sitting on a small
lotus base. Stylized high-quality 3D game asset, Vietnamese temple style, clean smooth surfaces, symmetrical,
front view slightly from above, centered, plain light grey background, even studio lighting, no text.
```
Negative: `gold, dark, cracks, extra hands, text, watermark, background objects`

Image-to-3D: `white porcelain glossy material, roughness 0.3, closed mesh, flat bottom`.

### 3.3 Bồ Tát Địa Tạng (bên phải) — file `dia-tang.glb`

```
Seated Ksitigarbha (Dia Tang) Bodhisattva statue in polished gold, shaved monk head with a five-leaf jeweled
crown (vairocana crown), calm face, right hand holding a tall ringed monk staff (khakkhara) with six small
rings at the top, left hand holding a luminous pearl, monk robe with clean folds, sitting on a lotus base,
with a pointed flame-shaped mandorla behind the back. Stylized high-quality 3D game asset, Vietnamese temple
style, smooth clean surfaces, front view slightly from above, centered, plain light grey background, even
studio lighting, no text.
```
Negative: `hair, hat with brim, broken staff, extra arms, text, watermark`

Image-to-3D: `gold PBR metal, the staff and mandorla attached to the body as one mesh, flat bottom`.

### 3.4 Đèn tròn treo có tua (tuỳ chọn, 2 cái) — file `den-tua.glb`

```
Hanging ceremonial drum lamp from a Vietnamese Buddhist temple: wide flat circular gold-rimmed canopy
(diameter 1.0), deep red interior, many long red cord tassels with small gold beads hanging all around the
rim, a short gold chain on top. Stylized clean 3D game asset, front view, centered, plain grey background.
```
Yêu cầu: gốc toạ độ ở **đỉnh dây treo**, trục Y lên, đường kính 1,0.

### 3.5 Khung vòm vàng (tuỳ chọn) — file `vom-vang.glb`

```
Ornamental golden arch frame standing behind a Buddha statue: slender gold tube arch with a pointed flame
finial at the top, cloud-scroll (ruyi) curls at both shoulders, small gold beads along the arch, two lotus
bud finials on the sides, open in the middle (nothing inside the arch). Stylized clean 3D game asset,
front view, centered, plain grey background.
```
Yêu cầu: mặt phẳng của vòm nằm trong mặt phẳng XY, gốc ở tâm đáy, chiều cao 1,0, chiều rộng ≈ 0,75.

## 4. Ảnh 2D (texture)

### 4.1 Tranh phông mạn-đà-la — file `phong-man-da-la.png`, **2048 × 1536** (tỷ lệ 4:3)

```
Painted temple backdrop, deep crimson red lacquer background, a large golden lotus mandala in the center
with three rings of broad filled petals outlined in dark red and highlighted with gold leaf, a warm orange
glow at the upper center behind where a Buddha head would be, two golden phoenix-and-cloud ribbons flowing
down the left and right sides, gold corner rosettes, framed by a black lacquer border with a double thin gold
line. Flat frontal view, symmetrical, no statue, no figures, no text, rich painterly shading, sharp details.
```
Negative: `statue, person, text, watermark, perspective, 3D render, blur`

### 4.2 Ô đá kem (mặt bệ) — file `da-kem.png`, **1024 × 512**, lặp được (seamless)

```
Seamless tileable texture of polished cream marble stone, warm beige (#D2B47E) with faint lighter and darker
veins, low contrast, soft satin finish, top-down flat lighting, no cracks, no text.
```
Chọn chế độ **tile / seamless** nếu công cụ có.

## 5. Chép file vào đâu

```
D:\dichua\assets\mo-hinh\phat-thich-ca.glb
D:\dichua\assets\mo-hinh\quan-am.glb
D:\dichua\assets\mo-hinh\dia-tang.glb
D:\dichua\assets\mo-hinh\den-tua.glb        (tuỳ chọn)
D:\dichua\assets\mo-hinh\vom-vang.glb       (tuỳ chọn)
D:\dichua\assets\mo-hinh\phong-man-da-la.png
D:\dichua\assets\mo-hinh\da-kem.png         (tuỳ chọn)
```

Sau khi chép, báo cho tôi. Tôi sẽ: nạp GLB bằng GLTFLoader (cùng CDN Three.js), đặt đúng vị trí / tỷ lệ / vật liệu
vàng và sứ theo ánh sáng và hậu kỳ của điện, dựng bóng đổ, và giữ bản thủ tục làm dự phòng khi không có file.

Một điều cần biết trước: dùng mô hình ngoài thì trò chơi không còn là **một file index.html** duy nhất; khi đưa lên
mạng phải chép kèm thư mục `assets/`. Mọi thứ khác (không đăng nhập, không quảng cáo, không thu thập dữ liệu) giữ nguyên.

**Trạng thái:** bộ prompt này là **tuỳ chọn, chưa triển khai**. Trò chơi hiện vẫn theo quy tắc "không tệp ngoài" (chỉ Three.js
từ CDN) và chưa có phần nạp GLB. Nếu bạn quyết định dùng mô hình ngoài, quy tắc đó sẽ được sửa trong `src/API.md` trước, rồi
mới viết phần nạp; trước lúc đó, ban thờ dựng bằng hình học thủ tục (v6) là bản chính thức.
