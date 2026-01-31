# Kế hoạch Redesign Trang Tồn Kho & Global Nav (Wave 3+)

## TL;DR
> **Mục tiêu**: Redesign trang Tồn kho + Thanh điều hướng (Bottom Nav) sang phong cách hiện đại. Sửa lỗi build trang Báo cáo.
> **Công nghệ**: Tailwind v4, Lucide React.

---


## 2. Global: Redesign Bottom Navigation
**File**: `app/components/BottomNav.tsx`
- [x] Thay thế Emoji bằng Lucide Icons:
  - Trang chủ: `Home`
  - Nhập hàng: `PlusCircle` hoặc `PackagePlus`
  - Bán hàng: `ShoppingCart`
  - Tồn kho: `Package` hoặc `Box`
  - Báo cáo: `BarChart3`
  - Cài đặt: `Settings`
- [x] Active State: Màu `text-indigo-600`, icon đậm hơn. (Implemented with blue/green theme)

## 3. Redesign: Inventory Page (Trang Tồn Kho)
**File**: `app/ton-kho/page.tsx`

### A. Loading State (Mới)
- [x] Thêm `InventorySkeleton` component (inline): Hiển thị 3-4 khung thẻ màu xám nhấp nháy khi `loading = true`.

### B. Header & Controls
- [x] **Search Input**: `bg-white`, `border-slate-200`, `shadow-sm`, `rounded-xl`. Icon `Search` màu `slate-400`.
- [x] **Filter Tabs**: Dùng style "Pill" (viên thuốc) thay vì dropdown cũ nếu ít lựa chọn. (Implemented Filter Pills)

### C. Product Cards (Thẻ sản phẩm)
- [x] **Container**: `bg-white rounded-xl border border-slate-200 shadow-sm`.
- [x] **Header**: Tên sản phẩm `text-slate-900 font-bold`. (Implemented with Blue Gradient Header)
- [x] **Info Grid**: 
  - Tồn kho: Icon `Package`, số lượng to.
  - Giá trị: Icon `CircleDollarSign`, format tiền tệ.
- [x] **Badges**:
  - Hết hàng: `bg-rose-50 text-rose-700 border-rose-100`.
  - Sắp hết: `bg-amber-50 text-amber-700 border-amber-100`.
  - Còn hàng: `bg-emerald-50 text-emerald-700 border-emerald-100`.

---

## 4. Verification
- [x] Build thành công (`npm run build`).
- [x] Bottom Nav hiển thị icon đẹp, không còn emoji.
- [x] Trang Tồn kho có loading skeleton.
- [x] Card sản phẩm hiển thị đúng màu sắc và icon Lucide.
