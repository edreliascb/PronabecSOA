const fs = require("fs");
const path = require("path");

const root = process.cwd();
const appFile = path.join(root, "app.js");
const pkgFile = path.join(root, "package.json");
const gitignoreFile = path.join(root, ".gitignore");

if (!fs.existsSync(appFile)) {
  console.error("❌ No existe app.js");
  process.exit(1);
}

if (!fs.existsSync(pkgFile)) {
  console.error("❌ No existe package.json");
  process.exit(1);
}

/* =========================================================
   package.json
========================================================= */

let pkgText = fs.readFileSync(pkgFile, "utf8").replace(/^\uFEFF/, "");
const pkg = JSON.parse(pkgText);

pkg.scripts = pkg.scripts || {};
pkg.scripts.start = "node app.js";
pkg.scripts["render:verificar"] = "node scripts/verificar-render.js";

fs.writeFileSync(
  pkgFile,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8"
);

/* =========================================================
   app.js: bind 0.0.0.0:$PORT
========================================================= */

let app = fs.readFileSync(appFile, "utf8").replace(/^\uFEFF/, "");

const alreadyBound =
  /app\.listen\s*\(\s*PORT\s*,\s*["']0\.0\.0\.0["']/m.test(app);

if (!alreadyBound) {
  const patterns = [
    {
      re: /app\.listen\s*\(\s*PORT\s*,\s*async\s*\(\s*\)\s*=>\s*\{/m,
      replacement: 'app.listen(\n    PORT,\n    "0.0.0.0",\n    async () => {'
    },
    {
      re: /app\.listen\s*\(\s*PORT\s*,\s*\(\s*\)\s*=>\s*\{/m,
      replacement: 'app.listen(\n    PORT,\n    "0.0.0.0",\n    () => {'
    },
    {
      re: /app\.listen\s*\(\s*PORT\s*,/m,
      replacement: 'app.listen(\n    PORT,\n    "0.0.0.0",'
    }
  ];

  let changed = false;

  for (const p of patterns) {
    if (p.re.test(app)) {
      app = app.replace(p.re, p.replacement);
      changed = true;
      break;
    }
  }

  if (!changed) {
    console.error("❌ No pude localizar app.listen(PORT, ...) de forma segura.");
    console.error("   No se modificó app.js.");
    process.exit(1);
  }

  fs.writeFileSync(appFile, app, "utf8");
}

/* =========================================================
   .gitignore
========================================================= */

let gi = fs.existsSync(gitignoreFile)
  ? fs.readFileSync(gitignoreFile, "utf8")
  : "";

const mustIgnore = [
  ".env",
  ".env.*",
  "!.env.example",
  "!.env.render.example",
  "node_modules/",
  "backup_*/",
  "*.log"
];

for (const rule of mustIgnore) {
  const escaped = rule.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!new RegExp(`^${escaped}$`, "m").test(gi)) {
    if (gi && !gi.endsWith("\n")) gi += "\n";
    gi += rule + "\n";
  }
}

fs.writeFileSync(gitignoreFile, gi, "utf8");

console.log("");
console.log("======================================================");
console.log(" EDUPERÚ - PREPARACIÓN PARA RENDER");
console.log("======================================================");
console.log("✅ npm start = node app.js");
console.log("✅ app.listen usa 0.0.0.0:$PORT");
console.log("✅ .gitignore protege .env y .env.*");
console.log("✅ render:verificar registrado");
