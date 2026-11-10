const {
    obtenerPool,
    sql
} =
    require("../config/database");

const {
    crearError
} =
    require("./serviciosEmpresariales.helper");


async function listarHistorial(
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
                SELECT TOP 100
                    id_historial,
                    tipo_consulta,
                    termino,
                    filtros_json,
                    fecha_consulta
                FROM dbo.HistorialConsultas
                WHERE id_usuario = @idUsuario
                ORDER BY
                    fecha_consulta DESC,
                    id_historial DESC
                `
            );


    return resultado.recordset;

}


async function registrarConsulta(
    idUsuario,
    datos
) {

    const tipoConsulta =
        String(
            datos?.tipo_consulta ??
            datos?.tipoConsulta ??
            "GENERAL"
        )
            .trim()
            .toUpperCase();


    const termino =
        String(
            datos?.termino ??
            ""
        )
            .trim();


    const filtros =
        datos?.filtros ??
        datos?.filtros_json ??
        null;


    if (
        tipoConsulta.length >
        80 ||
        termino.length >
        250
    ) {

        throw crearError(
            "Los datos de consulta superan la longitud permitida.",
            400
        );

    }


    let filtrosJson =
        null;


    if (
        filtros !==
        null &&
        filtros !==
        undefined
    ) {

        filtrosJson =
            typeof filtros ===
            "string"
                ? filtros
                : JSON.stringify(
                    filtros
                );


        if (
            filtrosJson.length >
            4000
        ) {

            throw crearError(
                "Los filtros son demasiado extensos.",
                400
            );

        }

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
                "tipoConsulta",
                sql.NVarChar(80),
                tipoConsulta
            )

            .input(
                "termino",
                sql.NVarChar(250),
                termino ||
                null
            )

            .input(
                "filtrosJson",
                sql.NVarChar(4000),
                filtrosJson
            )

            .query(
                `
                INSERT INTO dbo.HistorialConsultas
                (
                    id_usuario,
                    tipo_consulta,
                    termino,
                    filtros_json
                )

                OUTPUT
                    INSERTED.*

                VALUES
                (
                    @idUsuario,
                    @tipoConsulta,
                    @termino,
                    @filtrosJson
                )
                `
            );


    return resultado.recordset[0];

}


async function limpiarHistorial(
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
                DELETE FROM dbo.HistorialConsultas
                WHERE id_usuario = @idUsuario;

                SELECT
                    @@ROWCOUNT AS eliminados;
                `
            );


    return {

        eliminados:
            resultado.recordset[0]
                ?.eliminados ??
            0

    };

}


module.exports = {

    listarHistorial,

    registrarConsulta,

    limpiarHistorial

};
