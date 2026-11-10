const servicio =
    require("../services/carrera.service");


function responderError(
    res,
    error
) {
    console.error(
        "[CarreraService]",
        error.message
    );

    return res
        .status(500)
        .json({
            success:
                false,
            servicio:
                "CarreraService",
            mensaje:
                "No se pudo completar la operación."
        });
}


async function listar(req, res) {
    try {
        const resultado =
            await servicio.listarCarreras();

        return res.json({
            success: true,
            servicio: "CarreraService",
            resultado
        });
    } catch (error) {
        return responderError(res, error);
    }
}

async function buscar(req, res) {
    try {
        const resultado =
            await servicio.buscarCarreras(
                req.query.texto || ""
            );

        return res.json({
            success: true,
            servicio: "CarreraService",
            resultado
        });
    } catch (error) {
        return responderError(res, error);
    }
}


module.exports = {
    listar,
    buscar
};
