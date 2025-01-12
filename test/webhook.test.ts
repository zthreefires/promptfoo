import { handleWebhook } from '../src/assertions/webhook';
import { getEnvInt } from '../src/envars';
import { fetchWithRetries } from '../src/fetch';
import type { AssertionParams } from '../src/types';
import invariant from '../src/util/invariant';

jest.mock('../src/fetch', () => ({
  fetchWithRetries: jest.fn(),
}));

jest.mock('../src/envars', () => ({
  getEnvInt: jest.fn(),
}));

jest.mock('../src/util/invariant', () => jest.fn());

describe('handleWebhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAssertionParams: AssertionParams = {
    assertion: {
      type: 'webhook',
    },
    renderedValue: 'https://example.com/webhook',
    test: { vars: { key: 'value' } },
    prompt: 'Test prompt',
    output: 'Test output',
    inverse: false,
    baseType: 'webhook',
    context: {
      prompt: 'Test prompt',
      vars: { key: 'value' },
      test: { vars: { key: 'value' } },
      logProbs: undefined,
      provider: undefined,
      providerResponse: undefined,
    },
    outputString: '',
    providerResponse: {
      cached: false,
    },
  };

  it('should return a valid GradingResult on a successful response', async () => {
    const mockResponse = new Response(
      JSON.stringify({
        pass: true,
        score: 0.8,
        reason: 'Valid response',
      }),
      { status: 200 },
    );

    jest.mocked(fetchWithRetries).mockResolvedValue(mockResponse);
    jest.mocked(getEnvInt).mockReturnValue(5000);

    const result = await handleWebhook(mockAssertionParams);

    expect(fetchWithRetries).toHaveBeenCalledWith(
      'https://example.com/webhook',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          output: 'Test output',
          context: { prompt: 'Test prompt', vars: { key: 'value' } },
        }),
      },
      5000,
    );
    expect(result).toEqual({
      pass: true,
      score: 0.8,
      reason: 'Valid response',
      assertion: { type: 'webhook' },
    });
  });

  it('should handle a failed response with a non-OK status', async () => {
    const mockResponse = new Response(null, { status: 500 });

    jest.mocked(fetchWithRetries).mockResolvedValue(mockResponse);
    jest.mocked(getEnvInt).mockReturnValue(5000);

    const result = await handleWebhook(mockAssertionParams);

    expect(result).toEqual({
      pass: false,
      score: 0,
      reason: 'Webhook error: Webhook response status: 500',
      assertion: { type: 'webhook' },
    });
  });

  it('should handle a response with a missing "score" field', async () => {
    const mockResponse = new Response(
      JSON.stringify({
        pass: true,
      }),
      { status: 200 },
    );

    jest.mocked(fetchWithRetries).mockResolvedValue(mockResponse);
    jest.mocked(getEnvInt).mockReturnValue(5000);

    const result = await handleWebhook(mockAssertionParams);

    expect(result).toEqual({
      pass: true,
      score: 1,
      reason: 'Assertion passed',
      assertion: { type: 'webhook' },
    });
  });

  it('should handle an inversed assertion', async () => {
    const mockResponse = new Response(
      JSON.stringify({
        pass: true,
        score: 0.8,
        reason: 'Valid response',
      }),
      { status: 200 },
    );

    jest.mocked(fetchWithRetries).mockResolvedValue(mockResponse);
    jest.mocked(getEnvInt).mockReturnValue(5000);

    const result = await handleWebhook({
      ...mockAssertionParams,
      inverse: true,
    });

    expect(result.pass).toBe(false);
    expect(result.reason).toBe('Valid response');
    expect(result.score).toBeCloseTo(0.2, 5);
  });

  it('should throw an error when "renderedValue" is missing', async () => {
    const invalidParams = {
      ...mockAssertionParams,
      renderedValue: undefined,
    };

    jest.mocked(invariant).mockImplementation(((
      condition: any,
      message?: string | (() => string),
    ) => {
      if (!condition) {
        throw new Error(typeof message === 'function' ? message() : message);
      }
    }) as any);

    await expect(handleWebhook(invalidParams)).rejects.toThrow(
      '"webhook" assertion type must have a URL value',
    );
    expect(invariant).toHaveBeenCalledWith(
      undefined,
      '"webhook" assertion type must have a URL value',
    );
  });

  it('should throw an error when "renderedValue" is not a string', async () => {
    const invalidParams = {
      ...mockAssertionParams,
      renderedValue: 123 as unknown as string,
    };

    jest.mocked(invariant).mockImplementation(((
      condition: any,
      message?: string | (() => string),
    ) => {
      if (!condition) {
        throw new Error(typeof message === 'function' ? message() : message);
      }
    }) as any);

    await expect(handleWebhook(invalidParams)).rejects.toThrow(
      '"webhook" assertion type must have a URL value',
    );
    expect(invariant).toHaveBeenCalledWith(123, '"webhook" assertion type must have a URL value');
  });

  it('should handle exceptions thrown during execution', async () => {
    jest.mocked(fetchWithRetries).mockImplementation(() => {
      throw new Error('Network error');
    });

    jest.mocked(invariant).mockImplementation(() => {
      // Ensure invariant does not interfere with exception handling
    });

    const result = await handleWebhook(mockAssertionParams);

    expect(result).toEqual({
      pass: false,
      score: 0,
      reason: 'Webhook error: Network error',
      assertion: { type: 'webhook' },
    });
  });
});
