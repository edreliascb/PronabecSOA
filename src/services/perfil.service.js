/* =========================================================
   EDUPERÚ SOA
   PERFIL DE USUARIO SERVICE
========================================================= */

const {
    obtenerPool,
    sql
} = require("../config/database");


/* =========================================================
   CREAR ERROR
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
   LIMPIAR TEXTO
========================================================= */

function limpiarTexto(
    valor,
    maximo = 150
) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return null;
    }


    const texto =
        String(valor)
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
   OBTENER PERFIL
========================================================= */

async function obtenerPerfil(
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

                    p.id_perfil,
                    p.departamento,
                    p.provincia,
                    p.distrito,
                    p.carrera_interes,
                    p.nivel_estudio,
                    p.institucion,
                    p.fecha_actualizacion

                FROM dbo.Usuarios u

                LEFT JOIN dbo.PerfilesUsuario p
                    ON p.id_usuario = u.id_usuario

                WHERE
                    u.id_usuario = @idUsuario;
                `
            );


    if (
        resultado.recordset.length === 0
    ) {

        throw crearError(
            "Usuario no encontrado.",
            404
        );
    }


    return resultado.recordset[0];
}


/* =========================================================
   GUARDAR / ACTUALIZAR PERFIL
========================================================= */

async function guardarPerfil(
    idUsuario,
    datos
) {

    const departamento =
        limpiarTexto(
            datos?.departamento,
            100
        );


    const provincia =
        limpiarTexto(
            datos?.provincia,
            100
        );


    const distrito =
        limpiarTexto(
            datos?.distrito,
            100
        );


    const carreraInteres =
        limpiarTexto(
            datos?.carrera_interes,
            150
        );


    const nivelEstudio =
        limpiarTexto(
            datos?.nivel_estudio,
            100
        );


    const institucion =
        limpiarTexto(
            datos?.institucion,
            180
        );


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


    const resultado =
        await pool
            .request()

            .input(
                "idUsuario",
                sql.Int,
                Number(idUsuario)
            )

            .input(
                "departamento",
                sql.NVarChar(100),
                departamento
            )

            .input(
                "provincia",
                sql.NVarChar(100),
                provincia
            )

            .input(
                "distrito",
                sql.NVarChar(100),
                distrito
            )

            .input(
                "carreraInteres",
                sql.NVarChar(150),
                carreraInteres
            )

            .input(
                "nivelEstudio",
                sql.NVarChar(100),
                nivelEstudio
            )

            .input(
                "institucion",
                sql.NVarChar(180),
                institucion
            )

            .query(
                `
                IF EXISTS
                (
                    SELECT 1
                    FROM dbo.PerfilesUsuario
                    WHERE id_usuario = @idUsuario
                )
                BEGIN

                    UPDATE dbo.PerfilesUsuario

                    SET
                        departamento = @departamento,
                        provincia = @provincia,
                        distrito = @distrito,
                        carrera_interes = @carreraInteres,
                        nivel_estudio = @nivelEstudio,
                        institucion = @institucion,
                        fecha_actualizacion = SYSDATETIME()

                    WHERE
                        id_usuario = @idUsuario;

                END
                ELSE
                BEGIN

                    INSERT INTO dbo.PerfilesUsuario
                    (
                        id_usuario,
                        departamento,
                        provincia,
                        distrito,
                        carrera_interes,
                        nivel_estudio,
                        institucion,
                        fecha_actualizacion
                    )

                    VALUES
                    (
                        @idUsuario,
                        @departamento,
                        @provincia,
                        @distrito,
                        @carreraInteres,
                        @nivelEstudio,
                        @institucion,
                        SYSDATETIME()
                    );

                END;


                SELECT

                    id_perfil,
                    id_usuario,
                    departamento,
                    provincia,
                    distrito,
                    carrera_interes,
                    nivel_estudio,
                    institucion,
                    fecha_actualizacion

                FROM dbo.PerfilesUsuario

                WHERE
                    id_usuario = @idUsuario;
                `
            );


    return resultado.recordset[0];
}


/* =========================================================
   EXPORTAR
========================================================= */

module.exports = {

    obtenerPerfil,

    guardarPerfil

};