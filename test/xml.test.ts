import { validateXml, containsXml, handleIsXml } from '../src/assertions/xml';
import type { AssertionParams, ApiProvider } from '../src/types';

describe('validateXml', () => {
  it('should validate a correct XML string without required elements', () => {
    const result = validateXml('<root><child>value</child></root>');
    expect(result).toEqual({
      isValid: true,
      reason: 'XML is valid and contains all required elements',
    });
  });

  it('should return an error if XML is missing opening tag', () => {
    const result = validateXml('root><child>value</child></root>');
    expect(result).toEqual({
      isValid: false,
      reason: 'XML is missing opening tag',
    });
  });

  it('should validate an incomplete XML string as valid (current behavior)', () => {
    const result = validateXml('<root><child>value</child>');
    expect(result).toEqual({
      isValid: true,
      reason: 'XML is valid and contains all required elements',
    });
  });

  it('should validate XML and check for required elements', () => {
    const result = validateXml('<root><child>value</child></root>', ['root.child']);
    expect(result).toEqual({
      isValid: true,
      reason: 'XML is valid and contains all required elements',
    });
  });

  it('should return an error if required elements are missing', () => {
    const result = validateXml('<root><child>value</child></root>', ['root.missing']);
    expect(result).toEqual({
      isValid: false,
      reason: 'XML is missing required elements: root.missing',
    });
  });
});

describe('containsXml', () => {
  it('should validate XML content in a string', () => {
    const result = containsXml('Some text before <root><child>value</child></root> and after', [
      'root.child',
    ]);
    expect(result).toEqual({
      isValid: true,
      reason: 'XML is valid and contains all required elements',
    });
  });

  it('should return an error if no XML content is found', () => {
    const result = containsXml('No XML content here');
    expect(result).toEqual({
      isValid: false,
      reason: 'No XML content found in the output',
    });
  });

  it('should return an error if no valid XML matches the requirements', () => {
    const result = containsXml('<root><child>value</child></root>', ['root.missing']);
    expect(result).toEqual({
      isValid: false,
      reason: 'No valid XML content found matching the requirements',
    });
  });
});

describe('handleIsXml', () => {
  const mockProvider: ApiProvider = {
    callApi: jest.fn(),
    id: () => 'mockedProviderId',
  };

  const mockAssertionParams: AssertionParams = {
    assertion: { type: 'is-xml' },
    renderedValue: '',
    outputString: '',
    inverse: false,
    baseType: 'is-xml',
    context: {
      prompt: '',
      vars: {},
      test: {},
      logProbs: undefined,
      provider: mockProvider,
      providerResponse: {},
    },
    output: '',
    providerResponse: {} as any, // Mocking ProviderResponse
    test: {},
  };

  it('should pass if XML is valid and matches required elements', () => {
    const params = {
      ...mockAssertionParams,
      renderedValue: 'root.child',
      outputString: '<root><child>value</child></root>',
    };
    const result = handleIsXml(params);
    expect(result).toEqual({
      pass: true,
      score: 1,
      reason: 'Assertion passed',
      assertion: { type: 'is-xml' },
    });
  });

  it('should fail if XML is valid but does not match required elements', () => {
    const params = {
      ...mockAssertionParams,
      renderedValue: 'root.missing',
      outputString: '<root><child>value</child></root>',
    };
    const result = handleIsXml(params);
    expect(result).toEqual({
      pass: false,
      score: 0,
      reason: 'XML is missing required elements: root.missing',
      assertion: { type: 'is-xml' },
    });
  });

  it('should fail if required elements are missing', () => {
    const params = {
      ...mockAssertionParams,
      renderedValue: 'root.missing',
      outputString: '<root><child>value</child></root>',
    };
    const result = handleIsXml(params);
    expect(result).toEqual({
      pass: false,
      score: 0,
      reason: 'XML is missing required elements: root.missing',
      assertion: { type: 'is-xml' },
    });
  });

  it('should handle inverse logic correctly', () => {
    const params = {
      ...mockAssertionParams,
      renderedValue: 'root.missing',
      outputString: '<root><child>value</child></root>',
      inverse: true,
    };
    const result = handleIsXml(params);
    expect(result).toEqual({
      pass: true,
      score: 1,
      reason: 'Assertion passed',
      assertion: { type: 'is-xml' },
    });
  });

  it('should throw an error for invalid renderedValue type', () => {
    const params = {
      ...mockAssertionParams,
      renderedValue: { invalid: 'type' },
    };
    expect(() => handleIsXml(params)).toThrow(
      'xml assertion must contain a string, array value, or no value',
    );
  });
});
