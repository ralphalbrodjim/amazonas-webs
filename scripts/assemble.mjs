import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("dist", { recursive: true });
copyFileSync("index.html", "dist/index.html");
mkdirSync("dist/ingles", { recursive: true });
copyFileSync("ingles/index.html", "dist/ingles/index.html");
copyFileSync("ingles/bank.js", "dist/ingles/bank.js");
copyFileSync("ingles/cloud.js", "dist/ingles/cloud.js");
