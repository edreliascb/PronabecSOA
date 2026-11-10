const integracionPronabec =
    require(
        "./integracionPronabec.service"
    );


/* =========================================================
   CONVOCATORIAS - SOLO FUENTES OFICIALES

   IMPORTANTE:
   El recurso ConvocatoriaCarreraVigentes actualmente puede
   responder vacío. Si eso ocurre, IntegracionPronabecService
   consulta la publicación oficial "Convocatorias Vigentes"
   de PRONABEC en la Plataforma Nacional de Datos Abiertos.

   NO EXISTEN DATOS DEMO NI RESPALDO LOCAL.
========================================================= */


const RECURSO =
    "ConvocatoriaCarreraVigentes";


/* =========================================================
   LISTAR
========================================================= */

async function listarConvocatorias(
    pagina = 1,
    filas = 10
) {

    try {

        const respuesta =
            await integracionPronabec
                .consultarPaginadoOficial(
                    RECURSO,
                    pagina,
                    filas
                );


        return {

            modo:
                respuesta.modo,

            fuente:
                respuesta.fuente,

            fuenteOficial:
                true,

            disponible:
                true,

            urlFuente:
                respuesta.urlFuente,

            total:
                respuesta.total,

            pagina:
                respuesta.pagina ||
                Number(pagina) ||
                1,

            filas:
                respuesta.filas ||
                Number(filas) ||
                10,

            fechaConsulta:
                respuesta.fechaConsulta,

            datos:
                respuesta.datos

        };

    } catch (error) {

        console.warn(
            `[ConvocatoriaService] Fuente oficial no disponible: ${error.message}`
        );


        return {

            modo:
                "NO_DISPONIBLE",

            fuente:
                "PRONABEC - Fuentes oficiales",

            fuenteOficial:
                true,

            disponible:
                false,

            motivo:
                error.message,

            total:
                0,

            datos:
                []

        };

    }

}


/* =========================================================
   BUSCAR
========================================================= */

async function buscarConvocatorias(
    texto
) {

    try {

        const respuesta =
            await integracionPronabec
                .consultarFuenteOficial(
                    RECURSO,
                    {
                        filter0:
                            texto
                    }
                );


        return {

            modo:
                respuesta.modo,

            fuente:
                respuesta.fuente,

            fuenteOficial:
                true,

            disponible:
                true,

            urlFuente:
                respuesta.urlFuente,

            total:
                respuesta.total,

            fechaConsulta:
                respuesta.fechaConsulta,

            datos:
                respuesta.datos

        };

    } catch (error) {

        console.warn(
            `[ConvocatoriaService] Búsqueda oficial no disponible: ${error.message}`
        );


        return {

            modo:
                "NO_DISPONIBLE",

            fuente:
                "PRONABEC - Fuentes oficiales",

            fuenteOficial:
                true,

            disponible:
                false,

            motivo:
                error.message,

            total:
                0,

            datos:
                []

        };

    }

}


/* =========================================================
   EXPORTAR
========================================================= */

module.exports = {

    listarConvocatorias,

    buscarConvocatorias

};
