/* =========================================================
   EDUPERÚ
   MÓDULO DE CONVENIOS
========================================================= */


const conveniosState = {

    todos: [],

    filtrados: [],

    instituciones: [],

    modo: null,

    fuente:
        "ConvenioService",

    disponible:
        true,

    totalOficial:
        0,

    paginaActual: 1,

    porPagina: 9

};


/* =========================================================
   INICIO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        inicializarEventosConvenios();

        cargarConvenios();

    }
);


/* =========================================================
   EVENTOS
========================================================= */

function inicializarEventosConvenios() {

    document
        .getElementById(
            "refreshButton"
        )
        ?.addEventListener(
            "click",
            cargarConvenios
        );


    document
        .getElementById(
            "agreementSearchButton"
        )
        ?.addEventListener(
            "click",
            aplicarFiltrosConvenios
        );


    document
        .getElementById(
            "agreementSearch"
        )
        ?.addEventListener(
            "keyup",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    aplicarFiltrosConvenios();

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
                    event.key ===
                    "Enter"
                ) {

                    document
                        .getElementById(
                            "agreementSearch"
                        ).value =
                            event.target.value;


                    aplicarFiltrosConvenios();

                }

            }
        );


    [
        "agreementInstitutionFilter",
        "agreementLocationFilter",
        "agreementTypeFilter",
        "agreementSourceFilter",
        "agreementSort"

    ].forEach(
        id => {

            document
                .getElementById(id)
                ?.addEventListener(
                    "change",
                    aplicarFiltrosConvenios
                );

        }
    );


    document
        .getElementById(
            "clearAgreementFilters"
        )
        ?.addEventListener(
            "click",
            limpiarFiltrosConvenios
        );


    document
        .getElementById(
            "agreementContainer"
        )
        ?.addEventListener(
            "click",
            manejarAccionConvenio
        );


    document
        .getElementById(
            "agreementPagination"
        )
        ?.addEventListener(
            "click",
            manejarPaginacionConvenios
        );


    document
        .getElementById(
            "openStatsButton"
        )
        ?.addEventListener(
            "click",
            mostrarResumenConvenios
        );

}


/* =========================================================
   CARGAR
========================================================= */

async function cargarConvenios() {

    mostrarCargandoConvenios();


    try {

        const resultados =
            await Promise.allSettled([

                EduPeruAPI
                    .obtenerConvenios(
                        1,
                        100
                    ),

                EduPeruAPI
                    .obtenerInstituciones(),

                EduPeruAPI
                    .obtenerEstadisticas()

            ]);


        const convenioResultado =
            resultados[0];


        if (
            convenioResultado.status !==
            "fulfilled"
        ) {

            throw convenioResultado.reason;

        }


        const respuesta =
            convenioResultado.value;


        const resultado =
            respuesta?.resultado ||
            respuesta;


        if (
            !resultado
        ) {

            throw new Error(
                "ConvenioService devolvió una respuesta inválida."
            );

        }


        conveniosState.modo =
            resultado?.modo ||
            null;


        conveniosState.fuente =
            resultado?.fuente ||
            resultado?.fuentePrincipal ||
            "ConvenioService";


        conveniosState.disponible =
            resultado?.disponible !==
            false;


        /*
           Política del proyecto:
           no mostrar datos de demostración, ejemplo ni respaldo local.
        */

        if (
            esFuenteNoOficialConvenio(
                resultado
            )
        ) {

            conveniosState.todos =
                [];

            conveniosState.filtrados =
                [];

            conveniosState.totalOficial =
                0;


            throw new Error(
                "La fuente oficial de ConvenioService no está disponible. EduPerú no mostrará datos de respaldo o demostración."
            );

        }


        const registros =
            extraerDatosConvenio(
                resultado
            );


        conveniosState.todos =
            registros
                .map(
                    (
                        registro,
                        indice
                    ) =>
                        normalizarRegistroConvenio(
                            registro,
                            indice
                        )
                )
                .filter(
                    convenio =>
                        convenio.institucion !==
                        "Institución no especificada"
                );


        conveniosState.filtrados = [
            ...conveniosState.todos
        ];


        if (
            resultados[1].status ===
            "fulfilled"
        ) {

            conveniosState.instituciones =
                extraerInstitucionesRelacionadas(
                    resultados[1].value
                );

        } else {

            conveniosState.instituciones =
                [];

        }


        let totalEstadisticas =
            0;


        if (
            resultados[2].status ===
            "fulfilled"
        ) {

            totalEstadisticas =
                Number(
                    resultados[2]
                        .value
                        ?.resultado
                        ?.resumen
                        ?.totalConvenios
                ) ||
                0;

        }


        conveniosState.totalOficial =
            totalEstadisticas ||
            extraerTotalConvenio(
                resultado
            ) ||
            conveniosState.todos.length;


        conveniosState.paginaActual =
            1;


        cargarFiltrosConvenios();

        ordenarConvenios();

        actualizarKpisConvenios();

        renderizarConvenios();


        const mensajeCarga =
            conveniosState.totalOficial >
            conveniosState.todos.length

                ? `${conveniosState.todos.length} registros cargados de ${formatearNumeroConvenio(
                    conveniosState.totalOficial
                )} reportados por el servicio.`

                : `${conveniosState.todos.length} registros disponibles.`;


        EduPeruUI.mostrarToast(
            "Convenios cargados",
            mensajeCarga,
            "success"
        );


    } catch (error) {

        console.error(
            "[Convenios]",
            error
        );


        actualizarKpisConvenios();


        mostrarErrorConvenios(
            error.message
        );

    }

}


