const convocatoriaService = require(
    "./convocatoria.service"
);

const documentoService = require(
    "./documentoRequisito.service"
);


// ======================================================
// EXTRAER REGISTROS
// ======================================================

function extraerRegistros(servicio) {

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

    const candidatos = [
        datos.data,
        datos.rows,
        datos.records,
        datos.result?.records,
        datos.result?.data
    ];

    for (const candidato of candidatos) {

        if (Array.isArray(candidato)) {
            return candidato;
        }

    }

    for (const propiedad in datos) {

        if (Array.isArray(datos[propiedad])) {
            return datos[propiedad];
        }

    }

    return [];
}


// ======================================================
// OBTENER VALOR
// ======================================================

function obtenerValor(
    objeto,
    campos,
    defecto = null
) {

    for (const campo of campos) {

        if (
            objeto?.[campo] !== undefined &&
            objeto?.[campo] !== null &&
            String(objeto[campo]).trim() !== ""
        ) {

            return objeto[campo];

        }

    }

    return defecto;
}


// ======================================================
// NORMALIZAR
// ======================================================

function normalizar(texto) {

    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}


// ======================================================
// BUSCAR OPORTUNIDAD POR ÍNDICE
// ======================================================

async function obtenerDetalleOportunidad(
    indice
) {

    const [
        respuestaConvocatorias,
        respuestaDocumentos
    ] = await Promise.all([

        convocatoriaService
            .listarConvocatorias(
                1,
                100
            ),

        documentoService
            .listarDocumentos(
                1,
                100
            )

    ]);


    const convocatorias =
        extraerRegistros(
            respuestaConvocatorias
        );


    const documentos =
        extraerRegistros(
            respuestaDocumentos
        );


    const posicion =
        Number(indice);


    if (
        Number.isNaN(posicion) ||
        posicion < 0 ||
        posicion >= convocatorias.length
    ) {

        throw new Error(
            "La oportunidad solicitada no existe."
        );

    }


    const oportunidad =
        convocatorias[posicion];


    const nombreConvocatoria =
        obtenerValor(
            oportunidad,
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


    // ==================================================
    // INTENTO DE RELACIÓN POR CAMPOS COMUNES
    // ==================================================

    const nombreNormalizado =
        normalizar(
            nombreConvocatoria
        );


    const documentosRelacionados =
        documentos.filter(
            documento => {

                const convocatoriaDocumento =
                    obtenerValor(
                        documento,
                        [
                            "convocatoria",
                            "CONVOCATORIA",
                            "nombreConvocatoria",
                            "NOMBRE_CONVOCATORIA"
                        ],
                        ""
                    );


                if (!convocatoriaDocumento) {
                    return false;
                }


                return normalizar(
                    convocatoriaDocumento
                ).includes(
                    nombreNormalizado
                );

            }
        );


    const existeRelacionExacta =
        documentosRelacionados.length > 0;


    const documentosFinales =
        existeRelacionExacta
            ? documentosRelacionados
            : documentos;


    return {

        servicio:
            "OportunidadDetalleService",

        tipo:
            "Servicio de Tarea / Composición",

        oportunidad:
            oportunidad,

        requisitos: {

            relacion:
                existeRelacionExacta
                    ? "RELACIONADOS"
                    : "GENERALES",

            mensaje:
                existeRelacionExacta
                    ? "Se encontraron documentos asociados a la convocatoria."
                    : "La fuente consultada no permitió establecer una relación exacta. Se muestran documentos generales disponibles.",

            total:
                documentosFinales.length,

            datos:
                documentosFinales

        },

        fuentes: {

            convocatorias:
                respuestaConvocatorias.modo,

            documentos:
                respuestaDocumentos.modo

        }

    };
}


// ======================================================
// EXPORTAR
// ======================================================

module.exports = {
    obtenerDetalleOportunidad
};