/* =========================================================
   EDUPERÚ SOA
   AUTH MIDDLEWARE - SEGURIDAD FINAL
========================================================= */

const jwt =
    require(
        "jsonwebtoken"
    );

const authService =
    require(
        "../services/auth.service"
    );


const JWT_ISSUER =
    "EduPeruSOA";

const JWT_AUDIENCE =
    "EduPeruWeb";


/* =========================================================
   RESPUESTAS
========================================================= */

function responderNoAutenticado(
    res,
    mensaje = "Se requiere autenticación."
) {

    return res
        .status(401)
        .json({

            success:
                false,

            servicio:
                "AuthenticationService",

            mensaje

        });

}


function responderNoAutorizado(
    res,
    mensaje = "No tienes permisos para acceder a este recurso."
) {

    return res
        .status(403)
        .json({

            success:
                false,

            servicio:
                "AuthenticationService",

            mensaje

        });

}


/* =========================================================
   AUTENTICAR TOKEN

   IMPORTANTE:
   No basta con confiar en el rol guardado dentro del JWT.
   Después de verificar la firma, se consulta el usuario
   actual en SQL Server para comprobar:
   - que siga existiendo;
   - que siga activo;
   - cuál es su rol actual.
========================================================= */

async function autenticarToken(
    req,
    res,
    next
) {

    const authorization =
        String(
            req.headers.authorization ||
            ""
        )
            .trim();


    if (
        !authorization ||
        !/^Bearer\s+/i.test(
            authorization
        )
    ) {

        return responderNoAutenticado(
            res
        );

    }


    const token =
        authorization
            .replace(
                /^Bearer\s+/i,
                ""
            )
            .trim();


    if (!token) {

        return responderNoAutenticado(
            res,
            "El token de acceso está vacío."
        );

    }


    const jwtSecret =
        String(
            process.env.JWT_SECRET ||
            ""
        );


    if (
        jwtSecret.length < 32
    ) {

        console.error(
            "[AuthenticationService] JWT_SECRET no está configurado correctamente."
        );


        return res
            .status(500)
            .json({

                success:
                    false,

                servicio:
                    "AuthenticationService",

                mensaje:
                    "El servicio de autenticación no está disponible temporalmente."

            });

    }


    try {

        const payload =
            jwt.verify(
                token,
                jwtSecret,
                {
                    algorithms:
                        ["HS256"],

                    issuer:
                        JWT_ISSUER,

                    audience:
                        JWT_AUDIENCE
                }
            );


        const idUsuario =
            Number(
                payload.sub
            );


        if (
            !Number.isInteger(
                idUsuario
            ) ||
            idUsuario <= 0
        ) {

            return responderNoAutenticado(
                res,
                "El token de acceso no contiene un usuario válido."
            );

        }


        /*
           Revalidación contra SQL Server.
           Esto hace efectiva inmediatamente una desactivación
           o un cambio de rol, aunque el JWT aún no haya expirado.
        */

        const usuarioActual =
            await authService
                .buscarPorId(
                    idUsuario
                );


        if (!usuarioActual) {

            return responderNoAutenticado(
                res,
                "La cuenta asociada al token ya no existe."
            );

        }


        if (
            !Boolean(
                usuarioActual.activo
            )
        ) {

            return responderNoAutorizado(
                res,
                "La cuenta se encuentra desactivada."
            );

        }


        req.usuario = {

            id:
                Number(
                    usuarioActual.id_usuario
                ),

            email:
                usuarioActual.email,

            rol:
                String(
                    usuarioActual.rol ||
                    ""
                )
                    .trim()
                    .toUpperCase()

        };


        return next();

    } catch (error) {

        if (
            error?.name ===
            "TokenExpiredError"
        ) {

            return responderNoAutenticado(
                res,
                "La sesión ha expirado. Inicia sesión nuevamente."
            );

        }


        if (
            error?.name ===
            "JsonWebTokenError" ||
            error?.name ===
            "NotBeforeError"
        ) {

            return responderNoAutenticado(
                res,
                "Token inválido."
            );

        }


        console.error(
            "[AuthenticationService] Error verificando sesión:",
            error.message
        );


        return res
            .status(500)
            .json({

                success:
                    false,

                servicio:
                    "AuthenticationService",

                mensaje:
                    "No fue posible validar la sesión."

            });

    }

}


/* =========================================================
   AUTORIZAR ROLES
========================================================= */

function autorizarRoles(
    ...rolesPermitidos
) {

    const roles =
        rolesPermitidos
            .map(
                rol =>
                    String(
                        rol ||
                        ""
                    )
                        .trim()
                        .toUpperCase()
            )
            .filter(Boolean);


    return (
        req,
        res,
        next
    ) => {

        if (!req.usuario) {

            return responderNoAutenticado(
                res,
                "Usuario no autenticado."
            );

        }


        const rolActual =
            String(
                req.usuario.rol ||
                ""
            )
                .trim()
                .toUpperCase();


        if (
            !roles.includes(
                rolActual
            )
        ) {

            return responderNoAutorizado(
                res
            );

        }


        return next();

    };

}


/* =========================================================
   EXPORTAR
========================================================= */

module.exports = {

    autenticarToken,

    autorizarRoles

};
