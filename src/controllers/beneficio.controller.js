const servicio =
    require("../services/beneficio.service");


function responderError(
    res,
    error
) {
    console.error(
        "[BeneficioService]",
        error.message
    );

    return res
        .status(500)
        .json({
            success:
                false,
            servicio:
                "BeneficioService",
            mensaje:
                "No se pudo completar la operación."
        });
}


async function listar(req, res) {
    try {
        const resultado =
            await servicio.listarBeneficios();

        return res.json({
            success: true,
            servicio: "BeneficioService",
            resultado
        });
    } catch (error) {
        return responderError(res, error);
    }
}

async function porOportunidad(req, res) {
    try {
        const resultado =
            await servicio.listarBeneficiosPorOportunidad(
                req.params.id
            );

        return res.json({
            success: true,
            servicio: "BeneficioService",
            resultado
        });
    } catch (error) {
        return responderError(res, error);
    }
}


module.exports = {
    listar,
    porOportunidad
};
