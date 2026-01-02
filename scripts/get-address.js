#!/usr/bin/env node
import { privateKeyToAccount } from 'viem/accounts';

const privateKey = process.argv[2];

if (!privateKey) {
  console.error('Usage: node get-address.js 0x...');
  process.exit(1);
}

if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
  console.error('Invalid private key format. Must start with 0x and be 66 characters long.');
  process.exit(1);
}

const account = privateKeyToAccount(privateKey);
console.log(`\n📍 Wallet Address: ${account.address}\n`);
console.log('Fund this address with:');
console.log('  - CRO for gas fees (e.g., 10 CRO)');
console.log('  - USDC for faucet drips (e.g., 1000 USDC)\n');
