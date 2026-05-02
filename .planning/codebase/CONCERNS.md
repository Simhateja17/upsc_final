---
last_mapped: 2026-04-29
focus: concerns
---

# Concerns & Technical Debt

## Overview
The codebase is a Next.js 14 frontend with an Express/TypeScript backend (`upsc_backend`), using Prisma + Supabase. While functional, it carries significant technical debt: a mocked payment flow, no input validation on the API, widespread use of `any`, tokens stored in `localStorage`, and several uncommitted log/temp files sitting in the repo. The overall health is **moderate-to-poor** for a production EdTech platform handling payments and user data.

## Critical Issues

### 1. Payment Gateway is Fully Mocked
- **What:** The billing controller returns a hardcoded test key (`rzp_test_mock`) and auto-generates a fake `providerOrderId`. There is no actual Razorpay or Stripe integration.
- **Files:** `upsc_backend/src/controllers/billing.controller.ts:164`
- **Impact:** Users cannot make real payments; subscriptions are activated by simply calling the verify endpoint with `status: "success"`.
- **Fix:** Integrate a real payment provider and verify webhooks server-side.

### 2. `pdf-parse` Known Security Vulnerability
- **What:** The backend uses `pdf-parse` (v2.4.5) to extract text from PDFs. This package is unmaintained and internally uses `eval()` on parsed content, which is a remote code execution risk if a malicious PDF is uploaded.
- **Files:** `upsc_backend/src/services/chunking.service.ts`, `upsc_backend/src/services/pyqParser.ts`
- **Impact:** An attacker uploading a crafted PDF could achieve RCE on the server.
- **Fix:** Replace `pdf-parse` with `pdfjs-dist` (already in Next.js config) or a sandboxed parser like `muPDF`/`pymupdf` via a worker.

### 3. OpenAI SDK Version Mismatch / Suspicious Version
- **What:** Both frontend and backend declare `"openai": "^6.33.0"` / `"^6.34.0"`. The official `openai` npm package has no v6 release (latest stable is v4.x). This points to a possible typo, a private fork, or a supply-chain risk.
- **Files:** `package.json:22`, `upsc_backend/package.json:52`
- **Impact:** Unpredictable behavior, potential broken installs, or a compromised package.
- **Fix:** Pin to the latest stable `openai` v4 release and audit lockfile entries.

### 4. JWT Tokens Stored in `localStorage`
- **What:** `lib/auth.ts` stores `accessToken` and `refreshToken` in `localStorage`. The frontend then attaches these to every API call.
- **Files:** `lib/auth.ts:42-62`
- **Impact:** Any XSS vulnerability gives an attacker immediate access to bearer tokens, bypassing httpOnly cookie protections.
- **Fix:** Move token storage to httpOnly secure cookies managed by the backend or Supabase auth session.

## Technical Debt

| Area | Issue | Severity | Location |
|------|-------|----------|----------|
| Backend Validation | Zod validation middleware exists but is **not used** in any route. All controllers destructure `req.body` directly without schema checks. | High | `upsc_backend/src/middleware/validate.ts` (unused), all `*.controller.ts` |
| Backend Auth Logging | Auth middleware logs authenticated user emails to stdout (`console.log`). PII leakage risk. | Med | `upsc_backend/src/middleware/auth.middleware.ts:183` |
| Frontend Types | Widespread use of `: any` in admin pages and catch blocks, disabling TypeScript safety. | Med | `app/admin/**/*.tsx` (dozens of instances) |
| Frontend Size | Multiple page components exceed 1,000 lines (poor separation of concerns). | Med | `app/dashboard/pyq/page.tsx` (1,710), `app/dashboard/study-planner/page.tsx` (1,585), `app/login/page.tsx` (1,473) |
| Console Noise | Dozens of `console.log`, `console.error`, and `console.warn` calls remain in production code. | Low | `app/admin/pyq/page.tsx`, `app/dashboard/**/*.tsx`, `upsc_backend/src/middleware/*.ts` |
| Hardcoded URLs | API base URL falls back to `http://localhost:5001/api` in many places. | Low | `lib/api.ts:2`, `lib/services.ts` (multiple lines) |
| Image Optimization | `eslint-disable-next-line @next/next/no-img-element` is used ~30 times, bypassing Next.js Image optimization. | Low | `app/dashboard/**/*.tsx`, `components/**/*.tsx` |
| React Hook Dep | `eslint-disable-next-line react-hooks/exhaustive-deps` used in `app/admin/billing/page.tsx:52`. | Low | `app/admin/billing/page.tsx` |
| Missing Cleanup | Several `setInterval`/`setTimeout` calls in components may not be cleared on unmount. | Med | `app/dashboard/daily-answer/challenge/attempt/evaluating/page.tsx`, `app/dashboard/pyq/page.tsx`, `app/dashboard/mock-tests/attempt/page.tsx` |

