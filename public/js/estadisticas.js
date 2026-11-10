/* =========================================================
   EDUPERÚ SOA
   ESTADÍSTICAS - FUENTES OFICIALES
========================================================= */


const estadisticasState = {

    carreras:
        null,

    regiones:
        null,

    estadisticas:
        null,

    health:
        null,

    resultados:
        []

};


document.addEventListener(
    "DOMContentLoaded",
    () => {

        document
            .getElementById(
                "refreshStats"
            )
            ?.addEventListener(
                "click",
                cargarEstadisticas
            );


        cargarEstadisticas();

    }
);


/* =========================================================
   CARGAR
========================================================= */

async function cargarEstadisticas() {

    colocarTexto(
        "statsStatus",
        "Actualizando..."
    );


    colocarTexto(
        "statsStatusDetail",
        "Consultando servicios"
    );


    const resultados =
        await Promise.allSettled([

            obtenerJson(
                "/api/carreras"
            ),

            obtenerJson(
                "/api/regiones"
            ),

            obtenerJson(
                "/api/estadisticas"
            ),

            obtenerJson(
                "/api/health"
            )

        ]);


    estadisticasState.resultados =
        resultados;


    estadisticasState.carreras =
        obtenerValorCumplido(
            resultados[0]
        );


    estadisticasState.regiones =
        obtenerValorCumplido(
            resultados[1]
        );


    estadisticasState.estadisticas =
        obtenerValorCumplido(
            resultados[2]
        );


    estadisticasState.health =
        obtenerValorCumplido(
            resultados[3]
        );


    renderizarTodo();

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


function obtenerValorCumplido(
    resultado
) {

    return resultado
        ?.status ===
        "fulfilled"
            ? resultado.value
            : null;

}


/* =========================================================
   RENDER GENERAL
========================================================= */

function renderizarTodo() {

    const carreras =
        extraerDatos(
            estadisticasState.carreras
        );


    const regiones =
        extraerDatos(
            estadisticasState.regiones
        );


    const totalCarreras =
        obtenerTotal(
            estadisticasState.carreras,
            carreras.length
        );


    const totalRegiones =
        obtenerTotal(
            estadisticasState.regiones,
            regiones.length
        );


    const exitosos =
        estadisticasState
            .resultados
            .filter(
                resultado =>
                    resultado.status ===
                    "fulfilled"
            )
            .length;


    const fuentesOficiales =
        contarFuentesOficiales();


    colocarTexto(
        "statsCareers",
        totalCarreras
    );


    colocarTexto(
        "statsRegions",
        totalRegiones
    );


    colocarTexto(
        "statsServices",
        exitosos
    );


    colocarTexto(
        "statsOfficialSources",
        fuentesOficiales
    );


    colocarTexto(
        "statsCareersLabel",
        `${totalCarreras} carrera(s) recuperada(s)`
    );


    colocarTexto(
        "statsRegionsLabel",
        `${totalRegiones} región(es) disponible(s)`
    );


    actualizarFuenteCarreras();

    renderizarCarreras(
        carreras,
        totalCarreras
    );


    renderizarRegiones(
        regiones,
        totalRegiones
    );


    actualizarResumen(
        exitosos,
        totalCarreras,
        totalRegiones
    );


    actualizarEstado(
        exitosos
    );


    actualizarFecha();

    actualizarIconos();

}


/* =========================================================
   EXTRAER DATOS
========================================================= */

function extraerDatos(
    respuesta
) {

    if (!respuesta) {

        return [];

    }


    if (
        Array.isArray(
            respuesta
        )
    ) {

        return respuesta;

    }


    const candidatos = [

        respuesta.datos,

        respuesta.resultado
            ?.datos,

        respuesta.resultado,

        respuesta.data,

        respuesta.rows,

        respuesta.records

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


function obtenerTotal(
    respuesta,
    defecto = 0
) {

    const candidatos = [

        respuesta?.total,

        respuesta?.resultado
            ?.total,

        respuesta?.resumen
            ?.total,

        respuesta?.resultado
            ?.resumen
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
   CARRERAS
========================================================= */

function renderizarCarreras(
    registros,
    total
) {

    const contenedor =
        document.getElementById(
            "statsCareersList"
        );


    if (!contenedor) {

        return;

    }


    if (
        !registros.length
    ) {

        const motivo =
            estadisticasState
                .carreras
                ?.motivo ||
            "La fuente oficial no devolvió registros en esta consulta.";


        contenedor.innerHTML =
            `
            <div class="stats-empty">

                <i data-lucide="circle-off"></i>

                <strong>
                    No hay carreras disponibles
                </strong>

                <span>
                    ${escaparHTML(motivo)}
                </span>

            </div>
            `;


        return;

    }


    const nombres =
        obtenerUnicos(
            registros
                .map(
                    registro =>
                        valorCampo(
                            registro,
                            [
                                "nombre",
                                "carrera",
                                "CARRERA",
                                "nombreCarrera",
                                "NOMBRE_CARRERA",
                                "titulo"
                            ]
                        )
                )
                .filter(
                    Boolean
                )
        );


    const limite =
        16;


    contenedor.innerHTML =
        nombres
            .slice(
                0,
                limite
            )
            .map(
                (
                    nombre,
                    indice
                ) => `
                <div class="stats-list-item">

                    <span class="stats-list-index">
                        ${String(
                            indice + 1
                        ).padStart(
                            2,
                            "0"
                        )}
                    </span>

                    <span class="stats-list-name">
                        ${escaparHTML(nombre)}
                    </span>

                </div>
                `
            )
            .join("") +
        (
            total > limite
                ? `
                <div class="stats-more">
                    Mostrando ${limite} ejemplos de ${total}
                    registros recuperados.
                </div>
                `
                : ""
        );

}


/* =========================================================
   REGIONES
========================================================= */

function renderizarRegiones(
    registros,
    total
) {

    const contenedor =
        document.getElementById(
            "statsRegionsList"
        );


    if (!contenedor) {

        return;

    }


    if (
        !registros.length
    ) {

        contenedor.innerHTML =
            `
            <div class="stats-empty">

                <i data-lucide="map-off"></i>

                <strong>
                    No hay regiones disponibles
                </strong>

                <span>
                    RegionService no devolvió registros.
                </span>

            </div>
            `;


        return;

    }


    const nombres =
        obtenerUnicos(
            registros
                .map(
                    registro => {

                        if (
                            typeof registro ===
                            "string"
                        ) {

                            return registro;

                        }


                        return valorCampo(
                            registro,
                            [
                                "nombre",
                                "departamento",
                                "region",
                                "REGION",
                                "DEPARTAMENTO",
                                "descripcion",
                                "titulo"
                            ]
                        );

                    }
                )
                .filter(
                    Boolean
                )
        );


    contenedor.innerHTML =
        nombres
            .map(
                nombre => `
                <div class="stats-region-chip">
                    <i data-lucide="map-pin"></i>
                    <span>${escaparHTML(nombre)}</span>
                </div>
                `
            )
            .join("");


    if (
        !nombres.length &&
        total > 0
    ) {

        contenedor.innerHTML =
            `
            <div class="stats-empty">

                <i data-lucide="map"></i>

                <strong>
                    ${total} región(es) recuperada(s)
                </strong>

                <span>
                    El servicio respondió, pero los nombres
                    usan un formato no reconocido por esta vista.
                </span>

            </div>
            `;

    }

}


/* =========================================================
   FUENTES
========================================================= */

function actualizarFuenteCarreras() {

    const fuente =
        estadisticasState
            .carreras
            ?.fuente ||
        estadisticasState
            .carreras
            ?.resultado
            ?.fuente ||
        "CarreraService";


    colocarTexto(
        "statsCareersSource",
        fuente
    );

}


function contarFuentesOficiales() {

    let total =
        0;


    const carrera =
        estadisticasState.carreras;


    if (
        carrera &&
        (
            carrera.fuenteOficial ===
                true ||
            carrera.resultado
                ?.fuenteOficial ===
                true
        ) &&
        (
            carrera.disponible !==
                false &&
            carrera.resultado
                ?.disponible !==
                false
        )
    ) {

        total += 1;

    }


    const health =
        estadisticasState.health
            ?.resultado ||
        estadisticasState.health ||
        {};


    const fuenteExterna =
        health.fuenteExterna ||
        {};


    total +=
        numero(
            fuenteExterna.apiPronabec
        ) +
        numero(
            fuenteExterna.portalNacional
        ) +
        numero(
            fuenteExterna.portalPronabec
        );


    return total;

}


/* =========================================================
   RESUMEN
========================================================= */

function actualizarResumen(
    exitosos,
    totalCarreras,
    totalRegiones
) {

    colocarTexto(
        "statsSummaryTitle",
        exitosos === 4
            ? "Servicios analizados correctamente"
            : "Consulta completada parcialmente"
    );


    colocarTexto(
        "statsSummaryText",
        `${exitosos} de 4 servicios respondieron correctamente. ` +
        `Se detectaron ${totalCarreras} carrera(s) y ` +
        `${totalRegiones} región(es) en la consulta actual.`
    );

}


/* =========================================================
   ESTADO
========================================================= */

function actualizarEstado(
    exitosos
) {

    const health =
        estadisticasState.health
            ?.resultado ||
        estadisticasState.health;


    const estadoHealth =
        String(
            health?.estado ||
            ""
        )
        .toUpperCase();


    if (
        exitosos === 4 &&
        estadoHealth ===
            "OPERATIVO"
    ) {

        colocarTexto(
            "statsStatus",
            "Operativo"
        );


        colocarTexto(
            "statsStatusDetail",
            "Servicios y fuentes disponibles"
        );


        return;

    }


    if (
        exitosos >= 2
    ) {

        colocarTexto(
            "statsStatus",
            "Operativo parcial"
        );


        colocarTexto(
            "statsStatusDetail",
            "Algunas fuentes externas pueden no estar disponibles"
        );


        return;

    }


    colocarTexto(
        "statsStatus",
        "Requiere revisión"
    );


    colocarTexto(
        "statsStatusDetail",
        "No se obtuvo respuesta suficiente"
    );

}


/* =========================================================
   FECHA
========================================================= */

function actualizarFecha() {

    const health =
        estadisticasState.health
            ?.resultado ||
        estadisticasState.health;


    const fecha =
        health?.fecha
            ? new Date(
                health.fecha
            )
            : new Date();


    colocarTexto(
        "statsLastUpdate",
        `Última actualización: ${fecha.toLocaleString(
            "es-PE"
        )}`
    );

}


/* =========================================================
   HELPERS
========================================================= */

function valorCampo(
    objeto,
    campos
) {

    for (
        const campo
        of campos
    ) {

        const valor =
            objeto?.[campo];


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


function obtenerUnicos(
    registros
) {

    const mapa =
        new Map();


    registros.forEach(
        item => {

            const texto =
                String(
                    item ||
                    ""
                )
                .trim();


            if (!texto) {

                return;

            }


            const clave =
                normalizar(
                    texto
                );


            if (
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


function actualizarIconos() {

    if (
        window.lucide &&
        typeof window.lucide
            .createIcons ===
            "function"
    ) {

        window.lucide
            .createIcons();

    }

}
