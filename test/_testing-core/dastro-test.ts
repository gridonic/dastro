import merge from 'deepmerge';
import type { AstroContext, DastroConfig, DastroTypes } from '../../src';
import { buildDastroContext } from '../../src';
import {
  type ContainerRenderOptions,
  experimental_AstroContainer as AstroContainer,
} from 'astro/container';

export const defaultTestLocale = 'de';

export function dastroTest(
  opts: { config?: Partial<DastroConfig<DastroTypes>>; locale?: string } = {},
) {
  const { locale = defaultTestLocale, config } = opts ?? {};

  const defaultConfig: DastroConfig<DastroTypes> = {
    environment: 'test',
    appBaseUrl: 'https://testing.dastro.com',
    datocms: {
      allowEnvironmentSwitch: false,
      environment: 'main',
      token: 'datocms-token',
    },
    dev: {
      debugViewEnabled: false,
      preventSearchIndexing: false,
    },
    api: {
      secretApiToken: 'gridonic-dato',
      signedCookieJwtSecret: 'jwt-cookie-secret',
    },
    i18n: {
      locales: ['de', 'en'],
      defaultLocale: defaultTestLocale,
      messages: {
        de: { locales: {} },
        en: { locales: {} },
      },
    },
    pageDefinitions: {
      PageRecord: {
        type: 'PageRecord',
        apiKey: 'page',
        allRecordsQuery: undefined as any, // TODO
        paths: {
          de: '',
          fr: '',
          en: '',
        },
        component: 'DefaultPage' as any,
        async load(
          _: string | undefined,
          _locale: any,
          _context: AstroContext<'locals' | 'cookies'>,
        ) {
          // TODO: return some page test data here
          return null;
        },
      },
    },
    moduleComponents: {},
  };

  const dastroConfig = merge(defaultConfig, config || {});

  const dastroContext = buildDastroContext(dastroConfig);

  const astroContext: AstroContext<'locals' | 'cookies' | 'response'> = {
    response: {} as any, // TODO: need a mock or something
    cookies: {} as any, // TODO: need a mock or something
    locals: {
      locale: locale ?? dastroConfig.i18n.defaultLocale,
      globalStore: {},
      dastro: dastroContext,
      page: {},
    },
  };

  return {
    astroContext,
    ...dastroContext,
    defaultTestLocale,
  };
}

export async function dastroContainerTest(
  opts: { config?: Partial<DastroConfig<DastroTypes>>; locale?: string } = {},
) {
  const baseTest = dastroTest();
  const container = await AstroContainer.create();

  async function renderToString(
    component: Parameters<AstroContainer['renderToString']>[0],
    options?: ContainerRenderOptions,
  ) {
    return container.renderToString(
      component,
      merge(
        {
          locals: baseTest.astroContext.locals,
        } as ContainerRenderOptions,
        options ?? {},
      ),
    );
  }

  return {
    ...baseTest,
    container,
    renderToString,
  };
}
