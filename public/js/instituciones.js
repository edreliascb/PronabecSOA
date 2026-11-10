/* =========================================================
   EDUPERÚ
   INSTITUCIONES - VERSIÓN CORREGIDA
   Integra InstitucionService + ConvenioService + EstadisticaService
========================================================= */


const institucionesState = {

    todos: [],

    filtrados: [],

    modo: null,

    fuentePrincipal:
        "InstitucionService",

    totalConveniosOficial:
        0,

    conveniosCargados:
        [],

    paginaActual: 1,

    porPagina: 9

};


/* =========================================================
   INICIO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        inicializarEventos();

        cargarInstituciones();

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
            cargarInstituciones
        );


    document
        .getElementById(
            "institutionSearchButton"
        )
        ?.addEventListener(
            "click",
            aplicarFiltrosInstituciones
        );


    document
        .getElementById(
            "institutionSearch"
        )
        ?.addEventListener(
            "keyup",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    aplicarFiltrosInstituciones();

                }

            }
        );


    document
        .getElementById(
            "globalSearch"
        )
        ?.addEventListener(
            "keyup",
            event => {

                if (
                    event.key !==
                    "Enter"
                ) {

                    return;

                }


                const principal =
                    document.getElementById(
                        "institutionSearch"
                    );


                if (
                    principal
                ) {

                    principal.value =
                        event.target.value;

                }


                aplicarFiltrosInstituciones();

            }
        );


    [
        "institutionTypeFilter",
        "institutionRegionFilter",
        "institutionStatusFilter",
        "institutionSourceFilter",
        "institutionSort"

    ].forEach(
        id => {

            document
                .getElementById(
                    id
                )
                ?.addEventListener(
                    "change",
                    aplicarFiltrosInstituciones
                );

        }
    );


    document
        .getElementById(
            "clearInstitutionFilters"
        )
        ?.addEventListener(
            "click",
            limpiarFiltrosInstituciones
        );


    document
        .getElementById(
            "institutionContainer"
        )
        ?.addEventListener(
            "click",
            manejarAccionInstitucion
        );


    document
        .getElementById(
            "institutionPagination"
        )
        ?.addEventListener(
            "click",
            manejarPaginacionInstituciones
        );


    document
        .getElementById(
            "exploreButton"
        )
        ?.addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "institutionRegionFilter"
                    )
                    ?.focus();


                EduPeruUI
                    ?.mostrarToast?.(
                        "Exploración territorial",
                        "Selecciona una ubicación para filtrar el catálogo.",
                        "info"
                    );

            }
        );

}


/* =========================================================
   CARGAR
========================================================= */

async function cargarInstituciones() {

    mostrarCargandoInstituciones();


    try {

        const resultados =
            await Promise.allSettled([

                EduPeruAPI
                    .obtenerInstituciones(),

                obtenerJsonInstituciones(
                    "/api/convenios?pagina=1&filas=100"
                ),

                obtenerJsonInstituciones(
                    "/api/estadisticas"
                )

            ]);


        if (
            resultados[0].status !==
            "fulfilled"
        ) {

            throw new Error(
                "InstitucionService no respondió correctamente."
            );

        }


        const respuestaInstituciones =
            resultados[0].value;


        const resultadoInstituciones =
            respuestaInstituciones
                ?.resultado ||
            respuestaInstituciones ||
            {};


        institucionesState.modo =
            resultadoInstituciones
                ?.modo ||
            null;


        institucionesState.fuentePrincipal =
            resultadoInstituciones
                ?.fuentePrincipal ||
            resultadoInstituciones
                ?.fuente ||
            "InstitucionService";


        let registrosInstituciones =
            extraerRegistrosInstituciones(
                resultadoInstituciones
            );


        // No usar datos de demostración o respaldo local.
        if (
            esRespuestaRespaldo(
                resultadoInstituciones
            )
        ) {

            registrosInstituciones =
                [];

        }


        let registrosConvenios =
            [];


        if (
            resultados[1].status ===
            "fulfilled"
        ) {

            const respuestaConvenios =
                resultados[1].value;


            const resultadoConvenios =
                respuestaConvenios
                    ?.resultado ||
                respuestaConvenios ||
                {};


            if (
                !esRespuestaRespaldo(
                    resultadoConvenios
                )
            ) {

                registrosConvenios =
                    extraerRegistrosInstituciones(
                        resultadoConvenios
                    );

            }

        }


        institucionesState.conveniosCargados =
            registrosConvenios;


        if (
            resultados[2].status ===
            "fulfilled"
        ) {

            const estadisticas =
                resultados[2]
                    .value
                    ?.resultado ||
                resultados[2]
                    .value ||
                {};


            institucionesState
                .totalConveniosOficial =
                    Number(
                        estadisticas
                            ?.resumen
                            ?.totalConvenios
                    ) ||
                    registrosConvenios.length;

        } else {

            institucionesState
                .totalConveniosOficial =
                    registrosConvenios.length;

        }


        institucionesState.todos =
            construirCatalogoInstituciones(
                registrosInstituciones,
                registrosConvenios
            );


        institucionesState.filtrados = [
            ...institucionesState.todos
        ];


        institucionesState.paginaActual =
            1;


        cargarFiltrosInstituciones();

        ordenarInstituciones();

        actualizarIndicadoresInstituciones();

        renderizarInstituciones();


        EduPeruUI
            ?.mostrarToast?.(
                "Instituciones cargadas",
                `${institucionesState.todos.length} instituciones disponibles.`,
                "success"
            );


    } catch (error) {

        console.error(
            "[Instituciones]",
            error
        );


        mostrarErrorInstituciones(
            error.message
        );

    }

}


