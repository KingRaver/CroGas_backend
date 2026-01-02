import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { encodeFunctionData } from 'viem';
import { publicClient, walletClient, USDC_ADDRESS, USDC_ABI } from '../config/viem.js';
import { logger } from '../utils/logger.js';
import { FaucetResponse } from '../types/index.js';

const router = Router();
const DRIP_AMOUNT_USD = 10; // 10 USDC per drip (6 decimals)
const USDC_DECIMALS = 6n;

router.post('/usdc', 
  // validation middleware already in index.ts
  async (req: Request, res: Response) => {
    const { address } = (req as any).validated;
    
    try {
      logger.info({ address }, 'Faucet request');

      // Estimate gas cost for transfer (relayer pays CRO gas)
      const gasEst = await publicClient.estimateGas({
        account: walletClient.account,
        to: USDC_ADDRESS,
        data: encodeFunctionData({
          abi: USDC_ABI,
          functionName: 'transfer',
          args: [address, (BigInt(DRIP_AMOUNT_USD) * 10n ** USDC_DECIMALS)]
        })
      });

      // Execute transfer (relayer must be pre-funded with USDC)
      const hash = await walletClient.sendTransaction({
        to: USDC_ADDRESS,
        data: encodeFunctionData({
          abi: USDC_ABI,
          functionName: 'transfer',
          args: [address, (BigInt(DRIP_AMOUNT_USD) * 10n ** USDC_DECIMALS)]
        }),
        gas: gasEst
      });

      logger.info({ hash, address, amount: DRIP_AMOUNT_USD }, 'Faucet success');
      
      const response: FaucetResponse = {
        hash,
        amount: DRIP_AMOUNT_USD,
        message: `${DRIP_AMOUNT_USD} test USDC sent`
      };
      
      res.status(200).json(response);
      
    } catch (error: any) {
      logger.error({ address, error: error.message }, 'Faucet failed');
      res.status(500).json({ error: 'Transfer failed', details: error.message });
    }
  }
);

export default router;