## Known Bugs

### Windows EPERM Error in Dev Log
- **Symptom:** `dev.err.log` records a `spawn EPERM` from `next-dev.js` on Windows.
- **File:** `dev.err.log`
- **Trigger:** Running `next dev` on Windows without proper permissions or antivirus interference.
- **Workaround:** Run terminal as Administrator or exclude project folder from AV.

### Mock Payment Auto-Activates Subscriptions
- **Symptom:** Calling `POST /api/billing/payment/verify` with `{ status: "success" }` immediately creates an active subscription without verifying any provider signature.
- **File:** `upsc_backend/src/controllers/billing.controller.ts:177-267`
- **Impact:** Anyone with a valid JWT can grant themselves a free subscription.

## Security Concerns

### 1. No Input Sanitization on `dangerouslySetInnerHTML`
- **Risk:** Three pages inject raw HTML without sanitization.
- **Files:**
  - `app/our-story/page.tsx:30-31` (injects raw `bodyContent`)
  - `app/admin/faqs/page.tsx:182` (renders `f.answer` directly)
  - `components/Hero.tsx:59` (renders `get('hero_title')` directly)
- **Recommendation:** Run all injected HTML through DOMPurify or switch to a safe markdown renderer.

### 2. CORS Allows Any Localhost in Development
- **Risk:** `index.ts` permits `http://localhost(:\d+)?` when `NODE_ENV=development`. If production is accidentally run in dev mode, any local malicious site can call the API.
- **File:** `upsc_backend/src/index.ts:36-50`
- **Recommendation:** Strictly restrict origins even in development; use a dedicated dev config.

### 3. No Helmet / Security Headers
- **Risk:** The Express app does not use `helmet()`, meaning no HSTS, no X-Frame-Options, no XSS-Filter, etc.
- **File:** `upsc_backend/src/index.ts`
- **Recommendation:** Add `helmet()` and a Content-Security-Policy.

### 4. Service Role Key Exposed to Frontend Build
- **Risk:** `SUPABASE_SERVICE_ROLE_KEY` is referenced in frontend route handlers (e.g., `app/api/test-series/route.ts`) and `lib/supabase-admin.ts`. While it runs server-side in Next.js API routes, any accidental client-side import would leak it.
- **Files:** `lib/supabase-admin.ts`, `app/api/test-series/route.ts`
- **Recommendation:** Audit all imports of `supabase-admin` to ensure they never traverse into client bundles.

### 5. Temporary / Log Files in Repository
- **Risk:** `dev.log` (~4MB), `dev.err.log`, `tmp.dashboard.spec.ts`, and `tmp_dashboard_check.png` are not listed in `.gitignore` and may contain sensitive runtime data or screenshots.
- **Files:** `dev.log`, `dev.err.log`, `tmp.dashboard.spec.ts`, `tmp_dashboard_check.png`
- **Recommendation:** Add `*.log`, `tmp.*`, and `test-results/` to `.gitignore`; purge from git history.

## Performance Issues

### Large Frontend Components
- **Problem:** Several dashboard pages are monolithic and exceed 1,000 lines, causing slow HMR, large JS chunks, and difficult optimization.
- **Files:**
  - `app/dashboard/pyq/page.tsx` (1,710 lines)
  - `app/dashboard/study-planner/page.tsx` (1,585 lines)
  - `app/login/page.tsx` (1,473 lines)
  - `app/dashboard/mock-tests/page.tsx` (1,346 lines)
- **Improvement path:** Extract sub-components, custom hooks, and API layer into separate files.

