import { describe, test, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { dastroTest } from '../../test/_testing-core/dastro-test.ts';

describe('caching', () => {
  function mockHeaders() {
    const store = new Map<string, string>();
    return {
      set: (name: string, value: string) => store.set(name, value),
      get: (name: string) => store.get(name) ?? null,
      store,
    };
  }

  function mockCookies(cookies: Record<string, string> = {}) {
    return {
      get: (name: string) => {
        if (name in cookies) {
          return { value: cookies[name] };
        }
        return undefined;
      },
    } as any;
  }

  function cachingTest(opts?: {
    cookies?: Record<string, string>;
    config?: NonNullable<Parameters<typeof dastroTest>[0]>['config'];
  }) {
    const headers = mockHeaders();
    const cookies = mockCookies(opts?.cookies);
    const { caching } = dastroTest({ config: opts?.config });
    const { setCachingHeaders } = caching();

    const context = {
      response: { headers },
      cookies,
    } as any;

    return { setCachingHeaders, context, headers };
  }

  test('setCachingHeaders is returned from caching()', () => {
    const { caching } = dastroTest();
    const result = caching();
    expect(result.setCachingHeaders).toBeTypeOf('function');
  });

  describe('default netlify provider', () => {
    test('sets cache provider header', () => {
      const { setCachingHeaders, context, headers } = cachingTest();
      setCachingHeaders(context);
      expect(headers.get('X-Gridonic-Cache-Provider')).toBe('netlify');
    });

    test('sets draft mode header to false when not in draft mode', () => {
      const { setCachingHeaders, context, headers } = cachingTest();
      setCachingHeaders(context);
      expect(headers.get('X-Gridonic-Draft-Mode')).toBe('false');
    });

    test('sets dato environment header', () => {
      const { setCachingHeaders, context, headers } = cachingTest();
      setCachingHeaders(context);
      expect(headers.get('X-Gridonic-Dato-Environment')).toBe('main');
    });

    test('sets Netlify-Vary header with cookie names', () => {
      const { setCachingHeaders, context, headers } = cachingTest();
      setCachingHeaders(context);
      const vary = headers.get('Netlify-Vary');
      expect(vary).toContain('cookie=');
      expect(vary).toContain('draft_mode');
      expect(vary).toContain('dato_environment');
    });

    test('sets Cache-Control for browser', () => {
      const { setCachingHeaders, context, headers } = cachingTest();
      setCachingHeaders(context);
      expect(headers.get('Cache-Control')).toBe(
        'public, max-age=60, must-revalidate',
      );
    });

    test('sets Netlify-CDN-Cache-Control with swr', () => {
      const { setCachingHeaders, context, headers } = cachingTest();
      setCachingHeaders(context);
      const cdnCache = headers.get('Netlify-CDN-Cache-Control');
      expect(cdnCache).toContain('durable');
      expect(cdnCache).toContain('s-maxage=300');
      expect(cdnCache).toContain('stale-while-revalidate=31536000');
    });

    test('sets X-Gridonic-Cache-Config with max age and swr', () => {
      const { setCachingHeaders, context, headers } = cachingTest();
      setCachingHeaders(context);
      expect(headers.get('X-Gridonic-Cache-Config')).toBe(
        'max age: 300, swr: 31536000',
      );
    });
  });

  describe('custom netlify provider options', () => {
    test('uses custom freshInCdn and staleInCdn', () => {
      const { setCachingHeaders, context, headers } = cachingTest();
      setCachingHeaders(context, {
        provider: { type: 'netlify', freshInCdn: 60, staleInCdn: 3600 },
      });
      const cdnCache = headers.get('Netlify-CDN-Cache-Control');
      expect(cdnCache).toContain('s-maxage=60');
      expect(cdnCache).toContain('stale-while-revalidate=3600');
      expect(headers.get('X-Gridonic-Cache-Config')).toBe(
        'max age: 60, swr: 3600',
      );
    });

    test('merges custom vary with default cookie vary', () => {
      const { setCachingHeaders, context, headers } = cachingTest();
      setCachingHeaders(context, {
        provider: {
          type: 'netlify',
          vary: { query: ['page'], cookie: ['session'] },
        },
      });
      const vary = headers.get('Netlify-Vary');
      expect(vary).toContain('draft_mode');
      expect(vary).toContain('dato_environment');
      expect(vary).toContain('session');
      expect(vary).toContain('query=page');
    });

    test('filters out null vary entries', () => {
      const { setCachingHeaders, context, headers } = cachingTest();
      setCachingHeaders(context, {
        provider: { type: 'netlify', vary: { query: null } },
      });
      const vary = headers.get('Netlify-Vary')!;
      expect(vary).not.toContain('query');
      expect(vary).toContain('cookie=');
    });

    test('Netlify-Vary uses pipe separator for cookie values', () => {
      const { setCachingHeaders, context, headers } = cachingTest();
      setCachingHeaders(context);
      const vary = headers.get('Netlify-Vary')!;
      expect(vary).toMatch(/cookie=.*\|/);
    });

    test('Netlify-Vary uses comma separator between entries', () => {
      const { setCachingHeaders, context, headers } = cachingTest();
      setCachingHeaders(context, {
        provider: { type: 'netlify', vary: { query: ['page'] } },
      });
      const vary = headers.get('Netlify-Vary')!;
      expect(vary).toContain(',');
      const parts = vary.split(',');
      expect(parts.length).toBeGreaterThan(1);
    });

    test('Netlify-Vary includes key without = when array is empty', () => {
      const { setCachingHeaders, context, headers } = cachingTest();
      setCachingHeaders(context, {
        provider: { type: 'netlify', vary: { query: [] } },
      });
      const vary = headers.get('Netlify-Vary')!;
      // query with empty array should render as just "query" (no =)
      expect(vary).toMatch(/(?:^|,)query(?:$|,)/);
    });

    test('default vary includes query key in Netlify-Vary', () => {
      const { setCachingHeaders, context, headers } = cachingTest();
      setCachingHeaders(context);
      const vary = headers.get('Netlify-Vary')!;
      // Default vary is { query: [] }, so "query" should appear as a bare key
      expect(vary).toMatch(/(?:^|,)query(?:$|,)/);
    });

    test('Netlify-Vary does not contain null or undefined entries', () => {
      const { setCachingHeaders, context, headers } = cachingTest();
      setCachingHeaders(context, {
        provider: { type: 'netlify', vary: { query: null, header: ['x-foo'] } },
      });
      const vary = headers.get('Netlify-Vary')!;
      expect(vary).not.toContain('null');
      expect(vary).not.toContain('undefined');
      expect(vary).toContain('header=x-foo');
    });
  });

  describe('nocache provider', () => {
    test('sets Cache-Control to no-cache', () => {
      const { setCachingHeaders, context, headers } = cachingTest();
      setCachingHeaders(context, { provider: { type: 'nocache' } });
      expect(headers.get('Cache-Control')).toBe('no-cache');
    });

    test('sets cache provider header to nocache', () => {
      const { setCachingHeaders, context, headers } = cachingTest();
      setCachingHeaders(context, { provider: { type: 'nocache' } });
      expect(headers.get('X-Gridonic-Cache-Provider')).toBe('nocache');
    });

    test('reports no reason when not in draft mode or custom env', () => {
      const { setCachingHeaders, context, headers } = cachingTest();
      setCachingHeaders(context, { provider: { type: 'nocache' } });
      expect(headers.get('X-Gridonic-Cache-Config')).toContain('no reason');
    });

    test('does not set Netlify-Vary or CDN headers', () => {
      const { setCachingHeaders, context, headers } = cachingTest();
      setCachingHeaders(context, { provider: { type: 'nocache' } });
      expect(headers.get('Netlify-Vary')).toBeNull();
      expect(headers.get('Netlify-CDN-Cache-Control')).toBeNull();
    });
  });

  describe('draft mode disables cache', () => {
    test('sets no-cache when draft mode is enabled', () => {
      const draftToken = jwt.sign({ enabled: true }, 'jwt-cookie-secret');
      const { setCachingHeaders, context, headers } = cachingTest({
        cookies: { draft_mode: draftToken },
      });
      setCachingHeaders(context);
      expect(headers.get('Cache-Control')).toBe('no-cache');
      expect(headers.get('X-Gridonic-Draft-Mode')).toBe('true');
    });

    test('reports draft mode as bypass reason', () => {
      const draftToken = jwt.sign({ enabled: true }, 'jwt-cookie-secret');
      const { setCachingHeaders, context, headers } = cachingTest({
        cookies: { draft_mode: draftToken },
      });
      setCachingHeaders(context);
      expect(headers.get('X-Gridonic-Cache-Config')).toContain('draft mode');
    });
  });

  describe('custom dato environment disables cache', () => {
    test('sets no-cache when using custom dato environment', () => {
      const envToken = jwt.sign(
        { environment: 'sandbox' },
        'jwt-cookie-secret',
      );
      const { setCachingHeaders, context, headers } = cachingTest({
        cookies: { dato_environment: envToken },
      });
      setCachingHeaders(context);
      expect(headers.get('Cache-Control')).toBe('no-cache');
      expect(headers.get('X-Gridonic-Dato-Environment')).toBe('sandbox');
    });

    test('reports custom environment as bypass reason', () => {
      const envToken = jwt.sign(
        { environment: 'sandbox' },
        'jwt-cookie-secret',
      );
      const { setCachingHeaders, context, headers } = cachingTest({
        cookies: { dato_environment: envToken },
      });
      setCachingHeaders(context);
      expect(headers.get('X-Gridonic-Cache-Config')).toContain(
        'custom environment',
      );
    });
  });

  describe('both draft mode and custom env', () => {
    test('reports both bypass reasons separated by comma', () => {
      const draftToken = jwt.sign({ enabled: true }, 'jwt-cookie-secret');
      const envToken = jwt.sign(
        { environment: 'sandbox' },
        'jwt-cookie-secret',
      );
      const { setCachingHeaders, context, headers } = cachingTest({
        cookies: { draft_mode: draftToken, dato_environment: envToken },
      });
      setCachingHeaders(context);
      const config = headers.get('X-Gridonic-Cache-Config')!;
      expect(config).toContain('draft mode, custom environment');
    });
  });
});
