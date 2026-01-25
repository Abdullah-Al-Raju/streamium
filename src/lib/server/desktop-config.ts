import { z } from "zod";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
const configSchema = z.object({
  TMDB_API_KEY: z.string().optional().default(""),
  TMDB_API_URL: z.string().optional().default("https://api.themoviedb.org/3"),
  TMDB_IMAGE_URL: z.string().optional().default("https://image.tmdb.org/t/p"),
  VIDSRC_BASE_URL: z.string().optional().default("https://vidsrc.cc/v2/embed"),
  VIDLINK_BASE_URL: z.string().optional().default("https://vidlink.pro"),
  MOVIES111_BASE_URL: z.string().optional().default("https://111movies.com"),
  EMBED2_BASE_URL: z.string().optional().default("https://www.2embed.cc"),
  DATABASE_URL: z.string().optional().default(""),
});

export type DesktopConfig = z.infer<typeof configSchema>;

export function isDesktopApp(): boolean {
  return process.env.APP_DESKTOP === "true";
}

function getConfigPath(): string | null {
  return process.env.APP_CONFIG_PATH ?? null;
}

function defaultConfig(): DesktopConfig {
  const dbPath = process.env.APP_DB_PATH;
  const databaseUrl = process.env.DATABASE_URL ?? (dbPath ? `file:${dbPath}` : "");

  return configSchema.parse({
    TMDB_API_KEY: process.env.TMDB_API_KEY ?? "",
    TMDB_API_URL: process.env.TMDB_API_URL ?? "https://api.themoviedb.org/3",
    TMDB_IMAGE_URL: process.env.TMDB_IMAGE_URL ?? "https://image.tmdb.org/t/p",
    VIDSRC_BASE_URL: process.env.VIDSRC_BASE_URL ?? "https://vidsrc.cc/v2/embed",
    VIDLINK_BASE_URL: process.env.VIDLINK_BASE_URL ?? "https://vidlink.pro",
    MOVIES111_BASE_URL: process.env.MOVIES111_BASE_URL ?? "https://111movies.com",
    EMBED2_BASE_URL: process.env.EMBED2_BASE_URL ?? "https://www.2embed.cc",
    DATABASE_URL: databaseUrl,
  });
}

export function loadDesktopConfig(): DesktopConfig {
  const configPath = getConfigPath();
  if (!configPath) {
    return defaultConfig();
  }

  const defaults = defaultConfig();

  if (!existsSync(configPath)) {
    const initial = {
      ...defaults,
    };
    mkdirSync(dirname(configPath), { recursive: true });
    writeFileSync(configPath, JSON.stringify(initial, null, 2));
    return initial;
  }

  const raw = readFileSync(configPath, "utf8");
  let parsed: DesktopConfig;
  try {
    parsed = configSchema.parse(JSON.parse(raw));
  } catch {
    parsed = defaults;
  }

  const merged = {
    ...defaults,
    ...parsed,
  };

  writeFileSync(configPath, JSON.stringify(merged, null, 2));
  applyConfigToEnv(merged);
  return merged;
}

function applyConfigToEnv(config: DesktopConfig): void {
  Object.entries(config).forEach(([key, value]) => {
    if (typeof value === "string") {
      process.env[key] = value;
    }
  });
}

export function saveDesktopConfig(update: Partial<DesktopConfig>): {
  config: DesktopConfig;
  restartRequired: boolean;
} {
  const configPath = getConfigPath();
  const current = loadDesktopConfig();
  const next = {
    ...current,
    ...configSchema.partial().parse(update),
  };

  const restartRequired = Boolean(
    next.DATABASE_URL && next.DATABASE_URL !== current.DATABASE_URL,
  );

  if (configPath) {
    writeFileSync(configPath, JSON.stringify(next, null, 2));
  }

  applyConfigToEnv(next);

  return { config: next, restartRequired };
}
