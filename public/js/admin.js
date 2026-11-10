/* =========================================================
   EDUPERÚ SOA
   ADMINISTRATION CENTER
========================================================= */


const adminState = {

    health:
        null,

    contratos:
        [],

    estadisticas:
        {},

    fuentes:
        {},

    regiones:
        [],

    ubigeo:
        null

};


document.addEventListener(
    "DOMContentLoaded",
    () => {

        configurarEventosAdmin();

        asegurarAccesosTecnicosAdmin();

        cargarPanelAdmin();

    }
);


/* =========================================================
   EVENTOS
========================================================= */

function configurarEventosAdmin() {

    document
        .getElementById(
            "refreshButton"
        )
        ?.addEventListener(
            "click",
            cargarPanelAdmin
        );


    document
        .getElementById(
            "adminRefreshButton"
        )
        ?.addEventListener(
            "click",
            cargarPanelAdmin
        );


    document
        .getElementById(
            "globalSearch"
        )
        ?.addEventListener(
            "input",
            event => {

                renderizarServiciosAdmin(
                    event.target.value
                );

            }
        );

}


/* =========================================================
   ACCESOS TÉCNICOS
========================================================= */

function asegurarAccesosTecnicosAdmin() {

    const contenedor =
        document.querySelector(
            ".admin-actions"
        );


    if (!contenedor) {

        return;

    }


    if (
        !contenedor.querySelector(
            'a[href="/api-docs"]'
        )
    ) {

        const swagger =
            document.createElement(
                "a"
            );


        swagger.href =
            "/api-docs";


        swagger.className =
            "admin-action-card";


        swagger.innerHTML =
            `

            <i data-lucide="book-open-code"></i>

            <div>

                <strong>
                    Swagger / OpenAPI
                </strong>

                <span>
                    Probar y documentar endpoints
                </span>

            </div>

            `;


        contenedor.appendChild(
            swagger
        );

    }


    if (
        !contenedor.querySelector(
            'a[href="/api-docs.json"]'
        )
    ) {

        const openapi =
            document.createElement(
                "a"
            );


        openapi.href =
            "/api-docs.json";


        openapi.target =
            "_blank";


        openapi.className =
            "admin-action-card";


        openapi.innerHTML =
            `

            <i data-lucide="file-json"></i>

            <div>

                <strong>
                    OpenAPI JSON
                </strong>

                <span>
                    Ver especificación OpenAPI 3
                </span>

            </div>

            `;


        contenedor.appendChild(
            openapi
        );

    }


    EduPeruUI
        .actualizarIconos();

}


/* =========================================================
   CARGAR PANEL
========================================================= */

async function cargarPanelAdmin() {

    mostrarCargaAdmin();


    const resultados =
        await Promise.allSettled([

            EduPeruAPI.obtenerHealth(),

            EduPeruAPI.obtenerContratos(),

            EduPeruAPI.obtenerEstadisticas(),

            EduPeruAPI.obtenerRegiones(),

            EduPeruAPI.obtenerResumenUbigeo()

        ]);


    procesarHealthAdmin(
        resultados[0]
    );


    procesarContratosAdmin(
        resultados[1]
    );


    procesarEstadisticasAdmin(
        resultados[2]
    );


    procesarRegionesAdmin(
        resultados[3]
    );


    procesarUbigeoAdmin(
        resultados[4]
    );


    actualizarKpisAdmin();

    renderizarFuentesAdmin();

    renderizarTerritorioAdmin();

    renderizarServiciosAdmin("");

    actualizarEstadoAdmin();

    actualizarFechaAdmin();


    EduPeruUI
        .actualizarIconos();

}


/* =========================================================
   HEALTH
========================================================= */

function procesarHealthAdmin(
    resultado
) {

    if (
        resultado.status !==
        "fulfilled"
    ) {

        adminState.health =
            null;

        return;

    }


    adminState.health =
        resultado.value
            ?.resultado ||
        resultado.value ||
        null;

}


/* =========================================================
   CONTRATOS
========================================================= */

function procesarContratosAdmin(
    resultado
) {

    if (
        resultado.status !==
        "fulfilled"
    ) {

        adminState.contratos =
            [];

        return;

    }


    const respuesta =
        resultado.value ||
        {};


    adminState.contratos =
        Array.isArray(
            respuesta.contratos
        )
            ? respuesta.contratos

            : Array.isArray(
                respuesta
                    ?.resultado
                    ?.contratos
            )
                ? respuesta
                    .resultado
                    .contratos
                : [];

}


/* =========================================================
   ESTADÍSTICAS
========================================================= */

function procesarEstadisticasAdmin(
    resultado
) {

    if (
        resultado.status !==
        "fulfilled"
    ) {

        adminState.estadisticas =
            {};


        adminState.fuentes =
            {};


        return;

    }


    const respuesta =
        resultado.value
            ?.resultado ||
        resultado.value ||
        {};


    adminState.estadisticas =
        respuesta.resumen ||
        {};


    adminState.fuentes =
        respuesta.fuentes ||
        {};

}


