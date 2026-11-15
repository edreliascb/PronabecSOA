const fs = require("fs");
const path = require("path");

const pub = path.join(process.cwd(), "public");
const menuFile = path.join(pub, "js", "sidebar-global.js");

console.log("");
console.log("==================================================");
console.log(" EDUPERÚ - VERIFICACIÓN MENÚ COMPLETO V3");
console.log("==================================================");

let fails = 0;
let warns = 0;

function ok(label, condition, optional=false) {
  const icon = condition ? "✅" : optional ? "⚠️" : "❌";
  console.log(`${icon} ${label}`);
  if (!condition) optional ? warns++ : fails++;
}

ok("sidebar-global.js V3", fs.existsSync(menuFile) && fs.readFileSync(menuFile,"utf8").includes("eduperu-menu-v3"));

const pages = [
  ["Simulador de becas", "pages/simulador.html"],
  ["Calendario", "pages/calendario.html"],
  ["Seguimiento", "pages/seguimiento.html"],
  ["Documentos", "pages/documentos.html"],
  ["Recomendaciones", "pages/recomendaciones.html"],
  ["Mi perfil", "pages/perfil.html"],
  ["Notificaciones", "pages/notificaciones.html"],
  ["Servicios SOA", "pages/servicios-soa.html"],
  ["Explorar Perú", "pages/explorar-peru.html"],
  ["Arquitectura SOA", "pages/arquitectura.html"]
];

for (const [name, rel] of pages) {
  ok(`${name.padEnd(23)} ${rel}`, fs.existsSync(path.join(pub, rel)), true);
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) out.push(p);
  }
  return out;
}

let sidebars = 0;
let connected = 0;

for (const file of walk(pub)) {
  const txt = fs.readFileSync(file, "utf8");
  if (!/class\s*=\s*["'][^"']*\bsidebar-nav\b[^"']*["']/.test(txt)) continue;
  sidebars++;
  if (txt.includes("/js/sidebar-global.js")) connected++;
}

ok(`Páginas con sidebar conectadas: ${connected}/${sidebars}`, sidebars > 0 && connected === sidebars);

console.log("--------------------------------------------------");
console.log(`Fallos: ${fails} | Avisos: ${warns}`);

if (fails === 0) {
  console.log("RESULTADO: MENÚ V3 INSTALADO ✅");
  process.exit(0);
}

console.log("RESULTADO: REVISAR ❌");
process.exit(1);
