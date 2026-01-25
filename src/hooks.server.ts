import type { Handle } from "@sveltejs/kit";
import { getSession } from "$lib/server/auth";
import { prisma } from "$lib/server/prisma";

const ADMIN_RATE_LIMIT = 100;
const ADMIN_RATE_WINDOW = 5 * 60 * 1000;
const adminRateLimits = new Map<string, { count: number; firstAttempt: number }>();

function checkAdminRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = adminRateLimits.get(ip);

  if (!limit) {
    adminRateLimits.set(ip, { count: 1, firstAttempt: now });
    return true;
  }

  if (now - limit.firstAttempt >= ADMIN_RATE_WINDOW) {
    adminRateLimits.set(ip, { count: 1, firstAttempt: now });
    return true;
  }

  if (limit.count >= ADMIN_RATE_LIMIT) {
    return false;
  }

  limit.count++;
  adminRateLimits.set(ip, limit);
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, limit] of adminRateLimits.entries()) {
    if (now - limit.firstAttempt >= ADMIN_RATE_WINDOW) {
      adminRateLimits.delete(key);
    }
  }
}, ADMIN_RATE_WINDOW);

function setSecurityHeaders(response: Response): void {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "frame-src 'self' " +
    "https://vidsrc.cc/ https://*.vidsrc.cc/ " +
    "https://moviesapi.club/ https://*.moviesapi.club/ " +
    "https://vidsrc-embed.ru/ https://*.vidsrc-embed.ru/ " +
    "https://godriveplayer.com/ https://*.godriveplayer.com/ " +
    "https://vidplay.site/ https://*.vidplay.site/ " +
    "https://vidplay.online/ https://*.vidplay.online/ " +
    "https://filemoon.sx/ https://*.filemoon.sx/ " +
    "https://hydrax.net/ https://*.hydrax.net/;"
  );
}

export const handle: Handle = async ({ event, resolve }) => {
  const isAdminRoute = event.url.pathname.startsWith('/admin');

  // Authenticate user BEFORE resolving the request
  try {
    const session = await getSession(event.cookies);

    if (session?.userId) {
      const user = await prisma.user.findUnique({
        where: {
          id: session.userId,
        },
        select: {
          id: true,
          username: true,
          email: true,
          isAdmin: true,
        },
      });

      if (user) {
        event.locals.user = {
          id: user.id,
          username: user.username,
          email: user.email || '',
          isAdmin: user.isAdmin,
        };

        if (isAdminRoute) {
          if (!user.isAdmin) {
            const response = new Response('Unauthorized', { status: 403 });
            setSecurityHeaders(response);
            return response;
          }

          const clientIp = event.getClientAddress();
          if (!checkAdminRateLimit(clientIp)) {
            const response = new Response('Too Many Requests', { status: 429 });
            setSecurityHeaders(response);
            return response;
          }
        }
      } else {
        event.cookies.delete("session", { path: "/" });

        if (isAdminRoute) {
          const response = new Response('Unauthorized', { status: 403 });
          setSecurityHeaders(response);
          return response;
        }
      }
    } else if (isAdminRoute) {
      const response = new Response('Unauthorized', { status: 403 });
      setSecurityHeaders(response);
      return response;
    }
  } catch (error) {
    event.cookies.delete("session", { path: "/" });
    console.error("Session validation error:", error);

    if (isAdminRoute) {
      const response = new Response('Unauthorized', { status: 403 });
      setSecurityHeaders(response);
      return response;
    }
  }

  // Only resolve AFTER auth checks pass
  const response = await resolve(event);
  setSecurityHeaders(response);

  return response;
};
