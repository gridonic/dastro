import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { caching } from './caching.ts';
import { resetDraftModeProductionWarning } from '../datocms/draft-mode.ts';

const SECRET = 'jwt-cookie-secret';

function buildConfig({
  environment = 'stage',
  draftModeEnabledByDefault,
}: { environment?: string; draftModeEnabledByDefault?: boolean } = {}) {
  return {
    environment,
    datocms: {
      environment: 'main',
      allowEnvironmentSwitch: false,
      draftModeEnabledByDefault,
    },
    api: { signedCookieJwtSecret: SECRET },
  } as any;
}

function buildContext(draftModeCookie?: boolean) {
  const value =
    draftModeCookie === undefined
      ? undefined
      : jwt.sign({ enabled: draftModeCookie }, SECRET);

  return {
    cookies: {
      get: (name: string) =>
        name === 'draft_mode' && value ? { value } : undefined,
    },
    response: { headers: new Headers() },
  } as any;
}

function headersFor(
  config: ReturnType<typeof buildConfig>,
  draftModeCookie?: boolean,
) {
  const context = buildContext(draftModeCookie);
  caching(config).setCachingHeaders(context);
  return context.response.headers as Headers;
}

beforeEach(() => {
  resetDraftModeProductionWarning();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('setCachingHeaders', () => {
  it('caches when draft mode is off by default and no cookie is set', () => {
    const headers = headersFor(buildConfig());

    expect(headers.get('X-Gridonic-Draft-Mode')).toBe('false');
    expect(headers.get('X-Gridonic-Draft-Mode-Source')).toBe('default');
    expect(headers.get('Cache-Control')).toContain('public');
  });

  it('does not cache when draft mode is enabled by cookie', () => {
    const headers = headersFor(buildConfig(), true);

    expect(headers.get('X-Gridonic-Draft-Mode')).toBe('true');
    expect(headers.get('X-Gridonic-Draft-Mode-Source')).toBe('cookie');
    expect(headers.get('Cache-Control')).toBe('no-cache');
  });

  it('does not cache when draft mode is enabled by default', () => {
    const headers = headersFor(
      buildConfig({ draftModeEnabledByDefault: true }),
    );

    expect(headers.get('X-Gridonic-Draft-Mode')).toBe('true');
    expect(headers.get('X-Gridonic-Draft-Mode-Source')).toBe('default');
    expect(headers.get('Cache-Control')).toBe('no-cache');
  });

  it('still does not cache after opting out while enabled by default', () => {
    const headers = headersFor(
      buildConfig({ draftModeEnabledByDefault: true }),
      false,
    );

    expect(headers.get('X-Gridonic-Draft-Mode')).toBe('false');
    expect(headers.get('X-Gridonic-Draft-Mode-Source')).toBe('opt-out');
    expect(headers.get('Cache-Control')).toBe('no-cache');
    expect(headers.get('X-Gridonic-Cache-Config')).toContain(
      'draft mode by default',
    );
  });

  it('caches in production even if the default flag is set', () => {
    const headers = headersFor(
      buildConfig({
        environment: 'production',
        draftModeEnabledByDefault: true,
      }),
    );

    expect(headers.get('X-Gridonic-Draft-Mode')).toBe('false');
    expect(headers.get('Cache-Control')).toContain('public');
  });
});
