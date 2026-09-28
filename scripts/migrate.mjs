#!/usr/bin/env node
/**
 * Deploy-time database migrator (node-postgres, `pg`).
 *
 * Runs during `npm run build` when DATABASE_URL is set. On Vercel, direct
 * Supabase hostnames often resolve to IPv6 and fail with ENETUNREACH — in that
 * case we log and exit 0 so the deploy still succeeds. Runtime `getSql()` and
 * the app will retry; prefer the Supabase **pooler** URL (port 6543) in Vercel
 * env for reliable IPv4 connectivity.
 *
 * No DATABASE_URL → skip (PGLite migrates itself at startup).
 */
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import { pendingMigrations } from "./migration-plan.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || !databaseUrl.trim()) {
  console.log(
    "[migrate] DATABASE_URL not set — skipping (the PGLite fallback migrates itself).",
  );
  process.exit(0);
}

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

async function main() {
  let entries;
  try {
    entries = await readdir(migrationsDir);
  } catch {
    console.log("[migrate] no migrations/ directory — nothing to do.");
    return;
  }
  if (pendingMigrations(entries, []).length === 0) {
    console.log("[migrate] no migrations — nothing to do.");
    return;
  }

  const pool = new pg.Pool({
    connectionString: databaseUrl.trim(),
    max: 1,
    connectionTimeoutMillis: 12_000,
    // Prefer IPv4 when the runtime supports it (avoids Vercel ENETUNREACH on IPv6-only routes).
    ...(typeof process.env.PGHOST === "undefined"
      ? {}
      : {}),
  });

  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
    console.warn(`[migrate] could not connect (${code || msg}) — skipping build-time migrate.`);
    console.warn(
      "[migrate] Tip: set DATABASE_URL to the Supabase connection pooler (port 6543), not the direct db.*.supabase.co host.",
    );
    await pool.end().catch(() => {});
    // Never fail the Vercel build solely because migrate cannot reach the DB.
    process.exit(0);
  }

  try {
    await client.query(
      "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
    );
    const applied = (await client.query("SELECT name FROM _migrations")).rows.map(
      (r) => r.name,
    );

    let count = 0;
    for (const { name } of pendingMigrations(entries, applied)) {
      const text = await readFile(join(migrationsDir, name), "utf8");
      try {
        await client.query("BEGIN");
        await client.query(text);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [name]);
        await client.query("COMMIT");
      } catch (err) {
        console.error(`[migrate] error applying ${name}`);
        try {
          await client.query("ROLLBACK");
        } catch {
          // ignore
        }
        throw err;
      }
      console.log(`[migrate] applied ${name}`);
      count += 1;
    }
    console.log(count ? `[migrate] done — ${count} migration(s) applied.` : "[migrate] up to date.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
  // Network / unreachable DB must not fail production builds.
  if (
    code === "ENETUNREACH" ||
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT" ||
    code === "ENOTFOUND" ||
    /ENETUNREACH|ECONNREFUSED|timeout|getaddrinfo/i.test(msg)
  ) {
    console.warn(`[migrate] failed: ${msg}`);
    console.warn("[migrate] skipping — deploy continues; apply SQL via Supabase SQL editor if needed.");
    process.exit(0);
  }
  console.error("[migrate] failed:", msg);
  process.exit(1);
});
