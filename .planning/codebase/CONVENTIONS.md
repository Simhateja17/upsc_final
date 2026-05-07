---
last_mapped: 2026-04-29
focus: quality
---

# Coding Conventions

## Code Style

**Linting:** ESLint with `next/core-web-vitals` (`eslint-config-next` v14.1.0).
- Config: `.eslintrc.json`
- Custom rules:
  - `react/no-unescaped-entities`: `warn`
  - `react-hooks/exhaustive-deps`: `warn`

**Formatting:** No Prettier, Biome, or other formatter config detected. Formatting relies on developer/editor discipline.

**TypeScript:** Strict mode enabled.
- Config: `tsconfig.json`
- `strict: true`, `noEmit: true`, `isolatedModules: true`
- Target: `es5`, Module: `esnext`, ModuleResolution: `bundler`
- Path alias: `@/*` → `./*`

## Naming Conventions

- **Components:** PascalCase files and exports
  - Examples: `Hero.tsx`, `PurchaseModal.tsx`, `AdminSidebar.tsx`
  - Pattern: `export default function PurchaseModal(props: PurchaseModalProps)`

- **Hooks:** `use` prefix + PascalCase file
  - Example: `hooks/useCmsContent.ts`
  - Pattern: `export function useCmsContent(slug: string, defaults: CmsContent = {})`

- **Utilities / Services:** camelCase
  - Examples: `lib/api.ts`, `lib/auth.ts`, `lib/services.ts`
  - Service objects: `authService`, `dashboardService`, `testSeriesService`

- **Types / Interfaces:** PascalCase
  - Examples: `interface ToastProps`, `interface User`, `type MilestoneType`
  - Props interfaces named `{ComponentName}Props`

- **API Routes:** kebab-case path segments, handler names match HTTP method
  - Example: `app/api/test-series/route.ts` exports `GET`, `POST`

- **Repositories / Mappers:** camelCase functions
  - Example: `lib/test-series/repo.ts` — `countTestsPerSeries`, `listSeriesRows`

## TypeScript Patterns

- Strict typing enforced; avoid `any` where possible (though `any` appears in service return types like `api.get<any>` for rapid development).
- Props typed via inline interfaces or `type` aliases co-located with components.
- Utility types from `next/font/google` used for font configuration.
- `typeof window === 'undefined'` guards for localStorage and window access.

## Component Patterns

**Server vs Client Components:**
- Default is Server Component (no directive).
- Client components explicitly marked with `'use client'` at top of file.
- Majority of pages and components are Client Components due to heavy interactivity needs.
- Layouts like `app/layout.tsx` are Server Components; `app/admin/layout.tsx` is Client Component for auth-gated routing.

**Functional Components:**
- All components are functional (no class components).
- Default export pattern dominates.
- Props destructured in function signature.

**Props Interfaces:**
```tsx
interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  autoCloseDuration?: number;
}

export default function Toast({ message, type, onClose, autoCloseDuration = 3000 }: ToastProps) {
```

**React Import Styles:**
- `import React from 'react';` — when JSX is used or React namespace needed
- `import { useState, useEffect } from 'react';` — when only hooks needed
- `import type { CSSProperties } from 'react';` — when only types needed

## Error Handling

**API Layer (`lib/api.ts`):**
- Native `fetch` wrapped with `AbortController` for timeouts (default 15s).
- Errors thrown as `Error` with backend message or HTTP status.
- `try/catch` clears timeout and rethrows with friendly messages (e.g., "Request timeout — backend server may be unavailable").

**Service Layer (`lib/services.ts`):**
- Service methods generally throw errors to callers.
- Some methods have retry/fallback logic (e.g., `dashboardService.getTestAnalytics` attempts token refresh on auth errors).
- Upload methods use raw `fetch` for `FormData` and throw on non-OK responses.

**Component Layer:**
- Async handlers wrapped in `try/catch`.
- Errors logged via `console.error` or `console.warn`.
- UI fallbacks: loading spinners, empty states, toast notifications.
- Auth errors suppressed in `lib/supabase.ts` for offline scenarios (network disconnection errors silently ignored).

