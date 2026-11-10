const integracionPronabec =
    require(
        "./integracionPronabec.service"
    );


/* =========================================================
   POSTULACIONES - SOLO DATOS OFICIALES

   API PRONABEC -> Plataforma Nacional de Datos Abiertos.
   Nunca se devuelven postulantes ficticios.
========================================================= */


const RECURSO =
    "PostulacionesVigentes";


async function listarPostulaciones(
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
            `[PostulacionService] Fuente oficial no disponible: ${error.message}`
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


async function buscarPostulaciones(
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
            `[PostulacionService] Búsqueda oficial no disponible: ${error.message}`
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


module.exports = {

    listarPostulaciones,

    buscarPostulaciones

};
