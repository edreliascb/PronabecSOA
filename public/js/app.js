/* =========================================================
   EDUPERÚ SOA
   APP GLOBAL
   MENÚ + SESIÓN + PERFIL + ADMIN
========================================================= */


/* =========================================================
   UTILIDADES DE INTERFAZ
========================================================= */

const EduPeruUI = {

    escaparHTML(valor) {

        return String(
            valor ?? ""
        )
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    },


    actualizarIconos() {

        if (
            window.lucide &&
            typeof window.lucide.createIcons === "function"
        ) {

            window.lucide.createIcons();

        }

    },


    mostrarToast(
        titulo,
        mensaje,
        tipo = "info"
    ) {

        let contenedor =
            document.querySelector(
                ".toast-container"
            );


        if (!contenedor) {

            contenedor =
                document.createElement(
                    "div"
                );

            contenedor.className =
                "toast-container";

            document.body.appendChild(
                contenedor
            );

        }


        const toast =
            document.createElement(
                "div"
            );


        toast.className =
            `toast ${tipo}`;


        const icono =
            tipo === "success"
                ? "check-circle"

                : tipo === "warning"
                    ? "triangle-alert"

                    : tipo === "error"
                        ? "circle-x"

                        : "info";


        toast.innerHTML =
            `
            <div class="toast-icon">

                <i data-lucide="${icono}"></i>

            </div>

            <div class="toast-content">

                <strong>
                    ${this.escaparHTML(titulo)}
                </strong>

                <span>
                    ${this.escaparHTML(mensaje)}
                </span>

            </div>
            `;


        contenedor.appendChild(
            toast
        );


        this.actualizarIconos();


        setTimeout(
            () => {

                toast.remove();

            },
            4000
        );

    },


    abrirModal({

        titulo,

        subtitulo = "",

        contenido = "",

        footer = ""

    }) {

        this.cerrarModal();


        const backdrop =
            document.createElement(
                "div"
            );


        backdrop.className =
            "modal-backdrop";


        backdrop.id =
            "globalModal";


        backdrop.innerHTML =
            `
            <div
                class="modal"
                role="dialog"
                aria-modal="true"
            >

                <div class="modal-header">

                    <div>

                        <h3>
                            ${this.escaparHTML(titulo)}
                        </h3>

                        ${
                            subtitulo
                                ? `
                                  <p>
                                      ${this.escaparHTML(subtitulo)}
                                  </p>
                                  `
                                : ""
                        }

                    </div>


                    <button
                        class="modal-close"
                        id="modalCloseButton"
                        type="button"
                    >

                        <i data-lucide="x"></i>

                    </button>

                </div>


                <div class="modal-body">
                    ${contenido}
                </div>


                ${
                    footer
                        ? `
                          <div class="modal-footer">
                              ${footer}
                          </div>
                          `
                        : ""
                }

            </div>
            `;


        document.body.appendChild(
            backdrop
        );


        document
            .getElementById(
                "modalCloseButton"
            )
            ?.addEventListener(
                "click",
                () => {

                    this.cerrarModal();

                }
            );


        backdrop.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    backdrop
                ) {

                    this.cerrarModal();

                }

            }
        );


        this.actualizarIconos();

    },


    cerrarModal() {

        document
            .getElementById(
                "globalModal"
            )
            ?.remove();

    },


    /* =====================================================
       FAVORITOS LOCAL
       Luego lo pasaremos a SQL Server
    ===================================================== */

    obtenerFavoritos() {

        try {

            const datos =
                JSON.parse(
                    localStorage.getItem(
                        "eduperu_favoritos"
                    ) ||
                    "[]"
                );


            return Array.isArray(
                datos
            )
                ? datos
                : [];

        } catch {

            return [];

        }

    },


    guardarFavoritos(
        favoritos
    ) {

        localStorage.setItem(

            "eduperu_favoritos",

            JSON.stringify(
                favoritos
            )

        );

    },


    generarIdRegistro(
        registro
    ) {

        return encodeURIComponent(
            JSON.stringify(
                registro
            )
        );

    },


    esFavorito(
        registro
    ) {

        const id =
            this.generarIdRegistro(
                registro
            );


        return this
            .obtenerFavoritos()
            .some(
                favorito =>
                    favorito.id ===
                    id
            );

    },


    alternarFavorito(
        registro
    ) {

        const favoritos =
            this.obtenerFavoritos();


        const id =
            this.generarIdRegistro(
                registro
            );


        const indice =
            favoritos.findIndex(
                favorito =>
                    favorito.id ===
                    id
            );


        if (
            indice >= 0
        ) {

            favoritos.splice(
                indice,
                1
            );


            this.guardarFavoritos(
                favoritos
            );


            return false;

        }


        favoritos.push({

            id,

            fechaGuardado:
                new Date()
                    .toISOString(),

            datos:
                registro

        });


        this.guardarFavoritos(
            favoritos
        );


        return true;

    }

};


