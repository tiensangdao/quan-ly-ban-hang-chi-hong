# Báo Cáo Page Redesign - Business-Focused Reports

## TL;DR

> **Quick Summary**: Transform the cluttered Reports page into a business-focused dashboard with actionable recommendations for non-technical users.
> 
> **Deliverables**:
> - Tab 1: "Phân tích Sản phẩm" - Product performance cards with profit/loss status and buy/stop recommendations
> - Tab 2: "Xu hướng Thời gian" - Simplified time trends with month/year filters and 2 key charts
> - Remove old "Tháng/Năm/So sánh" 3-tab structure
> - Implement business logic for recommendations (Lời + Top 30% + Low stock = BUY MORE)
> 
> **Estimated Effort**: Medium (UI transformation with business logic)
> **Parallel Execution**: NO - sequential implementation (Tab structure → Tab 1 → Tab 2 → Testing)
> **Critical Path**: Tab structure refactor → Product analysis implementation → Time trend simplification

---

## Context

### Original Request

User complaint (Vietnamese):
> "ở chức năng Báo cáo á tui thấy rất rối luôn nếu mà cho một người không ràng về công nghệ thì không biết xem sao luôn tháng thì chả biết cái nào bán nhiều bán ít, rồi khuyến nghị làm sao đơn giản cho người dùng, rồi theo năm nữa lúc đầu phải chọn phân tích theo năm nào đúng không, mặc định là năm hiện tại, rồi phân tích năm thời lời lỗi, chi tiêu gì, cái nào lời lỗ, nên mua nữa không, phải chỉ ra cho họ biết chứ đúng không, hiện tại chức năng Báo cáo của tôi chỉ có biểu đồ á cũng chán nhìn cũng rối nó chung bạn thiết kế lại sao cho người dùng có thể biết được các thông tin chi tiết để dùng đó mới là quan trọng biểu đồ ít cũng được nhưng phải cung cấp thông tin hữu ích cái so sánh trong báo cáo bạn thấy sao nên giữ hay xóa lên kế hoạch cho tui chi tiết đi đừng có rối nha người dùng sẽ khó chịu đó"

**Translation**: Reports page is too confusing for non-technical users. Need:
- Clear indication of which products sell well vs poorly
- Actionable recommendations (what to buy more, what to stop)
- Year filter with default to current year
- Profit/loss analysis per product
- Less charts, more useful information

### Interview Summary

**Key Discussions**:
- **Tab structure**: User chose "2 tabs đơn giản" - Phân tích Sản phẩm | Xu hướng Thời gian
- **Comparison tab**: Keep and transform into "Phân tích Sản phẩm" (most valuable existing content)
- **Recommendations**: All 3 types (NÊN mua thêm | NGƯNG mua | Lời/Lỗ status)
- **Charts**: Only 1-2 important ones (Bar: Chi/Thu + Line: Xu hướng lãi)
- **Year analysis**: Dropdown to select specific year (default: current year)
- **Product display**: Cards like inventory page redesign (not table)
- **Sorting**: Dropdown on mobile (Doanh thu | Lãi | SL bán | Hồi vốn %)

**Research Findings**:
- Current page has all necessary data sources (monthlyData, yearlyData, productBreakdown, topProducts, recoveryData)
- Inventory page redesign (`app/ton-kho/page.tsx:227-321`) provides exact card template to follow
- Recovery % calculation already exists: `(revenue / cost) × 100`
- Need to add: stock levels, profit calculations, percentile logic for "top 30%"

### Metis Review

**Identified Gaps** (addressed):
- **Timeframe for "Top 30%"**: 6 tháng gần nhất (last 6 months)
- **Display count**: Hiển thị tất cả sản phẩm (all products, no limit)
- **Products with 0 sales**: Show with badge "Chưa bán được"
- **Empty recommendations**: Show message "Không có sản phẩm nào đạt chuẩn..."
- **Mobile sorting**: Dropdown selector (not clickable headers)
- **Negative stock handling**: Show "⚠️ Thiếu {n} cái"
- **Edge case: <3 products**: Skip percentile logic, show all with status
- **Edge case: All products profitable**: Show "✅ Tất cả sản phẩm đều lời"

---

## Work Objectives

### Core Objective

Transform `/app/bao-cao/page.tsx` from a chart-heavy analytics page into a business-focused dashboard that tells non-technical users:
1. Which products are performing well (top performers + profit status)
2. What action to take (buy more, stop buying, monitor)
3. How business is trending over time (simplified charts with context)

### Concrete Deliverables

1. **File Modified**: `/app/bao-cao/page.tsx`
2. **New Tab Structure**: 2 tabs instead of 3
   - Tab 1: "📊 Phân tích Sản phẩm" (Product Analysis)
   - Tab 2: "📈 Xu hướng Thời gian" (Time Trends)
3. **Product Cards**: 3-section layout following inventory page pattern
4. **Recommendation Logic**: Automated buy/stop/monitor suggestions
5. **Simplified Charts**: Only Bar chart (Chi/Thu) + Line chart (Lãi trend)

### Definition of Done

- [ ] Old 3-tab structure ("Tháng" | "Năm" | "So sánh") completely removed
- [ ] New 2-tab structure renders correctly
- [ ] Tab 1 shows all products with profit status, recommendations, and sort dropdown
- [ ] Tab 2 shows month/year dropdowns defaulting to current year
- [ ] Only 2 charts exist in Tab 2 (Bar + Line), no Pie/Area charts
- [ ] Playwright tests verify structure, recommendations, and chart count
- [ ] Mobile responsive with working dropdown sort

