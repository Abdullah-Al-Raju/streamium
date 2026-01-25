import { browser } from "$app/environment";
import { get } from "svelte/store";
import { providerUrls } from "$lib/stores/provider-urls";

export interface Provider {
  id: string;
  name: string;
  getEmbedUrl: (
    mediaId: string | number,
    type: "movie" | "tv",
    season?: number,
    episode?: number,
  ) => string;
}

export const providers: Provider[] = [
  {
    id: "vidsrc",
    name: "VidSrc",
    getEmbedUrl: (mediaId, type, season, episode) => {
      const urls = get(providerUrls);
      if (!urls?.vidsrc) return "";

      if (type === "movie") {
        return `${urls.vidsrc}/movie/${mediaId}?autoPlay=true`;
      } else {
        if (typeof season !== "undefined" && typeof episode !== "undefined") {
          return `${urls.vidsrc}/tv/${mediaId}/${season}/${episode}?autoPlay=true&autoNext=true`;
        }
        return `${urls.vidsrc}/tv/${mediaId}?autoPlay=true`;
      }
    },
  },
  {
    id: "moviesapi",
    name: "MoviesAPI",
    getEmbedUrl: (mediaId, type, season, episode) => {
      const urls = get(providerUrls);
      if (!urls?.moviesapi) return "";

      if (type === "movie") {
        return `${urls.moviesapi}/movie/${mediaId}`;
      } else {
        if (typeof season !== "undefined" && typeof episode !== "undefined") {
          return `${urls.moviesapi}/tv/${mediaId}-${season}-${episode}`;
        }
        return `${urls.moviesapi}/tv/${mediaId}-1-1`;
      }
    },
  },
  {
    id: "vidsrcembed",
    name: "VidSrc 2",
    getEmbedUrl: (mediaId, type, season, episode) => {
      const urls = get(providerUrls);
      if (!urls?.vidsrcembed) return "";

      if (type === "movie") {
        return `${urls.vidsrcembed}/embed/movie?tmdb=${mediaId}`;
      } else {
        if (typeof season !== "undefined" && typeof episode !== "undefined") {
          return `${urls.vidsrcembed}/embed/tv?tmdb=${mediaId}&season=${season}&episode=${episode}`;
        }
        return `${urls.vidsrcembed}/embed/tv?tmdb=${mediaId}&season=1&episode=1`;
      }
    },
  },
];

export function getProvider(id: string): Provider | undefined {
  return providers.find((p) => p.id === id);
}

export function getDefaultProvider(): Provider {
  if (!browser) {
    return providers[0];
  }

  const savedProvider = localStorage.getItem("selectedProvider");
  if (savedProvider) {
    const provider = providers.find((p) => p.id === savedProvider);
    if (provider) return provider;
  }

  return providers.find((p) => p.id === "vidsrc") || providers[0];
}
