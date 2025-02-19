import { describe, expect, test, mock } from 'bun:test';
import {
  createContextLogger,
  generateRequestId,
  withRequestContext,
  withUserContext,
  withTraceContext,
} from '../utils/context';
import type { Logger } from '../types';

describe('Context Utilities', () => {
  let mockLogger: Logger;

  test('should create context logger', () => {
    const childMock = mock((context) => ({ ...mockLogger, context }));
    mockLogger = {
      child: childMock,
    } as unknown as Logger;

    const context = { requestId: '123' };
    const contextLogger = createContextLogger(mockLogger, context);

    expect(childMock).toHaveBeenCalledWith(context);
    expect(contextLogger).toBeDefined();
  });

  test('should generate valid request ID', () => {
    const requestId = generateRequestId();
    expect(requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
  });

  test('should create logger with request context', () => {
    const childMock = mock((context) => ({ ...mockLogger, context }));
    mockLogger = {
      child: childMock,
    } as unknown as Logger;

    const requestId = '123';
    const logger = withRequestContext(mockLogger, requestId);

    expect(childMock).toHaveBeenCalledWith({ requestId });
    expect(logger).toBeDefined();
  });

  test('should generate request ID if not provided', () => {
    const childMock = mock((context) => ({ ...mockLogger, ...context }));
    mockLogger = {
      child: childMock,
    } as unknown as Logger;

    // Mock Date.now() to return a fixed timestamp
    const originalDateNow = Date.now;
    Date.now = () => 1234567890;

    try {
      const logger = withRequestContext(mockLogger);
      expect(childMock).toHaveBeenCalled();
      const calledWith = childMock.mock.calls[0][0];
      expect(calledWith.requestId).toMatch(/^req_1234567890_[a-z0-9]+$/);
    } finally {
      // Restore original function
      Date.now = originalDateNow;
    }
  });

  test('should create logger with user context', () => {
    const childMock = mock((context) => ({ ...mockLogger, context }));
    mockLogger = {
      child: childMock,
    } as unknown as Logger;

    const userId = 'user123';
    const logger = withUserContext(mockLogger, userId);

    expect(childMock).toHaveBeenCalledWith({ userId });
    expect(logger).toBeDefined();
  });

  test('should create logger with trace context', () => {
    const childMock = mock((context) => ({ ...mockLogger, context }));
    mockLogger = {
      child: childMock,
    } as unknown as Logger;

    const traceId = 'trace123';
    const logger = withTraceContext(mockLogger, traceId);

    expect(childMock).toHaveBeenCalledWith({ traceId });
    expect(logger).toBeDefined();
  });
}); 