import pino from 'pino';
import type { Logger, LoggerOptions } from './types';
import { defaultOptions } from './config/defaults';
import { createContextLogger } from './utils/context';

export const createLogger = (options: Partial<LoggerOptions> = {}): Logger => {
  const mergedOptions = {
    ...defaultOptions,
    ...options,
  };

  const logger = pino(mergedOptions) as unknown as Logger;

  // Extend the logger with additional functionality
  const extendedLogger = logger as Logger & { withContext: Logger['withContext'] };

  // Add withContext method
  extendedLogger.withContext = function(context: Record<string, unknown>): Logger {
    return createContextLogger(this, context);
  };

  return extendedLogger;
};

// Create a default logger instance
export const defaultLogger = createLogger();

// Setup global error handlers
if (typeof process !== 'undefined') {
  process.on('uncaughtException', (err) => {
    defaultLogger.fatal({ err }, 'Uncaught Exception');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    defaultLogger.fatal({ err: reason }, 'Unhandled Promise Rejection');
    process.exit(1);
  });
} 