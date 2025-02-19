import { describe, expect, test, beforeEach, mock } from 'bun:test';
import { createLogger } from '../logger';
import type { Logger, LoggerOptions } from '../types';

describe('Logger', () => {
  let logger: Logger;
  let mockWrite: ReturnType<typeof mock>;

  beforeEach(() => {
    mockWrite = mock(() => true);
    // Mock process.stdout.write
    const originalWrite = process.stdout.write;
    process.stdout.write = mockWrite as any;

    return () => {
      process.stdout.write = originalWrite;
    };
  });

  test('should create a logger with default options', () => {
    logger = createLogger();
    expect(logger).toBeDefined();
    expect(logger.level).toBe('info');
  });

  test('should create a logger with custom options', () => {
    const options: Partial<LoggerOptions> = {
      level: 'debug',
      base: { app: 'test' },
    };
    logger = createLogger(options);
    expect(logger.level).toBe('debug');
  });

  test('should log messages with correct level', () => {
    logger = createLogger();
    logger.info('test message');

    expect(mockWrite).toHaveBeenCalled();
    const loggedData = JSON.parse(mockWrite.mock.calls[0][0]);
    expect(loggedData.level).toBe('info'); // Pino uses string levels in v9
    expect(loggedData.msg).toBe('test message');
  });

  test('should redact sensitive information', () => {
    logger = createLogger({
      redact: {
        paths: ['password'],
        remove: true,
      },
    });

    logger.info({ password: 'secret123', user: 'test' }, 'test message');

    expect(mockWrite).toHaveBeenCalled();
    const loggedData = JSON.parse(mockWrite.mock.calls[0][0]);
    expect(loggedData.password).toBeUndefined();
    expect(loggedData.user).toBe('test');
  });

  test('should create child logger with context', () => {
    logger = createLogger();
    const childLogger = logger.child({ requestId: '123' });

    childLogger.info('test message');

    expect(mockWrite).toHaveBeenCalled();
    const loggedData = JSON.parse(mockWrite.mock.calls[0][0]);
    expect(loggedData.requestId).toBe('123');
    expect(loggedData.msg).toBe('test message');
  });

  test('should use withContext to add context', () => {
    logger = createLogger();
    const contextLogger = logger.withContext({ userId: '456' });

    contextLogger.info('test message');

    expect(mockWrite).toHaveBeenCalled();
    const loggedData = JSON.parse(mockWrite.mock.calls[0][0]);
    expect(loggedData.userId).toBe('456');
    expect(loggedData.msg).toBe('test message');
  });

  test('should serialize errors correctly', () => {
    logger = createLogger();
    const error = new Error('test error');
    logger.error({ err: error }, 'error message');

    expect(mockWrite).toHaveBeenCalled();
    const loggedData = JSON.parse(mockWrite.mock.calls[0][0]);
    expect(loggedData.err.type).toBe('Error');
    expect(loggedData.err.message).toBe('test error');
    expect(loggedData.err.stack).toBeDefined();
  });

  test('should handle multiple arguments', () => {
    logger = createLogger();
    logger.info({ data: 1 }, 'message');

    expect(mockWrite).toHaveBeenCalled();
    const loggedData = JSON.parse(mockWrite.mock.calls[0][0]);
    expect(loggedData.msg).toBe('message');
    expect(loggedData.data).toBe(1);
  });
}); 