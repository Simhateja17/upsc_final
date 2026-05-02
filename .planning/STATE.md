# State

## Project
- **Name:** UPSC Platform — Jeet App Backend Integration
- **Current Phase:** 01-app-backend-integration
- **Status:** planning

## Decisions
- D-01: Use Ktor client for HTTP (Kotlin Multiplatform compatible)
- D-02: Use manual service locator for DI (minimize dependencies)
- D-03: Use kotlinx.serialization for JSON (native KMP, no Moshi/Gson)
- D-04: Use Supabase Auth REST API directly (not supabase-kt, to avoid extra dependency)
- D-05: Map app features 1:1 to existing backend routes (no new backend routes needed)
- D-06: Store auth tokens in encrypted SharedPreferences (Android) / Keychain (iOS)
- D-07: Use StateFlow + ViewModel pattern for UI state management

## Context
- Backend already integrated with web frontend
- App has screens but only sample/hardcoded data
- Backend uses Bearer JWT auth via Supabase
- API response envelope: `{ status, data, message }`

## Blockers
None

## Notes
- Backend API base URL: `NEXT_PUBLIC_API_URL` from env (e.g., `http://localhost:5001/api`)
- All routes except auth require Bearer token
- Supabase config: URL + anon key available in `.env.local`
