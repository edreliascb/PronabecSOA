const postulacionService = require(
    "../services/postulacion.service"
);


// ======================================================
// LISTAR POSTULACIONES
// ======================================================

async function listar(req, res) {

    try {

        const pagina =
            Number(req.query.page) || 1;

        const filas =
            Number(req.query.rows) || 10;


        const resultado =
            await postulacionService.listarPostulaciones(
                pagina,
                filas
            );


        res.json({
            servicio: "PostulacionService",
            tipo: "Servicio de Entidad",
            recurso: "PostulacionesVigentes",
            pagina: pagina,
            filas: filas,
            resultado: resultado
        });

    } catch (error) {

        res.status(500).json({
            mensaje:
                "No se pudieron obtener las postulaciones.",
            detalle:
                error.message
        });
    }
}


// ======================================================
// BUSCAR POSTULACIONES
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
            await postulacionService.buscarPostulaciones(
                texto
            );


        res.json({
            servicio: "PostulacionService",
            operacion: "buscarPostulaciones",
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