### Must Have

- **Recommendation badges**:
  - 🟢 "NÊN NHẬP THÊM" (Lời + Top 30% revenue + Stock < 10)
  - 🔴 "NGƯNG NHẬP" (Lỗ + Bottom 30% revenue + Stock > 20)
- **Profit status color coding**:
  - ✅ Lời (green): recovery ≥ 100%
  - ⚠️ Hòa vốn (yellow): 50% ≤ recovery < 100%
  - ❌ Lỗ (red): recovery < 50%
- **Product card 3-section layout** (following `app/ton-kho/page.tsx:227-321`)
- **Dropdown filters**: Month/Year selection in Tab 2
- **Exact 2 charts**: Bar (Chi nhập vs Doanh thu) + Line (Xu hướng lãi)
- **Mobile sort dropdown**: "Sắp xếp theo: Doanh thu | Lãi | Số lượng | Hồi vốn %"

### Must NOT Have (Guardrails)

- **MUST NOT** add more than 2 charts in Tab 2
- **MUST NOT** add Pie chart or Area chart (explicitly removed)
- **MUST NOT** add export/print/share functionality
- **MUST NOT** create new components outside `page.tsx` (inline implementation)
- **MUST NOT** add pagination or "load more" features
- **MUST NOT** refactor data fetching to server actions (keep client-side)
- **MUST NOT** add loading skeletons beyond basic spinner
- **MUST NOT** add animations beyond existing Tailwind transitions
- **MUST NOT** add date range picker (only predefined month/year dropdowns)
- **MUST NOT** add "quick filter" buttons like inventory page (dropdowns only)
- **MUST NOT** add edit/action buttons on product cards (view-only)
- **MUST NOT** add chart drill-down interactions (keep charts simple/static)

---

## Verification Strategy

### Test Decision

- **Infrastructure exists**: NO (focus on automated verification without full test suite)
- **User wants tests**: Playwright verification for structure and functionality
- **Framework**: Playwright via skill
- **QA approach**: Automated browser-based verification

### Automated Verification (Agent-Executable)

Each TODO includes verification procedures using **Playwright skill** that agents can run directly.

**By Deliverable Type:**

| Type | Verification Tool | Automated Procedure |
|------|------------------|---------------------|
| **Tab Structure** | Playwright browser | Navigate, count tabs, verify old tabs removed |
| **Product Cards** | Playwright browser | Check DOM structure, color classes, badge text |
| **Charts** | Playwright browser | Count specific chart types (bar/line), assert pie/area = 0 |
| **Dropdowns** | Playwright browser | Select options, verify data updates |
| **Sorting** | Playwright browser | Select sort option, verify card order changes |

**Evidence Requirements (Agent-Executable)**:
- Screenshots saved to `.sisyphus/evidence/bao-cao-*.png`
- DOM assertions logged to verify structure
- Chart counts verified via selector queries
- No manual user intervention required

---

## Execution Strategy

### Sequential Execution (NO Parallelization)

This is a UI transformation of a single file with interdependent changes. Tasks must be executed sequentially.

```
Task 1: Refactor tab structure (remove 3 tabs → add 2 tabs)
   ↓
Task 2: Implement Tab 1 - Product Analysis
   ├─ Add product data calculation
   ├─ Add recommendation logic
   ├─ Build 3-section cards
   └─ Add sort dropdown
   ↓
Task 3: Implement Tab 2 - Time Trends
   ├─ Add month/year dropdowns
   ├─ Filter charts by selection
   └─ Remove Pie/Area charts
   ↓
Task 4: Handle edge cases & empty states
   ↓
Task 5: Playwright verification
```

**Critical Path**: Task 1 → Task 2 → Task 3 → Task 4 → Task 5

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3 | None (foundational) |
| 2 | 1 | 4 | None (uses tab structure) |
| 3 | 1 | 4 | None (uses tab structure) |
| 4 | 2, 3 | 5 | None (needs full impl) |
| 5 | 4 | None | None (final verification) |

### Agent Dispatch Summary

All tasks should use **visual-engineering** category + **frontend-ui-ux** skill.

---

## TODOs

### Task 1: Refactor Tab Structure

