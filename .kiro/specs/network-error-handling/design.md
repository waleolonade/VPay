# Design Document: Network Error Handling

## Overview

This design introduces a unified network-error-handling system for VelPay. It adds a `ConnectionContext` for real-time connectivity monitoring, an `OfflineBanner` component, upgrades the existing `ErrorPopup` with a Retry button, enhances `api.js` with structured error classification and logging, and adds a `useNetworkRequest` hook that encapsulates retry logic. All code is JavaScript (React Native / Expo).

---

## Architecture

```
App.js
└── ConnectionProvider          ← new: wraps entire app, monitors NetInfo
    └── AppNavigator
        └── OfflineBanner       ← new: rendered inside authenticated layout
        └── screens
            └── useNetworkRequest  ← new hook used per screen/component
                └── api.js (enhanced)
```

---

## Component & Module Design

### 1. `src/context/ConnectionContext.js`

Monitors device connectivity via `@react-native-community/netinfo` and exposes state to the whole tree.

```javascript
// State shape
{
  isOffline: boolean,        // true when no internet
  connectionType: string,    // 'wifi' | 'cellular' | 'none' | 'unknown'
}
```

**Behaviour:**
- Subscribes to `NetInfo.addEventListener` on mount; unsubscribes on unmount.
- On `AppState` change to `'active'`, calls `NetInfo.fetch()` to re-check.
- Updates `isOffline` within 1 second of any transition (NetInfo fires synchronously on state change).

```javascript
// Pseudocode
const [state, setState] = useState({ isOffline: false, connectionType: 'unknown' });

useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(netState => {
    setState({
      isOffline: !netState.isConnected || !netState.isInternetReachable,
      connectionType: netState.type,
    });
  });
  // AppState foreground re-check
  const appSub = AppState.addEventListener('change', appState => {
    if (appState === 'active') NetInfo.fetch().then(/* update state */);
  });
  return () => { unsubscribe(); appSub.remove(); };
}, []);
```

**Exports:** `ConnectionContext`, `ConnectionProvider`, `useConnection`

---

### 2. `src/components/common/OfflineBanner.js`

A non-blocking banner rendered at the top of the authenticated layout.

**Props:** none (reads from `useConnection`)

**Behaviour:**
- Visible when `isOffline === true` → shows "No internet connection" + wifi-off icon.
- On transition to online → shows "Back online ✓" for 2 seconds, then hides.
- Uses `Animated.timing` for slide-in/slide-out (translateY from -48 to 0).
- Rendered above screen content using a `View` wrapper that adds `paddingTop` equal to banner height, so content is pushed down (not overlaid).

**States:** `'offline'` | `'back-online'` | `'hidden'`

```javascript
// Height constant
const BANNER_HEIGHT = 36;

// Color mapping
offline    → backgroundColor: '#DC2626'  (red)
back-online → backgroundColor: '#16A34A' (green)
```

---

### 3. `src/services/api.js` — Enhanced Error Classification

The existing `ApiError` class is moved to module scope and extended:

```javascript
class ApiError extends Error {
  constructor(message, status, responseData, originalError) {
    super(message);
    this.name           = 'ApiError';
    this.status         = status;           // HTTP status or undefined
    this.data           = responseData;     // response body or undefined
    this.code           = originalError?.code;
    this.isNetworkError = !status;          // true when no HTTP response
    this.isTimeout      = originalError?.code === 'ECONNABORTED' || message?.includes('timeout');
    this.timestamp      = new Date().toISOString();
  }
}
```

**Network error codes classified as `isNetworkError = true`:**
`ECONNREFUSED`, `ETIMEDOUT`, `ERR_NETWORK`, `ENOTFOUND`, `ECONNABORTED`

**Offline pre-flight check** (added to request interceptor):
```javascript
// Import getConnectionState — a module-level getter set by ConnectionProvider
if (getConnectionState().isOffline) {
  return Promise.reject(new ApiError(
    'No internet connection.',
    undefined, undefined,
    { code: 'OFFLINE' }
  ));
}
```

**Logging** (added to response interceptor, no PII):
```javascript
// Network error log
console.error('[api] NetworkError', {
  timestamp, url, method, code: error.code, message, connectionType
});

// API error log
console.error('[api] ApiError', {
  timestamp, url, method, status, message: response.message
});

// Sentry (if configured)
if (typeof Sentry !== 'undefined') Sentry.captureException(apiError);
```

