import type { AstroIntegration, AstroIntegrationLogger } from 'astro';
import type { Types } from '@graphql-codegen/plugin-helpers';
import 'dotenv/config'; // Need to import env variables for graphql cli
import { generate, loadCodegenConfig } from '@graphql-codegen/cli';
import chalk from 'chalk';

const REGEN_DEBOUNCE_MS = 200;

export default function graphqlIntegration(): AstroIntegration {
  let generatorConfigs: Record<string, Types.Config> = {};
  let debounceTimer: NodeJS.Timeout | undefined;

  async function loadGraphqlSchemaConfigs(): Promise<
    Record<string, Types.Config>
  > {
    // hacky, need to extend the type of the config, as it does not contain projects
    const { config } = await loadCodegenConfig({
      configFilePath: 'graphql.config.yml',
    });
    if ('projects' in config) {
      return config.projects as Record<string, Types.Config>;
    }

    return { default: config };
  }

  async function generateAndWriteTypesFile(generatorConfig: Types.Config) {
    return generate({ ...generatorConfig, silent: true }, true);
  }

  async function regenerateAll(
    logger: AstroIntegrationLogger,
    onError: (e: any) => void,
  ) {
    for (const [name, config] of Object.entries(generatorConfigs)) {
      logger.info(
        `Generate Typescript types from graphql for ${chalk.bold.green(name)}`,
      );

      try {
        await generateAndWriteTypesFile(config);
      } catch (e: any) {
        onError(e);
      }

      logger.info(`${chalk.bold.green(name)} type generation complete`);
    }
  }

  return {
    name: 'graphql',
    hooks: {
      'astro:config:setup': async ({
        config,
        addWatchFile,
        logger,
        command,
      }) => {
        // When this integration changes, the server must be reloaded
        addWatchFile(
          new URL('./integration/graphql.integration.ts', config.root),
        );

        // When graphql config changes, the server must be reloaded so projects/plugins/outputs are re-evaluated
        addWatchFile(new URL('./graphql.config.yml', config.root));

        generatorConfigs = await loadGraphqlSchemaConfigs();

        await regenerateAll(logger, (e) => {
          if (command === 'sync') {
            throw e;
          } else {
            logger.error(e);
          }
        });
      },
      'astro:server:setup': ({ server, logger }) => {
        server.watcher.on('all', (event, path) => {
          if (!path.endsWith('.gql')) return;
          if (event !== 'change' && event !== 'add' && event !== 'unlink') {
            return;
          }

          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            regenerateAll(logger, (e) => logger.error(e));
          }, REGEN_DEBOUNCE_MS);
        });
      },
    },
  };
}
