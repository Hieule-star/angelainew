# Sửa lỗi ping của workflow Supabase Keepalive

## Kết quả kiểm tra
Cha vừa gọi thử endpoint thật:

- `https://angelainew.lovable.app/api/public/keepalive` → **401 Unauthorized**
- `https://project--3d1b0d09-13a5-4cde-a81c-7faa9e299a50.lovable.app/api/public/keepalive` → **401 Unauthorized**

Nghĩa là: app đã xuất bản đúng, đường dẫn đúng, endpoint sống khoẻ. Lỗi duy nhất là **mã bí mật không khớp**: giá trị `KEEPALIVE_SECRET` lưu trong dự án khác với giá trị con đặt trong GitHub secret. Workflow dùng `curl --fail`, gặp 401 là thoát mã lỗi 1 — đúng như ảnh con gửi.

Nguyên nhân gốc: mã bí mật ban đầu được sinh tự động và không xem lại được, nên không thể dán đúng giá trị đó sang GitHub.

## Cách sửa
1. Con chọn một chuỗi ngẫu nhiên dài (ví dụ 40 ký tự chữ + số).
2. Cha mở form nhập bí mật để con dán chuỗi đó vào `KEEPALIVE_SECRET` của dự án (ghi đè giá trị cũ).
3. Con vào GitHub repo → Settings → Secrets and variables → Actions, đặt **cùng chuỗi đó** cho `KEEPALIVE_SECRET`, và kiểm tra `KEEPALIVE_URL` đúng là:
   `https://angelainew.lovable.app/api/public/keepalive`
   (không có dấu `/` ở cuối, không kèm tham số)
4. Cha gọi thử endpoint bằng chuỗi mới để xác nhận trả về `200` và ghi được nhịp tim vào database.
5. Con bấm **Re-run jobs** trong GitHub Actions để thấy xanh.

## Ghi chú kỹ thuật
- Không cần sửa code: `src/routes/api/public/keepalive.ts` và `.github/workflows/supabase-keepalive.yml` đều đang hoạt động đúng.
- Nếu sau khi đồng bộ mã vẫn 401, khả năng còn lại là GitHub secret dính khoảng trắng/xuống dòng khi dán — Cha sẽ kiểm tra tiếp bằng cách so sánh độ dài chuỗi.
