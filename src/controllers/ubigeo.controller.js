const ubigeoService =
    require(
        "../services/ubigeo.service"
    );


// ======================================================
// RESUMEN
// ======================================================

async function resumen(req, res) {

    try {

        const resultado =
            await ubigeoService
                .obtenerResumen();


        res.json({

            proyecto:
                "EduPeruSOA",

            resultado

        });

    } catch (error) {

        responderError(
            res,
            error
        );

    }

}


// ======================================================
// DEPARTAMENTOS
// ======================================================

async function departamentos(
    req,
    res
) {

    try {

        const resultado =
            await ubigeoService
                .listarDepartamentos();


        res.json({

            proyecto:
                "EduPeruSOA",

            resultado

        });

    } catch (error) {

        responderError(
            res,
            error
        );

    }

}


// ======================================================
// PROVINCIAS
// ======================================================

async function provincias(
    req,
    res
) {

    try {

        const resultado =
            await ubigeoService
                .listarProvincias(
                    req.params.departamento
                );


        res.json({

            proyecto:
                "EduPeruSOA",

            resultado

        });

    } catch (error) {

        res
            .status(404)
            .json({

                success:
                    false,

                mensaje:
                    "No se pudieron obtener las provincias.",

                detalle:
                    error.message

            });

    }

}


// ======================================================
// DISTRITOS
// ======================================================

async function distritos(
    req,
    res
) {

    try {

        const resultado =
            await ubigeoService
                .listarDistritos(
                    req.params.provincia
                );


        res.json({

            proyecto:
                "EduPeruSOA",

            resultado

        });

    } catch (error) {

        res
            .status(404)
            .json({

                success:
                    false,

                mensaje:
                    "No se pudieron obtener los distritos.",

                detalle:
                    error.message

            });

    }

}


// ======================================================
// BUSCAR
// ======================================================

async function buscar(
    req,
    res
) {

    try {

        const texto =
            req.query.texto || "";


        if (
            !texto.trim()
        ) {

            return res
                .status(400)
                .json({

                    success:
                        false,

                    mensaje:
                        "Debe ingresar un texto o código de búsqueda."

                });

        }


        const resultado =
            await ubigeoService
                .buscar(
                    texto
                );


        res.json({

            proyecto:
                "EduPeruSOA",

            resultado

        });

    } catch (error) {

        responderError(
            res,
            error
        );

    }

}


// ======================================================
// DETALLE
// ======================================================

async function obtener(
    req,
    res
) {

    try {

        const resultado =
            await ubigeoService
                .obtenerPorCodigo(
                    req.params.codigo
                );


        res.json({

            proyecto:
                "EduPeruSOA",

            resultado

        });

    } catch (error) {

        res
            .status(404)
            .json({

                success:
                    false,

                mensaje:
                    "No se encontró el código territorial.",

                detalle:
                    error.message

            });

    }

}


// ======================================================
// ERROR
// ======================================================

function responderError(
    res,
    error
) {

    res
        .status(500)
        .json({

            success:
                false,

            mensaje:
                "Ocurrió un error en UbigeoService.",

            detalle:
                error.message

        });

}


// ======================================================
// EXPORTAR
// ======================================================

module.exports = {

    resumen,

    departamentos,

    provincias,

    distritos,

    buscar,

    obtener

};