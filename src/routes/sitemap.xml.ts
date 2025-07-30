import type { APIRoute } from 'astro';
import type {Route} from "../core/routing.ts";
import type {DastroTypes} from "../core/lib-types.ts";
import {isSearchIndexingPrevented} from "../core/page-indexing.ts";

export const GET: APIRoute = async (context) => {
  const { config, routing, i18n } = context.locals.dastro;
  const { resolveRecordUrl, getAllRoutes } = routing();
  const { locales } = i18n();

  const baseUrl = config.appBaseUrl.replace(/\/$/, '');
  const routesToIndex = await getRoutesToIndex();

  const result = `<?xml version="1.0" encoding="UTF-8"?>

<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${routesToIndex
  .filter((route) => !route.record.seo?.noIndex)
  .map((route) => urlEntry(route))
  .join('\n')}
</urlset>`;

  return new Response(result, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });

  async function getRoutesToIndex() {
    const routes = await getAllRoutes(context);
    if (isSearchIndexingPrevented(config)) {
      // when indexing prevented, do not output any routes, except when the ignore_prevention param is appended for testing the sitemap output
      if (
        context.url.searchParams.get('bypass_indexing_prevention') !== 'true'
      ) {
        return [];
      }
    }

    return routes.filter((route) => !route.record.seo?.noIndex);
  }

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
    if (locales.length <= 1) {
      return [];
    }

    return locales
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
