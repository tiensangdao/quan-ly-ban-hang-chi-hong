# LIBRARY KNOWLEDGE BASE

## OVERVIEW
Shared utilities for database connections (Supabase) and external service integrations (Google Sheets).

## STRUCTURE
```
lib/
├── googleSheets.ts  # Google Sheets API integration (Server Actions)
├── supabase.ts      # Supabase client initialization
└── google-key.json  # [IGNORED] Local dev key (do not commit)
```

## WHERE TO LOOK
| Feature | File | Responsibility |
|---------|------|----------------|
| **Database** | `supabase.ts` | Exports `supabase` client. Handles env missing fallback. |
| **Sync** | `googleSheets.ts` | `appendToSheet` Server Action. Handles Auth (Base64/Raw). |

## CONVENTIONS
- **Server Actions**: `googleSheets.ts` MUST use `'use server'` to protect secrets.
- **Environment Variables**:
  - `NEXT_PUBLIC_SUPABASE_*` for client-side DB access.
  - `GOOGLE_*` for server-side Sheets access.
- **Security**:
  - NEVER commit JSON keys.
  - Use `GOOGLE_PRIVATE_KEY_BASE64` for robust multi-platform auth.
  - `googleSheets.ts` contains fallback logic for robust key parsing.

## ANTI-PATTERNS
- **NO** importing `googleapis` in Client Components (breaks build).
- **NO** hardcoding secrets in code (use `.env.local`).
