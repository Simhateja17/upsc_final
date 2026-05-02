---
last_mapped: 2026-04-29
focus: arch
---

# Architecture

## Overview

The project is a **Next.js 14 App Router** frontend paired with a standalone **Express.js backend** (`upsc_backend/`). Authentication is handled by Supabase Auth (JWT via PKCE flow), while application data is stored in PostgreSQL (accessed via Prisma in the backend). The frontend communicates with the backend through a REST API layer, with one exception: the **Test Series** module is implemented entirely within Next.js API Routes talking directly to Supabase.

## Architectural Pattern

**Pattern:** Layered client-server with dual API gateways

- **Frontend (Next.js):** Presentation layer + lightweight API gateway for test-series
- **Backend (Express):** Primary business logic layer, cron jobs, AI services, file processing
- **Database (PostgreSQL):** Primary data store via Prisma ORM
- **Auth (Supabase Auth):** External identity provider with JWT propagation to both frontend and backend

**Key Characteristics:**
- Frontend pages are mostly Client Components (`'use client'`) with route-level layouts
- Backend uses classic MVC-ish pattern: routes → controllers → services
- Two separate API surfaces: Next.js App Router API (`/app/api/*`) and Express REST API (`/api/*` on backend port)
- Auth state is synchronized across Supabase client, localStorage tokens, and backend user records

## System Layers

### Presentation Layer
- **Location:** `app/*` (Next.js App Router pages), `components/*`
- **Responsibilities:**
  - Landing page (`app/page.tsx`) renders static HTML iframe for marketing site
  - Dashboard (`app/dashboard/*`) with nested route layouts
  - Admin panel (`app/admin/*`) with role-guarded layout
  - Login/auth flows (`app/login/page.tsx`, `app/auth/callback/page.tsx`)
- **Patterns:**
  - Route groups use `layout.tsx` for shared shell (header + sidebar)
  - `not-found.tsx` and `error.tsx` at root level for boundary handling
  - Heavy use of `use client` for interactivity; minimal Server Components

### Business Logic Layer
- **Frontend:** `lib/services.ts`, `lib/auth.ts`, `contexts/AuthContext.tsx`, `hooks/*`
- **Backend:** `upsc_backend/src/controllers/`, `upsc_backend/src/services/`, `upsc_backend/src/jobs/`
- **Responsibilities:**
  - `lib/services.ts` — 800+ line service aggregator exposing domain APIs (dashboard, daily MCQ, mock tests, study planner, AI chat, etc.)
  - `lib/auth.ts` — Supabase auth wrapper with token persistence and backend sync
  - `contexts/AuthContext.tsx` — React Context for auth state, session recovery, and redirect logic
  - Backend controllers — request validation, orchestration, and response formatting
  - Backend services — AI evaluation, RSS scraping, PDF parsing, embedding generation, email

### Data Layer
- **Frontend:** `lib/supabase.ts`, `lib/supabase-admin.ts`, `lib/api.ts`
- **Backend:** `upsc_backend/src/config/database.ts`, `upsc_backend/src/config/supabase.ts`
- **Responsibilities:**
  - Supabase client for auth and real-time (frontend)
  - Supabase admin client for RLS-bypass DB operations (test-series API routes)
  - Prisma + PostgreSQL pool for backend data access
  - Supabase Storage for file uploads (PDFs, images)

## Data Flow

### Standard Request Path (Dashboard / Daily MCQ / Mock Tests / AI Chat)

1. **User action** triggers a service method in `lib/services.ts`
2. Service calls `api.get/post/put/patch/delete()` from `lib/api.ts`
3. `lib/api.ts` fetches the Express backend at `NEXT_PUBLIC_API_URL` with Bearer token from `localStorage`
4. **Express backend** receives request, `auth.middleware.ts` verifies Supabase JWT via `jose` + remote JWKS
5. Middleware looks up (or auto-creates) user in `users` table via Supabase REST API
6. Request reaches **controller** → calls **Prisma** → returns JSON
7. Frontend updates React state → UI re-renders

### Test Series Request Path

1. **User action** triggers `testSeriesService` in `lib/services.ts`
2. Service calls `fetch('/api/test-series/...')` — hits **Next.js App Router API**
3. API route handler (`app/api/test-series/[seriesId]/route.ts`) uses `getSupabaseAdmin()`
4. Supabase admin client queries PostgreSQL directly via Supabase REST API
5. Response returns as `{ status, data, message }` JSON

### Auth Flow

1. User logs in via `authService.login()` → Supabase Auth `signInWithPassword`
2. Tokens stored in `localStorage` (`accessToken`, `refreshToken`)
3. `syncUserToBackend()` posts to `/auth/callback` to sync/create user in Prisma DB
4. `AuthContext` subscribes to `supabase.auth.onAuthStateChange` for session lifecycle
5. All API calls include Bearer token; backend independently verifies JWT

## Key Abstractions

