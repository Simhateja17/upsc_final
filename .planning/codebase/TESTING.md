---
last_mapped: 2026-04-29
focus: quality
---

# Testing

## Overview

Testing is minimal in this codebase. There is no formal test suite integrated into the build pipeline, no unit test runner configured, and only a single ad-hoc Playwright spec file exists. The project relies primarily on manual QA, linting, and TypeScript compilation for quality assurance.

## Test Framework

**E2E / Integration:**
- **Playwright** (used ad-hoc)
- Evidence: `tmp.dashboard.spec.ts` imports from `@playwright/test`
- No `playwright.config.ts` or Playwright dependency in `package.json` (may be installed globally)

**Unit Testing:**
- **Not configured.**
- No Jest, Vitest, Mocha, or other unit test runner in `package.json`.
- No test scripts defined.

## Test Structure

**File Locations:**
- Ad-hoc test at repository root: `tmp.dashboard.spec.ts`
- No dedicated `tests/`, `e2e/`, or `__tests__/` directories.

**Naming Convention:**
- Playwright spec: `tmp.dashboard.spec.ts`
- Pattern observed: `{name}.spec.ts`

## Test Types

| Type | Framework | Location | Coverage |
|------|-----------|----------|----------|
| E2E | Playwright (ad-hoc) | `tmp.dashboard.spec.ts` (repo root) | Minimal — single smoke test |
| Unit | Not configured | N/A | None |
| Integration | Not configured | N/A | None |
| Component | Not configured | N/A | None |

## Playwright E2E Test Details

**File:** `tmp.dashboard.spec.ts`

**What it tests:**
- End-to-end user journey: signup → login → dashboard navigation → visual regression screenshot
- DOM assertion checklist for dashboard UI elements (Practice Test button, Schedule button, Focus Timer, Study Planner, Smart Revision Tools, Daily MCQ / Daily Mains labels)

**Pattern observed:**
```typescript
import { test, expect } from '@playwright/test';

test('dashboard screenshot issues verification', async ({ page }) => {
  const email = `qa_${Date.now()}@example.com`;
  const password = 'Qatest@12345';

  await page.goto('http://localhost:3000/login?tab=signup', { waitUntil: 'domcontentloaded' });
  // ... fill forms, click buttons, wait for timeouts ...
  await page.screenshot({ path: 'tmp_dashboard_auth_check.png', fullPage: true });

  const checklist: Record<string, boolean> = {};
  checklist['practice_test_button_present'] = (await page.getByText(/Practice Test/i).count()) > 0;
  // ... more assertions ...
  console.log('CHECKLIST_JSON', JSON.stringify(checklist));
});
```

**Characteristics:**
- Uses hardcoded timeouts (`page.waitForTimeout(1000)`, `page.waitForTimeout(5000)`) rather than waiting for specific selectors/states.
- Uses conditional element checks (`if (await first.count())`) for defensive DOM interaction.
- Generates dynamic test data (`Date.now()` email) to avoid conflicts.
- Outputs checklist to console for external parsing.

## Mocking

**Not formally implemented.**
- No mocking framework (MSW, jest.mock, vitest.fn, sinon) detected.
- API calls in components hit real backend or Supabase in development.
- `lib/api.ts` uses native `fetch` against `NEXT_PUBLIC_API_URL`.

**Where mocking would be needed:**
- `lib/services.ts` — all service objects
- `lib/supabase.ts` — Supabase client
- `contexts/AuthContext.tsx` — auth state and session

## Test Data

**No fixtures or factories detected.**
- The Playwright test creates its own data (random email, hardcoded password).
- No seed scripts or test data JSONs in the frontend.
- Backend has `prisma/seed-cms.ts` for CMS seeding, but this is for development, not tests.

## CI Integration

**File:** `.github/workflows/deploy.yml`

**Quality gates run on every push to `main`:**
```yaml
jobs:
  quality-gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - name: Lint
        run: npm run lint
      - name: Type-check & Build
        run: npm run build
```

**Observations:**
- Linting (`next lint`) and build (`next build`) act as the only automated quality checks.
- No test execution step in CI.
- Deploy only runs if `quality-gates` job succeeds.

## Coverage

**Current coverage status: None.**
- No coverage tool (Istanbul, c8, vitest coverage) configured.
- No coverage thresholds or reports generated.

## Backend Testing

**Project:** `upsc_backend/`

- No test files in `upsc_backend/src/`.
- `package.json` has no test script.
- Backend quality gate is `npm run lint` (`tsc --noEmit`).

## Recommendations

**Priority 1 — Add unit test runner:**
- Install **Vitest** (fast, Vite-compatible, works well with Next.js 14).
- Configure in `vitest.config.ts` with `@/` alias resolution.

**Priority 2 — Add component tests:**
- Use **@testing-library/react** + Vitest for component unit testing.
- Start with critical shared components: `Toast.tsx`, `PurchaseModal.tsx`, auth flows.

**Priority 3 — Formalize E2E:**
- Move `tmp.dashboard.spec.ts` into an `e2e/` directory.
- Add `playwright.config.ts` and `@playwright/test` to `devDependencies`.
- Replace arbitrary timeouts with explicit wait conditions.
- Add E2E step to CI workflow.

**Priority 4 — Add API mocking for tests:**
- Use **MSW (Mock Service Worker)** to mock `lib/api.ts` and Supabase calls.
- Enables offline, deterministic frontend tests.

**Priority 5 — Coverage gating:**
- Add `vitest --coverage` with `@vitest/coverage-v8`.
- Set minimum thresholds (e.g., 60% branches, 70% functions) and enforce in CI.
