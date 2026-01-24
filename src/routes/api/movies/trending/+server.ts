import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { TMDB_API_KEY, TMDB_API_URL } from "$env/static/private";

export async function GET({ fetch }: RequestEvent) {
  if (!TMDB_API_KEY || !TMDB_API_URL) {
    return json({
      results: [],
      error: "TMDB API is not configured"
    }, { status: 200 });
  }

  try {
    const response = await fetch(
      `${TMDB_API_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&language=en-US`,
    );

    if (!response.ok) {
      return json({
        results: [],
        error: `Failed to fetch trending movies (${response.status})`
      }, { status: 200 });
    }

    const data = await response.json();
    return json(data);
  } catch (err) {
    console.error("Error fetching trending movies:", err);
    return json({
      results: [],
      error: "Failed to fetch trending movies"
    }, { status: 200 });
  }
}
