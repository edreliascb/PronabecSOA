"use strict";

class PronabecFuentesNoDisponiblesError extends Error {
    constructor(recurso, primario, alterno) {
        super(`No fue posible consultar ${recurso} en ninguna fuente oficial disponible.`);
        this.name = "PronabecFuentesNoDisponiblesError";
        this.code = "PRONABEC_FUENTES_NO_DISPONIBLES";
        this.recurso = recurso;
        this.causas = {
            primario: serializarError(primario),
            alterno: serializarError(alterno)
        };
    }
}

function serializarError(error) {
    if (!error) return null;
    return {
        codigo: error.code || error.codigo || error.codigoTecnico || null,
        codigoTecnico: error.codigoTecnico || error.code || null,
        status: error.status || error.response?.status || null,
        mensaje: error.message || "Error desconocido"
    };
}

module.exports = { PronabecFuentesNoDisponiblesError, serializarError };
