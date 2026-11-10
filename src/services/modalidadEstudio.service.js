const integracionPronabec =
    require("./integracionPronabec.service");

const {
    extraerArreglo,
    valorTexto,
    normalizarTexto
} =
    require("./catalogoDerivado.helper");


const RECURSO =
    "CarrerasElegiblesNacional";


function modalidadValida(
    valor
) {

    const normalizada =
        normalizarTexto(
            valor
        );


    if (!normalizada) {
        return false;
    }


    const descartadas = [

        "NO HABILITADO",
        "NO APLICA",
        "NO CORRESPONDE",
        "SIN MODALIDAD",
        "SIN INFORMACION",
        "NO DISPONIBLE"

    ];


    return !descartadas.some(
        texto =>
            normalizada.includes(
                texto
            )
    );

}


async function listarModalidades() {

    try {

        const respuesta =
            await integracionPronabec
                .consultarFuenteOficial(
                    RECURSO
                );


        const registros =
            extraerArreglo(
                respuesta
            );


        const mapa =
            new Map();


        registros.forEach(
            registro => {

                const nombre =
                    valorTexto(
                        registro,
                        [
                            "MODALIDAD",
                            "MODALIDAD_ESTUDIO",
                            "TIPO_MODALIDAD",
                            "MODALIDAD_ACADEMICA",
                            "MODALIDAD_ACADÉMICA"
                        ]
                    );


                if (
                    !modalidadValida(
                        nombre
                    )
                ) {

                    return;

                }


                const clave =
                    normalizarTexto(
                        nombre
                    );


                if (
                    !mapa.has(
                        clave
                    )
                ) {

                    mapa.set(
                        clave,
                        {
                            nombre,

                            ejemplosCarrera:
                                []
                        }
                    );

                }


                const item =
                    mapa.get(
                        clave
                    );


                const carrera =
                    valorTexto(
                        registro,
                        [
                            "CARRERA",
                            "NOMBRE_CARRERA",
                            "CARRERA_ELEGIBLE"
                        ]
                    );


                if (
                    carrera &&
                    item.ejemplosCarrera.length <
                    3
                ) {

                    const yaExiste =
                        item.ejemplosCarrera
                            .some(
                                actual =>
                                    normalizarTexto(
                                        actual
                                    ) ===
                                    normalizarTexto(
                                        carrera
                                    )
                            );


                    if (!yaExiste) {

                        item.ejemplosCarrera.push(
                            carrera
                        );

                    }

                }

            }
        );


        const datos =
            [
                ...mapa.values()
            ]
                .sort(
                    (
                        a,
                        b
                    ) =>
                        a.nombre.localeCompare(
                            b.nombre,
                            "es"
                        )
                )
                .map(
                    (
                        item,
                        indice
                    ) => ({
                        id:
                            indice + 1,

                        ...item
                    })
                );


        return {

            servicio:
                "ModalidadEstudioService",

            tipo:
                "Servicio de Catálogo",

            fuente:
                respuesta.fuente,

            fuenteOficial:
                true,

            disponible:
                true,

            urlFuente:
                respuesta.urlFuente,

            derivadoDe:
                "Convocatorias - Carreras elegibles nacional - PRONABEC",

            total:
                datos.length,

            datos,

            observacion:
                datos.length ===
                0
                    ? "La publicación oficial consultada no contiene modalidades válidas identificables."
                    : null

        };

    } catch (error) {

        return {

            servicio:
                "ModalidadEstudioService",

            tipo:
                "Servicio de Catálogo",

            fuente:
                "PRONABEC - Fuentes oficiales",

            fuenteOficial:
                true,

            disponible:
                false,

            motivo:
                error.message,

            total:
                0,

            datos:
                []

        };

    }

}


module.exports = {

    listarModalidades

};