- [ ] 1. Remove old 3-tab navigation and add new 2-tab structure

  **What to do**:
  - Remove existing tab state: `useState<'month' | 'year' | 'compare'>('month')`
  - Replace with: `useState<'product' | 'time'>('product')`
  - Update tab navigation JSX (lines 287-316):
    - Remove buttons for "Tháng", "Năm", "So sánh"
    - Add buttons for "📊 Phân tích Sản phẩm", "📈 Xu hướng Thời gian"
  - Keep existing tab styling pattern (blue when active, white when inactive)
  - Remove all old tab content blocks (lines 318-597)

  **Must NOT do**:
  - Change data fetching functions (keep `fetchMonthlyData`, etc. as-is)
  - Add new tabs beyond the 2 specified
  - Change tab button styling (keep existing Tailwind classes)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI restructuring task focused on layout changes
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Core UI transformation aligns with frontend design domain

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential only
  - **Blocks**: Tasks 2, 3 (both need new tab structure)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `app/bao-cao/page.tsx:287-316` - Current tab navigation pattern (button styling, active state logic)
  - `app/bao-cao/page.tsx:47` - Current tab state pattern (activeTab useState hook)

  **Code Structure References**:
  - `app/bao-cao/page.tsx:318-396` - Old "month" tab content block (to be removed)
  - `app/bao-cao/page.tsx:398-470` - Old "year" tab content block (to be removed)
  - `app/bao-cao/page.tsx:472-597` - Old "compare" tab content block (to be removed/transformed)

  **WHY Each Reference Matters**:
  - Tab navigation pattern (287-316): Shows exact button structure, conditional styling classes, onClick handler pattern to preserve
  - Tab state (47): Need to change type definition from 3 options to 2 options
  - Old tab blocks (318-597): Need to completely remove these conditional render blocks

  **Acceptance Criteria**:

  **Automated Verification (Playwright)**:
  ```typescript
  // Agent executes via playwright skill:
  
  // Navigate to Reports page
  await page.goto('http://localhost:3000/bao-cao');
  await page.waitForLoadState('networkidle');
  
  // AC1: Only 2 tabs exist
  const tabCount = await page.locator('button').filter({ hasText: /📊|📈/ }).count();
  assert(tabCount === 2, 'Should have exactly 2 tabs');
  
  // AC2: Old tabs are removed
  const oldTabs = await page.locator('button').filter({ hasText: /Tháng|Năm|So sánh/ }).count();
  assert(oldTabs === 0, 'Old 3 tabs should be completely removed');
  
  // AC3: New tab names are correct
  const tab1 = await page.locator('button:has-text("📊 Phân tích Sản phẩm")').isVisible();
  const tab2 = await page.locator('button:has-text("📈 Xu hướng Thời gian")').isVisible();
  assert(tab1 && tab2, 'New tabs should have correct Vietnamese names');
  
  // AC4: Tab switching works
  await page.locator('button:has-text("📈 Xu hướng Thời gian")').click();
  const tab2Active = await page.locator('button:has-text("📈 Xu hướng Thời gian")').getAttribute('class');
  assert(tab2Active.includes('bg-blue-600'), 'Clicked tab should have active styling');
  
  // Screenshot evidence
  await page.screenshot({ path: '.sisyphus/evidence/bao-cao-tab-structure.png', fullPage: true });
  ```

  **Evidence to Capture**:
  - [ ] Screenshot: `.sisyphus/evidence/bao-cao-tab-structure.png` (full page showing 2 tabs)
  - [ ] Console log: Tab count assertion results
  - [ ] Console log: Old tab removal verification

  **Commit**: YES
  - Message: `refactor(reports): replace 3-tab structure with 2-tab business-focused layout`
  - Files: `app/bao-cao/page.tsx`
  - Pre-commit: `npm run build` (verify TypeScript compilation)

---

### Task 2: Implement Tab 1 - Product Analysis

