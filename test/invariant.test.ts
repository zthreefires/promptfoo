import { describe, it, expect } from '@jest/globals';
import invariant from '../src/util/invariant';

describe('invariant', () => {
  it('should not throw when condition is true', () => {
    expect(() => invariant(true)).not.toThrow();
  });

  it('should throw when condition is false', () => {
    expect(() => invariant(false)).toThrow('Invariant failed');
  });

  it('should include custom message when provided as string', () => {
    expect(() => invariant(false, 'Custom error message')).toThrow(
      'Invariant failed: Custom error message',
    );
  });

  it('should include custom message when provided as function', () => {
    expect(() => invariant(false, () => 'Custom error message')).toThrow(
      'Invariant failed: Custom error message',
    );
  });

  it('should handle falsy conditions', () => {
    expect(() => invariant(null)).toThrow('Invariant failed');
    expect(() => invariant(undefined)).toThrow('Invariant failed');
    expect(() => invariant(0)).toThrow('Invariant failed');
    expect(() => invariant('')).toThrow('Invariant failed');
  });

  it('should handle truthy conditions', () => {
    expect(() => invariant(1)).not.toThrow();
    expect(() => invariant('test')).not.toThrow();
    expect(() => invariant([])).not.toThrow();
    expect(() => invariant({})).not.toThrow();
  });

  it('should handle complex objects as conditions', () => {
    const obj = { test: true };
    expect(() => invariant(obj)).not.toThrow();
  });

  it('should preserve type narrowing', () => {
    const value: string | null = 'test';
    invariant(value);
    // TypeScript should now know that value is string
    expect(value.length).toBeDefined();
  });
});
