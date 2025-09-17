import type { Page, TranslatedSlugLocale } from '../../../src/core/page';
import type { DastroTypes } from '../../../src';

export interface TestPageRoute<Types extends DastroTypes = DastroTypes> {
  url: string;
  locale: string;
  record: Page<Types> & {
    _updatedAt?: string | null;
    seo?: {
      noIndex?: boolean | null;
    } | null;
    parent?: {
      _allTranslatedSlugLocales?: TranslatedSlugLocale<Types>[] | null;
    } | null;
  };
}

// TODO: unused yet, do we really need them?
export const testPageRoutes: TestPageRoute[] = [
  {
    url: '/',
    locale: 'de',
    record: {
      id: 'KuJIziTLS6CX9VtI5s5_mw',
      _updatedAt: '2025-04-23T14:43:40+02:00',
      seo: null,
      __typename: 'PageRecord',
      title: 'Home',
      _allTranslatedSlugLocales: [
        {
          locale: 'de',
          value: 'home',
        },
        {
          locale: 'en',
          value: 'home',
        },
      ],
      _seoMetaTags: [
        {
          attributes: null,
          content: 'Home – Boilerplate',
          tag: 'title',
        },
        {
          attributes: {
            property: 'og:title',
            content: 'Home',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:title',
            content: 'Home',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:locale',
            content: 'de',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:type',
            content: 'article',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:site_name',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:modified_time',
            content: '2025-04-23T12:43:40Z',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:publisher',
            content: '',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:card',
            content: 'summary',
          },
          content: null,
          tag: 'meta',
        },
      ],
      parent: null,
    },
  },
  {
    url: '/404',
    locale: 'de',
    record: {
      _updatedAt: '2025-07-17T16:15:09+02:00',
      _seoMetaTags: [
        {
          attributes: null,
          content: '404 Test – Boilerplate',
          tag: 'title',
        },
        {
          attributes: {
            property: 'og:title',
            content: '404 Test',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:title',
            content: '404 Test',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:locale',
            content: 'de',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:type',
            content: 'article',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:site_name',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:modified_time',
            content: '2025-07-17T14:15:09Z',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:publisher',
            content: '',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:card',
            content: 'summary',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'robots',
            content: 'noindex',
          },
          content: null,
          tag: 'meta',
        },
      ],
      seo: {
        noIndex: true,
      },
      __typename: 'PageRecord',
      id: 'UX53BgLrRkepWPB7i-3Xcw',
      title: '404 Test',
      _allTranslatedSlugLocales: [
        {
          locale: 'de',
          value: '404',
        },
        {
          locale: 'en',
          value: '404',
        },
      ],
      parent: null,
    },
  },
  {
    url: '/angebot',
    locale: 'de',
    record: {
      _updatedAt: '2025-08-25T15:09:21+02:00',
      _seoMetaTags: [
        {
          attributes: null,
          content: 'Angebot – Boilerplate',
          tag: 'title',
        },
        {
          attributes: {
            property: 'og:title',
            content: 'Angebot',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:title',
            content: 'Angebot',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:locale',
            content: 'de',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:type',
            content: 'article',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:site_name',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:modified_time',
            content: '2025-08-25T13:09:21Z',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:publisher',
            content: '',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:card',
            content: 'summary',
          },
          content: null,
          tag: 'meta',
        },
      ],
      seo: null,
      __typename: 'PageRecord',
      id: 'SaUHV1-gQx-MBWNadQEcgQ',
      title: 'Angebot',
      _allTranslatedSlugLocales: [
        {
          locale: 'de',
          value: 'angebot',
        },
        {
          locale: 'en',
          value: 'offer',
        },
      ],
      parent: null,
    },
  },
  {
    url: '/impressum',
    locale: 'de',
    record: {
      _updatedAt: '2024-12-18T15:48:47+01:00',
      _seoMetaTags: [
        {
          attributes: null,
          content: 'Impressum – Boilerplate',
          tag: 'title',
        },
        {
          attributes: {
            property: 'og:title',
            content: 'Impressum',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:title',
            content: 'Impressum',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:locale',
            content: 'de',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:type',
            content: 'article',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:site_name',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:modified_time',
            content: '2024-12-18T14:48:47Z',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:publisher',
            content: '',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:card',
            content: 'summary',
          },
          content: null,
          tag: 'meta',
        },
      ],
      seo: null,
      __typename: 'PageRecord',
      id: 'Z8YVsNUGQdCEXcNKLQj5UA',
      title: 'Impressum',
      _allTranslatedSlugLocales: [
        {
          locale: 'de',
          value: 'impressum',
        },
        {
          locale: 'en',
          value: 'imprint',
        },
      ],
      parent: null,
    },
  },
  {
    url: '/kontakt',
    locale: 'de',
    record: {
      _updatedAt: '2025-01-21T17:50:54+01:00',
      _seoMetaTags: [
        {
          attributes: null,
          content: 'Kontakt – Boilerplate',
          tag: 'title',
        },
        {
          attributes: {
            property: 'og:title',
            content: 'Kontakt',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:title',
            content: 'Kontakt',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:locale',
            content: 'de',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:type',
            content: 'article',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:site_name',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:modified_time',
            content: '2025-01-21T16:50:54Z',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:publisher',
            content: '',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:card',
            content: 'summary',
          },
          content: null,
          tag: 'meta',
        },
      ],
      seo: null,
      __typename: 'PageRecord',
      id: 'Q7QhZFhZS4GD4L61OisZGQ',
      title: 'Kontakt',
      _allTranslatedSlugLocales: [
        {
          locale: 'de',
          value: 'kontakt',
        },
        {
          locale: 'en',
          value: 'contact',
        },
      ],
      parent: null,
    },
  },
  {
    url: '/module-overview',
    locale: 'de',
    record: {
      _updatedAt: '2025-08-18T17:06:13+02:00',
      _seoMetaTags: [
        {
          attributes: null,
          content: 'Module Overview – Boilerplate',
          tag: 'title',
        },
        {
          attributes: {
            property: 'og:title',
            content: 'Module Overview',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:title',
            content: 'Module Overview',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:locale',
            content: 'de',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:type',
            content: 'article',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:site_name',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:modified_time',
            content: '2025-08-18T15:06:13Z',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:publisher',
            content: '',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:card',
            content: 'summary',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'robots',
            content: 'noindex',
          },
          content: null,
          tag: 'meta',
        },
      ],
      seo: {
        noIndex: true,
      },
      __typename: 'PageRecord',
      id: 'MOM32HwTRqyusb5Uxk4xTw',
      title: 'Module Overview',
      _allTranslatedSlugLocales: [
        {
          locale: 'de',
          value: 'module-overview',
        },
        {
          locale: 'en',
          value: 'module-overview',
        },
      ],
      parent: null,
    },
  },
  {
    url: '/testseite',
    locale: 'de',
    record: {
      _updatedAt: '2025-08-25T15:09:33+02:00',
      _seoMetaTags: [
        {
          attributes: null,
          content: 'Testseite – Boilerplate',
          tag: 'title',
        },
        {
          attributes: {
            property: 'og:title',
            content: 'Testseite',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:title',
            content: 'Testseite',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:locale',
            content: 'de',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:type',
            content: 'article',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:site_name',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:modified_time',
            content: '2025-08-25T13:09:33Z',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:publisher',
            content: '',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:card',
            content: 'summary',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'robots',
            content: 'noindex',
          },
          content: null,
          tag: 'meta',
        },
      ],
      seo: {
        noIndex: true,
      },
      __typename: 'PageRecord',
      id: 'a1Nf4VAYSW2ifyycKOYngg',
      title: 'Testseite',
      _allTranslatedSlugLocales: [
        {
          locale: 'de',
          value: 'testseite',
        },
      ],
      parent: null,
    },
  },
  {
    url: '/themen/augenblicke-zwischen-reisen-und-leben',
    locale: 'de',
    record: {
      _updatedAt: '2025-01-16T16:20:09+01:00',
      _seoMetaTags: [
        {
          attributes: null,
          content: 'Augenblicke zwischen Reisen und Leben – Boilerplate',
          tag: 'title',
        },
        {
          attributes: {
            property: 'og:title',
            content: 'Augenblicke zwischen Reisen und Leben',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:title',
            content: 'Augenblicke zwischen Reisen und Leben',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:image',
            content:
              'https://www.datocms-assets.com/119249/1736263259-teaser-article.png?auto=format&fit=max&w=1200',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:image:width',
            content: '1200',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:image:height',
            content: '1200',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:image',
            content:
              'https://www.datocms-assets.com/119249/1736263259-teaser-article.png?auto=format&fit=max&w=1200',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:locale',
            content: 'de',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:type',
            content: 'article',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:site_name',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:modified_time',
            content: '2025-01-16T15:20:09Z',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:publisher',
            content: '',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:card',
            content: 'summary',
          },
          content: null,
          tag: 'meta',
        },
      ],
      seo: null,
      __typename: 'ArticleRecord',
      id: 'EBnNwDEBSbu72aDJvin7SQ',
      title: 'Augenblicke zwischen Reisen und Leben',
      _allTranslatedSlugLocales: [
        {
          locale: 'de',
          value: 'augenblicke-zwischen-reisen-und-leben',
        },
        {
          locale: 'en',
          value: 'moments-in-between-travel-and-living',
        },
      ],
    },
  },
  {
    url: '/themen/die-ruhige-silhouette-eines-tempels',
    locale: 'de',
    record: {
      _updatedAt: '2025-01-16T16:20:33+01:00',
      _seoMetaTags: [
        {
          attributes: null,
          content: 'Die ruhige Silhouette eines Tempels – Boilerplate',
          tag: 'title',
        },
        {
          attributes: {
            property: 'og:title',
            content: 'Die ruhige Silhouette eines Tempels',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:title',
            content: 'Die ruhige Silhouette eines Tempels',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:image',
            content:
              'https://www.datocms-assets.com/119249/1736263503-teaser-article-2.png?auto=format&fit=max&w=1200',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:image:width',
            content: '1200',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:image:height',
            content: '1200',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:image',
            content:
              'https://www.datocms-assets.com/119249/1736263503-teaser-article-2.png?auto=format&fit=max&w=1200',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:locale',
            content: 'de',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:type',
            content: 'article',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:site_name',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:modified_time',
            content: '2025-01-16T15:20:33Z',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:publisher',
            content: '',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:card',
            content: 'summary',
          },
          content: null,
          tag: 'meta',
        },
      ],
      seo: null,
      __typename: 'ArticleRecord',
      id: 'YwwDXESeRWiyOVcJTXpNnQ',
      title: 'Die ruhige Silhouette eines Tempels',
      _allTranslatedSlugLocales: [
        {
          locale: 'de',
          value: 'die-ruhige-silhouette-eines-tempels',
        },
        {
          locale: 'en',
          value: 'a-temples-seren-silhouette',
        },
      ],
    },
  },
  {
    url: '/themen/majestatische-formen-der-sahara',
    locale: 'de',
    record: {
      _updatedAt: '2025-01-16T16:19:45+01:00',
      _seoMetaTags: [
        {
          attributes: null,
          content: 'Majestätische Formen der Sahara – Boilerplate',
          tag: 'title',
        },
        {
          attributes: {
            property: 'og:title',
            content: 'Majestätische Formen der Sahara',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:title',
            content: 'Majestätische Formen der Sahara',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:image',
            content:
              'https://www.datocms-assets.com/119249/1736262925-sahara.png?auto=format&fit=max&w=1200',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:image:width',
            content: '1200',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:image:height',
            content: '1200',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:image',
            content:
              'https://www.datocms-assets.com/119249/1736262925-sahara.png?auto=format&fit=max&w=1200',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:locale',
            content: 'de',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:type',
            content: 'article',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:site_name',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:modified_time',
            content: '2025-01-16T15:19:45Z',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:publisher',
            content: '',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:card',
            content: 'summary',
          },
          content: null,
          tag: 'meta',
        },
      ],
      seo: null,
      __typename: 'ArticleRecord',
      id: 'cnAaha02S7aZV5KXrNbfFQ',
      title: 'Majestätische Formen der Sahara',
      _allTranslatedSlugLocales: [
        {
          locale: 'de',
          value: 'majestatische-formen-der-sahara',
        },
        {
          locale: 'en',
          value: 'majestic-shapes-of-the-sahara',
        },
      ],
    },
  },
  {
    url: '/uber-uns',
    locale: 'de',
    record: {
      _updatedAt: '2025-02-17T10:08:41+01:00',
      _seoMetaTags: [
        {
          attributes: null,
          content: 'Über uns – Boilerplate',
          tag: 'title',
        },
        {
          attributes: {
            property: 'og:title',
            content: 'Über uns',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:title',
            content: 'Über uns',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:locale',
            content: 'de',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:type',
            content: 'article',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:site_name',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:modified_time',
            content: '2025-02-17T09:08:41Z',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:publisher',
            content: '',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:card',
            content: 'summary',
          },
          content: null,
          tag: 'meta',
        },
      ],
      seo: null,
      __typename: 'PageRecord',
      id: 'Er5XpEvTSx2w5DqV8y6IJg',
      title: 'Über uns',
      _allTranslatedSlugLocales: [
        {
          locale: 'de',
          value: 'uber-uns',
        },
        {
          locale: 'en',
          value: 'about-us',
        },
      ],
      parent: null,
    },
  },
  {
    url: '/uber-uns/philosophie',
    locale: 'de',
    record: {
      _updatedAt: '2025-02-25T15:34:32+01:00',
      _seoMetaTags: [
        {
          attributes: null,
          content: 'Philosophie – Boilerplate',
          tag: 'title',
        },
        {
          attributes: {
            property: 'og:title',
            content: 'Philosophie',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:title',
            content: 'Philosophie',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:locale',
            content: 'de',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:type',
            content: 'article',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:site_name',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:modified_time',
            content: '2025-02-25T14:34:32Z',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:publisher',
            content: '',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:card',
            content: 'summary',
          },
          content: null,
          tag: 'meta',
        },
      ],
      seo: null,
      __typename: 'PageRecord',
      id: 'HhXUF7hNSO6bKOb-Tjg5rQ',
      title: 'Philosophie',
      _allTranslatedSlugLocales: [
        {
          locale: 'de',
          value: 'philosophie',
        },
      ],
      parent: {
        _allTranslatedSlugLocales: [
          {
            locale: 'de',
            value: 'uber-uns',
          },
          {
            locale: 'en',
            value: 'about-us',
          },
        ],
      },
    },
  },
  {
    url: '/uber-uns/team',
    locale: 'de',
    record: {
      _updatedAt: '2025-03-10T16:07:57+01:00',
      _seoMetaTags: [
        {
          attributes: null,
          content: 'Team – Boilerplate',
          tag: 'title',
        },
        {
          attributes: {
            property: 'og:title',
            content: 'Team',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:title',
            content: 'Team',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'description',
            content:
              'Unser grossartiges Team arbeitet rund um die Uhr an neuem Inhalt für Sie.',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:description',
            content:
              'Unser grossartiges Team arbeitet rund um die Uhr an neuem Inhalt für Sie.',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:description',
            content:
              'Unser grossartiges Team arbeitet rund um die Uhr an neuem Inhalt für Sie.',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:locale',
            content: 'de',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:type',
            content: 'article',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:site_name',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:modified_time',
            content: '2025-03-10T15:07:57Z',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:publisher',
            content: '',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:card',
            content: 'summary',
          },
          content: null,
          tag: 'meta',
        },
      ],
      seo: {
        noIndex: false,
      },
      __typename: 'PageRecord',
      id: 'QjsWR2UDR6yCjfvf5w287A',
      title: 'Team',
      _allTranslatedSlugLocales: [
        {
          locale: 'de',
          value: 'team',
        },
      ],
      parent: {
        _allTranslatedSlugLocales: [
          {
            locale: 'de',
            value: 'uber-uns',
          },
          {
            locale: 'en',
            value: 'about-us',
          },
        ],
      },
    },
  },
  {
    url: '/en',
    locale: 'en',
    record: {
      _updatedAt: '2025-04-23T14:43:40+02:00',
      _seoMetaTags: [
        {
          attributes: null,
          content: 'Home – Boilerplate',
          tag: 'title',
        },
        {
          attributes: {
            property: 'og:title',
            content: 'Home',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:title',
            content: 'Home',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:locale',
            content: 'de',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:type',
            content: 'article',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:site_name',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:modified_time',
            content: '2025-04-23T12:43:40Z',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:publisher',
            content: '',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:card',
            content: 'summary',
          },
          content: null,
          tag: 'meta',
        },
      ],
      seo: null,
      __typename: 'PageRecord',
      id: 'KuJIziTLS6CX9VtI5s5_mw',
      title: 'Home',
      _allTranslatedSlugLocales: [
        {
          locale: 'de',
          value: 'home',
        },
        {
          locale: 'en',
          value: 'home',
        },
      ],
      parent: null,
    },
  },
  {
    url: '/en/404',
    locale: 'en',
    record: {
      _updatedAt: '2025-07-17T16:15:09+02:00',
      _seoMetaTags: [
        {
          attributes: null,
          content: '404 Test – Boilerplate',
          tag: 'title',
        },
        {
          attributes: {
            property: 'og:title',
            content: '404 Test',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:title',
            content: '404 Test',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:locale',
            content: 'de',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:type',
            content: 'article',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:site_name',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:modified_time',
            content: '2025-07-17T14:15:09Z',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:publisher',
            content: '',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:card',
            content: 'summary',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'robots',
            content: 'noindex',
          },
          content: null,
          tag: 'meta',
        },
      ],
      seo: {
        noIndex: true,
      },
      __typename: 'PageRecord',
      id: 'UX53BgLrRkepWPB7i-3Xcw',
      title: '404 Test',
      _allTranslatedSlugLocales: [
        {
          locale: 'de',
          value: '404',
        },
        {
          locale: 'en',
          value: '404',
        },
      ],
      parent: null,
    },
  },
  {
    url: '/en/about-us',
    locale: 'en',
    record: {
      _updatedAt: '2025-02-17T10:08:41+01:00',
      _seoMetaTags: [
        {
          attributes: null,
          content: 'Über uns – Boilerplate',
          tag: 'title',
        },
        {
          attributes: {
            property: 'og:title',
            content: 'Über uns',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:title',
            content: 'Über uns',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:locale',
            content: 'de',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:type',
            content: 'article',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:site_name',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:modified_time',
            content: '2025-02-17T09:08:41Z',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:publisher',
            content: '',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:card',
            content: 'summary',
          },
          content: null,
          tag: 'meta',
        },
      ],
      seo: null,
      __typename: 'PageRecord',
      id: 'Er5XpEvTSx2w5DqV8y6IJg',
      title: 'Über uns',
      _allTranslatedSlugLocales: [
        {
          locale: 'de',
          value: 'uber-uns',
        },
        {
          locale: 'en',
          value: 'about-us',
        },
      ],
      parent: null,
    },
  },
  {
    url: '/en/articles/a-temples-seren-silhouette',
    locale: 'en',
    record: {
      _updatedAt: '2025-01-16T16:20:33+01:00',
      _seoMetaTags: [
        {
          attributes: null,
          content: 'Die ruhige Silhouette eines Tempels – Boilerplate',
          tag: 'title',
        },
        {
          attributes: {
            property: 'og:title',
            content: 'Die ruhige Silhouette eines Tempels',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:title',
            content: 'Die ruhige Silhouette eines Tempels',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:image',
            content:
              'https://www.datocms-assets.com/119249/1736263503-teaser-article-2.png?auto=format&fit=max&w=1200',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:image:width',
            content: '1200',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:image:height',
            content: '1200',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:image',
            content:
              'https://www.datocms-assets.com/119249/1736263503-teaser-article-2.png?auto=format&fit=max&w=1200',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:locale',
            content: 'de',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:type',
            content: 'article',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:site_name',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:modified_time',
            content: '2025-01-16T15:20:33Z',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:publisher',
            content: '',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:card',
            content: 'summary',
          },
          content: null,
          tag: 'meta',
        },
      ],
      seo: null,
      __typename: 'ArticleRecord',
      id: 'YwwDXESeRWiyOVcJTXpNnQ',
      title: 'Die ruhige Silhouette eines Tempels',
      _allTranslatedSlugLocales: [
        {
          locale: 'de',
          value: 'die-ruhige-silhouette-eines-tempels',
        },
        {
          locale: 'en',
          value: 'a-temples-seren-silhouette',
        },
      ],
    },
  },
  {
    url: '/en/articles/majestic-shapes-of-the-sahara',
    locale: 'en',
    record: {
      _updatedAt: '2025-01-16T16:19:45+01:00',
      _seoMetaTags: [
        {
          attributes: null,
          content: 'Majestätische Formen der Sahara – Boilerplate',
          tag: 'title',
        },
        {
          attributes: {
            property: 'og:title',
            content: 'Majestätische Formen der Sahara',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:title',
            content: 'Majestätische Formen der Sahara',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:image',
            content:
              'https://www.datocms-assets.com/119249/1736262925-sahara.png?auto=format&fit=max&w=1200',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:image:width',
            content: '1200',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:image:height',
            content: '1200',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:image',
            content:
              'https://www.datocms-assets.com/119249/1736262925-sahara.png?auto=format&fit=max&w=1200',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:locale',
            content: 'de',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:type',
            content: 'article',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:site_name',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:modified_time',
            content: '2025-01-16T15:19:45Z',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:publisher',
            content: '',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:card',
            content: 'summary',
          },
          content: null,
          tag: 'meta',
        },
      ],
      seo: null,
      __typename: 'ArticleRecord',
      id: 'cnAaha02S7aZV5KXrNbfFQ',
      title: 'Majestätische Formen der Sahara',
      _allTranslatedSlugLocales: [
        {
          locale: 'de',
          value: 'majestatische-formen-der-sahara',
        },
        {
          locale: 'en',
          value: 'majestic-shapes-of-the-sahara',
        },
      ],
    },
  },
  {
    url: '/en/articles/moments-in-between-travel-and-living',
    locale: 'en',
    record: {
      _updatedAt: '2025-01-16T16:20:09+01:00',
      _seoMetaTags: [
        {
          attributes: null,
          content: 'Augenblicke zwischen Reisen und Leben – Boilerplate',
          tag: 'title',
        },
        {
          attributes: {
            property: 'og:title',
            content: 'Augenblicke zwischen Reisen und Leben',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:title',
            content: 'Augenblicke zwischen Reisen und Leben',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:image',
            content:
              'https://www.datocms-assets.com/119249/1736263259-teaser-article.png?auto=format&fit=max&w=1200',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:image:width',
            content: '1200',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:image:height',
            content: '1200',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:image',
            content:
              'https://www.datocms-assets.com/119249/1736263259-teaser-article.png?auto=format&fit=max&w=1200',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:locale',
            content: 'de',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:type',
            content: 'article',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:site_name',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:modified_time',
            content: '2025-01-16T15:20:09Z',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:publisher',
            content: '',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:card',
            content: 'summary',
          },
          content: null,
          tag: 'meta',
        },
      ],
      seo: null,
      __typename: 'ArticleRecord',
      id: 'EBnNwDEBSbu72aDJvin7SQ',
      title: 'Augenblicke zwischen Reisen und Leben',
      _allTranslatedSlugLocales: [
        {
          locale: 'de',
          value: 'augenblicke-zwischen-reisen-und-leben',
        },
        {
          locale: 'en',
          value: 'moments-in-between-travel-and-living',
        },
      ],
    },
  },
  {
    url: '/en/contact',
    locale: 'en',
    record: {
      _updatedAt: '2025-01-21T17:50:54+01:00',
      _seoMetaTags: [
        {
          attributes: null,
          content: 'Kontakt – Boilerplate',
          tag: 'title',
        },
        {
          attributes: {
            property: 'og:title',
            content: 'Kontakt',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:title',
            content: 'Kontakt',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:locale',
            content: 'de',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:type',
            content: 'article',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:site_name',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:modified_time',
            content: '2025-01-21T16:50:54Z',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:publisher',
            content: '',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:card',
            content: 'summary',
          },
          content: null,
          tag: 'meta',
        },
      ],
      seo: null,
      __typename: 'PageRecord',
      id: 'Q7QhZFhZS4GD4L61OisZGQ',
      title: 'Kontakt',
      _allTranslatedSlugLocales: [
        {
          locale: 'de',
          value: 'kontakt',
        },
        {
          locale: 'en',
          value: 'contact',
        },
      ],
      parent: null,
    },
  },
  {
    url: '/en/imprint',
    locale: 'en',
    record: {
      _updatedAt: '2024-12-18T15:48:47+01:00',
      _seoMetaTags: [
        {
          attributes: null,
          content: 'Impressum – Boilerplate',
          tag: 'title',
        },
        {
          attributes: {
            property: 'og:title',
            content: 'Impressum',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:title',
            content: 'Impressum',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:locale',
            content: 'de',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:type',
            content: 'article',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:site_name',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:modified_time',
            content: '2024-12-18T14:48:47Z',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:publisher',
            content: '',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:card',
            content: 'summary',
          },
          content: null,
          tag: 'meta',
        },
      ],
      seo: null,
      __typename: 'PageRecord',
      id: 'Z8YVsNUGQdCEXcNKLQj5UA',
      title: 'Impressum',
      _allTranslatedSlugLocales: [
        {
          locale: 'de',
          value: 'impressum',
        },
        {
          locale: 'en',
          value: 'imprint',
        },
      ],
      parent: null,
    },
  },
  {
    url: '/en/module-overview',
    locale: 'en',
    record: {
      _updatedAt: '2025-08-18T17:06:13+02:00',
      _seoMetaTags: [
        {
          attributes: null,
          content: 'Module Overview – Boilerplate',
          tag: 'title',
        },
        {
          attributes: {
            property: 'og:title',
            content: 'Module Overview',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:title',
            content: 'Module Overview',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:locale',
            content: 'de',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:type',
            content: 'article',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:site_name',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:modified_time',
            content: '2025-08-18T15:06:13Z',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:publisher',
            content: '',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:card',
            content: 'summary',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'robots',
            content: 'noindex',
          },
          content: null,
          tag: 'meta',
        },
      ],
      seo: {
        noIndex: true,
      },
      __typename: 'PageRecord',
      id: 'MOM32HwTRqyusb5Uxk4xTw',
      title: 'Module Overview',
      _allTranslatedSlugLocales: [
        {
          locale: 'de',
          value: 'module-overview',
        },
        {
          locale: 'en',
          value: 'module-overview',
        },
      ],
      parent: null,
    },
  },
  {
    url: '/en/offer',
    locale: 'en',
    record: {
      _updatedAt: '2025-08-25T15:09:21+02:00',
      _seoMetaTags: [
        {
          attributes: null,
          content: 'Angebot – Boilerplate',
          tag: 'title',
        },
        {
          attributes: {
            property: 'og:title',
            content: 'Angebot',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:title',
            content: 'Angebot',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:description',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:locale',
            content: 'de',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:type',
            content: 'article',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'og:site_name',
            content: 'Gridonic Boilerplate',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:modified_time',
            content: '2025-08-25T13:09:21Z',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            property: 'article:publisher',
            content: '',
          },
          content: null,
          tag: 'meta',
        },
        {
          attributes: {
            name: 'twitter:card',
            content: 'summary',
          },
          content: null,
          tag: 'meta',
        },
      ],
      seo: null,
      __typename: 'PageRecord',
      id: 'SaUHV1-gQx-MBWNadQEcgQ',
      title: 'Angebot',
      _allTranslatedSlugLocales: [
        {
          locale: 'de',
          value: 'angebot',
        },
        {
          locale: 'en',
          value: 'offer',
        },
      ],
      parent: null,
    },
  },
];
