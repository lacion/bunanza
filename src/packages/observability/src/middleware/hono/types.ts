import type { Context } from 'hono';
import type { Logger, LogLevel } from '../../types';

export interface HonoLoggerOptions {
  // Logger configuration
  logger?: Logger;
  level?: LogLevel;
  
  // Request logging options
  includeHeaders?: boolean | string[];
  redactHeaders?: string[];
  includeQueryParams?: boolean;
  
  // Performance options
  slowRequestThreshold?: number;
  
  // Context options
  getUserContext?: (c: Context) => Record<string, unknown>;
  
  // Custom formatters
  formatRequest?: (req: Request, c: Context) => Record<string, unknown>;
  formatResponse?: (res: Response, c: Context) => Record<string, unknown>;
  formatError?: (error: Error, c: Context) => Record<string, unknown>;
}

// Extend Hono's Context type to include our logger
declare module 'hono' {
  interface ContextVariableMap {
    logger: Logger;
  }
} 