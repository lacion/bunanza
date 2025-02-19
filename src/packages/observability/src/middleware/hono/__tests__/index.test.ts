import { describe, test, expect, mock } from 'bun:test';
import { Hono } from 'hono';
import { observabilityMiddleware } from '..';
import type { Logger } from '../../../types';

function createMockLogger() {
  const infoMock = mock((...args: unknown[]) => undefined);
  const errorMock = mock((...args: unknown[]) => undefined);
  const warnMock = mock((...args: unknown[]) => undefined);
  const debugMock = mock((...args: unknown[]) => undefined);
  const traceMock = mock((...args: unknown[]) => undefined);
  const fatalMock = mock((...args: unknown[]) => undefined);
  const childMock = mock((bindings: Record<string, unknown>) => mockLogger);

  const mockLogger = {
    info: infoMock,
    error: errorMock,
    warn: warnMock,
    debug: debugMock,
    trace: traceMock,
    fatal: fatalMock,
    child: childMock,
    level: 'info',
  } as unknown as Logger;

  return {
    logger: mockLogger,
    mocks: {
      info: infoMock,
      error: errorMock,
      warn: warnMock,
      debug: debugMock,
      trace: traceMock,
      fatal: fatalMock,
      child: childMock,
    },
  };
}

describe('observabilityMiddleware', () => {
  test('logs request and response with default options', async () => {
    const app = new Hono();
    const { logger, mocks } = createMockLogger();
    
    app.use(observabilityMiddleware({ logger }));
    app.get('/test', (c) => c.text('OK'));

    const res = await app.request('/test');
    expect(res.status).toBe(200);
    expect(res.text()).resolves.toBe('OK');

    expect(mocks.info).toHaveBeenCalledTimes(2);
    expect(mocks.info.mock.calls.length).toBe(2);
    
    const calls = mocks.info.mock.calls;
    if (calls.length >= 2) {
      const [firstCall, secondCall] = calls;
      expect(firstCall?.[0]).toMatchObject({
        method: 'GET',
        path: '/test',
      });
      expect(secondCall?.[0]).toMatchObject({
        status: 200,
      });
    }
  });

  test('logs headers when includeHeaders is true', async () => {
    const app = new Hono();
    const { logger, mocks } = createMockLogger();
    
    app.use(observabilityMiddleware({
      logger,
      includeHeaders: true,
      redactHeaders: ['authorization'],
    }));
    app.get('/test', (c) => c.text('OK'));

    const res = await app.request('/test', {
      headers: {
        'authorization': 'Bearer token',
        'x-test': 'value',
      },
    });
    expect(res.status).toBe(200);

    expect(mocks.info.mock.calls.length).toBe(2);
    const firstCall = mocks.info.mock.calls[0];
    if (firstCall?.[0]) {
      const requestLog = firstCall[0] as Record<string, unknown>;
      expect(requestLog.headers).toMatchObject({
        'authorization': '[REDACTED]',
        'x-test': 'value',
      });
    }
  });

  test('logs query parameters when includeQueryParams is true', async () => {
    const app = new Hono();
    const { logger, mocks } = createMockLogger();
    
    app.use(observabilityMiddleware({
      logger,
      includeQueryParams: true,
    }));
    app.get('/test', (c) => c.text('OK'));

    const res = await app.request('/test?foo=bar&baz=qux');
    expect(res.status).toBe(200);

    expect(mocks.info.mock.calls.length).toBe(2);
    const firstCall = mocks.info.mock.calls[0];
    if (firstCall?.[0]) {
      const requestLog = firstCall[0] as Record<string, unknown>;
      expect(requestLog.query).toMatchObject({
        foo: 'bar',
        baz: 'qux',
      });
    }
  });

  test('logs errors when request fails', async () => {
    const app = new Hono();
    const { logger, mocks } = createMockLogger();
    
    app.use('*', observabilityMiddleware({ logger }));
    
    app.get('/error', async (c) => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      throw new Error('Test error');
    });
    
    let caughtError;
    try {
      await app.request('/error');
    } catch (err) {
      caughtError = err;
    }
    expect(caughtError).toBeDefined();
    
    expect(mocks.error).toHaveBeenCalledTimes(1);
    const firstCall = mocks.error.mock.calls[0];
    if (firstCall?.[0]) {
      const errorLog = firstCall[0] as Record<string, unknown>;
      expect(errorLog).toMatchObject({
        status: 500,
        method: 'GET',
        path: '/error'
      });
      expect(errorLog.err).toBeInstanceOf(Error);
      expect((errorLog.err as Error).message).toBe('Test error');
    }
  });

  test('logs slow requests when duration exceeds threshold', async () => {
    const app = new Hono();
    const { logger, mocks } = createMockLogger();
    
    app.use(observabilityMiddleware({
      logger,
      slowRequestThreshold: 1, // 1ms threshold
    }));
    app.get('/slow', async (c) => {
      await new Promise((resolve) => setTimeout(resolve, 10)); // Wait 10ms
      return c.text('OK');
    });

    const res = await app.request('/slow');
    expect(res.status).toBe(200);

    expect(mocks.warn).toHaveBeenCalledTimes(1);
    expect(mocks.warn.mock.calls.length).toBe(1);
    const firstCall = mocks.warn.mock.calls[0];
    if (firstCall?.[0]) {
      const warnLog = firstCall[0] as Record<string, unknown>;
      expect(warnLog).toMatchObject({
        threshold: 1,
      });
      expect(warnLog.duration as number).toBeGreaterThan(1);
    }
  });

  test('attaches logger to context', async () => {
    const app = new Hono();
    const { logger } = createMockLogger();
    let contextLogger: Logger | undefined;
    
    app.use(observabilityMiddleware({ logger }));
    app.get('/test', (c) => {
      contextLogger = c.get('logger');
      return c.text('OK');
    });

    const res = await app.request('/test');
    expect(res.status).toBe(200);
    expect(contextLogger).toBeDefined();
    expect(typeof contextLogger?.info).toBe('function');
  });
}); 