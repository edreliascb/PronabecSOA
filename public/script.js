let convocatoriasGlobales = [];
let postulacionesGlobales = [];
let documentosGlobales = [];
let conveniosGlobales = [];

let servicioConvocatorias = null;
let servicioPostulaciones = null;
let servicioDocumentos = null;
let servicioConvenios = null;


// =============================================
// CARGA PRINCIPAL
// =============================================

async function cargarTodo() {

    mostrarCargando();

    try {

        const [
            respuestaConsulta,
            respuestaEstadisticas
        ] = await Promise.all([

            fetch("/api/consulta"),

            fetch("/api/estadisticas")

        ]);


        if (!respuestaConsulta.ok) {

            throw new Error(
                "Error en el Servicio Orquestador."
            );

        }


        if (!respuestaEstadisticas.ok) {

            throw new Error(
                "Error en EstadisticaService."
            );

        }


        const datosConsulta =
            await respuestaConsulta.json();


        const datosEstadisticas =
            await respuestaEstadisticas.json();


        const resultado =
            datosConsulta.resultado;


        const estadisticas =
            datosEstadisticas.resultado;


        if (!resultado) {

            throw new Error(
                "El orquestador no devolvió información."
            );

        }


        // =====================================
        // GUARDAR SERVICIOS
        // =====================================

        servicioConvocatorias =
            resultado.convocatorias;


        servicioPostulaciones =
            resultado.postulaciones;


        servicioDocumentos =
            resultado.documentos;


        servicioConvenios =
            resultado.convenios;


        // =====================================
        // EXTRAER REGISTROS
        // =====================================

        convocatoriasGlobales =
            extraerDatos(
                servicioConvocatorias
            );


        postulacionesGlobales =
            extraerDatos(
                servicioPostulaciones
            );


        documentosGlobales =
            extraerDatos(
                servicioDocumentos
            );


        conveniosGlobales =
            extraerDatos(
                servicioConvenios
            );


        // =====================================
        // ESTADO
        // =====================================

        mostrarEstadoServicios(
            resultado.estadoServicios
        );


        // =====================================
        // ESTADÍSTICAS
        // =====================================

        mostrarEstadisticas(
            estadisticas
        );


        // =====================================
        // TARJETAS
        // =====================================

        mostrarConvocatorias(
            convocatoriasGlobales,
            servicioConvocatorias
        );


        mostrarPostulaciones(
            postulacionesGlobales,
            servicioPostulaciones
        );


        mostrarDocumentos(
            documentosGlobales,
            servicioDocumentos
        );


        mostrarConvenios(
            conveniosGlobales,
            servicioConvenios
        );


    } catch (error) {

        console.error(
            "ERROR GENERAL:",
            error
        );


        mostrarErrorGeneral();

    }

}


// =============================================
// EXTRAER DATOS
// =============================================

