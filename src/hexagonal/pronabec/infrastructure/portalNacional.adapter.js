"use strict";

const { PronabecPort } = require("../domain/pronabec.port");
const integracionPronabec = require("../../../services/integracionPronabec.service");

class PortalNacionalAdapter extends PronabecPort {
    nombre() {
        return "PortalNacionalAdapter";
    }

    async consultar(recurso, parametros = {}, contexto = {}) {
        // Reutiliza el lector real de publicaciones oficiales ya existente.
        const respuesta = await integracionPronabec.consultarPublicacionOficial(recurso, parametros);
        return {
            origen: "PORTAL_NACIONAL_DATOS_ABIERTOS",
            traceId: contexto.traceId || null,
            datos: respuesta
        };
    }
}

module.exports = PortalNacionalAdapter;
