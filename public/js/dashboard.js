/* =========================================================
   EDUPERÚ SOA
   DASHBOARD NACIONAL
========================================================= */


const dashboardState = {

    consulta:
        null,

    estadisticas:
        null,

    convocatorias:
        [],

    postulaciones:
        [],

    documentos:
        [],

    convenios:
        []

};


/* =========================================================
   INICIO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        inicializarEventos();

        cargarDashboard();

    }
);


/* =========================================================
   EVENTOS
========================================================= */

function inicializarEventos() {

    const actualizar =
        document.getElementById(
            "refreshButton"
        );


    actualizar?.addEventListener(
        "click",
        () => {

            cargarDashboard(
                true
            );

        }
    );


    const botonBusqueda =
        document.getElementById(
            "nationalSearchButton"
        );


    botonBusqueda?.addEventListener(
        "click",
        aplicarBusquedaNacional
    );


    const campoBusqueda =
        document.getElementById(
            "nationalSearch"
        );


    campoBusqueda?.addEventListener(
        "keyup",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                aplicarBusquedaNacional();

            }

        }
    );


    const buscadorGlobal =
        document.getElementById(
            "globalSearch"
        );


    buscadorGlobal?.addEventListener(
        "keyup",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                const valor =
                    buscadorGlobal
                        .value
                        .trim();


                document.getElementById(
                    "nationalSearch"
                ).value =
                    valor;


                aplicarBusquedaNacional();

            }

        }
    );


    const estadoSistema =
        document.getElementById(
            "systemStatusButton"
        );


    estadoSistema?.addEventListener(
        "click",
        mostrarModalEstadoSistema
    );


    const notificacion =
        document.querySelector(
            ".notification-button"
        );


    notificacion?.addEventListener(
        "click",
        () => {

            EduPeruUI.mostrarToast(
                "Centro de alertas",
                "El módulo nacional de alertas se encuentra preparado para la siguiente etapa.",
                "info"
            );

        }
    );


    const userMenu =
        document.querySelector(
            ".user-menu"
        );


    userMenu?.addEventListener(
        "click",
        () => {

            EduPeruUI.mostrarToast(
                "Perfil",
                "El portal personalizado del estudiante se incorporará como módulo independiente.",
                "info"
            );

        }
    );


    const contenedor =
        document.getElementById(
            "dashboardOpportunities"
        );


    contenedor?.addEventListener(
        "click",
        manejarAccionOportunidad
    );

}


/* =========================================================
   CARGAR DASHBOARD
========================================================= */

async function cargarDashboard(
    manual = false
) {

    establecerCargando();


    if (
        manual
    ) {

        EduPeruUI.mostrarToast(
            "Actualizando",
            "Consultando los servicios de EduPerú.",
            "info"
        );

    }


    const resultados =
        await Promise.allSettled([

            EduPeruAPI
                .obtenerConsultaGeneral(),

            EduPeruAPI
                .obtenerEstadisticas()

        ]);


    const consultaResultado =
        resultados[0];


    const estadisticaResultado =
        resultados[1];


    // =====================================================
    // ORQUESTADOR
    // =====================================================

    if (
        consultaResultado.status ===
        "fulfilled"
    ) {

        procesarConsulta(
            consultaResultado.value
        );

    } else {

        mostrarErrorOportunidades(
            consultaResultado.reason
                ?.message ||
            "No se pudo consultar el orquestador."
        );


        marcarServiciosError();

    }


    // =====================================================
    // ESTADÍSTICAS
    // =====================================================

    if (
        estadisticaResultado.status ===
        "fulfilled"
    ) {

        procesarEstadisticas(
            estadisticaResultado.value
        );

    } else {

        calcularEstadisticasLocales();

    }


    actualizarFecha();


    EduPeruUI
        .actualizarIconos();


    if (
        manual
    ) {

        EduPeruUI.mostrarToast(
            "Actualización finalizada",
            "La información visible del dashboard ha sido actualizada.",
            "success"
        );

    }

}


/* =========================================================
   PROCESAR ORQUESTADOR
========================================================= */

