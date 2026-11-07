import fs from "fs";
import path from "path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function slug(value) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "item";
}
function sqlStr(value) {
  return "'" + String(value).replace(/'/g, "''") + "'";
}
function sqlJson(value) {
  return "'" + JSON.stringify(value).replace(/'/g, "''") + "'::jsonb";
}

const app = fs.readFileSync(path.join(root, "chef/src/App.tsx"), "utf8");
const rStart = app.indexOf("let R: Rec[] = ");
const arrStart = rStart + "let R: Rec[] = ".length;
let i = arrStart, depth = 0, inStr = false, esc = false;
for (; i < app.length; i++) {
  const c = app[i];
  if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
  if (c === '"') inStr = true;
  else if (c === "[") depth++;
  else if (c === "]") { depth--; if (depth === 0) break; }
}
const recipes = JSON.parse(app.slice(arrStart, i + 1));
const fotoStart = app.indexOf("let FOTOS: Record<string, string> = ");
const fotoObjStart = app.indexOf("{", fotoStart);
let j = fotoObjStart, d2 = 0, in2 = false, e2 = false;
for (; j < app.length; j++) {
  const c = app[j];
  if (in2) { if (e2) e2 = false; else if (c === "\\") e2 = true; else if (c === '"') in2 = false; continue; }
  if (c === '"') in2 = true;
  else if (c === "{") d2++;
  else if (c === "}") { d2--; if (d2 === 0) break; }
}
const fotos = JSON.parse(app.slice(fotoObjStart, j + 1).replace(/,(\s*[}\]])/g, "$1"));
const canonMatch = app.match(/let CANON: string\[\] = (\[[\s\S]*?\]);/);
const canon = JSON.parse(canonMatch[1]);
const catMatch = app.match(/let CAT: Record<string, string\[\]> = (\{[\s\S]*?\});/);
const cat = JSON.parse(catMatch[1].replace(/,(\s*[}\]])/g, "$1"));

const deporte = JSON.parse(fs.readFileSync(path.join(root, "semana/data/deporte.json"), "utf8"));
const ingles = JSON.parse(fs.readFileSync(path.join(root, "semana/data/ingles.json"), "utf8"));
const agenda = JSON.parse(fs.readFileSync(path.join(root, "semana/data/agenda.json"), "utf8"));
const cultura = JSON.parse(fs.readFileSync(path.join(root, "semana/data/cultura.json"), "utf8"));

const rows = [];
function add(site, kind, id, data, sort) {
  rows.push({ site, kind, id, data, sort });
}

recipes.forEach((recipe, index) => {
  add("chef", "recipe", slug(recipe.n), { ...recipe, foto: fotos[recipe.n] || "" }, index + 1);
});
add("chef", "ingredient_canon", "default", { names: canon, categories: cat }, 1);

add("semana", "run_plan", "meta", { actualizado: deporte.actualizado, fuente: deporte.fuente }, 1);
add("semana", "run_plan", "octubre", deporte.running.octubre_2026, 2);
add("semana", "run_plan", "noviembre", deporte.running.noviembre_2026, 3);
add("semana", "gym_plan", "main", deporte.gimnasio, 1);
add("semana", "weight", "main", deporte.peso, 1);

const { clases_programadas, deberes_pendientes, ...profile } = ingles;
add("semana", "english_profile", "main", profile, 1);
clases_programadas.forEach((clase, index) => {
  add("semana", "english_class", slug(`${clase.fecha ?? "sin-fecha"}-${clase.profesor}-${clase.destreza}`), clase, index + 1);
});
deberes_pendientes.forEach((tarea, index) => {
  add("semana", "english_task", slug(tarea.profesor + "-" + tarea.tarea), tarea, index + 1);
});

const { citas, ...agendaMeta } = agenda;
add("semana", "agenda_meta", "main", agendaMeta, 1);
citas.forEach((cita, index) => {
  add("semana", "agenda", slug(`${cita.fecha}-${cita.titulo}`), cita, index + 1);
});
cultura.forEach((item, index) => {
  add("semana", "cultura", slug(item.titulo), item, index + 1);
});

const lines = [];
lines.push("-- Seed for public.content. Run in the Supabase SQL editor.");
lines.push("-- Anon cannot write this table. ON CONFLICT updates data, sort and active.");
lines.push("insert into public.content (site, kind, id, data, sort, active)");
lines.push("values");
lines.push(rows.map((row) => `  (${sqlStr(row.site)}, ${sqlStr(row.kind)}, ${sqlStr(row.id)}, ${sqlJson(row.data)}, ${row.sort}, true)`).join(",\n"));
lines.push("on conflict (site, kind, id) do update set");
lines.push("  data = excluded.data,");
lines.push("  sort = excluded.sort,");
lines.push("  active = excluded.active,");
lines.push("  updated_at = now();");
lines.push("");

const sql = lines.join("\n");
const out = path.join(root, "supabase/seed_content.sql");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, sql);
fs.mkdirSync("/opt/cursor/artifacts", { recursive: true });
fs.copyFileSync(out, "/opt/cursor/artifacts/seed_content.sql");

const counts = {};
const seen = new Set();
for (const row of rows) {
  const key = row.site + "|" + row.kind + "|" + row.id;
  if (seen.has(key)) throw new Error("duplicate " + key);
  seen.add(key);
  if (!row.id || row.id.length > 80) throw new Error("bad id " + key);
  const k = row.site + "/" + row.kind;
  counts[k] = (counts[k] || 0) + 1;
}
console.log("rows", rows.length);
console.log(Object.entries(counts).sort().map(([k, n]) => k + " " + n).join("\n"));
const tortilla = recipes.find((r) => r.n.includes("patatas fritas de bolsa"));
console.log("tortilla", Boolean(tortilla), "foto", Boolean(fotos[tortilla.n]));