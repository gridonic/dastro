import type { AstroIntegration } from 'astro';

export default function dastroIntegration(): AstroIntegration {
  return {
    name: 'dastro',
    hooks:{
      'astro:config:setup': ({ injectRoute }) => {
        injectRoute({
          pattern: '/api/debug/routes',
          entrypoint: 'dastro/routes/debug/routes.ts'
        });

        injectRoute({
          pattern: '/api/cms/draft-mode/enable',
          entrypoint: 'dastro/routes/cms/draft-mode/enable.ts'
        });

        injectRoute({
          pattern: '/api/cms/draft-mode/disable',
          entrypoint: 'dastro/routes/cms/draft-mode/disable.ts'
        });

        injectRoute({
          pattern: '/api/cms/environment/switch',
          entrypoint: 'dastro/routes/cms/environment/switch.ts'
        });

        injectRoute({
          pattern: '/api/cms/preview-links',
          entrypoint: 'dastro/routes/cms/preview-links.ts'
        });

        injectRoute({
          pattern: '/sitemap.xml',
          entrypoint: 'dastro/routes/sitemap.xml.ts'
        });

        injectRoute({
          pattern: '/robots.txt',
          entrypoint: 'dastro/routes/robots.txt.ts'
        });
      }
    },
  };
}
