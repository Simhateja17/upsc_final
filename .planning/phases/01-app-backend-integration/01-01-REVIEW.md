# Code Review: Auth Screen Implementation

## Scope
Files reviewed:
- `data/remote/ApiClient.kt`
- `data/remote/SupabaseAuthService.kt`
- `data/remote/ApiResponse.kt`
- `data/remote/ApiException.kt`
- `data/repository/AuthRepository.kt`
- `data/local/TokenStorage.kt` (common expect)
- `data/local/TokenStorage.android.kt`
- `data/local/TokenStorage.ios.kt`
- `ui/viewmodel/AuthViewModel.kt`
- `ui/screens/LoginScreen.kt`
- `di/ServiceLocator.kt`
- `App.kt`
- `MainActivity.kt`
- `MainViewController.kt`

---

## CRITICAL

### C-01: Hardcoded Supabase Anon Key
**File:** `SupabaseAuthService.kt:38`
**Issue:** The Supabase anon key is hardcoded as a string literal.
```kotlin
private val anonKey = "eyJhbGciOiJIUzI1NiIs..."
```
**Impact:** While anon keys are technically public, embedding them in source code makes rotation difficult and exposes the project reference.
**Fix:** Move to BuildConfig/expect-actual config or read from environment. At minimum, extract to a constant file marked for obfuscation.

---

## HIGH

### H-01: iOS TokenStorage Uses NSUserDefaults (Not Secure)
**File:** `TokenStorage.ios.kt`
**Issue:** Auth tokens are stored in `NSUserDefaults`, which stores data in plaintext plist files accessible via backup/analysis.
```kotlin
private val defaults = NSUserDefaults.standardUserDefaults
```
**Impact:** Tokens can be extracted by anyone with device access or backup access.
**Fix:** Migrate to iOS Keychain using ` kotlinx.cinterop ` or a multiplatform keychain library.

### H-02: ServiceLocator Not Initialized = Crash
**File:** `ServiceLocator.kt:16`
**Issue:** `lateinit var tokenStorage` will throw `UninitializedPropertyAccessException` if any lazy property is accessed before `initialize()` is called.
**Impact:** Crash on app start if platform entry point forgets to initialize.
**Fix:** Add a safety check with meaningful error, or use nullable with `checkNotNull`.

### H-03: AuthRepository.getMe() Uses Unsafe Cast Parsing
**File:** `AuthRepository.kt:93-124`
**Issue:** Response parsing uses `Map<String, Any>` with `@Suppress("UNCHECKED_CAST")` instead of a typed `@Serializable` data class.
```kotlin
val userMap = data["user"] as? Map<String, Any>
```
**Impact:** Will crash with `ClassCastException` if backend changes any field type. Completely bypasses kotlinx.serialization safety.
**Fix:** Create `MeResponse` data class with `@Serializable` and use `response.body<MeResponse>()`.

### H-04: Double Exception Wrapping in ApiClient
**File:** `ApiClient.kt:145-153`
**Issue:** `safeCall` catches all exceptions including `ApiException` (re-throws), but the HttpResponseValidator ALSO throws ApiExceptions. In some paths, a network error could be wrapped twice.
**Impact:** Confusing error messages, potential loss of original exception type.
**Fix:** Only wrap non-ApiException types:
```kotlin
catch (e: ApiException) -> throw e
catch (e: Exception) -> throw ApiException.NetworkError(...)
```
(This is already done correctly - verify no other wrapping occurs in callers.)

---

## MEDIUM

### M-01: No Request Timeouts Configured
**Files:** `ApiClient.kt`, `SupabaseAuthService.kt`
**Issue:** Neither HttpClient configures request/connect timeouts.
**Impact:** Hanging requests on poor network, poor UX.
**Fix:** Add timeout plugin:
```kotlin
install(HttpTimeout) {
    requestTimeoutMillis = 15000
    connectTimeoutMillis = 10000
}
```

### M-02: Logging Level ALL in Production Leaks Tokens
**File:** `ApiClient.kt:53-56`
**Issue:** `LogLevel.ALL` logs full request/response bodies including Authorization headers.
**Impact:** Tokens may appear in logcat/crashlytics logs.
**Fix:** Use `LogLevel.HEADERS` or conditionally enable based on BuildConfig.DEBUG.

### M-03: AuthViewModel init Block Triggers Network Request
**File:** `AuthViewModel.kt:27-33`
**Issue:** `init { loadCurrentUser() }` makes a network call during ViewModel creation.
**Impact:** Unnecessary API calls on every configuration change (if ViewModel is recreated), battery drain.
**Fix:** Move to explicit trigger, or cache user data locally and only refresh periodically.

