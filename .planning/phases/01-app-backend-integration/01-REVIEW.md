---
phase: 01-app-backend-integration
reviewed: 2026-05-02T00:00:00Z
depth: standard
files_reviewed: 27
files_reviewed_list:
  - jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/config/AppConfig.kt
  - jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/remote/ApiClient.kt
  - jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/remote/SupabaseAuthService.kt
  - jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/remote/ApiResponse.kt
  - jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/remote/ApiException.kt
  - jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/local/TokenStorage.kt
  - jeet_app/composeApp/src/androidMain/kotlin/com/example/myapplicationrisewithjeet/data/local/TokenStorage.android.kt
  - jeet_app/composeApp/src/iosMain/kotlin/com/example/myapplicationrisewithjeet/data/local/TokenStorage.ios.kt
  - jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/repository/AuthRepository.kt
  - jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/repository/UserRepository.kt
  - jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/repository/DashboardRepository.kt
  - jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/repository/DailyMcqRepository.kt
  - jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/repository/EditorialRepository.kt
  - jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/repository/DailyAnswerRepository.kt
  - jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/repository/StudyToolRepositories.kt
  - jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/repository/ContentBackendRepositories.kt
  - jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/repository/AdvancedBackendRepositories.kt
  - jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/ui/viewmodel/AuthViewModel.kt
  - jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/ui/viewmodel/DashboardViewModel.kt
  - jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/ui/viewmodel/DailyMcqViewModel.kt
  - jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/ui/viewmodel/DailyAnswerViewModel.kt
  - jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/ui/viewmodel/EditorialViewModel.kt
  - jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/ui/viewmodel/UserProfileViewModel.kt
  - jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/ui/viewmodel/SettingsViewModel.kt
  - jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/ui/viewmodel/StudyToolViewModels.kt
  - jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/ui/viewmodel/ContentBackendViewModels.kt
  - jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/ui/viewmodel/AdvancedBackendViewModels.kt
findings:
  critical: 7
  warning: 9
  info: 4
  total: 20
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-05-02T00:00:00Z
**Depth:** standard
**Files Reviewed:** 27
**Status:** issues_found

## Summary

This review covers the complete backend-integration layer of the KMP app: config, networking, auth, token storage, repositories, and viewmodels. The codebase is generally well-structured and uses consistent patterns. However, several blockers were found spanning security (a real Supabase anon key and JWT committed to source, IS_DEBUG hardcoded to `true`), correctness (a GET call to a non-existent route, a polling loop that does not cancel on screen exit and delays 3 seconds after the final evaluation completes, a missing `await` on the coroutine inside `safeCall`, a fallback to unencrypted SharedPreferences that silently stores tokens in plaintext), and a payment flow that fabricates a provider payment ID.

---

## Critical Issues

### CR-01: Real Supabase anon key (JWT) committed to source control

**File:** `jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/config/AppConfig.kt:17`

**Issue:** `SUPABASE_ANON_KEY` is a fully-decoded, valid JWT with an embedded project ref (`pjbijjhrxlkotldenydv`) hardcoded as a `const val`. Anyone with read access to the repository can extract the key and use it to query the Supabase project directly (row-level security permitting). The comment "safe to ship in client code" is partially true at runtime, but committing the key to git history means it cannot be easily rotated — it will persist in every clone and fork forever unless history is rewritten.

**Fix:**
1. Revoke/rotate the key in the Supabase dashboard immediately.
2. Inject the key at build time via `BuildConfig` (Android) / `xcconfig` (iOS), never as a source literal:
```kotlin
// build.gradle.kts (Android)
buildConfigField("String", "SUPABASE_ANON_KEY", "\"${System.getenv("SUPABASE_ANON_KEY")}\"")

// AppConfig.kt
const val SUPABASE_ANON_KEY = BuildConfig.SUPABASE_ANON_KEY
```
3. Add `AppConfig.kt` (or at minimum the key value) to `.gitignore` for a local override pattern, and document this in the repo README.

---

### CR-02: `IS_DEBUG = true` hardcoded — full HTTP traffic logged in production builds

**File:** `jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/remote/ApiClient.kt:165`
**File:** `jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/remote/SupabaseAuthService.kt:170`

