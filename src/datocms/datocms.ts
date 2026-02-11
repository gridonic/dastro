import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { executeQuery, type ExecuteQueryOptions } from '@datocms/cda-client';
import type { DastroConfig, DastroTypes } from '../core/lib-types.ts';
import type { AstroContext } from '../astro.context.ts';
import { draftMode } from './draft-mode.ts';
import { environmentSwitch } from './environment-switch.ts';
import { visualEditing } from './visual-editing.ts';

export function datocms<T extends DastroTypes>(config: DastroConfig<T>) {
  async function datoFetch<TResult, TVariables>(
    context: AstroContext<'locals' | 'cookies'>,
    query: TypedDocumentNode<TResult, TVariables>,
    variables?: TVariables,
    options: {
      ignoreContentLink?: boolean;
      excludeInvalid?: boolean;
    } = {},
  ) {
    const { excludeInvalid = true, ignoreContentLink = false } = options;
    // // TODO: temporary to watch /  debug query execution
    // console.debug('Query: ', {
    //   name: (
    //     query.definitions.find((d) => d.kind === 'OperationDefinition') as any
    //   ).name?.value,
    //   variables: JSON.stringify(variables),
    // });
    const { isDraftModeEnabled, addExecutedQueryInDraftMode } =
      draftMode<T>(config);
    const { getDatoEnvironment } = environmentSwitch<T>(config);
    const { isVisualEditingEnabled } = visualEditing(context);

    const queryOptions = {
      variables,
      excludeInvalid,
      includeDrafts: isDraftModeEnabled(context),
      token: config.datocms.token,
      environment: getDatoEnvironment(context),
      baseEditingUrl: config.datocms.baseEditingUrl,
      ...(!ignoreContentLink && isVisualEditingEnabled()
        ? { contentLink: 'v1' }
        : {}),
    } satisfies ExecuteQueryOptions<TVariables>;

    addExecutedQueryInDraftMode(
      {
        query,
        ...queryOptions,
      },
      context,
    );

    return executeQuery(query, queryOptions);
  }

  return {
    datoFetch,
  };
}
