/* =========================================================
   EDUPERÚ SOA
   HEALTH CHECK CONTROLLER
========================================================= */


const healthCheckService =
    require(
        "../services/healthCheck.service"
    );


/* =========================================================
   OBTENER ESTADO
========================================================= */

async function obtenerEstado(
    req,
    res
) {

    try {

        const resultado =
            await healthCheckService
                .obtenerEstadoSistema();


        /*
           El Health Check es informativo.
           Un estado DEGRADADO se devuelve como 200 para que
           el panel pueda leer el detalle de los componentes.
        */

        res.set(
            "Cache-Control",
            "no-store"
        );


        return res
            .status(200)
            .json({

                proyecto:
                    "EduPeruSOA",

                arquitectura:
                    "Arquitectura Orientada a Servicios - SOA",

                resultado

            });

    } catch (error) {

        console.error(
            "[HealthCheckService] Error interno:",
            error
        );


        return res
            .status(500)
            .json({

                success:
                    false,

                proyecto:
                    "EduPeruSOA",

                servicio:
                    "HealthCheckService",

                estado:
                    "ERROR",

                mensaje:
                    "No se pudo comprobar el estado del sistema."

            });

    }

}


/* =========================================================
   EXPORTAR
========================================================= */

module.exports = {

    obtenerEstado

};
