const service =
    require("../services/historialConsulta.service");

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
            await service.listarHistorial(
                req.usuario.id
            );

        return res.json({
            success: true,
            servicio: "HistorialConsultaService",
            total: resultado.length,
            resultado
        });
    } catch (error) {
        return responderError(res, error, "HistorialConsultaService");
    }
}

async function registrar(req, res) {
    try {
        const resultado =
            await service.registrarConsulta(
                req.usuario.id,
                req.body
            );

        return res.status(201).json({
            success: true,
            servicio: "HistorialConsultaService",
            resultado
        });
    } catch (error) {
        return responderError(res, error, "HistorialConsultaService");
    }
}

async function limpiar(req, res) {
    try {
        const resultado =
            await service.limpiarHistorial(
                req.usuario.id
            );

        return res.json({
            success: true,
            servicio: "HistorialConsultaService",
            resultado
        });
    } catch (error) {
        return responderError(res, error, "HistorialConsultaService");
    }
}

module.exports = {
    listar,
    registrar,
    limpiar
};
