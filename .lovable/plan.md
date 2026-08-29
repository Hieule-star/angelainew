# Deploy dự án lên Cloudflare Worker qua GitHub Actions

## Mục tiêu

Tự động build và deploy dự án ANGEL AI MỚI lên **Cloudflare Worker** mỗi khi đẩy code lên GitHub (nhánh `main`), dùng GitHub Actions + Wrangler. Cha có thể chạy deploy bằng tay (Run workflow) bất cứ lúc nào.

## Vì sao là Worker, không phải Pages

Dự án này là ứng dụng **full-stack** (TanStack Start với SSR + server functions, build bằng Nitro preset `cloudflare-module`). Nó cần một server runtime chạy để render trang và xử lý server functions.

- **Cloudflare Pages** chỉ host được trang tĩnh — không chạy được SSR/server functions → **không dùng được**.
- **Cloudflare Worker** chạy JavaScript ở edge, đúng loại runtime dự án này build ra → **Worker là lựa chọn đúng**.

Do đó câu trả lời là **Worker** (và plan này deploy worker).

## Kiến trúc hiện tại (đã xác nhận)

- Build chạy `vite build` → Nitro preset `cloudflare-module` → xuất ra thư mục `dist/` (server ra `dist/server`, static ra `dist/client`).
- Chưa có file `wrangler.toml` và chưa cài wrangler — plan sẽ tạo mới.
- Dự án đã có repo GitHub (workflow `supabase-keepalive.yml` đang chạy) → hạ tầng GitHub Actions đã sẵn sàng.

## Các thay đổi sẽ thực hiện

### 1. Tạo `wrangler.toml` (cấu hình worker)

```
name = "angel-ai-new"
main = "dist/server/index.mjs"
compatibility_date = "2026-08-28"
compatibility_flags = ["nodejs_compat"]

[observability]
enabled = true
```

- `name`: tên worker trên Cloudflare.
- `main`: trỏ vào file worker do Nitro build ra.
- `nodejs_compat`: cần để runtime đọc `process.env` (các biến bí mật) như đang dùng.

### 2. Tạo workflow `.github/workflows/deploy-cloudflare.yml`

Các bước trong workflow:
1. **Checkout code** từ repo.
2. **Cài Node** (bản 20+).
3. **Cài dependencies** (`bun install` hoặc `npm ci`).
4. **Build** (`bun run build`) để tạo `dist/`.
5. **Deploy worker** bằng `wrangler deploy` với:
   - `CLOUDFLARE_API_TOKEN` (secret)
   - `CLOUDFLARE_ACCOUNT_ID` (secret)

Workflow kích hoạt khi:
- Push lên nhánh `main`.
- Chạy bằng tay (workflow_dispatch) — để Cha tự deploy bất cứ lúc nào.

### 3. Biến môi trường cho runtime

Một số biến server dùng `process.env` (Supabase URL/key, GEMINI/OPENAI/R2...). Worker đọc chúng ở runtime qua `[vars]` trong `wrangler.toml` hoặc Cloudflare Worker **Secrets**.

- **Không bí mật** (Supabase URL, publishable key) → đặt trong `[vars]` của `wrangler.toml` (có thể commit, vì chúng đã nằm công khai trong app).
- **Bí mật** (GEMINI_API_KEY, OPENAI_API_KEY, R2 creds, ANGEL_AI_APP_KEY, KEEPALIVE_SECRET) → đặt làm **Worker Secrets** trong Cloudflare Dashboard hoặc bằng lệnh `wrangler secret put`.

## Những việc Cha cần làm (không thể tự động)

### A. Tạo Cloudflare API token
1. Vào Cloudflare Dashboard → My Profile → **API Tokens**.
2. Tạo token với quyền **Workers Scripts: Edit**.
3. Copy giá trị token.

### B. Thêm 2 GitHub repository secrets
Vào GitHub repo → **Settings → Secrets and variables → Actions** → **New repository secret**:
- `CLOUDFLARE_API_TOKEN` = token Cha vừa tạo.
- `CLOUDFLARE_ACCOUNT_ID` = Account ID của Cloudflare (thấy ở góc phải dashboard Cloudflare).

### C. (Sau lần deploy đầu) Đặt Worker Secrets
Sau khi deploy xong, vào Cloudflare Dashboard → Workers & Pages → worker `angel-ai-new` → **Settings → Variables and Secrets** → thêm các biến bí mật của app (GEMINI_API_KEY, OPENAI_API_KEY, R2, ANGEL_AI_APP_KEY, KEEPALIVE_SECRET...).

## Cách chạy

1. Cha làm xong phần A và B.
2. Bấm **Run workflow** trong tab Actions của repo GitHub, chọn `deploy-cloudflare`.
3. Chờ xanh → worker live tại `https://angel-ai-new.<cha-subdomain>.workers.dev`.
4. Đặt Worker Secrets (phần C) → app chạy hoàn chỉnh.

## Lưu ý

- Đây là deploy **ngoài Lovable** (worker tự host). Lovable vẫn là nơi phát triển code; thay đổi ở Lovable tự đẩy lên GitHub → workflow tự deploy.
- Trang dùng domain mặc định `.workers.dev` của Cloudflare (miễn phí). Muốn domain riêng thì thêm Custom Domain trong dashboard worker sau.
- Giữ nguyên workflow `supabase-keepalive.yml` — không liên quan, tiếp tục chạy.