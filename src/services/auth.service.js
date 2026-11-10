/* =========================================================
   EDUPERÚ SOA
   AUTHENTICATION SERVICE - SEGURIDAD FINAL
========================================================= */

const bcrypt =
    require(
        "bcryptjs"
    );

const jwt =
    require(
        "jsonwebtoken"
    );

const {
    obtenerPool,
    sql
} =
    require(
        "../config/database"
    );


const JWT_ISSUER =
    "EduPeruSOA";

const JWT_AUDIENCE =
    "EduPeruWeb";

const BCRYPT_ROUNDS =
    12;


/* =========================================================
   NORMALIZAR EMAIL
========================================================= */

function normalizarEmail(
    email
) {

    return String(
        email ||
        ""
    )
        .trim()
        .toLowerCase();

}


/* =========================================================
   CREAR ERROR CONTROLADO
========================================================= */

function crearError(
    mensaje,
    statusCode,
    codigo = null
) {

    const error =
        new Error(
            mensaje
        );


    error.statusCode =
        statusCode;


    if (codigo) {

        error.codigo =
            codigo;

    }


    return error;

}


/* =========================================================
   VALIDAR CONFIGURACIÓN JWT

   Se ejecuta ANTES de registrar un usuario para evitar que
   una configuración incorrecta deje una cuenta insertada
   sin poder generar su token.
========================================================= */

function validarConfiguracionJwt() {

    const jwtSecret =
        String(
            process.env.JWT_SECRET ||
            ""
        );


    if (
        jwtSecret.length < 32
    ) {

        throw crearError(
            "Configuración de autenticación no disponible.",
            500,
            "JWT_CONFIG_ERROR"
        );

    }


    const expiresIn =
        String(
            process.env.JWT_EXPIRES_IN ||
            "8h"
        )
            .trim();


    if (!expiresIn) {

        throw crearError(
            "Configuración de autenticación no disponible.",
            500,
            "JWT_CONFIG_ERROR"
        );

    }


    return {

        jwtSecret,

        expiresIn

    };

}


/* =========================================================
   BUSCAR POR EMAIL
========================================================= */

async function buscarPorEmail(
    email
) {

    const emailNormalizado =
        normalizarEmail(
            email
        );


    if (!emailNormalizado) {

        return null;

    }


    const pool =
        await obtenerPool();


    const resultado =
        await pool
            .request()

            .input(
                "email",
                sql.NVarChar(180),
                emailNormalizado
            )

            .query(
                `
                SELECT TOP 1

                    id_usuario,
                    nombres,
                    apellidos,
                    email,
                    password_hash,
                    rol,
                    activo,
                    fecha_creacion,
                    fecha_actualizacion

                FROM dbo.Usuarios

                WHERE
                    email = @email
                `
            );


    return (
        resultado.recordset[0] ||
        null
    );

}


/* =========================================================
   BUSCAR POR ID
========================================================= */

async function buscarPorId(
    idUsuario
) {

    const id =
        Number(
            idUsuario
        );


    if (
        !Number.isInteger(
            id
        ) ||
        id <= 0
    ) {

        return null;

    }


    const pool =
        await obtenerPool();


    const resultado =
        await pool
            .request()

            .input(
                "idUsuario",
                sql.Int,
                id
            )

            .query(
                `
                SELECT TOP 1

                    id_usuario,
                    nombres,
                    apellidos,
                    email,
                    rol,
                    activo,
                    fecha_creacion,
                    fecha_actualizacion

                FROM dbo.Usuarios

                WHERE
                    id_usuario = @idUsuario
                `
            );


    return (
        resultado.recordset[0] ||
        null
    );

}


/* =========================================================
   GENERAR TOKEN
========================================================= */

