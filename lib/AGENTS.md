# LIBRARY & UTILITIES KNOWLEDGE BASE

**Generated:** 2026-01-31
**Context**: Shared utilities for Database and External Services.

## OVERVIEW
Contains core infrastructure code for Supabase connection and Google Sheets synchronization.

## STRUCTURE
```
lib/
├── googleSheets.ts   # Google Sheets API integration (Server Actions)
├── setupSheet.ts     # Sheet initialization logic
├── supabase.ts       # Supabase client singleton
├── utils.ts          # Generic helper functions
└── google-key.json   # [CRITICAL WARNING] Service Account Credentials (TRACKED IN GIT)
```

## KEY MODULES

### Supabase (`supabase.ts`)
- **Role**: Initializes the Supabase client.
- **Usage**: Import `supabase` from `@/lib/supabase` for DB operations.
- **Pattern**: Singleton instance to prevent multiple connections.

### Google Sheets (`googleSheets.ts`)
- **Role**: Handles all interactions with Google Sheets API.
- **Key Functions**:
  - `getSheetsData()`: Fetches rows.
  - `appendRow()`: Adds new entries.
  - `updateRow()`: Modifies existing entries.
- **Auth**: Uses `google-auth-library` with `google-key.json`.
- **Must be Server Action**: Uses `'use server'` to protect secrets.

### Setup (`setupSheet.ts`)
- **Role**: Scripts to create/verify required sheet structure on startup.

## SECURITY WARNINGS
- **google-key.json**: This file contains sensitive private keys and is currently tracked in git.
  - **ACTION REQUIRED**: Migrate these credentials to `GOOGLE_SERVICE_ACCOUNT_JSON` env variable and `git rm --cached` this file.
  - **NEVER** import this file in Client Components.

## CONVENTIONS
- **Error Handling**: All async functions should wrap calls in `try/catch` and return typed results.
- **Types**: Define interfaces for Sheet row data in `utils.ts` or adjacent type files.
- **Environment Variables**:
  - `NEXT_PUBLIC_SUPABASE_*` for client-side DB access.
  - `GOOGLE_*` for server-side Sheets access.

## ANTI-PATTERNS
- **NO** importing `googleapis` in Client Components (breaks build).
- **NO** hardcoding secrets in code (use `.env.local`).
