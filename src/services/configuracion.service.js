const {
    obtenerPool,
    sql
} =
    require("../config/database");

const auditoriaService =
    require("./auditoria.service");


const CLAVES_BLOQUEADAS = [

    "SECRET",
    "PASSWORD",
    "TOKEN",
    "API_KEY",
    "DB_USER",
    "DB_SERVER",
    "DB_PASSWORD",
    "JWT"

];


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


function validarClave(
    clave
) {

    const valor =
        String(
            clave ??
            ""
        )
            .trim()
            .toUpperCase();


    if (!valor) {

        throw crearError(
            "La clave es obligatoria.",
            400
        );

    }


    if (
        CLAVES_BLOQUEADAS.some(
            fragmento =>
                valor.includes(
                    fragmento
                )
        )
    ) {

        throw crearError(
            "No se permite administrar secretos o credenciales desde este servicio.",
            400
        );

    }


    return valor;

}


async function listarConfiguracion() {

    const pool =
        await obtenerPool();


    const resultado =
        await pool
            .request()
            .query(
                `
                SELECT
                    id_configuracion,
                    clave,
                    valor,
                    descripcion,
                    fecha_actualizacion
                FROM dbo.ConfiguracionSistema
                ORDER BY clave
                `
            );


    return resultado.recordset;

}


async function actualizarConfiguracion(
    idUsuario,
    claveEntrada,
    datos
) {

    const clave =
        validarClave(
            claveEntrada
        );


    const valor =
        String(
            datos?.valor ??
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
        valor.length >
        1000
    ) {

        throw crearError(
            "El valor supera la longitud permitida.",
            400
        );

    }


    if (
        descripcion.length >
        500
    ) {

        throw crearError(
            "La descripción supera la longitud permitida.",
            400
        );

    }


    const pool =
        await obtenerPool();


    const resultado =
        await pool
            .request()

            .input(
                "clave",
                sql.NVarChar(120),
                clave
            )

            .input(
                "valor",
                sql.NVarChar(1000),
                valor
            )

            .input(
                "descripcion",
                sql.NVarChar(500),
                descripcion ||
                null
            )

            .query(
                `
                MERGE dbo.ConfiguracionSistema AS destino

                USING
                (
                    SELECT
                        @clave AS clave,
                        @valor AS valor,
                        @descripcion AS descripcion
                ) AS origen

                ON destino.clave = origen.clave

                WHEN MATCHED THEN
                    UPDATE SET
                        valor = origen.valor,
                        descripcion = COALESCE(
                            origen.descripcion,
                            destino.descripcion
                        ),
                        fecha_actualizacion = SYSDATETIME()

                WHEN NOT MATCHED THEN
                    INSERT
                    (
                        clave,
                        valor,
                        descripcion
                    )
                    VALUES
                    (
                        origen.clave,
                        origen.valor,
                        origen.descripcion
                    )

                OUTPUT INSERTED.*;
                `
            );


    await auditoriaService
        .registrarEvento({

            id_usuario:
                idUsuario,

            accion:
                "ACTUALIZAR_CONFIGURACION",

            entidad:
                "CONFIGURACION_SISTEMA",

            detalle:
                `Clave actualizada: ${clave}`

        });


    return resultado.recordset[0];

}


module.exports = {

    listarConfiguracion,

    actualizarConfiguracion

};
