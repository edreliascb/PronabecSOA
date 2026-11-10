/* =========================================================
   EDUPERÚ - REQUISITOS
   VERSIÓN CORREGIDA
   Política: solo información oficial; sin datos demo/respaldo.
========================================================= */


const requisitosState = {

    todos: [],

    filtrados: [],

    modo:
        "DESCONOCIDO",

    fuente:
        "DocumentoRequisitoService",

    disponible:
        null,

    mensaje:
        "",

    totalReportado:
        0

};


/* =========================================================
   INICIO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        configurarEventosRequisitos();

        cargarRequisitos();

    }
);


/* =========================================================
   EVENTOS
========================================================= */

function configurarEventosRequisitos() {

    document
        .getElementById(
            "requirementsSearch"
        )
        ?.addEventListener(
            "input",
            filtrarRequisitos
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
                        "requirementsSearch"
                    );


                if (
                    buscador
                ) {

                    buscador.value =
                        event.target.value;

                }


                filtrarRequisitos();

            }
        );


    document
        .getElementById(
            "requirementsFilter"
        )
        ?.addEventListener(
            "change",
            filtrarRequisitos
        );


    document
        .getElementById(
            "requirementsOrder"
        )
        ?.addEventListener(
            "change",
            filtrarRequisitos
        );


    document
        .getElementById(
            "refreshButton"
        )
        ?.addEventListener(
            "click",
            cargarRequisitos
        );


    document
        .getElementById(
            "requirementsGrid"
        )
        ?.addEventListener(
            "click",
            manejarDetalleRequisito
        );

}


/* =========================================================
   CARGAR
========================================================= */

async function cargarRequisitos() {

    mostrarCargaRequisitos();


    try {

        const respuesta =
            await EduPeruAPI
                .obtenerDocumentos(
                    1,
                    100
                );


        const servicio =
            respuesta?.resultado ||
            respuesta?.datos ||
            respuesta ||
            {};


        requisitosState.modo =
            String(
                servicio?.modo ||
                "DESCONOCIDO"
            );


        requisitosState.fuente =
            servicio?.fuente ||
            servicio?.fuentePrincipal ||
            "DocumentoRequisitoService";


        requisitosState.mensaje =
            servicio?.mensaje ||
            servicio?.motivo ||
            respuesta?.mensaje ||
            "";


        requisitosState.disponible =
            determinarDisponibilidadOficial(
                servicio
            );


        requisitosState.totalReportado =
            extraerTotalRequisitos(
                servicio
            );


        /*
           El proyecto no debe usar datos de ejemplo ni respaldo.
           Si el servicio indica que la fuente oficial no está
           disponible, no se renderizan registros alternativos.
        */

        if (
            requisitosState.disponible ===
            false
        ) {

            requisitosState.todos =
                [];


            requisitosState.filtrados =
                [];


            actualizarKpisRequisitos();

            renderizarFuenteNoDisponible();

            return;

        }


        requisitosState.todos =
            extraerRegistrosRequisitos(
                servicio
            )
            .filter(
                registro =>
                    !esRegistroNoOficial(
                        registro
                    )
            );


        requisitosState.filtrados = [
            ...requisitosState.todos
        ];


        if (
            requisitosState.totalReportado ===
            0
        ) {

            requisitosState.totalReportado =
                requisitosState
                    .todos
                    .length;

        }


        actualizarKpisRequisitos();

        filtrarRequisitos();


    } catch (error) {

        console.error(
            "[Requisitos]",
            error
        );


        requisitosState.todos =
            [];


        requisitosState.filtrados =
            [];


        requisitosState.disponible =
            false;


        requisitosState.mensaje =
            error.message;


        actualizarKpisRequisitos();

        renderizarFuenteNoDisponible();

    }

}


/* =========================================================
   DISPONIBILIDAD OFICIAL
========================================================= */

