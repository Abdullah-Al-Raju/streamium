/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/types#app
declare global {
  namespace App {
    interface Error {
      message: string;
      code?: string;
    }
    interface Locals {}
    interface PageData {}
    interface Platform {}
  }

  namespace NodeJS {
    interface ProcessEnv {
      TMDB_API_KEY: string;
      DATABASE_URL: string;
    }
  }
}

export {};
