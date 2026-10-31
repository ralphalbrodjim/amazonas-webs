# amazonas-webs

Tres sitios estáticos, en español, publicados en GitHub Pages.

- [El Chef de Antracita](https://ralphalbrodjim.github.io/amazonas-webs/chef/) — recetario, menú semanal y lista de la compra.
- [Warren · Investment Intelligence](https://ralphalbrodjim.github.io/amazonas-webs/warren/) — cartera, radar y valoración.
- [Mi semana](https://ralphalbrodjim.github.io/amazonas-webs/semana/) — agenda editable, inglés, running y gimnasio. Los datos de partida están en `semana/data/`. Las entradas de Alberto se guardan en `localStorage` y se pueden exportar en JSON.
- [Índice](https://ralphalbrodjim.github.io/amazonas-webs/) — enlaces a los tres.

Los favoritos, menús y ediciones se guardan en `localStorage` del navegador. La exportación e importación JSON sigue disponible en cada sitio. Las páginas llevan `<meta name="robots" content="noindex">`.

El flujo `.github/workflows/pages.yml` compila y despliega al hacer push en `main`.
