import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { TMDB_API_KEY, TMDB_API_URL } from "$env/static/private";

export async function GET({ params, fetch }: RequestEvent) {
  if (!TMDB_API_KEY || !TMDB_API_URL) {
    return json({
      seasons: [],
      error: "TMDB API is not configured"
    }, { status: 200 });
  }

  const { id } = params;

  try {
    const response = await fetch(
      `${TMDB_API_URL}/tv/${id}?api_key=${TMDB_API_KEY}&language=en-US`,
    );

    if (!response.ok) {
      return json({
        seasons: [],
        error: `Failed to fetch TV show details (${response.status})`
      }, { status: 200 });
    }

    const data = await response.json();
    return json({ seasons: data.seasons });
  } catch (err) {
    console.error("Error fetching TV show seasons:", err);
    return json({
      seasons: [],
      error: "Failed to fetch TV show seasons"
    }, { status: 200 });
  }
}
