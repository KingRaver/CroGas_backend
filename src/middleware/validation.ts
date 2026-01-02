import { RequestHandler } from 'express';
import { z } from 'zod';
import { FaucetRequest, X402Request } from '../types/index.js';

const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;

export const validateFaucet: RequestHandler = (req, res, next) => {
  const schema = z.object({ address: z.string().regex(ethereumAddressRegex, 'Invalid Ethereum address') });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid address', details: result.error });
  }
  (req as any).validated = result.data as FaucetRequest;
  next();
};

export const validateX402: RequestHandler = (req, res, next) => {
  const schema = z.object({
    typedData: z.object({ /* full EIP712 schema */ }),
    signature: z.string().startsWith('0x'),
    targetTx: z.object({
      to: z.string().regex(ethereumAddressRegex, 'Invalid Ethereum address'),
      data: z.string().startsWith('0x')
    })
  });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid x402 payload' });
  }
  (req as any).validated = result.data as X402Request;
  next();
};