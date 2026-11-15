/* =========================================================
   EDUPERÚ
   MÓDULO DE OPORTUNIDADES
   CORREGIDO - CarreraService + datos territoriales reales
========================================================= */


const oportunidadesState = {

    todos: [],

    filtrados: [],

    servicio: null,

    regionesServicio: [],

    comparacion: [],

    paginaActual: 1,

    porPagina: 9,

    vista: "grid"

};


/* =========================================================
   INICIO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        inicializarEventos();

        actualizarContadorFavoritos();

        cargarOportunidades();

    }
);


/* =========================================================
   EVENTOS
========================================================= */

function inicializarEventos() {

    document
        .getElementById(
            "refreshButton"
        )
        ?.addEventListener(
            "click",
            cargarOportunidades
        );


    document
        .getElementById(
            "searchButton"
        )
        ?.addEventListener(
            "click",
            aplicarFiltros
        );


    document
        .getElementById(
            "searchInput"
        )
        ?.addEventListener(
            "keyup",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    aplicarFiltros();

                }

            }
        );


    [
        "careerFilter",
        "regionFilter",
        "statusFilter",
        "sourceFilter",
        "sortSelect"

    ].forEach(
        id => {

            document
                .getElementById(
                    id
                )
                ?.addEventListener(
                    "change",
                    aplicarFiltros
                );

        }
    );


    document
        .getElementById(
            "clearFiltersButton"
        )
        ?.addEventListener(
            "click",
            limpiarFiltros
        );


    document
        .getElementById(
            "gridViewButton"
        )
        ?.addEventListener(
            "click",
            () =>
                cambiarVista(
                    "grid"
                )
        );


    document
        .getElementById(
            "listViewButton"
        )
        ?.addEventListener(
            "click",
            () =>
                cambiarVista(
                    "list"
                )
        );


    document
        .getElementById(
            "comparisonButton"
        )
        ?.addEventListener(
            "click",
            mostrarComparacion
        );


    document
        .getElementById(
            "compareTopButton"
        )
        ?.addEventListener(
            "click",
            mostrarComparacion
        );


    document
        .getElementById(
            "createAlertButton"
        )
        ?.addEventListener(
            "click",
            crearAlerta
        );


    document
        .getElementById(
            "globalSearch"
        )
        ?.addEventListener(
            "keyup",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    const buscador =
                        document.getElementById(
                            "searchInput"
                        );


                    if (
                        buscador
                    ) {

                        buscador.value =
                            event.target.value;

                    }


                    aplicarFiltros();

                }

            }
        );


    document
        .getElementById(
            "opportunitiesContainer"
        )
        ?.addEventListener(
            "click",
            manejarAccionTarjeta
        );


    document
        .getElementById(
            "paginationContainer"
        )
        ?.addEventListener(
            "click",
            manejarPaginacion
        );

}


/* =========================================================
   CARGAR DATOS
========================================================= */

async function cargarOportunidades() {

    mostrarCargando();


    try {

        const [
            carrerasRespuesta,
            regionesRespuesta
        ] =
            await Promise.all([

                obtenerJson(
                    "/api/carreras"
                ),

                obtenerJson(
                    "/api/regiones"
                )

            ]);


        const carrerasResultado =
            carrerasRespuesta
                ?.resultado ||
            carrerasRespuesta ||
            {};


        const regionesResultado =
            regionesRespuesta
                ?.resultado ||
            regionesRespuesta ||
            {};


        oportunidadesState.servicio =
            carrerasResultado;


        oportunidadesState.todos =
            extraerRegistros(
                carrerasResultado
            );


        oportunidadesState.regionesServicio =
            extraerRegistros(
                regionesResultado
            );


        oportunidadesState.filtrados = [
            ...oportunidadesState.todos
        ];


        oportunidadesState.paginaActual =
            1;


        cargarFiltros();

        ordenarResultados();

        actualizarResumen();

        renderizar();


        EduPeruUI
            ?.mostrarToast?.(
                "Oportunidades cargadas",
                `${formatearNumero(
                    oportunidadesState.todos.length
                )} registros educativos disponibles.`,
                "success"
            );

    } catch (error) {

        console.error(
            "[Oportunidades]",
            error
        );


        mostrarError(
            error.message
        );

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
            `${url}: HTTP ${respuesta.status}`
        );

    }


    return respuesta.json();

}


/* =========================================================
   EXTRAER REGISTROS
========================================================= */

