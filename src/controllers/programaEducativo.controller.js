const servicio =
    require("../services/programaEducativo.service");


function responderError(
    res,
    error
) {
    console.error(
        "[ProgramaEducativoService]",
        error.message
    );

    return res
        .status(500)
        .json({
            success:
                false,
            servicio:
                "ProgramaEducativoService",
            mensaje:
                "No se pudo completar la operación."
        });
}


async function listar(req, res) {
    try {
        const resultado =
            await servicio.listarProgramas();

        return res.json({
            success: true,
            servicio: "ProgramaEducativoService",
            resultado
        });
    } catch (error) {
        return responderError(res, error);
    }
}

async function obtenerPorId(req, res) {
    try {
        const resultado =
            await servicio.obtenerProgramaPorId(
                req.params.id
            );

        if (!resultado) {
            return res
                .status(404)
                .json({
                    success: false,
                    servicio: "ProgramaEducativoService",
                    mensaje: "Programa no encontrado."
                });
        }

        return res.json({
            success: true,
            servicio: "ProgramaEducativoService",
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
