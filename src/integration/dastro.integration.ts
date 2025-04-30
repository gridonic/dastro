import type { AstroIntegration } from 'astro';

export default function dastroIntegration(): AstroIntegration {
  return {
    name: 'dastro',
    hooks:{
      'astro:config:setup': ({ injectRoute }) => {
        injectRoute({
          pattern: '/api/debug/routes',
          entrypoint: 'dastro/api/debug/routes.ts'
        });

        injectRoute({
          pattern: '/api/cms/draft-mode/enable',
          entrypoint: 'dastro/api/cms/draft-mode/enable.ts'
        });

        injectRoute({
          pattern: '/api/cms/draft-mode/disable',
          entrypoint: 'dastro/api/cms/draft-mode/disable.ts'
        });

        injectRoute({
          pattern: '/api/cms/environment/switch',
          entrypoint: 'dastro/api/cms/environment/switch.ts'
        });

        injectRoute({
          pattern: '/api/cms/preview-links',
          entrypoint: 'dastro/api/cms/preview-links.ts'
        });

        injectRoute({
          pattern: '/sitemap.xml',
          entrypoint: 'dastro/sitemap.xml.ts'
        });
      }
    },
  };
}