function procesarConsulta(
    respuesta
) {

    const resultado =
        respuesta?.resultado;


    if (
        !resultado
    ) {

        throw new Error(
            "Respuesta inválida del Servicio Orquestador."
        );

    }


    dashboardState.consulta =
        resultado;


    dashboardState.convocatorias =
        extraerRegistros(
            resultado.convocatorias
        );


    dashboardState.postulaciones =
        extraerRegistros(
            resultado.postulaciones
        );


    dashboardState.documentos =
        extraerRegistros(
            resultado.documentos
        );


    dashboardState.convenios =
        extraerRegistros(
            resultado.convenios
        );


    mostrarEstadosServicios(
        resultado.estadoServicios ||
        {}
    );


    renderizarOportunidades(
        dashboardState.convocatorias
            .slice(
                0,
                5
            )
    );

}


/* =========================================================
   PROCESAR ESTADÍSTICAS
========================================================= */

function procesarEstadisticas(
    respuesta
) {

    const resultado =
        respuesta?.resultado;


    if (!resultado) {

        calcularEstadisticasLocales();

        return;

    }


    dashboardState.estadisticas =
        resultado;


    const resumen =
        resultado.resumen ||
        {};


    colocarTexto(
        "kpiConvocatorias",
        resumen.totalConvocatorias ??
        dashboardState.convocatorias.length
    );


    colocarTexto(
        "kpiPostulaciones",
        resumen.totalPostulaciones ??
        dashboardState.postulaciones.length
    );


    const documentosDisponibles =
        dashboardState
            .consulta
            ?.documentos
            ?.disponible !==
        false;


    colocarTexto(
        "kpiDocumentos",
        documentosDisponibles
            ? (
                resumen.totalDocumentos ??
                dashboardState.documentos.length
            )
            : "N/D"
    );


    colocarTexto(
        "kpiConvenios",
        resumen.totalConvenios ??
        dashboardState.convenios.length
    );


    colocarTexto(
        "kpiCarreras",
        resumen.totalCarreras ??
        0
    );


    colocarTexto(
        "kpiRegiones",
        resumen.totalRegiones ??
        0
    );


    llenarRegiones(
        resultado.catalogos
            ?.regiones ||
        []
    );

}


/* =========================================================
   ESTADÍSTICAS LOCALES
========================================================= */

function calcularEstadisticasLocales() {

    colocarTexto(
        "kpiConvocatorias",
        dashboardState
            .convocatorias
            .length
    );


    colocarTexto(
        "kpiPostulaciones",
        dashboardState
            .postulaciones
            .length
    );


    const documentosDisponibles =
        dashboardState
            .consulta
            ?.documentos
            ?.disponible !==
        false;


    colocarTexto(
        "kpiDocumentos",
        documentosDisponibles
            ? dashboardState
                .documentos
                .length
            : "N/D"
    );


    colocarTexto(
        "kpiConvenios",
        dashboardState
            .convenios
            .length
    );


    const carreras =
        obtenerValoresUnicos(

            [
                ...dashboardState.convocatorias,
                ...dashboardState.postulaciones
            ],

            [
                "carrera",
                "CARRERA",
                "nombreCarrera",
                "NOMBRE_CARRERA"
            ]

        );


    const regiones =
        obtenerValoresUnicos(

            [
                ...dashboardState.convocatorias,
                ...dashboardState.postulaciones,
                ...dashboardState.convenios
            ],

            [
                "region",
                "REGION",
                "departamento",
                "DEPARTAMENTO",
                "ubicacion",
                "UBICACION",
                "sede",
                "SEDE"
            ]

        );


    colocarTexto(
        "kpiCarreras",
        carreras.length
    );


    colocarTexto(
        "kpiRegiones",
        regiones.length
    );


    llenarRegiones(
        regiones
    );

}


/* =========================================================
   EXTRAER REGISTROS
========================================================= */

