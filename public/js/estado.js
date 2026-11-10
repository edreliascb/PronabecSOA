/* =========================================================
   EDUPERÚ SOA
   ESTADO DEL SISTEMA
   COMPATIBLE CON HEALTHCHECKSERVICE v1.9.0 / 40 SERVICIOS
========================================================= */


const estadoState = {

    health:
        null,

    servicios:
        [],

    filtrados:
        [],

    inventario: {

        total:
            0,

        implementados:
            0,

        planificados:
            0

    },

    resumen: {

        totalMonitoreados:
            0,

        operativos:
            0,

        noDisponibles:
            0,

        errores:
            0,

        apiPronabec:
            0,

        portalNacional:
            0,

        portalPronabec:
            0,

        locales:
            0,

        otros:
            0

    }

};


/* =========================================================
   INICIAR
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        configurarEventosEstado();

        prepararInterfazEstado();

        cargarEstadoSistema();

    }
);


/* =========================================================
   EVENTOS
========================================================= */

function configurarEventosEstado() {

    document
        .getElementById(
            "refreshButton"
        )
        ?.addEventListener(
            "click",
            cargarEstadoSistema
        );


    document
        .getElementById(
            "checkServicesButton"
        )
        ?.addEventListener(
            "click",
            cargarEstadoSistema
        );


    document
        .getElementById(
            "servicesSearch"
        )
        ?.addEventListener(
            "input",
            filtrarServiciosEstado
        );


    document
        .getElementById(
            "statusFilter"
        )
        ?.addEventListener(
            "change",
            filtrarServiciosEstado
        );


    document
        .getElementById(
            "globalSearch"
        )
        ?.addEventListener(
            "input",
            event => {

                const buscador =
                    document.getElementById(
                        "servicesSearch"
                    );


                if (
                    buscador
                ) {

                    buscador.value =
                        event.target.value;

                }


                filtrarServiciosEstado();

            }
        );

}


/* =========================================================
   PREPARAR INTERFAZ
========================================================= */

function prepararInterfazEstado() {

    cambiarEtiquetaIndicadorEstado(
        "servicesOperational",
        "Operativos"
    );


    cambiarEtiquetaIndicadorEstado(
        "servicesApi",
        "API PRONABEC"
    );


    cambiarEtiquetaIndicadorEstado(
        "servicesBackup",
        "Portales oficiales"
    );


    cambiarEtiquetaIndicadorEstado(
        "servicesError",
        "Incidencias"
    );


    const filtro =
        document.getElementById(
            "statusFilter"
        );


    if (
        filtro
    ) {

        filtro.innerHTML =
            `
            <option value="">
                Todos los estados
            </option>

            <option value="api">
                API PRONABEC
            </option>

            <option value="portal">
                Portal oficial
            </option>

            <option value="local">
                Local / operativo
            </option>

            <option value="unavailable">
                No disponible
            </option>

            <option value="error">
                Error
            </option>
            `;

    }

}


/* =========================================================
   CARGAR HEALTH CHECK
========================================================= */

async function cargarEstadoSistema() {

    mostrarEstadoCargando();


    try {

        const respuesta =
            await EduPeruAPI
                .obtenerHealth();


        const health =
            respuesta?.resultado ||
            respuesta ||
            {};


        estadoState.health =
            health;


        /*
           HealthCheckService v1.9.0:
           - serviciosMonitoreados
           - resumenMonitoreo
           - inventarioSOA

           Se mantienen fallbacks para no romper una respuesta
           anterior si todavía existe en caché del navegador.
        */

        estadoState.servicios =
            Array.isArray(
                health.serviciosMonitoreados
            )
                ? health.serviciosMonitoreados

                : Array.isArray(
                    health.servicios
                )
                    ? health.servicios

                    : [];


        estadoState.filtrados = [
            ...estadoState.servicios
        ];


        estadoState.inventario =
            obtenerInventarioEstado(
                health
            );


        estadoState.resumen =
            obtenerResumenMonitoreoEstado(
                health,
                estadoState.servicios
            );


        actualizarResumenEstado();

        actualizarFuenteExterna();

        filtrarServiciosEstado();

        actualizarHoraEstado();


        EduPeruUI
            ?.actualizarIconos?.();


    } catch (error) {

        console.error(
            "Error cargando HealthCheckService:",
            error
        );


        estadoState.health =
            null;


        estadoState.servicios =
            [];


        estadoState.filtrados =
            [];


        mostrarErrorEstado(
            error.message ||
            "No fue posible consultar HealthCheckService."
        );

    }

}


