import type { LogLevel } from './types';

export const LOG_LEVELS: Record<LogLevel, number> = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
};

export const DEFAULT_REDACT_PATHS = [
  'password',
  'token',
  'secret',
  'credentials',
  'apiKey',
  'authorization',
  'cookie',
  'sessionId',
];

export const DEFAULT_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

export const DEFAULT_TIMESTAMP_KEY = 'timestamp';

export const DEFAULT_LEVEL_KEY = 'level';

export const DEFAULT_MESSAGE_KEY = 'msg';

export const DEFAULT_ERROR_KEY = 'error'; 