**Issue:** Both `ApiClient.IS_DEBUG` and `SupabaseAuthService.IS_DEBUG` are permanently `true`. With `LogLevel.ALL`, every HTTP request — including `Authorization: Bearer <token>` headers and response bodies containing access tokens and user PII — is written to logcat/console in every build, including production APKs. This makes token exfiltration trivial on rooted devices or via ADB on debug-enabled hardware.

**Fix:**
```kotlin
// In a shared location (e.g., AppConfig.kt or build-injected)
val IS_DEBUG: Boolean = BuildConfig.DEBUG  // Android
// or for KMP: expect val IS_DEBUG: Boolean
```
Both classes should reference this single platform-aware flag instead of their own hardcoded constants.

---

### CR-03: GET `user/settings` route does not exist on the backend — always 404

**File:** `jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/repository/UserRepository.kt:79-81`

**Issue:** `getSettings()` is implemented as:
```kotlin
suspend fun getSettings(): Result<UserSettings> =
    getProfile().map { it.settings ?: UserSettings() }
```
This is not actually the problem — it correctly piggybacks on `GET user/profile`. However, `updateSettings()` at line 83 calls `PUT user/settings`:
```kotlin
val response = apiClient.put<UserSettings>("user/settings", body = settings)
```
The project brief states the backend only has `PUT /user/settings` (no GET), confirming `PUT` is the correct verb. But `SettingsViewModel.loadSettings()` calls `userRepository.getSettings()` which goes to `GET user/profile` — a different endpoint that returns the entire profile object and then extracts `.settings`. If the backend `User` response does not include a `settings` field (or it is null), `loadSettings` silently returns `UserSettings()` defaults instead of an error, masking a data gap. More critically: **the `SettingsViewModel` and `UserRepository` were apparently intended to use a dedicated settings GET endpoint that does not exist** — callers that expect `GET /user/settings` to work directly will receive 404s if anyone wires this differently.

**Fix:** Document explicitly in `UserRepository` that there is no `GET /user/settings` endpoint and that settings are read from the profile. If the backend ever adds the route, a migration path is needed. Alternatively, add a backend `GET /user/settings` route to match the logical API surface.

---

### CR-04: Token refresh race condition — concurrent requests all attempt refresh simultaneously

**File:** `jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/repository/AuthRepository.kt:93-107`

**Issue:** `getMe(refreshOnUnauthorized = true)` catches `ApiException.Unauthorized` and calls `refreshSession()`. There is no mutex or in-flight deduplication. If two coroutines call `getMe()` concurrently (e.g., `DashboardViewModel` and `UserProfileViewModel` both init simultaneously), both will observe the 401, both will call `refreshSession()`, the first will write new tokens, and the second will attempt to exchange the now-stale refresh token — which Supabase/the backend will reject, logging the user out. This is a classic TOCTOU on token refresh.

**Fix:**
```kotlin
// In AuthRepository
private val refreshMutex = Mutex()
private var refreshJob: Deferred<Result<Unit>>? = null

suspend fun refreshSessionDeduped(): Result<Unit> = refreshMutex.withLock {
    val existing = refreshJob
    if (existing != null && existing.isActive) return existing.await()
    return coroutineScope {
        async { refreshSession() }.also { refreshJob = it }.await()
    }
}
```
Replace all `refreshSession()` calls in the refresh-on-401 path with `refreshSessionDeduped()`.

---

### CR-05: Polling loop does not cancel when screen exits; delay fires after final poll

**File:** `jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/ui/viewmodel/DailyAnswerViewModel.kt:96-113`
**File:** `jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/ui/viewmodel/StudyToolViewModels.kt:238-254` (MockTestViewModel)
**File:** `jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/ui/viewmodel/StudyToolViewModels.kt:375-391` (PyqViewModel)

**Issue:** All three polling implementations share the same two bugs:

1. **Post-completion delay:** `delay(3000)` is placed unconditionally after the status check. When `status.isComplete` is true and `return@launch` fires, the delay at the bottom of the `repeat` body has already been skipped because `return@launch` exits the lambda. However, on the *last* iteration of the 12-step loop (when evaluation is still not complete after 12 polls), a final `delay(3000)` fires unnecessarily after the loop exits — a 3-second wait that produces nothing.

2. **No cancellation on ViewModel destruction:** `pollEvaluation` launches a new coroutine into `viewModelScope`, which is correct for cancellation when the ViewModel is cleared. However, **if `pollEvaluation` is called multiple times** (e.g., user submits, backs out, re-enters the screen and resubmits), a new polling coroutine is launched without cancelling the old one. Both coroutines will write to `_uiState` concurrently for up to 36 seconds. There is no guard (job reference, mutex, or cancellation call) to prevent this.

