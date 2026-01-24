import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { TMDB_API_KEY, TMDB_API_URL } from "$env/static/private";

export async function GET({ fetch, url }: RequestEvent) {
  if (!TMDB_API_KEY || !TMDB_API_URL) {
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
    const baseParams = `api_key=${TMDB_API_KEY}&language=en-US&page=${page}&vote_average.gte=0.1`;

    switch (sort) {
      case "trending":
        apiUrl = `${TMDB_API_URL}/trending/tv/week?${baseParams}`;
        break;
      case "popular":
        apiUrl = `${TMDB_API_URL}/tv/popular?${baseParams}`;
        break;
      case "top_rated":
        apiUrl = `${TMDB_API_URL}/tv/top_rated?${baseParams}`;
        break;
      case "on_the_air":
        apiUrl = `${TMDB_API_URL}/tv/on_the_air?${baseParams}`;
        break;
      case "airing_today":
        apiUrl = `${TMDB_API_URL}/tv/airing_today?${baseParams}`;
        break;
      default:
        apiUrl = `${TMDB_API_URL}/discover/tv?${baseParams}`;
    }

    if (genre || year) {
      apiUrl = `${TMDB_API_URL}/discover/tv?${baseParams}`;
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
        error: "Invalid TMDB API key. Please check your TMDB_API_KEY in .env file."
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

    const data = await response.json();
    data.results = data.results.filter((show: any) => show.vote_average > 0);

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
