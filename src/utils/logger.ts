import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';
export const logger = pino({
  level: isDev ? 'debug' : 'info',
  redact: ['RELAYER_PRIVATE_KEY', 'ENCRYPTION_KEY'],
  transport: isDev ? { target: 'pino-pretty' } : undefined
});