### Unoptimized Images
- **Problem:** `unoptimized: true` is set in `next.config.js`, and `no-img-element` ESLint rules are disabled throughout the app.
- **File:** `next.config.js:10`
- **Impact:** No image lazy-loading, resizing, or WebP conversion, leading to larger page weight.

### Backend N+1 Query Risk
- **Problem:** Several Prisma queries include deep nested `include` blocks without pagination limits (e.g., billing history pulls all payments + all subscriptions).
- **File:** `upsc_backend/src/controllers/billing.controller.ts:38-48`
- **Improvement path:** Add pagination (`take`/`skip`) and cursor-based limits to list endpoints.

## Fragile Areas

### AuthContext Race Conditions
- **Files:** `contexts/AuthContext.tsx`
- **Why fragile:** Multiple async side-effects (Supabase auth listener, backend profile fetch, localStorage sync) run concurrently without cancellation tokens. Rapid navigation can trigger state updates on unmounted components.
- **Safe modification:** Wrap async calls in `useEffect` cleanup functions and add an `AbortController`.

### Daily Answer Polling Logic
- **Files:** `app/dashboard/daily-answer/challenge/attempt/evaluating/page.tsx`
- **Why fragile:** Uses `setInterval` with a 3-second poll loop but does not clear the interval consistently on unmount or navigation.
- **Test coverage:** No E2E or unit tests found for this polling flow.

### PDF Upload & Parsing Flow (Admin)
- **Files:** `app/admin/pyq/page.tsx`, `upsc_backend/src/services/pyqParser.ts`
- **Why fragile:** Fire-and-forget parsing with client-side polling. The backend catches parser errors with `.catch(console.error)` but does not update the upload record status, leaving the client polling indefinitely.

## Maintenance Burden

### Outdated / Risky Dependencies
- `pdf-parse` v2.4.5 — unmaintained, RCE risk.
- `string-similarity` v4.0.4 — last published 4+ years ago.
- `openai` v6.x — does not exist on npm registry; likely misconfigured.

### Duplicated API Client Logic
- **Problem:** Every service in `lib/services.ts` manually constructs `fetch` calls with Authorization headers. There is no centralized HTTP client with interceptors for retries, token refresh, or global error handling.
- **File:** `lib/services.ts`

### Copy-Paste Admin CRUD Pages
- **Problem:** All admin pages (flashcards, mindmaps, testimonials, spaced repetition) follow an identical structure but are duplicated rather than using a generic CRUD wrapper component.
- **Files:** `app/admin/*/page.tsx`

## Test Coverage Gaps

| Untested area | What's not tested | Files | Risk | Priority |
|---------------|-------------------|-------|------|----------|
| Payment flow | No integration tests for billing | `upsc_backend/src/controllers/billing.controller.ts` | Free subscription exploit | High |
| PDF parsing | No tests for `pyqParser.ts` | `upsc_backend/src/services/pyqParser.ts` | RCE, parsing failures | High |
| Auth middleware | No unit tests for JWT verification | `upsc_backend/src/middleware/auth.middleware.ts` | Auth bypass bugs | High |
| Daily answer polling | No E2E for evaluation polling | `app/dashboard/daily-answer/challenge/attempt/evaluating/page.tsx` | Memory leaks, infinite loops | Med |
| Dashboard pages | Only one Playwright screenshot test (`tmp.dashboard.spec.ts`) | `app/dashboard/**/*.tsx` | UI regressions | Med |

## Recommended Priorities

1. **Integrate real payment gateway** and remove mock `rzp_test_mock` key. Add webhook signature verification.
2. **Replace `pdf-parse`** with a secure, maintained PDF text extractor (e.g., `pdfjs-dist` in a sandboxed worker).
3. **Audit and fix `openai` package version** — downgrade to the latest v4 stable release.
4. **Move JWT tokens from `localStorage` to httpOnly cookies** to mitigate XSS token theft.
5. **Enable Zod validation** on all backend routes; write schemas for every controller.
6. **Purge committed log/temp files** from the repo and update `.gitignore`.
7. **Add Helmet and CSP** to the Express server.
8. **Refactor largest frontend pages** (>1,000 lines) into smaller hooks and components.
9. **Sanitize all `dangerouslySetInnerHTML`** inputs before rendering.
10. **Write unit tests** for auth middleware, billing controller, and PDF parser services.
