/* =========================================================
   EDUPERÚ SOA
   ADMIN CONTROLLER
========================================================= */

const adminService =
    require(
        "../services/admin.service"
    );


function responderError(
    res,
    error
) {

    console.error(
        "AdminService:",
        error.message
    );


    return res
        .status(
            error.statusCode ||
            500
        )
        .json({

            success:
                false,

            servicio:
                "AdminService",

            mensaje:
                error.message ||
                "Ocurrió un error en AdminService."

        });

}


/* =========================================================
   RESUMEN
========================================================= */

async function obtenerResumen(
    req,
    res
) {

    try {

        const resultado =
            await adminService
                .obtenerResumen();


        return res.json({

            success:
                true,

            servicio:
                "AdminService",

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
   USUARIOS
========================================================= */

async function listarUsuarios(
    req,
    res
) {

    try {

        const usuarios =
            await adminService
                .listarUsuarios();


        return res.json({

            success:
                true,

            servicio:
                "AdminService",

            total:
                usuarios.length,

            resultado:
                usuarios

        });

    } catch (error) {

        return responderError(
            res,
            error
        );

    }

}


/* =========================================================
   ESTADO DE USUARIO
========================================================= */

async function cambiarEstadoUsuario(
    req,
    res
) {

    try {

        if (
            typeof req.body.activo !==
            "boolean"
        ) {

            return res
                .status(400)
                .json({

                    success:
                        false,

                    servicio:
                        "AdminService",

                    mensaje:
                        "El campo activo debe ser true o false."

                });

        }


        const usuario =
            await adminService
                .cambiarEstadoUsuario(

                    req.usuario.id,

                    req.params.id,

                    req.body.activo

                );


        return res.json({

            success:
                true,

            servicio:
                "AdminService",

            mensaje:
                usuario.activo
                    ? "Usuario activado correctamente."
                    : "Usuario desactivado correctamente.",

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


module.exports = {

    obtenerResumen,

    listarUsuarios,

    cambiarEstadoUsuario

};
