# RiseWithJeet – AI-Powered UPSC Preparation Platform

**India's #1 AI-Powered UPSC Platform** – trusted by 50,000+ aspirants preparing for the Union Public Service Commission (UPSC) Civil Services Examination. RiseWithJeet combines artificial intelligence, structured content, and community-driven learning to deliver a complete preparation ecosystem.

---

## Overview

RiseWithJeet is a full-stack web application built for serious UPSC aspirants. It offers personalized study planning, AI-driven answer evaluation, daily practice tools, comprehensive test series, and a vibrant community – all in one place. The platform is split into a **student dashboard** (rich learning environment) and an **admin panel** (content & user management).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 3 |
| **Auth & Database** | Supabase (PostgreSQL + Auth + Storage) |
| **AI / LLM** | OpenAI API |
| **Rich Text** | TipTap Editor |
| **Markdown** | react-markdown + remark-gfm |
| **PDF Parsing** | pdf-parse |
| **Fonts** | SF Pro, Inter, Poppins, Outfit, Plus Jakarta Sans, Lora, Geist |

---

## Project Structure

```
├── app/                          # Next.js App Router
│   ├── (marketing)/              # Landing & public pages
│   ├── dashboard/                # Student dashboard routes
│   ├── admin/                    # Admin panel routes
│   ├── auth/callback/            # OAuth callback handler
│   ├── api/                      # API routes
│   ├── layout.tsx                # Root layout with AuthProvider
│   └── page.tsx                  # Entry point (redirects based on auth)
├── components/                   # Shared React components
│   ├── admin/                    # Admin-specific components
│   ├── DashboardHeader.tsx
│   ├── Sidebar.tsx
│   ├── PerformanceStatsWidget.tsx
│   ├── FeaturesGrid.tsx
│   └── ...
├── contexts/
│   └── AuthContext.tsx           # Global authentication state
├── hooks/
│   └── useCmsContent.ts          # CMS content fetcher
├── lib/                          # Utilities & services
│   ├── auth.ts                   # Auth service layer
│   ├── supabase.ts               # Supabase client
│   ├── supabase-admin.ts         # Admin-level Supabase client
│   ├── api.ts                    # API helpers
│   ├── services.ts               # Business logic services
│   ├── upscSubjects.ts           # UPSC subject taxonomy
│   ├── liveCount.ts              # Live user counter
│   └── test-series/              # Test series repository & mappers
├── supabase/
│   └── test-series-schema.sql    # Database schema for test series
├── types/
│   └── test-series.ts            # TypeScript types for test series
├── public/                       # Static assets (images, icons, landing HTML)
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## Key Features

### Student Dashboard

| Feature | Description |
|---------|-------------|
| **Daily MCQ Challenge** | Curated daily multiple-choice questions with instant feedback and review |
| **Daily Answer Writing** | AI-evaluated mains answer writing practice with scoring |
| **Test Series** | Enrollable test series with timed tests, detailed solutions, and analytics |
| **Mock Tests** | Full-length Prelims & Mains simulation with real exam conditions |
| **Syllabus Tracker** | Visual progress tracker covering all UPSC subjects, topics, and sub-topics |
| **Mind Maps** | Interactive subject-wise mind maps for quick revision |
| **Flashcards** | Spaced-repetition-based flashcards for memorization |
| **Study Planner** | AI-generated adaptive study schedules |
| **PYQ Bank** | Previous year questions organized by year and subject |
| **Current Affairs** | Daily current affairs with editorial analysis |
| **Video Lectures** | Curated video content from top educators |
| **Q&A Forum** | Community-driven doubt resolution |
| **Study Groups** | Join topic-wise study circles |
| **Live Study Room** | Real-time collaborative study sessions |
| **Mentorship** | Connect with toppers and mentors |
| **Performance Analytics** | Deep insights into strengths, weaknesses, and readiness prediction |
| **Leaderboard** | Compete with peers and track rankings |
| **JeetGPT** | AI-powered doubt solver and personal assistant |
| **Mental Health** | Wellness resources for aspirants |
| **Saved Notes** | Personal note-taking with rich text editor |
| **Billing & Subscriptions** | Manage plans, payments, and invoices |

### Admin Panel

| Feature | Description |
|---------|-------------|
| **CMS Hub** | Manage landing page content dynamically |
| **Test Series Manager** | Create, edit, publish test series and individual tests |
| **Question Bank** | Add/edit MCQs with options, explanations, and metadata |
| **Daily Content** | Schedule daily MCQs, editorials, and current affairs |
| **User Management** | View and manage registered users |
| **Study Materials** | Upload and organize PDFs and resources |
| **Mind Map Manager** | Create and link interactive mind maps |
| **Flashcard Manager** | Manage spaced-repetition decks |
| **Editorial Manager** | Publish daily editorial summaries |
| **Pricing & Billing** | Configure plans and view transactions |
| **FAQ & Testimonials** | Manage public-facing content |
| **RAG Manager** | Maintain AI knowledge base documents |

---

## Database Schema (Supabase)

Core tables include:

- `profiles` – user profiles & roles
- `test_series` – test series catalog
- `test_series_tests` – individual tests within a series
- `test_series_questions` – questions with options & explanations
- `test_series_enrollments` – user enrollments
- `test_attempts` & `test_responses` – attempt history & answers
- `daily_mcqs` – daily question pool
- `flashcards` – user flashcard decks
- `mindmaps` – subject mind map data
- `study_plans` – generated study schedules
- `editorials` & `current_affairs` – content tables
- `cms_content` – dynamic landing page content

See `supabase/test-series-schema.sql` for detailed DDL.

---

## Environment Variables

Create a `.env.local` file in the project root:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5001/api

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> **Note:** Admin keys and backend secrets should only be exposed to server-side code or Edge Functions.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase project (with Auth & Database enabled)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd upsc-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## Authentication & Roles

The platform uses **Supabase Auth** with support for:

- Email/password login
- Google OAuth

Users have roles (`student` or `admin`). The root route (`/`) automatically redirects:

- Unauthenticated users → Landing page (`/riswithjeet-landing.html`)
- Authenticated students → `/dashboard`
- Authenticated admins → `/admin`

---

## CMS-Driven Landing Page

The marketing landing page is **static HTML** (`public/riswithjeet-landing.html`) and pulls dynamic content via the CMS hook. This decouples marketing content from the Next.js build, allowing copy and feature highlights to be updated instantly from the admin panel without redeployment.

---

## AI Integrations

- **Answer Evaluation** – OpenAI models evaluate descriptive answers against UPSC marking rubrics.
- **JeetGPT** – Conversational AI for doubt resolution and guidance.
- **Study Planner** – AI generates personalized schedules based on syllabus coverage and user performance.
- **Smart Analytics** – Predictive scoring and weak-area identification.

---

## Roadmap

- [ ] Mobile app (React Native / Flutter)
- [ ] Offline mode for video lectures
- [ ] Advanced analytics with percentile benchmarking
- [ ] AI-generated mock interview simulations
- [ ] Integration with UPSC official notification APIs
- [ ] Regional language support

---

## Contributing

We welcome contributions! Please follow the existing code style and open an issue before major changes.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

---

## Contact

For support, feature requests, or partnership inquiries, reach out via the platform's [Contact Page](https://risewithjeet.com/contact) or email the team directly.

---

**Built with dedication for every UPSC aspirant who dreams of serving the nation.**