function generarToken(
    usuario
) {

    const {
        jwtSecret,
        expiresIn
    } =
        validarConfiguracionJwt();


    const idUsuario =
        Number(
            usuario?.id_usuario
        );


    if (
        !Number.isInteger(
            idUsuario
        ) ||
        idUsuario <= 0
    ) {

        throw crearError(
            "No fue posible generar la sesión.",
            500,
            "JWT_USER_ERROR"
        );

    }


    const rol =
        String(
            usuario?.rol ||
            "ESTUDIANTE"
        )
            .trim()
            .toUpperCase();


    return jwt.sign(
        {
            email:
                normalizarEmail(
                    usuario.email
                ),

            rol
        },
        jwtSecret,
        {
            algorithm:
                "HS256",

            subject:
                String(
                    idUsuario
                ),

            expiresIn,

            issuer:
                JWT_ISSUER,

            audience:
                JWT_AUDIENCE
        }
    );

}


/* =========================================================
   VALIDAR DATOS DE REGISTRO
========================================================= */

function validarDatosRegistro(
    datos
) {

    const nombres =
        String(
            datos?.nombres ||
            ""
        )
            .trim();


    const apellidos =
        String(
            datos?.apellidos ||
            ""
        )
            .trim();


    const email =
        normalizarEmail(
            datos?.email
        );


    const password =
        String(
            datos?.password ||
            ""
        );


    if (
        !nombres ||
        !apellidos ||
        !email ||
        !password
    ) {

        throw crearError(
            "Nombres, apellidos, correo y contraseña son obligatorios.",
            400,
            "DATOS_INCOMPLETOS"
        );

    }


    if (
        nombres.length > 100 ||
        apellidos.length > 100
    ) {

        throw crearError(
            "Nombres y apellidos deben tener como máximo 100 caracteres.",
            400,
            "LONGITUD_INVALIDA"
        );

    }


    if (
        email.length > 180 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(
                email
            )
    ) {

        throw crearError(
            "El correo electrónico no es válido.",
            400,
            "EMAIL_INVALIDO"
        );

    }


    if (
        password.length < 8
    ) {

        throw crearError(
            "La contraseña debe tener al menos 8 caracteres.",
            400,
            "PASSWORD_CORTA"
        );

    }


    /*
       bcrypt utiliza como máximo 72 bytes de entrada.
       Validarlo evita que dos contraseñas largas distintas
       terminen tratándose como equivalentes por truncamiento.
    */

    if (
        Buffer.byteLength(
            password,
            "utf8"
        ) > 72
    ) {

        throw crearError(
            "La contraseña es demasiado larga. Utiliza como máximo 72 bytes.",
            400,
            "PASSWORD_LARGA"
        );

    }


    return {

        nombres,

        apellidos,

        email,

        password

    };

}


/* =========================================================
   REGISTRAR
========================================================= */

async function registrarUsuario(
    datos
) {

    /*
       Validar JWT antes de escribir en SQL Server.
    */

    validarConfiguracionJwt();


    const {
        nombres,
        apellidos,
        email,
        password
    } =
        validarDatosRegistro(
            datos
        );


    const existente =
        await buscarPorEmail(
            email
        );


    if (existente) {

        throw crearError(
            "Ya existe una cuenta registrada con ese correo.",
            409,
            "EMAIL_DUPLICADO"
        );

    }


    const passwordHash =
        await bcrypt.hash(
            password,
            BCRYPT_ROUNDS
        );


    const pool =
        await obtenerPool();


    try {

        const resultado =
            await pool
                .request()

                .input(
                    "nombres",
                    sql.NVarChar(100),
                    nombres
                )

                .input(
                    "apellidos",
                    sql.NVarChar(100),
                    apellidos
                )

                .input(
                    "email",
                    sql.NVarChar(180),
                    email
                )

                .input(
                    "passwordHash",
                    sql.NVarChar(255),
                    passwordHash
                )

                .query(
                    `
                    INSERT INTO dbo.Usuarios
                    (
                        nombres,
                        apellidos,
                        email,
                        password_hash,
                        rol,
                        activo
                    )

                    OUTPUT

                        INSERTED.id_usuario,
                        INSERTED.nombres,
                        INSERTED.apellidos,
                        INSERTED.email,
                        INSERTED.rol,
                        INSERTED.activo,
                        INSERTED.fecha_creacion

                    VALUES
                    (
                        @nombres,
                        @apellidos,
                        @email,
                        @passwordHash,
                        'ESTUDIANTE',
                        1
                    )
                    `
                );


        const usuario =
            resultado.recordset[0];


        return {

            usuario,

            token:
                generarToken(
                    usuario
                )

        };

    } catch (error) {

        /*
           SQL Server:
           2601 / 2627 = clave o índice único duplicado.
           Esto cubre también dos registros concurrentes
           si existe una restricción UNIQUE sobre email.
        */

        if (
            error?.number === 2601 ||
            error?.number === 2627
        ) {

            throw crearError(
                "Ya existe una cuenta registrada con ese correo.",
                409,
                "EMAIL_DUPLICADO"
            );

        }


        throw error;

    }

}


