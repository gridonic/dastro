import type {APIRoute} from "astro";

export const GET: APIRoute = async ({ locals }) => {
  const { config } = locals.dastro;

  const baseUrl = config.appBaseUrl.replace(/\/$/, '');

  // NOTE: do not disallow even when DEVELOPMENT_PREVENT_SEARCH_INDEXING is set.
  // See note here: https://developers.google.com/search/docs/crawling-indexing/block-indexing
  //  -> "Important: For the noindex rule to be effective, the page or resource must not be blocked by a robots.txt file, and it has to be otherwise accessible to the crawler. If the page is blocked by a robots.txt file or the crawler can't access the page, the crawler will never see the noindex rule, and the page can still appear in search results, for example if other pages link to it."
  const result = `User-agent: *
Disallow:  

Sitemap: ${baseUrl}/sitemap.xml`;

  return new Response(result, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
