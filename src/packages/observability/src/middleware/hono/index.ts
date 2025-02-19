import type { Context, MiddlewareHandler, Next } from 'hono';
import { createLogger, withRequestContext } from '../..';
import type { HonoLoggerOptions } from './types';
import { defaultOptions } from './config';
import { formatDuration, getHeaders, getQueryParams } from './utils';

export const observabilityMiddleware = (
  options: HonoLoggerOptions = {}
): MiddlewareHandler => {
  const config = { ...defaultOptions, ...options };
  const logger = options.logger ?? createLogger({ level: config.level });

  return async (c: Context, next: Next) => {
    const requestLogger = withRequestContext(logger);
    const startTime = process.hrtime.bigint();

    // Build request log context
    const logContext: Record<string, unknown> = {
      method: c.req.method,
      url: c.req.url,
      path: c.req.path,
    };

    // Optionally include headers
    if (config.includeHeaders) {
      const allowedHeaders = Array.isArray(config.includeHeaders)
        ? config.includeHeaders
        : undefined;

      const headers = getHeaders(
        Object.fromEntries(
          Object.entries(c.req.header()).map(([key, value]) => [
            key.toLowerCase(),
            value,
          ])
        ),
        config.redactHeaders ?? []
      );

      logContext.headers = allowedHeaders
        ? Object.fromEntries(
            Object.entries(headers).filter(([key]) =>
              allowedHeaders.includes(key)
            )
          )
        : headers;
    }

    // Optionally include query params
    if (config.includeQueryParams) {
      logContext.query = getQueryParams(c.req.url);
    }

    // Add custom context if provided
    if (config.getUserContext) {
      Object.assign(logContext, config.getUserContext(c));
    }

    // Format request context if custom formatter provided
    const requestContext = config.formatRequest
      ? config.formatRequest(c.req as unknown as Request, c)
      : logContext;

    // Log request
    requestLogger.info(requestContext, 'Incoming request');

    // Attach logger to context
    c.set('logger', requestLogger);

    try {
      // Process request
      await next();

      // Calculate duration
      const duration = formatDuration(startTime);

      // Track slow requests
      const threshold = config.slowRequestThreshold ?? defaultOptions.slowRequestThreshold ?? 1000;
      if (duration > threshold) {
        requestLogger.warn({
          duration,
          threshold,
        }, 'Slow request detected');
      }

      // Build response context
      const responseContext = {
        status: c.res.status,
        duration,
      };

      // Format response context if custom formatter provided
      const finalResponseContext = config.formatResponse
        ? config.formatResponse(c.res, c)
        : responseContext;

      // Log response
      requestLogger.info(finalResponseContext, 'Request completed');

    } catch (error) {
      const duration = formatDuration(startTime);

      // Set error status if not already set
      if (!c.res.status || c.res.status < 400) {
        c.status(500);
      }

      // Build error context
      const errorContext = {
        err: error,
        duration,
        status: c.res.status,
        method: c.req.method,
        path: c.req.path,
      };

      // Format error context if custom formatter provided
      const finalErrorContext = config.formatError
        ? config.formatError(error as Error, c)
        : errorContext;

      // Log error
      requestLogger.error(finalErrorContext, 'Request failed');

      // Rethrow error for Hono's error handler
      throw error;
    }
  };
};

export type { HonoLoggerOptions } from './types'; 