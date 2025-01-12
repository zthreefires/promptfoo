import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { getFinalTest, processFileReference, coerceString } from '../src/assertions/utils';
import cliState from '../src/cliState';

jest.mock('fs');
jest.mock('path');
jest.mock('js-yaml');
jest.mock('../src/cliState');

describe('getFinalTest', () => {
  it('should merge test case options with assertion options', () => {
    const test = {
      options: {
        provider: 'testProvider',
        rubricPrompt: 'testRubric',
      },
    };
    const assertion = {
      type: 'answer-relevance',
      provider: 'assertionProvider',
      rubricPrompt: 'assertionRubric',
    } as any;

    const result = getFinalTest(test, assertion);

    expect(result).toEqual({
      options: {
        provider: 'assertionProvider',
        rubricPrompt: 'assertionRubric',
      },
    });
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('should handle missing options in test case', () => {
    const test = {};
    const assertion = {
      type: 'classifier',
      provider: 'assertionProvider',
      rubricPrompt: 'assertionRubric',
    } as any;

    const result = getFinalTest(test, assertion);

    expect(result).toEqual({
      options: {
        provider: 'assertionProvider',
        rubricPrompt: 'assertionRubric',
      },
    });
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('should preserve test provider if assertion provider is not provided', () => {
    const test = {
      options: {
        provider: 'testProvider',
      },
    };
    const assertion = {
      type: 'bleu',
    } as any;

    const result = getFinalTest(test, assertion);

    expect(result).toEqual({
      options: {
        provider: 'testProvider',
      },
    });
    expect(Object.isFrozen(result)).toBe(true);
  });
});

describe('processFileReference', () => {
  const mockBasePath = '/mock/base/path';

  beforeEach(() => {
    jest.clearAllMocks();
    cliState.basePath = mockBasePath;
  });

  it('should process a JSON file reference', () => {
    const fileRef = 'file://test.json';
    const filePath = path.resolve(mockBasePath, 'test.json');
    const fileContent = '{"key": "value"}';
    const parsedContent = { key: 'value' };

    jest.mocked(fs.readFileSync).mockReturnValue(fileContent);
    jest.mocked(path.extname).mockReturnValue('.json');
    jest.mocked(yaml.load).mockReturnValue(parsedContent);

    const result = processFileReference(fileRef);

    expect(fs.readFileSync).toHaveBeenCalledWith(filePath, 'utf8');
    expect(result).toEqual(parsedContent);
  });

  it('should process a YAML file reference', () => {
    const fileRef = 'file://test.yaml';
    const filePath = path.resolve(mockBasePath, 'test.yaml');
    const fileContent = 'key: value';
    const parsedContent = { key: 'value' };

    jest.mocked(fs.readFileSync).mockReturnValue(fileContent);
    jest.mocked(path.extname).mockReturnValue('.yaml');
    jest.mocked(yaml.load).mockReturnValue(parsedContent);

    const result = processFileReference(fileRef);

    expect(fs.readFileSync).toHaveBeenCalledWith(filePath, 'utf8');
    expect(result).toEqual(parsedContent);
  });

  it('should process a TXT file reference', () => {
    const fileRef = 'file://test.txt';
    const filePath = path.resolve(mockBasePath, 'test.txt');
    const fileContent = '   some text content   ';

    jest.mocked(fs.readFileSync).mockReturnValue(fileContent);
    jest.mocked(path.extname).mockReturnValue('.txt');

    const result = processFileReference(fileRef);

    expect(fs.readFileSync).toHaveBeenCalledWith(filePath, 'utf8');
    expect(result).toBe('some text content');
  });

  it('should throw an error for unsupported file types', () => {
    const fileRef = 'file://test.unsupported';
    const filePath = path.resolve(mockBasePath, 'test.unsupported');

    jest.mocked(path.extname).mockReturnValue('.unsupported');

    expect(() => processFileReference(fileRef)).toThrow(`Unsupported file type: ${filePath}`);
  });
});

describe('coerceString', () => {
  it('should return the string as is if the input is a string', () => {
    const input = 'test string';
    const result = coerceString(input);
    expect(result).toBe(input);
  });

  it('should convert an object to a JSON string', () => {
    const input = { key: 'value' };
    const result = coerceString(input);
    expect(result).toBe(JSON.stringify(input));
  });
});
