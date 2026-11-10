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


        res.json({

            proyecto:
                "PronabecSOA",

            arquitectura:
                "Arquitectura Orientada a Servicios",

            descripcion:
                "Consulta integrada de servicios PRONABEC",

            resultado:
                resultado

        });

    } catch (error) {

        res.status(500).json({

            mensaje:
                "No se pudo ejecutar el servicio orquestador.",

            detalle:
                error.message

        });
    }
}


// ======================================================
// EXPORTAR
// ======================================================

module.exports = {
    consultar
};