window.EduPeruUI =
    EduPeruUI;


/* =========================================================
   CSS DE SESIÓN
========================================================= */

function cargarCSSSesion() {

    if (
        document.querySelector(
            'link[href="/css/session.css"]'
        )
    ) {

        return;

    }


    const link =
        document.createElement(
            "link"
        );


    link.rel =
        "stylesheet";


    link.href =
        "/css/session.css";


    document.head.appendChild(
        link
    );

}


/* =========================================================
   CARGAR AUTH CLIENT
========================================================= */

function cargarAuthClient() {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            if (
                window.EduPeruAuth
            ) {

                resolve();

                return;

            }


            const existente =
                document.querySelector(
                    'script[src="/js/auth-client.js"]'
                );


            if (existente) {

                existente.addEventListener(
                    "load",
                    resolve,
                    {
                        once:
                            true
                    }
                );


                existente.addEventListener(
                    "error",
                    reject,
                    {
                        once:
                            true
                    }
                );


                return;

            }


            const script =
                document.createElement(
                    "script"
                );


            script.src =
                "/js/auth-client.js";


            script.onload =
                resolve;


            script.onerror =
                reject;


            document.head.appendChild(
                script
            );

        }
    );

}


/* =========================================================
   MENÚ LATERAL
========================================================= */

function sincronizarMenuGlobal() {

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
        `

        <!-- ================================
             GENERAL
        ================================= -->

        <span class="nav-title">
            GENERAL
        </span>


        <a
            href="/"
            class="nav-item"
        >

            <i data-lucide="layout-dashboard"></i>

            <span>
                Dashboard
            </span>

        </a>


        <a
            href="/pages/oportunidades.html"
            class="nav-item"
        >

            <i data-lucide="search"></i>

            <span>
                Oportunidades
            </span>

        </a>


        <a
            href="/pages/explorar-peru.html"
            class="nav-item"
        >

            <i data-lucide="map"></i>

            <span>
                Explorar Perú
            </span>

        </a>


        <a
            href="/pages/carreras.html"
            class="nav-item"
        >

            <i data-lucide="graduation-cap"></i>

            <span>
                Carreras
            </span>

        </a>


        <a
            href="/pages/instituciones.html"
            class="nav-item"
        >

            <i data-lucide="building-2"></i>

            <span>
                Instituciones
            </span>

        </a>


        <a
            href="/pages/convenios.html"
            class="nav-item"
        >

            <i data-lucide="handshake"></i>

            <span>
                Convenios
            </span>

        </a>


        <a
            href="/pages/requisitos.html"
            class="nav-item"
        >

            <i data-lucide="files"></i>

            <span>
                Requisitos
            </span>

        </a>


        <!-- ================================
             MI ESPACIO
        ================================= -->

        <span class="nav-title">
            MI ESPACIO
        </span>


        ${
            autenticado
                ? `

                  <a
                      href="/pages/perfil.html"
                      class="nav-item"
                  >

                      <i data-lucide="user-round"></i>

                      <span>
                          Mi perfil
                      </span>

                  </a>

                  `
                : ""
        }


        <a
            href="/pages/favoritos.html"
            class="nav-item"
        >

            <i data-lucide="heart"></i>

            <span>
                Favoritos
            </span>

        </a>


        <a
            href="/pages/alertas.html"
            class="nav-item"
        >

            <i data-lucide="bell"></i>

            <span>
                Alertas
            </span>

        </a>


        <!-- ================================
             INFORMACIÓN
        ================================= -->

        <span class="nav-title">
            INFORMACIÓN
        </span>


        <a
            href="/pages/arquitectura.html"
            class="nav-item"
        >

            <i data-lucide="network"></i>

            <span>
                Arquitectura SOA
            </span>

        </a>


        <a
            href="/pages/estadisticas.html"
            class="nav-item"
        >

            <i data-lucide="chart-no-axes-combined"></i>

            <span>
                Estadísticas
            </span>

        </a>


        <a
            href="/pages/estado.html"
            class="nav-item"
        >

            <i data-lucide="activity"></i>

            <span>
                Estado del sistema
            </span>

        </a>


        <!-- ================================
             SISTEMA
        ================================= -->

        <span class="nav-title">
            SISTEMA
        </span>


        <a
            href="/api-docs"
            class="nav-item"
        >

            <i data-lucide="book-open-code"></i>

            <span>
                API Docs
            </span>

        </a>


        ${
            esAdmin
                ? `

                  <a
                      href="/pages/admin.html"
                      class="nav-item"
                  >

                      <i data-lucide="shield-check"></i>

                      <span>
                          Administración
                      </span>

                  </a>

                  `
                : ""
        }

        `;


    marcarPaginaActual();


    EduPeruUI
        .actualizarIconos();

}


