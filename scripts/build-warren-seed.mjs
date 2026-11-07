import fs from "fs";
import path from "path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function sql(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  return "'" + String(value).replace(/'/g, "''") + "'";
}

const companies = [
  { ticker: "META", name: "Meta Platforms", currency: "USD", stars: 5, avg: 615.89, price: 623.21, priceNote: "Excel · 23/10/2026", weight: 25.67, verdict: "Ni fu ni fa: a vigilar", notes: "Cifras previas al split 2×1 por dividendo en acciones Clase C (19/01/2027).", sort: 1 },
  { ticker: "ZEG", name: "Zegona Communications", currency: "GBP", stars: null, avg: 13.93, price: 16.96, priceNote: "Excel · 23/10/2026 (1.696 GBX ÷ 100)", weight: 23.29, verdict: "Ni fu ni fa: a vigilar", notes: "Valoración por P/FCFE, no PER (BPA distorsionado por PPA). Objetivo 3 años = FY2030.", sort: 2 },
  { ticker: "MSFT", name: "Microsoft", currency: "USD", stars: null, avg: 403.60, price: 524.51, priceNote: "Excel · 23/10/2026", weight: 15.12, verdict: "Pendiente de análisis", notes: "", sort: 3 },
  { ticker: "GOOGL", name: "Alphabet (clase A)", currency: "USD", stars: null, avg: 170.13, price: 320.21, priceNote: "Excel · 23/10/2026", weight: 7.45, verdict: "Pendiente de análisis", notes: "", sort: 4 },
  { ticker: "JD", name: "JD.com (ADR Nasdaq)", currency: "USD", stars: null, avg: 28.85, price: 25.36, priceNote: "Excel · 23/10/2026 (USD por ADS)", weight: 3.65, verdict: "Esto es un caramelito", notes: "Modelo Warren 25/10/2026, pendiente de plantilla CCB. PER 11x sobre BPA operativo + caja.", sort: 5 },
  { ticker: "AMZN", name: "Amazon", currency: "USD", stars: null, avg: 217.09, price: 248.00, priceNote: "Excel · 23/10/2026", weight: 3.51, verdict: "Pendiente de análisis", notes: "", sort: 6 },
  { ticker: "WKL", name: "Wolters Kluwer", currency: "EUR", stars: null, avg: 106.60, price: 88.18, priceNote: "Excel · 23/10/2026", weight: 1.42, verdict: "Pendiente de análisis", notes: "", sort: 7 },
];

const estimates = [
  { ticker: "META", source: "warren", horizon: 3, label: "2029", bpa_base: 28.40, growth: 0.187, per: 20, target: null, as_of: "2026-10-26", currency: "USD", note: "BPA FY2026e 28,40 → FY2029e 47,51 · PER base 20x. Excel publica 950,21; la fórmula da 949,95 por redondeo." },
  { ticker: "META", source: "excel_bajista", horizon: 3, label: "2029", target: 316.73, as_of: "2026-10-26", currency: "USD", note: "Valor bajista CCB v1.2 (PER 16x)" },
  { ticker: "META", source: "excel_optimista", horizon: 3, label: "2029", target: 1319.75, as_of: "2026-10-26", currency: "USD", note: "Valor alcista CCB v1.2 (PER 25x)" },
  { ticker: "ZEG", source: "warren", horizon: 3, label: "FY30", target: 20.79, as_of: "2026-10-26", currency: "GBP", note: "Objetivo base 3 años FY2030 (P/FCFE 9x)" },
  { ticker: "ZEG", source: "excel_bajista", horizon: 3, label: "FY30", target: 6.30, as_of: "2026-10-26", currency: "GBP", note: "Valor bajista CCB v1.2 (P/FCFE 7x)" },
  { ticker: "ZEG", source: "excel_optimista", horizon: 3, label: "FY30", target: 27.67, as_of: "2026-10-26", currency: "GBP", note: "Valor alcista CCB v1.2 (P/FCFE 11x)" },
  { ticker: "JD", source: "warren", horizon: 3, label: "2029", target: 68.80, as_of: "2026-10-25", currency: "USD", note: "Objetivo base 3 años 2029 (modelo Warren)" },
  { ticker: "JD", source: "excel_bajista", horizon: 3, label: "2029", target: 23.10, as_of: "2026-10-25", currency: "USD", note: "Valor conservador del modelo Warren (PER 8x)" },
  { ticker: "JD", source: "excel_optimista", horizon: 3, label: "2029", target: 105.10, as_of: "2026-10-25", currency: "USD", note: "Valor optimista del modelo Warren (PER 14x)" },
];

const series = [
  { ticker: "META", currency: "USD", as_of: "2026-10-26", note: "Excel · pestaña BPA · [H] SEC 10-K · [E] escenario Base. USD por acción (pre-split).", rows: [["2016", 3.49], ["2017", 5.39], ["2018", 7.57], ["2019", 6.43], ["2020", 10.09], ["2021", 13.77], ["2022", 8.59], ["2023", 14.87], ["2024", 23.86], ["2025", 23.49], ["2026e", 28.40], ["2027e", 35.11], ["2028e", 41.13], ["2029e", 47.51], ["2030e", 53.80]] },
  { ticker: "JD", currency: "RMB", as_of: "2026-10-25", note: "Excel · pestaña BPA · [H] 20-F · [E] modelo Warren. RMB por ADS (BPA diluido). No convierte a USD.", rows: [["2023", 15.23], ["2024", 26.86], ["2025", 12.90], ["2026e", 14.81], ["2027e", 26.25], ["2028e", 33.24], ["2029e", 38.03], ["2030e", 41.90]] },
  { ticker: "ZEG", currency: "GBP", as_of: "2026-10-26", note: "Excel · pestaña BPA · ejercicio a 31/03. No es la base de la valoración (P/FCFE).", rows: [["FY25", -0.51], ["FY26", -0.25], ["FY27e", 0.52], ["FY28e", 0.68], ["FY29e", 0.80], ["FY30e", 0.81]] },
];

