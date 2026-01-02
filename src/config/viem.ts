import { createPublicClient, http, createWalletClient } from 'viem';
import { cronosTestnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import CryptoJS from 'crypto-js';
import { RELAYER_PRIVATE_KEY, CRONOS_RPC_URL } from '../utils/env.js';

const decryptKey = (encryptedKey: string, encryptionKey: string): `0x${string}` => {
  const decrypted = CryptoJS.AES.decrypt(encryptedKey, encryptionKey).toString(CryptoJS.enc.Utf8);
  return decrypted as `0x${string}`;
};

export const publicClient = createPublicClient({
  chain: cronosTestnet,
  transport: http(CRONOS_RPC_URL),
});

export const relayerAccount = privateKeyToAccount(decryptKey(RELAYER_PRIVATE_KEY!, process.env.ENCRYPTION_KEY!));
export const walletClient = createWalletClient({
  chain: cronosTestnet,
  transport: http(CRONOS_RPC_URL),
  account: relayerAccount,
});

export const USDC_ADDRESS = '0xF94b01ec5Bdc9F77cB77d4Cb1d5036D0b3f79C92' as const;

export const USDC_ABI = [
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
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  }
] as const;