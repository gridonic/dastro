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
  const {
    enableDraftMode,
    isDraftModeEnabledByDefault,
    redirectUrlWithoutDraftModeSwitch,
  } = event.locals.dastro.draftMode();
  const { isDatoEnvironmentSwitchAllowed, switchDatoEnvironment } =
    event.locals.dastro.environmentSwitch();

  const { url } = event;

  const token = url.searchParams.get('token');
  const redirectUrl = redirectUrlWithoutDraftModeSwitch(url);
  const environment = url.searchParams.get('environment');

  try {
    const tokenCorrect = checkSecretApiTokenCorrectness(
      event.locals.dastro.config,
      token,
    );

    // Ensure that the request is coming from a trusted source. Not needed when
    // draft mode is on by default: drafts are public on that deploy anyway.
    if (!isDraftModeEnabledByDefault() && !tokenCorrect) {
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

    if (tokenCorrect && environment && isDatoEnvironmentSwitchAllowed()) {
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
