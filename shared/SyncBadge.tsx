import type { SyncStatus } from "./sync";

const LABEL: Record<SyncStatus, string> = {
  synced: "Guardado en la nube",
  saving: "Guardando…",
  offline: "Sin conexión",
};

const GLYPH: Record<SyncStatus, string> = {
  synced: "☁️✅",
  saving: "⏳",
  offline: "⚠️",
};

export function SyncBadge(props: { status: SyncStatus }) {
  return (
    <span
      aria-live="polite"
      aria-label={LABEL[props.status]}
      title={LABEL[props.status]}
      style={{
        position: "fixed",
        right: 10,
        bottom: "calc(10px + env(safe-area-inset-bottom))",
        zIndex: 40,
        background: "rgba(255,253,247,0.94)",
        border: "1px solid #E4DDCF",
        borderRadius: 999,
        padding: "4px 8px",
        fontSize: 14,
        lineHeight: 1.2,
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        pointerEvents: "none",
      }}
    >{GLYPH[props.status]}</span>
  );
}
