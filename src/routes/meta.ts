import { Router, Request, Response } from 'express';
import { verifyTypedData, encodeFunctionData, getAddress } from 'viem';
import { publicClient, walletClient } from '../config/viem.js';
import { logger } from '../utils/logger.js';

const router = Router();

// MinimalForwarder contract address
const FORWARDER_ADDRESS = getAddress('0x523D5F604788a9cFC74CcF81F0DE5B3b5623635F');

// MinimalForwarder ABI (only what we need)
const FORWARDER_ABI = [
  {
    name: 'getNonce',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'from', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'execute',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'req',
        type: 'tuple',
        components: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'gas', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint48' },
          { name: 'data', type: 'bytes' }
        ]
      },
      { name: 'signature', type: 'bytes' }
    ],
    outputs: [{ name: 'success', type: 'bool' }]
  },
  {
    name: 'verify',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      {
        name: 'req',
        type: 'tuple',
        components: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'gas', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint48' },
          { name: 'data', type: 'bytes' }
        ]
      },
      { name: 'signature', type: 'bytes' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;

// EIP-712 Domain
const FORWARDER_DOMAIN = {
  name: 'MinimalForwarder',
  version: '1',
  chainId: 338, // Cronos Testnet
  verifyingContract: FORWARDER_ADDRESS
} as const;

// EIP-712 Types
const FORWARD_REQUEST_TYPES = {
  ForwardRequest: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'gas', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint48' },
    { name: 'data', type: 'bytes' }
  ]
} as const;

// Pricing tiers
const PRICING = {
  slow: { multiplier: 0.8, emoji: '🐢', label: 'Économique', estimatedTime: '~30s' },
  normal: { multiplier: 1.0, emoji: '🚗', label: 'Standard', estimatedTime: '~10s' },
  fast: { multiplier: 1.5, emoji: '🚀', label: 'Prioritaire', estimatedTime: '~3s' }
};

// GET /meta/nonce/:address
router.get('/nonce/:address', async (req: Request, res: Response) => {
  try {
    const address = getAddress(req.params.address);
    
    const nonce = await publicClient.readContract({
      address: FORWARDER_ADDRESS,
      abi: FORWARDER_ABI,
      functionName: 'getNonce',
      args: [address]
    });

    logger.info({ address, nonce: nonce.toString() }, 'Nonce fetched');
    res.json({ nonce: nonce.toString() });
  } catch (error: any) {
    logger.error({ address: req.params.address, error: error.message }, 'Nonce fetch failed');
    res.status(500).json({ error: 'Failed to fetch nonce', details: error.message });
  }
});

// GET /meta/domain
router.get('/domain', (_req: Request, res: Response) => {
  res.json({ 
    domain: FORWARDER_DOMAIN,
    types: FORWARD_REQUEST_TYPES
  });
});

// POST /meta/relay
router.post('/relay', async (req: Request, res: Response) => {
  const { request, signature, priority = 'normal' } = req.body;

  if (!request || !signature) {
    return res.status(400).json({ error: 'Missing request or signature' });
  }

  try {
    logger.info({ from: request.from, to: request.to, priority }, 'Meta-tx relay request');

    // Build the forward request struct
    const forwardRequest = {
      from: getAddress(request.from),
      to: getAddress(request.to),
      value: BigInt(request.value || '0'),
      gas: BigInt(request.gas || '250000'),
      nonce: BigInt(request.nonce),
      deadline: Number(request.deadline),
      data: request.data as `0x${string}`
    };

    // Verify the signature on-chain
    const isValid = await publicClient.readContract({
      address: FORWARDER_ADDRESS,
      abi: FORWARDER_ABI,
      functionName: 'verify',
      args: [forwardRequest, signature as `0x${string}`]
    });

    if (!isValid) {
      logger.warn({ from: request.from }, 'Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Calculate gas pricing
    const gasPrice = await publicClient.getGasPrice();
    const tier = PRICING[priority as keyof typeof PRICING] || PRICING.normal;
    const adjustedGasPrice = (gasPrice * BigInt(Math.floor(tier.multiplier * 100))) / 100n;
    
    // Estimate gas for the execute call
    const gasEstimate = await publicClient.estimateGas({
      account: walletClient.account,
      to: FORWARDER_ADDRESS,
      data: encodeFunctionData({
        abi: FORWARDER_ABI,
        functionName: 'execute',
        args: [forwardRequest, signature as `0x${string}`]
      })
    });

    // Calculate cost in USDC (rough estimate: 1 CRO ≈ $0.10)
    const gasCostWei = gasEstimate * adjustedGasPrice;
    const gasCostCRO = Number(gasCostWei) / 1e18;
    const gasCostUSDC = (gasCostCRO * 0.10).toFixed(6);

    // Return 402 Payment Required with quote
    // In a full implementation, you'd wait for payment before executing
    // For now, we'll execute directly for testnet
    
    // Execute the meta-transaction
    const txHash = await walletClient.sendTransaction({
      to: FORWARDER_ADDRESS,
      data: encodeFunctionData({
        abi: FORWARDER_ABI,
        functionName: 'execute',
        args: [forwardRequest, signature as `0x${string}`]
      }),
      gas: (gasEstimate * 120n) / 100n, // 20% buffer
      maxFeePerGas: adjustedGasPrice,
      maxPriorityFeePerGas: adjustedGasPrice / 10n
    });

    logger.info({ 
      txHash, 
      from: request.from, 
      to: request.to,
      gasEstimate: gasEstimate.toString(),
      gasCostUSDC
    }, 'Meta-tx relayed');

    res.json({
      success: true,
      txHash,
      quote: {
        gasEstimate: gasEstimate.toString(),
        priceUSDC: gasCostUSDC,
        priority,
        priorityEmoji: tier.emoji,
        estimatedTime: tier.estimatedTime
      }
    });

  } catch (error: any) {
    logger.error({ from: request?.from, error: error.message }, 'Meta-tx relay failed');
    res.status(500).json({ error: 'Relay failed', details: error.message });
  }
});

export default router;