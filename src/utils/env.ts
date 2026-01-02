export const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
export const CRONOS_RPC_URL = process.env.CRONOS_RPC_URL || 'https://evm-t3.cronos.org';
export const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '86400');
export const MAX_FAUCET_USD = parseFloat(process.env.MAX_FAUCET_USD || '100');