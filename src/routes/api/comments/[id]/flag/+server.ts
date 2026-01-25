import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { prisma } from "$lib/server/prisma";
import { getSession } from "$lib/server/auth";
import { handleDatabaseError } from "$lib/server/services/db-error";
import { z } from "zod";

const flagSchema = z.object({
  reason: z.string().max(500).optional(),
});

export async function POST({ params, request, cookies }: RequestEvent) {
  try {
    const session = await getSession(cookies);
    if (!session?.userId) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params.id;
    if (!id) {
      return json({ error: "Comment ID is required" }, { status: 400 });
    }

    const commentId = parseInt(id);
    if (isNaN(commentId) || commentId <= 0) {
      return json({ error: "Invalid comment ID" }, { status: 400 });
    }

    const body = await request.json();
    const validation = flagSchema.safeParse(body);
    if (!validation.success) {
      return json({ error: "Invalid flag reason" }, { status: 400 });
    }
    const { reason } = validation.data;


    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!existingComment) {
      return json({ error: "Comment not found" }, { status: 404 });
    }

    if (existingComment.flagged) {
      return json({ error: "Comment is already flagged" }, { status: 400 });
    }


    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        flagged: true,
        flagReason: reason || "No reason provided",
        flaggedAt: new Date()
      }
    });

    return json({
      success: true,
      comment: updatedComment
    });
  } catch (error) {
    return handleDatabaseError(error, "flag comment");
  }
}

export async function DELETE({ params, cookies }: RequestEvent) {
  try {
    const session = await getSession(cookies);
    if (!session?.userId) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId }
    });

    if (!user?.isAdmin) {
      return json({ error: "Unauthorized" }, { status: 403 });
    }

    const id = params.id;
    if (!id) {
      return json({ error: "Comment ID is required" }, { status: 400 });
    }

    const commentId = parseInt(id);
    if (isNaN(commentId)) {
      return json({ error: "Invalid comment ID" }, { status: 400 });
    }


    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        flagged: false,
        flagReason: null,
        flaggedAt: null
      }
    });

    return json({
      success: true,
      comment: updatedComment
    });
  } catch (error) {
    return handleDatabaseError(error, "unflag comment");
  }
}
