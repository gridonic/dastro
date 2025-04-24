import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { AstroCookieSetOptions } from 'astro';
import type {AstroContext} from "../astro.context.ts";
import type {DastroConfig, DastroTypes} from "../lib-types.ts";

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
        config.cookies.signedCookieJwtSecret,
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
    return jwt.sign({enabled: true}, config.cookies.signedCookieJwtSecret);
  }

  function cookieOptions(): AstroCookieSetOptions {
    return {
      path: '/',
      sameSite: 'none',
      httpOnly: false,
      secure: true,
    };
  }

  return {
    isDraftModeEnabled,
    enableDraftMode,
    disableDraftMode,
    DRAFT_MODE_COOKIE_NAME
  }
}
