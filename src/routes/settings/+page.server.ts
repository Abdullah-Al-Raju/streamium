import type { PageServerLoad } from "./$types";
import { isDesktopApp, loadDesktopConfig } from "$lib/server/desktop-config";

export const load: PageServerLoad = async () => {
  const desktop = isDesktopApp();
  return {
    desktop,
    config: desktop ? loadDesktopConfig() : null,
  };
};