/* =========================================================
   REGIONES
========================================================= */

function procesarRegionesAdmin(
    resultado
) {

    if (
        resultado.status !==
        "fulfilled"
    ) {

        adminState.regiones =
            [];

        return;

    }


    adminState.regiones =
        extraerArrayAdmin(
            resultado.value
        );

}


/* =========================================================
   UBIGEO
========================================================= */

function procesarUbigeoAdmin(
    resultado
) {

    if (
        resultado.status !==
        "fulfilled"
    ) {

        adminState.ubigeo =
            null;

        return;

    }


    adminState.ubigeo =
        resultado.value
            ?.resultado ||
        resultado.value ||
        null;

}


/* =========================================================
   KPI
========================================================= */

function actualizarKpisAdmin() {

    const resumen =
        adminState.estadisticas ||
        {};


    const registros =
        numeroAdmin(
            resumen.totalConvocatorias
        ) +
        numeroAdmin(
            resumen.totalPostulaciones
        ) +
        numeroAdmin(
            resumen.totalDocumentos
        ) +
        numeroAdmin(
            resumen.totalConvenios
        );


    const healthResumen =
        adminState.health
            ?.resumenMonitoreo ||
        {};


    colocarAdmin(
        "adminServices",
        adminState.contratos.length ||
        numeroAdmin(
            adminState.health
                ?.inventarioSOA
                ?.total
        )
    );


    colocarAdmin(
        "adminRecords",
        registros
    );


    colocarAdmin(
        "adminRegions",
        adminState.regiones.length
    );


    colocarAdmin(
        "adminBackups",
        numeroAdmin(
            healthResumen.apiPronabec
        ) +
        numeroAdmin(
            healthResumen.portalNacional
        ) +
        numeroAdmin(
            healthResumen.portalPronabec
        )
    );


    colocarAdmin(
        "adminFavorites",
        obtenerCantidadLocal(
            "eduperu_favoritos"
        )
    );


    colocarAdmin(
        "adminAlerts",
        obtenerCantidadLocal(
            "eduperu_alertas"
        )
    );

}


/* =========================================================
   FUENTES
========================================================= */

