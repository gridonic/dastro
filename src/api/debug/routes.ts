
import type { APIRoute } from 'astro';
import type {DastroTypes, ExportTypesRouting} from "../../lib-types.ts";

export const GET: APIRoute = async (context) => {
  const { routing, config } = context.locals.dastro;
  const { getAllRoutes } = routing();

  const routes = await getAllRoutes(context);
  return new Response(
    JSON.stringify(
      [...routes].sort((a, b) => {
        if (a.locale === b.locale) {
          return (a.url ?? '').localeCompare(b.url ?? '');
        }

        if (a.locale === config.i18n.defaultLocale) {
          return -1;
        }

        // return (a.locale as SiteLocale).localeCompare(b.locale);
        return (a.locale as DastroTypes['SiteLocale']).localeCompare(b.locale);
      }),
    ),
  );
};
