/**
 * Format duration from nanoseconds to milliseconds
 */
export const formatDuration = (startTime: bigint): number => {
  const endTime = process.hrtime.bigint();
  const duration = endTime - startTime;
  return Number(duration) / 1_000_000; // Convert nanoseconds to milliseconds
};

/**
 * Extract and sanitize headers
 */
export const getHeaders = (
  headers: Record<string, string>,
  redactHeaders: string[] = []
): Record<string, string> => {
  const sanitizedHeaders: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (redactHeaders.includes(lowerKey)) {
      sanitizedHeaders[lowerKey] = '[REDACTED]';
    } else {
      sanitizedHeaders[lowerKey] = value;
    }
  }

  return sanitizedHeaders;
};

/**
 * Extract query parameters from URL
 */
export const getQueryParams = (url: string): Record<string, string> => {
  const params: Record<string, string> = {};
  const searchParams = new URL(url).searchParams;

  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }

  return params;
}; 