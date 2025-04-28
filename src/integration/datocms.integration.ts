import type { AstroIntegration } from 'astro';
import fs from 'node:fs';
import 'dotenv/config'; // Need to import env variables for graphql cli
import {
  CodegenContext,
  generate,
  loadCodegenConfig,
} from '@graphql-codegen/cli';
import type { Types } from '@graphql-codegen/plugin-helpers';
// @ts-ignore
import tsConfig from '../../../../tsconfig.json';

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

        const useVerbatimModuleSyntax =
          tsConfig.compilerOptions.verbatimModuleSyntax;

        const generatorConfig = (
          await loadCodegenConfig({ configFilePath: 'graphql.config.yml' })
        ).config;

        logger.info('Generate Typescript types from graphql');

        try {
          switch (useVerbatimModuleSyntax) {
            case false:
              // Variant 1: All automatic, but does not use "type" import, which fails with verbatimModuleSyntax
              logger.info(
                'verbatimModuleSyntax is false in tsconfig, writing file as it was generated',
              );
              await generateAndWriteTypesFile();
              break;
            case true:
              // Variant 2: Write file ourselves and adjust type imports manually
              logger.info(
                'verbatimModuleSyntax is true in tsconfig, fixing imports before writing file',
              );
              await generateAndWriteTypesFileWithVerbatimModuleSyntax();
              break;
          }
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

        async function generateAndWriteTypesFileWithVerbatimModuleSyntax() {
          const generatedFiles = (await generate(
            new CodegenContext({ config: generatorConfig }),
            true,
          )) as Types.FileOutput[];

          return Promise.all(
            generatedFiles.map(async (generatedFile) => {
              await fs.promises.writeFile(
                generatedFile.filename,
                generatedFile.content.replace(/import {/g, 'import type {'), // replace "import { SomeType }" with "import type { SomeType }"
                'utf-8',
              );
            }),
          );
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
