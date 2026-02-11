import type { APIRoute } from 'astro';
import {
  checkSecretApiTokenCorrectness,
  handleUnexpectedError,
  invalidRequestResponse,
  json,
  loadParentsRecursively,
  withCORS,
} from '../utils';
import type { DastroTypes } from '../../core/lib-types.ts';

type PreviewLink = {
  label: string;
  url: string;
  reloadPreviewOnRecordUpdate?: boolean | { delayInMs: number };
};

type WebPreviewsResponse = {
  previewLinks: PreviewLink[];
};

export const OPTIONS: APIRoute = () => {
  return new Response('OK', withCORS());
};

/**
 * This route handler implements the Previews webhook required for the "Web
 * Previews" plugin:
 *
 * https://www.datocms.com/marketplace/plugins/i/datocms-plugin-web-previews#the-previews-webhook
 */
export const POST: APIRoute = async ({ url, request, locals }) => {
  const { pageDefinitionList, resolveRecordUrl } = locals.dastro.routing();
  const { normalizedSiteLocale, defaultLocale } = locals.dastro.i18n();
  const { config } = locals.dastro;

  try {
    // Parse query string parameters
    const token = url.searchParams.get('token');

    // Ensure that the request is coming from a trusted source
    if (!checkSecretApiTokenCorrectness(config, token)) {
      return invalidRequestResponse('Invalid token', 401);
    }

    /**
     * The plugin sends the record and model for which the user wants a preview,
     * along with information about which locale they are currently viewing in
     * the interface
     */
    const {
      environmentId,
      item,
      itemType,
      locale: apiLocale,
    } = await request.json();
    const siteLocale = normalizedSiteLocale(apiLocale);

    const pageDefinition = pageDefinitionList().find(
      (p) => p.apiKey === itemType.attributes.api_key,
    );

    if (!pageDefinition) {
      return invalidRequestResponse(
        `No page definition found for api key "${itemType.attributes.api_key}"`,
        400,
      );
    }

    let parent = null;
    if (item.attributes.parent_id) {
      // Unfortunately, we need to do another fetch, because we have no info about a possible parent in the item
      parent = await loadParentsRecursively(
        item.attributes.parent_id,
        {
          apiKey: pageDefinition.apiKey,
          locale: siteLocale ?? '',
          environmentId,
          token: config.datocms.token,
        },
        0,
      );
    }

    const recordUrl = resolveRecordUrl(
      {
        __typename: pageDefinition.type,
        _allTranslatedSlugLocales: Object.keys(
          item.attributes.translated_slug,
        ).map((locale) => ({
          locale: locale as DastroTypes['SiteLocale'],
          value: item.attributes.translated_slug[locale],
        })),
        parent,
      },
      siteLocale ?? defaultLocale,
    );

    const response: WebPreviewsResponse = { previewLinks: [] };

    if (recordUrl) {
      /**
       * If status is not published, it means that it has a current version that's
       * different from the published one, so it has a draft version!
       */
      if (item.meta.status !== 'published') {
        /**
         * Generate a URL that initially enters Draft Mode, and then
         * redirects to the desired URL
         */
        response.previewLinks.push({
          label: 'Draft version',
          url: new URL(
            /*
             * We generate the URL in a way that it first passes through the
             * endpoint that enables the Draft Mode.
             */
            `/api/cms/draft-mode/enable?redirect=${recordUrl}&environment=${environmentId}&token=${token}`,
            request.url,
          ).toString(),
        });
      }

      /** If status is not draft, it means that it has a published version! */
      if (item.meta.status !== 'draft') {
        /**
         * Generate a URL that first exits from Draft Mode, and then
         * redirects to the desired URL.
         */
        response.previewLinks.push({
          label: 'Published version',
          url: new URL(
            /*
             * We generate the URL in a way that it first passes through the
             * endpoint that disables the Draft Mode.
             */
            `/api/cms/draft-mode/disable?redirect=${recordUrl}&environment=${environmentId}&token=${token}`,
            request.url,
          ).toString(),
        });
      }
    }

    // Respond in the format expected by the plugin
    return json(response, withCORS());
  } catch (error) {
    return handleUnexpectedError(error);
  }
};
