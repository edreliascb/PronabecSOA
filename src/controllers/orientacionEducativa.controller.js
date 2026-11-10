const service =
    require("../services/orientacionEducativa.service");

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


async function obtener(req, res) {
    try {
        const resultado =
            await service.obtenerOrientacion(
                req.usuario.id
            );

        return res.json({
            success: true,
            servicio: "OrientacionEducativaService",
            resultado
        });
    } catch (error) {
        return responderError(
            res,
            error,
            "OrientacionEducativaService"
        );
    }
}


module.exports = {
    obtener
};
