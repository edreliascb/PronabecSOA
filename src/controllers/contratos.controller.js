const contratosService =
    require(
        "../services/contratos.service"
    );


// ======================================================
// LISTAR CONTRATOS
// ======================================================

function listar(req, res) {

    try {

        const contratos =
            contratosService
                .obtenerContratos();


        res.json({

            proyecto:
                "EduPeruSOA",

            arquitectura:
                "Arquitectura Orientada a Servicios - SOA",

            titulo:
                "Especificación de Contratos SOA",

            cantidadServicios:
                contratos.length,

            principiosReferencia: [

                "Standardized Service Contract",
                "Service Loose Coupling",
                "Service Abstraction",
                "Service Reusability",
                "Service Autonomy",
                "Service Statelessness",
                "Service Discoverability",
                "Service Composability"

            ],

            contratos:
                contratos

        });

    } catch (error) {

        res.status(500).json({

            success:
                false,

            mensaje:
                "No se pudieron obtener los contratos SOA.",

            detalle:
                error.message

        });

    }

}


// ======================================================
// EXPORTAR
// ======================================================

module.exports = {
    listar
};