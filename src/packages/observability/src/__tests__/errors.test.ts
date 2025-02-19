import { describe, expect, test } from 'bun:test';
import { errorSerializer, isError } from '../utils/errors';

describe('Error Utilities', () => {
  describe('errorSerializer', () => {
    test('should serialize basic error properties', () => {
      const error = new Error('test error');
      const serialized = errorSerializer(error);

      expect(serialized.type).toBe('Error');
      expect(serialized.message).toBe('test error');
      expect(serialized.stack).toBeDefined();
    });

    test('should handle custom error properties', () => {
      const error = new Error('test error') as Error & { code: string };
      error.code = 'CUSTOM_ERROR';
      const serialized = errorSerializer(error);

      expect(serialized.type).toBe('Error');
      expect(serialized.message).toBe('test error');
      expect(serialized.code).toBe('CUSTOM_ERROR');
    });

    test('should handle errors without stack', () => {
      const error = new Error('test error');
      // Create a new error without stack
      const errorWithoutStack = {
        name: error.name,
        message: error.message,
      };
      const serialized = errorSerializer(errorWithoutStack as Error);

      expect(serialized.type).toBe('Error');
      expect(serialized.message).toBe('test error');
      expect(serialized.stack).toBeUndefined();
    });
  });

  describe('isError', () => {
    test('should return true for Error instances', () => {
      expect(isError(new Error('test'))).toBe(true);
      expect(isError(new TypeError('test'))).toBe(true);
    });

    test('should return true for error-like objects', () => {
      const errorLike = { message: 'test error' };
      expect(isError(errorLike)).toBe(true);
    });

    test('should return false for non-error values', () => {
      expect(isError(null)).toBe(false);
      expect(isError(undefined)).toBe(false);
      expect(isError({})).toBe(false);
      expect(isError('error')).toBe(false);
      expect(isError(42)).toBe(false);
    });
  });
}); 