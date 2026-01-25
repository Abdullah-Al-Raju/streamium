import { json, error } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { isDesktopApp, loadDesktopConfig, saveDesktopConfig } from "$lib/server/desktop-config";

export async function GET() {
  if (!isDesktopApp()) {
    throw error(404, "Not found");
  }

  return json(loadDesktopConfig());
}

export async function PUT({ request }: RequestEvent) {
  if (!isDesktopApp()) {
    throw error(404, "Not found");
  }

  const body = await request.json();
  const { config, restartRequired } = saveDesktopConfig(body);

  return json({
    config,
    restartRequired,
  });
}
