/* =========================================================
   EDUPERÚ SOA
   ARQUITECTURA - 40 SERVICIOS EMPRESARIALES
========================================================= */


const arquitecturaState = {

    contratos:
        [],

    filtrados:
        [],

    health:
        null,

    resumen:
        null

};


const PRINCIPIOS_SOA = [

    "Standardized Service Contract",

    "Service Loose Coupling",

    "Service Abstraction",

    "Service Reusability",

    "Service Autonomy",

    "Service Statelessness",

    "Service Discoverability",

    "Service Composability"

];


document.addEventListener(
    "DOMContentLoaded",
    () => {

        configurarEventosArquitectura();

        renderizarPrincipios();

        cargarArquitectura();

    }
);


/* =========================================================
   EVENTOS
========================================================= */

function configurarEventosArquitectura() {

    document
        .getElementById(
            "refreshArchitecture"
        )
        ?.addEventListener(
            "click",
            cargarArquitectura
        );


    document
        .getElementById(
            "architectureSearch"
        )
        ?.addEventListener(
            "input",
            aplicarFiltrosArquitectura
        );


    document
        .getElementById(
            "architectureTypeFilter"
        )
        ?.addEventListener(
            "change",
            aplicarFiltrosArquitectura
        );

}


/* =========================================================
   CARGA
========================================================= */

async function cargarArquitectura() {

    indicarCargando();


    const resultados =
        await Promise.allSettled([

            obtenerJson(
                "/api/contratos"
            ),

            obtenerJson(
                "/api/health"
            )

        ]);


    procesarContratos(
        resultados[0]
    );


    procesarHealth(
        resultados[1]
    );


    arquitecturaState.filtrados =
        [
            ...arquitecturaState.contratos
        ];


    llenarFiltroTipos();

    actualizarKpis();

    renderizarResumenTipos();

    renderizarFuentes();

    renderizarServicios();

    actualizarEstado();

    actualizarFecha();


    if (
        window.lucide
    ) {

        window.lucide.createIcons();

    }

}


/* =========================================================
   FETCH
========================================================= */

async function obtenerJson(
    url
) {

    const respuesta =
        await fetch(
            url,
            {
                headers: {
                    Accept:
                        "application/json"
                },
                cache:
                    "no-store"
            }
        );


    if (
        !respuesta.ok
    ) {

        throw new Error(
            `HTTP ${respuesta.status}`
        );

    }


    return respuesta.json();

}


/* =========================================================
   CONTRATOS
========================================================= */

function procesarContratos(
    resultado
) {

    if (
        resultado.status !==
        "fulfilled"
    ) {

        arquitecturaState.contratos =
            [];

        arquitecturaState.resumen =
            null;

        return;

    }


    const respuesta =
        resultado.value ||
        {};


    const candidatos = [

        respuesta.contratos,

        respuesta.resultado
            ?.contratos,

        respuesta.datos,

        respuesta.resultado
            ?.datos,

        Array.isArray(
            respuesta
        )
            ? respuesta
            : null

    ];


    arquitecturaState.contratos =
        candidatos.find(
            Array.isArray
        ) ||
        [];


    arquitecturaState.resumen =
        respuesta.resumen ||
        respuesta.resultado
            ?.resumen ||
        null;

}


/* =========================================================
   HEALTH
========================================================= */

function procesarHealth(
    resultado
) {

    if (
        resultado.status !==
        "fulfilled"
    ) {

        arquitecturaState.health =
            null;

        return;

    }


    arquitecturaState.health =
        resultado.value
            ?.resultado ||
        resultado.value ||
        null;

}


/* =========================================================
   KPI
========================================================= */

