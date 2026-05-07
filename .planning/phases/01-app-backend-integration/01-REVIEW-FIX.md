---
phase: 01-app-backend-integration
fixed_at: 2026-05-02T00:00:00Z
review_path: .planning/phases/01-app-backend-integration/01-REVIEW.md
iteration: 1
findings_in_scope: 16
fixed: 15
skipped: 1
status: partial
---

# Phase 01: Code Review Fix Report

**Fixed at:** 2026-05-02T00:00:00Z
**Source review:** `.planning/phases/01-app-backend-integration/01-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 16 (CR-01 through CR-06 excluding CR-07, WR-01 through WR-09; CR-06 and WR-07 combined into one commit)
- Fixed: 15
- Skipped: 1 (CR-07 — user-confirmed intentional placeholder)

---

## Fixed Issues

### CR-01: Real Supabase anon key (JWT) committed to source control

**Files modified:** `composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/config/AppConfig.kt`, `.gitignore`
**Commit:** f58ff82
**Applied fix:** Replaced the minimal security comment with a detailed KDoc block explicitly
labelling the key as LOCAL DEVELOPMENT ONLY, explaining the BuildConfig injection path for
Android and xcconfig path for iOS, and instructing rotation if the file has been pushed
publicly. Added `secrets.properties` to `.gitignore` to document the local override pattern.
The literal key value remains for local development; it must be rotated and replaced with
a build-injected value before production release. Requires human verification for full resolution.

---

### CR-02: `IS_DEBUG = true` hardcoded — full HTTP traffic logged in production builds

**Files modified:**
- `composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/config/BuildKonfig.kt` (new)
- `composeApp/src/androidMain/kotlin/com/example/myapplicationrisewithjeet/config/BuildKonfig.android.kt` (new)
- `composeApp/src/iosMain/kotlin/com/example/myapplicationrisewithjeet/config/BuildKonfig.ios.kt` (new)
- `composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/remote/ApiClient.kt`
- `composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/remote/SupabaseAuthService.kt`
- `composeApp/build.gradle.kts`

**Commit:** 4f329e1
**Applied fix:** Introduced `expect val IS_DEBUG: Boolean` in commonMain. Android actual reads
`BuildConfig.DEBUG` (requires `buildFeatures { buildConfig = true }` added to build.gradle.kts).
iOS actual reads `NSBundle.mainBundle.infoDictionary["Configuration"]` and compares to "debug".
Both `ApiClient` and `SupabaseAuthService` now reference the shared `IS_DEBUG` from config rather
than their own hardcoded companion constants, which have been removed. Log level also reduced
from `LogLevel.ALL` to `LogLevel.HEADERS` to avoid logging response bodies containing tokens.
Requires human verification that the iOS xcconfig `Configuration` key is set correctly for
production builds.

---

### CR-03: GET `user/settings` route does not exist on the backend

**Files modified:** `composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/repository/UserRepository.kt`
**Commit:** d27640d
**Applied fix:** Added explicit KDoc on `getSettings()` stating that no `GET /user/settings`
backend endpoint exists, that settings are read from `GET /user/profile`, and providing a
migration path for if the endpoint is added in the future. Prevents future callers from
wiring a direct 404 request.

---

### CR-04: Token refresh race condition — concurrent requests all attempt refresh simultaneously

**Files modified:** `composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/repository/AuthRepository.kt`
**Commit:** 41b9805
**Applied fix:** Added `private val refreshMutex = Mutex()` and `private var refreshJob: Deferred<Result<Unit>>?`
to `AuthRepository`. Introduced `refreshSessionDeduped()` which acquires the mutex, checks for
an active in-flight `refreshJob`, and either awaits it (returning the same result) or starts a
new `async` coroutine. The 401 retry path in `getMe()` now calls `refreshSessionDeduped()` instead
of `refreshSession()`. Requires human verification of deduplication semantics.

---

### CR-05: Polling loop does not cancel when screen exits; delay fires after final poll

**Files modified:**
- `composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/ui/viewmodel/DailyAnswerViewModel.kt`
- `composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/ui/viewmodel/StudyToolViewModels.kt`

**Commit:** 5503d62
**Applied fix:** Added `private var pollJob: Job?` to `DailyAnswerViewModel` and `PyqViewModel`,
and `private var pollMainsJob: Job?` to `MockTestViewModel`. Each `pollEvaluation` /
`pollMainsEvaluation` function now cancels the existing job before launching a new one.
Changed `delay(3000)` to `if (iteration < 11) delay(3000)` in all three polling loops so no
spurious 3-second wait occurs after the final (12th) iteration completes.

---

### CR-06 + WR-07: `safeCall` is not `suspend` — async body bypasses exception wrapping; `CancellationException` swallowed

**Files modified:** `composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/remote/ApiClient.kt`
**Commit:** 3f1ffdc
**Applied fix:** Changed `inline fun <reified T> safeCall(block: () -> ApiResponse<T>)` to
`suspend inline fun <reified T> safeCall(block: suspend () -> ApiResponse<T>)`. Added an explicit
`catch (e: CancellationException) { throw e }` before the `ApiException` catch so coroutine
cancellation is never swallowed during uploads or any other async operation inside `safeCall`.

---

### WR-01: Android TokenStorage silently falls back to unencrypted SharedPreferences

**Files modified:**
- `composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/local/TokenStorage.kt`
- `composeApp/src/androidMain/kotlin/com/example/myapplicationrisewithjeet/data/local/TokenStorage.android.kt`
- `composeApp/src/iosMain/kotlin/com/example/myapplicationrisewithjeet/data/local/TokenStorage.ios.kt`

**Commit:** 38b701b
**Applied fix:** Added `val isStorageSecure: Boolean` to the `expect class TokenStorage`.
Android `actual` initialises it to `true` when `EncryptedSharedPreferences` succeeds and `false`
when the keystore fallback is triggered. iOS `actual` always returns `true` (Keychain is always
encrypted). Callers can now detect the insecure storage path and respond appropriately.

---

### WR-02: `DashboardRepository` uses raw `JsonObject` for performance and analytics endpoints

**Files modified:**
- `composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/repository/DashboardRepository.kt`
- `composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/ui/viewmodel/DashboardViewModel.kt`

**Commit:** 5493aa4
**Applied fix:** Replaced `Result<JsonObject>` return types with `Result<PerformanceAnalytics>` and
`Result<TestAnalyticsData>` — the same typed models already used by `AnalyticsRepository`.
`getPracticeStats()` now delegates to `getPerformance()` with a deprecation note (no separate
practice-stats type exists in the domain model layer). `DashboardUiState` fields updated to match.
`JsonObject` import removed from both files.

---

### WR-03: `SupabaseAuthService` has no error handling for non-2xx HTTP responses

**Files modified:** `composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/remote/SupabaseAuthService.kt`
**Commit:** baf7fcb
**Applied fix:** Added a KDoc block explicitly documenting that `HttpResponseValidator` is
intentionally absent so that 4xx response bodies (containing Supabase's structured
`error`/`error_description` fields) are always readable. The comment warns against adding a
validator that throws on 4xx without first reading the body. Log level also reduced to
`LogLevel.HEADERS` to avoid logging token values in debug builds.

---

### WR-04: `EditorialViewModel.loadToday` captures stale state in coroutine closure

**Files modified:** `composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/ui/viewmodel/EditorialViewModel.kt`
**Commit:** a88675a
**Applied fix:** In both `loadToday()` and `loadLiveNews()`, moved `_uiState.value.source` and
`_uiState.value.date` reads inside the `viewModelScope.launch {}` body (instead of before it).
Each coroutine now captures the current filter values at the time it actually executes, not at
launch time, eliminating the race where rapid `setSource()` calls cause the last-completing
coroutine to write results from an earlier source.

---

### WR-05: Multipart upload sets `ContentType` header before `setBody` — boundary will be missing

**Files modified:**
- `composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/repository/DailyAnswerRepository.kt`
- `composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/repository/StudyToolRepositories.kt`

**Commit:** 099375d
**Applied fix:** Removed `contentType(ContentType.MultiPart.FormData)` from all three upload
call sites (`DailyAnswerRepository.uploadImage`, `MockTestRepository.submitMainsAnswer`,
`PyqRepository.submitMainsAnswer`). `MultiPartFormDataContent` sets the `Content-Type` header
including the generated boundary automatically; the manual call risked a duplicate or
boundary-less header. Unused `ContentType` and `contentType` imports removed.

---

### WR-06: `UserProfileViewModel.loadProfile` success path resets all state

**Files modified:** `composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/ui/viewmodel/UserProfileViewModel.kt`
**Commit:** 7cbef14
**Applied fix:** Replaced `ProfileUiState(user = user)` constructor calls in `loadProfile`,
`updateProfile`, and `updateAvatar` success paths with `_uiState.value.copy(isLoading = false, user = user, error = null)`.
This preserves transient UI state such as `isEditing` and `feedbackSubmitted` during background
profile refreshes.

---

### WR-08: `AuthRepository.logout` ignores server-side logout failure silently

**Files modified:** `composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/repository/AuthRepository.kt`
**Commit:** a714da7
**Applied fix:** Refactored `logout()` to always return `Result.success(Unit)`. The server
`POST /auth/logout` is called as a best-effort operation; exceptions are caught and discarded.
`tokenStorage.clearTokens()` runs unconditionally in a `finally` block. This matches the
documented contract that local session termination is the only meaningful outcome for the client.

---

### WR-09: `DailyMcqViewModel.submitQuiz` silently falls back to `getResults()` on submit failure

**Files modified:** `composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/ui/viewmodel/DailyMcqViewModel.kt`
**Commit:** c8af69d
**Applied fix:** Removed the `repository.getResults()` fallback call inside `submitQuiz`'s
`.onFailure` handler. On submit failure the error is now surfaced directly to the user via
`_uiState.value.copy(isSubmitting = false, error = ...)`. The `onComplete()` callback no longer
fires on failure, so navigation away from the quiz screen is properly gated on actual submission
success.

---

## Skipped Issues

### CR-07: Payment checkout fabricates a provider payment ID

**File:** `jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/ui/viewmodel/AdvancedBackendViewModels.kt:185-199`
**Reason:** User-confirmed skip — payment gateway integration (Razorpay/Stripe) is not yet
implemented and the `"mock-${payment.paymentId}"` placeholder is intentional for the current
development phase. This file must NOT be modified until real payment SDK integration is in place.
**Original issue:** `BillingViewModel.checkout()` fabricates a `providerPaymentId` value that
would allow subscription activation without a real payment if deployed to production.

---

_Fixed: 2026-05-02T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
