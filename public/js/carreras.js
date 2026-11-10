/* =========================================================
   EDUPERÚ - MÓDULO CARRERAS
   Fuente principal: CarreraService
========================================================= */

const carrerasState = {

    carreras: [],

    filtradas: [],

    renderizadas: [],

    registros: [],

    totalRegistros: 0,

    fuente:
        "CarreraService"

};


const LIMITE_RENDER =
    100;


/* =========================================================
   INICIO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        configurarEventosCarreras();

        cargarCarreras();

    }
);


/* =========================================================
   EVENTOS
========================================================= */

function configurarEventosCarreras() {

    document
        .getElementById(
            "careerSearch"
        )
        ?.addEventListener(
            "input",
            filtrarCarreras
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
                        "careerSearch"
                    );


                if (
                    buscador
                ) {

                    buscador.value =
                        event.target.value;

                }


                filtrarCarreras();

            }
        );


    document
        .getElementById(
            "careerOrder"
        )
        ?.addEventListener(
            "change",
            filtrarCarreras
        );


    document
        .getElementById(
            "refreshButton"
        )
        ?.addEventListener(
            "click",
            cargarCarreras
        );


    document
        .getElementById(
            "careerGrid"
        )
        ?.addEventListener(
            "click",
            manejarClickCarrera
        );

}


/* =========================================================
   CARGAR DESDE CARRERA SERVICE
========================================================= */

async function cargarCarreras() {

    mostrarCargaCarreras();


    try {

        const respuesta =
            await fetch(
                "/api/carreras",
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
                `CarreraService respondió HTTP ${respuesta.status}`
            );

        }


        const json =
            await respuesta.json();


        const resultado =
            json?.resultado ||
            json ||
            {};


        const registros =
            extraerRegistrosCarreras(
                resultado
            );


        carrerasState.registros =
            registros;


        carrerasState.totalRegistros =
            obtenerTotalRespuesta(
                resultado,
                registros.length
            );


        carrerasState.fuente =
            resultado?.fuente ||
            json?.fuente ||
            "CarreraService";


        carrerasState.carreras =
            construirCatalogoCarreras(
                registros
            );


        carrerasState.filtradas = [
            ...carrerasState.carreras
        ];


        actualizarKPICarreras();

        filtrarCarreras();


        EduPeruUI
            ?.actualizarIconos?.();

    } catch (error) {

        console.error(
            "[Carreras]",
            error
        );


        carrerasState.carreras =
            [];

        carrerasState.filtradas =
            [];

        carrerasState.renderizadas =
            [];


        actualizarKPICarreras();

        mostrarErrorCarreras(
            error.message
        );

    }

}


/* =========================================================
   CONSTRUIR CATÁLOGO ÚNICO
========================================================= */

