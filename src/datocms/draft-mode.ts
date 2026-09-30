import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { AstroCookieSetOptions } from 'astro';
import type { AstroContext } from '../astro.context.ts';
import type { DastroConfig, DastroTypes } from '../core/lib-types.ts';
import type { QueryListenerOptions } from '@datocms/astro';

export interface ExecutedQuery<
  QueryResult,
  QueryVariables,
> extends QueryListenerOptions<QueryResult, QueryVariables> {
  // TODO: can add stuff like resulting cache tags
}

/**
 * Where the draft mode state comes from:
 * - `default`: no (valid) cookie, the env default applies
 * - `cookie`: the cookie explicitly enables draft mode
 * - `opt-out`: the cookie explicitly disables draft mode
 */
export type DraftModeSource = 'default' | 'cookie' | 'opt-out';

export interface DraftModeState {
  enabled: boolean;
  source: DraftModeSource;
}

let productionWarningPrinted = false;

/** Only for tests: allows the once-per-process warning to be printed again. */
export function resetDraftModeProductionWarning() {
  productionWarningPrinted = false;
}

export function draftMode<T extends DastroTypes>(config: DastroConfig<T>) {
  const DRAFT_MODE_COOKIE_NAME = 'draft_mode';

  // Draft mode by default is never allowed in production
  function isDraftModeDefaultRefused(): boolean {
    return (
      !!config.datocms.draftModeEnabledByDefault &&
      config.environment === 'production'
    );
  }

  function isDraftModeEnabledByDefault(): boolean {
    if (isDraftModeDefaultRefused()) {
      if (!productionWarningPrinted) {
        productionWarningPrinted = true;
        console.warn(
          'DRAFT_MODE_ENABLED_BY_DEFAULT is ignored because ENVIRONMENT=production.',
        );
      }
      return false;
    }

    return !!config.datocms.draftModeEnabledByDefault;
  }

  function getDraftModeState(context: AstroContext<'cookies'>): DraftModeState {
    const cookieEnabled = readDraftModeCookie(context);

    if (cookieEnabled === true) {
      return { enabled: true, source: 'cookie' };
    }

    if (cookieEnabled === false) {
      return { enabled: false, source: 'opt-out' };
    }

    return { enabled: isDraftModeEnabledByDefault(), source: 'default' };
  }

  function isDraftModeEnabled(context: AstroContext<'cookies'>): boolean {
    return getDraftModeState(context).enabled;
  }

  // Returns the explicit cookie choice, or undefined if there is no valid cookie
  function readDraftModeCookie(
    context: AstroContext<'cookies'>,
  ): boolean | undefined {
    const cookie = context.cookies?.get(DRAFT_MODE_COOKIE_NAME);

    if (!cookie) {
      return undefined;
    }

    try {
      const payload = jwt.verify(
        cookie.value,
        config.api.signedCookieJwtSecret,
      ) as JwtPayload;

      return typeof payload.enabled === 'boolean' ? payload.enabled : undefined;
    } catch {
      return undefined;
    }
  }

  function enableDraftMode(context: AstroContext<'cookies'>) {
    if (isDraftModeEnabledByDefault()) {
      // Removing the opt-out falls back to the default, which is on
      context.cookies.delete(DRAFT_MODE_COOKIE_NAME, cookieOptions());
    } else {
      context.cookies.set(DRAFT_MODE_COOKIE_NAME, jwtToken(), cookieOptions());
    }
  }

  function disableDraftMode(context: AstroContext<'cookies'>) {
    if (isDraftModeEnabledByDefault()) {
      context.cookies.set(
        DRAFT_MODE_COOKIE_NAME,
        jwtToken(false),
        cookieOptions(),
      );
    } else {
      context.cookies.delete(DRAFT_MODE_COOKIE_NAME, cookieOptions());
    }
  }

  function jwtToken(enabled = true) {
    return jwt.sign({ enabled }, config.api.signedCookieJwtSecret);
  }

  function cookieOptions(): AstroCookieSetOptions {
    return {
      path: '/',
      sameSite: 'none',
      httpOnly: false,
      secure: true,
      partitioned: true,
    };
  }

  function draftModeHeaders(): HeadersInit {
    return {
      Cookie: `${DRAFT_MODE_COOKIE_NAME}=${jwtToken()};`,
    };
  }

  function addExecutedQueryInDraftMode<QueryResult, QueryVariables>(
    executedQuery: ExecutedQuery<QueryResult, QueryVariables>,
    context: AstroContext<'cookies' | 'locals'>,
  ) {
    if (!isDraftModeEnabled(context)) {
      return;
    }

    const { locals } = context;

    if (!locals.draftMode) {
      locals.draftMode = {
        executedQueries: [],
      };
    }

    if (!locals.draftMode.executedQueries) {
      locals.draftMode.executedQueries = [];
    }

    locals.draftMode.executedQueries.push(executedQuery);
  }

  function getExecutedDraftQueries(context: AstroContext<'locals'>) {
    const { locals } = context;
    return locals.draftMode?.executedQueries ?? [];
  }

  // if the redirect url of the draft mode switch contains another draft mode switch, remove it and use the next redirect url instead
  function redirectUrlWithoutDraftModeSwitch(originalUrl: URL): string {
    const redirectUrl =
      originalUrl.searchParams.get('redirect') ||
      originalUrl.searchParams.get('url') ||
      '/';

    if (!redirectUrl.startsWith('/api/cms/draft-mode/')) {
      return redirectUrl;
    }

    const nextRedirectUrl = new URL(redirectUrl, originalUrl.origin);
    return (
      nextRedirectUrl.searchParams.get('redirect') ||
      nextRedirectUrl.searchParams.get('url') ||
      '/'
    );
  }

  return {
    getDraftModeState,
    isDraftModeEnabled,
    isDraftModeEnabledByDefault,
    isDraftModeDefaultRefused,
    enableDraftMode,
    disableDraftMode,
    draftModeHeaders,
    addExecutedQueryInDraftMode,
    getExecutedDraftQueries,
    redirectUrlWithoutDraftModeSwitch,
    DRAFT_MODE_COOKIE_NAME,
  };
}
