import { useState, useEffect, useMemo } from "react";
import type { ChangeEvent, KeyboardEvent, MouseEvent, ReactNode } from "react";

const C = { green: "#1F3B34", green2: "#2F5A4B", kicker: "#4F7A63", cream: "#F5F1E8", card: "#FFFDF7", line: "#E4DDCF", text: "#1E2B27", muted: "#6B746F", soft: "#E6EEE7" };
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const th = { border: { default: C.line }, text: { primary: C.text, secondary: C.muted, success: C.kicker }, fill: { secondary: C.soft }, bg: { base: C.card, subtle: "#FBF8F1" }, font: { mono: "ui-monospace, Menlo, monospace" } };
const ctl = { border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px", background: C.card, color: C.text, fontSize: 14, fontFamily: SANS, minWidth: 0 } as const;
type Opt = string | { value: string; label: string };
function Select(p: { label?: string; value: string; onChange: (v: string) => void; options: Opt[]; placeholder?: string }) {
  return <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: C.muted, flex: "1 1 150px" }}>{p.label}<select style={ctl} value={p.value} onChange={(e: ChangeEvent<HTMLSelectElement>) => p.onChange(e.target.value)}>{p.placeholder && !p.options.some((o: Opt) => (typeof o === "string" ? o : o.value) === "") && <option value="">{p.placeholder}</option>}{p.options.map((o: Opt) => { const v = typeof o === "string" ? o : o.value; const l = typeof o === "string" ? o : o.label; return <option key={v} value={v}>{l}</option>; })}</select></label>;
}
function Input(p: { label?: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: C.muted, flex: "2 1 200px" }}>{p.label}<input style={ctl} type={p.type || "text"} value={p.value} placeholder={p.placeholder} onChange={(e: ChangeEvent<HTMLInputElement>) => p.onChange(e.target.value)} /></label>;
}
function Toggle(p: { label?: string; value: boolean; onChange: (v: boolean) => void }) {
  return <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13, color: C.text, cursor: "pointer" }}><input type="checkbox" checked={p.value} onChange={(e: ChangeEvent<HTMLInputElement>) => p.onChange(e.target.checked)} />{p.label}</label>;
}
function Button(p: { label: string; onClick: () => void; variant?: string }) {
  const pr = p.variant === "primary";
  return <button onClick={p.onClick} style={{ border: `1px solid ${pr ? C.green : C.line}`, background: pr ? C.green : C.soft, color: pr ? "#fff" : C.green, borderRadius: 999, padding: "8px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: SANS }}>{p.label}</button>;
}
function Callout(p: { tone?: string; children?: ReactNode }) {
  return <div style={{ background: p.tone === "warning" ? "#FBEFD9" : C.soft, border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 16px", color: C.text, fontSize: 14, margin: "12px 0" }}>{p.children}</div>;
}
function Text(p: { children?: ReactNode }) { return <p style={{ color: C.text, fontSize: 15, lineHeight: 1.55, margin: "12px 0" }}>{p.children}</p>; }
function Section(p: { heading?: string; children?: ReactNode }) {
  return <section style={{ marginTop: 24 }}>{p.heading && <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 26, color: C.green, margin: "0 0 12px" }}>{p.heading}</h2>}{p.children}</section>;
}
function Table(p: { columns: string[]; rows: ReactNode[][] }) {
  return <div style={{ overflowX: "auto", background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, margin: "12px 0" }}><table style={{ borderCollapse: "collapse", width: "100%", fontSize: 14, color: C.text }}><thead><tr>{p.columns.map((c: string) => <th key={c} style={{ textAlign: "left", padding: "10px 12px", borderBottom: `1px solid ${C.line}`, color: C.muted, fontWeight: 600 }}>{c}</th>)}</tr></thead><tbody>{p.rows.map((r: ReactNode[], i: number) => <tr key={i}>{r.map((c: ReactNode, j: number) => <td key={j} style={{ padding: "8px 12px", borderBottom: `1px solid ${C.line}`, verticalAlign: "top", whiteSpace: j === 0 ? "normal" : undefined }}>{c}</td>)}</tr>)}</tbody></table></div>;
}
function Properties(p: { items: { label: string; value: ReactNode }[] }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>{p.items.map((i: { label: string; value: ReactNode }) => <div key={i.label} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "8px 12px" }}><div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{i.label}</div><div style={{ color: C.text, fontSize: 14, marginTop: 2 }}>{i.value}</div></div>)}</div>;
}
function Steps(p: { steps: { title: ReactNode; detail?: ReactNode }[] }) {
  return <ol style={{ listStyle: "none", padding: 0, margin: "12px 0" }}>{p.steps.map((s: { title: ReactNode; detail?: ReactNode }, i: number) => <li key={i} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 14px", marginBottom: 8 }}><div style={{ fontWeight: 700, color: C.green, fontSize: 14 }}>{s.title}</div><div style={{ color: C.text, fontSize: 14, lineHeight: 1.5, marginTop: 4 }}>{s.detail}</div></li>)}</ol>;
}
function BulletList(p: { items: string[] }) { return <ul style={{ color: C.text, fontSize: 15, lineHeight: 1.6, paddingLeft: 20 }}>{p.items.map((i: string) => <li key={i}>{i}</li>)}</ul>; }
function Segmented(p: { value: string; onChange: (v: string) => void; options: { value: string; label: string; count?: number }[] }) {
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{p.options.map((o: { value: string; label: string }) => { const on = o.value === p.value; return <button key={o.value} onClick={() => p.onChange(o.value)} style={{ border: "none", borderRadius: 999, padding: "10px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", background: on ? C.green : "#E7E3D8", color: on ? "#fff" : C.green2, fontFamily: SANS }}>{o.label}</button>; })}</div>;
}
function Page(p: { title: string; summary?: string; width?: string; palette?: string[]; children?: ReactNode }) {
  return <div style={{ background: C.cream, color: C.text, fontFamily: SANS, minHeight: "100vh" }}>
    <header style={{ background: C.green, color: "#fff" }}><div style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 20px", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
      <div><div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 26 }}>El Chef de Antracita</div><div style={{ fontSize: 11, letterSpacing: 2, opacity: 0.8, marginTop: 4 }}>TU COCINA, BIEN ORGANIZADA</div></div>
      <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 999, padding: "8px 14px", fontSize: 12 }}>Recetario personal · {R.length} recetas</div>
    </div></header>
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 20px 48px" }}>{p.children}</main>
  </div>;
}
const EMO = (r: { pr: string; n: string }): string => { const p = norm(r.pr + " " + r.n); if (p.includes("pizza")) return "🍕"; if (p.includes("macarron") && p.includes("queso")) return "🧀"; if (p.includes("ensalada")) return "🥗"; if (p.includes("salmon") || p.includes("merluza")) return "🐟"; if (p.includes("pollo")) return "🍗"; if (p.includes("tortilla") || p.includes("revuelto")) return "🍳"; if (p.includes("huevo")) return "🥚"; if (p.includes("arroz")) return "🍚"; if (p.includes("crema")) return "🥣"; if (p.includes("lenteja") || p.includes("garbanzo")) return "🫘"; if (p.includes("pasta")) return "🍝"; return "🍽️"; };
const GRADS = ["linear-gradient(135deg,#DDEBD5,#B9D3B4)", "linear-gradient(135deg,#F3E2C7,#E2BC8A)", "linear-gradient(135deg,#D7EAE6,#A9CFCB)", "linear-gradient(135deg,#F4D9D4,#E5B3A8)", "linear-gradient(135deg,#E6E0F2,#C7BCE0)", "linear-gradient(135deg,#F6EDC6,#E6D48E)"];

type Rec = { n: string; pr: string; sana: string; dif: string; t: number; val: string; com: string; cc: string; rac: number; cong: string; nev: string; tm: string; ut: string; ing: string[][]; pasos: string[] };

