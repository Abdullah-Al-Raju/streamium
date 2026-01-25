import type { ServerLoad } from "@sveltejs/kit";

export const load: ServerLoad = async () => {
  return {
    desktop: process.env.APP_DESKTOP === "true",
  };
};
