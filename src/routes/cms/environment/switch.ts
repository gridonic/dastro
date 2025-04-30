import type { APIRoute } from 'astro';
import {checkSecretApiTokenCorrectness, handleUnexpectedError, invalidRequestResponse} from "../../utils.ts";


/**
 * This route handler enables Draft Mode and redirects to the given URL.
 */
export const GET: APIRoute = async (event) => {
  if (event.locals.dastro.config.renderingMode === 'static') {
    return invalidRequestResponse(
      'Switching environment not supported with static rendering',
      501,
    );
  }

  const { isDatoEnvironmentSwitchAllowed, switchDatoEnvironment } = event.locals.dastro.environmentSwitch();

  if (!isDatoEnvironmentSwitchAllowed()) {
    return invalidRequestResponse('Switching environment is not allowed.', 501);
  }

  const { url } = event;

  const token = url.searchParams.get('token');
  const environment = url.searchParams.get('environment');
  const redirectUrl = url.searchParams.get('url') || '/';

  try {
    // Ensure that the request is coming from a trusted source
    if (!checkSecretApiTokenCorrectness(event.locals.dastro.config, token)) {
      return invalidRequestResponse('Invalid token', 401);
    }

    if (!environment) {
      return invalidRequestResponse('No environment specified', 401);
    }

    // Avoid open redirect vulnerabilities
    if (
      redirectUrl.startsWith('http://') ||
      redirectUrl.startsWith('https://')
    ) {
      return invalidRequestResponse('URL must be relative!', 422);
    }

    await switchDatoEnvironment(event, environment);
  } catch (error) {
    return handleUnexpectedError(error);
  }

  return event.redirect(redirectUrl, 307);
};
