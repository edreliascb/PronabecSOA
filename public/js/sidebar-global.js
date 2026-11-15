(() => {
  "use strict";

  const VERSION = "eduperu-menu-v3";
  let applying = false;
  let observedNav = null;
  let navObserver = null;

  const sections = [
    {
      title: "GENERAL",
      items: [
        ["layout-dashboard", "Dashboard", "/"],
        ["search", "Oportunidades", "/pages/oportunidades.html"],
        ["map", "Explorar Perú", "/pages/explorar-peru.html"],
        ["graduation-cap", "Carreras", "/pages/carreras.html"],
        ["building-2", "Instituciones", "/pages/instituciones.html"],
        ["handshake", "Convenios", "/pages/convenios.html"],
        ["files", "Requisitos", "/pages/requisitos.html"]
      ]
    },
    {
      title: "HERRAMIENTAS",
      items: [
        ["clipboard-check", "Simulador de becas", "/pages/simulador.html"],
        ["columns-3", "Comparador", "/pages/oportunidades.html#comparador"],
        ["calendar-days", "Calendario", "/pages/calendario.html"],
        ["route", "Seguimiento", "/pages/seguimiento.html"],
        ["file-check-2", "Documentos", "/pages/documentos.html"],
        ["sparkles", "Recomendaciones", "/pages/recomendaciones.html"]
      ]
    },
    {
      title: "MI ESPACIO",
      items: [
        ["user-round", "Mi perfil", "/pages/perfil.html"],
        ["heart", "Favoritos", "/pages/favoritos.html"],
        ["bell", "Alertas", "/pages/alertas.html"],
        ["inbox", "Notificaciones", "/pages/notificaciones.html"]
      ]
    },
    {
      title: "INFORMACIÓN",
      items: [
        ["network", "Arquitectura SOA", "/pages/arquitectura.html"],
        ["boxes", "Servicios SOA", "/pages/servicios-soa.html"],
        ["chart-no-axes-combined", "Estadísticas", "/pages/estadisticas.html"],
        ["activity", "Estado del sistema", "/pages/estado.html"]
      ]
    },
    {
      title: "SISTEMA",
      items: [
        ["book-open-code", "API Docs", "/api-docs", true],
        ["shield-check", "Administración", "/pages/admin.html", false, "admin"]
      ]
    }
  ];

  function normalize(value) {
    try {
      const u = new URL(value || "/", window.location.origin);
      return u.pathname.replace(/\/+$/, "") || "/";
    } catch {
      return String(value || "/").split("#")[0].split("?")[0].replace(/\/+$/, "") || "/";
    }
  }

  function isAdmin() {
    try {
      const user =
        window.EduPeruAuth?.obtenerUsuarioLocal?.() ||
        JSON.parse(localStorage.getItem("eduperu_usuario") || "null") ||
        JSON.parse(localStorage.getItem("usuario") || "null");

      return String(user?.rol || user?.role || "").toUpperCase() === "ADMINISTRADOR";
    } catch {
      return false;
    }
  }

  function itemHtml(item) {
    const [icon, label, href, external, rule] = item;

    if (rule === "admin" && !isAdmin()) {
      return "";
    }

    const current = normalize(window.location.pathname);
    const target = normalize(href);
    const active = current === target || (target === "/" && current === "/")
      ? " active"
      : "";

    const attrs = external
      ? ' target="_blank" rel="noopener noreferrer"'
      : "";

    return `
      <a href="${href}" class="nav-item${active}"${attrs}>
        <i data-lucide="${icon}"></i>
        <span>${label}</span>
      </a>
    `;
  }

  function desiredHtml() {
    return `
      <span data-eduperu-menu-anchor="${VERSION}" hidden></span>

      ${sections.map(section => `
        <span class="nav-title">${section.title}</span>
        ${section.items.map(itemHtml).join("")}
      `).join("")}
    `;
  }

  function hasOurMenu(nav) {
    return Boolean(
      nav &&
      nav.querySelector(`[data-eduperu-menu-anchor="${VERSION}"]`) &&
      [...nav.querySelectorAll(".nav-title")].some(el => el.textContent.trim() === "HERRAMIENTAS") &&
      [...nav.querySelectorAll(".nav-item span")].some(el => el.textContent.trim() === "Notificaciones") &&
      [...nav.querySelectorAll(".nav-item span")].some(el => el.textContent.trim() === "Servicios SOA")
    );
  }

  function refreshIcons() {
    try {
      if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
      } else if (window.EduPeruUI && typeof window.EduPeruUI.actualizarIconos === "function") {
        window.EduPeruUI.actualizarIconos();
      }
    } catch {}
  }

  function updateFooter() {
    const footer = document.querySelector(".sidebar-status");
    if (!footer) return;

    const small = footer.querySelector("small");
    if (small) small.textContent = "EduPerú SOA · Integrado";
  }

  function applyMenu(force = false) {
    if (applying) return;

    const nav = document.querySelector(".sidebar-nav");
    if (!nav) return;

    if (!force && hasOurMenu(nav)) {
      attachObserver(nav);
      updateFooter();
      return;
    }

    applying = true;
    try {
      nav.innerHTML = desiredHtml();
      nav.setAttribute("data-menu-source", VERSION);
      updateFooter();
      refreshIcons();
      attachObserver(nav);
    } finally {
      applying = false;
    }
  }

  function attachObserver(nav) {
    if (!nav || observedNav === nav) return;

    if (navObserver) {
      try { navObserver.disconnect(); } catch {}
    }

    observedNav = nav;

    navObserver = new MutationObserver(() => {
      if (applying) return;

      if (!hasOurMenu(nav)) {
        setTimeout(() => applyMenu(true), 0);
      }
    });

    navObserver.observe(nav, {
      childList: true,
      subtree: true
    });
  }

  function boot() {
    applyMenu(true);

    // Otros scripts del proyecto pueden reescribir el menú después.
    // Estas comprobaciones restauran V3 sin depender del orden de carga.
    [50, 250, 750, 1500, 3000].forEach(ms => {
      setTimeout(() => applyMenu(false), ms);
    });

    // Protección continua y muy ligera.
    setInterval(() => {
      const nav = document.querySelector(".sidebar-nav");
      if (!nav || !hasOurMenu(nav)) {
        applyMenu(true);
      } else {
        attachObserver(nav);
      }
    }, 2000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  window.EduPeruMenuV3 = {
    version: VERSION,
    restaurar: () => applyMenu(true),
    verificar: () => hasOurMenu(document.querySelector(".sidebar-nav"))
  };
})();
