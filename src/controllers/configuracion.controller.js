const service =
    require("../services/configuracion.service");

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


async function listar(req, res) {
    try {
        const resultado =
            await service.listarConfiguracion();

        return res.json({
            success: true,
            servicio: "ConfiguracionService",
            total: resultado.length,
            resultado
        });
    } catch (error) {
        return responderError(
            res,
            error,
            "ConfiguracionService"
        );
    }
}


async function actualizar(req, res) {
    try {
        const resultado =
            await service.actualizarConfiguracion(
                req.usuario.id,
                req.params.clave,
                req.body
            );

        return res.json({
            success: true,
            servicio: "ConfiguracionService",
            resultado
        });
    } catch (error) {
        return responderError(
            res,
            error,
            "ConfiguracionService"
        );
    }
}


module.exports = {
    listar,
    actualizar
};
