import type { APIRoute } from 'astro';
import {
  checkSecretApiTokenCorrectness,
  invalidRequestResponse,
  json,
} from '../utils.ts';
import { buildClient } from '@datocms/cma-client-node';
import type { Environment } from '@datocms/cma-client/dist/types/generated/ApiTypes';

export const GET: APIRoute = async (context) => {
  if (
    !checkSecretApiTokenCorrectness(
      context.locals.dastro.config,
      context.url.searchParams.get('token'),
    )
  ) {
    return invalidRequestResponse('Invalid token', 401);
  }

  const { config } = context.locals.dastro;

  let datoCmsEnvironments: Environment[] = [];

  try {
    const datocmsClient = buildClient({
      apiToken: config.datocms.token,
    });

    datoCmsEnvironments = await datocmsClient.environments.list();
  } catch (error) {
    console.warn('Error listing environments', error);
  }

  return json({
    config: {
      environment: config.environment,
      appBaseUrl: config.appBaseUrl,
      dev: config.dev,
      datocms: {
        environment: config.datocms.environment,
        allowEnvironmentSwitch: config.datocms.allowEnvironmentSwitch,
      },
      i18n: {
        defaultLocale: config.i18n.defaultLocale,
        locales: config.i18n.locales,
      },
      pageDefinitions: Object.values(config.pageDefinitions).map((c) => ({
        type: c.type,
        apiKey: c.apiKey,
        paths: c.paths,
      })),
      components: Object.keys(config.moduleComponents),
    },
    datocms: {
      environments: datoCmsEnvironments.map((e) => ({
        id: e.id,
        primary: e.meta.primary,
        createdAt: e.meta.created_at,
        updatedAt: e.meta.last_data_change_at,
      })),
    },
  });
};
