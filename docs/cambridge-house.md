# The Cambridge House · fase 1

Sitio estático en `/ingles/`. La demo HTML es la referencia visual: colores, menú de diez entradas, tarjetas y textos de pantalla. La guía maestra V4 aporta el contenido, las reglas y lo que el HTML no cerraba. No hay cliente de Supabase ni clave de servicio en esta página.

No hay cifras de ejemplo. Minutos, radar y progreso empiezan en 0 y solo suben con lo que Alberto hace en la página. Eso queda en `localStorage` de este navegador. No hay un nivel medido. Lo primero que se propone es la prueba de nivel.

## Pantallas

| Vista | Qué enseña | Qué puede hacer Alberto |
| --- | --- | --- |
| Mi inicio | Aviso de prueba de nivel, semana, radar y accesos | Abrir la clase o el aviso de nivel |
| Mi semana | Lunes a domingo, con el profesor del día. Los números de día son los de la demo | Elegir un día, abrir su clase o registrarla como hecha |
| Profesores | Los seis perfiles, un solo expediente | Entrar en la clase de cada uno |
| Aula y ejercicios | Use of English, Reading, Listening y Vocabulary | Responder y ver la corrección después de enviar |
| Speaking | James, voz primero y texto de respaldo | Hablar o escribir, con tope de turnos |
| Writing | Ensayo de Emma, 220–260 palabras | Borrador, envío y revisión vinculada |
| Simulacro | Muestra de tres preguntas y cronómetro de Richard | Entregar. Si falta alguna, queda incompleto. El simulacro real es de la fase 2 |
| Errores y vocabulario | Libro de errores y expresiones | Marcar dominado, quitar o añadir una expresión |
| Mi progreso | Contadores reales, radar en 0 hasta haber respuestas, y el balance semanal de Sir Edward | Registrar un deber o el plan de la semana siguiente, o borrar lo guardado en este navegador |
| Biblioteca gratis | Enlaces externos con acento, nivel y duración | Abrir el recurso en su sitio |

## Qué ve cada profesor

Sir Edward Bennett (domingo). En Mi progreso, el balance semanal: horas medidas, clases hechas o no hechas (lo no registrado cuenta como no hecho), resultados por destreza, errores pendientes que no sean los ejemplos, deberes y el plan de la semana siguiente. Sin datos, cada bloque sale vacío. No recibe un historial distinto al de los demás.

James (lunes y viernes). Speaking. La voz del navegador es la vía principal; si no hay micrófono, el texto sigue. En 45 o 60 minutos el tope es 8 turnos; en 30, 6; en 20, 4. La casilla «Sin interrupciones» viene desmarcada: la voz se puede cortar al enviar. La pronunciación no se puntúa.

Oliver (martes). Use of English y Reading. Part 1 vale 1 punto. Part 2 acepta más de una forma y vale 1 punto. Part 4 (WISH) vale 2, 1 o 0; una frase con la palabra clave que no está en la lista queda en revisión y no se marca como fallo. La explicación sale después de enviar.

Sarah (miércoles). La muestra de Listening usa la voz sintética del navegador y lo dice en pantalla. La práctica real usa audio con acentos (BBC, VOA, ELLLO, TED). Un Listening de simulacro solo cuenta con audio real. El reproductor cuenta las escuchas y recomienda dos. La transcripción aparece al enviar.

Emma (jueves). Essay. El envío no pone nota Cambridge: mira longitud y conectores y lo deja en revisión. «Revisión» abre una segunda versión y conserva la original. El modelo de ensayo se muestra después del envío.

Richard (sábado). La pantalla actual es una muestra de tres ítems, puntos brutos sobre 3. Una sesión de 20 minutos avisa de que solo caben ejercicios cortos. Si se entrega con preguntas en blanco, el resultado dice incompleto y no suma una sesión terminada. Pulsar finalizar otra vez no vuelve a contar. El mini simulacro real queda para la fase 2.

## Reglas de esta fase

- Puntos directos, etiquetados como orientativos. No hay escala oficial Cambridge.
- Las claves de la demo están en la página porque no hay servidor. En la fase 2 salen del navegador.
- Un error nuevo guarda parte, punto gramatical y origen (`clase` o `simulacro`). Los tres de partida dicen `demo ilustrativo`.
- Los recursos de la biblioteca solo se enlazan. No se descarga el audio ni se copia el ejercicio.
- 0 € de IA: no hay ninguna llamada a un modelo.

## Conflictos entre la guía y el feedback de los profesores

Se sigue la guía cuando choca con el archivo de los profesores.

