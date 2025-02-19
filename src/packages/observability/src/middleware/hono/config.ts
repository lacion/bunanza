import type { HonoLoggerOptions } from './types';

export const defaultOptions: HonoLoggerOptions = {
  includeHeaders: false,
  includeQueryParams: false,
  slowRequestThreshold: 1000, // 1 second
  redactHeaders: [
    'authorization',
    'cookie',
    'set-cookie',
    'x-api-key',
    'x-auth-token'
  ]
}; 