const R: Rec[] = [{"n":"Huevos rosas en escabeche de remolacha","pr":"Huevo","sana":"Moderado","dif":"Media","t":35,"val":"⭐⭐⭐⭐⭐","com":"Cuanto más tiempo en el escabeche, más intenso el color: deja unos 2 h y otros toda la noche y tendrás un plato bicolor.","cc":"Comida (entrante)","rac":2,"cong":"No (la clara se vuelve gomosa)","nev":"3","tm":"No","ut":"Cazo pequeño de 1-1,5 L (huevos) · bol grande con agua y hielo · cazo mediano de 1,5-2 L (escabeche) · colador · tarro de cristal o tartera de 1 L con tapa (marinado) · papel de cocina · tabla y cuchillo · cuchara pequeña · bol mediano y tenedor (relleno) · manga pastelera con boquilla rizada (o bolsa de congelación con una esquina cortada) · fuente o plato · temporizador.","ing":[["4","Huevos (talla L)"],["1 ud (~150 g)","Remolacha cocida envasada"],["250 ml","Agua (para el escabeche)"],["50 ml","Vinagre de manzana"],["1 cdita","Azúcar"],["Al gusto","Sal"],["1,5 cda","Mayonesa"],["1,5 cda","Yogur griego natural"],["1 cdita","Mostaza de Dijon"],["1/2 cdita","Vinagre (para el relleno)"],["Al gusto","Perejil o eneldo picado"],["1 cda + 1 pizca","Cebollino picado + pimentón de la Vera"],["30-40 g (opcional)","Salmón ya cocinado, desmigado (sobrante de las recetas de salmón a la naranja o teriyaki)"]],"pasos":["COCER LOS HUEVOS (12 min + 5 de frío): en el cazo pequeño, agua que cubra los huevos 2 cm. Fuego máximo (9 de 9) hasta que hierva. Meter los 4 huevos con una cuchara, uno a uno, bajar a 6 de 9 y contar 10 minutos exactos (los 2 primeros, remover suavemente para que la yema quede centrada). Pasarlos al bol grande con agua y hielo 5 min y pelarlos golpeando la cáscara por todos lados. Están listos cuando la clara está firme y la yema cuajada del todo.","ESCABECHE (12 min + 15 de enfriado): en la tabla, cortar la remolacha en dados de 1 cm. En el cazo mediano: la remolacha, 250 ml de agua, 50 ml de vinagre de manzana, 1 cucharadita de azúcar y una pizca de sal. Fuego máximo (9) hasta que hierva, bajar a 5 de 9 y cocer 10 min. Está listo cuando el líquido es rojo intenso. Dejar enfriar 15 min y colarlo con el colador dentro del tarro (la remolacha se puede comer en ensalada).","MARINAR (mínimo 4 h): meter los huevos pelados en el tarro con el líquido ya frío; tienen que quedar cubiertos del todo. Tapar y a la nevera al menos 4 h (mejor toda la noche). Si no quedan cubiertos, darles la vuelta a mitad de tiempo.","PARTIR (3 min): sacar los huevos del tarro, secarlos con papel de cocina, partirlos a lo largo en la tabla con el cuchillo y sacar las yemas con la cuchara pequeña al bol mediano. Colocar las 8 mitades de clara en la fuente.","RELLENO (3 min): en el bol mediano, chafar las yemas con el tenedor y añadir 1,5 cucharadas de mayonesa, 1,5 de yogur griego, 1 cucharadita de mostaza, 1/2 cucharadita de vinagre, el perejil o eneldo picado y una pizca de sal. Remover 1 minuto. Está listo cuando es una crema lisa, sin grumos.","RELLENAR (3 min): meter la crema en la manga pastelera y rellenar las 8 mitades de clara que están en la fuente, haciendo una espiral.","TERMINAR Y SERVIR: en la tabla, picar fino el cebollino (1 cucharada). Ponerlo por encima con una pizca de pimentón de la Vera y, si hay, 30-40 g de migas de salmón ya cocinado. Servir frío (o tapar la fuente y a la nevera; ver Notas)."]},{"n":"Huevos rellenos de hummus, zanahoria y pepino","pr":"Huevo","sana":"Sí","dif":"Fácil","t":25,"val":"","com":"Variante: cambia el pimentón del hummus por comino o curry. Rellénalos justo antes de comer para que la verdura siga crujiente.","cc":"Cena","rac":2,"cong":"No","nev":"2","tm":"Sí","ut":"Cazo pequeño de 1-1,5 L (huevos) · bol grande con agua fría · colador (garbanzos) · tabla y cuchillo · cuchara pequeña · batidora de brazo con su vaso alto (hummus) · exprimidor · pelador · rallador (lado grueso) · bol mediano y cuchara (mezcla) · fuente o plato llano · temporizador. Versión TM5: Thermomix TM5 con vaso, tapa, cubilete, cestillo y espátula.","ing":[["4","Huevos"],["200 g","Garbanzos cocidos (medio bote de 400 g), escurridos"],["1 cda","Tahini (pasta de sésamo)"],["1/2 diente","Ajo"],["1/2 limón","Zumo de limón"],["1 cdita","Pimentón (dulce o de la Vera ahumado)"],["1","Zanahoria"],["1/2","Pepino"],["1 puñado","Canónigos"],["1-2 cda","Aceite de oliva virgen extra"],["1-2 cda","Agua (si el hummus queda espeso)"],["Al gusto","Sal"]],"pasos":["COCER LOS HUEVOS (12 min + 5 de frío): en el cazo pequeño, agua que cubra los huevos 2 cm y una pizca de sal. Fuego máximo (9 de 9) hasta que hierva. Meter los 4 huevos con una cuchara, bajar a 6 de 9 y contar 10 minutos exactos. Pasarlos al bol grande con agua fría 5 min y pelarlos. Están listos cuando la yema está cuajada del todo.","PARTIR (2 min): en la tabla, partir los huevos a lo largo con el cuchillo; sacar las yemas con la cuchara pequeña al bol mediano y colocar las 8 claras en la fuente.","HUMMUS (3 min): escurrir y enjuagar 200 g de garbanzos en el colador. En el vaso alto de la batidora: los garbanzos, 1 cucharada de tahini, 1/2 diente de ajo pelado, el zumo de 1/2 limón (con el exprimidor), una pizca de sal, 1/2 cucharadita de pimentón y 1 cucharada de aceite. Triturar 1 minuto; si queda espeso, añadir 1-2 cucharadas de agua y 30 segundos más. Está listo cuando es una crema lisa que cae despacio de la cuchara.","VERDURA (4 min): pelar la zanahoria con el pelador y rallarla con el lado grueso del rallador. En la tabla, cortar medio pepino en dados de medio centímetro.","MEZCLA (2 min): en el bol mediano, chafar las yemas con la cuchara, añadir el hummus, la zanahoria y el pepino y mezclar 1 minuto.","RELLENAR (3 min): con la cuchara, rellenar las 8 claras de la fuente formando una montañita.","SERVIR: espolvorear el resto del pimentón (1/2 cucharadita) y un hilo de aceite. Poner al lado de la fuente un puñado de canónigos aliñados con 1 cucharada de aceite y una pizca de sal."]},{"n":"Salmón al vapor con salsa de naranja y patatas","pr":"Salmón","sana":"Sí","dif":"Fácil","t":35,"val":"","com":"Si el lomo es fino, sácalo 1 minuto antes: la salsa caliente termina de hacerlo. También queda muy bien con boniato en lugar de patata.","cc":"Comida","rac":2,"cong":"No (la patata cocida se estropea)","nev":"2","tm":"Sí","ut":"Plato hondo (descongelar) · papel de cocina · tabla y cuchillo · pelador · olla mediana de 3 L (patatas) · colador · sartén pequeña de 20 cm (salsa) · exprimidor · sartén antiadherente de 24-28 cm (salmón) · espátula · cuchara · 2 platos · termómetro de cocina · temporizador. Versión TM5: Thermomix TM5 con vaso, tapa, cubilete, espátula y Varoma (recipiente y bandeja).","ing":[["2 lomos (1 paquete de 250 g)","Salmón congelado en lomos (Poseidón, Ahorramás)"],["350 g","Patatas cortadas en rodajas finas"],["60 g","Cebolla"],["15 g","Aceite de oliva virgen extra (y un poco para pincelar)"],["100 g","Zumo de naranja natural (1-2 naranjas)"],["30 g","Agua"],["15 g","Miel"],["Al gusto","Sal y pimienta negra"]],"pasos":["DESCONGELAR (la víspera): pasar los 2 lomos del congelador al plato hondo, tapados, y a la nevera unas 12 h. Antes de cocinar, secarlos bien con papel de cocina.","PATATAS (15-18 min): pelar 350 g de patatas con el pelador y cortarlas en la tabla en rodajas de medio centímetro. En la olla mediana, agua que las cubra y 1 cucharadita de sal; fuego máximo (9 de 9) hasta que hierva. Añadir las patatas, bajar a 6 de 9 y cocer 12-15 min. Están listas cuando la punta del cuchillo entra sin resistencia. Escurrirlas en el colador.","SOFRITO (6 min): en la tabla, picar 60 g de cebolla en daditos de medio centímetro. En la sartén pequeña, 15 g de aceite a fuego medio-bajo (4 de 9) y esperar 1 min. Añadir la cebolla y remover cada minuto durante 5 min. Está lista cuando está transparente y blanda, sin dorarse.","SALSA (5 min): exprimir 1-2 naranjas con el exprimidor hasta tener 100 g de zumo. Añadir a la sartén pequeña el zumo, 30 g de agua, 15 g de miel, sal y pimienta. Subir a 6 de 9 y dejar reducir 4-5 min. Está lista cuando cubre («napa») el dorso de la cuchara, como un almíbar ligero.","SALMÓN (6-7 min): en la sartén antiadherente, unas gotas de aceite a fuego medio-alto (7 de 9) y esperar 1 min. Salpimentar los lomos y ponerlos con la piel hacia abajo 3-4 min sin moverlos; darles la vuelta con la espátula y 2-3 min más. Está listo cuando por fuera está opaco y al presionar el centro se separa en láminas (punto jugoso). TEMPERATURA: sin sacarlo de la sartén antiadherente, pinchar el termómetro de cocina por el lateral del lomo hasta el centro de la parte más gruesa, sin tocar la sartén, y esperar unos segundos a que la cifra se estabilice: tiene que marcar 63 °C. Si no llega, seguir 2 minutos más a fuego 5 de 9 y volver a medir.","EMPLATAR: en cada plato, una base de patatas, el lomo encima y 2-3 cucharadas de salsa de la sartén pequeña por encima. Opcional: un poco de ralladura de naranja."]},{"n":"Salmón teriyaki con arroz basmati y brócoli","pr":"Salmón","sana":"Sí","dif":"Fácil","t":35,"val":"","com":"Al cocinar para congelar, deja el brócoli un punto al dente: al recalentar termina de hacerse y no se queda blando.","cc":"Comida","rac":4,"cong":"Sí","nev":"2","tm":"No","ut":"Plato hondo (descongelar) · tabla y cuchillo · rallador fino (jengibre) · exprimidor · cazo de 1-1,5 L (salsa) · bol mediano (marinar) · colador · olla grande de 4 L (arroz) · olla mediana de 3 L con tapa y cestillo de vapor (brócoli) · sartén grande de 28 cm · espátula · plato llano (reservar el salmón) · 2 platos · 2 tarteras herméticas aptas para congelador · termómetro de cocina · temporizador.","ing":[["4 lomos (2 paquetes de 250 g)","Salmón congelado en lomos (Poseidón, Ahorramás)"],["320 g","Arroz basmati"],["400 g","Brócoli en ramilletes"],["120 ml","Salsa de soja (mejor baja en sal)"],["60 ml","Miel"],["60 ml","Zumo de limón"],["120 ml","Agua"],["4 cm","Jengibre fresco"],["2 cditas","Sésamo tostado"],["Al gusto","Cilantro o cebolleta picada"],["2 chorritos","Aceite de oliva virgen extra"],["Al gusto","Sal y pimienta"],["Opcional","Jengibre encurtido para decorar"]],"pasos":["DESCONGELAR (la víspera): pasar los 4 lomos al plato hondo, tapados, y a la nevera unas 12 h. En la tabla, quitarles la piel con el cuchillo y cortarlos en dados de unos 3 cm.","SALSA (5 min): en el cazo: 120 ml de soja, 60 ml de miel, 120 ml de agua, 60 ml de zumo de limón (con el exprimidor) y 4 cm de jengibre pelado y rallado con el rallador fino. Fuego máximo (9 de 9) hasta que hierva, bajar a 5 de 9 y cocer 4 min. Retirar y dejar templar.","MARINAR (10 min): en el bol mediano, los dados de salmón con 4 cucharadas de la salsa; remover y dejar 10 min. Mientras, el resto de la salsa sigue en el cazo a fuego 5 de 9 otros 4-5 min. Está lista cuando cubre («napa») el dorso de la cuchara.","ARROZ (10 min de hervor + 12 de cocción): lavar 320 g de arroz en el colador bajo el grifo 45 segundos. En la olla grande, 2,5 L de agua y 2 cucharaditas de sal a fuego máximo (9) hasta que hierva. Echar el arroz, remover una vez, bajar a 6 de 9 y cocer 12 min sin tapa. Está listo cuando el grano está tierno pero entero. Escurrirlo en el colador.","BRÓCOLI (5 min): en la tabla, cortar 400 g de brócoli en ramilletes de 3-4 cm. En la olla mediana, 3 dedos de agua a fuego máximo (9); cuando hierva, poner el brócoli en el cestillo de vapor dentro de la olla, tapar y cocer 5 min. Está listo cuando es verde intenso y el tenedor entra con un poco de resistencia.","SALMÓN EN 2 TANDAS (8-9 min): en la sartén grande, un chorrito de aceite a fuego fuerte (8 de 9) y esperar 1 min. Echar la mitad del salmón escurrido y dorarlo 3-4 min por todos lados sin amontonarlo; pasarlo al plato llano. Repetir con la otra mitad. Volver a poner todo en la sartén, verter la salsa reducida del cazo y remover 30 segundos a fuego 5. Está listo cuando está dorado, brillante y se separa en láminas. TEMPERATURA: en la sartén grande (antes de añadir la salsa en la segunda tanda), pinchar el termómetro de cocina en el centro del dado de salmón más grueso, sin tocar la sartén, y esperar unos segundos a que la cifra se estabilice: tiene que marcar 63 °C. Si no llega, seguir 2 minutos más y volver a medir.","SERVIR 2 RACIONES: en los 2 platos, arroz, brócoli al lado y salmón con salsa por encima; terminar con sésamo, cilantro o cebolleta (y jengibre encurtido si se quiere).","LAS OTRAS 2 RACIONES: repartir arroz, brócoli y salmón con su salsa en las 2 tarteras, dejarlas templar destapadas (como mucho 1 h fuera de la nevera), taparlas y a la nevera o al congelador (ver Notas)."]},{"n":"Crema de calabacín y puerro con huevo poché","pr":"Calabacín","sana":"Sí","dif":"Fácil","t":35,"val":"","com":"Si al descongelarla queda algo aguada, dale un hervor de 2 minutos sin tapa. Variante: un puñado de espinacas al triturar.","cc":"Cena","rac":4,"cong":"Sí (solo la crema; el huevo poché se hace al servir)","nev":"3","tm":"Sí","ut":"Tabla y cuchillo · pelador · olla grande de 4-5 L con tapa · batidora de brazo · cazo pequeño de 1,5 L (para el poché) · taza pequeña (para cascar el huevo) · cuchara · espumadera · papel de cocina · taza medidora · cuchara sopera · cuencos · 2 tarteras herméticas aptas para congelador · termómetro de cocina · temporizador. Versión TM5: Thermomix TM5 con vaso, tapa, cubilete y espátula (y un trapo para sujetar el cubilete al triturar).","ing":[["4 medianos (unos 1 kg)","Calabacín, con piel"],["2 (unos 300 g)","Puerro (solo la parte blanca y verde clara)"],["2 medianas (unos 300 g)","Patata"],["1 litro","Agua"],["2 pastillas o 2 cditas rasas (10 g)","Caldo de verduras en pastilla, o sal"],["2 (opcional)","Quesito en porción (light si hay), para que quede más cremosa"],["2 cdas (20 g) + un hilo al servir","Aceite de oliva virgen extra"],["4 (1 por ración; se hacen al servir, nunca se congelan)","Huevos (los más frescos que tengáis)"],["1 cda (15 ml)","Vinagre (para el agua del poché)"],["Al gusto","Pimienta negra y una pizca de pimentón"]],"pasos":["PREPARAR VERDURAS (8 min, en la tabla con el cuchillo y el pelador): lavar los 4 calabacines, quitar las dos puntas y cortarlos en rodajas de 1 cm (con piel). Puerros: cortar la raíz y la parte verde oscura, abrirlos a lo largo, lavarlos bajo el grifo separando las capas (suelen tener tierra) y cortarlos en rodajas de 1 cm. Patatas: pelarlas y cortarlas en dados de unos 2 cm.","SOFRITO (8 min): olla GRANDE de 4-5 L a fuego medio (5 de 9) con 2 cucharadas de aceite; esperar 2 min a que se caliente. Añadir el puerro y remover cada minuto durante 6 min. Está listo cuando está blando y transparente, sin llegar a dorarse (si se dora, bajar a 4).","COCER (8 + 15-18 min): en la misma olla grande, añadir el calabacín, la patata, el litro de agua (medido con la taza medidora) y las 2 pastillas de caldo (o la sal). Subir a fuego máximo (9) hasta que hierva con burbujas grandes (unos 8 min, tarda más que con media cantidad). Bajar a fuego medio-bajo (4 de 9), tapar y cocer 15-18 min. Está lista cuando un trozo de patata se deshace al pincharlo con un tenedor.","TRITURAR (12 min): apagar el fuego y dejar templar 10 min (sin tapa). Añadir los quesitos y triturar con la batidora de brazo unos 3 min, moviendo por toda la olla, hasta que no quede ningún grumo. Probar y añadir sal si hace falta. Si está muy espesa, añadir 100 ml de agua y batir otra vez. Apartar ahora las 2 raciones para congelar (ver Notas) y dejar el resto en la olla tapada.","AGUA DEL POCHÉ (6 min, se puede hacer mientras cuece la crema): en un cazo pequeño poner 1 litro de agua y 1 cucharada de vinagre, sin sal. Fuego máximo (9) hasta que hierva. Bajar a fuego medio (4-5 de 9): el agua debe moverse con burbujitas pequeñas, sin borbotones.","POCHÉ (3-4 min por huevo; solo los de las raciones que se sirven ahora, normalmente 2): cascar un huevo en una taza pequeña. Con una cuchara, remover el agua en círculo para hacer un remolino y, en el centro, dejar caer el huevo despacio desde la taza. No tocarlo. 3 min exactos = yema líquida; 4 min = yema medio cuajada. Está listo cuando la clara está toda blanca (nada transparente) y la yema tiembla al mover el cazo.","SACAR: con una espumadera, sacar el huevo y dejarlo 10 segundos sobre papel de cocina para que escurra. Repetir con el siguiente huevo (si el cazo es ancho, pueden hacerse dos a la vez en lados distintos; para 4 raciones a la vez, en 2 tandas).","SERVIR: repartir la crema en cuencos (unos 350 ml cada uno), poner el huevo poché en el centro, un hilo de aceite, pimienta y una pizca de pimentón. Se rompe la yema al comer y se mezcla con la crema."]},{"n":"Bowl templado de basmati, brócoli, huevo y salsa de yogur y limón","pr":"Arroz basmati","sana":"Sí","dif":"Fácil","t":20,"val":"","com":"Variante: huevo a la plancha en lugar de cocido o unos garbanzos tostados por encima. Monta el bowl justo antes de comer.","cc":"Comida","rac":2,"cong":"No","nev":"1","tm":"No","ut":"Olla mediana de 2-3 L con tapa · colador · cazo pequeño de 1-1,5 L (huevos) · bol con agua fría · tabla y cuchillo · pelador · rallador (lado grueso para la zanahoria, lado fino para la piel del limón) · exprimidor o tenedor · bol pequeño y tenedor (salsa) · cuchara · 2 cuencos · termómetro de cocina · temporizador.","ing":[["150 g","Arroz basmati"],["1 litro + 1 cdita (5 g) de sal","Agua para cocer el arroz y el brócoli"],["250 g (1 cabeza pequeña)","Brócoli"],["4","Huevos"],["1 (unos 80 g)","Zanahoria"],["1/2 (unos 100 g)","Pepino"],["1 (125 g)","Yogur natural (o griego) sin azúcar"],["1/2","Limón (ralladura y zumo)"],["1 cdita (5 ml) + un hilo","Aceite de oliva virgen extra"],["1 pizca","Sal (para la salsa)"],["1 pizca","Pimentón (dulce o de la Vera) o perejil picado"]],"pasos":["HERVIR EL AGUA (6-8 min): en una olla mediana poner 1 litro de agua y 1 cucharadita de sal. Tapar y poner a fuego máximo (9 de 9) hasta que hierva con burbujas grandes.","PREPARAR MIENTRAS HIERVE (5 min): en la tabla, cortar el brócoli en ramilletes pequeños, de unos 3-4 cm (el tronco grueso, pelado y en rodajas de medio cm). Lavar el arroz en el colador bajo el grifo 30 segundos, moviendo con la mano, hasta que el agua salga menos turbia.","ARROZ (11 min): echar el arroz en la olla mediana con el agua hirviendo, remover una vez con la cuchara para que no se pegue, quitar la tapa y bajar a fuego medio-alto (6 de 9). Poner el temporizador en 11 minutos.","HUEVOS (9 min + 3 min de frío): a la vez, en el cazo pequeño con agua que cubra los huevos 2 cm, fuego máximo (9) hasta que hierva. Meter los 4 huevos con la cuchara, uno a uno, bajar a 6 de 9 y contar 9 minutos exactos (yema cuajada pero jugosa). Pasarlos al bol con agua fría del grifo 3 min, pelarlos golpeando la cáscara por todos lados y cortarlos en cuartos a lo largo en la tabla.","BRÓCOLI EN LA MISMA OLLA: cuando al arroz le queden 4 minutos (minuto 7 del temporizador), echar el brócoli en la olla del arroz. Al acabar los 11 min, probar un grano: tiene que estar tierno pero entero. El brócoli debe estar verde intenso y pincharse fácil con un tenedor. Escurrir todo junto en el colador.","VERDURA CRUDA (3 min): pelar la zanahoria con el pelador y rallarla con el lado de agujero grueso del rallador. En la tabla, lavar el pepino (con piel) y cortarlo en dados de 1 cm.","SALSA (2 min): en el bol pequeño, poner el yogur, la ralladura de medio limón (con el lado fino del rallador; solo la piel amarilla, sin lo blanco, que amarga), el zumo de medio limón (con el exprimidor; aprox. 1 cucharada y media), una pizca de sal y 1 cucharadita de aceite. Remover con el tenedor 30 segundos hasta que esté lisa.","MONTAR: repartir el arroz con brócoli en 2 cuencos. A un lado, la zanahoria rallada y el pepino. Encima, 2 huevos en cuartos por persona. Repartir la salsa por encima (unas 3 cucharadas por cuenco), un hilo de aceite y una pizca de pimentón. Se come templado."]},{"n":"Tosta de hummus con huevo, pepino y zanahoria","pr":"Huevo","sana":"Sí","dif":"Fácil","t":15,"val":"","com":"Frota el pan recién tostado con medio diente de ajo antes de untar el hummus: más sabor sin gastar más.","cc":"Cena","rac":2,"cong":"No","nev":"0 (al momento; hummus, huevo y verdura por separado: 2 días)","tm":"No","ut":"Cazo pequeño de 1-1,5 L · cuchara · bol con agua fría · tabla · cuchillo de sierra (pan) y cuchillo normal · pelador · rallador (lado grueso) · sartén de 24-28 cm o tostadora · espátula o pinzas · cuchillo de untar · cuchara sopera · temporizador.","ing":[["4 rebanadas de 1,5 cm (unos 40 g cada una)","Pan de barra o pan rústico (mejor que pan de molde)"],["120 g (unas 8 cucharadas)","Hummus (el que sobre de los huevos de hummus, o una tarrina del súper)"],["4","Huevos"],["1/2 (unos 100 g)","Pepino"],["1 (unos 80 g)","Zanahoria"],["1 cdita","Sésamo o una pizca de pimentón de la Vera"],["4 cditas (1 por tosta)","Aceite de oliva virgen extra"],["Al gusto","Sal y pimienta negra"]],"pasos":["HERVIR AGUA (5 min): en el cazo pequeño de 1-1,5 L, agua suficiente para que cubra los huevos 2 cm. Fuego máximo (9 de 9) hasta que hierva con burbujas grandes. Mientras, preparar el bol con agua fría del grifo.","COCER LOS HUEVOS (8 min): meter los 4 huevos en el cazo con la cuchara, uno a uno, para que no se rompan. Bajar a fuego medio-alto (6 de 9) y poner el temporizador: 8 minutos exactos = yema cremosa (como en la fuente); 10 minutos = yema totalmente cuajada.","ENFRIAR Y PELAR (3 min): pasar los huevos al bol de agua fría y dejarlos 3 min. Golpearlos por todos lados contra la encimera y pelarlos bajo el grifo. En la tabla, cortarlos con el cuchillo normal en rodajas de medio centímetro (o en cuartos).","VERDURA (mientras cuecen los huevos, 3 min): en la tabla, lavar el pepino y cortarlo con piel en rodajas de medio centímetro (salen unas 12) con el cuchillo normal. Pelar la zanahoria con el pelador y rallarla con el lado de agujero grueso del rallador.","TOSTAR EL PAN (5 min): cortar las 4 rebanadas de 1,5 cm en la tabla con el cuchillo de sierra. Sartén de 24-28 cm sin aceite a fuego medio-alto (7 de 9), calentar 1 min. Poner las rebanadas y tostarlas 2 min por cada lado, dándoles la vuelta con la espátula o las pinzas. Están listas cuando están doradas y crujientes por fuera (si se oscurecen antes, bajar a 6). También vale la tostadora, 2-3 min.","UNTAR: con la cuchara sopera y el cuchillo de untar, extender en cada tosta 30 g de hummus (2 cucharadas colmadas), llegando hasta los bordes.","MONTAR: encima del hummus, 3 rodajas de pepino, un puñadito de zanahoria rallada y las rodajas de 1 huevo por tosta.","TERMINAR Y SERVIR: una pizca de sal y pimienta sobre el huevo, el sésamo o el pimentón y 1 cucharadita de aceite por tosta. Servir enseguida para que el pan no se ablande (2 tostas por persona)."]},{"n":"Arroz tres delicias casero (huevo, zanahoria, guisantes y jamón)","pr":"Arroz basmati","sana":"Sí","dif":"Fácil","t":25,"val":"","com":"Un hilo de aceite de sésamo al final le da el toque de restaurante. Saltea siempre a fuego fuerte y sin tapar.","cc":"Cena","rac":4,"cong":"Sí","nev":"1","tm":"No","ut":"Colador · olla grande de 4 L con tapa · 2 bandejas o platos grandes (para enfriar el arroz) · cazo de 1,5-2 L · bol y tenedor (batir huevos) · plato (reservar el huevo) · sartén grande de 28 cm o wok · espátula · fuente de servir · tabla y cuchillo · pelador · cuchara sopera (para medir) · 2 tarteras herméticas aptas para congelador · termómetro de cocina · temporizador (el móvil vale).","ing":[["300 g en crudo (unos 800 g ya cocido)","Arroz basmati (o el que sobre del bowl de basmati, ya cocido y frío)"],["2 litros + 2 cditas (10 g) de sal","Agua para cocer el arroz (cocción en agua abundante, proporción aprox. 1:7, y se escurre)"],["4","Huevos"],["2 (unos 160 g)","Zanahoria"],["100 g (4 puñados)","Guisantes congelados"],["120 g","Jamón cocido en taquitos (o 2 lonchas gruesas cortadas en dados de 1 cm)"],["1 litro","Agua para cocer zanahoria y guisantes"],["50 ml (20 + 15 + 15 ml; unas 10 cucharaditas)","Aceite de girasol o de oliva suave"],["30 ml (2 cucharadas)","Salsa de soja"],["2 tallos (opcional)","Cebolleta (solo la parte verde) o cebollino"],["2 pizcas","Sal (para los huevos)"]],"pasos":["ARROZ (si no hay arroz cocido del día anterior; 25 min): poner los 300 g de arroz en el colador y lavarlo bajo el grifo 45 segundos, moviendo con la mano, hasta que el agua salga casi clara. En la olla grande de 4 L, 2 litros de agua con 2 cucharaditas de sal; tapar y fuego máximo (9 de 9) hasta que hierva con burbujas grandes (10-12 min). Echar el arroz, remover una vez, quitar la tapa y bajar a 6 de 9. Cocer 11 minutos exactos. Está listo cuando un grano está tierno pero entero. Escurrir en el colador.","ENFRIAR EL ARROZ (40 min, la clave para que quede suelto): extenderlo en 2 bandejas o platos grandes, en capa fina, sin tapar. Dejarlo 10 min en la encimera y luego 30 min en la nevera, sin tapa (o en tarteras toda la noche). Nunca más de 1 hora fuera de la nevera. Está listo cuando al tocarlo los granos están fríos, secos y se separan solos con los dedos. Antes de usarlo, deshacer los grumos con las manos.","ZANAHORIA Y GUISANTES (10 min): en la tabla, pelar las 2 zanahorias con el pelador y cortarlas en dados de medio centímetro (rodajas de 0,5 cm, luego tiras y luego dados). En el cazo de 1,5-2 L, 1 litro de agua a fuego máximo (9) hasta que hierva. Echar la zanahoria y los 100 g de guisantes (congelados, tal cual) y cocer 4 minutos exactos desde que vuelva a hervir. Escurrir en el colador. Están listos cuando la zanahoria se pincha con un tenedor pero sigue firme.","HUEVO (3 min): en el bol, batir los 4 huevos con 2 pizcas de sal 30 segundos con el tenedor. En la sartén grande, 20 ml de aceite (4 cucharaditas) a fuego medio (5 de 9) y esperar 1 min. Verter el huevo, dejarlo quieto 45 segundos y luego remover con la espátula 45 segundos más. Está listo cuando está cuajado pero todavía brillante, sin dorarse. Sacarlo al plato y trocearlo con la espátula en trozos de 1 cm.","SALTEAR EN 2 TANDAS (la sartén de 28 cm no admite 800 g de arroz de una vez: si se amontona, se cuece en vez de saltearse). TANDA 1, BASE (3 min): en la misma sartén (sin lavar), 15 ml de aceite (1 cucharada) a fuego fuerte (8 de 9) y esperar 1 min hasta que esté muy caliente. Añadir la MITAD de la zanahoria, los guisantes y el jamón y saltear 2 minutos removiendo sin parar.","TANDA 1, ARROZ (4 min): añadir la MITAD del arroz frío y repartirlo por la sartén. Remover sin parar 4 minutos exactos con el fuego en 8 de 9. Tiene que chisporrotear («sonar»). Está listo cuando los granos están sueltos, calientes y algunos un poco tostados. Si se pega mucho, bajar a 7.","TANDA 1, REMATAR (1 min): añadir la mitad del huevo troceado y 1 cucharada (15 ml) de salsa de soja repartida por encima. Saltear 1 minuto más y pasar a una fuente. REPETIR los pasos 5 a 7 con la TANDA 2 (otros 15 ml de aceite, el resto de ingredientes y la otra cucharada de soja). Probar: normalmente no hace falta sal porque la soja ya sala. La soja va siempre al final para que no se queme.","SERVIR (sin reposo): espolvorear la cebolleta picada fina y servir enseguida 2 platos. No tapar la fuente: el vapor humedece el arroz. Las otras 2 raciones, enfriarlas rápido extendidas en una tartera plana y a la nevera o al congelador antes de 1 hora (ver Notas)."]},{"n":"Arroz caldoso de pollo y verduras","pr":"Arroz redondo","sana":"Sí","dif":"Fácil","t":45,"val":"","com":"Variante de temporada: añade alcachofa o judías verdes con el sofrito. Mejor recién hecho: el arroz caldoso no espera.","cc":"Comida","rac":2,"cong":"No (el arroz se pasa)","nev":"1","tm":"Sí","ut":"Tabla y cuchillo · pelador · cazuela baja u olla mediana de 2-3 L (unos 24 cm) con tapa · cazo para calentar el caldo · cuchara de madera · taza medidora (o báscula) · cucharas sopera y de postre (para medir) · termómetro de cocina · temporizador. Versión TM5: Thermomix TM5 con vaso, tapa, cubilete, cestillo (como tapa antisalpicaduras) y espátula.","ing":[["100 g","Arroz redondo (tipo bomba o normal); NO se lava"],["450 ml al fuego / 325 g en TM5","Caldo de pollo (o agua + 1/2 pastilla de caldo de pollo). Proporción arroz:caldo = 1:4,5 al fuego (se evapora más) y 1:3,25 en TM5"],["150 g","Contramuslos de pollo sin piel ni hueso"],["50 g (1/2 cebolla pequeña)","Cebolla"],["50 g (1/2 pimiento)","Pimiento verde o rojo"],["50 g (1/2 zanahoria)","Zanahoria"],["1 pequeño","Diente de ajo"],["75 g","Brócoli en ramilletes pequeños (el que sobre del bowl o del teriyaki)"],["50 g","Guisantes congelados"],["20 g (2 cucharadas)","Aceite de oliva virgen extra"],["1/2 cucharada","Tomate frito"],["1 pizca de cada","Tomillo y romero secos (o 1 hoja de laurel)"],["4 hebras o 1/2 cdita","Azafrán, o pimentón dulce (más barato) + 1/2 cdita de sal"]],"pasos":["CORTAR (8 min, en la tabla con el cuchillo y el pelador): pelar y picar el ajo muy fino. Cebolla en dados de medio centímetro. Pimiento y zanahoria (pelada) en dados de 1 cm. Pollo en dados de 2-3 cm con una pizca de sal. Brócoli en ramilletes de 2-3 cm.","CALDO CALIENTE: medir 450 ml de caldo con la taza medidora y ponerlo en el cazo a fuego 4 de 9 para que esté caliente (sin hervir fuerte) cuando haga falta. Si se usa pastilla, disolver 1/2 pastilla en 450 ml de agua en el cazo.","SOFRITO (11 min): en la cazuela de unos 24 cm, 2 cucharadas de aceite a fuego medio (5 de 9) y esperar 1 min. Añadir cebolla, pimiento, zanahoria y ajo y cocinar 10 minutos removiendo cada 2 min con la cuchara de madera. Está listo cuando la cebolla está transparente y blanda y el pimiento tierno, sin quemarse (si se dora mucho, bajar a 4).","POLLO (4 min): en la misma cazuela, subir a fuego 6 de 9, añadir el pollo y remover 3-4 minutos. Está listo cuando está blanco por fuera en todas sus caras.","SABOR (1 min): añadir a la cazuela 1/2 cucharada de tomate frito, el tomillo, el romero y el azafrán (o el pimentón). Remover 1 minuto, sin dejar que el pimentón se queme (amarga).","CALDO (8 min): verter en la cazuela el caldo caliente del cazo, subir a fuego máximo (9) hasta que hierva (2-3 min) y bajar a 5 de 9 durante 5 minutos para que coja sabor.","ARROZ (15 min): añadir a la cazuela los 100 g de arroz SIN lavar (su almidón lo hace meloso), la sal, los guisantes y el brócoli. Remover una vez y dejar a fuego medio-bajo (4-5 de 9), hirviendo suave, 15 minutos sin tapa, removiendo con cuidado cada 5 min. Está listo cuando el grano está tierno con un puntito firme en el centro y queda caldo meloso alrededor. TEMPERATURA DEL POLLO: en la cazuela, pinchar el termómetro de cocina en el centro del dado de pollo más grueso, sin tocar el fondo ni las paredes de la cazuela, y esperar unos segundos a que la cifra se estabilice: tiene que marcar 74 °C. Si no llega, seguir 2 minutos más y volver a medir. Si se queda seco antes de tiempo, añadir 50 ml de caldo o agua caliente.","REPOSO Y SERVIR (5 min): apagar el fuego, tapar la cazuela con su tapa y dejar reposar 5 minutos exactos, no más (sigue absorbiendo caldo y se pasa). Servir enseguida en los platos; un chorrito de limón por encima queda muy bien."]},{"n":"Lentejas estofadas con verduras","pr":"Lenteja","sana":"Sí","dif":"Fácil","t":55,"val":"","com":"Variante: añade un puñado de espinacas los últimos 2 minutos o una pizca de comino con el pimentón. Al día siguiente están todavía más ricas.","cc":"Comida","rac":4,"cong":"Sí","nev":"3","tm":"Sí","ut":"Colador · tabla y cuchillo · pelador · olla grande de 4 L con tapa · cuchara de madera · taza medidora · cucharas sopera y de postre (para medir) · 2 platos hondos · 2 tarteras herméticas aptas para congelador · termómetro de cocina · temporizador. Versión TM5: Thermomix TM5 con vaso, tapa, cubilete, cestillo (como tapa antisalpicaduras) y espátula.","ing":[["300 g","Lentejas pardinas (no necesitan remojo)"],["1 mediana (unos 150 g)","Cebolla"],["1 (unos 150 g)","Pimiento verde o rojo"],["2 (unos 160 g)","Zanahoria"],["2 pequeñas (unos 300 g)","Patata"],["2 dientes","Ajo"],["1 hoja","Laurel"],["1 cdita (3 g)","Pimentón dulce (o de la Vera)"],["2 cdas (20 g)","Tomate frito"],["3 cdas (30 g)","Aceite de oliva virgen extra"],["1,3 litros al fuego / 1000 g en TM5","Agua"],["1 pastilla (10 g)","Caldo de verduras en pastilla (o 2 cditas de sal)"],["Al gusto","Sal y un chorrito de vinagre al servir (opcional)"]],"pasos":["LAVAR Y CORTAR (10 min): en el colador, lavar los 300 g de lentejas bajo el grifo 30 segundos y quitar alguna piedrecita. En la tabla con el cuchillo: cebolla y pimiento en dados de medio cm; ajo picado fino; zanahoria (pelada con el pelador) en rodajas de 1 cm; patata pelada en trozos de 2-3 cm «chascados» (cortar a medias y romper tirando: suelta almidón y espesa el caldo).","SOFRITO (10 min): en la olla grande de 4 L, 3 cucharadas de aceite a fuego medio (5 de 9) y esperar 1 min. Añadir cebolla, pimiento y ajo y remover con la cuchara de madera cada 2 min durante 8-10 min. Está listo cuando la cebolla está transparente y blanda, sin dorarse (si se dora, bajar a 4).","PIMENTÓN Y TOMATE (1 min): en la misma olla, bajar a fuego 3 de 9, añadir la cucharadita de pimentón y remover solo 20 segundos (se quema enseguida y amarga); añadir al momento las 2 cucharadas de tomate frito y remover 30 segundos.","TODO A LA OLLA (5 min): añadir a la olla las lentejas, la zanahoria, la patata, el laurel, la pastilla de caldo y 1,3 L de agua fría (medida con la taza medidora). Subir a fuego máximo (9 de 9) hasta que hierva (unos 5 min).","COCER (35-40 min): bajar a fuego suave (3-4 de 9), tapar la olla dejando una rendija y cocer 35-40 min, removiendo desde el fondo cada 10 min. Si se queda sin caldo, añadir 100 ml de agua caliente. Están listas cuando la lenteja está tierna (se aplasta con la lengua contra el paladar) y la patata se deshace al pincharla con un tenedor.","ESPESAR Y PROBAR (5 min): apagar el fuego y sacar el laurel. Aplastar 3-4 trozos de patata contra la pared de la olla con la cuchara de madera y remover: el caldo espesa. Probar y ajustar de sal. Dejar reposar 5 min con la olla tapada.","SERVIR Y GUARDAR: servir 2 platos hondos (unos 400 g cada uno), con un chorrito de vinagre si se quiere. Las otras 2 raciones, a las 2 tarteras; dejarlas templar destapadas (como mucho 1 h fuera de la nevera), taparlas y a la nevera o al congelador (ver Notas)."]},{"n":"Pollo al curry suave con arroz basmati","pr":"Pollo","sana":"Sí","dif":"Fácil","t":45,"val":"","com":"Variante: cambia la mitad del pollo por garbanzos cocidos o añade un puñado de espinacas al final. Un poco de cebolleta picada por encima le da frescor.","cc":"Comida","rac":4,"cong":"Sí","nev":"2","tm":"No","ut":"Tabla y cuchillo · colador · olla grande de 4 L con tapa (arroz) · sartén honda o cazuela de 28 cm con tapa (curry) · cuchara de madera · plato (reservar el pollo) · taza medidora · abrelatas · exprimidor · 2 platos · 2 tarteras herméticas aptas para congelador · termómetro de cocina · temporizador.","ing":[["600 g","Contramuslos de pollo sin piel ni hueso (o pechuga)"],["1 grande (unos 200 g)","Cebolla"],["1 (unos 150 g)","Pimiento rojo"],["2 dientes","Ajo"],["2 cditas rasas (6 g)","Curry en polvo suave"],["1 lata (400 ml)","Leche de coco ligera (o nata ligera para cocinar)"],["200 g (4 cdas colmadas)","Tomate triturado"],["200 g","Guisantes congelados"],["320 g","Arroz basmati"],["2,5 litros + 2 cditas (10 g) de sal","Agua para cocer el arroz"],["2 cdas (20 g)","Aceite de oliva virgen extra"],["1/2","Limón (zumo, al final)"],["Al gusto","Sal"]],"pasos":["CORTAR (8 min): en la tabla con el cuchillo, el pollo en dados de 3 cm con una pizca de sal. La cebolla en dados de medio cm, el pimiento en trozos de 2-3 cm y el ajo picado fino.","AGUA DEL ARROZ: en la olla grande de 4 L, 2,5 L de agua con 2 cucharaditas de sal; tapar y poner a fuego máximo (9 de 9) hasta que hierva (10-12 min). Mientras, seguir con el curry.","DORAR EL POLLO (6 min): en la sartén honda de 28 cm, 1 cucharada de aceite a fuego medio-alto (7 de 9) y esperar 1 min. Poner el pollo en una sola capa, sin amontonar: 3 min sin moverlo y 3 min más removiendo. Está listo cuando está dorado por fuera (por dentro termina en la salsa). Sacarlo al plato.","SOFRITO (8 min): en la misma sartén, otra cucharada de aceite a fuego medio (5 de 9). Añadir cebolla, pimiento y ajo y cocinar 8 min removiendo cada 2 min con la cuchara de madera. Está listo cuando la cebolla está blanda y transparente.","ESPECIAS (30 s): en la sartén, bajar a 4 de 9, añadir las 2 cucharaditas de curry y remover 30 segundos, hasta que huela (no más: se quema y amarga).","SALSA (15 min): añadir a la sartén el tomate triturado, la leche de coco (agitar antes la lata) y el pollo con su jugo. Subir a 9 hasta que hierva, bajar a 3-4 de 9, tapar y cocer 12 min removiendo cada 4. Añadir los guisantes congelados y 3 min más. Está listo cuando el pollo, al partir el trozo más gordo, está blanco por dentro y la salsa cubre la cuchara. TEMPERATURA: en la sartén honda, pinchar el termómetro de cocina en el centro del dado de pollo más gordo, sin tocar la sartén, y esperar unos segundos a que la cifra se estabilice: tiene que marcar 74 °C. Si no llega, seguir 2 minutos más tapado a fuego 3-4 de 9 y volver a medir. Si espesa demasiado, añadir 50 ml de agua.","ARROZ (12 min): lavar los 320 g de arroz en el colador bajo el grifo 45 segundos. Echarlo en la olla grande con el agua hirviendo, remover una vez, quitar la tapa y cocer a fuego 6 de 9 durante 11-12 min. Está listo cuando el grano está tierno pero entero. Escurrir en el colador.","TERMINAR Y SERVIR: apagar la sartén, añadir el zumo de medio limón (con el exprimidor) y probar de sal. Servir 2 platos con arroz y curry al lado. Las otras 2 raciones, a las 2 tarteras (arroz y curry juntos); templar destapadas como mucho 1 h, tapar y a la nevera o al congelador (ver Notas)."]},{"n":"Albóndigas de pollo en salsa de tomate casera","pr":"Pollo","sana":"Sí","dif":"Media","t":60,"val":"","com":"Variante: mete un dadito de mozzarella dentro de cada albóndiga al formarla y quedan rellenas de queso fundido. Con pasta integral o arroz basmati se convierten en plato único.","cc":"Comida","rac":4,"cong":"Sí","nev":"3","tm":"No","ut":"Tabla y cuchillo · pelador · rallador (lado grueso) · bol grande (masa) · tenedor · plato llano con la harina · bandeja o plato grande (albóndigas crudas) · plato limpio (albóndigas doradas) · sartén grande de 28 cm (dorar) · cazuela de 24-28 cm con tapa (salsa) · espumadera · cuchara de madera · taza medidora · batidora de brazo (opcional) · tarro pequeño con tapa (tomate para la pizza) · 2 platos · 2 tarteras herméticas aptas para congelador · termómetro de cocina · temporizador.","ing":[["600 g","Carne picada de pollo (o pechuga picada en la carnicería)"],["1","Huevo"],["40 g (4 cdas)","Pan rallado"],["3 dientes (2 para la carne y 1 para la salsa)","Ajo"],["1 cda","Perejil picado (fresco o seco)"],["2 cdas (20 g)","Harina de trigo (para enharinar)"],["1 mediana (150 g)","Cebolla"],["1 (unos 80 g)","Zanahoria (endulza la salsa)"],["800 g (1 bote grande)","Tomate triturado"],["4 cdas (40 g)","Aceite de oliva virgen extra"],["1 cdita (4 g)","Azúcar (corrige la acidez del tomate)"],["150 ml","Agua"],["Al gusto","Sal y pimienta"]],"pasos":["PICAR (5 min): en la tabla, picar muy fino los 3 dientes de ajo (2 para la carne y 1 para la salsa). Cebolla en dados de medio centímetro. Pelar la zanahoria con el pelador y rallarla con el lado grueso del rallador.","MASA (5 min): en el bol grande, poner los 600 g de pollo picado, el huevo, 4 cucharadas de pan rallado, los 2 dientes de ajo, el perejil, 1/2 cucharadita de sal y pimienta. Mezclar con el tenedor y luego con las manos 1 min. Está lista cuando no se pega a las manos mojadas; si está muy blanda, 1 cucharada más de pan rallado.","FORMAR (10 min): con las manos mojadas, hacer bolas del tamaño de una nuez (unos 25 g; salen unas 24). Pasarlas por el plato con harina, sacudir el exceso y dejarlas en la bandeja.","DORAR (8 min): en la sartén grande de 28 cm, 3 cucharadas de aceite a fuego medio-alto (7 de 9) y esperar 1 min. Dorar las albóndigas en 2 tandas, 3-4 min por tanda, girándolas con la cuchara. Están listas cuando están doradas por fuera (por dentro siguen crudas: terminan en la salsa). Sacarlas con la espumadera al plato limpio.","SOFRITO DE LA SALSA (5 min): en la cazuela, 1 cucharada de aceite a fuego medio (5 de 9): cebolla, zanahoria rallada y el diente de ajo restante, 5 min removiendo con la cuchara de madera. Está listo cuando la cebolla está transparente.","TOMATE (15 min): añadir a la cazuela los 800 g de tomate triturado, 150 ml de agua (taza medidora), 1 cucharadita de azúcar y 1/2 de sal. Subir a fuego 9 hasta que borbotee, bajar a 3 de 9 y cocer 15 min con la tapa entreabierta (salpica), removiendo cada 5 min. Opcional: triturar 30 segundos con la batidora de brazo para que quede fina.","RESERVAR TOMATE PARA LA PIZZA (1 min): sacar 6 cucharadas (unos 120 g) de salsa al tarro pequeño, dejar templar y a la nevera (3 días) para la pizza de pollo.","COCER LAS ALBÓNDIGAS (15 min): meter las albóndigas en la cazuela con la salsa, tapar y cocer a fuego suave (3 de 9) 15 min, moviendo la cazuela con suavidad a los 7 min (con cuchara se rompen). Están listas cuando, al partir la más gorda, está blanca por dentro sin nada rosado y la salsa ha espesado. TEMPERATURA: en la cazuela, pinchar el termómetro de cocina en el centro de la albóndiga más gorda, sin tocar el fondo de la cazuela, y esperar unos segundos a que la cifra se estabilice: tiene que marcar 74 °C. Si no llega, seguir 2 minutos más tapada a fuego 3 de 9 y volver a medir.","SERVIR Y GUARDAR: 6 albóndigas con salsa por plato (2 platos). Las otras 12, con su salsa, a las 2 tarteras; templar destapadas como mucho 1 h, tapar y a la nevera o al congelador (ver Notas)."]},{"n":"Merluza en papillote con calabacín, zanahoria y limón","pr":"Merluza","sana":"Sí","dif":"Fácil","t":35,"val":"","com":"Variante: añade a la cama de verdura unos tomates cherry partidos o un puñado de guisantes. Abrir el paquete en la mesa tiene gracia: sale todo el aroma del limón.","cc":"Cena","rac":2,"cong":"No (la merluza cocinada se reseca y la verdura suelta agua)","nev":"1","tm":"No","ut":"Plato hondo (descongelar) · papel de cocina · tabla y cuchillo · pelador · bol mediano (verduras) · papel de horno (2 hojas de unos 40 x 30 cm) · bandeja del horno · horno · manopla de horno · tijeras · exprimidor · tenedor · 2 platos · termómetro de cocina · temporizador.","ing":[["2 lomos (unos 300 g)","Merluza congelada en lomos sin piel (o fresca)"],["1 pequeño (unos 200 g)","Calabacín"],["1 (unos 80 g)","Zanahoria"],["1/2 (unos 75 g)","Cebolla"],["1","Limón (4 rodajas finas + zumo de medio)"],["1 diente","Ajo"],["2 cdas (20 g)","Aceite de oliva virgen extra"],["2 cdas (30 ml)","Agua"],["1 pizca","Orégano o tomillo seco"],["Al gusto","Sal y pimienta negra"]],"pasos":["DESCONGELAR (la víspera): pasar los 2 lomos del congelador al plato hondo, tapados, y a la nevera unas 12 h. Antes de cocinar, secarlos bien con papel de cocina.","PRECALENTAR (10 min): sacar la bandeja del horno. Encender el horno a 200 °C, calor arriba y abajo, 10 minutos.","VERDURA (8 min): en la tabla, el calabacín con piel en bastones de medio cm de grosor y 6 cm de largo; la zanahoria pelada con el pelador en bastones más finos (2-3 mm, porque tarda más en hacerse); la cebolla en juliana fina y el ajo en láminas. En el bol mediano, mezclarlo todo con 1 cucharada de aceite, sal y pimienta.","MONTAR (5 min): poner las 2 hojas de papel de horno sobre la encimera. En el centro de cada una, la mitad de la verdura como cama; encima un lomo salpimentado, 2 rodajas de limón, el orégano, media cucharada de aceite y 1 cucharada de agua.","CERRAR (2 min): juntar los dos lados largos del papel por encima del pescado y doblarlos juntos 3-4 veces hacia abajo; retorcer los extremos como un caramelo. Tiene que quedar bien cerrado pero con aire dentro (el papel no debe tocar el pescado).","HORNEAR (15-18 min): poner los 2 paquetes en la bandeja del horno y meterla a altura media (segunda guía desde abajo). 15 min si los lomos tienen unos 2 cm de grosor; 18 min si son más gruesos. El paquete se hincha.","COMPROBAR: sacar la bandeja con la manopla y abrir un paquete con las tijeras, apartando la cara (sale vapor muy caliente). Está lista cuando la merluza está blanca y opaca y se separa en láminas al tocarla con un tenedor; si aún está translúcida, cerrar y 3 min más. TEMPERATURA: con el paquete abierto sobre la bandeja, pinchar el termómetro de cocina en la parte más gruesa del lomo, sin tocar la bandeja ni el papel, y esperar unos segundos a que la cifra se estabilice: tiene que marcar 63 °C. Si no llega, cerrar el paquete, hornear 2 minutos más y volver a medir.","SERVIR: poner cada paquete en un plato, abrirlo en la mesa y exprimir por encima el zumo de medio limón (con el exprimidor)."]},{"n":"Tortilla de calabacín y cebolla","pr":"Huevo","sana":"Sí","dif":"Media","t":30,"val":"","com":"Variante: añade a la mezcla 50 g de queso rallado o unos taquitos de jamón cocido. Fría, en bocadillo, está buenísima al día siguiente.","cc":"Cena","rac":2,"cong":"No (el huevo cuajado se vuelve gomoso y suelta agua)","nev":"2","tm":"No","ut":"Tabla y cuchillo · sartén antiadherente de 22-24 cm con tapa · cuchara de madera · colador · bol grande · tenedor · papel de cocina · espátula de silicona · plato llano más grande que la sartén (para darle la vuelta) · paño de cocina · temporizador.","ing":[["1 grande (unos 400 g)","Calabacín"],["1 mediana (150 g)","Cebolla"],["5","Huevos"],["4 cdas (40 g)","Aceite de oliva virgen extra"],["Al gusto","Sal"],["Opcional","Pimienta y una pizca de comino"]],"pasos":["CORTAR (5 min): en la tabla, el calabacín con piel en cuartos a lo largo y luego en láminas de medio centímetro. La cebolla en juliana fina (tiras de medio cm).","POCHAR (15 min): en la sartén de 22-24 cm, 3 cucharadas de aceite a fuego medio (5 de 9) y esperar 1 min. Añadir la cebolla y cocinar 5 min removiendo con la cuchara de madera. Añadir el calabacín y 1/2 cucharadita de sal, tapar y cocinar 10 min removiendo cada 3. Está listo cuando el calabacín está blando y apenas dorado.","ESCURRIR (2 min): pasar la verdura al colador, puesto sobre el bol grande, y dejarla escurrir 2 min (el agua hace que la tortilla se rompa). Tirar el líquido del bol y secarlo con papel de cocina.","BATIR (2 min): en el bol grande, batir los 5 huevos con una pizca de sal con el tenedor 30 segundos. Añadir la verdura escurrida, mezclar y dejar reposar 2 min.","PRIMERA CARA (4 min): limpiar la sartén con papel de cocina, poner 1 cucharada de aceite a fuego medio-alto (6 de 9) y esperar 1 min. Verter la mezcla, moverla 20 segundos con la espátula y despegar los bordes; bajar a 4 de 9 y dejar 3-4 min. Está lista para girar cuando el borde está cuajado y al mover la sartén el centro apenas tiembla.","DAR LA VUELTA (1 min): apagar el fuego. Poner el plato grande boca abajo sobre la sartén, sujetarlo con la mano encima (protegida con el paño) y girar todo de golpe sobre el fregadero. Deslizar la tortilla otra vez a la sartén con la parte cruda hacia abajo.","TERMINAR (2-3 min): en la sartén a fuego 4 de 9, 2 min (jugosa) o 3 min (más hecha). Está lista cuando al pinchar el centro con un cuchillo sale casi limpio. Pasarla al plato y dejarla reposar 2 min antes de cortarla en 4."]},{"n":"Garbanzos salteados con espinacas, pimentón y huevo","pr":"Garbanzo","sana":"Sí","dif":"Fácil","t":20,"val":"","com":"Variante: cambia el huevo cocido por un huevo a la plancha o añade unos taquitos de jamón al sofrito. Un pellizco de comino le da un aire andaluz.","cc":"Comida","rac":2,"cong":"No (las espinacas se aguan)","nev":"2","tm":"No","ut":"Colador · tabla y cuchillo · abrelatas (si hace falta) · cazo pequeño de 1-1,5 L (huevos) · bol con agua fría · cuchara · sartén grande de 28 cm con tapa · cuchara de madera · 2 platos · temporizador.","ing":[["1 bote (400 g; unos 240 g escurridos)","Garbanzos cocidos"],["200 g (media bolsa)","Espinacas frescas (o 4 bolas de espinacas congeladas)"],["2","Huevos"],["2 dientes","Ajo"],["1/2 (unos 75 g)","Cebolla"],["1 cdita (3 g)","Pimentón de la Vera (o dulce)"],["1/2 cdita","Comino molido (opcional)"],["3 cdas (30 g)","Aceite de oliva virgen extra"],["1 chorrito","Vinagre o zumo de limón"],["2 rebanadas (opcional)","Pan, para mojar"],["Al gusto","Sal"]],"pasos":["HUEVOS (10 min, a la vez que lo demás): en el cazo pequeño, agua que cubra los huevos 2 cm, a fuego máximo (9 de 9) hasta que hierva. Meter los 2 huevos con la cuchara, bajar a 6 de 9 y contar 7 min (yema melosa) o 9 min (yema cuajada). Pasarlos al bol con agua fría 3 min, pelarlos y partirlos en cuartos en la tabla.","PREPARAR (4 min): escurrir y enjuagar los garbanzos en el colador y dejarlos escurrir bien (secos se tuestan mejor). En la tabla, el ajo en láminas finas y la cebolla en juliana fina. Si las espinacas son frescas, lavarlas en el colador.","SOFRITO (5 min): en la sartén grande, 2 cucharadas de aceite a fuego medio (5 de 9) y esperar 1 min. Cebolla 4 min removiendo con la cuchara de madera; añadir el ajo y 1 min más. Está listo cuando la cebolla está blanda y el ajo empieza a dorarse por los bordes.","GARBANZOS (5 min): en la misma sartén, subir a fuego 7 de 9, añadir los garbanzos y 1 cucharada de aceite y saltear 4-5 min removiendo cada minuto. Están listos cuando algunos están dorados y crujientes por fuera.","PIMENTÓN (30 s): bajar a fuego 3 de 9, añadir el pimentón y el comino y remover 20-30 segundos (el pimentón se quema enseguida y amarga).","ESPINACAS (3 min): añadir a la sartén las espinacas por puñados, tapar 1 min y remover 2 min más. Están listas cuando han reducido y están verde intenso. Salar y añadir un chorrito de vinagre o limón.","SERVIR: repartir en 2 platos y poner encima los cuartos de huevo con una pizca de sal y pimentón. Pan para mojar, si se quiere."]},{"n":"Crema de calabaza y zanahoria","pr":"Calabaza","sana":"Sí","dif":"Fácil","t":45,"val":"","com":"Variante: un poco de jengibre rallado o una pizca de curry suave al rehogar la cebolla le da un toque exótico. Las pipas de calabaza por encima aportan el crujiente.","cc":"Cena","rac":4,"cong":"Sí","nev":"3","tm":"Sí","ut":"Tabla y cuchillo grande · pelador · cuchara (quitar pepitas) · olla grande de 4-5 L con tapa · cuchara de madera · taza medidora · batidora de brazo · cucharón · cuencos · 2 tarteras herméticas aptas para congelador · termómetro de cocina · temporizador. Versión TM5: Thermomix TM5 con vaso, tapa, cubilete y espátula (y un paño para sujetar el cubilete al triturar).","ing":[["800 g (pelada y sin pepitas)","Calabaza (tipo cacahuete o butternut)"],["3 (unos 250 g)","Zanahoria"],["1 mediana (150 g)","Cebolla"],["1 pequeña (150 g)","Patata"],["700 ml al fuego / 650 g en TM5","Agua"],["1 pastilla (10 g)","Caldo de verduras en pastilla (o 1 cdita y media de sal)"],["2 cdas (20 g)","Aceite de oliva virgen extra"],["2 (opcional)","Quesitos en porción (más cremosa)"],["1 pizca","Nuez moscada o comino (opcional)"],["Al gusto","Sal y pimienta"],["Para servir (opcional)","Pipas de calabaza o picatostes y un hilo de aceite"]],"pasos":["PELAR Y CORTAR (12 min): en la tabla, con el cuchillo grande, cortar la calabaza en rodajas de 3 cm, quitarles la piel con el cuchillo o el pelador y las pepitas con la cuchara; trocearla en dados de 3 cm. Zanahoria pelada en rodajas de 1 cm. Cebolla en trozos de 2 cm. Patata pelada en dados de 2 cm.","REHOGAR (6 min): en la olla grande, 2 cucharadas de aceite a fuego medio (5 de 9) y esperar 1 min. Añadir la cebolla y remover cada minuto con la cuchara de madera durante 5 min. Está lista cuando está transparente, sin dorarse.","COCER (25 min): añadir a la olla la calabaza, la zanahoria, la patata, la pastilla y 700 ml de agua (taza medidora; no tiene que cubrirlo todo, la calabaza suelta agua). Fuego máximo (9) hasta que hierva (unos 5 min), bajar a 4 de 9, tapar y cocer 20 min. Está lista cuando la zanahoria se aplasta fácil con un tenedor.","TRITURAR (8 min): apagar y dejar templar 5 min con la olla destapada. Añadir los quesitos y la nuez moscada y triturar con la batidora de brazo unos 3 min, moviéndola por toda la olla. Está lista cuando es una crema lisa sin grumos. Si queda muy espesa, añadir 100 ml de agua y batir otra vez; probar de sal.","SERVIR Y GUARDAR: con el cucharón, 2 cuencos (unos 350 ml cada uno) con un hilo de aceite y pipas o picatostes. Las otras 2 raciones, a las 2 tarteras; templar destapadas como mucho 1 h, tapar y a la nevera o al congelador (ver Notas)."]},{"n":"Pasta integral con brócoli, atún y limón","pr":"Pasta integral","sana":"Sí","dif":"Fácil","t":25,"val":"","com":"Variante: añade unos tomates cherry partidos o unas alcaparras al final. Fría y con un chorrito más de limón funciona como ensalada de pasta para llevar.","cc":"Comida","rac":2,"cong":"No (la pasta se ablanda)","nev":"2","tm":"No","ut":"Olla grande de 4 L con tapa · tabla y cuchillo · rallador (lado fino) · exprimidor · abrelatas (si hace falta) · taza (reservar agua de cocción) · colador · sartén grande de 28 cm · cuchara de madera · 2 platos · temporizador.","ing":[["180 g","Pasta integral corta (macarrones o espirales)"],["250 g (1 cabeza pequeña)","Brócoli"],["2 latas (unos 160 g escurrido)","Atún al natural o en aceite de oliva"],["2 dientes","Ajo"],["1","Limón (ralladura y zumo)"],["3 cdas (30 g)","Aceite de oliva virgen extra"],["2 litros + 2 cditas (10 g) de sal","Agua para la pasta"],["1 pizca (opcional)","Guindilla o pimienta"],["2 cdas (20 g, opcional)","Queso rallado"]],"pasos":["AGUA (10 min): en la olla grande, 2 L de agua y 2 cucharaditas de sal; tapar y poner a fuego máximo (9 de 9) hasta que hierva con burbujas grandes.","PREPARAR (5 min): en la tabla, el brócoli en ramilletes pequeños de 3 cm (el tronco, pelado y en dados de 1 cm). El ajo en láminas finas. Rallar la piel del limón con el lado fino del rallador (solo lo amarillo) y exprimir medio limón con el exprimidor. Escurrir el atún.","PASTA (unos 11 min): echar la pasta en la olla con el agua hirviendo, remover y cocer sin tapa a fuego 7 de 9 el tiempo que diga el envase menos 1 minuto. Remover a los 2 min para que no se pegue.","BRÓCOLI EN LA MISMA OLLA (4 min): cuando a la pasta le queden 4 min, echar el brócoli en la olla. Antes de escurrir, sacar con la taza unos 100 ml del agua de cocción. Escurrir pasta y brócoli juntos en el colador. La pasta está lista cuando está tierna con un punto firme en el centro.","AJO (2 min, mientras se cuece la pasta): en la sartén grande, 3 cucharadas de aceite y el ajo a fuego medio-bajo (4 de 9) durante 2 min. Está listo cuando el ajo está apenas dorado (si se tuesta, amarga). Añadir la guindilla.","SALTEAR (2 min): subir la sartén a 6 de 9 y añadir la pasta con el brócoli, el atún, la ralladura de limón y 3-4 cucharadas del agua de cocción. Remover 1-2 min. Está lista cuando la pasta está brillante y suelta, sin quedar seca.","SERVIR: apagar, añadir el zumo de limón, probar de sal y repartir en 2 platos con el queso rallado por encima."]},{"n":"Fajitas de pollo y pimiento con yogur","pr":"Pollo","sana":"Sí","dif":"Fácil","t":30,"val":"","com":"Variante: añade al relleno unos granos de maíz o unas alubias rojas de bote. Una pizca de guindilla en la salsa de yogur le da un punto picante.","cc":"Cena","rac":2,"cong":"No (el pimiento se ablanda y el yogur se corta)","nev":"2","tm":"No","ut":"Tabla y cuchillo · bol mediano (marinar) · bol pequeño y tenedor (salsa) · exprimidor · sartén grande de 28 cm · espátula o pinzas · plato (reservar) · papel de cocina · paño limpio (tortillas) · 2 platos · termómetro de cocina · temporizador.","ing":[["300 g","Pechuga o contramuslo de pollo"],["1","Pimiento rojo"],["1","Pimiento verde"],["1 mediana (150 g)","Cebolla"],["4","Tortillas de trigo (integrales si hay)"],["1 (125 g)","Yogur natural (o griego) sin azúcar"],["1 cdita (3 g)","Pimentón dulce"],["1/2 cdita","Comino molido"],["1/2 cdita (o 1 diente picado)","Ajo en polvo"],["1/2","Limón (zumo)"],["2 cdas (20 g)","Aceite de oliva virgen extra"],["Al gusto","Sal y pimienta"],["Opcional","Hojas de lechuga y queso rallado"]],"pasos":["CORTAR (8 min): en la tabla, el pollo en tiras de 1 cm de grosor y unos 6 cm de largo; los pimientos, sin semillas, en tiras de 1 cm; la cebolla en juliana de medio cm.","MARINAR (5 min): en el bol mediano, mezclar el pollo con el pimentón, el comino, el ajo en polvo, el zumo de medio limón (con el exprimidor), 1 cucharada de aceite y 1/2 cucharadita de sal. Dejar 5 min.","SALSA (2 min): en el bol pequeño, el yogur con una pizca de sal, un chorrito de limón y pimienta; remover con el tenedor y guardar en la nevera.","VERDURA (6 min): en la sartén grande, 1 cucharada de aceite a fuego fuerte (8 de 9) y esperar 1 min. Pimientos y cebolla 5-6 min, removiendo cada minuto con la espátula. Están listos cuando están tiernos pero con un punto crujiente y algo tostados. Sacarlos al plato.","POLLO (5 min): en la misma sartén a fuego fuerte (8 de 9), el pollo extendido en una capa: 2 min sin moverlo y 2-3 min más removiendo. Está listo cuando está dorado y, al partir la tira más gruesa, blanco por dentro. TEMPERATURA: en la sartén grande, pinchar el termómetro de cocina en el centro de la tira de pollo más gruesa, sin tocar la sartén, y esperar unos segundos a que la cifra se estabilice: tiene que marcar 74 °C. Si no llega, seguir 2 minutos más y volver a medir. Volver a echar la verdura y saltear 1 min. Pasar todo al plato y taparlo.","TORTILLAS (2 min): limpiar la sartén con papel de cocina y ponerla a fuego medio (5 de 9). Calentar cada tortilla 20 segundos por lado y guardarlas envueltas en el paño para que no se sequen.","MONTAR: en cada tortilla, 1 cucharada de salsa de yogur, lechuga, una cuarta parte del relleno y un poco de queso; enrollar. 2 por persona."]},{"n":"Revuelto de champiñones, espinacas y ajo con tostada","pr":"Huevo","sana":"Sí","dif":"Fácil","t":15,"val":"","com":"Variante: añade unos taquitos de jamón con los champiñones o frota la tostada caliente con medio diente de ajo. Un hilo de aceite sobre el pan le da el toque final.","cc":"Cena","rac":2,"cong":"No","nev":"0 (al momento; champiñones y espinacas salteados sin huevo: 2 días)","tm":"No","ut":"Tabla y cuchillo · cuchillo de sierra (pan) · papel de cocina húmedo (limpiar champiñones) · colador (espinacas) · bol y tenedor (huevos) · tostadora (o la misma sartén) · sartén antiadherente de 24-28 cm · espátula de silicona · 2 platos · temporizador.","ing":[["250 g (1 bandeja)","Champiñón laminado (champiñones)"],["100 g (2 puñados grandes)","Espinacas frescas"],["4","Huevos"],["2 dientes","Ajo"],["2 rebanadas grandes de 1,5 cm","Pan de barra o rústico"],["2 cdas (20 g)","Aceite de oliva virgen extra"],["1 cda (15 ml, opcional)","Leche (más cremoso)"],["Al gusto","Sal y pimienta"],["1 pizca (opcional)","Perejil"]],"pasos":["PREPARAR (4 min): en la tabla, el ajo en láminas finas. Si los champiñones no vienen laminados, limpiarlos con papel de cocina húmedo (sin mojarlos) y cortarlos en láminas de medio cm. Lavar las espinacas en el colador y escurrir. En el bol, batir los 4 huevos con la leche, una pizca de sal y pimienta, 20 segundos con el tenedor.","TOSTAR EL PAN (3 min): en la tabla, cortar 2 rebanadas de 1,5 cm con el cuchillo de sierra. Tostadora 2-3 min, o en la sartén sin aceite a fuego 7 de 9, 1,5 min por lado. Están listas cuando están doradas y crujientes. Dejarlas en los platos.","AJO Y CHAMPIÑÓN (6 min): en la sartén, 2 cucharadas de aceite y el ajo a fuego medio (5 de 9) durante 1 min. Subir a fuego fuerte (8 de 9), añadir los champiñones y no tocarlos 2 min (así se doran en vez de cocerse); después remover 3 min con la espátula. Están listos cuando han soltado el agua, se ha evaporado y están dorados. Salar al final.","ESPINACAS (1 min): añadir las espinacas a la sartén y remover 1 min hasta que reduzcan.","REVOLVER (2 min): bajar a fuego suave (3 de 9). Verter el huevo batido en la sartén y remover sin parar con la espátula, de los bordes al centro, 1,5-2 min. Apagar cuando todavía está brillante y cremoso: se termina de hacer con el calor de la sartén.","SERVIR: repartir el revuelto encima o al lado de las tostadas, con pimienta y perejil. Comer al momento."]},{"n":"Pizza de calabacín, champiñón y mozzarella","pr":"Masa de pizza","sana":"Moderado","dif":"Fácil","t":35,"val":"","com":"Variante: al sacarla, añade un puñado de espinacas crudas o unas migas de atún. Un hilo de aceite con orégano en los bordes los deja más dorados.","cc":"Cena","rac":2,"cong":"No (horneada pierde lo crujiente)","nev":"2","tm":"No","ut":"Horno · bandeja del horno (con el papel de hornear que trae la masa) · tabla y cuchillo · papel de cocina · bol pequeño (salsa) · cuchara · tenedor · espátula ancha · manopla de horno · tabla grande o plato grande (cortar) · cortapizzas o cuchillo grande · temporizador.","ing":[["1 rollo (260 g)","Masa de pizza refrigerada en rollo (Alipende, Ahorramás)"],["6 cdas (120 g)","Tomate triturado (o la salsa de tomate casera de las albóndigas)"],["1 bola (125 g)","Mozzarella fresca (o 100 g de mozzarella rallada)"],["1/2 (unos 150 g)","Calabacín"],["100 g (media bandeja)","Champiñón laminado"],["1/4 (unos 40 g, opcional)","Cebolla"],["1 cdita","Orégano seco"],["1 cda (10 g)","Aceite de oliva virgen extra"],["1 pizca","Sal y pimienta"]],"pasos":["PRECALENTAR (10 min): sacar la masa de la nevera para que se atempere (así no se rompe al desenrollarla). Sacar la bandeja del horno y colocar la rejilla a altura media (segunda guía desde abajo). Encender el horno a 220 °C (o la temperatura que diga el envase de la masa), calor arriba y abajo, y dejar que se caliente 10 minutos.","VERDURA (6 min): en la tabla, el calabacín con piel en rodajas muy finas (2-3 mm) y la cebolla en juliana fina. Secar el calabacín con papel de cocina (si queda agua, la base no cruje). Si el champiñón no viene laminado, láminas de 3-4 mm.","SALSA (1 min): en el bol pequeño, el tomate con una pizca de sal, la mitad del orégano y unas gotas de aceite; remover con la cuchara.","EXTENDER LA MASA (2 min): desenrollar la masa sobre la bandeja del horno con su propio papel de hornear debajo. Pinchar la base con el tenedor 8-10 veces para que no haga globos.","MONTAR (4 min): con la cuchara, extender el tomate dejando 1,5 cm de borde sin salsa. Repartir el calabacín, el champiñón y la cebolla en una sola capa, sin amontonar. Escurrir la mozzarella con papel de cocina, partirla en trozos de 1-2 cm y repartirla. Resto del orégano, pimienta y un hilo de aceite.","HORNEAR (12-15 min): meter la bandeja en el horno a altura media (segunda guía desde abajo). A los 7 minutos, con la manopla, darle media vuelta a la bandeja (180°) si el horno dora más por un lado. En total, 12-15 min, o el tiempo que indique el envase de la masa si es distinto.","COMPROBAR: está hecha cuando los bordes están dorados, la base está crujiente al levantar una esquina con la espátula y el queso está fundido y con burbujas. Si la base sigue blanda, 2-3 min más bajando la bandeja a la guía más baja.","REPOSAR Y CORTAR: sacar la bandeja con la manopla (quema mucho) y dejar reposar la pizza 2 minutos. Deslizarla con su papel a la tabla grande y cortarla en 8 porciones con el cortapizzas o un cuchillo grande."]},{"n":"Pizza de pollo, pimiento y cebolla con tomate casero","pr":"Masa de pizza","sana":"Moderado","dif":"Fácil","t":35,"val":"","com":"Variante: un hilo de miel con pimentón por encima al sacarla le da un punto barbacoa. Con el tomate casero de las albóndigas sabe a pizzería.","cc":"Cena","rac":2,"cong":"No (horneada pierde lo crujiente)","nev":"2","tm":"No","ut":"Horno · bandeja del horno (con el papel de hornear que trae la masa) · tabla y cuchillo · sartén de 24-28 cm (verdura y pollo) · espátula ancha · papel de cocina · cuchara · tenedor · manopla de horno · tabla grande o plato grande (cortar) · cortapizzas o cuchillo grande · termómetro de cocina · temporizador.","ing":[["1 rollo (260 g)","Masa de pizza refrigerada en rollo (Alipende, Ahorramás)"],["6 cdas (120 g)","Salsa de tomate casera (la reservada de las albóndigas) o tomate triturado"],["150 g","Pollo cocinado sobrante (de las fajitas o el curry) o 150 g de pechuga cruda en tiras"],["1/2","Pimiento rojo"],["1/2","Pimiento verde"],["1/2 (unos 75 g)","Cebolla"],["1 bola (125 g)","Mozzarella fresca (o 100 g de mozzarella rallada)"],["1 cdita","Orégano seco"],["1/2 cdita (opcional)","Pimentón dulce"],["1 cda (10 g)","Aceite de oliva virgen extra"],["1 pizca","Sal y pimienta"]],"pasos":["PRECALENTAR (10 min): sacar la masa de la nevera para que se atempere. Sacar la bandeja del horno y colocar la rejilla a altura media (segunda guía desde abajo). Encender el horno a 220 °C (o la temperatura que diga el envase de la masa), calor arriba y abajo, 10 minutos.","CORTAR (5 min): en la tabla, los pimientos sin semillas en tiras finas de medio cm y la cebolla en juliana fina. El pollo cocinado, desmigado o en tiras de 1 cm (si es crudo, en tiras finas de 1 cm).","SALTEAR (6-10 min): en la sartén, 1 cucharada de aceite a fuego medio-alto (7 de 9) y esperar 1 min. Pimientos y cebolla 5 min removiendo con la espátula; están listos cuando están blandos (crudos sueltan agua sobre la masa). Si el pollo es crudo, añadirlo y saltear 4 min más hasta que esté blanco por dentro; si es cocinado, solo 1 min con el pimentón para calentarlo. TEMPERATURA (en los dos casos): en la sartén, pinchar el termómetro de cocina en el centro de la tira de pollo más gruesa, sin tocar la sartén, y esperar unos segundos a que la cifra se estabilice: tiene que marcar 74 °C (pollo crudo cocinado ahora o pollo de sobras recalentado). Si no llega, seguir 2 minutos más removiendo y volver a medir.","EXTENDER LA MASA (2 min): desenrollar la masa sobre la bandeja del horno con su propio papel de hornear debajo. Pinchar la base con el tenedor 8-10 veces.","MONTAR (3 min): con la cuchara, extender la salsa de tomate dejando 1,5 cm de borde. Repartir la verdura y el pollo en una capa. Escurrir la mozzarella con papel de cocina, partirla en trozos de 1-2 cm y repartirla. Orégano y un hilo de aceite.","HORNEAR (12-15 min): meter la bandeja a altura media (segunda guía desde abajo). A los 7 minutos, con la manopla, darle media vuelta a la bandeja (180°) si el horno dora más por un lado. En total, 12-15 min, o el tiempo que indique el envase de la masa si es distinto.","COMPROBAR: está hecha cuando los bordes están dorados, la base está crujiente al levantar una esquina con la espátula y el queso está fundido y con burbujas. Si la base sigue blanda, 2-3 min más bajando la bandeja a la guía más baja.","REPOSAR Y CORTAR: sacar la bandeja con la manopla (quema mucho) y dejar reposar la pizza 2 minutos. Deslizarla con su papel a la tabla grande y cortarla en 8 porciones con el cortapizzas o un cuchillo grande."]},{"n":"Macarrones con queso gratinados (mac & cheese casero)","pr":"Pasta","sana":"Moderado","dif":"Fácil","t":40,"val":"","com":"Variante: añade brócoli los últimos 3 minutos de cocción o taquitos de jamón a la salsa. El pimentón en el gratinado le da color y un punto ahumado.","cc":"Comida","rac":4,"cong":"Sí (mejor sin gratinar)","nev":"3","tm":"No","ut":"","ing":[["320 g","Macarrones"],["600 ml","Leche semidesnatada"],["40 g","Mantequilla"],["40 g","Harina"],["150 g","Cheddar"],["100 g","Mozzarella rallada"],["1 cdita","Mostaza suave"],["1/2 cdita","Pimentón dulce"],["25 g","Pan rallado"],["Al gusto","Nuez moscada"],["Al gusto","Sal y pimienta"]],"pasos":["COCER LOS MACARRONES: cocer los 320 g de macarrones.","BECHAMEL DE QUESO: con 40 g de mantequilla, 40 g de harina y 600 ml de leche semidesnatada, hacer la bechamel. Añadir 150 g de cheddar, 1 cdita de mostaza suave, la nuez moscada, sal y pimienta.","MEZCLAR: unir los macarrones con la bechamel de queso.","GRATINAR: con 100 g de mozzarella rallada, 25 g de pan rallado y 1/2 cdita de pimentón dulce, 10 min al horno a 200 °C y después 2–3 min de grill."]},{"n":"Pollo al limón y ajo con arroz basmati y calabacín salteado","pr":"Pollo","sana":"Sí","dif":"Fácil","t":35,"val":"","com":"Variante: cambia el calabacín por brócoli o pimiento. El pollo que sobre, frío y en tiras, sirve para un bowl o una ensalada.","cc":"Comida","rac":2,"cong":"Sí (pollo y arroz; el calabacín mejor recién hecho)","nev":"2","tm":"No","ut":"","ing":[["400 g","Pechuga"],["160 g","Arroz basmati"],["1","Calabacín"],["2","Ajos"],["1","Limón"],["2 cdas","Aceite de oliva"],["Al gusto","Orégano"],["Al gusto","Pimentón"],["Al gusto","Sal y pimienta"]],"pasos":["MARINAR: la pechuga en limón y ajo.","A LA SARTÉN: con 2 cdas de aceite de oliva, el orégano, el pimentón, sal y pimienta, hasta 74 °C con el termómetro.","ARROZ BASMATI: cocer los 160 g.","CALABACÍN: saltear el calabacín."]},{"n":"Salmón al horno con patatas y brócoli en una sola bandeja","pr":"Salmón","sana":"Sí","dif":"Fácil","t":40,"val":"","com":"Variante: cambia el brócoli por calabacín o añade tomates cherry los últimos 10 min. Una cucharada de yogur con limón y ajo hace de salsa.","cc":"Cena","rac":2,"cong":"No","nev":"2","tm":"No","ut":"","ing":[["2 lomos (300 g)","Salmón"],["400 g","Patatas"],["1 pequeño","Brócoli"],["2","Ajos"],["1","Limón"],["2 cdas","Aceite de oliva"],["Al gusto","Pimentón"],["Al gusto","Orégano"],["Al gusto","Sal y pimienta"]],"pasos":["PATATAS: hornear las patatas 20 min a 210 °C.","TODO JUNTO: en la misma bandeja, los 2 lomos de salmón (300 g), el brócoli, los 2 ajos, el limón, 2 cdas de aceite de oliva, el pimentón, el orégano, sal y pimienta.","HORNEAR: 10–12 min más, hasta 63 °C con el termómetro."]},{"n":"Ensalada de garbanzos, atún, huevo y tomate","pr":"Garbanzo","sana":"Sí","dif":"Fácil","t":20,"val":"","com":"Variante: añade espinacas crudas o pepino, o cambia el atún por salmón o pollo que haya sobrado. Aliñada 10 minutos antes sabe mucho mejor.","cc":"Cena","rac":2,"cong":"No","nev":"2 (sin aliñar y con el huevo entero)","tm":"No","ut":"","ing":[["1 bote (400 g)","Garbanzos"],["2 latas","Atún al natural"],["2","Huevos"],["2","Tomates"],["1/2","Pimiento rojo"],["1/4","Cebolla"],["1/2","Limón"],["2 cdas","Aceite de oliva"],["Al gusto (opcional)","Comino"],["Al gusto","Sal y pimienta"]],"pasos":["HUEVOS: cocer los 2 huevos 10 min.","PICAR: los garbanzos del bote de 400 g, el atún de las 2 latas, los 2 tomates, 1/2 pimiento rojo y 1/4 de cebolla.","ALIÑAR: con 1/2 limón, 2 cdas de aceite de oliva, comino (opcional), sal y pimienta.","REPOSAR: 10 min."]}];

