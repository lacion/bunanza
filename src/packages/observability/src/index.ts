export { createLogger, defaultLogger } from './logger';
export { errorSerializer, isError } from './utils/errors';
export {
  createContextLogger,
  generateRequestId,
  withRequestContext,
  withUserContext,
  withTraceContext,
} from './utils/context';
export { defaultOptions } from './config/defaults';
export { LOG_LEVELS, DEFAULT_LEVEL } from './constants';

// Type exports
export type {
  Logger,
  LoggerOptions,
  LogLevel,
  LogFn,
  RedactOptions,
  Formatters,
  Serializers,
} from './types';
export type { LogContext } from './utils/context';
export type { SerializedError } from './utils/errors'; 