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
      }
    },
  };
}
