---
last_mapped: 2026-04-29
focus: tech
---

# Technology Stack

## Overview
UPSC preparation platform with a Next.js 14 frontend and an Express/TypeScript backend, both backed by Supabase PostgreSQL. Heavy use of AI/LLM integrations (Azure OpenAI, Google Gemini) for content generation, answer evaluation, and RAG embeddings.

## Languages
- **TypeScript** (5.x) — primary language for both frontend and backend
- **JavaScript** — legacy scripts, config files, and build tooling
- **SQL** — Supabase schema definitions and Prisma migrations
- **CSS** — Tailwind CSS utility classes, custom globals in `styles/`

## Runtime & Platform
- **Node.js 20** — required runtime (specified in GitHub Actions and setup scripts)
- **EC2 (Ubuntu 22.04)** — primary production host for frontend (deployed via PM2)
- **Render** — backend hosting target (free tier, `render.yaml` present)
- **Vercel** — minimal config present (`vercel.json`), but current deploy pipeline targets EC2

## Frameworks & Libraries

### Core
- **Next.js 14.1.0** (`package.json`) — frontend React framework with App Router
- **React 18.2.0** — UI library
- **Express 5.1.0** (`upsc_backend/package.json`) — backend HTTP server

### UI / Styling
- **Tailwind CSS 3.3.0** — utility-first CSS framework
- **TipTap 3.20.1** (`@tiptap/react`, `@tiptap/starter-kit`, and extensions) — rich text editor for answer writing and CMS
- **react-markdown 10.1.0** + **remark-gfm 4.0.1** — Markdown rendering (heavily transpiled in `next.config.js`)
- **@floating-ui/dom 1.7.6** — floating UI positioning

### State / Data
- **@supabase/supabase-js 2.x** — client and server Supabase SDK (auth, DB, storage)
- **Prisma 7.4.1** (`@prisma/client`, `prisma`) — ORM for PostgreSQL
- **@prisma/adapter-pg 7.4.1** — native `pg` driver adapter for Prisma
- **pg 8.19.0** — direct PostgreSQL driver (used by Prisma adapter)
- **ioredis 5.10.1** — Redis client for rate limiting and caching

### AI / ML
- **openai 6.x** (`upsc_backend/package.json`) — Azure OpenAI client (`AzureOpenAI` class)
- **@google/genai 1.46.0** — Google Gemini SDK
- **@azure/openai 2.0.0** — additional Azure OpenAI SDK (legacy fallback)

### Utilities
- **zod 4.3.6** — schema validation (API payloads, query params)
- **jose 6.2.1** — JWT verification (Supabase auth token validation)
- **multer 2.1.0** — multipart file upload handling
- **pdf-parse 2.4.5** — PDF text extraction (used in both frontend and backend)
- **axios 1.13.6** — HTTP client for backend external API calls
- **cheerio 1.2.0** — server-side HTML scraping (editorials)
- **rss-parser 3.13.0** — RSS feed ingestion
- **node-cron 4.2.1** — cron-like job scheduling
- **pino 10.3.1** + **pino-http 11.0.0** — structured JSON logging
- **resend 6.9.3** — transactional email
- **undici 7.24.4** — custom fetch dispatcher (IPv4 forcing for Supabase)
- **string-similarity 4.0.4** — text similarity for deduplication
- **cross-env 10.1.0** — cross-platform environment variables

## Build & Dev Tools
- **npm** — package manager (lockfiles: `package-lock.json` in both frontend and backend)
- **PostCSS 8** + **autoprefixer 10** — CSS processing pipeline
- **ESLint 8** with `next/core-web-vitals` — linting (`/.eslintrc.json`)
- **tsx 4.21.0** — TypeScript execution for dev/watch mode in backend
- **ts-node 10.9.2** — TypeScript Node.js REPL/execution
- **nodemon 3.1.14** — file watcher (legacy, mostly superseded by `tsx watch`)
- **sharp 0.34.5** — image optimization (devDependency in frontend)

