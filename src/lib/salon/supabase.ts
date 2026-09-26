export const SUPABASE_URL = "https://xkhcwokuxhhchdhqjbyn.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhraGN3b2t1eGhoY2hkaHFqYnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNTMyMjAsImV4cCI6MjEwNTkyOTIyMH0.ETrTW4Z9dBoRX76qxmGzPjYBEWntlRjwrNe7puVMhy8";

const url = () =>
  (typeof process !== "undefined" ? process.env.VITE_SUPABASE_URL : undefined) ||
  (typeof import.meta !== "undefined" ? import.meta.env.VITE_SUPABASE_URL : undefined) ||
  SUPABASE_URL;

const key = () =>
  (typeof process !== "undefined" ? process.env.VITE_SUPABASE_ANON_KEY : undefined) ||
  (typeof import.meta !== "undefined" ? import.meta.env.VITE_SUPABASE_ANON_KEY : undefined) ||
  SUPABASE_ANON_KEY;

export function supabaseConfigured() {
  return Boolean(url() && key());
}

export async function supabaseUpsert(table: string, row: Record<string, unknown>, onConflict = "id") {
  const base = url();
  const anon = key();
  if (!base || !anon) return { ok: false as const, skipped: true as const };
  try {
    const res = await fetch(`${base}/rest/v1/${table}?on_conflict=${onConflict}`, {
      method: "POST",
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false as const, status: res.status, text };
    }
    return { ok: true as const };
  } catch {
    return { ok: false as const };
  }
}

export async function supabaseSelect<T>(table: string, query = "select=*"): Promise<T[]> {
  const base = url();
  const anon = key();
  if (!base || !anon) return [];
  try {
    const res = await fetch(`${base}/rest/v1/${table}?${query}`, {
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
      },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as T[];
    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}
