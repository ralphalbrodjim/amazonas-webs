# app_state · marcar una actividad hecha

Mi semana guarda lo que Alberto marca en `public.app_state`, fila `site = 'semana'`, `key = 'semana-agenda-v1'`. Esa fila es la única lista de hechos. El botón Hecho de cada tramo de la semana escribe `entradas[].hecho`. Las gráficas y el resumen leen esa misma lista. No hace falta tocar `semana-deporte-v1` ni `semana-ingles-v1`.

El valor es un objeto:

```json
{
  "entradas": [],
  "ocultas": [],
  "kmMes": { "2026-10": { "km": 35.86, "salidas": 10 } }
}
```

Una salida de running:

| campo | significado |
| --- | --- |
| `id` | estable, por ejemplo `run-2026-11-07` |
| `fecha` | `YYYY-MM-DD` |
| `franja` | `manana`, `tarde`, `noche` o `hora` |
| `categoria` | `running` |
| `texto` | `Running` |
| `hecho` | `true` cuando está hecha |
| `origen` | `run:YYYY-MM-DD` |
| `km` | kilómetros de esa salida, número. `null` si aún no se conocen |
| `duracion` | texto `mm:ss` o `h:mm:ss`, opcional |

Para dar por hecha la salida del 7 de noviembre, con 5 km en 39:38, el agente añade el objeto si no existe o pone `hecho`, `km` y `duracion` en la entrada de esa fecha. No borra el resto de `entradas`.

```sql
update public.app_state
set value = jsonb_set(
  value,
  '{entradas}',
  coalesce(value->'entradas', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
    'id', 'run-2026-11-07',
    'fecha', '2026-11-07',
    'franja', 'manana',
    'inicio', null,
    'fin', null,
    'categoria', 'running',
    'texto', 'Running',
    'hecho', true,
    'origen', 'run:2026-11-07',
    'km', 5,
    'duracion', '39:38'
  ))
),
updated_at = now()
where site = 'semana' and key = 'semana-agenda-v1'
  and not exists (
    select 1 from jsonb_array_elements(coalesce(value->'entradas', '[]'::jsonb)) item
    where item->>'fecha' = '2026-11-07' and item->>'categoria' = 'running'
  );
```

Si la entrada ya existe, se marca así:

```sql
update public.app_state
set value = jsonb_set(value, '{entradas}', (
  select jsonb_agg(
    case
      when item->>'fecha' = '2026-11-07' and item->>'categoria' = 'running'
        then item || jsonb_build_object('hecho', true, 'km', 5, 'duracion', '39:38')
      else item
    end
  )
  from jsonb_array_elements(value->'entradas') item
)),
updated_at = now()
where site = 'semana' and key = 'semana-agenda-v1';
```

Gimnasio y hogar usan la misma lista: `categoria` `gimnasio` o `hogar`, `hecho` true. El gimnasio cuenta 30 minutos por sesión hecha. No hace falta un campo de minutos.

`kmMes` pisa el total de un mes cuando no se conocen todas las salidas. Octubre está en `35.86` km y `10` salidas. Sin esa clave, el mes es la suma de `entradas` con `categoria` running, `hecho` true y `km`. Noviembre no lleva pisado: sale de las salidas.

La pestaña Inglés ya no se muestra. La fila `semana-ingles-v1` se deja como está.
