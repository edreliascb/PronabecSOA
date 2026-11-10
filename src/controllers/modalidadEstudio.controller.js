const servicio =
    require("../services/modalidadEstudio.service");


function responderError(
    res,
    error
) {
    console.error(
        "[ModalidadEstudioService]",
        error.message
    );

    return res
        .status(500)
        .json({
            success:
                false,
            servicio:
                "ModalidadEstudioService",
            mensaje:
                "No se pudo completar la operación."
        });
}


async function listar(req, res) {
    try {
        const resultado =
            await servicio.listarModalidades();

        return res.json({
            success: true,
            servicio: "ModalidadEstudioService",
            resultado
        });
    } catch (error) {
        return responderError(res, error);
    }
}


module.exports = {
    listar
};
