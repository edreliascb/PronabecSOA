/* =========================================================
   EDUPERÚ SOA
   FAVORITO CONTROLLER
========================================================= */

const favoritoService =
    require(
        "../services/favorito.service"
    );


/* =========================================================
   LISTAR
========================================================= */

async function listarFavoritos(
    req,
    res
) {

    try {

        const favoritos =
            await favoritoService
                .listarFavoritos(
                    req.usuario.id
                );


        return res.json({

            success:
                true,

            servicio:
                "FavoritoService",

            total:
                favoritos.length,

            resultado:
                favoritos

        });

    } catch (error) {

        return responderError(
            res,
            error
        );

    }

}


/* =========================================================
   OBTENER UNO
========================================================= */

async function obtenerFavorito(
    req,
    res
) {

    try {

        const favorito =
            await favoritoService
                .obtenerFavorito(
                    req.usuario.id,
                    req.params.id
                );


        return res.json({

            success:
                true,

            servicio:
                "FavoritoService",

            resultado:
                favorito

        });

    } catch (error) {

        return responderError(
            res,
            error
        );

    }

}


/* =========================================================
   CREAR
========================================================= */

async function crearFavorito(
    req,
    res
) {

    try {

        const resultado =
            await favoritoService
                .crearFavorito(
                    req.usuario.id,
                    req.body
                );


        if (
            resultado.duplicado
        ) {

            return res
                .status(200)
                .json({

                    success:
                        true,

                    servicio:
                        "FavoritoService",

                    mensaje:
                        "La oportunidad ya estaba guardada en favoritos.",

                    duplicado:
                        true,

                    resultado:
                        resultado.favorito

                });

        }


        return res
            .status(201)
            .json({

                success:
                    true,

                servicio:
                    "FavoritoService",

                mensaje:
                    "Favorito guardado correctamente.",

                duplicado:
                    false,

                resultado:
                    resultado.favorito

            });

    } catch (error) {

        return responderError(
            res,
            error
        );

    }

}


/* =========================================================
   ELIMINAR
========================================================= */

async function eliminarFavorito(
    req,
    res
) {

    try {

        const resultado =
            await favoritoService
                .eliminarFavorito(
                    req.usuario.id,
                    req.params.id
                );


        return res.json({

            success:
                true,

            servicio:
                "FavoritoService",

            mensaje:
                "Favorito eliminado correctamente.",

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
   ELIMINAR POR RECURSO
========================================================= */

async function eliminarPorRecurso(
    req,
    res
) {

    try {

        const resultado =
            await favoritoService
                .eliminarPorRecurso(

                    req.usuario.id,

                    req.params.tipo,

                    req.params.recursoId

                );


        return res.json({

            success:
                true,

            servicio:
                "FavoritoService",

            mensaje:
                "Favorito eliminado correctamente.",

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
   ERROR
========================================================= */

function responderError(
    res,
    error
) {

    console.error(
        "FavoritoService:",
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
                "FavoritoService",

            mensaje:
                error.message ||
                "Ocurrió un error en FavoritoService."

        });

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