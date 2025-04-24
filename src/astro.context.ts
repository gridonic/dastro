import type { AstroGlobal } from 'astro';

// Allows you to simply pick the keys of the Astro props in your context
export type AstroContext<T extends keyof AstroGlobal> = Pick<AstroGlobal, T>;
