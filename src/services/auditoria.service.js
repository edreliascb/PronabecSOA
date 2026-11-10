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


async function registrarEvento(
    datos
) {

    const idUsuario =
        datos?.id_usuario ??
        datos?.idUsuario ??
        null;


    const accion =
        String(
            datos?.accion ??
            ""
        )
            .trim()
            .toUpperCase();


    const entidad =
        String(
            datos?.entidad ??
            "SISTEMA"
        )
            .trim()
            .toUpperCase();


    const detalle =
        String(
            datos?.detalle ??
            ""
        )
            .trim();


    if (!accion) {

        throw crearError(
            "La acción es obligatoria.",
            400
        );

    }


    if (
        accion.length > 100 ||
        entidad.length > 100 ||
        detalle.length > 1500
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
                idUsuario
                    ? Number(
                        idUsuario
                    )
                    : null
            )

            .input(
                "accion",
                sql.NVarChar(100),
                accion
            )

            .input(
                "entidad",
                sql.NVarChar(100),
                entidad
            )

            .input(
                "detalle",
                sql.NVarChar(1500),
                detalle ||
                null
            )

            .query(
                `
                INSERT INTO dbo.AuditoriaEventos
                (
                    id_usuario,
                    accion,
                    entidad,
                    detalle
                )

                OUTPUT
                    INSERTED.*

                VALUES
                (
                    @idUsuario,
                    @accion,
                    @entidad,
                    @detalle
                )
                `
            );


    return resultado.recordset[0];

}


async function listarEventos(
    limite = 100
) {

    const cantidad =
        Math.min(
            Math.max(
                Number(
                    limite
                ) ||
                100,
                1
            ),
            500
        );


    const pool =
        await obtenerPool();


    const resultado =
        await pool
            .request()

            .input(
                "limite",
                sql.Int,
                cantidad
            )

            .query(
                `
                SELECT TOP (@limite)
                    a.id_auditoria,
                    a.id_usuario,
                    u.email,
                    u.rol,
                    a.accion,
                    a.entidad,
                    a.detalle,
                    a.fecha_evento
                FROM dbo.AuditoriaEventos a
                LEFT JOIN dbo.Usuarios u
                    ON u.id_usuario = a.id_usuario
                ORDER BY
                    a.fecha_evento DESC,
                    a.id_auditoria DESC
                `
            );


    return resultado.recordset;

}


module.exports = {

    registrarEvento,

    listarEventos

};
