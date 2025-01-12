import {
  AssertValidationError,
  validateAssertSet,
  validateAssertions,
} from '../src/assertions/validateAssertions';
import type { TestCase } from '../src/types';

describe('AssertValidationError', () => {
  it('should create an error with the correct message and name', () => {
    const testCase: TestCase = { description: 'Test case description', assert: [] };
    const error = new AssertValidationError('Error message', testCase);

    expect(error.message).toBe('Error message in:\nTest case description');
    expect(error.name).toBe('AssertValidationError');
  });

  it('should stringify testCase if description is not provided', () => {
    const testCase: TestCase = { assert: [] };
    const error = new AssertValidationError('Error message', testCase);

    expect(error.message).toBe('Error message in:\n{"assert":[]}');
  });
});

describe('validateAssertSet', () => {
  it('should throw if `assert` property is missing', () => {
    const testCase: TestCase = { description: 'Test case without assert', assert: [] };
    const assertion = {};

    expect(() => validateAssertSet(assertion, testCase)).toThrow(
      new AssertValidationError('assert-set must have an `assert` property', testCase),
    );
  });

  it('should throw if `assert` is not an array', () => {
    const testCase: TestCase = { description: 'Test case with invalid assert', assert: [] };
    const assertion = { assert: 'not-an-array' };

    expect(() => validateAssertSet(assertion as any, testCase)).toThrow(
      new AssertValidationError('assert-set `assert` must be an array of assertions', testCase),
    );
  });

  it('should throw if `assert` contains a child `assert-set`', () => {
    const testCase: TestCase = { description: 'Test case with nested assert-set', assert: [] };
    const assertion = { assert: [{ type: 'assert-set', assert: [] }] };

    expect(() => validateAssertSet(assertion as any, testCase)).toThrow(
      new AssertValidationError('assert-set must not have child assert-sets', testCase),
    );
  });

  it('should not throw for valid assertion sets', () => {
    const testCase: TestCase = { description: 'Valid test case', assert: [] };
    const assertion = { assert: [{ type: 'answer-relevance' }] };

    expect(() => validateAssertSet(assertion, testCase)).not.toThrow();
  });
});

describe('validateAssertions', () => {
  it('should validate assertions without throwing errors', () => {
    const tests: TestCase[] = [
      {
        description: 'Valid test case',
        assert: [{ type: 'answer-relevance' }],
      },
    ];

    expect(() => validateAssertions(tests)).not.toThrow();
  });

  it('should throw for test cases with invalid `assert` property', () => {
    const tests: TestCase[] = [
      {
        description: 'Invalid test case',
        assert: [{ type: 'assert-set', assert: 'not-an-array' as any }],
      },
    ];

    expect(() => validateAssertions(tests)).toThrow(
      'assert-set `assert` must be an array of assertions',
    );
  });

  it('should throw for test cases with nested `assert-set`', () => {
    const tests: TestCase[] = [
      {
        description: 'Test case with nested assert-set',
        assert: [{ type: 'assert-set', assert: [{ type: 'assert-set', assert: [] }] }],
      },
    ];

    expect(() => validateAssertions(tests)).toThrow('assert-set must not have child assert-sets');
  });

  it('should not throw for test cases without `assert` property', () => {
    const tests: TestCase[] = [
      {
        description: 'Test case without assert',
      },
    ];

    expect(() => validateAssertions(tests)).not.toThrow();
  });

  it('should not throw for empty test cases array', () => {
    const tests: TestCase[] = [];

    expect(() => validateAssertions(tests)).not.toThrow();
  });
});
