import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

export async function GET({ params, fetch }: RequestEvent) {
  const tmdbApiKey = env.TMDB_API_KEY;
  const tmdbApiUrl = env.TMDB_API_URL;

  if (!tmdbApiKey || !tmdbApiUrl) {
    return json({
      seasons: [],
      error: "TMDB API is not configured"
    }, { status: 200 });
  }

  const { id } = params;

  try {
    const response = await fetch(
      `${tmdbApiUrl}/tv/${id}?api_key=${tmdbApiKey}&language=en-US`,
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
