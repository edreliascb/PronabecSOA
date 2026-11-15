const fs = require("fs");
const path = require("path");

const root = path.join(process.cwd(), "public");
const required = [
  ["Dashboard", "index.html"],
  ["Oportunidades", "pages/oportunidades.html"],
  ["Explorar Perú", "pages/explorar-peru.html"],
  ["Carreras", "pages/carreras.html"],
  ["Instituciones", "pages/instituciones.html"],
  ["Convenios", "pages/convenios.html"],
  ["Requisitos", "pages/requisitos.html"],
  ["Simulador", "pages/simulador.html"],
  ["Calendario", "pages/calendario.html"],
  ["Seguimiento", "pages/seguimiento.html"],
  ["Documentos", "pages/documentos.html"],
  ["Recomendaciones", "pages/recomendaciones.html"],
  ["Mi perfil", "pages/perfil.html"],
  ["Favoritos", "pages/favoritos.html"],
  ["Alertas", "pages/alertas.html"],
  ["Notificaciones", "pages/notificaciones.html"],
  ["Arquitectura SOA", "pages/arquitectura.html"],
  ["Servicios SOA", "pages/servicios-soa.html"],
  ["Estadísticas", "pages/estadisticas.html"],
  ["Estado del sistema", "pages/estado.html"]
];

console.log("");
console.log("==============================================");
console.log(" EDUPERÚ - VERIFICACIÓN MENÚ GLOBAL");
console.log("==============================================");

let missing = 0;

for (const [label, rel] of required) {
  const ok = fs.existsSync(path.join(root, rel));
  console.log(`${ok ? "✅" : "❌"} ${label.padEnd(22)} ${rel}`);
  if (!ok) missing++;
}

const sidebar = path.join(root, "js", "sidebar-global.js");
console.log(`${fs.existsSync(sidebar) ? "✅" : "❌"} ${"Sidebar global".padEnd(22)} js/sidebar-global.js`);
if (!fs.existsSync(sidebar)) missing++;

console.log("----------------------------------------------");
if (missing === 0) {
  console.log("RESULTADO: MENÚ COMPLETO ✅");
  process.exit(0);
} else {
  console.log(`RESULTADO: faltan ${missing} archivo(s).`);
  console.log("El menú se instaló, pero esos enlaces requieren recuperar sus páginas.");
  process.exit(1);
}
