const {
    obtenerPool,
    sql
} =
    require("../config/database");


function crearError(
    mensaje,
    statusCode
) {

    const error =
        new Error(
            mensaje
        );


    error.statusCode =
        statusCode;


    return error;

}


async function listar(
    idUsuario
) {

    const pool =
        await obtenerPool();


    const resultado =
        await pool
            .request()

            .input(
                "idUsuario",
                sql.Int,
                Number(
                    idUsuario
                )
            )

            .query(
                `
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
                ORDER BY
                    fecha_creacion DESC,
                    id_notificacion DESC
                `
            );


    return resultado.recordset;

}


async function crear(
    idUsuario,
    datos
) {

    const titulo =
        String(
            datos?.titulo ??
            ""
        )
            .trim();


    const mensaje =
        String(
            datos?.mensaje ??
            ""
        )
            .trim();


    const tipo =
        String(
            datos?.tipo ??
            "GENERAL"
        )
            .trim()
            .toUpperCase();


    if (
        !titulo ||
        !mensaje
    ) {

        throw crearError(
            "titulo y mensaje son obligatorios.",
            400
        );

    }


    if (
        titulo.length > 180 ||
        mensaje.length > 1000 ||
        tipo.length > 50
    ) {

        throw crearError(
            "Uno de los campos supera la longitud permitida.",
            400
        );

    }


    const pool =
        await obtenerPool();


    const resultado =
        await pool
            .request()

            .input(
                "idUsuario",
                sql.Int,
                Number(
                    idUsuario
                )
            )

            .input(
                "titulo",
                sql.NVarChar(180),
                titulo
            )

            .input(
                "mensaje",
                sql.NVarChar(1000),
                mensaje
            )

            .input(
                "tipo",
                sql.NVarChar(50),
                tipo
            )

            .query(
                `
                INSERT INTO dbo.Notificaciones
                (
                    id_usuario,
                    titulo,
                    mensaje,
                    tipo,
                    leida
                )

                OUTPUT
                    INSERTED.*

                VALUES
                (
                    @idUsuario,
                    @titulo,
                    @mensaje,
                    @tipo,
                    0
                )
                `
            );


    return resultado.recordset[0];

}


async function marcarLeida(
    idUsuario,
    idNotificacion
) {

    const pool =
        await obtenerPool();


    const resultado =
        await pool
            .request()

            .input(
                "idUsuario",
                sql.Int,
                Number(
                    idUsuario
                )
            )

            .input(
                "idNotificacion",
                sql.Int,
                Number(
                    idNotificacion
                )
            )

            .query(
                `
                UPDATE dbo.Notificaciones
                SET
                    leida = 1,
                    fecha_lectura = SYSDATETIME()

                OUTPUT
                    INSERTED.*

                WHERE
                    id_notificacion = @idNotificacion
                    AND id_usuario = @idUsuario
                `
            );


    if (
        resultado.recordset.length ===
        0
    ) {

        throw crearError(
            "Notificación no encontrada.",
            404
        );

    }


    return resultado.recordset[0];

}


async function eliminar(
    idUsuario,
    idNotificacion
) {

    const pool =
        await obtenerPool();


    const resultado =
        await pool
            .request()

            .input(
                "idUsuario",
                sql.Int,
                Number(
                    idUsuario
                )
            )

            .input(
                "idNotificacion",
                sql.Int,
                Number(
                    idNotificacion
                )
            )

            .query(
                `
                DELETE FROM dbo.Notificaciones

                OUTPUT
                    DELETED.id_notificacion

                WHERE
                    id_notificacion = @idNotificacion
                    AND id_usuario = @idUsuario
                `
            );


    if (
        resultado.recordset.length ===
        0
    ) {

        throw crearError(
            "Notificación no encontrada.",
            404
        );

    }


    return {
        eliminado:
            true,

        id_notificacion:
            Number(
                idNotificacion
            )
    };

}


module.exports = {

    listar,

    crear,

    marcarLeida,

    eliminar

};
