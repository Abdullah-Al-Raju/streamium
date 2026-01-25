import { error } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

// Allowed image sizes from TMDB
const ALLOWED_SIZES = new Set([
  'w45', 'w92', 'w154', 'w185', 'w300', 'w342', 'w500', 'w780',
  'w1280', 'h632', 'original'
]);

// Image path pattern: alphanumeric, underscore, hyphen, and dots only
const PATH_PATTERN = /^[a-zA-Z0-9_\-./]+$/;

export async function GET({ params, fetch }: RequestEvent) {
  const tmdbImageUrl = env.TMDB_IMAGE_URL;

  if (!tmdbImageUrl) {
    throw error(500, "TMDB image URL not configured");
  }

  const path = params.path;
  if (!path) {
    throw error(400, "Image path is required");
  }

  const [size, ...imagePath] = path.split("/");
  const actualPath = imagePath.join("/");

  // Validate size against allowlist
  if (!ALLOWED_SIZES.has(size)) {
    throw error(400, "Invalid image size");
  }

  if (!actualPath) {
    throw error(400, "Invalid image path");
  }

  // Sanitize path - prevent path traversal
  if (actualPath.includes('..') || !PATH_PATTERN.test(actualPath)) {
    throw error(400, "Invalid image path");
  }

  try {
    const imageUrl = `${tmdbImageUrl}/${size}${actualPath.startsWith("/") ? actualPath : "/" + actualPath}`;
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw error(response.status, "Failed to fetch image");
    }

    const contentType = response.headers.get("Content-Type");
    const headers = new Headers();
    headers.set("Content-Type", contentType || "image/jpeg");
    headers.set("Cache-Control", "public, max-age=31536000");

    return new Response(response.body, {
      status: 200,
      headers,
    });
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err; // Re-throw SvelteKit errors
    }
    console.error("Image proxy error:", err);
    throw error(500, "Failed to load image");
  }
}
