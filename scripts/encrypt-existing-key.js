#!/usr/bin/env node
import crypto from 'crypto';
import CryptoJS from 'crypto-js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 Encrypt Existing Private Key\n');
console.log('This script will encrypt an existing private key for secure storage.\n');

rl.question('Enter your private key (0x...): ', (privateKey) => {
  // Validate private key format
  if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
    console.error('❌ Invalid private key format. Must start with 0x and be 66 characters long.');
    rl.close();
    process.exit(1);
  }

  // Generate a random encryption key
  const encryptionKey = crypto.randomBytes(32).toString('hex');

  // Encrypt the private key
  const encryptedPrivateKey = CryptoJS.AES.encrypt(privateKey, encryptionKey).toString();

  console.log('\n✅ Private key encrypted successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📋 Add these to your .env file:\n');
  console.log(`RELAYER_PRIVATE_KEY=${encryptedPrivateKey}`);
  console.log(`ENCRYPTION_KEY=${encryptionKey}\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('⚠️  SECURITY NOTES:');
  console.log('   - Keep the ENCRYPTION_KEY secret and separate from the codebase');
  console.log('   - Never commit the .env file to version control');
  console.log('   - Store the ENCRYPTION_KEY in a secure location (e.g., secrets manager)\n');

  // Verification
  const decrypted = CryptoJS.AES.decrypt(encryptedPrivateKey, encryptionKey).toString(CryptoJS.enc.Utf8);
  console.log('🔓 Verification (decryption test):');
  console.log(`   Decrypted matches original: ${decrypted === privateKey ? '✅ YES' : '❌ NO'}\n`);

  rl.close();
});