function construirCatalogoCarreras(
    registros
) {

    const mapa =
        new Map();


    registros.forEach(
        registro => {

            const nombre =
                obtenerCampoCarrera(
                    registro
                );


            if (
                !nombre
            ) {

                return;

            }


            const clave =
                normalizarCarrera(
                    nombre
                );


            if (
                !clave ||
                clave ===
                    "diversas carreras" ||
                clave ===
                    "varias carreras" ||
                clave ===
                    "no especificado" ||
                clave ===
                    "no especificada"
            ) {

                return;

            }


            if (
                !mapa.has(
                    clave
                )
            ) {

                mapa.set(
                    clave,
                    {
                        nombre,

                        registros:
                            0,

                        instituciones:
                            new Set(),

                        ubicaciones:
                            new Set(),

                        convocatorias:
                            new Set(),

                        ejemplos:
                            []
                    }
                );

            }


            const carrera =
                mapa.get(
                    clave
                );


            carrera.registros +=
                1;


            const institucion =
                obtenerCampo(
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
                        "ies",
                        "IES"
                    ]
                );


            const ubicacion =
                obtenerCampo(
                    registro,
                    [
                        "region",
                        "REGION",
                        "departamento",
                        "DEPARTAMENTO",
                        "provincia",
                        "PROVINCIA",
                        "distrito",
                        "DISTRITO",
                        "sede",
                        "SEDE",
                        "ubicacion",
                        "UBICACION"
                    ]
                );


            const convocatoria =
                obtenerCampo(
                    registro,
                    [
                        "convocatoria",
                        "CONVOCATORIA",
                        "concurso",
                        "CONCURSO",
                        "nombreConvocatoria",
                        "NOMBRE_CONVOCATORIA",
                        "beca",
                        "BECA"
                    ]
                );


            if (
                institucion
            ) {

                carrera
                    .instituciones
                    .add(
                        institucion
                    );

            }


            if (
                ubicacion
            ) {

                carrera
                    .ubicaciones
                    .add(
                        ubicacion
                    );

            }


            if (
                convocatoria
            ) {

                carrera
                    .convocatorias
                    .add(
                        convocatoria
                    );

            }


            if (
                carrera
                    .ejemplos
                    .length <
                8
            ) {

                carrera
                    .ejemplos
                    .push(
                        registro
                    );

            }

        }
    );


    return Array
        .from(
            mapa.values()
        )
        .map(
            carrera => ({

                ...carrera,

                instituciones:
                    Array.from(
                        carrera.instituciones
                    ),

                ubicaciones:
                    Array.from(
                        carrera.ubicaciones
                    ),

                convocatorias:
                    Array.from(
                        carrera.convocatorias
                    ),

                oportunidades:
                    carrera.registros

            })
        );

}


/* =========================================================
   OBTENER NOMBRE DE CARRERA
========================================================= */