/* =========================================================
   INVENTARIO SOA
========================================================= */

function obtenerInventarioEstado(
    health
) {

    const inventario =
        health?.inventarioSOA ||
        health?.inventario ||
        {};


    const total =
        numeroEstado(
            inventario.totalServicios ??
            inventario.total ??
            inventario.registrados ??
            inventario.totalRegistrados
        );


    const implementados =
        numeroEstado(
            inventario.implementados ??
            inventario.totalImplementados ??
            total
        );


    const planificados =
        numeroEstado(
            inventario.planificados ??
            inventario.totalPlanificados
        );


    return {

        total,

        implementados,

        planificados

    };

}


/* =========================================================
   RESUMEN MONITOREO
========================================================= */

function obtenerResumenMonitoreoEstado(
    health,
    servicios
) {

    const nuevo =
        health?.resumenMonitoreo ||
        {};


    const antiguo =
        health?.resumen ||
        {};


    const totalMonitoreados =
        numeroEstado(
            nuevo.totalServiciosMonitoreados ??
            antiguo.totalServicios ??
            servicios.length
        );


    const operativos =
        numeroEstado(
            nuevo.operativos ??
            antiguo.operativos ??
            servicios.filter(
                servicio =>
                    normalizarEstado(
                        servicio?.estado
                    ) ===
                    "operativo"
            ).length
        );


    const noDisponibles =
        numeroEstado(
            nuevo.noDisponibles ??
            servicios.filter(
                servicio =>
                    normalizarEstado(
                        servicio?.estado
                    )
                    .includes(
                        "no disponible"
                    ) ||
                    normalizarEstado(
                        servicio?.modo
                    )
                    .includes(
                        "no disponible"
                    )
            ).length
        );


    const errores =
        numeroEstado(
            nuevo.errores ??
            antiguo.errores ??
            servicios.filter(
                servicio =>
                    normalizarEstado(
                        servicio?.estado
                    ) ===
                    "error"
            ).length
        );


    const apiPronabec =
        numeroEstado(
            nuevo.apiPronabec ??
            antiguo.api ??
            contarModoEstado(
                servicios,
                "API_PRONABEC",
                "API"
            )
        );


    const portalNacional =
        numeroEstado(
            nuevo.portalNacional ??
            contarModoEstado(
                servicios,
                "PORTAL_NACIONAL"
            )
        );


    const portalPronabec =
        numeroEstado(
            nuevo.portalPronabec ??
            contarModoEstado(
                servicios,
                "PORTAL_PRONABEC"
            )
        );


    const locales =
        numeroEstado(
            nuevo.locales ??
            antiguo.locales ??
            contarModoEstado(
                servicios,
                "LOCAL"
            )
        );


    const otros =
        numeroEstado(
            nuevo.otros ??
            antiguo.otros ??
            contarModoEstado(
                servicios,
                "OPERATIVO"
            )
        );


    return {

        totalMonitoreados,

        operativos,

        noDisponibles,

        errores,

        apiPronabec,

        portalNacional,

        portalPronabec,

        locales,

        otros

    };

}


/* =========================================================
   RESUMEN VISUAL
========================================================= */

