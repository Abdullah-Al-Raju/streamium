import type { Handle } from "@sveltejs/kit";
import { dev } from "$app/environment";
import crypto from "node:crypto";
import { isDesktopApp, loadDesktopConfig } from "$lib/server/desktop-config";

let desktopConfigLoaded = false;

function ensureDesktopConfig(): void {
  if (desktopConfigLoaded) return;
  if (!isDesktopApp()) return;
  loadDesktopConfig();
  desktopConfigLoaded = true;
}

function setSecurityHeaders(response: Response, nonce: string): void {
  const isDev = dev;

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; " +
      (isDev
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        : `script-src 'self' 'nonce-${nonce}'; `) +
      (isDev
        ? "style-src 'self' 'unsafe-inline'; "
        : `style-src 'self' 'nonce-${nonce}'; `) +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "frame-src 'self' " +
      "https://vidsrc.cc/ https://*.vidsrc.cc/ " +
      "https://vidplay.site/ https://*.vidplay.site/ " +
      "https://vidplay.online/ https://*.vidplay.online/ " +
      "https://vidlink.pro/ https://*.vidlink.pro/ " +
      "https://111movies.com/ https://*.111movies.com/ " +
      "https://2embed.cc/ https://*.2embed.cc/;"
  );
}

export const handle: Handle = async ({ event, resolve }) => {
  ensureDesktopConfig();
  const nonce = crypto.randomBytes(16).toString("base64");

  const response = await resolve(event, {
    transformPageChunk: ({ html }) =>
      html
        .replace(/<script(?![^>]*nonce=)/g, `<script nonce="${nonce}"`)
        .replace(/<style(?![^>]*nonce=)/g, `<style nonce="${nonce}"`),
  });
  setSecurityHeaders(response, nonce);

  return response;
};
