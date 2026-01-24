import type { ServerLoad } from "@sveltejs/kit";
import { TMDBService, TMDBApiError } from "$lib/services/tmdb";

export const load = (async () => {
  const tmdb = new TMDBService();

  if (!tmdb.isConfigured()) {
    return {
      trendingMovies: [],
      trendingTVShows: [],
      error: 'TMDB API key is not configured. Please add TMDB_API_KEY to your .env file.',
    };
  }

  try {
    const [trendingMovies, trendingTVShows] = await Promise.all([
      tmdb.getTrendingMovies(),
      tmdb.getTrendingTVShows(),
    ]);

    return {
      trendingMovies: trendingMovies.results.slice(0, 12),
      trendingTVShows: trendingTVShows.results.slice(0, 12),
      error: null,
    };
  } catch (err) {
    const error = err instanceof TMDBApiError
      ? err.message
      : 'Failed to load content. Please try again later.';

    console.error('Homepage load error:', err);

    return {
      trendingMovies: [],
      trendingTVShows: [],
      error,
    };
  }
}) satisfies ServerLoad;
