import type { APIRoute } from 'astro';
import {
  checkSecretApiTokenCorrectness,
  handleUnexpectedError,
  invalidRequestResponse,
} from '../../utils.ts';

/**
 * This route handler enables Draft Mode and redirects to the given URL.
 */
export const GET: APIRoute = async (event) => {
  const { enableDraftMode } = event.locals.dastro.draftMode();
  const { isDatoEnvironmentSwitchAllowed, switchDatoEnvironment } =
    event.locals.dastro.environmentSwitch();

  const { url } = event;

  const token = url.searchParams.get('token');
  const redirectUrl = url.searchParams.get('url') || '/';
  const environment = url.searchParams.get('environment');

  try {
    // Ensure that the request is coming from a trusted source
    if (!checkSecretApiTokenCorrectness(event.locals.dastro.config, token)) {
      return invalidRequestResponse('Invalid token', 401);
    }

    // Avoid open redirect vulnerabilities
    if (
      redirectUrl.startsWith('http://') ||
      redirectUrl.startsWith('https://')
    ) {
      return invalidRequestResponse('URL must be relative!', 422);
    }

    enableDraftMode(event);

    if (environment && isDatoEnvironmentSwitchAllowed()) {
      await switchDatoEnvironment(event, environment);
    }
  } catch (error) {
    return handleUnexpectedError(error);
  }

  const redirectUrlWithDraftMode = new URL(redirectUrl, url.origin);
  redirectUrlWithDraftMode.searchParams.set(
    'draftModeEnabledAt',
    Date.now().toString(),
  );
  const finalRedirectUrl =
    redirectUrlWithDraftMode.pathname + redirectUrlWithDraftMode.search;

  return event.redirect(finalRedirectUrl, 303);
};