const lines = [];
lines.push("-- Optional seed for Warren Phase 1. Run AFTER warren_phase1.sql and AFTER Alberto has created his account.");
lines.push("-- Source: the figures already published on /warren/ (Excel 23/10/2026 prices, cuadro de mando 26/10/2026).");
lines.push("-- TIKR, share counts, ECB rates and every missing financial line are left null. Nothing here is invented.");
lines.push("do $seed$");
lines.push("declare");
lines.push("  owner uuid;");
lines.push("  cid uuid;");
lines.push("begin");
lines.push("  select user_id into owner from public.warren_profile limit 1;");
lines.push("  if owner is null then");
lines.push("    raise exception 'Crea antes la cuenta de Alberto. warren_profile está vacía.';");
lines.push("  end if;");

for (const company of companies) {
  lines.push("  insert into public.warren_companies (owner_id, ticker, name, currency, in_portfolio, classification, quality_stars, verdict, notes, sort)");
  lines.push(`  values (owner, ${sql(company.ticker)}, ${sql(company.name)}, ${sql(company.currency)}, true, 'Pendiente', ${sql(company.stars)}, ${sql(company.verdict)}, ${sql(company.notes)}, ${company.sort})`);
  lines.push("  on conflict (owner_id, ticker) do update set name = excluded.name, currency = excluded.currency, in_portfolio = excluded.in_portfolio, classification = excluded.classification, quality_stars = excluded.quality_stars, verdict = excluded.verdict, notes = excluded.notes, sort = excluded.sort;");
  lines.push(`  select id into cid from public.warren_companies where owner_id = owner and ticker = ${sql(company.ticker)};`);
  lines.push("  insert into public.warren_quotes (company_id, price, currency, price_date, source, manual, note)");
  lines.push(`  values (cid, ${company.price}, ${sql(company.currency)}, date '2026-10-23', 'Excel', false, ${sql(company.priceNote)})`);
  lines.push("  on conflict (company_id, price_date, source) do update set price = excluded.price, currency = excluded.currency, note = excluded.note, manual = excluded.manual;");
  lines.push("  insert into public.warren_positions (company_id, shares, avg_price, currency, reported_weight_pct, weight_as_of, weight_source, note)");
  lines.push(`  values (cid, null, ${company.avg}, ${sql(company.currency)}, ${company.weight}, date '2026-10-26', 'Excel', 'Peso del Excel. El número de acciones no estaba en la web.')`);
  lines.push("  on conflict (company_id) do update set avg_price = excluded.avg_price, currency = excluded.currency, reported_weight_pct = excluded.reported_weight_pct, weight_as_of = excluded.weight_as_of, weight_source = excluded.weight_source, note = excluded.note;");
  lines.push("  -- shares is left untouched on conflict so a later count typed by Alberto is not wiped.");
}

for (const row of estimates) {
  lines.push(`  select id into cid from public.warren_companies where owner_id = owner and ticker = ${sql(row.ticker)};`);
  lines.push("  insert into public.warren_estimates (company_id, source, horizon_years, fiscal_label, bpa_base, growth, per, target_price, target_currency, as_of, note)");
  lines.push(`  values (cid, ${sql(row.source)}, ${row.horizon}, ${sql(row.label)}, ${sql(row.bpa_base ?? null)}, ${sql(row.growth ?? null)}, ${sql(row.per ?? null)}, ${sql(row.target)}, ${sql(row.currency)}, date ${sql(row.as_of)}, ${sql(row.note)})`);
  lines.push("  on conflict (company_id, source, horizon_years, fiscal_label) do update set bpa_base = excluded.bpa_base, growth = excluded.growth, per = excluded.per, target_price = excluded.target_price, target_currency = excluded.target_currency, as_of = excluded.as_of, note = excluded.note;");
}

for (const serie of series) {
  for (const [label, value] of serie.rows) {
    const estimated = String(label).endsWith("e");
    const year = /^\d{4}/.test(String(label)) ? Number(String(label).slice(0, 4)) : null;
    lines.push(`  select id into cid from public.warren_companies where owner_id = owner and ticker = ${sql(serie.ticker)};`);
    lines.push("  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)");
    lines.push(`  values (cid, ${sql(label)}, ${sql(year)}, ${sql(estimated ? "estimado" : "historico")}, ${value}, ${sql(serie.currency)}, 'Excel', date ${sql(serie.as_of)}, ${sql(serie.note)})`);
    lines.push("  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;");
  }
}

lines.push("end");
lines.push("$seed$;");
lines.push("");

const out = path.join(root, "supabase/warren_seed.sql");
fs.writeFileSync(out, lines.join("\n"));
fs.mkdirSync("/opt/cursor/artifacts", { recursive: true });
fs.copyFileSync(path.join(root, "supabase/warren_phase1.sql"), "/opt/cursor/artifacts/warren_phase1.sql");
fs.copyFileSync(out, "/opt/cursor/artifacts/warren_seed.sql");
console.log("seed lines", lines.length);
