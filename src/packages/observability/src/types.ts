import type { LoggerOptions as PinoLoggerOptions, Logger as PinoLogger } from 'pino';

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export type LogArgument = string | number | boolean | null | undefined | Record<string, unknown>;

export interface LogFn {
  (obj: Record<string, unknown>, msg?: string, ...args: LogArgument[]): void;
  (msg: string, ...args: LogArgument[]): void;
}

export interface RedactOptions {
  paths: string[];
  remove?: boolean;
  censor?: string;
}

export interface Formatters {
  level?: (label: string, number: number) => Record<string, unknown>;
  bindings?: (bindings: Record<string, unknown>) => Record<string, unknown>;
  log?: (object: Record<string, unknown>) => Record<string, unknown>;
}

export interface Serializers {
  [key: string]: (value: unknown) => Record<string, unknown>;
}

export interface LoggerOptions extends Omit<PinoLoggerOptions, 'redact' | 'formatters'> {
  level?: LogLevel;
  redact?: string[] | RedactOptions;
  timestamp?: boolean | (() => string);
  formatters?: Formatters;
  serializers?: Serializers;
  base?: Record<string, unknown> | null;
  context?: Record<string, unknown>;
}

// Create a base logger type without the methods we're going to override
type BaseLogger = Omit<PinoLogger, 'level' | 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'child'>;

export interface Logger extends BaseLogger {
  fatal: LogFn;
  error: LogFn;
  warn: LogFn;
  info: LogFn;
  debug: LogFn;
  trace: LogFn;
  level: LogLevel;
  child(bindings: Record<string, unknown>): Logger;
  withContext(context: Record<string, unknown>): Logger;
} 