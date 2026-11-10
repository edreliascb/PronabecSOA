const convenioService = require(
    "../services/convenio.service"
);


// ======================================================
// LISTAR CONVENIOS
// ======================================================

async function listar(req, res) {

    try {

        const pagina =
            Number(req.query.page) || 1;

        const filas =
            Number(req.query.rows) || 10;


        const resultado =
            await convenioService.listarConvenios(
                pagina,
                filas
            );


        res.json({

            servicio:
                "ConvenioService",

            tipo:
                "Servicio de Entidad",

            recurso:
                "Convenio",

            pagina:
                pagina,

            filas:
                filas,

            resultado:
                resultado

        });

    } catch (error) {

        res.status(500).json({

            mensaje:
                "No se pudieron obtener los convenios.",

            detalle:
                error.message

        });
    }
}


// ======================================================
// BUSCAR CONVENIOS
// ======================================================

async function buscar(req, res) {

    try {

        const texto =
            req.query.texto || "";


        if (!texto) {

            return res.status(400).json({

                mensaje:
                    "Debe enviar el parámetro texto."

            });
        }


        const resultado =
            await convenioService.buscarConvenios(
                texto
            );


        res.json({

            servicio:
                "ConvenioService",

            operacion:
                "buscarConvenios",

            textoBuscado:
                texto,

            resultado:
                resultado

        });

    } catch (error) {

        res.status(500).json({

            mensaje:
                "No se pudo realizar la búsqueda de convenios.",

            detalle:
                error.message

        });
    }
}


// ======================================================
// EXPORTAR
// ======================================================

module.exports = {
    listar,
    buscar
};