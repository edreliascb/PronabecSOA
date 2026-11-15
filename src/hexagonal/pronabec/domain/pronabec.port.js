"use strict";

/**
 * Puerto de salida de la capa de aplicación hacia una fuente oficial PRONABEC.
 * La capa application solo conoce este contrato; no conoce Axios, URLs ni HTML/CSV.
 */
class PronabecPort {
    async consultar(_recurso, _parametros = {}, _contexto = {}) {
        throw new Error("PRONABEC_PORT_NOT_IMPLEMENTED");
    }

    nombre() {
        return this.constructor?.name || "PronabecPort";
    }
}

function validarPronabecPort(adapter, etiqueta = "adaptador") {
    if (!adapter || typeof adapter.consultar !== "function") {
        const error = new Error(`${etiqueta} debe implementar consultar(recurso, parametros, contexto).`);
        error.code = "PRONABEC_ADAPTER_INVALID";
        throw error;
    }
    return adapter;
}

module.exports = { PronabecPort, validarPronabecPort };