**Auth Context (`contexts/AuthContext.tsx`):**
- Graceful degradation: if `/auth/me` fails, falls back to Supabase session metadata.
- Safety timeout (5s) prevents infinite loading on auth initialization.

## Data Fetching

**Pattern 1: Custom API Client + Service Layer**
- `lib/api.ts` — lightweight `fetch` wrapper with generic typing.
- `lib/services.ts` — domain-organized service objects (dashboard, dailyMcq, mockTest, etc.).
- No SWR, React Query, or TanStack Query detected.

**Pattern 2: Next.js API Routes (for local data)**
- `app/api/test-series/route.ts` — Server-side API routes using Supabase admin client.
- Route handlers use `NextRequest`/`NextResponse` from `next/server`.

**Pattern 3: Client-side `useEffect`**
- Common pattern: `useState` for data/loading/error, `useEffect` with async IIFE.
- `Promise.allSettled` used for parallel independent fetches.

**Pattern 4: Hook with Cache**
- `hooks/useCmsContent.ts` — custom hook with in-memory deduplicated cache and TTL (5 minutes).

## Import Organization

**Typical order observed:**
1. `'use client'` directive (if needed)
2. React imports
3. Next.js imports (`next/link`, `next/navigation`, `next/font/google`)
4. Third-party libraries (`@supabase/supabase-js`, `@tiptap/react`)
5. Local utilities via `@/` alias (`@/lib/services`, `@/components/Toast`, `@/contexts/AuthContext`)

**Path Aliases:**
- `@/*` maps to `./*` (repo root)
- Used consistently for all cross-directory imports

## File Organization

```
app/               # Next.js App Router pages (route segments)
  admin/           # Admin dashboard pages (all client components)
  api/             # API route handlers (server-side)
  dashboard/       # User dashboard pages
  (marketing)/     # Public marketing pages (privacy, terms, faq, etc.)
components/        # React components
  admin/           # Admin-specific components
  (root level)     # Shared/global components (Hero, Header, Footer, etc.)
contexts/          # React context providers (AuthContext)
hooks/             # Custom React hooks (useCmsContent)
lib/               # Utilities, API clients, services
  test-series/     # Domain-specific modules (repo, mappers, auth)
data/              # Static data (syllabus JSONs)
types/             # Shared TypeScript type definitions
styles/            # Global CSS files
public/            # Static assets
```

**Where to add new code:**
- New page → `app/{route}/page.tsx`
- New shared component → `components/{ComponentName}.tsx`
- New admin component → `components/admin/{ComponentName}.tsx`
- New API client method → `lib/services.ts` in appropriate service object
- New custom hook → `hooks/use{Feature}.ts`
- New shared type → `types/{feature}.ts` or inline near usage

## Styling Conventions

**Tailwind CSS:** Configured in `tailwind.config.ts`
- Custom fonts defined as CSS variables (`--font-geist`, `--font-playfair`, etc.)
- Custom colors (`cta-yellow`), font sizes (`hero-heading`), background images, box shadows
- Utility classes used extensively alongside inline `style` props for precise design system values

**Inline Styles:**
- Used heavily for pixel-perfect values (clamp, specific colors, gradients) that exceed Tailwind utility coverage.
- Common pattern: `style={{ fontSize: 'clamp(1rem, 1.8vw, 32px)' }}`

**CSS:**
- Global styles in `app/globals.css`
- Keyframe animations defined inline within components (`<style>{`@keyframes spin { ... }`}</style>`)

## Anti-Patterns Observed

**Heavy use of `any` in service returns:**
- `lib/services.ts` uses `api.get<any>` and `api.post<any>` extensively.
- Fix: Define domain-specific response interfaces in `types/` and replace `any`.

**Inline style objects in large components:**
- Some components (e.g., `app/dashboard/test-series/page.tsx`) have hundreds of lines of inline style objects.
- Fix: Extract to CSS modules, styled-components, or Tailwind class compositions.

**TODO comments in source:**
- `app/dashboard/test-series/[id]/page.tsx:448` — `const isEnrolled = false; // TODO: Check from auth context`
- Fix: Implement TODO or track in issue tracker.
