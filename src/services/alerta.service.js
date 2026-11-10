/* =========================================================
   EDUPERÚ SOA
   ALERTA SERVICE
========================================================= */

const {
    obtenerPool,
    sql
} = require("../config/database");


function crearError(
    mensaje,
    statusCode = 400
) {

    const error =
        new Error(mensaje);

    error.statusCode =
        statusCode;

    return error;

}


function limpiarTexto(
    valor,
    maximo
) {

    if (
        valor === undefined ||
        valor === null
    ) {
        return null;
    }


    const texto =
        String(valor).trim();


    if (!texto) {
        return null;
    }


    return texto.slice(
        0,
        maximo
    );

}


/* =========================================================
   LISTAR ALERTAS
========================================================= */

async function listarAlertas(
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
                Number(idUsuario)
            )

            .query(`
                SELECT
                    id_alerta,
                    id_usuario,
                    nombre,
                    palabra_clave,
                    region,
                    activa,
                    fecha_creacion

                FROM dbo.Alertas

                WHERE
                    id_usuario = @idUsuario

                ORDER BY
                    fecha_creacion DESC;
            `);


    return resultado.recordset;

}


/* =========================================================
   OBTENER ALERTA
========================================================= */

async function obtenerAlerta(
    idUsuario,
    idAlerta
) {

    const pool =
        await obtenerPool();


    const resultado =
        await pool
            .request()

            .input(
                "idUsuario",
                sql.Int,
                Number(idUsuario)
            )

            .input(
                "idAlerta",
                sql.Int,
                Number(idAlerta)
            )

            .query(`
                SELECT TOP 1
                    id_alerta,
                    id_usuario,
                    nombre,
                    palabra_clave,
                    region,
                    activa,
                    fecha_creacion

                FROM dbo.Alertas

                WHERE
                    id_usuario = @idUsuario

                    AND

                    id_alerta = @idAlerta;
            `);


    if (
        resultado.recordset.length === 0
    ) {

        throw crearError(
            "Alerta no encontrada.",
            404
        );

    }


    return resultado.recordset[0];

}


/* =========================================================
   CREAR ALERTA
========================================================= */

async function crearAlerta(
    idUsuario,
    datos
) {

    const nombre =
        limpiarTexto(
            datos?.nombre,
            100
        );


    const palabraClave =
        limpiarTexto(
            datos?.palabra_clave,
            150
        );


    const region =
        limpiarTexto(
            datos?.region,
            100
        );


    if (!nombre) {

        throw crearError(
            "El nombre de la alerta es obligatorio.",
            400
        );

    }


    const pool =
        await obtenerPool();


    const usuario =
        await pool
            .request()

            .input(
                "idUsuario",
                sql.Int,
                Number(idUsuario)
            )

            .query(`
                SELECT TOP 1
                    id_usuario,
                    activo

                FROM dbo.Usuarios

                WHERE
                    id_usuario = @idUsuario;
            `);


    if (
        usuario.recordset.length === 0
    ) {

        throw crearError(
            "Usuario no encontrado.",
            404
        );

    }


    if (
        !Boolean(
            usuario.recordset[0].activo
        )
    ) {

        throw crearError(
            "La cuenta se encuentra desactivada.",
            403
        );

    }


    const resultado =
        await pool
            .request()

            .input(
                "idUsuario",
                sql.Int,
                Number(idUsuario)
            )

            .input(
                "nombre",
                sql.NVarChar(100),
                nombre
            )

            .input(
                "palabraClave",
                sql.NVarChar(150),
                palabraClave
            )

            .input(
                "region",
                sql.NVarChar(100),
                region
            )

            .query(`
                INSERT INTO dbo.Alertas
                (
                    id_usuario,
                    nombre,
                    palabra_clave,
                    region,
                    activa,
                    fecha_creacion
                )

                OUTPUT
                    INSERTED.id_alerta,
                    INSERTED.id_usuario,
                    INSERTED.nombre,
                    INSERTED.palabra_clave,
                    INSERTED.region,
                    INSERTED.activa,
                    INSERTED.fecha_creacion

                VALUES
                (
                    @idUsuario,
                    @nombre,
                    @palabraClave,
                    @region,
                    1,
                    SYSDATETIME()
                );
            `);


    return resultado.recordset[0];

}


