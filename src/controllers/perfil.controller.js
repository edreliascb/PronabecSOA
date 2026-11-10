/* =========================================================
   EDUPERÚ SOA
   PERFIL CONTROLLER
========================================================= */

const perfilService =
    require(
        "../services/perfil.service"
    );


/* =========================================================
   OBTENER PERFIL
========================================================= */

async function obtenerPerfil(
    req,
    res
) {

    try {

        const perfil =
            await perfilService
                .obtenerPerfil(
                    req.usuario.id
                );


        return res.json({

            success:
                true,

            servicio:
                "PerfilUsuarioService",

            resultado:
                perfil

        });

    } catch (error) {

        return res
            .status(
                error.statusCode ||
                500
            )
            .json({

                success:
                    false,

                servicio:
                    "PerfilUsuarioService",

                mensaje:
                    error.message

            });

    }

}


/* =========================================================
   GUARDAR PERFIL
========================================================= */

async function guardarPerfil(
    req,
    res
) {

    try {

        const perfil =
            await perfilService
                .guardarPerfil(
                    req.usuario.id,
                    req.body
                );


        return res.json({

            success:
                true,

            servicio:
                "PerfilUsuarioService",

            mensaje:
                "Perfil actualizado correctamente.",

            resultado:
                perfil

        });

    } catch (error) {

        return res
            .status(
                error.statusCode ||
                500
            )
            .json({

                success:
                    false,

                servicio:
                    "PerfilUsuarioService",

                mensaje:
                    error.message

            });

    }

}


/* =========================================================
   EXPORTAR
========================================================= */

module.exports = {

    obtenerPerfil,

    guardarPerfil

};