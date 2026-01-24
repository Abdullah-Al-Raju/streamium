import { error, json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { prisma } from "$lib/server/prisma";

function escapeLikePattern(pattern: string): string {
  return pattern.replace(/[%_\\]/g, '\\$&');
}

export async function GET({ url, locals }: RequestEvent) {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }

  const query = url.searchParams.get("q");
  if (!query) {
    throw error(400, "Query parameter is required");
  }

  if (query.length > 50) {
    throw error(400, "Query too long");
  }

  try {
    const escapedQuery = escapeLikePattern(query);
    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: escapedQuery,
        },
        NOT: {
          id: locals.user.id,
        },
      },
      select: {
        id: true,
        username: true,
      },
      orderBy: {
        username: 'asc',
      },
      take: 5,
    });

    return json(users);
  } catch (err) {
    console.error("Error searching users:", err);
    throw error(500, "Failed to search users");
  }
}
