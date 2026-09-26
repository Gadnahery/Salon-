import pg from "pg";

const DEFAULT_URL =
  "postgresql://postgres.xkhcwokuxhhchdhqjbyn:" +
  encodeURIComponent("Jethro@12dick@") +
  "@aws-1-eu-west-1.pooler.supabase.com:6543/postgres";

let pool: pg.Pool | null = null;

function connectionString() {
  return process.env.SUPABASE_DB_URL?.trim() || DEFAULT_URL;
}

function getPool() {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: connectionString(),
      max: 2,
      ssl: { rejectUnauthorized: false },
      idleTimeoutMillis: 10_000,
    });
  }
  return pool;
}

export async function supabaseQuery<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<{ ok: true; rows: T[] } | { ok: false }> {
  try {
    const result = await getPool().query(text, params);
    return { ok: true, rows: result.rows as T[] };
  } catch {
    return { ok: false };
  }
}
