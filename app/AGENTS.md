# APP ROUTER KNOWLEDGE BASE

## OVERVIEW
Core application logic using Next.js 16 App Router with Server-First architecture.

## STRUCTURE
```
app/
├── (auth)/          # Auth-related routes (grouped)
├── (dashboard)/     # Main application features
├── api/             # Route Handlers (Server-side only)
├── components/      # App-specific UI components
├── layout.tsx       # Root layout & providers
├── page.tsx         # Landing page (Client Component)
└── globals.css      # Tailwind v4 global styles
```

## WHERE TO LOOK
| Feature | File/Folder | Responsibility |
|---------|-------------|----------------|
| **Routing** | `app/**/page.tsx` | Defines unique routes |
| **Layouts** | `app/**/layout.tsx` | Shared UI & state across routes |
| **Loading** | `app/**/loading.tsx` | Instant loading states (Suspense) |
| **Errors** | `app/**/error.tsx` | Error boundaries for segments |
| **Metadata** | `layout.tsx` | SEO and document head config |

## CONVENTIONS
- **Server Components**: Default. Use for data fetching (Supabase).
- **Client Components**: Use `'use client'` ONLY for interactivity/hooks.
- **Data Fetching**: Prefer Server Components + `async/await`.
- **Route Groups**: Use `(folder)` to organize without affecting URL.
- **Private Folders**: Use `_folder` to exclude from routing.

## ANTI-PATTERNS
- **NO** `'use client'` at the top of every file.
- **NO** fetching data in Client Components if possible.
- **NO** large component trees in `layout.tsx` (keep it lean).
- **NO** direct use of `window` or `document` without checking.
- **NO** mixing business logic with UI in `page.tsx`.