/* =========================================================
   ACTUALIZAR ALERTA
========================================================= */

async function actualizarAlerta(
    idUsuario,
    idAlerta,
    datos
) {

    const actual =
        await obtenerAlerta(
            idUsuario,
            idAlerta
        );


    const nombre =
        limpiarTexto(
            datos?.nombre ??
            actual.nombre,
            100
        );


    const palabraClave =
        limpiarTexto(
            datos?.palabra_clave ??
            actual.palabra_clave,
            150
        );


    const region =
        limpiarTexto(
            datos?.region ??
            actual.region,
            100
        );


    if (!nombre) {

        throw crearError(
            "El nombre de la alerta es obligatorio.",
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
                Number(idUsuario)
            )

            .input(
                "idAlerta",
                sql.Int,
                Number(idAlerta)
            )

            .input(
                "nombre",
                sql.NVarChar(100),
                nombre
            )

            .input(
                "palabraClave",
                sql.NVarChar(150),
                palabraClave
            )

            .input(
                "region",
                sql.NVarChar(100),
                region
            )

            .query(`
                UPDATE dbo.Alertas

                SET
                    nombre = @nombre,
                    palabra_clave = @palabraClave,
                    region = @region

                OUTPUT
                    INSERTED.id_alerta,
                    INSERTED.id_usuario,
                    INSERTED.nombre,
                    INSERTED.palabra_clave,
                    INSERTED.region,
                    INSERTED.activa,
                    INSERTED.fecha_creacion

                WHERE
                    id_alerta = @idAlerta

                    AND

                    id_usuario = @idUsuario;
            `);


    return resultado.recordset[0];

}


/* =========================================================
   ACTIVAR / DESACTIVAR
========================================================= */

async function cambiarEstado(
    idUsuario,
    idAlerta,
    activa
) {

    const pool =
        await obtenerPool();


    const resultado =
        await pool
            .request()

            .input(
                "idUsuario",
                sql.Int,
                Number(idUsuario)
            )

            .input(
                "idAlerta",
                sql.Int,
                Number(idAlerta)
            )

            .input(
                "activa",
                sql.Bit,
                Boolean(activa)
            )

            .query(`
                UPDATE dbo.Alertas

                SET
                    activa = @activa

                OUTPUT
                    INSERTED.id_alerta,
                    INSERTED.id_usuario,
                    INSERTED.nombre,
                    INSERTED.palabra_clave,
                    INSERTED.region,
                    INSERTED.activa,
                    INSERTED.fecha_creacion

                WHERE
                    id_alerta = @idAlerta

                    AND

                    id_usuario = @idUsuario;
            `);


    if (
        resultado.recordset.length === 0
    ) {

        throw crearError(
            "Alerta no encontrada.",
            404
        );

    }


    return resultado.recordset[0];

}


/* =========================================================
   ELIMINAR
========================================================= */

async function eliminarAlerta(
    idUsuario,
    idAlerta
) {

    const pool =
        await obtenerPool();


    const resultado =
        await pool
            .request()

            .input(
                "idUsuario",
                sql.Int,
                Number(idUsuario)
            )

            .input(
                "idAlerta",
                sql.Int,
                Number(idAlerta)
            )

            .query(`
                DELETE FROM dbo.Alertas

                OUTPUT
                    DELETED.id_alerta,
                    DELETED.nombre

                WHERE
                    id_alerta = @idAlerta

                    AND

                    id_usuario = @idUsuario;
            `);


    if (
        resultado.recordset.length === 0
    ) {

        throw crearError(
            "Alerta no encontrada.",
            404
        );

    }


    return resultado.recordset[0];

}


/* =========================================================
   EXPORTAR
========================================================= */

module.exports = {

    listarAlertas,

    obtenerAlerta,

    crearAlerta,

    actualizarAlerta,

    cambiarEstado,

    eliminarAlerta

};