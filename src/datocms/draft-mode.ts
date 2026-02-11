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

export function draftMode<T extends DastroTypes>(config: DastroConfig<T>) {
  const DRAFT_MODE_COOKIE_NAME = 'draft_mode';

  function isDraftModeEnabled(context: AstroContext<'cookies'>): boolean {
    const cookie = context.cookies?.get(DRAFT_MODE_COOKIE_NAME);

    if (!cookie) {
      return false;
    }

    try {
      const payload = jwt.verify(
        cookie.value,
        config.api.signedCookieJwtSecret,
      ) as JwtPayload;

      return payload.enabled;
    } catch {
      return false;
    }
  }

  function enableDraftMode(context: AstroContext<'cookies'>) {
    context.cookies.set(DRAFT_MODE_COOKIE_NAME, jwtToken(), cookieOptions());
  }

  function disableDraftMode(context: AstroContext<'cookies'>) {
    context.cookies.delete(DRAFT_MODE_COOKIE_NAME, cookieOptions());
  }

  function jwtToken() {
    return jwt.sign({ enabled: true }, config.api.signedCookieJwtSecret);
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
    isDraftModeEnabled,
    enableDraftMode,
    disableDraftMode,
    draftModeHeaders,
    addExecutedQueryInDraftMode,
    getExecutedDraftQueries,
    redirectUrlWithoutDraftModeSwitch,
    DRAFT_MODE_COOKIE_NAME,
  };
}
