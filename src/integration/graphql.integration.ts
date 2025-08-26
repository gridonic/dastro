import type { AstroIntegration } from 'astro';
import type { Types } from '@graphql-codegen/plugin-helpers';
import 'dotenv/config'; // Need to import env variables for graphql cli
import {
  generate,
  loadCodegenConfig,
} from '@graphql-codegen/cli';
import chalk from "chalk";

export default function graphqlIntegration(): AstroIntegration {
  return {
    name: 'graphql',
    hooks: {
      'astro:config:setup': async ({ config, addWatchFile, logger }) => {
        // When this integration changes, the server must be reloaded
        addWatchFile(
          new URL('./integration/graphql.integration.ts', config.root),
        );

        // When graphql config changes, the server must be reloaded
        addWatchFile(new URL('./graphql.config.yml', config.root));

        const generatorConfigs = await loadGraphqlSchemaConfigs();

        for (const [name, config] of Object.entries(generatorConfigs)) {
          logger.info(`Generate Typescript types from graphql for ${chalk.bold.green(name)}`);

          try {
            await generateAndWriteTypesFile(config);
          } catch {
            logger.error(
              'Generating graphql types failed! Error is not printed here as he should be logged by generator. If not, find this error in the code and print the error manually.',
            );
            // ignore error, gql errors will be logged by Generator anyway
          }

          logger.info(`${chalk.bold.green(name)} type generation complete`);
        }

        async function loadGraphqlSchemaConfigs(): Promise<Record<string, Types.Config>> {
          // hacky, need to extend the type of the config, as it does not contain projects
          const { config } = await loadCodegenConfig({ configFilePath: 'graphql.config.yml' });
          if ('projects' in config) {
            return config.projects as Record<string, Types.Config>;
          }

          return { default: config };
        }

        async function generateAndWriteTypesFile(
          generatorConfig: Types.Config,
        ) {
          return generate(generatorConfig, true);
        }
      },
      'astro:server:setup': async ({ server }) => {
        server.watcher.on('all', (_, path) => {
          // When a graphql file is changed, reload the server so the types will be regenerated
          if (path.endsWith('.gql')) {
            server.restart();
          }
        });
      },
    },
  };
}
