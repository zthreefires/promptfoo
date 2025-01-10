import {
  isValidJson,
  safeJsonStringify,
  extractJsonObjects,
  extractFirstJsonObject,
  orderKeys,
} from '../src/util/json';

describe('isValidJson', () => {
  it('should return true for valid JSON strings', () => {
    expect(isValidJson('{"name": "John"}')).toBe(true);
    expect(isValidJson('[]')).toBe(true);
    expect(isValidJson('42')).toBe(true);
    expect(isValidJson('null')).toBe(true);
  });

  it('should return false for invalid JSON strings', () => {
    expect(isValidJson('{"name": "John"')).toBe(false);
    expect(isValidJson('invalid')).toBe(false);
    expect(isValidJson('123abc')).toBe(false);
  });
});

describe('safeJsonStringify', () => {
  it('should stringify simple objects correctly', () => {
    const obj = { name: 'John', age: 30 };
    expect(safeJsonStringify(obj)).toBe(JSON.stringify(obj));
  });

  it('should handle circular references', () => {
    const obj: any = { name: 'John' };
    obj.self = obj;
    expect(safeJsonStringify(obj)).toBe('{"name":"John"}');
  });

  it('should pretty print when specified', () => {
    const obj = { name: 'John', age: 30 };
    expect(safeJsonStringify(obj, true)).toBe(JSON.stringify(obj, null, 2));
  });
});

describe('extractJsonObjects', () => {
  it('should extract JSON objects from a string', () => {
    const str = 'Here is a JSON: {"name": "John"} and another: {"age": 30}';
    const result = extractJsonObjects(str);
    expect(result).toEqual([{ name: 'John' }, { age: 30 }]);
  });

  it('should return an empty array if no JSON objects are found', () => {
    const str = 'No JSON here!';
    const result = extractJsonObjects(str);
    expect(result).toEqual([]);
  });
});

describe('extractFirstJsonObject', () => {
  it('should extract the first JSON object from a string', () => {
    const str = 'Here is a JSON: {"name": "John"} and another: {"age": 30}';
    const result = extractFirstJsonObject<{ name: string }>(str);
    expect(result).toEqual({ name: 'John' });
  });

  it('should throw an error if no JSON object is found', () => {
    const str = 'No JSON here!';
    expect(() => extractFirstJsonObject(str)).toThrow(
      'Expected a JSON object, but got "No JSON here!"',
    );
  });
});

describe('orderKeys', () => {
  it('should reorder keys based on the specified order', () => {
    const obj = { c: 3, a: 1, b: 2 };
    const orderedObj = orderKeys(obj, ['a', 'b']);
    expect(orderedObj).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('should preserve unspecified keys and symbol keys', () => {
    const sym = Symbol('sym');
    const obj = { c: 3, [sym]: 4, a: 1, b: 2 };
    const orderedObj = orderKeys(obj, ['a', 'b']);
    expect(orderedObj).toEqual({ a: 1, b: 2, c: 3, [sym]: 4 });
  });
});