### M-04: Signup Logic Bug - Checks Wrong Condition
**File:** `AuthViewModel.kt:64-79`
**Issue:** Checks `_uiState.value.isLoggedIn` to determine if signup succeeded, but this is always false during signup.
```kotlin
if (user != null && _uiState.value.isLoggedIn) { // BUG: isLoggedIn is false
```
**Impact:** Successful signup always shows "email verification required" screen even when session exists.
**Fix:** Check `result.getOrNull() != null && authRepository.isLoggedIn()`.

### M-05: Android EncryptedSharedPreferences Can Fail Silently
**File:** `TokenStorage.android.kt:8-19`
**Issue:** `EncryptedSharedPreferences.create()` can throw on some devices (Android 9+, custom ROMs, corrupted Keystore).
**Impact:** App crash on startup for affected users.
**Fix:** Wrap in try-catch with fallback to standard SharedPreferences (with documented security tradeoff).

### M-06: Unused Function + Import
**File:** `SupabaseAuthService.kt:40-42`
**Issue:** `makeHeaders()` is defined but never used.
**Fix:** Remove dead code.

### M-07: App.kt Creates New ViewModel on Recomposition
**File:** `App.kt:28`
**Issue:** While `remember {}` helps, `ServiceLocator.provideAuthViewModel()` creates a new instance each call. If `remember` key changes, state is lost.
**Fix:** Make `AuthViewModel` a singleton in ServiceLocator, or properly scope it.

### M-08: ServiceLocator.initialize() Not Idempotent
**File:** `ServiceLocator.kt:19-21`
**Issue:** Calling `initialize()` twice will silently overwrite TokenStorage.
**Fix:** Guard against double initialization:
```kotlin
fun initialize(tokenStorage: TokenStorage) {
    if (::tokenStorage.isInitialized) return
    this.tokenStorage = tokenStorage
}
```

---

## LOW

### L-01: Unused Import in LoginScreen
**File:** `LoginScreen.kt:31`
**Issue:** `import kotlinx.coroutines.flow.collectLatest` is unused.
**Fix:** Remove.

### L-02: No Email Validation
**File:** `LoginScreen.kt:280-282`
**Issue:** Allows submitting any string as email.
**Fix:** Add basic email regex validation and show inline error.

### L-03: No Password Visibility Toggle
**File:** `LoginScreen.kt:219-239`
**Issue:** Password field always uses `PasswordVisualTransformation()`.
**Fix:** Add eye icon to toggle visibility.

### L-04: @PublishedApi + internal is Redundant
**File:** `ApiClient.kt:93-143`
**Issue:** Inline functions marked both `@PublishedApi` and `internal`. `@PublishedApi` is only needed when accessing `internal` members, not when the function itself is `internal`.
**Fix:** Remove `@PublishedApi` since functions are already `internal`.

### L-05: getCurrentUser() Always Returns Null
**File:** `AuthRepository.kt:139-146`
**Issue:** Function documented as placeholder but exposed in public API.
**Fix:** Either implement proper caching or remove and force callers to use `getMe()`.

### L-06: iOS TokenStorage synchronize() is Deprecated
**File:** `TokenStorage.ios.kt:11, 21`
**Issue:** `NSUserDefaults.synchronize()` is unnecessary on modern iOS and deprecated.
**Fix:** Remove synchronize calls (auto-synchronization happens periodically).

### L-07: LoginScreen Footer Text Confusing
**File:** `LoginScreen.kt:347-359`
**Issue:** Shows "Don't have an account? Sign up" even though this IS the login screen. The original had "Already have an account? Sign in" which was also wrong.
**Fix:** Use appropriate text for the current mode (login vs signup).

---

## Summary

| Severity | Count | Categories |
|----------|-------|------------|
| Critical | 1 | Security |
| High | 4 | Security, Architecture, Stability |
| Medium | 8 | Logic, UX, Performance, Quality |
| Low | 7 | Quality, UX, Polish |

### Recommended Priority Fixes
1. **C-01**: Extract Supabase key from source code
2. **H-01**: Move iOS TokenStorage to Keychain
3. **H-02**: Add ServiceLocator initialization safety
4. **H-03**: Use typed `@Serializable` for `getMe()` parsing
5. **M-04**: Fix signup success detection bug
6. **M-01**: Add network timeouts

### Overall Assessment
The auth implementation is functionally correct and follows clean architecture principles. The main concerns are:
- **Security gaps** (iOS plaintext storage, hardcoded key, logging tokens)
- **Runtime stability** (unsafe casts, uninitialized lateinit)
- **Edge cases** (timeouts, EncryptedSharedPreferences failures)

After fixing HIGH and CRITICAL items, this is production-ready for an MVP.
