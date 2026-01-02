import { RequestHandler } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { logger } from '../utils/logger.js';
import { RATE_LIMIT_WINDOW } from '../utils/env.js';

// Using in-memory rate limiter (for production, consider Redis for multi-instance deployments)
export const createFaucetLimiter = (): RequestHandler => {
  const limiter = new RateLimiterMemory({
    points: 1, // Number of requests
    duration: RATE_LIMIT_WINDOW, // Per window in seconds
    keyPrefix: 'faucet'
  });

  return async (req: any, res: any, next: () => void) => {
    try {
      await limiter.consume(req.body.address);
      next();
    } catch (rejRes: any) {
      logger.warn({ address: req.body.address, remaining: rejRes.remainingPoints }, 'Rate limited');
      res.status(429).json({ error: 'Too many requests' });
    }
  };
};