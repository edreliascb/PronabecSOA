/* =========================================================
   EDUPERÚ SOA
   ADMIN SERVICE
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


/* =========================================================
   RESUMEN ADMINISTRATIVO
========================================================= */

async function obtenerResumen() {

    const pool =
        await obtenerPool();


    const resultado =
        await pool
            .request()
            .query(`
                SELECT
                    COUNT(*) AS total_usuarios,

                    SUM(
                        CASE
                            WHEN activo = 1 THEN 1
                            ELSE 0
                        END
                    ) AS usuarios_activos,

                    SUM(
                        CASE
                            WHEN UPPER(rol) = 'ADMINISTRADOR'
                            THEN 1
                            ELSE 0
                        END
                    ) AS administradores

                FROM dbo.Usuarios;


                SELECT
                    COUNT(*) AS total_favoritos
                FROM dbo.Favoritos;


                SELECT
                    COUNT(*) AS total_alertas,

                    SUM(
                        CASE
                            WHEN activa = 1 THEN 1
                            ELSE 0
                        END
                    ) AS alertas_activas

                FROM dbo.Alertas;


                SELECT
                    COUNT(*) AS perfiles_configurados
                FROM dbo.PerfilesUsuario;


                SELECT
                    DB_NAME() AS base_datos,
                    SYSDATETIME() AS fecha_servidor;
            `);


    const usuarios =
        resultado.recordsets?.[0]?.[0] ||
        {};

    const favoritos =
        resultado.recordsets?.[1]?.[0] ||
        {};

    const alertas =
        resultado.recordsets?.[2]?.[0] ||
        {};

    const perfiles =
        resultado.recordsets?.[3]?.[0] ||
        {};

    const servidor =
        resultado.recordsets?.[4]?.[0] ||
        {};


    return {

        usuarios: {

            total:
                Number(
                    usuarios.total_usuarios ||
                    0
                ),

            activos:
                Number(
                    usuarios.usuarios_activos ||
                    0
                ),

            administradores:
                Number(
                    usuarios.administradores ||
                    0
                )

        },

        favoritos: {

            total:
                Number(
                    favoritos.total_favoritos ||
                    0
                )

        },

        alertas: {

            total:
                Number(
                    alertas.total_alertas ||
                    0
                ),

            activas:
                Number(
                    alertas.alertas_activas ||
                    0
                )

        },

        perfiles: {

            configurados:
                Number(
                    perfiles.perfiles_configurados ||
                    0
                )

        },

        database: {

            nombre:
                servidor.base_datos ||
                null,

            fecha_servidor:
                servidor.fecha_servidor ||
                null

        }

    };

}


/* =========================================================
   LISTAR USUARIOS
========================================================= */

async function listarUsuarios() {

    const pool =
        await obtenerPool();


    const resultado =
        await pool
            .request()
            .query(`
                SELECT
                    u.id_usuario,
                    u.nombres,
                    u.apellidos,
                    u.email,
                    u.rol,
                    u.activo,

                    COUNT(
                        DISTINCT f.id_favorito
                    ) AS favoritos,

                    COUNT(
                        DISTINCT a.id_alerta
                    ) AS alertas

                FROM dbo.Usuarios u

                LEFT JOIN dbo.Favoritos f
                    ON f.id_usuario = u.id_usuario

                LEFT JOIN dbo.Alertas a
                    ON a.id_usuario = u.id_usuario

                GROUP BY
                    u.id_usuario,
                    u.nombres,
                    u.apellidos,
                    u.email,
                    u.rol,
                    u.activo

                ORDER BY
                    u.id_usuario ASC;
            `);


    return resultado.recordset.map(
        usuario => ({

            id_usuario:
                usuario.id_usuario,

            nombres:
                usuario.nombres,

            apellidos:
                usuario.apellidos,

            email:
                usuario.email,

            rol:
                usuario.rol,

            activo:
                Boolean(
                    usuario.activo
                ),

            favoritos:
                Number(
                    usuario.favoritos ||
                    0
                ),

            alertas:
                Number(
                    usuario.alertas ||
                    0
                )

        })
    );

}


/* =========================================================
   CAMBIAR ESTADO DE USUARIO
========================================================= */

async function cambiarEstadoUsuario(
    idAdministrador,
    idUsuario,
    activo
) {

    idAdministrador =
        Number(
            idAdministrador
        );

    idUsuario =
        Number(
            idUsuario
        );


    if (
        !Number.isInteger(
            idUsuario
        ) ||
        idUsuario <= 0
    ) {

        throw crearError(
            "El usuario indicado no es válido.",
            400
        );

    }


    if (
        idAdministrador ===
        idUsuario &&
        activo === false
    ) {

        throw crearError(
            "No puedes desactivar tu propia cuenta administrativa.",
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
                idUsuario
            )

            .query(`
                SELECT TOP 1
                    id_usuario,
                    rol,
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


    const actual =
        usuario.recordset[0];


    if (
        String(
            actual.rol ||
            ""
        )
            .toUpperCase() ===
            "ADMINISTRADOR" &&
        Boolean(
            actual.activo
        ) &&
        activo === false
    ) {

        const administradores =
            await pool
                .request()
                .query(`
                    SELECT
                        COUNT(*) AS total

                    FROM dbo.Usuarios

                    WHERE
                        UPPER(rol) = 'ADMINISTRADOR'
                        AND activo = 1;
                `);


        const totalAdministradores =
            Number(
                administradores
                    .recordset?.[0]
                    ?.total ||
                0
            );


        if (
            totalAdministradores <= 1
        ) {

            throw crearError(
                "No se puede desactivar el último administrador activo.",
                400
            );

        }

    }


    const resultado =
        await pool
            .request()

            .input(
                "idUsuario",
                sql.Int,
                idUsuario
            )

            .input(
                "activo",
                sql.Bit,
                Boolean(
                    activo
                )
            )

            .query(`
                UPDATE dbo.Usuarios

                SET
                    activo = @activo

                OUTPUT
                    INSERTED.id_usuario,
                    INSERTED.nombres,
                    INSERTED.apellidos,
                    INSERTED.email,
                    INSERTED.rol,
                    INSERTED.activo

                WHERE
                    id_usuario = @idUsuario;
            `);


    if (
        resultado.recordset.length === 0
    ) {

        throw crearError(
            "No fue posible actualizar el usuario.",
            500
        );

    }


    return {

        ...resultado.recordset[0],

        activo:
            Boolean(
                resultado.recordset[0]
                    .activo
            )

    };

}


module.exports = {

    obtenerResumen,

    listarUsuarios,

    cambiarEstadoUsuario

};
