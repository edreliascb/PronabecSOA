/* =========================================================
   EDUPERÚ SOA
   UTILIDADES PARA SERVICIOS EMPRESARIALES 25 - 30
========================================================= */

function normalizarTexto(
    texto
) {

    return String(
        texto ??
        ""
    )
        .trim()
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[^a-zA-Z0-9]+/g,
            " "
        )
        .trim()
        .toUpperCase();

}


function normalizarClave(
    texto
) {

    return normalizarTexto(
        texto
    )
        .replace(
            /\s+/g,
            ""
        );

}


function extraerArreglo(
    respuesta
) {

    if (
        Array.isArray(
            respuesta
        )
    ) {

        return respuesta;

    }


    if (
        !respuesta ||
        typeof respuesta !==
        "object"
    ) {

        return [];

    }


    const preferidas = [

        "datos",
        "data",
        "rows",
        "records",
        "items",
        "resultado",
        "result"

    ];


    for (
        const clave
        of preferidas
    ) {

        const valor =
            respuesta[clave];


        if (
            Array.isArray(
                valor
            )
        ) {

            return valor;

        }


        if (
            valor &&
            typeof valor ===
            "object"
        ) {

            const interno =
                extraerArreglo(
                    valor
                );


            if (
                interno.length > 0
            ) {

                return interno;

            }

        }

    }


    for (
        const valor
        of Object.values(
            respuesta
        )
    ) {

        if (
            Array.isArray(
                valor
            )
        ) {

            return valor;

        }


        if (
            valor &&
            typeof valor ===
            "object"
        ) {

            const interno =
                extraerArreglo(
                    valor
                );


            if (
                interno.length > 0
            ) {

                return interno;

            }

        }

    }


    return [];

}


function obtenerCampo(
    objeto,
    aliases = []
) {

    if (
        !objeto ||
        typeof objeto !==
        "object"
    ) {

        return null;

    }


    const mapa =
        new Map(
            Object.keys(
                objeto
            )
                .map(
                    clave => [
                        normalizarClave(
                            clave
                        ),
                        clave
                    ]
                )
        );


    for (
        const alias
        of aliases
    ) {

        const real =
            mapa.get(
                normalizarClave(
                    alias
                )
            );


        if (
            real !==
            undefined
        ) {

            const valor =
                objeto[real];


            if (
                valor !==
                null &&
                valor !==
                undefined &&
                String(
                    valor
                )
                    .trim() !==
                ""
            ) {

                return valor;

            }

        }

    }


    return null;

}


function valorTexto(
    objeto,
    aliases = []
) {

    const valor =
        obtenerCampo(
            objeto,
            aliases
        );


    if (
        valor ===
        null ||
        valor ===
        undefined
    ) {

        return null;

    }


    if (
        typeof valor ===
        "object"
    ) {

        try {

            return JSON.stringify(
                valor
            );

        } catch {

            return String(
                valor
            );

        }

    }


    return String(
        valor
    )
        .trim() ||
        null;

}


function contieneTexto(
    objeto,
    texto
) {

    const buscado =
        normalizarTexto(
            texto
        );


    if (!buscado) {

        return true;

    }


    let contenido;


    try {

        contenido =
            JSON.stringify(
                objeto
            );

    } catch {

        contenido =
            String(
                objeto ??
                ""
            );

    }


    return normalizarTexto(
        contenido
    )
        .includes(
            buscado
        );

}


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


module.exports = {

    normalizarTexto,

    normalizarClave,

    extraerArreglo,

    obtenerCampo,

    valorTexto,

    contieneTexto,

    crearError

};