function actualizarKpis() {

    const contratos =
        arquitecturaState.contratos;


    const healthInventario =
        arquitecturaState.health
            ?.inventarioSOA ||
        {};


    const total =
        numero(
            healthInventario.total,
            contratos.length
        );


    const implementados =
        numero(
            healthInventario.implementados,
            contratos.filter(
                item =>
                    normalizar(
                        item.estadoImplementacion
                    ) ===
                    "implementado"
            )
            .length
        );


    const planificados =
        numero(
            healthInventario.planificados,
            contratos.filter(
                item =>
                    normalizar(
                        item.estadoImplementacion
                    ) ===
                    "planificado"
            )
            .length
        );


    const conAutenticacion =
        numero(
            healthInventario.conAutenticacion,
            contratos.filter(
                contrato =>
                    Boolean(
                        contrato.requiereAutenticacion
                    )
            )
            .length
        );


    colocarTexto(
        "architectureTotal",
        total
    );


    colocarTexto(
        "architectureImplemented",
        implementados
    );


    colocarTexto(
        "architecturePlanned",
        planificados
    );


    colocarTexto(
        "architectureAuth",
        conAutenticacion
    );

}


/* =========================================================
   FILTROS
========================================================= */

function llenarFiltroTipos() {

    const select =
        document.getElementById(
            "architectureTypeFilter"
        );


    if (!select) {

        return;

    }


    const actual =
        select.value;


    const tipos =
        Array.from(
            new Set(
                arquitecturaState
                    .contratos
                    .map(
                        item =>
                            item.tipo ||
                            "Sin clasificar"
                    )
            )
        )
        .sort(
            (
                a,
                b
            ) =>
                String(a)
                    .localeCompare(
                        String(b),
                        "es"
                    )
        );


    select.innerHTML =
        `
        <option value="">
            Todos los tipos
        </option>
        ` +
        tipos
            .map(
                tipo => `
                <option value="${escaparAtributo(tipo)}">
                    ${escaparHTML(tipo)}
                </option>
                `
            )
            .join("");


    if (
        tipos.includes(
            actual
        )
    ) {

        select.value =
            actual;

    }

}


function aplicarFiltrosArquitectura() {

    const texto =
        normalizar(
            document
                .getElementById(
                    "architectureSearch"
                )
                ?.value
        );


    const tipo =
        document
            .getElementById(
                "architectureTypeFilter"
            )
            ?.value ||
        "";


    arquitecturaState.filtrados =
        arquitecturaState
            .contratos
            .filter(
                contrato => {

                    const cumpleTexto =
                        !texto ||
                        normalizar(
                            JSON.stringify(
                                contrato
                            )
                        )
                        .includes(
                            texto
                        );


                    const cumpleTipo =
                        !tipo ||
                        String(
                            contrato.tipo ||
                            "Sin clasificar"
                        ) ===
                        tipo;


                    return (
                        cumpleTexto &&
                        cumpleTipo
                    );

                }
            );


    renderizarServicios();

}


/* =========================================================
   SERVICIOS
========================================================= */

