const regionService =
    require(
        "../services/region.service"
    );


// ======================================================
// LISTAR
// ======================================================

async function listar(req, res) {

    try {

        const resultado =
            await regionService
                .listarRegiones();


        res.json({

            proyecto:
                "EduPeruSOA",

            resultado:
                resultado

        });

    } catch (error) {

        res.status(500).json({

            success:
                false,

            mensaje:
                "No se pudieron obtener las regiones.",

            detalle:
                error.message

        });

    }

}


// ======================================================
// BUSCAR
// ======================================================

async function buscar(req, res) {

    try {

        const texto =
            req.query.texto || "";


        if (!texto.trim()) {

            return res
                .status(400)
                .json({

                    success:
                        false,

                    mensaje:
                        "Debe ingresar un texto de búsqueda."

                });

        }


        const resultado =
            await regionService
                .buscarRegiones(
                    texto
                );


        res.json({

            proyecto:
                "EduPeruSOA",

            resultado:
                resultado

        });

    } catch (error) {

        res.status(500).json({

            success:
                false,

            mensaje:
                "No se pudo realizar la búsqueda territorial.",

            detalle:
                error.message

        });

    }

}


// ======================================================
// DETALLE
// ======================================================

async function obtener(req, res) {

    try {

        const resultado =
            await regionService
                .obtenerRegion(
                    req.params.codigo
                );


        res.json({

            proyecto:
                "EduPeruSOA",

            resultado:
                resultado

        });

    } catch (error) {

        res.status(404).json({

            success:
                false,

            mensaje:
                "No se encontró la región.",

            detalle:
                error.message

        });

    }

}


// ======================================================
// EXPORTAR
// ======================================================

module.exports = {

    listar,

    buscar,

    obtener

};