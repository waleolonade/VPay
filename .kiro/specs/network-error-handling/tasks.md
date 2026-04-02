# Implementation Plan: Network Error Handling

## Overview

Implement a unified network-error-handling system for VelPay: a `ConnectionContext` for real-time connectivity monitoring, an `OfflineBanner` component, an enhanced `ErrorPopup` with retry support, upgraded `api.js` error classification and logging, and a `useNetworkRequest` hook with automatic retry logic. Screens are then wired to use these primitives for offline-aware behaviour.

## Tasks

- [x] 1. Create `ConnectionContext` for connectivity monitoring
  - Create `src/context/ConnectionContext.js` with `ConnectionProvider` and `useConnection` hook
  - Subscribe to `NetInfo.addEventListener` on mount; unsubscribe on unmount
  - Re-check connectivity on `AppState` change to `'active'` via `NetInfo.fetch()`
  - Expose `{ isOffline: boolean, connectionType: string }` via context value
  - Add a module-level `getConnectionState()` getter so `api.js` can read state without a hook
  - Wrap `App.js` with `<ConnectionProvider>` around `<AuthProvider>`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 1.1 Write property test for offline flag consistency
    - **Property 1: Offline flag consistency**
    - **Validates: Requirements 1.2, 1.3**
    - For any NetInfo state where `isConnected === false` OR `isInternetReachable === false`, assert `isOffline === true`

- [x] 2. Implement `OfflineBanner` component
  - Create `src/components/common/OfflineBanner.js`
  - Read `isOffline` from `useConnection()`
  - Animate slide-in/slide-out with `Animated.timing` on `translateY`
  - Show "No internet connection" + icon when offline; show "Back online ✓" for 2 seconds on reconnect, then hide
  - Use a wrapping `View` with `paddingTop` equal to banner height so content is pushed down, not overlaid
  - Render `<OfflineBanner />` inside `AppNavigator` above the `Stack.Navigator`, visible only when `user` is set (authenticated)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 2.1 Write unit tests for OfflineBanner state transitions
    - Test: hidden → offline → back-online → hidden cycle
    - Test: banner is not dismissible while offline
    - _Requirements: 2.3, 2.4_

- [-] 3. Enhance `api.js` — error classification and logging
  - Move the inline `ApiError` class to module scope and add `isTimeout`, `timestamp` fields
  - Add `isNetworkError = true` for codes: `ECONNREFUSED`, `ETIMEDOUT`, `ERR_NETWORK`, `ENOTFOUND`, `ECONNABORTED`
  - Add offline pre-flight check in the request interceptor using `getConnectionState()`: reject immediately with `ApiError` (code `'OFFLINE'`) without sending HTTP request
  - Add structured logging in the response interceptor: `Network_Error` logs `{ timestamp, url, method, code, message, connectionType }`; `API_Error` logs `{ timestamp, url, method, status, message }` — no tokens, no request bodies, no PII
  - Forward errors to Sentry via `Sentry.captureException(apiError)` guarded by `typeof Sentry !== 'undefined'`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 7.1, 7.2, 7.3, 7.4_

  - [ ]* 3.1 Write property test for network error classification completeness
    - **Property 2: Network error classification completeness**
    - **Validates: Requirements 3.1, 3.2**
    - For any error where `error.response` is `undefined`, assert `ApiError.isNetworkError === true`

  - [ ]* 3.2 Write property test for API error classification exclusivity
    - **Property 3: API error classification exclusivity**
    - **Validates: Requirements 3.4, 3.5**
    - For any error where `error.response.status` is a 4xx/5xx, assert `ApiError.isNetworkError === false`

  - [ ]* 3.3 Write property test for offline pre-flight
    - **Property 7: Offline pre-flight prevents HTTP requests**
    - **Validates: Requirements 3.6**
    - When `getConnectionState().isOffline === true`, assert no Axios request is dispatched and the returned error has `isNetworkError === true`

  - [ ]* 3.4 Write property test for no PII in logs
    - **Property 6: No PII in logs**
    - **Validates: Requirements 7.3**
    - Assert log objects do not contain `Authorization`, financial body fields, or raw user identifiers

