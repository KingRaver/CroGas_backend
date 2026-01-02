# CroGas Key Generation Scripts

This directory contains utility scripts for generating and managing relayer wallet keys securely.

## Available Scripts

### 1. Generate New Keys (`npm run generate-keys`)

Generates a brand new relayer wallet with encrypted private key.

```bash
npm run generate-keys
```

**Output:**
- `RELAYER_PRIVATE_KEY`: Encrypted private key (safe to store in .env)
- `ENCRYPTION_KEY`: Encryption key (store separately in production)
- Wallet address for funding

**What to do next:**
1. Copy the `RELAYER_PRIVATE_KEY` and `ENCRYPTION_KEY` to your `.env` file
2. Fund the wallet address with CRO (for gas) and USDC (for faucet drips)

---

### 2. Encrypt Existing Key (`npm run encrypt-key`)

Encrypts an existing private key you already have.

```bash
npm run encrypt-key
```

**Interactive prompt:**
- Enter your existing private key (0x...)
- Outputs encrypted version safe for storage

**Use case:** If you already have a funded wallet on Cronos testnet

---

### 3. Get Wallet Address

Get the wallet address from a private key.

```bash
node scripts/get-address.js 0xYOUR_PRIVATE_KEY_HERE
```

---

## Setup Instructions

### Option A: Generate New Wallet (Recommended for testing)

1. Generate keys:
   ```bash
   npm run generate-keys
   ```

2. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Add the generated keys to `.env`:
   ```bash
   RELAYER_PRIVATE_KEY=U2FsdGVkX1...
   ENCRYPTION_KEY=abc123...
   ```

4. Fund the wallet address shown in the output:
   - Get testnet CRO from [Cronos Faucet](https://cronos.org/faucet)
   - Get testnet USDC from a testnet faucet

---

### Option B: Use Existing Wallet

1. Encrypt your existing private key:
   ```bash
   npm run encrypt-key
   ```

2. Add to `.env`:
   ```bash
   RELAYER_PRIVATE_KEY=U2FsdGVkX1...
   ENCRYPTION_KEY=abc123...
   ```

---

### Option C: Use Plain Private Key (Development Only)

For local development, you can skip encryption:

1. Add to `.env`:
   ```bash
   RELAYER_PRIVATE_KEY=0x636f88de6b38da969c7e8629e0ca175e1b4b79ffe68734dc9d2de7ec00188fd9
   # Don't set ENCRYPTION_KEY
   ```

⚠️ **Never use plain private keys in production!**

---

## Security Best Practices

### Development
- ✅ Use encrypted keys even in development
- ✅ Add `.env` to `.gitignore`
- ✅ Use testnet funds only

### Production
- ✅ Store `ENCRYPTION_KEY` in a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
- ✅ Never commit keys to version control
- ✅ Use environment variables or secrets injection
- ✅ Rotate keys periodically
- ✅ Monitor wallet balance and transactions
- ✅ Set up alerts for low balances

---

## Funding the Relayer Wallet

The relayer wallet needs two types of funds:

1. **CRO (Native token)** - For gas fees
   - Recommended: 10-100 CRO for testnet
   - Each transaction costs ~0.001-0.01 CRO

2. **USDC (ERC-20)** - For faucet drips
   - Recommended: 1000-10000 USDC for testnet
   - Contract: `0xF94b01ec5Bdc9F77cB77d4Cb1d5036D0b3f79C92`
   - Each faucet drip sends 10 USDC

### Get Testnet Funds
- CRO: https://cronos.org/faucet
- USDC: Deploy a test USDC contract or use existing testnet USDC

---

## Troubleshooting

### "Failed to decrypt private key"
- Check that `ENCRYPTION_KEY` matches the one used to encrypt
- Verify `RELAYER_PRIVATE_KEY` is the encrypted string, not plain text

### "Invalid private key format"
- Private keys must be 32 bytes (64 hex chars) prefixed with `0x` (66 total)
- Example: `0x636f88de6b38da969c7e8629e0ca175e1b4b79ffe68734dc9d2de7ec00188fd9`

### "RELAYER_PRIVATE_KEY environment variable is required"
- Make sure `.env` file exists and contains `RELAYER_PRIVATE_KEY`
- Check that `dotenv` is loading (it should be in `src/index.ts`)