function actualizarResumenEstado() {

    const health =
        estadoState.health ||
        {};


    const resumen =
        estadoState.resumen;


    const inventario =
        estadoState.inventario;


    const portalesOficiales =
        resumen.portalNacional +
        resumen.portalPronabec;


    const incidencias =
        resumen.noDisponibles +
        resumen.errores;


    colocarEstado(
        "servicesOperational",
        resumen.operativos
    );


    colocarEstado(
        "servicesApi",
        resumen.apiPronabec
    );


    colocarEstado(
        "servicesBackup",
        portalesOficiales
    );


    colocarEstado(
        "servicesError",
        incidencias
    );


    /*
       El indicador grande representa el inventario empresarial
       implementado. La lista inferior representa únicamente los
       servicios críticos que HealthCheckService prueba en vivo.
    */
    const totalInventario =
        inventario.total ||
        inventario.implementados ||
        resumen.totalMonitoreados;


    const implementados =
        inventario.implementados ||
        totalInventario;


    colocarEstado(
        "systemAvailability",
        `${implementados}/${totalInventario}`
    );


    const hero =
        document.getElementById(
            "systemHero"
        );


    if (
        !hero
    ) {

        return;

    }


    hero.className =
        "system-hero";


    const estado =
        String(
            health.estado ||
            ""
        )
        .toUpperCase();


    if (
        estado ===
        "OPERATIVO"
    ) {

        hero.classList.add(
            "healthy"
        );


        colocarEstado(
            "systemMainStatus",
            "Sistema operativo"
        );


        colocarEstado(
            "systemMainDescription",
            crearDescripcionInventarioEstado(
                `${resumen.operativos} de ${resumen.totalMonitoreados} servicios críticos monitoreados respondieron correctamente.`
            )
        );


        colocarEstado(
            "footerStatus",
            "Sistema operativo"
        );


        return;

    }


    if (
        estado ===
        "OPERATIVO_PARCIAL"
    ) {

        hero.classList.add(
            "degraded"
        );


        colocarEstado(
            "systemMainStatus",
            "Sistema operativo con disponibilidad parcial"
        );


        colocarEstado(
            "systemMainDescription",
            crearDescripcionInventarioEstado(
                `${resumen.operativos} de ${resumen.totalMonitoreados} servicios críticos están operativos; ${resumen.noDisponibles} fuente(s) oficial(es) no están disponibles actualmente.`
            )
        );


        colocarEstado(
            "footerStatus",
            "Sistema operativo · disponibilidad parcial"
        );


        return;

    }


    if (
        resumen.errores >
        0 ||
        estado ===
        "DEGRADADO" ||
        estado ===
        "ERROR"
    ) {

        hero.classList.add(
            "error"
        );


        colocarEstado(
            "systemMainStatus",
            "Se detectaron errores de servicio"
        );


        colocarEstado(
            "systemMainDescription",
            crearDescripcionInventarioEstado(
                `${resumen.errores} servicio(s) presentan error y ${resumen.noDisponibles} fuente(s) oficial(es) no están disponibles.`
            )
        );


        colocarEstado(
            "footerStatus",
            "Sistema degradado"
        );


        return;

    }


    /*
       Si el backend usa un estado nuevo que el frontend todavía
       no conoce, no se marca falsamente como error.
    */
    hero.classList.add(
        incidenciasEstado() >
        0
            ? "degraded"
            : "healthy"
    );


    colocarEstado(
        "systemMainStatus",
        incidenciasEstado() >
        0
            ? "Sistema operativo con incidencias"
            : "Sistema operativo"
    );


    colocarEstado(
        "systemMainDescription",
        crearDescripcionInventarioEstado(
            `${resumen.operativos} de ${resumen.totalMonitoreados} servicios críticos monitoreados están operativos.`
        )
    );


    colocarEstado(
        "footerStatus",
        incidenciasEstado() >
        0
            ? "Sistema con incidencias"
            : "Sistema operativo"
    );

}


function crearDescripcionInventarioEstado(
    detalle
) {

    const inventario =
        estadoState.inventario;


    if (
        inventario.total >
        0
    ) {

        return `${inventario.implementados} de ${inventario.total} servicios empresariales están implementados. ${detalle}`;

    }


    return detalle;

}


function incidenciasEstado() {

    return (
        estadoState.resumen
            .noDisponibles +
        estadoState.resumen
            .errores
    );

}


/* =========================================================
   FUENTE EXTERNA
========================================================= */

