"use strict";

/** Recursos que el proyecto actual ya consume desde PRONABEC. */
const RECURSOS_PRONABEC = Object.freeze([
    "ConvocatoriaCarreraVigentes",
    "CarrerasElegiblesNacional",
    "PostulacionesVigentes",
    "Convenio",
    "DocumentosSolicitadosABecarios"
]);

const RECURSOS_SET = new Set(RECURSOS_PRONABEC);

function validarRecursoPronabec(recurso) {
    const limpio = String(recurso || "").trim();
    if (!limpio) {
        const error = new Error("El recurso PRONABEC es obligatorio.");
        error.code = "RECURSO_PRONABEC_OBLIGATORIO";
        throw error;
    }
    if (!RECURSOS_SET.has(limpio)) {
        const error = new Error(`El recurso ${limpio} no está habilitado en EduPerú.`);
        error.code = "RECURSO_PRONABEC_NO_PERMITIDO";
        error.recursosPermitidos = [...RECURSOS_PRONABEC];
        throw error;
    }
    return limpio;
}

module.exports = { RECURSOS_PRONABEC, validarRecursoPronabec };
