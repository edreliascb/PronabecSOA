const {
    obtenerPool,
    sql
} =
    require("../config/database");

const {
    crearError
} =
    require("./serviciosEmpresariales.helper");


async function listarSeguimientos(
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
                    id_seguimiento,
                    id_postulacion,
                    titulo,
                    estado,
                    notas,
                    fecha_creacion,
                    fecha_actualizacion
                FROM dbo.SeguimientosPostulacion
                WHERE id_usuario = @idUsuario
                ORDER BY
                    fecha_actualizacion DESC,
                    id_seguimiento DESC
                `
            );


    return resultado.recordset;

}


async function crearSeguimiento(
    idUsuario,
    datos
) {

    const idPostulacion =
        String(
            datos?.id_postulacion ??
            datos?.idPostulacion ??
            ""
        )
            .trim();


    const titulo =
        String(
            datos?.titulo ??
            ""
        )
            .trim();


    const estado =
        String(
            datos?.estado ??
            "EN_SEGUIMIENTO"
        )
            .trim()
            .toUpperCase();


    const notas =
        String(
            datos?.notas ??
            ""
        )
            .trim();


    if (
        !idPostulacion ||
        !titulo
    ) {

        throw crearError(
            "id_postulacion y titulo son obligatorios.",
            400
        );

    }


    if (
        titulo.length > 220 ||
        notas.length > 1000 ||
        estado.length > 50 ||
        idPostulacion.length > 120
    ) {

        throw crearError(
            "Uno de los campos supera la longitud permitida.",
            400
        );

    }


    const pool =
        await obtenerPool();


    try {

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
                    "idPostulacion",
                    sql.NVarChar(120),
                    idPostulacion
                )

                .input(
                    "titulo",
                    sql.NVarChar(220),
                    titulo
                )

                .input(
                    "estado",
                    sql.NVarChar(50),
                    estado
                )

                .input(
                    "notas",
                    sql.NVarChar(1000),
                    notas ||
                    null
                )

                .query(
                    `
                    INSERT INTO dbo.SeguimientosPostulacion
                    (
                        id_usuario,
                        id_postulacion,
                        titulo,
                        estado,
                        notas
                    )

                    OUTPUT
                        INSERTED.*

                    VALUES
                    (
                        @idUsuario,
                        @idPostulacion,
                        @titulo,
                        @estado,
                        @notas
                    )
                    `
                );


        return resultado.recordset[0];

    } catch (error) {

        if (
            error?.number ===
            2601 ||
            error?.number ===
            2627
        ) {

            throw crearError(
                "Esta postulación ya se encuentra en seguimiento.",
                409
            );

        }


        throw error;

    }

}


async function cambiarEstado(
    idUsuario,
    idSeguimiento,
    estado
) {

    const nuevoEstado =
        String(
            estado ??
            ""
        )
            .trim()
            .toUpperCase();


    if (!nuevoEstado) {

        throw crearError(
            "El estado es obligatorio.",
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
                "idSeguimiento",
                sql.Int,
                Number(
                    idSeguimiento
                )
            )

            .input(
                "estado",
                sql.NVarChar(50),
                nuevoEstado
            )

            .query(
                `
                UPDATE dbo.SeguimientosPostulacion
                SET
                    estado = @estado,
                    fecha_actualizacion = SYSDATETIME()

                OUTPUT
                    INSERTED.*

                WHERE
                    id_seguimiento = @idSeguimiento
                    AND id_usuario = @idUsuario
                `
            );


    if (
        resultado.recordset.length ===
        0
    ) {

        throw crearError(
            "Seguimiento no encontrado.",
            404
        );

    }


    return resultado.recordset[0];

}


async function eliminarSeguimiento(
    idUsuario,
    idSeguimiento
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
                "idSeguimiento",
                sql.Int,
                Number(
                    idSeguimiento
                )
            )

            .query(
                `
                DELETE FROM dbo.SeguimientosPostulacion

                OUTPUT
                    DELETED.id_seguimiento

                WHERE
                    id_seguimiento = @idSeguimiento
                    AND id_usuario = @idUsuario
                `
            );


    if (
        resultado.recordset.length ===
        0
    ) {

        throw crearError(
            "Seguimiento no encontrado.",
            404
        );

    }


    return {

        eliminado:
            true,

        id_seguimiento:
            Number(
                idSeguimiento
            )

    };

}


module.exports = {

    listarSeguimientos,

    crearSeguimiento,

    cambiarEstado,

    eliminarSeguimiento

};
