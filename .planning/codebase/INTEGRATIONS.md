---
last_mapped: 2026-04-29
focus: tech
---

# External Integrations

## Overview
The platform integrates with Supabase for database, auth, and storage; Azure OpenAI and Google Gemini for AI features; Resend for email; News API for news ingestion; and RSS feeds for editorial scraping. Payments are partially integrated with Razorpay. Deployment spans EC2 (frontend + backend) and Render (backend fallback).

## Database
- **Supabase PostgreSQL** — primary transactional database for users, MCQs, mock tests, editorials, study materials, payments, and RAG chunks.
  - Prisma schema: `upsc_backend/prisma/schema.prisma`
  - SQL migrations: `upsc_backend/prisma/migrations/`
  - Prisma config: `upsc_backend/prisma.config.ts`
  - Additional Supabase-native schema for Test Series CMS: `supabase/test-series-schema.sql`
- **Redis** — used for rate limiting (`rate-limit-redis`) and caching.
  - Config: `upsc_backend/src/config/redis.ts`

## Authentication
- **Supabase Auth** — email/password signup/signin, JWT session management, optional Google OAuth.
  - Frontend client: `lib/supabase.ts`
  - Backend admin client: `upsc_backend/src/config/supabase.ts`
  - Auth controller: `upsc_backend/src/controllers/auth.controller.ts`
  - Middleware: `upsc_backend/src/middleware/auth.middleware.ts` (validates Supabase JWTs with `jose`)

## APIs & Services

| Service | Purpose | Where Used |
|---------|---------|------------|
| **Azure OpenAI** | Chat completions (Jeet AI), answer evaluation, editorial summarization, PYQ parsing, question generation | `upsc_backend/src/config/azure.ts`, `upsc_backend/src/services/embedding.service.ts` |
| **Google Gemini** | Fallback / alternative LLM for generative tasks | `upsc_backend/src/config/gemini.ts` |
| **Resend** | Transactional email (signup confirmations, notifications) | `upsc_backend/src/services/emailService.ts` |
| **News API** | Fetching latest news headlines for current-affairs module | `upsc_backend/src/services/newsApi.ts` |
| **RSS Feeds** | Editorial ingestion (The Hindu, Indian Express) | `upsc_backend/src/services/rssFetcher.ts`, `upsc_backend/src/services/editorialScraper.ts` |
| **Razorpay** | Payment provider (partially integrated; mock flow in place) | `upsc_backend/src/controllers/billing.controller.ts` |
| **Supabase Storage** | File uploads (PDFs, thumbnails, study materials, PYQs) | `upsc_backend/src/config/storage.ts` |
| **Supabase Vector / pgvector** | RAG embeddings storage (1536-dim vectors) for study material chunks | `upsc_backend/prisma/schema.prisma` (`MockTestChunk`, `StudyMaterialChunk`) |

## Webhooks
- **Supabase Auth callbacks** — frontend route `app/auth/callback/page.tsx` handles OAuth redirect flows.
- **No external webhooks configured** for Razorpay, Stripe, or other services at this time (payment flow is mock/pending).

## Environment Variables

### Frontend (`/.env.example`)
- `NEXT_PUBLIC_API_URL` — backend API base URL
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — server-only key for CMS operations

### Backend (`/upsc_backend/.env.example`)
- `DATABASE_URL` / `DIRECT_URL` — PostgreSQL connection strings
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` — Supabase credentials
- `AZURE_OPENAI_ENDPOINT` / `AZURE_OPENAI_API_KEY` / `AZURE_OPENAI_API_VERSION` / `AZURE_OPENAI_CHAT_DEPLOYMENT` / `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` — Azure AI
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` — Email service
- `NEWS_API_KEY` — News API access
- `JWT_SECRET` — custom JWT signing (legacy, mostly Supabase JWTs used)
- `GOOGLE_REDIRECT_URL` — OAuth callback URL
- `CORS_ORIGIN` — allowed frontend origin
- `USD_TO_INR` — exchange rate for AI cost tracking
- `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL_ID` — listed in `render.yaml` but not actively used in codebase

## Deployment

### Frontend
- **Primary: AWS EC2** (Ubuntu 22.04, Node 20, PM2, Nginx)
  - GitHub Actions workflow: `.github/workflows/deploy-frontend.yml`
  - Deploy scripts: `deploy/1-setup-server.sh`, `deploy/2-deploy.sh`
  - PM2 config: `deploy/ecosystem.config.js`
- **Fallback: Vercel** — `vercel.json` present but minimal; no active Vercel deployment pipeline observed.

### Backend
- **Primary: Render** — `upsc_backend/render.yaml` defines Node web service on free tier (port 5001).
- **Secondary: AWS EC2** — deploy scripts and PM2 config present in `upsc_backend/deploy/`.

## Third-Party Libraries with API Calls

| Library | External Service | Notes |
|---------|------------------|-------|
| `openai` (`AzureOpenAI`) | Azure OpenAI | Chat + embeddings; fallback to standard OpenAI if Azure not configured |
| `@google/genai` | Google Gemini API | Generative AI fallback |
| `@azure/openai` | Azure OpenAI | Legacy SDK, imported but likely superseded by `openai` |
| `resend` | Resend REST API | Email delivery |
| `axios` | News API, RSS feeds, external scrapers | HTTP client for backend services |
| `rss-parser` | RSS feeds | Editorial/news ingestion |
| `cheerio` + `axios` | External news sites | HTML scraping for editorials |
| `@supabase/supabase-js` | Supabase REST + Auth + Storage | All DB, auth, and file operations |
| `ioredis` | Redis server | Rate limiting and caching |