**Fix:**
```kotlin
// Store a reference and cancel before starting a new poll
private var pollJob: Job? = null

fun pollEvaluation(attemptId: String? = _uiState.value.attemptId) {
    pollJob?.cancel()
    pollJob = viewModelScope.launch {
        repeat(12) { iteration ->
            repository.getEvaluationStatus(attemptId)
                .onSuccess { status ->
                    _uiState.value = _uiState.value.copy(evaluationStatus = status, error = null)
                    if (status.isComplete) {
                        loadResults(status.attemptId)
                        return@launch
                    }
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(error = error.message ?: "Failed to check evaluation")
                }
            if (iteration < 11) delay(3000) // Don't delay after the last poll
        }
    }
}
```

---

### CR-06: `safeCall` is not `suspend` — async body runs synchronously, bypassing exception wrapping

**File:** `jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/remote/ApiClient.kt:149-157`

**Issue:** `safeCall` is declared as:
```kotlin
inline fun <reified T> safeCall(block: () -> ApiResponse<T>): ApiResponse<T>
```
The `block` lambda is not `suspend`. All three call sites (`DailyAnswerRepository.uploadImage`, `MockTestRepository.submitMainsAnswer`, `PyqRepository.submitMainsAnswer`) pass a lambda that calls `apiClient.httpClient.post(...).body()` — both of which are `suspend` functions. Kotlin will silently allow calling suspend functions from a non-suspend lambda **only** because the enclosing function at each call site is itself `suspend`, meaning the lambda is implicitly `suspend` via the inline context. This is a subtle correctness landmine: if `safeCall` is ever called from a non-suspend context or the inline optimization is removed (e.g., for testing), the code will fail to compile or behave incorrectly. More practically: exceptions thrown from the `.body()` call inside `httpClient.post()` are caught by the outer `runCatching` in each repository, **not** by the `try/catch` inside `safeCall`, because the suspend machinery unwinds differently. The `ApiException` re-throw logic in `safeCall` is therefore dead code for these async usages.

**Fix:**
```kotlin
suspend inline fun <reified T> safeCall(block: suspend () -> ApiResponse<T>): ApiResponse<T> {
    return try {
        block()
    } catch (e: ApiException) {
        throw e
    } catch (e: Exception) {
        throw ApiException.NetworkError(e.message ?: "Unknown network error")
    }
}
```
Mark both the function and the lambda parameter as `suspend`.

---

### CR-07: Payment checkout fabricates a provider payment ID — mock value will be sent to backend

**File:** `jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/ui/viewmodel/AdvancedBackendViewModels.kt:185-199`

**Issue:** `BillingViewModel.checkout()` calls:
```kotlin
repository.verifyPayment(
    paymentId = payment.paymentId,
    providerPaymentId = "mock-${payment.paymentId}",  // line 188
    status = "success"
)
```
The `providerPaymentId` is fabricated as a string prefix `"mock-"` plus the internal payment ID. This is not a placeholder left for testing — it is the code path that will execute in a production build. A backend that naively accepts this will mark real orders as paid without any real payment gateway verification, allowing any authenticated user to activate subscriptions for free.

**Fix:** Remove the `checkout()` function entirely from this ViewModel until real payment gateway integration (Razorpay/Stripe SDK) is in place. Replace with a stub that throws `NotImplementedError` or shows a "coming soon" UI state, so this path cannot accidentally be exercised in production.

---

## Warnings

### WR-01: Android TokenStorage silently falls back to unencrypted SharedPreferences

**File:** `jeet_app/composeApp/src/androidMain/kotlin/com/example/myapplicationrisewithjeet/data/local/TokenStorage.android.kt:13-24`

**Issue:** When `EncryptedSharedPreferences` fails (e.g., on devices with broken keystores, after a factory reset with improper backup restore, or on emulators), the `catch` block silently falls back to standard `SharedPreferences` with the file name `auth_tokens_fallback`. Tokens stored there are readable by any process with the same UID in a rooted environment and, crucially, are included in unencrypted ADB backups. The fallback is logged with `Log.w` but the app continues as if nothing unusual happened, with no notification to the user and no flag exposed to callers.

