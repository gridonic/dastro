import merge from 'deepmerge';
import { type AstroContext, draftMode, environmentSwitch } from 'dastro';
import type { DastroConfig, DastroTypes } from './lib-types.ts';

export interface CachingOptions {
  provider?: { type: 'nocache' } | ({ type: 'netlify' } & NetlifyCacheOptions);
}

export interface NetlifyCacheOptions {
  vary?: Record<string, string[] | null>;
  freshInCdn?: number;
  staleInCdn?: number;
}

export function caching<T extends DastroTypes>(config: DastroConfig<T>) {
  function setCachingHeaders(
    context: AstroContext<'cookies' | 'response'>,
    options: CachingOptions = {},
  ) {
    const { provider = { type: 'netlify' } } = options;

    const { isDraftModeEnabled, DRAFT_MODE_COOKIE_NAME } = draftMode(config);

    const {
      usesDefaultDatoEnvironment,
      getDatoEnvironment,
      CUSTOM_DATO_ENVIRONMENT_COOKIE_NAME,
    } = environmentSwitch(config);

    context.response.headers.set('X-Gridonic-Cache-Provider', provider.type);

    const draftModeEnabled = isDraftModeEnabled(context);
    context.response.headers.set(
      'X-Gridonic-Draft-Mode',
      draftModeEnabled ? 'true' : 'false',
    );

    const usesCustomDatoEnvironment = !usesDefaultDatoEnvironment(context);
    context.response.headers.set(
      'X-Gridonic-Dato-Environment',
      getDatoEnvironment(context),
    );

    // When using draft mode, or when targeting a custom environment, disable caching
    if (
      provider.type === 'nocache' ||
      draftModeEnabled ||
      usesCustomDatoEnvironment
    ) {
      noCache();
    } else {
      if (provider.type === 'netlify') {
        netlifySwrCache(provider);
      }

      // netlifyTagsCache();
    }

    function noCache() {
      context.response.headers.set('Cache-Control', 'no-cache');

      const bypassCacheReasons = [
        draftModeEnabled ? 'draft mode' : null,
        usesCustomDatoEnvironment ? 'custom environment' : null,
      ].filter((v) => !!v);

      context.response.headers.set(
        'X-Gridonic-Cache-Config',
        `cache disabled due to: ${bypassCacheReasons.join(', ') || 'no reason'}`,
      );
    }

    function netlifySwrCache(providerOptions: NetlifyCacheOptions) {
      const {
        vary = { query: [] },
        freshInCdn = 5 * 60, // 5 minutes;
        staleInCdn = 365 * 24 * 60 * 60, // 1 year
      } = providerOptions;
      // @see https://developers.netlify.com/guides/how-to-do-advanced-caching-and-isr-with-astro/
      const varyHeader = merge(
        {
          cookie: [DRAFT_MODE_COOKIE_NAME, CUSTOM_DATO_ENVIRONMENT_COOKIE_NAME],
        },
        vary,
      );

      context.response.headers.set(
        'Netlify-Vary',
        Object.keys(varyHeader)
          .map((key) => {
            if (varyHeader[key] === null) {
              return null;
            }

            return varyHeader[key].length > 0
              ? `${key}=${[...new Set(varyHeader[key])].join('|')}`
              : key;
          })
          .filter((v) => !!v)
          .join(','),
      );

      // Tell the browser to always check the freshness of the cache
      context.response.headers.set(
        'Cache-Control',
        // Without max-age for the local cache set to at least some value, the prefetch mechanism is useless, so we use a small value here
        //  NOTE: this seems to have changed with speculation api! but for backwards compatibility, we still keep this max-age here...
        'public, max-age=60, must-revalidate',
      );

      // Tell Netlify's CDN to treat it as fresh for X seconds, then for up to Y seconds return a stale version
      // while it revalidates. Use Durable Cache to minimize the need for serverless function calls.
      context.response.headers.set(
        'Netlify-CDN-Cache-Control',
        `public, durable, s-maxage=${freshInCdn}, stale-while-revalidate=${staleInCdn}`, // TODO: stale-if-error?
      );

      // For debugging purposes, set the X-Cache-Config header to show our cache settings in the browser
      context.response.headers.set(
        'X-Gridonic-Cache-Config',
        `max age: ${freshInCdn}, swr: ${staleInCdn}`,
      );
    }

    // function netlifyTagsCache() {
    //   // @see https://developers.netlify.com/guides/how-to-do-advanced-caching-and-isr-with-astro/
    //   context.response.headers.set(
    //     'Netlify-Vary',
    //     `cookie=${DRAFT_MODE_COOKIE_NAME}|${CUSTOM_DATO_ENVIRONMENT_COOKIE_NAME}`,
    //   );
    //
    //   // Tell the browser to always check the freshness of the cache
    //   context.response.headers.set(
    //     'Cache-Control',
    //     // Without max-age for the local cache set to at least some value, the prefetch mechanism is useless, so we use a small value here
    //     //  NOTE: this seems to have changed with speculation api! but for backwards compatibility, we still keep this max-age here...
    //     'public, max-age=60, must-revalidate',
    //   );
    //
    //   // The CDN should cache for some time but revalidate if the cache tag changes
    //   context.response.headers.set(
    //     'Netlify-CDN-Cache-Control',
    //     `public, durable, s-maxage=${FRESH_IN_CDN}`, // TODO: stale-while-revalidate? stale-if-error?
    //   );
    //
    //   // For debugging purposes, set the X-Cache-Config header to show our cache settings in the browser
    //   context.response.headers.set('X-Gridonic-Cache-Config', 'cache tags');
    // }
  }

  return {
    setCachingHeaders,
  };

  // export function augmentResponseHeadersWithCacheTags(
  //   newCacheTags: string[],
  //   context: AstroContext<'response'>,
  // ) {
  //   const NETLIFY_CACHE_TAG_NAME = 'Netlify-Cache-Tag';
  //
  //   const existingCacheTags =
  //     context.response.headers.get(NETLIFY_CACHE_TAG_NAME)?.split(' ') ?? [];
  //   const finalCacheTags = [
  //     ...new Set([...existingCacheTags, ...newCacheTags]),
  //   ].join(' ');
  //
  //   context.response.headers.set(NETLIFY_CACHE_TAG_NAME, finalCacheTags);
  //   context.response.headers.set('X-Gridonic-Cache-Tags', finalCacheTags);
  // }
}
