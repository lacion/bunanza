import type { Logger } from '../types';

export interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  traceId?: string;
  [key: string]: unknown;
}

export const createContextLogger = (logger: Logger, context: LogContext): Logger => {
  return logger.child(context);
};

export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

export const withRequestContext = (logger: Logger, requestId?: string): Logger => {
  const generatedRequestId = requestId || generateRequestId();
  return createContextLogger(logger, {
    requestId: generatedRequestId,
  });
};

export const withUserContext = (logger: Logger, userId: string): Logger => {
  return createContextLogger(logger, { userId });
};

export const withTraceContext = (logger: Logger, traceId: string): Logger => {
  return createContextLogger(logger, { traceId });
}; 