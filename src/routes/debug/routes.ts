
import type { APIRoute } from 'astro';
import type {DastroTypes} from "../../core/lib-types.ts";
import {checkSecretApiTokenCorrectness, invalidRequestResponse, json} from '../utils.ts';

export const GET: APIRoute = async (context) => {
  if (!checkSecretApiTokenCorrectness(context.locals.dastro.config, context.url.searchParams.get('token'))) {
    return invalidRequestResponse('Invalid token', 401);
  }

  const { routing, config } = context.locals.dastro;
  const { getAllRoutes } = routing();

  const routes = await getAllRoutes(context);

  return json([...routes].sort((a, b) => {
    if (a.locale === b.locale) {
      return (a.url ?? '').localeCompare(b.url ?? '');
    }

    if (a.locale === config.i18n.defaultLocale) {
      return -1;
    }

    // return (a.locale as SiteLocale).localeCompare(b.locale);
    return (a.locale as DastroTypes['SiteLocale']).localeCompare(b.locale);
  }));
};
