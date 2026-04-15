import { type AstroContext, draftMode, environmentSwitch } from 'dastro';
import type { DastroConfig, DastroTypes } from '../core/lib-types.ts';
import { useCache } from './local-cache.ts';

/**
 * Context-aware cache wrapper. Bypasses the cache when draft mode
 * is enabled or a custom DatoCMS environment is active, otherwise
 * delegates to the local in-memory cache.
 */
export function contextAwareCacheWrapper<T extends DastroTypes>(
  config: DastroConfig<T>,
) {
  return function withCache<R>(
    key: string,
    context: AstroContext<'cookies'>,
    loader: () => Promise<R>,
    ttl?: number,
  ): Promise<R> {
    const { isDraftModeEnabled } = draftMode(config);
    const { usesDefaultDatoEnvironment } = environmentSwitch(config);

    if (isDraftModeEnabled(context) || !usesDefaultDatoEnvironment(context)) {
      return loader();
    }

    return useCache().get(key, loader, ttl);
  };
}