const norm = (s: string): string => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const CANON: string[] = ["Agua", "Caldo", "Salmón", "Merluza", "Atún", "Pollo", "Pechuga", "Huevo", "Jamón", "Lentejas", "Garbanzos", "Leche de coco", "Yogur", "Mozzarella", "Quesito", "Queso", "Leche", "Arroz basmati", "Arroz redondo", "Pasta integral", "Masa de pizza", "Tortillas de trigo", "Pan rallado", "Pan", "Pipas de calabaza", "Calabacín", "Calabaza", "Cebolleta", "Cebollino", "Cebolla", "Pimiento rojo", "Pimiento verde", "Pimiento", "Zanahoria", "Patata", "Brócoli", "Espinacas", "Champiñón", "Pepino", "Puerro", "Remolacha", "Canónigos", "Limón", "Naranja", "Ajo en polvo", "Ajo", "Jengibre", "Tomate triturado", "Tomate frito", "Tomate", "Cilantro", "Perejil", "Eneldo", "Lechuga", "Aceite", "Salsa de soja", "Miel", "Curry", "Pimentón", "Comino", "Orégano", "Laurel", "Tomillo", "Azafrán", "Nuez moscada", "Guindilla", "Harina", "Azúcar", "Vinagre", "Mostaza", "Mayonesa", "Tahini", "Hummus", "Sésamo", "Guisantes", "Sal", "Pimienta"];

