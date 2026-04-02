# Requirements Document

## Introduction

VelPay is a React Native / Expo fintech app that communicates with a backend API for all financial operations (auth, wallet, payments, bills, etc.). Currently, when the device loses internet connectivity or the backend is unreachable, the app surfaces raw or inconsistent error messages and offers no structured recovery path. This feature introduces a unified, graceful network-error-handling system that detects connectivity loss, communicates clearly to the user, and provides actionable retry or offline-fallback behaviour across all screens.

## Glossary

- **Network_Monitor**: The module responsible for continuously observing device internet connectivity state using `@react-native-community/netinfo`.
- **Error_Banner**: A persistent, non-blocking UI element displayed at the top of the screen when the device is offline.
- **Error_Popup**: The existing modal component (`src/components/common/ErrorPopup.js`) used for blocking error messages.
- **API_Client**: The Axios instance defined in `src/services/api.js` that handles all HTTP communication with the backend.
- **Retry_Handler**: The logic responsible for re-executing a failed API request after a user-initiated or automatic trigger.
- **Toast**: The existing lightweight notification component (`src/components/common/Toast.js`) used for transient messages.
- **Offline_State**: The condition where the device has no active internet connection as reported by `Network_Monitor`.
- **Network_Error**: An API call failure caused by absence of connectivity, timeout, or backend unreachability (no HTTP response received).
- **API_Error**: An HTTP response with a 4xx or 5xx status code returned by the backend.
- **Connection_Context**: A React context that exposes the current `Offline_State` and connectivity metadata to all components.

---

## Requirements

### Requirement 1: Connectivity Monitoring

**User Story:** As a VelPay user, I want the app to know when my device goes offline or comes back online, so that it can react immediately without requiring me to manually refresh.

#### Acceptance Criteria

1. THE `Network_Monitor` SHALL subscribe to device connectivity changes on app startup using `@react-native-community/netinfo`.
2. WHEN the device transitions from online to offline, THE `Network_Monitor` SHALL update the `Connection_Context` `isOffline` flag to `true` within 1 second of the transition.
3. WHEN the device transitions from offline to online, THE `Network_Monitor` SHALL update the `Connection_Context` `isOffline` flag to `false` within 1 second of the transition.
4. THE `Connection_Context` SHALL expose `isOffline` (boolean) and `connectionType` (string) to all child components via a React context provider.
5. WHEN the app returns to the foreground from background, THE `Network_Monitor` SHALL re-check connectivity and update `Connection_Context` accordingly.

---

### Requirement 2: Offline Banner

**User Story:** As a VelPay user, I want to see a clear, persistent indicator when I am offline, so that I understand why features are unavailable without being blocked by a modal.

#### Acceptance Criteria

1. WHILE `Connection_Context` `isOffline` is `true`, THE `Error_Banner` SHALL be displayed at the top of every screen inside the main navigation stack.
2. THE `Error_Banner` SHALL display the message "No internet connection" and a relevant icon.
3. WHILE `Connection_Context` `isOffline` is `true`, THE `Error_Banner` SHALL remain visible and SHALL NOT be dismissible by the user.
4. WHEN `Connection_Context` `isOffline` transitions to `false`, THE `Error_Banner` SHALL display a "Back online" confirmation message for 2 seconds before hiding.
5. THE `Error_Banner` SHALL NOT obscure interactive UI elements; it SHALL push screen content down rather than overlay it.

---

### Requirement 3: Network Error Detection in API Client

**User Story:** As a developer, I want the API client to reliably distinguish network errors from API errors, so that the correct recovery path is triggered for each failure type.

#### Acceptance Criteria

1. WHEN an API request fails with no HTTP response (i.e., `error.response` is `undefined`), THE `API_Client` SHALL classify the failure as a `Network_Error`.
2. WHEN an API request fails with `error.code` equal to `ECONNREFUSED`, `ETIMEDOUT`, `ERR_NETWORK`, or `ENOTFOUND`, THE `API_Client` SHALL classify the failure as a `Network_Error`.
3. WHEN an API request exceeds the configured timeout of 30 seconds, THE `API_Client` SHALL classify the failure as a `Network_Error` with reason `timeout`.
4. WHEN an API request fails with an HTTP response status code, THE `API_Client` SHALL classify the failure as an `API_Error` and preserve the status code and response body.
5. THE `API_Client` SHALL attach an `isNetworkError` boolean property to every rejected error object to allow callers to branch on error type.
6. IF a request is made while `Connection_Context` `isOffline` is `true`, THEN THE `API_Client` SHALL reject the request immediately with a `Network_Error` without sending an HTTP request.