1. Turnos de Speaking. Los profesores piden 10–12. La guía, sección 6, deja el intercambio de una clase de 45 minutos en 6–8 turnos. La página usa 8 como máximo (4 en 20 minutos, 6 en 30, 8 en 45 y 60).
2. Voz. Los profesores piden un modo «sin interrupciones». La guía, sección 13, pide poder interrumpir la voz. Hay un interruptor; por defecto se puede interrumpir.
3. Nombres del menú. La guía propone Inicio, Mi semana, Empezar clase, Profesores, Examen, Error Book, Vocabulario y Progreso. El HTML trae diez entradas y es la referencia visual, así que se mantienen.
4. Idioma. La guía pide la interfaz sobre todo en inglés. El HTML mezcla español e inglés, y se mantiene.
5. Cifras de la maqueta. La guía dice sustituirlas por Supabase. En esta fase no se muestran: minutos y radar empiezan en 0 y solo guardan lo hecho en el navegador.
6. Tablas. La guía las nombra sin prefijo (`profiles`, `study_sessions`, …). El encargo de la fase 2 usa el prefijo `ch_`. El plan de abajo usa `ch_` y conserva el nombre de la guía entre paréntesis.
7. Publicar. El protocolo de la guía, sección 20, pide no publicar hasta aprobar el inventario. El encargo de esta fase pide publicar la demo ahora. Se publica solo `/ingles/`, sin tablas.

## Fase 2 y 3, en el repositorio

La página ya llama a Supabase. Hasta que se ejecuten los dos SQL, la corrección responde que faltan las migraciones y guarda el intento solo en el navegador. Con la cuenta abierta, la fila de Supabase manda.

Ejecutar en el editor SQL, en este orden:

1. `supabase/migrations/20261121120000_ch_schema.sql`
2. `supabase/migrations/20261121120100_ch_seed.sql`

No tocan `warren_*`, `app_state` ni `content`. Después, en Authentication → URL configuration, añadir `https://ralphalbrodjim.github.io/amazonas-webs/ingles/` como Site URL y como redirect. Sirve la misma cuenta de correo del proyecto.

La función de IA está en `supabase/functions/ch-correct/index.ts`. Hay que desplegarla y crear el secreto `CH_AI_KEY`. Opcionales: `CH_AI_URL` y `CH_AI_MODEL`. Sin ese secreto, Writing y Speaking dicen `corrección IA pendiente de activar` y aun así guardan la entrega para el profesor. No hay clave de servicio en el navegador ni en esa función: usa la sesión de quien llama.

Proyecto Supabase `njspskcisrwmtmbcbdny`. Tablas con prefijo `ch_` y RLS por usuario. Las claves de respuesta están solo en `ch_exercise_answers`, que el cliente no puede leer. La corrección cerrada pasa por `ch_grade_exercise`.

| Tabla | Equivale en la guía | Contenido |
| --- | --- | --- |
| `ch_profiles` | profiles | Objetivo, nivel estimado, idioma, modo ahorro |
| `ch_study_sessions` | study_sessions | Módulo, inicio, fin, estado, minutos válidos |
| `ch_exercise_bank` | exercise_bank | Enunciado, tipo, licencia, versión. Sin la clave |
| `ch_exercise_answers` | exercise_answers | Clave, explicación y regla. Solo servidor |
| `ch_exercise_attempts` | exercise_attempts | Respuesta enviada, puntos, momento |
| `ch_error_book` | error_book | Error, corrección, parte, punto, origen, estado |
| `ch_vocabulary_items` | vocabulary | Expresión, ejemplo, próxima revisión |
| `ch_writing_submissions` | writing_submissions | Texto, versión, rúbrica. Una revisión no pisa la anterior |
| `ch_speaking_sessions` | speaking_turns / speaking_sessions | Turnos, resumen, tope |
| `ch_resource_catalog` | resource_catalog | URL, proveedor, acento, nivel, duración, licencia |
| `ch_ai_usage` | ai_usage | Proveedor y tokens cuando el modelo los devuelve. El importe se queda vacío | 
| `ch_mock_attempts` | assessment_runs | Fecha, duración, condiciones, puntos por parte y si se paró antes |

Estados de sesión de la guía: `planned`, `in_progress`, `paused`, `submitted`, `completed`, `abandoned`. Solo `completed` suma minutos, y un segundo «Finalizar» no crea otro cierre.

Mini simulacro real, todavía no construido. La pantalla de ahora es solo una muestra de 3 preguntas. La fase 2 añade el mini simulacro de 45 minutos, con las partes de Reading & Use of English, puntos por parte, y un registro de cada intento: fecha, duración, condiciones, puntos por parte y si se paró antes. El Listening de ese simulacro solo cuenta si el audio es real.

Pruebas de la guía que quedan para esa fase, no hechas aquí: T01 borrador a los 11 minutos, T02 un solo cierre, T03–T04 corrección cerrada sin modelo, T05 una evaluación de Writing, T06 el mismo error para los seis, T07 texto si falta el micrófono (la demo ya lo permite en local), T08 la página sigue si cae la IA, T09 tope de gasto, T10 RLS, T11 versión del ejercicio, T12 reanudar sin duplicar, T13 el panel coincide con sesiones cerradas, T14 coste por proveedor, T15 la revisión de Writing no sobrescribe (la demo ya guarda las dos versiones en memoria).

No se crean esas tablas en esta entrega.
