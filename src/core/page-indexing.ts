import type {DastroConfig, DastroTypes} from "./lib-types.ts";

export function isSearchIndexingPrevented<T extends DastroTypes>(config: DastroConfig<T>) {
  // Only ever allow indexing in the production environment!
  if (config.environment !== 'production') {
    return true;
  }

  // Indexing can be turned off in production, e.g., when not live yet
  return config.dev.preventSearchIndexing;
}
