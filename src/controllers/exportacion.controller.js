const service =
    require("../services/exportacion.service");

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


function enviarExportacion(
    res,
    resultado
) {

    if (
        resultado.formato ===
        "csv"
    ) {

        res.setHeader(
            "Content-Type",
            "text/csv; charset=utf-8"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${resultado.nombreArchivo}"`
        );

        return res.send(
            "\uFEFF" +
            resultado.contenido
        );

    }


    return res.json({
        success: true,
        servicio: "ExportacionService",
        resultado
    });

}


async function busqueda(req, res) {
    try {
        const resultado =
            await service.exportarBusqueda(
                req.query,
                req.query.formato || "json"
            );

        return enviarExportacion(
            res,
            resultado
        );
    } catch (error) {
        return responderError(
            res,
            error,
            "ExportacionService"
        );
    }
}


async function reporteResumen(req, res) {
    try {
        const resultado =
            await service.exportarReporteResumen(
                req.query.formato || "json"
            );

        return enviarExportacion(
            res,
            resultado
        );
    } catch (error) {
        return responderError(
            res,
            error,
            "ExportacionService"
        );
    }
}


module.exports = {
    busqueda,
    reporteResumen
};
