function accionDesdeEvento(eventType) {
    return `HERMES_${String(eventType || "EVENTO")}`
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .slice(0, 100);
}

function crearAuditoriaSubscriber(auditoriaService) {
    if (!auditoriaService || typeof auditoriaService.registrarEvento !== "function") {
        throw new Error("AuditoriaSubscriber requiere auditoriaService.registrarEvento.");
    }

    return async function auditoriaSubscriber(evento) {
        const detalle = JSON.stringify({
            event_id: evento.event_id,
            event_type: evento.event_type,
            trace_id: evento.trace_id,
            source: evento.source,
            resumen: evento.data?.resumen || evento.data?.mensaje || null
        }).slice(0, 1490);

        return auditoriaService.registrarEvento({
            id_usuario: evento.context?.idUsuario || null,
            accion: accionDesdeEvento(evento.event_type),
            entidad: "HERMES_EVENTO",
            detalle
        });
    };
}

module.exports = {
    crearAuditoriaSubscriber
};