---

### Requirement 4: User-Facing Network Error Messages

**User Story:** As a VelPay user, I want to see a clear, actionable error message when a network problem prevents an operation, so that I know what happened and what to do next.

#### Acceptance Criteria

1. WHEN a `Network_Error` occurs during any API call, THE `Error_Popup` SHALL display with `type="network"`, title "Connection Error", and the message "Unable to reach VelPay servers. Please check your internet connection and try again."
2. WHEN a `Network_Error` occurs with reason `timeout`, THE `Error_Popup` SHALL display the message "The request took too long. Please check your connection and try again."
3. THE `Error_Popup` displayed for a `Network_Error` SHALL include a "Retry" button in addition to the existing "Okay" button.
4. WHEN the user taps "Retry" on the `Error_Popup`, THE `Retry_Handler` SHALL re-execute the original failed API request.
5. WHEN a `Network_Error` occurs during a financial transaction (payment, transfer, bill payment), THE `Error_Popup` SHALL additionally display the message "Your transaction was not processed."
6. IF a `Network_Error` occurs during a non-critical background operation (e.g., fetching promotions), THEN THE `API_Client` SHALL suppress the `Error_Popup` and show a `Toast` with type `"error"` instead.

---

### Requirement 5: Retry Mechanism

**User Story:** As a VelPay user, I want the app to automatically retry failed requests when I come back online, so that I do not have to manually redo actions after a brief connectivity drop.

#### Acceptance Criteria

1. THE `Retry_Handler` SHALL support manual retry triggered by the user tapping the "Retry" button on the `Error_Popup`.
2. WHEN a `Network_Error` occurs and the device returns to online state within 30 seconds, THE `Retry_Handler` SHALL automatically re-execute the failed request once without user interaction.
3. WHEN an automatic retry also results in a `Network_Error`, THE `Retry_Handler` SHALL stop retrying and display the `Error_Popup` to the user.
4. THE `Retry_Handler` SHALL NOT automatically retry requests that resulted in an `API_Error` (4xx or 5xx response); those SHALL require explicit user action.
5. WHILE a retry is in progress, THE `Retry_Handler` SHALL display a loading indicator on the triggering UI element and disable duplicate submissions.
6. IF a financial transaction request fails with a `Network_Error`, THEN THE `Retry_Handler` SHALL require explicit user confirmation before retrying, to prevent duplicate transactions.

---

### Requirement 6: Offline State — Screen-Level Behaviour

**User Story:** As a VelPay user, I want screens to degrade gracefully when I am offline, so that I can still view cached data and understand which actions are unavailable.

#### Acceptance Criteria

1. WHILE `Connection_Context` `isOffline` is `true`, THE app SHALL display previously loaded data from local state or cache rather than showing an empty screen.
2. WHILE `Connection_Context` `isOffline` is `true`, action buttons that require network access (e.g., "Send Money", "Pay Bill") SHALL be visually disabled and SHALL display a tooltip "No internet connection" when tapped.
3. WHILE `Connection_Context` `isOffline` is `true`, THE app SHALL NOT initiate any new API requests.
4. WHEN `Connection_Context` `isOffline` transitions to `false` and a screen's data is stale, THE screen SHALL automatically refresh its data without requiring user interaction.

---

### Requirement 7: Error Logging and Observability

**User Story:** As a VelPay developer, I want all network errors to be logged with sufficient context, so that I can diagnose connectivity issues in production.

#### Acceptance Criteria

1. WHEN a `Network_Error` occurs, THE `API_Client` SHALL log the error with the following fields: `timestamp`, `url`, `method`, `error.code`, `error.message`, and `connectionType` from `Connection_Context`.
2. WHEN an `API_Error` occurs, THE `API_Client` SHALL log the error with the following fields: `timestamp`, `url`, `method`, `status`, and `response.message`.
3. THE `API_Client` SHALL NOT log authentication tokens, request bodies containing financial data, or personally identifiable information in error logs.
4. WHERE a remote error-reporting service (e.g., Sentry) is configured, THE `API_Client` SHALL forward `Network_Error` and `API_Error` events to that service.
