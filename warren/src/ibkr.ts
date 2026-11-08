export type IbkrRow = {
  ticker: string;
  shares: number | null;
  avgPrice: number | null;
  currency: string | null;
  markPrice: number | null;
  priceDate: string | null;
};

function cellsOf(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') { current += '"'; i++; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else current += char;
  }
  cells.push(current.trim());
  return cells;
}

function numberOf(value: string): number | null {
  const text = value.trim();
  if (!text || text === "--" || text === "N/A") return null;
  const normalized = text.includes(",") && !text.includes(".") ? text.replace(",", ".") : text.replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function dateOf(value: string): string | null {
  const text = value.trim();
  const compact = text.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}`;
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  return null;
}

function indexOf(header: string[], names: string[]): number {
  const wanted = names.map((name) => name.toLowerCase());
  return header.findIndex((cell) => wanted.includes(cell.toLowerCase()));
}

function rowFrom(header: string[], cells: string[]): IbkrRow | null {
  const tickerAt = indexOf(header, ["Symbol", "Ticker"]);
  if (tickerAt < 0) return null;
  const ticker = (cells[tickerAt] ?? "").toUpperCase();
  if (!ticker || /^(TOTAL|CASH|SUBTOTAL)$/.test(ticker)) return null;
  const sharesAt = indexOf(header, ["Quantity", "Qty"]);
  const perShareAt = indexOf(header, ["CostBasisPrice", "Average Price", "Avg Price", "Cost Price"]);
  const totalCostAt = indexOf(header, ["Cost Basis", "CostBasis"]);
  const currencyAt = indexOf(header, ["Currency", "CurrencyPrimary"]);
  const markAt = indexOf(header, ["Mark Price", "MarkPrice", "Close Price"]);
  const dateAt = indexOf(header, ["Report Date", "ReportDate", "Date"]);
  const shares = sharesAt >= 0 ? numberOf(cells[sharesAt] ?? "") : null;
  let avgPrice = perShareAt >= 0 ? numberOf(cells[perShareAt] ?? "") : null;
  if (avgPrice === null && totalCostAt >= 0 && shares !== null && shares !== 0) {
    const total = numberOf(cells[totalCostAt] ?? "");
    avgPrice = total === null ? null : total / shares;
  }
  return {
    ticker,
    shares,
    avgPrice,
    currency: currencyAt >= 0 && cells[currencyAt] ? cells[currencyAt].toUpperCase() : null,
    markPrice: markAt >= 0 ? numberOf(cells[markAt] ?? "") : null,
    priceDate: dateAt >= 0 ? dateOf(cells[dateAt] ?? "") : null,
  };
}

export function parseIbkrCsv(text: string): { rows: IbkrRow[]; error: string | null } {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  let header: string[] | null = null;
  let section = "";
  const rows: IbkrRow[] = [];
  for (const line of lines) {
    const cells = cellsOf(line);
    const headerAt = cells.findIndex((cell) => cell.toLowerCase() === "header");
    if (headerAt >= 0 && cells.some((cell) => cell.toLowerCase() === "symbol" || cell.toLowerCase() === "ticker")) {
      section = headerAt > 0 ? cells[0] : "";
      header = cells.slice(headerAt + 1);
      continue;
    }
    if (!header && cells.some((cell) => cell.toLowerCase() === "symbol" || cell.toLowerCase() === "ticker")) {
      header = cells;
      section = "";
      continue;
    }
    if (!header) continue;
    if (section && cells[0] !== section) continue;
    const data = section ? cells.slice(2) : cells;
    if (section && cells[1]?.toLowerCase() !== "data") continue;
    const row = rowFrom(header, data.length ? data : cells);
    if (row) rows.push(row);
  }
  if (!header) return { rows: [], error: "El CSV no tiene una columna Symbol." };
  return { rows, error: rows.length ? null : "No hay posiciones con ticker en el archivo." };
}
