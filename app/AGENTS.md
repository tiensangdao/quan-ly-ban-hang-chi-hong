# APP ROUTER KNOWLEDGE BASE

## OVERVIEW
Core application logic using Next.js 16 App Router.

## STRUCTURE
```
app/
├── test-sheets/     # Integration test route for Google Sheets
├── layout.tsx       # Root layout (Fonts, Metadata, Hydration fix)
├── page.tsx         # Landing page (Client Component)
└── globals.css      # Tailwind v4 global styles
```

## WHERE TO LOOK
| Feature | File/Folder | Responsibility |
|---------|-------------|----------------|
| **Root Layout** | `layout.tsx` | Global styles, fonts, `suppressHydrationWarning`. |
| **Home Page** | `page.tsx` | Main UI. Fetches data via Supabase client. |
| **Integration Test** | `test-sheets/page.tsx` | Form to test Google Sheets sync. |

## CONVENTIONS
- **Hydration**: `layout.tsx` uses `suppressHydrationWarning` to handle browser extension mismatches.
- **Components**:
  - `page.tsx` is Client Component (`'use client'`).
  - `test-sheets/page.tsx` is Client Component calling Server Action.

## ANTI-PATTERNS
- **NO** logic-heavy layouts.
- **NO** direct database calls in Client Components (use Supabase client or Server Actions).
