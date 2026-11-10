const service =
    require("../services/reporte.service");

function responderError(
    res,
    error,
    servicio
) {

    const status =
        Number(
            error?.statusCode
        ) ||
        500;


    if (
        status >=
        500
    ) {

        console.error(
            `[${servicio}]`,
            error
        );

    }


    return res
        .status(
            status
        )
        .json({

            success:
                false,

            servicio,

            mensaje:
                status >= 500
                    ? "No se pudo completar la operación."
                    : error.message

        });

}


async function resumen(req, res) {
    try {
        const resultado =
            await service.obtenerResumen();

        return res.json({
            success: true,
            servicio: "ReporteService",
            resultado
        });
    } catch (error) {
        return responderError(res, error, "ReporteService");
    }
}

async function usuarios(req, res) {
    try {
        const resultado =
            await service.obtenerReporteUsuarios();

        return res.json({
            success: true,
            servicio: "ReporteService",
            resultado
        });
    } catch (error) {
        return responderError(res, error, "ReporteService");
    }
}

module.exports = {
    resumen,
    usuarios
};
