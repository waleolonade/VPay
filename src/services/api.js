import axios from 'axios';
import { API_BASE_URL, endpoints } from '../constants/apiEndpoints';
import { getConnectionState } from '../context/ConnectionContext';

// ─── ApiError ─────────────────────────────────────────────────────────────────
const NETWORK_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ERR_NETWORK',
  'ENOTFOUND',
  'ECONNABORTED',
  'OFFLINE',
]);

export class ApiError extends Error {
  constructor(message, status, responseData, originalError) {
    super(message);
    this.name           = 'ApiError';
    this.status         = status;           // HTTP status or undefined
    this.data           = responseData;     // response body or undefined
    this.code           = originalError?.code;
    this.isNetworkError = !status || NETWORK_ERROR_CODES.has(originalError?.code);
    this.isTimeout      = originalError?.code === 'ECONNABORTED' || message?.includes('timeout');
    this.timestamp      = new Date().toISOString();
  }
}

// ─── Token store ─────────────────────────────────────────────────────────────
let _authToken    = null;
let _refreshToken = null;
let _onTokenExpired = null;   // registered by AuthContext — fires on final logout
let _onTokenRefreshed = null; // registered by AuthContext — fires when we get a new token

// Refresh state
let _isRefreshing = false;
let _pendingQueue = []; // queued requests waiting for a new access token

/** Called by AuthContext after login / restore to sync tokens into this module. */
export const setApiToken = (token) => {
  _authToken = token;
  if (token) _isRefreshing = false; // reset on new valid token
};
export const setApiRefreshToken = (token) => { _refreshToken = token; };

/** Callbacks registered by AuthContext. */
export const onTokenExpired   = (cb) => { _onTokenExpired   = cb; };
export const onTokenRefreshed = (cb) => { _onTokenRefreshed = cb; };

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
const drainQueue = (error, token = null) => {
  _pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  _pendingQueue = [];
};

// ─── Request interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Offline pre-flight: reject immediately without sending HTTP request
    if (getConnectionState().isOffline) {
      return Promise.reject(
        new ApiError('No internet connection.', undefined, undefined, { code: 'OFFLINE' })
      );
    }

    const isPublicRoute =
      config.url?.includes('/auth/login') ||
      config.url?.includes('/auth/register') ||
      config.url?.includes('/auth/forgot-password') ||
      config.url?.includes('/auth/profile') ||
      config.url?.includes('/auth/refresh-token');

    if (_authToken) {
      config.headers.Authorization = `Bearer ${_authToken}`;
    } else if (!isPublicRoute) {
      // No token and not a public route — silently cancel
      const source = axios.CancelToken.source();
      config.cancelToken = source.token;
      source.cancel('No active session');
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    // Silently swallow cancelled requests
    if (axios.isCancel(error)) {
      return Promise.reject({ silent: true, message: error.message });
    }

    const status         = error.response?.status;
    const url            = error.config?.url ?? '';
    const method         = error.config?.method?.toUpperCase() ?? '';
    const originalConfig = error.config;

    // ── Silent Token Refresh ───────────────────────────────────────────────
    if (status === 401 && !url.includes('/auth/login') && !url.includes('/auth/refresh-token')) {
      if (!_refreshToken) {
        // No refresh token available — hard logout
        _onTokenExpired?.();
        return Promise.reject({ silent: true, message: 'Session expired' });
      }

      if (_isRefreshing) {
        // Already refreshing — queue this request until we have a new token
        return new Promise((resolve, reject) => {
          _pendingQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalConfig.headers.Authorization = `Bearer ${newToken}`;
          return api(originalConfig);
        }).catch((err) => Promise.reject({ silent: true, message: err.message }));
      }

      _isRefreshing = true;

      try {
        // Call refresh endpoint (no auth header needed — uses refresh token in body)
        const refreshRes = await axios.post(
          `${API_BASE_URL}${endpoints.REFRESH_TOKEN}`,
          { refreshToken: _refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const newAccessToken  = refreshRes.data?.data?.accessToken;
        const newRefreshToken = refreshRes.data?.data?.refreshToken;

        if (!newAccessToken) throw new Error('No access token in refresh response');

        // Update module-level tokens
        _authToken    = newAccessToken;
        _refreshToken = newRefreshToken ?? _refreshToken;
        _isRefreshing = false;

        // Notify AuthContext so it can persist the new tokens
        _onTokenRefreshed?.(newAccessToken, newRefreshToken ?? _refreshToken);

        // Drain the queue with the new token
        drainQueue(null, newAccessToken);

        // Retry the original request
        originalConfig.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalConfig);
      } catch (refreshError) {
        _isRefreshing = false;
        drainQueue(refreshError);
        _onTokenExpired?.();
        return Promise.reject({ silent: true, message: 'Session expired' });
      }
    }

    if (status === 403) {
      console.warn('[api] 403 Forbidden:', url);
    }

    // ── Build ApiError ─────────────────────────────────────────────────────
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred.';
    const apiError = new ApiError(message, status, error.response?.data, error);

    // ── Structured logging (no PII — no auth tokens, no request bodies) ───
    const timestamp = apiError.timestamp;
    const { connectionType } = getConnectionState();

    if (apiError.isNetworkError) {
      console.error('[api] NetworkError', {
        timestamp,
        url,
        method,
        code: apiError.code,
        message,
        connectionType,
      });
    } else {
      console.error('[api] ApiError', {
        timestamp,
        url,
        method,
        status,
        message: error.response?.data?.message ?? message,
      });
    }

    // ── Sentry forwarding ──────────────────────────────────────────────────
    if (typeof Sentry !== 'undefined') {
      Sentry.captureException(apiError);
    }

    return Promise.reject(apiError);
  },
);

export default api;
