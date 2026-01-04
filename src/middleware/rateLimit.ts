import { RequestHandler } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { logger } from '../utils/logger.js';
import { RATE_LIMIT_WINDOW } from '../utils/env.js';

// Separate limiters for USDC and CRO faucets
const usdcLimiter = new RateLimiterMemory({
  points: 1,
  duration: RATE_LIMIT_WINDOW,
  keyPrefix: 'faucet_usdc'
});

const croLimiter = new RateLimiterMemory({
  points: 1,
  duration: RATE_LIMIT_WINDOW,
  keyPrefix: 'faucet_cro'
});

export const createUsdcFaucetLimiter = (): RequestHandler => {
  return async (req: any, res: any, next: () => void) => {
    try {
      await usdcLimiter.consume(req.body.address);
      next();
    } catch (rejRes: any) {
      const retryAfter = Math.ceil(rejRes.msBeforeNext / 1000);
      logger.warn({ address: req.body.address, retryAfter }, 'USDC faucet rate limited');
      res.status(429).json({ 
        error: 'USDC faucet limit reached (1 per 24hrs)',
        retryAfter
      });
    }
  };
};

export const createCroFaucetLimiter = (): RequestHandler => {
  return async (req: any, res: any, next: () => void) => {
    try {
      await croLimiter.consume(req.body.address);
      next();
    } catch (rejRes: any) {
      const retryAfter = Math.ceil(rejRes.msBeforeNext / 1000);
      logger.warn({ address: req.body.address, retryAfter }, 'CRO faucet rate limited');
      res.status(429).json({ 
        error: 'CRO faucet limit reached (1 per 24hrs)',
        retryAfter
      });
    }
  };
};

// Legacy export for backward compatibility
export const createFaucetLimiter = createUsdcFaucetLimiter;