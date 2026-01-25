import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const dbPath = resolve("desktop/assets/streamium.db");
const schemaPath = resolve("scripts/desktop-schema.sql");

if (existsSync(dbPath)) {
  rmSync(dbPath);
}

const schemaSql = readFileSync(schemaPath, "utf8");
const result = spawnSync("sqlite3", [dbPath], {
  input: schemaSql,
  stdio: ["pipe", "inherit", "inherit"],
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
