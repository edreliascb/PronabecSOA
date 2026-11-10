const documentoService = require(
    "../services/documentoRequisito.service"
);


// ======================================================
// LISTAR DOCUMENTOS
// ======================================================

async function listar(req, res) {

    try {

        const pagina =
            Number(req.query.page) || 1;

        const filas =
            Number(req.query.rows) || 10;


        const resultado =
            await documentoService.listarDocumentos(
                pagina,
                filas
            );


        res.json({
            servicio: "DocumentoRequisitoService",
            tipo: "Servicio de Entidad",
            recurso: "DocumentosSolicitadosABecarios",
            pagina: pagina,
            filas: filas,
            resultado: resultado
        });

    } catch (error) {

        res.status(500).json({
            mensaje:
                "No se pudieron obtener los documentos.",
            detalle:
                error.message
        });
    }
}


// ======================================================
// BUSCAR DOCUMENTOS
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
            await documentoService.buscarDocumentos(
                texto
            );


        res.json({
            servicio: "DocumentoRequisitoService",
            operacion: "buscarDocumentos",
            textoBuscado: texto,
            resultado: resultado
        });

    } catch (error) {

        res.status(500).json({
            mensaje:
                "No se pudo realizar la búsqueda.",
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