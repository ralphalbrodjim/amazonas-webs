export type Inline =
  | { type: "text"; text: string }
  | { type: "bold"; children: Inline[] }
  | { type: "link"; href: string; children: Inline[] };

export type Block =
  | { type: "band"; children: Inline[] }
  | { type: "h"; children: Inline[] }
  | { type: "p"; children: Inline[] }
  | { type: "ul"; items: Inline[][] }
  | { type: "ol"; items: Inline[][] }
  | { type: "table"; headers: Inline[][] | null; rows: Inline[][][] };

const TABLE_LINE = /^\s*\|.*\|\s*$/;
const LIST_LINE = /^\s*-\s+(.*)$/;
const ORDER_LINE = /^\s*\d+\.\s+(.*)$/;

function sectionTitle(line: string): string | null {
  const stripped = line.trim().replace(/^\*\*/, "").replace(/\*\*$/, "").trim();
  const match = stripped.match(/^(0[1-5])[.)]\s+(\S.*)$/);
  return match ? match[1] + " " + match[2] : null;
}

/** Only http(s) can become a link. Anything else stays text. */
export function safeHttpUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    if (parsed.username || parsed.password) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

function cleanBareUrl(raw: string): { href: string; rest: string } {
  let href = raw;
  let rest = "";
  const tail = href.match(/[.,;:!?]+$/);
  if (tail && tail.index !== undefined) {
    rest = href.slice(tail.index) + rest;
    href = href.slice(0, tail.index);
  }
  while (href.endsWith(")") && (href.match(/\(/g) ?? []).length < (href.match(/\)/g) ?? []).length) {
    rest = ")" + rest;
    href = href.slice(0, -1);
  }
  return { href, rest };
}

function parseInline(source: string, allowBold = true): Inline[] {
  const out: Inline[] = [];
  let text = "";
  const flush = () => {
    if (!text) return;
    out.push({ type: "text", text });
    text = "";
  };
  let i = 0;
  while (i < source.length) {
    if (allowBold && source.startsWith("**", i)) {
      const end = source.indexOf("**", i + 2);
      if (end !== -1) {
        flush();
        out.push({ type: "bold", children: parseInline(source.slice(i + 2, end), false) });
        i = end + 2;
        continue;
      }
    }
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)/.exec(source.slice(i));
    if (link) {
      const href = safeHttpUrl(link[2]);
      if (href) {
        flush();
        out.push({ type: "link", href, children: parseInline(link[1], true) });
        i += link[0].length;
        continue;
      }
    }
    const bare = /^https?:\/\/[^\s<>\]*]+/.exec(source.slice(i));
    if (bare) {
      const cleaned = cleanBareUrl(bare[0]);
      const href = safeHttpUrl(cleaned.href);
      if (href) {
        flush();
        out.push({ type: "link", href, children: [{ type: "text", text: cleaned.href }] });
        text += cleaned.rest;
        i += bare[0].length;
        continue;
      }
    }
    text += source[i];
    i += 1;
  }
  flush();
  return out;
}

function isHeading(nodes: Inline[]): boolean {
  const meaningful = nodes.filter((node) => node.type !== "text" || node.text.trim() !== "");
  return meaningful.length === 1 && meaningful[0].type === "bold";
}

function cellsOf(line: string): string[] {
  let body = line.trim();
  if (body.startsWith("|")) body = body.slice(1);
  if (body.endsWith("|")) body = body.slice(0, -1);
  return body.split("|").map((cell) => cell.trim());
}

function isSeparator(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function tableBlock(lines: string[]): Block | null {
  const parsed = lines.map(cellsOf);
  let headers: Inline[][] | null = null;
  let body = parsed;
  if (parsed.length >= 2 && isSeparator(parsed[1])) {
    headers = parsed[0].map((cell) => parseInline(cell));
    body = parsed.slice(2);
  }
  const rows = body.filter((row) => !isSeparator(row)).map((row) => row.map((cell) => parseInline(cell)));
  if (!headers && rows.length === 0) return null;
  return { type: "table", headers, rows };
}

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i += 1;
      continue;
    }
    if (TABLE_LINE.test(line)) {
      const group: string[] = [];
      while (i < lines.length && TABLE_LINE.test(lines[i])) {
        group.push(lines[i]);
        i += 1;
      }
      const table = tableBlock(group);
      if (table) blocks.push(table);
      continue;
    }
    if (LIST_LINE.test(line)) {
      const items: Inline[][] = [];
      while (i < lines.length) {
        const item = LIST_LINE.exec(lines[i]);
        if (!item) break;
        items.push(parseInline(item[1]));
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }
    const section = sectionTitle(line);
    if (section) {
      blocks.push({ type: "h", children: parseInline(section) });
      i += 1;
      continue;
    }
    if (ORDER_LINE.test(line)) {
      const items: Inline[][] = [];
      while (i < lines.length && ORDER_LINE.test(lines[i]) && !sectionTitle(lines[i])) {
        const item = ORDER_LINE.exec(lines[i]);
        if (!item) break;
        items.push(parseInline(item[1]));
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }
    const atx = line.trim().match(/^(#{1,3})\s+(\S.*)$/);
    if (atx) {
      blocks.push({ type: "h", children: parseInline(atx[2]) });
      i += 1;
      continue;
    }
    if (/^WARREN\b/i.test(line.trim())) {
      blocks.push({ type: "band", children: parseInline(line.trim()) });
      i += 1;
      continue;
    }
    const children = parseInline(line.trim());
    blocks.push(isHeading(children) ? { type: "h", children } : { type: "p", children });
    i += 1;
  }
  return blocks;
}
