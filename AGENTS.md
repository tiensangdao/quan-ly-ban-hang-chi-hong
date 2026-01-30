# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-30
**Branch:** main

## OVERVIEW
Next.js 16 (App Router) e-commerce system for "Chị Hồng" using Supabase (PostgreSQL), Google Sheets Sync, and Tailwind CSS v4.

## STRUCTURE
```
./
├── app/             # Next.js App Router (pages, layouts)
├── lib/             # Shared utilities (Supabase & Google Sheets)
├── public/          # Static assets
└── next.config.ts   # Next.js config
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| **Pages** | `app/page.tsx` | Main entry point (Client Component) |
| **Layout** | `app/layout.tsx` | Root layout + Global CSS + Fonts |
| **Database** | `lib/supabase.ts` | Supabase client initialization |
| **Sync** | `lib/googleSheets.ts` | Google Sheets Server Action |
| **Sync** | `lib/googleSheets.ts` | Google Sheets API integration (Server Actions) |
| **Styles** | `app/globals.css` | Global Tailwind directives |

## CONVENTIONS
- **Imports**: Use `@/` alias (e.g., `@/lib/supabase`).
- **Styling**: Tailwind CSS v4 utility classes only.
- **Client Components**: Mark with `'use client'` at top.
- **Server Actions**: Mark with `'use server'` at top of file (e.g., `lib/googleSheets.ts`).
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
- **Env**: Requires `.env.local` with Supabase keys AND Google Service Account keys.
- **Auth**: Google Auth uses Base64 encoded private key for stability.
- **Missing**: Middleware, API routes, Type definitions.
