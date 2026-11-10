const service =
    require("../services/auditoria.service");

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


async function listar(req, res) {
    try {
        const resultado =
            await service.listarEventos(
                req.query.limite
            );

        return res.json({
            success: true,
            servicio: "AuditoriaService",
            total: resultado.length,
            resultado
        });
    } catch (error) {
        return responderError(
            res,
            error,
            "AuditoriaService"
        );
    }
}


async function registrar(req, res) {
    try {
        const resultado =
            await service.registrarEvento({
                ...req.body,
                id_usuario: req.usuario.id
            });

        return res.status(201).json({
            success: true,
            servicio: "AuditoriaService",
            resultado
        });
    } catch (error) {
        return responderError(
            res,
            error,
            "AuditoriaService"
        );
    }
}


module.exports = {
    listar,
    registrar
};