- [ ] 2. Build product performance analysis with recommendations

  **What to do**:
  - **Step 2.1**: Add new state and data calculation
    - Add `sortBy` state: `useState<'revenue' | 'profit' | 'quantity' | 'recovery'>('revenue')`
    - Create `fetchProductPerformance` function:
      ```typescript
      // Calculate for last 6 months only
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      // For each product:
      // - Total revenue (last 6 months)
      // - Total profit (revenue - cost)
      // - Total quantity sold
      // - Current stock (sum nhap_hang.so_luong - sum ban_hang.so_luong)
      // - Recovery % (existing logic from fetchRecoveryStatus)
      ```
    - Calculate percentiles (top 30% = above 70th percentile, bottom 30% = below 30th percentile)
    - Add recommendation logic:
      ```typescript
      if (recovery >= 100 && isTop30 && stock < 10) badge = "NÊN NHẬP THÊM"
      else if (recovery < 50 && isBottom30 && stock > 20) badge = "NGƯNG NHẬP"
      ```
    - Handle edge cases:
      - Product with 0 imports: Show "Chưa nhập hàng" badge
      - Product with 0 sales: Show "Chưa bán được" badge
      - Negative stock: Show "⚠️ Thiếu {abs(stock)} cái"
      - Less than 3 products total: Skip percentile logic, show all with profit status only

  - **Step 2.2**: Implement product cards following inventory pattern
    - Copy 3-section card structure from `app/ton-kho/page.tsx:227-321`
    - **Section 1** (white bg): Product name + Sort dropdown
    - **Section 2** (blue bg `bg-blue-50`): 📊 DOANH THU & BÁN
      - Doanh thu (large text-2xl)
      - Số lượng bán
      - Lãi (revenue - cost)
    - **Section 3** (yellow bg `bg-yellow-50`): 💰 TRẠNG THÁI
      - Recovery % with progress bar
      - Profit status badge (✅ Lời | ⚠️ Hòa vốn | ❌ Lỗ)
      - Recommendation badge (🟢 NÊN NHẬP THÊM | 🔴 NGƯNG NHẬP) if applicable
      - Tồn kho: {stock} cái

  - **Step 2.3**: Add sort dropdown (mobile-friendly)
    ```tsx
    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="...">
      <option value="revenue">Doanh thu cao → thấp</option>
      <option value="profit">Lãi cao → thấp</option>
      <option value="quantity">Số lượng bán nhiều → ít</option>
      <option value="recovery">Hồi vốn % cao → thấp</option>
    </select>
    ```

  - **Step 2.4**: Handle empty states
    - If no products at all: "Chưa có dữ liệu sản phẩm"
    - If no "NÊN NHẬP THÊM" products: Show info box: "Không có sản phẩm nào đạt chuẩn NÊN NHẬP THÊM (Lời + Bán chạy + Tồn ít)"
    - If all products profitable: Show success box: "✅ Tất cả sản phẩm đều lời"

  **Must NOT do**:
  - Add pagination or "load more"
  - Add product editing functionality
  - Create separate component files (inline everything in page.tsx)
  - Add more than 3 sections to cards
  - Add "quick filter" buttons (only the sort dropdown)
  - Change existing data fetching function signatures

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex UI with business logic, requires careful design execution
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Product card design and recommendation UX aligns with frontend design domain

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after Task 1)
  - **Blocks**: Task 4 (edge case handling depends on this structure)
  - **Blocked By**: Task 1 (needs new tab structure first)

  **References**:

  **Pattern References** (existing code to follow):
  - `app/ton-kho/page.tsx:227-321` - **EXACT** 3-section card structure to replicate (header + section 1 + section 2 layout)
  - `app/ton-kho/page.tsx:260-276` - Section 1 styling pattern (bg-blue-50, text sizes, spacing)
  - `app/ton-kho/page.tsx:278-320` - Section 2 conditional rendering pattern (only show if data exists)
  - `app/ton-kho/page.tsx:301-313` - Progress bar component pattern (for recovery %)

  **Data Calculation References**:
  - `app/bao-cao/page.tsx:213-257` - Existing `fetchRecoveryStatus` function (recovery % calculation logic to reuse)
  - `app/bao-cao/page.tsx:179-211` - Existing `fetchTopProducts` function (product aggregation pattern)

  **Color & Badge References**:
  - `app/ton-kho/page.tsx:324-336` - Status badge styling (✅/⚠️/❌ with colors)
  - `lib/utils.ts:formatCurrency` - Currency formatting for revenue/profit
  - `lib/utils.ts:roundNumber` - Number rounding for percentages

  **WHY Each Reference Matters**:
  - Inventory card structure (227-321): User explicitly requested "cards giống trang Tồn kho" - this is the exact template
  - Recovery calculation (213-257): Already has the (revenue/cost) × 100 logic we need
  - Progress bar pattern (301-313): Visual indicator for recovery % - don't reinvent
  - Status badges (324-336): Consistent UX for profit status color coding

  **Acceptance Criteria**:

  **Automated Verification (Playwright)**:
  ```typescript
  // Agent executes via playwright skill:
  
  await page.goto('http://localhost:3000/bao-cao');
  await page.waitForLoadState('networkidle');
  
  // Ensure on Tab 1
  await page.locator('button:has-text("📊 Phân tích Sản phẩm")').click();
  await page.waitForTimeout(1000); // Allow data to load
  
  // AC1: Product cards render with 3-section layout
  const cards = await page.locator('.bg-white.rounded-lg.border').all();
  assert(cards.length > 0, 'Should have at least one product card');
  
  // Check first card has 3 sections (white header + blue section + yellow section)
  const firstCard = cards[0];
  const blueSections = await firstCard.locator('.bg-blue-50').count();
  const yellowSections = await firstCard.locator('.bg-yellow-50').count();
  assert(blueSections === 1 && yellowSections === 1, 'Card should have blue and yellow sections');
  
  // AC2: Color-coded profit status exists
  const statusBadges = await page.locator('text=/✅ Lời|⚠️ Hòa vốn|❌ Lỗ/').count();
  assert(statusBadges > 0, 'Should have profit status badges');
  
  // AC3: Recommendation badges appear if applicable
  const recommendBadges = await page.locator('text=/NÊN NHẬP THÊM|NGƯNG NHẬP/').count();
  console.log(`Found ${recommendBadges} recommendation badges`);
  // Note: May be 0 if no products qualify - this is expected
  
  // AC4: Sort dropdown exists and works
  const sortDropdown = await page.locator('select').first();
  assert(await sortDropdown.isVisible(), 'Sort dropdown should be visible');
  
  // Get first product name before sort
  const firstProductBefore = await cards[0].locator('h3').textContent();
  
  // Change sort to "Lãi cao → thấp"
  await sortDropdown.selectOption('profit');
  await page.waitForTimeout(500); // Allow re-sort
  
  // Get first product name after sort
  const cardsAfterSort = await page.locator('.bg-white.rounded-lg.border').all();
  const firstProductAfter = await cardsAfterSort[0].locator('h3').textContent();
  
  console.log(`Before sort: ${firstProductBefore}, After sort: ${firstProductAfter}`);
  // Note: May be same if top revenue = top profit, but dropdown should work
  
  // AC5: Progress bar for recovery % exists
  const progressBars = await page.locator('.rounded-full.h-2').count();
  assert(progressBars > 0, 'Should have recovery progress bars');
  
  // Screenshot evidence
  await page.screenshot({ path: '.sisyphus/evidence/bao-cao-product-analysis.png', fullPage: true });
  ```

  **Evidence to Capture**:
  - [ ] Screenshot: `.sisyphus/evidence/bao-cao-product-analysis.png` (full product list with cards)
  - [ ] Console log: Number of recommendation badges found
  - [ ] Console log: Sort functionality test results

  **Commit**: YES
  - Message: `feat(reports): add product performance analysis with actionable recommendations`
  - Files: `app/bao-cao/page.tsx`
  - Pre-commit: `npm run build`

