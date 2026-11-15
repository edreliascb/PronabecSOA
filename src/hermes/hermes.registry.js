const { HermesBus } = require("./core/hermes.bus");
const { HERMES_EVENTS } = require("./events/hermes.events");
const { crearAuditoriaSubscriber } = require("./subscribers/auditoria.subscriber");
const { crearNotificacionSubscriber } = require("./subscribers/notificacion.subscriber");

const auditoriaService = require("../services/auditoria.service");
const notificacionService = require("../services/notificacion.service");

const hermesBus = new HermesBus({ maxHistorial: 100 });
let registrado = false;

function registrarSuscriptores() {
    if (registrado) return hermesBus;

    const auditoria = crearAuditoriaSubscriber(auditoriaService);
    const notificacion = crearNotificacionSubscriber(notificacionService);

    Object.values(HERMES_EVENTS).forEach((evento) => {
        hermesBus.suscribir(evento, "AuditoriaSubscriber", auditoria);
    });

    [
        HERMES_EVENTS.DEMO,
        HERMES_EVENTS.ALERTA_DISPARADA,
        HERMES_EVENTS.DOCUMENTO_VALIDADO,
        HERMES_EVENTS.SEGUIMIENTO_ACTUALIZADO,
        HERMES_EVENTS.SAGA_COMPLETADA
    ].forEach((evento) => {
        hermesBus.suscribir(evento, "NotificacionSubscriber", notificacion);
    });

    registrado = true;
    return hermesBus;
}

module.exports = {
    hermesBus: registrarSuscriptores(),
    registrarSuscriptores
};