function obtenerCampoCarrera(
    registro
) {

    const directo =
        obtenerCampo(
            registro,
            [
                "nombre",
                "NOMBRE",

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

                "titulo",
                "TITULO"
            ]
        );


    if (
        directo
    ) {

        return directo;

    }


    if (
        registro &&
        typeof registro ===
            "object"
    ) {

        for (
            const [
                clave,
                valor
            ]
            of Object.entries(
                registro
            )
        ) {

            const claveNormal =
                normalizarCarrera(
                    clave
                );


            if (
                (
                    claveNormal.includes(
                        "carrera"
                    ) ||
                    claveNormal.includes(
                        "programa estudio"
                    )
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


/* =========================================================
   FILTROS
========================================================= */

function filtrarCarreras() {

    const texto =
        normalizarCarrera(
            document
                .getElementById(
                    "careerSearch"
                )
                ?.value
        );


    const orden =
        document
            .getElementById(
                "careerOrder"
            )
            ?.value ||
        "az";


    carrerasState.filtradas =
        carrerasState
            .carreras
            .filter(
                carrera => {

                    if (
                        !texto
                    ) {

                        return true;

                    }


                    const contenido =
                        normalizarCarrera(
                            [
                                carrera.nombre,

                                ...carrera
                                    .instituciones,

                                ...carrera
                                    .ubicaciones,

                                ...carrera
                                    .convocatorias

                            ]
                            .join(
                                " "
                            )
                        );


                    return contenido
                        .includes(
                            texto
                        );

                }
            );


    if (
        orden ===
        "az"
    ) {

        carrerasState
            .filtradas
            .sort(
                (a, b) =>
                    a.nombre
                        .localeCompare(
                            b.nombre,
                            "es"
                        )
            );

    }


    if (
        orden ===
        "za"
    ) {

        carrerasState
            .filtradas
            .sort(
                (a, b) =>
                    b.nombre
                        .localeCompare(
                            a.nombre,
                            "es"
                        )
            );

    }


    if (
        orden ===
        "opportunities"
    ) {

        carrerasState
            .filtradas
            .sort(
                (a, b) =>
                    b.registros -
                    a.registros
            );

    }


    renderizarCarreras();

}


/* =========================================================
   RENDER
========================================================= */

function renderizarCarreras() {

    const contenedor =
        document.getElementById(
            "careerGrid"
        );


    if (
        !contenedor
    ) {

        return;

    }


    const totalFiltradas =
        carrerasState
            .filtradas
            .length;


    const textoResultado =
        document.getElementById(
            "careerResultText"
        );


    if (
        textoResultado
    ) {

        textoResultado.textContent =
            `${totalFiltradas} carreras encontradas`;

    }


    if (
        totalFiltradas ===
        0
    ) {

        carrerasState.renderizadas =
            [];


        contenedor.innerHTML =
            `
            <div class="career-empty">

                <i data-lucide="search-x"></i>

                <strong>
                    No encontramos esa carrera
                </strong>

                <span>
                    Prueba con otro nombre.
                </span>

            </div>
            `;


        EduPeruUI
            ?.actualizarIconos?.();


        return;

    }


    carrerasState.renderizadas =
        carrerasState
            .filtradas
            .slice(
                0,
                LIMITE_RENDER
            );


    const tarjetas =
        carrerasState
            .renderizadas
            .map(
                (
                    carrera,
                    indice
                ) => `

                <article class="career-card">

                    <div class="career-card-icon">

                        <i data-lucide="${obtenerIconoCarrera(
                            carrera.nombre
                        )}"></i>

                    </div>


                    <h4>

                        ${EduPeruUI.escaparHTML(
                            carrera.nombre
                        )}

                    </h4>


                    <p>

                        Carrera recuperada desde
                        CarreraService con información
                        oficial disponible en EduPerú.

                    </p>


                    <div class="career-card-meta">

                        <span class="career-opportunity-count">

                            <i data-lucide="database"></i>

                            ${carrera.registros}
                            registro(s)

                        </span>


                        <button
                            class="career-view-button"
                            type="button"
                            data-career-index="${indice}"
                        >
                            Ver detalle
                        </button>

                    </div>

                </article>

                `
            )
            .join("");


    const aviso =
        totalFiltradas >
        LIMITE_RENDER

            ? `
            <div class="career-empty">

                <i data-lucide="info"></i>

                <strong>
                    Mostrando las primeras ${LIMITE_RENDER}
                    carreras
                </strong>

                <span>
                    Hay ${totalFiltradas} carreras que coinciden.
                    Usa el buscador para encontrar una carrera
                    específica sin cargar miles de tarjetas a la vez.
                </span>

            </div>
            `

            : "";


    contenedor.innerHTML =
        tarjetas +
        aviso;


    EduPeruUI
        ?.actualizarIconos?.();

}


/* =========================================================
   DETALLE
========================================================= */

function manejarClickCarrera(
    event
) {

    const boton =
        event.target.closest(
            "[data-career-index]"
        );


    if (
        !boton
    ) {

        return;

    }


    const carrera =
        carrerasState
            .renderizadas[
                Number(
                    boton.dataset
                        .careerIndex
                )
            ];


    if (
        !carrera
    ) {

        return;

    }


    mostrarDetalleCarrera(
        carrera
    );

}


function mostrarDetalleCarrera(
    carrera
) {

    const instituciones =
        carrera
            .instituciones
            .slice(
                0,
                8
            );


    const ubicaciones =
        carrera
            .ubicaciones
            .slice(
                0,
                8
            );


    const convocatorias =
        carrera
            .convocatorias
            .slice(
                0,
                8
            );


    EduPeruUI.abrirModal({

        titulo:
            carrera.nombre,

        subtitulo:
            `${carrera.registros} registro(s) oficiales relacionados`,

        contenido:
            `

            <div class="detail-grid">

                <div class="detail-item">

                    <span>
                        Carrera
                    </span>

                    <strong>
                        ${EduPeruUI.escaparHTML(
                            carrera.nombre
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Registros relacionados
                    </span>

                    <strong>
                        ${carrera.registros}
                    </strong>

                </div>


                <div class="detail-item full">

                    <span>
                        Instituciones detectadas
                    </span>

                    <strong>
                        ${
                            instituciones.length
                                ? instituciones
                                    .map(
                                        EduPeruUI
                                            .escaparHTML
                                    )
                                    .join(
                                        ", "
                                    )
                                : "No especificado en los registros disponibles"
                        }
                    </strong>

                </div>


                <div class="detail-item full">

                    <span>
                        Ubicaciones detectadas
                    </span>

                    <strong>
                        ${
                            ubicaciones.length
                                ? ubicaciones
                                    .map(
                                        EduPeruUI
                                            .escaparHTML
                                    )
                                    .join(
                                        ", "
                                    )
                                : "No especificado en los registros disponibles"
                        }
                    </strong>

                </div>


                <div class="detail-item full">

                    <span>
                        Convocatorias relacionadas
                    </span>

                    <strong>
                        ${
                            convocatorias.length
                                ? convocatorias
                                    .map(
                                        EduPeruUI
                                            .escaparHTML
                                    )
                                    .join(
                                        ", "
                                    )
                                : "No especificado en los registros disponibles"
                        }
                    </strong>

                </div>


                <div class="detail-item full">

                    <span>
                        Fuente
                    </span>

                    <strong>
                        ${EduPeruUI.escaparHTML(
                            carrerasState.fuente
                        )}
                    </strong>

                </div>

            </div>

            `

    });

}


/* =========================================================
   EXTRAER REGISTROS
========================================================= */

function extraerRegistrosCarreras(
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
   TOTAL DE RESPUESTA
========================================================= */

function obtenerTotalRespuesta(
    respuesta,
    defecto = 0
) {

    const candidatos = [

        respuesta?.total,

        respuesta?.resultado?.total,

        respuesta?.paginacion?.total,

        respuesta?.resultado
            ?.paginacion
            ?.total

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
            )
        ) {

            return numero;

        }

    }


    return defecto;

}


/* =========================================================
   CAMPO GENÉRICO
========================================================= */

function obtenerCampo(
    registro,
    campos
) {

    for (
        const campo
        of campos
    ) {

        const valor =
            registro?.[
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


    return "";

}


/* =========================================================
   KPI
========================================================= */

function actualizarKPICarreras() {

    const totalCarreras =
        carrerasState
            .carreras
            .length;


    colocarTextoCarrera(
        "careerCount",
        totalCarreras
    );


    colocarTextoCarrera(
        "heroCareerCount",
        totalCarreras
    );


    colocarTextoCarrera(
        "opportunityCount",
        carrerasState
            .totalRegistros
    );

}


/* =========================================================
   ICONOS
========================================================= */

function obtenerIconoCarrera(
    nombre
) {

    const normal =
        normalizarCarrera(
            nombre
        );


    if (
        normal.includes(
            "sistemas"
        ) ||
        normal.includes(
            "software"
        ) ||
        normal.includes(
            "comput"
        )
    ) {

        return "laptop";

    }


    if (
        normal.includes(
            "civil"
        ) ||
        normal.includes(
            "arquitect"
        )
    ) {

        return "hard-hat";

    }


    if (
        normal.includes(
            "medicina"
        ) ||
        normal.includes(
            "salud"
        ) ||
        normal.includes(
            "enfermer"
        )
    ) {

        return "heart-pulse";

    }


    if (
        normal.includes(
            "administr"
        ) ||
        normal.includes(
            "negocio"
        )
    ) {

        return "briefcase-business";

    }


    if (
        normal.includes(
            "derecho"
        )
    ) {

        return "scale";

    }


    return "graduation-cap";

}


/* =========================================================
   UTILIDADES
========================================================= */

function normalizarCarrera(
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


function colocarTextoCarrera(
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
            new Intl.NumberFormat(
                "es-PE"
            )
            .format(
                Number(
                    valor
                ) ||
                0
            );

    }

}


/* =========================================================
   CARGA / ERROR
========================================================= */

function mostrarCargaCarreras() {

    const contenedor =
        document.getElementById(
            "careerGrid"
        );


    if (
        !contenedor
    ) {

        return;

    }


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


function mostrarErrorCarreras(
    mensaje
) {

    const contenedor =
        document.getElementById(
            "careerGrid"
        );


    if (
        !contenedor
    ) {

        return;

    }


    contenedor.innerHTML =
        `

        <div class="career-empty">

            <i data-lucide="triangle-alert"></i>

            <strong>
                No fue posible cargar las carreras
            </strong>

            <span>
                ${EduPeruUI.escaparHTML(
                    mensaje
                )}
            </span>

        </div>

        `;


    EduPeruUI
        ?.actualizarIconos?.();

}
