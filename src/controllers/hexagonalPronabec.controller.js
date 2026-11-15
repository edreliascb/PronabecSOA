"use strict";

const servicio = require("../hexagonal/pronabec/pronabecHexagonal.service");
const { RECURSOS_PRONABEC } = require("../hexagonal/pronabec/domain/pronabec.resources");

async function consultar(req, res) {
    try {
        const recurso = String(req.params.recurso || "").trim();
        const parametros = { ...req.query };
        const resultado = await servicio.consultar(recurso, parametros, {
            traceId: req.traceId || null,
            usuarioId: req.usuario?.id || req.user?.id || null
        });

        res.set("Cache-Control", "no-store");
        return res.status(200).json(resultado);
    } catch (error) {
        const codigo = error.code || error.codigo || null;
        const status = ["RECURSO_PRONABEC_OBLIGATORIO", "RECURSO_PRONABEC_NO_PERMITIDO"].includes(codigo)
            ? 400
            : codigo === "PRONABEC_FUENTES_NO_DISPONIBLES"
                ? 503
                : 502;

        return res.status(status).json({
            success: false,
            servicio: "HexagonalPronabecService",
            arquitectura: "HEXAGONAL",
            traceId: req.traceId || null,
            codigo,
            mensaje: error.message,
            ...(error.recursosPermitidos ? { recursosPermitidos: error.recursosPermitidos } : {}),
            ...(error.causas ? { causas: error.causas } : {})
        });
    }
}

function recursos(_req, res) {
    return res.json({
        success: true,
        arquitectura: "HEXAGONAL",
        recursos: RECURSOS_PRONABEC
    });
}

module.exports = { consultar, recursos };