function determinarDisponibilidadOficial(
    servicio
) {

    if (
        servicio?.disponible ===
        false
    ) {

        return false;

    }


    if (
        servicio?.disponible ===
        true
    ) {

        return true;

    }


    const texto =
        normalizarRequisito(
            [
                servicio?.modo,
                servicio?.fuente,
                servicio?.fuentePrincipal,
                servicio?.mensaje,
                servicio?.motivo
            ]
            .filter(
                Boolean
            )
            .join(
                " "
            )
        );


    const noDisponible =
        texto.includes(
            "no disponible"
        ) ||
        texto.includes(
            "no_disponible"
        ) ||
        texto.includes(
            "respaldo"
        ) ||
        texto.includes(
            "demo"
        ) ||
        texto.includes(
            "demostracion"
        ) ||
        texto.includes(
            "ejemplo"
        );


    if (
        noDisponible
    ) {

        return false;

    }


    return true;

}


/* =========================================================
   FILTRAR
========================================================= */

function filtrarRequisitos() {

    if (
        requisitosState.disponible ===
        false
    ) {

        renderizarFuenteNoDisponible();

        return;

    }


    const texto =
        normalizarRequisito(
            document
                .getElementById(
                    "requirementsSearch"
                )
                ?.value
        );


    const filtro =
        document
            .getElementById(
                "requirementsFilter"
            )
            ?.value ||
        "";


    const orden =
        document
            .getElementById(
                "requirementsOrder"
            )
            ?.value ||
        "az";


    requisitosState.filtrados =
        requisitosState
            .todos
            .filter(
                documento => {

                    const coincideTexto =
                        !texto ||
                        normalizarRequisito(
                            JSON.stringify(
                                documento
                            )
                        )
                        .includes(
                            texto
                        );


                    const estado =
                        obtenerEstadoDocumento(
                            documento
                        );


                    const coincideFiltro =
                        !filtro ||
                        estado ===
                            filtro;


                    return (
                        coincideTexto &&
                        coincideFiltro
                    );

                }
            );


    requisitosState
        .filtrados
        .sort(
            (
                a,
                b
            ) => {

                const nombreA =
                    obtenerNombreDocumento(
                        a
                    );


                const nombreB =
                    obtenerNombreDocumento(
                        b
                    );


                if (
                    orden ===
                    "za"
                ) {

                    return nombreB
                        .localeCompare(
                            nombreA,
                            "es"
                        );

                }


                return nombreA
                    .localeCompare(
                        nombreB,
                        "es"
                    );

            }
        );


    renderizarRequisitos();

}


/* =========================================================
   RENDER
========================================================= */

