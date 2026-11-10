const oportunidadDetalleService =
    require(
        "../services/oportunidadDetalle.service"
    );


async function obtener(req, res) {

    try {

        const indice =
            req.params.indice;


        const resultado =
            await oportunidadDetalleService
                .obtenerDetalleOportunidad(
                    indice
                );


        res.json({

            proyecto:
                "EduPeruSOA",

            resultado:
                resultado

        });

    } catch (error) {

        const codigo =
            error.message.includes(
                "no existe"
            )
                ? 404
                : 500;


        res.status(codigo).json({

            success:
                false,

            mensaje:
                "No se pudo obtener el detalle de la oportunidad.",

            detalle:
                error.message

        });

    }

}


module.exports = {
    obtener
};