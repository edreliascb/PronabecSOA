const service =
    require("../services/evaluacionElegibilidad.service");

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
                status >=
                500
                    ? "No se pudo completar la operación."
                    : error.message

        });

}


async function evaluar(req, res) {
    try {
        const oportunidadId =
            req.body?.oportunidadId ??
            req.body?.oportunidad_id;

        if (!oportunidadId) {
            return res.status(400).json({
                success: false,
                servicio: "EvaluacionElegibilidadService",
                mensaje: "oportunidadId es obligatorio."
            });
        }

        const resultado =
            await service.evaluarElegibilidad(
                req.usuario.id,
                oportunidadId
            );

        return res.json({
            success: true,
            servicio: "EvaluacionElegibilidadService",
            resultado
        });
    } catch (error) {
        return responderError(res, error, "EvaluacionElegibilidadService");
    }
}

module.exports = {
    evaluar
};