---

### Task 3: Implement Tab 2 - Time Trends

- [ ] 3. Build simplified time trend view with month/year filters

  **What to do**:
  - **Step 3.1**: Add filter states
    ```typescript
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all')
    ```

  - **Step 3.2**: Build filter UI
    ```tsx
    <div className="flex gap-3 mb-6">
      <select value={selectedYear} onChange={...} className="...">
        {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
      </select>
      
      <select value={selectedMonth} onChange={...} className="...">
        <option value="all">Tất cả tháng</option>
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>Tháng {m}</option>)}
      </select>
    </div>
    ```

  - **Step 3.3**: Filter chart data
    - If `selectedMonth === 'all'`: Show 12 months of `selectedYear`
    - If `selectedMonth === specific month`: Show just that month's data
    - Filter `monthlyData` based on year and month selection
    - Calculate `availableYears` from existing `yearlyData` (like inventory page history filter)

  - **Step 3.4**: Render ONLY 2 charts
    - **Chart 1**: Bar chart (Chi nhập vs Doanh thu)
      - Reuse existing Bar chart code from lines 322-335
      - Apply filtered data
    - **Chart 2**: Line chart (Xu hướng lãi)
      - Reuse existing Line chart code from lines 366-377
      - Apply filtered data
    - **REMOVE**: All Pie chart code (lines 338-363)
    - **REMOVE**: All Area chart code (lines 381-394)

  - **Step 3.5**: Add summary cards above charts (KPIs)
    ```tsx
    <div className="grid grid-cols-3 gap-3 mb-6">
      <div className="bg-white p-4 rounded-lg border">
        <div className="text-sm text-gray-600">Chi nhập</div>
        <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalChiNhap)}</div>
      </div>
      <div className="bg-white p-4 rounded-lg border">
        <div className="text-sm text-gray-600">Doanh thu</div>
        <div className="text-2xl font-bold text-green-600">{formatCurrency(totalDoanhThu)}</div>
      </div>
      <div className="bg-white p-4 rounded-lg border">
        <div className="text-sm text-gray-600">Lãi</div>
        <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalLai)}</div>
      </div>
    </div>
    ```

  **Must NOT do**:
  - Add date range picker (only predefined month/year dropdowns)
  - Add Pie chart or Area chart
  - Add more than 2 charts
  - Add export/download chart functionality
  - Add chart drill-down interactions (keep static)
  - Add "quick filter" buttons like inventory page

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Data visualization simplification with filtering logic
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Chart layout and filter UX design

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after Task 1)
  - **Blocks**: Task 4 (edge case handling needs this structure)
  - **Blocked By**: Task 1 (needs new tab structure first)

  **References**:

  **Pattern References** (existing code to follow):
  - `app/bao-cao/page.tsx:322-335` - Bar chart implementation (Chi nhập vs Doanh thu) to preserve
  - `app/bao-cao/page.tsx:366-377` - Line chart implementation (Xu hướng lãi) to preserve
  - `app/bao-cao/page.tsx:71-104` - `fetchMonthlyData` function (data structure to filter)

  **Filter Pattern References**:
  - `app/ton-kho/page.tsx:138-156` - Month/Year filter dropdowns in history modal (similar pattern)
  - `app/ton-kho/page.tsx:158-177` - `filteredHistory` useMemo pattern (for filtering data)
  - `app/ton-kho/page.tsx:179-184` - `availableYears` calculation pattern

  **Chart Removal References**:
  - `app/bao-cao/page.tsx:338-363` - Pie chart code block (**DELETE THIS**)
  - `app/bao-cao/page.tsx:381-394` - Area chart code block (**DELETE THIS**)

  **WHY Each Reference Matters**:
  - Bar/Line chart code (322-377): User wants to KEEP these 2 charts - preserve exact implementation
  - fetchMonthlyData (71-104): Shows data structure (month, chi_nhap, doanh_thu, lai) we'll filter
  - Inventory filter pattern (ton-kho 138-184): Proven working month/year filter UI - don't reinvent
  - Pie/Area chart blocks (338-394): User explicitly said "bỏ Pie chart, Area chart" - must remove completely

  **Acceptance Criteria**:

  **Automated Verification (Playwright)**:
  ```typescript
  // Agent executes via playwright skill:
  
  await page.goto('http://localhost:3000/bao-cao');
  await page.waitForLoadState('networkidle');
  
  // Switch to Tab 2
  await page.locator('button:has-text("📈 Xu hướng Thời gian")').click();
  await page.waitForTimeout(1000);
  
  // AC1: Month and Year dropdowns exist
  const dropdowns = await page.locator('select').all();
  assert(dropdowns.length >= 2, 'Should have at least year and month dropdowns');
  
  // AC2: Year dropdown defaults to current year (2026)
  const yearDropdown = dropdowns[0];
  const selectedYear = await yearDropdown.inputValue();
  assert(selectedYear === '2026', 'Should default to current year 2026');
  
  // AC3: Exactly 2 charts exist (Bar + Line)
  const barCharts = await page.locator('.recharts-bar-rectangle').count();
  const lineCharts = await page.locator('.recharts-line-curve').count();
  console.log(`Bar chart elements: ${barCharts}, Line chart elements: ${lineCharts}`);
  assert(barCharts > 0, 'Bar chart should exist');
  assert(lineCharts > 0, 'Line chart should exist');
  
  // AC4: NO Pie charts exist
  const pieCharts = await page.locator('.recharts-pie').count();
  assert(pieCharts === 0, 'Pie chart should be completely removed');
  
  // AC5: NO Area charts exist
  const areaCharts = await page.locator('.recharts-area').count();
  assert(areaCharts === 0, 'Area chart should be completely removed');
  
  // AC6: KPI summary cards exist (3 cards: Chi nhập, Doanh thu, Lãi)
  const kpiCards = await page.locator('.grid.grid-cols-3 > div').count();
  assert(kpiCards === 3, 'Should have 3 KPI summary cards');
  
  // AC7: Filter works (select specific month)
  const monthDropdown = dropdowns[1];
  await monthDropdown.selectOption('1'); // January
  await page.waitForTimeout(500);
  
  // Verify chart updates (data points should change)
  const barChartsAfterFilter = await page.locator('.recharts-bar-rectangle').count();
  console.log(`After filter - Bar chart elements: ${barChartsAfterFilter}`);
  
  // Screenshot evidence
  await page.screenshot({ path: '.sisyphus/evidence/bao-cao-time-trends.png', fullPage: true });
  ```

  **Evidence to Capture**:
  - [ ] Screenshot: `.sisyphus/evidence/bao-cao-time-trends.png` (full time trends tab)
  - [ ] Console log: Chart element counts (verify Bar + Line exist, Pie + Area = 0)
  - [ ] Console log: Filter functionality test results

  **Commit**: YES
  - Message: `feat(reports): add simplified time trends with month/year filters and 2 key charts`
  - Files: `app/bao-cao/page.tsx`
  - Pre-commit: `npm run build`

