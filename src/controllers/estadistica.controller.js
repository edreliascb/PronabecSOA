const estadisticaService = require(
    "../services/estadistica.service"
);


async function obtener(req, res) {

    try {

        const resultado =
            await estadisticaService
                .obtenerEstadisticas();


        res.json({

            proyecto:
                "PronabecSOA",

            resultado:
                resultado

        });

    } catch (error) {

        console.error(
            "ERROR EN ESTADÍSTICAS:",
            error.message
        );


        res.status(500).json({

            mensaje:
                "No se pudieron generar las estadísticas.",

            detalle:
                error.message

        });

    }

}


module.exports = {
    obtener
};