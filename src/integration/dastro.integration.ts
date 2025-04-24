import type { AstroIntegration } from 'astro';
import {GET} from "../api/debug/routes.ts";

export default function dastroIntegration(): AstroIntegration {
  return {
    name: 'dastro',
    hooks:{
      'astro:config:setup': ({ injectRoute }) => {
        injectRoute({
          pattern: '/api/debug/routes',
          entrypoint: 'node_modules/dastro/src/api/debug/routes.ts'
        });

        injectRoute({
          pattern: '/api/cms/draft-mode/enable',
          entrypoint: 'node_modules/dastro/src/api/cms/draft-mode/enable.ts'
        });

        injectRoute({
          pattern: '/api/cms/draft-mode/disable',
          entrypoint: 'node_modules/dastro/src/api/cms/draft-mode/disable.ts'
        });

        injectRoute({
          pattern: '/api/cms/environment/switch',
          entrypoint: 'node_modules/dastro/src/api/cms/environment/switch.ts'
        });

        injectRoute({
          pattern: '/api/cms/preview-links',
          entrypoint: 'node_modules/dastro/src/api/cms/preview-links.ts'
        });
      }
    },
  };
}
