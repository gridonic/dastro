import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { executeQuery } from '@datocms/cda-client';
import type {DastroConfig, DastroTypes} from "../core/lib-types.ts";
import type {AstroContext} from "../astro.context.ts";
import {draftMode} from "./draft-mode.ts";
import {environmentSwitch} from "./environment-switch.ts";

export function datocms<T extends DastroTypes>(config: DastroConfig<T>) {
  async function datoFetch<TResult, TVariables>(
    context: AstroContext<'locals' | 'cookies' | 'response'>,
    query: TypedDocumentNode<TResult, TVariables>,
    variables?: TVariables,
  ) {
    // // TODO: temporary to watch /  debug query execution
    // console.debug('Query: ', {
    //   name: (
    //     query.definitions.find((d) => d.kind === 'OperationDefinition') as any
    //   ).name?.value,
    //   variables: JSON.stringify(variables),
    // });
    const { isDraftModeEnabled } = draftMode<T>(config);
    const { getDatoEnvironment } = environmentSwitch<T>(config);

    return executeQuery(query, {
      variables: variables,
      excludeInvalid: true,
      includeDrafts: isDraftModeEnabled(context),
      token: config.datocms.token as any,
      environment: getDatoEnvironment(context),
    });
  }

  return {
    datoFetch
  }
}
