#!/usr/bin/env node
import crypto from 'crypto';
import CryptoJS from 'crypto-js';

console.log('🔐 Generating CroGas Relayer Keys\n');

// Generate a random 32-byte private key
const privateKeyBytes = crypto.randomBytes(32);
const privateKey = '0x' + privateKeyBytes.toString('hex');

// Generate a random encryption key (32 characters for AES-256)
const encryptionKey = crypto.randomBytes(32).toString('hex');

// Encrypt the private key
const encryptedPrivateKey = CryptoJS.AES.encrypt(privateKey, encryptionKey).toString();

console.log('✅ Keys generated successfully!\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📋 Add these to your .env file:\n');
console.log(`RELAYER_PRIVATE_KEY=${encryptedPrivateKey}`);
console.log(`ENCRYPTION_KEY=${encryptionKey}\n`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📝 Relayer Wallet Address (fund this with CRO for gas):');

// Derive the address from the private key using a simple approach
// For production, you'd want to use viem or ethers to properly derive the address
console.log('   Use this private key to import into a wallet to get the address:');
console.log(`   ${privateKey}\n`);
console.log('⚠️  SECURITY NOTES:');
console.log('   - Keep the ENCRYPTION_KEY secret and separate from the codebase');
console.log('   - Fund the relayer wallet with enough CRO for gas fees');
console.log('   - Fund the relayer wallet with USDC for faucet drips');
console.log('   - Never commit the .env file to version control\n');

// Optional: Show how to decrypt
console.log('🔓 Verification (decryption test):');
const decrypted = CryptoJS.AES.decrypt(encryptedPrivateKey, encryptionKey).toString(CryptoJS.enc.Utf8);
console.log(`   Decrypted matches original: ${decrypted === privateKey ? '✅ YES' : '❌ NO'}\n`);
