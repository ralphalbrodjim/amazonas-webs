import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./supabase.config";
import { chooseIncoming } from "./syncChoice";
export type SyncStatus = "synced" | "saving" | "offline";
export type SyncSite = "chef" | "semana";

export type SyncKey = {
  key?: string;
  /** Matches every cloud key that starts with this, for example one row per week. */
  prefix?: string;
  isEmpty?: (value: unknown) => boolean;
  /** When the cloud row exists, it wins even if it is empty. A phone must not upload an older local copy over it. */
  authoritative?: boolean;
};

type Handler = (value: unknown) => void;

function stable(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) out[key] = sortValue((value as Record<string, unknown>)[key]);
    return out;
  }
  return value;
}

export function isEmptyValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function readLocal(key: string): unknown | undefined {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return undefined;
    try { return JSON.parse(raw); } catch { return raw; }
  } catch { return undefined; }
}

function writeLocal(key: string, value: unknown) {
  try {
    if (typeof value === "string") localStorage.setItem(key, value);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch { /* sin almacenamiento */ }
}

export type SiteSync = {
  start: () => void;
  stop: () => void;
  push: (key: string, value: unknown) => void;
  onKey: (key: string, handler: Handler) => () => void;
  onReady: (handler: () => void) => () => void;
  onStatus: (handler: (status: SyncStatus) => void) => () => void;
};

export function createSync(site: SyncSite, keys: SyncKey[]): SiteSync {
  const client: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const exact = new Map(keys.filter((item) => item.key).map((item) => [item.key as string, item]));
  const prefixes = keys.filter((item) => item.prefix);
  function itemFor(key: string): SyncKey | undefined {
    return exact.get(key) ?? prefixes.find((item) => item.prefix && key.startsWith(item.prefix));
  }
  const handlers = new Map<string, Set<Handler>>();
  const statusHandlers = new Set<(status: SyncStatus) => void>();
  const readyHandlers = new Set<() => void>();
  const applied = new Map<string, string>();
  const latest = new Map<string, unknown>();
  const dirty = new Set<string>();
  const timers = new Map<string, number>();
  const remoteHad = new Set<string>();
  let status: SyncStatus = "saving";
  let ready = false;
  let inflight = 0;
  let stopped = false;
  let channel: ReturnType<SupabaseClient["channel"]> | null = null;

  function flush() {
    for (const timer of timers.values()) window.clearTimeout(timer);
    timers.clear();
    for (const [key, value] of latest) void upsert(key, value);
  }

  function onHide() {
    if (document.visibilityState === "hidden") flush();
  }

  function setStatus(next: SyncStatus) {
    status = next;
    for (const fn of statusHandlers) fn(next);
  }

  function deliver(key: string, value: unknown) {
    latest.set(key, value);
    applied.set(key, stable(value));
    writeLocal(key, value);
    for (const fn of handlers.get(key) ?? []) fn(value);
  }

  async function upsert(key: string, value: unknown) {
    inflight += 1;
    setStatus("saving");
    const { error } = await client.from("app_state").upsert({ site, key, value }, { onConflict: "site,key" });
    inflight -= 1;
    if (stopped) return;
    if (error) setStatus("offline");
    else if (inflight === 0) setStatus("synced");
  }

  function schedule(key: string) {
    const prev = timers.get(key);
    if (prev) window.clearTimeout(prev);
    timers.set(key, window.setTimeout(() => {
      timers.delete(key);
      if (!latest.has(key)) return;
      void upsert(key, latest.get(key));
    }, 500));
  }

  function push(key: string, value: unknown) {
    if (!itemFor(key)) return;
    writeLocal(key, value);
    const sig = stable(value);
    latest.set(key, value);
    if (applied.get(key) === sig) return;
    applied.set(key, sig);
    if (!ready) { dirty.add(key); return; }
    schedule(key);
  }

  function onKey(key: string, handler: Handler) {
    let set = handlers.get(key);
    if (!set) handlers.set(key, set = new Set());
    set.add(handler);
    if (latest.has(key)) handler(latest.get(key));
    return () => set!.delete(handler);
  }

  function onReady(handler: () => void) {
    readyHandlers.add(handler);
    if (ready) handler();
    return () => readyHandlers.delete(handler);
  }

  function onStatus(handler: (status: SyncStatus) => void) {
    statusHandlers.add(handler);
    handler(status);
    return () => statusHandlers.delete(handler);
  }

  async function start() {
    stopped = false;
    setStatus("saving");
    const { data, error } = await client.from("app_state").select("key,value").eq("site", site);
    if (stopped) return;
    if (error || !data) { ready = false; setStatus("offline"); return; }
    const seen = new Set<string>();
    for (const row of data) {
      const key = String(row.key);
      const item = itemFor(key);
      if (!item) continue;
      seen.add(key);
      const local = readLocal(key);
      const remoteEmpty = item.isEmpty ? item.isEmpty(row.value) : isEmptyValue(row.value);
      const localEmpty = local === undefined || (item.isEmpty ? item.isEmpty(local) : isEmptyValue(local));
      if (item.authoritative) {
        if (dirty.has(key) && latest.has(key)) {
          void upsert(key, latest.get(key));
          continue;
        }
        remoteHad.add(key);
        deliver(key, row.value);
        continue;
      }
      const choice = chooseIncoming({ remoteExists: true, remote: row.value, local, authoritative: false, remoteEmpty, localEmpty });
      if (choice.use === "local") {
        latest.set(key, choice.value);
        applied.set(key, stable(choice.value));
        void upsert(key, choice.value);
        continue;
      }
      remoteHad.add(key);
      deliver(key, choice.value);
    }
    for (const item of keys) {
      if (!item.key || seen.has(item.key)) continue;
      if (item.authoritative) {
        if (dirty.has(item.key) && latest.has(item.key)) void upsert(item.key, latest.get(item.key));
        else deliver(item.key, "");
        continue;
      }
      const local = readLocal(item.key);
      if (local === undefined) continue;
      const empty = item.isEmpty ? item.isEmpty(local) : isEmptyValue(local);
      const choice = chooseIncoming({ remoteExists: false, remote: undefined, local, authoritative: false, remoteEmpty: true, localEmpty: empty });
      if (choice.use !== "local") continue;
      latest.set(item.key, choice.value);
      applied.set(item.key, stable(choice.value));
      void upsert(item.key, choice.value);
    }
    ready = true;
    for (const key of dirty) {
      if (remoteHad.has(key)) continue;
      if (!latest.has(key)) continue;
      const specItem = itemFor(key);
      const empty = specItem?.isEmpty ? specItem.isEmpty(latest.get(key)) : isEmptyValue(latest.get(key));
      if (empty) continue;
      schedule(key);
    }
    if (inflight === 0) setStatus("synced");
    for (const fn of readyHandlers) fn();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    channel = client.channel("app_state_" + site)
      .on("postgres_changes", { event: "*", schema: "public", table: "app_state", filter: "site=eq." + site }, (payload) => {
        const row = payload.new as { key?: string; value?: unknown } | null;
        if (!row || typeof row.key !== "string" || !itemFor(row.key)) return;
        if (applied.get(row.key) === stable(row.value)) return;
        remoteHad.add(row.key);
        deliver(row.key, row.value);
      })
      .subscribe((state) => {
        if (state === "CHANNEL_ERROR" || state === "TIMED_OUT" || state === "CLOSED") setStatus("offline");
      });
  }

  function stop() {
    stopped = true;
    for (const timer of timers.values()) window.clearTimeout(timer);
    timers.clear();
    document.removeEventListener("visibilitychange", onHide);
    window.removeEventListener("pagehide", flush);
    if (channel) void client.removeChannel(channel);
    channel = null;
  }

  return { start, stop, push, onKey, onReady, onStatus };
}
