import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { clearSessionCookie } from "$lib/server/auth";

export async function POST(_event: RequestEvent) {
  try {
    return json(
      { success: true },
      {
        headers: {
          "Set-Cookie": clearSessionCookie(),
        },
      },
    );
  } catch (error) {
    console.error("Logout error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
