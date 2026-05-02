---
last_mapped: 2026-04-29
focus: arch
---

# Project Structure

## Directory Layout

```
upsc/
├── app/                          # Next.js App Router pages and API routes
│   ├── (marketing)/              # Landing, pricing, contact, legal pages
│   ├── admin/                    # Admin dashboard routes
│   ├── api/                      # Next.js API routes (test-series only)
│   ├── auth/                     # OAuth callback
│   ├── dashboard/                # User dashboard routes
│   ├── login/                    # Auth page
│   ├── layout.tsx                # Root layout (fonts, AuthProvider)
│   ├── page.tsx                  # Landing page / redirector
│   ├── globals.css               # Global styles
│   ├── error.tsx                 # Error boundary
│   └── not-found.tsx             # 404 page
│
├── components/                   # React components
│   ├── admin/                    # Admin-specific components
│   ├── DashboardHeader.tsx
│   ├── Sidebar.tsx
│   ├── PerformanceStatsWidget.tsx
│   └── ... (40+ components)
│
├── contexts/                     # React contexts
│   └── AuthContext.tsx           # Auth state provider
│
├── data/                         # Static data files
│   └── syllabus/                 # Syllabus JSONs
│
├── hooks/                        # Custom React hooks
│   └── useCmsContent.ts          # CMS content with caching
│
├── lib/                          # Utilities, clients, services
│   ├── api.ts                    # Fetch wrapper
│   ├── auth.ts                   # Supabase auth + token storage
│   ├── services.ts               # Domain service aggregator
│   ├── supabase.ts               # Supabase browser client
│   ├── supabase-admin.ts         # Supabase service-role client
│   └── test-series/              # Test-series API helpers
│       ├── auth.ts
│       ├── mappers.ts
│       └── repo.ts
│
├── public/                       # Static assets
│   ├── icons/
│   └── ... images, logos
│
├── styles/                       # Additional CSS
├── supabase/                     # Supabase SQL schemas
│   └── test-series-schema.sql
│
├── types/                        # Shared TypeScript types
│   └── test-series.ts
│
├── upsc_backend/                 # Express.js backend API
│   ├── prisma/
│   │   ├── schema.prisma         # Prisma data model
│   │   ├── migrations/           # Prisma migrations
│   │   └── seed*.ts              # Seed scripts
│   ├── src/
│   │   ├── index.ts              # Express entry point
│   │   ├── config/               # Env, DB, Supabase, Redis, LLM, logger
│   │   ├── controllers/          # Route controllers
│   │   ├── jobs/                 # Cron jobs
│   │   ├── middleware/           # Auth, rate limit, error handling
│   │   ├── routes/               # Express route definitions
│   │   ├── scripts/              # One-off scripts
│   │   └── services/             # Business logic services
│   └── package.json
│
├── package.json                  # Frontend dependencies
├── next.config.js                # Next.js config (redirects, transpile)
├── tailwind.config.ts            # Tailwind CSS config
├── tsconfig.json                 # TypeScript config
└── .planning/                    # GSD planning artifacts
    └── codebase/
```

## Key Locations

| Purpose | Location |
|---------|----------|
| Next.js entry / root layout | `app/layout.tsx` |
| Landing page / auth redirect | `app/page.tsx` |
| Dashboard shell (auth guard, sidebar) | `app/dashboard/layout.tsx` |
| Admin shell (role guard) | `app/admin/layout.tsx` |
| Login / signup / OAuth | `app/login/page.tsx` |
| OAuth callback handler | `app/auth/callback/page.tsx` |
| Next.js API routes (test-series) | `app/api/test-series/**` |
| Express server entry | `upsc_backend/src/index.ts` |
| Express route mount point | `upsc_backend/src/routes/index.ts` |
| Auth middleware (JWT verification) | `upsc_backend/src/middleware/auth.middleware.ts` |
| Prisma schema | `upsc_backend/prisma/schema.prisma` |
| Database config | `upsc_backend/src/config/database.ts` |
| Frontend HTTP client | `lib/api.ts` |
| Frontend auth logic | `lib/auth.ts` |
| Frontend service layer | `lib/services.ts` |
| Auth context provider | `contexts/AuthContext.tsx` |
| CMS content hook | `hooks/useCmsContent.ts` |
| Shared components | `components/*.tsx` |
| Admin components | `components/admin/*.tsx` |
| Test-series types | `types/test-series.ts` |
| Test-series DB repo | `lib/test-series/repo.ts` |

## Naming Conventions

**Files:**
- Pages/routes: `page.tsx` inside route folder (App Router convention)
- Layouts: `layout.tsx` inside route folder
- API routes: `route.ts` inside route folder
- Components: PascalCase, e.g., `DashboardHeader.tsx`, `PerformanceStatsWidget.tsx`
- Utilities/services: camelCase, e.g., `auth.ts`, `services.ts`, `api.ts`
- Backend controllers: `*.controller.ts`
- Backend routes: `*.routes.ts`
- Backend middleware: `*.middleware.ts` or descriptive, e.g., `errorHandler.ts`

**Directories:**
- Route segments: kebab-case, e.g., `daily-answer/`, `test-series/`, `spaced-repetition/`
- Backend modules: plural nouns, e.g., `controllers/`, `routes/`, `services/`, `middleware/`

**Functions/Variables:**
- React components: PascalCase
- Hooks: `use` prefix, camelCase, e.g., `useAuth()`, `useCmsContent()`
- Service methods: camelCase within object literals, e.g., `dashboardService.getStreak()`
- API helper: lowercase HTTP verbs, e.g., `api.get()`, `api.post()`

