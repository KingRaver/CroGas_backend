import { RequestHandler } from 'express';
import Redis from 'rate-limiter-flexible'; // Note: needs redis client
import { logger } from '../utils/logger.js';

let redisStore: any; // Initialize in index.ts

export const createFaucetLimiter = (): RequestHandler => {
  const limiter = new Redis.RateLimiterRedis({
    storeClient: redisStore,
    points: 1,
    duration: RATE_LIMIT_WINDOW,
    keyPrefix: 'faucet'
  });

  return async (req: any, res: any, next: () => void) => {
    try {
      await limiter.consume(req.body.address);
      next();
    } catch (rejRes) {
      logger.warn({ address: req.body.address, remaining: rejRes.remainingPoints }, 'Rate limited');
      res.status(429).json({ error: 'Too many requests' });
    }
  };
};