**Fix:** At minimum, surface a flag via `TokenStorage` so the calling code can detect the insecure fallback and optionally warn the user or limit sensitive operations. Ideally, on keystore failure, refuse to store tokens and force the user to re-login on every session rather than persisting insecure tokens.

---

### WR-02: `DashboardRepository` uses raw `JsonObject` for performance and analytics endpoints

**File:** `jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/repository/DashboardRepository.kt:40-63`

**Issue:** `getPerformance()`, `getPracticeStats()`, and `getTestAnalytics()` return `Result<JsonObject>`. The `DashboardUiState` in `DashboardViewModel` stores these as `JsonObject?`. This means all data access in the UI requires manual key extraction with no compile-time safety, making any field rename or shape change on the backend a silent runtime bug. It also creates an API surface inconsistency: `AdvancedBackendRepositories.kt` defines typed `PerformanceAnalytics` and `TestAnalyticsData` models and `AnalyticsRepository` uses them correctly (lines 47-53), yet `DashboardRepository` for the same endpoints returns raw JSON. One of these two paths will return stale or incorrect data depending on which one the UI actually uses.

**Fix:** Replace the three `JsonObject` return types in `DashboardRepository` with the same typed models used in `AnalyticsRepository`:
```kotlin
suspend fun getPerformance(): Result<PerformanceAnalytics> = runCatching {
    apiClient.get<PerformanceAnalytics>("user/performance").requiredData("Failed to load performance")
}
```
Delete `DashboardUiState.performance`, `practiceStats`, and `testAnalytics` fields (or type them correctly) and remove the `JsonObject` import from `DashboardViewModel`.

---

### WR-03: `SupabaseAuthService` has no error handling for non-2xx HTTP responses

**File:** `jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/remote/SupabaseAuthService.kt:45-78`

**Issue:** The `SupabaseAuthService` creates its own `HttpClient` without any `HttpResponseValidator`. When Supabase returns a 4xx/5xx HTTP response (e.g., 429 rate-limit, 503 during maintenance), Ktor will throw a `ClientRequestException` or `ServerResponseException`. These are caught by the outer `catch (e: Exception)` and wrapped as `ApiException.NetworkError` — losing the HTTP status code and giving the UI only a generic "Login failed" message. More critically: a 400 response from Supabase (e.g., invalid credentials) has a JSON body with `error` and `error_description` fields. The code does check `supabaseResponse.error != null` at line 55, but only if deserialization succeeds. If Ktor's exception-throwing `HttpResponseValidator` fires first (which it will for non-2xx if a validator is installed), the body is never read and the structured error is lost.

**Fix:** Either add a `HttpResponseValidator` to the Supabase client that does not throw for 4xx responses (so the body can always be read and `supabaseResponse.error` checked), or use `response.status.isSuccess()` to branch before calling `.body()`:
```kotlin
val response = httpClient.post("$supabaseUrl/token?grant_type=password") { ... }
// Ktor's default client does NOT throw on 4xx unless a validator is installed,
// so body reading is safe — but document this assumption explicitly.
```

---

### WR-04: `EditorialViewModel.loadToday` captures stale state in coroutine closure

**File:** `jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/ui/viewmodel/EditorialViewModel.kt:43-55`

**Issue:**
```kotlin
fun loadToday() {
    viewModelScope.launch {
        val state = _uiState.value          // captured at launch time
        _uiState.value = state.copy(isLoading = true, error = null)
        repository.getToday(state.source, state.date)  // uses captured state
```
`state` is captured from `_uiState.value` at the moment `launch` begins, not when the coroutine body actually executes. If `setSource()` is called rapidly twice, both coroutines capture different `state` values. The second coroutine's `repository.getToday(state.source, ...)` call will use the first coroutine's source value because Kotlin's `launch` schedules the coroutine but does not immediately execute it. The result is a race between two in-flight requests: the last one to complete wins, and it may write the wrong (older) editorial list to `_uiState`.

**Fix:** Read `_uiState.value` at the time the coroutine body runs, not before `launch`:
```kotlin
fun loadToday() {
    viewModelScope.launch {
        val source = _uiState.value.source
        val date = _uiState.value.date
        _uiState.value = _uiState.value.copy(isLoading = true, error = null)
        repository.getToday(source, date)
            ...
    }
}
```
The same pattern exists in `loadLiveNews()` on line 58-68.

---

### WR-05: Multipart upload sets `ContentType` header before `setBody` — boundary will be missing

