import { writable } from "svelte/store";

interface ProviderUrls {
  vidsrc: string;
  moviesapi: string;
  vidsrcembed: string;
}

export const providerUrls = writable<ProviderUrls | null>(null);

export async function loadProviderUrls() {
  if (typeof window === "undefined") return;

  try {
    const response = await fetch("/api/providers");
    const urls = await response.json();
    providerUrls.set(urls);
  } catch (error) {
    console.error("Failed to load provider URLs:", error);
  }
}
