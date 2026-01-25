import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { getSession } from "$lib/server/auth";
import { validateComment } from "$lib/shared/comment-validation";
import { commentService } from "$lib/server/services/comments";
import { commentRateLimit } from "$lib/server/services/rate-limit";
import { handleDatabaseError } from "$lib/server/services/db-error";
import { z } from 'zod';

const mediaTypeSchema = z.enum(['movie', 'tv']);
const commentSchema = z.object({
  mediaId: z.number().int().positive(),
  mediaType: mediaTypeSchema,
  content: z.string().min(1).max(1000),
  parentId: z.number().int().positive().nullable().optional(),
  season: z.number().int().min(1).max(100).optional(),
  episode: z.number().int().min(1).max(2000).optional(),
});

function validateNumericInput(value: string | null, min: number, max: number): number | null {
  if (!value) return null;
  const num = parseInt(value);
  if (isNaN(num) || num < min || num > max) return null;
  return num;
}

function checkQueryComplexity(params: URLSearchParams): boolean {
  const complexityScore =
    (params.has('mediaId') ? 1 : 0) +
    (params.has('mediaType') ? 1 : 0) +
    (params.has('season') ? 2 : 0) +
    (params.has('episode') ? 2 : 0);

  return complexityScore <= 6;
}

export async function GET({ url, cookies, getClientAddress }: RequestEvent) {
  try {
    const clientIp = getClientAddress();
    if (!checkRateLimit(clientIp)) {
      return json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    if (!checkQueryComplexity(url.searchParams)) {
      return json({ error: "Query too complex" }, { status: 400 });
    }

    const rawMediaId = url.searchParams.get("mediaId");
    const rawMediaType = url.searchParams.get("mediaType");
    const rawPage = url.searchParams.get("page") || "1";
    const rawLimit = url.searchParams.get("limit") || "10";
    const rawParentId = url.searchParams.get("parentId");

    const mediaId = validateNumericInput(rawMediaId, 1, Number.MAX_SAFE_INTEGER);
    if (!mediaId) {
      return json({ error: "Invalid Media ID" }, { status: 400 });
    }

    const mediaTypeResult = mediaTypeSchema.safeParse(rawMediaType);
    if (!mediaTypeResult.success) {
      return json({ error: "Invalid media type" }, { status: 400 });
    }
    const mediaType = mediaTypeResult.data;

    const page = validateNumericInput(rawPage, 1, 1000) || 1;
    const limit = validateNumericInput(rawLimit, 1, 100) || 10;
    const parentId = validateNumericInput(rawParentId, 1, Number.MAX_SAFE_INTEGER);

    const session = await getSession(cookies);
    const userId = session?.userId;

    const { comments, total } = await commentService.getComments(
      mediaId,
      mediaType,
      userId,
      parentId,
      page,
      limit
    );

    return json({
      comments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleDatabaseError(error, "fetch comments");
  }
}

export async function POST({ request, cookies, getClientAddress }: RequestEvent) {
  try {
    const clientIp = getClientAddress();
    if (!checkRateLimit(clientIp)) {
      return json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const session = await getSession(cookies);
    if (!session?.userId) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = commentSchema.safeParse(body);
    if (!validationResult.success) {
      return json({ error: "Invalid request data", details: validationResult.error }, { status: 400 });
    }

    const { content, mediaId, mediaType, parentId } = validationResult.data;

    const contentValidation = validateComment(content);
    if (!contentValidation.isValid) {
      return json({ error: contentValidation.error || "Invalid comment content" }, { status: 400 });
    }

    const comment = await commentService.createComment({
      userId: session.userId,
      mediaId,
      mediaType,
      content,
      parentId,
    });

    return json(comment);
  } catch (error) {
    return handleDatabaseError(error, "create comment");
  }
}

export async function DELETE({ url, cookies, getClientAddress }: RequestEvent) {
  try {
    const clientIp = getClientAddress();
    if (!checkRateLimit(clientIp)) {
      return json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const session = await getSession(cookies);
    if (!session?.userId) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const commentId = validateNumericInput(url.searchParams.get("id"), 1, Number.MAX_SAFE_INTEGER);
    if (!commentId) {
      return json({ error: "Invalid comment ID" }, { status: 400 });
    }

    await commentService.deleteComment(commentId, session.userId);
    return json({ success: true });
  } catch (error) {
    return handleDatabaseError(error, "delete comment");
  }
}

function checkRateLimit(ip: string): boolean {
  return commentRateLimit.checkRateLimit(ip);
}
