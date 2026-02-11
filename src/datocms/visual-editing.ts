import type { AstroContext } from '../astro.context.ts';

// @see https://www.datocms.com/docs/astro/visual-editing
export function visualEditing(context: AstroContext<'locals' | 'cookies'>) {
  const { isDraftModeEnabled } = context.locals.dastro.draftMode();

  function isVisualEditingEnabled() {
    // TODO: maybe let turn on or off via env and / or cookie setting
    return isDraftModeEnabled(context);
  }

  return {
    isVisualEditingEnabled,
  };
}
