# PawSpa UI Transformation Plan

## TL;DR

> **Quick Summary**: Transform the sales dashboard into a friendly "PawSpa" pet grooming application using claymorphism, warm orange/cream colors, and playful icons.
> 
> **Deliverables**:
> - Updated `app/globals.css` with new design system (colors, clay utilities)
> - Re-skinned `app/page.tsx` (Dashboard) with "PawSpa" branding
> - Updated `app/components/BottomNav.tsx` with new theme
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: globals.css → page.tsx → BottomNav.tsx

---

## Context

### Original Request
User wants to re-skin the existing sales management app to look like a friendly pet grooming service ("PawSpa"). The current design is too "boring" and text-heavy. The user provided a visual reference (claymorphism, warm colors).

### Interview Summary
**Key Discussions**:
- **Style**: Claymorphism (soft 3D, rounded)
- **Colors**: Warm Orange (`#F97316`) + Cream (`#FFF7ED`) + Dark Brown text (`#431407`)
- **Icons**: Use `lucide-react` icons (Dog, Bone, Scissors) to replace text
- **Mobile First**: Must maintain responsiveness

### Metis Review
**Identified Gaps** (addressed):
- **Contrast**: Confirmed `#431407` on `#FFF7ED` has 12.4:1 contrast ratio (AAA).
- **Icons**: Verified `Dog`, `Scissors`, `Bath`, `Bone` exist in `lucide-react`.
- **Performance**: Clay shadows constrained to max 3 layers for mobile performance.

---

## Work Objectives

### Core Objective
Re-skin the sales dashboard to "PawSpa" aesthetic without breaking existing logic.

### Concrete Deliverables
- `app/globals.css`: New CSS variables and `.clay-card` classes
- `app/page.tsx`: Updated dashboard UI
- `app/components/BottomNav.tsx`: Updated navigation bar

### Definition of Done
- [ ] Dashboard looks like the "PawSpa" reference
- [ ] All text is readable (high contrast)
- [ ] Mobile layout is preserved
- [ ] No build errors

### Must Have
- Warm Orange/Cream palette
- Claymorphism card style
- Playful icons

### Must NOT Have (Guardrails)
- Low contrast text (light gray on white)
- Complex heavy shadows that lag on mobile
- Breaking changes to data fetching logic

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO (but we will verify visually via code structure)
- **User wants tests**: NO (User emphasized UI changes)
- **Framework**: Manual verification + Automated structure checks

### Automated Verification Only (NO User Intervention)

**By Deliverable Type:**

| Type | Verification Tool | Automated Procedure |
|------|------------------|---------------------|
| **Frontend/UI** | `grep` / `ast-grep` | Verify classes and icon imports exist in files |
| **Build** | `bash` | Run `npm run build` to ensure no syntax errors |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Update globals.css (Design System)

Wave 2 (After Wave 1):
├── Task 2: Re-skin Dashboard (page.tsx)
└── Task 3: Re-skin Navigation (BottomNav.tsx)

Critical Path: Task 1 → Task 2
```

---

## TODOs

- [ ] 1. Update Design System (`app/globals.css`)

  **What to do**:
  - Define `:root` variables for Warm Orange, Cream, Dark Brown.
  - Add `.clay-card` and `.clay-button` utility classes.
  - Set default font color to Dark Brown.

  **Must NOT do**:
  - Remove Tailwind directives.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: NO (Foundation)
  - **Blocks**: Task 2, Task 3

  **References**:
  - `app/globals.css` (existing file)
  - Reference Palette: `#FFF7ED` (bg), `#F97316` (primary), `#431407` (text)

  **Acceptance Criteria**:
  ```bash
  # Verify CSS variables exist
  grep "\-\-background: #FFF7ED" app/globals.css
  grep "\-\-primary: #F97316" app/globals.css
  grep "\.clay-card" app/globals.css
  ```

- [ ] 2. Re-skin Dashboard (`app/page.tsx`)

  **What to do**:
  - Replace "Kho Hàng - Hôm Nay" with "PawSpa Dashboard" + `Dog` icon.
  - Replace standard cards with `.clay-card`.
  - Update stats icons:
    - `Calendar` -> `CalendarHeart` (or kept)
    - `TrendingUp` -> `Bone` (Sales)
    - `ArrowDownToLine` -> `Bath` (Import/Service)
    - `Sparkles` -> `Scissors` (Profit/Grooming)
  - Update colors to use `text-primary` (Orange) and `text-foreground` (Brown).

  **Must NOT do**:
  - Change `fetchDashboardData` logic.
  - Remove existing data points (just re-label them if needed).

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 3)
  - **Blocked By**: Task 1

  **References**:
  - `app/page.tsx` (existing logic)
  - `lucide-react` docs (for icons)

  **Acceptance Criteria**:
  ```bash
  # Verify icons imported
  grep "import .*Dog.* from 'lucide-react'" app/page.tsx
  grep "import .*Bone.* from 'lucide-react'" app/page.tsx
  # Verify clay class usage
  grep "className=\".*clay-card.*\"" app/page.tsx
  ```

- [ ] 3. Re-skin Navigation (`app/components/BottomNav.tsx`)

  **What to do**:
  - Update `navItems` icons to be more playful if possible (or just style them).
  - Apply Orange/Cream theme to active states.
  - Use rounded/clay style for the active tab indicator.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 2)
  - **Blocked By**: Task 1

  **References**:
  - `app/components/BottomNav.tsx`

  **Acceptance Criteria**:
  ```bash
  # Verify color updates
  grep "text-primary" app/components/BottomNav.tsx || grep "text-orange" app/components/BottomNav.tsx
  ```

---

## Success Criteria

### Final Checklist
- [ ] Background is Cream (`#FFF7ED`)
- [ ] Text is Dark Brown (`#431407`)
- [ ] Dashboard cards use Claymorphism style
- [ ] Icons are playful (Dog, Bone, etc.)
- [ ] Build passes (`npm run build`)