## Key Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Frontend dependencies and scripts (Next.js) |
| `tsconfig.json` | Frontend TypeScript config (target: es5, module: esnext, path alias `@/*`) |
| `next.config.js` | Next.js config: redirects, image unoptimization, transpiled packages, pdfjs-dist external |
| `tailwind.config.ts` | Tailwind theme: custom fonts, fluid typography, colors, shadows |
| `postcss.config.js` | PostCSS plugins: tailwindcss, autoprefixer |
| `vercel.json` | Minimal Vercel framework config (version 2, Next.js) |
| `.eslintrc.json` | ESLint rules: extends Next.js core-web-vitals, warns on unescaped entities |
| `upsc_backend/package.json` | Backend dependencies and scripts (Express, Prisma, AI SDKs) |
| `upsc_backend/tsconfig.json` | Backend TypeScript config (target: ES2020, module: commonjs, outDir: `./dist`) |
| `upsc_backend/prisma/schema.prisma` | Prisma schema: 40+ models for users, MCQs, editorials, mock tests, payments, RAG chunks, etc. |
| `upsc_backend/prisma.config.ts` | Prisma config with `DATABASE_URL` and `DIRECT_URL` from env |
| `upsc_backend/render.yaml` | Render.com deployment spec: build/start commands, env var placeholders |
| `deploy/ecosystem.config.js` | PM2 config for frontend (port 3000, max 1G RAM) |
| `upsc_backend/deploy/ecosystem.config.js` | PM2 config for backend (port 5001, max 500M RAM) |

## Dependencies

### Production (Frontend)
| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 14.1.0 | React framework |
| `react` / `react-dom` | 18.2.0 | UI rendering |
| `@supabase/supabase-js` | 2.39.0 | Auth, database, storage client |
| `openai` | 6.34.0 | OpenAI API client (frontend usage minimal) |
| `pdf-parse` | 2.4.5 | PDF text extraction |
| `react-markdown` | 10.1.0 | Markdown rendering |
| `remark-gfm` | 4.0.1 | GitHub-flavored Markdown support |
| `@tiptap/*` | 3.20.1 | Rich text editor ecosystem |
| `@floating-ui/dom` | 1.7.6 | Tooltip/popover positioning |

### Production (Backend)
| Package | Version | Purpose |
|---------|---------|---------|
| `express` | 5.1.0 | Web server |
| `@prisma/client` | 7.4.1 | Database ORM |
| `@prisma/adapter-pg` | 7.4.1 | Prisma → `pg` bridge |
| `pg` | 8.19.0 | PostgreSQL driver |
| `@supabase/supabase-js` | 2.50.4 | Supabase admin + public clients |
| `openai` | 6.33.0 | Azure OpenAI chat + embeddings |
| `@azure/openai` | 2.0.0 | Azure OpenAI SDK (legacy) |
| `@google/genai` | 1.46.0 | Google Gemini SDK |
| `ioredis` | 5.10.1 | Redis client |
| `rate-limit-redis` | 4.3.1 | Redis-backed Express rate limiter |
| `express-rate-limit` | 8.2.1 | Express rate limiting |
| `zod` | 4.3.6 | Request validation |
| `jose` | 6.2.1 | JWT/JWK verification |
| `multer` | 2.1.0 | File uploads |
| `resend` | 6.9.3 | Email sending |
| `axios` | 1.13.6 | External HTTP requests |
| `cheerio` | 1.2.0 | HTML scraping |
| `rss-parser` | 3.13.0 | RSS ingestion |
| `node-cron` | 4.2.1 | Scheduled jobs |
| `pino` / `pino-http` | 10.3.1 / 11.0.0 | Structured logging |
| `undici` | 7.24.4 | Custom fetch with IPv4 agent for Supabase |
| `pdf-parse` | 2.4.5 | PDF parsing for PYQ ingestion |
| `string-similarity` | 4.0.4 | Deduplication logic |

### Development
| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | 5.x | TypeScript compiler |
| `eslint` / `eslint-config-next` | 8 / 14.1.0 | Linting |
| `tailwindcss` | 3.3.0 | CSS framework |
| `postcss` / `autoprefixer` | 8 / 10 | CSS pipeline |
| `prisma` | 7.4.1 | Schema migration + client generation |
| `tsx` | 4.21.0 | TS execution for dev |
| `ts-node` | 10.9.2 | TS Node execution |
| `cross-env` | 10.1.0 | Cross-platform env vars |
| `@types/*` | various | Type definitions |

## Notable Choices
- **Dual-package monorepo** — frontend and backend are separate npm projects with independent `package.json` files, not a workspace or monorepo tool (no Turborepo, Nx, or pnpm workspaces).
- **Supabase as the single data layer** — both frontend and backend talk to the same Supabase PostgreSQL instance; Prisma is used only in the backend.
- **IPv4 forcing** — custom `undici` agent in `upsc_backend/src/config/supabase.ts` forces IPv4 for Supabase connections to work around Node.js v22+ DNS resolution issues.
- **Heavy transpilation list** — `next.config.js` transpiles 30+ ESM-only packages (`react-markdown`, `remark-gfm`, `unified`, etc.) for Next.js compatibility.
- **No Docker** — deployment relies on bare-metal EC2 + PM2 or Render's native Node runtime.
- **No testing framework** — no Jest, Vitest, Playwright, or Cypress installed in either frontend or backend.
