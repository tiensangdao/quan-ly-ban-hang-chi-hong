# Kế hoạch Nâng cấp Giao diện Toàn diện (UI/UX Overhaul)

## TL;DR

> **Mục tiêu**: Loại bỏ giao diện "AI/ChatGPT" nhàm chán. Xây dựng giao diện hiện đại, đẹp mắt, tối ưu hoàn toàn cho điện thoại.
> 
> **Phong cách**: Modern Clean, Soft Shadows, Pastel Accents.
> **Icon System**: Lucide React (100% thay thế Emoji).
> **Màu chủ đạo**: Indigo (Primary) + Emerald (Success) + Rose (Danger).
> 
> **Chiến lược thực thi**: Chia thành 4 đợt (Waves) để không làm hỏng chức năng đang chạy.

---

## Design System (Hệ thống thiết kế)

### 1. Color Palette (Tailwind)
- **Background**: `bg-slate-50` (Nền chính), `bg-white` (Cards).
- **Primary**: `text-indigo-600`, `bg-indigo-600` (Brand).
- **Success**: `text-emerald-600`, `bg-emerald-50` (Lời/Tăng trưởng).
- **Danger**: `text-rose-600`, `bg-rose-50` (Lỗ/Giảm/Hết hàng).
- **Warning**: `text-amber-600`, `bg-amber-50` (Sắp hết/Hòa vốn).
- **Text**: `text-slate-900` (Chính), `text-slate-500` (Phụ).

### 2. Component Styles
- **Cards**: `bg-white rounded-xl border border-slate-100 shadow-sm p-4`.
- **Buttons**: `rounded-lg font-medium transition-all active:scale-95`.
- **Inputs**: `rounded-lg border-slate-200 focus:ring-2 focus:ring-indigo-500/20`.
- **Bottom Nav**: `fixed bottom-0 w-full bg-white/80 backdrop-blur-md border-t border-slate-200`.

---

## Lộ trình Thực hiện (Execution Waves)

### Wave 1: Foundation & Navigation (Nền móng)
**Mục tiêu**: Thay đổi cảm giác chung của ứng dụng ngay lập tức.

- [ ] **Global CSS**: Cập nhật `globals.css` với màu nền mới, font antialiasing.
- [ ] **Layout Wrapper**: Chỉnh sửa `app/layout.tsx`.
- [ ] **Bottom Navigation**: Redesign lại `components/BottomNav.tsx`.
  - Icon Lucide: `Home`, `Package`, `ShoppingCart`, `BarChart3`, `Settings`.
  - Hiệu ứng active: Icon nổi màu, background nhẹ.
- [ ] **Header Mobile**: Tạo component Header chuẩn cho mobile (Logo + Avatar/Action).

### Wave 2: Core Dashboard & Reports (Trang Báo Cáo - Ưu tiên 1)
**Mục tiêu**: Làm cho trang Báo cáo (vừa làm xong logic) trở nên đẹp lung linh.

- [ ] **Redesign `/bao-cao`**:
  - **Tabs**: Chuyển sang dạng "Segmented Control" (Viên thuốc) thay vì tab gạch chân cũ.
  - **KPI Cards**: Gradient nhẹ (VD: `from-indigo-500 to-violet-600`) cho các số liệu tổng quan.
  - **Product Cards**: Layout 3 phần hiện đại, Icon trạng thái rõ ràng (thay thế emoji ✅/⚠️).
  - **Charts**: Tùy chỉnh màu Chart khớp với theme mới (Indigo/Emerald).

### Wave 3: Inventory UI (Trang Tồn Kho)
**Mục tiêu**: Biến danh sách hàng hóa thành danh mục sản phẩm đẹp mắt.

- [ ] **Redesign `/ton-kho`**:
  - Search bar to, đẹp, có icon `Search` và `Filter`.
  - Product Card: Ảnh minh họa (nếu có) hoặc Placeholder icon đẹp.
  - Badges: Tag trạng thái (Còn hàng/Hết hàng) thiết kế lại (bo tròn, màu pastel).

### Wave 4: Operations UI (Bán hàng & Nhập hàng)
**Mục tiêu**: Tối ưu form nhập liệu cho ngón tay cái.

- [ ] **Redesign `/ban-hang` & `/nhap-hang`**:
  - Form input to, rõ ràng (`h-12`).
  - Nút "Thêm", "Lưu" nổi bật, dễ bấm.
  - Drawer/Modal trượt từ dưới lên (Bottom Sheet) thay vì Modal giữa màn hình (dễ thao tác 1 tay).

---

## Chi tiết Triển khai Wave 2 (Báo Cáo - Làm ngay)

Do chúng ta đang dở dang trang Báo cáo, tôi sẽ ưu tiên làm đẹp trang này đầu tiên để bạn thấy sự khác biệt.

### Nhiệm vụ cụ thể:
1.  **Icon Replacement**: Thay thế toàn bộ emoji trong code bằng `lucide-react`.
    - `TrendingUp`, `TrendingDown` cho xu hướng.
    - `Package`, `AlertTriangle` cho tồn kho.
    - `DollarSign`, `Wallet` cho tiền nong.
2.  **Card Styling**:
    - Bỏ border thô kệch (`border-2`). Dùng `shadow-sm` và `border` mỏng.
    - Gradient nền nhẹ cho các section quan trọng.
3.  **Typography**:
    - Số tiền: Font to, đậm (`text-2xl font-bold tracking-tight`).
    - Label: Chữ nhỏ, màu nhạt (`text-xs font-medium text-slate-500 uppercase`).

---

## Hướng dẫn Kiểm thử (Verification)
- Mở trên chế độ Mobile (Chrome DevTools).
- Kiểm tra độ tương phản màu sắc.
- Đảm bảo không còn bất kỳ Emoji nào sót lại trong UI chính (trừ nội dung do người dùng nhập).
