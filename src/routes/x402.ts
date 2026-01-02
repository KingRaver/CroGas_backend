import { Router, Request, Response } from 'express';
import { verifyTypedData, encodeFunctionData } from 'viem';
import { publicClient, walletClient, USDC_ADDRESS, USDC_ABI } from '../config/viem.js';
import { logger } from '../utils/logger.js';
import { X402Response } from '../types/index.js';

const router = Router();

router.post('/facilitate',
  // validation middleware already in index.ts
  async (req: Request, res: Response) => {
    const { typedData, signature, targetTx } = (req as any).validated;
    
    try {
      logger.info({ targetTx: targetTx.to }, 'x402 facilitation request');

      // 1. Verify EIP-712 typed data signature
      const isValidSig = await verifyTypedData({
        ...typedData,
        signature
      });
      
      if (!isValidSig) {
        logger.warn({ targetTx: targetTx.to }, 'Invalid signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // 2. Estimate gas for target transaction
      const gasEst = await publicClient.estimateGas({
        account: targetTx.to,
        data: targetTx.data,
        value: targetTx.value || 0n
      });
      
      const gasPrice = await publicClient.getGasPrice();
      const gasCostEth = gasEst * gasPrice;
      
      // 3. Calculate USD equivalent (rough 1 CRO = $0.0001 for testnet)
      const gasCostUSD = Number(gasCostEth) * 0.0001 / 1e18;
      const gasCostUSDC = BigInt(Math.ceil(gasCostUSD * 1e6)); // 6 decimals

      // 4. Execute authorized USDC transfer (EIP-3009 style via typedData)
      // Decode from typedData.message for transferWithAuthorization params
      const { message: auth } = typedData;
      const authHash = await walletClient.sendTransaction({
        to: USDC_ADDRESS,
        data: encodeFunctionData({
          abi: USDC_ABI,
          functionName: 'transferWithAuthorization',
          args: [
            auth.from,           // agent address
            walletClient.account.address, // relayer
            gasCostUSDC,
            auth.validAfter,
            auth.validBefore,
            auth.nonce,
            parseInt(signature.slice(-1)), // v
            signature.slice(2, 66) as `0x${string}`, // r
            '0x' + signature.slice(-64) as `0x${string}` // s
          ]
        })
      });

      // 5. Relay the target transaction (relayer pays CRO gas)
      const relayHash = await walletClient.sendTransaction(targetTx);

      logger.info({ 
        authHash, 
        relayHash, 
        gasEst, 
        gasCostUSD,
        target: targetTx.to 
      }, 'x402 success');

      const response: X402Response = {
        authHash,
        relayHash,
        gasUsed: gasEst,
        gasCostUSD
      };

      res.status(200).json(response);
      
    } catch (error: any) {
      logger.error({ targetTx: targetTx?.to, error: error.message }, 'x402 failed');
      res.status(500).json({ error: 'Facilitation failed', details: error.message });
    }
  }
);

export default router;