const canon = (name: string): string => {
  const seg = norm(name.split(/\(|,| o | \+ /)[0]);
  for (const c of CANON) if (seg.includes(norm(c))) return c;
  const full = norm(name);
  for (const c of CANON) if (full.includes(norm(c))) return c;
  const s = name.split(/\(|,/)[0].trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const CAT: Record<string, string[]> = {
  "Proteínas": ["Salmón", "Merluza", "Atún", "Pollo", "Pechuga", "Huevo", "Jamón", "Lentejas", "Garbanzos", "Hummus"],
  "Verduras y fruta": ["Calabacín", "Calabaza", "Cebolleta", "Cebollino", "Cebolla", "Pimiento rojo", "Pimiento verde", "Pimiento", "Zanahoria", "Patata", "Brócoli", "Espinacas", "Champiñón", "Pepino", "Puerro", "Remolacha", "Canónigos", "Limón", "Naranja", "Ajo", "Jengibre", "Cilantro", "Perejil", "Eneldo", "Lechuga", "Guisantes"],
  "Lácteos": ["Leche", "Yogur", "Mozzarella", "Quesito", "Queso", "Cheddar", "Mantequilla"],
  "Básicos": ["Sal", "Pimienta", "Aceite", "Agua"],
};
const catOf = (c: string): string => { for (const k of Object.keys(CAT)) if (CAT[k].includes(c)) return k; return "Despensa"; };

const isOpt = (q: string, n: string): boolean => /opcional/i.test(q) || /opcional/i.test(n);
const NOSCALE = /al gusto|pizca|chorrito|puñado|hilo|opcional|para servir/i;
const FR: Record<string, string> = { "0.25": "1/4", "0.5": "1/2", "0.75": "3/4", "0.33": "1/3", "0.67": "2/3" };
const pnum = (m: string): number => { if (m.includes("/")) { const [a, b] = m.split("/"); return Number(a) / Number(b); } return Number(m.replace(",", ".")); };
const fmt = (x: number): string => { const r = Math.round(x * 100) / 100; if (r < 1 && FR[String(r)]) return FR[String(r)]; return String(r).replace(".", ","); };

const scaleQty = (q: string, f: number): string | null => {
  if (f === 1) return q;
  if (!/^\d/.test(q.trim()) || /^\d+\s*(pizca|chorrito|puñado|hilo)/i.test(q.trim())) return null;
  return q.replace(/\d+(?:[.,]\d+)?(?:\/\d+)?/g, (m: string, off: number) => {
    const before = q.slice(Math.max(0, off - 3), off);
    const after = q.slice(off + m.length, off + m.length + 9);
    if (/de $/.test(before) || /^ ?cm/.test(after) || /^ g cada/.test(after) || /^ por/.test(after) || /^:/.test(after) || /:$/.test(before)) return m;
    return fmt(pnum(m) * f);
  });
};

type Amt = { v: number; u: string };
const amount = (q: string): Amt | null => {
  const s = norm(q);
  const conv = (v: number, u: string): Amt => u === "kg" ? { v: v * 1000, u: "g" } : (u === "l" || u.startsWith("litro")) ? { v: v * 1000, u: "ml" } : { v, u };
  let m = s.match(/^(\d+(?:[.,]\d+)?(?:\/\d+)?)(?:-(\d+(?:[.,]\d+)?))?\s*(kg|g|ml|litros?|l)\b/);
  if (m) return conv(pnum(m[2] || m[1]), m[3]);
  m = s.match(/(?:\(|unos |~)\s*(\d+(?:[.,]\d+)?)\s*(kg|g|ml|litros?|l)\b/);
  if (m) return conv(pnum(m[1]), m[2]);
  m = s.match(/^(\d+(?:[.,]\d+)?(?:\/\d+)?)(?:-(\d+(?:[.,]\d+)?))?\s*([a-zñ]+)?/);
  if (!m) return null;
  let u = m[3] || "ud";
  if (/^(pizca|punado|chorrito|hilo|opcional|para)/.test(u)) return null;
  if (["mediana", "mediano", "medianos", "medianas", "grande", "pequena", "pequeno", "pequenas", "pequenos", "ud", "grandes"].includes(u)) u = "ud";
  u = u.replace(/s$/, "");
  return { v: pnum(m[2] || m[1]), u };
};

type Slot = string;
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const SLOTS: Slot[] = DIAS.flatMap((d: string) => [d + "|Comida", d + "|Cena"]);
const fitsSlot = (r: Rec, s: Slot): boolean => s.endsWith("Comida") ? r.cc.startsWith("Comida") : r.cc.startsWith("Cena");
const emptyMenu = (): Record<string, string> => Object.fromEntries(SLOTS.map((s: string) => [s, ""]));

type Saved = { semana: string; menu: Record<string, string>; rac: number };
type Meal = { tipo: "receta" | "texto"; valor: string };
type CalDay = { comida?: Meal; cena?: Meal };
type St = { fav: string[]; menu: Record<string, string>; locked: string[]; rac: number; semana: string; saved: Saved[]; confirmado: Saved | null; checks: string[]; manual: { cat: string; t: string }[]; nevera: string[]; basicos: boolean; cal: Record<string, CalDay>; calCompra: string | null; platos: string[]; anadidas: string[] };
const KEY = "chef-antracita-v1";
const INIT: St = { fav: [], menu: emptyMenu(), locked: [], rac: 2, semana: "2026-11-02", saved: [], confirmado: null, checks: [], manual: [], nevera: [], basicos: true, cal: {}, calCompra: null, platos: [], anadidas: [] };

function hoyMadrid(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
function shiftDay(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function weekStart(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return shiftDay(iso, -((wd + 6) % 7));
}
function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
}
function monthCells(ym: string): (string | null)[] {
  const [y, m] = ym.split("-").map(Number);
  const pad = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = Array.from({ length: pad }, () => null);
  for (let d = 1; d <= count; d++) cells.push(ym + "-" + String(d).padStart(2, "0"));
  while (cells.length % 7) cells.push(null);
  return cells;
}
function tituloMes(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const text = new Intl.DateTimeFormat("es-ES", { timeZone: "UTC", month: "long", year: "numeric" }).format(new Date(Date.UTC(y, m - 1, 1)));
  return text.charAt(0).toUpperCase() + text.slice(1);
}
function tituloDia(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const text = new Intl.DateTimeFormat("es-ES", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(new Date(Date.UTC(y, m - 1, d)));
  return text.charAt(0).toUpperCase() + text.slice(1);
}
function corto(m: Meal | undefined): string {
  if (!m || !m.valor) return "";
  return m.valor.length > 7 ? m.valor.slice(0, 6) + "…" : m.valor;
}
function puntosDif(dif: string): number | null {
  if (dif === "Fácil") return 1;
  if (dif === "Media") return 2;
  if (dif === "Difícil") return 3;
  return null;
}
function diaCorto(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = new Intl.DateTimeFormat("es-ES", { timeZone: "UTC", weekday: "narrow" }).format(new Date(Date.UTC(y, m - 1, d)));
  return wd.toUpperCase() + " " + d;
}
const loadSt = (): St => { try { const s = window.localStorage.getItem(KEY); if (s) { const d = JSON.parse(s); return { ...INIT, ...d, cal: d && d.cal && typeof d.cal === "object" ? d.cal : {}, calCompra: d && typeof d.calCompra === "string" ? d.calCompra : null, platos: d && Array.isArray(d.platos) ? d.platos.filter((p: unknown) => typeof p === "string") : [], anadidas: d && Array.isArray(d.anadidas) ? d.anadidas.filter((p: unknown) => typeof p === "string") : [] }; } } catch (e) { /* sin almacenamiento */ } return INIT; };

const ALLING: string[] = Array.from(new Set(R.flatMap((r: Rec) => r.ing.map((i: string[]) => canon(i[1]))))).filter((c: string) => c !== "Agua").sort((a: string, b: string) => a.localeCompare(b, "es"));

export default function App() {
  const [orden, setOrden] = useState<string>("nombre");
  const [st, setSt] = useState<St>(loadSt);
  const [persist, setPersist] = useState<boolean>(true);
  useEffect(() => { try { window.localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { setPersist(false); } }, [st]);
  const up = (p: Partial<St>) => setSt((s: St) => ({ ...s, ...p }));

  const [vista, setVista] = useState<string>("rec");
  const [q, setQ] = useState<string>("");
  const [fCC, setFCC] = useState<string>("todas");
  const [fSana, setFSana] = useState<string>("todas");
  const [fDif, setFDif] = useState<string>("todas");
  const [fT, setFT] = useState<string>("todas");
  const [fTM, setFTM] = useState<string>("todas");
  const [fCong, setFCong] = useState<string>("todas");
  const [fFav, setFFav] = useState<boolean>(false);
  const [abierta, setAbierta] = useState<string>("");
  const [racR, setRacR] = useState<number>(0);
  const [msg, setMsg] = useState<string>("");
  const [undoGen, setUndoGen] = useState<{ fecha: string; slot: "comida" | "cena" }[] | null>(null);
  const [manT, setManT] = useState<string>("");
  const [manC, setManC] = useState<string>("Despensa");
  const [nevT, setNevT] = useState<string>("");
  const [nevCC, setNevCC] = useState<string>("todas");
  const [io, setIo] = useState<string>("");
  const [ioMsg, setIoMsg] = useState<string>("");
  const hoy = hoyMadrid();
  const [mes, setMes] = useState<string>(hoy.slice(0, 7));
  const [diaCal, setDiaCal] = useState<string>(hoy);
  const [semanaElegida, setSemanaElegida] = useState<string>(weekStart(hoy));
  const [editSlot, setEditSlot] = useState<"" | "comida" | "cena">("");
  const [qCal, setQCal] = useState<string>("");
  const [txtCal, setTxtCal] = useState<string>("");

  const card = { border: `1px solid ${th.border.default}`, borderRadius: 16, padding: 16, background: th.bg.base } as const;
  const chip = (on: boolean) => ({ border: `1px solid ${on ? th.text.primary : th.border.default}`, borderRadius: 999, padding: "4px 12px", background: on ? th.fill.secondary : "transparent", color: th.text.primary, cursor: "pointer", fontSize: 13 } as const);
  const row = { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" } as const;
  const muted = { color: th.text.secondary, fontSize: 13 } as const;

  const filtros: { k: string; label: string; clear: () => void }[] = [];
  if (fCC !== "todas") filtros.push({ k: "cc", label: fCC, clear: () => setFCC("todas") });
  if (fSana !== "todas") filtros.push({ k: "s", label: "Sana: " + fSana, clear: () => setFSana("todas") });
  if (fDif !== "todas") filtros.push({ k: "d", label: fDif, clear: () => setFDif("todas") });
  if (fT !== "todas") filtros.push({ k: "t", label: "≤ " + fT + " min", clear: () => setFT("todas") });
  if (fTM !== "todas") filtros.push({ k: "tm", label: "Thermomix: " + fTM, clear: () => setFTM("todas") });
  if (fCong !== "todas") filtros.push({ k: "co", label: fCong === "Sí" ? "Se congela" : "No se congela", clear: () => setFCong("todas") });
  if (fFav) filtros.push({ k: "f", label: "Favoritos", clear: () => setFFav(false) });
  const limpiar = () => { setFCC("todas"); setFSana("todas"); setFDif("todas"); setFT("todas"); setFTM("todas"); setFCong("todas"); setFFav(false); setQ(""); };

  const lista = useMemo(() => R.filter((r: Rec) => {
    const nq = norm(q);
    if (nq && !norm(r.n + " " + r.pr + " " + r.ing.map((i: string[]) => i[1]).join(" ")).includes(nq)) return false;
    if (fCC !== "todas" && !r.cc.startsWith(fCC)) return false;
    if (fSana !== "todas" && r.sana !== fSana) return false;
    if (fDif !== "todas" && r.dif !== fDif) return false;
    if (fT !== "todas" && r.t > Number(fT)) return false;
    if (fTM !== "todas" && r.tm !== fTM) return false;
    if (fCong !== "todas" && !r.cong.startsWith(fCong)) return false;
    if (fFav && !st.fav.includes(r.n)) return false;
    return true;
  }), [q, fCC, fSana, fDif, fT, fTM, fCong, fFav, st.fav]);

  const toggleFav = (n: string) => up({ fav: st.fav.includes(n) ? st.fav.filter((x: string) => x !== n) : [...st.fav, n] });

  const sorprender = () => {
    const cal: Record<string, CalDay> = { ...st.cal };
    const usados = new Set<string>();
    const filled: { fecha: string; slot: "comida" | "cena" }[] = [];
    for (let i = 0; i < 7; i++) {
      const fecha = shiftDay(semanaElegida, i);
      for (const slot of ["comida", "cena"] as const) if (cal[fecha]?.[slot]?.tipo === "receta") usados.add(cal[fecha]![slot]!.valor);
    }
    for (let i = 0; i < 7; i++) {
      const fecha = shiftDay(semanaElegida, i);
      for (const slot of ["comida", "cena"] as const) {
        if (cal[fecha]?.[slot]) continue;
        const want = slot === "comida" ? "Comida" : "Cena";
        const pool = R.filter((r: Rec) => r.cc.startsWith(want) && !usados.has(r.n));
        if (!pool.length) continue;
        const p = pool[Math.floor(Math.random() * pool.length)];
        usados.add(p.n);
        const prev = cal[fecha] ? { ...cal[fecha] } : {};
        prev[slot] = { tipo: "receta", valor: p.n };
        cal[fecha] = prev;
        filled.push({ fecha, slot });
      }
    }
    setSt((s: St) => ({ ...s, cal }));
    setUndoGen(filled.length ? filled : null);
    setMsg(filled.length ? "Rellenados " + filled.length + " huecos vacíos. Lo que ya estaba no se ha tocado." : "No quedaban huecos vacíos, o no hay más recetas de ese turno sin repetir.");
  };
  const deshacerGen = () => {
    if (!undoGen) return;
    setSt((s: St) => {
      const cal = { ...s.cal };
      for (const f of undoGen) {
        const day = cal[f.fecha] ? { ...cal[f.fecha] } : {};
        delete day[f.slot];
        if (day.comida || day.cena) cal[f.fecha] = day; else delete cal[f.fecha];
      }
      return { ...s, cal };
    });
    setUndoGen(null);
    setMsg("Deshecho: esos huecos vuelven a estar vacíos.");
  };

  // Compra
  const setMeal = (fecha: string, slot: "comida" | "cena", meal: Meal | null) => {
    setSt((s: St) => {
      const prev = s.cal[fecha] ? { ...s.cal[fecha] } : {};
      if (meal) prev[slot] = meal; else delete prev[slot];
      const cal = { ...s.cal };
      if (prev.comida || prev.cena) cal[fecha] = prev; else delete cal[fecha];
      const nombre = meal && meal.tipo === "texto" ? meal.valor.trim() : "";
      const platos = nombre && !(s.platos || []).some((p: string) => norm(p) === norm(nombre)) ? [...(s.platos || []), nombre] : (s.platos || []);
      return { ...s, cal, platos };
    });
    setEditSlot("");
  };
  const quitarPlato = (nombre: string) => setSt((s: St) => ({ ...s, platos: (s.platos || []).filter((p: string) => norm(p) !== norm(nombre)) }));
  const recetasSemana = (lunes: string): Rec[] => {
    const out: Rec[] = [];
    for (let i = 0; i < 7; i++) {
      const day = st.cal[shiftDay(lunes, i)];
      if (!day) continue;
      for (const slot of ["comida", "cena"] as const) {
        const m = day[slot];
        if (!m || m.tipo !== "receta") continue;
        const r = R.find((x: Rec) => x.n === m.valor);
        if (r) out.push(r);
      }
    }
    return out;
  };
  const textosSemana = (lunes: string): { valor: string; cuando: string }[] => {
    const out: { valor: string; cuando: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const fecha = shiftDay(lunes, i);
      const day = st.cal[fecha];
      if (!day) continue;
      for (const slot of ["comida", "cena"] as const) {
        const m = day[slot];
        if (m && m.tipo === "texto" && m.valor.trim()) out.push({ valor: m.valor.trim(), cuando: tituloDia(fecha) + " · " + slot });
      }
    }
    return out;
  };
  const claveHueco = (fecha: string, slot: "comida" | "cena") => fecha + "|" + slot;
  const yaAnadida = (fecha: string, slot: "comida" | "cena") => (st.anadidas || []).includes(claveHueco(fecha, slot)) || (!!st.calCompra && fecha >= st.calCompra && fecha <= shiftDay(st.calCompra, 6));
  const anadirHueco = (fecha: string, slot: "comida" | "cena") => {
    const m = st.cal[fecha]?.[slot];
    if (!m) return;
    const k = claveHueco(fecha, slot);
    if (!(st.anadidas || []).includes(k)) up({ anadidas: [...(st.anadidas || []), k] });
    setMsg(m.tipo === "texto" ? "Añadida como recordatorio, sin ingredientes." : "Añadida a la lista de la compra.");
  };
  const enviarSemana = () => {
    const n = recetasSemana(semanaElegida).length;
    const t = textosSemana(semanaElegida).length;
    if (!n && !t) { setMsg("Esa semana está vacía. Abre un día y escribe un plato o elige una receta."); return; }
    up({ calCompra: semanaElegida, checks: [] });
    setVista("compra");
    setMsg(t ? "Lista actualizada. Los platos inventados van como recordatorio, sin ingredientes." : "Lista actualizada con " + n + " receta(s) del calendario.");
  };

  const compra = useMemo(() => {
    const src = st.confirmado;
    const g: Record<string, { c: string; amts: Record<string, number>; txt: string[]; de: string[] }> = {};
    const sumar = (r: Rec, f: number) => {
      for (const [qq, nn] of r.ing) {
        const c = canon(nn); if (c === "Agua") continue;
        const it = g[c] || (g[c] = { c, amts: {}, txt: [], de: [] });
        if (!it.de.includes(r.n)) it.de.push(r.n);
        const a = amount(qq);
        if (a) it.amts[a.u] = (it.amts[a.u] || 0) + a.v * f;
        else if (!it.txt.includes(qq.toLowerCase())) it.txt.push(qq.toLowerCase());
      }
    };
    if (src) for (const s of SLOTS) {
      const r = R.find((x: Rec) => x.n === src.menu[s]); if (!r) continue;
      sumar(r, src.rac / r.rac);
    }
    const claves = new Set<string>();
    if (st.calCompra) for (let i = 0; i < 7; i++) { const fecha = shiftDay(st.calCompra, i); claves.add(fecha + "|comida"); claves.add(fecha + "|cena"); }
    for (const k of st.anadidas || []) claves.add(k);
    const avisos: { valor: string; cuando: string }[] = [];
    for (const k of claves) {
      const [fecha, slot] = k.split("|") as [string, "comida" | "cena"];
      const m = st.cal[fecha]?.[slot];
      if (!m) continue;
      if (m.tipo === "receta") { const r = R.find((x: Rec) => x.n === m.valor); if (r) sumar(r, 1); }
      else if (m.valor.trim()) avisos.push({ valor: m.valor.trim(), cuando: tituloDia(fecha) + " · " + slot });
    }
    const out: Record<string, { c: string; qty: string; de: string[] }[]> = {};
    for (const it of Object.values(g)) {
      const parts = Object.entries(it.amts).map(([u, v]: [string, number]) => u === "g" && v >= 1000 ? fmt(v / 1000) + " kg" : u === "ml" && v >= 1000 ? fmt(v / 1000) + " l" : fmt(v) + " " + u);
      const qty = [...parts, ...it.txt].join(" + ");
      const k = catOf(it.c);
      (out[k] = out[k] || []).push({ c: it.c, qty, de: it.de });
    }
    for (const m of st.manual) (out[m.cat] = out[m.cat] || []).push({ c: m.t, qty: "añadido a mano", de: [] });
    for (const a of avisos) (out["Recordatorio"] = out["Recordatorio"] || []).push({ c: a.valor, qty: "sin ingredientes · " + a.cuando, de: [] });
    return out;
  }, [st.confirmado, st.manual, st.cal, st.calCompra, st.anadidas]);
  const CATS = ["Verduras y fruta", "Proteínas", "Lácteos", "Despensa", "Básicos", "Recordatorio"];
  const textoCompra = (): string => CATS.filter((c: string) => compra[c]).map((c: string) => c.toUpperCase() + "\n" + compra[c].map((i: { c: string; qty: string }) => `${st.checks.includes(i.c) ? "[x]" : "[ ]"} ${i.c}: ${i.qty}`).join("\n")).join("\n\n");

  // Nevera
  const nevera = useMemo(() => {
    const have = new Set(st.nevera);
    const basic = ["Sal", "Pimienta", "Agua", "Aceite"];
    return R.filter((r: Rec) => nevCC === "todas" || r.cc.startsWith(nevCC)).map((r: Rec) => {
      const req = Array.from(new Set(r.ing.filter((i: string[]) => !isOpt(i[0], i[1])).map((i: string[]) => canon(i[1])))).filter((c: string) => !(st.basicos && basic.includes(c)));
      const tiene = req.filter((c: string) => have.has(c));
      const falta = req.filter((c: string) => !have.has(c));
      return { r, tiene, falta, total: req.length };
    }).sort((a: { falta: string[]; tiene: string[] }, b: { falta: string[]; tiene: string[] }) => a.falta.length - b.falta.length || b.tiene.length - a.tiene.length);
  }, [st.nevera, st.basicos, nevCC]);
  const addNevera = () => { if (!nevT.trim()) return; const c = canon(nevT); if (!st.nevera.includes(c)) up({ nevera: [...st.nevera, c] }); setNevT(""); };
  const faltaACompra = (falta: string[]) => {
    const nuevos = falta.filter((c: string) => !st.manual.some((m: { t: string }) => m.t === c)).map((c: string) => ({ cat: catOf(c), t: c }));
    up({ manual: [...st.manual, ...nuevos] }); setMsg(`Añadido a la compra: ${falta.join(", ")}.`);
  };

  const rec = R.find((r: Rec) => r.n === abierta);
  const factor = rec ? (racR || rec.rac) / rec.rac : 1;
  const noEsc = rec ? rec.ing.filter((i: string[]) => scaleQty(i[0], 2) === null || NOSCALE.test(i[0])).map((i: string[]) => `${i[1]} (${i[0]})`) : [];

  const sel = (v: string, set: (x: string) => void, opts: [string, string][], label: string) => (
    <Select label={label} value={v} onChange={set} options={opts.map(([value, l]: [string, string]) => ({ value, label: l }))} />
  );
  const taStyle = { width: "100%", minHeight: 120, fontFamily: th.font.mono, fontSize: 12, color: th.text.primary, background: th.bg.subtle, border: `1px solid ${th.border.default}`, borderRadius: 8, padding: 8, boxSizing: "border-box" } as const;

  return (
    <Page title="El Chef de Antracita · Recetario" summary="Tu recetario personal: 25 recetas, calendario, lista de la compra automática y qué puedes cocinar con lo que tienes en la nevera." width="wide" palette={["#B8742A", "#7A4A2A", "#C9A26B"]}>
      <Segmented value={vista} onChange={setVista} options={[{ value: "rec", label: "🍲 Recetario" }, { value: "cal", label: "📅 Calendario" }, { value: "compra", label: "🛒 Lista de compra" }, { value: "nevera", label: "🧊 Mi nevera" }, { value: "datos", label: "⚙️ Datos y pendiente" }]} />
      {msg && <Callout tone="info">{msg}</Callout>}

      {vista === "rec" && (
        <Section>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "flex-end", marginTop: 8 }}>
            <div style={{ flex: "1 1 300px" }}>
              <div style={{ color: C.kicker, fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>COCINAR CADA DÍA, SIN COMPLICARSE</div>
              <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(32px, 6vw, 46px)", color: C.text, margin: "6px 0" }}>¿Qué cocinamos hoy?</h1>
              <div style={{ color: C.muted, fontSize: 15 }}>Todas tus recetas, paso a paso y listas para llevar a la mesa.</div>
            </div>
            <Button label="Planificar semana →" onClick={() => setVista("cal")} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, margin: "20px 0" }}>
            {[[R.length, "Recetas propias"], [R.filter((r: Rec) => r.sana === "Sí").length, "Marcadas sanas"], [R.filter((r: Rec) => r.tm === "Sí").length, "Con Thermomix"]].map((k: (string | number)[]) => <div key={String(k[1])} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "16px 18px" }}><div style={{ fontFamily: SERIF, fontSize: 30, color: C.text }}>{k[0]}</div><div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{k[1]}</div></div>)}
          </div>
          <div style={row}>
          <Input value={q} onChange={setQ} placeholder="Buscar plato o ingrediente…" />
            {sel(orden, setOrden, [["nombre", "Por nombre"], ["tiempo", "Por tiempo"], ["fav", "Favoritos primero"]], "Ordenar")}
          </div>
          <div style={{ ...row, marginTop: 12 }}>
            {sel(fCC, setFCC, [["todas", "Comida y cena"], ["Comida", "Comida"], ["Cena", "Cena"]], "Comida / Cena")}
            {sel(fSana, setFSana, [["todas", "Todas"], ["Sí", "Sana"], ["Moderado", "Moderada"]], "Saludable")}
            {sel(fDif, setFDif, [["todas", "Todas"], ["Fácil", "Fácil"], ["Media", "Media"]], "Dificultad")}
            {sel(fT, setFT, [["todas", "Sin límite"], ["20", "≤ 20 min"], ["30", "≤ 30 min"], ["45", "≤ 45 min"]], "Tiempo máximo")}
            {sel(fTM, setFTM, [["todas", "Todas"], ["Sí", "Con Thermomix"], ["No", "Sin Thermomix"]], "Thermomix")}
            {sel(fCong, setFCong, [["todas", "Todas"], ["Sí", "Se congela"], ["No", "No se congela"]], "Conservación")}
            <Toggle label="Solo favoritos" value={fFav} onChange={setFFav} />
          </div>
          {filtros.length > 0 && <div style={{ ...row, marginTop: 12 }}>
            {filtros.map((f: { k: string; label: string; clear: () => void }) => <button key={f.k} style={chip(true)} onClick={f.clear}>{f.label} ✕</button>)}
            <Button label="Limpiar filtros" onClick={limpiar} />
          </div>}
          <div className="rec-legend" aria-label="Leyenda">
            <span>🥗 Sana</span>
            <span className="legend-dif"><i className="dot facil" /> Fácil</span>
            <span className="legend-dif"><i className="dot media" /><i className="dot media" /> Media</span>
            <span className="legend-dif"><i className="dot dificil" /><i className="dot dificil" /><i className="dot dificil" /> Difícil</span>
          </div>
          <div style={{ ...muted, marginTop: 8 }}>{lista.length} de {R.length} recetas</div>
          {lista.length === 0 && <div style={{ ...card, marginTop: 12 }}><div>Ninguna receta cumple todos los filtros.</div><div style={{ marginTop: 8 }}><Button label="Limpiar filtros" variant="primary" onClick={limpiar} /></div></div>}
          <div className="rec-grid">
            {[...lista].sort((a: Rec, b: Rec) => orden === "tiempo" ? a.t - b.t : orden === "fav" ? Number(st.fav.includes(b.n)) - Number(st.fav.includes(a.n)) || a.n.localeCompare(b.n, "es") : a.n.localeCompare(b.n, "es")).map((r: Rec) => (
              <button type="button" key={r.n} className="rec-card" aria-pressed={abierta === r.n} onClick={() => { setAbierta(abierta === r.n ? "" : r.n); setRacR(0); }} style={{ borderColor: abierta === r.n ? C.green : C.line }}>
                <span className="rec-emoji" style={{ background: GRADS[R.indexOf(r) % GRADS.length] }}>{EMO(r)}</span>
                <span className="rec-body">
                  <span className="rec-name">{r.n}</span>
                  <span className="rec-meta">{r.t} min{r.tm === "Sí" ? " · TM" : ""}</span>
                  {(r.sana === "Sí" || puntosDif(r.dif) !== null) ? <span className="rec-badges">{r.sana === "Sí" ? <span className="badge-sana">🥗 Sana</span> : null}{puntosDif(r.dif) !== null ? <span className="legend-dif" aria-label={r.dif}>{Array.from({ length: puntosDif(r.dif) as number }, (_, i: number) => <i key={i} className={"dot " + (r.dif === "Fácil" ? "facil" : r.dif === "Media" ? "media" : "dificil")} />)}</span> : null}</span> : null}
                </span>
                <span role="button" aria-label={"Favorito " + r.n} className="rec-fav" onClick={(e: MouseEvent) => { e.stopPropagation(); e.preventDefault(); toggleFav(r.n); }}>{st.fav.includes(r.n) ? "★" : "☆"}</span>
              </button>
            ))}
          </div>
        </Section>
      )}
      {vista === "rec" && rec && (
        <Section heading={rec.n}>
          <Properties items={[
            { label: "Ingrediente principal", value: rec.pr }, { label: "Comida / Cena", value: rec.cc }, { label: "Tiempo", value: rec.t + " min" }, { label: "Dificultad", value: rec.dif },
            { label: "¿Es sana?", value: rec.sana }, { label: "¿Thermomix?", value: rec.tm }, { label: "¿Se congela?", value: rec.cong }, { label: "Nevera (días tras hacerla)", value: rec.nev },
            { label: "Valoración", value: rec.val || "Sin valorar todavía" },
          ]} />
          <div style={{ ...row, marginTop: 12 }}>
            <span style={muted}>Raciones (receta original: {rec.rac}):</span>
            <Button label="−" onClick={() => setRacR(Math.max(1, (racR || rec.rac) - 1))} />
            {[2, 3, 4].map((n: number) => <button key={n} style={chip((racR || rec.rac) === n)} onClick={() => setRacR(n)}>{n}</button>)}
            <Button label="+" onClick={() => setRacR((racR || rec.rac) + 1)} />
            <span style={muted}>Ahora: {racR || rec.rac}</span>
          </div>
          <Table columns={["Cantidad", "Ingrediente"]} rows={rec.ing.map((i: string[]) => [scaleQty(i[0], factor) ?? i[0], i[1]])} />
          {factor !== 1 && noEsc.length > 0 && <Text>{`No se escalan automáticamente: ${noEsc.join("; ")}. Son cantidades «al gusto», pizcas, chorritos u opcionales: ajústalas probando.`}</Text>}
          {rec.ut ? <Text>{"Utensilios: " + rec.ut}</Text> : null}
          <Steps steps={rec.pasos.map((p: string, i: number) => { const k = p.indexOf(":"); return k > 0 && k < 70 ? { title: `${i + 1}. ${p.slice(0, k)}`, detail: p.slice(k + 1).trim() } : { title: `${i + 1}`, detail: p }; })} />
          <Text>{"Comentarios: " + rec.com}</Text>
        </Section>
      )}

      {vista === "cal" && (
        <Section heading="Calendario">
          <div style={{ ...muted, marginBottom: 12 }}>Mes en hora de Madrid. Cada día tiene Comida y Cena: una receta del recetario o un texto libre.</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button aria-label="Mes anterior" onClick={() => setMes(shiftMonth(mes, -1))} style={{ minWidth: 48, minHeight: 48, borderRadius: 14, border: `1px solid ${C.line}`, background: C.card, fontSize: 20, cursor: "pointer" }}>‹</button>
            <div style={{ flex: 1, textAlign: "center", fontFamily: SERIF, fontSize: 26 }}>{tituloMes(mes)}</div>
            <button aria-label="Mes siguiente" onClick={() => setMes(shiftMonth(mes, 1))} style={{ minWidth: 48, minHeight: 48, borderRadius: 14, border: `1px solid ${C.line}`, background: C.card, fontSize: 20, cursor: "pointer" }}>›</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4, marginTop: 12 }}>
            {["L", "M", "X", "J", "V", "S", "D"].map((d: string) => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: C.muted }}>{d}</div>)}
            {monthCells(mes).map((fecha: string | null, i: number) => fecha ? (
              <button type="button" key={fecha} onClick={() => { setDiaCal(fecha); setSemanaElegida(weekStart(fecha)); setEditSlot(""); window.setTimeout(() => document.getElementById("cal-semana")?.scrollIntoView({ block: "start" }), 40); }} aria-label={tituloDia(fecha)} style={{ minHeight: 64, borderRadius: 10, padding: 3, textAlign: "left", cursor: "pointer", border: fecha === diaCal ? `2px solid ${C.green}` : fecha === hoy ? `2px solid ${C.kicker}` : `1px solid ${C.line}`, background: fecha >= semanaElegida && fecha <= shiftDay(semanaElegida, 6) ? C.soft : C.card, color: C.text }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{Number(fecha.slice(8))}</div>
                {(["comida", "cena"] as const).map((slot) => { const m = st.cal[fecha]?.[slot]; return m ? <div key={slot} style={{ fontSize: 9, lineHeight: 1.15, overflow: "hidden", whiteSpace: "nowrap", color: m.tipo === "receta" ? C.green : C.muted }}>{slot === "comida" ? "C " : "N "}{corto(m)}</div> : null; })}
              </button>
            ) : <div key={"v" + i} />)}
          </div>
          <div id="cal-semana" style={{ ...card, marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button type="button" aria-label="Semana anterior" onClick={() => setSemanaElegida(shiftDay(semanaElegida, -7))} style={{ minWidth: 48, minHeight: 48, borderRadius: 14, border: `1px solid ${C.line}`, background: C.card, fontSize: 20 }}>‹</button>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontFamily: SERIF, fontSize: 20 }}>Semana del {tituloDia(semanaElegida).replace(/^[^,]+, /, "")}</div>
                <div style={muted}>Toca un día del mes para elegir su semana.</div>
              </div>
              <button type="button" aria-label="Semana siguiente" onClick={() => setSemanaElegida(shiftDay(semanaElegida, 7))} style={{ minWidth: 48, minHeight: 48, borderRadius: 14, border: `1px solid ${C.line}`, background: C.card, fontSize: 20 }}>›</button>
            </div>
            <div className="ws" style={{ marginTop: 10 }}>
              <span />
              <span className="ws-h">Comida</span>
              <span className="ws-h">Cena</span>
              {Array.from({ length: 7 }, (_, i: number) => shiftDay(semanaElegida, i)).map((fecha: string) => (
                <div key={fecha} style={{ display: "contents" }}>
                  <button type="button" className="ws-day" onClick={() => { setDiaCal(fecha); setEditSlot(""); }}>{diaCorto(fecha)}</button>
                  {(["comida", "cena"] as const).map((slot) => {
                    const m = st.cal[fecha]?.[slot];
                    const puesta = yaAnadida(fecha, slot);
                    return (
                      <div key={slot} className="ws-cell">
                        <span className="ws-name">{m ? m.valor : "—"}</span>
                        {m ? <button type="button" className="ws-cart" aria-label={(puesta ? "Añadida: " : "Enviar a la compra: ") + m.valor} onClick={() => anadirHueco(fecha, slot)}>{puesta ? "✓" : "🛒"}</button> : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              <button type="button" onClick={sorprender} style={{ minHeight: 48, flex: "1 1 160px", borderRadius: 999, border: "none", background: C.green, color: "#fff", fontWeight: 700, fontSize: 15 }}>Sorpréndeme / Generar menú</button>
              {undoGen ? <button type="button" onClick={deshacerGen} style={{ minHeight: 48, flex: "1 1 120px", borderRadius: 999, border: `1px solid ${C.line}`, background: C.card, fontWeight: 700 }}>Deshacer</button> : null}
              <button type="button" onClick={enviarSemana} style={{ minHeight: 48, flex: "1 1 160px", borderRadius: 999, border: `1px solid ${C.green}`, background: C.soft, color: C.green, fontWeight: 700, fontSize: 15 }}>Enviar toda la semana</button>
            </div>
            {msg ? <div style={{ ...muted, marginTop: 8 }}>{msg}</div> : null}
          </div>
          <div id="cal-dia" style={{ ...card, marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
              <div style={{ fontFamily: SERIF, fontSize: 22 }}>{tituloDia(diaCal)}{diaCal === hoy ? " · Hoy" : ""}</div>
            </div>
            {(["comida", "cena"] as const).map((slot) => {
              const meal = st.cal[diaCal]?.[slot];
              const abiertaEd = editSlot === slot;
              const filtro = norm(qCal);
              const opciones = R.filter((r: Rec) => !filtro || norm(r.n).includes(filtro));
              return (
                <div key={slot} style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
                  <div style={{ fontWeight: 700, letterSpacing: 1 }}>{slot === "comida" ? "COMIDA" : "CENA"}</div>
                  {meal && !abiertaEd ? (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 18 }}>{meal.valor}</div>
                      <div style={{ ...muted, marginTop: 4 }}>{meal.tipo === "receta" ? "Receta del recetario" : "Plato propio"}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        {meal.tipo === "receta" && R.some((r: Rec) => r.n === meal.valor) ? <button type="button" onClick={() => { setAbierta(meal.valor); setRacR(0); setVista("rec"); }} style={{ minHeight: 48, flex: 1, borderRadius: 999, border: "none", background: C.green, color: "#fff", fontWeight: 700, fontSize: 16 }}>Ver receta</button> : null}
                        <button type="button" onClick={() => { setEditSlot(slot); setQCal(""); setTxtCal(meal.tipo === "texto" ? meal.valor : ""); }} style={{ minHeight: 48, flex: 1, borderRadius: 999, border: `1px solid ${C.line}`, background: C.card, fontWeight: 700, fontSize: 16 }}>Editar</button>
                        <button type="button" onClick={() => setMeal(diaCal, slot, null)} style={{ minHeight: 48, flex: 1, borderRadius: 999, border: `1px solid ${C.line}`, background: C.card, fontWeight: 700, fontSize: 16 }}>Borrar</button>
                      </div>
                    </div>
                  ) : !abiertaEd ? (
                    <div style={{ marginTop: 8 }}><button type="button" onClick={() => { setEditSlot(slot); setQCal(""); setTxtCal(""); window.setTimeout(() => document.getElementById("plato-libre")?.focus(), 40); }} style={{ minHeight: 48, width: "100%", borderRadius: 999, border: `1px solid ${C.line}`, background: C.soft, color: C.green, fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Añadir</button></div>
                  ) : (
                    <div style={{ marginTop: 8 }}>
                      <label htmlFor="plato-libre" style={{ fontSize: 13, color: C.muted }}>Plato inventado</label>
                      <input id="plato-libre" enterKeyHint="done" value={txtCal} placeholder="Tortilla de la abuela" onChange={(e: ChangeEvent<HTMLInputElement>) => setTxtCal(e.target.value)} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter" && txtCal.trim()) setMeal(diaCal, slot, { tipo: "texto", valor: txtCal.trim() }); }} style={{ width: "100%", minHeight: 48, fontSize: 16, borderRadius: 12, border: `1px solid ${C.line}`, padding: "10px 12px", marginTop: 6, boxSizing: "border-box" }} />
                      <button type="button" onClick={() => { if (txtCal.trim()) setMeal(diaCal, slot, { tipo: "texto", valor: txtCal.trim() }); }} style={{ minHeight: 48, width: "100%", marginTop: 8, borderRadius: 999, border: "none", background: C.green, color: "#fff", fontWeight: 700, fontSize: 16 }}>Guardar este plato</button>
                      {(st.platos || []).filter((p: string) => !filtro || norm(p).includes(filtro)).length > 0 ? <div style={{ marginTop: 16, fontWeight: 700 }}>Mis platos</div> : null}
                      {(st.platos || []).filter((p: string) => !filtro || norm(p).includes(filtro)).map((p: string) => (
                        <div key={p} style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <button type="button" onClick={() => setMeal(diaCal, slot, { tipo: "texto", valor: p })} style={{ flex: 1, minHeight: 48, textAlign: "left", borderRadius: 12, border: `1px solid ${C.line}`, background: "#F3E2C7", padding: "8px 12px", fontSize: 16, fontWeight: 700 }}>Plato propio · {p}</button>
                          <button type="button" aria-label={"Quitar " + p + " de Mis platos"} onClick={() => quitarPlato(p)} style={{ minWidth: 72, minHeight: 48, borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, fontWeight: 700 }}>Quitar</button>
                        </div>
                      ))}
                      <div style={{ marginTop: 16, fontWeight: 700 }}>Recetas del libro</div>
                      <div style={{ marginTop: 8 }}><Input value={qCal} onChange={setQCal} placeholder="Buscar receta…" /></div>
                      <div style={{ maxHeight: 220, overflowY: "auto", marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                        {opciones.map((r: Rec) => <button type="button" key={r.n} onClick={() => setMeal(diaCal, slot, { tipo: "receta", valor: r.n })} style={{ minHeight: 48, textAlign: "left", borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, padding: "8px 12px", cursor: "pointer", color: C.text, fontSize: 16 }}>{r.n}</button>)}
                        {opciones.length === 0 ? <div style={muted}>Ninguna receta con ese nombre.</div> : null}
                      </div>
                      <button type="button" onClick={() => setEditSlot("")} style={{ minHeight: 48, width: "100%", marginTop: 8, borderRadius: 999, border: `1px solid ${C.line}`, background: C.card, fontWeight: 700, fontSize: 16 }}>Cancelar</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {vista === "compra" && (
        <Section heading="La compra, hecha">
          {!st.confirmado && !st.calCompra && !(st.anadidas || []).length && <Callout tone="warning">Desde el calendario, envía un hueco o toda la semana. Mientras tanto puedes añadir productos a mano.</Callout>}
          {st.confirmado && <div style={muted}>{`Semana ${st.confirmado.semana} · ${st.confirmado.rac} raciones por plato. Se suman las unidades compatibles (g, kg, ml, l, cucharadas…); las incompatibles van separadas con «+».`}</div>}
          {st.calCompra && <div style={{ ...muted, marginTop: 8 }}>{`Calendario, semana del ${tituloDia(st.calCompra).replace(/^[^,]+, /, "")}. Las recetas suman sus ingredientes. Los platos inventados salen en Recordatorio, sin ingredientes.`}</div>}
          {st.calCompra ? <div style={{ marginTop: 8 }}><Button label="Quitar la semana del calendario" onClick={() => up({ calCompra: null })} /></div> : null}
          <div style={{ ...row, marginTop: 12 }}>
            <Button label="Imprimir" onClick={() => { try { window.print(); } catch (e) { setMsg("La impresión no está disponible aquí: usa Exportar y copia el texto."); } }} />
            <Button label="Exportar como texto" onClick={() => { setIo(textoCompra()); setVista("datos"); }} />
            <Button label="Desmarcar todo" onClick={() => up({ checks: [] })} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginTop: 12 }}>
            {CATS.filter((c: string) => compra[c]).map((c: string) => (
              <div key={c} style={card}>
                <div style={{ fontWeight: 600, letterSpacing: 1, color: th.text.primary }}>{c.toUpperCase()}</div>
                {compra[c].map((i: { c: string; qty: string; de: string[] }) => { const on = st.checks.includes(i.c); return (
                  <label key={i.c} style={{ display: "flex", gap: 8, marginTop: 8, cursor: "pointer", color: th.text.primary, opacity: on ? 0.5 : 1 }}>
                    <input type="checkbox" checked={on} onChange={(e: ChangeEvent<HTMLInputElement>) => up({ checks: e.target.checked ? [...st.checks, i.c] : st.checks.filter((x: string) => x !== i.c) })} />
                    <span style={{ textDecoration: on ? "line-through" : "none" }}>{i.c} <span style={muted}>· {i.qty}</span></span>
                    {i.qty === "añadido a mano" && <button style={{ ...chip(false), padding: "0 8px" }} onClick={() => up({ manual: st.manual.filter((m: { t: string }) => m.t !== i.c) })}>✕</button>}
                  </label>); })}
              </div>
            ))}
          </div>
          <div style={{ ...row, marginTop: 12 }}>
            <Input label="+ Añadir producto manualmente" value={manT} onChange={setManT} placeholder="Ej.: papel de horno" />
            {sel(manC, setManC, CATS.map((c: string) => [c, c] as [string, string]), "Categoría")}
            <Button label="Añadir" onClick={() => { if (manT.trim()) { up({ manual: [...st.manual, { cat: manC, t: manT.trim() }] }); setManT(""); } }} />
          </div>
        </Section>
      )}

      {vista === "nevera" && (
        <Section heading="¿Qué hay en mi nevera?">
          <Text>Sirve para ver qué recetas puedes hacer con lo que marcas que tienes en casa. Toca un ingrediente para decir que lo tienes. Abajo, una receta solo sale como «Lista para cocinar» si no te falta ninguno de los ingredientes obligatorios; si faltan uno o dos, pone «Casi la tienes», y si faltan más, «Para otro día». Con la opción marcada, sal, pimienta, agua y aceite no cuentan.</Text>
          <div style={row}>
            <Input label="Añadir ingrediente" value={nevT} onChange={setNevT} placeholder="tomates, huevo, calabacin…" />
            <Button label="Añadir" onClick={addNevera} />
            <Toggle label="No contar básicos (sal, pimienta, agua, aceite)" value={st.basicos} onChange={(v: boolean) => up({ basicos: v })} />
            {sel(nevCC, setNevCC, [["todas", "Comida y cena"], ["Comida", "Comida"], ["Cena", "Cena"]], "Filtrar")}
            <Button label="Vaciar nevera" onClick={() => up({ nevera: [] })} />
          </div>
          <div style={{ ...muted, marginTop: 12 }}>Marca lo que tienes (singular/plural y tildes se normalizan). Seleccionados: {st.nevera.length}</div>
          <div style={{ ...row, marginTop: 8 }}>
            {Array.from(new Set([...ALLING, ...st.nevera])).map((c: string) => { const on = st.nevera.includes(c); return <button key={c} style={chip(on)} onClick={() => up({ nevera: on ? st.nevera.filter((x: string) => x !== c) : [...st.nevera, c] })}>{on ? "✓ " : ""}{c}</button>; })}
          </div>
          <Callout>Regla: una receta solo figura como «Lista para cocinar» si no falta ningún ingrediente obligatorio; las coincidencias parciales nunca cuentan como completa.</Callout>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginTop: 12 }}>
            {nevera.map((x: { r: Rec; tiene: string[]; falta: string[]; total: number }) => (
              <div key={x.r.n} style={card}>
                <div style={{ fontSize: 12, letterSpacing: 1, color: x.falta.length === 0 ? th.text.success : th.text.secondary }}>{x.falta.length === 0 ? "LISTA PARA COCINAR" : x.falta.length <= 2 ? "CASI LA TIENES" : "PARA OTRO DÍA"}</div>
                <div style={{ fontWeight: 600, marginTop: 4, color: th.text.primary }}>{x.r.n}</div>
                <div style={{ ...muted, marginTop: 4 }}>Coinciden {x.tiene.length} de {x.total} ingredientes</div>
                {x.falta.length > 0 && <div style={{ fontSize: 13, marginTop: 4, color: th.text.primary }}>Faltan: {x.falta.join(", ")}</div>}
                <div style={{ ...row, marginTop: 8 }}>
                  <Button label="Ver receta" onClick={() => { setAbierta(x.r.n); setRacR(0); setVista("rec"); }} />
                  {x.falta.length > 0 && <Button label="Añadir lo que falta a la compra" onClick={() => faltaACompra(x.falta)} />}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {vista === "datos" && (
        <Section heading="Copia de seguridad (JSON) y exportación">
          <Text>{persist ? "Tus favoritos, menús, calendario, nevera y lista de la compra se guardan en este navegador. Exporta una copia para pasarlos a otro dispositivo." : "Este visor no permite guardar datos entre visitas: exporta el JSON antes de cerrar y vuelve a importarlo después."}</Text>
          <div style={row}>
            <Button label="Exportar JSON" variant="primary" onClick={() => { setIo(JSON.stringify(st, null, 1)); setIoMsg("JSON listo: cópialo y guárdalo."); }} />
            <Button label="Copiar al portapapeles" onClick={() => { try { navigator.clipboard.writeText(io).then(() => setIoMsg("Copiado."), () => setIoMsg("No se pudo copiar: selecciona el texto y cópialo a mano.")); } catch (e) { setIoMsg("No se pudo copiar: selecciona el texto y cópialo a mano."); } }} />
            <Button label="Importar JSON pegado" onClick={() => { try { const d = JSON.parse(io); if (!d || typeof d !== "object" || !d.menu) throw new Error("x"); setSt({ ...INIT, ...d }); setIoMsg("Datos importados."); } catch (e) { setIoMsg("El texto no es un JSON válido de este recetario."); } }} />
          </div>
          {ioMsg && <div style={{ ...muted, marginTop: 8 }}>{ioMsg}</div>}
          <textarea style={{ ...taStyle, marginTop: 8 }} value={io} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setIo(e.target.value)} placeholder="Pega aquí un JSON exportado para importarlo, o pulsa Exportar." />
        </Section>
      )}
      {vista === "datos" && (
        <Section heading="Pendiente para una web privada real">
          <BulletList items={[
            "Cinco cuentas: Alberto propietario, administrador y único editor; cuatro invitados con rol Viewer (solo lectura), sin alta pública.",
            "Autenticación real (HTTPS, inicio de sesión por usuario en PC e iPhone) y permisos comprobados también en el servidor y la base de datos, no solo ocultando botones.",
            "Sincronización automática Hoja → Web cada 5-15 min con estado verde/ámbar/rojo, «Última sincronización» y botón «Comprobar ahora».",
            "La fuente real es el Google Sheet «El Chef de Antracita · Recetario», no un Excel en SharePoint/OneDrive: la conexión sería con la API de Google Sheets, no Microsoft Graph.",
            "Edición de recetas desde la web (+ Nueva receta, Editar, Duplicar) con escritura separada de la hoja.",
          ]} />
          <Text>Esta Page usa las recetas tal como estaban en la hoja el 31/10/2026, más las cuatro añadidas después. Si cambias la hoja, pídeme que la vuelva a importar.</Text>
        </Section>
      )}
    </Page>
  );
}
