import type { Alpine } from 'alpinejs';

// Global types that will be available throughout the application
// These types are designed to be globally available when the dastro library is used
declare global {
  const Alpine: Alpine;
}

// Export empty object to make this a module
export {};
