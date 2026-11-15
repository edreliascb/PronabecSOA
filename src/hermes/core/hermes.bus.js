const crypto = require("crypto");
const EventEmitter = require("events");

function crearIdEvento() {
    return `EVT-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

function limpiarTexto(valor, maximo = 200) {
    return String(valor ?? "").trim().slice(0, maximo);
}

class HermesBus {
    constructor(opciones = {}) {
        this.emitter = new EventEmitter();
        this.maxHistorial = Number(opciones.maxHistorial) || 100;
        this.creadoEn = new Date().toISOString();
        this.suscripciones = new Map();
        this.historial = [];
        this.metricas = {
            publicados: 0,
            procesados: 0,
            erroresSuscriptor: 0,
            sinSuscriptores: 0,
            porEvento: {}
        };
    }

    suscribir(evento, nombre, handler) {
        const eventoNormalizado = limpiarTexto(evento, 150);
        const nombreNormalizado = limpiarTexto(nombre, 150);

        if (!eventoNormalizado || !nombreNormalizado || typeof handler !== "function") {
            throw new Error("Hermes requiere evento, nombre de suscriptor y handler válido.");
        }

        const clave = `${eventoNormalizado}::${nombreNormalizado}`;
        if (this.suscripciones.has(clave)) {
            return false;
        }

        const wrapper = async (envelope) => handler(envelope);
        this.suscripciones.set(clave, {
            evento: eventoNormalizado,
            nombre: nombreNormalizado,
            wrapper
        });
        this.emitter.on(eventoNormalizado, wrapper);
        return true;
    }

    desuscribir(evento, nombre) {
        const clave = `${limpiarTexto(evento, 150)}::${limpiarTexto(nombre, 150)}`;
        const item = this.suscripciones.get(clave);
        if (!item) return false;

        this.emitter.off(item.evento, item.wrapper);
        this.suscripciones.delete(clave);
        return true;
    }

    async publicar(evento, data = {}, contexto = {}) {
        const eventoNormalizado = limpiarTexto(evento, 150);
        if (!eventoNormalizado) {
            throw new Error("El nombre del evento Hermes es obligatorio.");
        }

        const envelope = {
            event_id: crearIdEvento(),
            event_type: eventoNormalizado,
            occurred_at: new Date().toISOString(),
            trace_id: limpiarTexto(contexto.traceId || data.traceId || "", 120) || null,
            source: limpiarTexto(contexto.source || "EduPeruSOA", 120) || "EduPeruSOA",
            context: {
                idUsuario: Number(contexto.idUsuario) || null,
                rol: limpiarTexto(contexto.rol || "", 50) || null
            },
            data: data && typeof data === "object" ? data : { valor: data }
        };

        const listeners = this.emitter.listeners(eventoNormalizado);
        this.metricas.publicados += 1;
        this.metricas.porEvento[eventoNormalizado] =
            (this.metricas.porEvento[eventoNormalizado] || 0) + 1;

        if (listeners.length === 0) {
            this.metricas.sinSuscriptores += 1;
        }

        const resultados = [];
        for (const listener of listeners) {
            try {
                const resultado = await listener(envelope);
                this.metricas.procesados += 1;
                resultados.push({ estado: "OK", resultado: resultado ?? null });
            } catch (error) {
                this.metricas.erroresSuscriptor += 1;
                resultados.push({ estado: "ERROR", mensaje: error.message });
            }
        }

        const resumen = {
            event_id: envelope.event_id,
            event_type: envelope.event_type,
            occurred_at: envelope.occurred_at,
            trace_id: envelope.trace_id,
            source: envelope.source,
            suscriptores: listeners.length,
            procesados_ok: resultados.filter((x) => x.estado === "OK").length,
            errores: resultados.filter((x) => x.estado === "ERROR").length
        };

        this.historial.unshift(resumen);
        if (this.historial.length > this.maxHistorial) {
            this.historial.length = this.maxHistorial;
        }

        return {
            ...resumen,
            resultados
        };
    }

    obtenerEstado() {
        const suscriptores = Array.from(this.suscripciones.values()).map((item) => ({
            evento: item.evento,
            nombre: item.nombre
        }));

        return {
            nombre: "HermesEventBus",
            tipo: "EVENT_BUS_IN_PROCESS",
            estado: "OPERATIVO",
            creado_en: this.creadoEn,
            metricas: { ...this.metricas },
            suscriptores,
            historial: [...this.historial]
        };
    }
}

module.exports = {
    HermesBus
};