---

### Task 4: Handle Edge Cases and Empty States

- [ ] 4. Add robust error handling and edge case UI

  **What to do**:
  - **Edge Case 1**: Less than 3 products in system
    ```typescript
    if (products.length < 3) {
      // Skip percentile logic (can't calculate meaningful top/bottom 30%)
      // Show all products with profit status only
      // Don't show "NÊN NHẬP THÊM" or "NGƯNG NHẬP" badges
    }
    ```

  - **Edge Case 2**: Product with 0 imports
    ```tsx
    {totalImports === 0 && (
      <div className="bg-gray-100 px-2 py-1 rounded text-xs">
        Chưa nhập hàng
      </div>
    )}
    ```

  - **Edge Case 3**: Product with imports but 0 sales
    ```tsx
    {totalImports > 0 && totalSales === 0 && (
      <div className="bg-yellow-100 px-2 py-1 rounded text-xs">
        Chưa bán được
      </div>
    )}
    ```

  - **Edge Case 4**: Negative stock (oversold)
    ```tsx
    {stock < 0 && (
      <div className="bg-red-100 px-2 py-1 rounded text-xs font-semibold">
        ⚠️ Thiếu {Math.abs(stock)} cái
      </div>
    )}
    ```

  - **Edge Case 5**: All products are profitable (no "NGƯNG NHẬP" recommendations)
    ```tsx
    {products.every(p => p.recovery >= 100) && (
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
        <div className="text-green-800 font-semibold">✅ Tất cả sản phẩm đều lời</div>
        <div className="text-green-600 text-sm mt-1">Kinh doanh hiệu quả! Mọi sản phẩm đều có lợi nhuận.</div>
      </div>
    )}
    ```

  - **Edge Case 6**: No products qualify for "NÊN NHẬP THÊM"
    ```tsx
    {recommendedProducts.length === 0 && (
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
        <div className="text-blue-800 font-semibold">ℹ️ Không có sản phẩm đạt chuẩn "NÊN NHẬP THÊM"</div>
        <div className="text-blue-600 text-sm mt-1">
          Điều kiện: Lời (hồi vốn ≥ 100%) + Bán chạy (top 30% doanh thu 6 tháng) + Tồn kho {'<'} 10 cái
        </div>
      </div>
    )}
    ```

  - **Edge Case 7**: Year with no data in Tab 2
    ```tsx
    {filteredData.length === 0 && (
      <div className="text-center text-gray-500 py-12">
        Chưa có dữ liệu năm {selectedYear}
      </div>
    )}
    ```

  - **Edge Case 8**: Division by zero in recovery %
    ```typescript
    const recovery = totalImports > 0 
      ? Math.min((totalSales / totalImports) * 100, 100)
      : 0;
    ```

  **Must NOT do**:
  - Show technical error messages (keep Vietnamese, business-friendly language)
  - Throw errors that crash the page (graceful fallbacks only)
  - Hide information (show "no data" messages instead)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UX-focused error handling and edge case UI design
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Empty state and error message design

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after Tasks 2 & 3)
  - **Blocks**: Task 5 (verification needs complete implementation)
  - **Blocked By**: Tasks 2, 3 (needs both tabs implemented)

  **References**:

  **Pattern References** (existing code to follow):
  - `app/bao-cao/page.tsx:275-280` - Existing loading state pattern
  - `app/bao-cao/page.tsx:361-362` - Existing "no data" fallback pattern ("Chưa có dữ liệu")
  - `app/bao-cao/page.tsx:245` - Existing `Math.min(..., 100)` pattern for capping recovery %

  **Edge Case Handling References**:
  - `app/ton-kho/page.tsx:280-320` - Conditional section rendering (only show if data exists)
  - `app/ton-kho/page.tsx:324-336` - Status badge conditional logic (multiple if/else cases)

  **Empty State Design References**:
  - `app/bao-cao/page.tsx:503-504` - Existing empty state message pattern ("Chưa có dữ liệu bán hàng")
  - `app/bao-cao/page.tsx:593-594` - Existing conditional message pattern ("Cần ít nhất 2 năm có dữ liệu")

  **WHY Each Reference Matters**:
  - Loading/no data patterns (275-280, 361-362): Shows existing UX conventions for empty states - maintain consistency
  - Recovery % calculation (245): Already has division-by-zero protection via ternary - reuse this pattern
  - Conditional rendering (ton-kho 280-320): Shows how to gracefully hide sections when data missing
  - Existing empty messages (503-504, 593-594): User expects Vietnamese, informative messages - follow this tone

  **Acceptance Criteria**:

  **Automated Verification (Playwright)**:
  ```typescript
  // Agent executes via playwright skill:
  
  await page.goto('http://localhost:3000/bao-cao');
  await page.waitForLoadState('networkidle');
  
  // AC1: Page loads without JavaScript errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  
  await page.locator('button:has-text("📊 Phân tích Sản phẩm")').click();
  await page.waitForTimeout(1000);
  
  assert(consoleErrors.length === 0, `Should have no console errors. Found: ${consoleErrors.join(', ')}`);
  
  // AC2: Empty state messages are in Vietnamese
  const emptyMessages = await page.locator('text=/Không có|Chưa có|Tất cả/').count();
  console.log(`Found ${emptyMessages} Vietnamese empty/info state messages`);
  
  // AC3: No division by zero errors (page should render)
  const pageContent = await page.locator('body').textContent();
  assert(!pageContent.includes('NaN'), 'Should not display NaN anywhere');
  assert(!pageContent.includes('Infinity'), 'Should not display Infinity anywhere');
  
  // AC4: Switch to Tab 2 and test year with no data (e.g., 2020)
  await page.locator('button:has-text("📈 Xu hướng Thời gian")').click();
  await page.waitForTimeout(500);
  
  const yearDropdown = await page.locator('select').first();
  const options = await yearDropdown.locator('option').all();
  
  // Try selecting earliest year (likely has no data)
  if (options.length > 0) {
    const earliestYear = await options[0].getAttribute('value');
    await yearDropdown.selectOption(earliestYear);
    await page.waitForTimeout(500);
    
    // Should show "no data" message or empty charts (not crash)
    const hasNoDataMessage = await page.locator('text=/Chưa có dữ liệu/').isVisible();
    console.log(`Year ${earliestYear} - Has "no data" message: ${hasNoDataMessage}`);
  }
  
  // Screenshot evidence
  await page.screenshot({ path: '.sisyphus/evidence/bao-cao-edge-cases.png', fullPage: true });
  ```

  **Evidence to Capture**:
  - [ ] Screenshot: `.sisyphus/evidence/bao-cao-edge-cases.png` (page with various states)
  - [ ] Console log: JavaScript error check results (should be 0 errors)
  - [ ] Console log: NaN/Infinity check results (should be none)

  **Commit**: YES
  - Message: `fix(reports): add comprehensive edge case handling and empty states`
  - Files: `app/bao-cao/page.tsx`
  - Pre-commit: `npm run build`

