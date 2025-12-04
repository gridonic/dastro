import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const originPathname = context.originPathname.replace(/\/$/, '');
  const pathname = context.url.pathname.replace(/\/$/, '');
  const isRewrite = originPathname !== pathname;

  if (!isRewrite) {
    const startTime = performance.now();

    let response;
    let error;

    try {
      response = await next();
    } catch (e) {
      error = e;
      throw e;
    } finally {
      const duration = Math.round(performance.now() - startTime);
      const netlifyContext = context.locals.netlify?.context;

      const clientIP = netlifyContext?.ip || context.clientAddress;
      const geo = netlifyContext?.geo
        ? `${netlifyContext?.geo.city}, ${netlifyContext?.geo.postalCode} ${netlifyContext?.geo.country?.name}`
        : 'unknown';

      const parts = [
        `[${context.request.method}]`,
        `${context.url.pathname}`,
        `${response?.status ?? 500}`,
        error && `error="${error.toString().slice(0, 500)}"`,
        `duration=${duration}ms`,
        `clientIP="${clientIP}"`,
        geo && `geo="${geo}"`,
        `userAgent="${context.request.headers.get('user-agent')}"`,
      ].filter(Boolean);

      console.log(parts.join(' '));
    }

    return response;
  }

  return next();
});
