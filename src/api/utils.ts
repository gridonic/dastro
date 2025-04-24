import {ApiError} from '@datocms/cma-client';
import {serializeError} from 'serialize-error';
import type {DastroConfig, DastroTypes} from "../lib-types.ts";

export function checkSecretApiTokenCorrectness(dastroConfig: DastroConfig<DastroTypes>, token: string | null): boolean {
  return dastroConfig.environment === 'local' || token === dastroConfig.api.secretApiToken;
}

export function withCORS(responseInit?: ResponseInit): ResponseInit {
  return {
    ...responseInit,
    headers: {
      ...responseInit?.headers,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  };
}

export function json(response: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(response), init);
}

export function handleUnexpectedError(error: unknown) {
  try {
    // TODO: why is this done this way? can't we just leave that and print error directly?
    throw error;
  } catch (e) {
    console.error(e);
  }

  if (error instanceof ApiError) {
    return json(
      {
        success: false,
        error: error.message,
        request: error.request,
        response: error.response,
      },
      withCORS({status: 500}),
    );
  }

  return invalidRequestResponse(serializeError(error), 500);
}

export function invalidRequestResponse(error: unknown, status = 422) {
  return json(
    {
      success: false,
      error,
    },
    withCORS({status}),
  );
}

export function successfulResponse(data?: unknown, status = 200) {
  return json(
    {
      success: true,
      data,
    },
    withCORS({status}),
  );
}
