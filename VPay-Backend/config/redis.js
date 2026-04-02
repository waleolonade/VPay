const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient;

const connectRedis = () => {
  redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });

  redisClient.on('connect', () => logger.info('Redis connected'));
  redisClient.on('error', (err) => {
    // Silently ignore connection errors — Redis is optional for development
    // Only log critical errors
    if (err.code !== 'ECONNREFUSED' && err.code !== 'ENOTFOUND' && err.code !== 'ETIMEDOUT' && err.code !== 'EHOSTUNREACH') {
      logger.warn(`Redis warning: ${err.message}`);
    }
  });
  redisClient.on('reconnecting', () => { }); // Silence reconnection attempts
  redisClient.on('ready', () => logger.info('Redis ready'));

  return redisClient;
};

const getRedisClient = () => {
  if (!redisClient) connectRedis();
  return redisClient;
};

module.exports = { connectRedis, getRedisClient };
