function crearNotificacionSubscriber(notificacionService) {
    if (!notificacionService || typeof notificacionService.crear !== "function") {
        throw new Error("NotificacionSubscriber requiere notificacionService.crear.");
    }

    return async function notificacionSubscriber(evento) {
        const idUsuario = Number(evento.context?.idUsuario);
        const notificacion = evento.data?.notificacion;

        if (!Number.isInteger(idUsuario) || idUsuario <= 0 || !notificacion) {
            return { omitido: true, motivo: "El evento no solicita una notificación persistente." };
        }

        return notificacionService.crear(idUsuario, {
            titulo: notificacion.titulo || "Evento EduPerú",
            mensaje: notificacion.mensaje || "Se procesó un evento del sistema.",
            tipo: notificacion.tipo || "SISTEMA"
        });
    };
}

module.exports = {
    crearNotificacionSubscriber
};
