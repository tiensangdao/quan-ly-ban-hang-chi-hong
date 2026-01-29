# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-30
**Commit:** 8a62643
**Branch:** main

## OVERVIEW
Next.js 16 (App Router) e-commerce system for "Chị Hồng" using Supabase (PostgreSQL) and Tailwind CSS v4.

## STRUCTURE
```
./
├── app/             # Next.js App Router (pages, layouts)
├── lib/             # Shared utilities (Supabase client)
├── public/          # Static assets
└── next.config.ts   # Next.js config
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| **Pages** | `app/page.tsx` | Main entry point (Client Component) |
| **Layout** | `app/layout.tsx` | Root layout + Global CSS + Fonts |
| **Database** | `lib/supabase.ts` | Supabase client initialization |
| **Styles** | `app/globals.css` | Global Tailwind directives |

## CONVENTIONS
- **Imports**: Use `@/` alias (e.g., `@/lib/supabase`).
- **Styling**: Tailwind CSS v4 utility classes only.
- **Client Components**: Mark with `'use client'` at top.
- **Strict Mode**: No `any` types allowed (fix pending).

## ANTI-PATTERNS (THIS PROJECT)
- **NO** raw CSS files (use Tailwind).
- **NO** `src/` directory (moved to root `app/`).
- **NO** inline API keys (use `process.env.NEXT_PUBLIC_*`).
- **NO** direct DOM manipulation (use React refs/state).

## COMMANDS
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
```

## NOTES
- **Missing**: Middleware, API routes, Type definitions.
- **Critical**: `lib/types.ts` needed for Supabase tables.
- **Env**: Requires `.env.local` with Supabase keys.