function extraerRegistros(
    servicio
) {

    if (
        !servicio
    ) {

        return [];

    }


    if (
        Array.isArray(
            servicio
        )
    ) {

        return servicio;

    }


    const datos =
        servicio.datos ??
        servicio.resultado?.datos ??
        servicio.resultado ??
        servicio;


    if (
        Array.isArray(
            datos
        )
    ) {

        return datos;

    }


    const candidatos = [

        datos?.data,

        datos?.rows,

        datos?.records,

        datos?.result?.records,

        datos?.result?.data

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


    if (
        datos &&
        typeof datos ===
        "object"
    ) {

        for (
            const propiedad
            of Object.keys(
                datos
            )
        ) {

            if (
                Array.isArray(
                    datos[propiedad]
                )
            ) {

                return datos[
                    propiedad
                ];

            }

        }

    }


    return [];

}


/* =========================================================
   CAMPOS DE CARRERAS
========================================================= */

function obtenerCarrera(
    registro
) {

    const directo =
        valor(
            registro,
            [
                "carrera",
                "CARRERA",

                "nombreCarrera",
                "NOMBRE_CARRERA",

                "nombre_carrera",
                "CARRERA_NOMBRE",

                "carreraNombre",

                "programa",
                "PROGRAMA",

                "programaEstudio",
                "PROGRAMA_ESTUDIO",

                "programa_estudio",

                "nombre",
                "NOMBRE",

                "titulo",
                "TITULO"
            ],
            ""
        );


    if (
        directo
    ) {

        return String(
            directo
        )
        .trim();

    }


    return buscarCampoDinamico(
        registro,
        [
            "nombre carrera",
            "carrera elegible",
            "carrera",
            "programa estudio"
        ]
    );

}


function obtenerRegion(
    registro
) {

    const preferidos = [

        [
            "departamento",
            "DEPARTAMENTO",
            "nombreDepartamento",
            "NOMBRE_DEPARTAMENTO"
        ],

        [
            "region",
            "REGION",
            "región",
            "REGIÓN"
        ],

        [
            "sede",
            "SEDE",
            "ubicacion",
            "UBICACION",
            "ubicación",
            "UBICACIÓN"
        ],

        [
            "provincia",
            "PROVINCIA"
        ],

        [
            "distrito",
            "DISTRITO"
        ]

    ];


    for (
        const grupo
        of preferidos
    ) {

        const dato =
            valor(
                registro,
                grupo,
                ""
            );


        if (
            dato
        ) {

            return String(
                dato
            )
            .trim();

        }

    }


    return buscarCampoDinamico(
        registro,
        [
            "departamento",
            "region",
            "sede",
            "ubicacion",
            "provincia",
            "distrito"
        ]
    );

}


function obtenerInstitucion(
    registro
) {

    const directo =
        valor(
            registro,
            [
                "institucion",
                "INSTITUCION",

                "institución",
                "INSTITUCIÓN",

                "nombreInstitucion",
                "NOMBRE_INSTITUCION",

                "universidad",
                "UNIVERSIDAD",

                "instituto",
                "INSTITUTO",

                "ies",
                "IES"
            ],
            ""
        );


    if (
        directo
    ) {

        return String(
            directo
        )
        .trim();

    }


    return buscarCampoDinamico(
        registro,
        [
            "institucion",
            "universidad",
            "instituto"
        ]
    );

}


function obtenerConvocatoria(
    registro
) {

    const directo =
        valor(
            registro,
            [
                "convocatoria",
                "CONVOCATORIA",

                "nombreConvocatoria",
                "NOMBRE_CONVOCATORIA",

                "beca",
                "BECA",

                "concurso",
                "CONCURSO"
            ],
            ""
        );


    if (
        directo
    ) {

        return String(
            directo
        )
        .trim();

    }


    return buscarCampoDinamico(
        registro,
        [
            "convocatoria",
            "beca",
            "concurso"
        ]
    );

}


function obtenerEstado(
    registro
) {

    const directo =
        valor(
            registro,
            [
                "estado",
                "ESTADO",

                "vigencia",
                "VIGENCIA",

                "estadoConvocatoria",
                "ESTADO_CONVOCATORIA"
            ],
            ""
        );


    if (
        directo
    ) {

        return String(
            directo
        )
        .trim();

    }


    return buscarCampoDinamico(
        registro,
        [
            "estado",
            "vigencia"
        ]
    );

}


/* =========================================================
   CAMPO GENÉRICO / DINÁMICO
========================================================= */

function valor(
    registro,
    campos,
    defecto = "No especificado"
) {

    for (
        const campo
        of campos
    ) {

        if (
            registro?.[campo] !==
                undefined &&
            registro?.[campo] !==
                null &&
            String(
                registro[campo]
            )
            .trim() !==
                ""
        ) {

            return registro[
                campo
            ];

        }

    }


    return defecto;

}


function buscarCampoDinamico(
    registro,
    patrones
) {

    if (
        !registro ||
        typeof registro !==
            "object"
    ) {

        return "";

    }


    const entradas =
        Object.entries(
            registro
        );


    for (
        const patron
        of patrones
    ) {

        for (
            const [
                clave,
                dato
            ]
            of entradas
        ) {

            const claveNormal =
                normalizarClave(
                    clave
                );


            if (
                claveNormal
                    .includes(
                        patron
                    ) &&
                !claveNormal
                    .includes(
                        "codigo"
                    ) &&
                !claveNormal
                    .includes(
                        "id "
                    ) &&
                dato !==
                    undefined &&
                dato !==
                    null &&
                String(
                    dato
                )
                .trim()
            ) {

                return String(
                    dato
                )
                .trim();

            }

        }

    }


    return "";

}


/* =========================================================
   FILTROS
========================================================= */

function cargarFiltros() {

    const carreras =
        obtenerUnicosPorFuncion(
            oportunidadesState.todos,
            obtenerCarrera
        );


    let regiones =
        obtenerUnicosPorFuncion(
            oportunidadesState.todos,
            obtenerRegion
        );


    if (
        !regiones.length
    ) {

        regiones =
            oportunidadesState
                .regionesServicio
                .map(
                    registro => {

                        if (
                            typeof registro ===
                            "string"
                        ) {

                            return registro;

                        }


                        return valor(
                            registro,
                            [
                                "nombre",
                                "departamento",
                                "region"
                            ],
                            ""
                        );

                    }
                )
                .filter(
                    Boolean
                );

    }


    llenarSelect(
        "careerFilter",
        carreras,
        "Todas las carreras"
    );


    llenarSelect(
        "regionFilter",
        regiones,
        "Todo el Perú"
    );

}


function llenarSelect(
    id,
    registros,
    inicial
) {

    const select =
        document.getElementById(
            id
        );


    if (
        !select
    ) {

        return;

    }


    select.innerHTML =
        `<option value="">${escapar(
            inicial
        )}</option>`;


    registros
        .forEach(
            dato => {

                const texto =
                    String(
                        dato
                    )
                    .trim();


                if (
                    !texto
                ) {

                    return;

                }


                const option =
                    document
                        .createElement(
                            "option"
                        );


                option.value =
                    texto;


                option.textContent =
                    texto;


                select.appendChild(
                    option
                );

            }
        );

}


/* =========================================================
   APLICAR FILTROS
========================================================= */

function aplicarFiltros() {

    const busqueda =
        normalizar(
            document
                .getElementById(
                    "searchInput"
                )
                ?.value
        );


    const carrera =
        normalizar(
            document
                .getElementById(
                    "careerFilter"
                )
                ?.value
        );


    const region =
        normalizar(
            document
                .getElementById(
                    "regionFilter"
                )
                ?.value
        );


    const estado =
        normalizar(
            document
                .getElementById(
                    "statusFilter"
                )
                ?.value
        );


    const fuente =
        normalizar(
            document
                .getElementById(
                    "sourceFilter"
                )
                ?.value
        );


    const fuenteServicio =
        normalizar(
            oportunidadesState
                .servicio
                ?.fuente ||
            oportunidadesState
                .servicio
                ?.servicio ||
            "CarreraService"
        );


    oportunidadesState.filtrados =
        oportunidadesState
            .todos
            .filter(
                registro => {

                    const contenido =
                        normalizar(
                            JSON.stringify(
                                registro
                            )
                        );


                    const carreraRegistro =
                        normalizar(
                            obtenerCarrera(
                                registro
                            )
                        );


                    const regionRegistro =
                        normalizar(
                            obtenerRegion(
                                registro
                            )
                        );


                    const estadoRegistro =
                        normalizar(
                            obtenerEstado(
                                registro
                            )
                        );


                    const coincideBusqueda =
                        !busqueda ||
                        contenido.includes(
                            busqueda
                        );


                    const coincideCarrera =
                        !carrera ||
                        carreraRegistro ===
                            carrera;


                    const coincideRegion =
                        !region ||
                        regionRegistro ===
                            region;


                    const coincideEstado =
                        !estado ||
                        estadoRegistro.includes(
                            estado
                        );


                    const coincideFuente =
                        !fuente ||
                        fuenteServicio.includes(
                            fuente
                        );


                    return (
                        coincideBusqueda &&
                        coincideCarrera &&
                        coincideRegion &&
                        coincideEstado &&
                        coincideFuente
                    );

                }
            );


    oportunidadesState.paginaActual =
        1;


    ordenarResultados();

    actualizarResumen();

    renderizar();

}


/* =========================================================
   ORDEN
========================================================= */

function ordenarResultados() {

    const tipo =
        document
            .getElementById(
                "sortSelect"
            )
            ?.value ||
        "nombre";


    oportunidadesState
        .filtrados
        .sort(
            (
                a,
                b
            ) => {

                let valorA;
                let valorB;


                if (
                    tipo ===
                    "carrera"
                ) {

                    valorA =
                        obtenerCarrera(
                            a
                        );

                    valorB =
                        obtenerCarrera(
                            b
                        );

                } else if (
                    tipo ===
                    "region"
                ) {

                    valorA =
                        obtenerRegion(
                            a
                        );

                    valorB =
                        obtenerRegion(
                            b
                        );

                } else {

                    valorA =
                        obtenerCarrera(
                            a
                        ) ||
                        obtenerInstitucion(
                            a
                        );

                    valorB =
                        obtenerCarrera(
                            b
                        ) ||
                        obtenerInstitucion(
                            b
                        );

                }


                return String(
                    valorA
                )
                    .localeCompare(
                        String(
                            valorB
                        ),
                        "es"
                    );

            }
        );

}


/* =========================================================
   RESUMEN
========================================================= */

function actualizarResumen() {

    colocar(
        "resultadoTotal",
        formatearNumero(
            oportunidadesState
                .filtrados
                .length
        )
    );


    const conEstadoVigente =
        oportunidadesState
            .filtrados
            .filter(
                registro => {

                    const estado =
                        normalizar(
                            obtenerEstado(
                                registro
                            )
                        );


                    return (
                        estado ===
                            "vigente" ||
                        estado.includes(
                            "vigente"
                        )
                    );

                }
            )
            .length;


    colocar(
        "resultadoVigentes",
        formatearNumero(
            conEstadoVigente
        )
    );


    cambiarEtiquetaKpi(
        "resultadoVigentes",
        "Con estado vigente"
    );


    const totalCarreras =
        obtenerUnicosPorFuncion(
            oportunidadesState
                .filtrados,
            obtenerCarrera
        )
        .length;


    const totalRegiones =
        obtenerUnicosPorFuncion(
            oportunidadesState
                .filtrados,
            obtenerRegion
        )
        .length;


    colocar(
        "resultadoCarreras",
        formatearNumero(
            totalCarreras
        )
    );


    colocar(
        "resultadoRegiones",
        formatearNumero(
            totalRegiones
        )
    );


    colocar(
        "resultsDescription",
        `${formatearNumero(
            oportunidadesState
                .filtrados
                .length
        )} registros educativos en la consulta actual`
    );

}


/* =========================================================
   RENDER
========================================================= */

function renderizar() {

    const inicio =
        (
            oportunidadesState
                .paginaActual -
            1
        ) *
        oportunidadesState
            .porPagina;


    const fin =
        inicio +
        oportunidadesState
            .porPagina;


    const pagina =
        oportunidadesState
            .filtrados
            .slice(
                inicio,
                fin
            );


    renderizarTarjetas(
        pagina
    );


    renderizarPaginacion();


    EduPeruUI
        ?.actualizarIconos?.();

}


/* =========================================================
   TARJETAS
========================================================= */

function renderizarTarjetas(
    registros
) {

    const contenedor =
        document.getElementById(
            "opportunitiesContainer"
        );


    if (
        !contenedor
    ) {

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
                    Sin resultados
                </h4>

                <p>
                    Modifica los filtros para encontrar
                    otras oportunidades.
                </p>

            </div>
            `;


        return;

    }


    const fuenteServicio =
        oportunidadesState
            .servicio
            ?.fuente ||
        "PRONABEC - Plataforma Nacional de Datos Abiertos";


    contenedor.innerHTML =
        registros
            .map(
                registro => {

                    const indice =
                        oportunidadesState
                            .todos
                            .indexOf(
                                registro
                            );


                    const carrera =
                        obtenerCarrera(
                            registro
                        ) ||
                        "Carrera no especificada";


                    const institucion =
                        obtenerInstitucion(
                            registro
                        ) ||
                        "Institución no especificada";


                    const region =
                        obtenerRegion(
                            registro
                        ) ||
                        "Ubicación no especificada";


                    const convocatoria =
                        obtenerConvocatoria(
                            registro
                        );


                    const estado =
                        obtenerEstado(
                            registro
                        ) ||
                        "Estado no publicado";


                    const favorito =
                        EduPeruUI
                            ?.esFavorito?.(
                                registro
                            ) ||
                        false;


                    const comparando =
                        oportunidadesState
                            .comparacion
                            .includes(
                                indice
                            );


                    return `
                    <article class="national-opportunity-card">

                        <div class="opportunity-card-header">

                            <div class="opportunity-type-icon">
                                <i data-lucide="graduation-cap"></i>
                            </div>

                            <div class="card-header-actions">

                                <button
                                    class="icon-card-button ${comparando ? "compare-active" : ""}"
                                    data-action="compare"
                                    data-index="${indice}"
                                    title="Comparar"
                                    type="button"
                                >
                                    <i data-lucide="columns-3"></i>
                                </button>

                                <button
                                    class="icon-card-button ${favorito ? "active" : ""}"
                                    data-action="favorite"
                                    data-index="${indice}"
                                    title="Guardar"
                                    type="button"
                                >
                                    <i data-lucide="heart"></i>
                                </button>

                            </div>

                        </div>


                        <div class="opportunity-card-content">

                            <div class="card-source-row">

                                <span class="source-badge source-api">
                                    CarreraService
                                </span>

                                <span class="status-badge">
                                    ${escapar(
                                        estado
                                    )}
                                </span>

                            </div>


                            <h3 class="opportunity-name">
                                ${escapar(
                                    carrera
                                )}
                            </h3>


                            <p class="opportunity-career">
                                ${escapar(
                                    institucion
                                )}
                            </p>


                            <div class="card-information">

                                <div class="info-line">
                                    <i data-lucide="graduation-cap"></i>
                                    <span>
                                        ${escapar(
                                            carrera
                                        )}
                                    </span>
                                </div>

                                <div class="info-line">
                                    <i data-lucide="map-pin"></i>
                                    <span>
                                        ${escapar(
                                            region
                                        )}
                                    </span>
                                </div>

                                <div class="info-line">
                                    <i data-lucide="network"></i>
                                    <span>
                                        ${
                                            convocatoria
                                                ? escapar(
                                                    convocatoria
                                                )
                                                : "Fuente educativa PRONABEC"
                                        }
                                    </span>
                                </div>

                            </div>


                            <div class="opportunity-card-footer">

                                <button
                                    class="card-detail-button"
                                    data-action="detail"
                                    data-index="${indice}"
                                    type="button"
                                >
                                    Ver oportunidad
                                    <i data-lucide="arrow-right"></i>
                                </button>

                                <button
                                    class="card-requirements-button"
                                    data-action="requirements"
                                    data-index="${indice}"
                                    type="button"
                                >
                                    Requisitos
                                </button>

                            </div>

                        </div>

                    </article>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   ACCIONES TARJETAS
========================================================= */

function manejarAccionTarjeta(
    event
) {

    const boton =
        event.target.closest(
            "[data-action]"
        );


    if (
        !boton
    ) {

        return;

    }


    const indice =
        Number(
            boton.dataset.index
        );


    const registro =
        oportunidadesState
            .todos[
                indice
            ];


    if (
        !registro
    ) {

        return;

    }


    switch (
        boton.dataset.action
    ) {

        case "favorite":

            alternarFavorito(
                registro
            );

            break;


        case "compare":

            alternarComparacion(
                indice
            );

            break;


        case "detail":

            mostrarDetalle(
                registro
            );

            break;


        case "requirements":

            mostrarRequisitos(
                registro
            );

            break;

    }

}


/* =========================================================
   FAVORITOS
========================================================= */

function alternarFavorito(
    registro
) {

    if (
        !EduPeruUI
            ?.alternarFavorito
    ) {

        return;

    }


    const guardado =
        EduPeruUI
            .alternarFavorito(
                registro
            );


    actualizarContadorFavoritos();

    renderizar();


    EduPeruUI
        ?.mostrarToast?.(
            guardado
                ? "Guardada"
                : "Eliminada",

            guardado
                ? "La oportunidad se agregó a favoritos."
                : "La oportunidad se quitó de favoritos.",

            guardado
                ? "success"
                : "info"
        );

}


function actualizarContadorFavoritos() {

    const favoritos =
        EduPeruUI
            ?.obtenerFavoritos?.() ||
        [];


    colocar(
        "contadorFavoritos",
        favoritos.length
    );

}


/* =========================================================
   COMPARACIÓN
========================================================= */

function alternarComparacion(
    indice
) {

    const posicion =
        oportunidadesState
            .comparacion
            .indexOf(
                indice
            );


    if (
        posicion >=
        0
    ) {

        oportunidadesState
            .comparacion
            .splice(
                posicion,
                1
            );

    } else {

        if (
            oportunidadesState
                .comparacion
                .length >=
            3
        ) {

            EduPeruUI
                ?.mostrarToast?.(
                    "Límite de comparación",
                    "Puedes comparar hasta 3 oportunidades simultáneamente.",
                    "warning"
                );


            return;

        }


        oportunidadesState
            .comparacion
            .push(
                indice
            );

    }


    colocar(
        "comparisonCount",
        oportunidadesState
            .comparacion
            .length
    );


    renderizar();

}


async function mostrarComparacion() {

    if (
        oportunidadesState
            .comparacion
            .length < 2
    ) {

        EduPeruUI
            ?.mostrarToast?.(
                "Comparador",
                "Selecciona por lo menos 2 oportunidades.",
                "warning"
            );

        return;
    }


    const registros =
        oportunidadesState
            .comparacion
            .map(
                indice => ({
                    indice,
                    registro:
                        oportunidadesState
                            .todos[indice]
                })
            )
            .filter(
                item => Boolean(item.registro)
            );


    const selecciones =
        registros.map(
            item => ({
                idCliente:
                    item.indice,
                carrera:
                    obtenerCarrera(
                        item.registro
                    ) ||
                    "Carrera no especificada",
                institucion:
                    obtenerInstitucion(
                        item.registro
                    ) ||
                    "N/D",
                region:
                    obtenerRegion(
                        item.registro
                    ) ||
                    "N/D",
                convocatoria:
                    obtenerConvocatoria(
                        item.registro
                    ) ||
                    "",
                estado:
                    obtenerEstado(
                        item.registro
                    ) ||
                    "No publicado",
                fuente:
                    oportunidadesState
                        .servicio
                        ?.fuente ||
                    "CarreraService"
            })
        );


    EduPeruUI
        ?.mostrarToast?.(
            "Comparador",
            "Consultando información oficial para comparar...",
            "info"
        );


    try {

        const respuesta =
            await fetch(
                "/api/comparador-oportunidades",
                {
                    method:
                        "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Accept:
                            "application/json"
                    },
                    body:
                        JSON.stringify({
                            selecciones
                        })
                }
            );


        const json =
            await respuesta.json();


        if (!respuesta.ok) {
            throw new Error(
                json?.mensaje ||
                `HTTP ${respuesta.status}`
            );
        }


        renderizarComparacionOficial(
            json.resultado
        );

    } catch (error) {

        console.error(
            "[Comparador]",
            error
        );

        EduPeruUI
            ?.mostrarToast?.(
                "No se pudo comparar",
                error.message,
                "error"
            );

    }

}


function renderizarComparacionOficial(
    resultado
) {

    const items =
        resultado?.comparacion ||
        [];


    if (!items.length) {
        throw new Error(
            "El comparador no devolvió resultados."
        );
    }


    const columnas =
        items
            .map(
                item =>
                    `<th>${escapar(
                        item.carrera ||
                        "Oportunidad"
                    )}</th>`
            )
            .join("");


    const fila =
        (
            titulo,
            render
        ) => `
            <tr>
                <th>${escapar(titulo)}</th>
                ${items
                    .map(
                        item =>
                            `<td>${render(item)}</td>`
                    )
                    .join("")}
            </tr>
        `;


    const textoCelda =
        valor =>
            escapar(
                valor ||
                "N/D"
            );


    const listaCelda =
        valores => {

            if (
                !Array.isArray(valores) ||
                !valores.length
            ) {
                return `<span class="comparison-nd">N/D</span>`;
            }

            return `
                <ul class="comparison-list">
                    ${valores
                        .slice(0, 6)
                        .map(
                            valor =>
                                `<li>${escapar(
                                    typeof valor === "string"
                                        ? valor
                                        : valor?.nombre ||
                                          "N/D"
                                )}</li>`
                        )
                        .join("")}
                </ul>
            `;
        };


    const fechasCelda =
        item => {

            const fechas =
                item?.becaRelacionada
                    ?.fechas ||
                [];

            if (!fechas.length) {
                return `<span class="comparison-nd">N/D</span>`;
            }

            return `
                <ul class="comparison-list">
                    ${fechas
                        .slice(0, 5)
                        .map(
                            fecha => `
                                <li>
                                    <strong>${escapar(
                                        fecha.momento ||
                                        "Etapa"
                                    )}</strong><br>
                                    ${escapar(
                                        fecha.fechaInicio ||
                                        "N/D"
                                    )}
                                    →
                                    ${escapar(
                                        fecha.fechaFin ||
                                        "N/D"
                                    )}
                                </li>
                            `
                        )
                        .join("")}
                </ul>
            `;
        };


    const tabla = `
        <div class="comparison-summary">
            <span class="comparison-status ${
                resultado.estado === "COMPLETADA"
                    ? "ok"
                    : "warning"
            }">
                ${escapar(
                    resultado.estado ||
                    "COMPLETADA"
                )}
            </span>
            <span>
                ${escapar(
                    String(
                        resultado.totalComparadas ||
                        items.length
                    )
                )} oportunidades ·
                ${escapar(
                    String(
                        resultado.tiempoMs ||
                        0
                    )
                )} ms
            </span>
        </div>

        <div class="comparison-scroll">
            <table class="comparison-table comparison-table-rich">
                <thead>
                    <tr>
                        <th>Característica</th>
                        ${columnas}
                    </tr>
                </thead>

                <tbody>
                    ${fila(
                        "Institución",
                        item => textoCelda(item.institucion)
                    )}

                    ${fila(
                        "Región / sede",
                        item => textoCelda(item.region)
                    )}

                    ${fila(
                        "Convocatoria",
                        item => textoCelda(
                            item.convocatoria ||
                            item.becaRelacionada?.nombre
                        )
                    )}

                    ${fila(
                        "Estado publicado",
                        item => textoCelda(item.estado)
                    )}

                    ${fila(
                        "Fechas oficiales",
                        fechasCelda
                    )}

                    ${fila(
                        "Beneficios oficiales",
                        item => listaCelda(item.beneficios)
                    )}

                    ${fila(
                        "Requisitos oficiales",
                        item => listaCelda(item.requisitos)
                    )}

                    ${fila(
                        "Institución verificada",
                        item => item.institucionVerificada
                            ? `<span class="comparison-verified">Sí</span><br>${escapar(
                                item.institucionVerificada.tipo ||
                                ""
                              )}`
                            : `<span class="comparison-nd">No verificable</span>`
                    )}

                    ${fila(
                        "Fuentes",
                        item => listaCelda(item.fuentes)
                    )}
                </tbody>
            </table>
        </div>

        <div class="comparison-disclaimer">
            <i data-lucide="info"></i>
            <p>${escapar(
                resultado.advertencia ||
                "N/D indica información no verificable automáticamente en la fuente oficial."
            )}</p>
        </div>
    `;


    EduPeruUI.abrirModal({
        titulo:
            "Comparador de oportunidades",
        subtitulo:
            "Comparación enriquecida con servicios oficiales de EduPerú.",
        contenido:
            tabla
    });


    EduPeruUI
        ?.actualizarIconos?.();

}


/* =========================================================
   DETALLE
========================================================= */

function mostrarDetalle(
    registro
) {

    const carrera =
        obtenerCarrera(
            registro
        ) ||
        "Carrera no especificada";


    const institucion =
        obtenerInstitucion(
            registro
        ) ||
        "No especificada";


    const region =
        obtenerRegion(
            registro
        ) ||
        "No especificada";


    const convocatoria =
        obtenerConvocatoria(
            registro
        ) ||
        "No especificada";


    const estado =
        obtenerEstado(
            registro
        ) ||
        "No publicado";


    const fuente =
        oportunidadesState
            .servicio
            ?.fuente ||
        "PRONABEC - Plataforma Nacional de Datos Abiertos";


    EduPeruUI.abrirModal({

        titulo:
            carrera,

        subtitulo:
            "Información educativa recuperada por CarreraService",

        contenido:
            `
            <div class="detail-grid">

                <div class="detail-item">
                    <span>Carrera</span>
                    <strong>${escapar(carrera)}</strong>
                </div>

                <div class="detail-item">
                    <span>Institución</span>
                    <strong>${escapar(institucion)}</strong>
                </div>

                <div class="detail-item">
                    <span>Región / sede</span>
                    <strong>${escapar(region)}</strong>
                </div>

                <div class="detail-item">
                    <span>Estado publicado</span>
                    <strong>${escapar(estado)}</strong>
                </div>

                <div class="detail-item full">
                    <span>Convocatoria / programa relacionado</span>
                    <strong>${escapar(convocatoria)}</strong>
                </div>

                <div class="detail-item full">
                    <span>Fuente</span>
                    <strong>${escapar(fuente)}</strong>
                </div>

                <div class="detail-item full">
                    <span>Servicio SOA</span>
                    <strong>CarreraService</strong>
                </div>

            </div>
            `

    });

}


/* =========================================================
   REQUISITOS
========================================================= */

function mostrarRequisitos(
    registro
) {

    const carrera =
        obtenerCarrera(
            registro
        ) ||
        "la carrera seleccionada";


    const convocatoria =
        obtenerConvocatoria(
            registro
        );


    EduPeruUI.abrirModal({

        titulo:
            "Requisitos y documentos",

        subtitulo:
            carrera,

        contenido:
            `
            <div class="empty-state">

                <div class="empty-state-icon">
                    <i data-lucide="files"></i>
                </div>

                <h4>
                    Consulta documental independiente
                </h4>

                <p>
                    CarreraService no establece por sí solo los
                    documentos obligatorios de esta carrera.
                    ${
                        convocatoria
                            ? `El registro menciona ${escapar(
                                convocatoria
                            )}, pero los requisitos deben verificarse
                            en la publicación oficial correspondiente.`
                            : `Los requisitos deben verificarse en la
                            convocatoria oficial correspondiente.`
                    }
                </p>

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

            <a
                href="/pages/requisitos.html"
                class="btn btn-primary"
            >
                <i data-lucide="files"></i>
                Ir a Requisitos
            </a>
            `

    });

}


/* =========================================================
   ALERTA
========================================================= */

function crearAlerta() {

    const busqueda =
        document
            .getElementById(
                "searchInput"
            )
            ?.value ||
        "";


    const carrera =
        document
            .getElementById(
                "careerFilter"
            )
            ?.value ||
        "";


    const region =
        document
            .getElementById(
                "regionFilter"
            )
            ?.value ||
        "";


    const alerta = {

        id:
            Date.now(),

        busqueda,

        carrera,

        region,

        creada:
            new Date()
                .toISOString()

    };


    let alertas;


    try {

        alertas =
            JSON.parse(
                localStorage.getItem(
                    "eduperu_alertas"
                ) ||
                "[]"
            );

    } catch {

        alertas =
            [];

    }


    alertas.push(
        alerta
    );


    localStorage.setItem(
        "eduperu_alertas",
        JSON.stringify(
            alertas
        )
    );


    EduPeruUI
        ?.mostrarToast?.(
            "Alerta creada",
            "Tus criterios actuales fueron guardados en este navegador.",
            "success"
        );

}


/* =========================================================
   PAGINACIÓN COMPACTA
========================================================= */

function renderizarPaginacion() {

    const contenedor =
        document.getElementById(
            "paginationContainer"
        );


    if (
        !contenedor
    ) {

        return;

    }


    const totalPaginas =
        Math.ceil(
            oportunidadesState
                .filtrados
                .length /
            oportunidadesState
                .porPagina
        );


    if (
        totalPaginas <=
        1
    ) {

        contenedor.innerHTML =
            "";

        return;

    }


    const actual =
        oportunidadesState
            .paginaActual;


    const paginas =
        new Set([
            1,
            totalPaginas,
            actual - 2,
            actual - 1,
            actual,
            actual + 1,
            actual + 2
        ]);


    const validas =
        Array
            .from(
                paginas
            )
            .filter(
                pagina =>
                    pagina >=
                        1 &&
                    pagina <=
                        totalPaginas
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    a -
                    b
            );


    let html =
        `
        <button
            class="pagination-button"
            data-page="${actual - 1}"
            ${actual === 1 ? "disabled" : ""}
        >
            ‹
        </button>
        `;


    let anterior =
        0;


    validas.forEach(
        pagina => {

            if (
                anterior &&
                pagina -
                    anterior >
                1
            ) {

                html +=
                    `
                    <span class="pagination-ellipsis">
                        …
                    </span>
                    `;

            }


            html +=
                `
                <button
                    class="pagination-button ${pagina === actual ? "active" : ""}"
                    data-page="${pagina}"
                >
                    ${pagina}
                </button>
                `;


            anterior =
                pagina;

        }
    );


    html +=
        `
        <button
            class="pagination-button"
            data-page="${actual + 1}"
            ${actual === totalPaginas ? "disabled" : ""}
        >
            ›
        </button>
        `;


    contenedor.innerHTML =
        html;

}


function manejarPaginacion(
    event
) {

    const boton =
        event.target.closest(
            "[data-page]"
        );


    if (
        !boton ||
        boton.disabled
    ) {

        return;

    }


    const pagina =
        Number(
            boton.dataset.page
        );


    if (
        !Number.isInteger(
            pagina
        ) ||
        pagina <
            1
    ) {

        return;

    }


    oportunidadesState
        .paginaActual =
            pagina;


    renderizar();


    window.scrollTo({

        top:
            250,

        behavior:
            "smooth"

    });

}


/* =========================================================
   VISTAS
========================================================= */

function cambiarVista(
    vista
) {

    oportunidadesState.vista =
        vista;


    const contenedor =
        document.getElementById(
            "opportunitiesContainer"
        );


    contenedor
        ?.classList
        .toggle(
            "list-view",
            vista ===
                "list"
        );


    document
        .getElementById(
            "gridViewButton"
        )
        ?.classList
        .toggle(
            "active",
            vista ===
                "grid"
        );


    document
        .getElementById(
            "listViewButton"
        )
        ?.classList
        .toggle(
            "active",
            vista ===
                "list"
        );

}


/* =========================================================
   LIMPIAR
========================================================= */

function limpiarFiltros() {

    [
        "searchInput",
        "careerFilter",
        "regionFilter",
        "statusFilter",
        "sourceFilter"

    ].forEach(
        id => {

            const elemento =
                document
                    .getElementById(
                        id
                    );


            if (
                elemento
            ) {

                elemento.value =
                    "";

            }

        }
    );


    oportunidadesState.filtrados = [
        ...oportunidadesState.todos
    ];


    oportunidadesState.paginaActual =
        1;


    ordenarResultados();

    actualizarResumen();

    renderizar();

}


/* =========================================================
   ÚNICOS
========================================================= */

function obtenerUnicosPorFuncion(
    registros,
    funcion
) {

    const mapa =
        new Map();


    registros
        .forEach(
            registro => {

                const dato =
                    funcion(
                        registro
                    );


                if (
                    !dato
                ) {

                    return;

                }


                const texto =
                    String(
                        dato
                    )
                    .trim();


                const clave =
                    normalizar(
                        texto
                    );


                if (
                    clave &&
                    !mapa.has(
                        clave
                    )
                ) {

                    mapa.set(
                        clave,
                        texto
                    );

                }

            }
        );


    return Array
        .from(
            mapa.values()
        )
        .sort(
            (
                a,
                b
            ) =>
                a.localeCompare(
                    b,
                    "es"
                )
        );

}


/* =========================================================
   NORMALIZAR
========================================================= */

function normalizar(
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
        .replace(
            /[_-]+/g,
            " "
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


function normalizarClave(
    texto
) {

    return normalizar(
        texto
    );

}


/* =========================================================
   UTILIDADES
========================================================= */

function colocar(
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


function cambiarEtiquetaKpi(
    id,
    texto
) {

    const valor =
        document
            .getElementById(
                id
            );


    const contenedor =
        valor
            ?.parentElement;


    if (
        !contenedor
    ) {

        return;

    }


    const etiqueta =
        contenedor.querySelector(
            "span"
        );


    if (
        etiqueta
    ) {

        etiqueta.textContent =
            texto;

    }

}


function formatearNumero(
    numero
) {

    return new Intl
        .NumberFormat(
            "es-PE"
        )
        .format(
            Number(
                numero
            ) ||
            0
        );

}


function escapar(
    texto
) {

    if (
        EduPeruUI
            ?.escaparHTML
    ) {

        return EduPeruUI
            .escaparHTML(
                String(
                    texto ??
                    ""
                )
            );

    }


    return String(
        texto ??
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


/* =========================================================
   CARGANDO
========================================================= */

function mostrarCargando() {

    const contenedor =
        document.getElementById(
            "opportunitiesContainer"
        );


    if (
        contenedor
    ) {

        contenedor.innerHTML =
            `
            <div class="loading-state">

                <div class="spinner"></div>

                <span>
                    Consultando CarreraService...
                </span>

            </div>
            `;

    }


    colocar(
        "resultadoTotal",
        "--"
    );


    colocar(
        "resultadoVigentes",
        "--"
    );


    colocar(
        "resultadoCarreras",
        "--"
    );


    colocar(
        "resultadoRegiones",
        "--"
    );

}


/* =========================================================
   ERROR
========================================================= */

function mostrarError(
    mensaje
) {

    const contenedor =
        document.getElementById(
            "opportunitiesContainer"
        );


    if (
        contenedor
    ) {

        contenedor.innerHTML =
            `
            <div class="empty-state error-state">

                <div class="empty-state-icon">
                    <i data-lucide="triangle-alert"></i>
                </div>

                <h4>
                    No se pudieron cargar las oportunidades
                </h4>

                <p>
                    ${escapar(
                        mensaje
                    )}
                </p>

            </div>
            `;

    }


    EduPeruUI
        ?.actualizarIconos?.();


    EduPeruUI
        ?.mostrarToast?.(
            "Error",
            mensaje,
            "error"
        );

}
