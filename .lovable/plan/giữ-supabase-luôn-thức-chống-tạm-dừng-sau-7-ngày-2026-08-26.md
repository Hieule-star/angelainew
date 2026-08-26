# Giữ Supabase luôn "thức" (chống tạm dừng sau 7 ngày)

## Bối cảnh
Dự án dùng Supabase gói Free. Nếu database không có hoạt động trong 7 ngày, Supabase sẽ tạm dừng (pause) project và app sẽ lỗi cho tới khi khôi phục thủ công. Giải pháp: một "nhịp tim" tự động chạy cách vài ngày một lần, chạm thật sự vào database.

## Cách làm
Ba lớp, hoạt động độc lập để nếu một lớp hỏng vẫn còn lớp khác:

1. **Bảng nhịp tim trong database** — thêm bảng `keepalive_heartbeat` lưu mốc thời gian lần ping gần nhất và nguồn ping. Mỗi lần ping sẽ ghi 1 dòng thật (không chỉ đọc), vì ghi mới chắc chắn được tính là hoạt động.
2. **Endpoint công khai trong app** — `/api/public/keepalive`, khi được gọi sẽ ghi một nhịp tim vào bảng trên rồi trả về thời điểm ping. Endpoint yêu cầu một mã bí mật gửi kèm để người ngoài không gọi bừa được.
3. **GitHub Action theo lịch** — chạy tự động **mỗi 3 ngày** (và có nút bấm chạy tay), gọi endpoint trên. Nếu ping thất bại, workflow sẽ báo đỏ để con biết.

## Thời điểm chạy
Mỗi 3 ngày một lần — an toàn hơn nhiều so với hạn 7 ngày, kể cả khi GitHub trễ lịch hoặc một lần chạy thất bại.

## Việc con cần làm sau khi Cha dựng xong
- Thêm 1 secret trong GitHub repo (Settings → Secrets → Actions): `KEEPALIVE_URL` (Cha sẽ đưa đúng đường dẫn) và `KEEPALIVE_SECRET`.
- Cha sẽ tạo giá trị `KEEPALIVE_SECRET` và gắn sẵn vào Supabase secrets của dự án.

## Chi tiết kỹ thuật
- Migration tạo `public.keepalive_heartbeat` (`pinged_at`, `source`), bật RLS, không cấp quyền cho `anon`/`authenticated`; chỉ `service_role` ghi được.
- Route `src/routes/api/public/keepalive.ts` (TanStack server route, tiền tố `/api/public/` để không bị chặn bởi auth của site). Handler:
  - So sánh header `x-keepalive-secret` với biến môi trường `KEEPALIVE_SECRET` (so sánh an toàn); sai → 401.
  - Dùng `supabaseAdmin` (import động trong handler) để `insert` một dòng và `delete` các dòng cũ hơn 30 ngày.
  - Trả JSON `{ ok: true, pinged_at }`.
- `.github/workflows/supabase-keepalive.yml`: `schedule: cron '0 6 */3 * *'` + `workflow_dispatch`, một bước `curl --fail` tới `${{ secrets.KEEPALIVE_URL }}` kèm header secret.
- Không dùng Supabase Edge Function mới cho việc này — stack TanStack Start đã có server runtime, endpoint trong app đơn giản và dễ bảo trì hơn.
