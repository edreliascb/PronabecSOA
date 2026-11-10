const service =
    require("../services/notificacion.service");

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
            await service.listar(req.usuario.id);

        return res.json({
            success: true,
            servicio: "NotificacionService",
            total: resultado.length,
            resultado
        });
    } catch (error) {
        return responderError(res, error, "NotificacionService");
    }
}

async function crear(req, res) {
    try {
        const resultado =
            await service.crear(
                req.usuario.id,
                req.body
            );

        return res.status(201).json({
            success: true,
            servicio: "NotificacionService",
            resultado
        });
    } catch (error) {
        return responderError(res, error, "NotificacionService");
    }
}

async function marcarLeida(req, res) {
    try {
        const resultado =
            await service.marcarLeida(
                req.usuario.id,
                req.params.id
            );

        return res.json({
            success: true,
            servicio: "NotificacionService",
            resultado
        });
    } catch (error) {
        return responderError(res, error, "NotificacionService");
    }
}

async function eliminar(req, res) {
    try {
        const resultado =
            await service.eliminar(
                req.usuario.id,
                req.params.id
            );

        return res.json({
            success: true,
            servicio: "NotificacionService",
            resultado
        });
    } catch (error) {
        return responderError(res, error, "NotificacionService");
    }
}

module.exports = {
    listar,
    crear,
    marcarLeida,
    eliminar
};
