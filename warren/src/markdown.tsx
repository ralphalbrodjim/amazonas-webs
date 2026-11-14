import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import { fecha } from "./format";
import { parseMarkdown, safeHttpUrl, type Inline } from "./markdown-parse";

const NAVY = "#0D1933";
const PANEL = "#14284B";
const BLUE = "#479AFF";
const INK = "#FFFFFF";
const LINE = "rgba(130,170,230,0.18)";
const INK3 = "#8FA6CF";
const CYAN = "#56D3EC";
const btn = (on: boolean): CSSProperties => ({ cursor: "pointer", minHeight: 44, padding: "8px 14px", borderRadius: 999, border: "1px solid " + (on ? BLUE : LINE), background: on ? BLUE : "transparent", color: on ? NAVY : INK, fontWeight: 700 });

function InlineView(props: { node: Inline }): ReactNode {
  const node = props.node;
  if (node.type === "text") return node.text;
  if (node.type === "bold") return <strong>{node.children.map((child, index) => <InlineView key={index} node={child} />)}</strong>;
  const href = safeHttpUrl(node.href);
  if (!href) return node.children.map((child, index) => <InlineView key={index} node={child} />);
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: CYAN, overflowWrap: "anywhere" }}>
      {node.children.map((child, index) => <InlineView key={index} node={child} />)}
    </a>
  );
}

function Inlines(props: { nodes: Inline[] }) {
  return props.nodes.map((node, index) => <InlineView key={index} node={node} />);
}

const cell = (index: number, header: boolean): CSSProperties => ({
  padding: "10px 12px",
  whiteSpace: "nowrap",
  textAlign: index === 0 ? "left" : "right",
  borderBottom: "1px solid " + LINE,
  fontSize: 16,
  fontWeight: header ? 700 : 400,
  color: header ? INK3 : "#FFFFFF",
  ...(index === 0 ? { position: "sticky" as const, left: 0, background: "#14284B", zIndex: 1 } : {}),
});

function headingText(nodes: Inline[]): string {
  return nodes.map((node) => node.type === "text" ? node.text : headingText(node.type === "bold" || node.type === "link" ? node.children : [])).join("");
}

export function MarkdownDoc(props: { source: string }) {
  const blocks = parseMarkdown(props.source);
  return (
    <div style={{ fontSize: 16, lineHeight: 1.5 }}>
      {blocks.map((block, index) => {
        if (block.type === "band") return <p key={index} style={{ background: PANEL, letterSpacing: "0.08em", fontWeight: 800, padding: "12px 14px", borderRadius: 12, margin: "8px 0" }}><Inlines nodes={block.children} /></p>;
        if (block.type === "h") {
          const section = /^0[1-5]\s/.test(headingText(block.children));
          return <p key={index} style={{ fontSize: section ? 20 : 18, fontWeight: 800, margin: "18px 0 8px", letterSpacing: section ? "0.04em" : undefined }}><Inlines nodes={block.children} /></p>;
        }
        if (block.type === "p") return <p key={index} style={{ margin: "8px 0" }}><Inlines nodes={block.children} /></p>;
        if (block.type === "ul" || block.type === "ol") {
          const List = block.type === "ol" ? "ol" : "ul";
          return (
            <List key={index} style={{ margin: "8px 0", paddingLeft: 22 }}>
              {block.items.map((item, itemIndex) => <li key={itemIndex} style={{ margin: "6px 0" }}><Inlines nodes={item} /></li>)}
            </List>
          );
        }
        return (
          <div key={index} style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", maxWidth: "100%", margin: "12px 0", border: "1px solid " + LINE, borderRadius: 12 }}>
            <table style={{ borderCollapse: "collapse", width: "max-content", minWidth: "100%" }}>
              {block.headers ? (
                <thead>
                  <tr>{block.headers.map((header, headerIndex) => <th key={headerIndex} style={cell(headerIndex, true)}><Inlines nodes={header} /></th>)}</tr>
                </thead>
              ) : null}
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>{row.map((value, valueIndex) => <td key={valueIndex} style={cell(valueIndex, false)}><Inlines nodes={value} /></td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

export function AnalysisReader(props: { ticker: string; name?: string | null; sentOn?: string | null; source: string | null; onClose: () => void }) {
  const report = props.source?.trim() ?? "";
  const sent = props.sentOn ? fecha(props.sentOn.slice(0, 10)) : null;
  const dated = sent && sent !== "N/D" ? sent : null;
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") props.onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [props.onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={"Análisis " + props.ticker} style={{ position: "fixed", inset: 0, zIndex: 40, background: NAVY, color: INK, overflow: "auto", padding: "12px 14px 48px", boxSizing: "border-box", fontFamily: "Inter, -apple-system, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", minWidth: 0 }}>
        <div style={{ position: "sticky", top: 0, background: NAVY, paddingBottom: 10, zIndex: 2 }}>
          <button type="button" style={{ ...btn(false), width: "100%", minHeight: 52, fontSize: 17 }} onClick={props.onClose}>← Cerrar</button>
        </div>
        <p style={{ background: PANEL, letterSpacing: "0.08em", fontWeight: 800, padding: "12px 14px", borderRadius: 12 }}>WARREN • {props.ticker}{dated ? " • " + dated : ""}</p>
        <h2 style={{ fontSize: 22, margin: "8px 0 4px" }}>{props.ticker}{props.name ? " · " + props.name : ""}{dated ? " · análisis del " + dated : ""}</h2>
        {props.source === null ? <p style={{ color: INK3 }}>Cargando…</p> : report ? <MarkdownDoc source={report} /> : <p style={{ color: INK3 }}>Este análisis no está disponible.</p>}
      </div>
    </div>
  );
}