### `api.ts` — HTTP Client
- **Location:** `lib/api.ts`
- **Pattern:** Thin wrapper around `fetch` with timeout (`AbortController`), JSON parsing, and Bearer token injection
- **Returns:** `{ status, data, message }` envelope

### `services.ts` — Service Aggregator
- **Location:** `lib/services.ts`
- **Pattern:** Domain-organized object literals (`dashboardService`, `dailyMcqService`, `mockTestService`, `adminService`, etc.)
- **Note:** Most services call the Express backend, except `testSeriesService` which calls Next.js internal API routes

### AuthContext
- **Location:** `contexts/AuthContext.tsx`
- **Pattern:** React Context + `useCallback` for stable references
- **Features:** Session recovery on mount, retry logic for `getMe()`, offline safety timeout (5s), fallback to Supabase session metadata

### Prisma Client with pg Adapter
- **Location:** `upsc_backend/src/config/database.ts`
- **Pattern:** Singleton Prisma client using `@prisma/adapter-pg` with custom DNS resolution (forced IPv4)
- **Pool config:** max 10, idle timeout 60s, connection timeout 15s, keep-alive enabled

### Supabase Admin Clients
- **Frontend test-series:** `lib/supabase-admin.ts` — lazy-initialized singleton with service role key
- **Backend:** `upsc_backend/src/config/supabase.ts` — three clients: public, admin (RLS bypass), and storage-only (no IPv4 agent for TUS compatibility)

## Entry Points

| Entry Point | Purpose |
|-------------|---------|
| `app/page.tsx` | Landing page — redirects authenticated users to `/dashboard` or `/admin` |
| `app/layout.tsx` | Root layout — fonts, global CSS, `AuthProvider` wrapper |
| `app/dashboard/layout.tsx` | Dashboard shell — auth guard, sidebar, streak milestones |
| `app/admin/layout.tsx` | Admin shell — role verification (`admin`), admin sidebar |
| `app/login/page.tsx` | Auth page — login/signup/forgot-password with Google OAuth |
| `app/auth/callback/page.tsx` | OAuth callback — exchanges Supabase session, syncs to backend |
| `upsc_backend/src/index.ts` | Express server — middleware, route mounting, cron scheduler, startup jobs |
| `upsc_backend/src/routes/index.ts` | API router — mounts all domain routes under `/api` |

## Module Boundaries

### Frontend Modules
- **app/** — Route segments mirroring URL structure; each folder is a page or layout
- **components/** — Shared React components; `components/admin/` for admin-specific UI
- **lib/** — Utilities and service layer; `lib/test-series/` isolated for Next.js API route helpers
- **hooks/** — Minimal; currently only CMS content hook with in-memory caching
- **contexts/** — React contexts; only AuthContext at this time
- **types/** — Shared TypeScript definitions (minimal)

### Backend Modules
- **routes/** — Express route definitions (thin, delegate to controllers)
- **controllers/** — Request/response handling; `controllers/admin/` for admin operations
- **services/** — Business logic: AI evaluation, scraping, embedding, email, PDF parsing
- **middleware/** — Auth, rate limiting, error handling, request ID, upload handling
- **jobs/** — Cron-scheduled tasks (editorial scraping, news syncing)
- **config/** — Environment, database, Supabase, Redis, LLM, logger, storage initialization
- **prisma/** — Schema, migrations, seeds

## State Management

**Authentication State:**
- `AuthContext` is the single source of truth for user identity and role
- Supabase `onAuthStateChange` drives session lifecycle (sign-in, sign-out, token refresh)
- Tokens persisted to `localStorage` for API call authorization
- Backend independently verifies JWT on every request; does not rely on session cookies

**UI / Local State:**
- React `useState` and `useRef` for component-level state
- `useCmsContent` hook provides a client-side in-memory cache (5-min TTL) for CMS page content
- No global state library (Zustand, Redux, Jotai) detected

**Server State:**
- Data fetching via service methods in `lib/services.ts`
- No React Query / SWR / RTK Query detected; manual `useEffect` + `useState` patterns used
- File uploads bypass `api.ts` and use raw `fetch` with `FormData`

## Architectural Constraints

- **Dual API surface:** Test Series uses Next.js API Routes + Supabase direct; everything else uses Express backend. This split requires maintaining two different auth verification paths (Supabase admin REST vs. Express JWT middleware).
- **IPv4 enforcement:** Both frontend and backend force IPv4 DNS resolution for Supabase connectivity due to Node.js v22+ dual-stack issues.
- **Client Components dominance:** Nearly all interactive pages are `'use client'`, reducing benefits of Next.js Server Components and streaming.
- **Backend cold-start dependency:** Editorial scraper runs immediately on Express startup to compensate for Render free-tier spin-down killing cron jobs.
- **Prisma v7 + pg adapter:** Uses direct PostgreSQL connection pooler (`DIRECT_URL`) instead of standard `DATABASE_URL` with pgbouncer flag.
