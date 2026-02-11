import type { APIRoute } from 'astro';
import {
  checkSecretApiTokenCorrectness,
  handleUnexpectedError,
  invalidRequestResponse,
} from '../../utils.ts';

/**
 * This route handler disables Draft Mode and redirects to the given URL.
 */
export const GET: APIRoute = async (event) => {
  const { disableDraftMode, redirectUrlWithoutDraftModeSwitch } =
    event.locals.dastro.draftMode();
  const { isDatoEnvironmentSwitchAllowed, switchDatoEnvironment } =
    event.locals.dastro.environmentSwitch();

  const { url } = event;

  const token = url.searchParams.get('token'); // For disabling, token only needed when switching environment
  const redirectUrl = redirectUrlWithoutDraftModeSwitch(url);
  const environment = url.searchParams.get('environment');

  try {
    // Avoid open redirect vulnerabilities
    if (
      redirectUrl.startsWith('http://') ||
      redirectUrl.startsWith('https://')
    ) {
      return invalidRequestResponse('URL must be relative!', 422);
    }

    disableDraftMode(event);

    if (
      checkSecretApiTokenCorrectness(event.locals.dastro.config, token) &&
      environment &&
      isDatoEnvironmentSwitchAllowed()
    ) {
      await switchDatoEnvironment(event, environment);
    }
  } catch (error) {
    return handleUnexpectedError(error);
  }

  return event.redirect(redirectUrl, 303);
};
