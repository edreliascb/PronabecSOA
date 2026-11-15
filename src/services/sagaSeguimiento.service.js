const crypto = require("crypto");

const seguimientoService = require("./seguimientoPostulacion.service");
const documentoService = require("./documentoUsuario.service");
const alertaService = require("./alerta.service");
const notificacionService = require("./notificacion.service");
const auditoriaService = require("./auditoria.service");

function crearError(mensaje, statusCode = 500) {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    return error;
}

function crearSagaId() {
    return `SAGA-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

function normalizarFallo(valor) {
    return String(valor || "")
        .trim()
        .toUpperCase();
}

function fechaIso() {
    return new Date().toISOString();
}

function agregarPaso(saga, paso, estado, detalle = null) {
    saga.pasos.push({
        paso,
        estado,
        detalle,
        fecha: fechaIso()
    });
}

function debeFallar(forzarFalloEn, paso) {
    return normalizarFallo(forzarFalloEn) === normalizarFallo(paso);
}

function lanzarFalloControlado(paso) {
    const error = crearError(`Fallo controlado de demostración en el paso ${paso}.`, 500);
    error.esFalloControlado = true;
    throw error;
}

async function registrarAuditoriaSegura(datos) {
    try {
        return await auditoriaService.registrarEvento(datos);
    } catch (error) {
        console.error("[SagaSeguimientoService] No se pudo registrar auditoría secundaria:", error.message);
        return null;
    }
}

/**
 * SAGA orquestada para registrar el seguimiento de una postulación.
 *
 * Pasos:
 * 1) Crear seguimiento.
 * 2) Registrar metadatos de documento (opcional).
 * 3) Crear alerta.
 * 4) Crear notificación.
 * 5) Registrar auditoría.
 *
 * Si un paso falla, se ejecutan compensaciones en orden inverso.
 */
async function ejecutarSagaSeguimiento(idUsuario, datos = {}, opciones = {}) {
    const usuarioId = Number(idUsuario);

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
        throw crearError("El usuario de la SAGA no es válido.", 400);
    }

    const seguimientoDatos = datos?.seguimiento || datos;

    if (!seguimientoDatos?.id_postulacion && !seguimientoDatos?.idPostulacion) {
        throw crearError("La SAGA requiere seguimiento.id_postulacion.", 400);
    }

    if (!seguimientoDatos?.titulo) {
        throw crearError("La SAGA requiere seguimiento.titulo.", 400);
    }

    const forzarFalloEn = normalizarFallo(opciones?.forzarFalloEn);
    const saga = {
        saga_id: crearSagaId(),
        servicio: "SagaSeguimientoService",
        patron: "SAGA_ORQUESTADA",
        estado: "EN_PROCESO",
        id_usuario: usuarioId,
        iniciada_en: fechaIso(),
        finalizada_en: null,
        pasos: [],
        compensaciones: [],
        resultado: {}
    };

    const compensaciones = [];

    function registrarCompensacion(nombre, ejecutar) {
        compensaciones.push({ nombre, ejecutar });
    }

    try {
        // 1. Seguimiento
        if (debeFallar(forzarFalloEn, "SEGUIMIENTO_ANTES")) {
            lanzarFalloControlado("SEGUIMIENTO_ANTES");
        }

        const seguimiento = await seguimientoService.crearSeguimiento(
            usuarioId,
            seguimientoDatos
        );

        saga.resultado.seguimiento = seguimiento;
        agregarPaso(saga, "SEGUIMIENTO", "COMPLETADO", {
            id_seguimiento: seguimiento.id_seguimiento
        });

        registrarCompensacion("REVERTIR_SEGUIMIENTO", async () => {
            return seguimientoService.eliminarSeguimiento(
                usuarioId,
                seguimiento.id_seguimiento
            );
        });

        if (debeFallar(forzarFalloEn, "SEGUIMIENTO")) {
            lanzarFalloControlado("SEGUIMIENTO");
        }

        // 2. Documento opcional
        if (datos?.documento) {
            if (debeFallar(forzarFalloEn, "DOCUMENTO_ANTES")) {
                lanzarFalloControlado("DOCUMENTO_ANTES");
            }

            const documento = await documentoService.registrar(
                usuarioId,
                datos.documento
            );

            saga.resultado.documento = documento;
            agregarPaso(saga, "DOCUMENTO", "COMPLETADO", {
                id_documento_usuario: documento.id_documento_usuario
            });

            registrarCompensacion("REVERTIR_DOCUMENTO", async () => {
                return documentoService.eliminar(
                    usuarioId,
                    documento.id_documento_usuario
                );
            });

            if (debeFallar(forzarFalloEn, "DOCUMENTO")) {
                lanzarFalloControlado("DOCUMENTO");
            }
        } else {
            agregarPaso(saga, "DOCUMENTO", "OMITIDO", "No se envió documento en esta ejecución.");
        }

        // 3. Alerta
        if (debeFallar(forzarFalloEn, "ALERTA_ANTES")) {
            lanzarFalloControlado("ALERTA_ANTES");
        }

        const alertaDatos = datos?.alerta || {
            nombre: `Seguimiento: ${seguimientoDatos.titulo}`,
            palabra_clave: seguimientoDatos.titulo,
            region: ""
        };

        const alerta = await alertaService.crearAlerta(
            usuarioId,
            alertaDatos
        );

        saga.resultado.alerta = alerta;
        agregarPaso(saga, "ALERTA", "COMPLETADO", {
            id_alerta: alerta.id_alerta
        });

        registrarCompensacion("REVERTIR_ALERTA", async () => {
            return alertaService.eliminarAlerta(
                usuarioId,
                alerta.id_alerta
            );
        });

        if (debeFallar(forzarFalloEn, "ALERTA")) {
            lanzarFalloControlado("ALERTA");
        }

        // 4. Notificación
        if (debeFallar(forzarFalloEn, "NOTIFICACION_ANTES")) {
            lanzarFalloControlado("NOTIFICACION_ANTES");
        }

        const notificacionDatos = datos?.notificacion || {
            titulo: "Seguimiento registrado",
            mensaje: `Se registró correctamente el seguimiento \"${seguimientoDatos.titulo}\".`,
            tipo: "SEGUIMIENTO"
        };

        const notificacion = await notificacionService.crear(
            usuarioId,
            notificacionDatos
        );

        saga.resultado.notificacion = notificacion;
        agregarPaso(saga, "NOTIFICACION", "COMPLETADO", {
            id_notificacion: notificacion.id_notificacion
        });

        registrarCompensacion("REVERTIR_NOTIFICACION", async () => {
            return notificacionService.eliminar(
                usuarioId,
                notificacion.id_notificacion
            );
        });

        if (debeFallar(forzarFalloEn, "NOTIFICACION")) {
            lanzarFalloControlado("NOTIFICACION");
        }

        // 5. Auditoría
        if (debeFallar(forzarFalloEn, "AUDITORIA_ANTES")) {
            lanzarFalloControlado("AUDITORIA_ANTES");
        }

        const auditoria = await auditoriaService.registrarEvento({
            id_usuario: usuarioId,
            accion: "SAGA_SEGUIMIENTO_COMPLETADA",
            entidad: "SAGA_SEGUIMIENTO",
            detalle: JSON.stringify({
                saga_id: saga.saga_id,
                id_seguimiento: seguimiento.id_seguimiento,
                id_postulacion: seguimientoDatos.id_postulacion || seguimientoDatos.idPostulacion
            })
        });

        saga.resultado.auditoria = auditoria;
        agregarPaso(saga, "AUDITORIA", "COMPLETADO", {
            id_auditoria: auditoria?.id_auditoria || auditoria?.id_evento || null
        });

        if (debeFallar(forzarFalloEn, "AUDITORIA")) {
            lanzarFalloControlado("AUDITORIA");
        }

        saga.estado = "COMPLETADA";
        saga.finalizada_en = fechaIso();

        return saga;
    } catch (errorOriginal) {
        saga.estado = "COMPENSANDO";
        saga.error = {
            mensaje: errorOriginal.message,
            fallo_controlado: Boolean(errorOriginal.esFalloControlado)
        };

        let erroresCompensacion = 0;

        for (const compensacion of compensaciones.reverse()) {
            try {
                const resultado = await compensacion.ejecutar();
                saga.compensaciones.push({
                    compensacion: compensacion.nombre,
                    estado: "COMPLETADA",
                    resultado,
                    fecha: fechaIso()
                });
            } catch (errorCompensacion) {
                erroresCompensacion += 1;
                saga.compensaciones.push({
                    compensacion: compensacion.nombre,
                    estado: "ERROR",
                    mensaje: errorCompensacion.message,
                    fecha: fechaIso()
                });
            }
        }

        saga.estado = erroresCompensacion > 0
            ? "COMPENSACION_PARCIAL"
            : "COMPENSADA";
        saga.finalizada_en = fechaIso();

        await registrarAuditoriaSegura({
            id_usuario: usuarioId,
            accion: "SAGA_SEGUIMIENTO_COMPENSADA",
            entidad: "SAGA_SEGUIMIENTO",
            detalle: JSON.stringify({
                saga_id: saga.saga_id,
                estado: saga.estado,
                error: errorOriginal.message,
                compensaciones: saga.compensaciones.map((item) => ({
                    nombre: item.compensacion,
                    estado: item.estado
                }))
            }).slice(0, 1490)
        });

        const errorSaga = crearError(
            "La SAGA de seguimiento no pudo completarse y se ejecutaron las compensaciones.",
            Number(errorOriginal.statusCode) || 500
        );

        errorSaga.causa = errorOriginal.message;
        errorSaga.saga = saga;
        throw errorSaga;
    }
}

module.exports = {
    ejecutarSagaSeguimiento
};
