import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { encodeFunctionData, parseEther } from 'viem';
import { publicClient, walletClient, USDC_ADDRESS, USDC_ABI } from '../config/viem.js';
import { logger } from '../utils/logger.js';
import { FaucetResponse } from '../types/index.js';

const router = Router();
const DRIP_AMOUNT_USD = 10; // 10 USDC per drip (6 decimals)
const USDC_DECIMALS = 6n;
const DRIP_AMOUNT_CRO = '0.1'; // 0.1 CRO per drip

router.post('/usdc', 
  // validation middleware already in index.ts
  async (req: Request, res: Response) => {
    const { address } = (req as any).validated;
    
    try {
      logger.info({ address }, 'USDC Faucet request');

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

      // Execute transfer with 20% gas buffer
      const hash = await walletClient.sendTransaction({
        to: USDC_ADDRESS,
        data: encodeFunctionData({
          abi: USDC_ABI,
          functionName: 'transfer',
          args: [address, (BigInt(DRIP_AMOUNT_USD) * 10n ** USDC_DECIMALS)]
        }),
        gas: (gasEst * 120n) / 100n  // Add 20% buffer for safety
      });

      logger.info({ hash, address, amount: DRIP_AMOUNT_USD }, 'USDC Faucet success');
      
      const response: FaucetResponse = {
        hash,
        amount: DRIP_AMOUNT_USD,
        message: `${DRIP_AMOUNT_USD} test USDC sent`
      };
      
      res.status(200).json(response);
      
    } catch (error: any) {
      logger.error({ address, error: error.message }, 'USDC Faucet failed');
      res.status(500).json({ error: 'Transfer failed', details: error.message });
    }
  }
);

router.post('/cro',
  // validation middleware already in index.ts
  async (req: Request, res: Response) => {
    const { address } = (req as any).validated;
    
    try {
      logger.info({ address }, 'CRO Faucet request');

      const amountWei = parseEther(DRIP_AMOUNT_CRO);

      // Estimate gas for native transfer
      const gasEst = await publicClient.estimateGas({
        account: walletClient.account,
        to: address,
        value: amountWei
      });

      // Execute native CRO transfer
      const hash = await walletClient.sendTransaction({
        to: address,
        value: amountWei,
        gas: (gasEst * 120n) / 100n  // Add 20% buffer for safety
      });

      logger.info({ hash, address, amount: DRIP_AMOUNT_CRO }, 'CRO Faucet success');
      
      const response: FaucetResponse = {
        hash,
        amount: parseFloat(DRIP_AMOUNT_CRO),
        message: `${DRIP_AMOUNT_CRO} CRO sent`
      };
      
      res.status(200).json(response);
      
    } catch (error: any) {
      logger.error({ address, error: error.message }, 'CRO Faucet failed');
      res.status(500).json({ error: 'CRO transfer failed', details: error.message });
    }
  }
);

export default router;