function actualizarFuenteExterna() {

    const fuente =
        estadoState
            .health
            ?.fuenteExterna ||
        {};


    const badge =
        document.getElementById(
            "externalSourceBadge"
        );


    if (
        !badge
    ) {

        return;

    }


    const estado =
        String(
            fuente.estado ||
            "NO_DETERMINADO"
        )
        .toUpperCase();


    colocarEstado(
        "externalSourceTitle",
        fuente.nombre ||
        "PRONABEC"
    );


    const api =
        numeroEstado(
            fuente.apiPronabec ??
            fuente.serviciosApi
        );


    const portalNacional =
        numeroEstado(
            fuente.portalNacional
        );


    const portalPronabec =
        numeroEstado(
            fuente.portalPronabec
        );


    const noDisponibles =
        numeroEstado(
            fuente.noDisponibles
        );


    const errores =
        numeroEstado(
            fuente.errores ??
            fuente.serviciosError
        );


    if (
        estado ===
        "OFICIAL_DISPONIBLE" ||
        estado ===
        "API"
    ) {

        badge.className =
            "external-badge api";


        badge.textContent =
            "OFICIAL";


        colocarEstado(
            "externalSourceDescription",
            `Fuentes oficiales disponibles: API PRONABEC ${api}, Plataforma Nacional ${portalNacional}, Portal PRONABEC ${portalPronabec}.`
        );


        return;

    }


    if (
        estado ===
        "OFICIAL_PARCIAL" ||
        estado ===
        "MIXTO"
    ) {

        badge.className =
            "external-badge api";


        badge.textContent =
            "OFICIAL PARCIAL";


        colocarEstado(
            "externalSourceDescription",
            `Hay fuentes oficiales disponibles, pero ${noDisponibles} servicio(s) externo(s) no tienen fuente disponible actualmente.`
        );


        return;

    }


    if (
        estado ===
        "NO_DISPONIBLE"
    ) {

        badge.className =
            "external-badge backup";


        badge.textContent =
            "NO DISPONIBLE";


        colocarEstado(
            "externalSourceDescription",
            "La fuente oficial requerida no está disponible actualmente. EduPerú no sustituye esta información con datos ficticios."
        );


        return;

    }


    if (
        estado ===
        "ERROR"
    ) {

        badge.className =
            "external-badge backup";


        badge.textContent =
            "ERROR";


        colocarEstado(
            "externalSourceDescription",
            `${errores} servicio(s) externo(s) presentan error de consulta.`
        );


        return;

    }


    badge.className =
        "external-badge backup";


    badge.textContent =
        "NO DETERMINADO";


    colocarEstado(
        "externalSourceDescription",
        "No fue posible determinar la fuente externa utilizada en esta comprobación."
    );

}


/* =========================================================
   FILTROS
========================================================= */

function filtrarServiciosEstado() {

    const texto =
        normalizarEstado(
            document
                .getElementById(
                    "servicesSearch"
                )
                ?.value
        );


    const filtro =
        document
            .getElementById(
                "statusFilter"
            )
            ?.value ||
        "";


    estadoState.filtrados =
        estadoState
            .servicios
            .filter(
                servicio => {

                    const coincideTexto =
                        !texto ||
                        normalizarEstado(
                            JSON.stringify(
                                servicio
                            )
                        )
                        .includes(
                            texto
                        );


                    const categoria =
                        obtenerCategoriaEstado(
                            servicio
                        );


                    const coincideFiltro =
                        !filtro ||
                        categoria ===
                        filtro;


                    return (
                        coincideTexto &&
                        coincideFiltro
                    );

                }
            );


    renderizarServiciosEstado();

}


/* =========================================================
   RENDER SERVICIOS
========================================================= */

function renderizarServiciosEstado() {

    const contenedor =
        document.getElementById(
            "servicesStatusGrid"
        );


    if (
        !contenedor
    ) {

        return;

    }


    colocarEstado(
        "servicesResultText",
        `${estadoState.filtrados.length} de ${estadoState.servicios.length} servicio(s) monitoreado(s)`
    );


    if (
        estadoState
            .filtrados
            .length ===
        0
    ) {

        contenedor.innerHTML =
            `
            <div class="loading-state">

                <span>
                    No se encontraron servicios con esos filtros.
                </span>

            </div>
            `;


        return;

    }


    contenedor.innerHTML =
        estadoState
            .filtrados
            .map(
                servicio => {

                    const categoria =
                        obtenerCategoriaEstado(
                            servicio
                        );


                    const clase =
                        obtenerClaseVisualEstado(
                            categoria
                        );


                    const etiqueta =
                        obtenerEtiquetaEstado(
                            servicio
                        );


                    const latencia =
                        numeroEstado(
                            servicio.latenciaMs
                        );


                    return `
                    <article class="status-service-card ${clase}">

                        <div class="status-service-header">

                            <div class="status-service-icon">
                                <i data-lucide="${obtenerIconoEstado(
                                    categoria
                                )}"></i>
                            </div>


                            <span class="service-status-badge ${clase}">
                                ${escaparEstado(
                                    etiqueta
                                )}
                            </span>

                        </div>


                        <h4>
                            ${escaparEstado(
                                servicio.nombre ||
                                "Servicio"
                            )}
                        </h4>


                        <p>
                            ${escaparEstado(
                                servicio.detalle ||
                                servicio.tipo ||
                                "Servicio de EduPerú."
                            )}
                        </p>


                        <div class="status-service-endpoint">

                            ${escaparEstado(
                                servicio.endpoint ||
                                ""
                            )}

                            <br>

                            Latencia:
                            ${latencia} ms

                        </div>

                    </article>
                    `;

                }
            )
            .join("");


    EduPeruUI
        ?.actualizarIconos?.();

}


