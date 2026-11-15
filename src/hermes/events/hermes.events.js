const HERMES_EVENTS = Object.freeze({
    DEMO: "edu.hermes.demo",
    ALERTA_DISPARADA: "edu.alerta.disparada",
    DOCUMENTO_VALIDADO: "edu.documento.validado",
    SEGUIMIENTO_ACTUALIZADO: "edu.seguimiento.actualizado",
    SAGA_COMPLETADA: "edu.saga.completada"
});

const EVENTOS_PUBLICABLES_DEMO = Object.freeze([
    HERMES_EVENTS.DEMO,
    HERMES_EVENTS.ALERTA_DISPARADA,
    HERMES_EVENTS.DOCUMENTO_VALIDADO
]);

module.exports = {
    HERMES_EVENTS,
    EVENTOS_PUBLICABLES_DEMO
};
