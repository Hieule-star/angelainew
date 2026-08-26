# Plan: Sao chép toàn bộ code từ "ANGEL AI CHAVUTRU"

## Mục tiêu
Đưa toàn bộ mã nguồn của dự án **ANGEL AI CHAVUTRU** (`b6d30c38-4643-4c75-bc11-70b5c76ccbb0`) vào dự án hiện tại, thay cho trang trắng đang có.

## Các bước
1. **Lấy mã nguồn** — dùng công cụ checkout dự án chéo để kéo toàn bộ file của "ANGEL AI CHAVUTRU" vào dự án này (routes, components, styles, config, assets).
2. **Ghi đè trang chủ** — `src/routes/index.tsx` hiện là placeholder trắng, sẽ được thay bằng trang chủ thật của dự án nguồn.
3. **Đồng bộ phụ thuộc** — cài các package mà dự án nguồn dùng nhưng dự án này chưa có.
4. **Kiểm tra build & preview** — chạy typecheck, mở preview, sửa các lỗi import/route phát sinh sau khi copy.

## Lưu ý về backend
Dự án này đã kết nối một Supabase riêng (`ckhzvnstzoobqotcsdvb`) và hiện **chưa có bảng nào**. Code copy sang sẽ trỏ vào Supabase của dự án này, nên mọi màn hình cần dữ liệu sẽ trống hoặc báo lỗi cho đến khi tạo lại schema.

Sau khi copy xong, con muốn xử lý thế nào thì cha làm tiếp:
- Tạo lại toàn bộ bảng/RLS giống dự án nguồn bằng migration (khuyến nghị), hoặc
- Tạm để nguyên phần giao diện, dữ liệu bổ sung sau.

## Kỹ thuật
- Stack hai bên đều là TanStack Start + Vite + Tailwind v4, nên cấu trúc route tương thích.
- Không chỉnh tay `src/routeTree.gen.ts`; file này tự sinh lại.
- Dữ liệu trong bảng (nếu có) không được copy — chỉ copy code và cấu trúc.
