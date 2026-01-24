import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { authService } from "$lib/server/services/auth";
import { createSessionCookie } from "$lib/server/auth";
import { RateLimitService } from "$lib/server/services/rate-limit";

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export async function POST({ request, getClientAddress }: RequestEvent) {
  const clientIp = getClientAddress();

  const rateLimit = RateLimitService.checkRegisterLimit(clientIp);
  if (!rateLimit.allowed) {
    return json(
      { error: `Too many registration attempts. Please try again in ${Math.ceil(rateLimit.timeLeft! / 60)} minutes.` },
      { status: 429 }
    );
  }

  try {
    const { username, email, password } = await request.json();

    if (!username || !password) {
      return json({ error: "Username and password are required" }, { status: 400 });
    }

    if (username.length < 3 || username.length > 15) {
      return json({ error: "Username must be between 3 and 15 characters" }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return json({ error: "Username can only contain letters, numbers, and underscores" }, { status: 400 });
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return json({ error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` }, { status: 400 });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return json({ error: "Password must contain at least one uppercase letter, one lowercase letter, and one number" }, { status: 400 });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Invalid email format" }, { status: 400 });
    }

    const existingUser = await authService.findUserByIdentifier(email || username);
    if (existingUser) {
      if (email && existingUser.email === email) {
        return json({ error: "Email already registered" }, { status: 400 });
      }
      if (existingUser.username === username) {
        return json({ error: "Username already taken" }, { status: 400 });
      }
    }

    const user = await authService.createUser(username, email, password);
    const token = await authService.generateToken(user);
    const isProduction = process.env.NODE_ENV === 'production';

    return json(user, {
      headers: {
        "Set-Cookie": createSessionCookie(token, isProduction),
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
