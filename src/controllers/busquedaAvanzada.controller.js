const service =
    require("../services/busquedaAvanzada.service");

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


async function buscar(req, res) {
    try {
        const resultado =
            await service.buscar(req.query);

        return res.json({
            success: true,
            servicio: "BusquedaAvanzadaService",
            resultado
        });
    } catch (error) {
        return responderError(res, error, "BusquedaAvanzadaService");
    }
}

module.exports = {
    buscar
};