function renderizarServicios() {

    const contenedor =
        document.getElementById(
            "architectureServiceGrid"
        );


    if (!contenedor) {

        return;

    }


    const servicios =
        arquitecturaState.filtrados;


    colocarTexto(
        "architectureServiceResult",
        `${servicios.length} de ${arquitecturaState.contratos.length} servicio(s) visibles`
    );


    if (
        !servicios.length
    ) {

        contenedor.innerHTML =
            `
            <div class="architecture-empty">
                <i data-lucide="search-x"></i>
                <strong>
                    No se encontraron servicios
                </strong>
                <span>
                    Cambia el texto o el tipo seleccionado.
                </span>
            </div>
            `;


        actualizarIconos();

        return;

    }


    contenedor.innerHTML =
        servicios
            .map(
                contrato => {

                    const estado =
                        contrato.estadoImplementacion ||
                        "IMPLEMENTADO";


                    const auth =
                        Boolean(
                            contrato.requiereAutenticacion
                        );


                    const operaciones =
                        Array.isArray(
                            contrato.operaciones
                        )
                            ? contrato.operaciones
                            : [];


                    return `
                    <article class="architecture-service-card">

                        <div class="architecture-service-top">

                            <span class="architecture-service-id">
                                ${numero(contrato.id, "--")}
                            </span>

                            <span
                                class="architecture-service-state
                                ${normalizar(estado) === "implementado"
                                    ? "implemented"
                                    : "planned"
                                }"
                            >
                                ${escaparHTML(estado)}
                            </span>

                        </div>


                        <span class="architecture-service-type">
                            ${escaparHTML(
                                contrato.tipo ||
                                "Servicio SOA"
                            )}
                        </span>


                        <h4>
                            ${escaparHTML(
                                contrato.nombre ||
                                "Servicio"
                            )}
                        </h4>


                        <p>
                            ${escaparHTML(
                                contrato.descripcion ||
                                "Contrato empresarial EduPerú."
                            )}
                        </p>


                        <div class="architecture-service-domain">
                            <i data-lucide="layers-3"></i>
                            <span>
                                ${escaparHTML(
                                    contrato.dominio ||
                                    "EduPerú"
                                )}
                            </span>
                        </div>


                        <code>
                            ${escaparHTML(
                                contrato.endpoint ||
                                "Interno"
                            )}
                        </code>


                        <div class="architecture-service-meta">

                            <span>
                                <i data-lucide="${auth
                                    ? "lock-keyhole"
                                    : "globe-2"
                                }"></i>

                                ${auth
                                    ? "JWT"
                                    : "Público"
                                }
                            </span>

                            <span>
                                <i data-lucide="route"></i>
                                ${operaciones.length} operación(es)
                            </span>

                        </div>

                    </article>
                    `;

                }
            )
            .join("");


    actualizarIconos();

}


/* =========================================================
   RESUMEN POR TIPO
========================================================= */

