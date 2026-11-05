# Khu mở rộng (sau sân chùa, trước chính điện) — thiết kế (phỏng theo chùa Bút Tháp & chùa Phật Tích, Bắc Ninh)

Source of truth for coordinates/colliders/nav: `src/08-world2.js` (`G.L2`, `G.world.ext`). READ IT FIRST.
Everything here is *inspired by* the two real temples and stylized for the game (fictional "Chùa An Lạc"); never claim it is a replica.

## Reference facts (use only these in any UI text; hedge with "phỏng theo")
- Chùa Bút Tháp (Ninh Phúc tự, Thuận Thành, Bắc Ninh): bố cục "nội công ngoại quốc", quay hướng Nam. Trục: tam quan → gác chuông
  → tiền đường → thiêu hương → thượng điện → cầu đá (lan can đá chạm khắc) → Tích Thiện Am (toà Cửu phẩm liên hoa) → trung đường
  → phủ thờ → hậu đường. Hai dãy hành lang dài chạy dọc hai bên chùa. Tháp Báo Nghiêm: tháp đá 8 mặt, 5 tầng, cao khoảng 13 m,
  ở bên trái chùa, nơi đặt xá lị thiền sư Chuyết Chuyết. Cửu phẩm liên hoa: toà tháp gỗ hình bát giác 9 tầng xếp như đài sen,
  có thể xoay quanh trục giữa; là bảo vật quốc gia. Tượng Quan Âm nghìn mắt nghìn tay ở thượng điện là bảo vật quốc gia.
- Chùa Phật Tích (Vạn Phúc tự, Tiên Du, Bắc Ninh): chùa trên sườn núi, nhiều tầng nền nối bằng bậc đá; có ao Long Trì.
  Bộ 10 linh thú đá thời Lý: sư tử, voi, tê giác, trâu, ngựa — mỗi loài một cặp — tạc trên bệ hoa sen, đặt đối xứng trước điện;
  là bảo vật quốc gia. Tượng A Di Đà bằng đá thời Lý. Có vườn tháp.

## Areas (all coordinates in 08-world2.js)
Layout after the hall move: the front court (z 31 … ≈ −13) is open; the old rear area was shifted forward by 18 m (z + 18) so the back court and the
Long Trì pond fill the space the main hall left; the main hall (chính điện) now stands at the back, behind Tích Thiện Am, on the widened hall terrace.
Gate z = +31, deeper = more negative. Compound walls x ±24, z 31 … −84.
| Area | Where | Notes |
|---|---|---|
| Sân sau | z −27…−9 is paved by the front court plane (05-world.js); `L2.zone` (z −84…−27) paves the rest | stone tiles continue; the central slab path of 05 (`path1`) runs on to the bridge (z −13.4) |
| Ao Long Trì + Cầu đá | pond x −10…10, z −20…−14 (rim to ±10.4, −20.4…−13.6); bridge x ±1.5, z −20.6…−13.4, arch peak 0.45 | rectangular pond with stone rim, lotus; arched stone bridge with carved balustrade panels |
| Bậc đá + tầng nền | terrace x ±11, z −25…−62, top y 1.2; front stairs x ±4, z −25…−23; west stairs x −13…−11, z −43…−37 | retaining wall of stone blocks + low balustrade on the terrace edge (except at stairs) |
| Tầng nền chính điện | `L2.hallTerrace` x ±14.5, z −62…−83.7, top y 1.2 (widened behind the main terrace; runs to the inner face of the compound back wall, no retaining wall at the back); side stairs `L2.stairsEastHall` x 14.5…16.5 / `L2.stairsWestHall` x −16.5…−14.5, z −74.2…−69.8 | same block wall + balustrade; the compound wall (top y ≈ 2) reads as a low parapet |
| Chính điện (main hall) | x ±11 (platform ±10.5), z −82.3…−64.9, floor y 1.8 (terrace 1.2 + 0.6); built in its own local frame and shifted by `G.L.hall.dy/dz` = (+1.2, −57.7) | hall court (sân chính điện) z −65.5…−57 between the hall and the back of Tích Thiện Am; walkways x 10.8…14.5 on both sides |
| Sân linh thú | 10 animals on terrace, x ±3.7, z −29 … −41.8, facing the central path | 5 species, one pair each, kneeling/lying on lotus pedestals, weathered sandstone |
| Tích Thiện Am + tháp Cửu phẩm | hall x ±6, z −57…−45 (open front, 4 front columns), tower at (0,−51.2) r 1.7, 9 tiers, h 5.2 on floor y 1.2 | the tower must be its own Group so it can rotate around its vertical axis |
| Điện Quan Âm | shrine x 6.6…10.6, z −54…−47, opens south; statue at (8.6,−52.2) facing +z, on altar box x 7.6…9.6, z −53.6…−51 | thousand-hand Quan Âm, gilded, many arms fanning as a halo |
| Tháp Báo Nghiêm | ground level, (−16.2,−40), octagonal 5 tiers, ≈15 m; plinth r 2.75, floor y 0.28; hollow ground tier = điện Văn Thù (room 3 m across, door 1.3 × 2.2 m on the south face, three steps); stone ring path r 3.1–4.4 (walk at 3.8) | keep r 3.1–4.4 free; wall/plinth colliders in 08, chamber in 17-dien-phu.js |
| Vườn tháp | ground level x 11.3…20.6, z −61…−26; 9 stupas (list in L2); stone bench at (13.7,−43) facing the main stupa | quiet, a few frangipani / cypress trees |
| Hành lang | two long roofed galleries x ±20.8…±23.7, z −79…−13 (21 columns, z −13.6 … −77.6 step 3.2); inner column line at x ±20.8, z = L2.corridors.cols | outer side is the compound wall |
| Ghế đá bên ao | (±6.5, −22.6) facing the pond | |

