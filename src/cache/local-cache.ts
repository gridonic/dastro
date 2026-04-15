type Entry<T> = {
  promise: Promise<T>;
  expires: number;
};

const DEFAULT_TTL = 5 * 60 * 1000;

const localCache = new Map<string, Entry<unknown>>();

/**
 * Singleton in-memory cache. Caches Promises to prevent stampedes —
 * concurrent requests during a fetch share the same Promise.
 *
 * TTL starts after the loader resolves, not when the request is made.
 */
export function useCache() {
  return { get, invalidate, inspect };
}

/**
 * Get a cached value or fetch it via the loader.
 */
function get<T>(
  key: string,
  loader: () => Promise<T>,
  ttl = DEFAULT_TTL,
): Promise<T> {
  const now = Date.now();
  const entry = localCache.get(key);

  if (entry && now < entry.expires) {
    return entry.promise as Promise<T>;
  }

  const promise = loader()
    .then((result) => {
      localCache.set(key, {
        promise: Promise.resolve(result),
        expires: Date.now() + ttl,
      });
      return result;
    })
    .catch((err) => {
      localCache.delete(key);
      throw err;
    });

  // Temporary entry while loading — stampede protection.
  // Infinity ensures it never expires mid-fetch.
  localCache.set(key, {
    promise,
    expires: Infinity,
  });

  return promise as Promise<T>;
}

/**
 * Invalidate a single key or the entire cache.
 */
function invalidate(key?: string): void {
  if (key) {
    localCache.delete(key);
  } else {
    localCache.clear();
  }
}

/**
 * Inspect the cache for debugging. Returns metadata for each entry,
 * optionally including the cached values.
 */
async function inspect(options?: { includeValues?: boolean }) {
  const now = Date.now();

  return Promise.all(
    [...localCache.entries()].map(async ([key, entry]) => ({
      key,
      expired: now > entry.expires,
      expiresIn:
        entry.expires === Infinity
          ? 'loading...'
          : `${Math.round((entry.expires - now) / 1000)}s`,
      ...(options?.includeValues && { value: await entry.promise }),
    })),
  );
}
