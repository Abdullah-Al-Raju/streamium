import { error, json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { prisma } from "$lib/server/prisma";

export async function DELETE(event: RequestEvent) {
  const user = event.locals.user;
  if (!user) {
    throw error(401, "Unauthorized");
  }

  const id = event.params.id;
  if (!id) {
    throw error(400, "Comment ID is required");
  }

  const commentId = parseInt(id);
  if (isNaN(commentId) || commentId <= 0) {
    throw error(400, "Invalid comment ID");
  }

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      throw error(404, "Comment not found");
    }

    // Clear authorization: user must own the comment OR be an admin
    const isOwner = comment.userId === user.id;
    if (!isOwner && !user.isAdmin) {
      throw error(403, "You can only delete your own comments");
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: user.isAdmin && !isOwner ? "[Comment removed by moderator]" : "[Comment deleted]",
        flagged: false,
        flagReason: null,
        flaggedAt: null
      }
    });

    return json({ success: true, comment: updatedComment });
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err; // Re-throw SvelteKit errors
    }
    console.error("Error deleting comment:", err);
    throw error(500, "Failed to delete comment");
  }
}
