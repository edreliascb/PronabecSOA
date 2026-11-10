const service =
    require("../services/validacionDocumento.service");

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


async function validar(req, res) {
    try {
        const resultado =
            await service.validar(
                req.usuario.id,
                req.params.id
            );

        return res.json({
            success: true,
            servicio: "ValidacionDocumentoService",
            resultado
        });
    } catch (error) {
        return responderError(res, error, "ValidacionDocumentoService");
    }
}

module.exports = {
    validar
};