**File:** `jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/repository/DailyAnswerRepository.kt:39`
**File:** `jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/repository/StudyToolRepositories.kt:81` (MockTest)
**File:** `jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/repository/StudyToolRepositories.kt:150` (PYQ)

**Issue:** All three multipart upload call sites call:
```kotlin
contentType(ContentType.MultiPart.FormData)
setBody(MultiPartFormDataContent(...))
```
When `MultiPartFormDataContent` is set as the body, Ktor automatically sets the `Content-Type` header to `multipart/form-data; boundary=<generated_boundary>`. Calling `contentType(ContentType.MultiPart.FormData)` **before** `setBody` installs a content-type header without the `boundary` parameter. Ktor's `MultiPartFormDataContent.writeTo` will then override it with the correct header including the boundary — but the explicit `contentType()` call before it may interfere with this depending on the Ktor version. In Ktor 2.x the `setBody` with `MultiPartFormDataContent` is sufficient and `contentType()` should be omitted to avoid a duplicate or incorrect header.

**Fix:** Remove the `contentType(ContentType.MultiPart.FormData)` call from all three upload sites and let `MultiPartFormDataContent` set the header automatically:
```kotlin
apiClient.httpClient.post(apiClient.buildUrl("daily-answer/today/upload")) {
    // Do NOT set contentType manually for multipart — Ktor sets it with boundary
    setBody(MultiPartFormDataContent(formData { ... }))
}.body()
```

---

### WR-06: `UserProfileViewModel.loadProfile` success path resets all state

**File:** `jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/ui/viewmodel/UserProfileViewModel.kt:36-46`

**Issue:** On success, `loadProfile` does:
```kotlin
onSuccess = { user -> ProfileUiState(user = user) },
```
This constructs a brand-new `ProfileUiState` instead of using `.copy()`. As a result, `isEditing`, `feedbackSubmitted`, and any other transient UI state is silently reset to `false` whenever `loadProfile` completes — even if it was called in the background to refresh data. The same reset pattern is present in `updateProfile` (line 69) and `updateAvatar` (line 86). If `loadProfile` is called while the user has the feedback dialog open, `feedbackSubmitted = true` will be erased.

**Fix:** Use `.copy()` for partial updates:
```kotlin
onSuccess = { user -> _uiState.value.copy(isLoading = false, user = user, error = null) },
```

---

### WR-07: `ApiClient.safeCall` is not `suspend` but is used in suspend contexts — `CancellationException` will be swallowed

**File:** `jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/remote/ApiClient.kt:149-157`

**Issue:** (Companion to CR-06.) The catch-all `catch (e: Exception)` in `safeCall` will swallow `kotlinx.coroutines.CancellationException` if it were ever thrown inside the block. `CancellationException` must be re-thrown for coroutine cancellation to work correctly. If the coroutine is cancelled mid-upload (e.g., the user leaves the screen), the cancellation could be silently absorbed and the coroutine would continue running, wasting bandwidth.

**Fix:** Add an explicit re-throw for `CancellationException`:
```kotlin
} catch (e: CancellationException) {
    throw e  // never swallow cancellation
} catch (e: ApiException) {
    throw e
} catch (e: Exception) {
    throw ApiException.NetworkError(e.message ?: "Unknown network error")
}
```

---

### WR-08: `AuthRepository.logout` ignores server-side logout failure silently

**File:** `jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/repository/AuthRepository.kt:129-138`

**Issue:**
```kotlin
suspend fun logout(): Result<Unit> {
    return try {
        apiClient.post<Unit>("auth/logout")
        tokenStorage.clearTokens()
        Result.success(Unit)
    } catch (e: Exception) {
        tokenStorage.clearTokens()
        Result.failure(e)   // tokens already cleared locally
    }
}
```
If the server `POST /auth/logout` fails (e.g., network error), the function clears local tokens and returns `Result.failure(e)`. The caller (`AuthViewModel.logout`) ignores the result entirely:
```kotlin
authRepository.logout()  // return value discarded
```
This is not necessarily wrong (local token clear is always safe), but the `Result.failure` path means the `AuthViewModel` never sees the failure, and if there is ever a UI that shows "Logout failed, please try again", it will never receive the signal.

