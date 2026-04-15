import { afterEach, describe, expect, it, vi } from 'vitest';
import { contextAwareCacheWrapper } from './with-cache.ts';
import { useCache } from './local-cache.ts';

// --- Mocks ---

vi.mock('dastro', () => ({
  draftMode: vi.fn(),
  environmentSwitch: vi.fn(),
}));

import { draftMode, environmentSwitch } from 'dastro';

const mockDraftMode = vi.mocked(draftMode);
const mockEnvironmentSwitch = vi.mocked(environmentSwitch);

// Minimal config stub — only used as an opaque token passed to mocked functions
const config = { environment: 'production', dev: { cachingEnabled: false } } as any;
const localConfig = { environment: 'local', dev: { cachingEnabled: false } } as any;
const localCachingEnabledConfig = { environment: 'local', dev: { cachingEnabled: true } } as any;

function setupMocks({
  isDraft = false,
  isDefaultEnvironment = true,
}: { isDraft?: boolean; isDefaultEnvironment?: boolean } = {}) {
  mockDraftMode.mockReturnValue({
    isDraftModeEnabled: () => isDraft,
  } as any);
  mockEnvironmentSwitch.mockReturnValue({
    usesDefaultDatoEnvironment: () => isDefaultEnvironment,
  } as any);
}

// Minimal Astro context stub
const context = { cookies: {} } as any;

const { invalidate } = useCache();

afterEach(() => {
  invalidate();
  vi.restoreAllMocks();
});

describe('contextAwareCacheWrapper', () => {
  it('should cache loader result on first call', async () => {
    setupMocks();
    const withCache = contextAwareCacheWrapper(config);
    const loader = vi.fn().mockResolvedValue('data');

    const result = await withCache('key', context, loader);

    expect(result).toBe('data');
    expect(loader).toHaveBeenCalledOnce();
  });

  it('should return cached value on subsequent calls', async () => {
    setupMocks();
    const withCache = contextAwareCacheWrapper(config);
    const loader = vi.fn().mockResolvedValue('data');

    await withCache('key', context, loader);
    const result = await withCache('key', context, loader);

    expect(result).toBe('data');
    expect(loader).toHaveBeenCalledOnce();
  });

  it('should bypass cache when draft mode is enabled', async () => {
    setupMocks({ isDraft: true });
    const withCache = contextAwareCacheWrapper(config);
    const loader = vi
      .fn()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second');

    const first = await withCache('key', context, loader);
    const second = await withCache('key', context, loader);

    expect(first).toBe('first');
    expect(second).toBe('second');
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('should bypass cache when using custom DatoCMS environment', async () => {
    setupMocks({ isDefaultEnvironment: false });
    const withCache = contextAwareCacheWrapper(config);
    const loader = vi
      .fn()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second');

    const first = await withCache('key', context, loader);
    const second = await withCache('key', context, loader);

    expect(first).toBe('first');
    expect(second).toBe('second');
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('should bypass cache when both draft mode and custom environment are active', async () => {
    setupMocks({ isDraft: true, isDefaultEnvironment: false });
    const withCache = contextAwareCacheWrapper(config);
    const loader = vi
      .fn()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second');

    await withCache('key', context, loader);
    await withCache('key', context, loader);

    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('should respect custom TTL', async () => {
    vi.useFakeTimers();
    setupMocks();
    const withCache = contextAwareCacheWrapper(config);
    const loader = vi
      .fn()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second');

    await withCache('key', context, loader, 100);

    vi.advanceTimersByTime(101);

    const result = await withCache('key', context, loader, 100);

    expect(result).toBe('second');
    expect(loader).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('should cache within TTL window', async () => {
    vi.useFakeTimers();
    setupMocks();
    const withCache = contextAwareCacheWrapper(config);
    const loader = vi.fn().mockResolvedValue('data');

    await withCache('key', context, loader, 1000);

    vi.advanceTimersByTime(500);

    await withCache('key', context, loader, 1000);

    expect(loader).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });

  it('should bypass cache in local development', async () => {
    setupMocks();
    const withCache = contextAwareCacheWrapper(localConfig);
    const loader = vi
      .fn()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second');

    const first = await withCache('key', context, loader);
    const second = await withCache('key', context, loader);

    expect(first).toBe('first');
    expect(second).toBe('second');
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('should cache in local development when cachingEnabled is true', async () => {
    setupMocks();
    const withCache = contextAwareCacheWrapper(localCachingEnabledConfig);
    const loader = vi.fn().mockResolvedValue('data');

    await withCache('key', context, loader);
    const result = await withCache('key', context, loader);

    expect(result).toBe('data');
    expect(loader).toHaveBeenCalledOnce();
  });

  it('should not pollute cache when bypassed', async () => {
    // First call in draft mode — should bypass and not store
    setupMocks({ isDraft: true });
    const withCache = contextAwareCacheWrapper(config);
    const draftLoader = vi.fn().mockResolvedValue('draft-data');

    await withCache('key', context, draftLoader);

    // Switch to normal mode — should call loader since nothing was cached
    setupMocks({ isDraft: false });
    const normalLoader = vi.fn().mockResolvedValue('normal-data');

    const result = await withCache('key', context, normalLoader);

    expect(result).toBe('normal-data');
    expect(normalLoader).toHaveBeenCalledOnce();
  });
});
