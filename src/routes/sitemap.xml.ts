import type { APIRoute } from 'astro';
import type {Route} from "../core/routing.ts";
import type {DastroTypes} from "../core/lib-types.ts";
import {isRecordExcludedFromIndexing, isSearchIndexingPrevented} from "../core/page-indexing.ts";

export const GET: APIRoute = async (context) => {
  const { config, routing } = context.locals.dastro;
  const { hreflangCluster, getAllRoutes } = routing();

  const baseUrl = config.appBaseUrl.replace(/\/$/, '');
  const routesToIndex = await getRoutesToIndex();

  const result = `<?xml version="1.0" encoding="UTF-8"?>

<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${routesToIndex
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

    return routes.filter(
      (route) => !isRecordExcludedFromIndexing(route.record, route.locale),
    );
  }

  function urlEntry(route: Route<DastroTypes>) {
    return `
  <url>
    <loc>${baseUrl}${route.url}</loc>
${hreflangCluster(route.record)
  .map(
    (a) =>
      `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${baseUrl}${a.href}" />`,
  )
  .join('\n')}
    <lastmod>${route.record._updatedAt}</lastmod>
  </url>`;
  }
};
