/**
 * Loading State Management Utility
 * Provides helpers for managing loading states consistently across the app
 */

export const LoadingStates = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  TIMEOUT: 'timeout',
};

export const LoadingMessages = {
  // Auth
  SIGNING_IN: 'Signing in...',
  SENDING_OTP: 'Sending OTP...',
  VERIFYING_OTP: 'Verifying code...',
  REGISTERING: 'Creating account...',
  RESETTING_PASSWORD: 'Resetting password...',
  
  // Wallet
  LOADING_WALLET: 'Loading wallet...',
  FETCHING_BALANCE: 'Fetching balance...',
  PROCESSING_PAYMENT: 'Processing payment...',
  TRANSFERRING: 'Transferring funds...',
  
  // General
  LOADING: 'Loading...',
  PLEASE_WAIT: 'Please wait...',
  CONNECTING: 'Connecting...',
  VERIFYING: 'Verifying...',
};

export const ErrorMessages = {
  // Network errors
  NETWORK_ERROR: 'Cannot connect to server. Check your internet connection.',
  CONNECTION_TIMEOUT: 'Connection timeout. Please try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  
  // Auth errors
  INVALID_CREDENTIALS: 'Invalid email or password.',
  ACCOUNT_LOCKED: 'Account temporarily locked. Try again later.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  
  // Generic
  SOMETHING_WENT_WRONG: 'Something went wrong. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};

/**
 * Determine if error is a network error
 * @param {Error} error - The error object
 * @returns {boolean}
 */
export const isNetworkError = (error) => {
  if (!error) return false;
  
  // Check error message
  if (error.message?.includes('Network') ||
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('ETIMEDOUT') ||
      error.message?.includes('ERR_NETWORK') ||
      error.message?.includes('fetch failed')) {
    return true;
  }
  
  // Check error code
  if (error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ERR_NETWORK') {
    return true;
  }
  
  // No response from server
  if (!error.response) {
    return true;
  }
  
  return false;
};

/**
 * Get user-friendly error message
 * @param {Error} error - The error object
 * @returns {string}
 */
export const getErrorMessage = (error) => {
  if (!error) return ErrorMessages.UNKNOWN_ERROR;
  
  // Network error
  if (isNetworkError(error)) {
    return ErrorMessages.NETWORK_ERROR;
  }
  
  // HTTP error responses
  if (error.response?.status) {
    switch (error.response.status) {
      case 400:
        return error.response.data?.message || 'Invalid request. Please check your input.';
      case 401:
        return error.response.data?.message || ErrorMessages.INVALID_CREDENTIALS;
      case 403:
        return error.response.data?.message || 'Access denied.';
      case 404:
        return error.response.data?.message || 'Resource not found.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return ErrorMessages.SERVER_ERROR;
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return error.response.data?.message || ErrorMessages.SOMETHING_WENT_WRONG;
    }
  }
  
  // Fallback to error message
  return error.message || ErrorMessages.UNKNOWN_ERROR;
};

/**
 * Create a timeout promise
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise}
 */
export const createTimeout = (ms = 30000) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(ErrorMessages.CONNECTION_TIMEOUT));
    }, ms);
  });
};

/**
 * Wrap a promise with timeout
 * @param {Promise} promise - The promise to wrap
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise}
 */
export const withTimeout = (promise, timeoutMs = 30000) => {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(ErrorMessages.CONNECTION_TIMEOUT));
    }, timeoutMs);
  });
  
  return Promise.race([promise, timeout]);
};

/**
 * Retry mechanism for failed requests
 * @param {Function} fn - Async function to retry
 * @param {number} maxAttempts - Maximum number of attempts
 * @param {number} delayMs - Delay between retries in milliseconds
 * @returns {Promise}
 */
export const withRetry = async (fn, maxAttempts = 3, delayMs = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      
      // Wait before retrying (except on last attempt)
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw lastError;
};

/**
 * Loading hook helper (for custom hooks)
 * @returns {Object} { state, isLoading, error, setLoading, setError, reset }
 */
export const useLoadingState = () => {
  const [state, setState] = React.useState({
    status: LoadingStates.IDLE,
    error: null,
    message: '',
  });
  
  return {
    ...state,
    isLoading: state.status === LoadingStates.LOADING,
    setLoading: (message = '') => setState({
      status: LoadingStates.LOADING,
      error: null,
      message,
    }),
    setError: (error, message = '') => setState({
      status: LoadingStates.ERROR,
      error,
      message: message || getErrorMessage(error),
    }),
    setSuccess: (message = '') => setState({
      status: LoadingStates.SUCCESS,
      error: null,
      message,
    }),
    reset: () => setState({
      status: LoadingStates.IDLE,
      error: null,
      message: '',
    }),
  };
};

export default {
  LoadingStates,
  LoadingMessages,
  ErrorMessages,
  isNetworkError,
  getErrorMessage,
  createTimeout,
  withTimeout,
  withRetry,
};