/* =========================================================
   EXTRAER DATOS
========================================================= */

function extraerDatosConvenio(
    resultado
) {

    const datos =
        resultado?.datos;


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
   NORMALIZAR REGISTRO
========================================================= */

function normalizarRegistroConvenio(
    registro,
    indice
) {

    const idOriginal =
        obtenerValorConvenio(
            registro,
            [
                "id",
                "ID",
                "idConvenio",
                "ID_CONVENIO",
                "codigo",
                "CODIGO"
            ],
            ""
        );


    const idNumerico =
        Number(
            idOriginal
        );


    return {

        id:
            Number.isFinite(
                idNumerico
            )
                ? idNumerico
                : indice + 1,

        institucion:
            obtenerValorConvenioFlexible(
                registro,
                [
                    "entidad",
                    "ENTIDAD",
                    "institucion",
                    "INSTITUCION",
                    "institución",
                    "INSTITUCIÓN",
                    "nombreInstitucion",
                    "NOMBRE_INSTITUCION",
                    "nombre_institucion",
                    "nombre",
                    "NOMBRE",
                    "universidad",
                    "UNIVERSIDAD",
                    "instituto",
                    "INSTITUTO",
                    "ies",
                    "IES",
                    "razonSocial",
                    "RAZON_SOCIAL"
                ],
                [
                    "nombre institucion",
                    "institucion",
                    "entidad",
                    "universidad",
                    "instituto",
                    "razon social"
                ],
                "Institución no especificada"
            ),

        tipoInstitucion:
            obtenerValorConvenioFlexible(
                registro,
                [
                    "tipoEntidad",
                    "TIPO_ENTIDAD",
                    "tipo_entidad",
                    "tipoInstitucion",
                    "TIPO_INSTITUCION",
                    "tipo_institucion",
                    "nivelInstitucion",
                    "NIVEL_INSTITUCION"
                ],
                [
                    "tipo entidad",
                    "tipo institucion",
                    "tipo de entidad"
                ],
                "Tipo de institución no especificado"
            ),

        tipo:
            obtenerValorConvenioFlexible(
                registro,
                [
                    "tipoConvenio",
                    "TIPO_CONVENIO",
                    "tipo_convenio",
                    "convenio",
                    "CONVENIO",
                    "nombreConvenio",
                    "NOMBRE_CONVENIO"
                ],
                [
                    "tipo convenio",
                    "nombre convenio",
                    "convenio"
                ],
                "Tipo de convenio no especificado"
            ),

        ubicacion:
            obtenerValorConvenioFlexible(
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
                [
                    "departamento",
                    "region",
                    "ubicacion",
                    "sede",
                    "provincia",
                    "distrito"
                ],
                "Ubicación no especificada"
            ),

        estado:
            obtenerValorConvenioFlexible(
                registro,
                [
                    "estado",
                    "ESTADO",
                    "vigencia",
                    "VIGENCIA",
                    "estadoConvenio",
                    "ESTADO_CONVENIO"
                ],
                [
                    "estado convenio",
                    "vigencia",
                    "estado"
                ],
                "Estado no especificado"
            ),

        fuente:
            obtenerValorConvenioFlexible(
                registro,
                [
                    "fuente",
                    "FUENTE",
                    "origen",
                    "ORIGEN"
                ],
                [
                    "fuente",
                    "origen"
                ],
                conveniosState.fuente ||
                "ConvenioService"
            ),

        original:
            registro

    };

}


/* =========================================================
   OBTENER CAMPO
========================================================= */

function obtenerValorConvenio(
    objeto,
    campos,
    defecto
) {

    for (
        const campo
        of campos
    ) {

        if (
            objeto?.[campo] !==
                undefined &&
            objeto?.[campo] !==
                null &&
            String(
                objeto[campo]
            )
            .trim() !==
                ""
        ) {

            return String(
                objeto[campo]
            )
            .trim();

        }

    }


    return defecto;

}


function obtenerValorConvenioFlexible(
    objeto,
    campos,
    patrones,
    defecto
) {

    const directo =
        obtenerValorConvenio(
            objeto,
            campos,
            ""
        );


    if (
        directo
    ) {

        return directo;

    }


    const dinamico =
        buscarCampoDinamicoConvenio(
            objeto,
            patrones
        );


    return dinamico ||
        defecto;

}


function buscarCampoDinamicoConvenio(
    objeto,
    patrones
) {

    if (
        !objeto ||
        typeof objeto !==
            "object"
    ) {

        return "";

    }


    const entradas =
        Object.entries(
            objeto
        );


    for (
        const patron
        of patrones
    ) {

        const patronNormal =
            normalizarTextoConvenio(
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
                normalizarTextoConvenio(
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


function extraerTotalConvenio(
    resultado
) {

    const candidatos = [

        resultado?.total,

        resultado?.totalRegistros,

        resultado?.cantidad,

        resultado?.datos?.total,

        resultado?.datos?.totalRegistros,

        resultado?.datos?.count,

        resultado?.datos?.result?.total,

        resultado?.datos?.result?.count

    ];


    for (
        const candidato
        of candidatos
    ) {

        const numero =
            Number(
                candidato
            );


        if (
            Number.isFinite(
                numero
            ) &&
            numero >=
                0
        ) {

            return numero;

        }

    }


    return 0;

}


function extraerInstitucionesRelacionadas(
    respuesta
) {

    const resultado =
        respuesta?.resultado ||
        respuesta ||
        {};


    const datos =
        resultado?.datos;


    if (
        Array.isArray(
            datos
        )
    ) {

        return datos;

    }


    return [];

}


function esFuenteNoOficialConvenio(
    resultado
) {

    const texto =
        normalizarTextoConvenio(
            [
                resultado?.modo,
                resultado?.fuente,
                resultado?.fuentePrincipal,
                resultado?.motivo
            ]
            .filter(
                Boolean
            )
            .join(
                " "
            )
        );


    return (
        texto.includes(
            "respaldo"
        ) ||
        texto.includes(
            "demostracion"
        ) ||
        texto.includes(
            "demo"
        ) ||
        texto.includes(
            "ejemplo"
        )
    );

}


function fuenteVisibleConvenio() {

    const fuente =
        String(
            conveniosState.fuente ||
            "ConvenioService"
        )
        .trim();


    if (
        normalizarTextoConvenio(
            fuente
        )
        .includes(
            "pronabec"
        )
    ) {

        return fuente;

    }


    return "ConvenioService · fuente oficial integrada";

}


/* =========================================================
   FILTROS
========================================================= */

function cargarFiltrosConvenios() {

    llenarSelectConvenio(
        "agreementInstitutionFilter",
        unicosConvenios(
            "institucion"
        ),
        "Todas"
    );


    llenarSelectConvenio(
        "agreementLocationFilter",
        unicosConvenios(
            "ubicacion"
        ),
        "Todo el Perú"
    );


    llenarSelectConvenio(
        "agreementTypeFilter",
        unicosConvenios(
            "tipo"
        ),
        "Todos"
    );

}


function llenarSelectConvenio(
    id,
    valores,
    inicial
) {

    const select =
        document.getElementById(id);


    if (!select) {
        return;
    }


    const anterior =
        select.value;


    select.innerHTML =
        `
        <option value="">
            ${EduPeruUI.escaparHTML(inicial)}
        </option>
        `;


    valores.forEach(
        valor => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                valor;


            option.textContent =
                valor;


            select.appendChild(
                option
            );

        }
    );


    if (
        valores.includes(
            anterior
        )
    ) {

        select.value =
            anterior;

    }

}


/* =========================================================
   APLICAR FILTROS
========================================================= */

function aplicarFiltrosConvenios() {

    const texto =
        normalizarTextoConvenio(
            document
                .getElementById(
                    "agreementSearch"
                )
                ?.value
        );


    const institucion =
        normalizarTextoConvenio(
            document
                .getElementById(
                    "agreementInstitutionFilter"
                )
                ?.value
        );


    const ubicacion =
        normalizarTextoConvenio(
            document
                .getElementById(
                    "agreementLocationFilter"
                )
                ?.value
        );


    const tipo =
        normalizarTextoConvenio(
            document
                .getElementById(
                    "agreementTypeFilter"
                )
                ?.value
        );


    const fuente =
        normalizarTextoConvenio(
            document
                .getElementById(
                    "agreementSourceFilter"
                )
                ?.value
        );


    const modo =
        normalizarTextoConvenio(
            conveniosState.modo
        );


    conveniosState.filtrados =
        conveniosState
            .todos
            .filter(
                convenio => {

                    const contenido =
                        normalizarTextoConvenio(
                            JSON.stringify(
                                convenio
                            )
                        );


                    return (

                        (
                            !texto ||
                            contenido.includes(
                                texto
                            )
                        )

                        &&

                        (
                            !institucion ||
                            normalizarTextoConvenio(
                                convenio.institucion
                            ) === institucion
                        )

                        &&

                        (
                            !ubicacion ||
                            normalizarTextoConvenio(
                                convenio.ubicacion
                            ) === ubicacion
                        )

                        &&

                        (
                            !tipo ||
                            normalizarTextoConvenio(
                                convenio.tipo
                            ) === tipo
                        )

                        &&

                        (
                            !fuente ||
                            modo.includes(
                                fuente
                            )
                        )

                    );

                }
            );


    conveniosState.paginaActual =
        1;


    ordenarConvenios();

    actualizarKpisConvenios();

    renderizarConvenios();

}


/* =========================================================
   ORDEN
========================================================= */

function ordenarConvenios() {

    const criterio =
        document
            .getElementById(
                "agreementSort"
            )
            ?.value ||
        "institucion";


    conveniosState
        .filtrados
        .sort(
            (a, b) =>

                String(
                    a[criterio] ||
                    ""
                ).localeCompare(
                    String(
                        b[criterio] ||
                        ""
                    ),
                    "es"
                )

        );

}


/* =========================================================
   KPI
========================================================= */

function actualizarKpisConvenios() {

    const filtrosActivos =
        hayFiltrosConvenios();


    const totalMostrar =
        filtrosActivos
            ? conveniosState
                .filtrados
                .length
            : conveniosState
                .totalOficial ||
              conveniosState
                .todos
                .length;


    colocarConvenio(
        "agreementTotal",
        formatearNumeroConvenio(
            totalMostrar
        )
    );


    const instituciones =
        unicosNormalizadosConvenios(
            conveniosState
                .filtrados
                .map(
                    convenio =>
                        convenio.institucion
                )
        )
        .filter(
            valor =>
                normalizarTextoConvenio(
                    valor
                ) !==
                "institucion no especificada"
        );


    const ubicaciones =
        unicosNormalizadosConvenios(
            conveniosState
                .filtrados
                .map(
                    convenio =>
                        convenio.ubicacion
                )
        )
        .filter(
            valor =>
                !normalizarTextoConvenio(
                    valor
                )
                .includes(
                    "no especificada"
                )
        );


    const tipos =
        unicosNormalizadosConvenios(
            conveniosState
                .filtrados
                .map(
                    convenio =>
                        convenio.tipo
                )
        )
        .filter(
            valor =>
                !normalizarTextoConvenio(
                    valor
                )
                .includes(
                    "no especificado"
                )
        );


    colocarConvenio(
        "agreementInstitutions",
        formatearNumeroConvenio(
            instituciones.length
        )
    );


    colocarConvenio(
        "agreementLocations",
        formatearNumeroConvenio(
            ubicaciones.length
        )
    );


    colocarConvenio(
        "agreementTypes",
        formatearNumeroConvenio(
            tipos.length
        )
    );


    if (
        filtrosActivos
    ) {

        cambiarEtiquetaKpiConvenio(
            "agreementTotal",
            "Coincidencias cargadas"
        );

    } else {

        cambiarEtiquetaKpiConvenio(
            "agreementTotal",
            "Convenios oficiales"
        );

    }


    if (
        conveniosState.totalOficial >
        conveniosState.todos.length
    ) {

        cambiarEtiquetaKpiConvenio(
            "agreementInstitutions",
            "Instituciones (muestra)"
        );


        cambiarEtiquetaKpiConvenio(
            "agreementLocations",
            "Ubicaciones (muestra)"
        );


        cambiarEtiquetaKpiConvenio(
            "agreementTypes",
            "Tipos (muestra)"
        );

    }


    const descripcion =
        conveniosState.totalOficial >
        conveniosState.todos.length

            ? `${formatearNumeroConvenio(
                conveniosState.filtrados.length
            )} registros visibles · ${formatearNumeroConvenio(
                conveniosState.todos.length
            )} cargados de ${formatearNumeroConvenio(
                conveniosState.totalOficial
            )} reportados por ConvenioService`

            : `${formatearNumeroConvenio(
                conveniosState.filtrados.length
            )} convenios en la consulta actual`;


    colocarConvenio(
        "agreementResultText",
        descripcion
    );

}


/* =========================================================
   RENDER
========================================================= */

function renderizarConvenios() {

    const inicio =
        (
            conveniosState
                .paginaActual -
            1
        ) *
        conveniosState
            .porPagina;


    const registros =
        conveniosState
            .filtrados
            .slice(
                inicio,
                inicio +
                conveniosState.porPagina
            );


    renderizarTarjetasConvenio(
        registros
    );


    renderizarPaginacionConvenio();


    EduPeruUI
        .actualizarIconos();

}


/* =========================================================
   TARJETAS
========================================================= */

function renderizarTarjetasConvenio(
    convenios
) {

    const contenedor =
        document.getElementById(
            "agreementContainer"
        );


    if (
        !contenedor
    ) {

        return;

    }


    if (
        !convenios.length
    ) {

        contenedor.innerHTML =
            `
            <div class="empty-state">

                <div class="empty-state-icon">
                    <i data-lucide="handshake"></i>
                </div>

                <h4>
                    No se encontraron convenios
                </h4>

                <p>
                    Modifica los filtros para realizar
                    otra búsqueda.
                </p>

            </div>
            `;


        return;

    }


    const fuente =
        fuenteVisibleConvenio();


    contenedor.innerHTML =
        convenios
            .map(
                convenio => {

                    return `
                    <article class="agreement-card">

                        <div class="agreement-card-header">

                            <div class="agreement-card-icon">
                                <i data-lucide="handshake"></i>
                            </div>

                            <span class="agreement-status">
                                ${EduPeruUI.escaparHTML(
                                    convenio.estado
                                )}
                            </span>

                        </div>


                        <div class="agreement-card-body">

                            <span class="agreement-source">
                                ${EduPeruUI.escaparHTML(
                                    fuente
                                )}
                            </span>


                            <h3>
                                ${EduPeruUI.escaparHTML(
                                    convenio.institucion
                                )}
                            </h3>


                            <p class="agreement-type">
                                ${EduPeruUI.escaparHTML(
                                    convenio.tipo
                                )}
                            </p>


                            <div class="agreement-information">

                                <div class="agreement-info-row">
                                    <i data-lucide="building-2"></i>
                                    <span>
                                        ${EduPeruUI.escaparHTML(
                                            convenio.tipoInstitucion
                                        )}
                                    </span>
                                </div>


                                <div class="agreement-info-row">
                                    <i data-lucide="map-pin"></i>
                                    <span>
                                        ${EduPeruUI.escaparHTML(
                                            convenio.ubicacion
                                        )}
                                    </span>
                                </div>


                                <div class="agreement-info-row">
                                    <i data-lucide="network"></i>
                                    <span>
                                        ConvenioService
                                    </span>
                                </div>

                            </div>


                            <div class="agreement-card-actions">

                                <button
                                    class="agreement-detail-button"
                                    data-action="detail"
                                    data-id="${convenio.id}"
                                    type="button"
                                >
                                    Ver convenio
                                    <i data-lucide="arrow-right"></i>
                                </button>


                                <button
                                    class="agreement-institution-button"
                                    data-action="institution"
                                    data-id="${convenio.id}"
                                    type="button"
                                >
                                    Institución
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

function manejarAccionConvenio(
    event
) {

    const boton =
        event.target.closest(
            "[data-action]"
        );


    if (!boton) {

        return;

    }


    const convenio =
        conveniosState
            .todos
            .find(
                item =>
                    item.id ===
                    Number(
                        boton.dataset.id
                    )
            );


    if (!convenio) {

        return;

    }


    if (
        boton.dataset.action ===
        "detail"
    ) {

        mostrarDetalleConvenio(
            convenio
        );

    }


    if (
        boton.dataset.action ===
        "institution"
    ) {

        mostrarInstitucionRelacionada(
            convenio
        );

    }

}


/* =========================================================
   DETALLE
========================================================= */

function mostrarDetalleConvenio(
    convenio
) {

    const fuente =
        convenio.fuente ||
        fuenteVisibleConvenio();


    EduPeruUI.abrirModal({

        titulo:
            "Detalle del convenio",

        subtitulo:
            convenio.institucion,

        contenido:
            `
            <div class="detail-grid">

                <div class="detail-item full">
                    <span>Institución</span>
                    <strong>
                        ${EduPeruUI.escaparHTML(
                            convenio.institucion
                        )}
                    </strong>
                </div>


                <div class="detail-item">
                    <span>Tipo de institución</span>
                    <strong>
                        ${EduPeruUI.escaparHTML(
                            convenio.tipoInstitucion
                        )}
                    </strong>
                </div>


                <div class="detail-item">
                    <span>Ubicación</span>
                    <strong>
                        ${EduPeruUI.escaparHTML(
                            convenio.ubicacion
                        )}
                    </strong>
                </div>


                <div class="detail-item">
                    <span>Tipo de convenio</span>
                    <strong>
                        ${EduPeruUI.escaparHTML(
                            convenio.tipo
                        )}
                    </strong>
                </div>


                <div class="detail-item">
                    <span>Estado publicado</span>
                    <strong>
                        ${EduPeruUI.escaparHTML(
                            convenio.estado
                        )}
                    </strong>
                </div>


                <div class="detail-item full">
                    <span>Fuente</span>
                    <strong>
                        ${EduPeruUI.escaparHTML(
                            fuente
                        )}
                    </strong>
                </div>


                <div class="detail-item full">
                    <span>Servicio responsable</span>
                    <strong>
                        ConvenioService
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
                href="/pages/instituciones.html"
                class="btn btn-primary"
            >
                <i data-lucide="building-2"></i>
                Instituciones
            </a>
            `

    });

}


/* =========================================================
   INSTITUCIÓN RELACIONADA
========================================================= */

function mostrarInstitucionRelacionada(
    convenio
) {

    const nombre =
        normalizarTextoConvenio(
            convenio.institucion
        );


    const institucion =
        conveniosState
            .instituciones
            .find(
                item =>
                    normalizarTextoConvenio(
                        item.nombre
                    ) ===
                    nombre
            );


    if (!institucion) {

        EduPeruUI.abrirModal({

            titulo:
                "Institución",

            subtitulo:
                convenio.institucion,

            contenido:
                `
                <div class="empty-state">

                    <div class="empty-state-icon">

                        <i data-lucide="building-2"></i>

                    </div>

                    <h4>
                        Institución identificada
                    </h4>

                    <p>
                        El convenio contiene esta institución,
                        pero no fue posible resolver una ficha
                        institucional adicional en la consulta
                        actual.
                    </p>

                </div>
                `

        });


        return;

    }


    EduPeruUI.abrirModal({

        titulo:
            "Institución vinculada",

        subtitulo:
            convenio.tipo,

        contenido:
            `
            <div class="detail-grid">


                <div class="detail-item full">

                    <span>
                        Institución
                    </span>

                    <strong>
                        ${EduPeruUI.escaparHTML(
                            institucion.nombre
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Tipo
                    </span>

                    <strong>
                        ${EduPeruUI.escaparHTML(
                            institucion.tipo
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Ubicación
                    </span>

                    <strong>
                        ${EduPeruUI.escaparHTML(
                            institucion.ubicacion
                        )}
                    </strong>

                </div>


                <div class="detail-item full">

                    <span>
                        Relación SOA
                    </span>

                    <strong>
                        ConvenioService → InstitucionService
                    </strong>

                </div>


            </div>
            `,

        footer:
            `
            <a
                href="/pages/instituciones.html"
                class="btn btn-primary"
            >
                Explorar instituciones
            </a>
            `

    });

}


/* =========================================================
   RESUMEN
========================================================= */

function mostrarResumenConvenios() {

    const instituciones =
        unicosNormalizadosConvenios(
            conveniosState
                .filtrados
                .map(
                    item =>
                        item.institucion
                )
        );


    const ubicaciones =
        unicosNormalizadosConvenios(
            conveniosState
                .filtrados
                .map(
                    item =>
                        item.ubicacion
                )
        );


    const tipos =
        unicosNormalizadosConvenios(
            conveniosState
                .filtrados
                .map(
                    item =>
                        item.tipo
                )
        );


    EduPeruUI.abrirModal({

        titulo:
            "Resumen de convenios",

        subtitulo:
            "Indicadores de la fuente oficial disponible",

        contenido:
            `
            <div class="detail-grid">

                <div class="detail-item">
                    <span>Total reportado</span>
                    <strong>
                        ${formatearNumeroConvenio(
                            conveniosState.totalOficial ||
                            conveniosState.todos.length
                        )}
                    </strong>
                </div>


                <div class="detail-item">
                    <span>Registros cargados en esta vista</span>
                    <strong>
                        ${formatearNumeroConvenio(
                            conveniosState.todos.length
                        )}
                    </strong>
                </div>


                <div class="detail-item">
                    <span>Instituciones en muestra</span>
                    <strong>
                        ${formatearNumeroConvenio(
                            instituciones.length
                        )}
                    </strong>
                </div>


                <div class="detail-item">
                    <span>Ubicaciones en muestra</span>
                    <strong>
                        ${formatearNumeroConvenio(
                            ubicaciones.length
                        )}
                    </strong>
                </div>


                <div class="detail-item">
                    <span>Tipos en muestra</span>
                    <strong>
                        ${formatearNumeroConvenio(
                            tipos.length
                        )}
                    </strong>
                </div>


                <div class="detail-item full">
                    <span>Fuente</span>
                    <strong>
                        ${EduPeruUI.escaparHTML(
                            fuenteVisibleConvenio()
                        )}
                    </strong>
                </div>


                ${
                    conveniosState.totalOficial >
                    conveniosState.todos.length
                        ? `
                        <div class="detail-item full">
                            <span>Nota</span>
                            <strong>
                                La pantalla carga un lote de hasta 100 registros
                                para mantener una navegación rápida. El total
                                nacional mostrado proviene de EstadisticaService /
                                ConvenioService.
                            </strong>
                        </div>
                        `
                        : ""
                }

            </div>
            `

    });

}


/* =========================================================
   PAGINACIÓN
========================================================= */

function renderizarPaginacionConvenio() {

    const contenedor =
        document.getElementById(
            "agreementPagination"
        );


    if (
        !contenedor
    ) {

        return;

    }


    const paginas =
        Math.ceil(
            conveniosState
                .filtrados
                .length /
            conveniosState
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
        conveniosState
            .paginaActual;


    const conjunto =
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
            conjunto
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


function manejarPaginacionConvenios(
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


    conveniosState.paginaActual =
        pagina;


    renderizarConvenios();


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

function limpiarFiltrosConvenios() {

    [
        "agreementSearch",
        "agreementInstitutionFilter",
        "agreementLocationFilter",
        "agreementTypeFilter",
        "agreementSourceFilter"

    ].forEach(
        id => {

            const elemento =
                document.getElementById(id);


            if (elemento) {

                elemento.value =
                    "";

            }

        }
    );


    conveniosState.filtrados =
        [
            ...conveniosState.todos
        ];


    conveniosState.paginaActual =
        1;


    ordenarConvenios();

    actualizarKpisConvenios();

    renderizarConvenios();

}


/* =========================================================
   ÚNICOS
========================================================= */

function unicosConvenios(
    propiedad
) {

    return [

        ...new Set(

            conveniosState
                .todos
                .map(
                    convenio =>
                        convenio[propiedad]
                )
                .filter(Boolean)

        )

    ].sort();

}


/* =========================================================
   NORMALIZACIÓN
========================================================= */

function normalizarTextoConvenio(
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


/* =========================================================
   TEXTO
========================================================= */

function colocarConvenio(
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
   UTILIDADES ADICIONALES
========================================================= */

function hayFiltrosConvenios() {

    const ids = [

        "agreementSearch",
        "agreementInstitutionFilter",
        "agreementLocationFilter",
        "agreementTypeFilter",
        "agreementSourceFilter"

    ];


    return ids.some(
        id => {

            const elemento =
                document.getElementById(
                    id
                );


            return Boolean(
                String(
                    elemento?.value ||
                    ""
                )
                .trim()
            );

        }
    );

}


function unicosNormalizadosConvenios(
    valores
) {

    const mapa =
        new Map();


    valores
        .filter(
            valor =>
                valor !==
                    undefined &&
                valor !==
                    null &&
                String(
                    valor
                )
                .trim()
        )
        .forEach(
            valor => {

                const texto =
                    String(
                        valor
                    )
                    .trim();


                const clave =
                    normalizarTextoConvenio(
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
    );

}


function formatearNumeroConvenio(
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


function cambiarEtiquetaKpiConvenio(
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


/* =========================================================
   CARGANDO
========================================================= */

function mostrarCargandoConvenios() {

    document
        .getElementById(
            "agreementContainer"
        )
        .innerHTML =
            `
            <div class="loading-state">

                <div class="spinner"></div>

                <span>
                    Consultando ConvenioService...
                </span>

            </div>
            `;


    [
        "agreementTotal",
        "agreementInstitutions",
        "agreementLocations",
        "agreementTypes"

    ].forEach(
        id =>
            colocarConvenio(
                id,
                "--"
            )
    );

}


/* =========================================================
   ERROR
========================================================= */

function mostrarErrorConvenios(
    mensaje
) {

    document
        .getElementById(
            "agreementContainer"
        )
        .innerHTML =
            `
            <div class="empty-state error-state">

                <div class="empty-state-icon">

                    <i data-lucide="triangle-alert"></i>

                </div>

                <h4>
                    No se pudieron cargar los convenios
                </h4>

                <p>
                    ${EduPeruUI.escaparHTML(mensaje)}
                </p>

            </div>
            `;


    EduPeruUI
        .actualizarIconos();


    EduPeruUI.mostrarToast(
        "Error",
        mensaje,
        "error"
    );

}