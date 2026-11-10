/* =========================================================
   EDUPERÚ SOA
   ALERTA CONTROLLER
========================================================= */

const alertaService =
    require(
        "../services/alerta.service"
    );


function responderError(
    res,
    error
) {

    console.error(
        "AlertaService:",
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
                "AlertaService",

            mensaje:
                error.message ||
                "Ocurrió un error en AlertaService."

        });

}


/* =========================================================
   LISTAR
========================================================= */

async function listarAlertas(
    req,
    res
) {

    try {

        const alertas =
            await alertaService
                .listarAlertas(
                    req.usuario.id
                );


        return res.json({

            success:
                true,

            servicio:
                "AlertaService",

            total:
                alertas.length,

            resultado:
                alertas

        });

    } catch (error) {

        return responderError(
            res,
            error
        );

    }

}


/* =========================================================
   OBTENER
========================================================= */

async function obtenerAlerta(
    req,
    res
) {

    try {

        const alerta =
            await alertaService
                .obtenerAlerta(
                    req.usuario.id,
                    req.params.id
                );


        return res.json({

            success:
                true,

            servicio:
                "AlertaService",

            resultado:
                alerta

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

async function crearAlerta(
    req,
    res
) {

    try {

        const alerta =
            await alertaService
                .crearAlerta(
                    req.usuario.id,
                    req.body
                );


        return res
            .status(201)
            .json({

                success:
                    true,

                servicio:
                    "AlertaService",

                mensaje:
                    "Alerta creada correctamente.",

                resultado:
                    alerta

            });

    } catch (error) {

        return responderError(
            res,
            error
        );

    }

}


/* =========================================================
   ACTUALIZAR
========================================================= */

async function actualizarAlerta(
    req,
    res
) {

    try {

        const alerta =
            await alertaService
                .actualizarAlerta(
                    req.usuario.id,
                    req.params.id,
                    req.body
                );


        return res.json({

            success:
                true,

            servicio:
                "AlertaService",

            mensaje:
                "Alerta actualizada correctamente.",

            resultado:
                alerta

        });

    } catch (error) {

        return responderError(
            res,
            error
        );

    }

}


/* =========================================================
   CAMBIAR ESTADO
========================================================= */

async function cambiarEstado(
    req,
    res
) {

    try {

        if (
            typeof req.body.activa !==
            "boolean"
        ) {

            return res
                .status(400)
                .json({

                    success:
                        false,

                    servicio:
                        "AlertaService",

                    mensaje:
                        "El campo activa debe ser true o false."

                });

        }


        const alerta =
            await alertaService
                .cambiarEstado(

                    req.usuario.id,

                    req.params.id,

                    req.body.activa

                );


        return res.json({

            success:
                true,

            servicio:
                "AlertaService",

            mensaje:
                alerta.activa
                    ? "Alerta activada correctamente."
                    : "Alerta desactivada correctamente.",

            resultado:
                alerta

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

async function eliminarAlerta(
    req,
    res
) {

    try {

        const resultado =
            await alertaService
                .eliminarAlerta(

                    req.usuario.id,

                    req.params.id

                );


        return res.json({

            success:
                true,

            servicio:
                "AlertaService",

            mensaje:
                "Alerta eliminada correctamente.",

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