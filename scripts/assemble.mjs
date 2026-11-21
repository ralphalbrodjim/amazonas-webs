import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("dist", { recursive: true });
copyFileSync("index.html", "dist/index.html");
mkdirSync("dist/ingles", { recursive: true });
copyFileSync("ingles/index.html", "dist/ingles/index.html");