/* =========================================================
   FETCH
========================================================= */

async function obtenerJsonInstituciones(
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
   CATÁLOGO NORMALIZADO
========================================================= */

function construirCatalogoInstituciones(
    registrosInstituciones,
    registrosConvenios
) {

    const mapaConvenios =
        crearMapaConvenios(
            registrosConvenios
        );


    const mapa =
        new Map();


    registrosInstituciones
        .forEach(
            (
                registro,
                indice
            ) => {

                const normalizada =
                    normalizarInstitucion(
                        registro,
                        indice + 1
                    );


                if (
                    !normalizada.nombre
                ) {

                    return;

                }


                const clave =
                    normalizarInstituciones(
                        normalizada.nombre
                    );


                const conveniosRelacionados =
                    mapaConvenios.get(
                        clave
                    ) ||
                    [];


                enriquecerConConvenios(
                    normalizada,
                    conveniosRelacionados
                );


                if (
                    !mapa.has(
                        clave
                    )
                ) {

                    mapa.set(
                        clave,
                        normalizada
                    );

                } else {

                    fusionarInstitucion(
                        mapa.get(
                            clave
                        ),
                        normalizada
                    );

                }

            }
        );


    /*
       Si ConvenioService contiene una institución que no fue
       entregada por InstitucionService, también se incorpora.
       Solo se utilizan registros oficiales cargados.
    */

    registrosConvenios
        .forEach(
            (
                registro,
                indice
            ) => {

                const institucion =
                    normalizarConvenioComoInstitucion(
                        registro,
                        mapa.size +
                        indice +
                        1
                    );


                if (
                    !institucion.nombre
                ) {

                    return;

                }


                const clave =
                    normalizarInstituciones(
                        institucion.nombre
                    );


                if (
                    !mapa.has(
                        clave
                    )
                ) {

                    mapa.set(
                        clave,
                        institucion
                    );


                } else {

                    fusionarInstitucion(
                        mapa.get(
                            clave
                        ),
                        institucion
                    );

                }

            }
        );


    return Array.from(
        mapa.values()
    );

}


function crearMapaConvenios(
    registros
) {

    const mapa =
        new Map();


    registros.forEach(
        registro => {

            const nombre =
                obtenerNombreInstitucion(
                    registro
                );


            if (
                !nombre
            ) {

                return;

            }


            const clave =
                normalizarInstituciones(
                    nombre
                );


            if (
                !mapa.has(
                    clave
                )
            ) {

                mapa.set(
                    clave,
                    []
                );

            }


            mapa
                .get(
                    clave
                )
                .push(
                    registro
                );

        }
    );


    return mapa;

}


function normalizarInstitucion(
    registro,
    idDefecto
) {

    return {

        id:
            obtenerIdInstitucion(
                registro,
                idDefecto
            ),

        nombre:
            obtenerNombreInstitucion(
                registro
            ),

        tipo:
            obtenerTipoInstitucion(
                registro
            ),

        ubicacion:
            obtenerUbicacionInstitucion(
                registro
            ),

        estado:
            obtenerEstadoInstitucion(
                registro
            ),

        convenio:
            obtenerConvenioInstitucion(
                registro
            ),

        origen:
            obtenerOrigenInstitucion(
                registro
            ),

        fuente:
            obtenerOrigenInstitucion(
                registro
            ),

        conveniosRelacionados:
            0

    };

}


function normalizarConvenioComoInstitucion(
    registro,
    idDefecto
) {

    return {

        id:
            obtenerIdInstitucion(
                registro,
                idDefecto
            ),

        nombre:
            obtenerNombreInstitucion(
                registro
            ),

        tipo:
            obtenerTipoInstitucion(
                registro
            ),

        ubicacion:
            obtenerUbicacionInstitucion(
                registro
            ),

        estado:
            obtenerEstadoInstitucion(
                registro
            ),

        convenio:
            obtenerConvenioInstitucion(
                registro
            ),

        origen:
            "ConvenioService",

        fuente:
            obtenerOrigenInstitucion(
                registro
            ) ||
            "ConvenioService",

        conveniosRelacionados:
            1

    };

}


function enriquecerConConvenios(
    institucion,
    convenios
) {

    institucion.conveniosRelacionados =
        convenios.length;


    if (
        !convenios.length
    ) {

        return;

    }


    const tipos =
        obtenerUnicosDesdeRegistros(
            convenios,
            obtenerTipoInstitucion
        );


    const ubicaciones =
        obtenerUnicosDesdeRegistros(
            convenios,
            obtenerUbicacionInstitucion
        );


    const tiposConvenio =
        obtenerUnicosDesdeRegistros(
            convenios,
            obtenerConvenioInstitucion
        );


    const estados =
        obtenerUnicosDesdeRegistros(
            convenios,
            obtenerEstadoInstitucion
        );


    if (
        esValorGenerico(
            institucion.tipo,
            [
                "institucion educativa",
                "entidad educativa",
                "institucion"
            ]
        ) &&
        tipos.length
    ) {

        institucion.tipo =
            tipos[0];

    }


    if (
        esValorGenerico(
            institucion.ubicacion,
            [
                "nacional",
                "peru",
                "todo el peru",
                "ubicacion no especificada"
            ]
        ) &&
        ubicaciones.length
    ) {

        institucion.ubicacion =
            ubicaciones[0];

    }


    if (
        esValorGenerico(
            institucion.convenio,
            [
                "convenio educativo",
                "convenio",
                "sin convenio especificado"
            ]
        ) &&
        tiposConvenio.length
    ) {

        institucion.convenio =
            tiposConvenio[0];

    }


    if (
        esValorGenerico(
            institucion.estado,
            [
                "vigente",
                "sin dato publicado"
            ]
        ) &&
        estados.length
    ) {

        institucion.estado =
            estados[0];

    }


    institucion.origen =
        "InstitucionService + ConvenioService";

}


function fusionarInstitucion(
    destino,
    origen
) {

    if (
        esValorVacio(
            destino.tipo
        ) &&
        !esValorVacio(
            origen.tipo
        )
    ) {

        destino.tipo =
            origen.tipo;

    }


    if (
        esValorVacio(
            destino.ubicacion
        ) &&
        !esValorVacio(
            origen.ubicacion
        )
    ) {

        destino.ubicacion =
            origen.ubicacion;

    }


    if (
        esValorVacio(
            destino.convenio
        ) &&
        !esValorVacio(
            origen.convenio
        )
    ) {

        destino.convenio =
            origen.convenio;

    }


    destino.conveniosRelacionados =
        Math.max(
            Number(
                destino.conveniosRelacionados
            ) ||
            0,

            Number(
                origen.conveniosRelacionados
            ) ||
            0
        );

}


/* =========================================================
   EXTRACCIÓN FLEXIBLE DE CAMPOS
========================================================= */

function obtenerIdInstitucion(
    registro,
    defecto
) {

    const valorId =
        obtenerCampoInstitucion(
            registro,
            [
                "id",
                "ID",
                "idInstitucion",
                "ID_INSTITUCION",
                "codigo",
                "CODIGO"
            ],
            ""
        );


    const numero =
        Number(
            valorId
        );


    return Number.isFinite(
        numero
    )
        ? numero
        : defecto;

}


function obtenerNombreInstitucion(
    registro
) {

    return (
        obtenerCampoInstitucion(
            registro,
            [
                "nombre",
                "NOMBRE",
                "institucion",
                "INSTITUCION",
                "institución",
                "INSTITUCIÓN",
                "nombreInstitucion",
                "NOMBRE_INSTITUCION",
                "entidad",
                "ENTIDAD",
                "universidad",
                "UNIVERSIDAD",
                "instituto",
                "INSTITUTO",
                "ies",
                "IES",
                "razonSocial",
                "RAZON_SOCIAL"
            ],
            ""
        ) ||
        buscarCampoDinamicoInstitucion(
            registro,
            [
                "nombre institucion",
                "institucion",
                "entidad",
                "universidad",
                "instituto",
                "razon social"
            ]
        )
    );

}


function obtenerTipoInstitucion(
    registro
) {

    return (
        obtenerCampoInstitucion(
            registro,
            [
                "tipo",
                "TIPO",
                "tipoEntidad",
                "TIPO_ENTIDAD",
                "tipoInstitucion",
                "TIPO_INSTITUCION",
                "nivelInstitucion",
                "NIVEL_INSTITUCION"
            ],
            ""
        ) ||
        buscarCampoDinamicoInstitucion(
            registro,
            [
                "tipo entidad",
                "tipo institucion",
                "tipo de entidad"
            ]
        ) ||
        "Tipo no especificado"
    );

}


function obtenerUbicacionInstitucion(
    registro
) {

    return (
        obtenerCampoInstitucion(
            registro,
            [
                "ubicacion",
                "UBICACION",
                "ubicación",
                "UBICACIÓN",
                "departamento",
                "DEPARTAMENTO",
                "region",
                "REGION",
                "región",
                "REGIÓN",
                "sede",
                "SEDE",
                "provincia",
                "PROVINCIA",
                "distrito",
                "DISTRITO"
            ],
            ""
        ) ||
        buscarCampoDinamicoInstitucion(
            registro,
            [
                "departamento",
                "region",
                "ubicacion",
                "sede",
                "provincia",
                "distrito"
            ]
        ) ||
        "Ubicación no especificada"
    );

}


function obtenerConvenioInstitucion(
    registro
) {

    return (
        obtenerCampoInstitucion(
            registro,
            [
                "convenio",
                "CONVENIO",
                "tipoConvenio",
                "TIPO_CONVENIO",
                "tipo_convenio",
                "nombreConvenio",
                "NOMBRE_CONVENIO"
            ],
            ""
        ) ||
        buscarCampoDinamicoInstitucion(
            registro,
            [
                "tipo convenio",
                "nombre convenio",
                "convenio"
            ]
        ) ||
        "Sin convenio especificado"
    );

}


function obtenerEstadoInstitucion(
    registro
) {

    return (
        obtenerCampoInstitucion(
            registro,
            [
                "estado",
                "ESTADO",
                "vigencia",
                "VIGENCIA",
                "estadoConvenio",
                "ESTADO_CONVENIO"
            ],
            ""
        ) ||
        buscarCampoDinamicoInstitucion(
            registro,
            [
                "estado",
                "vigencia"
            ]
        ) ||
        "Sin dato publicado"
    );

}


function obtenerOrigenInstitucion(
    registro
) {

    return (
        obtenerCampoInstitucion(
            registro,
            [
                "origen",
                "ORIGEN",
                "fuente",
                "FUENTE",
                "fuenteDatos",
                "FUENTE_DATOS"
            ],
            ""
        ) ||
        "Fuente oficial integrada"
    );

}


function obtenerCampoInstitucion(
    registro,
    campos,
    defecto
) {

    for (
        const campo
        of campos
    ) {

        const dato =
            registro?.[
                campo
            ];


        if (
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


    return defecto;

}


function buscarCampoDinamicoInstitucion(
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

        const patronNormal =
            normalizarInstituciones(
                patron
            );


        for (
            const [
                clave,
                dato
            ]
            of entradas
        ) {

            const claveNormal =
                normalizarInstituciones(
                    clave
                )
                .replace(
                    /[_-]+/g,
                    " "
                );


            if (
                claveNormal.includes(
                    patronNormal
                ) &&
                !claveNormal.includes(
                    "codigo"
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
   EXTRAER RESPUESTAS
========================================================= */

function extraerRegistrosInstituciones(
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
                    datos[
                        propiedad
                    ]
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


function esRespuestaRespaldo(
    resultado
) {

    const texto =
        normalizarInstituciones(
            [
                resultado?.modo,
                resultado?.fuente,
                resultado?.fuentePrincipal
            ]
            .filter(
                Boolean
            )
            .join(
                " "
            )
        );


    return texto.includes(
        "respaldo"
    );

}


/* =========================================================
   FILTROS
========================================================= */

function cargarFiltrosInstituciones() {

    const tipos =
        obtenerUnicosInstituciones(
            "tipo"
        )
        .filter(
            valor =>
                !esValorVacio(
                    valor
                )
        );


    const ubicaciones =
        obtenerUnicosInstituciones(
            "ubicacion"
        )
        .filter(
            valor =>
                !esValorVacio(
                    valor
                )
        );


    llenarSelectInstituciones(
        "institutionTypeFilter",
        tipos,
        "Todos los tipos"
    );


    llenarSelectInstituciones(
        "institutionRegionFilter",
        ubicaciones,
        "Todo el Perú"
    );

}


function llenarSelectInstituciones(
    id,
    valores,
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


    const valorActual =
        select.value;


    select.innerHTML =
        `<option value="">${escaparInstituciones(
            inicial
        )}</option>`;


    valores.forEach(
        dato => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                dato;


            option.textContent =
                dato;


            select.appendChild(
                option
            );

        }
    );


    if (
        valores.includes(
            valorActual
        )
    ) {

        select.value =
            valorActual;

    }

}


/* =========================================================
   APLICAR FILTROS
========================================================= */

function aplicarFiltrosInstituciones() {

    const texto =
        normalizarInstituciones(
            document
                .getElementById(
                    "institutionSearch"
                )
                ?.value
        );


    const tipo =
        normalizarInstituciones(
            document
                .getElementById(
                    "institutionTypeFilter"
                )
                ?.value
        );


    const region =
        normalizarInstituciones(
            document
                .getElementById(
                    "institutionRegionFilter"
                )
                ?.value
        );


    const estado =
        normalizarInstituciones(
            document
                .getElementById(
                    "institutionStatusFilter"
                )
                ?.value
        );


    const fuente =
        normalizarInstituciones(
            document
                .getElementById(
                    "institutionSourceFilter"
                )
                ?.value
        );


    institucionesState.filtrados =
        institucionesState
            .todos
            .filter(
                institucion => {

                    const contenido =
                        normalizarInstituciones(
                            JSON.stringify(
                                institucion
                            )
                        );


                    const coincideTexto =
                        !texto ||
                        contenido.includes(
                            texto
                        );


                    const coincideTipo =
                        !tipo ||
                        normalizarInstituciones(
                            institucion.tipo
                        ) ===
                        tipo;


                    const coincideRegion =
                        !region ||
                        normalizarInstituciones(
                            institucion.ubicacion
                        ) ===
                        region;


                    const coincideEstado =
                        !estado ||
                        normalizarInstituciones(
                            institucion.estado
                        )
                        .includes(
                            estado
                        );


                    const fuenteRegistro =
                        normalizarInstituciones(
                            [
                                institucion.origen,
                                institucion.fuente,
                                institucionesState
                                    .fuentePrincipal
                            ]
                            .filter(
                                Boolean
                            )
                            .join(
                                " "
                            )
                        );


                    const coincideFuente =
                        !fuente ||
                        fuenteRegistro.includes(
                            fuente
                        );


                    return (
                        coincideTexto &&
                        coincideTipo &&
                        coincideRegion &&
                        coincideEstado &&
                        coincideFuente
                    );

                }
            );


    institucionesState.paginaActual =
        1;


    ordenarInstituciones();

    actualizarIndicadoresInstituciones();

    renderizarInstituciones();

}


/* =========================================================
   ORDEN
========================================================= */

function ordenarInstituciones() {

    const criterio =
        document
            .getElementById(
                "institutionSort"
            )
            ?.value ||
        "nombre";


    institucionesState
        .filtrados
        .sort(
            (
                a,
                b
            ) => {

                const valorA =
                    String(
                        a[
                            criterio
                        ] ||
                        ""
                    );


                const valorB =
                    String(
                        b[
                            criterio
                        ] ||
                        ""
                    );


                return valorA
                    .localeCompare(
                        valorB,
                        "es"
                    );

            }
        );

}


/* =========================================================
   INDICADORES
========================================================= */

function actualizarIndicadoresInstituciones() {

    colocarInstituciones(
        "totalInstituciones",
        formatearNumeroInstituciones(
            institucionesState
                .filtrados
                .length
        )
    );


    const ubicaciones =
        obtenerUnicosDesdeRegistros(
            institucionesState
                .filtrados,
            item =>
                item.ubicacion
        )
        .filter(
            valor =>
                !esValorGenerico(
                    valor,
                    [
                        "ubicacion no especificada",
                        "nacional",
                        "todo el peru"
                    ]
                )
        );


    const tipos =
        obtenerUnicosDesdeRegistros(
            institucionesState
                .filtrados,
            item =>
                item.tipo
        )
        .filter(
            valor =>
                !esValorGenerico(
                    valor,
                    [
                        "tipo no especificado"
                    ]
                )
        );


    colocarInstituciones(
        "totalUbicaciones",
        formatearNumeroInstituciones(
            ubicaciones.length
        )
    );


    colocarInstituciones(
        "totalTipos",
        formatearNumeroInstituciones(
            tipos.length
        )
    );


    /*
       Este KPI representa el total reportado por
       EstadisticaService/ConvenioService, no la cantidad de
       nombres de convenio distintos.
    */

    colocarInstituciones(
        "totalConveniosInstitucion",
        formatearNumeroInstituciones(
            institucionesState
                .totalConveniosOficial
        )
    );


    cambiarEtiquetaIndicador(
        "totalConveniosInstitucion",
        "Convenios oficiales"
    );


    colocarInstituciones(
        "institutionResultText",
        `${institucionesState.filtrados.length} instituciones en la consulta actual`
    );

}


/* =========================================================
   RENDER
========================================================= */

function renderizarInstituciones() {

    const inicio =
        (
            institucionesState
                .paginaActual -
            1
        ) *
        institucionesState
            .porPagina;


    const pagina =
        institucionesState
            .filtrados
            .slice(
                inicio,
                inicio +
                institucionesState
                    .porPagina
            );


    renderizarTarjetasInstituciones(
        pagina
    );


    renderizarPaginacionInstituciones();


    EduPeruUI
        ?.actualizarIconos?.();

}


/* =========================================================
   TARJETAS
========================================================= */

function renderizarTarjetasInstituciones(
    instituciones
) {

    const contenedor =
        document.getElementById(
            "institutionContainer"
        );


    if (
        !contenedor
    ) {

        return;

    }


    if (
        !instituciones.length
    ) {

        contenedor.innerHTML =
            `
            <div class="empty-state">

                <div class="empty-state-icon">
                    <i data-lucide="building-x"></i>
                </div>

                <h4>
                    No encontramos instituciones
                </h4>

                <p>
                    Prueba con otra búsqueda o modifica los filtros.
                </p>

            </div>
            `;


        return;

    }


    contenedor.innerHTML =
        instituciones
            .map(
                institucion => {

                    return `
                    <article class="institution-card">

                        <div class="institution-card-top">

                            <div class="institution-logo">
                                ${escaparInstituciones(
                                    obtenerInicialesInstitucion(
                                        institucion.nombre
                                    )
                                )}
                            </div>

                            <span class="institution-state">
                                ${escaparInstituciones(
                                    institucion.estado
                                )}
                            </span>

                        </div>


                        <div class="institution-card-body">

                            <span class="institution-source-badge">
                                Fuente oficial integrada
                            </span>


                            <h3>
                                ${escaparInstituciones(
                                    institucion.nombre
                                )}
                            </h3>


                            <p class="institution-type">
                                ${escaparInstituciones(
                                    institucion.tipo
                                )}
                            </p>


                            <div class="institution-info">

                                <div class="institution-info-row">
                                    <i data-lucide="map-pin"></i>
                                    <span>
                                        ${escaparInstituciones(
                                            institucion.ubicacion
                                        )}
                                    </span>
                                </div>


                                <div class="institution-info-row">
                                    <i data-lucide="handshake"></i>
                                    <span>
                                        ${escaparInstituciones(
                                            institucion.convenio
                                        )}
                                    </span>
                                </div>


                                <div class="institution-info-row">
                                    <i data-lucide="network"></i>
                                    <span>
                                        ${escaparInstituciones(
                                            institucion.origen
                                        )}
                                    </span>
                                </div>

                            </div>


                            <div class="institution-card-actions">

                                <button
                                    class="institution-detail-button"
                                    data-action="detail"
                                    data-id="${institucion.id}"
                                    type="button"
                                >
                                    Ver institución
                                    <i data-lucide="arrow-right"></i>
                                </button>


                                <button
                                    class="institution-convenio-button"
                                    data-action="convenio"
                                    data-id="${institucion.id}"
                                    type="button"
                                >
                                    Convenio
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
   ACCIONES
========================================================= */

function manejarAccionInstitucion(
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


    const id =
        Number(
            boton.dataset.id
        );


    const institucion =
        institucionesState
            .todos
            .find(
                item =>
                    Number(
                        item.id
                    ) ===
                    id
            );


    if (
        !institucion
    ) {

        return;

    }


    if (
        boton.dataset.action ===
        "detail"
    ) {

        mostrarDetalleInstitucionLocal(
            institucion
        );

    }


    if (
        boton.dataset.action ===
        "convenio"
    ) {

        mostrarConvenioInstitucion(
            institucion
        );

    }

}


/* =========================================================
   DETALLE
========================================================= */

function mostrarDetalleInstitucionLocal(
    institucion
) {

    EduPeruUI.abrirModal({

        titulo:
            "Ficha institucional",

        subtitulo:
            institucion.nombre,

        contenido:
            `

            <div class="institution-detail-header">

                <div class="institution-detail-logo">
                    ${escaparInstituciones(
                        obtenerInicialesInstitucion(
                            institucion.nombre
                        )
                    )}
                </div>

                <div>
                    <strong>
                        ${escaparInstituciones(
                            institucion.nombre
                        )}
                    </strong>

                    <span>
                        ${escaparInstituciones(
                            institucion.tipo
                        )}
                    </span>
                </div>

            </div>


            <div class="detail-grid">

                <div class="detail-item">
                    <span>Tipo</span>
                    <strong>
                        ${escaparInstituciones(
                            institucion.tipo
                        )}
                    </strong>
                </div>


                <div class="detail-item">
                    <span>Ubicación</span>
                    <strong>
                        ${escaparInstituciones(
                            institucion.ubicacion
                        )}
                    </strong>
                </div>


                <div class="detail-item">
                    <span>Estado</span>
                    <strong>
                        ${escaparInstituciones(
                            institucion.estado
                        )}
                    </strong>
                </div>


                <div class="detail-item">
                    <span>Convenio</span>
                    <strong>
                        ${escaparInstituciones(
                            institucion.convenio
                        )}
                    </strong>
                </div>


                <div class="detail-item">
                    <span>Convenios relacionados en lote cargado</span>
                    <strong>
                        ${formatearNumeroInstituciones(
                            institucion
                                .conveniosRelacionados
                        )}
                    </strong>
                </div>


                <div class="detail-item full">
                    <span>Fuente / composición</span>
                    <strong>
                        ${escaparInstituciones(
                            institucion.origen
                        )}
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

            <a
                href="/pages/convenios.html"
                class="btn btn-primary"
            >
                <i data-lucide="handshake"></i>
                Explorar convenios
            </a>
            `

    });

}


/* =========================================================
   CONVENIO
========================================================= */

function mostrarConvenioInstitucion(
    institucion
) {

    EduPeruUI.abrirModal({

        titulo:
            "Convenio institucional",

        subtitulo:
            institucion.nombre,

        contenido:
            `

            <div class="detail-grid">

                <div class="detail-item full">
                    <span>Tipo de convenio</span>
                    <strong>
                        ${escaparInstituciones(
                            institucion.convenio
                        )}
                    </strong>
                </div>


                <div class="detail-item">
                    <span>Institución</span>
                    <strong>
                        ${escaparInstituciones(
                            institucion.nombre
                        )}
                    </strong>
                </div>


                <div class="detail-item">
                    <span>Ubicación</span>
                    <strong>
                        ${escaparInstituciones(
                            institucion.ubicacion
                        )}
                    </strong>
                </div>


                <div class="detail-item">
                    <span>Registros relacionados</span>
                    <strong>
                        ${formatearNumeroInstituciones(
                            institucion
                                .conveniosRelacionados
                        )}
                    </strong>
                </div>


                <div class="detail-item full">
                    <span>Fuente</span>
                    <strong>
                        ConvenioService / InstitucionService
                    </strong>
                </div>

            </div>
            `,

        footer:
            `
            <a
                href="/pages/convenios.html"
                class="btn btn-primary"
            >
                <i data-lucide="handshake"></i>
                Ir a Convenios
            </a>
            `

    });

}


/* =========================================================
   PAGINACIÓN COMPACTA
========================================================= */

function renderizarPaginacionInstituciones() {

    const contenedor =
        document.getElementById(
            "institutionPagination"
        );


    if (
        !contenedor
    ) {

        return;

    }


    const paginas =
        Math.ceil(
            institucionesState
                .filtrados
                .length /
            institucionesState
                .porPagina
        );


    if (
        paginas <=
        1
    ) {

        contenedor.innerHTML =
            "";

        return;

    }


    const actual =
        institucionesState
            .paginaActual;


    const candidatas =
        new Set([
            1,
            paginas,
            actual - 2,
            actual - 1,
            actual,
            actual + 1,
            actual + 2
        ]);


    const visibles =
        Array.from(
            candidatas
        )
        .filter(
            pagina =>
                pagina >=
                    1 &&
                pagina <=
                    paginas
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
            type="button"
            ${actual === 1 ? "disabled" : ""}
        >
            ‹
        </button>
        `;


    let anterior =
        0;


    visibles.forEach(
        pagina => {

            if (
                anterior &&
                pagina -
                    anterior >
                1
            ) {

                html +=
                    `<span class="pagination-ellipsis">…</span>`;

            }


            html +=
                `
                <button
                    class="pagination-button ${pagina === actual ? "active" : ""}"
                    data-page="${pagina}"
                    type="button"
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
            type="button"
            ${actual === paginas ? "disabled" : ""}
        >
            ›
        </button>
        `;


    contenedor.innerHTML =
        html;

}


function manejarPaginacionInstituciones(
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


    institucionesState.paginaActual =
        pagina;


    renderizarInstituciones();


    window.scrollTo({

        top:
            300,

        behavior:
            "smooth"

    });

}


/* =========================================================
   LIMPIAR
========================================================= */

function limpiarFiltrosInstituciones() {

    [
        "institutionSearch",
        "institutionTypeFilter",
        "institutionRegionFilter",
        "institutionStatusFilter",
        "institutionSourceFilter"

    ].forEach(
        id => {

            const elemento =
                document.getElementById(
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


    institucionesState.filtrados = [
        ...institucionesState.todos
    ];


    institucionesState.paginaActual =
        1;


    ordenarInstituciones();

    actualizarIndicadoresInstituciones();

    renderizarInstituciones();

}


/* =========================================================
   ÚNICOS
========================================================= */

function obtenerUnicosInstituciones(
    propiedad
) {

    return obtenerUnicosDesdeRegistros(
        institucionesState.todos,
        item =>
            item[
                propiedad
            ]
    );

}


function obtenerUnicosDesdeRegistros(
    registros,
    funcion
) {

    const mapa =
        new Map();


    registros.forEach(
        registro => {

            const dato =
                funcion(
                    registro
                );


            if (
                dato ===
                    undefined ||
                dato ===
                    null
            ) {

                return;

            }


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


            const clave =
                normalizarInstituciones(
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


    return Array.from(
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
   UTILIDADES
========================================================= */

function normalizarInstituciones(
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


function esValorVacio(
    valor
) {

    const texto =
        normalizarInstituciones(
            valor
        );


    return (
        !texto ||
        texto.includes(
            "no especific"
        ) ||
        texto.includes(
            "sin dato"
        )
    );

}


function esValorGenerico(
    valor,
    genericos
) {

    const normal =
        normalizarInstituciones(
            valor
        );


    return (
        esValorVacio(
            valor
        ) ||
        genericos
            .map(
                normalizarInstituciones
            )
            .includes(
                normal
            )
    );

}


function obtenerInicialesInstitucion(
    nombre
) {

    return String(
        nombre ||
        "EP"
    )
        .trim()
        .split(
            /\s+/
        )
        .slice(
            0,
            2
        )
        .map(
            palabra =>
                palabra
                    .charAt(
                        0
                    )
                    .toUpperCase()
        )
        .join("");

}


function colocarInstituciones(
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


function formatearNumeroInstituciones(
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


function cambiarEtiquetaIndicador(
    id,
    texto
) {

    const elemento =
        document.getElementById(
            id
        );


    const contenedor =
        elemento?.parentElement;


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


function escaparInstituciones(
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

function mostrarCargandoInstituciones() {

    const contenedor =
        document.getElementById(
            "institutionContainer"
        );


    if (
        contenedor
    ) {

        contenedor.innerHTML =
            `
            <div class="loading-state">

                <div class="spinner"></div>

                <span>
                    Consultando InstitucionService y ConvenioService...
                </span>

            </div>
            `;

    }


    [
        "totalInstituciones",
        "totalUbicaciones",
        "totalTipos",
        "totalConveniosInstitucion"

    ].forEach(
        id =>
            colocarInstituciones(
                id,
                "--"
            )
    );

}


/* =========================================================
   ERROR
========================================================= */

function mostrarErrorInstituciones(
    mensaje
) {

    const contenedor =
        document.getElementById(
            "institutionContainer"
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
                    No se pudieron cargar las instituciones
                </h4>

                <p>
                    ${escaparInstituciones(
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
