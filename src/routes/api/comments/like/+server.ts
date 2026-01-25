import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { prisma } from "$lib/server/prisma";
import { getSession } from "$lib/server/auth";
import { RateLimitService } from "$lib/server/services/rate-limit";
import { handleDatabaseError } from "$lib/server/services/db-error";
import { z } from "zod";

const likeSchema = z.object({
  commentId: z.number().int().positive(),
});

export async function POST({ request, cookies }: RequestEvent) {
  try {
    const session = await getSession(cookies);
    if (!session?.userId) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit likes to prevent spam
    const rateLimit = RateLimitService.checkLikeLimit(session.userId);
    if (!rateLimit.allowed) {
      return json(
        { error: `Too many likes. Please try again in ${rateLimit.timeLeft} seconds.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = likeSchema.safeParse(body);
    if (!validation.success) {
      return json({ error: "Invalid comment ID" }, { status: 400 });
    }
    const { commentId } = validation.data;


    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return json({ error: "Comment not found" }, { status: 404 });
    }


    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: session.userId,
          commentId,
        },
      },
    });

    if (existingLike) {

      await prisma.commentLike.delete({
        where: {
          userId_commentId: {
            userId: session.userId,
            commentId,
          },
        },
      });
    } else {

      await prisma.commentLike.create({
        data: {
          userId: session.userId,
          commentId,
        },
      });
    }


    const updatedComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    return json({
      isLiked: !existingLike,
      likeCount: updatedComment?._count.likes || 0,
    });
  } catch (err) {
    return handleDatabaseError(err, "toggle like");
  }
}

export async function GET({ url, cookies }: RequestEvent) {
  try {
    const session = await getSession(cookies);
    if (!session?.userId) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawCommentId = url.searchParams.get("commentId");
    if (!rawCommentId) {
      return json({ error: "Comment ID is required" }, { status: 400 });
    }

    const commentId = parseInt(rawCommentId, 10);
    if (isNaN(commentId) || commentId <= 0) {
      return json({ error: "Invalid comment ID" }, { status: 400 });
    }

    const like = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: session.userId,
          commentId,
        },
      },
    });

    const likeCount = await prisma.commentLike.count({
      where: {
        commentId,
      },
    });

    return json({
      isLiked: !!like,
      likeCount,
    });
  } catch (err) {
    return handleDatabaseError(err, "check like status");
  }
}
