import type {
  FAQPage,
  Graph,
  Organization,
  Thing,
  WebPage,
  WebSite,
} from 'schema-dts';
import type { AstroContext } from '../astro.context.ts';
import type { Page } from '../core/page.ts';
import type { DastroTypes } from '../core/lib-types.ts';

export function useStructuredData<T extends DastroTypes>(
  context: AstroContext<'locals'>,
  page: Page<T>,
  options: {
    homeUrl: string;
    siteName: string;
    organization?: Exclude<Organization, string>;
    additionalPartsBuilder?: () => Thing[];
  },
) {
  const { homeUrl, siteName, organization, additionalPartsBuilder } = options;

  const { resolveRecordUrl } = context.locals.dastro.routing();

  const { config } = context.locals.dastro;
  const baseUrl = config.appBaseUrl.replace(/\/$/, '');

  const absoluteHomeUrl = `${baseUrl}${homeUrl.replace(/\/$/, '')}`;

  const pageUrl = resolveRecordUrl(page, context.locals.locale) ?? '';
  const absolutePageUrl = `${baseUrl}${pageUrl.replace(/\/$/, '')}`;

  const isHomePage = pageUrl === homeUrl;

  function homeId(name: string) {
    return `${absoluteHomeUrl}#${name}`;
  }

  function pageId(name: string) {
    return `${absolutePageUrl}#${name}`;
  }

  function organizationEntity(): Exclude<Organization, string> | undefined {
    return organization
      ? Object.assign(
          {},
          {
            '@id': pageId('organization'),
          },
          organization,
        )
      : undefined;
  }

  function entityWithId<T extends Thing>(
    obj: T,
    id: string,
  ): T & { '@id': string } {
    return Object.assign({}, obj, { '@id': id });
  }

  function additionalParts(): Thing[] {
    return (additionalPartsBuilder?.() ?? []).map((part) =>
      Object.assign({}, part, {
        isPartOf: { '@type': 'WebPage', '@id': pageId('webpage') },
      }),
    );
  }

  function webPageEntity(additionalProps?: {
    webPage?: Partial<WebPage>;
  }): WebPage {
    return {
      '@type': 'WebPage',
      '@id': pageId('webpage'),
      url: absolutePageUrl,
      name: page.title,
      isPartOf: {
        '@type': 'WebSite',
        '@id': homeId('website'),
      },
      ...additionalProps?.webPage,
    };
  }

  function faqEntity(
    items: { question: string; text: string }[],
    additionalProps?: {
      faq?: Partial<FAQPage>;
    },
  ): FAQPage {
    return {
      '@type': 'FAQPage',
      mainEntity: items.map(({ question, text }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text },
      })),
      ...additionalProps?.faq,
    };
  }

  function createGraph(things: Thing[]): Graph {
    return {
      '@context': 'https://schema.org',
      '@graph': [...things, ...additionalParts()],
    };
  }

  function createHomeGraph(additionalProps?: {
    webSite?: Partial<WebSite>;
    webPage?: Partial<WebPage>;
  }): Graph {
    const org = organizationEntity();

    return createGraph([
      {
        '@type': 'WebSite',
        '@id': homeId('website'),
        url: absoluteHomeUrl,
        name: siteName,
        ...additionalProps?.webSite,
      },
      webPageEntity(additionalProps),
      ...(org ? [org] : []),
    ]);
  }

  function createPageGraph(additionalProps?: {
    webPage?: Partial<WebPage>;
  }): Graph {
    return createGraph([webPageEntity(additionalProps)]);
  }

  return {
    pageUrl,
    homeUrl,
    isHomePage,
    pageId,
    homeId,
    entityWithId,
    webPageEntity,
    faqEntity,
    organizationEntity,
    createHomeGraph,
    createPageGraph,
  };
}
