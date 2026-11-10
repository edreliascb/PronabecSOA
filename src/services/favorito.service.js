/* =========================================================
   EDUPERÚ SOA
   FAVORITO SERVICE
========================================================= */

const {
    obtenerPool,
    sql
} = require("../config/database");


/* =========================================================
   ERROR
========================================================= */

function crearError(
    mensaje,
    statusCode = 400
) {

    const error =
        new Error(
            mensaje
        );


    error.statusCode =
        statusCode;


    return error;

}


/* =========================================================
   TEXTO
========================================================= */

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
        String(
            valor
        )
            .trim();


    if (!texto) {

        return null;

    }


    return texto.slice(
        0,
        maximo
    );

}


/* =========================================================
   PARSEAR JSON
========================================================= */

function parsearJSON(
    valor
) {

    if (!valor) {

        return null;

    }


    try {

        return JSON.parse(
            valor
        );

    } catch {

        return null;

    }

}


/* =========================================================
   FORMATEAR FAVORITO
========================================================= */

function formatearFavorito(
    favorito
) {

    return {

        id_favorito:
            favorito.id_favorito,

        id_usuario:
            favorito.id_usuario,

        tipo_recurso:
            favorito.tipo_recurso,

        recurso_id:
            favorito.recurso_id,

        titulo:
            favorito.titulo,

        subtitulo:
            favorito.subtitulo,

        datos:
            parsearJSON(
                favorito.datos_json
            ),

        fecha_creacion:
            favorito.fecha_creacion

    };

}


/* =========================================================
   LISTAR
========================================================= */

async function listarFavoritos(
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

                    id_favorito,
                    id_usuario,
                    tipo_recurso,
                    recurso_id,
                    titulo,
                    subtitulo,
                    datos_json,
                    fecha_creacion

                FROM dbo.Favoritos

                WHERE
                    id_usuario = @idUsuario

                ORDER BY
                    fecha_creacion DESC;
                `
            );


    return resultado.recordset
        .map(
            formatearFavorito
        );

}


/* =========================================================
   OBTENER UNO
========================================================= */

async function obtenerFavorito(
    idUsuario,
    idFavorito
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
                "idFavorito",
                sql.Int,
                Number(
                    idFavorito
                )
            )

            .query(
                `
                SELECT TOP 1

                    id_favorito,
                    id_usuario,
                    tipo_recurso,
                    recurso_id,
                    titulo,
                    subtitulo,
                    datos_json,
                    fecha_creacion

                FROM dbo.Favoritos

                WHERE
                    id_usuario = @idUsuario

                    AND

                    id_favorito = @idFavorito;
                `
            );


    if (
        resultado.recordset.length === 0
    ) {

        throw crearError(
            "Favorito no encontrado.",
            404
        );

    }


    return formatearFavorito(
        resultado.recordset[0]
    );

}


/* =========================================================
   CREAR
========================================================= */

async function crearFavorito(
    idUsuario,
    datos
) {

    const tipoRecurso =
        limpiarTexto(
            datos?.tipo_recurso ||
            "OPORTUNIDAD",
            50
        );


    const recursoId =
        limpiarTexto(
            datos?.recurso_id,
            200
        );


    const titulo =
        limpiarTexto(
            datos?.titulo,
            250
        );


    const subtitulo =
        limpiarTexto(
            datos?.subtitulo,
            250
        );


    if (
        !tipoRecurso ||
        !recursoId ||
        !titulo
    ) {

        throw crearError(
            "tipo_recurso, recurso_id y titulo son obligatorios.",
            400
        );

    }


    let datosJson =
        null;


    if (
        datos?.datos !== undefined
    ) {

        try {

            datosJson =
                JSON.stringify(
                    datos.datos
                );

        } catch {

            throw crearError(
                "Los datos adicionales del favorito no son válidos.",
                400
            );

        }

    }


    const pool =
        await obtenerPool();


    /* =====================================================
       VERIFICAR USUARIO
    ===================================================== */

    const usuario =
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
                SELECT TOP 1
                    id_usuario,
                    activo

                FROM dbo.Usuarios

                WHERE
                    id_usuario = @idUsuario;
                `
            );


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


    /* =====================================================
       VERIFICAR DUPLICADO
    ===================================================== */

    const existente =
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
                "tipoRecurso",
                sql.NVarChar(50),
                tipoRecurso
            )

            .input(
                "recursoId",
                sql.NVarChar(200),
                recursoId
            )

            .query(
                `
                SELECT TOP 1

                    id_favorito,
                    id_usuario,
                    tipo_recurso,
                    recurso_id,
                    titulo,
                    subtitulo,
                    datos_json,
                    fecha_creacion

                FROM dbo.Favoritos

                WHERE
                    id_usuario = @idUsuario

                    AND tipo_recurso = @tipoRecurso

                    AND recurso_id = @recursoId;
                `
            );


    if (
        existente.recordset.length > 0
    ) {

        return {

            creado:
                false,

            duplicado:
                true,

            favorito:
                formatearFavorito(
                    existente.recordset[0]
                )

        };

    }


    /* =====================================================
       INSERTAR
    ===================================================== */

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
                "tipoRecurso",
                sql.NVarChar(50),
                tipoRecurso
            )

            .input(
                "recursoId",
                sql.NVarChar(200),
                recursoId
            )

            .input(
                "titulo",
                sql.NVarChar(250),
                titulo
            )

            .input(
                "subtitulo",
                sql.NVarChar(250),
                subtitulo
            )

            .input(
                "datosJson",
                sql.NVarChar(sql.MAX),
                datosJson
            )

            .query(
                `
                INSERT INTO dbo.Favoritos
                (
                    id_usuario,
                    tipo_recurso,
                    recurso_id,
                    titulo,
                    subtitulo,
                    datos_json
                )

                OUTPUT

                    INSERTED.id_favorito,
                    INSERTED.id_usuario,
                    INSERTED.tipo_recurso,
                    INSERTED.recurso_id,
                    INSERTED.titulo,
                    INSERTED.subtitulo,
                    INSERTED.datos_json,
                    INSERTED.fecha_creacion

                VALUES
                (
                    @idUsuario,
                    @tipoRecurso,
                    @recursoId,
                    @titulo,
                    @subtitulo,
                    @datosJson
                );
                `
            );


    return {

        creado:
            true,

        duplicado:
            false,

        favorito:
            formatearFavorito(
                resultado.recordset[0]
            )

    };

}


