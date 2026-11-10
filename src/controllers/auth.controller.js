/* =========================================================
   EDUPERÚ SOA
   AUTH CONTROLLER - SEGURIDAD FINAL
========================================================= */

const authService =
    require(
        "../services/auth.service"
    );


/* =========================================================
   MANEJAR ERRORES

   Los errores esperados conservan su mensaje.
   Los errores internos no exponen detalles de SQL Server,
   JWT, rutas del sistema ni configuración.
========================================================= */

function responderError(
    res,
    error
) {

    const statusCode =
        Number(
            error?.statusCode
        ) ||
        500;


    if (
        statusCode >= 500
    ) {

        console.error(
            "[AuthenticationService] Error interno:",
            error
        );

    }


    return res
        .status(
            statusCode
        )
        .json({

            success:
                false,

            servicio:
                "AuthenticationService",

            mensaje:
                statusCode >= 500
                    ? "Ocurrió un error interno en el servicio de autenticación."
                    : error.message

        });

}


/* =========================================================
   REGISTER
========================================================= */

async function registrar(
    req,
    res
) {

    try {

        const resultado =
            await authService
                .registrarUsuario(
                    req.body
                );


        return res
            .status(201)
            .json({

                success:
                    true,

                servicio:
                    "AuthenticationService",

                mensaje:
                    "Usuario registrado correctamente.",

                resultado

            });

    } catch (error) {

        return responderError(
            res,
            error
        );

    }

}


/* =========================================================
   LOGIN
========================================================= */

async function login(
    req,
    res
) {

    try {

        const resultado =
            await authService
                .iniciarSesion(
                    req.body
                );


        /*
           Evita que navegadores o proxies compartidos
           almacenen respuestas que contienen JWT.
        */

        res.set(
            "Cache-Control",
            "no-store"
        );


        return res.json({

            success:
                true,

            servicio:
                "AuthenticationService",

            mensaje:
                "Sesión iniciada correctamente.",

            resultado

        });

    } catch (error) {

        return responderError(
            res,
            error
        );

    }

}


/* =========================================================
   ME
========================================================= */

async function me(
    req,
    res
) {

    try {

        const usuario =
            await authService
                .obtenerUsuarioActual(
                    req.usuario.id
                );


        res.set(
            "Cache-Control",
            "no-store"
        );


        return res.json({

            success:
                true,

            servicio:
                "AuthenticationService",

            resultado:
                usuario

        });

    } catch (error) {

        return responderError(
            res,
            error
        );

    }

}


/* =========================================================
   ADMIN TEST
========================================================= */

function adminTest(
    req,
    res
) {

    return res.json({

        success:
            true,

        servicio:
            "AuthenticationService",

        mensaje:
            "Acceso administrativo autorizado.",

        usuario:
            req.usuario

    });

}


/* =========================================================
   EXPORTAR
========================================================= */

module.exports = {

    registrar,

    login,

    me,

    adminTest

};
