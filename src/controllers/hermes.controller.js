const crypto = require("crypto");
const { hermesBus } = require("../hermes/hermes.registry");
const { HERMES_EVENTS } = require("../hermes/events/hermes.events");

function traceId(req) {
    return String(req.headers["x-trace-id"] || "").trim() ||
        `hermes-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
}

async function estado(req, res) {
    return res.json({
        success: true,
        servicio: "HermesEventBus",
        arquitectura: "EVENT_DRIVEN",
        resultado: hermesBus.obtenerEstado()
    });
}

async function demo(req, res) {
    try {
        const idUsuario = Number(req.usuario?.id);
        const tipo = String(req.body?.tipo || "DEMO").trim().toUpperCase();

        const mapa = {
            DEMO: HERMES_EVENTS.DEMO,
            ALERTA: HERMES_EVENTS.ALERTA_DISPARADA,
            DOCUMENTO: HERMES_EVENTS.DOCUMENTO_VALIDADO
        };

        const eventType = mapa[tipo] || HERMES_EVENTS.DEMO;
        const nombres = {
            [HERMES_EVENTS.DEMO]: "Prueba Hermes",
            [HERMES_EVENTS.ALERTA_DISPARADA]: "Alerta educativa procesada",
            [HERMES_EVENTS.DOCUMENTO_VALIDADO]: "Documento validado"
        };

        const resultado = await hermesBus.publicar(
            eventType,
            {
                resumen: `Evento de demostración ${eventType}`,
                notificacion: {
                    titulo: nombres[eventType] || "Evento EduPerú",
                    mensaje: "Hermes procesó el evento y ejecutó sus suscriptores correctamente.",
                    tipo: tipo === "ALERTA" ? "ALERTA" : "SISTEMA"
                }
            },
            {
                idUsuario,
                rol: req.usuario?.rol,
                traceId: traceId(req),
                source: "HermesController"
            }
        );

        return res.status(201).json({
            success: true,
            servicio: "HermesEventBus",
            mensaje: "Evento publicado y procesado.",
            resultado
        });
    } catch (error) {
        console.error("[HermesEventBus] Error:", error.message);
        return res.status(Number(error.statusCode) || 500).json({
            success: false,
            servicio: "HermesEventBus",
            mensaje: Number(error.statusCode) >= 500
                ? "No se pudo procesar el evento Hermes."
                : error.message
        });
    }
}

module.exports = {
    estado,
    demo
};
