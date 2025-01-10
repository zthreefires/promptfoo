import logger from '../src/logger';
import { retryWithDeduplication, sampleArray } from '../src/util/generation';

jest.mock('../src/logger');

describe('retryWithDeduplication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should collect unique items until target count is reached', async () => {
    const operation = jest
      .fn()
      .mockResolvedValueOnce([1, 2])
      .mockResolvedValueOnce([2, 3])
      .mockResolvedValueOnce([4]);

    const result = await retryWithDeduplication(operation, 4);

    expect(result).toEqual([1, 2, 3, 4]);
    expect(logger.debug).toHaveBeenCalledWith('Added 2 unique items. Total: 2');
    expect(logger.debug).toHaveBeenCalledWith('Added 1 unique items. Total: 3');
    expect(logger.debug).toHaveBeenCalledWith('Added 1 unique items. Total: 4');
  });

  it('should handle non-iterable results by skipping iteration', async () => {
    const operation = jest
      .fn()
      .mockResolvedValueOnce(123 as any)
      .mockResolvedValueOnce([1, 2]);

    const result = await retryWithDeduplication(operation, 2);

    expect(result).toEqual([1, 2]);
    expect(logger.warn).toHaveBeenCalledWith(
      'Operation returned non-iterable result. Skipping this iteration.',
    );
  });

  it('should stop after max consecutive retries with no new items', async () => {
    const operation = jest.fn().mockResolvedValue([]);

    const result = await retryWithDeduplication(operation, 2, 2);

    expect(result).toEqual([]);
    expect(logger.debug).toHaveBeenCalledWith('No new unique items. Consecutive retries: 1');
    expect(logger.debug).toHaveBeenCalledWith('No new unique items. Consecutive retries: 2');
  });

  it('should use a custom deduplication function if provided', async () => {
    const operation = jest
      .fn()
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
      .mockResolvedValueOnce([{ id: 2 }, { id: 3 }]);

    const customDedupFn = (items: any[]) => {
      const seen = new Set();
      return items.filter((item) => {
        const isDuplicate = seen.has(item.id);
        seen.add(item.id);
        return !isDuplicate;
      });
    };

    const result = await retryWithDeduplication(operation, 3, 2, customDedupFn);

    expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
  });
});

describe('sampleArray', () => {
  it('should return n randomly sampled items', () => {
    const array = [1, 2, 3, 4, 5];
    const result = sampleArray(array, 3);

    expect(result).toHaveLength(3);
    result.forEach((item) => {
      expect(array).toContain(item);
    });
  });

  it('should return the entire array if n is greater than array length', () => {
    const array = [1, 2, 3];
    const result = sampleArray(array, 5);

    expect(result).toEqual(expect.arrayContaining(array));
    expect(result).toHaveLength(array.length);
  });
});