/* =========================================================
   SESIÓN EN BARRA SUPERIOR
========================================================= */

function renderizarSesionGlobal() {

    const topbarActions =
        document.querySelector(
            ".topbar-actions"
        );


    if (!topbarActions) {

        return;

    }


    document
        .getElementById(
            "globalSessionArea"
        )
        ?.remove();


    const usuario =
        window.EduPeruAuth
            ?.obtenerUsuarioLocal();


    const contenedor =
        document.createElement(
            "div"
        );


    contenedor.id =
        "globalSessionArea";


    contenedor.className =
        "session-area";


    /* =====================================================
       NO LOGUEADO
    ===================================================== */

    if (!usuario) {

        contenedor.innerHTML =
            `

            <a
                href="/pages/login.html"
                class="session-login-button"
            >

                <i data-lucide="log-in"></i>

                <span>
                    Iniciar sesión
                </span>

            </a>

            `;


        topbarActions.appendChild(
            contenedor
        );


        EduPeruUI
            .actualizarIconos();


        return;

    }


    /* =====================================================
       LOGUEADO
    ===================================================== */

    const iniciales =
        obtenerInicialesUsuario(
            usuario
        );


    const esAdmin =
        String(
            usuario.rol ||
            ""
        )
            .toUpperCase() ===
        "ADMINISTRADOR";


    contenedor.innerHTML =
        `

        <div class="session-user">

            <button
                id="sessionUserButton"
                class="session-user-button"
                type="button"
            >

                <span class="session-avatar">

                    ${EduPeruUI.escaparHTML(
                        iniciales
                    )}

                </span>


                <span class="session-user-info">

                    <strong>

                        ${EduPeruUI.escaparHTML(
                            obtenerNombreUsuario(
                                usuario
                            )
                        )}

                    </strong>

                    <span>

                        ${EduPeruUI.escaparHTML(
                            usuario.rol ||
                            "USUARIO"
                        )}

                    </span>

                </span>


                <i
                    data-lucide="chevron-down"
                    class="session-chevron"
                ></i>

            </button>


            <div
                id="sessionDropdown"
                class="session-dropdown"
            >

                <div class="session-dropdown-header">

                    <strong>

                        ${EduPeruUI.escaparHTML(
                            obtenerNombreUsuario(
                                usuario
                            )
                        )}

                    </strong>


                    <span>

                        ${EduPeruUI.escaparHTML(
                            usuario.email ||
                            ""
                        )}

                    </span>


                    <span class="session-role">

                        ${EduPeruUI.escaparHTML(
                            usuario.rol ||
                            "USUARIO"
                        )}

                    </span>

                </div>


                <!-- MI PERFIL -->

                <a
                    href="/pages/perfil.html"
                    class="session-dropdown-link"
                >

                    <i data-lucide="user-round"></i>

                    Mi perfil

                </a>


                ${
                    esAdmin
                        ? `

                          <a
                              href="/pages/admin.html"
                              class="session-dropdown-link"
                          >

                              <i data-lucide="shield-check"></i>

                              Panel administrativo

                          </a>

                          `
                        : ""
                }


                <button
                    id="sessionLogoutButton"
                    class="session-dropdown-link danger"
                    type="button"
                >

                    <i data-lucide="log-out"></i>

                    Cerrar sesión

                </button>

            </div>

        </div>

        `;


    topbarActions.appendChild(
        contenedor
    );


    configurarEventosSesion();


    EduPeruUI
        .actualizarIconos();

}


