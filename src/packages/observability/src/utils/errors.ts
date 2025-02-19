export interface SerializedError extends Record<string, unknown> {
  type: string;
  message: string;
  stack?: string;
  code?: string | number;
}

export const errorSerializer = (value: unknown): Record<string, unknown> => {
  if (!isError(value)) {
    return { error: String(value) };
  }

  const err = value as Error;
  const serialized: SerializedError = {
    type: err.name,
    message: err.message,
  };

  if (err.stack) {
    serialized.stack = err.stack;
  }

  // Include any additional properties from the error object
  const errorObj = err as unknown as Record<string, unknown>;
  for (const key in errorObj) {
    if (
      Object.prototype.hasOwnProperty.call(errorObj, key) &&
      !['name', 'message', 'stack'].includes(key)
    ) {
      serialized[key] = errorObj[key];
    }
  }

  return serialized;
};

export const isError = (err: unknown): err is Error => {
  return err instanceof Error || (typeof err === 'object' && err !== null && 'message' in err);
}; 