const consultaService = require(
    "../services/consultaEducativa.service"
);


// ======================================================
// CONSULTA COMPLETA
// ======================================================

async function consultar(req, res) {

    try {

        const resultado =
            await consultaService
                .realizarConsultaCompleta();


        return res.json({

            proyecto:
                "PronabecSOA",

            arquitectura:
                "Arquitectura Orientada a Servicios",

            descripcion:
                "Consulta integrada de servicios educativos",

            resultado
        });

    } catch (error) {

        return res
            .status(500)
            .json({

                success:
                    false,

                servicio:
                    "ConsultaEducativaService",

                mensaje:
                    "No se pudo ejecutar el servicio orquestador.",

                detalle:
                    error.message
            });
    }
}


// ======================================================
// DEMOSTRACIÓN DE ORQUESTACIÓN
// ======================================================

async function orquestar(req, res) {

    try {

        const resultado =
            await consultaService
                .ejecutarOrquestacionDemostrable();


        return res.json({
            success: true,
            proyecto: "EduPerú SOA",
            resultado
        });

    } catch (error) {

        return res
            .status(500)
            .json({
                success: false,
                servicio:
                    "ConsultaEducativaService",
                mensaje:
                    "No se pudo ejecutar la demostración de orquestación.",
                detalle:
                    error.message
            });
    }
}


// ======================================================
// EXPORTAR
// ======================================================

module.exports = {
    consultar,
    orquestar
};
