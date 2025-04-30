import type { APIRoute } from 'astro';
import type {Route} from "../core/routing.ts";
import type {DastroTypes} from "../core/lib-types.ts";

export const GET: APIRoute = async (context) => {
  const { config, routing } = context.locals.dastro;
  const { resolveRecordUrl, getAllRoutes } = routing();

  const baseUrl = config.appBaseUrl.replace(/\/$/, '');
  const routes = await getAllRoutes(context);

  const result = `<?xml version="1.0" encoding="UTF-8"?>

<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${routes
  .filter((route) => !route.record.seo?.noIndex)
  .map((route) => urlEntry(route))
  .join('\n')}
</urlset>`;

  return new Response(result, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });

  function urlEntry(route: Route<DastroTypes>) {
    return `
  <url>
    <loc>${baseUrl}${route.url}</loc>
${localizedAlternates(route)
  .map(
    (a) =>
      `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${baseUrl}${a.href}" />`,
  )
  .join('\n')}
    <lastmod>${route.record._updatedAt}</lastmod>
  </url>`;
  }

  function localizedAlternates(route: Route<DastroTypes>) {
    // for single-locale apps, we do not need to specify alternatives
    if (config.i18n.locales.length <= 1) {
      return [];
    }

    return config.i18n.locales
      .map((l) => {
        const href = resolveRecordUrl(route.record, l);
        return href
          ? {
              hreflang: l,
              href,
            }
          : null;
      })
      .filter((v) => !!v);
  }
};
