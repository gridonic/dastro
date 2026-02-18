import merge from 'deepmerge';
import type { AstroContext, DastroConfig, DastroTypes } from '../../src';
import { buildDastroContext } from '../../src';
import {
  type ContainerRenderOptions,
  experimental_AstroContainer as AstroContainer,
} from 'astro/container';
import type { DeepPartial } from '../../src/util/type.util.ts';

export const defaultTestLocale: DastroTypes['SiteLocale'] = 'de';

export function dastroTest(
  opts: {
    config?: DeepPartial<DastroConfig<DastroTypes>>;
    locale?: string;
  } = {},
) {
  const { locale = defaultTestLocale, config } = opts ?? {};

  const defaultConfig: DastroConfig<DastroTypes> = {
    environment: 'test',
    appBaseUrl: 'https://testing.dastro.com',
    datocms: {
      allowEnvironmentSwitch: false,
      environment: 'main',
      token: 'datocms-token',
      baseEditingUrl: 'https://testing.dastro.com',
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
      locales: ['de', 'fr_CH', 'en'],
      defaultLocale: defaultTestLocale,
      routingStrategy: 'prefix-except-default',
      messages: {
        de: { locales: {} },
        fr_CH: { locales: {} },
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
          fr_CH: '',
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
      ArticleRecord: {
        type: 'ArticleRecord',
        apiKey: 'article',
        allRecordsQuery: undefined as any, // TODO
        paths: {
          de: 'themen',
          fr_CH: 'sujets',
          en: 'topics',
        },
        component: 'ArticlePage' as any,
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

  const dastroContext = buildDastroContext(
    dastroConfig as DastroConfig<DastroTypes>,
  );

  const astroContext: AstroContext<'locals' | 'cookies' | 'response'> = {
    response: {} as any, // TODO: need a mock or something
    cookies: {} as any, // TODO: need a mock or something
    locals: {
      locale: locale ?? dastroConfig.i18n.defaultLocale,
      globalStore: {},
      dastro: dastroContext,
      page: {},
      netlify: { context: null },
      draftMode: { executedQueries: [] },
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
  const baseTest = dastroTest(opts);
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
