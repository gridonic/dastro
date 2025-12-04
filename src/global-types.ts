import type { Alpine } from 'alpinejs';
import type { Context } from '@netlify/functions';

// Global types that will be available throughout the application
// These types are designed to be globally available when the dastro library is used
declare global {
  const Alpine: Alpine;
  namespace App {
    interface Locals {
      netlify: Context | null | undefined;
    }
  }
}

// Export empty object to make this a module
export {};
