
import type { APIRoute } from 'astro';
import type {DastroTypes} from "../../core/lib-types.ts";
import {checkSecretApiTokenCorrectness, invalidRequestResponse, json} from '../utils.ts';

export const GET: APIRoute = async (context) => {
  if (!checkSecretApiTokenCorrectness(context.locals.dastro.config, context.url.searchParams.get('token'))) {
    return invalidRequestResponse('Invalid token', 401);
  }

  const { routing, i18n } = context.locals.dastro;
  const { getAllRoutes } = routing();
  const { isDefaultLocale, areLocalesEqual } = i18n();

  const routes = await getAllRoutes(context);

  return json([...routes].sort((a, b) => {
    if (areLocalesEqual(a.locale, b.locale)) {
      return (a.url ?? '').localeCompare(b.url ?? '');
    }

    if (isDefaultLocale(a.locale)) {
      return -1;
    }

    // return (a.locale as SiteLocale).localeCompare(b.locale);
    return (a.locale as DastroTypes['SiteLocale']).localeCompare(b.locale);
  }));
};
