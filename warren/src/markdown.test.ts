import assert from "node:assert/strict";
import test from "node:test";
import { parseMarkdown, safeHttpUrl, type Block, type Inline } from "./markdown-parse.ts";
import { opportunityHash, opportunityTickerFromHash } from "./opportunity.ts";

function links(nodes: Inline[]): string[] {
  return nodes.flatMap((node) => node.type === "link" ? [node.href] : node.type === "text" ? [] : links(node.children));
}

function textOf(nodes: Inline[]): string {
  return nodes.map((node) => node.type === "text" ? node.text : textOf(node.children)).join("");
}

test("bold, lists, tables and urls render as data, never as html", () => {
  const source = [
    "Empresa:",
    "",
    "**Booking (NASDAQ)**.",
    "",
    "**Precio:** 10 USD. Ver https://example.com/a.",
    "",
    "**Tabla:**",
    "| Año | Ventas |",
    "|---|---|",
    "| 2024 | 10 |",
    "| **Base** | **20** |",
    "",
    "- **A 1 año:** objetivo.",
    "- Bajista: https://example.com/b y https://example.com/c.",
    "",
    "<script>alert(1)</script>",
    "[pincha](javascript:alert(1))",
    "[SEC](https://example.com/sec)",
  ].join("\n");
  const blocks = parseMarkdown(source);
  assert.equal(blocks[0].type, "p");
  assert.equal(textOf(blocks[0].type === "p" ? blocks[0].children : []), "Empresa:");
  assert.equal(blocks[1].type, "p");
  assert.equal(blocks[2].type, "p");
  const price = blocks[2].type === "p" ? blocks[2].children : [];
  assert.equal(price[0]?.type, "bold");
  assert.deepEqual(links(price), ["https://example.com/a"]);
  assert.equal(blocks[3].type, "h");
  assert.equal(textOf(blocks[3].type === "h" ? blocks[3].children : []), "Tabla:");
  const table = blocks[4];
  assert.equal(table.type, "table");
  if (table.type !== "table") return;
  assert.equal(textOf(table.headers?.[0] ?? []), "Año");
  assert.equal(table.rows.length, 2);
  assert.equal(table.rows[1][0][0]?.type, "bold");
  assert.equal(blocks[5].type, "ul");
  if (blocks[5].type !== "ul") return;
  assert.equal(blocks[5].items.length, 2);
  assert.deepEqual(links(blocks[5].items[1]), ["https://example.com/b", "https://example.com/c"]);
  const html = blocks[6];
  assert.equal(html.type, "p");
  assert.equal(textOf(html.type === "p" ? html.children : []), "<script>alert(1)</script>");
  assert.equal(html.type === "p" ? html.children.every((node) => node.type === "text") : false, true);
  const bad = blocks[7];
  assert.equal(bad.type, "p");
  assert.deepEqual(links(bad.type === "p" ? bad.children : []), []);
  assert.equal(textOf(bad.type === "p" ? bad.children : []), "[pincha](javascript:alert(1))");
  const good = blocks[8];
  assert.deepEqual(links(good.type === "p" ? good.children : []), ["https://example.com/sec"]);
  assert.equal(safeHttpUrl("javascript:alert(1)"), null);
  assert.equal(safeHttpUrl("https://example.com/sec"), "https://example.com/sec");
});

test("a direct link names only the ticker", () => {
  assert.equal(opportunityTickerFromHash("#oportunidad/BKNG"), "BKNG");
  assert.equal(opportunityTickerFromHash("#oportunidad/bkng"), "BKNG");
  assert.equal(opportunityTickerFromHash("#oportunidad/NOVO.B"), "NOVO.B");
  assert.equal(opportunityHash("intu"), "#oportunidad/INTU");
  assert.equal(opportunityTickerFromHash("#access_token=abc"), null);
  assert.equal(opportunityTickerFromHash("#oportunidad/../BKNG"), null);
  assert.equal(opportunityTickerFromHash("#radar"), null);
});

test("the official report shape keeps sections, a band and a wide table", () => {
  const blocks = parseMarkdown([
    "WARREN • INTU • 10/11/2026",
    "",
    "**01. Cajas clave**",
    "",
    "| A | B | C | D | E | F |",
    "|---|---|---|---|---|---|",
    "| 1 | 2 | 3 | 4 | 5 | 6 |",
    "",
    "1. Primero",
    "2. Segundo",
    "",
    "<script>alert(1)</script>",
  ].join("\n"));
  assert.equal(blocks[0].type, "band");
  assert.equal(blocks[1].type, "h");
  assert.equal(textOf(blocks[1].type === "h" ? blocks[1].children : []), "01 Cajas clave");
  assert.equal(blocks[2].type, "table");
  if (blocks[2].type === "table") assert.equal(blocks[2].headers?.length, 6);
  assert.equal(blocks[3].type, "ol");
  if (blocks[3].type === "ol") assert.equal(blocks[3].items.length, 2);
  assert.equal(textOf(blocks[4].type === "p" ? blocks[4].children : []), "<script>alert(1)</script>");
});

test("the table sample keeps every column on its own row", () => {
  const blocks: Block[] = parseMarkdown("| Escenario | Múltiplo | Precio 1A |\n|---|---|---|\n| Base | 15x | 192 |");
  assert.equal(blocks.length, 1);
  const table = blocks[0];
  assert.equal(table.type, "table");
  if (table.type !== "table" || !table.headers) return;
  assert.deepEqual(table.headers.map((cell) => textOf(cell)), ["Escenario", "Múltiplo", "Precio 1A"]);
  assert.deepEqual(table.rows[0].map((cell) => textOf(cell)), ["Base", "15x", "192"]);
});
