import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  air_date: string;
  still_path: string | null;
  vote_average: number;
  vote_count: number;
  runtime: number | null;
}

interface SeasonResponse {
  episodes: Episode[];
}

export async function GET({ params, fetch }: RequestEvent) {
  const tmdbApiKey = env.TMDB_API_KEY;
  const tmdbApiUrl = env.TMDB_API_URL;

  if (!tmdbApiKey || !tmdbApiUrl) {
    return json({
      episodes: [],
      error: "TMDB API is not configured"
    }, { status: 200 });
  }

  const { id, season } = params;

  try {
    const response = await fetch(
      `${tmdbApiUrl}/tv/${id}/season/${season}?api_key=${tmdbApiKey}&language=en-US`,
    );

    if (!response.ok) {
      return json({
        episodes: [],
        error: `Failed to fetch season details (${response.status})`
      }, { status: 200 });
    }

    const data: SeasonResponse = await response.json();

    const currentDate = new Date();
    const episodes = data.episodes.filter((episode: Episode) => {
      const airDate = new Date(episode.air_date);
      return airDate <= currentDate;
    });

    return json({ episodes });
  } catch (err) {
    console.error("Error fetching season episodes:", err);
    return json({
      episodes: [],
      error: "Failed to fetch season episodes"
    }, { status: 200 });
  }
}
