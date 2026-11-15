"use strict";

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const appPath = path.join(root, "app.js");
const packagePath = path.join(root, "package.json");

if (!fs.existsSync(appPath) || !fs.existsSync(packagePath)) {
    throw new Error("Ejecuta este instalador dentro de C:\\PronabecSOA.");
}

function backup(file) {
    const bak = `${file}.hexagonal-v2.bak`;
    if (!fs.existsSync(bak)) fs.copyFileSync(file, bak);
}

backup(appPath);
backup(packagePath);

let app = fs.readFileSync(appPath, "utf8");

if (!app.includes("hexagonalPronabecRoutes")) {
    const requireBlock = `\nconst hexagonalPronabecRoutes =\n    require("./src/routes/hexagonalPronabec.routes");\n`;
    const marker = /const orientacionEducativaRoutes\s*=\s*require\(\s*["']\.\/src\/routes\/orientacionEducativa\.routes["']\s*\);/m;
    if (!marker.test(app)) throw new Error("No encontré el punto de inserción de rutas en app.js.");
    app = app.replace(marker, match => `${match}${requireBlock}`);
}

if (!app.includes('"/api/hexagonal/pronabec"')) {
    const mount = `\n\napp.use(\n    "/api/hexagonal/pronabec",\n    hexagonalPronabecRoutes\n);\n`;
    const marker = /app\.use\(\s*["']\/api\/health["']\s*,\s*healthCheckRoutes\s*\);/m;
    if (!marker.test(app)) throw new Error("No encontré /api/health para insertar el endpoint hexagonal.");
    app = app.replace(marker, `${mount}\n$&`);
}

fs.writeFileSync(appPath, app, "utf8");

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
pkg.scripts = pkg.scripts || {};
pkg.scripts["hexagonal:probar"] = "node scripts/probar-hexagonal.js";
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

console.log("✅ app.js actualizado sin reemplazarlo completo.");
console.log("✅ package.json actualizado conservando los scripts existentes.");
console.log("✅ Endpoint: GET /api/hexagonal/pronabec/:recurso");
