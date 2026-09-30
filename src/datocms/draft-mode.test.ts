import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  draftMode,
  type DraftModeSource,
  resetDraftModeProductionWarning,
} from './draft-mode.ts';

const SECRET = 'jwt-cookie-secret';

function buildConfig({
  environment = 'stage',
  draftModeEnabledByDefault,
}: { environment?: string; draftModeEnabledByDefault?: boolean } = {}) {
  return {
    environment,
    datocms: { draftModeEnabledByDefault },
    api: { signedCookieJwtSecret: SECRET },
  } as any;
}

type CookieValue = 'none' | 'on' | 'off' | 'invalid';

function buildCookies(cookie: CookieValue = 'none') {
  const values: Record<CookieValue, string | undefined> = {
    none: undefined,
    on: jwt.sign({ enabled: true }, SECRET),
    off: jwt.sign({ enabled: false }, SECRET),
    invalid: 'not-a-jwt',
  };
  const value = values[cookie];

  return {
    get: vi.fn(() => (value === undefined ? undefined : { value })),
    set: vi.fn(),
    delete: vi.fn(),
  };
}

function decodeSetCookie(cookies: ReturnType<typeof buildCookies>) {
  const [, token] = cookies.set.mock.calls[0] as unknown as [string, string];
  return jwt.verify(token, SECRET) as { enabled: boolean };
}

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  resetDraftModeProductionWarning();
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getDraftModeState', () => {
  // prettier-ignore
  const cases: {
    environment: string;
    byDefault: boolean;
    cookie: CookieValue;
    enabled: boolean;
    source: DraftModeSource;
  }[] = [
    // default off
    { environment: 'stage', byDefault: false, cookie: 'none', enabled: false, source: 'default' },
    { environment: 'stage', byDefault: false, cookie: 'on', enabled: true, source: 'cookie' },
    { environment: 'stage', byDefault: false, cookie: 'off', enabled: false, source: 'opt-out' },
    { environment: 'stage', byDefault: false, cookie: 'invalid', enabled: false, source: 'default' },
    // default on
    { environment: 'stage', byDefault: true, cookie: 'none', enabled: true, source: 'default' },
    { environment: 'stage', byDefault: true, cookie: 'on', enabled: true, source: 'cookie' },
    { environment: 'stage', byDefault: true, cookie: 'off', enabled: false, source: 'opt-out' },
    { environment: 'stage', byDefault: true, cookie: 'invalid', enabled: true, source: 'default' },
    // production refuses the default
    { environment: 'production', byDefault: true, cookie: 'none', enabled: false, source: 'default' },
    { environment: 'production', byDefault: true, cookie: 'on', enabled: true, source: 'cookie' },
    { environment: 'production', byDefault: true, cookie: 'off', enabled: false, source: 'opt-out' },
    { environment: 'production', byDefault: true, cookie: 'invalid', enabled: false, source: 'default' },
    { environment: 'production', byDefault: false, cookie: 'none', enabled: false, source: 'default' },
    { environment: 'production', byDefault: false, cookie: 'on', enabled: true, source: 'cookie' },
    { environment: 'production', byDefault: false, cookie: 'off', enabled: false, source: 'opt-out' },
    { environment: 'production', byDefault: false, cookie: 'invalid', enabled: false, source: 'default' },
  ];

  it.each(cases)(
    'env=$environment default=$byDefault cookie=$cookie → enabled=$enabled source=$source',
    ({ environment, byDefault, cookie, enabled, source }) => {
      const dm = draftMode(
        buildConfig({ environment, draftModeEnabledByDefault: byDefault }),
      );
      const context = { cookies: buildCookies(cookie) } as any;

      expect(dm.getDraftModeState(context)).toEqual({ enabled, source });
      expect(dm.isDraftModeEnabled(context)).toBe(enabled);
    },
  );

  it('treats a missing flag as default off', () => {
    const dm = draftMode(buildConfig());
    const context = { cookies: buildCookies('none') } as any;

    expect(dm.isDraftModeEnabledByDefault()).toBe(false);
    expect(dm.isDraftModeEnabled(context)).toBe(false);
  });
});

describe('production refusal', () => {
  it('refuses the default in production and warns once per process', () => {
    const dm = draftMode(
      buildConfig({
        environment: 'production',
        draftModeEnabledByDefault: true,
      }),
    );

    expect(dm.isDraftModeEnabledByDefault()).toBe(false);
    expect(dm.isDraftModeDefaultRefused()).toBe(true);

    dm.isDraftModeEnabledByDefault();
    draftMode(
      buildConfig({
        environment: 'production',
        draftModeEnabledByDefault: true,
      }),
    ).isDraftModeEnabledByDefault();

    expect(warn).toHaveBeenCalledOnce();
  });

  it('does not warn outside production', () => {
    const dm = draftMode(buildConfig({ draftModeEnabledByDefault: true }));

    expect(dm.isDraftModeEnabledByDefault()).toBe(true);
    expect(dm.isDraftModeDefaultRefused()).toBe(false);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('enableDraftMode / disableDraftMode', () => {
  it('default off: enable sets an enabled cookie', () => {
    const cookies = buildCookies();
    draftMode(buildConfig()).enableDraftMode({ cookies } as any);

    expect(decodeSetCookie(cookies).enabled).toBe(true);
    expect(cookies.delete).not.toHaveBeenCalled();
  });

  it('default off: disable deletes the cookie', () => {
    const cookies = buildCookies('on');
    draftMode(buildConfig()).disableDraftMode({ cookies } as any);

    expect(cookies.delete).toHaveBeenCalledOnce();
    expect(cookies.set).not.toHaveBeenCalled();
  });

  it('default on: enable deletes the opt-out cookie', () => {
    const cookies = buildCookies('off');
    draftMode(buildConfig({ draftModeEnabledByDefault: true })).enableDraftMode(
      { cookies } as any,
    );

    expect(cookies.delete).toHaveBeenCalledOnce();
    expect(cookies.set).not.toHaveBeenCalled();
  });

  it('default on: disable writes an opt-out cookie', () => {
    const cookies = buildCookies();
    draftMode(
      buildConfig({ draftModeEnabledByDefault: true }),
    ).disableDraftMode({ cookies } as any);

    expect(decodeSetCookie(cookies).enabled).toBe(false);
    expect(cookies.delete).not.toHaveBeenCalled();
  });

  it('production with default flag: behaves like default off', () => {
    const cookies = buildCookies('on');
    draftMode(
      buildConfig({
        environment: 'production',
        draftModeEnabledByDefault: true,
      }),
    ).disableDraftMode({ cookies } as any);

    expect(cookies.delete).toHaveBeenCalledOnce();
  });
});
