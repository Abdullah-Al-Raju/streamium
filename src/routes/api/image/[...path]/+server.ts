import { error } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { TMDB_IMAGE_URL } from "$env/static/private";

export async function GET({ params, fetch }: RequestEvent) {
  if (!TMDB_IMAGE_URL) {
    throw error(500, "TMDB image URL not configured");
  }

  const path = params.path;
  if (!path) {
    throw error(400, "Image path is required");
  }

  const [size, ...imagePath] = path.split("/");
  const actualPath = imagePath.join("/");

  if (!actualPath) {
    throw error(400, "Invalid image path");
  }

  try {
    const imageUrl = `${TMDB_IMAGE_URL}/${size}${actualPath.startsWith("/") ? actualPath : "/" + actualPath}`;
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
    console.error("Image proxy error:", err);
    throw error(500, "Failed to load image");
  }
}
