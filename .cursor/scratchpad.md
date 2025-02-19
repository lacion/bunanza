*This scratchpad file serves as a phase-specific task tracker and implementation planner. The Mode System on Line 1 is critical and must never be deleted. It defines two core modes: Implementation Type for new feature development and Bug Fix Type for issue resolution. Each mode requires specific documentation formats, confidence tracking, and completion criteria. Use "plan" trigger for planning phase (🎯) and "agent" trigger for execution phase (⚡) after reaching 95% confidence. Follow strict phase management with clear documentation transfer process.*

`MODE SYSTEM TYPES (DO NOT DELETE!):
1. Implementation Type (New Features):
   - Trigger: User requests new implementation
   - Format: MODE: Implementation, FOCUS: New functionality
   - Requirements: Detailed planning, architecture review, documentation
   - Process: Plan mode (🎯) → 95% confidence → Agent mode (⚡)

2. Bug Fix Type (Issue Resolution):
   - Trigger: User reports bug/issue
   - Format: MODE: Bug Fix, FOCUS: Issue resolution
   - Requirements: Problem diagnosis, root cause analysis, solution verification
   - Process: Plan mode (🎯) → Chain of thought analysis → Agent mode (⚡)

Cross-reference with @memories.md and @lessons-learned.md for context and best practices.`

# Mode: PLAN 🎯
Current Task: Implement Hono middleware for observability logging
Understanding: 
- Need to create a middleware for Hono using our observability package
- Must handle request/response logging (no body logging)
- Must track latency and status codes
- Headers and query params logging should be optional
- Should support context propagation
- Must handle errors properly
- Must be configurable

Questions:
1. What latency thresholds should we use for warning logs?
2. Which headers should be redacted by default?
3. Should we track response size metrics?

Confidence: 95%

Next Steps:
1. Package Setup
   - Add Hono as peer dependency
   - Create middleware directory structure
   - Setup TypeScript types

2. Core Middleware Implementation
   - Create middleware factory function
   - Implement request context creation
   - Setup response logging with status and latency
   - Add performance tracking
   - Handle error cases

3. Feature Implementation
   - Request ID generation/propagation
   - Optional header and query param logging
   - Performance metrics collection (latency, status codes)
   - Error serialization
   - Response metrics tracking

4. Configuration Options
   - Log level configuration
   - Header logging options (disabled by default)
   - Query param logging options (disabled by default)
   - Performance thresholds
   - Context customization

File Structure:
```
src/packages/observability/
├── src/
│   ├── middleware/
│   │   ├── hono/
│   │   │   ├── index.ts           # Main middleware export
│   │   │   ├── types.ts           # Middleware types
│   │   │   ├── config.ts          # Default configuration
│   │   │   └── utils.ts           # Middleware utilities
│   │   └── index.ts               # Middleware barrel file
```

Implementation Details:

1. Middleware Configuration Interface:
```typescript
interface HonoLoggerOptions {
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

const defaultOptions: HonoLoggerOptions = {
  includeHeaders: false,
  includeQueryParams: false,
  slowRequestThreshold: 1000, // 1 second
  redactHeaders: [
    'authorization',
    'cookie',
    'set-cookie',
    'x-api-key',
    'x-auth-token'
  ]
};
```

2. Middleware Implementation:
```typescript
import { createLogger, withRequestContext } from '@bunanza/observability';
import type { MiddlewareHandler } from 'hono';

export const observabilityMiddleware = (
  options: HonoLoggerOptions = {}
): MiddlewareHandler => {
  const config = { ...defaultOptions, ...options };
  const logger = options.logger ?? createLogger();

  return async (c, next) => {
    const requestLogger = withRequestContext(logger);
    const startTime = process.hrtime.bigint();

    try {
      // Build request log context
      const logContext: Record<string, unknown> = {
        method: c.req.method,
        url: c.req.url,
        path: c.req.path,
      };

      // Optionally include headers
      if (config.includeHeaders) {
        logContext.headers = getHeaders(
          c.req.headers,
          config.redactHeaders
        );
      }

      // Optionally include query params
      if (config.includeQueryParams) {
        logContext.query = Object.fromEntries(
          new URL(c.req.url).searchParams
        );
      }

      // Log request
      requestLogger.info(logContext, 'Incoming request');

      // Attach logger to context
      c.set('logger', requestLogger);

      // Process request
      await next();

      // Calculate duration
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1_000_000;

      // Track slow requests
      if (duration > config.slowRequestThreshold) {
        requestLogger.warn({
          duration,
          threshold: config.slowRequestThreshold,
        }, 'Slow request detected');
      }

      // Log response
      requestLogger.info({
        status: c.res.status,
        duration,
      }, 'Request completed');

    } catch (error) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1_000_000;

      requestLogger.error({
        err: error,
        duration,
        status: error.status ?? 500,
      }, 'Request failed');

      throw error;
    }
  };
};
```

3. Utility Functions:
```typescript
// Header sanitization
const getHeaders = (
  headers: Headers,
  redact: string[] = []
): Record<string, string> => {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    if (redact.includes(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = value;
    }
  });
  return result;
};
```

Usage Example:
```typescript
import { Hono } from 'hono';
import { observabilityMiddleware } from '@bunanza/observability/middleware/hono';

const app = new Hono();

// Add middleware with minimal configuration
app.use('*', observabilityMiddleware({
  slowRequestThreshold: 500, // 500ms threshold
  redactHeaders: ['authorization', 'cookie'],
  includeHeaders: ['user-agent', 'accept'], // Only include specific headers
}));

// Use logger in routes
app.get('/api/users', (c) => {
  const logger = c.get('logger');
  logger.info('Fetching users');
  // ... handle request
});
```

Next Actions:
1. Create middleware directory structure
2. Add Hono as peer dependency
3. Implement core middleware
4. Add TypeScript types
5. Create utility functions
6. Add tests
7. Update documentation

Dependencies to Add:
```json
{
  "peerDependencies": {
    "hono": "^3.0.0"
  },
  "devDependencies": {
    "hono": "^3.0.0"
  }
}
```