function renderizarRequisitos() {

    const contenedor =
        document.getElementById(
            "requirementsGrid"
        );


    if (
        !contenedor
    ) {

        return;

    }


    colocarTextoRequisito(
        "requirementsResultText",
        `${requisitosState.filtrados.length} documentos encontrados`
    );


    if (
        requisitosState
            .filtrados
            .length ===
        0
    ) {

        contenedor.innerHTML =
            `
            <div class="requirements-empty">

                <i data-lucide="file-question"></i>

                <strong>
                    No hay documentos publicados en la consulta actual
                </strong>

                <span>
                    La fuente oficial respondió correctamente, pero no
                    devolvió documentos para los criterios actuales.
                </span>

            </div>
            `;


        EduPeruUI
            ?.actualizarIconos?.();


        return;

    }


    contenedor.innerHTML =
        requisitosState
            .filtrados
            .map(
                (
                    documento,
                    indice
                ) => {

                    const estado =
                        obtenerEstadoDocumento(
                            documento
                        );


                    const etiqueta =
                        obtenerEtiquetaEstado(
                            estado
                        );


                    return `
                    <article class="requirement-card">

                        <div class="requirement-card-header">

                            <div class="requirement-icon">
                                <i data-lucide="${obtenerIconoDocumento(
                                    documento
                                )}"></i>
                            </div>

                            <span class="requirement-status ${estado}">
                                ${escaparRequisito(
                                    etiqueta
                                )}
                            </span>

                        </div>


                        <h4>
                            ${escaparRequisito(
                                obtenerNombreDocumento(
                                    documento
                                )
                            )}
                        </h4>


                        <p>
                            ${escaparRequisito(
                                obtenerDescripcionDocumento(
                                    documento
                                )
                            )}
                        </p>


                        <div class="requirement-meta">

                            <span>
                                Tipo:
                                ${escaparRequisito(
                                    obtenerTipoDocumento(
                                        documento
                                    )
                                )}
                            </span>

                            <span>
                                Fuente:
                                ${escaparRequisito(
                                    requisitosState.fuente
                                )}
                            </span>

                        </div>


                        <div class="requirement-card-footer">

                            <button
                                type="button"
                                class="requirement-view-button"
                                data-requirement-index="${indice}"
                            >
                                Ver detalle
                            </button>

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
   FUENTE NO DISPONIBLE
========================================================= */

function renderizarFuenteNoDisponible() {

    const contenedor =
        document.getElementById(
            "requirementsGrid"
        );


    if (
        !contenedor
    ) {

        return;

    }


    const detalle =
        requisitosState.mensaje ||
        "DocumentoRequisitoService no pudo recuperar información oficial publicada para esta consulta.";


    colocarTextoRequisito(
        "requirementsResultText",
        "Fuente oficial no disponible"
    );


    contenedor.innerHTML =
        `
        <div class="requirements-empty">

            <i data-lucide="database-zap"></i>

            <strong>
                Información documental no disponible
            </strong>

            <span>
                ${escaparRequisito(
                    detalle
                )}
            </span>

            <span>
                EduPerú no mostrará requisitos de ejemplo ni datos
                de respaldo como si fueran información oficial.
            </span>

        </div>
        `;


    EduPeruUI
        ?.actualizarIconos?.();

}


/* =========================================================
   DETALLE
========================================================= */

function manejarDetalleRequisito(
    event
) {

    const boton =
        event.target.closest(
            "[data-requirement-index]"
        );


    if (
        !boton
    ) {

        return;

    }


    const documento =
        requisitosState
            .filtrados[
                Number(
                    boton.dataset
                        .requirementIndex
                )
            ];


    if (
        !documento
    ) {

        return;

    }


    const estado =
        obtenerEstadoDocumento(
            documento
        );


    EduPeruUI.abrirModal({

        titulo:
            obtenerNombreDocumento(
                documento
            ),

        subtitulo:
            obtenerEtiquetaEstado(
                estado
            ),

        contenido:
            `
            <div class="detail-grid">

                <div class="detail-item">
                    <span>Documento</span>
                    <strong>
                        ${escaparRequisito(
                            obtenerNombreDocumento(
                                documento
                            )
                        )}
                    </strong>
                </div>


                <div class="detail-item">
                    <span>Tipo</span>
                    <strong>
                        ${escaparRequisito(
                            obtenerTipoDocumento(
                                documento
                            )
                        )}
                    </strong>
                </div>


                <div class="detail-item">
                    <span>Condición</span>
                    <strong>
                        ${escaparRequisito(
                            obtenerEtiquetaEstado(
                                estado
                            )
                        )}
                    </strong>
                </div>


                <div class="detail-item">
                    <span>Modo del servicio</span>
                    <strong>
                        ${escaparRequisito(
                            requisitosState.modo
                        )}
                    </strong>
                </div>


                <div class="detail-item full">
                    <span>Descripción</span>
                    <strong>
                        ${escaparRequisito(
                            obtenerDescripcionDocumento(
                                documento
                            )
                        )}
                    </strong>
                </div>


                <div class="detail-item full">
                    <span>Fuente</span>
                    <strong>
                        ${escaparRequisito(
                            requisitosState.fuente
                        )}
                    </strong>
                </div>

            </div>
            `

    });

}


/* =========================================================
   KPI
========================================================= */

function actualizarKpisRequisitos() {

    if (
        requisitosState.disponible ===
        false
    ) {

        [
            "requirementsTotal",
            "heroRequirementCount",
            "requirementsRequired",
            "requirementsConditional"
        ].forEach(
            id =>
                colocarTextoRequisito(
                    id,
                    "N/D"
                )
        );


        colocarTextoRequisito(
            "requirementsSource",
            "Fuente oficial no disponible"
        );


        return;

    }


    const obligatorios =
        requisitosState
            .todos
            .filter(
                documento =>
                    obtenerEstadoDocumento(
                        documento
                    ) ===
                    "obligatorio"
            )
            .length;


    const condicionales =
        requisitosState
            .todos
            .filter(
                documento =>
                    obtenerEstadoDocumento(
                        documento
                    ) ===
                    "condicional"
            )
            .length;


    const total =
        requisitosState.totalReportado ||
        requisitosState.todos.length;


    colocarTextoRequisito(
        "requirementsTotal",
        formatearNumeroRequisito(
            total
        )
    );


    colocarTextoRequisito(
        "heroRequirementCount",
        formatearNumeroRequisito(
            total
        )
    );


    colocarTextoRequisito(
        "requirementsRequired",
        formatearNumeroRequisito(
            obligatorios
        )
    );


    colocarTextoRequisito(
        "requirementsConditional",
        formatearNumeroRequisito(
            condicionales
        )
    );


    colocarTextoRequisito(
        "requirementsSource",
        requisitosState.fuente ||
        "DocumentoRequisitoService"
    );

}


/* =========================================================
   DATOS DEL DOCUMENTO
========================================================= */

function obtenerNombreDocumento(
    documento
) {

    return (
        obtenerValorDocumento(
            documento,
            [
                "documento",
                "DOCUMENTO",

                "nombre",
                "NOMBRE",

                "nombreDocumento",
                "NOMBRE_DOCUMENTO",

                "nombre_documento",

                "descripcionDocumento",
                "DESCRIPCION_DOCUMENTO"
            ],
            ""
        ) ||
        buscarCampoDinamicoDocumento(
            documento,
            [
                "nombre documento",
                "documento solicitado",
                "documento"
            ]
        ) ||
        "Documento educativo"
    );

}


function obtenerTipoDocumento(
    documento
) {

    return (
        obtenerValorDocumento(
            documento,
            [
                "tipo",
                "TIPO",

                "tipoDocumento",
                "TIPO_DOCUMENTO",

                "tipo_documento",

                "categoria",
                "CATEGORIA"
            ],
            ""
        ) ||
        buscarCampoDinamicoDocumento(
            documento,
            [
                "tipo documento",
                "categoria"
            ]
        ) ||
        "Documento"
    );

}


function obtenerDescripcionDocumento(
    documento
) {

    const descripcion =
        obtenerValorDocumento(
            documento,
            [
                "descripcion",
                "DESCRIPCION",

                "detalle",
                "DETALLE",

                "condicion",
                "CONDICION",

                "observacion",
                "OBSERVACION"
            ],
            ""
        ) ||
        buscarCampoDinamicoDocumento(
            documento,
            [
                "descripcion",
                "detalle",
                "observacion",
                "condicion"
            ]
        );


    if (
        descripcion
    ) {

        return descripcion;

    }


    return "La fuente oficial no incluye una descripción adicional para este registro.";

}


/* =========================================================
   ESTADO
========================================================= */

function obtenerEstadoDocumento(
    documento
) {

    const valor =
        normalizarRequisito(
            obtenerValorDocumento(
                documento,
                [
                    "obligatorio",
                    "OBLIGATORIO",

                    "mandatory",

                    "requerido",
                    "REQUERIDO",

                    "condicion",
                    "CONDICION",

                    "estado",
                    "ESTADO"
                ],
                ""
            ) ||
            buscarCampoDinamicoDocumento(
                documento,
                [
                    "obligatorio",
                    "requerido",
                    "condicion",
                    "estado"
                ]
            )
        );


    if (
        valor ===
            "si" ||
        valor ===
            "sí" ||
        valor ===
            "true" ||
        valor ===
            "1" ||
        valor.includes(
            "obligatorio"
        ) ||
        valor.includes(
            "requerido"
        )
    ) {

        return "obligatorio";

    }


    if (
        valor.includes(
            "segun convocatoria"
        ) ||
        valor.includes(
            "según convocatoria"
        ) ||
        valor.includes(
            "condicional"
        ) ||
        valor.includes(
            "depende"
        )
    ) {

        return "condicional";

    }


    return "general";

}


function obtenerEtiquetaEstado(
    estado
) {

    if (
        estado ===
        "obligatorio"
    ) {

        return "Obligatorio";

    }


    if (
        estado ===
        "condicional"
    ) {

        return "Según convocatoria";

    }


    return "General";

}


/* =========================================================
   ICONO
========================================================= */

function obtenerIconoDocumento(
    documento
) {

    const nombre =
        normalizarRequisito(
            obtenerNombreDocumento(
                documento
            )
        );


    if (
        nombre.includes(
            "dni"
        ) ||
        nombre.includes(
            "identidad"
        )
    ) {

        return "contact";

    }


    if (
        nombre.includes(
            "constancia"
        ) ||
        nombre.includes(
            "certificado"
        )
    ) {

        return "badge-check";

    }


    if (
        nombre.includes(
            "declaracion"
        )
    ) {

        return "file-signature";

    }


    return "file-text";

}


/* =========================================================
   EXTRAER REGISTROS
========================================================= */

function extraerRegistrosRequisitos(
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


function extraerTotalRequisitos(
    servicio
) {

    const candidatos = [

        servicio?.total,

        servicio?.totalRegistros,

        servicio?.cantidad,

        servicio?.datos?.total,

        servicio?.datos?.count,

        servicio?.resultado?.total

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


/* =========================================================
   EVITAR DATOS NO OFICIALES
========================================================= */

function esRegistroNoOficial(
    registro
) {

    const texto =
        normalizarRequisito(
            [
                registro?.fuente,
                registro?.origen,
                registro?.tipoFuente
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
            "demo"
        ) ||
        texto.includes(
            "demostracion"
        ) ||
        texto.includes(
            "ejemplo"
        )
    );

}


/* =========================================================
   UTILIDADES
========================================================= */

function obtenerValorDocumento(
    objeto,
    campos,
    defecto
) {

    for (
        const campo
        of campos
    ) {

        const valor =
            objeto?.[
                campo
            ];


        if (
            valor !==
                undefined &&
            valor !==
                null &&
            String(
                valor
            )
            .trim()
        ) {

            return String(
                valor
            )
            .trim();

        }

    }


    return defecto;

}


function buscarCampoDinamicoDocumento(
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
            normalizarRequisito(
                patron
            );


        for (
            const [
                clave,
                valor
            ]
            of entradas
        ) {

            const claveNormal =
                normalizarRequisito(
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
                valor !==
                    undefined &&
                valor !==
                    null &&
                String(
                    valor
                )
                .trim()
            ) {

                return String(
                    valor
                )
                .trim();

            }

        }

    }


    return "";

}


function normalizarRequisito(
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


function colocarTextoRequisito(
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


function formatearNumeroRequisito(
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


function escaparRequisito(
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

function mostrarCargaRequisitos() {

    const contenedor =
        document.getElementById(
            "requirementsGrid"
        );


    if (
        contenedor
    ) {

        contenedor.innerHTML =
            `
            <div class="loading-state">

                <div class="spinner"></div>

                <span>
                    Consultando DocumentoRequisitoService...
                </span>

            </div>
            `;

    }


    [
        "requirementsTotal",
        "heroRequirementCount",
        "requirementsRequired",
        "requirementsConditional"
    ].forEach(
        id =>
            colocarTextoRequisito(
                id,
                "--"
            )
    );


    colocarTextoRequisito(
        "requirementsSource",
        "Consultando..."
    );

}
