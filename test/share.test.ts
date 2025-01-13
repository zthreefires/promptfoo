import { fetchWithProxy } from '../src/fetch';
import { cloudConfig } from '../src/globalConfig/cloud';
import { stripAuthFromUrl, targetHostCanUseNewResults, sendEvalResults } from '../src/share';

jest.mock('../src/logger');
jest.mock('../src/globalConfig/cloud');
jest.mock('../src/fetch', () => ({
  fetchWithProxy: jest.fn(),
}));

jest.mock('../src/globalConfig/accounts', () => ({
  getUserEmail: jest.fn(),
  setUserEmail: jest.fn(),
}));

describe('stripAuthFromUrl', () => {
  it('removes username and password from URL', () => {
    const input = 'https://user:pass@example.com/path?query=value#hash';
    const expected = 'https://example.com/path?query=value#hash';
    expect(stripAuthFromUrl(input)).toBe(expected);
  });

  it('handles URLs without auth info', () => {
    const input = 'https://example.com/path?query=value#hash';
    expect(stripAuthFromUrl(input)).toBe(input);
  });

  it('handles URLs with only username', () => {
    const input = 'https://user@example.com/path';
    const expected = 'https://example.com/path';
    expect(stripAuthFromUrl(input)).toBe(expected);
  });

  it('handles URLs with special characters in auth', () => {
    const input = 'https://user%40:p@ss@example.com/path';
    const expected = 'https://example.com/path';
    expect(stripAuthFromUrl(input)).toBe(expected);
  });

  it('returns original string for invalid URLs', () => {
    const input = 'not a valid url';
    expect(stripAuthFromUrl(input)).toBe(input);
  });

  it('handles URLs with IP addresses', () => {
    const input = 'http://user:pass@192.168.1.1:8080/path';
    const expected = 'http://192.168.1.1:8080/path';
    expect(stripAuthFromUrl(input)).toBe(expected);
  });
});

describe('targetHostCanUseNewResults', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when host is healthy and supports version', async () => {
    jest.mocked(fetchWithProxy).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ version: '1.0.0' }),
    } as any);

    const result = await targetHostCanUseNewResults('https://api.example.com');
    expect(result).toBe(true);
    expect(fetchWithProxy).toHaveBeenCalledWith('https://api.example.com/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('returns false when host is not healthy', async () => {
    jest.mocked(fetchWithProxy).mockResolvedValueOnce({
      ok: false,
    } as any);

    const result = await targetHostCanUseNewResults('https://api.example.com');
    expect(result).toBe(false);
    expect(fetchWithProxy).toHaveBeenCalledWith('https://api.example.com/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('returns false when version is not supported', async () => {
    jest.mocked(fetchWithProxy).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ someOtherField: 'value' }),
    } as any);

    const result = await targetHostCanUseNewResults('https://api.example.com');
    expect(result).toBe(false);
    expect(fetchWithProxy).toHaveBeenCalledWith('https://api.example.com/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('returns false when network error occurs', async () => {
    jest.mocked(fetchWithProxy).mockRejectedValueOnce(new Error('Network error'));

    const result = await targetHostCanUseNewResults('https://api.example.com').catch(() => false);
    expect(result).toBe(false);
    expect(fetchWithProxy).toHaveBeenCalledWith('https://api.example.com/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });
});

describe('sendEvalResults', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successfully sends eval results', async () => {
    const mockEval: any = {
      loadResults: jest.fn().mockResolvedValue(undefined),
    };

    jest.mocked(fetchWithProxy).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'test-eval-id' }),
    } as any);

    const evalId = await sendEvalResults(mockEval, 'https://api.example.com');

    expect(evalId).toBe('test-eval-id');
    expect(mockEval.loadResults).toHaveBeenCalledWith();
    expect(fetchWithProxy).toHaveBeenCalledWith(
      'https://api.example.com',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('adds authorization header when cloud config is enabled', async () => {
    jest.mocked(cloudConfig.isEnabled).mockReturnValue(true);
    jest.mocked(cloudConfig.getApiKey).mockReturnValue('test-api-key');

    const mockEval: any = {
      loadResults: jest.fn().mockResolvedValue(undefined),
    };

    jest.mocked(fetchWithProxy).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'test-eval-id' }),
    } as any);

    await sendEvalResults(mockEval, 'https://api.example.com');

    expect(fetchWithProxy).toHaveBeenCalledWith(
      'https://api.example.com',
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-api-key',
        },
      }),
    );
  });

  it('throws error when response is not ok', async () => {
    const mockEval: any = {
      loadResults: jest.fn().mockResolvedValue(undefined),
    };

    jest.mocked(fetchWithProxy).mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
    } as any);

    await expect(sendEvalResults(mockEval, 'https://api.example.com')).rejects.toThrow(
      'Failed to send eval results: Bad Request',
    );
  });
});
