import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { watchlistService } from "$lib/server/services/watchlist";
import { handleDatabaseError } from "$lib/server/services/db-error";
import { z } from "zod";

const mediaTypeSchema = z.enum(["movie", "tv"]);

const addToWatchlistSchema = z.object({
  mediaId: z.number().int().positive(),
  mediaType: mediaTypeSchema,
  title: z.string().min(1).max(500),
  posterPath: z.string().max(500).nullable().optional(),
  voteAverage: z.number().min(0).max(10).optional().default(0),
});

const removeFromWatchlistSchema = z.object({
  mediaId: z.number().int().positive(),
  mediaType: mediaTypeSchema,
});

export async function GET({ locals }: RequestEvent) {
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await watchlistService.getWatchlist(locals.user.id);
    const total = await watchlistService.getWatchlistCount(locals.user.id);
    return json({ items, total });
  } catch (err) {
    return handleDatabaseError(err, "fetch watchlist");
  }
}

export async function POST({ request, locals }: RequestEvent) {
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = addToWatchlistSchema.safeParse(body);

    if (!validation.success) {
      return json(
        { error: "Invalid request data", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { mediaId, mediaType, title, posterPath, voteAverage } = validation.data;

    const watchlistItem = await watchlistService.addToWatchlist(
      locals.user.id,
      mediaId,
      mediaType,
      title,
      posterPath ?? null,
      voteAverage,
    );

    return json(watchlistItem);
  } catch (err) {
    return handleDatabaseError(err, "add to watchlist");
  }
}

export async function DELETE({ request, locals }: RequestEvent) {
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = removeFromWatchlistSchema.safeParse(body);

    if (!validation.success) {
      return json(
        { error: "Invalid request data", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { mediaId, mediaType } = validation.data;

    await watchlistService.removeFromWatchlist(
      locals.user.id,
      mediaId,
      mediaType,
    );

    return json({ message: "Item removed from watchlist" });
  } catch (err) {
    return handleDatabaseError(err, "remove from watchlist");
  }
}
