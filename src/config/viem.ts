import { createPublicClient, http, createWalletClient, getAddress } from 'viem';
import { cronosTestnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import CryptoJS from 'crypto-js';
import { RELAYER_PRIVATE_KEY, CRONOS_RPC_URL } from '../utils/env.js';

const getPrivateKey = (): `0x${string}` => {
  if (!RELAYER_PRIVATE_KEY) {
    throw new Error('RELAYER_PRIVATE_KEY environment variable is required');
  }

  // If ENCRYPTION_KEY is provided, assume the private key is encrypted
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (encryptionKey) {
    try {
      const decrypted = CryptoJS.AES.decrypt(RELAYER_PRIVATE_KEY, encryptionKey).toString(CryptoJS.enc.Utf8);
      if (!decrypted || decrypted.length === 0) {
        throw new Error('Decryption resulted in empty string');
      }
      return decrypted as `0x${string}`;
    } catch (error) {
      throw new Error(`Failed to decrypt private key: ${error instanceof Error ? error.message : 'Unknown error'}. Check that ENCRYPTION_KEY is correct and RELAYER_PRIVATE_KEY is properly encrypted.`);
    }
  }

  // Otherwise, use the private key as-is (plain text)
  // Validate it's a valid hex private key
  if (!RELAYER_PRIVATE_KEY.startsWith('0x') || RELAYER_PRIVATE_KEY.length !== 66) {
    throw new Error('RELAYER_PRIVATE_KEY must be a 32-byte hex string starting with 0x (66 characters total), or provide ENCRYPTION_KEY to decrypt an encrypted key');
  }

  return RELAYER_PRIVATE_KEY as `0x${string}`;
};

export const publicClient = createPublicClient({
  chain: cronosTestnet,
  transport: http(CRONOS_RPC_URL),
});

export const relayerAccount = privateKeyToAccount(getPrivateKey());
export const walletClient = createWalletClient({
  chain: cronosTestnet,
  transport: http(CRONOS_RPC_URL),
  account: relayerAccount,
});

export const USDC_ADDRESS = getAddress('0xF94b01ec5Bdc9F77cB77d4Cb1d5036D0b3f79C92');

export const USDC_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }]
  },
  {
    name: 'transferWithAuthorization',
    type: 'function',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' }
    ]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  }
] as const;