/* =========================================================
   LOGIN
========================================================= */

async function iniciarSesion(
    datos
) {

    validarConfiguracionJwt();


    const email =
        normalizarEmail(
            datos?.email
        );


    const password =
        String(
            datos?.password ||
            ""
        );


    if (
        !email ||
        !password
    ) {

        throw crearError(
            "Correo y contraseña son obligatorios.",
            400,
            "DATOS_INCOMPLETOS"
        );

    }


    if (
        email.length > 180 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(
                email
            )
    ) {

        throw crearError(
            "Correo o contraseña incorrectos.",
            401,
            "CREDENCIALES_INVALIDAS"
        );

    }


    if (
        Buffer.byteLength(
            password,
            "utf8"
        ) > 72
    ) {

        throw crearError(
            "Correo o contraseña incorrectos.",
            401,
            "CREDENCIALES_INVALIDAS"
        );

    }


    const usuario =
        await buscarPorEmail(
            email
        );


    if (!usuario) {

        throw crearError(
            "Correo o contraseña incorrectos.",
            401,
            "CREDENCIALES_INVALIDAS"
        );

    }


    if (
        !Boolean(
            usuario.activo
        )
    ) {

        throw crearError(
            "La cuenta se encuentra desactivada.",
            403,
            "CUENTA_DESACTIVADA"
        );

    }


    const correcto =
        await bcrypt.compare(
            password,
            usuario.password_hash
        );


    if (!correcto) {

        throw crearError(
            "Correo o contraseña incorrectos.",
            401,
            "CREDENCIALES_INVALIDAS"
        );

    }


    const usuarioPublico = {

        id_usuario:
            usuario.id_usuario,

        nombres:
            usuario.nombres,

        apellidos:
            usuario.apellidos,

        email:
            usuario.email,

        rol:
            String(
                usuario.rol ||
                ""
            )
                .trim()
                .toUpperCase(),

        activo:
            usuario.activo,

        fecha_creacion:
            usuario.fecha_creacion

    };


    return {

        usuario:
            usuarioPublico,

        token:
            generarToken(
                usuarioPublico
            )

    };

}


/* =========================================================
   USUARIO ACTUAL
========================================================= */

async function obtenerUsuarioActual(
    idUsuario
) {

    const usuario =
        await buscarPorId(
            idUsuario
        );


    if (!usuario) {

        throw crearError(
            "Usuario no encontrado.",
            404,
            "USUARIO_NO_ENCONTRADO"
        );

    }


    if (
        !Boolean(
            usuario.activo
        )
    ) {

        throw crearError(
            "La cuenta se encuentra desactivada.",
            403,
            "CUENTA_DESACTIVADA"
        );

    }


    const pool =
        await obtenerPool();


    const resultadoPerfil =
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

                    id_perfil,
                    departamento,
                    provincia,
                    distrito,
                    carrera_interes,
                    nivel_estudio,
                    institucion,
                    fecha_actualizacion

                FROM dbo.PerfilesUsuario

                WHERE
                    id_usuario = @idUsuario
                `
            );


    return {

        ...usuario,

        perfil:
            resultadoPerfil.recordset[0] ||
            null

    };

}


/* =========================================================
   EXPORTAR
========================================================= */

module.exports = {

    registrarUsuario,

    iniciarSesion,

    obtenerUsuarioActual,

    buscarPorEmail,

    buscarPorId

};