function extraerRegistros(
    servicio
) {

    if (!servicio) {

        return [];

    }


    const datos =
        servicio.datos ??
        servicio.resultado?.datos;


    if (
        Array.isArray(datos)
    ) {

        return datos;

    }


    if (!datos) {

        return [];

    }


    const candidatos = [

        datos.data,
        datos.rows,
        datos.records,
        datos.result?.records,
        datos.result?.data

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


    for (
        const propiedad
        in datos
    ) {

        if (
            Array.isArray(
                datos[propiedad]
            )
        ) {

            return datos[propiedad];

        }

    }


    return [];

}


/* =========================================================
   VALORES
========================================================= */

function obtenerValor(
    objeto,
    campos,
    defecto = "No especificado"
) {

    for (
        const campo
        of campos
    ) {

        if (
            objeto?.[campo] !== undefined &&
            objeto?.[campo] !== null &&
            String(
                objeto[campo]
            ).trim() !== ""
        ) {

            return objeto[campo];

        }

    }


    return defecto;

}


function obtenerValoresUnicos(
    registros,
    campos
) {

    return [

        ...new Set(

            registros

                .map(
                    registro =>
                        obtenerValor(
                            registro,
                            campos,
                            null
                        )
                )

                .filter(Boolean)

                .map(
                    valor =>
                        String(valor)
                            .trim()
                )

        )

    ].sort();

}


/* =========================================================
   KPIs
========================================================= */

function colocarTexto(
    id,
    valor
) {

    const elemento =
        document.getElementById(id);


    if (elemento) {

        elemento.textContent =
            valor;

    }

}


/* =========================================================
   REGIONES
========================================================= */

function llenarRegiones(
    regiones
) {

    const select =
        document.getElementById(
            "nationalRegion"
        );


    if (!select) {

        return;

    }


    select.innerHTML =
        `
        <option value="">
            Todo el Perú
        </option>
        `;


    regiones.forEach(
        region => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                region;


            option.textContent =
                region;


            select.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   OPORTUNIDADES
========================================================= */

function renderizarOportunidades(
    registros
) {

    const contenedor =
        document.getElementById(
            "dashboardOpportunities"
        );


    if (!contenedor) {

        return;

    }


    if (
        !registros.length
    ) {

        contenedor.innerHTML =
            `
            <div class="empty-state">

                <div class="empty-state-icon">
                    <i data-lucide="search-x"></i>
                </div>

                <h4>
                    No encontramos oportunidades
                </h4>

                <p>
                    No existen registros que coincidan
                    con los filtros seleccionados.
                </p>

            </div>
            `;


        EduPeruUI
            .actualizarIconos();


        return;

    }


    const servicio =
        dashboardState
            .consulta
            ?.convocatorias;


    const fuenteOportunidades =
        servicio?.disponible ===
        false
            ? "Fuente oficial no disponible"
            : servicio?.fuente ||
              "PRONABEC";


    contenedor.innerHTML =
        registros.map(
            registro => {

                const indice =
                    dashboardState
                        .convocatorias
                        .indexOf(
                            registro
                        );


                const convocatoria =
                    obtenerValor(

                        registro,

                        [
                            "convocatoria",
                            "CONVOCATORIA",
                            "nombreConvocatoria",
                            "NOMBRE_CONVOCATORIA",
                            "nombre",
                            "NOMBRE"
                        ],

                        "Oportunidad educativa"
                    );


                const carrera =
                    obtenerValor(

                        registro,

                        [
                            "carrera",
                            "CARRERA",
                            "nombreCarrera",
                            "NOMBRE_CARRERA"
                        ]
                    );


                const region =
                    obtenerValor(

                        registro,

                        [
                            "region",
                            "REGION",
                            "sede",
                            "SEDE",
                            "ubicacion",
                            "UBICACION",
                            "departamento",
                            "DEPARTAMENTO"
                        ]
                    );


                const estado =
                    obtenerValor(

                        registro,

                        [
                            "estado",
                            "ESTADO"
                        ],

                        "Estado no publicado"
                    );


                const favorito =
                    EduPeruUI
                        .esFavorito(
                            registro
                        );


                return `
                    <article
                        class="opportunity-card"
                        data-index="${indice}"
                    >

                        <div class="opportunity-logo">
                            ${iniciales(convocatoria)}
                        </div>


                        <div class="opportunity-body">

                            <div class="opportunity-topline">

                                <span class="opportunity-title">
                                    ${EduPeruUI.escaparHTML(convocatoria)}
                                </span>


                                <span class="opportunity-badge">

                                    ${EduPeruUI.escaparHTML(
                                        estado
                                    )}

                                </span>

                            </div>


                            <div class="opportunity-description">

                                ${EduPeruUI.escaparHTML(carrera)}

                            </div>


                            <div class="opportunity-meta">

                                <span class="opportunity-meta-item">

                                    <i data-lucide="graduation-cap"></i>

                                    ${EduPeruUI.escaparHTML(carrera)}

                                </span>


                                <span class="opportunity-meta-item">

                                    <i data-lucide="map-pin"></i>

                                    ${EduPeruUI.escaparHTML(region)}

                                </span>


                                <span class="opportunity-meta-item">

                                    <i data-lucide="database"></i>

                                    ${EduPeruUI.escaparHTML(
                                        fuenteOportunidades
                                    )}

                                </span>

                            </div>

                        </div>


                        <div class="opportunity-actions">

                            <button
                                class="
                                    small-action
                                    ${
                                        favorito
                                            ? "favorite-active"
                                            : ""
                                    }
                                "
                                data-action="favorite"
                                data-index="${indice}"
                                type="button"
                                data-tooltip="Guardar"
                            >

                                <i
                                    data-lucide="${
                                        favorito
                                            ? "heart"
                                            : "heart"
                                    }"
                                ></i>

                            </button>


                            <button
                                class="view-button"
                                data-action="detail"
                                data-index="${indice}"
                                type="button"
                            >

                                Ver detalles

                                <i data-lucide="arrow-up-right"></i>

                            </button>

                        </div>

                    </article>
                `;

            }

        ).join("");


    EduPeruUI
        .actualizarIconos();

}


/* =========================================================
   ACCIONES DE OPORTUNIDAD
========================================================= */

function manejarAccionOportunidad(
    event
) {

    const boton =
        event.target.closest(
            "[data-action]"
        );


    if (!boton) {

        return;

    }


    const indice =
        Number(
            boton.dataset.index
        );


    const registro =
        dashboardState
            .convocatorias[indice];


    if (!registro) {

        return;

    }


    if (
        boton.dataset.action ===
        "favorite"
    ) {

        const guardado =
            EduPeruUI
                .alternarFavorito(
                    registro
                );


        EduPeruUI.mostrarToast(

            guardado
                ? "Oportunidad guardada"
                : "Oportunidad eliminada",

            guardado
                ? "Se agregó a tus favoritos."
                : "Se eliminó de tus favoritos.",

            guardado
                ? "success"
                : "info"

        );


        renderizarOportunidades(
            obtenerOportunidadesVisibles()
        );

    }


    if (
        boton.dataset.action ===
        "detail"
    ) {

        mostrarDetalleOportunidad(
            registro
        );

    }

}


/* =========================================================
   DETALLE
========================================================= */

function mostrarDetalleOportunidad(
    registro
) {

    const convocatoria =
        obtenerValor(
            registro,
            [
                "convocatoria",
                "CONVOCATORIA",
                "nombre",
                "NOMBRE"
            ],
            "Oportunidad educativa"
        );


    const carrera =
        obtenerValor(
            registro,
            [
                "carrera",
                "CARRERA",
                "nombreCarrera",
                "NOMBRE_CARRERA"
            ]
        );


    const region =
        obtenerValor(
            registro,
            [
                "region",
                "REGION",
                "sede",
                "SEDE",
                "ubicacion",
                "UBICACION"
            ]
        );


    const estado =
        obtenerValor(
            registro,
            [
                "estado",
                "ESTADO"
            ],
            "Estado no publicado"
        );


    const servicioConvocatorias =
        dashboardState
            .consulta
            ?.convocatorias;


    const fuente =
        servicioConvocatorias
            ?.disponible ===
        false

            ? "Fuente oficial no disponible"

            : servicioConvocatorias
                ?.fuente ||
              "PRONABEC - Fuente oficial";


    EduPeruUI.abrirModal({

        titulo:
            convocatoria,

        subtitulo:
            "Detalle de oportunidad educativa",

        contenido:
            `
            <div class="detail-grid">

                <div class="detail-item">

                    <span>
                        Carrera
                    </span>

                    <strong>
                        ${EduPeruUI.escaparHTML(carrera)}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Región / sede
                    </span>

                    <strong>
                        ${EduPeruUI.escaparHTML(region)}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Estado
                    </span>

                    <strong>
                        ${EduPeruUI.escaparHTML(estado)}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Fuente
                    </span>

                    <strong>
                        ${EduPeruUI.escaparHTML(fuente)}
                    </strong>

                </div>


                <div class="detail-item full">

                    <span>
                        Servicio responsable
                    </span>

                    <strong>
                        ConvocatoriaService
                    </strong>

                </div>

            </div>
            `,

        footer:
            `
            <button
                class="btn btn-secondary"
                onclick="EduPeruUI.cerrarModal()"
            >
                Cerrar
            </button>
            `

    });

}


/* =========================================================
   BUSCADOR NACIONAL
========================================================= */

function aplicarBusquedaNacional() {

    const texto =
        normalizarTexto(

            document
                .getElementById(
                    "nationalSearch"
                )
                ?.value ||
            ""

        );


    const region =
        normalizarTexto(

            document
                .getElementById(
                    "nationalRegion"
                )
                ?.value ||
            ""

        );


    const filtrados =
        dashboardState
            .convocatorias
            .filter(
                registro => {

                    const contenido =
                        normalizarTexto(
                            JSON.stringify(
                                registro
                            )
                        );


                    const coincideTexto =
                        !texto ||
                        contenido.includes(
                            texto
                        );


                    const coincideRegion =
                        !region ||
                        contenido.includes(
                            region
                        );


                    return (
                        coincideTexto &&
                        coincideRegion
                    );

                }
            );


    dashboardState
        .oportunidadesVisibles =
            filtrados;


    renderizarOportunidades(
        filtrados.slice(
            0,
            10
        )
    );


    EduPeruUI.mostrarToast(

        "Búsqueda nacional",

        filtrados.length
            ? `Se encontraron ${filtrados.length} registros.`
            : "No se encontraron registros con esos criterios.",

        filtrados.length
            ? "success"
            : "warning"

    );


    document
        .getElementById(
            "dashboardOpportunities"
        )
        ?.scrollIntoView({

            behavior:
                "smooth",

            block:
                "center"

        });

}


/* =========================================================
   OPORTUNIDADES VISIBLES
========================================================= */

function obtenerOportunidadesVisibles() {

    if (
        Array.isArray(
            dashboardState
                .oportunidadesVisibles
        )
    ) {

        return dashboardState
            .oportunidadesVisibles
            .slice(
                0,
                10
            );

    }


    return dashboardState
        .convocatorias
        .slice(
            0,
            5
        );

}


/* =========================================================
   ESTADOS SOA
========================================================= */

function mostrarEstadosServicios(
    estados
) {

    actualizarServicio(
        "serviceConvocatorias",
        estados.convocatorias
    );


    actualizarServicio(
        "servicePostulaciones",
        estados.postulaciones
    );


    actualizarServicio(
        "serviceDocumentos",
        estados.documentos
    );


    actualizarServicio(
        "serviceConvenios",
        estados.convenios
    );

}


function actualizarServicio(
    id,
    estado
) {

    const elemento =
        document.getElementById(
            id
        );


    if (
        !elemento
    ) {

        return;

    }


    const texto =
        normalizarEstadoServicioVisible(
            estado
        );


    elemento.textContent =
        texto;


    elemento.className =
        "service-state";


    const normal =
        texto
            .toLowerCase();


    if (
        normal.includes(
            "no disponible"
        ) ||
        normal.includes(
            "error"
        ) ||
        normal.includes(
            "sin informacion"
        ) ||
        normal.includes(
            "sin información"
        )
    ) {

        elemento.classList.add(
            "offline"
        );

    } else {

        elemento.classList.add(
            "online"
        );

    }

}


function normalizarEstadoServicioVisible(
    estado
) {

    const texto =
        String(
            estado ||
            "Sin información"
        )
        .trim();


    const normal =
        texto
            .normalize(
                "NFD"
            )
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .toLowerCase();


    if (
        normal.includes(
            "no_disponible"
        ) ||
        normal.includes(
            "no disponible"
        )
    ) {

        return "No disponible";

    }


    if (
        normal.includes(
            "error"
        )
    ) {

        return "Error";

    }


    return texto;

}


/* =========================================================
   MODAL ESTADO DEL SISTEMA
========================================================= */

function mostrarModalEstadoSistema() {

    const estados =
        dashboardState
            .consulta
            ?.estadoServicios ||
        {};


    const contenido =
        `

        <div class="detail-grid">

            ${crearEstadoDetalle(
                "ConvocatoriaService",
                estados.convocatorias
            )}

            ${crearEstadoDetalle(
                "PostulacionService",
                estados.postulaciones
            )}

            ${crearEstadoDetalle(
                "DocumentoRequisitoService",
                estados.documentos
            )}

            ${crearEstadoDetalle(
                "ConvenioService",
                estados.convenios
            )}

            ${crearEstadoDetalle(
                "ConsultaEducativaService",
                estados.plataforma
            )}

            <div class="detail-item">

                <span>
                    EstadisticaService
                </span>

                <strong>
                    ${
                        dashboardState.estadisticas
                            ? "Operativo"
                            : "Sin información"
                    }
                </strong>

            </div>

        </div>

        `;


    EduPeruUI.abrirModal({

        titulo:
            "Estado de EduPerú SOA",

        subtitulo:
            "Supervisión de los servicios utilizados por el Dashboard.",

        contenido:
            contenido

    });

}


function crearEstadoDetalle(
    nombre,
    estado
) {

    return `
        <div class="detail-item">

            <span>
                ${EduPeruUI.escaparHTML(nombre)}
            </span>

            <strong>
                ${EduPeruUI.escaparHTML(
                    normalizarEstadoServicioVisible(
                        estado
                    )
                )}
            </strong>

        </div>
    `;

}


/* =========================================================
   CARGANDO
========================================================= */

function establecerCargando() {

    [

        "kpiConvocatorias",
        "kpiCarreras",
        "kpiConvenios",
        "kpiRegiones",
        "kpiDocumentos",
        "kpiPostulaciones"

    ].forEach(
        id =>
            colocarTexto(
                id,
                "--"
            )
    );


    const contenedor =
        document.getElementById(
            "dashboardOpportunities"
        );


    if (
        contenedor
    ) {

        contenedor.innerHTML =
            `
            <div class="loading-state">

                <div class="spinner">
                </div>

                <span>
                    Consultando servicios nacionales...
                </span>

            </div>
            `;

    }


    [

        "serviceConvocatorias",
        "servicePostulaciones",
        "serviceDocumentos",
        "serviceConvenios"

    ].forEach(
        id => {

            const elemento =
                document.getElementById(id);


            if (
                elemento
            ) {

                elemento.textContent =
                    "...";


                elemento.className =
                    "service-state loading";

            }

        }
    );

}


/* =========================================================
   ERROR
========================================================= */

function mostrarErrorOportunidades(
    mensaje
) {

    const contenedor =
        document.getElementById(
            "dashboardOpportunities"
        );


    if (
        !contenedor
    ) {

        return;

    }


    contenedor.innerHTML =
        `
        <div class="empty-state error-state">

            <div class="empty-state-icon">

                <i data-lucide="triangle-alert"></i>

            </div>

            <h4>
                No fue posible cargar las oportunidades
            </h4>

            <p>
                ${EduPeruUI.escaparHTML(mensaje)}
            </p>

        </div>
        `;


    EduPeruUI
        .actualizarIconos();

}


function marcarServiciosError() {

    [

        "serviceConvocatorias",
        "servicePostulaciones",
        "serviceDocumentos",
        "serviceConvenios"

    ].forEach(
        id =>
            actualizarServicio(
                id,
                "Error"
            )
    );

}


/* =========================================================
   FECHA
========================================================= */

function actualizarFecha() {

    const elemento =
        document.getElementById(
            "lastUpdate"
        );


    if (!elemento) {

        return;

    }


    const fecha =
        new Date();


    elemento.textContent =
        `Última actualización: ${
            fecha.toLocaleTimeString(
                "es-PE",
                {
                    hour:
                        "2-digit",

                    minute:
                        "2-digit"
                }
            )
        }`;

}


/* =========================================================
   TEXTO
========================================================= */

function normalizarTexto(
    texto
) {

    return String(
        texto || ""
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


/* =========================================================
   INICIALES
========================================================= */

function iniciales(
    texto
) {

    const partes =
        String(
            texto ||
            "EP"
        )
            .trim()
            .split(
                /\s+/
            );


    return partes
        .slice(
            0,
            2
        )

        .map(
            palabra =>
                palabra
                    .charAt(0)
                    .toUpperCase()
        )

        .join("") ||
        "EP";

}