"use strict";

const { PronabecPort } = require("../domain/pronabec.port");
const integracionPronabec = require("../../../services/integracionPronabec.service");

class PronabecApiAdapter extends PronabecPort {
    nombre() {
        return "PronabecApiAdapter";
    }

    async consultar(recurso, parametros = {}, contexto = {}) {
        // Fuerza la fuente primaria. La implementación existente conserva
        // Timeout + Retry + Circuit Breaker si ya instalaste Resiliencia V1.
        const respuesta = await integracionPronabec.consultarRecurso(recurso, parametros);
        return {
            origen: "API_PRONABEC",
            traceId: contexto.traceId || null,
            datos: respuesta
        };
    }
}

module.exports = PronabecApiAdapter;
