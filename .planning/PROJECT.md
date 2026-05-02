# UPSC Platform — Jeet App Backend Integration

## Overview

Integrate the Kotlin Multiplatform mobile app (`jeet_app/`) with the existing Express.js backend (`upsc_backend/`) that already serves the Next.js web frontend. The app currently uses hardcoded/sample data and has no network layer.

## Goal

Enable the Jeet app to consume real data from the unified backend, sharing the same API surface, authentication system (Supabase Auth), and database as the web platform.

## Key Decisions

- **Single Backend:** Both web and app use `upsc_backend` Express API
- **Auth:** Supabase Auth JWT tokens, same flow as web
- **Network:** Ktor client for Kotlin Multiplatform
- **Architecture:** Repository pattern + ViewModel pattern
- **Data Flow:** Screens → ViewModels → Repositories → API Client → Backend

## Scope

### In Scope
- Network layer (Ktor client, auth interceptors, error handling)
- Authentication (login, signup, token management)
- All feature domains mapped to backend routes:
  - Dashboard, User Profile, Settings
  - Daily MCQ, Daily Answer Writing, Editorials
  - Mock Tests, PYQ, Flashcards, Mindmaps
  - Videos, Library, Current Affairs
  - Study Planner, Syllabus Tracker
  - AI Chat, Analytics, Billing

### Out of Scope
- Push notifications (requires FCM/APNs setup)
- Offline sync / local caching (future phase)
- Deep linking
- App store deployment

## Technical Stack

- **Client:** Kotlin Multiplatform, Compose Multiplatform 1.10.0
- **HTTP:** Ktor client with ContentNegotiation (kotlinx.serialization)
- **Auth:** Supabase Auth REST API (or supabase-kt if available)
- **DI:** Manual service locator (no Koin/Kodein to minimize dependencies)
- **State:** ViewModel + StateFlow (already have lifecycle-viewmodel-compose)
