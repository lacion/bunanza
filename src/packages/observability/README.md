# @bunanza/observability

A robust logging package built on top of Pino for structured logging in Node.js applications. Provides structured logging, context propagation, error handling, and performance monitoring capabilities.

## Features

- 🔍 Structured logging with JSON output
- ⚙️ Configurable log levels
- 🔒 Sensitive data redaction
- ❌ Error serialization with stack traces
- 🔄 Context propagation
- 🆔 Request ID tracking
- 👤 User context support
- 🔍 Trace context support
- 📝 TypeScript support
- 🎨 Pretty printing in development
- 📊 Performance monitoring
- 🔄 Child logger support

## Quick Start

```typescript
import { createLogger } from '@bunanza/observability';

// Create a logger instance
const logger = createLogger();

// Basic logging
logger.info('Hello, world!');

// Structured logging with context
logger.info({ userId: '123', action: 'login' }, 'User logged in');

// Error logging
try {
  throw new Error('Something went wrong');
} catch (err) {
  logger.error({ err }, 'Error occurred');
}
```

## Advanced Usage

### Configuration

```typescript
import { createLogger } from '@bunanza/observability';

const logger = createLogger({
  // Set log level
  level: 'debug',
  
  // Configure sensitive data redaction
  redact: {
    paths: ['password', 'token', 'secret'],
    remove: true,
  },
  
  // Add base context
  base: {
    app: 'my-service',
    version: '1.0.0',
  },
  
  // Custom timestamp
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  
  // Custom formatters
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
});
```

### Context Propagation

```typescript
import { createLogger, withRequestContext, withUserContext } from '@bunanza/observability';

// Create base logger
const logger = createLogger();

// Add request context
const requestLogger = withRequestContext(logger);
requestLogger.info('Processing request'); // Includes auto-generated requestId

// Add user context
const userLogger = withUserContext(requestLogger, 'user-123');
userLogger.info('User action'); // Includes both requestId and userId

// Add custom context
const orderLogger = userLogger.withContext({
  orderId: 'order-456',
  amount: 99.99,
});
orderLogger.info('Processing order'); // Includes all context
```

### HTTP Request Logging

```typescript
import express from 'express';
import { createLogger, withRequestContext } from '@bunanza/observability';

const app = express();
const logger = createLogger();

// Request logging middleware
app.use((req, res, next) => {
  const requestLogger = withRequestContext(logger);
  
  // Log request
  requestLogger.info({
    method: req.method,
    url: req.url,
    headers: req.headers,
  }, 'Incoming request');
  
  // Attach logger to request
  req.log = requestLogger;
  next();
});

app.get('/api/users', (req, res) => {
  req.log.info('Fetching users');
  // ... handle request
});
```

### Error Handling

```typescript
import { createLogger, isError } from '@bunanza/observability';

const logger = createLogger();

// Custom error class
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Error handling
async function processUser(data: unknown) {
  const log = logger.withContext({ userId: data.id });
  
  try {
    if (!data.email) {
      throw new ValidationError('Email is required', 'email');
    }
    
    log.info({ data }, 'Processing user data');
    // ... process user
    
  } catch (err) {
    if (isError(err)) {
      log.error({ 
        err,
        // Additional context
        validationField: err instanceof ValidationError ? err.field : undefined,
      }, 'Failed to process user');
    }
    throw err;
  }
}
```

### Performance Monitoring

```typescript
import { createLogger } from '@bunanza/observability';

const logger = createLogger();

async function measureOperation() {
  const start = process.hrtime.bigint();
  
  try {
    // ... perform operation
    
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1_000_000; // Convert to ms
    
    logger.info({ 
      operation: 'task',
      durationMs: duration,
    }, 'Operation completed');
    
  } catch (err) {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1_000_000;
    
    logger.error({ 
      err,
      operation: 'task',
      durationMs: duration,
    }, 'Operation failed');
    
    throw err;
  }
}
```

### Environment-Specific Configuration

```typescript
import { createLogger } from '@bunanza/observability';

const isDevelopment = process.env.NODE_ENV === 'development';

const logger = createLogger({
  level: isDevelopment ? 'debug' : 'info',
  
  // Development-specific settings
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: true,
      },
    },
  }),
  
  // Production settings
  ...(!isDevelopment && {
    redact: {
      paths: ['password', 'token', 'secret', 'email'],
      remove: true,
    },
  }),
});
```

## Best Practices

### 1. Structured Logging

Always use structured logging to make logs searchable and analyzable:

```typescript
// Good ✅
logger.info({ 
  userId: '123',
  action: 'login',
  device: 'mobile',
}, 'User logged in');

// Bad ❌
logger.info(`User ${userId} logged in from mobile`);
```

### 2. Log Levels

Use appropriate log levels:

```typescript
// Error: For errors that need immediate attention
logger.error({ err }, 'Database connection failed');

// Warn: For potentially harmful situations
logger.warn({ userId }, 'Rate limit exceeded');

// Info: For normal operations
logger.info({ orderId }, 'Order processed successfully');

// Debug: For detailed information for debugging
logger.debug({ query }, 'Executing database query');

// Trace: For very detailed debugging
logger.trace({ headers }, 'Received HTTP request');
```

### 3. Context Propagation

Maintain context throughout request lifecycle:

```typescript
function processOrder(orderId: string, userId: string) {
  const log = logger
    .withContext({ orderId })
    .withContext({ userId });
    
  log.info('Starting order processing');
  
  // Child operations inherit context
  validateOrder(log);
  processPayment(log);
  sendNotification(log);
}
```

### 4. Error Handling

Include complete error information:

```typescript
try {
  await processOrder();
} catch (err) {
  logger.error({
    err,
    // Additional context
    orderId,
    userId,
    attempt: retryCount,
    // Stack trace included automatically
  }, 'Order processing failed');
}
```

## Environment Variables

- `LOG_LEVEL`: Set the logging level (default: 'info')
- `NODE_ENV`: Affects default configuration ('development' enables pretty printing)

## TypeScript Support

The package is written in TypeScript and includes type definitions. You get full type safety and autocompletion:

```typescript
import type { Logger, LoggerOptions } from '@bunanza/observability';

// Custom logger options
const options: LoggerOptions = {
  level: 'debug',
  base: { service: 'api' },
};

// Logger instance with full type support
const logger: Logger = createLogger(options);
```