function renderizarResumenTipos() {

    const contenedor =
        document.getElementById(
            "architectureTypeSummary"
        );


    if (!contenedor) {

        return;

    }


    const conteo =
        {};


    arquitecturaState
        .contratos
        .forEach(
            contrato => {

                const tipo =
                    contrato.tipo ||
                    "Sin clasificar";


                conteo[tipo] =
                    (
                        conteo[tipo] ||
                        0
                    ) +
                    1;

            }
        );


    const filas =
        Object.entries(
            conteo
        )
        .sort(
            (
                a,
                b
            ) =>
                b[1] -
                a[1]
        );


    if (!filas.length) {

        contenedor.innerHTML =
            `
            <div class="architecture-loading">
                No se pudo cargar la clasificación.
            </div>
            `;

        return;

    }


    const maximo =
        Math.max(
            ...filas.map(
                item =>
                    item[1]
            )
        );


    contenedor.innerHTML =
        filas
            .map(
                (
                    [
                        tipo,
                        cantidad
                    ]
                ) => {

                    const porcentaje =
                        Math.max(
                            8,
                            Math.round(
                                (
                                    cantidad /
                                    maximo
                                ) *
                                100
                            )
                        );


                    return `
                    <div class="architecture-type-row">

                        <div class="architecture-type-label">
                            <span>
                                ${escaparHTML(tipo)}
                            </span>

                            <strong>
                                ${cantidad}
                            </strong>
                        </div>

                        <div class="architecture-type-track">
                            <span style="width:${porcentaje}%"></span>
                        </div>

                    </div>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   FUENTES
========================================================= */

function renderizarFuentes() {

    const contenedor =
        document.getElementById(
            "architectureSources"
        );


    if (!contenedor) {

        return;

    }


    const health =
        arquitecturaState.health ||
        {};


    const fuente =
        health.fuenteExterna ||
        {};


    const resumen =
        health.resumenMonitoreo ||
        {};


    const elementos = [

        {
            nombre:
                "API oficial PRONABEC",
            valor:
                numero(
                    fuente.apiPronabec,
                    resumen.apiPronabec
                ),
            icono:
                "plug-zap"
        },

        {
            nombre:
                "Plataforma Nacional",
            valor:
                numero(
                    fuente.portalNacional,
                    resumen.portalNacional
                ),
            icono:
                "landmark"
        },

        {
            nombre:
                "Portal PRONABEC",
            valor:
                numero(
                    fuente.portalPronabec,
                    resumen.portalPronabec
                ),
            icono:
                "database-zap"
        },

        {
            nombre:
                "Fuente no disponible",
            valor:
                numero(
                    fuente.noDisponibles,
                    resumen.noDisponibles
                ),
            icono:
                "circle-off"
        }

    ];


    contenedor.innerHTML =
        elementos
            .map(
                item => `
                <div class="architecture-source-item">

                    <div>
                        <i data-lucide="${item.icono}"></i>

                        <span>
                            ${escaparHTML(item.nombre)}
                        </span>
                    </div>

                    <strong>
                        ${item.valor}
                    </strong>

                </div>
                `
            )
            .join("");


    actualizarIconos();

}


/* =========================================================
   ESTADO
========================================================= */

function actualizarEstado() {

    const health =
        arquitecturaState.health;


    if (!health) {

        colocarTexto(
            "architectureStatus",
            "Sin respuesta"
        );


        colocarTexto(
            "architectureStatusText",
            "No fue posible consultar /api/health"
        );


        return;

    }


    const estado =
        String(
            health.estado ||
            "DESCONOCIDO"
        )
        .toUpperCase();


    const resumen =
        health.resumenMonitoreo ||
        {};


    if (
        estado ===
        "OPERATIVO"
    ) {

        colocarTexto(
            "architectureStatus",
            "40/40 implementados"
        );


        colocarTexto(
            "architectureStatusText",
            `${numero(
                resumen.operativos,
                0
            )} servicios críticos monitoreados operativos`
        );


        return;

    }


    if (
        estado ===
        "OPERATIVO_PARCIAL"
    ) {

        colocarTexto(
            "architectureStatus",
            "Operativo parcial"
        );


        colocarTexto(
            "architectureStatusText",
            `${numero(
                resumen.noDisponibles,
                0
            )} fuente(s) oficial(es) no disponible(s)`
        );


        return;

    }


    colocarTexto(
        "architectureStatus",
        "Requiere revisión"
    );


    colocarTexto(
        "architectureStatusText",
        `${numero(
            resumen.errores,
            0
        )} servicio(s) con error`
    );

}


/* =========================================================
   PRINCIPIOS
========================================================= */

function renderizarPrincipios() {

    const contenedor =
        document.getElementById(
            "architecturePrinciples"
        );


    if (!contenedor) {

        return;

    }


    contenedor.innerHTML =
        PRINCIPIOS_SOA
            .map(
                (
                    principio,
                    indice
                ) => `
                <div class="architecture-principle">

                    <span>
                        ${String(
                            indice + 1
                        ).padStart(
                            2,
                            "0"
                        )}
                    </span>

                    <strong>
                        ${escaparHTML(principio)}
                    </strong>

                </div>
                `
            )
            .join("");

}


/* =========================================================
   CARGA / FECHA
========================================================= */

function indicarCargando() {

    colocarTexto(
        "architectureStatus",
        "Actualizando..."
    );


    colocarTexto(
        "architectureStatusText",
        "Consultando contratos y health check"
    );

}


function actualizarFecha() {

    const fecha =
        arquitecturaState.health
            ?.fecha
            ? new Date(
                arquitecturaState.health.fecha
            )
            : new Date();


    colocarTexto(
        "architectureLastUpdate",
        `Última actualización: ${fecha.toLocaleString(
            "es-PE"
        )}`
    );

}


/* =========================================================
   HELPERS
========================================================= */

function colocarTexto(
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


function numero(
    valor,
    defecto = 0
) {

    const convertido =
        Number(
            valor
        );


    return Number.isFinite(
        convertido
    )
        ? convertido
        : defecto;

}


function normalizar(
    valor
) {

    return String(
        valor ??
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


function escaparHTML(
    valor
) {

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


function escaparAtributo(
    valor
) {

    return escaparHTML(
        valor
    );

}


function actualizarIconos() {

    if (
        window.lucide
    ) {

        window.lucide.createIcons();

    }

}
