import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import type { TMDBResponse, TMDBTVShow } from "$lib/types/tmdb";

export async function GET({ fetch, url }: RequestEvent) {
  const tmdbApiKey = env.TMDB_API_KEY;
  const tmdbApiUrl = env.TMDB_API_URL;

  if (!tmdbApiKey || !tmdbApiUrl) {
    return json({
      results: [],
      total_pages: 0,
      total_results: 0,
      page: 1,
      error: "TMDB API is not configured. Please add TMDB_API_KEY to your .env file."
    }, { status: 200 });
  }

  const page = url.searchParams.get("page") || "1";
  const sort = url.searchParams.get("sort") || "trending";
  const genre = url.searchParams.get("genre");
  const year = url.searchParams.get("year");

  try {
    let apiUrl: string;
    const baseParams = `api_key=${tmdbApiKey}&language=en-US&page=${page}&vote_average.gte=0.1`;

    switch (sort) {
      case "trending":
        apiUrl = `${tmdbApiUrl}/trending/tv/week?${baseParams}`;
        break;
      case "popular":
        apiUrl = `${tmdbApiUrl}/tv/popular?${baseParams}`;
        break;
      case "top_rated":
        apiUrl = `${tmdbApiUrl}/tv/top_rated?${baseParams}`;
        break;
      case "on_the_air":
        apiUrl = `${tmdbApiUrl}/tv/on_the_air?${baseParams}`;
        break;
      case "airing_today":
        apiUrl = `${tmdbApiUrl}/tv/airing_today?${baseParams}`;
        break;
      default:
        apiUrl = `${tmdbApiUrl}/discover/tv?${baseParams}`;
    }

    if (genre || year) {
      apiUrl = `${tmdbApiUrl}/discover/tv?${baseParams}`;
      if (genre) apiUrl += `&with_genres=${genre}`;
      if (year) apiUrl += `&first_air_date_year=${year}`;
    }

    const response = await fetch(apiUrl);

    if (response.status === 401) {
      return json({
        results: [],
        total_pages: 0,
        total_results: 0,
        page: 1,
        error: "Invalid TMDB API key. Please check your TMDB_API_KEY in settings or environment."
      }, { status: 200 });
    }

    if (!response.ok) {
      return json({
        results: [],
        total_pages: 0,
        total_results: 0,
        page: 1,
        error: `Failed to fetch TV shows (${response.status})`
      }, { status: 200 });
    }

    const data = await response.json() as TMDBResponse<TMDBTVShow>;
    data.results = data.results.filter((show) => show.vote_average > 0);

    return json(data);
  } catch (err) {
    console.error("Error fetching TV shows:", err);
    return json({
      results: [],
      total_pages: 0,
      total_results: 0,
      page: 1,
      error: "Failed to fetch TV shows. Please try again later."
    }, { status: 200 });
  }
}
