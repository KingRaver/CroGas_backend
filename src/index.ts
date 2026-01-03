import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import faucetRouter from './routes/faucet.js';
import x402Router from './routes/x402.js';
import { logger } from './utils/logger.js';
import { validateFaucet, validateX402 } from './middleware/validation.js';
import { createFaucetLimiter } from './middleware/rateLimit.js';
import metaRouter from './routes/meta.js';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "evm-t3.cronos.org"],
      scriptSrc: ["'self'"]
    }
  }
}));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json({ limit: '1mb' }));

// Health check (no logs)
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Rate limited + validated routes
app.use('/faucet', createFaucetLimiter(), validateFaucet, faucetRouter);
app.use('/x402', validateX402, x402Router); // x402 has no rate limit (per-tx)
app.use('/meta', metaRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  logger.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info({ port: PORT }, 'CroGas backend started');
});