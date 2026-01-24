import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { authService } from "$lib/server/services/auth";
import { RateLimitService } from "$lib/server/services/rate-limit";

export async function POST({ request }: RequestEvent) {
  const { identifier } = await request.json();

  if (!identifier) {
    return json({ error: "Username or email is required" }, { status: 400 });
  }

  const rateLimit = RateLimitService.checkPasswordResetLimit(identifier);
  if (!rateLimit.allowed) {
    return json({
      error: `Too many reset attempts. Please try again in ${Math.ceil(rateLimit.timeLeft! / 60)} minutes.`
    }, { status: 429 });
  }

  try {
    const resetToken = await authService.createResetToken(identifier);
    if (!resetToken) {
      return json({
        message: "If an account exists with this username/email, password reset instructions will be sent"
      });
    }

    const user = await authService.findUserByIdentifier(identifier);
    if (!user?.email) {
      return json({
        message: "If an account exists with this username/email, password reset instructions will be sent"
      });
    }

    return json({
      message: "If an account exists with this username/email, password reset instructions will be sent"
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return json(
      {
        error: "An error occurred while processing your request"
      },
      { status: 500 },
    );
  }
}