---

### Task 5: Playwright Verification

- [ ] 5. Comprehensive end-to-end verification

  **What to do**:
  - Start dev server: `npm run dev`
  - Run all Playwright tests from previous tasks
  - Additional integration tests:
    - **Test 1**: Tab switching preserves filter state
    - **Test 2**: Sort dropdown changes product order correctly
    - **Test 3**: Month/year filter updates charts correctly
    - **Test 4**: Mobile viewport (375x667) - bottom nav doesn't overlap content
    - **Test 5**: All Vietnamese labels render correctly (no English fallbacks)
  - Capture final evidence screenshots
  - Verify build succeeds: `npm run build`

  **Must NOT do**:
  - Skip any verification step
  - Assume tests pass without running them
  - Accept failing tests (must fix issues found)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI verification and QA testing
  - **Skills**: [`frontend-ui-ux`, `playwright`]
    - `frontend-ui-ux`: UI correctness verification
    - `playwright`: Browser automation for testing

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (final verification)
  - **Blocks**: None (final task)
  - **Blocked By**: Tasks 1, 2, 3, 4 (needs complete implementation)

  **References**:

  **Verification Pattern References**:
  - All acceptance criteria from Tasks 1-4
  - `app/ton-kho/page.tsx` - Reference implementation for comparison

  **Mobile Testing References**:
  - `app/layout.tsx:17` - Root layout padding-bottom for mobile nav
  - `app/components/BottomNav.tsx` - Bottom navigation component (should not overlap)

  **WHY Each Reference Matters**:
  - Previous acceptance criteria: These are the specs to verify against
  - Inventory page: User expects same quality/UX as the redesigned inventory page
  - Mobile nav: Critical that Reports page has same bottom padding as other pages

  **Acceptance Criteria**:

  **Automated Verification (Playwright)**:
  ```typescript
  // Agent executes via playwright skill:
  
  // Test 1: Full smoke test
  await page.goto('http://localhost:3000/bao-cao');
  await page.waitForLoadState('networkidle');
  
  // Verify 2-tab structure
  const tabs = await page.locator('button').filter({ hasText: /📊|📈/ }).all();
  assert(tabs.length === 2, 'Smoke test: Should have 2 tabs');
  
  // Test 2: Tab switching preserves state
  await page.locator('button:has-text("📊 Phân tích Sản phẩm")').click();
  const sortDropdown = await page.locator('select').first();
  await sortDropdown.selectOption('profit'); // Change sort
  
  await page.locator('button:has-text("📈 Xu hướng Thời gian")').click();
  await page.waitForTimeout(500);
  await page.locator('button:has-text("📊 Phân tích Sản phẩm")').click();
  
  const sortValueAfterSwitch = await sortDropdown.inputValue();
  assert(sortValueAfterSwitch === 'profit', 'Sort selection should persist after tab switch');
  
  // Test 3: Mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await page.screenshot({ path: '.sisyphus/evidence/bao-cao-mobile.png', fullPage: true });
  
  // Check bottom padding (should be >= 96px to avoid bottom nav overlap)
  const mainContent = await page.locator('.p-5.pb-24').first();
  const paddingBottom = await mainContent.evaluate(el => 
    parseInt(window.getComputedStyle(el).paddingBottom)
  );
  assert(paddingBottom >= 96, `Mobile padding-bottom should be >= 96px, got ${paddingBottom}px`);
  
  // Test 4: Vietnamese labels (no English fallbacks)
  const bodyText = await page.locator('body').textContent();
  const englishPhrases = ['Revenue', 'Profit', 'Stock', 'Product', 'Month', 'Year'];
  const foundEnglish = englishPhrases.filter(phrase => bodyText.includes(phrase));
  assert(foundEnglish.length === 0, `Should have no English labels. Found: ${foundEnglish.join(', ')}`);
  
  // Test 5: Build succeeds
  const buildResult = await exec('npm run build');
  assert(buildResult.exitCode === 0, 'Production build should succeed without errors');
  
  // Final screenshots
  await page.setViewportSize({ width: 1280, height: 800 }); // Desktop
  await page.locator('button:has-text("📊 Phân tích Sản phẩm")').click();
  await page.screenshot({ path: '.sisyphus/evidence/bao-cao-final-tab1.png', fullPage: true });
  
  await page.locator('button:has-text("📈 Xu hướng Thời gian")').click();
  await page.screenshot({ path: '.sisyphus/evidence/bao-cao-final-tab2.png', fullPage: true });
  
  console.log('✅ All verification tests passed!');
  ```

  **Evidence to Capture**:
  - [ ] Screenshot: `.sisyphus/evidence/bao-cao-mobile.png` (mobile viewport)
  - [ ] Screenshot: `.sisyphus/evidence/bao-cao-final-tab1.png` (desktop Tab 1)
  - [ ] Screenshot: `.sisyphus/evidence/bao-cao-final-tab2.png` (desktop Tab 2)
  - [ ] Console log: All test results summary
  - [ ] Build output: `npm run build` success confirmation

  **Commit**: YES
  - Message: `test(reports): verify complete redesign with Playwright E2E tests`
  - Files: `.sisyphus/evidence/*.png` (if committing evidence)
  - Pre-commit: N/A (this IS the verification step)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `refactor(reports): replace 3-tab structure with 2-tab business-focused layout` | `app/bao-cao/page.tsx` | `npm run build` |
