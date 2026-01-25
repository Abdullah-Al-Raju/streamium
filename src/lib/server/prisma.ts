import { PrismaClient as PrismaClientMysql } from "@prisma/client";
import { createRequire } from "node:module";
import path from "node:path";
import { isDesktopApp, loadDesktopConfig } from "$lib/server/desktop-config";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientMysql };
const require = createRequire(import.meta.url);

function getPrismaClientCtor() {
  if (isDesktopApp() && process.env.APP_CONFIG_PATH) {
    loadDesktopConfig();
  }

  if (process.env.APP_DESKTOP === "true") {
    const clientPath = path.resolve(process.cwd(), "prisma/generated/sqlite");
    try {
      const { PrismaClient: PrismaClientSqlite } = require(clientPath) as {
        PrismaClient: typeof PrismaClientMysql;
      };
      return PrismaClientSqlite;
    } catch (error) {
      throw new Error(
        "SQLite Prisma client not found. Run `pnpm desktop:prisma` before launching the desktop app.",
      );
    }
  }

  return PrismaClientMysql;
}

const PrismaClientCtor = getPrismaClientCtor();
export const prisma = globalForPrisma.prisma ?? new PrismaClientCtor();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