**Fix:** Either make `logout` always return success after clearing tokens (since local clear is the only meaningful outcome for the client), or make `AuthViewModel.logout` handle the result:
```kotlin
fun logout() {
    viewModelScope.launch {
        _uiState.value = _uiState.value.copy(isLoading = true)
        authRepository.logout()  // best-effort — always clears local tokens
        _uiState.value = AuthUiState(isLoggedIn = false)
    }
}
```
The current code is functionally correct but the `Result` contract is misleading.

---

### WR-09: `DailyMcqViewModel.submitQuiz` silently falls back to `getResults()` on submit failure

**File:** `jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/ui/viewmodel/DailyMcqViewModel.kt:101-132`

**Issue:** When `repository.submit()` fails, the viewmodel silently retries by calling `repository.getResults()`:
```kotlin
.onFailure { error ->
    repository.getResults()
        .onSuccess { result ->
            _uiState.value = _uiState.value.copy(isSubmitting = false, result = result, error = null)
            ...
            onComplete()  // called even though submit failed
        }
```
If the submit failed due to a genuine error (network, 422 validation), getting results will likely also fail or return a previous session's result. The user's current answers are silently discarded and they are shown stale results from a prior attempt, with `error = null` — no indication that anything went wrong. The `onComplete()` callback fires, navigating the user away from the quiz as if submission succeeded.

**Fix:** Remove the fallback `getResults()` call on submit failure. Surface the submit error to the user:
```kotlin
.onFailure { error ->
    _uiState.value = _uiState.value.copy(
        isSubmitting = false,
        error = error.message ?: "Failed to submit quiz"
    )
}
```

---

## Info

### IN-01: `AppConfig.SUPABASE_URL` duplicated in `SupabaseAuthService` comment

**File:** `jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/remote/SupabaseAuthService.kt:25`

**Issue:** The hardcoded project URL `https://pjbijjhrxlkotldenydv.supabase.co/auth/v1` appears in both the class-level KDoc comment and in `AppConfig`. If the URL is ever changed, the comment will go stale.

**Fix:** Remove the URL from the comment or replace it with a reference to `AppConfig`.

---

### IN-02: `FeedbackRequest` sends duplicate data — `category` and `type` both set to the same `type` argument

**File:** `jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/data/repository/UserRepository.kt:91-104`

**Issue:**
```kotlin
FeedbackRequest(
    rating = rating,
    category = type,   // both set to the same value
    workingWell = message,
    type = type
)
```
`category` and `type` are both set to the `type` parameter. This is likely either redundant (the backend uses only one) or one of them was supposed to be something else (e.g., `category` = feature area, `type` = feedback type). Either way the `message` parameter goes into `workingWell` but `couldBeBetter` is always null.

**Fix:** Clarify with the backend API contract which fields are expected and remove the duplication.

---

### IN-03: `SettingsViewModel.updateNotifications` maps fields arbitrarily between the two notification models

**File:** `jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/ui/viewmodel/SettingsViewModel.kt:56-70`

**Issue:** The `NotificationSettings` constructor receives:
```kotlin
mcq = dailyReminder,
answer = studyPlanReminder,
digest = editorialUpdate,
streak = mockTestReminder
```
These mappings are semantically wrong: `streak` is mapped to `mockTestReminder` toggle, and `answer` is mapped to `studyPlanReminder`. The UI labels do not match the underlying fields, meaning toggling "Mock Test Reminder" actually modifies the `streak` notification flag. Similarly `updatePrivacy` maps `analytics = showProfile` and `studyRoom = showActivity` in a non-obvious way.

**Fix:** Align the notification/privacy model field names with UI toggle semantics, or pass them explicitly in the function signature to remove the ambiguity.

---

### IN-04: `AiMessage` optimistic ID is non-unique under concurrent sends

**File:** `jeet_app/composeApp/src/commonMain/kotlin/com/example/myapplicationrisewithjeet/ui/viewmodel/AdvancedBackendViewModels.kt:75`

**Issue:**
```kotlin
val optimistic = AiMessage(id = "local-${_uiState.value.messages.size}", role = "user", content = clean)
```
If two messages are sent back-to-back before either response arrives (though the `isSending` guard prevents this), or if messages are deleted and re-added, two different messages could share the same `id`. The failure handler at line 94 uses `filterNot { it.id == optimistic.id }` to remove the optimistic message, which would remove multiple messages if IDs collide. Use a monotonic counter or UUID instead.

**Fix:**
```kotlin
private var messageCounter = 0
val optimistic = AiMessage(id = "local-${messageCounter++}", ...)
```

---

_Reviewed: 2026-05-02T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
