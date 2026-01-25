import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { authService } from "$lib/server/services/auth";
import { createSessionCookie } from "$lib/server/auth";
import { RateLimitService } from "$lib/server/services/rate-limit";
import { handleDatabaseError } from "$lib/server/services/db-error";
import { dev } from "$app/environment";

export async function POST({ request, getClientAddress }: RequestEvent) {
  const clientIp = getClientAddress();

  const rateLimit = RateLimitService.checkLoginLimit(clientIp);
  if (!rateLimit.allowed) {
    return json(
      { error: `Too many login attempts. Please try again in ${Math.ceil(rateLimit.timeLeft! / 60)} minutes.` },
      { status: 429 }
    );
  }

  try {
    const { usernameOrEmail, password } = await request.json();

    if (!usernameOrEmail || !password) {
      return json({ error: "Username/Email and password are required" }, { status: 400 });
    }

    const user = await authService.validateUser(usernameOrEmail, password);
    if (!user) {
      return json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await authService.generateToken(user);
    const isProduction = !dev;

    return json(user, {
      headers: {
        "Set-Cookie": createSessionCookie(token, isProduction),
      },
    });
  } catch (error) {
    return handleDatabaseError(error, "login");
  }
}