function extraerDatos(servicio) {

    if (!servicio) {
        return [];
    }


    const datos =
        servicio.datos;


    if (Array.isArray(datos)) {
        return datos;
    }


    if (!datos) {
        return [];
    }


    if (Array.isArray(datos.data)) {
        return datos.data;
    }


    if (Array.isArray(datos.rows)) {
        return datos.rows;
    }


    if (Array.isArray(datos.records)) {
        return datos.records;
    }


    if (
        datos.result &&
        Array.isArray(
            datos.result.records
        )
    ) {

        return datos.result.records;

    }


    for (const propiedad in datos) {

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


// =============================================
// SEGURIDAD HTML
// =============================================

function escaparHTML(valor) {

    return String(
        valor ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            "\"",
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


// =============================================
// BUSCAR CAMPO
// =============================================

function obtenerValor(
    objeto,
    campos,
    defecto = "No especificado"
) {

    for (const campo of campos) {

        if (
            objeto[campo] !== undefined &&
            objeto[campo] !== null &&
            String(
                objeto[campo]
            ).trim() !== ""
        ) {

            return objeto[campo];

        }

    }


    return defecto;

}


// =============================================
// ESTADÍSTICAS
// =============================================

function mostrarEstadisticas(
    estadisticas
) {

    if (!estadisticas) {
        return;
    }


    const resumen =
        estadisticas.resumen || {};


    colocarTexto(
        "totalConvocatorias",
        resumen.totalConvocatorias || 0
    );


    colocarTexto(
        "totalPostulaciones",
        resumen.totalPostulaciones || 0
    );


    colocarTexto(
        "totalDocumentos",
        resumen.totalDocumentos || 0
    );


    colocarTexto(
        "totalConvenios",
        resumen.totalConvenios || 0
    );


    colocarTexto(
        "totalCarreras",
        resumen.totalCarreras || 0
    );


    colocarTexto(
        "totalRegiones",
        resumen.totalRegiones || 0
    );


    cargarCatalogos(
        estadisticas.catalogos || {}
    );


    mostrarFuentes(
        estadisticas.fuentes || {}
    );

}


// =============================================
// CATÁLOGOS
// =============================================

function cargarCatalogos(
    catalogos
) {

    cargarSelect(
        "filtroCarrera",
        catalogos.carreras || [],
        "Todas las carreras"
    );


    cargarSelect(
        "filtroRegion",
        catalogos.regiones || [],
        "Todas las regiones"
    );

}


function cargarSelect(
    id,
    valores,
    textoInicial
) {

    const select =
        document.getElementById(id);


    select.innerHTML =
        `
        <option value="">
            ${escaparHTML(textoInicial)}
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

}


// =============================================
// FUENTES
// =============================================

function mostrarFuentes(
    fuentes
) {

    colocarTexto(
        "fuenteConvocatorias",
        formatoFuente(
            fuentes.convocatorias
        )
    );


    colocarTexto(
        "fuentePostulaciones",
        formatoFuente(
            fuentes.postulaciones
        )
    );


    colocarTexto(
        "fuenteDocumentos",
        formatoFuente(
            fuentes.documentos
        )
    );


    colocarTexto(
        "fuenteConvenios",
        formatoFuente(
            fuentes.convenios
        )
    );

}


function formatoFuente(
    fuente
) {

    if (fuente === "API") {

        return "API PRONABEC";

    }


    if (fuente === "RESPALDO") {

        return "Respaldo temporal";

    }


    return fuente || "Sin información";

}


// =============================================
// ESTADO SERVICIOS
// =============================================

function mostrarEstadoServicios(
    estados = {}
) {

    actualizarEstado(
        "estadoConvocatorias",
        estados.convocatorias
    );


    actualizarEstado(
        "estadoPostulaciones",
        estados.postulaciones
    );


    actualizarEstado(
        "estadoDocumentos",
        estados.documentos
    );


    actualizarEstado(
        "estadoConvenios",
        estados.convenios
    );


    actualizarEstado(
        "estadoPlataforma",
        estados.plataforma
    );

}


function actualizarEstado(
    id,
    estado
) {

    const elemento =
        document.getElementById(id);


    if (!elemento) {
        return;
    }


    elemento.textContent =
        estado || "Sin información";


    elemento.classList.remove(
        "estado-ok",
        "estado-respaldo",
        "estado-error"
    );


    const texto =
        String(
            estado || ""
        ).toLowerCase();


    if (
        texto.includes("disponible") ||
        texto.includes("operativa")
    ) {

        elemento.classList.add(
            "estado-ok"
        );

    } else if (
        texto.includes("respaldo")
    ) {

        elemento.classList.add(
            "estado-respaldo"
        );

    } else {

        elemento.classList.add(
            "estado-error"
        );

    }

}


// =============================================
// CONVOCATORIAS
// =============================================

function mostrarConvocatorias(
    registros,
    servicio
) {

    const contenedor =
        document.getElementById(
            "listaConvocatorias"
        );


    if (!registros.length) {

        contenedor.innerHTML =
            `
            <p class="mensaje">
                No se encontraron convocatorias.
            </p>
            `;

        return;

    }


    contenedor.innerHTML =
        registros.map(

            item => {

                const convocatoria =
                    obtenerValor(
                        item,
                        [
                            "convocatoria",
                            "CONVOCATORIA",
                            "nombreConvocatoria",
                            "NOMBRE_CONVOCATORIA",
                            "nombre"
                        ]
                    );


                const carrera =
                    obtenerValor(
                        item,
                        [
                            "carrera",
                            "CARRERA",
                            "nombreCarrera",
                            "NOMBRE_CARRERA"
                        ]
                    );


                const sede =
                    obtenerValor(
                        item,
                        [
                            "sede",
                            "SEDE",
                            "region",
                            "REGION",
                            "ubicacion",
                            "UBICACION"
                        ]
                    );


                const estado =
                    obtenerValor(
                        item,
                        [
                            "estado",
                            "ESTADO"
                        ],
                        "Vigente"
                    );


                return `
                    <div class="card">

                        <h3>
                            ${escaparHTML(convocatoria)}
                        </h3>

                        <p>
                            <strong>Carrera:</strong>
                            ${escaparHTML(carrera)}
                        </p>

                        <p>
                            <strong>Región / sede:</strong>
                            ${escaparHTML(sede)}
                        </p>

                        <p>
                            <strong>Estado:</strong>
                            ${escaparHTML(estado)}
                        </p>

                        ${crearEtiquetaFuente(servicio)}

                    </div>
                `;

            }

        ).join("");

}


// =============================================
// POSTULACIONES
// =============================================

function mostrarPostulaciones(
    registros,
    servicio
) {

    const contenedor =
        document.getElementById(
            "listaPostulaciones"
        );


    if (!registros.length) {

        contenedor.innerHTML =
            `
            <p class="mensaje">
                No se encontraron postulaciones.
            </p>
            `;

        return;

    }


    contenedor.innerHTML =
        registros.map(

            item => {

                const nombre =
                    obtenerValor(
                        item,
                        [
                            "postulante",
                            "POSTULANTE",
                            "nombre",
                            "NOMBRE"
                        ],
                        "Registro de postulación"
                    );


                const convocatoria =
                    obtenerValor(
                        item,
                        [
                            "convocatoria",
                            "CONVOCATORIA"
                        ]
                    );


                const carrera =
                    obtenerValor(
                        item,
                        [
                            "carrera",
                            "CARRERA"
                        ]
                    );


                const region =
                    obtenerValor(
                        item,
                        [
                            "region",
                            "REGION",
                            "ubicacion",
                            "UBICACION",
                            "sede",
                            "SEDE"
                        ]
                    );


                return `
                    <div class="card">

                        <h3>
                            ${escaparHTML(nombre)}
                        </h3>

                        <p>
                            <strong>Convocatoria:</strong>
                            ${escaparHTML(convocatoria)}
                        </p>

                        <p>
                            <strong>Carrera:</strong>
                            ${escaparHTML(carrera)}
                        </p>

                        <p>
                            <strong>Región:</strong>
                            ${escaparHTML(region)}
                        </p>

                        ${crearEtiquetaFuente(servicio)}

                    </div>
                `;

            }

        ).join("");

}


// =============================================
// DOCUMENTOS
// =============================================

function mostrarDocumentos(
    registros,
    servicio
) {

    const contenedor =
        document.getElementById(
            "listaDocumentos"
        );


    if (!registros.length) {

        contenedor.innerHTML =
            `
            <p class="mensaje">
                No se encontraron documentos.
            </p>
            `;

        return;

    }


    contenedor.innerHTML =
        registros.map(

            item => {

                const documento =
                    obtenerValor(
                        item,
                        [
                            "documento",
                            "DOCUMENTO",
                            "nombre",
                            "NOMBRE"
                        ]
                    );


                const descripcion =
                    obtenerValor(
                        item,
                        [
                            "descripcion",
                            "DESCRIPCION",
                            "detalle",
                            "DETALLE"
                        ]
                    );


                const obligatorio =
                    obtenerValor(
                        item,
                        [
                            "obligatorio",
                            "OBLIGATORIO"
                        ],
                        "Según convocatoria"
                    );


                return `
                    <div class="card">

                        <h3>
                            ${escaparHTML(documento)}
                        </h3>

                        <p>
                            ${escaparHTML(descripcion)}
                        </p>

                        <p>
                            <strong>Obligatorio:</strong>
                            ${escaparHTML(obligatorio)}
                        </p>

                        ${crearEtiquetaFuente(servicio)}

                    </div>
                `;

            }

        ).join("");

}


// =============================================
// CONVENIOS
// =============================================

function mostrarConvenios(
    registros,
    servicio
) {

    const contenedor =
        document.getElementById(
            "listaConvenios"
        );


    if (!registros.length) {

        contenedor.innerHTML =
            `
            <p class="mensaje">
                No se encontraron convenios.
            </p>
            `;

        return;

    }


    contenedor.innerHTML =
        registros.map(

            item => {

                const entidad =
                    obtenerValor(
                        item,
                        [
                            "entidad",
                            "ENTIDAD",
                            "institucion",
                            "INSTITUCION",
                            "nombre",
                            "NOMBRE"
                        ],
                        "Convenio PRONABEC"
                    );


                const tipo =
                    obtenerValor(
                        item,
                        [
                            "tipoConvenio",
                            "TIPO_CONVENIO",
                            "tipo_convenio"
                        ]
                    );


                const ubicacion =
                    obtenerValor(
                        item,
                        [
                            "ubicacion",
                            "UBICACION",
                            "region",
                            "REGION",
                            "departamento",
                            "DEPARTAMENTO"
                        ]
                    );


                return `
                    <div class="card">

                        <h3>
                            ${escaparHTML(entidad)}
                        </h3>

                        <p>
                            <strong>Convenio:</strong>
                            ${escaparHTML(tipo)}
                        </p>

                        <p>
                            <strong>Ubicación:</strong>
                            ${escaparHTML(ubicacion)}
                        </p>

                        ${crearEtiquetaFuente(servicio)}

                    </div>
                `;

            }

        ).join("");

}


// =============================================
// FILTROS DEL DASHBOARD
// =============================================

function aplicarFiltrosDashboard() {

    const carrera =
        document.getElementById(
            "filtroCarrera"
        ).value
        .toLowerCase();


    const region =
        document.getElementById(
            "filtroRegion"
        ).value
        .toLowerCase();


    const convocatoriasFiltradas =
        convocatoriasGlobales.filter(

            item => {

                const texto =
                    JSON.stringify(item)
                        .toLowerCase();


                const cumpleCarrera =
                    !carrera ||
                    texto.includes(carrera);


                const cumpleRegion =
                    !region ||
                    texto.includes(region);


                return (
                    cumpleCarrera &&
                    cumpleRegion
                );

            }

        );


    const postulacionesFiltradas =
        postulacionesGlobales.filter(

            item => {

                const texto =
                    JSON.stringify(item)
                        .toLowerCase();


                const cumpleCarrera =
                    !carrera ||
                    texto.includes(carrera);


                const cumpleRegion =
                    !region ||
                    texto.includes(region);


                return (
                    cumpleCarrera &&
                    cumpleRegion
                );

            }

        );


    const conveniosFiltrados =
        conveniosGlobales.filter(

            item => {

                const texto =
                    JSON.stringify(item)
                        .toLowerCase();


                return (
                    !region ||
                    texto.includes(region)
                );

            }

        );


    mostrarConvocatorias(
        convocatoriasFiltradas,
        servicioConvocatorias
    );


    mostrarPostulaciones(
        postulacionesFiltradas,
        servicioPostulaciones
    );


    mostrarConvenios(
        conveniosFiltrados,
        servicioConvenios
    );


    colocarTexto(
        "totalConvocatorias",
        convocatoriasFiltradas.length
    );


    colocarTexto(
        "totalPostulaciones",
        postulacionesFiltradas.length
    );


    colocarTexto(
        "totalConvenios",
        conveniosFiltrados.length
    );

}


function limpiarFiltrosDashboard() {

    document.getElementById(
        "filtroCarrera"
    ).value = "";


    document.getElementById(
        "filtroRegion"
    ).value = "";


    mostrarConvocatorias(
        convocatoriasGlobales,
        servicioConvocatorias
    );


    mostrarPostulaciones(
        postulacionesGlobales,
        servicioPostulaciones
    );


    mostrarConvenios(
        conveniosGlobales,
        servicioConvenios
    );


    colocarTexto(
        "totalConvocatorias",
        convocatoriasGlobales.length
    );


    colocarTexto(
        "totalPostulaciones",
        postulacionesGlobales.length
    );


    colocarTexto(
        "totalConvenios",
        conveniosGlobales.length
    );

}


// =============================================
// BUSCADORES
// =============================================

function filtrarConvocatorias() {

    const texto =
        document.getElementById(
            "buscarConvocatoria"
        ).value
        .trim()
        .toLowerCase();


    const resultados =
        convocatoriasGlobales.filter(

            item =>
                JSON.stringify(item)
                    .toLowerCase()
                    .includes(texto)

        );


    mostrarConvocatorias(
        resultados,
        servicioConvocatorias
    );

}


function limpiarConvocatorias() {

    document.getElementById(
        "buscarConvocatoria"
    ).value = "";


    mostrarConvocatorias(
        convocatoriasGlobales,
        servicioConvocatorias
    );

}


function filtrarConvenios() {

    const texto =
        document.getElementById(
            "buscarConvenio"
        ).value
        .trim()
        .toLowerCase();


    const resultados =
        conveniosGlobales.filter(

            item =>
                JSON.stringify(item)
                    .toLowerCase()
                    .includes(texto)

        );


    mostrarConvenios(
        resultados,
        servicioConvenios
    );

}


function limpiarConvenios() {

    document.getElementById(
        "buscarConvenio"
    ).value = "";


    mostrarConvenios(
        conveniosGlobales,
        servicioConvenios
    );

}


// =============================================
// ETIQUETA FUENTE
// =============================================

function crearEtiquetaFuente(
    servicio
) {

    if (!servicio) {
        return "";
    }


    const respaldo =
        servicio.modo ===
        "RESPALDO";


    return `
        <span class="
            etiqueta
            ${
                respaldo
                    ? "fuente-respaldo"
                    : ""
            }
        ">
            ${
                respaldo
                    ? "Datos de respaldo"
                    : "API PRONABEC"
            }
        </span>
    `;

}


// =============================================
// UTILIDADES
// =============================================

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


function mostrarCargando() {

    const ids = [

        "estadoConvocatorias",
        "estadoPostulaciones",
        "estadoDocumentos",
        "estadoConvenios",
        "estadoPlataforma"

    ];


    ids.forEach(

        id => {

            const elemento =
                document.getElementById(id);


            if (elemento) {

                elemento.textContent =
                    "Consultando...";


                elemento.className =
                    "estado";

            }

        }

    );

}


function mostrarErrorGeneral() {

    actualizarEstado(
        "estadoConvocatorias",
        "Error"
    );


    actualizarEstado(
        "estadoPostulaciones",
        "Error"
    );


    actualizarEstado(
        "estadoDocumentos",
        "Error"
    );


    actualizarEstado(
        "estadoConvenios",
        "Error"
    );


    actualizarEstado(
        "estadoPlataforma",
        "Error"
    );

}


// =============================================
// INICIO
// =============================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        cargarTodo();


        document
            .getElementById(
                "buscarConvocatoria"
            )
            .addEventListener(
                "keyup",
                event => {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        filtrarConvocatorias();

                    }

                }
            );


        document
            .getElementById(
                "buscarConvenio"
            )
            .addEventListener(
                "keyup",
                event => {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        filtrarConvenios();

                    }

                }
            );

    }
);