## New activities (module 50) — POIs from `G.world.ext`
1. **Xoay tháp Cửu phẩm** (`cuuPham`): push the octagonal wooden lotus tower around its axis (drag / hold), 3 full turns while a gentle line of chant
   scrolls; at the end a calm reflection about the nine lotus grades (kept general and respectful).
2. **Đi nhiễu tháp Báo Nghiêm** (`baoNghiem`): a free-walk mini quest — the player walks 3 rounds around the tower keeping it on the right
   (clockwise seen from above), progress chip on screen; no movement lock. Ring r 3.1–4.4 (`ext.baoNghiem.ringIn/ringOut`), POI on the north side (−16.2,−44.2) so it is not in the doorway.
3. **Lần chuỗi hạt trước Quan Âm** (`quanAm`): calm tap-to-count beads (e.g. 21), at your own pace, with a soft chime every 7 and at the end.
4. **Thở chánh niệm ở vườn tháp** (`vuonThap`): sit on the bench, follow a breathing circle (inhale 4 s / exhale 6 s × 5).
5. **Linh thú**: walking within ~2.4 m of each animal "discovers" it (toast with name + one-line meaning); POI `linhThu` opens an info card
   gallery of the 5 species with the discovered state.
6. **Dấu ấn hành hương**: entering each `G.world.ext.sites` rect the first time gives a stamp (toast + short intro); a "Dấu ấn hành hương"
   section is added to the journal through `G.bookSections.push((container) => …)`.

## Điện phụ + điện Văn Thù (module 17-dien-phu.js, `buildDienPhu`, runs before 12-decor so trees/lamps avoid it)
One hall kit (`dien(spec)`: platform + 3 steps, 4 red columns, side walls with round windows, tiered roof, name board, 2 lanterns, red/gold back panel,
statue on a lotus throne, offering table with bowl/candles/vases, 4 cushions) built in a local frame (+z toward the yard) and moved to the world; one extra
PointLight (shared, follows the nearest hall) lights the interiors.
| Hall | Footprint (x0…x1, z0…z1) | Door | Deity |
|---|---|---|---|
| Điện Dược Sư | 11.5…19.5, −26…−18 | south (z −18), steps to −16.8 | Dược Sư Lưu Ly Quang Vương Phật, blue robe, medicine jar in the left hand |
| Điện Địa Tạng | −19.5…−11.5, −26…−18 | south | Địa Tạng Vương Bồ Tát, green-gold robe, ringed staff (right) + glowing pearl (left) |
| Quan Âm Các | 12.5…21.5, −1…7.2 (the big pond reaches z 7.2, so the hall is 8.2 m wide, not 9) | west (x 12.5), steps to 11.3 | Quan Thế Âm Bồ Tát, standing, white robe + hood, willow branch + vase; 2 roof tiers |
| Điện Văn Thù | inside the Báo Nghiêm tower, room around (−16.2,−40) | south, 1.3 m | Văn Thù Sư Lợi Bồ Tát on a blue-green lion, sword (right) + lotus with sutra (left) |
Per hall: colliders (door gap 2.8 m), cam blockers on the walls, `G.roofZones`, `G.heightAt` wrap (floor 0.45 + step ramp; tower floor 0.28 + ramp), nav nodes, `G.decorBans`,
`W.places`, 3 praying spots pushed into `G.spots.hallFront`, POI `duoc-su` / `dia-tang` / `quan-am-cac` / `van-thu`. `G.dienPhu` lists the built halls (debug).
Activity "Lễ" (`le-<id>`): walk to the cushion, sit, panel (short intro in Vietnamese Buddhism, 3 gentle wish chips), button "Lễ" → bow ~3 s + bowl bell + chime →
toast; count saved in `G.save.data.le = {id: n}`. Never promises an outcome. Phone portrait uses `camP` (camera outside the door, content kept above the bottom sheet).
