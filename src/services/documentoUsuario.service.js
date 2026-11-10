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
                    id_documento_usuario,
                    tipo_documento,
                    nombre_archivo,
                    descripcion,
                    fecha_emision,
                    fecha_vencimiento,
                    estado_validacion,
                    observacion_validacion,
                    fecha_creacion,
                    fecha_actualizacion
                FROM dbo.DocumentosUsuario
                WHERE id_usuario = @idUsuario
                ORDER BY
                    fecha_actualizacion DESC,
                    id_documento_usuario DESC
                `
            );


    return resultado.recordset;

}


async function registrar(
    idUsuario,
    datos
) {

    const tipoDocumento =
        String(
            datos?.tipo_documento ??
            datos?.tipoDocumento ??
            ""
        )
            .trim();


    const nombreArchivo =
        String(
            datos?.nombre_archivo ??
            datos?.nombreArchivo ??
            ""
        )
            .trim();


    const descripcion =
        String(
            datos?.descripcion ??
            ""
        )
            .trim();


    if (
        !tipoDocumento ||
        !nombreArchivo
    ) {

        throw crearError(
            "tipo_documento y nombre_archivo son obligatorios.",
            400
        );

    }


    if (
        tipoDocumento.length > 100 ||
        nombreArchivo.length > 255 ||
        descripcion.length > 500
    ) {

        throw crearError(
            "Uno de los campos supera la longitud permitida.",
            400
        );

    }


    const fechaEmision =
        datos?.fecha_emision ??
        datos?.fechaEmision ??
        null;


    const fechaVencimiento =
        datos?.fecha_vencimiento ??
        datos?.fechaVencimiento ??
        null;


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
                "tipoDocumento",
                sql.NVarChar(100),
                tipoDocumento
            )

            .input(
                "nombreArchivo",
                sql.NVarChar(255),
                nombreArchivo
            )

            .input(
                "descripcion",
                sql.NVarChar(500),
                descripcion ||
                null
            )

            .input(
                "fechaEmision",
                sql.Date,
                fechaEmision
            )

            .input(
                "fechaVencimiento",
                sql.Date,
                fechaVencimiento
            )

            .query(
                `
                INSERT INTO dbo.DocumentosUsuario
                (
                    id_usuario,
                    tipo_documento,
                    nombre_archivo,
                    descripcion,
                    fecha_emision,
                    fecha_vencimiento,
                    estado_validacion
                )

                OUTPUT
                    INSERTED.*

                VALUES
                (
                    @idUsuario,
                    @tipoDocumento,
                    @nombreArchivo,
                    @descripcion,
                    @fechaEmision,
                    @fechaVencimiento,
                    'PENDIENTE'
                )
                `
            );


    return resultado.recordset[0];

}


async function obtenerPorId(
    idUsuario,
    idDocumento
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
                "idDocumento",
                sql.Int,
                Number(
                    idDocumento
                )
            )

            .query(
                `
                SELECT TOP 1
                    *
                FROM dbo.DocumentosUsuario
                WHERE
                    id_documento_usuario = @idDocumento
                    AND id_usuario = @idUsuario
                `
            );


    return resultado.recordset[0] ||
        null;

}


async function eliminar(
    idUsuario,
    idDocumento
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
                "idDocumento",
                sql.Int,
                Number(
                    idDocumento
                )
            )

            .query(
                `
                DELETE FROM dbo.DocumentosUsuario

                OUTPUT
                    DELETED.id_documento_usuario

                WHERE
                    id_documento_usuario = @idDocumento
                    AND id_usuario = @idUsuario
                `
            );


    if (
        resultado.recordset.length ===
        0
    ) {

        throw crearError(
            "Documento no encontrado.",
            404
        );

    }


    return {
        eliminado:
            true,

        id_documento_usuario:
            Number(
                idDocumento
            )
    };

}


module.exports = {

    listar,

    registrar,

    obtenerPorId,

    eliminar

};
