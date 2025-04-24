// import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
// import { executeQuery } from '@datocms/cda-client';
// import { DATO_CMS_TOKEN } from 'astro:env/server';
// import { isDraftModeEnabled } from '@/datocms/draft-mode.ts';
// import type { AstroContext } from '@/core/astro.context.ts';
// import { getDatoEnvironment } from '@/datocms/environment-switch.ts';
//
// export async function datoFetch<TResult, TVariables>(
//   context: AstroContext<'cookies'>,
//   query: TypedDocumentNode<TResult, TVariables>,
//   variables?: TVariables,
// ) {
//   // // TODO: temporary to watch /  debug query execution
//   // console.debug('Query: ', {
//   //   name: (
//   //     query.definitions.find((d) => d.kind === 'OperationDefinition') as any
//   //   ).name?.value,
//   //   variables: JSON.stringify(variables),
//   // });
//
//   return executeQuery(query, {
//     variables: variables,
//     excludeInvalid: true,
//     includeDrafts: isDraftModeEnabled(context),
//     token: DATO_CMS_TOKEN as any,
//     environment: getDatoEnvironment(context),
//   });
// }

// TODO: temp
import type {AstroContext} from "./astro.context.ts";

export async function datoFetch<TResult, TVariables>(
  context: AstroContext<'cookies'>,
  query: any,
  variables?: TVariables,
) {
  return null;
}
