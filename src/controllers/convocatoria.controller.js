const convocatoriaService = require(
    "../services/convocatoria.service"
);


// ======================================================
// LISTAR CONVOCATORIAS
// ======================================================

async function listar(req, res) {

    try {

        const pagina =
            Number(req.query.page) || 1;

        const filas =
            Number(req.query.rows) || 10;


        const datos =
            await convocatoriaService.listarConvocatorias(
                pagina,
                filas
            );


        res.json({
            servicio: "ConvocatoriaService",
            tipo: "Servicio de Entidad",
            fuente: "PRONABEC",
            recurso: "ConvocatoriaCarreraVigentes",
            pagina: pagina,
            filas: filas,
            datos: datos
        });

    } catch (error) {

        res.status(500).json({
            mensaje:
                "No se pudieron obtener las convocatorias.",
            detalle:
                error.message
        });
    }
}


// ======================================================
// BUSCAR CONVOCATORIAS
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


        const datos =
            await convocatoriaService.buscarConvocatorias(
                texto
            );


        res.json({
            servicio: "ConvocatoriaService",
            operacion: "buscarConvocatorias",
            textoBuscado: texto,
            datos: datos
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