- [~] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [~] 5. Enhance `ErrorPopup` with retry support
  - Add `onRetry` (function | undefined), `retryLabel` (string, default `"Retry"`), and `isFinancial` (boolean) props to `src/components/common/ErrorPopup.js`
  - When `onRetry` is provided, render a secondary "Retry" button alongside the existing "Okay" button
  - When `isFinancial` is true, append "Your transaction was not processed." below the main message
  - Existing behaviour (no `onRetry`) must remain unchanged
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 5.1 Write unit tests for ErrorPopup retry variants
    - Test: retry button renders only when `onRetry` is provided
    - Test: financial warning line renders only when `isFinancial` is true
    - _Requirements: 4.3, 4.5_

- [~] 6. Implement `useNetworkRequest` hook
  - Create `src/hooks/useNetworkRequest.js`
  - Expose `{ execute, loading, error, retry }` interface
  - `execute(requestFn, opts)` accepts `{ isFinancial, silent, onSuccess, onError }`
  - On `Network_Error`: if `silent` → call `showToast('error')`; else → set `showErrorPopup = true` with `onRetry` wired to `retry`; if `isFinancial` → pass `isFinancial` to `ErrorPopup`
  - On `API_Error`: set `showErrorPopup = true` without retry option
  - Auto-retry: subscribe to `isOffline` transitions; when it flips to `false` within 30 seconds of a `Network_Error`, re-execute `pendingRetry` once automatically
  - If auto-retry also fails with `Network_Error`: clear timer, show `ErrorPopup`
  - Financial retry: show `Alert.alert` confirmation before re-executing
  - While retry in progress: set `loading = true`, prevent duplicate submissions
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 6.1 Write property test for no auto-retry on API errors
    - **Property 4: No auto-retry on API errors**
    - **Validates: Requirements 5.4**
    - For any `ApiError` where `isNetworkError === false`, assert `pendingRetry` is never invoked automatically

  - [ ]* 6.2 Write property test for financial retry requires confirmation
    - **Property 5: Financial retry requires confirmation**
    - **Validates: Requirements 5.6**
    - For any `Network_Error` with `isFinancial === true`, assert retry does not execute without `Alert` confirmation

- [~] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [~] 8. Wire `useNetworkRequest` into payment and transfer screens
  - Update `src/screens/payments/TransferScreen.js`, `BankTransferScreen.js`, `VPayToVPayScreen.js`, `AirtimeScreen.js`, `DataScreen.js`, `BillsScreen.js`, `CableTVScreen.js`, `ElectricityScreen.js`, `BettingScreen.js`, `InternetScreen.js`
  - Replace direct `api.*` calls with `execute(() => api.*(…), { isFinancial: true })`
  - Render the `<ErrorPopup>` driven by the hook's `showErrorPopup` / `onRetry` state
  - Disable submit buttons while `loading === true`
  - _Requirements: 4.4, 4.5, 5.5, 5.6_

- [~] 9. Apply offline-aware behaviour to action buttons and data screens
  - In `src/screens/main/HomeScreen.js` and `src/screens/main/WalletScreen.js`, read `isOffline` from `useConnection()`
  - Disable action buttons (`Send Money`, `Pay Bill`, `Transfer`, etc.) when `isOffline === true`; on tap while offline, call `showToast('No internet connection', 'warning')`
  - Apply `styles.buttonDisabled` visual style to disabled buttons
  - Add `useEffect(() => { if (!isOffline) fetchData(); }, [isOffline])` to screens that load data, so they auto-refresh on reconnect
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 9.1 Write unit tests for offline button behaviour
    - Test: buttons are disabled when `isOffline === true`
    - Test: toast is shown on tap while offline
    - Test: data fetch is triggered when `isOffline` transitions to `false`
    - _Requirements: 6.2, 6.3, 6.4_

- [~] 10. Apply silent error handling to non-critical background requests
  - Identify background/non-critical fetches (promotions, banners, AI suggestions) in `src/components/home/`
  - Pass `{ silent: true }` option to `execute()` for these calls so they show a `Toast` instead of `ErrorPopup`
  - _Requirements: 4.6_

- [~] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties; unit tests validate specific examples and edge cases
- `getConnectionState()` is a plain function (not a hook) so `api.js` can call it outside React's render cycle
