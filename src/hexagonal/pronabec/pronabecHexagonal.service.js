"use strict";

const ConsultarPronabecUseCase = require("./application/consultarPronabec.usecase");
const PronabecApiAdapter = require("./infrastructure/pronabecApi.adapter");
const PortalNacionalAdapter = require("./infrastructure/portalNacional.adapter");

function crearConsultaPronabecHexagonal(opciones = {}) {
    return new ConsultarPronabecUseCase({
        primario: opciones.primario || new PronabecApiAdapter(),
        alterno: Object.prototype.hasOwnProperty.call(opciones, "alterno")
            ? opciones.alterno
            : new PortalNacionalAdapter(),
        logger: opciones.logger || console,
        politicaFallback: opciones.politicaFallback
    });
}

const instancia = crearConsultaPronabecHexagonal();

module.exports = {
    crearConsultaPronabecHexagonal,
    consultar: (recurso, parametros = {}, contexto = {}) =>
        instancia.ejecutar(recurso, parametros, contexto)
};