function renderizarFuentesAdmin() {

    const contenedor =
        document.getElementById(
            "adminSources"
        );


    if (!contenedor) {

        return;

    }


    const servicios =
        Array.isArray(
            adminState.health
                ?.serviciosMonitoreados
        )
            ? adminState.health
                .serviciosMonitoreados
                .filter(
                    servicio => [

                        "ConvocatoriaService",
                        "PostulacionService",
                        "DocumentoRequisitoService",
                        "ConvenioService"

                    ].includes(
                        servicio.nombre
                    )
                )

            : [];


    if (!servicios.length) {

        contenedor.innerHTML =
            `

            <div class="loading-state">

                <span>
                    No se obtuvo información de fuentes.
                </span>

            </div>

            `;


        return;

    }


    contenedor.innerHTML =
        servicios
            .map(
                servicio => {

                    const modo =
                        String(
                            servicio.modo ||
                            "DESCONOCIDO"
                        )
                        .toUpperCase();


                    const clase =
                        [
                            "API_PRONABEC",
                            "PORTAL_NACIONAL",
                            "PORTAL_PRONABEC"
                        ].includes(
                            modo
                        )
                            ? "api"

                            : modo ===
                              "NO_DISPONIBLE"
                                ? "unknown"

                                : "unknown";


                    return `

                    <div class="admin-source-item">

                        <div class="admin-source-info">

                            <div class="admin-source-icon">

                                <i data-lucide="database"></i>

                            </div>

                            <div>

                                <strong>

                                    ${EduPeruUI.escaparHTML(
                                        servicio.nombre
                                    )}

                                </strong>

                                <span>
                                    ${numeroAdmin(servicio.latenciaMs)} ms
                                </span>

                            </div>

                        </div>


                        <span class="admin-source-badge ${clase}">

                            ${EduPeruUI.escaparHTML(
                                modo
                            )}

                        </span>

                    </div>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   TERRITORIO
========================================================= */

function renderizarTerritorioAdmin() {

    const ubigeo =
        adminState.ubigeo ||
        {};


    const resumen =
        ubigeo.resumen ||
        {};


    colocarAdmin(
        "adminTerritoryDepartments",
        adminState.regiones.length
    );


    colocarAdmin(
        "adminTerritoryProvinces",
        resumen.provincias ??
        resumen.totalProvincias ??
        "--"
    );


    colocarAdmin(
        "adminTerritoryDistricts",
        resumen.distritos ??
        resumen.totalDistritos ??
        "--"
    );


    colocarAdmin(
        "adminTerritoryCoverage",
        ubigeo.cobertura ||
        resumen.cobertura ||
        "PARCIAL"
    );

}


/* =========================================================
   SERVICIOS
========================================================= */

function renderizarServiciosAdmin(
    filtro = ""
) {

    const contenedor =
        document.getElementById(
            "adminServiceGrid"
        );


    if (!contenedor) {

        return;

    }


    const texto =
        normalizarAdmin(
            filtro
        );


    const servicios =
        adminState
            .contratos
            .filter(
                servicio =>

                    !texto ||

                    normalizarAdmin(
                        JSON.stringify(
                            servicio
                        )
                    )
                    .includes(
                        texto
                    )
            );


    colocarAdmin(
        "adminServicesResult",
        `${servicios.length} servicio(s) documentados`
    );


    if (!servicios.length) {

        contenedor.innerHTML =
            `

            <div class="loading-state">

                <span>
                    No hay servicios que coincidan.
                </span>

            </div>

            `;


        return;

    }


    contenedor.innerHTML =
        servicios
            .map(
                servicio => `

                <article class="admin-service-card">

                    <span>
                        ${EduPeruUI.escaparHTML(
                            servicio.tipo ||
                            "Servicio SOA"
                        )}
                    </span>

                    <strong>
                        ${EduPeruUI.escaparHTML(
                            servicio.nombre ||
                            "Servicio"
                        )}
                    </strong>

                    <small>
                        ${EduPeruUI.escaparHTML(
                            servicio.endpoint ||
                            "Interno"
                        )}
                    </small>

                </article>

                `
            )
            .join("");

}


/* =========================================================
   ESTADO GENERAL
========================================================= */

function actualizarEstadoAdmin() {

    const health =
        adminState.health;


    if (!health) {

        colocarAdmin(
            "adminSystemStatus",
            "Requiere revisión"
        );


        colocarAdmin(
            "adminSystemStatusText",
            "HealthCheckService no disponible"
        );


        return;

    }


    const resumen =
        health.resumenMonitoreo ||
        {};


    if (
        health.estado ===
        "OPERATIVO"
    ) {

        colocarAdmin(
            "adminSystemStatus",
            "Sistema operativo"
        );


        colocarAdmin(
            "adminSystemStatusText",
            `${numeroAdmin(resumen.operativos)} servicios operativos`
        );


        return;

    }


    if (
        health.estado ===
        "OPERATIVO_PARCIAL"
    ) {

        colocarAdmin(
            "adminSystemStatus",
            "Operativo parcial"
        );


        colocarAdmin(
            "adminSystemStatusText",
            `${numeroAdmin(resumen.noDisponibles)} fuente(s) oficial(es) no disponible(s)`
        );


        return;

    }


    colocarAdmin(
        "adminSystemStatus",
        "Sistema degradado"
    );


    colocarAdmin(
        "adminSystemStatusText",
        `${numeroAdmin(resumen.errores)} servicio(s) con error`
    );

}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function obtenerCantidadLocal(
    clave
) {

    try {

        const datos =
            JSON.parse(
                localStorage.getItem(
                    clave
                ) ||
                "[]"
            );


        return Array.isArray(
            datos
        )
            ? datos.length
            : 0;

    } catch {

        return 0;

    }

}


/* =========================================================
   EXTRAER ARRAY
========================================================= */

function extraerArrayAdmin(
    respuesta
) {

    if (
        Array.isArray(
            respuesta
        )
    ) {

        return respuesta;

    }


    const candidatos = [

        respuesta?.datos,

        respuesta?.resultado?.datos,

        respuesta?.resultado,

        respuesta?.data,

        respuesta?.rows,

        respuesta?.records

    ];


    for (
        const candidato
        of candidatos
    ) {

        if (
            Array.isArray(
                candidato
            )
        ) {

            return candidato;

        }

    }


    return [];

}


/* =========================================================
   FECHA
========================================================= */

function actualizarFechaAdmin() {

    const fecha =
        adminState.health
            ?.fecha;


    const ahora =
        fecha
            ? new Date(fecha)
            : new Date();


    colocarAdmin(
        "adminLastUpdate",

        `Última actualización: ${ahora.toLocaleTimeString(
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

function mostrarCargaAdmin() {

    [

        "adminServices",
        "adminRecords",
        "adminRegions",
        "adminBackups"

    ].forEach(
        id =>
            colocarAdmin(
                id,
                "--"
            )
    );


    colocarAdmin(
        "adminSystemStatus",
        "Analizando..."
    );


    colocarAdmin(
        "adminSystemStatusText",
        "Consultando servicios"
    );

}


/* =========================================================
   UTILIDADES
========================================================= */

function numeroAdmin(
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


function normalizarAdmin(
    texto
) {

    return String(
        texto ||
        ""
    )
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();

}


function colocarAdmin(
    id,
    valor
) {

    const elemento =
        document.getElementById(
            id
        );


    if (elemento) {

        elemento.textContent =
            valor;

    }

}