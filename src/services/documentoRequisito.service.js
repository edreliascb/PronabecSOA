const integracionPronabec =
    require(
        "./integracionPronabec.service"
    );


/* =========================================================
   DOCUMENTOS - SOLO DATOS OFICIALES

   No se utilizan DNI, constancias ni declaraciones juradas
   inventadas como respaldo. Si PRONABEC no publica registros
   accesibles, se devuelve [] con disponible:false.
========================================================= */


const RECURSO =
    "DocumentosSolicitadosABecarios";


async function listarDocumentos(
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
            `[DocumentoRequisitoService] Fuente oficial no disponible: ${error.message}`
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


async function buscarDocumentos(
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
            `[DocumentoRequisitoService] Búsqueda oficial no disponible: ${error.message}`
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

    listarDocumentos,

    buscarDocumentos

};
