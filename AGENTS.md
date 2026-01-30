# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-31
**Branch:** main

## OVERVIEW
Next.js 16 (App Router) e-commerce system for "Chị Hồng" using Supabase (PostgreSQL), Google Sheets Sync, and Tailwind CSS v4.
Focuses on inventory management, sales tracking, and reporting.

## STRUCTURE
```
./
├── actions/         # Server Actions (Mutations & Data Fetching)
├── app/             # Next.js App Router (pages, layouts)
│   ├── components/  # Reusable UI Components
│   └── [routes]/    # ban-hang, bao-cao, etc.
├── lib/             # Shared utilities (Supabase, Google Sheets)
├── public/          # Static assets
└── next.config.ts   # Next.js config
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| **Entry Point** | `app/page.tsx` | Main dashboard/landing |
| **Layout** | `app/layout.tsx` | Root layout + Global CSS + Fonts |
| **Database** | `lib/supabase.ts` | Supabase client initialization |
| **Sync Logic** | `lib/googleSheets.ts` | Google Sheets API integration |
| **Settings** | `actions/settings.ts` | Configuration management |
| **Navigation** | `app/components/BottomNav.tsx` | Mobile-first bottom navigation |
| **Styles** | `app/globals.css` | Global Tailwind directives |

## CONVENTIONS
- **Imports**: Use `@/` alias (e.g., `@/lib/supabase`).
- **Styling**: Tailwind CSS v4 utility classes only. No raw CSS.
- **Components**:
  - `'use client'` for interactive UI.
  - Server Components by default for data fetching.
- **Data Fetching**: Prefer Server Actions (`actions/`) or direct Supabase calls in Server Components.
- **State**: React `useState`/`useReducer` for local state; URL search params for shareable state.

## ANTI-PATTERNS (THIS PROJECT)
- **SECURITY RISK**: `lib/google-key.json` is tracked in git. **DO NOT COMMIT SECRETS.** Use env vars (`.env.local`).
- **NO** direct DOM manipulation (use React refs).
- **NO** inline styles (use Tailwind).
- **NO** `any` types (strict mode is enabled, fix type errors).
- **NO** client-side secret usage (Supabase keys must be public-safe or server-only).

## COMMANDS
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
```

## NOTES
- **Env**: Requires `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Google Auth**: Currently using a JSON key file (Legacy/Risky). Plan migration to Env Vars.
- **Dependencies**: `sonner` (toasts), `recharts` (charts), `xlsx` (Excel export).
