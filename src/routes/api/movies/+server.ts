import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import type { TMDBResponse, TMDBMovie } from "$lib/types/tmdb";

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
        apiUrl = `${tmdbApiUrl}/trending/movie/week?${baseParams}`;
        break;
      case "popular":
        apiUrl = `${tmdbApiUrl}/movie/popular?${baseParams}`;
        break;
      case "top_rated":
        apiUrl = `${tmdbApiUrl}/movie/top_rated?${baseParams}`;
        break;
      case "now_playing":
        apiUrl = `${tmdbApiUrl}/movie/now_playing?${baseParams}`;
        break;
      case "upcoming":
        apiUrl = `${tmdbApiUrl}/movie/upcoming?${baseParams}`;
        break;
      default:
        apiUrl = `${tmdbApiUrl}/discover/movie?${baseParams}`;
    }

    if (genre || year) {
      apiUrl = `${tmdbApiUrl}/discover/movie?${baseParams}`;
      if (genre) apiUrl += `&with_genres=${genre}`;
      if (year) apiUrl += `&primary_release_year=${year}`;
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
        error: `Failed to fetch movies (${response.status})`
      }, { status: 200 });
    }

    const data = await response.json() as TMDBResponse<TMDBMovie>;
    data.results = data.results.filter((movie) => movie.vote_average > 0);

    return json(data);
  } catch (err) {
    console.error("Error fetching movies:", err);
    return json({
      results: [],
      total_pages: 0,
      total_results: 0,
      page: 1,
      error: "Failed to fetch movies. Please try again later."
    }, { status: 200 });
  }
}
