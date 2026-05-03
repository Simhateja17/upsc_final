---
phase: 01-app-backend-integration
plan: 02
type: summary
status: completed
---

# 01-02 Backend Integration Summary

Implemented the app-side backend integration for dashboard, performance, profile, and settings using the root website/backend contract as source of truth.

## Route Decisions

- Dashboard data uses `GET /api/user/dashboard`.
- Streak data uses `GET /api/user/streak`.
- Activity data uses `GET /api/user/activity?limit={n}`.
- Performance data uses `GET /api/user/performance`.
- Practice stats use `GET /api/user/practice-stats`.
- Test analytics use `GET /api/user/test-analytics`.
- Profile and settings reads use `GET /api/user/profile`.
- Settings writes use `PUT /api/user/settings`.
- There is no backend `GET /api/user/settings`; settings are read from `profile.settings`.

## Implemented

- Added dashboard domain models: `DashboardData`, `DailyTrio`, `TrioItem`, `UserActivity`, and `UserStreak`.
- Added settings models: `UserSettings`, `NotificationSettings`, and `PrivacySettings`, including compatibility fields used by the website payload.
- Extended `User` to parse `/user/profile` fields including `bio`, `settings`, `state`, `targetYear`, and `optionalSubject`.
- Added `DashboardRepository` and `UserRepository` to own endpoint paths, response envelope extraction, and backend mismatch handling.
- Added `DashboardViewModel`, `UserProfileViewModel`, and `SettingsViewModel`.
- Updated `ServiceLocator` to provide new repositories and ViewModels.
- Wired `HomeScreen` to real dashboard state for streak, days remaining, daily trio, task count, loading/error state, and recent activity.
- Replaced hardcoded performance tracker screens with backend-backed summaries using dashboard, streak, performance, and test analytics data.
- Wired profile and account settings screens to real profile/settings ViewModels and save operations.

## Verification

- Passed `./gradlew :composeApp:compileKotlinMetadata -q`.
- Passed `./gradlew :composeApp:compileDebugKotlinAndroid -q`.
- Passed `./gradlew :composeApp:compileKotlinIosSimulatorArm64 -q`.

## Notes

- Performance detail screens now avoid fake rows and show honest backend-backed summaries. Per-topic and per-test rows should be added after introducing typed analytics models.
- Avatar update remains app-side callable, but the current backend `updateProfile` controller does not persist `avatarUrl`.
