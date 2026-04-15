import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCache } from './local-cache.ts';

const { get, invalidate, inspect } = useCache();

// We need to reset the module-level cache between tests
// so each test starts clean.
afterEach(() => {
  invalidate();
  vi.restoreAllMocks();
});

describe('get', () => {
  it('should call loader on first request', async () => {
    const loader = vi.fn().mockResolvedValue('data');

    const result = await get('key', loader);

    expect(result).toBe('data');
    expect(loader).toHaveBeenCalledOnce();
  });

  it('should return cached value on subsequent requests', async () => {
    const loader = vi.fn().mockResolvedValue('data');

    await get('key', loader);
    const result = await get('key', loader);

    expect(result).toBe('data');
    expect(loader).toHaveBeenCalledOnce();
  });

  it('should prevent stampede — concurrent requests share the same Promise', async () => {
    let resolveLoader!: (value: string) => void;
    const loader = vi.fn(
      () => new Promise<string>((resolve) => (resolveLoader = resolve)),
    );

    // Fire 50 concurrent requests
    const promises = Array.from({ length: 50 }, () => get('key', loader));

    resolveLoader('data');
    const results = await Promise.all(promises);

    expect(results).toEqual(Array(50).fill('data'));
    expect(loader).toHaveBeenCalledOnce();
  });

  it('should refetch after TTL expires', async () => {
    vi.useFakeTimers();
    const loader = vi
      .fn()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second');

    const first = await get('key', loader, 100);
    expect(first).toBe('first');

    // Advance past TTL
    vi.advanceTimersByTime(101);

    const second = await get('key', loader, 100);
    expect(second).toBe('second');
    expect(loader).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('should not cache errors', async () => {
    const loader = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('recovered');

    await expect(get('key', loader)).rejects.toThrow('fail');

    const result = await get('key', loader);
    expect(result).toBe('recovered');
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('should support per-key TTL', async () => {
    vi.useFakeTimers();
    const shortLoader = vi
      .fn()
      .mockResolvedValueOnce('short-1')
      .mockResolvedValueOnce('short-2');
    const longLoader = vi.fn().mockResolvedValue('long');

    await get('short', shortLoader, 100);
    await get('long', longLoader, 10_000);

    vi.advanceTimersByTime(101);

    // Short TTL expired — should refetch
    await get('short', shortLoader, 100);
    expect(shortLoader).toHaveBeenCalledTimes(2);

    // Long TTL still valid — should not refetch
    await get('long', longLoader, 10_000);
    expect(longLoader).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });

  it('should cache different keys independently', async () => {
    const loaderA = vi.fn().mockResolvedValue('A');
    const loaderB = vi.fn().mockResolvedValue('B');

    const a = await get('a', loaderA);
    const b = await get('b', loaderB);

    expect(a).toBe('A');
    expect(b).toBe('B');
    expect(loaderA).toHaveBeenCalledOnce();
    expect(loaderB).toHaveBeenCalledOnce();
  });

  it('should start TTL after resolve, not after request', async () => {
    vi.useFakeTimers();
    let resolveLoader!: (value: string) => void;
    const loader = vi.fn(
      () => new Promise<string>((resolve) => (resolveLoader = resolve)),
    );

    const promise = get('key', loader, 100);

    // Simulate a slow fetch — 80ms passes before resolve
    vi.advanceTimersByTime(80);
    resolveLoader('data');
    await promise;

    // 60ms after resolve — should still be cached (TTL is 100ms from resolve)
    vi.advanceTimersByTime(60);
    const loader2 = vi.fn().mockResolvedValue('new');
    const result = await get('key', loader2, 100);

    expect(result).toBe('data');
    expect(loader2).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});

describe('invalidate', () => {
  it('should invalidate a single key', async () => {
    const loader = vi
      .fn()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second');

    await get('key', loader);
    invalidate('key');
    const result = await get('key', loader);

    expect(result).toBe('second');
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('should invalidate all keys when called without argument', async () => {
    const loaderA = vi.fn().mockResolvedValue('A');
    const loaderB = vi.fn().mockResolvedValue('B');

    await get('a', loaderA);
    await get('b', loaderB);
    invalidate();

    await get('a', loaderA);
    await get('b', loaderB);

    expect(loaderA).toHaveBeenCalledTimes(2);
    expect(loaderB).toHaveBeenCalledTimes(2);
  });

  it('should not affect other keys when invalidating one', async () => {
    const loaderA = vi.fn().mockResolvedValue('A');
    const loaderB = vi.fn().mockResolvedValue('B');

    await get('a', loaderA);
    await get('b', loaderB);
    invalidate('a');

    await get('a', loaderA);
    await get('b', loaderB);

    expect(loaderA).toHaveBeenCalledTimes(2);
    expect(loaderB).toHaveBeenCalledOnce();
  });
});

describe('inspect', () => {
  it('should return metadata for cached entries', async () => {
    await get('key', () => Promise.resolve('data'));

    const entries = await inspect();

    expect(entries).toHaveLength(1);
    expect(entries[0].key).toBe('key');
    expect(entries[0].expired).toBe(false);
    expect(entries[0]).not.toHaveProperty('value');
  });

  it('should include values when requested', async () => {
    await get('key', () => Promise.resolve('data'));

    const entries = await inspect({ includeValues: true });

    expect(entries[0].value).toBe('data');
  });

  it('should show loading state for in-flight entries', async () => {
    let resolveLoader!: (value: string) => void;
    const loader = () =>
      new Promise<string>((resolve) => (resolveLoader = resolve));

    // Start fetch but don't resolve
    get('key', loader);

    const entries = await inspect();

    expect(entries[0].expiresIn).toBe('loading...');

    // Clean up
    resolveLoader('data');
  });

  it('should return empty array when cache is empty', async () => {
    const entries = await inspect();
    expect(entries).toEqual([]);
  });
});

describe('useCache', () => {
  it('should return the same singleton instance', () => {
    const a = useCache();
    const b = useCache();

    expect(a.get).toBe(b.get);
    expect(a.invalidate).toBe(b.invalidate);
    expect(a.inspect).toBe(b.inspect);
  });
});
