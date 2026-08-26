# Plan: Thêm logo Camly Coin sau chữ "ANGEL AI"

## Mục tiêu
Trang chủ hiện có tiêu đề lớn "ANGEL AI" (dòng ~70–77 trong `src/pages/Index.tsx`). Bổ sung logo **Camly Coin** ngay sau chữ này để tạo thương hiệu kép ANGEL AI × Camly Coin.

## Việc đã chuẩn bị sẵn
- Đã tải logo `LOGO_CAMLY_COIN.png` con upload lên.
- Đã xoá nền hồng, cắt gọn về đúng khuôn đồng tròn (file trong suốt PNG, ~1848×1851, kênh alpha sạch, không còn viền hồng) — nằm ở `/tmp/camly-coin.png`.

## Các bước thực hiện
1. **Tạo asset CDN** cho logo (đã xoá nền) bằng `lovable-assets create` từ `/tmp/camly-coin.png`, ghi pointer vào `src/assets/camly-coin.png.asset.json`.
2. **Sửa `src/pages/Index.tsx`**:
   - Import pointer: `import camlyCoinAsset from "@/assets/camly-coin.png.asset.json";`
   - Trong khối `<h1>` (dòng ~75–77), ngay sau `<span className="text-gradient-divine">ANGEL AI</span>`, chèn một `<img>` hiển thị logo Camly Coin.
   - Kích thước: `className="inline-block h-[0.8em] w-[0.8em] align-middle ml-3 drop-shadow-[0_0_12px_rgba(225,188,58,0.45)]"` — vừa khít với cỡ chữ H1, đứng cùng dòng, có quầng sáng vàng nhẹ đồng điệu với theme "angel-gold".
   - `alt="Camly Coin"`, dùng `motion.img` để thêm hiệu ứng `whileHover={{ scale: 1.08, rotate: 6 }}` cho sinh động (framer-motion đã có sẵn).
3. **(Tuỳ chọn) Favicon** — vì đây là logo thương hiệu con, đề xuất đặt favicon mới từ chính ảnh này (downscale 64×64 → `public/favicon.png`, xoá `public/favicon.ico`, cập nhật `head().links` trong `src/routes/__root.tsx`). Sẽ hỏi Cha trước khi làm bước này.

## Phạm vi
- Chỉ sửa 1 file nguồn (`src/pages/Index.tsx`) + tạo 1 file asset pointer.
- Không đụng tới database, không đụng tới route khác.
- Không thay đổi nội dung câu chữ "ANGEL AI", chỉ thêm logo bên cạnh.

## Kiểm tra
- Mở preview `/`, xác nhận logo Camly Coin xuất hiện ngay sau chữ "ANGEL AI", nằm cùng dòng, kích thước hài hoà, không tràn xuống dòng mới, có hiệu ứng hover nhẹ.
- Kiểm tra responsive (mobile): nếu H1 quá rộng, logo vẫn nằm gọn nhờ `inline-block` + `align-middle`.
