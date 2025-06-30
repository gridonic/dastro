import type { AstroIntegration } from 'astro';

interface Options {
  injectedRoutes?: {
    // If we want to define the endpoint in our project, we must mark that we want to overwrite it.
    // Marked routes will not be injected, so we can define it in our project.
    overwrite?: {
      debugRoutes?: boolean;
      draftModeEnable?: boolean;
      draftModeDisable?: boolean;
      environmentSwitch?: boolean;
      previewLinks?: boolean;
      sitemap?: boolean;
      robots?: boolean;
    }
  }
}

export default function dastroIntegration(options?: Options): AstroIntegration {
  return {
    name: 'dastro',
    hooks:{
      'astro:config:setup': ({ injectRoute, updateConfig }) => {
        const { overwrite } = options?.injectedRoutes ?? {};
        if (!overwrite?.debugRoutes) {
          injectRoute({
            pattern: '/api/debug/routes',
            entrypoint: 'dastro/routes/debug/routes.ts'
          });
        }

        if (!overwrite?.draftModeEnable) {
          injectRoute({
            pattern: '/api/cms/draft-mode/enable',
            entrypoint: 'dastro/routes/cms/draft-mode/enable.ts'
          });
        }

        if (!overwrite?.draftModeDisable) {
          injectRoute({
            pattern: '/api/cms/draft-mode/disable',
            entrypoint: 'dastro/routes/cms/draft-mode/disable.ts'
          });
        }

        if (!overwrite?.environmentSwitch) {
          injectRoute({
            pattern: '/api/cms/environment/switch',
            entrypoint: 'dastro/routes/cms/environment/switch.ts'
          });
        }

        if (!overwrite?.previewLinks) {
          injectRoute({
            pattern: '/api/cms/preview-links',
            entrypoint: 'dastro/routes/cms/preview-links.ts'
          });
        }

        if (!overwrite?.sitemap) {
          injectRoute({
            pattern: '/sitemap.xml',
            entrypoint: 'dastro/routes/sitemap.xml.ts'
          });
        }

        if (!overwrite?.robots) {
          injectRoute({
            pattern: '/robots.txt',
            entrypoint: 'dastro/routes/robots.txt.ts'
          });
        }

        // Note: Changing the scoped style strategy to "attribute" will break dastro components where classes can be passed! Use 'class' or 'when'
        updateConfig({
          scopedStyleStrategy: 'class'
        });
      }
    },
  };
}
