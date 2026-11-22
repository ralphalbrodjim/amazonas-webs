import type { Company, RadarItem } from "./types";

function hasStoredReport(company: Company): boolean {
  if (company.report_md?.trim()) return true;
  let value: unknown = company.report_json;
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return false;
    try { value = JSON.parse(text) as unknown; } catch { return false; }
  }
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export type Listed = { ticker: string; name: string; where: "Cartera" | "Seguimiento" | "Radar"; company: Company | null };

export function trackedCompanies(companies: Company[], radar: RadarItem[]): Listed[] {
  const byTicker = new Set(companies.map((company) => company.ticker.toUpperCase()));
  const byId = new Set(companies.map((company) => company.id));
  const rows: Listed[] = companies.map((company) => ({
    ticker: company.ticker,
    name: company.name,
    where: company.in_portfolio ? "Cartera" : "Seguimiento",
    company,
  }));
  for (const item of radar) {
    if (byTicker.has(item.ticker.toUpperCase())) continue;
    if (item.company_id && byId.has(item.company_id)) continue;
    rows.push({ ticker: item.ticker, name: item.name, where: "Radar", company: null });
  }
  rows.sort((a, b) => a.ticker.localeCompare(b.ticker));
  return rows;
}

export function storedReports(companies: Company[]): Company[] {
  return companies
    .filter(hasStoredReport)
    .slice()
    .sort((a, b) => {
      const left = a.report_sent_on ?? "";
      const right = b.report_sent_on ?? "";
      if (left !== right) return right.localeCompare(left);
      return a.ticker.localeCompare(b.ticker);
    });
}
