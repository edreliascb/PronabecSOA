const service =
    require("../services/cronogramaConvocatoria.service");

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


async function listar(req, res) {
    try {
        const resultado = await service.listarCronogramas();
        return res.json({
            success: true,
            servicio: "CronogramaConvocatoriaService",
            resultado
        });
    } catch (error) {
        return responderError(res, error, "CronogramaConvocatoriaService");
    }
}

async function porConvocatoria(req, res) {
    try {
        const resultado = await service.obtenerPorConvocatoria(req.params.id);
        return res.json({
            success: true,
            servicio: "CronogramaConvocatoriaService",
            resultado
        });
    } catch (error) {
        return responderError(res, error, "CronogramaConvocatoriaService");
    }
}

module.exports = {
    listar,
    porConvocatoria
};
