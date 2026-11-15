const { obtenerPool, sql } = require("../config/database");

function crearError(mensaje, statusCode) {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    return error;
}

function normalizarId(id, campo = "identificador") {
    const valor = Number(id);
    if (!Number.isInteger(valor) || valor <= 0) {
        throw crearError(`${campo} no es válido.`, 400);
    }
    return valor;
}

async function listar(idUsuario) {
    const pool = await obtenerPool();
    const resultado = await pool.request()
        .input("idUsuario", sql.Int, normalizarId(idUsuario, "idUsuario"))
        .query(`
            SELECT
                id_notificacion,
                titulo,
                mensaje,
                tipo,
                leida,
                fecha_creacion,
                fecha_lectura
            FROM dbo.Notificaciones
            WHERE id_usuario = @idUsuario
            ORDER BY fecha_creacion DESC, id_notificacion DESC
        `);
    return resultado.recordset;
}

async function resumen(idUsuario) {
    const pool = await obtenerPool();
    const resultado = await pool.request()
        .input("idUsuario", sql.Int, normalizarId(idUsuario, "idUsuario"))
        .query(`
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN leida = 0 THEN 1 ELSE 0 END) AS no_leidas,
                SUM(CASE WHEN leida = 1 THEN 1 ELSE 0 END) AS leidas,
                SUM(CASE WHEN UPPER(ISNULL(tipo, '')) IN ('BECA','CONVOCATORIA','OPORTUNIDAD') THEN 1 ELSE 0 END) AS oportunidades,
                SUM(CASE WHEN UPPER(ISNULL(tipo, '')) IN ('FECHA','CALENDARIO','CIERRE') THEN 1 ELSE 0 END) AS fechas,
                SUM(CASE WHEN UPPER(ISNULL(tipo, '')) IN ('DOCUMENTO','VALIDACION_DOCUMENTO') THEN 1 ELSE 0 END) AS documentos
            FROM dbo.Notificaciones
            WHERE id_usuario = @idUsuario
        `);

    const fila = resultado.recordset[0] || {};
    return {
        total: Number(fila.total || 0),
        no_leidas: Number(fila.no_leidas || 0),
        leidas: Number(fila.leidas || 0),
        oportunidades: Number(fila.oportunidades || 0),
        fechas: Number(fila.fechas || 0),
        documentos: Number(fila.documentos || 0)
    };
}

async function crear(idUsuario, datos) {
    const titulo = String(datos?.titulo ?? "").trim();
    const mensaje = String(datos?.mensaje ?? "").trim();
    const tipo = String(datos?.tipo ?? "GENERAL").trim().toUpperCase();

    if (!titulo || !mensaje) {
        throw crearError("titulo y mensaje son obligatorios.", 400);
    }
    if (titulo.length > 180 || mensaje.length > 1000 || tipo.length > 50) {
        throw crearError("Uno de los campos supera la longitud permitida.", 400);
    }

    const pool = await obtenerPool();
    const resultado = await pool.request()
        .input("idUsuario", sql.Int, normalizarId(idUsuario, "idUsuario"))
        .input("titulo", sql.NVarChar(180), titulo)
        .input("mensaje", sql.NVarChar(1000), mensaje)
        .input("tipo", sql.NVarChar(50), tipo)
        .query(`
            INSERT INTO dbo.Notificaciones (id_usuario, titulo, mensaje, tipo, leida)
            OUTPUT INSERTED.*
            VALUES (@idUsuario, @titulo, @mensaje, @tipo, 0)
        `);
    return resultado.recordset[0];
}

async function marcarLeida(idUsuario, idNotificacion) {
    const pool = await obtenerPool();
    const resultado = await pool.request()
        .input("idUsuario", sql.Int, normalizarId(idUsuario, "idUsuario"))
        .input("idNotificacion", sql.Int, normalizarId(idNotificacion, "idNotificacion"))
        .query(`
            UPDATE dbo.Notificaciones
            SET leida = 1,
                fecha_lectura = COALESCE(fecha_lectura, SYSDATETIME())
            OUTPUT INSERTED.*
            WHERE id_notificacion = @idNotificacion AND id_usuario = @idUsuario
        `);

    if (resultado.recordset.length === 0) {
        throw crearError("Notificación no encontrada.", 404);
    }
    return resultado.recordset[0];
}

async function marcarTodasLeidas(idUsuario) {
    const pool = await obtenerPool();
    const resultado = await pool.request()
        .input("idUsuario", sql.Int, normalizarId(idUsuario, "idUsuario"))
        .query(`
            UPDATE dbo.Notificaciones
            SET leida = 1,
                fecha_lectura = COALESCE(fecha_lectura, SYSDATETIME())
            WHERE id_usuario = @idUsuario AND leida = 0;
            SELECT @@ROWCOUNT AS actualizadas;
        `);

    return { actualizadas: Number(resultado.recordset?.[0]?.actualizadas || 0) };
}

async function eliminar(idUsuario, idNotificacion) {
    const pool = await obtenerPool();
    const resultado = await pool.request()
        .input("idUsuario", sql.Int, normalizarId(idUsuario, "idUsuario"))
        .input("idNotificacion", sql.Int, normalizarId(idNotificacion, "idNotificacion"))
        .query(`
            DELETE FROM dbo.Notificaciones
            OUTPUT DELETED.id_notificacion
            WHERE id_notificacion = @idNotificacion AND id_usuario = @idUsuario
        `);

    if (resultado.recordset.length === 0) {
        throw crearError("Notificación no encontrada.", 404);
    }
    return { eliminado: true, id_notificacion: Number(idNotificacion) };
}

module.exports = { listar, resumen, crear, marcarLeida, marcarTodasLeidas, eliminar };
