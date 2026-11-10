const service =
    require("../services/seguimientoPostulacion.service");

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
        const resultado =
            await service.listarSeguimientos(
                req.usuario.id
            );

        return res.json({
            success: true,
            servicio: "SeguimientoPostulacionService",
            total: resultado.length,
            resultado
        });
    } catch (error) {
        return responderError(res, error, "SeguimientoPostulacionService");
    }
}

async function crear(req, res) {
    try {
        const resultado =
            await service.crearSeguimiento(
                req.usuario.id,
                req.body
            );

        return res.status(201).json({
            success: true,
            servicio: "SeguimientoPostulacionService",
            resultado
        });
    } catch (error) {
        return responderError(res, error, "SeguimientoPostulacionService");
    }
}

async function cambiarEstado(req, res) {
    try {
        const resultado =
            await service.cambiarEstado(
                req.usuario.id,
                req.params.id,
                req.body?.estado
            );

        return res.json({
            success: true,
            servicio: "SeguimientoPostulacionService",
            resultado
        });
    } catch (error) {
        return responderError(res, error, "SeguimientoPostulacionService");
    }
}

async function eliminar(req, res) {
    try {
        const resultado =
            await service.eliminarSeguimiento(
                req.usuario.id,
                req.params.id
            );

        return res.json({
            success: true,
            servicio: "SeguimientoPostulacionService",
            resultado
        });
    } catch (error) {
        return responderError(res, error, "SeguimientoPostulacionService");
    }
}

module.exports = {
    listar,
    crear,
    cambiarEstado,
    eliminar
};
