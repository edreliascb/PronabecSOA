const service =
    require("../services/requisitoElegibilidad.service");

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
        const resultado = await service.listarRequisitos();
        return res.json({
            success: true,
            servicio: "RequisitoElegibilidadService",
            resultado
        });
    } catch (error) {
        return responderError(res, error, "RequisitoElegibilidadService");
    }
}

async function porOportunidad(req, res) {
    try {
        const resultado =
            await service.listarRequisitosPorOportunidad(
                req.params.id
            );

        return res.json({
            success: true,
            servicio: "RequisitoElegibilidadService",
            resultado
        });
    } catch (error) {
        return responderError(res, error, "RequisitoElegibilidadService");
    }
}

module.exports = {
    listar,
    porOportunidad
};
