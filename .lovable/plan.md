# Plan: Đưa logo Camly Coin xuống dưới dòng chữ "ANGEL AI"

## Mục tiêu
Trang chủ hiện đặt logo Camly Coin **bên trái** chữ "ANGEL AI" (cùng dòng trong thẻ `<h1>`). Yêu cầu: chuyển logo xuống **vị trí bên dưới** dòng chữ "ANGEL AI", nằm riêng trên một dòng, căn giữa.

## Hiện trạng (đã đọc `src/pages/Index.tsx`, dòng 70–87)
```tsx
<motion.h1 ... className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 flex flex-wrap items-center justify-center gap-3">
  <motion.img src={camlyCoinAsset.url} ... />   // logo đang nằm TRƯỚC chữ
  <span className="text-gradient-divine">ANGEL AI</span>
</motion.h1>
```
Logo hiện là `motion.img` dùng asset `camlyCoinAsset.url` (đã xoá nền, có quầng sáng vàng).

## Thay đổi
**Chỉ sửa 1 file: `src/pages/Index.tsx`** — di chuyển khối `motion.img` logo ra khỏi `<h1>`, đặt thành một phần tử riêng ngay phía dưới `<h1>` (giữa H1 và đoạn subtitle hiện tại).

Cấu trúc mới:
```tsx
<motion.h1 ... className="... justify-center">
  <span className="text-gradient-divine">ANGEL AI</span>
</motion.h1>

{/* Logo Camly Coin bên dưới dòng ANGEL AI */}
<motion.div className="flex justify-center mb-6">
  <motion.img
    src={camlyCoinAsset.url}
    alt="Camly Coin"
    className="h-16 w-16 md:h-20 md:w-20 drop-shadow-[0_0_12px_rgba(225,188,58,0.45)]"
    initial={{ opacity: 0, scale: 0.4, rotate: -30 }}
    animate={{ opacity: 1, scale: 1, rotate: 0 }}
    transition={{ delay: 0.6, duration: 0.7, ease: 'easeOut' }}
    whileHover={{ scale: 1.1, rotate: 8 }}
  />
</motion.div>
```

### Chi tiết
- `<h1>` bỏ `flex flex-wrap items-center gap-3`, chỉ còn căn giữa text (giữ `justify-center` / `text-center`).
- Logo đặt trong `motion.div` riêng, `flex justify-center`, kích thước `h-16 w-16` (mobile) / `md:h-20 md:w-20` (desktop) — to vừa, hài hoà với cỡ chữ H1, không tràn.
- Giữ nguyên các hiệu ứng: fade+scale+rotate khi vào, hover scale+rotate; quầng sáng vàng `drop-shadow`.
- Giữ nguyên `alt="Camly Coin"`, asset pointer `camlyCoinAsset.url` (không đổi).
- Không đụng tới subtitle, CTA, hay phần nào khác.

## Phạm vi
- 1 file nguồn (`src/pages/Index.tsx`).
- Không đụng database, không đụng route/asset khác.
- Nội dung câu chữ "ANGEL AI" và subtitle giữ nguyên.

## Kiểm tra
- Mở preview `/`: logo Camly Coin xuất hiện trên dòng riêng ngay dưới chữ "ANGEL AI", căn giữa, có hiệu ứng hover.
- Responsive mobile: logo vẫn nằm gọn dưới H1, không tràn.
