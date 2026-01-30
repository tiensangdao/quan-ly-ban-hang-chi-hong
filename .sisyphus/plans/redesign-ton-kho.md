# Kế hoạch Redesign Trang Tồn Kho & Global Nav (Wave 3+)

## TL;DR
> **Mục tiêu**: Redesign trang Tồn kho + Thanh điều hướng (Bottom Nav) sang phong cách hiện đại. Sửa lỗi build trang Báo cáo.
> **Công nghệ**: Tailwind v4, Lucide React.

---

## 1. Prerequisite: Fix Reports Page (Sửa lỗi trước)
**File**: `app/bao-cao/page.tsx`
- [ ] Fix lỗi so sánh `profit_status` (Line 577-582): Đổi `'✅ Lời'` -> `'PROFIT'`, `'⚠️ Hòa vốn'` -> `'BREAKING_EVEN'`, `'❌ Lỗ'` -> `'LOSS'`.
- [ ] Fix lỗi so sánh `recommendation` (Line 597-601): Đổi `'🟢 NÊN NHẬP THÊM'` -> `'BUY_MORE'`, `'🔴 NGƯNG NHẬP'` -> `'STOP_BUYING'`.

## 2. Global: Redesign Bottom Navigation
**File**: `app/components/BottomNav.tsx`
- [ ] Thay thế Emoji bằng Lucide Icons:
  - Trang chủ: `Home`
  - Nhập hàng: `PlusCircle` hoặc `PackagePlus`
  - Bán hàng: `ShoppingCart`
  - Tồn kho: `Package` hoặc `Box`
  - Báo cáo: `BarChart3`
  - Cài đặt: `Settings`
- [ ] Active State: Màu `text-indigo-600`, icon đậm hơn.

## 3. Redesign: Inventory Page (Trang Tồn Kho)
**File**: `app/ton-kho/page.tsx`

### A. Loading State (Mới)
- [ ] Thêm `InventorySkeleton` component (inline): Hiển thị 3-4 khung thẻ màu xám nhấp nháy khi `loading = true`.

### B. Header & Controls
- [ ] **Search Input**: `bg-white`, `border-slate-200`, `shadow-sm`, `rounded-xl`. Icon `Search` màu `slate-400`.
- [ ] **Filter Tabs**: Dùng style "Pill" (viên thuốc) thay vì dropdown cũ nếu ít lựa chọn.

### C. Product Cards (Thẻ sản phẩm)
- [ ] **Container**: `bg-white rounded-xl border border-slate-200 shadow-sm`.
- [ ] **Header**: Tên sản phẩm `text-slate-900 font-bold`.
- [ ] **Info Grid**: 
  - Tồn kho: Icon `Package`, số lượng to.
  - Giá trị: Icon `CircleDollarSign`, format tiền tệ.
- [ ] **Badges**:
  - Hết hàng: `bg-rose-50 text-rose-700 border-rose-100`.
  - Sắp hết: `bg-amber-50 text-amber-700 border-amber-100`.
  - Còn hàng: `bg-emerald-50 text-emerald-700 border-emerald-100`.

---

## 4. Verification
- [ ] Build thành công (`npm run build`).
- [ ] Bottom Nav hiển thị icon đẹp, không còn emoji.
- [ ] Trang Tồn kho có loading skeleton.
- [ ] Card sản phẩm hiển thị đúng màu sắc và icon Lucide.
