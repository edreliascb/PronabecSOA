const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "public", "js", "app.js");

if (!fs.existsSync(file)) {
  console.error("❌ No existe public/js/app.js");
  process.exit(1);
}

let source = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");

const startMarker = "function sincronizarMenuGlobal() {";
const endMarker = "/* =========================================================\n   SESIÓN EN BARRA SUPERIOR";

const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);

if (start < 0 || end < 0) {
  console.error("❌ No se encontró la función sincronizarMenuGlobal() o su sección final.");
  process.exit(1);
}

const replacement = `function sincronizarMenuGlobal() {

    const navegacion =
        document.querySelector(
            ".sidebar-nav"
        );


    if (!navegacion) {

        return;

    }


    const usuario =
        window.EduPeruAuth
            ?.obtenerUsuarioLocal();


    const autenticado =
        Boolean(
            usuario
        );


    const esAdmin =
        String(
            usuario?.rol ||
            ""
        )
            .toUpperCase() ===
        "ADMINISTRADOR";


    navegacion.innerHTML =
        \`

        <!-- ================================
             GENERAL
        ================================= -->

        <span class="nav-title">
            GENERAL
        </span>

        <a href="/" class="nav-item">
            <i data-lucide="layout-dashboard"></i>
            <span>Dashboard</span>
        </a>

        <a href="/pages/oportunidades.html" class="nav-item">
            <i data-lucide="search"></i>
            <span>Oportunidades</span>
        </a>

        <a href="/pages/explorar-peru.html" class="nav-item">
            <i data-lucide="map"></i>
            <span>Explorar Perú</span>
        </a>

        <a href="/pages/carreras.html" class="nav-item">
            <i data-lucide="graduation-cap"></i>
            <span>Carreras</span>
        </a>

        <a href="/pages/instituciones.html" class="nav-item">
            <i data-lucide="building-2"></i>
            <span>Instituciones</span>
        </a>

        <a href="/pages/convenios.html" class="nav-item">
            <i data-lucide="handshake"></i>
            <span>Convenios</span>
        </a>

        <a href="/pages/requisitos.html" class="nav-item">
            <i data-lucide="files"></i>
            <span>Requisitos</span>
        </a>


        <!-- ================================
             HERRAMIENTAS
        ================================= -->

        <span class="nav-title">
            HERRAMIENTAS
        </span>

        <a href="/pages/simulador.html" class="nav-item">
            <i data-lucide="clipboard-check"></i>
            <span>Simulador de becas</span>
        </a>

        <a href="/pages/oportunidades.html" class="nav-item">
            <i data-lucide="columns-3"></i>
            <span>Comparador</span>
        </a>

        <a href="/pages/calendario.html" class="nav-item">
            <i data-lucide="calendar-days"></i>
            <span>Calendario</span>
        </a>

        <a href="/pages/seguimiento.html" class="nav-item">
            <i data-lucide="route"></i>
            <span>Seguimiento</span>
        </a>

        <a href="/pages/documentos.html" class="nav-item">
            <i data-lucide="file-check-2"></i>
            <span>Documentos</span>
        </a>

        <a href="/pages/recomendaciones.html" class="nav-item">
            <i data-lucide="sparkles"></i>
            <span>Recomendaciones</span>
        </a>


        <!-- ================================
             MI ESPACIO
        ================================= -->

        <span class="nav-title">
            MI ESPACIO
        </span>

        \${
            autenticado
                ? \`
                  <a href="/pages/perfil.html" class="nav-item">
                      <i data-lucide="user-round"></i>
                      <span>Mi perfil</span>
                  </a>
                  \`
                : ""
        }

        <a href="/pages/favoritos.html" class="nav-item">
            <i data-lucide="heart"></i>
            <span>Favoritos</span>
        </a>

        <a href="/pages/alertas.html" class="nav-item">
            <i data-lucide="bell"></i>
            <span>Alertas</span>
        </a>

        <a href="/pages/notificaciones.html" class="nav-item">
            <i data-lucide="inbox"></i>
            <span>Notificaciones</span>
        </a>


        <!-- ================================
             INFORMACIÓN
        ================================= -->

        <span class="nav-title">
            INFORMACIÓN
        </span>

        <a href="/pages/arquitectura.html" class="nav-item">
            <i data-lucide="network"></i>
            <span>Arquitectura SOA</span>
        </a>

        <a href="/pages/servicios-soa.html" class="nav-item">
            <i data-lucide="boxes"></i>
            <span>Servicios SOA</span>
        </a>

        <a href="/pages/estadisticas.html" class="nav-item">
            <i data-lucide="chart-no-axes-combined"></i>
            <span>Estadísticas</span>
        </a>

        <a href="/pages/estado.html" class="nav-item">
            <i data-lucide="activity"></i>
            <span>Estado del sistema</span>
        </a>


        <!-- ================================
             SISTEMA
        ================================= -->

        <span class="nav-title">
            SISTEMA
        </span>

        <a href="/api-docs" class="nav-item" target="_blank" rel="noopener noreferrer">
            <i data-lucide="book-open-code"></i>
            <span>API Docs</span>
        </a>

        \${
            esAdmin
                ? \`
                  <a href="/pages/admin.html" class="nav-item">
                      <i data-lucide="shield-check"></i>
                      <span>Administración</span>
                  </a>
                  \`
                : ""
        }

        \`;


    marcarPaginaActual();


    EduPeruUI
        .actualizarIconos();

}


`;

source = source.slice(0, start) + replacement + source.slice(end);

fs.writeFileSync(file, source, "utf8");

const verify = fs.readFileSync(file, "utf8");

const checks = [
  ["HERRAMIENTAS", verify.includes("HERRAMIENTAS")],
  ["Simulador de becas", verify.includes("Simulador de becas")],
  ["Calendario", verify.includes("/pages/calendario.html")],
  ["Seguimiento", verify.includes("/pages/seguimiento.html")],
  ["Documentos", verify.includes("/pages/documentos.html")],
  ["Recomendaciones", verify.includes("/pages/recomendaciones.html")],
  ["Notificaciones", verify.includes("/pages/notificaciones.html")],
  ["Servicios SOA", verify.includes("/pages/servicios-soa.html")]
];

console.log("");
console.log("==============================================");
console.log(" EDUPERÚ - FIX MENÚ EN app.js");
console.log("==============================================");

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? "✅" : "❌"} ${name}`);
  if (!ok) failed++;
}

if (failed) {
  console.error(`\n❌ Fallaron ${failed} comprobaciones.`);
  process.exit(1);
}

console.log("");
console.log("✅ sincronizarMenuGlobal() actualizado correctamente.");