/* =========================================================
   CATEGORÍA / CLASE
========================================================= */

function obtenerCategoriaEstado(
    servicio
) {

    const estado =
        normalizarEstado(
            servicio?.estado
        );


    const modo =
        normalizarEstado(
            servicio?.modo
        )
        .replace(
            /\s+/g,
            "_"
        );


    if (
        estado ===
        "error" ||
        modo ===
        "error"
    ) {

        return "error";

    }


    if (
        estado.includes(
            "no_disponible"
        ) ||
        estado.includes(
            "no disponible"
        ) ||
        modo.includes(
            "no_disponible"
        ) ||
        modo.includes(
            "no disponible"
        )
    ) {

        return "unavailable";

    }


    if (
        modo ===
        "api_pronabec" ||
        modo ===
        "api"
    ) {

        return "api";

    }


    if (
        modo ===
        "portal_nacional" ||
        modo ===
        "portal_pronabec"
    ) {

        return "portal";

    }


    if (
        modo ===
        "local"
    ) {

        return "local";

    }


    return "operational";

}


function obtenerClaseVisualEstado(
    categoria
) {

    if (
        categoria ===
        "api" ||
        categoria ===
        "portal"
    ) {

        return "api";

    }


    if (
        categoria ===
        "unavailable" ||
        categoria ===
        "error"
    ) {

        return "error";

    }


    return "local";

}


/* =========================================================
   ETIQUETA
========================================================= */

function obtenerEtiquetaEstado(
    servicio
) {

    const categoria =
        obtenerCategoriaEstado(
            servicio
        );


    const modo =
        String(
            servicio?.modo ||
            ""
        )
        .toUpperCase();


    if (
        categoria ===
        "api"
    ) {

        return "API PRONABEC";

    }


    if (
        categoria ===
        "portal"
    ) {

        if (
            modo ===
            "PORTAL_NACIONAL"
        ) {

            return "PORTAL NACIONAL";

        }


        return "PORTAL PRONABEC";

    }


    if (
        categoria ===
        "unavailable"
    ) {

        return "NO DISPONIBLE";

    }


    if (
        categoria ===
        "error"
    ) {

        return "ERROR";

    }


    if (
        categoria ===
        "local"
    ) {

        return "LOCAL";

    }


    return "OPERATIVO";

}


/* =========================================================
   ICONO
========================================================= */

function obtenerIconoEstado(
    categoria
) {

    if (
        categoria ===
        "api" ||
        categoria ===
        "portal"
    ) {

        return "cloud";

    }


    if (
        categoria ===
        "unavailable"
    ) {

        return "cloud-off";

    }


    if (
        categoria ===
        "error"
    ) {

        return "circle-x";

    }


    return "circle-check";

}


/* =========================================================
   HORA
========================================================= */

function actualizarHoraEstado() {

    const fecha =
        estadoState
            .health
            ?.fecha;


    const fechaFinal =
        fecha
            ? new Date(
                fecha
            )
            : new Date();


    const valida =
        Number.isFinite(
            fechaFinal.getTime()
        );


    const mostrar =
        valida
            ? fechaFinal
            : new Date();


    colocarEstado(
        "lastCheck",
        `Última comprobación: ${mostrar.toLocaleTimeString(
            "es-PE",
            {
                hour:
                    "2-digit",

                minute:
                    "2-digit",

                second:
                    "2-digit"
            }
        )}`
    );

}


