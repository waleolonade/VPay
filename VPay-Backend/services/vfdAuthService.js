const axios = require('axios');
const logger = require('../utils/logger');

const VFD_AUTH_URL = {
  test: 'https://api-devapps.vfdbank.systems/vfd-tech/baas-portal/v1.1/baasauth/token',
  live: 'https://api-apps.vfdbank.systems/vfd-tech/baas-portal/v1.1/baasauth/token',
};

// In-memory token cache (fallback when Redis is not available)
let _cachedToken = null;
let _tokenExpiry = null;

/**
 * Get the correct auth URL based on NODE_ENV
 */
const getAuthUrl = () =>
  process.env.NODE_ENV === 'production' ? VFD_AUTH_URL.live : VFD_AUTH_URL.test;

/**
 * Generate a new VFD access token by calling BaaS portal
 */
const generateToken = async () => {
  const consumerKey = process.env.VFD_CONSUMER_KEY;
  const consumerSecret = process.env.VFD_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error('VFD_CONSUMER_KEY or VFD_CONSUMER_SECRET not configured in .env');
  }

  try {
    const authUrl = getAuthUrl();
    logger.info(`[VFD Auth] Requesting token from ${authUrl}`);

    const response = await axios.post(
      authUrl,
      {
        consumerKey,
        consumerSecret,
        validityTime: process.env.VFD_TOKEN_VALIDITY || '-1',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );

    const data = response.data;
    logger.info(`[VFD Auth] Response status: ${data.status}, has token: ${!!data.data?.access_token}`);

    if (data.status !== '00') {
      logger.error(`[VFD Auth] Error response: ${JSON.stringify(data)}`);
      throw new Error(`VFD token generation failed: ${data.message}`);
    }

    if (!data.data?.access_token) {
      logger.error(`[VFD Auth] Invalid response structure: ${JSON.stringify(data)}`);
      throw new Error('VFD token response missing access_token field');
    }

    const token = data.data.access_token;
    const expiresIn = data.data.expires_in; // milliseconds; 9223372036854775807 means no expiry

    // Cache in memory with expiry — cap at 1 hour to prevent serving old tokens
    _cachedToken = token;
    const MAX_CACHE_MS = 60 * 60 * 1000; // 1 hour
    const rawTtl = expiresIn >= 9223372036854775000 ? MAX_CACHE_MS : Number(expiresIn) - 60_000;
    const ttlMs = Math.min(rawTtl, MAX_CACHE_MS);
    _tokenExpiry = Date.now() + ttlMs;

    // Optionally cache in Redis if available
    try {
      const { getRedisClient } = require('../config/redis');
      const redis = getRedisClient();
      if (redis) {
        const redisTTL = Math.floor(ttlMs / 1000);
        if (redisTTL > 0) {
          await redis.set('vfd:access_token', token, 'EX', redisTTL);
        } else {
          await redis.set('vfd:access_token', token);
        }
      }
    } catch (redisErr) {
      logger.warn(`Redis token cache unavailable: ${redisErr.message}`);
    }

    logger.info('[VFD Auth] Token generated successfully');
    return token;
  } catch (error) {
    logger.error(`[VFD Auth] Generation failed: ${error.response?.status} ${error.message}`);
    if (error.response?.data) {
      logger.error(`[VFD Auth] Response body: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
};

/**
 * Get a valid VFD access token (from cache or fresh).
 * Pass forceRefresh=true to bypass the cache (e.g. after a 403).
 */
const getToken = async (forceRefresh = false) => {
  if (!forceRefresh) {
    // 1. Try Redis
    try {
      const { getRedisClient } = require('../config/redis');
      const redis = getRedisClient();
      if (redis) {
        const cached = await redis.get('vfd:access_token');
        if (cached) return cached;
      }
    } catch (_) {
      // Redis unavailable — fall through
    }

    // 2. In-memory cache
    if (_cachedToken && _tokenExpiry && Date.now() < _tokenExpiry) {
      return _cachedToken;
    }
  } else {
    // Force clear cached token
    _cachedToken = null;
    _tokenExpiry = null;
    try {
      const { getRedisClient } = require('../config/redis');
      const redis = getRedisClient();
      if (redis) await redis.del('vfd:access_token');
    } catch (_) { }
  }

  // 3. Generate fresh token
  return generateToken();
};

/**
 * Return axios headers with a valid VFD access token
 */
const getAuthHeaders = async (forceRefresh = false) => {
  const token = await getToken(forceRefresh);
  return {
    Authorization: `Bearer ${token}`,
    AccessToken: token, // Keep for compatibility
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };
};

/**
 * Invalidate the cached token (in-memory and Redis) so the next
 * getToken() call forces a fresh token generation.
 * Call this when the VFD API returns 401/403 (stale token).
 */
const invalidateToken = async () => {
  _cachedToken = null;
  _tokenExpiry = null;
  try {
    const { getRedisClient } = require('../config/redis');
    const redis = getRedisClient();
    if (redis) await redis.del('vfd:access_token');
  } catch (_) {
    // Redis unavailable — in-memory already cleared above
  }
};

module.exports = { getToken, generateToken, getAuthHeaders, invalidateToken };