/* =========================================================
   EVENTOS DE SESIÓN
========================================================= */

function configurarEventosSesion() {

    const boton =
        document.getElementById(
            "sessionUserButton"
        );


    const dropdown =
        document.getElementById(
            "sessionDropdown"
        );


    boton
        ?.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                dropdown
                    ?.classList
                    .toggle(
                        "open"
                    );

            }
        );


    document
        .getElementById(
            "sessionLogoutButton"
        )
        ?.addEventListener(
            "click",
            () => {

                window.EduPeruAuth
                    ?.cerrarSesion();


                window.location.href =
                    "/pages/login.html";

            }
        );


    document.addEventListener(
        "click",
        event => {

            const sessionUser =
                document.querySelector(
                    ".session-user"
                );


            if (
                sessionUser &&
                !sessionUser.contains(
                    event.target
                )
            ) {

                dropdown
                    ?.classList
                    .remove(
                        "open"
                    );

            }

        }
    );

}


/* =========================================================
   SINCRONIZAR SESIÓN CON BACKEND
========================================================= */

async function sincronizarSesionConServidor() {

    if (
        !window.EduPeruAuth
            ?.estaAutenticado()
    ) {

        return;

    }


    const usuario =
        await window.EduPeruAuth
            .validarSesion();


    if (!usuario) {

        sincronizarMenuGlobal();

        renderizarSesionGlobal();

        return;

    }


    sincronizarMenuGlobal();

    renderizarSesionGlobal();

}


/* =========================================================
   PROTEGER ADMIN
========================================================= */

async function protegerPaginaAdministracion() {

    if (
        normalizarRutaMenu(
            window.location.pathname
        ) !==
        "/pages/admin.html"
    ) {

        return true;

    }


    const bloqueo =
        crearPantallaValidacionAdmin();


    if (
        !window.EduPeruAuth
            ?.estaAutenticado()
    ) {

        window.location.href =
            "/pages/login.html";

        return false;

    }


    const autorizado =
        await window.EduPeruAuth
            .validarAdministrador();


    if (!autorizado) {

        bloqueo?.remove();


        alert(
            "No tienes permisos para acceder al panel administrativo."
        );


        window.location.href =
            "/";

        return false;

    }


    bloqueo?.remove();


    return true;

}


/* =========================================================
   PANTALLA VALIDANDO ADMIN
========================================================= */

function crearPantallaValidacionAdmin() {

    const existente =
        document.querySelector(
            ".admin-access-loading"
        );


    if (existente) {

        return existente;

    }


    const elemento =
        document.createElement(
            "div"
        );


    elemento.className =
        "admin-access-loading";


    elemento.innerHTML =
        `

        <div class="admin-access-card">

            <div class="admin-access-spinner"></div>

            <strong>
                Validando acceso
            </strong>

            <span>
                Comprobando permisos administrativos...
            </span>

        </div>

        `;


    document.body.appendChild(
        elemento
    );


    return elemento;

}


/* =========================================================
   NOMBRE USUARIO
========================================================= */

function obtenerNombreUsuario(
    usuario
) {

    const nombre =
        `${usuario?.nombres || ""} ${usuario?.apellidos || ""}`
            .trim();


    return (
        nombre ||
        usuario?.email ||
        "Usuario"
    );

}


/* =========================================================
   INICIALES
========================================================= */