/* =========================================================
   CARGANDO
========================================================= */

function mostrarEstadoCargando() {

    const hero =
        document.getElementById(
            "systemHero"
        );


    if (
        hero
    ) {

        hero.className =
            "system-hero checking";

    }


    colocarEstado(
        "systemMainStatus",
        "Consultando HealthCheckService..."
    );


    colocarEstado(
        "systemMainDescription",
        "Analizando inventario SOA, disponibilidad, fuente y latencia de los servicios."
    );


    [
        "servicesOperational",
        "servicesApi",
        "servicesBackup",
        "servicesError",
        "systemAvailability"

    ].forEach(
        id =>
            colocarEstado(
                id,
                "--"
            )
    );


    colocarEstado(
        "servicesResultText",
        "Consultando servicios..."
    );


    const grid =
        document.getElementById(
            "servicesStatusGrid"
        );


    if (
        grid
    ) {

        grid.innerHTML =
            `
            <div class="loading-state">

                <div class="spinner"></div>

                <span>
                    Ejecutando HealthCheckService...
                </span>

            </div>
            `;

    }

}


/* =========================================================
   ERROR
========================================================= */

function mostrarErrorEstado(
    mensaje
) {

    const hero =
        document.getElementById(
            "systemHero"
        );


    if (
        hero
    ) {

        hero.className =
            "system-hero error";

    }


    colocarEstado(
        "systemMainStatus",
        "HealthCheckService no respondió"
    );


    colocarEstado(
        "systemMainDescription",
        mensaje
    );


    colocarEstado(
        "footerStatus",
        "Error de monitoreo"
    );


    [
        "servicesOperational",
        "servicesApi",
        "servicesBackup",
        "servicesError",
        "systemAvailability"
    ].forEach(
        id =>
            colocarEstado(
                id,
                "N/D"
            )
    );


    colocarEstado(
        "servicesResultText",
        "0 servicios monitoreados"
    );


    const grid =
        document.getElementById(
            "servicesStatusGrid"
        );


    if (
        grid
    ) {

        grid.innerHTML =
            `
            <div class="loading-state">

                <span>
                    No se pudo recuperar el estado de los servicios.
                </span>

            </div>
            `;

    }


    EduPeruUI
        ?.actualizarIconos?.();

}


/* =========================================================
   UTILIDADES
========================================================= */

function contarModoEstado(
    servicios,
    ...modos
) {

    const buscados =
        modos.map(
            modo =>
                normalizarEstado(
                    modo
                )
                .replace(
                    /\s+/g,
                    "_"
                )
        );


    return servicios.filter(
        servicio => {

            const modo =
                normalizarEstado(
                    servicio?.modo
                )
                .replace(
                    /\s+/g,
                    "_"
                );


            return buscados.includes(
                modo
            );

        }
    ).length;

}


function numeroEstado(
    valor
) {

    const numero =
        Number(
            valor
        );


    return Number.isFinite(
        numero
    )
        ? numero
        : 0;

}


function normalizarEstado(
    texto
) {

    return String(
        texto ||
        ""
    )
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();

}


function colocarEstado(
    id,
    valor
) {

    const elemento =
        document.getElementById(
            id
        );


    if (
        elemento
    ) {

        elemento.textContent =
            valor;

    }

}


function cambiarEtiquetaIndicadorEstado(
    id,
    texto
) {

    const valor =
        document.getElementById(
            id
        );


    if (
        !valor
    ) {

        return;

    }


    const contenedor =
        valor.closest(
            ".status-stat-card, .stat-card, article, div"
        );


    if (
        !contenedor
    ) {

        return;

    }


    const candidatos =
        Array.from(
            contenedor.querySelectorAll(
                "span, small, p"
            )
        );


    const etiqueta =
        candidatos.find(
            elemento =>
                elemento !==
                valor &&
                !elemento.contains(
                    valor
                )
        );


    if (
        etiqueta
    ) {

        etiqueta.textContent =
            texto;

    }

}


function escaparEstado(
    valor
) {

    if (
        window.EduPeruUI &&
        typeof EduPeruUI.escaparHTML ===
        "function"
    ) {

        return EduPeruUI.escaparHTML(
            String(
                valor ??
                ""
            )
        );

    }


    return String(
        valor ??
        ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}
