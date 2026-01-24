import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { authService } from "$lib/server/services/auth";
import { RateLimitService } from "$lib/server/services/rate-limit";

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export async function POST({ request }: RequestEvent) {
  const { token, newPassword } = await request.json();

  if (!token || !newPassword) {
    return json(
      { error: "Token and new password are required" },
      { status: 400 },
    );
  }

  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    return json(
      { error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long` },
      { status: 400 },
    );
  }

  if (!PASSWORD_REGEX.test(newPassword)) {
    return json(
      { error: "Password must contain at least one uppercase letter, one lowercase letter, and one number" },
      { status: 400 },
    );
  }

  const rateLimit = RateLimitService.checkPasswordResetLimit(token);
  if (!rateLimit.allowed) {
    return json({
      error: `Too many attempts. Please try again in ${Math.ceil(rateLimit.timeLeft! / 60)} minutes.`
    }, { status: 429 });
  }

  try {
    const userId = await authService.validateResetToken(token);
    if (!userId) {
      return json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 }
      );
    }

    await authService.updatePassword(userId, newPassword);
    await authService.clearResetToken(userId);

    return json({ message: "Your password has been successfully reset" });
  } catch (error) {
    console.error("Password reset error:", error);
    return json(
      {
        error: "An error occurred while resetting your password. Please try again."
      },
      { status: 500 },
    );
  }
}
