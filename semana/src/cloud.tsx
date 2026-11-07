import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { SyncBadge } from "../../shared/SyncBadge";
import { createSync, isEmptyValue, type SiteSync, type SyncStatus } from "../../shared/sync";

function bagEmpty(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return true;
  const row = value as { entradas?: unknown[]; ocultas?: unknown[]; hechos?: unknown[]; propias?: unknown[] };
  return !(row.entradas && row.entradas.length) && !(row.ocultas && row.ocultas.length) && !(row.hechos && row.hechos.length) && !(row.propias && row.propias.length);
}

const sync = createSync("semana", [
  { key: "semana-agenda-v1", isEmpty: bagEmpty },
  { key: "semana-cultura-v1", isEmpty: bagEmpty },
  { key: "semana-ingles-v1", isEmpty: isEmptyValue },
  { key: "semana-deporte-v1", isEmpty: isEmptyValue },
]);

const SyncContext = createContext<SiteSync>(sync);

export function useSync(): SiteSync {
  return useContext(SyncContext);
}

export function CloudSync(props: { children: ReactNode }) {
  const [status, setStatus] = useState<SyncStatus>("saving");
  const client = useMemo(() => sync, []);
  useEffect(() => {
    const off = client.onStatus(setStatus);
    client.start();
    return () => { off(); client.stop(); };
  }, [client]);
  return (
    <SyncContext.Provider value={client}>
      {props.children}
      <SyncBadge status={status} />
    </SyncContext.Provider>
  );
}
