import { vi, describe, it, expect, beforeEach } from 'vitest';
import { callApi, fetchUserEmail, updateEvalAuthor } from './api';
import useApiConfig from '@app/stores/apiConfig';

vi.mock('@app/stores/apiConfig', () => ({
  default: {
    getState: vi.fn(() => ({
      apiBaseUrl: 'http://localhost:3000'
    }))
  }
}));

describe('api utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('callApi', () => {
    it('should call fetch with correct url and options', async () => {
      const mockResponse = { ok: true };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const path = '/test';
      const options = { method: 'POST' };

      const response = await callApi(path, options);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test',
        options
      );
      expect(response).toBe(mockResponse);
    });
  });

  describe('fetchUserEmail', () => {
    it('should return email on successful response', async () => {
      const email = 'test@example.com';
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ email })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await fetchUserEmail();

      expect(result).toBe(email);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/user/email',
        { method: 'GET' }
      );
    });

    it('should return null on failed response', async () => {
      const mockResponse = { ok: false };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await fetchUserEmail();

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await fetchUserEmail();

      expect(result).toBeNull();
    });
  });

  describe('updateEvalAuthor', () => {
    it('should update eval author successfully', async () => {
      const evalId = '123';
      const author = 'John Doe';
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await updateEvalAuthor(evalId, author);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/eval/123/author',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ author })
        }
      );
      expect(result).toEqual({ success: true });
    });

    it('should throw error on failed response', async () => {
      const mockResponse = { ok: false };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(updateEvalAuthor('123', 'John')).rejects.toThrow('Failed to update eval author');
    });
  });
});
