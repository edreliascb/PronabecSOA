const observabilidad = require("../services/observabilidad.service");

function resumen(req, res) {
    return res.json({ success: true, traceId: req.traceId, resultado: observabilidad.obtenerResumen() });
}

function traza(req, res) {
    const traceId = String(req.params.traceId || "").trim();
    const eventos = observabilidad.obtenerTraza(traceId);
    return res.json({
        success: true,
        traceId: req.traceId,
        buscado: traceId,
        encontrados: eventos.length,
        eventos
    });
}

module.exports = { resumen, traza };
