const {
    obtenerPool
} =
    require("../config/database");


async function obtenerResumen() {

    const pool =
        await obtenerPool();


    const resultado =
        await pool
            .request()
            .query(
                `
                SELECT
                    (SELECT COUNT(*) FROM dbo.Usuarios) AS usuarios,
                    (SELECT COUNT(*) FROM dbo.Usuarios WHERE activo = 1) AS usuarios_activos,
                    (SELECT COUNT(*) FROM dbo.PerfilesUsuario) AS perfiles,
                    (SELECT COUNT(*) FROM dbo.Favoritos) AS favoritos,
                    (SELECT COUNT(*) FROM dbo.Alertas) AS alertas,
                    (SELECT COUNT(*) FROM dbo.Alertas WHERE activa = 1) AS alertas_activas,
                    (SELECT COUNT(*) FROM dbo.SeguimientosPostulacion) AS seguimientos,
                    (SELECT COUNT(*) FROM dbo.HistorialConsultas) AS consultas_historial,
                    (SELECT COUNT(*) FROM dbo.Notificaciones) AS notificaciones,
                    (SELECT COUNT(*) FROM dbo.DocumentosUsuario) AS documentos_usuario;
                `
            );


    return {

        servicio:
            "ReporteService",

        tipo:
            "Servicio de Tarea / Analítica",

        fecha:
            new Date()
                .toISOString(),

        resumen:
            resultado.recordset[0]

    };

}


async function obtenerReporteUsuarios() {

    const pool =
        await obtenerPool();


    const resultado =
        await pool
            .request()
            .query(
                `
                SELECT
                    u.id_usuario,
                    u.nombres,
                    u.apellidos,
                    u.email,
                    u.rol,
                    u.activo,
                    u.fecha_creacion,

                    CASE
                        WHEN p.id_perfil IS NULL THEN 0
                        ELSE 1
                    END AS perfil_configurado,

                    (
                        SELECT COUNT(*)
                        FROM dbo.Favoritos f
                        WHERE f.id_usuario = u.id_usuario
                    ) AS favoritos,

                    (
                        SELECT COUNT(*)
                        FROM dbo.Alertas a
                        WHERE a.id_usuario = u.id_usuario
                    ) AS alertas,

                    (
                        SELECT COUNT(*)
                        FROM dbo.SeguimientosPostulacion s
                        WHERE s.id_usuario = u.id_usuario
                    ) AS seguimientos,

                    (
                        SELECT COUNT(*)
                        FROM dbo.HistorialConsultas h
                        WHERE h.id_usuario = u.id_usuario
                    ) AS consultas

                FROM dbo.Usuarios u

                LEFT JOIN dbo.PerfilesUsuario p
                    ON p.id_usuario = u.id_usuario

                ORDER BY
                    u.id_usuario;
                `
            );


    return {

        servicio:
            "ReporteService",

        tipoReporte:
            "USUARIOS",

        total:
            resultado.recordset.length,

        datos:
            resultado.recordset

    };

}


module.exports = {

    obtenerResumen,

    obtenerReporteUsuarios

};
