import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { AstroCookieSetOptions } from 'astro';
import { executeQuery } from '@datocms/cda-client';
import type { DastroConfig, DastroTypes } from '../core/lib-types.ts';
import type { AstroContext } from '../astro.context.ts';

export function environmentSwitch<T extends DastroTypes>(
  config: DastroConfig<T>,
) {
  const CUSTOM_DATO_ENVIRONMENT_COOKIE_NAME = 'dato_environment';

  function isDatoEnvironmentSwitchAllowed() {
    return config.datocms.allowEnvironmentSwitch;
  }

  function usesDefaultDatoEnvironment(context: AstroContext<'cookies'>) {
    return getDatoEnvironment(context) === config.datocms.environment;
  }

  function getDatoEnvironment(context: AstroContext<'cookies'>): string {
    const cookie = context.cookies?.get(CUSTOM_DATO_ENVIRONMENT_COOKIE_NAME);

    if (!cookie) {
      return config.datocms.environment;
    }

    try {
      const payload = jwt.verify(
        cookie.value,
        config.api.signedCookieJwtSecret,
      ) as JwtPayload;

      return payload.environment;
    } catch {
      return config.datocms.environment;
    }
  }

  async function switchDatoEnvironment(
    context: AstroContext<'cookies'>,
    environment: string = config.datocms.environment,
  ) {
    if (!isDatoEnvironmentSwitchAllowed()) {
      throw new Error('Environment switching is not allowed');
    }

    if (environment === config.datocms.environment) {
      context.cookies.delete(
        CUSTOM_DATO_ENVIRONMENT_COOKIE_NAME,
        cookieOptions(),
      );

      return;
    }

    if (await testEnvironmentExists(environment)) {
      context.cookies.set(
        CUSTOM_DATO_ENVIRONMENT_COOKIE_NAME,
        jwt.sign({ environment }, config.api.signedCookieJwtSecret),
        cookieOptions(),
      );
    }
  }

  async function testEnvironmentExists(environment: string): Promise<boolean> {
    try {
      await executeQuery('{siteInfo {id} }', {
        token: config.datocms.token,
        environment,
      });
      return true;
    } catch {
      return false;
    }
  }

  function cookieOptions(): AstroCookieSetOptions {
    return {
      path: '/',
      sameSite: 'none',
      httpOnly: false,
      secure: true,
      ...({ partitioned: true } as AstroCookieSetOptions),
    };
  }

  return {
    isDatoEnvironmentSwitchAllowed,
    usesDefaultDatoEnvironment,
    getDatoEnvironment,
    switchDatoEnvironment,
    CUSTOM_DATO_ENVIRONMENT_COOKIE_NAME,
  };
}
