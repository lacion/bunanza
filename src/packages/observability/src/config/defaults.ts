import type { LoggerOptions } from '../types';
import { DEFAULT_LEVEL, DEFAULT_REDACT_PATHS } from '../constants';
import { errorSerializer } from '../utils/errors';

export const defaultOptions: LoggerOptions = {
  level: DEFAULT_LEVEL,
  timestamp: true,
  formatters: {
    level: (label: string) => ({ level: label }),
  },
  redact: {
    paths: DEFAULT_REDACT_PATHS,
    remove: true,
  },
  serializers: {
    error: errorSerializer,
  },
  base: null,
  messageKey: 'msg',
  errorKey: 'error',
}; 