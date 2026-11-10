const servicio =
    require("../services/sedeEducativa.service");


function responderError(
    res,
    error
) {
    console.error(
        "[SedeEducativaService]",
        error.message
    );

    return res
        .status(500)
        .json({
            success:
                false,
            servicio:
                "SedeEducativaService",
            mensaje:
                "No se pudo completar la operación."
        });
}


async function listar(req, res) {
    try {
        const resultado =
            await servicio.listarSedes();

        return res.json({
            success: true,
            servicio: "SedeEducativaService",
            resultado
        });
    } catch (error) {
        return responderError(res, error);
    }
}

async function obtenerPorId(req, res) {
    try {
        const resultado =
            await servicio.obtenerSedePorId(
                req.params.id
            );

        if (!resultado) {
            return res
                .status(404)
                .json({
                    success: false,
                    servicio: "SedeEducativaService",
                    mensaje: "Sede no encontrada."
                });
        }

        return res.json({
            success: true,
            servicio: "SedeEducativaService",
            resultado
        });
    } catch (error) {
        return responderError(res, error);
    }
}


module.exports = {
    listar,
    obtenerPorId
};
