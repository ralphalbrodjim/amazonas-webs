# public.content

`/chef/` and `/semana/` read published content from `public.content`. User state (checks, ratings, notes, hidden items) stays in `public.app_state`. Warren does not use this table.

Anon can only `SELECT`. Inserts and updates go through the Supabase SQL editor (or the admin connector), using `supabase/seed_content.sql` as the pattern.

## Columns

| column | meaning |
| --- | --- |
| `site` | `chef` or `semana` |
| `kind` | one of the kinds below |
| `id` | stable slug, unique with `site` and `kind`. Primary key is `(site, kind, id)` |
| `data` | jsonb object for that kind |
| `sort` | ascending order inside the kind |
| `active` | `false` hides the row. Do not `DELETE` if a later seed should be able to revive it; set `active` |
| `updated_at` | set to `now()` on every upsert |

```sql
insert into public.content (site, kind, id, data, sort, active)
values ('chef', 'recipe', 'mi-receta', '{"n":"Mi receta"}'::jsonb, 53, true)
on conflict (site, kind, id) do update set
  data = excluded.data,
  sort = excluded.sort,
  active = excluded.active,
  updated_at = now();
```

## How the sites load it

1. `select` rows for the site where `active = true`, ordered by `sort`.
2. Zero rows: use the content bundled in the site (the files and the recipe array). A stale browser cache is ignored.
3. A network error: use `localStorage` key `content-cache-chef` or `content-cache-semana` when it has rows, otherwise the bundle.
4. Some kinds present and others missing: use the rows that exist and keep the bundled copy of each missing kind.
5. Realtime on `public.content` reloads the site. `content-cache-*` is only an offline cache. It is not written to `app_state`.

## chef / recipe

One row per recipe. `id` is the slug of `n` (lowercase, no accents, hyphens, max 80 characters). `sort` is the book order, starting at 1. The tortilla is `tortilla-de-patatas-con-patatas-fritas-de-bolsa-chips`, sort 52.

`data` is the recipe plus `foto` (Wikimedia URL, or `""`).

| field | type | meaning |
| --- | --- | --- |
| `n` | string | name shown on the card |
| `pr` | string | dish type (Huevo, Salmón, Pollo, …). The type filter is the set of `pr` values |
| `sana` | string | `Sí`, `Moderado`, or `No` |
| `dif` | string | `Fácil`, `Media`, or `Difícil` |
| `t` | number | minutes |
| `val` | string | default stars, or `""` |
| `com` | string | short note under the recipe |
| `cc` | string | meal slot, for example `Comida` or `Cena` |
| `rac` | number | servings the ingredient quantities are written for |
| `cong` | string | freezing note |
| `nev` | string | fridge life |
| `tm` | string | Thermomix. The filter matches values that start with `Sí` |
| `ut` | string | utensils |
| `ing` | `[quantity, name][]` | `["100 g (1 bolsa pequeña)", "Patatas fritas de bolsa, …"]` |
| `pasos` | string[] | step text. Quantities with a unit (`g`, `kg`, `ml`, `l`, `cda`, `cdita`, `cdta`, `uds`) scale with servings. Temperatures (`°C`) and minutes do not |
| `foto` | string | image URL. Empty or a failed load shows the emoji |

There is no separate `filter` kind. Ingredient and type filters are computed from the active recipes. To add a recipe, insert one `recipe` row. It shows up in search, filters, Sorpréndeme, and the calendar picker.

```json
{
  "n": "Tortilla de patatas con patatas fritas de bolsa (chips)",
  "pr": "Huevo",
  "sana": "Moderado",
  "dif": "Fácil",
  "t": 21,
  "val": "",
  "com": "El truco del reposo: 8 minutos en el huevo y las patatas quedan blandas como en la tortilla de siempre, en 20 minutos y sin freír. Usa patatas lisas clásicas y no sales la mezcla.",
  "cc": "Cena",
  "rac": 2,
  "cong": "No (el huevo cuajado queda gomoso)",
  "nev": "2",
  "tm": "No",
  "ut": "Sartén antiadherente de 20 cm (con mango largo) · bol grande · tenedor o varillas · plato llano más ancho que la sartén (unos 26 cm) · espátula de silicona · paño seco o manopla · termómetro de cocina · temporizador",
  "ing": [
    ["4 (talla L, unos 240 g sin cáscara)", "Huevos"],
    ["100 g (1 bolsa pequeña)", "Patatas fritas de bolsa, clásicas lisas y con sal (no onduladas ni de sabores)"],
    ["10 g (1 cda)", "Aceite de oliva virgen extra (para la sartén)"]
  ],
  "pasos": [
    "BATIR los 4 huevos (unos 240 g sin cáscara).",
    "HIDRATAR 100 g de patatas y reposar 8 min, sin sal.",
    "CUAJAR con 10 g de aceite. PUNTO 71 °C en el centro."
  ],
  "foto": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Tortilla_Espa%C3%B1ola.jpg/330px-Tortilla_Espa%C3%B1ola.jpg"
}
```

