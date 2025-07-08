import { defineMiddleware } from 'astro:middleware';

// NOTE: "Turns off" HTML streaming for all HTML responses by resolving them here
export const onRequest = defineMiddleware(async (_, next) => {
  const response = await next();
  if (response.headers.get('content-type')?.includes('text/html') !== true) {
    return response;
  }

  const body = await response.text();
  return new Response(body, response);
});