/* =========================================================
   ELIMINAR
========================================================= */

async function eliminarFavorito(
    idUsuario,
    idFavorito
) {

    if (
        !Number.isInteger(
            Number(
                idFavorito
            )
        )
    ) {

        throw crearError(
            "El identificador del favorito no es válido.",
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
                "idFavorito",
                sql.Int,
                Number(
                    idFavorito
                )
            )

            .query(
                `
                DELETE FROM dbo.Favoritos

                OUTPUT
                    DELETED.id_favorito,
                    DELETED.titulo

                WHERE
                    id_usuario = @idUsuario

                    AND

                    id_favorito = @idFavorito;
                `
            );


    if (
        resultado.recordset.length === 0
    ) {

        throw crearError(
            "Favorito no encontrado.",
            404
        );

    }


    return resultado.recordset[0];

}


/* =========================================================
   ELIMINAR POR RECURSO
========================================================= */

async function eliminarPorRecurso(
    idUsuario,
    tipoRecurso,
    recursoId
) {

    tipoRecurso =
        limpiarTexto(
            tipoRecurso,
            50
        );


    recursoId =
        limpiarTexto(
            recursoId,
            200
        );


    if (
        !tipoRecurso ||
        !recursoId
    ) {

        throw crearError(
            "tipo_recurso y recurso_id son obligatorios.",
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
                "tipoRecurso",
                sql.NVarChar(50),
                tipoRecurso
            )

            .input(
                "recursoId",
                sql.NVarChar(200),
                recursoId
            )

            .query(
                `
                DELETE FROM dbo.Favoritos

                OUTPUT
                    DELETED.id_favorito,
                    DELETED.titulo

                WHERE
                    id_usuario = @idUsuario

                    AND tipo_recurso = @tipoRecurso

                    AND recurso_id = @recursoId;
                `
            );


    if (
        resultado.recordset.length === 0
    ) {

        throw crearError(
            "Favorito no encontrado.",
            404
        );

    }


    return resultado.recordset[0];

}


/* =========================================================
   EXPORTAR
========================================================= */

module.exports = {

    listarFavoritos,

    obtenerFavorito,

    crearFavorito,

    eliminarFavorito,

    eliminarPorRecurso

};