The steps above are shortened to show the shape. The seed file has the full step text.

## chef / ingredient_canon

One row, `id = default`. Shopping groups and the name canonicalizer.

```json
{ "names": ["Huevo", "Patata"], "categories": { "Proteínas": ["Huevo"], "Verduras y fruta": ["Patata"] } }
```

`names` is the longest-match list. `categories` maps a shopping aisle to those names. A name missing from `categories` falls through to Despensa.

## semana / cultura

One row per proposal from Don Ateneo. `id` is the slug of `titulo`. `sort` is the display order. Append new items with the next `sort` so existing card ids stay put.

`data`:

| field | type | meaning |
| --- | --- | --- |
| `titulo` | string | card title |
| `tipo` | string | `película`, `exposición`, `teatro`, `restaurante`, `serie`, `libro`, `concierto`, `podcast`, or `otro` |
| `detalle` | string | the note on the card |
| `fecha` | string | `YYYY-MM-DD`, or `""` when there is no date |
| `lugar` | string | place |
| `enlace` | string | URL, or `""` |

Leave `id` out of `data` for the four seeded proposals. The panel builds its own id as `seed:{index}:{slug}` and Alberto's Hecho / Eliminar state is stored under that id. A new proposal can set `data.id` to a stable slug; the panel then uses `seed:` plus that value, so reordering does not bring back a deleted card.

```json
{
  "titulo": "El verdugo (1963), de Luis García Berlanga",
  "tipo": "película",
  "detalle": "Comedia negra con Pepe Isbert y guion de Azcona. No confirmado si está incluida en la suscripción o es de alquiler.",
  "fecha": "",
  "lugar": "Filmin",
  "enlace": "https://www.filmin.es/pelicula/el-verdugo"
}
```

```sql
insert into public.content (site, kind, id, data, sort, active)
values (
  'semana', 'cultura', 'el-verdugo-1963-de-luis-garcia-berlanga',
  '{"titulo":"El verdugo (1963), de Luis García Berlanga","tipo":"película","detalle":"Comedia negra con Pepe Isbert y guion de Azcona.","fecha":"","lugar":"Filmin","enlace":"https://www.filmin.es/pelicula/el-verdugo"}'::jsonb,
  1, true
)
on conflict (site, kind, id) do update set
  data = excluded.data, sort = excluded.sort, active = excluded.active, updated_at = now();
```

## semana / run_plan

| id | data |
| --- | --- |
| `meta` | `{ "actualizado": ISO-8601, "fuente": string }` |
| `octubre` | the `running.octubre_2026` object (`registros`, `excluidas`, `total_km`, `objetivo_km`, `no_hechas`, …) |
| `noviembre` | the `running.noviembre_2026` object (`registros`, `plan`, `realizados_km`, `objetivo_km`, `sin_salidas`, …) |

A completed run belongs in `registros` (and in `realizados_km`), not also in `plan`. The Running tab merges `run:{fecha}` from `noviembre.registros` into the done list.

## semana / gym_plan

One row, `id = main`. The whole `gimnasio` object: `planificadas_noviembre` (including `parada`, the Japan-trip window) and `registradas_octubre`.

## semana / weight

One row, `id = main`. The `peso` object (`actual_kg`, `objetivo_kg`, `historial`).

## semana / english_profile

One row, `id = main`. Sir Edward's profile: everything in `ingles.json` except `clases_programadas` and `deberes_pendientes` (those are their own kinds and replace the arrays when present).

## semana / english_class

One row per class. `data` is `{ fecha, hora, profesor, destreza, estado, nota? }`. `fecha` may be `null`.

## semana / english_task

One row per homework item. `data` is `{ profesor, tarea, hacer, entrega, estado }`.

## semana / agenda_meta

One row, `id = main`. Lola's calendar header: `rango`, `zona_horaria`, `fuente`, `pendientes_sin_fecha`. Not the appointments.

## semana / agenda

One row per appointment. `data` is `{ fecha, hora, titulo, lugar, tipo, nota }`. `hora` and `nota` may be `null`.
