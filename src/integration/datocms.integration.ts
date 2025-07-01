import type { AstroIntegration } from 'astro';
import 'dotenv/config'; // Need to import env variables for graphql cli
import {
  generate,
  loadCodegenConfig,
} from '@graphql-codegen/cli';

export default function datoCmsIntegration(): AstroIntegration {
  return {
    name: 'datocms',
    hooks: {
      'astro:config:setup': async ({ config, addWatchFile, logger }) => {
        // When this integration changes, server must be reloaded
        addWatchFile(
          new URL('./integration/datocms.integration.ts', config.root),
        );

        // When graphql config changes, server must be reloaded
        addWatchFile(new URL('./graphql.config.yml', config.root));

        const generatorConfig = (
          await loadCodegenConfig({ configFilePath: 'graphql.config.yml' })
        ).config;

        logger.info('Generate Typescript types from graphql');

        try {
          await generateAndWriteTypesFile();
        } catch {
          logger.error(
            'Generating graphql types failed! Error is not printed here as he should be logged by generator. If not, find this error in the code and print the error manually.',
          );
          // ignore error, gql errors will be logged by Generator anyway
        }

        logger.info('datocms.types.ts generation complete\n');

        async function generateAndWriteTypesFile() {
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