## Route Structure

### App Router Routes (Frontend)

| Route | Purpose |
|-------|---------|
| `/` | Landing page (redirects to `/dashboard` or `/admin`) |
| `/login` | Authentication (login, signup, forgot password, Google OAuth) |
| `/auth/callback` | OAuth redirect handler |
| `/dashboard` | Main dashboard home |
| `/dashboard/daily-mcq` | Daily MCQ challenge |
| `/dashboard/daily-answer` | Daily mains answer writing |
| `/dashboard/mock-tests` | Mock test generator + attempt |
| `/dashboard/study-planner` | Study planner & calendar |
| `/dashboard/flashcards` | Flashcard practice |
| `/dashboard/mindmap` | Interactive mindmaps |
| `/dashboard/test-series` | Test series listing & attempts |
| `/dashboard/jeet-gpt` | AI chat assistant |
| `/dashboard/settings` | User settings |
| `/dashboard/profile` | User profile |
| `/dashboard/billing` | Subscriptions & billing |
| `/admin` | Admin dashboard |
| `/admin/users` | User management |
| `/admin/daily-mcq` | Daily MCQ admin |
| `/admin/test-series` | Test series admin |
| `/admin/pyq` | PYQ upload & management |
| `/admin/editorials` | Editorial management |
| `/admin/cms` | CMS page editor |
| `/pricing` | Public pricing page |
| `/contact` | Public contact page |
| `/faq` | Public FAQ |
| `/blog` | Public blog |
| `/our-story` | About page |
| `/privacy`, `/terms`, `/cookies`, `/refund` | Legal pages |

### Next.js API Routes (Internal)

| Route | Purpose |
|-------|---------|
| `GET /api/test-series` | List test series |
| `POST /api/test-series` | Create test series (admin) |
| `GET /api/test-series/stats` | Platform stats |
| `GET /api/test-series/enrolled` | User's enrolled series |
| `GET /api/test-series/:id` | Series detail + tests |
| `PUT /api/test-series/:id` | Update series (admin) |
| `DELETE /api/test-series/:id` | Delete series (admin) |
| `POST /api/test-series/:id/enroll` | Enroll in series |
| `GET /api/test-series/:id/analytics` | Series analytics |
| `GET /api/test-series/:id/tests` | List tests in series |
| `POST /api/test-series/:id/tests` | Create test (admin) |
| `GET /api/test-series/:id/tests/:testId/questions` | Test questions |
| `PUT /api/test-series/:id/tests/:testId/questions` | Upsert questions (admin) |
| `POST /api/test-series/:id/tests/:testId/submit` | Submit test answers |
| `POST /api/test-series/:id/tests/:testId/extract-pdf` | Extract PDF text |
| `POST /api/test-series/:id/tests/:testId/parse-pdf` | Parse PDF to questions |
| `POST /api/test-series/upload` | Upload asset (admin) |

### Express Backend Routes (Primary API)

Mounted under `/api` on the backend server (default `localhost:5001/api`):

| Prefix | Domain |
|--------|--------|
| `/api/auth` | Authentication (login, signup, callback, me, logout) |
| `/api/user` | Dashboard, profile, settings, streak, activity, analytics |
| `/api/daily-mcq` | Daily MCQ questions, submission, results |
| `/api/daily-answer` | Daily mains answer upload, evaluation, results |
| `/api/editorials` | Editorial articles, sync, summarize |
| `/api/mock-tests` | Mock test generation, submission, results, mains evaluation |
| `/api/study-plan` | Study planner tasks, streak, goals |
| `/api/videos` | Video lectures, quizzes, mentor questions |
| `/api/library` | Study material library, downloads |
| `/api/pricing` | Plans, orders |
| `/api/mentorship` | Testimonials, call booking |
| `/api/admin` | Admin CRUD for all domains |
| `/api/pyq` | Previous year questions (public) |
| `/api/flashcards` | Flashcard decks, topics, cards |
| `/api/spaced-repetition` | Spaced repetition items |
| `/api/mindmaps` | Mindmap subjects and data |
| `/api/test-series` | Test series (Express mirror) |
| `/api/search` | Semantic search |
| `/api/billing` | Subscriptions, payments, orders |
| `/api/ai` | Jeet AI chat |
| `/api/contact` | Contact form (public) |
| `/api/syllabus` | Syllabus data (public) |
| `/api/cms/:slug` | Public CMS page content |
| `/api/faqs` | Public FAQs |

## Special Directories

**`app/api/test-series/`**
- Purpose: Next.js API Routes for the Test Series feature
- Why it exists: Test Series is implemented as a self-contained module within Next.js, directly using Supabase admin client instead of the Express backend
- Auth: Bearer token extracted from request, verified against Supabase JWT

**`upsc_backend/src/jobs/`**
- Purpose: Cron-scheduled background jobs
- Examples: Editorial scraping, news syncing, daily content generation
- Note: `runLatestNewsJob()` is executed immediately on server startup to handle Render free-tier cold starts

**`upsc_backend/prisma/migrations/`**
- Purpose: Prisma database migrations
- Naming: `YYYYMMDDhhmmss_description`
- Important: Migrations include schema changes for test-series, PYQ mains, evaluation metrics, spaced repetition schedules

**`data/syllabus/`**
- Purpose: Static syllabus JSON files
- Committed: Yes
- Generated: No

**`public/`**
- Purpose: Static assets served by Next.js
- Contains: Icons, images, logos, static HTML files (`riswithjeet-landing.html`)
