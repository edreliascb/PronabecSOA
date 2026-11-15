"use strict";

const { validarPronabecPort } = require("../domain/pronabec.port");
const { validarRecursoPronabec } = require("../domain/pronabec.resources");
const { PronabecFuentesNoDisponiblesError, serializarError } = require("../domain/pronabec.errors");

const CODIGOS_FALLBACK = new Set([
    "API_PRONABEC_ERROR",
    "PRONABEC_API_KEY_NO_CONFIGURADA",
    "CIRCUIT_OPEN",
    "ENOTFOUND",
    "EAI_AGAIN",
    "ECONNREFUSED",
    "ECONNRESET",
    "ECONNABORTED",
    "ETIMEDOUT",
    "EPIPE"
]);

function debeUsarFallback(error) {
    if (!error) return false;
    const codigo = error.code || error.codigo || error.codigoTecnico;
    const tecnico = error.codigoTecnico || error.code;
    const status = error.status || error.response?.status;

    if (CODIGOS_FALLBACK.has(codigo) || CODIGOS_FALLBACK.has(tecnico)) return true;
    if ([408, 425, 429].includes(status)) return true;
    if (status >= 500 && status <= 599) return true;
    // Si la API rechaza credenciales (403), el Portal Nacional sigue siendo una fuente oficial válida.
    if (status === 403) return true;
    return false;
}

class ConsultarPronabecUseCase {
    constructor({ primario, alterno = null, logger = console, politicaFallback = debeUsarFallback } = {}) {
        this.primario = validarPronabecPort(primario, "El adaptador primario");
        this.alterno = alterno ? validarPronabecPort(alterno, "El adaptador alterno") : null;
        this.logger = logger;
        this.politicaFallback = politicaFallback;
    }

    async ejecutar(recurso, parametros = {}, contexto = {}) {
        const recursoValido = validarRecursoPronabec(recurso);
        const traceId = contexto.traceId || null;
        const inicio = process.hrtime.bigint();

        try {
            const resultado = await this.primario.consultar(recursoValido, parametros, contexto);
            return this.#crearRespuesta(resultado, {
                recurso: recursoValido,
                traceId,
                adapter: this.#nombre(this.primario),
                fallback: false,
                inicio
            });
        } catch (errorPrimario) {
            if (!this.alterno || !this.politicaFallback(errorPrimario)) {
                throw errorPrimario;
            }

            this.logger.warn?.(
                `[HEXAGONAL][${traceId || "sin-trace"}] ${this.#nombre(this.primario)} falló para ${recursoValido}; se intenta ${this.#nombre(this.alterno)}.`
            );

            try {
                const resultado = await this.alterno.consultar(recursoValido, parametros, contexto);
                const respuesta = this.#crearRespuesta(resultado, {
                    recurso: recursoValido,
                    traceId,
                    adapter: this.#nombre(this.alterno),
                    fallback: true,
                    inicio
                });
                respuesta.errorPrimario = serializarError(errorPrimario);
                return respuesta;
            } catch (errorAlterno) {
                throw new PronabecFuentesNoDisponiblesError(
                    recursoValido,
                    errorPrimario,
                    errorAlterno
                );
            }
        }
    }

    #crearRespuesta(resultado, meta) {
        const fin = process.hrtime.bigint();
        const duracionMs = Number(fin - meta.inicio) / 1e6;
        return {
            success: true,
            arquitectura: "HEXAGONAL",
            capa: "APPLICATION",
            recurso: meta.recurso,
            traceId: meta.traceId,
            adapter: meta.adapter,
            fallback: meta.fallback,
            fuenteOficial: true,
            duracionMs: Number(duracionMs.toFixed(2)),
            resultado
        };
    }

    #nombre(adapter) {
        return typeof adapter.nombre === "function"
            ? adapter.nombre()
            : adapter.constructor?.name || "Adapter";
    }
}

module.exports = ConsultarPronabecUseCase;
module.exports.debeUsarFallback = debeUsarFallback;
