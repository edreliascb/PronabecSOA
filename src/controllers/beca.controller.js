const servicio =
    require("../services/beca.service");


function responderError(
    res,
    error
) {
    console.error(
        "[BecaService]",
        error.message
    );

    return res
        .status(500)
        .json({
            success:
                false,
            servicio:
                "BecaService",
            mensaje:
                "No se pudo completar la operación."
        });
}


async function listar(req, res) {
    try {
        const resultado =
            await servicio.listarBecas();

        return res.json({
            success: true,
            servicio: "BecaService",
            resultado
        });
    } catch (error) {
        return responderError(res, error);
    }
}

async function buscar(req, res) {
    try {
        const resultado =
            await servicio.buscarBecas(
                req.query.texto || ""
            );

        return res.json({
            success: true,
            servicio: "BecaService",
            resultado
        });
    } catch (error) {
        return responderError(res, error);
    }
}

async function obtenerPorId(req, res) {
    try {
        const resultado =
            await servicio.obtenerBecaPorId(
                req.params.id
            );

        if (!resultado) {
            return res
                .status(404)
                .json({
                    success: false,
                    servicio: "BecaService",
                    mensaje: "Beca no encontrada."
                });
        }

        return res.json({
            success: true,
            servicio: "BecaService",
            resultado
        });
    } catch (error) {
        return responderError(res, error);
    }
}


module.exports = {
    listar,
    buscar,
    obtenerPorId
};
