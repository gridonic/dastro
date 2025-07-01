import pgk from '../../package.json';
import type { AstroIntegration, AstroUserConfig } from 'astro';
import netlify from '@astrojs/netlify';
import node from '@astrojs/node';
import { envField } from 'astro/config';
import { datoCmsIntegration } from 'dastro';
import chalk from "chalk";

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
      'astro:config:setup': ({ injectRoute, updateConfig, logger }) => {
        logger.info(chalk.bgGreen(` Using dastro ${chalk.bold(`v${pgk.version}`)} `));

        updateConfig({
          output: 'server',

          site: process.env.APP_BASE_URL,

          integrations: [
            datoCmsIntegration(),
          ],

          prefetch: true,
          experimental: {
            clientPrerender: true,
          },

          // Note: Changing the scoped style strategy to "attribute" will break dastro components where classes can be passed! Use 'class' or 'when'
          scopedStyleStrategy: 'class',

          env: {
            schema: {
              APP_BASE_URL: envField.string({
                access: 'public',
                context: 'server',
                url: true,
              }),
              ENVIRONMENT: envField.enum({
                access: 'public',
                context: 'client',
                values: ['local', 'preview', 'production'],
              }),
              NODE_VERSION: envField.string({
                access: 'public',
                context: 'server',
                default: '20',
              }),
              DATO_CMS_GRAPHQL_HOST: envField.string({
                access: 'public',
                context: 'server',
                url: true,
              }),
              DATO_CMS_TOKEN: envField.string({
                access: 'secret',
                context: 'server',
              }),
              DATO_CMS_ENVIRONMENT: envField.string({
                access: 'public',
                context: 'server',
              }),
              SECRET_API_TOKEN: envField.string({
                access: 'secret',
                context: 'server',
              }),
              SIGNED_COOKIE_JWT_SECRET: envField.string({
                access: 'secret',
                context: 'server',
              }),
              ALLOW_DATO_ENVIRONMENT_SWITCH: envField.boolean({
                access: 'secret',
                context: 'server',
                default: false,
              }),
              DEVELOPMENT_DEBUG_VIEW_ENABLED: envField.boolean({
                access: 'public',
                context: 'server',
                default: false,
              }),
              DEVELOPMENT_CUSTOMER_ONBOARDING_ENABLED: envField.boolean({
                access: 'public',
                context: 'server',
                default: false,
              }),
              DEVELOPMENT_PREVENT_SEARCH_INDEXING: envField.boolean({
                access: 'public',
                context: 'server',
                default: false,
              }),
            }
          },

          vite: {
            server: {
              https: {
                cert:
                  process.env.SSL_GRIDONIC_TEST_PEM_CERT_PATH ||
                  process.env.LOCAL_DEVELOPMENT_PATH_CERT,
                key:
                  process.env.SSL_GRIDONIC_TEST_PEM_KEY_PATH ||
                  process.env.LOCAL_DEVELOPMENT_PATH_CERT_KEY,
              },
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
              },
            },
            css: {
              preprocessorOptions: {
                scss: {
                  api: 'modern-compiler',
                  additionalData: '@use "src/sass/globals.scss" as *;',
                  loadPaths: ['.'],
                },
              },
            },
          },
        })

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
      }
    },
  };
}

export function dastroAdapterConfig(): AstroUserConfig['adapter'] {
  const adapterToUse: 'netlify' | 'node' =
    process.env.NETLIFY === 'true' ? 'netlify' : 'node';

  console.debug('[Config]', `Adapter: ${adapterToUse}`);

  return adapterToUse === 'netlify'
    ? netlify()
    : node({
      mode: 'standalone',
    });
}
