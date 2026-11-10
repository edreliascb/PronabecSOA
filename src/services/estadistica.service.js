/* =========================================================
   EDUPERÚ SOA
   ESTADISTICA SERVICE
   CORREGIDO PARA CARRERAS Y REGIONES
========================================================= */


const convocatoriaService =
    require(
        "./convocatoria.service"
    );


const postulacionService =
    require(
        "./postulacion.service"
    );


const documentoService =
    require(
        "./documentoRequisito.service"
    );


const convenioService =
    require(
        "./convenio.service"
    );


const carreraService =
    require(
        "./carrera.service"
    );


const regionService =
    require(
        "./region.service"
    );


/* =========================================================
   CACHE
   Evita recalcular las 12 mil+ carreras en cada carga
========================================================= */

const CACHE_MS =
    5 * 60 * 1000;


let cacheEstadisticas = {

    fecha:
        0,

    datos:
        null

};


/* =========================================================
   EXTRAER REGISTROS DE DIFERENTES FORMATOS
========================================================= */

function extraerRegistros(
    servicio
) {

    if (!servicio) {

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
        servicio.resultado;


    if (
        Array.isArray(
            datos
        )
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


    if (
        typeof datos ===
        "object"
    ) {

        for (
            const propiedad
            in datos
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
   EXTRAER TOTAL
========================================================= */

function extraerTotal(
    servicio,
    defecto = 0
) {

    const candidatos = [

        servicio?.total,

        servicio?.resultado?.total,

        servicio?.paginacion?.total,

        servicio?.resultado?.paginacion?.total,

        servicio?.cantidad,

        servicio?.resultado?.cantidad

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
   EXTRAER FUENTE
========================================================= */

function extraerFuente(
    servicio,
    defecto = "No especificada"
) {

    return (
        servicio?.fuente ||
        servicio?.resultado?.fuente ||
        servicio?.modo ||
        servicio?.resultado?.modo ||
        defecto
    );

}


/* =========================================================
   EJECUTAR SERVICIO SIN ROMPER TODO EL RESUMEN
========================================================= */

async function ejecutarSeguro(
    funcion
) {

    try {

        return await funcion();

    } catch (error) {

        return {

            disponible:
                false,

            total:
                0,

            datos:
                [],

            motivo:
                error.message

        };

    }

}


/* =========================================================
   GENERAR ESTADÍSTICAS
========================================================= */

async function obtenerEstadisticas() {

    const ahora =
        Date.now();


    if (
        cacheEstadisticas.datos &&
        (
            ahora -
            cacheEstadisticas.fecha
        ) < CACHE_MS
    ) {

        return {

            ...cacheEstadisticas.datos,

            cache:
                true,

            cacheMinutos:
                5

        };

    }


    const [

        convocatoriasRespuesta,

        postulacionesRespuesta,

        documentosRespuesta,

        conveniosRespuesta,

        carrerasRespuesta,

        regionesRespuesta

    ] =
        await Promise.all([

            ejecutarSeguro(
                () =>
                    convocatoriaService
                        .listarConvocatorias(
                            1,
                            100
                        )
            ),

            ejecutarSeguro(
                () =>
                    postulacionService
                        .listarPostulaciones(
                            1,
                            100
                        )
            ),

            ejecutarSeguro(
                () =>
                    documentoService
                        .listarDocumentos(
                            1,
                            100
                        )
            ),

            ejecutarSeguro(
                () =>
                    convenioService
                        .listarConvenios(
                            1,
                            100
                        )
            ),

            ejecutarSeguro(
                () =>
                    carreraService
                        .listarCarreras()
            ),

            ejecutarSeguro(
                () =>
                    regionService
                        .listarRegiones()
            )

        ]);


    const convocatorias =
        extraerRegistros(
            convocatoriasRespuesta
        );


    const postulaciones =
        extraerRegistros(
            postulacionesRespuesta
        );


    const documentos =
        extraerRegistros(
            documentosRespuesta
        );


    const convenios =
        extraerRegistros(
            conveniosRespuesta
        );


    const carreras =
        extraerRegistros(
            carrerasRespuesta
        );


    const regionesRegistros =
        extraerRegistros(
            regionesRespuesta
        );


    const totalConvocatorias =
        extraerTotal(
            convocatoriasRespuesta,
            convocatorias.length
        );


    const totalPostulaciones =
        extraerTotal(
            postulacionesRespuesta,
            postulaciones.length
        );


    const totalDocumentos =
        extraerTotal(
            documentosRespuesta,
            documentos.length
        );


    const totalConvenios =
        extraerTotal(
            conveniosRespuesta,
            convenios.length
        );


    const totalCarreras =
        extraerTotal(
            carrerasRespuesta,
            carreras.length
        );


    const totalRegiones =
        extraerTotal(
            regionesRespuesta,
            regionesRegistros.length
        );


    /* =====================================================
       CATÁLOGO DE REGIONES
       Dashboard lo usa para el selector "Todo el Perú".
    ===================================================== */

    const regiones =
        regionesRegistros
            .map(
                region => {

                    if (
                        typeof region ===
                        "string"
                    ) {

                        return region.trim();

                    }


                    return String(
                        region?.nombre ||
                        region?.departamento ||
                        region?.region ||
                        ""
                    )
                    .trim();

                }
            )
            .filter(
                Boolean
            );


    /*
       No devolvemos las 12 mil+ carreras en catalogos.carreras.
       El Dashboard solo necesita el total.
       La página de Carreras usa /api/carreras directamente.
    */

    const resultado = {

        servicio:
            "EstadisticaService",

        tipo:
            "Servicio de Tarea / Analítica",

        descripcion:
            "Consolida indicadores de los servicios empresariales de EduPerú.",

        resumen: {

            totalConvocatorias,

            totalPostulaciones,

            totalDocumentos,

            totalConvenios,

            totalCarreras,

            totalRegiones

        },


        catalogos: {

            carreras:
                [],

            regiones

        },


        fuentes: {

            convocatorias:
                extraerFuente(
                    convocatoriasRespuesta
                ),

            postulaciones:
                extraerFuente(
                    postulacionesRespuesta
                ),

            documentos:
                extraerFuente(
                    documentosRespuesta
                ),

            convenios:
                extraerFuente(
                    conveniosRespuesta
                ),

            carreras:
                extraerFuente(
                    carrerasRespuesta,
                    "CarreraService"
                ),

            regiones:
                extraerFuente(
                    regionesRespuesta,
                    "RegionService"
                )

        },


        disponibilidad: {

            carreras:
                carrerasRespuesta
                    ?.disponible !==
                    false,

            regiones:
                regionesRespuesta
                    ?.disponible !==
                    false

        },


        cache:
            false,

        cacheMinutos:
            5

    };


    cacheEstadisticas = {

        fecha:
            ahora,

        datos:
            resultado

    };


    return resultado;

}


/* =========================================================
   LIMPIAR CACHE
   Útil para pruebas internas si se necesita.
========================================================= */

function limpiarCache() {

    cacheEstadisticas = {

        fecha:
            0,

        datos:
            null

    };

}


/* =========================================================
   EXPORTAR
========================================================= */

module.exports = {

    obtenerEstadisticas,

    limpiarCache

};
