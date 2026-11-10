const integracionPronabec =
    require(
        "./integracionPronabec.service"
    );


/* =========================================================
   CONVENIOS - SOLO DATOS OFICIALES

   API PRONABEC -> publicación oficial de PRONABEC en
   la Plataforma Nacional de Datos Abiertos.

   NO HAY CONVENIOS DE EJEMPLO.
========================================================= */


const RECURSO =
    "Convenio";


async function listarConvenios(
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
            `[ConvenioService] Fuente oficial no disponible: ${error.message}`
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


async function buscarConvenios(
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
            `[ConvenioService] Búsqueda oficial no disponible: ${error.message}`
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

    listarConvenios,

    buscarConvenios

};
