const comparadorService =
    require(
        "../services/comparadorOportunidades.service"
    );


async function comparar(req, res) {

    try {

        const resultado =
            await comparadorService
                .compararOportunidades(
                    req.body?.selecciones
                );

        return res.json({
            success: true,
            servicio:
                "ComparadorOportunidadesService",
            resultado
        });

    } catch (error) {

        return res
            .status(
                error.statusCode ||
                500
            )
            .json({
                success: false,
                servicio:
                    "ComparadorOportunidadesService",
                mensaje:
                    error.message
            });

    }

}


module.exports = {
    comparar
};