---

### 4. `src/hooks/useNetworkRequest.js`

A hook that wraps API calls with error handling, retry logic, and loading state.

```javascript
// Usage
const { execute, loading, error, retry } = useNetworkRequest();
await execute(() => api.post('/payments/transfer', body), { isFinancial: true });
```

**Options:**
```javascript
{
  isFinancial: boolean,   // req 4.5, 5.6 — shows transaction warning, requires confirm before retry
  silent: boolean,        // req 4.6 — suppresses ErrorPopup, shows Toast instead
  onSuccess: fn,
  onError: fn,
}
```

**Internal state:**
```javascript
{
  loading: boolean,
  error: ApiError | null,
  showErrorPopup: boolean,
  pendingRetry: fn | null,   // stores the original request fn for retry
}
```

**Retry logic:**
- On `Network_Error`: stores request fn in `pendingRetry`.
- Subscribes to `ConnectionContext.isOffline` transitions: when it flips to `false` within 30 seconds, auto-executes `pendingRetry` once.
- If auto-retry also fails with `Network_Error`: clears auto-retry timer, shows `ErrorPopup`.
- Financial requests: sets `requiresConfirmation = true`; retry button shows confirmation alert before re-executing.
- `API_Error` (4xx/5xx): never auto-retries; shows `ErrorPopup` immediately.

**Flow:**
```
execute(requestFn, opts)
  → set loading = true
  → if isOffline → reject immediately (Network_Error)
  → call requestFn()
  → on success → call onSuccess, clear error
  → on Network_Error
      → if silent → showToast('error')
      → else if isFinancial → showErrorPopup with transaction warning
      → else → showErrorPopup
      → start 30s auto-retry window
  → on API_Error
      → showErrorPopup (no retry)
  → set loading = false
```

---

### 5. `src/components/common/ErrorPopup.js` — Enhanced

Add optional `onRetry` prop and `retryLabel` prop:

```javascript
// New props
onRetry: fn | undefined   // if provided, shows "Retry" button alongside "Okay"
retryLabel: string        // default: "Retry"
isFinancial: boolean      // if true, shows transaction-not-processed warning line
```

**Updated button row:**
```
[ Retry ]  [ Okay ]     ← when onRetry is provided
[   Okay   ]            ← default (existing behaviour)
```

---

### 6. Screen-Level Integration Pattern

Screens use `useNetworkRequest` and `useConnection` directly. No global error boundary changes needed.

**Offline button disabling pattern:**
```javascript
const { isOffline } = useConnection();

<TouchableOpacity
  disabled={isOffline}
  onPress={isOffline ? () => showToast('No internet connection', 'warning') : handleSend}
  style={[styles.button, isOffline && styles.buttonDisabled]}
>
```

**Stale data refresh on reconnect:**
```javascript
useEffect(() => {
  if (!isOffline) fetchData(); // re-fetch when coming back online
}, [isOffline]);
```

---

## Correctness Properties

**Property 1: Offline flag consistency**
For any NetInfo state where `isConnected === false` OR `isInternetReachable === false`, `ConnectionContext.isOffline` MUST be `true`.

**Property 2: Network error classification completeness**
For any error where `error.response` is `undefined`, `ApiError.isNetworkError` MUST be `true`.

**Property 3: API error classification exclusivity**
For any error where `error.response.status` is defined (4xx/5xx), `ApiError.isNetworkError` MUST be `false`.

**Property 4: No auto-retry on API errors**
For any `ApiError` where `isNetworkError === false`, the retry handler MUST NOT automatically re-execute the request.

**Property 5: Financial retry requires confirmation**
For any `Network_Error` on a request with `isFinancial === true`, the retry MUST NOT execute without explicit user confirmation.

**Property 6: No PII in logs**
Error log objects MUST NOT contain `Authorization` headers, request bodies with financial fields, or user identifiers beyond what is in the URL path.

**Property 7: Offline pre-flight prevents HTTP requests**
When `ConnectionContext.isOffline === true`, calling `execute()` MUST reject immediately without any outbound HTTP request being made.

**Property 8: Banner does not overlay content**
When `OfflineBanner` is visible, the screen's scrollable/interactive content area MUST be fully accessible (no overlap).