| 2 | `feat(reports): add product performance analysis with actionable recommendations` | `app/bao-cao/page.tsx` | `npm run build` |
| 3 | `feat(reports): add simplified time trends with month/year filters and 2 key charts` | `app/bao-cao/page.tsx` | `npm run build` |
| 4 | `fix(reports): add comprehensive edge case handling and empty states` | `app/bao-cao/page.tsx` | `npm run build` |
| 5 | `test(reports): verify complete redesign with Playwright E2E tests` | `.sisyphus/evidence/*.png` | Playwright tests pass |

---

## Success Criteria

### Verification Commands

```bash
# Start dev server
npm run dev

# In browser: http://localhost:3000/bao-cao
# Expected: 
# - 2 tabs visible (Phân tích Sản phẩm | Xu hướng Thời gian)
# - Product cards with 3-section layout
# - Recommendation badges visible
# - Only Bar + Line charts in Tab 2
# - No Pie/Area charts anywhere
# - Month/Year dropdowns working
```

### Final Checklist

- [ ] All "Must Have" features present:
  - [ ] 🟢 "NÊN NHẬP THÊM" badges for qualifying products
  - [ ] 🔴 "NGƯNG NHẬP" badges for qualifying products
  - [ ] ✅/⚠️/❌ Profit status color coding
  - [ ] 3-section product cards
  - [ ] Month/Year dropdown filters
  - [ ] Exactly 2 charts (Bar + Line)
  - [ ] Mobile sort dropdown
- [ ] All "Must NOT Have" avoided:
  - [ ] No Pie charts
  - [ ] No Area charts
  - [ ] No more than 2 charts total
  - [ ] No export functionality
  - [ ] No pagination
  - [ ] No separate component files
- [ ] All edge cases handled:
  - [ ] Products with 0 sales show "Chưa bán được"
  - [ ] Less than 3 products system skips percentiles
  - [ ] Negative stock shows "⚠️ Thiếu X cái"
  - [ ] No NaN or Infinity displayed
  - [ ] Empty states show helpful messages
- [ ] All tests pass:
  - [ ] Playwright verification complete
  - [ ] Build succeeds without errors
  - [ ] Mobile responsive (bottom nav no overlap)
  - [ ] Vietnamese labels throughout
