# Plan: Thay logo ANGEL AI bằng logo mới (vàng, chi tiết, có chữ "ANGEL AI")

## Mục tiêu
Thay logo ANGEL AI hiện tại (icon thiên thần màu hồng, file `src/assets/angel-logo.png`) bằng logo mới con gửi đính kèm (`image-5.png`): hình tròn viền vàng, vẽ thiên thần nữ tóc trắng có cánh ôm trái tim phát sáng, có chữ "ANGEL AI" ở giữa, nền trường vàng lung linh.

## Hiện trạng (đã đọc code)
- Logo hiện tại là file tĩnh `src/assets/angel-logo.png` (~9.5KB), được import trực tiếp bởi **~20 vị trí** trong app:
  - `src/pages/Index.tsx`, `Login.tsx`, `Onboarding.tsx`, `Chat.tsx`, `CTOChat.tsx`, `Install.tsx`, `LightConstitution.tsx`
  - `src/components/layout/Navbar.tsx`, `chat/ChatSidebar.tsx`, `chat/ChatBubble.tsx`, `chat/ImageGenerator.tsx`, `cto/CTOSidebar.tsx`
- Tất cả đều dùng `import angelLogo from '@/assets/angel-logo.png'` rồi `src={angelLogo}` → **chỉ cần thay file này là toàn bộ app tự đổi**, không phải sửa 20 file import.
- Favicon hiện là `public/favicon.ico` (mặc định Lovable), `__root.tsx` trỏ tới `/favicon.ico`.

## File logo mới
- `image-5.png`: 1280×1280, PNG RGB, **1.8MB**, không có kênh alpha (nền ngoài vòng tròn là màu đặc, không trong suốt).
- Vì hiển thị lớn nhất chỉ ~160px (`w-40 h-40`), sẽ **downscale xuống 512×512** để giữ repo nhẹ (~từ 1.8MB → ~200KB) mà không mất chất lượng nhìn thấy.
- Logo mới có **chữ "ANGEL AI" nằm sẵn trong ảnh**. Lưu ý: ở hero trang chủ (`Index.tsx`), phía dưới logo là thẻ `<h1>ANGEL AI</h1>` → chữ "ANGEL AI" sẽ xuất hiện 2 lần (1 trong logo + 1 ở H1). Đây là đặc điểm của logo mới, chấp nhận theo ý con. Nếu con muốn bỏ chữ H1 ở hero thì nói thêm sau.

## Các bước thực hiện

### 1. Thay file logo
- Tạo asset CDN cho logo mới bằng `lovable-assets create` từ `/mnt/user-uploads/image-5.png`? **KHÔNG** — vì code đang import file tĩnh trực tiếp, đổi sang pointer `.asset.json` sẽ phải sửa 20 file import. Thay vào đó:
- Resize `image-5.png` xuống **512×512** rồi ghi đè `src/assets/angel-logo.png`. Tất cả import hiện có tự dùng logo mới, không sửa code.
  ```bash
  python3 -c "from PIL import Image; im=Image.open('/mnt/user-uploads/image-5.png'); im=im.convert('RGB').resize((512,512), Image.LANCZOS); im.save('src/assets/angel-logo.png', optimize=True)"
  ```
- Giữ nguyên filename `angel-logo.png` để 20 câu import không đổi.

### 2. Favicon (đồng bộ theo logo mới)
- Logo mới là ảnh tròn thương hiệu → nên cập nhật favicon từ chính logo này:
  ```bash
  python3 -c "from PIL import Image; im=Image.open('/mnt/user-uploads/image-5.png'); im=im.convert('RGB').resize((64,64), Image.LANCZOS); im.save('public/favicon.png', optimize=True)"
  rm public/favicon.ico
  ```
  Sửa `src/routes/__root.tsx`: thay `{ rel: "icon", href: "/favicon.ico", type: "image/x-icon" }` → `{ rel: "icon", type: "image/png", href: "/favicon.png" }`.

## Phạm vi
- Ghi đè 1 file binary (`src/assets/angel-logo.png`).
- Thêm `public/favicon.png`, xoá `public/favicon.ico`, sửa 1 dòng link favicon trong `src/routes/__root.tsx`.
- Không sửa 20 file import logo, không đụng database/route/logic khác.

## Kiểm tra
- Mở preview `/`: logo hero là logo vàng mới (tròn, viền vàng, chữ ANGEL AI), không còn icon hồng cũ.
- Kiểm tra navbar, trang Login, Chat, CTO Chat, ChatSidebar, ChatBubble: avatar/logo ANGEL AI đều là logo mới.
- Kiểm tra favicon tab trình duyệt là logo mới.
- Responsive mobile: logo vẫn nằm gọn, không tràn.
