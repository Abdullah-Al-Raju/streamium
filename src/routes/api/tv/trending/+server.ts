import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

export async function GET({ fetch }: RequestEvent) {
  const tmdbApiKey = env.TMDB_API_KEY;
  const tmdbApiUrl = env.TMDB_API_URL;

  if (!tmdbApiKey || !tmdbApiUrl) {
    return json({
      results: [],
      error: "TMDB API is not configured"
    }, { status: 200 });
  }

  try {
    const response = await fetch(
      `${tmdbApiUrl}/trending/tv/week?api_key=${tmdbApiKey}&language=en-US`,
    );

    if (!response.ok) {
      return json({
        results: [],
        error: `Failed to fetch trending TV shows (${response.status})`
      }, { status: 200 });
    }

    const data = await response.json();
    return json(data);
  } catch (err) {
    console.error("Error fetching trending TV shows:", err);
    return json({
      results: [],
      error: "Failed to fetch trending TV shows"
    }, { status: 200 });
  }
}
