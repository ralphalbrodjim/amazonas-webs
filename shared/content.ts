import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./supabase.config";

export type ContentRow = {
  site: string;
  kind: string;
  id: string;
  data: unknown;
  sort: number;
  active: boolean;
};

function cacheKey(site: string): string {
  return "content-cache-" + site;
}

function readCache(site: string): ContentRow[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(site));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed as ContentRow[] : null;
  } catch {
    return null;
  }
}

function writeCache(site: string, rows: ContentRow[]) {
  try { localStorage.setItem(cacheKey(site), JSON.stringify(rows)); } catch { /* sin almacenamiento */ }
}

/** rows === null means "use the bundled fallback" (empty table, or offline with no cache). */
export function watchContent(site: "chef" | "semana", onChange: (rows: ContentRow[] | null) => void): () => void {
  let stopped = false;
  const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  async function load() {
    const { data, error } = await client.from("content").select("site,kind,id,data,sort,active").eq("site", site).eq("active", true).order("sort", { ascending: true });
    if (stopped) return;
    if (error || !data) {
      onChange(readCache(site));
      return;
    }
    if (data.length === 0) {
      try { localStorage.removeItem(cacheKey(site)); } catch { /* sin almacenamiento */ }
      onChange(null);
      return;
    }
    const rows = data as ContentRow[];
    writeCache(site, rows);
    onChange(rows);
  }

  void load();
  const channel = client.channel("content-" + site)
    .on("postgres_changes", { event: "*", schema: "public", table: "content", filter: "site=eq." + site }, () => { void load(); })
    .subscribe();

  return () => {
    stopped = true;
    void client.removeChannel(channel);
  };
}
