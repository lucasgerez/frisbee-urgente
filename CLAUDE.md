# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server (Vite)
npm run build     # tsc + vite build
npm run preview   # preview production build
```

No test runner is configured.

## Stack

- **React 18 + Vite + TypeScript** — SPA, no SSR
- **Tailwind CSS** — styling; custom color tokens like `cobalt-600`, `gold-400` defined in config
- **React Router v6** — `createBrowserRouter`, nested under `AppShell` (Header + BottomNav)
- **TanStack Query v5** — all data fetching; query client in `src/lib/queryClient.ts`
- **Supabase** — Postgres + Auth + Row Level Security (RLS)

## Architecture

### Data flow
Hooks in `src/hooks/` own all Supabase queries and mutations via `useQuery`/`useMutation`. Pages call hooks; hooks call `supabase` directly. No separate service layer.

### Auth and roles
`useAuth` (context in `src/hooks/useAuth.tsx`) exposes `isAdmin`, `isEditor`, `canManage`, `role`. Roles come from `app_metadata.role` in the Supabase JWT — **not a database table**. The values are `"admin"`, `"editor"`, or absent (read-only). Helper functions live in `src/lib/auth.ts`.

RLS policies enforce roles server-side via `public.is_editor()` / `public.is_admin()` functions that read `auth.jwt() -> 'app_metadata' ->> 'role'`.

To assign a role, run in the Supabase SQL editor:
```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
where email = 'user@example.com';
```

### Migrations
All schema changes live in `supabase/migrations/` as numbered SQL files. Apply them in order via the Supabase SQL editor.

### Types
`src/types/database.ts` contains all TypeScript types for DB rows and joined shapes. The `supabase` client in `src/lib/supabase.ts` is untyped (no generic `Database` parameter) — cast results manually using these types.
