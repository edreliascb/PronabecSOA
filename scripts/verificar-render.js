const fs = require("fs");

function fail(msg) {
  console.log("❌", msg);
  return 1;
}

function ok(msg) {
  console.log("✅", msg);
  return 0;
}

console.log("");
console.log("======================================================");
console.log(" EDUPERÚ - VERIFICACIÓN PRE-DEPLOY RENDER");
console.log("======================================================");

let errors = 0;

const pkgText = fs.readFileSync("package.json", "utf8").replace(/^\uFEFF/, "");
const pkg = JSON.parse(pkgText);

errors += pkg.scripts?.start === "node app.js"
  ? ok("Start command: npm start")
  : fail("Falta scripts.start = node app.js");

errors += pkg.dependencies?.pg
  ? ok(`Dependencia pg: ${pkg.dependencies.pg}`)
  : fail("Falta dependencia pg");

errors += pkg.dependencies?.express
  ? ok(`Dependencia express: ${pkg.dependencies.express}`)
  : fail("Falta dependencia express");

const app = fs.readFileSync("app.js", "utf8");

errors += /process\.env\.PORT/.test(app)
  ? ok("PORT dinámico detectado")
  : fail("app.js no usa process.env.PORT");

errors += /app\.listen\s*\(\s*PORT\s*,\s*["']0\.0\.0\.0["']/m.test(app)
  ? ok("Bind 0.0.0.0 detectado")
  : fail("app.listen no está ligado explícitamente a 0.0.0.0");

const db = fs.readFileSync("src/config/database.js", "utf8");

errors += /DB_ENGINE/.test(db) && /DATABASE_URL/.test(db)
  ? ok("Database dual + DATABASE_URL detectado")
  : fail("database.js no parece listo para PostgreSQL Render");

const gi = fs.existsSync(".gitignore")
  ? fs.readFileSync(".gitignore", "utf8")
  : "";

errors += /^\.env$/m.test(gi)
  ? ok(".env protegido por .gitignore")
  : fail(".env NO está protegido");

errors += /^\.env\.\*$/m.test(gi)
  ? ok(".env.* protegido por .gitignore")
  : fail(".env.* NO está protegido");

console.log("------------------------------------------------------");

if (errors === 0) {
  console.log("RESULTADO: LISTO PARA RENDER ✅");
  process.exit(0);
}

console.log(`RESULTADO: REVISAR — ${errors} problema(s) ❌`);
process.exit(1);
