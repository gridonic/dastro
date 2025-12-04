import pgk from '../../package.json';
import type { AstroIntegration, AstroUserConfig } from 'astro';
import netlify from '@astrojs/netlify';
import node from '@astrojs/node';
import { envField } from 'astro/config';
import { graphqlIntegration } from 'dastro';
import chalk from 'chalk';
import type { ViteDevServer, Plugin } from 'vite';
import { lstatSync } from 'fs';

interface Options {
  htmlStreamingEnabled?: boolean;
  requestLogging?: {
    disabled?: boolean;
  };
  injectedRoutes?: {
    // If we want to define the endpoint in our project, we must mark that we want to overwrite it.
    // Marked routes will not be injected, so we can define it in our project.
    overwrite?: {
      debugRoutes?: boolean;
      debugSystem?: boolean;
      draftModeEnable?: boolean;
      draftModeDisable?: boolean;
      environmentSwitch?: boolean;
      previewLinks?: boolean;
      sitemap?: boolean;
      robots?: boolean;
    };
  };
}

export default function dastroIntegration(options?: Options): AstroIntegration {
  return {
    name: 'dastro',
    hooks: {
      'astro:config:setup': ({
        injectRoute,
        updateConfig,
        addMiddleware,
        logger,
      }) => {
        logger.info(
          chalk.bgGreen(` Using dastro ${chalk.bold(`v${pgk.version}`)} `),
        );

        const stats = lstatSync('node_modules/dastro');
        if (stats.isSymbolicLink()) {
          logger.info(
            chalk.yellow(
              '⚠️ Warning: You are using a local development version of dastro (symlinked)',
            ),
          );
          logger.info(
            chalk.yellow(
              "   Run 'dastro unlink' to switch back to the published version",
            ),
          );
        }

        updateConfig({
          output: 'server',

          site: process.env.APP_BASE_URL,

          integrations: [graphqlIntegration()],

          prefetch: true,
          experimental: {
            // TODO: temporarily disable client prerendering for local development due to chrome dev tools issues on navigation
            clientPrerender: process.env.ENVIRONMENT !== 'local',
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
              ENVIRONMENT: envField.string({
                access: 'public',
                context: 'client',
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
              DEVELOPMENT_PREVENT_SEARCH_INDEXING: envField.boolean({
                access: 'public',
                context: 'server',
                default: false,
              }),
            },
          },

          vite: {
            plugins: [watchDastroInNodeModulesVitePlugin()],
            server: {
              https:
                process.env.LOCAL_DEVELOPMENT_SSL_DISABLED !== 'true'
                  ? {
                      cert:
                        process.env.SSL_GRIDONIC_TEST_PEM_CERT_PATH ||
                        process.env.LOCAL_DEVELOPMENT_PATH_CERT,
                      key:
                        process.env.SSL_GRIDONIC_TEST_PEM_KEY_PATH ||
                        process.env.LOCAL_DEVELOPMENT_PATH_CERT_KEY,
                    }
                  : undefined,
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
        });

        const { overwrite } = options?.injectedRoutes ?? {};
        if (!overwrite?.debugRoutes) {
          injectRoute({
            pattern: '/api/debug/routes',
            entrypoint: 'dastro/routes/debug/routes.ts',
          });
        }

        if (!overwrite?.debugSystem) {
          injectRoute({
            pattern: '/api/debug/system',
            entrypoint: 'dastro/routes/debug/system.ts',
          });
        }

        if (!overwrite?.draftModeEnable) {
          injectRoute({
            pattern: '/api/cms/draft-mode/enable',
            entrypoint: 'dastro/routes/cms/draft-mode/enable.ts',
          });
        }

        if (!overwrite?.draftModeDisable) {
          injectRoute({
            pattern: '/api/cms/draft-mode/disable',
            entrypoint: 'dastro/routes/cms/draft-mode/disable.ts',
          });
        }

        if (!overwrite?.environmentSwitch) {
          injectRoute({
            pattern: '/api/cms/environment/switch',
            entrypoint: 'dastro/routes/cms/environment/switch.ts',
          });
        }

        if (!overwrite?.previewLinks) {
          injectRoute({
            pattern: '/api/cms/preview-links',
            entrypoint: 'dastro/routes/cms/preview-links.ts',
          });
        }

        if (!overwrite?.sitemap) {
          injectRoute({
            pattern: '/sitemap.xml',
            entrypoint: 'dastro/routes/sitemap.xml.ts',
          });
        }

        if (!overwrite?.robots) {
          injectRoute({
            pattern: '/robots.txt',
            entrypoint: 'dastro/routes/robots.txt.ts',
          });
        }

        const requestLoggingEnabled =
          options?.requestLogging?.disabled !== true;
        if (requestLoggingEnabled) {
          addMiddleware({
            entrypoint: 'dastro/middleware/request-logger.middleware.ts',
            order: 'pre',
          });
        }

        const htmlStreamingEnabled = options?.htmlStreamingEnabled ?? false;
        if (!htmlStreamingEnabled) {
          logger.info(
            `Html Streaming is disabled by using a custom middleware. Use ${chalk.italic('htmlStreamingEnabled')} to enable it.`,
          );

          addMiddleware({
            entrypoint:
              'dastro/middleware/html-streaming-prevention.middleware.ts',
            order: 'post',
          });
        }
      },
      'astro:server:setup': async ({ server }) => {
        server.watcher.on('all', (_, path) => {
          if (path.includes('node_modules/dastro')) {
            server.restart();
          }
        });
      },
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

function watchDastroInNodeModulesVitePlugin(): Plugin {
  return {
    name: 'watch-dastro-in-node-modules',
    configureServer(server: ViteDevServer) {
      // makes sure that when developing locally, changes in dastro in node_modules trigger dev server update
      server.watcher.options = {
        ...server.watcher.options,
        ignored: [
          ...(server.watcher.options.ignored as string[]).filter(
            (pattern) => pattern !== '**/node_modules/**',
          ),
          /node_modules\/(?!dastro).*/,
        ],
      };
    },
  };
}