function obtenerInicialesUsuario(
    usuario
) {

    const partes = [

        usuario?.nombres,

        usuario?.apellidos

    ]
        .filter(
            Boolean
        );


    const iniciales =
        partes
            .map(
                parte =>
                    String(
                        parte
                    )
                        .trim()
                        .charAt(0)
                        .toUpperCase()
            )
            .join("")
            .slice(
                0,
                2
            );


    return (
        iniciales ||
        "EP"
    );

}


/* =========================================================
   MARCAR PÁGINA ACTUAL
========================================================= */

function marcarPaginaActual() {

    const navegacion =
        document.querySelector(
            ".sidebar-nav"
        );


    if (!navegacion) {

        return;

    }


    const rutaActual =
        normalizarRutaMenu(
            window.location.pathname
        );


    navegacion
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            enlace => {

                enlace
                    .classList
                    .remove(
                        "active"
                    );


                const rutaEnlace =
                    normalizarRutaMenu(

                        new URL(
                            enlace.href,
                            window.location.origin
                        )
                            .pathname

                    );


                if (
                    rutaEnlace ===
                    rutaActual
                ) {

                    enlace
                        .classList
                        .add(
                            "active"
                        );

                }

            }
        );

}


/* =========================================================
   NORMALIZAR RUTA
========================================================= */

function normalizarRutaMenu(
    ruta
) {

    let resultado =
        String(
            ruta ||
            "/"
        )
            .toLowerCase()
            .trim();


    if (
        resultado ===
        "/index.html"
    ) {

        resultado =
            "/";

    }


    if (
        resultado.length > 1 &&
        resultado.endsWith("/")
    ) {

        resultado =
            resultado.slice(
                0,
                -1
            );

    }


    return resultado;

}


/* =========================================================
   SIDEBAR MÓVIL
========================================================= */

function inicializarSidebar() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );


    const menuButton =
        document.getElementById(
            "menuButton"
        );


    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    menuButton
        ?.addEventListener(
            "click",
            () => {

                sidebar
                    ?.classList
                    .toggle(
                        "open"
                    );


                overlay
                    ?.classList
                    .toggle(
                        "show"
                    );

            }
        );


    overlay
        ?.addEventListener(
            "click",
            () => {

                sidebar
                    ?.classList
                    .remove(
                        "open"
                    );


                overlay
                    ?.classList
                    .remove(
                        "show"
                    );

            }
        );

}


/* =========================================================
   ATAJOS
========================================================= */

function inicializarAtajos() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.ctrlKey &&
                event.key
                    .toLowerCase() ===
                "k"
            ) {

                event.preventDefault();


                document
                    .getElementById(
                        "globalSearch"
                    )
                    ?.focus();

            }


            if (
                event.key ===
                "Escape"
            ) {

                EduPeruUI
                    .cerrarModal();


                document
                    .getElementById(
                        "sessionDropdown"
                    )
                    ?.classList
                    .remove(
                        "open"
                    );

            }

        }
    );

}


/* =========================================================
   EVENTO SESIÓN ACTUALIZADA
========================================================= */

document.addEventListener(
    "eduperu:sesion-actualizada",
    () => {

        sincronizarMenuGlobal();

        renderizarSesionGlobal();

    }
);


/* =========================================================
   CAMBIOS ENTRE PESTAÑAS
========================================================= */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key ===
                "eduperu_token" ||
            event.key ===
                "eduperu_usuario"
        ) {

            sincronizarMenuGlobal();

            renderizarSesionGlobal();

        }

    }
);


/* =========================================================
   INICIAR APP
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        cargarCSSSesion();


        try {

            await cargarAuthClient();

        } catch (error) {

            console.error(
                "No se pudo cargar auth-client.js:",
                error
            );

        }


        /* Render inicial */

        sincronizarMenuGlobal();

        renderizarSesionGlobal();


        inicializarSidebar();

        inicializarAtajos();


        /* Proteger administrador */

        const accesoCorrecto =
            await protegerPaginaAdministracion();


        if (!accesoCorrecto) {

            return;

        }


        /* Validar JWT contra backend */

        await sincronizarSesionConServidor();


        EduPeruUI
            .actualizarIconos();

    }
);